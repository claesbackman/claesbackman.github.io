"""Download external inputs: ILO generative AI exposure scores and municipality boundaries.

Usage: python3 -I Code/03_download_external.py Data/raw

ILO: Gmyrek et al. (2025), ILO Working Paper 140, task and occupation scores for ISCO-08
4-digit occupations (CC BY 4.0), from github.com/pgmyrek/2025_GenAI_scores_ISCO08.
Boundaries: GADM 4.1, Denmark level 2 (municipalities), free for academic use but not
for redistribution, which is one reason Data/ is not committed.
"""

import io
import sys
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ILO_REPO = "https://raw.githubusercontent.com/pgmyrek/2025_GenAI_scores_ISCO08/main"
ILO_FILES = ["Final_Scores_ISCO08_Gmyrek_et_al_2025.xlsx", "DATA_DICTIONARY.md", "README.md", "LICENSE"]
GADM = "https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_DNK_2.json.zip"


def get(url):
    with urllib.request.urlopen(url, timeout=300) as resp:
        return resp.read()


def main():
    raw = Path(sys.argv[1])
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")

    ilo = raw / "ilo"
    ilo.mkdir(parents=True, exist_ok=True)
    for name in ILO_FILES:
        (ilo / name).write_bytes(get(f"{ILO_REPO}/{name}"))
    (ilo / "downloaded.txt").write_text(f"Downloaded {stamp} from {ILO_REPO}\n")
    print(f"ILO scores -> {ilo}")

    geo = raw / "geo"
    geo.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(get(GADM))) as z:
        z.extract("gadm41_DNK_2.json", geo)
    (geo / "downloaded.txt").write_text(f"Downloaded {stamp} from {GADM}\n")
    print(f"GADM boundaries -> {geo}")


if __name__ == "__main__":
    main()
