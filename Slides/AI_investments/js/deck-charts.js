/* js/deck-charts.js — the deck's stages.
 *
 * A slide asks for a chart with
 *     <div class="stage" data-chart="name"></div>
 * and adds data-animate when the chart's build-in should replay every time the
 * slide is shown. A chart is CH[name] = (el, { animate }) => optional cleanup.
 * Numbers come from LIB.DATA in js/lib.js; anything stylised says so in its caption.
 *
 * The three charts below are patterns to rewrite or delete:
 *   stack-reveal   two cases, two components, building in after the room has bet
 *   line-handle    a line the presenter walks along with a draggable handle
 *   ladder         coefficients with confidence intervals down a list of specifications
 */
(function () {
  'use strict';

  function main() {
    const L = window.LIB;
    if (!L) { console.error('deck-charts.js: load js/lib.js first'); return; }
    const D = L.DATA, S = L.svg, E = L.el;
    // ?static and reveal's ?print-pdf draw every chart in its finished state; so does a reduced-motion setting
    const STATIC = /[?&](static|print-pdf)\b/.test(location.search) || L.reduced();

    // ---------- small helpers ----------
    const wrap = (svg, style) => { const d = E('div', { class: 'chart-wrap' }, [svg]); if (style) d.style.cssText = style; return d; };
    const cap = (html) => E('p', { class: 'caption', html });
    const live = (el, sel) => { const s = el.closest('section'); return s ? s.querySelector(sel) : null; };
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
    const ARM = { control: 'var(--control)', tutor: 'var(--tutor)', advisor: 'var(--advisor)' };
    const WHO = { control: 'Mia', tutor: 'Lena', advisor: 'Jonas' };
    const WHAT = { control: 'fact pages + web search', tutor: 'AI tutor', advisor: 'AI advisor' };

    // Multi-line svg text: lines[] at (x, y), line height lh
    const lines = (x, y, arr, attrs, lh = 15) => {
      const t = S('text', Object.assign({ x, y }, attrs));
      arr.forEach((ln, i) => t.appendChild(S('tspan', { x, dy: i ? lh : 0, text: ln })));
      return t;
    };

    // =====================================================================
    // three-students: the hook. Three phones, one question, three kinds of help.
    // =====================================================================
    CH['three-students'] = (el) => {
      const W = 660, H = 360, svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const arms = ['control', 'tutor', 'advisor'];
      arms.forEach((arm, i) => {
        const cx = (i + 0.5) * W / 3, col = ARM[arm], pw = 118, ph = 210, px = cx - pw / 2, py = 28;
        const g = S('g');
        g.appendChild(S('rect', { x: px, y: py, width: pw, height: ph, rx: 16, fill: 'var(--paper)', stroke: col, 'stroke-width': 3 }));
        g.appendChild(S('rect', { x: px + 8, y: py + 22, width: pw - 16, height: ph - 44, rx: 6, fill: 'var(--paper-2)' }));
        g.appendChild(S('circle', { cx, cy: py + ph - 11, r: 4, fill: col }));
        g.appendChild(S('rect', { x: cx - 14, y: py + 9, width: 28, height: 4, rx: 2, fill: col }));
        // the participant's question, right-aligned bubble
        g.appendChild(S('rect', { x: px + 18, y: py + 34, width: pw - 30, height: 46, rx: 10, fill: 'var(--ink)' }));
        g.appendChild(lines(px + 26, py + 53, ['What should', 'I buy?'], { class: 'lbl onbar', fill: 'var(--paper)' }, 16));
        // the help, left-aligned bubble, coloured by arm; for the control a page icon instead of a chat reply
        if (arm === 'control') {
          g.appendChild(S('rect', { x: px + 14, y: py + 92, width: pw - 28, height: 60, rx: 4, fill: 'var(--paper)', stroke: col, 'stroke-width': 1.5 }));
          for (let k = 0; k < 4; k++) g.appendChild(S('rect', { x: px + 22, y: py + 102 + k * 12, width: (pw - 44) * (k === 3 ? 0.55 : 1), height: 4, rx: 2, fill: col, 'fill-opacity': 0.55 }));
        } else {
          g.appendChild(S('rect', { x: px + 14, y: py + 92, width: pw - 30, height: 60, rx: 10, fill: col, 'fill-opacity': 0.16, stroke: col, 'stroke-width': 1.5 }));
          const dots = arm === 'tutor' ? ['Before you pick,', 'what happens if', 'one firm fails?'] : ['Take the broad', 'world ETF.', ''];
          g.appendChild(lines(px + 22, py + 112, dots, { class: 'lbl', fill: 'var(--ink)' }, 16));
        }
        // the 100 euros
        g.appendChild(S('circle', { cx: px + pw - 4, cy: py + 4, r: 20, fill: 'var(--quality)' }));
        g.appendChild(S('text', { x: px + pw - 4, y: py + 9, 'text-anchor': 'middle', class: 'lbl onbar', text: '100 €', fill: 'var(--paper)' }));
        g.appendChild(S('text', { x: cx, y: py + ph + 42, 'text-anchor': 'middle', class: 'lbl-big', text: WHO[arm], fill: col }));
        g.appendChild(S('text', { x: cx, y: py + ph + 66, 'text-anchor': 'middle', class: 'lbl-mono', text: WHAT[arm], fill: 'var(--ink-2)' }));
        svg.appendChild(g);
      });
      el.append(wrap(svg), cap('Three participants in one lab session. Each has a Trade Republic account, receives 100 euros from us and sees the same menu of assets. Only the help differs.'));
    };

    // =====================================================================
    // decay: a stylised curve for the fading effect of classroom education
    // =====================================================================
    CH.decay = (el) => {
      const P = D.decay, c = L.chart(640, 380, { l: 58, r: 24, t: 34, b: 50 }, [0, P.horizonMonths], [0, 110]);
      L.axisY(c, [0, 50, 100], (v) => v, 'effect of the course, end of course = 100');
      L.axisX(c, [0, 12, 24, 36, 48], (v) => v, 'months after the course');
      const f = (m) => 100 * Math.pow(0.5, m / P.halfLifeMonths);
      const pts = []; for (let m = 0; m <= P.horizonMonths; m += 0.5) pts.push([c.x(m), c.y(f(m))]);
      c.g.appendChild(S('path', { d: L.linePath(pts), stroke: 'var(--knowledge)', 'stroke-width': 3.5, fill: 'none' }));
      // the decision arrives late
      const dx = c.x(P.decisionMonth);
      c.g.appendChild(S('line', { x1: dx, x2: dx, y1: c.m.t, y2: c.H - c.m.b, stroke: 'var(--ink)', 'stroke-dasharray': '4 5', 'stroke-width': 1.5 }));
      c.g.appendChild(lines(dx - 8, c.m.t + 14, ['the decision arrives:', 'a mortgage, a fund choice'], { class: 'lbl', 'text-anchor': 'end' }, 16));
      c.g.appendChild(S('circle', { cx: dx, cy: c.y(f(P.decisionMonth)), r: 7, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      c.g.appendChild(S('text', { x: dx + 12, y: c.y(f(P.decisionMonth)) - 10, class: 'lbl', text: 'what is left' }));
      el.append(wrap(c.svg), cap('Stylised. Fernandes, Lynch and Netemeyer (2014) find that the effects of financial education fade within about two years. The curve shows that shape, not a measured level.'));
    };

    // =====================================================================
    // pilot-bars: three measured shares from the Bonn pilot
    // =====================================================================
    CH['pilot-bars'] = (el) => {
      const B = D.pilot.bars, W = 640, rowH = 92, top = 20, H = top + B.length * rowH + 48;
      const c = L.chart(W, H, { l: 24, r: 90, t: top, b: 48 }, [0, 100], [0, 1]);
      L.axisX(c, [0, 25, 50, 75, 100], (v) => v + '%', 'share of respondents');
      B.forEach((b, i) => {
        const y = top + i * rowH;
        c.g.appendChild(S('text', { x: c.x(0), y: y + 18, class: 'lbl', text: b.label }));
        c.g.appendChild(S('rect', { x: c.x(0), y: y + 28, width: c.x(100) - c.x(0), height: 30, fill: 'var(--paper-3)' }));
        c.g.appendChild(S('rect', { x: c.x(0), y: y + 28, width: c.x(b.v) - c.x(0), height: 30, fill: 'var(--quality)' }));
        c.g.appendChild(S('text', { x: c.x(b.v) + 10, y: y + 49, class: 'lbl-big', text: L.fmtInt(b.v) + '%' }));
      });
      el.append(wrap(c.svg), cap(`Measured. Pre-pilot survey, University of Bonn, 14 September 2026, ${D.pilot.n} students. The Trade Republic share is among the 101 who answered the student items.`));
    };

    // =====================================================================
    // three-arms: the live stage. Chips pick the participant's question; the
    // three panels answer as each arm would. Answers are illustrative.
    // =====================================================================
    CH['three-arms'] = (el) => {
      const QS = [
        {
          q: 'Should I buy the world ETF or one DAX stock?',
          control: ['Fact page · Diversification', 'An index ETF holds hundreds of companies. A single stock holds one. The menu lists each asset’s number of holdings and its fee.'],
          tutor: ['Before you choose: if one of those companies has a bad year, what happens to your 100 euros in each case?', '… Right. The ETF spreads that risk. Which matters more to you here, the chance of a big win or a narrower range of outcomes? The choice is yours.'],
          advisor: ['Take the broad world ETF. It holds hundreds of firms and its fee is among the lowest on the menu.', 'A single stock adds risk you are not paid for.'],
        },
        {
          q: 'Which of these has the lowest fees?',
          control: ['Fact page · Fees', 'The menu shows each fund’s total expense ratio (TER). Over ten years, a fee one percentage point higher costs about ten percent of the final value.'],
          tutor: ['Look at the TER column. Two of these funds track the same market. What do you expect the higher fee buys you?', '… In the data, usually nothing. Compare the two cheapest and tell me what else differs between them.'],
          advisor: ['The cheapest is the global index ETF at the bottom of your menu. Pick that one.', 'The active fund above it charges several times more for the same market.'],
        },
      ];
      const ctl = E('div', { class: 'ctl' });
      const grid = E('div', { class: 'arms' });
      const panels = {};
      ['control', 'tutor', 'advisor'].forEach((arm) => {
        const p = E('div', { class: 'panel arm ' + arm });
        p.append(E('span', { class: 'who', text: WHO[arm] }), E('span', { class: 'what', text: WHAT[arm] }));
        const body = E('div', { class: 'body' }); p.appendChild(body); panels[arm] = body; grid.appendChild(p);
      });
      const show = (i) => {
        const q = QS[i];
        ['control', 'tutor', 'advisor'].forEach((arm) => {
          panels[arm].replaceChildren(E('p', { class: 'ask', text: '“' + q.q + '”' }), ...q[arm].map((t) => E('p', { text: t })));
        });
        press(ctl, (b) => +b.dataset.i === i);
      };
      QS.forEach((q, i) => { const b = chip(q.q, i === 0, () => show(i)); b.dataset.i = i; ctl.appendChild(b); });
      show(0);
      el.append(ctl, grid, cap('Illustrative answers written by us, not model output. The tutor teaches the concept, checks understanding and names no product. The advisor gives short advice about specific assets. Mia sees the same facts as static pages and may search the web.'));
    };

    // =====================================================================
    // session-flow: the decisions in order, with the concept each one targets
    // =====================================================================
    CH['session-flow'] = (el) => {
      const W = 1040, H = 300, svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const steps = [
        { t: 'Step 1 · Equity', s: ['choose from about 20', 'stocks and equity ETFs'], c: ['diversification', 'and fees'], real: true },
        { t: 'Step 2 · Bonds', s: ['choose from about 10', 'bond ETFs and bonds'], c: ['interest-rate', 'and credit risk'], real: true },
        { t: 'Step 3 · Allocate', s: ['split 100 € across', 'the positions chosen'], c: ['risk and return', 'at own horizon'], real: true },
        { t: 'Active or index', s: ['two funds tracking', 'the same market'], c: ['fees', 'paid for accuracy'] },
        { t: 'Mortgage', s: ['two German offers:', 'rate, fees, fixed period'], c: ['effective cost', 'paid for accuracy'] },
        { t: 'Quiz', s: ['a short', 'knowledge test'], c: ['what was', 'learned'] },
      ];
      const n = steps.length, gap = 14, bw = (W - gap * (n - 1)) / n, top = 64, bh = 150;
      steps.forEach((st, i) => {
        const x = i * (bw + gap), col = st.real ? 'var(--quality)' : 'var(--ink-3)';
        svg.appendChild(S('rect', { x, y: top, width: bw, height: bh, rx: 10, fill: st.real ? 'var(--primary-soft)' : 'var(--paper-2)', stroke: col, 'stroke-width': st.real ? 2 : 1 }));
        svg.appendChild(S('text', { x: x + 14, y: top + 30, class: 'lbl', text: st.t, style: 'font-size:15px' }));
        svg.appendChild(lines(x + 14, top + 56, st.s, { class: 'sub', fill: 'var(--ink-2)' }, 17));
        svg.appendChild(lines(x + 14, top + 116, st.c, { class: 'lbl', fill: col }, 16));
        if (i < n - 1) svg.appendChild(S('path', { d: `M${x + bw + 2} ${top + bh / 2} l${gap - 4} 0 m-5 -5 l5 5 l-5 5`, stroke: 'var(--ink-3)', 'stroke-width': 1.5, fill: 'none' }));
      });
      // brackets over the groups
      const brk = (x0, x1, y, text, col) => {
        svg.appendChild(S('path', { d: `M${x0} ${y + 10} v-10 H${x1} v10`, stroke: col, 'stroke-width': 2, fill: 'none' }));
        svg.appendChild(S('text', { x: (x0 + x1) / 2, y: y - 10, 'text-anchor': 'middle', class: 'lbl', text, fill: col, style: 'font-size:15px' }));
      };
      brk(0, 3 * bw + 2 * gap, top - 14, 'One real investment: 100 euros on the participant’s own account', 'var(--quality)');
      brk(3 * (bw + gap), 5 * bw + 4 * gap, top - 14, 'Hypothetical, paid for accuracy', 'var(--ink-3)');
      svg.appendChild(lines(W / 2, top + bh + 40, ['Each step: a short instruction page before, confidence and expectation items after.', 'The assistant, or the fact pages, are available throughout.'], { class: 'sub', 'text-anchor': 'middle', fill: 'var(--ink-2)' }, 18));
      el.append(wrap(svg), cap('From the application. The first three steps build one real portfolio. The two hypothetical decisions measure accuracy in domains the real portfolio does not cover, and the quiz measures what was learned.'));
    };

    // =====================================================================
    // timeline: the session and the six-month follow-up
    // =====================================================================
    CH.timeline = (el) => {
      const W = 640, H = 380, svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const y = 190, x0 = 70, x1 = 590;
      svg.appendChild(S('line', { x1: x0, x2: x1, y1: y, y2: y, stroke: 'var(--line)', 'stroke-width': 3 }));
      const mark = (x, col, big) => svg.appendChild(S('circle', { cx: x, cy: y, r: big ? 12 : 6, fill: col, stroke: 'var(--paper)', 'stroke-width': 3 }));
      mark(x0, 'var(--quality)', true); mark(x1, 'var(--knowledge)', true);
      svg.appendChild(S('text', { x: x0, y: y - 32, 'text-anchor': 'middle', class: 'lbl-big', text: 'Session', fill: 'var(--quality)' }));
      svg.appendChild(S('text', { x: x1, y: y - 32, 'text-anchor': 'middle', class: 'lbl-big', text: '6 months', fill: 'var(--knowledge)' }));
      svg.appendChild(lines(x0 - 50, y + 36, ['portfolio screenshot (baseline)', 'real investment, chat logs', 'hypothetical decisions, quiz', 'confidence, trust in AI'], { class: 'lbl' }, 18));
      svg.appendChild(lines(x1 + 48, y + 36, ['study position: held or sold?', 'portfolio screenshot again', 'AI use and trust, the advice in hindsight', 'spillovers to the rest of the portfolio'], { class: 'lbl', 'text-anchor': 'end' }, 18));
      // what happens in between
      const mx = (x0 + x1) / 2;
      svg.appendChild(S('path', { d: `M${x0 + 30} ${y - 70} Q${mx} ${y - 150} ${x1 - 30} ${y - 70}`, stroke: 'var(--ink-3)', 'stroke-dasharray': '4 5', 'stroke-width': 1.5, fill: 'none' }));
      svg.appendChild(lines(mx, y - 152, ['the market moves: given the assets chosen,', 'the return is random with respect to treatment'], { class: 'sub', 'text-anchor': 'middle', fill: 'var(--ink-2)' }, 16));
      el.append(wrap(svg), cap('From the application. The baseline and follow-up screenshots of the participant’s own account are what let us see spillovers beyond the 100 euros.'));
    };

    // =====================================================================
    // hypotheses: the payoff. Left, session portfolio quality by arm; right,
    // knowledge over six months. Stylised shapes of the pre-registered claims.
    // =====================================================================
    CH.hypotheses = (el, o) => {
      const Hy = D.hyp, W = 680, H = 360, svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      // left panel: bars
      const lx = 40, lw = 250, base = 290, top = 60;
      svg.appendChild(S('text', { x: lx, y: 28, class: 'lbl', text: 'Portfolio quality in the session', style: 'font-size:15px' }));
      svg.appendChild(S('text', { x: lx, y: 46, class: 'axis-label', text: 'higher is better' }));
      svg.appendChild(S('line', { x1: lx, x2: lx + lw, y1: base, y2: base, stroke: 'var(--line)' }));
      const bars = Hy.quality.map((q, i) => {
        const bwid = 54, x = lx + 20 + i * (lw - 40) / 3 + ((lw - 40) / 3 - bwid) / 2;
        const r = S('rect', { x, width: bwid, y: base, height: 0, fill: ARM[q.arm] });
        svg.appendChild(r);
        svg.appendChild(S('text', { x: x + bwid / 2, y: base + 22, 'text-anchor': 'middle', class: 'lbl', text: q.who, fill: ARM[q.arm] }));
        return { r, v: q.v, x, bwid };
      });
      // right panel: lines
      const c = { l: 370, r: 30, t: 60, b: 70 };
      const xs = L.scale(0, 6, c.l, W - c.r), ys = L.scale(0, 1.05, base, top);
      svg.appendChild(S('text', { x: c.l, y: 28, class: 'lbl', text: 'Knowledge, relative to Mia', style: 'font-size:15px' }));
      svg.appendChild(S('text', { x: c.l, y: 46, class: 'axis-label', text: 'quiz score minus the control group' }));
      svg.appendChild(S('line', { x1: xs(0), x2: xs(6), y1: ys(0), y2: ys(0), stroke: 'var(--line)' }));
      [0, 3, 6].forEach((m) => svg.appendChild(S('text', { x: xs(m), y: base + 22, 'text-anchor': 'middle', class: 'lbl-mono', fill: 'var(--ink-2)', text: m === 0 ? 'session' : m + ' months' })));
      svg.appendChild(S('text', { x: xs(0), y: ys(0) - 8, class: 'lbl', text: 'Mia, the zero line', fill: 'var(--control)' }));
      const path = (arm) => S('path', { stroke: ARM[arm], 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round' });
      const pt = path('tutor'), pa = path('advisor');
      const lt = S('text', { class: 'lbl', fill: ARM.tutor, text: 'Lena' }), la = S('text', { class: 'lbl', fill: ARM.advisor, text: 'Jonas' });
      const gapLine = S('line', { stroke: 'var(--knowledge)', 'stroke-width': 2, 'stroke-dasharray': '3 4' });
      const gapTxt = S('text', { class: 'lbl', fill: 'var(--knowledge)', 'text-anchor': 'end' });
      svg.append(pt, pa, lt, la, gapLine, gapTxt);
      const drawBars = (k) => bars.forEach((b) => { const h = (base - top) * b.v * k; b.r.setAttribute('y', base - h); b.r.setAttribute('height', h); });
      const drawLines = (k) => {
        const upto = 6 * k, pts = (arr) => { const out = []; for (let m = 0; m <= upto + 1e-9; m += 0.25) { const i = Math.floor(m), f = m - i, v = i >= 6 ? arr[6] : arr[i] + (arr[i + 1] - arr[i]) * f; out.push([xs(m), ys(v)]); } return out; };
        const T = pts(Hy.knowledge.tutor), A = pts(Hy.knowledge.advisor);
        pt.setAttribute('d', L.linePath(T)); pa.setAttribute('d', L.linePath(A));
        const et = T[T.length - 1], ea = A[A.length - 1];
        lt.setAttribute('x', et[0] - 2); lt.setAttribute('y', et[1] - 12);
        la.setAttribute('x', ea[0] - 2); la.setAttribute('y', ea[1] - 12);
        const show = k > 0.98;
        gapLine.setAttribute('x1', et[0]); gapLine.setAttribute('x2', et[0]); gapLine.setAttribute('y1', et[1]); gapLine.setAttribute('y2', ea[1]);
        gapLine.setAttribute('opacity', show ? 1 : 0); gapTxt.setAttribute('opacity', show ? 1 : 0);
        gapTxt.setAttribute('x', et[0] - 10); gapTxt.setAttribute('y', (et[1] + ea[1]) / 2 + 4); gapTxt.textContent = 'the gap widens';
      };
      const leg = E('div', { class: 'legend' }, [
        E('span', { style: '--c:var(--control)', text: 'Mia, fact pages' }),
        E('span', { style: '--c:var(--tutor)', text: 'Lena, tutor' }),
        E('span', { style: '--c:var(--advisor)', text: 'Jonas, advisor' }),
      ]);
      el.append(wrap(svg), leg, cap('Stylised. These are the shapes of the pre-registered hypotheses, not data: the advisor produces the larger immediate improvement, the tutor the larger knowledge gain, and the tutor’s lead widens over six months.'));
      if (!o.animate) { drawBars(1); drawLines(1); return; }
      drawLines(0);
      let t = null;
      L.tween(0, 1, 1100, drawBars, () => { t = setTimeout(() => L.tween(0, 1, 2200, drawLines), 900); });
      return () => { if (t) clearTimeout(t); };
    };

    // =====================================================================
    // budget: the application's table as bars
    // =====================================================================
    CH.budget = (el) => {
      const B = D.budget, W = 640, rowH = 50, top = 10, H = top + B.items.length * rowH + 40;
      const max = Math.max(...B.items.map((b) => b.v));
      const c = L.chart(W, H, { l: 24, r: 80, t: top, b: 40 }, [0, max], [0, 1]);
      L.axisX(c, [0, 10000, 20000, 30000], (v) => L.fmtInt(v / 1000) + 'k', 'EUR, year 1');
      B.items.forEach((b, i) => {
        const y = top + i * rowH;
        c.g.appendChild(S('text', { x: c.x(0), y: y + 14, class: 'lbl', text: b.label }));
        c.g.appendChild(S('rect', { x: c.x(0), y: y + 20, width: c.x(b.v) - c.x(0), height: 18, fill: b.pay ? 'var(--quality)' : 'var(--ink-3)' }));
        c.g.appendChild(S('text', { x: c.x(b.v) + 8, y: y + 34, class: 'lbl-mono', text: L.fmtInt(b.v) }));
      });
      const paid = B.items.filter((b) => b.pay).reduce((a, b) => a + b.v, 0);
      el.append(wrap(c.svg), E('div', { class: 'legend' }, [
        E('span', { style: '--c:var(--quality)', text: `paid to participants: ${L.fmtInt(paid)} of ${L.fmtInt(B.total)} EUR (${Math.round(100 * paid / B.total)}%)` }),
        E('span', { style: '--c:var(--ink-3)', text: 'lab, travel, contingency' }),
      ]), cap('From the application’s budget table. One year, May 2027 to April 2028.'));
    };

    // =====================================================================
    // power: minimum detectable effects for 300 participants, computed here
    // from the planning notes' formula so the room can check the arithmetic
    // =====================================================================
    CH.power = (el) => {
      const P = D.power, n = D.design.participants, per = n / D.design.arms;
      const mde = (n1, n2) => Math.sqrt(P.k * (1 / n1 + 1 / n2));
      const rows = [
        { c: 'Access (tutor + advisor vs control), session outcomes', n1: 2 * per, n2: per, adj: false },
        { c: 'Tutor vs advisor, session outcomes', n1: per, n2: per, adj: false },
        { c: `Access, six-month outcomes, ${Math.round(P.retention * 100)}% retention`, n1: 2 * per * P.retention, n2: per * P.retention, adj: true },
        { c: `Tutor vs advisor, six-month outcomes, ${Math.round(P.retention * 100)}% retention`, n1: per * P.retention, n2: per * P.retention, adj: true },
      ];
      const tbl = E('table', { class: 'power' });
      tbl.appendChild(E('tr', {}, ['Contrast', 'n', 'MDE, SD', 'with baseline (ANCOVA)'].map((h) => E('th', { text: h }))));
      rows.forEach((r) => {
        const m = mde(r.n1, r.n2);
        tbl.appendChild(E('tr', {}, [
          E('td', { text: r.c }), E('td', { text: `${Math.round(r.n1)} vs ${Math.round(r.n2)}` }),
          E('td', { text: m.toFixed(2) }), E('td', { text: r.adj ? (m * P.ancova).toFixed(2) : '—' }),
        ]));
      });
      el.append(tbl, cap(`Computed on this slide: MDE = √(${P.k} · (1/n₁ + 1/n₂)) standard deviations, two-sided 5 percent, 80 percent power. Conditioning on the baseline measure with a pre-post correlation of about 0.7 scales the follow-up MDE by ${P.ancova}. Formula from our planning notes; the application itself reports no power calculation.`));
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

    document.querySelectorAll('.stage[data-chart]').forEach((el) => {
      el.addEventListener('pointerdown', (e) => e.stopPropagation()); // keep reveal's swipe handler off the playables
      el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) b.blur(); }); // so space and arrows keep driving the deck
      el.addEventListener('pointerup', () => { const a = document.activeElement; if (a && a.tagName === 'INPUT') a.blur(); }); // a dragged slider would otherwise eat the arrow keys
      draw(el, false);
    });
    const animateIn = (section) => {
      if (STATIC || !section) return;
      section.querySelectorAll('.stage[data-animate]').forEach((el) => {
        if (el.dataset.animate === 'once' && el._played) return; // the payoff plays once; stepping back shows it finished
        el._played = true; draw(el, true);
      });
    };
    // Prose numbers that read L.DATA: [ ]{.data key="specs.0.beta" d="3"} → the same object the charts draw
    document.querySelectorAll('.data[data-key]').forEach((sp) => {
      const v = L.get(sp.dataset.key);
      if (v === undefined) { console.error('deck-charts.js: no L.DATA entry for ' + sp.dataset.key); sp.textContent = '?'; return; }
      sp.textContent = typeof v === 'number' && sp.dataset.d !== undefined ? L.fmtNum(v, +sp.dataset.d) : String(v);
    });
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
