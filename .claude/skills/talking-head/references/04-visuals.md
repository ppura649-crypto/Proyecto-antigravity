# Visuals: the picture argues the sentence

Stage 3b. Builds what the approved `visual-plan.md` says, the whole layer, then stills of every
card before the render, then one refinement round (`06-refinement.md`). The timing of every card,
with the three clocks, is `04c-timing.md`.

## Goal

An overlay layer a professional editor would sign: every card is the object the sentence is
about, it enters on the word that names it, it explains the claim to a viewer with the sound off,
it stays up as long as it has something to say and not past it, the screen almost always has
something on it, and bare screen is reserved for the run-up to a line that matters. Creative and
explanatory at once, never one without the other, and every card finished to the detail a
viewer would believe.

## Reasoning

Measured on the best creators of this format: every visual does one of a few jobs (naming,
proof, teaching, structure, humour, a slide), it enters on the trigger word under a third of a
second late, motion lives inside the card while the card pops hard and cuts hard, there is
something on screen most of the time, and the close is card-free. Two dials this creator moved:
coverage is the default, and a card lives exactly as long as its idea.

Two opposite failures dominate the record, and they fail the same test. Real captures where a
mechanism was owed: a docs page, a file listing, a blog post and a README, all honest and
live-verified, teaching nothing. Drawn cards that were text: a struck list, a row of chips, a
stat panel on a plate. The question is never real-or-drawn. It is **does this picture argue this
claim**, and would a viewer who cannot hear still get it.

A third failure is subtler and cost a whole layer: real surfaces shown as they are. Whole windows
captured at their own size and pushed into so the type could be read, live applications replayed
as screenshot sequences, chrome and bezels eating the card. Every one of them was real and none
of them felt real, because "real" on a phone screen is not where the pixels came from. It is
whether the thing looks made for this frame: legible without effort, framed on the one region
that matters, moving as one designed motion. A drawn object with real detail feels more real than
a shrunken screenshot, and a screenshot is only a starting material.

And the record says an object the creator names beats an object we design. "The agent icon with
blue folders, ultra realistic, with names like captions, cut-hard" replaced a card that typed a
real config file, which was true and dull. "Timelapses of them, take screenshots" replaced an
abstract fan of rectangles. Take the creator's nouns and draw the object properly.

## The mental model: one visual per idea, and the visual argues the claim

List the ideas in the narration, not the sentences (the plan does this). For each idea ask what
image PROVES the claim, then what mechanism shows it happening on the word. "Pieces from a few
pages" is several pages with two lines torn from each while the rest greys out, the fragments
landing in one window, a counter stopping early. It is not one page, skimmed. A visual that
illustrates a word instead of the claim reads as filler however real it looks.

The mechanic follows from the idea, not from what the renderer already has. Existing card kinds
are a floor. Every video so far needed new kinds written for it, and the refinement round's
biggest jump came from them each time. Writing a component for one moment is normal work, and
the builder who sees a better object than the row named proposes it back rather than rendering
the row literally.

Not everything animates. A still is right when the idea is a thing to read (a page, a number, a
tree) and the moments around it move. The rhythm comes from the alternation.

## Real, chart, or drawn: the decision variable is the claim

| the sentence claims | show | how |
|---|---|---|
| an identity or an existence: a tool, a company, a repo, a page, a person, a file | the **real** thing | the mark, frameless; the page as a clipping of the one region the sentence is about, shot narrow enough that its type reads at card size, one sentence swept; a real UI copied with its own type scale and the camera pushed to the region, never the type resized |
| a physical thing: a chip, a device, a machine, a place | a **real photo** of it | taken from the page that published it (the announcement, the teardown, the maker's own page), the source in the plan's evidence, shown as an archival image on a light card or frameless; never generated, never a look-alike |
| a measured magnitude with a source | a **chart from the real numbers** | `scripts/chart.py`: axes named in the creator's words, the source on the card, the notebook look, one highlighted series in the accent; "when it looks like matplotlib it gives credibility" |
| a number the creator says, with no artifact that says the same | a **chart that illustrates their words** | the notebook look, no source line, nothing named, the plan says the values are an illustration; the transcript outranks any artifact that contradicts it |
| a mechanism, a process, a comparison, a feeling | a **drawn object** | a new component: the thing, its state change on the word, the subject big and the plumbing thin, drawn with the detail of a real thing (materials, light, weight) and as the concrete instance (the real file with its real keys and lines, the real prompt, the real command; never a generic document with empty rows), the plate only when the diagram needs one |
| something already shown | the **same object again, changed** | a callback beats a new object when the first state was recognised |

Three admission tests for a real capture: the artifact itself must be the point (a directory
of files is not); it must be recomposed so the type reads on a phone (a clipping, never a whole
window; if it has to be pushed into to be read, it was shot too wide); the sweep goes on the
sentence, never on a paragraph. Real scrolling is used only where the scrolling IS the claim,
never to fill time. The creator's own account and work are an asset library: a real frame of
their own reel beats any drawn stand-in for "a montage" or "my reel".

Where a sentence happens (a terminal, an editor, a browser, a tool) is a strong hint for the
object and its motion: a caret typing, a check turning green, output streaming. It is a hint for
what to draw, not an instruction to capture. The surface's grammar is borrowed; the picture is
made for the card.

## Placement and legibility

**The band is a ceiling and a resting line, never a box.** The top of the band is the only hard
line, because the platforms draw their chrome over it. The bottom, a hair into the hair, is where
a card rests. Height is never clamped: a card takes what its content needs, and one too tall pins
to the ceiling and spills over the hair, which is allowed. Both lines come from `geometry.json`,
measured on this master, never from another video of the same person.

**A drawn explainer can be a standalone graphic.** Marks and names can sit on the footage with
the caption shadow, big subject, thin plumbing, exactly the levels the sentence names. A dense
diagram goes on one black plate, square, no border, white content, at most two type sizes, the
accent only on the payload. Real artifacts keep a light card. Neither is deleted everywhere as a
rule: sometimes the plate is right, sometimes not.

**Legibility is size and whiteness, not plates and borders.** "We almost don't see them" means
bigger, whiter type with the black halo that earns the edge; it does not mean a plate behind
every element or thicker outlines. Grey on black is for structure, never for words. Type is set
from the card, in device pixels the viewer can read at phone width, never inherited from a
screenshot's scale.

**A frameless card never clips its own content.** Half-off chips read as a bug, and a push that
crops a word at the card edge reads as a mistake.

**Build against the card's device px.** The band is wide and short; every gap expressed in frame
height comes out half what a tall layout intended. Tell a builder the pixels.

**Logos.** The real mark, bare and frameless, the brand's own white form when the file is a black
glyph, a mark not a wordmark, the name under it in the caption font. Nothing behind a logo, ever.

## Four laws every card of that shape obeys

**A real capture shows whole, then moves.** A clipping composed from the real pixels that fits the
card whole, held readable, and only then a glide. Legibility first, motion second. A glide from
frame 0 is right only when the scrolling is the claim (the density of a file).

**Both rows of a comparison speak one grammar.** A field of dots over a handful, a bar over a
stub, on the same axis. A second visual language on the second row reads as a different object,
and a comparison compares like with like.

**A metaphor names its parts and holds its full state before it changes.** Water labelled as what
it stands for, the rival as its real mark, the full state held long enough to be recognised, the
change landing on the word. A callback pays only if the first state was read.

**A ranking is marks and names; the numbers stay in the plan.** The measurable that orders the
rungs lives in the row as evidence; the card shows each entry's real mark and name, rank one in
the accent. The number on a card is the number the creator says.

## Motion

Motion is drawn, as one intended movement, on the word. Springs, eases and rates on objects the
card owns; never a sequence of screenshots played as frames, never an animated push nested inside
a scaled bitmap, never a blink or a cursor that came along in a capture. If a movement cannot be
made smooth it is made still and the moments around it move. Read three consecutive frames of
every moving card before delivery; if anything jumps that was not meant to, it is not done.

## Priority

1. On subject: the visuals argue what the creator says, in their nouns.
2. One visual per idea, the object the sentence is about, never a list of labels in a box.
3. The claim type picks real, chart or drawn. Evidence next to every real row.
4. Entry on the trigger word, never early, under a third of a second late.
5. The card lives as long as its idea and keeps moving while it lives (`04c-timing.md`).
6. Never the same object twice. Every event a different shape doing a different job.
7. Coverage by default; bare only on a run-up.
8. Finished to the detail: type readable at phone width, nothing clipped, nothing flickering,
   one card at a time, square corners, the accent the only saturated colour, captions never move.

## What good looks like

One layer: skill folders float bare, a villain document doom-scrolls, a bare punch word, a client
tree, a rules close-up with three sweeps walking down it, a thesis card with a glitching question
mark, a pick flipping to the accent, a chart with named axes, the real paper page with sweeps, a
two-bar from the paper's numbers, a takeover that folds twelve real lines into three panels, a
terminal, the CTA with a real click. Fourteen events in a minute, three bare moments with reasons.

Another: the hook's comparison as one frameless object (a long bar with a field of dots and a
rolling counter, a short stub on the same scale, the stub is the joke), a real article header as
a clipping that holds and then glides, a real photo of the chip with a slow push into the die, a
lab bench with probes and a meter settling on the word, a castle moat labelled and held full
before it drains on "dead", a flywheel that laps faster and faster because the words say so, a
ladder of real marks. Twenty-three shapes in seventy seconds, two charts, seven real clippings,
and nothing that looked like a screenshot.

## Traps

- Real where a mechanism was owed; text where an object was owed.
- The same object twice, or two objects that look alike doing the same job.
- A whole window captured and pushed into: the type stays small, the push crops words, the
  chrome eats the card, and nothing feels real.
- A screenshot sequence played as animation: the caret blinks out of phase, thin lines resample,
  the motion flickers.
- A card that clips its own chips, a push that cuts a word at the edge.
- Grey words on black; a plate behind everything; borders to fix contrast.
- A number on a card the creator did not say; a source line where a rank was owed.
- A comparison whose two rows speak different languages.
- A metaphor that changes state before its full state was seen.
- A capture padded to a tall viewport instead of cropped to its content.
- A builder forbidden to change anything, so a wrong row becomes a wrong card with nobody able
  to say so.
