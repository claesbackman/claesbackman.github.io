* 10_build_exposure.do
* Municipality exposure to generative AI, built from the ILO (Gmyrek et al. 2025)
* occupation scores through Danish public tables (research plan, Section 4):
*   1. ILO scores for ISCO-08 4-digit occupations
*   2. DISCO major-group scores, weighted by Danish full-time employment (LONS20),
*      separately for private firms and general government
*   3. Industry-by-skill-level cell scores from the occupation mix within industries
*      (FRA029 for private industries, FRA020 for public administration, education, health)
*   4. Municipality exposure: cell scores weighted by the 2017-2019 employment shares of
*      residents (RAS302, baseline) or of jobs located in the municipality (RAS301)
* Run from the project root: stata-se -b do Code/10_build_exposure.do

clear all
set more off
version 18
do "Code/00_programs.do"

local scores e25 e23 aug23 auto23

*-------------------------------------------------------------------------------
* 1. ILO occupation scores, one row per ISCO-08 4-digit occupation
*-------------------------------------------------------------------------------
import excel using "Data/raw/ilo/Final_Scores_ISCO08_Gmyrek_et_al_2025.xlsx", firstrow clear
keep ISCO_08 mean_score_2025 mean_score_2023 potential23
duplicates drop ISCO_08, force
tostring ISCO_08, replace
generate str4 isco4 = substr("000" + strtrim(ISCO_08), -4, .)
generate e25 = mean_score_2025
generate e23 = mean_score_2023
generate aug23 = potential23 == "Augmentation Potential"
generate auto23 = potential23 == "Automation Potential"
label variable e25 "ILO 2025 exposure score (occupation mean of task scores)"
label variable e23 "ILO 2023 exposure score"
label variable aug23 "ILO 2023: augmentation potential"
label variable auto23 "ILO 2023: automation potential"
keep isco4 `scores'
tempfile ilo
save `ilo'

* 3-digit group means, used for Danish DISCO codes that have no ISCO-08 score
generate str3 isco3 = substr(isco4, 1, 3)
collapse (mean) `scores', by(isco3)
foreach v of local scores {
    rename `v' `v'_3d
}
tempfile ilo3
save `ilo3'

*-------------------------------------------------------------------------------
* 2. Major-group scores by sector, weighted by full-time employees 2017-2019
*-------------------------------------------------------------------------------
import_dst LONS20
keep if inlist(sektor, "1046", "1032") & inrange(real(tid), 2017, 2019)
keep if ustrregexm(arbf, "^[0-9]{4}$")
collapse (mean) n = value, by(arbf sektor)
rename arbf isco4
generate str4 sector = cond(sektor == "1046", "priv", "pub")
drop sektor

merge m:1 isco4 using `ilo', keep(master match)
generate str3 isco3 = substr(isco4, 1, 3)
merge m:1 isco3 using `ilo3', keep(master match) nogenerate
generate str9 match = cond(_merge == 3, "direct", cond(!missing(e25_3d), "3-digit", "none"))
foreach v of local scores {
    replace `v' = `v'_3d if _merge == 1
}
drop _merge *_3d

display _n "Share of full-time employment by how the ILO score was assigned"
tabulate sector match [aweight = n], row nofreq

* Codes without any score (armed forces) drop out of the weights
drop if missing(e25) | missing(n)
generate byte g = real(substr(isco4, 1, 1))
collapse (mean) `scores' [aweight = n], by(sector g)
label variable g "DISCO major group"
save "Data/clean/exposure_groups.dta", replace
list, sepby(sector) noobs

*-------------------------------------------------------------------------------
* 3. Occupation mix within industries (full-time employed, 2017-2019 average)
*-------------------------------------------------------------------------------
* Private firms by industry
import_dst FRA029
keep if inrange(real(tid), 2017, 2019) & branche07 != "TOT" & inrange(real(arbfunk), 1, 9)
collapse (mean) w = value, by(branche07 arbfunk)
generate byte g = real(arbfunk)
drop arbfunk
generate str4 sector = "priv"
* Public administration, education and health mostly employ public-sector workers.
* They take the general government mix and public-sector scores instead.
drop if inlist(branche07, "O", "P", "QA", "QB")
tempfile mix
save `mix'

import_dst FRA020
keep if sektor == "1032" & inrange(real(tid), 2017, 2019) & ustrregexm(arbf, "^[1-9]$")
collapse (mean) w = value, by(arbf)
generate byte g = real(arbf)
drop arbf
generate str4 sector = "pub"
expand 4
bysort g: generate str2 branche07 = word("O P QA QB", _n)
append using `mix'

* Agriculture is not in FRA029. Its employees and self-employed are scored as
* skilled agricultural workers (DISCO group 6).
set obs `=_N + 1'
replace branche07 = "A" in L
replace g = 6 in L
replace w = 1 in L
replace sector = "priv" in L

merge m:1 sector g using "Data/clean/exposure_groups.dta", assert(match using) keep(match) nogenerate
save `mix', replace

* Cell scores. Skill levels map to DISCO major groups (DST assigns SOCIO by the first
* digit of the DISCO code): managers 1, upper level 2, medium level 3, basic level 4-8,
* other employees 9. Self-employed, assisting spouses and employees with no stated
* level get the industry average.
local s15 "g == 1"
local s20 "g == 2"
local s25 "g == 3"
local s30 "inrange(g, 4, 8)"
local s35 "g == 9"
local s00 "inrange(g, 1, 9)"
tempfile cells
local first 1
foreach s in 15 20 25 30 35 00 {
    use `mix', clear
    keep if `s`s''
    collapse (mean) `scores' [aweight = w], by(branche07)
    generate str2 socio = "`s'"
    if !`first' append using `cells'
    save `cells', replace
    local first 0
}
* Industries where a skill level has no employees in the mix (e.g. agriculture managers)
* take the national private-sector score of that major group
fillin branche07 socio
foreach s in 15 20 25 35 {
    local g = cond("`s'" == "15", 1, cond("`s'" == "20", 2, cond("`s'" == "25", 3, 9)))
    preserve
    use "Data/clean/exposure_groups.dta", clear
    keep if sector == "priv" & g == `g'
    foreach v of local scores {
        local `v'_`s' = `v'[1]
    }
    restore
    foreach v of local scores {
        replace `v' = ``v'_`s'' if socio == "`s'" & missing(`v')
    }
}
drop _fillin
expand 4 if socio == "00"
bysort branche07 socio: replace socio = word("00 05 10 40", _n) if socio == "00"
assert !missing(e25)
label variable socio "SOCIO code in RAS (00 = industry average)"
save "Data/clean/exposure_cells.dta", replace

*-------------------------------------------------------------------------------
* 4. Municipality exposure, employment shares averaged over 2017-2019
*-------------------------------------------------------------------------------
foreach table in RAS302 RAS301 {
    import_dst `table'
    keep if inrange(real(tid), 2017, 2019)
    gen_kom område
    collapse (mean) emp = value, by(kom branche07 socio)
    merge m:1 branche07 socio using "Data/clean/exposure_cells.dta", ///
        assert(match using) keep(match) nogenerate

    * Industry-only version: every worker gets the industry average
    preserve
    use "Data/clean/exposure_cells.dta", clear
    keep if socio == "00"
    keep branche07 e25
    rename e25 e25_ind
    tempfile ind
    save `ind'
    restore
    merge m:1 branche07 using `ind', assert(match using) keep(match) nogenerate

    * Skill-only version: every cell gets the national score of its skill level
    bysort socio: egen double num = total(emp * e25)
    bysort socio: egen double den = total(emp)
    generate e25_skill = num / den
    drop num den

    collapse (mean) `scores' e25_ind e25_skill [aweight = emp], by(kom)
    local suffix = cond("`table'" == "RAS302", "res", "work")
    foreach v of varlist `scores' e25_ind e25_skill {
        rename `v' `v'_`suffix'
    }
    tempfile `suffix'
    save ``suffix''
}
use `res', clear
merge 1:1 kom using `work', assert(match) nogenerate

label variable e25_res "AI exposure, residents (ILO 2025, industry and skill level)"
label variable e25_ind_res "AI exposure, residents (industry only)"
label variable e25_skill_res "AI exposure, residents (skill level only)"
label variable e23_res "AI exposure, residents (ILO 2023)"
label variable aug23_res "Share of residents in augmentation-potential occupations (ILO 2023)"
label variable auto23_res "Share of residents in automation-potential occupations (ILO 2023)"
label variable e25_work "AI exposure, jobs in municipality (ILO 2025, industry and skill level)"

* Standardized baseline measure: mean 0, SD 1 across municipalities
summarize e25_res
generate E = (e25_res - r(mean)) / r(sd)
label variable E "AI exposure, residents (standardized)"

save "Data/clean/exposure_muni.dta", replace
summarize
