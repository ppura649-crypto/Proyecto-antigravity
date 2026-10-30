import React from "react";
import { LABEL_FONT, MONO_FONT } from "../theme";

// reference edit H family A (talk vs type): the two GLYPHS that name the ways in (V1) and the THOUGHT
// CLOUD over a field that shows which of the two outruns the other (V7 typed, V9 spoken).
//
// Ink: this reel's format carries no `style`, so styleOf() returns `creator-format-1`, whose --ink token is
// WHITE (#f2f2f2, for black cards). Every card in reference edit H is the guest's WHITE paper and the two
// frameless objects sit on a cream wall, so the ink here is the contract's dark #14161F, declared
// once. LABEL_FONT and MONO_FONT still come from the theme (they resolve to the reel's Inter and
// the mono face). BLUE is the one saturated colour, and it only ever lands on the payload.
export const INK_A = "#14161F";
export const MUTED_A = "#6B7280";
export const RULE_A = "#C9CED8";
export const BLUE = "#8CBFFF";
export const PAPER = "#FFFFFF";

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
export const at = (tMs: number, ms: number, dur: number): number => clamp01((tMs - ms) / dur);
export const easeOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIO = (t: number): number => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** one soft swell, 0 at both ends: nothing ever snaps back */
export const swell = (t: number): number => Math.sin(Math.PI * clamp01(t));
/** a spring-ish landing with a little overshoot */
export const overshoot = (t: number): number => {
  const x = clamp01(t);
  const c1 = 1.7, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
/** smooth deterministic pseudo-noise in 0..1, for a live waveform */
export const noise = (i: number, t: number): number =>
  0.5 + 0.5 * Math.sin(i * 1.37 + t * 0.0091) * Math.cos(i * 0.53 - t * 0.0063);

export const sans = (px: number, color: string = INK_A, weight = 500): React.CSSProperties => ({
  fontFamily: LABEL_FONT, fontSize: px, fontWeight: weight, color, lineHeight: 1.3,
});
export const cap = (px: number, color: string = INK_A): React.CSSProperties => ({
  fontFamily: LABEL_FONT, fontSize: px, fontWeight: 700, color, lineHeight: 1,
  textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap",
});
export const mono = (px: number, color: string = INK_A): React.CSSProperties => ({
  fontFamily: MONO_FONT, fontSize: px, color, lineHeight: 1, whiteSpace: "pre",
});

// ---------------------------------------------------------------------------------------------
// The cloud. A real drawn cloud: a flat base and five circles, unioned. The union is done by
// drawing the same shapes TWICE, first filled-and-stroked and then filled only: the second pass
// paints over the inner half of every stroke, so what is left is the outer silhouette and nothing
// else. Design coordinates, meant to live inside a viewBox of 994 x <card height>.
// Silhouette: x 138..857, y 14..330.
export const CLOUD_BASE = { x: 161, y: 194, w: 660, h: 136, rx: 58 };
export const CLOUD_CIRCLES = [
  { cx: 206, cy: 218, r: 68 },
  { cx: 302, cy: 186, r: 104 },
  { cx: 477, cy: 146, r: 132 },
  { cx: 657, cy: 178, r: 108 },
  { cx: 777, cy: 214, r: 80 },
];

const cloudPass = (stroked: boolean, sw: number) => {
  const st: React.CSSProperties = stroked
    ? { fill: PAPER, stroke: INK_A, strokeWidth: sw, strokeLinejoin: "round" }
    : { fill: PAPER, stroke: "none" };
  return (
    <g>
      <rect
        x={CLOUD_BASE.x} y={CLOUD_BASE.y} width={CLOUD_BASE.w} height={CLOUD_BASE.h}
        rx={CLOUD_BASE.rx} style={st}
      />
      {CLOUD_CIRCLES.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={c.r} style={st} />
      ))}
    </g>
  );
};

/** the cloud silhouette. `sw` is doubled stroke: half of it is painted out by the fill pass. */
export const Cloud: React.FC<{ sw?: number }> = ({ sw = 10 }) => (
  <>
    {cloudPass(true, sw)}
    {cloudPass(false, sw)}
  </>
);

// Two puffs trailing off the cloud's lower-left shoulder, so it reads as a THOUGHT and never as a
// speech bubble (which matters: on V9 the cloud is the head and the field is the mouth). They go
// down-LEFT, clear of the field below, which starts at x 161.
export const CloudTails: React.FC<{ sw?: number }> = ({ sw = 10 }) => (
  <g style={{ fill: PAPER, stroke: INK_A, strokeWidth: sw }}>
    <circle cx={130} cy={300} r={20} />
    <circle cx={92} cy={338} r={12} />
  </g>
);
