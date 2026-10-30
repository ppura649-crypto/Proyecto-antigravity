# The refinement round and the delivery: a note changes what it names

Runs once after the full build of a layer (their round), and again at every delivery. This is the
pattern for HOW a correction is applied and what a delivery must prove, on any stage.

## Goal

Their note lands exactly where the creator pointed, nothing the creator already approved moves, and what ships is
the file the creator thinks it is. One correction round per layer, then done.

## Reasoning

The refinement round is a step of the process, not a failure of the build before it. On
reference edit A their single round of six notes was the biggest quality jump of the
layer, and it worked because each note had a fixed shape: the moment, what is wrong, the
reference. All six were applied in one pass and nothing outside them moved.

The rounds that went wrong all misread the SIZE of the note. "the text is a bit too white, or
too transparent" is a note about text; it was applied as a structural law to eleven cards and
destroyed a layer the creator had just called perfect ("i didn't mean all the cards or everything").
"copy her style" on reference edit A was answered by changing the colours of their own cards ("you just
changed the colors"). A font change on cut-tight reached some typography and not all ("triple
check it didn't affect all"). A stage-3 rebuild reached into the hook. The same failure, four
shapes: a change applied to more, or less, or something other than what the note named.

Delivery had its own failures. A failed render's old file was ramped and shipped as v5 = v4
; a stale render shipped under a new version name; check frames were pulled from the
render instead of the delivered file. `deliver.mjs` now refuses each of those.

## The note, and the size of the fix

The creator writes in a fixed shape, and the fix is read off it:

| their note names | the fix touches | example |
|---|---|---|
| one moment ("the visual at 18th second") | that event only | reference edit B: the split card's plates went solid, nothing else |
| one property everywhere ("too transparent", "make the names bigger") | that property, on the cards the creator can see it on, shown on ONE card first | reference edit D v3: type up ~20%, white, halo kept |
| one object ("the tree branches too tall") | that object's geometry, not its neighbours | reference edit B: branch gap from the marks, packet deleted |
| a replacement ("lack creativity", "just text") | a different OBJECT for the same claim, never a tuned version of the rejected one | reference edit D: stat panel → a thing that empties |
| a global ask ("change the font") | every piece of the reel's own typography at once, verified by grep | cut-tight: `--reel-font` reaches all |
| a cut change ("we don't hear the last word") | the clip, then the mechanical shift of every later layer, contents untouched | reference edit B: last clip only |

Before rendering a refinement: `lock_layer.py diff <project> visuals` prints how many events the
change touches. If their note named one thing and the diff says eleven, stop, change one, show one
still. Approved layers stay locked through the round; a note that needs an approved layer to move
is an explicit `unlock` with their words in the log, then a re-lock.

## Three standing checks the creator asked for by name

- **Off-subject headers.** Every authored word on a card (heads, labels, axis names, chip names,
  agent names) is in the transcript or names the speaker's own subject. The lint warns; the fix
  is their noun. "are we out of subject?" (reference edit A, CLAUDE.md in a video about skills).
- **Logo quality.** Every mark is logo.dev at 1200 px or the brand's own asset, a MARK not a
  wordmark, the white form when the file is a black glyph, no tile or background, the name under
  it in the caption font at the pack's size. "the logos bigger and names as well for all logos"
  (cut-tight), "use the logo.dev logos for claude and openai, to have better quality logos".
- **SFX picks.** Only files from the approved palette in `05-sound.md`, only on meaning beats
  named in the plan, never on a transition, presence measured. The riser climaxes on the punch;
  the arrow whoosh marks a sweep; a blip marks a "?" or a block landing; a pop and a real click
  on the save CTA. "THOSE TWO ARE HORRIBLE ... delete this as well i hate it" (the swooshes and
  the transition whoosh).

## What a delivery proves (`scripts/deliver.mjs`)

In order, each one a refusal: every locked layer's hash unchanged; `hook_build.py check` passes;
`lint_visuals.py` passes (or `LINT=skip` with the reason said in chat); the render is newer than
everything that feeds it (json, format, master, `remotion/src`, the pack's format file); the
version name is new; the ramp from `format.json` is applied; the file differs from every earlier
version under the same name; check frames are pulled FROM THE DELIVERED FILE at the moments where
the change shows, and read before the path is printed.

## What good looks like

- six notes, one pass, hook untouched. "The hook (first 10 seconds are
  perfect). Let's focus on the after."
- three notes (tree, transparency at 18 s, last clip), three changes,
  ten events byte-identical, delivered with 15 check frames from the delivered file.
- "put all the overlay slightly lower ... names bigger ... Otherwise
  it's perfect" applied as +0.035H on every card and one size on every name. A global note,
  applied globally.

## Traps

- A note about text weight applied as plates on eleven cards.
  "NOOOO I hate it... i didn't mean all the cards or everything". Then borders. "NOOOOO no borders".
- a style copy applied as a colour change. "you fucking just
  changed the colors".
- a font change that reached the captions and not the card headings.
  "When i want a change in font, it should affect all font pls".
- a stage-3 rebuild that rewrote the approved title and added a reveal.
- a byte-identical copy of v4 shipped under a new name after a failed
  render; caught by md5 the second time, now refused by the script.
- check frames read from the render while the ramped file shipped.
