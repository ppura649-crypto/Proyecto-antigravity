#!/usr/bin/env python3
"""gaze_freeze.py <project>: apply projects/<id>/gaze-freeze.json to master.mp4.

The gaze tile showed their eyes dropping INSIDE the last word of a clip, with no frame to cut
to (edit-c-chip 2026-09-05: the end, 71.933-72.200 while "more." runs to 72.064; and
10.167-10.333 before the cut at 10.367). The fix the creator picked from an A/B ("the second is
perfect", "10s B last eyes up frame is perfect"): hold the last eyes-up frame over those
frames. Video only; the audio is untouched, so captions, visuals and the sound stage keep
their times. The pre-freeze master is kept as master-pre-gaze.mp4 and the file records what
was applied (idempotent).

gaze-freeze.json: {"freezes": [{"fromMs": 71933, "toMs": 72233, "holdMs": 71900}, ...]}
  fromMs/toMs = spine ms of the frames to replace (toMs exclusive), holdMs = the frame to hold.
Re-encodes all-intra (H.264 -g 1) like every master, frame-accurate for Remotion.
"""
import json, subprocess, sys
from pathlib import Path

P = Path(sys.argv[1]); J = P / "gaze-freeze.json"
d = json.load(open(J))
if d.get("applied"):
    print("already applied:", d["applied"]); sys.exit(0)
fps = json.load(open(P / "spine-map.json"))["fps"]
src = P / "master.mp4"; keep = P / "master-pre-gaze.mp4"; out = P / "master-gaze-tmp.mp4"
if not keep.exists(): keep.write_bytes(src.read_bytes())
n = len(d["freezes"])
fr = lambda ms: int(round(ms * fps / 1000))
parts = [f"[0:v]split={n + 1}" + "".join(f"[s{i}]" for i in range(n + 1))]
cur = "[s0]"
for i, f in enumerate(d["freezes"]):
    a, b, r = fr(f["fromMs"]), fr(f["toMs"]) - 1, fr(f["holdMs"])
    parts.append(f"{cur}[s{i + 1}]freezeframes=first={a}:last={b}:replace={r}[v{i}]")
    cur = f"[v{i}]"
    print(f"freeze frames {a}..{b} <- {r}  ({f['fromMs']}-{f['toMs']} ms, hold {f['holdMs']})")
cmd = ["ffmpeg", "-y", "-v", "error", "-i", str(keep), "-filter_complex", ";".join(parts),
       "-map", cur, "-map", "0:a?", "-c:v", "libx264", "-g", "1", "-crf", "18", "-preset", "slow",
       "-pix_fmt", "yuv420p", "-c:a", "copy", str(out)]
subprocess.run(cmd, check=True)
out.replace(src)
d["applied"] = {"fps": fps, "frames": [[fr(f["fromMs"]), fr(f["toMs"]) - 1, fr(f["holdMs"])] for f in d["freezes"]]}
json.dump(d, open(J, "w"), indent=1)
print("master.mp4 rewritten; pre-freeze copy at", keep.name)
