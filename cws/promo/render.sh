#!/usr/bin/env bash
# Render Chrome Web Store promotional images.
#   small.png   440 × 280  (small promo tile)
#   marquee.png 1400 × 560 (marquee promo, used if Google features the listing)

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -x "$CHROME" ]; then
    echo "Google Chrome not found at $CHROME" >&2
    exit 1
fi

render() {
    local name="$1"
    local w="$2"
    local h="$3"
    local src="$HERE/${name}.html"
    local out="$HERE/${name}.png"
    if [ ! -f "$src" ]; then
        echo "missing $src" >&2
        return 1
    fi
    echo "rendering ${name}.png (${w}×${h})…"
    "$CHROME" \
        --headless=new \
        --disable-gpu \
        --hide-scrollbars \
        --force-device-scale-factor=1 \
        --window-size="${w},${h}" \
        --screenshot="$out" \
        "file://$src" \
        > /dev/null 2>&1
}

render small 440 280
render marquee 1400 560

rm -rf "$HERE/.com.google.Chrome"* 2>/dev/null || true

echo ""
echo "Done."
ls -l "$HERE"/*.png
