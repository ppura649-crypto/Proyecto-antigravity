#!/usr/bin/env python3
"""Measure where the speaker is in THIS clip, and write the numbers everything else reads.

Goal. Nothing is ever placed from a remembered number. Where the captions sit, where a card may
appear, where the hook stack rests are all decided by the buyer's own framing, measured once at
intake and written to a file the later stages read.

Reasoning. Three builds paid for geometry that was guessed or inherited from a different video,
and the framings are genuinely far apart: head top at 0.30 of the height on one clip, 0.385 on
another, 0.46 on a third. A caption baseline that was right on one of those lands on the chin of
the next. Making the measurement a file rather than a habit is the whole fix, and it is why the
layer checks refuse to run without it: a check that quietly skips is worse than no check.

The detector has to ship inside a folder somebody unzips, so it is YuNet: 75k parameters, MIT,
227 KB, and part of OpenCV, which means no download and no licence to accept. The reference
build used macOS Vision, which is better and runs on half the machines we sell to.

The pattern. Sample three frames rather than one, take the median of what they agree on, find the
hair line by scanning up until the wall colour comes back, then derive the placements. The
derivations are starting points, not decisions: a person reads read.png and changes them.

Counter-example. Trusting one frame. A blink, a turn of the head, or a hand crossing the face
moves a landmark by more than the tolerance the checks use.

Usage: read_fit.py <project_dir> [--video <file>] [--at 1.0,4.0,20.0] [--mic F] [--hands F]
Writes <project>/read.json and <project>/read.png. Exits 1 if no face is found.
"""
import json
import statistics
import subprocess
import sys
from pathlib import Path

try:
    import cv2
    import numpy as np
    from PIL import Image, ImageDraw
except ModuleNotFoundError as missing:  # never a traceback at the buyer: name the package and the file that lists it
    sys.exit(f"this needs the Python package {missing.name}, which is not installed for {sys.executable}.\n"
             "It is listed in the pack's requirements.txt. Install it with this Python, then run this again.")

HERE = Path(__file__).resolve().parent
MODEL = HERE.parent / "models" / "face_detection_yunet_2023mar.onnx"
# YuNet returns the five landmarks in this order, and they are the only ones it gives
LM = ("eyeR", "eyeL", "nose", "mouthR", "mouthL")


# What the law fixes, read from the style file so there is one copy of each number.
from _pack import pack
LAW = pack("styles/one.json")
HAIR_BITE = 0.03     # a card may sit this far into the hair, and no further
CHIN_AIR = 0.02      # a card under the face starts this far below the chin
CARD_MIN = 0.20      # a band shorter than this cannot hold a picture that reads at phone size
WORDS_H = 0.16       # a hook stack is three lines and one of them is huge


def place(head_top: float, chin: float, mic=None, hands=None) -> dict:
    """Decide which side of the face holds the pictures, and where the words sit.

    The pattern. The face is the one thing the layer may never cover, so measuring it splits the
    frame into two free bands, one over the head and one under the chin. The pictures take the
    band that can hold a picture and the words take the other. When only one band is big enough,
    both live in it: the pictures at the end nearer the face, because a picture wants to be near
    what is being said, and the words at the far end, because a caption is read last.

    Most people record with room over their head, and that is the arrangement every reel that
    worked used. Some frame themselves at the very top, and then there is nothing up there to put
    a card in. Nothing about the pictures changes between the two cases: the same cards, the same
    holds, the same laws. Only the room is different, and the room is a measurement.

    The microphone and the hands are read off the sheet by a person and passed in, because no
    detector finds them reliably and a wrong guess about them is worse than no guess. When they
    are given they only ever take room away: the words clear whichever of them sits lowest, and a
    picture under the face stops above the hands rather than being waved at.

    Counter-example. Keeping the default and letting the cards sit in a four hundredths band over
    a forehead, which is what happens when the placement is a constant instead of a reading.
    """
    law = (json.loads(LAW.read_text()).get("law") if LAW.exists() else {}) or {}
    top_safe = law.get("topSafeFrac", 0.05)
    bottom_safe = law.get("bottomSafeFrac", 0.14)
    above = (head_top + HAIR_BITE) - top_safe
    below = (1 - bottom_safe) - (chin + CHIN_AIR)

    if above >= CARD_MIN:
        # the usual arrangement: pictures over the head, words under the chin
        card_top, card_bottom = top_safe, round(head_top + HAIR_BITE, 3)
        # the words clear the chin, the microphone and the hands, whichever sits lowest
        floor = max([chin] + [v for v in (mic, hands) if v is not None])
        baseline = round(floor + 0.08, 3)
        stack_top = round(floor + 0.035, 3)
        cta = round(card_bottom - 0.13, 3)
        layout, why = "picturesAbove", f"{above:.3f} of the height is free over the head"
    elif below >= CARD_MIN + WORDS_H:
        # the speaker is at the top of the frame: everything the layer does happens below them
        baseline = round(1 - bottom_safe - 0.03, 3)
        stack_top = round(baseline - 0.045, 3)
        card_top = round(chin + CHIN_AIR, 3)
        card_bottom = round(stack_top - WORDS_H + 0.11, 3)
        if hands is not None:
            # a picture under the face is in front of the hands, so it stops above them
            card_bottom = round(min(card_bottom, hands - 0.02), 3)
        cta = round(card_top + 0.08, 3)
        layout, why = "picturesBelow", (f"only {above:.3f} is free over the head, so the pictures go under the "
                                        f"face where {below:.3f} is free")
    else:
        sys.exit(f"this framing leaves no room for a layer: {above:.3f} free over the head and {below:.3f} under "
                 f"the chin, and a picture needs {CARD_MIN:.2f}. The face fills the frame. Reframe with the head "
                 "smaller, or further down, and read it again.")

    return {
        "layout": layout,
        "why": why,
        "cardTopFrac": card_top,
        "cardBottomFrac": card_bottom,
        "titleTopFrac": round(max(0.15, head_top - 0.13), 3) if layout == "picturesAbove" else stack_top,
        "baselineYFrac": baseline,
        "stackTopFrac": stack_top,
        "ctaYFrac": cta,
    }


def arg(flag, default=None):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def grab(video: Path, seconds, out_dir: Path):
    frames = []
    for s in seconds:
        f = out_dir / f"fit-{s:.1f}.png"
        r = subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(s), "-i", str(video),
                            "-frames:v", "1", str(f)], capture_output=True)
        if f.exists() and f.stat().st_size:
            frames.append((s, f))
    return frames


def detect(path: Path):
    """The face box and the five landmarks, as shares of the frame."""
    img = cv2.imread(str(path))
    if img is None:
        return None
    h, w = img.shape[:2]
    det = cv2.FaceDetectorYN.create(str(MODEL), "", (w, h), score_threshold=0.7)
    det.setInputSize((w, h))
    n, faces = det.detect(img)
    if faces is None or not len(faces):
        return None
    # the speaker is the largest face: a photograph on the wall behind them is always smaller
    f = max(faces, key=lambda r: r[2] * r[3])
    x, y, bw, bh = f[:4]
    out = {"top": y / h, "bottom": (y + bh) / h, "left": x / w, "right": (x + bw) / w}
    for i, name in enumerate(LM):
        out[name] = (f[4 + i * 2] / w, f[5 + i * 2] / h)
    return out


def hair_top(path: Path, face, wall_rows=(0.04, 0.10), thresh=28, need=10):
    """Scan up from the face box through the face's own columns until the wall colour returns.

    The wall colour is the median of the same columns near the top of the frame. The head top is
    the first row, going up from the forehead, where `need` rows in a row sit within `thresh` of
    it. When no wall is found the box top is the honest answer, and it is reported as such.
    """
    im = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32)
    h, w = im.shape[:2]
    x0 = int(face["left"] * w) + int(0.15 * (face["right"] - face["left"]) * w)
    x1 = int(face["right"] * w) - int(0.15 * (face["right"] - face["left"]) * w)
    if x1 <= x0:
        return face["top"], False
    cols = im[:, x0:x1, :].mean(axis=1)
    wall = np.median(cols[int(wall_rows[0] * h):int(wall_rows[1] * h)], axis=0)
    run = 0
    for y in range(int(face["top"] * h), int(wall_rows[1] * h), -1):
        if np.abs(cols[y] - wall).sum() < thresh:
            run += 1
            if run >= need:
                return (y + need) / h, True
        else:
            run = 0
    return face["top"], False


def sheet(frames, read, out: Path):
    """The proof. Every number drawn on the frame it came from, on a five per cent grid."""
    tiles = []
    for _, f in frames:
        im = Image.open(f).convert("RGB")
        w, h = im.size
        d = ImageDraw.Draw(im)
        for k in range(1, 20):
            y = int(k * 0.05 * h)
            d.line([(0, y), (w, y)], fill=(255, 255, 255), width=1)
            d.text((6, y - 14), f"{k * 0.05:.2f}", fill=(255, 255, 255))
        for key, col in (("headTopFrac", (224, 120, 80)), ("chinFrac", (224, 120, 80)),
                         ("eyesFrac", (255, 255, 255)), ("mouthFrac", (255, 255, 255)),
                         ("micFrac", (120, 200, 255)), ("handsFrac", (120, 200, 255))):
            v = read.get(key)
            if v is None:
                continue
            y = int(v * h)
            d.line([(0, y), (w, y)], fill=col, width=3)
            d.text((w - 300, y - 18), f"{key} {v:.3f}", fill=col)
        for key in ("cardTopFrac", "cardBottomFrac", "titleTopFrac", "baselineYFrac", "stackTopFrac", "ctaYFrac"):
            y = int(read["fit"][key] * h)
            d.line([(int(0.68 * w), y), (w, y)], fill=(255, 210, 80), width=2)
            d.text((int(0.68 * w) + 4, y + 3), f"{key} {read['fit'][key]:.3f}", fill=(255, 210, 80))
        tiles.append(im.resize((w // 2, h // 2)))
    sh = Image.new("RGB", (sum(t.width for t in tiles), tiles[0].height), (0, 0, 0))
    x = 0
    for t in tiles:
        sh.paste(t, (x, 0))
        x += t.width
    sh.save(out, quality=88)


def main() -> int:
    P = Path(sys.argv[1]).resolve()
    if not MODEL.exists():
        sys.exit(f"face model missing: {MODEL}")
    video = Path(arg("--video")) if arg("--video") else next(
        (P / n for n in ("master.mp4", "mezzanine.mp4", "spine.mp4", "source.mp4") if (P / n).exists()), None)
    if video is None or not video.exists():
        sys.exit("no video to measure: pass --video, or put master.mp4 in the project")
    seconds = [float(s) for s in (arg("--at") or "1.0,4.0,20.0").split(",")]
    dur = float(subprocess.run(["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
                                "-of", "csv=p=0", str(video)], capture_output=True, text=True).stdout.strip() or 0)
    seconds = [s for s in seconds if s < max(dur - 0.2, 0.2)] or [max(dur / 2, 0.2)]
    work = P / "checks"
    work.mkdir(parents=True, exist_ok=True)
    frames = grab(video, seconds, work)
    found = [(s, f, d) for s, f, d in ((s, f, detect(f)) for s, f in frames) if d]
    if not found:
        sys.exit(f"no face found in {len(frames)} frames of {video.name}. "
                 "A talking head is the one thing this format needs to see.")

    def med(fn):
        # numpy floats do not serialise, and a measurement that cannot be written down is not one
        return round(float(statistics.median([float(fn(d)) for _, _, d in found])), 4)

    hairs = [hair_top(f, d) for _, f, d in found]
    head_top = round(float(statistics.median([float(h) for h, _ in hairs])), 4)
    walled = sum(1 for _, ok in hairs if ok)
    chin = med(lambda d: d["bottom"])
    read = {
        "measuredOn": [f"{s:.1f}s" for s, _, _ in found],
        "video": str(video.resolve()),
        "headTopFrac": head_top,
        "faceTopFrac": med(lambda d: d["top"]),
        "eyesFrac": med(lambda d: (d["eyeR"][1] + d["eyeL"][1]) / 2),
        "noseFrac": med(lambda d: d["nose"][1]),
        "mouthFrac": med(lambda d: (d["mouthR"][1] + d["mouthL"][1]) / 2),
        "chinFrac": chin,
        "faceLeftFrac": med(lambda d: d["left"]),
        "faceRightFrac": med(lambda d: d["right"]),
        "micFrac": float(arg("--mic")) if arg("--mic") else None,
        "handsFrac": float(arg("--hands")) if arg("--hands") else None,
        "fit": place(head_top, chin,
                     float(arg("--mic")) if arg("--mic") else None,
                     float(arg("--hands")) if arg("--hands") else None),
        "how": {
            "face": "opencv.FaceDetectorYN (YuNet, MIT), the largest face in each frame, median of "
                    f"{len(found)} frames",
            "headTop": f"wall colour scan above the face box, found on {walled} of {len(found)} frames"
                       + ("" if walled else "; no wall was found, so this is the box top and it is probably low"),
            "fit": "derived from the measurement and the law, not measured. Which side of the face holds the "
                   "pictures is decided here; the numbers inside it are starting points, changed by a person "
                   "who has looked at read.png",
        },
    }
    (P / "read.json").write_text(json.dumps(read, indent=1) + "\n")
    from workflow import steps
    steps(P)
    sheet(frames, read, P / "read.png")
    for _, f in frames:
        f.unlink(missing_ok=True)
    print(json.dumps(read["fit"], indent=1))
    print(f"\nhead top {head_top:.3f}   chin {chin:.3f}   measured on {', '.join(read['measuredOn'])}")
    print(f"{read['fit']['layout']}: {read['fit']['why']}")
    print(f"wrote {P/'read.json'}\n      {P/'read.png'}")
    print("next: open read.png. Every line is drawn on the frame it came from. Read the mic and the "
          "hands off the grid and pass --mic / --hands if the layer needs them.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(main())
    from workflow import working
    with working(Path(sys.argv[1]), 'Measuring your footage'):
        result = main()
        if result:
            raise SystemExit(result)
    sys.exit(result)
