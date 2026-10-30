---
name: talking-head
description: "Edit a raw talking-head recording (an iPhone .MOV, retakes and all, the creator's or a guest's) into a finished short-form reel in this Keyframes folder, in a chosen style pack (Creator Format 1 by default, the guest's flat format, Creator Format 2): a one-shot measured cut, captions on the whole video, a hook stage with its own gate and lock, a visual plan the creator approves before any pixel, explanatory visuals built from that plan (real where the artifact is the claim, drawn where it is a mechanism, a chart where it is a number), sparse SFX and a voice chain, delivery guards. Use whenever the user drops a talking-head .MOV/.mp4 and wants it edited, says talking-head, 'edit this video', 'do the whole thing on IMG_xxxx', wants captions, a hook, visuals, SFX or a voice fix on a talking-head cut, wants to nudge or re-render an existing talking-head project, or asks how reference edit A or reference edit B was made. NOT the 3-zone footage reel, NOT stack-reels cards, NOT the resources reel (resource-reel), NOT a script to read to camera (script)."
---

# Talking Head

One raw take in, one finished reel out. The machine proposes every layer; the creator approves
each layer once; an approved layer is locked and never regenerated. Each pack names the finished
reels worth opening before starting (`packs/<name>/pack.json`, `reference`): they are things to
watch, not descriptions to trust.

## The brief

Be ultra creative. Illustrate the transcript perfectly, the visual is what the creator is saying at that
exact moment, in perfect sync with their words. Make it feel real: full illustrations are the
ideal, drawn with so much detail and finish that they read as real even though they are not,
and the real artifact itself whenever one exists. Every animation smooth. Read every plan,
still and render against this as the creator would before the creator sees it; the creator should never have to say it
again.

Sound: their palette, sometimes, on meaning; nothing new without their word; ask first whether the
video has sound at all.

Standing, because the creator has had to repeat them: an approved layer is never touched by a later
stage; a card takes the size its content needs; nothing sits behind a logo; the same visual never appears twice; a
number the creator says earns a chart; feedback from anyone else, on their video, stays with their pack
and never reaches their format.

The harness is patterns plus a few mechanical checks. Each stage has one pattern file: its goal,
the reasoning behind it, what good looks like and the traps, so the model can think its way
through a situation the file never named. Where the same correction came back on two videos
there is a script that refuses to continue. Read the pattern for the stage you are on before
touching it; the patterns are the skill, not summaries of it.

## The stages and their gates

| # | Stage | In → out | Gate (what must be true before the creator sees it) | Pattern |
|---|---|---|---|---|
| 0 | Ingest + geometry | `source.mov` → `audio.mp3`, `words.json`, `levels.txt`, **`geometry.json` + `geometry.png`** (`scripts/measure_face.py`) | geometry.json exists; nothing is placed from a remembered or inherited number | `01-cut-and-review.md` |
| 1 | Cut | take selection against the written script → `cut_variants.py d-hard` → `spine.mp4`, `master.mp4` | `verify_cut.py` six checks pass (incl. **the last word from the transcript**), gaze tile read; the creator watches it. The browser editor is there if the creator wants to trim | `01-cut-and-review.md`, `01b-verifying-a-cut.md` |
| 2 | Captions, whole video | `caption-plan.json` → `captions.json` → captioned render | stills at the stack, every hero, the CTA, one plain word; the creator watches the full file | `02-captions.md` |
| **2H** | **Hook** | `hook_build.py build` → **`hook.json`** (title, stack, first object, geometry) | `hook_build.py check` passes; a 0-4 s render + three stills (frame 0, last title frame, punch frame) and the copy as text; **their OK locks `hook` and `captions`** | **`02h-hook.md`** |
| 3 | Visual plan | **first ask them (AskUserQuestion): sound on this video, or visuals only**; then transcript + pack → **`visual-plan.md`**: one row per idea with claim type, object, mechanism, in on / out on words, clock, real/drawn + evidence, SFX | **the creator corrects it in words; the `approved:` line goes in only after that. `render.mjs` refuses a layer without it** | `03-visual-plan.md` |
| 3b | Visuals, the whole video | plan rows → components / captures / charts → `visuals.json` | `lint_visuals.py` passes (lives its idea, no kind twice, hold, band, subject, coverage, close, on the word); stills at every event and at each idea's last word, read at phone width; one refinement round | `04-visuals.md`, `04c-timing.md`, `06-refinement.md` |
| 4 | Sound | the plan's SFX column → mix; voice chain | A/B file for every voice change; presence measured | `05-sound.md` |
| 5 | Deliver | `node scripts/deliver.mjs` → `~/Downloads/talking-head-<id>-<layer>-vN.mp4` | locks intact, hook check, lint, not stale, not identical, no speed ramp (1x from frame 0), check frames from the delivered file | `06-refinement.md` |

Stages 2 to 4 each start from the previous approved layer and only add. If the cut changes
later, everything after it shifts mechanically (`01-cut-and-review.md`, the shift rule);
contents are never regenerated.

## What is standing, what is per creator

**Standing laws** hold for every creator and every style. They came from two or more videos:

- The visual argues the sentence. One visual per idea, the object the sentence is about,
  a mechanism drawn when the claim is a mechanism, the real thing when the artifact is the
  claim, a chart from real numbers when the claim is a magnitude (`04-visuals.md`).
- A visual lives as long as its idea: in on the trigger word, out on the idea's LAST word, never cut while its sentence still runs, not lingering under the next one. Length is never a fault by itself: a visual runs as long as it keeps bringing new motion for what the creator is saying, and a long visual that has stopped moving is the fault. 3 s is a budget, not a cutter. Bare screen only on a run-up, never on a payload word. The clock inside the card follows the words: beats then hold for a state, `run` when the motion is the claim, `still` for a thing to read ("a visual with full animation works SOMETIMES"). The pattern, with its reasoning and counterexamples, is `04c-timing.md`. `cta` excepted.
- Never the same object twice. Every event is a different kind doing a different job.
- The hook is complete at frame 0, two lines at most, no wrap, gone by ~2.5 s, and locked.
- Something is on screen within the first half second that is not the title.
- The punch line owns the screen alone; the last 5 s are talking head plus the CTA line.
- Geometry is measured on this master. The band, the baseline, the title top all come from
  `geometry.json`, never from another video of the same person.
- Real marks only; nothing behind a logo, ever. Names under marks wear the caption font.
- Authored words are their words: headers, labels, axis names use the transcript's nouns.
- A note changes what it names. Size of the fix = size of the note (`06-refinement.md`).
- The last clip's out-point comes from the transcript's word end plus air, never the gate; and
  the air is capped by the picture (a blink or a look-down ends the reel worse than 12 ms less
  tail does). A short tail with a `tailNote` on the clip reads CAPPED, not FAIL.
- SFX: few, gentle, on meaning (a highlight, a punch, a landing), never on a transition. The
  palette in `05-sound.md` is closed: a file not on it is not used, whatever the moment seems
  to call for. Whether a video has sound at all is their call, asked before the plan.

**Per-creator taste** lives in a pack and never leaks between creators: `packs/<name>/preferences.md`
says, at a high level, what this creator likes in visuals, captions and sound; the pack's format
file holds the measured values; `sfx.md` the palette. Read the preferences before the plan. When
a pattern in a creator's reactions becomes clear, the preferences file is rewritten to say it,
never appended to as a log. In a Keyframes folder the owner's saved look is
`workspace/library/talking-head.preferences.md` and `workspace/library/talking-head/profile.json`,
written by the `talking-head-customization` skill: read them before the plan, and where none
exists the default pack applies.

## Style packs

A reel is cut once and can be dressed in any pack. `engine/talking-head/packs/<name>/pack.json` names the
format file, the Remotion style key, the hook template, the card families it may use, the SFX
palette and the pacing preset; `packs/README.md` is the shape. Packs today: `creator-format-1` (their own,
`formats/creator-format-1.json`), `guest-flat` (Avenir Next Bold 46 px uppercase, the guest spec),
`creator-format-2` (the `creator-format-2-style` skill owns its method). A new pack is built the way Creator Format 2
was: her reels read frame by frame under `library/styles/PROTOCOL.md`, her families drawn from
scratch against the transcript, never a re-skin of an existing card ("you just changed the
colors"). A pack change never touches another pack's files.

## The plain rules

Small and precise, so they stay rules. Everything judgment-heavy is in the patterns.

- All times in `captions.json`, `hook.json` and `visuals.json` are **spine time** (matching
  `spine-map.json`). Nothing is ever sped up: every delivery plays at 1x from frame 0 ("don't sped
  up pls. Don't do that"); `hook_build.py check` refuses a format that carries a ramp.
- `node scripts/rebuild.mjs` ends by running `build_captions.py`. Once captions are approved (locked),
  never run that step again; shift the existing json instead. For the cut stage alone use
  `node scripts/master_audio.mjs` (rebuild.mjs's audio half plus the true-peak limiter, no captions).
- Cut points come from `cut_variants.py`, never from `tighten_cuts.py` + `cut_gaps.py` +
  `split_gaps.py` (kept only to reproduce the earliest projects; they use an absolute -45 dBFS gate).
- Locks: `scripts/lock_layer.py lock <project> <layer> "<their words>"` the moment the creator approves a
  layer; `check` runs inside `render.mjs` and `deliver.mjs`; a change the creator asked for is an explicit
  `unlock` with their words, then a re-lock. `diff <project> visuals` prints which events a change
  touches; compare that count with their note before rendering.
- Renders run from `engine/talking-head/` as cwd, sandbox disabled, and leave a ~200 MB bundle in
  `$TMPDIR/remotion-webpack-bundle-*` per render, stills included. Delete them after every
  render with `node scripts/files.mjs clean`.
  A full render also holds every frame as a JPEG (~1 GB per 44 s) until it stitches; under
  ~2.5 GB free use `node scripts/render_parts.mjs`. Never pipe `node render.mjs` into `tail` (the
  pipe hides the exit code; v5 shipped as v4 once). Write render chains as a Node script file.
- Builders are subagents, each with an explicit model named in the call (Sonnet or Opus, never the
  session default), six at most including helpers, one card family each, briefed with their plan
  rows, the pack and the card's device px. A builder never renders the full video and never runs a
  bundle cleanup while another builder or the integrator is up. A builder may improve its object
  and says what it changed.
- Two sessions in one repo need two bundles: snapshot `render.mjs`, `src/`, `tsconfig.json`,
  `package.json` beside the tree (`.render-<id>/`, `node_modules` symlinked to
  `../../../node_modules`, an empty `public/`) and render from the copy. Check
  `remotion/src/cards/` for a name before creating a card.
- A font change reaches EVERY piece of the reel's own typography at once (captions, hook stack,
  title, heroes, CTA, names under marks, card headings, via `theme.ts` `LABEL_FONT` reading
  `--reel-font`). Mono, the chart figure font, the document serif and shot replicas stay, they
  imitate artifacts. Before showing a font change, grep `fontFamily` in `remotion/src`.
- Logos: logo.dev first (`img.logo.dev/<domain>?token=$LOGO_DEV_TOKEN&size=600&format=png&retina=true`,
  token from the repo `.env`, never printed), Google favicon as the fallback. Bare mark, frameless,
  the brand's own white form when the file is a black glyph, a MARK not a wordmark.
- Never fabricate a source page or artifact. If the real one cannot be found, draw an obviously
  designed card and say so.
- Every render is self-checked on stills at the event frames, read at phone width, before it is
  shown. Deliverables: absolute path printed, copied to `~/Downloads`, versions never overwrite.
- Approve one, then batch: one card style before all cards, one property before eleven cards.
  The video itself is always shown whole, never the hook or the first 10 s alone.

## Commands, in the order a video runs

```bash
cd engine/talking-head
P=../../workspace/projects/<date>-talking-head-<slug>; node scripts/files.mjs mkdir $P; node scripts/files.mjs cp <the raw take> $P/source.mov   # copy, never move
node scripts/files.mjs project $P <path to the raw take>   # project.json: the workspace lists the video from this file
python3 -c "import pathlib,sys; p=pathlib.Path(sys.argv[1]).resolve(); (p/'source.txt').write_text(str(p/'source.mov'))" $P   # source.txt = where the take is; render_spine.py reads it

# 0 ingest + geometry
ffmpeg -i $P/source.mov -vn -ac 1 -ar 16000 -c:a libmp3lame -b:a 64k $P/audio.mp3
auto-editor whisper $P/audio.mp3 apple -sw -f json -l en -o $P/words.json   # on a Mac: Apple speech
node ../../scripts/transcribe.mjs $P/source.mov --local --out $P/words.json   # on Windows or Linux instead: the same words.json, from whisper with voice detection
node scripts/files.mjs cp $P/words.json $P/words.raw.json   # the transcript as it came; fix_words.py reads this copy
auto-editor levels $P/source.mov -tb 1000 > $P/levels.txt
python3 scripts/measure_face.py $P                      # -> geometry.json + geometry.png (read mic/hands off it)

# 1 cut (the one-shot engine; the four presets only for a speaker whose pacing is unknown)
python3 scripts/fix_words.py $P $P/asr-fixes.json       # ASR fixes into words.json (words.raw.json kept), BEFORE build_cuts
python3 scripts/build_cuts.py $P                        # sentences + retake groups -> cuts.json
python3 scripts/select_takes.py $P $P/selection.json    # {"5":"hook","17":"body",...,"67":"cta"} -> cuts.pre-tighten.json
python3 scripts/cut_variants.py $P d-hard && node scripts/files.mjs cp $P/cuts.d-hard.json $P/cuts.json
python3 scripts/render_spine.py $P && node scripts/master_audio.mjs $P
python3 scripts/verify_cut.py $P && python3 scripts/gaze_tile.py $P   # six checks + the eye tile (band from geometry.json)
#   gaze fixes: $P/gaze-nudges.json {"nudges":{"35":-33},"inNudges":{"5":-151}} then gaze_nudge.py + spine/master/verify again
python3 scripts/gaze_nudge.py $P                        # one frame in for a blink on the last frame; the hook's FIRST frame too
node review/serve.mjs $P 4322                           # only if the creator wants to trim; their save is the cut
python3 scripts/lock_layer.py lock $P cut "their words"

# 2 captions (format.json = the pack seeded with THIS master's geometry; then edit $P/caption-plan.json)
python3 scripts/format_from_pack.py $P                  # creator-format-1.json + geometry.json (+ the lit monitor behind them, if any) -> format.json
python3 scripts/build_captions.py $P && node remotion/render.mjs $P --still --frame=<N>   # reads $P/format.json
node remotion/render.mjs $P                             # -> $P/captioned.mp4, the creator watches it

# 2H hook
python3 scripts/hook_build.py build $P && python3 scripts/hook_build.py check $P
node remotion/render.mjs $P --range=0:120 --out $P/hook-preview.mp4 && node remotion/stills.mjs $P 0,60,<punch>
python3 scripts/lock_layer.py lock $P hook "their words" && python3 scripts/lock_layer.py lock $P captions "their words"

# 3 visual plan: one light search per named thing first, then write $P/visual-plan.md (references/03-visual-plan.md),
#   show it, the creator corrects in words, then add the line   approved: <date> <their words>
python3 scripts/plan_check.py $P                        # refuses a real/chart row without evidence, a drawn row hiding its search decision
# after a cut change on an APPROVED layer: shift, never rebuild
#   node scripts/files.mjs cp $P/spine-map.json $P/spine-map.before.json   BEFORE render_spine.py
python3 scripts/shift_times.py $P $P/spine-map.before.json   # captions.json + visuals.json + hook.json onto the new spine
python3 scripts/retime_plan.py $P                       # after any cut change: every `word ms` in the plan follows captions.json
# 3b build: the whole video in one pass
python3 scripts/lint_visuals.py $P && node remotion/stills.mjs $P <event frames> $P/checks
node remotion/render.mjs $P                             # the full file, never a first-10 s cut
python3 scripts/lock_layer.py lock $P visuals "their words"

# 4 sound: references/05-sound.md (the SFX come from the plan's column)
# 5 deliver: locks + hook + lint + stale + identical, no speed ramp, check frames FROM THE DELIVERED FILE
node scripts/deliver.mjs $P talking-head-<id>-<layer>-vN 0.0,1.0,5.3,15.2
node scripts/files.mjs output $P ~/Downloads/talking-head-<id>-<layer>-vN.mp4   # the workspace shows the finished video from workspace/output/<project folder>/
```

## Where things live

- `engine/talking-head/formats/`: `creator-format-1.json`, `creator-format-1-hook.md`, `creator-format-1-system.md`, `creator-format-1-visuals.md`
  (measured on Creator Format 1), `creator-format-2-*.md` + `creator-format-2.json`, `creator-format-3-*`. Per-video values
  go in `projects/<id>/format.json`, seeded from the pack and `geometry.json`.
- `engine/talking-head/packs/`: one folder per style, `pack.json` + `hook.template.json` + `README.md`.
- `engine/talking-head/library/`: `README.md` (overlay laws, event schema, card kinds), `templates/`,
  `assets/` (marks, the agent icon), `styles/` (other creators read frame by frame, `PROTOCOL.md`).
- `engine/talking-head/remotion/`: `CaptionReel.tsx`, `HookTitle.tsx`, `Overlay.tsx`, `cards/*`, `soft/*`,
  `styles.ts` (looks are data, picked by `format.json.style`), `render.mjs`, `stills.mjs`.
- `engine/talking-head/scripts/`: the gates (`measure_face.py`, `verify_cut.py`, `hook_build.py`,
  `lint_visuals.py`, `lock_layer.py`, `deliver.mjs`), the cut engine (`cut_variants.py`), captions
  (`build_captions.py`), assets (`shoot_url.mjs`, `shoot_assets.mjs`, `chart.py`, `logo_clean.py`).
- `engine/talking-head/review/`: the CapCut-style card editor (`serve.mjs <project> <port>`).
- SFX library: `engine/talking-head/sfx/` (`05-sound.md` says which ones the creator approved).
- Per project: `geometry.json`, `cuts.json`, `spine-map.json`, `caption-plan.json`,
  `captions.json`, `hook.json`, `visual-plan.md`, `visuals.json`, `locks.json`, `checks/`.

## How this harness grows

Only from what happened on a real video. A learning is folded into the reasoning of the pattern
it belongs to, replacing what it corrects, so a pattern never holds two answers to one question
and never reads as a log: no dates, no video names, no quotes inside a pattern. If the fix is
deterministic (a size, a clamp, a margin, a check) it goes into the script that should have
caught it. Something a creator likes goes into their pack's preferences, not into a pattern. A
correction from a guest creator on a guest video stays with their pack. A pattern that grows past
about 200 lines is two patterns.
