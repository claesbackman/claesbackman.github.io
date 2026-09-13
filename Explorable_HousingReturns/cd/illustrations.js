/* cd/illustrations.js — "Brick and thatch"
 * Material identity for "Where the Money Lives".
 *
 * The rule: COLOUR says who or what (brick red = price gains, teal = rental yield,
 * blue = Bo, ochre = Anna). TEXTURE says which form the return takes:
 *   brick courses  = walls  = the part you can sell, borrow against, pass on
 *   thatch         = roof   = the part you live under and use up
 * So a stacked return bar becomes a small house: brick wall of price gains,
 * thatched roof of rental yield. Anna's house is mostly roof. Bo's is mostly wall.
 *
 * Pure SVG, no assets. Requires lib.js (window.LIB) to be loaded first.
 * Exposes window.CD.
 */
(function () {
  const L = window.LIB;
  if (!L) { console.warn('cd/illustrations.js: load lib.js first'); return; }
  const S = L.svg;
  const CD = {};
  let uid = 0;
  const nextId = (p) => `cd-${p}-${++uid}`;
  const defsOf = (host) => {
    if (host.tagName && host.tagName.toLowerCase() === 'defs') return host;
    const svg = host.ownerSVGElement || host;
    return svg.querySelector(':scope > defs') || svg.insertBefore(S('defs'), svg.firstChild);
  };

  // ---------------------------------------------------------------------
  // Patterns (userSpaceOnUse, so a bar growing from the ground reveals new
  // courses of brick instead of sliding the texture).
  // ---------------------------------------------------------------------

  /** Running-bond brick. Colour is the brick; mortar is the paper. Returns "url(#id)". */
  CD.brickPattern = (host, id, color, o = {}) => {
    const s = o.scale ?? 1, w = 16 * s, h = 8 * s, sw = 0.9 * s;
    const p = S('pattern', { id, width: w, height: h, patternUnits: 'userSpaceOnUse' });
    p.appendChild(S('rect', { width: w, height: h, fill: color, 'fill-opacity': o.opacity ?? 1 }));
    p.appendChild(S('path', {
      d: `M0 0 H${w} M0 ${h / 2} H${w} M0 ${h} H${w} M${w / 2} 0 V${h / 2} M0 ${h / 2} V${h} M${w} ${h / 2} V${h}`,
      fill: 'none', stroke: o.mortar || 'var(--paper)', 'stroke-width': sw, 'stroke-opacity': o.mortarOpacity ?? 0.55,
    }));
    defsOf(host).appendChild(p);
    return `url(#${id})`;
  };

  /** Thatch: steep, broken straw strokes over a light wash. Drop-in for LIB.hatch. */
  CD.thatchPattern = (host, id, color, o = {}) => {
    const s = o.scale ?? 1, w = 7 * s, h = 16 * s;
    const p = S('pattern', { id, width: w, height: h, patternUnits: 'userSpaceOnUse', patternTransform: `rotate(${o.angle ?? 16})` });
    p.appendChild(S('rect', { width: w, height: h, fill: color, 'fill-opacity': o.opacity ?? 0.16 }));
    p.appendChild(S('line', { x1: 1.6 * s, y1: 0, x2: 1.6 * s, y2: h, stroke: color, 'stroke-width': 1.6 * s, 'stroke-dasharray': `${10 * s} ${6 * s}` }));
    p.appendChild(S('line', { x1: 5 * s, y1: 0, x2: 5 * s, y2: h, stroke: color, 'stroke-width': 1.2 * s, 'stroke-dasharray': `${7 * s} ${9 * s}`, 'stroke-dashoffset': 5 * s, 'stroke-opacity': 0.7 }));
    defsOf(host).appendChild(p);
    return `url(#${id})`;
  };

  /** Roof tiles (for the provincial villa and the skyline's middle). Plain, quiet. */
  CD.tilePattern = (host, id, color, o = {}) => {
    const s = o.scale ?? 1, w = 8 * s, h = 4 * s;
    const p = S('pattern', { id, width: w, height: h, patternUnits: 'userSpaceOnUse' });
    p.appendChild(S('rect', { width: w, height: h, fill: color, 'fill-opacity': o.opacity ?? 0.35 }));
    p.appendChild(S('path', { d: `M0 ${h} H${w} M${w / 2} 0 V${h}`, stroke: o.mortar || 'var(--paper)', 'stroke-width': 0.7 * s, 'stroke-opacity': 0.5, fill: 'none' }));
    defsOf(host).appendChild(p);
    return `url(#${id})`;
  };

  /**
   * Install one hidden <svg> of document-wide patterns so CSS can say
   *   .chart rect[fill="var(--gain)"] { fill: url(#cd-brick-gain) }
   * without any deck code changing. Ids: cd-brick-{gain,yield,bo,anna,ink}, cd-thatch-{...}, cd-tile-ink.
   */
  CD.install = (o = {}) => {
    if (!document.getElementById('cd-defs')) {
      const svg = S('svg', { id: 'cd-defs', width: 0, height: 0, 'aria-hidden': 'true', focusable: 'false' });
      svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
      const d = S('defs'); svg.appendChild(d);
      for (const k of ['gain', 'yield', 'bo', 'anna', 'ink']) {
        CD.brickPattern(d, `cd-brick-${k}`, `var(--${k})`);
        CD.thatchPattern(d, `cd-thatch-${k}`, `var(--${k})`);
      }
      CD.tilePattern(d, 'cd-tile-ink', 'var(--ink)');
      document.body.prepend(svg);
    }
    if (o.brand !== false) CD.brand();
  };

  /** The brand mark: Anna's longhouse and Bo's townhouse side by side, one line each. */
  CD.brandMark = (color = 'currentColor', h = 26) => {
    const svg = S('svg', { viewBox: '0 0 108 64', width: h * 108 / 64, height: h, class: 'house cd-brand', 'aria-hidden': 'true' });
    const w = 3.6;
    svg.appendChild(outline('M2 60 H8 V40 H3 L16 20 H28 V13 H35 V20 H48 L61 40 H56 V60 H62', color, w));
    svg.appendChild(outline('M64 60 H70 V26 H67 L72 14 H79 V13 L84 8 L89 13 V14 H93 V5 H98 V14 L103 26 H100 V60 H106', color, w));
    return svg;
  };
  /** Swap the top-bar house for the brand mark. Safe to call any time. */
  CD.brand = () => {
    const b = document.querySelector('.brand-house');
    if (b) b.replaceChildren(CD.brandMark('currentColor', 24));
  };

  // ---------------------------------------------------------------------
  // Character glyphs. 64×64 viewBox, ground at y=60, one continuous outline.
  // ---------------------------------------------------------------------
  const glyphSvg = (size, label) => S('svg', { viewBox: '0 0 64 64', width: size, height: size, class: 'house cd-house', role: 'img', 'aria-label': label });
  const outline = (d, color, w = 2.6) => S('path', { d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const face = (g, color, ex1, ex2, ey, sy, mood) => {
    g.appendChild(S('circle', { cx: ex1, cy: ey, r: 2, fill: color }));
    g.appendChild(S('circle', { cx: ex2, cy: ey, r: 2, fill: color }));
    const mx = (ex1 + ex2) / 2;
    g.appendChild(S('path', { d: mood === 'flat' ? `M${mx - 5} ${sy} H${mx + 5}` : `M${mx - 5} ${sy} Q${mx} ${sy + 4.5} ${mx + 5} ${sy}`, fill: 'none', stroke: color, 'stroke-width': 2.2, 'stroke-linecap': 'round' }));
  };
  const win = (g, x, y, w, h, color) => {
    g.appendChild(S('rect', { x, y, width: w, height: h, fill: 'var(--paper)', stroke: color, 'stroke-width': 1.2 }));
    g.appendChild(S('path', { d: `M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}`, stroke: color, 'stroke-width': 0.8, 'stroke-opacity': 0.7 }));
  };

  /**
   * Anna: a Jutland longhouse. Low half-timbered wall, big thatched roof, one chimney.
   * opts: { face=true, mood, plain=false }  (plain = outline only, for tiny sizes)
   */
  CD.longhouse = (color, size = 64, o = {}) => {
    const svg = glyphSvg(size, 'a low farmhouse with a thatched roof');
    if (!o.plain) {
      const thatch = CD.thatchPattern(svg, nextId('th'), color, { scale: 0.55 });
      svg.appendChild(S('polygon', { points: '3,38 16,16 48,16 61,38', fill: thatch }));
      svg.appendChild(S('rect', { x: 8, y: 38, width: 48, height: 22, fill: color, 'fill-opacity': 0.10 }));
      // half-timber posts
      svg.appendChild(S('path', { d: 'M16 38 V60 M48 38 V60 M24 38 V44 M40 38 V44', stroke: color, 'stroke-width': 1.4, 'stroke-opacity': 0.55 }));
    }
    svg.appendChild(outline('M2 60 H8 V38 H3 L16 16 H28 V9 H35 V16 H48 L61 38 H56 V60 H62', color));
    if (!o.plain) {
      if (o.face !== false) face(svg, color, 20, 44, 45, 48.5, o.mood);
      else { win(svg, 15, 44, 7, 7, color); win(svg, 42, 44, 7, 7, color); }
      svg.appendChild(S('path', { d: 'M29 60 V54 H35 V60', fill: 'none', stroke: color, 'stroke-width': 2 }));
    }
    return svg;
  };

  /**
   * Bo: a Copenhagen rowhouse from Kartoffelrækkerne. Narrow brick, dormer, chimney, a stoop.
   */
  CD.townhouse = (color, size = 64, o = {}) => {
    const svg = glyphSvg(size, 'a tall narrow brick townhouse with a dormer');
    if (!o.plain) {
      const brick = CD.brickPattern(svg, nextId('br'), color, { scale: 0.5, opacity: 0.92 });
      svg.appendChild(S('rect', { x: 16, y: 26, width: 32, height: 34, fill: brick }));
      svg.appendChild(S('polygon', { points: '13,26 18,14 46,14 51,26', fill: color, 'fill-opacity': 0.35 }));
      svg.appendChild(S('rect', { x: 29, y: 15, width: 6, height: 8, fill: 'var(--paper)', stroke: color, 'stroke-width': 1.1 }));
    }
    svg.appendChild(outline('M10 60 H16 V26 H13 L18 14 H27 V13 L32 8 L37 13 V14 H41 V5 H46 V14 L51 26 H48 V60 H54', color));
    if (!o.plain) {
      if (o.face !== false) { face(svg, color, 23, 41, 34, 41, o.mood); }
      else { win(svg, 19, 30, 6, 9, color); win(svg, 39, 30, 6, 9, color); win(svg, 19, 45, 6, 9, color); win(svg, 39, 45, 6, 9, color); }
      // door and stoop
      svg.appendChild(S('rect', { x: 28.5, y: 47, width: 7, height: 13, fill: 'var(--paper)', stroke: color, 'stroke-width': 1.6 }));
      svg.appendChild(S('path', { d: 'M26 60 H38 M27 57.5 H37', stroke: color, 'stroke-width': 1.2, 'stroke-opacity': 0.8 }));
    }
    return svg;
  };

  /**
   * Neutral: a "murermestervilla", the 1920s Danish brick villa with a hipped tile roof.
   */
  CD.villa = (color, size = 64, o = {}) => {
    const svg = glyphSvg(size, 'a square brick villa with a hipped roof');
    if (!o.plain) {
      const brick = CD.brickPattern(svg, nextId('br'), color, { scale: 0.5, opacity: 0.8 });
      const tile = CD.tilePattern(svg, nextId('ti'), color, { scale: 0.6 });
      svg.appendChild(S('polygon', { points: '7,34 22,18 42,18 57,34', fill: tile }));
      svg.appendChild(S('rect', { x: 12, y: 34, width: 40, height: 26, fill: brick }));
    }
    svg.appendChild(outline('M6 60 H12 V34 H7 L22 18 H30 V11 H35 V18 H42 L57 34 H52 V60 H58', color));
    if (!o.plain) {
      if (o.face !== false) face(svg, color, 22, 42, 42, 48, o.mood);
      else { win(svg, 17, 40, 8, 8, color); win(svg, 39, 40, 8, 8, color); }
      svg.appendChild(S('rect', { x: 28.5, y: 49, width: 7, height: 11, fill: 'var(--paper)', stroke: color, 'stroke-width': 1.6 }));
    }
    return svg;
  };

  /**
   * Route LIB.house by colour: Anna → longhouse, Bo → townhouse, anything else → villa.
   * Call right after lib.js loads and the decks pick up the new glyphs without edits.
   * Pass { glyph: 'plain' } in opts to get the original single-line glyph back.
   */
  CD.patchLib = () => {
    const orig = L.house;
    L.house = (color, size, opts = {}) => {
      if (opts.glyph === 'plain') return orig(color, size, opts);
      if (/--anna/.test(color)) return CD.longhouse(color, size, opts);
      if (/--bo/.test(color)) return CD.townhouse(color, size, opts);
      if (size <= 30) return orig(color, size, opts);
      return CD.villa(color, size, opts);
    };
    L.house.original = orig;
  };

  // ---------------------------------------------------------------------
  // The stacked bar that is secretly a house.
  // ---------------------------------------------------------------------
  /**
   * CD.houseBar(host, { x, w, base, wallColor, roofColor, eave=6, cap=8 })
   * → { g, wall, roof, cap, set(wallH, roofH), top(wallH, roofH) }
   * wall = price gain (brick), roof = rental yield (thatch). Heights are exact.
   * The gable cap is an outline only, so it never reads as extra quantity.
   */
  CD.houseBar = (host, o) => {
    const svg = host.ownerSVGElement || host;
    const wallColor = o.wallColor || 'var(--gain)', roofColor = o.roofColor || 'var(--yield)';
    const brick = CD.brickPattern(svg, nextId('hb'), wallColor);
    const thatch = CD.thatchPattern(svg, nextId('ht'), roofColor);
    const eave = o.eave ?? 6, cap = o.cap ?? 8, x = o.x, w = o.w, base = o.base;
    const g = S('g', { class: 'cd-housebar' });
    const wall = S('rect', { x: x - w / 2, width: w, fill: brick, stroke: wallColor, 'stroke-width': 1 });
    const roof = S('rect', { x: x - w / 2 - eave, width: w + 2 * eave, fill: thatch, stroke: roofColor, 'stroke-width': 1 });
    const capEl = S('path', { fill: 'none', stroke: roofColor, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    g.append(wall, roof, capEl);
    host.appendChild(g);
    const set = (wallH, roofH) => {
      wallH = Math.max(0, wallH); roofH = Math.max(0, roofH);
      wall.setAttribute('y', base - wallH); wall.setAttribute('height', wallH);
      const ry = base - wallH - roofH;
      roof.setAttribute('y', ry); roof.setAttribute('height', roofH);
      const l = x - w / 2 - eave, r = x + w / 2 + eave;
      capEl.setAttribute('d', roofH > 0.5 ? `M${l} ${ry} L${x} ${ry - cap} L${r} ${ry}` : '');
    };
    const top = (wallH, roofH) => base - Math.max(0, wallH) - Math.max(0, roofH) - (roofH > 0.5 ? cap : 0);
    return { g, wall, roof, cap: capEl, set, top };
  };

  /** A roof for any bar (auction winners grow one). → { el, set(y, visible) } */
  CD.roof = (host, { x, w, color = 'var(--ink)', h = 10 }) => {
    const el = S('path', { fill: color, class: 'cd-roof' });
    host.appendChild(el);
    const set = (y, visible = true) => {
      el.setAttribute('d', `M${x - 3} ${y} L${x + w / 2} ${y - h} L${x + w + 3} ${y} Z`);
      el.style.opacity = visible ? 1 : 0;
    };
    return { el, set };
  };

  /** The estate agent's sign: SOLGT on a post. → { g, set(x, footY) } */
  CD.solgt = (host, { text = 'SOLGT', sub = '', color = 'var(--ink)', paper = 'var(--paper)' } = {}) => {
    const g = S('g', { class: 'cd-solgt' });
    const post = S('line', { stroke: color, 'stroke-width': 2.5 });
    const board = S('rect', { width: 84, rx: 3, fill: color });
    const t1 = S('text', { 'text-anchor': 'middle', fill: paper, style: 'font:800 13px var(--display);letter-spacing:.06em', text });
    const t2 = S('text', { 'text-anchor': 'middle', fill: paper, 'fill-opacity': 0.85, style: 'font:500 10px var(--mono)', text: sub });
    g.append(post, board, t1, t2);
    host.appendChild(g);
    let at = [0, 0];
    const set = (x, footY) => {
      at = [x, footY];
      const two = !!t2.textContent, bh = two ? 36 : 24, top = footY - 44 - bh;
      const bw = Math.max(84, 16 + 6.4 * Math.max(t1.textContent.length * 1.5, t2.textContent.length));
      post.setAttribute('x1', x); post.setAttribute('x2', x); post.setAttribute('y1', footY); post.setAttribute('y2', top + bh);
      board.setAttribute('x', x - bw / 2); board.setAttribute('y', top); board.setAttribute('height', bh); board.setAttribute('width', bw);
      t1.setAttribute('x', x); t1.setAttribute('y', top + 16);
      t2.setAttribute('x', x); t2.setAttribute('y', top + 30);
    };
    g.setText = (a, b) => { t1.textContent = a; if (b !== undefined) t2.textContent = b; set(at[0], at[1]); };
    return { g, set };
  };

  // ---------------------------------------------------------------------
  // Small jokes that make an idea stick.
  // ---------------------------------------------------------------------
  /** A Danish krone: the coin with a hole. */
  CD.coin = (host, { cx, cy, r = 26, color = 'var(--ink)' }) => {
    const g = S('g', { class: 'cd-coin' });
    g.appendChild(S('circle', { cx, cy, r, fill: color, 'fill-opacity': 0.08, stroke: color, 'stroke-width': 2.4 }));
    g.appendChild(S('circle', { cx, cy, r: r * 0.86, fill: 'none', stroke: color, 'stroke-width': 0.8, 'stroke-opacity': 0.5 }));
    g.appendChild(S('circle', { cx, cy, r: r * 0.24, fill: 'var(--paper)', stroke: color, 'stroke-width': 2.2 }));
    // the crowned heart of the Danish mint, reduced to a heart
    const hy = cy + r * 0.52, s = r * 0.13;
    g.appendChild(S('path', { d: `M${cx} ${hy + s} L${cx - s} ${hy} A${s / 2} ${s / 2} 0 0 1 ${cx} ${hy - s * 0.4} A${s / 2} ${s / 2} 0 0 1 ${cx + s} ${hy} Z`, fill: color, 'fill-opacity': 0.7 }));
    host.appendChild(g);
    return g;
  };

  /**
   * "You cannot put a roof in a savings account": a thatched roof hovering over the
   * hole in a krone, and plainly not fitting. Returns an <svg>.
   */
  CD.roofAndCoin = (size = 220, { roofColor = 'var(--yield)', coinColor = 'var(--ink)' } = {}) => {
    const svg = S('svg', { viewBox: '0 0 200 150', width: size, height: size * 0.75, class: 'cd-joke', role: 'img', 'aria-label': 'A roof held above the hole of a krone coin; it does not fit' });
    const thatch = CD.thatchPattern(svg, nextId('th'), roofColor, { scale: 0.9 });
    CD.coin(svg, { cx: 100, cy: 104, r: 38, color: coinColor });
    // the roof, a wide thatched gable with eaves
    svg.appendChild(S('polygon', { points: '30,58 100,10 170,58', fill: thatch }));
    svg.appendChild(S('path', { d: 'M24 60 L100 8 L176 60', fill: 'none', stroke: roofColor, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    svg.appendChild(S('path', { d: 'M30 58 H170', stroke: roofColor, 'stroke-width': 2, 'stroke-linecap': 'round' }));
    // two small "trying" marks, the closest this gets to a cartoon
    svg.appendChild(S('path', { d: 'M100 66 V80 M92 74 L100 82 L108 74', fill: 'none', stroke: coinColor, 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-opacity': 0.7 }));
    return svg;
  };

  /**
   * "You cannot buy a slice of a neighbourhood": a brick row, and the sliver that a
   * share-sized budget would buy, cut out with a dashed line. Returns an <svg>.
   */
  CD.sliver = (size = 320, { color = 'var(--ink-2)', accent = 'var(--gain)' } = {}) => {
    const svg = S('svg', { viewBox: '0 0 240 90', width: size, height: size * 90 / 240, class: 'cd-joke', role: 'img', 'aria-label': 'A row of brick houses with a paper-thin slice cut from one of them' });
    const brick = CD.brickPattern(svg, nextId('br'), color, { scale: 0.7, opacity: 0.55 });
    const n = 5, w = 40, x0 = 20, ground = 80;
    let d = `M${x0 - 8} ${ground} H${x0}`;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * w, eave = 42, ridge = 26;
      svg.appendChild(S('rect', { x, y: eave, width: w, height: ground - eave, fill: brick }));
      d += ` V${eave} H${x - 1} L${x + 5} ${ridge} H${x + w - 5} L${x + w + 1} ${eave} H${x + w}`;
      svg.appendChild(S('rect', { x: x + 16, y: 60, width: 8, height: 20, fill: 'var(--paper)', stroke: color, 'stroke-width': 1.2 }));
      svg.appendChild(S('rect', { x: x + 9, y: 48, width: 6, height: 8, fill: 'var(--paper)', stroke: color, 'stroke-width': 1 }));
      svg.appendChild(S('rect', { x: x + 25, y: 48, width: 6, height: 8, fill: 'var(--paper)', stroke: color, 'stroke-width': 1 }));
    }
    d += ` V${ground} H${x0 + n * w + 8}`;
    svg.appendChild(S('path', { d, fill: 'none', stroke: color, 'stroke-width': 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    // the sliver: 1/200th of the middle house, in accent, pulled out by a hair
    const sx = x0 + 2 * w + 18;
    svg.appendChild(S('rect', { x: sx, y: 27, width: 2.2, height: ground - 27, fill: accent }));
    svg.appendChild(S('path', { d: `M${sx - 4} ${22} V${ground + 4} M${sx + 6} ${22} V${ground + 4}`, stroke: accent, 'stroke-width': 1.2, 'stroke-dasharray': '3 3' }));
    svg.appendChild(S('path', { d: `M${sx - 7} 15 l3 4 l3 -4 M${sx + 3} 15 l3 4 l3 -4`, fill: 'none', stroke: accent, 'stroke-width': 1.2, 'stroke-linecap': 'round' }));
    return svg;
  };

  // ---------------------------------------------------------------------
  // The title skyline: Jutland to Copenhagen as one line, with the materials
  // telling the story (thatch where yields are high, brick where gains are).
  // ---------------------------------------------------------------------
  /**
   * CD.skyline(W=1000, H=300, { ground=240, animate=true }) → <svg>
   * Drop-in for the stage of start/0.
   */
  CD.skyline = (W = 1000, H = 300, o = {}) => {
    const G = o.ground ?? 240;
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart cd-skyline', role: 'img', 'aria-label': 'A skyline drawn as one line: thatched farmhouses in Jutland become brick rowhouses and towers in Copenhagen' });
    const thatch = CD.thatchPattern(svg, nextId('sk-th'), 'var(--yield)', { scale: 0.8 });
    const brick = CD.brickPattern(svg, nextId('sk-br'), 'var(--gain)', { scale: 0.75, opacity: 0.55, mortarOpacity: 0.6 });
    const tile = CD.tilePattern(svg, nextId('sk-ti'), 'var(--ink)', { scale: 0.9, opacity: 0.22 });
    const fills = S('g', { class: 'cd-sky-fills' });
    const windows = S('g', { class: 'cd-sky-windows', fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 0.8, 'stroke-opacity': 0.6 });
    svg.append(fills, windows);
    const pts = [[0, G]];
    const P = (x, y) => pts.push([x, y]);
    const poly = (points, fill, extra = {}) => fills.appendChild(S('polygon', { points: points.map(p => p.join(',')).join(' '), fill, ...extra }));
    const wnd = (x, y, w, h) => windows.appendChild(S('rect', { x, y, width: w, height: h }));

    // -- rural --------------------------------------------------------
    const longhouse = (x, w) => {
      const wallH = 34, e = G - wallH, ridge = e - w * 0.36, o = 8, cx = x + w * 0.62;
      poly([[x - o, e], [x + w * 0.2, ridge], [x + w * 0.8, ridge], [x + w + o, e]], thatch);
      poly([[x, e], [x + w, e], [x + w, G], [x, G]], 'var(--anna)', { 'fill-opacity': 0.12 });
      fills.appendChild(S('path', { d: `M${x + w * 0.25} ${e} V${G} M${x + w * 0.5} ${e} V${G} M${x + w * 0.75} ${e} V${G}`, stroke: 'var(--ink)', 'stroke-width': 1, 'stroke-opacity': 0.35 }));
      P(x, G); P(x, e); P(x - o, e); P(x + w * 0.2, ridge); P(cx, ridge); P(cx, ridge - 12); P(cx + 8, ridge - 12); P(cx + 8, ridge); P(x + w * 0.8, ridge); P(x + w + o, e); P(x + w, e); P(x + w, G);
      for (let k = 0; k < 3; k++) wnd(x + w * (0.12 + k * 0.32), e + 10, 9, 9);
    };
    const gableHouse = (x, w) => { // half-timbered, thatched, gable to the road
      const wallH = 48, e = G - wallH, peak = e - w * 0.62, o = 5;
      poly([[x - o, e], [x + w / 2, peak], [x + w + o, e]], thatch);
      poly([[x, e], [x + w, e], [x + w, G], [x, G]], 'var(--anna)', { 'fill-opacity': 0.12 });
      fills.appendChild(S('path', { d: `M${x + w * 0.33} ${e} V${G} M${x + w * 0.67} ${e} V${G} M${x} ${e + 16} H${x + w} M${x} ${e} L${x + w * 0.33} ${e + 16} M${x + w} ${e} L${x + w * 0.67} ${e + 16}`, stroke: 'var(--ink)', 'stroke-width': 1, 'stroke-opacity': 0.35 }));
      P(x, G); P(x, e); P(x - o, e); P(x + w / 2, peak); P(x + w + o, e); P(x + w, e); P(x + w, G);
      wnd(x + w * 0.12, e + 22, 9, 10); wnd(x + w * 0.72, e + 22, 9, 10);
    };
    const barn = (x, w) => {
      const wallH = 40, e = G - wallH, ridge = e - w * 0.3;
      poly([[x - 4, e], [x + w * 0.5, ridge], [x + w + 4, e]], thatch);
      poly([[x, e], [x + w, e], [x + w, G], [x, G]], 'var(--gain)', { 'fill-opacity': 0.10 });
      P(x, G); P(x, e); P(x - 4, e); P(x + w * 0.5, ridge); P(x + w + 4, e); P(x + w, e); P(x + w, G);
      fills.appendChild(S('path', { d: `M${x + w / 2 - 12} ${G} V${e + 14} H${x + w / 2 + 12} V${G}`, fill: 'var(--ink)', 'fill-opacity': 0.5 }));
    };
    // -- provincial -----------------------------------------------------
    const villa = (x, w) => {
      const wallH = 46, e = G - wallH, ridge = e - w * 0.3, o = 5, cx = x + w * 0.35;
      poly([[x - o, e], [x + w * 0.22, ridge], [x + w * 0.78, ridge], [x + w + o, e]], tile);
      poly([[x, e], [x + w, e], [x + w, G], [x, G]], brick);
      P(x, G); P(x, e); P(x - o, e); P(x + w * 0.22, ridge); P(cx, ridge); P(cx, ridge - 10); P(cx + 6, ridge - 10); P(cx + 6, ridge); P(x + w * 0.78, ridge); P(x + w + o, e); P(x + w, e); P(x + w, G);
      wnd(x + w * 0.15, e + 10, 10, 12); wnd(x + w * 0.65, e + 10, 10, 12); wnd(x + w * 0.4, e + 26, 10, 20);
    };
    const church = (x, w) => { // village church: tower with pyramid, nave with crow-stepped gable
      const tw = w * 0.36, tx = x, th = 110, top = G - th;
      poly([[tx, top], [tx + tw, top], [tx + tw, G], [tx, G]], 'var(--paper-2)');
      poly([[tx - 2, top], [tx + tw / 2, top - 26], [tx + tw + 2, top]], tile);
      P(tx, G); P(tx, top); P(tx - 2, top); P(tx + tw / 2, top - 26); P(tx + tw + 2, top); P(tx + tw, top);
      const nx = tx + tw, nw = w - tw, ne = G - 58, ridge = ne - 34;
      // crow steps up
      const steps = 4;
      for (let k = 0; k <= steps; k++) { const sx = nx + (nw * 0.5) * (k / steps), sy = ne - (ne - ridge) * (k / steps); P(sx, sy); if (k < steps) P(nx + (nw * 0.5) * ((k + 1) / steps), sy); }
      for (let k = steps - 1; k >= 0; k--) { const sx = nx + nw * 0.5 + (nw * 0.5) * ((steps - k) / steps), sy = ne - (ne - ridge) * (k / steps); P(sx, ne - (ne - ridge) * ((k + 1) / steps)); P(sx, sy); }
      P(nx + nw, ne); P(nx + nw, G);
      poly([[nx, ne], [nx + nw / 2, ridge], [nx + nw, ne]], tile);
      poly([[nx, ne], [nx + nw, ne], [nx + nw, G], [nx, G]], 'var(--paper-2)');
      fills.appendChild(S('path', { d: `M${nx} ${ne} H${nx + nw} V${G} H${nx} Z M${tx} ${top} H${tx + tw} V${G} H${tx} Z`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 0.6, 'stroke-opacity': 0.25 }));
      wnd(tx + tw / 2 - 4, top + 20, 8, 16); wnd(nx + nw * 0.3, ne + 14, 8, 22); wnd(nx + nw * 0.62, ne + 14, 8, 22);
    };
    // -- Copenhagen -----------------------------------------------------
    const rowhouses = (x, n, w) => { // Kartoffelrækkerne: one brick wall, a rhythm of dormers and chimneys
      const wallH = 82, e = G - wallH, ridge = e - 30;
      poly([[x, e], [x + n * w, e], [x + n * w, G], [x, G]], brick);
      poly([[x - 3, e], [x + 6, ridge], [x + n * w - 6, ridge], [x + n * w + 3, e]], tile);
      P(x, G); P(x, e); P(x - 3, e); P(x + 6, ridge);
      for (let k = 0; k < n; k++) {
        const hx = x + k * w, dx = hx + w * 0.5;
        // dormer
        P(dx - 8, ridge); P(dx - 8, ridge - 6); P(dx, ridge - 14); P(dx + 8, ridge - 6); P(dx + 8, ridge);
        fills.appendChild(S('rect', { x: dx - 4, y: ridge - 8, width: 8, height: 9, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 0.8, 'stroke-opacity': 0.6 }));
        // chimney on the party wall
        if (k < n - 1) { const cx = hx + w - 3; P(cx, ridge); P(cx, ridge - 12); P(cx + 6, ridge - 12); P(cx + 6, ridge); }
        wnd(hx + w * 0.18, e + 12, 9, 16); wnd(hx + w * 0.6, e + 12, 9, 16); wnd(hx + w * 0.18, e + 40, 9, 16); wnd(hx + w * 0.6, e + 40, 9, 16);
        fills.appendChild(S('path', { d: `M${hx + w} ${e} V${G}`, stroke: 'var(--paper)', 'stroke-width': 1, 'stroke-opacity': 0.8 }));
      }
      P(x + n * w - 6, ridge); P(x + n * w + 3, e); P(x + n * w, e); P(x + n * w, G);
    };
    const block = (x, w, h, chim = 2) => { // five-storey brick block with a mansard
      const e = G - h, top = e - 22;
      poly([[x, e], [x + w, e], [x + w, G], [x, G]], brick);
      poly([[x - 3, e], [x + 10, top], [x + w - 10, top], [x + w + 3, e]], tile);
      P(x, G); P(x, e); P(x - 3, e); P(x + 10, top);
      for (let k = 0; k < chim; k++) { const cx = x + 14 + k * (w - 34) / Math.max(1, chim - 1); P(cx, top); P(cx, top - 12); P(cx + 7, top - 12); P(cx + 7, top); }
      P(x + w - 10, top); P(x + w + 3, e); P(x + w, e); P(x + w, G);
      const cols = Math.max(2, Math.floor(w / 22)), rows = Math.floor((h - 14) / 26);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) wnd(x + 8 + c * ((w - 16 - 8) / (cols - 1 || 1)), e + 10 + r * 26, 8, 14);
    };
    const spire = (x, w) => { // a Copenhagen tower with a copper spire gone green
      const bh = 118, e = G - bh, sp = e - 96;
      poly([[x, e], [x + w, e], [x + w, G], [x, G]], brick);
      poly([[x - 3, e], [x + w / 2, sp], [x + w + 3, e]], 'var(--yield)', { 'fill-opacity': 0.45 });
      P(x, G); P(x, e); P(x - 3, e); P(x + w / 2, sp); P(x + w + 3, e); P(x + w, e); P(x + w, G);
      wnd(x + w / 2 - 5, e + 14, 10, 22); wnd(x + w / 2 - 5, e + 52, 10, 22);
    };

    // -- lay the road out ----------------------------------------------
    let x = 14;
    longhouse(x, 132); x += 132 + 26;
    gableHouse(x, 64); x += 64 + 18;
    barn(x, 96); x += 96 + 40;
    villa(x, 62); x += 62 + 14;
    church(x, 96); x += 96 + 14;
    villa(x, 58); x += 58 + 34;
    rowhouses(x, 6, 40); x += 240 + 10;
    block(x, 78, 150, 2); x += 78 + 2;
    block(x, 66, 166, 1); x += 66 + 2;
    spire(x, 34); x += 34 + 2;
    if (W - x - 6 >= 44) block(x, W - x - 6, 140, 2);
    P(W, G);

    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const path = S('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    svg.appendChild(path);
    svg.appendChild(S('text', { x: 8, y: G + 30, class: 'axis-label', text: 'Rural Jutland' }));
    svg.appendChild(S('text', { x: W - 8, y: G + 30, 'text-anchor': 'end', class: 'axis-label', text: 'Central Copenhagen' }));

    // draw-in: the line first, then the materials and windows settle in
    const animate = o.animate !== false && !L.reduced();
    if (animate) {
      const len = path.getTotalLength ? path.getTotalLength() : 6000;
      path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
      path.style.transition = 'stroke-dashoffset 2.6s ease-out';
      fills.style.opacity = 0; windows.style.opacity = 0;
      fills.style.transition = 'opacity 1.2s ease 1.4s'; windows.style.transition = 'opacity .8s ease 2.2s';
      requestAnimationFrame(() => requestAnimationFrame(() => { path.style.strokeDashoffset = 0; fills.style.opacity = 1; windows.style.opacity = 1; }));
    }
    return svg;
  };

  window.CD = CD;
})();
