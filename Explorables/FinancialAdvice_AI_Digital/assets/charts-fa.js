/* Chart components specific to this paper (D3 v7), in the style of charts.js:
   every component draws an SVG inside the container, ships a hover layer and
   exposes table() for the accessible table twin. */
window.ChartsFA = (function () {
  "use strict";
  const S = window.Site;
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const col = (k) => css("--series-" + k);
  const INK2 = () => css("--chart-ink-2");

  function svgIn(container, width, height, margin) {
    const el = typeof container === "string" ? document.querySelector(container) : container;
    el.innerHTML = "";
    const svg = d3.select(el).append("svg").attr("class", "chart").attr("viewBox", `0 0 ${width} ${height}`).attr("width", "100%").attr("role", "img");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    return { svg, g, w: width - margin.left - margin.right, h: height - margin.top - margin.bottom, el };
  }
  const tableWrap = (head, rows) => `<div class="table-wrap"><table class="data-table"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`).join("")}</tbody></table></div>`;
  const legendHTML = (items) => `<div class="legend">${items.map((i) => `<span class="key"><span class="swatch ${i.kind || ""}" style="background:${i.color}"></span>${S.esc(i.label)}</span>`).join("")}</div>`;
  const symbol = (shape, size) => d3.symbol().type(shape === "triangle" ? d3.symbolTriangle : shape === "square" ? d3.symbolSquare : shape === "diamond" ? d3.symbolDiamond : d3.symbolCircle).size(size || 64);

  /* ---- bars: a bar at each value (percent of responses) ---- */
  function bars(container, opts) {
    const width = opts.width || 620, height = opts.height || 320;
    const margin = { top: 24, right: 16, bottom: 44, left: 48 };
    const { g, w, h } = svgIn(container, width, height, margin);
    const total = opts.total || d3.sum(opts.counts);
    const pct = opts.counts.map((c) => (100 * c) / total);
    const x = d3.scaleLinear().domain(opts.xdomain || [0, 100]).range([0, w]);
    const y = d3.scaleLinear().domain([0, Math.max(5, d3.max(pct))]).range([h, 0]).nice();
    const bw = Math.max(4, (x(5) - x(0)) * 0.72);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""));
    g.selectAll("rect").data(pct).enter().append("rect")
      .attr("x", (d, i) => x(opts.values[i]) - bw / 2).attr("width", bw).attr("y", (d) => y(d)).attr("height", (d) => h - y(d))
      .attr("fill", opts.color || col(1)).attr("opacity", 0.85).attr("rx", 1.5)
      .on("pointermove", (ev, d) => { const i = pct.indexOf(d); S.showTip(`<div class="t-title">${opts.values[i]} percent equity</div><div class="t-row"><span class="t-val">${S.fmt.n(d, 1)}%</span><span class="t-lab">of ${total.toLocaleString("en-GB")} responses (${opts.counts[i].toLocaleString("en-GB")})</span></div>`, ev); })
      .on("pointerleave", S.hideTip);
    if (opts.annotate) {
      const i = opts.values.indexOf(opts.annotate.value);
      if (i >= 0) g.append("text").attr("class", "annot").attr("x", x(opts.values[i])).attr("y", y(pct[i]) - 6).attr("text-anchor", "middle").text(opts.annotate.label);
    }
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).ticks(10));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));
    g.append("text").attr("class", "axis-title").attr("x", w / 2).attr("y", h + 36).attr("text-anchor", "middle").text(opts.xtitle || "");
    g.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("x", -h / 2).attr("y", -36).attr("text-anchor", "middle").text(opts.ytitle || "Share of responses (percent)");
    return { table: () => tableWrap(["Equity share (%)", "Responses", "Share (%)"], opts.values.map((v, i) => [v, opts.counts[i].toLocaleString("en-GB"), S.fmt.n(pct[i], 1)])) };
  }

  /* ---- dotPlot: rows with one or more markers, optional CI for one series ---- */
  function dotPlot(container, opts) {
    const rows = opts.rows, series = opts.series;
    const rowH = opts.rowH || 18, width = opts.width || 640;
    const margin = { top: 8, right: 16, bottom: 36, left: opts.left || 110 };
    const height = margin.top + rows.length * rowH + margin.bottom;
    const { g, w } = svgIn(container, width, height, margin);
    const xs = rows.flatMap((r) => r.marks.flatMap((m) => (opts.showCI === m.key && m.lo != null ? [m.lo, m.hi, m.x] : [m.x])));
    let lo = Math.min(0, d3.min(xs)), hi = Math.max(0, d3.max(xs));
    const pad = (hi - lo) * 0.06;
    const x = d3.scaleLinear().domain(opts.xdomain || [lo - pad, hi + pad]).range([0, w]).nice();
    const y = d3.scaleBand().domain(rows.map((r) => r.label)).range([0, rows.length * rowH]);
    g.append("g").attr("class", "grid").call(d3.axisBottom(x).ticks(6).tickSize(rows.length * rowH).tickFormat("")).attr("opacity", 0.6);
    g.append("line").attr("class", "zero").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", rows.length * rowH).attr("stroke-dasharray", "4,3");
    const row = g.selectAll("g.row").data(rows).enter().append("g").attr("class", "row").attr("transform", (d) => `translate(0,${y(d.label) + rowH / 2})`);
    row.each(function (r) {
      const gg = d3.select(this);
      r.marks.forEach((m) => {
        const s = series.find((q) => q.key === m.key);
        if (!s) return;
        if (opts.showCI === m.key && m.lo != null) gg.append("line").attr("x1", x(m.lo)).attr("x2", x(m.hi)).attr("y1", 0).attr("y2", 0).attr("stroke", s.color).attr("stroke-width", 1.4).attr("opacity", 0.8);
        gg.append("path").attr("d", symbol(s.shape, 60)()).attr("transform", `translate(${x(m.x)},0)`)
          .attr("fill", m.sig === false ? "#fff" : s.color).attr("stroke", s.color).attr("stroke-width", 1.5);
      });
    });
    row.append("rect").attr("x", -margin.left).attr("y", -rowH / 2).attr("width", w + margin.left).attr("height", rowH).attr("fill", "transparent")
      .on("pointermove", (ev, r) => S.showTip(`<div class="t-title">${S.esc(r.label)}</div>${r.marks.map((m) => { const s = series.find((q) => q.key === m.key); return s ? `<div class="t-row"><span class="t-key" style="background:${s.color}"></span><span class="t-val">${S.fmt.signed(m.x, 1)}</span><span class="t-lab">${S.esc(s.label)}${m.lo != null ? ` [${S.fmt.signed(m.lo, 1)}, ${S.fmt.signed(m.hi, 1)}]` : ""}${m.p != null ? `, p = ${S.fmt.p(m.p)}` : ""}${m.sig === false ? " (not significant after Holm)" : ""}</span></div>` : ""; }).join("")}`, ev))
      .on("pointerleave", S.hideTip);
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${rows.length * rowH})`).call(d3.axisBottom(x).ticks(6));
    g.append("text").attr("class", "axis-title").attr("x", w / 2).attr("y", rows.length * rowH + 32).attr("text-anchor", "middle").text(opts.xtitle || "");
    return {
      legend: () => legendHTML(series.map((s) => ({ label: s.label, color: s.color, kind: "dot" }))),
      table: () => tableWrap([opts.labelTitle || "Country"].concat(series.flatMap((s) => [s.label, "95% CI", "p (wild)"])),
        rows.map((r) => [S.esc(r.label)].concat(series.flatMap((s) => { const m = r.marks.find((q) => q.key === s.key); return m ? [S.fmt.signed(m.x, 2), m.lo != null ? `[${S.fmt.signed(m.lo, 2)}, ${S.fmt.signed(m.hi, 2)}]` : "–", m.p != null ? S.fmt.p(m.p) + (m.sig === false ? "" : m.sig ? " †" : "") : "–"] : ["–", "–", "–"]; })))),
    };
  }

  /* ---- stackedBars: horizontal stacked bars with a total marker ---- */
  function stackedBars(container, opts) {
    const rows = opts.rows, series = opts.series;
    const rowH = 20, width = opts.width || 640;
    const margin = { top: 8, right: 16, bottom: 36, left: 110 };
    const height = margin.top + rows.length * rowH + margin.bottom;
    const { g, w } = svgIn(container, width, height, margin);
    const ext = rows.flatMap((r) => { let pos = 0, neg = 0; r.parts.forEach((p) => { if (p.v >= 0) pos += p.v; else neg += p.v; }); return [pos, neg, r.total]; });
    const x = d3.scaleLinear().domain([Math.min(0, d3.min(ext)) * 1.05, Math.max(0, d3.max(ext)) * 1.05]).range([0, w]).nice();
    const y = d3.scaleBand().domain(rows.map((r) => r.label)).range([0, rows.length * rowH]).paddingInner(0.25);
    g.append("g").attr("class", "grid").call(d3.axisBottom(x).ticks(6).tickSize(rows.length * rowH).tickFormat("")).attr("opacity", 0.6);
    g.append("line").attr("class", "zero").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", rows.length * rowH);
    rows.forEach((r) => {
      let pos = 0, neg = 0;
      r.parts.forEach((p) => {
        const s = series.find((q) => q.key === p.key);
        const start = p.v >= 0 ? pos : neg;
        const end = start + p.v;
        if (p.v >= 0) pos = end; else neg = end;
        g.append("rect").attr("x", x(Math.min(start, end))).attr("width", Math.abs(x(end) - x(start))).attr("y", y(r.label)).attr("height", y.bandwidth()).attr("fill", s.color).attr("opacity", 0.9)
          .on("pointermove", (ev) => S.showTip(`<div class="t-title">${S.esc(r.label)}</div>${r.parts.map((q) => { const ss = series.find((z) => z.key === q.key); return `<div class="t-row"><span class="t-key" style="background:${ss.color}"></span><span class="t-val">${S.fmt.signed(q.v, 1)}</span><span class="t-lab">${S.esc(ss.label)}</span></div>`; }).join("")}<div class="t-row"><span class="t-key" style="background:#111"></span><span class="t-val">${S.fmt.signed(r.total, 1)}</span><span class="t-lab">Total</span></div>`, ev))
          .on("pointerleave", S.hideTip);
      });
      g.append("path").attr("d", symbol("diamond", 56)()).attr("transform", `translate(${x(r.total)},${y(r.label) + y.bandwidth() / 2})`).attr("fill", "#111").style("pointer-events", "none");
    });
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${rows.length * rowH})`).call(d3.axisBottom(x).ticks(6));
    g.append("text").attr("class", "axis-title").attr("x", w / 2).attr("y", rows.length * rowH + 32).attr("text-anchor", "middle").text(opts.xtitle || "");
    return {
      legend: () => legendHTML(series.map((s) => ({ label: s.label, color: s.color, kind: "area" })).concat([{ label: "Total (Version C vs. U.S.)", color: "#111", kind: "dot" }])),
      table: () => tableWrap(["Country"].concat(series.map((s) => s.label), ["Total"]), rows.map((r) => [S.esc(r.label)].concat(r.parts.map((p) => S.fmt.signed(p.v, 2)), [S.fmt.signed(r.total, 2)]))),
    };
  }

  /* ---- dumbbell: two values per row joined by a line ---- */
  function dumbbell(container, opts) {
    const rows = opts.rows, rowH = 18, width = opts.width || 640;
    const margin = { top: 8, right: 16, bottom: 36, left: 110 };
    const height = margin.top + rows.length * rowH + margin.bottom;
    const { g, w } = svgIn(container, width, height, margin);
    const x = d3.scaleLinear().domain(opts.xdomain || [0, 100]).range([0, w]);
    const y = d3.scaleBand().domain(rows.map((r) => r.label)).range([0, rows.length * rowH]);
    g.append("g").attr("class", "grid").call(d3.axisBottom(x).ticks(6).tickSize(rows.length * rowH).tickFormat("")).attr("opacity", 0.6);
    const row = g.selectAll("g.row").data(rows).enter().append("g").attr("transform", (d) => `translate(0,${y(d.label) + rowH / 2})`);
    row.append("line").attr("x1", (d) => x(d.a)).attr("x2", (d) => x(d.b)).attr("stroke", "#c9c8c2").attr("stroke-width", 2);
    row.append("circle").attr("cx", (d) => x(d.a)).attr("r", 5).attr("fill", "#fff").attr("stroke", INK2()).attr("stroke-width", 1.5);
    row.append("circle").attr("cx", (d) => x(d.b)).attr("r", 5.5).attr("fill", col(1));
    row.append("rect").attr("x", -margin.left).attr("y", -rowH / 2).attr("width", w + margin.left).attr("height", rowH).attr("fill", "transparent")
      .on("pointermove", (ev, d) => S.showTip(`<div class="t-title">${S.esc(d.label)}</div><div class="t-row"><span class="t-key" style="background:#999"></span><span class="t-val">${S.fmt.n(d.a, 1)}%</span><span class="t-lab">${S.esc(opts.labels.a)}</span></div><div class="t-row"><span class="t-key" style="background:${col(1)}"></span><span class="t-val">${S.fmt.n(d.b, 1)}%</span><span class="t-lab">${S.esc(opts.labels.b)}</span></div><div class="t-lab">Difference ${S.fmt.signed(d.b - d.a, 1)} pp</div>`, ev))
      .on("pointerleave", S.hideTip);
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${rows.length * rowH})`).call(d3.axisBottom(x).ticks(6));
    g.append("text").attr("class", "axis-title").attr("x", w / 2).attr("y", rows.length * rowH + 32).attr("text-anchor", "middle").text(opts.xtitle || "");
    return {
      legend: () => legendHTML([{ label: opts.labels.a, color: "#999", kind: "dot" }, { label: opts.labels.b, color: col(1), kind: "dot" }]),
      table: () => tableWrap(["Country", opts.labels.a, opts.labels.b, "Difference (pp)"], rows.map((r) => [S.esc(r.label), S.fmt.n(r.a, 1), S.fmt.n(r.b, 1), S.fmt.signed(r.b - r.a, 1)])),
    };
  }

  /* ---- scatterLabeled: labelled points with optional reference lines ---- */
  function scatterLabeled(container, opts) {
    const width = opts.width || 560, height = opts.height || 420;
    const margin = { top: 16, right: 24, bottom: 46, left: 56 };
    const { g, w, h } = svgIn(container, width, height, margin);
    const pts = opts.points;
    const xe = d3.extent(pts, (p) => p.x), ye = d3.extent(pts, (p) => p.y);
    const padx = (xe[1] - xe[0]) * 0.1 || 1, pady = (ye[1] - ye[0]) * 0.1 || 1;
    const x = d3.scaleLinear().domain(opts.xdomain || [xe[0] - padx, xe[1] + padx]).range([0, w]).nice();
    const y = d3.scaleLinear().domain(opts.ydomain || [ye[0] - pady, ye[1] + pady]).range([h, 0]).nice();
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(6).tickSize(-w).tickFormat(""));
    g.append("g").attr("class", "grid").call(d3.axisBottom(x).ticks(6).tickSize(h).tickFormat(""));
    if (opts.zeroY !== false && y.domain()[0] < 0 && y.domain()[1] > 0) g.append("line").attr("class", "zero").attr("x1", 0).attr("x2", w).attr("y1", y(0)).attr("y2", y(0)).attr("stroke-dasharray", "4,3");
    (opts.lines || []).forEach((L) => {
      const [x0, x1] = x.domain();
      const clip = (xx) => Math.max(y.domain()[0], Math.min(y.domain()[1], L.intercept + L.slope * xx));
      g.append("line").attr("x1", x(x0)).attr("y1", y(clip(x0))).attr("x2", x(x1)).attr("y2", y(clip(x1))).attr("stroke", L.color || INK2()).attr("stroke-width", L.width || 1.5).attr("stroke-dasharray", L.dash || null).attr("opacity", 0.9);
    });
    const shape = (p) => symbol(p.shape || "circle", 64)();
    g.selectAll("path.pt").data(pts).enter().append("path").attr("class", "pt").attr("d", shape).attr("transform", (p) => `translate(${x(p.x)},${y(p.y)})`)
      .attr("fill", (p) => (p.open ? "#fff" : p.color || col(1))).attr("stroke", (p) => p.color || col(1)).attr("stroke-width", 1.5)
      .on("pointermove", (ev, p) => S.showTip(`<div class="t-title">${S.esc(p.label)}</div><div class="t-lab">${S.esc(opts.xtitle || "x")}: <b>${S.fmt.n(p.x, opts.xd == null ? 2 : opts.xd)}</b></div><div class="t-lab">${S.esc(opts.ytitle || "y")}: <b>${S.fmt.n(p.y, opts.yd == null ? 2 : opts.yd)}</b></div>${p.note ? `<div class="t-lab">${S.esc(p.note)}</div>` : ""}`, ev))
      .on("pointerleave", S.hideTip);
    // labels, nudged apart vertically when they collide
    const labs = pts.map((p) => ({ p, x: x(p.x) + 7, y: y(p.y) + 4 })).sort((a, b) => a.y - b.y);
    for (let k = 1; k < labs.length; k++) if (Math.abs(labs[k].x - labs[k - 1].x) < 70 && labs[k].y - labs[k - 1].y < 11) labs[k].y = labs[k - 1].y + 11;
    g.selectAll("text.pt").data(labs).enter().append("text").attr("class", "label pt").attr("x", (d) => d.x).attr("y", (d) => d.y).attr("font-size", 10).text((d) => d.p.short || d.p.label);
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).ticks(6).tickFormat(opts.xtick || null));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6));
    g.append("text").attr("class", "axis-title").attr("x", w / 2).attr("y", h + 38).attr("text-anchor", "middle").text(opts.xtitle || "");
    g.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("x", -h / 2).attr("y", -42).attr("text-anchor", "middle").text(opts.ytitle || "");
    return { legend: () => legendHTML((opts.lines || []).filter((L) => L.label).map((L) => ({ label: L.label, color: L.color || INK2() }))), table: () => tableWrap(["Country", opts.xtitle || "x", opts.ytitle || "y"].concat(opts.extraCols ? opts.extraCols.map((c) => c.label) : []), pts.map((p) => [S.esc(p.label), S.fmt.n(p.x, opts.xd == null ? 3 : opts.xd), S.fmt.n(p.y, opts.yd == null ? 3 : opts.yd)].concat(opts.extraCols ? opts.extraCols.map((c) => c.fmt(p)) : []))) };
  }

  /* ---- strip: one row per group, a dot per member, mean tick ---- */
  function strip(container, opts) {
    const rows = opts.rows, rowH = opts.rowH || 24, width = opts.width || 720;
    const margin = { top: 8, right: 16, bottom: 36, left: 130 };
    const height = margin.top + rows.length * rowH + margin.bottom;
    const { g, w } = svgIn(container, width, height, margin);
    const x = d3.scaleLinear().domain(opts.xdomain || [0, 100]).range([0, w]);
    const y = d3.scaleBand().domain(rows.map((r) => r.label)).range([0, rows.length * rowH]);
    g.append("g").attr("class", "grid").call(d3.axisBottom(x).ticks(8).tickSize(rows.length * rowH).tickFormat("")).attr("opacity", 0.6);
    let highlight = opts.highlight || null;
    const row = g.selectAll("g.row").data(rows).enter().append("g").attr("transform", (d) => `translate(0,${y(d.label) + rowH / 2})`);
    row.append("line").attr("x1", (d) => x(d3.min(d.points, (p) => p.x))).attr("x2", (d) => x(d3.max(d.points, (p) => p.x))).attr("stroke", "#e1e0d9").attr("stroke-width", 6).attr("stroke-linecap", "round");
    const dots = row.selectAll("circle").data((d) => d.points.map((p) => ({ ...p, row: d }))).enter().append("circle")
      .attr("cx", (p) => x(p.x)).attr("r", 4.5).attr("stroke", "#fff").attr("stroke-width", 1)
      .on("pointermove", (ev, p) => S.showTip(`<div class="t-title">${S.esc(p.label)} · ${S.esc(p.row.label)}</div><div class="t-row"><span class="t-val">${S.fmt.n(p.x, 1)}%</span><span class="t-lab">${S.esc(opts.valueLabel || "mean recommended equity share")}${p.n ? ` (n = ${p.n})` : ""}</span></div><div class="t-lab">Click to highlight ${S.esc(p.label)} in every row</div>`, ev))
      .on("pointerleave", S.hideTip)
      .on("click", (ev, p) => { highlight = highlight === p.key ? null : p.key; paint(); if (opts.onHighlight) opts.onHighlight(highlight); });
    row.append("line").attr("x1", (d) => x(d.mean)).attr("x2", (d) => x(d.mean)).attr("y1", -rowH / 2 + 3).attr("y2", rowH / 2 - 3).attr("stroke", "#111").attr("stroke-width", 2).style("pointer-events", "none");
    function paint() {
      dots.attr("fill", (p) => (highlight == null ? col(1) : p.key === highlight ? col(2) : "#c9c8c2")).attr("opacity", (p) => (highlight == null ? 0.8 : p.key === highlight ? 1 : 0.6)).attr("r", (p) => (p.key === highlight ? 6 : 4.5));
      dots.filter((p) => p.key === highlight).raise();
    }
    paint();
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${rows.length * rowH})`).call(d3.axisBottom(x).ticks(8));
    g.append("text").attr("class", "axis-title").attr("x", w / 2).attr("y", rows.length * rowH + 32).attr("text-anchor", "middle").text(opts.xtitle || "");
    return {
      setHighlight: (k) => { highlight = k; paint(); },
      legend: () => legendHTML([{ label: opts.pointLabel || "One country", color: col(1), kind: "dot" }, { label: "Highlighted country", color: col(2), kind: "dot" }, { label: "Row mean", color: "#111" }]),
      table: () => { const keys = rows[0].points.map((p) => p.label); return tableWrap([opts.rowTitle || "Model", "Mean"].concat(keys), rows.map((r) => [S.esc(r.label), S.fmt.n(r.mean, 1)].concat(keys.map((k) => { const p = r.points.find((q) => q.label === k); return p ? S.fmt.n(p.x, 1) : "–"; })))); },
    };
  }

  return { bars, dotPlot, stackedBars, dumbbell, scatterLabeled, strip, legendHTML, symbol };
})();
