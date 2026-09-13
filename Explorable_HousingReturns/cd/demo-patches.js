/* cd/demo-patches.js — DEMO ONLY. Shows the two deck-level edits the README describes,
 * applied from outside so no existing file is touched. Not needed once the decks adopt them. */
(function () {
  const L = window.LIB, byId = Object.fromEntries(window.DECKS.map(d => [d.id, d]));

  // (a) start/0: the title skyline → CD.skyline
  byId.start.slides[0].stage = function (el) {
    el.classList.add('stage-skyline');
    el.appendChild(L.el('div', { class: 'chart-wrap' }, [CD.skyline(1000, 300)]));
  };

  // (b) yield/3: "Same total, different shape" → two houses, brick wall of gains, thatched roof of yield
  byId.yield.slides[3].stage = function (el) {
    const W = 600, H = 340, base = 290, top = 40;
    const svg = L.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
    const sc = (v) => v / 10 * (base - top);
    [{ x: 160, rank: 10, name: 'Anna', color: 'var(--anna)' }, { x: 420, rank: 90, name: 'Bo', color: 'var(--bo)' }].forEach(b => {
      const cg = L.cg(b.rank), y = L.yieldOf(b.rank), tot = cg + y;
      const hb = CD.houseBar(svg, { x: b.x, w: 120, base });
      hb.set(sc(cg), sc(y));
      svg.appendChild(L.svg('text', { x: b.x, y: base - sc(cg) / 2 + 5, 'text-anchor': 'middle', class: 'lbl', fill: 'var(--paper)', text: `${Math.round(cg / tot * 100)}% price gain` }));
      svg.appendChild(L.svg('text', { x: b.x, y: base - sc(cg) - sc(y) / 2 + 5, 'text-anchor': 'middle', class: 'lbl', text: `${Math.round(y / tot * 100)}% yield` }));
      svg.appendChild(L.svg('text', { x: b.x, y: base + 26, 'text-anchor': 'middle', class: 'lbl-big', fill: b.color, text: b.name }));
      svg.appendChild(L.svg('text', { x: b.x, y: hb.top(sc(cg), sc(y)) - 8, 'text-anchor': 'middle', class: 'lbl-mono', text: 'total about ' + Math.round(tot) + '%' }));
    });
    svg.appendChild(L.svg('line', { x1: 60, x2: 540, y1: base, y2: base, stroke: 'var(--line)' }));
    el.appendChild(L.el('div', { class: 'chart-wrap' }, [svg]));
  };

  // (c) reform/2: winners grow a roof, the price line becomes a SOLGT sign.
  const auction = byId.reform.slides[2];
  const origStage = auction.stage;
  auction.stage = function (el, ctx, info) {
    const r = origStage.call(this, el, ctx, info);
    const svg = el.querySelector('svg.chart');
    const bars = [...svg.querySelectorAll('rect[rx="3"]')];
    const pLine = svg.querySelector('line[stroke="var(--gain)"]');
    const pLbl = pLine && pLine.nextElementSibling;
    if (!bars.length || !pLine) return r;
    const roofs = bars.map(b => CD.roof(svg, { x: +b.getAttribute('x'), w: +b.getAttribute('width'), color: 'var(--ink)', h: 9 }));
    const sign = CD.solgt(svg, { text: 'SOLGT', sub: '' });
    pLbl.style.display = 'none';
    const sync = () => {
      bars.forEach((b, i) => { const win = b.getAttribute('stroke') === 'none'; roofs[i].el.setAttribute('fill', b.getAttribute('fill')); roofs[i].set(+b.getAttribute('y'), win); });
      const marginal = bars.filter(b => b.getAttribute('stroke') === 'none').sort((a, b) => +b.getAttribute('y') - +a.getAttribute('y'))[0];
      if (marginal) { sign.set(+marginal.getAttribute('x') + +marginal.getAttribute('width') / 2, +marginal.getAttribute('y')); sign.g.setText('SOLGT', pLbl.textContent.replace('price ', '').split(' · ')[0]); }
    };
    sync();
    const mo = new MutationObserver(sync); mo.observe(svg, { attributes: true, subtree: true, attributeFilter: ['y', 'fill'] });
    return () => { mo.disconnect(); r && r(); };
  };
})();
