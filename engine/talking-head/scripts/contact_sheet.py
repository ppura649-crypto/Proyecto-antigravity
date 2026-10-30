#!/usr/bin/env python3
"""Self-eval: one labelled frame per kept clip -> contact.jpg.

Usage: python3 contact_sheet.py <project_dir> [--cols 7]
"""
import json
import math
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

THUMB_W = 320


def main():
    proj = Path(sys.argv[1])
    args = dict(zip(sys.argv[2::2], sys.argv[3::2]))
    cols = int(args.get("--cols", 7))
    doc = json.loads((proj / "cuts.json").read_text())
    src = (proj / "source.txt").read_text().strip()
    clips = [c for c in doc["clips"] if c["keep"]]

    frames = proj / "frames-contact"
    frames.mkdir(exist_ok=True)
    for c in clips:
        out = frames / f"c{c['id']:03d}.jpg"
        if out.exists():
            continue
        mid = (c["inMs"] + (c["outMs"] - c["inMs"]) * 0.3) / 1000
        subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                        "-ss", f"{mid:.3f}", "-i", src, "-frames:v", "1",
                        "-vf", f"scale={THUMB_W}:-2", str(out)], check=True)

    thumbs = []
    for c in clips:
        img = Image.open(frames / f"c{c['id']:03d}.jpg")
        d = ImageDraw.Draw(img)
        label = str(c["id"]) + (f" T{c['takeGroup']}" if c["takeGroup"] else "")
        d.rectangle([0, 0, 14 + 13 * len(label), 30], fill="black")
        d.text((6, 4), label, fill="yellow", font_size=24)
        thumbs.append(img)

    w, h = thumbs[0].size
    rows = math.ceil(len(thumbs) / cols)
    sheet = Image.new("RGB", (cols * (w + 4), rows * (h + 4)), "black")
    for i, t in enumerate(thumbs):
        sheet.paste(t, ((i % cols) * (w + 4), (i // cols) * (h + 4)))
    sheet.save(proj / "contact.jpg", quality=88)
    print(f"contact.jpg: {len(thumbs)} clips, {cols}x{rows}")


if __name__ == "__main__":
    main()
