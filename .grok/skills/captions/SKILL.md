---
name: captions
description: Internal. Write and check the post caption for any format, called by format skills at export. Use whenever a caption.txt is written, whenever the buyer asks for a caption, a comment keyword, a DM text, or asks why a caption failed the check. Two shapes, chosen by whether the buyer has a comment-to-DM automation.
---

# Captions

## Goal

A caption a stranger understands in the first line, that carries the value the video promised, names one action and gets it, and that search can read. Written for the reader; it happens to be what reach rewards.

## Reasoning

Reach comes from watch time, likes per reach and sends per reach. A caption cannot add watch time, but a caption worth sending to a friend, a list, a set of prompts, a checklist, adds sends and saves. Caption text is read by Instagram search and by Google and Bing, so the topic words go in plain prose in the first two sentences. Hashtags were capped at five and only classify a post, so none are used here. The first 125 characters show before "more", so the first line is the whole caption for most readers.

The first line depends on one fact in `context/answers.json`: whether a comment-to-DM automation exists. With one, the caption asks for a comment and delivers by DM. Without one, it never asks for a comment it cannot answer. These are two captions, not one caption with a line removed.

## Pattern

With automation:
1. Comment line: the keyword, what arrives, where. "Comment MEMO and I'll send you the full guide." One keyword, capitals, unique to this post, the same word on screen and in the DM tool. Under 125 characters, nothing before it.
2. The why: two to four sentences naming the topic in searchable words: the authority, the tool, the method, the outcome.
3. The value, complete: numbered prompts written in full, a checklist one per line, tools with one clause each. The DM adds the longer version; the caption is not a teaser.
4. The close: what to do with it. "Save this, then run prompt 2 on something you already sent."
5. The follow line: "(follow first so my DM reaches you)".

Without automation: the first line is the promise ("The 5 prompts that make Claude write like a consultant, below"), then the why, the complete value, and a close that asks for a save or a send. No keyword, no follow line.

**Every number here is a default, and the account overrides it.** `context/captions.json` (written by `captions.mjs`) holds what this buyer actually does: the length, the first line, the blocks, the fact lines and the mark they carry, how often a link and a keyword appear, the opens and closes that repeat with what each reached, and which marks the account uses. Read it, per format when the format has one, before writing a word. The defaults below are for an account with nothing measured yet: 600 to 2,200 characters, a blank line between parts, sentence case, digits for numbers, at most one emoji at the end of the first line. An account whose median is 870 gets 870, not 1,400; an account that closes half its posts with "Save this" closes this one that way; an account that uses no emoji gets none, and one that uses them in a tenth of its posts may have one.

For Trial Reels, follow the source-specific caption reference in that format. Preserve the source CTA and its working keyword when the resource stays the same; lightly rephrase every variation instead of imposing a new caption structure.

The same measure runs on what you wrote. `checks/captionfit.mjs` puts every caption through `scripts/lib/caption.mjs`, the one function that read the account, and fails it against the account's own numbers. Two measures would drift and the check would compare nothing.

## Examples

See `references/examples.md`: three reference captions with their measurements.

## Counter-examples

A first line that repeats the on-screen hook. Taking a number from this page when `context/captions.json` has the buyer's own. Writing a house caption for every account: two formats of one account can write differently, and the reading says so per format. Hashtags on an account that never uses them. Em dashes, emoji bullets, ALL CAPS sentences. "Link in bio" for something that fits in the caption. "The full list is in my DMs" with nothing in the caption. A keyword reused from an earlier post. A claim not in the brief's sources. "Like and share".
