# Creator Format 3 visual grammar

This file converts the five forensic analyses into reusable content-to-visual rules. It complements
[`creator-format-3-system.md`](creator-format-3-system.md), which owns parent layout, captions, typography,
palette, layering, and motion timing.

## Core editorial law

Every important noun, number, verb, relationship, and CTA keyword should become a legible object or
state change at the word or clause where it is spoken. The visual does not merely restate the
caption. It demonstrates the claim.

## Speech-to-visual routing

| Spoken meaning | Visual family | State behavior | Preferred mode |
|---|---|---|---|
| Named platform or product | Real mark plus plausible product artifact | Resolve the mark or card on the name | split |
| Open source, license, stars | Repository card or real GitHub capture | Build identity first, then count, then license or final star state | split |
| Simple free claim | Giant `$0` or categorical hero word | Clear competing UI, land the value, hold | split or face |
| Large count | Literal grid, rows, cards, or giant tabular numeral | Count through believable intermediate values and ease into the result | split or overlay |
| “Many,” “all,” or “entire system” | Repeated component family | Fan out or populate a grid, then hold the completed set | overlay |
| Ordered list | Repeated rows with consistent geometry | Reveal in spoken order | overlay |
| Workflow or procedure | Contextual terminal, cards, and cursor | Type or perform each named action, preserve cause and result | overlay |
| One object produces another | Vertical two-object stack | Move the cause upward as the result enters below | overlay |
| Resource routing | Reusable quota cards plus path | Exhausted card exits left, next card takes center, path remains visible | split |
| Before and after | Realistic full artifact, isolated fault, corrected artifact | Establish before, isolate or strike fault, restore resolved state | split or overlay |
| Reduction | Fixed slots or bars | Remove one at a time until the final count | split |
| Comparison | Symmetric two-column cards | Hold workload constant, change only the compared state | split |
| Recurrence over time | Day pills plus cumulative result | One discrete time state and one result jump per interval | split |
| Real proof cue such as “watch” | Actual screen recording | Brief face reset, then real screen with cursor, pan, or native status | face, then split |
| Direct human consequence | Remove designed UI | Return to full face and lower captions | face |
| Comment keyword | One giant upper headline | Enter on keyword, persist while normal captions state delivery | face |

## Reusable component families

### 1. Source and authority proof

- Repository card with owner, name, description, stars, license, tags, and believable metadata.
- Official documentation crop with the cited sentence at readable scale.
- Yellow highlight sweep only over the exact sourced claim.
- Real screen capture when a live value is more credible than a reconstructed one.

Do not fabricate dense browser chrome when a clean designed card is enough. Do not fabricate a
source page when the narration attributes the claim to official documentation.

### 2. Counted proof

- Eased number roll with tabular numerals.
- Literal page, item, prompt, provider, or row count when the number is small enough to perceive.
- Grid fill for known categories, such as 35 checks.
- Row accumulation for records or leads.
- Two concurrent counters when the meaning is “both” or duplicated work.

The final number must hold long enough to read. Do not start at the answer.

### 3. Input, transformation, result

- Input composer or file chip for upload and paste actions.
- Intermediate stack or terminal for conversion and processing.
- Structured output card for the result.
- Before and after states must differ materially in hierarchy, not only color.

Examples in the references include PDF to images and text, messy sentence to structured prompt,
terminal crawl to clean sheet, draft to humanized post, and source file to Markdown.

### 4. Contextual terminal

- Shell uses developer mono, dark surface, restrained header, and plausible command grammar.
- Commands type only when the narration names the action.
- Success lines stagger in order and use muted green locally.
- Terminal can use the perspective trapezoid entrance, but settles front-on before reading begins.
- Terminal microcopy must reflect the actual subject. Placeholder code breaks the style.

### 5. Repeated object system

- One reusable geometry, varied identity or state.
- Use for skills, providers, comments, prompt checks, weekday states, compatibility rows, or files.
- Consistent slots make differences readable.
- Selected state keeps coral or functional color while non-selected states lose saturation or opacity.

### 6. State-machine card

- One stable shell.
- Narration verbs cause internal state changes: build, rebuild, fix, deploy, live, route, copy,
  install, approve, reduce, or remember.
- Use concrete labels, filenames, commands, bug names, URLs, and result states.
- A generic progress spinner is insufficient when a literal state can be shown.

### 7. Real screen proof

- Use native UI density and visible cursor behavior.
- Edge-to-edge top-half footage is allowed. It does not need a rounded light shell.
- Crop or pan to the proof, but retain enough native context to establish authenticity.
- Reserve directional blur or zoom wipes for adjacent real screens in one action chain.

### 8. Statement and CTA heroes

- Statement hero: two or three short lines over full face, revealed on speech. One functional success
  color can mark the payoff word.
- CTA hero: one giant keyword in the clear upper band, usually white with dark or studio-red depth.
- Normal phrase captions continue beneath the persistent CTA hero.
- No button, badge, logo, comment bubble, or extra instruction competes with the keyword.

## Component geometry

All coordinates are normalized to 1080 x 1920.

- Split stage: full width, top `.500H`.
- Common split card: `x=.04-.08`, `w=.84-.92`, with bottom no closer than about `.045-.060H`
  from the seam caption.
- Narrow split card: `x=.12-.15`, `w=.70-.76`.
- Full overlay main column: `x=.06-.11`, `w=.78-.88`.
- Full overlay tall system: usable `y=.06-.93`, planned around one fixed caption lane.
- Light-card radius: 18 to 34 px.
- Light-card inner padding: 28 to 52 px.
- Repeated-row gap: 12 to 24 px for compact UI, 24 to 40 px for distinct cards.
- CTA headline: roughly `x=.10-.90`, `y=.16-.29`, maximum two lines for a statement and one line
  for a keyword.

## Timing alignment

- Named object appears on its noun, never before the viewer has context.
- Action state starts on its verb or within 300 ms after it.
- A list reveals in the same order as speech.
- A number can begin before the spoken final value, but must land on or just before the final number.
- A completed complex state holds for at least 600 ms, preferably 1 to 3 seconds when dense.
- Parent mode changes land on the clause boundary, usually as a hard cut.
- CTA keyword appears on the keyword and remains until the video ends.

## Cross-video invariants

Supported by all five references:

1. Exact 50/50 proof-over-face is the default.
2. Caption pill straddles the seam in split mode.
3. Full overlay is opaque and selected by information density, not decoration.
4. Full face is the control state for direct rhetoric or conversion.
5. Cards and interfaces use warm matte surfaces and neutral UI typography.
6. Speech captions use a separate pixel-mono uppercase language.
7. Major chapter changes are hard or nearly hard cuts.
8. Internal motion describes the claim through counts, typing, routes, rows, checks, or progress.
9. Real proof and simplified explanation are visually distinct.
10. The CTA is one persistent giant keyword over the full person.

## Evidenced variants, not global laws

- Full-overlay caption position can be central or lower. Select one fixed lane from the composition.
- Some reels use a faint grid canvas; others use a flat warm plane.
- Real dark proof can sit on a black and red studio-derived matte, or fill the top stage directly.
- A short kinetic statement can temporarily replace the caption pill before the final CTA.
- Same-family swaps are often horizontal, while long procedures are usually vertical.
- Success green, yellow highlight, LinkedIn blue, GitHub violet, and other platform colors are local
  semantics, not a shared decorative palette.

## Failure conditions

Reject a render if any of these are true:

- The split is not exactly 50/50.
- The creator is blurred, dimmed, or visible under a full opaque overlay.
- One compact object uses the full frame without a readability reason.
- A tall multi-step workflow is crushed into the upper half.
- Captions overlap component text because no fixed caption lane was planned.
- UI text is abstract filler instead of contextual copy.
- A number is shown but not demonstrated through count, quantity, or state.
- Major cards drift or loop while nothing semantic changes.
- A real logo is placed on an invented tile when the artifact should carry the mark naturally.
- The CTA adds a button, secondary card, or multiple competing keywords.
- Creator Format 1 square cards, Creator Format 2 glass, global blur, or top-band-only geometry appears in this style.

## First implementation gate

Before building the full component library:

1. Implement the three parent modes and all four caption presets.
2. Render crop calibration stills for split and full face against at least two reference frames.
3. Render a font comparison sheet for caption, UI, terminal, statement, and CTA roles.
4. Build five representative primitives: repository proof, counted grid, contextual terminal,
   two-column comparator, and persistent CTA keyword.
5. Recreate the first 10 seconds of one approved source as the fidelity gate.
6. Only after visual approval, generalize the remaining state-machine and real-proof families.

