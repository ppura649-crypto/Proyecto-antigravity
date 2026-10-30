# edit-c-evals: visual plan v3 (pack: Creator Format 1)          geometry: head top 0.408H, chin 0.584H, band 0.085-0.418H, dark curtain above them, lit monitor 0.44-0.62H behind them

Take 2 of the raw take of reference edit C (56.0 s spine, d-hard, 30 clips, 1x from frame 0, no ramp). The skill scorecard video.
v2 (2026-09-06): the chip look copied onto the captions ("copy what we did for the NVIDIA captions"): Sora 700, the band 0.02 H up so the card bottom sits just under the hair line (their chip round 4), multi-word small stack lines centred (their chip rounds 1-2). Rows carry `in on` AND `out on` (the idea's first and last word) and a `clock`, `ms` is derived (`04c-timing.md`). Bare stretches are run-ups only, every word written out.
v3 (2026-09-06, their answers): **the transcript is king.** The chart shows the 10 tasks the creator says, not a real benchmark's two; their own skills are named nowhere and their real benchmark is not used ("don't name my own skills, make it like real, illustrating"); every number on a card is an illustration in the shape of a real benchmark and the plan says so; the punch is V1's bar dropping on WORSE. (confirmed); the CTA is "save this video" with the bookmark animation, the icon just above the line.
Title: `THE SCORECARD I RUN / BEFORE I TRUST A SKILL` (0-2100 ms, plain look, 52 px at 0.278H).
Hook stack: IF YOU'RE USING / A SKILL (0-1686) → "an" (1786) → OLD MODEL, (1966-2946) → "be making the" (2971-3571) → NEW MODEL / WORSE. (3571-4731, punch on WORSE. 3931).
Heroes: QUALITY PHILOSOPHY (25239), AVERAGE SCORE (41720). CTA keyword "EVALS" (53572).
Times below are spine ms from `captions.json` (word start; `out on` is the word the card must still be up for, its end is the card's `toMs`). `retime_plan.py` re-points them after any cut change.

## Facts, verified 2026-09-06

- **skills.sh is live**: https://www.skills.sh, "The Agent Skills Directory", the install line is `npx skills add <owner/repo>`, the leaderboard counter reads 1,331,546 all-time installs; top rows `find-skills` (vercel-labs/skills, 3.3M), `grill-me` (mattpocock/skills, 1.1M), `frontend-design` (anthropics/skills, 858.5K), `tdd` (mattpocock/skills, 847.0K). Fetched with a browser UA (a bare curl gets 0 bytes; the shot uses `shoot_url.mjs`, which is a browser).
- **Skill names on the drawn cards are real public skills from that leaderboard** (`frontend-design`, `tdd`, `grill-me`, `web-design-guidelines`, `domain-modeling`, `agent-browser`), never their own (their call).
- **No SKILL.md carries the model it was written for**: V1's `OLD MODEL` is a stamp in their own words, never a fabricated frontmatter line.
- **The numbers on V12/V13/V14 are illustrations** in the shape of a real benchmark (their call, "make it like real, illustrating"): no source line on those cards, no skill name, nothing attributed. The values are listed under "The chart" so nobody re-derives them.

## Ideas in the narration (not the sentences)

| # | idea (one picture) | first word → last word, spine ms | claim type |
|---|---|---|---|
| 1 | a skill file carries the model it was written for | SKILL 886 → MODEL, 2146 | existence |
| 2 | attached to a new model, the old skill drags its quality down | making 3091 → WORSE. 3931 | mechanism |
| 3 | every task the creator found became a skill, folders piling up | transform 6430 → skills. 8169 | mechanism |
| 4 | skills.sh is a real marketplace, the creator took skills off it | find 9754 → skills.sh, 10534 | existence |
| 5 | installed and used untested | use 11467 → them. 13841 | mechanism |
| 6 | one or two tries, one good result, happy | once 15130 → happy. 17870 | feeling / humour |
| 7 | one impressive result proves nothing | one 18418 → nothing, 19858 | mechanism |
| 8 | coding needs reliability and consistency: the next run disagrees | coding, 20898 → consistency. 22818 | mechanism |
| 9 | a scorecard, the quality philosophy first | define 24759 → first. 26259 | structure |
| 10 | the criteria are visual: hierarchy, spacing, typography, more | Clear 26600 → etc. 31183 | mechanism |
| 11 | each criterion carries its reasoning and a success state | reasoning 31897 → states. 32917 | structure |
| 12 | 5 to 10 tasks | create 34166 → tasks, 35246 | magnitude (their numbers) |
| 13 | run them with and without the harness, improvement unknown | run 36273 → improvement. 39279 | mechanism |
| 14 | do not compare the best output | compare 40220 → output. 40760 | mechanism |
| 15 | compare the average, the worst, how often it clears the bar | AVERAGE SCORE 41720 → bar? 45014 | mechanism (illustrated on 10 tasks) |
| 16 | no lift in the average, the bad results as common | average 45834 → common, 48961 | mechanism (illustrated) |
| 17 | delete it | delete 49500 → it. 49701 | humour |
| 18 | valuable only if good results repeat | valuable 50657 → repeatable. 52417 | thesis |
| 19 | comment EVALS, save this video | Comment 53233 | CTA |

## The layer, first 10 s

| # | in on | out on | idea | OBJECT (what the viewer sees) | mechanism (what moves, on which word) | clock | real / drawn | evidence | sfx | ms | job |
|---|---|---|---|---|---|---|---|---|---|---|---|
| V1 | MODEL, 2146 | WORSE. 4567 | 1+2 | `skilldrag`, frameless, the hook's picture: a SKILL.md file card (line-number gutter, `name:` and `description:` lines as grey text bars, no authored words) wearing a stamp `OLD MODEL` in the accent on its corner; to its right the Claude mark labelled `NEW MODEL` with a tall vertical quality bar beside it, full to the top | the file pops on MODEL, (2146, the first word past their 2-second rule; OLD at 1966 is inside it); it slides and docks onto the mark on making (3091); the bar DROPS on WORSE. (3931) with a crack line across it, the punch (confirmed: "the punch is on the worse"); the dropped bar holds 636 ms; cut at 4567 as "When I started" begins | beats | drawn, real Claude mark | `library/assets/` Claude agent icon | **the riser**: starts 2581, climaxes ON `WORSE.` 3931 (back-time 1350), vol 0.50 | 2421 | TEACHING |
| bare | WORSE. 4567 → would 6430 | | | "When I started building harnesses, I would", the run-up | | | | | | | |
| V2 | transform 6430 | skills. 8667 | 3 | `taskfold`, frameless: on the left, plain-english task chips (`write tests`, `design the page`, `review the PR`, `fix lint`, `write docs`, `deploy`), each one flying right and FOLDING into a blue macOS folder (the `skills` card's SVG folder) with a skill name under it (`tdd`, `frontend-design`, `code-review`, `lint`, `docs`, `deploy`; the first two are real leaderboard skills, none is their); the folders pile past the card's right edge, and more keep landing without names. No counter: the overflow is the point | one chip folds every ~230 ms from transform (6430) to skills. (8169); from 8169 to 8667 anonymous folders land at 90 ms and the pile spills off the edge | beats | drawn | skills.sh leaderboard 2026-09-06 for the two real names | technology-select on the first fold 6430, 0.45 | 2237 | TEACHING |
| bare | skills. 8667 → would 9754 | | | "Or even worse, I would", the run-up | | | | | | | |
| V3 | find 9754 | skills.sh, 11467 | 4 | the real skills.sh page at 600 CSS px on the light card: the header `The Agent Skills Directory`, the `$ npx skills add <owner/repo>` line and the first leaderboard rows, composed from the real pixels to fit the card WHOLE (the TechCrunch lesson) | pops whole on find (9754), holds; the sweep runs the `npx skills add` line on skills.sh, (10534); then a ~300 px glide down the leaderboard from 10534 to 11467 (`scroll.fromMs`) | still, glide from 10534 | real | https://www.skills.sh (live 2026-09-06, browser UA) | arrow whoosh on the sweep 10534, 0.60 | 1713 | PROOF |

## The layer, 10 s to the end

| # | in on | out on | idea | OBJECT | mechanism | clock | real / drawn | evidence | sfx | ms | job |
|---|---|---|---|---|---|---|---|---|---|---|---|
| V4 | use 11467 | them. 14067 | 5 | a `term` card with the macOS window chrome: `$ npx skills add mattpocock/skills` (the real command, the #2 pack on the leaderboard) types on use; three `added` lines with real pack names (`grill-me`, `tdd`, `teach`); then `> use grill-me` fires on right (11861); on testing (13481) a stamp `UNTESTED` in the accent lands across the window, tilted | type on use → them (11467-11861), the prompt fires on right, the stamp on testing; hold through them. (13841-14067) | beats | drawn terminal, real command and names; the output lines are ours and the plan says so | skills.sh leaderboard 2026-09-06 | technology-select on the stamp 13481, 0.50 | 2600 | TEACHING |
| bare | them. 14067 → maybe 15130 | | | "I would try them maybe", the run-up | | | | | | | |
| V5 | once 15130 | happy. 18300 | 6 | `tries`, frameless: two run cards side by side, `run 1` and `run 2` | run 1 lands on once (15130) with a grey ✗; run 2 lands on twice, (15730) blank; on good (16770) run 2's mark flips to a green ✓ and grows; on happy. (17870) a small drawn confetti burst (no emoji) and the ✓ pulses; hold 430 ms; hands over to V6 on the frame | beats | drawn | - | technology-select on run 1 and run 2 (15130, 15730, 0.40), message-pop on the ✓ 16770, 0.40 | 3170 | HUMOR |
| V6 | one 18418 | nothing, 20267 | 7 | `runs`, frameless: the run-2 card from V5 shrinks into a tile at the LEFT of a row of ten; the other nine tiles are dashed and empty | the shrink on one (18418); nine empty tiles land after it on proves (19318, one per 60 ms); on nothing, (19858) each empty tile resolves to a grey `?` (nobody ran them). No number on the card: the row IS "one out of many" | beats | drawn (callback of V5's object) | - | technology-select on the `?`s 19858, 0.40 | 1849 | TEACHING |
| bare | nothing, 20267 → for 20898 | | | "especially for", the run-up | | | | | | | |
| V6b | coding, 20898 | consistency. 23533 | 8 | `runs` again (`callback: v6`): the same ten tiles labelled `run 1`; a second row `run 2` under them | on coding, (20898) the row gets its `run 1` label and the `?`s resolve to a mix of ✓ and ✗ (you ran them); on reliability (21858) `run 2` lands under it, ✓ and ✗ arriving on ONE cadence (161 ms, the reference edit D lesson) to consistency. (22818), a different mix; on consistency. the columns that disagree (✓ over ✗, ✗ over ✓) flash in the accent; hold to 23533. The picture: consistency is the rows agreeing, and they do not | beats | drawn (callback, the state changed) | - | arrow whoosh on the disagreement flash 22818, 0.55 | 2635 | TEACHING |
| bare | consistency. 23533 → I 24759 | | | "Now, for every task, I", the run-up | | | | | | | |
| V7 | define 24759 | first. 26600 | 9 | `scorecard`: a light document card (the reference edit A `becomes-pattern` look, white sheet, terracotta left edge): title `Scorecard`; under it three empty ruled rows | the sheet lands on define (24759); the section header `Quality philosophy` types on the hero (25239); a `1` badge lands beside the header on first. (26259); hands over to V8 on Clear | beats | drawn | - | technology-select on the header 25239, 0.45 | 1841 | STRUCTURE |
| V8 | Clear 26600 | etc. 31700 | 10 | `scorecard` (`callback: v7`): the three ruled rows fill, each with a mini UI tile that SHOWS the criterion, the criterion under it in the caption font: a tile with one big heading over small body bars (Clear visual hierarchy); a tile with a dotted 8 px grid and boxes snapping to it (Consistent spacing); a tile with body type at two sizes, the tiny one greyed (Readable typography) | tile 1 on Clear (26600), tile 2 on Consistent (28300), tile 3 on Readable (29700); on etc. (31183) a fourth greyed row `…` slides in under them; hold to 31700 | beats | drawn | - | technology-select on the three words 26600 / 28300 / 29700, 0.45 / 0.40 / 0.40 | 5100, `long: "three criteria on their own words, the fourth row on etc."` | TEACHING |
| V9 | reasoning 31897 | states. 33600 | 11 | `scorecard` (`callback: v7`): the first row (hierarchy) expands downward, the sheet pushing to fit (never clamped): a `reasoning` sub-row with two grey ruled text bars, then a `success state` sub-row with a green ✓ and a thumbnail of the hierarchy tile done right. The sub-row labels are their two words; no authored sentence | `reasoning` slides out on reasoning (31897); `success state` on success (32677); hold through states. (32917-33600) | beats | drawn | - | technology-select ×2, 31897 / 32677, 0.45 | 1703 | STRUCTURE |
| bare | states. 33600 → I 34166 | | | "Then I", the run-up | | | | | | | |
| V10 | create 34166 | tasks, 35967 | 12 | `taskfan`, frameless: one task card (a small UI wireframe thumbnail, a `task` label, no sentence) fanning into copies, each thumbnail a slightly different layout; a mono counter beside the fan | the card lands on create (34166); the fan opens to 5 on `5` (34406) and the counter reads `5`; grows to 10 on `10` (35066) and the counter reads `10`, the numbers the creator says; hold through tasks, (35246-35967) | beats | drawn | - | message-pop on `10` 35066, 0.40 | 1801 | TEACHING |
| bare | tasks, 35967 → I 36273 | | | "and I", the run-up | | | | | | | |
| V11 | run 36273 | improvement. 39733 | 13 | `lanes` on ONE black card: two lanes; the top lane head is the Claude mark WITH a skill folder, the bottom lane head the Claude mark alone; the ten task thumbnails from V10 stream through both lanes; at the right end each lane empties into a dashed result box | the stream starts on run (36273); lane labels land on with (36833: `with harness`) and without (37359: `without`); on improvement. (39279) a `?` pulses in both result boxes (the rulewhy glitch): the result is not known yet | beats (the stream is ambient) | drawn, real Claude mark | - | technology-select on the `?` 39279, 0.45 | 3460 | TEACHING |
| bare | improvement. 39733 → not 40220 | | | "But do not", the run-up | | | | | | | |
| V12 | compare 40220 | output. 41233 | 14 | `mplruns`: a matplotlib-LOOKING strip plot drawn in SVG on the white card (the `cards/Chart.tsx` idiom, DejaVu, spines, ticks): two rows `with harness` / `without harness`, x = score 0-100, TEN dots per row (the 10 tasks the creator says); no title, no source line (an illustration, their call) | the figure pops with its dots on compare (40220); the highest dot of EACH row is circled on best (40640): both read 95, the best outputs are equal; both circles are struck through in the accent on output. (40760); hands over to V13 on the frame (41720) | beats | drawn, illustrative values (listed under "The chart") | - | arrow whoosh on the strike 40760, 0.60 | 1013 | PROOF |
| V13 | AVERAGE SCORE 41720 | bar? 45467 | 15 | `mplruns` (`callback: v12`): the same figure | a mean line drops across each row on AVERAGE (41720), `90` and `67` land at their ends; the lowest dot of each row is circled on worst (42528), `83` and `49`, the 49 in the accent; a vertical `quality bar` line lands at 85 on reach (44414); on bar? (45014) the dots past it light green and a count lands per row, `8 of 10` / `1 of 10`; hold to 45467 | beats | drawn, illustrative (callback, three beats on three words) | - | message-pop on the mean 41720, 0.40; message-pop on the counts 45014, 0.40 | 3747 | PROOF |
| bare | bar? 45467 → the 45834 | | | "If the", the run-up | | | | | | | |
| V14 | average 45834 | common, 49500 | 16 | `benchtable`: a benchmark summary in the shape a real eval tool prints it, drawn on the light card in mono: three rows `average`, `worst run`, `quality bar`, two columns `without` / `with`, a `delta` column: `98 → 95 (−3)`, `71 → 70 (−1)`, `7 of 10 → 6 of 10`. The harness made it no better; their example numbers ("if it does only 98 to 95 then it means it doesn't work") | pops whole on average (45834); the `average` row is swept on improve, (46554) and its delta flips to the accent; the `worst run` row is swept on common, (48961); hold to 49500 | beats | drawn, illustrative, no skill named | - | arrow whoosh on the first sweep 46554, 0.60; a second, lower, on 48961, 0.45 | 3666 | PROOF |
| V15 | delete 49500 | it. 50600 | 17 | `trash`, frameless: a blue skill folder (the V2 folder) dragged into the macOS Trash (drawn) | the drag runs delete → it. (49500-49701); the folder shrinks in, the Trash bulges, a poof on it. (49701); hold 600 ms to 50600 (a card lingering into "A skill is", a run-up) | beats | drawn | - | pop-up notification on the poof 49701, 0.50 | 1100 | HUMOR |
| V16 | valuable 50657 | repeatable. 53233 | 18 | `runs` (`callback: v6`): the two rows from V6b, but now every column AGREES: `run 1` all ✓, `run 2` all ✓ under them | row 1 lands on valuable (50657, ten ✓ at 60 ms); row 2 lands under it on one cadence from makes (51757) to repeatable. (52417, 66 ms each), every ✓ lining up under a ✓; on repeatable. both rows pulse together; hold to 53233 and hand over to the CTA | beats | drawn (callback, the state changed: the rows agree) | - | technology-select on the last ✓ 52417, 0.45 | 2576 | TEACHING |
| V17 | Comment 53233 | process. 56033 | 19 | the CTA line above their head at 0.30 H: `comment "EVALS"`, then `save this video` with the IG bookmark icon popping in JUST ABOVE the line (`iconAbove`, new on the `cta` kind, off by default so reference edit A re-renders unchanged), the cursor gliding in and the icon filling white on the click | swap on send (54592), the click on process. (55252): the cursor needs ~660 ms to glide in (reference edit A's spacing; the component refuses less than 310) | cta | | | pop-up on the swap 54592, 0.60; mouse click 55252, 0.50 | 2800 | CTA |

18 events over 56.0 s (one per 3.1 s; their ask is coverage). 1 real capture (skills.sh), the real Claude mark on two cards, real public skill names on two drawn objects, 13 drawn objects, the CTA. Longest bare stretch 1.9 s (the first run-up). Nothing before 2.15 s.

## Bare on purpose (run-ups only, every word of the stretch written out)

0-2146 the hook stack alone, their rule: "IF YOU'RE USING A SKILL [built by] an OLD"; 4567-6430 "When I started building harnesses, I would" (run-up to transform); 8667-9754 "Or even worse, I would" (run-up to find); 14067-15130 "I would try them maybe" (run-up to once); 20267-20898 "especially for" (run-up to coding,); 23533-24759 "Now, for every task, I" (run-up to define); 33600-34166 "Then I" (run-up to create); 35967-36273 "and I" (run-up to run); 39733-40220 "But do not" (run-up to compare); 45467-45834 "If the" (run-up to average); 50600-50657 "is" (the tail of "A skill is", V15's hold covers the rest); 53233-56033 the CTA line only.

Every stretch ends on a function word and hands to the next card. No payload word is bare: the punch (WORSE.) is V1's bar dropping, the thesis (reliability, consistency) is V6b, the condition (average, bad results) is V14.

## The SFX, the whole mix list (stage 4 mixes exactly these; spine ms; files in `motion-lab/public/audio/sfx/`)

| # | moment | spine ms | file | back-time | vol |
|---|---|---|---|---|---|
| 1 | **the riser** into the punch: starts as the file docks, climaxes ON `WORSE.` | start 2581, peak 3931 | `popular-riser-metallic-sound-effect-trimmed.mp3` | 1350 | 0.50 |
| 2 | the first task folds into a folder | 6430 | `mixkit-modern-technology-select-3124.wav` | 70 | 0.45 |
| 3 | skills.sh install line sweep | 10534 | `mixkit-arrow-whoosh-1491.wav` | 270 | 0.60 |
| 4 | `UNTESTED` stamp | 13481 | technology-select | 70 | 0.50 |
| 5 | run 1, run 2 land | 15130, 15730 | technology-select ×2 | 70 | 0.40 |
| 6 | the ✓ on `good` | 16770 | `mixkit-message-pop-alert-2354.mp3` | - | 0.40 |
| 7 | the nine `?` | 19858 | technology-select | 70 | 0.40 |
| 8 | the rows disagree | 22818 | arrow whoosh | 270 | 0.55 |
| 9 | `Quality philosophy` header | 25239 | technology-select | 70 | 0.45 |
| 10 | the three criterion tiles | 26600, 28300, 29700 | technology-select ×3 | 70 | 0.45, 0.40, 0.40 |
| 11 | reasoning, success state | 31897, 32677 | technology-select ×2 | 70 | 0.45 |
| 12 | the fan reaches `10` | 35066 | message-pop | - | 0.40 |
| 13 | the `?` in the result boxes | 39279 | technology-select | 70 | 0.45 |
| 14 | the best dots struck | 40760 | arrow whoosh | 270 | 0.60 |
| 15 | the mean lines, the counts | 41720, 45014 | message-pop ×2 | - | 0.40 |
| 16 | the benchmark rows swept | 46554, 48961 | arrow whoosh ×2 | 270 | 0.60, 0.45 |
| 17 | the poof into the Trash | 49701 | `mixkit-dry-pop-up-notification-alert-2356.wav` | - | 0.50 |
| 18 | the last ✓ of run 2 | 52417 | technology-select | 70 | 0.45 |
| 19 | CTA swap, then the click on process. | 54592, 55252 | pop-up notification, `computer-mouse-click-352734.mp3` | - | 0.60, 0.50 |

25 hits in 56 s, more than the chip (19 in 72 s) because the method has more landings; the blips are the quiet kind. If that reads busy, drop 5, 7 and 11 first. Nothing on a card pop, a scroll or a takeover. Presence measured after the mix (`05-sound.md`).

## The chart (illustrative values, fixed here so the builder and the plan agree; no source line on the card)

- **V12/V13, ten tasks per setup, score 0-100**: `with harness` 92, 88, 95, 90, 84, 93, 89, 91, 83, 94 (mean 89.9 → `90`, worst 83, 8 of 10 at or past the bar); `without harness` 95, 61, 72, 55, 78, 66, 49, 70, 58, 63 (mean 66.7 → `67`, worst 49, 1 of 10 past the bar). The best of each row is 95: comparing bests says "same", comparing averages says 90 against 67. The bar is 85.
- **V14, the delete case**: `average` 98 → 95, `worst run` 71 → 70, `quality bar` 7 of 10 → 6 of 10. Their numbers for the first row; the other two follow the sentence ("the bad results do not become less common").

## Real artifacts to fetch at build (live-checked 2026-09-06)

- skills.sh (V3): `shoot_url.mjs https://www.skills.sh assets/skillssh.png --vw 600` (browser UA, the page is a JS app); compose the clipping from the real pixels: header + `npx skills add` line + the first ~6 leaderboard rows, so it fits the 0.33 H card whole; the glide starts only at 10534.
- marks: the Claude agent icon from `library/assets/` (V1, V11); the skill folder is the `skills` card's SVG (V2, V11, V15). Frameless, nothing behind either.

## Their answers, 2026-09-06 (the v2 judgment calls, closed)

1. "What ??? say 5-10 variations, the transcript is ALWAYS KING": the chart shows ten dots per row, illustrative, not the real two-task benchmark. Rule for the harness: the number of things on a card is the number the creator says; a real artifact never overrides the transcript.
2. "No don't name my own skills, make it like real, illustrating if it does only 98 to 95 then it means it doesn't work. Don't look at our real skill": their skills and their benchmark files are out of the video (V2 names, V12-V14 data); V14 is a drawn benchmark summary with 98 → 95 as the average row.
3. "Yes the punch is on the 'worse'": V1 holds through WORSE., the bar drop is the punch.
4. "Yes have the save the video with animation, make the icon just above the save this video. Be careful": the reference edit A CTA (swap + bookmark + cursor click) with the icon moved from the fixed 0.148 H to just above the text line (`iconAbove`), shown on a still before any render.

## Considered, not used

- Their real skill benchmark (creator-format-2-style, 2026-09-04, 2 tasks per setup) as the chart's data, and its `benchmark.md` as the "delete it" proof: both dropped on their word (the transcript says 10 tasks; their skills stay out of the video).
- A real Finder screenshot of a skills folder for V2: Finder cannot be shot headless, and a folder list is a list. The drawn Finder folders keep the transform (chip → folder) visible.
- A real SKILL.md capture for V1: none carries a model line; a fabricated frontmatter is banned (`SKILL.md` "never fabricate").
- The `race` kind for V11: its grammar (an AI bar lapping a human crawling to a wall) says "AI beats human", not "with vs without".

approved: 2026-09-06 the creator, "build the whole thing with opus agents ?" (v3: the transcript is king, their skills named nowhere, punch on WORSE., CTA icon just above the line)
