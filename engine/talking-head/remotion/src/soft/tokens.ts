// Creator Format 2 palette, type roles and motion helpers, measured on ten reels
// (formats/creator-format-2-system.md, creator-format-2-visuals.md, refs/XAFZFjrlKhV/tokens.json, 2026-09-04).
// Every soft card reads from here. Her laws: one accent per reel, fades are linear and 2-5
// frames, pops are 3 frames from 0.85, type-on is 1 glyph per frame, nothing springs.
import type React from "react";

export const SOFT = {
  // the one accent: her macOS-blue / cyan family (folders, the heading underline, checks)
  accent: "#5cbfea",
  folderTop: "#8fd0ee",
  folderBottom: "#46afde",
  // the pastel set that lives inside her timeline bars, never outside an object
  pastel: ["#b3d7ea", "#f0b49b", "#cfc0f0", "#bfe3d3", "#eccf8f"],
  // light glass: her white@12 % sits on a light wall; their room is dark, so the same look
  // (a light frosted panel) needs more white to read light. Hairline and ink as measured.
  glass: "rgba(255,255,255,0.30)",
  glassLine: "rgba(255,255,255,0.55)",
  glassInk: "#242824",
  glassMuted: "rgba(36,40,36,0.62)",
  glassRule: "rgba(36,40,36,0.16)",
  glassChip: "rgba(255,255,255,0.34)",
  // dark glass (her chat window)
  dark: "rgba(24,28,30,0.58)",
  darkLine: "rgba(255,255,255,0.22)",
  bubbleRight: "#4d5557",
  bubbleLeft: "#626866",
  // off-white editorial card and its side panel
  offWhite: "#f0f7ef",
  panel: "#e1e7e5",
  cardInk: "#22261f",
  cardMuted: "#6b716a",
  cardRule: "rgba(34,38,31,0.22)",
  // the real-media frame
  frame: "#f3fbfd",
  white: "#ffffff",
  mark: "#edcf17", // her yellow highlight box on real content (XAP5 f587+)
  markFill: "rgba(237,207,23,0.45)", // her highlighter bar on real text (XARU f119+)
  shadow: "0 24px 60px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.16)",
  textShadow: "0px 2px 6px rgba(0,0,0,0.55)",
  // type roles
  grotesque: "Inter, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
  serif: "'Playfair Display', Georgia, 'Times New Roman', serif",
  rounded: "Nunito, 'SF Pro Rounded', 'Arial Rounded MT Bold', sans-serif",
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// frames elapsed since a moment
export const since = (tMs: number, atMs: number, fps: number) => ((tMs - atMs) / 1000) * fps;
// linear opacity fade in place over n frames (her 2-5 frame fades)
export const fade = (tMs: number, atMs: number, frames: number, fps: number) =>
  tMs < atMs ? 0 : clamp01(since(tMs, atMs, fps) / frames);
// 3-frame pop from a scale (her YouTube card)
export const pop = (tMs: number, atMs: number, fps: number, frames = 3, from = 0.85) =>
  from + (1 - from) * fade(tMs, atMs, frames, fps);
// type-on, 1 glyph per frame by default (1.5 for her chapter titles)
export const typed = (text: string, tMs: number, atMs: number, fps: number, gpf = 1) =>
  tMs < atMs ? "" : text.slice(0, Math.floor(since(tMs, atMs, fps) * gpf));
export const typing = (text: string, tMs: number, atMs: number, fps: number, gpf = 1) =>
  tMs >= atMs && typed(text, tMs, atMs, fps, gpf).length < text.length;

// tracked uppercase micro-label on every panel (semibold grotesque, +0.16 em)
export const microLabel = (px: number, color: string): React.CSSProperties => ({
  fontFamily: SOFT.grotesque,
  fontWeight: 600,
  fontSize: px,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color,
  whiteSpace: "nowrap",
});

export type Box = { x: number; y: number; w: number; h: number }; // fractions of W / H
export const px = (b: Box, W: number, H: number) => ({
  left: b.x * W,
  top: b.y * H,
  width: b.w * W,
  height: b.h * H,
});
