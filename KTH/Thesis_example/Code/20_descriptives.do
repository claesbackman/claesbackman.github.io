* 20_descriptives.do
* Phase 1 first look (research plan, Section 7): variation in exposure, map, balance
* table, raw house price paths by exposure tercile, and long-difference regressions.
* Run from the project root after 10_ and 11_: stata-se -b do Code/20_descriptives.do

clear all
set more off
version 18
set scheme stcolor

local controls ln_price19 ln_inc19 tertiary dti equity ln_density flatshare ln_dist_cph
* Copenhagen, Frederiksberg, Aarhus, Odense, Aalborg, Gentofte
local cities "inlist(kom, 101, 147, 751, 461, 851, 157)"

*-------------------------------------------------------------------------------
* 1. How much does exposure vary across municipalities?
*-------------------------------------------------------------------------------
use "Data/clean/muni_baseline.dta", clear
local versions e25_res e25_ind_res e25_skill_res e25_work e23_res
tabstat `versions', statistics(mean sd p10 p50 p90 min max) columns(statistics) format(%6.3f)
correlate `versions'

estpost tabstat `versions', statistics(mean sd p10 p50 p90 min max) columns(statistics)
esttab using "Tables/exposure_variation.tex", replace booktabs label nonumber noobs mlabels(none) ///
    cells("mean(fmt(3)) sd(fmt(3)) p10(fmt(3)) p50(fmt(3)) p90(fmt(3)) min(fmt(3)) max(fmt(3))") ///
    collabels("Mean" "SD" "P10" "P50" "P90" "Min" "Max")

* Major-group scores used to build the cells
preserve
use "Data/clean/exposure_groups.dta", clear
reshape wide e25 e23 aug23 auto23, i(g) j(sector) string
local names `""Managers" "Professionals" "Technicians and associate professionals" "Clerical support workers" "Service and sales workers" "Skilled agricultural workers" "Craft and related trades workers" "Plant and machine operators" "Elementary occupations""'
file open gt using "Tables/group_scores.tex", write replace
file write gt "\begin{tabular}{lccccc}" _n "\toprule" _n
file write gt " & \multicolumn{2}{c}{ILO 2025 score} & ILO 2023 score & \multicolumn{2}{c}{ILO 2023 share (private)} \\" _n
file write gt "\cmidrule(lr){2-3} \cmidrule(lr){4-4} \cmidrule(lr){5-6}" _n
file write gt "DISCO major group & Private & Public & Private & Augmentation & Automation \\" _n "\midrule" _n
forvalues i = 1/9 {
    local nm : word `i' of `names'
    file write gt "`i'. `nm' & " %4.2f (e25priv[`i']) " & " %4.2f (e25pub[`i']) " & " ///
        %4.2f (e23priv[`i']) " & " %4.2f (aug23priv[`i']) " & " %4.2f (auto23priv[`i']) " \\" _n
}
file write gt "\bottomrule" _n "\end{tabular}" _n
file close gt
restore

gsort -e25_res
display _n "Most exposed municipalities"
list name e25_res e25_ind_res e25_skill_res tertiary in 1/10, noobs
display _n "Least exposed municipalities"
list name e25_res e25_ind_res e25_skill_res tertiary in -10/l, noobs

*-------------------------------------------------------------------------------
* 2. Map
*-------------------------------------------------------------------------------
preserve
import delimited using "Data/clean/muni_coords.csv", varnames(1) case(preserve) clear
* stable keeps the vertex order within each municipality
sort _ID, stable
save "Data/clean/muni_coords.dta", replace
restore
sort kom
* spmap labels the legend with the variable's display format
format e25_res %4.3f
spmap e25_res using "Data/clean/muni_coords.dta", id(kom) clmethod(quantile) clnumber(5) ///
    fcolor(Blues) ocolor(gs11 ..) osize(vthin ..) ///
    legend(position(5) ring(0) size(small)) legtitle("ILO 2025 score") legstyle(2) ///
    note("Exposure of employed residents, 2017-2019 employment shares. Quintiles." ///
         "Bornholm is moved north-west.", size(vsmall))
graph export "Figures/map_exposure.png", width(2400) replace

*-------------------------------------------------------------------------------
* 3. Balance table: baseline characteristics by exposure
*-------------------------------------------------------------------------------
xtile tercile = E, nquantiles(3)
local balance ln_price19 pregrowth pti ln_inc19 tertiary dti equity ln_density flatshare ln_dist_cph
file open bt using "Tables/balance.tex", write replace
file write bt "\begin{tabular}{lccccc}" _n "\toprule" _n
file write bt " & Mean & SD & Low exposure & High exposure & Correlation \\" _n
file write bt " & & & (bottom tercile) & (top tercile) & with exposure \\" _n "\midrule" _n
display _n %-48s "Variable" %9s "Mean" %9s "SD" %9s "Low" %9s "High" %9s "Corr"
foreach v of local balance {
    quietly summarize `v'
    local m = r(mean)
    local s = r(sd)
    quietly summarize `v' if tercile == 1
    local lo = r(mean)
    quietly summarize `v' if tercile == 3
    local hi = r(mean)
    quietly correlate `v' E
    local r = r(rho)
    local lab : variable label `v'
    file write bt "`lab' & " %6.2f (`m') " & " %6.2f (`s') " & " %6.2f (`lo') " & " ///
        %6.2f (`hi') " & " %5.2f (`r') " \\" _n
    display %-48s "`lab'" %9.2f `m' %9.2f `s' %9.2f `lo' %9.2f `hi' %9.2f `r'
}
file write bt "\bottomrule" _n "\end{tabular}" _n
file close bt

keep kom name E tercile
tempfile cs
save `cs'

*-------------------------------------------------------------------------------
* 4. Raw house price paths by exposure tercile, relative to 2022Q3
*-------------------------------------------------------------------------------
use "Data/clean/prices_panel.dta", clear
merge m:1 kom using `cs', assert(match) nogenerate
keep if tq >= tq(2015q1)
generate base = ln_p_house_real if tq == tq(2022q3)
bysort kom (base): replace base = base[1]
generate rel = ln_p_house_real - base
collapse (mean) rel, by(tercile tq)
twoway (line rel tq if tercile == 1, lwidth(medthick) lcolor("158 202 225")) ///
       (line rel tq if tercile == 2, lwidth(medthick) lcolor("66 146 198")) ///
       (line rel tq if tercile == 3, lwidth(medthick) lcolor("8 69 148")), ///
    xline(`=tq(2022q4)', lpattern(dash) lcolor(gs8)) yline(0, lcolor(gs12)) ///
    legend(order(3 "High exposure" 2 "Middle" 1 "Low exposure") rows(1) position(6)) ///
    ytitle("Log house price per m{superscript:2}, relative to 2022Q3") xtitle("") ///
    xlabel(`=tq(2015q1)'(8)`=tq(2026q1)', format(%tqCY)) ///
    note("Unweighted means across municipalities in each tercile of resident AI exposure." ///
         "Dashed line: release of ChatGPT (2022Q4).", size(vsmall))
graph export "Figures/prices_by_tercile.png", width(2400) replace

*-------------------------------------------------------------------------------
* 5. Long differences: price growth from the year before ChatGPT to the latest year
*-------------------------------------------------------------------------------
use "Data/clean/prices_panel.dta", clear
generate window = 1 if inrange(tq, tq(2021q4), tq(2022q3))
replace window = 2 if inrange(tq, tq(2025q3), tq(2026q2))
replace window = 3 if inrange(tq, tq(2014q4), tq(2015q3))
replace window = 4 if inrange(tq, tq(2018q4), tq(2019q3))
drop if missing(window)
collapse (mean) ln_p_house_real ln_p_flat_real, by(kom window)
reshape wide ln_p_house_real ln_p_flat_real, i(kom) j(window)
generate dp_house = ln_p_house_real2 - ln_p_house_real1
generate dp_flat = ln_p_flat_real2 - ln_p_flat_real1
generate dp_house_pre = ln_p_house_real4 - ln_p_house_real3
keep kom dp_*
label variable dp_house "Houses, 2022Q3 to 2026Q2"
label variable dp_flat "Flats, 2022Q3 to 2026Q2"
label variable dp_house_pre "Houses, 2015Q3 to 2019Q3 (placebo)"
merge 1:1 kom using "Data/clean/muni_baseline.dta", assert(match) nogenerate
save "Data/clean/longdiff.dta", replace
summarize dp_house dp_flat dp_house_pre

generate lab = name if `cities'
* Labels to the left of the dot for the most exposed suburbs at the right edge
generate byte labpos = cond(E > 2, 9, 3)
twoway (scatter dp_house E, msize(small) mcolor("49 130 189") mlabel(lab) mlabsize(vsmall) ///
           mlabvposition(labpos) mlabcolor(gs4)) ///
       (lfit dp_house E, lwidth(medthick) lcolor("8 69 148")), ///
    legend(off) xtitle("AI exposure of residents (standardized)") xscale(range(-1.8 2.8)) ///
    ytitle("House price growth, log points") ///
    note("Growth from the mean of 2021Q4-2022Q3 to the mean of 2025Q3-2026Q2." ///
         "One dot per municipality (98).", size(vsmall))
graph export "Figures/longdiff_scatter.png", width(2400) replace

eststo clear
eststo: regress dp_house E, vce(robust)
eststo: regress dp_house E pregrowth, vce(robust)
* Same specification as the placebo in the last column
eststo: regress dp_house E i.prov, vce(robust)
eststo: regress dp_house E pregrowth `controls', vce(robust)
eststo: regress dp_house E pregrowth `controls' i.prov, vce(robust)
eststo: regress dp_house E pregrowth `controls' i.prov if !inlist(kom, 101, 147), vce(robust)
eststo: regress dp_flat E pregrowth `controls' i.prov, vce(robust)
eststo: regress dp_house_pre E, vce(robust)
eststo: regress dp_house_pre E i.prov, vce(robust)

local opts keep(E pregrowth) order(E pregrowth) ///
    indicate("Baseline controls = ln_price19" "Province FE = *.prov") ///
    b(3) se(3) star(* 0.10 ** 0.05 *** 0.01) label ///
    mtitles("Houses" "Houses" "Houses" "Houses" "Houses" "Excl. Cph" "Flats" "Placebo" "Placebo") ///
    stats(N r2, fmt(0 2) labels("Municipalities" "R-squared"))
esttab, `opts'
* Notes go in the paper's table environment
esttab using "Tables/longdiff.tex", `opts' booktabs nonotes replace
