#!/usr/bin/env python3
"""Check 5 of references/01b-verifying-a-cut.md: the gaze tile.

The LAST 3 frames of every clip, cropped to the eye band and tiled, so a dropped gaze on the
frame the viewer actually sees is visible in one picture. The creator asked for this check by name
(2026-09-04): "look at each frame at the end of the cut, and see if we have someone looking
down or not looking at the camera anymore".

Frames are pulled by explicit frame number through one `select` pass over the spine, in
ascending order, so the `%d` trap cannot bite: `ffmpeg -frames:v N` with `%d` numbers files
from 1, and reading 0..N-1 silently drops the frame that actually matters.

Usage: python3 gaze_tile.py <project_dir> [--band 0.53,0.68] [--x 0.26,0.74] [--per-sheet 7]
"""
import json, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageDraw

FPS = 30


def main():
    P = Path(sys.argv[1])
    a = dict(zip(sys.argv[2::2], sys.argv[3::2]))
    # The eye band comes from geometry.json when it exists (stage 0 measures it on THIS master);
    # the old fixed default was reference edit A's framing and showed their chin on reference edit C (2026-09-05).
    geo = json.loads((P / "geometry.json").read_text()) if (P / "geometry.json").exists() else {}
    if geo.get("eyesFrac") and "--band" not in a:
        a["--band"] = f"{geo['eyesFrac'] - 0.055:.3f},{geo['eyesFrac'] + 0.075:.3f}"
    if geo.get("faceLeftFrac") and "--x" not in a:
        a["--x"] = f"{max(0, geo['faceLeftFrac'] - 0.06):.3f},{min(1, geo['faceRightFrac'] + 0.06):.3f}"
    y0, y1 = [float(v) for v in a.get("--band", "0.53,0.68").split(",")]
    x0, x1 = [float(v) for v in a.get("--x", "0.26,0.74").split(",")]
    per = int(a.get("--per-sheet", 7))

    segs = json.loads((P / "spine-map.json").read_text())["segments"]
    # last 3 frames of each clip, the LAST one last
    picks = []
    for s in segs:
        last = int(round(s["spineOutMs"] / 1000 * FPS)) - 1
        for n in (last - 2, last - 1, last):
            picks.append((max(0, n), s["id"], n == last))
    order = sorted(range(len(picks)), key=lambda i: picks[i][0])

    tmp = Path(tempfile.mkdtemp())
    # Frame numbers are clamped to the spine's real frame count (the last clip's "last frame"
    # computed from spineOutMs can land one or two past the end: chip, 2026-09-05, "got 7
    # frames, wanted 9") and pulled ONCE each; picks then map to files by frame number.
    total = int(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets",
                                "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0",
                                str(P / "spine.mp4")], capture_output=True, text=True).stdout.strip() or 0)
    if total:
        picks = [(min(n, total - 1), cid, last) for n, cid, last in picks]
    frames = sorted({n for n, _, _ in picks})
    # ffmpeg's expression parser gives up ("Cannot allocate memory") past ~100 eq() terms
    # (edit-c-qa, 36 clips = 108 frames, 2026-09-05), so the frames are pulled in batches
    # of 30, each batch its own pass over the spine.
    got = {}
    for b in range(0, len(frames), 30):
        batch = frames[b:b + 30]
        expr = "+".join(f"eq(n\\,{n})" for n in batch)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(P / "spine.mp4"),
                        "-vf", f"select='{expr}'", "-fps_mode", "passthrough", "-q:v", "3",
                        str(tmp / f"f{b:04d}_%03d.jpg")], check=True)
        got_b = sorted(tmp.glob(f"f{b:04d}_*.jpg"))
        assert len(got_b) == len(batch), f"batch {b}: got {len(got_b)} frames, wanted {len(batch)}"
        for n, f in zip(batch, got_b):
            got[n] = f
    files = [got[n] for n, _, _ in picks]
    got = {i: got[picks[i][0]] for i in range(len(picks))}

    W, H = Image.open(files[0]).size
    cx0, cx1 = int(W * x0), int(W * x1)
    cy0, cy1 = int(H * y0), int(H * y1)
    cw, ch = cx1 - cx0, cy1 - cy0
    scale = 300 / cw
    tw, th = 300, int(ch * scale)

    out = []
    for sheet, start in enumerate(range(0, len(segs), per)):
        chunk = segs[start:start + per]
        img = Image.new("RGB", (3 * tw + 40, len(chunk) * (th + 26) + 10), (18, 18, 18))
        d = ImageDraw.Draw(img)
        for r, s in enumerate(chunk):
            for c in range(3):
                i = (start + r) * 3 + c
                n, cid, is_last = picks[i]
                fr = Image.open(got[i]).crop((cx0, cy0, cx1, cy1)).resize((tw, th))
                x, y = 10 + c * (tw + 10), 10 + r * (th + 26)
                img.paste(fr, (x, y))
                if is_last:
                    d.rectangle([x - 2, y - 2, x + tw + 1, y + th + 1], outline=(230, 90, 40), width=3)
                d.text((x + 4, y + th + 4),
                       f"clip {cid}  f{n}{'  <- LAST' if is_last else ''}", fill=(200, 200, 200))
        p = P / "checks" / f"gaze-{sheet+1}.jpg"
        p.parent.mkdir(exist_ok=True)
        img.save(p, quality=88)
        out.append(p)
    for p in out:
        print(p)


if __name__ == "__main__":
    main()
