/* lib.js — models and drawing helpers for "Where the Money Lives" */
(function () {
  const L = {};

  // ---------- numbers ----------
  L.fmtPct = (x, d = 1) => (x >= 0 ? '' : '−') + Math.abs(x).toFixed(d) + '%';
  L.fmtPP = (x, d = 2) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d) + ' points';
  L.fmtDKK = (x) => {
    if (Math.abs(x) >= 1e6) return (x / 1e6).toFixed(2).replace(/\.?0+$/, '') + ' m DKK';
    if (Math.abs(x) >= 1e3) return Math.round(x / 1e3).toLocaleString('en') + ' k DKK';
    return Math.round(x).toLocaleString('en') + ' DKK';
  };
  L.fmtInt = (x) => Math.round(x).toLocaleString('en');
  L.clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  L.lerp = (a, b, t) => a + (b - a) * t;

  // Seeded RNG (mulberry32) so the "data" is stable across visits
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

  // ---------- the paper's numbers ----------
  // Slopes are the paper's estimates. Levels are stylised around sample means.
  L.PAPER = {
    slopeCG: 0.017,        // pp of annualized real capital gain per income-rank point (baseline)
    meanCG: 3.6,           // % per year, sample mean annualized real capital gain
    meanRank: 60,          // buyers are concentrated high in the population distribution
    slopeYield: -0.016,    // pp per rank point (additive measure; offsets the CG slope)
    meanYield: 5.0,        // illustrative level
    specs: [
      { key: 'base', label: 'Nothing (baseline)', beta: 0.017, se: 0.003 },
      { key: 'prop', label: 'Property traits', beta: 0.017, se: 0.004 },
      { key: 'buyer', label: 'Buyer traits', beta: 0.013, se: 0.002 },
      { key: 'time', label: 'Market timing', beta: 0.011, se: 0.002 },
      { key: 'mun', label: 'Municipality', beta: 0.005, se: 0.001 },
      { key: 'post', label: 'Postcode', beta: 0.003, se: 0.001 },
      { key: 'timepost', label: 'Timing × postcode', beta: 0.001, se: 0.001 },
    ],
    gelbach: { location: 0.88, timing: 0.06, buyer: 0.05, property: 0.01 },
    urban: [ // annualized real capital gain by urbanisation, all buyers (summary statistics)
      { key: 'rural', label: 'village', cg: 2.4, price: 0.75e6, rent: 4300 },
      { key: 'country', label: 'countryside', cg: 3.0, price: 0.9e6, rent: 4800 },
      { key: 'province', label: 'provincial town', cg: 2.8, price: 1.0e6, rent: 5200 },
      { key: 'city', label: 'big city', cg: 3.7, price: 1.7e6, rent: 7000 },
      { key: 'capital', label: 'Copenhagen area', cg: 5.2, price: 2.9e6, rent: 9400 },
    ],
    choiceSet: { // share of transactions affordable = a + b·rank (Appendix, maximum-borrowing measure)
      all: { a: 0.110, b: 0.0065 },
      highGrowthSameSize: { a: -0.074, b: 0.0074 },
    },
    risk: { // by income decile, Table "Risks": [d1..d10]
      std: [0.471, 0.477, 0.476, 0.475, 0.472, 0.470, 0.467, 0.461, 0.456, 0.445],
      beta: [0.783, 0.782, 0.779, 0.780, 0.770, 0.767, 0.762, 0.754, 0.753, 0.759],
      negCount: [9.657, 9.670, 9.673, 9.666, 9.676, 9.661, 9.638, 9.625, 9.609, 9.591],
      negDepth: [-0.215, -0.209, -0.209, -0.209, -0.208, -0.210, -0.216, -0.220, -0.228, -0.237],
      salesTime: [165.3, 169.5, 169.2, 168.6, 168.3, 166.7, 164.0, 161.0, 157.7, 152.3],
      covCons: [0.007, 0.007, 0.007, 0.007, 0.007, 0.007, 0.007, 0.007, 0.007, 0.007],
      covInc: [0.002, 0.003, 0.003, 0.003, 0.003, 0.002, 0.002, 0.002, 0.002, 0.002],
      sharpe: [0.027, 0.025, 0.025, 0.024, 0.025, 0.026, 0.027, 0.029, 0.032, 0.037],
    },
    portfolio: {
      DK: { housing: [0.36, 0.48], financial: [0.17, 0.19], pension: [0.47, 0.33] },
      US: { housing: [0.19, 0.42], financial: [0.65, 0.24], pension: [0.16, 0.34] },
      returns: { housing: [2.84, 4.37], financialPassiveDK: [0.06, 2.47], financialPassiveUS: [-0.07, 2.50], pension: [4.47, 4.47] },
    },
    reform: { // event-study coefficients, share of lower-income buyers in high-growth municipalities (stylised from Fig.)
      years: [1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010],
      share: [0.002, -0.004, 0.003, -0.005, 0.001, 0, -0.002, 0.003, -0.004, 0.001, 0.002, -0.003, 0.001],
      shareSE: 0.005,
      price: [-0.02, -0.01, -0.01, 0.0, -0.01, 0, 0.05, 0.11, 0.16, 0.18, 0.16, 0.13, 0.14],
      priceSE: 0.03,
    },
  };

  L.cg = (rank) => L.PAPER.meanCG + L.PAPER.slopeCG * (rank - L.PAPER.meanRank);
  L.yieldOf = (rank) => L.PAPER.meanYield + L.PAPER.slopeYield * (rank - L.PAPER.meanRank);
  L.total = (rank) => L.cg(rank) + L.yieldOf(rank);

  // ---------- households ----------
  L.HH = {
    anna: { name: 'Anna', rank: 10, income: 125000, wealth: 300000, color: 'var(--anna)' },
    mid: { name: 'Mette', rank: 50, income: 220000, wealth: 300000, color: 'var(--ink-2)', sub: 'a buyer in the middle, rank 50' },
    bo: { name: 'Bo', rank: 90, income: 427000, wealth: 800000, color: 'var(--bo)' },
  };

  // Borrowing constraints. Returns loans and the binding rule.
  L.borrow = (income, wealth, opt = {}) => {
    const rate = opt.rate ?? 0.04, down = opt.down ?? 0.20, pti = opt.pti ?? 0.35, years = opt.years ?? 30;
    const payFactor = opt.payFactor ?? 1; // <1 when interest-only lowers monthly payments
    const ltvLoan = wealth * (1 - down) / down;
    const i = rate / 12, n = years * 12;
    const annuity = i > 0 ? (1 - Math.pow(1 + i, -n)) / i : n; // loan per unit of monthly payment
    const monthly = pti * income / 12;
    const ptiLoan = (monthly / payFactor) * annuity;
    const loan = Math.min(ltvLoan, ptiLoan);
    return { ltvLoan, ptiLoan, loan, binding: ltvLoan < ptiLoan ? 'LTV' : 'PTI', max: loan + wealth };
  };

  // Income and wealth as a function of rank (stylised, for sliders)
  L.incomeAt = (rank) => Math.round(90000 * Math.exp(0.0175 * rank) / 1000) * 1000; // 10→107k, 50→216k, 90→434k
  L.wealthAt = (rank) => Math.round((150000 + 6500 * rank) / 1000) * 1000;           // 10→215k, 90→735k

  // ---------- housing stock (synthetic, seeded) ----------
  L.homes = (() => {
    const r = L.rng(20050101);
    const out = [];
    const types = L.PAPER.urban;
    const weights = { rural: 0.20, province: 0.28, country: 0.12, city: 0.22, capital: 0.18 };
    let id = 0;
    for (const t of types) {
      const n = Math.round(320 * weights[t.key]);
      for (let k = 0; k < n; k++) {
        const size = L.clamp(Math.round(105 + 32 * L.randn(r)), 40, 220);
        const pricePerM2 = t.price / 105 * Math.exp(0.42 * L.randn(r));
        const price = Math.round(pricePerM2 * size / 10000) * 10000;
        out.push({ id: id++, type: t.key, size, price, cg: t.cg + 0.6 * L.randn(r), x: r() });
      }
    }
    return out;
  })();

  L.HIGH_GROWTH = new Set(['capital', 'city']);

  // Share of homes a household could buy, with filters
  L.feasibleShare = (maxPrice, { minSize = 0, highGrowth = false } = {}) => {
    let n = 0, ok = 0;
    for (const h of L.homes) {
      if (highGrowth && !L.HIGH_GROWTH.has(h.type)) continue;
      if (h.size < minSize) continue;
      n++;
      if (h.price <= maxPrice) ok++;
    }
    return n ? ok / n : 0;
  };

  // ---------- the auction ----------
  // nHomes homes in a high-growth town; bidders with ranks; each bids up to their ceiling.
  L.auction = (bidders, nHomes, { payFactor = 1, elasticity = 0, basePrice } = {}) => {
    const bids = bidders.map(b => ({ ...b, bid: L.borrow(b.income, b.wealth, { payFactor }).max }))
      .sort((a, b) => b.bid - a.bid);
    // supply responds to price if elastic: homes = nHomes * (p/p0)^elasticity, solved by iteration
    let homes = nHomes;
    let price = bids[Math.min(nHomes, bids.length) - 1].bid;
    if (elasticity > 0 && basePrice) {
      for (let it = 0; it < 30; it++) {
        homes = Math.round(nHomes * Math.pow(price / basePrice, elasticity));
        homes = L.clamp(homes, 1, bids.length);
        const p2 = bids[homes - 1].bid;
        if (Math.abs(p2 - price) < 1) break;
        price = (price + p2) / 2;
      }
      price = bids[homes - 1].bid;
    }
    const winners = new Set(bids.slice(0, homes).map(b => b.id));
    return { bids, winners, price, homes };
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

  // Linear scale
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

  // House glyph (one continuous line). Returns an <svg> element.
  L.house = (color, size = 48, opts = {}) => {
    const s = L.svg('svg', { viewBox: '0 0 48 48', width: size, height: size, class: 'house' });
    s.appendChild(L.svg('path', {
      d: 'M6 24 L24 8 L42 24 M10 21 V42 H38 V21',
      fill: opts.fill ? color : 'none', 'fill-opacity': opts.fill ? 0.18 : 0,
      stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    }));
    if (opts.face !== false) {
      s.appendChild(L.svg('circle', { cx: 18.5, cy: 29, r: 1.8, fill: color }));
      s.appendChild(L.svg('circle', { cx: 29.5, cy: 29, r: 1.8, fill: color }));
      s.appendChild(L.svg('path', { d: opts.mood === 'flat' ? 'M19 35 H29' : 'M19 34 Q24 38 29 34', fill: 'none', stroke: color, 'stroke-width': 2.2, 'stroke-linecap': 'round' }));
    }
    // door
    s.appendChild(L.svg('path', { d: 'M21 42 V36 H27 V42', fill: 'none', stroke: color, 'stroke-width': 2 }));
    return s;
  };

  // Hatch pattern for "rental yield" fills. Call once per svg.
  L.hatch = (svg, id, color) => {
    const defs = L.svg('defs');
    const p = L.svg('pattern', { id, width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    p.appendChild(L.svg('rect', { width: 6, height: 6, fill: color, 'fill-opacity': 0.18 }));
    p.appendChild(L.svg('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: color, 'stroke-width': 2 }));
    defs.appendChild(p);
    svg.insertBefore(defs, svg.firstChild);
    return `url(#${id})`;
  };

  // Simple slider row: returns {row, input, out}
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

  // Ease for tweens
  L.tween = (from, to, ms, fn, done) => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { fn(to); done && done(); return; }
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
