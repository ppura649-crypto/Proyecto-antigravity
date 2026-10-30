# Creator Format 1 hook grammar (measured 2026-08-31)

Frame-by-frame on XACe1njJc8o (Kelly, current era), XAEEAFylJZc (Arduino, current era),
DXuQYPCjaF- (34M, old era). Full-res ink measurements at 1440x2560, normalized fractions.
Evidence: `scratchpad/th-creator-format-1/hooksheet_*.jpg`, `stack_t1.png`, `stack_t36.png`.

## Phase 1, the composed stack (first clause, ~0-1.5s)

- Words pop into a PRE-COMPOSED vertical layout at their spoken moment, hard cut,
  and PERSIST until the clause ends. Then the whole stack clears at once.
- Everything in the stack is ALL CAPS.
- Lines flow top to bottom in spoken order. 1-2 words per line. Two-word lines are
  spread wide apart (THE ... SAME / I ... KNOW), not tightly centered.
- Connector words: white, base size (80px @1080 font, cap ~57px).
- Primary payload noun: accent color, cap height 2.6-2.7x base (MATH 207px,
  NOTHING, HEDGE/FUNDS 199/188 @1440). Effectively fit-to-width ~60-70% of frame.
- Secondary payload: accent color, ~1.35x base (MIT PROFESSOR 103px, ABSOLUTELY).
- Vertical: stack top edge starts at y/H ~0.56-0.58, flows DOWN through the
  baseline zone, can reach y/H ~0.79. Line gaps tight: 22-45px @1440.

Kelly: THE SAME (white, y .578-.605) / MATH (yellow hero .614-.695) / AN (white
.705-.735) / MIT PROFESSOR (yellow 1.35x .752-.792). Builds word by word 0.1-1.2s,
clears at 1.3s when the next clause starts.

Arduino: I ... KNOW (white spread) / ABSOLUTELY (yellow 1.4x) / NOTHING (yellow
bigger) / ABOUT (white). Same build, same clear.

## Phase 2, word-by-word with punch-ins (after the stack)

- Standard mode resumes: one word, white, sentence case, baseline y/H 0.669.
- Payload nouns get SOLO heroes: accent ALL CAPS 2.2-2.7x on the same baseline,
  holding 0.5-1.0s (CASINOS).
- A hero can HOLD while the following small words accumulate BELOW it in lowercase
  white ("HEDGE FUNDS" + "every" -> "every single" -> "every single day."). The
  hero and its tail clear together. Tail sits just under the hero's bottom edge.
- If the mid-frame is occupied (object in hand, b-roll), the hero is planted in
  the TOP zone instead (~y/H 0.15: HARDWARE), mid-zone free for the object label.

## Also observed (assets lane, later)

- Object labeling: small white word + hand-drawn curved arrow pointing at the
  physical object (Arduino + arrow to the board in their hand).
- Overlay cards hard-cut into the top zone during the hook (archival photo at
  1.8s, 3 logo tiles at 2.8s in Kelly).
- Old era (34M reel) uses a yellow SCRIPT/italic face for emphasis words
  ("research paper") and mixed white bold/script in the stack. Current era is all
  Helvetica Neue Bold. Build current era only.

## Render rules for the preset

- Stack block: top at 0.56H, ALL CAPS, gaps ~26px @1080, s=1.0x white,
  m=1.45x accent, hero=fitText to ~64% width (cap ~210px @1080).
- Two-word small lines: spread across ~52% of frame width.
- heroTail block: hero baseline-locked at 0.669H, tail lines lowercase white
  base size right below, accumulate word by word, all clear together.
- Emphasis color: ours is terracotta #E07850 (Creator Format 1 uses #FBF770).
