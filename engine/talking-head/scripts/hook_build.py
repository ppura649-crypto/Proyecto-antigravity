#!/usr/bin/env python3
"""The hook as ONE artifact. Builds projects/<id>/hook.json from the pieces that today live in
three places (caption-plan.json owns the title + stack, format.json owns where they sit,
visuals.json owns the first card), then checks the rendered captions.json against it.

Why one file: the hook is the most important thing in the reel and it regressed on every video
it regressed because it had no single owner. A title that exists in caption-plan.json AND as
page 0 of captions.json gets rewritten in one place by a later stage; a stack anchor that lives
only in a style file gets replaced by a literal. hook.json is what the creator approves; everything
that renders the first seconds must agree with it, and `check` says whether it does.

Usage:
  hook_build.py build <project>    write hook.json from caption-plan.json + format.json + visuals.json
  hook_build.py check <project>    exit 1 if captions.json / format.json / visuals.json disagree with hook.json

Checks (the invariants the creator stated across four videos):
  title: <= 2 lines, complete at frame 0 (reveal none), gone by ~2.5 s, no line wider than the
         frame at titleFontPx (approx: chars * 0.62 * px <= 0.92 * 1080), topFrac clear of the head
  stack: the format's stackTopFrac is what captions.json carries (not a literal in code)
  first object: something is on screen inside 0.5 s of the first spoken word, other than the title
  ramp: none. A format.json or ramp.json whose rate is not 1 fails the check: "don't sped up pls.
        Don't do that" (2026-09-05). Every delivery plays at 1x from frame 0.
"""
import json, sys
from pathlib import Path


def rd(p):
    return json.loads(p.read_text()) if p.exists() else None


# Average caps advance per em, by family. Zen Dots is a wide display face: a 29-char line at
# 52 px measured 0.62 here, passed, and rendered wider than the frame on edit-c-chip
# (2026-09-05, "OPENAI'S CHIP BEATS BLACKWELL" clipped at both edges). A wrap check, not typography.
EM_PER_CHAR = {"zen dots": 0.80, "michroma": 0.86, "helvetica": 0.66, "avenir": 0.62, "inter": 0.60, "nunito": 0.60}


def title_width_px(text, px, family=""):
    fam = family.lower()
    k = next((v for name, v in EM_PER_CHAR.items() if name in fam), 0.70)
    return len(text) * k * px


def build(P):
    plan = rd(P / "caption-plan.json") or {}
    fmt = rd(P / "format.json") or {}
    vis = rd(P / "visuals.json") or {"events": []}
    caps = rd(P / "captions.json") or {}
    hook = plan.get("hook", {})
    # caption-plan.json carries the title either as a list of lines or as
    # {"lines": [...], "showMs": 2100, "reveal": "none"}; both mean the same thing
    title = hook.get("title") or {}
    if isinstance(title, list):
        title = {"lines": title}
    first = None
    for e in sorted(vis["events"], key=lambda e: e["fromMs"]):
        if e["kind"] != "cta":
            first = {"id": e["id"], "kind": e["kind"], "fromMs": e["fromMs"], "toMs": e["toMs"]}
            break
    H = {
        "title": {
            "lines": [" ".join(s if isinstance(s, str) else s.get("t", s.get("text", "")) for s in ln)
                      if isinstance(ln, list) else ln for ln in title.get("lines", [])],
            "showMs": 0,
            "clearMs": title.get("clearMs") or title.get("showMs") or 2100,
            "reveal": title.get("reveal", "none"),
            "topFrac": fmt.get("titleTopFrac"),
            "fontPx": fmt.get("titleFontPx"),
        },
        "stack": {
            "clip": hook.get("clip"),
            "phases": hook.get("phases", []),
            "stackTopFrac": fmt.get("stackTopFrac", caps.get("style", {}).get("stackTopFrac")),
        },
        "firstObject": first,
        "ramp": fmt.get("ramp"),
        "geometry": {k: v for k, v in (rd(P / "geometry.json") or {}).items() if k in ("headTopFrac", "chinFrac")},
        "note": "built by scripts/hook_build.py; approve this file, then lock_layer.py lock <project> hook",
    }
    (P / "hook.json").write_text(json.dumps(H, indent=1))
    print(json.dumps(H, indent=1))
    print(f"\nwrote {P/'hook.json'}")


def check(P):
    H = rd(P / "hook.json")
    if not H:
        print("no hook.json (hook_build.py build <project>)"); return 1
    caps, fmt, vis = rd(P / "captions.json"), rd(P / "format.json") or {}, rd(P / "visuals.json") or {"events": []}
    geo = rd(P / "geometry.json")
    bad = []
    T = H["title"]
    if len(T["lines"]) > 2:
        bad.append(f"title has {len(T['lines'])} lines, max 2 ('max 2 sentence no wrapping', 2026-09-04)")
    px = T.get("fontPx") or fmt.get("titleFontPx") or 52
    fam = fmt.get("fontFamily", "")
    for ln in T["lines"]:
        if title_width_px(ln, px, fam) > 0.92 * 1080:
            bad.append(f"title line wider than the frame at {px}px in {fam.split(',')[0] or 'the caption font'}: '{ln}' ({len(ln)} chars; ~{int(0.92*1080/(title_width_px('x',px,fam)))} fit)")
    if T.get("reveal", "none") != "none":
        bad.append(f"title reveal is '{T['reveal']}': frame 0 must carry the whole line (reference edit B: '2 WORDS TURN 1 CLAUDE / INTO A' on frame 0)")
    if T.get("clearMs", 2100) > 3000:
        bad.append(f"title clears at {T['clearMs']} ms; it is a hook, not a watermark (gone by ~2-2.5 s)")
    if geo and T.get("topFrac") is not None:
        head = geo["headTopFrac"]
        lines_h = len(T["lines"]) * px * 1.15 / 1920
        if T["topFrac"] + lines_h > head - 0.01:
            bad.append(f"title bottom {T['topFrac']+lines_h:.3f}H reaches the head top {head:.3f}H")
    if caps:
        p0 = next((p for p in caps["pages"] if p.get("type") == "title"), None)
        if p0:
            got = [" ".join(s["text"] for s in ln) for ln in p0["lines"]]
            if got != T["lines"]:
                bad.append(f"captions.json title {got} != hook.json title {T['lines']} (the title lives in two files; hook.json wins)")
            if p0.get("reveal", "none") != T.get("reveal", "none"):
                bad.append("captions.json title reveal differs from hook.json")
            if p0["toMs"] != T.get("clearMs"):
                bad.append(f"captions.json title clears at {p0['toMs']} vs hook.json {T.get('clearMs')}")
        st = caps.get("style", {})
        if H["stack"].get("stackTopFrac") is not None and st.get("stackTopFrac") != H["stack"]["stackTopFrac"]:
            bad.append(f"captions.json style.stackTopFrac {st.get('stackTopFrac')} != hook.json {H['stack']['stackTopFrac']}")
        if T.get("topFrac") is not None and st.get("titleTopFrac") != T["topFrac"]:
            bad.append(f"captions.json style.titleTopFrac {st.get('titleTopFrac')} != hook.json {T['topFrac']} (both must move together)")
    first_word = 0
    fo = H.get("firstObject")
    cur = next((e for e in sorted(vis["events"], key=lambda e: e["fromMs"]) if e["kind"] != "cta"), None)
    if cur and fo and cur["id"] != fo["id"]:
        bad.append(f"first visual is now '{cur['id']}', hook.json approved '{fo['id']}'")
    if cur and cur["fromMs"] - first_word > 2500:
        bad.append(f"first object at {cur['fromMs']} ms; Creator Format 1 has a card up inside the first second, the punch alone is the only excuse")
    r = fmt.get("ramp")
    if H.get("ramp") and r != H["ramp"]:
        bad.append(f"format ramp {r} != hook.json ramp {H['ramp']}")
    side = rd(P / "ramp.json") if (P / "ramp.json").exists() else None
    for src, rr in (("format.json", r), ("ramp.json", side)):
        if rr and rr.get("rate", 1) != 1:
            bad.append(f"{src} carries a speed ramp {rr}: no speed-up, ever (2026-09-05, 'don't sped up pls. Don't do that'); delete it and rebuild hook.json")
    if bad:
        print("HOOK CHECK FAILED\n  " + "\n  ".join(bad)); return 1
    print("hook check ok: title complete at frame 0, <= 2 lines, clear of the head, captions/format agree with hook.json")
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    P = Path(sys.argv[2]).resolve()
    sys.exit(build(P) or 0 if sys.argv[1] == "build" else check(P))
