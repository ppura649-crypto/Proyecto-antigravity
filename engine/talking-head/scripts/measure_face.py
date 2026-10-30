#!/usr/bin/env python3
"""Stage 0 geometry: measure where the speaker is on THIS master, write geometry.json + a sheet.

Every video is framed differently (reference edit A head top 0.30H, cut-tight 0.46H, reference edit B 0.385H) and
three videos paid for geometry that was guessed or inherited. This makes the measurement a file
that the later stages read, instead of a number someone remembers.

  head top  = the hair line, found by scanning up from the face box until the wall colour returns
  face box, eyes, nose, mouth, chin = macOS Vision (scripts/facekit/measure_face.swift, no pip)
  mic, hands = not detected; read them off geometry.png and pass --mic 0.78 --hands 0.62 if needed

Writes projects/<id>/geometry.json:
  { "measuredOn": [...frames], "headTopFrac", "faceTopFrac", "eyesFrac", "noseFrac", "mouthFrac",
    "chinFrac", "faceLeftFrac", "faceRightFrac", "micFrac", "handsFrac",
    "suggest": { "cardTopFrac", "cardBottomFrac", "titleTopFrac", "baselineYFrac", "stackTopFrac" } }
and geometry.png: three frames with 5% gridlines and the measured lines drawn on them.

Usage: python3 scripts/measure_face.py <project_dir> [--at 1.0,4.0,20.0] [--mic F] [--hands F]
The suggestions are a starting point for format.json; the decision stays with whoever writes it.
"""
import json, os, statistics, subprocess, sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
KIT = HERE / "facekit"


def arg(flag, default=None):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def ensure_binary():
    if sys.platform != "darwin" or os.environ.get("KEYFRAMES_FACE") == "cv":
        # no macOS Vision here: OpenCV answers in the same lines (facekit/measure_face_cv.py)
        return [sys.executable, str(KIT / "measure_face_cv.py")]
    exe = KIT / "measure_face"
    src = KIT / "measure_face.swift"
    if not exe.exists():   # a copied or unzipped folder does not keep file times, so the shipped program is rebuilt only when it is missing
        subprocess.run(["swiftc", "-O", str(src), "-o", str(exe)], check=True)
    return [str(exe)]


def grab(master, seconds, out_dir):
    frames = []
    for s in seconds:
        f = out_dir / f"geom-{s:.1f}.png"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(s), "-i", str(master),
                        "-frames:v", "1", str(f)], check=True)
        frames.append(f)
    return frames


def hair_top(img, face, wall_rows=(0.04, 0.10), thresh=28, need=10):
    """Scan up from the face box through the face's own columns until the wall colour returns.

    The wall colour is the median of the same columns near the top of the frame (a plain wall
    on every video so far). The head top is the first row, going up from the forehead, where
    `need` rows in a row sit within `thresh` of that colour."""
    w, h = img.size
    px = img.load()
    x0 = int(face["left"] * w) + int(0.15 * (face["right"] - face["left"]) * w)
    x1 = int(face["right"] * w) - int(0.15 * (face["right"] - face["left"]) * w)
    xs = list(range(x0, x1, max(1, (x1 - x0) // 40)))

    def row_mean(y):
        r = g = b = 0
        for x in xs:
            p = px[x, y]
            r += p[0]; g += p[1]; b += p[2]
        n = len(xs)
        return (r / n, g / n, b / n)

    wall = [row_mean(y) for y in range(int(wall_rows[0] * h), int(wall_rows[1] * h), 4)]
    wr = statistics.median(c[0] for c in wall)
    wg = statistics.median(c[1] for c in wall)
    wb = statistics.median(c[2] for c in wall)
    run = 0
    y = int(face["top"] * h)
    while y > int(wall_rows[1] * h):
        r, g, b = row_mean(y)
        if abs(r - wr) + abs(g - wg) + abs(b - wb) < thresh:
            run += 1
            if run >= need:
                return (y + need) / h
        else:
            run = 0
        y -= 1
    return face["top"]  # no wall found above: the box top is the best we have


def draw_sheet(frames, geo, out):
    tiles = []
    for f in frames:
        im = Image.open(f).convert("RGB")
        w, h = im.size
        d = ImageDraw.Draw(im)
        for k in range(1, 20):
            y = int(k * 0.05 * h)
            d.line([(0, y), (w, y)], fill=(255, 255, 255, 90), width=1)
            d.text((6, y - 14), f"{k * 0.05:.2f}", fill=(255, 255, 255))
        lines = [("headTopFrac", (224, 120, 80)), ("chinFrac", (224, 120, 80)),
                 ("eyesFrac", (255, 255, 255)), ("mouthFrac", (255, 255, 255)),
                 ("micFrac", (120, 200, 255)), ("handsFrac", (120, 200, 255))]
        for key, col in lines:
            v = geo.get(key)
            if v is None:
                continue
            y = int(v * h)
            d.line([(0, y), (w, y)], fill=col, width=3)
            d.text((w - 260, y - 16), f"{key} {v:.3f}", fill=col)
        for key, col in (("cardBottomFrac", (255, 210, 80)), ("titleTopFrac", (255, 210, 80)),
                         ("baselineYFrac", (255, 210, 80)), ("stackTopFrac", (255, 210, 80))):
            v = geo["suggest"][key]
            y = int(v * h)
            d.line([(int(0.7 * w), y), (w, y)], fill=col, width=2)
            d.text((int(0.7 * w) + 4, y + 2), f"suggest {key} {v:.3f}", fill=col)
        tiles.append(im.resize((w // 2, h // 2)))
    sheet = Image.new("RGB", (sum(t.width for t in tiles), tiles[0].height), (0, 0, 0))
    x = 0
    for t in tiles:
        sheet.paste(t, (x, 0)); x += t.width
    sheet.save(out, quality=88)


def main():
    P = Path(sys.argv[1]).resolve()
    master = P / "master.mp4"
    if not master.exists():
        master = P / "spine.mp4"
    if not master.exists():
        sys.exit("no master.mp4 or spine.mp4 in the project")
    seconds = [float(s) for s in (arg("--at") or "1.0,4.0,20.0").split(",")]
    exe = ensure_binary()
    work = P / "checks"
    work.mkdir(exist_ok=True)
    frames = grab(master, seconds, work)
    res = subprocess.run(exe + [str(f) for f in frames], capture_output=True, text=True, check=True)
    rows = [json.loads(l) for l in res.stdout.splitlines() if l.startswith("{")]
    good = [r for r in rows if "face" in r and r.get("chin") is not None]
    if not good:
        sys.exit("Vision found no face in the frames: " + res.stdout)

    def med(key, sub=None):
        vals = [(r[sub][key] if sub else r[key]) for r in good if (r[sub][key] if sub else r[key]) is not None]
        return round(statistics.median(vals), 4)

    face = {k: med(k, "face") for k in ("top", "bottom", "left", "right")}
    hairs = []
    for r, f in zip(rows, frames):
        if "face" in r:
            hairs.append(hair_top(Image.open(f).convert("RGB"), r["face"]))
    head_top = round(statistics.median(hairs), 4)
    chin = med("chin")
    geo = {
        "measuredOn": [f"{s:.1f}s" for s in seconds],
        "headTopFrac": head_top,
        "faceTopFrac": face["top"],
        "eyesFrac": med("eyes"),
        "noseFrac": med("nose"),
        "mouthFrac": med("mouth"),
        "chinFrac": chin,
        "faceLeftFrac": face["left"],
        "faceRightFrac": face["right"],
        "micFrac": float(arg("--mic")) if arg("--mic") else None,
        "handsFrac": float(arg("--hands")) if arg("--hands") else None,
        "suggest": {
            # the platform's own chrome covers the top strip; the card rests a hair into the hair
            "cardTopFrac": 0.105,
            "cardBottomFrac": round(head_top + 0.03, 3),
            # two title lines need ~0.07H; keep the title clear of the hair with a margin
            "titleTopFrac": round(max(0.15, head_top - 0.13), 3),
            # captions sit between the collar and the mic: chin + ~0.08H on every video so far
            "baselineYFrac": round(chin + 0.08, 3),
            "stackTopFrac": round(chin + 0.035, 3),
        },
        "note": "headTop = hair line by wall-colour scan; face/eyes/nose/mouth/chin = macOS Vision; "
                "suggestions are starting points for format.json, not decisions",
    }
    (P / "geometry.json").write_text(json.dumps(geo, indent=1))
    draw_sheet(frames, geo, P / "geometry.png")
    for f in frames:
        f.unlink()
    print(json.dumps(geo, indent=1))
    print(f"\nwrote {P/'geometry.json'}\n      {P/'geometry.png'}  (open it: read mic + hands off the grid if the stage needs them)")


if __name__ == "__main__":
    main()
