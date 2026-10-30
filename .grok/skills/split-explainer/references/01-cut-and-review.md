# The cut: decide the delivery, preserve the words, verify the result

## Goal

A short-form cut where every kept clip starts the instant they speak and ends when the word
actually ends. The agent selects, cleans, verifies and locks it, then continues to the visual
plan in the same run. When the buyer requests cut review, the review surface behaves like the
editors they know (CapCut), and their saved cut is the picture lock for every layer after it.

The complete-video mode makes the agent the reviewer and continues through export. A saved buyer
edit remains authoritative when they explicitly choose to review the cut. Before either cut is
locked, follow `01c-cleanup.md`: timing checks cannot establish which audible moments belong in
the argument. Review the whole kept passage, apply deliberate source edits, then verify the result.

## Reasoning

ASR word bounds are slack: Apple Speech stamps starts 150-250 ms early (median +192 ms on an
independent corpus) and ends up to 350 ms late, so fixed pads around words are dead air, and
dead air is what makes short-form feel weak ("it should be more quick for instagram it's short
form content, but we need to hear exactly at the exact moment when i speak"). **Every cut point
is decided by the energy curve (`levels.txt`, one dB per ms), never by the transcript.**

The gate that reads that curve must be **relative to the room, never an absolute dBFS number**.
The same speech gate lands at wildly different levels across files (-39.4 vs -17.5 dB on one
measured pair; -49.7 vs -51.3 dB on another two takes). `cut_variants.py` measures room tone as
the p75 of the levels in the gaps between kept takes and gates at room + 8 dB. `tighten_cuts.py`
hard-codes -45 dBFS and is kept only to reproduce one reel/one reel.

Take selection and micro-pauses are taste, and taste is their. The scripts propose (last complete
take per retake group wins, fragments and mic tests dropped) and the editor lets them overrule
in one gesture.

## The pacing dial

`cut_variants.py` holds four presets. All four derive in/out from the measured onset and end, so
a preset can only change how much AIR surrounds a word, never the word. **`d-hard` is their pick**
(chosen from all four side by side: "the hard is the best").

| | lead | tail | pause cut over | keep head/tail |
|---|---|---|---|---|
| a-loose | 110 | 260 | never | - |
| b-balanced | 45 | 130 | 240 ms | 55 / 70 |
| c-tight | 25 | 75 | 170 ms | 35 / 45 |
| **d-hard** | **12** | **40** | **120 ms** | **20 / 25** |

Measured on one video (silence before the first audible phoneme, median): a-loose 122 ms,
b-balanced 57, c-tight 37, **d-hard 22**. Zero clips over 400 ms in any preset. b-balanced is
roughly what one reel was, so d-hard is a step tighter than the old reference.

Use their saved pacing choice; otherwise start with d-hard and judge it on this recording's
words and audio. Comparing presets is the agent's work in self mode. Render alternatives for
the buyer only when they request that choice, then preserve their pick for later videos.

## Priority

1. Their saved `cuts.json` over any script default. Never re-run a stage that rewrites it.
2. Hearing the whole word over tightness. When in doubt at a boundary, extend into the source.
3. Tightness over pads. Cut on energy, relative to this room's tone, never on ASR bounds.
4. Editor semantics match CapCut: split makes two cards, numbering is positional, no hidden
   zones inside a card.

## What good looks like

- Take selection one reel: 16 of 69 clips kept, hook = the only complete take of six attempts,
  CTA = the last full delivery. Three judgment calls flagged for them instead of hidden.
- 20 of 39 and 20 of 44 clips kept against the written script. Two
  calls flagged rather than hidden: the 1514 hook is the FIRST take, because both later ones
  open "Okay, so"; and 1510's "just add, use subagents" is take 1, because take 2 loses the two
  words the video is about.
- Mid-sentence pauses found by an adaptive rule (below the room gate, sustained past the
  preset's threshold) and converted into real split cards, each with its own words as label.
- Review page: cards with waveforms under the video, drag edges (free inward, clamped at the
  neighbor outward, 200 ms minimum), click = seek with the playhead following at 1 px, `C`
  splits the card under the playhead into two, `K`/Delete drops to a restorable drawer,
  shortcuts printed in the header, no-cache headers, save conflict guard from a stale tab.

## Verifying a cut before showing it

Five mechanical checks, all on the rendered master, all before they ever sees the file:
`references/01b-verifying-a-cut.md`. Never hand them a cut that has not passed them.

The eyes are read first and off the original: `gaze_tile.py --from-source` pulls each clip's last
frames straight from the source file, so the nudges go into `cuts.json` before `render_spine.py`
runs, and the spine is rendered once instead of twice.

## Traps

The cut itself:

- Fixed 250 ms pads around ASR words: dead air. Replaced by energy-verified points.
- An absolute dBFS gate. It cannot be right on two files at once. Measure the room.
- A one-stage gate at room + 8 dB is the loose version of the right answer; the correct shape
  is two-stage (find confidently-voiced audio, then walk backwards through a lower band to
  catch a fricative's ramp) with a per-phoneme-class lead (plosive ~+17 ms, default ~+59,
  fricative ~+130). Not built here; the one-stage gate measured fine on a 35 dB SNR room and
  will run loose on a noisy one.
- An unbounded onset/end search. Consecutive sentences can sit 60 ms apart, and the search then
  locks onto the NEXT clip's speech and reports an end far past the real one (clips
  8/9, "your next prompt." / "Literally just add,"). Bound both windows by the neighbour's ASR
  span, and cut a contiguous pair at the quietest ms between them.
- Trusting an ASR word overlap to prove a pause contains speech. Every one of the ten inner
  cuts on one video/1514 overlapped a stamped word (`and`, `but`, `use`, `I've`) and every one
  was a clean pause: the level decayed to room tone through the cut and jumped back 60 ms
  after. Read the curve, not the word list.
- Deriving clip text by which clip holds a word's MIDPOINT. ASR starts are early, so a clip's
  first word is regularly dropped from its own label (`Because`, `A`, `It`). Assign a word to
  the clip that holds the largest share of it.
- Denoiser told the floor was -42 dBFS when the real floor was -65: it ate quiet speech tails
  (watery artifacts, rejected as bad audio on the first one reel cut). Measure the floor first;
  the chain is `highpass=f=70,afftdn=nr=8:nf=-58`.
- `loudnorm ... linear=true` alone overshoots its own TP target and lands at 0.0 dBFS. Follow it
  with `alimiter=limit=0.841`.
- A clip ending on the ASR word end: five endings clipped on one video. Extend from the levels.
- `ffmpeg -frames:v N` with `%d` numbers files from **1**. Reading `_0.._N-1` silently checks
  the second-to-last frame, which is exactly the frame a gaze check must not look at.

- Bounding the end search by the next KEPT clip only. A dropped retake fragment 60 ms after a
  kept sentence is still speech, and the search locks onto it: one reel "business failures."
  ran 500 ms into "The evaluator must rep…" and check 1 failed at -9 dB. The neighbour that
  bounds the search is the nearest clip in SOURCE time, kept or dropped.
- Millisecond segment edges in the spine. `trim` keeps whole frames, `atrim` keeps exact
  samples, and `concat` pads the difference: on one video (35 segments) the audio came out
  183 ms longer than the video and the map, the drift growing seam by seam, so every caption
  and every lip would have landed early by the end. Every edge snaps to a frame now and
  `spine-map.json` carries frame numbers; audio and video agree to 2 ms.
- A hard seam on a word's decay (-45 dB) against the next clip's room tone (-63 dB): a step,
  and a step is a click (check 3, one reel clip 75). 3 ms fades on every segment edge.
- A sample-peak limiter for a true-peak target: 0.80 sample ceiling still read -0.7 dBTP on
  one reel. The limiter runs 4x oversampled now.
- The hook clip's FIRST frame mid-blink. The gaze tile
  reads last frames only; frame 0 of the reel is the most-seen frame there is. Look at the
  source frames around the hook's in-point and start it where the eyes are open, even at the
  cost of ~160 ms of lead (`gaze-nudges.json` `inNudges`).
- A look-down that starts ~250 ms INSIDE the last word (chip 6/24/26, evals 49): no frame to
  cut to without shaving the word. Word intact wins; say so and let the retake fix it.

The review tool (UI feedback, shapes `review/app.js`, not the reel):

- Red "inner cut" zones drawn inside a card ("not red stuff inside i hate it"). A cut is two
  cards, CapCut semantics.
- Edge drag clamped at ASR word bounds ("i can't delete some of the space"). Trimming into ASR
  regions is allowed; the only limits are the neighbor and a 200 ms minimum.
- Playhead on the 4 Hz `timeupdate` event and 18 px off because card borders were left out of
  the width math. It follows the click exactly and animates at 60 fps.
- Cached `app.js` showing an old UI after a fix. The server sends `Cache-Control: no-store`.
- Internal ids shown as card numbers: numbers shown are positions in the timeline.
