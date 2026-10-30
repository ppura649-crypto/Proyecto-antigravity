# The text system, written down

## Goal

Anyone can write the next line for this account without asking the buyer a question and without looking at another account. The words on screen are read off the buyer's own posts, so a new line lands in the same rows, at the same length, in the same case, in the same place, and only the words are new.

## Reasoning

The words on screen are the one thing a buyer would happily be asked about, and the one thing that must never be asked: forty of them are already in the posts, each with the reach it got. But nobody writes a line from `chars_per_row.p90 = 29`. A measurement is not a pattern. `scripts/textsystem.mjs` writes `context/text-system.json` because the checks need numbers they can compare against, and this file is what the agent understood from them: the same facts, in the shape a line actually gets written from. The scripts read the JSON. Whoever writes reads this. Both exist, and neither replaces the other.

It is its own file, not a section inside `context/formats.md`, because it is read at a different moment by a different job. `formats.md` is read to decide what to make. This is read the second before a line is written, in every format the buyer owns, and it is the file that has to be right when the account changes its language.

## Pattern

`context/text-system.md`. A short head that says when it was read, from how many posts, and per format how many were read row by row. Then one section per format, best format first, and each section in this order.

1. **What the line is.** One or two sentences: what it does in the post, where it sits, what it carries, what a reader is meant to do with it. Not the typography, which the frame measured; what the line is for.
2. **The budget.** Rows, characters a row at the median and at the ninetieth percentile, characters in all, the case, the punctuation the format uses and the punctuation it never uses. Every number out of the reading, none invented, none rounded into vagueness.
3. **The shapes, ranked by what they reached.** The coarse patterns this account writes in, each with how many lines carry it and the median reach of those lines. The ranking is the value: a shape that reached twice as much as another is a decision, a list of shapes is trivia.
4. **The lines that worked**, in full, with their reach and their rows counted. Then two or three lines written to the system, with their row lengths in brackets, to prove the pattern is writable and not just describable.
5. **Counter-examples**, from the same reading: the row length that wrapped and pushed the take down, the case this format never uses, the line with no name and no number and what it cost in reach.
6. **What is fixed and what is free.** One sentence, so a buyer who wants something new is told which half can move.

Rebuilt whenever the reading is rebuilt. When the account's language moves, this file moves and every format follows it, because no format keeps its own copy.

## Examples

"Two rows, 24 characters a row, never past 34, the ninetieth percentile at 29." A sentence a line can be written against.

"A number on a number reached a median 16,400 across five lines; a plain claim reached 10,700 across sixteen." The shape is now a choice with a price.

"Written to the system: 'Baidu just gave away the OCR / every startup was paying for' [28+27]." The pattern proved on a line that did not exist before.

## Counter-examples

Writing the file out of the JSON without reading the lines, so it says what was measured and nothing about what the account is doing. Keeping the text system as a section of `formats.md`, where it is read when choosing a format and not when writing a line. Deleting `context/text-system.json` because this file exists: the text budget check compares against the JSON and a check that cannot run is a failure. Numbers that do not come from the reading. A shape list with no reach next to it. Examples invented instead of lifted from the posts. Advice about what a good hook is in general: this file is about this account.
