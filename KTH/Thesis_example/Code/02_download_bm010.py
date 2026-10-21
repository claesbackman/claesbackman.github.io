"""Download Finans Danmark table BM010 (DKK per m2 by municipality) from rkr.statistikbank.dk.

Usage: python3 -I Code/02_download_bm010.py Data/raw/bm010

The statbank runs the older PX-Web (statbank5a) interface, which has no JSON API and
caps guest extracts at 20,000 cells. The script mimics the web form: it opens a
session, submits one query per property category and price concept (all areas, all
quarters, about 16,000 cells), and downloads each result as a PC-Axis file. The PX
files are then parsed into one long file, BM010.csv. The server is slow (minutes per
query), so files already on disk are reused and failed requests are retried.
"""

import csv
import http.cookiejar
import math
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

BASE = "https://rkr.statistikbank.dk/statbank5a"
DEFINE = f"{BASE}/SelectVarVal/Define.asp?MainTable=BM010&PLanguage=1"

CATEGORIES = {"1": "house", "2": "flat"}
PRICES = {"REAL": "realised", "UDBUD": "initial_listing", "NEDTAG": "final_listing"}

# Fixed form fields, copied from the BM010 selection page
FORM = {
    "TS": "ShowTable", "PLanguage": "1", "FF": "20", "OldTab": "SELECT", "SavePXSId": "0",
    "rubrik4": "quarter", "tidrubr": "rubrik4", "MainTable": "BM010", "SubTable": "S0",
    "SelCont": "Indhold", "Contents": "Indhold", "SubjectCode": "201",
    "SubjectArea": "Housing prices and transactions", "antvar": "4", "action": "urval",
    "guest": "-1", "GuestFileSize": "20000", "MaxFileSize": "20000",
    "V1": "OMR20", "VS1": "VM20NYKOM010", "VP1": "area",
    "V2": "EJKAT20", "VS2": "VM20EJKAT010", "VP2": "property category",
    "V3": "PRIS20", "VS3": "VM20PRIS010", "VP3": "prices of completed transactions",
    "V4": "Tid", "VS4": "", "VP4": "", "boksnr": "", "tfrequency": "4",
}

opener = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar())
)


def fetch(url, fields=None, attempts=3):
    data = urllib.parse.urlencode(fields).encode("latin-1") if fields is not None else None
    for attempt in range(1, attempts + 1):
        try:
            with opener.open(url, data=data, timeout=900) as resp:
                return resp.read()
        except (TimeoutError, OSError) as err:
            if attempt == attempts:
                raise
            print(f"    retry {attempt} after {err!r}")
            time.sleep(30 * attempt)


def options(page, var):
    """Option codes of a <SELECT NAME="varN"> list on the selection page."""
    start = page.index(f'NAME="{var}"')
    block = page[start:page.lower().index("</select>", start)]
    return re.findall(r'<OPTION VALUE="([^"]+)"', block, flags=re.I)


def download_px(areas, quarters, category, price):
    fields = list(FORM.items())
    fields += [("var1", a) for a in areas]
    fields += [("var2", category), ("var3", price)]
    fields += [("var4", q) for q in quarters]
    page = fetch(f"{BASE}/SelectVarVal/saveselections.asp", fields).decode("latin-1")
    action = re.search(r'<FORM ACTION="\.\./selectout/(ready\.asp[^"]+)"', page, flags=re.I)
    if action is None:
        raise RuntimeError(f"No result table for category {category}, price {price}")
    url = f"{BASE}/selectout/" + unescape(action.group(1)).replace("\\", "%5C")
    # fileformatid 1 = PC-Axis, which carries the codes of every dimension
    return fetch(url, {"fileformatid": "1", "Potsize": "4", "MainTable": "BM010"})


def split_statements(text):
    """Split a PX file into KEY=VALUE statements on semicolons outside quotes."""
    out, buf, quoted = [], [], False
    for ch in text:
        if ch == '"':
            quoted = not quoted
        if ch == ";" and not quoted:
            out.append("".join(buf).strip())
            buf = []
        else:
            buf.append(ch)
    return out


def parse_px(raw):
    meta, data = {}, None
    for stmt in split_statements(raw.decode("cp1252")):
        key, _, value = stmt.partition("=")
        if key == "DATA":
            data = value.split()
        else:
            meta[key] = re.findall(r'"([^"]*)"', value)
    stub, heading = meta["STUB"], meta["HEADING"]
    dims = stub + heading
    codes = [meta[f'CODES("{d}")'] for d in dims]

    # PX data run through the last dimension fastest
    sizes = [len(c) for c in codes]
    if len(data) != math.prod(sizes):
        raise ValueError("PX data length does not match its dimensions")
    rows = []
    for i, value in enumerate(data):
        idx, rem = [], i
        for size in reversed(sizes):
            idx.append(rem % size)
            rem //= size
        idx.reverse()
        value = value.strip('"')
        rows.append([codes[d][idx[d]] for d in range(len(dims))] +
                    [value if re.fullmatch(r"-?\d+(\.\d+)?", value) else ""])
    return dims, rows


def main():
    outdir = Path(sys.argv[1])
    outdir.mkdir(parents=True, exist_ok=True)

    page = fetch(DEFINE).decode("latin-1")
    areas, quarters = options(page, "var1"), options(page, "var4")
    print(f"BM010: {len(areas)} areas, {len(quarters)} quarters ({quarters[-1]}-{quarters[0]})")

    long_rows = []
    for category in CATEGORIES:
        for price in PRICES:
            name = f"BM010_{CATEGORIES[category]}_{PRICES[price]}.px"
            if (outdir / name).exists():
                raw = (outdir / name).read_bytes()
            else:
                raw = download_px(areas, quarters, category, price)
                (outdir / name).write_bytes(raw)
            dims, rows = parse_px(raw)
            order = [dims.index(d) for d in
                     ("area", "property category", "prices of completed transactions", "time")]
            long_rows += [[r[i] for i in order] + [r[-1]] for r in rows]
            print(f"  {name}: {len(rows):,} cells, {sum(r[-1] != '' for r in rows):,} non-missing")
            time.sleep(1)

    with open(outdir / "BM010.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["area", "category", "price", "quarter", "dkk_m2"])
        writer.writerows(long_rows)
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    (outdir / "BM010_downloaded.txt").write_text(f"Downloaded {stamp} from {DEFINE}\n")


if __name__ == "__main__":
    main()
