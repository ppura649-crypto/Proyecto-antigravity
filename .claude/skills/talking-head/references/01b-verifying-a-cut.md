# Verifying a cut before the creator sees it

## Goal

Prove a cut is right by measurement, not by watching it once and hoping. The creator is not the diff
tool. Every check below runs on the rendered master, produces a number or a picture, and has a
pass line, so "the cut is clean" is a claim with evidence behind it.

## Reasoning

The two defects that reach them are the ones a person cannot hear on one pass: a word ending
shaved by 40 ms, and a splice click. Both are trivial to measure and invisible to a casual
listen. The third, their eyes leaving the lens on the last frame of a clip, is visible but only
if you look at the right frame, and the right frame is the LAST one (see the `%d` trap below).

## The five checks

Six checks, all mechanical, all on the rendered master (check 6 is listed before gaze because it runs in the script):

1. **No word touched.** For every boundary, the audio that was DROPPED next to it must be under
   -32 dB. Compare against dropped audio only, never against a neighbouring kept clip, or every
   pair of consecutive sentences reads as a false positive. Measure the LAST clip against this
   room's floor instead of the fixed threshold: a word's final voiced decay sits 15-25 dB above
   room tone and can still be under -32 dB, and on the last clip there is no following speech
   to cover it. The tell is a RUN, not a peak: 150+ ms of dropped audio immediately after a boundary
   sitting well above the floor is a truncated word, whatever its absolute dB.
2. **Dead air.** Median silence before the first audible phoneme (room + 15 dB), per clip. Under
   ~60 ms, and zero clips over 400 ms.
3. **No clicks.** Max sample-to-sample delta at each splice against the file's own p99.9. Under
   half of it is inaudible.
4. **Loudness.** -14 LUFS integrated, true peak under -1 dB, zero clipped samples.
6. **Last word.** The last clip's out-point sits at least 150 ms after the transcript end of
   its last word (`verify_cut.py` check 6). Mid-video a shaved tail is masked by the next
   sentence; on the CTA nothing follows, and that line is the ask of the reel. Three videos
   shipped with it shaved (reference edit A, reference edit B, reference edit E) before this was a number.
5. **Gaze.** The last 3 frames of every clip, cropped to the eye band and tiled. If their eyes
   drop or leave the lens on the last frame, pull the out-point in. Do this on the LOOSEST
   preset in play; tighter tails are strictly inside a window already cleared.

## Priority

1. Word intact over everything. A shaved ending is the one defect the creator has caught by ear.
2. Gaze on the last frame. The creator asked for this by name.
3. Clicks, loudness, dead air. Mechanical, no judgment.

## Traps

- Comparing a boundary against ALL neighbouring audio instead of only the DROPPED audio. Every
  pair of consecutive sentences then reads as "cut into speech", and the real defect hides in
  25 false positives.
- A gaze check on the second-to-last frame. `ffmpeg -frames:v N` with `%d` numbers files from
  1, so reading indices `0..N-1` silently drops the frame that actually matters.
- A fixed eye band. `gaze_tile.py` carried reference edit A's 0.53-0.68H and showed their CHIN on
  reference edit C (head top 0.40H). The band comes from `geometry.json` (`eyesFrac` ± 0.06) now, which is
  why geometry is measured before the cut is verified.
- Checking gaze on the tightest preset only. Tighter tails sit strictly inside a window a
  looser preset already cleared; the loose one is the one that can expose a new gaze drop.
- Judging denoise by RMS. A 7 s speech block's RMS moves 0.04 dB whether the denoiser is gentle
  or eating tails. Measure a silence window and a word tail separately.
- Trusting the level-derived `endMs` on the CTA clip. On reference edit E the variant engine put the
  last out-point at 431326, 170 ms inside "over." (transcript 431178-431598, audible to ~431500)
  because the word's decay had already dropped under the gate. The last line of the reel is the
  one that asks for the comment: give it the whole word plus ~180 ms of air, and take the
  out-point from the transcript's word end, not from the energy gate.
- Fixing a clipped tail by rebuilding the project. Extending the LAST clip only appends: the
  other 23 segments of `spine-map.json` come back byte-identical, so re-render the spine,
  re-run `master_audio.mjs`, then hand-patch `captions.json` (`durationMs` plus the final page's
  `toMs`) and the last visual event's `toMs`. Never re-run `build_captions.py` on approved captions.
- `ebur128`'s "Peak" line is the sample peak. For true peak pass `peak=true` and read the true
  peak line, and confirm with a count of samples at or above 32700.
