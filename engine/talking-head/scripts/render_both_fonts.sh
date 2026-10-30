#!/bin/bash
set -e
cd "$(dirname "$0")/.."
P=projects/edit-a
ramp() {
  ffmpeg -y -v error -i $P/captioned.mp4 -filter_complex "[0:v]trim=0:4.785,setpts=(PTS-STARTPTS)/1.1[v1];[0:a]atrim=0:4.785,asetpts=PTS-STARTPTS,atempo=1.1[a1];[0:v]trim=4.785,setpts=PTS-STARTPTS[v2];[0:a]atrim=4.785,asetpts=PTS-STARTPTS[a2];[v1][a1][v2][a2]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k "$1"
}
node remotion/render.mjs $P
ramp ~/Downloads/talking-head-edit-a-creator-format-1-captions-dynapuff.mp4
python3 - <<'PY'
import json
f = json.load(open("formats/creator-format-1.json"))
f["accentFontFamily"] = "Zen Dots, cursive"
json.dump(f, open("formats/creator-format-1.json", "w"), indent=2)
PY
python3 scripts/build_captions.py $P
node remotion/render.mjs $P
ramp ~/Downloads/talking-head-edit-a-creator-format-1-captions-zendots.mp4
echo ALL DONE
