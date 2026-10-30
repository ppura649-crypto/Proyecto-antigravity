# Creator Format 1 system: hooks + captions + overlays (measured, 4 reels, 2026-08-31)

Source reels, frame-by-frame (10fps hooks, 2fps bodies, full-res measures):
- XAANKCeyGPA  "ML full guide" 77s, 720x1280
- XABuJlb1dsq  "Claude watermark" 51s, 1440x2560
- XACe1njJc8o  "Kelly Criterion" 41s, 1440x2560
- XAD1Veep4La  "OpenAI Student Collective" 33s, 1440x2560

Hook stack grammar detail lives in `creator-format-1-hook.md`. This file is the whole system.

## The 3-zone screen

Same physical layout in every reel:
1. **Overlay zone**: top band, y 0.03-0.33H, above their head. Empty by default.
2. **Face zone**: eyes ~0.25-0.40H. The creator frames themselves LOW to leave headroom.
3. **Caption zone**: y ~0.59-0.63H, at chin/mic/hand level. Captions never leave it
   (except stacks, which grow upward from it, and the CTA line).

## Caption grammar (body)

- Default page = **ONE word**, verbatim, sentence case, punctuation kept
  ("out.", "question:", "it?", "equally-good").
- Grouped pages: function-word clusters ("to get lost", "are four steps", "is to"),
  proper nouns ("Kelly Criterion", "MIT professor").
- Style: Helvetica-class bold, white, soft dark shadow, **cap height ~0.023H**
  (~60px at 1080x1920, SMALLER than our first attempt), centered, hard cuts,
  zero animation, never moves.
- Accumulation is rare and intentional: "so" -> "so much"; the punch question
  builds word by word into a 2-line page ("How much should you bet?") with the
  key words in yellow inline ("much", "bet?").
- One fancy word per reel max: yellow SERIF ITALIC, bigger, mid-sentence, while
  neighbor words stay small white ("information"). On the white full-screen card
  the fancy word is blue serif italic ("doing").
- Keyword caps+quotes, still white base size: "ROADMAP".
- Clause mode (news/announcement reel XAD1Veep4La only): 1-2 line clause pages,
  smaller (~0.016H cap), no word-by-word.
- Yellow = RGB(250,253,137) ≈ #FAFD89 everywhere (hero, inline, numerals, CTA keyword).

## Overlay grammar

Position: card floats in the top band, roughly x 0.06-0.94W, y 0.10-0.33H,
white rounded card w/ soft shadow when the artifact is light, dark card when the
artifact is dark. NEVER overlaps the caption. Logo chips sit lower (over the
mouth) only in the 720p reel.

Types observed:
1. **Article card**: real webpage screenshot on white rounded card. Alive: slow
   zoom, scroll, pan, paragraph highlighted with a warm tint when quoted.
2. **Paper figure card**: real diagram/table screenshot. Holds 3-5s.
3. **Terminal/code card**: dark window screenshot.
4. **Logo chip**: white rect + real brand wordmark, one chip per spoken tool
   name, swaps at word cadence (~0.5s): Jupyter, pandas, matplotlib, scikit,
   PyTorch, TensorFlow.
5. **Giant yellow numeral** for steps: same yellow, ~0.17H tall, marks each
   chapter (1, 2, 3, 4) while the creator says "step N".
6. **Animated math** (Kelly reel): formula card that (a) reveals variable
   legend, (b) pops colored arrow annotations one per beat, (c) substitutes
   numbers step by step with strikethrough, (d) resolves to green result,
   (e) animated chart whose lines DRAW over ~5s.
7. **Archival b/w photo**, swapped per noun (professor / blackjack / Vegas).
8. **Meme clip** for one beat (Kermit typing = "rewriting text").
9. **Custom flat cards** when no artifact exists ("Not detectable" vs
   "Detected" doc icons).
10. **UI mock cards** (announcement reel): real product card w/ button, bullet
    "What you'll receive" slide, requirement text with fake cursor + blue
    selection sweep, full-frame takeover slides.
11. **Full-white typographic card**: "learning by" + blue italic serif "doing".

Rhythm rules:
- The card enters ON the noun that names it, not before.
- Holds 2-5s, then leaves. A few seconds of NO overlay between cards.
- One card at a time (exception: photo + logo-tile row stacked once).
- Every image is a REAL artifact. Nothing invented except the flat cards (9/10),
  and those are obviously designed, not fake screenshots.

## CTA

Persistent line, separate layer from captions, final ~5s while word captions
keep flowing under it:
- `comment "watermark"` above the caption zone, keyword yellow in curly quotes.
- `comment "Kelly"` top-right corner, keyword yellow.
- `Comment "OpenAI"` top-center, big bold white (~0.037H cap).
Then swaps to `follow for more` / "So save this video and follow for more".

## Hook (summary, details in creator-format-1-hook.md)

Mode A (default, 3 of 4 reels): composed stack. Small white ALL-CAPS connectors
placed asymmetrically, ONE huge yellow ALL-CAPS payload (cap ~0.07H), tiny
white qualifier tail accumulating word-by-word below. Stack persists to clause
end, hard-clears, then word-by-word pages. Second stack allowed back to back
(CLAUDE / puts a secret watermark -> INTO EVERYTHING / it writes).
Mode B (news reel): clause pages + brand banner card pinned top from frame 0.
B-roll cut inside the hook (2.3s in XAANKCeyGPA) with captions continuing.
