# Preserve the tested cut foundation

## Goal

Produce a complete, verified `master.mp4` and a source-to-master time map before visual planning.
The copied preparation, take selection, boundary measurement, cleanup, mastering and verification
tools are byte-identical to Talking Head 0.4.6. Only their format adapter is new. Their hashes are
recorded in `engine/split-explainer/cut-foundation.json`.

Read `01-cut-and-review.md`, `01b-verifying-a-cut.md` and `01c-cleanup.md` for the established
reasoning and failure cases. Their historical Talking Head command paths refer here to
`engine/split-explainer/scripts/`. The current entrypoint governs self-review and continuation;
historical buyer review examples do not introduce approval stops.

## Pattern and commands

Initialize only a new project. Use absolute input paths when resolving a clip outside the workspace.
The following commands run from the installed workspace; `<project>` is its actual project path.

```sh
node scripts/split-explainer/steps.mjs <project> --init --source <original-clip>
node scripts/intake.mjs <original-clip> --transcribe
node scripts/split-explainer/prepare.mjs <project>
node scripts/py.mjs engine/split-explainer/scripts/build_cuts.py <project>
```

Intake records the original transcript in the runtime's media context. The preparation adapter
resolves it before creating a project-local 30 fps all-intra working copy. It records the supplied
path as `originalSource`, retains the transcript path, and writes `normalization.json` with both
file hashes and the time relationship. `source.txt` points to the working copy. Source milliseconds
stay unchanged: there is no speedup, silence removal or audio compression in this normalization.
The shorter stream is padded at the tail to the final video frame so speech is not truncated.
An original with unequal audio/video start timestamps stops for explicit alignment; the adapter
does not guess whether recognizer times include that offset. A local transcript can be supplied
with `prepare.mjs <project> --transcript <words-file>` without another transcription request.

Intake transcribes in English. For a recording in another language, transcribe it in its own
language and hand that transcript to preparation:

```sh
node scripts/transcribe.mjs <original-clip> --out <project>/words.asr.json --lang fr --local
node scripts/split-explainer/prepare.mjs <project> --transcript <project>/words.asr.json
```

Confirm the source provenance and that the word coverage check passes. If it misses speech, improve
the transcription. Never skip uncovered speech merely because it is absent from the transcript.
Do not call the historical `read_fit.py`: its placement policy belongs to the other format.
Inspect this format's actual split and presenter crops using composed stills during setup and build.

Read the whole source delivery. Write `selection.json` mapping selected clip IDs to their roles.
Retakes are editorial choices: preserve the best coherent delivery and the actual argument, not
automatically the last attempt when it loses important words.

```sh
node scripts/py.mjs engine/split-explainer/scripts/select_takes.py <project> <project>/selection.json
node scripts/py.mjs engine/split-explainer/scripts/cut_variants.py <project> d-hard
```

Use the creator's saved pacing, otherwise begin with d-hard and judge this recording. Copy the
chosen `cuts.<preset>.json` to `cuts.json`. This is a real source edit, never a playback speedup.
Inspect first and last source frames and gaze; apply justified nudges without shaving words.

```sh
node scripts/py.mjs engine/split-explainer/scripts/gaze_tile.py <project> --from-source
node scripts/py.mjs engine/split-explainer/scripts/cleanup.py scan <project> --audio
```

Read every kept passage and the contextual cleanup evidence. Decide each candidate and any other
observed artifact; a flag is not an automatic removal rule. Never claim to hear audio from a
waveform. Correct uncertain word bounds from evidence before deleting a region that overlaps them.

```sh
node scripts/py.mjs engine/split-explainer/scripts/cleanup.py apply <project>
node scripts/py.mjs engine/split-explainer/scripts/cleanup.py check <project>
node scripts/py.mjs engine/split-explainer/scripts/render_spine.py <project>
node scripts/py.mjs engine/split-explainer/scripts/master_audio.py <project>
node scripts/py.mjs engine/split-explainer/scripts/workflow.py verify-cut <project>
node scripts/py.mjs engine/split-explainer/scripts/lock_layer.py lock <project> cut "self-review: <the actual passage, cleanup, complete words, joins and gaze checked, at least twenty words>"
node scripts/split-explainer/align-words.mjs <project>
```

The verification command runs every copied check through the format adapter. Its final-word
lookup uses the selected segment and its declared phrase end, so a following discarded take
cannot replace the closing word. A severed word or wholly omitted declared final word still
fails; the other checks and the copied foundation remain unchanged.

Wrap long commands with `node scripts/split-explainer/run.mjs <project> "Preparing the cut" <command> ...`.
That reports the real subprocess through the existing app task reader. No percentages are invented.
After the verified cut, continue to planning in the same session.

## An explicitly uncut take

When the creator asks to keep the recording as delivered, stop before `build_cuts.py`. Complete
intake and `prepare.mjs`, then write a project-local decision file:

```json
{"mode":"whole","evidence":"The creator's actual request to keep the complete take","reason":"Why that request applies to this recording"}
```

```sh
node scripts/split-explainer/prepare.mjs <project> --whole <decision.json>
node scripts/split-explainer/align-words.mjs <project>
```

The adapter runs the unchanged whole-take and mastering tools, checks the complete 30 fps picture
and audio track, and writes the missing identity `spine-map.json`. `whole-take.json` records the
actual decision and hashes of this master and map. Its `inspection` begins unreviewed. Inspect
the full delivery, opening, ending and recorded voice; then set `inspection.reviewed` to true and
write the specific observations in `inspection.evidence`. Record the decision in the project brief.
Do not claim listening from waveform inspection. A technical frame check is not a listening check.
Refresh `steps.mjs`: it recognizes this inspected whole take without cleanup or a fabricated cut
lock, and no longer accepts the inspection if the master or map changes. This is preparation
evidence, not a buyer approval or a new final-render review ledger. Continue to visual planning.

## Synchronization boundary

`words.json` uses source milliseconds; `aligned-words.json` uses cut-master milliseconds.
The alignment helper assigns a word to its greatest source-segment overlap and maps through
`spine-map.json`. Inspect words near joins: mapping does not correct an inaccurate recognizer.
All visual and caption frames derive from the master at 30 fps. Reusing source timestamps after
cutting would desynchronize every later event.
