#!/usr/bin/env python3
"""Detect mid-sentence pauses inside kept clips -> innerCuts (source ms ranges to remove).

Adaptive: a pause is levels below (clip speech median - 9 dB) sustained >= min-run,
away from clip edges. Each pause keeps a head/tail of air so the cut stays natural.

Usage: python3 cut_gaps.py <project_dir> [--rel-db 9] [--min-run 220]
       [--keep-head 90] [--keep-tail 70] [--edge 120]
"""
import json
import math
import shutil
import sys
from pathlib import Path


def main():
    proj = Path(sys.argv[1])
    args = dict(zip(sys.argv[2::2], sys.argv[3::2]))
    rel_db = float(args.get("--rel-db", 9))
    min_run = int(args.get("--min-run", 220))
    keep_head = int(args.get("--keep-head", 90))
    keep_tail = int(args.get("--keep-tail", 70))
    edge = int(args.get("--edge", 120))

    vals = [float(l) for l in open(proj / "levels.txt") if l.strip() and not l.startswith("@")]
    shutil.copy(proj / "cuts.json", proj / "cuts.pre-gaps.json")
    d = json.loads((proj / "cuts.json").read_text())

    total_removed = 0
    for c in d["clips"]:
        if not c["keep"]:
            continue
        seg = vals[c["inMs"]:c["outMs"]]
        s = sorted(seg)
        med = s[len(s) // 2]
        th = med * 10 ** (-rel_db / 20)
        runs, start = [], None
        for i, v in enumerate(seg):
            if v < th and start is None:
                start = i
            elif v >= th and start is not None:
                if i - start >= min_run:
                    runs.append((start, i))
                start = None
        if start is not None and len(seg) - start >= min_run:
            runs.append((start, len(seg)))

        cuts = []
        for a, b in runs:
            a = max(a, edge)
            b = min(b, len(seg) - edge)
            frm, to = a + keep_head, b - keep_tail
            if to - frm >= 120:
                cuts.append({"fromMs": c["inMs"] + frm, "toMs": c["inMs"] + to})
                total_removed += to - frm
        if cuts:
            c["innerCuts"] = cuts
        else:
            c.pop("innerCuts", None)

    (proj / "cuts.json").write_text(json.dumps(d, indent=1))
    n = sum(len(c.get("innerCuts", [])) for c in d["clips"] if c["keep"])
    print(f"innerCuts: {n} pauses, {total_removed/1000:.1f}s removed")
    for c in d["clips"]:
        if c["keep"] and c.get("innerCuts"):
            spans = ", ".join(f"{x['toMs']-x['fromMs']}ms@{(x['fromMs']-c['inMs'])/1000:.2f}s"
                              for x in c["innerCuts"])
            print(f"  clip {c['id']:3d}: {spans}")


if __name__ == "__main__":
    main()
