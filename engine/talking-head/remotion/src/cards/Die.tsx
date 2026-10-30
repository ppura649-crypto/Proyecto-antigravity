import React from "react";
import { interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, BAR_GREY, CARD_BG, INK, label } from "./theme";

// V4, "Its first AI chip OPTIMIZED to RUN AI models." One drawn die on the black
// card with two arrows leaving it. The training branch is struck out and goes dead
// on the word `run`; the inference branch keeps pushing tokens off the edge of the
// card for as long as it is up, at a rate per second, because the point is that
// this chip only ever does one of the two things.
//
// The die itself is drawn ONCE here and imported by KernelSlot (V11), so the later
// card is visibly the SAME object changed, not a second chip.

export type DieData = { name: string; left: string; right: string };

export const DIE_N = 8;
export type DieSlotRect = { c0: number; r0: number; c1: number; r1: number };

// grid geometry every consumer needs: where the cells and the slot actually land
export const dieMetrics = (x: number, y: number, size: number) => {
  const inset = 0.105 * size;
  const cell = (size - 2 * inset) / DIE_N;
  return { inset, cell, gx: x + inset, gy: y + inset, pad: 0.052 * size };
};

// A die is a die: a square of silicon, a fine 8x8 grid of cells, bond pads down
// every edge. No icon, no rounded corners, no chrome.
export const DieGlyph: React.FC<{
  x: number; y: number; size: number;
  cellAlpha?: (i: number) => number;
  slot?: DieSlotRect; slotPulse?: number;
}> = ({ x, y, size, cellAlpha, slot, slotPulse = 0 }) => {
  const { cell, gx, gy, pad } = dieMetrics(x, y, size);
  const padT = 0.030 * size;
  const span = 0.84 * size;
  const step = span / 6;

  const pads: React.ReactElement[] = [];
  for (let i = 0; i < 7; i++) {
    const o = (size - span) / 2 + i * step;
    pads.push(<rect key={`t${i}`} x={x + o - padT / 2} y={y - pad} width={padT} height={pad} fill={INK} />);
    pads.push(<rect key={`b${i}`} x={x + o - padT / 2} y={y + size} width={padT} height={pad} fill={INK} />);
    pads.push(<rect key={`l${i}`} x={x - pad} y={y + o - padT / 2} width={pad} height={padT} fill={INK} />);
    pads.push(<rect key={`r${i}`} x={x + size} y={y + o - padT / 2} width={pad} height={padT} fill={INK} />);
  }

  const g = 0.13 * cell;
  const cells: React.ReactElement[] = [];
  for (let i = 0; i < DIE_N * DIE_N; i++) {
    const c = i % DIE_N;
    const r = Math.floor(i / DIE_N);
    if (slot && c >= slot.c0 && c <= slot.c1 && r >= slot.r0 && r <= slot.r1) continue;
    const a = cellAlpha ? cellAlpha(i) : 0;
    cells.push(
      <rect
        key={i}
        x={gx + c * cell + g} y={gy + r * cell + g}
        width={cell - 2 * g} height={cell - 2 * g}
        fill={a > 0 ? ACCENT : "none"} fillOpacity={a}
        stroke={BAR_GREY} strokeWidth={0.010 * size}
      />
    );
  }

  return (
    <g>
      <rect x={x} y={y} width={size} height={size} fill={CARD_BG} stroke={INK} strokeWidth={0.022 * size} />
      {pads}
      {cells}
      {slot && (
        <rect
          x={gx + slot.c0 * cell + g} y={gy + slot.r0 * cell + g}
          width={(slot.c1 - slot.c0 + 1) * cell - 2 * g}
          height={(slot.r1 - slot.r0 + 1) * cell - 2 * g}
          fill="none" stroke={INK}
          strokeWidth={(0.012 + 0.006 * slotPulse) * size}
          strokeDasharray={`${0.052 * size} ${0.034 * size}`}
          strokeOpacity={0.62 + 0.38 * slotPulse}
        />
      )}
    </g>
  );
};

const EMIT_MS = 45;     // one token every 45 ms: a rate, not a fraction of the event
const TRANSIT_MS = 400; // and it crosses the card in 400 ms whatever the card lasts

// the die block sits a hair low so the PAIR OF ARROWS, and not the die alone, lands
// on the middle of the card: the two branches are what this card is about
export const dieLayout = (w: number, h: number) => {
  const P = 0.045 * w;
  const fs = 0.042 * w;
  const nameFs = 0.034 * w;
  const S = 0.325 * w;
  const padOut = 0.052 * S;
  const gap = 0.030 * h;
  const blockH = S + 2 * padOut + gap + nameFs * 1.18;
  const dieX = P + padOut;
  const dieY = P + (h - 2 * P - blockH) / 2 + 0.018 * h + padOut;
  const padY = (i: number) => dieY + 0.08 * S + i * ((0.84 * S) / 6);
  return {
    P, fs, nameFs, S, dieX, dieY,
    nameTop: dieY + S + padOut + gap,
    ax0: dieX + S + padOut + 0.026 * w,
    ax1: w - P,
    trainY: padY(1), runY: padY(5),
  };
};

const tokensAt = (tMs: number, from: number, x0: number, span: number) => {
  const out: { x: number; o: number }[] = [];
  if (tMs < from) return out;
  const kMax = Math.floor((tMs - from) / EMIT_MS);
  for (let k = Math.max(0, Math.ceil((tMs - from - TRANSIT_MS) / EMIT_MS)); k <= kMax; k++) {
    const p = (tMs - from - k * EMIT_MS) / TRANSIT_MS;
    if (p < 0 || p > 1) continue;
    out.push({ x: x0 + p * span, o: Math.max(0, Math.min(1, p / 0.05, (1 - p) / 0.12)) });
  }
  return out;
};

// the branch that dies: the word keeps its own ink until the bar crosses it, then
// steps back to grey while the strike stays bright, so "crossed out" is what reads
const StruckWord: React.FC<{
  left: number; top: number; fs: number; w: number;
  text: string; dead: number; strike: number; opacity: number;
}> = ({ left, top, fs, w, text, dead, strike, opacity }) => (
  <div style={{ position: "absolute", left, top, opacity }}>
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={{ ...label(fs, INK), lineHeight: 1, whiteSpace: "nowrap", opacity: 1 - 0.60 * dead }}>
        {text}
      </div>
      {strike > 0 && (
        <div
          style={{
            position: "absolute", left: -0.012 * w, top: "50%",
            width: `calc(100% + ${0.024 * w}px)`, height: 0.0105 * w,
            backgroundColor: INK, transformOrigin: "left center",
            transform: `translateY(-50%) scaleX(${strike})`,
          }}
        />
      )}
    </div>
  </div>
);

export const Die: React.FC<CardProps & { data: DieData }> = ({
  tMs, w, h, fps, fromMs, beats, data,
}) => {
  const L = dieLayout(w, h);
  const ramp = (a: number, b: number) =>
    interpolate(tMs, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const arrowsAt = beats.arrows ?? fromMs;
  const strikeAt = beats.strike ?? arrowsAt + 780;
  const streamAt = beats.stream ?? strikeAt + 120;

  // both branches leave the die in one gesture, inside the card's own pop, so there
  // is never a frame with one arrow and an empty half
  const drawT = ramp(arrowsAt, arrowsAt + 200);
  const drawR = ramp(arrowsAt, arrowsAt + 240);
  const strikeP = ramp(strikeAt, strikeAt + 150);
  const dead = ramp(strikeAt + 60, strikeAt + 210);

  const ah = 0.026 * w;
  const tokSize = 0.016 * w;
  const toks = tokensAt(tMs, streamAt, L.ax0 + 0.016 * w, L.ax1 - L.ax0 - 0.016 * w);
  const headPop = Math.min(1, 2 * spring({
    frame: Math.max(0, ((tMs - arrowsAt - 190) / 1000) * fps), fps,
    config: { damping: 15, stiffness: 320, mass: 0.6 },
  }));

  const arrow = (y: number, prog: number, color: string, opacity: number) => (
    <g>
      <line
        x1={L.ax0} y1={y} x2={L.ax1 - ah * 0.8} y2={y}
        stroke={color} strokeWidth={0.0065 * w} strokeOpacity={opacity}
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog}
      />
      {prog > 0.9 && (
        <polygon
          points={`${L.ax1 - ah},${y - ah * 0.6} ${L.ax1 - ah},${y + ah * 0.6} ${L.ax1},${y}`}
          fill={color} fillOpacity={opacity * headPop}
        />
      )}
    </g>
  );

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <title>one chip die: the training branch struck out, the inference branch streaming tokens</title>
        <DieGlyph x={L.dieX} y={L.dieY} size={L.S} />
        {arrow(L.trainY, drawT, INK, 1 - 0.62 * dead)}
        {arrow(L.runY, drawR, ACCENT, 0.28)}
        {toks.map((t, i) => (
          <rect
            key={i} x={t.x - tokSize / 2} y={L.runY - tokSize / 2}
            width={tokSize} height={tokSize} fill={ACCENT} fillOpacity={t.o}
          />
        ))}
      </svg>

      {/* one word per branch, mirrored above and below their own lines */}
      <StruckWord
        left={L.ax0 + 0.012 * w} top={L.trainY - 0.024 * h - L.fs} fs={L.fs} w={w}
        text={data.left} dead={dead} strike={strikeP} opacity={Math.min(1, drawT * 3)}
      />
      <div
        style={{
          position: "absolute", left: L.ax0 + 0.012 * w, top: L.runY + 0.024 * h,
          ...label(L.fs, ACCENT), lineHeight: 1, whiteSpace: "nowrap",
          opacity: Math.min(1, drawR * 3),
        }}
      >
        {data.right}
      </div>

      <div
        style={{
          position: "absolute", left: L.dieX, top: L.nameTop, width: L.S,
          ...label(L.nameFs, INK), lineHeight: 1.18, whiteSpace: "nowrap",
        }}
      >
        {data.name}
      </div>
    </div>
  );
};
