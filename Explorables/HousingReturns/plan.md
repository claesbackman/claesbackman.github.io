# Where the Money Lives — plan for the explorable

An explorable explanation of *Housing Returns over the Income Distribution* (Bäckman, D'Lima, Khorunzhina). Built as a tree of short slide decks. The reader operates small, honest models of the paper's mechanisms rather than reading its results.

## Who we write for

Strogatz's **perplexed** reader: a bright non-economist (a journalist, a policy person, a PhD student in another field, a co-author's partner) who has heard "the rich get richer from housing" and never saw why it should be true or false. No scars, no formal training, but impatient with jargon. We never say "coefficient" before the reader has *watched* a slope shrink. Every number the reader meets is first a picture.

Tone: a friendly colleague at a kitchen table with a napkin. Curious, plain, a little wry. No exclamation marks doing the work of ideas.

## The one big thing

**Two households can earn the same total return on housing and still end up with very different wealth, because the return arrives in different forms, and the form is decided by where you can afford to buy.**

Everything in the tree serves this sentence. The cause → effect chain:

> income and wealth set what you can borrow → borrowing plus the need to buy a *whole* home sets which places are feasible → high-appreciation places are expensive, so they fall out of low-income feasible sets → low-income buyers land where prices grow slowly but rents are high relative to prices → their return arrives as housing services, high-income buyers' return arrives as price gains → gains compound into transferable wealth, services get consumed → equal total returns, unequal wealth. BUT: loosening credit should fix this → in 2003 Denmark tried → prices rose, buyers did not change → because supply is inelastic, the auction has the same winners at higher prices.

## Reader's journey (the trunk)

The trunk is nine decks. Side rooms hang off specific slides. Each deck is 3–7 slides, one idea per slide, ends with a 🤔 that opens the next door.

### Deck 0 · `start` — Two buyers, one country (hook)

**Slide 0.1** Title screen. A skyline silhouette that is half Copenhagen rowhouses, half Jutland farmhouses, drawn as one continuous line. Title: *Where the Money Lives*. Subtitle: *An explorable about who gets what from owning a home.* One button: *Meet two buyers →*.

**Slide 0.2** Meet Anna and Bo. Two little house-shaped characters. Anna earns at the 10th percentile of Danish incomes for her age. Bo earns at the 90th. Both bought a home in 2005 and sold in 2013. *Both did fine.* Question: **Who earned more from owning a home?** PLACE YOUR BET: three big buttons — Anna / Bo / About the same. (Prediction pattern. Whatever they pick is remembered and echoed later.)

**Slide 0.3** The reveal, slow. Two bars grow: Bo's *price gain* is clearly taller. "If you said Bo, you're in good company. Bo's home rose in price about 1.4 percentage points a year faster than Anna's. Over ten years that is about 15 percent more." Then a BUT: a second, hatched segment grows on Anna's bar — the *rent she never paid*. Totals level off. "Count everything owning gives you, and they land in about the same place. So the answer is: **it depends what you count.** And what you count turns out to be the whole story."

Doors at the bottom of 0.3, placed under the bars:
- Under Bo's tall price bar: *Why did Bo's home rise faster?* → Deck 1
- Under Anna's hatched bar: *Wait, what is "rent she never paid"?* → Deck 3 (side entry, allowed)
- Small text: *How do you even measure this?* → Deck M (methods room)

### Deck 1 · `gap` — The gap is real, and it compounds

**1.1** The gradient. A big binscatter-style chart: income rank on the x-axis, annualized real price gain on y. Dots rise almost in a straight line. Reader drags a handle along the x-axis; a card follows: "A buyer at rank 37 gained about 3.2% a year." The line is the paper's estimated slope (0.017 pp per rank point) around the sample mean, and the page says so.

**1.2** Compounding. Two houses (Anna, Bo) with a *holding period* slider 1–20 years. Their values diverge as the slider moves. At 10 years: ~15 percent apart. "Small yearly gaps become large piles because prices compound."

**1.3** The suspects. "Bo could have earned more for four kinds of reasons." Four doors drawn as four houses on a street:
- **What he bought** (apartments vs houses, size, age)
- **Who he is** (age, wealth, education, gender)
- **When he bought and sold** (market timing)
- **Where he bought** (location)
"Pick the one you suspect most." Each door opens Deck 2 at the slide for that suspect, but Deck 2 runs the same experiment for all four, so the reader's pick only orders the reveal.

### Deck 2 · `why` — The detective's rule

**2.1** The rule. Before testing suspects, the one idea that decides everything: a factor can *explain* the gap only if it does two things at once: **it predicts price gains, and it differs between Anna and Bo.** Playable: two dials, *how strongly does it predict gains* and *how different is it between rich and poor buyers*. A product bar shows *how much of the gap it could explain*. Turn one dial to zero and the bar dies whatever the other does. This is the omitted-variable-bias formula without the formula.

**2.2** The experiment. The main playable of the deck. A horizontal bar showing the gap (0.017). Chips the reader can toggle on: *property traits*, *buyer traits*, *market timing*, *municipality*, *postcode*, *timing × postcode*. Toggling a chip animates the bar to the paper's estimate under that specification (0.017 → 0.017 → 0.013 → 0.011 → 0.005 → 0.003 → 0.001) with the 95% band. Property traits: nothing. Buyer traits: a nibble. Timing: a nibble. Municipality: two-thirds gone. Postcode: four-fifths gone. Timing×postcode: gone. Each chip, when active, prints one line about why it did or didn't bite, using the 2.1 rule ("apartments *do* gain more, but Anna and Bo are about equally likely to buy one").

**2.3** Where, not what. The Gelbach share: a single stacked bar. Location 88% of the explained movement under postcode fixed effects. "Where households buy, not what they buy, accounts for almost the whole gap." Door: *So do rich people just pick better neighbourhoods?* → 2.4.

**2.4** A twist. Inside a single city the slope flips. Within Copenhagen, controlling for postcode and timing, higher income predicts slightly *lower* gains (−0.004). Small chart: national slope up, within-city slope slightly down. "Bo isn't better at picking the winning street. He is better at being in the winning town." Door: *Is the winning town just riskier?* → Deck R (side room). Main door: *Then why do richer buyers end up in the winning towns?* → Deck 4.

Also a quiet door: *Hold on, price gains aren't the whole return* → Deck 3.

### Deck 3 · `yield` — The half of the return nobody sees

**3.1** The rent you pay yourself. A house with an arrow looping from the owner to the owner. "Owning a home pays you twice: the price can rise, and you get to live in it without paying rent. Economists call the second part the *rental yield*. It's real money; you just never see it move." Interactive: a monthly rent counter ticking up for Anna's home if she had rented it.

**3.2** Price and rent don't move together across places. A slider along a single road from a rural Jutland village to central Copenhagen. As it moves toward Copenhagen: the price tag climbs steeply, the monthly rent climbs gently, so *rent ÷ price* (the yield) falls. The three numbers update. Reader discovers: expensive places have low yields.

**3.3** Put the two together. The gradient chart from 1.1 gains a second line (yield, falling) and a third (total, roughly flat). Reader toggles each line. "Bo's higher price gains are almost exactly offset by lower yields where he buys. Totals are about equal." Honest note in the margin: yields are imputed from a 1999 rent cross-section, validated against national accounts and 2015–2022 private rental data; slopes come from the paper, levels are illustrative here.

**3.4** Same total, different shape. Two stacked bars (Anna, Bo), equal height, different split: Anna mostly hatched (services), Bo mostly solid (price gains). "Total returns are equalized. Their *composition* is not." Door: *Does the shape matter if the total is the same?* → Deck 6 (wealth). Door: *Why do they end up in different places to begin with?* → Deck 4.

### Deck 4 · `feasible` — What you can actually buy

**4.1** You can't buy a slice of a neighbourhood. Contrast: a stock (buy 1 share of anything) vs a house (buy the whole thing, and it has to be big enough to live in). Two constraints drawn as a floor and a ceiling: *the home must be big enough for you* (floor) and *the bank must lend you enough* (ceiling). Between them: the feasible set.

**4.2** The bank's two rules. Playable: build a household. Sliders: yearly income, savings. Two rules compute two ceilings: **loan-to-value** (you need 20% down, so savings × 5) and **payment-to-income** (payments at most 35% of income, 30-year loan at the current rate). Whichever is lower binds. A big number: *maximum price*. Presets: Anna, a middle buyer, Bo. Reader discovers PTI binds for most people and income is what drives the ceiling.

**4.3** The map of homes. A field of ~300 dots: homes sold in a year, positioned by price (y) and town type (x: rural → province → city → capital). Dots inside the household's ceiling light up. A share counter: *you could buy N% of homes*. Then two filters the reader can switch on: *at least as big as you need* and *only in high-growth towns*. With both on, Anna's share collapses to single digits while Bo's stays large. The paper's numbers appear as a caption: bottom third ~40% of homes, top third >60%; in high-growth areas at same size, rank 40 ≈ 20%.

**4.4** Which rule bites. A small chart by income rank: share for whom LTV binds (inverted U), PTI binds the rest. "The rule that keeps most buyers out of Copenhagen is the payment rule, and it is income that sets it." Door: *So loosen the payment rule and Anna gets in?* → Deck 5.

### Deck 5 · `reform` — Denmark ran the experiment

**5.1** 2003. Interest-only mortgages arrive. Monthly payments fall by roughly a fifth. This loosens exactly the payment rule from 4.4. PLACE YOUR BET: In high-growth towns, the share of low-income buyers will… *rise / stay flat / fall*. Second bet: prices there will… *rise / stay flat / fall*.

**5.2** The reveal. Two event-study strips. Left: share of low-income buyers in high-growth municipalities, 1998–2010, coefficients hugging zero, before and after. Right: log prices step up after 2003. "Uptake was broad, over 60% of purchases used interest-only. Debt rose. Prices rose. The mix of buyers did not move." Reader's bets are echoed.

**5.3** The auction. The load-bearing playable. A town with a fixed number of homes for sale (say 8) and 24 would-be buyers across the income ladder. Each bids up to their ceiling from 4.2. Homes go to the top 8 bidders at the 8th-highest bid. Reader presses *Give everyone 25% more borrowing*. Watch: every bar grows, the price line rises, the same 8 win. Then a toggle: *let builders respond* (elastic supply: the number of homes rises with price). Now the marginal buyers get in and the mix changes. This is the argument as a system. Caption: in the data, middle-income shares rose after 2003 only where supply was elastic.

**5.4** What this means. "Credit sets the baseline of who can enter. When supply cannot grow, more credit buys the same homes at higher prices. Sorting is an equilibrium, not an oversight." Doors: *Is any of this specific to Denmark?* → Deck X. *So what does the shape of the return do to wealth?* → Deck 6.

### Deck 6 · `wealth` — You can't put a roof in a savings account

**6.1** Two forms of the same return. Anna and Bo again, identical total return by construction. Ten years tick by. Bo's price gain accumulates into a pile labelled *transferable wealth*: it can be sold, borrowed against, inherited, and in Denmark is untaxed. Anna's rental dividend accrues as a stream of *housing services*: nights slept, meals cooked, a roof. It is real, and consumed. Slider: *share of the rental dividend Anna could save instead* (default 0; the page says why it's near zero). Even at generous settings Bo's pile is bigger.

**6.2** How big a deal for wealth inequality? A Victor-style honest model. Portfolio shares at P10 and P90 (housing, financial, pension) and returns by asset, all editable. Live bars: each asset's contribution to the P90–P10 wealth-return gap. Defaults from the paper (Danish shares, passive financial calibration). Housing is the largest single contributor (about 1.1–1.3 pp/year). Reader can break it: set housing gradient to zero and see the gap shrink; swap in SCF US shares.

**6.3** What we learned. The chain restated in seven short lines, each linking back to the deck that proved it. Then the 🤔: three open questions from the paper's conclusion (do these gains persist, schools and human capital, selection vs constraint). Door to the sandbox.

### Deck S · `sandbox` — Your Denmark

One screen combining the auction (5.3) and the feasible-set map (4.3) with exposed parameters: LTV down-payment, PTI cap, interest rate, supply elasticity, minimum size, the location price premium. "Build a housing market and see who ends up with the capital gains." Notes on where the model is a cartoon: partial equilibrium, no moving costs, no schools, realized not expected returns.

## Side rooms

### Deck R · `risk` — Is Copenhagen just riskier?
3 slides. R.1: the finance reflex: higher return should mean higher risk. R.2: eight risk measures by income rank (volatility, beta, downside frequency and depth, time to sell, covariance with income and consumption growth, idiosyncratic risk). Reader picks a measure; a strip chart shows the gradient by decile from the paper's table. All gradients are tiny; time-to-sell actually *falls* with income (more liquid). R.3: "Not risk, and not skill either (2.4). Something else keeps Anna out." → back to Deck 4.

### Deck X · `elsewhere` — Is this just Denmark?
2 slides. X.1: US ZIP codes ranked by 2000 price level; the most expensive fifth grew fastest over 25 years (Zillow). X.2: The ingredients the mechanism needs: persistent spatial differences in growth, borrowing limits, slow supply. Where it should be weaker: elastic supply, low ownership, heavy capital-gains taxes. Back to Deck 5 or 6.

### Deck M · `measure` — How do you measure this?
4 slides. M.1: repeat sales: same home, two prices, exact dates; annualized log gain. Small calculator. M.2: income rank within age cohorts, why (a 28-year-old and a 58-year-old at the same income are not at the same place in life). M.3: measuring the rent nobody pays: 1999 register rents, national accounts, 2015–2022 private rental data agree on the cross-section. M.4: what this can't tell you: realized not expected returns, statistical not causal explanation. Back to wherever the reader came from.

## Navigation

- Hash routing `#deck/slide`. Bottom bar: deck title, clickable progress dots for the current deck, prev/next, *Map* button. `m` opens the map. Arrow keys move.
- Map: the tree drawn as a small street plan; visited slides filled, current slide pulsing; click to jump.
- Progress in localStorage per deck (last slide, visited set, bets). Revisiting a finished deck opens on its last slide with playables in completed state.
- Demo stages are fixed-height boxes (`--stage-h`), never resizing with content.
- Static read works: every slide's prose carries the idea; the playables deepen it.

## Visual direction (first pass; the creative director may revise)

- Ground: pale cool paper `#F5F6F3`, dark `#151A1C`. Ink `#1C2224`.
- Semantic colors, fixed by entity: **price gains** brick `#B8452E`, **rental yield** verdigris `#2E7D6E`, **Bo / high-income** ink-blue `#2B4C7E`, **Anna / low-income** ochre `#C98B1F`. Dark-mode steps validated separately.
- Type: display *Bricolage Grotesque* (Danish poster confidence), body *Newsreader* (a narrator's voice), data *IBM Plex Mono*.
- Motif: the house shape, drawn as one continuous line; a floor and a ceiling as the recurring diagram of the feasible set.

## Honesty notes to carry on the page

- Slopes are the paper's estimates. Levels in the playables are stylized and say so.
- The auction and feasible-set models are cartoons of the paper's framework, not its data.
- "Statistically accounts for" is not "causes". The page says this where it matters (2.3, 5.4, M.4).
