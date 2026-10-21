"""Convert GADM municipality boundaries into Stata-ready files.

Usage: python3 -I Code/04_build_geo.py Data/raw Data/clean

Writes
  muni_geo.csv     DST municipality code, province and region, centroid, distance to
                   Copenhagen and Aarhus (km)
  muni_coords.csv  spmap coordinate file (_ID, _X, _Y in km). Each ring starts with a row
                   of missing coordinates. Bornholm is moved north-west so the map is compact.
"""

import csv
import json
import math
import sys
from pathlib import Path

# GADM spellings that differ from DST's English municipality labels
GADM_TO_DST = {"København": "Copenhagen", "Århus": "Aarhus", "HøjeTaastrup": "Høje-Taastrup",
               "Vesthimmerland": "Vesthimmerlands"}
CITY_HALLS = {"cph": (55.6761, 12.5683), "aarhus": (56.1532, 10.2036)}
LAT0, LON0 = 56.0, 10.5
BORNHOLM, BORNHOLM_SHIFT = "400", (-75.0, 215.0)


def to_km(lon, lat):
    return ((lon - LON0) * 111.32 * math.cos(math.radians(LAT0)), (lat - LAT0) * 110.57)


def haversine(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = (math.sin((p2 - p1) / 2) ** 2 +
         math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2)
    return 2 * 6371.0 * math.asin(math.sqrt(a))


def ring_centroid(ring):
    """Signed area and centroid of a ring (shoelace formula, in degrees)."""
    a = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(ring, ring[1:]):
        cross = x0 * y1 - x1 * y0
        a += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross
    return a / 2, cx / (3 * a), cy / (3 * a)


def main():
    raw, clean = Path(sys.argv[1]), Path(sys.argv[2])
    clean.mkdir(parents=True, exist_ok=True)

    meta = json.loads((raw / "dst" / "RAS302_meta.json").read_text())
    area = next(v for v in meta["variables"] if v["id"] == "OMRÅDE")
    dst = {v["text"]: v["id"] for v in area["values"]
           if len(v["id"]) == 3 and v["id"] != "000" and not v["id"].startswith("08")}

    # The metadata lists each region (08x) and province (2 digits) before its municipalities
    parent = {}
    for v in area["values"]:
        if len(v["id"]) == 3 and v["id"].startswith("08"):
            region_now = v["id"]
        elif len(v["id"]) == 2:
            province_now = v["id"]
        elif v["id"] in dst.values():
            parent[v["id"]] = (province_now, region_now)

    gadm = json.loads((raw / "geo" / "gadm41_DNK_2.json").read_text())
    geo_rows, coord_rows, matched = [], [], set()
    for feat in gadm["features"]:
        name = GADM_TO_DST.get(feat["properties"]["NAME_2"], feat["properties"]["NAME_2"])
        if name not in dst:
            print(f"  not in DST municipality list, dropped: {name}")
            continue
        code = dst[name]
        matched.add(code)
        polygons = feat["geometry"]["coordinates"]

        # Centroid of the largest polygon, distances from it
        _, lon, lat = max((ring_centroid(p[0]) for p in polygons), key=lambda t: abs(t[0]))
        geo_rows.append([code, name, *parent[code], round(lat, 5), round(lon, 5)] +
                        [round(haversine(lat, lon, *CITY_HALLS[c]), 1) for c in ("cph", "aarhus")])

        dx, dy = BORNHOLM_SHIFT if code == BORNHOLM else (0.0, 0.0)
        for polygon in polygons:
            for ring in polygon:
                coord_rows.append([int(code), "", ""])
                for lon_, lat_ in ring:
                    x, y = to_km(lon_, lat_)
                    coord_rows.append([int(code), round(x + dx, 3), round(y + dy, 3)])

    missing = sorted(set(dst.values()) - matched)
    print(f"  {len(matched)} municipalities matched; DST codes without boundaries: {missing}")

    with open(clean / "muni_geo.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["kom", "name", "province", "region", "lat", "lon", "dist_cph", "dist_aarhus"])
        w.writerows(geo_rows)
    with open(clean / "muni_coords.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["_ID", "_X", "_Y"])
        w.writerows(coord_rows)


if __name__ == "__main__":
    main()
