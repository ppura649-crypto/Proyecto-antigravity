#!/bin/bash
# Deliver a project's render to ~/Downloads. Refuses a stale render, an existing name, and a
# file identical to an earlier version (2026-09-03: a failed render's old captioned.mp4 was
# ramped and shipped as v5 = v4). The ramp comes from format.json {"ramp":{"hookEndS","rate"}}
# or ramp.json next to it; no ramp = straight copy. Since 2026-09-05 no project carries one
# ("don't sped up pls. Don't do that"): hook_build.py check refuses a ramp before this runs. Optional check frames from the DELIVERED
# file land in <project>/checks/.
# Usage: scripts/deliver.sh <project_dir> <downloads-name-without-ext> [seconds,seconds,...]
set -u
P="$(cd "$1" && pwd)"; NAME="$2"; SECS="${3:-}"
R="$(cd "$(dirname "$0")/../remotion" && pwd)"
SRC="${SRC:-$P/captioned.mp4}"; OUT="$HOME/Downloads/$NAME.mp4"   # SRC=... for a partial render
[ -f "$SRC" ] || { echo "no render at $SRC"; exit 1; }

# 0. approved layers are locked, the hook agrees with hook.json, the visual lint passes.
#    (2026-09-05: every hook regression and the "i didn't mean all the cards" round were changes
#    that reached an approved layer from somewhere else. A delivery that carries one stops here.)
S="$(cd "$(dirname "$0")" && pwd)"
python3 "$S/lock_layer.py" check "$P" || exit 1
[ -f "$P/hook.json" ] && { python3 "$S/hook_build.py" check "$P" || exit 1; }
#    a project older than hook.json still gets the one hook law that is mechanical:
#    the title is whole on frame 0. reference edit D shipped three versions revealing it word by
#    word after the timeline had already flagged it (2026-09-04, "open, not applied").
python3 - "$P" <<'EOF' || exit 1
import json, sys, pathlib
c = json.loads((pathlib.Path(sys.argv[1]) / "captions.json").read_text())
t = next((p for p in c["pages"] if p.get("type") == "title"), None)
if t and t.get("reveal", "none") != "none":
    sys.exit(f"title page reveals '{t['reveal']}': the hook is complete at frame 0 "
             f"(02h-hook.md). Set reveal 'none' in caption-plan.json and in captions.json.")
#    and no speed-up, ever: hook_build.py refuses one, but a project older than hook.json
#    only meets this here (2026-09-05, "don't sped up pls. Don't do that")
P = pathlib.Path(sys.argv[1])
for f in ("format.json", "ramp.json"):
    fp = P / f
    if not fp.exists():
        continue
    d = json.loads(fp.read_text())
    r = d.get("ramp", d if f == "ramp.json" else None)
    if r and r.get("rate", 1) != 1:
        sys.exit(f"{f} carries a speed ramp {r}: talking-head plays at 1x from frame 0. Delete it.")
EOF
if [ -f "$P/visuals.json" ]; then
  if [ -d "$P/.locks/visuals" ]; then python3 "$S/lock_layer.py" diff "$P" visuals; fi
  if [ "${LINT:-}" != "skip" ]; then
    python3 "$S/lint_visuals.py" "$P" || { echo "visual lint failed (LINT=skip <reason in chat> to ship anyway)"; exit 1; }
  else
    echo "LINT=skip: visual lint bypassed, say why in chat"
  fi
fi

# 1. the render must be newer than everything that feeds it (their format file included)
stale=$(find "$P/captions.json" "$P/visuals.json" "$P/format.json" "$P/master.mp4" "$R/src" \
  "$R/../formats/creator-format-1.json" -newer "$SRC" 2>/dev/null)
[ -n "$stale" ] && { echo "STALE render, these are newer than captioned.mp4:"; echo "$stale"; exit 1; }

# 2. versions never overwrite
[ -e "$OUT" ] && { echo "exists: $OUT, pick a new version name"; exit 1; }

# 3. ramp
read -r HOOK RATE <<< "$(python3 - "$P" <<'EOF'
import json, os, sys
p = sys.argv[1]; r = None
for f in ("format.json", "ramp.json"):
    fp = os.path.join(p, f)
    if os.path.exists(fp):
        d = json.load(open(fp)); r = d.get("ramp", d if f == "ramp.json" else None)
        if r: break
print(f"{r['hookEndS']} {r['rate']}" if r else "0 1")
EOF
)"
if [ "$HOOK" != "0" ] && [ -z "${NORAMP:-}" ]; then   # NORAMP=1 when SRC is already ramped
  ffmpeg -y -v error -i "$SRC" -filter_complex \
    "[0:v]trim=0:$HOOK,setpts=(PTS-STARTPTS)/$RATE[v1];[0:a]atrim=0:$HOOK,asetpts=PTS-STARTPTS,atempo=$RATE[a1];[0:v]trim=$HOOK,setpts=PTS-STARTPTS[v2];[0:a]atrim=$HOOK,asetpts=PTS-STARTPTS[a2];[v1][a1][v2][a2]concat=n=2:v=1:a=1[v][a]" \
    -map "[v]" -map "[a]" -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k \
    "$P/full-overlay-ramp.mp4" || exit 1
  cp "$P/full-overlay-ramp.mp4" "$OUT"
else
  cp "$SRC" "$OUT"
fi

# 4. must differ from every earlier version under the same name
PREFIX="${NAME%-v*}"
for f in "$HOME"/Downloads/"$PREFIX"-v*.mp4; do
  [ -f "$f" ] && [ "$f" != "$OUT" ] || continue
  if cmp -s "$f" "$OUT"; then
    rm -f "$OUT"; echo "IDENTICAL to $f, not delivered"; exit 1
  fi
done

# 5. check frames from the delivered file
if [ -n "$SECS" ]; then
  mkdir -p "$P/checks"
  for s in ${SECS//,/ }; do
    ffmpeg -y -v error -ss "$s" -i "$OUT" -frames:v 1 "$P/checks/$NAME-$s.png" && echo "check: $P/checks/$NAME-$s.png"
  done
fi
echo "Delivered: $OUT ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT") s)"
