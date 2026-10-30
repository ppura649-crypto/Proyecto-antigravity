# Full Visual

## Goal

Turn a subject into a full-screen animated explainer reel: no presenter, a voice, a caption that says each word as it is spoken with one key word boxed per line, and under it the real thing each sentence is about, redrawn and moving on the word. Zero cuts, 1080x1920 at 60 fps.

## Reasoning

The format is the seller's working harness, copied as it is: the engine, the stage patterns, the checks, the bar and the worked reels. Every past rewrite of a working harness into a product lost what made it work, so nothing here is rewritten. A buyer makes it theirs on top: the caption, the background, the voice, the words and the topics are choices saved in `workspace/library/`, which survives every update. The motion, the visuals and the method are the format and are the same for everyone.

## Pattern

A video is made in three steps. The workspace app starts each one with a prompt that names the video's folder, `workspace/projects/<date>-full-visual-<slug>/`. The contract is `.agents/skills/full-visual/references/05-workspace.md`.

- Research: the folder's shared `research` skill saves `research.md`, every fact with its link. This format's lanes are `.agents/skills/full-visual/references/04-research-lanes.md`.
- Transcript: `/full-visual-script` reads `research.md` and saves the spoken words as `transcript.md`. A buyer's own transcript is saved word for word.
- Video: `/full-visual` reads `transcript.md` and makes the reel: voice, caption, a visual plan approved in words, one passage first, the rest, checks, render. It delivers `<slug>.mp4`, `caption.txt` and `cover.jpg` to `workspace/output/<the same folder name>/`.
- `/full-visual-customization` is optional. It learns the look, voice and words once, renders a short test, and saves them in `workspace/library/`.
- The engine lives at `engine/full-visual/`. Reels are folders in `engine/full-visual/reels/` and each one registers itself. An update replaces the engine and keeps every reel, asset and render the buyer made (`provides.keep`).
- Voice: ElevenLabs gives exact word times (`scripts/voice.py`). OpenAI and Fish Audio go through `scripts/narrate.mjs` and are timed by whisper.cpp. Keys live in `.env.local`, added on the video's page in the workspace.

## Output

1080x1920, 60 fps, H.264, voice only. Sound is asked once, after the picture is accepted. No sound library ships.

## Limits

English captions only: the aligner and the speech model are English. Proven on a Mac. On Windows it runs through the folder's own runners (Python through `scripts/py.mjs`, whisper.cpp fetched by the folder) and passed 9 of 9 checks on Windows CI. Format 2 (the paper ground with a character) does not ship.

## Counter-examples

Changing the engine to get a look. Copying the house transcript bar as the buyer's voice without asking. Shipping another creator's study, voice or face. Writing a reel's scenes into the shared index by hand.
