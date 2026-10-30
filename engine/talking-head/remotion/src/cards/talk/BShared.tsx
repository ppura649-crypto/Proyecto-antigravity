import React from "react";
import { INK, MUTED, LABEL_FONT } from "../theme";

// reference edit H family B (the guest, talk vs type): the PAPER cards.
//
// Their saved look: white paper, ink #14161F, and ONE saturated colour, their blue #8CBFFF, on the
// payload only. The reel runs the `creator-format-1` style, whose tokens are tuned for black cards, so
// `--ink` falls back to #f2f2f2 and would be invisible on white. Every famB card therefore sets
// the paper values on its own root and keeps reading them through the theme tokens (the
// ViewsLine.tsx precedent), so a future style change still reaches these cards.

export const BLUE = "#8CBFFF";
export const PAPER = "#FFFFFF";
export const PAPER_INK = "#14161F";
export const PAPER_MUTED = "#6E7583";
export const PAPER_RULE = "#D7DCE5";
export const PAPER_FIELD = "#EDF1F7";
export const BAR_GREY = "#A7AFBD";

/** the white sheet every famB card draws on; it also binds the paper values to the ink tokens */
export const BPaper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundColor: PAPER,
      ["--ink" as string]: PAPER_INK,
      ["--muted" as string]: PAPER_MUTED,
    } as React.CSSProperties}
  >
    {children}
  </div>
);

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
/** progress of a movement that starts at `ms` and lasts `dur` */
export const at = (tMs: number, ms: number, dur: number): number => clamp01((tMs - ms) / dur);
export const easeOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIO = (t: number): number => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** 0 at both ends: one soft pulse that never snaps back */
export const swell = (t: number): number => Math.sin(Math.PI * clamp01(t));

/**
 * A spring you can budget: a damped oscillation that is 0 at t=0 and settled at t=1, so the
 * hold after the last beat is a number and not a hope. `freq` sets the overshoot
 * (6.6 -> ~5 %, a bar; 7.6 -> ~13 %, a word landing).
 */
export const springy = (t: number, decay = 6.2, freq = 6.6): number => {
  const x = clamp01(t);
  if (x >= 1) return 1;
  return 1 - Math.exp(-decay * x) * Math.cos(freq * x);
};

/** how many characters of an n-character string have been typed by now */
export const typed = (tMs: number, ms: number, dur: number, n: number): number =>
  tMs <= ms ? 0 : Math.min(n, Math.ceil(clamp01((tMs - ms) / dur) * n));

/** a caret that blinks at ~1 Hz, phased from `since` */
export const blink = (tMs: number, since: number): number =>
  ((tMs - since) % 1000 < 540 ? 1 : 0);

export const sentence = (px: number, weight = 600, color: string = INK): React.CSSProperties => ({
  fontFamily: LABEL_FONT,
  fontSize: px,
  fontWeight: weight,
  letterSpacing: "0.002em",
  color,
  lineHeight: 1.16,
  whiteSpace: "nowrap",
});

export const heading = (px: number, color: string = INK, weight = 800): React.CSSProperties => ({
  fontFamily: LABEL_FONT,
  fontSize: px,
  fontWeight: weight,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
});

export { INK, MUTED };

/**
 * The mic: the object under `talk`. Drawn, not captured, so it carries the same ink and the
 * same stroke weight as the keyboard beside it (famA draws its own pair for V1; these are
 * famB's, built to the same weight so the rule reads as the same two ways in).
 */
export const BMic: React.FC<{ h: number; color?: string }> = ({ h, color = PAPER_INK }) => {
  const s = h / 58;
  return (
    <svg width={48 * s} height={58 * s} viewBox="0 0 48 58" style={{ display: "block" }}>
      <rect x={14} y={2} width={20} height={32} rx={10} style={{ fill: color }} />
      <path
        d="M7 25 Q24 49 41 25"
        style={{ fill: "none", stroke: color, strokeWidth: 4.4, strokeLinecap: "round" }}
      />
      <path
        d="M24 38 V51"
        style={{ fill: "none", stroke: color, strokeWidth: 4.4, strokeLinecap: "round" }}
      />
      <path
        d="M12 55 H36"
        style={{ fill: "none", stroke: color, strokeWidth: 4.4, strokeLinecap: "round" }}
      />
    </svg>
  );
};

/** The keyboard: the object under `type`. Same ink, same 3.6 stroke as the mic. */
export const BKeys: React.FC<{ w: number; color?: string }> = ({ w, color = PAPER_INK }) => {
  const s = w / 76;
  const key = (x: number, y: number, kw: number) => (
    <rect key={`${x}-${y}`} x={x} y={y} width={kw} height={6} rx={1.5} style={{ fill: color }} />
  );
  return (
    <svg width={76 * s} height={52 * s} viewBox="0 0 76 52" style={{ display: "block" }}>
      <rect
        x={2}
        y={4}
        width={72}
        height={44}
        rx={4}
        style={{ fill: "none", stroke: color, strokeWidth: 4.0 }}
      />
      {[10, 23, 36, 49, 60].map((x) => key(x, 13, x === 60 ? 6 : 8))}
      {[10, 23, 36, 49, 60].map((x) => key(x, 24, x === 60 ? 6 : 8))}
      {key(20, 35, 36)}
    </svg>
  );
};

/**
 * An arrow that draws itself left to right, the head arriving last. `p` 0 -> 1.
 * The shaft is one stroke so the drawing never flickers between segments.
 */
export const BArrow: React.FC<{ w: number; p: number; color?: string }> = ({ w, p, color = PAPER_INK }) => {
  const s = w / 100;
  const L = 74;
  const head = clamp01((p - 0.62) / 0.38);
  return (
    <svg width={100 * s} height={40 * s} viewBox="0 0 100 40" style={{ display: "block", overflow: "visible" }}>
      <path
        d="M4 20 H78"
        style={{
          fill: "none",
          stroke: color,
          strokeWidth: 5,
          strokeLinecap: "round",
          strokeDasharray: L,
          strokeDashoffset: L * (1 - easeOut(p)),
        }}
      />
      <path
        d="M66 8 L80 20 L66 32"
        style={{
          fill: "none",
          stroke: color,
          strokeWidth: 5,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          opacity: head,
          transform: `translateX(${(1 - head) * -10}px)`,
        }}
      />
    </svg>
  );
};
