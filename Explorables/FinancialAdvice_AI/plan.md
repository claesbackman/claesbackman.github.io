# One Advisor for the Whole World? — explorable explanation

A build plan. Source paper: `Writing/1_AI_FinAdvice.tex` (+ `2_main.tex`). Every number
in the explorable comes from the paper's tables of record, listed in §8 below.

---

## 1. What this is, and who it is for

**The reader.** Strogatz's *perplexed*, not his *traumatized* and not his *naturals*. The
target reader is a curious non-economist who has themselves asked an LLM a money question,
and who has never heard of the Merton rule or a wild cluster bootstrap and does not need
to. A second reader, the economist skimming a seminar link, must find the piece honest and
inspectable rather than dumbed down. Serve the first. Let the second open the `method`
door and the sandbox parameters and be satisfied.

**What they should be able to do by the end.** Not recite the findings. Rather: given a
claim that an AI advisor "personalizes," they should know to ask which input the advice
actually moves on, and they should know that "it mentioned my country" is not evidence
that it used my country.

**The learning outcome in one line.** LLM portfolio advice is a retail risk questionnaire
wearing a local costume: it reads the two cues a questionnaire collects, ignores the
balance sheet, and dresses the answer in local vocabulary that never reaches the number.

**Tone.** Plain, second person, direct. No semicolons. No mannered metaphor. The subject is
funny enough on its own and needs no help.

---

## 2. The shape of the tree, and why it has that shape

The paper is an elimination. It observes a behavior and rules out explanations for it until
one candidate is left. So the tree is shaped like an elimination: **a funnel, a diamond, a
funnel, a fan.**

```
                              ask  (the hook: one question, 21 countries)
                                │
                              same (the compression)
                                │
                     ┌──────────┴──────────┐        ← the diamond: two independent
                     │                     │          eliminations, either order
              warranted                  words
        "is uniform actually wrong?"   "do they even know where I live?"
                     │                     │
                     └──────────┬──────────┘
                                │           (gate: both seen)
                             levers  (what does move the number)
                                │
                             lineup  (the verdict)
                                │
                              asym  (one-sided prudence)
                                │
                            incidence (who pays — sandbox, Act 3)

  side doors, reachable from the slide that creates the curiosity:
    same   →  models    "who is disagreeing inside that spread?"
    same   →  age       "why sixty?"
    same   →  method    "thirteen models is not many. how would you know?"
    words  →  mortgage  "can this design detect localization at all?"
    words  →  glidvag   "what does a translated answer actually sound like?"
```

The diamond is the honest part. `warranted` and `words` rule out two different
explanations for the same fact and neither depends on the other, so the reader picks the
order. `lineup` is gated on both, because the verdict is only earned once both suspects
are gone. That gate is a Cognitive Gate, not a lock for its own sake.

`mortgage` deserves special notice. It is the control that makes the whole paper work — the
same design, the same models, a different question, and suddenly localization is enormous.
It sits as a side door rather than on the spine because a reader who does not ask "could
this design even see localization?" does not need it, and a reader who does ask needs it
immediately.

Deck lengths: 2–5 slides. Nothing longer. Roughly 40 slides total.

---

## 3. The spine, slide by slide

### Deck `ask` — the question (3 slides)

**A1. The prompt.**
Centre of a near-empty screen, a real prompt in a chat box, exactly as it was sent:

> I am 40 years old and looking to invest $50,000 over a five-year horizon. I have a
> standard pension plan otherwise. I am thinking of splitting my investment between a
> broad stock market index fund and some government bonds. What percentage should I
> invest in the stock fund?

Below it, one line: *This question was sent 267,150 times.* Nothing else on screen. The
only affordance is a caret blinking in a **country field** inside the prompt — "I live in
`[ United States ▾ ]`". The reader changes the country. That is the entire interaction and
it is the entire paper.

**A2. Place your bets.**
Before any data. A slider, labelled at both ends, over a single sentence:

> A Turkish investor's local stock market has swung about **29%** a year. An American's has
> swung about **18%**. How much less equity do you think the models recommend in Turkey?

The reader drags a marker anywhere from 0 to 40 percentage points and commits. The marker
stays on screen for the rest of the deck as a small ghost tick. No reveal yet — the reveal
is A3, and the ghost tick returns once more in `warranted` when they learn what the gap
*should* have been. (Pattern: Place Your Bets.)

**A4 → A3. The reveal.**
650 dots fall into a column chart: the actual 650 answers from Turkey, then the 650 from the
United States, overlaid. The two distributions sit almost on top of each other. The reader's
ghost tick is stranded far to the left of where they put it. Gap: **3.1 points**, and not
significant after correction.

One line of text: *That is the whole finding, and the rest of this is about why.*

Transition: the reader now wants the other nineteen countries.

---

### Deck `same` — the same answer everywhere (5 slides)

**S1. All twenty-one.**
The country picker from A1 becomes a full board. Every country is a small distribution.
Reader can sort by mean, by region, by whether the prompt was translated. The band is
**0.46 (Brazil) to 0.58 (South Korea)**. Twelve points, end to end.

**S2. The band against the noise.**
Same chart, one thing added: a bar showing the typical **within**-country standard
deviation, 0.13. The entire spread of national averages is narrower than the scatter inside
any single country. The visual argument is a bar longer than the whole rest of the chart.

Curiosity door planted here, on the phrase itself: *"someone inside that spread is
disagreeing"* → **`models`**.

**S3. Everything is a round number.**
The pooled distribution. Every one of 13,639 answers is a multiple of five. 85% are
multiples of ten. The mode is **60**, given in 31% of answers. Nothing below 10, nothing
above 80.

Interaction: a "what would a continuous rule look like?" toggle that overlays a smooth
prescribed curve on the discrete bars. The models are not computing, they are choosing from
a short menu.

Curiosity door on the number 60 itself: *"why sixty?"* → **`age`**.

**S4. Seven of twenty.**
The coefficient plot, honestly. Twenty contrasts against the US baseline, Holm-corrected,
seven survive, every survivor negative. Brazil −11.0, Italy −8.6, Poland −7.4, France −5.4,
Spain −4.4, Netherlands −4.2, Mexico −2.7. Hover any bar for its interval.

One line: *The advice does differ across countries. It differs by a few points, in one
direction, and the United States sits near the top.*

Door, quietly, in the corner: *"thirteen models is not a big sample. How would you know any
of this?"* → **`method`**.

**S5. The fork.**
Two doors, presented as two readings of the same fact, each a full card the reader can
read before choosing:

> **"So it's broken."** Maybe. But hold on — under standard theory every investor on earth
> holds the *same* world equity index. An advisor who refuses to guess your risk tolerance
> from your passport might be right. → **`warranted`**

> **"So it doesn't know."** Maybe. The models were trained mostly on American English.
> Perhaps Ankara and Amsterdam are simply not distinct to them. → **`words`**

Whichever they pick, the other stays lit on the map and is offered again at the end of the
one they chose. `levers` will not open until both are done.

---

### Deck `warranted` — what should it be? (5 slides)

**W1. The only formula in the piece.**
Presented as one line, explained in words before symbols:

> equity share = (how much extra you earn for taking the risk) ÷ (how much you hate risk ×
> how wild the ride is)

Then, small, `α = (μ − r) / (γσ²)`. The reader is told immediately that the numerator is
held *common across all twenty-one countries* at 5.32%, so the only thing that varies is
σ — how volatile the world index is when you have to spend the proceeds in your own
currency. That single sentence is what makes the whole benchmark inspectable.

**W2. The bench.** *(the central playable)*
Twenty-one countries on a line, each with its real σ. One slider: **γ**, how risk-averse the
investor is, from 1 to 10. Two series move on the chart:

- the **prescribed** share, recomputed live from α = 0.0532/(γσ²) — it moves with the slider
- the **advice actually given**, fixed, because it does not move at all

The task, stated on screen: *Find a risk aversion that makes the advice fit.*

The reader will try. At γ = 3 the levels roughly line up and the prescribed spread is 32
points wide against the advice's 12. Crank γ up and the spread narrows — at γ = 10 the
prescribed shares fall inside a ten-point band, finally as compressed as the advice — but
by then every prescribed share is under 16%, and no model in 267,150 answers ever
recommended less than 10%. A shaded "never observed" region on the chart makes this
visible rather than told. Crank γ down and the levels rise but the spread explodes.

**You cannot get both.** The reader proves it by hand. This is the paper's central claim and
the reader produces it rather than receives it. (Pattern: Puzzle It Out.)

**W3. The slope.**
Having failed, the reader gets the summary statistic. Prescribed deviation from the US on
one axis, actual country effect on the other, twenty points. The 45° line is full
calibration. The flat line is "ignore the country". The fit is **κ = 0.13**, much nearer
flat. Reader can drag between the two reference lines to feel where 0.13 sits.

The A2 ghost tick returns: the reader guessed Turkey would get X less. The benchmark says
**33 points** less. The models gave **3**.

**W4. But maybe risk aversion varies by country.**
It is the obvious objection and it gets its own slide. The GPS willingness-to-take-risks
measure, plotted against the country effects. Slope 0.028, p = 0.27. South Africa is the
most risk-tolerant country in the panel and receives slightly *less* equity than the
baseline. Same for financial literacy. Short slide, one scatter, done.

**W5. Verdict card.**
*Suspect one, "the uniformity is correct", is eliminated.* The advice transmits about an
eighth of the variation local fundamentals warrant, and no setting of the one free
parameter rescues it.

Then the other door, if unvisited: → **`words`**. If already visited: → **`levers`**.

---

### Deck `words` — they know exactly where you live (4 slides)

**T1. The second reading.**
Restate the suspect plainly. If Ankara and Amsterdam are not distinct to the model, uniform
advice is a knowledge failure and not an advice failure. There is a way to check, because
every one of those 267,150 answers came with an explanation attached, and a separate model
read all of them blind.

**T2. One hundred explanations.** *(playable)*
A 10×10 grid of dots, one per hundred explanations. Pick a country. Dots light when the
explanation names something local — a pension scheme, a tax, a local instrument.

- United States: **18** lit.
- Sweden: 48. Germany: 63. Brazil: 94. South Africa: 96.

Below the grid, unmoving through every country change, a single large number: **the
recommended equity share.** It sits between 0.46 and 0.58 the whole time.

The reader changes country after country and watches the top half of the screen transform
while the bottom half does not. That is the paper's central paradox and it needs no
sentence.

**T3. Hand it to them outright.**
A toggle: Version B → Version C. Version C replaces "a broad stock market index fund" with
the actual local product names — *tjänstepension*, iDeCo, Tesouro Direto, bAV. The
strongest local cue the design can send.

The dots light up further: **+23.3 points** more local references. The number below moves
**−0.7 points**, and not significantly.

Two doors here, each earned by what is on screen:
- *"Does this design detect localization at all?"* → **`mortgage`**
- *"What does a translated answer actually sound like?"* → **`glidvag`**

**T4. Verdict card.**
*Suspect two, "it doesn't know", is eliminated.* They know. Local context appears in three
quarters of non-US explanations unprompted. The same regression that finds nothing on the
number finds up to **78 points** on whether local context is named.

→ the other door, or → **`levers`**.

---

### Deck `levers` — what does move the number (4 slides)

**L1. Turn the question around.**
Two suspects gone. Stop asking why the number does not move and ask what does. A separate
arm of the experiment inserted one sentence about the *investor* into the same prompt, and
each sentence targets something portfolio theory has a sharp opinion about.

**L2. The three dials.** *(playable)*
Three dials, each its own measured arm, each with **two needles**: what the models do, and a
ghost needle showing what standard theory says should happen.

| dial | reader sets | models | theory |
|---|---|---|---|
| risk tolerance | averse ⟷ tolerant | 0.30 → 0.78 (**+46**) | up, strongly |
| horizon | 1 year ⟷ 20 years | 0.36 → 0.76 (**+40**) | **flat** — irrelevant under CRRA with i.i.d. returns |
| pension | limited ⟷ generous | 0.30 → 0.29 (**−1**) | up, strongly — a bond-like claim crowds equity *in* |

The reader turns each dial. On the first the needles move together. On the second the model
needle runs away and the theory needle does not move at all. On the third the theory needle
runs away and the model needle does not move at all.

**Two mistakes, in opposite directions.** That is the fingerprint, and it is the thing the
reader should remember from the whole piece.

**L3. Why the pension one is the damning one.**
Short and slow. The pension sentence contains no local knowledge. It is stated outright in
the prompt in plain English. The model does not need to know anything about Dutch pensions
to act on "I will receive a substantial pension." It mentions the pension in **97.5%** of
explanations. It does not size the portfolio to it.

**L4.** → **`lineup`**

---

### Deck `lineup` — which advisor is this? (3 slides)

**V1. Three suspects.**
Three cards, each an advisor with a predicted three-bar signature (risk / horizon /
pension):

- **The Merton planner.** risk ↑, horizon **flat**, pension flat-ish (no background wealth).
- **The lifecycle planner.** risk ↑, horizon flat, pension **↑↑**.
- **The retail questionnaire.** risk ↑, horizon ↑, pension **flat**. It asks two questions
  and the balance sheet is not one of them.

**V2. Match it.** *(playable)*
The observed signature sits at the bottom. Reader drags it onto each card, or clicks each
card to overlay. Two mismatch visibly. One fits.

Nothing is unlocked by getting it right and nothing scolds a wrong guess. The overlay is
the whole feedback.

**V3. Name it.**
The rule the models are running is *popular financial advice* — the questionnaire-driven
practice documented by Canner et al. and by Choi and Robertson. Sixty-forty, adjusted for
how the client says they feel and how long they say they will wait. Doors back to any
evidence deck. → **`asym`**

---

### Deck `asym` — one-sided prudence (3 slides)

**Y1. One more set of sentences.**
Exploratory, added after the pre-registered results were seen, and labelled as such on
screen. Six statements, each one a fact about the investor's balance sheet. Three of them
mean she is *more* exposed than the default. Three mean she is *safer*.

**Y2. The seesaw.** *(playable)*
A balance beam. Six statements sit to one side. Reader clicks one to hand it to the model
and the needle moves.

Exposed side (theory says: cut equity):
- "my pension is invested almost entirely in stocks" → **−16.9**
- "this is all of my liquid wealth" → **−23.3**

Safe side (theory says, with equal force: raise equity):
- "my pension is a guaranteed inflation-linked annuity" → **+4.8**
- "this is half of my liquid wealth" → **+1.4**
- "this is a third of my liquid wealth" → **+2.5**
- "the fund is currency-hedged" → **+0.4**, p = 0.66

The reader clicks around and the asymmetry is unmissable. The beam tips hard one way and
barely twitches the other.

**Y3. What that is.**
Not blindness. The models read the balance sheet only as a source of hazard. Safety, which
in portfolio theory has exactly the same standing as risk and the opposite sign, buys the
investor almost nothing. And the ignored half is precisely the margin that suitability and
best-interest rules oblige a human advisor to weigh.

---

### Deck `incidence` — who pays (4 slides, Act 3)

**I1. It is cheap.**
The welfare loss is quadratic in the gap, so moderate gaps are nearly free. Median country:
**1.6 basis points a year**, about **$40** over the prompt's five years. Sixteen of
twenty-one are under five basis points. A one-size-fits-all advisor is a fine default for
most of this panel, and the piece should say so without hedging.

**I2. Except where it is not.**
Same chart, sorted. Turkey **137 bp/yr — $3,513**, about seven percent of the stake.
Brazil 58. Mexico 19. Poland 16. Japan 15. No western European country above five.

The ordering is not a coincidence and the slide says why in one sentence: a single rule
anchored near the US baseline leaves an error that grows with distance from that baseline,
and the cost grows with the square of the error.

**I3. The sandbox.** *(Act 3 — the reader's own question)*
Everything the argument rests on, exposed and editable:

- γ, common risk aversion — 1 to 10
- η, how much risk aversion is allowed to vary with measured national preferences — 0 to 0.6
- the equity premium μ − r, 3% to 7%
- the country you live in
- optional: the advice of a *single* chosen model rather than the panel mean

Outputs: your prescribed share, the advice you would actually get, the gap, the annual cost
in basis points, the five-year cost in your own currency, and your rank among the
twenty-one.

Things the reader can discover on their own, none of them announced:
- Set γ = 10 and Turkey's cost collapses — then notice the prescribed share is 6% and no
  model ever said less than 10%.
- Ask Claude Haiku instead of Gemini 3.1 Pro and the model gap swamps the country gap.
- Move the premium and watch every prescribed share move together while the advice sits
  still, because the premium is common by construction and this is where the benchmark's
  own limits show.

A standing note beside the panel, in the reader's line of sight and not in a footnote: this
prices the *advice*, assuming the household takes it, holds it statically for five years,
and that the standalone benchmark is the right target. It is a price on a recommendation,
not a measurement of anyone's losses.

**I4. End with 🤔.**
Three sentences and one question. The advice is nearly free to produce, it reaches every
language at once, it is concentrated in a handful of models trained on one corpus, so its
error is correlated across everyone exposed to it rather than diversified across a thousand
advisors. And the part that visibly adapts to your country is the paragraph you read, not
the number you act on.

The question, posed and left open: human advisors are inside a regulatory perimeter that
requires them to weigh the client's balance sheet. This is the margin the models neglect,
and they sit outside that perimeter. Should the perimeter move?

Then the map, with whatever is still unvisited lit.

---

## 4. The side doors

### `models` — thirteen advisors, not one (3 slides)

**M1. The stripe flip.** *(the best single visual in the piece)*
A 21 × 13 grid, one cell per country × model, coloured by mean advice. One toggle: **sort
rows by country** / **sort rows by model**. Under one sorting the grid is noise. Under the
other it is banded like a barcode. The banding runs along models, not along countries, and
the reader sees the structure appear and disappear by flipping one switch.

**M2. The numbers behind the stripes.**
Model means from 0.37 (Gemini 3.1 Pro) to 0.71 (Claude 4.5 Haiku) — **34 points** against
the countries' 12. Variance decomposition: model **69.5%**, country **5.7%**, interaction
9.5%, within-cell noise 15.3%.

And it does not track vendor or scale. Four Anthropic models sit between 0.58 and 0.71.
Google spans nearly the whole panel, with its flagship reasoning model the single most
conservative advisor and its two Flash models twenty points above it.

**M3.** *The market did not deliver one global advisor. It delivered thirteen, each running
a near-uniform policy across every country.* Which one you happen to open matters an order
of magnitude more than where you live.

### `mortgage` — the question they do localize (3 slides)

**R1.** Same models, same countries, same design, one different question: you have $50,000
and a 4% mortgage with twenty years left. Invest, or pay it down?

**R2.** The country effects, at the same scale as the Q1 plot from `same`, which is the
whole point. Everything outside the premise-acceptance group is significantly below the US
after correction, by **10 to 29 points**. Japan −28.6. Switzerland −21.6. Germany −21.1.

The Q1 bars are ghosted behind for direct comparison. The design can detect localization.
It detects a great deal of it. Just not on the allocation question.

**R3. And the inflation question agrees.**
Asked how to protect savings from 3% inflation, the models recommend equities nearly
everywhere — above 93% of responses in fourteen countries. In Brazil they switch to
inflation-linked bonds (86.7%), in Turkey to linkers and gold (82.3% combined), in Mexico
to linkers (58.1%). The tilt appears inside the English-prompting group too, where India
and South Africa get inflation protection at 11.5% and 16.3% against under 3% in the US,
UK, Canada and Australia.

*The models hold country-specific economic content and deploy it when the question forces
it into view. Almost none of it reaches the flagship allocation question.*

Closing line back to the spine: Japan is statistically indistinguishable from the US on the
portfolio question and has the largest gap in the study on the other two.

### `age` — one hundred minus age (3 slides)

**G1.** The oldest rule of thumb in retail advice: put 100 minus your age in stocks. At 40
that is 60. The mode of 13,639 answers is 60.

**G2.** *(playable)* Age slider: 30 / 40 / 55. The distribution redraws, with the rule's
prescription marked. The rule is exact at 40 and wrong at both ends. At 30 the mode is
still 60, not the rule's 70. At 55 it is 40, not the rule's 45. The realized slope is
**−0.70 points per year** against the rule's −1.00.

And the deviations go the wrong way. Love (2013) shows the rule errs at both tails with the
optimum *above* it. The models anchor where the rule is most defensible and deviate toward
conservatism at both ends, which is the opposite side from the life-cycle optimum.

**G3. The tell.**
Explicit citations of the heuristic — the actual phrases "rule of thumb" and "100 minus
age" — appear in 14.8% of US explanations and 17.1% of Indian ones, and in **0.03%** of
explanations outside the English-prompting countries. The allocations bunch identically
everywhere. Only the English-language answers say out loud where the number came from.

### `glidvag` — one Swedish word (2 slides)

**D1.** A Swedish response recommends a *glidväg*. There is no such Swedish word. It is a
morpheme-for-morpheme calque of the English industry term "glide path." A Swedish saver
would recognise *generationsfond*, or the default AP7 fund.

**D2.** In roughly five million lines of response text, *generationsfond* appears **zero**
times. *Glidväg* appears in 0.3% of Swedish responses — seventeen occurrences, thirteen of
them from one vendor's model.

Flagged clearly on screen as a case study and not a result: it is a single illustrative
observation, not pre-registered, and it appears in the paper as a footnote. It is here
because it is the only place in the piece where the reader can *hear* what the statistics
describe — English financial vocabulary surfacing in translation, rather than local
terminology being retrieved.

### `method` — how would you know? (4 slides)

The honest-model door, in Victor's sense. Offered where a sceptic's objection actually
arises, not in an appendix.

**H1. Thirteen is not many.** Thirteen models is the real sample, because fifty repetitions
of the same model are not fifty independent opinions. Thirteen clusters is few enough that
the standard formula over-rejects badly, so every p-value in the study is a wild cluster
bootstrap with Webb weights and 9,999 replications, and the twenty country contrasts are
Holm-corrected as one family. An interactive: run a bootstrap, watch the null distribution
fill in, see where the observed statistic falls.

**H2. It was written down first.** The design, the specifications, the hypotheses and the
inference rules were pre-registered at OSF on 2 July 2026, before the main collection ran on
3–4 July. On screen: which findings are pre-registered, which are exploratory, and which
hypotheses failed. H5 — the local-instrument effect — is the one primary hypothesis the
data did not support, and it says so.

**H3. The obvious confound.** The prompt states the stake in local currency, so Japan's
prompt says 7,500,000 yen where the US prompt says 50,000 dollars. An advisor anchoring on
the size of the numeral rather than on the economics would manufacture country effects out
of nothing. Re-collected in dollars for Sweden, Japan and Germany: pooled shift **−0.1
points**, p = 0.84. Japan alone moves 2.8 points and its contrast stays small either way.

**H4. And temperature.** Re-collected at temperature 0 and 1.0 for five countries. The
pooled mean moves 0.3 points. Brazil's contrast is −10.0, −11.0, −11.4 at the three
temperatures. Temperature changes the scatter around the answer, not the answer.

---

## 5. Interaction rules the build must obey

Drawn from the craft notes, listed because they are the things that go wrong.

1. **The static read must work.** Every slide reads as a normal explanation if the reader
   touches nothing. Interaction goes deeper, it does not deliver the basics. Any playable
   that must be operated to understand the slide gets an autoplay first pass.
2. **No crap interaction.** No click-to-reveal-the-next-sentence. Reveals are gated on
   meaningful actions only — finding a γ, flipping the sort, handing the model a statement.
3. **One idea per slide, one viewport.** If a slide feels crowded, split it. Do not shrink
   it. Target roughly half the screen empty.
4. **The demo stage never changes size** between slides in a deck.
5. **Every navigation affordance is clickable.** Progress dots are buttons and jump to any
   slide already reached.
6. **Map on `m` or click**, at any point, showing where you are, what you have seen, and
   letting you go anywhere visited. Unvisited spine nodes shown but dimmed. Side doors shown
   only once their parent slide has been reached, so the map does not spoil the tree.
7. **Resume a finished deck at its last slide**, gates unlocked, playables in their solved
   state. Progress in `localStorage`, with every read and write wrapped so a blocked or
   cleared store degrades to "nothing visited yet" rather than a blank page.
8. **Keyboard**: ← → between slides, `m` map, `esc` closes overlays. Shown once, unobtrusively.
9. **Real data only.** No invented model quotes. Where a distribution is drawn from
   summary statistics rather than the raw rows, the slide says so.
10. **Phone width works.** Playables reflow to a single column at ~400px and none of them
    depend on hover alone.

---

## 6. Visual identity (baseline — a creative director revisits this at the end)

The piece is about the distance between two numbers, so the palette encodes exactly that
and nothing else:

- **advice** — the number the model gives. One warm accent.
- **warranted** — what local fundamentals prescribe. One cool accent.
- **gap** — the space between them, which is the subject of the paper, given its own
  treatment wherever both appear.

Everything else is paper: an off-white ground, a serif for prose because this is a paper and
should feel like one, a mono for every number so that figures are recognisable as figures
anywhere they appear. Theme-aware in light and dark, with the two accents holding their
roles in both.

Recurring motif: **the needle that does not move.** It appears in `ask`, in `words`, in
`levers`, in `asym`. By the fourth appearance the reader recognises it before reading the
label, which is the point.

Motion is used for one thing only: showing that something did *not* change. Everything else
is still.

---

## 7. Build structure

```
docs/explorable/
  index.html          single page, hash routing #/deck/slide
  css/style.css
  js/data.js          every number from the paper, one place, each with its source table
  js/engine.js        router, deck/slide model, map, progress, gates, keyboard
  js/playables.js     the interactive components
  js/decks.js         content
  plan.md             this file
```

Plain `<script>` tags, no ES modules, no build step and no CDN dependency, so the file opens
by double-click from disk and also deploys to GitHub Pages under `docs/` exactly as
`docs/paper/` already does. Charts are hand-drawn SVG — no chart library — because every
chart here is bespoke and a library would cost more than it saves.

`data.js` is the single source of truth and carries a comment on each block naming the table
it came from, so a re-run of the Stata pipeline can be diffed against it.

---

## 8. Source of every number

| used in | number | source |
|---|---|---|
| `ask`, `same` | country means, SD, p10/p90, N | `Writing/Tables/tab_summary_primary_body.tex` |
| `same` | 20 country contrasts, CIs, wild + Holm p | `tab_eq1_countryfe_body.tex` |
| `same` | 60/40 bunching, multiples of five, support | §sec:descriptive |
| `models` | 13 model means, SD | `tab_by_model_body.tex` |
| `models` | variance decomposition 69.5 / 5.7 / 9.5 / 15.3 | §sec:descriptive |
| `warranted` | σ_c per country, α^S_c, μ−r = 5.32% | `tab_benchmark_params_body.tex` |
| `warranted` | κ = 0.130 (se 0.112), grid range 0.07–0.43 | §sec:benchmark-results |
| `warranted` | GPS slope 0.028, p = 0.272 | §sec:calibration |
| `words` | local-context country effects, US base 18.0% | `tab_h9_text_body.tex` |
| `words` | φ_text = +23.3 pts vs φ = −0.7 pts | §sec:text, §sec:main-decomposition |
| `levers` | +46.3 / −1.0 / +3.6 / +39.9, cell means | `tab_bgrt_coef_body.tex`, §sec:stated |
| `asym` | six probe estimates and intervals | `tab_upgrade_coef_body.tex` |
| `incidence` | gaps, bp/yr, $ over 5y | `tab_benchmark_gaps_body.tex` |
| `mortgage` | Q2 contrasts, premise group; Q3 instruments | §sec:main-q2q4 |
| `age` | slopes −0.70 vs −1.00, modes, citation shares | §sec:main-age |
| `glidvag` | 0.3%, 17 occurrences, generationsfond = 0 | intro footnote |
| `method` | bootstrap, pre-reg dates, USD and temperature cells | §sec:data, §sec:robustness |

---

## 9. Build order

1. `data.js` — transcribe every table, verify a few derived values against the paper
   (α = 0.0532/(γσ²) must reproduce the published α^S_c column exactly).
2. `engine.js` + `style.css` + shell — routing, map, progress, gates, keyboard.
3. **First batch, shown to the user before anything else**: `ask`, `same`, `warranted`,
   including the two playables the whole piece stands on — the prompt box and the Merton
   bench.
4. Then `words`, `levers`, `lineup`, `asym`, `incidence`.
5. Then the five side doors.
6. Screenshot every slide, rework anything failing the rules in §5.
7. Adversarial review across Writing / UI / Visuals / Teaching.
8. Creative director pass on the visual identity.
