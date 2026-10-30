# The preference conversation

The objective is a useful description of the creator, not a completed form. Reuse what they
already answered in the folder's shared context. Offer two or three concrete directions at a
time and always name the house default. Ask follow-ups only when the answer affects a decision.
Keep it high level: what they need, what they want, and whether they have a reference.

## 1. Audience, purpose and references

Reuse `audience.for` and `audience.need` from `context/answers.json`. Ask only what is missing:
who the reels are for and what a viewer should understand, feel or do after one.

Then what they post about: the lane (the subject area a viewer would name) and their stance
(the side they take, for example "AI tools are worth learning, here is the real cost"). If
Instagram is connected, read their own recent posts first and propose from what they already
make. If it is not, say "you can connect it with /start" and continue.

Ask: "Is there a creator or a reel you would like to copy or learn from?" Ask **what** they like
in it: the caption, the colours, the voice, the pace of the words, the topics.

For a reference reel (a link or a file): look at it frame by frame and listen to it. Describe
in words its caption (font feel, size, colours, how words appear, the key-word treatment), its
ground (colour, texture, light or dark) and its voice (gender, pace, energy, accent). Then sort
it into three lists and say them plainly:

- Mappable now: the theme fields from the harness map, with proposed values.
- Needs an engine change: for example an underline marker, a font not loaded, a caption that
  types letter by letter. Say what it costs.
- The method, which stays ours: what the pictures are and how they move. A reference teaches a
  property; it does not replace the format.

Example: "A dark navy ground, a bold rounded font, key words in yellow with a soft box, a calm
male voice." Mappable: `grounds.dark.bg` `#0E1626`, a rounded face (needs `fonts.ts`, or keep
Figtree, which is close), `marker.color` `#F5C542` with `select`, an ElevenLabs audition of calm
male voices. The pictures stay Full Visual's.

## 2. Caption look and behaviour

Explain: the caption is one word per spoken word, the active word bold and full ink, said words
regular and grey, one key word per block marked. That grammar stays. Its expression is theirs.

| Choice | House default | Alternatives |
|---|---|---|
| Font | Figtree | Inter (already loaded); another Google font (an engine change in `fonts.ts`) |
| Size | 74 px, two lines at most | 66 to 82; bigger means more caption breaks |
| Active word colour | white on dark, near black on light | any colour that reads on both grounds |
| Said words grey | `#6B6B6B` on dark, `#8E8E8E` on light | lighter grey for softer contrast, darker for more |
| Key-word marker | `select` box in blue `#2E7AEA` with handles | `select` in their accent; `pill` (soft wash in the ink colour); `none` (bold only) |
| Caption slot | top (y 318), the bottom slot used per block when the stage needs the top | small moves inside the top band only |
| Caption motion | `measured` (eases, small drop, box drawn in beats) | `v1` (linear, the first build) |
| Lead | 80 ms before the syllable | 40 to 100 ms; earlier feels snappier |
| Emoji before words | used where a word earns one | none |

Show the choice on the look test rather than describing it twice. Real interfaces drawn under
the caption keep their own type and colour.

## 3. Background

| Choice | House default | Alternatives |
|---|---|---|
| Dark ground | `#101010` | near black with a hue (navy `#0E1626`, warm `#14110F`) |
| Light ground | `#FAFAFA` | paper `#F6F3EC`, cool `#F4F6F9` |
| Grid | on, very faint, 60 px | off (alpha 0); a coarser pitch |
| Dark or light | each scene picks for its content | a lean ("mostly dark") recorded for the plan |

Explain that the grid gives motion something to smear; with it off, fast moves look a little
harder. Grounds must keep the caption ink and grey readable; the stills check that.

## 4. Voice

Explain the difference: ElevenLabs gives exact word times, so the sync is tightest and the house
recipe (audio tags that follow the sentence, pauses cut to 0.2 s, the hook never cut) works.
OpenAI and Fish work too; their take is timed by speech recognition. Their own recorded voice
works the same way.

1. Provider. House default: ElevenLabs, the "Snap" library voice, `eleven_v3`, stability 0.5.
   If they choose another provider, they add the key on the video's page in their workspace
   (the Video step), or put it in `.env.local`. Never in chat.
2. Audition: two to four voices reading their first two sentences (their transcript, or the
   first two sentences of the example reel), saved as separate files. They pick by ear. Record
   the pick and what they liked about it.
3. Delivery: snappy and emotional by default; calmer, slower or more neutral are choices.

Never imply a voice they have not heard was approved. Naming a voice does not authorize cloning
a person.

## 5. Words

| Choice | House default | Alternative |
|---|---|---|
| Script | the house script method (`full-visual-script`): one side, five hooks scored, about 200 words, every fact sourced | their own transcript, taken as true and never rewritten |
| Closing ask | `comment "KEYWORD"` and the exact thing they send | follow, save, or none, tied to their real offer |
| Post caption | opens with `Comment "KEYWORD" and I'll send you ...` | their own opening, length, hashtags or none |
| Language | English | English only today: the aligner and the speech model are English |

Their transcript is their words: record it as a standing choice, then each reel takes the
transcript they give.

## 6. Research defaults

Read `.agents/skills/full-visual/references/04-research-lanes.md` and propose its lanes and
stance, or take theirs. Ask whether "choose for me" is allowed when they come without a topic.
Save lanes, stance, topics they never want, and creators they want to learn from.

## One read-back

Show: "Your reels are for ... The caption is ... in ... with ... key words. Scenes stand on ...
with the grid ... The voice is ... Words come from ... and end on ... Topics come from ...
Pictures and motion stay Full Visual's. I will ask you again only for ..." Point at the look
test and the picked audition clip. Ask whether to save it as their default. Allow corrections
before marking setup complete.

Each choice needs a short rationale another editor can apply. If the creator gave only the
choice, write "editorial interpretation" beside the proposed reason; do not claim they said it.
Unresolved taste can stay open without blocking settled colours and fonts.
