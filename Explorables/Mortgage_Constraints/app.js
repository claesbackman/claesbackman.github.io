/* Interactives for the one-page companion to DRAFT7.tex. Plain JS, no dependencies. */
(function () {
  'use strict';
  const D = window.PAPER_DATA;
  // Screenshot mode (?shot): no smooth scroll. ?dark forces the dark theme. ?demo puts the interactives in non-default states.
  const Q = location.search;
  if (Q.includes('shot')) document.documentElement.style.scrollBehavior = 'auto';
  if (Q.includes('dark')) document.documentElement.setAttribute('data-theme', 'dark');
  const DEMO = Q.includes('demo');
  const NS = 'http://www.w3.org/2000/svg';
  const C = { blue: '#2a78d6', blueLight: '#9ec5f4', orange: '#eb6834', green: '#2f8f6b', plum: '#8a5cc9', amber: '#e0a030', slate: '#5b6b85', red: '#d9573b' };
  const SEQ = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'];

  // ---------- helpers ----------
  const $ = (s, el) => (el || document).querySelector(s);
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const k in attrs || {}) { if (k === 'class') el.className = attrs[k]; else if (k.startsWith('on')) el.addEventListener(k.slice(2), attrs[k]); else el.setAttribute(k, attrs[k]); }
    kids.flat().forEach(k => { if (k == null) return; el.appendChild(k instanceof Node ? k : document.createTextNode(String(k))); });
    return el;
  }
  function s(tag, attrs, ...kids) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs || {}) el.setAttribute(k, attrs[k]);
    kids.flat().forEach(k => { if (k == null) return; el.appendChild(k instanceof Node ? k : document.createTextNode(String(k))); });
    return el;
  }
  const fmt = (x, d) => (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
  const minus = x => String(x).replace('-', '−');
  function tipFor(stage) {
    const t = h('div', { class: 'tip' }); stage.appendChild(t);
    return {
      show(ev, html) {
        t.innerHTML = html; t.classList.add('on');
        const b = stage.getBoundingClientRect();
        let x = ev.clientX - b.left + 14, y = ev.clientY - b.top + 14;
        if (x > b.width - 270) x = Math.max(4, ev.clientX - b.left - 274);
        if (y > b.height - 90) y = ev.clientY - b.top - 90;
        t.style.left = x + 'px'; t.style.top = y + 'px';
      },
      hide() { t.classList.remove('on'); }
    };
  }
  function slider(label, { min, max, step, value, fmtv, oninput }) {
    const inp = h('input', { type: 'range', min, max, step, value });
    const val = h('span', { class: 'val' }, fmtv(value));
    inp.addEventListener('input', () => { val.textContent = fmtv(+inp.value); oninput(+inp.value); });
    const wrap = h('div', { class: 'ctl' }, h('label', {}, label), inp, val);
    wrap.set = v => { inp.value = v; val.textContent = fmtv(v); };
    return wrap;
  }
  function seg(options, value, onchange) {
    const w = h('div', { class: 'seg' });
    options.forEach(([v, l]) => {
      const b = h('button', { type: 'button', class: v === value ? 'on' : '' }, l);
      b.addEventListener('click', () => { [...w.children].forEach(c => c.classList.remove('on')); b.classList.add('on'); onchange(v); });
      w.appendChild(b);
    });
    return w;
  }
  function check(label, checked, onchange) {
    const i = h('input', { type: 'checkbox' }); i.checked = checked;
    i.addEventListener('change', () => onchange(i.checked));
    return h('label', { class: 'chk' }, i, label);
  }
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  // ---------- chrome: nav, progress, theme ----------
  (function chrome() {
    if (!$('#nav')) return; // page without the site chrome
    const prog = $('#progress');
    const links = [...$('#nav').querySelectorAll('a')];
    const secs = links.map(a => $(a.getAttribute('href')));
    function onScroll() {
      const sc = window.scrollY, hgt = document.documentElement.scrollHeight - innerHeight;
      prog.style.width = (100 * sc / hgt) + '%';
      let cur = -1; secs.forEach((el, i) => { if (el && el.getBoundingClientRect().top <= 120) cur = i; });
      links.forEach((a, i) => a.classList.toggle('on', i === cur));
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    const btn = $('#themeBtn'), root = document.documentElement;
    let saved = null; try { saved = localStorage.getItem('theme'); } catch (e) { }
    if (saved) root.setAttribute('data-theme', saved);
    btn.addEventListener('click', () => {
      const dark = root.getAttribute('data-theme') === 'dark' || (!root.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
      const next = dark ? 'light' : 'dark'; root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { }
      document.dispatchEvent(new Event('themechange'));
    });
  })();

  // ---------- equation tabs ----------
  (function equation() {
    if (!$('#eq')) return;
    const eq = $('#eq');
    eq.querySelectorAll('.term').forEach(t => t.addEventListener('click', () => {
      eq.querySelectorAll('.term').forEach(x => x.classList.toggle('on', x === t));
      eq.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x.dataset.t === t.dataset.t));
    }));
  })();

  // ---------- 1. which limit binds ----------
  (function bind() {
    if (!$('#bindCtl')) return;
    const st = { price: 400, income: 70, savings: 40, rate: 4, T: 30, ltv: 85, lti: 4.5, dsti: 35, shockP: DEMO, shockR: false, shockY: false };
    const ctl = $('#bindCtl'), stage = $('#bindStage');
    const W = 760, H = 230;
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Maximum mortgage under each rule' });
    stage.appendChild(svg);
    const msg = h('p', { class: 'small', style: 'margin:10px 0 0' }); stage.appendChild(msg);
    const annuity = (r, T) => r <= 0 ? 1 / T : r / (1 - Math.pow(1 + r, -T));
    function calc() {
      const P = st.price * (st.shockP ? 1.1 : 1), Y = st.income * (st.shockY ? 1.1 : 1), r = (st.rate + (st.shockR ? 1 : 0)) / 100;
      return { P, Y, r, need: P - st.savings, ltv: st.ltv / 100 * P, lti: st.lti * Y, dsti: st.dsti / 100 * Y / annuity(r, st.T) };
    }
    function draw() {
      const c = calc(); svg.innerHTML = '';
      const rows = [['LTV cap', c.ltv, `${st.ltv}% × price €${Math.round(c.P)}k`], ['LTI cap', c.lti, `${st.lti} × income €${Math.round(c.Y)}k`], ['DSTI cap', c.dsti, `${st.dsti}% of income ÷ annuity factor at ${(c.r * 100).toFixed(1)}%, ${st.T} years`]];
      const maxv = Math.max(c.need, ...rows.map(r => r[1])) * 1.12;
      const x0 = 110, x1 = W - 30, xs = v => x0 + (x1 - x0) * v / maxv;
      const binding = rows.reduce((a, b) => a[1] < b[1] ? a : b)[0];
      [0, 0.25, 0.5, 0.75, 1].forEach(f => { const v = f * maxv; svg.appendChild(s('line', { x1: xs(v), x2: xs(v), y1: 14, y2: H - 40, class: 'gridline' })); svg.appendChild(s('text', { x: xs(v), y: H - 24, 'text-anchor': 'middle' }, '€' + Math.round(v) + 'k')); });
      rows.forEach(([name, v, sub], i) => {
        const y = 24 + i * 56, isB = name === binding, ok = v >= c.need;
        svg.appendChild(s('text', { x: x0 - 10, y: y + 16, 'text-anchor': 'end', class: 'title', style: isB ? `fill:${C.red}` : '' }, name));
        svg.appendChild(s('rect', { x: x0, y, width: Math.max(0, xs(v) - x0), height: 24, rx: 4, fill: isB ? C.red : (ok ? C.blue : C.blueLight), opacity: isB ? .95 : .85 }));
        svg.appendChild(s('text', { x: xs(v) + 6, y: y + 16, class: 'title' }, '€' + Math.round(v) + 'k' + (isB ? '  binds' : '')));
        svg.appendChild(s('text', { x: x0, y: y + 38, style: 'font-size:11px' }, sub));
      });
      svg.appendChild(s('line', { x1: xs(c.need), x2: xs(c.need), y1: 10, y2: H - 40, stroke: cssVar('--ink'), 'stroke-width': 1.6, 'stroke-dasharray': '5 3' }));
      svg.appendChild(s('text', { x: xs(c.need) + 5, y: H - 46, class: 'title' }, `loan needed €${Math.round(c.need)}k`));
      const cap = Math.min(c.ltv, c.lti, c.dsti), gap = c.need - cap;
      msg.innerHTML = gap <= 0 ? `The <b>${binding}</b> is the tightest rule, but the household can borrow the €${Math.round(c.need)}k it needs. It buys as planned.`
        : `The <b>${binding}</b> binds at €${Math.round(cap)}k, which is €${Math.round(gap)}k short of what the household needs. It must find that from savings or family, buy a cheaper home, or wait.`;
    }
    const f = { k: v => '€' + v + 'k', pct: v => v + '%', x: v => v + '×', y: v => v + ' years', r: v => v + '%' };
    ctl.append(
      slider('House price', { min: 150, max: 800, step: 10, value: st.price, fmtv: f.k, oninput: v => { st.price = v; draw(); } }),
      slider('Household income', { min: 30, max: 150, step: 5, value: st.income, fmtv: f.k, oninput: v => { st.income = v; draw(); } }),
      slider('Savings', { min: 0, max: 200, step: 5, value: st.savings, fmtv: f.k, oninput: v => { st.savings = v; draw(); } }),
      slider('Mortgage rate', { min: 1, max: 8, step: 0.5, value: st.rate, fmtv: f.r, oninput: v => { st.rate = v; draw(); } }),
      slider('Maximum LTV', { min: 60, max: 100, step: 1, value: st.ltv, fmtv: f.pct, oninput: v => { st.ltv = v; draw(); } }),
      slider('Maximum LTI', { min: 3, max: 7, step: 0.25, value: st.lti, fmtv: f.x, oninput: v => { st.lti = v; draw(); } }),
      slider('Maximum DSTI', { min: 20, max: 50, step: 1, value: st.dsti, fmtv: f.pct, oninput: v => { st.dsti = v; draw(); } })
    );
    const shocks = h('div', { class: 'ctl', style: 'min-width:0' }, h('label', {}, 'Shock the environment'), h('div', { class: 'pill-row', style: 'margin:0' },
      pill('House prices +10%', () => { st.shockP = !st.shockP; draw(); return st.shockP; }, st.shockP),
      pill('Interest rate +1 pp', () => { st.shockR = !st.shockR; draw(); return st.shockR; }),
      pill('Income +10%', () => { st.shockY = !st.shockY; draw(); return st.shockY; })));
    ctl.appendChild(shocks);
    function pill(label, toggle, on) { const b = h('button', { type: 'button', class: 'pill' + (on ? ' on' : '') }, label); b.addEventListener('click', () => b.classList.toggle('on', toggle())); return b; }
    draw(); document.addEventListener('themechange', draw);
  })();

  // ---------- 2. adoption line chart ----------
  (function adoption() {
    if (!$('#adoptStage')) return;
    const stage = $('#adoptStage'), A = D.adoption, W = 520, H = 280, m = { l: 36, r: 46, t: 16, b: 34 };
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Cumulative adopters, 1990 to 2024' }); stage.appendChild(svg);
    const tip = tipFor(stage);
    const xs = y => m.l + (W - m.l - m.r) * (y - 1990) / 34, ys = v => H - m.b - (H - m.b - m.t) * v / 60;
    [0, 10, 20, 30, 40, 50, 60].forEach(v => { svg.appendChild(s('line', { x1: m.l, x2: W - m.r, y1: ys(v), y2: ys(v), class: 'gridline' })); svg.appendChild(s('text', { x: m.l - 6, y: ys(v) + 4, 'text-anchor': 'end' }, v)); });
    [1990, 1995, 2000, 2005, 2010, 2015, 2020].forEach(y => svg.appendChild(s('text', { x: xs(y), y: H - m.b + 18, 'text-anchor': 'middle' }, y)));
    const series = [['other', C.orange, 'Other economies', A.nOther], ['advanced', C.blue, 'Advanced economies', A.nAdvanced]];
    series.forEach(([k, col, lbl, n]) => {
      const d = A[k].map((v, i) => `${i ? 'L' : 'M'}${xs(1990 + i)},${ys(v)}`).join(' ');
      svg.appendChild(s('path', { d, fill: 'none', stroke: col, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }));
      const last = A[k][A[k].length - 1];
      svg.appendChild(s('text', { x: xs(2024) + 6, y: ys(last) + 4, class: 'title', style: `fill:${col}` }, last));
    });
    const lg = h('div', { class: 'legend' }, ...series.slice().reverse().map(([k, col, lbl, n]) => h('span', {}, h('i', { style: `background:${col}` }), `${lbl} (${n} in total)`)));
    stage.appendChild(lg);
    const hover = s('line', { x1: 0, x2: 0, y1: m.t, y2: H - m.b, stroke: cssVar('--ink3'), 'stroke-dasharray': '3 3', opacity: 0 }); svg.appendChild(hover);
    svg.addEventListener('mousemove', ev => {
      const b = svg.getBoundingClientRect(); const yr = Math.round(1990 + 34 * ((ev.clientX - b.left) / b.width * W - m.l) / (W - m.l - m.r));
      if (yr < 1990 || yr > 2024) { tip.hide(); hover.setAttribute('opacity', 0); return; }
      hover.setAttribute('x1', xs(yr)); hover.setAttribute('x2', xs(yr)); hover.setAttribute('opacity', 1);
      tip.show(ev, `<b>${yr}</b><br>Advanced: ${A.advanced[yr - 1990]} of ${A.nAdvanced}<br>Other: ${A.other[yr - 1990]} of ${A.nOther}`);
    });
    svg.addEventListener('mouseleave', () => { tip.hide(); hover.setAttribute('opacity', 0); });
  })();

  // ---------- 3. objectives bars ----------
  (function objectives() {
    if (!$('#objStage')) return;
    const stage = $('#objStage'), W = 520, H = 230, m = { l: 190, r: 50, t: 10, b: 30 };
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Stated objectives of mortgage constraints' }); stage.appendChild(svg);
    const xs = v => m.l + (W - m.l - m.r) * v;
    [0, .2, .4, .6, .8, 1].forEach(v => { svg.appendChild(s('line', { x1: xs(v), x2: xs(v), y1: m.t, y2: H - m.b, class: 'gridline' })); svg.appendChild(s('text', { x: xs(v), y: H - m.b + 16, 'text-anchor': 'middle' }, v.toFixed(1))); });
    const rh = (H - m.t - m.b) / D.objectives.length;
    D.objectives.forEach(([lbl, v, pct], i) => {
      const y = m.t + i * rh + rh * .2;
      svg.appendChild(s('text', { x: m.l - 8, y: y + rh * .45, 'text-anchor': 'end', style: 'font-size:12.5px' }, lbl));
      svg.appendChild(s('rect', { x: xs(0), y, width: xs(v) - xs(0), height: rh * .6, fill: C.blue, rx: 3 }));
      svg.appendChild(s('text', { x: xs(v) + 6, y: y + rh * .45, class: 'title' }, pct + '%'));
    });
  })();

  // ---------- 4. the town ----------
  (function town() {
    if (!$('#townStage')) return;
    const HH = [
      { n: 'Henrik', w: 300, y: 150, H: 600, d: 180, fam: false, pref: .5 }, { n: 'Piet', w: 250, y: 130, H: 520, d: 140, fam: false, pref: .5 },
      { n: 'Lukas', w: 200, y: 120, H: 500, d: 125, fam: false, pref: .5 }, { n: 'Chen', w: 150, y: 95, H: 450, d: 110, fam: true, pref: .5 },
      { n: 'Hanna', w: 95, y: 80, H: 330, d: 90, fam: false, pref: .55 }, { n: 'Sean', w: 110, y: 90, H: 400, d: 100, fam: false, pref: .6 },
      { n: 'Greta', w: 10, y: 45, H: 200, d: 10, fam: false, pref: .95 }, { n: 'Mia', w: 20, y: 55, H: 250, d: 15, fam: false, pref: .9 },
      { n: 'Omar', w: 14, y: 50, H: 200, d: 14, fam: false, pref: .5 }, { n: 'Priya', w: 18, y: 48, H: 210, d: 17, fam: true, pref: .7 },
      { n: 'Nora', w: 30, y: 60, H: 260, d: 23, fam: false, pref: .85 }, { n: 'Ben', w: 24, y: 52, H: 230, d: 23, fam: false, pref: .3 },
      { n: 'Sofia', w: 40, y: 55, H: 310, d: 20, fam: false, pref: .15 }, { n: 'Ida', w: 28, y: 50, H: 270, d: 30, fam: true, pref: .8 },
      { n: 'Amara', w: 52, y: 58, H: 320, d: 42, fam: false, pref: .7 }, { n: 'Jonas', w: 90, y: 70, H: 420, d: 85, fam: true, pref: .3 },
      { n: 'Elif', w: 100, y: 65, H: 400, d: 95, fam: false, pref: .5 }, { n: 'Ravi', w: 110, y: 75, H: 480, d: 100, fam: false, pref: .6 },
      { n: 'Olu', w: 120, y: 85, H: 520, d: 115, fam: false, pref: .35 }, { n: 'Yuki', w: 140, y: 110, H: 640, d: 130, fam: true, pref: .45 },
      { n: 'Lea', w: 95, y: 66, H: 410, d: 90, fam: false, pref: .4 }, { n: 'Tom', w: 50, y: 52, H: 270, d: 43, fam: false, pref: .4 },
      { n: 'Mateo', w: 55, y: 62, H: 300, d: 50, fam: false, pref: .25 }, { n: 'Aino', w: 60, y: 58, H: 320, d: 58, fam: false, pref: .2 },
    ];
    const FAM = 40, CHEAPER_MIN = 0.65, WAIT_PREF = 0.3;
    const BASE = { cap: 0.95, lti: 0, exempt: false, family: true, nExempt: 3 };
    const LABEL = { planned: 'buys as planned', drained: 'buys, savings drained', family: 'buys, family helps', cheaper: 'buys a cheaper home', waits: 'waits and rents (chose to)', shutout: 'shut out of ownership' };
    const ORDER = ['planned', 'drained', 'family', 'cheaper', 'waits', 'shutout'];
    const SCOL = { planned: C.slate, drained: C.amber, family: C.plum, cheaper: C.slate, waits: '#8a847b', shutout: C.red };
    const maxLoan = (hh, H, o) => { let M = o.cap * H; if (o.lti > 0) M = Math.min(M, o.lti * hh.y); return M; };
    function solveOne(hh, opt, exempted) {
      const o = exempted ? Object.assign({}, opt, { cap: BASE.cap, lti: 0 }) : opt;
      const H = hh.H, mStar = H - hh.d, M = maxLoan(hh, H, o), famCash = (opt.family && hh.fam) ? FAM : 0;
      const base = { home: H, maxLoan: M, planned: mStar };
      if (mStar <= M + 1e-9) return Object.assign(base, { state: 'planned', mortgage: mStar, equity: hh.d, cost: 0 });
      const E = H - M;
      if (hh.pref <= WAIT_PREF) return Object.assign(base, { state: 'waits', mortgage: 0, equity: 0, cost: 0.4 + hh.pref, needed: E });
      if (hh.w >= E) return Object.assign(base, { state: 'drained', mortgage: M, equity: E, cost: 0.5 + 2 * (E - hh.d) / hh.w });
      if (hh.w + famCash >= E) return Object.assign(base, { state: 'family', mortgage: M, equity: E, cost: 0.8 + 2 * (E - hh.d) / (hh.w + famCash) });
      const cash = hh.w + famCash; let Hp = cash / (1 - o.cap);
      if (o.lti > 0) Hp = Math.min(Hp, cash + o.lti * hh.y);
      Hp = Math.min(Hp, H);
      if (Hp >= CHEAPER_MIN * H) { const loan = maxLoan(hh, Hp, o); return Object.assign(base, { state: 'cheaper', mortgage: loan, home: Hp, equity: Hp - loan, cost: 1.5 + 4 * (1 - Hp / H) / (1 - CHEAPER_MIN) }); }
      return Object.assign(base, { state: 'shutout', mortgage: 0, equity: 0, cost: 3 + 5 * hh.pref, needed: E });
    }
    function solve(opt) {
      opt = Object.assign({}, BASE, opt);
      let res = HH.map(hh => solveOne(hh, opt, false)); const exempted = new Set();
      if (opt.exempt) {
        const con = HH.map((hh, i) => ({ i, y: hh.y, c: res[i].state !== 'planned' })).filter(x => x.c).sort((a, b) => a.y - b.y); // lowest income first, as in the Irish evidence
        con.slice(0, opt.nExempt).forEach(x => exempted.add(x.i));
        res = HH.map((hh, i) => solveOne(hh, opt, exempted.has(i)));
      }
      const base = HH.map(hh => solveOne(hh, BASE, false));
      const credit = res.reduce((a, r) => a + r.mortgage, 0), credit0 = base.reduce((a, r) => a + r.mortgage, 0);
      const counts = {}; ORDER.forEach(k => counts[k] = res.filter(r => r.state === k).length);
      return { res, exempted, credit, credit0, n: res.filter(r => r.mortgage > 0).length, counts, cost: res.reduce((a, r) => a + r.cost, 0) };
    }
    // renderer
    const stage = $('#townStage'), ctl = $('#townCtl'), countsEl = $('#townCounts'), legendEl = $('#townLegend');
    const opts = { cap: DEMO ? 0.8 : 0.95, lti: 0, instrument: 'ltv', ltiCap: 4.5, exempt: false, family: true, showCost: DEMO };
    const W = 520, Hh = 400, WALL = 40, ROOF = 16, FULL = WALL + ROOF, cols = 6, cw = 72, ch = 72, x0 = 40, y0 = 14;
    const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}` }); stage.appendChild(svg);
    const defs = s('defs'); svg.appendChild(defs); const tip = tipFor(stage);
    const houseD = (w, wh) => `M0,${ROOF} L${w / 2},0 L${w},${ROOF} L${w},${ROOF + wh} L0,${ROOF + wh} Z`;
    const rowLines = [0, 1, 2, 3].map(r => { const floor = y0 + r * ch + FULL; const l = s('line', { x1: x0 - 8, x2: x0 + cols * cw - 8, y1: floor, y2: floor, class: 'capline' }); svg.appendChild(l); return { l, floor }; });
    const capLabel = s('text', { x: x0 + cols * cw - 6, y: 0, class: 'caplabel' }); svg.appendChild(capLabel);
    const cells = HH.map((hh, i) => {
      const cx = x0 + (i % cols) * cw, floor = y0 + Math.floor(i / cols) * ch + FULL, w = 30 + 20 * Math.sqrt(hh.H / 640), id = 'clip' + i;
      const cp = s('clipPath', { id }), cpath = s('path', { d: houseD(w, WALL) }); cp.appendChild(cpath); defs.appendChild(cp);
      const g = s('g', { transform: `translate(${cx + (cw - w) / 2},${floor - FULL})` });
      const fills = s('g', { 'clip-path': `url(#${id})` });
      const bank = s('rect', { x: 0, width: w, y: FULL, height: 0, class: 'f-bank' }), sav = s('rect', { x: 0, width: w, y: FULL, height: 0, class: 'f-sav' }), fam = s('rect', { x: 0, width: w, y: FULL, height: 0, class: 'f-fam' });
      fills.append(bank, sav, fam);
      const outline = s('path', { d: houseD(w, WALL), class: 'outline' });
      const tick = s('line', { x1: -3, x2: 5, y1: FULL, y2: FULL, class: 'ltitick', opacity: 0 });
      const name = s('text', { x: w / 2, y: FULL + 12, 'text-anchor': 'middle', class: 'hname' }, hh.n);
      const costbar = s('rect', { x: w + 5, y: FULL, width: 6, height: 0, class: 'costbar', rx: 1.5 });
      const star = s('text', { x: w + 3, y: 8, class: 'star' });
      g.append(fills, outline, tick, name, costbar, star); svg.appendChild(g);
      return { g, cpath, outline, bank, sav, fam, tick, costbar, star, name, w, floor, cx };
    });
    const by = 330;
    svg.appendChild(s('text', { x: x0, y: by - 10, class: 'slabel' }, 'MORTGAGE CREDIT IN THE TOWN'));
    const ghost = s('rect', { x: x0, y: by, width: W - 2 * x0, height: 16, fill: cssVar('--bg2') }), bar = s('rect', { x: x0, y: by, width: 0, height: 16, fill: cssVar('--ink'), style: 'transition:width .3s' });
    const num = s('text', { x: x0, y: by + 32, class: 'snum' }), num2 = s('text', { x: W - x0, y: by + 32, class: 'snum', 'text-anchor': 'end' });
    const costLbl = s('text', { x: x0, y: by + 50, class: 'snum', style: `fill:${C.red}`, opacity: 0 });
    svg.append(ghost, bar, num, num2, costLbl, s('text', { x: W - 10, y: Hh - 6, class: 'stylised', 'text-anchor': 'end' }, 'stylised model'));
    let S = null;
    function paint() {
      const o = { cap: opts.instrument === 'ltv' ? opts.cap : 0.95, lti: opts.instrument === 'lti' ? opts.ltiCap : 0, exempt: opts.exempt, family: opts.family };
      S = solve(o);
      ghost.setAttribute('fill', cssVar('--bg2')); bar.setAttribute('fill', cssVar('--ink'));
      bar.setAttribute('width', (W - 2 * x0) * Math.min(1, S.credit / S.credit0));
      const dpct = 100 * (1 - S.credit / S.credit0);
      num.textContent = `€${(S.credit / 1000).toFixed(2)}m` + (Math.abs(dpct) > .05 ? `  (${dpct > 0 ? '−' : '+'}${Math.abs(dpct).toFixed(0)}% vs 95% LTV, no income cap)` : '  (baseline)');
      num2.textContent = `${S.n} of 24 have a mortgage`;
      const isLti = o.lti > 0;
      rowLines.forEach(r => { r.l.setAttribute('y1', r.floor - o.cap * FULL); r.l.setAttribute('y2', r.floor - o.cap * FULL); r.l.setAttribute('opacity', isLti ? 0 : 1); });
      capLabel.setAttribute('y', rowLines[0].floor - o.cap * FULL + 4); capLabel.textContent = isLti ? '' : `LTV ${Math.round(o.cap * 100)}%`;
      S.res.forEach((r, i) => {
        const c = cells[i], hh = HH[i], out = r.state === 'waits' || r.state === 'shutout';
        const home = r.home > 0 ? r.home : hh.H, hFrac = home / hh.H, total = FULL * hFrac, wh = total - ROOF;
        c.cpath.setAttribute('d', houseD(c.w, Math.max(4, wh))); c.outline.setAttribute('d', houseD(c.w, Math.max(4, wh)));
        c.g.setAttribute('transform', `translate(${c.cx + (cw - c.w) / 2},${c.floor - total})`);
        const famCash = (o.family && hh.fam) ? FAM : 0, famUsed = out ? 0 : Math.max(0, Math.min(famCash, r.equity - hh.w));
        const bankH = out ? 0 : total * (r.mortgage / home), savH = out ? 0 : total * ((r.equity - famUsed) / home), famH = out ? 0 : total * (famUsed / home);
        c.bank.setAttribute('y', total - bankH); c.bank.setAttribute('height', bankH);
        c.sav.setAttribute('y', total - bankH - savH); c.sav.setAttribute('height', savH);
        c.fam.setAttribute('y', total - bankH - savH - famH); c.fam.setAttribute('height', famH);
        c.outline.setAttribute('class', 'outline ' + (r.state === 'waits' ? 'o-waits' : r.state === 'shutout' ? 'o-shutout' : ''));
        c.g.style.opacity = opts.showCost && r.cost === 0 ? .4 : 1;
        c.star.textContent = S.exempted.has(i) ? '★' : '';
        const hbar = opts.showCost ? Math.min(44, r.cost * 5) : 0; c.costbar.setAttribute('height', hbar); c.costbar.setAttribute('y', total - hbar);
        c.name.setAttribute('y', total + 11);
        if (isLti) { const ty = total - Math.min(total, total * (o.lti * hh.y / home)); c.tick.setAttribute('y1', ty); c.tick.setAttribute('y2', ty); c.tick.setAttribute('opacity', 1); } else c.tick.setAttribute('opacity', 0);
      });
      costLbl.setAttribute('opacity', opts.showCost ? 1 : 0);
      costLbl.textContent = opts.showCost ? `welfare cost the bar never shows: ${S.cost.toFixed(0)} units, illustrative (red stems)` : '';
      countsEl.innerHTML = '';
      ORDER.forEach(k => countsEl.appendChild(h('div', {}, h('span', {}, h('i', { class: 'zone-chip', style: `background:${SCOL[k]}${k === 'waits' || k === 'shutout' ? ';background:transparent;border:2px dashed ' + SCOL[k] : ''}` }), LABEL[k]), h('b', {}, String(S.counts[k])))));
      countsEl.appendChild(h('div', {}, h('span', {}, 'constrained households'), h('b', {}, String(24 - S.counts.planned))));
      if (S.exempted.size) countsEl.appendChild(h('div', {}, h('span', {}, '★ exempted by the lender'), h('b', {}, String(S.exempted.size))));
    }
    cells.forEach((c, i) => {
      c.g.addEventListener('mousemove', ev => {
        const r = S.res[i], hh = HH[i]; let why = '';
        if (r.state === 'planned') why = `Borrows €${Math.round(r.mortgage)}k as planned, under a limit of €${Math.round(r.maxLoan)}k.`;
        else if (r.state === 'drained') why = `The rule allows €${Math.round(r.mortgage)}k. Puts in €${Math.round(r.equity)}k instead of €${hh.d}k, from savings.`;
        else if (r.state === 'family') why = `The rule allows €${Math.round(r.mortgage)}k. Needs €${Math.round(r.equity)}k up front; family covers what savings cannot.`;
        else if (r.state === 'cheaper') why = `Cannot fund the €${hh.H}k home. Buys one for €${Math.round(r.home)}k with all cash in.`;
        else if (r.state === 'waits') why = `Would need €${Math.round(r.needed)}k up front instead of €${hh.d}k. Only mildly wanted to own, so waits and rents. Small loss.`;
        else why = `Would need €${Math.round(r.needed)}k up front and has €${hh.w}k${hh.fam ? ' plus family help' : ''}. No home within reach. ${hh.pref > .6 ? 'Wanted badly to own: a large loss.' : 'A real loss.'}`;
        tip.show(ev, `<b>${hh.n}</b> · savings €${hh.w}k · income €${hh.y}k/yr · wants a €${hh.H}k home${hh.fam ? ' · family can help' : ''}${S.exempted.has(i) ? ' · ★ exempted' : ''}<br><span style="color:${C.amber}">${LABEL[r.state]}</span>. ${why}`);
      });
      c.g.addEventListener('mouseleave', tip.hide);
    });
    const capS = slider('Maximum loan-to-value', { min: 70, max: 95, step: 1, value: Math.round(opts.cap * 100), fmtv: v => v + '%', oninput: v => { opts.cap = v / 100; paint(); } });
    const ltiS = slider('Maximum loan-to-income', { min: 3, max: 6, step: 0.25, value: 4.5, fmtv: v => v + '×', oninput: v => { opts.ltiCap = v; paint(); } });
    ltiS.style.display = 'none';
    ctl.append(h('div', { class: 'ctl' }, h('label', {}, 'Instrument'), seg([['ltv', 'LTV cap'], ['lti', 'Income cap']], 'ltv', v => { opts.instrument = v; capS.style.display = v === 'ltv' ? '' : 'none'; ltiS.style.display = v === 'lti' ? '' : 'none'; paint(); })),
      capS, ltiS,
      h('div', { class: 'ctl', style: 'gap:8px' }, check('Family can help (€40k)', true, v => { opts.family = v; paint(); }), check('Lender may exempt 3 households', false, v => { opts.exempt = v; paint(); }), check('Show the cost the bar hides', opts.showCost, v => { opts.showCost = v; paint(); })));
    legendEl.append(h('span', {}, h('i', { style: `background:${C.slate}` }), 'borrowed from the bank'), h('span', {}, h('i', { style: `background:${C.amber}` }), 'own savings'), h('span', {}, h('i', { style: `background:${C.plum}` }), 'family money'), h('span', {}, h('i', { style: `background:transparent;border:2px dashed ${C.red}` }), 'shut out'), h('span', {}, h('i', { style: `background:transparent;border:2px dashed #8a847b` }), 'waits'), h('span', {}, h('i', { style: `background:${C.orange}` }), 'income cap level (tick)'));
    paint(); document.addEventListener('themechange', paint);
  })();

  // ---------- 5. micro aggregation calculator (Appendix C, eq. C.1) ----------
  (function micro() {
    if (!$('#microCtl')) return;
    const US = { e: 2, s: 2.7, dl: 4.4, ob: 7.34 }; // DeFusco et al.: 2% eliminated, 2.7% shifted by 4.4%, $600bn / $8.17tn
    const st = Object.assign({ key: 'us' }, US);
    const ctl = $('#microCtl'), stage = $('#microStage'), pr = $('#microPresets');
    const W = 760, H = 150; const svg = s('svg', { viewBox: `0 0 ${W} ${H}` }); stage.appendChild(svg);
    const noteEl = h('p', { class: 'small', style: 'margin:8px 0 0' }); stage.appendChild(noteEl);
    const sl = {
      e: slider('e  share of originations eliminated', { min: 0, max: 15, step: 0.1, value: st.e, fmtv: v => v + '%', oninput: v => { st.e = v; st.key = null; draw(); } }),
      s: slider('s  share shifted to smaller loans', { min: 0, max: 30, step: 0.1, value: st.s, fmtv: v => v + '%', oninput: v => { st.s = v; st.key = null; draw(); } }),
      dl: slider('Δ  loan reduction among shifted borrowers', { min: 0, max: 20, step: 0.1, value: st.dl, fmtv: v => v + '%', oninput: v => { st.dl = v; st.key = null; draw(); } }),
      ob: slider('O/B  originations ÷ debt stock', { min: 0.5, max: 20, step: 0.1, value: st.ob, fmtv: v => v + '%', oninput: v => { st.ob = v; st.key = null; draw(); } }),
    };
    ctl.append(sl.e, sl.s, sl.dl, sl.ob);
    const pill = h('button', { type: 'button', class: 'pill on' }, 'DeFusco et al. (2020): US, full-market extrapolation');
    pill.addEventListener('click', () => { Object.assign(st, US, { key: 'us' }); Object.keys(sl).forEach(q => sl[q].set(st[q])); draw(); });
    pr.appendChild(pill);
    function draw() {
      pill.classList.toggle('on', st.key === 'us');
      const e = st.e / 100, sh = st.s / 100, dl = st.dl / 100, ob = st.ob / 100;
      const ext = e * ob * 100, int_ = sh * dl * ob * 100, dg = ext + int_;
      svg.innerHTML = '';
      const x0 = 20, x1 = W - 20, maxv = 2.2, xs = v => x0 + (x1 - x0) * Math.min(v, maxv) / maxv;
      [0, .5, 1.0, 1.5, 2.0].forEach(v => { svg.appendChild(s('line', { x1: xs(v), x2: xs(v), y1: 30, y2: 96, class: 'gridline' })); svg.appendChild(s('text', { x: xs(v), y: 112, 'text-anchor': 'middle' }, v ? minus('−' + v.toFixed(1)) : '0.0')); });
      svg.appendChild(s('text', { x: x0, y: 20, class: 'title' }, 'Implied reduction in annual mortgage credit growth, percentage points'));
      svg.appendChild(s('rect', { x: xs(1.4), y: 30, width: xs(2.0) - xs(1.4), height: 66, fill: C.orange, opacity: .12 }));
      svg.appendChild(s('text', { x: xs(1.7), y: 40, 'text-anchor': 'middle', style: `fill:${C.orange};font-size:11px;font-weight:600` }, 'cross-country macro range 1.4–2.0'));
      svg.appendChild(s('rect', { x: xs(0), y: 44, width: xs(ext) - xs(0), height: 36, fill: C.blue, rx: 3 }));
      svg.appendChild(s('rect', { x: xs(ext), y: 44, width: xs(dg) - xs(ext), height: 36, fill: C.blueLight, rx: 3 }));
      svg.appendChild(s('text', { x: xs(dg) + 8, y: 67, class: 'title', style: 'font-size:16px' }, minus('−' + fmt(dg, 2)) + ' pp' + (dg > maxv ? ' →' : '')));
      svg.appendChild(s('text', { x: x0, y: 134 }, `extensive margin ${minus('−' + fmt(ext, 2))} (dark) · intensive margin ${minus('−' + fmt(int_, 3))} (light) · extensive share ${dg > 0 ? Math.round(100 * ext / dg) : 0}%`));
      noteEl.innerHTML = st.key === 'us'
        ? '<b>DeFusco et al. (2020):</b> 15% of counterfactual high-DTI jumbo loans eliminated and 20% shifted below the threshold, which is 2% and 2.7% of the whole counterfactual jumbo purchase market. Following the authors, these responses are applied to the full $600bn US purchase market, with the paper\'s illustrative 4.4% loan reduction for shifted borrowers, and divided by the $8.17tn mortgage stock at end-2014. Paper: −0.16 pp, 94% from the extensive margin.'
        : 'Custom inputs. The paper\'s DeFusco illustration gives −0.16 pp; Aastveit et al.\'s own calculation for Norway gives −0.27 pp.';
    }
    draw();
  })();

  // ---------- 6. the aggregation gap (Figure 3) ----------
  (function gap() {
    if (!$('#gapCtl')) return;
    const ctl = $('#gapCtl'), stage = $('#gapStage'); let k = DEMO ? 5.6 : 1;
    const MLO = .16, MHI = .27, MACLO = 1.4, MACHI = 2.0, KMAX = 12;
    const W = 760, H = 300, L = 250, R = 30, xmax = 2.4, xs = v => L + (W - L - R) * v / xmax;
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}` }); stage.appendChild(svg);
    const micro = [['US', MLO], ['Norway', MHI]];
    const read = h('div', { class: 'readout' }); stage.appendChild(read);
    const bench = [[2.6, 3.9, 'Huber (2018): German firms, bank lending cut, employment'], [4.5, 4.5, 'Mian, Sarto & Sufi (2026): US regions, 2000s credit expansion'], [5.6, 5.6, 'Sarto (2025): US counties, 2000s expansion, range 4.2–7.7']];
    function draw() {
      svg.innerHTML = '';
      [0, .5, 1, 1.5, 2].forEach(v => { svg.appendChild(s('line', { x1: xs(v), x2: xs(v), y1: 20, y2: H - 40, class: 'gridline' })); svg.appendChild(s('text', { x: xs(v), y: H - 22, 'text-anchor': 'middle' }, v.toFixed(1))); });
      svg.appendChild(s('text', { x: (L + W - R) / 2, y: H - 4, 'text-anchor': 'middle' }, 'Reduction in annual household credit growth (percentage points)'));
      const a = MLO * k, b = MHI * k, lo = Math.max(a, MACLO), hi = Math.min(b, MACHI), ov = hi > lo;
      if (ov) svg.appendChild(s('rect', { x: xs(lo), y: 85, width: xs(hi) - xs(lo), height: 105, fill: cssVar('--bg2') }));
      const rows = [
        { y: 40, lbl: ['Direct effects implied by', 'household-level estimates'], draw: y => { micro.forEach(([n, v]) => svg.appendChild(s('circle', { cx: xs(v), cy: y, r: 7, fill: C.blue, stroke: '#fff', 'stroke-width': 1.5 }))); svg.appendChild(s('text', { x: xs(.34), y: y + 4, style: 'font-size:11px' }, 'US 0.16 · Norway 0.27')); } },
        { y: 105, lbl: ['Direct effects amplified by', `the multiplier (×${k.toFixed(1)})`], draw: y => { const bb = Math.min(b, xmax); svg.appendChild(s('rect', { x: xs(a), y: y - 14, width: Math.max(2, xs(bb) - xs(a)), height: 28, fill: C.blue, opacity: .35, stroke: C.blue, 'stroke-width': 1.5, rx: 3 })); svg.appendChild(s('text', { x: xs(a) - 6, y: y + 4, 'text-anchor': 'end', class: 'title' }, fmt(a, 2))); svg.appendChild(s('text', { x: xs(bb) + 6, y: y + 4, class: 'title' }, fmt(b, 2) + (b > xmax ? ' →' : ''))); } },
        { y: 170, lbl: ['Cross-country macro estimates', '(Cerutti et al.; Akinci & Olmstead-Rumsey)'], draw: y => { svg.appendChild(s('rect', { x: xs(MACLO), y: y - 14, width: xs(MACHI) - xs(MACLO), height: 28, fill: C.orange, rx: 3 })); svg.appendChild(s('text', { x: xs(MACLO) - 6, y: y + 4, 'text-anchor': 'end', class: 'title' }, '1.40')); svg.appendChild(s('text', { x: xs(MACHI) + 6, y: y + 4, class: 'title' }, '2.00')); } },
        { y: 230, lbl: ['Meta-analysis, bias-corrected', '(mixes micro and macro studies; context only)'], draw: y => { svg.appendChild(s('rect', { x: xs(.6), y: y - 12, width: xs(1.1) - xs(.6), height: 24, fill: 'none', stroke: C.orange, 'stroke-dasharray': '4 3', opacity: .6, rx: 3 })); svg.appendChild(s('text', { x: xs(.6) - 6, y: y + 4, 'text-anchor': 'end', style: 'fill:' + cssVar('--ink3') }, '0.60')); svg.appendChild(s('text', { x: xs(1.1) + 6, y: y + 4, style: 'fill:' + cssVar('--ink3') }, '1.10')); } },
      ];
      rows.forEach((r, i) => { r.lbl.forEach((t, j) => svg.appendChild(s('text', { x: L - 14, y: r.y - 6 + j * 16, 'text-anchor': 'end', style: `font-size:${j && i > 1 ? 11 : 13}px;fill:` + cssVar(i === 3 ? '--ink3' : '--ink') }, t))); r.draw(r.y); });
      read.innerHTML = '';
      read.append(h('div', {}, 'Amplified range', h('b', { class: 't1' }, `${fmt(a, 2)}–${fmt(b, 2)} pp`)),
        h('div', {}, 'Reaches the cross-country macro range?', h('b', { class: ov ? 't3' : '' }, ov ? 'Yes' : 'No')),
        h('div', {}, 'Multiplier needed to reach it', h('b', {}, `×${fmt(MACLO / MHI, 1)} to ×${fmt(MACHI / MLO, 1)}`)));
    }
    const sl = slider('General equilibrium multiplier (total ÷ direct)', { min: 1, max: KMAX, step: 0.1, value: k, fmtv: v => '×' + v.toFixed(1), oninput: v => { k = v; draw(); } });
    sl.style.width = '100%'; sl.style.maxWidth = '720px';
    // the ruler sits under the slider track on the same horizontal scale (the thumb travels between 8px insets)
    const ruler = s('svg', { viewBox: '0 0 720 64', style: 'width:100%;max-width:720px;margin-top:-6px' });
    const rx = v => 10 + (720 - 20) * (v - 1) / (KMAX - 1);
    const BC = [C.plum, C.green, C.orange];
    for (let v = 1; v <= KMAX; v++) { ruler.appendChild(s('line', { x1: rx(v), x2: rx(v), y1: 0, y2: 6, stroke: cssVar('--ink3') })); ruler.appendChild(s('text', { x: rx(v), y: 20, 'text-anchor': 'middle', style: 'font-size:12px' }, '×' + v)); }
    // the band of multipliers that reaches the macro range
    const bandR = Math.min(rx(MACHI / MLO), 714);
    ruler.appendChild(s('rect', { x: rx(MACLO / MHI), y: 26, width: bandR - rx(MACLO / MHI), height: 36, fill: C.orange, opacity: .12 }));
    ruler.appendChild(s('text', { x: rx(MACLO / MHI) + 6, y: 32, style: `font-size:10px;fill:${C.orange};font-weight:600` }, 'multipliers that reach the macro range: ×5 to ×12'));
    bench.forEach(([a, b, lbl], i) => { const y = 34 + i * 11; ruler.appendChild(s('line', { x1: rx(a), x2: rx(b), y1: y, y2: y, stroke: BC[i], 'stroke-width': 5, 'stroke-linecap': 'round' })); ruler.appendChild(s('circle', { cx: rx((a + b) / 2), cy: y, r: 3.5, fill: BC[i], stroke: '#fff', 'stroke-width': 1 })); });
    ruler.appendChild(s('line', { x1: rx(4.2), x2: rx(7.7), y1: 56, y2: 56, stroke: C.orange, 'stroke-width': 1.5, 'stroke-dasharray': '3 2' }));
    const benchList = h('div', { class: 'legend', style: 'margin-top:2px' }, ...bench.map(([a, b, lbl], i) => h('span', {}, h('i', { style: `background:${BC[i]}` }), h('b', {}, a === b ? '×' + a : `×${a}–${b}`), ' ' + lbl)));
    const rw = h('div', { class: 'ctl', style: 'width:100%' }, sl, h('label', { style: 'margin-top:6px' }, 'Benchmarks from other credit shocks, on the same scale'), ruler, benchList);
    ctl.append(rw); draw(); document.addEventListener('themechange', draw);
  })();

  // ---------- 7. price ledger ----------
  (function ledger() {
    if (!$('#ledgerCtl')) return;
    const ctl = $('#ledgerCtl'), stage = $('#ledgerStage'); const st = { dp: -5, share: 30, inst: 'ltv' };
    const W = 760, H = 240; const svg = s('svg', { viewBox: `0 0 ${W} ${H}` }); stage.appendChild(svg);
    const read = h('div', { class: 'readout' }); stage.appendChild(read);
    function draw() {
      svg.innerHTML = '';
      const dp = st.dp, buyers = -dp, sellers = dp, reval = st.inst === 'ltv' ? dp * 0.6 * (st.share / 100) * 1.5 : 0, net = buyers + sellers + reval;
      const rows = [['Net buyers (younger, less wealthy)', buyers, C.green], ['Net sellers (owners who stay put are hedged)', sellers, C.red], ['Constrained households: collateral revaluation', reval, C.orange], ['Sum', net, cssVar('--ink')]];
      const L = 300, R = 30, mid = L + (W - L - R) / 2, sc = (W - L - R) / 2 / 11, xs = v => mid + v * sc;
      svg.appendChild(s('line', { x1: mid, x2: mid, y1: 10, y2: H - 30, stroke: cssVar('--ink3') }));
      [-10, -5, 5, 10].forEach(v => { svg.appendChild(s('line', { x1: xs(v), x2: xs(v), y1: 10, y2: H - 30, class: 'gridline' })); svg.appendChild(s('text', { x: xs(v), y: H - 12, 'text-anchor': 'middle' }, minus(String(v)))); });
      svg.appendChild(s('text', { x: mid, y: H - 12, 'text-anchor': 'middle' }, '0'));
      rows.forEach(([lbl, v, col], i) => {
        const y = 24 + i * 50;
        svg.appendChild(s('text', { x: L - 12, y: y + 16, 'text-anchor': 'end', style: 'font-size:12.5px;fill:' + cssVar('--ink') + (i === 3 ? ';font-weight:600' : '') }, lbl));
        if (i === 3) svg.appendChild(s('line', { x1: L, x2: W - R, y1: y - 8, y2: y - 8, stroke: cssVar('--line') }));
        svg.appendChild(s('rect', { x: Math.min(xs(0), xs(v)), y, width: Math.abs(xs(v) - xs(0)), height: 24, fill: col, opacity: i === 3 ? .9 : .8, rx: 3 }));
        svg.appendChild(s('text', { x: v >= 0 ? xs(v) + 6 : xs(v) - 6, y: y + 16, 'text-anchor': v >= 0 ? 'start' : 'end', class: 'title' }, (v > 0 ? '+' : '') + minus(fmt(v, 1))));
      });
      read.innerHTML = '';
      read.append(h('div', {}, 'Transfer channel, summed', h('b', {}, '0.0')), h('div', {}, 'Revaluation channel', h('b', { class: reval ? 't2' : '' }, st.inst === 'ltv' ? minus(fmt(reval, 1)) : '0.0 under an income cap')), h('div', {}, 'Who gains from the price fall?', h('b', {}, 'buyers, unless constrained owners trading up modestly')));
    }
    ctl.append(slider('House-price change induced by the tightening', { min: -10, max: 0, step: 0.5, value: st.dp, fmtv: v => minus(v.toFixed(1)) + '%', oninput: v => { st.dp = v; draw(); } }),
      slider('Share of households the rule binds', { min: 0, max: 60, step: 5, value: st.share, fmtv: v => v + '%', oninput: v => { st.share = v; draw(); } }),
      h('div', { class: 'ctl' }, h('label', {}, 'Instrument'), seg([['ltv', 'LTV limit'], ['lti', 'Income-based limit']], 'ltv', v => { st.inst = v; draw(); })));
    draw(); document.addEventListener('themechange', draw);
  })();

  // ---------- 8. crisis grid ----------
  (function grid() {
    if (!$('#gridStage')) return;
    const stage = $('#gridStage'), G = D.grid, dc = D.debtCuts, pc = D.priceCuts;
    const W = 760, H = 330, L = 120, T = 36, cw = (W - L - 20) / 5, chh = (H - T - 70) / 3;
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}` }); stage.appendChild(svg); const tip = tipFor(stage);
    const colAt = v => { const t = Math.min(1, v / 40) * (SEQ.length - 1), i = Math.floor(t), f = t - i; return mix(SEQ[i], SEQ[Math.min(i + 1, SEQ.length - 1)], f); };
    function mix(a, b, f) { const p = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * f).toString(16).padStart(2, '0')).join(''); }
    const xl = [`< ${minus(dc[0].toFixed(1))}`, `${minus(dc[0].toFixed(1))} to ${dc[1].toFixed(1)}`, `${dc[1].toFixed(1)} to ${dc[2].toFixed(1)}`, `${dc[2].toFixed(1)} to ${dc[3].toFixed(1)}`, `> ${dc[3].toFixed(1)}`];
    const yl = [`> ${pc[1].toFixed(1)}`, `${minus(pc[0].toFixed(1))} to ${pc[1].toFixed(1)}`, `< ${minus(pc[0].toFixed(1))}`];
    const rowDesc = ['top tercile', 'middle tercile', 'bottom tercile'], colDesc = ['bottom quintile', 'second quintile', 'middle quintile', 'fourth quintile', 'top quintile'];
    svg.appendChild(s('text', { x: L, y: 18, class: 'title' }, 'Probability that a financial crisis begins within three years (percent)'));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
      const v = G[2 - r][c], x = L + c * cw, y = T + r * chh;
      const rect = s('rect', { x: x + 2, y: y + 2, width: cw - 4, height: chh - 4, fill: colAt(v), rx: 4 });
      const txt = s('text', { x: x + cw / 2, y: y + chh / 2 + 5, 'text-anchor': 'middle', style: `font-weight:600;font-size:15px;fill:${v > 18 ? '#fff' : '#184f95'}` }, v.toFixed(1));
      const g = s('g', { style: 'cursor:default' }, rect, txt); svg.appendChild(g);
      g.addEventListener('mousemove', ev => tip.show(ev, `<b>${v.toFixed(1)}%</b> crisis probability within 3 years<br>house-price growth ${rowDesc[r]} (${yl[r]}%)<br>household-debt change ${colDesc[c]} (${xl[c]} pp of GDP)${r === 0 && c === 4 ? '<br><b>R-zone</b>' : ''}`));
      g.addEventListener('mouseleave', tip.hide);
    }
    svg.appendChild(s('rect', { x: L + 4 * cw + 2, y: T + 2, width: cw - 4, height: chh - 4, fill: 'none', stroke: C.orange, 'stroke-width': 3, rx: 4 }));
    svg.appendChild(s('text', { x: L + 4.5 * cw, y: T - 6, 'text-anchor': 'middle', style: `fill:${C.orange};font-weight:600` }, 'R-zone'));
    yl.forEach((t, r) => svg.appendChild(s('text', { x: L - 8, y: T + r * chh + chh / 2 + 4, 'text-anchor': 'end' }, t)));
    xl.forEach((t, c) => svg.appendChild(s('text', { x: L + c * cw + cw / 2, y: T + 3 * chh + 18, 'text-anchor': 'middle' }, t)));
    svg.appendChild(s('text', { x: L + 2.5 * cw, y: T + 3 * chh + 40, 'text-anchor': 'middle' }, '3-year change in household debt / GDP (pp of GDP), by quintile'));
    svg.appendChild(s('text', { x: 14, y: T + 1.5 * chh, transform: `rotate(-90 14 ${T + 1.5 * chh})`, 'text-anchor': 'middle' }, '3-year real house-price growth (%), by tercile'));
  })();

  // ---------- 9. episodes map ----------
  (function episodes() {
    if (!$('#epCtl')) return;
    const ctl = $('#epCtl'), stage = $('#epStage'), read = $('#epRead'); const st = { grp: 'all', studied: DEMO, zone: 'all' };
    const W = 760, H = 480, L = 56, R = 16, T = 16, B = 44, xmin = -30, xmax = 32, ymin = -35, ymax = 65;
    const LABEL_OFF = { 'NO 2010': [-9, 16, 'end'], 'SE 2010': [9, -6, 'start'], 'NO 2011': [9, -6, 'start'], 'CA 2012': [-9, -6, 'end'], 'FI 2016': [9, 12, 'start'] }; // [dx, dy, anchor] where default placement collides
    const xs = v => L + (W - L - R) * (v - xmin) / (xmax - xmin), ys = v => T + (H - T - B) * (ymax - v) / (ymax - ymin);
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}` }); stage.appendChild(svg); const tip = tipFor(stage);
    const lg = h('div', { class: 'legend' }, h('span', {}, h('i', { style: `background:${C.blue};border-radius:50%` }), 'Advanced economies'), h('span', {}, h('i', { style: `background:transparent;border:2px solid ${C.orange};border-radius:50%` }), 'Emerging and developing economies'), h('span', {}, h('i', { class: 'zone-chip', style: 'background:#f6d9ca' }), 'R-zone'), h('span', {}, h('i', { class: 'zone-chip', style: 'background:#e8e6e0' }), 'Y-zone'));
    stage.appendChild(lg);
    function draw() {
      svg.innerHTML = '';
      const dark = document.documentElement.getAttribute('data-theme') === 'dark' || (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
      svg.appendChild(s('rect', { x: xs(D.Y.debt), y: ys(ymax), width: xs(xmax) - xs(D.Y.debt), height: ys(D.Y.price) - ys(ymax), fill: dark ? '#2a2a33' : '#ebe9e3' }));
      svg.appendChild(s('rect', { x: xs(D.R.debt), y: ys(ymax), width: xs(xmax) - xs(D.R.debt), height: ys(D.R.price) - ys(ymax), fill: dark ? '#4a2a1c' : '#f7dccd' }));
      svg.appendChild(s('text', { x: xs(xmax) - 8, y: ys(ymax) + 18, 'text-anchor': 'end', style: `fill:${C.orange};font-weight:600;font-size:13px` }, 'R-zone'));
      svg.appendChild(s('text', { x: xs(xmax) - 8, y: ys(D.Y.price) - 8, 'text-anchor': 'end', style: `fill:${cssVar('--ink3')};font-weight:600;font-size:13px` }, 'Y-zone'));
      [-20, -10, 0, 10, 20, 30].forEach(v => { svg.appendChild(s('line', { x1: xs(v), x2: xs(v), y1: T, y2: H - B, class: v === 0 ? 'axis' : 'gridline', style: v === 0 ? 'stroke:' + cssVar('--ink3') : '' })); svg.appendChild(s('text', { x: xs(v), y: H - B + 16, 'text-anchor': 'middle' }, minus(String(v)))); });
      [-20, 0, 20, 40, 60].forEach(v => { svg.appendChild(s('line', { x1: L, x2: W - R, y1: ys(v), y2: ys(v), class: v === 0 ? 'axis' : 'gridline', style: v === 0 ? 'stroke:' + cssVar('--ink3') : '' })); svg.appendChild(s('text', { x: L - 6, y: ys(v) + 4, 'text-anchor': 'end' }, minus(String(v)))); });
      svg.appendChild(s('text', { x: (L + W - R) / 2, y: H - 6, 'text-anchor': 'middle' }, '3-year change in household credit / GDP before the tightening (pp of GDP)'));
      svg.appendChild(s('text', { x: 14, y: (T + H - B) / 2, transform: `rotate(-90 14 ${(T + H - B) / 2})`, 'text-anchor': 'middle' }, '3-year real house-price growth before the tightening (%)'));
      const shown = D.episodes.filter(e => (st.grp === 'all' || (st.grp === 'ae' ? e.ae === 1 : e.ae === 0)) && (st.zone === 'all' || e.z === st.zone));
      const sorted = shown.slice().sort((a, b) => (a.s ? 1 : 0) - (b.s ? 1 : 0));
      sorted.forEach(e => {
        const dim = st.studied && !e.s;
        const c = s('circle', { cx: xs(Math.max(xmin, Math.min(xmax, e.d))), cy: ys(Math.max(ymin, Math.min(ymax, e.p))), r: e.s && st.studied ? 7 : 5.5, fill: e.ae ? C.blue : 'none', stroke: e.ae ? '#fff' : C.orange, 'stroke-width': e.ae ? 1 : 1.8, opacity: dim ? .18 : .95, style: 'cursor:default' });
        svg.appendChild(c);
        if (st.studied && e.s) { const off = LABEL_OFF[`${e.c} ${e.y}`] || [9, 4, 'start']; svg.appendChild(s('text', { x: xs(e.d) + off[0], y: ys(e.p) + off[1], 'text-anchor': off[2], style: 'font-size:11px;font-weight:600;fill:' + cssVar('--ink') }, `${e.c} ${e.y}`)); }
        c.addEventListener('mousemove', ev => tip.show(ev, `<b>${e.n} ${e.y}</b> (${e.q})<br>${e.t}<br>credit/GDP ${e.d > 0 ? '+' : ''}${minus(fmt(e.d, 1))} pp · house prices ${e.p > 0 ? '+' : ''}${minus(fmt(e.p, 1))}%<br>${e.z === 'R' ? '<b>R-zone</b>' : e.z === 'Y' ? 'Y-zone' : 'outside both zones'}${e.s ? '<br><i>studied by ' + e.s + '</i>' : ''}`));
        c.addEventListener('mouseleave', tip.hide);
      });
      const all = D.episodes.filter(e => st.grp === 'all' || (st.grp === 'ae' ? e.ae === 1 : e.ae === 0));
      read.innerHTML = '';
      read.append(h('div', {}, 'Episodes', h('b', {}, String(all.length))), h('div', {}, 'In the R-zone', h('b', { class: 't2' }, String(all.filter(e => e.z === 'R').length))), h('div', {}, 'In the Y-zone (incl. R)', h('b', {}, String(all.filter(e => e.z !== 'O').length))), h('div', {}, 'Household debt / GDP falling', h('b', {}, String(all.filter(e => e.d < 0).length))), h('div', {}, 'House prices in top tercile', h('b', {}, String(all.filter(e => e.p > D.R.price).length))));
    }
    ctl.append(h('div', { class: 'ctl' }, h('label', {}, 'Country group'), seg([['all', 'All'], ['ae', 'Advanced'], ['em', 'Emerging']], 'all', v => { st.grp = v; draw(); })),
      h('div', { class: 'ctl' }, h('label', {}, 'Show'), seg([['all', 'All'], ['R', 'R-zone'], ['Y', 'Y-zone'], ['O', 'Outside']], 'all', v => { st.zone = v; draw(); })),
      h('div', { class: 'ctl', style: 'justify-content:end' }, check('Highlight reforms studied in the household-level literature', st.studied, v => { st.studied = v; draw(); })));
    draw(); document.addEventListener('themechange', draw);
  })();
})();
