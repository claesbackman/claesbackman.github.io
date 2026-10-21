* 11_build_panel.do
* Builds (a) the quarterly municipality price panel from Finans Danmark BM010 and
* (b) a cross-section of 2019 municipality characteristics for the balance table and
* the long-difference regressions.
* Run from the project root: stata-se -b do Code/11_build_panel.do

clear all
set more off
version 18
do "Code/00_programs.do"

*-------------------------------------------------------------------------------
* (a) Quarterly price panel, DKK per m2
*-------------------------------------------------------------------------------
import delimited using "Data/raw/bm010/BM010.csv", varnames(1) stringcols(1 2 3 4) clear
gen_kom area
generate tq = quarterly(subinstr(quarter, "K", "q", 1), "YQ")
format tq %tq
generate str12 series = cond(category == "1", "house", "flat") + "_" + ///
    cond(price == "REAL", "real", cond(price == "NEDTAG", "list", "init"))
keep kom tq series dkk_m2
reshape wide dkk_m2, i(kom tq) j(series) string
rename dkk_m2* p_*
foreach v of varlist p_* {
    generate ln_`v' = ln(`v')
}
label variable p_house_real "Houses, realised price (DKK/m2)"
label variable p_house_list "Houses, final listing price (DKK/m2)"
label variable p_house_init "Houses, initial listing price (DKK/m2)"
label variable p_flat_real "Owner-occupied flats, realised price (DKK/m2)"
label variable p_flat_list "Owner-occupied flats, final listing price (DKK/m2)"
label variable p_flat_init "Owner-occupied flats, initial listing price (DKK/m2)"
xtset kom tq
save "Data/clean/prices_panel.dta", replace

*-------------------------------------------------------------------------------
* (b) 2019 municipality characteristics
*-------------------------------------------------------------------------------
* Prices: 2019 level and pre-period growth (annual means of quarterly log prices)
use "Data/clean/prices_panel.dta", clear
generate year = year(dofq(tq))
collapse (mean) ln_p_house_real ln_p_flat_real, by(kom year)
keep if inlist(year, 2015, 2019)
reshape wide ln_p_house_real ln_p_flat_real, i(kom) j(year)
generate ln_price19 = ln_p_house_real2019
generate pregrowth = ln_p_house_real2019 - ln_p_house_real2015
keep kom ln_price19 pregrowth
tempfile base
save `base'

* Population (1 January 2019) and land area
import_dst FOLK1A
keep if tid == "2019K1"
gen_kom område
rename value pop19
keep kom pop19
merge 1:1 kom using `base', assert(match) nogenerate
save `base', replace

import_dst ARE207
keep if tid == "2019"
gen_kom område
keep kom value
merge 1:1 kom using `base', assert(match) nogenerate
generate ln_density = ln(pop19 / value)
drop value
save `base', replace

* Average disposable income per person
import_dst INDKP101
keep if tid == "2019" & indkomsttype == "100"
gen_kom område
rename value inc19
keep kom inc19
merge 1:1 kom using `base', assert(match) nogenerate
generate ln_inc19 = ln(inc19)
generate pti = ln_price19 - ln_inc19
save `base', replace

* Share of 15-69 year olds with a tertiary degree
import_dst HFUDD11
keep if tid == "2019"
gen_kom bopomr
generate byte tertiary = hfudd != "TOT"
collapse (sum) value, by(kom tertiary)
reshape wide value, i(kom) j(tertiary)
generate tertiary = value1 / (value0 + value1)
keep kom tertiary
merge 1:1 kom using `base', assert(match) nogenerate
save `base', replace

* Wealth per adult (averages): mortgage debt and equity holdings relative to income
import_dst FORMUE12
keep if tid == "2019" & enhed == "235"
gen_kom område
keep kom form1 value
reshape wide value, i(kom) j(form1) string
merge 1:1 kom using `base', assert(match) nogenerate
generate dti = valueFGD / inc19
generate equity = (valueFGB3 + valueFGB4) / inc19
drop value*
save `base', replace

* Share of occupied dwellings in multi-dwelling buildings
import_dst BOL101
keep if tid == "2019"
gen_kom område
generate byte multi = anvendelse == "140"
collapse (sum) value, by(kom multi)
reshape wide value, i(kom) j(multi)
generate flatshare = value1 / (value0 + value1)
keep kom flatshare
merge 1:1 kom using `base', assert(match) nogenerate
save `base', replace

* Geography
import delimited using "Data/clean/muni_geo.csv", varnames(1) stringcols(3 4) encoding("utf-8") clear
drop if kom == 411
merge 1:1 kom using `base', assert(match) nogenerate
generate ln_dist_cph = ln(dist_cph)
generate ln_dist_aarhus = ln(dist_aarhus)
encode province, generate(prov)

label variable ln_price19 "Log house price per m2, 2019"
label variable pregrowth "House price growth 2015-2019 (log points)"
label variable ln_inc19 "Log disposable income per person, 2019"
label variable pti "Log price per m2 minus log income"
label variable tertiary "Tertiary education share, 15-69"
label variable dti "Mortgage debt / disposable income"
label variable equity "Listed shares and funds / disposable income"
label variable ln_density "Log population density"
label variable flatshare "Share of dwellings in multi-dwelling buildings"
label variable ln_dist_cph "Log distance to Copenhagen (km)"
label variable ln_dist_aarhus "Log distance to Aarhus (km)"
label variable pop19 "Population, 1 January 2019"

merge 1:1 kom using "Data/clean/exposure_muni.dta", assert(match) nogenerate
save "Data/clean/muni_baseline.dta", replace
summarize
