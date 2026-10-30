#!/usr/bin/env python3
"""Measure one full-resolution frame: card/panel boxes, text-line boxes, colours.

Usage:
  style_measure.py <ref_dir> <frame> [--band y0,y1] [--white 225] [--px x,y x,y ...]

Prints, normalised to W/H (and in px at the reel's own resolution):
  - bright boxes: connected regions of near-white pixels (cards, paper, white text), area-ranked;
  - sharp boxes: regions much sharper than the blurred footage (glass panels, UI, clips);
  - text lines inside the band: rows of white-with-dark-edge pixels grouped into lines, with
    the cap height (px) of the tallest glyph run;
  - colour samples at the given pixel positions (normalised x,y).
Nothing here replaces looking at the frame; it makes the numbers exact once you have.
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def boxes(mask, min_area, W, H, label):
    lab, n = ndimage.label(mask)
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab), start=1):
        area = int((lab[sl] == i).sum())
        if area < min_area:
            continue
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        out.append((area, x0, y0, x1, y1))
    out.sort(reverse=True)
    for area, x0, y0, x1, y1 in out[:12]:
        print(f"  {label}: x {x0 / W:.3f}-{x1 / W:.3f}  y {y0 / H:.3f}-{y1 / H:.3f}   px {x0},{y0} -> {x1},{y1}  ({x1 - x0}x{y1 - y0})  fill {area / ((x1 - x0) * (y1 - y0)):.2f}")
    return out


def main():
    ref = sys.argv[1].rstrip("/")
    fr = int(sys.argv[2])
    path = os.path.join(ref, "frames", "full", f"f{fr:05d}.jpg")
    if not os.path.exists(path):
        os.system(f"python3 {os.path.dirname(__file__)}/style_strip.py {ref} {fr} {fr} --scale 0.1 --out _m{fr} >/dev/null")
    im = Image.open(path).convert("RGB")
    W, H = im.size
    a = np.asarray(im).astype(np.int16)
    print(f"frame {fr}  {W}x{H}")
    white = int(arg("--white", "225"))
    y0, y1 = (float(v) for v in arg("--band", "0,1").split(","))

    # bright boxes (cards, paper, big white shapes)
    bright = (a.min(axis=2) >= white)
    bright = ndimage.binary_opening(bright, iterations=2)
    print("bright regions:")
    boxes(bright, 1500, W, H, "bright")

    # sharp boxes: local gradient energy vs the whole frame (glass UI, sharp clips on blurred footage)
    g = a.mean(axis=2)
    gx = np.abs(np.diff(g, axis=1, prepend=g[:, :1]))
    gy = np.abs(np.diff(g, axis=0, prepend=g[:1, :]))
    e = ndimage.uniform_filter(gx + gy, 25)
    sharp = e > max(6.0, np.percentile(e, 92))
    sharp = ndimage.binary_closing(sharp, iterations=6)
    print("sharp regions (92nd pct of local gradient):")
    boxes(sharp, 4000, W, H, "sharp")

    # text lines in the band: white pixels with a dark neighbour within 3px (outlined captions/titles)
    ya, yb = int(y0 * H), int(y1 * H)
    band = a[ya:yb]
    wpx = band.min(axis=2) >= 215
    dark = ndimage.maximum_filter(band.max(axis=2) <= 90, size=7)
    txt = wpx & dark
    rows = txt.sum(axis=1)
    lines, start = [], None
    for i, v in enumerate(list(rows) + [0]):
        if v >= 3 and start is None:
            start = i
        elif v < 3 and start is not None:
            if i - start >= 6:
                lines.append((start, i))
            start = None
    print(f"text lines in band y {y0}-{y1}:")
    for s, e_ in lines:
        cols = np.where(txt[s:e_].any(axis=0))[0]
        if len(cols) == 0:
            continue
        x0, x1 = int(cols.min()), int(cols.max())
        # cap height estimate: the tallest column run inside the line
        col_runs = txt[s:e_].sum(axis=0)
        print(f"  line y {(ya + s) / H:.3f}-{(ya + e_) / H:.3f} (h {e_ - s}px)  x {x0 / W:.3f}-{x1 / W:.3f} (w {x1 - x0}px)  centre x {(x0 + x1) / 2 / W:.3f}  tallest glyph {int(col_runs.max())}px")

    if "--px" in sys.argv:
        pts = " ".join(sys.argv[sys.argv.index("--px") + 1:]).split()
        for p in pts:
            if "," not in p or p.startswith("--"):
                continue
            x, y = (float(v) for v in p.split(","))
            X, Y = int(x * W), int(y * H)
            r, g_, b = a[Y, X]
            print(f"  colour at ({x:.3f},{y:.3f}) px {X},{Y}: #{r:02x}{g_:02x}{b:02x}  rgb({r},{g_},{b})")


if __name__ == "__main__":
    main()
