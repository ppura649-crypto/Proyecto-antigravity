# Creator Format 2 system: screen, captions, footage states, motion laws (measured, 10 reels, 2026-09-04)

Source reels, every frame (30 fps, native 1080x1920 except XAMz 1440x2560), per-reel measured
docs in `library/styles/refs/<code>/analysis.md` + `tokens.json`, method in
`library/styles/PROTOCOL.md`:

| code | date | s | what it is |
|---|---|---|---|
| XAFZFjrlKhV | 09-02 | 40 | "I turned my fav editing styles into Skills": 13 drawn cards over blur, the reel the creator linked |
| XAGAbYevcj3 | 08-31 | 74 | "Fact or Hype?": one screen recording + one webcam take in a fixed top/bottom split |
| XAH7hjV8jNK | 08-29 | 33 | "How to fix your AI images": Canva tutorial, posters slide in, real touchscreen close-ups |
| XAIhvUjGMli | 08-28 | 51 | "POV: I let ChatGPT plan and create an entire video": filmed laptop playing its own cards |
| XAJmclaH2mB | 08-25 | 31 | "I turned this editing style into an AI Skill": chat cards, folders, typographic keyword demo |
| XAKrKg9wlDV | 08-23 | 94 | live editing session: HyperFrames, Finder, ChatGPT desktop, an agent app, QuickTime |
| XAL1f5Mu6fh | 08-22 | 57 | "Steal my 9 AI setup questions": one take, a persistent 3x3 grid overlay (the output of XAKr's process) |
| XAMz9uzf5Ut | 08-15 | 47 | "POV: your editor ghosting": 5 real locations, story captions, no drawn UI |
| XANQx6RZT9O | 08-13 | 48 | "AI could make electricity cheaper": dark badge cards, one lime accent |
| XAOUToQkhLA | 08-13 | 63 | "How to Set Up AI Project Correctly": serif title with a lime word, dark cards, a real file-tree scroll, a circle that tears in two |

Hook grammar detail lives in `creator-format-2-hook.md`, the card families and their animations in
`creator-format-2-visuals.md`. This file is the whole system.

## Two production modes, one grammar

She does not have one look. She has one grammar (title on top for the first sentence, phrase
captions, hard cuts, one accent per reel) and two ways of filling the frame:

1. **Drawn-card mode** (5 of 10): XAFZ, XAJm, XANQ, XAL1, XAOU. Generic-but-plausible UI drawn
   over her talking head: glass panels, chat cards, badge pills, a grid, dark serif cards. One
   object every 2.4-3.1 s (XANQ 5.9 s, XAOU ~10 s with long real-screen holds inside), entering
   within 0-0.25 s of its word. This is the mode the agent-made reels use (XAL1 is literally the
   file the agent delivers on screen in XAKr).
2. **Real-screen mode** (5 of 10): XAKr, XAGA, XAIh, XAMz, XAH7. She films or records real
   screens (a MacBook with bezel and reflections, ChatGPT desktop, Finder, Canva, a printed
   page) and cuts hard between them; the only drawn things are the hook title and the captions.
   One beat every 6.7-8.2 s, holds of 10-35 s on one screen while she talks.

Whichever mode, nothing is decorative: every object is the thing the sentence is about, and
it arrives on that sentence.

## The screen

- **Title zone**: the gap above her head. Title top edge y 0.153-0.264H across the nine reels
  (median 0.23H), bottom edge 0.23-0.34H. She frames herself with her head top at ~0.35H so
  this gap exists. Never at the very top of the screen, never over her face.
- **Card zone**: y 0.12-0.62H. Glass panels 0.11-0.89W (0.78W), full-width cards 0.08-0.92W
  (0.84W), tall app/clip cards 0.20-0.80W. Bottom edges 0.36-0.62H, one tall card reaches
  0.74H. Cards never cover the captions.
- **Caption zone**: fixed at y 0.71-0.78H when the shot is her fixed desk take (XAFZ 0.712,
  XANQ 0.723, XAL1 0.727, XAJm 0.748, XAIh 0.759); chin-anchored per shot in the multi-shot
  reels (XAGA 0.45-0.66H, XAMz 0.40-0.74H); relocated to the empty zone when the centre is
  busy (XAJm moves them top-left at x 0.11, y 0.18-0.28H for the keyword demo).
- **Split**: two reels stack her (top ~45-50 %) over a cropped real app window (bottom), a hard
  crop with the app's own title bar as the seam (XAKr events 5/7, XAGA f180-1565). No PIP
  bubble, no rounded inset.

## Caption grammar (body)

- Page = a phrase of 2-5 words (XAFZ 2-4, XAIh 2-5, XAL1 2-5, XANQ 3-7, XAGA 1-3), verbatim,
  sentence case, no terminal punctuation on fragments, commas kept mid-sentence. Never one
  word per page (Creator Format 1's grammar), never karaoke highlight.
- Hard cut on the first word's onset (XAFZ "to" 0.96 s -> page f29 0.97 s; XAIh "When" 20.10 s
  -> f605 20.17 s). Zero animation in 8 of 9; XAL1 alone fades the words in with a 2-3 frame
  stagger inside the page, then the page holds and the next page cuts.
- Type: bold grotesque sans (Inter / SF Pro Bold-like) in 6 reels, the rounded family at 38 px
  in XAKr, the CapCut-style outline preset in XAGA and XAMz. Cap height 32-44 px at 1080
  (XAFZ 35, XAIh 32, XAGA 37-43, XANQ 37, XAKr 38, XAL1 44). White. Soft dark shadow and no
  box in 6; a near-opaque black rounded box in XAKr and XANQ; thick black outline stroke in
  XAGA and XAMz.
- Captions stay sharp and in place when the footage blurs or a card sits above them.
- The reel ends on captions only for ~1.5 s in XAFZ ("comment skill and I'll / send it to
  you"); XAGA just stops mid-word; XAMz ends on an uncaptioned reaction beat. There is no
  standard CTA layer.

## Footage states

- **Clear**: the default in every reel. Wall #93-9a grey-green, her in focus.
- **Whole-frame blur**: XAFZ only. Gaussian sigma 12 px at 1080 wide, brightness x0.75,
  fitted on f53/f54 and f597/f598; a hard one-frame switch both ways, chosen per object (proof
  cards blur, timeline / labels / install window sit on clear footage).
- **Local blur**: XAFZ's chat panel only, a backdrop-filter under the panel, the rest sharp.
- **Real optics**: XAKr, XANQ, XAH7 have shallow depth of field from the camera, never a
  digital pass. XAKr event 10 is a real rack focus.
- **Black**: XANQ's document takeover on solid black for 7.2 s, her face cut away, not blurred.

So "she blurs" is true of exactly one reel. The other eight get depth from real screens,
real optics, or nothing.

## Motion laws (every move seen, frames at 30 fps)

| move | frames | where |
|---|---|---|
| hard cut | 1 | every scene change, every card swap, every caption page, every blur switch, most exits, in all 9 reels |
| opacity fade in place | 3-5 (XAFZ, XAJm, XAIh, XAKr), 6 (XAGA), 8 (XANQ) | panels, cards, words inside cards |
| sibling stagger | every 2-4 frames | folders, timeline bars, grid pills, collage pieces, checklist rows |
| pop (scale 0.85-0.9 -> 1 + fade) | 3 | YouTube card, grid return, keyword pops |
| grow + fade | 6-18 | XAJm keywords, XAIh Codex card (8-9), XANQ document (7-8) |
| morph (crossfade + scale between two objects) | 7 | XAFZ timeline -> SKILL file, once |
| tear-split morph (crack, fill flip, halves separate, labels fade) | 17 | XAOU "Thinking + doing" -> "Thinking" / "Doing", once, enacting the verb |
| sequential chain (each piece waits for the last: text, icon, arrow grows, text) | ~5 each | XAOU Orchestration -> Execution |
| type-on with cursor | 1 glyph/frame (1.5 for the chapter title) | XAFZ chapter title, collage tag, chat bubbles; XAJm prompt bar; XAKr live dictation |
| line draws itself | 26 (connector), 4-5 (underline wipe) | XANQ connectors, XAL1 heading underlines |
| slide from the right edge | 5-8 | XAH7 posters only |
| flash-wipe (recede to white, blank, panel wipes in) | 2-3 + 1-2 + 3-4 | XAIh inner cards, inside the laptop's own video |
| fade + shrink out | 3 | XAFZ YouTube card |
| linear travel | 40+ | XAFZ playhead |
| real motion | continuous | fingers on glass, native app-open animations, scrolls, rack focus, whip-pans |

Never seen in 9 reels: spring/overshoot, a card sliding in from off-screen (XAH7's posters are
the one exception), wipes between scenes, camera moves added in post, letter-by-letter on the
hook title. The cut itself is never animated; the animation budget goes to what happens
inside a card after it has cut in.

## Type roles

| role | face (evidence) | size @1080 | case | treatment |
|---|---|---|---|---|
| hook title | rounded bold geometric sans (Nunito / Poppins / SF Pro Rounded Bold-like: rounded terminals, circular o) in 6; outline preset in 2; high-contrast serif in a dark box in 1 (XANQ) | cap 39-61 px (XANQ 68-92) | sentence, emoji allowed | white + soft shadow, or white + ~8 px black outline |
| captions | grotesque bold (Inter / SF Pro) | cap 32-44 px | sentence | white + shadow / box / outline, see above |
| glass and card labels | same grotesque, semibold, tracked +0.12-0.2 em | cap 20-24 px | UPPER | charcoal on light, white on dark |
| chapter / editorial headline | high-contrast serif with true italic (Playfair-like) | cap 58-70 px | title | charcoal or black |
| app wordmarks inside cards | italic serif (Instrument Serif-like) | ~80 px | lower | black |
| collage | typewriter mono + black brush marker + blue brush | 20 / 60 px | UPPER / title | on cream |
| badge pills (XANQ) | bold sans headline + regular grey subtext | 24-28 / 14-16 px | sentence | white on near-black |
| keyword pops (XAJm) | heavy grotesque, cycling hue or gradient | 70-100 px | lower / UPPER | mint->cyan, magenta->peach, bronze->gold |
| real UI | the app's own system fonts | native | native | native |

## Colour

- The world is her wall (#93-a4 grey-green), black or lime top, turquoise nails; saturated
  colour lives only inside the object and in ONE accent per reel:
  lime #c9ff35 (XANQ, every icon/line/dash/note), lime #def753 + teal #55bca7 (XAL1 chips,
  underlines, CTA keyword), orange (XAIh keyword + emoji glow), cyan (XAH7 Canva), teal
  (XAGA's finished video), pastel set blue #b3d7ea / peach #f0b49b / lavender #cfc0f0 / mint
  #bfe3d3 / mustard #eccf8f (XAFZ timeline), bronze->gold gradient (XAJm SKILL).
- Surfaces: light glass = white at ~12 % over the blurred footage with a 1 px white hairline at
  ~50 % (XAFZ #abb5ad over #9da49d); off-white cards #eaf0ee / #f0f7ef / #f7f9f8; near-black
  pills #161d15-#1e231d (XANQ), #050709 caption box (XAKr); cream paper #e9dec0; royal blue
  #2d54bd, brick red ~#d9453a, ink #22221a (collage).
- She tells the agent the colours by pointing at real objects ("the colour of my shirt, the
  colour of my nails", XAKr dictation), and XAL1 comes out lime + teal.

## Rhythm

- Drawn-card reels: one object per 2.4-3.1 s (XANQ 5.9), holds 1.1-5.0 s, gaps 0.3-3.4 s,
  entry lag 0-250 ms after the word.
- Real-screen reels: one beat per 6.7-8.2 s, holds 4-35 s, the pacing happens inside the shot
  (her finger, the dictation text growing, the app doing its thing).
- Inside a card: one new element every 0.1-0.5 s in speech order, then a static hold.
- One object at a time; the only stacks are label-above-board (XAFZ) and title + grid (XAL1).
- Long clear stretches exist and are intentional: 3.4 s in XAFZ, the whole cold open in
  XAGA; XAL1 is the opposite, an overlay on screen for all 57 s.

## How the reels are actually made (seen on screen in XAKrKg9wlDV)

Raw take trimmed in HyperFrames (her own editor: dark timeline, "Smart suggestions", one-click
"Global edits"). Clip dropped into `Desktop > AIOS > projects > hyperframes > <project>`.
ChatGPT desktop opened ON that project folder (the folder is the context, the video is a file
in it). The brief is dictated, not typed: source, a style descriptor ("clean, translucent,
modern editorial"), colours by pointing at real objects, the literal hook string ("steal my 9
AI setup questions"), a repeatable pop-up spec ("clear number count and a short phrase"). She
checks "planning mode", reads the Plan (global guidelines: safe zones, subtitle placement; a
Q0-Q8 roadmap), corrects one thing by voice, sends it to an agent app that runs 16 min 11 s and
returns a change list + "1080x1920, 30 fps, H.264/AAC" + a download link, then reviews in
QuickTime. The reel XAL1f5Mu6fh is that output. So the repeatable object families in
`creator-format-2-visuals.md` are what an agent renders from a spoken spec, which is exactly what our
talking-head pipeline is: a caption plan + a visual plan rendered by Remotion. The difference is
only the families and the laws above.
