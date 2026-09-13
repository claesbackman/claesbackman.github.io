/* decks/a-trunk.js — start, gap, why, yield */
(function () {
  const L = window.LIB, P = L.PAPER;
  const annaHouse = (s, o) => L.house('var(--anna)', s, o), boHouse = (s, o) => L.house('var(--bo)', s, o);

  // =====================================================================
  // DECK 0 · start
  // =====================================================================
  const start = {
    id: 'start', title: 'Two buyers, one country', short: 'Two buyers',
    slides: [
      {
        title: 'Where the Money Lives', hideTitle: true, layout: 'wide',
        prose: `
          <h1 style="font-size:clamp(2.4rem,6vw,4.2rem)">Where the Money Lives</h1>
          <p class="lead">An explorable about who gets what from owning a home, built from Danish registers that record every home sale since 1996, and the 218,000 homes that sold twice.</p>
          <p class="muted small">Based on <em>Housing Returns over the Income Distribution</em> by Claes Bäckman, Walter D'Lima and Natalia Khorunzhina. Nothing here needs prior economics. Press <span class="kbd">m</span> at any time for the map.</p>`,
        doors: [{ to: 'start/1', label: 'Meet two buyers', primary: true, kind: 'next' }],
        stage(el) {
          // skyline: one continuous line from farmhouse to rowhouse
          el.classList.add('stage-skyline');
          if (window.CD && CD.skyline) { el.appendChild(L.el('div', { class: 'chart-wrap' }, [CD.skyline(1000, 300)])); return; }
          const W = 1000, H = 300;
          const svg = L.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', 'aria-label': 'A skyline drawn as one line, from a farmhouse to city rowhouses' });
          let d = 'M0 240 ';
          let x = 0; const r = L.rng(7);
          const shapes = [];
          while (x < W) {
            const t = x / W; // 0 rural → 1 capital
            const w = L.lerp(120, 44, t) * (0.8 + 0.4 * r());
            const h = L.lerp(50, 150, t) * (0.75 + 0.5 * r());
            const roof = L.lerp(0.9, 0.25, t);
            shapes.push({ x, w, h, roof });
            x += w + L.lerp(30, 4, t);
          }
          for (const s of shapes) {
            const top = 240 - s.h, peak = top - s.w * roof2(s.roof);
            d += `L${s.x} 240 L${s.x} ${top} L${s.x + s.w / 2} ${peak} L${s.x + s.w} ${top} L${s.x + s.w} 240 `;
          }
          function roof2(k) { return 0.5 * k; }
          d += `L${W} 240`;
          const path = L.svg('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.2, 'stroke-linejoin': 'round' });
          svg.appendChild(path);
          // colour wash: gains in the city, yield in the country
          const g1 = L.svg('linearGradient', { id: 'sky-g', x1: 0, x2: 1, y1: 0, y2: 0 });
          g1.appendChild(L.svg('stop', { offset: 0, 'stop-color': 'var(--yield)', 'stop-opacity': .25 }));
          g1.appendChild(L.svg('stop', { offset: 1, 'stop-color': 'var(--gain)', 'stop-opacity': .25 }));
          const defs = L.svg('defs'); defs.appendChild(g1); svg.insertBefore(defs, svg.firstChild);
          svg.insertBefore(L.svg('path', { d: d + ' Z', fill: 'url(#sky-g)' }), path);
          svg.appendChild(L.svg('text', { x: 8, y: 270, class: 'axis-label', text: 'Rural Jutland' }));
          svg.appendChild(L.svg('text', { x: W - 8, y: 270, class: 'axis-label', 'text-anchor': 'end', text: 'Central Copenhagen' }));
          // draw-in
          const len = path.getTotalLength ? path.getTotalLength() : 4000;
          path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
          if (L.reduced()) { path.style.strokeDashoffset = 0; } else {
            path.style.transition = 'stroke-dashoffset 2.4s ease-out';
            requestAnimationFrame(() => requestAnimationFrame(() => { path.style.strokeDashoffset = 0; }));
          }
          const wrap = L.el('div', { class: 'chart-wrap' }, [svg]);
          el.appendChild(wrap);
        },
      },
      {
        title: 'Two buyers, one country', layout: 'split',
        prose: `
          <p><span class="anna"><strong>Anna</strong></span> earns less than nine in ten Danes her age. <span class="bo"><strong>Bo</strong></span> earns more than nine in ten.</p>
          <p>Both bought a home in 2005 and sold it ten years later. Both did fine. Neither did anything clever.</p>
          <p class="q">Who earned more from owning a home?</p>
          <div class="bets" id="bet-start">
            <button class="bet anna" data-v="anna">Anna</button>
            <button class="bet bo" data-v="bo">Bo</button>
            <button class="bet" data-v="same">About the same</button>
          </div>
          <p class="muted small">Pick one. There is no wrong bet, and we will come back to yours.</p>`,
        next: null,
        doors: (ctx) => ctx.getBet('start') ? [{ to: 'start/2', label: 'Show me', primary: true, kind: 'next' }] : [],
        stage(el, ctx) {
          const W = 600, H = 360;
          const svg = L.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
          const put = (house, x, y, name, sub, color) => {
            const g = L.svg('g', { transform: `translate(${x},${y})` });
            const fo = L.svg('foreignObject', { x: -70, y: 0, width: 140, height: 140 });
            const div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
            div.style.display = 'flex'; div.style.justifyContent = 'center'; div.appendChild(house);
            fo.appendChild(div); g.appendChild(fo);
            g.appendChild(L.svg('text', { x: 0, y: 165, 'text-anchor': 'middle', class: 'lbl-big', text: name, fill: color }));
            g.appendChild(L.svg('text', { x: 0, y: 186, 'text-anchor': 'middle', class: 'lbl-mono', text: sub }));
            svg.appendChild(g);
          };
          put(annaHouse(130, { fill: true }), 160, 60, 'Anna', '10th income percentile', 'var(--anna)');
          put(boHouse(130, { fill: true }), 440, 60, 'Bo', '90th income percentile', 'var(--bo)');
          svg.appendChild(L.svg('text', { x: W / 2, y: 300, 'text-anchor': 'middle', class: 'lbl', text: 'bought 2005 · sold 2015' }));
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [svg]));
          // bets live in prose; wire them
          const wrap = document.querySelector('#bet-start');
          const paint = () => wrap.querySelectorAll('.bet').forEach(b => b.setAttribute('aria-pressed', ctx.getBet('start') === b.dataset.v ? 'true' : 'false'));
          paint();
          wrap.addEventListener('click', (e) => {
            const b = e.target.closest('.bet'); if (!b) return;
            ctx.bet('start', b.dataset.v); paint(); ctx.refreshDoors();
          });
        },
      },
      {
        title: 'It depends what you count', layout: 'split',
        prose: (ctx) => {
          const b = ctx.getBet('start');
          const echo = b === 'bo' ? 'You bet on Bo. Watch the first bars.' : b === 'anna' ? 'You bet on Anna. Hold on until the second bars grow.' : b === 'same' ? 'You bet on a tie. Hold on until the second bars grow.' : '';
          return `
          <p>${echo}</p>
          <p><strong>Bo's home rose in price faster.</strong> About <span class="num gain">1.4 percentage points</span> a year faster, which over ten years is roughly <span class="num gain">15 percent</span> more.</p>
          <p><strong>But</strong> a home pays you a second way: every month you live in it, you skip the rent you would otherwise pay. Economists call that stream the <span class="yield">rental yield</span>. Where Anna bought, it is large next to the price. Where Bo bought, it is small. Count both and they land in about the same place.</p>
          <p class="q">It depends what you count. And what you count turns out to be the whole story.</p>`;
        },
        doors: [
          { to: 'gap/0', label: 'Why did Bo\'s price rise faster?', hint: 'The main road', kind: 'next' },
          { to: 'yield/0', label: 'What is a rental yield, exactly?', hint: 'What the thatched roof means', kind: 'side' },
          { to: 'measure/0', label: 'How do you even measure this?', hint: 'The methods room', kind: 'side' },
        ],
        stage(el, ctx, info) {
          const W = 600, H = 380, base = 320, top = 40;
          const svg = L.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
          const hatchA = L.hatch(svg, 'h-anna', 'var(--yield)');
          const hatchB = L.hatch(svg, 'h-bo', 'var(--yield)');
          const scale = (v) => v / 10 * (base - top); // 10% per year = full height
          const cgA = L.cg(10), cgB = L.cg(90), yA = L.yieldOf(10), yB = L.yieldOf(90);
          const bars = [
            { x: 150, cg: cgA, y: yA, color: 'var(--anna)', hatch: hatchA, name: 'Anna' },
            { x: 400, cg: cgB, y: yB, color: 'var(--bo)', hatch: hatchB, name: 'Bo' },
          ];
          const els = [];
          for (const b of bars) {
            const hb = CD.houseBar(svg, { x: b.x, w: 100, base });
            hb.set(0, 0);
            const t1 = L.svg('text', { x: b.x, y: base + 22, 'text-anchor': 'middle', class: 'lbl-big', text: b.name, fill: b.color });
            const v1 = L.svg('text', { x: b.x + 60, y: base, class: 'lbl-mono', text: '' });
            const v2 = L.svg('text', { x: b.x + 60, y: base, class: 'lbl-mono', text: '', fill: 'var(--yield)' });
            const tot = L.svg('text', { x: b.x, y: base, 'text-anchor': 'middle', class: 'lbl', text: '', opacity: 0 });
            svg.append(t1, v1, v2, tot);
            els.push({ b, hb, v1, v2, tot, ky: 0 });
          }
          svg.appendChild(L.svg('line', { x1: 60, x2: W - 40, y1: base, y2: base, stroke: 'var(--line)' }));
          const leg = L.el('div', { class: 'legend' });
          leg.appendChild(L.el('span', { style: '--c:var(--gain)', text: 'price gain, % per year' }));
          leg.appendChild(L.el('span', { class: 'hatched', style: '--c:var(--yield)', text: 'rental yield: rent not paid, % of price per year' }));
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [svg]));
          el.appendChild(leg);
          const cap = L.el('p', { class: 'caption', html: 'Slopes are the paper\'s estimates. Levels are stylised around the sample averages. <a data-go="measure/0" href="#measure/0">Details</a>.' });
          el.appendChild(cap);

          const drawCG = (k) => els.forEach((e) => {
            const { b, hb, v1 } = e; const h = scale(b.cg) * k; hb.set(h, scale(b.y) * e.ky);
            v1.setAttribute('y', base - h / 2 + 4); v1.textContent = L.fmtPct(b.cg * k, 1);
          });
          const drawY = (k) => els.forEach((e) => {
            const { b, hb, v2, tot } = e; e.ky = k;
            const h0 = scale(b.cg), h = scale(b.y) * k; hb.set(h0, h);
            v2.setAttribute('y', base - h0 - h / 2 + 4); v2.textContent = k > 0.05 ? L.fmtPct(b.y * k, 1) : '';
            tot.setAttribute('y', hb.top(h0, h) - 8); tot.textContent = 'total about ' + Math.round(b.cg + b.y * k) + '%'; tot.setAttribute('opacity', k);
          });
          if (info.revisit) { drawCG(1); drawY(1); return; }
          L.tween(0, 1, 1200, drawCG, () => setTimeout(() => L.tween(0, 1, 1600, drawY), 1400));
        },
      },
    ],
  };

  // =====================================================================
  // DECK 1 · gap
  // =====================================================================
  const gap = {
    id: 'gap', title: 'The gap is real, and it compounds', short: 'The gap',
    slides: [
      {
        title: 'Price gains climb with income', layout: 'split', nextLabel: 'Does a point a year matter?',
        prose: `
          <p>Line up every buyer who later sold, by income, and ask how fast their home's price rose, in real terms, per year they owned it.</p>
          <p class="muted small">"Points" here are percentage points: the difference between, say, 3% and 4% a year is one point.</p>
          <p>The dots climb almost in a straight line. Drag the handle along the bottom to read any buyer.</p>
          <p class="note">Each rank is a percentile of household income among people the same age. Rank 10 means nine in ten earn more.</p>`,
        stage(el) {
          const c = L.chart(600, 360, { l: 52, r: 20, t: 30, b: 44 }, [0, 100], [1.5, 6]);
          L.axisY(c, [2, 3, 4, 5, 6], v => v + '%', 'price gain, % per year (real)');
          L.axisX(c, [0, 20, 40, 60, 80, 100], v => v, 'income rank');
          const r = L.rng(11);
          for (let k = 2; k <= 98; k += 2) {
            const dens = 0.35 + k / 100; // buyers are sparse at low ranks
            const v = L.cg(k) + L.randn(r) * 0.22 / Math.sqrt(dens);
            c.g.appendChild(L.svg('circle', { cx: c.x(k), cy: c.y(v), r: 4, fill: 'var(--gain)', 'fill-opacity': .75 }));
          }
          c.g.appendChild(L.svg('path', { d: L.linePath([[c.x(0), c.y(L.cg(0))], [c.x(100), c.y(L.cg(100))]]), stroke: 'var(--ink)', 'stroke-width': 2, fill: 'none', 'stroke-dasharray': '3 4' }));
          // handle
          const hx = L.svg('line', { x1: 0, x2: 0, y1: c.m.t, y2: c.H - c.m.b, stroke: 'var(--ink)', 'stroke-width': 1.5 });
          const dot = L.svg('circle', { r: 7, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 2.5 });
          const card = L.svg('g');
          const cardBg = L.svg('rect', { width: 190, height: 44, rx: 6, fill: 'var(--paper)', stroke: 'var(--line)' });
          const t1 = L.svg('text', { x: 10, y: 18, class: 'lbl' }), t2 = L.svg('text', { x: 10, y: 35, class: 'lbl-mono' });
          card.append(cardBg, t1, t2);
          c.g.append(hx, dot, card);
          const set = (rank) => {
            rank = L.clamp(Math.round(rank), 0, 100);
            const x = c.x(rank), y = c.y(L.cg(rank));
            hx.setAttribute('x1', x); hx.setAttribute('x2', x); dot.setAttribute('cx', x); dot.setAttribute('cy', y);
            const cx = L.clamp(x + 12, c.m.l, c.W - c.m.r - 190);
            card.setAttribute('transform', `translate(${cx},${c.m.t})`);
            t1.textContent = `A buyer at rank ${rank}`; t2.textContent = `gains ≈ ${L.fmtPct(L.cg(rank), 1)} a year`;
          };
          set(37);
          const drag = (e) => { const pt = c.svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(c.svg.getScreenCTM().inverse()); set(c.x.invert(p.x)); };
          let down = false;
          c.svg.style.cursor = 'ew-resize'; c.svg.style.touchAction = 'none';
          c.svg.addEventListener('pointerdown', (e) => { down = true; drag(e); });
          c.svg.addEventListener('pointermove', (e) => { if (down) drag(e); });
          const up = () => { down = false; };
          window.addEventListener('pointerup', up);
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [c.svg]));
          const sl = L.slider('income rank', 0, 100, 37, 1, v => String(v), 'gap-rank');
          sl.input.addEventListener('input', () => set(+sl.input.value));
          c.svg.addEventListener('pointermove', () => { sl.input.value = Math.round(c.x.invert(+dot.getAttribute('cx'))); sl.out.textContent = sl.input.value; });
          el.appendChild(sl.row);
          el.appendChild(L.el('p', { class: 'caption', html: 'Dots are stylised. The dashed line is the paper\'s estimated slope: <span class="num">0.017</span> points of yearly gain per rank point, so the 90th percentile gains about <span class="num">1.36</span> points a year more than the 10th.' }));
          return () => window.removeEventListener('pointerup', up);
        },
      },
      {
        title: 'Small yearly gaps become large piles', layout: 'split', nextLabel: 'So why did Bo\'s home gain more?',
        prose: `
          <p>A point and a bit per year sounds like nothing. Prices compound, so the gap does too.</p>
          <p>Slide the holding period. Anna's and Bo's homes start at the same price.</p>
          <p>Around ten years, the difference is about <span class="num gain">15 percent</span> of the home's value. On a typical Danish home that is several hundred thousand kroner that Bo has and Anna does not.</p>`,
        stage(el) {
          const c = L.chart(600, 340, { l: 60, r: 24, t: 24, b: 44 }, [0, 20], [1, 2.4]);
          L.axisY(c, [1, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4], v => '×' + v.toFixed(1), 'value relative to purchase');
          L.axisX(c, [0, 5, 10, 15, 20], v => v + 'y', 'years owned');
          const pa = L.svg('path', { fill: 'none', stroke: 'var(--anna)', 'stroke-width': 2.5 });
          const pb = L.svg('path', { fill: 'none', stroke: 'var(--bo)', 'stroke-width': 2.5 });
          const gapLine = L.svg('line', { stroke: 'var(--gain)', 'stroke-width': 2 });
          const gapLbl = L.svg('text', { class: 'lbl', fill: 'var(--gain)' });
          const la = L.svg('text', { class: 'lbl', fill: 'var(--anna)', text: 'Anna' }), lb = L.svg('text', { class: 'lbl', fill: 'var(--bo)', text: 'Bo' });
          c.g.append(pa, pb, gapLine, gapLbl, la, lb);
          const cgA = L.cg(10) / 100, cgB = L.cg(90) / 100;
          const draw = (T) => {
            const ptsA = [], ptsB = [];
            for (let t = 0; t <= T + 1e-9; t += 0.25) { ptsA.push([c.x(t), c.y(Math.exp(cgA * t))]); ptsB.push([c.x(t), c.y(Math.exp(cgB * t))]); }
            pa.setAttribute('d', L.linePath(ptsA)); pb.setAttribute('d', L.linePath(ptsB));
            const yA = Math.exp(cgA * T), yB = Math.exp(cgB * T);
            gapLine.setAttribute('x1', c.x(T)); gapLine.setAttribute('x2', c.x(T)); gapLine.setAttribute('y1', c.y(yA)); gapLine.setAttribute('y2', c.y(yB));
            const pct = (yB / yA - 1) * 100;
            gapLbl.setAttribute('x', L.clamp(c.x(T) + 8, c.m.l, c.W - 90)); gapLbl.setAttribute('y', (c.y(yA) + c.y(yB)) / 2 + 4);
            gapLbl.textContent = T > 0 ? `+${pct.toFixed(0)}%` : '';
            la.setAttribute('x', L.clamp(c.x(T) + 8, c.m.l, c.W - 40)); la.setAttribute('y', c.y(yA) + 14);
            lb.setAttribute('x', L.clamp(c.x(T) + 8, c.m.l, c.W - 40)); lb.setAttribute('y', c.y(yB) - 6);
          };
          const sl = L.slider('years owned', 1, 20, 10, 1, v => v + ' y', 'gap-years');
          sl.input.addEventListener('input', () => draw(+sl.input.value));
          draw(10);
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [c.svg]));
          el.appendChild(sl.row);
          el.appendChild(L.el('p', { class: 'caption', html: `Anna's home grows <span class="num">${L.fmtPct(L.cg(10), 2)}</span> a year, Bo's <span class="num">${L.fmtPct(L.cg(90), 2)}</span>, continuously compounded.` }));
        },
      },
      {
        title: 'Four kinds of reasons', layout: 'stack',
        prose: `
          <p>Bo's price could have risen faster for four kinds of reasons. Each house on this street is one of them. Pick the one you suspect most.</p>
          <p class="muted small">We remember your pick and check it against the evidence in a moment.</p>`,
        doors: [],
        stage(el, ctx) {
          const street = L.el('div', { class: 'street' });
          const items = [
            { to: 'why/0', key: 'what', label: 'What he bought', sub: 'Apartments, size, age of the building' },
            { to: 'why/0', key: 'who', label: 'Who he is', sub: 'Age, wealth, education, gender' },
            { to: 'why/0', key: 'when', label: 'When he bought and sold', sub: 'Timing the market' },
            { to: 'why/0', key: 'where', label: 'Where he bought', sub: 'The town, the postcode' },
          ];
          items.forEach((it, i) => {
            const a = L.el('a', { href: '#' + it.to, 'data-go': it.to });
            a.addEventListener('click', () => ctx.bet('suspect', it.key));
            const col = 'var(--ink-2)';
            a.appendChild(L.house(col, 96, { fill: true, face: false }));
            a.appendChild(L.el('span', { text: it.label }));
            a.appendChild(L.el('small', { text: it.sub }));
            street.appendChild(a);
          });
          el.style.justifyContent = 'center';
          el.appendChild(street);
        },
      },
    ],
  };

  // =====================================================================
  // DECK 2 · why
  // =====================================================================
  const why = {
    id: 'why', title: 'The detective\'s rule', short: 'Why',
    slides: [
      {
        title: 'A suspect needs two things', layout: 'split', nextLabel: 'Test the suspects',
        prose: `
          <p>Before we test anything, one rule decides everything.</p>
          <p>A factor can account for the gap between Anna and Bo only if it does <strong>two things at once</strong>: it must <span class="gain">predict price gains</span>, and it must <span class="bo">differ between Anna and Bo</span>.</p>
          <p>Turn either dial to zero and the factor explains nothing, however big the other dial is. The two multiply.</p>`,
        stage(el) {
          const s1 = L.slider('how strongly it predicts price gains', 0, 100, 70, 1, v => v + '%', 'why-d1');
          const s2 = L.slider('how different Anna and Bo are on it', 0, 100, 60, 1, v => v + '%', 'why-d2');
          const W = 600, H = 200;
          const svg = L.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
          const bg = L.svg('rect', { x: 40, y: 70, width: 520, height: 44, rx: 6, fill: 'var(--paper-2)', stroke: 'var(--line)' });
          const bar = L.svg('rect', { x: 40, y: 70, width: 0, height: 44, rx: 6, fill: 'var(--gain)' });
          const lbl = L.svg('text', { x: 40, y: 56, class: 'lbl', text: 'share of the gap this factor could explain' });
          const val = L.svg('text', { x: 560, y: 140, 'text-anchor': 'end', class: 'lbl-big' });
          svg.append(bg, bar, lbl, val);
          const upd = () => {
            const k = (+s1.input.value / 100) * (+s2.input.value / 100);
            bar.setAttribute('width', 520 * k); val.textContent = Math.round(k * 100) + '%';
            val.setAttribute('fill', k < 0.05 ? 'var(--ink-3)' : 'var(--ink)');
          };
          s1.input.addEventListener('input', upd); s2.input.addEventListener('input', upd); upd();
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [svg]));
          el.appendChild(s1.row); el.appendChild(s2.row);
          el.appendChild(L.el('p', { class: 'caption', text: 'Example: apartments gain more than houses. But Anna and Bo are about equally likely to buy one, so "apartment" explains almost none of the gap.' }));
        },
      },
      {
        title: 'Add the suspects one by one', layout: 'split', nextLabel: 'Add it all up',
        prose: (ctx) => {
          const s = ctx.getBet('suspect');
          const hint = { what: 'You suspected what he bought. Switch on property traits and watch.', who: 'You suspected who he is. Switch on buyer traits and watch.', when: 'You suspected timing. Switch on market timing and watch.', where: 'You suspected where. Work through the others first, then switch on municipality.' }[s] || 'Switch on a suspect and watch the bar.';
          return `
          <p>The bar is the gap: how much yearly price gain each extra rank point buys. We add the suspects one at a time, keeping the earlier ones, comparing only buyers who match on them, and see what is left.</p>
          <p>${hint}</p>
          <p id="why-explain" class="note">Nothing held fixed yet. The gap is <span class="num">0.017</span> points per rank, about <span class="num">1.4</span> points a year between Anna and Bo.</p>`;
        },
        stage(el, ctx, info) {
          const specs = P.specs;
          const explain = {
            base: 'Nothing held fixed yet. The gap is <span class="num">0.017</span> points per rank, about <span class="num">1.4</span> points a year between Anna and Bo.',
            prop: '<strong>Property traits</strong> change nothing. Apartments and older buildings do gain more, but Anna and Bo buy similar things. The second dial is near zero.',
            buyer: '<strong>Buyer traits</strong> nibble a little. Age and wealth predict gains slightly and differ a bit between the two.',
            time: '<strong>Market timing</strong> nibbles a little more. Bo did not systematically buy low and sell high. Holding the year of purchase and sale fixed leaves most of the gap.',
            mun: '<strong>Municipality</strong> takes two thirds of it. Compare Anna and Bo only within the same town and most of the gap is gone.',
            post: '<strong>Postcode</strong> takes four fifths. Same neighbourhood, and there is little left to explain.',
            timepost: '<strong>Timing within postcode</strong> takes the rest. Same neighbourhood, same years, and the gap is statistically zero.',
          };
          const active = new Set(info.revisit ? specs.map(s => s.key) : ['base']);
          const chips = L.el('div', { class: 'controls' });
          specs.slice(1).forEach(s => {
            const b = L.el('button', { class: 'chip', 'aria-pressed': active.has(s.key) ? 'true' : 'false', text: s.label });
            b.addEventListener('click', () => {
              // specifications are nested in the paper's table; turning one on implies earlier ones
              const i = specs.findIndex(x => x.key === s.key);
              if (active.has(s.key)) { for (let k = i; k < specs.length; k++) active.delete(specs[k].key); }
              else { for (let k = 1; k <= i; k++) active.add(specs[k].key); }
              paint();
            });
            chips.appendChild(b);
          });
          const c = L.chart(600, 230, { l: 20, r: 20, t: 40, b: 40 }, [-0.004, 0.025], [0, 1]);
          const track = L.svg('rect', { x: c.x(0), y: c.y(0.72), width: c.x(0.025) - c.x(0), height: c.y(0.28) - c.y(0.72), rx: 8, fill: 'var(--paper-2)', stroke: 'var(--line)' });
          const bar = L.svg('rect', { x: c.x(0), y: c.y(0.72), height: c.y(0.28) - c.y(0.72), rx: 8, fill: 'var(--gain)' });
          const ci = L.svg('line', { y1: c.y(0.5), y2: c.y(0.5), stroke: 'var(--ink)', 'stroke-width': 2.5 });
          const ciL = L.svg('line', { y1: c.y(0.36), y2: c.y(0.64), stroke: 'var(--ink)', 'stroke-width': 2 });
          const ciR = L.svg('line', { y1: c.y(0.36), y2: c.y(0.64), stroke: 'var(--ink)', 'stroke-width': 2 });
          const val = L.svg('text', { x: c.x(0), y: c.y(0.72) - 12, class: 'lbl-big' });
          const sub = L.svg('text', { x: c.x(0.025), y: c.y(0.72) - 12, 'text-anchor': 'end', class: 'lbl-mono' });
          L.axisX(c, [0, 0.005, 0.01, 0.015, 0.02, 0.025], v => v.toFixed(3), 'yearly price gain per income-rank point');
          c.g.appendChild(L.svg('line', { x1: c.x(0), x2: c.x(0), y1: c.y(0.8), y2: c.y(0.2), stroke: 'var(--ink-3)' }));
          c.g.append(track, bar, ci, ciL, ciR, val, sub);
          let cur = 0.017;
          const paint = () => {
            [...chips.children].forEach((b, i) => b.setAttribute('aria-pressed', active.has(specs[i + 1].key) ? 'true' : 'false'));
            let top = specs[0];
            for (const s of specs) if (active.has(s.key)) top = s;
            L.tween(cur, top.beta, 600, (v) => {
              bar.setAttribute('width', Math.max(0, c.x(v) - c.x(0)));
              val.textContent = v.toFixed(3);
            });
            cur = top.beta;
            const lo = top.beta - 1.96 * top.se, hi = top.beta + 1.96 * top.se;
            ci.setAttribute('x1', c.x(lo)); ci.setAttribute('x2', c.x(hi));
            ciL.setAttribute('x1', c.x(lo)); ciL.setAttribute('x2', c.x(lo)); ciR.setAttribute('x1', c.x(hi)); ciR.setAttribute('x2', c.x(hi));
            sub.textContent = `≈ ${(top.beta * 80).toFixed(2)} points a year, Anna vs Bo`;
            const ex = document.querySelector('#why-explain'); if (ex) ex.innerHTML = explain[top.key];
          };
          el.appendChild(L.el('p', { class: 'eyebrow', text: 'hold fixed:' }));
          el.appendChild(chips);
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [c.svg]));
          el.appendChild(L.el('p', { class: 'caption', text: 'Black bracket: 95% confidence interval. When it crosses the zero line, the gap is statistically indistinguishable from nothing. Estimates from the paper\'s main table.' }));
          paint();
        },
      },
      {
        title: 'Where, not what', layout: 'stack',
        prose: `
          <p>Split the whole shrinkage of the bar into the four suspects. Location takes almost all of it.</p>
          <p>Where households buy, not what they buy or who they are, statistically accounts for nearly the entire gap in price gains.</p>
          <p class="note">"Accounts for" is a statement about correlation. Comparing only within postcodes soaks up everything that differs between places, including things the paper cannot see. The question <em>why</em> Anna and Bo end up in different places is still open.</p>`,
        doors: [
          { to: 'why/3', label: 'So rich buyers just pick better neighbourhoods?', kind: 'next', primary: true },
        ],
        stage(el) {
          const g = P.gelbach;
          const parts = [
            { k: 'location', label: 'Location', v: g.location, c: 'var(--gain)' },
            { k: 'timing', label: 'Timing', v: g.timing, c: 'var(--ink-3)' },
            { k: 'buyer', label: 'Buyer', v: g.buyer, c: 'var(--ink-2)' },
            { k: 'property', label: 'Property', v: g.property, c: 'var(--line)' },
          ];
          const W = 600, H = 220;
          const svg = L.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
          let x = 30; const y = 70, h = 60, w = 540;
          for (const p of parts) {
            const ww = w * p.v;
            svg.appendChild(L.svg('rect', { x: x + 1, y, width: Math.max(0, ww - 2), height: h, fill: p.c, rx: 3 }));
            if (p.v > 0.2) { svg.appendChild(L.svg('text', { x: x + ww / 2, y: y + h / 2 + 5, 'text-anchor': 'middle', class: 'lbl onbar', fill: 'var(--paper)', text: Math.round(p.v * 100) + '%' })); svg.appendChild(L.svg('text', { x: x + ww / 2, y: y + h + 20, 'text-anchor': 'middle', class: 'lbl-mono', text: p.label })); }
            x += ww;
          }
          svg.appendChild(L.svg('text', { x: 570, y: y + h + 20, 'text-anchor': 'end', class: 'lbl-mono', text: parts.slice(1).map(p => `${p.label} ${Math.round(p.v * 100)}%`).join(' · ') }));
          svg.appendChild(L.svg('text', { x: 30, y: 50, class: 'lbl', text: 'share of the explained shrinkage, postcode specification' }));
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [svg]));
          el.appendChild(L.el('p', { class: 'caption', text: 'Gelbach (2016) decomposition. With municipality instead of postcode, location takes about 67%.' }));
        },
      },
      {
        title: 'Inside a city, the slope flips', layout: 'split',
        prose: `
          <p>Here is the twist. Take only Copenhagen. Compare buyers in the same postcode who bought and sold in the same years. Now higher income predicts <em>slightly lower</em> price gains.</p>
          <p>Bo is not better at picking the winning street. He is better at being in the winning town.</p>
          <p>The paper's own words: the gradient reflects differential exposure to high-growth locations, not superior within-market performance.</p>`,
        doors: [
          { to: 'yield/0', label: 'Before that: is Bo\'s bigger price gain the whole story?', hint: 'The main road: the other half of the return', kind: 'next', primary: true },
          { to: 'risk/0', label: 'Is the winning town just riskier?', hint: 'A finance side room', kind: 'side' },
          { to: 'feasible/0', label: 'Skip ahead: why different towns?', hint: 'Rejoin the road later', kind: 'side' },
        ],
        stage(el) {
          const c = L.chart(600, 320, { l: 52, r: 20, t: 30, b: 44 }, [0, 100], [-1, 1]);
          L.axisY(c, [-1, -0.5, 0, 0.5, 1], v => (v > 0 ? '+' : '') + v.toFixed(1), 'yearly gain relative to rank 50, points');
          L.axisX(c, [0, 25, 50, 75, 100], v => v, 'income rank');
          c.g.appendChild(L.svg('line', { x1: c.m.l, x2: c.W - c.m.r, y1: c.y(0), y2: c.y(0), stroke: 'var(--ink-3)' }));
          const nat = L.svg('path', { d: L.linePath([[c.x(0), c.y(-0.85)], [c.x(100), c.y(0.85)]]), stroke: 'var(--gain)', 'stroke-width': 3, fill: 'none' });
          const within = L.svg('path', { d: L.linePath([[c.x(0), c.y(0.2)], [c.x(100), c.y(-0.2)]]), stroke: 'var(--ink)', 'stroke-width': 3, fill: 'none', 'stroke-dasharray': '8 5' });
          c.g.append(nat, within);
          c.g.appendChild(L.svg('text', { x: c.x(100) - 4, y: c.y(0.85) - 8, 'text-anchor': 'end', class: 'lbl', fill: 'var(--gain)', text: 'all of Denmark: +0.017 per rank' }));
          c.g.appendChild(L.svg('text', { x: c.x(100) - 4, y: c.y(-0.2) + 18, 'text-anchor': 'end', class: 'lbl', text: 'within Copenhagen postcodes: −0.004 per rank' }));
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [c.svg]));
          el.appendChild(L.el('p', { class: 'caption', text: 'Within-city estimate controls for property and buyer traits, postcode, and purchase and sale years. The slope is similar in the other large cities.' }));
        },
      },
    ],
  };

  // =====================================================================
  // DECK 3 · yield
  // =====================================================================
  const yieldDeck = {
    id: 'yield', title: 'The half of the return nobody sees', short: 'The other half',
    slides: [
      {
        title: 'A home pays you twice', layout: 'split', nextLabel: 'Where is rent big next to price?',
        prose: `
          <p>Owning pays once when you sell: the <span class="gain">price gain</span>. It also pays every single month you live there, because you are not paying rent to anyone.</p>
          <p>Economists call that second stream the <span class="yield">rental yield</span>: what the place would rent for, divided by what it cost. It is real money. You just never see it move, because you pay it to yourself.</p>
          <p>Watch Anna's counter. This is rent she is not paying.</p>`,
        stage(el, ctx, info) {
          const W = 600, H = 320;
          const svg = L.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
          const fo = L.svg('foreignObject', { x: 80, y: 40, width: 200, height: 200 });
          const div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div'); div.appendChild(annaHouse(200, { fill: true })); fo.appendChild(div);
          svg.appendChild(fo);
          // loop arrow owner→owner
          svg.appendChild(L.svg('path', { d: 'M 300 140 C 380 60, 470 60, 500 140 C 520 190, 470 230, 420 220', fill: 'none', stroke: 'var(--yield)', 'stroke-width': 3, 'stroke-dasharray': '6 5' }));
          svg.appendChild(L.svg('path', { d: 'M 428 208 L 418 222 L 434 226', fill: 'none', stroke: 'var(--yield)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
          svg.appendChild(L.svg('text', { x: 400, y: 52, 'text-anchor': 'middle', class: 'lbl', fill: 'var(--yield)', text: 'rent, paid to herself' }));
          const num = L.svg('text', { x: 300, y: 290, 'text-anchor': 'middle', class: 'lbl-big', text: '0 DKK' });
          svg.appendChild(L.svg('text', { x: 300, y: 262, 'text-anchor': 'middle', class: 'lbl-mono', text: 'rent Anna did not pay since she moved in' }));
          svg.appendChild(num);
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [svg]));
          const monthly = 4900; let months = (info.revisit || L.reduced()) ? 119 : 0; let alive = true;
          const tick = () => { if (!alive) return; months = Math.min(months + 1, 120); num.textContent = L.fmtInt(months * monthly) + ' DKK  ·  ' + Math.floor(months / 12) + 'y ' + (months % 12) + 'm'; if (months < 120) setTimeout(tick, 75); };
          setTimeout(tick, 400);
          el.appendChild(L.el('p', { class: 'caption', text: 'About 4,900 DKK a month, a rent typical of the provincial towns where lower-income buyers concentrate. Over ten years that is close to 600,000 kroner.' }));
          return () => { alive = false; };
        },
      },
      {
        title: 'Expensive places have small yields', layout: 'split', nextLabel: 'Put the two halves together',
        prose: `
          <p>Drag along the road from a Jutland village to central Copenhagen.</p>
          <p>The price tag climbs steeply. The monthly rent climbs too, but gently. So <em>rent divided by price</em>, the yield, falls as you go.</p>
          <p>Why divide? Bo skips more rent in kroner than Anna does. But he also put far more kroner in. Returns are measured per krone invested, so what matters is rent next to price.</p>
          <p>This is a common pattern in housing markets: where prices are high, rent is small next to price.</p>`,
        stage(el) {
          const U = P.urban;
          const order = ['rural', 'country', 'province', 'city', 'capital'].map(k => U.find(u => u.key === k));
          const W = 600, H = 340;
          const svg = L.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
          // road
          svg.appendChild(L.svg('path', { d: 'M 40 250 Q 300 210 560 250', fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 10, 'stroke-linecap': 'round' }));
          svg.appendChild(L.svg('path', { d: 'M 40 250 Q 300 210 560 250', fill: 'none', stroke: 'var(--paper)', 'stroke-width': 2, 'stroke-dasharray': '10 10' }));
          svg.appendChild(L.svg('text', { x: 40, y: 285, class: 'axis-label', text: 'village' }));
          svg.appendChild(L.svg('text', { x: 560, y: 285, class: 'axis-label', 'text-anchor': 'end', text: 'Copenhagen' }));
          const marker = L.svg('g');
          const fo = L.svg('foreignObject', { x: -28, y: -66, width: 56, height: 56 });
          const div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div'); div.appendChild(L.house('var(--ink)', 56, { face: false, fill: true })); fo.appendChild(div);
          marker.appendChild(fo); svg.appendChild(marker);
          // three readouts
          const mk = (x, label, color) => { const g = L.svg('g', { transform: `translate(${x},30)` }); g.appendChild(L.svg('text', { y: 0, class: 'axis-label', text: label })); const v = L.svg('text', { y: 34, class: 'lbl-big', fill: color }); g.appendChild(v); svg.appendChild(g); return v; };
          const vPrice = mk(40, 'price of a 105 m² home', 'var(--ink)');
          const vRent = mk(260, 'monthly rent', 'var(--ink)');
          const vYield = mk(440, 'rent ÷ price, per year', 'var(--yield)');
          const vCG = L.svg('text', { x: 40, y: 120, class: 'lbl', fill: 'var(--gain)' }); svg.appendChild(vCG);
          const set = (t) => { // t in [0,1]
            const seg = t * (order.length - 1), i = Math.min(order.length - 2, Math.floor(seg)), f = seg - i;
            const a = order[i], b = order[i + 1];
            const price = L.lerp(a.price, b.price, f), rent = L.lerp(a.rent, b.rent, f), cg = L.lerp(a.cg, b.cg, f);
            const x = 40 + 520 * t, y = 250 - 40 * 4 * t * (1 - t) * 0.5;
            marker.setAttribute('transform', `translate(${x},${y - 4})`);
            vPrice.textContent = L.fmtDKK(price); vRent.textContent = L.fmtInt(rent) + ' DKK'; vYield.textContent = (rent * 12 / price * 100).toFixed(1) + '%';
            vCG.textContent = `price gain here: about ${cg.toFixed(1)}% a year`;
          };
          const sl = L.slider('along the road', 0, 100, 15, 1, v => '', 'yield-road');
          sl.out.style.display = 'none';
          sl.input.addEventListener('input', () => set(+sl.input.value / 100));
          set(0.15);
          let down = false;
          const drag = (e) => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); const t = L.clamp((p.x - 40) / 520, 0, 1); set(t); sl.input.value = Math.round(t * 100); };
          svg.style.cursor = 'ew-resize'; svg.style.touchAction = 'none';
          svg.addEventListener('pointerdown', (e) => { down = true; drag(e); });
          svg.addEventListener('pointermove', (e) => { if (down) drag(e); });
          const up = () => { down = false; }; window.addEventListener('pointerup', up);
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [svg]));
          el.appendChild(sl.row);
          el.appendChild(L.el('p', { class: 'caption', text: 'Price gains by area type are the paper\'s summary statistics. Rents and prices along the road are illustrative and hold the home\'s size fixed.' }));
          return () => window.removeEventListener('pointerup', up);
        },
      },
      {
        title: 'Put the two halves together', layout: 'split', nextLabel: 'Compare Anna and Bo',
        prose: `
          <p>Back to the chart of every buyer. The yield line falls with income almost exactly as fast as price gains rise, because higher-income buyers sit in the expensive, low-yield places.</p>
          <p>Add the two and the total is roughly flat. Use the switches to see each piece on its own.</p>
          <p>Bo's higher price gains are offset by lower yields where he buys. <strong>Total returns are about equal across the income distribution.</strong></p>
          <p class="note">Yields are imputed from where each buyer bought, using a 1999 register of rents, and checked against national accounts and 2015 to 2022 private rental data. The slope is the paper's, the level here is illustrative. An internal-rate-of-return version that also charges maintenance and taxes tilts the total slightly in Anna's favour.</p>`,
        stage(el, ctx, info) {
          const c = L.chart(600, 340, { l: 52, r: 20, t: 30, b: 44 }, [0, 100], [0, 12]);
          L.axisY(c, [0, 2, 4, 6, 8, 10, 12], v => v + '%', '% per year');
          L.axisX(c, [0, 20, 40, 60, 80, 100], v => v, 'income rank');
          const line = (fn, color, dash) => L.svg('path', { d: L.linePath([[c.x(0), c.y(fn(0))], [c.x(100), c.y(fn(100))]]), stroke: color, 'stroke-width': 3, fill: 'none', 'stroke-dasharray': dash || null });
          const lg = line(L.cg, 'var(--gain)'), ly = line(L.yieldOf, 'var(--yield)', '6 5'), lt = line(L.total, 'var(--ink)');
          const tg = L.svg('text', { x: c.x(100) - 4, y: c.y(L.cg(100)) + 16, 'text-anchor': 'end', class: 'lbl', fill: 'var(--gain)', text: 'price gain' });
          const ty = L.svg('text', { x: c.x(100) - 4, y: c.y(L.yieldOf(100)) - 8, 'text-anchor': 'end', class: 'lbl', fill: 'var(--yield)', text: 'rental yield' });
          const tt = L.svg('text', { x: c.x(100) - 4, y: c.y(L.total(100)) - 8, 'text-anchor': 'end', class: 'lbl', text: 'total' });
          c.g.append(lg, ly, lt, tg, ty, tt);
          const t1 = L.toggle('rental yield', info.revisit, 'y-t1'), t2 = L.toggle('total', info.revisit, 'y-t2');
          const upd = () => { const a = t1.input.checked, b = t2.input.checked; [ly, ty].forEach(e => e.setAttribute('opacity', a ? 1 : 0)); [lt, tt].forEach(e => e.setAttribute('opacity', b ? 1 : 0)); };
          [ly, ty, lt, tt].forEach(e => e.style.transition = 'opacity .6s');
          t1.input.addEventListener('change', upd); t2.input.addEventListener('change', upd); upd();
          let timers = [];
          if (!info.revisit) { timers.push(setTimeout(() => { t1.input.checked = true; upd(); }, 1200), setTimeout(() => { t2.input.checked = true; upd(); }, 2600)); }
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [c.svg]));
          el.appendChild(L.el('div', { class: 'controls' }, [t1.row, t2.row]));
          el.appendChild(L.el('p', { class: 'caption', html: 'Income-rank slope of the total return: statistically zero. In the subsample with an imputed yield, the price-gain slope is <span class="num">+0.016</span> per rank point and the yield slope about <span class="num">−0.016</span>.' }));
          return () => timers.forEach(clearTimeout);
        },
      },
      {
        title: 'Same total, different shape', layout: 'stack',
        prose: `
          <p>Stack the two halves for Anna and Bo. The houses are about the same height. Their <em>composition</em> is not.</p>
          <p>Brick is the wall: price gains, the part you can sell or borrow against. Thatch is the roof: the yield, the part you live under. Anna's return is mostly roof. Bo's is mostly wall.</p>
          <p class="q">Does the shape matter if the total is the same?</p>`,
        doors: [
          { to: 'wealth/0', label: 'Yes, and here is why', hint: 'Jump to wealth', kind: 'side' },
          { to: 'feasible/0', label: 'First: why do they end up in different places?', hint: 'The main road', kind: 'next' },
        ],
        stage(el) {
          const W = 600, H = 340, base = 290, top = 40;
          const svg = L.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
          const hatch = L.hatch(svg, 'h-yield2', 'var(--yield)');
          const sc = (v) => v / 10 * (base - top);
          [{ x: 160, rank: 10, name: 'Anna', color: 'var(--anna)' }, { x: 420, rank: 90, name: 'Bo', color: 'var(--bo)' }].forEach(b => {
            const cg = L.cg(b.rank), y = L.yieldOf(b.rank), tot = cg + y;
            const hb = CD.houseBar(svg, { x: b.x, w: 120, base }); hb.set(sc(cg), sc(y));
            svg.appendChild(L.svg('text', { x: b.x, y: base - sc(cg) / 2 + 5, 'text-anchor': 'middle', class: 'lbl onbar', text: `${Math.round(cg / tot * 100)}% price gain` }));
            svg.appendChild(L.svg('text', { x: b.x, y: base - sc(cg) - sc(y) / 2 + 5, 'text-anchor': 'middle', class: 'lbl', text: `${Math.round(y / tot * 100)}% yield` }));
            svg.appendChild(L.svg('text', { x: b.x, y: base + 26, 'text-anchor': 'middle', class: 'lbl-big', fill: b.color, text: b.name }));
            svg.appendChild(L.svg('text', { x: b.x, y: hb.top(sc(cg), sc(y)) - 8, 'text-anchor': 'middle', class: 'lbl-mono', text: 'total about ' + Math.round(tot) + '%' }));
          });
          svg.appendChild(L.svg('line', { x1: 60, x2: 540, y1: base, y2: base, stroke: 'var(--line)' }));
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [svg]));
        },
      },
    ],
  };

  window.DECKS.push(start, gap, why, yieldDeck);
})();
