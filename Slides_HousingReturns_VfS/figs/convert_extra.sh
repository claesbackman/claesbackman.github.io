#!/bin/sh
# Convert the additional paper figures this deck uses beyond ../2026_4_Explorable/figs.
# Uses pdftocairo (poppler), which is installed, instead of pymupdf. Text becomes
# glyph paths, so no fonts are needed. Run from anywhere; then restyle_figs.py.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
SRC="$HERE/../../../Figures"
for n in Fig_reg_GeoLvl Fig_reg_GeoLvl_time Fig_Returns_Cph RentalYield1999_AvgReturn \
         NA_Aggregate_Yield TotalReturn_IncRank Fig_MaximumPurchasePrice Share_Amortized \
         Map_HousingSupply Fig_WealthComponents Fig_MunReturns_Rank Sharebuyers_urbanization \
         HousePriceGrowth SalesTimes_rank Transactions_rank Fig_PortfolioDecomposition_Totals \
         Fig_Reg_ImputedReturns Fig_FE_regressions; do
  pdftocairo -svg "$SRC/$n.pdf" "$HERE/$n.svg"
  echo "  $n.svg"
done
python3 "$HERE/restyle_figs.py" >/dev/null
echo "recoloured"
