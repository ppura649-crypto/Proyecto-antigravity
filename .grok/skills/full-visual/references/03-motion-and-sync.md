# Motion and sync

## Goal

Every change on screen belongs to a word, arrives by one of a dozen verbs, and is over in a fraction of a second. The
frame never sits still and never goes bare, and nothing moves without a reason the sentence gives it.

## Reasoning

The ear registers a word at its onset; the eye registers a build at its completion. So a single event lands on its
word, and a build is started early enough to finish on it. That one distinction is most of what reads as "perfectly
synced". The rest is speed: objects cross 300 px in a fifth of a second, which only reads because blur follows the
velocity, and the caption ticks four times a second under all of it, so a stage that holds for a second still feels
alive. There is no camera because every object already moves inside itself; a camera on top would make 32 px type
unreadable. There are no cuts because continuity is the argument: the thing on screen at second 40 is the thing that
arrived at second 6.

## Sync

- **A single event lands on its word**, within a frame or two: `at={cue("DDoS")}`. When the word is the event (a colour
  flip, a lock opening, "swap"), one frame.
- **A build ends on its word**: `at={endsOn("300", 17)}` starts a 17-frame build so its last piece lands as "300" is
  said. Grids, lists, typed lines, counters.
- **A counter finishes before the sentence does**, so the last words are spoken over a still number.
- **Colour flips follow the data**, not the voice: the gauge turns red on the frame it crosses the threshold.
- **The key-word box follows its word** by about 5 frames: the number, then the frame around it.
- The caption word starts about 40 ms before the voice so it is sharp on the syllable (the engine does this).
- A list the sentence does not spell out (six apps for "almost any kind of app") runs on a steady beat instead of words.
- Density: 3 to 6 changes a second counting caption words, 1 to 2 on the stage alone. The only rest inside an item is
  the hold on its payoff number, 1.0 to 1.5 s. `check.py render` fails a still stretch over 1.2 s.

## The kit (`src/engine/moves.ts`, `Motion.tsx`), durations in 60 fps frames

| Verb | Default | For |
|---|---|---|
| `blurIn` | 7 f, blur 12 px to 0, in place | anything that does not travel; the default arrival |
| `pop` | 8 f, scale up with a small overshoot | badges, chips, pills, avatars, marks |
| `<Travel>` | in 12 f ease-out over 260 px, out 9 f ease-in, blur along the axis of travel | cards, panels, anything crossing the frame; the invoice dropping from the top |
| `blurOut` | 7 f | a thing leaving in place |
| `typeOn` | 36 ms a character, with a caret | names, prompts, commands, form fields, documents |
| `countTo` (+ `jitter`) | hard ease-out; exact on its last frame; jitter keeps a live number twitching | every number |
| `stagger` | 4, 6, 8 or 12 f between siblings, one rhythm per group; grids on a diagonal | rows, tiles, pills |
| `mix` | 3 to 5 f | recolour in place: the state change |
| `draw` | 14 f along a path | arcs, routes, outlines, strikes |
| `<Cursor>` | eased segments on a slight arc, rests before a click; the click is a one-frame state change on the target | every performed action |
| handover (engine) | `rise`: the scene blurs, lifts 140 px and fades in 9 f while the ground cross-fades linearly over 6 f; `scroll`: old card out through the top, new one up from below, 13 f | between scenes, in the silence |

The next scene is mounted 6 frames before `scene.from`: start its first entrance at `scene.from - 6` and the two
scenes overlap. One emotional move per reel at most (a stamp slamming, tiles falling, a tag swinging), on the biggest
number or the turn. No springs to tune, no camera, no parallax, no zoom.

### What good looks like

- Reading a 60 fps burst around any event (sixty stills a second over the window, `node render.mjs <slug> --stills` at 1/60 s steps, read side by side): the event
  starts or ends on the frame the caption word appears, blur is visible only while the thing is moving, nothing pops
  from nothing.
- A number rolls, lands on the frame its word arrives, and the box draws around the word two beats later.
- In a handover burst there is no frame of bare ground. `check.py render` counts them.
- The stage and the caption may move on the same frame; the bands keep them apart. Only the biggest beats gain from two
  to four frames between word and object.

### Traps

- Timing anything in typed seconds. A cue is a word; if the word changes, the picture follows.
- Starting a build on its word: it finishes after the sentence has moved on.
- The same transition for every scene. When the script turns, the handover can be the turn (a swap, the ground
  flipping); pick it for the sentence.
- An instant state change on the beat that matters (a toggle flipping in 2 frames is invisible). Give it 6 to 8.
- A counter left easing towards its target: it must read the exact figure on the word.
- A move too fast to read (eight cards in 0.6 s, a calendar rewinding in 0.9 s) or a hold with nothing under it
  (1.5 s a quarter of the way in is where people leave).
- Payoff numbers or the pill's digits under Instagram's interface. Check with `--guides`.
- Checking motion on a contact sheet. Stills are read at full size, motion in 60 fps bursts.
