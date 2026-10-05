# Practical AI for Academics, Day 1 (explorable deck)

A Quarto reveal.js deck built from `../Lugano_Session1.tex`, the Day 1 beamer
deck for the Lugano workshop. 70 counted slides (nine of them dividers) for a
half-day session, roughly 75–90 minutes of lecture around a live demo, two bets
and a break, plus an appendix of six side rooms. Open `index.html` in a browser; no server needed.
The network is needed only for the three web fonts, which fall back to system
faces otherwise.

```
index.qmd                 the deck
plan.md                   the talk script the deck was built from
theme/deck.scss           tokens, faces, layouts, the stage, controls, figure frames
theme/fonts.html          the Google Fonts link
js/lib.js                 drawing helpers and L.DATA, the single home of every charted number
js/deck-charts.js         the stages, drawn at run time
js/include.html           the script tags Quarto appends to the body
figs/*.png, *.jpeg        raster figures copied from ../assets (GPQA, the homework and exam charts)
figs/convert_figs.sh      PDF to SVG converter (unused here: the source figures are raster)
figs/restyle_figs.py      recolours converted SVGs (unused here)
references.bib            copied from ../references.bib; cite with @key
shoot_chrome.py           screenshots every slide with the installed Chrome
shoot.py                  the same with playwright, plus an overflow check
_shots/                   screenshot output (gitignored)
```

## Rendering and checking

```sh
quarto render index.qmd        # index.html + index_files/
quarto preview index.qmd       # live reload
python3 shoot_chrome.py        # _shots/NN.png for every slide, prints console messages
python3 shoot_chrome.py 6 27   # named slides only
```

## Presenting

Keys: **S** speaker view (notes and the next slide), **F** fullscreen, **O**
overview, **E** print view (then print to PDF at 1280×720 landscape, no
margins). `?static` on the URL draws every stage in its finished state.

Before the first slide, start the live demo in a terminal behind the deck:
open the example paper's folder in Claude Code and ask for a website. The
"Check-in: Ben's website" divider at the end of section 3 is where you switch
to the browser. The speaker note on the hook slide has the wording.

## Live stages

| slide | stage | the move |
|---|---|---|
| 6 | `next-token` | Press *Sample the next token* six times; each press appends the top candidate and recomputes the list. *Reset* starts over. |
| 18 | `adoption-field` | Arrives with only the open dots (any AI tool). Click anywhere on the chart and the agent dots slide out to their true values. Then one keypress reveals the sentence with the numbers. |
| 27 | `harness-loop` | Press *Step* nine times; each press lights one arrow and adds one log line of Ben's website session. |
| 29 | `context-budget` | Starts at 1,200 pages (six long PDFs). Drag the slider right past about 2,100 pages and the grey stub (system prompt and CLAUDE.md) is pushed out of the left edge of the window and drops below it. |

Every other stage (Anna and Ben, generations, frontier, career, use cases,
checks, the Serrano scatter) is static and needs no move. If a stage fails to
draw it prints "This chart failed to draw" in place; the caption under each one
says what it would have shown.

## Where the numbers come from

Charts read `L.DATA` in `js/lib.js`. Each entry names its source:

- `survey`: Lyttelton, Massenkoff and Wilmers (2026), Anthropic Research, read off the three published figures (n = 1,260, fielded February–March 2026).
- `galiani`: Galiani, López and Sosa (2026), NBER WP 35588, abstract (74 → 96 percent, about eight cents a run).
- `tokens`: a 1-million-token window and 80–100k tokens for a 200-page PDF, both from the source deck; the fixed segments are rules of thumb and the stage says so.
- `china`, `studyTime`: Bryan (2026), as quoted in the source deck.
- `serrano`: all 59 midterm and final pairs, read off the Datawrapper chart reproduced in Bryan (2026) (`../assets/midterm_final_grades.png`).
- `nextToken`, `loop`, `checks`: stylised, and the captions say so.

Prose numbers on the slides are transcribed from the source deck. Change a
number in both places; `grep` the `.qmd` for the old value.

## Conventions

- Four colours carry the argument and appear nowhere else: **context** (brick,
  #A63D2A, only the files segment of the context window), **check** (teal,
  #2F7A66, only the verification panels and dots in section 7), **chat / Anna**
  (ochre, #9C6B2E), **agent / Ben** (slate blue, #3E6690). Everything else,
  including numerals, links, the progress bar and active arrows, is parchment
  and ink, after the source deck's "Parchment & Ink" theme. The charts paint
  with `var(--context)` etc.; the generic `--primary`, `--contrast`,
  `--actor-a`, `--actor-b` names remain as aliases because the theme's text
  and stat classes use them.
- Do not name a class `stretch`: reveal.js uses it to make an element fill
  the slide. Paired panels of equal height use `.split.even.pairs`.
- `menu: false` in the header removes the hamburger icon; press **O** for the
  overview instead.
- The context window is the deck's motif: the rule under each divider is a
  window whose brick fill is set per divider with `style="--fill:46%"`, the
  progress bar is the same object at small scale, and the closing slide shows
  it full.
- Titles are assertions; read in sequence they are the talk.
- Appendix slides are `visibility="uncounted"`, so the count ends on "End of Day 1".
- Headings inside slides are `[Text]{.ph}` or `[Text]{.colhead}` spans, never `###`.
- No class is named `.controls`; control rows are `.ctl`.
- Raster figures blend into the paper with `mix-blend-mode: multiply`, which
  needs each `section` to paint the paper colour itself (see the end of
  `theme/deck.scss`).
