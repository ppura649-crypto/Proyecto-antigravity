#!/usr/bin/env python3
"""Consecutive-frame strips at full resolution, for reading an animation frame by frame.

Usage:
  style_strip.py <ref_dir> <from> <to> [--band y0,y1] [--x x0,x1] [--cols 6] [--scale 0.5] [--out name]

Every frame from <from> to <to> inclusive is decoded at full resolution, cropped to the band
(fractions of H, default the top 0..0.40) and x-range (fractions of W), and tiled in order
with its frame number and time. Nothing is skipped: 30 frames in = 30 tiles out.
Writes <ref_dir>/frames/strips/<out>.jpg and prints the path. Also keeps the full-res PNGs of
the range in <ref_dir>/frames/full/ so single frames can be measured afterwards.
"""
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def main():
    ref = sys.argv[1].rstrip("/")
    a, b = int(sys.argv[2]), int(sys.argv[3])
    y0, y1 = (float(v) for v in arg("--band", "0,0.40").split(","))
    x0, x1 = (float(v) for v in arg("--x", "0,1").split(","))
    cols = int(arg("--cols", "6"))
    scale = float(arg("--scale", "0.5"))
    name = arg("--out", f"f{a}-{b}-{int(y0 * 100)}-{int(y1 * 100)}")
    fps = json.load(open(os.path.join(ref, "meta.json")))["fps"]
    full = os.path.join(ref, "frames", "full")
    os.makedirs(full, exist_ok=True)
    missing = [n for n in range(a, b + 1) if not os.path.exists(os.path.join(full, f"f{n:05d}.jpg"))]
    if missing:
        tmp = os.path.join(full, "tmp_%05d.jpg")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ref, "reel.mp4"), "-vf",
                        f"select='between(n,{a},{b})'", "-fps_mode", "passthrough", "-q:v", "2", "-start_number", str(a), tmp], check=True)
        for n in range(a, b + 1):
            src = os.path.join(full, f"tmp_{n:05d}.jpg")
            if os.path.exists(src):
                os.replace(src, os.path.join(full, f"f{n:05d}.jpg"))
    first = Image.open(os.path.join(full, f"f{a:05d}.jpg"))
    W, H = first.size
    box = (int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H))
    tw, th = int((box[2] - box[0]) * scale), int((box[3] - box[1]) * scale)
    n = b - a + 1
    rows = (n + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (tw + 4), rows * (th + 22)), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    for k, fr in enumerate(range(a, b + 1)):
        im = Image.open(os.path.join(full, f"f{fr:05d}.jpg")).crop(box).resize((tw, th), Image.LANCZOS)
        x, y = (k % cols) * (tw + 4), (k // cols) * (th + 22)
        sheet.paste(im, (x, y))
        d.text((x + 3, y + th + 4), f"f{fr}  {fr / fps:.3f}s", fill=(255, 255, 255))
    out_dir = os.path.join(ref, "frames", "strips")
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, name + ".jpg")
    sheet.save(out, quality=88)
    print(out, sheet.size)


if __name__ == "__main__":
    main()
