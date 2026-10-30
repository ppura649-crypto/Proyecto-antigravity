#!/usr/bin/env python3
"""Refuse a visual plan whose rows hide their research decision.

Usage: plan_check.py <project_dir>        (reads <project_dir>/visual-plan.md)

Reads every `| Vn |` row under the layer table (a plan may split the layer over several
sections; all of them count). The kind cell is the one that says real / chart / drawn / cta
(found by content, so a row with a shifted column still checks). The evidence cell is the one
after it, and it has to be WRITTEN: a URL, a file, a page and the line quoted from it, a slide,
or one of the two decisions `searched, none` (looked, found nothing, drawn or illustrated) and
`no search needed` (a mechanism, an opinion, the speaker's own process). An empty cell, a dash,
or "none" / "no source" without the word `searched` fails. A cta row, and a callback (the same
object again, changed), may leave the cell empty. One line per failing row, exit 1.

Why: an illustration marked "no source" shipped where the study existed, because nothing asked
whether anyone had looked. The cell makes the decision visible, like the bare stretches; this
check makes writing it mandatory. It never judges the picture, only that the search was decided.
"""
import os
import re
import sys

KIND = re.compile(r"^(real|chart|drawn|cta|photo)\b", re.I)
WANT = "a URL, a file, the page and its line, `searched, none`, or `no search needed`"


def rows(text):
    lines = text.splitlines()
    starts = [i for i, l in enumerate(lines) if l.startswith("## The layer")]
    if not starts:
        return None, []
    header = next((l for l in lines[starts[0]:] if l.startswith("| #") and "evidence" in l.lower()), None)
    table = [[c.strip() for c in l.strip().strip("|").split("|")]
             for l in lines[starts[0]:] if re.match(r"^\| *V\d+", l)]
    return header, table


def kind_index(cells):
    for i, c in enumerate(cells):
        if KIND.match(c):
            return i
    return None


def problem(kind, ev):
    k, e = kind.lower(), ev.lower().strip()
    if k.startswith("cta") or "callback" in k:
        return None
    if e in ("", "-", "\u2013", "\u2014"):
        return f"evidence is empty; write {WANT}"
    if ("searched" not in e) and (e.startswith("none") or "no source" in e):
        return f"evidence says '{ev[:50]}' but not whether anyone searched; write `searched, none` or the source"
    return None


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    path = os.path.join(sys.argv[1], "visual-plan.md")
    if not os.path.exists(path):
        sys.exit(f"FAIL no plan at {path}")
    header, table = rows(open(path, encoding="utf-8").read())
    if header is None:
        sys.exit("FAIL the plan has no '## The layer' table with an evidence column (03-visual-plan.md)")
    if not table:
        sys.exit("FAIL the layer table has no V rows")
    fails = []
    for cells in table:
        ki = kind_index(cells)
        if ki is None:
            fails.append(f"{cells[0]}: no real / chart / drawn / cta cell")
            continue
        kind, ev = cells[ki], (cells[ki + 1] if ki + 1 < len(cells) else "")
        p = problem(kind, ev)
        if p:
            fails.append(f"{cells[0]}: {kind[:40]} row, {p}")
    for f in fails:
        print("FAIL", f)
    if fails:
        sys.exit(1)
    print(f"ok {len(table)} rows, every research decision written")


if __name__ == "__main__":
    main()
