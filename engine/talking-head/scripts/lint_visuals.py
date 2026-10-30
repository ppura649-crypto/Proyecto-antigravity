#!/usr/bin/env python3
"""The pre-show lint for the visual layer. Modelled on verify_cut.py: numbers and a pass line,
so "the layer is right" is a claim with evidence, and the creator is never the diff tool.

Runs on visuals.json + visual-plan.md + captions.json (+ geometry.json when it exists).
Every check comes from a correction the creator gave on a real video; the source is named next to it.

  1 plan approved      visual-plan.md exists and carries an `approved:` line (ideas before pixels;
                       every layer built without one was rejected)
  2 lives its idea     a card leaves on the LAST WORD OF ITS IDEA, never before (`until` on the event,
                       the word + ms the plan row's `out on` names), unless the next card takes the same
                       idea over on that frame. The 3 s is a hold budget, not a cutter: a fixed 3 s once cut cards mid-sentence ("sometimes it stops too early. Sometimes we're saying something and we
                       cut the visual", ). A card lingering > 1.2 s past its last word is the
                       opposite fault ("stop on ago,"); an idea over 4.5 s is
                       usually two pictures. `"long": "<why>"` records the judgment either way. Events
                       without `until` fall back to the old rule (<= 3 s or `long`) and are warned.
  3 no kind twice      every event a different kind ("NEVER USE the same visual twice", );
                       `float` and `shot` are containers (a different real artifact each time), and an
                       event with `callback: "<id>"` is the blessed callback of an earlier object
  4 hold after beat    the last beat lands >= 600 ms before toMs ("it cuts too fast. We don't even get
                       to see anything", ); `clock: "run"` events are exempt (their motion IS
                       the argument and never stops: the flywheel, a code glide)
  5 in the band        cards rest inside the measured band: top >= cardTopFrac (platform chrome) and
                       the card is never anchored to a guessed head (needs geometry.json + format.json)
  6 on subject         every authored header/label word appears in the transcript or in an allow list
                       ("all along i talk about skills, and you put CLAUDE.md ... are we out of subject?", )
  7 coverage           no bare stretch over 6 s outside the last 8 s ("it should always have something
                       to show", ); event rate reported against Creator Format 1's 3.7-5.5 s
  8 last 5-8 s         no card in the final 5 s except `cta` (creator-format-1-visuals.md: the close is card-free)
  9 on the word        the card pops within 300 ms after its trigger word and never before it (law 4 of
                       04-visuals.md); a deliberate early pop carries `trigger.note` (a full moat seen for a beat before it drains on its word)

Usage: python3 scripts/lint_visuals.py <project_dir> [--strict]
Exit 1 on any FAIL. --strict turns WARN into FAIL.
"""
import json, re, sys, unicodedata
from pathlib import Path

MAX_MS = 3000        # the hold budget: a card with nothing left to say past this is dead time
IDEA_MAX_MS = 4500   # an idea longer than this is usually two pictures (plan: a second row)
LINGER_MS = 1200     # a hold past the idea's last word longer than this is the overstay fault
EARLY_MS = 100       # a pop this far before the trigger word is early ("never early")
LATE_MS = 300        # a pop this far after the trigger word is late (Creator Format 1: lag under 0.3 s)
HOLD_MS = 600
BARE_MS = 6000
TAIL_FREE_MS = 5000
ALLOW = {"claude", "code", "task", "tasks", "agent", "agents", "subagent", "subagents", "main", "the", "a",
         "of", "one", "and", "or", "to", "in", "on", "vs", "per", "each", "more", "less", "quality",
         "tokens", "source", "install", "running", "done", "answer", "answers", "job", "jobs", "team"}


def load(P):
    V = json.loads((P / "visuals.json").read_text())["events"]
    C = json.loads((P / "captions.json").read_text())
    F = json.loads((P / "format.json").read_text()) if (P / "format.json").exists() else {}
    G = json.loads((P / "geometry.json").read_text()) if (P / "geometry.json").exists() else None
    plan = (P / "visual-plan.md").read_text() if (P / "visual-plan.md").exists() else ""
    return V, C, F, G, plan


def norm(s):
    """lowercase, accents folded (Jalapeño == JALAPENO), punctuation dropped"""
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower())


def word_index(C):
    """Every spoken word in spine order as [norm, raw, atMs, endMs]. A word page carries its own
    end; a stack word ends when the next spoken word starts (the stack page holds past it)."""
    ws = []
    for p in C["pages"]:
        if p.get("type") == "title":
            continue
        if p.get("lines"):
            for ln in p["lines"]:
                for w in (ln if isinstance(ln, list) else ln.get("words", [])):
                    if isinstance(w, dict) and "atMs" in w:
                        ws.append([norm(w["text"]), w["text"], w["atMs"], p.get("toMs")])
        elif p.get("text"):
            ws.append([norm(p["text"]), p["text"], p["fromMs"], p["toMs"]])
    ws.sort(key=lambda x: x[2])
    for i, w in enumerate(ws):
        nxt = ws[i + 1][2] if i + 1 < len(ws) else None
        if w[3] is None or (nxt is not None and nxt < w[3]):
            w[3] = nxt if nxt is not None else w[2] + 300
    return ws


def resolve(ref, ws):
    """A `{word, atMs?, occurrence?}` reference -> (atMs, endMs) or None."""
    if not ref or not ref.get("word"):
        return None
    hits = [w for w in ws if w[0] == norm(ref["word"])]
    if not hits:
        return None
    if ref.get("atMs") is not None:
        w = min(hits, key=lambda w: abs(w[2] - ref["atMs"]))
        if abs(w[2] - ref["atMs"]) > 1500:
            return None
    else:
        w = hits[min(len(hits), max(1, ref.get("occurrence", 1))) - 1]
    return w[2], w[3]


def transcript_words(C):
    words = set()
    for pg in C["pages"]:
        if pg.get("text"):  # a word page (edit-c-chip 2026-09-05: these were missing, every word read as off-subject)
            for tok in re.findall(r"[a-z0-9]+", norm_text(pg["text"])):
                words.add(tok)
        for ln in pg.get("lines", []):
            items = ln if isinstance(ln, list) else ln.get("words", [])
            for w in items:
                t = w.get("text", "") if isinstance(w, dict) else str(w)
                for tok in re.findall(r"[a-z0-9]+", norm_text(t)):
                    words.add(tok)
    return words


def norm_text(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()


def authored_strings(ev):
    """Every string a card prints that was written by us: heads, labels, names, notes."""
    out = []
    def walk(x, key=""):
        if isinstance(x, dict):
            for k, v in x.items():
                walk(v, k)
        elif isinstance(x, list):
            for v in x:
                walk(v, key)
        elif isinstance(x, str) and key in ("head", "label", "note", "duty", "name", "meterLabel",
                                            "depthLabel", "chipLabel", "down", "up", "unit", "parent"):
            out.append(x)
    walk(ev.get("data", {}))
    for a in ev.get("agents", []):
        out.append(a.get("name", ""))
    return out


def check_idea(V, ws):
    """Check 2. Returns (fails, warns, detail)."""
    order = sorted(V, key=lambda e: e["fromMs"])
    early, over, linger, longidea, missing = [], [], [], [], []
    for i, e in enumerate(order):
        if e["kind"] == "cta":
            continue
        span = e["toMs"] - e["fromMs"]
        u = resolve(e.get("until"), ws)
        if not u:
            missing.append(e["id"])
            if span > MAX_MS and not e.get("long"):
                over.append((e["id"], span))
            continue
        u_at, u_end = u
        if u_end - e["toMs"] > EARLY_MS:
            nxt = order[i + 1] if i + 1 < len(order) else None
            t = resolve(nxt.get("trigger"), ws) if nxt else None
            handed = nxt and nxt["fromMs"] <= e["toMs"] + 50 and t and t[0] <= u_at
            if not handed:
                early.append((e["id"], e["until"]["word"], u_end - e["toMs"]))
        elif e["toMs"] - u_end > LINGER_MS and not e.get("long"):
            linger.append((e["id"], e["until"]["word"], e["toMs"] - u_end))
        if span > IDEA_MAX_MS and not e.get("long"):
            longidea.append((e["id"], span))
    # length alone is never a fault (2026-09-07): a card may run as long as it keeps bringing motion;
    # stopping early is the fault, a long card is a question
    fails = ["idea"] if early else []
    warns = ["idea"] if (over or linger or longidea or missing) and not fails else []
    parts = []
    if early:
        parts.append("stops early: " + ", ".join(f"{i} {ms} ms before '{w}' ends" for i, w, ms in early))
    if over:
        parts.append("long, with no `until` and no `long` (does it keep moving?): " + ", ".join(f"{i} {ms/1000:.1f}s" for i, ms in over))
    if linger:
        parts.append("lingers: " + ", ".join(f"{i} {ms} ms past '{w}'" for i, w, ms in linger))
    if longidea:
        parts.append("idea over 4.5 s (two pictures?): " + ", ".join(f"{i} {ms/1000:.1f}s" for i, ms in longidea))
    if missing:
        parts.append(f"no `until` on {', '.join(missing)} (the plan row's `out on`)")
    if not parts:
        longest = max(e["toMs"] - e["fromMs"] for e in V if e["kind"] != "cta")
        parts.append(f"every card leaves on its last word; longest {longest/1000:.1f}s")
    return fails, warns, "; ".join(parts)


def main():
    P = Path(sys.argv[1]).resolve()
    strict = "--strict" in sys.argv
    V, C, F, G, plan = load(P)
    ws = word_index(C)
    dur = C["durationMs"]
    fails, warns = [], []
    say = lambda n, name, ok, detail, warn=False: print(
        f"{n} {name:<18}{'PASS' if ok else ('WARN' if warn else 'FAIL')}  {detail}")

    # 1 plan approved
    ok = bool(re.search(r"^approved:", plan, re.M))
    say(1, "plan approved", ok, "visual-plan.md has an `approved:` line" if ok else
        "no `approved: <date> <how>` line in visual-plan.md (write the ideas, show them, then add it)")
    fails += [] if ok else ["plan"]

    # 2 lives its idea
    f2, w2, detail = check_idea(V, ws)
    say(2, "lives its idea", not (f2 or w2), detail, warn=bool(w2))
    fails += f2
    warns += w2

    # 3 no kind twice
    # `float` and `shot` are containers, not visuals: seven different real artifacts are seven
    # visuals (reference edit A shipped five shots; edit-c-chip 2026-09-05). An event that names the
    # earlier one it changes (`callback: "<id>"`) is the callback the pattern blesses, not a repeat.
    kinds = {}
    for e in V:
        if e.get("callback"):
            continue
        kinds.setdefault(e["kind"], []).append(e["id"])
    dup = {k: v for k, v in kinds.items() if len(v) > 1 and k not in ("float", "shot")}
    say(3, "no kind twice", not dup, ", ".join(f"{k} x{len(v)} ({', '.join(v)})" for k, v in dup.items())
        if dup else f"{len(V)} events, {len(kinds)} kinds")
    fails += [] if not dup else ["twice"]

    # 4 hold after the last beat (a `run` clock never stops moving, nothing to hold)
    short = []
    for e in V:
        if e.get("clock") == "run":
            continue
        beats = [v for v in (e.get("beats") or {}).values() if isinstance(v, (int, float))]
        for ln in e.get("lines", []):
            beats.append(ln["atMs"])
        if beats and e["toMs"] - max(beats) < HOLD_MS:
            short.append((e["id"], e["toMs"] - max(beats)))
    runs = [e["id"] for e in V if e.get("clock") == "run"]
    say(4, "hold after beat", not short, ", ".join(f"{i} {ms} ms" for i, ms in short) if short
        else f">= {HOLD_MS} ms everywhere" + (f" (run clock, exempt: {', '.join(runs)})" if runs else ""))
    fails += [] if not short else ["hold"]

    # 5 in the band
    if G and F.get("cardTopFrac") is not None:
        top = F["cardTopFrac"]
        bad = [e["id"] for e in V if (e.get("card") or {}).get("yFrac") is not None and e["card"]["yFrac"] < top]
        drift = abs(F.get("cardBottomFrac", 0) - G["suggest"]["cardBottomFrac"]) > 0.06
        ok = not bad and not drift
        say(5, "in the band", ok, (f"cards above cardTopFrac: {bad}; " if bad else "") +
            (f"format cardBottomFrac {F.get('cardBottomFrac')} vs measured suggestion {G['suggest']['cardBottomFrac']} (head top {G['headTopFrac']})" if drift else "band matches geometry.json"))
        fails += [] if ok else ["band"]
    else:
        say(5, "in the band", False, "no geometry.json (run scripts/measure_face.py) or no cardTopFrac in format.json")
        fails += ["band"]

    # 6 on subject
    words = transcript_words(C)
    off = []
    for e in V:
        for s in authored_strings(e):
            toks = re.findall(r"[a-z]+", norm_text(s))
            miss = [t for t in toks if t not in words and t not in ALLOW and len(t) > 2]
            if miss:
                off.append((e["id"], s, miss))
    if off:
        warns.append("subject")
    say(6, "on subject", not off, "; ".join(f"{i} '{s}' -> {m}" for i, s, m in off[:6]) if off
        else "every authored word is in the transcript", warn=True)

    # 7 coverage + rate
    ev = sorted((e["fromMs"], e["toMs"]) for e in V if e["kind"] != "cta")
    gaps, cur = [], 0
    for a, b in ev:
        if a - cur > BARE_MS and a < dur - 8000:
            gaps.append((cur, a))
        cur = max(cur, b)
    rate = dur / max(1, len(V))
    ok = not gaps
    say(7, "coverage", ok, (f"bare {', '.join(f'{a/1000:.1f}-{b/1000:.1f}s' for a, b in gaps)}; " if gaps else "") +
        f"1 event per {rate/1000:.1f} s (Creator Format 1 3.7-5.5)")
    fails += [] if ok else ["coverage"]

    # 8 the close
    # a `long` event that hands over exactly to the CTA is their call, not a stray card
    # (2026-09-06: the flywheel accelerates through "each loop makes the next one faster")
    cta_from = min([e["fromMs"] for e in V if e["kind"] == "cta"] or [dur])
    tail = [e for e in V if e["kind"] != "cta" and e["toMs"] > dur - TAIL_FREE_MS]
    late = [e["id"] for e in tail if not (e.get("long") and e["toMs"] <= cta_from)]
    handed = [e["id"] for e in tail if e.get("long") and e["toMs"] <= cta_from]
    say(8, "close card-free", not late, f"cards inside the last 5 s: {late}" if late
        else ("last 5 s = talking head + CTA" + (f" (long {handed} hands over to the CTA)" if handed else "")))
    fails += [] if not late else ["close"]

    # 9 on the word
    early, lateps, noted = [], [], []
    for e in V:
        t = resolve(e.get("trigger"), ws)
        if not t:
            continue
        d = e["fromMs"] - t[0]
        if e.get("trigger", {}).get("note"):
            noted.append(e["id"])
        elif d < -EARLY_MS:
            early.append((e["id"], -d))
        elif d > LATE_MS:
            lateps.append((e["id"], d))
    fails += ["word"] if early else []
    if lateps and not early:
        warns.append("word")
    say(9, "on the word", not (early or lateps),
        ("early: " + ", ".join(f"{i} {ms} ms" for i, ms in early) + "; " if early else "") +
        ("late: " + ", ".join(f"{i} {ms} ms" for i, ms in lateps) if lateps else "") if (early or lateps)
        else "every pop within 300 ms after its word" + (f" (noted: {', '.join(noted)})" if noted else ""),
        warn=bool(lateps) and not early)

    bad = fails + (warns if strict else [])
    print(f"\n{'VISUAL LINT PASS' if not bad else 'VISUAL LINT FAILED: ' + ', '.join(bad)}"
          + ("" if not warns or strict else f"  (warnings: {', '.join(warns)})"))
    print("then: stills at every event frame, read at phone width, before any full render")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
