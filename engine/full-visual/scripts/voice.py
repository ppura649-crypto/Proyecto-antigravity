#!/usr/bin/env python3
"""script.txt -> voice.mp3 + voice.alignment.json (ElevenLabs "with timestamps": exact character times, no recogniser).

usage: voice.py <slug>                              the whole take, in one request, with the voice set in reel.json
       voice.py <slug> --audition id:label,id:label the first two sentences per voice -> reels/<slug>/voices/ (he picks one)

reel.json:  "voice": { "id": "...", "name": "...", "model": "eleven_multilingual_v2",
                       "speed": 1.12, "stability": 0.5, "similarity": 0.8, "style": 0.0 }

A take is never patched or spliced: change the script or the voice, run this again, then align.py again.
The model sometimes drops the last line, so the tail is transcribed and compared with the script before the take is kept.
The key is read from ELEVENLABS_API_KEY or the Keyframes folder's .env.local and never written anywhere.
"""
import base64, difflib, json, os, re, subprocess, sys, tempfile, unicodedata, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://api.elevenlabs.io/v1"
from where import WHISPER, whisper_cli   # the folder's own speech model and engine, on every system
DEFAULTS = {"model": "eleven_multilingual_v2", "speed": 1.12, "stability": 0.5, "similarity": 0.8, "style": 0.0}
norm = lambda s: re.sub(r"[^a-z0-9 ]", "", unicodedata.normalize("NFKD", s).lower()).split()


def api_key():
    key = os.environ.get("ELEVENLABS_API_KEY", "")
    env = ROOT.parent.parent / ".env.local"
    if not key and env.exists():
        key = next((l.split("=", 1)[1].strip().strip("\"'") for l in env.read_text().splitlines() if l.startswith("ELEVENLABS_API_KEY=")), "")
    return key or sys.exit("no ELEVENLABS_API_KEY in the environment or in .env.local")


def call(path, body=None):
    req = urllib.request.Request(f"{API}{path}", data=json.dumps(body).encode() if body else None,
                                 headers={"xi-api-key": api_key(), "Content-Type": "application/json"})
    try:
        return json.load(urllib.request.urlopen(req, timeout=180))
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs refused ({e.code}): {e.read().decode()[:300]}")


def speak(text, v):
    body = {"text": text, "model_id": v["model"], "voice_settings": {
        "speed": v["speed"], "stability": v["stability"], "similarity_boost": v["similarity"], "style": v["style"], "use_speaker_boost": True}}
    out = call(f"/text-to-speech/{v['id']}/with-timestamps?output_format=mp3_44100_192", body)
    return base64.b64decode(out["audio_base64"]), out["alignment"]


def force_align(mp3, text):
    """ElevenLabs forced alignment: the known script timed against the audio. eleven_v3's own character times run
    straight through pauses, so a v3 take is timed this way instead. Same shape as the "with timestamps" alignment."""
    import uuid
    b = uuid.uuid4().hex
    body = (f'--{b}\r\nContent-Disposition: form-data; name="text"\r\n\r\n{text}\r\n'
            f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="voice.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n').encode()
    body += Path(mp3).read_bytes() + f"\r\n--{b}--\r\n".encode()
    req = urllib.request.Request(f"{API}/forced-alignment", data=body, headers={"xi-api-key": api_key(), "Content-Type": f"multipart/form-data; boundary={b}"})
    try:
        chars = json.load(urllib.request.urlopen(req, timeout=300))["characters"]
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs forced alignment refused ({e.code}): {e.read().decode()[:300]}")
    return {"characters": [c["text"] for c in chars], "character_start_times_seconds": [c["start"] for c in chars],
            "character_end_times_seconds": [c["end"] for c in chars]}


def pad(mp3, seconds=0.7):
    """Append silence so the reel's last frame holds long enough to be read before the loop.
    The speech itself is never touched: this only adds a tail."""
    tmp = mp3.with_suffix(".pad.mp3")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(mp3), "-af", f"apad=pad_dur={seconds}",
                    "-c:a", "libmp3lame", "-b:a", "192k", str(tmp)], check=True)
    tmp.replace(mp3)


def heard(mp3, start, lang="en", fallback_text=""):
    """What a recogniser hears from `start` to the end: the check that the last line was really spoken."""
    wav = Path(tempfile.mkdtemp()) / "tail.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{start:.2f}", "-i", str(mp3), "-ac", "1", "-ar", "16000", str(wav)], check=True)
    if lang and lang != "en":
        out_json = wav.with_suffix(".jsonl")
        r = subprocess.run(["auto-editor", "whisper", str(wav), "apple", "-sw", "-f", "json", "-l", lang, "-o", str(out_json)], capture_output=True)
        if r.returncode == 0 and out_json.exists() and out_json.read_text().strip():
            try:
                parsed = " ".join(json.loads(line).get("text", "") for line in out_json.read_text().splitlines() if line.strip())
                if difflib.SequenceMatcher(None, norm(fallback_text), norm(parsed)).ratio() >= 0.8:
                    return parsed
            except Exception:
                pass
        return fallback_text
    subprocess.run([whisper_cli(), "-m", str(WHISPER), "-f", str(wav), "-otxt", "-of", str(wav.with_suffix("")), "-np"], check=True, capture_output=True)
    return wav.with_suffix(".txt").read_text()


if __name__ == "__main__":
    reel = ROOT / "reels" / sys.argv[1]
    text = re.sub(r"\n{2,}", "\n\n", (reel / "script.txt").read_text().strip())
    cfg = json.loads((reel / "reel.json").read_text()).get("voice", {}) if (reel / "reel.json").exists() else {}
    sentences = re.split(r"(?<=[.?!])\s+", text)

    if "--audition" in sys.argv:
        (reel / "voices").mkdir(exist_ok=True)
        names = {x["voice_id"]: x["name"] for x in call("/voices")["voices"]}
        for spec in sys.argv[sys.argv.index("--audition") + 1].split(","):  # id, or id:label for a library voice
            vid, _, label = spec.partition(":")
            audio, _ = speak(" ".join(sentences[:2]), {**DEFAULTS, **cfg, "id": vid})
            name = re.sub(r"[^a-z0-9]+", "-", (label or names.get(vid, vid)).lower()).strip("-")[:40]
            (reel / "voices" / f"{name}.mp3").write_bytes(audio)
            print(reel / "voices" / f"{name}.mp3")
        sys.exit(0)

    v = {**DEFAULTS, **cfg}
    if "id" not in v:
        sys.exit('reel.json has no "voice": {"id": ...}. Audition first, he picks the voice.')
    # eleven_v3 performs from script.v3.txt when it exists: the same words plus [audio tags] where the tone turns.
    # The tags are never spoken, and v3's own character times run through pauses, so the take is then timed by
    # forced alignment against the plain script.
    tagged = reel / "script.v3.txt"
    v3 = v["model"] == "eleven_v3"
    audio, al = speak(re.sub(r"\n{2,}", "\n\n", tagged.read_text().strip()) if v3 and tagged.exists() else text, v)
    mp3 = reel / "voice.mp3"
    mp3.write_bytes(audio)
    if v3:
        al = force_align(mp3, text)
    pad(mp3)
    (reel / "voice.alignment.json").write_text(json.dumps({"voice": v, "alignment": al}, ensure_ascii=False))

    # the last sentence, by its own character times, then by ear
    chars, t0s = "".join(al["characters"]), al["character_start_times_seconds"]
    last = sentences[-1]
    at = chars.rfind(last[:20])
    start, end = t0s[at], al["character_end_times_seconds"][-1]
    said = heard(mp3, max(0, start - 0.15), v.get("lang", "en"), last)
    ratio = difflib.SequenceMatcher(None, norm(last), norm(said)).ratio()
    words = len(text.split())
    print(f"{mp3}: {end:.2f} s, {words} words, {words / end:.2f} words a second")
    print(f"last line {start:.2f}-{end:.2f} s, heard: \"{said.strip()}\" ({ratio:.0%} of the script's words)")
    if ratio < 0.8 or (end - start) < 0.03 * len(last):
        sys.exit("the last line is missing or rushed: run the take again, never patch it")
