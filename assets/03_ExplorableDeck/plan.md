# One Advisor for the Whole World? — plan

Source: `Writing/1_AI_FinAdvice.tex` (text in `Writing/2_main.tex`, benchmark appendix in
`Writing/5_benchmark_appendix.tex`), as revised 28 September 2026. Numbers come from the
table bodies in `Writing/Tables/` and the pipeline CSVs in `output/tables/`, gathered into
`js/data.js` by `build_data.py`.

## Frame

- **Audience.** A mixed academic room at a finance or economics conference: household
  finance and asset pricing people who know the Merton rule and the 60/40 portfolio, plus
  some who have never looked inside an LLM. Strogatz's *perplexed*: no scars, but no reason
  yet to care about chatbot advice. Slide text is written for the finance economist who has
  not followed the LLM literature. Inference details (wild cluster bootstrap, Holm) live in
  the notes and one appendix room.
- **Length.** 20-minute conference slot. 16 counted slides, about 1.2 minutes each, with the
  hook and the two build-ins taking less and the benchmark and the rule taking more.
- **Venue.** Unknown projector. Every stage has a finished static state, so a failed demo
  costs nothing but the move.

## The one big thing

LLMs give nearly the same portfolio answer to investors everywhere, explain it in local terms,
and set it with a retail risk questionnaire that reads the balance sheet only as a hazard.

## The chain

Two investors ask the same question in two countries → they get the same number
(country moves advice 12 points, model 34) → THEREFORE which model you ask matters more than
where you live → the three prompt versions show that neither language nor local
instruments move the number by more than a point → BUT the models do know where the
investor lives: the explanations fill with local context and the number does not move →
BUT ask about the mortgage and the country suddenly matters more than the model → THEREFORE
the models localize when the question turns on local prices → is uniform portfolio advice
then a mistake? Only if the advisor should price unhedged currency risk; hedged, theory says
0.52 everywhere → THEREFORE the problem is not uniformity but the rule → tell the model who the
investor is and a stated horizon moves the number 40 points while a stated pension moves it
by one, the opposite of what theory says → THEREFORE only a retail risk questionnaire fits →
BUT the balance sheet is not ignored: it registers, one-sidedly, as a hazard → ending: the
same number, in local words, for everyone, and the error is shared.

## Characters and colours

- **Emily in Ohio** and **Yuki in Osaka.** Both 40, both with the local equivalent of
  $50,000 (¥7,500,000), both "with a standard pension plan otherwise". Japan is chosen
  because it carries the paper's reversal in one country: statistically at the U.S. level on
  the portfolio question (+1.2 points), the largest gap on both the mortgage (−28.6) and the
  inflation question (−11.3). The characters are fictional; every number attached to them is
  the country cell of the real collection, and the two quoted answers are real responses.
- Aliases in `theme/deck.scss`:
  - `--advice` = primary, vermilion. What a model recommends: the number.
  - `--theory` = contrast, deep teal. What a benchmark or portfolio theory prescribes.
  - `--emily` = actor-a, amber. The United States.
  - `--yuki` = actor-b, violet. Japan.
  - Second channel: hatching marks *the words* (explanation text), solid marks *the number*.
    Everything else is ink and grey.

## Slide by slide

Numbers are the screenshot numbers: the title slide is 01. Version 2, after the five
independent reviews.

**01 · Title.** One Advisor for the Whole World? The 60/40 split bar under the title.

**02 · Two investors, one question. Who is told to hold more stock?** Emily and Yuki as two
glyphs over their real prompts. *Bet:* more, less or the same for Yuki? The textbook reason
for "less" is currency risk on a world index, which slide 11 pays off.

**03 · Where you live moves the advice 12 points. Which model you ask moves it 34.** Stage
`reveal`, build-in once. The prose answers the bet first (58 against 57), then the ranges and
the variance shares. Yardstick for the talk: 34 points is $17,000 of the stake.

**04 · Prior work varies the investor and holds the country fixed.** Four claims, moved ahead
of the design so the design answers the gap it names.

**05 · Three versions of each prompt separate the language from the country and its
institutions.** Three Japanese prompt cards, the three contrasts, the collection strip, one
line on the other ages and questions.

**06 · The seven countries that differ from the U.S. are all told to hold less stock.** Stage
`countries`. Filled = survives Holm. The yardstick sentence: Brazil's 11 points are a third of
the model spread and not zero.

**07 · Language and local instruments move the advice about a point, so the country reference
carries the rest.** Two stat cards. The UK equivalence test moves to the notes.

**08 · Same model, same 60 percent, and only Yuki's answer names a local account.** The real
Gemini 3 Flash pair, labelled as illustrative, with the selection stated.

**09 · The explanations localize, and the number barely moves.** Stage `words`, both panels on
one 0–100% scale. Move: flip Version C.

**10 · On the mortgage question, the country matters more than the model.** Stage `three`,
stage left and prose right. Move: click Mortgage, then Inflation. Japan's number appears only
in the live note, after the click.

**11 · The uniform advice fails to calibrate across countries only if currency risk should
count.** Stage `bench`. Move: hedge. The bridge question on screen: does a stated balance sheet
move the advice? *Bet* for slide 12 in the notes: horizon or pension?

**12 · A stated horizon moves the advice 40 points. A stated pension moves it by one.** Stage
`levers`, full width, build-in once. Teal marks: CRRA predicts 0 for the horizon, the lifecycle
planner predicts up for the pension, direction only.

**13 · The pattern fits a retail risk questionnaire, not a portfolio planner.** The lineup
table. Contradicted predictions struck through with ✗.

**14 · Stated risks cut the stock share sharply, stated safety barely raises it.** Stage
`asym`, one row per statement with intervals, teal ◂ ▸ for theory's direction.

**15 · The portfolio answer follows the model and a questionnaire far more than the country.**
Four claims with magnitudes and the market-structure line.

**16 · Emily and Yuki get the same number, explained in local words.** The characters again,
the room's question about suitability rules, thank you.

## Appendix rooms

- **models** (from 03): the 21 × 13 grid of cell means. Which model you ask.
- **round** (from 03): the distribution at ages 30, 40, 55 against 100-minus-age; every answer a
  multiple of five, mode 60.
- **tracking** (from 03): the September 2026 re-collection, 21 models, variance shares.
- **inference** (from 04, 06): model fixed effects, clustering at G = 13, wild bootstrap with
  Webb weights, Holm across twenty contrasts, minimum detectable effect.
- **decomp** (from 07): country name, language and local-context slabs per country.
- **robust** (from 06): temperature bookends and the dollar-denominated stake.
- **coding** (from 09): the judge, the reliability gates, pension and horizon prevalence.
- **mortgage-bench** (from 10): Q2 advice against the after-tax real mortgage-rate benchmark.
- **inflation** (from 10): primary instrument on the inflation question.
- **prefs** (from 11): the country effects against GPS risk-taking and financial literacy.
- **benchmark-i** (from 11): the Merton rule, the calibration and the 100 percent corner.
- **wording** (from 12): the exact stated-investor sentences and cell means.
- **references**.
