# Creator Format 1 visuals: full transcript-aligned event log + taxonomy (2026-09-01)

Method: word-timestamped transcripts (whisper apple) aligned with every visual
event from the frame sheets (10fps hooks, 2fps bodies, 5fps top-band edge
detection). "said:" = their exact words when the visual enters.

## The 6 jobs a visual does

1. **NAMING** - an identity pops the instant its name is spoken. Logo chips
   (Jupyter, pandas, matplotlib, scikit, PyTorch, TensorFlow), book cover on
   "Mathematics for machine learning", casino photo on "casinos", hedge-fund
   tiles on "hedge funds", archival professor photos on "MIT professor". Hold =
   as long as the name takes to say (0.3-0.7s for chip runs, 1.5-2.5s solo).
2. **PROOF** - a real artifact backs the claim being made. Article screenshot,
   AI Act card on "European AI regulations", paper figures while explaining the
   mechanism, Thorp Excel chart on "never had a losing year", plugin pages on
   "there's already a plug-in". Hold 3-5.5s.
3. **TEACHING** - a built/animated explainer that develops WITH the narration:
   formula card on "Kelly criterion", variable legend on "this formula finds
   it", colored annotations popping per phrase on "your edge divided by the
   odds", stepwise value substitution on "For example, if you have a coin...",
   crash chart drawing down on "you go broke", sim chart lines drawing on
   "simulating a few different strategies". Hold 2-5s each, chained.
4. **STRUCTURE** - giant accent numeral on "Step number N" (1.2-1.7s).
5. **HUMOR** - one meme beat max: Kermit typing on "rewriting the text" (0.9s).
6. **SLIDE** - announcement reels only: near-takeover info cards (product card
   w/ button, "What you'll receive" bullets, requirement card with cursor +
   selection sweep synced to the country list being read).

## Timing rules (measured)

- Entry is ON the trigger word, lag < 0.3s, never early. The swap cadence in a
  list follows speech exactly (chip per library name, page per course name).
- Holds: 2-5s for proof/teaching, word-length for naming runs, ~1s for jokes.
- Gaps: density tracks information. Kelly reel mid-lesson runs near
  wall-to-wall (gaps 0.4-1.0s); guide reel breathes 2-4.5s between visuals;
  announcement reel 0.6-2.5s. Longest no-visual stretch anywhere: ~7.8s
  (the reflective close before the CTA).
- Event rate overall: one visual event every 3.7-5.5s of runtime.
- One visual at a time; single exception: naming stack (photo + logo tiles).
- The reel's LAST 5-8s is always visual-free talking head + CTA line.

## Style rules

- Real screenshots get re-framed: white rounded card + soft shadow for light
  content, browser/laptop dark frame for dark content, naked image for
  archival photos. Never a raw ragged screengrab.
- Motion lives INSIDE the card (slow zoom, scroll, pan, highlight tint sweep,
  cursor moves, chart lines draw, values substitute). The card itself just
  pops in and out, hard, no slide/fade choreography.
- Charts: black background, thin red/green/blue lines, progressive draw.
- Custom flat cards only when no real artifact exists, obviously designed
  (cream, rounded, icon + label), never fake screenshots.
- Placement: top band y 0.03-0.33H centered; announcement reel also uses a
  bottom card slot (y ~0.60-0.87H) and moves captions ABOVE it for the hold.
- Accent color is shared between captions and visuals (numerals, highlights
  use the same yellow; ours = terracotta #E07850).

## Color + cleanliness system (measured full-res)

The world is desaturated; saturated color exists ONLY inside the visual's
payload and the caption accent. Grey wall (#C0C3BE), black/grey clothes,
dimmed monitors. That is 90% of why it looks clean.

Palette (sampled):
- Light card: #FEFEFE (screenshots) or warm cream #F0EBE0 (custom flat cards)
- Flat-card bars: grey #C9C5BD (normal text), vermilion #E8562A (the payload)
- Flat-card label: charcoal #2A2A28, one bold sans, sentence case
- Black card (math/charts): #000-#0A0A0A, SHARP corners (light cards get
  ~0.02W radius and a barely-there shadow; black cards get neither)
- Manim set on black: spring green #1FE08A, gold #E5C33F, blue #35A7DC,
  red #E04040, white. Color-coding is SEMANTIC: each label is colored like
  the formula part it points to (green=output, gold=numerator, blue=odds),
  arrows in the same color, LaTeX serif for math only.
- Caption emphasis yellow #FAFD89 (ours: terracotta #E07850)

Cleanliness rules:
1. One accent family per reel (orange in the watermark reel, Manim set in the
   math reel, brand purple in the OpenAI reel).
2. Generous padding inside cards (~8-10% of card width); whitespace around a
   card >= the card's own content area. Two cards max, staggered, asymmetric.
3. Zero decoration: no borders, no gradients, no emoji, no stock icons.
   Abstraction: body text becomes grey bars, ONLY the meaningful words become
   accent bars.
4. Card type: max 2 sizes (title + body), bold, charcoal-on-cream or
   white-on-black.

## Full event log

### XAANKCeyGPA (ML guide, 77s) - 19 events, 1 per 4.0s
| t | visual | said |
|---|---|---|
| 2.3-4.3 | CUT: blurred code b-roll | "Everybody's talking about AI" |
| 10.9-12.2 | numeral 1 | "Step number one... math Foundation" |
| 12.4-13.9 | course pages x4, swap per name | "Linear algebra, calculus, probability" |
| 14.4-16.6 | CUT: desk b-roll | "the 3 pillars of machine learning" |
| 18.4-18.9 | book cover chip | "Mathematics for machine learning" |
| 18.9-23.0 | PDF screen-record, cursor | "work through the core chapters" |
| 26.4-27.6 | numeral 2 | "Step number 2... ML coding tool" |
| 30.9-39.1 | 6 logo chips, one per name | "Jupyter Notebooks... TensorFlow" |
| 42.4-43.6 | numeral 3 | "Step number 3... right courses" |
| 45.9-51.6 | laptop-frame course pages | "freecodecamp's... Stanford's CS229" |
| 54.9-56.6 | numeral 4 | "The last step... real project" |
| 57.9-62.1 | Kaggle pages x6 | "Jump into Kaggle... Titanic... House Price" |
| 63.4-67.5 | CUT: iPad drawing b-roll | "things that solve a real problem" |
| 69.9-70.6 | white card "learning by *doing*" | "It's learning by doing" |

### XABuJlb1dsq (Claude watermark, 51s) - 10 events, 1 per 5.1s
| t | visual | said |
|---|---|---|
| 0.0-5.1 | article card, zoom+scroll+highlight | "you've probably heard that Claude..." |
| 5.2-10.4 | AI Act card | "to comply with the new European AI regulations" |
| 10.9-12.9 | terminal cards x2 | "not some hidden symbol or metadata" |
| 14.9-17.9 | paper fig: watermark functions | "every time Claude picks a word" |
| 20.4-25.4 | paper fig: tournament sampling | "uses a secret key... most recent words" |
| 25.9-30.9 | red/green comparison table | "check if the preferred words appeared" |
| 31.4-35.9 | flat cards: Not detectable vs Detected | "short text... not enough data" |
| 37.9-38.8 | Kermit typing | "rewriting the text breaks the pattern" |
| 43.9-45.9 | plugin dark screenshots | "there's already a Claude plug-in" |
| 47.4-49.9 | CTA `comment "watermark"` | the spoken CTA |

### XACe1njJc8o (Kelly, 41s) - 11 events, 1 per 3.7s
| t | visual | said |
|---|---|---|
| 1.8-4.1 | b/w casino photo | "used to beat casinos" |
| 2.8-3.9 | + 3 hedge-fund logo tiles | "used by hedge funds" |
| 4.3-6.3 | formula card | "It's called the Kelly criterion" |
| 7.2-9.4 | crash chart draws down | "bet too much and you go broke" |
| 9.9-11.9 | formula + variable legend | "this formula finds it" |
| 12.4-15.9 | + annotations pop per phrase | "your edge divided by the odds" |
| 16.4-21.4 | worked example, stepwise substitution | "For example... coin... 60%... bet 20%" |
| 21.9-26.4 | sim chart, lines draw | "simulating a few different strategies" |
| 27.4-28.9 | archival photos x3 | "MIT professor... blackjack... Vegas" |
| 29.4-31.9 | Thorp fund Excel chart | "never had a losing year" |
| 39.4-40.5 | CTA `comment "Kelly"` top-right | the spoken CTA |

### XAD1Veep4La (OpenAI announcement, 33s) - 6 events, 1 per 5.5s
| t | visual | said |
|---|---|---|
| 0.0-3.0 | purple banner pinned | "just launched an insane opportunity" |
| 3.7-7.1 | product card w/ Apply button (bottom) | "It's called the OpenAI Student Collective" |
| 7.7-9.4 | slide takeovers x3 | "running AI workshops, coworking" |
| 11.9-14.4 | "What you'll receive" bullets | "cash stipend... credits... funding" |
| 19.9-23.4 | requirement card, selection sweep | "open in Canada, the UK, Germany..." (sweep follows the list) |
| 26.9-32.4 | CTA header `Comment "OpenAI"` | the spoken CTA |
