# Build the explanation and inspect the actual composite

## Goal

Every builder contributes a clear part of one argument. The final picture must remain synchronized
to the verified master and its continuous recorded voice. Technical validity and creative quality
are separate checks; a passing renderer can still produce a weak explanation.

## Before delegation

Run `node scripts/split-explainer/validate.mjs <project>` on the complete plan. The lead first writes
the shared parts every builder imports and never redraws: the cast member, the real marks, and any
object two scenes share with its position at the handover. Then one builder brief for all builders:

- the files to read: the plan (the whole argument, their scenes in full, and the scenes either side),
  `layout-plan.json`, `research.md`, the words with their master frames, the shared parts, and
  `motion.md` pasted as written;
- the contract: one owned file `visuals/<Family>.tsx` (helpers `visuals/<Family>-*.tsx`), a pure
  function of the frame, seeded randomness only, the exact region in pixels for split and full visual,
  where the captions and the presenter's hair sit, the fonts registered, assets through `staticFile()`;
- the creator's taste in their own words, each turned into a rule;
- sizes for a phone: objects 900 px wide or more, body text 28 px or more, key text 40 px or more;
- handovers: the first frame matches the previous scene's last state where the plan says it continues,
  and an outgoing scene stops drawing a shared object once the next scene takes it, so no ghost copy;
- the self-check below, and a report of at most 200 words.

Each builder's task card adds its scenes: the words and frames each move lands on, the initial state,
the action and the result, and what it hands over. Six builders cannot supply a missing idea; the
card carries the idea, the builder brings the craft and may propose a better one.

Use six to eight narrow assignments for a full layer, in waves when concurrency is lower. One complex
scene may deserve its own builder. Each builder owns a separate file under `<project>/visuals/`; they
never overwrite a shared registry or another builder's work. Each renders its checks in its own
sandbox, a copy of the project (large media linked, not copied) whose `visuals.tsx` includes only its
family, because the renderer keeps one render folder per project.

## Builder self-check

Before reporting, each builder renders stills in its sandbox at the first frame of each scene, every
anchor word, three consecutive frames in the middle of a fast move, the settled result and the last
frame, reads every still at full size, and fixes clipping, collisions with captions, small text,
off-centre objects, empty or frozen frames and anything generic. A short `--range` checks motion.

## Merge

The lead writes `<project>/visuals.tsx`, the dispatcher that exports `Visual`, a React component
receiving `{scene, frame, width, height, look}`, and owns cross-scene consistency. `frame` is
scene-relative; a Remotion Sequence also scopes `useCurrentFrame()` locally. The region is the upper
portion in split and the configured visual region in full visual. Do not reach around the region to
change global styling or draw the human clip. Assets use `staticFile()` relative to
`<project>/assets/`, so the renderer can stage one project.

Heavy 3D scenes can render tiled in headless Chrome. If a still shows tiles, render with
`RENDER_GL=swangle RENDER_CONCURRENCY=1`.

## Caption contract

Read `rendering.md`. `captions.json` retains `{from,to,text}` in master frames and can use mixed
lines, timed runs, typography and flexible position. Group and emphasize from the spoken argument; don't
mechanically caption every word or obscure an artifact with duplicated labels. The caption region
changes with the mode. Use an actual font file under project assets for a custom face.

## Render and review

```sh
node scripts/split-explainer/validate.mjs <project> --built
node scripts/split-explainer/render.mjs <project> --still <frame>
node scripts/split-explainer/render.mjs <project>
```

Inspect significant states and actual face crops using composed stills. Include the opening,
mode boundaries, each action's before and resolved state, large payloads and the invitation.
Replay short movement ranges when stills cannot establish causality, timing or reading time.
If an object feels generic or an action fails to explain the idea, revise the idea and send precise
notes to its builder. Merely darkening its background does not fix a weak concept.
Watch the whole export as a viewer: something moves in every visual scene, no stretch sits frozen for
more than about a second, one thing at a time owns attention, and every animation finishes and is
seen before the next change.

The renderer stages transparent graphics in the project's own `.render` directory. FFmpeg creates
the correct full or lower human crop on the same master timeline and composites the graphics.
It maps the master's audio once with stream copy. Full visuals cover the person; presenter scenes
leave only captions on transparency. The optional real foreground matte and rounded room panel
are composited between artifacts and captions; inspect them on this recording as `rendering.md` explains.

The source portrait may need different `faceX` and `faceY`; both are normalized crop positions.
`splitTop` determines the upper graphic fraction, with an even pixel boundary. Do not inherit the
reference creator's geometry. The first renderer supports 1080x1920 at 30 fps, matching the cut
foundation. The preparation adapter converts original camera cadence to this timebase without
speeding up the recording; a different output timebase needs an explicit tested adaptation.

`final.mp4` is the visual export. `render-check.json` records its frame count and audio mapping.
Inspect the actual final file for readability, clipped content, awkward mode changes, synchronization,
source/result consistency and any renderer-only faults. Repair defects and render again.

Copy the checked file to `workspace/output/<date>/` with a descriptive sequence name. Write
`delivery.json` with `output` (an absolute path or a path relative to the installed workspace)
and `checks` (the specific inspections actually performed), then refresh `steps.mjs`.
For example: `{"output":"workspace/output/2026-09-16/01-example.mp4","checks":["Opening and mode changes replayed","Source and result matched"]}`.
Do not write delivery before the file exists or claim that the technical layout fixture is a
fresh creative evaluation. Give the creator the full file path and a Downloads copy where appropriate.

The starter reports actual tasks and render progress through the shared runtime. This does not
establish a dedicated app route or native preview integration for the new format.

## Sound

The first export contains only the recorded voice. After delivering it and the hook variants, ask once
about soft sound effects and follow `sound.md`. Keep the silent-voice export; the effects version is a
separate file.
