# Sound: the voice first, then a few sounds that mean something

## Goal

Every word heard to its end, a voice that is loud, clear and warm, and a handful of sounds
that mark the turns of the argument. Sound is felt, not noticed: a viewer who is asked
afterwards remembers the punch landing and the highlight flashing, not that there were
sound effects.

## Reasoning

**The voice is the reel.** Anything done to the picture is worth less than a clipped word
ending or a muddy voice, because the ear forgives nothing. So the voice chain comes before any
effect and protects two things through every later pass: the word endings (measure where the
voice really stops and extend the cut to it; a gate or an expander must carry protected windows
around those endings or it dips exactly what was just fixed) and the tone once it has been
approved (later passes add beside or below, they never redo). Most voice problems on a
chest-mounted mic are spectral, not level: body too thick low, presence missing high. Fix
clarity with EQ, expect that to expose the room, tame the room with a downward expander, then
expect the result to read thin and give a little body back. Each step gets its own A/B on the
same segment, chosen where the problem is worst, so the decision is made with ears.

**A sound marks an instant, never a movement.** It goes on the moment the argument turns and
the viewer should feel it: the punch of the hook, a named idea landing, a number arriving, a
line flipping to the accent, a highlight sweeping a sentence, an item lighting up as it is
counted, the click of the save. It does not ride a movement in progress: a bar rising, a thing
sliding across, a card appearing, a transition, a scroll that fills time. A sound under motion
tells the viewer to watch the editing; a sound on the instant tells them what just mattered.
Ask what the viewer feels at that instant; if the answer is "the editor did something", there
is no sound. When a sound is wrong it is removed, not replaced with a different one at the
same spot: the spot was wrong, not the file.

**Few, and each one earned.** A reel of a minute carries somewhere between a dozen and twenty
sounds, the loudest on the punch, and the same kind of moment does not always get its sound.
The highlight sound is used sometimes, so that it still means something. The sign of too
many is hearing the pattern.

**The standard sounds sit a touch above where they first become audible.** A sound that is
technically present but under the voice is not there. Presence is measured, not assumed: a
long RMS window is blind to a short transient under speech, so compare 10 ms peaks of the mix
minus the dry against the voice at the same moment. The everyday accents (the highlight, the
blip, the number) read right slightly louder than instinct puts them; the punch riser is the
one thing allowed to sit clearly above the voice.

**The palette belongs to the pack, not to this file.** This pattern is how sound is reasoned
about for anyone. Which sounds, how many, how loud, and whether there is sound at all are
per-creator and live in `packs/<name>/` (the Creator Format 1 palette is `packs/creator-format-1/sfx.md`). A pack's
palette is closed: a moment that seems to want another sound gets one of the palette or
silence, and a new file enters only after the creator has heard it. When a pack has no palette
yet, ask before the plan whether the video has sound, propose a starting set, and adjust from
what the creator says after hearing it.

## Priority

1. Word endings intact through every pass; re-verify after each one.
2. The approved tone stays; a later pass adds, it does not redo.
3. A sound on an instant of meaning, never on a movement, from the pack's palette, its peak back-timed onto the word.
4. Fewer sounds, better sounds; the everyday accents slightly louder than instinct.
5. An A/B file for every voice change, on the segment where the problem is worst.

## Method

Order of work: measure the source (speech level, floor, SNR, the seven bands against the
500-2k core, echo as the drop over 150 ms after word endings), extend the tails, EQ for
clarity, expander for the room with protected endings, warmth back if it reads thin, then the
SFX mix from the plan's `sfx` column with per-file volume and delay and no normalisation, then
the master lift into a limiter to about -14 LUFS integrated with true peak under -1 dBTP.
Print the presence table for every sound. Deliver the dry version beside the mix the first
time so the restraint can be judged.

```bash
X=sfx
ffmpeg -y -i in.mp4 -af "equalizer=f=300:width_type=q:width=1.0:g=-3.5,equalizer=f=3800:width_type=q:width=0.8:g=3" -c:v copy -c:a aac -b:a 192k eq.mp4
# expander: numpy, 10 ms RMS envelope, threshold ~-22 dBFS, ratio 3, max 12 dB, attack 2 ms, release 60 ms, protected windows at every extended ending
ffmpeg -y -i eq-dr.mp4 -i $X/<file> ... -filter_complex "[1:a]volume=0.6,adelay=T|T[s1];...;[0:a][s1]...amix=inputs=N:normalize=0:duration=first[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k mix.mp4
ffmpeg -y -i mix.mp4 -af "volume=3.9dB,alimiter=limit=0.794:attack=2:level=false" -c:v copy -c:a aac -b:a 192k final.mp4
ffmpeg -i final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E '^\s+(I|LRA|Peak):'
```

Two traps: a denoiser set for a louder floor than the room has chews quiet speech; a pitch
shift is never the answer to a voice that reads high, warmth EQ is.
