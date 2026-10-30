# The hook: one artifact, one gate, locked

Stage 2H. Runs after the captions are built on the whole video and before any visual is
planned. It owns the first ~10 seconds as a thing in its own right: the retention title, the
spoken hook stack, the first object on screen, the punch.

## Goal

The first seconds of every reel are the cleanest, most deliberate thing in it, approved as
their own deliverable, and then untouchable. Whatever a later stage does, frame 0 and the punch
frame look exactly the way the creator approved them.

## Reasoning

Skip rate beats everything else on these accounts, and the creator has said it on every video: "The
hook is the most important", "The first 10 seconds are the most important"
"the hook should be the most important step. Like the cleanest and very well
done".

Until now the hook had no owner. The title lived in `caption-plan.json` AND as page 0 of
`captions.json`; the stack anchor lived in a style file; the first card lived in `visuals.json`;
the ramp in `format.json`. Four files, three stages, and every hook regression on record was
collateral from a change made somewhere else, never a decision the creator reversed:

- a stage-3 rebuild rewrote the title and added a word reveal, so frame 0
  read "2 WORDS TURN 1 CLAUDE / INTO A". "The hook was already good, but now it changed because
  an AI did a poor job."
- the Creator Format 2 work had replaced `stackTopFrac` with a literal
  `0.555 * height`; the stack landed across their mouth on the next video.
- a font change (Michroma) reflowed the stack, glued the small lines.
- shipped with `reveal: "words"`, the exact defect deleted from reference edit B
  the same day, because captions were already approved and stage 3 may not touch them.

The fix is structural: the hook becomes one file, `hook.json`, that the creator approves; every renderer
of the first seconds is checked against it; and the file is locked.

The hooks that were accepted first time (reference edit A pass 3: "now do that for mine ... Very nice
captions, well done"; "The hook (first 10 seconds are perfect)") were built from a frame-by-frame
measurement of the reference creator, complete at frame 0 with no reveal, two short lines with
one accent payload, geometry measured on that master, the punch alone on screen, and one object
up inside 0.5 s that was not the title.

## The invariants (their words, across four videos)

1. **The title is short and complete at frame 0.** "max 2 sentence no wrapping, make it
   shorter. and smaller size pls"; "the hook at the beginning should be
   higher and smaller font size. two sentences max"; "The hook sentence
   should be much shorter as well". Two lines, no wrap at the pack's
   title size, every word on frame 0 (a letter-by-letter reveal belongs to packs whose measured
   reference does it, Creator Format 2's chapter titles, never to the retention title by default).
2. **It owns the screen, then leaves.** "THE HOOK SHOULD BE IN THE MIDDLE OF THE SCREEN BIGGER
   PLSSSSS with no overlay, then disappear". Mid-screen above the head, no card
   behind it, gone by ~2-2.5 s. A small persistent line in the top strip reads as a watermark
   and was rejected the same day.
3. **A retention sentence exists on every video.** "FOR ALL VIDEOS NOW, WE SHOULD ADD A SMALL
   TEXT IN SCREEN HOOK THAT IS ULTRA ENGAGING ... THAT MAKES PEOPLE WANNA STAY";
   "ONE HARD RULE I SEE: during the first sentence of your hook, have a caption or something on
   top ... they all do it". Same voice as a reel hook: concrete, a digit when there
   is one, no closing period unless it is a sentence, no spoken-to-camera phrasing. It names
   what the video PAYS OFF, not what the creator says.
4. **The stack is their words, placed from the format, readable.** Grammar in
   `formats/creator-format-1-hook.md` (Creator Format 1 pack) or the pack's own hook file. Every hero holds ≥ 600 ms
   ("The hook we can't see the SKILLS"). The anchor is read from the format (`stackTopFrac`),
   never a literal in code.
5. **The punch gets the screen alone.** The card cuts out on the frame the punch stack lands
   (reference edit A: WRONG. at 4.0 s).
6. **Something is up inside 0.5 s** that is not the title (reference edit A: the skill folders at
   0.36 s on "still"). The first object is the first row of the visual plan and is named in
   `hook.json` so a later plan cannot swap it silently.
7. **No speed-up, ever.** "don't sped up pls. Don't do that". Every
   video plays at 1x from frame 0. The 1.1x hook ramp the creator asked for later is reverted;
   `hook_build.py check` refuses a format that carries a ramp and `deliver.mjs` never applies one.
8. **Approved means locked.** "IT SHOULD NOT CHANGE THE CAPTIONS WE DID OR THE HOOK WE JUST DID,
   THIS IS ALREADY AMAZING!".

## The artifact: `projects/<id>/hook.json`

Built by `scripts/hook_build.py build <project>` from `caption-plan.json` (title, stack phases),
`format.json` (title top and size, stack anchor), `visuals.json` (the first non-CTA event)
and `geometry.json` (head top, chin):

```json
{
  "title":  { "lines": ["2 WORDS TURN 1 CLAUDE", "INTO A TEAM OF 10."], "showMs": 0, "clearMs": 2100,
              "reveal": "none", "topFrac": 0.235, "fontPx": 52 },
  "stack":  { "clip": 2, "phases": [ ...the caption-plan hook phases... ], "stackTopFrac": 0.655 },
  "firstObject": { "id": "tree", "kind": "fanout", "fromMs": 2166, "toMs": 5100 },
  "geometry": { "headTopFrac": 0.359, "chinFrac": 0.619 }
}
```

`scripts/hook_build.py check <project>` is the mechanical half of the gate and runs inside
`render.mjs` and `deliver.mjs`: ≤ 2 lines; no line wider than the frame at `fontPx`; reveal none;
clear by ≤ 3 s; title bottom clear of the measured head top; `captions.json` page 0 and its
`style.titleTopFrac` / `style.stackTopFrac` equal to `hook.json`; the first visual event still
the approved one and inside 2.5 s; no speed ramp in the format.

## The gate

1. Build `hook.json`, run `check`, fix until it passes.
2. Render 0 to 4 s (`--range=0:120`) and three stills: frame 0, the last frame the title is up,
   the punch frame. Read them at phone width yourself first (glued lines, a hero clipped, the
   title in their hair, a card under the punch).
3. Show them the copy AS TEXT next to the stills: the two title lines and the stack lines. The creator
   edits words faster than pixels.
4. Their OK: `lock_layer.py lock <project> hook "<their words>"` and `lock ... captions`. From here
   `render.mjs` and `deliver.mjs` refuse any change to either file that is not an explicit
   `unlock` with their words.

## What good looks like

reference edit B (the guest, flat pack): title `2 WORDS TURN 1 CLAUDE / INTO A TEAM OF 10.` at 52 px,
top 0.235H over a head at 0.385H, complete at frame 0, gone at 2.1 s; stack DID YOU KNOW / THAT
YOU CAN TELL / CLAUDE then JUST ADDING / 2 WORDS / TO YOUR PROMPT?; the agent tree up at 2.17 s
on "team"; ramp 1.1x to 5.18 s (the ramp is history since then). Locked as v4.

reference edit A (the creator, Creator Format 1 pack): stack YOU ARE STILL / IMPROVING YOUR / SKILLS with SKILLS the
hero; three skill folders at 0.36 s; ARE DOING IT / WRONG. as its own stack at 4.0 s with the
card cutting out on that frame; ramp 1.1x to 4.785 s. "The hook (first 10 seconds are perfect)".

## Traps

- A title that passed the width check and rendered past both frame edges: "OPENAI'S CHIP BEATS
  BLACKWELL", 29 chars at 52 px, edit-c-chip. Zen Dots is ~0.80 em per cap and
  the check assumed 0.62. `hook_build.py` now uses a per-family factor: about 23 characters per
  line at 52 px in Zen Dots, 34 in Avenir. Write the title inside that.
- Frame 0 of the hook clip mid-blink (two of the three reference edit C hooks). The gaze tile reads
  the LAST frames; the first frame of the reel needs its own look (`01-cut-and-review.md`).
- A word reveal on the title. Frame 0, the most-seen frame of the reel, carried half a sentence.
- A third title line added while doing something else ("ALMOST NOBODY USES THEM"): the creator deleted it.
- A persistent small line in the top strip (`screenHook`): a watermark, not a hook.
- The title at 68 px, 0.335H: "higher and smaller font size".
- A hero that cleared 60 ms after it popped: "we can't see the SKILLS".
- A stack anchored by a literal in code instead of the format: across their mouth.
- A stack spread by a literal in code: small lines spread across 0.74W while the measured Creator Format 1
  value was ~0.52W (`creator-format-1-hook.md`). "IS and THE are way too far apart". `stackSpreadFrac` in the format now; a line can opt out with `spread: false`.
- The first-10s preview changing the captions under it: forbidden by the lock.
- Reusing a previous video's title geometry for the same speaker: reference edit B sits 7% higher in the
  frame than cut-tight. `geometry.json` or nothing.
- A title look borrowed from another creator's pack. The look of the title (plain white words,
  or a plate behind them) belongs to the pack, and the Creator Format 1 pack is plain white words with the
  caption shadow. A guest's preference for a plate stays in the guest's pack; it once reached a
  Creator Format 1 reel through this file and was rejected on sight.
- `reveal: "words"` / `revealMs: 900` left on a title that everything else says is complete at
  frame 0: reference edit D shipped three versions where frame 0 read "ASK" and 0.5 s read "ASK THIS
  BEFORE / YOU". The timeline flagged it as open later and it still shipped, because
  nothing refused it. `reveal` on a title page is `none` unless a pack says otherwise.
