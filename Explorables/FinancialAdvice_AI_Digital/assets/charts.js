/* Chart components (D3 v7). Every component returns an SVG inside the given
   container, ships a hover layer, and exposes a tableView() for the WCAG
   table twin. Colours come from the validated palette in site.css. */
window.Charts = (function () {
  "use strict";
  const S = window.Site;
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const COLORS = () => [css("--series-1"), css("--series-2"), css("--series-3"), css("--series-4"), css("--series-5")];
  const INK2 = () => css("--chart-ink-2");

  function svgIn(container, width, height, margin) {
    const el = typeof container === "string" ? document.querySelector(container) : container;
    el.innerHTML = "";
    const svg = d3.select(el).append("svg")
      .attr("class", "chart")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("role", "img");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    return { svg, g, w: width - margin.left - margin.right, h: height - margin.top - margin.bottom, el };
  }

  function niceDomain(values, pad = 0.08) {
    let lo = d3.min(values), hi = d3.max(values);
    if (lo == null || hi == null) return [-1, 1];
    if (lo > 0) lo = 0;
    if (hi < 0) hi = 0;
    const span = hi - lo || 1;
    return [lo - span * pad, hi + span * pad];
  }

  /* ---------------------------------------------------------------------
     irf: horizon on x, coefficient on y, up to 5 series with CI bands.
     opts: {series:[{label,year:[],b:[],se:[],df:[]}], ytitle, level (0.95|0.90),
            equivalence (delta or null), scale (multiplier), leads (bool),
            xtitle, width, height, ref (x value for dashed reference line)}
  --------------------------------------------------------------------- */
  function irf(container, opts) {
    const width = opts.width || 520, height = opts.height || 300;
    const margin = { top: 14, right: 16, bottom: 44, left: 52 };
    const { g, w, h, el } = svgIn(container, width, height, margin);
    const level = opts.level || 0.95;
    const alpha = 1 - level;
    const scale = opts.scale || 1;
    const colors = COLORS();
    const series = (opts.series || []).map((s, i) => {
      const pts = s.year.map((x, k) => {
        const df = s.df ? s.df[k] : null;
        const t = df ? S.tcrit(df, alpha) : 1.959964;
        const b = s.b[k], se = s.se[k];
        return b == null ? null : { x, b: b * scale, se: se * scale, lo: (b - t * se) * scale, hi: (b + t * se) * scale, N: s.N ? s.N[k] : null, df };
      }).filter(Boolean);
      return { label: s.label, color: s.color || colors[i % colors.length], pts };
    });
    const allX = series.flatMap((s) => s.pts.map((p) => p.x));
    const xs = opts.leads ? [-3, -2, -1, 1, 2, 3, 4, 5] : d3.range(0, 6);
    const xdom = opts.leads ? [-3.4, 5.4] : [-0.3, 5.3];
    const x = d3.scaleLinear().domain(xdom).range([0, w]);
    const ys = series.flatMap((s) => s.pts.flatMap((p) => [p.lo, p.hi]));
    if (opts.equivalence) ys.push(opts.equivalence * 1.05, -opts.equivalence * 1.05);
    const y = d3.scaleLinear().domain(opts.ydomain || niceDomain(ys)).range([h, 0]).nice();

    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""));
    if (opts.equivalence) {
      g.append("rect").attr("x", 0).attr("y", y(opts.equivalence)).attr("width", w).attr("height", y(-opts.equivalence) - y(opts.equivalence))
        .attr("fill", css("--annotation")).attr("opacity", 0.08);
      g.append("text").attr("class", "annot").attr("x", w - 4).attr("y", y(opts.equivalence) - 4).attr("text-anchor", "end")
        .text(`±${opts.equivalence} pp equivalence margin`);
    }
    g.append("line").attr("class", "zero").attr("x1", 0).attr("x2", w).attr("y1", y(0)).attr("y2", y(0));
    if (opts.leads) {
      g.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", h).attr("stroke", css("--chart-axis")).attr("stroke-dasharray", "3,3");
    }
    const area = d3.area().x((p) => x(p.x)).y0((p) => y(p.lo)).y1((p) => y(p.hi)).curve(d3.curveLinear);
    const line = d3.line().x((p) => x(p.x)).y((p) => y(p.b));
    series.forEach((s) => {
      // leads: draw pre and post segments separately so the gap at the reference year shows
      const segs = opts.leads ? [s.pts.filter((p) => p.x < 0), s.pts.filter((p) => p.x > 0)] : [s.pts];
      segs.forEach((seg) => {
        if (seg.length === 0) return;
        g.append("path").datum(seg).attr("d", area).attr("fill", s.color).attr("opacity", 0.14);
        g.append("path").datum(seg).attr("d", line).attr("fill", "none").attr("stroke", s.color).attr("stroke-width", 2).attr("stroke-linejoin", "round");
      });
      g.selectAll(null).data(s.pts).enter().append("circle").attr("cx", (p) => x(p.x)).attr("cy", (p) => y(p.b)).attr("r", 4)
        .attr("fill", s.color).attr("stroke", css("--chart-surface")).attr("stroke-width", 2);
    });
    if (opts.leads) {
      g.append("circle").attr("cx", x(-1)).attr("cy", y(0)).attr("r", 4).attr("fill", css("--chart-surface")).attr("stroke", INK2()).attr("stroke-width", 1.5);
      g.append("text").attr("class", "label").attr("x", x(-1)).attr("y", y(0) - 9).attr("text-anchor", "middle").text("ref.");
    }
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).tickValues(xs.filter((v) => v !== 0 || !opts.leads)).tickFormat((v) => (opts.leads && v === -1 ? "−1" : v < 0 ? "−" + Math.abs(v) : v)));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));
    g.append("text").attr("class", "axis-title").attr("x", w / 2).attr("y", h + 36).attr("text-anchor", "middle")
      .text(opts.xtitle || (opts.leads ? "Years relative to the policy change (−1 = reference year)" : "Years after the policy change (1 = policy year)"));
    g.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("x", -h / 2).attr("y", -40).attr("text-anchor", "middle").text(opts.ytitle || "Percentage points");

    // hover: crosshair snapping to the nearest horizon
    const focus = g.append("line").attr("stroke", css("--chart-axis")).attr("y1", 0).attr("y2", h).style("display", "none");
    g.append("rect").attr("width", w).attr("height", h).attr("fill", "transparent")
      .on("pointermove", (ev) => {
        const [mx] = d3.pointer(ev);
        const xv = x.invert(mx);
        const cand = Array.from(new Set(allX));
        if (!cand.length) return;
        const nx = cand.reduce((a, b) => (Math.abs(b - xv) < Math.abs(a - xv) ? b : a));
        focus.attr("x1", x(nx)).attr("x2", x(nx)).style("display", null);
        const rows = series.map((s) => {
          const p = s.pts.find((q) => q.x === nx);
          if (!p) return "";
          return `<div class="t-row"><span class="t-key" style="background:${s.color}"></span><span class="t-val">${S.fmt.n3(p.b)}</span><span class="t-lab">[${S.fmt.n3(p.lo)}, ${S.fmt.n3(p.hi)}] ${S.esc(s.label)}${p.N ? " · N=" + p.N : ""}</span></div>`;
        }).join("");
        S.showTip(`<div class="t-title">Year ${nx < 0 ? "−" + Math.abs(nx) : nx}</div>${rows}`, ev);
      })
      .on("pointerleave", () => { focus.style("display", "none"); S.hideTip(); });
    return {
      table: () => tableIRF(series, level),
      legend: () => legendHTML(series.map((s) => ({ label: s.label, color: s.color, kind: "line" }))),
    };
  }

  function tableIRF(series, level) {
    const xs = Array.from(new Set(series.flatMap((s) => s.pts.map((p) => p.x)))).sort((a, b) => a - b);
    let html = `<table><thead><tr><th>Year</th>${series.map((s) => `<th>${S.esc(s.label)}</th>`).join("")}</tr></thead><tbody>`;
    xs.forEach((xv) => {
      html += `<tr><th scope="row">${xv}</th>` + series.map((s) => {
        const p = s.pts.find((q) => q.x === xv);
        return p ? `<td>${S.fmt.n3(p.b)}<br><span class="muted small">(${S.fmt.n3(p.se)}) [${S.fmt.n3(p.lo)}, ${S.fmt.n3(p.hi)}]${p.N ? " N=" + p.N : ""}</span></td>` : "<td>–</td>";
      }).join("") + "</tr>";
    });
    html += `</tbody></table><p class="small muted">Coefficient, standard error in parentheses, ${Math.round(level * 100)}% confidence interval in brackets.</p>`;
    return html;
  }

  function legendHTML(items) {
    return `<div class="legend">${items.map((it) => `<span class="key"><span class="swatch ${it.kind === "dot" ? "dot" : it.kind === "area" ? "area" : ""}" style="background:${it.color}"></span>${S.esc(it.label)}</span>`).join("")}</div>`;
  }

  /* event-study: like irf but x from -4..4 with reference at -1 */
  function eventStudy(container, opts) {
    const width = opts.width || 520, height = opts.height || 300;
    const margin = { top: 14, right: 16, bottom: 44, left: 52 };
    const { g, w, h } = svgIn(container, width, height, margin);
    const level = opts.level || 0.95, alpha = 1 - level;
    const colors = COLORS();
    const ref = opts.ref == null ? -1 : opts.ref;
    const series = (opts.series || []).map((s, i) => {
      const pts = s.h.map((x, k) => {
        const b = s.b[k], se = s.se[k];
        if (b == null) return null;
        const t = 1.959964 * (alpha === 0.1 ? 1.6448536 / 1.959964 : 1);
        return { x, b, se, lo: b - t * se, hi: b + t * se };
      }).filter(Boolean);
      return { label: s.label, color: s.color || colors[i % colors.length], pts };
    });
    const xsAll = series.flatMap((s) => s.pts.map((p) => p.x));
    const xmin = Math.min(d3.min(xsAll), ref), xmax = d3.max(xsAll);
    const x = d3.scaleLinear().domain([xmin - 0.4, xmax + 0.4]).range([0, w]);
    const ys = series.flatMap((s) => s.pts.flatMap((p) => [p.lo, p.hi]));
    const y = d3.scaleLinear().domain(niceDomain(ys)).range([h, 0]).nice();
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""));
    g.append("line").attr("class", "zero").attr("x1", 0).attr("x2", w).attr("y1", y(0)).attr("y2", y(0));
    g.append("line").attr("x1", x(-0.5)).attr("x2", x(-0.5)).attr("y1", 0).attr("y2", h).attr("stroke", css("--chart-axis")).attr("stroke-dasharray", "3,3");
    const area = d3.area().x((p) => x(p.x)).y0((p) => y(p.lo)).y1((p) => y(p.hi));
    const line = d3.line().x((p) => x(p.x)).y((p) => y(p.b));
    series.forEach((s) => {
      const withRef = s.pts.concat(s.pts.some((p) => p.x === ref) ? [] : [{ x: ref, b: 0, se: 0, lo: 0, hi: 0 }]).sort((a, b) => a.x - b.x);
      g.append("path").datum(withRef).attr("d", area).attr("fill", s.color).attr("opacity", 0.14);
      g.append("path").datum(withRef).attr("d", line).attr("fill", "none").attr("stroke", s.color).attr("stroke-width", 2);
      g.selectAll(null).data(s.pts).enter().append("circle").attr("cx", (p) => x(p.x)).attr("cy", (p) => y(p.b)).attr("r", 4)
        .attr("fill", s.color).attr("stroke", css("--chart-surface")).attr("stroke-width", 2);
    });
    g.append("circle").attr("cx", x(ref)).attr("cy", y(0)).attr("r", 4).attr("fill", css("--chart-surface")).attr("stroke", INK2()).attr("stroke-width", 1.5);
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).tickValues(d3.range(xmin, xmax + 1)).tickFormat((v) => (v < 0 ? "−" + Math.abs(v) : v)));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));
    g.append("text").attr("class", "axis-title").attr("x", w / 2).attr("y", h + 36).attr("text-anchor", "middle").text(opts.xtitle || "Years relative to the reform (−1 = reference year)");
    g.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("x", -h / 2).attr("y", -40).attr("text-anchor", "middle").text(opts.ytitle || "Percentage points");
    const focus = g.append("line").attr("stroke", css("--chart-axis")).attr("y1", 0).attr("y2", h).style("display", "none");
    g.append("rect").attr("width", w).attr("height", h).attr("fill", "transparent")
      .on("pointermove", (ev) => {
        const [mx] = d3.pointer(ev);
        const nx = Math.round(x.invert(mx));
        focus.attr("x1", x(nx)).attr("x2", x(nx)).style("display", null);
        const rows = series.map((s) => {
          const p = s.pts.find((q) => q.x === nx);
          if (!p) return "";
          return `<div class="t-row"><span class="t-key" style="background:${s.color}"></span><span class="t-val">${S.fmt.n3(p.b)}</span><span class="t-lab">[${S.fmt.n3(p.lo)}, ${S.fmt.n3(p.hi)}] ${S.esc(s.label)}</span></div>`;
        }).join("");
        S.showTip(`<div class="t-title">Year ${nx < 0 ? "−" + Math.abs(nx) : nx}</div>${rows}`, ev);
      }).on("pointerleave", () => { focus.style("display", "none"); S.hideTip(); });
    return { table: () => tableIRF(series, level), legend: () => legendHTML(series.map((s) => ({ label: s.label, color: s.color }))) };
  }

  /* ---------------------------------------------------------------------
     lines: multi-country time series (spaghetti), one highlighted series.
     opts: {data:[{key,label,values:[{x,y}]}], highlight:key|null, average:bool,
            ytitle, ydomain, width, height, events:{key:[x,...]} marks}
  --------------------------------------------------------------------- */
  function lines(container, opts) {
    const width = opts.width || 720, height = opts.height || 360;
    const margin = { top: 14, right: 110, bottom: 36, left: 46 };
    const { g, w, h, svg } = svgIn(container, width, height, margin);
    const data = opts.data.filter((s) => s.values.length);
    const xs = data.flatMap((s) => s.values.map((v) => v.x));
    const x = d3.scaleLinear().domain(d3.extent(xs)).range([0, w]);
    const ys = data.flatMap((s) => s.values.map((v) => v.y));
    const y = d3.scaleLinear().domain(opts.ydomain || d3.extent(ys)).range([h, 0]).nice();
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""));
    const line = d3.line().defined((v) => v.y != null).x((v) => x(v.x)).y((v) => y(v.y));
    const accent = css("--series-1"), grey = "#c9c8c2";
    let highlight = opts.highlight || null;
    const paths = g.selectAll("path.series").data(data).enter().append("path").attr("class", "series")
      .attr("d", (s) => line(s.values)).attr("fill", "none").attr("stroke-width", 1.5).attr("stroke", grey).attr("stroke-linejoin", "round");
    let avgPath = null;
    if (opts.average) {
      const byX = d3.rollups(data.flatMap((s) => s.values.filter((v) => v.y != null)), (v) => d3.mean(v, (d) => d.y), (v) => v.x).sort((a, b) => a[0] - b[0]).map(([x, y]) => ({ x, y }));
      avgPath = g.append("path").datum(byX).attr("d", line).attr("fill", "none").attr("stroke", css("--series-2")).attr("stroke-width", 2.5);
      g.append("text").attr("class", "label").attr("x", x(byX[byX.length - 1].x) + 6).attr("y", y(byX[byX.length - 1].y) + 4).text("Average").attr("fill", css("--series-2"));
    }
    const hl = g.append("path").attr("fill", "none").attr("stroke", accent).attr("stroke-width", 2.5).style("display", "none");
    const hlLabel = g.append("text").attr("class", "label").style("display", "none").attr("font-weight", 600);
    const marks = g.append("g");
    function setHighlight(key) {
      highlight = key;
      const s = data.find((d) => d.key === key);
      marks.selectAll("*").remove();
      if (!s) { hl.style("display", "none"); hlLabel.style("display", "none"); return; }
      hl.datum(s.values).attr("d", line).style("display", null);
      const last = s.values.filter((v) => v.y != null).slice(-1)[0];
      hlLabel.attr("x", x(last.x) + 6).attr("y", y(last.y) + 4).text(s.label).style("display", null);
      if (opts.events && opts.events[key]) {
        opts.events[key].forEach((e) => {
          const v = s.values.find((q) => q.x === e.x);
          if (!v || v.y == null) return;
          marks.append("circle").attr("cx", x(e.x)).attr("cy", y(v.y)).attr("r", 5).attr("fill", e.value > 0 ? css("--series-2") : css("--series-3")).attr("stroke", "#fff").attr("stroke-width", 2);
        });
      }
    }
    setHighlight(highlight);
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).ticks(Math.min(15, xs.length)).tickFormat(d3.format("d")));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));
    if (opts.ytitle) g.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("x", -h / 2).attr("y", -36).attr("text-anchor", "middle").text(opts.ytitle);
    // hover: nearest series by distance at the x position
    g.append("rect").attr("width", w).attr("height", h).attr("fill", "transparent")
      .on("pointermove", (ev) => {
        const [mx, my] = d3.pointer(ev);
        const xv = Math.round(x.invert(mx));
        let best = null, bd = Infinity;
        data.forEach((s) => {
          const v = s.values.find((q) => q.x === xv);
          if (!v || v.y == null) return;
          const d = Math.abs(y(v.y) - my);
          if (d < bd) { bd = d; best = { s, v }; }
        });
        if (!best || bd > 40) { S.hideTip(); paths.attr("stroke", grey); return; }
        paths.attr("stroke", (s) => (s === best.s ? css("--ink") : grey));
        const ev2 = opts.events && opts.events[best.s.key] ? opts.events[best.s.key].find((e) => e.x === xv) : null;
        S.showTip(`<div class="t-title">${S.esc(best.s.label)}, ${xv}</div><div class="t-row"><span class="t-val">${S.fmt.n(best.v.y, 1)}</span><span class="t-lab">${S.esc(opts.ytitle || "")}</span></div>${ev2 ? `<div class="t-lab">Index change ${S.fmt.signed(ev2.value, 2)}</div>` : ""}<div class="t-lab">Click to highlight</div>`, ev);
      })
      .on("pointerleave", () => { S.hideTip(); paths.attr("stroke", grey); })
      .on("click", (ev) => {
        const [mx, my] = d3.pointer(ev);
        const xv = Math.round(x.invert(mx));
        let best = null, bd = Infinity;
        data.forEach((s) => {
          const v = s.values.find((q) => q.x === xv);
          if (!v || v.y == null) return;
          const d = Math.abs(y(v.y) - my);
          if (d < bd) { bd = d; best = s; }
        });
        if (best) { setHighlight(best.key === highlight ? null : best.key); if (opts.onHighlight) opts.onHighlight(highlight); }
      });
    return {
      setHighlight,
      table: () => {
        const xsU = Array.from(new Set(xs)).sort((a, b) => a - b);
        let html = `<div class="table-wrap"><table class="data-table"><thead><tr><th>Country</th>${xsU.map((v) => `<th>${v}</th>`).join("")}</tr></thead><tbody>`;
        data.forEach((s) => { html += `<tr><th scope="row">${S.esc(s.label)}</th>${xsU.map((xv) => { const v = s.values.find((q) => q.x === xv); return `<td>${v && v.y != null ? S.fmt.n(v.y, 1) : "–"}</td>`; }).join("")}</tr>`; });
        return html + "</tbody></table></div>";
      },
    };
  }

  /* scatter with 45-degree line, labelled points, two colour groups */
  function scatter45(container, opts) {
    const width = opts.width || 620, height = opts.height || 460;
    const margin = { top: 14, right: 20, bottom: 44, left: 52 };
    const { g, w, h } = svgIn(container, width, height, margin);
    const pts = opts.points;
    const ext = d3.extent(pts.flatMap((p) => [p.x, p.y]));
    const dom = [ext[0] - 3, ext[1] + 3];
    const x = d3.scaleLinear().domain(dom).range([0, w]);
    const y = d3.scaleLinear().domain(dom).range([h, 0]);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(6).tickSize(-w).tickFormat(""));
    g.append("line").attr("x1", x(dom[0])).attr("y1", y(dom[0])).attr("x2", x(dom[1])).attr("y2", y(dom[1])).attr("stroke", INK2()).attr("stroke-width", 1);
    g.append("text").attr("class", "label").attr("x", x(dom[0]) + 10).attr("y", y(dom[1]) + 14).text(opts.labelAbove || "Higher in 2017");
    g.append("text").attr("class", "label").attr("x", x(dom[1]) - 6).attr("y", y(dom[0]) - 8).attr("text-anchor", "end").text(opts.labelBelow || "Lower in 2017");
    const colors = COLORS();
    const col = (p) => (p.group === 1 ? colors[1] : colors[0]);
    g.selectAll("circle").data(pts).enter().append("circle").attr("cx", (p) => x(p.x)).attr("cy", (p) => y(p.y)).attr("r", 5)
      .attr("fill", col).attr("stroke", "#fff").attr("stroke-width", 1.5)
      .on("pointermove", (ev, p) => S.showTip(`<div class="t-title">${S.esc(p.label)}</div><div class="t-lab">2010: <b>${S.fmt.n(p.x, 1)}</b> · 2017: <b>${S.fmt.n(p.y, 1)}</b> · change ${S.fmt.signed(p.y - p.x, 1)} pp</div><div class="t-lab">Index change 2010–2017: ${S.fmt.n(p.mpp, 2)} (${p.group === 1 ? "above" : "below"} median)</div>`, ev))
      .on("pointerleave", S.hideTip);
    g.selectAll("text.pt").data(pts).enter().append("text").attr("class", "label pt").attr("x", (p) => x(p.x) + 7).attr("y", (p) => y(p.y) + 4).attr("font-size", 10).text((p) => p.short || p.label);
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).ticks(6));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6));
    g.append("text").attr("class", "axis-title").attr("x", w / 2).attr("y", h + 36).attr("text-anchor", "middle").text(opts.xtitle || "Homeownership rate in 2010 (%)");
    g.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("x", -h / 2).attr("y", -40).attr("text-anchor", "middle").text(opts.ytitle || "Homeownership rate in 2017 (%)");
    return {
      legend: () => legendHTML([{ label: "Above-median index change 2010–2017", color: colors[1], kind: "dot" }, { label: "Below-median index change", color: colors[0], kind: "dot" }]),
      table: () => `<table><thead><tr><th>Country</th><th>2010</th><th>2017</th><th>Change</th><th>Index change</th></tr></thead><tbody>${pts.map((p) => `<tr><th scope="row">${S.esc(p.label)}</th><td>${S.fmt.n(p.x, 1)}</td><td>${S.fmt.n(p.y, 1)}</td><td>${S.fmt.signed(p.y - p.x, 1)}</td><td>${S.fmt.n(p.mpp, 2)}</td></tr>`).join("")}</tbody></table>`,
    };
  }

  /* small bar columns: index changes per year, one mini chart per country */
  function policyBars(container, opts) {
    const el = typeof container === "string" ? document.querySelector(container) : container;
    el.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "chart-grid cols-3";
    el.appendChild(grid);
    const colors = COLORS();
    const ymax = d3.max(opts.data.flatMap((c) => c.values.map((v) => Math.abs(v.y)))) || 1;
    opts.data.forEach((c) => {
      const cell = document.createElement("div");
      const t = document.createElement("div"); t.className = "chart-cell-title"; t.textContent = c.label; cell.appendChild(t);
      const box = document.createElement("div"); cell.appendChild(box);
      grid.appendChild(cell);
      const width = 220, height = 110, margin = { top: 6, right: 6, bottom: 20, left: 30 };
      const { g, w, h } = svgIn(box, width, height, margin);
      const x = d3.scaleBand().domain(opts.years).range([0, w]).padding(0.25);
      const y = d3.scaleLinear().domain([-ymax, ymax]).range([h, 0]);
      g.append("line").attr("class", "zero").attr("x1", 0).attr("x2", w).attr("y1", y(0)).attr("y2", y(0));
      g.selectAll("rect").data(c.values.filter((v) => v.y)).enter().append("rect")
        .attr("x", (v) => x(v.x)).attr("width", x.bandwidth()).attr("y", (v) => (v.y > 0 ? y(v.y) : y(0))).attr("height", (v) => Math.abs(y(v.y) - y(0)))
        .attr("fill", (v) => (v.y > 0 ? colors[1] : colors[2])).attr("rx", 1.5)
        .on("pointermove", (ev, v) => S.showTip(`<div class="t-title">${S.esc(c.label)}, ${v.x}</div><div class="t-row"><span class="t-val">${S.fmt.signed(v.y, 2)}</span><span class="t-lab">index change</span></div>`, ev))
        .on("pointerleave", S.hideTip);
      g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).tickValues(opts.years.filter((yv) => yv % 5 === 0)).tickFormat(d3.format("d")));
      g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(3));
    });
    return {
      legend: () => legendHTML([{ label: "Net tightening", color: colors[1], kind: "area" }, { label: "Net loosening", color: colors[2], kind: "area" }]),
      table: () => `<div class="table-wrap"><table class="data-table"><thead><tr><th>Country</th>${opts.years.map((yv) => `<th>${yv}</th>`).join("")}</tr></thead><tbody>${opts.data.map((c) => `<tr><th scope="row">${S.esc(c.label)}</th>${opts.years.map((yv) => { const v = c.values.find((q) => q.x === yv); return `<td>${v && v.y != null ? S.fmt.n(v.y, 2) : "–"}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`,
    };
  }

  /* histogram with a vertical marker */
  function histogram(container, opts) {
    const width = opts.width || 560, height = opts.height || 300;
    const margin = { top: 14, right: 16, bottom: 44, left: 48 };
    const { g, w, h } = svgIn(container, width, height, margin);
    const edges = opts.edges, counts = opts.counts;
    const x = d3.scaleLinear().domain([edges[0], edges[edges.length - 1]]).range([0, w]);
    const y = d3.scaleLinear().domain([0, d3.max(counts)]).range([h, 0]).nice();
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""));
    g.selectAll("rect").data(counts).enter().append("rect")
      .attr("x", (c, i) => x(edges[i]) + 1).attr("width", (c, i) => Math.max(0, x(edges[i + 1]) - x(edges[i]) - 2)).attr("y", (c) => y(c)).attr("height", (c) => h - y(c))
      .attr("fill", css("--series-1")).attr("opacity", 0.75).attr("rx", 1.5)
      .on("pointermove", (ev, c, i) => { const k = counts.indexOf(c); S.showTip(`<div class="t-row"><span class="t-val">${c}</span><span class="t-lab">permutations with coefficient in [${S.fmt.n3(edges[k])}, ${S.fmt.n3(edges[k + 1])}]</span></div>`, ev); })
      .on("pointerleave", S.hideTip);
    if (opts.obs != null) {
      g.append("line").attr("x1", x(opts.obs)).attr("x2", x(opts.obs)).attr("y1", 0).attr("y2", h).attr("stroke", css("--series-2")).attr("stroke-width", 2.5);
      g.append("text").attr("class", "label").attr("x", x(opts.obs) + 5).attr("y", 12).text(`observed ${S.fmt.n3(opts.obs)}`).attr("fill", css("--series-2"));
    }
    if (opts.q) {
      [opts.q[0], opts.q[4]].forEach((q) => g.append("line").attr("x1", x(q)).attr("x2", x(q)).attr("y1", 0).attr("y2", h).attr("stroke", INK2()).attr("stroke-dasharray", "3,3"));
      g.append("text").attr("class", "label").attr("x", x(opts.q[4]) + 4).attr("y", h - 6).text("2.5 / 97.5 pct").attr("font-size", 10);
    }
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).ticks(7));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));
    g.append("text").attr("class", "axis-title").attr("x", w / 2).attr("y", h + 36).attr("text-anchor", "middle").text(opts.xtitle || "Coefficient on the permuted index change");
    g.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("x", -h / 2).attr("y", -36).attr("text-anchor", "middle").text("Permutations");
    return { table: () => `<table><thead><tr><th>Bin</th><th>Count</th></tr></thead><tbody>${counts.map((c, i) => `<tr><th scope="row">[${S.fmt.n3(edges[i])}, ${S.fmt.n3(edges[i + 1])}]</th><td>${c}</td></tr>`).join("")}</tbody></table>` };
  }

  /* ---------------------------------------------------------------------
     specCurve: sorted estimates with CIs and an indicator matrix below.
     opts: {specs:[{b,lo,hi,sig,dims:{shock,ctrl,...}, id}], dims:[{key,label,levels:[{key,label}]}],
            baselineId, onSelect(spec), ytitle, equivalence}
  --------------------------------------------------------------------- */
  function specCurve(container, opts) {
    const specs = opts.specs.slice().sort((a, b) => a.b - b.b);
    const n = specs.length;
    const dims = opts.dims.filter((d) => d.levels.length > 1);
    const rowH = 13;
    const indH = dims.reduce((acc, d) => acc + d.levels.length * rowH + 10, 0);
    const width = opts.width || 900, topH = 260;
    const margin = { top: 12, right: 16, bottom: 10, left: 262 };
    const height = margin.top + topH + 24 + indH + margin.bottom;
    const { g, w, svg } = svgIn(container, width, height, margin);
    const x = d3.scaleLinear().domain([-0.5, n - 0.5]).range([0, w]);
    // y range: the central 96% of the confidence bounds, so that a few
    // specifications from tiny subsamples do not flatten the curve; points
    // outside the range are drawn at the edge as hollow triangles
    const los = specs.map((s) => s.lo).sort(d3.ascending), his = specs.map((s) => s.hi).sort(d3.ascending);
    let yl = d3.quantileSorted(los, 0.02), yh = d3.quantileSorted(his, 0.98);
    const bs = specs.map((s) => s.b).sort(d3.ascending);
    yl = Math.min(yl, d3.quantileSorted(bs, 0.01), 0); yh = Math.max(yh, d3.quantileSorted(bs, 0.99), 0);
    if (opts.equivalence) { yl = Math.min(yl, -opts.equivalence * 1.1); yh = Math.max(yh, opts.equivalence * 1.1); }
    const y = d3.scaleLinear().domain([yl, yh]).range([topH, 0]).nice();
    const yc = (v) => Math.max(0, Math.min(topH, y(v)));
    const nOut = specs.filter((s) => s.b < y.domain()[0] || s.b > y.domain()[1]).length;
    const neg = css("--neg"), pos = css("--pos"), grey = "#b9b8b1";
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""));
    if (opts.equivalence) {
      g.append("rect").attr("x", 0).attr("y", y(opts.equivalence)).attr("width", w).attr("height", y(-opts.equivalence) - y(opts.equivalence)).attr("fill", css("--annotation")).attr("opacity", 0.08);
    }
    g.append("line").attr("class", "zero").attr("x1", 0).attr("x2", w).attr("y1", y(0)).attr("y2", y(0));
    const colr = (s) => (s.sig ? (s.b < 0 ? neg : pos) : grey);
    g.selectAll("line.ci").data(specs).enter().append("line").attr("class", "ci")
      .attr("x1", (s, i) => x(i)).attr("x2", (s, i) => x(i)).attr("y1", (s) => yc(s.lo)).attr("y2", (s) => yc(s.hi)).attr("stroke", colr).attr("stroke-width", Math.max(0.6, Math.min(2, w / n * 0.5))).attr("opacity", 0.5);
    const inRange = specs.map((s, i) => ({ s, i })).filter((o) => o.s.b >= y.domain()[0] && o.s.b <= y.domain()[1]);
    const outRange = specs.map((s, i) => ({ s, i })).filter((o) => o.s.b < y.domain()[0] || o.s.b > y.domain()[1]);
    g.selectAll("circle.pt").data(inRange).enter().append("circle").attr("class", "pt")
      .attr("cx", (o) => x(o.i)).attr("cy", (o) => y(o.s.b)).attr("r", n > 400 ? 1.6 : n > 100 ? 2.4 : 3.2).attr("fill", (o) => colr(o.s));
    g.selectAll("path.out").data(outRange).enter().append("path").attr("class", "out")
      .attr("d", (o) => d3.symbol().type(d3.symbolTriangle).size(28)())
      .attr("transform", (o) => `translate(${x(o.i)},${o.s.b > y.domain()[1] ? 5 : topH - 5}) rotate(${o.s.b > y.domain()[1] ? 0 : 180})`)
      .attr("fill", "none").attr("stroke", (o) => colr(o.s)).attr("stroke-width", 1.2);
    if (nOut) g.append("text").attr("class", "annot").attr("x", 4).attr("y", topH - 6).attr("fill", css("--chart-muted")).text(`${nOut} specification${nOut > 1 ? "s" : ""} outside the plotted range (triangles)`);
    // baseline marker
    const bi = specs.findIndex((s) => s.id === opts.baselineId);
    let marker = null;
    if (bi >= 0) {
      marker = g.append("g");
      marker.append("line").attr("x1", x(bi)).attr("x2", x(bi)).attr("y1", 0).attr("y2", topH + 24 + indH).attr("stroke", css("--annotation")).attr("stroke-width", 1.5);
      marker.append("text").attr("class", "annot").attr("x", x(bi) + 4).attr("y", 10).text("baseline");
    }
    const sel = g.append("g");
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));
    g.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("x", -topH / 2).attr("y", -40).attr("text-anchor", "middle").text(opts.ytitle || "Coefficient");
    // indicator matrix
    let yy = topH + 24;
    const ind = g.append("g").attr("class", "indicator-row");
    dims.forEach((d) => {
      ind.append("text").attr("x", -margin.left + 2).attr("y", yy - 2).attr("font-weight", 600).attr("font-size", 10.5).text(d.label);
      d.levels.forEach((lv) => {
        ind.append("text").attr("x", -6).attr("y", yy + rowH - 3).attr("text-anchor", "end").attr("font-size", 10.5).text(lv.label);
        const rowY = yy;
        ind.selectAll(null).data(specs.map((s, i) => ({ s, i })).filter((o) => o.s.dims[d.key] === lv.key)).enter().append("rect")
          .attr("x", (o) => x(o.i) - Math.max(0.8, (w / n) * 0.45)).attr("y", rowY + 2).attr("width", Math.max(1.6, (w / n) * 0.9)).attr("height", rowH - 4)
          .attr("fill", (o) => colr(o.s)).attr("opacity", 0.85);
        yy += rowH;
      });
      yy += 10;
    });
    // hover and click
    g.append("rect").attr("width", w).attr("height", topH + 24 + indH).attr("fill", "transparent")
      .on("pointermove", (ev) => {
        const [mx] = d3.pointer(ev);
        const i = Math.max(0, Math.min(n - 1, Math.round(x.invert(mx))));
        const s = specs[i];
        sel.selectAll("*").remove();
        sel.append("circle").attr("cx", x(i)).attr("cy", yc(s.b)).attr("r", 5).attr("fill", "none").attr("stroke", css("--ink")).attr("stroke-width", 1.5);
        const dimsTxt = opts.dims.map((d) => `<div class="t-lab">${S.esc(d.label)}: <b>${S.esc((d.levels.find((l) => l.key === s.dims[d.key]) || {}).label || s.dims[d.key])}</b></div>`).join("");
        S.showTip(`<div class="t-title">${S.fmt.n3(s.b)} [${S.fmt.n3(s.lo)}, ${S.fmt.n3(s.hi)}]${s.sig ? " · p < 0.05" : ""}</div>${dimsTxt}<div class="t-lab">N = ${s.N}${s.nclust ? ", " + s.nclust + " countries" : ""} · click to select</div>`, ev);
      })
      .on("pointerleave", () => { sel.selectAll("*").remove(); S.hideTip(); })
      .on("click", (ev) => {
        const [mx] = d3.pointer(ev);
        const i = Math.max(0, Math.min(n - 1, Math.round(x.invert(mx))));
        if (opts.onSelect) opts.onSelect(specs[i]);
      });
    return {
      sorted: specs,
      legend: () => legendHTML([{ label: "Negative and significant at 5%", color: neg, kind: "dot" }, { label: "Positive and significant at 5%", color: pos, kind: "dot" }, { label: "Not significant at 5%", color: grey, kind: "dot" }]),
    };
  }

  /* dot range: one row per label with CI (leave-one-out) */
  function dotRange(container, opts) {
    const items = opts.items;
    const rowH = 16;
    const width = opts.width || 520;
    const margin = { top: 8, right: 16, bottom: 34, left: opts.left || 110 };
    const height = margin.top + items.length * rowH + margin.bottom;
    const { g, w } = svgIn(container, width, height, margin);
    const ys = items.flatMap((d) => [d.lo, d.hi]);
    if (opts.ref) ys.push(opts.ref.lo, opts.ref.hi);
    const x = d3.scaleLinear().domain(niceDomain(ys, 0.05)).range([0, w]).nice();
    const y = d3.scaleBand().domain(items.map((d) => d.label)).range([0, items.length * rowH]);
    g.append("line").attr("class", "zero").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", items.length * rowH);
    if (opts.ref) {
      g.append("rect").attr("x", x(opts.ref.lo)).attr("width", x(opts.ref.hi) - x(opts.ref.lo)).attr("y", 0).attr("height", items.length * rowH).attr("fill", css("--series-1")).attr("opacity", 0.08);
      g.append("line").attr("x1", x(opts.ref.b)).attr("x2", x(opts.ref.b)).attr("y1", 0).attr("y2", items.length * rowH).attr("stroke", css("--series-1")).attr("stroke-dasharray", "3,3");
    }
    const row = g.selectAll("g.row").data(items).enter().append("g").attr("class", "row").attr("transform", (d) => `translate(0,${y(d.label) + rowH / 2})`);
    row.append("line").attr("x1", (d) => x(d.lo)).attr("x2", (d) => x(d.hi)).attr("stroke", css("--chart-muted")).attr("stroke-width", 1.2);
    row.append("circle").attr("cx", (d) => x(d.b)).attr("r", 3.5).attr("fill", (d) => (d.sig ? (d.b < 0 ? css("--neg") : css("--pos")) : css("--chart-ink-2")));
    row.append("rect").attr("x", -margin.left).attr("y", -rowH / 2).attr("width", w + margin.left).attr("height", rowH).attr("fill", "transparent")
      .on("pointermove", (ev, d) => S.showTip(`<div class="t-title">${S.esc(d.label)}</div><div class="t-row"><span class="t-val">${S.fmt.n3(d.b)}</span><span class="t-lab">[${S.fmt.n3(d.lo)}, ${S.fmt.n3(d.hi)}]${d.N ? " · N=" + d.N : ""}</span></div>`, ev))
      .on("pointerleave", S.hideTip);
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${items.length * rowH})`).call(d3.axisBottom(x).ticks(6));
    g.append("text").attr("class", "axis-title").attr("x", w / 2).attr("y", items.length * rowH + 30).attr("text-anchor", "middle").text(opts.xtitle || "Coefficient");
    return { table: () => `<table><thead><tr><th>${S.esc(opts.labelTitle || "Dropped")}</th><th>Coefficient</th><th>CI</th></tr></thead><tbody>${items.map((d) => `<tr><th scope="row">${S.esc(d.label)}</th><td>${S.fmt.n3(d.b)}</td><td>[${S.fmt.n3(d.lo)}, ${S.fmt.n3(d.hi)}]</td></tr>`).join("")}</tbody></table>` };
  }

  return { irf, eventStudy, lines, scatter45, policyBars, histogram, specCurve, dotRange, legendHTML, COLORS };
})();
