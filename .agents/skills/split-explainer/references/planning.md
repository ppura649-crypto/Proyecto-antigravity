# Plan the understanding, then its visible operation

## Goal and reason

The viewer should understand a useful idea without decoding an arbitrary collection of cards.
Planning fails when it translates nouns into components before deciding what relationship or change
must become visible. Detailed implementation of a weak concept does not repair that failure.

Read the whole transcript first. State the opening promise and the questions the body answers.
Decide which claims need evidence, which mechanisms need a demonstration, and which sentences are
best carried by the person. The visual layer supports the recorded argument; it does not invent
a new script, stronger claim, or different creator voice.

## Pattern

For each coherent passage, describe the viewer question and the intended understanding. Choose
a real surface or concrete object with the parts that make it recognizable. Research its actual
content before drawing it. Decide whether the host should remain present, whether the artifact
needs sole attention, or whether the person should explain the consequence.

Choose the picture from what the claim needs. Identity often needs the real artifact or interface.
A mechanism, comparison or process may be clearer as a designed physical object, connected parts,
or a drawing whose operation teaches the relationship. Quantity needs a sourced chart or an
explicitly illustrative one. A list of different tasks can become distinct, recognizable task
objects; it need not become rows in a table. A real interface earns its time when its controls,
content or behavior are the point. Its authenticity alone does not make the explanation useful.

Hold every picture to `motion.md`. A mechanism usually explains best as a physical object performing
it, directed like a shot, with depth, material and light: a crowd at a door, a turnstile, a shelf
filling, a pass turning gold. Real marks stand for real companies and products, fetched, never drawn.
Draw for the audience the creator actually has: if they are not technical, remove axes, logs, code
and dense tables and keep one idea readable in one glance. Name one cast member (a character, an
object) that threads the whole video small, and give every idea a new main picture; never make the
previous scene's hero the next scene's hero.

Challenge the mix across the whole film. Several truthful screenshots can still feel repetitive,
as can several attractive cards. Change the visual language when the viewer's question changes,
while retaining object identity and meaningful continuity. This is a choice of explanatory form,
not a quota of interfaces, cards or charts. Preserve the creator's layout and presentation choices.

For a mechanism, give the object a verb. Establish a before-state, show an operation, reveal its consequence,
and resolve a readable result. The camera may establish, select an active region, follow a handoff
and return wide. Or the camera may remain still while contrast moves among fixed alternatives.
An entrance animation is not the same as explaining the operation.

These fields serve the passage, not a compulsory sequence. A naming beat may establish identity
without an operation; a presenter passage needs no artifact or animated before/after. A learning
offer can progress through audience fit, depth, practice and credentials. A list teaser can preview
selected useful items and reserve the rest for an honest invitation. Choose the route the actual
recording supports rather than forcing every argument into a mechanism demonstration.

Timing follows the spoken proposition and reading needs. A complex artifact may arrive before
its name to allow inspection. A selected branch may change on a noun. A success state can land
on the consequence. The final result needs a useful hold; do not blindly copy a reference that
cuts away immediately after completion. Record the reason for deliberate anticipation or delay.

## Layout is a viewing task

Split preserves the host while a compact source, object or action is understandable above.
Full visual serves comparison, selected evidence, relationships, tall artifacts, media examples,
or emphasis. It may leave large margins. Presenter carries interpretation, conditions, questions,
reassurance and invitation. A use-case list can remain on the person if no new visual is needed.

Keep the video dynamic: change mode when the argument turns, and most passages turn within a few
seconds. Do not enforce percentages or a timer; the context decides. A full visual can introduce a
simple identity. Subsecond presenter punctuation can be meaningful. A strong move can remain in one
mode for several clauses while it is still moving. A full visual owns the whole frame on one ground,
never half one ground and half another, and no part of the presenter shows at any of its frames.
The presenter enters and leaves the split panel by one smooth eased move, never a jump or a flash.

## Creative challenge

Compare plausible alternatives, not an obviously bad icon against the only developed idea.
Ask what each candidate lets the viewer understand, what it demands they read, and what action
it can show. Examine the full sequence for repeated framing, repeated verbs or arbitrary resets.
Write a scene-specific critique and revise the concept when it fails, before implementation.

Six builders cannot supply a missing idea. They need actual content, named parts, composition,
spoken beats, dimensions and asset paths. Their craft can improve the concept, but the lead
must reconcile any proposed change with the argument and neighboring scenes.

## Files and contract

`visual-plan.md` contains the goal, audience, resolved brief, complete argument, source research,
scene decisions, alternatives and meaningful self-critique. Sources carry actual paths or URLs,
what they support, and whether a reconstruction is illustrative. No invented metrics or commands.

`layout-plan.json` is the render contract:

```json
{
  "fps": 30, "width": 1080, "height": 1920, "frames": 300,
  "look": {"background":"#f5f4ef","ink":"#171a20","accent":"#cf684c","splitTop":0.56,"faceX":0.5,"faceY":0.7,"captionSize":62},
  "scenes": [{
    "id":"explain-01","from":0,"to":300,"mode":"split",
    "viewerQuestion":"What does the incoming message change?",
    "understanding":"The message is displaced by later arrivals.",
    "artifact":"The verified inbox capture and identified target message",
    "provenance":"assets/inbox.png; illustrative content approved in the brief",
    "reason":"One readable inbox fits above the person who explains its consequence.",
    "initial":"The target message is visible near the top.",
    "action":"New rows insert above it and move the existing list together.",
    "result":"The target has moved below the initial attention area.",
    "captionJob":"Short spoken phrases, without duplicating the target subject line.",
    "anchors":[{"wordIndex":0,"frame":0,"role":"Establish the situation"}]
  }]
}
```

This is a shape example, not reusable content, verified geometry or a real word map. Replace every
choice from the actual recording. `from` is inclusive and `to` exclusive, with contiguous coverage.
Anchor indices refer to `aligned-words.json` after the cut; deliberate timing offsets include
`leadReason`. Optional scene `background`, `captionColor` and `visualHeight` adapt native artifacts.
The renderer uses `visualHeight` as a fraction only for full visuals; default is 0.7 of the canvas.
Presenter scenes omit artifact, provenance and initial/action/result. Identity scenes can state
their honest held state in those fields. They do not need invented activity to satisfy the plan.
Crop positions must come from composed frames of this recording, never copied from this example.

`captions.json` is a non-overlapping array of `{from,to,text}` in master frames. Optional `size`,
`color` and fractional `y` serve intentional payloads. Verify text against the corrected transcript.
Do not automatically create one caption per word or treat caption coverage as visual coverage.

## Evidence and limits

Native UI makes a scene recognizable, not automatically true. A source chart must support the
specific spoken metric and baseline. A terminal capture may illustrate work without proving a
particular tool caused it. Prefer a relevant real input, meaningful action and corresponding output.
Do not claim exact easing, SFX timing or a creator's private intent from visual samples.
