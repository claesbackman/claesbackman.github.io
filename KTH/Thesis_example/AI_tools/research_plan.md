# AI Exposure and House Prices in Denmark: Research Plan (v3)

Updated 20 October 2026 after Phase 1 (results in Section 9). Table names and coverage were checked against the live DST API and the Finans Danmark statbank on this date.

**Decisions so far.** Public data only (no register access). Generative AI shock in late 2022. ILO generative AI exposure index as the baseline measure. Exposure measured where residents live. Municipality prices from Finans Danmark BM010.

## 1. Question and hypothesis

The paper asks whether Danish municipalities whose residents work in jobs more exposed to generative AI experienced faster house price growth after ChatGPT was released on 30 November 2022. The working hypothesis is that they did.

The proposed mechanism runs through expected income. If generative AI raises the productivity of workers whose tasks it touches, their expected earnings rise and so does their demand for housing where they live. Where housing supply is inelastic, higher demand shows up in prices. Because house prices capitalize expected future income, prices can respond before any change in wages is measurable.

Theory does not pin down the sign. If AI substitutes for exposed workers rather than complementing them, expected income falls and the same exposure measure predicts slower price growth. The ILO index separates occupations with augmentation potential from occupations with automation potential, and Section 5.4 uses that split to let the data distinguish the two cases.

The reference quarter is 2022Q3, the last full quarter before ChatGPT's release.

## 2. Unit of analysis

The unit is the municipality (98 kommuner), observed quarterly from 2010Q1 to 2026Q2. Exposure is fixed at its pre-shock value. Starting in 2010 skips the financial crisis and still gives twelve years of pre-period to test for differential trends.

The public DST house price tables stop at the 11 provinces (landsdele), which is too few units for credible inference. The main outcome is therefore the municipality price per m² from Finans Danmark (Section 3.2). The DST province index serves as a check on it.

## 3. Data

### 3.1 DST tables (via api.statbank.dk)

| Table | Content | Geography | Coverage | Role |
|---|---|---|---|---|
| RAS302 | Employed (end November) by 37 DB07 industries and socioeconomic status, **by residence** | 98 municipalities | Annual, 2008–2024 | Exposure weights (baseline) |
| RAS301 | Same breakdown, **by workplace** | 98 municipalities | Annual, 2008–2024 | Robustness, labor-demand outcome |
| PEND100 | Employed by municipality of residence and municipality of workplace | 98 × 98 | Annual, 2008–2024 | Commuting-weighted robustness |
| FRA029 | Full-time employed in private firms by 36 DB07 industries and 9 DISCO major groups | National | Annual, 2013–2024 | Occupation mix within industries |
| FRA020 | Full-time employed by sector (incl. general government) and DISCO 2-digit | National | Annual, 2013–2024 | Occupation mix in the public sector |
| LONS20 | Number of full-time employees by DISCO 4-digit occupation and sector | National | Annual, 2013–2025 | Danish weights for aggregating ILO scores |
| FORMUE12 | Wealth by component: home value, mortgage debt, listed shares, investment funds | 98 municipalities | Annual, 2014–2024 | Rate-sensitivity and equity-wealth controls |
| EJ56 | Quality-adjusted price index, houses and owner-occupied flats | 11 provinces | Quarterly, 1992Q1–2026Q2 | Check on BM010 |
| EJEN77 | Number of sales and average price per property | 11 provinces | Quarterly, 1992Q1–2026Q2 | Volumes |
| FOLK1A | Population by age and sex | 98 municipalities | Quarterly, 2008Q1–2026Q3 | Population flows, controls |
| IFOR41 | Income distribution indicators | Municipalities | Annual, 1987–2024 | Income controls and outcomes |

RAS301 counts jobs located in a municipality and RAS302 counts employed residents. The table titles do not say this, so I checked the counts. In 2024 RAS301 records 464,753 employed in Copenhagen and RAS302 records 395,027. The commuter suburb Furesø shows the reverse, with 15,680 in RAS301 and 21,763 in RAS302.

The socioeconomic status variable in RAS302 splits employees into managers, upper level, medium level, basic level and other employees. DST derives these categories from the DISCO major group of the job (to be confirmed in the DST documentation). FRA029 uses the same 37-industry grouping as RAS302, except that it has no agriculture. The two tables can therefore be merged cell by cell.

Other tables to check before use are housing completions (BYGV series), migration by municipality, and unemployment (AUL01).

### 3.2 Municipality house prices: Finans Danmark BM010

BM010 at rkr.statistikbank.dk reports DKK per m² for 98 municipalities, plus provinces and regions. It covers three property categories (detached/terraced houses, owner-occupied flats, holiday homes). Each has three price concepts: initial listing price, final listing price and realised transaction price. Coverage is quarterly from 1992Q1 to 2026Q2 for realised prices, with listing prices starting later. The table runs on the older PX-Web interface rather than api.statbank.dk and caps extract size at 20,000 cells for users who are not logged in. `02_download_bm010.py` therefore submits one query per property category and price concept. Realised house prices are available for all 98 municipalities in nearly every quarter since 2010. Flat prices are missing for many rural municipalities, so only 73 municipalities have a flat price change for 2022–2026.

The realised price per m² for detached and terraced houses is the baseline outcome. Flats are the second outcome, since young knowledge workers in the cities mostly buy flats. The gap between listing and realised prices measures demand pressure and serves as a secondary outcome. Prices respond to a demand shock with a lag, while the discount from the listing price narrows quickly.

The m² price has two weaknesses, and without register data neither can be fully removed. It is an average rather than a quality-adjusted index, so a shift in the size or quality of homes sold moves it. It is also noisy in small municipalities with few sales, particularly for flats. The analysis checks robustness to dropping municipalities with few sales and weights by transaction volume where Finans Danmark publishes volumes by municipality. It also compares province aggregates of BM010 with the quality-adjusted DST index EJ56. If the two move together over 2022–2026, composition is unlikely to drive the results.

### 3.3 AI exposure measures

| Measure | Classification | Use |
|---|---|---|
| ILO generative AI exposure (refined index, Gmyrek et al. 2025) | ISCO-08, 4-digit | **Baseline.** DISCO-08 extends ISCO-08, so no crosswalk is needed |
| ILO generative AI exposure (Gmyrek, Berg, and Bescond 2023) | ISCO-08, 4-digit | Robustness, and the augmentation/automation split |
| Felten, Raj, and Seamans (2021) AIOE | US SOC | Robustness. Requires the BLS SOC–ISCO crosswalk |
| Eloundou et al. (2024) GPT exposure | O*NET | Robustness |
| Pizzinelli et al. (2023) complementarity-adjusted AIOE | ISCO-08 | Alternative complementarity split |
| Webb (2020) software and robot exposure | US occupations | Placebo for pre-generative technology |
| Dingel and Neiman (2020) teleworkability | O*NET | Control for the remote-work channel |

If the refined 2025 scores are not published at the 4-digit level, the 2023 index becomes the baseline.

## 4. Constructing exposure

Public data have no occupation counts by municipality, so the ILO occupation scores reach municipalities through industries and skill levels. The chain uses only Danish public tables.

1. **Occupation scores.** Take the ILO score $e_o$ for each ISCO-08 4-digit occupation.
2. **Major-group scores.** Average $e_o$ within each DISCO major group $g$, weighting by Danish full-time employment from LONS20 (2017–2019). Do this separately for private firms and general government, giving $e_g^{priv}$ and $e_g^{pub}$. Danish DISCO codes without an ISCO-08 score take the mean of their 3-digit ISCO group (2.5 percent of private and 11.9 percent of public full-time employment). Armed forces have no score and drop out (2.4 percent of public employment).
3. **Industry-by-skill cell scores.** For each industry $i$, FRA029 gives the employment share of each major group, $w_{gi}$. Each RAS302 skill level maps to one or more major groups $G(s)$ (managers to group 1, upper level to 2, medium level to 3, basic level to 4–8, other employees to 9). The cell score is $e_{is} = \sum_{g \in G(s)} w_{gi} e_g / \sum_{g \in G(s)} w_{gi}$. For the basic level, this weights clerical work (group 4, highly exposed) against crafts and machine operation (groups 7–8, barely exposed) according to each industry's own mix. Public administration, education and health use the general government mix from FRA020 and $e_g^{pub}$. Agriculture, which FRA029 omits, gets the score for skilled agricultural workers (group 6). Self-employed workers get their industry's employment-weighted average.
4. **Municipality exposure.** $E_m = \sum_{i,s} \sigma_{mis} \, e_{is}$, where $\sigma_{mis}$ is the share of municipality $m$'s employed residents in cell $(i,s)$ from RAS302, averaged over 2017–2019. This fixes the shares before COVID and before ChatGPT.

$E_m$ is standardized across municipalities so that coefficients read as percent price growth per standard deviation of exposure.

Two robustness versions use the same cell scores. The workplace measure applies RAS301 shares. The commuting-weighted measure $E_m^{comm} = \sum_w \pi_{mw} E_w^{work}$ uses commuting shares $\pi_{mw}$ from PEND100.

The measure has a known limitation. Occupation mix varies across municipalities within an industry and skill level, for example headquarters functions in Copenhagen versus operations elsewhere. The measure misses this variation, which biases estimates toward zero. The skill-level dimension recovers part of it. Before running any price regression, Phase 1 checks how much cross-municipality variation $E_m$ actually has.

## 5. Empirical strategy

### 5.1 Descriptives

The first outputs are a map of $E_m$ and a balance table relating it to baseline log price, price-to-income ratio, mortgage debt relative to home value, listed-share holdings, tertiary education share, income, population density, distance to Copenhagen and Aarhus, share of flats, and pre-period price growth. Exposure will almost certainly be strongly correlated with urban, educated, high-income municipalities. That correlation is the central identification problem, and the balance table makes it visible from the start. A raw scatter of log price growth from 2022Q3 to 2026Q2 against $E_m$ completes the first look.

### 5.2 Main specification

The event study estimates

$$\ln P_{mt} = \alpha_m + \delta_{p(m),t} + \sum_{k \neq 2022Q3} \beta_k \, E_m \, \mathbf{1}[t=k] + \sum_k X_m'\gamma_k \, \mathbf{1}[t=k] + \varepsilon_{mt}$$

where $\alpha_m$ are municipality fixed effects, $\delta_{p(m),t}$ are province-by-quarter fixed effects that restrict comparisons to municipalities within the same province, and $X_m$ are baseline controls interacted with quarter dummies. The coefficients $\beta_k$ trace the price path of a municipality with one standard deviation higher exposure, relative to 2022Q3. Pre-period coefficients test for differential trends.

Two simpler versions accompany it. A pooled difference-in-differences replaces the event-time interactions with $E_m \times Post_t$. A long-difference regression of $\Delta \ln P_m$ (2022Q3 to 2026Q2) on $E_m$, controls and pre-period price growth gives a transparent cross-sectional summary.

Standard errors are clustered by municipality. Municipalities with similar industry mix have correlated residuals in shift-share designs, so the plan also reports Adão, Kolesár, and Morales (2019) standard errors, plus wild cluster bootstrap and Conley spatial standard errors as robustness. Rotemberg weights (Goldsmith-Pinkham, Sorkin, and Swift 2020) show which industry-skill cells drive the estimate.

Coefficients are translated into DKK for the median one-family house and compared with national price growth over the same window.

### 5.3 Threats to identification

**Urban knowledge-economy trend.** Exposed municipalities are urban, educated and high-income, and they may already have been on steeper price paths before 2022. The design addresses this with province-by-quarter fixed effects, baseline controls interacted with time, the pre-period event-study coefficients, Rambachan and Roth (2023) bounds on violations of parallel trends, and a sample excluding Copenhagen and Frederiksberg.

**The 2022 interest rate shock.** Danish mortgage rates rose sharply during 2022, the same year ChatGPT was released. Areas with high prices and high debt relative to income are more sensitive to rates, and these overlap with exposed areas. The specification controls for baseline price-to-income and mortgage debt relative to home value (FORMUE12), each interacted with time. The event study also shows whether the divergence starts in 2022Q1–Q3, which points to rates, or after 2022Q4, which is consistent with the AI shock.

**The 2024 property tax reform.** New valuations and tax rules from January 2024 changed tax burdens differently across price levels. A baseline price level × post-2024 interaction absorbs this.

**Remote work.** Exposed occupations are largely teleworkable, and the pandemic shifted housing demand across locations (Gupta et al. 2022, Mondragon and Wieland 2022). A teleworkability exposure measure, built through the same chain and interacted with time, runs as a horse race against AI exposure.

**Equity wealth.** The equity rally driven by AI firms from 2023 raised wealth in municipalities whose residents hold more stocks. This is an AI channel that does not operate through the labor market. FORMUE12 reports listed-share and investment-fund holdings by municipality, so baseline equity holdings interacted with time enter as a control. In the mechanism section they can also be estimated as a separate channel.

**Placebos.** Webb (2020) exposure to software and robots should show no break after 2022. Placebo shock dates (for example 2019Q4) and a teleworkability-only specification complete the set.

### 5.4 Mechanisms

A credible price effect raises the question of where it comes from, and the plan tests five channels.

The first is the labor-market first stage. Do exposed municipalities show faster employment and income growth after 2022 (RAS301/302 and income tables, through 2024)? Humlum and Vestergaard (2025) find small effects of chatbot adoption on earnings and hours in Danish register data. If prices respond while incomes do not, the channel is expectations rather than realized income.

The second is complementarity. Gmyrek, Berg, and Bescond (2023) classify occupations by whether generative AI is more likely to augment or automate them. Building separate augmentation and automation exposures through the same chain lets each enter the regression. The hypothesis predicts a positive coefficient on augmentation exposure and a zero or negative coefficient on automation exposure.

The remaining three are population flows (FOLK1A and migration tables), supply elasticity, and equity wealth. On supply, the price effect should be larger where new construction is constrained, measured with housing completions by municipality. On equity wealth, the question is whether the effect is concentrated in municipalities with large stock holdings.

## 6. Pipeline and project structure

Downloads run in Python and analysis in Stata.

```
Code/
  run_all.sh                # runs every step below in order (Phase 1)
  00_programs.do            # shared Stata helpers (import DST tables, municipality codes)
  01_download_dst.py        # 14 StatBank tables, CSV format with metadata
  02_download_bm010.py      # Finans Danmark BM010 m² prices, one query per category and price
  03_download_external.py   # ILO 2025 scores, GADM municipality boundaries
  04_build_geo.py           # map coordinates, province, distances to Copenhagen and Aarhus
  10_build_exposure.do      # steps 1-4 of Section 4
  11_build_panel.do         # quarterly price panel and 2019 baseline characteristics
  20_descriptives.do        # Phase 1 outputs
  21_eventstudy.do          # Phase 2 onwards
  22_robustness.do
  23_mechanisms.do
Data/raw/, Data/clean/      # gitignored
Figures/  Tables/  Writing/  AI_tools/
```

The DST script uses the CSV format because the streaming BULK format does not allow the API to sum over variables left out of a query. CSV is capped at 1,000,000 cells per request, so the three largest tables are requested one year at a time. Each raw file is saved with its table metadata and download date so every number can be traced to a specific extract. The DAWA boundary API has been shut down, so boundaries come from GADM 4.1. The robustness and control measures (Dingel–Neiman, Felten et al., Pizzinelli et al., Webb) are not downloaded yet.

## 7. Phases

1. **Exposure and first look.** Download RAS302, FRA029, FRA020, LONS20 and the ILO index. Build $E_m$, map it, and check its cross-municipality variation. Merge with BM010 and produce the balance table and long-difference scatter.
2. **Municipality panel** for 2010Q1–2026Q2 and the main event study.
3. **Threats and robustness** from Section 5.3.
4. **Mechanisms** from Section 5.4.
5. **Writing.**

## 8. Open questions

1. **Answered.** DST assigns employees to socioeconomic status groups "as a main rule by the first digit of the DISCO code", but publishes no exact table. National shares support the assumed mapping. Employees by status in RAS302 (2019) are 4.5, 28.7, 11.5, 45.2 and 10.1 percent for managers, upper, medium, basic and other. Full-time employment in DISCO groups 1, 2, 3, 4–8 and 9 (FRA020) is 4.9, 33.1, 12.5, 40.9 and 8.5 percent. The remaining gaps are consistent with more part-time work in the lower groups.
2. **Answered.** The 2025 scores are published at the ISCO-08 4-digit level (github.com/pgmyrek/2025_GenAI_scores_ISCO08). The file also carries the 2023 scores and the 2023 augmentation/automation classification. The 2025 index replaces that classification with exposure gradients, so the complementarity split in Section 5.4 uses the 2023 classification.
3. **Open.** BM010 has no transaction counts. Whether Finans Danmark publishes volumes by municipality in another table remains to be checked.

## 9. Phase 1 results (20 October 2026)

Code: `Code/run_all.sh` runs the full pipeline. Outputs are `Figures/map_exposure.png`, `Figures/prices_by_tercile.png`, `Figures/longdiff_scatter.png`, `Tables/exposure_variation.tex`, `Tables/balance.tex` and `Tables/longdiff.tex`.

**Exposure varies, but mostly along the urban-rural gradient.** Resident exposure averages 0.312 (SD 0.019) and ranges from 0.285 in Tønder to 0.357 in Frederiksberg. The ten most exposed municipalities are Copenhagen and its northern suburbs. The least exposed are in West Jutland, Lolland and the small islands. Exposure correlates 0.94 with the 2019 log house price, 0.92 with the tertiary education share, 0.84 with population density and 0.82 with income. The industry-only measure (SD 0.013) and the skill-only measure (SD 0.008) each correlate above 0.93 with the combined measure. Workplace and residence exposure correlate 0.84, and the 2023 and 2025 ILO scores correlate 0.99.

**The raw association predates ChatGPT.** One standard deviation of exposure goes with 3.5 log points faster house price growth from 2021Q4–2022Q3 to 2025Q3–2026Q2 (robust SE 0.6). Mean growth over the period is 8.0 log points. The same regression for 2015–2019 gives 3.4 log points (SE 0.7). The tercile figure shows why: high-exposure municipalities gained roughly 20 log points on low-exposure ones between 2015 and 2021, moved in step with them from 2021 to 2023, fell more in the 2022 rate shock, and pulled ahead again from 2024.

**Within provinces there is no association yet.** With province fixed effects only, the coefficient is 0.8 log points (SE 1.0) after ChatGPT and 0.1 (SE 1.1) in the placebo period. Adding baseline controls raises the point estimate to 5.5 (SE 3.4). Because exposure is almost collinear with the price level and education, that estimate is unstable and should not be read as an effect. For flats the coefficient is 0.1 (SE 7.9, 73 municipalities).

**Implications for Phase 2.**
1. The cross-section cannot separate AI exposure from the long-running premium of educated, high-price areas. The event study with province-by-quarter fixed effects and baseline price level × quarter controls is the more informative test of timing.
2. The renewed divergence starts in 2024, when policy rates began to fall. Rate-sensitive, high-price areas recovering is a direct alternative explanation, so the rate controls in Section 5.3 are central rather than optional.
3. Exposure residualized on education and the price level, the augmentation/automation split, and the workplace and commuting versions may carry variation that is less collinear with the urban gradient. Phase 2 should check how much variance is left after residualizing before relying on it.

## References (to be verified before use in the paper)

Adão, Rodrigo, Michal Kolesár, and Eduardo Morales. 2019. "Shift-Share Designs: Theory and Inference." *Quarterly Journal of Economics* 134 (4): 1949–2010.

Dingel, Jonathan I., and Brent Neiman. 2020. "How Many Jobs Can Be Done at Home?" *Journal of Public Economics* 189: 104235.

Eloundou, Tyna, Sam Manning, Pamela Mishkin, and Daniel Rock. 2024. "GPTs Are GPTs: Labor Market Impact Potential of LLMs." *Science* 384 (6702): 1306–1308.

Felten, Edward, Manav Raj, and Robert Seamans. 2021. "Occupational, Industry, and Geographic Exposure to Artificial Intelligence: A Novel Dataset and Its Potential Uses." *Strategic Management Journal* 42 (12): 2195–2217.

Gmyrek, Paweł, Janine Berg, and David Bescond. 2023. "Generative AI and Jobs: A Global Analysis of Potential Effects on Job Quantity and Quality." ILO Working Paper 96.

Gmyrek, Paweł, Janine Berg, Karol Kamiński, Filip Konopczyński, Agnieszka Ładna, Balint Nafradi, Konrad Rosłaniec, and Marek Troszyński. 2025. "Generative AI and Jobs: A Refined Global Index of Occupational Exposure." ILO Working Paper 140.

Goldsmith-Pinkham, Paul, Isaac Sorkin, and Henry Swift. 2020. "Bartik Instruments: What, When, Why, and How." *American Economic Review* 110 (8): 2586–2624.

Gupta, Arpit, Vrinda Mittal, Jonas Peeters, and Stijn Van Nieuwerburgh. 2022. "Flattening the Curve: Pandemic-Induced Revaluation of Urban Real Estate." *Journal of Financial Economics* 146 (2): 594–636.

Humlum, Anders, and Emilie Vestergaard. 2025. "Large Language Models, Small Labor Market Effects." NBER Working Paper 33777.

Mondragon, John A., and Johannes Wieland. 2022. "Housing Demand and Remote Work." NBER Working Paper 30041.

Pizzinelli, Carlo, Augustus J. Panton, Marina Mendes Tavares, Mauro Cazzaniga, and Longji Li. 2023. "Labor Market Exposure to AI: Cross-Country Differences and Distributional Implications." IMF Working Paper 23/216.

Rambachan, Ashesh, and Jonathan Roth. 2023. "A More Credible Approach to Parallel Trends." *Review of Economic Studies* 90 (5): 2555–2591.

Webb, Michael. 2020. "The Impact of Artificial Intelligence on the Labor Market." Working paper, Stanford University.
