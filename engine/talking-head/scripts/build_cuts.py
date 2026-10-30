#!/usr/bin/env python3
"""Stage 2: words.json + levels.txt -> cuts.json (one clip per sentence).

Usage: python3 build_cuts.py <project_dir> [--pre 250] [--post 250] [--snap 120] [--gap 1200]

cuts.json is the canonical EDL. Times in ms on the SOURCE file. Every clip starts
keep=true; the review page and Claude flip keep / adjust pads. headroom fields say
how far each edge can be dragged before hitting the neighbouring clip.
"""
import json
import re
import sys
from pathlib import Path

SENT_END = re.compile(r'[.!?…]["\')\]]?$')


def load_words(p):
    words = [json.loads(l) for l in open(p) if l.strip()]
    if not words:
        sys.exit("no words in words.json")
    return words


def load_levels(p):
    vals = []
    for line in open(p):
        line = line.strip()
        if not line or line.startswith("@"):
            continue
        vals.append(float(line))
    return vals


def split_sentences(words, gap_ms):
    sents, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        gap = (nxt["start"] - w["end"]) if nxt else None
        if SENT_END.search(w["text"]) or w["text"].endswith("...") or gap is None or gap > gap_ms:
            sents.append(cur)
            cur = []
    if cur:
        sents.append(cur)
    return sents


def snap_quiet(levels, target, lo, hi):
    """Quietest millisecond in [lo, hi], preferring target on ties."""
    lo = max(0, min(lo, len(levels) - 1))
    hi = max(0, min(hi, len(levels) - 1))
    if hi <= lo:
        return max(0, min(target, len(levels) - 1))
    window = levels[lo:hi + 1]
    best = min(range(len(window)), key=lambda i: (window[i], abs(lo + i - target)))
    return lo + best


def norm_tokens(text, n=5):
    toks = re.sub(r"[^a-z0-9 ]", "", text.lower()).split()
    return toks[:n]


def overlap(a, b):
    if not a or not b:
        return 0.0
    sa, sb = set(a), set(b)
    return len(sa & sb) / max(len(sa), len(sb))


def main():
    proj = Path(sys.argv[1])
    args = dict(zip(sys.argv[2::2], sys.argv[3::2]))
    pre = int(args.get("--pre", 250))
    post = int(args.get("--post", 250))
    snap = int(args.get("--snap", 120))
    gap_ms = int(args.get("--gap", 1200))

    words = load_words(proj / "words.json")
    levels = load_levels(proj / "levels.txt")
    sents = split_sentences(words, gap_ms)

    clips = []
    for idx, sent in enumerate(sents):
        ws, we = sent[0]["start"], sent[-1]["end"]
        text = " ".join(w["text"] for w in sent)
        in_ms = snap_quiet(levels, ws - pre, ws - pre - snap, ws - pre + snap)
        out_ms = snap_quiet(levels, we + post, we + post - snap, we + post + snap)
        in_ms = min(in_ms, ws)          # never start after the first word
        out_ms = max(out_ms, we)        # never end before the last word
        clips.append({
            "id": idx, "text": text,
            "wordStart": ws, "wordEnd": we,
            "inMs": in_ms, "outMs": out_ms,
            "keep": True, "kind": None, "takeGroup": None,
        })

    # clamp overlaps + headroom
    for i, c in enumerate(clips):
        prev_out = clips[i - 1]["outMs"] if i else 0
        next_in = clips[i + 1]["inMs"] if i + 1 < len(clips) else len(levels)
        c["inMs"] = max(c["inMs"], prev_out)
        c["outMs"] = min(c["outMs"], next_in)
        c["headroomPreMs"] = c["inMs"] - (clips[i - 1]["outMs"] if i else 0)
        c["headroomPostMs"] = (clips[i + 1]["inMs"] if i + 1 < len(clips) else len(levels)) - c["outMs"]

    # retake grouping: consecutive sentences opening with the same tokens
    group = 0
    for i in range(1, len(clips)):
        a, b = norm_tokens(clips[i - 1]["text"]), norm_tokens(clips[i]["text"])
        if overlap(a, b) >= 0.6:
            if clips[i - 1]["takeGroup"] is None:
                group += 1
                clips[i - 1]["takeGroup"] = group
            clips[i]["takeGroup"] = clips[i - 1]["takeGroup"]

    kept = sum(c["outMs"] - c["inMs"] for c in clips)
    doc = {
        "version": 1,
        "source": str((proj / "source.txt").read_text().strip()) if (proj / "source.txt").exists() else None,
        "sourceDurationMs": len(levels),
        "params": {"prePadMs": pre, "postPadMs": post, "snapMs": snap, "sentenceGapMs": gap_ms},
        "stats": {"clips": len(clips), "keptMs": kept,
                  "takeGroups": group,
                  "cutRatio": round(1 - kept / len(levels), 3)},
        "clips": clips,
    }
    out = proj / "cuts.json"
    out.write_text(json.dumps(doc, indent=1))
    s = doc["stats"]
    print(f"cuts.json: {s['clips']} clips, kept {kept/1000:.1f}s of {len(levels)/1000:.1f}s "
          f"(cut {s['cutRatio']*100:.0f}%), {group} retake groups")


if __name__ == "__main__":
    main()
