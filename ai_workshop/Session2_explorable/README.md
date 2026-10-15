# Practical AI for Academics, the hands-on afternoon (explorable deck)

A Quarto reveal.js deck built from `../Munster_Session2.tex`, the afternoon
half of the Münster workshop. The morning half is `../Session1_explorable`,
and this deck continues its theme, colours and characters. 39 counted slides
(eight of them dividers) for a three-hour hands-on session: about an hour of
slides around three timed exercises, a short adversary exercise, an optional
one, debriefs, and a demo that runs in the background, plus an appendix of
eighteen rooms that holds the whole setup guide. Open `session2.html` in a
browser; no server needed. The network is needed only for the three web
fonts, which fall back to system faces.

```
session2.qmd              the deck
plan.md                   the talk script the deck was built from, and what the first version got wrong
theme/deck.scss           the morning deck's theme plus the afternoon additions at the end
theme/fonts.html          the Google Fonts link
js/lib.js                 drawing helpers and L.DATA, the single home of every charted number
js/deck-charts.js         the stages, drawn at run time
js/include.html           the script tags Quarto appends to the body
figs/sophia_*.png         two screenshots of posts on X, copied from ../../Lugano/Slides_Lugano/assets
figs/convert_figs.sh      PDF to SVG converter (unused here: the deck has no vector figures)
figs/restyle_figs.py      recolours converted SVGs (unused here)
references.bib            copied from ../references.bib; cite with @key
shoot_chrome.py           screenshots every slide with the installed Chrome
shoot.py                  the same with playwright, plus an overflow check
_shots/                   screenshot output (gitignored)
```

## Rendering and checking

```sh
quarto render session2.qmd       # session2.html, self-contained
quarto preview session2.qmd      # live reload
CHROME="C:/Users/<you>/AppData/Local/Google/Chrome/Application/chrome.exe" python shoot_chrome.py
python shoot_chrome.py 3 7 14    # named slides only
```

On this machine Chrome lives under `%LOCALAPPDATA%`, so `CHROME` has to be
set; on a Mac the default path works.

## Presenting

Keys: **S** speaker view (notes and the next slide), **F** fullscreen, **O**
overview, **E** print view (then print to PDF at 1280×720 landscape, no
margins). `?static` on the URL draws every stage in its finished state.

Slide 2 is the check-in (folder open, panel open, skills installed); do not
start slide 3 until the room has passed it. Slide 3 is exercise 1: the room
types `/review-paper` on its own drafts and the report runs while the next
slides explain what is happening. The adversary exercise and the debrief are
slide 10. The break is after block 3 (slide 23), around 15:30; it is printed
on the agenda and nowhere else. The date and venue live in the YAML
`subtitle`; the resources URL (`claesbackman.com/lugano`, kept from the
source deck) appears on slides 4 and 39 and in three appendix rooms.

## Live stages

| slide | stage | the move |
|---|---|---|
| 3, 21, 36 | `timer` | Press *Start*. The exercise's command sits above the digits and its cursor stops when the clock runs. Ten, fifteen and ten minutes; *Pause* and *Reset* exist. `data-minutes`, `data-cmd` and `data-tally` on the stage set the budget, the command and, on slide 36, a tally of fifteen squares: click one per wrong answer key the room reports. |
| 7 | `fan-out` | Press *Run /review-paper*. The main agent's lines turn blue, the eight reviewers' bars fill at different speeds, each line turns teal as its summary comes back, and the report box fills when the last one is in. |
| 11 | `skill-load` | Flip *type /review-paper*. The hatched skill segment arrives in the window; flip it back and it is gone while CLAUDE.md stays. |
| 14 | `server-wall` | Press *Step* six times. Files appear in the agent's window, the loop runs on simulated data, the do-file is carried across the wall by hand, the log is read on the server, your sentence (or the error code) goes back into the agent, the revision is carried across again. |

The other stages (`second-opinion`, `paper-code-map`, `parrot`, `serrano`) are static
and need no move. Every divider's prompt line types itself when the slide
arrives (and not under reduced motion or in print). If a stage fails to draw
it prints "This chart failed to draw" in place; the caption under each one
says what it would have shown.

## Where the numbers come from

Charts read `L.DATA` in `js/lib.js`. Each entry names its source:

- `skill`: the installed `~/.claude/skills/review-paper/SKILL.md`, 663 lines
  by `wc -l` on 2026-09-30, eight agents launched in Phase 2; the eight names
  are the skill's section headings. The source deck said "about 200 lines";
  the count here is the file's, and slide 6 reads it from `L.DATA` at load.
- `windowLoad`, `secondOpinion`: stylised token counts and widths with real
  orders of magnitude; the captions say so.
- `secure`, `paperCode`: stylised workflows and an invented example map; the
  captions say so. The three statuses in the map are the skill's.
- `serrano`: all 59 midterm and final pairs, copied from the morning deck's
  `lib.js` so the two never disagree; the two medians on slide 35 are computed
  from them once and read by both the prose and the chart.
- `china`, `studyTime`: Bryan (2026), as quoted in the source deck; used only
  in a speaker note.
- Block 5 (slides 29–31) follows the Substack post "Beyond the stochastic
  Beamer parrot" (claesbackman.substack.com); the `parrot` stage is two
  slides drawn from memory, and its caption says so.

Prose numbers on the slides are transcribed from the source deck.

## Conventions

- Four colours carry the argument and appear nowhere else: **context**
  (brick, #A63D2A: text you put in the agent's window, including the chips in
  every prompt line), **check** (teal, #2F7A66: reviewers and verification
  steps, the tally squares), **agent / Ben** (slate blue, #3E6690: the main
  agent and its window), **chat / Anna** (ochre, #9C6B2E: used once, the
  struck-out chat bubble on slide 14). Everything else is parchment and ink,
  including inline code, the progress bar and link underlines. The charts
  paint with `var(--context)` etc.; the generic `--primary`, `--contrast`,
  `--actor-a`, `--actor-b` names remain as aliases because the theme's text
  and stat classes use them.
- Chart labels set colour through `style="fill:…"`, never a `fill` attribute:
  the theme's `.lbl` and `.lbl-mono` classes set `fill` in CSS, which beats an
  attribute. The `txt()` helper in `deck-charts.js` does the conversion.
- The afternoon's motif is the prompt line (`.cmdline`): one full-width input
  box on every divider, typed on arrival, with brick chips (`.ctx`) on the
  skills and files that enter the window; a small one on each agenda card;
  one above each exercise clock; and an empty one, inverted, on the closing
  slide. The black mono pill means "prompt" and nothing else, so time chips
  and the permission chip are outlined. The morning's window rule under
  dividers is switched off in the theme's afternoon section.
- Exercises are `.task` cards with a time chip, numbered steps, a fallback
  when the skill is missing, and a debrief question, beside a `timer` stage.
- Titles are assertions; read in sequence they are the talk.
- Appendix slides are `visibility="uncounted"`, so the count ends on "Your turn".
- Headings inside slides are `[Text]{.ph}` or `[Text]{.colhead}` spans, never `###`.
- No class is named `.controls`; control rows are `.ctl`.
- `menu: false` in the header removes the hamburger icon; press **O** for the
  overview instead.
- Room links are `[text](#slide-id)`; Quarto adds the `/`. Do not name a slide
  `#slides`: Quarto reserves the identifier.
