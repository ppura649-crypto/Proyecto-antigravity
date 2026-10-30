---
name: research
description: "Internal. How a format decides what a reel is about: read the account and the buyer's chosen direction, propose concrete ideas when needed, give every thing a home and a moment a stranger recognises, verify each claim on the day it goes out, and let the next pick move with the numbers. Called by every format before a brief, and whenever the buyer asks what to post about or says find me a theme."
---

# Research

## Goal

The next reel is about something this account's own audience has already proved it stops for, every name and number on it is true on the day it is posted, and the choice moves on its own next time because the last one was watched.

## Reasoning

Picking is most of the value. The build is the same every run. What changes is what the reel is about, so a bad pick is the only way a format fails, and no amount of rendering saves it. A list of topics would fit any account, and any account is nobody. The buyer's own posts already say who follows them, what those people stopped for and by how much, so the pick starts there when the reading is available. While it runs, a buyer's explicit topic and audience can anchor this one brief; never present that as measured account knowledge.

One theme is a post; a lane is a run of posts. A lane is a vertical a practitioner would name as their own job, narrow enough that four answers are the answer rather than a sample. Three concrete ideas help when the buyer has no direction. A chosen idea, their own brief, or "Choose for me" already settles who makes that choice. Asking again adds no evidence. Depth inside a lane the account already owns beats a new lane picked to escape weak numbers, and weak numbers are worth reading twice before believing them.

A pick is not finished when the thing is named. Every thing has a home and a moment a stranger would recognise, and choosing those two is the same skill as choosing the thing. Get them wrong and the reel shows a search result or a landing page, which reads as the agent working rather than as proof. Which file holds that judgement belongs to the format, because what counts as a home differs between a repository, a paper and a video.

Claims are read back on the day, because a number is a factual claim in the buyer's voice and one caught lie costs more than the reel earned.

And the account moves. The next pick starts from what the last reel reached, not from where the last pick started, or the format ships the same reel forever while the numbers say otherwise.

## The pattern

1. **Read the available context first.** Use `context/profile.md`, `context/formats.md`, `context/voice.md` and `context/answers.json`. Reuse `audience.for` and `audience.need` across every format. If one is missing and this reel needs it, ask "Who are your videos for?" or "What do they need help with?", one at a time with relevant suggestions. Save the answer once in `context/answers.json` with buyer provenance and update `profile.md`. Keep today's selected idea in the project's `brief.md`. Never re-ask shared context when switching formats or claim measured audience proof from a buyer-supplied answer.
2. **Start from the last one when account readings exist.** `node scripts/reach.mjs` gives every shape of post on the account against the account's own middle, and what this folder has shipped since. Read a small group against its post count before believing it: two posts at 17x is a coincidence with a decimal point on it. On a first run it says nothing of ours has been measured yet, and the pattern carries on.
3. **Use the direction already given.** A selected idea or explicit brief goes straight to research. "Choose for me" authorizes your choice from saved context and ideas. Otherwise propose three concrete ideas, each with a useful result, a short reason from the available evidence and enough live candidates to support the format; ask once. Save unused suggestions in the format's idea bucket when it has one. A direction does not approve the finished list unless the buyer has also approved that exact content.
4. **Find the things inside the lane, one term at a time.** Search a thing by its own name alone, never the name plus a category word, so the real project and its abandoned copies both surface. Popularity is a filter, not the pick. Open the pages.
5. **Give each thing a home, a moment and a shape.** Its own home, never a page about it. The moment a stranger recognises, never the top of a page. Then the shape that records it. The format's own reference holds this judgement and is read before anything is captured.
6. **Verify on the day, not on the day you found it.** `references/verify.md` says what counts. Unverifiable means unused: say so instead of softening the sentence. The biggest thing in the lane that turns out to be dead is worth more than a fifth pick, so it goes in `avoid` and becomes the caption's best line. The format's check is the gate, and a check that could not run is a fail.
7. **Shape it to the format that asked, then write `brief.md`:** the chosen direction and why it fits this audience, each thing with its home, moment and proof, the sources a line each, and any actual prior results that changed this choice. Keep the idea's ID and provenance when it came from a saved bucket.

## Examples

An account of 52,400 whose audience runs open source models on their own machines. Reach says the shape that puts changing cards over a clip runs at 3.2 times the account's own middle across 48 posts, while the still panel shape runs at 0.6 across 96. So the three lanes are proposed inside the first, not away from it, and the picked lane's four things are found by name, each living in its own repository, each with a different moment: a benchmark table, a demo in the readme, a table of tools, an install block. The numbers are read again the morning it goes out.

A career coach whose audience wants to write better. The lane is not "best writing tools", it is the frameworks consultants actually learn. One of the four is an answer-first writing explainer on video, so the home is the video, the moment is the ninety seconds where the structure is drawn, and the shape is play.

A second run on the same account. The last reel reached under the middle and that lane's own candidates were thin, so the lane is closed in one line in `brief.md` and the next three are proposed from the two that reached.

## Counter-examples

A theme that could go to any account. One theme offered where three lanes were asked for. A lane called strong on two posts. A lane dropped for weak numbers that were a sponsorship artefact. Four things a search box returned. An aggregator, a list post or a landing page standing in for the thing. A moment chosen before the page was opened. A number taken from a search snippet, from a readme, or from memory. A number verified two days ago. A claim the buyer could not defend in a comment. A second run that starts exactly where the first started, as if nothing had been posted in between. Researching without available account context or an explicit buyer brief.
