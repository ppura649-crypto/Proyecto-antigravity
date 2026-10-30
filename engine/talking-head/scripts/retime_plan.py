#!/usr/bin/env python3
"""retime_plan.py <project>: every `<word> <ms>` pair in visual-plan.md is re-pointed at the
final captions.json (the word nearest the old ms, within 1.5 s). Prints what moved."""
import json, re, sys
from pathlib import Path
P = Path(sys.argv[1]); d = json.load(open(P / "captions.json"))
words = []
for p in d["pages"]:
    if p.get("type") == "title": continue
    if p.get("lines"):
        for ln in p["lines"]:
            for w in ln.get("words", []): words.append((w["atMs"], w["text"]))
    elif p.get("text"): words.append((p["fromMs"], p["text"]))
words.sort()
def norm(t): return re.sub(r"[^a-z0-9]", "", t.lower())
by = {}
for t, w in words: by.setdefault(norm(w), []).append(t)
plan = (P / "visual-plan.md").read_text(); moved = 0
def fix(m):
    global moved
    word, ms = m.group(1), int(m.group(2))
    if 1900 <= ms <= 2100: return m.group(0)   # a year ("end of 2026"), not a spine time
    cands = by.get(norm(word)) or by.get(norm(word.split()[-1]))
    if not cands: return m.group(0)
    best = min(cands, key=lambda t: abs(t - ms))
    if abs(best - ms) > 1500 or best == ms: return m.group(0)
    moved += 1
    return f"{word} {best}"
new = re.sub(r"([A-Za-z0-9\.\-'\"]+[\.,!?]?) (\d{3,6})(?=[ \)|])", fix, plan)
(P / "visual-plan.md").write_text(new)
print(f"{P.name}: {moved} times moved")
