import { el, frame, line, vline, hline, bar, hoverX, hoverEl, tipHTML, legend, mount, cssVar, fmt, ticks, scale } from './charts.js';

const $ = id => document.getElementById(id);
const C = () => ({
  pre: cssVar('--s-pre'), post: cssVar('--s-post'), flow: cssVar('--s-flow'), neutral: cssVar('--s-neutral'),
  text: cssVar('--text'), text2: cssVar('--text-2'), text3: cssVar('--text-3'), axis: cssVar('--axis'),
  fillB: cssVar('--fill-B'), fillM: cssVar('--fill-M'), windowFill: cssVar('--window'), surface: cssVar('--surface'),
  accent: cssVar('--accent'), grid: cssVar('--grid'),
});
const redraws = [];
const reg = (container, draw) => { const r = mount(container, draw); redraws.push(r); return r; };
const redrawAll = () => redraws.forEach(r => r());

const PRE_YEARS = [2011, 2012, 2013, 2014, 2015];
const POST_YEARS = [2016, 2017, 2018];
const PAPER = { '50': { L: 48.5, U: 51.5 }, '70': { L: 68.5, U: 71.5 } };

// ------------------------------------------------------------------ data
const [bins, checks, model, pub] = await Promise.all(
  ['bins', 'checks', 'model', 'published'].map(n => fetch(`data/${n}.json`).then(r => r.json())));

// ------------------------------------------------------------------ state <-> URL
const qs = new URLSearchParams(location.search);
const state = {
  t: qs.get('t') === '70' ? '70' : '50',
  pre: parseYears(qs.get('pre'), PRE_YEARS),
  post: parseYears(qs.get('post'), POST_YEARS),
  L: null, U: null,
};
state.L = clampNum(+qs.get('L'), +state.t - 5, +state.t - 0.5, PAPER[state.t].L);
state.U = clampNum(+qs.get('U'), +state.t + 0.5, +state.t + 5, PAPER[state.t].U);

function parseYears(s, all) {
  if (!s) return [...all];
  const ys = s.split(',').map(Number).filter(y => all.includes(y));
  return ys.length ? ys.sort() : [...all];
}
function clampNum(v, lo, hi, dflt) { return Number.isFinite(v) && v >= lo && v <= hi && v !== 0 ? Math.round(v * 2) / 2 : dflt; }
function writeURL() {
  const p = new URLSearchParams();
  const def = state.L === PAPER[state.t].L && state.U === PAPER[state.t].U && state.pre.length === 5 && state.post.length === 3;
  if (!def || state.t !== '50') {
    p.set('t', state.t); p.set('pre', state.pre.join(',')); p.set('post', state.post.join(','));
    p.set('L', state.L); p.set('U', state.U);
  }
  const q = p.toString();
  history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
}

// ------------------------------------------------------------------ estimator (identical to the do-file)
function estimate(t, pre, post, L, U) {
  const th = bins.thresholds[t], e = th.edges, T = +t;
  const a = th.pre[pre.join(',')], b = th.post[post.join(',')];
  let B = 0, M = 0, cf = 0, nb = 0;
  e.forEach((x, i) => {
    if (x >= L && x <= T) { B += b[i] - a[i]; cf += a[i]; nb++; }
    else if (x > T && x <= U) M += b[i] - a[i];
  });
  const dltv = B / cf * nb * 0.5;
  const a0 = T === 50 ? 0 : 0.01, da = 0.01;
  const astar = a0 + da + da * T / dltv;
  const el_ = (dltv / T) / (astar - a0);
  return { B, M, dltv, e: el_, ratio: Math.abs(M) / B, a, b, edges: e };
}

// published values matching a live choice (B, dLTV, e depend on L; M on U)
function publishedFor(t, L, U, allYears) {
  const g = pub.groups.find(g => g.id === 'win' + t);
  const main = pub.groups.find(g => g.id === 'main').rows.find(r => r.T === +t);
  const rowL = allYears ? g.rows.find(r => r.L === L) : null;
  const rowU = allYears ? g.rows.find(r => r.U === U) : null;
  return {
    B: rowL ? { v: rowL.B, match: true } : { v: main.B, match: false },
    dLTV: rowL ? { v: rowL.dLTV, match: true } : { v: main.dLTV, match: false },
    e: rowL ? { v: rowL.e, match: true } : { v: main.e, match: false },
    M: rowU ? { v: rowU.M, match: true } : { v: main.M, match: false },
    ratio: (rowL && rowU) ? { v: [Math.abs(rowU.M[0]) / rowL.B[0], null], match: true } : { v: [Math.abs(main.M[0]) / main.B[0], null], match: false },
  };
}

// ------------------------------------------------------------------ policy chart
reg($('chart-policy'), c => {
  const k = C();
  const f = frame(c, { x: [0, 85], y: [0, 2.5], xTicks: [0, 20, 40, 50, 60, 70, 85], yTicks: [0, 1, 2], yFmt: v => v + '%', xFmt: v => v + '%', xTitle: 'LTV at origination', margin: { l: 38, t: 16 } });
  const post = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 1 }, { x: 70, y: 1 }, { x: 70, y: 2 }, { x: 85, y: 2 }];
  line(f, [{ x: 0, y: 0.03 }, { x: 85, y: 0.03 }], { color: k.pre, width: 2.5, dash: '5 4' });
  line(f, post, { color: k.post, width: 2.5 });
  const lab = (x, y, s, cls = 'dlabel') => { const t = el('text', { x: f.x(x), y: f.y(y) - 7, 'text-anchor': 'middle', class: cls }, f.layers.front); t.textContent = s; };
  lab(60, 1, 'From June 2016: 1%'); lab(77.5, 2, '2%');
  lab(25, 0.03, 'Before June 2016: no requirement');
});

// ------------------------------------------------------------------ evidence explorer
function buildChips(container, years, key, cls) {
  container.innerHTML = '';
  for (const y of years) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = `chip ${cls}`; b.textContent = y;
    b.setAttribute('aria-pressed', state[key].includes(y));
    b.addEventListener('click', () => {
      const on = state[key].includes(y);
      if (on && state[key].length === 1) return;            // keep at least one year
      state[key] = on ? state[key].filter(v => v !== y) : [...state[key], y].sort();
      b.setAttribute('aria-pressed', !on);
      updateEvidence();
    });
    container.appendChild(b);
  }
}
buildChips($('ev-pre'), PRE_YEARS, 'pre', 'pre');
buildChips($('ev-post'), POST_YEARS, 'post', 'post');

function setSeg(container, v) { container.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === String(v))); }
function onSeg(container, fn) { container.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; setSeg(container, b.dataset.v); fn(b.dataset.v); }); }

function syncSliders() {
  const T = +state.t, L = $('ev-L'), U = $('ev-U');
  L.min = T - 5; L.max = T - 0.5; L.value = state.L;
  U.min = T + 0.5; U.max = T + 5; U.value = state.U;
  $('ev-L-out').textContent = state.L.toFixed(1); $('ev-U-out').textContent = state.U.toFixed(1);
}
onSeg($('ev-threshold'), v => { state.t = v; state.L = PAPER[v].L; state.U = PAPER[v].U; syncSliders(); updateEvidence(); });
$('ev-L').addEventListener('input', e => { state.L = +e.target.value; $('ev-L-out').textContent = state.L.toFixed(1); updateEvidence(); });
$('ev-U').addEventListener('input', e => { state.U = +e.target.value; $('ev-U-out').textContent = state.U.toFixed(1); updateEvidence(); });
$('ev-reset').addEventListener('click', () => setEvidence({ t: state.t, ...PAPER[state.t], pre: [...PRE_YEARS], post: [...POST_YEARS] }));

function setEvidence(s) {
  Object.assign(state, s);
  setSeg($('ev-threshold'), state.t);
  buildChips($('ev-pre'), PRE_YEARS, 'pre', 'pre');
  buildChips($('ev-post'), POST_YEARS, 'post', 'post');
  syncSliders(); updateEvidence();
}

const yearsLabel = ys => {
  if (ys.length === 1) return String(ys[0]);
  const contiguous = ys.every((y, i) => !i || y === ys[i - 1] + 1);
  return contiguous ? `${ys[0]}–${ys[ys.length - 1]}` : ys.join(', ');
};

function drawEvidence(c) {
  const k = C(), T = +state.t, r = estimate(state.t, state.pre, state.post, state.L, state.U);
  const lo = T - 10, hi = T + 10;
  const idx = r.edges.map((x, i) => i).filter(i => r.edges[i] >= lo && r.edges[i] <= hi);
  const xs = idx.map(i => r.edges[i]);
  const ymax = Math.max(...idx.map(i => Math.max(r.a[i], r.b[i])));
  const f = frame(c, { x: [lo, hi], y: [0, Math.ceil(ymax + 0.5)], xTicks: Array.from({ length: 11 }, (_, i) => lo + 2 * i), xFmt: v => v, yFmt: v => v + '%', xTitle: 'LTV bin (lower edge, 0.5pp bins)', yTitle: 'Percent of loans', margin: { t: 24, l: 40 }, label: 'Post-reform and counterfactual LTV distributions' });
  // excluded window
  el('rect', { x: f.x(state.L), width: f.x(state.U) - f.x(state.L), y: 0, height: f.h, fill: k.windowFill }, f.layers.back);
  vline(f, state.L, { dash: '3 3', color: k.axis });
  vline(f, state.U, { dash: '3 3', color: k.axis });
  vline(f, T, { color: k.text2, width: 1.5, label: `Threshold ${T}%`, dy: 12 });
  // B and M areas
  const area = (sel, fill) => {
    const ii = idx.filter(sel); if (!ii.length) return;
    const top = ii.map(i => `${f.x(r.edges[i])},${f.y(r.b[i])}`), bot = ii.slice().reverse().map(i => `${f.x(r.edges[i])},${f.y(r.a[i])}`);
    el('polygon', { points: [...top, ...bot].join(' '), fill }, f.layers.back);
  };
  area(i => r.edges[i] >= state.L && r.edges[i] <= T, k.fillB);
  area(i => r.edges[i] >= T + 0.5 && r.edges[i] <= state.U, k.fillM);
  line(f, idx.map(i => ({ x: r.edges[i], y: r.a[i] })), { color: k.pre, width: 2, dash: '6 4' });
  line(f, idx.map(i => ({ x: r.edges[i], y: r.b[i] })), { color: k.post, width: 2, markers: true, r: 2.5 });
  hoverX(f, xs, j => {
    const i = idx[j];
    return tipHTML(`Bin ${r.edges[i].toFixed(1)}–${(r.edges[i] + 0.5).toFixed(1)}`, [
      { color: k.post, label: `Observed ${yearsLabel(state.post)}`, value: r.b[i].toFixed(2) + '%' },
      { color: k.pre, label: `Counterfactual ${yearsLabel(state.pre)}`, value: r.a[i].toFixed(2) + '%' },
      { label: 'Difference', value: fmt(r.b[i] - r.a[i]) + 'pp' },
    ]);
  });
}
const redrawEvidence = reg($('chart-evidence'), drawEvidence);

function readout(name, live, p, d = 2, suffix = '') {
  const pubTxt = p.v[1] === null || p.v[1] === undefined ? fmt(p.v[0], d) : `${fmt(p.v[0], d)} <span>(${p.v[1].toFixed(2)})</span>`;
  return `<div class="readout${p.match ? ' match' : ''}">
    <div class="readout-top"><span class="readout-name">${name}</span><span class="readout-val">${fmt(live, d)}${suffix}</span></div>
    <div class="readout-sub">${p.match ? 'Published, same choice' : 'Published, main specification'}: <b>${pubTxt}</b></div></div>`;
}

function updateEvidence() {
  const k = C(), r = estimate(state.t, state.pre, state.post, state.L, state.U);
  const allYears = state.pre.length === 5 && state.post.length === 3;
  const p = publishedFor(state.t, state.L, state.U, allYears);
  $('ev-readouts').innerHTML =
    readout('Bunching B', r.B, p.B) + readout('Missing mass M', r.M, p.M) +
    readout('ΔLTV (pp)', r.dltv, p.dLTV) + readout('Semi-elasticity', r.e, p.e) +
    readout('|M| / B', r.ratio, p.ratio) +
    `<p class="readout-sub">Live estimates from public bins, without standard errors. Published estimates use microdata with bootstrapped SEs in parentheses.</p>`;
  legend($('ev-legend'), [
    { color: k.post, label: `Observed, ${yearsLabel(state.post)}` },
    { color: k.pre, label: `Counterfactual, ${yearsLabel(state.pre)}`, type: 'dash' },
    { color: k.fillB, label: 'Excess mass B', type: 'box' },
    { color: k.fillM, label: 'Missing mass M', type: 'box' },
  ]);
  const smp = bins.thresholds[state.t];
  $('ev-caption').textContent = `Percent of new mortgages per 0.5pp LTV bin within the estimation sample (LTV ${smp.lo}–${smp.hi}). Dashed vertical lines mark the excluded window [${state.L}, ${state.U}]. Hover for bin values.`;
  redrawEvidence(); redrawMultiples(); writeURL();
}

// small multiples by year
function drawMultiples(c) {
  const k = C(), T = +state.t, th = bins.thresholds[state.t];
  const lo = T - 6, hi = T + 6;
  const idx = th.edges.map((x, i) => i).filter(i => th.edges[i] >= lo && th.edges[i] <= hi);
  const years = [...PRE_YEARS, ...POST_YEARS];
  const series = Object.fromEntries(years.map(y => [y, (y < 2016 ? th.pre : th.post)[String(y)]]));
  const ref = th.pre[PRE_YEARS.join(',')];
  const ymax = Math.ceil(Math.max(...years.flatMap(y => idx.map(i => series[y][i]))));
  c.replaceChildren();
  for (const y of years) {
    const fig = document.createElement('figure'); fig.className = 'figure';
    fig.innerHTML = `<p class="mtitle" style="color:${y < 2016 ? k.pre : k.post}">${y}${y < 2016 ? '' : ' · post'}</p>`;
    const box = document.createElement('div'); box.className = 'chart'; box.style.setProperty('--h', '130px');
    fig.appendChild(box); c.appendChild(fig);
    const f = frame(box, { x: [lo, hi], y: [0, ymax], xTicks: [T - 5, T, T + 5], yTicks: [0, Math.round(ymax / 2), ymax], yFmt: v => v + '%', margin: { t: 6, r: 6, b: 20, l: 30 }, label: `LTV distribution ${y}` });
    vline(f, T, { color: k.axis });
    line(f, idx.map(i => ({ x: th.edges[i], y: ref[i] })), { color: k.neutral, width: 1.25, dash: '3 3' });
    line(f, idx.map(i => ({ x: th.edges[i], y: series[y][i] })), { color: y < 2016 ? k.pre : k.post, width: 1.75 });
    hoverX(f, idx.map(i => th.edges[i]), j => tipHTML(`${y}, bin ${th.edges[idx[j]].toFixed(1)}`, [
      { label: 'This year', value: series[y][idx[j]].toFixed(2) + '%' },
      { label: 'Pooled 2011–2015', value: ref[idx[j]].toFixed(2) + '%' }]));
  }
}
let redrawMultiples;
{
  const c = $('ev-multiples');
  let lastW = 0;
  redrawMultiples = () => drawMultiples(c);
  new ResizeObserver(() => { if (Math.abs(c.clientWidth - lastW) > 1) { lastW = c.clientWidth; redrawMultiples(); } }).observe(c);
  redraws.push(() => redrawMultiples());
}

// supply-side checks
function checkChart(id, legId, key, yFmt, yDomain) {
  reg($(id), c => {
    const k = C(), e = checks.edges, s = checks.series;
    const vals = [...s.pre[key], ...s.post[key]].filter(v => v !== null);
    const dom = yDomain || [Math.floor(Math.min(...vals) * 10) / 10 - 0.1, Math.ceil(Math.max(...vals) * 10) / 10 + 0.1];
    const f = frame(c, { x: [40, 80], y: dom, xTicks: [40, 50, 60, 70, 80], yFmt, xTitle: 'LTV bin', margin: { l: 44 } });
    vline(f, 50, { color: k.axis }); vline(f, 70, { color: k.axis });
    line(f, e.map((x, i) => ({ x, y: s.pre[key][i] })), { color: k.pre, width: 2 });
    line(f, e.map((x, i) => ({ x, y: s.post[key][i] })), { color: k.post, width: 2 });
    hoverX(f, e, i => tipHTML(`Bin ${e[i].toFixed(1)}–${(e[i] + 0.5).toFixed(1)}`, [
      { color: k.pre, label: 'Pre 2012–2015', value: s.pre[key][i] === null ? 'n < 20' : yFmt(s.pre[key][i]) },
      { color: k.post, label: 'Post 2016–2018', value: s.post[key][i] === null ? 'n < 20' : yFmt(s.post[key][i]) }]));
    legend($(legId), [{ color: k.pre, label: 'Pre-reform 2012–2015' }, { color: k.post, label: 'Post-reform 2016–2018' }]);
  });
}
checkChart('chart-io', 'leg-io', 'io', v => Math.round(v) + '%', [0, 100]);
checkChart('chart-rate', 'leg-rate', 'rate', v => (+v).toFixed(2) + '%');

syncSliders(); updateEvidence();

// ------------------------------------------------------------------ specification explorer
const sp = { stat: 'B', t: '50', sel: 'main:0' };
const STAT = { B: 'Bunching B (pp)', M: 'Missing mass M (pp)', dLTV: 'ΔLTV (pp)', e: 'Semi-elasticity', ratio: '|M| / B' };
onSeg($('sp-stat'), v => { sp.stat = v; redrawSpec(); });
onSeg($('sp-t'), v => { sp.t = v; redrawSpec(); });

function specRows() {
  const out = [];
  for (const g of pub.groups) {
    const rows = g.rows.map((r, i) => ({ ...r, key: `${g.id}:${i}`, group: g })).filter(r => sp.t === 'all' || String(r.T) === sp.t);
    if (!rows.length) continue;
    out.push({ header: sp.t === 'all' ? g.title : g.title.replace(/, LTV = \d+/, '') }); out.push(...rows);
  }
  return out;
}
const statVal = (r, s) => s === 'ratio' ? [Math.abs(r.M[0]) / r.B[0], null] : r[s];

function drawSpec(c) {
  const k = C(), rows = specRows();
  const rowH = 24, headH = 30;
  const H = 30 + rows.reduce((a, r) => a + (r.header ? headH : rowH), 0);
  c.style.height = H + 'px';
  const narrow = c.clientWidth < 560;
  const labW = narrow ? 150 : 270;
  const vals = rows.filter(r => !r.header).flatMap(r => { const [v, s] = statVal(r, sp.stat); return s ? [v - 1.96 * s, v + 1.96 * s] : [v]; });
  let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
  const pad = (hi - lo) * 0.06; lo -= lo < 0 ? pad : 0; hi += pad;
  const xd = Math.abs(hi - lo) < 2 ? 2 : 1;
  const f = frame(c, { x: [lo, hi], y: [0, 1], yTicks: [], height: H, xCount: Math.max(3, Math.floor((c.clientWidth - labW) / 80)), xFmt: v => fmt(v, xd), margin: { l: labW, t: 6, b: 26, r: 16 }, label: 'Published estimates' });
  // gridlines for x
  for (const v of ticks(lo, hi, Math.max(3, Math.floor(f.w / 80)))) el('line', { x1: f.x(v), x2: f.x(v), y1: 0, y2: f.h, stroke: k.grid }, f.layers.back);
  vline(f, 0, { color: k.axis });
  if (sp.stat === 'ratio') vline(f, 0.15, { color: k.text3, dash: '4 3', label: '15%', dy: 10 });
  let y = 4;
  for (const r of rows) {
    if (r.header) {
      const t = el('text', { x: -labW + 4, y: y + 20, class: 'dlabel-strong' }, f.layers.front); t.textContent = r.header; y += headH; continue;
    }
    const cy = y + rowH / 2, [v, s] = statVal(r, sp.stat), selected = r.key === sp.sel;
    const color = selected ? k.accent : k.text2;
    const g = el('g', { tabindex: 0, role: 'button', 'aria-label': `${r.group.title}, ${r.label}: ${fmt(v)}` }, f.layers.data);
    if (selected) el('rect', { x: -labW, y, width: labW + f.w + 10, height: rowH, fill: cssVar('--surface-2'), rx: 4 }, g);
    const t = el('text', { x: -labW + 14, y: cy, 'dominant-baseline': 'middle', class: selected ? 'dlabel-strong' : 'dlabel' }, g);
    t.textContent = narrow && r.label.length > 24 ? r.label.slice(0, 22) + '…' : r.label;
    if (s) el('line', { x1: f.x(v - 1.96 * s), x2: f.x(v + 1.96 * s), y1: cy, y2: cy, stroke: color, 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
    el('circle', { cx: f.x(v), cy, r: 4.5, fill: color, stroke: k.surface, 'stroke-width': 1.5 }, g);
    el('rect', { x: -labW, y, width: labW + f.w, height: rowH, fill: 'transparent' }, g);
    hoverEl(g, tipHTML(r.label, [{ label: STAT[sp.stat], value: s ? `${fmt(v)} ± ${(1.96 * s).toFixed(2)}` : fmt(v) }, { label: 'N households', value: r.N ? r.N.toLocaleString('en-US') : '–' }]));
    const select = () => { sp.sel = r.key; redrawSpec(); };
    g.addEventListener('click', select);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } });
    y += rowH;
  }
  $('sp-caption').textContent = `${STAT[sp.stat]}. Dots are point estimates, bars are 95% confidence intervals (±1.96 bootstrapped SE). M is negative when mass is missing above the threshold.${sp.stat === 'ratio' ? ' The dashed line marks 15%, the bound on the notch share discussed in the paper.' : ''}`;
  drawDetail();
}
const redrawSpec = reg($('chart-spec'), drawSpec);

function drawDetail() {
  const [gid, i] = sp.sel.split(':'), g = pub.groups.find(g => g.id === gid), r = g.rows[+i];
  const row = (n, v) => `<tr><td>${n}</td><td>${v[1] === null || v[1] === undefined ? fmt(v[0]) : `${fmt(v[0])} (${v[1].toFixed(2)})`}</td></tr>`;
  const canOpen = r.L !== undefined;
  $('sp-detail').innerHTML = `<h4>${r.label}</h4><div class="src">${g.title} · ${g.source}</div>
    <table>${row('Bunching B', r.B)}${row('Missing mass M', r.M)}${row('ΔLTV (pp)', r.dLTV)}${row('Semi-elasticity', r.e)}
    ${row('|M| / B', [Math.abs(r.M[0]) / r.B[0], null])}<tr><td>N households</td><td>${r.N ? r.N.toLocaleString('en-US') : '–'}</td></tr></table>
    ${canOpen ? `<p style="margin-top:12px"><button type="button" class="btn btn-small" id="sp-open">Open this window in the evidence explorer</button></p>`
      : `<p class="hint" style="margin-top:12px">Subgroup estimates need microdata splits that are not public. The replication package contains the code.</p>`}`;
  if (canOpen) $('sp-open').addEventListener('click', () => {
    setEvidence({ t: String(r.T), L: r.L, U: r.U, pre: [...PRE_YEARS], post: [...POST_YEARS] });
    $('evidence').scrollIntoView();
  });
}

// ------------------------------------------------------------------ model: mechanisms
const MECH_TEXT = {
  baseline: 'In the standard model, mandatory amortization lowers expected utility for everyone, because it restricts consumption smoothing. The loss is smooth in LTV, with no corner or step at 50%, so no household gains by moving exactly to the threshold. The simulated distribution shows no pile.',
  notch: 'A one-off psychic cost of switching amortization off (Δn = 0.35) shifts the value function down at 50%. Households who would have borrowed just above the threshold jump to it, and nobody chooses the dominated region above it. The result is a pile together with a large hole.',
  flow: 'A disutility in every period with required principal payments (Δk = 0.08) puts a kink in the value function at 50%. Every household above the threshold borrows a little less. Those closest move to 50%, and those further away refill the region just above it, so the pile comes without a hole. The data show the same pattern: a large pile and little missing mass.',
};
const mo = { mech: 'baseline' };
onSeg($('mo-mech'), v => { mo.mech = v; $('mo-text').textContent = MECH_TEXT[v]; redrawMoHist(); redrawMoVf(); });
$('mo-text').textContent = MECH_TEXT.baseline;
const mechColor = (k, m) => m === 'notch' ? k.post : m === 'flow' ? k.flow : k.pre;
const MECH_LABEL = { baseline: 'Standard model', notch: 'One-off cost', flow: 'Flow disutility' };

function groupedHist(c, edges, series, legId, label) {
  const k = C(), n = edges.length - 1;
  const ymax = Math.ceil(Math.max(...series.flatMap(s => s.v)) / 5) * 5;
  const f = frame(c, { x: [edges[0], edges[n]], y: [0, ymax], xTicks: [40, 45, 50, 55, 60], yFmt: v => v + '%', xTitle: 'LTV at purchase (%)', margin: { l: 40 }, label });
  vline(f, 50, { color: k.text2, width: 1.5, layer: 'front' });
  const gap = 2, bw = (f.x(edges[1]) - f.x(edges[0]));
  const inner = (bw - gap * (series.length + 1)) / series.length;
  for (let i = 0; i < n; i++) {
    series.forEach((s, j) => {
      const x0 = f.x(edges[i]) + gap + j * (inner + gap);
      const b = bar(f, x0, x0 + inner, s.v[i], { color: s.color });
      hoverEl(b, tipHTML(`LTV ${edges[i]}–${edges[i + 1]}`, series.map(t => ({ color: t.color, label: t.label, value: t.v[i].toFixed(1) + '%' }))));
    });
  }
  legend($(legId), series.map(s => ({ color: s.color, label: s.label, type: 'box' })));
}

function vfChart(c, series, legId, label) {
  const k = C();
  const all = series.flatMap(s => s.ev);
  const lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * 0.06;
  const f = frame(c, { x: [40, 60], y: [lo - pad, hi + pad], xTicks: [40, 45, 50, 55, 60], yFmt: v => v.toFixed(2), xTitle: 'LTV at origination (%)', margin: { l: 48 }, label });
  vline(f, 50, { color: k.axis });
  for (const s of series) line(f, s.ltv.map((x, i) => ({ x, y: s.ev[i] })), { color: s.color, width: 2, dash: s.dash });
  const xs = series[0].ltv;
  hoverX(f, xs, i => tipHTML(`LTV ${xs[i].toFixed(1)}%`, series.map(s => ({ color: s.color, label: s.label, value: s.ev[i].toFixed(3) }))));
  legend($(legId), series.map(s => ({ color: s.color, label: s.label, type: s.dash ? 'dash' : undefined })));
}

const redrawMoHist = reg($('chart-mo-hist'), c => {
  const k = C(), m = model.mechanisms, series = [{ label: 'Standard model', v: m.baseline.hist, color: k.pre }];
  if (mo.mech !== 'baseline') series.push({ label: MECH_LABEL[mo.mech], v: m[mo.mech].hist, color: mechColor(k, mo.mech) });
  groupedHist(c, model.hist_edges, series, 'leg-mo-hist', 'Simulated LTV histogram');
});
const redrawMoVf = reg($('chart-mo-vf'), c => {
  const k = C(), m = model.mechanisms;
  const series = [{ label: 'Interest-only regime', ...m.io.vf, color: k.neutral, dash: '5 4' }, { label: 'Standard model, requirement', ...m.baseline.vf, color: k.pre }];
  if (mo.mech !== 'baseline') series.push({ label: `${MECH_LABEL[mo.mech]}, requirement`, ...m[mo.mech].vf, color: mechColor(k, mo.mech) });
  vfChart(c, series, 'leg-mo-vf', 'Value function by LTV');
});

// ------------------------------------------------------------------ model: calibration
const cal = model.calibration;
const FLOW_MAX = 0.30;
const loops = {
  flow: (() => { const n = cal.flow.k.filter(v => v <= FLOW_MAX + 1e-9).length; return { k: cal.flow.k.slice(0, n), B: cal.flow.B.slice(0, n), M: cal.flow.M.slice(0, n) }; })(),
  oneoff: cal.oneoff,
};
const ca = { mech: 'flow', i: loops.flow.k.indexOf(0.08) };
const DATA = { B: 7.47, Bse: 0.31, M: -0.83, Mse: 0.16 };
const slider = $('ca-k');
function syncCa() {
  const L = loops[ca.mech];
  slider.max = L.k.length - 1; slider.value = ca.i;
  $('ca-k-out').innerHTML = `${ca.mech === 'flow' ? 'Δ<sub>k</sub>' : 'Δ<sub>n</sub>'} = ${L.k[ca.i].toFixed(2)}`;
}
onSeg($('ca-mech'), v => { ca.mech = v; ca.i = v === 'flow' ? loops.flow.k.indexOf(0.08) : loops.oneoff.k.length - 1; syncCa(); updateCa(); });
slider.addEventListener('input', () => { ca.i = +slider.value; syncCa(); updateCa(); });

const redrawCaB = reg($('chart-ca-b'), c => {
  const k = C(), L = loops[ca.mech], color = ca.mech === 'flow' ? k.flow : k.post;
  const kmax = L.k[L.k.length - 1];
  const f = frame(c, { x: [0, kmax], y: [0, 16], yTicks: [0, 4, 8, 12, 16], xFmt: v => v.toFixed(2), xTitle: ca.mech === 'flow' ? 'Flow disutility Δk' : 'One-off disutility Δn', yTitle: 'Excess mass B', margin: { t: 22, l: 36 } });
  el('rect', { x: 0, width: f.w, y: f.y(DATA.B + 1.96 * DATA.Bse), height: f.y(DATA.B - 1.96 * DATA.Bse) - f.y(DATA.B + 1.96 * DATA.Bse), fill: k.fillM }, f.layers.back);
  hline(f, DATA.B, { color: k.pre, dash: '4 3', label: 'Data B = 7.47' });
  if (ca.mech === 'flow') vline(f, 0.08, { color: k.text3, dash: '3 3', label: 'Calibrated 0.08', dy: f.h - 8 });
  line(f, L.k.map((x, i) => ({ x, y: L.B[i] })), { color, width: 2, markers: true, r: 2.5 });
  el('circle', { cx: f.x(L.k[ca.i]), cy: f.y(L.B[ca.i]), r: 7, fill: 'none', stroke: color, 'stroke-width': 2.5 }, f.layers.front);
  hoverX(f, L.k, i => tipHTML(`${ca.mech === 'flow' ? 'Δk' : 'Δn'} = ${L.k[i].toFixed(2)}`, [{ color, label: 'Model B', value: L.B[i].toFixed(2) }, { color, label: 'Model M', value: fmt(L.M[i]) }]));
  $('ca-b-cap').textContent = ca.mech === 'flow'
    ? 'Model-implied excess mass as a function of flow disutility, other parameters fixed (Internet Appendix figure). The band is the 95% interval of the empirical estimate.'
    : 'Model-implied excess mass as a function of the one-off cost, over the range simulated in the calibration loop (0–0.25). Supplementary, not reported in the paper.';
});

const redrawCaPlane = reg($('chart-ca-plane'), c => {
  const k = C();
  const f = frame(c, { x: [0, 14], y: [-2.2, 1.6], xTicks: [0, 2, 4, 6, 8, 10, 12, 14], yTicks: [-2, -1, 0, 1], yFmt: v => fmt(v, 0), xTitle: 'Excess mass B', yTitle: 'Missing mass M', margin: { t: 22, l: 36 } });
  hline(f, 0, { color: k.axis });
  // ray with the data ratio M/B
  const slope = DATA.M / DATA.B;
  el('line', { x1: f.x(0), y1: f.y(0), x2: f.x(14), y2: f.y(14 * slope), stroke: k.text3, 'stroke-dasharray': '2 4', 'stroke-width': 1.25 }, f.layers.back);
  const t = el('text', { x: f.x(13.8), y: f.y(14 * slope) + 14, 'text-anchor': 'end', class: 'dlabel' }, f.layers.front); t.textContent = 'data ratio |M|/B = 0.11';
  for (const [key, color, lab] of [['flow', k.flow, 'Flow Δk'], ['oneoff', k.post, 'One-off Δn']]) {
    const L = loops[key];
    line(f, L.B.map((b, i) => ({ x: b, y: L.M[i] })), { color, width: 2, markers: true, r: 2.5, opacity: ca.mech === key ? 1 : 0.45 });
  }
  // data point with 95% CI
  const dx = f.x(DATA.B), dy = f.y(DATA.M);
  el('line', { x1: f.x(DATA.B - 1.96 * DATA.Bse), x2: f.x(DATA.B + 1.96 * DATA.Bse), y1: dy, y2: dy, stroke: k.text, 'stroke-width': 2 }, f.layers.front);
  el('line', { x1: dx, x2: dx, y1: f.y(DATA.M - 1.96 * DATA.Mse), y2: f.y(DATA.M + 1.96 * DATA.Mse), stroke: k.text, 'stroke-width': 2 }, f.layers.front);
  el('rect', { x: dx - 4.5, y: dy - 4.5, width: 9, height: 9, fill: k.text, transform: `rotate(45 ${dx} ${dy})` }, f.layers.front);
  const dl = el('text', { x: dx + 8, y: dy + 16, class: 'dlabel-strong' }, f.layers.front); dl.textContent = 'Data';
  const L = loops[ca.mech], color = ca.mech === 'flow' ? k.flow : k.post;
  el('circle', { cx: f.x(L.B[ca.i]), cy: f.y(L.M[ca.i]), r: 7, fill: 'none', stroke: color, 'stroke-width': 2.5 }, f.layers.front);
  legend($('leg-ca-plane'), [{ color: k.flow, label: 'Flow disutility Δk (0–0.30)' }, { color: k.post, label: 'One-off cost Δn (0–0.25)' }, { color: k.text, label: 'Data, 95% CI', type: 'box' }]);
});

function updateCa() {
  const L = loops[ca.mech], B = L.B[ca.i], M = L.M[ca.i];
  const r = B > 0 ? Math.abs(M) / B : null;
  $('ca-readouts').innerHTML = `
    <div class="readout"><div class="readout-top"><span class="readout-name">Model B</span><span class="readout-val">${fmt(B)}</span></div><div class="readout-sub">Data: <b>7.47</b> (0.31)</div></div>
    <div class="readout"><div class="readout-top"><span class="readout-name">Model M</span><span class="readout-val">${fmt(M)}</span></div><div class="readout-sub">Data: <b>−0.83</b> (0.16)</div></div>
    <div class="readout"><div class="readout-top"><span class="readout-name">|M| / B</span><span class="readout-val">${r === null ? '–' : r.toFixed(2)}</span></div><div class="readout-sub">Data: <b>0.11</b></div></div>
    <p class="readout-sub">${ca.mech === 'flow' ? 'At Δk = 0.08 the model reproduces the empirical pile, with a hole about 4% of its size.' : 'Over the simulated range the one-off cost never reaches the empirical pile, and its hole is always more than a third of the pile.'}</p>`;
  redrawCaB(); redrawCaPlane();
}
syncCa(); updateCa();

// ------------------------------------------------------------------ model: robustness
const rbSel = $('rb-sel');
for (const [key, r] of Object.entries(model.robustness)) { const o = document.createElement('option'); o.value = key; o.textContent = r.label; rbSel.appendChild(o); }
rbSel.addEventListener('change', () => { redrawRbHist(); redrawRbVf(); });
const redrawRbHist = reg($('chart-rb-hist'), c => {
  const k = C(), r = model.robustness[rbSel.value];
  groupedHist(c, model.hist_edges, [{ label: 'Interest-only', v: r.hist_io, color: k.pre }, { label: 'Amortization requirement', v: r.hist_amort, color: k.post }], 'leg-rb-hist', 'Robustness histogram');
  $('rb-cap').textContent = `${r.label}, standard preferences. Simulated LTV at purchase under both regimes, 2pp bins. The 48–50 bin does not stand out under the requirement.`;
});
const redrawRbVf = reg($('chart-rb-vf'), c => {
  const k = C(), r = model.robustness[rbSel.value];
  vfChart(c, [{ label: 'Interest-only', ...r.vf_io, color: k.pre, dash: '5 4' }, { label: 'Amortization requirement', ...r.vf_amort, color: k.post }], 'leg-rb-vf', 'Robustness value function');
});

// ------------------------------------------------------------------ implications
reg($('chart-innov'), c => {
  const k = C(), d = pub.model.io_innovation;
  const rows = [{ label: 'Flow disutility (Δk = 0.08)', v: d.debt_flow, color: k.flow }, { label: 'Standard preferences', v: d.debt_noflow, color: k.pre }];
  const narrow = c.clientWidth < 420, labW = narrow ? 120 : 180;
  const f = frame(c, { x: [0, 40], y: [0, 1], yTicks: [], xTicks: [0, 10, 20, 30, 40], xFmt: v => '+' + v + '%', margin: { l: labW, t: 8, b: 26, r: 50 } });
  const rh = f.h / rows.length;
  rows.forEach((r, i) => {
    const y0 = i * rh + rh * 0.22, y1 = (i + 1) * rh - rh * 0.22;
    const p = el('path', { d: `M0,${y0}H${f.x(r.v) - 4}Q${f.x(r.v)},${y0} ${f.x(r.v)},${y0 + 4}V${y1 - 4}Q${f.x(r.v)},${y1} ${f.x(r.v) - 4},${y1}H0Z`, fill: r.color }, f.layers.data);
    hoverEl(p, tipHTML(r.label, [{ color: r.color, label: 'Increase in mortgage debt', value: `+${r.v}%` }]));
    const t = el('text', { x: -8, y: (y0 + y1) / 2, 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'dlabel' }, f.layers.front); t.textContent = narrow ? r.label.split(' (')[0] : r.label;
    const v = el('text', { x: f.x(r.v) + 6, y: (y0 + y1) / 2, 'dominant-baseline': 'middle', class: 'dlabel-strong' }, f.layers.front); v.textContent = `+${r.v}%`;
  });
  legend($('leg-io-innov'), []);
});

const mwa = { col: 3 };
onSeg($('mwa-sample'), v => { mwa.col = +v; redrawMwa(); });
const redrawMwa = reg($('chart-mwa'), c => {
  const k = C(), rows = pub.model.mwa.rows;
  const colorOf = l => l.startsWith('Bernstein') ? k.text : l.includes('flow') ? k.flow : k.pre;
  const narrow = c.clientWidth < 420, labW = narrow ? 130 : 200;
  const f = frame(c, { x: [0, 1.1], y: [0, 1], yTicks: [], xTicks: [0, 0.25, 0.5, 0.75, 1], xFmt: v => v.toFixed(2), margin: { l: labW, t: 8, b: 26, r: 40 } });
  const rh = f.h / rows.length, bk = rows[0].v[mwa.col];
  for (const v of [0, 0.25, 0.5, 0.75, 1]) el('line', { x1: f.x(v), x2: f.x(v), y1: 0, y2: f.h, stroke: k.grid }, f.layers.back);
  vline(f, bk, { color: k.text3, dash: '4 3' });
  rows.forEach((r, i) => {
    const cy = i * rh + rh / 2, v = r.v[mwa.col], color = colorOf(r.label);
    el('line', { x1: f.x(0), x2: f.x(v), y1: cy, y2: cy, stroke: k.grid, 'stroke-width': 2 }, f.layers.data);
    const dot = i === 0
      ? el('rect', { x: f.x(v) - 5, y: cy - 5, width: 10, height: 10, fill: color, transform: `rotate(45 ${f.x(v)} ${cy})` }, f.layers.data)
      : el('circle', { cx: f.x(v), cy, r: 6, fill: color, stroke: k.surface, 'stroke-width': 1.5 }, f.layers.data);
    hoverEl(dot, tipHTML(r.label, pub.model.mwa.cols.map((cn, j) => ({ label: cn, value: r.v[j] === null ? '–' : r.v[j].toLocaleString('en-US') }))));
    const t = el('text', { x: -8, y: cy, 'text-anchor': 'end', 'dominant-baseline': 'middle', class: i === 0 ? 'dlabel-strong' : 'dlabel' }, f.layers.front);
    t.textContent = narrow ? r.label.replace('Bernstein and Koudijs', 'BK').replace('Baseline, ', '').replace('psychic cost', 'psych. cost') : r.label;
    const vt = el('text', { x: f.x(v) + 10, y: cy, 'dominant-baseline': 'middle', class: 'dlabel' }, f.layers.front); vt.textContent = v.toFixed(2);
  });
});

// ------------------------------------------------------------------ cite
const BIB = $('bibtex').textContent;
const RIS = ['TY  - JOUR', 'AU  - Bäckman, Claes', 'AU  - Moran, Patrick', 'AU  - van Santen, Peter',
  'TI  - Mortgage Design, Repayment Schedules, and Household Borrowing', 'JO  - The Review of Financial Studies',
  'PY  - 2026', 'VL  - 39', 'IS  - 8', 'SP  - 2549', 'EP  - 2594', 'DO  - 10.1093/rfs/hhaf115', 'UR  - https://doi.org/10.1093/rfs/hhaf115', 'ER  - ', ''].join('\r\n');
$('dl-bib').href = URL.createObjectURL(new Blob([BIB + '\n'], { type: 'application/x-bibtex' }));
$('dl-ris').href = URL.createObjectURL(new Blob([RIS], { type: 'application/x-research-info-systems' }));
document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  const text = $(b.dataset.copy).innerText.trim();
  try { await navigator.clipboard.writeText(text); $('copied').textContent = 'Copied to clipboard.'; }
  catch { const r = document.createRange(); r.selectNodeContents($(b.dataset.copy)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); $('copied').textContent = 'Selected. Press Ctrl/Cmd+C to copy.'; }
  setTimeout(() => { $('copied').textContent = ''; }, 2500);
}));

// ------------------------------------------------------------------ theme
$('theme-toggle').addEventListener('click', () => {
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const cur = document.documentElement.dataset.theme || (dark ? 'dark' : 'light');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
  updateEvidence(); redrawAll();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { updateEvidence(); redrawAll(); });
