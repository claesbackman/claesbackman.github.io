/* Robustness explorer: one outcome at a time, every specification in the
   multiverse grid (data/mv_<outcome>.json), leave-one-out, alternative
   inference, randomization inference and the event-study variants. */
(function () {
  "use strict";
  const S = window.Site, C = window.Charts;
  const $ = (sel, el = document) => el.querySelector(sel);
  const BASE = { shock: "dmpp", ctrl: "eurostat", fe: "cy", sample: "full", wt: "none", lhs: "cum" };
  const DIM_ORDER = ["shock", "ctrl", "fe", "sample", "wt", "lhs"];
  const DIM_LABEL = { shock: "Policy index", ctrl: "Controls", fe: "Fixed effects", sample: "Sample", wt: "Weights", lhs: "Dependent variable" };
  const INDEX_SHOCKS = ["dmpp", "dmpp_lsr", "dmpp_unw", "dmpp_allcc", "dmpp_impl", "dmpp_macro", "dimapp", "dimapp_hh"];

  const state = {
    outcome: S.qs("outcome") || "owner",
    focal: Object.assign({}, BASE),
    h: 4, delta: 0.5, level: 0.95,
    filter: {},      // dim -> Set of keys
    compare: true,
  };
  DIM_ORDER.forEach((d) => { const v = S.qs(d); if (v) state.focal[d] = v; });
  if (S.qs("h")) state.h = Math.max(0, Math.min(4, +S.qs("h") - 1));

  let INDEX = null, MV = null, ES = null;
  let byKey = null; // spec key -> {h: row}
  let dims = null;  // {dim: [{key,label}]}

  function key(f) { return DIM_ORDER.map((d) => f[d]).join("|"); }
  function lab(dim, k) { const l = (dims[dim] || []).find((x) => x.key === k); return l ? l.label : k; }
  function unitOf() { const o = INDEX.outcomes.find((x) => x.key === state.outcome); return o ? o.unit : "pp"; }
  function ytitle() { return unitOf() === "%" ? "Percent" : "Percentage points"; }

  function loadOutcome(outcome) {
    return S.data("mv_" + outcome).then((mv) => {
      MV = mv;
      byKey = new Map();
      mv.rows.forEach((r) => {
        const f = {};
        DIM_ORDER.forEach((d, i) => { f[d] = dims[d][r[i]].key; });
        const k = key(f);
        if (!byKey.has(k)) byKey.set(k, { f, h: {} });
        byKey.get(k).h[r[6]] = { b: r[7], se: r[8], df: r[9], N: r[10], nclust: r[11] };
      });
    });
  }

  // which levels exist for this outcome, given the other focal choices held fixed
  function available(dim) {
    const set = new Set();
    byKey.forEach((v) => { set.add(v.f[dim]); });
    return set;
  }
  function specRows(f) { const v = byKey.get(key(f)); return v ? v.h : null; }
  function stats(row, delta) {
    if (!row || ![row.b, row.se, row.df].every((v) => Number.isFinite(v)) || row.se <= 0) return null;
    const t = S.tcrit(row.df, 1 - state.level);
    return Object.assign({}, row, { lo: row.b - t * row.se, hi: row.b + t * row.se, p: S.pval(row.b, row.se, row.df), tost: S.tost(row.b, row.se, row.df, delta), mde: S.mde(row.se) });
  }

  function seriesFor(f, label) {
    const rows = specRows(f);
    if (!rows) return null;
    const hs = Object.keys(rows).map(Number).sort((a, b) => a - b).filter((h) => rows[h].b != null);
    return { label, year: hs.map((h) => (h >= 0 ? h + 1 : h)), b: hs.map((h) => rows[h].b), se: hs.map((h) => rows[h].se), df: hs.map((h) => rows[h].df), N: hs.map((h) => rows[h].N) };
  }

  // ------------------------------------------------------------ controls
  function renderOutcomeSelect() {
    const sel = $("#outcome");
    sel.innerHTML = "";
    const groups = {};
    INDEX.outcomes.forEach((o) => { (groups[o.group] = groups[o.group] || []).push(o); });
    Object.keys(groups).forEach((g) => {
      const og = document.createElement("optgroup"); og.label = g;
      groups[g].forEach((o) => { const op = document.createElement("option"); op.value = o.key; op.textContent = `${o.label} (${INDEX.counts[o.key].specs} specifications)`; og.appendChild(op); });
      sel.appendChild(og);
    });
    sel.value = state.outcome;
    sel.addEventListener("change", () => { state.outcome = sel.value; selectOutcome(); });
  }

  function renderFocalControls() {
    const box = $("#focal-controls");
    box.innerHTML = "";
    DIM_ORDER.forEach((dim) => {
      const avail = available(dim);
      if (avail.size >= 1 && !avail.has(state.focal[dim])) state.focal[dim] = avail.has(BASE[dim]) ? BASE[dim] : Array.from(avail)[0];
      const wrap = document.createElement("div"); wrap.className = "ctl-group";
      wrap.innerHTML = `<span class="ctl-label">${DIM_LABEL[dim]}</span>`;
      dims[dim].forEach((lv) => {
        if (!avail.has(lv.key)) return;
        const b = document.createElement("button"); b.type = "button"; b.className = "pill"; b.textContent = lv.label;
        b.setAttribute("aria-pressed", state.focal[dim] === lv.key ? "true" : "false");
        b.addEventListener("click", () => { state.focal[dim] = lv.key; syncUrl(); renderFocal(); renderFocalControls(); renderLOO(); });
        wrap.appendChild(b);
      });
      box.appendChild(wrap);
    });
    // if the focal spec does not exist, fall back to the closest estimated one
    if (!specRows(state.focal) && byKey.size) {
      const score = (f) => DIM_ORDER.reduce((a, d) => a + (f[d] === state.focal[d] ? 1 : 0), 0);
      let best = null, bs = -1;
      byKey.forEach((v) => { const sc = score(v.f); if (sc > bs) { bs = sc; best = v.f; } });
      if (best) { state.focal = Object.assign({}, best); renderFocalControls(); }
    }
  }

  function renderFilterControls() {
    const box = $("#filter-controls");
    box.innerHTML = "";
    DIM_ORDER.forEach((dim) => {
      const avail = available(dim);
      if (!state.filter[dim]) {
        state.filter[dim] = new Set(dims[dim].filter((l) => avail.has(l.key)).map((l) => l.key));
        if (dim === "shock") state.filter[dim] = new Set(Array.from(state.filter[dim]).filter((k) => INDEX_SHOCKS.includes(k)));
        if (dim === "lhs") state.filter[dim] = new Set(["cum"]);
        if (![...state.filter[dim]].some((k) => avail.has(k))) state.filter[dim] = new Set(dims[dim].filter((l) => avail.has(l.key)).map((l) => l.key));
      }
      const wrap = document.createElement("div"); wrap.className = "ctl-group";
      wrap.innerHTML = `<span class="ctl-label">${DIM_LABEL[dim]}</span>`;
      dims[dim].forEach((lv) => {
        if (!avail.has(lv.key)) return;
        const b = document.createElement("button"); b.type = "button"; b.className = "pill"; b.textContent = lv.label;
        b.setAttribute("aria-pressed", state.filter[dim].has(lv.key) ? "true" : "false");
        b.addEventListener("click", () => {
          if (state.filter[dim].has(lv.key)) { if (state.filter[dim].size > 1) state.filter[dim].delete(lv.key); } else state.filter[dim].add(lv.key);
          b.setAttribute("aria-pressed", state.filter[dim].has(lv.key) ? "true" : "false");
          renderCurve();
        });
        wrap.appendChild(b);
      });
      const all = document.createElement("button"); all.type = "button"; all.className = "pill dim"; all.textContent = "all";
      all.addEventListener("click", () => { state.filter[dim] = new Set(dims[dim].filter((l) => avail.has(l.key)).map((l) => l.key)); renderFilterControls(); renderCurve(); });
      wrap.appendChild(all);
      box.appendChild(wrap);
    });
  }

  function syncUrl() {
    const p = new URLSearchParams();
    p.set("outcome", state.outcome);
    DIM_ORDER.forEach((d) => { if (state.focal[d] !== BASE[d]) p.set(d, state.focal[d]); });
    p.set("h", state.h + 1);
    history.replaceState(null, "", "?" + p.toString() + location.hash);
  }

  // ------------------------------------------------------------ focal IRF
  function renderFocal() {
    const rows = specRows(state.focal);
    const chart = $("#focal-chart"), tbl = $("#focal-table");
    $("#focal-title").textContent = INDEX.outcomes.find((o) => o.key === state.outcome).label;
    $("#focal-desc").innerHTML = DIM_ORDER.map((d) => `<span class="badge">${S.esc(lab(d, state.focal[d]))}</span>`).join(" ");
    if (!rows) { chart.innerHTML = '<p class="muted">This combination was not estimated for this outcome.</p>'; tbl.innerHTML = ""; return; }
    const series = [seriesFor(state.focal, "Selected specification")];
    const isBase = key(state.focal) === key(BASE);
    if (state.compare && !isBase && specRows(BASE)) series.push(Object.assign(seriesFor(BASE, "Baseline (overall index, Eurostat controls)"), { color: "#9a9a94" }));
    const eqOK = unitOf() === "pp";
    const ch = C.irf(chart, { series, level: state.level, equivalence: eqOK ? state.delta : null, leads: series[0].year.some((y) => y < 0), ytitle: ytitle(), width: 640, height: 330 });
    $("#focal-legend").innerHTML = series.length > 1 ? ch.legend() : "";
    // table
    const hs = [0, 1, 2, 3, 4];
    let html = `<table class="est"><thead><tr><th></th>${hs.map((h) => `<th>h=${h + 1}</th>`).join("")}</tr></thead><tbody>`;
    const st = hs.map((h) => stats(rows[h], state.delta));
    const row = (label, fn) => `<tr><th scope="row">${label}</th>${st.map((s) => `<td>${s ? fn(s) : "–"}</td>`).join("")}</tr>`;
    html += row("Coefficient", (s) => S.fmt.n3(s.b) + (s.p < 0.01 ? "<sup>***</sup>" : s.p < 0.05 ? "<sup>**</sup>" : s.p < 0.1 ? "<sup>*</sup>" : ""));
    html += row("Standard error", (s) => `(${S.fmt.n3(s.se)})`);
    html += row(`${Math.round(state.level * 100)}% confidence interval`, (s) => `[${S.fmt.n3(s.lo)}, ${S.fmt.n3(s.hi)}]`);
    html += row("p-value (clustered by country)", (s) => S.fmt.p(s.p));
    if (eqOK) {
      html += row(`TOST p-value (δ = ${state.delta} pp)`, (s) => S.fmt.p(s.tost));
      html += row(`Equivalence at δ = ${state.delta} pp`, (s) => (s.tost < 0.05 ? "Yes" : "No"));
    }
    html += row("Minimum detectable effect (80% power)", (s) => S.fmt.n3(s.mde));
    html += row("Observations", (s) => S.fmt.int(s.N));
    html += row("Countries", (s) => S.fmt.int(s.nclust));
    html += `</tbody></table><p class="small muted">Standard errors clustered by country. * p&lt;0.1, ** p&lt;0.05, *** p&lt;0.01. The TOST p-value is the larger of the two one-sided p-values against ±δ; equivalence holds when it is below 0.05.</p>`;
    tbl.innerHTML = html;
  }

  // ------------------------------------------------------------ spec curve
  function renderCurve() {
    const h = state.h;
    const specs = [];
    byKey.forEach((v, k) => {
      if (!DIM_ORDER.every((d) => state.filter[d].has(v.f[d]))) return;
      const s = stats(v.h[h], state.delta);
      if (!s) return;
      specs.push({ id: k, b: s.b, lo: s.lo, hi: s.hi, se: s.se, p: s.p, tost: s.tost, sig: s.p < 0.05, N: s.N, nclust: s.nclust, dims: v.f });
    });
    const box = $("#curve-chart");
    if (!specs.length) { box.innerHTML = '<p class="muted">No specifications match the current filters.</p>'; $("#curve-stats").innerHTML = ""; return; }
    const dimsForMatrix = DIM_ORDER.map((d) => ({ key: d, label: DIM_LABEL[d], levels: dims[d].filter((l) => state.filter[d].has(l.key) && specs.some((s) => s.dims[d] === l.key)) }));
    const ch = C.specCurve(box, { specs, dims: dimsForMatrix, baselineId: key(BASE), equivalence: unitOf() === "pp" ? state.delta : null, ytitle: ytitle(), width: 1010,
      onSelect: (s) => { state.focal = Object.assign({}, s.dims); syncUrl(); renderFocalControls(); renderFocal(); renderLOO(); $("#focal").scrollIntoView({ behavior: "smooth", block: "start" }); } });
    $("#curve-legend").innerHTML = ch.legend();
    const n = specs.length, negSig = specs.filter((s) => s.sig && s.b < 0).length, posSig = specs.filter((s) => s.sig && s.b > 0).length;
    const eq = specs.filter((s) => s.tost < 0.05).length, neg = specs.filter((s) => s.b < 0).length;
    const med = d3.median(specs, (s) => s.b), lo = d3.min(specs, (s) => s.b), hi = d3.max(specs, (s) => s.b);
    const below = specs.filter((s) => s.lo > -state.delta).length;
    const tile = (label, value, sub) => `<div class="stat"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub || ""}</div></div>`;
    $("#curve-stats").innerHTML =
      tile("Specifications", n, `horizon ${h + 1}`) +
      tile("Negative and significant", `${negSig}`, `${(100 * negSig / n).toFixed(1)}% of specifications (5% level)`) +
      tile("Positive and significant", `${posSig}`, `${(100 * posSig / n).toFixed(1)}%`) +
      tile("Median coefficient", S.fmt.n3(med), `range ${S.fmt.n3(lo)} to ${S.fmt.n3(hi)}; ${neg} negative point estimates`) +
      (unitOf() === "pp" ? tile(`Equivalence at ±${state.delta} pp`, `${(100 * eq / n).toFixed(0)}%`, `${eq} of ${n} specifications (TOST, 5%)`) + tile(`Rule out a decline of ${state.delta} pp`, `${(100 * below / n).toFixed(0)}%`, `lower CI bound above −${state.delta}`) : "");
    // CSV download of the displayed specifications
    $("#curve-download").onclick = (e) => {
      e.preventDefault();
      const rows = ch.sorted.map((s) => Object.assign({ outcome: state.outcome, horizon: h + 1 }, s.dims, { b: s.b, se: s.se, ci_lo: s.lo, ci_hi: s.hi, p: s.p, tost_p: s.tost, N: s.N, countries: s.nclust }));
      S.download(`speccurve_${state.outcome}_h${h + 1}.csv`, S.toCSV(rows, ["outcome", "horizon", ...DIM_ORDER, "b", "se", "ci_lo", "ci_hi", "p", "tost_p", "N", "countries"]));
    };
  }

  // ------------------------------------------------------------ leave-one-out
  function renderLOO() {
    const box = $("#loo-country"), boxY = $("#loo-year"), note = $("#loo-note");
    const f = state.focal;
    const ok = ["dmpp", "dmpp_lsr"].includes(f.shock) && ["none", "eurostat"].includes(f.ctrl) && f.fe === "cy" && f.sample === "full" && f.wt === "none" && f.lhs === "cum";
    const use = ok ? f : Object.assign({}, BASE);
    note.textContent = ok ? `Specification: ${lab("shock", use.shock)}, ${lab("ctrl", use.ctrl)}, horizon ${state.h + 1}.` : `Leave-one-out estimates are available for the overall and lending-standard indices with and without controls (baseline design). Showing the baseline: ${lab("shock", use.shock)}, ${lab("ctrl", use.ctrl)}, horizon ${state.h + 1}.`;
    const ref = stats(specRows(use)[state.h], state.delta);
    ["country", "year"].forEach((kind) => {
      const rows = MV.loo[kind].filter((r) => dims.shock[r[0]].key === use.shock && dims.ctrl[r[1]].key === use.ctrl && r[3] === state.h && r[4] != null);
      const items = rows.map((r) => { const t = S.tcrit(r[6], 1 - state.level); return { label: kind === "country" ? "Without " + r[2] : "Without " + r[2], b: r[4], lo: r[4] - t * r[5], hi: r[4] + t * r[5], N: r[7], sig: S.pval(r[4], r[5], r[6]) < 0.05 }; }).sort((a, b) => a.b - b.b);
      const target = kind === "country" ? box : boxY;
      if (!items.length) { target.innerHTML = '<p class="muted">Not available.</p>'; return; }
      C.dotRange(target, { items, ref, xtitle: `Coefficient at horizon ${state.h + 1} (${ytitle().toLowerCase()})`, labelTitle: kind === "country" ? "Dropped country" : "Dropped year", width: 480 });
    });
  }

  // ------------------------------------------------------------ inference
  function renderInference() {
    const box = $("#inference-table");
    if (!MV.inference || !MV.inference.length) { box.innerHTML = '<p class="muted">Not available for this outcome.</p>'; return; }
    let html = "";
    ["none", "eurostat"].forEach((c) => {
      const rows = MV.inference.filter((r) => r.ctrl === c).sort((a, b) => a.h - b.h);
      if (!rows.length) return;
      html += `<h3>${lab("ctrl", c)}</h3><table class="est"><thead><tr><th></th>${rows.map((r) => `<th>h=${r.h + 1}</th>`).join("")}</tr></thead><tbody>`;
      const row = (label, fn) => `<tr><th scope="row">${label}</th>${rows.map((r) => `<td>${fn(r)}</td>`).join("")}</tr>`;
      html += row("Coefficient", (r) => S.fmt.n3(r.b));
      html += row("Clustered by country: s.e.", (r) => `(${S.fmt.n3(r.se_cl)})`);
      html += row("Clustered by country: p-value", (r) => S.fmt.p(r.p_cl));
      html += row("Heteroskedasticity-robust s.e.", (r) => `(${S.fmt.n3(r.se_hc)})`);
      html += row("Two-way clustered (country, year) s.e.", (r) => (r.se_tw ? `(${S.fmt.n3(r.se_tw)})` : "n/a"));
      html += row("Driscoll–Kraay s.e. (2 lags)", (r) => `(${S.fmt.n3(r.se_dk)})`);
      html += row("Wild cluster bootstrap p-value (Webb, 999 reps)", (r) => S.fmt.p(r.p_boot));
      html += row("Wild cluster bootstrap 95% CI", (r) => `[${S.fmt.n3(r.ci_boot[0])}, ${S.fmt.n3(r.ci_boot[1])}]`);
      if (c === "none" && MV.ri) html += row("Randomization-inference p-value", (r) => (MV.ri[String(r.h)] ? S.fmt.p(MV.ri[String(r.h)].p) + ` (${MV.ri[String(r.h)].n})` : "–"));
      html += row("Observations", (r) => S.fmt.int(r.N));
      html += "</tbody></table>";
    });
    if (MV.ri) html += `<p class="small muted">Randomization inference reshuffles the index change across countries within each year and re-estimates the specification without controls; the p-value is the share of permutations with an absolute coefficient at least as large as the observed one. Joint p-value for the largest absolute coefficient across horizons: ${S.fmt.p(MV.ri.joint_p)}.</p>`;
    html += `<p class="small muted">Two-way clustering is shown as n/a where the estimated variance is not positive with 15 year clusters.</p>`;
    box.innerHTML = html;
    const rb = $("#ri-chart");
    if (MV.ri && MV.ri[String(state.h)]) {
      const rr = MV.ri[String(state.h)];
      C.histogram(rb, { edges: rr.hist.edges, counts: rr.hist.counts, obs: rr.obs, q: rr.q, width: 520, height: 260 });
      $("#ri-note").textContent = `Horizon ${state.h + 1}, no controls: observed coefficient ${S.fmt.n3(rr.obs)}, p = ${S.fmt.p(rr.p)}, 2.5th and 97.5th percentiles ${S.fmt.n3(rr.q[0])} and ${S.fmt.n3(rr.q[4])}.`;
    } else { rb.innerHTML = ""; $("#ri-note").textContent = "Randomization inference was run for the six headline outcomes."; }
  }

  // ------------------------------------------------------------ event study
  function renderES() {
    const sec = $("#es-section");
    S.data("es").then((es) => {
      ES = es;
      const rows = es.att.filter((r) => r.outcome === state.outcome);
      if (!rows.length) { sec.hidden = true; return; }
      sec.hidden = false;
      const VL = { all5: "All five reforms (not-yet-treated and never-treated controls)", all5_never: "All five reforms, never-treated controls only", all5_cleanctrl: "Controls without any borrower-based tightening" };
      const vlab = (v) => VL[v] || (v.startsWith("without_") ? "Without " + v.slice(8) : v.startsWith("only_") ? v.slice(5) + " only" : v);
      let html = `<table class="est"><thead><tr><th>Sample</th><th>Simple ATT</th><th>Pre-reform average</th><th>Post-reform average</th><th>TWFE post indicator</th></tr></thead><tbody>`;
      rows.forEach((r) => { html += `<tr><th scope="row">${S.esc(vlab(r.variant))}</th><td>${S.fmt.n3(r.att)}<br><span class="muted">(${S.fmt.n3(r.att_se)})</span></td><td>${S.fmt.n3(r.pre_avg)}<br><span class="muted">(${S.fmt.n3(r.pre_se)})</span></td><td>${S.fmt.n3(r.post_avg)}<br><span class="muted">(${S.fmt.n3(r.post_se)})</span></td><td>${S.fmt.n3(r.twfe)}<br><span class="muted">(${S.fmt.n3(r.twfe_se)})</span></td></tr>`; });
      html += "</tbody></table>";
      if (es.perm[state.outcome]) html += `<p class="small muted">Permutation inference: reassigning the five treatment dates to five random countries ${es.perm[state.outcome].n} times gives a p-value of ${S.fmt.p(es.perm[state.outcome].p)} for the simple ATT of ${S.fmt.n3(es.perm[state.outcome].obs)}.</p>`;
      $("#es-table").innerHTML = html;
      const ev = es.event[state.outcome] || {};
      const sel = $("#es-variant"); sel.innerHTML = "";
      Object.keys(ev).forEach((v) => { const o = document.createElement("option"); o.value = v; o.textContent = vlab(v); sel.appendChild(o); });
      const draw = () => {
        const d = ev[sel.value]; if (!d) return;
        C.eventStudy($("#es-chart"), { series: [{ label: vlab(sel.value), h: d.map((x) => x.h), b: d.map((x) => x.b), se: d.map((x) => x.se) }], level: state.level, ytitle: ytitle(), width: 640, height: 300 });
      };
      sel.onchange = draw; draw();
    });
  }

  // ------------------------------------------------------------ wiring
  function selectOutcome() {
    syncUrl();
    $("#loading").hidden = false;
    loadOutcome(state.outcome).then(() => {
      $("#loading").hidden = true;
      DIM_ORDER.forEach((d) => { delete state.filter[d]; });
      renderFocalControls(); renderFocal(); renderFilterControls(); renderCurve(); renderLOO(); renderInference(); renderES();
    }).catch((e) => { $("#loading").textContent = "Could not load data for this outcome: " + e.message; });
  }

  S.data("mv_index").then((idx) => {
    INDEX = idx; dims = idx.dims;
    renderOutcomeSelect();
    // global controls
    const hs = $("#horizon");
    [0, 1, 2, 3, 4].forEach((k) => { const b = document.createElement("button"); b.type = "button"; b.className = "pill"; b.textContent = String(k + 1); b.setAttribute("aria-pressed", k === state.h ? "true" : "false"); b.addEventListener("click", () => { state.h = k; hs.querySelectorAll(".pill").forEach((p) => p.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); syncUrl(); renderCurve(); renderLOO(); renderInference(); }); hs.appendChild(b); });
    const ds = $("#delta");
    [0.1, 0.25, 0.5, 1].forEach((d) => { const b = document.createElement("button"); b.type = "button"; b.className = "pill"; b.textContent = d + " pp"; b.setAttribute("aria-pressed", d === state.delta ? "true" : "false"); b.addEventListener("click", () => { state.delta = d; ds.querySelectorAll(".pill").forEach((p) => p.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); renderFocal(); renderCurve(); }); ds.appendChild(b); });
    const ls = $("#level");
    [0.95, 0.9].forEach((l) => { const b = document.createElement("button"); b.type = "button"; b.className = "pill"; b.textContent = Math.round(l * 100) + "%"; b.setAttribute("aria-pressed", l === state.level ? "true" : "false"); b.addEventListener("click", () => { state.level = l; ls.querySelectorAll(".pill").forEach((p) => p.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); renderFocal(); renderCurve(); renderLOO(); renderES(); }); ls.appendChild(b); });
    $("#compare").addEventListener("change", (e) => { state.compare = e.target.checked; renderFocal(); });
    $("#reset").addEventListener("click", () => { state.focal = Object.assign({}, BASE); syncUrl(); renderFocalControls(); renderFocal(); renderLOO(); });
    selectOutcome();
  });
})();
