# The visual plan: ideas and pictures before pixels

Stage 3. Starts once the hook is locked. Produces ONE artifact, `projects/<id>/visual-plan.md`,
that the creator reads and corrects in words before any card, capture or chart exists.
`render.mjs` refuses to render a visual layer whose plan has no `approved:` line.

## Goal

A plan good enough that a builder who has never seen the video can build each visual right from
its row alone, and good enough that the creator can see the whole layer in their head and fix it
with a sentence, before the expensive part starts. The plan is where the creative work happens.
The build is where it is made real.

## Reasoning

Every layer that was rejected whole was built without a plan, or from a plan nobody corrected:
the pixels came first and the ideas were reverse-engineered from them, so the cards illustrated
words instead of arguing claims, repeated themselves, and left the creator with nothing to fix
except "start again". Every layer accepted on first delivery came from a written plan the creator
had corrected in words. That is not a coincidence about process, it is about where judgment can
be applied cheaply: a row is corrected in ten seconds, a card in an hour.

The plan owns two things and only two: **the idea** (what the narration is saying at that
moment, one picture per idea) and **the picture** (what the viewer sees, and what moves on which
word). It is precise about those, because precision there is what makes creativity land: "show
the trade-off between tokens and quality" comes back as text on a plate, while "a balance beam,
tokens on the left as a short stack, quality on the right as a tall bar, the beam tips hard on
`huge`" comes back as the right object, every time. The row IS the brief.

The plan never owns the making. It does not say which surface to capture, at what viewport, with
which chrome, from which tool, or how many frames. That is craft, and it belongs to whoever
builds the card, who is expected to improve the picture where they can and to say what they
changed. A plan that dictates procedure removes the builder's judgment and gets exactly what it
asked for, including its mistakes.

Precision about the picture is not a cage either. The row names the object and its state change;
the builder chooses how it is drawn, how it moves, how it is lit. If the row's object turns out
impossible or dull in the making, the answer is a better object proposed back, not a literal
rendering of a bad row.

## Ideas, not sentences

Count the pictures in the narration, not the lines. "Search the internet, but they barely read
it, they only skim pieces from a few pages to save tokens" is four ideas; one card for four ideas
is coverage on paper and nothing on screen. A superlative is an idea ("the most trusted"
wants a ranking). A date, a name, a number, a comparison each want their own picture. A clause
that only leads into the next one (a run-up ending on a function word) can stay bare, and the
plan lists every bare stretch word by word so that decision is visible.

## What proves the claim

For each idea ask what image PROVES the claim, then what motion shows it happening on the word.
The claim decides the kind of picture: an identity or an existence (a tool, a company, a page, a
file, a person) is proved by the real thing; a physical thing by a real photo of it, taken from
the page that published it; a measured magnitude by a chart from real numbers
with its source; a mechanism, a process, a comparison or a feeling by an object drawn for it,
whose state change on the word is the explanation. A number the creator says out loud earns a
chart even when no source exists, drawn as an illustration of their words and marked as such.
Something already shown once can come back changed, and a callback beats a new object when the
first state was recognised.

Real is a starting point, never an excuse. A real page or window is worth showing when the
artifact itself is the point, and it is then recomposed for the reel: the one region the sentence
is about, legible at card size, with its motion designed on top. A screenshot of a whole surface
is a document, not a picture.

## Concrete, not generic

A drawn card earns trust the same way a capture does: the viewer could say which file it is. When
the sentence names a file, a config, a prompt, a command, a page or a UI, the object IS that thing
with its real syntax, its real keys and its real lines, and the line the sentence is about lit on
the word. "Hooks" is a settings file with its hooks block open, the matcher and the command keys as
they really are, the named hook lit; not a hooks card with a header and three empty rows that type
a word. "The rules file grows" is a rules file with rules a reader could believe, one more landing
on the word; not a document card with three lines. "The easiest instruction" is a prompt with three
instructions a model would actually be given; not three grey shapes. Generic is the failure mode of
drawn: it costs nothing to make, teaches nothing, and the viewer reads it as a slide. The OBJECT
cell therefore names the instance, the file and its lines, so a builder cannot come back with a
category. When the instance is not known, that is research to do, never a reason to draw the
category.

## Light research, always, never blocking

Every noun in the narration that names something existing outside the speaker's head (a paper, a
study, a product, a company, a repository, a document page, a physical thing) gets one search
before its row is written: three queries at most, a couple of minutes, then a decision. Found: the
row is real, the URL goes in evidence, and the thing is captured, or its photo is taken from the
page that published it when the subject is physical (a chip on its board, a device, a machine),
never a generated picture. Not found: the row is drawn as the concrete instance and evidence says
so. A sentence that is an opinion or the speaker's own process gets no search, and evidence says
that too. A transcript with nothing to look up costs nothing extra; a transcript with a study in it
gets its proof card instead of an illustration marked "no source".

## The plan file

```markdown
# <id>: visual plan (pack: <name>)          geometry: head top 0.374H, chin 0.554H, band 0.085-0.384H

## Ideas in the narration (not the sentences)
| # | idea (one picture) | first word → last word, spine ms | claim type |
| 7 | measured on site, against the rival | Measured 17900 → rival. 21671 | mechanism |

## The layer
| # | in on | out on | idea | OBJECT (what the viewer sees) | mechanism (what moves, on which word) | clock | real / chart / drawn | evidence | sfx | job |
| V7 | Measured 17900 | rival. 21671 | 7 | a lab bench: two packages, ours and the rival's real mark, a probe dropping onto each, a meter between them | probes touch on site,; the needle swings on performance and settles toward ours on chip; the settled meter holds while the rival is named | beats | drawn, real mark | <url> | - | TEACHING |

## Bare on purpose (run-ups only, every word of the stretch written out)
29.7-31.2 "But a chip is nothing without the" (run-up); the last 3.3 s is the CTA line.

approved: <date> "<the creator's words>"
```

Every column earns its place:

- **idea, not sentence.** One row per picture in the narration.
- **claim type** decides real, chart or drawn, and writing it down is what stops the pendulum
  between "all captures" and "all drawings".
- **OBJECT.** The thing the sentence is about, as the viewer would see it over the speaker's
  shoulder. Not a list of labels, not a noun in a box. If the object is not obvious this row is
  where a second opinion earns its cost: ask for five objects, pick one.
- **mechanism** names what moves and on which word. Motion lives inside the card; the card pops
  and cuts.
- **clock** is read off the words: `beats` (motion on the words, then the finished picture
  holds), `run` (one continuous movement at a rate, because the words describe motion or
  growth), `still` (a thing to read). A `run` row briefs its rate, never its duration.
- **in on / out on** are the idea's first and last word, copied from the ideas table. `out on` is
  the word the card must still be up for. Length follows from the words, never the other way
  round; a card that keeps bringing new motion may be long, a card that has stopped moving may
  not.
- **evidence** holds the search's outcome for every row: a URL or a file for anything real,
  verified the same day; `searched, none` when the search found nothing and the row is drawn;
  `no search needed` for a mechanism, an opinion or the speaker's own process. `scripts/plan_check.py`
  refuses an empty cell and a "none" or "no source" that does not say `searched`: the decision
  has to be visible, like the bare stretches.
- **sfx** comes from the pack's palette, on the instants that carry meaning, sometimes.
- **job** is what the picture does for the viewer (naming, proof, teaching, structure, humour,
  slide). Two rows in a row with the same job and the same shape is the "same visual twice" trap.

## The three qualities every row is read against

**Visually explanatory**: a viewer with the sound off still gets the point. **Hooking**: the
first object and the punch are built to be looked at, not only understood, and one humour beat
is welcome. **Contextualised**: the creator's words, subject and objects, never ours.

## Priority

1. Ask the creator, before writing, whether this video has sound or is visuals only, then read
   the pack's preferences.
2. The ideas table first, with word times from `captions.json`. One row per idea, the object
   named, the claim type written; the rest of the row can be thin.
3. Show the plan. The creator corrects in words; the corrections go into the rows. Only then the
   `approved:` line, and only then the first pixel.
4. One light search per named thing, then real where the artifact is the claim, a chart where
   the claim is a number, drawn as the concrete instance where the claim is a mechanism. Evidence
   next to every row.
5. Every card out on the last word of its idea, every bare stretch written out and all of them
   run-ups, the last seconds free for the CTA.
6. After the build: stills of every built card before any render, read at phone width. The
   whole video renders once, never a partial file.

## What good looks like

Twenty-two ideas listed against word times, then thirteen events, every one a different object:
a tree for the structure, the real input box for the naming, a hundred grey marks with three lit
for "too few know", a legend with a loop arrow, a quote over the head with no card, a split in
four beats, ten real marks landing as the count is spoken, the real session window with ten rows
on one clock, a balance beam with the sourced numbers, three states of the same team (overloaded,
spread, merged), the real install line, the CTA. Shown as a table, approved with three words,
built once, one refinement round touching three things.

## Traps

- Straight from the transcript to pixels with no idea list: one page scrolling for five seconds
  under four ideas. "I was expecting more visuals."
- Real captures where mechanisms were owed: a docs page, a file listing, a README, all honest,
  all teaching nothing.
- Ten cards for twenty-five ideas, and the same tree three times.
- A noun handed to a builder instead of an object: it comes back as text.
- Our numbers where the creator's were the subject.
- A drawn placeholder where a real frame of the creator's own work exists.
- A category where an instance was owed: a hooks card with three empty rows for a settings file
  whose keys are known. It reads as a slide.
- "No source" written on a study card before anyone searched for the study.
- A generated picture where a real photo of the thing exists on the page that announced it.
- A row shortened to fit a clock, its tail moved to "bare on purpose": the viewer sees the card
  cut while the sentence is still running.
- "Bare on purpose" spent on a payload clause (a date, a credential, a rival's name, the thesis).
  Bare is for the run-up.
- A plan that specifies the procedure (surface, viewport, capture method, frames) instead of the
  picture: the builder loses the right to think, and the layer comes back exactly as wrong as
  the row.
