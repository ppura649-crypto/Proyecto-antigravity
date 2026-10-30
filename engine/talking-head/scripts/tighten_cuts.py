#!/usr/bin/env python3
"""Tighten kept clips for short-form pacing: energy-aware in/out points.

in  = latest sustained-quiet ms in [wordStart-maxLead, wordStart-minLead]
out = earliest sustained-quiet ms in [wordEnd+minTail, wordEnd+maxTail]
Speech is never trimmed: in <= wordStart, out >= wordEnd always.

Usage: python3 tighten_cuts.py <project_dir> [--quiet-db -45] [--min-lead 50]
       [--max-lead 220] [--min-tail 40] [--max-tail 300] [--sustain 30]
       [--in-bite 0] [--out-bite 0]

--in-bite/--out-bite let the cut move INTO the ASR word region (Apple stamps
starts early and ends late) but only through sustained-quiet audio, never speech.
Calibrated on reference edit F's manual pass: in-bite 200, out-bite 450.
"""
import json
import math
import shutil
import sys
from pathlib import Path


def db(x):
    return 20 * math.log10(max(x, 1e-9))


def load_levels(p):
    return [float(l) for l in open(p) if l.strip() and not l.startswith("@")]


def quiet_run(levels, t, thresh, sustain):
    seg = levels[max(0, t - sustain):t]
    return seg and all(v < thresh for v in seg)


def main():
    proj = Path(sys.argv[1])
    args = dict(zip(sys.argv[2::2], sys.argv[3::2]))
    quiet_db = float(args.get("--quiet-db", -45))
    min_lead = int(args.get("--min-lead", 50))
    max_lead = int(args.get("--max-lead", 220))
    min_tail = int(args.get("--min-tail", 40))
    max_tail = int(args.get("--max-tail", 300))
    sustain = int(args.get("--sustain", 30))
    in_bite = int(args.get("--in-bite", 0))
    out_bite = int(args.get("--out-bite", 0))

    levels = load_levels(proj / "levels.txt")
    thresh = 10 ** (quiet_db / 20)
    shutil.copy(proj / "cuts.json", proj / "cuts.pre-tighten.json")
    d = json.loads((proj / "cuts.json").read_text())

    before = after = 0
    for c in d["clips"]:
        if not c["keep"]:
            continue
        before += c["outMs"] - c["inMs"]
        ws, we = c["wordStart"], c["wordEnd"]
        onset = ws  # actual speech start: first loud ms in [ws, ws+in_bite]
        if in_bite:
            onset = ws + in_bite
            for t in range(ws, min(ws + in_bite, len(levels))):
                if levels[t] >= thresh:
                    onset = t
                    break
        new_in = onset - min_lead
        for t in range(onset - min_lead, onset - max_lead, -1):
            if t <= 0:
                break
            if quiet_run(levels, t, thresh, sustain):
                new_in = t
                break
        else:
            new_in = onset - min(max_lead, 80)  # nothing quiet found: keep a short lead
        new_in = max(new_in, 0)

        end = we  # actual speech end: last loud ms in [we-out_bite, we]
        if out_bite:
            end = max(we - out_bite, 0)
            for t in range(min(we, len(levels)) - 1, end - 1, -1):
                if levels[t] >= thresh:
                    end = t
                    break
        new_out = end + max_tail
        for t in range(end + min_tail, min(end + max_tail, len(levels))):
            if quiet_run(levels, t, thresh, sustain):
                new_out = t
                break
        new_out = min(new_out, len(levels))

        c["inMs"] = min(new_in, onset)
        c["outMs"] = max(new_out, end + min_tail)
        after += c["outMs"] - c["inMs"]

    keeps = [c for c in d["clips"] if c["keep"]]
    for a, b in zip(keeps, keeps[1:]):  # neighbors must never overlap
        if a["outMs"] > b["inMs"]:
            a["outMs"] = b["inMs"]
    after = sum(c["outMs"] - c["inMs"] for c in keeps)
    d["stats"]["keptMs"] = after
    (proj / "cuts.json").write_text(json.dumps(d, indent=1))
    print(f"tightened: {before/1000:.1f}s -> {after/1000:.1f}s "
          f"(saved {(before-after)/1000:.1f}s across {sum(1 for c in d['clips'] if c['keep'])} clips)")
    for c in d["clips"]:
        if c["keep"]:
            print(f"  {c['id']:3d} lead {c['wordStart']-c['inMs']:4d}ms tail {c['outMs']-c['wordEnd']:4d}ms")


if __name__ == "__main__":
    main()
