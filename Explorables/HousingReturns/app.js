/* app.js — router, progress, navigation, map */
(function () {
  const L = window.LIB;
  const DECKS = window.DECKS;
  const byId = Object.fromEntries(DECKS.map(d => [d.id, d]));
  const KEY = 'wml.v1';

  // ---------- persisted state ----------
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { state = null; }
  if (!state || typeof state !== 'object') state = {};
  state.visited ||= {}; state.last ||= {}; state.bets ||= {}; state.done ||= {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } };

  const ctx = {
    state, save,
    go: (path) => { location.hash = '#' + path; },
    bet: (k, v) => { state.bets[k] = v; save(); },
    getBet: (k) => state.bets[k],
    isVisited: (deck, i) => (state.visited[deck] || []).includes(i),
    isDone: (deck) => !!state.done[deck],
    markDone: (deck) => { state.done[deck] = true; save(); },
  };

  // ---------- DOM ----------
  const $ = (s, r = document) => r.querySelector(s);
  const root = $('#app');
  root.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#start/0" aria-label="Start"><span class="brand-house"></span><span class="brand-name">Where the Money Lives</span></a>
      <div class="topbar-right">
        <span class="deck-title" id="deck-title"></span>
        <button class="btn-map" id="btn-map" aria-haspopup="dialog" aria-controls="map"><span class="kbd">m</span> Map</button>
      </div>
    </header>
    <main id="slide-root" class="slide-root"></main>
    <footer class="navbar">
      <button class="nav-btn" id="btn-prev" aria-label="Previous slide">←</button>
      <div class="dots" id="dots" role="tablist" aria-label="Slides in this deck"></div>
      <button class="nav-btn" id="btn-next" aria-label="Next slide">→</button>
    </footer>
    <div class="map" id="map" role="dialog" aria-modal="true" aria-label="Map of the explorable" hidden>
      <div class="map-inner">
        <div class="map-head"><h2>The map</h2><p>Filled dots are slides you have seen. Click anywhere to jump.</p><button class="map-close" id="map-close" aria-label="Close map">✕</button></div>
        <div class="map-canvas" id="map-canvas"></div>
        <p class="map-legend">Solid line: the main road. Dashed: side doors. Outlined box: where you are. Shaded box: a deck you have finished.</p>
      </div>
    </div>`;
  $('.brand-house').appendChild(L.house('currentColor', 26, { face: false }));

  const slideRoot = $('#slide-root');
  const dots = $('#dots');
  const mapEl = $('#map');
  let cleanup = null;
  let current = { deck: 'start', idx: 0 };

  // ---------- routing ----------
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    if (!h) return { deck: 'start', idx: 0 };
    const [deck, idxStr] = h.split('/');
    if (!byId[deck]) return { deck: 'start', idx: 0 };
    let idx = idxStr === undefined ? (state.last[deck] ?? 0) : parseInt(idxStr, 10);
    if (!Number.isFinite(idx)) idx = 0;
    idx = L.clamp(idx, 0, byId[deck].slides.length - 1);
    return { deck, idx };
  }

  function render() {
    const { deck, idx } = parseHash();
    current = { deck, idx };
    const D = byId[deck], S = D.slides[idx];

    if (cleanup) { try { cleanup(); } catch (e) { /* noop */ } cleanup = null; }
    const wasDone = ctx.isDone(deck);

    // progress
    const v = state.visited[deck] || (state.visited[deck] = []);
    if (!v.includes(idx)) v.push(idx);
    state.last[deck] = idx;
    if (idx === D.slides.length - 1) state.done[deck] = true;
    save();

    document.documentElement.setAttribute('data-deck', deck);
    $('#deck-title').textContent = D.title;
    document.title = `${S.title ? S.title + ' · ' : ''}Where the Money Lives`;

    const layout = S.layout || (S.stage ? 'split' : 'center');
    const art = L.el('article', { class: `slide layout-${layout}`, 'data-slide': `${deck}/${idx}` });

    const prose = L.el('div', { class: 'prose' });
    if (S.eyebrow) prose.appendChild(L.el('p', { class: 'eyebrow', text: S.eyebrow }));
    if (S.title && !S.hideTitle) prose.appendChild(L.el('h1', { html: S.title }));
    const body = L.el('div', { class: 'body', html: typeof S.prose === 'function' ? S.prose(ctx) : (S.prose || '') });
    prose.appendChild(body);

    // doors (rebuildable, so a bet can unlock them without re-rendering the slide)
    const doors = L.el('nav', { class: 'doors', 'aria-label': 'Where to go next' });
    let gated = false;
    const buildDoors = () => {
      doors.replaceChildren();
      const ds = typeof S.doors === 'function' ? S.doors(ctx) : (S.doors || []);
      for (const d of ds) {
        const a = L.el('a', { class: 'door' + (d.kind ? ' door-' + d.kind : ''), href: '#' + d.to });
        a.appendChild(L.el('span', { class: 'door-label', html: d.label }));
        if (d.hint) a.appendChild(L.el('span', { class: 'door-hint', text: d.hint }));
        doors.appendChild(a);
      }
      gated = S.next === null && ds.length === 0;
      if (S.next !== null && idx < D.slides.length - 1 && !ds.some(d => d.primary)) {
        const a = L.el('a', { class: 'door door-next', href: `#${deck}/${idx + 1}` });
        a.appendChild(L.el('span', { class: 'door-label', html: (S.nextLabel || 'Continue') }));
        doors.appendChild(a);
      } else if (S.next && typeof S.next === 'string') {
        const a = L.el('a', { class: 'door door-next', href: '#' + S.next });
        a.appendChild(L.el('span', { class: 'door-label', html: (S.nextLabel || 'Continue') }));
        doors.appendChild(a);
      }
      doors.hidden = doors.children.length === 0;
    };
    buildDoors();
    prose.appendChild(doors);
    const updateNav = () => {
      renderDots(D, idx, gated);
      $('#btn-prev').disabled = idx === 0;
      const onward = idx < D.slides.length - 1 || !!doors.querySelector('.door-next');
      $('#btn-next').disabled = !onward || gated;
    };
    ctx.refreshDoors = () => { buildDoors(); updateNav(); };

    let stage = null;
    if (S.stage) {
      stage = L.el('div', { class: 'stage' + (S.stageClass ? ' ' + S.stageClass : '') });
    }
    if (layout === 'wide') { if (stage) art.appendChild(stage); art.appendChild(prose); }
    else { art.appendChild(prose); if (stage) art.appendChild(stage); }
    if (layout === 'stack' && stage) art.appendChild(doors); // doors follow the playable they refer to

    slideRoot.replaceChildren(art);
    slideRoot.scrollTop = 0;
    window.scrollTo(0, 0);

    if (S.stage) {
      try { cleanup = S.stage(stage, ctx, { deck, idx, revisit: wasDone }) || null; }
      catch (e) { console.error(e); stage.appendChild(L.el('p', { class: 'muted', text: 'This playable failed to load.' })); }
      stage.querySelectorAll('svg.chart[role="img"]:not([aria-label])').forEach(s => s.setAttribute('aria-label', S.title || 'chart'));
    }

    // inline links inside prose written as data-go
    art.querySelectorAll('[data-go]').forEach(a => { a.setAttribute('href', '#' + a.getAttribute('data-go')); });

    body.querySelectorAll('p:empty').forEach(p => p.remove());
    updateNav();
    art.classList.add('enter');
  }

  function renderDots(D, idx, gated) {
    dots.replaceChildren();
    const v = state.visited[D.id] || [];
    const maxReached = Math.max(...v, 0);
    D.slides.forEach((s, i) => {
      const reachable = (i <= maxReached + (gated && idx === maxReached ? 0 : 1)) || ctx.isDone(D.id);
      const b = L.el('button', {
        class: 'dot' + (i === idx ? ' current' : '') + (v.includes(i) ? ' seen' : ''),
        role: 'tab', 'aria-selected': i === idx ? 'true' : 'false', 'aria-label': `Slide ${i + 1}: ${s.title || ''}`,
        title: s.title || `Slide ${i + 1}`,
      });
      if (!reachable) b.disabled = true;
      b.addEventListener('click', () => ctx.go(`${D.id}/${i}`));
      dots.appendChild(b);
    });
  }

  $('#btn-prev').addEventListener('click', () => { if (current.idx > 0) ctx.go(`${current.deck}/${current.idx - 1}`); });
  $('#btn-next').addEventListener('click', () => {
    const D = byId[current.deck];
    if (current.idx < D.slides.length - 1) ctx.go(`${current.deck}/${current.idx + 1}`);
    else { const a = document.querySelector('.doors .door-next'); if (a) location.hash = a.getAttribute('href'); }
  });

  // ---------- map ----------
  const MAP = {
    // grid positions (col,row) for each deck
    start: [0, 1], gap: [1, 1], why: [2, 1], yield: [3, 1], wealth: [4, 1], feasible: [5, 1], reform: [6, 1], learned: [7, 1],
    measure: [0.6, 2.2], risk: [2.6, 0], elsewhere: [6.4, 2.2],
  };
  function edges() {
    const E = new Set();
    for (const D of DECKS) {
      D.slides.forEach((S) => {
        const targets = [];
        const p = typeof S.prose === 'function' ? S.prose(ctx) : (S.prose || '');
        for (const m of p.matchAll(/data-go="([a-z]+)\//g)) targets.push(m[1]);
        const ds = typeof S.doors === 'function' ? S.doors(ctx) : (S.doors || []);
        for (const d of ds) if (d.kind !== 'back') targets.push(d.to.split('/')[0]);
        if (typeof S.next === 'string') targets.push(S.next.split('/')[0]);
        for (const t of targets) if (t !== D.id && byId[t]) E.add(D.id + '>' + t);
      });
    }
    return [...E].map(s => s.split('>'));
  }
  function drawMap() {
    const canvas = $('#map-canvas');
    const W = 1000, H = 420, cw = 118, rh = 130, ox = 40, oy = 30, bw = 104, bh = 74;
    const svg = L.svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'map-svg' });
    const pos = (id) => { const [c, r] = MAP[id]; return [ox + c * cw + bw / 2, oy + r * rh + bh / 2]; };
    // edges
    for (const [a, b] of edges()) {
      const [x1, y1] = pos(a), [x2, y2] = pos(b);
      const trunk = MAP[a][1] === 1 && MAP[b][1] === 1 && Math.abs(MAP[a][0] - MAP[b][0]) === 1 && MAP[b][0] > MAP[a][0];
      const dx = (x2 - x1) * 0.5;
      const d = trunk ? `M${x1 + bw / 2} ${y1} L${x2 - bw / 2} ${y2}` : `M${x1} ${y1} C${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
      svg.appendChild(L.svg('path', { d, class: 'map-edge' + (trunk ? ' trunk' : '') }));
    }
    for (const D of DECKS) {
      const [cx, cy] = pos(D.id);
      const g = L.svg('g', { class: 'map-node' + (D.id === current.deck ? ' here' : '') + (ctx.isDone(D.id) ? ' done' : ''), tabindex: 0, role: 'link', 'aria-label': D.title });
      g.appendChild(L.svg('rect', { x: cx - bw / 2, y: cy - bh / 2, width: bw, height: bh, rx: 6 }));
      g.appendChild(L.svg('text', { x: cx, y: cy - 14, 'text-anchor': 'middle', class: 'map-title', text: D.short || D.title }));
      const v = state.visited[D.id] || [];
      const n = D.slides.length, gap = Math.min(14, (bw - 16) / n);
      D.slides.forEach((s, i) => {
        const x = cx - (n - 1) * gap / 2 + i * gap;
        const c = L.svg('circle', { cx: x, cy: cy + 14, r: 4.2, class: 'map-dot' + (v.includes(i) ? ' seen' : '') + (D.id === current.deck && i === current.idx ? ' current' : '') });
        c.appendChild(L.svg('title', { text: s.title || `Slide ${i + 1}` }));
        c.addEventListener('click', (e) => { e.stopPropagation(); closeMap(); ctx.go(`${D.id}/${i}`); });
        g.appendChild(c);
      });
      const open = () => { closeMap(); ctx.go(`${D.id}/${state.last[D.id] ?? 0}`); };
      g.addEventListener('click', open);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      svg.appendChild(g);
    }
    canvas.replaceChildren(svg);
  }
  function openMap() { drawMap(); mapEl.hidden = false; $('#map-close').focus(); }
  function closeMap() { mapEl.hidden = true; }
  $('#btn-map').addEventListener('click', openMap);
  $('#map-close').addEventListener('click', closeMap);
  mapEl.addEventListener('click', (e) => { if (e.target === mapEl) closeMap(); });

  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select', 'button'].includes(tag) && e.key !== 'Escape') return;
    if (e.key === 'm' || e.key === 'M') { mapEl.hidden ? openMap() : closeMap(); }
    else if (e.key === 'Escape') closeMap();
    else if (e.key === 'ArrowRight') { if (mapEl.hidden) $('#btn-next').click(); }
    else if (e.key === 'ArrowLeft') { if (mapEl.hidden) $('#btn-prev').click(); }
  });

  // ?theme=dark|light stamps the root for previews; ?map opens the map
  const qs = new URLSearchParams(location.search);
  if (qs.get('theme')) document.documentElement.setAttribute('data-theme', qs.get('theme'));
  window.addEventListener('hashchange', render);
  render();
  if (qs.has('map')) openMap();
})();
