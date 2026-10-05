/* js/deck-charts.js — the deck's stages.
 *
 * A slide asks for a chart with
 *     <div class="stage" data-chart="name"></div>
 * and adds data-animate when the chart's build-in should replay every time the
 * slide is shown. A chart is CH[name] = (el, { animate }) => optional cleanup.
 * Numbers come from LIB.DATA in js/lib.js; anything stylised says so in its caption.
 *
 * Colour: only the four semantic colours carry meaning (context brick, check
 * teal, Anna's chat ochre, Ben's agent blue). Everything else is ink and paper.
 *
 * Stages in this deck:
 *   two-researchers   Anna and Ben, the hook
 *   next-token        the presenter samples tokens one at a time
 *   generations       chat → reasoning → agentic, drawn in palette
 *   frontier          the jagged frontier, stylised after Mollick
 *   adoption-field    AI use vs coding-agent use by discipline (builds in after the bet)
 *   adoption-career   the same by career stage
 *   adoption-use      what agent users and other AI users do
 *   harness-loop      the agentic loop, stepped through by the presenter
 *   context-budget    a context window filling with PDF pages
 *   checks-cost       four verification checks on a cost axis
 *   serrano           take-home midterm against in-person final, 59 students
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
    const LEFT = 'justify-content:flex-start';
    const cap = (html) => E('p', { class: 'caption', html });
    const status = (html) => E('p', { class: 'caption status', html });
    const btn = (text, onClick) => { const b = E('button', { class: 'btn', text }); b.addEventListener('click', onClick); return b; };
    const chipBtn = (text, onClick) => { const b = E('button', { class: 'chip', text }); b.addEventListener('click', onClick); return b; };
    const txt = (x, y, text, attrs = {}) => S('text', Object.assign({ x, y, text }, attrs));

    const CH = {};

    // =====================================================================
    // two-researchers: Anna with a chat window, Ben with a folder and a prompt
    // =====================================================================
    CH['two-researchers'] = (el) => {
      const W = 680, H = 360;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      // Anna: a chat window with an uploaded PDF and a reply of text
      const ax = 180, ay = 120;
      svg.append(S('path', { d: `M${ax - 80} ${ay - 60} h160 a12 12 0 0 1 12 12 v90 a12 12 0 0 1 -12 12 h-95 l-30 30 v-30 h-35 a12 12 0 0 1 -12 -12 v-90 a12 12 0 0 1 12 -12 z`, fill: 'var(--chat-soft)', stroke: 'var(--chat)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
      svg.append(S('rect', { x: ax - 62, y: ay - 44, width: 74, height: 22, rx: 5, fill: 'var(--chat)' }));
      svg.append(txt(ax - 25, ay - 29, 'paper.pdf', { 'text-anchor': 'middle', class: 'lbl-mono', style: 'fill:var(--paper);font-size:11px' }));
      [[-62, -8, 124], [-62, 12, 104], [-62, 32, 116]].forEach(([dx, dy, w]) => svg.append(S('rect', { x: ax + dx, y: ay + dy, width: w, height: 8, rx: 4, fill: 'var(--chat)', 'fill-opacity': 0.55 })));
      svg.append(txt(ax, 250, 'Anna', { 'text-anchor': 'middle', class: 'lbl-big', fill: 'var(--chat)' }));
      svg.append(txt(ax, 278, 'uploads the PDF to a chatbot and asks', { 'text-anchor': 'middle', class: 'boxsub' }));
      svg.append(txt(ax, 296, 'for a website; gets text back to place herself', { 'text-anchor': 'middle', class: 'boxsub' }));
      // Ben: a folder with the paper's files and a prompt
      const bx = 500, by = 120;
      svg.append(S('path', { d: `M${bx - 90} ${by - 50} h60 l16 16 h104 a10 10 0 0 1 10 10 v96 a10 10 0 0 1 -10 10 h-180 a10 10 0 0 1 -10 -10 v-112 a10 10 0 0 1 10 -10 z`, fill: 'var(--agent-soft)', stroke: 'var(--agent)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
      ['paper.tex', 'figures/', 'index.html  ← new'].forEach((f, i) => svg.append(txt(bx - 78, by - 8 + i * 22, f, { class: 'lbl-mono', fill: 'var(--agent)' })));
      svg.append(S('rect', { x: bx - 90, y: by + 66, width: 190, height: 30, rx: 6, fill: 'var(--ink)' }));
      svg.append(txt(bx - 80, by + 86, '> build a website', { class: 'lbl-mono', fill: 'var(--paper)' }));
      svg.append(txt(bx, 250, 'Ben', { 'text-anchor': 'middle', class: 'lbl-big', fill: 'var(--agent)' }));
      svg.append(txt(bx, 278, 'opens the paper’s folder in an agent; it reads', { 'text-anchor': 'middle', class: 'boxsub' }));
      svg.append(txt(bx, 296, 'the paper, writes the files, opens the page', { 'text-anchor': 'middle', class: 'boxsub' }));
      el.append(wrap(svg), cap('Same paper, same request: “make a website for this paper.” Anna and Ben are stylised. The difference between their tools is real and is the subject of section 4.'));
    };

    // =====================================================================
    // next-token: the presenter samples the next token, six times
    // =====================================================================
    CH['next-token'] = (el) => {
      const T = D.nextToken, steps = T.steps;
      let tokens = T.prefix.slice(), i = STATIC ? steps.length : 0;
      const line = E('div', { class: 'token-line' });
      const W = 640, H = 210, rowH = 34, lx = 150, bx = 160, bw = 380;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const st = status('');
      const b = btn('Sample the next token', () => step());
      const reset = chipBtn('Reset', () => { tokens = T.prefix.slice(); i = 0; draw(); });
      const draw = () => {
        line.replaceChildren();
        tokens.forEach((t, k) => {
          const isNew = k >= T.prefix.length && k === tokens.length - 1;
          const sep = (t === ',' || t === '.') ? '' : ' ';
          if (k) line.append(sep);
          line.append(E('span', { class: isNew ? 'new' : '', text: t }));
        });
        line.append(E('span', { class: 'cursor' }));
        svg.replaceChildren();
        const cands = steps[Math.min(i, steps.length - 1)];
        svg.append(txt(lx - 6, 14, 'candidates for the next token', { class: 'axis-label', 'text-anchor': 'end' }));
        svg.append(txt(bx, 14, 'probability, stylised', { class: 'axis-label' }));
        cands.forEach(([w, p], k) => {
          const y = 26 + k * rowH;
          const top = k === 0;
          svg.append(txt(lx - 6, y + 20, w === ',' ? '“,”' : w === '.' ? '“.”' : w, { class: 'lbl', 'text-anchor': 'end', fill: top ? 'var(--ink)' : 'var(--ink-3)' }));
          svg.append(S('rect', { x: bx, y: y + 6, width: bw * p, height: rowH - 12, rx: 3, fill: top ? 'var(--ink)' : 'var(--paper-3)', stroke: top ? 'none' : 'var(--line)' }));
          svg.append(txt(bx + bw * p + 8, y + 20, L.fmtPct(p * 100, 0), { class: 'lbl-mono' }));
        });
        const done = i >= steps.length;
        b.disabled = done;
        st.innerHTML = done
          ? 'Six tokens later: a fluent sentence. At no point was anything looked up; each word was the most likely continuation.'
          : i === 0 ? 'Press <b>sample</b>: the most likely token is appended, then the model predicts again.' : `Step ${i} of ${steps.length}: the top candidate goes in, the list is recomputed.`;
      };
      const step = () => { if (i >= steps.length) return; tokens.push(steps[i][0][0]); i++; draw(); };
      if (STATIC) for (const s of steps) tokens.push(s[0][0]);
      draw();
      el.append(line, wrap(svg, LEFT), E('div', { class: 'ctl' }, [b, reset, st]), cap('Candidate lists and probabilities are invented for the slide; a real model has tens of thousands of candidates. The mechanism is the real one: predict a distribution over the next token, pick one, repeat. The stage always picks the top candidate; a real model samples.'));
    };

    // =====================================================================
    // generations: three boxes, chat → reasoning → agentic
    // =====================================================================
    CH.generations = (el) => {
      const G = D.generations, W = 700, H = 330, bw = 200, bh = 190, top = 40, gap = 30;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      G.forEach((g, k) => {
        const x = 20 + k * (bw + gap);
        svg.append(S('rect', { x, y: top, width: bw, height: bh, rx: 10, fill: g.color }));
        svg.append(txt(x + bw / 2, top + 34, g.name, { 'text-anchor': 'middle', class: 'lbl', style: 'fill:var(--paper);stroke:none;font-size:15px' }));
        svg.append(txt(x + bw / 2, top + 56, g.years, { 'text-anchor': 'middle', class: 'lbl-mono', style: 'fill:var(--paper);fill-opacity:0.85' }));
        g.lines.forEach((l, j) => svg.append(txt(x + bw / 2, top + 96 + j * 26, l, { 'text-anchor': 'middle', class: 'boxsub', style: 'fill:var(--paper);font-size:12.5px' })));
        svg.append(txt(x + bw / 2, top + bh + 30, g.eg, { 'text-anchor': 'middle', class: 'lbl-mono', fill: 'var(--ink-2)' }));
        if (k < G.length - 1) {
          const ax = x + bw + 4, ay = top + bh / 2;
          svg.append(S('path', { d: `M${ax} ${ay} h${gap - 12}`, stroke: 'var(--ink-3)', 'stroke-width': 3 }));
          svg.append(S('path', { d: `M${ax + gap - 14} ${ay - 7} l8 7 l-8 7`, stroke: 'var(--ink-3)', 'stroke-width': 3, fill: 'none' }));
        }
      });
      el.append(wrap(svg, LEFT), cap('After Mollick (2026), Korinek (2025) and Velikov (2026). '));
    };

    // =====================================================================
    // frontier: the jagged frontier, stylised. Tasks along x in the order a
    // person would rank their difficulty; AI performance on y; a dashed line
    // marks "good enough". Inside the frontier is above the line.
    // =====================================================================
    CH.frontier = (el) => {
      const W = 660, H = 380;
      const c = L.chart(W, H, { l: 50, r: 20, t: 30, b: 50 }, [0, 100], [0, 100]);
      const g = S('g', { class: 'axis' });
      g.append(S('line', { x1: c.m.l, x2: c.W - c.m.r, y1: c.H - c.m.b, y2: c.H - c.m.b }));
      g.append(S('line', { x1: c.m.l, x2: c.m.l, y1: c.m.t, y2: c.H - c.m.b }));
      g.append(txt(c.m.l, c.H - 8, 'tasks, in the order a person would rank their difficulty →', { class: 'axis-label' }));
      g.append(txt(c.m.l - 8, c.m.t + 4, 'AI', { class: 'axis-label', 'text-anchor': 'end' }));
      g.append(txt(c.m.l - 8, c.m.t + 18, 'success', { class: 'axis-label', 'text-anchor': 'end' }));
      c.g.append(g);
      // "good enough" line
      const gy = c.y(62);
      c.g.append(S('line', { x1: c.m.l, x2: c.W - c.m.r, y1: gy, y2: gy, stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '7 6' }));
      c.g.append(txt(c.W - c.m.r, gy - 8, 'good enough to use', { class: 'lbl', 'text-anchor': 'end', fill: 'var(--ink-2)' }));
      c.g.append(txt(c.x(2), c.y(4), 'hatched: inside the frontier, where the AI does the task', { class: 'boxsub', style: 'font-size:12px' }));
      // the jagged curve: high on the left, dips sharply, recovers, dips again
      const pts = [[0, 88], [8, 92], [16, 90], [22, 80], [27, 40], [31, 30], [36, 55], [44, 86], [52, 90], [58, 84], [63, 68], [68, 34], [73, 22], [78, 30], [84, 74], [90, 80], [96, 48], [100, 40]];
      const path = pts.map((p, i) => (i ? 'L' : 'M') + c.x(p[0]).toFixed(1) + ' ' + c.y(p[1]).toFixed(1)).join(' ');
      const ground = L.hatch(c.svg, 'h-front', 'var(--ink-3)');
      c.g.append(S('path', { d: `${path} L${c.x(100)} ${c.y(0)} L${c.x(0)} ${c.y(0)} Z`, fill: ground, stroke: 'none' }));
      c.g.append(S('path', { d: path, stroke: 'var(--ink)', 'stroke-width': 3.5, fill: 'none', 'stroke-linejoin': 'round' }));
      // two tasks of similar difficulty to a person, on opposite sides
      const mark = (x, y) => c.g.append(S('circle', { cx: c.x(x), cy: c.y(y), r: 8, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 3 }));
      mark(52, 90); mark(31, 30); mark(68, 34); mark(90, 80);
      c.g.append(txt(c.x(52), c.y(90) - 16, 'draft the literature summary', { class: 'lbl', 'text-anchor': 'middle' }));
      c.g.append(txt(c.x(31) + 12, c.y(30) + 5, 'judge how to frame the paper', { class: 'lbl' }));
      c.g.append(txt(c.x(68) + 12, c.y(34) + 5, 'spot the wrong fixed effect', { class: 'lbl' }));
      c.g.append(txt(c.x(90), c.y(80) - 16, 're-derive table 3', { class: 'lbl', 'text-anchor': 'middle' }));
      el.append(wrap(c.svg, LEFT), cap('Stylised, after Mollick and Dell’Acqua et al. (2026). Nothing here is measured; the shape is the claim. Tasks that look equally hard to a person land on opposite sides of the line, so the frontier has to be mapped task by task.'));
    };

    // =====================================================================
    // adoption-field: dumbbells by discipline, building in after the bet
    // =====================================================================
    CH['adoption-field'] = (el, o) => {
      const V = D.survey, rows = V.fields, W = 700, rowH = 40, top = 44, H = top + rows.length * rowH + 50;
      const c = L.chart(W, H, { l: 175, r: 60, t: top, b: 44 }, [0, 100], [0, 1]);
      L.axisX(c, [0, 20, 40, 60, 80, 100], (v) => v + '%', 'share of respondents');
      for (const [v, lab] of [[V.overallAgent, `${V.overallAgent}% use a coding agent`], [V.overallAI, `${V.overallAI}% use AI`]]) {
        c.g.append(S('line', { x1: c.x(v), x2: c.x(v), y1: top - 14, y2: H - c.m.b, stroke: 'var(--line)', 'stroke-dasharray': '4 4' }));
        c.g.append(txt(c.x(v), top - 20, lab, { 'text-anchor': 'middle', class: 'lbl', fill: 'var(--ink-2)' }));
      }
      const parts = rows.map((r, i) => {
        const y = top + i * rowH + rowH / 2;
        c.g.append(txt(c.m.l - 12, y + 5, r.name, { 'text-anchor': 'end', class: 'lbl' }));
        c.g.append(txt(c.m.l - 12, y + 19, `n = ${r.n}`, { 'text-anchor': 'end', fill: 'var(--ink-3)', style: 'font-size:12px' }));
        const bar = S('line', { y1: y, y2: y, stroke: 'var(--line)', 'stroke-width': 3 });
        const abar = S('line', { y1: y, y2: y, stroke: 'var(--agent)', 'stroke-width': 3 });
        const d1 = S('circle', { cy: y, r: 7, fill: 'var(--agent)' });
        const d2 = S('circle', { cy: y, r: 7, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 2.5 });
        const t1 = txt(0, y + 5, '', { class: 'lbl-mono', fill: 'var(--agent)' });
        const t2 = txt(0, y + 5, '', { class: 'lbl-mono' });
        c.g.append(bar, abar, d1, d2, t1, t2);
        return { r, bar, abar, d1, d2, t1, t2 };
      });
      // k: 0 = only the open dots (any AI tool); 1 = the agent dots at their true values
      const draw = (k) => parts.forEach((p, i) => {
        const a = p.r.ai + (p.r.agent - p.r.ai) * k, b = p.r.ai;
        p.bar.setAttribute('x1', c.x(a)); p.bar.setAttribute('x2', c.x(b));
        p.abar.setAttribute('x1', c.x(0)); p.abar.setAttribute('x2', c.x(a));
        p.abar.setAttribute('visibility', k > 0 ? 'visible' : 'hidden');
        p.d1.setAttribute('cx', c.x(a)); p.d1.setAttribute('visibility', k > 0 ? 'visible' : 'hidden');
        p.d2.setAttribute('cx', c.x(b));
        p.t1.setAttribute('x', c.x(a) + 12); p.t1.textContent = k > 0.98 ? `${p.r.agent}%` : '';
        if (i === 0) { p.t1.setAttribute('style', 'font-size:20px;font-weight:700'); p.t1.setAttribute('y', +p.d1.getAttribute('cy') + 7); }
        p.t2.setAttribute('x', c.x(b) + 12); p.t2.textContent = `${p.r.ai}%`;
      });
      const leg = E('div', { class: 'legend' }, [
        E('span', { style: '--c:var(--agent)', text: 'uses a coding agent' }),
        E('span', { style: '--c:var(--ink)', text: 'uses any AI tool' }),
      ]);
      const st = status('');
      el.append(wrap(c.svg, LEFT), leg, st, cap(`Measured. Lyttelton, Massenkoff and Wilmers (2026), Anthropic Research survey of ${L.fmtInt(V.n)} social scientists, ${V.when}. Self-selected respondents, so the levels are likely upper bounds; the ordering across fields is the point.`));
      if (!o.animate) { draw(1); st.textContent = 'Filled: uses a coding agent. Open: uses any AI tool.'; return; }
      draw(0);
      st.innerHTML = 'Open dots: any AI tool. <b>Click the chart</b> to ask who uses an agent.';
      let done = false;
      const go = () => { if (done) return; done = true; st.textContent = 'The blue dots are the agent users: what is left when you ask the harder question.'; L.tween(0, 1, 1600, draw); };
      c.svg.addEventListener('click', go);
      c.svg.style.cursor = 'pointer';
      return () => c.svg.removeEventListener('click', go);
    };

    // =====================================================================
    // adoption-career: two lines over five career stages
    // =====================================================================
    CH['adoption-career'] = (el) => {
      const V = D.survey, rows = V.career, W = 660, H = 380;
      const short = ['PhD student', 'Postdoc', 'Asst. prof.', 'Assoc. prof.', 'Full prof.'];
      const c = L.chart(W, H, { l: 56, r: 30, t: 34, b: 62 }, [-0.5, rows.length - 0.5], [0, 100]);
      c.g.append(S('rect', { x: c.x(-0.5), y: c.m.t, width: c.x(1.5) - c.x(-0.5), height: c.H - c.m.b - c.m.t, fill: 'var(--paper-3)' }));
      L.axisY(c, [0, 20, 40, 60, 80, 100], (v) => v + '%', 'share of respondents');
      L.axisX(c, rows.map((_, i) => i), (i) => short[i], null);
      rows.forEach((r, i) => c.g.append(txt(c.x(i), c.H - c.m.b + 32, `n = ${r.n}`, { 'text-anchor': 'middle', fill: 'var(--ink-3)', style: 'font-size:12px' })));
      for (const [key, color, fillDot] of [['ai', 'var(--ink)', false], ['agent', 'var(--agent)', true]]) {
        c.g.append(S('path', { d: L.linePath(rows.map((r, i) => [c.x(i), c.y(r[key])])), stroke: color, 'stroke-width': 3, fill: 'none' }));
        rows.forEach((r, i) => {
          c.g.append(S('circle', { cx: c.x(i), cy: c.y(r[key]), r: 7, fill: fillDot ? color : 'var(--paper)', stroke: color, 'stroke-width': 2.5 }));
          c.g.append(txt(c.x(i), c.y(r[key]) - 14, `${r[key]}%`, { 'text-anchor': 'middle', class: 'lbl-mono', fill: color }));
        });
      }
      c.g.append(txt(c.x(0.5), c.H - c.m.b - 10, 'in training', { 'text-anchor': 'middle', class: 'axis-label' }));
      const leg = E('div', { class: 'legend' }, [
        E('span', { style: '--c:var(--agent)', text: 'uses a coding agent' }),
        E('span', { style: '--c:var(--ink)', text: 'uses any AI tool' }),
      ]);
      el.append(wrap(c.svg, LEFT), leg, cap(`Measured. Lyttelton, Massenkoff and Wilmers (2026), ${L.fmtInt(V.n)} social scientists, ${V.when}. The shaded band marks the two stages in training; it is the deck’s annotation, not the survey’s.`));
    };

    // =====================================================================
    // adoption-use: paired bars, agent users vs other AI users
    // =====================================================================
    CH['adoption-use'] = (el) => {
      const V = D.survey, rows = V.uses, W = 680, rowH = 46, top = 24, H = top + rows.length * rowH + 50;
      const c = L.chart(W, H, { l: 150, r: 60, t: top, b: 44 }, [0, 100], [0, 1]);
      L.axisX(c, [0, 25, 50, 75, 100], (v) => v + '%', 'share selecting this use case');
      rows.forEach((r, i) => {
        const y = top + i * rowH;
        c.g.append(txt(c.m.l - 12, y + rowH / 2 + 5, r.name, { 'text-anchor': 'end', class: 'lbl' }));
        c.g.append(S('rect', { x: c.x(0), y: y + 5, width: c.x(r.agent) - c.x(0), height: 16, rx: 2, fill: 'var(--agent)' }));
        c.g.append(txt(c.x(r.agent) + 8, y + 18, `${r.agent}%`, { class: 'lbl-mono', fill: 'var(--agent)' }));
        c.g.append(S('rect', { x: c.x(0), y: y + 24, width: c.x(r.other) - c.x(0), height: 16, rx: 2, fill: 'var(--chat)' }));
        c.g.append(txt(c.x(r.other) + 8, y + 37, `${r.other}%`, { class: 'lbl-mono', fill: 'var(--chat)' }));
      });
      const leg = E('div', { class: 'legend' }, [
        E('span', { style: '--c:var(--agent)', text: 'coding-agent users' }),
        E('span', { style: '--c:var(--chat)', text: 'other AI users' }),
      ]);
      el.append(wrap(c.svg, LEFT), leg, cap(`Measured. Lyttelton, Massenkoff and Wilmers (2026), ${L.fmtInt(V.n)} social scientists, ${V.when}. A cross-section: it cannot say whether the tool causes the extra use or heavier users pick the tool.`));
    };

    // =====================================================================
    // harness-loop: the agentic loop, one step per press
    // =====================================================================
    CH['harness-loop'] = (el) => {
      const steps = D.loop.steps, W = 700, H = 236;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const B = {
        you: { x: 10, y: 100, w: 130, h: 62, label: 'You', sub: 'prompt in, result out' },
        ctx: { x: 270, y: 8, w: 160, h: 54, label: 'Context', sub: 'CLAUDE.md, files, history' },
        model: { x: 270, y: 100, w: 160, h: 62, label: 'Model', sub: 'predicts the next step' },
        read: { x: 560, y: 24, w: 130, h: 40, label: 'Read a file', sub: '' },
        edit: { x: 560, y: 100, w: 130, h: 40, label: 'Write a file', sub: '' },
        bash: { x: 560, y: 176, w: 130, h: 40, label: 'Run a command', sub: '' },
      };
      const boxEl = {};
      for (const [id, b] of Object.entries(B)) {
        const g = S('g');
        g.append(S('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 8, class: 'box' }));
        g.append(txt(b.x + b.w / 2, b.y + (b.sub ? 26 : b.h / 2 + 5), b.label, { 'text-anchor': 'middle', class: 'boxlbl' }));
        if (b.sub) g.append(txt(b.x + b.w / 2, b.y + 46, b.sub, { 'text-anchor': 'middle', class: 'boxsub', style: 'font-size:12.5px' }));
        svg.append(g); boxEl[id] = g.firstChild;
      }
      svg.append(txt(625, 232, 'tools, run by the harness', { 'text-anchor': 'middle', class: 'axis-label' }));
      const cy = (b) => b.y + b.h / 2, cx = (b) => b.x + b.w / 2;
      const arrowPath = (f, t) => {
        const a = B[f], b = B[t];
        if (f === 'you' && t === 'model') return `M${a.x + a.w} ${cy(a) - 10} H${b.x}`;
        if (f === 'model' && t === 'you') return `M${a.x} ${cy(a) + 10} H${b.x + b.w}`;
        if (f === 'ctx' && t === 'model') return `M${cx(a)} ${a.y + a.h + 2} V${b.y - 2}`;
        // model → tool: leave the model's right edge, arrive at the tool's left edge, upper lane
        if (f === 'model') return `M${a.x + a.w} ${cy(a) - 8} C ${a.x + a.w + 70} ${cy(a) - 8}, ${b.x - 70} ${cy(b) - 8}, ${b.x} ${cy(b) - 8}`;
        // tool → model: leave the tool's left edge, arrive at the model's right edge, lower lane
        return `M${a.x} ${cy(a) + 8} C ${a.x - 70} ${cy(a) + 8}, ${b.x + b.w + 70} ${cy(b) + 8}, ${b.x + b.w} ${cy(b) + 8}`;
      };
      const d = S('defs'); const m = S('marker', { id: 'lp-head', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }); m.append(S('path', { d: 'M0 0 L10 5 L0 10 z', fill: 'currentColor' })); d.append(m); svg.insertBefore(d, svg.firstChild);
      const arrows = {};
      steps.forEach((s) => {
        const k = s.from + '>' + s.to;
        if (arrows[k]) return;
        const p = S('path', { d: arrowPath(s.from, s.to), class: 'arrow', 'marker-end': 'url(#lp-head)', style: 'color:var(--line)' });
        svg.append(p); arrows[k] = p;
      });
      const log = E('ol', { class: 'trace' }, steps.map((s) => E('li', { text: s.log })));
      let i = STATIC ? steps.length : 0;
      const st = status('');
      const b = btn('Step', () => { if (i < steps.length) { i++; draw(); } });
      const reset = chipBtn('Reset', () => { i = 0; draw(); });
      const draw = () => {
        Object.values(arrows).forEach((p) => { p.setAttribute('class', 'arrow'); p.style.color = 'var(--line)'; });
        Object.values(boxEl).forEach((r) => r.setAttribute('class', 'box'));
        steps.slice(0, i).forEach((s, k) => {
          const p = arrows[s.from + '>' + s.to];
          const on = k === i - 1 && !STATIC;
          p.setAttribute('class', 'arrow ' + (on ? 'on' : 'done')); p.style.color = on ? 'var(--ink)' : 'var(--ink-3)';
          if (on) { boxEl[s.from].setAttribute('class', 'box on'); boxEl[s.to].setAttribute('class', 'box on'); }
        });
        [...log.children].forEach((li, k) => { li.className = k < i ? (k === i - 1 && !STATIC ? 'on' : 'done') : ''; });
        b.disabled = i >= steps.length;
        const tools = steps.filter((s) => s.from === 'model' && s.to !== 'you').length;
        st.innerHTML = i === 0 ? 'Press <b>step</b> to run the request through the loop.' : i < steps.length ? `Step ${i} of ${steps.length}` : `${tools} tool calls, ${tools + 1} model calls, one result. The model never touched a file; it asked the harness to.`;
      };
      draw();
      el.append(wrap(svg, LEFT), log, E('div', { class: 'ctl' }, [b, reset, st]));
    };

    // =====================================================================
    // context-budget: a context window filling with PDF pages
    // =====================================================================
    CH['context-budget'] = (el) => {
      const T = D.tokens, W = 700, H = 170, bx = 0, bw = W, by = 34, bh = 48;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', preserveAspectRatio: 'xMinYMin meet' });
      // the window is a clip: what is pushed past its left edge is gone
      const defs = S('defs'); const cp = S('clipPath', { id: 'ctx-clip' }); cp.append(S('rect', { x: bx, y: by, width: bw, height: bh, rx: 6 })); defs.append(cp); svg.append(defs);
      svg.append(S('rect', { x: bx, y: by, width: bw, height: bh, rx: 6, fill: 'var(--paper-2)', stroke: 'var(--line)' }));
      const segColors = ['var(--ink-3)', 'var(--ink)'];
      const clipG = S('g', { 'clip-path': 'url(#ctx-clip)' });
      const grp = S('g', { style: 'transition: transform 0.35s ease' });
      clipG.append(grp);
      const segs = T.fixed.map((f, k) => { const r = S('rect', { y: by, height: bh, fill: segColors[k] }); grp.append(r); return { f, r }; });
      const files = S('rect', { y: by, height: bh, fill: 'var(--context)' });
      grp.append(files); svg.append(clipG);
      svg.append(S('rect', { x: bx, y: by, width: bw, height: bh, rx: 6, fill: 'none', stroke: 'var(--line)' }));
      // the dropped stub: the standing instructions, outside the window
      const dropped = S('g', { visibility: 'hidden' });
      dropped.append(S('rect', { x: bx + 6, y: by + bh + 30, width: 0, height: 26, fill: 'var(--ink-3)', transform: `rotate(-7 ${bx + 6} ${by + bh + 30})` }));
      dropped.append(txt(bx + 6, by + bh + 78, 'CLAUDE.md and the system prompt: pushed out of the window', { class: 'lbl', style: 'fill:var(--ink-2);font-size:13px' }));
      svg.append(dropped);
      svg.append(txt(bx, by - 12, '0', { class: 'lbl-mono' }));
      svg.append(txt(bx + bw, by - 12, `${L.fmtInt(T.window / 1e6)} million tokens, the whole window`, { class: 'lbl-mono', 'text-anchor': 'end' }));
      const pct = txt(0, by + bh + 22, '', { class: 'lbl', 'text-anchor': 'middle' });
      svg.append(pct);
      const fixed = T.fixed.reduce((a, f) => a + f.tokens, 0);
      const xu = (tok) => bx + bw * tok / T.window;  // unclamped: the filled bar may extend past the window
      const sl = L.slider('PDF pages read this session', 0, T.maxPages, T.startPages, 20, (v) => String(v), 'ctx-pages');
      const st = status('');
      const leg = E('div', { class: 'legend' }, [
        ...T.fixed.map((f, k) => E('span', { style: `--c:${segColors[k]}`, text: f.name })),
        E('span', { style: '--c:var(--context)', text: 'files the agent has read' }),
      ]);
      const set = (pages) => {
        let acc = 0;
        segs.forEach((s) => { s.r.setAttribute('x', xu(acc)); s.r.setAttribute('width', xu(acc + s.f.tokens) - xu(acc)); acc += s.f.tokens; });
        const ft = pages * T.perPage, total = fixed + ft, full = total > T.window;
        files.setAttribute('x', xu(fixed)); files.setAttribute('width', xu(total) - xu(fixed));
        const shift = full ? xu(total) - xu(T.window) : 0;
        grp.setAttribute('transform', `translate(${-shift} 0)`);
        const stubW = xu(T.fixed[0].tokens) - xu(0);
        dropped.setAttribute('visibility', full ? 'visible' : 'hidden');
        dropped.firstChild.setAttribute('width', Math.min(shift, stubW));
        const share = Math.round(Math.min(total, T.window) / T.window * 100);
        pct.setAttribute('x', xu(Math.min(total, T.window)) / 2); pct.textContent = full ? 'full: the oldest part of the session has been pushed out' : `${share}% used`;
        st.innerHTML = full
          ? `<span class="num">${L.fmtInt(pages)}</span> pages is more than the window holds. The oldest part of the session drops out first, and that is where your instructions were.`
          : `<span class="num">${L.fmtInt(pages)}</span> pages, about <span class="num">${Math.round(pages / 200)}</span> long PDFs ≈ <span class="num">${L.fmtInt(ft)}</span> tokens, <span class="num">${share}%</span> of the window used in total.`;
      };
      set(T.startPages);
      sl.input.addEventListener('input', () => set(+sl.input.value));
      el.append(wrap(svg, LEFT), leg, sl.row, st, cap(`Stylised arithmetic with real orders of magnitude: about ${L.fmtInt(T.window / 1e6)} million tokens in the window, about ${T.perPage} tokens a PDF page, so a 200-page PDF is 80–100k. The fixed segments are rules of thumb for a Claude Code session. Quality degrades well before the bar is full.`));
    };

    // =====================================================================
    // checks-cost: four verification checks on a cost axis
    // =====================================================================
    CH['checks-cost'] = (el) => {
      const C = D.checks, W = 700, H = 330;
      const c = L.chart(W, H, { l: 30, r: 30, t: 40, b: 50 }, [Math.log10(2), Math.log10(600)], [0, 1]);
      const ticks = [5, 15, 60, 240];
      const fmt = (m) => m < 60 ? `${m} min` : `${m / 60} h`;
      const g = S('g', { class: 'axis' });
      g.append(S('line', { x1: c.m.l, x2: c.W - c.m.r, y1: c.H - c.m.b, y2: c.H - c.m.b }));
      for (const t of ticks) { g.append(S('line', { x1: c.x(Math.log10(t)), x2: c.x(Math.log10(t)), y1: c.H - c.m.b, y2: c.H - c.m.b + 4 })); g.append(txt(c.x(Math.log10(t)), c.H - c.m.b + 16, fmt(t), { 'text-anchor': 'middle' })); }
      g.append(txt((c.m.l + c.W - c.m.r) / 2, c.H - 4, 'roughly what the check costs you (log scale)', { 'text-anchor': 'middle', class: 'axis-label' }));
      c.g.append(g);
      C.forEach((k, i) => {
        const x = c.x(Math.log10(k.minutes)), y = c.H - c.m.b;
        const ly = c.m.t + 20 + i * 62;
        c.g.append(S('line', { x1: x, x2: x, y1: y, y2: ly + 8, stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
        c.g.append(S('circle', { cx: x, cy: y, r: 9, fill: 'var(--check)' }));
        const anchor = i === C.length - 1 ? 'end' : 'start', dx = i === C.length - 1 ? -10 : 10;
        c.g.append(txt(x + dx, ly, `${i + 1}. ${k.name}`, { 'text-anchor': anchor, class: 'lbl', style: 'font-size:15px' }));
        c.g.append(txt(x + dx, ly + 19, `catches ${k.catches}`, { 'text-anchor': anchor, class: 'boxsub', style: 'font-size:13px' }));
      });
      el.append(wrap(c.svg, LEFT), cap('Costs are rough: minutes for the first two, a quarter of an hour for the quiz, hours for a reimplementation. Each check is independent of the agent that wrote the code in a different way.'));
    };

    // =====================================================================
    // serrano: take-home midterm against in-person final, one dot per student
    // =====================================================================
    CH.serrano = (el) => {
      const P = D.serrano.pairs, W = 660, H = 400;
      const c = L.chart(W, H, { l: 56, r: 24, t: 30, b: 50 }, [0, 100], [0, 100]);
      L.axisY(c, [0, 20, 40, 60, 80, 100], (v) => v, 'in-person final score');
      L.axisX(c, [0, 20, 40, 60, 80, 100], (v) => v, 'take-home midterm score');
      c.g.append(S('line', { x1: c.x(0), y1: c.y(0), x2: c.x(100), y2: c.y(100), stroke: 'var(--line)', 'stroke-dasharray': '5 5' }));
      c.g.append(txt(c.x(78), c.y(84), 'same score on both', { class: 'lbl', fill: 'var(--ink-3)', 'text-anchor': 'end' }));
      P.forEach(([m, f]) => c.g.append(S('circle', { cx: c.x(m), cy: c.y(f), r: 6, fill: 'var(--ink)', 'fill-opacity': 0.55 })));
      const med = (arr) => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
      const mm = med(P.map((p) => p[0])), mf = med(P.map((p) => p[1]));
      c.g.append(S('line', { x1: c.x(mm), x2: c.x(mm), y1: c.m.t, y2: c.H - c.m.b, stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '3 4' }));
      c.g.append(S('line', { x1: c.m.l, x2: c.W - c.m.r, y1: c.y(mf), y2: c.y(mf), stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '3 4' }));
      c.g.append(txt(c.x(mm) - 6, c.m.t + 12, `median midterm ${mm}`, { class: 'lbl', 'text-anchor': 'end', fill: 'var(--ink-2)' }));
      c.g.append(txt(c.m.l + 6, c.y(mf) - 6, `median final ${mf}`, { class: 'lbl', fill: 'var(--ink-2)' }));
      el.append(wrap(c.svg, LEFT), cap(`Measured. One dot per student, ${P.length} students who took both exams in Serrano’s ECON 1170 after the final was moved in-person; ${D.serrano.dropped} dropped the course and ${D.serrano.noExam} did not sit the final. Values read off the chart reproduced in Bryan (2026).`));
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
