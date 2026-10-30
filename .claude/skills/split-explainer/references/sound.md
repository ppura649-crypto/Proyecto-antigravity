# Sound: soft effects that make the motion physical

## When

The first export carries only the recorded voice. Once the picture is delivered, ask once: soft sound
effects or none. Never plan or place sounds before the picture is accepted. The effects version is a
separate file; the silent-voice export stays as it is.

## Why

A sound makes a visible action feel physical: the presenter dropping into the panel, a mark landing,
a number slamming into place, a card placed on a table. Sound on everything turns into noise; sound
on nothing makes big moves feel weightless. The creator wants them soft and clearly audible.

## Choosing

The library is `assets/split-explainer/sfx/` (42 sounds), with `sfx.json` giving each sound its family, what it is,
the one sentence that says when to use it, and `peakOffsetMs`, where its transient sits.

- One sound per meaningful visible event: a presenter move (whoosh), a hero landing or a number
  arriving (soft impact or thud), a switch or a click that really happens on screen, a card placed.
- Not on every caption word, entrance or small drift. No sound for its own sake.
- A typical minute carries roughly 20 to 30 sounds; the picture decides, not a quota.
- Write the plan as `sfx-plan.json`: `[{"frame": <master frame of the event>, "id": <sound id>, "peak": <dBFS>}]`,
  and check each frame against the visible action in a still, not against a guess.

## Levels (measured, not guessed)

Set each sound by its own peak, not by a flat gain. Measure the sound's peak with FFmpeg `volumedetect`
and apply the gain that brings it to its target:

- marks (clicks, ticks, blips, pops): about -12 dBFS
- moves (whooshes): about -15 dBFS
- weights (thuds, landings, soft impacts): about -9 to -10 dBFS

A flat -14 to -24 dB gain left the effects 20 to 30 dB under the voice and the creator said "I can't hear
them". Check by rendering the effects alone next to the voice, then listen to the mix on phone speakers.
They must be heard, never cover a word.

## Mixing

With FFmpeg: delay each sound so its transient (`peakOffsetMs`) lands on its frame, apply its gain, a
short fade out, mix with the voice using `amix` with `normalize=0` (so the voice keeps its level), then
a limiter at about -0.5 dBFS. Copy the video stream; the voice is never re-processed or re-timed.
Deliver `final-sfx.mp4` beside `final.mp4`, and the same effects under every hook variant.
