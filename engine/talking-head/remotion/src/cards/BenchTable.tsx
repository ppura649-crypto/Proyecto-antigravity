import React from "react";
import { interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, MONO_FONT } from "./theme";

// V14 "if the average does not improve, or the bad results do not become less common". The white
// card holds a benchmark summary in the shape an eval tool prints it: mono, a thin dark top rule,
// a grey header (without / with / delta), three rows, numbers right-aligned in their columns,
// hairline rules between rows. Nothing is titled, named or attributed: the values are an
// illustration (visual-plan.md "The chart").
//   pop:    the whole printout stands complete.
//   sweep1: a terracotta band walks left to right across the `average` row and stays; its delta
//           flips to the accent as the band reaches it.
//   sweep2: the same across `worst run`. Then it holds.
// The greys here are the figure greys of the Mpl cards, not theme MUTED: MUTED is the near-white
// of a black card and would be invisible on this one.
export type BenchTableData = { cols: string[]; rows: { label: string; a: string; b: string; d: string }[] };

const INK_D = "#161616";
const HEAD = "#7f7f7f";
const RULE = "#d9d9d9";
const SWEEP_MS = 300;

// one printed row: the band that swept it, its label, and the three right-aligned values
const Row: React.FC<{
  row: BenchTableData["rows"][number]; y: number; rowH: number; fs: number;
  textL: number; band: number; flip: number; colX: number[]; tableL: number; tableW: number;
}> = ({ row, y, rowH, fs, textL, band, flip, colX, tableL, tableW }) => (
  <g>
    {band > 0 && (
      <rect x={tableL} y={y} width={tableW * band} height={rowH} style={{ fill: ACCENT }} opacity={0.22} />
    )}
    <text x={textL} y={y + rowH / 2 + fs * 0.36} fontSize={fs} fill={INK_D}>{row.label}</text>
    <text x={colX[0]} y={y + rowH / 2 + fs * 0.36} textAnchor="end" fontSize={fs} fill={INK_D}>{row.a}</text>
    <text x={colX[1]} y={y + rowH / 2 + fs * 0.36} textAnchor="end" fontSize={fs} fill={INK_D}>{row.b}</text>
    <text x={colX[2]} y={y + rowH / 2 + fs * 0.36} textAnchor="end" fontSize={fs}
      fontWeight={flip > 0.5 ? 700 : 400} style={flip > 0 ? { fill: ACCENT } : { fill: INK_D }}
      transform={flip > 0 ? `translate(0 ${(1 - Math.min(1, flip)) * fs * 0.3})` : undefined}>{row.d}</text>
  </g>
);

export const BenchTable: React.FC<CardProps & { data: BenchTableData }> = ({ tMs, w, h, fps, beats, data }) => {
  const fs = 0.038 * w;
  const fsHead = 0.027 * w;
  const tableL = 0.042 * w;
  const textL = tableL + 0.019 * w;
  const labelW = 0.262 * w;
  const rowH = 0.17 * h;
  const headH = 0.115 * h;
  const total = headH + rowH * data.rows.length;
  const top = (h - total) / 2;
  const colW = (w - 2 * textL - labelW) / data.cols.length;
  const colX = data.cols.map((_, i) => textL + labelW + (i + 1) * colW);
  const tableW = w - 2 * tableL;

  const at = [beats.sweep1, beats.sweep2];
  const band = (i: number) => (Number.isFinite(at[i])
    ? interpolate(tMs, [at[i], at[i] + SWEEP_MS], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0);
  // the delta flips as the band arrives on it, a beat after the sweep starts
  const flip = (i: number) => (Number.isFinite(at[i]) && tMs >= at[i] + SWEEP_MS * 0.8
    ? spring({ frame: ((tMs - at[i] - SWEEP_MS * 0.8) / 1000) * fps, fps, config: { damping: 14, stiffness: 330, mass: 0.7 } })
    : 0);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: MONO_FONT }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }} fontFamily={MONO_FONT}>
        <rect x={tableL} y={top} width={tableW} height={2.4} fill={INK_D} />
        {data.cols.map((c, i) => (
          <text key={c} x={colX[i]} y={top + headH / 2 + fsHead * 0.36 + 4} textAnchor="end"
            fontSize={fsHead} fill={HEAD}>{c}</text>
        ))}
        {data.rows.map((row, i) => (
          <Row key={row.label} row={row} y={top + headH + i * rowH} rowH={rowH} fs={fs} textL={textL}
            band={band(i)} flip={flip(i)} colX={colX} tableL={tableL} tableW={tableW} />
        ))}
        {/* the rules print over the highlight, the way a ruled table stays ruled */}
        {data.rows.map((row, i) => (
          <rect key={`r${row.label}`} x={tableL} y={top + headH + i * rowH} width={tableW} height={1.4} fill={RULE} />
        ))}
      </svg>
    </div>
  );
};
