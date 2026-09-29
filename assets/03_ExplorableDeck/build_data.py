#!/usr/bin/env python3
"""Gather every number the deck's charts draw into js/data.js.

Usage (from anywhere):
    python Presentation/03_ExplorableDeck/build_data.py

Reads the pipeline's tables of record in output/tables/ (the same CSVs that
10_paper_exhibits.do and 04_benchmark_comparison.do render into Writing/Tables/),
output/analysis_data/gps_data.csv, and the response histograms and
country-by-model cell means that docs/explorable/extract_data.py generated from
the collection (docs/explorable/js/responses.js). Writes js/data.js, which
defines window.DECK_DATA; js/lib.js exposes it as L.DATA.

No chart number is typed by hand. The few scalars the pipeline writes only to a
log (the H4/H5 estimates are in tab_main_singletons.csv; the UK equivalence
interval is the UK row of tab_eq1_country_fe.csv) are read from those files too.
The two quoted model answers are real responses from the main collection
(Gemini 3 Flash, Version B, Question 1, age 40), copied from
~/Dropbox (Personal)/FinancialAdvice_AI_Data/main/pilot_results.csv.

Re-run after any re-run of the Stata pipeline, then re-render the deck.
"""

import csv
import json
import os
import re


HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
T = os.path.join(ROOT, "output", "tables")
OUT = os.path.join(HERE, "js", "data.js")

LABEL = {
    "USA": "United States", "UK": "United Kingdom", "Sweden": "Sweden", "Finland": "Finland",
    "Germany": "Germany", "France": "France", "Spain": "Spain", "Japan": "Japan",
    "Brazil": "Brazil", "Australia": "Australia", "Canada": "Canada", "India": "India",
    "South Africa": "South Africa", "Netherlands": "Netherlands", "Italy": "Italy",
    "Switzerland": "Switzerland", "Poland": "Poland", "South Korea": "South Korea",
    "China": "China", "Mexico": "Mexico", "Turkey": "Turkey",
}
ENGLISH = {"USA", "UK", "Australia", "Canada", "India", "South Africa"}
# Prevailing mortgage rate above twice the prompted 4 percent at the filing date
# (sec:design). Read from tab_q2_country_fe.csv below; this is only a check.
PREMISE = {"Brazil", "India", "Mexico", "South Africa", "Turkey"}

MODEL_NAME = {
    "anthropic/claude-haiku-4.5": "Claude 4.5 Haiku", "anthropic/claude-sonnet-4.6": "Claude 4.6 Sonnet",
    "anthropic/claude-opus-4.6": "Claude 4.6 Opus", "anthropic/claude-opus-4.8": "Claude 4.8 Opus",
    "openai/gpt-5-mini": "GPT-5-mini", "openai/gpt-5.5": "GPT-5.5",
    "google/gemini-3-flash-preview": "Gemini 3 Flash", "google/gemini-3.5-flash": "Gemini 3.5 Flash",
    "google/gemini-3.1-pro-preview": "Gemini 3.1 Pro", "deepseek/deepseek-v4-flash": "DeepSeek V4 Flash",
    "deepseek/deepseek-v4-pro": "DeepSeek V4 Pro", "x-ai/grok-4.3": "Grok 4.3",
    "mistralai/mistral-medium-3-5": "Mistral Medium 3.5",
}


def rows(name):
    with open(os.path.join(T, name + ".csv"), newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def f(x, d=4):
    return None if x in ("", None) else round(float(x), d)


def by_country(name, key="country"):
    return {r[key]: r for r in rows(name)}


def pp(x, d=1):
    """A share difference in percentage points."""
    return None if x in ("", None) else round(100 * float(x), d)


def main():
    q1 = by_country("tab_summary_primary_cell")
    fe = by_country("tab_eq1_country_fe")
    q2fe = by_country("tab_q2_country_fe")
    q4fe = by_country("tab_q4_fraction_country_fe")
    bench = by_country("tab_benchmark_gaps")
    bq2 = by_country("tab_benchmark_gaps_q2")
    local = by_country("tab_text_local_prevalence")
    inst = by_country("tab_q4_instrument_shares")
    dec = by_country("tab_decomp_countryfe")
    q2m = by_country("tab_summary_q2_cell")
    gps = {r["country"]: r for r in csv.DictReader(open(os.path.join(ROOT, "output", "analysis_data", "gps_data.csv")))}

    resp_src = open(os.path.join(ROOT, "docs", "explorable", "js", "responses.js"), encoding="utf-8").read()
    resp = json.loads(resp_src[resp_src.index("{"): resp_src.rindex("}") + 1])

    def hist_mean(h):
        n = sum(h.values())
        return round(sum(int(k) * v for k, v in h.items()) / n / 100, 4)

    premise_found = {c for c, r in q2fe.items() if r.get("premise_group") == "1"}
    assert premise_found == PREMISE, f"premise group changed: {sorted(premise_found)}"

    countries = []
    for k, lab in LABEL.items():
        e = fe.get(k)
        countries.append({
            "key": k, "label": lab, "english": k in ENGLISH,
            # Q1, Version B, age 40: tab_summary_primary_cell.csv
            "mean": f(q1[k]["mean"], 3), "sd": f(q1[k]["sd"], 3), "n": int(q1[k]["n"]),
            # Eq. 1 country effects, pp vs. the U.S.: tab_eq1_country_fe.csv
            "fe": None if e is None else {"est": pp(e["estimate"]), "lo": pp(e["ci_lo"]), "hi": pp(e["ci_hi"]),
                                          "pw": f(e["p_wild"]), "ph": f(e["p_holm"]),
                                          "sig": float(e["p_holm"]) < 0.05, "sigRaw": float(e["p_wild"]) < 0.05},
            # Version C mean from the collection's own histograms (responses.js hist_c40)
            "meanC": hist_mean(resp["hist_c40"][k]),
            # Share of explanations naming local context, B and C: tab_text_local_prevalence.csv
            "localB": f(local[k]["share_b"]), "localC": f(local[k]["share_c"]),
            # Q2 and Q3 (the paper's Q3 is Q4 in the pipeline) country effects, pp
            "q2": None if k == "USA" else {"est": pp(q2fe[k]["estimate"]), "lo": pp(q2fe[k]["ci_lo"]),
                                           "hi": pp(q2fe[k]["ci_hi"]), "ph": f(q2fe[k]["p_holm"]),
                                           "sig": float(q2fe[k]["p_holm"]) < 0.05},
            "q3": None if k == "USA" else {"est": pp(q4fe[k]["estimate"]), "lo": pp(q4fe[k]["ci_lo"]),
                                           "hi": pp(q4fe[k]["ci_hi"]), "ph": f(q4fe[k]["p_holm"]),
                                           "sig": float(q4fe[k]["p_holm"]) < 0.05},
            "premise": k in PREMISE,
            # Merton benchmark, unhedged and hedged, and Benchmark I: tab_benchmark_gaps.csv
            "alphaS": f(bench[k]["alpha_s"], 4), "alphaH": f(bench[k]["alpha_s_hedged"], 4),
            "alphaI": f(bench[k]["alpha_i"], 4), "adviceBench": f(bench[k]["mean_advice"], 4),
            # Mortgage benchmark: tab_benchmark_gaps_q2.csv
            "q2mean": f(bq2[k]["mean_q2"], 3), "q2alpha": f(bq2[k]["alpha_q2"], 3),
            "q2lo": f(bq2[k]["alpha_q2_lo"], 3), "q2hi": f(bq2[k]["alpha_q2_hi"], 3),
            "q2gap": f(bq2[k]["gap_q2"], 3),
            # Primary instrument on the inflation question: tab_q4_instrument_shares.csv
            "inst": {"eq": f(inst[k]["shareequities"], 4) or 0, "linker": f(inst[k]["shareinfl_linked_bonds"], 4) or 0,
                     "gold": f(inst[k]["sharegold"], 4) or 0, "re": f(inst[k]["sharereal_estate"], 4) or 0,
                     "other": round((f(inst[k]["shareother"], 4) or 0) + (f(inst[k]["sharenot_reported"], 4) or 0), 4)},
            # Per-country decomposition, pp: tab_decomp_countryfe.csv (no U.S. row)
            "decomp": None if k not in dec else {"name": pp(dec[k]["name_comp"]), "lang": pp(dec[k]["lang_comp"]),
                                                 "local": pp(dec[k]["local_comp"]), "total": pp(dec[k]["total_cvus"])},
            # GPS risk-taking and S&P FinLit: output/analysis_data/gps_data.csv
            "risk": f(gps[k]["risk_taking"], 3), "finlit": f(gps[k]["finlit"], 2),
        })

    models = [{"id": r["model"], "name": MODEL_NAME[r["model"]], "vendor": r["vendor"],
               "mean": f(r["mean"], 3), "sd": f(r["sd"], 3)} for r in rows("tab_summary_by_model")]

    vq = {r["question"]: r for r in rows("tab_variance_decomposition_byq")}
    variance = {q_out: {"model": pp(vq[q]["sh_model"]), "country": pp(vq[q]["sh_country"]),
                        "inter": pp(vq[q]["sh_inter"]), "within": pp(vq[q]["sh_within"]),
                        "modelRange": round(100 * (float(vq[q]["model_max"]) - float(vq[q]["model_min"]))),
                        "countryRange": round(100 * (float(vq[q]["country_max"]) - float(vq[q]["country_min"])))}
                for q, q_out in (("Q1", "q1"), ("Q2", "q2"), ("Q4", "q3"))}

    sing = {r["hyp"]: r for r in rows("tab_main_singletons")}
    bgrt = {r["hyp"] if r["hyp"] != "--" else "RP": r for r in rows("tab_bgrt_coefficients")}
    cells = {(r["risk_aversion_stated"], r["pension_stated"], r["horizon_stated"]): f(r["mean"], 3)
             for r in rows("tab_summary_bgrt_cells")}
    upg = {r["contrast"]: r for r in rows("tab_upgrade_coefficients")}

    def upg_row(label):
        r = upg[label]
        return {"est": pp(r["estimate"]), "lo": pp(r["ci_lo"]), "hi": pp(r["ci_hi"]), "p": f(r["p_wild"], 3)}

    probes = [
        {"pair": "Pension", "risk": "invested in stocks", "safe": "a guaranteed annuity",
         "r": upg_row("Pension equity-invested (Merton: $-$)"), "s": upg_row("Pension bond-like annuity (Merton: +)"),
         "scope": "21 countries"},
        {"pair": "The stake", "risk": "all my liquid wealth", "safe": "a third of it",
         "r": upg_row("Stake = all liquid wealth (US only)"), "s": upg_row("Stake = a third of wealth (US only)"),
         "half": upg_row("Stake = half of wealth (US only)"), "scope": "United States"},
        {"pair": "The fund", "risk": "not currency-hedged", "safe": "currency-hedged",
         "r": upg_row("Fund unhedged (at mean $\\sigma_c$)"), "s": upg_row("Fund currency-hedged (at mean $\\sigma_c$)"),
         "scope": "21 countries"},
    ]

    kap = rows("tab_kappa_baseline")[0]
    gpss = {r["hyp"]: r for r in rows("tab_gps_slopes")}
    temp = rows("tab_robust_temp_contrasts")
    busd = by_country("tab_robust_busd")
    track = {r["wave_date"]: r for r in rows("tab_track_variance_by_wave")}
    ages = {r["age"]: r for r in rows("tab_age_rule_bunching")}
    slopes = {r["group"]: f(r["slope_pp_per_year"], 2) for r in rows("tab_age_rule_slopes")}

    # The question sentence of the Version B portfolio prompt in every prompt language,
    # from the frozen translations (output/translations/translations.json). Identical
    # sentences (Germany and Switzerland) are listed once.
    tr = json.load(open(os.path.join(ROOT, "output", "translations", "translations.json"), encoding="utf-8"))
    questions = [{"lang": "English", "countries": sorted(ENGLISH), "text": "What percentage should I invest in the stock fund?"}]
    for k, v in tr.items():
        b = v["B"]["Q1"]
        b = b if "question_block" in b else list(b.values())[0]
        segs = re.findall(r"[^.。?？!\n]*[?？]", b["question_block"])
        text = segs[-1].strip()
        hit = next((q for q in questions if q["text"] == text), None)
        if hit:
            hit["countries"].append(k)
        else:
            questions.append({"lang": b["language"], "countries": [k], "text": text})

    uk = fe["UK"]
    nonus = [c for c in countries if c["key"] != "USA"]
    cats = {}
    for r in rows("tab_text_category_prevalence"):
        cats.setdefault(r["category"], {})[r["version"]] = f(r["share_all"], 4)
    D = {
        "countries": countries,
        "models": models,
        "grid": resp["grid"],
        "histByAge": resp["hist_by_age"],
        "variance": variance,
        "stats": {
            "queries": 267150, "models": 13, "vendors": 6, "countries": 21, "reps": 50,
            "nPrimary": sum(c["n"] for c in countries),
            "holm": sum(1 for c in countries if c["fe"] and c["fe"]["sig"]),
            "lambda": pp(sing["H4"]["estimate"]), "lambdaLo": pp(sing["H4"]["ci_lo"]), "lambdaHi": pp(sing["H4"]["ci_hi"]),
            "lambdaP": f(sing["H4"]["p_wild"], 3),
            "phi": pp(sing["H5"]["estimate"]), "phiLo": pp(sing["H5"]["ci_lo"]), "phiHi": pp(sing["H5"]["ci_hi"]),
            "phiP": f(sing["H5"]["p_wild"], 3),
            "uk": pp(uk["estimate"]), "ukLo": pp(uk["ci_lo"]), "ukHi": pp(uk["ci_hi"]),
            "phiText": pp(rows("tab_h10_local_versionC")[0]["estimate"]),
            "kappa": f(kap["kappa"], 2), "kappaLo": f(kap["ci_lo"], 2), "kappaHi": f(kap["ci_hi"], 2),
            "gpsSlope": f(gpss["H7"]["estimate"], 3), "gpsP": f(gpss["H7"]["p_wild"], 3),
            "finlitSlope": f(gpss["H8"]["estimate"], 3), "finlitP": f(gpss["H8"]["p_wild"], 3),
            "age30": pp(sing["age30"]["estimate"], 2), "age55": pp(sing["age55"]["estimate"], 2),
            "psi": f(sing["H6"]["estimate"], 4), "psiP": f(sing["H6"]["p_wild"], 2),
            # summaries of the country rows, so prose never retypes them
            "meanMin": min(c["mean"] for c in countries), "meanMax": max(c["mean"] for c in countries),
            "alphaSMin": min(c["alphaS"] for c in countries), "alphaSMax": max(c["alphaS"] for c in countries),
            "gapHedgedMax": round(max(abs(c["adviceBench"] - c["alphaH"]) for c in countries), 4),
            "localMinNonUS": min(c["localB"] for c in nonus), "localMaxNonUS": max(c["localB"] for c in nonus),
            "modelMin": min(m["mean"] for m in models), "modelMax": max(m["mean"] for m in models),
        },
        # Pooled prevalence of each rationale category, Versions B and C: tab_text_category_prevalence.csv
        "textCats": cats,
        "stated": {
            "risk": {"est": pp(bgrt["H11"]["estimate"]), "lo": pp(bgrt["H11"]["ci_lo"]), "hi": pp(bgrt["H11"]["ci_hi"])},
            "pension": {"est": pp(bgrt["H12"]["estimate"]), "lo": pp(bgrt["H12"]["ci_lo"]), "hi": pp(bgrt["H12"]["ci_hi"])},
            "inter": {"est": pp(bgrt["RP"]["estimate"]), "lo": pp(bgrt["RP"]["ci_lo"]), "hi": pp(bgrt["RP"]["ci_hi"])},
            "horizon": {"est": pp(bgrt["H13"]["estimate"]), "lo": pp(bgrt["H13"]["ci_lo"]), "hi": pp(bgrt["H13"]["ci_hi"])},
            "cells": {"averseLimited": cells[("averse", "limited", "5y")], "averseGenerous": cells[("averse", "generous", "5y")],
                      "tolerantLimited": cells[("tolerant", "limited", "5y")], "tolerantGenerous": cells[("tolerant", "generous", "5y")],
                      "h1": cells[("none", "none", "1y")], "h20": cells[("none", "none", "20y")]},
            "say": {
                "tolerant": "I am comfortable with substantial fluctuations in my portfolio value, including potential short-term losses, if it means higher expected returns over time.",
                "averse": "I am uncomfortable with large fluctuations in my portfolio value and would prefer to limit potential losses, even if it means lower expected returns.",
                "generous": "I will receive a substantial pension when I retire, projected to replace most of my pre-retirement income.",
                "limited": "I will receive only a small pension when I retire, covering a modest fraction of my pre-retirement income.",
            },
        },
        "probes": probes,
        "questions": questions,
        "robust": {
            "temp": [{"country": r["country"], "t": f(r["temperature"], 1), "est": pp(r["estimate"])} for r in temp],
            "usd": [{"country": k, "shift": pp(v["shift"]), "lo": pp(v["ci_lo"]), "hi": pp(v["ci_hi"]), "p": f(v["p_wild"], 3)}
                    for k, v in busd.items()],
        },
        "tracking": {w: {"model": round(float(r["share_model"]), 2), "country": round(float(r["share_country"]), 2),
                         "n": int(r["n"])} for w, r in track.items()},
        "age": {a: {"rule": round(100 * float(r["rule"])), "mean": pp(r["mean"]), "shareRule": pp(r["share_rule"])}
                for a, r in ages.items()},
        "slopes": {"pooled": slopes["pooled"], "english": slopes["english_prompt"], "other": slopes["non_english"]},
        # Real responses: Gemini 3 Flash (google/gemini-3-flash-preview), Question 1, Version B, age 40.
        # Emily's is the U.S. cell, rep 49. Yuki's is the Japan cell, rep 10. Both recommend 0.60.
        # The English gloss of the Japanese answer is a close translation, labelled as such on the slide.
        "quotes": {
            "model": "Gemini 3 Flash",
            "us": {"fraction": 0.60, "rep": 49,
                   "text": "At 40 years old with a secure pension plan, you have a solid financial foundation that allows for moderate risk-taking. A 60/40 split (60% stocks, 40% bonds) is a classic balanced approach suitable for a five-year horizon."},
            "jp": {"fraction": 0.60, "rep": 10,
                   "text": "一般的に「100マイナス年齢」を株式比率とする指針に基づき、60%を株式インデックスファンド、40%を国債に配分することを推奨します。…日本の居住者としては、NISA等の非課税制度を活用し、低コストな全世界株式インデックスを選択するのが効率的です。",
                   "gloss": "Following the common guideline that sets the equity share at “100 minus age”, I recommend 60% in the stock index fund and 40% in government bonds. … As a resident of Japan, it is efficient to use tax-free schemes such as NISA and choose a low-cost all-world equity index."},
        },
    }

    def dump(v):
        return json.dumps(v, ensure_ascii=False, separators=(",", ":"))

    # One top-level key per line, and one country or model per line, so a pipeline re-run diffs cleanly.
    parts = []
    for k, v in D.items():
        if isinstance(v, list):
            parts.append(f' "{k}": [\n' + ",\n".join("  " + dump(x) for x in v) + "\n ]")
        else:
            parts.append(f' "{k}": ' + dump(v))
    js = ("// Generated by build_data.py from output/tables/*.csv, output/analysis_data/gps_data.csv\n"
          "// and docs/explorable/js/responses.js. Do not edit by hand: re-run the script.\n"
          "window.DECK_DATA = {\n" + ",\n".join(parts) + "\n};\n")
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(js)
    print(f"wrote {os.path.relpath(OUT, ROOT)}: {len(countries)} countries, {len(models)} models")


if __name__ == "__main__":
    main()
