#!/usr/bin/env python3
"""Cross-reel table from every refs/<code>/tokens.json, for the creator-level synthesis.

Usage: style_corpus.py <styles_dir> [codes...]
Prints one markdown row per reel (captions, hook title, blur, motion, rhythm) and the union of
card families with their entrance/exit kinds, so the synthesis quotes numbers, not impressions.
"""
import glob
import json
import os
import sys


def g(d, *ks, default="-"):
    for k in ks:
        if not isinstance(d, dict) or k not in d:
            return default
        d = d[k]
    return d


def fmt(v):
    if isinstance(v, list):
        return "/".join(str(x) for x in v)
    return str(v)


def main():
    root = sys.argv[1].rstrip("/")
    codes = sys.argv[2:] or sorted(os.path.basename(os.path.dirname(p)) for p in glob.glob(root + "/refs/*/tokens.json"))
    rows, fams = [], {}
    for c in codes:
        p = os.path.join(root, "refs", c, "tokens.json")
        if not os.path.exists(p):
            print(f"(no tokens.json for {c})")
            continue
        t = json.load(open(p))
        cap, hook, blur, mo, rh = (t.get(k, {}) for k in ("captions", "hookTitle", "blur", "motion", "rhythm"))
        rows.append([c, fmt(g(t, "durationS")), f"{fmt(g(cap, 'yTop'))}-{fmt(g(cap, 'yBottom'))}", fmt(g(cap, "capHeightPx")),
                     fmt(g(cap, "wordsPerPage")), fmt(g(cap, "family"))[:28], f"{fmt(g(hook, 'yTop'))}-{fmt(g(hook, 'yBottom'))}",
                     fmt(g(hook, "capHeightPx")), fmt(g(hook, "entrance"))[:22], fmt(g(hook, "livesFrames")),
                     fmt(g(blur, "kind")), fmt(g(blur, "gaussianSigmaPx1080")), fmt(g(blur, "brightness")),
                     fmt(g(mo, "fadeFrames")), fmt(g(mo, "staggerFrames")), fmt(g(mo, "popFrames")), fmt(g(mo, "typeGlyphsPerFrame")),
                     fmt(g(rh, "objects")), fmt(g(rh, "objectEverySec")), fmt(g(rh, "cardHoldSec")), fmt(g(rh, "clearGapSec"))])
        for card in t.get("cards", []):
            fams.setdefault(card.get("name", "?"), []).append(
                f"{c[:4]}: x{fmt(card.get('x'))} y{fmt(card.get('y'))} r{card.get('radius', '-')} in={fmt(g(card, 'entrance', 'kind'))}/{fmt(g(card, 'entrance', 'frames'))}f out={fmt(g(card, 'exit', 'kind'))} footage={card.get('footage', '-')}")
    head = ["reel", "s", "cap y", "cap px", "words/pg", "cap face", "title y", "title px", "title in", "title lives f",
            "blur", "sigma", "bright", "fade f", "stagger f", "pop f", "type g/f", "objects", "every s", "hold s", "gap s"]
    print("| " + " | ".join(head) + " |")
    print("|" + "---|" * len(head))
    for r in rows:
        print("| " + " | ".join(r) + " |")
    print("\n## Card families across the corpus\n")
    for name, items in sorted(fams.items()):
        print(f"- **{name}** ({len(items)})")
        for it in items:
            print(f"  - {it}")


if __name__ == "__main__":
    main()
