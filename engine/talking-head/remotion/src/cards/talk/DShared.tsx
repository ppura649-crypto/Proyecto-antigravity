import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { LABEL_FONT, MONO_FONT } from "../theme";

// reference edit H family D (the guest, talk vs type): the two-year rail (V3) and the skill folder (V15).
//
// INK: theme.ts `INK` is the Creator Format 1 token and resolves to WHITE (#f2f2f2), which is invisible on
// this reel's white paper cards and on its cream wall. So family D carries the format's DARK ink
// as a literal, exactly the way the other light-surface cards do (cards/Todo.tsx, cards/Chart.tsx).
// The FONTS still come from the theme, so a font change still reaches these cards.
export const DINK = "#14161F";
export const DMUTED = "#5A6270";
export const DBLUE = "#8CBFFF"; // their blue: the ONLY saturated colour on a card
export const PAPER = "#FFFFFF";
export const RULE = "#D9DDE4";
export const BAR = "#EFF1F5";

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
/** progress 0..1 of a movement that starts at `ms` and lasts `dur` */
export const at = (tMs: number, ms: number, dur: number): number => clamp01((tMs - ms) / dur);
export const easeOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);

/** a mark landing on its word: a spring with a real overshoot, from small and low */
export const popSpring = (tMs: number, ms: number, fps: number): number =>
  spring({
    frame: Math.max(0, ((tMs - ms) / 1000) * fps),
    fps,
    config: { damping: 11, stiffness: 210, mass: 0.9 },
  });

/** a line drawing itself / a bar sweeping: eased, never linear */
export const draw = (tMs: number, ms: number, dur: number): number =>
  interpolate(tMs, [ms, ms + dur], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** text typing itself, character by character, at a steady rate */
export const typed = (s: string, tMs: number, ms: number, perChar: number): string =>
  s.slice(0, Math.max(0, Math.min(s.length, Math.floor((tMs - ms) / perChar))));

/** a caret: solid while something is typing, ~1 Hz blink while it waits */
export const caretOn = (tMs: number, ms: number, typing: boolean): boolean =>
  typing ? true : Math.floor(Math.max(0, tMs - ms) / 500) % 2 === 0;

export const mono = (px: number, color: string = DINK): React.CSSProperties => ({
  fontFamily: MONO_FONT,
  fontSize: px,
  color,
  lineHeight: 1,
  whiteSpace: "pre",
});

export const cap = (px: number, color: string = DINK): React.CSSProperties => ({
  fontFamily: LABEL_FONT,
  fontWeight: 700,
  fontSize: px,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color,
  lineHeight: 1,
  whiteSpace: "nowrap",
});

// ---------------------------------------------------------------------------
// The macOS folder of cards/Skills.tsx, same geometry (viewBox 200 x 152, the same two paths),
// split into a BACK plate and a FRONT flap so a sheet can rise out from BETWEEN them, and
// recoloured into their blue so the card carries exactly one saturated hue (#8CBFFF).
export const FOLDER_R = 0.76; // height / width
export const FLAP_TOP = 54 / 152; // where the front flap starts, as a fraction of the height

export const DFolderBack: React.FC<{ w: number; uid: string }> = ({ w, uid }) => (
  <svg width={w} height={w * FOLDER_R} viewBox="0 0 200 152" style={{ display: "block" }}>
    <defs>
      <linearGradient id={`dfb${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9CC8FF" />
        <stop offset="1" stopColor="#6AA4EE" />
      </linearGradient>
    </defs>
    <path
      d="M4,30 a12,12 0 0 1 12,-12 h58 a8,8 0 0 1 5.6,2.3 l9,9 a8,8 0 0 0 5.6,2.3 h89.8 a12,12 0 0 1 12,12 v96 a12,12 0 0 1 -12,12 h-168 a12,12 0 0 1 -12,-12 z"
      fill={`url(#dfb${uid})`}
    />
  </svg>
);

export const DFolderFlap: React.FC<{ w: number; uid: string }> = ({ w, uid }) => {
  const h = w * FOLDER_R;
  const flapH = (1 - FLAP_TOP) * h;
  return (
    <svg
      width={w}
      height={flapH}
      viewBox={`0 54 200 ${152 - 54}`}
      style={{ display: "block", filter: "drop-shadow(0 -3px 8px rgba(20,22,31,0.16))" }}
    >
      <defs>
        <linearGradient id={`dff${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C3DDFF" />
          <stop offset="1" stopColor="#8CBFFF" />
        </linearGradient>
      </defs>
      <path
        d="M4,62 a7,7 0 0 1 7,-7 h178 a7,7 0 0 1 7,7 v78 a12,12 0 0 1 -12,12 h-168 a12,12 0 0 1 -12,-12 z"
        fill={`url(#dff${uid})`}
      />
      <path d="M11,55.6 h178 a7,7 0 0 1 6.9,6" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.6" />
    </svg>
  );
};
