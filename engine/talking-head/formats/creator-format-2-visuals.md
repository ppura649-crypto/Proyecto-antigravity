# Creator Format 2 visuals: the families, their exact animations, the jobs they do (9 reels, 2026-09-04)

Method: every event in every reel read frame by frame (entrance strip, internal-change strips,
one full-resolution hold, exit strip), tied to `words.json`. Per-reel event logs with frame
numbers are in `library/styles/refs/<code>/analysis.md`; this is the roll-up.

## The 5 jobs a visual does

1. **NAMING**: a thing appears the instant its name is said. Folders per project name (XAFZ
   f58-71, one per 4 frames), timeline bars per "styles", logo chips for "seven companies"
   (XANQ, real marks on white chips), the Canva wordmark on "Check" (XAH7 f968). Hold = as long
   as the name takes plus a beat, 0.5-2 s.
2. **PROOF**: a real artifact backs the claim. Her older reels in a rounded window (XAFZ f141-227),
   the YouTube result card with the real title (XAFZ f930-1025, XAJm f360), the printed page with
   red pen (XAIh), a real ChatGPT/agent transcript (XAKr, XAGA), the Ratepayer Protection Pledge
   document (XANQ, 7.2 s on black). Hold 2-7 s, real-screen reels 10-35 s.
3. **TEACHING**: a drawn object that develops with the narration. The Finder window filling
   (XAFZ), the timeline building bar by bar with a travelling playhead, the collage assembling
   piece by piece in speech order (XAFZ f677-825, nine pieces in 2.5 s), a chat window typing
   "Apply the skill" while she says "apply the style", badge cards fading in with a connector
   line drawing between them (XANQ), the keyword demo where "bigger" grows and "animated" slides
   (XAJm). One new element every 0.1-0.5 s, then a static hold.
4. **STRUCTURE**: a chapter label on clear footage ("EDITING STYLE 01 / Quiet Editorial UI" typed
   on, "Paper Collage" taped label), a persistent 3x3 checklist whose active cell recolours per
   topic with a heading and an underline wipe (XAL1, 9 swaps), "Step N:" story captions (XAMz).
5. **PROCESS**: the real workflow shown as itself: HyperFrames, Finder, the ChatGPT compose box
   filling by dictation at 1 glyph per frame, the agent's "Worked for 16m 11s", QuickTime (XAKr);
   a hard top/bottom split of her over the cropped app.

Not seen: memes, archival photos, giant numerals, stock b-roll, emoji stickers, arrows drawn
over her, decorative particles.

## Families (geometry at 1080x1920, animation in frames at 30 fps)

### Light glass panel (XAFZ finder / timeline / install; the "clean, translucent, modern editorial" she dictates)
- Box 0.11-0.89W (0.78W), top 0.135H, height 0.22-0.25H; the Finder wider at 0.045-0.905W.
  Radius 30-34 px. Surface = white at ~12 % over the footage + backdrop blur (measured #abb5ad
  over #9da49d), 1 px white hairline at ~50 %, wide soft shadow.
- Header row: tracked uppercase label left (semibold grotesque, cap 22-24 px, +0.12-0.2 em,
  charcoal #3a3d3a) and a right-aligned value ("00:00:12", "LOCAL WORKSPACE"); a thin rule.
- Children: macOS-blue folders #46afde->#8fd0ee (0.15W) with labels under them; pastel rounded
  bars (radius ~10 px): blue #b3d7ea, peach #f0b49b, lavender #cfc0f0, mint #bfe3d3, mustard
  #eccf8f; a white playhead with a triangle head; a progress line that grows.
- Entrance: 4-frame opacity fade in place (f256-259), no travel. Children: 2-frame fade each,
  every 3-4 frames. Exit: hard cut, or a 2-frame fade (install f1084-85), or a 7-frame morph
  into the next object (timeline -> SKILL file f366-372).
- Footage: clear under the timeline/install, blurred (sigma 12, x0.75) under the Finder.

### Dark glass (XAFZ chat)
- Same box (0.11-0.89W, 0.135-0.62H), dark translucent surface, local backdrop blur (her face
  softens under it, the bottom of the frame stays sharp), label "AI ASSISTANT · NEW CHAT".
- Bubbles #4d5557-#626866, radius ~20 px, right bubble 0.594-0.844W, left 0.150-0.466W, each
  typed at exactly 1 glyph per frame; the left bubble's background slides in over 4 frames
  first. Entrance 4-frame fade with the blur rising in step. Exit hard.

### Off-white product card (XAFZ app card / editorial card; XAJm browser-chat cards)
- Tall app card 0.199-0.801W x 0.135-0.738H, radius ~24 px, #eaf0ee, hard cut in, a word fading
  in over 5 frames, a cursor gliding 12 frames to a pill, hard cut out.
- Editorial card 0.083-0.917W x 0.323-0.586H, radius ~28 px, #f0f7ef with a #dbe1e1 side panel;
  hard cut in with the blur; headline "This is the" 3-frame fade, "quiet." italic serif 4-frame
  fade, side panel slides open from its right edge in 5 frames, copy 4-frame fade, headline
  swaps in 5 frames at 18.4 s; hard cut out with the un-blur. A chapter title (eyebrow 4-frame
  fade, serif title typed at 1.5 glyphs/frame, 1 px rule) sits above it on the wall from 1.6 s
  before the card.
- XAJm browser/chat cards 0.08-0.92W x 0.16-0.35H, radius ~20 px, near-white #f7f9f8, "NEW
  MESSAGE" chrome, 4-frame fade in and out, on clear footage.

### Paper collage (XAFZ)
- Label: cream #e9dec0 card 0.113-0.753W x 0.145-0.282H, near-square corners, rotated ~-2°,
  wide soft shadow, translucent tape strip; typewriter eyebrow + black brush "Paper Collage".
  Ghost-then-settle over 5 frames on clear footage, holds 1.3 s alone.
- Board: 0.083-0.917W x 0.323-0.586H, cream with faint rules, radius ~26 px, appears with the
  blur (2-frame fade) 80-100 px under the label. Nine pieces in speech order, 3-5 frames each,
  100-300 ms apart: typed tag with cursor (1 glyph/frame), torn royal-blue #2d54bd paper
  sliding up-left in 4 frames, brick-red block popping in 4, white strip in 5, "TACTILE" brush
  3-4, "PAPER COLLAGE" blue 3, olive/yellow tabs, black #22221a status strip, stamp/URL states.
  Hard cut out at 27.5 s.

### Real media in a rounded frame (XAFZ clips; XAJm example reel; XAFZ/XAJm YouTube cards)
- Vertical clip window 0.20-0.80W x 0.12-0.62H, radius ~30 px, no border, over blurred footage
  (XAFZ) or clear (XAJm 0.17-0.83W x 0.22-0.85H). Hard cut in and out; the motion is the clip's.
- YouTube result: white/glass double frame 0.098-0.902W x 0.258-0.584H, radius ~30 px, the real
  thumbnail + real title + duration badge, a white heading above with a short cyan underline;
  3-frame pop from 0.85 scale, heading 4-frame fade, 3-frame fade+shrink out. XAJm's is
  0.245-0.755W x 0.156-0.354H, radius 16, a 1-frame pop.

### Small file / folder objects on clear footage (XAFZ SKILL.md; XAJm folder row + prompt bar)
- SKILL.md glass file 0.361-0.630W x 0.135-0.246H, folded corner, "SKILL" 40 px; morphs in over
  7 frames, hard out. XAJm folder icons 0.02-0.55W x 0.30-0.43H, 3-frame fade; prompt bar
  0.14-0.86W x 0.26-0.35H, radius 14, 5-frame fade, text typed 1 glyph/frame, "Edit ready" badge
  pops in 1-2 frames.

### Badge cards, one accent (XANQ)
- Near-black pills #161d15-#1e231d, radius ~16-20 px, bold white headline 24-28 px, grey subtext
  14-16 px, lime #c9ff35 line icons; a label pill with 1-3 sibling sub-cards under/beside it.
- Sub-cards: 8-frame opacity fade (f194-202), siblings a couple of frames apart; a lime connector
  line draws itself over ~26 frames; the assembly then holds 1.6-9.8 s. Real logo chips (Amazon,
  Google, Meta, X, Oracle on white) for "seven companies". A document takeover grows from a small
  centred card to page-filling in 7-8 frames on solid black, 7.2 s. Exits: hard cuts, all of them.

### Dark serif cards with one lime word (XAOU)
- Near-black rounded cards, white serif headings (the hook title's face), a giant lime stat
  ("50+") with small grey subtext, a photo avatar on a blue tile (Abdullah testimonial,
  f489-659: 3-frame fade in, hard cut out). "01 / Think Orchestration" and "02 / Do Execution"
  cards build as a strict chain: text 5 frames, icon 4, a lime arrow grows left to right in 5,
  the second card's text 2 frames only once the arrow lands (f712-738); hard cut out at f842.
- A real VS-Code-style window with her finger scrolling the file tree (f276-377, 4-frame
  fade+focus in, hard out), then a drawn IDE window whose title and body update with the
  narration (f843-1306, hard out).
- "Thinking + doing": a cream circle with a lime outline fades in over 5 frames on the frame
  the IDE window leaves (f1307), then tears in two over 17 frames when she says "separates"
  (crack 2 f, right half flips dark + jagged tear 4 f, halves separate 7 f, "Thinking" /
  "Doing" labels 4 f), f1423-1440.
- Closing system "Permanent audit trail": a tasks window with green checks, two lime-outlined
  tags either side of her face, a cream serif banner with a lime underline; on screen to the
  last frame.

### Persistent grid overlay (XAL1, the agent-made reel)
- 3x3 cream pills #f7f7ec, radius ~14 px, block 0.082-0.917W x 0.125-0.233H, a 40 px "Q#" chip
  alternating lime #def753 / teal #55bca7; a heading under it "Q0  Setup type" 38 px white with a
  coloured underline.
- Build: pills fade in 2 frames each, 2-4 frames apart, in reading order, done by f24 while the
  title is still up. Topic swap grammar (9 times): 1-frame pre-dim, hard colour cut on the grid,
  heading fades up over 2-3 frames, underline wipes left to right in 4-5 frames. Never exits.

### Sliding posters (XAH7)
- Real poster images 0.0-0.85W x 0.06-0.75H (left-anchored), slide in from the right edge in
  5-8 frames, slide out the same way; a vertical hue scan-band (purple -> teal -> green) sweeps
  the poster to dramatise "it separates everything"; a 3-card flow diagram (white cards, one
  purple arrow, a layer-stack build of ~12 frames); the Canva wordmark 3-frame fade+scale-in
  then a slow drift zoom, 60 %W.

### Typographic keyword demo (XAJm)
- Captions move top-left; each keyword performs itself in the centre: "subtitles" hue-cycles
  mint->cyan->sky over ~20 frames, "bigger" scales up while solidifying over ~14, "Translucent"
  holds at partial opacity, "animated" slides across in ~24, "timed to what's being said"
  reveals word by word, "SKILL" in a bronze->gold gradient at ~90-100 px caps. Entrances 6-18
  frames (grow + fade).

### Real-screen documentary (XAKr, XAGA, XAIh, XAMz, XAH7)
- Filmed MacBook with bezel and reflections, or a screen recording, cut hard between setups;
  her over a cropped app window in a top/bottom split (seam = the app's title bar); the app's
  own animations (icon bounce + genie open ~28 frames, scroll ease-out, click ripple ~7 frames,
  dictation at 1 glyph/frame) are the only motion. The only editor fades: one 6-frame title fade
  in XAGA, one 4-frame card fade in XAKr, a whip-pan that is the camera's.

## Timing laws (measured)

- Entry ON the word, lag 0-250 ms in the card reels ("all" 1.74 s -> Finder f54 1.80 s;
  "install" 34.82 -> f1049 34.97; "1st" 9.42 -> XAJm card f284 9.47). Looser in XAL1's topic
  swaps (0-0.6 s) and XAIh's inner headline cards (thematic dividers, ~0.5 s early).
- Holds: naming 0.5-2 s, teaching cards 3-5 s, proof 2-7 s, real screens 4-35 s.
- Gaps: 0.3-3.4 s of clear footage between objects in the card reels; XAL1 never clears.
- Event rate: one per 2.4-3.1 s (card reels), one per 6-8 s (screen reels).
- One object at a time; two only as label-above-board or title-plus-grid.
- Inside an object, one change per 0.1-0.5 s in speech order, then still.

## Style laws

- The cut is never animated. Cards hard-cut or fade in place (3-5 frames); they never slide in
  from off-screen (XAH7's posters are the one exception), never spring, never overshoot.
- Blur is one reel's choice, not the house style: whole-frame Gaussian sigma 12 px + brightness
  0.75, hard switch, only under proof cards, never under labels or the timeline.
- Rounded corners everywhere on drawn objects (14-34 px), near-square only on paper.
- Drawn UI is generic and plausible (macOS folders, chat bubbles, a timeline), never a fake
  screenshot of a named product; real products appear as real captures or real marks.
- One accent per reel; everything else white, off-white, charcoal, near-black, cream.
- Tracked uppercase micro-labels on every panel; a serif only for chapter/editorial moments.
- Captions never move for a card; a card's bottom stops above them (0.36-0.62H, one at 0.74H).
- The closing 1-2 s is captions only or a reaction beat; no CTA card.

## Real vs drawn, per reel

| reel | real | drawn by the edit |
|---|---|---|
| XAFZ | 2 clips, YouTube thumbnail, webcam frame | Finder, app card, timeline, SKILL file, chapter titles, editorial card, collage, install, chat |
| XAJm | example reel, full-screen montage, YouTube thumb | chat cards, folders, prompt bar, keyword demo |
| XANQ | 5 logo chips, the document body | badge cards, connector lines, document chrome, sticky note |
| XAL1 | her single take | title, grid, headings, captions, CTA block |
| XAKr | everything on screen | title, caption box |
| XAGA | screen recording, webcam, IG repost chrome | title, captions, one 6-frame fade |
| XAIh | laptop playing its own presentation, printed page, second laptop | outer title + captions only |
| XAMz | 5 locations, iMessage, GitHub, ChatGPT app, a monitor | outline captions only |
| XAH7 | posters, touchscreen close-up, Canva UI, Canva wordmark | slide motion, scan band, flow diagram |
| XAOU | file-tree scroll with her finger, Abdullah's photo | serif title, dark cards, chained build, IDE window, tear-split circle, audit-trail system |

## What this means for our copy

Build the families as Remotion cards with the numbers above (glass panel, dark glass chat,
off-white card, paper collage, real-media frame, badge pill, grid), keep their captions grammar
where it already matches (hard cut on word onset, white, no animation), add the title layer
from `creator-format-2-hook.md`, and use the motion table literally: 4-frame fades, 3-frame pops,
1 glyph per frame, siblings every 3-4 frames, hard cuts for everything else. The blur is an
opt-in per event (`blur(12px) brightness(0.75)`, hard switch), not a style default.

## Second pass: her best reels by plays (2026-09-04)

The ten reels above are her most recent, not her best. Ranked by plays, her top reels are
real-media reels (a locked split with a 34 s screen recording, a filmed laptop playing her
export, tweets and app takeovers on clear footage, a captured chart card) with hard cuts only,
no blur and no card chrome. The measured grammar and the rule (real wherever an artifact exists,
drawn only for a concept with none) are in `.claude/skills/creator-format-2-style/references/real-media.md`;
per-reel evidence in `library/styles/refs/{XAP5rDEOyPp,XAQ75KUQwfK,XARUX8oxHhi,XASIaysTioY,XATe2ejLSeB,XAU1C3Z1UdJ}/real-media.md`.
