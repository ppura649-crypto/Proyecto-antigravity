#!/usr/bin/env python3
"""mkformat.py <project>: projects/<id>/format.json from the Creator Format 1 pack + geometry.json.
Also measures the bright monitor behind them (this take's framing: dark curtain above, a lit
ultrawide from ~0.43H to ~0.63H) so the hook stack starts BELOW the monitor's bottom edge."""
import json, subprocess, sys
from pathlib import Path
from PIL import Image
P = Path(sys.argv[1]); geo = json.load(open(P / "geometry.json"))
fmt = json.load(open("formats/creator-format-1.json"))
for k in ("note", "cardAnchor"): fmt.pop(k, None)
# monitor bottom edge: the lit ultrawide behind them is lowest at the frame's LEFT edge (curved
# screen) and ends at ~0.63H behind their shoulders; read the bright run containing 0.55H on the
# RIGHT edge (x 0.88-0.96W), where nothing else is lit, and start the stack a hair under it. The
# stack is centred over their black shirt, so a hero's ends over the lower-left monitor rely on
# the caption shadow, as reference edit A did over its monitors.
frame = P / "_fmt_frame.png"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", "1.0", "-i", str(P / "master.mp4"), "-frames:v", "1", str(frame)], check=True)
im = Image.open(frame).convert("L"); W, H = im.size; px = im.load()
xs = range(int(W * 0.88), int(W * 0.96), 4)
def row(y): return sum(px[x, y] for x in xs) / len(xs)
y = int(H * 0.55); mon_top = mon_bot = None
if row(y) > 90:
    a = y
    while a > 0 and row(a - 1) > 90: a -= 1
    b = y
    while b < H - 1 and row(b + 1) > 90: b += 1
    mon_top, mon_bot = a / H, b / H
frame.unlink()
s = geo["suggest"]; chin = geo["chinFrac"]
stack = round(max(s["stackTopFrac"], (mon_bot or 0) + 0.012), 3)
fmt.update({
    "name": "creator-format-1",
    "baselineYFrac": s["baselineYFrac"],
    "stackTopFrac": stack,
    "stackHoldMs": 800,
    "safeTopFrac": 0.115,
    "cardTopFrac": s["cardTopFrac"],
    "cardBottomFrac": s["cardBottomFrac"],
    "titleTopFrac": s["titleTopFrac"],
    "titleFontPx": 52,
    "titleLineGapPx": 0,
    "titleLineHeight": 1.12,
    "note": (f"Creator Format 1 pack, geometry measured on THIS master ({P.name}, 2026-09-05): head top {geo['headTopFrac']}H, "
             f"chin {chin}H; a lit monitor sits behind them {mon_top and round(mon_top,3)}-{mon_bot and round(mon_bot,3)}H, "
             f"so the hook stack starts under its bottom edge at {stack}H (chin+0.035 would be {s['stackTopFrac']}). "
             f"Band {s['cardTopFrac']}-{s['cardBottomFrac']}H, title top {s['titleTopFrac']}H, baseline {s['baselineYFrac']}H. " "no speed ramp, ever (2026-09-05)."),
})
(P / "format.json").write_text(json.dumps(fmt, indent=1))
print(f"{P.name}: monitor {mon_top and round(mon_top,3)}-{mon_bot and round(mon_bot,3)}H, stackTop {stack}, baseline {s['baselineYFrac']}, band {s['cardTopFrac']}-{s['cardBottomFrac']}, title {s['titleTopFrac']}")
