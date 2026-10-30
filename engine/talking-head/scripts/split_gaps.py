#!/usr/bin/env python3
"""Convert innerCuts (from cut_gaps.py) into separate split clips.

The review UI has no innerCuts concept: a clip with pauses becomes N cards,
the pause audio simply absent between them. Words are assigned to pieces by
midpoint. New pieces get fresh ids and are spliced after the original so
array order (= source order) is preserved.

Usage: python3 split_gaps.py <project_dir>
"""
import json
import shutil
import sys
from pathlib import Path


def main():
    proj = Path(sys.argv[1])
    words = [json.loads(l) for l in open(proj / "words.json") if l.strip()]
    shutil.copy(proj / "cuts.json", proj / "cuts.pre-split.json")
    d = json.loads((proj / "cuts.json").read_text())

    next_id = max(c["id"] for c in d["clips"]) + 1
    out, made = [], 0
    for c in d["clips"]:
        cuts = c.pop("innerCuts", None)
        if not (c["keep"] and cuts):
            out.append(c)
            continue
        edges = [c["inMs"]]
        for g in sorted(cuts, key=lambda g: g["fromMs"]):
            edges += [g["fromMs"], g["toMs"]]
        edges.append(c["outMs"])
        spans = [(edges[i], edges[i + 1]) for i in range(0, len(edges), 2)
                 if edges[i + 1] - edges[i] >= 120]
        for k, (a, b) in enumerate(spans):
            piece = dict(c) if k == 0 else {**c, "id": next_id}
            if k > 0:
                next_id += 1
                made += 1
            piece["inMs"], piece["outMs"] = a, b
            pw = [w for w in words if a <= (w["start"] + w["end"]) / 2 < b]
            if pw:
                piece["wordStart"], piece["wordEnd"] = pw[0]["start"], pw[-1]["end"]
                piece["text"] = " ".join(w["text"] for w in pw)
            out.append(piece)
    d["clips"] = out
    kept = [c for c in d["clips"] if c["keep"]]
    d["stats"]["keptMs"] = sum(c["outMs"] - c["inMs"] for c in kept)
    (proj / "cuts.json").write_text(json.dumps(d, indent=1))
    print(f"split: +{made} clips -> {len(kept)} kept, {d['stats']['keptMs']/1000:.1f}s")


if __name__ == "__main__":
    main()
