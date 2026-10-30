import React from "react";
import { LABEL_FONT } from "../theme";

// edit-i-oneshot (the guest, guest-flat, cream wall, 2026-09-13). The one chip grammar every frameless card on
// this reel shares, so five builders draw the same words the same way. From reference edit D (their own reel):
// every word on the wall sits on a SOLID dark chip, white uppercase in the reel's font; the accent
// chip is the reel accent (terracotta by default) with white text; ink lines carry a faint white halo
// so they hold over the painting behind them.
// No outlines, no rounded corners, no drop shadow on chips (the plate is the contrast).

export const INK = "#14161F";                    // lines, glyphs, the dark chip
export const CHIP_DARK = "#14161F";
export const CHIP_TEXT = "#FFFFFF";
export const ACCENT = "var(--accent, #E07850)"; // the one accent, from format.accentColor (terracotta)
export const BLUE = ACCENT;                      // kept for the shared helpers below
export const ACCENT_TEXT = "#FFFFFF";            // white text on the accent chip
export const BLUE_TEXT = ACCENT_TEXT;
export const GHOST = "rgba(20,22,31,0.38)";      // ghost text (a thought not written yet)
export const PAPER = "#FEFEFE";                  // a real artifact's own ground
export const HALO = "0 0 2px rgba(255,255,255,0.9), 0 0 10px rgba(255,255,255,0.7)"; // behind INK strokes drawn as text
// an SVG stroke halo: draw the same path twice, first with these, then in INK
export const HALO_STROKE = { stroke: "#FFFFFF", strokeOpacity: 0.75 } as const;

export const chipFs = (w: number): number => Math.round(0.034 * w); // 32 device px on a 929 px card
export const chipFsBig = (w: number): number => Math.round(0.044 * w);

/** One word (or a short phrase) on a solid plate. `accent` = the accent chip, white text. */
export const Chip: React.FC<{
  text: string; accent?: boolean; fs: number; style?: React.CSSProperties; glyph?: React.ReactNode;
}> = ({ text, accent, fs, style, glyph }) => (
  <div
    style={{
      display: "inline-flex", alignItems: "center", gap: 0.5 * fs,
      padding: `${Math.round(0.42 * fs)}px ${Math.round(0.62 * fs)}px`,
      backgroundColor: accent ? BLUE : CHIP_DARK,
      color: accent ? BLUE_TEXT : CHIP_TEXT,
      fontFamily: LABEL_FONT, fontWeight: 700, fontSize: fs, lineHeight: 1,
      letterSpacing: "0.02em", textTransform: "uppercase", whiteSpace: "nowrap",
      borderRadius: 0, boxSizing: "border-box",
      ...style,
    }}
  >
    {glyph}
    <span>{text}</span>
  </div>
);

/** A chip that springs in from 0.85 scale with a slight overshoot (the pop every card on the reel uses). */
export const popScale = (spring01: number): string => `scale(${0.85 + 0.15 * spring01})`;

/** the pop of a chip landing: call with remotion's spring(frame since the beat). */
export const landStyle = (s: number): React.CSSProperties => ({
  opacity: Math.min(1, s * 1.6),
  transform: `scale(${0.85 + 0.15 * s})`,
  transformOrigin: "center",
});

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
export const easeOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOut = (t: number): number => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** mic glyph (for the TALK chip) drawn in the chip's own text colour */
export const MicGlyph: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <rect x="9" y="2" width="6" height="12" rx="3" fill={color} />
    <path d="M5 11a7 7 0 0 0 14 0" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="18" x2="12" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="22" x2="16" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** keyboard glyph (for the TYPE chip) */
export const KeyboardGlyph: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <rect x="2" y="6" width="20" height="12" rx="1.5" fill="none" stroke={color} strokeWidth="2" />
    {[5, 9, 13, 17].map((x) => <rect key={x} x={x} y="9" width="2" height="2" fill={color} />)}
    {[7, 11, 15].map((x) => <rect key={x} x={x} y="12.5" width="2" height="2" fill={color} />)}
    <rect x="7" y="15" width="10" height="1.6" fill={color} />
  </svg>
);
