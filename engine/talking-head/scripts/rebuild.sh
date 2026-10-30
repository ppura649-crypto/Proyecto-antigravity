#!/bin/bash
# Re-run the chain after a cuts.json save: spine -> master -> captions.
# Usage: scripts/rebuild.sh <project_dir>   (then: node remotion/render.mjs <project_dir>)
set -e
P="$(cd "$1" && pwd)"
cd "$(dirname "$0")/.."
python3 scripts/render_spine.py "$P" --preset fast
cd "$P"
ffmpeg -y -v info -i spine.mp4 -af "highpass=f=70,afftdn=nr=8:nf=-58,loudnorm=I=-14:TP=-1:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/{/,/}/p' > ln.json
python3 - <<'EOF'
import json
j = json.load(open('ln.json'))
open('master.cmd', 'w').write(
    "ffmpeg -y -v error -i spine.mp4 -af 'highpass=f=70,afftdn=nr=8:nf=-58,"
    f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
    f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:"
    f"offset={j['target_offset']}:linear=true' -c:v copy -c:a aac -b:a 192k master.mp4")
EOF
sh master.cmd && rm master.cmd
cd - >/dev/null
python3 scripts/build_captions.py "$P"
