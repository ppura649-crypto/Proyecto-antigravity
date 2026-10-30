# Talking Head overlay library

The reusable visual system for Creator Format 1 reels. Built on reference edit A
(2026-09-01), reuse for every new video. reference edit D (2026-09-04) added the eleven
explainer kinds at the bottom of the table: one drawn mechanism per spoken sentence,
after a layer of product chrome and page captures was rejected for not explaining anything.

## The laws (from formats/creator-format-1-visuals.md, measured on 4 Creator Format 1 reels)

- One visual at a time, in THE BAND, and the band is measured per video with
  `scripts/measure_face.py` (geometry.json), never assumed and never inherited from another
  video of the same speaker (the creator 2026-09-04: "all the overlays should be just on top of the
  head ... we should ALWAYS HAVE some safety margin on top because the very very top shouldn't
  be used as much as you can't see it as much on short form content social media"):
  - `cardTopFrac` (~0.105H): the only hard line. Instagram and TikTok draw their own chrome
    over the top of a 9:16 frame.
  - `cardBottomFrac`: a hair into their hair (measured head top + ~0.03H). Where a card RESTS,
    so it sits just on top of their head instead of floating at the ceiling.
  - Height is NEVER clamped. A card takes what the visual needs; one too tall pins to the top
    line and spills DOWN over their hair, which is allowed ("it can go over the head slightly we
    don't care, we have no restriction there", 2026-09-04). `card.takeover: true` hangs a
    centrepiece from the top line with the footage still behind.
  - `formats/creator-format-1.json` sets `cardAnchor: "top"` so reference edit A still renders as it shipped.
- The retention title: one short line (two at most, no wrap, complete at frame 0) naming what
  the video pays off, BIG and mid-screen above the head with no card behind it, gone by ~2-2.5 s.
  It is `hook.title` in `caption-plan.json` and page 0 of `captions.json`, owned by `hook.json`
  (see the skill's `02h-hook.md`). A small persistent line in the top strip (`screenHook`) was
  tried and rejected the same day: it reads as a watermark.
- A visual lives as long as its idea: in on the trigger word, out on the idea's LAST word; length
  is never a fault by itself, a card that stops moving is (the skill's `04c-timing.md`); never the same kind
  twice; every authored word from the transcript: `scripts/lint_visuals.py` fails a layer on any
  of these before it is shown.
- Entry ON the trigger word, lag < 0.3s, never early. Hard pop in, hard cut out.
- Motion lives INSIDE the card only: scroll, zoom 1.00-1.04, tint sweep,
  cursor. The card itself never slides or fades around the frame.
- ALL cards are SQUARE. No rounded corners on the overlay container.
- Alternate light (GitHub white replicas) and dark (chart / terminal) cards.
- Terracotta #E07850 is the only saturated color. Sweep opacity 0.24 light /
  0.32 dark.
- Frameless "float" graphics for icon moments (e.g. overlapping skill folders).
- Logos: real marks only. logo.dev first (`img.logo.dev/<domain>?token=$LOGO_DEV_TOKEN&size=600&format=png&retina=true`,
  raw file in `assets/logos/logo.dev/`, bare mark as `assets/logos/<domain>.logo.dev.png`), the Google
  favicon API as the fallback (`https://www.google.com/s2/favicons?domain=<domain>&sz=256` -> `assets/logos/<domain>.png`).
  Floated frameless. NEVER a div, tile or background behind a logo (the creator 2026-09-02). A mark that
  arrives on a white tile (claude.ai from logo.dev) is stripped by solving alpha per pixel from the
  mark's flat colour against white, then cropped to its bbox; `scripts/logo_clean.py` does the
  flat-background flood-fill case. Two checks before a mark ships (reference edit B, 2026-09-04): it must
  be a MARK, not a wordmark (Intercom's logo.dev file is the word "Fin"), and it must not be a
  solid black glyph, because black disappears on their footage. OpenAI, Notion and GitHub ship
  black; use each brand's own WHITE form for them.
- The Claude agent mark lives in `remotion/src/cards/Mascot.tsx` and every explainer card draws
  that one file, so the agent looks the same in the tree, the split, the swarm, the comparison
  and the library.
- Card headings use `theme.ts` `LABEL_FONT` = `var(--reel-font, Michroma...)`; CaptionReel sets
  `--reel-font` from the format's `fontFamily`, so a font change in the format reaches every card
  heading (the creator 2026-09-03). Mono, the chart figure font and the document serif stay: artifacts.
- Name under a mark (`label` / `label2` on a float): the caption style Overlay receives from
  CaptionReel (font, weight, size, case), white, caption shadow. Michroma on their format, the flat
  Avenir Next Bold 46 px uppercase on a guest format (the creator 2026-09-03).
- CONTRAST, settled 2026-09-05 after two wrong answers. Their cream wall kills a white glyph, but
  the fix is NOT a plate behind every element (rejected: "i didn't mean all the cards or
  everything") and NOT thicker outlines (rejected: "NOOOOO no borders"). It is Creator Format 1's own
  language, in formats/creator-format-1-visuals.md: a dense diagram goes on ONE BLACK CARD (#08080a, square,
  NO border, no radius, no shadow) with white content on it, max two type sizes, generous padding,
  and terracotta only on the payload. "Zero decoration: no borders, no gradients, no emoji."
  Cards that are themselves chips (a field or a spray) stay off a card: each chip is a solid black
  plate with white text and no outline. Real artifacts keep a light card (#FEFEFE, no border).
  Not everything needs black: "Not for all black background only when it needs."
- Bare screen is a spotlight for the important line, not a rest.
- Captions never move for a card.

## The pipeline

1. Author artifacts as HTML in `projects/<p>/assets/src/*.html`
   (start from `library/templates/`). `body[data-vw]` = CSS viewport width
   (780 standard -> 1560 device at DPR 2). `data-transparent="1"` for
   frameless floats. `data-mark="id"` on any element a sweep must hit.
2. `node scripts/shoot_assets.mjs projects/<p>` -> tall PNGs + `meta.json`
   (sizes + mark positions, device px).
3. Describe events in `projects/<p>/visuals.json` (schema below). Sweeps
   reference marks by id; render.mjs resolves them from meta.json.
4. `node remotion/render.mjs projects/<p> [--still --frame=N] [--range=a:b]`.
   Self-check stills at each event before any full render.

## visuals.json event schema

```json
{
  "id": "villain-rules",
  "kind": "shot | float",
  "fromMs": 2161, "toMs": 4003,
  "asset": "rules-bloated.png",
  "card": { "yFrac": 0.05, "wFrac": 0.86, "hFrac": 0.26, "frame": "light|dark" },
  "scroll": { "from": 0, "to": 2600 },
  "zoom": { "from": 1.0, "to": 1.04 },
  "sweeps": [ { "atMs": 9026, "mark": "never" } ],
  "trigger": { "word": "rules", "atMs": 2161 },
  "until": { "word": "bloated.", "atMs": 3650 },
  "clock": "beats"
}
```

- `fromMs/toMs`: SPINE time (matches captions.json, pre speed-ramp).
- `trigger` / `until`: the FIRST and LAST word of the idea the card argues, with their spine ms
  from captions.json (the plan row's `in on` / `out on`). The lint fails a card whose `toMs`
  falls before `until` ends, unless the next card takes the same idea over on that frame.
  `trigger.note` records a deliberate early or late pop. `long` says why a card dwells past its
  last word or runs past 4.5 s.
- `clock`: `beats` (default: motion on the words, then the finished picture holds ≥ 600 ms),
  `run` (one continuous movement at a rate per second, the motion is the claim, exempt from the
  hold check), `still` (a thing to read, a slow push at most).
- `scroll`: asset device px at the card's top edge, linear over the event.
- `float`: only `yFrac` + `wFrac` used; image floats frameless, no shadow box.
- Renderer: `remotion/src/Overlay.tsx` (pop = 5-frame spring, out = hard cut).

## Designed (animated) card kinds

Driven by `beats` (spine-ms markers). Dark cards use `cards/theme.ts`; text on
black is WHITE (MUTED is near-white, never grey). A designed card can take
`card.frame: "light"` for a white shell (the matplotlib chart, the becomes
card). Abstract grey bars are banned as the main content: use REAL text lines,
real doc pages, real figure axes (the creator 2026-09-01, "refined like the hook").

| kind | component | beats | what animates |
|---|---|---|---|
| `rulewhy` | RuleWhy | why, reasoning | agent icon reads a real rule; dashed "the why" / "the reasoning" slots pop a glitching "?" per word (`asset` = the icon) |
| `barspick` | Designed.BarsPick | barsIn, move, pick | real instruction lines stagger in, agent icon drops to the easiest, that LINE flips terracotta (`asset` = the icon) |
| `chart` | Chart | drawFrom, apex | matplotlib-style white figure: labeled x/y axes + ticks + legend, one falling line, "rule debt" region + annotation on the beat. Always answer "what is X, what is Y" |
| `twobar` | Designed.TwoBar | shrink, rise | number roll clamped to the REAL values, bars spring |
| `transform` | Transform | arrow, blocks, goal, reasoning, examples, condense | 12 real rule lines -> arrow -> 3 refined panels fill per word, then the lines fly in |
| `growth` | Designed.Growth | fail1, add1, fail2, add2 | failure X pops, one line lands on a real-looking white doc page |
| `becomes` | Becomes | becomes | "this becomes this" on white: rules shot (`asset`) dims + compresses, arrow draws, distilled pattern shot (`asset2`) wipes into a pre-staged dashed slot |
| `dimread` | DimRead | dim | a REAL page (`asset`) fades to white except `keep` line rects, which stay bright with a terracotta tint ("barely read it") |
| `skim` | Skim | pagesIn, tear, fly, stop | four REAL pages (`pages[]` with `tears`) pop in, grey out to two lines each, the lines fly into a black context window and ENLARGE to readable size, the token counter stops on the beat ("skim pieces from a few pages to save tokens") |
| `term` | Term | (per line `atMs`) | a terminal whose lines appear on their own times and auto-scrolls; `lines[{atMs,text,tone}]`, tones ink / muted / accent. `chrome: "window"` on the event adds the macOS traffic lights to the title bar (off by default so reference edit A re-renders unchanged) |
| `fill` | Fill | none (`counter` from/to over the event) | the context window again, a REAL page (`asset`, dark markdown shot) streams into it and the counter climbs ("fixes exactly this") |
| `entire` | Entire | snippets, entire | takeover on white: a snippet (`asset` + `keepOne` rect) greys and is struck, arrow, the entire page (`asset2`) streams under its real `address` |
| `claudecode` | ClaudeCode | (per line `atMs`, `push`) | the REAL Claude Code window at remocn's own geometry (1100x620, 40 px bar, 28 px padding, type 20/16/15/14/17), scaled whole to the card, so `card` must be 1100:620. `prompt` types into the ">" line, `lines[]` print under it. `push {atMs, ms, scale, ox, oy}` is the camera move that makes it readable; never resize the type instead |
| `fanout` | Fanout | `startMs`/`perMs` | TWO rows, ONE size (their spec 2026-09-04): a parent Claude mark over `agents[{name}]`, mono identifiers, 1.6 px connectors that draw themselves and carry one slow terracotta packet, every node breathing on its own phase. `merge: true` runs it backwards for the callback. Frameless: Overlay draws NO plate behind it |
| `prompt` | Prompt | (`promptAtMs`, `typeMs`, `beats.words`) | Claude Code's INPUT BOX, not a session: the ask types on the first line, the two words land on their own line in terracotta and underline themselves. `data.ask` = {ask, words, hint, model} |
| `split` | Split | parent, split, agents | the mechanism card: a job box with its pieces listed inside, the claude in charge above it, then the box collapses to its header and the pieces fly down into chips with an agent under each. `data.split` = {job, items[], parent}. Frameless |
| `swarm` | Swarm | work | one agent paired to each real mark, `items[]` landing one per `perMs`, every pair pulsing together on `beats.work` ("at the same time"). Frameless, nothing behind a logo |
| `weigh` | Weigh | right | the trade the creator states: cost in grey, payoff in terracotta landing second, the page they both come from named under them. `data.weigh` = {left, right, source}, each side {label, value, note} |
| `versus` | Versus | left, score1, right, score2 | one Claude with a pile of tasks, alone and centred, sliding aside as the ten arrive one task each; a score under each side. `data.versus` = {left, right, tasks, agents}, each side {title, sub, score}. Frameless |
| `library` | Library | chips, install | the real library: a count ticking to the repo's own number, its real agent names filling in, the real install line typing at the bottom. `data.library` = {count, unit, names[], install, source} |
| `timeline` | Timeline | select, collapse, fit, note |the video's OWN edit: a V1 filmstrip whose cells are the kept clips from `cuts.json` (each showing its real frame from `source.mov`) on the raw time axis, an A1 waveform from `levels.txt` under it, and a playhead. `select` flashes the dead air, `collapse` ripple-deletes it while the timecode counts the raw length down to the cut, `fit` zooms the sequence to fill the track, `note` lands the summary. `data.timeline` = {file, rawMs, cutMs, clips[{inMs,outMs,cum,thumb}], bars, packed, note, raw}. `raw: true` parks the beats past the event and draws the untouched take: one continuous filmstrip, no cut marks, a neutral waveform |
| `reach` | Reach | rows, per, total, totalMs | two real accounts: real profile picture, handle, a bar to scale and the real lifetime number, then the combined total rolls up. `data.assets` = one avatar per row, `data.rows` = [{handle, views}], `data.total` |
| `tracks` | Tracks | simple, more, per | the sequence's track stack: the first lanes are what a simple edit is, the rest land on the second beat with their real counts (24 clips, 210 pages, 14 cards, 37 beats, 1.1x). `data.lanes` = [{code,name,count,blocks}], `data.simple`, `title`, `titleMore` |
| `template` | Template | type, per, apply | the project's real `format.json`, typed line by line with JSON colours. `data.frames` makes the file recede whole (never reflow) while real frames of the finished video wipe in; `data.fan` stacks three copies with a `note`. `data.file`, `data.lines` = [{t,tone}] |
| `craftlist` | CraftList | list, per, strike, strikePer, land | the crafts you used to have to learn, landing then striking through one at a time, and what is actually required now arriving in terracotta. `data.items`, `data.land` |
| `pipeline` | Pipeline | start, per | one take in, one reel out: chips with the project's real numbers, arrows drawing left to right, the last chip lit. `data.chips` = [{name,value}] |
| `layers` | Layers | cuts, captions, visuals, made | a real frame of the mastered spine with the layers landing ON it (a filmstrip edge, a caption in the reel's own face, an overlay card in the band) and the ticks filling beside it. `data.frame`, `data.labels`, `data.captionWord`, `data.note` |
| `figures` | Figures | (per figure `atMs`) | two spoken figures rolling up on the words that say them, with a note under. No fake screenshot behind them. `data.figures` = [{to,suffix,name,atMs,rollMs}], `data.note`, `data.noteAtMs` |
| `skills` | Skills | agent, folders, per | an agent and the skills it owns: the Claude agent icon pops, then each blue macOS folder flies OUT of the icon to its slot and its name lands under it, Finder-style (long names wrap at the hyphen). Folders are drawn in SVG (back plate + tab, sheets peeking, front flap with a lit top edge), never a flat rectangle. `data.assets[0]` = the agent icon, `data.names` |
| `toolbox` | Toolbox | rack, per, sweep, sweepMs, ask, typeMs | the rack of tools a craft used to require, drawn as line icons, then a terracotta scan line walks the card and every tool it passes greys, tips and falls out of frame; one line of plain english is left standing where the rack was. `data.tools` = [{icon,name}] from the eight drawn icons (razor, keyframes, masks, curves, color, mixer, tracking, transitions), `data.ask` |
| `idea` | Idea | note, type, typeMs, live, tick | an idea and the thing it became: a real note sheet with the line typing on it, a terracotta wire across, and a phone that comes on PLAYING a real clip (`data.assets[0]`, an mp4 in the project's assets) with a progress bar and its running time. `data.head`, `data.note`, `data.time` |
| `stack` | Stack | marks, per, skills, skillPer | the real marks of a stack in a row with their names in the reel's font, then the skill folders (the same `Folder` the `skills` card draws) landing under them. `data.assets` = one mark per column, `data.names`, `data.skills` |
| `bars` | Bars | (per bar `atMs`) | a number measured against real reference numbers: one lit terracotta bar plus grey reference bars on a shared scale, each value rolling up on its own beat, and an optional `foot` figure under. `data.bars` = [{name,value,suffix,atMs,rollMs,lit}], `data.foot` = {to,name,atMs,rollMs}. Every value must have a source; never a drawn bar with an invented number |
| `packs` | Packs | panels, per, live | several products side by side, each showing a REAL frame of the work it makes: `variants` fans three real frames of one timelapse, `head` holds one real frame of the finished reel on a slow push, `cuts` shows a real montage frame with beat ticks and a playhead. Name and command under each, one terracotta line landing last. `data.packs` = [{name,cmd,art,imgs[]}] (render.mjs rewrites `imgs` to the project's asset path), `data.live` |
| `receipt` | Receipt | (per row `atMs`, `ruleAtMs`) | the spoken figures written down, a rule, then what they divide out to. Numbers right-aligned in mono against their labels; the block grows around the card's centre so a half-written receipt is never top-hung. `data.rows2`, `data.results` = [{value,name,atMs}], `data.ruleAtMs`. Every result must be arithmetic on numbers already on screen |
| `theatre` | Theatre | (rolls over the event) | three counters churn up while a fourth, DONE, sits at 0 and never moves. `data.theatre` = {counters[{label,to}], dead{label,value}} |
| `loop` | Loop | draw, run, fast | a closed four-node circuit with a terracotta packet running it, and one dashed branch to a dimmed `exit` box the packet never enters. Frameless. `data.loop` = {nodes[4], exit} |
| `gather` | Gather | full | four lanes with their own glyphs land on their own words and every arrow feeds ONE open-topped bin that fills a quarter per lane. No outflow, and the absence is the argument. Frameless. `data.gather` = {lanes[{label,at,glyph}], bin{label}} |
| `forward` | Forward | activity, measure, history / fast, learn | the same track twice. `mode:"stuck"`: the marker vibrates, the measure collapses to `0`, ten attempt ticks pile on the start line. `mode:"moving"`: the marker advances one step per done thing, the measure grows, a LEARNED axis rises. Frameless. `data.forward` = {mode, startLabel, markerLabel, measureLabel, steps[]} |
| `firehose` | Firehose | ask, burst | one question chip, then chips spraying out of it past the bottom edge, never settling. Frameless. `data.firehose` = {question, chips[]} |
| `race` | Race | go, wall, loops | two lanes, same question: the AI bar laps with a tally while the human bar crawls to a hatched wall. Frameless. `data.race` = {top{label}, bottom{label}, wallLabel} |
| `opportunities` | Opportunities | start, everywhere | idea chips popping across the box on a packed grid, the field closing up on the second beat. Nothing is ever clipped. Frameless. `data.opportunities` = {ideas[]} |
| `value` | Value | split, hard | one bar splitting into a grey sliver and everything else, which fills terracotta, gains hatching and drops. No percentages: the proportion is the claim. Frameless. `data.value` = {whole, sliver, rest, hard} |
| `before` | Before | slot, drop, order, type | remocn's claude-chat composer verbatim under a dashed slot, and a CAMERA that walks the sentence: whole shape, push on the slot, pull back for badges 1 and 2, push on the composer as the prompt types. The order IS the teaching. `data.before` = {slotLabel, outcome, prompt, model, tier} |
| `docvslist` | DocVsList | build, once, collapse, list, tick | a real report writes itself, is stamped OPENED 1x, collapses, and re-forms as checkboxes with the first ticked. `data.docvslist` = {docTitle, docLines[{t,kind}], pages, readMark, items[]} |
| `skillcard` | SkillCard | type, land | a real SKILL.md: line-number gutter, frontmatter typing behind a caret, the description landing in terracotta. `data.skillcard` = {file, frontmatter[{k,v}], description} |
| `hollow` | Hollow | drain | one heavy block filled solid terracotta, labelled FEELS LIKE WORK, whose fill LEVEL then falls away to nothing and leaves an empty shell. The label flips dark-to-white along the falling fill line. Replaced `theatre` on reference edit D ("the first visual with black card... lack deep creativity"). Frameless. `data.hollow` = {feels} |
| `steps` | Steps | walk, gap / reach, learn | footprints on a ground line, and a goal post at the far right. `mode:"stuck"`: twenty-plus prints stamp on the SAME spot, piling into a trampled heap, and a dashed measure to the post never changes. `mode:"moving"`: the prints march forward, one per done thing, reach the post and raise a LEARNED staircase. Replaced `forward` on reference edit D. Frameless. `data.steps` = {mode, goal, steps[]} |
| `cta` | Cta | swap | comment "KEYWORD" line, swaps to save this video; y from `card.yFrac` (~0.235, just above the head), base 0.056W. `iconAbove: true` on the event puts the bookmark just above the line instead of reference edit A's fixed 0.148 H (edit-c-evals, 2026-09-06 "make the icon just above the save this video"); the click must be ≥ 310 ms after the swap (the cursor glide), reference edit A used 660 |

TAKEOVER cards ("almost full overlay", video still visible behind): wFrac 0.92,
yFrac 0.045, hFrac 0.52 (bottom stays above the caption baseline). Use for the
1-2 centerpiece moments only.

Real-page captures (e.g. the arXiv study): `node scripts/shoot_url.mjs <url>
<out.png> [--from cssY] [--paras] [--mark name=text]` (DPR 2, width 780, writes
`<out>.json` with paragraph and text rects in device px). Pass `assetW/assetH`
directly in the event (no meta entry), sweeps and tears with raw y/h from that
JSON. Never fabricate a source page.

## Templates (`library/templates/`)

| File | What it fakes | Notes |
|---|---|---|
| `gh-markdown.css` | GitHub markdown-body, light | colors sampled from a real capture |
| `rules-doc.html` | bloated CLAUDE.md villain doc | swap the bullets per story |
| `rules-closeup.html` | zoomed rules list w/ marks | 21px font, data-marks for sweeps |
| `gh-file-listing.html` | GitHub repo folder view | breadcrumb, toolbar, commit bar, rows |
| `skill-folders.html` | overlapping folder art (float) | tab-flush folders + agent icon |
| `becomes-rules.html` | the literal-rules "before" shot | gh-markdown bullets, crop to content |
| `becomes-pattern.html` | the distilled-pattern "after" shot | terracotta left edge, Goal/Why/Good |

Realism rules: clone real UI colors (sample from a real screenshot, never
guess), system-ui font stack, real octicon paths, truncation/ellipsis where
GitHub truncates. No invented chrome, no lorem, plausible commit messages.

Before hand-rolling any product UI, pull the registry LIVE: `remocn.dev/r/registry.json` lists
297 items across remocn / remocn-ui / remocn-icons, and `remocn.dev/r/<name>.json` carries the
component's source (`claude-code`, `claude-chat`, `chat-gpt`, `opencode`, `terminal-simulator`,
`glass-code-block`, `live-code-compilation`, `message-bubble`, `chat-flow`, `imessage-chat-flow`).
The local mirror at `motion-lab/src/components/remocn/` is 37 of them and can be behind (the creator
2026-09-04: "look at the remocn, the real one, use the website"). Copy the component's numbers
verbatim and scale the whole thing; re-deriving sizes from the card breaks the proportions.
The mirror holds: `claude-code.tsx` and `claude-chat.tsx` are Anthropic's own screens with the real
palette, `terminal-simulator.tsx`, `glass-code-block.tsx`, `live-code-compilation.tsx`,
`simulated-cursor.tsx`, `logo-enter.tsx` and a full set of wipes and reveals. Port from there,
do not reinvent (the creator 2026-09-04: "look at remocn in depth, we have so many components we can
use for chats etc, like for claude it has the full thing already"). A bare black rectangle with
mono text is not a product UI.

## Assets (`library/assets/`)

- `claude-agent-icon.png` - the Claude Code pixel agent (13x11 grid restored
  from the official folder art at 40px/cell, transparent). Slate #3F4B5B,
  eyes #A9B2D6.
- `claude-folder-art-ref.png` - the original folder-art reference screenshot.

## reference edit B explainer family (2026-09-04)

Six drawn cards for the subagents video, all on the black plate with `Head.tsx` (small-caps
muted label top left, optional mono figure right), because that is what both approved finals
do with anything built. Only real marks and the agent tree float frameless.

| kind | the sentence it explains | the object |
|---|---|---|
| `crowd` | "too few people know about this" | 100 Claude marks in grey, 3 side by side lit. No number is claimed |
| `roles` | "it works like delegation" | two role rows (main claude / subagent) with a job arrow down and an answer arrow back up |
| `scale` | "costs more tokens, but the difference can be huge" | a balance; each side owns a fixed column and the pans sit under them, so a long value can never clip |
| `overload` | "give Claude 10 tasks, it might do a 7 out of 10 job" | ten outlined `task N` chips landing on one mark, output bar draining |
| `spread` | "10 agents on one task each, more depth" | ten marks in a row, one chip each, a depth bar growing under every one |
| `converge` | "the main Claude merges all the answers" | ten answers fanned like a hand of cards, gathering into one on the word |

`ClaudeCode` gained `mode: "session"` (drops the welcome box, prints the sent prompt and what
it spawned) and `winW`/`winH`. A terminal is resizable, so a session is a 700x430 window: the
type stays remocn's own and lands 1.5x larger on the frame because the whole window scales.
`CcLine.right` puts a value at the end of a row; `{t}` becomes the live elapsed seconds, which
is how ten identical clocks prove ten runs are concurrent.

## edit-c-chip family (2026-09-05): the NVIDIA / Jalapeño reel

Fourteen kinds built by five Opus 5 agents (one family each, zero helpers) from `visual-plan.md` v3
+ this file + `packs/creator-format-1/pack.json`, on their brief "CREATIVE, AND ULTRA ON SYNCH WITH MY WORD".
Real captures stayed where the artifact IS the claim (`shot`: TechCrunch, SemiAnalysis x2, the
Nvidia post, the Gluon dir + file, the chip photo); the Hot Chips slide crop and the SemiAnalysis
chart screenshot were REDRAWN from the same numbers ("it doesn't look good, we can really make it").
All take `CardProps` (`cards/props.ts`: tMs, w, h, fps, fromMs, toMs, beats, assets) + `data.<kind>`.
`shot` is exempt from the lint's kind-twice rule; a `callback: "<id>"` event is the blessed replay.

| kind | file | the sentence | the object | beats |
|---|---|---|---|---|
| `twoscale` | TwoScale | "it took Nvidia 20 years and thousands of engineers / OpenAI did it in 9 months" | frameless: the real Nvidia eye + a 20-year bar with a dot field and a counter rolling to the real headcount, then the OpenAI mark + a 9-month stub on the same scale (ratio 0.0375). Enters after their 2-second rule | top, countEnd, bottomMark, barStart, barEnd, land |
| `die` | Die | "a chip optimized to run AI models" | black: a drawn die (`DieGlyph`, shared), `train` struck, `run` in the accent with tokens streaming at a rate | arrows, strike, stream |
| `bubbles` | Bubbles | "people were skeptical, me included" | frameless: three reply plates, then their real photo + `me included` | b1, b2, b3, me |
| `bench` | Bench | "measured on site, the real performance" | black: two packages on a bench (the Nvidia eye on Blackwell), probes drop, a meter needle swings and settles | probes, needle, settle |
| `mplbars` | MplBars | "almost 2 times more tokens per watt" | white, matplotlib idiom in SVG: three panels, the accent bars rise past the grey ones, the ratios land | rise, labels |
| `latency` | Latency | "3.6 times lower latency" | frameless: two lanes, dots at speeds 1/1.65 vs 1/5.99, `3.6x` lands while the slow dot is still travelling | launch, arrive, label |
| `curves` | Curves | "on par against Vera Rubin" | black chart, Creator Format 1's language: two curves from the real data points drawn by one x-front, names + `on par` land | draw, drawEnd, name1, name2 |
| `kernelslot` | KernelSlot | "a chip is nothing without the kernel, the tiny programs" | black: the SAME die with a dashed `kernel` slot, real Gluon lines slide in and light one cell each (callback of `die`) | slot, lines, linesEnd, lit |
| `devfield` | DevField | "used by more than 4 million developers" | black: a field of person glyphs filling centre-out, the counter lands on the source's own figure | fill, fillEnd, land |
| `moat` | Moat | "one of their moats" / "the CUDA moat is potentially dead" | frameless: a castle with the Nvidia eye on the keep, a water ring `CUDA`, rivals on the bank; `mode: drain` empties it and the rivals walk across | fill, bump / drain |
| `dates` | Dates | "production will start the end of 2026" | black: six real stops on one axis, the marker slides from `announced` to `end 2026` | marker |
| `mplline` | MplLine | "built their own, almost entirely with AI models" | white, matplotlib idiom: the kernel's % of roofline over hours, five annotated points, the last in the accent with the note | draw, drawEnd, points, pointsEnd, land |
| `gens` | Gens | "planning for a version 2 and 3" | black: three drawn chips on a staircase, Gen 2 pops in the accent, Gen 3 dashed | g2, g3 |
| `flywheel` | Flywheel | "AI models designed the chip, wrote its software, will run on it" | frameless: a ring with three stations lighting on their words, the OpenAI mark in the centre, a packet closing the lap on `year.` | n1, n2, n3, lap |

`cta` gained `second: {accent, plain}` (their words, "follow / for more"): no bookmark, no click.

v4/v5 (their rounds, 2026-09-05): `ladder` (Ladder.tsx) joins the family: black card, a podium of three ranked by a measurable
kept in the plan (rungs `{name}`, rank 1 first, marks in `assets` in the same order; beats `rung3, rung2, rung1`), rank 1's block
and name alone in the accent, logo + name only on the card ("no need for numbers"). `twoscale` row 2 repeats row 1's grammar with
the small team (`bottom.counterTo/unit`, forty dots, one each). Shots take `scroll.fromMs` (hold at `from`, then glide).
`moat` names its parts (`label` on the keep, `water` on the ring) and takes the rival as `assets[1]` (the real OpenAI mark).
`devfield.suffix` lands with the number ("4,000,000+"). The reel font is Kode Mono 700 from here on (formats/creator-format-1.json).

## edit-c-evals family (2026-09-06): the evals / "my Claude setup" reel

Ten kinds built by five Opus 5 agents (folder, tile, scorecard, task, chart families) from `visual-plan.md` v3
+ this file + `cards/props.ts`. Their three calls on the plan: the transcript is king (V10/V11 illustrate "5 to
10 tasks" as the creator SAYS it, never their real 2-task benchmark), their own skills are named nowhere (the V12/V13/V14
numbers are illustrations, no source line), the punch lands on `WORSE.`. The one real artifact is the
skills.sh leaderboard (`shot`, real browser capture, clipped to the rows the creator talks about) and the real
Claude mark (logo.dev). Sora 700 everywhere, the mono for terminals and the printout, DejaVu for the chart.
A `callback` may name a parent of ANOTHER kind: when it starts on the frame the parent ended (v5 tries ->
v6 runs at 18470, v7 -> v8 -> v9 scorecard, v12 -> v13 chart) Overlay keeps the chain's entrance clock,
so one object never re-pops mid-idea. A gap (v6 -> v6b) re-enters as usual.

| kind | file | the sentence | the object | beats |
|---|---|---|---|---|
| `skilldrag` | SkillDrag | "the moment a new model comes out, your skills go stale" | frameless: a SKILL.md sheet (stamped `OLD MODEL`) docks on the real Claude mark, the mark's badge flips to `NEW MODEL` and the sheet drops | pop, dock, drop |
| `taskfold` | TaskFold | "for each task you have a skill" | frameless: task lines fold into named skill folders, one pair per `perMs`, the tail anonymous at `anonPerMs` | fold, named |
| `tries` | Tries | "you try it once, it looks good, you're happy" | frameless: two dark plates `run 1` (a cross) / `run 2`; a green tick draws itself on `good`, a 12-piece burst on `happy` | run1, run2, good, happy |
| `runs` | Runs | "one run / the runs disagree / every run agrees" | frameless grid, three modes: `one` shrinks the run-2 plate into tile 0 and lands nine dashed `?` slots; `disagree` (callback) fills row 1, lands row 2 on one cadence, boxes the disagreeing columns in the accent; `agree` (callback) two rows of ticks, one pulse | shrink, land, question / label, row2, row2End, flash / row1, row2, row2End, pulse |
| `scorecard` | Scorecard | "a scorecard: quality philosophy, criteria, reasoning, success state" | light sheet with the terracotta edge, three stages on one document: `sheet` types the header + badge, `criteria` springs three drawn tiles with their criterion, `expand` grows row 1 into `reasoning` + `success state` (the others pushed down, never squeezed) | sheet, header / c1, c2, c3, more / reasoning, success |
| `taskfan` | TaskFan | "5 to 10 tasks" | frameless: one task card fans to five, then ten | card, five, ten |
| `lanes` | Lanes | "10 runs with the harness, 10 without" | black: the Claude mark streams two lanes of ten runs, `with harness` on top, `without` below, a `?` on question. `data.harness` (not `lanes`, which is the tracks card's) | stream, top, bottom, question |
| `mplruns` | MplRuns | "the best run is not the point / on average, the worst run, the quality bar" | white, matplotlib idiom in SVG: two categorical rows of ten scores; `best` rings and strikes the max of each row; `compare` (callback) drops the dashed means, rings the worst, drops the bar at 85, greens the dots above it and lands `n of 10` | pop, circle, strike / mean, worst, bar, count |
| `benchtable` | BenchTable | "98 to 95 means it does not work" | light mono printout `without / with / delta`, an accent band sweeps row 1 then row 2 and stays, the delta flips to the accent | pop, sweep1, sweep2 |
| `trash` | Trash | "then you throw it away" | frameless: the printout drags into a macOS Trash and poofs | drag, poof |

`term` gained `stamp: {atMs, text}` (a tilted accent word slammed on its window: `UNTESTED` on "testing").
`cta` gained `iconAbove` (the bookmark just above the line, their ask). Each card's `data.<kind>` shape is the
`XData` type at the top of its file.

## edit-c-qa family (2026-09-06): the QA agents reel

Seventeen kinds built by five Opus 5 agents (A the QA mechanism, B the sheets, C logs / code / traces,
D the three agents, E real things and the joke) from `visual-plan.md` v3 ("## v3 build spec" is the
builders' contract: fractions, beats, data shape per card) + this file + `cards/props.ts`, on their brief
"ILLUSTRATION THAT DESCRIBE VISUALLY EXACTLY WHAT THE TRANSCRIPT SAYS" and their evals round 1 ("background
almost all the time"): every object on ONE black card except the CTA, frameless is no longer the default
for a drawn explainer. Real: the two repo README one-liners (`repos`, composed from 600-px captures), the
OpenTelemetry and VictoriaMetrics marks (`backqa`), the Claude Code window (`corrections`). Sora 700 through
`LABEL_FONT`, mono for dates / code / the terminal / the receipt. Chains: `review` continues `distill`'s
sheet, `poisonrun` (two modes) continues `poison`'s tile row, `waterfall` mode `pattern` continues mode
`group`; each callback draws its inherited state statically and animates only its own beats.

| kind | file | the sentence | the object | beats |
|---|---|---|---|---|
| `harnessqa` | HarnessQa | "having a reliable QA agent is the hardest part" | the harness as a pipeline: `coding agent` mark → a diff sheet → `QA agent` mark → a verdict slot that flips ✓ ✗ on the same diff and freezes on an accent `?` with a crack at the punch | pop, pass, flip, punch |
| `scratch` | Scratch | "I stopped writing QA prompts from scratch" | a light editor sheet `qa-prompt.md`, three bars type, the page crumples (the remocn crumple idea) into a wire bin | pop, type, crumple |
| `logmine` | LogMine | "went through all my logs for the last 6 months and collected all the human feedback" | six month cells lighting as a dated log column scrolls at a rate; the white human rows fly onto a shelf from `collected`; the label lands on the hero | pop, month6, lift, label |
| `corrections` | Corrections | "add empty states, no abstraction, handle failed requests, because this should never have passed" | the real Claude Code window (remocn's chrome, a 560 x 346 window scaled whole), their four corrections typed as `>` prompts on their words, the last in the accent with a push | p1, p2, p3, p4 |
| `distill` | Distill | "those messages are the real signal to craft high perspective pattern and philosophy" | message bars stream through a horizontal funnel, grey ones fall away, white ones reach a sheet where `pattern` and `philosophy` type as headings | pop, stream, sheet, head1, head2 |
| `review` | Review | "how I want my agent to review my code" | callback: the sheet docks beside the Claude mark, a scan line walks a code panel and ✓ / ✗ land in the gutter | pop, scan, marks |
| `threeway` | ThreeWay | "I separate them into three" | the pile bursts into three stacks, a Claude mark above each, empty dashed slots under | pop, burst |
| `frontqa` | FrontQa | "a front end agent focused on UI and UX" | the mark + a browser window: inspect outlines draw on `UI`, a cursor clicks through a flow on `UX` | pop, inspect, click |
| `repos` | Repos | "using mainly agent-browser and React Doctor" | light card: two real README clippings (header row + title + one-liner) landing on their names, the sentence swept | first, second |
| `backqa` | BackQa | "a back end and code quality agent with OpenTelemetry or Victoria Stack" | the mark + a request path with a trace waterfall growing per run; the two real marks land on their names with a sparkline | pop, run, tool1, tool2 |
| `coupon` | Coupon | "a security agent focusing mainly on business failures" | the mark + a receipt: `SAVE20` applied once, twice, three times, the total rolls negative and `PAID` stamps anyway | pop, dup2, dup3 |
| `phases` | Phases | "the most important phase is the testing phase" | four phase cells in their words, the fourth fills accent and grows on the hero | pop, lit |
| `poison` | Poison | "for all my existing features, I would poison them with specific bugs" | five wireframe tiles, a dropper tips over one, a code line's `0` flips to `1`, a `bug` tag lands and the list loses its rows | pop, label, drop, flip, tag |
| `poisonrun` | PoisonRun | "to see if the process works like it should / if it fails" | callback: three agent chips scan the poisoned tile, two grey ✓, the tag flies into the front end slot as an accent ✗ (`catch`); or every slot grey and the tag drops back pulsing (`missed`) | land, pass, fly / miss |
| `waterfall` | Waterfall | "look at the logs and traces, group the similar failures / identify the high-level pattern" | a log column + an OpenTelemetry-style span waterfall, the three accent spans gather under a bracket labelled `similar failures` (`group`); a lens passes, the three lift and merge into one accent `pattern` line (`pattern`) | pop, draw, gather, bracket, label / lens, lift, merge |
| `smallest` | Smallest | "add the smallest prompt on the harness, with the goal, the reasoning, example, and counter examples" | the editor sheet with content, a tiny dashed block beside it docks under the last line and fills four slots on their words, `goal` carrying `add empty states` | pop, block, dock, s1, s2, s3, s4 |
| `cycle` | Cycle | "this process is very long and tedious, but the results are incredible" | a five-station ring in their words lapping slowly with a tally, then the QA agent returns with ten ✓ on one cadence and `reliable` in the accent | pop, result, word |

`term` gained tone `struck` (a line-through in MUTED: `false positive?` under the `reproduced` stamp).

`term` also takes `struckAtMs` on a line (the line turns MUTED + line-through from that time; V12 of edit-c-qa: `false positive?` answered by the `reproduced` stamp).
