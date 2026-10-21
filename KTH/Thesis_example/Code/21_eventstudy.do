* 21_eventstudy.do
* Event study of house prices on resident AI exposure (research plan, Section 5.2):
*   ln P_mt = a_m + d_{p(m),t} + sum_{k != 2022q3} b_k E_m 1[t = k] + X_m x quarter + e_mt
* Three specifications: national quarter effects, province-by-quarter effects, and
* province-by-quarter effects plus baseline controls interacted with quarter.
* Run from the project root after 10_ and 11_: stata-se -b do Code/21_eventstudy.do

clear all
set more off
version 18
set scheme stcolor

local controls ln_price19 ln_inc19 tertiary dti equity ln_density flatshare ln_dist_cph
local ref = tq(2022q3)

use "Data/clean/prices_panel.dta", clear
merge m:1 kom using "Data/clean/muni_baseline.dta", assert(match) ///
    keepusing(E prov `controls') nogenerate
keep if inrange(tq, tq(2015q1), tq(2026q2))

* Exposure x quarter interactions, 2022Q3 omitted
levelsof tq, local(quarters)
foreach q of local quarters {
    if `q' != `ref' {
        generate double ex`q' = E * (tq == `q')
    }
}

local ctrl_slopes
foreach v of local controls {
    local ctrl_slopes `ctrl_slopes' i.tq#c.`v'
}

eststo clear
eststo nat: reghdfe ln_p_house_real ex*, absorb(kom tq) vce(cluster kom)
eststo prov: reghdfe ln_p_house_real ex*, absorb(kom i.prov#i.tq) vce(cluster kom)
eststo ctrl: reghdfe ln_p_house_real ex*, absorb(kom i.prov#i.tq `ctrl_slopes') vce(cluster kom)

* Coefficients for the figure
tempname pf
postfile `pf' str4 model int tq double(b se) using "Data/clean/eventstudy_coefs.dta", replace
foreach m in nat prov ctrl {
    estimates restore `m'
    foreach q of local quarters {
        if `q' == `ref' {
            post `pf' ("`m'") (`q') (0) (0)
        }
        else {
            post `pf' ("`m'") (`q') (_b[ex`q']) (_se[ex`q'])
        }
    }
}
postclose `pf'

* Average coefficients over periods, with clustered standard errors
local p1 "2015q1 2019q4 2015-2019"
local p2 "2020q1 2022q2 2020-2022Q2"
local p3 "2022q4 2023q4 2022Q4-2023"
local p4 "2024q1 2026q2 2024-2026Q2"
file open st using "Tables/eventstudy_periods.tex", write replace
file write st "\begin{tabular}{lccc}" _n "\toprule" _n
file write st " & (1) & (2) & (3) \\" _n "\midrule" _n
display _n %-16s "Period" %22s "National" %22s "Province" %22s "Province+controls"
forvalues i = 1/4 {
    tokenize `p`i''
    local lo = tq(`1')
    local hi = tq(`2')
    local expr
    local n 0
    foreach q of local quarters {
        if inrange(`q', `lo', `hi') & `q' != `ref' {
            local expr = cond("`expr'" == "", "ex`q'", "`expr' + ex`q'")
            local ++n
        }
    }
    local row "`3'"
    local serow ""
    local show "`3'"
    foreach m in nat prov ctrl {
        estimates restore `m'
        quietly lincom (`expr') / `n'
        local stars = cond(r(p) < 0.01, "\sym{***}", cond(r(p) < 0.05, "\sym{**}", ///
            cond(r(p) < 0.10, "\sym{*}", "")))
        local row = "`row' & " + string(r(estimate), "%6.3f") + "`stars'"
        local serow = "`serow' & (" + string(r(se), "%5.3f") + ")"
        local show = "`show'  " + string(r(estimate), "%7.4f") + " (" + string(r(se), "%6.4f") + ")"
    }
    file write st "`row' \\" _n "`serow' \\" _n
    display "`show'"
}
file write st "\midrule" _n
file write st "Municipality FE & Yes & Yes & Yes \\" _n
file write st "Quarter FE & Yes & & \\" _n
file write st "Province $\times$ quarter FE & & Yes & Yes \\" _n
file write st "Baseline controls $\times$ quarter & & & Yes \\" _n
* Bornholm is the only municipality in its province, so province-by-quarter effects
* absorb it and reghdfe drops it as a singleton. Report the counts actually used.
foreach stat in N N_clust {
    file write st (cond("`stat'" == "N", "Observations", "Municipalities"))
    foreach m in nat prov ctrl {
        estimates restore `m'
        file write st " & " %6.0fc (e(`stat'))
    }
    file write st " \\" _n
}
file write st "\bottomrule" _n "\end{tabular}" _n
file close st

* Figure: province-by-quarter specifications with 95 percent confidence intervals
use "Data/clean/eventstudy_coefs.dta", clear
format tq %tq
generate lo = b - 1.96 * se
generate hi = b + 1.96 * se
* Shift the controlled series slightly so the two sets of intervals stay readable
generate tq_c = tq + 0.25
twoway (rarea lo hi tq if model == "prov", color("49 130 189%25") lwidth(none)) ///
       (rcap lo hi tq_c if model == "ctrl", lcolor("230 85 13%60") lwidth(thin)) ///
       (line b tq if model == "nat", lcolor(gs10) lpattern(dash) lwidth(medium)) ///
       (connected b tq if model == "prov", lcolor("8 69 148") mcolor("8 69 148") ///
           msize(vsmall) lwidth(medthick)) ///
       (scatter b tq_c if model == "ctrl", mcolor("230 85 13") msize(small) msymbol(D)), ///
    xline(`=tq(2022q4)', lpattern(dash) lcolor(gs8)) yline(0, lcolor(gs12)) ///
    xlabel(`=tq(2015q1)'(8)`=tq(2026q1)', format(%tqCY)) xtitle("") ///
    ytitle("Coefficient on exposure (log points per SD)") ///
    legend(order(3 "Quarter FE" 4 "Province × quarter FE" ///
                 5 "+ baseline controls × quarter") rows(1) position(6) size(small)) ///
    note("Coefficients on standardized resident AI exposure interacted with quarter, 2022Q3 = 0." ///
         "Shaded area and caps: 95 percent confidence intervals, clustered by municipality." ///
         "Dashed vertical line: release of ChatGPT (2022Q4).", size(vsmall))
graph export "Figures/eventstudy.png", width(2400) replace
