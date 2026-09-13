/* decks/b-trunk.js — feasible, reform, wealth, sandbox */
(function () {
  const L = window.LIB, P = L.PAPER;
  const TYPES = ['rural', 'province', 'country', 'city', 'capital'];
  const TYPE_LABEL = { rural: 'village', country: 'countryside', province: 'prov. town', city: 'big city', capital: 'Copenhagen' };
  const TYPES_ORDERED = ['rural', 'country', 'province', 'city', 'capital'];

  // Shared: the field of homes. Returns {svg, paint(maxPrice, filters)}
  function homesField(W, H, opts = {}) {
    const c = L.chart(W, H, { l: 56, r: 16, t: 24, b: 40 }, [0, 5], [0.2e6, 6e6]);
    const ylog = L.scale(Math.log(0.25e6), Math.log(6e6), c.H - c.m.b, c.m.t);
    const Y = (p) => ylog(Math.log(L.clamp(p, 0.25e6, 6e6)));
    // y axis (log)
    const g = L.svg('g', { class: 'axis' });
    for (const t of [0.5e6, 1e6, 2e6, 4e6]) {
      g.appendChild(L.svg('line', { class: 'grid', x1: c.m.l, x2: c.W - c.m.r, y1: Y(t), y2: Y(t) }));
      g.appendChild(L.svg('text', { x: c.m.l - 6, y: Y(t) + 3.5, 'text-anchor': 'end', text: (t / 1e6).toFixed(1).replace('.0', '') + 'm' }));
    }
    g.appendChild(L.svg('text', { x: c.m.l, y: c.m.t - 8, class: 'axis-label', text: 'price, DKK' }));
    c.g.appendChild(g);
    L.axisX(c, TYPES_ORDERED.map((t, i) => i + 0.5), (v) => TYPE_LABEL[TYPES_ORDERED[Math.floor(v)]], '');
    const dots = L.homes.map(h => {
      const i = TYPES_ORDERED.indexOf(h.type);
      const d = L.svg('circle', { cx: c.x(i + 0.12 + 0.76 * h.x), cy: Y(h.price), r: 3.2, fill: 'var(--ink-3)', 'fill-opacity': 0.55 });
      d.appendChild(L.svg('title', { text: `${TYPE_LABEL[h.type]} · ${h.size} m² · ${L.fmtDKK(h.price)}` }));
      c.g.appendChild(d); return d;
    });
    const ceiling = L.svg('line', { x1: c.m.l, x2: c.W - c.m.r, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '6 4' });
    const ceilLbl = L.svg('text', { x: c.W - c.m.r, 'text-anchor': 'end', class: 'lbl', text: 'your ceiling' });
    c.g.append(ceiling, ceilLbl);
    // high growth shade
    const shade = L.svg('rect', { x: c.x(3), y: c.m.t, width: c.x(5) - c.x(3), height: c.H - c.m.t - c.m.b, fill: 'var(--gain)', 'fill-opacity': 0.06, opacity: 0 });
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
        dots[i].setAttribute('r', ok ? 3.8 : 3.0);
      });
      return L.feasibleShare(maxPrice, { minSize, highGrowth });
    };
    return { svg: c.svg, paint };
  }

  // =====================================================================
  // DECK 4 · feasible
  // =====================================================================
  const feasible = {
    id: 'feasible', title: 'What you can actually buy', short: 'Feasible set',
    slides: [
      {
        title: 'You cannot buy a slice of a neighbourhood', layout: 'split', nextLabel: 'How does the bank decide?',
        prose: `
          <p>With shares, anyone can own a sliver of the best company in the world. Housing does not work like that. You buy a whole home, in one place, and it has to be big enough to live in.</p>
          <p>That puts a <strong>floor</strong> under what you can buy: the home must fit your household. And a <strong>ceiling</strong> over it: the bank must be willing to lend enough.</p>
          <p>Between floor and ceiling is your <em>feasible set</em>. Everything in this deck is about how big that set is, and where it is.</p>`,
        stage(el) {
          const W = 600, H = 320;
          const svg = L.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
          svg.appendChild(L.svg('rect', { x: 120, y: 90, width: 360, height: 130, fill: 'var(--ink)', 'fill-opacity': .07 }));
          svg.appendChild(L.svg('line', { x1: 80, x2: 520, y1: 90, y2: 90, stroke: 'var(--ink)', 'stroke-width': 3 }));
          svg.appendChild(L.svg('line', { x1: 80, x2: 520, y1: 220, y2: 220, stroke: 'var(--ink)', 'stroke-width': 3 }));
          svg.appendChild(L.svg('text', { x: 80, y: 78, class: 'lbl', text: 'ceiling: what the bank will finance' }));
          svg.appendChild(L.svg('text', { x: 80, y: 244, class: 'lbl', text: 'floor: a home big enough to live in' }));
          svg.appendChild(L.svg('text', { x: 300, y: 160, 'text-anchor': 'middle', class: 'lbl-big', text: 'feasible set' }));
          const sl = CD.sliver(300); sl.style.flex = '0 0 auto'; sl.style.alignSelf = 'center'; sl.style.height = '150px'; sl.style.maxWidth = '100%';
          el.appendChild(sl);
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [svg]));
        },
      },
      {
        title: 'The bank has two rules', layout: 'split', nextLabel: 'Which homes does that reach?',
        prose: `
          <p>Danish lenders apply two limits. You need a <strong>down payment</strong>, about 20 percent, so your savings cap the loan. And your <strong>monthly payment</strong> cannot exceed roughly a third of your income, which caps the loan again.</p>
          <p>The lower of the two wins. Build a household, or pick Anna, Bo, or Mette, a buyer in the middle, and see which rule bites.</p>
          <p id="feas-explain" class="note"></p>`,
        stage(el, ctx, info) {
          const sI = L.slider('yearly income', 80000, 900000, L.HH.mid.income, 5000, v => L.fmtDKK(v), 'f-inc');
          const sW = L.slider('savings + home equity', 0, 2000000, L.HH.mid.wealth, 10000, v => L.fmtDKK(v), 'f-w');
          const presets = L.el('div', { class: 'controls' });
          let curHH = 'mid';
          const pchips = {};
          for (const k of ['anna', 'mid', 'bo']) {
            const h = L.HH[k];
            const b = L.el('button', { class: 'chip', text: h.name + (k === 'mid' ? ' (middle, rank 50)' : k === 'anna' ? ' (rank 10)' : ' (rank 90)'), 'aria-pressed': k === curHH ? 'true' : 'false' });
            b.addEventListener('click', () => { curHH = k; sI.input.value = h.income; sW.input.value = h.wealth; sI.out.textContent = L.fmtDKK(h.income); sW.out.textContent = L.fmtDKK(h.wealth); upd(); });
            presets.appendChild(b); pchips[k] = b;
          }
          const paintChips = () => Object.entries(pchips).forEach(([k, b]) => b.setAttribute('aria-pressed', k === curHH ? 'true' : 'false'));
          const W = 600, H = 210;
          const svg = L.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
          const x0 = 200, wmax = 380, scaleP = (v) => wmax * L.clamp(v / 6e6, 0, 1);
          const row = (y, label) => {
            svg.appendChild(L.svg('text', { x: x0 - 10, y: y + 15, 'text-anchor': 'end', class: 'lbl', text: label }));
            const bg = L.svg('rect', { x: x0, y, width: wmax, height: 22, rx: 4, fill: 'var(--paper-2)', stroke: 'var(--line)' });
            const bar = L.svg('rect', { x: x0, y, width: 0, height: 22, rx: 4, fill: 'var(--ink-3)' });
            const v = L.svg('text', { x: x0 + 6, y: y + 15, class: 'lbl-mono' });
            svg.append(bg, bar, v); return { bar, v };
          };
          const r1 = row(30, 'loan allowed by savings');
          const r2 = row(70, 'loan allowed by income');
          const r3 = row(130, 'maximum price');
          svg.appendChild(L.svg('text', { x: x0, y: 122, class: 'axis-label', text: 'smaller loan + your savings =' }));
          const upd = () => {
            const inc = +sI.input.value, w = +sW.input.value;
            const b = L.borrow(inc, w);
            r1.bar.setAttribute('width', scaleP(b.ltvLoan)); r1.v.textContent = L.fmtDKK(b.ltvLoan); r1.v.setAttribute('x', x0 + scaleP(b.ltvLoan) + 8);
            r2.bar.setAttribute('width', scaleP(b.ptiLoan)); r2.v.textContent = L.fmtDKK(b.ptiLoan); r2.v.setAttribute('x', x0 + scaleP(b.ptiLoan) + 8);
            r3.v.setAttribute('x', x0 + scaleP(b.max) + 8);
            r1.bar.setAttribute('fill', b.binding === 'LTV' ? 'var(--ink)' : 'var(--line)');
            r2.bar.setAttribute('fill', b.binding === 'PTI' ? 'var(--ink)' : 'var(--line)');
            r3.bar.setAttribute('width', scaleP(b.max)); r3.v.textContent = L.fmtDKK(b.max); r3.bar.setAttribute('fill', curHH ? L.HH[curHH].color : 'var(--ink)');
            paintChips();
            const ex = document.querySelector('#feas-explain');
            if (ex) ex.innerHTML = b.binding === 'PTI'
              ? `The <strong>income rule</strong> bites. Even with more savings, this household could not carry a bigger monthly payment. Ceiling: <span class="num">${L.fmtDKK(b.max)}</span>.`
              : `The <strong>down-payment rule</strong> bites. The income could carry a bigger loan, but the savings cannot cover 20 percent of it. Ceiling: <span class="num">${L.fmtDKK(b.max)}</span>.`;
          };
          sI.input.addEventListener('input', () => { curHH = null; upd(); }); sW.input.addEventListener('input', () => { curHH = null; upd(); });
          el.appendChild(presets);
          el.appendChild(sI.row); el.appendChild(sW.row);
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [svg]));
          el.appendChild(L.el('p', { class: 'caption', text: 'Dark bar: the rule that bites. 20% down payment, payments at most 35% of income, 30-year loan at 4%. The paper\'s assumptions; it checks alternatives.' }));
          upd();
        },
      },
      {
        title: 'The map of homes', layout: 'split', nextLabel: 'Which rule bites?',
        prose: `
          <p>Every dot is a home sold in the same year, placed by price and by kind of place. The dashed line is a household's ceiling. Coloured dots are within reach.</p>
          <p>Then the floor: the home must be at least as big as the household needs. And then ask only about the places where prices have been rising fast. Watch Anna's share, then try Bo.</p>
          <p id="feas-share" class="q"></p>`,
        stage(el, ctx, info) {
          const field = homesField(600, 300);
          const who = L.el('div', { class: 'controls' });
          let cur = 'anna';
          const chips = {};
          for (const k of ['anna', 'mid', 'bo']) {
            const h = L.HH[k];
            chips[k] = L.el('button', { class: 'chip', text: h.name, 'aria-pressed': k === cur ? 'true' : 'false' });
            chips[k].addEventListener('click', () => { cur = k; Object.values(chips).forEach(c => c.setAttribute('aria-pressed', 'false')); chips[k].setAttribute('aria-pressed', 'true'); upd(); });
            who.appendChild(chips[k]);
          }
          const tSize = L.toggle('at least 90 m²', info.revisit, 'f-size'), tHigh = L.toggle('only high-growth places', info.revisit, 'f-high');
          const upd = () => {
            const h = L.HH[cur];
            const b = L.borrow(h.income, h.wealth);
            const share = field.paint(b.max, { minSize: tSize.input.checked ? 90 : 0, highGrowth: tHigh.input.checked, color: h.color });
            const q = document.querySelector('#feas-share');
            const what = (tHigh.input.checked ? 'of homes in the fast-growing places' : 'of these homes') + (tSize.input.checked ? ', at 90 m² or more' : '');
            if (q) q.innerHTML = `${h.name} could buy <span class="num">${Math.round(share * 100)}%</span> ${what}.`;
          };
          tSize.input.addEventListener('change', upd); tHigh.input.addEventListener('change', upd);
          const timers = [];
          if (!info.revisit) { timers.push(setTimeout(() => { tSize.input.checked = true; upd(); }, 1800), setTimeout(() => { tHigh.input.checked = true; upd(); }, 3600)); }
          el.appendChild(L.el('div', { class: 'controls' }, [who, tSize.row, tHigh.row]));
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [field.svg]));
          el.appendChild(L.el('p', { class: 'caption', html: 'Stylised stock. In the data: buyers in the bottom third could afford about <span class="num">40%</span> of homes, the top third over <span class="num">60%</span>. In high-growth areas at the same size, a rank-40 buyer reaches about <span class="num">20%</span>.' }));
          upd();
          return () => timers.forEach(clearTimeout);
        },
      },
      {
        title: 'The rule that bites is the income rule', layout: 'split',
        prose: `
          <p>Across all buyers, which rule sets the ceiling? For a little over half, the <strong>income rule</strong>. The down-payment rule bites most in the middle of the income ladder and rarely at the top or bottom.</p>
          <p>Savings-based ceilings are fairly similar across incomes, partly because lower-income buyers are often older and have equity. Income-based ceilings are not. That is the rule standing between Anna and Copenhagen.</p>
          <p class="q">So loosen the income rule and Anna gets in?</p>`,
        doors: [{ to: 'reform/0', label: 'Denmark tried exactly that', hint: 'The 2003 experiment', kind: 'next' }],
        stage(el) {
          const c = L.chart(600, 320, { l: 52, r: 20, t: 30, b: 44 }, [0, 100], [0, 1]);
          L.axisY(c, [0, 0.25, 0.5, 0.75, 1], v => Math.round(v * 100) + '%', 'share of buyers');
          L.axisX(c, [0, 20, 40, 60, 80, 100], v => v, 'income rank');
          const ltv = (r) => 0.22 + 0.30 * Math.exp(-Math.pow((r - 55) / 22, 2)); // inverted U, stylised
          const pts = []; for (let r = 0; r <= 100; r += 5) pts.push([c.x(r), c.y(ltv(r))]);
          const area = L.svg('path', { d: L.linePath(pts) + ` L${c.x(100)} ${c.y(0)} L${c.x(0)} ${c.y(0)} Z`, fill: 'var(--ink-3)', 'fill-opacity': .35 });
          const top = L.svg('path', { d: L.linePath(pts) + ` L${c.x(100)} ${c.y(1)} L${c.x(0)} ${c.y(1)} Z`, fill: 'var(--ink)', 'fill-opacity': .12 });
          c.g.append(top, area);
          c.g.appendChild(L.svg('text', { x: c.x(50), y: c.y(0.2), 'text-anchor': 'middle', class: 'lbl', text: 'down-payment rule binds' }));
          c.g.appendChild(L.svg('text', { x: c.x(50), y: c.y(0.8), 'text-anchor': 'middle', class: 'lbl', text: 'income rule binds' }));
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [c.svg]));
          el.appendChild(L.el('p', { class: 'caption', text: 'Shape follows the paper\'s figure of binding constraints by rank: an inverted U for the loan-to-value rule, payment-to-income binding for slightly over half of buyers overall.' }));
        },
      },
    ],
  };

  // =====================================================================
  // DECK 5 · reform
  // =====================================================================
  function eventStudy(W, H, years, coef, se, yd, fmt, label, color, ticks, base = 2003, instant = false) {
    const c = L.chart(W, H, { l: 56, r: 16, t: 28, b: 40 }, [years[0] - 0.5, years[years.length - 1] + 0.5], yd);
    L.axisY(c, ticks, fmt, label);
    L.axisX(c, years.filter(y => y % 2 === 0), v => "'" + String(v).slice(2), '');
    c.g.appendChild(L.svg('line', { x1: c.m.l, x2: c.W - c.m.r, y1: c.y(0), y2: c.y(0), stroke: 'var(--ink-3)' }));
    c.g.appendChild(L.svg('line', { x1: c.x(base + 0.5), x2: c.x(base + 0.5), y1: c.m.t, y2: c.H - c.m.b, stroke: 'var(--gain)', 'stroke-dasharray': '4 4' }));
    c.g.appendChild(L.svg('text', { x: c.x(base + 0.5) + 4, y: c.m.t + 10, class: 'lbl', fill: 'var(--gain)', text: 'reform' }));
    const items = years.map((y, i) => {
      const g = L.svg('g', { opacity: 0 });
      g.appendChild(L.svg('line', { x1: c.x(y), x2: c.x(y), y1: c.y(coef[i] - 1.96 * se), y2: c.y(coef[i] + 1.96 * se), stroke: color, 'stroke-width': 2 }));
      g.appendChild(L.svg('circle', { cx: c.x(y), cy: c.y(coef[i]), r: 5, fill: color, stroke: 'var(--paper)', 'stroke-width': 1.5 }));
      c.g.appendChild(g); return g;
    });
    return { svg: c.svg, reveal: (inst) => items.forEach((g, i) => setTimeout(() => g.setAttribute('opacity', 1), (inst || L.reduced()) ? 0 : 120 * i)) };
  }

  const reform = {
    id: 'reform', title: 'Denmark ran the experiment', short: 'The reform',
    slides: [
      {
        title: '2003: the payment rule loosens', layout: 'split',
        prose: `
          <p>In 2003 Denmark allowed <strong>interest-only mortgages</strong>: ten years with no repayment of principal. Monthly payments fell by roughly a fifth. That loosens exactly the income rule from the last deck.</p>
          <p>Uptake was huge. Within a few years, over 60 percent of purchases used one, across the whole income ladder.</p>
          <p class="q">In the fast-growing towns, what happened to the share of low-income buyers?</p>
          <div class="bets" id="bet-share">
            <button class="bet" data-v="up">It rose</button>
            <button class="bet" data-v="flat">Nothing much</button>
            <button class="bet" data-v="down">It fell</button>
          </div>
          <p class="q">And to prices there?</p>
          <div class="bets" id="bet-price">
            <button class="bet" data-v="up">They rose</button>
            <button class="bet" data-v="flat">Nothing much</button>
            <button class="bet" data-v="down">They fell</button>
          </div>`,
        next: null,
        doors: (ctx) => (ctx.getBet('r-share') && ctx.getBet('r-price')) ? [{ to: 'reform/1', label: 'Show me', primary: true, kind: 'next' }] : [],
        stage(el, ctx) {
          const W = 600, H = 300;
          const svg = L.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
          // monthly payment bars before/after
          const bar = (x, h, color, label, val) => {
            svg.appendChild(L.svg('rect', { x, y: 220 - h, width: 120, height: h, fill: color, rx: 4 }));
            svg.appendChild(L.svg('text', { x: x + 60, y: 245, 'text-anchor': 'middle', class: 'lbl', text: label }));
            svg.appendChild(L.svg('text', { x: x + 60, y: 220 - h - 8, 'text-anchor': 'middle', class: 'lbl-mono', text: val }));
          };
          bar(150, 165, 'var(--ink-3)', 'before 2003', 'monthly payment: 100');
          bar(330, 132, 'var(--gain)', 'interest-only, 2003', 'about 80');
          svg.appendChild(L.svg('text', { x: 300, y: 16, 'text-anchor': 'middle', class: 'lbl', text: 'same loan, lower monthly payment' }));
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [svg]));
          const wire = (id, key) => {
            const wrap = document.querySelector('#' + id); if (!wrap) return;
            const paint = () => wrap.querySelectorAll('.bet').forEach(b => b.setAttribute('aria-pressed', ctx.getBet(key) === b.dataset.v ? 'true' : 'false'));
            paint();
            wrap.addEventListener('click', (e) => {
              const b = e.target.closest('.bet'); if (!b) return;
              ctx.bet(key, b.dataset.v); paint(); ctx.refreshDoors();
            });
          };
          wire('bet-share', 'r-share'); wire('bet-price', 'r-price');
        },
      },
      {
        title: 'Prices moved. Buyers did not.', layout: 'stack', nextLabel: 'Why? Run the town yourself',
        prose: (ctx) => {
          const s = ctx.getBet('r-share'), p = ctx.getBet('r-price');
          const echo = (s === 'flat' ? 'You called the buyer share right. ' : s ? 'You expected the buyer share to move. It did not. ' : '') + (p === 'up' ? 'And you called prices right.' : p ? 'Prices, though, rose sharply.' : '');
          return `
          <p>${echo}</p>
          <p>Left: the share of low-income buyers in high-growth municipalities, relative to other places, year by year. The dots sit on zero before the reform and stay there after it. Right: prices in those same municipalities step up.</p>
          <p>Borrowing rose sharply, the paper documents. Prices rose. On average, the mix of who bought in the fast-growing towns did not move, for low, middle, or high incomes.</p>`;
        },
        stage(el, ctx, info) {
          const R = P.reform;
          const a = eventStudy(560, 300, R.years, R.share, R.shareSE, [-0.03, 0.03], v => (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(0) + ' pts', 'low-income share, points, relative to 2003', 'var(--anna)', [-0.02, -0.01, 0, 0.01, 0.02]);
          const b = eventStudy(560, 300, R.years, R.price, R.priceSE, [-0.1, 0.25], v => (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(0) + '%', 'price, relative to 2003', 'var(--gain)', [-0.1, 0, 0.1, 0.2]);
          const grid = L.el('div', { class: 'grid2' }, [
            L.el('div', { class: 'panel' }, [L.el('h3', { text: 'Share of low-income buyers' }), a.svg]),
            L.el('div', { class: 'panel' }, [L.el('h3', { text: 'House prices' }), b.svg]),
          ]);
          el.appendChild(grid);
          el.appendChild(L.el('p', { class: 'caption', text: 'Stylised from the paper\'s event-study figures. High-growth municipalities are the top fifth by 1997 to 2002 price growth. 95% intervals. Pre-reform buyer-share coefficients are jointly indistinguishable from zero.' }));
          a.reveal(info.revisit); b.reveal(info.revisit);
        },
      },
      {
        title: 'The auction', layout: 'stack', stageClass: 'stage-tall', nextLabel: 'What this means',
        prose: `
          <p>Why would more credit change nothing about who buys? Run the town yourself. Eight homes for sale, twenty-four would-be buyers up the income ladder, each bidding up to their ceiling. The top eight bids win, and the price is set where the eighth bid lands.</p>
          <p>Press <strong>loosen credit</strong>, which cuts everyone's payments by a fifth, as the 2003 reform did. Who wins now? Then let builders respond to the price and see who gets in.</p>`,
        stage(el, ctx, info) {
          const bidders = []; const r = L.rng(3);
          for (let i = 0; i < 24; i++) {
            const rank = 6 + i * 4;
            bidders.push({ id: i, rank, income: L.incomeAt(rank) * (0.9 + 0.2 * r()), wealth: L.wealthAt(rank) * (0.7 + 0.6 * r()) });
          }
          const N = 8;
          const base = L.auction(bidders, N);
          let loosened = info.revisit, elastic = false;
          const c = L.chart(900, 330, { l: 56, r: 16, t: 30, b: 44 }, [0, 24], [0, 5e6]);
          L.axisY(c, [0, 1e6, 2e6, 3e6, 4e6, 5e6], v => (v / 1e6) + 'm', 'maximum bid, DKK');
          L.axisX(c, [0.5, 6.5, 12.5, 18.5, 23.5], v => 'rank ' + bidders[Math.floor(v)].rank, 'would-be buyers, by income rank');
          const bw = (c.x(1) - c.x(0)) * 0.72;
          const bars = bidders.map((b, i) => { const e = L.svg('rect', { x: c.x(i) + (c.x(1) - c.x(0) - bw) / 2, width: bw, rx: 3, fill: 'var(--ink-3)' }); e.appendChild(L.svg('title')); c.g.appendChild(e); return e; });
          const pLine = L.svg('line', { x1: c.m.l, x2: c.W - c.m.r, stroke: 'var(--gain)', 'stroke-width': 2.5 });
          const pLbl = L.svg('text', { x: c.m.l + 6, class: 'lbl', fill: 'var(--gain)' });
          c.g.append(pLine, pLbl);
          const status = L.el('p', { class: 'q', style: 'margin:0' });
          const legend = L.el('div', { class: 'legend' });
          legend.appendChild(L.el('span', { style: '--c:var(--anna)', text: 'wins, bottom third' }));
          legend.appendChild(L.el('span', { style: '--c:var(--ink)', text: 'wins, middle third' }));
          legend.appendChild(L.el('span', { style: '--c:var(--bo)', text: 'wins, top third' }));
          legend.appendChild(L.el('span', { style: '--c:var(--paper-3)', text: 'outbid' }));
          let paint = () => {
            const res = L.auction(bidders, N, { payFactor: loosened ? 0.8 : 1, elasticity: elastic ? 1.5 : 0, basePrice: base.price });
            const byId = Object.fromEntries(res.bids.map(b => [b.id, b]));
            bidders.forEach((b, i) => {
              const bid = byId[b.id].bid, win = res.winners.has(b.id);
              const y = c.y(Math.min(bid, 5e6));
              bars[i].setAttribute('y', y); bars[i].setAttribute('height', c.y(0) - y);
              bars[i].setAttribute('fill', win ? (b.rank < 34 ? 'var(--anna)' : b.rank > 66 ? 'var(--bo)' : 'var(--ink)') : 'var(--paper-3)');
              bars[i].setAttribute('stroke', win ? 'none' : 'var(--line)');
              bars[i].firstChild.textContent = `rank ${b.rank} · bids up to ${L.fmtDKK(bid)} · ${win ? 'wins' : 'outbid'}`;
            });
            pLine.setAttribute('y1', c.y(res.price)); pLine.setAttribute('y2', c.y(res.price));
            pLbl.setAttribute('y', c.y(res.price) - 6); pLbl.textContent = `price ${L.fmtDKK(res.price)} · ${res.homes} homes`;
            const winners = bidders.filter(b => res.winners.has(b.id));
            const lowMid = winners.filter(b => b.rank <= 66).length;
            status.innerHTML = `${res.homes} homes sold at <span class="num gain">${L.fmtDKK(res.price)}</span>. Winners below rank 67: <span class="num">${lowMid}</span> of ${res.homes}. Lowest winning rank: <span class="num">${Math.min(...winners.map(b => b.rank))}</span>.`;
          };
          const bLoose = L.el('button', { class: 'btn', text: loosened ? 'Tighten credit again' : 'Loosen credit (payments −20%)' });
          bLoose.addEventListener('click', () => { loosened = !loosened; bLoose.textContent = loosened ? 'Tighten credit again' : 'Loosen credit (payments −20%)'; paint(); });
          const tEl = L.toggle('let builders respond (elastic supply)', false, 'r-elastic');
          tEl.input.addEventListener('change', () => { elastic = tEl.input.checked; paint(); });
          const roofs = bidders.map((b, i) => CD.roof(c.g, { x: +bars[i].getAttribute('x'), w: bw, h: 9 }));
          const sign = CD.solgt(c.g, { text: 'SOLGT', sub: '' });
          const dress = () => {
            let marginal = null, my = -1;
            bidders.forEach((b, i) => { const win = bars[i].getAttribute('stroke') === 'none'; const y = +bars[i].getAttribute('y'); roofs[i].el.setAttribute('fill', bars[i].getAttribute('fill')); roofs[i].set(y, win); if (win && y > my) { my = y; marginal = i; } });
            if (marginal !== null) { sign.set(+bars[marginal].getAttribute('x') + bw / 2, my); sign.g.setText('SOLGT', pLbl.textContent.replace('price ', '').split(' · ')[0]); }
          };
          const paint0 = paint; paint = () => { paint0(); dress(); };
          pLbl.style.display = 'none';
          el.appendChild(L.el('div', { class: 'controls' }, [bLoose, tEl.row]));
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [c.svg]));
          el.appendChild(legend);
          el.appendChild(status);
          el.appendChild(L.el('p', { class: 'caption', text: 'A cartoon of the paper\'s framework, not its data. Coloured bars win. In the data, whether the mix of buyers in high-growth towns shifted after 2003 depended on how local supply responds to prices, which is what the switch imitates: where prices absorbed the extra credit, the mix stayed put.' }));
          paint();
        },
      },
      {
        title: 'More credit, same winners, higher prices', layout: 'center',
        prose: `
          <p>Credit sets the baseline of who can enter a market at all. But when the number of homes cannot grow, more credit for everyone buys the same homes at higher prices. The ranking of bids does not change, so the winners do not either. Sorting by income is where the market settles, not an accident waiting for a policy fix.</p>
          <p>The paper reads the 2003 reform, and a 2016 tightening aimed at Copenhagen and Aarhus, the same way: borrowing capacity moved, prices moved, the income mix of buyers in high-growth towns did not. Higher-income buyers also live in the places where supply is least elastic.</p>
          <p class="note">Other frictions push the same way: people prefer to live near where they grew up, search locally, and commute to jobs that are somewhere in particular. The paper does not claim to isolate one cause. It shows the pattern is consistent with constraints plus inelastic supply, and inconsistent with a simple "loosen credit and they will come".</p>`,
        doors: [
          { to: 'wealth/0', label: 'So what does the shape of the return do to wealth?', hint: 'The main road', kind: 'next' },
          { to: 'elsewhere/0', label: 'Is any of this specific to Denmark?', kind: 'side' },
        ],
      },
    ],
  };

  // =====================================================================
  // DECK 6 · wealth
  // =====================================================================
  const wealth = {
    id: 'wealth', title: 'You cannot put a roof in a savings account', short: 'Wealth',
    slides: [
      {
        title: 'Two forms of the same return', layout: 'split', nextLabel: 'How big a deal is this for wealth?',
        prose: `
          <p>Give Anna and Bo the <em>same</em> total return, by construction. Let ten years pass.</p>
          <p>Price gains pile up as <strong>transferable wealth</strong>: they can be sold, borrowed against, passed on, and in Denmark are untaxed for a primary home. The rental yield arrives as <strong>housing services</strong>: nights slept, a kitchen, a roof. Real, and consumed as it comes. Bo gets more of the first kind, Anna more of the second.</p>
          <p>The dashed boxes are the yield each has lived in: the totals match. The solid part is what can be sold. Doesn't skipping rent leave cash in Anna's account? Compared with renting, yes. But Bo skips rent too. The yield is the roof itself, and you can only bank a roof by living under a smaller one. Try the slider.</p>`,
        stage(el) {
          const price = 1.2e6, T = 10;
          const c = L.chart(600, 300, { l: 60, r: 20, t: 28, b: 40 }, [0, 2], [0, 1.2e6]);
          L.axisY(c, [0, 0.3e6, 0.6e6, 0.9e6, 1.2e6], v => L.fmtDKK(v).replace(' DKK', ''), 'after ten years, DKK · solid = transferable, dashed = consumed');
          const hatch = L.hatch(c.svg, 'h-w', 'var(--yield)');
          const grp = (i, name, color) => {
            const x = c.x(i + 0.5), w = 150;
            const solid = L.svg('rect', { x: x - w / 2, width: w, fill: 'var(--gain)', class: 'brick' });
            const hat = L.svg('rect', { x: x - w / 2, width: w, fill: hatch, stroke: 'var(--yield)' });
            const ghost = L.svg('rect', { x: x - w / 2, width: w, fill: 'none', stroke: 'var(--yield)', 'stroke-dasharray': '5 4', 'stroke-width': 1.5 });
            const gl = L.svg('text', { x, 'text-anchor': 'middle', class: 'lbl', fill: 'var(--yield)' });
            const lbl = L.svg('text', { x, y: c.H - c.m.b + 20, 'text-anchor': 'middle', class: 'lbl-big', fill: color, text: name });
            const v1 = L.svg('text', { x, 'text-anchor': 'middle', class: 'lbl onbar', fill: 'var(--paper)' });
            const v2 = L.svg('text', { x, 'text-anchor': 'middle', class: 'lbl' });
            c.g.append(ghost, solid, hat, lbl, v1, v2, gl); return { solid, hat, v1, v2, ghost, gl };
          };
          const A = grp(0, 'Anna', 'var(--anna)'), B = grp(1, 'Bo', 'var(--bo)');
          const sl = L.slider('share of the rental yield each saves', 0, 60, 0, 5, v => v + '%', 'w-save');
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
              g.v1.setAttribute('y', c.y(gains / 2) + 4); g.v1.textContent = 'price gain ' + L.fmtDKK(gains);
              g.v2.setAttribute('y', c.y(gains + saved) - 6); g.v2.textContent = saved > 1000 ? 'saved rent ' + L.fmtDKK(saved) : '';
            };
            draw(A, L.cg(10), total - L.cg(10)); draw(B, L.cg(90), total - L.cg(90));
          };
          sl.input.addEventListener('input', upd); upd();
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [c.svg]));
          el.appendChild(sl.row);
          el.appendChild(L.el('p', { class: 'caption', html: `A ${L.fmtDKK(price)} home, the same total return for both by construction, split using the paper's slopes. Even if both saved half their yield, which would mean living in far less home, Bo's pile is larger.` }));
        },
      },
      {
        title: 'How much of the wealth gap is this?', layout: 'stack', stageClass: 'stage-tall', nextLabel: 'What we learned',
        prose: `
          <p>Rich and poor households earn different returns on everything they own, not just houses. How much of the total wealth-return gap between the 90th and 10th income percentiles comes from housing?</p>
          <p>This is the paper's calculation, with every input exposed. Change any number and the bars follow. Drag the two housing returns to the same value to see what the gap would be without the housing gradient.</p>`,
        stage(el) {
          const D = P.portfolio;
          let shares = JSON.parse(JSON.stringify(D.DK));
          const rets = { housing: [...D.returns.housing], financial: [...D.returns.financialPassiveDK], pension: [...D.returns.pension] };
          const mk = (label, arr, i, min, max, step, fmt, id) => { const s = L.slider(label, min, max, arr[i], step, fmt, id); s.input.addEventListener('input', () => { arr[i] = +s.input.value; paint(); }); return s; };
          const left = L.el('div', { class: 'panel' }, [L.el('h3', { text: 'Portfolio shares, P10 → P90' })]);
          const right = L.el('div', { class: 'panel' }, [L.el('h3', { text: 'Real returns, % per year, P10 → P90' })]);
          const sliders = [];
          const rebuild = () => {
            left.replaceChildren(L.el('h3', { text: 'Portfolio shares, P10 → P90' }));
            const pre = L.el('div', { class: 'controls' });
            for (const [k, lab] of [['DK', 'Denmark 2014–19'], ['US', 'US SCF 2013']]) {
              const b = L.el('button', { class: 'chip', text: lab, 'aria-pressed': JSON.stringify(shares) === JSON.stringify(D[k]) ? 'true' : 'false' });
              b.addEventListener('click', () => { shares = JSON.parse(JSON.stringify(D[k])); rets.financial = [...(k === 'DK' ? D.returns.financialPassiveDK : D.returns.financialPassiveUS)]; rebuild(); paint(); });
              pre.appendChild(b);
            }
            left.appendChild(pre);
            for (const a of ['housing', 'financial', 'pension']) {
              left.appendChild(mk(a + ' P10', shares[a], 0, 0, 1, 0.01, v => Math.round(v * 100) + '%', 'ps-' + a + '0').row);
              left.appendChild(mk(a + ' P90', shares[a], 1, 0, 1, 0.01, v => Math.round(v * 100) + '%', 'ps-' + a + '1').row);
            }
            right.replaceChildren(L.el('h3', { text: 'Real returns, % per year, P10 → P90' }));
            for (const a of ['housing', 'financial', 'pension']) {
              right.appendChild(mk(a + ' P10', rets[a], 0, -2, 8, 0.1, v => v.toFixed(1), 'pr-' + a + '0').row);
              right.appendChild(mk(a + ' P90', rets[a], 1, -2, 8, 0.1, v => v.toFixed(1), 'pr-' + a + '1').row);
            }
          };
          const W = 900, H = 150;
          const svg = L.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
          const x0 = 420, sc = 130; // px per pp
          svg.appendChild(L.svg('line', { x1: x0, x2: x0, y1: 10, y2: H - 10, stroke: 'var(--ink-3)' }));
          const rows = ['housing', 'financial', 'pension', 'total'].map((k, i) => {
            const y = 14 + i * 32;
            svg.appendChild(L.svg('text', { x: 20, y: y + 15, class: 'lbl', text: k === 'total' ? 'Total gap' : k }));
            const bar = L.svg('rect', { y, height: 22, rx: 3, fill: k === 'housing' ? 'var(--gain)' : k === 'total' ? 'var(--ink)' : 'var(--ink-3)' });
            const v = L.svg('text', { y: y + 15, class: 'lbl-mono' });
            svg.append(bar, v); return { bar, v };
          });
          const note = L.el('p', { class: 'caption' });
          const paint = () => {
            // shares need not sum to one after edits; we normalise silently and say so
            const norm = (i) => { const s = shares.housing[i] + shares.financial[i] + shares.pension[i]; return s > 0 ? s : 1; };
            const contrib = {};
            for (const a of ['housing', 'financial', 'pension']) contrib[a] = (shares[a][1] / norm(1)) * rets[a][1] - (shares[a][0] / norm(0)) * rets[a][0];
            contrib.total = contrib.housing + contrib.financial + contrib.pension;
            ['housing', 'financial', 'pension', 'total'].forEach((k, i) => {
              const v = contrib[k], w = Math.abs(v) * sc;
              rows[i].bar.setAttribute('x', v >= 0 ? x0 : x0 - w); rows[i].bar.setAttribute('width', Math.min(w, 460));
              rows[i].v.setAttribute('x', v >= 0 ? x0 + Math.min(w, 460) + 6 : x0 - Math.min(w, 460) - 6); rows[i].v.setAttribute('text-anchor', v >= 0 ? 'start' : 'end');
              rows[i].v.textContent = L.fmtPP(v);
            });
            note.innerHTML = `Contribution of asset <em>a</em> = share<sub>P90</sub>·return<sub>P90</sub> − share<sub>P10</sub>·return<sub>P10</sub>, in percentage points a year. Shares are normalised to sum to one. Housing is currently <span class="num">${L.fmtPP(contrib.housing)}</span> of a <span class="num">${L.fmtPP(contrib.total)}</span> total. The paper reports housing at about 1.1 to 1.3 pp, the largest single contributor across six calibrations.`;
          };
          rebuild(); paint();
          el.appendChild(L.el('div', { class: 'chart-wrap', style: 'flex:0 0 auto' }, [svg]));
          el.appendChild(note);
          el.appendChild(L.el('p', { class: 'eyebrow', text: 'change the inputs:' }));
          el.appendChild(L.el('div', { class: 'grid2', style: 'flex:0 0 auto' }, [left, right]));
        },
      },
      {
        title: 'What we learned', layout: 'stack',
        stage(el) { const j = CD.roofAndCoin(200); j.style.height = '100%'; j.style.width = 'auto'; j.style.alignSelf = 'center'; el.appendChild(j); el.appendChild(L.el('p', { class: 'caption', style: 'text-align:center', text: 'You cannot put a roof in a savings account.' })); },
        prose: `
          <p>Bo's home rose in price faster than Anna's, by about 1.4 points a year. <a data-go="gap/0" href="#gap/0">The gap</a>.</p>
          <p>Almost all of that is where they bought, not what or when. Inside a town, richer buyers do no better. <a data-go="why/1" href="#why/1">Why</a>.</p>
          <p>Where Anna bought, rents are high next to prices. Add the rent she never paid and their total returns are about equal. <a data-go="yield/2" href="#yield/2">The other half</a>.</p>
          <p>Their feasible sets differ. A home is bought whole, and the bank's income rule shrinks the set of whole homes Anna can reach, most of all in the fast-growing towns. The paper shows this is consistent with the sorting, not that it is the only cause. <a data-go="feasible/2" href="#feasible/2">The feasible set</a>.</p>
          <p>Loosening credit did not change who got in. With supply fixed, it raised prices instead. <a data-go="reform/2" href="#reform/2">The auction</a>.</p>
          <p>So the total return to housing is roughly equal but its shape is not. Price gains become wealth. Housing services get lived in. <a data-go="wealth/0" href="#wealth/0">The roof</a>.</p>
          <p class="note">Open questions the paper leaves on the table: whether these place-based gains persist beyond 1996 to 2022, how much of location is choice rather than constraint, and whether the same places also pay off through schools and jobs.</p>`,
        doors: [
          { to: 'sandbox/0', label: 'Build your own housing market', hint: 'The sandbox', kind: 'next' },
          { to: 'measure/3', label: 'What this cannot tell you', kind: 'side' },
        ],
      },
    ],
  };

  // =====================================================================
  // DECK S · sandbox
  // =====================================================================
  const sandbox = {
    id: 'sandbox', title: 'Your Denmark', short: 'Sandbox',
    slides: [
      {
        title: 'Build a housing market', layout: 'stack', stageClass: 'stage-tall',
        prose: `
          <p>The auction with every knob exposed, and Anna's reach into the fast-growing places as a readout. Who ends up owning in the fast-growing town under your rules?</p>
          <p class="note">Where the cartoon breaks: prices elsewhere are held fixed, nobody moves for a job, nobody inherits a down payment, and everything is realized rather than expected return. The paper's own list of caveats is in <a data-go="measure/3" href="#measure/3">the methods room</a>.</p>`,
        doors: [{ to: 'start/0', label: 'Back to the beginning', kind: 'back' }],
        stage(el) {
          const opts = { down: 0.20, pti: 0.35, rate: 0.04, payFactor: 1, elasticity: 0, homes: 8, minSize: 0 };
          const r = L.rng(5);
          const bidders = []; for (let i = 0; i < 24; i++) { const rank = 6 + i * 4; bidders.push({ id: i, rank, income: L.incomeAt(rank) * (0.9 + 0.2 * r()), wealth: L.wealthAt(rank) * (0.7 + 0.6 * r()) }); }
          const auc = (o) => {
            const bids = bidders.map(b => ({ ...b, bid: L.borrow(b.income, b.wealth, { down: o.down, pti: o.pti, rate: o.rate, payFactor: o.payFactor }).max })).sort((a, b) => b.bid - a.bid);
            const p0 = bids[o.homes - 1].bid;
            let homes = o.homes, price = p0;
            if (o.elasticity > 0) { for (let it = 0; it < 30; it++) { homes = L.clamp(Math.round(o.homes * Math.pow(price / basePrice, o.elasticity)), 1, 24); const p2 = bids[homes - 1].bid; if (Math.abs(p2 - price) < 1) break; price = (price + p2) / 2; } price = bids[homes - 1].bid; }
            return { bids, homes, price, winners: new Set(bids.slice(0, homes).map(b => b.id)) };
          };
          const basePrice = auc({ ...opts, elasticity: 0 }).price;
          const c = L.chart(900, 300, { l: 56, r: 16, t: 30, b: 44 }, [0, 24], [0, 6e6]);
          L.axisY(c, [0, 2e6, 4e6, 6e6], v => (v / 1e6) + 'm', 'maximum bid, DKK');
          L.axisX(c, [0.5, 6.5, 12.5, 18.5, 23.5], v => 'rank ' + bidders[Math.floor(v)].rank, 'would-be buyers, by income rank');
          const bw = (c.x(1) - c.x(0)) * 0.72;
          const bars = bidders.map((b, i) => { const e = L.svg('rect', { x: c.x(i) + (c.x(1) - c.x(0) - bw) / 2, width: bw, rx: 3 }); c.g.appendChild(e); return e; });
          const pLine = L.svg('line', { x1: c.m.l, x2: c.W - c.m.r, stroke: 'var(--gain)', 'stroke-width': 2.5 }), pLbl = L.svg('text', { x: c.m.l + 6, class: 'lbl', fill: 'var(--gain)' });
          c.g.append(pLine, pLbl);
          const status = L.el('p', { class: 'q', style: 'margin:0' });
          const paint = () => {
            const res = auc(opts);
            const byId = Object.fromEntries(res.bids.map(b => [b.id, b]));
            bidders.forEach((b, i) => { const bid = byId[b.id].bid, win = res.winners.has(b.id); const y = c.y(Math.min(bid, 6e6)); bars[i].setAttribute('y', y); bars[i].setAttribute('height', c.y(0) - y); bars[i].setAttribute('fill', win ? (b.rank < 34 ? 'var(--anna)' : b.rank > 66 ? 'var(--bo)' : 'var(--ink)') : 'var(--paper-3)'); bars[i].setAttribute('stroke', win ? 'none' : 'var(--line)'); });
            pLine.setAttribute('y1', c.y(res.price)); pLine.setAttribute('y2', c.y(res.price)); pLbl.setAttribute('y', c.y(res.price) - 6); pLbl.textContent = `price ${L.fmtDKK(res.price)} · ${res.homes} homes`;
            const winners = bidders.filter(b => res.winners.has(b.id));
            const share = L.feasibleShare(L.borrow(L.HH.anna.income, L.HH.anna.wealth, opts).max, { minSize: opts.minSize, highGrowth: true });
            status.innerHTML = `${res.homes} homes at <span class="num gain">${L.fmtDKK(res.price)}</span>. Lowest winning rank <span class="num">${Math.min(...winners.map(b => b.rank))}</span>. Anna's feasible share of high-growth homes: <span class="num">${Math.round(share * 100)}%</span>.`;
          };
          const S = (label, key, min, max, step, fmt, id) => { const s = L.slider(label, min, max, opts[key], step, fmt, id); s.input.addEventListener('input', () => { opts[key] = +s.input.value; paint(); }); return s.row; };
          const left = L.el('div', { class: 'panel' }, [L.el('h3', { text: 'Credit rules' }),
            S('down payment', 'down', 0.05, 0.4, 0.01, v => Math.round(v * 100) + '%', 'sb-down'),
            S('payment cap, share of income', 'pti', 0.15, 0.6, 0.01, v => Math.round(v * 100) + '%', 'sb-pti'),
            S('mortgage rate', 'rate', 0.005, 0.09, 0.0025, v => (v * 100).toFixed(2) + '%', 'sb-rate'),
            S('monthly payment per krone borrowed', 'payFactor', 0.6, 1, 0.05, v => v.toFixed(2), 'sb-pf'),
            L.el('p', { class: 'caption', text: 'Payment 0.8 means a fifth lower monthly payments for the same loan, as interest-only mortgages gave.' })]);
          const right = L.el('div', { class: 'panel' }, [L.el('h3', { text: 'The town' }),
            S('homes for sale', 'homes', 2, 20, 1, v => String(v), 'sb-homes'),
            S('supply elasticity', 'elasticity', 0, 3, 0.1, v => v.toFixed(1), 'sb-el'),
            S('minimum size Anna needs', 'minSize', 0, 150, 5, v => v + ' m²', 'sb-size'),
            L.el('p', { class: 'caption', text: 'Elasticity 0: no new homes however high prices go. 2: the number of homes rises twice as fast as the price.' })]);
          el.appendChild(L.el('div', { class: 'grid2', style: 'flex:0 0 auto' }, [left, right]));
          el.appendChild(L.el('div', { class: 'chart-wrap', style: 'flex:0 0 auto' }, [c.svg]));
          el.appendChild(status);
          paint();
        },
      },
    ],
  };

  window.DECKS.push(feasible, reform, wealth, sandbox);
})();
