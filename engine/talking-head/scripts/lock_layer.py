#!/usr/bin/env python3
"""Approved layers are locked. A lock is a hash plus a snapshot, and every render and delivery
checks it, so a change made for another stage (or another video) cannot reach an approved
layer unnoticed. This is the mechanical form of "an approved layer is never regenerated".

Why: every hook regression on record was collateral. A stage-3 rebuild rewrote the title
(reference edit B, "The hook was already good, but now it changed"), the Creator Format 2 work replaced the
stack anchor with a literal, a font change reflowed the stack, one note about text weight was
applied to eleven cards ("i didn't mean all the cards or everything", reference edit D).

Layers and the files they cover:
  cut      cuts.json, spine-map.json
  captions captions.json
  hook     hook.json (+ captions.json page 0 and the stack pages it mirrors, see hook_build.py)
  visuals  visuals.json

Usage:
  lock_layer.py lock  <project> <layer> "<who/when/how approved>"   write the lock + snapshot
  lock_layer.py check <project> [layer]                            exit 1 if a locked layer changed
  lock_layer.py diff  <project> visuals                            which event ids changed vs the snapshot
  lock_layer.py unlock <project> <layer> "<why>"                   drop the lock (the creator asked for the change)

Locks live in projects/<id>/locks.json, snapshots in projects/<id>/.locks/<layer>/.
"""
import hashlib, json, shutil, sys, datetime
from pathlib import Path

FILES = {
    "cut": ["cuts.json", "spine-map.json"],
    "captions": ["captions.json"],
    "hook": ["hook.json"],
    "visuals": ["visuals.json"],
}


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()[:16]


def load_locks(P):
    f = P / "locks.json"
    return json.loads(f.read_text()) if f.exists() else {}


def save_locks(P, L):
    (P / "locks.json").write_text(json.dumps(L, indent=1))


def lock(P, layer, note):
    L = load_locks(P)
    snap = P / ".locks" / layer
    snap.mkdir(parents=True, exist_ok=True)
    entry = {"at": datetime.datetime.now().isoformat(timespec="minutes"), "note": note, "files": {}}
    for name in FILES[layer]:
        f = P / name
        if not f.exists():
            sys.exit(f"{name} missing, cannot lock {layer}")
        entry["files"][name] = sha(f)
        shutil.copy2(f, snap / name)
    L[layer] = entry
    save_locks(P, L)
    print(f"locked {layer}: " + ", ".join(f"{k} {v}" for k, v in entry["files"].items()))


def check(P, layer=None):
    L = load_locks(P)
    bad = []
    for lay, entry in L.items():
        if layer and lay != layer:
            continue
        for name, h in entry["files"].items():
            f = P / name
            now = sha(f) if f.exists() else "missing"
            if now != h:
                bad.append(f"{lay}: {name} changed since its lock ({entry['at']}, {entry['note']})")
    if bad:
        print("LOCK VIOLATION\n  " + "\n  ".join(bad))
        print("  If the creator asked for this change: lock_layer.py unlock <project> <layer> \"<their words>\", then re-lock after their OK.")
        return 1
    print("locks ok: " + (", ".join(L.keys()) if L else "nothing locked yet"))
    return 0


def diff(P, layer):
    snap = P / ".locks" / layer
    if layer != "visuals":
        sys.exit("diff is for the visuals layer (event ids); captions/hook diff by hand")
    old = {e["id"]: e for e in json.loads((snap / "visuals.json").read_text())["events"]}
    new = {e["id"]: e for e in json.loads((P / "visuals.json").read_text())["events"]}
    changed = [i for i in new if i in old and json.dumps(new[i], sort_keys=True) != json.dumps(old[i], sort_keys=True)]
    added = [i for i in new if i not in old]
    removed = [i for i in old if i not in new]
    print(f"this change touches {len(changed) + len(added) + len(removed)} events")
    if changed: print("  changed: " + ", ".join(changed))
    if added: print("  added:   " + ", ".join(added))
    if removed: print("  removed: " + ", ".join(removed))
    print("  (their note named how many? if fewer than this, change one, show one still, stop)")


def unlock(P, layer, why):
    L = load_locks(P)
    if layer in L:
        (P / ".locks" / "unlocked.log").parent.mkdir(exist_ok=True)
        with open(P / ".locks" / "unlocked.log", "a") as f:
            f.write(f"{datetime.datetime.now().isoformat(timespec='minutes')} {layer}: {why}\n")
        del L[layer]
        save_locks(P, L)
    print(f"unlocked {layer}: {why}")


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    cmd, P = sys.argv[1], Path(sys.argv[2]).resolve()
    if cmd == "lock":
        lock(P, sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else "approved")
    elif cmd == "check":
        sys.exit(check(P, sys.argv[3] if len(sys.argv) > 3 else None))
    elif cmd == "diff":
        diff(P, sys.argv[3])
    elif cmd == "unlock":
        unlock(P, sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else "")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
