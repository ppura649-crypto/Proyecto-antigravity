import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, INK, MONO_FONT, MUTED, label } from "./theme";
import { Head } from "./Head";

// "It does cost slightly more tokens, but the difference in outputs can be huge."
// A balance, because the sentence compares two unlike things. The cost lands
// first and barely moves the beam; the payoff lands on "huge" and tips it. Both
// numbers are real and the page they come from is named at the foot.
//
// Geometry is laid out from the CARD in, not from the beam out: the two value
// blocks own a fixed column each and the pans are placed under them, so nothing
// can run past an edge (the first version hung the blocks off the pan ends and
// both values were clipped).
export const Scale: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  left: { label: string; value: string; note: string };
  right: { label: string; value: string; note: string };
  source?: string; head: string;
  beats?: { right?: number; tip?: number };
}> = ({ tMs, w, h, fps, fromMs, left, right, source, head, beats = {} }) => {
  const pad = 0.05 * w;
  const at = { right: beats.right ?? fromMs + 1500, tip: beats.tip ?? fromMs + 2300 };
  const sp = (ms: number, d = 15) => spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: d, stiffness: 260, mass: 0.8 } });
  const l = sp(fromMs + 100);
  const r = sp(at.right);
  const tip = sp(at.tip, 13);

  const cx = w / 2;
  const colW = 0.40 * w;             // each side owns this much and never leaves it
  const armX = 0.255 * w;            // half the beam: the pans sit under the columns
  const armY = 0.30 * h;
  const pivotY = 0.56 * h;

  const deg = -1.5 * Math.min(1, l * 2) + 9.5 * Math.min(1, tip);
  const rad = (deg * Math.PI) / 180;
  const endL = { x: cx - armX * Math.cos(rad), y: armY + armX * Math.sin(rad) };
  const endR = { x: cx + armX * Math.cos(rad), y: armY - armX * Math.sin(rad) };
  const drop = 0.055 * h;

  const block = (d: { label: string; value: string; note: string }, x: number, panY: number, s: number, accent: boolean) => (
    <div style={{
      position: "absolute", left: x - colW / 2, top: panY + drop + 0.022 * h, width: colW,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 0.012 * h,
      opacity: Math.min(1, s * 2),
    }}>
      <div style={label(0.024 * w, accent ? ACCENT : MUTED)}>{d.label}</div>
      <div style={{
        fontFamily: MONO_FONT, fontWeight: 600, fontSize: (accent ? 0.086 : 0.072) * w, lineHeight: 1,
        color: accent ? ACCENT : INK, transform: `scale(${0.86 + 0.14 * s})`,
      }}>{d.value}</div>
      <div style={{ fontFamily: MONO_FONT, fontSize: 0.023 * w, color: MUTED, textAlign: "center", lineHeight: 1.3 }}>{d.note}</div>
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, padding: pad, boxSizing: "border-box" }}>
      <Head w={w} left={head} />
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <title>a small cost against a large payoff</title>
        <line x1={endL.x} y1={endL.y} x2={endR.x} y2={endR.y} stroke="rgba(255,255,255,0.55)" strokeWidth={2.2} />
        <line x1={endL.x} y1={endL.y} x2={endL.x} y2={endL.y + drop} stroke="rgba(255,255,255,0.30)" strokeWidth={1.4} />
        <line x1={endR.x} y1={endR.y} x2={endR.x} y2={endR.y + drop} stroke={ACCENT} strokeWidth={1.4} strokeOpacity={0.75} />
        <line x1={endL.x - 0.085 * w} y1={endL.y + drop} x2={endL.x + 0.085 * w} y2={endL.y + drop} stroke="rgba(255,255,255,0.55)" strokeWidth={2.6} />
        <line x1={endR.x - 0.085 * w} y1={endR.y + drop} x2={endR.x + 0.085 * w} y2={endR.y + drop} stroke={ACCENT} strokeWidth={2.6} />
        <line x1={cx} y1={armY} x2={cx} y2={pivotY} stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
        <path d={`M ${cx - 0.026 * w} ${pivotY} L ${cx} ${pivotY - 0.028 * h} L ${cx + 0.026 * w} ${pivotY} Z`} fill="rgba(255,255,255,0.35)" />
        <line x1={cx - 0.08 * w} y1={pivotY} x2={cx + 0.08 * w} y2={pivotY} stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
      </svg>
      {block(left, cx - armX, endL.y, l, false)}
      {block(right, cx + armX, endR.y, r, true)}
      {source && (
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0.03 * h, textAlign: "center",
          fontFamily: MONO_FONT, fontSize: 0.021 * w, color: "rgba(255,255,255,0.40)",
          opacity: interpolate(tMs, [at.right + 500, at.right + 900], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>{source}</div>
      )}
    </div>
  );
};
