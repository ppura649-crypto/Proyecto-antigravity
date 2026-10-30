# Building the new style

The new style is split explainer with a different format. Same cut, same planning, same builders, same
checks, same motion and the same bar. What changes is how the picture is laid out, how the person is framed,
the captions, the rhythm and the sound.

## The skill

Copy `.agents/skills/split-explainer/` to `.agents/skills/<slug>/`. Then:

- `SKILL.md`: the name and description (one line, no angle brackets), the promise in this format's words,
  and the modes this format uses instead of split, full visual and presenter. Keep its structure and length.
- `references/planning.md` and `references/examples.md`: rewrite around `FORMAT.md`. Each mode with its
  reason, and passages from the study turned into examples of a decision and the alternative it beat.
  Never paste the study; distil it.
- `references/presentation.md`: the measured look as the default look (layout geometry, captions, ground,
  camera), still changeable by the person.
- `references/rendering.md`: how this format's modes, zooms and captions are expressed with the renderer.
- `references/sound.md` and `references/hooks.md`: keep the method; add what the study found about this
  format's sound and hook structure.
- Keep as they are: the cut references, `motion.md`, `feedback.md`, `build-and-deliver.md`. Add to
  `feedback.md` only notes the person gives about this style.
- Add `references/format.md`: a copy of `FORMAT.md`, the study the decisions came from.

Wherever the copied text names split explainer's modes or look, change it to this style. Its scripts stay
split explainer's, run from `scripts/split-explainer/` exactly as before: they only accept a project marked
as split explainer, so a project of this style is `workspace/projects/<date>-<slug>-<subject>/` with
`project.json` holding `"format": "split-explainer"` and `"style": "<slug>"`. Create it with the steps script's
`--init`, then add the `style` line. The workspace lists it under this style.

## The renderer

Use split explainer's renderer and compositor (`engine/split-explainer/`, `scripts/split-explainer/`): they
place a presenter picture with its own crop and scale, a room panel, a cut-out person, full visuals, and
captions styled word by word. A zoom is a change of the presenter crop over time. When the format needs
something they cannot express, write that part in `workspace/library/talking-head-formats/<slug>/render/`,
starting from a copy of the file it extends, and have the skill use it from there. Never change `engine/`
or `scripts/`: an update replaces them and the style would break.

## Register it

Write `workspace/library/talking-head-formats/<slug>/format.json`:

```json
{"name": "<Short name>", "skill": "<slug>", "what": "<one plain sentence on what the viewer sees>", "example": "example.mp4"}
```

`example.mp4` is the test video from step 5, in the same folder, small (720 px wide). The workspace then shows
this style beside Classic and Split explainer under Pick your style, and its videos under Talking Head.

Then `node scripts/add.mjs --mirror` so Claude Code and every other agent see the new skill.
