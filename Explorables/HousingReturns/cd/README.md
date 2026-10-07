# Brick and thatch — identity layer for *Where the Money Lives*

Nothing in `Explorable/` outside this folder has been edited. Everything here is additive and
reversible: remove one `<link>` and two `<script>` lines and the explorable is exactly as before.

## The idea in five lines

Colour already says **who or what**: brick red = price gains, teal = rental yield, blue = Bo, ochre = Anna.
This layer adds a second channel, **texture**, that says **which form the return takes**:

| texture | is the | means |
|---|---|---|
| brick courses | wall | the part you can sell, borrow against, pass on (price gains) |
| thatch | roof | the part you live under and use up (rental yield, housing services) |

So every stacked return bar quietly becomes a small house: a brick wall of gains with a thatched roof of yield.
Anna's house is mostly roof. Bo's is mostly wall. Same height. That is the paper's sentence as a picture,
and it is visible in a single screenshot.

Anna becomes a Jutland longhouse (low, half-timbered, thatched). Bo becomes a Copenhagen rowhouse from
Kartoffelrækkerne (tall, narrow, brick, dormer, stoop). Neutral houses become the 1920s brick
*murermestervilla*. The title skyline runs from thatch to brick, with a village church with a crow-stepped
gable in the middle and a verdigris spire at the end. Progress dots are houses on a street. Slider thumbs are
houses you drag along the road. Doors have a knob.

## Files

| file | what | size |
|---|---|---|
| `identity.css` | drop-in CSS: texture swap, house dots, house slider thumbs, doors, legend swatches | ~5 KB |
| `illustrations.js` | `window.CD`: patterns, glyphs, skyline, house-bar, roof, SOLGT sign, coin joke, sliver joke | ~29 KB |
| `demo.html` + `demo-patches.js` | the real app with the layer applied, plus the optional deck edits done from outside (demo only) | — |
| `gallery.html` | every glyph and illustration on one page, in both themes (`?theme=dark`) | — |

Open `cd/demo.html` and `cd/gallery.html` straight from disk (they use `<base href="../">`).

## Wiring — step 1, zero deck edits (five minutes)

In `index.html`:

```html
<!-- after the closing </style> of the token block -->
<link rel="stylesheet" href="cd/identity.css">

<!-- scripts: order matters -->
<script src="lib.js"></script>
<script src="cd/illustrations.js"></script>
<script>CD.patchLib();</script>          <!-- before the decks render: routes LIB.house by colour -->
<script>window.DECKS = [];</script>
<script src="decks/a-trunk.js"></script>
<script src="decks/b-trunk.js"></script>
<script src="decks/c-rooms.js"></script>
<script src="app.js"></script>
<script>CD.install();</script>           <!-- after app.js: installs the patterns and swaps the brand mark -->
```

For the published single-file version, paste `identity.css` into the `<style>` and `illustrations.js`
into a `<script>` at the same positions. No external assets are involved.

What this alone changes, by slide:

| slide | before | after |
|---|---|---|
| all | circle progress dots | houses on a street (grey = seen, brick red = here); slider thumbs are houses; doors get a knob and a transom-arched top |
| top bar | one house glyph | Anna's longhouse and Bo's townhouse side by side (`CD.brandMark`) |
| start/1 | two identical face-houses | Anna = thatched longhouse, Bo = brick townhouse, faces kept |
| start/2, yield/3, wealth/0 | solid red + diagonal hatch | brick courses + thatch (via CSS attribute selectors on `fill="var(--gain)"` and `fill="url(#h-…)"`) |
| why/0, why/1, wealth/1 | solid red bars | the gap is a brick bar; holding a suspect fixed removes courses |
| gap/2, yield/1, feasible/0 | grey outline houses | the villa, with brick and tile |

The CSS swap relies on the decks writing `fill: 'var(--gain)'` literally and on `LIB.hatch` ids starting
with `h-`; both are true today. Rects that set their own `fill-opacity` (the high-growth shade on the map of
homes) are deliberately left alone.

## Wiring — step 2, optional deck edits (each is a few lines)

`demo-patches.js` performs (a), (b) and (c) from outside so you can see them in `demo.html`. In the decks
themselves, do this instead:

**(a) `decks/a-trunk.js`, `start.slides[0].stage`** — replace the whole skyline body with:
```js
stage(el) {
  el.classList.add('stage-skyline');
  el.appendChild(L.el('div', { class: 'chart-wrap' }, [CD.skyline(1000, 300)]));
}
```
`CD.skyline` draws itself in as one line, then the materials and windows settle (skipped under
`prefers-reduced-motion`).

**(b) `decks/a-trunk.js`, `yieldDeck.slides[3].stage` ("Same total, different shape")** — replace the two
`rect`s per household with one `CD.houseBar`:
```js
const hb = CD.houseBar(svg, { x: b.x, w: 120, base });
hb.set(sc(cg), sc(y));                         // wall height, roof height — exact, no cheating
// put the "total about 9%" label at hb.top(sc(cg), sc(y)) - 8
```
Full replacement code is in `demo-patches.js` section (b).

**(c) `decks/a-trunk.js`, `start.slides[2].stage` (the reveal)** — same idea, animated. Replace `r1`/`r2`
with `const hb = CD.houseBar(svg, { x: b.x, w: 100, base })` and, inside the tween, call
`hb.set(scale(cgNow), scale(yieldNow))`. Because the brick pattern is anchored in user space, a growing wall
lays new courses rather than sliding the texture.

**(d) `decks/b-trunk.js`, `reform.slides[2].stage` (the auction)** — winners grow a roof, the price line
becomes an estate agent's sign:
```js
const roofs = bidders.map((b, i) => CD.roof(c.g, { x: +bars[i].getAttribute('x'), w: bw, h: 9 }));
const sign = CD.solgt(c.g);                    // { g, set(x, footY) }, g.setText('SOLGT', '2.26 m DKK')
// in paint(), after the bars are set:
bidders.forEach((b, i) => { roofs[i].el.setAttribute('fill', bars[i].getAttribute('fill')); roofs[i].set(y_i, win_i); });
const marginal = /* the lowest winning bar */; sign.set(xCenter(marginal), c.y(res.price)); sign.g.setText('SOLGT', L.fmtDKK(res.price));
```
Loosen credit and the same eight roofs stay put while the sign is replanted higher. Elastic supply adds roofs.

**(e) `decks/b-trunk.js`, `wealth.slides[0]` ("You cannot put a roof in a savings account")** — add the joke
at the top of the stage: `el.prepend(CD.roofAndCoin(200))` (a thatched roof held over the hole in a krone).
Or use it as the whole stage of `wealth.slides[2]` ("What we learned").

**(f) `decks/b-trunk.js`, `feasible.slides[0]` ("You cannot buy a slice of a neighbourhood")** — replace the
lone outline house at the right of the floor/ceiling diagram with `CD.sliver(360)` placed above the
diagram: a brick row with a paper-thin slice cut from one house.

**(g) `decks/a-trunk.js`, `gap.slides[2]` (the street of four suspects)** — optional: give each suspect its
own house type so the street stops being four copies:
`what he bought` → `CD.townhouse`, `who he is` → `CD.longhouse`, `when` → `CD.villa`, `where` → `CD.villa`
(all in `var(--ink-2)`, `{ face: false }`).

## API (all pure SVG, all colours are CSS tokens, all work in both themes)

```
CD.install({ brand })            hidden document-wide <defs>: #cd-brick-{gain,yield,bo,anna,ink}, #cd-thatch-{…}, #cd-tile-ink
CD.patchLib()                    LIB.house(color) → longhouse if --anna, townhouse if --bo, villa otherwise
                                 (sizes ≤ 30 keep the original glyph; pass { glyph: 'plain' } to force it)
CD.longhouse(color, size, { face=true, mood, plain })   → <svg 64×64>
CD.townhouse(color, size, opts)                          → <svg 64×64>
CD.villa(color, size, opts)                              → <svg 64×64>
CD.brandMark(color, height)                              → <svg>, Anna + Bo outlines
CD.skyline(W=1000, H=300, { ground=240, animate=true })  → <svg>, one continuous line, draw-in
CD.houseBar(host, { x, w, base, wallColor, roofColor, eave=6, cap=8 })
                                 → { g, wall, roof, cap, set(wallH, roofH), top(wallH, roofH) }
CD.roof(host, { x, w, color, h })          → { el, set(y, visible) }
CD.solgt(host, { text, sub, color })       → { g, set(x, footY) }; g.setText(line1, line2)
CD.roofAndCoin(size)                        → <svg>  "you cannot put a roof in a savings account"
CD.sliver(size)                             → <svg>  "you cannot buy a slice of a neighbourhood"
CD.coin(host, { cx, cy, r, color })         → <g>    a krone with a hole
CD.brickPattern / thatchPattern / tilePattern(host, id, color, opts) → "url(#id)"  (same shape as LIB.hatch)
```

## Honesty notes

* `houseBar` heights are exact. The gable cap is an outline stroke, not a fill, so it never reads as quantity.
* The skyline is illustration, not data. Its materials encode only the story's direction (thatch where yields
  are high, brick where gains are), nothing else.
* Colour meaning is unchanged everywhere. Texture is added on top; nothing relies on texture alone.

## Trade-offs to know about

* Range inputs lose the accent-coloured "filled" track (a consequence of `appearance: none`). If you want it
  back, set `--fill` on the input from JS and paint the track with a two-stop gradient.
* Progress dots use `clip-path`, which clips outlines, so keyboard focus shows as a colour change instead.
* The 420px-wide layout overflow visible in headless Chrome screenshots exists in the untouched
  `index.html` too; it is not caused by this layer.
* Everything is under 40 KB combined. No fonts beyond the three already loaded.
