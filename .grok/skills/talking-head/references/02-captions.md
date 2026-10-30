# Captions for the whole video: a measured system, not a design

Stage 2. Starts the moment their cut is saved, covers the entire spine in one pass, hook stack
included. On reference edit A this stage ran three times before it was right, and the third pass was
the only one built on a frame-by-frame reading of Creator Format 1. That is the lesson of this file.

## Goal

Captions that read like Creator Format 1's because they obey the same measured grammar, in our accent
color and their font picks, saying exactly what the creator says with the transcript errors fixed, with a
hook that hits the way Creator Format 1's hooks hit.

## Reasoning

The brief was one sentence: "perfect captions like copying Creator Format 1 style, not the same colors but
at least the same exact way of doing". Pass one applied the spec from the research lanes
(80 px Helvetica, one word per page) and came back "the hook is very very very bad", because the
research had measured a fixed caption band and missed everything the hook does above it. Pass
two answered their design brief (a top title block, a rounded font on two words) and was deleted
on sight. Pass three came after downloading four of their reels and reading hooks, captions and
overlays frame by frame at 10 fps, and it was accepted in one render: "now do that for mine ...
Very nice captions, well done".

So the order is analysis, then build. What was measured (`formats/creator-format-1-system.md`,
`formats/creator-format-1-hook.md`): body captions one word per page, verbatim with punctuation, sentence
case, hard cuts with zero animation, cap height ~0.023H (62 px at 1080, not 80), baseline locked
at 0.625H at chin/mic/hand level and never following the face, emphasis in two grades (inline
accent, and an all-caps hero fit to ~66% width) on payload nouns, tool names and the CTA
keyword, never numbers or verbs, at most two body heroes per reel. The hook is a composed
all-caps stack: small white connectors spread wide, a mid line at 1.25x, one huge accent
payload, words popping into their slots as the creator says them and the whole stack clearing at the
clause end, then word-by-word resumes; a second stack is allowed back to back (ARE DOING IT /
WRONG.).

The caption may be more correct than the audio. The creator said "lists" and meant skills; the caption
shows SKILLS as a hero ("it's skills it's correct, so we should have skills bigg"). ASR fixes
live in `caption-plan.json`, one line per fix, never a hand edit of `captions.json`.

Fonts and colors are their picks and live in `formats/creator-format-1.json`: Zen Dots for every word since
("i want to change the font that I initially had; let's take Zen Dots. It's better"),
white words and terracotta accents told apart by colour and hero size; before that Michroma
carried the white words and Zen Dots the accents (DynaPuff was the second candidate, Permanent
Marker rejected as "too wide inside the letter"), terracotta #E07850, and the layered shadow
`0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)` so words hold over bright
monitors. A wider font changes the stack metrics: Michroma glued the small connector lines and
overflowed the mid line until the spread box widened.

The flat system (a guest spec): every caption, the hook stack, the heroes
and the CTA line in one setting, Avenir Next Bold 700, 46 px at 1080 wide, white, uppercase words
exactly as they come from the caption file, caption shadow kept. No accent font, no accent
colour, no bigger hero. In the format this is `fontFamily` = `accentFontFamily` = Avenir Next,
`fontWeight` 700, `fontSizePx` 46, `emphasisColor` white, `heroMaxFontPx` 46 (hero = base, so
`fit()` caps every hero at the base size), `uppercase: true`, `ctaFlat: true` (the CTA card wears
the caption font instead of Michroma + Zen Dots). Small stack words spread to the hero width only
when the system has a hero width; a flat system keeps its lines centred. The names under logo
marks use the same setting. reference edit A keeps `formats/creator-format-1.json` (Michroma + Zen Dots); the flat
system lives in the per-video `format.json` and is patched into `captions.json` `style` without
rebuilding the approved pages.

Speed belongs here because it was decided here: whole-video 1.3x and 1.2x were tried and
rejected; the hook ran 1.1x through the punch until when the creator heard a 1x A/B and said
"don't sped up pls. Don't do that". Nothing is sped up any more, the hook included.

## Priority

1. What the creator says, verbatim with punctuation. Fix ASR errors, never paraphrase, never drop a word.
2. The hook stack per `creator-format-1-hook.md`, with the punch line (WRONG.) as its own stack.
3. Geometry from the format file: size, baseline, width, hold times. No per-video tuning.
4. Emphasis restraint: the stack heroes plus at most two body heroes (reference edit A: SKILLS at the
   client's line with "client's" small above it, and RULE DEBT).
5. Fonts and colors are their standing picks; change them only when the creator names a new font.
6. Readability holds: heroes ≥ 600 ms, stacks ≥ 800 ms after their last word, WRONG. may hold
   through the cut into the next clip, as Creator Format 1 does.

## What good looks like

```json
{
  "fixes": [ { "find": ["client's", "list"], "replace": ["client's", "skills"] },
             { "find": ["rural", "depth"], "replace": ["rule", "debt"] },
             { "find": ["problem", "growth"], "replace": ["prompt", "growth"] } ],
  "hook": { "clip": 1, "phases": [
      { "type": "stack", "lines": [[{"t":"YOU ARE STILL","size":"s"}],
                                   [{"t":"IMPROVING YOUR","size":"m"}],
                                   [{"t":"SKILLS","size":"h","accent":true}]] },
      { "type": "words", "count": 9 },
      { "type": "stack", "lines": [[{"t":"ARE DOING IT","size":"s"}],
                                   [{"t":"WRONG.","size":"h","accent":true}]] } ] },
  "emphasis": [ { "words": ["client's", "skills"], "grade": 2, "lead": 1 },
                { "words": ["rule", "debt"], "grade": 2 } ]
}
```

Ten ASR fixes, one composed hook with two stacks, two body heroes. Compiled: 213 pages, median
word life 265 ms (Creator Format 1: 200 ms, the creator speaks a little slower). Delivered as the full 59.8 s
captioned file plus the ramped version, both fonts side by side for their pick.

## Traps

- Pass one: 80 px Helvetica at 0.669H, flat word-by-word through the hook. "very very very bad".
- Pass two: a hook sentence pinned at the top for 2.25 s, captions moved to 0.72H, Arial Rounded
  on "the most important words" twice. "completely delete ALL the ulgy ass caption you just did".
  A design brief without the measured grammar underneath does not survive.
- Permanent Marker for accents: "the colored ones are too wide inside the letter".
- A hero that cannot be read: SKILLS cleared 60 ms after it popped ("The hook we can't see the
  SKILLS"); "client's SKILLS" held 448 ms. Hence the minimum holds.
- Whole-video speed 1.3x / 1.2x: "maybe the hook can be 1.1, and the rest 1 until 'wrong'".
- Regenerating captions after approval. `rebuild.mjs` does it by default; after approval only the
  timeline shifts, the content never changes ("IT SHOULD NOT CHANGE THE CAPTIONS WE DID OR THE
  HOOK WE JUST DID, THIS IS ALREADY AMAZING").
- An overlap FLOOR on word-to-clip assignment. `build_captions.py` required 35% of a word's stamp
  inside the clip, which silently deleted six words the creator actually says on reference edit B ("and", "But",
  "Because", "can"): Apple stamps starts 150-250 ms early, so a clip's own first word regularly
  keeps only 20-30% of its stamp. Largest share wins, no floor. Prove a doubtful one on the level
  curve, not on the stamp (reference edit B "can" is a clean vowel peak at 167.1 s inside its clip).
- A `minPageMs` clamp that can only borrow BACKWARDS. A clip's first word has no page behind it
  (the one before ends on the cut), so it compiled to 35 ms, one frame. It borrows forward too,
  cascading through the following pages until the debt is paid.
- The caption builder defaulting to the PACK's format file. `build_captions.py` read
  `formats/creator-format-1.json` while the measured values sat in `projects/<id>/format.json`, so the
  edit-c-qa stack rendered at 0.56H, across their chin, and the baseline at 0.625.
  The project file wins when it exists; the build prints which file it used.
- Reusing another video's caption geometry because it is the same speaker. reference edit B sits 7% of
  the frame higher than cut-tight (head top 0.385H vs 0.46H, chin 0.60H vs 0.72H). Measure the
  face on THIS master, then place the baseline between collar and mic.
- Hard-coding the hook stack anchor. `stackTopFrac` was replaced by a literal `0.555 * height`
  during the Creator Format 2 work, so the stack landed across their mouth. A format value that a format
  file sets must be read; grep the token before trusting the JSON.

## Changing an approved title, and rendering when the disk is full

The retention title lives in `caption-plan.json` `hook.title`, but once captions are built it is
also page 0 of `captions.json` (`{"type":"title","lines":[[{"text":...}]],...}`). Change both by
hand and never re-run `build_captions.py`: the plan so the source of truth is right, the page so
the render changes. `titleTopFrac` lives in `format.json` AND in `captions.json` `style`, and
both have to move together or the render keeps the old position. Cross-check the `style.note`, which records the measured geometry, so the next
session does not re-derive from a stale number.

Rendering on a full volume (this machine sat at 267 MB free with a second session rendering):
`render_parts.mjs` is not enough, because every `node render.mjs` call rebuilds the bundle and
copies each project's master into it (three projects in `remotion/public/` = 530 MB per bundle).
The shape that finishes:

- a snapshot beside the real tree (`remotion-v8/`) with an EMPTY `public/`, so a bundle carries
  one project's master instead of three;
- `REMOTION_NO_CACHE=1` and a private `TMPDIR` under the session scratchpad, because another
  session's `render_parts.mjs` cleanup globs `react-motion-render*` and will delete a live one;
- bundle ONCE and loop the ranges in that process (`render_ranges.mjs`, the same shape as
  `stills.mjs`), so the 156 MB public copy is paid once rather than per part;
- small ranges. Remotion holds every frame of a range as a ~1 MB JPEG until it stitches, so
  56-frame chunks peak at ~56 MB instead of 450 MB. Concat with the demuxer, mux the master's
  audio back with `-c copy -shortest`.
