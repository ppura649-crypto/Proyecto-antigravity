import React from "react";
import { Easing, interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT } from "./theme";

// V7 "so that we could increase our output while saving time."
// One white notebook figure, two panels on one baseline (the MplBars idiom: DejaVu,
// all four spines, ticks, dashed grid, a figure caption). LEFT is real and carries its
// source: their own reels per month, 25 in AUG 2026. RIGHT is an illustration of their
// words and says so by having NOTHING on its axes: no number, no unit, no source. The
// difference between a measured panel and an illustrated one is visible on the card.
export type OutputChartData = {
  left: { title: string; months: string[]; values: number[]; source: string };
  right: { title: string; illustration?: boolean };
};

const FIG_FONT = "'DejaVu Sans', Verdana, Arial, sans-serif";
const TXT = "#1a1a1a";
const SPINE = "#333333";
const GREY = "#7f7f7f";
const GRID = "#dddddd";
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// matplotlib's tick chooser: the smallest nice step that keeps <= 4 intervals
const NICE = [1, 2, 2.5, 5];
const axisFor = (max: number): { step: number; top: number } => {
  const target = max * 1.18;
  for (let k = 0; k < 9; k++) {
    for (const m of NICE) {
      const step = m * Math.pow(10, k);
      const n = Math.ceil(target / step);
      if (n <= 4) return { step, top: n * step };
    }
  }
  return { step: max, top: max };
};

export const OutputChart: React.FC<CardProps & { data: OutputChartData }> = ({ tMs, w, h, fps, beats, data }) => {
  const pad = Math.round(0.044 * w);
  const fsTitle = Math.round(0.027 * w);   // 27
  const fsTick = Math.round(0.023 * w);    // 23
  const fsVal = Math.round(0.026 * w);     // 26
  const fsSrc = Math.round(0.024 * w);     // 24

  const axT = Math.round(0.205 * h);
  const axB = Math.round(0.775 * h);       // the ONE baseline both panels stand on
  const ph = axB - axT;

  const yLabW = fsTick * 2.6;
  const gap = Math.round(0.062 * w);
  const inner = w - 2 * pad;
  const leftW = Math.round((inner - gap - yLabW) * 0.615);
  const rightW = inner - gap - yLabW - leftW;
  const lx = pad + yLabW;
  const rx = lx + leftW + gap;

  // both sets of axes pop on "increase"
  const axSp = spring({
    frame: Math.max(0, ((tMs - beats.increase) / 1000) * fps),
    fps, config: { damping: 15, stiffness: 340, mass: 0.6 },
  });
  const axOp = Math.min(1, ((tMs - beats.increase) / 1000) * fps / 2);

  // LEFT: the bars rise one per 60 ms, left to right, on "output"
  const vals = data.left.values;
  const { step, top: ymax } = axisFor(Math.max(...vals));
  const ticks: number[] = [];
  for (let v = 0; v <= ymax + 1e-6; v += step) ticks.push(v);
  const yOf = (v: number) => axB - (v / ymax) * ph;
  const slot = leftW / vals.length;
  const bw = slot * 0.62;

  // RIGHT: one falling stroke on "saving", then the arrow it lands on
  const draw = interpolate(tMs, [beats.saving, beats.saving + 400], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const RX0 = rx + rightW * 0.07;
  const RX1 = rx + rightW * 0.93;
  const RY0 = axT + ph * 0.10;
  const RY1 = axB - ph * 0.20;
  // a hand-drawn fall: steep at first, flattening out, sampled so the stroke is one curve
  const curve = (t: number) => 1 - Math.pow(1 - t, 2.1);
  const pts = Array.from({ length: 41 }, (_, i) => {
    const t = (i / 40) * draw;
    return `${(RX0 + (RX1 - RX0) * t).toFixed(1)},${(RY0 + (RY1 - RY0) * curve(t)).toFixed(1)}`;
  }).join(" ");
  const arrowSp = spring({
    frame: Math.max(0, ((tMs - (beats.saving + 400)) / 1000) * fps),
    fps, config: { damping: 13, stiffness: 340, mass: 0.6 },
  });
  const ar = Math.round(0.029 * w);

  const frame = (x: number, ww: number) => (
    <rect x={x} y={axT} width={ww} height={ph} fill="none" stroke={SPINE} strokeWidth={1.8} />
  );

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FIG_FONT }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }} fontFamily={FIG_FONT}>
        <title>two panels on one baseline: reels per month, and hours per reel</title>
        <g opacity={axOp} transform={`translate(0 ${(1 - axSp) * 10})`}>
          {/* panel titles */}
          <text x={lx} y={axT - fsTitle * 0.55} fontSize={fsTitle} fill={TXT}>{data.left.title}</text>
          <text x={rx} y={axT - fsTitle * 0.55} fontSize={fsTitle} fill={TXT}>{data.right.title}</text>

          {/* LEFT: grid, spines, y ticks with their numbers */}
          {ticks.slice(1).map((v) => (
            <line key={`g${v}`} x1={lx} y1={yOf(v)} x2={lx + leftW} y2={yOf(v)} stroke={GRID} strokeWidth={1} strokeDasharray="4 5" />
          ))}
          {frame(lx, leftW)}
          {ticks.map((v) => (
            <g key={`t${v}`}>
              <line x1={lx - 7} y1={yOf(v)} x2={lx} y2={yOf(v)} stroke={SPINE} strokeWidth={1.5} />
              <text x={lx - 12} y={yOf(v) + fsTick * 0.36} textAnchor="end" fontSize={fsTick} fill={TXT}>{v}</text>
            </g>
          ))}

          {/* RIGHT: the same spines, and NO tick, number or unit anywhere on them */}
          {frame(rx, rightW)}
        </g>

        {/* the bars, one per 60 ms on "output" */}
        {vals.map((v, i) => {
          const at = beats.output + i * 60;
          const rise = interpolate(tMs, [at, at + 220], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          const cx = lx + (i + 0.5) * slot;
          const top = yOf(v * rise);
          const isAug = v === Math.max(...vals);
          // the month itself lands on the step, so the walk left to right is visible
          // across the eight months the creator posted nothing (a bar of zero shows nothing)
          const step = Math.min(axOp, Math.max(0, (tMs - at) / 120));
          return (
            <g key={data.left.months[i]}>
              <line x1={cx} y1={axB} x2={cx} y2={axB + 7} stroke={SPINE} strokeWidth={1.5} opacity={step} />
              {i % 2 === 0 && (
                <text x={cx} y={axB + 7 + fsTick * 1.3} textAnchor="middle" fontSize={fsTick}
                  fontWeight={isAug ? 700 : 400} fill={isAug ? TXT : GREY} opacity={step}>
                  {data.left.months[i]}
                </text>
              )}
              {v > 0 && (
                <rect x={cx - bw / 2} y={top} width={bw} height={axB - top} style={{ fill: isAug ? ACCENT : "#4a4a4a" }} />
              )}
              {v > 0 && rise > 0.9 && (
                <text x={cx} y={top - fsVal * 0.42} textAnchor="middle" fontSize={fsVal} fontWeight={isAug ? 700 : 400}
                  fill={TXT} opacity={Math.min(1, (rise - 0.9) * 14)}>{v}</text>
              )}
            </g>
          );
        })}

        {/* the fall: one stroke, no number on it, and the arrow it lands on */}
        {draw > 0 && <polyline points={pts} fill="none" stroke={TXT} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />}
        {arrowSp > 0.01 && (
          <g opacity={Math.min(1, arrowSp * 2)} transform={`translate(${RX1} ${RY1 + ar * 0.42 + (1 - arrowSp) * 10})`}>
            <line x1={0} y1={-ar * 0.05} x2={0} y2={ar * 0.72} stroke={ACCENT} strokeWidth={5} strokeLinecap="round" />
            <path d={`M ${-ar * 0.34} ${ar * 0.42} L 0 ${ar * 0.90} L ${ar * 0.34} ${ar * 0.42} Z`} style={{ fill: ACCENT }} />
          </g>
        )}

        {/* the figure caption: it belongs to the measured panel only */}
        <text x={lx} y={h - Math.round(0.075 * h)} fontSize={fsSrc} fill={GREY} opacity={axOp}>{data.left.source}</text>
      </svg>
    </div>
  );
};
