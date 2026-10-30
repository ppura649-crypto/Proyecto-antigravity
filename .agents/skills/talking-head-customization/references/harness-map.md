# The current Talking Head customization surface

This is a map of Talking Head as it ships in a Keyframes folder. Re-check actual consumers before
relying on a field. It describes the current code; it does not modify it.

## Preserve the thinking

Read `.agents/skills/talking-head/SKILL.md` and its stage references as full patterns, not summaries.
They contain the goal, rationale, examples and failure modes. The six reference reels and
their plans are in `assets/talking-head/reference/`. Historical examples
can conflict with the current code. Keep them as evidence; never apply every historical rule.

The live Creator Format 1 uses Sora 700 in `engine/talking-head/formats/creator-format-1.json`; older caption prose still
describes Zen Dots. The no-speed-ramp checks supersede old examples of hook ramps. The timing
pattern describes idea duration, despite an old three-second line in `packs/README.md`.
A creator's stated preference overrules the original creator's early-object and styling
defaults. Preserve this reasoning when adapting.

## Appearance settings that are actually consumed

| Choice | Current surface | What to verify |
|---|---|---|
| Caption font, weight, size | Project `format.json`: `fontFamily`, `accentFontFamily`, `fontWeight`, `fontSizePx`; compiled `captions.json.style` | Renderer uses compiled style. Load the font before fit. |
| Caption color and emphasis | `fillColor`, `emphasisColor`; optional `emphasisGradient` | An inherited gradient can visually override a chosen flat accent. |
| Card accent | `accentColor` on compiled caption style sets `--accent` in `CaptionReel.tsx` | Set it with emphasis color for a shared accent; otherwise honor the explicit split. |
| Hook appearance | `caption-plan.json.hook`, title page in `captions.json`, `hook.json`; `titleFontFamily`, `titleWeight`, `titleColor`, title geometry | The hook gate compares multiple representations. Keep them in agreement. |
| Caption case and heroes | `uppercase`, `heroWidthFrac`, `heroMaxFontPx`, `ctaFlat`, and caption-plan emphasis | Opening and body grammar are separate decisions. |
| Word versus phrase captions | `build_captions.py` versus `build_phrase_captions.py`, with pack-specific page grammar | Phrase mode is a builder choice, not an invented universal `captionMode` field. |
| Card surface, text, corners, border, shadow | `remotion/src/styles.ts`: `STYLES`, CSS `vars`, `card`, `cardLight`, `shot`, `shotDark` | Add a new style beside it; never alter the original `creator-format-1` entry. |
| Authored card typography | `cards/theme.ts`: `LABEL_FONT`, `--label-font`, `--reel-font` | Check every authored label; real app type and mono/document faces may intentionally differ. |
| Frameless cards | Event/frame handling in `Overlay.tsx`, component-specific markup | A palette change does not remove a component's own background. Check the actual render. |
| Motion and visual objects | Not a preference: the Talking Head skill decides them from the sentence | Nothing to set here. |
| Cut pacing | `cut_variants.py` has loose, balanced, tight and hard presets | Changes air around speech; keep the word-boundary verification. |
| Sound | Pack preferences and SFX palette, project sound files, mix scripts | Speech, SFX and music are different choices. Existing scripts are not a universal sound-mode adapter. |

`format_from_pack.py` currently starts from `formats/creator-format-1.json` and applies measured geometry;
its name does not mean it resolves every pack. Apply selected appearance after measurement,
without replacing measured geometry. `styleOf()` falls back to Creator Format 1 for
unknown style IDs, so writing a new string in JSON alone does not create a custom style.

Captions that were approved cannot be rebuilt as a side effect of recoloring. If the user
explicitly changes an approved property, use the lock/unlock mechanism with their actual
instruction and update only the necessary representations. Retiming after a cut change uses
the existing shift rules, not regenerated copy or visuals.

## The gates are not part of the look

The hook check and the visual lint hold for every creator. A chosen look that cannot pass one is
a conflict to show the creator, never a reason to loosen the check. New colors, type and surfaces
are a palette and a style entry; they do not need new card families, and the shared cards stay
as they are.

## Libraries and support in this folder

- `engine/talking-head/library/`: `README.md` (overlay laws, event schema, card kinds), `templates/`,
  `assets/`, and `styles/PROTOCOL.md`, the way another creator's reels are read frame by frame.
- `engine/talking-head/remotion/src/cards/`: every finished card, readable as examples.
- `engine/talking-head/sfx/`: available sound files; the selected pack determines which are approved.
- `assets/talking-head/`: the fonts the workspace's look page offers, and the six reference reels.
- The Keyframes folder's own `package.json`: Remotion, its Google fonts and the page capture tool.

Face measurement uses Apple Vision through a Swift program whose source ships beside it in
`engine/talking-head/scripts/facekit/`. Page captures use the headless browser Remotion fetched;
`CHROME` overrides it.
