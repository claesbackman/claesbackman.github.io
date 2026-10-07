# Research website

Interactive companion to Bäckman, Moran and van Santen, "Mortgage Design, Repayment Schedules, and Household Borrowing," *Review of Financial Studies* 39 (8), 2026. doi:10.1093/rfs/hhaf115.

Static site, no build step. Plain HTML, CSS and ES-module JavaScript with hand-drawn SVG charts. The only external request is Google Fonts, with system-font fallbacks.

## Files

```
index.html            page, citation metadata (Google Scholar / Zotero tags)
css/style.css         light and dark themes
js/charts.js          SVG chart helpers
js/app.js             estimator, controls, charts, URL state
data/*.json           derived data (built by tools/build_data.py)
data/published_estimates.csv   every published estimate with SEs
tools/build_data.py   rebuilds data/ from ProjectCode/ and Model/ (not needed to host)
```

## Preview locally

The page fetches JSON, so it needs a local server rather than `file://`.

```bash
python3 -m http.server 8765 -d Website
```

## Rebuild the data

```bash
python3 Website/tools/build_data.py
```

The script prints the live estimator's result on the public bins next to the published values as a check.

## Deploy on GitHub Pages

1. Create a new public repository (for example `amortization-requirement`) and copy the contents of `Website/` into it. Leave out `tools/` and `PLAN.md` if you prefer.
2. In the repository settings, go to Pages and choose "Deploy from a branch", `main`, folder `/ (root)`.
3. The site appears at `https://<user>.github.io/<repo>/`. Add that URL to the paper page, your CV and the Dataverse entry.

After an update, bump `?v=1` on the CSS and JS links in `index.html` so returning visitors get the new files.

## Data and disclosure

- **Empirical data.** Only shares of loans per 0.5pp LTV bin are published, pooled over each subset of years, with no counts or totals. Bin-level interest-only shares and mortgage rates are shown pooled pre vs post, and only for bins with at least 20 loans.
- **Why the live estimates differ.** The public bins are [a, a+0.5), while the paper rounds microdata to the nearest 0.5. The live estimates are therefore close to, not equal to, the published ones (B = 6.93 vs 7.47 at 50%). Re-collapsing the microdata with `round(ltv, 0.5)` over LTV 20–80 would make them match exactly.
- **Model outputs.** Taken from `ProjectCode/ModelData/`. Its histograms match the published figures bin for bin. The (B, M) identification plane and the one-off calibration loop are labelled on the page as supplementary, not reported in the paper.
