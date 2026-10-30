#!/usr/bin/env python3
"""Check 5 of references/01b-verifying-a-cut.md: the gaze tile.

The LAST 3 frames of every clip, cropped to the eye band and tiled, so a dropped gaze on the
frame the viewer actually sees is visible in one picture: "look at each frame at the end of
the cut, and see if we have someone looking down or not looking at the camera anymore".

Frames are pulled by explicit frame number through one `select` pass over the spine, in
ascending order, so the `%d` trap cannot bite: `ffmpeg -frames:v N` with `%d` numbers files
from 1, and reading 0..N-1 silently drops the frame that actually matters.

--from-source reads the same frames out of the ORIGINAL clip instead of spine.mp4. The spine is
the source's frames copied, cut to cut, so the eyes on a clip's last frame can be read before
anything is rendered: the cut runs gaze_tile first, the nudges go into cuts.json, and the spine
is rendered once instead of twice. The map from a spine frame to a source frame is
spine-map.json when it belongs to these cuts, and cuts.json itself when nothing is rendered yet.
Same tiles, same names, same rows: only the file the pixels come from changes.

Usage: python3 gaze_tile.py <project_dir> [--from-source] [--band 0.53,0.68] [--x 0.26,0.74] [--per-sheet 7]
"""
import json, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageDraw

FPS = 30


def segments_from_cuts(P):
    """The segments render_spine.py will cut, derived the same way: inner cuts expanded, every
    edge snapped to a frame, segments under 40 ms dropped, in the order the file lists them."""
    doc = json.loads((P / "cuts.json").read_text())
    segs, t = [], 0
    for c in [c for c in doc["clips"] if c["keep"]]:
        edges = [c["inMs"]]
        for g in sorted(c.get("innerCuts", []), key=lambda g: g["fromMs"]):
            edges += [g["fromMs"], g["toMs"]]
        edges.append(c["outMs"])
        for j in range(0, len(edges), 2):
            a, b = edges[j], edges[j + 1]
            if b - a < 40:
                continue
            fa, fb = round(a * FPS / 1000), round(b * FPS / 1000)
            if fb <= fa:
                fb = fa + 1
            n = fb - fa
            segs.append({"id": c["id"], "srcInFrame": fa, "srcOutFrame": fb,
                         "srcInMs": round(fa * 1000 / FPS), "srcOutMs": round(fb * 1000 / FPS),
                         "spineInFrame": t, "spineOutFrame": t + n,
                         "spineInMs": round(t * 1000 / FPS), "spineOutMs": round((t + n) * 1000 / FPS)})
            t += n
    return segs, t


def frames_of(seg):
    """A map written before the frame numbers were carried still has its milliseconds."""
    for name in ("srcIn", "srcOut", "spineIn", "spineOut"):
        seg.setdefault(f"{name}Frame", int(round(seg[f"{name}Ms"] / 1000 * FPS)))
    return seg


def source_frame(segs, n):
    """The source frame whose pixels the spine shows at spine frame n."""
    for s in segs:
        if s["spineInFrame"] <= n < s["spineOutFrame"]:
            return s["srcInFrame"] + (n - s["spineInFrame"])
    last = segs[-1] if n >= segs[-1]["spineOutFrame"] else segs[0]
    return min(max(last["srcInFrame"], last["srcInFrame"] + (n - last["spineInFrame"])), last["srcOutFrame"] - 1)


def pull_source(src, frames, tmp):
    """The named frames out of the original clip, one pass per run of neighbours (the three frames
    of a clip are neighbours), each pass seeking straight to its run instead of decoding the file."""
    runs = []
    for n in frames:
        if runs and n - runs[-1][-1] <= 2:
            runs[-1].append(n)
        else:
            runs.append([n])
    got = {}
    for r in runs:
        first, count = r[0], r[-1] - r[0] + 1
        # Half a frame BEFORE the frame, the same slack render_spine.py's trim uses: a seek keeps
        # the first frame whose pts is at or past the target, so seeking into the middle of frame
        # n hands back frame n+1 and every tile would show the wrong frame by one.
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{max(0, first - 0.5) / FPS:.6f}", "-i", str(src),
                        "-frames:v", str(count), "-fps_mode", "passthrough", "-q:v", "3",
                        str(tmp / f"s{first:06d}_%03d.jpg")], check=True)
        files = sorted(tmp.glob(f"s{first:06d}_*.jpg"))
        assert len(files) == count, f"frame {first}: got {len(files)} frames, wanted {count}"
        for n, f in zip(range(first, first + count), files):
            got[n] = f
    return got


def main():
    P = Path(sys.argv[1])
    args = [x for x in sys.argv[2:] if x != "--from-source"]
    from_source = "--from-source" in sys.argv[2:]
    a = dict(zip(args[0::2], args[1::2]))
    # The eye band comes from read.json (read_fit.py measures it on THIS clip); a fixed default
    # is one speaker's framing and shows another speaker's chin.
    geo = json.loads((P / "read.json").read_text()) if (P / "read.json").exists() else {}
    if geo.get("eyesFrac") and "--band" not in a:
        a["--band"] = f"{geo['eyesFrac'] - 0.055:.3f},{geo['eyesFrac'] + 0.075:.3f}"
    if geo.get("faceLeftFrac") and "--x" not in a:
        a["--x"] = f"{max(0, geo['faceLeftFrac'] - 0.06):.3f},{min(1, geo['faceRightFrac'] + 0.06):.3f}"
    y0, y1 = [float(v) for v in a.get("--band", "0.53,0.68").split(",")]
    x0, x1 = [float(v) for v in a.get("--x", "0.26,0.74").split(",")]
    per = int(a.get("--per-sheet", 7))

    if from_source:
        # The cut as it stands is what the viewer will see, so the map is checked against it: a
        # spine-map.json left by an earlier render belongs to earlier cuts, and cuts.json wins.
        derived, _ = segments_from_cuts(P)
        segs, mapped = derived, P / "spine-map.json"
        if mapped.exists():
            recorded = [frames_of(s) for s in json.loads(mapped.read_text())["segments"]]
            key = lambda ss: [(s["id"], s["srcInFrame"], s["srcOutFrame"]) for s in ss]
            if key(recorded) == key(derived):
                segs = recorded
            else:
                print("spine-map.json is not the map of these cuts: reading the frames through cuts.json")
        total = segs[-1]["spineOutFrame"]
    else:
        segs = [frames_of(s) for s in json.loads((P / "spine-map.json").read_text())["segments"]]
    # last 3 frames of each clip, the LAST one last
    picks = []
    for s in segs:
        last = int(round(s["spineOutMs"] / 1000 * FPS)) - 1
        for n in (last - 2, last - 1, last):
            picks.append((max(0, n), s["id"], n == last))
    order = sorted(range(len(picks)), key=lambda i: picks[i][0])

    tmp = Path(tempfile.mkdtemp())
    # Frame numbers are clamped to the spine's real frame count (the last clip's "last frame"
    # computed from spineOutMs can land one or two past the end: "got 7 frames, wanted 9") and pulled ONCE each; picks then map to files by frame number.
    if not from_source:
        total = int(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets",
                                    "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0",
                                    str(P / "spine.mp4")], capture_output=True, text=True).stdout.strip() or 0)
    if total:
        picks = [(min(n, total - 1), cid, last) for n, cid, last in picks]
    frames = sorted({n for n, _, _ in picks})
    got = {}
    if from_source:
        src = (P / "source.txt").read_text().strip()
        pulled = pull_source(src, sorted({source_frame(segs, n) for n in frames}), tmp)
        got = {n: pulled[source_frame(segs, n)] for n in frames}
    else:
        # ffmpeg's expression parser gives up ("Cannot allocate memory") past ~100 eq() terms
        # (36 clips = 108 frames), so the frames are pulled in batches
        # of 30, each batch its own pass over the spine.
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
