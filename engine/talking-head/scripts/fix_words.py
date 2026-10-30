#!/usr/bin/env python3
"""fixwords.py <project> <fixes.json>: apply word-level ASR fixes to words.json (words.raw.json kept).
fixes: [{"i": 54, "text": "the"}, {"merge": [305, 306], "text": "OpenTelemetry"}, {"i": 9, "text": "link.", "end": 1276700}]
"end" = the word end measured on levels.txt when the ASR stamp runs late (it feeds the last-word check)  indices refer to words.raw.json"""
import json, sys
from pathlib import Path
P = Path(sys.argv[1]); fixes = json.load(open(sys.argv[2]))
words = [json.loads(l) for l in open(P / "words.raw.json") if l.strip()]
drop = set()
for f in fixes:
    if "merge" in f:
        a, b = f["merge"]
        words[a]["text"] = f["text"]; words[a]["end"] = words[b]["end"]
        drop.update(range(a + 1, b + 1))
    else:
        words[f["i"]]["text"] = f["text"]
        if "end" in f: words[f["i"]]["end"] = f["end"]
out = [w for i, w in enumerate(words) if i not in drop]
(P / "words.json").write_text("".join(json.dumps(w) + "\n" for w in out))
print(f"{len(fixes)} fixes, {len(words)} -> {len(out)} words")
