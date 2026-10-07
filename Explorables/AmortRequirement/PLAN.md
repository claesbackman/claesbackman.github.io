# Research website: "Mortgage Design, Repayment Schedules, and Household Borrowing"

Bäckman, Moran and van Santen, *Review of Financial Studies* (2025).

## Goal and audience

A static, single-page research site for academics (economists working on household finance, housing, bunching, behavioral IO). Two jobs:

1. Make the paper easy to cite: prominent citation, BibTeX/RIS copy, DOI, replication-package link, on every screen a reader might land on.
2. Let a reader check the results themselves: re-run the difference-in-bunching estimator under their own choices, flip between the paper's published specifications, and move the structural model's disutility parameters to see what the model predicts.

It is separate from `../Explorable/` (the general-audience tutorial), which it links to as "non-technical introduction" once that is finished.

## Hosting and stack

- GitHub Pages. Plain static files, no build step at view time: `index.html`, `css/style.css`, `js/*.js`, `data/*.json`.
- Vanilla JS and hand-written SVG charts (small, fast, no framework). KaTeX from jsDelivr for the four equations.
- Light and dark theme via CSS tokens. Works at phone width. All controls keyboard-accessible, charts have text summaries.
- Deep links: every control state is encoded in the URL hash (e.g. `#evidence?t=50&pre=2011-2015&L=48.5&U=51.5`), so a reader can share an exact specification. Useful for referees and teaching.

## Data (all derived, nothing confidential)

A reproducible Python script `tools/build_data.py` reads project files and writes `data/*.json`. The site never ships raw files.

| JSON | Source | Content |
|---|---|---|
| `bins.json` | `ProjectCode/FinalData/nr_hh_by_year_ltv_bins.csv` | Per year 2011–2018: **share** of that year's loans in each 0.5pp bin for LTV 30–80 (no counts), plus one aggregate share for [20,30) so the paper's 20–65 normalization can be reproduced exactly. Also IO share and mean mortgage rate per bin (40–80). Suppress any cell with < 10 households. |
| `published.json` | `tables/*.tex`, main.tex tables | Every published estimate with SE: main 50/70, window robustness (8 columns × 2 thresholds), PTI groups (50, 70), valuation types (50, 70). Hand-transcribed and checked against the .tex. |
| `calibration.json` | `ProjectCode/ModelData/Calibration_Loop1_SwedenSpec.csv`, `Calibration_Loop2_SwedenSpec.csv` | Model-implied B and M as functions of Δk (flow) and Δn (one-off). SE spec: B(Δk = 0.08) = 7.53, matching the appendix. |
| `model_hist.json` | `Model/Stylized-Results-Riksbanken2023/*OnePeriodIn*_part{1,2}.csv`, `ModelData/Robustness/*` | Simulated LTV at purchase, binned (0.5pp and 2pp) for: baseline, one-off cost, flow disutility, and the six robustness calibrations (impatience, steeper income, no HEW, high liquid return, negative liquid return, forced purchase). Mapping of part1/part2 to models follows `16_ModelResultsNew.do`. |
| `value_fn.json` | `plot_value_function_by_LTV_partial_*.csv` | EV(LTV) for IO, baseline, one-off, flow, and robustness variants (48 points each). |
| `aggregate.json` | main.tex Section 6 and Table BK | IO introduction: +33.4% debt with flow disutility, +9.1% without, decomposition ~2/3 vs ~1/3. MWA table (BK vs four model calibrations, full and a > 10k samples). |

Validation step in the build script: re-run the estimator on `bins.json` with the paper's main choices and print the result next to the published 7.47 / 0.83 / 2.57. The public bins use [a, a+0.5) edges while the paper bins microdata by rounding, so the live number will be close but not identical (current check: B ≈ 7.05 vs 7.47). The site states this plainly next to the live estimate and always shows the published number beside it.

## Page structure

1. **Header / citation bar** (sticky, compact). Title, authors (linked), "RFS 2025", buttons: Paper (DOI), Replication package (Harvard Dataverse doi:10.7910/DVN/DZUGKD), Cite (opens a panel with formatted AER-style reference, BibTeX, RIS download, copy buttons).
2. **Summary.** Abstract, three headline numbers as stat tiles: bunching B = 7.47 (5% lower borrowing, elasticity 0.25). 86% of bunchers not payment-constrained. IO mortgages raise debt 33.4% in the model, two-thirds from flow disutility.
3. **The policy.** Small chart of the required amortization rate by LTV (0 / 1 / 2 %) before and after June 2016, and two sentences on the Swedish linear repayment schedule and the costless "off switch".
4. **Evidence explorer (live re-estimation).** The core interactive.
   - Chart: post-reform vs counterfactual LTV distribution, excluded window shaded, B and M areas filled.
   - Controls: threshold (50 / 70), counterfactual years (checkboxes 2011–2015), treatment years (2016–2018), lower limit L and upper limit U (sliders on the 0.5 grid), estimation range.
   - Readouts: B, M, ΔLTV, elasticity, M/B, each with the published value beside it when the reader's choice matches a published column.
   - Toggles: small multiples by year (Figure 1 of the paper), IO-share by bin pre/post, mortgage rate by bin pre/post (the supply-side checks).
   - Equations (B, M, ΔLTV, elasticity) in a collapsible "Method" box, with the identifying assumption stated.
5. **Specification explorer (published estimates).** Coefficient plot of B, M, ΔLTV, elasticity ± 1.96 SE across all published specifications, grouped: window robustness, PTI groups, valuation type, 50 vs 70. Click a row to highlight it and read the N and the table source. A reference line at M/B = 15% ties to the identification argument.
6. **Model explorer.**
   - 6a. *Mechanisms.* Three buttons: baseline, one-off cost (notch), flow disutility (kink). Two linked charts: simulated LTV histogram vs baseline, and the value function EV(LTV) (normalized so the IO curve is flat). One sentence per mechanism on why it does or does not generate a pile or a hole.
   - 6b. *Identification plane.* Scatter in (B, M) space. Two model loci traced by Δk and Δn from the calibration loops, the data point (7.47, −0.83) with its 95% CI cross. Two sliders move a marker along each locus with live B, M readouts. The reader sees that the one-off cost tops out near B ≈ 4 with a large hole, while Δk = 0.08 hits B = 7.53 with a small one.
   - 6c. *Robustness calibrations.* Dropdown of the six alternatives. Histogram and value function show that none generates bunching without a psychic cost.
   - Parameter table (collapsible) with the calibrated values from the Internet Appendix.
7. **Implications.** IO introduction: split bar of the 33.4% (flow disutility vs flexibility), compared with 9.1% without disutility. MWA: table-as-chart comparing BK's 0.997 with the four model calibrations, toggle full sample vs a > €10k.
8. **Cite this paper** (full section, repeated). Formatted reference, BibTeX, RIS, links to paper, Internet Appendix, replication package, and author pages.
9. **Footer.** Data note (FI Mortgage Survey, aggregated shares only, cells < 10 suppressed), views disclaimer from the paper, last updated.

## Writing

Academic, direct, no semicolons, no mannered prose. Every model statement says "in the model". Association vs causality kept clear: the bunching is a response to the reform, the mechanism attribution comes from the model.

## Open items to confirm during build

- Exact volume/issue/pages/DOI (proof file suggests `10.1093/rfs/hhaf115`). Verify online.
- Author homepage URLs.
- part1/part2 mapping for each robustness CSV (verify from the do-files and by checking which histogram has no bunching).

## Build order

1. `tools/build_data.py` and JSON outputs, with the validation printout.
2. Page shell, theme, citation bar and cite panel, summary.
3. Evidence explorer.
4. Specification explorer.
5. Model explorer.
6. Implications, footer.
7. Review pass in the browser pane (desktop, mobile, dark), link check, copy check against the paper.

## Revisions after review (implemented)

- Live estimator kept, but the published estimate is always shown beside it, and a note explains the floor-vs-round binning gap (live B = 6.93 vs 7.47).
- Disclosure: pooled shares for every pre-year and post-year subset, with no totals. Rates and IO shares are pooled pre/post, in cells with at least 20 loans.
- Model: 2pp histograms only, from `ProjectCode/ModelData/`. These match the published figures bin for bin. The (B, M) plane and the one-off loop (range 0–0.25, versus the paper's 0.35) are labelled supplementary. ForceBuy is dropped.
- Citation metadata goes in `<head>`. Deep links use query parameters. No CDN dependency except fonts. A CSV of all published estimates is added.
