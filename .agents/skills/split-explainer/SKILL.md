---
name: split-explainer
description: Edit an original talking-head recording into an explanation that moves between a lower presenter with upper visuals, full visuals and full presenter. Includes the complete cut, word synchronization, a visual plan, cinematic visuals built by focused builders, five hook variants, motion checks and recorded-voice export. Use for this separate format; preserve existing Talking Head projects.
---

# Split Explainer

## The promise

One request owns the complete edit. Reuse the saved presentation, understand the recording,
prepare and verify the cut, develop the visual argument, build it, inspect its motion and revise
until the actual export is ready, then make the hook variants. One shot means uninterrupted
ownership, not speed or one attempt. A cut or a plan is not completion.

The first export includes the recorded voice and no added music or sound effects. Deliver it and
the hook variants, then ask whether the creator also wants soft sound effects (`references/sound.md`).

This is a separate format. Never modify the Talking Head format to make it work.
Use an installed workspace with this pack, not the source build folder. Keep each project under
`workspace/projects/<date>-split-explainer-<slug>/` and its output in this workspace.

## The bar

The explaining layer is the product. Every idea is a real thing or a physical object doing its
verb, directed like a film, real where the real thing exists, clear to someone who knows nothing
about the topic, one hero at a time, and the video is constantly in motion. Read
`references/motion.md` and `references/feedback.md` before planning; paste the motion brief and the
relevant feedback into every builder and hook brief as written.

## The craft

The frame follows the argument. Choose who or what should own attention for this passage, then
the meaningful operation inside the frame. Split keeps the presenter while a compact object acts
above. Full visual gives the object, comparison or payoff the whole frame, on its own ground,
never half one ground and half another. Presenter carries interpretation, a condition,
reassurance or the invitation. Change mode when the argument turns, so the video stays dynamic:
most passages change within a few seconds, a strong move may run longer, and there is no timer.
The presenter moves between modes in one smooth, eased move (`look.presenter.animate`), and when
the visual is full nothing of the presenter shows at any frame.

Read `references/planning.md` and the relevant cases in `references/examples.md` before planning.
The creator's look changes the presentation, not the depth of the explanation.

## Start and continue

Read `references/preparation.md`; the copied cut tools preserve the tested preparation,
selection, energy-based boundaries, cleanup and verification. Transcribe the complete source in
its own language (`--lang`). Cleanup is an editorial decision informed by transcript and audio.
Preserve complete words and the speaker's intent; a cut that clips a word is wrong in any language.
An already approved cut stays locked. This format never speeds up the recorded presenter.

Read `references/presentation.md` before applying a look. Explicit current instructions win
within their scope. Reuse saved format choices; a missing look needs one visual setup conversation.
Do useful preparation while waiting for genuinely missing input. Do not ask again on later videos.

## Plan before building

Read the complete cut transcript and research every claim at its source (`research.md`: what is
true, the real numbers, the real marks and interfaces to fetch). Delegate a bounded planning pass
to one specialist with the brief, research, aligned words, assets, `motion.md` and the planning
references. The lead keeps creative ownership: challenge the proposal, replace weak ideas and
reconcile the whole argument before builders start.

Every passage needs a viewer question, intended understanding, layout reason, spoken anchors and,
for an artifact, its initial state, action and result. Name the one cast member that threads the
video, and a new main picture for every idea. Give each visual scene a `builderFamily`. Write
`visual-plan.md` for understanding and `layout-plan.json` for rendering, then run
`node scripts/split-explainer/validate.mjs <project>`. It checks structure and real anchors, not
whether the idea is good.

## Build, inspect, finish

Read `references/build-and-deliver.md`. Before builders start, the lead writes the shared parts
(`visuals/shared.tsx`: the cast, the real marks, positions shared at handovers). Six to eight
focused builders, in waves if slots are limited, each own one family file and render its checks in
its own sandbox copy of the project, so parallel renders never share a render folder. Each gets the
builder brief, `motion.md`, its scenes' words with their master frames and the exact region, and
checks its own stills before reporting.

The lead merges the families in `visuals.tsx`, then inspects every significant state over the actual
footage and replays motion where a still cannot answer. Compare passages for repetition and clutter.
A review may replace an idea. Watch the export for any visual stretch that sits frozen for more than
about a second and give it life or end it sooner.

Render the transparent graphics and composite over the continuous master with its voice mapped once
(`references/rendering.md`). Stills precede the final render; they are the agent's checks, not an
extra approval gate. Inspect the final file, correct defects and render again when necessary.

Then the hook: read `references/hooks.md`. A dedicated hook director invents five concepts for this
story, five builders build them in parallel, and each variant is spliced onto the checked export.
Deliver `final.mp4` and the five variants with full paths, then ask about sound (`references/sound.md`).

Use `scripts/split-explainer/run.mjs` for long preparation commands so actual work remains visible
to the shared app task reader. Never tick a stage or claim completion because time passed.

## First-version boundary

A technical layout test does not establish creative quality on an unseen recording. Judge the
work by the export, against the bar in `motion.md`.
