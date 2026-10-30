# Working from the workspace

The buyer makes a video in three steps. The workspace app gives them a prompt for each step. Each prompt names the
video's project folder. Follow this page whenever a prompt names a project in `workspace/projects/`.

## One video, one folder

- One video is one folder: `workspace/projects/<YYYY-MM-DD>-full-visual-<slug>/`.
- It holds `project.json`: `{"format":"full-visual","title":"<the subject>"}`.
- The folder name is the video's name everywhere: in `workspace/projects/` and in `workspace/output/`.
- Never write to `~/Downloads`.

## Step 1: Research (the `research` skill)

- Create the folder and `project.json` if they are missing.
- Save the findings as `research.md` in that folder.
- Every fact has its source link, checked today.
- This format's lanes are in `.agents/skills/full-visual/references/04-research-lanes.md`.

## Step 2: Transcript (`/full-visual-script`)

- Read `research.md` from the folder.
- Write the spoken words only to `transcript.md` in that folder. No hooks list, no notes, no word count.
- Show the transcript in chat.
- If the buyer pasted their own transcript, save it word for word as `transcript.md`. Do not rewrite it. Only point
  out facts that look wrong.
- Drafts and hook options may still go to the skill's usual places. `transcript.md` is the one the app reads.

## Step 3: Video (`/full-visual`)

- Read `transcript.md` from the folder.
- Check for a voice key first: `ELEVENLABS_API_KEY`, `OPENAI_API_KEY` or `FISH_API_KEY` in `.env.local` at the
  folder root. With none, stop. Tell the buyer to add one on the video's page in the workspace, then run the step
  again.
- Make the reel in `engine/full-visual/reels/<slug>/`. Copy the transcript to its `script.txt`, word for word.
- Then run the stages of the `full-visual` skill: voice (see The voice below), caption, plan, scenes, checks, render.
- Deliver to `workspace/output/<the same folder name>/`:
  - `<slug>.mp4`, the final render;
  - `caption.txt`, the post caption;
  - `cover.jpg`, one frame from the video.
- The app marks the video done when that mp4 exists. Write it last, after both checks pass.
- Print the full paths of the three files.

## The voice

The voice carries the video. The owner of this format tuned it on many takes, and the feedback was always the same:
it must sound alive, with emotion that follows each sentence, and fast. A flat, slow or "AI-sounding" voice ruins
a good video. So:

- **A voice saved by the buyer wins.** Read `workspace/library/full-visual.preferences.md` and
  `workspace/library/full-visual.json` first. If they chose a voice, use it.
- **Otherwise, with an ElevenLabs key, use the house voice.** Copy the `"voice"` block of
  `engine/full-visual/reels/hf-incident-h5/reel.json` into the new `reel.json`: Snap (`gWaDC0oXAheKoZfljzuI`),
  model `eleven_v3`, speed 1.0, stability 0.5, similarity 0.8, style 0.0. Never `eleven_multilingual_v2` for this
  format: it has no emotion.
- **Emotion comes from audio tags.** Write `script.v3.txt` next to `script.txt`: the exact same words, plus one
  light v3 tag at the start of each paragraph, chosen by what that paragraph does. `[curious]` on a question,
  `[excited]` on a discovery, `[quickly]` or `[rushed]` on the news, `[emphasized]` on the key line, `[impressed]`
  on the payoff. Keep the energy up: slow tags (`[serious]`, `[ominous]`, `[matter-of-fact]`) made takes slow and
  flat, use one at most. The model is `engine/full-visual/reels/distillation-us/script.v3.txt`.
- **Numbers and money in words** in `script.v3.txt` ("seven hundred", "one million dollars"). v3 swallows digits.
  The caption keeps the digits.
- **One untouched take** of the whole script. Never splice or glue paragraphs. If a part sounds flat, generate the
  whole take again (best of two or three) and keep the most alive one.
- **Then cut the long pauses:** `node ../../scripts/py.mjs scripts/tighten.py <slug> --cap 0.2`. The hook (the
  first paragraph) is never cut, and neither is a gap next to a number.
- Aim for about 3 words a second.
- If ElevenLabs refuses the Snap voice (some plans cannot use library voices), say so, and use a voice from the
  buyer's own ElevenLabs account with the same model and tags.
- **OpenAI or Fish Audio:** no audio tags. Pick a lively, fast voice, and time it with recognition as the
  `full-visual` skill says. Tell the buyer once that ElevenLabs gives the best result for this format.

The bar for the picture and the motion is `.agents/skills/full-visual/references/taste.md`.
