---
name: footage
description: "Internal. How a folder of the buyer's own clips is understood once and then never opened again: measure every clip, look at nine frames of it, write four or five sentences about it, and from then on build reels by choosing ids. Called by any format whose input is a folder the buyer filled, and before any montage that has to know what its clips are."
---

# Footage

## Goal

A folder is read once. Every clip ends up with a short id, a set of numbers measured off the picture and four or five sentences saying what it is, and every reel after that is built by choosing ids. The buyer films for an afternoon; the reading happens once; the montages are free.

## Reasoning

Understanding footage is the expensive part of this kind of reel, and it is the part that gets paid for again and again. A run that opens the folder to build a montage spends most of itself looking at clips it already looked at last week. Worse, it does not agree with itself twice, so the second montage is built on a different understanding of the same thirty files and neither reading survives. Both problems have one fix: write the reading down, key it to the clip's content hash so a rename cannot lose it, and treat the file as the memory.

The reading is in two halves because the halves fail differently. Length, light, colour and movement are measured, because no eye can say that a clip sits at 0.11 of full white and a script can, and because those are the numbers a picker sorts on. What a clip IS cannot be measured at all: no threshold knows that the blue rectangle is a terminal, that the hands are the buyer's, or that this is the same room as last month under a different lamp. That half is seen, on a sheet of nine frames, and written in plain sentences. A note has to be specific enough that it could not have been written about any other clip in the folder, because a note that fits everything sorts nothing.

The last thing the reading does is refuse to be trusted blindly. Two files exported twice from one take have different hashes and are two clips to everything upstream, but they are one picture, and a cut between them reads as no cut. The reading says so, and the picker counts them as one.

## The pattern

1. **Take it in.** `node scripts/intake.mjs <folder>`. One clean working copy per clip, keyed by content hash. The originals are never touched.
2. **Measure and lay out.** `node scripts/footage.mjs read`. Length, light as a share of full white, colour, how much it moves, how much it changes across itself, which clips are the same picture as another, and a sheet of nine frames per clip.
3. **Look.** Open every sheet. Nine frames say what a clip is; one thumbnail says what one moment of it was.
4. **Write.** One note per clip, four or five sentences: what it is, what is shown in it, what colour it is, and where in a reel it belongs. Then `node scripts/footage.mjs note --from <notes.json>`, which refuses a note too short to have been written from looking.
   For Beat Montage, also record `human: { visible: true, from: <seconds>, to: <seconds> }` for a clear window showing a person working, or `{ visible: false }`. Inspect that window before recording it; a filename or mention of a hand is not evidence of a visible person. The picker uses it for the opening.
5. **Say what the folder is.** `context/inputs/footage.md`, high perspective, beside the index: what this footage is, what it can make, and what it cannot. Written once, for the next run to read.
6. **Build from the index.** From here every reel names ids. The folder is not opened again until the buyer adds to it.

## Examples

Seventeen clips read in one pass: three pairs come back flagged as the same picture under different names, so the folder is fourteen clips and the montage that would have cut between two of them is not built. A note that works: "The desk from behind at night, one lamp on, three screens filling most of the frame. Dark, blue from the screens, almost no other colour. Nothing moves but a hand on the mouse. Good under a long hold, and it is the only clip here that reads as evening." A second montage two weeks later, built in one step, because nothing had to be looked at again.

## Counter-examples

Opening the folder again because a new montage was asked for. A note that says "b-roll of a desk", which fits four clips in the folder. Keying the reading to a filename, so renaming a file loses it. Writing notes from the filenames and the measurements without opening a single sheet. Letting a montage cut between two clips that are one picture because their hashes differ. Deriving the sentences from the numbers, or the numbers from the sentences: one half is measured, the other is seen, and neither can stand in for the other.
