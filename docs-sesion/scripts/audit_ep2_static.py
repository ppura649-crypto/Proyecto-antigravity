#!/usr/bin/env python3
import json, re, sys, unicodedata
from pathlib import Path

REEL = Path("/Users/rol.travel/.gemini/antigravity/scratch/keyframes/engine/full-visual/reels/closing-apps-myth")
OUT_CAP = Path("/Users/rol.travel/.gemini/antigravity/scratch/keyframes/workspace/output/2026-10-30-full-visual-closing-apps-myth/caption.txt")
sys.path.insert(0, str(REEL.parent.parent / "scripts"))
import align

script_words = (REEL / "script.txt").read_text().split()
scenes, blocks, cap_words = align.parse((REEL / "caption.txt").read_text())

print(f"script words: {len(script_words)}, caption words: {len(cap_words)}, scenes: {len(scenes)}, blocks: {len(blocks)}")
assert len(script_words) == len(cap_words), f"Word count mismatch: {len(script_words)} vs {len(cap_words)}"
for i, (sw, cw) in enumerate(zip(script_words, cap_words)):
    assert sw == cw["w"], f"Word {i} mismatch: script={sw!r} vs caption={cw['w']!r}"

norm_js = lambda s: re.sub(r"[^a-z0-9$€%]", "", unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode("ascii").lower())

for i, b in enumerate(blocks):
    assert len(b["words"]) <= 8, f"Block {i} > 8 words"
    keys = sum(1 for w in b["words"] if cap_words[w]["key"])
    emojis = sum(1 for w in b["words"] if cap_words[w]["emoji"])
    assert keys <= 1, f"Block {i} has {keys} keys"
    assert emojis <= 1, f"Block {i} has {emojis} emojis"

scene_map = {}
for idx, s in enumerate(scenes):
    lo = s["firstWord"]
    hi = (scenes[idx + 1]["firstWord"] if idx + 1 < len(scenes) else len(cap_words))
    scene_map[s["id"].lower()] = {norm_js(w["w"]) for w in cap_words[lo:hi]}
all_tokens = {norm_js(w["w"]) for w in cap_words}

cfg = json.loads((REEL / "reel.json").read_text())
if cfg.get("chrome", {}).get("type") == "pill":
    for k in ("from", "to"):
        ref = cfg["chrome"][k]
        assert norm_js(str(ref)) in all_tokens, f"Chrome {k}={ref!r} not in caption tokens"

used_imgs = set()
for tsx in sorted((REEL / "scenes").glob("*.tsx")):
    txt = tsx.read_text()
    for sz in re.findall(r"fontSize[=:]\s*\{?(\d+)\}?", txt):
        assert int(sz) >= 32, f"{tsx.name} has fontSize {sz} < 32"
    for img in re.findall(r'app-\d+\.jpg', txt):
        assert (REEL / "assets" / img).exists(), f"Missing asset {img} in {tsx.name}"
        used_imgs.add(img)
    sid = tsx.stem.lower()
    if sid in scene_map:
        for tok in re.findall(r'cue\("([^"]+)"\)', txt):
            assert norm_js(tok) in scene_map[sid], f"{tsx.name}: cue({tok!r}) not found in scene {sid!r}: {sorted(scene_map[sid])}"

assert len(used_imgs) == 14, f"Expected 14 distinct app-XX.jpg illustrations used, got {len(used_imgs)}: {sorted(used_imgs)}"

# Verify social caption rules
social = OUT_CAP.read_text().strip()
first_line = social.splitlines()[0].strip()
assert len(first_line) < 125, f"Social caption first line >= 125 chars ({len(first_line)})"
assert "#" not in social, "Social caption contains hashtags"
assert "—" not in social and "–" not in social, "Social caption contains em/en-dash"
for ch in social:
    assert ord(ch) < 0x1F000 and not (0x2600 <= ord(ch) <= 0x27BF), f"Social caption contains emoji/symbol: {ch!r}"

print(f"STATIC AUDIT EP2 PASSED: 0 errors, all {len(used_imgs)} illustrations verified, social caption clean (first line = {len(first_line)} chars)!")
