#!/usr/bin/env python3
"""spine.mp4 -> master.mp4: the voice mastered, the picture copied.

Goal. One file every later stage reads, whose picture is the spine frame for frame and whose
voice sits at the loudness a phone expects.

Reasoning. Two passes of loudnorm: the first measures, the second applies the measured values
linearly, which is the only way loudnorm keeps the dynamics instead of pumping. A high-pass at
70 Hz takes the room and the desk out from under the voice; a light spectral denoise takes the
hiss; the true-peak limiter runs 4x oversampled so a -1 dBTP ceiling holds on the phone's own
decoder. The video stream is copied, never re-encoded, so master.mp4 and spine.mp4 hold the
same pixels and either can be the base the layer is laid over.

Counter-example. A single-pass loudnorm, or a denoise set by ear on one room and kept for the
next: measure this file, every time.

Usage: python3 master_audio.py <project_dir>
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

FFMPEG = os.environ.get("KEYFRAMES_FFMPEG", "ffmpeg")
CHAIN = "highpass=f=70,afftdn=nr=8:nf=-58"
TARGET = "loudnorm=I=-14:TP=-1:LRA=11"


def main() -> int:
    P = Path(sys.argv[1]).resolve()
    spine = P / "spine.mp4"
    if not spine.exists():
        sys.exit("spine.mp4 is missing: render the cut first (render_spine.py), or take.py whole for an uncut take")
    r = subprocess.run([FFMPEG, "-y", "-v", "info", "-i", str(spine), "-af", f"{CHAIN},{TARGET}:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr, re.S)
    if not m:
        sys.exit("loudnorm did not measure the spine: " + r.stderr[-600:])
    j = json.loads(m.group(0))
    (P / "ln.json").write_text(json.dumps(j, indent=1) + "\n")
    applied = (f"{CHAIN},{TARGET}:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
               f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,"
               "aresample=192000,alimiter=level_in=1:level_out=1:limit=0.80:attack=5:release=50:level=disabled,aresample=48000")
    tmp = P / "master.tmp.mp4"
    r = subprocess.run([FFMPEG, "-y", "-v", "error", "-i", str(spine), "-af", applied,
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(tmp)],
                       capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("mastering failed: " + r.stderr[-600:])
    os.replace(tmp, P / "master.mp4")
    print(f"measured: {j['input_i']} LUFS  TP {j['input_tp']}  LRA {j['input_lra']}")
    r = subprocess.run([FFMPEG, "-hide_banner", "-i", str(P / "master.mp4"), "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    tail = r.stderr[r.stderr.rfind("Summary"):]
    print("--- master.mp4 measured ---")
    for line in tail.splitlines():
        if re.match(r"\s+(I|LRA|Peak):", line):
            print(line.strip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
