#!/usr/bin/env python3
"""An approved layer is never built again. A lock is a hash plus a copy, checked before every
render and every export.

Goal. When the buyer says a layer is right, that layer stops moving, and any later change to it
is something they asked for rather than something that happened.

Reasoning. Every regression worth remembering was collateral. A later stage rebuilt the whole
caption file and rewrote an opening that was already good. A change of face reflowed the stack
that had just been approved. One note about the weight of a word was applied to eleven cards,
and the answer was "I did not mean all the cards or everything". None of those were decisions;
they were side effects, and a side effect is exactly what a hash catches. Prose cannot: a rule
that only lives in a document has already failed once.

The pattern. Lock the moment the buyer approves, with their own words as the note. Check inside
the renderer and the export, so nothing needs to remember to run it. To change a locked layer,
unlock it with the reason, change it, lock it again. `diff` says how many pictures a pending
change would touch, so that number can be compared with the size of the note before rendering.

The note is the lock. A lock is only worth the sentence written on it, so the note has to be
about this layer: at least eight words, naming what was approved, in the words that were said.
"next step", "go ahead", "ok" are somebody driving the machine, not somebody approving a layer,
and a lock carrying one of those is a lock nobody can read back. A note starting `self-review:`
is the machine's own reading of the layer instead of the buyer's, and costs twenty words.

Counter-example. Re-locking silently after a change nobody asked for. The unlock log is the
record of every deliberate change, and it is meant to be short.

Usage:
  lock_layer.py lock   <project> <layer> "<what the buyer said>"
  lock_layer.py check  <project> [layer]      exit 1 when a locked layer moved
  lock_layer.py diff   <project> visuals      which pictures a pending change touches
  lock_layer.py unlock <project> <layer> "<why, in the buyer's words>"

Layers: cut, dress, captions, hook, visuals, sound. Locks live in <project>/locks.json, the copies in
<project>/.locks/<layer>/. The cut is locked once the buyer has watched it; a change to a locked cut
shifts every later layer mechanically (shift_times.py) and never rebuilds them.
"""
import datetime
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path
from workflow import steps

# what a note about each layer has to mention, in the buyer's own vocabulary
SAYS = {
    "cut": ("cut", "clip", "take", "pause"),
    "dress": ("look", "font", "colour", "color", "card"),
    "captions": ("caption", "word", "stack", "emphasis"),
    "hook": ("hook", "opening", "title", "first"),
    "visuals": ("visual", "picture", "card", "object", "frame"),
    "sound": ("sound", "mix", "sfx", "silent", "voice"),
}
# driving the machine, not approving a layer
AUTOPILOT = ("when this is done", "go ahead", "carry on", "next step", "continue", "proceed",
             "go on", "do it", "okay", "ok", "yes", "fine")
FILLER = {"the", "a", "an", "and", "then", "now", "please", "thanks", "lets", "let's", "this", "it",
          "is", "was", "we", "i", "you", "so", "just", "all", "good", "great", "nice", "perfect"}

FILES = {
    "cut": ["cuts.json", "spine-map.json"],
    "dress": ["dress.json"],
    "captions": ["captions.json"],
    "hook": ["hook.json"],
    "visuals": ["visuals.json"],
    "sound": ["sound.json"],
}


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()[:16]


def load(P: Path) -> dict:
    f = P / "locks.json"
    return json.loads(f.read_text()) if f.exists() else {}


def save(P: Path, L: dict) -> None:
    (P / "locks.json").write_text(json.dumps(L, indent=1) + "\n")


def check_note(layer: str, note: str) -> None:
    """The note has to be about this layer. Eight words, their words, naming the thing approved."""
    text = note.strip()
    review = text.lower().startswith("self-review:")
    body = text.split(":", 1)[1] if review else text
    words = re.findall(r"[a-z0-9']+", body.lower())
    rest = " ".join(words)
    for phrase in AUTOPILOT:   # whole words only: "ok" must not eat the "ok" inside "look"
        rest = re.sub(rf"\b{re.escape(phrase)}\b", " ", rest)
    substance = [w for w in rest.split() if w not in FILLER]
    named = [w for w in SAYS[layer] if any(t.startswith(w) for t in words)]
    need = 20 if review else 8
    if len(words) >= need and substance and named:
        return
    sys.exit(f"That note does not say what was approved about the {layer}. A lock note is {need} "
             f"words or more, in the words that were said, and mentions the {layer}: "
             f"{', '.join(SAYS[layer])}. 'ok', 'next step' and 'go ahead' approve nothing, and a "
             f"note starting `self-review:` is the machine's own reading, so it costs 20 words.")


def lock(P: Path, layer: str, note: str) -> int:
    if layer not in FILES:
        sys.exit(f"unknown layer {layer}; one of {', '.join(FILES)}")
    if not note.strip():
        sys.exit("Record what the buyer approved before locking this layer.")
    gate = {"cut": "transcript", "dress": "transcript", "captions": "captions", "hook": "opening", "visuals": "pictures", "sound": "sound"}[layer]
    steps(P, gate)   # the order of the layers first: a layer that cannot be locked yet is not a note problem
    check_note(layer, note)
    if layer == 'cut':
        from cleanup import check_review
        try:
            check_review(P, rendered=True)
        except (ValueError, OSError, KeyError) as error:
            sys.exit(str(error))
    L = load(P)
    snap = P / ".locks" / layer
    snap.mkdir(parents=True, exist_ok=True)
    entry = {"at": datetime.datetime.now().isoformat(timespec="minutes"), "said": note, "files": {}}
    for name in FILES[layer]:
        f = P / name
        if not f.exists():
            sys.exit(f"{name} is missing, so {layer} cannot be locked")
        entry["files"][name] = sha(f)
        shutil.copy2(f, snap / name)
    L[layer] = entry
    save(P, L)
    steps(P)
    print(f"locked {layer}: " + ", ".join(f"{k} {v}" for k, v in entry["files"].items()))
    print(f"  said: {note}")
    return 0


def check(P: Path, layer: str | None = None) -> int:
    L = load(P)
    moved = []
    for lay, entry in L.items():
        if layer and lay != layer:
            continue
        for name, h in entry["files"].items():
            f = P / name
            now = sha(f) if f.exists() else "missing"
            if now != h:
                moved.append(f"{lay}: {name} changed after it was approved on {entry['at']} ({entry['said']})")
    if moved:
        print("A LOCKED LAYER MOVED\n  " + "\n  ".join(moved))
        print('  If this change was asked for: lock_layer.py unlock <project> <layer> "<their words>",')
        print("  make the change, show it, then lock it again with what they said.")
        return 1
    print("locks ok: " + (", ".join(L) if L else "nothing approved yet"))
    return 0


def diff(P: Path, layer: str) -> int:
    if layer != "visuals":
        sys.exit("diff reads the pictures; the other layers are compared by hand")
    snap = P / ".locks" / layer / "visuals.json"
    if not snap.exists():
        sys.exit("no approved copy of visuals.json to compare with")
    old = {e["id"]: e for e in json.loads(snap.read_text())["events"]}
    new = {e["id"]: e for e in json.loads((P / "visuals.json").read_text())["events"]}
    changed = [i for i in new if i in old and json.dumps(new[i], sort_keys=True) != json.dumps(old[i], sort_keys=True)]
    added = [i for i in new if i not in old]
    gone = [i for i in old if i not in new]
    print(f"this change touches {len(changed) + len(added) + len(gone)} pictures")
    if changed:
        print("  changed: " + ", ".join(changed))
    if added:
        print("  added:   " + ", ".join(added))
    if gone:
        print("  removed: " + ", ".join(gone))
    print("  Compare that count with the note. A note about one picture that touches eleven is the bug.")
    return 0


def unlock(P: Path, layer: str, why: str) -> int:
    L = load(P)
    if layer in L:
        log = P / ".locks" / "unlocked.log"
        log.parent.mkdir(parents=True, exist_ok=True)
        with log.open("a") as f:
            f.write(f"{datetime.datetime.now().isoformat(timespec='minutes')} {layer}: {why}\n")
        del L[layer]
        save(P, L)
    steps(P)
    print(f"unlocked {layer}: {why}")
    return 0


def main() -> int:
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    cmd, P = sys.argv[1], Path(sys.argv[2]).resolve()
    arg = sys.argv[3] if len(sys.argv) > 3 else None
    note = sys.argv[4] if len(sys.argv) > 4 else ""
    if cmd == "lock":
        return lock(P, arg, note)
    if cmd == "check":
        return check(P, arg)
    if cmd == "diff":
        return diff(P, arg or "visuals")
    if cmd == "unlock":
        return unlock(P, arg, note)
    sys.exit(__doc__)


if __name__ == "__main__":
    sys.exit(main())
