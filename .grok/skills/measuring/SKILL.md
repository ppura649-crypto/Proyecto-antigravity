---
name: measuring
description: "Internal. How anything on a frame is read: look at the picture first, name the shape, measure the band you named, draw the numbers back on the frame and look again. Called by format skills whenever a size, a gap or a place is needed from a buyer's post, whenever a version is compared with the post it came from, and whenever a reading looks precise but has not been seen."
---

# Measuring

## Goal

Every size, gap and place in a version comes from the buyer's own posts, measured, and every number that reaches a study, a set of props or a check has been drawn back on the frame and looked at. Nothing is typed in by hand and nothing is shown that was not compared with what it came from.

## Reasoning

The eye cannot judge a gap of one percent of a frame and a buyer sees it at once, so the work has to be measured. But an instrument that always answers is worse than one that sometimes refuses. A reading of a frame the instrument was not built for looks exactly like a real one: a capital three pixels tall, a card box one row high, a panel edge in the middle of a photograph. Two of those compare to each other and agree, so the check passes while measuring nothing, and the buyer is the one who finds out. That is the same failure as a reader that is right in daylight and wrong under a lamp: confident, precise, wrong, and silent about it.

So the instrument is in two halves, and the second half is not optional. `measure.mjs` says what a frame holds and refuses what it cannot read. `see.mjs` draws every number it claims as a line on the frame itself, and a line that does not sit on the edge it names is a wrong reading however many decimals it carries. Between the two sits the only thing neither can do: looking. The frame says what it holds; the scripts make the numbers exact once you have seen it. A number that has not been drawn and looked at is not yet a reading, and a reading of a shape the instrument refuses is not a number at all.

## The pattern

1. **Look.** `node scripts/see.mjs <file> --at <s>` writes the frame with a grid of twentieths and, on it, every number a reading claims. Open it. Add `--band y0,y1 --zoom 3` for anything small.
2. **Ask what the frame is, before measuring anything in it.** `node scripts/measure.mjs read <file> --at <s>` names the shape and says why: a panel with something drawn on it against one edge, a letterbox with bare bars at both ends, one picture edge to edge, a flat frame, or unsure. It also lists the regions and the blocks of type, biggest first, and marks a block `mixed` when the band holds something that is not type. It never invents a zone: unsure is an answer.
3. **Name the band yourself, then measure it.** `node scripts/measure.mjs band <file> --band <y0,y1> --x <x0,x1>` measures exactly the rows you named: the ground colour, whether the ink is lighter or darker than it, every row of words with its cap height, its baseline and its extent, and the step between rows. It reads white words on black, black words on white and a caption over footage alike, because it assumes nothing about the layout. This is where a number becomes exact, and the band comes from your eye, not from the script.
4. **Draw it and look again.** `see.mjs --from <the json you just wrote>`. Every box must hug the thing it names. This catches what no threshold catches: a box drawn to the frame's edge because a width was missing, a row that swallowed the lit edge of a screen, a cap measured off a table rail.
5. **A format reading is only for the format it reads.** `measure.mjs panel` is the three zone reading (the panel edge, the card box, the line at the foot, the sticker) and it refuses any frame that is not that: not a panel, or a panel of another kind whose foot holds no line of type. The refusal carries the shape it saw and is a fail everywhere it lands, never a fallback to a guess. Another format is read with `read` and `band`, and its numbers go in its own study.
6. **Compare, never look and hope.** A version is measured against the post it came from at the same seconds, in points of the frame (a point is a hundredth), and a gap the eye would not name is still a fail. The check writes itself into the project so no version can skip it, and a check that could not run is a fail with its reason.

## Examples

The three zone post: `read` says panel, a flat region of sixty points against the top with something drawn on it; `panel` then gives the clip beginning at 0.600, a capital of 0.0211, rows 0.0328 apart, and `see --panel` puts a red line exactly on the edge of the panel and a yellow box exactly around the two rows. A caption over footage on another account: `read` says full, one picture edge to edge, and points at a block of five rows; the eye names the band it sits in, `band` returns two rows of a capital 0.0156 with a step of 0.0219, and the drawing shows both boxes hugging their rows. A panel on a third account whose type sits in the middle and whose foot is bare: `panel` refuses it, because the band at that foot is a quarter of a point tall, which is a mark and not a line.

## Counter-examples

Taking a number from a reading whose picture was never opened. Reading a frame with a format's own reading because the format's name is on the folder. Falling back to a guessed rectangle when the instrument refused, instead of stopping and looking. Calling a frame's shape from the reader that grouped the posts instead of from the frame. Measuring a band the script chose rather than the band the eye named. Typing a size, a gap or a split into props when the post can be measured for it. Judging by eye what a script can measure, and judging by script what only the eye can see: where a face sits in its zone is read on the grid, not by a detector that is confident in daylight and wrong under a lamp.
