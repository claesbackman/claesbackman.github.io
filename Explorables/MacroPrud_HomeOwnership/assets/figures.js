/* Renders every <figure class="paper-figure"> on a paper page from
   data/figures.json (and panel.json for the descriptive figures). Each
   figure gets controls (confidence level, scaling), a table view and links
   to the robustness explorer and to the paper's static version. */
(function () {
  "use strict";
  const S = window.Site, C = window.Charts;
  const figs = Array.from(document.querySelectorAll("figure.paper-figure"));
  if (!figs.length) return;

  const COUNTRY_SHORT = { Austria: "AT", Belgium: "BE", Bulgaria: "BG", Croatia: "HR", Cyprus: "CY", Czechia: "CZ", Denmark: "DK", Estonia: "EE", Finland: "FI", France: "FR", Germany: "DE", Greece: "GR", Hungary: "HU", Ireland: "IE", Italy: "IT", Latvia: "LV", Lithuania: "LT", Luxembourg: "LU", Malta: "MT", Netherlands: "NL", Poland: "PL", Portugal: "PT", Romania: "RO", Slovakia: "SK", Slovenia: "SI", Spain: "ES", Sweden: "SE", UK: "UK", Norway: "NO", Switzerland: "CH" };

  function links(fig, state) {
    const box = fig.querySelector(".fig-links");
    box.innerHTML = "";
    const tbtn = document.createElement("button");
    tbtn.type = "button"; tbtn.textContent = "Table view";
    tbtn.addEventListener("click", () => {
      const t = fig.querySelector(".fig-table"), c = fig.querySelector(".fig-chart");
      const showTable = t.hidden;
      if (showTable && state.table) t.innerHTML = state.table();
      t.hidden = !showTable; c.hidden = showTable;
      tbtn.textContent = showTable ? "Chart view" : "Table view";
    });
    box.appendChild(tbtn);
    if (state.explore) {
      const a = document.createElement("a"); a.href = state.explore; a.textContent = "Explore this result in the robustness explorer"; box.appendChild(a);
    }
    const imgs = (fig.dataset.images || "").split(",").filter(Boolean);
    if (imgs.length) {
      const a = document.createElement("a"); a.href = "figures/" + imgs[0] + ".png"; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Paper version (static image)"; box.appendChild(a);
    }
    if (state.download) {
      const a = document.createElement("a"); a.href = "#"; a.textContent = "Download data (CSV)";
      a.addEventListener("click", (e) => { e.preventDefault(); state.download(); });
      box.appendChild(a);
    }
  }

  function staticFallback(fig) {
    const imgs = (fig.dataset.images || "").split(",").filter(Boolean);
    const c = fig.querySelector(".fig-chart");
    c.innerHTML = `<div class="fig-static">${imgs.map((i) => `<img src="figures/${i}.png" alt="${S.esc(fig.querySelector(".fig-title").textContent)}" loading="lazy">`).join("")}</div>`;
  }

  function pills(group, label, options, value, onChange) {
    const wrap = document.createElement("div"); wrap.className = "ctl-group";
    const l = document.createElement("span"); l.className = "ctl-label"; l.textContent = label; wrap.appendChild(l);
    options.forEach((o) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "pill"; b.textContent = o.label;
      b.setAttribute("aria-pressed", o.key === value ? "true" : "false");
      b.addEventListener("click", () => { wrap.querySelectorAll(".pill").forEach((p) => p.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); onChange(o.key); });
      wrap.appendChild(b);
    });
    group.appendChild(wrap);
    return wrap;
  }

  // ---- IRF figures ----
  function renderIRF(fig, cfg) {
    const ctl = fig.querySelector(".fig-controls");
    const chart = fig.querySelector(".fig-chart");
    const state = { level: 0.95, scale: 1, eq: !!cfg.equivalence };
    const panels = cfg.panels.filter((p) => p.series.some((s) => s.b && s.b.length));
    if (!panels.length) { staticFallback(fig); links(fig, {}); return; }
    let charts = [];
    function draw() {
      chart.innerHTML = "";
      charts = [];
      const grid = document.createElement("div"); grid.className = "chart-grid cols-" + (panels.length === 1 ? 1 : Math.min(cfg.cols || 2, panels.length)); chart.appendChild(grid);
      const multi = panels.length > 1;
      panels.forEach((p) => {
        const cell = document.createElement("div");
        if (multi) { const t = document.createElement("div"); t.className = "chart-cell-title"; t.textContent = p.title; cell.appendChild(t); }
        const box = document.createElement("div"); cell.appendChild(box); grid.appendChild(cell);
        const unitOK = (p.ytitle || "").startsWith("Percentage");
        charts.push({ p, ch: C.irf(box, { series: p.series, level: state.level, scale: state.scale, equivalence: state.eq && unitOK ? cfg.equivalence : null, leads: !!cfg.leads, ytitle: p.ytitle, width: multi ? 420 : 560, height: multi ? 250 : 320 }) });
      });
      const leg = fig.querySelector(".legend"); if (leg) leg.remove();
      const first = charts[0].ch;
      if (panels[0].series.length > 1) ctl.insertAdjacentHTML("afterend", first.legend());
    }
    ctl.innerHTML = "";
    pills(ctl, "Confidence", [{ key: 0.95, label: "95%" }, { key: 0.9, label: "90%" }], 0.95, (v) => { state.level = v; draw(); });
    pills(ctl, "Shock size", [{ key: 1, label: "One index unit" }, { key: 1.25, label: "Median tightening (1.25)" }, { key: 1.46, label: "One s.d. (1.46)" }], 1, (v) => { state.scale = v; draw(); });
    if (cfg.equivalence) pills(ctl, "Equivalence margin", [{ key: 1, label: "Show ±0.5 pp" }, { key: 0, label: "Hide" }], 1, (v) => { state.eq = !!v; draw(); });
    draw();
    const first = panels[0].series[0];
    links(fig, {
      table: () => charts.map((c) => (panels.length > 1 ? `<h4 class="chart-cell-title">${S.esc(c.p.title)}</h4>` : "") + c.ch.table()).join(""),
      explore: `robustness-explorer.html?outcome=${first.outcome}&shock=${first.shock}&ctrl=${first.ctrl}`,
      download: () => {
        const rows = [];
        panels.forEach((p) => p.series.forEach((s) => s.year.forEach((yv, k) => rows.push({ panel: p.title, series: s.label, outcome: s.outcome, shock: s.shock, controls: s.ctrl, year: yv, b: s.b[k], se: s.se[k], df: s.df[k], N: s.N[k] }))));
        S.download(fig.id.replace(":", "_") + ".csv", S.toCSV(rows, ["panel", "series", "outcome", "shock", "controls", "year", "b", "se", "df", "N"]));
      },
    });
  }

  function renderEvent(fig, cfg) {
    const ctl = fig.querySelector(".fig-controls");
    const chart = fig.querySelector(".fig-chart");
    const panels = cfg.panels.filter((p) => p.series.some((s) => s.b && s.b.length));
    if (!panels.length) { staticFallback(fig); links(fig, {}); return; }
    const state = { level: 0.95 };
    let charts = [];
    function draw() {
      chart.innerHTML = ""; charts = [];
      const grid = document.createElement("div"); grid.className = "chart-grid cols-" + Math.min(cfg.cols || 2, panels.length); chart.appendChild(grid);
      panels.forEach((p) => {
        const cell = document.createElement("div");
        const t = document.createElement("div"); t.className = "chart-cell-title"; t.textContent = p.title; cell.appendChild(t);
        const box = document.createElement("div"); cell.appendChild(box); grid.appendChild(cell);
        charts.push({ p, ch: C.eventStudy(box, { series: p.series, level: state.level, ytitle: p.ytitle, ref: cfg.ref == null ? -1 : cfg.ref, width: 420, height: 250, xtitle: cfg.ref === -1 || cfg.ref == null ? undefined : "Years relative to the reform (0 = policy year, reference)" }) });
      });
    }
    ctl.innerHTML = "";
    pills(ctl, "Confidence", [{ key: 0.95, label: "95%" }, { key: 0.9, label: "90%" }], 0.95, (v) => { state.level = v; draw(); });
    draw();
    links(fig, { table: () => charts.map((c) => `<h4 class="chart-cell-title">${S.esc(c.p.title)}</h4>` + c.ch.table()).join("") });
  }

  // ---- descriptive figures from panel.json ----
  const VARS = [
    ["owner", "Homeownership rate"], ["owner_loan", "Owners with a mortgage"], ["owner_full", "Outright owners"],
    ["owner_young", "Young adult-only households owning"], ["owner_loan_young", "Young adult-only households owning with a mortgage"],
    ["rent_market", "Renters at market rates"], ["rent_reduced", "Renters at reduced rates or rent-free"],
    ["owner_lowinc", "Homeownership rate, low income"], ["owner_highinc", "Homeownership rate, high income"],
  ];
  function renderSpaghetti(fig, cfg, panel) {
    const ctl = fig.querySelector(".fig-controls");
    const chart = fig.querySelector(".fig-chart");
    let v = cfg.var || "owner", ch = null, highlight = null;
    function draw() {
      const byC = d3.group(panel.rows, (r) => r.country);
      const data = Array.from(byC, ([country, rows]) => ({ key: country, label: country, values: rows.filter((r) => r.year >= 2003 && r.year <= 2017).map((r) => ({ x: r.year, y: r[v] })).sort((a, b) => a.x - b.x) }));
      const events = {};
      panel.rows.forEach((r) => { if (r.dmpp && r.dmpp !== 0) (events[r.country] = events[r.country] || []).push({ x: r.year, value: r.dmpp }); });
      ch = C.lines(chart, { data, highlight, average: true, ytitle: (VARS.find((x) => x[0] === v) || [])[1] + " (%)", events, onHighlight: (k) => { highlight = k; } });
    }
    ctl.innerHTML = "";
    const sel = document.createElement("select");
    VARS.forEach(([k, l]) => { const o = document.createElement("option"); o.value = k; o.textContent = l; sel.appendChild(o); });
    sel.value = v; sel.addEventListener("change", () => { v = sel.value; draw(); });
    const lab = document.createElement("label"); lab.className = "ctl-group"; lab.innerHTML = '<span class="ctl-label">Series</span>'; lab.appendChild(sel); ctl.appendChild(lab);
    const hint = document.createElement("span"); hint.className = "muted"; hint.textContent = "Click a line to highlight a country; dots mark years with a change in the policy index (orange: tightening, green: loosening)."; ctl.appendChild(hint);
    draw();
    links(fig, { table: () => ch.table(), explore: null });
  }

  function renderScatter1017(fig, panel) {
    const by = d3.group(panel.rows.filter((r) => r.year === 2010 || r.year === 2017), (r) => r.country);
    const pts = [];
    by.forEach((rows, country) => {
      const a = rows.find((r) => r.year === 2010), b = rows.find((r) => r.year === 2017);
      if (!a || !b || a.owner == null || b.owner == null) return;
      pts.push({ label: country, short: COUNTRY_SHORT[country] || country, x: a.owner, y: b.owner, mpp: (b.sum_mpp || 0) - (a.sum_mpp || 0) });
    });
    const med = d3.median(pts, (p) => p.mpp);
    pts.forEach((p) => { p.group = p.mpp > med ? 1 : 0; });
    const ch = C.scatter45(fig.querySelector(".fig-chart"), { points: pts });
    fig.querySelector(".fig-controls").insertAdjacentHTML("afterend", ch.legend());
    const avg = d3.mean(pts, (p) => p.y - p.x), a1 = d3.mean(pts.filter((p) => p.group === 1), (p) => p.y - p.x), a0 = d3.mean(pts.filter((p) => p.group === 0), (p) => p.y - p.x);
    fig.querySelector(".fig-controls").innerHTML = `<span class="muted">Average change 2010–2017: ${S.fmt.signed(avg, 2)} pp; countries above the median index change: ${S.fmt.signed(a1, 2)} pp; below: ${S.fmt.signed(a0, 2)} pp.</span>`;
    links(fig, { table: () => ch.table() });
  }

  function renderPolicyBars(fig, panel) {
    const years = d3.range(2003, 2018);
    const byC = d3.group(panel.rows, (r) => r.country);
    const data = Array.from(byC, ([country, rows]) => ({ label: country, values: years.map((yv) => { const r = rows.find((q) => q.year === yv); return { x: yv, y: r ? r.dmpp : null }; }) }));
    const ch = C.policyBars(fig.querySelector(".fig-chart"), { data, years });
    fig.querySelector(".fig-controls").insertAdjacentHTML("afterend", ch.legend());
    links(fig, { table: () => ch.table(), explore: "policy-explorer.html" });
  }

  function renderLargeShocks(fig, ls) {
    const ctl = fig.querySelector(".fig-controls");
    const chart = fig.querySelector(".fig-chart");
    const vars = [["owner", "Homeownership rate"], ["owner_lowinc", "Ownership, low income"], ["owner_loan_lowinc", "Ownership with a mortgage, low income"], ["owner_loan_highinc", "Ownership with a mortgage, high income"], ["owner_highinc", "Ownership, high income"], ["owner_loan", "Ownership with a mortgage"], ["owner_full_highinc", "Full ownership, high income"], ["owner_full", "Full ownership"], ["rent", "Renters"]];
    let v = "owner", ch = null;
    const colors = C.COLORS();
    function draw() {
      const byC = d3.group(ls.rows, (r) => r.country);
      const data = Array.from(byC, ([country, rows]) => ({ key: country, label: `${country} (${rows[0].policy_year})`, values: rows.map((r) => ({ x: r.timefrom, y: r[v] })).sort((a, b) => a.x - b.x) }));
      chart.innerHTML = "";
      const width = 620, height = 340, margin = { top: 12, right: 140, bottom: 40, left: 48 };
      const svg = d3.select(chart).append("svg").attr("class", "chart").attr("viewBox", `0 0 ${width} ${height}`).attr("width", "100%");
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
      const w = width - margin.left - margin.right, h = height - margin.top - margin.bottom;
      const x = d3.scaleLinear().domain([-4, 4]).range([0, w]);
      const y = d3.scaleLinear().domain(d3.extent(data.flatMap((s) => s.values.map((q) => q.y)).filter((q) => q != null))).range([h, 0]).nice();
      g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat(""));
      g.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", h).attr("stroke", "#888").attr("stroke-dasharray", "3,3");
      const line = d3.line().defined((q) => q.y != null).x((q) => x(q.x)).y((q) => y(q.y));
      const pal = colors.concat(["#008300", "#eda100", "#e87ba4", "#555"]);
      const labels = [];
      data.forEach((s, i) => {
        g.append("path").datum(s.values).attr("d", line).attr("fill", "none").attr("stroke", pal[i % pal.length]).attr("stroke-width", 2);
        const last = s.values.filter((q) => q.y != null).slice(-1)[0];
        if (last) labels.push({ x: x(last.x) + 5, y: y(last.y), text: s.label, color: pal[i % pal.length] });
      });
      // push end labels apart so they do not overlap
      labels.sort((a, b) => a.y - b.y);
      for (let k = 1; k < labels.length; k++) if (labels[k].y - labels[k - 1].y < 12) labels[k].y = labels[k - 1].y + 12;
      labels.forEach((l) => g.append("text").attr("class", "label").attr("x", l.x).attr("y", l.y + 4).text(l.text).attr("font-size", 10));
      g.append("g").attr("class", "axis").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).ticks(9).tickFormat((q) => (q < 0 ? "−" + Math.abs(q) : q)));
      g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));
      g.append("text").attr("class", "axis-title").attr("x", w / 2).attr("y", h + 32).attr("text-anchor", "middle").text("Years from the policy");
      g.append("rect").attr("width", w).attr("height", h).attr("fill", "transparent").on("pointermove", (ev) => {
        const [mx] = d3.pointer(ev); const xv = Math.round(x.invert(mx));
        const rows = data.map((s, i) => { const q = s.values.find((r) => r.x === xv); return q && q.y != null ? `<div class="t-row"><span class="t-key" style="background:${pal[i % pal.length]}"></span><span class="t-val">${S.fmt.n(q.y, 1)}</span><span class="t-lab">${S.esc(s.label)}</span></div>` : ""; }).join("");
        S.showTip(`<div class="t-title">Year ${xv < 0 ? "−" + Math.abs(xv) : xv}</div>${rows}`, ev);
      }).on("pointerleave", S.hideTip);
      ch = { table: () => `<div class="table-wrap"><table class="data-table"><thead><tr><th>Country</th>${d3.range(-4, 5).map((q) => `<th>${q}</th>`).join("")}</tr></thead><tbody>${data.map((s) => `<tr><th scope="row">${S.esc(s.label)}</th>${d3.range(-4, 5).map((xv) => { const q = s.values.find((r) => r.x === xv); return `<td>${q && q.y != null ? S.fmt.n(q.y, 1) : "–"}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>` };
    }
    ctl.innerHTML = "";
    const sel = document.createElement("select");
    vars.forEach(([k, l]) => { const o = document.createElement("option"); o.value = k; o.textContent = l; sel.appendChild(o); });
    sel.addEventListener("change", () => { v = sel.value; draw(); });
    const lab = document.createElement("label"); lab.className = "ctl-group"; lab.innerHTML = '<span class="ctl-label">Series</span>'; lab.appendChild(sel); ctl.appendChild(lab);
    draw();
    links(fig, { table: () => ch.table() });
  }

  function renderRIHist(fig, cfg) {
    S.data("mv_" + cfg.outcome).then((mv) => {
      const r = mv.ri && mv.ri[String(cfg.h)];
      if (!r) { staticFallback(fig); links(fig, {}); return; }
      const ctl = fig.querySelector(".fig-controls");
      let h = cfg.h, ch = null;
      function draw() {
        const rr = mv.ri[String(h)];
        ch = C.histogram(fig.querySelector(".fig-chart"), { edges: rr.hist.edges, counts: rr.hist.counts, obs: rr.obs, q: rr.q });
        const info = fig.querySelector(".ri-info") || document.createElement("div");
        info.className = "ri-info muted small"; info.textContent = `Horizon ${h + 1}: observed coefficient ${S.fmt.n3(rr.obs)}, randomization p-value ${S.fmt.p(rr.p)} from ${rr.n} permutations; 97.5th percentile ${S.fmt.n3(rr.q[4])}. Joint p-value across horizons ${S.fmt.p(mv.ri.joint_p)}.`;
        ctl.insertAdjacentElement("afterend", info);
      }
      ctl.innerHTML = "";
      pills(ctl, "Horizon", [0, 1, 2, 3, 4].map((k) => ({ key: k, label: String(k + 1) })), h, (v) => { h = v; draw(); });
      draw();
      links(fig, { table: () => ch.table(), explore: `robustness-explorer.html?outcome=${cfg.outcome}#inference` });
    });
  }

  // ---- dispatch ----
  S.data("figures").then((F) => {
    const needPanel = figs.some((f) => ["scatter1017", "spaghetti", "policybars"].includes((F[f.id] || {}).type));
    const panelP = needPanel ? S.data("panel") : Promise.resolve(null);
    const needLS = figs.some((f) => (F[f.id] || {}).type === "largeshocks");
    const lsP = needLS ? S.data("largeshocks") : Promise.resolve(null);
    Promise.all([panelP, lsP]).then(([panel, ls]) => {
      figs.forEach((fig) => {
        const cfg = F[fig.id];
        try {
          if (!cfg || cfg.type === "static") { staticFallback(fig); links(fig, {}); }
          else if (cfg.type === "irf") renderIRF(fig, cfg);
          else if (cfg.type === "event") renderEvent(fig, cfg);
          else if (cfg.type === "spaghetti") renderSpaghetti(fig, cfg, panel);
          else if (cfg.type === "scatter1017") renderScatter1017(fig, panel);
          else if (cfg.type === "policybars") renderPolicyBars(fig, panel);
          else if (cfg.type === "largeshocks") renderLargeShocks(fig, ls);
          else if (cfg.type === "rihist") renderRIHist(fig, cfg);
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
