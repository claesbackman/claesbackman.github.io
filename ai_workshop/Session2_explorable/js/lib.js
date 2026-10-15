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

  // Seeded RNG (mulberry32) so stylised timings are identical on every render
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
    // The /review-paper skill as installed: ~/.claude/skills/review-paper/SKILL.md,
    // 663 lines by `wc -l` on 2026-09-30; eight agents launched in one message
    // (Phase 2 of the skill). /review-paper-light runs two agents in about a minute.
    skill: {
      name: 'review-paper', lines: 663, agents: 8, lightAgents: 2, lightMinutes: 1,
      reviewers: [
        { n: 1, name: 'Spelling, grammar & style' },
        { n: 2, name: 'Internal consistency & cross-references' },
        { n: 3, name: 'Unsupported claims & identification' },
        { n: 4, name: 'Mathematics, equations & notation' },
        { n: 5, name: 'Tables, figures & documentation' },
        { n: 6, name: 'Referee assessment: positioning & fit' },
        { n: 7, name: 'Contribution advocate' },
        { n: 8, name: 'Contribution skeptic' },
      ],
    },

    // The window strip on the CLAUDE.md-versus-skill slide. Stylised token counts
    // with real orders of magnitude: the window is about a million tokens (morning
    // deck); the strip shows its first 100k. A 663-line markdown file is roughly
    // 9k tokens at 3–4 characters a token; a short CLAUDE.md about 2–3k.
    windowLoad: {
      window: 1000000, zoom: 100000,
      segs: [
        { id: 'sys', name: 'system prompt and tool definitions (the provider’s)', tokens: 18000, color: 'var(--ink-3)' },
        { id: 'claude', name: 'CLAUDE.md, yours, every session', tokens: 2500, color: 'var(--context)' },
      ],
      skill: { name: 'the skill, yours, only when called', tokens: 9000 },
    },

    // The second-opinion slide: what is in each reviewer's window. Relative
    // sizes only, stylised; the point is what is present, not how big.
    secondOpinion: {
      author: [
        { name: 'system', w: 10, color: 'var(--ink-3)' },
        { name: 'your paper', w: 38, color: 'var(--context)' },
        { name: 'its own report', w: 22, color: 'var(--agent)' },
        { name: 'the conversation so far', w: 30, color: 'var(--ink)' },
      ],
      fresh: [
        { name: 'system', w: 10, color: 'var(--ink-3)' },
        { name: 'your paper', w: 38, color: 'var(--context)' },
        { name: 'the report, as a file', w: 22, color: 'var(--context)' },
        { name: '“read this as a hostile referee”', w: 6, color: 'var(--ink)' },
      ],
    },

    // The secure-server workflow (source deck, "A workflow for secure data on
    // servers"), one entry per step the presenter takes.
    secure: {
      local: ['codebook.md', 'sim_data.csv', 'project.md', 'analysis.do'],
      registers: ['population', 'income', 'education'],
      steps: [
        { log: '1 · A local folder: the codebook as markdown, a simulated dataset, a project description, the do-file' },
        { log: '2 · Iterate with the agent until the do-file runs on the simulated data' },
        { log: '3 · Carry the do-file to the server yourself and run it on the real data' },
        { log: '4 · Read the log on the server. It stays there, and so does every number in it' },
        { log: '5 · Tell the agent what to change, in your own words or with the error code: “r(459) on the merge; add the 2019 cohort”' },
        { log: '6 · Carry the revised do-file across again' },
      ],
    },

    // A stylised example of the paper–code map that /review-paper-code writes
    // (matched, worth verifying, not found). The rows are invented for the slide;
    // the three statuses are the skill's.
    paperCode: [
      { claim: 'Table 3, baseline estimates', file: '05_results.do', status: 'matched' },
      { claim: 'Column (2): county × year fixed effects', file: '05_results.do', status: 'matched' },
      { claim: 'N = 41,203 households', file: '03_sample.do', status: 'verify', note: 'code drops 2019; paper says 2018–2020' },
      { claim: 'Winsorised at the 1st and 99th percentile', file: '02_clean.do', status: 'verify', note: 'code uses 0.5 and 99.5' },
      { claim: 'Figure 2, event study', file: null, status: 'missing' },
    ],

    // Bryan (2026), "Eight rules for teaching in AI world": pupils in China,
    // homework score, completion time and exam score after AI.
    china: { homework: 18, time: -30, exam: -20 },
    // US college study time, hours a week, 1961 to 2003 (Bryan 2026).
    studyTime: { from: 40, to: 27, years: '1961–2003' },

    // Serrano's ECON 1170: take-home midterm score and in-person final score
    // for the 59 students who took both, after the final was moved in-person
    // (18 dropped the course, 9 did not take the exam). Read off the
    // Datawrapper chart reproduced in Bryan (2026); [midterm, final]. Copied
    // from the morning deck's lib.js so the two never disagree.
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

    // Exercise time budgets in minutes (source deck: 15 min for the voice file;
    // the others are this deck's).
    exercises: { review: 10, voice: 15, quiz: 10 },
  };

  // Medians of the Serrano pairs, computed once so the prose and the chart agree
  (function () {
    const med = (a) => { const t = [...a].sort((x, y) => x - y); return t[Math.floor(t.length / 2)]; };
    L.DATA.serrano.medMidterm = med(L.DATA.serrano.pairs.map((p) => p[0]));
    L.DATA.serrano.medFinal = med(L.DATA.serrano.pairs.map((p) => p[1]));
  })();

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

  // Read a dotted path out of L.DATA: "skill.lines", "skill.reviewers.0.name"
  L.get = (path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), L.DATA);

  window.LIB = L;
})();
