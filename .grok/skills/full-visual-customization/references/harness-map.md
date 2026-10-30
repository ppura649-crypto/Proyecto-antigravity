# The current Full Visual customization surface

This is a map of Full Visual as it ships in a Keyframes folder, read from
`engine/full-visual/src/theme.ts`, `src/fonts.ts`, `src/engine/Caption.tsx`, `Ground.tsx`,
`Chrome.tsx`, `scripts/voice.py` and `scripts/align.py`. Re-check the actual consumer before
relying on a field. It describes the current code; it does not modify it.

## How a choice reaches a reel

A reel's `engine/full-visual/reels/<slug>/reel.json` holds three blocks:

- `"theme"`: a deep partial of `Theme`, merged over the defaults in `theme.ts` by
  `withOverrides`. Only the keys written change. A key that does not exist in `Theme` does
  nothing: writing it is not a customization.
- `"voice"`: the ElevenLabs choice read by `scripts/voice.py` (`id`, `name`, `model`, `speed`,
  `stability`, `similarity`, `style`). Another provider is a `voice.json` beside it, read by
  `scripts/narrate.mjs`.
- `"chrome"`: the one pinned element, `{"type": "none"}`, a countdown `pill` or a `terminal`.

Per-scene and per-block choices (which ground a scene stands on, the caption slot, the key word,
an emoji) are written in the reel's `caption.txt` by the full-visual skill, not in the theme.

The house reels write `"motion": "measured"` and `"caption": {"leadMs": 80}` in every
`reel.json`; those are the house defaults below, even where `theme.ts` says otherwise.

## Caption

| Preference | Path | Default | What it changes | Engine change? |
|---|---|---|---|---|
| Caption font | `theme.font.caption` | `"Figtree, sans-serif"` | The caption face. Layout measures the first family name and refuses a font that is not loaded. | Only Figtree, Inter and JetBrains Mono are loaded. Another face: add it in `src/fonts.ts` through `@remotion/google-fonts` at weights 400 and 700, copy the file to `overrides/`. |
| Caption weights | none (in `Caption.tsx`) | active and key word 700, said words 400 | Bold active word, regular said words. | Yes, `Caption.tsx`. It is part of rule 3; change only on insistence. |
| Caption size | `theme.caption.size`, `theme.caption.lineHeight` | 74, 82 | Type size. Keep the ratio near 1.11 so descenders clear the next line. | No. A block that no longer fits two lines of `wrap` throws at render: the caption needs more breaks or a smaller size. |
| Line width | `theme.caption.wrap` | 740 | Where a block breaks into two balanced lines. | No. |
| Lines per block | `theme.caption.maxLines` | 2 | Fixed by rule 3. | Not a preference. |
| Active word colour | `theme.grounds.dark.ink`, `theme.grounds.light.ink` | `#FFFFFF`, `#0B0B0B` | The word being said, the key word, and primary authored text. | No. One value per ground; both must read on their ground. |
| Said words colour | `theme.grounds.dark.spoken`, `theme.grounds.light.spoken` | `#6B6B6B`, `#8E8E8E` | Words already said in the block. | No. |
| Vertical position | `theme.caption.top`, `theme.caption.bottom` | 318, 1372 | The y of the first line in the top slot and in the bottom slot. | No, inside the caption band of rule 2 (y 300 to 500 for the top slot). A caption low on every scene moves the stage band: not a look. |
| Slot per block | `caption.txt` `@top` / `@bottom` | top | Which slot a block uses from that line on. Chosen per reel by the full-visual skill when the stage needs the top. | Not a profile default. |
| Lead | `theme.caption.leadMs` | 40 in `theme.ts`, 80 in the house reels | How early a word appears before its syllable so it is sharp when heard. | No. Small range, about 40 to 100. |
| Blur-in | `theme.caption.blurInFrames`, `theme.caption.blurPx` | 4, 10 | How long and how soft a new word resolves from blur. | No. The word still resolves in place (rule 3). |
| Block clear | `theme.caption.clearFrames` | 3 | How fast a finished block clears before the next. | No. |
| Caption behaviour | `theme.motion` | `"v1"` in `theme.ts`, `"measured"` in the house reels | `measured`: ease-out blur-in with a 13 px drop, the box drawn in four beats, blocks clear on opacity. `v1`: the first build, linear. It also switches the stage handover curves, so it is a whole-reel setting. | No. Keep `measured` unless they prefer the v1 caption after seeing both. |
| Emoji before a word | `caption.txt` | used where a word earns one | An inline emoji that grows before its word. | No. "No emoji" is a boundary the caption writer follows. |

## Key-word marker

| Preference | Path | Default | What it changes | Engine change? |
|---|---|---|---|---|
| Marker style | `theme.marker.style` | `"select"` | `select`: a selection box with a tinted fill and two round handles. `pill`: a soft rounded wash behind the word. `none`: the key word stays bold with no box. | Any other style (underline, highlighter, colour only) needs `Caption.tsx`. |
| Marker colour | `theme.marker.color` | `#2E7AEA` | Box outline, fill tint and handles of `select`. | `pill` ignores it: it uses the ink colour at 10 percent. A coloured pill is an engine change. |
| Fill strength | `theme.marker.fill` | 0.18 | Alpha of the box fill. | No. |
| Outline and handles | `theme.marker.stroke`, `theme.marker.handle` | 3, 22 | Outline width and handle diameter. The handles have a white rim. | The white rim is fixed in `Caption.tsx`. |
| Marker timing | `theme.marker.delayFrames`, `theme.marker.drawFrames` | 5, 5 | The box lands a few frames after its word and draws in this long. | No. It must still land after its word (rule 3). |

## Background

| Preference | Path | Default | What it changes | Engine change? |
|---|---|---|---|---|
| Dark ground | `theme.grounds.dark.bg` | `#101010` | The dark scenes' flat colour. | No. |
| Light ground | `theme.grounds.light.bg` | `#FAFAFA` | The light scenes' flat colour. | No. |
| Which ground per scene | `caption.txt` `== id \| ground: dark` | chosen per scene by the story | Each scene stands on dark or light; the ground cross-fades in the silence between. | Not a profile default. A stated lean ("mostly dark") is recorded and the plan weighs it; the scene still picks for its content. |
| Grid | `theme.grounds.dark.grid`, `theme.grounds.light.grid` | `rgba(255,255,255,0.022)`, `rgba(0,0,0,0.028)` | Faint 1 px grid lines. It gives motion blur something to smear. Off = alpha 0, for example `rgba(255,255,255,0)`. | No. |
| Grid pitch | `theme.gridPitch` | 60 | Grid cell size in px. | No. |
| Authored surfaces | `theme.grounds.<g>.card`, `.hairline`, `.dim` | dark `#161618`, `#2A2A2C`, `#8C8C8C`; light `#FFFFFF`, `#E6E6E6`, `#6B7280` | Cards, rules and secondary text that scenes draw from the theme. Scenes that redraw a real interface keep its real colours. | No, but check stills: a scene that hard-codes a colour will not follow. |

## Fonts beyond the caption

| Preference | Path | Default | What it changes | Engine change? |
|---|---|---|---|---|
| Interface font | `theme.font.ui` | `"Inter, sans-serif"` | The pill chrome and authored labels in scenes. Redrawn real interfaces keep their real type. | New face: `src/fonts.ts`, as above. Usually left alone. |
| Mono font | `theme.font.mono` | `"'JetBrains Mono', monospace"` | The terminal chrome and authored code. | Same. |

## Chrome and colour roles

| Preference | Path | Default | What it changes | Engine change? |
|---|---|---|---|---|
| Pinned element | `reel.json` `"chrome"` | `{"type": "none"}` | One element for the whole reel or none. The full-visual skill picks it per reel; `taste.md` keeps the terminal out. A boundary ("never a countdown") is a profile choice. | New chrome kinds need `Chrome.tsx`. |
| Brand role | `theme.roles.brand` | `#D97757` | The pill's progress fill and its mark. | No. |
| Meaning roles | `theme.roles.ok`, `.alarm`, `.positive`, `.link` | `#41F9D3`, `#D7253A`, `#34C759`, `#2E7CF6` | Colours scenes use for meaning (success, danger, a link). | Not a look: keep them, they carry meaning. |

## The closing profile (the ask)

The last scene performs the ask in the creator's real interface: their Instagram profile header, a comment, or their
DM. The example reels draw a stand-in (`your.handle`, a synthetic portrait, invented counts). Every new reel draws the
creator's own identity instead, never the stand-in and never another person's.

| Preference | Where it comes from | Default | What it changes |
|---|---|---|---|
| Handle, name, bio | `context/profile.json` (`handle`, `name`, `bio`), read by `/start` through Composio | asked once if Instagram is not connected | The text on the drawn profile, comment and DM |
| Profile picture | `context/profile.json` `avatar.path` (a cached file under `context/profile/`) | asked once for an image; never initials or a placeholder face | Copied into the reel's `public/<slug>/avatar-creator.png` by the builder of the closing scene |
| Follower count | `context/profile.json` `followers`, written the way Instagram shows it (68.4K) | omitted when unknown, never invented | The number on the profile header |

Save the resolved identity under `resolved.identity` in the profile. It is data, not taste: refresh it from
`context/profile.json` before each reel when that file is newer.

## Not preferences

`theme.fps` (60), `theme.stage` (`width` 900, `top` 520, `bottom` 1450), `theme.handover`
(`"rise"`), `theme.minType` (32, the floor for any type that carries a claim; never lowered),
`caption.maxLines`, everything in `src/engine/Stage.tsx`, `Motion.tsx`, `moves.ts` and
`timeline.ts`, and `scripts/check.py`. They are the method and the checks.

## Voice

| Preference | Where | Default | Notes |
|---|---|---|---|
| ElevenLabs voice | `reel.json` `"voice"`, run `node ../../scripts/py.mjs scripts/voice.py <slug>` | House recipe from the example `hf-incident-h5`: id `gWaDC0oXAheKoZfljzuI` (library voice "Snap"), `eleven_v3`, speed 1.0, stability 0.5, similarity 0.8, style 0.0 | Exact word times from the provider. With `eleven_v3`, `script.v3.txt` (the same words plus audio tags) drives the performance and the take is timed by forced alignment. Pauses cut to 0.2 s with `tighten.py`, the hook never cut. A take is never spliced: regenerate it whole. |
| Audition (ElevenLabs) | `node ../../scripts/py.mjs scripts/voice.py <slug> --audition id:label,id:label` | 2 to 4 voices | Reads the first two sentences of `reels/<slug>/script.txt` per voice into `reels/<slug>/voices/`. |
| OpenAI or Fish voice | `reels/<slug>/voice.json` `{provider, voice, model, settings}`, run `node scripts/narrate.mjs --root ../.. --config reels/<slug>/voice.json --text-file reels/<slug>/script.txt --out reels/<slug>/voice.mp3` | none | Then `align.py` times the take by English speech recognition. No audio tags, no provider word times; sync is checked on stills like any reel. For an audition, run it once per candidate config on a two-sentence text file with a distinct `--out` name each. |
| Their own recording | `reels/<slug>/voice.mp3` (or `.wav`, `.m4a`) | none | Timed by `align.py` the same way. Never spliced. |
| Keys | added on the video's page in the workspace (the Video step), or put in `.env.local` at the folder root | | `ELEVENLABS_API_KEY`, `OPENAI_API_KEY`, `FISH_API_KEY`. Never in chat, never in a config. |

## Words and research

| Preference | Where it is used | Default |
|---|---|---|
| Script source | `full-visual-script` writes `script.txt`, or their transcript is saved as `script.txt` as is | The house script method: one side, five hooks scored, 190 to 210 words, spoken glue, every fact in `facts.md`. Their own transcript is taken as true and never rewritten. |
| Closing ask | Last sentence of the script | `comment "KEYWORD"` with the exact thing they will send. |
| Post caption | `caption-post.txt` beside the reel | Opens with `Comment "KEYWORD" and I'll send you ...`. |
| Lanes and stance | The research skill with `.agents/skills/full-visual/references/04-research-lanes.md` | The lanes and stance in that file, or theirs. |
| Language | `align.py`, the speech model | English only today. |

## Engine changes, when they insist

Every changed or added file is copied to `workspace/library/full-visual/overrides/` at its path
under `engine/full-visual/`, with a line in `overrides/README.md` saying what and why. An update
replaces the engine; the overrides are put back by hand and checked with
`./node_modules/.bin/tsc --noEmit -p .` and a still before any reel.
