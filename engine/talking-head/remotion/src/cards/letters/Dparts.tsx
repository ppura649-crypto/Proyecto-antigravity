import React from "react";
import { interpolate, spring } from "remotion";
import type { CardProps } from "../props";
import { ACCENT, HALO_STROKE, INK, PAPER, clamp01, easeInOut, easeOut } from "./shared";

// edit-i-oneshot, family D part two: the frameless field that stands on the guest's cream wall.
// field (V18) is ten thousand marks, ten (V19) is the same field with the first ten lit and
// stepped out of the front row. deskclock (V17) is in Ddesk.tsx and shares sp/ramp/Ink from here.
// Ink lines carry their white halo. No word sits on the wall in either kind.

export const sp = (tMs: number, at: number, fps: number, c = { damping: 15, stiffness: 320, mass: 0.7 }): number =>
  spring({ frame: Math.max(0, ((tMs - at) / 1000) * fps), fps, config: c });

export const ramp = (tMs: number, a: number, b: number): number =>
  interpolate(tMs, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** an ink stroke with its white halo under it: the same geometry drawn twice (shared.tsx grammar) */
export const Ink: React.FC<{
  d: string; sw: number; op?: number; fill?: string; cap?: "butt" | "round"; dash?: string;
}> = ({ d, sw, op = 1, fill = "none", cap = "round", dash }) => (
  <>
    <path d={d} fill="none" strokeDasharray={dash} strokeLinecap={cap} strokeLinejoin="round" {...HALO_STROKE} strokeWidth={sw + 7} />
    <path d={d} fill={fill} strokeDasharray={dash} strokeLinecap={cap} strokeLinejoin="round" stroke={INK} strokeOpacity={op} strokeWidth={sw} />
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// the field: ONE <line> per row, dashed on the column pitch, so ten thousand marks
// are eighty elements. The reveal is a disc growing from the centre, which on any row
// is one contiguous range of columns, so a row stays one element the whole way.
// ─────────────────────────────────────────────────────────────────────────────

export type Box = { x: number; y: number; w: number; h: number };
// the field, and under it the strip the lit ten step out into (V19). The same box for both
// kinds, so the hand-over frame from field to ten is pixel-identical.
export const fieldBox = (w: number, h: number): Box => ({
  x: 0.030 * w, y: 0.045 * h, w: w - 0.060 * w, h: h - 0.045 * h - 0.245 * h,
});

export const FieldRows: React.FC<{
  box: Box; cols: number; rows: number; p: number; colour: string; skip?: { row: number; c0: number; c1: number };
}> = ({ box, cols, rows, p, colour, skip }) => {
  const cw = box.w / cols;
  const ch = box.h / rows;
  const mw = Math.max(2.4, cw * 0.55);
  const mh = Math.max(2.2, ch * 0.62);
  const R = p * Math.hypot(box.w / 2, box.h / 2) * 1.02;
  const centre = (cols - 1) / 2;
  const out: React.ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    const dy = (r - (rows - 1) / 2) * ch;
    const half = Math.sqrt(Math.max(0, R * R - dy * dy));
    if (half <= cw) continue;
    const c0 = Math.max(0, Math.ceil(centre - half / cw));
    const c1 = Math.min(cols - 1, Math.floor(centre + half / cw));
    if (c1 < c0) continue;
    const cy = box.y + (r + 0.5) * ch;
    const pairs: [number, number][] =
      skip && skip.row === r
        ? ([[c0, Math.min(c1, skip.c0 - 1)], [Math.max(c0, skip.c1 + 1), c1]] as [number, number][])
        : [[c0, c1]];
    for (const [a, b] of pairs) {
      if (b < a) continue;
      out.push(
        <line
          key={`${r}-${a}`} x1={box.x + a * cw} x2={box.x + (b + 1) * cw} y1={cy} y2={cy}
          stroke={colour} strokeWidth={mh} strokeDasharray={`${mw.toFixed(2)} ${(cw - mw).toFixed(2)}`} strokeLinecap="butt"
        />
      );
    }
  }
  return <>{out}</>;
};

const Outline: React.FC<{ box: Box; s: number; colour: string; haloW?: number }> = ({ box, s, colour, haloW = 12 }) => {
  const o = 9;
  const d = `M ${box.x - o} ${box.y - o} H ${box.x + box.w + o} V ${box.y + box.h + o} H ${box.x - o} Z`;
  return (
    <g opacity={Math.min(1, s * 1.8)} transform={`translate(${box.x + box.w / 2} ${box.y + box.h / 2}) scale(${0.92 + 0.08 * s}) translate(${-box.x - box.w / 2} ${-box.y - box.h / 2})`}>
      <path d={d} fill="none" {...HALO_STROKE} strokeWidth={haloW} />
      <path d={d} fill="none" stroke={colour} strokeWidth={4.5} />
    </g>
  );
};

// V18 "you're not trying to reach 10,000 people"
export type FieldData = { cols: number; rows: number };
export const Field: React.FC<CardProps & { data: FieldData }> = ({ tMs, w, h, fps, beats, data }) => {
  const box = fieldBox(w, h);
  const out = sp(tMs, beats.not, fps);
  const p = ramp(tMs, beats.reach, beats.people);
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <title>ten thousand marks filling from the centre out</title>
      <Outline box={box} s={out} colour={INK} />
      {p > 0 && <FieldRows box={box} cols={data.cols} rows={data.rows} p={p} colour={INK} />}
    </svg>
  );
};

// V19 "you're trying to get the first 10 to say yes to a call" (callback of V18, no re-pop)
export type TenData = { cols: number; rows: number; lit: number };
const LIT_EVERY = 80;
export const Ten: React.FC<CardProps & { data: TenData }> = ({ tMs, w, h, fps, beats, data }) => {
  const box = fieldBox(w, h);
  const cw = box.w / data.cols;
  const ch = box.h / data.rows;
  const mw = cw * 0.55;
  const mh = ch * 0.62;
  const n = data.lit;
  const row = data.rows - 1;
  const c0 = Math.round((data.cols - n) / 2);
  const c1 = c0 + n - 1;

  const dim = ramp(tMs, beats.youre, beats.youre + 340);
  const grey = `rgb(${Math.round(20 + 140 * dim)},${Math.round(22 + 140 * dim)},${Math.round(31 + 137 * dim)})`;
  const lifted = tMs >= beats.first;
  const cxMid = box.x + box.w / 2;
  const pitch = 0.062 * w;
  const yRest = box.y + (row + 0.5) * ch;
  const yLift = box.y + box.h + 0.135 * h;
  const G = 8.5;   // a mark is 4 px wide in the field; the ten have to read on a phone, so they
                   // step out of the front row and grow to about 35 px rather than the row's pitch

  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <title>the same field, dimmed, with the first ten lit</title>
      {/* the halo thins as the ink pales, so the dimmed field is not a white frame; at dim 0 it is
          still 12, which is what `field` draws on its last frame */}
      <Outline box={box} s={1} colour={grey} haloW={12 - 5 * dim} />
      <FieldRows box={box} cols={data.cols} rows={data.rows} p={1} colour={grey} skip={lifted ? { row, c0, c1 } : undefined} />
      {lifted &&
        Array.from({ length: n }, (_, i) => {
          const s = clamp01((tMs - (beats.first + i * LIT_EVERY)) / 260);
          if (s <= 0) return null;
          const e = easeOut(s);
          const g = 1 + (G - 1) * e;
          const xr = box.x + (c0 + i + 0.5) * cw;
          const xl = cxMid + (i - (n - 1) / 2) * pitch;
          const x = xr + (xl - xr) * e;
          const y = yRest + (yLift - yRest) * e;
          const bw = mw * g, bh = mh * g;
          const ok = clamp01((tMs - (beats.yes + i * 46)) / 240);
          return (
            <g key={i}>
              <rect x={x - bw / 2} y={y - bh / 2} width={bw} height={bh} style={{ fill: ACCENT }} />
              {ok > 0 && (
                <g opacity={Math.min(1, ok * 2)} transform={`translate(${x} ${y - bh * 0.5 - 24 - (1 - easeOut(ok)) * 10}) scale(1.3)`}>
                  <path d="M -8 -1 L -2.6 5 L 8.6 -8" fill="none" {...HALO_STROKE} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M -8 -1 L -2.6 5 L 8.6 -8" fill="none" stroke={INK} strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
            </g>
          );
        })}
      {tMs >= beats.call &&
        (() => {
          const s = sp(tMs, beats.call, fps);
          const x = cxMid + ((n - 1) / 2) * pitch + 0.090 * w;
          const d =
            "M -13 -14 C -18 -9 -18 -2 -12 6 C -5 15 3 18 9 14 L 14 9 L 6 1 L 0 5 C -3 3 -6 0 -8 -4 L -4 -10 L -12 -18 Z";
          return (
            <g transform={`translate(${x} ${yLift}) scale(${(0.7 + 0.3 * Math.min(1, s)) * 2.1}) rotate(8)`} opacity={Math.min(1, s * 2)}>
              <path d={d} fill="none" {...HALO_STROKE} strokeWidth={9} strokeLinejoin="round" />
              <path d={d} fill={INK} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            </g>
          );
        })()}
    </svg>
  );
};
