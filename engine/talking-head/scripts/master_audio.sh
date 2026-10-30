#!/bin/bash
# spine.mp4 -> master.mp4 : highpass + denoise + two-pass loudnorm to -14 LUFS + true-peak limiter.
# Video is copied, never re-encoded.
set -e
P="$(cd "$1" && pwd)"
CHAIN="highpass=f=70,afftdn=nr=8:nf=-58"
cd "$P"
ffmpeg -y -v info -i spine.mp4 -af "$CHAIN,loudnorm=I=-14:TP=-1:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/{/,/}/p' > ln.json
python3 - "$CHAIN" <<'PY'
import json,sys
j=json.load(open('ln.json')); chain=sys.argv[1]
open('master.cmd','w').write(
  "ffmpeg -y -v error -i spine.mp4 -af '"+chain+",loudnorm=I=-14:TP=-1:LRA=11:"
  f"measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:"
  f"measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,"
  "aresample=192000,alimiter=level_in=1:level_out=1:limit=0.80:attack=5:release=50:level=disabled,aresample=48000' "
  "-c:v copy -c:a aac -b:a 192k master.tmp.mp4")
print("measured:", j['input_i'], "LUFS  TP", j['input_tp'], " LRA", j['input_lra'])
PY
sh master.cmd && rm master.cmd && mv master.tmp.mp4 master.mp4
echo "--- master.mp4 measured ---"
ffmpeg -hide_banner -i master.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -A14 "Summary" | grep -E "I:|LRA:|Peak:"
