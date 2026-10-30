// Shared look for the designed (animated) cards. Creator Format 1 black-card language by default.
// Text on black is WHITE (the creator 2026-09-01: grey text on black is unreadable).
//
// Every token is a CSS variable with the Creator Format 1 value as fallback. CaptionReel sets the
// variables from the format's `style` (see styles.ts), so a new look never edits a card:
// it only sets tokens. Never inline these colours as hex in a card.
export const CARD_BG = "var(--card-bg, #08080a)";
export const INK = "var(--ink, #f2f2f2)";
export const MUTED = "var(--muted, #c9cfd8)";
export const BAR_GREY = "var(--bar-grey, #4e545c)";
export const ACCENT = "var(--accent, #e07850)";
// --block-bg: a lit sub-block inside a card (Transform), near-black on Creator Format 1, lighter glass on Creator Format 2
// The reel's own typography follows the format's caption font (CaptionReel sets --reel-font),
// so one font change reaches captions, CTA, names and every card label at once (the creator
// 2026-09-03: "when I want a change in font, it should affect all font"). A style may set
// --label-font to give its cards their own face. Mono, the chart figure font and the
// document serif imitate real artifacts and stay as they are.
export const LABEL_FONT = "var(--label-font, var(--reel-font, Michroma, Helvetica, Arial, sans-serif))";
export const MONO_FONT = "'SF Mono', Menlo, Monaco, 'Courier New', monospace";

export const label = (px: number, color: string = INK): React.CSSProperties => ({
  fontFamily: LABEL_FONT,
  fontSize: px,
  letterSpacing: "var(--label-tracking, 0.09em)",
  color,
  textTransform: "uppercase" as const,
});

import type React from "react";
