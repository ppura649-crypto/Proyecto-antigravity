---
name: full-visual-script
description: "Write or rewrite the script (the spoken transcript) of a full-visual explainer reel in this format: pick the angle and the side, write 5 hooks and pick one against the Chrome bar, build the beats, write smooth spoken sentences, explain the mechanism simply, keep every fact verified, close on comment \"KEYWORD\", land under ~60 s (190-210 words). Use whenever the user wants a script, a transcript, a hook or a rewrite for a full-visual reel, hands over the creator's own transcript to rewrite 'the way the reference creator does it', says the script sounds clipped, written or too long, or wants a topic from workspace/library/full-visual/ideas/ turned into words. NOT the build (voice, caption.txt, scenes, render: the full-visual skill), NOT topic scouting (the research skill), NOT talking-head scripts to read to camera (script), NOT the on-screen hook of a 3-zone reel (reel-hook), NOT the post caption alone (instagram-caption)."
---

# Full-visual script

The script is the reel. The same format made 10,779 likes and 134 likes on the same template; the topic and the first
sentence decided it. Our voice (a side, spoken glue, one analogy)
on the reference creator's skeleton (your thing first, a number every few sentences, a repeated unit, one turn, a CTA that says what
arrives), in words that survive a lawyer.

**The bar** is the creator's "best best one", `engine/full-visual/reels/chrome-fingerprinting-us/script.txt`: "Google Chrome is just
another spyware, let me tell you exactly why:" and "the transcript is perfect". Every draft is read against it.

When the prompt names a project in `workspace/projects/`, read `.agents/skills/full-visual/references/05-workspace.md`
first and follow it.

## Inputs and outputs

- In: a verified topic and its fact file (`facts.md`: one line per claim, a verbatim quote and its URL, checked today).
  No fact file, build it first; no claim enters the script without a line in it.
- Out, while the creator decides: `workspace/library/full-visual/ideas/<slug>/script-vN.md` with the 5 hooks (pick marked), the script,
  word count, estimated seconds (words / 3.4) and the facts used. Once approved: `engine/full-visual/reels/<slug>/script.txt`,
  plain text, one paragraph per beat, then the full-visual skill takes over (voice, caption, scenes). Show the whole
  draft in chat too; the creator approves words before any voice is generated.

## 1. Angle and side

Write these four lines before any sentence:
1. **The viewer:** an indie dev or builder who uses AI tools (Claude Code, ChatGPT, Chrome, their phone). Name what they
   already uses or believes that this topic touches.
2. **The pull:** fear of a hidden cost on something they already did, desire for a free upgrade, or the shock of a true
   story. One, not three.
3. **The side:** one sentence a viewer could disagree with ("Chrome doesn't protect you and Firefox does", "AI is not
   drinking our water"). The creator's stance is pro-AI: debunk wrong fears with real numbers, never repeat the scary line as
   true. Debated questions (consciousness, jobs) are framed as known against debated, never asserted.
4. **The proof:** 3-5 facts from `facts.md` that prove the side, each with a number or a named real thing.

If the side is not proved by the proof list, change the side, not the facts.

## 2. Five hooks, one pick

Write one hook per formula (bank with every real hook dissected: `references/patterns.md`):
- **Verdict:** "[thing you use] is just [label], let me tell you exactly why:"
- **Myth-bust:** "If you think [common belief], you're wrong, and I'm gonna prove it to you."
- **Threat to your thing:** "Your [thing] can [bad event] [number] before [what you think protects you]"
- **Discovery:** "[Named company or someone] just [built / open-sourced / proved] [specific thing], and [hard number]."
- **Prohibition + count:** "Don't [what you are doing] unless you've [done these N things]."

Score each 0-2 on five tests (10 max) and pick the highest; ties go to the one with a number:
1. A real thing the viewer knows in the first four words.
2. A side someone could argue with, not a neutral fact.
3. Concrete: a number, a named company or a named object.
4. A promise of proof or payoff ("let me tell you exactly why", "I'll give you at the end").
5. The claim is complete inside ~4.5 s (about 16 words), with nothing before it.

Kill on sight: a question with no number and no names, a hedged superlative ("might be the coolest"), a conditional
that makes the viewer qualify themselves ("If you vibe-coded an app and..."), "watch this", "stop scrolling", any
greeting or title. The body must prove the hook literally; if only the last third does, rewrite the hook.

## 3. Beats (about 200 words)

Length: 190-210 words, under ~60 s at our voice's ~3.4 words a second. Over 215, cut a proof unit before trimming
sentences into fragments. Count with `wc -w` and state the count and the estimate (words / 3.4) in the draft.

| Beat | Words | Job |
|---|---|---|
| Hook | 12-20 | the side + the promise; open loop here only (withheld fix, a count, a withheld name) |
| Bridge | 20-30 | "Ok so here's what just happened:" the news or the belief in one sentence, with who and a number |
| Mechanism | 25-40 | how it works, one analogy, then its name ("And this is what's called...") |
| Proof units | 3 x 25-35 | the same unit repeated: your thing, what happens, the number, what it means for you; the last one escalates ("Even...", "And finally...") |
| Turn | 10-20 | one sentence that names the pattern or flips the frame ("The word is per."), with a fact in it, not a feeling |
| CTA | 10-15 | `So if you want [exact thing], just comment "KEYWORD", and I'll send it to you.` |

A story (an incident) replaces the units with steps: "Okay, step one: ...", each step one cause and its consequence.

## 4. Spoken sentences

- **One idea per sentence, with its reason inside it.** 12-20 words, average 13-17. The reason rides on "which",
  "so", "because", "like": "Ok, a lot of data centers cool their AI chips with water that evaporates with the heat,
  like sweat."
- **Each sentence starts where the last one ended.** Open with the glue the creator loves: "Ok so", "Basically,", "And this is
  what's called", "We're talking about", "This is actually", "But why...? Well,", "So", "That's", "Unfortunately,",
  "And here's the thing:". A reader should never have to guess why this sentence follows that one.
- **No fragments for rhythm.** "Electricity. Nuclear." is banned. At most two sentences of five words or fewer, and
  each one turns the argument ("Yours didn't.", "Then they swap roles.").
- **No stacked conditions.** "once you pass X or Y in a state, you collect for them or pay it later, with penalties per
  state" is three ideas; split or cut.
- **Talk to them.** "You" or "your" in at least one sentence in three; the viewer's thing is the subject.
- **Say it like a person:** contractions, active verbs, a real thing as the subject. Numbers in digits in `script.txt`
  (the voice file spells them, full-visual skill).
- **No filler:** a sentence that restates the last one goes. No hype lead-ins ("Here's the clever part", "Let that sink
  in"), no "insanely", no feelings in place of facts ("I'm so happy to discover...").

## 5. Explaining

- Show what happens first, name it after: "...it's used to recognize your device. And this is what's called
  fingerprinting."
- One daily-life analogy per mechanism, in the same sentence (sweat, a car radiator, notes in a shared locker).
- New method: "So instead of [old way], you get [new way]."
- A false belief dies on "until"; a false comfort gets its own sentence ("Budget alerts don't stop anything.").
- Every number gets something felt: a comparison ("the coffee in your cup took enough water for half a million
  prompts"), a per-unit ("per visitor"), or a scale line ("We're talking about tiny differences.").
- One number per sentence. No history, no definition longer than a clause, no "under the hood" tour.

## 6. Facts

- Every figure, name, date and quote is in `facts.md` with its verbatim source line, checked the same day. Never invent
  a capability, a benchmark, a repo or a number; if unsure, cut it and say so in chat.
- Round only in the honest direction ("about", "over" only when true) and keep the scope in words: "Google's own
  measurement", "up to", "can count as", "in California". Self-reported numbers say who reported them.
- The opinion is the hook's side; the facts are the proof and must be unassailable. Never call a real estimate
  "completely wrong": say what it counted.
- Fix an error in every instance: the reference creator corrected Munich to "a single visitor" and still said "per visitor" in the
  payoff. We do not.
- No em dashes (commas). Banned words: leverage, robust, streamline, delve, navigate the landscape. Default year 2026.

## Before and after (real material)

1. Clipped to spoken (data centres v3, the creator's correction):
   - Before: "Basically, AI chips get really hot. So a lot of data centres cool them with water that evaporates, like sweat."
   - After: "Ok, a lot of data centers cool their AI chips with water that evaporates with the heat, like sweat."
2. Written list to explanation (hf-incident draft 1 to the approved script):
   - Before: "Why? Many tasks in the test were impossible. 198 of them had never been solved by any model. So instead of
     giving up, the agents went looking for how the grader worked."
   - After: "But why hack Hugging Face? Well, the test had 198 tasks that no model had ever solved. So instead of
     solving them, the agents went looking for how the test was graded, and for its answers. And the test's own
     files were stored on Hugging Face."
3. Overclaim to precise (the reference creator, format 1 to format 2):
   - Before: "Your fonts load straight from Google's servers, which a court in Munich priced at €100 per visitor for
     leaking their IP."
   - After: "Your fonts load straight from Google's servers, and a court in Munich made a site pay €100 to a single
     visitor, just for leaking their IP address."
4. A side without a cheap shot (data centres v4):
   - Before: "A 2024 estimate said one AI email costs a whole bottle of water, which is completely wrong."
   - After: "That famous bottle of water per AI email came from a 2024 estimate, and it counted the water at the power
     plants too."

## Self-check before showing them

- [ ] Four angle lines written; the proof list proves the side.
- [ ] 5 hooks shown with scores; the pick scores 8+ and the body proves it literally.
- [ ] The viewer's thing or a named real thing is in the first four words; a number in the first two sentences.
- [ ] 190-210 words; count and estimated seconds stated.
- [ ] Average sentence 13-17 words; at most two of five words or fewer, each a turn; no fragment, no stacked conditions.
- [ ] Read aloud: every sentence follows from the last; no sentence restates another.
- [ ] "You/your" in one sentence in three; a number or named thing every two to three sentences.
- [ ] One analogy per mechanism; one turn with a fact in it before the CTA.
- [ ] Every claim has a `facts.md` line; scope words kept; every corrected fact fixed everywhere.
- [ ] Last sentence is `comment "KEYWORD"` with the exact thing sent, and that thing exists.
- [ ] No em dashes, no banned words, no hype lead-in, no "watch this", no talking-creator phrases.
