"""Build the JSON data files for the research website.

Reads aggregated project files (never microdata) and writes Website/data/*.json.
Run from anywhere:  python3 Website/tools/build_data.py

Outputs
  bins.json         pooled LTV shares for every pre/post year subset (no counts, no totals)
  checks.json       IO share and normalized mortgage rate by bin, pooled pre vs post
  model.json        model histograms, value functions, calibration loops
  published.json    hand-transcribed estimates from the paper's tables
"""
import itertools
import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]            # .../AmortRequirement
OUT = ROOT / "Website" / "data"
OUT.mkdir(parents=True, exist_ok=True)
MD = ROOT / "ProjectCode" / "ModelData"
RB = MD / "Robustness"

PRE_YEARS = [2011, 2012, 2013, 2014, 2015]
POST_YEARS = [2016, 2017, 2018]
# Estimation samples as in 3_1_bunching50/70_previousyears.do (drop if ltv > hi | ltv < lo)
SAMPLES = {"50": (20.0, 65.0), "70": (55.0, 80.0)}


def dump(name, obj):
    path = OUT / name
    path.write_text(json.dumps(obj, separators=(",", ":")))
    print(f"wrote {path.name:14s} {path.stat().st_size / 1024:6.1f} KB")


def subsets(years):
    for k in range(1, len(years) + 1):
        for combo in itertools.combinations(years, k):
            yield list(combo)


# ---------------------------------------------------------------------------
# Empirical bins
# ---------------------------------------------------------------------------
raw = pd.read_csv(ROOT / "ProjectCode" / "FinalData" / "nr_hh_by_year_ltv_bins.csv", sep=";")
raw = raw.rename(columns={"lower_ltv_bin": "lo"})


def pooled_shares(years, lo, hi):
    """Percent of loans per 0.5pp bin (lower edge in [lo, hi]), pooled over years by counts."""
    s = raw[raw.year.isin(years) & raw.lo.between(lo, hi)]
    c = s.groupby("lo").nr_hh.sum()
    c = c.reindex(np.arange(lo, hi + 0.25, 0.5), fill_value=0)
    return (100 * c / c.sum()).round(4).tolist()


bins = {"note": "Percent of loans in each [a, a+0.5) LTV bin within the estimation sample, "
                "pooled over the listed years. Derived from the FI Mortgage Survey; no counts.",
        "thresholds": {}}
for t, (lo, hi) in SAMPLES.items():
    edges = np.arange(lo, hi + 0.25, 0.5).tolist()
    bins["thresholds"][t] = {
        "lo": lo, "hi": hi, "edges": edges,
        "pre": {",".join(map(str, y)): pooled_shares(y, lo, hi) for y in subsets(PRE_YEARS)},
        "post": {",".join(map(str, y)): pooled_shares(y, lo, hi) for y in subsets(POST_YEARS)},
    }
dump("bins.json", bins)


# Estimator identical to the do-file, applied to the public bins (validation printout)
def estimate(pre, post, edges, T, L, U, w=0.5):
    e = np.array(edges); pre = np.array(pre); post = np.array(post); d = post - pre
    inB = (e >= L) & (e <= T)
    inM = (e > T) & (e <= U)
    B = d[inB].sum(); M = d[inM].sum(); cf = pre[inB].sum()
    dltv = B / cf * inB.sum() * w
    a0 = 0.0 if T == 50 else 0.01
    astar = a0 + 0.01 + 0.01 * T / dltv
    el = (dltv / T) / (astar - a0)
    return B, M, dltv, el


for t, L, U in [("50", 48.5, 51.5), ("70", 68.5, 71.5)]:
    th = bins["thresholds"][t]
    r = estimate(th["pre"]["2011,2012,2013,2014,2015"], th["post"]["2016,2017,2018"], th["edges"], int(t), L, U)
    print(f"  live T={t}: B={r[0]:.2f} M={r[1]:.2f} dLTV={r[2]:.2f} e={r[3]:.2f}")

# Supply-side checks, pooled pre/post, bins 40-80, cells >= 20 loans
ck = raw[raw.lo.between(40, 79.5)].copy()
ck["rate_x_n"] = ck.interest_rate_mortgage * ck.nr_hh
yr_mean = ck.groupby("year").rate_x_n.sum() / ck.groupby("year").nr_hh.sum()
ck["rate_norm"] = ck.interest_rate_mortgage - ck.year.map(yr_mean) + yr_mean[2017]
ck["io_x_n"] = ck.am_interest_only * ck.nr_hh
checks = {"edges": np.arange(40, 79.75, 0.5).tolist(), "min_cell": 20,
          "note": "Pooled 2012-2015 (pre) and 2016-2018 (post). Rates normalized to the 2017 mean.",
          "series": {}}
for name, yrs in [("pre", [2012, 2013, 2014, 2015]), ("post", POST_YEARS)]:
    s = ck[ck.year.isin(yrs)].copy()
    s["rn_x_n"] = s.rate_norm * s.nr_hh
    g = s.groupby("lo").agg(n=("nr_hh", "sum"), io=("io_x_n", "sum"), rt=("rn_x_n", "sum"))
    g = g.reindex(checks["edges"])
    ok = g.n >= 20
    checks["series"][name] = {
        "io": [round(100 * v, 2) if k else None for v, k in zip(g.io / g.n, ok)],
        "rate": [round(v, 3) if k else None for v, k in zip(g.rt / g.n, ok)],
    }
dump("checks.json", checks)

# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
def ltv(path):
    return pd.read_csv(path).LTV.values * 100


def hist2(v):
    """2pp histogram 40-60, percent of loans in [40, 60] (as in the paper's figures)."""
    v = v[(v >= 40) & (v <= 60)]
    c, _ = np.histogram(v, bins=np.arange(40, 62, 2))
    return (100 * c / c.sum()).round(2).tolist()


def model_bm(v, base):
    """Model bunching as in 16_ModelResultsNew.do: sample 20-64, round to 2pp, B over 48-50, M over 51-52."""
    def pct(x):
        x = x[(x >= 20) & (x <= 64)]
        s = pd.Series(np.round(x / 2) * 2).value_counts()
        return 100 * s / s.sum()
    a, c = pct(v), pct(base)
    idx = sorted(set(a.index) | set(c.index))
    d = a.reindex(idx, fill_value=0) - c.reindex(idx, fill_value=0)
    return round(float(d[(d.index >= 48) & (d.index <= 50)].sum()), 2), \
        round(float(d[(d.index >= 51) & (d.index <= 52)].sum()), 2)


def vf(path):
    d = pd.read_csv(path)
    d = d[(d.LTV >= 0.40) & (d.LTV <= 0.60)]
    return {"ltv": (d.LTV * 100).round(2).tolist(), "ev": d.EV.round(5).tolist()}


base = ltv(MD / "Comparison_SwedenPsych_vs_SwedenNoPsych_LTVs_at_purchase_histogram_part2.csv")
flow = ltv(MD / "Comparison_SwedenDislikeAmort_vs_SwedenNoPsych_LTVs_at_purchase_histogram_part1.csv")
notch = ltv(MD / "Comparison_SwedenPsych_vs_SwedenNoPsych_LTVs_at_purchase_histogram_part1.csv")

model = {
    "hist_edges": list(range(40, 62, 2)),
    "mechanisms": {
        "baseline": {"hist": hist2(base), "vf": vf(MD / "plot_value_function_by_LTV_partial_Sweden_NoPsych.csv")},
        "notch": {"hist": hist2(notch), "vf": vf(MD / "plot_value_function_by_LTV_partial_Sweden_PsychCost.csv"),
                  "bm": model_bm(notch, base)},
        "flow": {"hist": hist2(flow), "vf": vf(MD / "plot_value_function_by_LTV_partial_Sweden_DislikeAmort.csv"),
                 "bm": model_bm(flow, base)},
        "io": {"vf": vf(MD / "plot_value_function_by_LTV_partial_IO.csv")},
    },
    "robustness": {},
}
print("  model flow B,M", model["mechanisms"]["flow"]["bm"], " notch B,M", model["mechanisms"]["notch"]["bm"])

ALTS = {"Alt1-Impatience": "Impatient households",
        "Alt2-SteeperIncome": "Steeper income profile",
        "Alt3-NoHEW": "No home equity withdrawal",
        "Alt4-HigherReturnLiquid": "High-return liquid asset (r = 0.06)",
        "Alt5-NegLiquidReturns": "Negative real liquid return"}
for key, label in ALTS.items():
    amort = ltv(RB / f"Comparison_{key}_LTVs_at_purchase_histogram_part1.csv")
    io = ltv(RB / f"Comparison_{key}_vs_IO_LTVs_at_purchase_histogram_part2.csv")
    model["robustness"][key] = {
        "label": label,
        "hist_amort": hist2(amort), "hist_io": hist2(io), "bm": model_bm(amort, io),
        "vf_amort": vf(RB / f"plot_value_function_by_LTV_partial_{key}.csv"),
        "vf_io": vf(RB / f"plot_value_function_by_LTV_partial_IO-{key}.csv"),
    }
    print(f"  {key:26s} B,M vs own IO = {model['robustness'][key]['bm']}")


def loop(path, col):
    d = pd.read_csv(path).drop_duplicates().sort_values(col)
    d = d.drop_duplicates(subset=[col])
    return {"k": d[col].tolist(), "B": d.B.round(3).tolist(), "M": d.M.round(3).tolist()}


model["calibration"] = {
    "note": "Model-implied excess mass B and missing mass M (negative = hole), SE specification. "
            "The one-off loop was run for 0.02-0.25; the paper's figure uses 0.35.",
    "flow": loop(MD / "Calibration_Loop1_SwedenSpec.csv", "kap_flow"),
    "oneoff": loop(MD / "Calibration_Loop2_SwedenSpec.csv", "kap_oneoff"),
}
dump("model.json", model)

# ---------------------------------------------------------------------------
# Published estimates (transcribed from main.tex / Appendix.tex / tables/*.tex)
# Each: B, M (negative = missing), dLTV, elasticity, with SEs; N households.
# ---------------------------------------------------------------------------
def est(B, Bse, M, Mse, d, dse, e, ese, n=None, **kw):
    r = {"B": [B, Bse], "M": [M, Mse], "dLTV": [d, dse], "e": [e, ese]}
    if n is not None:
        r["N"] = n
    r.update(kw)
    return r


published = {"groups": [
    {"id": "main", "title": "Main estimates", "source": "Table 1 (Appendix: summary of main estimates)", "rows": [
        dict(label="LTV = 50", T=50, L=48.5, U=51.5, **est(7.47, .31, -.83, .16, 2.57, .16, .25, .03, 35747)),
        dict(label="LTV = 70", T=70, L=68.5, U=71.5, **est(12.93, .38, -1.43, .20, 2.73, .12, .15, .01, 39946)),
    ]},
    {"id": "pti50", "title": "Distance from payment constraint, LTV = 50", "source": "Table 2", "rows": [
        dict(label="Near constraint (< 5,000 SEK)", T=50, **est(5.01, .49, -.49, .27, 1.98, .27, .15, .04, 13350)),
        dict(label="Intermediate", T=50, **est(10.17, .63, -.90, .32, 3.45, .34, .45, .09, 10471)),
        dict(label="Far from constraint (> 15,000 SEK)", T=50, **est(9.41, .70, -1.34, .32, 2.92, .30, .32, .06, 10182)),
    ]},
    {"id": "pti70", "title": "Distance from payment constraint, LTV = 70", "source": "Internet Appendix", "rows": [
        dict(label="Near constraint", T=70, **est(13.16, .58, -1.28, .32, 2.84, .20, .16, .02, 15949)),
        dict(label="Intermediate", T=70, **est(13.29, .71, -.94, .40, 2.92, .22, .17, .02, 12127)),
        dict(label="Far from constraint", T=70, **est(13.10, .96, -2.15, .42, 2.57, .24, .13, .02, 10242)),
    ]},
    {"id": "val50", "title": "Valuation method, LTV = 50", "source": "Table 3", "rows": [
        dict(label="Refinancer, internal valuation", T=50, **est(7.10, .34, -.81, .19, 2.44, .17, .23, .03, 28588)),
        dict(label="Refinancer, external valuation", T=50, **est(7.38, .88, -.81, .48, 2.89, .47, .32, .10, 4948)),
        dict(label="Home buyer, purchase price", T=50, **est(9.30, 1.46, -1.25, .76, 2.18, .56, .18, .09, 2211)),
    ]},
    {"id": "val70", "title": "Valuation method, LTV = 70", "source": "Internet Appendix", "rows": [
        dict(label="Refinancer, internal valuation", T=70, **est(12.88, .43, -1.38, .24, 2.72, .13, .15, .01, 30500)),
        dict(label="Refinancer, external valuation", T=70, **est(6.40, 1.05, -.53, .66, 1.17, .23, .03, .01, 5111)),
        dict(label="Home buyer, purchase price", T=70, **est(19.13, 1.01, -1.68, .54, 5.36, .63, .54, .12, 4335)),
    ]},
]}

# Window robustness (Internet Appendix): B, dLTV, e vary with L. M varies with U.
rob = {
    50: dict(L=[47.5, 48, 48.5, 49, 49.5], U=[50.5, 51, 51.5, 52, 52.5],
             B=[(8.00, .34), (7.92, .34), (7.47, .31), (7.12, .30), (6.43, .27)],
             d=[(3.05, .18), (2.91, .18), (2.57, .16), (2.26, .15), (1.80, .12)],
             e=[(.35, .04), (.32, .04), (.25, .03), (.19, .03), (.12, .02)],
             M=[(-.26, .09), (-.64, .14), (-.83, .16), (-.88, .20), (-1.10, .23)], N=35747),
    70: dict(L=[67.5, 68, 68.5, 69, 69.5], U=[70.5, 71, 71.5, 72, 72.5],
             B=[(13.82, .41), (13.43, .39), (12.93, .38), (12.28, .37), (10.75, .34)],
             d=[(3.36, .14), (3.06, .13), (2.73, .12), (2.29, .10), (1.75, .08)],
             e=[(.22, .02), (.18, .01), (.15, .01), (.10, .01), (.06, .01)],
             M=[(-.48, .11), (-.75, .16), (-1.43, .20), (-1.88, .23), (-2.50, .26)], N=39946),
}
for T, r in rob.items():
    rows = []
    for i in range(5):
        rows.append(dict(label=f"L = {r['L'][i]}, U = {r['U'][i]}" + (" (preferred)" if i == 2 else ""),
                         T=T, L=r["L"][i], U=r["U"][i], N=r["N"],
                         **est(*r["B"][i], *r["M"][i], *r["d"][i], *r["e"][i])))
    published["groups"].append({"id": f"win{T}", "title": f"Excluded window, LTV = {T} (0.5pp bins)",
                                "source": "Internet Appendix, robustness table", "rows": rows})

published["model"] = {
    "calibrated": {"flow": 0.08, "oneoff": 0.35, "B_flow": 7.53},
    "io_innovation": {"debt_flow": 33.4, "debt_noflow": 9.1, "share_flow": "over two-thirds"},
    "mwa": {"cols": ["Mortgage repaid", "Δ Net wealth", "Δ Liquid wealth", "MWA (full)", "MWA (a > 10,000)"],
            "rows": [
                {"label": "Bernstein and Koudijs (data)", "v": [2045.0, 2038.2, None, 0.997, 1.008]},
                {"label": "Baseline, no psychic cost", "v": [1292.57, 1106.99, -185.79, 0.856, 0.522]},
                {"label": "Baseline, flow disutility", "v": [2855.29, 2800.10, -55.19, 0.981, 0.914]},
                {"label": "High r, no psychic cost", "v": [4074.23, 574.20, -3500.04, 0.141, 0.081]},
                {"label": "High r, flow disutility", "v": [4343.68, 1969.15, -2374.52, 0.453, 0.435]},
            ]},
}
dump("published.json", published)

# Flat CSV of every published estimate, for download
lines = ["group,specification,threshold,B,B_se,M,M_se,dLTV,dLTV_se,elasticity,elasticity_se,N"]
for g in published["groups"]:
    for r in g["rows"]:
        lines.append(",".join(map(str, [g["title"].replace(",", ";"), r["label"].replace(",", ";"), r["T"],
                                        *r["B"], *r["M"], *r["dLTV"], *r["e"], r.get("N", "")])))
(OUT / "published_estimates.csv").write_text("\n".join(lines) + "\n")
print("wrote published_estimates.csv")
