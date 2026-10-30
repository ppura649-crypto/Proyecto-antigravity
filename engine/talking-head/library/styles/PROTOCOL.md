# Style reference protocol (frame by frame, no sampling)

Goal: know a creator's editing style well enough to rebuild it, the way `formats/creator-format-1-*.md`
did for Creator Format 1. The unit of evidence is the single frame. Nothing is inferred from a 1 fps
contact sheet or "10 frames at a time": every animation is read one frame after the other,
every hold is measured on a full-resolution frame, and every claim cites frame numbers.

## Files per reference (`library/styles/refs/<code>/`)

| file | made by | what |
|---|---|---|
| `reel.mp4`, `reel.info.json` | yt-dlp | the source, native resolution (1080x1920 or 1440x2560), 30 fps |
| `words.json` | `auto-editor whisper audio.mp3 apple -sw -f json -l en` | one JSON object per line `{start,end,text}` in ms |
| `meta.json`, `ledger.csv`, `events.json` | `scripts/style_ledger.py <ref>` | per-frame motion / edge / sharpness / luma per band; candidate overlay runs (an index only) |
| `frames/all/f%05d.jpg` | `style_ledger.py` | every frame, 540 px wide, for reading and for the index sheets |
| `frames/index/index-NN.jpg` | `style_ledger.py` | navigation only, every 6th frame labelled with its frame number |
| `frames/full/fNNNNN.jpg` | `scripts/style_strip.py` | full-resolution frames, cached as they are needed |
| `frames/strips/*.jpg` | `style_strip.py <ref> <from> <to> --band y0,y1 [--x x0,x1] --cols N --scale S --out name` | consecutive frames of one region, nothing skipped: the evidence for every animation claim |
| `analysis.md` | you | the measured system (template below) |
| `tokens.json` | you | the numbers a renderer needs (template below) |

`scripts/style_measure.py <ref> <frame> [--band y0,y1] [--white N] [--px x,y ...]` prints bright
regions (cards, paper, white text), sharp regions (UI on blurred footage), text-line boxes with
glyph heights inside a band, and colour samples. Use it after you have looked at the frame, so
the numbers in the doc are exact and not read off a thumbnail.

## Procedure

1. Read `words.json` once (print it as `t:word` pairs) so every visual can be tied to the word it
   enters on.
2. Read the index sheets to map the reel, then confirm boundaries in `ledger.csv`:
   `bot_sharp` collapsing (600+ to <20) is her whole-frame blur state; `top_edge` / `mid_edge`
   above baseline means something drawn on clear footage; `*_motion` spikes mark cuts and pops.
3. For every visual event, in order:
   - entrance: a strip of every frame from 2 frames before to the first fully-settled frame,
     band = the region the object occupies, `--scale 0.5` (so you can see opacity, scale, slide,
     typing). Write what changes frame by frame: "f256 ghost 20 %, f257 60 %, f258 90 %, f259
     settled: 4-frame opacity fade, no travel".
   - internal motion: one strip per change (a bar appearing, a word typed, a cursor, a panel
     opening) covering every frame of the change. Count the frames and the stagger between
     siblings.
   - hold: one full-resolution frame; run `style_measure.py` on it; record box, padding, radius,
     border, shadow, surface colour over the blurred footage, type roles (family guess, case,
     tracking, cap height in px at the reel's width), and what is real media versus drawn UI.
   - exit: a strip of every frame from the last settled frame to 2 frames after it is gone.
   - words: the word on which it enters and the word on which it leaves.
4. Captions: one strip of ~36 consecutive frames of the caption band at the start, one mid-reel,
   one at the CTA. Measure a page on a full frame (glyph height, width, centre, y). Note the
   grammar: words per page, case, punctuation, what gets colour, whether pages animate.
5. The hook title (the sentence on top during the first spoken sentence): its first frames one by
   one (does it type on, pop, or sit there), how long it lives, what hides it, whether it comes
   back between cards.
6. Write `analysis.md` from the template. Every number comes from a measurement, every timing
   from a strip, every "she does X" from at least two frame citations. Where a font is a guess,
   say "looks like Nunito Bold (rounded terminals, single-storey g)", never a bare name.
7. Write `tokens.json`.

Do not sample. Do not describe a 3-second animation from one frame. Do not write mood words
("elegant", "clean") without the measurement that produces the effect. Do not invent content
that is not in the frames. If a region is unreadable at 540 px, cut it at full resolution.

## analysis.md template

```
# <code> <creator> "<hook sentence>" <duration>s <WxH>

## Map (every event, frame-accurate)
| # | frames | t | footage | object | enters on word | leaves on word |

## Hook title
## Captions (grammar + measured geometry)
## Footage states (clear / whole-frame blur / local blur; how the switch happens, frame counts)
## Event N: <object>            (one section per event)
   geometry · surface · type · content (real vs drawn) · entrance · internal motion · exit
## Motion vocabulary (every distinct move seen, with frame counts and where it was used)
## Type roles (family guess + evidence, size, case, tracking, colour, where used)
## Palette (sampled hex, what each colour is for)
## Rhythm (hold lengths, gaps, events per 10 s, longest clear stretch)
## What is real, what is drawn
## Open questions
```

## tokens.json template

```json
{ "code": "...", "width": 1080, "height": 1920, "fps": 30,
  "captions": {"yCentre": 0.724, "capHeightPx": 35, "family": "…", "weight": 700, "case": "sentence", "wordsPerPage": [2, 4], "maxWidth": 0.80, "shadow": "…"},
  "hookTitle": {"yTop": 0.258, "lines": 2, "capHeightPx": 43, "family": "…", "livesMs": [0, 3300], "entrance": "none|type|pop", "hiddenByCards": true},
  "blur": {"kind": "hard-switch", "frames": 1, "scope": "whole|local"},
  "cards": [{"name": "…", "x": [0.11, 0.89], "y": [0.14, 0.36], "radius": 34, "surface": "#…@0.22 over blur", "border": "1px #fff@0.5", "shadow": "…", "entrance": {"kind": "fade", "frames": 4}, "exit": {"kind": "cut", "frames": 1}}],
  "motion": {"fadeFrames": [3, 5], "popScaleFrom": 0.9, "staggerFrames": 4, "typeCharsPerFrame": 1, "cutsAreHard": true},
  "palette": {"…": "#…"}
}
```
