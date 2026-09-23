/* js/deck-charts.js — the stages of the "Where the Money Lives" deck.
 *
 * Every chart is drawn at run time with the explorable's own library
 * (js/lib.js and js/illustrations.js, copied from Explorable_HousingReturns/),
 * so the deck's figures are the explorable's figures: same numbers, same
 * palette, same brick-and-thatch materials.
 *
 * A slide asks for a chart with
 *     <div class="stage" data-chart="name"></div>
 * and adds data-animate when the chart's build-in should replay every time the
 * slide is shown. Estimates come from LIB.PAPER in lib.js; anything stylised
 * says so in its caption.
 */
(function () {
  'use strict';

  function main() {
    const L = window.LIB, CD = window.CD;
    if (!L || !CD) { console.error('deck-charts.js: load js/lib.js and js/illustrations.js first'); return; }
    const P = L.PAPER, S = L.svg, E = L.el;
    CD.patchLib();              // LIB.house(colour) → Anna's longhouse, Bo's townhouse, the villa
    CD.install({ brand: false }); // document-wide brick and thatch patterns for the CSS material swap
    // ?static and reveal's ?print-pdf draw every chart in its finished state; so does a reduced-motion setting
    const STATIC = /[?&](static|print-pdf)\b/.test(location.search) || L.reduced();

    // ---------- small helpers ----------
    const wrap = (svg, style) => { const d = E('div', { class: 'chart-wrap' }, [svg]); if (style) d.style.cssText = style; return d; };
    const cap = (html) => E('p', { class: 'caption', html });
    const live = (el, sel) => { const s = el.closest('section'); return s ? s.querySelector(sel) : null; };
    const xhtmlDiv = (node) => { const d = document.createElementNS('http://www.w3.org/1999/xhtml', 'div'); d.style.cssText = 'display:flex;justify-content:center;align-items:flex-end;width:100%;height:100%'; d.appendChild(node); return d; };
    // Drag along x inside an svg. Returns a cleanup function.
    const dragX = (svg, onX) => {
      let down = false;
      const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
      const up = () => { down = false; };
      svg.style.cursor = 'ew-resize'; svg.style.touchAction = 'none';
      svg.addEventListener('pointerdown', (e) => { down = true; onX(pt(e).x); });
      svg.addEventListener('pointermove', (e) => { if (down) onX(pt(e).x); });
      window.addEventListener('pointerup', up);
      return () => window.removeEventListener('pointerup', up);
    };
    const chip = (text, pressed, onClick) => { const b = E('button', { class: 'chip', text, 'aria-pressed': pressed ? 'true' : 'false' }); b.addEventListener('click', onClick); return b; };
    const press = (container, test) => [...container.querySelectorAll('.chip')].forEach((b) => b.setAttribute('aria-pressed', test(b) ? 'true' : 'false'));

    const CH = {};

    // =====================================================================
    // Title and closing: the skyline, Jutland to Copenhagen as one line
    // =====================================================================
    CH.skyline = (el, o) => { el.appendChild(wrap(CD.skyline(1000, 300, { animate: o.animate }))); };

    // =====================================================================
    // Two buyers
    // =====================================================================
    CH['two-buyers'] = (el) => {
      const fig = (cls, name, sub) => E('figure', { class: 'buyer ' + cls }, [
        L.house(`var(--${cls})`, 200, { fill: true }),
        E('figcaption', {}, [E('b', { text: name }), E('small', { text: sub })]),
      ]);
      el.appendChild(E('div', { class: 'two-houses' }, [fig('anna', 'Anna: 10th income percentile'), fig('bo', 'Bo: 90th income percentile')]));
      el.appendChild(cap('Both bought in 2005 and sold ten years later. Income rank is measured within the buyer\'s own age cohort in the year before purchase.'));
    };

    // The reveal: price gain first, then the rent she never paid
    CH.reveal = (el, o) => {
      const W = 600, H = 400, base = 330, top = 40;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const scale = (v) => v / 10 * (base - top); // 10% per year = full height
      const bars = [
        { x: 150, cg: L.cg(10), y: L.yieldOf(10), color: 'var(--anna)', name: 'Anna' },
        { x: 400, cg: L.cg(90), y: L.yieldOf(90), color: 'var(--bo)', name: 'Bo' },
      ];
      const els = bars.map((b) => {
        const hb = CD.houseBar(svg, { x: b.x, w: 110, base }); hb.set(0, 0);
        const t1 = S('text', { x: b.x, y: base + 28, 'text-anchor': 'middle', class: 'lbl-big', text: b.name, fill: b.color });
        const v1 = S('text', { x: b.x + 66, y: base, class: 'lbl-mono', text: '' });
        const v2 = S('text', { x: b.x + 66, y: base, class: 'lbl-mono', text: '', fill: 'var(--yield)' });
        svg.append(t1, v1, v2);
        return { b, hb, v1, v2, ky: 0 };
      });
      svg.appendChild(S('line', { x1: 60, x2: W - 40, y1: base, y2: base, stroke: 'var(--line)' }));
      const leg = E('div', { class: 'legend' });
      leg.appendChild(E('span', { style: '--c:var(--gain)', text: 'price gain, % per year' }));
      leg.appendChild(E('span', { class: 'hatched', style: '--c:var(--yield)', text: 'rental yield: rent not paid, % of price per year' }));
      el.append(wrap(svg), leg, cap('Slopes are the paper\'s estimates. Levels are stylised around the sample averages.'));
      const drawCG = (k) => els.forEach((e) => {
        const h = scale(e.b.cg) * k; e.hb.set(h, scale(e.b.y) * e.ky);
        e.v1.setAttribute('y', base - h / 2 + 4); e.v1.textContent = L.fmtPct(e.b.cg * k, 1);
      });
      const drawY = (k) => els.forEach((e) => {
        e.ky = k; const h0 = scale(e.b.cg), h = scale(e.b.y) * k; e.hb.set(h0, h);
        e.v2.setAttribute('y', base - h0 - h / 2 + 4); e.v2.textContent = k > 0.05 ? L.fmtPct(e.b.y * k, 1) : '';
      });
      if (!o.animate) { drawCG(1); drawY(1); return; }
      let t = null;
      L.tween(0, 1, 1200, drawCG, () => { t = setTimeout(() => L.tween(0, 1, 1600, drawY), 1400); });
      return () => { if (t) clearTimeout(t); };
    };

    // =====================================================================
    // 1 · The gap
    // =====================================================================
    CH.gradient = (el) => {
      const c = L.chart(640, 380, { l: 58, r: 20, t: 30, b: 46 }, [0, 100], [1.5, 6]);
      L.axisY(c, [2, 3, 4, 5, 6], v => v + '%', 'annualized real capital gain');
      L.axisX(c, [0, 20, 40, 60, 80, 100], v => v, 'income rank, within age cohort');
      const r = L.rng(11);
      for (let k = 2; k <= 98; k += 2) {
        const dens = 0.35 + k / 100; // buyers are sparse at low ranks
        const v = L.cg(k) + L.randn(r) * 0.22 / Math.sqrt(dens);
        c.g.appendChild(S('circle', { cx: c.x(k), cy: c.y(v), r: 4.5, fill: 'var(--gain)', 'fill-opacity': .75 }));
      }
      c.g.appendChild(S('path', { d: L.linePath([[c.x(0), c.y(L.cg(0))], [c.x(100), c.y(L.cg(100))]]), stroke: 'var(--ink)', 'stroke-width': 2, fill: 'none', 'stroke-dasharray': '3 4' }));
      const hx = S('line', { y1: c.m.t, y2: c.H - c.m.b, stroke: 'var(--ink)', 'stroke-width': 1.5 });
      const dot = S('circle', { r: 7, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 2.5 });
      const card = S('g');
      const t1 = S('text', { x: 10, y: 19, class: 'lbl' }), t2 = S('text', { x: 10, y: 38, class: 'lbl-mono' });
      card.append(S('rect', { width: 205, height: 48, rx: 6, fill: 'var(--paper)', stroke: 'var(--line)' }), t1, t2);
      c.g.append(hx, dot, card);
      const sl = L.slider('income rank', 0, 100, 37, 1, v => String(v), 'dk-gap-rank');
      const set = (rank) => {
        rank = L.clamp(Math.round(rank), 0, 100);
        const x = c.x(rank), y = c.y(L.cg(rank));
        hx.setAttribute('x1', x); hx.setAttribute('x2', x); dot.setAttribute('cx', x); dot.setAttribute('cy', y);
        card.setAttribute('transform', `translate(${L.clamp(x + 12, c.m.l, c.W - c.m.r - 205)},${c.m.t})`);
        t1.textContent = `A buyer at rank ${rank}`; t2.textContent = `gains ≈ ${L.fmtPct(L.cg(rank), 1)} a year`;
        sl.input.value = rank; sl.out.textContent = String(rank);
      };
      set(37);
      sl.input.addEventListener('input', () => set(+sl.input.value));
      const off = dragX(c.svg, (x) => set(c.x.invert(x)));
      el.append(wrap(c.svg), sl.row, cap('Dots are stylised around the estimated line. The dashed line is the paper\'s slope: <span class="num">0.017</span> points of yearly gain per rank point, so the 90th percentile gains about <span class="num">1.36</span> points a year more than the 10th.'));
      return off;
    };

    CH.compound = (el) => {
      const c = L.chart(640, 360, { l: 62, r: 24, t: 24, b: 46 }, [0, 20], [1, 2.4]);
      L.axisY(c, [1, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4], v => '×' + v.toFixed(1), 'value relative to purchase');
      L.axisX(c, [0, 5, 10, 15, 20], v => v + 'y', 'years owned');
      const pa = S('path', { fill: 'none', stroke: 'var(--anna)', 'stroke-width': 2.5 });
      const pb = S('path', { fill: 'none', stroke: 'var(--bo)', 'stroke-width': 2.5 });
      const gapLine = S('line', { stroke: 'var(--gain)', 'stroke-width': 2 });
      const gapLbl = S('text', { class: 'lbl', fill: 'var(--gain)' });
      const la = S('text', { class: 'lbl', fill: 'var(--anna)', text: 'Anna' }), lb = S('text', { class: 'lbl', fill: 'var(--bo)', text: 'Bo' });
      c.g.append(pa, pb, gapLine, gapLbl, la, lb);
      const cgA = L.cg(10) / 100, cgB = L.cg(90) / 100;
      const draw = (T) => {
        const ptsA = [], ptsB = [];
        for (let t = 0; t <= T + 1e-9; t += 0.25) { ptsA.push([c.x(t), c.y(Math.exp(cgA * t))]); ptsB.push([c.x(t), c.y(Math.exp(cgB * t))]); }
        pa.setAttribute('d', L.linePath(ptsA)); pb.setAttribute('d', L.linePath(ptsB));
        const yA = Math.exp(cgA * T), yB = Math.exp(cgB * T);
        gapLine.setAttribute('x1', c.x(T)); gapLine.setAttribute('x2', c.x(T)); gapLine.setAttribute('y1', c.y(yA)); gapLine.setAttribute('y2', c.y(yB));
        gapLbl.setAttribute('x', L.clamp(c.x(T) + 8, c.m.l, c.W - 90)); gapLbl.setAttribute('y', (c.y(yA) + c.y(yB)) / 2 + 4);
        gapLbl.textContent = T > 0 ? `+${((yB / yA - 1) * 100).toFixed(0)}%` : '';
        la.setAttribute('x', L.clamp(c.x(T) + 8, c.m.l, c.W - 40)); la.setAttribute('y', c.y(yA) + 14);
        lb.setAttribute('x', L.clamp(c.x(T) + 8, c.m.l, c.W - 40)); lb.setAttribute('y', c.y(yB) - 6);
      };
      const sl = L.slider('years owned', 1, 20, 10, 1, v => v + ' y', 'dk-gap-years');
      sl.input.addEventListener('input', () => draw(+sl.input.value));
      draw(10);
      el.append(wrap(c.svg), sl.row, cap(`Anna's home grows <span class="num">${L.fmtPct(L.cg(10), 2)}</span> a year, Bo's <span class="num">${L.fmtPct(L.cg(90), 2)}</span>, continuously compounded from the same purchase price.`));
    };

    // =====================================================================
    // 2 · Where, not what
    // =====================================================================
    CH['two-dials'] = (el) => {
      const s1 = L.slider('how strongly it predicts capital gains', 0, 100, 70, 1, v => v + '%', 'dk-why-d1');
      const s2 = L.slider('how different Anna and Bo are on it', 0, 100, 60, 1, v => v + '%', 'dk-why-d2');
      const W = 600, H = 200;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const bar = S('rect', { x: 40, y: 70, width: 0, height: 44, rx: 6, fill: 'var(--gain)', class: 'brick' });
      const val = S('text', { x: 560, y: 145, 'text-anchor': 'end', class: 'lbl-big' });
      svg.append(S('rect', { x: 40, y: 70, width: 520, height: 44, rx: 6, fill: 'var(--paper-2)', stroke: 'var(--line)' }), bar,
        S('text', { x: 40, y: 56, class: 'lbl', text: 'share of the gap this factor could account for' }), val);
      const upd = () => {
        const k = (+s1.input.value / 100) * (+s2.input.value / 100);
        bar.setAttribute('width', 520 * k); val.textContent = Math.round(k * 100) + '%';
        val.setAttribute('fill', k < 0.05 ? 'var(--ink-3)' : 'var(--ink)');
      };
      s1.input.addEventListener('input', upd); s2.input.addEventListener('input', upd); upd();
      el.append(wrap(svg), s1.row, s2.row, cap('The two multiply. Apartments appreciate faster than houses, but Anna and Bo are about equally likely to buy one, so property type accounts for almost none of the gap. Municipalities differ enormously in price growth, and Anna and Bo buy in very different ones.'));
    };

    // The specification ladder as a coefficient chart, with confidence intervals
    CH.ladder = (el) => {
      const specs = P.specs;
      const labels = { base: 'nothing (baseline)', prop: '+ property traits', buyer: '+ buyer traits', time: '+ market timing', mun: '+ municipality', post: '+ postcode', timepost: '+ timing × postcode' };
      const W = 680, H = 380, rowH = 42, top = 36;
      const c = L.chart(W, H, { l: 200, r: 160, t: top, b: 40 }, [-0.003, 0.024], [0, 1]);
      L.axisX(c, [0, 0.005, 0.01, 0.015, 0.02], v => v.toFixed(3), 'annualized real capital gain per income-rank point');
      c.g.appendChild(S('line', { x1: c.x(0), x2: c.x(0), y1: top - 10, y2: H - c.m.b, stroke: 'var(--ink-3)' }));
      specs.forEach((s, i) => {
        const y = top + i * rowH, mid = y + rowH / 2;
        const lo = s.beta - 1.96 * s.se, hi = s.beta + 1.96 * s.se, dead = lo <= 0;
        c.g.appendChild(S('text', { x: c.m.l - 12, y: mid + 5, 'text-anchor': 'end', class: 'lbl', text: labels[s.key], fill: dead ? 'var(--ink-3)' : 'var(--ink)' }));
        const bar = S('rect', { x: c.x(0), y: y + 8, width: Math.max(0, c.x(s.beta) - c.x(0)), height: rowH - 16, rx: 2, fill: dead ? 'var(--paper-3)' : 'var(--gain)' });
        if (dead) bar.setAttribute('stroke', 'var(--line)'); else bar.setAttribute('class', 'brick');
        c.g.appendChild(bar);
        c.g.appendChild(S('line', { x1: c.x(lo), x2: c.x(hi), y1: mid, y2: mid, stroke: 'var(--ink)', 'stroke-width': 2 }));
        for (const v of [lo, hi]) c.g.appendChild(S('line', { x1: c.x(v), x2: c.x(v), y1: mid - 6, y2: mid + 6, stroke: 'var(--ink)', 'stroke-width': 2 }));
        c.g.appendChild(S('text', { x: c.x(Math.max(hi, 0)) + 10, y: mid + 5, class: 'lbl-mono', fill: dead ? 'var(--ink-3)' : 'var(--ink)', text: `${s.beta.toFixed(3)} · ${(s.beta * 80).toFixed(2)} pts Anna–Bo` }));
      });
      el.append(wrap(c.svg), cap('Coefficient on income rank with 95% intervals, controls cumulative down the rows. Right-hand numbers: the implied yearly gap between the 90th and 10th percentiles. The last row is statistically indistinguishable from zero.'));
    };

    CH.gelbach = (el) => {
      const g = P.gelbach;
      const parts = [
        { label: 'Location', v: g.location, c: 'var(--gain)', brick: true },
        { label: 'Timing', v: g.timing, c: 'var(--ink-3)' },
        { label: 'Buyer', v: g.buyer, c: 'var(--ink-2)' },
        { label: 'Property', v: g.property, c: 'var(--line)' },
      ];
      const W = 640, H = 240;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      let x = 30; const y = 80, h = 70, w = 580;
      for (const p of parts) {
        const ww = w * p.v;
        const r = S('rect', { x: x + 1, y, width: Math.max(0, ww - 2), height: h, fill: p.c, rx: 3 });
        if (p.brick) r.setAttribute('class', 'brick');
        svg.appendChild(r);
        if (p.v > 0.2) {
          svg.appendChild(S('text', { x: x + ww / 2, y: y + h / 2 + 6, 'text-anchor': 'middle', class: 'lbl onbar', fill: 'var(--paper)', text: Math.round(p.v * 100) + '%' }));
          svg.appendChild(S('text', { x: x + ww / 2, y: y + h + 22, 'text-anchor': 'middle', class: 'lbl-mono', text: p.label }));
        }
        x += ww;
      }
      svg.appendChild(S('text', { x: 610, y: y + h + 22, 'text-anchor': 'end', class: 'lbl-mono', text: parts.slice(1).map(p => `${p.label} ${Math.round(p.v * 100)}%`).join(' · ') }));
      svg.appendChild(S('text', { x: 30, y: 58, class: 'lbl', text: 'share of the explained shrinkage in the coefficient, postcode specification' }));
      el.append(wrap(svg), cap('Gelbach (2016) decomposition. With municipality instead of postcode fixed effects, location takes about 67%.'));
    };

    CH.flip = (el) => {
      const c = L.chart(640, 360, { l: 56, r: 20, t: 30, b: 46 }, [0, 100], [-1, 1]);
      L.axisY(c, [-1, -0.5, 0, 0.5, 1], v => (v > 0 ? '+' : '') + v.toFixed(1), 'yearly gain relative to rank 50, points');
      L.axisX(c, [0, 25, 50, 75, 100], v => v, 'income rank');
      c.g.appendChild(S('line', { x1: c.m.l, x2: c.W - c.m.r, y1: c.y(0), y2: c.y(0), stroke: 'var(--ink-3)' }));
      c.g.appendChild(S('path', { d: L.linePath([[c.x(0), c.y(-0.85)], [c.x(100), c.y(0.85)]]), stroke: 'var(--gain)', 'stroke-width': 3, fill: 'none' }));
      c.g.appendChild(S('path', { d: L.linePath([[c.x(0), c.y(0.2)], [c.x(100), c.y(-0.2)]]), stroke: 'var(--ink)', 'stroke-width': 3, fill: 'none', 'stroke-dasharray': '8 5' }));
      c.g.appendChild(S('text', { x: c.x(100) - 4, y: c.y(0.85) - 8, 'text-anchor': 'end', class: 'lbl', fill: 'var(--gain)', text: 'all of Denmark: +0.017 per rank' }));
      c.g.appendChild(S('text', { x: c.x(100) - 4, y: c.y(-0.2) + 18, 'text-anchor': 'end', class: 'lbl', text: 'within Copenhagen postcodes: −0.004 per rank' }));
      el.append(wrap(c.svg), cap('The within-city estimate controls for property and buyer traits, postcode, and purchase and sale years. The pattern is similar in the other large cities.'));
    };

    // =====================================================================
    // 3 · The other half of the return
    // =====================================================================
    CH['rent-counter'] = (el, o) => {
      const W = 600, H = 340;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const f = S('foreignObject', { x: 70, y: 40, width: 220, height: 220 }); f.appendChild(xhtmlDiv(L.house('var(--anna)', 210, { fill: true }))); svg.appendChild(f);
      svg.appendChild(S('path', { d: 'M 310 150 C 390 70, 480 70, 510 150 C 530 200, 480 240, 430 230', fill: 'none', stroke: 'var(--yield)', 'stroke-width': 3, 'stroke-dasharray': '6 5' }));
      svg.appendChild(S('path', { d: 'M 438 218 L 428 232 L 444 236', fill: 'none', stroke: 'var(--yield)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
      svg.appendChild(S('text', { x: 410, y: 62, 'text-anchor': 'middle', class: 'lbl', fill: 'var(--yield)', text: 'rent, paid to herself' }));
      svg.appendChild(S('text', { x: 300, y: 290, 'text-anchor': 'middle', class: 'lbl-mono', text: 'rent Anna did not pay since she moved in' }));
      const num = S('text', { x: 300, y: 322, 'text-anchor': 'middle', class: 'lbl-big', text: '' });
      svg.appendChild(num);
      el.append(wrap(svg), cap('About 4,900 DKK a month, a rent typical of the provincial towns where lower-income buyers concentrate. Over ten years that is close to 600,000 kroner.'));
      const monthly = 4900; let months = (!o.animate || L.reduced()) ? 119 : 0, alive = true;
      const tick = () => { if (!alive) return; months = Math.min(months + 1, 120); num.textContent = L.fmtInt(months * monthly) + ' DKK  ·  ' + Math.floor(months / 12) + 'y ' + (months % 12) + 'm'; if (months < 120) setTimeout(tick, 75); };
      setTimeout(tick, o.animate ? 400 : 0);
      return () => { alive = false; };
    };

    CH.road = (el) => {
      const order = ['rural', 'country', 'province', 'city', 'capital'].map(k => P.urban.find(u => u.key === k));
      const W = 600, H = 340;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      svg.appendChild(S('path', { d: 'M 40 250 Q 300 210 560 250', fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 10, 'stroke-linecap': 'round' }));
      svg.appendChild(S('path', { d: 'M 40 250 Q 300 210 560 250', fill: 'none', stroke: 'var(--paper)', 'stroke-width': 2, 'stroke-dasharray': '10 10' }));
      svg.appendChild(S('text', { x: 40, y: 285, class: 'axis-label', text: 'Jutland village' }));
      svg.appendChild(S('text', { x: 560, y: 285, class: 'axis-label', 'text-anchor': 'end', text: 'central Copenhagen' }));
      const marker = S('g');
      const f = S('foreignObject', { x: -30, y: -70, width: 60, height: 60 }); f.appendChild(xhtmlDiv(L.house('var(--ink)', 60, { face: false, fill: true }))); marker.appendChild(f); svg.appendChild(marker);
      const mk = (x, label, color) => { const g = S('g', { transform: `translate(${x},30)` }); g.appendChild(S('text', { y: 0, class: 'axis-label', text: label })); const v = S('text', { y: 36, class: 'lbl-big', fill: color }); g.appendChild(v); svg.appendChild(g); return v; };
      const vPrice = mk(40, 'price of a 105 m² home', 'var(--ink)');
      const vRent = mk(270, 'monthly rent', 'var(--ink)');
      const vYield = mk(440, 'rent ÷ price, per year', 'var(--yield)');
      const vCG = S('text', { x: 40, y: 124, class: 'lbl', fill: 'var(--gain)' }); svg.appendChild(vCG);
      const set = (t) => {
        const seg = t * (order.length - 1), i = Math.min(order.length - 2, Math.floor(seg)), fr = seg - i;
        const a = order[i], b = order[i + 1];
        const price = L.lerp(a.price, b.price, fr), rent = L.lerp(a.rent, b.rent, fr), cg = L.lerp(a.cg, b.cg, fr);
        const x = 40 + 520 * t, y = 250 - 40 * 4 * t * (1 - t) * 0.5;
        marker.setAttribute('transform', `translate(${x},${y - 4})`);
        vPrice.textContent = L.fmtDKK(price); vRent.textContent = L.fmtInt(rent) + ' DKK'; vYield.textContent = (rent * 12 / price * 100).toFixed(1) + '%';
        vCG.textContent = `capital gain here: about ${cg.toFixed(1)}% a year`;
      };
      const sl = L.slider('along the road', 0, 100, 15, 1, () => '', 'dk-yield-road');
      sl.out.style.display = 'none';
      sl.input.addEventListener('input', () => set(+sl.input.value / 100));
      set(0.15);
      const off = dragX(svg, (x) => { const t = L.clamp((x - 40) / 520, 0, 1); set(t); sl.input.value = Math.round(t * 100); });
      el.append(wrap(svg), sl.row, cap('Capital gains by area type are the paper\'s summary statistics. Rents and prices along the road are illustrative and hold the home\'s size fixed.'));
      return off;
    };

    CH['three-lines'] = (el, o) => {
      const c = L.chart(640, 360, { l: 56, r: 20, t: 30, b: 46 }, [0, 100], [0, 12]);
      L.axisY(c, [0, 2, 4, 6, 8, 10, 12], v => v + '%', '% per year');
      L.axisX(c, [0, 20, 40, 60, 80, 100], v => v, 'income rank');
      const line = (fn, color, dash) => S('path', { d: L.linePath([[c.x(0), c.y(fn(0))], [c.x(100), c.y(fn(100))]]), stroke: color, 'stroke-width': 3, fill: 'none', 'stroke-dasharray': dash || null });
      const lg = line(L.cg, 'var(--gain)'), ly = line(L.yieldOf, 'var(--yield)', '6 5'), lt = line(L.total, 'var(--ink)');
      const tg = S('text', { x: c.x(100) - 4, y: c.y(L.cg(100)) + 16, 'text-anchor': 'end', class: 'lbl', fill: 'var(--gain)', text: 'capital gain' });
      const ty = S('text', { x: c.x(100) - 4, y: c.y(L.yieldOf(100)) - 8, 'text-anchor': 'end', class: 'lbl', fill: 'var(--yield)', text: 'rental yield' });
      const tt = S('text', { x: c.x(100) - 4, y: c.y(L.total(100)) - 8, 'text-anchor': 'end', class: 'lbl', text: 'total' });
      c.g.append(lg, ly, lt, tg, ty, tt);
      const t1 = L.toggle('rental yield', !o.animate, 'dk-y-t1'), t2 = L.toggle('total', !o.animate, 'dk-y-t2');
      const upd = () => { const a = t1.input.checked, b = t2.input.checked; [ly, ty].forEach(e => e.setAttribute('opacity', a ? 1 : 0)); [lt, tt].forEach(e => e.setAttribute('opacity', b ? 1 : 0)); };
      [ly, ty, lt, tt].forEach(e => { e.style.transition = 'opacity .6s'; });
      t1.input.addEventListener('change', upd); t2.input.addEventListener('change', upd); upd();
      const timers = [];
      if (o.animate) timers.push(setTimeout(() => { t1.input.checked = true; upd(); }, 1400), setTimeout(() => { t2.input.checked = true; upd(); }, 3000));
      el.append(wrap(c.svg), E('div', { class: 'ctl' }, [t1.row, t2.row]), cap('Slopes are the paper\'s, levels illustrative. In the subsample with an imputed yield the capital-gain slope is <span class="num">+0.016</span> per rank point and the yield slope about <span class="num">−0.016</span>. The total-return slope is statistically zero.'));
      return () => timers.forEach(clearTimeout);
    };

    CH.shape = (el) => {
      const W = 600, H = 360, base = 300, top = 40;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const sc = (v) => v / 10 * (base - top);
      [{ x: 160, rank: 10, name: 'Anna', color: 'var(--anna)' }, { x: 420, rank: 90, name: 'Bo', color: 'var(--bo)' }].forEach(b => {
        const cg = L.cg(b.rank), y = L.yieldOf(b.rank), tot = cg + y;
        const hb = CD.houseBar(svg, { x: b.x, w: 130, base }); hb.set(sc(cg), sc(y));
        svg.appendChild(S('text', { x: b.x, y: base - sc(cg) / 2 + 5, 'text-anchor': 'middle', class: 'lbl onbar', text: `${Math.round(cg / tot * 100)}% capital gain` }));
        svg.appendChild(S('text', { x: b.x, y: base - sc(cg) - sc(y) / 2 + 5, 'text-anchor': 'middle', class: 'lbl', text: `${Math.round(y / tot * 100)}% rental yield` }));
        svg.appendChild(S('text', { x: b.x, y: base + 28, 'text-anchor': 'middle', class: 'lbl-big', fill: b.color, text: b.name }));
        svg.appendChild(S('text', { x: b.x, y: hb.top(sc(cg), sc(y)) - 8, 'text-anchor': 'middle', class: 'lbl-mono', text: 'total about ' + Math.round(tot) + '%' }));
      });
      svg.appendChild(S('line', { x1: 60, x2: 540, y1: base, y2: base, stroke: 'var(--line)' }));
      el.append(wrap(svg), cap('Brick is the wall: capital gains, the part that can be sold or borrowed against. Thatch is the roof: the yield, the part the owner lives under. Heights are exact, levels illustrative.'));
    };

    // =====================================================================
    // 4 · What you can actually buy
    // =====================================================================
    CH['floor-ceiling'] = (el) => {
      const W = 600, H = 300;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      svg.appendChild(S('rect', { x: 120, y: 80, width: 360, height: 130, fill: 'var(--ink)', 'fill-opacity': .07 }));
      svg.appendChild(S('line', { x1: 80, x2: 520, y1: 80, y2: 80, stroke: 'var(--ink)', 'stroke-width': 3 }));
      svg.appendChild(S('line', { x1: 80, x2: 520, y1: 210, y2: 210, stroke: 'var(--ink)', 'stroke-width': 3 }));
      svg.appendChild(S('text', { x: 80, y: 68, class: 'lbl', text: 'ceiling: what the lender will finance' }));
      svg.appendChild(S('text', { x: 80, y: 236, class: 'lbl', text: 'floor: a home large enough to live in' }));
      svg.appendChild(S('text', { x: 300, y: 152, 'text-anchor': 'middle', class: 'lbl-big', text: 'feasible set' }));
      const sl = CD.sliver(320); sl.style.cssText = 'flex:0 0 auto;align-self:center;height:130px;max-width:100%';
      el.append(sl, wrap(svg), cap('With equities anyone can hold a sliver of the best asset in the world. Housing is bought whole, in one place, and has to fit the household.'));
    };

    CH['bank-rules'] = (el) => {
      const sI = L.slider('yearly income', 80000, 900000, L.HH.mid.income, 5000, v => L.fmtDKK(v), 'dk-f-inc');
      const sW = L.slider('savings + home equity', 0, 2000000, L.HH.mid.wealth, 10000, v => L.fmtDKK(v), 'dk-f-w');
      const presets = E('div', { class: 'ctl' });
      let curHH = 'mid';
      for (const k of ['anna', 'mid', 'bo']) {
        const h = L.HH[k];
        presets.appendChild(chip(h.name + (k === 'mid' ? ' (rank 50)' : k === 'anna' ? ' (rank 10)' : ' (rank 90)'), k === curHH, () => {
          curHH = k; sI.input.value = h.income; sW.input.value = h.wealth; sI.out.textContent = L.fmtDKK(h.income); sW.out.textContent = L.fmtDKK(h.wealth); upd();
        }));
      }
      const W = 600, H = 200;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const x0 = 200, wmax = 380, scaleP = (v) => wmax * L.clamp(v / 6e6, 0, 1);
      const row = (y, label) => {
        svg.appendChild(S('text', { x: x0 - 10, y: y + 15, 'text-anchor': 'end', class: 'lbl', text: label }));
        const bar = S('rect', { x: x0, y, width: 0, height: 22, rx: 4, fill: 'var(--ink-3)' });
        const v = S('text', { x: x0 + 6, y: y + 15, class: 'lbl-mono' });
        svg.append(S('rect', { x: x0, y, width: wmax, height: 22, rx: 4, fill: 'var(--paper-2)', stroke: 'var(--line)' }), bar, v); return { bar, v };
      };
      const r1 = row(24, 'loan allowed by savings'), r2 = row(64, 'loan allowed by income'), r3 = row(126, 'maximum price');
      svg.appendChild(S('text', { x: x0, y: 116, class: 'axis-label', text: 'smaller loan + your savings =' }));
      const upd = () => {
        const b = L.borrow(+sI.input.value, +sW.input.value);
        for (const [r, v] of [[r1, b.ltvLoan], [r2, b.ptiLoan], [r3, b.max]]) { r.bar.setAttribute('width', scaleP(v)); r.v.textContent = L.fmtDKK(v); r.v.setAttribute('x', x0 + scaleP(v) + 8); }
        r1.bar.setAttribute('fill', b.binding === 'LTV' ? 'var(--ink)' : 'var(--line)');
        r2.bar.setAttribute('fill', b.binding === 'PTI' ? 'var(--ink)' : 'var(--line)');
        r3.bar.setAttribute('fill', curHH ? L.HH[curHH].color : 'var(--ink)');
        press(presets, (c) => curHH && c.textContent.startsWith(L.HH[curHH].name));
        const ex = live(el, '.live-note');
        if (ex) ex.innerHTML = b.binding === 'PTI'
          ? `The <strong>income rule</strong> binds. Even with more savings this household could not carry a larger monthly payment. Ceiling: <span class="num">${L.fmtDKK(b.max)}</span>.`
          : `The <strong>down-payment rule</strong> binds. The income could carry a larger loan, but the savings cannot cover 20 percent of it. Ceiling: <span class="num">${L.fmtDKK(b.max)}</span>.`;
      };
      sI.input.addEventListener('input', () => { curHH = null; upd(); }); sW.input.addEventListener('input', () => { curHH = null; upd(); });
      el.append(presets, sI.row, sW.row, wrap(svg), cap('Dark bar: the rule that binds. 20% down payment, payments at most 35% of income, 30-year loan at 4%. The paper\'s assumptions, with alternatives checked in the appendix.'));
      upd();
    };

    // The paper's feasible-set regressions: share of transactions affordable, by rank
    CH['choice-lines'] = (el) => {
      const c = L.chart(640, 380, { l: 58, r: 20, t: 30, b: 46 }, [0, 100], [0, 0.8]);
      L.axisY(c, [0, 0.2, 0.4, 0.6, 0.8], v => Math.round(v * 100) + '%', 'share of homes sold that the buyer could finance');
      L.axisX(c, [0, 20, 40, 60, 80, 100], v => v, 'income rank');
      const A = P.choiceSet.all, G = P.choiceSet.highGrowthSameSize;
      const f1 = r => A.a + A.b * r, f2 = r => Math.max(0, G.a + G.b * r);
      const pts = (f) => { const a = []; for (let r = 0; r <= 100; r += 2) a.push([c.x(r), c.y(f(r))]); return a; };
      c.g.appendChild(S('path', { d: L.linePath(pts(f1)), stroke: 'var(--ink)', 'stroke-width': 3, fill: 'none' }));
      c.g.appendChild(S('path', { d: L.linePath(pts(f2)), stroke: 'var(--gain)', 'stroke-width': 3, fill: 'none', 'stroke-dasharray': '7 5' }));
      c.g.appendChild(S('text', { x: c.x(60), y: c.y(f1(60)) - 12, 'text-anchor': 'middle', class: 'lbl', text: 'all homes sold' }));
      c.g.appendChild(S('text', { x: c.x(60), y: c.y(f2(60)) + 22, 'text-anchor': 'middle', class: 'lbl', fill: 'var(--gain)', text: 'high-growth areas, same size of home' }));
      for (const [rank, who, col] of [[10, 'Anna', 'var(--anna)'], [90, 'Bo', 'var(--bo)']]) {
        for (const [f, lc] of [[f1, 'var(--ink)'], [f2, 'var(--gain)']]) {
          const dy = (f === f2 && rank > 50) ? 22 : -12; // Bo's two labels straddle his dots; Anna's both sit above
          c.g.appendChild(S('circle', { cx: c.x(rank), cy: c.y(f(rank)), r: 7, fill: col, stroke: 'var(--paper)', 'stroke-width': 2 }));
          c.g.appendChild(S('text', { x: c.x(rank) + (rank > 50 ? -12 : 12), y: c.y(f(rank)) + dy, 'text-anchor': rank > 50 ? 'end' : 'start', class: 'lbl', fill: lc, text: `${who} ${Math.round(f(rank) * 100)}%` }));
        }
      }
      el.append(wrap(c.svg), cap('Linear fits from the paper\'s appendix, maximum-borrowing measure: share of contemporaneous transactions a buyer at each rank could finance, nationally and within high-growth areas holding the size of the home fixed. A rank-40 buyer reaches about <span class="num">' + Math.round(f2(40) * 100) + '%</span> of high-growth homes.'));
    };

    // Stylised field of homes with a ceiling, a floor, and a high-growth filter
    const TYPE_LABEL = { rural: 'village', country: 'countryside', province: 'prov. town', city: 'big city', capital: 'Copenhagen' };
    const TYPES_ORDERED = ['rural', 'country', 'province', 'city', 'capital'];
    function homesField(W, H) {
      const c = L.chart(W, H, { l: 56, r: 16, t: 24, b: 40 }, [0, 5], [0.2e6, 6e6]);
      const ylog = L.scale(Math.log(0.25e6), Math.log(6e6), c.H - c.m.b, c.m.t);
      const Y = (p) => ylog(Math.log(L.clamp(p, 0.25e6, 6e6)));
      const g = S('g', { class: 'axis' });
      for (const t of [0.5e6, 1e6, 2e6, 4e6]) {
        g.appendChild(S('line', { class: 'grid', x1: c.m.l, x2: c.W - c.m.r, y1: Y(t), y2: Y(t) }));
        g.appendChild(S('text', { x: c.m.l - 6, y: Y(t) + 3.5, 'text-anchor': 'end', text: (t / 1e6).toFixed(1).replace('.0', '') + 'm' }));
      }
      g.appendChild(S('text', { x: c.m.l, y: c.m.t - 8, class: 'axis-label', text: 'price, DKK' }));
      c.g.appendChild(g);
      L.axisX(c, TYPES_ORDERED.map((t, i) => i + 0.5), (v) => TYPE_LABEL[TYPES_ORDERED[Math.floor(v)]], '');
      const dots = L.homes.map(h => {
        const i = TYPES_ORDERED.indexOf(h.type);
        const d = S('circle', { cx: c.x(i + 0.12 + 0.76 * h.x), cy: Y(h.price), r: 3.4, fill: 'var(--ink-3)', 'fill-opacity': 0.55 });
        d.appendChild(S('title', { text: `${TYPE_LABEL[h.type]} · ${h.size} m² · ${L.fmtDKK(h.price)}` }));
        c.g.appendChild(d); return d;
      });
      const ceiling = S('line', { x1: c.m.l, x2: c.W - c.m.r, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '6 4' });
      const ceilLbl = S('text', { x: c.W - c.m.r, 'text-anchor': 'end', class: 'lbl', text: '' });
      c.g.append(ceiling, ceilLbl);
      const shade = S('rect', { x: c.x(3), y: c.m.t, width: c.x(5) - c.x(3), height: c.H - c.m.t - c.m.b, fill: 'var(--gain)', 'fill-opacity': 0.06, opacity: 0 });
      c.g.insertBefore(shade, c.g.firstChild);
      const paint = (maxPrice, { minSize = 0, highGrowth = false, color = 'var(--bo)' } = {}) => {
        const y = Y(maxPrice); ceiling.setAttribute('y1', y); ceiling.setAttribute('y2', y);
        ceilLbl.setAttribute('y', y - 6); ceilLbl.textContent = `ceiling ${L.fmtDKK(maxPrice)}`;
        shade.setAttribute('opacity', highGrowth ? 1 : 0);
        L.homes.forEach((h, i) => {
          const excluded = (highGrowth && !L.HIGH_GROWTH.has(h.type)) || h.size < minSize;
          const ok = !excluded && h.price <= maxPrice;
          dots[i].setAttribute('fill', ok ? color : 'var(--ink-3)');
          dots[i].setAttribute('fill-opacity', excluded ? 0.12 : ok ? 0.9 : 0.45);
          dots[i].setAttribute('r', ok ? 4 : 3.2);
        });
        return L.feasibleShare(maxPrice, { minSize, highGrowth });
      };
      return { svg: c.svg, paint };
    }

    CH['homes-map'] = (el, o) => {
      const field = homesField(640, 330);
      const who = E('div', { class: 'ctl' });
      let cur = 'anna';
      for (const k of ['anna', 'mid', 'bo']) who.appendChild(chip(L.HH[k].name, k === cur, () => { cur = k; upd(); }));
      const tSize = L.toggle('at least 90 m²', !o.animate, 'dk-f-size'), tHigh = L.toggle('only high-growth places', !o.animate, 'dk-f-high');
      const upd = () => {
        const h = L.HH[cur];
        const share = field.paint(L.borrow(h.income, h.wealth).max, { minSize: tSize.input.checked ? 90 : 0, highGrowth: tHigh.input.checked, color: h.color });
        press(who, (c) => c.textContent === h.name);
        const q = live(el, '.live-note');
        const what = (tHigh.input.checked ? 'of homes in the fast-growing places' : 'of these homes') + (tSize.input.checked ? ', at 90 m² or more' : '');
        if (q) q.innerHTML = `${h.name} could buy <span class="num">${Math.round(share * 100)}%</span> ${what}.`;
      };
      tSize.input.addEventListener('change', upd); tHigh.input.addEventListener('change', upd);
      const timers = [];
      if (o.animate) timers.push(setTimeout(() => { tSize.input.checked = true; upd(); }, 1800), setTimeout(() => { tHigh.input.checked = true; upd(); }, 3600));
      el.append(E('div', { class: 'ctl' }, [who, tSize.row, tHigh.row]), wrap(field.svg), cap('Stylised stock of homes. In the data, buyers in the bottom third could finance about <span class="num">40%</span> of homes sold and the top third over <span class="num">60%</span>. In high-growth areas at the same size, a rank-40 buyer reaches about <span class="num">20%</span>.'));
      upd();
      return () => timers.forEach(clearTimeout);
    };

    CH.binding = (el) => {
      const c = L.chart(640, 360, { l: 56, r: 20, t: 30, b: 46 }, [0, 100], [0, 1]);
      L.axisY(c, [0, 0.25, 0.5, 0.75, 1], v => Math.round(v * 100) + '%', 'share of buyers');
      L.axisX(c, [0, 20, 40, 60, 80, 100], v => v, 'income rank');
      const ltv = (r) => 0.22 + 0.30 * Math.exp(-Math.pow((r - 55) / 22, 2)); // inverted U, stylised
      const pts = []; for (let r = 0; r <= 100; r += 5) pts.push([c.x(r), c.y(ltv(r))]);
      c.g.append(
        S('path', { d: L.linePath(pts) + ` L${c.x(100)} ${c.y(1)} L${c.x(0)} ${c.y(1)} Z`, fill: 'var(--ink)', 'fill-opacity': .12 }),
        S('path', { d: L.linePath(pts) + ` L${c.x(100)} ${c.y(0)} L${c.x(0)} ${c.y(0)} Z`, fill: 'var(--ink-3)', 'fill-opacity': .35 }),
      );
      c.g.appendChild(S('text', { x: c.x(50), y: c.y(0.2), 'text-anchor': 'middle', class: 'lbl', text: 'down-payment rule binds' }));
      c.g.appendChild(S('text', { x: c.x(50), y: c.y(0.8), 'text-anchor': 'middle', class: 'lbl', text: 'income rule binds' }));
      el.append(wrap(c.svg), cap('Shape follows the paper\'s figure of binding constraints by rank: an inverted U for the loan-to-value rule, with payment-to-income binding for slightly over half of buyers overall. The paper\'s figure is in the appendix.'));
    };

    // =====================================================================
    // 5 · The reform
    // =====================================================================
    CH['payment-bars'] = (el) => {
      const W = 600, H = 300;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const bar = (x, h, color, label, val, brick) => {
        const r = S('rect', { x, y: 230 - h, width: 130, height: h, fill: color, rx: 4 }); if (brick) r.setAttribute('class', 'brick');
        svg.appendChild(r);
        svg.appendChild(S('text', { x: x + 65, y: 256, 'text-anchor': 'middle', class: 'lbl', text: label }));
        svg.appendChild(S('text', { x: x + 65, y: 230 - h - 10, 'text-anchor': 'middle', class: 'lbl-mono', text: val }));
      };
      bar(105, 170, 'var(--ink-3)', 'repayment mortgage, before 2003', 'monthly payment: 100');
      bar(365, 136, 'var(--gain)', 'interest-only, from 2003', 'about 80', true);
      svg.appendChild(S('text', { x: 300, y: 24, 'text-anchor': 'middle', class: 'lbl', text: 'same loan, lower monthly payment' }));
      el.append(wrap(svg), cap('Ten years without repayment of principal cut the monthly payment on the same loan by roughly a fifth, which relaxes the payment-to-income rule and nothing else mechanically.'));
    };

    function eventStudy(W, H, years, coef, se, yd, fmt, label, color, ticks, base = 2003) {
      const c = L.chart(W, H, { l: 60, r: 16, t: 28, b: 40 }, [years[0] - 0.5, years[years.length - 1] + 0.5], yd);
      L.axisY(c, ticks, fmt, label);
      L.axisX(c, years.filter(y => y % 2 === 0), v => "'" + String(v).slice(2), '');
      c.g.appendChild(S('line', { x1: c.m.l, x2: c.W - c.m.r, y1: c.y(0), y2: c.y(0), stroke: 'var(--ink-3)' }));
      c.g.appendChild(S('line', { x1: c.x(base + 0.5), x2: c.x(base + 0.5), y1: c.m.t, y2: c.H - c.m.b, stroke: 'var(--gain)', 'stroke-dasharray': '4 4' }));
      c.g.appendChild(S('text', { x: c.x(base + 0.5) + 4, y: c.m.t + 10, class: 'lbl', fill: 'var(--gain)', text: 'reform' }));
      const items = years.map((y, i) => {
        const g = S('g', { opacity: 0 });
        g.appendChild(S('line', { x1: c.x(y), x2: c.x(y), y1: c.y(coef[i] - 1.96 * se), y2: c.y(coef[i] + 1.96 * se), stroke: color, 'stroke-width': 2 }));
        g.appendChild(S('circle', { cx: c.x(y), cy: c.y(coef[i]), r: 5, fill: color, stroke: 'var(--paper)', 'stroke-width': 1.5 }));
        c.g.appendChild(g); return g;
      });
      return { svg: c.svg, reveal: (animate) => items.forEach((g, i) => setTimeout(() => g.setAttribute('opacity', 1), (animate && !L.reduced()) ? 120 * i : 0)) };
    }

    CH['event-studies'] = (el, o) => {
      const R = P.reform;
      const a = eventStudy(540, 300, R.years, R.share, R.shareSE, [-0.03, 0.03], v => (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(0) + ' pts', 'lower-income share, points, relative to 2003', 'var(--anna)', [-0.02, -0.01, 0, 0.01, 0.02]);
      const b = eventStudy(540, 300, R.years, R.price, R.priceSE, [-0.1, 0.25], v => (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(0) + '%', 'log price, relative to 2003', 'var(--gain)', [-0.1, 0, 0.1, 0.2]);
      el.appendChild(E('div', { class: 'grid2' }, [
        E('div', { class: 'panel' }, [E('span', { class: 'ph', text: 'Share of lower-income buyers in high-growth municipalities' }), a.svg]),
        E('div', { class: 'panel' }, [E('span', { class: 'ph', text: 'House prices in the same municipalities' }), b.svg]),
      ]));
      el.appendChild(cap('Stylised from the paper\'s event-study figures, which are in the appendix. High-growth municipalities are the top fifth by 1997–2002 price growth. 95% intervals. Pre-reform buyer-share coefficients are jointly indistinguishable from zero.'));
      a.reveal(o.animate); b.reveal(o.animate);
    };

    CH.auction = (el, o) => {
      const bidders = []; const r = L.rng(3);
      for (let i = 0; i < 24; i++) { const rank = 6 + i * 4; bidders.push({ id: i, rank, income: L.incomeAt(rank) * (0.9 + 0.2 * r()), wealth: L.wealthAt(rank) * (0.7 + 0.6 * r()) }); }
      const N = 8, base = L.auction(bidders, N);
      let loosened = false, elastic = false;
      const c = L.chart(1000, 330, { l: 60, r: 16, t: 30, b: 44 }, [0, 24], [0, 5e6]);
      L.axisY(c, [0, 1e6, 2e6, 3e6, 4e6, 5e6], v => (v / 1e6) + 'm', 'maximum bid, DKK');
      L.axisX(c, [0.5, 6.5, 12.5, 18.5, 23.5], v => 'rank ' + bidders[Math.floor(v)].rank, 'would-be buyers, by income rank');
      const bw = (c.x(1) - c.x(0)) * 0.72;
      const bars = bidders.map((b, i) => { const e = S('rect', { x: c.x(i) + (c.x(1) - c.x(0) - bw) / 2, width: bw, rx: 3, fill: 'var(--ink-3)' }); e.appendChild(S('title')); c.g.appendChild(e); return e; });
      const pLine = S('line', { x1: c.m.l, x2: c.W - c.m.r, stroke: 'var(--gain)', 'stroke-width': 2.5 });
      c.g.append(pLine);
      const roofs = bidders.map((b, i) => CD.roof(c.g, { x: +bars[i].getAttribute('x'), w: bw, h: 9 }));
      const sign = CD.solgt(c.g, { text: 'SOLGT', sub: '' });
      const status = E('p', { class: 'caption status' });
      const legend = E('div', { class: 'legend' });
      legend.appendChild(E('span', { style: '--c:var(--anna)', text: 'wins, bottom third' }));
      legend.appendChild(E('span', { style: '--c:var(--ink)', text: 'wins, middle third' }));
      legend.appendChild(E('span', { style: '--c:var(--bo)', text: 'wins, top third' }));
      legend.appendChild(E('span', { style: '--c:var(--paper-3)', text: 'outbid' }));
      const paint = () => {
        const res = L.auction(bidders, N, { payFactor: loosened ? 0.8 : 1, elasticity: elastic ? 1.5 : 0, basePrice: base.price });
        const byId = Object.fromEntries(res.bids.map(b => [b.id, b]));
        let marginal = null, my = -1;
        bidders.forEach((b, i) => {
          const bid = byId[b.id].bid, win = res.winners.has(b.id);
          const y = c.y(Math.min(bid, 5e6));
          bars[i].setAttribute('y', y); bars[i].setAttribute('height', c.y(0) - y);
          const fill = win ? (b.rank < 34 ? 'var(--anna)' : b.rank > 66 ? 'var(--bo)' : 'var(--ink)') : 'var(--paper-3)';
          bars[i].setAttribute('fill', fill); bars[i].setAttribute('stroke', win ? 'none' : 'var(--line)');
          bars[i].firstChild.textContent = `rank ${b.rank} · bids up to ${L.fmtDKK(bid)} · ${win ? 'wins' : 'outbid'}`;
          roofs[i].el.setAttribute('fill', fill); roofs[i].set(y, win);
          if (win && y > my) { my = y; marginal = i; }
        });
        pLine.setAttribute('y1', c.y(res.price)); pLine.setAttribute('y2', c.y(res.price));
        if (marginal !== null) { sign.set(+bars[marginal].getAttribute('x') + bw / 2, my); sign.g.setText('SOLGT', L.fmtDKK(res.price)); }
        const winners = bidders.filter(b => res.winners.has(b.id));
        status.innerHTML = `${res.homes} homes sold at <span class="num gain-t">${L.fmtDKK(res.price)}</span>. Winners below rank 67: <span class="num">${winners.filter(b => b.rank <= 66).length}</span> of ${res.homes}. Lowest winning rank: <span class="num">${Math.min(...winners.map(b => b.rank))}</span>.`;
      };
      const bLoose = E('button', { class: 'btn', text: 'Loosen credit (payments −20%)' });
      bLoose.addEventListener('click', () => { loosened = !loosened; bLoose.textContent = loosened ? 'Tighten credit again' : 'Loosen credit (payments −20%)'; paint(); });
      const tEl = L.toggle('let builders respond (elastic supply)', false, 'dk-r-elastic');
      tEl.input.addEventListener('change', () => { elastic = tEl.input.checked; paint(); });
      el.append(E('div', { class: 'ctl' }, [bLoose, tEl.row, legend]), wrap(c.svg), status);
      paint();
    };

    // =====================================================================
    // 6 · You cannot put a roof in a savings account
    // =====================================================================
    CH['two-forms'] = (el) => {
      const price = 1.2e6, T = 10;
      const c = L.chart(640, 330, { l: 64, r: 20, t: 28, b: 42 }, [0, 2], [0, 1.2e6]);
      L.axisY(c, [0, 0.3e6, 0.6e6, 0.9e6, 1.2e6], v => L.fmtDKK(v).replace(' DKK', ''), 'after ten years, DKK · solid = transferable, dashed = consumed');
      const hatch = L.hatch(c.svg, 'h-w', 'var(--yield)');
      const grp = (i, name, color) => {
        const x = c.x(i + 0.5), w = 160;
        const solid = S('rect', { x: x - w / 2, width: w, fill: 'var(--gain)', class: 'brick' });
        const hat = S('rect', { x: x - w / 2, width: w, fill: hatch, stroke: 'var(--yield)' });
        const ghost = S('rect', { x: x - w / 2, width: w, fill: 'none', stroke: 'var(--yield)', 'stroke-dasharray': '5 4', 'stroke-width': 1.5 });
        const gl = S('text', { x, 'text-anchor': 'middle', class: 'lbl', fill: 'var(--yield)' });
        const lbl = S('text', { x, y: c.H - c.m.b + 24, 'text-anchor': 'middle', class: 'lbl-big', fill: color, text: name });
        const v1 = S('text', { x, 'text-anchor': 'middle', class: 'lbl onbar', fill: 'var(--paper)' });
        const v2 = S('text', { x, 'text-anchor': 'middle', class: 'lbl' });
        c.g.append(ghost, solid, hat, lbl, v1, v2, gl); return { solid, hat, v1, v2, ghost, gl };
      };
      const A = grp(0, 'Anna', 'var(--anna)'), B = grp(1, 'Bo', 'var(--bo)');
      const sl = L.slider('share of the rental yield each saves', 0, 60, 0, 5, v => v + '%', 'dk-w-save');
      const total = L.total(50);
      const upd = () => {
        const s = +sl.input.value / 100;
        const draw = (g, cg, y) => {
          const gains = price * (Math.exp(cg / 100 * T) - 1);
          const yieldAll = price * y / 100 * T, saved = yieldAll * s, lived = yieldAll - saved;
          g.ghost.setAttribute('y', c.y(gains + saved + lived)); g.ghost.setAttribute('height', c.y(0) - c.y(lived));
          g.gl.setAttribute('y', c.y(gains + saved + lived / 2) + 4); g.gl.textContent = lived > 1000 ? 'yield, lived in: ' + L.fmtDKK(lived) : '';
          g.solid.setAttribute('y', c.y(gains)); g.solid.setAttribute('height', c.y(0) - c.y(gains));
          g.hat.setAttribute('y', c.y(gains + saved)); g.hat.setAttribute('height', c.y(0) - c.y(saved));
          g.v1.setAttribute('y', c.y(gains / 2) + 4); g.v1.textContent = 'capital gain ' + L.fmtDKK(gains);
          g.v2.setAttribute('y', c.y(gains + saved) - 6); g.v2.textContent = saved > 1000 ? 'saved rent ' + L.fmtDKK(saved) : '';
        };
        draw(A, L.cg(10), total - L.cg(10)); draw(B, L.cg(90), total - L.cg(90));
      };
      sl.input.addEventListener('input', upd); upd();
      el.append(wrap(c.svg), sl.row, cap(`A ${L.fmtDKK(price)} home and the same total return for both by construction, split using the paper's slopes. Even if both saved half their yield, which means living in far less home, Bo's pile is larger.`));
    };

    // Housing's contribution to the P90–P10 gap in the return to total wealth (paper's appendix table)
    CH.portfolio = (el) => {
      const DATA = {
        DK: { label: 'Danish portfolio shares, 2014–19', housing: 1.18, financial: 0.41, pension: -0.60, total: 0.99 },
        US: { label: 'US SCF 2013 shares', housing: 1.44, financial: 0.64, pension: 0.80, total: 2.88 },
      };
      let cur = 'DK';
      const chips = E('div', { class: 'ctl' });
      for (const k of Object.keys(DATA)) chips.appendChild(chip(DATA[k].label, k === cur, () => { cur = k; paint(); }));
      const W = 640, H = 270, x0 = 250, sc = 100, y0 = 24, rowH = 48;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const ax = S('g', { class: 'axis' });
      for (const t of [-1, 0, 1, 2, 3]) {
        ax.appendChild(S('line', { class: 'grid', x1: x0 + t * sc, x2: x0 + t * sc, y1: y0 - 6, y2: y0 + 4 * rowH, stroke: t === 0 ? 'var(--ink-3)' : 'var(--paper-3)' }));
        ax.appendChild(S('text', { x: x0 + t * sc, y: y0 + 4 * rowH + 16, 'text-anchor': 'middle', text: (t > 0 ? '+' : '') + t + ' pp' }));
      }
      svg.appendChild(ax);
      const rows = ['housing', 'financial', 'pension', 'total'].map((k, i) => {
        const y = y0 + i * rowH;
        svg.appendChild(S('text', { x: 20, y: y + rowH / 2 + 5, class: 'lbl', text: k === 'total' ? 'total P90–P10 gap' : k, fill: k === 'total' ? 'var(--ink)' : 'var(--ink-2)' }));
        const bar = S('rect', { y: y + 9, height: rowH - 18, rx: 3, fill: k === 'housing' ? 'var(--gain)' : k === 'total' ? 'var(--ink)' : 'var(--ink-3)' });
        if (k === 'housing') bar.setAttribute('class', 'brick');
        const v = S('text', { y: y + rowH / 2 + 5, class: 'lbl-mono' });
        svg.append(bar, v); return { bar, v };
      });
      const paint = () => {
        const d = DATA[cur];
        ['housing', 'financial', 'pension', 'total'].forEach((k, i) => {
          const v = d[k], w = Math.abs(v) * sc;
          rows[i].bar.setAttribute('x', v >= 0 ? x0 : x0 - w); rows[i].bar.setAttribute('width', w);
          rows[i].v.setAttribute('x', v >= 0 ? x0 + w + 8 : x0 - w - 8); rows[i].v.setAttribute('text-anchor', v >= 0 ? 'start' : 'end');
          rows[i].v.textContent = L.fmtPP(v).replace(' points', '');
        });
        press(chips, (c) => c.textContent === d.label);
      };
      paint();
      el.append(chips, wrap(svg), cap('Contribution of asset <em>a</em> = share<sub>P90</sub>·return<sub>P90</sub> − share<sub>P10</sub>·return<sub>P10</sub>, percentage points a year, passive financial-return calibration. Housing is the largest single contributor under both sets of shares. Table in the paper\'s appendix.'));
    };

    // Housing's contribution to the P90–P10 wealth-return gap under the three
    // housing-return measures (paper Table "Housing and the P90–P10 gap").
    // The point of the toggle: the within term collapses to zero under the
    // additive measure, yet housing's contribution barely moves, because the
    // portfolio-share gap carries it.
    CH['decomp-measures'] = (el) => {
      const M = [
        { k: 'cg',  label: 'Capital gains only', r: [2.92, 4.28], comp: 0.51, within: 0.43, inter: 0.24, house: 1.18, total: 0.99 },
        { k: 'add', label: 'Additive total',     r: [7.60, 7.60], comp: 1.32, within: 0.00, inter: 0.00, house: 1.32, total: 1.14 },
        { k: 'irr', label: 'IRR total',          r: [8.84, 6.36], comp: 1.54, within: -0.79, inter: -0.43, house: 0.32, total: 0.13 },
      ];
      let cur = 'add';
      const chips = E('div', { class: 'ctl' });
      M.forEach((m) => { const b = chip(m.label, m.k === cur, () => { cur = m.k; paint(); }); b.dataset.k = m.k; chips.appendChild(b); });

      const W = 660, H = 300, x0 = 210, sc = 86, y0 = 30, rowH = 46;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const ax = S('g', { class: 'axis' });
      for (const t of [-1, 0, 1, 2]) {
        ax.appendChild(S('line', { class: 'grid', x1: x0 + t * sc, x2: x0 + t * sc, y1: y0 - 8, y2: y0 + 4 * rowH, stroke: t === 0 ? 'var(--ink-3)' : 'var(--paper-3)' }));
        ax.appendChild(S('text', { x: x0 + t * sc, y: y0 + 4 * rowH + 16, 'text-anchor': 'middle', text: (t > 0 ? '+' : '') + t + ' pp' }));
      }
      svg.appendChild(ax);

      const KEYS = [
        { k: 'comp',   name: 'composition',   note: 'what they hold' },
        { k: 'within', name: 'within',        note: 'what they earn' },
        { k: 'inter',  name: 'interaction',   note: '' },
        { k: 'house',  name: 'housing total', note: '' },
      ];
      const rows = KEYS.map((kd, i) => {
        const y = y0 + i * rowH, last = kd.k === 'house';
        svg.appendChild(S('text', { x: 18, y: y + rowH / 2 + 4, class: 'lbl', text: kd.name, fill: last ? 'var(--ink)' : 'var(--ink-2)' }));
        if (kd.note) svg.appendChild(S('text', { x: 18, y: y + rowH / 2 + 17, class: 'lbl', 'font-size': '11', text: kd.note, fill: 'var(--ink-3)' }));
        if (last) svg.appendChild(S('line', { x1: 18, x2: W - 20, y1: y - 3, y2: y - 3, stroke: 'var(--line)' }));
        const bar = S('rect', { y: y + 10, height: rowH - 20, rx: 3, fill: last ? 'var(--gain)' : 'var(--ink-3)' });
        if (last) bar.setAttribute('class', 'brick');
        const v = S('text', { y: y + rowH / 2 + 5, class: 'lbl-mono' });
        svg.append(bar, v);
        return { bar, v, k: kd.k };
      });
      const head = S('text', { x: 18, y: 16, class: 'lbl', fill: 'var(--ink-2)' });
      svg.appendChild(head);

      const paint = () => {
        const m = M.find((z) => z.k === cur);
        rows.forEach((r) => {
          const v = m[r.k], w = Math.abs(v) * sc;
          r.bar.setAttribute('x', v >= 0 ? x0 : x0 - w); r.bar.setAttribute('width', w);
          r.v.setAttribute('x', v >= 0 ? x0 + w + 8 : x0 - w - 8);
          r.v.setAttribute('text-anchor', v >= 0 ? 'start' : 'end');
          r.v.textContent = (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2);
        });
        head.textContent = `housing return ${m.r[0].toFixed(2)}% at P10, ${m.r[1].toFixed(2)}% at P90 · P90−P10 gap in wealth returns ${m.total.toFixed(2)} pp`;
        press(chips, (b) => b.dataset.k === cur);
      };
      paint();
      el.append(chips, wrap(svg), cap('Housing\'s contribution to the P90−P10 gap in the return on gross assets, decomposed into composition, within and interaction terms. Under the additive measure the within term is zero by construction and housing still contributes 1.32 pp, because the housing share of gross assets rises from 0.32 at P10 to 0.49 at P90. Danish portfolio shares, 2014−19.'));
    };

    // The saving offset λ: how much of the capital-gain gap low-income buyers
    // would have to claw back through active saving for wealth to keep pace.
    // λ = −ΔS^A / Δ(gH); λ=0 no offset, λ=1 complete compensation.
    CH['lambda'] = (el) => {
      const price = 1.2e6, T = 10;
      const gapAnnual = (L.cg(90) - L.cg(10)) / 100;          // capital-gain gap, per year
      const gapKr = price * (Math.exp(gapAnnual * T) - 1);     // ten-year gap in kroner on the same home
      const c = L.chart(620, 300, { l: 70, r: 20, t: 24, b: 40 }, [0, 2], [0, 260000]);
      L.axisY(c, [0, 65000, 130000, 195000, 260000], (v) => Math.round(v / 1000) + 'k', 'ten-year gap in housing wealth, DKK');
      const hatch = L.hatch(c.svg, 'h-lam', 'var(--yield)');
      const barW = 150;
      const mk = (i, fill, cls) => {
        const r = S('rect', { x: c.x(i + 0.5) - barW / 2, width: barW, fill });
        if (cls) r.setAttribute('class', cls);
        c.g.appendChild(r); return r;
      };
      const gapBar = mk(0, 'var(--gain)', 'brick');
      const offset = mk(1, hatch); offset.setAttribute('stroke', 'var(--yield)');
      const resid = mk(1, 'var(--gain)', 'brick');
      [['the gap', 0], ['after saving', 1]].forEach(([t, i]) =>
        c.g.appendChild(S('text', { x: c.x(i + 0.5), y: c.H - c.m.b + 24, 'text-anchor': 'middle', class: 'lbl-big', text: t })));
      const vGap = S('text', { x: c.x(0.5), 'text-anchor': 'middle', class: 'lbl onbar', fill: 'var(--paper)' });
      const vRes = S('text', { x: c.x(1.5), 'text-anchor': 'middle', class: 'lbl' });
      c.g.append(vGap, vRes);
      const sl = L.slider('saving offset λ', 0, 1, 0, 0.05, (v) => v.toFixed(2), 'dk-lambda');
      const upd = () => {
        const lam = +sl.input.value, left = gapKr * (1 - lam);
        gapBar.setAttribute('y', c.y(gapKr)); gapBar.setAttribute('height', c.y(0) - c.y(gapKr));
        resid.setAttribute('y', c.y(left)); resid.setAttribute('height', c.y(0) - c.y(left));
        offset.setAttribute('y', c.y(gapKr)); offset.setAttribute('height', c.y(0) - c.y(gapKr - left));
        vGap.setAttribute('y', c.y(gapKr / 2) + 4); vGap.textContent = L.fmtDKK(gapKr);
        vRes.setAttribute('y', c.y(Math.max(left, gapKr * 0.06)) - 8);
        vRes.textContent = lam <= 0 ? 'nothing offset' : lam >= 1 ? 'fully offset'
          : L.fmtDKK(left) + ' remains · ' + L.fmtDKK(gapKr - left) + ' saved';
      };
      sl.input.addEventListener('input', upd); upd();
      el.append(wrap(c.svg), sl.row, cap('λ = −ΔS<sup>A</sup>/Δ(gH). At λ = 0 the whole capital-gain gap stays on the balance sheet. At λ = 1 the lower-income household saves enough elsewhere to erase it. The paper defines λ but does not estimate it. Illustrative, on a 1.2m DKK home held ten years at the paper\'s capital-gain slope.'));
    };

    CH.learned = (el) => {
      const j = CD.roofAndCoin(260); j.style.cssText = 'flex:1 1 auto;min-height:0;width:auto;max-width:100%;align-self:center';
      el.append(j, cap('You cannot put a roof in a savings account.'));
      el.querySelector('.caption').style.textAlign = 'center';
    };

    // =====================================================================
    // Appendix
    // =====================================================================
    CH['risk-strip'] = (el) => {
      const M = [
        { k: 'std', label: 'volatility', unit: 'std. dev. of annual price growth', fmt: v => v.toFixed(2) },
        { k: 'beta', label: 'beta to national market', unit: 'beta', fmt: v => v.toFixed(2) },
        { k: 'negCount', label: 'years of falling prices', unit: 'count', fmt: v => v.toFixed(1) },
        { k: 'negDepth', label: 'how far they fall', unit: 'average fall when negative', fmt: v => (v * 100).toFixed(0) + '%' },
        { k: 'salesTime', label: 'time to sell', unit: 'days on market', fmt: v => v.toFixed(0) },
        { k: 'covInc', label: 'moves with local income', unit: 'covariance', fmt: v => v.toFixed(3) },
        { k: 'covCons', label: 'moves with consumption', unit: 'covariance', fmt: v => v.toFixed(3) },
        { k: 'sharpe', label: 'return per unit of risk', unit: 'Sharpe-type ratio', fmt: v => v.toFixed(3) },
      ];
      const chips = E('div', { class: 'ctl' });
      let cur = 'std';
      const c = L.chart(640, 300, { l: 64, r: 20, t: 30, b: 44 }, [0.5, 10.5], [0, 1]);
      L.axisX(c, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], v => 'd' + v, 'income decile of the buyer');
      const gy = S('g'); c.g.appendChild(gy);
      const dots = [], line = S('path', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 });
      c.g.appendChild(line);
      for (let i = 0; i < 10; i++) { const d = S('circle', { cx: c.x(i + 1), r: 6, fill: 'var(--ink)' }); d.appendChild(S('title')); c.g.appendChild(d); dots.push(d); }
      const title = S('text', { x: c.m.l, y: c.m.t - 10, class: 'lbl' }); c.g.appendChild(title);
      const paint = () => {
        const m = M.find(x => x.k === cur), arr = P.risk[cur];
        const lo = Math.min(...arr), hi = Math.max(...arr), mid = (lo + hi) / 2;
        const span = Math.max(Math.abs(mid) * 0.5, (hi - lo) * 1.6, 1e-6); // axis spans ±25% of the level, so flat looks flat
        const y = L.scale(mid - span / 2, mid + span / 2, c.H - c.m.b, c.m.t);
        gy.replaceChildren();
        [mid - span / 2, mid, mid + span / 2].forEach(t => {
          gy.appendChild(S('line', { class: 'grid', x1: c.m.l, x2: c.W - c.m.r, y1: y(t), y2: y(t), stroke: 'var(--paper-3)' }));
          gy.appendChild(S('text', { x: c.m.l - 6, y: y(t) + 3.5, 'text-anchor': 'end', text: m.fmt(t), fill: 'var(--ink-2)' }));
        });
        arr.forEach((v, i) => { dots[i].setAttribute('cy', y(v)); dots[i].firstChild.textContent = `decile ${i + 1}: ${m.fmt(v)}`; });
        line.setAttribute('d', L.linePath(arr.map((v, i) => [c.x(i + 1), y(v)])));
        title.textContent = `${m.label} · ${m.unit} · axis spans ±${Math.round(span / 2 / Math.max(Math.abs(mid), 1e-9) * 100)}% of the level`;
        press(chips, (b) => b.dataset.k === cur);
      };
      M.forEach(m => { const b = chip(m.label, m.k === cur, () => { cur = m.k; paint(); }); b.dataset.k = m.k; chips.appendChild(b); });
      el.append(chips, wrap(c.svg), cap('Values from the paper\'s risk table by income decile. The vertical axis is deliberately wide so that small differences are not exaggerated. The regressions find the gradients statistically detectable but economically small.'));
      paint();
    };

    CH['repeat-sale'] = (el) => {
      const s1 = L.slider('bought for', 500000, 4000000, 1200000, 50000, L.fmtDKK, 'dk-m-p0');
      const s2 = L.slider('sold for', 500000, 6000000, 1650000, 50000, L.fmtDKK, 'dk-m-p1');
      const s3 = L.slider('years held', 1, 20, 8, 0.5, v => v + ' y', 'dk-m-T');
      const s4 = L.slider('inflation, % per year', 0, 4, 1.8, 0.1, v => v.toFixed(1) + '%', 'dk-m-inf');
      const out = E('div', { class: 'bignum' });
      const upd = () => {
        const p0 = +s1.input.value, p1 = +s2.input.value, T = +s3.input.value, inf = +s4.input.value;
        const nominal = Math.log(p1 / p0) / T * 100, real = nominal - inf;
        out.innerHTML = `${L.fmtPct(real, 2)} <small>real capital gain per year · nominal ${L.fmtPct(nominal, 2)} · total ${L.fmtPct(Math.log(p1 / p0) * 100, 0)} over ${T} years</small>`;
      };
      [s1, s2, s3, s4].forEach(s => s.input.addEventListener('input', upd)); upd();
      el.append(E('div', { class: 'panel', style: 'flex:0 0 auto;padding:18px 16px' }, [out]), s1.row, s2.row, s3.row, s4.row,
        cap('r = [ln(P<sub>sale</sub>) − ln(P<sub>buy</sub>)] / years, prices deflated by the CPI, winsorised at the 1st and 99th percentiles in the paper.'));
    };

    // =====================================================================
    // Wiring
    // =====================================================================
    const draw = (el, animate) => {
      if (el._cleanup) { try { el._cleanup(); } catch (e) { /* noop */ } el._cleanup = null; }
      el.replaceChildren();
      const fn = CH[el.dataset.chart];
      if (!fn) { el.appendChild(E('p', { class: 'caption', text: 'unknown chart: ' + el.dataset.chart })); console.error('deck-charts.js: unknown chart ' + el.dataset.chart); return; }
      try { el._cleanup = fn(el, { animate: !!animate }) || null; }
      catch (e) { console.error('deck-charts.js: ' + el.dataset.chart, e); el.appendChild(E('p', { class: 'caption', text: 'This chart failed to draw.' })); }
    };
    // the title slide gets the skyline
    const title = document.getElementById('title-slide');
    if (title && !title.querySelector('.stage')) title.appendChild(E('div', { class: 'stage skyline', 'data-chart': 'skyline', 'data-animate': '' }));

    document.querySelectorAll('.stage[data-chart]').forEach((el) => {
      el.addEventListener('pointerdown', (e) => e.stopPropagation()); // keep reveal's swipe handler off the playables
      el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) b.blur(); }); // so space and arrows keep driving the deck
      draw(el, false);
    });
    const animateIn = (section) => { if (STATIC || !section) return; section.querySelectorAll('.stage[data-animate]').forEach((el) => draw(el, true)); };
    if (window.Reveal && typeof Reveal.on === 'function') {
      Reveal.on('slidechanged', (e) => animateIn(e.currentSlide));
      if (typeof Reveal.getCurrentSlide === 'function') animateIn(Reveal.getCurrentSlide());
    }
  }

  const start = () => {
    if (window.Reveal && typeof Reveal.isReady === 'function' && Reveal.isReady()) main();
    else if (window.Reveal && typeof Reveal.on === 'function') Reveal.on('ready', main);
    else main();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
