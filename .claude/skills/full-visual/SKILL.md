---
name: full-visual
description: "Build a full-screen animated explainer reel in this Keyframes folder (the reference format): no presenter, a voice, a word-by-word caption at the top with one boxed key word per line, and under it real interfaces, logos, numbers and documents redrawn and animated in sync with the words, zero cuts, 1080x1920 at 60 fps. One caption.txt per reel drives the script, the caption blocks, the key words, the emoji, the scenes and the grounds; the engine holds the fixed grammar; scenes are written per reel with a small motion kit; scripts refuse the known defects. Use whenever the user wants a full visual explainer, 'the reference format', an animated explainer with no face, a reel where everything is drawn and synced to a voiceover, wants to edit or re-render a reel in engine/full-visual/reels/, or asks how an example reel was made. NOT talking-head edits, NOT still explainer slides."
---

# Full visual

A voice explains; the screen is the explanation. No face, no footage, no cut, no camera, no music. The caption at the
top says the sentence one word at a time, and under it the thing the sentence is about is drawn, real and alive, and
changes on the word that changes it.

When the prompt names a project in `workspace/projects/`, read `.agents/skills/full-visual/references/05-workspace.md`
first and follow it.

## The brief

Every sentence gets the real thing it is about, redrawn at its own geometry with its real copy, stripped to what the
sentence needs, and made to move on the word. The viewer should be able to follow the whole argument with the sound
off, and should never see a frame where nothing is happening or a frame they cannot read on a phone. Sync is the
craft: a picture that lands a fifth of a second off its word is wrong, however good it looks.

Watch the references before starting, they are things to look at, not descriptions to trust: the worked reels in
`engine/full-visual/reels/` (`distillation-us`, `hf-incident` with its hook `hf-hook-v5`, `chrome-fingerprinting-us`),
rendered with `node render.mjs <slug>`, and their stills.

Before a reel, read `workspace/library/full-visual.preferences.md` and `workspace/library/full-visual/profile.json`
when they exist: the creator's saved look, voice and words (`/full-visual-customization` writes them). They dress the
format; they never change its method. With no profile the format runs exactly as written here.

## What never changes (the engine, `engine/full-visual/src/engine/`)

1. No presenter, no cut, no camera move, no music. The voice is the only clock.
2. Three bands on one centre axis: caption y 300-500, stage y 520-1450, pinned chrome below, the last 220 px left to
   Instagram. `--guides` draws them on a still.
3. The caption is one word per spoken word. A word not yet said does not exist. Active word bold, full ink; said words
   regular, grey, in one frame; the new word resolves from blur in place; two lines at most; one key word per block in
   the selection box, which lands a few frames after its word.
4. A scene hands over only in a silence between sentences, as one move, with the next scene already arriving, so the
   ground is never bare. The engine places the handover; nobody authors a scene time.
5. Interfaces are redrawn, never recorded. Real geometry, real copy, only the parts the sentence needs.
6. A number is never static: it counts, rolls or fills, and lands on its word.
7. A change of state happens to the object already on screen. It recolours, breaks, grows a row. It is not replaced.
8. The ask is performed by a cursor in the real interface, and its reward is shown before the reel ends.

What a reel may change lives in `src/theme.ts` and the reel's `reel.json`: fonts, grounds, marker style and colour,
role colours, stage width, handover verb, pinned chrome (countdown pill, terminal, none).

## Stages and gates

| # | Stage | In, out | Gate before the creator sees anything | Pattern |
|---|---|---|---|---|
| 1 | Script | the creator's transcript → `script.txt` | the script the creator gives is done and taken as true: never fact-check or re-verify it | `references/01-script-and-caption.md` |
| 2 | Voice | script → `voice.mp3` (+ `voice.alignment.json` when the voice is ElevenLabs: exact word times; another provider through `node scripts/narrate.mjs --root ../.. --config reels/<slug>/voice.json --text-file reels/<slug>/script.txt --out reels/<slug>/voice.mp3`, then align.py times it by speech recognition) | the creator chose the voice; never splice a take, regenerate it whole | same |
| 3 | Caption | script → `caption.txt` → `node ../../scripts/py.mjs scripts/align.py <slug>` → `words.json` | `node ../../scripts/py.mjs scripts/check.py plan <slug>` exits 0; every "!" line from align read and resolved | same |
| 4 | Visual plan | caption → `plan.md`: per sentence, the real thing, its verb, what changes on which word, what stays from the previous sentence | **the creator approves the plan in words before any pixel.** One continuous thing named for the whole reel | `references/02-sentence-to-picture.md` |
| 5 | One passage | the hardest 8-12 s built first, alone | stills read at full size against the plan and the references, `check.py render` exits 0, then the creator sees it. Nothing else is built until the creator accepts it | `references/03-motion-and-sync.md` |
| 6 | The rest | remaining scenes | same checks per scene; builders are Opus, named explicitly, each owns whole scenes, final render in one piece | same |
| 7 | Sound | picture accepted | ask once: sound or none. Never plan or place sound before | |
| 8 | Deliver | `node render.mjs <slug>` → `engine/full-visual/output/YYYY-MM-DD/NN-<slug>.mp4`, caption `.txt`, copy it to `workspace/output/<project folder>/<slug>.mp4` with `caption.txt` (the post caption) and `cover.jpg` (a frame of the video), full paths printed (`references/05-workspace.md`) | both checks exit 0 on the final file | |

## Commands (from `engine/full-visual/`, renders with the sandbox disabled)

```bash
node ../../scripts/py.mjs scripts/voice.py <slug> --audition id:label,...   # a synthetic voice: the creator picks from reels/<slug>/voices/
node ../../scripts/py.mjs scripts/voice.py <slug>                 # script.txt -> voice.mp3 + voice.alignment.json, whole take, never patched
node ../../scripts/py.mjs scripts/align.py <slug>                 # caption.txt + voice -> words.json
node ../../scripts/py.mjs scripts/check.py plan <slug>            # before pixels
node render.mjs <slug> --stills 1.2,3.45,9      # look before rendering: reels/<slug>/stills/
node render.mjs <slug> --guides --stills 9      # bands + Instagram's zones drawn on
node render.mjs <slug> [--from s --to s]        # output/YYYY-MM-DD/NN-<slug>.mp4
node ../../scripts/py.mjs scripts/check.py render <slug> <mp4>    # dead holds, bare ground in a handover
node ../../node_modules/typescript/bin/tsc --noEmit -p .           # types, before any render
```

A new reel: `reels/<slug>/` with `voice.*`, `caption.txt`, `reel.json`, `scenes/index.tsx` (scene id → component). It registers
itself: `reels/index.ts` finds every `reels/<slug>/scenes/index.tsx`. A scene with no component yet renders as caption over ground, which is how the caption is
judged first.

## What a scene is

A React component that reads `useScene()`: the current frame `f`, `cue("word")` (the frame that word starts, within
this scene; it throws if the word is not in the caption), `cueEnd`, `endsOn("word", dur)` (where a build of `dur`
frames must start to finish on the word), `scene.from`, the ground palette and the theme. It draws inside
`<Column>` and moves things with the kit in `src/engine/moves.ts` and `Motion.tsx`: `blurIn`, `pop`, `blurOut`,
`<Travel>`, `typeOn`, `countTo`, `jitter`, `stagger`, `mix`, `draw`, `<Cursor>`. Every motion is a start frame taken
from a cue and a duration in frames. No timeline file, no seconds typed by hand.

The kit is verbs, not components: nothing in it has content. What a reel draws is written for that reel.
