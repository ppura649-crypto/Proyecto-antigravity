# Full Visual in the editor

The reader opens the reel paired with the project: `reelSlug` or `slug` in `project.json`, then the name after
`<date>-full-visual-`. It never picks an unrelated reel. The reel remains in `engine/full-visual/reels/`.

The editor draws the original scene components and keeps each moving scene, caption block, background and voice
as a separate item. Captions retain their word times, emphasis, line breaks and native look. Moves, trims, splits,
fades and transforms use the shared editor. Scene overlaps preserve the format's animated handovers.

Double click captions to move, restyle, time and animate individual words. A scene can expose named components
through `Editable` from `src/engine/Editable.tsx` and an `editableScenes` export beside its scene map. The scene picker
opens any scene; registered components appear in the list, on the canvas and in their own timeline lanes. The
contract and example are in `runtime/scripts/editor/EDITABLE.md` in the build folder, or `scripts/editor/EDITABLE.md`
in an install. Older scenes still need those named nodes before their internal parts can be edited.

Changing a caption does not retime the original scene's cues. Moving a scene does not move the voice
or background with it; select those items too when changing the whole passage.

If the scene code cannot build, the finished picture opens as a video with its original sound. Captions and motion
are then baked into that video. The source notes explain this limit; the reader never adds duplicate captions.

Tests: `node --test packs/full-visual/editor/*.test.mjs` from the build folder.
