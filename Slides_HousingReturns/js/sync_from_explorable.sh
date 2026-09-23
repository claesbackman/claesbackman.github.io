#!/bin/sh
# Copy the explorable's drawing library into the deck.
#
# The deck's charts are drawn at run time by the same code that draws the
# explorable (Explorable_HousingReturns/), so the two never drift apart in
# look. The copies here are build input: edit the originals, then re-run this.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
SRC="$HERE/../../../Explorable_HousingReturns"
cp "$SRC/lib.js" "$HERE/lib.js"
cp "$SRC/cd/illustrations.js" "$HERE/illustrations.js"
echo "copied lib.js and illustrations.js from $SRC"
