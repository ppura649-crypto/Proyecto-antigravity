---
name: create-my-own
description: Create a new Talking Head style from the videos a creator loves. They paste links, every video is studied frame by frame by many subagents (layout, captions, zooms, cuts, transitions, sound, pacing, and why each choice follows what is said), and the result is a new skill in this folder, used exactly like Classic and Split explainer, that keeps our visuals, motion and method and lays them out the way that format does. Use when someone wants their own format, says copy this format, or pastes several reels to replicate.
---

# Create my own

Links in, a new Talking Head style out. The style is a skill of its own, beside `talking-head` (Classic) and
`split-explainer`, and the person uses it the same way: raw take in, finished video out.

Split explainer is how this was done once and done well: another creator's talking-head format, studied
passage by passage, then built as a lean harness on our cut, our visuals and our motion. Do the same for any
format. Read `.agents/skills/split-explainer/` first: it is the worked example of the result, and its
`references/feedback.md` is the bar every new style inherits.

You are the editor and the motion designer here. This page gives direction, not steps to tick. Decide how
deep each format needs to go, how to split the work, what to measure and how. Judge by one question: would
someone who watches that creator every day say our video is their format?

## What is copied, what stays ours

Copied: the format. Where the person sits and how big, when the picture splits, when a visual takes the
whole screen, the captions in every detail, zooms and punch-ins, cuts and their rhythm, transitions, the
ground and colours, the hook's structure, sound and music, and above all the reasons: why this mode on this
sentence, why a zoom on this word and not the next.

Ours: the cut (the engine's tools, never rewritten), the visual philosophy (a real thing doing its verb, real
material, one hero at a time), the motion (`.agents/skills/talking-head/references/04m-motion.md` and split
explainer's `motion.md`), the planning, the builders and the checks. Their format with our visuals inside.
Never their footage, logos, licensed fonts or exact pictures: invent new ones in their grammar.

The format only. No talk of their views, comments, calls to action or growth.

## The work

1. **Gather.** 3 to 10 links of one format; five or more makes a format, three is thin, say so. Ask who it
   is and what they love about it, in one sentence. Keep everything in
   `workspace/library/talking-head-formats/<slug>/`. Download with
   `uvx yt-dlp -f "bv*+ba/b" --merge-output-format mp4 -o "<folder>/refs/%(id)s.%(ext)s" <link>` (uv comes
   with `node scripts/py.mjs --ensure`), and get every word with its time (`node scripts/transcribe.mjs`).
   A link that fails: say which and go on.
2. **Study.** `references/study.md`. Every moment of every video, many subagents in parallel, every claim
   on a measured frame, ending in `FORMAT.md`: the format's decisions with their reasons. This is what the
   person pays for. Go as deep as the format needs.
3. **Say it in words.** Show the person what you found, short and plain: the modes and when each is used,
   the captions, the camera, the rhythm, the sound, a few passages with their times, what stays ours. Their
   corrections win over any measurement.
4. **Build the style.** `references/new-style.md`: split explainer's skill copied, only the format rewritten.
   Lean. If it grows much longer than split explainer's, it is over-built.
5. **Prove it.** One of their own recordings, edited end to end with the new skill from a blank plan.
   Compare with the references at the same kinds of moments. Fix the skill, not just the video, and go again
   until it holds. Then show them and ask what feels off. Their notes go into the new skill's
   `references/feedback.md`, in their words.

## Boundaries

- `engine/`, `scripts/` and the shipped skills (`talking-head`, `split-explainer`, this one) are replaced by
  every update. The new style lives in its own skill folder and in `workspace/library/`; never edit the
  shipped ones and never reuse their names.
- Prefer an instruction over a new script: the agent that edits the video already knows how.
- Write reasons, not number rules. A reason lets the next video decide well; a number only fits the last one.
