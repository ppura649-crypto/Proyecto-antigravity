#!/usr/bin/env python3
"""Stage 5: cuts.json -> spine.mp4 (kept clips, frame-exact filter-graph re-encode).

Usage: python3 render_spine.py <project_dir> [--preset veryfast] [--crf 18]

Also writes spine-map.json (source ms -> spine ms per clip) for the caption stage.
Run contact_sheet.py after for the self-eval sheet.
"""
import json

FPS = 30
import subprocess
import sys
from pathlib import Path

FFMPEG = "ffmpeg"


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"ffmpeg failed:\n{r.stderr[-2000:]}")


def main():
    proj = Path(sys.argv[1])
    args = dict(zip(sys.argv[2::2], sys.argv[3::2]))
    preset = args.get("--preset", "veryfast")
    crf = args.get("--crf", "18")

    doc = json.loads((proj / "cuts.json").read_text())
    src = (proj / "source.txt").read_text().strip()
    clips = [c for c in doc["clips"] if c["keep"]]
    if not clips:
        sys.exit("no kept clips")

    # expand innerCuts: each clip becomes 1+ playable segments
    segments = []
    for c in clips:
        edges = [c["inMs"]]
        for g in sorted(c.get("innerCuts", []), key=lambda g: g["fromMs"]):
            edges += [g["fromMs"], g["toMs"]]
        edges.append(c["outMs"])
        for j in range(0, len(edges), 2):
            a, b = edges[j], edges[j + 1]
            if b - a >= 40:
                segments.append({"clip": c["id"], "inMs": a, "outMs": b})

    # Every segment edge snaps to a FRAME boundary, so the video piece and the audio piece
    # of a segment are exactly the same length (N frames = N*1600 samples at 48 kHz). With
    # millisecond edges the video trim rounds to whole frames while the audio does not, and
    # concat then pads: on one video (35 segments) the audio came out 183 ms longer than
    # the video and the map, the drift growing seam by seam, so every caption and every
    # lip landed early by the end (2026-09-05). Frame-snapped edges make spine-map.json
    # exact for both streams.
    for g in segments:
        fa, fb = round(g["inMs"] * FPS / 1000), round(g["outMs"] * FPS / 1000)
        if fb <= fa:
            fb = fa + 1
        g["inFrame"], g["outFrame"] = fa, fb

    # filter script: trim each segment, concat all
    parts, labels = [], []
    for i, g in enumerate(segments):
        fa, fb = g["inFrame"], g["outFrame"]
        # video: half a frame of slack so frames fa..fb-1 are kept whatever the pts rounding
        parts.append(f"[0:v]trim=start={(fa - 0.5) / FPS:.6f}:end={(fb - 0.5) / FPS:.6f},setpts=PTS-STARTPTS[v{i}];")
        s, e = fa / FPS, fb / FPS
        # 3 ms fades at both ends of every segment: a seam that lands on a word's decay
        # (-45 dB) against the next clip's room tone (-63 dB) is a step, and a step is a
        # click (verify_cut check 3 failed on one video clip 75, 2026-09-05). 3 ms is
        # under any phoneme; the timing of the cut does not move.
        fo = max(0.0, (e - s) - 0.003)
        parts.append(f"[0:a]atrim=start={s:.6f}:end={e:.6f},asetpts=PTS-STARTPTS,"
                     f"afade=t=in:st=0:d=0.003,afade=t=out:st={fo:.3f}:d=0.003[a{i}];")
        labels.append(f"[v{i}][a{i}]")
    parts.append(f"{''.join(labels)}concat=n={len(segments)}:v=1:a=1[vout][aout]")
    script = proj / "spine-filter.txt"
    script.write_text("".join(parts))

    run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-i", src,
         "-/filter_complex", str(script),
         "-map", "[vout]", "-map", "[aout]",
         "-c:v", "libx264", "-g", "1", "-crf", crf, "-preset", preset,
         "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
         str(proj / "spine.mp4")])

    # spine-map: where each source segment landed on the spine timeline (frame-exact;
    # the ms values are the snapped edges, not the cuts.json ms)
    t, mapping = 0, []
    for g in segments:
        n = g["outFrame"] - g["inFrame"]
        mapping.append({"id": g["clip"],
                        "srcInMs": round(g["inFrame"] * 1000 / FPS), "srcOutMs": round(g["outFrame"] * 1000 / FPS),
                        "srcInFrame": g["inFrame"], "srcOutFrame": g["outFrame"],
                        "spineInMs": round(t * 1000 / FPS), "spineOutMs": round((t + n) * 1000 / FPS),
                        "spineInFrame": t, "spineOutFrame": t + n})
        t += n
    (proj / "spine-map.json").write_text(json.dumps(
        {"spineDurationMs": round(t * 1000 / FPS), "fps": FPS, "frames": t, "segments": mapping}, indent=1))
    t = round(t * 1000 / FPS)

    print(f"spine.mp4: {t/1000:.1f}s from {len(clips)} clips ({len(segments)} segments)")


if __name__ == "__main__":
    main()
