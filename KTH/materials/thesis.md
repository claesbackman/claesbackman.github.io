> **Example thesis written for the KTH AI workshop.** The author, the data and every number in it are invented. It contains deliberate flaws for an exercise in AI-assisted feedback. It is not student work and is safe to put into an AI tool.

# Electricity Prices and Household Electricity Use in Swedish Municipalities, 2015–2023

Degree project, first cycle, 15 credits. Industrial Economics and Management.

Author: A. Student. Supervisor: B. Supervisor.

## Abstract

This thesis studies how household electricity use responds to electricity prices in Sweden. Using a panel of all 290 Swedish municipalities from 2015 to 2023, I regress household electricity use per capita on the average spot price in each municipality's bidding area. I find a price elasticity of −0.45: a 10 percent increase in the electricity price reduces household consumption by 4.5 percent. The effect is robust to controls for income and housing and to municipality fixed effects. The results show that higher prices cause households to save electricity, and they suggest that a tax on electricity would be an effective climate policy.

## 1 Introduction

Electricity prices in Sweden rose sharply in 2021 and 2022, especially in southern Sweden. Many households saw their bills double. At the same time, the Swedish government has set ambitious goals for energy efficiency, and reducing household electricity use is part of the transition to a sustainable energy system. Understanding how households react to prices is therefore important for both energy policy and climate policy.

The research question of this thesis is: **How do Swedish households change their electricity use when the price of electricity changes?**

Sweden offers a useful setting for this question. Since November 2011 the country has been divided into four electricity bidding areas, SE1 in the north to SE4 in the south, and prices differ between them. Households in the south have faced much higher prices than households in the north, particularly during the energy crisis of 2022. This variation makes it possible to estimate how consumption responds to price.

The thesis contributes to the literature by providing new estimates for Sweden using recent data that cover the energy crisis. The main finding is that households are quite responsive to prices, with an elasticity of −0.45. This is larger than many earlier estimates and suggests that price-based policies can play an important role in reducing electricity use.

The rest of the thesis is organised as follows. Section 2 reviews the literature and states the hypotheses. Section 3 describes the data. Section 4 presents the method. Section 5 presents the results, and Section 6 discusses them. Section 7 concludes.

## 2 Literature review and hypotheses

Reiss and White (2005) study household electricity demand in California using household-level survey data. They find that households respond to prices, with an average price elasticity of around −0.4, and that the response differs a lot between households, depending especially on whether they use electricity for heating and air conditioning.

Ito (2014) studies households in Southern California that face nonlinear electricity tariffs. He finds that consumers respond to the average price on their bill rather than to the marginal price, which suggests that households do not fully understand complex tariffs.

Allcott (2011) studies the effect of home energy reports that compare a household's consumption with that of its neighbours. He finds that the reports reduce electricity consumption by about two percent, which shows that non-price interventions can also change behaviour.

Labandeira, Labeaga and López-Otero (2017) conduct a meta-analysis of studies on the price elasticity of energy demand. They find that short-run elasticities are considerably smaller than long-run elasticities, because households need time to change appliances and heating systems.

Holmqvist and Saarinen (2019) estimate the price elasticity of residential electricity demand in the Nordic countries using data from 2000 to 2017. They find an elasticity of −0.6 for Sweden, which is among the highest in Europe, and explain it by the high share of electric heating in Swedish homes.

Based on this literature, I formulate two hypotheses:

**H1.** Higher electricity prices reduce household electricity use.

**H2.** The price response is larger in municipalities with a higher share of detached houses, because detached houses are more often heated with electricity.

## 3 Data

The data cover all 290 Swedish municipalities for the years 2015 to 2023, which gives 2,610 municipality-year observations.

**Electricity use.** Household electricity use per municipality comes from Statistics Sweden's municipal and regional energy statistics. I divide it by the population to obtain household electricity use per capita, measured in kWh per year.

**Prices.** Each municipality is assigned to its bidding area (SE1–SE4). The price is the annual average spot price in that area from Nord Pool, measured in öre per kWh. All municipalities in the same bidding area therefore have the same price in a given year.

**Controls.** Median disposable household income per municipality and the share of dwellings that are detached houses both come from Statistics Sweden.

To reduce the influence of extreme values, all continuous variables are winsorised at the 1st and 99th percentiles. Municipalities with missing values for any variable are dropped.

**Table 1. Summary statistics, 2015–2023**

| Variable | Mean | Std. dev. | Min | Max | N |
|---|---|---|---|---|---|
| Household electricity use per capita (kWh) | 4,820 | 1,310 | 2,140 | 9,860 | 2,610 |
| Spot price (öre/kWh) | 48.6 | 31.2 | 14.0 | 152.0 | 2,610 |
| Median disposable income (SEK thousand) | 312 | 38 | 236 | 498 | 2,610 |
| Share of detached houses (%) | 61.4 | 17.9 | 4.2 | 93.8 | 2,610 |

**Figure 1 (shown as a table). Average spot price by bidding area, öre/kWh**

| Year | SE1 | SE2 | SE3 | SE4 |
|---|---|---|---|---|
| 2015 | 20 | 20 | 21 | 22 |
| 2016 | 28 | 28 | 29 | 30 |
| 2017 | 29 | 29 | 30 | 32 |
| 2018 | 44 | 44 | 45 | 48 |
| 2019 | 37 | 37 | 39 | 41 |
| 2020 | 14 | 14 | 22 | 28 |
| 2021 | 41 | 41 | 69 | 84 |
| 2022 | 50 | 52 | 136 | 152 |
| 2023 | 37 | 38 | 57 | 69 |

Figure 1 shows that prices were similar across bidding areas until 2020 and then diverged, with southern Sweden facing much higher prices in 2021 and 2022. Figure 2 shows household electricity use by price quartile and confirms that municipalities in the highest price quartile use less electricity per capita.

## 4 Method

I estimate the following regression by ordinary least squares:

log(use) = α + β log(price) + γ X + δ year + ε

where *use* is household electricity use per capita in a municipality and year, *price* is the spot price in the municipality's bidding area, *X* contains log median income and the share of detached houses, and *year* is a set of year fixed effects. Because both use and price are in logs, β is the price elasticity of household electricity demand.

Column 1 includes only the price. Column 2 adds the controls and year fixed effects, and is the main specification. Column 3 also adds municipality fixed effects, so that the elasticity is estimated only from changes over time within each municipality. Standard errors are robust to heteroskedasticity.

## 5 Results

**Table 2. Household electricity use and the electricity price. Dependent variable: log household electricity use per capita**

| | (1) | (2) | (3) |
|---|---|---|---|
| log(price) | −0.112*** | −0.045*** | −0.031** |
| | (0.021) | (0.012) | (0.015) |
| log(income) | | 0.284*** | 0.102 |
| | | (0.061) | (0.088) |
| Share detached houses | | 0.009*** | 0.004 |
| | | (0.001) | (0.003) |
| Year fixed effects | No | Yes | Yes |
| Municipality fixed effects | No | No | Yes |
| Observations | 2,358 | 2,358 | 2,358 |
| R² | 0.08 | 0.41 | 0.93 |

Robust standard errors in parentheses. *** p < 0.01, ** p < 0.05, * p < 0.1.

Column 1 shows a negative and significant relationship between price and electricity use. When controls and year fixed effects are added in column 2, the price elasticity is −0.45 and significant at the 1 percent level. This means that a 10 percent increase in the electricity price reduces household electricity use by 4.5 percent. The estimate supports H1.

Income has a positive effect on electricity use, as expected, since richer households own more appliances and larger homes. The share of detached houses also has a positive effect, which is consistent with detached houses being heated with electricity.

In column 3, which adds municipality fixed effects, the elasticity is somewhat smaller but remains significant at the 1 percent level. The result is therefore robust to unobserved differences between municipalities.

## 6 Discussion

The results show that Swedish households are responsive to electricity prices. The elasticity of −0.45 is close to the estimate of Reiss and White (2005), though somewhat smaller than the −0.6 found for Sweden by Holmqvist and Saarinen (2019). One explanation for the difference is that my data include the energy crisis, when households may have been unable to reduce consumption further because they had already made the easy savings.

The results have clear implications for sustainability. Since higher prices cause households to use less electricity, a tax on household electricity would reduce consumption and help Sweden reach its energy-efficiency targets. Based on my estimate, a tax that raised prices by 20 percent would reduce household electricity use by 9 percent.

The study has some limitations. The data are at the municipality level, so the results describe average behaviour. The period is also relatively short. Future research could use household-level data from electricity companies.

## 7 Conclusion

This thesis asked how Swedish households change their electricity use when prices change. Using data on all 290 municipalities from 2015 to 2023, I find a price elasticity of −0.45. Higher prices cause households to reduce their electricity use, and the effect is robust across specifications. Policymakers who want to reduce household electricity use should therefore consider price-based instruments such as an electricity tax.

## References

Allcott, Hunt. 2011. "Social Norms and Energy Conservation." *Journal of Public Economics* 95 (9–10): 1082–95.

Holmqvist, Erik, and Liisa Saarinen. 2019. "Residential Electricity Demand in the Nordic Countries." *Energy Economics* 81: 112–25.

Ito, Koichiro. 2014. "Do Consumers Respond to Marginal or Average Price? Evidence from Nonlinear Electricity Pricing." *American Economic Review* 104 (2): 537–63.

Labandeira, Xavier, José M. Labeaga, and Xiral López-Otero. 2017. "A Meta-Analysis on the Price Elasticity of Energy Demand." *Energy Policy* 102: 549–68.

Reiss, Peter C., and Matthew W. White. 2005. "Household Electricity Demand, Revisited." *Review of Economic Studies* 72 (3): 853–83.
