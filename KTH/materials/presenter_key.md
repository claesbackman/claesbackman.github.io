# Presenter's key: the planted flaws in thesis.md

For the debrief of exercises 1 and 1b. Do not hand this out, and do not put it in the participants' folder: the agent would read it.

Ten flaws, ordered roughly from easy to hard to catch. Rubric criterion in brackets.

1. **The text misreads Table 2** [4]. Section 5 and the abstract report an elasticity of −0.45 ("a 10 percent increase … reduces consumption by 4.5 percent"). Column 2 shows −0.045, which is a 0.45 percent reduction. The thesis is wrong by a factor of ten, and so is the policy number in section 6 (9 percent).

2. **Significance is overstated** [4]. Column 3 is −0.031 with a standard error of 0.015, t ≈ 2.1. The table marks it ** (5 percent), but the text says "significant at the 1 percent level".

3. **The sample changes without explanation** [3, 6]. Section 3 and Table 1 have all 290 municipalities and 2,610 observations. Table 2 has 2,358, which is 262 municipalities × 9 years. The dropping rule ("missing values for any variable") is never quantified, and the abstract and conclusion still say "all 290 municipalities".

4. **Figure 2 does not exist** [6]. Section 3 describes Figure 2, consumption by price quartile, and draws a conclusion from it. There is no Figure 2.

5. **An invented reference** [2, 6]. Holmqvist and Saarinen (2019), *Energy Economics* 81: 112–25, was made up for this exercise, and the discussion compares the main estimate with its −0.6. The other four references are real.

6. **H2 is never tested** [2]. H2 predicts a larger response where the share of detached houses is higher. That needs an interaction between price and the share. The thesis reports only the share's level effect and says it is "consistent with" electric heating.

7. **Weather is omitted** [3]. Household electricity use in Sweden depends heavily on heating, and so on winter temperatures. Prices, especially in 2021–2022, moved with the same seasons and years. Without heating degree days, the price coefficient picks up weather. Year fixed effects absorb national weather shocks, but not regional ones that line up with the bidding areas.

8. **Causal claims from correlations** [4, 5]. Price varies only by bidding area and year, so the "experiment" is four regions over nine years, and the north–south price gap coincides with climate, housing and income differences. The abstract, discussion and conclusion say prices "cause" lower use and extrapolate to a tax. The limitations paragraph does not mention identification at all.

9. **Standard errors ignore the panel structure** [3]. Municipalities are observed nine times, and price is shared by every municipality in a bidding area. Heteroskedasticity-robust standard errors understate uncertainty. They should at least be clustered by municipality, and arguably by bidding area, which leaves only four clusters.

10. **Households versus municipalities** [1, 5]. The research question is about households, but the data are municipal averages per capita. Behaviour of the average municipality need not describe any household. The thesis mentions this only as "average behaviour".

Softer issues a good report may also raise: the literature review summarises studies one by one without a gap (criterion 2, "sufficient" at best), and "winsorised at the 1st and 99th percentiles" is applied to price, which takes only 36 distinct values (9 years × 4 areas).

**What to expect.** In a test run of the exact exercise prompt in a fresh session (October 2026, without web search), the report caught all ten flaws and both softer issues, and added valid points of its own: spot versus retail price, nominal versus real prices, and the missing link from saved electricity to emissions under the EU ETS. It ran to about 2,500 words. Participants on the default model may see fewer catches. The debrief lesson is therefore likely to be the opposite of the one the room expects: the feedback is good enough to over-trust, and checking 2,500 words against the thesis takes real time. Ask how long it took to check one criterion, whether anything in the report is wrong or overstated, and what the room would have caught without it. `feedback-1.md` is that test run, the fallback for the resources page.

Two flaws also appear in session 2's stylised slides: flag 3 is the "N = 290 municipalities" row on the code-map stage, and flag 4 is its "Figure 2, consumption by price quartile, not found" row.
