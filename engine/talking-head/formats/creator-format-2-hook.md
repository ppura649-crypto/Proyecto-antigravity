# Creator Format 2 hook grammar (measured on 9 reels, 2026-09-04)

Evidence: `refs/<code>/frames/strips/title-*.jpg` (the first frames of every reel one by one),
`style_measure` on a hold frame, the exit strips at the first cut.

## The rule she actually follows

A sentence sits on top of her for the whole first spoken sentence, then a hard cut removes it
with the first scene change. Word captions run underneath it (or, in XAJm, not at all until it
is gone). It is a layer, not a page: cards cut in over it and it shows again in the gaps
(XAFZ f94-98, XAJm f120-167).

| reel | text | lines | y top-bottom | cap px @1080 | entrance | lives | exit |
|---|---|---|---|---|---|---|---|
| XAFZ | I turned my fav / editing styles into Skills | 2 | 0.258-0.318 | 43 | complete at f0 | 0-3.3 s (f98), hidden by cards from f54 | hard, first blur |
| XAGA | Fact or Hype? | 1 | 0.264-0.307 | 61 | complete at f0 | 0-4.0 s (f119) | hard, first cut |
| XAH7 | How to fix your AI images | 1 | 0.248-0.279 | 46-60 | complete at f0 | 0-3.8 s (f114), posters slide under it | hard, first full-screen footage |
| XAIh | POV: I let ChatGPT plan and create an entire video 😳 | 2 | 0.170-0.227 | 43-45 | complete at f0 | 0-19.7 s (f592), the whole laptop act | hard, scene cut |
| XAJm | I turned this editing style into an AI Skill | 2 | 0.228-0.295 | 46 | complete at f0 | 0-8.6 s (f259), covered f27-119 and f168-259 | hard, never back |
| XAKr | how I use AI to add / motion graphics | 2 | 0.227-0.298 | 51 | complete at f0 | 0-4.3 s (f129) | hard, first screen |
| XAL1 | Steal my / 9 AI setup / questions | 3 | 0.157-0.321 | 39 | lines fade in top to bottom f2-5 (3-4 frames) | 0-5.1 s (f153) | hard, 3 blank frames, grid pops |
| XAMz | POV: nothing spikes your / cortisol like your editor / suddenly ghosting | 3 | 0.244-0.338 | 42 | complete at f0 | 0-4.4 s (f132), survives a whip-pan | hard, location cut |
| XANQ | AI could make electricity cheaper | 2, left-aligned in a dark box | 0.153-0.263 | 68-92 (serif) | box f7-9, then text fades f10-16 (16 frames) | 0-5.8 s (f173) | hard, first badge card |
| XAOU | How to Set Up / AI Project / *Correctly* + "10 people. 10 different answers." | 3 + a subtitle, serif, "Correctly" and the 10s in lime | ~0.15-0.33 | serif, large | soft fade-up f8-25 (~15-20 frames), line by line | 0.3-6.0 s (f180), two sentences | hard, f181 |

Median life 4.4 s = her first sentence. Seven of ten are complete at frame 0 (no type-on, no
pop). None types on letter by letter. The three that animate fade in over 4, 16 and ~18 frames.
Two of ten use a serif (XANQ, XAOU), both with a lime accent word or box; the rest are the
rounded sans.

## Placement

- Always the gap above her head: top edge 0.15-0.26H, bottom 0.23-0.34H. Her head top sits at
  ~0.35H because she frames low. If the shot has no gap (XANQ's tighter frame) the title gets a
  dark box and sits at 0.15H.
- Centred at x 0.50 in 8 of 9 (XANQ left-aligned at 0.123W). Line widths 0.55-0.75W, 1-3
  lines, line pitch ~62 px for 43 px caps.
- It never moves, never scales, never changes colour while alive.

## Type

- Rounded bold geometric sans, white, soft dark shadow, no stroke: XAFZ, XAH7, XAIh, XAJm,
  XAKr, XAL1 (Nunito / Poppins / SF Pro Rounded Bold-like: rounded terminals, circular o,
  single-storey g). Cap 39-51 px at 1080 (bigger than her 32-44 px captions, same colour).
- The CapCut outline preset (white fill, ~8 px black stroke, no shadow): XAGA (61 px), XAMz
  (42 px). Same face as the captions in those two reels, just larger.
- Serif in a near-black box with a lime dash above it: XANQ only, the biggest at 68-92 px.
- Sentence case with natural capitals ("how I use AI", "POV:", an emoji allowed). Never all caps,
  never a period.

## What it says

Nine of nine are the claim of the reel in one line, in her words, 5-10 words: "I turned my fav
editing styles into Skills", "How to fix your AI images", "Steal my 9 AI setup questions", "AI
could make electricity cheaper". Two are "POV:" framings. None names a tool in the title
except as the subject ("ChatGPT"). No numbers except a count ("9 AI setup questions").

## What sits with it

- Nothing, in 6 reels: the title alone over her.
- Cards under it: XAFZ (Finder, app card), XAH7 (posters sliding in at 0.9 s), XAJm (an
  example-reel card at 0.9 s), XAL1 (the 3x3 grid populating f0-24 while the title is up).
- Real marks: none in her own titles. The app-icon row under a title and the "vibe coding 101"
  yellow wordmark that the creator showed on 2026-09-03 are other creators (screenshots in
  `refs/XAFZFjrlKhV/user-examples/`): a plain white title with four app tiles, a giant yellow
  rounded title, a white pill with black bold text. They share her rule (one sentence, first
  sentence, above the head) and differ on decoration.

## The hard rule for our new style (their ask, 2026-09-03)

"during the first sentence of your hook, have a caption or something on top ... it lasts like
3-4 seconds ... one letter by one letter ... they all do it".

What the corpus supports, measured:

1. A title layer for the first sentence: yes, 9 of 9, median 4.4 s, removed by the first cut.
2. 3-4 s: yes for the short first sentences; it follows the sentence, not a timer (3.3-5.8 s
   in 7 reels, 8.6 s and 19.7 s when the first act is one shot).
3. Letter by letter: NOT her hook title (0 of 9). She types on chapter titles inside the video
   (XAFZ "Quiet Editorial UI", 1.5 glyphs/frame), typed prompts (XAJm, 1 glyph/frame) and live
   dictation (XAKr). If we want the letter reveal on the hook title, it is our choice, not her
   pattern; our `HookTitle.tsx` already supports `reveal: letters | words | none`. Default it
   to `none` for a faithful copy, `letters` at ~1 glyph/frame when the creator asks for the animated one.
4. Logos with it: none in her titles; allowed by their examples, bare marks only, in a row under
   the title (the `logos` field of the title page).

## Render rules for the preset

- Title block: 1-3 centred lines, top edge 0.23H (0.16H if three lines), cap 44 px at 1080,
  line pitch 1.45 x cap, rounded bold sans (Nunito Bold is the closest free face), white,
  shadow `0 2px 6px rgba(0,0,0,0.55)`, no stroke, no box.
- Life: from frame 0 (or a 4-frame fade) to the end of the first spoken sentence, hard-removed
  on the first card that needs the full frame or the first scene cut, allowed to show again in
  gaps before that.
- Cards may cut in over it; captions run under it in the caption zone.
- Never typed on unless asked; never moved; never recoloured.
