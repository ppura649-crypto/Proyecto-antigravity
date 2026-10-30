# Editing inside a scene

The goal is to change the visible parts of a video while keeping its authored layout and motion. The editor stores overrides on named nodes, so a card, its heading and a caption word can each move without flattening their scene into a picture. The Player and export read the same document and interpolation functions.

Captions need no per-project wiring. `withWordIds` gives every word a stable ID. Universal, Full Visual and Talking Head caption renderers apply `word.edit` and expose `data-word-id`. Corrections retain IDs; splitting a caption offsets the animation clock so its motion continues exactly.

A custom scene exposes the parts a person should change. Replace the existing DOM node with `Editable`, keeping its styles and children, then declare its fields in the layer registry's `elements` array. IDs stay stable across revisions. A group and its children can each be exposed; the canvas selects the smallest visible node under the pointer. The list also makes the parent selectable.

```tsx
import { Editable } from 'keyframes-editable';

export const Card = () => (
  <Editable id="card" style={{ position: 'absolute', left: 90, top: 700, width: 900 }}>
    <Editable id="heading" style={{ fontSize: 50 }}>Your heading</Editable>
  </Editable>
);
export const layers = {
  'demo/card': {
    draw: Card,
    elements: [
      { id: 'card', label: 'Card', kind: 'group' },
      { id: 'heading', parent: 'card', label: 'Heading', kind: 'text', text: 'Your heading', size: 50 },
    ],
  },
};
```

The `keyframes-editable` alias belongs to the editor's preview and export bundles. A standalone project needs its own bridge or an equivalent alias. Full Visual already provides a standalone bridge at `src/engine/Editable.tsx`; its scenes import that bridge, and its adapter supplies the saved overrides. This keeps the original reel build independent of the editor.

For Full Visual, export `editableScenes` beside `scenes` in the reel's `scenes/index.tsx`. Its keys are scene IDs and its values are the same `elements` arrays shown above. `makeSceneLayers` registers those controls automatically.

## Saved changes

A word keeps its overrides under `word.edit`; a graphic uses `item.elements[elementId]`. Overrides support text, colour, font size, visibility, translation, scale, rotation and opacity. Images can use an asset override through `src`; a visual source picker is not part of this first pass.

Animation uses `keyframes[property] = [{ frame, value, easing }]`, with `linear` or `smooth` easing. The frame is on the item's original local clock. `clockOffset` carries that clock across caption cuts. Points hold their first and last values outside their span. Editing a value while it is animated writes a point at the playhead; merely focusing or leaving a value never adds a point. Each drag is one undo step.

Double click a caption or an exposed scene to open its children. The timeline zooms to that item and returns to its prior view when closed. Words can move and trim in time on their expanded lane. Components show their own lane and animation points. Original scene cues remain authored; these points add editable motion on top of them.

Explicit nodes are the useful boundary. Do expose a card and its title with stable IDs. Do not infer an editable component tree from an MP4 or promise that arbitrary computed JSX can be rewritten by a property panel. Older scenes need this small adaptation before their internal parts become editable.
