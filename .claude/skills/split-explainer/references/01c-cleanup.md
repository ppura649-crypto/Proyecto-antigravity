# Decide what belongs in the edit

## Goal

The finished take carries the speaker's intended argument, in their voice, with complete words
and natural joins. Preparation noises, abandoned thoughts and accidental repetitions go when
the evidence supports removing them. An intentional hesitation, emphasis or useful breath stays.

## Why this is a separate decision

A transcript is a reading of the recording. It can omit a sound, misunderstand a word, or give
loose boundaries. An energy curve says something was audible; it does not say what it meant.
Neither can establish on its own that a take is good. A correct render of a poor edit is still a
poor edit. These are three separate jobs: understand the source, choose the edit, verify its result.

Cleanup reads every kept passage in context. The flags are places to look more closely, never
the complete list of possible defects and never automatic deletion rules. A passage with no
flags still needs a reading. A transcript fix changes words on a page; removing a sound requires
an edit to source times in cuts.json, which changes both the audio and picture.

## The evidence and the decision

After selecting takes, tightening pauses and reading gaze, run:

```sh
node scripts/py.mjs engine/talking-head/scripts/cleanup.py scan <project> --audio
```

Read cleanup.json beside words.json and the source waveform. The full passage, not one isolated
token, establishes whether a hesitation is intentional, a repeat is emphasis or a false start,
and a missing transcript word is missing speech or a nonverbal sound. Audio excerpts under
checks/cleanup include 400 ms of source context on both sides; sourceFromMs maps their time
back to the original. Inspect questionable audio with an available audio tool. Never claim to
have heard an excerpt from looking at its waveform. If the evidence cannot distinguish a quiet
word from a noise, retain it and state the uncertainty rather than shaving the word.

For every clip, set reviewed to true only after reading the whole passage, and write evidence
describing what was checked and why the chosen delivery is coherent. For every event, choose
keep or remove and give its contextual reason. Hesitation and repetition flags are hints;
untranscribed-audio is an unknown audible region, not a diagnosis of a cough. Never erase flags
to get a pass. Add other edits to removals when the full reading finds them.

A removal carries clipId, fromMs, toMs, wordIndices and reason. Times are on the source. Include
the indices of every word deliberately removed. An event already carries its word indices;
optional remove: {fromMs, toMs} refines its boundary around the complete sound. The script snaps
removals outward to video frames and refuses a cut that touches an unapproved neighboring word.
If loose ASR bounds make a safe edit impossible, verify and correct those bounds, scan again and
review the current version. Never approve another word merely to bypass the protection.

```sh
node scripts/py.mjs engine/talking-head/scripts/cleanup.py apply <project>
node scripts/py.mjs engine/talking-head/scripts/cleanup.py check <project>
```

Apply writes real split clips into cuts.json. It preserves the reviewed version in cleanup.json
and the preceding cut in cleanup-before.json. No edit means cuts.json stays byte-identical.
Read the resulting sentence and any new joins, inspect the new last frames, then render the cut
and run verify_cut.py. If a join or gaze correction changes the cut, scan and review that version
again. A cut lock requires a current cleanup receipt and a rendered map matching those edits.
It does not ask for another buyer review during a run that uses self-review.

## What the tests must establish

- Removing an audible artifact changes the delivered audio and the corresponding picture times.
- Meaningful hesitation, repetition, quiet speech and deliberate pauses survive when kept.
- Short sounds, missing transcript tokens and loose timestamps are handled without losing neighbors.
- An edit cannot claim to remove a word while leaving part of it, contradict a keep decision,
  reuse a stale review, or lock a render made from the previous cut.
- A whole-video run advances from preparation through export; an intermediate file is not completion.

Synthetic signals test interval handling and audio/video alignment. Fresh runs on varied real
recordings test editorial quality. Neither substitutes for the other. Rebuilding captions or
visuals over an existing approved cut does not test take selection or cleanup from the raw source.
