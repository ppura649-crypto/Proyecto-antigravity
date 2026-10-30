import React from "react";
import { LABEL_FONT, MONO_FONT } from "../theme";

// reference edit H family C: THE PROMPT BOX, the object that runs through the second half of the video.
// Short and dense at 24 s, rambled and crooked at 34 s, judged at 38 s, poured through the skill
// at 54 s. Everything here is drawn on WHITE paper, so the palette is the plan's paper palette.
//
// INK / MUTED are hardcoded on purpose: this reel's style id is `guest-flat`, which is not in
// src/styles.ts, so styleOf() falls back to `creator-format-1` and `--ink` is never set. theme.ts's INK
// would resolve to its Creator Format 1 fallback #f2f2f2 (near-white) and every word on these white cards
// would be invisible. The fonts DO resolve (--reel-font is set to Inter), so those come from theme.
export const INK = "#14161F";
export const MUTED = "#70747F";
export const RULE = "#D7DAE1";
export const PANEL = "#F3F4F7";
export const PAPER = "#FFFFFF";
export const BLUE = "#8CBFFF"; // the only saturated colour on the card, always on the payload
export const ADV = 0.602; // mono advance in em (SF Mono / Menlo), so type and rules line up exactly

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
export const at = (tMs: number, ms: number, dur: number): number => clamp01((tMs - ms) / dur);
export const easeOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIO = (t: number): number => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeBack = (t: number): number => {
  const x = clamp01(t);
  const c1 = 1.62, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
export const swell = (t: number): number => Math.sin(Math.PI * clamp01(t));
/** a caret at ~1 Hz: half a second lit, half a second out */
export const blink = (tMs: number, fromMs: number): number =>
  tMs < fromMs ? 0 : Math.floor((tMs - fromMs) / 500) % 2 === 0 ? 1 : 0;
/** deterministic per-row wobble, so "crooked" is the same crooked on every frame */
export const rnd = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const mono = (px: number, color: string = INK, weight = 400): React.CSSProperties => ({
  fontFamily: MONO_FONT, fontSize: px, fontWeight: weight, color, lineHeight: 1, whiteSpace: "pre",
});
export const lab = (px: number, color: string = INK): React.CSSProperties => ({
  fontFamily: LABEL_FONT, fontSize: px, fontWeight: 700, letterSpacing: "0.05em", color,
  textTransform: "uppercase", whiteSpace: "pre", lineHeight: 1,
});

/** the word counter: every digit rolls a full turn and lands on its number */
export const CCount: React.FC<{ n: number; p: number; px: number; color?: string }> = ({
  n, p, px, color = INK,
}) => {
  const digits = String(Math.max(0, Math.round(n))).split("").map(Number);
  const dh = px * 1.24;
  const cw = px * ADV;
  const e = easeOut(p);
  return (
    <div style={{ position: "relative", height: dh, width: cw * digits.length }}>
      {digits.map((d, i) => {
        const T = 10 + d; // one full turn, then the digit
        return (
          <div key={i} style={{ position: "absolute", left: i * cw, top: 0, width: cw, height: dh, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: -e * T * dh }}>
              {Array.from({ length: T + 1 }, (_, k) => (
                <div
                  key={k}
                  style={{
                    height: dh, display: "flex", alignItems: "center", justifyContent: "center",
                    ...mono(px, color),
                  }}
                >
                  {k % 10}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** the verdict badge: a blue disc that springs in and draws its check */
export const CCheck: React.FC<{ size: number; p: number }> = ({ size, p }) => {
  const s = 0.2 + 0.8 * easeBack(p);
  const draw = clamp01((p - 0.3) / 0.55);
  return (
    <svg
      width={size} height={size} viewBox="0 0 40 40"
      style={{ display: "block", transform: `scale(${s})`, transformOrigin: "50% 50%", opacity: clamp01(p * 4) }}
    >
      <circle cx="20" cy="20" r="19" style={{ fill: BLUE }} />
      <polyline
        points="11,20.5 17.4,27 29,14.6"
        style={{
          fill: "none", stroke: "#FFFFFF", strokeWidth: 4.4, strokeLinecap: "round", strokeLinejoin: "round",
          strokeDasharray: 32, strokeDashoffset: 32 * (1 - draw),
        }}
      />
    </svg>
  );
};

/** the transformation arrow: one shaft with a head, drawn left to right */
export const CArrow: React.FC<{ w: number; p: number; thick?: number }> = ({ w, p, thick = 5 }) => {
  const head = Math.round(w * 0.17);
  const h = head * 1.25;
  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: w * easeOut(p), height: h, overflow: "hidden" }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
          <rect x={0} y={h / 2 - thick / 2} width={w - head} height={thick} style={{ fill: INK }} />
          <polygon
            points={`${w - head},${h / 2 - head * 0.46} ${w},${h / 2} ${w - head},${h / 2 + head * 0.46}`}
            style={{ fill: INK }}
          />
        </svg>
      </div>
    </div>
  );
};
