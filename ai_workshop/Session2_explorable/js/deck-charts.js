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
 *   timer            a countdown the presenter starts for each exercise
 *   fan-out          the main agent hands the paper to eight reviewers at once
 *   skill-load       a window strip: CLAUDE.md is always there, the skill arrives when called
 *   second-opinion   two reviewers' windows side by side: the author's and a fresh one
 *   server-wall      the secure-data workflow, six steps, nothing crosses back but your words
 *   paper-code-map   the paper's claims mapped to the scripts that produce them
 *   parrot           two miniature slides: the Beamer parrot and an explorable slide
 *   explorable-tree  an explorable website as a tree of short decks, with forks
 *   outputs          one paper at the centre, five outputs for five audiences
 *   serrano          take-home midterm against in-person final, 59 students (the morning's)
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
    const txt = (x, y, text, attrs = {}) => {
      const a = Object.assign({ x, y, text }, attrs);
      if (a.fill) { a.style = (a.style ? a.style + ';' : '') + 'fill:' + a.fill; delete a.fill; }   // the theme's classes set fill, so an attribute would lose
      return S('text', a);
    };
    const pad2 = (n) => String(n).padStart(2, '0');

    // An HTML window strip: segments with relative widths, labels inside when they fit
    const strip = (segs, opts = {}) => {
      const s = E('div', { class: 'wstrip' + (opts.cls ? ' ' + opts.cls : '') });
      segs.forEach((g) => s.append(E('span', { style: `flex:${g.w} 0 0;background:${g.color}`, text: g.w >= 14 ? g.name : '' })));
      if (opts.rest) s.append(E('span', { class: 'rest', style: `flex:${opts.restW || 1} 0 0`, text: opts.rest }));
      return s;
    };
    const legend = (segs) => E('div', { class: 'legend' }, segs.map((g) => E('span', { class: g.hatched ? 'hatched' : '', style: `--c:${g.color}`, text: g.name })));
    // An arrowhead in the colour of the path that uses it; the id must be unique in the deck
    const arrowHead = (svg, id) => {
      const d = S('defs'), m = S('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' });
      m.append(S('path', { d: 'M0 0 L10 5 L0 10 z', fill: 'currentColor' })); d.append(m); svg.insertBefore(d, svg.firstChild);
    };
    // A straight edge between two boxes given by centre and size, clipped to both borders
    const edge = (a, b, gap = 4) => {
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
      const s = (n) => Math.min(dx ? n.w / 2 / Math.abs(dx) : Infinity, dy ? n.h / 2 / Math.abs(dy) : Infinity) + gap / len;
      const sa = s(a), sb = s(b);
      return `M${a.x + sa * dx} ${a.y + sa * dy} L${b.x - sb * dx} ${b.y - sb * dy}`;
    };

    const CH = {};

    // =====================================================================
    // timer: one press. Reads data-minutes from the stage.
    // =====================================================================
    CH.timer = (el) => {
      const mins = +(el.dataset.minutes || 10), total = mins * 60;
      let left = total, id = null;
      const cmd = el.dataset.cmd ? E('div', { class: 'cmdline', html: el.dataset.cmd + '<span class="cursor"></span>' }) : null;
      const disp = E('div', { class: 'timer' });
      const fill = E('div', { class: 'timer-fill' });
      const track = E('div', { class: 'timer-track' }, [fill]);
      const st = status('');
      const draw = () => {
        disp.textContent = `${pad2(Math.floor(left / 60))}:${pad2(left % 60)}`;
        fill.style.width = (100 * (1 - left / total)).toFixed(1) + '%';
        st.textContent = left === 0 ? 'Time.' : id ? 'Running.' : left === total ? `${mins} minutes on the clock.` : 'Paused.';
      };
      const stop = () => { if (id) { clearInterval(id); id = null; } };
      const b = btn('Start', () => {
        if (id) { stop(); b.textContent = 'Start'; draw(); return; }
        if (left === 0) return;
        b.textContent = 'Pause'; if (cmd) cmd.classList.add('entered');
        id = setInterval(() => { left = Math.max(0, left - 1); if (left === 0) { stop(); b.textContent = 'Start'; } draw(); }, 1000);
        draw();
      });
      const reset = chipBtn('Reset', () => { stop(); left = total; b.textContent = 'Start'; if (cmd) cmd.classList.remove('entered'); draw(); });
      draw();
      // the tally: one square per answer key; the presenter clicks the ones the room reports wrong
      const n = +(el.dataset.tally || 0);
      let tally = null, tst = null;
      if (n) {
        tst = E('p', { class: 'caption status', text: `0 of ${n} answer keys wrong, against the number you guessed` });
        tally = E('div', { class: 'tally' }, Array.from({ length: n }, (_, i) => {
          const q = E('button', { 'aria-pressed': 'false', 'aria-label': `key ${i + 1}` });
          q.addEventListener('click', () => { q.setAttribute('aria-pressed', q.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); const k = tally.querySelectorAll('[aria-pressed="true"]').length; tst.textContent = `${k} of ${n} answer keys wrong, against the number you guessed`; });
          return q;
        }));
      }
      el.append(...[cmd, disp, track, E('div', { class: 'ctl' }, [b, reset, st]), tally, tst].filter(Boolean),
        cap(n ? 'The clock for this exercise, and a tally: click one square per wrong answer key as the room reports them.' : 'The clock for this exercise. Start it when the room starts; the bar fills as the time goes.'));
      return stop;
    };

    // =====================================================================
    // fan-out: the main agent hands the paper to eight reviewers at once
    // =====================================================================
    CH['fan-out'] = (el, o) => {
      const R = D.skill.reviewers, W = 700, H = 372;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const M = { x: 10, y: 118, w: 190, h: 84 };            // the main agent
      const P = { x: 10, y: 262, w: 190, h: 56 };            // the report
      const rowY = (k) => 12 + k * 43, RX = 300, RW = 390, RH = 34;
      // main agent, in Ben's colour: it is the conversation you are in
      svg.append(S('rect', { x: M.x, y: M.y, width: M.w, height: M.h, rx: 8, fill: 'var(--agent-soft)', stroke: 'var(--agent)', 'stroke-width': 2 }));
      svg.append(txt(M.x + M.w / 2, M.y + 30, 'Main agent', { 'text-anchor': 'middle', class: 'boxlbl' }));
      svg.append(txt(M.x + M.w / 2, M.y + 50, 'the conversation you are in', { 'text-anchor': 'middle', class: 'boxsub' }));
      svg.append(txt(M.x + M.w / 2, M.y + 68, 'reads the skill, finds the files', { 'text-anchor': 'middle', class: 'boxsub' }));
      // the report box, empty until the summaries are back
      const rep = S('rect', { x: P.x, y: P.y, width: P.w, height: P.h, rx: 8, class: 'box' });
      const repT = txt(P.x + P.w / 2, P.y + 24, 'reviews/report.md', { 'text-anchor': 'middle', class: 'lbl-mono', fill: 'var(--ink-3)' });
      const repS = txt(P.x + P.w / 2, P.y + 43, 'not yet written', { 'text-anchor': 'middle', class: 'boxsub' });
      svg.append(rep, repT, repS);
      svg.append(S('path', { d: `M${M.x + M.w / 2} ${M.y + M.h} V${P.y}`, class: 'arrow' }));
      svg.append(txt(RX + RW / 2, H - 6, 'eight subagents, each with a fresh, empty window', { 'text-anchor': 'middle', class: 'axis-label' }));
      // reviewers: a column of eight, a fan of lines from the main agent
      const rows = R.map((r, k) => {
        const y = rowY(k);
        const line = S('path', { d: `M${M.x + M.w} ${M.y + M.h / 2} C ${M.x + M.w + 50} ${M.y + M.h / 2}, ${RX - 50} ${y + RH / 2}, ${RX} ${y + RH / 2}`, class: 'arrow' });
        const box = S('rect', { x: RX, y, width: RW, height: RH, rx: 6, fill: 'var(--paper)', stroke: 'var(--check)', 'stroke-width': 1.5 });
        const bar = S('rect', { x: RX + 1, y: y + 1, width: 0, height: RH - 2, rx: 5, fill: 'var(--check)', 'fill-opacity': 0.18 });
        // the reviewer's window: a grey stub, the whole paper in brick, the rest empty
        svg.append(S('rect', { x: RX + 10, y: y + RH - 9, width: RW - 20, height: 5, rx: 2, fill: 'var(--paper-2)', stroke: 'var(--line)', 'stroke-width': 0.8 }));
        svg.append(S('rect', { x: RX + 10, y: y + RH - 9, width: 14, height: 5, rx: 2, fill: 'var(--ink-3)' }));
        svg.append(S('rect', { x: RX + 25, y: y + RH - 9, width: (RW - 20) * 0.42, height: 5, fill: 'var(--context)' }));
        const name = txt(RX + 12, y + RH / 2 + 1, `${r.n}  ${r.name}`, { class: 'lbl', style: 'font-size:13px' });
        const tick = txt(RX + RW - 12, y + RH / 2 + 1, '', { 'text-anchor': 'end', class: 'lbl-mono', fill: 'var(--check)' });
        svg.append(line, box, bar); svg.append(name, tick);
        return { line, box, bar, tick };
      });
      // stylised, seeded durations so the picture is the same every time
      const rng = L.rng(8);
      const dur = R.map(() => 1800 + rng() * 2200);
      const st = status('');
      let raf = null, t0 = null;
      const paint = (k) => {                                // k in [0, 1]: overall progress
        let done = 0;
        rows.forEach((r, i) => {
          const p = L.clamp(k * 4000 / dur[i], 0, 1);
          r.bar.setAttribute('width', Math.max(0, (RW - 2) * p));
          const fin = p >= 1;
          r.line.setAttribute('class', 'arrow ' + (k === 0 ? '' : fin ? 'back' : 'out'));
          r.tick.textContent = fin ? 'summary ✓' : k > 0 ? 'reading…' : '';
          if (fin) done++;
        });
        const all = done === rows.length;
        rep.setAttribute('class', all ? 'box on' : 'box');
        repT.setAttribute('fill', all ? 'var(--ink)' : 'var(--ink-3)');
        repS.textContent = all ? 'eight sections, one report' : k > 0 ? `${done} of ${rows.length} summaries back` : 'not yet written';
        st.innerHTML = k === 0 ? 'Press <b>run</b>: the main agent sends the paper to all eight at once.'
          : all ? 'Eight summaries, one report, in the time the slowest reviewer took.'
          : `${done} of ${rows.length} reviewers finished. They run in parallel, so the report takes as long as the slowest one.`;
      };
      const run = () => {
        if (raf) cancelAnimationFrame(raf);
        t0 = performance.now();
        const step = (t) => { const k = L.clamp((t - t0) / 4000, 0, 1); paint(k); if (k < 1) raf = requestAnimationFrame(step); else raf = null; };
        raf = requestAnimationFrame(step);
      };
      const b = btn('Run /review-paper', () => { if (L.reduced()) paint(1); else run(); });
      const reset = chipBtn('Reset', () => { if (raf) cancelAnimationFrame(raf); raf = null; paint(0); });
      paint(STATIC ? 1 : 0);
      el.append(wrap(svg, LEFT), E('div', { class: 'ctl' }, [b, reset, st]), cap('The eight reviewers are the ones the installed skill launches; the timing is stylised. Teal: a reviewer with one job. The strip along each row is its window: a grey stub, the whole paper in brick, the rest empty. Blue: the main agent, which finds the files and consolidates.'));
      return () => { if (raf) cancelAnimationFrame(raf); };
    };

    // =====================================================================
    // skill-load: a window strip zoomed on its first 100k tokens
    // =====================================================================
    CH['skill-load'] = (el) => {
      const T = D.windowLoad, W = 1000, H = 150, by = 30, bh = 48;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', preserveAspectRatio: 'xMinYMin meet' });
      const xu = (tok) => W * tok / T.zoom;
      const hatched = L.hatch(svg, 'h-skill', 'var(--context)');
      svg.append(S('rect', { x: 0, y: by, width: W, height: bh, rx: 6, fill: 'var(--paper-2)', stroke: 'var(--line)' }));
      let acc = 0;
      const segEls = T.segs.map((g) => {
        const r = S('rect', { x: xu(acc), y: by, width: xu(g.tokens), height: bh, fill: g.color });
        acc += g.tokens; svg.append(r); return r;
      });
      const skillX = acc;
      const sk = S('rect', { x: xu(skillX), y: by, width: 0, height: bh, fill: hatched, stroke: 'var(--context)', 'stroke-width': 1.5 });
      svg.append(sk);
      const skLbl = txt(xu(skillX + T.skill.tokens) + 10, by + bh / 2 + 5, '', { class: 'lbl', fill: 'var(--context)' });
      svg.append(skLbl);
      svg.append(S('rect', { x: 0, y: by, width: W, height: bh, rx: 6, fill: 'none', stroke: 'var(--line)' }));
      svg.append(txt(0, by - 10, '0', { class: 'lbl-mono' }));
      svg.append(txt(W, by - 10, `${L.fmtInt(T.zoom / 1000)}k tokens, the first tenth of the window`, { class: 'lbl-mono', 'text-anchor': 'end' }));
      // the CLAUDE.md segment gets a pointer, because it is narrow
      const cl = T.segs[1], clX = xu(T.segs[0].tokens) + xu(cl.tokens) / 2;
      svg.append(S('line', { x1: clX, x2: clX, y1: by + bh, y2: by + bh + 12, stroke: 'var(--context)', 'stroke-width': 1.5 }));
      svg.append(txt(clX, by + bh + 26, 'CLAUDE.md', { 'text-anchor': 'middle', class: 'lbl', fill: 'var(--context)', style: 'font-size:12px' }));
      const st = status('');
      const tg = L.toggle('type /review-paper', false, 'skill-toggle');
      const set = (on) => {
        sk.setAttribute('width', on ? xu(T.skill.tokens) : 0);
        skLbl.textContent = on ? `← the skill, ${L.fmtInt(T.skill.tokens)} tokens` : '';
        st.innerHTML = on
          ? `The skill arrives in the conversation, about <span class="num">${L.fmtInt(T.skill.tokens)}</span> tokens. Start a fresh conversation (<b>/clear</b>) and it is gone; CLAUDE.md stays.`
          : `Every session starts like this. CLAUDE.md is about <span class="num">${L.fmtInt(cl.tokens)}</span> tokens, in every window, every time. Nothing of the skill is here yet.`;
      };
      tg.input.addEventListener('change', () => set(tg.input.checked));
      if (STATIC) { tg.input.checked = true; }
      set(tg.input.checked);
      el.append(wrap(svg, LEFT), legend([...T.segs, { name: T.skill.name, color: 'var(--context)', hatched: true }]), E('div', { class: 'ctl' }, [tg.row, st]),
        cap('Stylised token counts with real orders of magnitude: a million-token window, of which this strip is the first tenth. Brick is text you wrote for the agent; solid is loaded every session, hatched only when called. Grey is the provider’s.'));
    };

    // =====================================================================
    // second-opinion: two windows side by side, drawn as HTML strips
    // =====================================================================
    CH['second-opinion'] = (el) => {
      const O = D.secondOpinion;
      const a = E('div', { class: 'wblock' }, [
        E('p', { class: 'wlabel agent', text: 'Ask the agent that wrote the report to check it' }),
        strip(O.author, { cls: 'agent' }), legend(O.author),
        E('p', { class: 'wnote', text: 'Its own answer is in the window. Everything it reads next is read in the light of having written it; it has momentum and a position to defend.' }),
      ]);
      const b = E('div', { class: 'wblock' }, [
        E('p', { class: 'wlabel check', text: 'Spawn a fresh subagent to attack it' }),
        strip(O.fresh, { cls: 'check', rest: 'empty', restW: O.author.reduce((a, g) => a + g.w, 0) - O.fresh.reduce((a, g) => a + g.w, 0) }), legend(O.fresh),
        E('p', { class: 'wnote', text: 'Same paper, same report, no history. The report is a file it was handed, not a position it took, and it reads both cold.' }),
      ]);
      el.append(a, b, cap('Stylised: the widths are not measured. The same report is blue in the first window, where it is the agent’s own output, and brick in the second, where it is a file handed to a reviewer. Both reviewers see the paper.'));
    };

    // =====================================================================
    // server-wall: the secure-data workflow, six steps
    // =====================================================================
    CH['server-wall'] = (el) => {
      const C = D.secure, W = 700, H = 330;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const wall = L.hatch(svg, 'h-wall', 'var(--ink-3)');
      // laptop, Ben's side
      const LP = { x: 6, y: 34, w: 290, h: 250 };
      svg.append(S('rect', { x: LP.x, y: LP.y, width: LP.w, height: LP.h, rx: 10, fill: 'var(--paper)', stroke: 'var(--agent)', 'stroke-width': 2 }));
      svg.append(txt(LP.x + 14, LP.y + 24, 'Your laptop: the agent', { class: 'boxlbl', fill: 'var(--agent)' }));
      svg.append(txt(LP.x + 14, LP.y + 44, 'its window', { class: 'axis-label' }));
      // the agent's window strip inside the laptop
      const WS = { x: LP.x + 14, y: LP.y + 52, w: LP.w - 28, h: 30 };
      svg.append(S('rect', { x: WS.x, y: WS.y, width: WS.w, height: WS.h, rx: 5, fill: 'var(--paper-2)', stroke: 'var(--line)' }));
      const segW = (WS.w - 40) / C.local.length;
      const sys = S('rect', { x: WS.x, y: WS.y, width: 40, height: WS.h, rx: 5, fill: 'var(--ink-3)' });
      svg.append(sys);
      const files = C.local.map((f, i) => {
        const g = S('g', { visibility: 'hidden' });
        g.append(S('rect', { x: WS.x + 40 + i * segW, y: WS.y, width: segW - 2, height: WS.h, fill: 'var(--context)' }));
        g.append(S('line', { x1: WS.x + 40 + i * segW + (segW - 2) / 2, x2: WS.x + 40 + i * segW + (segW - 2) / 2, y1: WS.y + WS.h, y2: WS.y + WS.h + 6 + (i % 2) * 14, stroke: 'var(--context)', 'stroke-width': 1 }));
        g.append(txt(WS.x + 40 + i * segW + (segW - 2) / 2, WS.y + WS.h + 18 + (i % 2) * 14, f, { 'text-anchor': 'middle', class: 'lbl-mono', style: 'font-size:12px', fill: 'var(--context)' }));
        svg.append(g); return g;
      });
      // the loop on the laptop: iterate until it runs on the simulated data
      const loop = S('g', { visibility: 'hidden' });
      loop.append(S('path', { d: `M${LP.x + LP.w / 2 - 40} ${LP.y + 158} a 40 26 0 1 1 80 0`, class: 'arrow', 'marker-end': 'url(#sw-head)' }));
      loop.append(txt(LP.x + LP.w / 2, LP.y + 180, 'edit · run on sim_data · read the error · repeat', { 'text-anchor': 'middle', class: 'boxsub', style: 'font-size:12.5px' }));
      loop.append(txt(LP.x + LP.w / 2, LP.y + 196, 'until analysis.do runs', { 'text-anchor': 'middle', class: 'boxsub', style: 'font-size:12.5px' }));
      svg.append(loop);
      // the prompt bar: what you type after reading the log
      const prompt = S('g', { visibility: 'hidden' });
      prompt.append(S('rect', { x: LP.x + 14, y: LP.y + 206, width: LP.w - 28, height: 30, rx: 6, fill: 'var(--ink)' }));
      prompt.append(txt(LP.x + 24, LP.y + 226, '> r(459) on merge; add 2019 cohort', { class: 'lbl-mono', fill: 'var(--paper)', style: 'font-size:11.5px' }));
      svg.append(prompt);
      // the wall
      svg.append(S('rect', { x: 330, y: 10, width: 38, height: H - 20, fill: wall }));
      svg.append(txt(349, H / 2, 'the server’s boundary', { 'text-anchor': 'middle', class: 'axis-label', style: 'fill:var(--ink)', transform: `rotate(-90 349 ${H / 2})` }));
      // the server
      const SV = { x: 400, y: 34, w: 294, h: 250 };
      svg.append(S('rect', { x: SV.x, y: SV.y, width: SV.w, height: SV.h, rx: 10, fill: 'var(--paper-2)', stroke: 'var(--ink-3)', 'stroke-width': 2 }));
      svg.append(txt(SV.x + 14, SV.y + 24, 'The secure server: the real data', { class: 'boxlbl' }));
      svg.append(txt(SV.x + 14, SV.y + 44, 'never leaves, never pasted', { class: 'axis-label' }));
      C.registers.forEach((r, i) => {
        const cx = SV.x + 50 + i * 90, cy = SV.y + 86;
        svg.append(S('ellipse', { cx, cy: cy - 14, rx: 22, ry: 7, fill: 'var(--ink-3)' }));
        svg.append(S('rect', { x: cx - 22, y: cy - 14, width: 44, height: 30, fill: 'var(--ink-3)' }));
        svg.append(S('ellipse', { cx, cy: cy + 16, rx: 22, ry: 7, fill: 'var(--ink-2)' }));
        svg.append(txt(cx, cy + 40, r, { 'text-anchor': 'middle', class: 'lbl-mono', style: 'font-size:12px' }));
      });
      const doOnServer = S('g', { visibility: 'hidden' });
      doOnServer.append(S('rect', { x: SV.x + 14, y: SV.y + 130, width: 120, height: 30, rx: 5, fill: 'var(--paper)', stroke: 'var(--context)', 'stroke-width': 1.5 }));
      doOnServer.append(txt(SV.x + 74, SV.y + 150, 'analysis.do', { 'text-anchor': 'middle', class: 'lbl-mono', fill: 'var(--context)' }));
      svg.append(doOnServer);
      const logBox = S('g', { visibility: 'hidden' });
      logBox.append(S('rect', { x: SV.x + 150, y: SV.y + 130, width: 130, height: 30, rx: 5, class: 'box' }));
      logBox.append(txt(SV.x + 215, SV.y + 150, 'analysis.log', { 'text-anchor': 'middle', class: 'lbl-mono' }));
      logBox.append(txt(SV.x + 215, SV.y + 180, 'you read it here', { 'text-anchor': 'middle', class: 'boxsub' }));
      svg.append(logBox);
      // arrows across the wall: the do-file, carried by you; and the forbidden one
      const d = S('defs'); const m = S('marker', { id: 'sw-head', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }); m.append(S('path', { d: 'M0 0 L10 5 L0 10 z', fill: 'currentColor' })); d.append(m); svg.insertBefore(d, svg.firstChild);
      const carry = S('g', { visibility: 'hidden' });
      carry.append(S('path', { d: `M${LP.x + LP.w} ${SV.y + 145} H${SV.x + 12}`, class: 'arrow carry', 'marker-end': 'url(#sw-head)' }));
      carry.append(txt(349, SV.y + 134, 'you carry it', { 'text-anchor': 'middle', class: 'lbl', style: 'font-size:12px' }));
      svg.append(carry);
      const never = S('g', { visibility: 'hidden' });
      never.append(S('path', { d: `M${SV.x + 150} ${SV.y + 200} C ${SV.x + 80} ${SV.y + 240}, ${LP.x + LP.w + 60} ${SV.y + 240}, ${LP.x + LP.w + 4} ${SV.y + 222}`, stroke: 'var(--chat)', 'stroke-width': 2, fill: 'none', 'stroke-dasharray': '6 5' }));
      // Anna's chat bubble, struck through: pasting the log into a chat is the agent reading it
      never.append(S('path', { d: `M${SV.x + 60} ${SV.y + 214} h44 a6 6 0 0 1 6 6 v22 a6 6 0 0 1 -6 6 h-26 l-10 9 v-9 h-8 a6 6 0 0 1 -6 -6 v-22 a6 6 0 0 1 6 -6 z`, fill: 'var(--chat-soft)', stroke: 'var(--chat)', 'stroke-width': 2 }));
      never.append(S('line', { x1: SV.x + 52, y1: SV.y + 258, x2: SV.x + 118, y2: SV.y + 206, stroke: 'var(--ink)', 'stroke-width': 3 }));
      never.append(txt(SV.x + 14, SV.y + 270, 'not the log, not the results,', { class: 'lbl', style: 'font-size:12px' }));
      never.append(txt(SV.x + 14, SV.y + 285, 'and not into a chat window either', { class: 'lbl', style: 'font-size:12px' }));
      svg.append(never);
      // wiring
      const steps = C.steps;
      let i = STATIC ? steps.length : 0;
      const st = status('');
      const b = btn('Step', () => { if (i < steps.length) { i++; draw(); } });
      const reset = chipBtn('Reset', () => { i = 0; draw(); });
      const show = (g, on) => g.setAttribute('visibility', on ? 'visible' : 'hidden');
      const draw = () => {
        files.forEach((g) => show(g, i >= 1));
        show(loop, i >= 2); show(carry, i === 3 || i >= 6); show(doOnServer, i >= 3); show(logBox, i >= 4);
        show(prompt, i >= 5); show(never, i >= 5);
        b.disabled = i >= steps.length;
        st.innerHTML = i === 0 ? 'Press <b>step</b>. Six steps; the wall is never crossed by data.' : `<b>${steps[i - 1].log}</b>`;
      };
      draw();
      el.append(wrap(svg, LEFT), E('div', { class: 'ctl' }, [b, reset, st]), cap('Stylised. Brick: what is in the agent’s window. Grey: the registers the agent never sees. The dashed arrow is you carrying the do-file. The struck-out bubble: pasting the log into a chat window is the agent reading it. What crosses back is what you type: an error code or a request, never a result.'));
    };

    // =====================================================================
    // paper-code-map: claims on the left, scripts on the right
    // =====================================================================
    CH['paper-code-map'] = (el) => {
      const rows = D.paperCode, W = 700, H = 320, top = 40, rowH = 52;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      const miss = L.hatch(svg, 'h-miss', 'var(--ink-3)');
      const LX = 10, LW = 270, RX = 470, RW = 220;
      svg.append(txt(LX, 18, 'what the paper says', { class: 'axis-label' }));
      svg.append(txt(RX, 18, 'what the code does', { class: 'axis-label' }));
      const files = [...new Set(rows.map((r) => r.file).filter(Boolean))];
      const fileY = {}; files.forEach((f) => { const ks = rows.map((r, k) => (r.file === f ? k : -1)).filter((k) => k >= 0); fileY[f] = top + (ks.reduce((a, b) => a + b, 0) / ks.length) * rowH; });  // each script sits level with its claims
      files.forEach((f) => {
        svg.append(S('rect', { x: RX, y: fileY[f], width: RW, height: 34, rx: 6, class: 'box' }));
        svg.append(txt(RX + RW / 2, fileY[f] + 22, f, { 'text-anchor': 'middle', class: 'lbl-mono' }));
      });
      rows.forEach((r, k) => {
        const y = top + k * rowH;
        svg.append(S('rect', { x: LX, y, width: LW, height: 34, rx: 6, fill: 'var(--context-soft)', stroke: 'var(--context)', 'stroke-width': 1.2 }));
        svg.append(txt(LX + 10, y + 22, r.claim, { class: 'lbl', style: 'font-size:12.5px' }));
        const y1 = y + 17;
        if (r.status === 'missing') {
          svg.append(S('path', { d: `M${LX + LW} ${y1} H${LX + LW + 70}`, stroke: 'var(--ink-3)', 'stroke-width': 2.5, 'stroke-dasharray': '2 5', fill: 'none' }));
          svg.append(S('rect', { x: LX + LW + 74, y: y1 - 13, width: 112, height: 26, rx: 5, fill: miss, stroke: 'var(--ink-3)' }));
          svg.append(txt(LX + LW + 130, y1 + 4, 'not found', { 'text-anchor': 'middle', class: 'lbl', style: 'font-size:12px' }));
          return;
        }
        const y2 = fileY[r.file] + 17;
        const ok = r.status === 'matched';
        svg.append(S('path', { d: `M${LX + LW} ${y1} C ${LX + LW + 90} ${y1}, ${RX - 90} ${y2}, ${RX} ${y2}`, stroke: ok ? 'var(--check)' : 'var(--ink)', 'stroke-width': ok ? 3 : 2, fill: 'none', 'stroke-dasharray': ok ? null : '7 5' }));
        // a point on the cubic at t, so the labels of neighbouring links sit at different places
        const t = 0.16, x0 = LX + LW, x3 = RX, x1 = x0 + 90, x2 = x3 - 90;   // near the claim, so labels stack by row
        const bz = (a, b, c, d) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d;
        const mx = bz(x0, x1, x2, x3), my = bz(y1, y1, y2, y2);
        svg.append(S('rect', { x: mx - 4, y: my - 11, width: ok ? 68 : 112, height: 22, rx: 4, fill: 'var(--paper)' }));
        svg.append(txt(mx + (ok ? 30 : 52), my + 4, ok ? 'matched' : 'worth verifying', { 'text-anchor': 'middle', class: 'lbl', style: `font-size:12px;fill:${ok ? 'var(--check)' : 'var(--ink)'}` }));
        if (r.note) svg.append(txt(LX + 10, y + 47, r.note, { class: 'boxsub', style: 'font-size:12.5px' }));
      });
      el.append(wrap(svg, LEFT), cap('A stylised example of the paper–code map the skill writes. The five rows are invented for the slide; the three statuses are the report’s. Brick: claims read from the paper. Teal: the code does what the paper says. Dashed: the two disagree, and that row is read first. Hatched: no script produces it.'));
    };


    // =====================================================================
    // parrot: two miniature slides, the Beamer parrot and an explorable slide
    // =====================================================================
    CH.parrot = (el) => {
      const W = 700, H = 330, SW = 320, SH = 200, top = 26;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      // left: the parrot. A header bar, a label for a title, bullets three deep, a pasted table, nav dots.
      const L0 = 10;
      svg.append(S('rect', { x: L0, y: top, width: SW, height: SH, rx: 4, fill: 'var(--paper)', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
      svg.append(S('rect', { x: L0, y: top, width: SW, height: 30, fill: 'var(--ink-2)' }));
      svg.append(txt(L0 + 12, top + 20, 'Results', { class: 'lbl', style: 'font-size:13px;fill:var(--paper);stroke:none' }));
      const bullet = (x, y, w, d) => { svg.append(S('circle', { cx: x, cy: y, r: 2.2, fill: 'var(--ink-3)' })); svg.append(S('rect', { x: x + 8, y: y - 3, width: w, height: 6, rx: 3, fill: 'var(--paper-3)' })); };
      bullet(L0 + 16, top + 50, 200); bullet(L0 + 30, top + 66, 150); bullet(L0 + 44, top + 82, 120); bullet(L0 + 16, top + 98, 180); bullet(L0 + 30, top + 114, 160);
      // a table pasted whole
      for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) svg.append(S('rect', { x: L0 + 190 + c * 24, y: top + 46 + r * 16, width: 20, height: 10, fill: r === 0 ? 'var(--paper-3)' : 'var(--paper-2)', stroke: 'var(--line)', 'stroke-width': 0.6 }));
      // nav dots and page number
      for (let i = 0; i < 9; i++) svg.append(S('circle', { cx: L0 + 60 + i * 12, cy: top + SH - 10, r: 2.5, fill: i === 3 ? 'var(--ink-3)' : 'var(--line)' }));
      svg.append(txt(L0 + SW - 10, top + SH - 6, '12 / 41', { 'text-anchor': 'end', class: 'lbl-mono', style: 'font-size:9px', fill: 'var(--ink-3)' }));
      svg.append(txt(L0 + SW / 2, top + SH + 26, 'the parrot', { 'text-anchor': 'middle', class: 'boxlbl' }));
      svg.append(txt(L0 + SW / 2, top + SH + 46, 'a working deck in twenty minutes', { 'text-anchor': 'middle', class: 'boxsub' }));
      svg.append(txt(L0 + SW / 2, top + SH + 62, 'that looks like every other deck online', { 'text-anchor': 'middle', class: 'boxsub' }));
      // right: an explorable slide. A claim for a title, one sentence, a stage with a slider, a caption.
      const R0 = 370;
      svg.append(S('rect', { x: R0, y: top, width: SW, height: SH, rx: 4, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      svg.append(txt(R0 + 14, top + 28, 'Location, not the house, carries', { class: 'lbl', style: 'font-size:13.5px' }));
      svg.append(txt(R0 + 14, top + 45, 'the return', { class: 'lbl', style: 'font-size:13.5px' }));
      svg.append(S('rect', { x: R0 + 14, y: top + 58, width: 110, height: 5, rx: 2.5, fill: 'var(--paper-3)' }));
      svg.append(S('rect', { x: R0 + 14, y: top + 68, width: 90, height: 5, rx: 2.5, fill: 'var(--paper-3)' }));
      // the stage: a small chart with a handle
      const sx = R0 + 140, sy = top + 58, sw = 166, sh = 96;
      svg.append(S('rect', { x: sx, y: sy, width: sw, height: sh, rx: 3, fill: 'var(--paper-2)', stroke: 'var(--line)' }));
      svg.append(S('line', { x1: sx + 14, x2: sx + sw - 10, y1: sy + sh - 22, y2: sy + sh - 22, stroke: 'var(--ink-3)' }));
      svg.append(S('line', { x1: sx + 14, x2: sx + 14, y1: sy + 10, y2: sy + sh - 22, stroke: 'var(--ink-3)' }));
      svg.append(S('path', { d: `M${sx + 14} ${sy + sh - 30} C ${sx + 60} ${sy + sh - 34}, ${sx + 90} ${sy + 40}, ${sx + sw - 14} ${sy + 18}`, stroke: 'var(--ink)', 'stroke-width': 2, fill: 'none' }));
      svg.append(S('line', { x1: sx + 96, x2: sx + 96, y1: sy + 10, y2: sy + sh - 22, stroke: 'var(--ink)', 'stroke-dasharray': '3 3' }));
      svg.append(S('circle', { cx: sx + 96, cy: sy + 47, r: 5, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 2 }));
      svg.append(S('rect', { x: sx + 14, y: sy + sh - 12, width: sw - 24, height: 3, rx: 1.5, fill: 'var(--paper-3)' }));
      svg.append(S('path', { d: `M${sx + 96} ${sy + sh - 16} l5 0 l0 8 l-10 0 l0 -8 z`, fill: 'var(--ink)' }));
      svg.append(S('rect', { x: R0 + 14, y: top + 168, width: 260, height: 4, rx: 2, fill: 'var(--paper-3)' }));
      svg.append(S('rect', { x: R0 + 14, y: top + 178, width: 200, height: 4, rx: 2, fill: 'var(--paper-3)' }));
      svg.append(txt(R0 + SW / 2, top + SH + 26, 'an explorable deck', { 'text-anchor': 'middle', class: 'boxlbl' }));
      svg.append(txt(R0 + SW / 2, top + SH + 46, 'a claim for a title, one idea, a live stage', { 'text-anchor': 'middle', class: 'boxsub' }));
      svg.append(txt(R0 + SW / 2, top + SH + 62, 'the new thing, not the old thing faster', { 'text-anchor': 'middle', class: 'boxsub' }));
      el.append(wrap(svg, LEFT), cap('Stylised: two slides drawn from memory, not screenshots. Left, what “make a Beamer deck from the paper” produces. Right, one slide from an explorable deck of a housing-returns paper, with its handle. Both take about twenty minutes to draft.'));
    };

    // =====================================================================
    // explorable-tree: a website as a tree of short decks, with forks
    // =====================================================================
    CH['explorable-tree'] = (el) => {
      const W = 470, H = 324, bw = 124, bh = 44;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      arrowHead(svg, 'et-head');
      const N = {
        hook:     { x: 260, y: 24,  t: ['the hook'] },
        model:    { x: 150, y: 114, t: ['the model'] },
        evidence: { x: 390, y: 114, t: ['the evidence'] },
        twist:    { x: 80,  y: 204, t: ['a twist'] },
        why:      { x: 228, y: 204, t: ['why it', 'happens'] },
        data:     { x: 390, y: 204, t: ['the data'] },
        sandbox:  { x: 260, y: 294, t: ['the sandbox'] },
      };
      Object.values(N).forEach((n) => { n.w = bw; n.h = bh; });
      // solid: the decks in order; dashed: a fork the reader opens from inside a slide
      [['hook', 'model'], ['hook', 'evidence'], ['model', 'twist'], ['evidence', 'data'],
        ['twist', 'sandbox'], ['why', 'sandbox'], ['data', 'sandbox'], ['model', 'why', 1], ['data', 'why', 1]]
        .forEach(([a, b, fork]) => svg.append(S('path', { d: edge(N[a], N[b]), fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, style: 'color:var(--ink-3)', 'stroke-dasharray': fork ? '5 4' : null, 'marker-end': 'url(#et-head)' })));
      // the hook is where every reader starts, so it gets the heavy border
      Object.entries(N).forEach(([k, n]) => {
        const start = k === 'hook';
        svg.append(S('rect', { x: n.x - bw / 2, y: n.y - bh / 2, width: bw, height: bh, rx: 6, class: start ? 'box on' : 'box' }));
        n.t.forEach((line, i) => svg.append(txt(n.x, n.y + 5 + (i - (n.t.length - 1) / 2) * 16, line, { 'text-anchor': 'middle', class: 'boxlbl', style: start ? null : 'font-weight:500' })));
      });
      el.append(wrap(svg), cap('Each box is a short deck. Dashed arrows are forks the reader chooses from inside a slide.'));
    };

    // =====================================================================
    // outputs: one paper, five ways to tell it
    // =====================================================================
    CH.outputs = (el) => {
      const W = 1000, H = 364, bw = 262, bh = 80;
      const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
      arrowHead(svg, 'op-head');
      const hub = { x: 500, y: 150, w: 230, h: 90 };
      const out = [
        { x: 138, y: 44,  t: 'A seminar deck',        s: ['titles that state claims,', 'for colleagues'] },
        { x: 862, y: 44,  t: 'An explorable website', s: ['the model to run, for', 'students and the curious'] },
        { x: 138, y: 254, t: 'A policy brief',        s: ['one page, for people', 'who decide (/paper-version)'] },
        { x: 862, y: 254, t: 'Teaching material',     s: ['a lecture, a problem set,', 'a quiz bank'] },
        { x: 500, y: 320, t: 'An interactive figure', s: ['for the paper’s', 'own web page'] },
      ];
      out.forEach((o) => { o.w = bw; o.h = bh; svg.append(S('path', { d: edge(hub, o, 6), fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, style: 'color:var(--ink-3)', 'marker-end': 'url(#op-head)' })); });
      svg.append(S('rect', { x: hub.x - hub.w / 2, y: hub.y - hub.h / 2, width: hub.w, height: hub.h, rx: 8, class: 'box on' }));
      svg.append(txt(hub.x, hub.y - 4, 'Your paper', { 'text-anchor': 'middle', class: 'boxlbl', style: 'font-size:22px' }));
      svg.append(txt(hub.x, hub.y + 22, 'the record of the research', { 'text-anchor': 'middle', class: 'boxsub', style: 'font-size:14px' }));
      // a skill name inside a sub-line is set in mono
      const subline = (x, y, str) => {
        const t = S('text', { x, y, 'text-anchor': 'middle', class: 'boxsub', style: 'font-size:15px' });
        str.split(/(\/[a-z-]+)/).filter(Boolean).forEach((p) => t.append(S('tspan', p[0] === '/' ? { text: p, class: 'lbl-mono', style: 'font-size:13.5px' } : { text: p })));
        return t;
      };
      out.forEach((o) => {
        svg.append(S('rect', { x: o.x - bw / 2, y: o.y - bh / 2, width: bw, height: bh, rx: 6, class: 'box' }));
        svg.append(txt(o.x, o.y - 14, o.t, { 'text-anchor': 'middle', class: 'boxlbl', style: 'font-size:16px' }));
        o.s.forEach((line, i) => svg.append(subline(o.x, o.y + 8 + i * 19, line)));
      });
      el.append(wrap(svg));
    };

    // =====================================================================
    // serrano: the morning's scatter, copied so the two decks agree
    // =====================================================================
    CH.serrano = (el) => {
      const P = D.serrano.pairs, W = 660, H = 400;
      const c = L.chart(W, H, { l: 56, r: 24, t: 30, b: 50 }, [0, 100], [0, 100]);
      L.axisY(c, [0, 20, 40, 60, 80, 100], (v) => v, 'in-person final score');
      L.axisX(c, [0, 20, 40, 60, 80, 100], (v) => v, 'take-home midterm score');
      c.g.append(S('line', { x1: c.x(0), y1: c.y(0), x2: c.x(100), y2: c.y(100), stroke: 'var(--line)', 'stroke-dasharray': '5 5' }));
      c.g.append(txt(c.x(78), c.y(84), 'same score on both', { class: 'lbl', fill: 'var(--ink-3)', 'text-anchor': 'end' }));
      P.forEach(([m, f]) => c.g.append(S('circle', { cx: c.x(m), cy: c.y(f), r: 6, fill: 'var(--ink)', 'fill-opacity': 0.55 })));
      const mm = D.serrano.medMidterm, mf = D.serrano.medFinal;
      c.g.append(S('line', { x1: c.x(mm), x2: c.x(mm), y1: c.m.t, y2: c.H - c.m.b, stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '3 4' }));
      c.g.append(S('line', { x1: c.m.l, x2: c.W - c.m.r, y1: c.y(mf), y2: c.y(mf), stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '3 4' }));
      c.g.append(txt(c.x(mm) - 6, c.y(10), `median midterm ${mm}`, { class: 'lbl', 'text-anchor': 'end', fill: 'var(--ink-2)' }));
      c.g.append(txt(c.m.l + 6, c.y(mf) - 6, `median final ${mf}`, { class: 'lbl', fill: 'var(--ink-2)' }));
      el.append(wrap(c.svg, LEFT), cap(`Measured. One dot per student, ${P.length} students who took both exams in Serrano’s ECON 1170 after the final was moved in-person; ${D.serrano.dropped} dropped the course and ${D.serrano.noExam} did not sit the final. Values read off the chart reproduced in Bryan (2026). The same chart as this morning.`));
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
    // the prompt lines type themselves on arrival: steps(n) needs each one's character count
    document.querySelectorAll('.cmdline .typed').forEach((t) => t.style.setProperty('--n', String(t.textContent.length)));
    // prose numbers that also appear in a chart read the same object: <span class="data" data-key="skill.lines">
    document.querySelectorAll('.data[data-key]').forEach((s) => {
      const v = L.get(s.dataset.key);
      if (v === undefined) { console.error('deck-charts.js: no data at ' + s.dataset.key); return; }
      s.textContent = typeof v === 'number' ? (s.dataset.d ? v.toFixed(+s.dataset.d) : L.fmtInt(v)) : String(v);
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
