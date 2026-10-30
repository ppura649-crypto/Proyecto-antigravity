#!/usr/bin/env python3
"""Move an approved layer onto a re-rendered spine, mechanically.

The shift rule of `01-cut-and-review.md`: when the cut changes after captions or visuals are
approved, nothing is regenerated, every time in them is MAPPED. `render_spine.py` snaps every
edge to a whole frame, so a spine rebuild moves most segments by a frame or two even when only
one clip was re-trimmed; on reference edit D that was up to 265 ms of accumulated drift, which is eight
frames of captions out of sync with the mouth.

The map is exact, segment by segment. A time t inside old segment i names a moment of the
SOURCE at  srcIn_old[i] + (t - spineIn_old[i]), and that same moment sits in the new spine at
  t' = spineIn_new[i] + (t - spineIn_old[i]) + (srcIn_old[i] - srcIn_new[i])
so content keeps its offset from the take it came from, not from the file.

Usage: python3 scripts/shift_times.py <project_dir> <old-spine-map.json> [--dry]
Rewrites captions.json, visuals.json and hook.json in place (a `.pre-shift.json` copy first).
"""
import json, shutil, sys
from pathlib import Path

# keys whose value is an absolute time in spine ms
TIME_KEYS = {"fromMs", "toMs", "atMs", "at", "ruleAtMs", "noteAtMs", "clearMs", "showMs"}
# keys inside a `beats` object whose value is a DURATION or a count, not a moment
NOT_TIMES = {"per", "skillPer", "perMs", "typeMs", "sweepMs", "totalMs", "revealMs", "holdMs",
             "stepMs", "durMs", "count", "fps", "width", "height", "grade", "pages"}
SENTINEL = 99999  # "never" markers in beats (99999 / 999999) stay where they are


def build_map(old_segs, new_segs):
    assert len(old_segs) == len(new_segs), "segment count changed: this is a re-cut, not a shift"
    for a, b in zip(old_segs, new_segs):
        assert a["id"] == b["id"], f"segment order changed at id {a['id']}"
    lo, hi = new_segs[0]["spineInMs"], new_segs[-1]["spineOutMs"]

    def at(t):
        return min(hi, max(lo, _at(t)))

    def _at(t):
        for a, b in zip(old_segs, new_segs):
            if a["spineInMs"] <= t < a["spineOutMs"]:
                return round(b["spineInMs"] + (t - a["spineInMs"]) + (a["srcInMs"] - b["srcInMs"]))
        if t <= old_segs[0]["spineInMs"]:
            return new_segs[0]["spineInMs"]
        # a boundary or the end of the file: the start of the next segment, or the new end
        for a, b in zip(old_segs, new_segs):
            if t == a["spineOutMs"]:
                return b["spineOutMs"]
        return new_segs[-1]["spineOutMs"] + max(0, t - old_segs[-1]["spineOutMs"])
    return at


def walk(node, at, moved, key=None, in_beats=False):
    if isinstance(node, dict):
        for k, v in node.items():
            walk(v, at, moved, k, in_beats or k == "beats")
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                take = k in TIME_KEYS or (in_beats and k not in NOT_TIMES)
                if take and 0 <= v < SENTINEL:
                    node[k] = at(int(v))
                    if node[k] != v:
                        moved.append((k, int(v), node[k]))
    elif isinstance(node, list):
        for v in node:
            walk(v, at, moved, key, in_beats)


def main():
    P = Path(sys.argv[1]).resolve()
    old = json.loads(Path(sys.argv[2]).read_text())["segments"]
    new = json.loads((P / "spine-map.json").read_text())["segments"]
    dry = "--dry" in sys.argv
    at = build_map(old, new)
    print(f"spine {old[-1]['spineOutMs']} -> {new[-1]['spineOutMs']} ms, {len(new)} segments")

    for name in ("captions.json", "visuals.json", "hook.json"):
        f = P / name
        if not f.exists():
            continue
        d = json.loads(f.read_text())
        moved = []
        walk(d, at, moved)
        if "durationMs" in d:
            d["durationMs"] = new[-1]["spineOutMs"]
        big = max((abs(b - a) for _, a, b in moved), default=0)
        print(f"  {name:<15} {len(moved)} times moved, largest {big} ms")
        if dry:
            continue
        shutil.copyfile(f, f.with_suffix(".pre-shift.json"))
        f.write_text(json.dumps(d, indent=1) + "\n")
    print("shifted" if not dry else "dry run, nothing written")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main()
