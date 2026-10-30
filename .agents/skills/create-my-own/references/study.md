# Studying a format

The study answers one question for every moment of every reference: what is on screen, and why here. A
format is a set of decisions that follow what is said. A list of effects is not a format.

Work in `workspace/library/talking-head-formats/<slug>/study/`. Write to disk as you go.

## Prepare the material yourself first

For each video, before any subagent starts:

- the words with their times (`node scripts/transcribe.mjs`);
- a frame every second for the whole video, and a frame every 0.5 s, each with its time written on it,
  on contact sheets (`ffmpeg ... -vf "fps=2,scale=360:-1,tile=6x4"`, or one picture at a time with
  `node scripts/see.mjs <video> --at <s>`, which also draws a grid in shares of the frame);
- the cut and change candidates: `node scripts/structure.mjs <video>` and ffmpeg's scene score;
- for every candidate, the frames around it at 0.1 s (decode by frame index, not by seeking a time, which
  can land a frame late);
- the loudness every 0.1 s and the sharp onsets (clicks, whooshes, hits), and whether music runs under the
  voice.

Pictures at the source resolution. Numbers measured on decoded frames, never guessed from watching.

## Pass 1: every passage

One subagent per one or two videos, all running at once, each with the strongest model available and the
same short brief: read this file, then the material folder, then the video. Each writes one row per
passage, a passage being a stretch where the layout or the picture holds:

- start and end time, and the words said;
- layout: presenter only, split (who is where, what share of the frame), visual only, or something else;
- the person: size of the face as a share of the frame height, position, zoom in or out and by how much,
  how the zoom moves (snap or ease) and on which word;
- the caption: what is shown, the active word, the styled words;
- the visual, described as what it is and what it does (the thing and its verb);
- the transition in and out, with its length in frames;
- sound events in the passage;
- Observed (what is there), Why (what it does for the viewer at this sentence; label it as inference),
  Transfer (what a new video should copy from it).

## Pass 2: the specialists

When pass 1 is in, send specialists across all videos at once, each on one subject with the dense frames:

- **Camera.** Is it zooming? Measure the face box height frame by frame on every presenter stretch
  (the talking-head engine's face finder, or the box of the head on decoded frames). A change in face size
  without a cut is a zoom; with a cut it is a punch-in. Report how often, how much, how fast, which words
  trigger it, and whether the frame shakes, pans or stays locked.
- **Captions.** Font family (or the closest free one), weight, size as a share of the height, case, colours
  of said, active and coming words, how key words stand out (colour, box, size, emoji), words per line and
  lines at most, position in every mode and its distance to the face, how a word appears and on which frame
  of its sound, outline, shadow or plate, what happens between sentences and at a mode change. Measure
  visible ink, not text boxes. Character recognition misreads faces and italics: read with your eyes.
- **Layout and transitions.** Every mode, its geometry in shares of the frame (panel edges, head top,
  caption baseline as separate lines), the ground colours, and every mode change frame by frame: how it
  moves, how long, and whether any frame flashes the person back.
- **Rhythm and sound.** Seconds per passage and per mode, how the pace changes from hook to body to end,
  cut length and whether words are clipped, music level and where it changes, every effect and what it
  marks, measured on the waveform, not described from listening.
- **The hook.** The first five seconds of every video at every frame: what appears, in what order, on which
  word.

## The synthesis

The lead reads everything and writes `FORMAT.md`: the decision logic (when each mode, zoom, caption
treatment and sound is used, and why), the measured geometry, the caption spec, the camera, the rhythm, the
sound, the hook pattern, ten example passages with times, what varies between videos and what never
varies, and open questions. Every claim cites the video and the time it was seen at, two places at least.
Where references disagree, say so; do not average them into something none of them does.
