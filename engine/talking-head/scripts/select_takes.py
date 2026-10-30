#!/usr/bin/env python3
"""select.py <project> <sel.json>: sel = {"5":"hook","6":"hook",...}; every other clip keep=false.
Backs up cuts.json to cuts.pre-select.json, writes cuts.json + cuts.pre-tighten.json (cut_variants input)."""
import json, sys, shutil
from pathlib import Path
P = Path(sys.argv[1]); sel = {int(k): v for k, v in json.load(open(sys.argv[2])).items()}
shutil.copy(P / "cuts.json", P / "cuts.pre-select.json")
d = json.load(open(P / "cuts.json"))
for c in d["clips"]:
    c["keep"] = c["id"] in sel; c["kind"] = sel.get(c["id"])
kept = [c for c in d["clips"] if c["keep"]]
d["stats"]["keptMs"] = sum(c["outMs"] - c["inMs"] for c in kept)
for out in ("cuts.json", "cuts.pre-tighten.json"):
    (P / out).write_text(json.dumps(d, indent=1))
print(f"{len(kept)} of {len(d['clips'])} clips kept, {d['stats']['keptMs']/1000:.1f}s")
for c in kept: print(f"  {c['id']:3d} {c['kind']:4} {c['text']}")
