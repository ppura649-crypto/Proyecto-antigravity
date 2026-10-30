# Creator Format 3 system: split proof, full overlay, full face

Measured from five Instagram reels by `Creator Format 3`, collected and inspected on 2026-09-03.
This is the reusable house-system dossier. The exhaustive speech-correlated event maps, transcripts,
source media, and screenshots remain in the five evidence packs listed below.

## Source evidence

| Reel | Duration | Master used | Transcript | Dense inspection | Standalone dossier |
|---|---:|---|---|---|---|
| `XAV7E2CFCK3` | 61.10 s | 1080 x 1920, 60 fps | Apify, word timestamps | 612 frames plus 1 fps and hook 4 fps | [`analysis.md`](../library/styles/refs/XAV7E2CFCK3/analysis.md) |
| `XAWVWlBWlGh` | 51.94 s | Native 720 x 1280 preserved, normalized analysis copy | Apify, 201 words | Entire reel at 10 fps, 519 frames | [`analysis.md`](../library/styles/refs/XAWVWlBWlGh/analysis.md) |
| `XAXZVuI1VBP` | 63.25 s | 1080 x 1920, 60 fps | Apify, 232 words | 632 frames across 15 windows | [`analysis.md`](../library/styles/refs/XAXZVuI1VBP/analysis.md) |
| `XAY9n44H5sB` | 45.51 s | 1080 x 1920, 60 fps | Apify, 175 words | Entire reel at 10 fps, 455 frames | [`analysis.md`](../library/styles/refs/XAY9n44H5sB/analysis.md) |
| `XAZVwHzBCHn` | 46.83 s | Native 720 x 1280 preserved | Apify, 168 words | Entire reel at 10 fps, 467 frames | [`analysis.md`](../library/styles/refs/XAZVwHzBCHn/analysis.md) |

The discontinued Apify actor referenced by older project code was replaced with
`sian.agency/instagram-ai-transcript-extractor`, actor ID `3C7L8IMQOkq3isV2Y`, with
`wordLevelTimestamps=true`. Raw responses are preserved as `transcript.apify.json` in every pack.
Qwen was attempted on the reference videos, but the configured DashScope credential was invalid.
No visual conclusion depends on Qwen. Every conclusion below comes from direct inspection of the
preserved master, complete 1 fps coverage, first 8 seconds at 4 fps, dense 10 fps evidence, and
full-resolution key stills.

## The system in one sentence

Use an exact 50/50 proof-over-face split when one compact visual can explain the current clause,
expand to an opaque full-frame design canvas when plurality or a sequence needs vertical space,
and restore the full talking head for a rhetorical punch, human payoff, proof handoff, or CTA.

## The three parent modes

### 1. `split`

- Designed or recorded proof: `x=0, y=0, w=1, h=.500`.
- Talking head: `x=0, y=.500, w=1, h=.500`.
- Caption optical center: `x=.500, y=.500`, straddling the seam.
- The cut is exactly horizontal. No divider, rounded viewport, gap, feather, blur, or dim layer.
- The creator remains large. Reframe the same vertical source into the lower compartment rather than
  miniaturizing the person.
- Use for one card, one artifact, one number, one comparison, one real screen, or one compact state
  machine that remains legible inside 960 px of height.

This is the default explanatory state in all five references.

### 2. `overlay`

- Opaque designed canvas: `x=0, y=0, w=1, h=1`.
- Creator: fully hidden, never dimly visible underneath.
- Main content column: usually `x=.06-.94`, with narrower UI around `x=.11-.89`.
- Use only when the meaning needs several rows, many repeated objects, two vertically stacked cause
  and result objects, or a readable multi-step procedure.
- The split boundary does not animate open. A semantic chapter cut replaces the parent mode.

Full-overlay triggers observed across the five reels:

- twenty pages becoming two billed outputs;
- eleven skills, a long formula list, comments, replies, profile, and calendar;
- a setup procedure spanning repository, download, upload, grid, and memory;
- a search, crawl, extract, and write terminal that produces a spreadsheet;
- a terminal setup that must be read as a full command sequence.

Caption placement has two evidenced presets inside this mode:

- `overlay-center`, optical center near `y=.500`, when the design is organized around the upper and
  lower halves or leaves a central caption lane;
- `overlay-lower`, optical center near `y=.760-.780`, when a tall grid or vertical conveyor occupies
  the upper and middle canvas.

Choose the preset from the content geometry before authoring components. Do not move the caption
independently for each card.

### 3. `face`

- Talking head: full 9:16 canvas.
- Normal caption optical center: about `y=.760-.800`.
- Optional statement hero: centered around `y=.60-.74` and replaces the normal caption briefly.
- Optional CTA keyword: upper center, roughly `x=.10-.90, y=.16-.29`, persistent after entry.
- Use for direct judgment, the human consequence after a long mechanism, an explicit “watch” reset,
  source-proof handoff, and the comment CTA.

The CTA is not a card. It is the full person, one giant keyword, and the ordinary phrase caption
continuing independently below.

## Mode-selection decision rule

```text
Can one legible object express this clause in the upper 50%?
  yes -> split
  no  -> Does the viewer need to read plurality, order, or cause -> result?
           yes -> overlay
           no  -> simplify until split is enough

Is the line a direct punch, consequence, “watch” reset, or CTA?
  yes -> face
```

The layout change is editorial punctuation. It is never a decorative transition schedule.

## Caption system

- Uppercase pixel or bitmap mono, one line only.
- Practical font candidates for visual tests: Departure Mono, VCR OSD Mono, Pixel Operator, and
  Pixeloid Sans. Exact family remains unconfirmed.
- Starting size at 1080 x 1920: 50 to 58 px, regular to medium weight.
- Near-white text, usually `#FAFAF8`.
- Translucent near-black rectangle, roughly 76 to 90 percent opacity.
- Radius 10 to 16 px, horizontal padding 18 to 24 px, vertical padding 10 to 16 px.
- Content-fit width, usually 1 to 3 words, occasionally 4. One line only.
- Phrase-level hard replacement. No karaoke fill, bouncing word, colored word, or retained history.
- Caption remains above every UI layer and can cross the split seam or the full-overlay system.
- Position is selected by parent mode, not pushed around by individual cards.

## Typography roles

The look depends on three visibly different type roles.

1. **Editorial caption:** pixel or bitmap mono, uppercase, regular weight.
2. **Designed interface:** Inter, SF Pro, or a close neutral system sans. Developer surfaces use a
   clean mono such as SF Mono or JetBrains Mono. Rolling counters require tabular numerals.
3. **Hero and CTA:** very heavy, extended or geometric display sans, often white with a dark or red
   extrusion. Candidate families include Archivo Black, Monument Extended, Montserrat Black, or a
   similar wide display cut. Match geometry through rendered glyph tests, not the family name.

Use the strings `OMNIROUTE AUTOMATICALLY`, `PROMPT`, `TOKEN`, `CLAUDE`, `ROUTE`, `LEADS`, `%`, and
`29,000` for font comparison. Do not reuse the caption font inside cards or for the CTA.

## Palette and material

- Main design plane: warm cream or warm gray, approximately `#F2EFEB` to `#F6F3EE`.
- Optional subtle pale grid: permitted when it belongs to the component family, never mandatory.
- Card surface: `#FFFFFF` to `#FFFCF7`.
- Primary ink: `#0F1114` to `#1B1918`.
- Secondary ink: `#66666D` to `#989696`.
- House accent: coral or terracotta, approximately `#CF6948` to `#DD7052`.
- Success: restrained green for completed, live, available, or corrected states only.
- Yellow: proof highlighting or a real star state only.
- Platform colors: local to the real platform affordance, logo, or status. They do not recolor the
  whole system.
- Light cards: 18 to 34 px radius, 1 to 2 px faint border, broad low-opacity shadow.
- Dark product proof: native dark UI on a dark matte, not forced into a white shell.

There is no frosted glass, global blur, global dim, grain, glow, chromatic aberration, or decorative
neon. Focus comes from crop, replacement, negative space, and one active state.

## Motion grammar

| Meaning | Motion | Starting duration |
|---|---|---:|
| New semantic chapter or parent mode | hard cut | 0 to 2 frames |
| New child inside a settled component | opacity plus 4 to 12 px translation, or short scale settle | .10 to .30 s |
| Same-family state replacement | horizontal slide or restrained crossfade | .20 to .50 s |
| Ordered process | vertical conveyor or stacked reveal | .30 to .80 s per state |
| One becomes many | fan-out, grid fill, row stagger | .70 to 1.90 s total |
| Quantity or cost proof | eased count, bar, grid, or row accumulation | .70 to 3.50 s |
| Real-screen handoff | hard cut, or one directional blur/zoom wipe between related screens | .15 to .20 s |
| Hero word | quick scale, wipe, or short positional settle on the spoken word | .10 to .30 s |
| Resolved proof | still hold | .60 to 3.00 s |

Major motion is semantic. Cards may move when their position carries meaning, such as an exhausted
provider exiting left, a new provider taking the center slot, or a terminal shifting upward to make
room for its output. During typing, counting, checking, routing, and progress, keep the shell stable
and animate the internal state. Nothing loops for decoration.

## Layer rules

### Split

1. Talking-head source clipped to the lower compartment.
2. Opaque light design stage or real screen clipped to the upper compartment.
3. Designed objects inside the upper stage.
4. Caption over the exact seam.

### Overlay

1. Opaque warm design plane.
2. Cards, screens, marks, connectors, counters, and state changes.
3. Caption in the selected fixed overlay lane.

### Face

1. Full portrait source.
2. Normal lower phrase caption or temporary statement hero.
3. Persistent upper CTA keyword when present.

## What must not carry over from the existing Talking Head styles

- Do not use the Creator Format 1 top-band card over a continuously full-frame creator.
- Do not use Creator Format 1 square-card laws. This family uses soft rounded light cards.
- Do not use the Creator Format 2 glass, background blur, pastel collage, or dimmed face.
- Do not treat a full overlay as a large floating card. It is an opaque parent canvas.
- Do not keep captions at one global baseline across all modes.
- Do not add an outro card, CTA button, arrow, or logo cluster to the final keyword.

## Confidence and open tests

- High confidence: three parent modes, exact split geometry, mode-aware caption behavior, palette
  family, component selection logic, hard chapter cuts, internal state motion, and CTA structure.
- Medium confidence: card shadow values, exact source crop translation, and individual easing curves.
- Low to medium confidence: exact font files. Font category and role separation are clear.
- Before implementation, render a glyph sheet and a crop calibration still. The screenshot packs are
  the visual authority if a nominal token conflicts with the raster evidence.

