import React from "react";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// reference edit J famA1: THE REAL CLAUDE CODE WINDOW, the stage for every moment the creator types.
//
// ONE window for all four cards (V3 the hook, V4 the harmless version, V9 the trust dialog,
// V10 the git pull) and for the hook-3 first object, so they read as the same session.
//
// A real terminal is resizable, so rather than squeezing remocn's 1100x620 into the 994x560
// card and pushing the camera into it (which leaves the mono at ~15 device px and crops words
// at the card edge), the window IS a small 620-wide terminal blown up to fill the card:
// stage = 994/620 = 1.60, so remocn's own 15 / 16 / 17 px mono land at 24 / 26 / 27 device px.
// Nothing is resized, nothing is cropped, the whole window is on screen, and the type reads on
// a phone. Same numbers on every card of the family, which is what makes it the same window.
export const MONO = loadMono().fontFamily;

export const WIN_W = 620; // window space; the card IS the window
export const BAR = 30;    // title bar
export const PAD = 12;    // body padding

// Claude Code's own palette (ClaudeCode.tsx / remocn), plus the one desaturated green the
// plan allows for the trusted / ok states.
export const T = {
  bar: "#3A3633",
  body: "#1B1A18",
  fg: "#E8E5DD",
  muted: "#8A857C",
  dim: "#6B6660",
  accent: "#D97757",
  green: "#5FBF86",
  sel: "#33302B",
  rule: "#4A4640",
};

export const CH = 0.6; // JetBrains Mono advance width, in em
export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
export const eOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);
export const eIO = (t: number): number =>
  clamp01(t) < 0.5 ? 4 * clamp01(t) ** 3 : 1 - Math.pow(-2 * clamp01(t) + 2, 3) / 2;
export const swell = (t: number): number => Math.sin(Math.PI * clamp01(t));
export const after = (tMs: number, at: number, dur: number): number => eOut((tMs - at) / dur);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const mono = (px: number, color: string, lh = 1.35): React.CSSProperties => ({
  fontFamily: MONO,
  fontSize: px,
  lineHeight: `${Math.round(px * lh)}px`,
  color,
  whiteSpace: "pre",
});

/* ------------------------------------------------------------------ glyphs */
// JetBrains Mono has no braille, no heavy chevron and no check mark, so every symbol the
// terminal shows is drawn: they scale with the window and never fall back to a stray face.

export const Check: React.FC<{ size: number; color: string; p?: number }> = ({ size, color, p = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }}>
    <title>ok</title>
    <path
      d="M4.6 12.6 L9.8 17.6 L19.4 7.0"
      fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray={23} strokeDashoffset={23 * (1 - clamp01(p))}
    />
  </svg>
);

export const Cross: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <title>failed</title>
    <path d="M5.5 5.5 L18.5 18.5 M18.5 5.5 L5.5 18.5" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
  </svg>
);

export const Chevron: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <title>selected</title>
    <path d="M8.5 5 L16 12 L8.5 19" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// the collapsed-disclosure triangle a hook's line carries in Claude Code
export const Tri: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <title>hook output</title>
    <path d="M9 5 L18 12 L9 19 Z" fill={color} />
  </svg>
);

export const Dot: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <title>running</title>
    <circle cx={12} cy={12} r={5.5} fill={color} />
  </svg>
);

// the arc a CLI spinner draws; it turns at a rate per second, never per card
export const Spinner: React.FC<{ size: number; color: string; tMs: number }> = ({ size, color, tMs }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", transform: `rotate(${(tMs / 900) * 360}deg)` }}>
    <title>working</title>
    <circle cx={12} cy={12} r={7.5} fill="none" stroke={color} strokeWidth={2.8} opacity={0.25} />
    <path d="M12 4.5 A7.5 7.5 0 0 1 19.5 12" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" />
  </svg>
);

// the Enter key that gets tapped on the trust dialog
export const KeyCap: React.FC<{ w: number; h: number; color: string; bg: string }> = ({ w, h, color, bg }) => (
  <div
    style={{
      width: w, height: h, borderRadius: 4, background: bg, border: `1px solid ${color}`,
      display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box",
    }}
  >
    <svg width={h * 0.62} height={h * 0.62} viewBox="0 0 24 24" style={{ display: "block" }}>
      <title>enter</title>
      <path d="M19 5 V12 A3 3 0 0 1 16 15 H6 M10 11 L6 15 L10 19" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// the Claude Code mascot, remocn's path, unchanged
export const Mascot: React.FC<{ size: number }> = ({ size }) => (
  <svg height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
    <title>Claude Code</title>
    <path
      clipRule="evenodd"
      d="M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z"
      fill={T.accent}
      fillRule="evenodd"
    />
  </svg>
);

/* ------------------------------------------------------------------ window */

export const A1Window: React.FC<{
  w: number;
  h: number;
  stamp?: number; // 0..1 the terracotta ✗ that lands on the title bar (hook 3)
  // a terminal is resizable: the hook-3 strip is the same window dragged short and wide, so
  // it can hang from the band ceiling and leave the hook title readable under it
  winW?: number;
  children: (body: { W: number; H: number }) => React.ReactNode;
}> = ({ w, h, stamp = 0, winW, children }) => {
  const WIN = winW ?? WIN_W;
  const stage = w / WIN;
  const H = h / stage; // the card's own aspect, expressed in window px
  const bodyW = WIN - 2 * PAD;
  const bodyH = H - BAR - 2 * PAD;
  const sp = clamp01(stamp);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: T.body }}>
      <div
        style={{
          position: "absolute", left: 0, top: 0, width: WIN, height: H,
          transform: `scale(${stage})`, transformOrigin: "top left",
        }}
      >
        <div style={{ height: BAR, background: T.bar, display: "flex", alignItems: "center", gap: 6, paddingLeft: 12, position: "relative" }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
          ))}
          {sp > 0 && (
            <div
              style={{
                position: "absolute", left: 0, right: 0, top: 0, height: BAR,
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: Math.min(1, sp * 2.4), transform: `scale(${lerp(2.4, 1, eOut(sp))})`,
              }}
            >
              <Cross size={23} color={T.accent} />
            </div>
          )}
        </div>
        <div style={{ position: "absolute", left: PAD, top: BAR + PAD, width: bodyW, height: bodyH }}>
          {children({ W: bodyW, H: bodyH })}
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------- the welcome box */
// remocn's dashed box, its two columns and its type scale, laid out for a 596 px body.

export const A1Welcome: React.FC<{
  w: number;
  cwd: string;
  box: number;   // 0..1 the frame and its version tag
  left: number;  // 0..1 the welcome column
  right: number; // 0..1 the what's-new column
  fade?: number; // the whole box, dim on purpose when it arrives late (V3)
}> = ({ w, cwd, box, left, right, fade = 1 }) => {
  const PX = 16;
  const lw = Math.round((w - 2 * PX - 2) * 0.42);
  return (
    <div
      style={{
        position: "relative", width: w, boxSizing: "border-box",
        border: `1px dashed ${T.accent}`, borderRadius: 5, padding: `18px ${PX}px 14px`,
        opacity: fade * clamp01(box * 1.7),
      }}
    >
      <span style={{ position: "absolute", top: -10, left: 18, padding: "0 8px", background: T.body, ...mono(15, T.accent), fontWeight: 700 }}>
        Claude Code v2.0.0
      </span>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div
          style={{
            width: lw, paddingRight: 16, boxSizing: "border-box", display: "flex", flexDirection: "column",
            alignItems: "flex-start", gap: 10,
            opacity: clamp01(left * 1.7), transform: `translateY(${(1 - eOut(left)) * 7}px)`,
          }}
        >
          <div style={mono(17, T.fg)}>Welcome back!</div>
          <div style={{ alignSelf: "center" }}><Mascot size={44} /></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={mono(15, T.muted)}>Opus 4.8 · Max 20x</div>
            <div style={mono(15, T.muted)}>{cwd}</div>
          </div>
        </div>
        <div
          style={{
            flex: 1, borderLeft: `1px dashed ${T.accent}`, paddingLeft: 16, boxSizing: "border-box",
            opacity: clamp01(right * 1.7), transform: `translateY(${(1 - eOut(right)) * 7}px)`,
          }}
        >
          <div style={{ ...mono(15, T.accent), fontWeight: 700, marginBottom: 8 }}>What's new</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={mono(15, T.fg)}>/agents to create subagents</div>
            <div style={mono(15, T.fg)}>/security-review for review agent</div>
            <div style={mono(15, T.fg)}>ctrl+b to background bashes</div>
            <div style={mono(15, T.dim)}>... /help for more</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------- the prompt line */

export const A1Prompt: React.FC<{
  sigil?: string;
  text: string;
  caret: boolean;
  tMs: number;
  px?: number;
}> = ({ sigil = "$ ", text, caret, tMs, px = 17 }) => {
  const on = Math.floor(tMs / 500) % 2 === 0;
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      <span style={mono(px, T.muted)}>{sigil}</span>
      <span style={mono(px, T.fg)}>{text}</span>
      <span
        style={{
          display: "inline-block", width: px * 0.6, height: px * 1.22, marginLeft: 1,
          background: T.fg, opacity: caret && on ? 0.6 : 0,
        }}
      />
    </div>
  );
};

/* -------------------------------------------------------- colour lerp */
// one string, one colour, moving: two stacked spans crossfading re-render the glyphs twice
// and shimmer at small sizes, so a dim line that lights up interpolates its colour instead.
const hx = (c: string): [number, number, number] => [
  parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16),
];
export const mix = (a: string, b: string, t: number): string => {
  const A = hx(a);
  const B = hx(b);
  const k = clamp01(t);
  return `rgb(${Math.round(lerp(A[0], B[0], k))},${Math.round(lerp(A[1], B[1], k))},${Math.round(lerp(A[2], B[2], k))})`;
};
