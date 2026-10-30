#!/usr/bin/env python3
"""Frame-by-frame ledger of a reference reel (every frame, not a sample).

Usage:
  style_ledger.py <ref_dir>                 # frames/all (540 wide, every frame) + ledger.csv + events.json + index sheets
  style_ledger.py <ref_dir> --full 12,13,90 # full-res PNGs of those frame numbers into frames/full/

ref_dir holds reel.mp4. Per frame the ledger records, for the whole frame and four bands
(top 0-0.35H, mid 0.35-0.62H, cap 0.62-0.85H, bot 0.85-1H): motion (mean abs diff vs the
previous frame), edge density (Sobel mean, UI/text is sharp, skin and wall are soft),
sharpness (Laplacian variance, drops when she blurs the footage), luma and saturation.
events.json is only an index of candidate overlay runs from the top+mid edge signal; the
analysis itself is done by looking at the frames, one by one.
"""
import csv
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw

BANDS = {"top": (0.0, 0.35), "mid": (0.35, 0.62), "cap": (0.62, 0.85), "bot": (0.85, 1.0)}
LW, LH = 180, 320  # analysis resolution


def meta(video):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate,nb_frames", "-show_entries",
                          "format=duration", "-of", "json", video], capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    s = d["streams"][0]
    num, den = s["r_frame_rate"].split("/")
    fps = float(num) / float(den)
    return {"width": int(s["width"]), "height": int(s["height"]), "fps": round(fps, 3),
            "nbFrames": int(s.get("nb_frames") or 0), "durationSec": round(float(d["format"]["duration"]), 3)}


def extract_all(video, outdir, width=540):
    os.makedirs(outdir, exist_ok=True)
    if len([f for f in os.listdir(outdir) if f.endswith(".jpg")]) > 10:
        return
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", f"scale={width}:-2", "-q:v", "4",
                    "-start_number", "0", os.path.join(outdir, "f%05d.jpg")], check=True)


def full_frames(video, outdir, frames):
    os.makedirs(outdir, exist_ok=True)
    for n in frames:
        out = os.path.join(outdir, f"f{n:05d}.png")
        if os.path.exists(out):
            continue
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", f"select=eq(n\\,{n})", "-vframes", "1", out], check=True)
        print(out)


def stream_lowres(video):
    """Yield float32 RGB arrays (LH, LW, 3) for every frame."""
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", video, "-vf", f"scale={LW}:{LH}", "-f", "rawvideo",
                          "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = LW * LH * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        yield np.frombuffer(buf, np.uint8).reshape(LH, LW, 3).astype(np.float32)
    p.wait()


def stats(rgb, prev):
    gray = rgb.mean(axis=2)
    gx = np.abs(np.diff(gray, axis=1))[:-1, :]
    gy = np.abs(np.diff(gray, axis=0))[:, :-1]
    edge = gx + gy
    lap = np.abs(gray[1:-1, 1:-1] * 4 - gray[:-2, 1:-1] - gray[2:, 1:-1] - gray[1:-1, :-2] - gray[1:-1, 2:])
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    diff = np.abs(rgb - prev).mean(axis=2) if prev is not None else np.zeros_like(gray)
    row = {}
    for name, (a, b) in [("all", (0.0, 1.0))] + list(BANDS.items()):
        y0, y1 = int(a * LH), int(b * LH)
        sl = slice(max(y0, 1), min(y1, LH - 1))
        row[f"{name}_motion"] = round(float(diff[y0:y1].mean()), 2)
        row[f"{name}_edge"] = round(float(edge[sl, :].mean()), 2)
        row[f"{name}_sharp"] = round(float(lap[sl, :].var()), 1)
        row[f"{name}_luma"] = round(float(gray[y0:y1].mean()), 1)
        row[f"{name}_sat"] = round(float(sat[y0:y1].mean()), 3)
    return row


def build_ledger(video, fps, out_csv):
    rows, prev = [], None
    for i, rgb in enumerate(stream_lowres(video)):
        r = {"frame": i, "tMs": int(round(i * 1000 / fps))}
        r.update(stats(rgb, prev))
        rows.append(r)
        prev = rgb
    with open(out_csv, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    return rows


def segment(rows, fps):
    """Candidate overlay runs. Two signals: the footage goes blurred (bot_sharp collapses,
    her focus-takeover state) or the top/mid bands grow sharper than the clear-footage
    baseline (a title, a file, a chapter label drawn on clear footage)."""
    top = np.array([r["top_edge"] for r in rows])
    mid = np.array([r["mid_edge"] for r in rows])
    sharp = np.array([r["bot_sharp"] for r in rows])
    motion = np.array([r["top_motion"] + r["mid_motion"] for r in rows])
    base_top, base_mid = np.percentile(top, 20), np.percentile(mid, 20)
    clear_sharp = np.percentile(sharp, 60)
    blurred = sharp < clear_sharp * 0.15
    on = blurred | (top > base_top + 1.0) | (mid > base_mid + 1.5)
    events, start = [], None
    for i, v in enumerate(list(on) + [False]):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= int(fps * 0.2):
                seg = slice(start, i)
                spikes = [int(j) for j in np.where(motion[seg] > 4)[0] + start]
                events.append({"id": len(events) + 1, "fromFrame": start, "toFrame": i - 1,
                               "fromMs": rows[start]["tMs"], "toMs": rows[i - 1]["tMs"],
                               "durMs": rows[i - 1]["tMs"] - rows[start]["tMs"],
                               "blurredFootage": bool(blurred[seg].mean() > 0.5),
                               "peakTopEdge": round(float(top[seg].max()), 1),
                               "peakMidEdge": round(float(mid[seg].max()), 1),
                               "motionSpikeFrames": spikes[:40]})
            start = None
    return {"baseTopEdge": round(float(base_top), 2), "baseMidEdge": round(float(base_mid), 2),
            "clearSharp": round(float(clear_sharp), 1), "events": events}


def index_sheets(frames_dir, out_dir, fps, step=6, cols=10, rows_per=8):
    """Navigation only: every `step`-th frame, labelled with its frame number."""
    os.makedirs(out_dir, exist_ok=True)
    names = sorted(f for f in os.listdir(frames_dir) if f.endswith(".jpg"))
    picks = names[::step]
    tw, th = 216, 384
    per = cols * rows_per
    for s in range(0, len(picks), per):
        sheet = Image.new("RGB", (cols * tw, rows_per * (th + 18)), "black")
        d = ImageDraw.Draw(sheet)
        for k, name in enumerate(picks[s:s + per]):
            im = Image.open(os.path.join(frames_dir, name)).resize((tw, th))
            x, y = (k % cols) * tw, (k // cols) * (th + 18)
            sheet.paste(im, (x, y))
            n = int(name[1:6])
            d.text((x + 4, y + th + 2), f"f{n} {n / fps:.2f}s", fill="white")
        sheet.save(os.path.join(out_dir, f"index-{s // per + 1:02d}.jpg"), quality=80)


def main():
    ref = sys.argv[1].rstrip("/")
    video = os.path.join(ref, "reel.mp4")
    m = meta(video)
    if "--full" in sys.argv:
        frames = [int(x) for x in sys.argv[sys.argv.index("--full") + 1].split(",")]
        full_frames(video, os.path.join(ref, "frames", "full"), frames)
        return
    json.dump(m, open(os.path.join(ref, "meta.json"), "w"), indent=1)
    extract_all(video, os.path.join(ref, "frames", "all"))
    rows = build_ledger(video, m["fps"], os.path.join(ref, "ledger.csv"))
    ev = segment(rows, m["fps"])
    ev.update({"fps": m["fps"], "frames": len(rows)})
    json.dump(ev, open(os.path.join(ref, "events.json"), "w"), indent=1)
    index_sheets(os.path.join(ref, "frames", "all"), os.path.join(ref, "frames", "index"), m["fps"])
    print(f"{ref}: {len(rows)} frames @ {m['fps']} fps, {len(ev['events'])} candidate overlay runs")
    for e in ev["events"]:
        print(f"  #{e['id']:2d} f{e['fromFrame']:5d}-{e['toFrame']:5d}  {e['fromMs'] / 1000:6.2f}-{e['toMs'] / 1000:6.2f}s  {'BLUR ' if e['blurredFootage'] else 'clear'}  top {e['peakTopEdge']:5.1f} mid {e['peakMidEdge']:5.1f}  spikes {len(e['motionSpikeFrames'])}")


if __name__ == "__main__":
    main()
