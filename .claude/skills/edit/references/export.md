# How the export works

## Goal

Know what the export did to each item, and why a check passed or failed, without reading the script.

## The plan

`scripts/edit-export.mjs` splits the document by one rule, never by format.

- **Untouched** (ffmpeg): a video item on a visible track with no box (or a box the size of the frame), no crop, no rounded corners, no move, scale or turn, full opacity, no fades, cover fit (or contain when the shapes match), and nothing drawn under it on a lower track while it plays. It is cut from its file at `trimStart`, sped with `setpts`, set to the edit's rate (each frame shows the source frame on screen at that moment, as the editor does), scaled to cover and centred. Gaps between untouched clips are the edit's background colour. A file that does not say how its colours are stored is read as bt709, the way the browser reads it.
- **Drawn** (Remotion): everything else visual, rendered by `scripts/editor/render-root.tsx` (composition `Edit`) with the untouched items skipped, silent, on a transparent background. Frames stream into ffmpeg as PNGs; nothing large lands on disk. The render bundle carries the same `keyframes-layers` registry as the editor page (a project's own graphics included), and a public folder with every file the document names under `media/` plus the project folder and each installed `public/` for `staticFile()`.
- **Sound** (ffmpeg): every audio item on an unmuted track, and the sound of every video item on a visible, unmuted track, with its volume, fades, speed (`atempo`) and start. Summed without being turned down, then a limiter at 0.95.
- One ffmpeg pass lays the drawn track over the base in RGB and encodes H.264 crf 18, yuv420p, bt709, AAC 192k, faststart.

Hidden tracks draw nothing and play nothing. A graphic whose pack is not installed stops the render (it would ship a placeholder).

## The checks

| Check | Pass |
|---|---|
| length | frames and seconds within one frame of the edit |
| size, rate | exactly the edit's |
| sound | an audio stream exactly when something plays, and audible |
| peak | the loudest sample under full scale |
| frame N | PSNR of the export against `Edit` drawn whole at that frame, at least 30 dB |
| drawn N | mean difference over the drawn pixels, at most 16 of 255 |
| caption | at the first caption word's moment the drawn track holds the words |

The frames are the busiest one (the still), a caption moment when there are captions, and spread frames. Each pair is saved as `edit/checks/r<revision>/f<frame>.jpg`.

## When a check fails

- A frame fails but its drawn check passes: the clip underneath differs. Look at the pair: one frame off in time means a rate or speed rounding; a colour cast means the file's colour tags.
- A drawn check fails: the drawn track differs from the editor's frame (a font that did not load, a graphic reading a file that was not staged).
- Caption fails: the caption item draws nothing in the export; check its look is installed.
- Length fails: a clip runs past the end of its file; the document check normally catches this first.

## Room

The export refuses when the disk has less than the larger of 2 GB and the video's size plus 1 GB. The bundle and staged files are removed when it ends, passed or failed.
