# Script, voice and caption

## Goal

One text file, `caption.txt`, that is at once the script, the caption the viewer reads, the list of key words and the
list of scenes. Everything downstream (word times, handovers, cues) is computed from it and from the voice.

## Reasoning

The format lives on the caption: it fires about four times a second for the whole reel, so the frame is never still
and every stage event has a visible anchor, the word turning white at the instant the picture changes. That only works
if the caption is the script itself. A caption transcribed from the voice drops and mangles words; on the references
one dropped word reversed the meaning of a hook. So the caption is authored, the voice is aligned to it, and the
aligner reports every place where the two disagree instead of choosing silently.

Sentences are short declaratives at a flat 3.0 to 3.9 words a second: about 120 words for 35 s, 200 to 250 for 60 to
70 s. The pacing device is the picture, never the voice. Silences between sentences are where scenes change, so a
script with no full stops has nowhere to turn a page.

## The script

- **Hook, inside 3 s:** the viewer's own thing or a fresh discovery, plus a number or a count. "Your vibe-coded app can
  get sued for $100,000 before it makes a single sale." "Don't start vibe coding with Claude Code unless you've
  installed these 4 plugins." "Someone just open-sourced a repo that..." The product's name can wait 4 to 5 s.
- **The creator's gold standard** (`engine/full-visual/reels/chrome-fingerprinting-us/script.txt`, "the best best one"): "Google Chrome
  is just another spyware, let me tell you exactly why:". A blunt verdict on a thing the viewer uses every day, said
  as a friend would, then a promise to prove it. Then spoken glue carries the explanation: "Ok so here's what just
  happened:", "Basically,", "And this is what's called...", "We're talking about...", "This is actually...",
  "Unfortunately,", "So switch browsers." Every hook is measured against it: would it stop a viewer mid-scroll?
  Sentences are whole and smooth, the way people talk, one idea each, each following from the last; never clipped
  fragments for rhythm ("Electricity. Nuclear.") or a stiff written order.
- **Open loop, inside 6 s,** when the reel has a payoff to withhold: "...fixed with one prompt that I'll give you at the
  end." This is what a countdown pill then holds open.
- **Item unit (a list of risks):** setup ("Your X is..."), the fault in one clause, the multiplier, the number with its
  source. 7 to 12 s.
- **Tool unit (a list of tools):** "The Nth is NAME", "which VERBs...", the number. About 7 s when a number is enough,
  14 to 15 s when behaviour has to be shown. The last item of a list should feel different from the others.
- **Turn before the close** when the list allows one: a sentence that reframes everything said ("The word is per.").
- **Close:** always `comment "KEYWORD"` in this format (the creator's rule), said the way the references say it ("just comment ML,
  and I'll send you the links"), performed by a cursor in Instagram's comment sheet, and rewarded by the DM arriving.
- Every figure, name, statute and star count is checked at its source before it is written down. The references were
  not checked; copy their format, never their facts.

## caption.txt

```
== promise | ground: dark          a scene: its id (the key in scenes/index.tsx) and its ground, dark or light
and it can be fixed with one       one line = one caption block
💬 *prompt* that / I'll give you at   *word* = the key word; an emoji right before a word sits inline before it;
the *end.*                            " / " = break the rendered line here (without it the engine balances two lines)
== signup | ground: light
It starts with your / signup *form,*
@bottom                            the caption moves under the stage from the next block on (@top to come back)
so the first / 🧒 *13-year-old* who
```

### What good looks like

- A block is one breath of 2 to 7 words and never more than two rendered lines. It ends at a clause end, or
  **immediately before the word the picture is about to illustrate**, so that word opens an empty, centred line:
  `four`, `50%`, `unlimited`, `over 300`. That is the caption's strongest emphasis and it costs nothing.
- One key word per block, at most: every number, every product name, and the verb that carries the obligation (taxed,
  registered, swap, fix). Read the key words alone, top to bottom: they should be the reel's argument.
- One emoji per block, at most, immediately before the noun it names, and only where it is instantly legible.
- A scene starts where a sentence starts. `check.py plan` refuses a scene boundary with less than 0.15 s of silence.
- The caption goes `@bottom` only when the stage needs the top (something hanging from the top edge). The caption moves
  for the stage, never the reverse, and it has one bottom position, not several.
- Pinned chrome is chosen here, in `reel.json`: a countdown `pill` when the script withholds something until the end, a
  `terminal` when every claim can end as a line in a session log, `none` when the opening plants the loops itself (for
  example every payoff shown as a small tile in the first second and ticked off at the close).

### Traps

- Writing the caption from a transcript. The caption is the script; the voice is matched to it.
- Ignoring an aligner "!" line. Each one is a place where the viewer would read one thing and hear another.
- Trusting recognised word times at a sentence end. Recognisers stretch the last word into the silence; `align.py`
  pulls words out of measured silences, but a synthetic voice with `voice.alignment.json` is exact and is the way to
  frame-accurate captions.
- Key words on everything, or on adjectives. A mark on every word is a mark on none.
- A three-line block. The engine throws; break the line in `caption.txt`.
- A scene change in the middle of a sentence. If the picture must change there, it is the same scene changing state.
