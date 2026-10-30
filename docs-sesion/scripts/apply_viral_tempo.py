#!/usr/bin/env python3
import json, shutil, subprocess
from pathlib import Path

REEL = Path("/Users/rol.travel/.gemini/antigravity/scratch/keyframes/engine/full-visual/reels/battery-myth")
TEMPO = 1.12

pre_mp3 = REEL / "voice.pre_tempo.mp3"
pre_al = REEL / "voice.alignment.pre_tempo.json"
mp3 = REEL / "voice.mp3"
al_path = REEL / "voice.alignment.json"

if not pre_mp3.exists():
    shutil.copy(mp3, pre_mp3)
    shutil.copy(al_path, pre_al)

tmp_mp3 = REEL / "voice.tempo_tmp.mp3"
subprocess.run(
    [
        "ffmpeg",
        "-y",
        "-v",
        "error",
        "-i",
        str(pre_mp3),
        "-af",
        f"atempo={TEMPO}",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        str(tmp_mp3),
    ],
    check=True,
)
tmp_mp3.replace(mp3)

doc = json.loads(pre_al.read_text())
al = doc["alignment"]
al["character_start_times_seconds"] = [round(t / TEMPO, 4) for t in al["character_start_times_seconds"]]
al["character_end_times_seconds"] = [round(t / TEMPO, 4) for t in al["character_end_times_seconds"]]
doc["viral_tempo"] = TEMPO
al_path.write_text(json.dumps(doc, ensure_ascii=False))

dur = float(
    subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
)
print(f"Applied pitch-preserved viral tempo {TEMPO}x -> {dur:.2f} s ({149 / dur:.2f} words/sec)")
