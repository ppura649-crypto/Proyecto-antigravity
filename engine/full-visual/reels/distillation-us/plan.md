# Visual plan, distillation (US Snap + FR Simon, one plan for both)

approved: (waiting)

Read the right-hand column alone: it should retell the script. Every event is tied to a spoken word ("lands on" = one
event on the word, "ends on" = a build that finishes on it). Times are the US take (FR runs up to 4 s later by the
end). Facts and sources: `facts.md`. Script: his transcript, light edits he approved.

## Once for the reel

- **The continuous thing: two real marks, Claude (the teacher) and Qwen (the student)**, with a stream of answers
  flowing from one to the other. They are born in the hook and never leave. Every scene either zooms into one of them or
  changes the stream between them. The film is: the stream, then inside the student, then what the stream cannot carry.
- **The second continuous thing: one example sentence** that the student learns to finish. It is born in `inside`,
  trained in `training`, and in `catch` it is the one where the teacher hesitates. One sentence the viewer follows
  through the whole explanation, instead of a new diagram per paragraph.
- **Real numbers, measured, not invented.** Before the build I run a real small Qwen model (Qwen3 0.6B, open weights)
  on the example sentence and draw its real tokens, its real token ids, its real top-5 next-token probabilities. The
  "teacher hesitating" pair is a real near-tie from that run. Nothing is labelled with a number that was not measured.
- **Pinned chrome: none.**
- **Grounds:** light for documents and the story (the report, distillation, training, limits, the ask); dark for
  inside a model (weights, the forward pass, the hidden states, Claude's thinking).
- **The one big move:** on "hidden" (in `catch`), the whole inside of Claude, every row of numbers the viewer has
  just learned to read, frosts over behind glass and only one token comes out of it. Nothing else is that loud.
- Real marks only (Anthropic, Claude, Alibaba, Qwen), bare, no tile, no border. Interfaces redrawn at their real
  geometry: the Anthropic report page, Claude's chat with its thinking block, the Instagram profile header.
- His UI rules from the Planetary and Chrome reels: big centred mark first then it moves aside, no dashed lines, no
  terminal, uncluttered, Apple-like scroll, full colour, a lot of motion in the first 10 s.

## Scene by scene

### 1. `hook`, dark, 0.1 to 3.7 s
"How do Chinese AI companies copy Anthropic models?"

| Word | What changes |
|---|---|
| first frame | the Claude mark, big and centred, mid-entrance |
| Chinese | lands on: Claude slides left; the Qwen mark drops in on the right, same size |
| copy | lands on: a stream of Claude answer cards (real reply shapes, lines of grey text) pours from Claude into Qwen, and Qwen's mark pulses as each one hits |
| models? | the stream keeps flowing, faster, both marks holding |

### 2. `report`, light, 3.8 to 15.2 s
"Anthropic just released a full report explaining how. It says Alibaba collected over 151 million exchanges with Claude in three months to train their Qwen models. And I wanted to understand how that works."

| Word | What changes |
|---|---|
| report | lands on: the two marks shrink to a strip at the top (they stay all reel); the real report page arrives: Anthropic header, "Countering misuse of AI: September 2026" |
| how. | the page scrolls (Apple-like) to the section title "GTG 16005: Chain-of-thought distillation and AI R&D campaign by Alibaba (Qwen / Tongyi Lab)" |
| Alibaba | lands on: the real Alibaba mark docks on the section's right edge |
| 151 | lands on: the report's own line highlights, "over 151 million exchanges observed", and a counter under it rolls to 151,000,000 |
| three months | a May, June, July strip fills left to right under the counter, ending on "months" |
| Qwen | lands on: the strip's stream turns into the marks strip on top: answers flowing Claude to Qwen, now tagged Qwen 3.5, 3.6, 3.7 (the report's own versions) |
| understand | the page slides away; the two marks come back to centre |

### 3. `distill`, light, 15.3 to 24.1 s (REDONE after his note: no Claude/Qwen pair here)
"The technique is called distillation. You take a stronger model, called the teacher, collect its answers, check their quality, and use them to train your own model, called the student."

A new real-looking app interface: a clean "Distillation" pipeline tool (macOS window, sidebar-free, three steps in a
stepper: Collect, Filter, Train). The pair of marks does not appear as the main picture.

| Word | What changes |
|---|---|
| distillation. | lands on: the word builds big, then docks as the window's title; the window unfolds under it with its three-step stepper |
| teacher, | lands on: step 1 active: a model picker dropdown opens, the list scrolls, "Claude Opus 4.7" (named in the report) is selected, a `teacher` badge stamps on it |
| answers, | lands on: a dataset table fills fast, rows of prompt / answer (short generic prompts, Claude's answers), a row counter racing up |
| quality, | lands on: step 2: a quality column fills, each row gets a check or a cross, crossed rows strike through and collapse out, the table tightens |
| train | step 3: a training job card: base model picker "Qwen", a loss curve drawing down (the REAL loss from the measured run, 3.78 -> 0.19) |
| student. | lands on: the job's model gets a `student` badge; the Qwen mark lifts out of the card big and centred: HANDOFF.student |

### 4. `weights`, dark, 24.2 to 28.4 s
"Training changes the model's weights: the billions of numbers the model calculates with."

| Word | What changes |
|---|---|
| Training | the camera dives into the Qwen mark: it fills the frame and opens |
| weights: | lands on: inside, a wall of real numbers (a real slice of Qwen3 0.6B's weights, 4 decimals), rows scrolling |
| billions | lands on: the wall zooms out until it is a texture, a counter beside it rolls to the model's real parameter count (0.6B for the small one; the line says "billions", the counter stays honest to the model shown) |

### 5. `inside`, dark, 28.5 to 49.7 s
"First, the model cuts your text into tokens ... It picks one, adds it to the sentence, and repeats."

| Word | What changes |
|---|---|
| text | the example sentence types in at the top (chosen before build from the measured run) |
| tokens, | lands on: the sentence splits into its real token chips, each chip its own colour |
| list | lands on: each chip unrolls downward into a column of numbers (its real embedding, first 6 values shown) |
| layer | lands on: the columns pass through a stack of layers, stacked panels the columns travel through, one pulse per layer |
| multiplies | lands on: one panel opens: a column times a small weight grid, the result column filling in |
| back | lands on: from the last chip, thin curved lines reach back to the earlier chips, thickest to the one that matters most (from the measured attention) |
| context. | the lines settle |
| probability | lands on: a bar list of the real top 5 next tokens grows out of the last column, percentages counting up |
| picks | lands on: the top bar lights, its token flies up and joins the sentence |
| repeats. | ends on: two more tokens are generated the same way, faster each time |

### 6. `training`, light, 49.8 to 64.6 s
"During training, the teacher's answer tells the student which token should come next ... without ever contacting it."

| Word | What changes |
|---|---|
| teacher's | lands on: the frame pulls back to the two marks; a Claude answer card arrives with the example sentence's next word highlighted |
| next. | lands on: that word slides under the student's bar list, marking the right bar |
| low | lands on: the right bar is short (a real low probability from the untrained guess); it turns amber |
| calculates | lands on: a thin line runs from the bar back up through the layers |
| mistake. | lands on: a patch of the weight wall changes values, digits rolling; the right bar grows |
| millions | lands on: the loop repeats, faster and faster, a counter rolling, the bar ends tall |
| teacher, | lands on: the student's answer card and the teacher's card sit side by side, the same text |
| contacting | lands on: the stream between Claude and Qwen cuts; Qwen answers on its own |

### 7. `catch`, dark, 64.7 to 82.7 s (REDONE after his note: no blur as the main picture, the mechanism in depth)
"But here's the catch. All the numbers in between, called hidden states, stay inside Claude. And Claude only shows the token it picked, not its full probabilities. Those would tell the student that the teacher was hesitating between two words, not just which one it chose. So the student only learns from the final text, not from how the teacher got there."

A cutaway of the machine, all REAL numbers measured on the open model (Qwen3 0.6B, labelled "measured on an open
model"): the 28 layers as a 3D stack of plates in perspective, the hidden state between every pair of plates, the
model's guess at every depth (logit lens), the full 151,936-token distribution. Then Claude's casing closes over the
same machine: only one port, only one token.

| Word | What changes |
|---|---|
| catch. | the sentence's last token drops into the top of a tilted 3D stack of 28 plates; the camera starts travelling down it |
| between, | lands on: between the plates, a strip of glowing cells lights up at every level (hidden_last_token_first12, real): the values visibly grow and change colour from layer to layer (-0.025 at the top, 13.5 and -10.9 at the bottom) |
| hidden | lands on: one strip zooms to full width: 12 real numbers + "… 1,024 numbers", labelled `hidden states` big |
| Claude. | lands on: Claude's casing (its orange, its mark) slides up around the stack: walls, a lid, one output port labelled `API` |
| picked, | lands on: a single chip `teach` shoots out of the port onto a response card, alone |
| probabilities. | lands on: inside, over the port, the full distribution: 151,936 thin bars (top 40 real heights + the long tail) sweeping in; a lock snaps shut over them |
| hesitating | lands on: the logit lens as a race: the two leading guesses at depth 25-26 go neck and neck, real: layer 25 practice 56 % vs learn 42 %, layer 26 learn 37 % vs practice 33 %; label "two words, neck and neck" |
| chose. | lands on: the race ends, one word goes out, the other stays locked inside |
| final | lands on: the student (small Qwen) receives only the text line |
| got | ends on "there.": the real path of guesses through the depth lights up as a trail inside the casing: avoid -> have -> find -> either -> hard -> themselves -> practice -> learn -> practice; it stays inside, the student has only the end |

### 8. `thinking`, dark, 82.8 to 92.7 s
"That's why Alibaba went after Claude's thinking ... And Anthropic now only shows a summary of it."

| Word | What changes |
|---|---|
| thinking, | lands on: a real Claude chat reply, with its thinking block above the answer |
| step-by-step | lands on: the thinking block opens: step lines appear one by one (a redrawn, generic reasoning, no invented Claude quote passed off as real) |
| closest | lands on: the open thinking block slides beside the frosted glass: the one window into it |
| summary | lands on: the thinking block collapses into a short summary line, the steps fold away |

### 9. `limits`, light, 92.8 to 107.8 s
"A smaller student also can't hold every skill ... problems it hasn't seen."

| Word | What changes |
|---|---|
| smaller | lands on: Qwen and Claude side by side again, Qwen visibly smaller |
| skill. | lands on: a row of skill chips flows from Claude into Qwen (the report's own list: agentic tasks, software engineering, kernel development, long-horizon tasks); the last one doesn't fit and drops |
| closely, | lands on: example cards the student trained on, each with a green check |
| struggle | lands on: a new card arrives, a problem not in the pile; the student's answer on it turns red |
| overfitting. | lands on: the word types under it |
| skills. | lands on: the skill chips that made it glow |
| test | lands on: one fresh card, unseen, sits in front of Qwen |
| hasn't | ends on "seen.": the student works it; the card waits, unanswered, the question left open |

### 10. `cta`, light, 107.9 to 110.7 s
"And if you want more breakdowns like this, follow me."

| Word | What changes |
|---|---|
| breakdowns | the marks slide down and fade; the Instagram profile header arrives: the creator, profile photo, follower count as on the profile |
| follow | lands on: a cursor taps Follow, it turns Following, the count ticks +1 |
| last frame | the header holding, Following visible |

## What I need from you

1. Approve this plan in words, or change it.
2. The first passage I would build alone: `inside` + `training` (28.5 to 64.6 s), the forward pass and the nudge. It
   is the core of the reel and the hardest to make readable.

## Build notes (after measuring, 2026-09-26)

- Example sentence (measured on Qwen3-0.6B-Base): "The best way to learn is to" -> practice 31.3 %, do 15.8 %,
  learn 13.9 %, teach 2.3 %, try 1.7 %. The teacher's answer is the saying: "... is to teach."
- `training`: the bars follow a REAL training run on this sentence (11 steps): teach 2.3 -> 5.3 -> 12.0 -> 23.9
  (now the top pick) -> 38.6 -> 51.6 -> ... -> 82.5 %. The weight nudge is real too: layer 0 values before and after
  one step, changing in the 7th-8th decimal. "millions" is the voice's; no invented counter.
- `weights`: the counter is Qwen3's largest open model, 235 billion parameters (Qwen3-235B-A22B), labelled.
- `catch` (redone): every number is the open model's, labelled as such; nothing is presented as Claude's own numbers.
