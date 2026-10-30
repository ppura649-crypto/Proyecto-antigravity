"""Where the speech model and the speech engine are, on every system.

The format checks the last line of a take, and times a voice that came without word timestamps, with whisper.cpp and
its small English model. Both belong to the Keyframes folder, not to this engine: the folder's own transcriber
(`scripts/transcribe.mjs`) fetches them once into `models/` and `whisper.cpp/`. When either is missing, that script is
run once on a second of silence, which makes it fetch both, so nothing here downloads anything itself.
"""
import os, shutil, subprocess, sys, tempfile, wave
from pathlib import Path

FOLDER = Path(__file__).resolve().parents[3]  # engine/full-visual/scripts -> the Keyframes folder
WHISPER = FOLDER / "models" / "ggml-small.en.bin"


def _found_cli():
    if shutil.which("whisper-cli"):
        return "whisper-cli"
    want = "whisper-cli.exe" if os.name == "nt" else "whisper-cli"
    kept = FOLDER / "whisper.cpp"
    return next((str(p) for p in kept.rglob(want) if p.is_file()), None) if kept.exists() else None


def _fetch():
    wav = Path(tempfile.mkdtemp()) / "silence.wav"
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000); w.writeframes(b"\0\0" * 16000)
    print("speech model and engine: getting them once through the folder's transcriber")
    subprocess.run(["node", str(FOLDER / "scripts" / "transcribe.mjs"), str(wav), "--out", str(wav.with_suffix(".json")), "--local", "--no-apple"],
                   check=False, cwd=str(FOLDER))


def whisper_cli():
    """The whisper.cpp program, fetched once if this machine has none; the model is fetched beside it."""
    if not (_found_cli() and WHISPER.exists()):
        _fetch()
    cli = _found_cli()
    if not cli or not WHISPER.exists():
        sys.exit("whisper.cpp or its model is missing. Run: node scripts/transcribe.mjs <any short audio> --out tmp.json --local")
    return cli
