# One Advisor for the Whole World? — explorable explanation

An interactive explanation of Bäckman, *One Advisor for the Whole World? Cross-Country
Evidence on Financial Advice from Large Language Models*.

Last brought in line with the paper on 19 November 2026 (`Writing/2_main_v3.tex`). That
revision made the mortgage and inflation questions a deck on the spine (`local`), added the
mortgage question without a stated rate, the questions the models ask before advising, the
later robustness checks and the September model panel, added the currency-hedged benchmark
to the Merton bench, and removed the welfare-cost deck, which the paper no longer carries.
`plan.md` describes the original September design and has not been rewritten.

Open `index.html` in a browser. It works from disk by double-click — no server, no build
step, no external dependencies. It also deploys as-is to GitHub Pages under `docs/`, the
same way `docs/paper/` does.

## Structure

```
index.html              the shell
css/style.css
js/
  engine.js             router, map, progress, gates, keyboard
  ruler.js              the standing ruler in the top bar
  charts.js             SVG primitives
  playables.js          hook, compression and benchmark playables
  playables-rule.js     explanation-text and advice-rule playables
  playables-side.js     the side paths, plus the mortgage and inflation charts
  decks.js              ask / same / warranted
  decks-rule.js         words / local / levers / lineup / asym / world
  decks-side.js         models / age / method / glidvag
  data.js               every number transcribed from the paper's tables
  data_text.js          explanation-text prevalences
  -- generated, do not edit by hand --
  responses.js          response histograms and country-by-model cell means
  prompts.js            the real Version B / Q1 prompt in all 21 languages
  bymodel.js            per-model country contrasts
plan.md                 the design plan the build follows
```

## Regenerating the data

Three files are generated from the collection and the pipeline output. Re-run them after
any re-run of the Stata pipeline:

```bash
python docs/explorable/extract_data.py      # responses.js   <- output/analysis_data/clean.csv
python docs/explorable/extract_prompts.py   # prompts.js     <- output/translations/translations.json
python docs/explorable/extract_bymodel.py   # bymodel.js     <- output/tables/check_q1_country_by_model.csv
```

`check_q1_country_by_model.csv` is no longer written by the pipeline, so
`extract_bymodel.py` fails until that table is restored. The committed `bymodel.js` is from
the same collection and is still correct.

`data.js` and `data_text.js` are hand-transcribed and each block names its source table, so
they can be diffed against a fresh pipeline run by hand.

## Screenshots and checks

```bash
python docs/explorable/shoot.py             # every slide, desktop, reports console
                                            # errors, viewport overflow, horizontal scroll
python docs/explorable/shoot.py --phone     # 400px wide
python docs/explorable/shoot.py ask same    # named decks only
```

Output goes to `_shots/` (gitignored).

## What is computed live

The benchmark is not a lookup table. `D.merton()` in `data.js` implements the paper's
formula, and the Merton bench recomputes from the slider on every interaction, for the
hedged fund (one volatility for every country, 52% everywhere at γ = 3) and the unhedged
fund. At the baseline grid point (γ = 3, premium 5.32%) the unhedged shares run from 20.97%
in Turkey to 52.66% in South Korea for a spread of 31.7 points, matching
`tab_benchmark_gaps.csv`.

For that to hold, σ is stored to two decimals. The paper's tables print it to one, and at
one decimal the United States and South Korea tie, which put the maximum prescribed share
in the wrong country and reported the spread as 31 rather than 32. The stored values are
recovered from the published `alpha_s` column by inverting the Merton expression.

## Conventions

- Two accent colours carry the whole argument: **advice** (what a model says) and
  **warranted** (what local fundamentals prescribe). Nothing else is coloured.
- The needle motif — a marker on a 0–100 track — appears wherever the point is that a
  number did or did not move. One of them is promoted to the page furniture: the ruler in
  the top bar carries the band the advice occupies and a needle at the panel average, and
  it is identical on every slide. On `warranted` the twenty-one shares the unhedged
  benchmark prescribes appear beneath it, spread across a third of the scale.
- Every slide reads as a normal explanation if the reader touches nothing.
- No fabricated quotes. Prompts, statements and distributions are the real ones.
