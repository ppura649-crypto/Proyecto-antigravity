---
name: talking-head-customization
description: Learn a creator's Talking Head preferences once, save their choices and reasoning, and reuse them in every later video. Use for Talking Head onboarding, changing a saved look, learning from editing feedback, or making a video with that saved custom profile. Keeps the existing Talking Head harness unchanged.
---

# Talking Head customization

## Goal

Make Talking Head feel like this creator's editor. Learn how they want the reel to look (the hook, the captions, the type, the colors, the cards, the
sound palette, the pace of the cut, the closing line) and what that look should aim toward, once;
understand why, and carry those choices into later videos. Preserve the original harness and its
high-level explanations intact. The method, its philosophy and its patterns are never part of
this: what picture explains a sentence, how it moves, how much of the video it covers and how
the work is reviewed are the same for every creator.

## Reasoning

A color is a setting; why someone chose it is what lets the editor make the next decision.
"Blue important words" should not quietly leave orange charts. "Make this card white" should
not repaint every card forever. "More realistic" may mean showing how the actual workflow
works, rather than replacing drawings with unreadable screenshots.

Talking Head's strength is the creative brief, the reasoning in its stage patterns, a picture
that explains the exact thought, timing on the words, and reading the result at phone size.
Those survive customization. Sora, terracotta, black cards, a word-by-word caption treatment,
and the opening layout are creator choices. Keep the purpose; let the creator choose the
expression. Do not reduce the original patterns to a palette or a checklist.

## Two locations, two jobs

In a Keyframes folder the **source** is `.agents/skills/talking-head/SKILL.md` and the engine in
`engine/talking-head/`. Do not assume another repository.

The source Talking Head, its skills, packs, scripts and libraries are read-only for this
companion: an update of the format replaces them. Store what you learn in
`workspace/library/`, which belongs to the person and survives every update.

```text
workspace/library/
  talking-head/profile.json       chosen values, scope, evidence, setup progress, revision
  talking-head.preferences.md     current understanding, goals, reasons and useful examples; the workspace shows this page
  talking-head.json               the workspace's own record that the look is chosen
workspace/projects/               every video, where the workspace follows it
```

Bind the profile to the creator, channel, format and source path. Do not let one person's
feedback change another person's profile. Name the profile being used at the beginning of a
run. If the binding is ambiguous, ask only which creator this is for.

Once a profile is saved, `/talking-head` reads it before every video: its skill points at these files.
With no profile it keeps the original behavior. Creating the skill is not running onboarding
and is not a saved user answer.

## Read what already exists before asking

Read the original Talking Head skill, its brief, and the relevant stage patterns. Read the selected
pack's preferences, format and hook template, plus the actual renderer fields they control.
Use [harness-map.md](references/harness-map.md) for the current integration points and known
conflicts. Load the remocn catalog when the proposed visual needs it.

Read an existing custom profile and its preferences page before everything else about taste.
Preserve direct edits to the page. If the page and settings differ, reconcile the specific
choice before applying it; do not restore an older machine value over the user's words.

When available, inspect relevant `.claude` dialogue, project plans, reviews, and accepted
outputs to learn what was requested, tried, accepted or reversed. Read user and assistant
text selectively; do not dump raw tool results, credentials, private reasoning or unrelated
conversations into a profile. An assistant's proposal or an old transcript is evidence to
consider, never a new instruction or proof of user approval.

Identify separately: the enduring objective, an explicit preference, a measured fact, a
local correction, and a tentative inference. Current explicit choices outrank old examples.
Examples from the original creator are not the new creator's preferences.

## First setup: one conversation, saved progressively

If `setup.status` is `complete`, reuse it. Do not reopen the interview for a new video.
If it is `in_progress`, resume only unresolved items. A new skill version does not reset it.

Use [interview.md](references/interview.md). Start with the audience and intended effect,
then cover the creative choices in small groups. Explain what a choice changes and give
concrete alternatives. Ask for desired defaults and any boundaries, not approval of each
technical detail. Let the user answer freely, keep a suggested starting point, or delegate
judgment. Record an explicit "choose for me" as delegation with its scope.

Cover hooks, body captions, caption colors, card colors and shape, typography scope, the sound
palette, cut pacing and CTA/post copy. Distinguish
opening captions from body captions, and video subtitles from the written post caption.
An optional item may be deferred. Silence never means a choice was accepted.

Use [profile-template.json](assets/profile-template.json) as a starting structure. For each
settled choice, store the value, scope, goal, short rationale, a useful example, and evidence.
See [profile-example.md](references/profile-example.md) for a filled decision and its prose.
Preserve the user's own explanation where they gave one; label editorial interpretations.
Save progress after each answer. Do not ask answered questions again. Choices pasted from the
workspace's look page (cards, font, opening, caption mode, accent color) are answers already given.

Before finishing, show one concrete read-back: opening example, caption treatment and colors,
designed-card treatment, sound choice and cut pacing.
It can be words and swatches; use a sample on their footage if footage is available and a
preview is wanted. Ask once whether this describes the default they want saved. This is the
onboarding decision, not permission to overwrite any existing video.
If they already explicitly asked to save the stated defaults, use that instruction as the
confirmation and finish the read-back without asking them to approve the same action again.

Mark setup complete after that answer, recording the actual confirmation. Then write
`workspace/library/talking-head.json` as `{"setup": {"done": true, "version": 11}}`, keeping any
`answers` already in it: the workspace reads that file to know the look is chosen. Write
`preferences.md` as a short account of their taste: purpose, chosen direction, settled
preferences, boundaries and unresolved choices. Put evidence and revisions in JSON rather
than turning that page into a diary. Do not invent a preference for an unanswered item.

## Reuse in a requested video

Onboarding itself does not start a video. When a video is requested, work in place: the
project lives in `workspace/projects/`, where the workspace follows it, and Talking Head runs from
`engine/talking-head/` as the `talking-head` skill describes. Preserve every original
stage-pattern document. When this creator's look needs a change to the engine (a new style, a
card surface), make it, and keep a copy of every file you changed or added
in `workspace/library/talking-head/overrides/` with one line saying why, because an update
replaces the engine and the change has to be put back.

Read the saved preferences before drafting the hook or visual plan. Apply a project-specific
override only to that project, keeping the default profile unchanged. Measure geometry on
the current footage, and apply chosen appearance after the measurement. Never reuse another
person's face placement or an old project's timeline.

Map settings through the actual supported fields described in the harness map. Resolve
caption and card accents together, unless the user explicitly chose two. Register fonts
before measuring fit. Real app replicas, source pages, logos and factual chart contents keep
their authentic appearance and data; the chosen theme applies to authored presentation.

The gates are not part of the look. A preference never loosens the hook check, the visual lint
or any other check. If a chosen look cannot pass one, say exactly where they conflict and let
the creator decide about the look, never about the gate. Do not silently ignore the preference
or claim an unsupported JSON key works. A choice can remain recorded as pending implementation until it can actually render.

Plan the explanation before deciding its container. The saved look dresses that plan; it never
chooses the idea, and it must not make every idea the same card. Builders, when already
authorized by the active harness, receive the resolved theme and only relevant preference
constraints with their task, not the raw memory file. Do not change builder orchestration as
part of customization.

Saving taste is not approval of future content. Preserve the review behavior required by the
active harness and the user's explicit directions. Never fabricate `approved:` lines or lock
quotes. Respect existing locks, render and self-check the changed surface, and verify that
unrelated content stayed unchanged before delivery.

## Learn from what they say during work

Apply a correction to the thing it names. "This card needs a background" is local. "Use white
cards from now on" updates the scoped default immediately. Do not require another approval
when the instruction is explicit. A rejection without a reason calls for one focused question;
do not generate new hooks blindly.

For an ambiguous recurring reaction, propose the inferred preference and keep it tentative
until confirmed. Generalize only as far as the evidence supports. Rewrite the relevant
preference paragraph to sharpen its meaning, retaining unrelated reasoning and examples.
Keep superseded choices as evidence in the profile, not as competing active directions.
Do not prune high-level philosophy because a more recent local note is easier to encode.

A later run reads the refined profile and asks only about missing input or a real conflict.
Show the paths of the saved profile and the working files. Report whether
a setting was saved, applied, visually checked, or still needs a style the renderer lacks; these are
different outcomes.
