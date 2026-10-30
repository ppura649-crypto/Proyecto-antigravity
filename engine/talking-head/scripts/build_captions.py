#!/usr/bin/env python3
"""Compile captions.json (spine-time, one word per page, Creator Format 1 chunking) from
words.json + cuts.json + spine-map.json + caption-plan.json.

- Words are assigned to the kept clip holding the largest share of them.
- caption-plan.json fixes: each entry replaces the FIRST matching token
  subsequence (normalized compare), preserving the time span (split by char
  length) and the trailing punctuation of the last original token.
- Emphasis: grade 1 = accent color inline; grade 2 = hero (merged into one
  page, ALL CAPS, fit-to-width, absorbs following pages to >= heroMinMs).
- Page timing: word start -> next word start when the gap <= bridge, else
  word end + tail; last word in a clip runs to the segment end.

Usage: python3 build_captions.py <project_dir> [--format ../formats/creator-format-1.json]
"""
import json
import re
import sys
from pathlib import Path

NORM = re.compile(r"[^a-z0-9']+")


def norm(t):
    return NORM.sub("", t.lower())


def trail_punct(t):
    m = re.search(r"[.,!?:;…\"')]+$", t)
    return m.group(0) if m else ""


def apply_fixes(stream, fixes):
    applied = []
    for fx in fixes:
        find = [norm(w) for w in fx["find"]]
        n = len(find)
        hit = next((i for i in range(len(stream) - n + 1)
                    if [norm(w["text"]) for w in stream[i:i + n]] == find), None)
        if hit is None:
            applied.append((fx, "NO MATCH"))
            continue
        old = stream[hit:hit + n]
        rep = list(fx["replace"])
        if not trail_punct(rep[-1]):
            rep[-1] += trail_punct(old[-1]["text"])
        a, b = old[0]["start"], old[-1]["end"]
        if len(rep) == len(old):
            # same word count: keep every word's own time AND its own clip. A fix
            # whose words straddle a cut ("video, | The cuts,") otherwise gets
            # re-timed across the removed region and the tail words vanish from
            # the render (reference edit E lost "The cuts," and "Claude made", 2026-09-04).
            new = [{**old[j], "text": rep[j]} for j in range(len(rep))]
        else:
            total = sum(len(w) for w in rep)
            new, t = [], a
            for j, w in enumerate(rep):
                t2 = b if j == len(rep) - 1 else t + round((b - a) * len(w) / total)
                new.append({"start": t, "end": t2, "text": w, "clip": old[0]["clip"]})
                t = t2
        stream[hit:hit + n] = new
        applied.append((fx, f"@{a}ms"))
    return applied


def find_emphasis(stream, emp):
    marks = {}  # index -> {grade, caps, quote, group}
    for gi, e in enumerate(emp):
        pat = [norm(w) for w in e["words"]]
        n, want, seen = len(pat), e.get("occurrence", 1), 0
        for i in range(len(stream) - n + 1):
            if [norm(w["text"]) for w in stream[i:i + n]] == pat:
                seen += 1
                if seen == want:
                    for k in range(i, i + n):
                        marks[k] = {"grade": e["grade"], "caps": e.get("caps", False),
                                    "quote": e.get("quote", False),
                                    "fancy": e.get("fancy", False), "group": gi}
                    break
        else:
            print(f"  emphasis NO MATCH: {e['words']} occ {want}")
    return marks


def main():
    proj = Path(sys.argv[1])
    args = dict(zip(sys.argv[2::2], sys.argv[3::2]))
    # The project's own format.json (the pack seeded with THIS master's geometry) wins over
    # the pack default. edit-c-qa rendered its stack on their chin because the default here
    # was formats/creator-format-1.json while the measured values sat in projects/<id>/format.json
    # (2026-09-05); the skill's stage 2 says the per-video file is the one that renders.
    proj_fmt = proj / "format.json"
    fmt_path = Path(args["--format"]) if "--format" in args else (
        proj_fmt if proj_fmt.exists() else Path(__file__).parent.parent / "formats/creator-format-1.json")
    fmt = json.loads(fmt_path.read_text())
    print(f"format: {fmt_path}")
    words = [json.loads(l) for l in open(proj / "words.json") if l.strip()]
    cuts = json.loads((proj / "cuts.json").read_text())
    smap = json.loads((proj / "spine-map.json").read_text())
    plan_p = proj / "caption-plan.json"
    plan = json.loads(plan_p.read_text()) if plan_p.exists() else {}

    kept = [c for c in cuts["clips"] if c["keep"]]
    segs = {s["id"]: s for s in smap["segments"]}
    assert all(c["id"] in segs for c in kept), "spine-map out of date, re-render spine"

    # assign each word to the kept clip it overlaps most (a split can land
    # mid-word); require a real overlap so cut-away words stay out
    order = {c["id"]: k for k, c in enumerate(kept)}
    stream = []
    for w in words:
        best, bov = None, 0
        for c in kept:
            ov = min(w["end"], c["outMs"]) - max(w["start"], c["inMs"])
            if ov > bov:
                best, bov = c, ov
        # largest share wins, with no further threshold. Apple stamps starts
        # 150-250 ms early, so a clip's own first word regularly keeps only
        # 20-30% of its stamp inside the clip ("and", "But", "Because",
        # "can" on reference edit B, all audible, all dropped by a 35% floor).
        # ...but a share under 15 ms is a stamp grazing a cut, not a spoken word: it made a
        # 13 ms page ("if", trimmed away on purpose) that flashed for one frame.
        if best and bov >= 15:
            stream.append({**w, "clip": best["id"]})
    stream.sort(key=lambda w: (order[w["clip"]], w["start"]))

    for fx, res in apply_fixes(stream, plan.get("fixes", [])):
        print(f"  fix {fx['find']} -> {fx['replace']}: {res}")
    marks = find_emphasis(stream, plan.get("emphasis", []))

    # hook phases (composed stack + heroes) consume the hook clip's words
    pages = []
    hook = plan.get("hook")
    hook_clip = hook["clip"] if hook else None
    if hook:
        start = next(i for i, w in enumerate(stream) if w["clip"] == hook_clip)
        hw = stream[start:]  # phases may span split clips (contiguous in spine time)
        sp = lambda w: max(
            round(segs[w["clip"]]["spineInMs"] + (w["start"] - segs[w["clip"]]["srcInMs"])),
            segs[w["clip"]]["spineInMs"])
        pos = 0

        def take(txt):
            nonlocal pos
            w = hw[pos]
            assert norm(w["text"]) == norm(txt), \
                f"hook mismatch: plan {txt!r} vs spoken {w['text']!r}"
            pos += 1
            return w

        if hook.get("title"):
            t0 = segs[hook_clip]["spineInMs"]
            lines = [[{"text": it if isinstance(it, str) else it["t"],
                       "fancy": (not isinstance(it, str)) and it.get("fancy", False)}
                      for it in ln] for ln in hook["title"]["lines"]]
            tt = hook["title"]
            page = {"type": "title", "grade": 0, "fromMs": t0,
                    "toMs": t0 + tt["showMs"], "lines": lines,
                    # HookTitle: complete at frame 0 by law (both packs' templates say
                    # reveal "none"); a plan has to ASK for an entrance to get one
                    "reveal": tt.get("reveal", "none"), "revealMs": tt.get("revealMs", 1200),
                    "logos": tt.get("logos", []), "look": tt.get("look", "plain")}
            # a title may set its own size and height: one long line on a label has to
            # fit the frame whatever the copy, and format.titleFontPx is sized for two
            for k in ("fontPx", "topFrac"):
                if tt.get(k) is not None:
                    page[k] = tt[k]
            pages.append(page)
        emitted = []
        for ph in hook["phases"]:
            if ph["type"] == "stack":
                lines = []
                first = None
                for ln in ph["lines"]:
                    ws = []
                    for item in ln:
                        for tok in item["t"].split():
                            w = take(tok)
                            first = first or w
                            ws.append({"text": tok, "atMs": sp(w)})
                    line = {"size": item.get("size", "s"),
                            "accent": item.get("accent", False), "words": ws}
                    if item.get("spread") is False:   # a 3-word small line stays centred
                        line["spread"] = False
                    lines.append(line)
                emitted.append({"type": "block", "variant": "stack", "grade": 0,
                                "fromMs": sp(first),
                                "lines": lines})
            elif ph["type"] == "words":
                for _ in range(ph["count"]):
                    w = take(w0 := hw[pos]["text"])
                    emitted.append({"type": "word", "grade": 0, "text": w["text"],
                                    "fromMs": sp(w)})
            elif ph["type"] == "heroTail":
                ws = [take(t) for t in ph["hero"].split()]
                blk = {"type": "block", "variant": "heroTail", "grade": 2,
                       "fromMs": sp(ws[0]), "fancy": ph.get("fancy", False),
                       "hero": ph["hero"], "tail": []}
                for ln in ph["tail"]:
                    blk["tail"].append({"words": [
                        {"text": (w := take(t))["text"], "atMs": sp(w)}
                        for t in ln]})
                emitted.append(blk)
            elif ph["type"] == "hero":
                w = take(ph["t"])
                emitted.append({"type": "word", "grade": 2, "text": ph["t"],
                                "fancy": ph.get("fancy", False), "fromMs": sp(w)})
        # each page/block holds until the next one starts; the last to segment end
        last_clip = hw[pos - 1]["clip"]
        for w in hw[pos:]:  # leftover words in the last consumed clip stay normal
            if w["clip"] != last_clip:
                break
            emitted.append({"type": "word", "grade": 0, "text": w["text"], "fromMs": sp(w)})
        for a, b in zip(emitted, emitted[1:]):
            a["toMs"] = b["fromMs"]
        emitted[-1]["toMs"] = segs[last_clip]["spineOutMs"]
        # a stack must stay readable: hold >= stackHoldMs after its last word
        # pops, masking or shifting the word pages spoken during the hold
        hold_ms = fmt.get("stackHoldMs", 800)
        min_hold = fmt.get("heroMinMs", 600)
        for idx, pg in enumerate(emitted):
            if pg.get("variant") != "stack":
                continue
            last_pop = max(w["atMs"] for ln in pg["lines"] for w in ln["words"])
            nxt = emitted[idx + 1] if idx + 1 < len(emitted) else None
            if nxt and nxt.get("variant") == "stack":
                # a stack followed by a stack: the first clears the moment the second lands
                # (Creator Format 1: the whole stack clears at once when the next clause starts), and the
                # second lands no earlier than heroMinMs after the first's last word, so a
                # 60 ms word like "building" is still readable; its earlier words pop together
                # ("IF / YOU'RE BUILDING" -> "A CODING HARNESS", the creator 2026-09-05)
                land = max(nxt["fromMs"], last_pop + min_hold)
                pg["toMs"] = land
                nxt["fromMs"] = land
                for ln in nxt["lines"]:
                    for w in ln["words"]:
                        w["atMs"] = max(w["atMs"], land)
                continue
            hold_end = last_pop + hold_ms
            if hold_end <= pg["toMs"]:
                continue
            pg["toMs"] = hold_end
            for nx in emitted[idx + 1:]:
                if nx["fromMs"] >= hold_end:
                    break
                if nx["toMs"] - hold_end < 120:
                    nx["drop"] = True
                else:
                    nx["fromMs"] = hold_end
        emitted = [p for p in emitted if not p.get("drop")]
        pages.extend(emitted)
        hook_clips = {w["clip"] for w in hw[:pos]}

    # per-clip pages in spine time
    bridge, tail = fmt["wordGapBridgeMs"], fmt["wordTailMs"]
    for c in kept:
        if hook and c["id"] in hook_clips:
            continue
        s = segs[c["id"]]
        cw = [(i, w) for i, w in enumerate(stream) if w["clip"] == c["id"]]
        to_spine = lambda t: s["spineInMs"] + (t - s["srcInMs"])
        for j, (i, w) in enumerate(cw):
            frm = max(to_spine(w["start"]), s["spineInMs"])
            if j + 1 < len(cw):
                nxt = to_spine(cw[j + 1][1]["start"])
                gap = nxt - to_spine(w["end"])
                to = nxt if gap <= bridge else min(to_spine(w["end"]) + tail, nxt)
            else:
                to = s["spineOutMs"]
            to = min(to, s["spineOutMs"])
            if to <= frm:
                continue
            m = marks.get(i, {})
            text = w["text"]
            if m.get("caps"):
                text = text.upper()
            if m.get("quote"):
                p = trail_punct(text)
                text = f'"{text[:len(text)-len(p)] if p else text}"{p}'
            pages.append({"text": text, "fromMs": round(frm), "toMs": round(to),
                          "grade": m.get("grade", 0), "fancy": m.get("fancy", False),
                          "group": m.get("group", -1)})

    # merge grade-2 groups into one hero page, absorb to heroMinMs
    pages.sort(key=lambda p: p["fromMs"])
    out, i = [], 0
    while i < len(pages):
        p = pages[i]
        if p["grade"] == 2 and "group" in p:
            j = i
            while j + 1 < len(pages) and pages[j + 1]["group"] == p["group"]:
                j += 1
            grp = pages[i:j + 1]
            lead = plan.get("emphasis", [])[p["group"]].get("lead", 0)
            if lead:
                # small white lead line above the big accent word(s)
                hw = [{"text": re.sub(r"[.,;:]+$", "", x["text"].upper()),
                       "atMs": x["fromMs"]} for x in grp[lead:]]
                hero = {"type": "block", "variant": "stack", "grade": 2,
                        "fromMs": p["fromMs"], "toMs": grp[-1]["toMs"],
                        "lines": [
                            {"size": "s", "accent": False,
                             "words": [{"text": x["text"], "atMs": x["fromMs"]}
                                       for x in grp[:lead]]},
                            {"size": "h", "accent": True, "words": hw}]}
            else:
                hero = {"text": " ".join(x["text"] for x in grp).upper(),
                        "fromMs": p["fromMs"], "toMs": grp[-1]["toMs"], "grade": 2,
                        "fancy": p.get("fancy", False)}
                hero["text"] = re.sub(r"[.,;:]+$", "", hero["text"])
            # a hero lifted out of the caption line: hung above their head, in
            # quotes, at its own size (the creator 2026-09-04, on the two words you
            # type: "we should have when the creator says it \"use subagents\" on top of
            # their head with \" \""). Group-level, so the quotes wrap the phrase
            # and not each word.
            e = plan.get("emphasis", [])[p["group"]]
            if e.get("quoteWhole"):
                hero["quote"] = True
            if e.get("topFrac") is not None:
                hero["topFrac"] = e["topFrac"]
            if e.get("fontPx"):
                hero["fontPx"] = e["fontPx"]
            k = j
            anchor = hero["lines"][1]["words"][0]["atMs"] if lead else hero["fromMs"]
            while hero["toMs"] - anchor < fmt["heroMinMs"] and k + 1 < len(pages) \
                    and pages[k + 1]["grade"] == 0 \
                    and pages[k + 1]["fromMs"] - hero["toMs"] < 200:
                k += 1
                hero["toMs"] = pages[k]["toMs"]
            out.append(hero)
            i = k + 1
        else:
            out.append({k2: v for k2, v in p.items() if k2 != "group"})
            i += 1

    # ASR stamps some words at 60 ms and hands the time to the neighbour ("a"
    # 420 ms, "task" 60 ms). A page under minPageMs takes the missing time back
    # from the page before it, when that page keeps minPageMs itself.
    min_ms = fmt.get("minPageMs", 0)
    if min_ms:
        out.sort(key=lambda p: p["fromMs"])
        for a, b in zip(out, out[1:]):
            if "lines" in a or "lines" in b or a["toMs"] != b["fromMs"]:
                continue
            short = min_ms - (b["toMs"] - b["fromMs"])
            if short > 0 and (a["toMs"] - a["fromMs"]) - short >= min_ms:
                a["toMs"] -= short
                b["fromMs"] -= short
        # a clip's FIRST word has no page behind it to borrow from (the page
        # before belongs to the previous clip and ends on the cut), and its
        # own stamp is early, so it can compile to a single frame ("and" at
        # 35 ms on reference edit B). Borrow forward instead: hold it longer and start
        # the next word late. Readable beats frame-exact by 100 ms.
        for i, a in enumerate(out):
            if "lines" in a:
                continue
            shift = min_ms - (a["toMs"] - a["fromMs"])
            if shift <= 0:
                continue
            # spend the debt across the pages after it: each gives what it can
            # keep above min_ms, the shift decays to zero. Abort if the run
            # ends (a block, a cut) before the debt is paid.
            run, k = [], i
            while shift > 0 and k + 1 < len(out) and out[k]["toMs"] == out[k + 1]["fromMs"] \
                    and "lines" not in out[k + 1]:
                k += 1
                run.append((out[k], shift))  # shift entering this page
                shift = max(0, shift - ((out[k]["toMs"] - out[k]["fromMs"]) - min_ms))
            if shift > 0:  # the run ended before the debt was paid, leave it
                continue
            a["toMs"] += run[0][1] if run else 0
            for j, (pg, sh_in) in enumerate(run):
                pg["fromMs"] += sh_in
                pg["toMs"] += run[j + 1][1] if j + 1 < len(run) else 0
    doc = {"fps": 30, "width": fmt["refWidth"], "height": fmt["refHeight"],
           "durationMs": smap["spineDurationMs"], "style": fmt, "pages": out}
    (proj / "captions.json").write_text(json.dumps(doc, indent=1))
    g1 = sum(1 for p in out if p["grade"] == 1)
    g2 = sum(1 for p in out if p["grade"] == 2)
    print(f"captions.json: {len(out)} pages ({g2} hero, {g1} inline accent), "
          f"{smap['spineDurationMs']/1000:.1f}s")


if __name__ == "__main__":
    main()
