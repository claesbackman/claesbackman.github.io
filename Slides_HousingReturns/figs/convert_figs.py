"""Convert the paper's figures from PDF to SVG for the deck.

Usage:
    python Presentations/2026_4_Explorable/figs/convert_figs.py          # all
    python Presentations/2026_4_Explorable/figs/convert_figs.py Gelbach_mainresults

Reads from Figures/ at the repository root and writes figs/*.svg next to this
script. Run it from the repository root, or from anywhere — paths are resolved
relative to this file.

Reveal.js cannot display a PDF as an image, so every figure the deck uses has
to be converted. Text is converted to paths, which makes the files larger but
means the deck does not depend on the fonts the Stata figures were built with.

Re-run this after regenerating any figure in Figures/. The SVGs are build
output: do not edit them by hand.

Requires pymupdf (pip install pymupdf).
"""

import pathlib
import sys

import pymupdf

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SRC = ROOT / "Figures"

# Every figure the deck references, main slides first, then the appendix.
FIGS = [
    # main
    "Fig_Income_Fam_Age_ReturnTotal",
    "Fig_Returns_incomerank_HoldingPeriod",
    "Gelbach_mainresults",
    "TotalReturn_IncomeRanking_Coefplot",
    "ChoiceSet_Max",
    "ChoiceSet_Max_region",
    "Constraints_Binding_rank",
    "LowIncome_Regression",
    "LowIncome_IO_HP",
    "Fig_Income_Fam_GurenSensitivity_both",
    # appendix
    "Fig_HousingRisk_Rank",
    "Fig_SharpeRatio",
    "Bin_ImputedRents_IncomeRank",
    "Bin_TotalReturn_IncomeRank",
    "IRR_Regressions",
    "Fig_MaximumBorrowing_LTV",
    "Fig_MaximumBorrowing_PTI",
    "Fig_PortfolioDecomposition",
    "Fig_returns_IncomeRank_classificationRenovations",
    "Fig_Returns_IncomeRank_kom",
    "Fig_Homeowners_share",
    "HousePriceGrowth_Pricegroups_US",
    # converted but not currently on a slide, kept as ready alternatives
    "Bin_CapitalGains_IncomeRank",
    "Fig_income_ranking_Return",
]


def main(only):
    missing = []
    for name in FIGS:
        if only and name not in only:
            continue
        src = SRC / f"{name}.pdf"
        if not src.exists():
            missing.append(name)
            continue
        with pymupdf.open(src) as doc:
            svg = doc[0].get_svg_image(text_as_path=True)
        (HERE / f"{name}.svg").write_text(svg)
        print(f"  {len(svg) // 1024:>5} KB  {name}.svg")

    if missing:
        print("\nnot found in Figures/:", ", ".join(missing))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(set(sys.argv[1:])))
