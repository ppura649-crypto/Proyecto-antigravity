#!/usr/bin/env python3
"""The take, before the cut: what the cut engine reads, gathered from this video's own files.

Goal. A cut is measured on the clip's speech energy and cut on the clip's words, so the cut
scripts need three things beside the clip: the words (words.json), the level curve (levels.txt,
one peak per millisecond) and where the clip is (source.txt). Nothing here is the buyer's to do.

Reasoning. The cut engine came from a room where those files were made by hand or by tools that run
on one operating system. Here they are made from the take the buyer recorded and the transcript the
runtime already wrote, with ffmpeg and the standard library, the same on every machine. The clip is
the SOURCE where there is one: the reference tool cut its spine straight from the .mov, and a
re-encode of a five minute take costs four minutes and a gigabyte to say the same thing. The level
curve is the peak per millisecond of the decoded audio: a blank line, `@start`, then a value a line.

The words are checked against the audio first. Speech the transcript never heard can never be
selected, cut on, captioned or landed on: one take came back missing 69 of its 323 words, the
closing ask among them, so prepare measures the coverage and refuses under 97 per cent.

The whole take is a cut too. A buyer who keeps the take as recorded still needs a spine and a
mastered audio so the captions, the pictures and the delivery read the same file, so `whole` makes
them from the clip without cutting a frame, all-intra, because the renderer seeks by frame.

Usage:
  take.py prepare <project> [--force]   source.txt, words.json, levels.txt, peaks.json, coverage
  take.py whole   <project>             no cut: spine.mp4 is the whole take, then master_audio.py
  take.py status  <project>             what exists

Then, for a cut (references/01-cut-and-review.md):
  build_cuts.py, select_takes.py, cut_variants.py d-hard, render_spine.py, master_audio.py,
  verify_cut.py, gaze_tile.py, lock_layer.py lock <project> cut "<what they said>".
"""
import array
import json
import math
import os
import shutil
import subprocess
import sys
from pathlib import Path

FFMPEG = os.environ.get("KEYFRAMES_FFMPEG", "ffmpeg")
FFPROBE = os.environ.get("KEYFRAMES_FFPROBE", "ffprobe")
db = lambda x: 20 * math.log10(max(x, 1e-9))


def root_of(P: Path) -> Path:
    at = P.resolve()
    while at.parent != at:
        if (at / "runtime.json").exists():
            return at
        at = at.parent
    sys.exit("This video must live in a Keyframes folder with runtime.json.")


def rd(p: Path, fallback=None):
    try:
        return json.loads(p.read_text())
    except (OSError, ValueError):
        return fallback


def resolve_in(root: Path, P: Path, value):
    """A path from project.json or media.json: absolute, or relative to the folder or the project."""
    if not value or not isinstance(value, str):
        return None
    p = Path(value)
    if p.is_absolute():
        return p if p.exists() else None
    for base in (root, P):
        q = base / p
        if q.exists():
            return q.resolve()
    return None


def inputs(P: Path):
    """The clip and its words, the way the video's checklist finds them."""
    root = root_of(P)
    project = rd(P / "project.json", {}) or {}
    media = rd(root / "context" / "inputs" / "media.json", {}) or {}
    source = resolve_in(root, P, project.get("source"))
    mezzanine = resolve_in(root, P, project.get("mezzanine"))
    transcript = resolve_in(root, P, project.get("transcript"))
    entry = None
    for m in media.values():
        if not isinstance(m, dict):
            continue
        ms = resolve_in(root, P, m.get("path"))
        mm = resolve_in(root, P, m.get("mezzanine"))
        if (source and ms == source) or (mezzanine and mm == mezzanine):
            entry = m
            break
    if entry:
        mezzanine = mezzanine or resolve_in(root, P, entry.get("mezzanine"))
        transcript = transcript or resolve_in(root, P, entry.get("transcript"))
        source = source or resolve_in(root, P, entry.get("path"))
    if (P / "words.json").exists():
        transcript = transcript or P / "words.json"
    return root, source, mezzanine, transcript


def levels_of(clip: Path, out: Path) -> list:
    """One peak per millisecond of the decoded audio, 0 to 1, in the shape the cut scripts read."""
    sr = 48000
    per = sr // 1000
    r = subprocess.run([FFMPEG, "-v", "error", "-i", str(clip), "-vn", "-ac", "1", "-ar", str(sr),
                        "-f", "s16le", "-c:a", "pcm_s16le", "-"], capture_output=True)
    if r.returncode != 0:
        sys.exit(f"ffmpeg could not decode the audio of {clip}: {r.stderr.decode(errors='replace')[-400:]}")
    a = array.array("h")
    a.frombytes(r.stdout[: len(r.stdout) - (len(r.stdout) % 2)])
    n = len(a) // per
    try:
        import numpy as np
        v = np.abs(np.frombuffer(a.tobytes(), dtype=np.int16)[: n * per].astype(np.int32)).reshape(n, per).max(axis=1) / 32768.0
        lines = [f"{x:.5f}" for x in v.tolist()]
    except ImportError:
        lines = []
        for i in range(n):
            seg = a[i * per:(i + 1) * per]
            lines.append(f"{max(abs(min(seg)), abs(max(seg))) / 32768.0:.5f}")
    out.write_text("\n@start\n" + "\n".join(lines) + "\n")
    return [float(x) for x in lines]


def speech_spans(lev: list, gate: float, run_ms=250, gap_ms=150, block=20) -> list:
    """Talking: a 20 ms peak over the gate held a quarter of a second, gaps under 150 ms joined."""
    th = 10 ** (gate / 20)
    loud = [max(lev[i:i + block], default=0.0) >= th for i in range(0, len(lev), block)] + [False]
    spans, start, merged = [], None, []
    for i, hot in enumerate(loud):
        if hot and start is None:
            start = i
        elif not hot and start is not None:
            spans.append([start * block, i * block]); start = None
    for a, b in spans:
        if merged and a - merged[-1][1] < gap_ms:
            merged[-1][1] = b
        else:
            merged.append([a, b])
    return [(a, b) for a, b in merged if b - a >= run_ms]


def word_spans(words: list, pad=150) -> list:
    """What the transcript claims to have heard, with the slack the word times are good to."""
    spans = []
    for w in sorted(words, key=lambda w: w["start"]):
        a, b = int(w["start"]) - pad, int(w["end"]) + pad
        if spans and a <= spans[-1][1]:
            spans[-1][1] = max(spans[-1][1], b)
        else:
            spans.append([a, b])
    return spans


def covered_share(speech: list, heard: list):
    """The share of speech milliseconds that fall inside some word, and the stretches that do not."""
    total, holes = sum(b - a for a, b in speech), []
    for a, b in speech:
        at = a
        for ca, cb in heard:
            if cb <= at or ca >= b:
                continue
            if ca > at:
                holes.append((at, min(ca, b)))
            at = max(at, min(cb, b))
            if at >= b:
                break
        if at < b:
            holes.append((at, b))
    return (1.0 if not total else (total - sum(b - a for a, b in holes)) / total), holes


def check_coverage(lev: list, words: list, clip: Path, transcript: Path, force: bool) -> None:
    """The words against the audio. Under 0.97 this stops: everything after it reads the words."""
    # The gate has two ends. The room is the 10th percentile of the curve and 15 dB over it is the
    # floor; but a phone records its silence at -63 dB, so that floor sits 20 dB under the quietest
    # real word and every breath reads as talking. The loud end of the same curve is the voice, and
    # 20 dB under it is where speech stops. The higher of the two is the gate.
    s = sorted(lev); room, voice = db(s[int(len(s) * 0.10)]), db(s[int(len(s) * 0.95)])
    gate = max(room + 15, voice - 20)
    speech = speech_spans(lev, gate)
    share, holes = covered_share(speech, word_spans(words))
    print(f"coverage {share:.3f} of the speech is inside a word (room {room:.1f} dB, gate {gate:.1f} dB, {len(speech)} stretches)")
    for a, b in [h for h in holes if h[1] - h[0] > 400]:
        print(f"uncovered {a/1000:.1f}s to {b/1000:.1f}s ({(b-a)/1000:.1f}s)")
    if share >= 0.97 or force:
        return
    print("\nThe transcript is not the take, and a word never heard can never be cut on or read.")
    print(f"Transcribe it again, then run prepare again:\n  node scripts/transcribe.mjs {clip} --out {transcript} --cloud")
    print(f"  node scripts/transcribe.mjs {clip} --out {transcript} --local --model models/ggml-medium.en.bin")
    print("--force keeps these words anyway, and owns what they miss.")
    sys.exit(1)


def prepare(P: Path, force=False) -> int:
    root, source, mezzanine, transcript = inputs(P)
    clip = source or mezzanine   # the file he recorded, not a copy of it
    if not clip:
        sys.exit("no clip for this video: run intake on its source first (node scripts/intake.mjs <clip> --transcribe)")
    if not transcript:
        sys.exit("no words for this video: run intake with --transcribe first")
    (P / "source.txt").write_text(str(clip) + "\n")
    words = P / "words.json"
    if transcript.resolve() != words.resolve():
        text = transcript.read_text()
        data = None
        try:
            data = json.loads(text)
        except ValueError:
            pass
        if isinstance(data, dict):
            data = data.get("words") or data.get("segments") or []
        if isinstance(data, list):
            text = "".join(json.dumps({"start": int(round(w.get("start", 0))), "end": int(round(w.get("end", 0))),
                                       "text": str(w.get("text", w.get("word", ""))).strip()}) + "\n" for w in data)
        words.write_text(text)
        raw = P / "words.raw.json"
        if not raw.exists():
            raw.write_text(text)
    lev = levels_of(clip, P / "levels.txt")
    subprocess.run([sys.executable, str(Path(__file__).with_name("build_peaks.py")), str(P)], check=True)
    said = [json.loads(l) for l in words.read_text().splitlines() if l.strip()]
    print(f"take: {clip.name}, {len(lev)/1000:.1f}s of levels, {len(said)} words -> {P/'source.txt'}, words.json, levels.txt, peaks.json")
    check_coverage(lev, said, clip, transcript, force)
    # Keep recognizer annotations for cleanup; they are not caption words.
    events = Path(str(transcript) + '.events.json')
    if events.is_file():
        shutil.copy2(events, P / 'audio-events.json')
    return 0


def is_all_intra(clip: Path) -> bool:
    """Every frame its own seek point. Testing all of them costs a decode of the whole file, so the
    test is the one intake can promise: a mezzanine it wrote, H.264, no B frames. A camera original
    is H.264 too and answers no, because its keyframes are seconds apart."""
    if clip.parent.name != "mezzanine":
        return False
    r = subprocess.run([FFPROBE, "-v", "error", "-select_streams", "v:0", "-show_entries",
                        "stream=codec_name,has_b_frames", "-of", "json", str(clip)], capture_output=True)
    if r.returncode != 0:
        return False
    s = (json.loads(r.stdout or b"{}").get("streams") or [{}])[0]
    return s.get("codec_name") == "h264" and int(s.get("has_b_frames") or 0) == 0


def whole(P: Path) -> int:
    """No cut: the spine is the whole take, all-intra, and the master carries the mastered audio."""
    root, source, mezzanine, transcript = inputs(P)
    clip = source or mezzanine
    if not clip:
        sys.exit("no clip for this video: run intake on its source first")
    if (P / "cuts.json").exists():
        sys.exit("this video has a cut (cuts.json); `whole` is for a take kept as recorded. Remove the cut first if that is what the buyer wants.")
    spine = P / "spine.mp4"
    if spine.exists() or spine.is_symlink():
        spine.unlink()
    if is_all_intra(clip):
        try:
            os.link(clip, spine)
        except OSError:
            shutil.copy2(clip, spine)
        made = f"spine.mp4 is {clip.name} unchanged"
    else:
        # a camera original seeks to its nearest keyframe, which is a picture landing on the wrong word
        r = subprocess.run([FFMPEG, "-v", "error", "-y", "-i", str(clip),
                            "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
                            "-g", "1", "-keyint_min", "1", "-sc_threshold", "0", "-pix_fmt", "yuv420p",
                            "-c:a", "aac", "-b:a", "192k", str(spine)])
        if r.returncode:
            sys.exit(f"ffmpeg could not encode a spine from {clip}")
        made = f"spine.mp4 is {clip.name} re-encoded all-intra, so every frame is a seek point"
    if (P / "spine-map.json").exists():
        (P / "spine-map.json").unlink()
    r = subprocess.run([sys.executable, str(Path(__file__).with_name("master_audio.py")), str(P)])
    if r.returncode:
        return r.returncode
    print(f"whole take: {made}; master.mp4 carries the mastered audio")
    return 0


def status(P: Path) -> int:
    for name in ("source.txt", "words.json", "levels.txt", "peaks.json", "cuts.json", "spine-map.json", "spine.mp4", "master.mp4"):
        f = P / name
        print(f"{'have' if f.exists() else 'need'}  {name}")
    return 0


def main() -> int:
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    cmd, P = sys.argv[1], Path(sys.argv[2]).resolve()
    if cmd == "prepare":
        return prepare(P, "--force" in sys.argv)
    if cmd == "whole":
        return whole(P)
    if cmd == "status":
        return status(P)
    sys.exit(__doc__)


if __name__ == "__main__":
    sys.exit(main())
