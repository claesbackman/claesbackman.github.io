/* lib.js — drawing helpers and the deck's numbers.
 *
 * L.DATA is the single home of every number a chart draws. Each entry says
 * where it comes from. Charts read L.DATA; prose on the slides is transcribed
 * from the same sources. When a number changes, change it here and grep
 * index.qmd for the old value.
 */
(function () {
  const L = {};

  // ---------- numbers ----------
  L.fmtPct = (x, d = 1) => (x >= 0 ? '' : '−') + Math.abs(x).toFixed(d) + '%';
  L.fmtPP = (x, d = 2) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d) + ' points';
  L.fmtInt = (x) => Math.round(x).toLocaleString('en');
  L.fmtNum = (x, d = 2) => (x >= 0 ? '' : '−') + Math.abs(x).toFixed(d);
  L.clamp = (x, a, b) => Math.min(b, Math.max(a, x));
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

  // ---------- the deck's numbers ----------
  L.DATA = {
    // Lyttelton, Massenkoff and Wilmers (2026), "Coding Agents in the Social
    // Sciences", Anthropic Research. Survey of 1,260 social scientists fielded
    // February–March 2026. Read off the three published figures.
    survey: {
      n: 1260, when: 'February–March 2026',
      overallAI: 81, overallAgent: 19,
      fields: [
        { name: 'Economics', agent: 38, ai: 91, n: 209 },
        { name: 'Political science', agent: 25, ai: 85, n: 216 },
        { name: 'Management', agent: 18, ai: 82, n: 202 },
        { name: 'Psychology', agent: 12, ai: 81, n: 172 },
        { name: 'Sociology', agent: 11, ai: 78, n: 262 },
        { name: 'Public health', agent: 6, ai: 63, n: 84 },
        { name: 'Communication', agent: 6, ai: 86, n: 36 },
        { name: 'Education', agent: 4, ai: 67, n: 45 },
      ],
      career: [
        { name: 'PhD student', agent: 27, ai: 92, n: 384 },
        { name: 'Postdoc', agent: 28, ai: 89, n: 87 },
        { name: 'Assistant prof.', agent: 19, ai: 81, n: 311 },
        { name: 'Associate prof.', agent: 12, ai: 75, n: 235 },
        { name: 'Full prof.', agent: 9, ai: 68, n: 243 },
      ],
      uses: [
        { name: 'Code', agent: 97, other: 77 },
        { name: 'Edit prose', agent: 87, other: 72 },
        { name: 'Method advice', agent: 77, other: 63 },
        { name: 'Lit review', agent: 76, other: 60 },
        { name: 'Draft prose', agent: 54, other: 30 },
        { name: 'Generate ideas', agent: 47, other: 32 },
      ],
    },

    // Galiani, López and Sosa (2026), NBER WP 35588, abstract: task success
    // from the chatbot to the constrained agent, and the added cost per run.
    galiani: { chatbot: 74, agent: 96, cents: 8 },

    // Context window arithmetic. The window is about 1 million tokens
    // (source deck, "Anatomy of a context window"); a 200-page PDF takes
    // 80–100k tokens (source deck), so about 450 tokens a page. The fixed
    // segments are rules of thumb for a Claude Code session, stylised.
    tokens: {
      window: 1000000, perPage: 450,
      fixed: [
        { name: 'system prompt, CLAUDE.md, tool definitions', tokens: 27000 },
        { name: 'conversation so far', tokens: 40000 },
      ],
      startPages: 1200, maxPages: 2400,
      shortPaper: [15000, 30000], charsPerToken: [3, 4],
    },

    // Bryan (2026), "Eight rules for teaching in AI world": a study of pupils
    // in China, homework score, completion time and exam score after AI.
    china: { homework: 18, time: -30, exam: -20 },
    // US college study time, hours a week, 1961 to 2003 (Bryan 2026).
    studyTime: { from: 40, to: 27, years: '1961–2003' },

    // Stylised next-token trace for the mechanism slide. The candidates and
    // probabilities are invented for the slide; the mechanism is real.
    nextToken: {
      prefix: ['House', 'prices', 'in', 'Denmark', 'fell', 'sharply', 'in'],
      steps: [
        [['2008', 0.61], ['2009', 0.18], ['the', 0.09], ['2007', 0.07], ['late', 0.05]],
        [[',', 0.42], ['and', 0.24], ['as', 0.12], ['after', 0.11], ['.', 0.11]],
        [['and', 0.35], ['with', 0.22], ['falling', 0.18], ['but', 0.14], ['when', 0.11]],
        [['household', 0.31], ['the', 0.28], ['many', 0.17], ['mortgage', 0.14], ['prices', 0.10]],
        [['wealth', 0.44], ['debt', 0.27], ['consumption', 0.15], ['leverage', 0.09], ['balance', 0.05]],
        [['fell', 0.52], ['declined', 0.21], ['dropped', 0.13], ['was', 0.09], ['collapsed', 0.05]],
      ],
    },

    // Stylised trace of one agent session: the paper website. Each step is one
    // arrow in the loop. from/to are box ids: you, model, ctx, read, edit, bash, web.
    loop: {
      steps: [
        { from: 'you', to: 'model', log: 'You: “Build a website for paper.tex.”' },
        { from: 'ctx', to: 'model', log: 'CLAUDE.md and the folder listing go in with the prompt' },
        { from: 'model', to: 'read', log: 'Model asks the harness to read paper.tex' },
        { from: 'read', to: 'model', log: '41 pages of text come back into the conversation' },
        { from: 'model', to: 'edit', log: 'Model asks the harness to write index.html and style.css' },
        { from: 'edit', to: 'model', log: 'Files written' },
        { from: 'model', to: 'bash', log: 'Model asks the harness to open the page in a browser' },
        { from: 'bash', to: 'model', log: 'One figure missing; model fixes the path and retries' },
        { from: 'model', to: 'you', log: '“Done. I shortened the abstract; check section 2.”' },
      ],
    },

    // The four verification checks with a rough cost in minutes (source deck,
    // "Four checks that you can run"): minutes, minutes, 10–15 min, hours.
    checks: [
      { name: 'Fresh agent reviews the diff', minutes: 5, catches: 'errors invisible to the agent that wrote the code' },
      { name: 'Different model, same diff', minutes: 10, catches: 'shared habits: two copies of one model make the same mistakes' },
      { name: 'Agent quizzes you', minutes: 15, catches: 'your own understanding gap' },
      { name: 'Reimplement in another language', minutes: 240, catches: 'code that faithfully implements something other than the paper' },
    ],


    // Serrano's ECON 1170: take-home midterm score and in-person final score
    // for the 59 students who took both, after the final was moved in-person
    // (18 dropped the course, 9 did not take the exam). Read off the
    // Datawrapper chart reproduced in Bryan (2026); [midterm, final].
    serrano: {
      pairs: [
        [95.5, 95], [98, 88], [100, 86], [100, 80], [94.5, 77], [100, 77], [100, 77], [91, 75], [95, 75], [98, 74],
        [100, 71], [98, 70.5], [98, 70], [98.5, 67.5], [98.5, 65.5], [100, 61.5], [100, 60.5], [98, 58], [90.5, 58], [100, 55.5],
        [100, 54], [55, 59], [98, 52], [91, 51.5], [95, 52], [96.5, 51.5], [100, 51], [98, 50.5], [100, 51], [100, 50],
        [70, 53], [100, 49], [98, 49], [92.5, 48.5], [100, 47.5], [93, 46.5], [98, 47], [100, 46], [97, 40.5], [97.5, 40],
        [94.5, 37], [100, 35], [100, 37], [96.5, 33.5], [85.5, 33.5], [93.5, 31.5], [100, 33.5], [98.5, 30.5], [94.5, 33], [92.5, 23.5],
        [93.5, 21], [100, 19], [94.5, 20.5], [100, 16.5], [98, 22], [81.5, 21.5], [100, 0], [100, 0], [88, 0],
      ],
      dropped: 18, noExam: 9,
    },

    // Three generations (source deck, after Mollick 2026).
    generations: [
      { name: 'Chat models', years: '2022–2023', lines: ['Pattern matching', 'Text in, text out', 'No tools, no execution'], eg: 'ChatGPT 3.5', color: 'var(--chat)' },
      { name: 'Reasoning models', years: '2024–2025', lines: ['Structured, step-by-step thinking', 'Multi-step problems', 'Still text in, text out'], eg: 'o1, Claude 3.7 thinking', color: 'var(--ink-2)' },
      { name: 'Agentic systems', years: '2025–today', lines: ['Reads files, runs code', 'Long-horizon workflows', 'Spawns subagents'], eg: 'Claude Code, Codex, Cursor', color: 'var(--agent)' },
    ],
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
