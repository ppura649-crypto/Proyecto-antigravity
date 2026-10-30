#!/bin/bash
# Full render on a nearly full disk: three video-only ranged renders (Remotion keeps every
# frame of a range as a JPEG in $TMPDIR until it stitches, ~1 MB per frame), concat, then the
# master's audio muxed back. Usage: scripts/render_parts.sh <project_dir> [parts=3]
set -u
P="$(cd "$1" && pwd)"
PARTS="${2:-3}"
cd "$(dirname "$0")/../remotion" || exit 1
mkdir -p "$P/parts"
rm -f "$P"/parts/p*.mp4 "$P"/parts/list.txt
FRAMES=$(python3 -c "import json,math;c=json.load(open('$P/captions.json'));print(math.ceil(c['durationMs']/1000*c['fps']))")
SIZE=$(( (FRAMES + PARTS - 1) / PARTS ))
clean() { find "${TMPDIR:-/tmp}" -maxdepth 1 \( -name 'react-motion-render*' -o -name 'remotion-webpack-bundle-*' \) -exec rm -rf {} + 2>/dev/null; }
start=0
while [ $start -lt $FRAMES ]; do
  end=$(( start + SIZE - 1 )); [ $end -ge $FRAMES ] && end=$(( FRAMES - 1 ))
  node render.mjs "$P" --range=$start:$end --muted --out "$P/parts/p$start.mp4" > "$P/parts/p$start.log" 2>&1
  rc=$?
  clean
  echo "part $start:$end exit $rc, free $(df -h / | awk 'NR==2{print $4}')"
  if [ $rc -ne 0 ]; then tail -c 600 "$P/parts/p$start.log"; exit 1; fi
  printf "file 'p%s.mp4'\n" "$start" >> "$P/parts/list.txt"
  start=$(( end + 1 ))
done
ffmpeg -y -v error -f concat -safe 0 -i "$P/parts/list.txt" -i "$P/master.mp4" \
  -map 0:v -map 1:a -c copy -shortest "$P/captioned.mp4" || exit 1
rm -f "$P"/parts/p*.mp4
echo "Done: $P/captioned.mp4 ($FRAMES frames in $PARTS parts)"
