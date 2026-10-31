/* Renders every <figure class="paper-figure"> on a paper page from the
   aggregate tables in data/ (tables.json, hist.json, index.json). Each
   figure gets controls where they make sense, a table view, a CSV download
   of the plotted numbers and a link to the paper's static image. */
(function () {
  "use strict";
  const S = window.Site, C = window.Charts, F = window.ChartsFA;
  const figs = Array.from(document.querySelectorAll("figure.paper-figure"));
  if (!figs.length) return;
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const QL = { Q1: "Q1 portfolio", Q2: "Q2 mortgage", Q4: "Q3 inflation" };

  function links(fig, state) {
    const box = fig.querySelector(".fig-links");
    box.innerHTML = "";
    if (state.table) {
      const tbtn = document.createElement("button");
      tbtn.type = "button"; tbtn.textContent = "Table view";
      tbtn.addEventListener("click", () => {
        const t = fig.querySelector(".fig-table"), c = fig.querySelector(".fig-chart");
        const showTable = t.hidden;
        if (showTable) t.innerHTML = state.table();
        t.hidden = !showTable; c.hidden = showTable;
        tbtn.textContent = showTable ? "Chart view" : "Table view";
      });
      box.appendChild(tbtn);
    }
    if (state.explore) { const a = document.createElement("a"); a.href = state.explore; a.textContent = state.exploreLabel || "Open in the country effects explorer"; box.appendChild(a); }
    const imgs = (fig.dataset.images || "").split(",").filter(Boolean);
    if (imgs.length) { const a = document.createElement("a"); a.href = "figures/" + imgs[0] + ".png"; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Paper version (static image)"; box.appendChild(a); }
    if (state.download) {
      const a = document.createElement("a"); a.href = "#"; a.textContent = "Download the plotted numbers (CSV)";
      a.addEventListener("click", (e) => { e.preventDefault(); state.download(); });
      box.appendChild(a);
    }
  }
  const dl = (fig, rows, cols) => () => S.download(fig.id.replace(":", "_") + ".csv", S.toCSV(rows, cols));

  function staticFallback(fig) {
    const imgs = (fig.dataset.images || "").split(",").filter(Boolean);
    fig.querySelector(".fig-chart").innerHTML = `<div class="fig-static">${imgs.map((i) => `<img src="figures/${i}.png" alt="${S.esc(fig.querySelector(".fig-title").textContent)}" loading="lazy">`).join("")}</div>`;
  }

  function pills(group, label, options, value, onChange) {
    const wrap = document.createElement("div"); wrap.className = "ctl-group";
    const l = document.createElement("span"); l.className = "ctl-label"; l.textContent = label; wrap.appendChild(l);
    options.forEach((o) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "pill"; b.textContent = o.label;
      b.setAttribute("aria-pressed", String(o.key) === String(value) ? "true" : "false");
      b.addEventListener("click", () => { wrap.querySelectorAll(".pill").forEach((p) => p.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); onChange(o.key); });
      wrap.appendChild(b);
    });
    group.appendChild(wrap);
    return wrap;
  }
  function setLegend(fig, html) {
    const old = fig.querySelector(".legend"); if (old) old.remove();
    if (html) fig.querySelector(".fig-controls").insertAdjacentHTML("afterend", html);
  }

  // ---- Figure 1: distribution of recommended equity shares ----
  function renderHist(fig, H, I) {
    const ctl = fig.querySelector(".fig-controls"), chart = fig.querySelector(".fig-chart");
    const values = H.values.map((v) => Math.round(v * 100));
    let group = "pooled", ch = null;
    function counts() { return group === "pooled" ? H.pooled : H.by_model[group]; }
    function draw() {
      ch = F.bars(chart, { values, counts: counts(), xtitle: "Recommended equity share (percent)", annotate: group === "pooled" ? { value: 60, label: "the 60/40 portfolio" } : null });
    }
    ctl.innerHTML = "";
    const sel = document.createElement("select");
    [["pooled", "All models pooled"]].concat(I.models.map((m) => [m.key, m.label])).forEach(([k, l]) => { const o = document.createElement("option"); o.value = k; o.textContent = l; sel.appendChild(o); });
    sel.addEventListener("change", () => { group = sel.value; draw(); });
    const lab = document.createElement("label"); lab.className = "ctl-group"; lab.innerHTML = '<span class="ctl-label">Responses from</span>'; lab.appendChild(sel); ctl.appendChild(lab);
    draw();
    links(fig, { table: () => ch.table(), download: () => { const rows = values.map((v, i) => ({ equity_share_pct: v, responses: counts()[i] })); S.download("fig_dist.csv", S.toCSV(rows, ["equity_share_pct", "responses"])); } });
  }

  // ---- Figure 2 (and the per-question variants): country effects ----
  function renderCountryFE(fig, T, q) {
    const ctl = fig.querySelector(".fig-controls"), chart = fig.querySelector(".fig-chart");
    const rows = T.countryfe[q].slice().sort((a, b) => b.b - a.b);
    let holm = true, ch = null;
    function draw() {
      ch = C.dotRange(chart, { items: rows.map((r) => ({ label: r.name, b: r.b, lo: r.lo, hi: r.hi, sig: (holm ? r.p_holm : r.p) < 0.05, N: null })), xtitle: "Effect on recommended equity share vs. the U.S. baseline (percentage points)", labelTitle: "Country", width: 620 });
    }
    ctl.innerHTML = "";
    pills(ctl, "Colour significant contrasts by", [{ key: 1, label: "Holm-corrected p < 0.05" }, { key: 0, label: "Uncorrected wild p < 0.05" }], 1, (v) => { holm = !!v; draw(); });
    draw();
    setLegend(fig, F.legendHTML([{ label: "Significant, negative", color: css("--neg"), kind: "dot" }, { label: "Significant, positive", color: css("--pos"), kind: "dot" }, { label: "Not significant", color: css("--chart-ink-2"), kind: "dot" }, { label: "95% wild cluster bootstrap CI", color: css("--chart-muted") }]));
    links(fig, { table: () => `<div class="table-wrap"><table class="data-table"><thead><tr><th>Country</th><th>Effect (pp)</th><th>95% CI</th><th>p (wild)</th><th>p (Holm)</th></tr></thead><tbody>${rows.map((r) => `<tr><th scope="row">${S.esc(r.name)}</th><td>${S.fmt.signed(r.b, 2)}</td><td>[${S.fmt.signed(r.lo, 2)}, ${S.fmt.signed(r.hi, 2)}]</td><td>${S.fmt.p(r.p)}</td><td>${S.fmt.p(r.p_holm)}</td></tr>`).join("")}</tbody></table></div>`,
      explore: `explorer.html?q=${q}`, download: dl(fig, rows.map((r) => ({ country: r.name, effect_pp: r.b, ci_lo: r.lo, ci_hi: r.hi, p_wild: r.p, p_holm: r.p_holm })), ["country", "effect_pp", "ci_lo", "ci_hi", "p_wild", "p_holm"]) });
  }

  // ---- Figure 3: decomposition ----
  function renderDecomp(fig, T) {
    const rows = T.decomp.slice().sort((a, b) => b.total - a.total);
    const series = [{ key: "name", label: "Country name", color: css("--series-1") }, { key: "lang", label: "Language", color: css("--series-2") }, { key: "local", label: "Local context", color: css("--series-3") }];
    const ch = F.stackedBars(fig.querySelector(".fig-chart"), { rows: rows.map((r) => ({ label: r.name, parts: [{ key: "name", v: r.name_comp }, { key: "lang", v: r.lang_comp }, { key: "local", v: r.local_comp }], total: r.total })), series, xtitle: "Equity share relative to the U.S. baseline (percentage points)" });
    setLegend(fig, ch.legend());
    links(fig, { table: () => ch.table(), download: dl(fig, rows.map((r) => ({ country: r.name, country_name_pp: r.name_comp, language_pp: r.lang_comp, local_context_pp: r.local_comp, total_pp: r.total })), ["country", "country_name_pp", "language_pp", "local_context_pp", "total_pp"]) });
  }

  // ---- Figure 5: three questions ----
  function renderThreeQ(fig, T) {
    const ctl = fig.querySelector(".fig-controls"), chart = fig.querySelector(".fig-chart");
    const order = T.countryfe.Q1.slice().sort((a, b) => b.b - a.b).map((r) => r.country);
    const series = [{ key: "Q1", label: "Q1 portfolio", shape: "circle", color: css("--series-1") }, { key: "Q2", label: "Q2 mortgage", shape: "triangle", color: css("--series-5") }, { key: "Q4", label: "Q3 inflation", shape: "square", color: css("--series-3") }];
    const rows = order.map((c) => ({ label: T.countryfe.Q1.find((r) => r.country === c).name, marks: ["Q1", "Q2", "Q4"].map((q) => { const r = T.countryfe[q].find((x) => x.country === c); return r ? { key: q, x: r.b, lo: r.lo, hi: r.hi, p: r.p, sig: r.p_holm < 0.05 } : null; }).filter(Boolean) }));
    let showCI = null, ch = null;
    function draw() { ch = F.dotPlot(chart, { rows, series, showCI, xtitle: "Country effect relative to the U.S. baseline (percentage points)" }); }
    ctl.innerHTML = "";
    pills(ctl, "Show 95% CI for", [{ key: "none", label: "None" }, { key: "Q1", label: "Q1" }, { key: "Q2", label: "Q2" }, { key: "Q4", label: "Q3" }], "none", (v) => { showCI = v === "none" ? null : v; draw(); });
    draw();
    setLegend(fig, ch.legend() + '<div class="legend"><span class="key muted">Open markers: not significant after the Holm correction within that question\'s family</span></div>');
    links(fig, { table: () => ch.table(), explore: "explorer.html", download: dl(fig, rows.flatMap((r) => r.marks.map((m) => ({ country: r.label, question: QL[m.key], effect_pp: m.x, ci_lo: m.lo, ci_hi: m.hi, p_wild: m.p }))), ["country", "question", "effect_pp", "ci_lo", "ci_hi", "p_wild"]) });
  }

  // ---- Figure 6: GPS risk-taking and financial literacy ----
  function renderGPS(fig, T) {
    const chart = fig.querySelector(".fig-chart");
    chart.innerHTML = "";
    const grid = document.createElement("div"); grid.className = "chart-grid cols-2"; chart.appendChild(grid);
    const charts = [];
    [["risk_taking", "A. GPS risk-taking (H7)", "GPS risk-taking (country mean)", css("--series-1")], ["finlit", "B. Financial literacy (H8)", "Financial literacy (share of adults)", css("--series-2")]].forEach(([k, title, xt, color]) => {
      const cell = document.createElement("div"); const t = document.createElement("div"); t.className = "chart-cell-title"; t.textContent = title; cell.appendChild(t);
      const box = document.createElement("div"); cell.appendChild(box); grid.appendChild(cell);
      const pts = T.gps.points.map((p) => ({ label: p.name, x: p[k], y: p.b, color, open: true, shape: "diamond" }));
      const sl = T.gps.slopes[k];
      const mx = d3.mean(pts, (p) => p.x), my = d3.mean(pts, (p) => p.y);
      const ch = F.scatterLabeled(box, { points: pts, xtitle: xt, ytitle: "Country effect, Q1 (pp)", width: 440, height: 380, xd: 2, yd: 1, lines: [{ slope: sl.b, intercept: my - sl.b * mx, color, dash: "6,4", label: `Slope ${S.fmt.signed(sl.b, 2)} pp per unit (HC2 se ${S.fmt.n(sl.se, 2)}), wild p = ${S.fmt.p(sl.p)}` }] });
      charts.push({ title, ch });
    });
    setLegend(fig, charts.map((c) => c.ch.legend()).join(""));
    links(fig, { table: () => charts.map((c) => `<h4 class="chart-cell-title">${S.esc(c.title)}</h4>` + c.ch.table()).join(""), download: dl(fig, T.gps.points.map((p) => ({ country: p.name, risk_taking: p.risk_taking, finlit: p.finlit, country_effect_pp: p.b })), ["country", "risk_taking", "finlit", "country_effect_pp"]) });
  }

  // ---- Figure 7: mortgage question against the benchmark ----
  function renderBenchQ2(fig, T) {
    const pts = T.benchq2.map((r) => ({ label: r.name, x: r.alpha, y: r.advice, shape: r.premise ? "triangle" : "square", color: r.premise ? css("--series-5") : css("--series-1"), open: !r.premise, note: r.premise ? "Premise-acceptance group (counterfactual 4% rate)" : `Benchmark range [${S.fmt.n(r.lo, 2)}, ${S.fmt.n(r.hi, 2)}]` }));
    const ch = F.scatterLabeled(fig.querySelector(".fig-chart"), { points: pts, xdomain: [0, 1], ydomain: [0, 1], xtitle: "Benchmark α (Q2): share to invest rather than prepay", ytitle: "Mean Q2 advice (share to invest)", width: 560, height: 480, zeroY: false, lines: [{ slope: 1, intercept: 0, dash: "6,4", label: "45-degree line: advice equals the benchmark" }], extraCols: [{ label: "Gap", fmt: (p) => S.fmt.signed(p.y - p.x, 2) }] });
    setLegend(fig, ch.legend() + F.legendHTML([{ label: "Country (stated 4% mortgage rate taken as given)", color: css("--series-1"), kind: "dot" }, { label: "Premise-acceptance group (counterfactual 4% rate)", color: css("--series-5"), kind: "dot" }]));
    links(fig, { table: () => ch.table(), download: dl(fig, T.benchq2.map((r) => ({ country: r.name, mean_advice: r.advice, benchmark_alpha: r.alpha, benchmark_lo: r.lo, benchmark_hi: r.hi, gap: r.gap, premise_group: r.premise })), ["country", "mean_advice", "benchmark_alpha", "benchmark_lo", "benchmark_hi", "gap", "premise_group"]) });
  }

  // ---- Figure 8: balance-sheet probes ----
  function renderCoefs(fig, T, cfg) {
    const src = T[cfg.key];
    const rows = (cfg.orders || src.map((r) => r.order)).map((o) => src.find((r) => r.order === o)).filter(Boolean);
    const clean = (s) => s.replace(/\(Merton:[^)]*\)/, "").replace(/\$\\sigma_c\$/g, "σ").replace(/\$\\times\$/g, "×").replace(/\$[^$]*\$/g, "").replace(/\s+/g, " ").trim();
    const ch = C.dotRange(fig.querySelector(".fig-chart"), { items: rows.map((r) => ({ label: clean(r.label), b: r.b, lo: r.lo, hi: r.hi, sig: r.p < 0.05 })), xtitle: cfg.xtitle || "Effect on recommended equity share (percentage points)", labelTitle: "Statement", width: 680, left: 230 });
    setLegend(fig, F.legendHTML([{ label: "Significant, lowers the equity share", color: css("--neg"), kind: "dot" }, { label: "Significant, raises the equity share", color: css("--pos"), kind: "dot" }, { label: "Not significant at 5%", color: css("--chart-ink-2"), kind: "dot" }]));
    links(fig, { table: () => ch.table(), download: dl(fig, rows.map((r) => ({ statement: clean(r.label), effect_pp: r.b, ci_lo: r.lo, ci_hi: r.hi, p_wild: r.p })), ["statement", "effect_pp", "ci_lo", "ci_hi", "p_wild"]) });
  }

  // ---- Figure 9: local context in the explanation text ----
  function renderLocalCtx(fig, T) {
    const rows = T.localctx.slice().sort((a, b) => b.b - a.b);
    const ch = F.dumbbell(fig.querySelector(".fig-chart"), { rows: rows.map((r) => ({ label: r.name, a: r.b, b: r.c })), labels: { a: "Version B: generic instruments", b: "Version C: local instruments named" }, xtitle: "Explanations referring to local financial context (percent)" });
    setLegend(fig, ch.legend());
    links(fig, { table: () => ch.table(), download: dl(fig, rows.map((r) => ({ country: r.name, version_B_pct: r.b, version_C_pct: r.c })), ["country", "version_B_pct", "version_C_pct"]) });
  }

  // ---- Appendix Figure A5: calibration slope ----
  function renderKappa(fig, T) {
    const pts = T.benchmark.filter((r) => r.country !== "USA").map((r) => ({ label: r.name, x: r.delta * 100, y: r.b, shape: "triangle", open: true, color: css("--series-1") }));
    const k = T.kappa;
    const mx = d3.mean(pts, (p) => p.x), my = d3.mean(pts, (p) => p.y);
    const ch = F.scatterLabeled(fig.querySelector(".fig-chart"), { points: pts, xtitle: "Benchmark deviation from the U.S., δ* (percentage points)", ytitle: "Country effect on Q1 advice (pp)", width: 600, height: 440, xd: 1, yd: 1,
      lines: [{ slope: 1, intercept: 0, dash: "8,5", color: "#888", label: "κ = 1: full calibration (45-degree line through the origin)" }, { slope: 0, intercept: my, dash: "2,3", color: "#aaa", label: "κ = 0: the U.S. default everywhere" }, { slope: k.kappa, intercept: my - k.kappa * mx, color: css("--series-5"), width: 2, label: `Fitted κ = ${S.fmt.n(k.kappa, 2)} (HC2 se ${S.fmt.n(k.se, 2)}), wild p(κ = 0) = ${S.fmt.p(k.p0)}, p(κ = 1) = ${S.fmt.p(k.p1)}` }] });
    setLegend(fig, ch.legend());
    links(fig, { table: () => ch.table(), download: dl(fig, T.benchmark.map((r) => ({ country: r.name, benchmark_deviation_pp: r.delta * 100, country_effect_pp: r.b, mean_advice: r.advice, alpha_s: r.alpha_s })), ["country", "benchmark_deviation_pp", "country_effect_pp", "mean_advice", "alpha_s"]) });
  }

  // ---- dispatch ----
  Promise.all([S.data("figures"), S.data("tables"), S.data("index")]).then(([FIG, T, I]) => {
    const needHist = figs.some((f) => (FIG[f.id] || {}).type === "hist");
    (needHist ? S.data("hist") : Promise.resolve(null)).then((H) => {
      figs.forEach((fig) => {
        const cfg = FIG[fig.id];
        try {
          if (!cfg || cfg.type === "static") { staticFallback(fig); links(fig, {}); }
          else if (cfg.type === "hist") renderHist(fig, H, I);
          else if (cfg.type === "countryfe") renderCountryFE(fig, T, cfg.q);
          else if (cfg.type === "decomp") renderDecomp(fig, T);
          else if (cfg.type === "threeq") renderThreeQ(fig, T);
          else if (cfg.type === "gps") renderGPS(fig, T);
          else if (cfg.type === "benchq2") renderBenchQ2(fig, T);
          else if (cfg.type === "coefs") renderCoefs(fig, T, cfg);
          else if (cfg.type === "localctx") renderLocalCtx(fig, T);
          else if (cfg.type === "kappa") renderKappa(fig, T);
          else { staticFallback(fig); links(fig, {}); }
          if (cfg && cfg.sitenote) fig.querySelector(".fig-notes").insertAdjacentHTML("beforeend", ` <span class="notes-label">Website version:</span> ${S.esc(cfg.sitenote)}`);
        } catch (e) {
          console.error(fig.id, e);
          staticFallback(fig); links(fig, {});
        }
      });
    });
  }).catch((e) => { console.error(e); figs.forEach((fig) => { staticFallback(fig); links(fig, {}); }); });
})();
