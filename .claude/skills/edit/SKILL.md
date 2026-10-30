---
name: edit
description: "Internal. Export a video the buyer changed by hand in the workspace editor, check it, and hand it back. Use when the buyer pastes \"Export my edit of ...\", says export my edit or render my changes, when the session hook says an edited video is waiting, or when a format needs its video opened as an edit (node scripts/edit.mjs read)."
---

# Edit

## Goal

What the buyer arranged in the editor is what they get, frame for frame, with their own footage never redrawn, checked before they see it.

## Reasoning

The editor never renders. Every video, in any format or started blank, opens as one edit document (`workspace/projects/<id>/edit/timeline.json`): clips, sounds, pictures, words, captions and graphics on tracks, in frames. Pressing Export writes `edit/export-request.json` and gives the buyer a line to paste here. The render is ours, like every other render, because only the agent can look at the result and say it is right.

The export keeps the runtime guarantee without any format knowing about it. A clip that fills the frame exactly as its file is goes through ffmpeg untouched; everything else (words, captions, graphics, clips in a box or turned) is drawn by the same `Edit` composition the editor plays, on a transparent track laid over the clip in one ffmpeg pass. Every sound is mixed from the files. So the export never branches on a format: a talking head, a montage and a blank 16:9 project are the same few item types.

The checks are what make the export trustworthy, so none is optional: the length to the frame, the size, the rate, the sound (present exactly when the edit has sound, never clipped), and three frames of the video compared with the same frames of `Edit` drawn whole, including a caption moment when the edit has captions. A failed video never reaches the output folder.

## Pattern

1. Read the request, not the chat: `node scripts/edit.mjs status` lists what waits. The document is the truth; export its current revision even when the buyer kept editing after pressing Export. A Trial Reels version is `<project>@<version>`: its edit is in `edit/<version>/`, its video `<version>-edit-r<n>.mp4` with the version's caption beside it.
   - **Work only you can do.** An item carrying `agent: { task, note, ref }` needs you first; status lists them and the export refuses until they are done. Do the task the way the pack says (`ref`, for example `editor/trial-reels/README.md`: new words set in the creator's own letters with words.py), then `node scripts/edit.mjs resolve <project> <item> [--src <new file> --on <clip item>]` clears it. When the note says the change cannot be made (a row count, a letter not on file), tell the buyer in their words and let them change it in the editor. Never clear a task you did not do.
   - **Things left out.** An item carrying `missing: '<reason>'` cannot be drawn here (a Talking Head card from a newer engine, say). The export leaves it out and lists it under `leftOut`; tell the buyer by its name, in one line, before they watch.
2. Say one line (what will be made, how long it takes), then run `node scripts/edit.mjs export <project>`. It refuses a document that fails its own check, and refuses when the disk has too little room; fix the cause, never the check.
3. The still comes first: `workspace/output/<project>/edit-r<revision>.jpg`. Look at it. `--still-only` stops there when the buyer only wants to see a frame.
4. When it finishes, open `edit/checks/r<revision>/f<frame>.jpg` (the editor's frame left, the export right) and look at every pair yourself. A pass with a frame you did not look at is not a pass.
5. On a pass, present it the stages way: what changed, the video and its folder opened with `node scripts/open.mjs`, what they can say next (change something in the editor and export again). On a fail, the reason is in `edit/exports.json`; say it in plain words, fix what is ours, export again.
6. `node scripts/edit.mjs read <project> --fresh` rebuilds the edit from the format's own files (after the format re-rendered). It keeps the old document in `edit/versions/` and raises the revision. Never run it over the buyer's hand edits without saying so.

Details of the plan, the checks and their thresholds: `references/export.md`.

## Examples

The buyer pastes "Export my edit of Still making every ad (revision 3)". Status shows it waiting; the export writes the still, then `edit-r3.mp4`; the three pairs match, the caption moment shows the words on both sides; the video and folder open: "Your edit is exported: the hook now fades in and the middle is 1.5 times faster. Change anything in the editor and export again."

A blank 1:1 project of three phone clips and a song: same command, same checks. The clips are cropped to cover the square as the editor showed them.

## Counter-examples

Rendering from the page, or asking the buyer to run the command. Re-rendering the format's own pipeline instead of the edit. Lowering a threshold because a frame pair differs: find why they differ. Saying "exported" before looking at the pairs. Leaving a failed video in the output folder. Exporting an older revision because the request named it. Deleting the buyer's edit with a fresh read without keeping it.
