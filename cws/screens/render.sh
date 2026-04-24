#!/usr/bin/env bash
# Render the 5 CWS screenshot compositions to 1280×800 PNGs.
# Uses the system's installed Google Chrome in headless mode.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -x "$CHROME" ]; then
    echo "Google Chrome not found at $CHROME" >&2
    exit 1
fi

for n in 1 2 3 4 5; do
    src="$HERE/shot${n}.html"
    out="$HERE/shot${n}.png"
    if [ ! -f "$src" ]; then
        echo "missing $src" >&2
        continue
    fi
    echo "rendering shot${n}.png …"
    "$CHROME" \
        --headless=new \
        --disable-gpu \
        --hide-scrollbars \
        --force-device-scale-factor=1 \
        --window-size=1280,800 \
        --screenshot="$out" \
        "file://$src" \
        > /dev/null 2>&1
done

# Trim any DevTools-related tmpfile leftovers.
rm -rf "$HERE/.com.google.Chrome"* 2>/dev/null || true

echo ""
echo "Done. 5 PNGs at $HERE/"
ls -l "$HERE"/shot*.png
