/* Country effects explorer. */
(function () {
  "use strict";
  const S = window.Site, C = window.Charts, F = window.ChartsFA;
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const QL = { Q1: "Q1 portfolio", Q2: "Q2 mortgage", Q4: "Q3 inflation" };
  const XT = { Q1: "Effect on recommended equity share vs. the U.S. baseline (percentage points)", Q2: "Effect on the share invested rather than prepaid vs. the U.S. baseline (pp)", Q4: "Effect on the share moved into investments vs. the U.S. baseline (pp)" };

  function pills(group, label, options, value, onChange) {
    const wrap = document.createElement("div"); wrap.className = "ctl-group";
    if (label) { const l = document.createElement("span"); l.className = "ctl-label"; l.textContent = label; wrap.appendChild(l); }
    options.forEach((o) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "pill"; b.textContent = o.label;
      b.setAttribute("aria-pressed", String(o.key) === String(value) ? "true" : "false");
      b.addEventListener("click", () => { wrap.querySelectorAll(".pill").forEach((p) => p.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); onChange(o.key); });
      wrap.appendChild(b);
    });
    group.appendChild(wrap);
  }
  function select(group, label, options, value, onChange) {
    const wrap = document.createElement("label"); wrap.className = "ctl-group"; wrap.innerHTML = `<span class="ctl-label">${label}</span>`;
    const s = document.createElement("select");
    options.forEach(([k, l]) => { const o = document.createElement("option"); o.value = k; o.textContent = l; s.appendChild(o); });
    s.value = value; s.addEventListener("change", () => onChange(s.value)); wrap.appendChild(s); group.appendChild(wrap);
    return s;
  }
  function links(id, state) {
    const box = document.getElementById(id); box.innerHTML = "";
    const tbtn = document.createElement("button"); tbtn.type = "button"; tbtn.textContent = "Table view";
    const chart = box.parentElement.querySelector(".fig-chart");
    let table = null;
    tbtn.addEventListener("click", () => {
      if (!table) { table = document.createElement("div"); table.className = "fig-table"; table.innerHTML = state.table(); chart.insertAdjacentElement("afterend", table); chart.hidden = true; tbtn.textContent = "Chart view"; }
      else { table.remove(); table = null; chart.hidden = false; tbtn.textContent = "Table view"; }
    });
    box.appendChild(tbtn);
    if (state.download) { const a = document.createElement("a"); a.href = "#"; a.textContent = "Download (CSV)"; a.addEventListener("click", (e) => { e.preventDefault(); state.download(); }); box.appendChild(a); }
    if (state.paper) { const a = document.createElement("a"); a.href = state.paper.href; a.textContent = state.paper.label; box.appendChild(a); }
  }
  function setLegend(panel, html) { const old = panel.querySelector(".legend"); if (old) old.remove(); if (html) panel.querySelector(".fig-controls").insertAdjacentHTML("afterend", html); }

  Promise.all([S.data("tables"), S.data("cells"), S.data("index")]).then(([T, CELLS, I]) => {
    const mlabel = (m) => (I.models.find((x) => x.key === m) || { label: m }).label;
    const cname = (c) => (I.countries.find((x) => x.key === c) || { name: c }).name;
    const countriesSorted = I.countries.slice().sort((a, b) => a.name.localeCompare(b.name));
    const cell = (c, m, v, q, age, ph) => CELLS.rows.find((r) => r.country === c && r.model === m && r.version === v && r.question === q && r.age === age && r.phrasing === (ph || "v1"));

    // ---- 1. country effects ----
    (function () {
      const panel = document.getElementById("p-fe"), ctl = document.getElementById("fe-controls"), chart = document.getElementById("fe-chart");
      let q = ["Q1", "Q2", "Q4"].includes(S.qs("q")) ? S.qs("q") : "Q1", holm = true, ch = null, rows = [];
      function draw() {
        rows = T.countryfe[q].slice().sort((a, b) => b.b - a.b);
        ch = C.dotRange(chart, { items: rows.map((r) => ({ label: r.name, b: r.b, lo: r.lo, hi: r.hi, sig: (holm ? r.p_holm : r.p) < 0.05 })), xtitle: XT[q], labelTitle: "Country", width: 680 });
        const n_sig = rows.filter((r) => r.p_holm < 0.05).length, n_unc = rows.filter((r) => r.p < 0.05).length;
        panel.querySelector(".spec-summary, .fe-summary")?.remove();
        chart.insertAdjacentHTML("beforebegin", `<p class="spec-summary fe-summary">${QL[q]}: <strong>${n_unc}</strong> of 20 contrasts significant before correction, <strong>${n_sig}</strong> after the Holm step-down. Range ${S.fmt.signed(d3.min(rows, (r) => r.b), 1)} to ${S.fmt.signed(d3.max(rows, (r) => r.b), 1)} pp.</p>`);
      }
      pills(ctl, "Question", Object.entries(QL).map(([k, l]) => ({ key: k, label: l })), q, (v) => { q = v; draw(); });
      pills(ctl, "Colour by", [{ key: 1, label: "Holm-corrected p < 0.05" }, { key: 0, label: "Uncorrected wild p < 0.05" }], 1, (v) => { holm = !!v; draw(); });
      draw();
      setLegend(panel, F.legendHTML([{ label: "Significant, negative", color: css("--neg"), kind: "dot" }, { label: "Significant, positive", color: css("--pos"), kind: "dot" }, { label: "Not significant", color: css("--chart-ink-2"), kind: "dot" }, { label: "95% wild cluster bootstrap CI", color: css("--chart-muted") }]));
      links("fe-links", { table: () => `<div class="table-wrap"><table class="data-table"><thead><tr><th>Country</th><th>Effect (pp)</th><th>95% CI</th><th>p (wild)</th><th>p (Holm)</th></tr></thead><tbody>${rows.map((r) => `<tr><th scope="row">${S.esc(r.name)}</th><td>${S.fmt.signed(r.b, 2)}</td><td>[${S.fmt.signed(r.lo, 2)}, ${S.fmt.signed(r.hi, 2)}]</td><td>${S.fmt.p(r.p)}</td><td>${S.fmt.p(r.p_holm)}</td></tr>`).join("")}</tbody></table></div>`,
        download: () => S.download(`countryfe_${q}.csv`, S.toCSV(rows.map((r) => ({ country: r.name, effect_pp: r.b, ci_lo: r.lo, ci_hi: r.hi, p_wild: r.p, p_holm: r.p_holm })), ["country", "effect_pp", "ci_lo", "ci_hi", "p_wild", "p_holm"])),
        paper: { href: "results.html#fig:three-questions", label: "Figure 5 in the paper" } });
    })();

    // ---- 2. by model ----
    (function () {
      const panel = document.getElementById("p-model"), ctl = document.getElementById("model-controls"), chart = document.getElementById("model-chart");
      let q = "Q1", m = I.models[0].key, ch = null, rows = [];
      function draw() {
        const us = cell("USA", m, "B", q, 40);
        rows = I.countries.filter((c) => c.key !== "USA").map((c) => { const r = cell(c.key, m, "B", q, 40); return r && us ? { label: c.name, b: (r.mean - us.mean) * 100, mean: r.mean * 100, n: r.n } : null; }).filter(Boolean).sort((a, b) => b.b - a.b);
        ch = C.dotRange(chart, { items: rows.map((r) => ({ label: r.label, b: r.b, lo: r.b, hi: r.b, sig: false })), xtitle: `${mlabel(m)}: mean in country minus mean in the U.S., ${QL[q]} (pp)`, labelTitle: "Country", width: 680 });
        const pooled = T.countryfe[q];
        const same = rows.filter((r) => { const p = pooled.find((x) => x.name === r.label); return p && Math.sign(p.b) === Math.sign(r.b); }).length;
        panel.querySelector(".model-summary")?.remove();
        chart.insertAdjacentHTML("beforebegin", `<p class="spec-summary model-summary">${S.esc(mlabel(m))}, U.S. mean ${S.fmt.n(us ? us.mean * 100 : NaN, 1)} percent. Country range ${S.fmt.signed(d3.min(rows, (r) => r.b), 1)} to ${S.fmt.signed(d3.max(rows, (r) => r.b), 1)} pp; <strong>${same}</strong> of ${rows.length} contrasts share the sign of the pooled estimate.</p>`);
      }
      pills(ctl, "Question", Object.entries(QL).map(([k, l]) => ({ key: k, label: l })), q, (v) => { q = v; draw(); });
      select(ctl, "Model", I.models.map((x) => [x.key, `${x.label} (${x.vendor})`]), m, (v) => { m = v; draw(); });
      draw();
      links("model-links", { table: () => ch.table(), download: () => S.download(`bymodel_${q}_${m.replace("/", "_")}.csv`, S.toCSV(rows.map((r) => ({ country: r.label, mean_pct: r.mean, diff_vs_us_pp: r.b, n: r.n })), ["country", "mean_pct", "diff_vs_us_pp", "n"])) });
    })();

    // ---- 3. leave one model out ----
    (function () {
      const ctl = document.getElementById("loo-controls"), chart = document.getElementById("loo-chart");
      let d = "none", ch = null, rows = [];
      function draw() {
        rows = (T.loo.by_dropped[d] || []).slice().sort((a, b) => b.b - a.b);
        ch = C.dotRange(chart, { items: rows.map((r) => ({ label: r.name, b: r.b, lo: r.lo, hi: r.hi, sig: r.p_holm < 0.05 })), xtitle: XT.Q1, labelTitle: "Country", width: 680 });
        const n_sig = rows.filter((r) => r.p_holm < 0.05).length;
        document.getElementById("loo-summary").innerHTML = d === "none" ? `All thirteen models: joint wild-bootstrap p = ${S.fmt.p(T.loo.joint[d])}, <strong>${n_sig}</strong> contrasts survive Holm.` : `Without ${S.esc(mlabel(d))}: joint wild-bootstrap p = ${S.fmt.p(T.loo.joint[d])} with twelve clusters, <strong>${n_sig}</strong> of 20 contrasts survive Holm.`;
      }
      select(ctl, "Dropped model", [["none", "None (all thirteen models)"]].concat(I.models.map((x) => [x.key, x.label])), d, (v) => { d = v; draw(); });
      draw();
      links("loo-links", { table: () => ch.table(), download: () => S.download(`loo_${d.replace("/", "_")}.csv`, S.toCSV(rows.map((r) => ({ country: r.name, effect_pp: r.b, ci_lo: r.lo, ci_hi: r.hi, p_wild: r.p, p_holm: r.p_holm })), ["country", "effect_pp", "ci_lo", "ci_hi", "p_wild", "p_holm"])) });
    })();

    // ---- 4. versions by model ----
    (function () {
      const panel = document.getElementById("p-version"), ctl = document.getElementById("ver-controls"), chart = document.getElementById("ver-chart");
      let c = "Sweden", ch = null;
      const series = [{ key: "B", label: "Version B (local language)", shape: "circle", color: css("--series-1") }, { key: "B-cross", label: "Version B-cross (English, country named)", shape: "triangle", color: css("--series-2") }, { key: "C", label: "Version C (local instruments named)", shape: "square", color: css("--series-3") }];
      function draw() {
        const rows = I.models.map((m) => ({ label: m.label, marks: ["B", "B-cross", "C"].map((v) => { const r = cell(c, m.key, v, "Q1", 40); return r ? { key: v, x: r.mean * 100 } : null; }).filter(Boolean) }))
          .sort((a, b) => (a.marks.find((m) => m.key === "B") || {}).x - (b.marks.find((m) => m.key === "B") || {}).x);
        ch = F.dotPlot(chart, { rows, series, xdomain: [0, 100], xtitle: `${cname(c)}: mean recommended equity share (percent), Q1, age 40`, labelTitle: "Model", left: 130 });
        const mean = (v) => d3.mean(rows, (r) => (r.marks.find((m) => m.key === v) || {}).x);
        panel.querySelector(".ver-summary")?.remove();
        const hasX = rows.some((r) => r.marks.some((m) => m.key === "B-cross"));
        chart.insertAdjacentHTML("beforebegin", `<p class="spec-summary ver-summary">${S.esc(cname(c))}, mean across models: Version B ${S.fmt.n(mean("B"), 1)}${hasX ? `, B-cross ${S.fmt.n(mean("B-cross"), 1)} (language effect ${S.fmt.signed(mean("B") - mean("B-cross"), 1)} pp)` : " (English-prompting country, no B-cross cell)"}, Version C ${S.fmt.n(mean("C"), 1)} (local-context effect ${S.fmt.signed(mean("C") - mean("B"), 1)} pp). Raw cell means; the pooled regression estimates are in Section 4.3.</p>`);
      }
      select(ctl, "Country", countriesSorted.map((x) => [x.key, x.name]), c, (v) => { c = v; draw(); });
      draw();
      setLegend(panel, F.legendHTML(series.map((s) => ({ label: s.label, color: s.color, kind: "dot" }))));
      links("ver-links", { table: () => ch.table(), paper: { href: "results.html#fig:decomp", label: "Figure 3 in the paper" } });
    })();

    // ---- 5. age ----
    (function () {
      const panel = document.getElementById("p-age"), ctl = document.getElementById("age-controls"), chart = document.getElementById("age-chart");
      let c = "Sweden", ch = null;
      const series = [{ key: "30", label: "Age 30", shape: "triangle", color: css("--series-3") }, { key: "40", label: "Age 40", shape: "circle", color: css("--series-1") }, { key: "55", label: "Age 55", shape: "square", color: css("--series-4") }];
      function draw() {
        const rows = I.models.map((m) => ({ label: m.label, marks: [30, 40, 55].map((a) => { const r = cell(c, m.key, "B", "Q1", a); return r ? { key: String(a), x: r.mean * 100 } : null; }).filter(Boolean) }))
          .sort((a, b) => (a.marks.find((m) => m.key === "40") || {}).x - (b.marks.find((m) => m.key === "40") || {}).x);
        ch = F.dotPlot(chart, { rows, series, xdomain: [0, 100], xtitle: `${cname(c)}: mean recommended equity share (percent), Version B, Q1`, labelTitle: "Model", left: 130 });
        const mean = (a) => d3.mean(rows, (r) => (r.marks.find((m) => m.key === a) || {}).x);
        panel.querySelector(".age-summary")?.remove();
        chart.insertAdjacentHTML("beforebegin", `<p class="spec-summary age-summary">${S.esc(cname(c))}, mean across models: age 30 ${S.fmt.n(mean("30"), 1)}, age 40 ${S.fmt.n(mean("40"), 1)}, age 55 ${S.fmt.n(mean("55"), 1)} percent. The 100-minus-age rule gives 70, 60 and 45.</p>`);
      }
      select(ctl, "Country", countriesSorted.map((x) => [x.key, x.name]), c, (v) => { c = v; draw(); });
      draw();
      setLegend(panel, F.legendHTML(series.map((s) => ({ label: s.label, color: s.color, kind: "dot" }))));
      links("age-links", { table: () => ch.table(), paper: { href: "results.html#fig:age-rule", label: "Figure 4 in the paper" } });
    })();

    // ---- 6. stated investor ----
    (function () {
      const ctl = document.getElementById("stated-controls"), chart = document.getElementById("stated-chart");
      let c = "Sweden";
      const cols = [["v1", "Baseline (Version B)"], ["averse_limited", "Risk-averse, limited pension"], ["averse_generous", "Risk-averse, generous pension"], ["tolerant_limited", "Risk-tolerant, limited pension"], ["tolerant_generous", "Risk-tolerant, generous pension"], ["horizon_1y", "One-year horizon"], ["horizon_20y", "Twenty-year horizon"]];
      function draw() {
        const rows = I.models.map((m) => [m.label].concat(cols.map(([k]) => { const r = k === "v1" ? cell(c, m.key, "B", "Q1", 40) : cell(c, m.key, "Bgrt", "Q1", 40, k); return r ? r.mean * 100 : null; })));
        const means = cols.map((_, i) => d3.mean(rows, (r) => r[i + 1]));
        chart.innerHTML = `<div class="table-wrap"><table class="data-table"><thead><tr><th>Model</th>${cols.map(([, l]) => `<th>${l}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr><th scope="row">${S.esc(r[0])}</th>${r.slice(1).map((v) => `<td>${S.fmt.n(v, 1)}</td>`).join("")}</tr>`).join("")}<tr class="rule"><th scope="row"><strong>Mean across models</strong></th>${means.map((v) => `<td><strong>${S.fmt.n(v, 1)}</strong></td>`).join("")}</tr></tbody></table></div><p class="small muted">Mean recommended equity share in percent, fifty responses per cell. The pooled regression estimates (H11 to H13) are in Section 6 and Appendix Table A6.</p>`;
      }
      select(ctl, "Country", countriesSorted.map((x) => [x.key, x.name]), c, (v) => { c = v; draw(); });
      draw();
    })();
  }).catch((e) => console.error(e));
})();
