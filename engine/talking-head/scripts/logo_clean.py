#!/usr/bin/env python3
"""Crop a favicon to its bare mark: make the border-connected flat background transparent,
trim to the alpha bbox. Never draws a box; a logo floats on nothing.
Usage: python3 scripts/logo_clean.py <in.png> <out.png> [--tol 48] [--pad 0.04]"""
import sys
from collections import deque
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
args = dict(zip(sys.argv[3::2], sys.argv[4::2]))
tol, pad = int(args.get("--tol", 48)), float(args.get("--pad", 0.04))
im = Image.open(src).convert("RGBA")
W, H = im.size
px = im.load()
corners = [px[0, 0], px[W - 1, 0], px[0, H - 1], px[W - 1, H - 1]]
bg = max(set((c[0], c[1], c[2]) for c in corners if c[3] > 0), key=lambda c: sum(1 for k in corners if k[:3] == c), default=None)
if bg is not None and max(bg) > 40:  # a flat light/colored background square, not already transparent
    seen = bytearray(W * H)
    q = deque()
    for x in range(W):
        q.append((x, 0)); q.append((x, H - 1))
    for y in range(H):
        q.append((0, y)); q.append((W - 1, y))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= W or y >= H or seen[y * W + x]:
            continue
        r, g, b, a = px[x, y]
        if a > 0 and sum(abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) for _ in (0,)) > tol:
            continue
        seen[y * W + x] = 1
        px[x, y] = (r, g, b, 0)
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
bbox = im.getchannel("A").getbbox()
im = im.crop(bbox)
p = int(round(max(im.size) * pad))
out = Image.new("RGBA", (im.width + 2 * p, im.height + 2 * p), (0, 0, 0, 0))
out.paste(im, (p, p), im)
out.save(dst)
print(dst, out.size, "bg", bg)
