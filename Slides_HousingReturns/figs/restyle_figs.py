#!/usr/bin/env python3
"""Recolour the converted Stata figures to the explorable's palette.

Usage:
    python figs/restyle_figs.py            # every figs/*.svg
    python figs/restyle_figs.py Gelbach_mainresults

convert_figs.py turns the paper's PDFs into SVG with Stata's colours. This pass
maps those colours onto the deck's tokens so the appendix figures sit next to
the run-time charts without a palette change: Stata navy becomes ink, Stata
maroon and the Okabe-Ito orange become the price-gain brick, the blues become
greys, and the axis grey becomes the deck's muted ink. Text drawn as paths is
left alone. The mapping is idempotent, so running it twice is harmless.

Colour never marks a quantity that is not one of the deck's four semantic
colours, so nothing here is mapped onto the yield, Anna or Bo colours.
"""

import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent

MAP = {
    "#1a476f": "#1C2224",  # Stata navy         -> ink
    "#90353b": "#C4452A",  # Stata maroon       -> price gains
    "#f39189": "#C4452A",  # light red reference line -> price gains
    "#d55e00": "#C4452A",  # Okabe-Ito orange   -> price gains
    "#eaaf80": "#F2D9D2",  # its light fill     -> gain-soft
    "#0072b2": "#667074",  # Okabe-Ito blue     -> ink-3
    "#80b9d9": "#ECECEC",  # its light fill     -> paper-3
    "#a0a0a0": "#8A9195",  # Stata axis grey    -> a cooler grey
    "#000000": "#1C2224",  # black rules        -> ink
    "#1e2d53": "#1C2224",  # Stata dknavy       -> ink
    "#4b5775": "#4B5457",  # its lighter band   -> ink-2
    "#a65d62": "#C4452A",  # Stata dkred band   -> price gains
    "#333333": "#1C2224",  # dark grey          -> ink
    "#b3b3b3": "#C9CEC6",  # light grey         -> line
    "#ffffff": "#FFFFFF",
    "#eaf2f3": "#FFFFFF",  # Stata s1color/plotregion tint -> paper  # page and plot background -> paper, so the figure sits on the slide without a white box
    # Multi-series figures (Okabe-Ito green, sky blue, pink, orange) keep their
    # own colours: mapping several series onto one token would merge them.
}

ATTR = re.compile(r'(fill|stroke)="(#[0-9a-fA-F]{6}|rgb\([^)]*\))"')


def to_hex(color: str) -> str:
    """pdftocairo writes rgb(62.7%, 62.7%, 62.7%); pymupdf writes #a0a0a0. Normalise to hex."""
    if color.startswith("#"):
        return color.lower()
    parts = [float(x.strip().rstrip("%")) for x in color[4:-1].split(",")]
    return "#" + "".join(f"{round(v * 255 / 100):02x}" for v in parts)


def restyle(path: pathlib.Path) -> tuple[int, set]:
    text = path.read_text()
    unmapped = set()
    n = 0

    def sub(m):
        nonlocal n
        key = to_hex(m.group(2))
        if key in MAP:
            n += 1
            return f'{m.group(1)}="{MAP[key]}"'
        if key.upper() not in {v.upper() for v in MAP.values()}:
            unmapped.add(key)
        return m.group(0)

    out = ATTR.sub(sub, text)
    if out != text:
        path.write_text(out)
    return n, unmapped


def main(only):
    for path in sorted(HERE.glob("*.svg")):
        if only and path.stem not in only:
            continue
        n, unmapped = restyle(path)
        flag = f"   unmapped: {', '.join(sorted(unmapped))}" if unmapped else ""
        print(f"  {n:>5} recoloured  {path.name}{flag}")


if __name__ == "__main__":
    main(set(sys.argv[1:]))
