# Captions and the presenter layer

The renderer can express the observed layer relationships. Geometry is selected from the current recording; example numbers are not creator defaults. The cut master stays at original speed and its voice is mapped once.

## Authored captions

Keep each cue's `from`, `to` and `text` in master frames. Optional `lines` contain `runs`. Their combined text must match the declared text. Cue and run timing are independent of artifact motion. Run `from` and `to` are relative to the cue, starting at zero. A missing run end lasts to the cue end.

Cue options: `x`, `y`, `width` as canvas fractions; `yAnchor` of `top`, `center` or `bottom`; `align`, `size`, `fontFamily`, `fontWeight`, `fontStyle`, `lineHeight`, `letterSpacing`, `color`, `shadow`, and `enter`. `yAnchor: bottom` lets extra lines expand upward above the head. Existing simple text cues remain valid.

Each line can override `size`, `fontFamily`, `fontWeight`, `fontStyle`, `lineHeight`, `letterSpacing`, `color` and `gap` in pixels before that line. Its runs carry `text` plus optional style overrides and timing. Use actual whitespace between runs; separate lines already provide a line break.

A run can have `enter: {duration: 5, rise: 14, blur: 3}`, with duration in frames and distances in pixels. Zero or absent duration appears immediately. `dimAt` is cue-relative, with optional `dimOpacity`. `gradient: {colors: ['#fff', '#ccc'], angle: 180}` describes text fill. Runs reserve layout space before appearing unless `reserveSpace: false`; choose deliberately and inspect intermediate alignment.

`look.fonts` loads additional licensed project assets as `{family, file, weight, style}`. File paths are relative to the project assets directory. Reference a registered family in the caption. The primary `fontFile` still registers `CreatorCaption`. Never silently use a browser fallback for a named custom font.

## Source-aligned presenter

`look.presenter` enables the foreground treatment and uses integer output pixels:

```json
{"matteFile":"presenter-matte.mkv","imageX":0,"imageY":100,"imageWidth":1080,"panelTop":1160,"panelX":18,"panelWidth":1044,"radius":160}
```

This is a technical example, not a usable crop until inspected. `imageX/Y/Width` position one source picture and its matching mask. Height follows the 9:16 master aspect ratio. `panelTop/X/Width/radius` describe the room panel independently. The union of the room panel and foreground silhouette reveals the original picture. The head can extend above the panel without cloning, redrawing or changing the person's motion. Captions are composited last.

Optional `look.presenter.background` accepts an opaque six-digit hex color (`#RRGGBB`). When set, the split panel contains that solid color and only the real foreground silhouette reveals source pixels, including hair above the panel. Full-presenter scenes place the same person on the chosen color using a matte transformed with the exact same `fullScale`, `faceX` and `faceY` crop as the source. The editorial canvas and full-visual scenes keep their existing background. Omitting this option preserves the native room in both presenter layouts. This changes only compositing; it needs the same complete, frame-aligned matte and does not recolor the footage or choose a saved preference. Inspect hair, gestures, panel corners and mode boundaries with the selected color.

A local macOS implementation uses Apple's accurate person segmentation on every decoded master frame. Compile `scripts/split-explainer/person-matte.swift` with `xcrun swiftc -O`, then run the resulting binary with the upright 30 fps master and output mask path. It writes a 540x960 FFV1 grayscale mask, preserves one mask per frame and stops on timing gaps. Verify the hair, shoulders and any gestures at actual size and in motion. Mask existence is not proof of a good edge. Other platforms need their own real mask implementation; never replace missing segmentation with a guessed head shape.

`look.presenter.animate` (`true`, or `{"in":18,"out":14,"drop":12,"rise":14}` in frames) moves the presenter
between modes instead of cutting: from the full crop into the split panel and back, down out of the frame
before a full visual and up again after it, eased in and out, with the picture, its matte and the panel
moving together. Inspect every boundary as a `--range`, frame by frame: no frame may flash the presenter
back into place after it has left.

`look.fullScale` (default 1, minimum 1) enlarges the full-presenter picture before its final crop. `faceX` and `faceY` choose the normalized crop position. This transform is independent of the split presenter image and never changes the recording or matte. Inspect the eyes, mouth, neck and any useful gestures after a tighter crop.

Without `look.presenter`, the original rectangular lower crop remains available. `splitTop` controls the visual region; it does not define the head silhouette or room-panel top.

## Checking and exporting

`render.mjs <project> --still <frame>` composes one actual frame. `--range <from> <to>` makes a short motion check over that exact frame interval. No flags renders the complete export. Graphics and captions render separately, then FFmpeg places the original person between them. Eight-second sections bound intermediate disk use. Optional `--chunk-frames 120` uses four-second sections when temporary disk space is tight; accepted values are integers from30to240 and do not alter the frame/audio timeline. Temporary graphics are removed only after a section's frame count passes. The full export verifies dimensions, total frames and matching recorded audio packet hashes. The short preview re-encodes only its cropped voice.

Source and matte are selected by decoded frame index, then assigned the same exact `1/fps` timebase and sequential frame timestamps before any overlays. Graphics and caption layers use that same clock. Do not preserve the mask container's millisecond timestamps for framesync: its rounded times can select an adjacent mask and reveal source-background wedges at cuts even when the mask itself is correct. Check encoded ranges that start away from whole seconds, as well as exact-index still pairs, when changing this path.

Video split-mode gates use the overlay timeline's zero-based `n` with chunk-relative integer `[from, to)` bounds, never floating-point seconds. Decimal second comparisons can exclude the first frame of a scene (for example, frame 139 at 30 fps). A still checks its exact global frame against the same scene intervals. Verify every production chunk's mode gates when changing this path.

The renderer does not establish creative quality. Inspect real before/after states, mode changes, hair clearance, phone-size type and timed actions before delivery.

For full-presenter scenes, optional `scene.presenterCrop: {faceX, faceY}` overrides the global
crop position for that take. Coordinates are fractions from 0 to 1, measured on composed frames;
`look.fullScale` still sets the shared scale. The source and matte use identical even-pixel offsets.
Stable per-take positions can correct a change in framing without introducing tracking movement.
Check each affected take and its entry/exit in an encoded range.
