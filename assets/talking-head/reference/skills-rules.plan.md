# reference edit A visual plan v3 (exact shot list, Creator Format 1 pacing)

Pacing (the creator 2026-09-01): a lot on screen, but gaps are allowed when they make
sense, exactly like Creator Format 1. Result: 14 visual events in 59.8s (1 per 4.3s, Creator Format 1
measures 3.7-5.5), and 3 deliberate bare moments, each with a reason.

All times are SPINE time (pre-ramp, matches captions.json). The 1.1x hook ramp
is applied after render, only affects 0-4.785s.

Style per `formats/creator-format-1-visuals.md`: one visual at a time, entry ON the trigger
word (<0.3s lag), motion INSIDE the card only, hard pop in/out, terracotta
#E07850 is the only saturated color.

## First 10 seconds (the ones that matter)

| t | the creator says | caption layer | visual layer, exactly |
|---|---|---|---|
| 0.0-1.8 | "you are still improving your skills" | hook stack builds: YOU ARE STILL / IMPROVING YOUR / SKILLS (terracotta hero) | 3 overlapping skill folders (frontend-ui/ + Claude agent icon, hetzner/, redis/) pop frameless at 0.36 ON "still", hold into the villain card |
| 1.8-4.0 | "adding new rules every time the agent fails" | word-by-word white | white card pops at 2.16 ON "rules": real bloated rules-file screenshot, fast auto-scroll down an endless bullet list, zoom 1.00 to 1.04 |
| 4.0-4.9 | "you are doing it wrong" | stack: ARE DOING IT / WRONG. (terracotta) | card hard-cuts OUT at 4.00 the frame the stack lands. BARE. The punch owns the screen |
| 4.9-7.9 | "investigating some of my client's SKILLS" | word-by-word, then client's / SKILLS hero block | white card pops at 4.87 ON "investigating": anonymized client skills/ folder tree (GitHub view), slow scroll under the hero block |
| 7.9-11.1 | "always seeing a bullet list you must never, important, always do this" | word-by-word | card SWAPS at 8.05 ON "bullet": close-up of the ALWAYS/NEVER rules list; terracotta tint sweep hits one line per phrase, "must never" 9.0, "always do this" 10.4 |

## 10s to end

| t | the creator says (trigger) | visual, exactly |
|---|---|---|
| 11.2-15.7 | "the real problem... the model doesn't understand the why, the reasoning behind" | BARE (thesis). Longest gap of the reel, 4.5s, them + captions only |
| 15.7-18.5 | "just comply with the easiest visible instruction" | flat cream card pops at 16.2 ON "comply": a doc of grey bars, cursor slides to the ONE terracotta bar and clicks it |
| 18.5-22.4 | "a direct rationale loss that translates into a RULE DEBT" | black sharp card pops at 19.6 ON "rationale loss": terracotta rule-count line draws UP, grey quality line falls; apex flares at 21.55 the frame the RULE DEBT hero pops |
| 22.3-26.1 | "August 2026 study found out that adding the rationale and the explanation" | REAL arXiv page screenshot (Chakrabarti, "Why Does CLAUDE.md Keep Growing? Catastrophic Remembering in Agentic Coding", arXiv:2608.11095, verified 2026-09-01), scroll + sweeps on title, the 99.3% claim, the 23.1% claim |
| 26.6-29.7 | "sharply reduces the prompt growth and improves the instruction following" | two-bar card with the paper's REAL abstract numbers: prompt growth +211.3% shrinks to +1.4% at 27.3, instruction following rises to +23.1% at 28.7; credit "arXiv 2608.11095" on the card |
| 30.4-36.5 | "transform all your rules into high-level patterns, the goal, the reasoning, the examples and counter examples" | transformation card pops at 30.4: 12 grey rule bars, arrow, 3 terracotta blocks; each block lights ON its word, goal 33.8, reasoning 34.9, examples + counters 35.6 |
| 36.7-39.0 | "the smallest set of high signals that fully describes the behaviour" | same card evolves at 37.25 ON "smallest": the grey bars collapse into the 3 blocks, count ticker 12 to 3 |
| 39.4-42.9 | "start with a small prompt then add only what the observed failures justify" | growth-by-failure card pops at 39.7: tiny doc; a red failure tick appears, ONE bar gets added, repeats, bar count stays small |
| 43.6-46.9 | "what the observed failures justify. On the screen is a perfect example" | swap at 44.9 ON "on the screen": THEIR real CLAUDE.md / skill file, white card, cursor slow-scroll (mandatory, the creator says it is on screen) |
| 47.0-53.0 | "any deterministic rule, can use hooks for the formatting, never exposing secrets, or custom linting" | dark terminal card pops at 48.4 ON "hooks": hooks config; terracotta highlight jumps per named item, formatting 49.3, secrets 50.9, linting 52.4 |
| 53.0-53.5 | (breath) | BARE half-second, card out |
| 53.5-59.8 | "Comment rules and I will send you my exact process... comment and save this video" | CTA line only, above captions: comment "RULES" (terracotta keyword); swaps at 57.6 to "save this video". No cards. Creator Format 1's close is always visual-free talking head + CTA line |

## The 3 bare moments and why they make sense

1. 4.0-4.9, the WRONG. punch. Nothing competes with the turn.
2. 11.2-15.7, the thesis. The one important statement of the reel carries alone.
3. 53.0-53.5 into the CTA close. Creator Format 1's last 5-8s is always card-free.

## Asset decisions (resolved 2026-09-01)

- Rules files: illustrative replicas authored in assets/src/ (villain doc,
  anonymized client tree, closeup). Approved via first-10s previews.
- Study: REAL source found in ig-dashboard/analysis/talking-head-editorial/
  research/2026-08-27-why-more-rules-can-make-coding-agents-worse.md ->
  arXiv:2608.11095 (Chakrabarti, single-author preprint; real page captured).
- 44.9 "perfect example": the BECOMES takeover (the creator 2026-09-01), rules ->
  one high-level pattern, from the research doc's "Bad accumulation" vs
  "Distilled judgment" example. Replaced the good-claude-md scroll.
- CTA keyword: "RULES" (assumed from the audio, not yet confirmed).

## Feedback round B (2026-09-01, applied)

- 11.2-15.7 thesis is no longer bare: `rulewhy` card, agent reads a real rule,
  "the why" / "the reasoning" dashed slots pop a "?" on their spoken words.
- Designed cards refined: real text lines / real doc pages, never abstract
  grey bars; all text on black is white (grey banned).
- Rule-debt chart is a matplotlib-style white figure with labeled axes
  (x = rules in your CLAUDE.md, y = instructions followed %), legend, and a
  shaded "rule debt" region + annotation on the RULE DEBT hero beat.
- CTA is bigger (0.056W) and sits just above their head (yFrac 0.235).
- Word tails extended at 5 cut points (this./debt/linting./skills./video.,
  +280/150/200/200/250ms, measured from source RMS); spine now 60867ms,
  captions + visuals shifted mechanically, content untouched.
- ON-SUBJECT fix: the reel is about SKILLS, so every authored doc header says
  SKILL.md (villain doc, rulewhy = frontend-ui/SKILL.md, growth page) and the
  chart x-axis is "rules in your skills". Only the real arXiv page keeps its
  real CLAUDE.md title (never fake a source).

## Build notes

- ALL cards are SQUARE (the creator 2026-09-01, no rounded corners on overlays).
- Screenshot cards: GitHub light replicas are fine, alternate with dark
  designed cards (black chart, terminal) across the reel.
- Flat/designed cards: bars #C9C5BD / #E07850, charcoal #2A2A28 on light,
  white on black for chart/terminal cards.
- Zoom 1.00 to 1.04, translateY scroll, terracotta tint sweeps (0.24 light /
  0.32 dark) anchored to data-mark positions from assets/meta.json.
- Frameless "float" graphics allowed for icon moments (skill folders at the
  hook); folder art keeps its rounded folder shape.
- Cards y 0.05-0.33H; captions never move; hard pop in/out, zero easing
  choreography on the card itself.


approved: retroactive 2026-09-05. This layer shipped before the approval line existed; their verdicts are in the talking-head skill timeline (references/00-timeline.md). New plans get the line only after the creator has read the ideas.
