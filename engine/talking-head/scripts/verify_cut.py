#!/usr/bin/env python3
"""The five checks from references/01b-verifying-a-cut.md, run on the rendered master.

Never hand them a cut that has not passed these. Checks 1-4 are numeric and run here;
check 5 (gaze) is the eye-band tile written by gaze_tile.py, which needs eyes on it.

  1 no word touched   dropped audio TOUCHING every boundary not sustained over -32 dB
  2 dead air          silence before the first audible phoneme, median < 60 ms, none > 400
  3 no clicks         delta AT each seam under half the file's p99.9
  4 loudness          -14 LUFS, true peak under -1 dB, zero samples at or above 32700
  6 last word         the LAST clip's out-point sits >= 150 ms after the transcript end of its
                      last word (the energy gate closes on the word's own decay; three videos
                      shipped with the CTA's final word shaved: reference edit A, reference edit B, reference edit E)
  7 no repeat         kept clips never overlap in SOURCE time (a hand-trimmed out-point on a
                      clip that had been split made 1.5 s of speech play twice; the numeric
                      checks all passed because every boundary was clean)

Usage: python3 verify_cut.py <project_dir>
"""
import json, math, subprocess, sys, wave
from pathlib import Path

db = lambda x: 20 * math.log10(max(x, 1e-9))


def levels(P):
    return [float(l) for l in open(P / "levels.txt") if l.strip() and not l.startswith("@")]


def room_tone(lev, segs):
    """p75 of the levels in the gaps BETWEEN kept takes, same measure as cut_variants."""
    vals = []
    for a, b in zip(segs, segs[1:]):
        g = lev[a["srcOutMs"] + 400 : b["srcInMs"] - 400]
        if len(g) > 400:
            vals += g
    s = sorted(vals)
    return db(s[int(len(s) * 0.75)]) if vals else -50.0


def check_words(lev, segs, win=40, need=18, limit=-32.0):
    """Compare each boundary against the DROPPED audio only, never a neighbouring kept clip:
    otherwise every pair of consecutive sentences reads as a false positive.

    The dropped audio must also be SUSTAINED (need of win ms over the limit) and TOUCHING
    the boundary. A shaved word is loud right at the cut and stays loud; an isolated 10-20 ms
    transient with silence between it and the kept region is a lip part or a breath, which is
    exactly what the cut is supposed to drop. reference edit D clip 7: a -30.7 dB spike 90 ms out with
    50 ms of silence after it read as "cut into speech" under a plain max-over-150 ms test."""
    th = 10 ** (limit / 20)
    bad = []
    for k, s in enumerate(segs):
        pre_lo = segs[k - 1]["srcOutMs"] if k else 0
        a = max(pre_lo, s["srcInMs"] - win)
        w = lev[a : s["srcInMs"]]
        if sum(1 for v in w if v >= th) >= need:
            bad.append(("in", s["id"], s["srcInMs"], db(max(w))))
        post_hi = segs[k + 1]["srcInMs"] if k + 1 < len(segs) else len(lev)
        b = min(post_hi, s["srcOutMs"] + win)
        w = lev[s["srcOutMs"] : b]
        if sum(1 for v in w if v >= th) >= need:
            bad.append(("out", s["id"], s["srcOutMs"], db(max(w))))
    return bad


def check_dead_air(lev, segs, rt):
    th = 10 ** ((rt + 15) / 20)
    out = []
    for s in segs:
        seg = lev[s["srcInMs"] : s["srcOutMs"]]
        first = next((i for i, v in enumerate(seg) if v >= th), len(seg))
        out.append((s["id"], first))
    return out


def check_clicks(P, segs):
    """Sample-to-sample delta at each splice against the file's own p99.9."""
    wav = P / "_verify.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(P / "master.mp4"),
                    "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", str(wav)], check=True)
    with wave.open(str(wav)) as w:
        sr, n = w.getframerate(), w.getnframes()
        import array
        a = array.array("h"); a.frombytes(w.readframes(n))
    d = [abs(a[i + 1] - a[i]) for i in range(len(a) - 1)]
    p999 = sorted(d)[int(len(d) * 0.999)]
    peak = max(abs(v) for v in a)
    clipped = sum(1 for v in a if abs(v) >= 32700)
    # The delta AT the seam, not a windowed max: a +-24 sample window catches the normal
    # oscillation of the speech either side (reference edit D clip 20 read 4100 from a voiced cycle
    # 5 samples in, while the seam itself was 2051 and the 200 ms before it reached 8324).
    worst = []
    for s in segs[1:]:
        c = int(s["spineInMs"] / 1000 * sr)
        worst.append((s["id"], abs(a[c] - a[c - 1]) if c else 0))
    wav.unlink()
    return p999, peak, clipped, worst


def check_last_word(P, segs, air_ms=150):
    """The last clip is not a clip like the others: nothing follows it to mask a shaved tail,
    and it carries the ask of the reel. Take its floor from the transcript, never the gate."""
    words = [json.loads(l) for l in open(P / "words.json") if l.strip()]
    last = segs[-1]
    inside = [w for w in words if last["srcInMs"] <= w["start"] <= last["srcOutMs"] + 600]
    if not inside:
        return None, None, None
    w = max(inside, key=lambda w: w["end"])
    return w["text"], w["end"], last["srcOutMs"] - w["end"]


def check_loudness(P):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(P / "master.mp4"),
                        "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    # peak=true prints "True peak:" as a heading with "Peak:" under it. Read that Peak,
    # never the sample peak (01b: ebur128's plain Peak line is the sample peak).
    tail = r.stderr[r.stderr.rfind("Summary"):]
    out = {}
    for l in tail.splitlines():
        if ":" in l and l.startswith(" "):
            k, v = l.strip().split(":", 1)
            if v.strip():
                out[k] = v.strip()
    return out


def main():
    P = Path(sys.argv[1])
    lev = levels(P)
    segs = json.loads((P / "spine-map.json").read_text())["segments"]
    rt = room_tone(lev, segs)
    ok = True

    print(f"room tone {rt:.1f} dB   {len(segs)} clips   "
          f"{json.loads((P/'spine-map.json').read_text())['spineDurationMs']/1000:.2f}s\n")

    bad = check_words(lev, segs)
    print(f"1 no word touched   {'PASS' if not bad else 'FAIL'}  "
          f"(dropped audio at every boundary under -32 dB)")
    for side, cid, t, m in bad:
        print(f"    clip {cid} {side} @ {t/1000:.2f}s  dropped peak {m:+.1f} dB")
    ok &= not bad

    da = check_dead_air(lev, segs, rt)
    vals = sorted(v for _, v in da)
    med = vals[len(vals) // 2]
    over = [(c, v) for c, v in da if v > 400]
    print(f"2 dead air          {'PASS' if med < 60 and not over else 'FAIL'}  "
          f"median {med} ms, max {vals[-1]} ms, {len(over)} clips over 400 ms")
    ok &= med < 60 and not over

    p999, peak, clipped, worst = check_clicks(P, segs)
    wmax = max(worst, key=lambda x: x[1]) if worst else (None, 0)
    print(f"3 no clicks         {'PASS' if wmax[1] < p999/2 else 'FAIL'}  "
          f"worst seam delta {wmax[1]} (clip {wmax[0]}) vs p99.9 {p999}, half = {p999//2}")
    ok &= wmax[1] < p999 / 2

    L = check_loudness(P)
    tp = float(L["Peak"].split()[0]) if "Peak" in L else None
    integ = float(L["I"].split()[0])
    print(f"4 loudness          "
          f"{'PASS' if abs(integ+14) < 0.5 and (tp is None or tp < -1) and clipped == 0 else 'FAIL'}  "
          f"I {integ} LUFS, true peak {tp} dBFS, {clipped} clipped samples "
          f"(sample peak {peak})")
    # the true peak counts (it was printed and then ignored, so a 0.0 dBTP master passed)
    ok &= abs(integ + 14) < 0.5 and clipped == 0 and (tp is None or tp < -1)

    word, wend, margin = check_last_word(P, segs)
    if word is None:
        print("6 last word         SKIP  no transcript words inside the last clip")
    else:
        # the tail can be capped by the PICTURE: on reference edit D the creator blinks 151 ms after "over."
        # and then looks down out of frame, so 150 ms of air cannot be had. A `tailNote` on
        # the last clip says so, and the check reports CAPPED instead of a bare FAIL, so the
        # next session does not "fix" it by ending the reel on a blink.
        note = ""
        try:
            last = [c for c in json.loads((P / "cuts.json").read_text())["clips"] if c["keep"]][-1]
            note = last.get("tailNote", "")
        except Exception:
            pass
        good = margin >= 150
        state = "PASS" if good else ("CAPPED" if note and margin > 0 else "FAIL")
        print(f"6 last word         {state}  "
              f"'{word}' ends {wend} ms, clip out {segs[-1]['srcOutMs']} ms, margin {margin:+d} ms (need >= 150)"
              + (f"\n                          capped: {note}" if state == "CAPPED" else ""))
        ok &= good or state == "CAPPED"

    rep = [(a["id"], b["id"], a["srcOutMs"] - b["srcInMs"])
           for a, b in zip(segs, segs[1:]) if b["srcInMs"] < a["srcOutMs"]]
    print(f"7 no repeat         {'PASS' if not rep else 'FAIL'}  "
          f"kept clips never overlap in source time")
    for a, b, ov in rep:
        print(f"    clip {a} runs {ov} ms past the start of clip {b}: that audio plays twice")
    ok &= not rep

    print(f"\n{'ALL NUMERIC CHECKS PASS' if ok else 'SOMETHING FAILED'} "
          f"- check 5 (gaze) is the eye tile, look at it")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
