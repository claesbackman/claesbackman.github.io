// Minimal SVG chart helpers: linear scales, axes, lines, bars, hover tooltips.
const NS = 'http://www.w3.org/2000/svg';

export function el(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}

export function scale(d0, d1, r0, r1) {
  const f = v => r0 + (v - d0) / (d1 - d0 || 1) * (r1 - r0);
  f.invert = p => d0 + (p - r0) / (r1 - r0 || 1) * (d1 - d0);
  return f;
}

export function ticks(min, max, count = 5) {
  const span = max - min;
  if (!(span > 0)) return [min];
  const raw = span / count, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => span / s <= count) || 10 * mag;
  const out = [];
  for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

export const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Redraw on resize. Returns a function that triggers a redraw.
export function mount(container, draw) {
  let last = 0;
  const run = () => { container.replaceChildren(); draw(container); };
  const ro = new ResizeObserver(() => {
    const w = container.clientWidth;
    if (Math.abs(w - last) > 1) { last = w; run(); }
  });
  ro.observe(container);
  return run;
}

/** Create a chart frame. opts: x:[min,max], y:[min,max], margin, xTicks, yTicks, xFmt, yFmt, xTitle, yTitle, height */
export function frame(container, opts) {
  const W = container.clientWidth || 600;
  const H = opts.height || container.clientHeight || 300;
  const m = Object.assign({ t: 12, r: 14, b: 38, l: 44 }, opts.margin || {});
  const svg = el('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': opts.label || '' }, container);
  const w = W - m.l - m.r, h = H - m.t - m.b;
  const g = el('g', { transform: `translate(${m.l},${m.t})` }, svg);
  const x = opts.xBand ? null : scale(opts.x[0], opts.x[1], 0, w);
  const y = scale(opts.y[0], opts.y[1], h, 0);
  const f = { svg, g, x, y, w, h, W, H, m, layers: {} };
  const grid = el('g', {}, g);
  f.layers.back = el('g', {}, g);
  f.layers.data = el('g', {}, g);
  f.layers.front = el('g', {}, g);

  const yFmt = opts.yFmt || (v => v);
  const yt = opts.yTicks || ticks(opts.y[0], opts.y[1], opts.yCount || 5);
  for (const v of yt) {
    el('line', { x1: 0, x2: w, y1: y(v), y2: y(v), stroke: cssVar('--grid'), 'stroke-width': 1 }, grid);
    const t = el('text', { x: -8, y: y(v), 'text-anchor': 'end', 'dominant-baseline': 'middle' }, grid);
    t.textContent = yFmt(v);
  }
  if (x) {
    const xFmt = opts.xFmt || (v => v);
    const xt = opts.xTicks || ticks(opts.x[0], opts.x[1], opts.xCount || Math.max(3, Math.floor(w / 70)));
    el('line', { x1: 0, x2: w, y1: h, y2: h, stroke: cssVar('--axis'), 'stroke-width': 1 }, grid);
    for (const v of xt) {
      el('line', { x1: x(v), x2: x(v), y1: h, y2: h + 4, stroke: cssVar('--axis') }, grid);
      const t = el('text', { x: x(v), y: h + 16, 'text-anchor': 'middle' }, grid);
      t.textContent = xFmt(v);
    }
  }
  if (opts.xTitle) {
    const t = el('text', { x: w / 2, y: h + 32, 'text-anchor': 'middle', class: 'axis-title' }, grid);
    t.textContent = opts.xTitle;
  }
  if (opts.yTitle) {
    const t = el('text', { x: -m.l + 2, y: -12, 'text-anchor': 'start', class: 'axis-title' }, grid);
    t.textContent = opts.yTitle;
  }
  return f;
}

export function line(f, pts, { color, width = 2, dash, markers = false, r = 3, layer = 'data', opacity } = {}) {
  const P = pts.filter(p => p.y !== null && p.y !== undefined && !Number.isNaN(p.y));
  // split into runs where y is missing
  const runs = []; let cur = [];
  for (const p of pts) {
    if (p.y === null || p.y === undefined || Number.isNaN(p.y)) { if (cur.length) runs.push(cur); cur = []; }
    else cur.push(p);
  }
  if (cur.length) runs.push(cur);
  for (const run of runs) {
    const d = run.map((p, i) => `${i ? 'L' : 'M'}${f.x(p.x).toFixed(2)},${f.y(p.y).toFixed(2)}`).join('');
    el('path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-dasharray': dash, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity }, f.layers[layer]);
  }
  if (markers) for (const p of P) el('circle', { cx: f.x(p.x), cy: f.y(p.y), r, fill: color, stroke: cssVar('--surface'), 'stroke-width': 1.5 }, f.layers[layer]);
}

export function vline(f, xv, { color, dash, width = 1, label, anchor = 'start', layer = 'back', dy = 10 } = {}) {
  const X = f.x(xv);
  el('line', { x1: X, x2: X, y1: 0, y2: f.h, stroke: color || cssVar('--axis'), 'stroke-width': width, 'stroke-dasharray': dash }, f.layers[layer]);
  if (label) {
    const t = el('text', { x: X + (anchor === 'start' ? 5 : -5), y: dy, 'text-anchor': anchor, class: 'dlabel' }, f.layers.front);
    t.textContent = label;
  }
}

export function hline(f, yv, { color, dash, width = 1, label, layer = 'back' } = {}) {
  const Y = f.y(yv);
  el('line', { x1: 0, x2: f.w, y1: Y, y2: Y, stroke: color || cssVar('--axis'), 'stroke-width': width, 'stroke-dasharray': dash }, f.layers[layer]);
  if (label) {
    const t = el('text', { x: f.w - 4, y: Y - 5, 'text-anchor': 'end', class: 'dlabel' }, f.layers.front);
    t.textContent = label;
  }
}

// Bar with 4px rounded data end, anchored to baseline y0.
export function bar(f, x0, x1, v, { color, y0 = 0, layer = 'data', r = 4 } = {}) {
  const X0 = x0, X1 = x1, Yb = f.y(y0), Yt = f.y(v);
  const w = Math.max(0, X1 - X0), hgt = Math.abs(Yb - Yt);
  const rr = Math.min(r, w / 2, hgt);
  const up = Yt <= Yb;
  let d;
  if (up) d = `M${X0},${Yb}V${Yt + rr}Q${X0},${Yt} ${X0 + rr},${Yt}H${X1 - rr}Q${X1},${Yt} ${X1},${Yt + rr}V${Yb}Z`;
  else d = `M${X0},${Yb}V${Yt - rr}Q${X0},${Yt} ${X0 + rr},${Yt}H${X1 - rr}Q${X1},${Yt} ${X1},${Yt - rr}V${Yb}Z`;
  return el('path', { d, fill: color }, f.layers[layer]);
}

// ------------------------------------------------------------------ tooltip
const tip = () => document.getElementById('tooltip');
export function showTip(evt, html) {
  const t = tip(); t.innerHTML = html; t.hidden = false;
  const pad = 14, r = t.getBoundingClientRect();
  let x = evt.clientX + pad, y = evt.clientY + pad;
  if (x + r.width > window.innerWidth - 8) x = evt.clientX - r.width - pad;
  if (y + r.height > window.innerHeight - 8) y = evt.clientY - r.height - pad;
  t.style.left = `${Math.max(8, x)}px`; t.style.top = `${Math.max(8, y)}px`;
}
export function hideTip() { tip().hidden = true; }

export function tipHTML(title, rows) {
  return `<div class="tt-h">${title}</div>` + rows.map(r =>
    `<div class="tt-r"><span>${r.color ? `<i style="background:${r.color}"></i>` : ''}${r.label}</span><b>${r.value}</b></div>`).join('');
}

/** Crosshair hover over x positions. content(i) -> html. xs in data units. */
export function hoverX(f, xs, content) {
  const cross = el('line', { y1: 0, y2: f.h, stroke: cssVar('--axis'), 'stroke-width': 1, visibility: 'hidden' }, f.layers.front);
  const hit = el('rect', { x: 0, y: 0, width: f.w, height: f.h, fill: 'transparent' }, f.layers.front);
  const pick = evt => {
    const pt = f.svg.getBoundingClientRect();
    const px = evt.clientX - pt.left - f.m.l;
    let best = 0, bd = Infinity;
    xs.forEach((v, i) => { const d = Math.abs(f.x(v) - px); if (d < bd) { bd = d; best = i; } });
    return best;
  };
  hit.addEventListener('pointermove', evt => {
    const i = pick(evt);
    cross.setAttribute('x1', f.x(xs[i])); cross.setAttribute('x2', f.x(xs[i])); cross.setAttribute('visibility', 'visible');
    showTip(evt, content(i));
  });
  hit.addEventListener('pointerleave', () => { cross.setAttribute('visibility', 'hidden'); hideTip(); });
}

/** Attach hover tooltip to an element, with a larger invisible hit area if given. */
export function hoverEl(node, html) {
  node.style.cursor = 'default';
  node.addEventListener('pointermove', evt => showTip(evt, typeof html === 'function' ? html() : html));
  node.addEventListener('pointerleave', hideTip);
}

export function legend(container, items) {
  container.innerHTML = items.map(it => {
    const cls = it.type === 'box' ? 'sw-box' : it.type === 'dash' ? 'sw-dash' : '';
    const style = it.type === 'dash' ? `border-color:${it.color}` : `background:${it.color}`;
    return `<span><i class="${cls}" style="${style}"></i>${it.label}</span>`;
  }).join('');
}

export const fmt = (v, d = 2) => (v === null || v === undefined || Number.isNaN(v)) ? '–' : (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
