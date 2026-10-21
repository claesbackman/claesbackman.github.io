"""Download Statistics Denmark tables through the StatBank API (api.statbank.dk).

Usage: python3 -I Code/01_download_dst.py Data/raw/dst

Each table is saved as <TABLE>.csv (semicolon separated, codes rather than labels)
together with <TABLE>_meta.json, which holds the table metadata, the query and the
download time. Variables left out of a query are summed by the API (elimination).
Elimination is not available in the streaming BULK format, so queries use CSV, which
is capped at 1,000,000 cells per request (eliminated variables count towards the cap).
Tables listed in SPLIT_BY_YEAR are therefore requested one year at a time.
"""

import json
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API = "https://api.statbank.dk/v1"

ALL = ["*"]

# Table -> {variable: values}. Omitted variables are eliminated (summed).
QUERIES = {
    # Employment by residence (baseline exposure weights) and by workplace
    "RAS302": {"OMRÅDE": ALL, "BRANCHE07": ALL, "SOCIO": ALL, "Tid": ALL},
    "RAS301": {"OMRÅDE": ALL, "BRANCHE07": ALL, "SOCIO": ALL, "Tid": ALL},
    # Commuting matrix: residence municipality x workplace municipality
    "PEND100": {"BOPKOM": ALL, "ARBEJDSSTED": ALL, "Tid": ALL},
    # Occupation mix within private-sector industries (full-time employed, indicator 70).
    # Full-time employment does not vary with the cause of absence, so one cause is kept.
    "FRA029": {"BRANCHE07": ALL, "ARBFUNK": ALL, "KØN": ["0"], "STRGRUPIPR": ["00"],
               "FRAVAER1": ["70"], "FRAVAER": ["1100"], "Tid": ALL},
    # Occupation mix by sector, DISCO 2-digit (general government mix for public industries)
    "FRA020": {"SEKTOR": ALL, "KØN": ["0"], "FRAVAER": ["1100"], "ARBF": ALL,
               "FRAVAER1": ["70"], "Tid": ALL},
    # Full-time employees by DISCO 4-digit occupation and sector (weights for ILO scores)
    "LONS20": {"ARBF": ALL, "SEKTOR": ALL, "AFLOEN": ["TIFA"], "LONGRP": ["LTOT"],
               "LØNMÅL": ["ANTAL"], "KØN": ["MOK"], "Tid": ALL},
    # Wealth by municipality: net wealth, home value, mortgage debt, listed shares, funds
    "FORMUE12": {"FORM1": ["FGNF2020", "FGAK2020", "FGA1", "FGD", "FGD1A", "FGB2020",
                           "FGB3", "FGB4"],
                 "ENHED": ["200", "235", "240"], "OMRÅDE": ALL, "ALDER": ["1802"],
                 "POPU": ["5005"], "Tid": ALL},
    # Average disposable and pre-tax income per person
    "INDKP101": {"OMRÅDE": ALL, "ENHED": ["116"], "KOEN": ["MOK"],
                 "INDKOMSTTYPE": ["100", "105"], "Tid": ALL},
    # Educational attainment, 15-69 year olds
    "HFUDD11": {"BOPOMR": ALL, "HERKOMST": ["TOT"],
                "HFUDD": ["TOT", "H40", "H50", "H60", "H70", "H80"],
                "ALDER": ["TOT"], "KØN": ["TOT"], "Tid": ALL},
    # Population, first day of the quarter
    "FOLK1A": {"OMRÅDE": ALL, "KØN": ["TOT"], "ALDER": ["IALT"],
               "CIVILSTAND": ["TOT"], "Tid": ALL},
    # Land area (km2)
    "ARE207": {"OMRÅDE": ALL, "Tid": ALL},
    # Occupied dwellings by type of building
    "BOL101": {"OMRÅDE": ALL, "BEBO": ["1000"], "ANVENDELSE": ALL, "Tid": ALL},
    # Province price index and sales (checks on the Finans Danmark prices)
    "EJ56": {"OMRÅDE": ALL, "EJENDOMSKATE": ALL, "TAL": ["100"], "Tid": ALL},
    "EJEN77": {"OMRÅDE": ALL, "EJENDOMSKATE": ["0111", "2103"], "BNØGLE": ALL,
               "OVERDRAG": ["1"], "Tid": ALL},
}


# Tables whose full query exceeds the CSV cell cap
SPLIT_BY_YEAR = {"RAS302", "RAS301", "PEND100"}


def post_json(url, payload):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            return resp.read()
    except urllib.error.HTTPError as err:
        raise RuntimeError(f"{payload['table']}: {err.read().decode('utf-8', 'replace')}") from None


def get_json(url):
    with urllib.request.urlopen(url, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def query(table, variables):
    payload = {
        "table": table,
        "format": "CSV",
        "lang": "en",
        "valuePresentation": "Code",
        "variables": [{"code": k, "values": v} for k, v in variables.items()],
    }
    return payload, post_json(f"{API}/data", payload)


def download(table, variables, outdir):
    meta = get_json(f"{API}/tableinfo/{table}?lang=en&format=JSON")
    if table in SPLIT_BY_YEAR:
        years = [v["id"] for var in meta["variables"] if var["id"] == "Tid" for v in var["values"]]
        chunks = []
        for i, year in enumerate(years):
            payload, chunk = query(table, {**variables, "Tid": [year]})
            # Keep the header line from the first chunk only
            chunks.append(chunk if i == 0 else chunk.split(b"\n", 1)[1])
            time.sleep(0.3)
        payload["variables"][-1]["values"] = ALL
        data = b"".join(c if c.endswith(b"\n") else c + b"\n" for c in chunks)
    else:
        payload, data = query(table, variables)
    (outdir / f"{table}.csv").write_bytes(data)

    meta["_query"] = payload
    meta["_downloaded_utc"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    (outdir / f"{table}_meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))

    nrows = data.count(b"\n") - 1
    print(f"{table:9s} {nrows:>9,d} rows  updated {meta.get('updated')}")


def main():
    outdir = Path(sys.argv[1])
    outdir.mkdir(parents=True, exist_ok=True)
    tables = sys.argv[2:] or list(QUERIES)
    for table in tables:
        download(table, QUERIES[table], outdir)
        time.sleep(0.5)


if __name__ == "__main__":
    main()
