/* decks/c-rooms.js — side rooms: risk, elsewhere, measure */
(function () {
  const L = window.LIB, P = L.PAPER;

  // =====================================================================
  // DECK R · risk
  // =====================================================================
  const risk = {
    id: 'risk', title: 'Is Copenhagen just riskier?', short: 'Risk',
    slides: [
      {
        title: 'The finance reflex', layout: 'center', nextLabel: 'Check it',
        prose: `
          <p>Anyone who has read about stocks will have a reflex here. Higher returns are supposed to be payment for bearing more risk. If the fast-growing towns are also the ones where prices swing hardest, take longest to sell, or collapse when incomes collapse, then Bo is not lucky. He is being paid for nerves.</p>
          <p>Housing is odd in this respect. Across markets, the relationship between risk and return is weak and sometimes backwards. So it is worth checking rather than assuming.</p>`,
      },
      {
        title: 'Eight ways to measure risk, none the size of the gap', layout: 'split', nextLabel: 'So?',
        prose: `
          <p>Pick a measure. Each chart shows its average for buyers in each income decile, from the poorest tenth to the richest.</p>
          <p>Volatility, exposure to the national market, how often prices fall, how far they fall, how long a home takes to sell, how much prices move with local incomes and consumption. Most are close to flat. Falls are a touch deeper at the top, and return per unit of risk rises modestly.</p>
          <p><strong>Time to sell</strong> moves the wrong way for the reflex: homes in high-income areas sell <em>faster</em>. Nothing here is the size of a 1.4 point yearly gap.</p>`,
        stage(el) {
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
          const chips = L.el('div', { class: 'controls' });
          let cur = 'std';
          const c = L.chart(600, 280, { l: 60, r: 20, t: 30, b: 44 }, [0.5, 10.5], [0, 1]);
          L.axisX(c, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], v => 'd' + v, 'income decile of the buyer');
          const gy = L.svg('g'); c.g.appendChild(gy);
          const dots = [], line = L.svg('path', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 });
          c.g.appendChild(line);
          for (let i = 0; i < 10; i++) { const d = L.svg('circle', { cx: c.x(i + 1), r: 6, fill: 'var(--ink)' }); d.appendChild(L.svg('title')); c.g.appendChild(d); dots.push(d); }
          const title = L.svg('text', { x: c.m.l, y: c.m.t - 10, class: 'lbl' }); c.g.appendChild(title);
          const paint = () => {
            const m = M.find(x => x.k === cur), arr = P.risk[cur];
            const lo = Math.min(...arr), hi = Math.max(...arr), mid = (lo + hi) / 2;
            // y-axis scaled to +/- 25% of the level, so "flat" looks flat honestly
            const span = Math.max(Math.abs(mid) * 0.5, (hi - lo) * 1.6, 1e-6);
            const y = L.scale(mid - span / 2, mid + span / 2, c.H - c.m.b, c.m.t);
            gy.replaceChildren();
            [mid - span / 2, mid, mid + span / 2].forEach(t => {
              gy.appendChild(L.svg('line', { class: 'grid', x1: c.m.l, x2: c.W - c.m.r, y1: y(t), y2: y(t), stroke: 'var(--paper-3)' }));
              gy.appendChild(L.svg('text', { x: c.m.l - 6, y: y(t) + 3.5, 'text-anchor': 'end', text: m.fmt(t), fill: 'var(--ink-2)' }));
            });
            arr.forEach((v, i) => { dots[i].setAttribute('cy', y(v)); dots[i].firstChild.textContent = `decile ${i + 1}: ${m.fmt(v)}`; });
            line.setAttribute('d', L.linePath(arr.map((v, i) => [c.x(i + 1), y(v)])));
            title.textContent = `${m.label} · ${m.unit} · axis spans ±${Math.round(span / 2 / Math.max(Math.abs(mid), 1e-9) * 100)}% of the level`;
            [...chips.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.k === cur ? 'true' : 'false'));
          };
          M.forEach(m => { const b = L.el('button', { class: 'chip', text: m.label, 'data-k': m.k }); b.addEventListener('click', () => { cur = m.k; paint(); }); chips.appendChild(b); });
          el.appendChild(chips);
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [c.svg]));
          el.appendChild(L.el('p', { class: 'caption', text: 'Values from the paper\'s risk table by income decile. The vertical axis is deliberately wide so that small differences are not exaggerated; the paper\'s regressions find the gradients statistically detectable but economically small.' }));
          paint();
        },
      },
      {
        title: 'Not risk. Not skill either.', layout: 'center',
        prose: `
          <p>High-income buyers do sit in markets with marginally higher measured risk on some dimensions, and marginally lower on others. Nothing here is the size of a 1.4 point yearly return gap. And inside a town, richer buyers do slightly worse, so it is not stock-picking talent with houses.</p>
          <p>Something else keeps Anna out of the fast-growing places. The paper's answer is about what she can feasibly buy.</p>`,
        doors: [
          { to: 'feasible/0', label: 'Onward: what you can actually buy', hint: 'Rejoin the main road', kind: 'next' },
          { to: 'why/3', label: 'Back to the twist', kind: 'back' },
        ],
      },
    ],
  };

  // =====================================================================
  // DECK X · elsewhere
  // =====================================================================
  const elsewhere = {
    id: 'elsewhere', title: 'Is this just Denmark?', short: 'Elsewhere',
    slides: [
      {
        title: 'Expensive places kept getting more expensive', layout: 'split', nextLabel: 'What the mechanism needs',
        prose: `
          <p>Take every US ZIP code, rank it by its house-price level in the year 2000, and follow the five groups for a quarter century.</p>
          <p>The most expensive fifth in 2000 grew fastest afterwards. The cheapest fifth grew slowest. Where you could afford to buy in 2000 predicted how much you would gain.</p>
          <p>That is the same fingerprint as Denmark's: price levels and subsequent growth line up across places, so sorting by affordability is also sorting by future gains.</p>`,
        stage(el) {
          const c = L.chart(600, 320, { l: 52, r: 20, t: 28, b: 44 }, [2000, 2025], [80, 420]);
          L.axisY(c, [100, 200, 300, 400], v => v, 'index, 2000 = 100 (stylised shape)');
          L.axisX(c, [2000, 2005, 2010, 2015, 2020, 2025], v => v, '');
          // stylised paths: boom, bust, recovery; steeper for higher-priced groups
          const groups = [
            { label: 'most expensive fifth in 2000', g: 1.0, color: 'var(--gain)', w: 3 },
            { label: '4th', g: 0.86, color: 'var(--ink-2)', w: 2 },
            { label: '3rd', g: 0.76, color: 'var(--ink-2)', w: 2 },
            { label: '2nd', g: 0.68, color: 'var(--ink-2)', w: 2 },
            { label: 'cheapest fifth in 2000', g: 0.58, color: 'var(--ink)', w: 3 },
          ];
          const shape = (t) => { // t years since 2000; log index shape shared, scaled by g
            const boom = Math.min(t, 6) * 0.075;
            const bust = t > 6 ? -Math.min(t - 6, 5) * 0.045 : 0;
            const rec = t > 11 ? (t - 11) * 0.075 : 0;
            return boom + bust + rec;
          };
          for (const gr of groups) {
            const pts = []; for (let t = 0; t <= 25; t += 0.5) pts.push([c.x(2000 + t), c.y(100 * Math.exp(gr.g * shape(t)))]);
            c.g.appendChild(L.svg('path', { d: L.linePath(pts), fill: 'none', stroke: gr.color, 'stroke-width': gr.w }));
            const last = pts[pts.length - 1];
            if (gr.w === 3) { const p = pts[Math.round(gr.g === 1 ? 46 : 40)]; c.g.appendChild(L.svg('text', { x: p[0], y: p[1] + (gr.g === 1 ? -12 : 22), 'text-anchor': 'middle', class: 'lbl', fill: gr.color, text: gr.label })); }
          }
          el.appendChild(L.el('div', { class: 'chart-wrap' }, [c.svg]));
          el.appendChild(L.el('p', { class: 'caption', text: 'Stylised rendering of the paper\'s figure from Zillow ZIP-level data, 2000 to 2025. Shapes are illustrative; the ordering of the groups is the finding.' }));
        },
      },
      {
        title: 'What the mechanism needs', layout: 'center',
        prose: `
          <p>The story needs three ingredients: places that keep growing faster than others for decades, banks that lend against income and savings, and housing stock that grows slowly when prices rise. Most rich countries have all three. Interest-only mortgages like Denmark's have existed in the United States, Sweden and the Netherlands.</p>
          <p>Where it should be weaker: places where builders can respond quickly, countries where most people rent, and tax systems that take a bite out of owner-occupied capital gains.</p>
          <p class="note">The paper's Danish evidence is unusually clean because the registers cover every sale and every buyer's income. The mechanism is not unusually Danish.</p>`,
        doors: [
          { to: 'wealth/0', label: 'What the shape of the return does to wealth', hint: 'Main road', kind: 'next' },
          { to: 'reform/3', label: 'Back to the reform', kind: 'back' },
        ],
      },
    ],
  };

  // =====================================================================
  // DECK M · measure
  // =====================================================================
  const measure = {
    id: 'measure', title: 'How do you measure this?', short: 'Methods',
    slides: [
      {
        title: 'Same home, two prices, exact dates', layout: 'split', nextLabel: 'How buyers are ranked',
        prose: `
          <p>The Danish registers record every sale with its date and price. A home that sells twice gives a <em>repeat sale</em>: the same walls, priced at two moments. About 218,000 of these, 1996 to 2022.</p>
          <p>The yearly capital gain is the log of the price ratio divided by years held, after inflation. Try it.</p>
          <p class="note">No price index, no model: this is what the owner actually got. It ignores renovations, which the paper checks separately, and leverage, which the paper treats in an appendix.</p>`,
        stage(el) {
          const s1 = L.slider('bought for', 500000, 4000000, 1200000, 50000, L.fmtDKK, 'm-p0');
          const s2 = L.slider('sold for', 500000, 6000000, 1650000, 50000, L.fmtDKK, 'm-p1');
          const s3 = L.slider('years held', 1, 20, 8, 0.5, v => v + ' y', 'm-T');
          const s4 = L.slider('inflation, % per year', 0, 4, 1.8, 0.1, v => v.toFixed(1) + '%', 'm-inf');
          const out = L.el('div', { class: 'bignum', html: '' });
          const upd = () => {
            const p0 = +s1.input.value, p1 = +s2.input.value, T = +s3.input.value, inf = +s4.input.value;
            const nominal = Math.log(p1 / p0) / T * 100, real = nominal - inf;
            out.innerHTML = `${L.fmtPct(real, 2)} <small>real capital gain per year · nominal ${L.fmtPct(nominal, 2)} · total ${L.fmtPct(Math.log(p1 / p0) * 100, 0)} over ${T} years</small>`;
          };
          [s1, s2, s3, s4].forEach(s => s.input.addEventListener('input', upd)); upd();
          el.appendChild(L.el('div', { class: 'panel', style: 'flex:0 0 auto;padding:18px 16px' }, [out]));
          el.appendChild(s1.row); el.appendChild(s2.row); el.appendChild(s3.row); el.appendChild(s4.row);
          el.appendChild(L.el('p', { class: 'caption', html: 'r = [ln(P<sub>sale</sub>) − ln(P<sub>buy</sub>)] / years, prices deflated by the CPI, winsorised at the 1st and 99th percentiles in the paper.' }));
        },
      },
      {
        title: 'Rank within your own age group', layout: 'center', nextLabel: 'Measuring the rent nobody pays',
        prose: `
          <p>Income rank is the buyer's place in the national distribution of household income among people the same age, in the year before purchase, averaged over three years to smooth bumps.</p>
          <p>Why age groups? A 28-year-old and a 58-year-old at the same income are at very different points in life. Ranking within age removes the part of "low income" that just means "young".</p>
          <p>Buyers under 25 are dropped, since many are students whose income says little about their resources. And note that buyers are a selected group: rank 10 among all Danes is a rare place for a homebuyer to be, which is why the paper's low-income group is small and older than average.</p>`,
      },
      {
        title: 'Measuring the rent nobody pays', layout: 'center', nextLabel: 'What this cannot tell you',
        prose: `
          <p>Owner-occupiers pay no rent, so the yield has to be imputed from what similar homes rent for nearby. The paper uses a 1999 register of rents for every rental unit in Denmark, divided by sale prices per square metre in the same postcode or municipality.</p>
          <p>Three independent checks: the national accounts give an aggregate yield that is stable over time; a 1996 cross-section gives the same pattern across places as 1999; and 2015 to 2022 postcode rents from a private landlord give the same cross-sectional ordering again. Rents and prices both move, but they move together, so the yield is slow-moving.</p>
          <p class="note">Caveats the paper states: rented homes are not a random sample of homes, pre-1992 buildings are rent-controlled (results hold on post-1991 buildings), and a 1999 pattern is applied to later sales. The paper reports the sign and magnitude, not a precise point estimate.</p>`,
      },
      {
        title: 'What this cannot tell you', layout: 'center',
        prose: `
          <p><strong>Realized, not expected.</strong> These are gains people actually got, 1996 to 2022. Whether the same places will keep winning is a forecast the data cannot make. The paper does show that municipalities with faster income and population growth had faster price growth, and such trends tend to persist.</p>
          <p><strong>Accounted for, not caused.</strong> Saying location statistically absorbs the gap does not say why Anna is not in Copenhagen. Constraints and inelastic supply fit the evidence, including the 2003 reform. Preferences, local ties and commuting also push the same way, and the paper does not isolate one cause.</p>
          <p><strong>Cash flows are approximate.</strong> The total return adds an imputed yield to a realized gain. A fuller internal-rate-of-return version, with maintenance, property tax and transaction costs, tilts the total slightly toward lower-income buyers.</p>`,
        doors: [
          { to: 'start/2', label: 'Back to Anna and Bo', kind: 'back' },
          { to: 'wealth/2', label: 'What we learned', kind: 'next' },
        ],
      },
    ],
  };

  window.DECKS.push(risk, elsewhere, measure);
})();
