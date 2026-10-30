# Timing: a visual lives as long as its idea

Stages 3 and 3b, the clock of every card. The plan row carries the timing (`03-visual-plan.md`),
the builder executes it (`04-visuals.md`), and `lint_visuals.py` measures it before anyone sees a
frame.

## Goal

A card enters on the word that names its idea and leaves on the last word of that idea, after a
hold long enough to read the finished picture. Never before: a card that cuts while its sentence
is still running reads as a mistake, however good the card. Never long after: a card with
nothing left to say, sitting under the next idea, is dead time. And the motion inside the card
runs on the clock the words describe: beats on the words and then a hold by default, a
continuous run only when the motion itself is the claim, a still when the sentence names a
thing to read.

## Reasoning

A fixed duration is the wrong variable, in both directions. A ceiling ("never more than three
seconds") was set against cards that overstayed, and once it became a law it produced the
opposite fault: cards cut mid-sentence, with the rest of the idea pushed into "bare on purpose"
as if the speaker had stopped talking about it. A floor ("let the animation finish") produces
cards that linger under the next idea. Both are one fault: the card's life was tied to a clock
instead of to the words.

The variable is the idea's span in the narration. The card leaves on the last word of its idea
whether that is one second or five after it entered. Length by itself is never a fault: a card
may run as long as it keeps bringing new motion for what is being said, and a long card that has
stopped moving is the fault. What the old three seconds keeps is the hold: once the picture is
finished, a viewer needs about half a second to read it and rarely more than a few, so a
finished card still up well past its last word with nothing new on it is the overstay coming
back.

The same reading settles "bare on purpose". A stretch with no card is right when it is a run-up
that ends on a function word and hands to the next picture ("but a chip is nothing without
the"). It is wrong when the stretch carries a payload word: a date, a credential, a rival's name,
the thesis. A bare stretch that follows a card on the same idea is that card stopping early.

And the clock inside the card comes from the words too. Continuous motion works where the motion
IS the claim: a flywheel lapping faster and faster under "each loop makes the next one faster",
a dense file gliding under "so low-level", a feed scrolling at a rate per second. It fails where
the viewer has to read a state: a moat that fills and drains in one move is not understood until
the full moat is held before the drain lands on its word; scattered chips read as noise until
they land on one cadence. A number, a comparison, a name, a ranking is read from a finished
picture, so those cards move on their words and then hold. Motion is read while it runs only when
the words describe motion.

## The three clocks

| clock | when the words say | what the card does | the hold |
|---|---|---|---|
| **beats** (default) | a state, a number, a comparison, a name, a step | motion on the words that name each part, then the finished picture holds | a beat's worth after the last beat, through the last word of the idea |
| **run** | a motion, a growth, a speed, a loop, a density, "more and more", "faster and faster" | one continuous movement at a rate per second, the object recognisable the whole time; the card ends on the idea's last word, the motion does not "finish" | none needed |
| **still** | a thing to read: a page, a photo, a repo line, a quote | pops complete, a slow push at most, the moments around it move | its whole life is the hold; a second or two reads |

A change of clock is a refinement of the same object, never a new object: "keep the visual we
have and make it faster" turns a beats card into a run without touching a node. A `run` card is
briefed with its rate, never its duration, so a longer card never slows its motion.

## Priority

1. The plan row names both words before any millisecond is written: `in on` (the trigger) and
   `out on` (the last word of the idea), both from the ideas table. Duration is derived.
2. Never cut a card while its idea is still being spoken. The event carries `until`, and the lint
   fails a card that leaves before that word ends, unless the next card takes the same idea over
   on that frame (a hand-over: a sentence sweep handing to the drawn object that pays it off).
3. The hold is budgeted first and the state after the last beat is the complete picture: labels
   landed, bars settled, the moat full.
4. Bare only on a run-up. A clause with a payload word gets a picture that stays until the word
   is said. List every bare stretch in the plan with its words and read them: if one could be
   shown, it is not bare.
5. A long card keeps moving. A card up well past its last word with nothing new on it is the
   overstay; `long` on the event records the judgment when a dwell is wanted.
6. Pick the clock from the words: `run` for motion or growth, `still` for a thing to read,
   `beats` otherwise. Write it on the row.
7. Entry on the word, never early, under a third of a second late. A deliberate early pop is
   written on the trigger as a note (a full moat seen for a beat before it drains on its word).

## What good looks like

- A lab bench: probes touch on "site", the needle swings on "performance", settles on "chip", and
  the settled meter holds while the rival is named. The rival on the card is the rival being
  spoken.
- A flywheel over six seconds: nodes light on their words, the packet closes a lap on "year", and
  from "each" every lap is shorter than the last with a trail that grows with the speed, handing
  to the CTA on its word. The words described a motion, so the card's clock became the
  illustration.
- The hook's comparison lands on its punch word and holds into the next clause; the next card
  enters on the first payload word of the next idea.
- A real sentence swept to its last word, then the drawn object takes the same idea over on that
  frame, full, and changes on the word that pays it off. Two cards, one idea, no bare frame
  between them.

## Traps

- A card cut at a round number of seconds under a clause that was still about it.
- A card whose motion "finished" two seconds before its idea did, leaving the thesis bare.
- A run card mapped over the card's life instead of a rate, so its speed halved when the card
  grew.
- A card still up under the next sentence, long after its last word, with nothing new on it.
- A payload typed in the last half second because the hold was not budgeted first.
- One card for five seconds over four ideas: too long was really too few pictures.
- A metaphor that starts changing on its entrance, before its full state was seen.
