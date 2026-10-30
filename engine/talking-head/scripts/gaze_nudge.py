#!/usr/bin/env python3
"""nudge.py <project>: apply projects/<id>/gaze-nudges.json ({"clipId": deltaMs}) to cuts.json outMs.
The gaze tile (01b check 5) showed a blink or a look-down on the LAST frame of these clips; a
pull-in of one frame or an extension past the blink fixes the frame the viewer sees. Idempotent:
records what was applied in the file."""
import json, sys
from pathlib import Path
P = Path(sys.argv[1]); nud = json.load(open(P / "gaze-nudges.json"))
d = json.load(open(P / "cuts.json")); by = {c["id"]: c for c in d["clips"]}
for cid, delta in nud["nudges"].items():
    c = by[int(cid)]
    if c.get("gazeNudgeMs") == delta: continue
    new = c["outMs"] - c.get("gazeNudgeMs", 0) + delta
    kept = sorted([x for x in d["clips"] if x["keep"]], key=lambda x: x["inMs"])
    nxt = next((x for x in kept if x["inMs"] > c["inMs"]), None)
    if nxt: new = min(new, nxt["inMs"] - 1)          # never into the next clip
    delta = new - (c["outMs"] - c.get("gazeNudgeMs", 0))
    c["outMs"] = new; c["gazeNudgeMs"] = delta
    print(f"clip {cid}: outMs -> {c['outMs']} ({delta:+d} ms) {c['text'][:50]}")
for cid, delta in nud.get("inNudges", {}).items():   # the FIRST frame of a clip (the hook's frame 0 was mid-blink)
    c = by[int(cid)]
    if c.get("gazeInNudgeMs") == delta: continue
    new = c["inMs"] - c.get("gazeInNudgeMs", 0) + delta
    kept = sorted([x for x in d["clips"] if x["keep"]], key=lambda x: x["inMs"])
    prv = next((x for x in reversed(kept) if x["inMs"] < c["inMs"]), None)
    if prv: new = max(new, prv["outMs"] + 1)
    delta = new - (c["inMs"] - c.get("gazeInNudgeMs", 0))
    c["inMs"] = new; c["gazeInNudgeMs"] = delta
    print(f"clip {cid}: inMs -> {c['inMs']} ({delta:+d} ms) {c['text'][:50]}")
(P / "cuts.json").write_text(json.dumps(d, indent=1))
