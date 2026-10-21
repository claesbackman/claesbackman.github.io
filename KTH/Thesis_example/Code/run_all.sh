#!/bin/bash
# Rebuilds the analysis from scratch: downloads, exposure measure, panel, descriptives, event study.
# Usage (from the project root): bash Code/run_all.sh
# The Finans Danmark download takes 10-20 minutes because the server is slow.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 -I Code/01_download_dst.py Data/raw/dst
python3 -I Code/02_download_bm010.py Data/raw/bm010
python3 -I Code/03_download_external.py Data/raw
python3 -I Code/04_build_geo.py Data/raw Data/clean

mkdir -p Code/logs
for step in 10_build_exposure 11_build_panel 20_descriptives 21_eventstudy; do
    stata-se -b do "Code/${step}.do"
    mv "${step}.log" Code/logs/
    if grep -q '^r([0-9]*);' "Code/logs/${step}.log"; then
        echo "Stata error in ${step}, see Code/logs/${step}.log"
        exit 1
    fi
done
echo "Done. Figures/ and Tables/ are updated."
