# edit-c-chip: visual plan v3 (pack: Creator Format 1)          geometry: head top 0.374H, chin 0.554H, band 0.105-0.404H, dark curtain above them, lit monitor 0.44-0.63H behind them

Take 3 of the raw take of reference edit C (72.2 s spine, d-hard, 33 clips, 1x from frame 0, no ramp). The NVIDIA / Jalapeño video.
v3 (2026-09-05, their words): NOTHING on screen in the first 2 s ("fir the first 2 second no visual nws. After yes"), so V1 enters on `engineers.` 2233; the visuals that were slide crops or a screenshot of someone else's chart (the Hot Chips roadmap, the SemiAnalysis tokens-per-$ chart, the two matplotlib PNGs) are DRAWN by us from the same real numbers, word-synced ("it doesn't look good, we can really make it: CREATIVE, AND ULTRA ON SYNCH WITH MY WORD"); real captures stay where the artifact IS the claim (an article, a post, a repo, the chip itself). Built by five Opus 5 agents, one component family each, zero helpers, from the rows below + `packs/creator-format-1/pack.json`.
Title: `9 MONTHS TO BEAT NVIDIA / AND CUDA MAY BE DEAD` (0-2100 ms, label look once the QA look is approved; 23 chars at 48 px Helvetica = ~0.68W).
Hook stack: IT TOOK / NVIDIA / 20 YEARS (0-2013) → "and thousands of engineers." (words, 1213-2867) → OPENAI / DID IT IN / 9 MONTHS. (2867-4860, punch on MONTHS. 4060).
Heroes: JALAPENO (6726), GLUON (46477). CTA keyword "KERNEL" (69304).
Times below are spine ms from `captions.json`; `retime_plan.py` re-points them after their cut gate.
Research staged in `research/` (source texts + `research/img/`, every artifact below is a local file already looked at; `research/SOURCES.md` has the numbers).

## Facts, verified 2026-09-05 (every real row and every chart points at one of these)

- **Nine months** is OpenAI's own figure: initial RTL Feb 2025 → tape-out Nov 2025, the "9 months" bracket on its Hot Chips slide 3 (`research/img/sth-slide-03.jpg`); Brockman to CNBC: "designed from end to end in nine months with help from the company's AI models". SemiAnalysis counts ~16 months from team hiring (mid-2024). Milestones on the slide: Oct'24 architecture concept, Feb'25 initial RTL, Jul'25 RTL freeze, Nov'25 tape-out, May'26 first silicon, May'26 Codex runs on Jalapeño, Jul'26 ChatGPT Work.
- **Nvidia, 20 years and thousands of engineers**: CUDA shipped with the G80 / GeForce 8800 GTX on Nov 8, 2006; Nvidia's own "20 Years of CUDA" post (developer forum, Mar 24, 2026) says **6 million developers**. Headcount from the 10-Ks (stockanalysis.com): 2,737 employees FY2006 → 42,000 FY2026, **31,000 of them in R&D** (TheStreet, Mar 2026). Their "thousands of engineers" is an understatement, never a stretch.
- **Announced June 24, 2026** with Broadcom: TechCrunch "OpenAI unveils its first custom chip, built by Broadcom" (published 2026-06-24T14:54Z), its hero image is Sam Altman and Hock Tan holding the wafer (`research/img/techcrunch-og.jpg`, the same photo SemiAnalysis credits "Source: OpenAI"). CNBC the same day: an "Intelligence Processor", initial deployment end of 2026; Hock Tan: "small prototype development" late 2026, "really ramp up in '27 and really going full tilt in first half '28".
- **Inference only**: an ASIC "built from a blank slate exclusively for LLM inference" (SemiAnalysis), "runs AI models but doesn't train them" (the-decoder). 700 W package, 216 GB HBM4, 15.4 TB/s, 13.4 MXFP4 PFLOPS, one ~840 mm² compute die (reticle is 858 mm²) + 6 HBM4 stacks + an IO chiplet (Tom's Hardware; the package floorplan is `research/img/sth-slide-32.jpg`, the real board photo `research/img/sth-chip-final.jpg`).
- **SemiAnalysis, Aug 25, 2026**, "OpenAI Jalapeño: Better Than Nvidia Blackwell" (Bryan Shan, Myron Xie, Jordan Nanos + 3): "OpenAI invited us to look at their chip, go to their labs to check out how real it is, and benchmark it with our InferenceX suite"; "We verified the InferenceX runs in person in the lab" (all numbers provided by OpenAI, not the full suite). https://newsletter.semianalysis.com/p/openai-jalapeno-better-than-nvidia
- **Tokens per watt** (OpenAI at Hot Chips, package-TDP-normalised InferenceX, peak efficiency, mixed tokens/s per kW): GPT-OSS 120B **85,448 vs 44,960** on GB200 (1.9x); DeepSeek R1 **19,641 vs 11,781** on GB300 (1.7x); Kimi K2.5 **18,195 vs 11,862** on GB300 (1.5x). Slides 10 / 12 / 16 in `research/img/`. Their "almost 2 times" = the GPT-OSS 1.9x.
- **Latency**: end-to-end, same decode speed: GPT-OSS 1.03 s vs 1.80 s (1.7x); DeepSeek R1 **1.65 s vs 5.99 s (3.6x)**; Kimi 1.56 s vs 5.31 s (3.4x). Their "3.6 times" = DeepSeek R1.
- **Vera Rubin**: in full production since June 1, 2026, shipping H2 2026 ("Nvidia's newest chip" holds). SemiAnalysis: "On perf/TCO, Vera Rubin and Jalapeño are head-to-head, producing almost the same number of output tokens per $" (Rubin with speculative decoding, Jalapeño without); on tokens per MW Jalapeño is above Rubin's July curve. The two charts are `research/img/sa-tokens-per-dollar-vs-rubin-deepseek.png` and `sa-tokens-per-mw-vs-rubin-deepseek.png`.
- **Kernels**: "OpenAI writes Jalapeño kernels like assembly. Each kernel gets hand-tuned code, some running to ~3,000 lines, backed by correctness checks and a custom sanitizer" (SemiAnalysis); "OpenAI had no internal implementation of MLA kernels until they benchmarked DeepSeek", Codex wrote one. Hot Chips slide 31: an internal AI system took the DeepSeek MLA kernel from **0.31% of roofline (functional only) to 88.94% in ~40 h** (31.69% FP8 attention matmuls, 59.24% attention rescaling with tiled lookahead, 77.14% value-matmul scheduling, 88.94% key-tile prefetch), "1.5-1.8x faster than the existing expert-written implementation on attention and MoE blocks" (`research/img/sth-slide-31.jpg`).
- **Gluon** is real and public: OpenAI's kernel language on top of Triton, `triton-lang/triton/python/triton/experimental/gluon/` (live 2026-09-05 via the GitHub API: `__init__.py`, `_compiler.py`, `_runtime.py`, `amd/`, `language/`, `nvidia/`; `language/nvidia/blackwell/__init__.py` is 704 lines; the tutorials in `python/tutorials/gluon/` run to 77 KB for `11-tcgen05-mma-scaled.py`). GPT-5.6 Sol "autonomously rewrote and optimized OpenAI's production kernels ... in Triton and Gluon", 20% lower serving cost (The New Stack on OpenAI's own post).
- **The quote**: "The CUDA moat is potentially dead given how fast OpenAI can bring up new models on their silicon." Verbatim in the SemiAnalysis article. Also there: "In a weird twist of fate, OpenAI models like GPT 5.6 Sol, which currently run on NVIDIA GPUs, have been used to design a chip that poses a real threat to the CUDA moat."
- **AI designed the chip**: slide 28, "AI helped us build Jalapeño faster and made it better": measured PPA wins vs an optimized human baseline, BF16 multiplier 56%, FP4 dot 21%, FP32 accumulator 10%, matrix unit area -10%, SIMD unit area -8%; more than half the core written in the XLS hardware language with OpenAI's own model searching PPA (Tom's Hardware). `research/img/sth-slide-28.jpg`.
- **Versions 2 and 3**: slide 34 roadmap, Gen 1 Jalapeño, Gen 2 "approaching tapeout", Gen 3 "planned" (Richard Ho said "operational" on stage). `research/img/sth-slide-34.jpg`.
- **NOT found anywhere**: "no sane human wants to write it all day". Stays as their spoken line; V17 shows the code and attributes nothing.

## Ideas in the narration (not the sentences)

| # | idea (one picture) | trigger word + spine ms | claim type |
|---|---|---|---|
| 1 | Nvidia: 20 years and thousands of engineers | NVIDIA 373 → engineers. 2233 | magnitude with a source |
| 2 | OpenAI did it in 9 months, on the same scale | OPENAI 2867 → MONTHS. 4060 | magnitude with a source |
| 3 | the announcement is real, dated, and this is the chip | announced 6246 → chip 8232 | existence |
| 4 | a chip built to RUN models, not train them | optimized 8592 → models. 9912 | mechanism |
| 5 | people were skeptical, them too | skeptical, 11242 → included. 12082 | feeling / humour |
| 6 | the SemiAnalysis report exists, came out last week | week. 13853 → SemiAnalysis, 14267 | existence |
| 7 | measured on site, against Blackwell | Measured 17900 → Blackwell. 21671 | mechanism |
| 8 | almost 2x tokens per watt | 2 22270 → watt. 23770 | magnitude with a source |
| 9 | 3.6x lower latency | 3.6 24200 → latency. 25593 | magnitude with a source |
| 10 | on par with Vera Rubin | par 26758 → chip. 29458 | magnitude with a source |
| 11 | a chip is nothing without a kernel: tiny programs, each math step | kernel. 31174 → step. 34209 | mechanism |
| 12 | CUDA has been the standard for 20 years | CUDA. 36730 | existence |
| 13 | used by millions of developers | 4 million 39476 → developers. 40196 | magnitude with a source |
| 14 | a moat | moats. 41928 | metaphor |
| 15 | OpenAI built its own, almost entirely with AI models | built 43537 → models. 45622 | magnitude with a source (the roofline curve) |
| 16 | it is called Gluon and it is very low-level | GLUON 46477 → day. 51056 | existence |
| 17 | SemiAnalysis: the CUDA moat is potentially dead | say 52839 → dead. 55046 | existence (a quote) |
| 18 | production starts end of 2026 | production 55442 → 2026. 57242 | date |
| 19 | versions 2 and 3 are already planned | version 60017 → 3. 60857 | existence |
| 20 | the flywheel: AI designs the chip, writes its software, runs on it, faster each loop | design 62409 → faster. 68277 | mechanism |
| 21 | comment KERNEL, follow | Comment 68933 | CTA |

## The layer, first 10 s

| # | in on | idea | OBJECT (what the viewer sees) | mechanism (what moves, on which word) | real / drawn | evidence | sfx | ms | job |
|---|---|---|---|---|---|---|---|---|---|
| V1 | engineers. 2233 | 1+2 | `twoscale`, ONE frameless object, the hook's comparison: the real Nvidia eye (Nvidia's own SVG, green) with a long horizontal bar beside it, `2006` and `2026` at its ends, a dense field of tiny white dots filling under the bar with a mono counter rolling to `31,000 engineers`; then, under it, the real OpenAI mark (white form) with a SHORT bar on the SAME scale (9/240 of the long one) and `9 months` at its tip. The short bar next to the long one is the joke, and the picture is the punch. Nothing before 2233: their 2-second rule | the Nvidia row pops whole on engineers. (2233): bar drawn 2233 → 2500, dots fill + counter rolls 2233 → 2800; the OpenAI mark pops on OPENAI (2867); the short bar draws across DID IT IN (3460 → 3760) and lands whole with `9 months` on 9 MONTHS. (4060), holds 686 ms; hard cut on 24th (4746) | real marks, drawn bars with real values | Nvidia eye from Nvidia's logo SVG (Wikimedia), OpenAI white mark logo.dev; CUDA Nov 2006 (Nvidia "20 Years of CUDA"); 31,000 R&D employees FY2026 (TheStreet / Nvidia 10-K); nine months per OpenAI slide 3 | **the riser**: starts 2710, as "engineers." ends and clip 0 cuts (2867), climaxes ON `MONTHS.` 4060 (back-time 1350), vol 0.50 | 2513 | PROOF |
| V2 | announced 6246 | 3 | the real TechCrunch article header at 600 CSS px: headline "OpenAI unveils its first custom chip, built by Broadcom", the byline with `June 24, 2026`, and the article's own hero photo, Sam Altman and Hock Tan holding the wafer | pops on announced; the sweep runs the headline on JALAPENO (6726); the photo is the frame's weight | real | https://techcrunch.com/2026/06/24/openai-unveils-its-first-custom-chip-built-by-broadcom/ (og:image = the wafer photo, `research/img/techcrunch-og.jpg`) | arrow whoosh on the sweep 6726, 0.60 | 1266 | PROOF |
| V3 | first 7512 | 3 | the real chip: the Jalapeño package on its bring-up board (the STH Hot Chips photo, `A1`, six HBM stacks visible around the die), naked archival image on the light card | pops on first; slow push 1.00 → 1.06 into the die on chip (8232); cut on optimized | real photo | ServeTheHome, Hot Chips 2026 (`research/img/sth-chip-final.jpg`) | - | 1080 | NAMING |
| V4 | optimized 8592 | 4 | `die`: a drawn die on ONE black card, labelled `Jalapeño`, with two arrows leaving it: `train` in grey, `run` in the accent with tokens streaming out as a fast dotted line | the two arrows appear on optimized; `train` strikes through on run (9372); the token stream starts on AI models. (9492 → 9912) | drawn | inference-only per OpenAI / Broadcom / SemiAnalysis | technology-select on the strike 9372, 0.45 | 1775 | TEACHING |

## The layer, 10 s to the end

| # | in on | idea | OBJECT | mechanism | real / drawn | evidence | sfx | ms | job |
|---|---|---|---|---|---|---|---|---|---|
| V5 | skeptical, 11242 | 5 | `bubbles`: three grey reply bubbles, frameless, `9 months? sure.` / `benchmarks or it didn't happen` / `wake me up when it ships`, and on `me included` their own real profile photo popping in as the fourth bubble | bubbles land 150 ms apart from skeptical (11242, 11392, 11542); their avatar on included. (12082) | drawn bubbles (illustrative, unattributed), real avatar | the ig.db profile picture or `the creator's own avatar image` | technology-select on their avatar 12082, 0.50 | 1531 | HUMOR |
| V6 | week. 13853 | 6 | the real SemiAnalysis article header at 600 CSS px: "OpenAI Jalapeño: Better Than Nvidia Blackwell", the subtitle, the six authors, the `Aug 25, 2026` byline | pops on week.; the byline sweep on SemiAnalysis, (14267); holds through `trusted` | real | https://newsletter.semianalysis.com/p/openai-jalapeno-better-than-nvidia (`research/6456d0ae.txt`) | arrow whoosh on the sweep 14267, 0.60 | 2088 | PROOF |
| bare | independent 15941 → shop, 17501 | | the credential, spoken | | | | | | |
| V7 | Measured 17900 | 7 | `bench`: a lab bench on ONE black card: two chip packages side by side, `Jalapeño` and `Blackwell` (the real Nvidia mark on the second), a probe line dropping onto each, and a meter with a needle between them | probes touch on site, (18551); the needle swings on performance (19271) and settles toward Jalapeño on chip (20171); cut before `compared` | drawn, real Nvidia mark | SemiAnalysis: "We verified the InferenceX runs in person in the lab" | - | 3000 | TEACHING |
| bare | compared 20531 → Blackwell. 21671 | | the villain named, spoken | | | | | | |
| V8 | Almost 21900 | 8 | `mplbars`: a matplotlib-LOOKING figure drawn in SVG on the white card (DejaVu, spines, ticks, the default cycle, exactly what `cards/Chart.tsx` does), `Tokens per kW at peak efficiency, Jalapeño vs Nvidia (InferenceX)`: three small panels (each model on its own y scale), GPT-OSS 120B `85,448 vs 44,960`, DeepSeek R1 `19,641 vs 11,781`, Kimi K2.5 `18,195 vs 11,862`, the Jalapeño bar in the accent, `1.9x / 1.7x / 1.5x` over each pair, source line `OpenAI, Hot Chips, Aug 25 2026 · SemiAnalysis InferenceX, package-TDP normalised` | the Nvidia bars stand at in; the Jalapeño bars RISE on 2 times (22270 → 22510) past them; the `1.9x` labels land on watt. (23770) | drawn from real numbers, matplotlib idiom (drawn, not a PNG, so the bars move on their words) | slides 10 / 12 / 16 (`research/img/sth-slide-1{0,2,6}.jpg`) | message-pop on the labels 23770, 0.40 | 2300 | PROOF |
| V9 | 3.6 24200 | 9 | `latency`: a race, frameless: two lanes, `Jalapeño` and `GB300`, a token dot leaving each at the same instant, the lanes drawn to the REAL ratio, `1.65 s` and `5.99 s` at the finish, `3.6x` in mono when the first dot arrives | dots launch on 3.6 (24200); Jalapeño's arrives on lower (25293); the Nvidia dot is still travelling on latency. (25593) and never gets there before the cut | drawn to a real ratio | DeepSeek R1 end-to-end, slide 12 | message-pop on `3.6x` 25593, 0.40 | 2133 | TEACHING |
| V10 | par 26758 | 10 | `curves`: OUR chart on ONE black card in Creator Format 1's chart language (black ground, thin lines, progressive draw): x `tokens/s per user`, y `output tokens per $`, two curves read off SemiAnalysis's own figure point by point, `Vera Rubin (VR200 NVL72)` in white and `Jalapeño` in the accent, and they lie on top of each other from ~150 tok/s/user on; `≈` lands between the two names; source line `SemiAnalysis InferenceX, DeepSeek R1, 08/22/2026` | axes pop on par; both curves DRAW left to right par → Rubin, (26758 → 28300); the names land on Vera (27418, Rubin) and on chip. (29458, Jalapeño); the overlap is what the eye sees at the end | drawn from real data points (14 + 9 points read off the real chart, `research/img/sa-tokens-per-dollar-vs-rubin-deepseek.png`) | the sentence "head-to-head, producing almost the same number of output tokens per $" | - | 2909 | PROOF |
| bare | But a chip 29667 → the 30874 | | the turn | | | | | | |
| V11 | kernel. 31174 | 11 | `kernelslot`: the die from V4 again, changed: an empty dashed slot in its centre labelled `kernel`; under it a block of REAL Gluon code (from `python/tutorials/gluon/`, mono, dark) that slides into the slot line by line, each line lighting one cell of the die's 8x8 grid | the slot pulses on kernel.; lines slide in from programs (32289) to math (33909), one cell per line, the grid fully lit on step. (34209) | drawn die, real code text | https://github.com/triton-lang/triton/tree/main/python/tutorials/gluon (`01-intro.py` lines 84-93, `memcpy_kernel`, fetched live 2026-09-05) | technology-select on the first line 32289, 0.45 | 3000 | TEACHING |
| bare | For more than 20 years 34633 → was 36370 | | the setup | | | | | | |
| V12 | CUDA. 36730 | 12 | the real Nvidia developer-forum post "20 Years of CUDA: Honoring the Architects of the Accelerated Age" at 600 CSS px, light card, the title swept | pops on CUDA.; the sweep on Developed (37233) | real | https://forums.developer.nvidia.com/t/20-years-of-cuda-honoring-the-architects-of-the-accelerated-age/364654 (posted 2026-03-24, "6 million developers") | arrow whoosh on the sweep 37233, 0.60 | 1966 | PROOF |
| V13 | 4 million 39476 | 13 | `devfield`: a dense field of small developer marks filling the black card with a mono counter rolling up to `6,000,000`, source line `Nvidia, GTC March 2026` | the field fills 4 million → developers. (39476 → 40196); the counter lands with the last mark | drawn field, real figure (their line says "more than 4 million", the screen shows Nvidia's own 6 million) | the forum post above / Nvidia on X 2026-03 | message-pop on the count 40196, 0.40 | 1732 | PROOF |
| V14 | moats. 41928 | 14 | `moat`: a castle on an island, frameless and drawn: the Nvidia mark on the keep, a ring of water around it labelled `CUDA`, three grey rival chips stopped on the far bank | the water fills the ring on moats.; the rivals bump the bank on now (42517) | drawn | - | - | 1609 | TEACHING |
| V15 | built 43537 | 15 | `mplline`: a matplotlib-LOOKING line figure drawn in SVG (white card, the Chart.tsx idiom): `One kernel, AI-optimised: % of roofline vs hours`, five annotated points from OpenAI's slide, `functional only 0.3%` → `31.7%` → `59.2%` → `77.1%` → `88.9%` at ~40 h, the last point in the accent, a note `1.5-1.8x faster than the expert-written kernel`, source `OpenAI, Hot Chips 2026` | the line draws itself built → own, (43537 → 44017); the points pop on almost entirely (44242 → 44482); the `88.9%` label and the note land on AI models. (45262 → 45622) | drawn from real numbers, matplotlib idiom, so the line draws on their words | slide 31 (`research/img/sth-slide-31.jpg`) | message-pop on `88.9%` 45622, 0.35 | 2563 | PROOF |
| V16 | GLUON 46477 | 16a | the real GitHub directory `triton-lang/triton / python / triton / experimental / gluon` at 600 CSS px (`__init__.py`, `_compiler.py`, `_runtime.py`, `amd`, `language`, `nvidia`) | pops on the hero; a sweep on the breadcrumb `gluon` | real | https://github.com/triton-lang/triton/tree/main/python/triton/experimental/gluon (live 2026-09-05, GitHub API) | riser into GLUON: starts 45127, climax ON 46477, vol 0.34 | 1440 | PROOF |
| V17 | low-level 47917 | 16b | a real Gluon source file scrolling fast as dense low-level code (dark GitHub file view at 600 CSS px), the line count in the corner | one glide from low-level to all (47917 → 50876); the density is the argument, nothing is attributed | real | `python/triton/experimental/gluon/language/nvidia/blackwell/__init__.py` (704 lines) or `python/tutorials/gluon/11-tcgen05-mma-scaled.py` (77 KB), pick the denser at build | - | 2959 | PROOF |
| bare | day. 51056 → that 53019 | | "no sane human" is their line; nothing on screen claims it | | | | | | |
| V18 | say 52839 | 17 | the SemiAnalysis article scrolled to the sentence "The CUDA moat is potentially dead given how fast OpenAI can bring up new models on their silicon.", 600 CSS px, the sentence swept | pops on say; the sweep runs CUDA (53359) → potentially (54386); holds into dead. | real | the article, verified verbatim (`research/6456d0ae.txt`) | arrow whoosh on the sweep 53359, 0.70, the loudest of the reel | 2207 | PROOF |
| V19 | dead. 55046 | 14 again | `moat` again (`callback: moat`): the moat from V14 draining: the water ring empties, the three rivals walk across | drains on dead. (55046), a 600 ms hold | drawn (callback, the object changed) | - | - | 604 | HUMOR |
| V20 | production 55650 | 18 | `dates`: a timeline on ONE black card with the REAL dates: `Nov 2025 tape-out` · `May 2026 first silicon` · `Jun 24 2026 announced` · `end 2026 first deployment` · `2027 ramp` · `H1 2028 full tilt`, a marker sliding | the marker slides from `Jun 2026` to `end 2026` on 2026. (57242); the later stops stay grey | drawn with real dates | OpenAI slide 3; CNBC (Hock Tan: prototype late 2026, ramp '27, full tilt H1 '28) | - | 2483 | PROOF |
| V21 | version 60017 | 19 | `gens`: OUR drawing of OpenAI's roadmap on ONE black card: three chip outlines stepping up left to right, `GEN 1  Jalapeño` lit, `GEN 2  approaching tape-out`, `GEN 3  planned` (the slide's own words), source `OpenAI, Hot Chips 2026` | Gen 1 stands at in on version; Gen 2 POPS on 2 (60197); Gen 3 pops on 3. (60857) | drawn with the slide's real labels (the slide crop itself looked like a slide: rejected 2026-09-05) | `research/img/sth-slide-34.jpg` | technology-select on 2 (60197, 0.50) and 3. (60857, 0.45) | 1612 | PROOF |
| V22 | design 62409 | 20 | `flywheel`, frameless: three nodes on a ring, `designs the chip` / `writes its software` / `runs on it`, the real OpenAI mark (white form) in the middle, one accent packet running the ring | nodes light on design (62409), wrote (63300), run (65350); the packet completes a lap by year. (66310) | drawn, real mark | - | technology-select per node 62409 / 63300 / 65350, 0.50 / 0.45 / 0.45 | 4291, `long: "one sentence, three nodes lit on their own words"` | TEACHING |
| bare | And each loop 66700 → faster. 68277 | 20 | the thesis, spoken to the lens | | | | | | |
| V23 | Comment 68933 | 21 | the CTA line above their head, `comment "KERNEL"` → `follow for more` (their exact words, so no bookmark icon and no click) | swap on follow (71044) | cta | | pop-up on the swap 71044, 0.60 | 3300 | CTA |

23 events over 72.2 s (one per 3.1 s; Creator Format 1 runs 3.7-5.5, their ask is coverage). 7 real captures (TechCrunch, SemiAnalysis x2, the Nvidia post, the Gluon dir + file) + 1 real photo (the chip), 3 charts drawn from real numbers (2 matplotlib-idiom on white, 1 Creator Format 1 black), 11 drawn objects, the CTA. Nothing bare longer than 2.6 s. Nothing at all before 2.2 s.

## Bare on purpose

0-2.23 the hook stack alone (their rule: no visual in the first 2 s); 4.75-6.25 "On the 24th of June, OpenAI" (the date is the caption's job); 16.0-17.9 "independent semiconductor research shop" (credential); 20.9-21.9 "compared to Nvidia Blackwell" (the villain named); 29.7-31.2 "But a chip is nothing without the" (the turn); 34.6-36.7 "For more than 20 years the standard was" (setup for CUDA); 51.1-52.8 "day. Which made SemiAnalysis" (their unverified line stays their); 58.1-60.0 "But OpenAI is already planning for a"; 66.7-68.9 "each loop makes the next one faster" (thesis); 68.9-72.2 the CTA line only.

The punch (9 MONTHS. 4060) is NOT bare in this plan: V1's short bar IS the punch, landing with the word and the riser. Say the word and it cuts on 4060 like reference edit A's WRONG.

## The SFX, the whole mix list (stage 4 mixes exactly these; spine ms; files in `motion-lab/public/audio/sfx/`)

| # | moment | spine ms | file | back-time | vol |
|---|---|---|---|---|---|
| 1 | **the riser** the creator asked for: starts as the first hook sentence ends ("engineers." tail, clip 0 cuts at 2867), climaxes ON `MONTHS.` | start 2710, peak 4060 | `popular-riser-metallic-sound-effect-trimmed.mp3` (2.225 s, peak at 1.32 s, silent after 1.34 s) | 1350 | 0.50 |
| 2 | TechCrunch headline sweep | 6726 | `mixkit-arrow-whoosh-1491.wav` | 270 | 0.60 |
| 3 | `train` strikes | 9372 | `mixkit-modern-technology-select-3124.wav` | 70 | 0.45 |
| 4 | their avatar lands | 12082 | technology-select | 70 | 0.50 |
| 5 | SemiAnalysis byline sweep | 14267 | arrow whoosh | 270 | 0.60 |
| 6 | `1.9x` lands | 23770 | `mixkit-message-pop-alert-2354.mp3` | - | 0.40 |
| 7 | `3.6x` lands | 25593 | message-pop | - | 0.40 |
| 8 | first kernel line slides in | 32289 | technology-select | 70 | 0.45 |
| 9 | "20 Years of CUDA" title sweep | 37233 | arrow whoosh | 270 | 0.60 |
| 10 | `6,000,000` lands | 40196 | message-pop | - | 0.40 |
| 11 | `88.9%` lands | 45622 | message-pop | - | 0.35 |
| 12 | riser into GLUON | start 45127, peak 46477 | the riser | 1350 | 0.34 |
| 13 | the moat sentence sweep, the loudest | 53359 | arrow whoosh | 270 | 0.70 |
| 14 | Gen 2, Gen 3 | 60197, 60857 | technology-select x2 | 70 | 0.50, 0.45 |
| 15 | flywheel nodes | 62409, 63300, 65350 | technology-select x3 | 70 | 0.50, 0.45, 0.45 |
| 16 | CTA swap to `follow for more` | 71044 | `mixkit-dry-pop-up-notification-alert-2356.wav` | - | 0.60 |

19 hits in 72 s (reference edit A had 15 in 60 s); the mouse click went with the bookmark. Nothing on a card pop, a scroll or a takeover. Presence check after the mix: 10 ms-bin diff peaks against the voice peak, printed as a table (`05-sound.md`).

## Charts, drawn in the matplotlib idiom in SVG (the numbers, so nobody re-derives them; `cards/Chart.tsx` is the idiom)

- **V8 tokens per kW**: three pairs, `Jalapeño / Nvidia`: GPT-OSS 120B 85,448 / 44,960 (GB200, 1,200 W); DeepSeek R1 19,641 / 11,781 (GB300, 1,400 W); Kimi K2.5 18,195 / 11,862 (GB300). Unit `mixed tokens/s per kW`. Because the three models sit on different scales, draw three small panels sharing one style, each with its own y axis, the ratio `1.9x / 1.7x / 1.5x` over each pair. Source line: `OpenAI at Hot Chips, Aug 25 2026 · SemiAnalysis InferenceX · package-TDP normalised`.
- **V10 on par**: points read off SemiAnalysis's figure (x tok/s/user, y M tokens per $): Rubin (50, 4.43) (65, 4.33) (90, 3.93) (112, 3.50) (135, 3.05) (152, 2.65) (170, 2.13) (185, 1.67) (200, 1.00) (215, 0.73) (233, 0.55) (265, 0.40) (320, 0.28) (400, 0.18); Jalapeño (65, 3.53) (100, 3.17) (140, 2.62) (185, 2.00) (208, 1.32) (233, 0.82) (268, 0.50) (400, 0.19) (700, 0.16).
- **V15 the AI-optimised kernel**: x hours `0, 4, 8, 24, 40` (read off the slide's axis, approximate; label the axis `hours, approx.`), y `% of roofline` `0.31, 31.69, 59.24, 77.14, 88.94`, annotations in that order: `functional only`, `FP8 attention matmuls`, `attention rescaling, tiled lookahead`, `value-matmul scheduling`, `key-tile prefetch`. Source: `OpenAI, Hot Chips 2026, "AI turns functional kernels into high-performance implementations"`.

## Real artifacts to fetch at build (every one live-checked 2026-09-05)

- TechCrunch June 24 article (V2), `shoot_url.mjs --vw 600`; its hero photo is the wafer photo. (OpenAI's own page answers 403 to a scripted fetch; TechCrunch is the fallback, and the better frame.)
- The STH Jalapeño board photo (V3): `research/img/sth-chip-final.jpg`, 1,600 px wide, naked on the light card.
- SemiAnalysis header (V6) and the moat sentence (V18), 600 CSS px, sweep on the sentence only (shot 2026-09-05: `assets/semianalysis.png`, `assets/semianalysis-moat.png`).
- Nvidia forum post (V12), Discourse page at 600 CSS px.
- triton-lang/triton gluon directory (V16) and one gluon source file (V17); the code text for V11 from `python/tutorials/gluon/`.
- marks: the Nvidia eye from Nvidia's own logo SVG (logo.dev serves the wordmark on a green tile, which is neither a mark nor frameless), rendered green on transparent (`assets/nvidia-mark.png`); OpenAI's white form from logo.dev (`assets/openai-mark.png`). Frameless, nothing behind either.
- their avatar (V5): `brand-briefs/genspark/avatar.png` (their headshot, 150 px; ig.db holds no profile URL).

## Judgment calls for them

- **The riser placement** (kept, the creator said "let's do it fully"). Read as: it starts when the first sentence ends and rises across "OpenAI did it in" to hit on `9 MONTHS.` (the way it hit WRONG on reference edit A). If you meant the hit ON "engineers." instead, it is one number: start 883, peak 2233.
- **The punch is not bare** (kept). V1's short bar lands with `9 MONTHS.` and holds to 4746; V1 now starts on `engineers.` 2233, not before, per their 2-second rule. Creator Format 1 leaves the punch word alone; here the picture is the joke. Say the word and V1 cuts on 4060.
- **"thousands of engineers"**: the counter shows `31,000 engineers` (Nvidia's R&D headcount FY2026). True and bigger than your line. If you prefer the 2006 number (2,737 employees, the whole company), say so.
- **"more than 4 million developers"**: V13 rolls to `6,000,000` (Nvidia's own March 2026 figure) with the source. Your line stays "more than 4 million", which the number on screen supports.
- **"no sane human wants to write it all day"** is nowhere in print. It stays your line; V17 shows the real file and no card attributes it.
- **"production will start the end of 2026"**: OpenAI / Broadcom say initial deployment end of 2026; Hock Tan says prototype late 2026, ramp 2027, full tilt H1 2028. V20 shows all of it so the card is never more optimistic than the source.
- **The hook stack swallows "and thousands"**: the current `captions.json` holds the first stack to 2013, so only "of engineers." shows as words. At the hook gate: clear the stack on "and" (1213 + tail) so the whole phrase reads, or put "THOUSANDS OF ENGINEERS" as a fourth stack line. Your call at the gate.
- **The lint's "no kind twice"** (done 2026-09-05): `shot` is exempt like `float` (seven different real artifacts are not one visual), and an event carrying `callback: "<id>"` is the blessed callback (V19). In `lint_visuals.py`.

## Considered, not used

- "Doom on a Jalapeño" (SemiAnalysis's own drawing + a 36 FPS screenshot; OpenAI ported Doom "with just Codex prompts"). The best joke in the source, but the reel's one HUMOR beat is their own face in the skeptic bubbles, and Doom is not a claim in their narration.
- A Nvidia headcount line chart (2,737 → 42,000, twenty points from the 10-Ks) as the first object. A matplotlib figure in the first second is not a stop-scroll object; the figure lives in V1's counter instead.
- The Hot Chips timeline slide as V20. It ends at Jul'26 and does not carry "end of 2026", so the drawn timeline with the real dates is the honest card.
- OpenAI's package floorplan (slide 32) as the die in V4/V11. The drawn die keeps the mechanism legible at band size; the real silicon is V3.


## v4, their round 1 (2026-09-05, built to their notes, stills shown before any render)

Their words -> what changed:

- "let's use Kode Mono from now on" -> `formats/creator-format-1.json` + this project's `format.json` + `captions.json.style`: `'Kode Mono', monospace`, weight 700, words and accents alike. Not in this `@remotion/google-fonts` build, so the two OFL TTFs are vendored in `remotion/public/fonts/` and registered in `CaptionReel.tsx`. Picked off `research/font-board.html` (35 faces on the real frames).
- "inside 'it took nvidia' should be one sentence ... same for 'did it in'" -> `spread: false` on those two stack lines (captions.json, hook.json, caption-plan.json). Centred, normal word gaps.
- "for OpenAI we can do better, nvidia is perfect" -> V1 row 2: the same empty span and stub, then a bracket magnifies the stub into nine month cells, FEB 25 -> NOV 25 (RTL start to tape-out, Hot Chips slide 3), lit one per beat under DID / IT / IN, the ninth with `9 months` on the word. Row 1 untouched.
- "the 24th of June and the jalapeno first visual ... half of it we don't see" -> V2 is a clipping of the real TechCrunch capture (`assets/techcrunch-clip.png`: the wafer band + the AI tag, headline and byline, 1200x744, real pixels, nothing redrawn) that fits the card whole with no scroll; it now starts on `24th` 4746 with the sweep on the dated byline, and the headline sweep on `announced` 6246. Holds to 7512 as before.
- "the most trusted independent ... a ladder with top 1 top 2 and 3" -> V6 (SemiAnalysis header) ends on `most` 15401; V6b `ladder` 15401->17900: a podium on the black card, rank 1 SemiAnalysis 315,000, rank 2 Fabricated Knowledge 94,000, rank 3 The Chip Letter 29,000, Substack about-page subscriber counts read 2026-09-05 (the measurable thing the order is by). Rank 1 alone in the accent. Blocks rise on `most` / `trusted`, counts roll to `independent`.
- "4 millions + that's it" -> V13 rolls to `4,000,000+`, source line `Nvidia`. (The forum capture in V12 still contains "6 million developers" in 12 px body text; the sweep is on the title.)
- "the moat ... we don't understand the animations, let's make it clearer, we use it twice" -> V14/V19 redrawn: the keep is named CUDA on its face, the water carries the word MOAT in both channels, the far bank holds the real OpenAI mark (not three anonymous chips), strokes 0.010 W. Fill: water rises on `moats.`, MOAT written at 42.27, the mark shoves on `now`. Drain (V19 now 54850->55900, V20 starts 55900): full and recognisable for 200 ms, water and MOAT gone in 350 ms on `dead.`, then the OpenAI mark walks down the dry channel and up onto the island beside the keep, landing at 55796 with a pop.
- "my eyes are going down at the end ... and at the 10 seconds" -> measured frame by frame (`~/Downloads/talking-head-edit-c-chip-gaze-*-frames.png`): end, eyes up to 71.900, down 71.933-72.200 (the word `more.` ends 72.064); 10 s, eyes up to 10.133, down 10.167-10.333, cut at 10.367 into a blink. No frame to cut to (gaze-nudges.json already says so for clips 6/24/26). Proposed, NOT applied: freeze the last eyes-up frame over those frames (9 at the end, 6 at 10 s). A/B: `~/Downloads/talking-head-edit-c-chip-gaze-AB-v1.mp4`. Their call; it touches the cut.

Not rendered yet. Stills of every change in `~/Downloads/talking-head-edit-c-chip-v2-0*.jpg`.

## v5, their round 2 on the v4 stills (2026-09-05, "amend what I said above, then render")

- "for openai it looks weird, we're not giving the number of engineers for openai" -> V1 row 2 now mirrors row 1's grammar instead of the bracket strip: the empty span, a row of forty dots (one per engineer) and the counter rolling to `40 engineers` on OPENAI (Reuters, Feb 10 2025: a 40-person in-house chip team led by Richard Ho; Ho at Hot Chips: they chose "a really small team"), then the stub and `9 months` on the word. A field over a handful, a bar over a stub.
- "'it took nvidia' make it one line one row" -> the first stack is `IT TOOK NVIDIA` (size m) over `20 YEARS`; captions.json, hook.json, caption-plan.json.
- "techcrunch should be scrolling ofc after" -> the clipping grew by the first two body lines (real pixels, cut above the video popup at 2089): whole on `24th`, held, then a 303 px glide from `announced` 6246 to 7512 (`scroll.fromMs`, new on the shot schema: hold at `from` until then). The whoosh moved 7000 -> 6246 with the headline sweep.
- "the ladder looks not refined, logo and the names, no need for numbers" -> the podium carries each outlet's real mark (SemiAnalysis's octagon from its Substack, Fabricated Knowledge's orbit lifted off its dark tile, The Chip Letter's 4004 photo lifted off white; `assets/*-mark.png`) and the name, rank 1's name in the accent; the counts and the source line are gone from the card and stay here: SemiAnalysis 315,000 / Fabricated Knowledge 94,000 / The Chip Letter 29,000 Substack subscribers, 2026-09-05.
- "you did a good job here" (4,000,000+), "all the rest is perfect": moat, Kode Mono, the gaze A/B untouched (freeze not applied).

Rendered as v2 with the sound stage (19 hits, -13.2 LUFS).

## v6, their round 3 on the v2 render (2026-09-05)

- "full breakdown and follow for me, the second is perfect" + "10s B last eyes up frame is perfect" -> both gaze freezes applied to `master.mp4` by `scripts/gaze_freeze.py` from `gaze-freeze.json` (end: frames 2158-2166 hold 2157; 10 s: frames 305-310 hold 304). Video only, audio untouched, so every layer keeps its times. Pre-freeze master kept as `master-pre-gaze.mp4`.
- "let's actually change the font again.. use Sora instead" -> `formats/creator-format-1.json`, `format.json`, `captions.json.style`: `Sora, sans-serif` 700, loaded from `@remotion/google-fonts/Sora` (latin, 700). Kode Mono's vendored files and registration stay available, unused.

Rendered as v3.

## v7, their round 4 on the v3 render (2026-09-06)

- "make the animation last longer for 'compared to nvidia blackwell'" -> V7 bench holds 17900 -> 21900 (was 20900), through "compared to Nvidia Blackwell." into V8 at 21900; `long` with their words. 3 s stays the default in the lint; `long` is the judgment, now written into 04-visuals.md law 5.
- "all the overlays slightly, very slightly higher, it's almost on my eyes and face" -> band 0.105-0.404 H -> 0.085-0.384 H (0.02 H up; card bottom 0.01 H above the hair line). format.json, captions.json style, geometry.json suggestion. Every card and float follows; the CTA line and captions do not move.
- their check "is it to run only AI models and not train?": yes. OpenAI's own page: "LLM-optimized inference chip"; TechCrunch: "first custom-built inference processor"; the-decoder: inference only. V4 (TRAIN struck, RUN lit) and V9 stand.

Rendered as v4.

## v8, their round 5 (2026-09-06, mid-render)

- "'and each loop makes the next one faster', we should keep the visual we have and make it faster, maybe it should start slow, and the animation should then increase and increase and increase" -> V22 flywheel holds 62409 -> 68933 (hands over to the CTA exactly), same object; from `accel` 66700 ("each") every lap is 0.62 of the one before, floored at 110 ms, with a trail that grows with the speed and the station flashes coming faster with it. Lint rule 8 now lets a `long` event that ends at the CTA start stand in the last 5 s.

Preview: `~/Downloads/talking-head-edit-c-chip-flywheel-preview.mp4` (64.5 -> 69.1 s). Rendered as v4 with the v7 changes.
approved: 2026-09-05 the creator, "let's do it fully" + "use opus 5 agents ... let's have both ... CREATIVE, AND ULTRA ON SYNCH WITH MY WORD" (v3: nothing in the first 2 s, the slide/chart screenshots redrawn by us, five Opus 5 builders)
