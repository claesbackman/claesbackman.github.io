/* Model tracking page: the July 2026 collection beside the September 2026 wave. */
(function () {
  "use strict";
  const S = window.Site, F = window.ChartsFA;
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
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
  function tableToggle(linksId, chartId, tableFn) {
    const box = document.getElementById(linksId); const chart = document.getElementById(chartId);
    const tbtn = document.createElement("button"); tbtn.type = "button"; tbtn.textContent = "Table view"; let table = null;
    tbtn.addEventListener("click", () => {
      if (!table) { table = document.createElement("div"); table.className = "fig-table"; table.innerHTML = tableFn(); chart.insertAdjacentElement("afterend", table); chart.hidden = true; tbtn.textContent = "Chart view"; }
      else { table.remove(); table = null; chart.hidden = false; tbtn.textContent = "Table view"; }
    });
    box.innerHTML = ""; box.appendChild(tbtn);
  }
  const setLegend = (panel, html) => { const old = panel.querySelector(".legend"); if (old) old.remove(); if (html) panel.querySelector(".fig-controls").insertAdjacentHTML("afterend", html); };
  const decYear = (d) => { if (!d) return null; const t = new Date(d); return t.getFullYear() + (t - new Date(t.getFullYear(), 0, 1)) / (365.25 * 86400000); };
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "unknown");

  S.data("tracking").then((TR) => {
    const waves = TR.waves;
    const CO = TR.countryOrder;
    const cname = (c) => ({ USA: "United States", UK: "United Kingdom" }[c] || c);
    const FILTERS = [{ key: "all", label: "All models" }, { key: "paper", label: "Paper's panel" }, { key: "new", label: "New since the paper" }, { key: "anchor", label: "Anchors" }];
    const keep = (m, f) => f === "all" || (f === "paper" && m.paper) || (f === "new" && !m.paper) || (f === "anchor" && m.anchor);

    // ---- tiles ----
    const V = (TR.stats && TR.stats.variance) || [];
    const QC = (TR.stats && TR.stats.qc) || [];
    const tile = (l, val, sub) => `<div class="stat"><div class="label">${l}</div><div class="value">${val}</div><div class="sub">${sub}</div></div>`;
    document.getElementById("tr-stats").innerHTML = waves.map((w, i) => {
      const v = V.find((x) => String(x.wave_date) === w.date) || {}, q = QC.find((x) => String(x.wave_date) === w.date) || {};
      const shown = w.models.filter((m) => !m.partial);
      const nNew = w.models.filter((m) => !m.paper).length, nAnch = w.models.filter((m) => m.anchor).length;
      return tile(w.label, `${shown.length} models`, `${nNew ? nNew + " new since the paper, " : "the paper's panel, "}${nAnch} anchors · ${q.kept ? Number(q.kept).toLocaleString("en-GB") + " responses kept" : ""}`) +
        tile(`Variance explained, ${i === 0 ? "July" : "September"}`, v.share_model != null ? `${Math.round(v.share_model)}% · ${Math.round(v.share_country)}%` : "–", "model · country (English slice)");
    }).join("");

    // ---- 1. wave strip ----
    (function () {
      const panel = document.getElementById("p-wave"), ctl = document.getElementById("wave-controls"), chart = document.getElementById("wave-chart");
      let wi = waves.length - 1, filter = "all", sort = "mean", highlight = null, ch = null, rows = [];
      function draw() {
        const w = waves[wi];
        rows = w.models.filter((m) => keep(m, filter)).map((m) => {
          const cells = w.cells[m.slug] || {};
          const pts = CO.filter((c) => cells[c]).map((c) => ({ key: c, label: cname(c), x: cells[c].mean, n: cells[c].n }));
          return { key: m.slug, label: m.name + (m.anchor ? " ◆" : "") + (m.partial ? " (partial)" : ""), mean: m.mean, spread: m.spread, released: m.released, points: pts };
        });
        rows.sort((a, b) => sort === "mean" ? a.mean - b.mean : sort === "spread" ? b.spread - a.spread : (a.released || "9999").localeCompare(b.released || "9999"));
        const all = rows.flatMap((r) => r.points.map((p) => p.x));
        ch = F.strip(chart, { rows, highlight, rowH: 22, width: 760, xdomain: [Math.max(0, Math.floor(d3.min(all) / 10) * 10 - 5), Math.min(100, Math.ceil(d3.max(all) / 10) * 10 + 5)], xtitle: `Mean recommended equity share (percent), ${w.label}`, onHighlight: (k) => { highlight = k; } });
        setLegend(panel, ch.legend() + '<div class="legend"><span class="key muted">◆ marks an anchor model, queried under the same identifier in every wave</span></div>');
        const below = rows.reduce((acc, r) => { const us = (w.cells[r.key] || {}).USA; if (!us) return acc; r.points.forEach((p) => { if (p.key !== "USA") { acc.n++; if (p.x < us.mean) acc.b++; } }); return acc; }, { n: 0, b: 0 });
        document.getElementById("wave-summary").innerHTML = `${rows.length} models shown. Model means from ${S.fmt.n(d3.min(rows, (r) => r.mean), 1)} to ${S.fmt.n(d3.max(rows, (r) => r.mean), 1)} percent; country spread within a model from ${S.fmt.n(d3.min(rows, (r) => r.spread), 1)} to ${S.fmt.n(d3.max(rows, (r) => r.spread), 1)} points. <strong>${below.n ? Math.round(100 * below.b / below.n) : 0}%</strong> of non-U.S. cells lie below the model's own U.S. cell.`;
      }
      pills(ctl, "Wave", waves.map((w, i) => ({ key: i, label: w.label })), wi, (v) => { wi = +v; draw(); });
      pills(ctl, "Models", FILTERS, filter, (v) => { filter = v; draw(); });
      pills(ctl, "Sort by", [{ key: "mean", label: "Mean" }, { key: "spread", label: "Country spread" }, { key: "released", label: "Release date" }], sort, (v) => { sort = v; draw(); });
      draw();
      tableToggle("wave-links", "wave-chart", () => ch.table());
      const a = document.createElement("a"); a.href = "#"; a.textContent = "Download (CSV)"; a.addEventListener("click", (e) => { e.preventDefault(); const w = waves[wi]; S.download(`tracking_${w.date}.csv`, S.toCSV(rows.flatMap((r) => r.points.map((p) => ({ wave: w.date, model: r.key, country: p.label, mean_pct: p.x, n: p.n }))), ["wave", "model", "country", "mean_pct", "n"])); });
      document.getElementById("wave-links").appendChild(a);
    })();

    // ---- 2. anchors ----
    (function () {
      const panel = document.getElementById("p-anchor"), ctl = document.getElementById("anchor-controls"), chart = document.getElementById("anchor-chart");
      const first = waves[0], last = waves[waves.length - 1];
      const anchors = last.models.filter((m) => m.anchor && first.models.some((x) => x.slug === m.slug));
      const series = [{ key: "first", label: first.label, shape: "circle", color: css("--series-1") }, { key: "last", label: last.label, shape: "triangle", color: css("--series-2") }];
      let country = "all", ch = null;
      function val(w, slug) { const m = w.models.find((x) => x.slug === slug); if (country === "all") return m ? m.mean : null; const c = (w.cells[slug] || {})[country]; return c ? c.mean : null; }
      function draw() {
        const rows = anchors.map((m) => ({ label: m.name, marks: [{ key: "first", x: val(first, m.slug) }, { key: "last", x: val(last, m.slug) }].filter((q) => q.x != null) })).sort((a, b) => a.marks[0].x - b.marks[0].x);
        ch = F.dotPlot(chart, { rows, series, xdomain: [0, 100], xtitle: country === "all" ? "Mean recommended equity share across countries (percent)" : `Mean recommended equity share in ${cname(country)} (percent)`, labelTitle: "Model", left: 150, rowH: 22 });
        setLegend(panel, ch.legend());
      }
      const sel = document.createElement("select");
      [["all", "Mean across countries"]].concat(CO.map((c) => [c, cname(c)])).forEach(([k, l]) => { const o = document.createElement("option"); o.value = k; o.textContent = l; sel.appendChild(o); });
      sel.addEventListener("change", () => { country = sel.value; draw(); });
      const lab = document.createElement("label"); lab.className = "ctl-group"; lab.innerHTML = '<span class="ctl-label">Show</span>'; lab.appendChild(sel); ctl.appendChild(lab);
      draw();
      const A = (TR.stats && TR.stats.anchors) || [];
      if (A.length) {
        document.getElementById("anchor-table").innerHTML = `<div class="table-wrap"><table class="data-table"><thead><tr><th>Model</th><th>July mean</th><th>September mean</th><th>Change (pp)</th><th>Paired change across countries (se)</th><th>Largest cell change (pp)</th><th>Noise-corrected country SD, July → Sept.</th></tr></thead><tbody>${A.slice().sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).map((r) => `<tr><th scope="row">${S.esc(r.name)}</th><td>${S.fmt.n(r.mean_first, 1)}</td><td>${S.fmt.n(r.mean_last, 1)}</td><td>${S.fmt.signed(r.diff, 1)}</td><td>${S.fmt.signed(r.diff_paired, 1)} (${S.fmt.n(r.se_paired, 2)})</td><td>${S.fmt.n(r.maxcell, 1)}</td><td>${S.fmt.n(r.sdc_first, 1)} → ${S.fmt.n(r.sdc_last, 1)}</td></tr>`).join("")}</tbody></table></div><p class="small muted">From Appendix Table A17, Panel B. The paired change averages the September-minus-July difference over the twenty-one countries. Four of the seven anchors return the same average advice within half a point; DeepSeek V4 Flash moved by 8.5 points.</p>`;
      }
    })();

    // ---- 3. vintage ----
    (function () {
      const panel = document.getElementById("p-vintage"), ctl = document.getElementById("vintage-controls"), chart = document.getElementById("vintage-chart");
      let y = "mean", filter = "all", ch = null;
      const YL = { mean: "Mean recommended equity share (percent)", spread: "Country spread: highest minus lowest country mean (pp)", gap_absmean: "Mean absolute gap vs. the model's U.S. cell (pp)" };
      function draw() {
        const pts = [];
        waves.forEach((w, i) => w.models.filter((m) => keep(m, filter) && m.released && !m.partial).forEach((m) => pts.push({ label: m.name, short: m.name, x: decYear(m.released), y: m[y], shape: i === 0 ? "circle" : "triangle", color: i === 0 ? css("--series-1") : css("--series-2"), open: i === 0, note: `${w.label} · released ${fmtDate(m.released)}${m.anchor ? " · anchor" : ""}` })));
        ch = F.scatterLabeled(chart, { points: pts, xtitle: "Release date on OpenRouter (year)", ytitle: YL[y], width: 720, height: 460, xd: 2, yd: 1, zeroY: false, xtick: d3.format(".1f"), xdomain: [2025.5, 2026.9], ydomain: [0, Math.max(10, d3.max(pts, (p) => p.y) * 1.08)] });
        setLegend(panel, F.legendHTML([{ label: waves[0].label, color: css("--series-1"), kind: "dot" }, { label: waves[waves.length - 1].label, color: css("--series-2"), kind: "dot" }]));
      }
      pills(ctl, "Vertical axis", [{ key: "mean", label: "Mean equity share" }, { key: "spread", label: "Country spread" }, { key: "gap_absmean", label: "Mean |gap vs U.S.|" }], y, (v) => { y = v; draw(); });
      pills(ctl, "Models", FILTERS, filter, (v) => { filter = v; draw(); });
      draw();
      tableToggle("vintage-links", "vintage-chart", () => ch.table());
    })();

    // ---- 4. heatmap ----
    (function () {
      const ctl = document.getElementById("heat-controls"), chart = document.getElementById("heat-chart");
      let wi = waves.length - 1;
      function draw() {
        const w = waves[wi];
        const models = w.models.filter((m) => !m.partial).slice().sort((a, b) => a.mean - b.mean);
        const vals = models.flatMap((m) => CO.map((c) => ((w.cells[m.slug] || {})[c] || {}).mean)).filter((v) => v != null);
        const lo = d3.min(vals), hi = d3.max(vals);
        const color = d3.scaleSequential(d3.interpolateBlues).domain([lo - (hi - lo) * 0.3, hi]);
        const cellHtml = (m, c) => { const x = (w.cells[m.slug] || {})[c]; if (!x) return "<td>–</td>"; const bg = color(x.mean); const dark = d3.hsl(bg).l < 0.55; return `<td style="background:${bg};color:${dark ? "#fff" : "#111"};text-align:center" title="${S.esc(m.name)} · ${S.esc(cname(c))}: mean ${S.fmt.n(x.mean, 1)}, sd ${S.fmt.n(x.sd, 1)}, n = ${x.n}">${S.fmt.n(x.mean, 0)}</td>`; };
        chart.innerHTML = `<div class="table-wrap"><table class="data-table heat"><thead><tr><th>Country</th>${models.map((m) => `<th style="writing-mode:vertical-rl;transform:rotate(180deg);text-align:left;padding:.4rem .2rem">${S.esc(m.name)}${m.anchor ? " ◆" : ""}</th>`).join("")}</tr></thead><tbody>${CO.map((c) => `<tr${c === "USA" ? ' style="outline:2px solid #111"' : ""}><th scope="row">${S.esc(cname(c))}</th>${models.map((m) => cellHtml(m, c)).join("")}</tr>`).join("")}</tbody></table></div><p class="small muted">${w.label}: ${models.length} models × ${CO.length} countries, mean recommended equity share in percent. Darker is more equity.</p>`;
      }
      pills(ctl, "Wave", waves.map((w, i) => ({ key: i, label: w.label })), wi, (v) => { wi = +v; draw(); });
      draw();
    })();
  }).catch((e) => console.error(e));
})();
