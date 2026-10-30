# A creator's presentation is earned separately

## Goal and precedence

The new format's concrete explanatory craft is stable. The creator chooses its framing, split
balance, background, colors, captions, typography and shapes. Reference videos teach decisions;
they are not evidence that this person wants another creator's exact look.

Read current explicit instructions, the project brief and the saved format presentation. A project
exception wins within that project. A changed standing preference replaces the old value. Never
turn a local correction into a global rule without evidence, and never expire a choice through silence.
If a preference is ambiguous, preserve what is known and ask only about the meaningful conflict.

## First use

Prepare visual examples over a frame from the actual supplied recording: split, full visual and
presenter, with candidate caption placement and colors. Show the creator the stills (open them and give
their full paths). Reuse choices already supplied in the brief. Ask only for missing presentation
preferences; no repeating setup on every video. Agent preparation can continue while input is pending.

The renderer exposes the visual split, face crop, colors, styled caption lines and timed runs.
Read `rendering.md` for the separate presenter image transform, rounded room panel and real
frame-synchronous matte. Inspect the actual crop, hair edges and lettering before using the look.

## Saving a decision

Write a JSON choice with `scope` (`format` or `project`), `evidence` (the actual instruction),
`reason` (its meaning for future choices), and `look` (the complete resolved values). Then run:

```sh
node scripts/split-explainer/preferences.mjs save . <choice.json> [project-for-local-choice]
node scripts/split-explainer/preferences.mjs resolve . <project>
```

The format file is `workspace/library/split-explainer.json`, with a rewritten preferences page
beside it. Project exceptions live in that project's `presentation.json`. Resolution snapshots
the choice into `resolved-presentation.json`; use its look in the layout plan. Updating a choice
replaces the previous current page instead of growing an incident log.

Do not save guessed choices as approved. A technical fixture's values belong only to that fixture.
On a new correction, reconcile the complete resolved look rather than accidentally discarding
unmentioned valid settings. Keep an unresolved alternative in the brief, not as a competing default.

## Counterexample

The creator asks for calmer captions. Reducing every scene's explanatory content would change
the craft. Instead adjust caption emphasis and motion within the requested scope, then inspect
whether the existing artifact and meaningful operation still communicate clearly.
