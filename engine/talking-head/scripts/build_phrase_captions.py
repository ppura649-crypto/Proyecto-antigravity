#!/usr/bin/env python3
"""Rewrite a Creator Format 1 captions.json (one word per page, stacks, heroes) into Creator Format 2's
caption grammar (formats/creator-format-2-system.md): a page is a phrase of 2-4 words, verbatim,
sentence case, no hero, no accent, hard cut on the first word's onset, held to the next page.
Adds the hook-title page (creator-format-2-hook.md: complete at frame 0, removed by a cut).

Usage: build_phrase_captions.py <project_dir> --from <Creator Format 1 captions.json>
         [--title "line one|line two"] [--title-to ms] [--max-words 4] [--max-chars 26]
Reads <project_dir>/format.json as the style, writes <project_dir>/captions.json.
"""
import json
import re
import sys
from pathlib import Path

KEEP = {"AI", "I", "PR", "SQL", "OK", "IG", "API", "CLI", "SKILL.md", "CLAUDE.md"}
# a page never ends on one of these: the phrase they open goes to the next page
LEAD = {"the", "a", "an", "of", "to", "your", "my", "and", "or", "is", "that", "with", "into",
        "for", "in", "on", "at", "by", "this", "these", "every", "any", "some", "all", "not"}
END = re.compile(r"[.!?]$")


def flatten(pages):
    """Every visible word with its onset and end, in order (stacks and heroes included)."""
    out = []
    for pg in pages:
        if pg.get("type") == "title":
            continue
        if pg.get("type") == "block":
            if pg.get("variant") == "heroTail":
                ws = [(pg["hero"], pg["fromMs"])]
                ws += [(w["text"], w["atMs"]) for ln in pg["tail"] for w in ln["words"]]
            else:
                ws = [(w["text"], w["atMs"]) for ln in pg["lines"] for w in ln["words"]]
            for i, (t, a) in enumerate(ws):
                e = ws[i + 1][1] if i + 1 < len(ws) else pg["toMs"]
                out.append({"text": t, "at": a, "end": e})
        else:
            out.append({"text": pg["text"], "at": pg["fromMs"], "end": pg["toMs"]})
    return out


def sentence_case(words):
    """Her captions are sentence case: undo the hero/stack capitals, keep real capitals."""
    new_sentence = True
    for w in words:
        t = w["text"]
        core = t.rstrip(".,!?:;")
        if core.isupper() and core not in KEEP and len(core) > 1:
            t = t.lower()
        if new_sentence:
            t = t[0].upper() + t[1:]
        w["text"] = t
        new_sentence = bool(END.search(t))
    return words


def group(words, max_words, max_chars, gap_ms=600):
    pages, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        chars = len(" ".join(x["text"] for x in cur))
        full = (
            nxt is None
            or len(cur) >= max_words
            or END.search(w["text"])
            or (w["text"].endswith(",") and len(cur) >= 2)
            or nxt["at"] - w["end"] > gap_ms
            or chars + 1 + len(nxt["text"]) > max_chars
            # a natural capital after sentence_case is a sentence start ("August", "Comment")
            or (nxt["text"][0].isupper() and not nxt["text"].isupper() and nxt["text"] != "I")
        )
        if full:
            carry = []
            while len(cur) >= 2 and nxt is not None and cur[-1]["text"].lower() in LEAD \
                    and not END.search(cur[-1]["text"]) and nxt["at"] - cur[-1]["end"] <= gap_ms:
                carry.insert(0, cur.pop())
            pages.append(cur)
            cur = carry
    return pages


def main():
    proj = Path(sys.argv[1])
    args = dict(zip(sys.argv[2::2], sys.argv[3::2]))
    src = json.loads(Path(args["--from"]).read_text())
    fmt = json.loads((proj / "format.json").read_text())
    max_words = int(args.get("--max-words", 4))
    max_chars = int(args.get("--max-chars", 26))

    words = sentence_case(flatten(src["pages"]))
    groups = group(words, max_words, max_chars, fmt.get("wordGapBridgeMs", 600))
    tail = fmt.get("wordTailMs", 250)
    pages = []
    for gi, g in enumerate(groups):
        nxt = groups[gi + 1][0]["at"] if gi + 1 < len(groups) else None
        to = nxt if nxt is not None and nxt - g[-1]["end"] <= 600 else g[-1]["end"] + tail
        pages.append({"type": "word", "grade": 0, "text": " ".join(w["text"] for w in g),
                      "fromMs": g[0]["at"], "toMs": min(to, src["durationMs"])})

    if "--title" in args:
        lines = [[{"text": ln.strip(), "fancy": False}] for ln in args["--title"].split("|")]
        pages.insert(0, {"type": "title", "grade": 0, "fromMs": 0,
                         "toMs": int(args.get("--title-to", 4000)),
                         "lines": lines, "reveal": "none", "exit": "cut", "look": "plain"})

    out = {k: src[k] for k in ("fps", "width", "height", "durationMs")}
    out["style"] = fmt
    out["pages"] = pages
    (proj / "captions.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))
    n = len([p for p in pages if p["type"] == "word"])
    print(f"{n} phrase pages, {len(words)} words -> {proj / 'captions.json'}")
    for p in pages[:14]:
        print(f"  {p['fromMs']/1000:6.2f}-{p['toMs']/1000:6.2f}  {p.get('text') or '[title] ' + ' / '.join(s[0]['text'] for s in p['lines'])}")


if __name__ == "__main__":
    main()
