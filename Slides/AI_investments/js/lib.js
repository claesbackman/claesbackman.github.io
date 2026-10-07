/* lib.js — drawing helpers and the deck's numbers.
 *
 * L.DATA is the single home of every number a chart draws. Fill it from the
 * source's tables and say in each entry where the number comes from. Charts
 * read L.DATA; prose on the slides is transcribed from the same tables. When a
 * source number changes, change it here and grep index.qmd for the old value.
 *
 * If an explorable already exists for this topic, replace L.DATA with its data
 * object (and copy its model functions) so the two never disagree.
 */
(function () {
  const L = {};

  // ---------- numbers ----------
  L.fmtPct = (x, d = 1) => (x >= 0 ? '' : '−') + Math.abs(x).toFixed(d) + '%';
  L.fmtPP = (x, d = 2) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d) + ' points';
  L.fmtInt = (x) => Math.round(x).toLocaleString('en');
  L.fmtNum = (x, d = 2) => (x >= 0 ? '' : '−') + Math.abs(x).toFixed(d);
  L.clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  // Read a dotted path from L.DATA: L.get('specs.0.beta')
  L.get = (path, obj) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj || L.DATA);
  // A tick step giving about n ticks over a range, at 1, 2 or 5 × a power of ten
  L.niceStep = (range, n = 5) => { const raw = Math.abs(range) / n || 1, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
  L.lerp = (a, b, t) => a + (b - a) * t;

  // Seeded RNG (mulberry32) so stylised dots are identical on every render
  L.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  L.randn = (r) => {
    let u = 0, v = 0;
    while (u === 0) u = r();
    while (v === 0) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  // ---------- the source's numbers ----------
  // Every number a chart draws. Sources:
  //   application  = Bäckman and Schirmer, application to the House of Finance Stiftung (Grants/Bäckman_Schirmer_Application.pdf)
  //   pilot        = Bonn pre-pilot survey, 14 September 2026, n = 104 (Pilot/AI Inv _ Results Prepilot Bonn.txt)
  //   plan         = Grants/HoF_2026_proposal_plan.md, section 3.8 (power formula only; not in the application)
  //   stylised     = drawn by us to show the shape of a claim, with no measured level behind it
  L.DATA = {
    // pilot: shares in percent
    pilot: {
      n: 104,
      weeklyAI: 67.3,      // C1, 70 of 104 use an AI chatbot at least weekly
      finQuestion: 57.7,   // D1, 60 of 104 asked an AI chatbot a financial question in the past three months
      tradeRepublic: 31.7, // A6, 32 of 101 students hold a Trade Republic account
      labWilling: 53.1,    // F1 among TR holders, 17 of 32
      joint: 16.8,         // TR account and willing to come to the lab, 17 of 101
      depot: 49.0,         // B1, 51 of 104 hold a securities account
      bars: [
        { label: 'use an AI chatbot at least weekly', v: 67.3 },
        { label: 'asked one a financial question in the past three months', v: 57.7 },
        { label: 'hold a Trade Republic account', v: 31.7 },
      ],
    },
    // application: design constants
    design: { participants: 300, arms: 3, euros: 100, followUpMonths: 6, equityMenu: 20, bondMenu: 10 },
    // application: budget table, EUR, year 1 (May 2027 to April 2028)
    budget: {
      total: 47600,
      items: [
        { label: 'Study investments, 100 EUR × 300 participants', v: 30000, pay: true },
        { label: 'Show-up fees and accuracy bonuses, 25 EUR × 300', v: 7500, pay: true },
        { label: 'Six-month follow-up and portfolio upload, 12 EUR × 300', v: 3600, pay: true },
        { label: 'Laboratory fees and session assistants', v: 4000 },
        { label: 'Conference presentations', v: 1500 },
        { label: 'Contingency', v: 1000 },
      ],
    },
    // plan: power formula. MDE = sqrt(k (1/n1 + 1/n2)) standard deviations, two-sided 5%, 80% power.
    // ANCOVA on a baseline measure with pre-post correlation about 0.7 scales the MDE by `ancova`.
    power: { k: 15.7, ancova: 0.7, retention: 0.6 },
    // stylised: the shape of the decay claim (Fernandes, Lynch and Netemeyer 2014: effects fade within about two years)
    decay: { halfLifeMonths: 6, horizonMonths: 48, decisionMonth: 36 },
    // stylised: the pre-registered hypotheses drawn as shapes. Units are arbitrary; no level is measured.
    hyp: {
      quality: [ { who: 'Mia', arm: 'control', v: 0.42 }, { who: 'Lena', arm: 'tutor', v: 0.64 }, { who: 'Jonas', arm: 'advisor', v: 0.82 } ],
      months: [0, 1, 2, 3, 4, 5, 6],
      knowledge: {
        tutor:   [1.00, 0.96, 0.93, 0.91, 0.89, 0.88, 0.87],
        advisor: [0.50, 0.38, 0.30, 0.24, 0.20, 0.17, 0.15],
      },
    },
  };

  // ---------- SVG helpers ----------
  const NS = 'http://www.w3.org/2000/svg';
  L.svg = (tag, attrs = {}, children = []) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined) continue;
      if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v);
    }
    for (const c of children) if (c) el.appendChild(c);
    return el;
  };
  L.el = (tag, attrs = {}, children = []) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    for (const c of children) if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    return el;
  };

  // Linear scale with invert
  L.scale = (d0, d1, r0, r1) => {
    const f = (x) => r0 + (x - d0) / (d1 - d0) * (r1 - r0);
    f.invert = (y) => d0 + (y - r0) / (r1 - r0) * (d1 - d0);
    f.domain = [d0, d1]; f.range = [r0, r1];
    return f;
  };

  // A chart frame. Returns {svg, g, x, y, W, H, m}
  L.chart = (W, H, m, xd, yd) => {
    const svg = L.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img' });
    const x = L.scale(xd[0], xd[1], m.l, W - m.r);
    const y = L.scale(yd[0], yd[1], H - m.b, m.t);
    const g = L.svg('g');
    svg.appendChild(g);
    return { svg, g, x, y, W, H, m };
  };
  L.axisX = (c, ticks, fmt = (v) => v, label) => {
    const g = L.svg('g', { class: 'axis' });
    g.appendChild(L.svg('line', { x1: c.m.l, x2: c.W - c.m.r, y1: c.H - c.m.b, y2: c.H - c.m.b }));
    for (const t of ticks) {
      g.appendChild(L.svg('line', { x1: c.x(t), x2: c.x(t), y1: c.H - c.m.b, y2: c.H - c.m.b + 4 }));
      g.appendChild(L.svg('text', { x: c.x(t), y: c.H - c.m.b + 16, 'text-anchor': 'middle', text: fmt(t) }));
    }
    if (label) g.appendChild(L.svg('text', { x: (c.m.l + c.W - c.m.r) / 2, y: c.H - 4, 'text-anchor': 'middle', class: 'axis-label', text: label }));
    c.g.appendChild(g);
  };
  L.axisY = (c, ticks, fmt = (v) => v, label, grid = true) => {
    const g = L.svg('g', { class: 'axis' });
    for (const t of ticks) {
      if (grid) g.appendChild(L.svg('line', { class: 'grid', x1: c.m.l, x2: c.W - c.m.r, y1: c.y(t), y2: c.y(t) }));
      g.appendChild(L.svg('text', { x: c.m.l - 6, y: c.y(t) + 3.5, 'text-anchor': 'end', text: fmt(t) }));
    }
    if (label) g.appendChild(L.svg('text', { x: c.m.l, y: c.m.t - 8, 'text-anchor': 'start', class: 'axis-label', text: label }));
    c.g.appendChild(g);
  };
  L.linePath = (pts) => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');

  // Hatch pattern, the second visual channel. Call once per svg; returns "url(#id)".
  L.hatch = (svg, id, color) => {
    const defs = L.svg('defs');
    const p = L.svg('pattern', { id, width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    p.appendChild(L.svg('rect', { width: 6, height: 6, fill: color, 'fill-opacity': 0.18 }));
    p.appendChild(L.svg('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: color, 'stroke-width': 2 }));
    defs.appendChild(p);
    svg.insertBefore(defs, svg.firstChild);
    return `url(#${id})`;
  };

  // Slider row: returns {row, input, out}
  L.slider = (label, min, max, value, step, fmt, id) => {
    const input = L.el('input', { type: 'range', min, max, value, step, id });
    const out = L.el('output', { text: fmt(value), for: id });
    const row = L.el('label', { class: 'slider', for: id }, [L.el('span', { class: 'slider-label', text: label }), input, out]);
    input.addEventListener('input', () => { out.textContent = fmt(+input.value); });
    return { row, input, out };
  };

  L.toggle = (label, checked, id) => {
    const input = L.el('input', { type: 'checkbox', id });
    if (checked) input.checked = true;
    const row = L.el('label', { class: 'toggle', for: id }, [input, L.el('span', { class: 'toggle-track' }), L.el('span', { text: label })]);
    return { row, input };
  };

  L.reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Eased tween; jumps to the end under reduced motion
  L.tween = (from, to, ms, fn, done) => {
    if (L.reduced()) { fn(to); done && done(); return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = L.clamp((t - t0) / ms, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      fn(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step); else done && done();
    };
    requestAnimationFrame(step);
  };

  window.LIB = L;
})();
