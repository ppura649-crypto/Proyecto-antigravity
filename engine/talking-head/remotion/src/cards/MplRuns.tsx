import React from "react";
import { interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT } from "./theme";

// V12 / V13, ONE matplotlib-LOOKING strip plot seen twice (the Chart.tsx idiom: DejaVu, black
// spines, outward ticks, the default cycle, one series in the accent). Two categorical rows
// (with harness / without harness), ten dots each, x = score 40-100. No title, no legend, no
// source line: the values are an illustration (visual-plan.md "The chart").
//   stage best:    the figure stands complete on `pop`; the highest dot of each row is circled on
//                  `circle` (both read 95) and struck in the accent on `strike`.
//   stage compare: opens with the struck circles still there, so 41720 hands over on the frame;
//                  a dashed mean line drops per row on `mean` (90 / 67), the lowest dot of each
//                  row is circled on `worst` (83 / 49, the 49 in the accent), the quality bar
//                  lands at 85 on `bar`, and on `count` every dot at or past it turns green and
//                  an `n of 10` count lands at the right end of each row.
// Every number on screen is derived from data.rows: nothing is authored twice.
export type MplRunsData = { stage: "best" | "compare"; rows: { label: string; values: number[] }[]; bar: number; xLabel: string };

const FIG_FONT = "'DejaVu Sans', Verdana, sans-serif";
const TXT = "#1a1a1a";
const SPINE = "#333333";
const GREY = "#7f7f7f";
const GREY_TXT = "#5b5b5b";
const GRID = "#e6e6e6";
const GREEN = "#2E9E5B";
const X0 = 40;
const X1 = 100;
const TICKS = [40, 50, 60, 70, 80, 90, 100];
const TICK = 6;

const ramp = (t: number, at: number, ms: number) =>
  interpolate(t, [at, at + ms], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// a fixed pseudo-jitter per (row, index): equal-ish values never stack, and the figure is
// identical on every render (a strip plot's jitter, not noise added at runtime)
const jit = (r: number, i: number) => {
  const s = Math.sin(r * 37.13 + i * 91.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
};

type Pt = { v: number; x: number; y: number };

// the axes: dashed grid, all four spines, outward ticks with their numbers, the x label and the
// two row names on the left (matplotlib's categorical y tick labels)
const Axes: React.FC<{
  axL: number; axT: number; axW: number; axH: number; fsTick: number; fsLab: number;
  px: (v: number) => number; rowY: (i: number) => number; names: string[];
}> = ({ axL, axT, axW, axH, fsTick, fsLab, px, rowY, names }) => (
  <g>
    {TICKS.slice(1, -1).map((v) => (
      <line key={`g${v}`} x1={px(v)} y1={axT} x2={px(v)} y2={axT + axH} stroke={GRID} strokeWidth={1} strokeDasharray="4 5" />
    ))}
    <rect x={axL} y={axT} width={axW} height={axH} fill="none" stroke={SPINE} strokeWidth={1.6} />
    {TICKS.map((v) => (
      <g key={`t${v}`}>
        <line x1={px(v)} y1={axT + axH} x2={px(v)} y2={axT + axH + TICK} stroke={SPINE} strokeWidth={1.4} />
        <text x={px(v)} y={axT + axH + TICK + 6 + fsTick * 0.8} textAnchor="middle" fontSize={fsTick} fill={TXT}>{v}</text>
      </g>
    ))}
    {names.map((n, i) => (
      <g key={n}>
        <line x1={axL - TICK} y1={rowY(i)} x2={axL} y2={rowY(i)} stroke={SPINE} strokeWidth={1.4} />
        <text x={axL - TICK - 10} y={rowY(i) + fsLab * 0.36} textAnchor="end" fontSize={fsLab} fill={TXT}>{n}</text>
      </g>
    ))}
  </g>
);

// matplotlib's annotate() ring, drawn on its beat, with the accent strike through it
const Ring: React.FC<{ p: Pt; r: number; draw: number; strike: number; color: string }> = ({ p, r, draw, strike, color }) => {
  const c = 2 * Math.PI * r;
  const d = r * 0.78;
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={r} fill="none" stroke={color} strokeWidth={2.2}
        strokeDasharray={c} strokeDashoffset={c * (1 - draw)} transform={`rotate(-90 ${p.x} ${p.y})`} />
      {strike > 0 && (
        <g>
          <line x1={p.x - d} y1={p.y + d} x2={p.x - d + 2 * d * strike} y2={p.y + d - 2 * d * strike}
            stroke="#ffffff" strokeWidth={6.4} strokeLinecap="round" />
          <line x1={p.x - d} y1={p.y + d} x2={p.x - d + 2 * d * strike} y2={p.y + d - 2 * d * strike}
            style={{ stroke: ACCENT }} strokeWidth={3.4} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

export const MplRuns: React.FC<CardProps & { data: MplRunsData }> = ({ tMs, w, h, fps, beats, data }) => {
  const fsTick = 0.021 * w;
  const fsLab = 0.024 * w;
  const fsAnn = 0.027 * w;
  const axL = 0.235 * w;
  const axT = 0.175 * h;
  const axB = h - 0.155 * h;
  const axW = w - axL - 0.163 * w;
  const axH = axB - axT;
  const px = (v: number) => axL + ((v - X0) / (X1 - X0)) * axW;
  const rowY = (i: number) => axT + axH * (0.25 + 0.5 * i);
  const half = 0.17 * axH;
  const r = 0.0185 * h;

  const spr = (at: number) => (!Number.isFinite(at) || tMs < at ? 0 : spring({
    frame: ((tMs - at) / 1000) * fps, fps, config: { damping: 15, stiffness: 320, mass: 0.7 },
  }));

  // stage compare opens on everything stage best ended with: the rings and their strikes are
  // already complete, so nothing re-animates across the 41720 hand-over.
  const cmp = data.stage === "compare";
  const bestDraw = cmp ? 1 : ramp(tMs, beats.circle, 200);
  const bestHit = cmp ? 1 : ramp(tMs, beats.strike, 150);
  const meanDraw = cmp ? ramp(tMs, beats.mean, 300) : 0;
  const meanLand = cmp ? spr(beats.mean + 300) : 0;
  const worstDraw = cmp ? ramp(tMs, beats.worst, 200) : 0;
  const worstLand = cmp ? spr(beats.worst + 200) : 0;
  const barDraw = cmp ? ramp(tMs, beats.bar, 260) : 0;
  const barLand = cmp ? spr(beats.bar + 260) : 0;
  const countLand = cmp ? spr(beats.count + 300) : 0;

  const rows = data.rows.map((row, ri) => {
    const pts: Pt[] = row.values.map((v, i) => ({ v, x: px(v), y: rowY(ri) + jit(ri, i) * half * 0.42 }));
    const mean = row.values.reduce((a, b) => a + b, 0) / row.values.length;
    const best = pts.reduce((a, b) => (b.v > a.v ? b : a));
    const worst = pts.reduce((a, b) => (b.v < a.v ? b : a));
    const pass = pts.filter((p) => p.v >= data.bar).sort((a, b) => a.x - b.x);
    return { pts, mean, best, worst, pass, accent: ri === 0, count: `${pass.length} of ${row.values.length}` };
  });
  const barX = px(data.bar);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FIG_FONT }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }} fontFamily={FIG_FONT}>
        <Axes axL={axL} axT={axT} axW={axW} axH={axH} fsTick={fsTick} fsLab={fsLab}
          px={px} rowY={rowY} names={data.rows.map((q) => q.label)} />

        {/* the quality bar, one solid line across both rows, named above the top spine */}
        {barDraw > 0 && (
          <g>
            <line x1={barX} y1={axT} x2={barX} y2={axT + (axB - axT) * barDraw} stroke={TXT} strokeWidth={2.6} />
            {barLand > 0 && (
              <text x={barX} y={axT - 12} textAnchor="middle" fontSize={fsAnn} fill={TXT}
                opacity={Math.min(1, barLand * 2.4)} transform={`translate(0 ${(1 - barLand) * fsAnn * 0.45})`}>quality bar</text>
            )}
          </g>
        )}

        {rows.map((row, ri) => {
          const dot = row.accent ? ACCENT : GREY;
          const top = rowY(ri) - half;
          const mx = px(row.mean);
          return (
            <g key={data.rows[ri].label}>
              {/* the ten runs */}
              {row.pts.map((p, i) => {
                const rank = row.pass.indexOf(p);
                const pop = !cmp || rank < 0 ? 0 : spr(beats.count + rank * 26);
                const green = pop > 0;
                return (
                  <circle key={`d${i}`} cx={p.x} cy={p.y} r={r * (1 + 0.34 * Math.sin(Math.PI * Math.min(1, pop)))}
                    style={green ? { fill: GREEN } : { fill: dot }} opacity={0.94} />
                );
              })}
              {/* the mean, matplotlib's axvline(ls="--") over this row only */}
              {meanDraw > 0 && (
                <line x1={mx} y1={top} x2={mx} y2={top + 2 * half * meanDraw}
                  style={{ stroke: row.accent ? ACCENT : GREY }} strokeWidth={2.6} strokeDasharray="9 7" />
              )}
              {meanLand > 0 && (
                <text x={mx} y={top - 9} textAnchor="middle" fontSize={fsAnn} fontWeight={700}
                  style={{ fill: row.accent ? ACCENT : GREY_TXT }} opacity={Math.min(1, meanLand * 2.4)}
                  transform={`translate(0 ${(1 - meanLand) * fsAnn * 0.45})`}>{Math.round(row.mean)}</text>
              )}
              {/* the equal bests, circled then struck */}
              {bestDraw > 0 && <Ring p={row.best} r={r * 2.05} draw={bestDraw} strike={bestHit} color={TXT} />}
              {/* the worst run of the row */}
              {worstDraw > 0 && (
                <Ring p={row.worst} r={r * 2.05} draw={worstDraw} strike={0} color={row.accent ? TXT : ACCENT} />
              )}
              {worstLand > 0 && (
                <text x={row.worst.x} y={Math.min(row.worst.y + r * 2.05 + fsAnn * 1.32, top + 2 * half + fsAnn * 1.15)}
                  textAnchor="middle" fontSize={fsAnn} fontWeight={700} opacity={Math.min(1, worstLand * 2.4)}
                  style={{ fill: row.accent ? TXT : ACCENT }}>{row.worst.v}</text>
              )}
              {/* how many of the ten cleared the bar, at the right end of the row */}
              {countLand > 0 && (
                <text x={w - 0.028 * w} y={rowY(ri) + fsAnn * 0.36} textAnchor="end" fontSize={fsAnn} fontWeight={700}
                  style={{ fill: row.accent ? ACCENT : TXT }} opacity={Math.min(1, countLand * 2.4)}
                  transform={`translate(0 ${(1 - countLand) * fsAnn * 0.45})`}>{row.count}</text>
              )}
            </g>
          );
        })}

        <text x={axL + axW / 2} y={axB + TICK + 6 + fsTick * 1.9 + fsLab * 0.8} textAnchor="middle"
          fontSize={fsLab} fill={TXT}>{data.xLabel}</text>
      </svg>
    </div>
  );
};
