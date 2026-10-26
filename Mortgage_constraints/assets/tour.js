/* Title-page guided chart: the 154 tightening episodes on the crisis map, stepped by scrolling. Uses PAPER_DATA from data.js. */
(function () {
  'use strict';
  const D = window.PAPER_DATA; if (!D) return;
  const root = document.getElementById('tour'); if (!root) return;
  const NS = 'http://www.w3.org/2000/svg';
  const C = { blue: '#2a78d6', orange: '#eb6834', ink: '#1a1a1a', muted: '#8a8a8a', line: '#e4e3df', r: '#f7dccd', y: '#ebe9e3' };
  const s = (t, a, ...k) => { const e = document.createElementNS(NS, t); for (const q in a || {}) e.setAttribute(q, a[q]); k.forEach(x => e.appendChild(typeof x === 'string' ? document.createTextNode(x) : x)); return e; };
  const W = 640, H = 440, L = 54, R = 14, T = 16, B = 44, xmin = -30, xmax = 32, ymin = -35, ymax = 65;
  const xs = v => L + (W - L - R) * (v - xmin) / (xmax - xmin), ys = v => T + (H - T - B) * (ymax - v) / (ymax - ymin);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Credit and house-price growth before 154 mortgage-constraint tightenings' });
  root.querySelector('.chart').appendChild(svg);
  const readout = root.querySelector('.readout');
  const minus = x => String(x).replace('-', '−');
  let step = 0;
  function draw() {
    svg.innerHTML = '';
    const zones = step >= 1;
    if (zones) {
      svg.appendChild(s('rect', { x: xs(D.Y.debt), y: ys(ymax), width: xs(xmax) - xs(D.Y.debt), height: ys(D.Y.price) - ys(ymax), fill: C.y }));
      svg.appendChild(s('rect', { x: xs(D.R.debt), y: ys(ymax), width: xs(xmax) - xs(D.R.debt), height: ys(D.R.price) - ys(ymax), fill: C.r }));
      svg.appendChild(s('text', { x: xs(xmax) - 8, y: ys(ymax) + 18, 'text-anchor': 'end', style: `fill:${C.orange};font-weight:600;font-size:13px` }, 'R-zone: crisis risk 36.8%'));
      svg.appendChild(s('text', { x: xs(xmax) - 8, y: ys(D.Y.price) - 8, 'text-anchor': 'end', style: `fill:${C.muted};font-weight:600;font-size:13px` }, 'Y-zone'));
    }
    [-20, -10, 0, 10, 20, 30].forEach(v => { svg.appendChild(s('line', { x1: xs(v), x2: xs(v), y1: T, y2: H - B, stroke: v === 0 ? C.muted : C.line })); svg.appendChild(s('text', { x: xs(v), y: H - B + 16, 'text-anchor': 'middle' }, minus(String(v)))); });
    [-20, 0, 20, 40, 60].forEach(v => { svg.appendChild(s('line', { x1: L, x2: W - R, y1: ys(v), y2: ys(v), stroke: v === 0 ? C.muted : C.line })); svg.appendChild(s('text', { x: L - 6, y: ys(v) + 4, 'text-anchor': 'end' }, minus(String(v)))); });
    svg.appendChild(s('text', { x: (L + W - R) / 2, y: H - 6, 'text-anchor': 'middle' }, '3-year change in household credit / GDP before the tightening (pp of GDP)'));
    svg.appendChild(s('text', { x: 12, y: (T + H - B) / 2, transform: `rotate(-90 12 ${(T + H - B) / 2})`, 'text-anchor': 'middle' }, '3-year real house-price growth before the tightening (%)'));
    const eps = D.episodes.slice().sort((a, b) => (a.s ? 1 : 0) - (b.s ? 1 : 0));
    eps.forEach(e => {
      let dim = false, big = false;
      if (step === 2) dim = e.z !== 'R';
      if (step === 3) { dim = !e.ae; }
      if (step === 4) { dim = !e.s; big = !!e.s; }
      const c = s('circle', { cx: xs(Math.max(xmin, Math.min(xmax, e.d))), cy: ys(Math.max(ymin, Math.min(ymax, e.p))), r: big ? 7 : 5, fill: e.ae ? C.blue : 'none', stroke: e.ae ? '#fff' : C.orange, 'stroke-width': e.ae ? 1 : 1.6, opacity: dim ? .14 : .95 });
      c.appendChild(s('title', {}, `${e.n} ${e.y}: ${e.t}`));
      svg.appendChild(c);
      if (step === 4 && e.s) svg.appendChild(s('text', { x: xs(e.d) + 9, y: ys(e.p) + 4, style: `font-size:11px;font-weight:600;fill:${C.ink}` }, `${e.c} ${e.y}`));
    });
    const n = D.episodes.length, nR = D.episodes.filter(e => e.z === 'R').length, nAE = D.episodes.filter(e => e.ae).length, nAER = D.episodes.filter(e => e.ae && e.z === 'R').length, nS = D.episodes.filter(e => e.s).length;
    readout.innerHTML = [`<b>${n}</b> tightening episodes, 2000–2024`, `Zones from Greenwood et al. (2022): crisis probability within three years is <b>36.8%</b> in the R-zone, 3.3% in the middle cell`, `<b>${nR} of ${n}</b> episodes began inside the R-zone`, `<b>${nAER} of ${nAE}</b> advanced-economy episodes began inside the R-zone`, `<b>${nS}</b> of these episodes are the reforms studied in the household-level and market-level papers the article reviews`][step];
  }
  const steps = [...root.querySelectorAll('.step')];
  const io = new IntersectionObserver(entries => { entries.forEach(en => { if (en.isIntersecting) { step = +en.target.dataset.step; steps.forEach(x => x.classList.toggle('active', x === en.target)); draw(); } }); }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  steps.forEach(x => io.observe(x));
  draw();
})();
/* Flag display equations that overflow their box on narrow screens so the CSS can show a scroll hint. */
(function () {
  function mark() { document.querySelectorAll('.eqn, .eqn-unnumbered').forEach(e => { const over = [e.querySelector('.eqwrap') || e, e.querySelector('math')].some(w => w && w.scrollWidth > w.clientWidth + 2); e.classList.toggle('wide', over); }); }
  addEventListener('load', mark); addEventListener('resize', mark);
})();
