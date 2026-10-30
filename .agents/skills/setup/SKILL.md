---
name: setup
description: Internal. The setup discipline every format runs on its first use, called by format skills, not by the buyer. Use it when a format's library settings are missing, not done, or behind the pack's setup_version, or when the buyer asks for format setup or to change a format's style, sounds, shots or CTA.
---

# Setup

## Goal

Directions first. The format learns its preferences once, from the buyer's context and a few questions, shows one example, and stores the answers so every later run adapts without asking.

## Reasoning

The account reading can suggest defaults; the format still has choices only it can make: the style, the sounds, the shots, the rhythm, the CTA shape. Asking them on every run is noise; never asking them makes every reel generic. The context already suggests most answers (the colour the account uses, the sounds it used, its cut density), so the buyer confirms defaults instead of inventing. One example still before anything else runs turns the answers into something the buyer can see, and a wrong answer is corrected before footage is spent. The state record carries a version so a pack update asks only its new questions.

## Pattern

1. Read the format's `setup.json`: questions, default rules, the example to render.
   First share the format's workspace overview, where a full example shows the output before any questions. Read the shared `context/answers.json` and account notes. Audience and topic direction are saved there once for every format; never ask for them again merely because the buyer chose another format.
2. Compute defaults from available `context/`. While the account reads, Talking Head and Quick Cuts use their shipped defaults and the buyer's own footage. Never wait for account setup merely to choose a look. Show defaults and let the buyer change them.
3. Ask at most six, one at a time, in the buyer's words, with what changes if they answer differently.
4. Render the example: a still from the format's composition with the answers as props. Show it. Take one round of corrections.
5. The setup page prepares a prompt. When the buyer pastes it into chat, the agent saves `answers` and `setup: { done: true, at, version, example }` in `workspace/library/<format>.json`. Quick Cuts writes these under `formats[formatId]`. Talking Head has no save script: its look goes through the `talking-head-customization` skill, which treats the pasted choices as answers already given and writes the setup record itself. Preserve other formats and read the current preference Markdown, which the buyer can save directly on the page. A setup draft or a complete-looking answer set never means setup is done.
6. Hand back to the format skill, which runs without another question.

Re-entry: "<format> setup" reopens one section. A new clip never clears or reopens a saved look. For other formats, a version behind asks the new questions only. Talking Head always reuses an explicitly saved look, including older setup versions; change it only through Edit look or an explicit setup request. A large profile change is offered, never forced.

## Examples

Quick Cuts beat montage: each saved template shows its numbered output preview and its own filming guide. The buyer adds originals; the agent prepares the matching crops and chooses an eligible song when generating. Talking Head: the accent colour default is the colour measured from the top posts' text; the example still shows one caption stack in it.

## Counter-examples

Asking all eight questions of a pack that has three. Rendering the full video as the example. Writing the state record before the example was shown. Storing answers under `context/`, which belongs to the person, not the format.
