/* ------------------------------------------------------------------------
   data_text.js — the explanation-text measurements.

   Source of record: output/tables/tab_text_local_prevalence.csv (per-country
   share of explanations that name local financial context, under Version B
   and Version C) and tab_text_category_prevalence.csv (pooled shares by
   rationale category). Both written by the Stata pipeline, stage 06.

   These are levels, measured directly, not derived from the contrasts in
   tab_h9_text_body.tex. They reproduce that table's contrasts against the
   18.0% US baseline.
   ------------------------------------------------------------------------ */

window.DT = (function () {

  // country key -> [share under Version B, share under Version C]
  // Version B: translated question, generic instruments.
  // Version C: translated question, local instruments named in the prompt.
  var local = {
    "USA":          [0.1800, 0.8400],
    "South Korea":  [0.4723, 0.9969],
    "Sweden":       [0.4761, 0.8877],
    "China":        [0.5085, 0.9330],
    "Japan":        [0.5431, 1.0000],
    "Finland":      [0.5741, 0.9398],
    "Netherlands":  [0.6102, 0.9230],
    "Germany":      [0.6308, 0.9954],
    "Poland":       [0.7431, 1.0000],
    "France":       [0.7704, 1.0000],
    "Canada":       [0.7738, 0.9985],
    "Spain":        [0.7917, 0.9954],
    "Switzerland":  [0.8459, 1.0000],
    "Australia":    [0.8615, 0.9969],
    "India":        [0.8831, 1.0000],
    "Italy":        [0.8846, 0.9985],
    "Turkey":       [0.8862, 1.0000],
    "UK":           [0.8985, 1.0000],
    "Brazil":       [0.9385, 0.9969],
    "Mexico":       [0.9523, 1.0000],
    "South Africa": [0.9614, 0.9969]
  };

  // pooled prevalence of each rationale category, all 21 countries
  var categories = {
    inflation: { B: 0.3651, C: 0.2901 },
    pension:   { B: 0.9531, C: 0.9698 },
    horizon:   { B: 1.0000, C: 1.0000 },
    local:     { B: 0.7231, C: 0.9762 }
  };

  // how many countries are within half a point of universal local reference
  // once the prompt names the instruments (the paper's "sixteen of twenty-one")
  var saturatedUnderC = Object.keys(local).filter(function (k) {
    return local[k][1] >= 0.995;
  }).length;

  return { local: local, categories: categories, saturatedUnderC: saturatedUnderC };
})();
