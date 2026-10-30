# full-visual

Full-screen animated explainer reels, the reference format: no presenter, a voice, a word-by-word caption at the top,
and under it the real thing each sentence is about, redrawn and moving on the word. Zero cuts. 1080x1920, 60 fps.

How to make one, and why each rule exists: `.agents/skills/full-visual/` (the skill is the manual). Where the rules
come from: the reference study.

## The idea

One text file per reel, `caption.txt`, is the script, the caption, the key words, the emoji, the scenes and the
grounds. `scripts/align.py` matches it to the voice. The engine (`src/engine/`, about 600 lines) holds what never
changes. Scenes are written per reel with a small kit of verbs, and every motion is tied to a spoken word by
`cue("word")`, never to a typed time. Two scripts refuse the defects measured on the references.

```
script.txt ──voice.py──▶ voice.mp3 + voice.alignment.json
caption.txt + voice.mp3 ──align.py──▶ words.json ──┐
reel.json (theme overrides, pinned chrome) ────────┼──▶ render.mjs ──▶ output/YYYY-MM-DD/NN-slug.mp4
scenes/*.tsx (what this reel draws) ───────────────┘
```

## Layout

```
full-visual/
  render.mjs                 stills, guides, a stretch, or the whole reel (sandbox disabled)
  scripts/voice.py           script.txt -> voice.mp3 + voice.alignment.json (ElevenLabs with timestamps; voice in reel.json)
  scripts/align.py           caption.txt + voice -> words.json (exact when voice.alignment.json exists)
  scripts/check.py           plan: caption, key words, handovers in silence, type floor. render: dead holds, bare ground
  src/theme.ts               everything a reel may change: fonts, grounds, marker, roles, stage, handover
  src/engine/                the fixed grammar: timeline, Ground, Caption, Stage (handover), Chrome (pill, terminal),
                             moves + Motion (the kit), context (useScene: f, cue, cueEnd, endsOn)
  reels/index.ts             generated: finds every reels/<slug>/scenes/index.tsx by itself
  reels/<slug>/              voice.*, caption.txt, reel.json, words.json (generated), plan.md, scenes/, assets/, stills/
  output/YYYY-MM-DD/         NN-slug.mp4, copied when final to workspace/output/<project folder>/<slug>.mp4
```

The packages are the Keyframes folder's own (`npm ci` at its root); Remotion fetches its own browser.

## Commands

```bash
node ../../scripts/py.mjs scripts/voice.py <slug> --audition id:label,id:label   # the first two sentences per voice -> reels/<slug>/voices/
node ../../scripts/py.mjs scripts/voice.py <slug>                                  # the whole take, one request, last line verified
node ../../scripts/py.mjs scripts/align.py <slug>
node ../../scripts/py.mjs scripts/check.py plan <slug>
node render.mjs <slug> --stills 1.2,3.45,9        # reels/<slug>/stills/t_001.20.png
node render.mjs <slug> --guides --stills 9        # bands and Instagram's zones drawn on
node render.mjs <slug> [--from s --to s] [--out path]
node ../../scripts/py.mjs scripts/check.py render <slug> <mp4>
node ../../node_modules/typescript/bin/tsc --noEmit -p .
```

## caption.txt

```
== signup | ground: light          scene id (key in scenes/index.tsx) and ground; it starts in the silence before it
It starts with your / signup *form,*   one line = one caption block; *key word*; " / " = authored line break
which has no / 🎂 *age* question,      an emoji right before a word sits inline before it
@bottom                            caption under the stage from the next block on (@top to return)
```

## reel.json

```json
{ "chrome": { "type": "pill", "label": "the prompt · at the end", "from": "scene:signup", "to": 58.1 },
  "theme": { "font": { "caption": "Figtree, sans-serif" }, "marker": { "style": "select", "color": "#2E7AEA" }, "handover": "rise" } }
```

`from` / `to` / a terminal line's `at` take seconds, a spoken word (`"prompt"`, `"it#2"` for the second one) or
`"scene:<id>"`. Chrome types: `pill`, `terminal` (`title`, `squares`, `lines: [{at, text, tone, square}]`), `none`.
A new font: load it in `src/fonts.ts`, name it in `theme.font`.

## Worked examples

`reels/distillation-us/`, `reels/hf-incident/` with its hook `reels/hf-hook-v5/`, and
`reels/chrome-fingerprinting-us/`: whole reels, each with its `plan.md` and `scenes/`. Read one before writing a scene.
