---
name: add
description: Merge a newly downloaded Keyframes pack into this folder. Use whenever the buyer says add, install, I downloaded another pack, I bought a new format, merge this, or points at an unzipped folder or a zip. Also use to remove a pack when asked, and to list what is installed.
---

# Add

## Goal

One folder, one runtime. A new pack adds its format, its skill, its scripts and its assets here, and nothing else changes. Removing it is the same manifest read backwards.

## Reasoning

A buyer who owns three packs should not have three folders, three contexts and three boards. Every pack declares what it contributes, in `pack.json` when it is a bare pack and in `.installed/<format>.json` when it is a folder someone bought, so the merge is deterministic and reversible, and the buyer's context and footage are never touched. A folder bought later can be newer than the one bought first, so the shared part comes up to date before the format goes in.

## Pattern

1. Find what they downloaded: the path they gave, or the newest folder in Downloads that carries an `AGENTS.md` or a `pack.json`. Unzip it first if it is a zip. Both shapes work, and what they bought is normally the first one: a whole folder with one format already in it, or a bare pack.
2. Run `node scripts/add.mjs <path>`. It takes the format and nothing else: the skill, the scripts, the assets, the compositions and the install record. When the folder they downloaded is newer than this one, the shared part is brought up to date first. Their footage, their context and their keys are never touched.
3. Run `node scripts/doctor.mjs`. The new format may need a key; if so, open the keys page.
4. Tell the buyer the one command they gained and that the first run sets it up. The download can go in the bin.

Removal: `node scripts/add.mjs --remove <format>` uses the install record to delete exactly what was added.

## Examples

"I bought quick cuts, it's in my downloads": unzip it, merge it, report that `/quick-cuts` now exists and will ask a few setup questions on its first run. "What do I have installed?": read `runtime.json` and list packs with versions.

## Counter-examples

Copying a pack's files by hand. Telling the buyer their download is wrong because there is no `pack.json` at its root: a bought folder never has one, and it is the shape they will always have. Overwriting the buyer's `workspace/library/` or `context/` during a merge. Re-running `/start` after a merge when nothing about the person changed.

Read `references/merge.md` for what is merged and where.
