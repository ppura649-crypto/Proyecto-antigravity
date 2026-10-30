---
name: full-visual-customization
description: Learn a creator's Full Visual preferences once (caption look, background, voice, words, research direction, references they want to copy), test them on a short proof render, save their choices and reasoning, and reuse them in every later reel. Use for the first setup of Full Visual, changing the saved look, voice or words, "make it mine", "use my voice", "copy this creator's style", or learning from feedback given during a reel. Keeps the Full Visual method, motion, visuals and checks unchanged.
---

# Full Visual customization

## Goal

Make Full Visual feel like this creator's own format. Learn, once, what the reels are for and
how they should look and sound (the caption, its colours and key-word marker, the background,
the voice, the words and the closing ask, the topics and stance), understand why, and carry
those choices into every later reel. The method is never part of this: what picture explains a
sentence, how it moves on the word, how scenes hand over, the eight rules and the checks are
the same for every creator. Customization changes the look and what the creator says.

## Reasoning

A colour is a setting; why someone chose it is what lets the next reel make the right call.
"A softer background" should not quietly turn the light scenes grey. "Blue key words" should
not repaint the interfaces drawn under the caption. "Like this creator" usually means one or
two properties (a calmer voice, a bigger caption), not a rebuild of the format.

Full Visual's strength is a real thing for every sentence, drawn at its own geometry and moved
on the word, with the voice as the only clock. That survives customization. The font, the ink
and grey of the caption, the marker, the ground colours, the grid, the voice and the closing
ask are creator choices. Keep the purpose; let the creator choose the expression. Do not reduce
the format's references to a palette or a checklist.

## Two locations, two jobs

In a Keyframes folder the **source** is `.agents/skills/full-visual/SKILL.md` (with
`full-visual-script`) and the engine in `engine/full-visual/`.
Commands run from `engine/full-visual/`; Python runs as `node ../../scripts/py.mjs scripts/<x>.py`.
Do not assume another repository.

The source skills, the engine, its scripts and its example reels are read-only for this
companion: an update of the format replaces them. Store what you learn in `workspace/library/`,
which belongs to the person and survives every update.

```text
workspace/library/
  full-visual/profile.json       chosen values, scope, evidence, setup progress, revision
  full-visual/overrides/         a copy of every engine file changed for their look, one line why
  full-visual.preferences.md     current understanding, goals, reasons and useful examples; the workspace shows this page
  full-visual.json               the workspace's own record that the look is chosen
```

Bind the profile to the creator, channel, format and source path. Do not let one person's
feedback change another person's profile. Name the profile being used at the beginning of a
run. If the binding is ambiguous, ask only which creator this is for.

With no profile, Full Visual keeps its house defaults. Creating this skill is not setup.

## What never changes

The picture and the motion: `src/engine/` for the stage, handovers, moves and timeline, the
eight rules in the full-visual skill, `scripts/check.py`, the stage order, and the bar in
`.agents/skills/full-visual/references/taste.md`. A preference never loosens a check. If a chosen
look cannot pass one, say exactly where they conflict and let the creator decide about the
look, never about the check.

A look the engine does not have (a new marker style, a caption animation it lacks, a font it
does not load) is built only if they insist after hearing what it costs: an engine file
changed, a copy kept in `workspace/library/full-visual/overrides/` with one line why, and the
change put back by hand after every format update. A request that would break one of the eight
rules (phrase captions instead of one word per spoken word, a cut, music under the voice, a
presenter) is not a look; say so plainly and record it as a declined request.

Captions are English only today (the aligner and speech model are English); say so if asked.

## Read what already exists before asking

Read the full-visual skill and its references, `taste.md`, `full-visual-script`, and the real
theme fields in `engine/full-visual/src/theme.ts`, `src/fonts.ts`, `src/engine/Caption.tsx`,
`Ground.tsx` and `Chrome.tsx`. Use [harness-map.md](references/harness-map.md) for every field,
its default and whether a change needs the engine.

Read the folder's shared context before asking anything it already holds: `context/profile.md`,
`context/answers.json` (`audience.for`, `audience.need`), `context/voice.md`, and the research
skill (`.agents/skills/research/SKILL.md`) with this format's lanes in
`.agents/skills/full-visual/references/04-research-lanes.md`. Never re-ask shared context.

Read an existing profile and its preferences page before everything else about taste. Preserve
direct edits to the page. If the page and the JSON differ, reconcile that one choice before
applying it; do not restore an older machine value over the user's words.

Instagram is read through Composio, set up by `/start`. If it is connected, read their own
recent posts for what they already make and what reached. If it is not, say "you can connect
it with /start" once and continue from their answers. Never ask for a key in chat. They add the
key on the video's page in their workspace (the Video step), or put it in `.env.local` at the
folder root.

Identify separately: the enduring objective, an explicit preference, a measured fact, a local
correction, and a tentative inference. Current explicit choices outrank old examples. The
example reels' look is the house default, not this creator's preference.

## First setup: one conversation, saved progressively

If `setup.status` is `complete`, reuse it. Do not reopen the interview for a new reel. If it is
`in_progress`, resume only unresolved items. A new skill version does not reset it.

Keep it high level. Ask what they need, what they want the viewer to get, and whether they
have a reference they would like to copy. Use [interview.md](references/interview.md) in small
groups: audience and references, caption, background, voice, words, research. Explain what a
choice changes and give concrete alternatives with the house default named. Let the user
answer freely, keep the default, or delegate. Record an explicit "choose for me" as delegation
with its scope. An optional item may be deferred. Silence never means a choice was accepted.

A reference reel (a link or a file): look at it, describe its caption, ground and voice in
words, map what is mappable to theme fields, and say plainly which parts would need an engine
change and which parts are the method (its pictures and motion), which stays ours.

Use [profile-template.json](assets/profile-template.json) as the starting structure. Each
settled choice goes under `decisions.<key>` (`caption`, `marker`, `background`, `voice`,
`words`, `research`) with its value, scope, goal, short rationale, `rationale_source`
(`user_explicit`, `editorial_interpretation` or `delegated`), a useful example and evidence;
the theme it resolves to goes in `resolved.theme`. Save progress after each answer. Do not ask
answered questions again.

## Let's test

After the look choices, render one short proof instead of describing it. From
`engine/full-visual/`:

1. Copy an example reel from `reels/` (one the full-visual skill names as a reference) to two
   scratch slugs, `reels/_look-default` untouched and `reels/_look-test`. Each registers
   itself: `reels/index.ts` finds every `reels/<slug>/scenes/index.tsx`.
2. Write their choices into `reels/_look-test/reel.json` under `"theme"` as a deep partial.
   Change nothing else: same words, voice, scenes and chrome.
3. Look first: `node render.mjs _look-test --stills 1.5,4.5,8` and the same times on
   `_look-default`. Read the stills at full size yourself: caption fit on two lines, contrast of
   ink, grey and marker on both grounds, the grid. A caption block that no longer fits on two
   lines fails the render; say so and propose a size that fits.
4. Create `workspace/output/<date>-full-visual-look-test/` first. Render about 9 s: `node render.mjs _look-test --from 0 --to 9 --out ../../workspace/output/<date>-full-visual-look-test/look-test.mp4`,
   the default the same way to `look-default.mp4` in that folder, and show both beside the stills.
5. Iterate on their words, one property at a time. Save the look only when they say it is theirs.

A voice test is the audition (see the interview): two to four voices reading their first two
sentences, picked by ear. Delete the two scratch reel folders when setup ends.

## Finish setup

Before finishing, show one read-back: who it is for, the caption (font, size, ink, said grey,
marker), the grounds and grid, the voice, the words (house script or their transcript, the
closing ask, the post caption shape), and the research lanes and stance. Point at the test
render. Ask once whether this is the default they want saved. If they already explicitly asked
to save it, that instruction is the confirmation.

Mark setup complete with the actual confirmation. Write `workspace/library/full-visual.json` as
`{"setup": {"done": true, "version": 1}}`, keeping any `answers` already in it. Write
`full-visual.preferences.md` as a short account of their taste: purpose, chosen direction,
settled preferences, boundaries and open choices. Evidence and revisions go in the JSON, not
the page. Do not invent a preference for an unanswered item.

## Reuse in a requested reel

Setup does not start a reel. When a reel is requested, the full-visual skill runs it as
written; this profile only feeds it. Before the script: the saved words choice, lanes and
stance. Before the voice: the saved voice (`reel.json` `"voice"` for ElevenLabs, or
`reels/<slug>/voice.json` for another provider). Before the caption and render: the saved
theme written into the new reel's `reel.json` `"theme"`, and any chrome boundary.

A project-specific change stays in that reel's `reel.json`; the profile is unchanged. Real
interfaces, logos, documents and numbers keep their real appearance and data; the theme dresses
the caption, the grounds and authored presentation only. Builders receive the resolved theme
and the relevant constraints with their task, not the raw profile. Do not change builder
orchestration, review stops or approvals as part of customization. Never fabricate approval.

## Learn from what they say during work

Apply a correction to the thing it names. "This key word should not be boxed" is local. "No
boxes from now on" updates the scoped default immediately; do not ask for approval again when
the instruction is explicit. A rejection without a reason calls for one focused question.

For an ambiguous recurring reaction, propose the inferred preference and keep it tentative
until confirmed. Generalize only as far as the evidence supports. Rewrite the relevant
preference paragraph, keep unrelated reasoning, and keep superseded choices as evidence in the
profile, not as competing directions.

Show the paths of the saved files. Report whether a setting was saved, applied, checked on
stills, or still needs an engine change; these are different outcomes.
