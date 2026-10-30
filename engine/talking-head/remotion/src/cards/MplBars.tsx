import React from "react";
import { Easing, interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT } from "./theme";

// V8 `mplbars` (edit-c-chip): "Almost 2 times more tokens per watt."
// A matplotlib figure drawn in SVG on the white card (Chart.tsx's idiom: DejaVu, all
// four spines, ticks, tick labels, a legend box, the source line), so the bars can move
// on their words. Three panels, one per model, each on its own y scale because the models
// sit orders apart. The axes, the Nvidia bars and the panel names stand at in; the
// Jalapeno bars RISE on "2 times"; the ratio labels land on "watt.". Every number is
// from `data` (OpenAI at Hot Chips 2026 + SemiAnalysis InferenceX), none is invented.
export type MplBarsData = {
  title: string; ylabel: string; series: [string, string];
  panels: { name: string; vs: string; a: number; b: number; ratio: string }[]; source: string;
};

const FIG_FONT = "'DejaVu Sans', Verdana, Arial, sans-serif";
const TXT = "#1a1a1a";
const SPINE = "#333333";
const GREY = "#7f7f7f";
const GRID = "#dddddd";
const RISE_MS = 240;

// a matplotlib-ish y axis: the smallest nice step that keeps <= 5 intervals
const NICE = [1, 2, 2.5, 5];
const axisFor = (max: number) => {
  const target = max * 1.34;
  for (let k = 0; k < 9; k++) {
    for (const m of NICE) {
      const step = m * Math.pow(10, k);
      const n = Math.ceil(target / step);
      if (n <= 5) return { step, top: n * step };
    }
  }
  return { step: max, top: max };
};
const kfmt = (v: number) => (v === 0 ? "0" : v >= 1000 ? `${v / 1000}k` : String(v));
const cfmt = (v: number) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

type PanelProps = {
  p: MplBarsData["panels"][number];
  x: number; top: number; ph: number; pw: number;
  fsTick: number; fsRatio: number; rise: number; pop: number;
};

const Panel: React.FC<PanelProps> = ({ p, x, top, ph, pw, fsTick, fsRatio, rise, pop }) => {
  const { step, top: ymax } = axisFor(Math.max(p.a, p.b));
  const ticks: number[] = [];
  for (let v = 0; v <= ymax + 1e-6; v += step) ticks.push(v);
  const y = (v: number) => top + ph - (v / ymax) * ph;
  const bw = 0.3 * pw;
  const cA = x + 0.3 * pw;
  const cB = x + 0.72 * pw;
  const topA = y(p.a * rise);
  const topB = y(p.b);
  const tick = 6;
  const gapLab = fsTick * 0.5;
  const ratioY = Math.min(topA, topB) - fsTick * 1.5 - fsRatio * 0.35;
  return (
    <g>
      {ticks.slice(1).map((v) => (
        <line key={`g${v}`} x1={x} y1={y(v)} x2={x + pw} y2={y(v)} stroke={GRID} strokeWidth={1} strokeDasharray="4 5" />
      ))}
      <rect x={cA - bw / 2} y={topA} width={bw} height={top + ph - topA} style={{ fill: ACCENT }} />
      <rect x={cB - bw / 2} y={topB} width={bw} height={top + ph - topB} fill={GREY} />
      <rect x={x} y={top} width={pw} height={ph} fill="none" stroke={SPINE} strokeWidth={1.6} />
      {ticks.map((v) => (
        <g key={`t${v}`}>
          <line x1={x - tick} y1={y(v)} x2={x} y2={y(v)} stroke={SPINE} strokeWidth={1.4} />
          <text x={x - tick - 5} y={y(v) + fsTick * 0.36} textAnchor="end" fontSize={fsTick} fill={TXT}>{kfmt(v)}</text>
        </g>
      ))}
      <text x={cB} y={topB - gapLab} textAnchor="middle" fontSize={fsTick} fill={GREY}>{cfmt(p.b)}</text>
      {rise > 0.93 && (
        <text x={cA} y={topA - gapLab} textAnchor="middle" fontSize={fsTick} fill={TXT}
          opacity={Math.min(1, (rise - 0.93) * 22)}>{cfmt(p.a)}</text>
      )}
      {pop > 0 && (
        <text x={x + 0.51 * pw} y={ratioY} textAnchor="middle" fontSize={fsRatio} fontWeight={700}
          style={{ fill: ACCENT }} opacity={Math.min(1, pop * 2.4)}
          transform={`translate(0 ${(1 - pop) * fsRatio * 0.5})`}>{p.ratio}</text>
      )}
    </g>
  );
};

export const MplBars: React.FC<CardProps & { data: MplBarsData }> = ({ tMs, w, h, fps, beats, data }) => {
  const pad = 0.045 * w;
  const fsTitle = 0.025 * w;
  const fsTick = 0.019 * w;
  const fsRatio = 0.034 * w;

  const headTop = 0.05 * h;
  const headH = Math.max(fsTitle * 1.35, fsTick * 2.1);
  const axT = headTop + headH + 0.03 * h;
  const axB = h - 0.04 * h - fsTick * 1.4 - fsTick * 1.6 - fsTick * 1.7 - fsTick * 1.5;
  const ph = axB - axT;

  const x0 = pad + 0.022 * w;
  const gap = 0.03 * w;
  const panelW = (w - x0 - pad - 2 * gap) / 3;
  const labW = fsTick * 3 + 8;
  const pw = panelW - labW;

  const pop = spring({
    frame: Math.max(0, ((tMs - beats.labels) / 1000) * fps),
    fps, config: { damping: 14, stiffness: 330, mass: 0.7 },
  });
  const started = tMs >= beats.labels;

  const nameBase = axB + fsTick * 1.5 + fsTick * 1.2;
  const xLabBase = axB + fsTick * 1.5 + fsTick * 1.8 + fsTick * 1.35;
  const srcBase = h - 0.035 * h;
  const legW = fsTick * 13.6;
  const legH = fsTick * 1.9;
  const legX = w - pad - legW;
  const legY = headTop + (headH - legH) / 2;

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FIG_FONT }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }} fontFamily={FIG_FONT}>
        <text x={pad} y={headTop + headH * 0.74} fontSize={fsTitle} fill={TXT}>{data.title}</text>
        {/* legend, matplotlib box */}
        <rect x={legX} y={legY} width={legW} height={legH} fill="#ffffff" stroke="#cccccc" strokeWidth={1} />
        <rect x={legX + fsTick * 0.55} y={legY + legH / 2 - 3} width={fsTick * 1.35} height={6} style={{ fill: ACCENT }} />
        <text x={legX + fsTick * 2.35} y={legY + legH / 2 + fsTick * 0.36} fontSize={fsTick} fill={TXT}>{data.series[0]}</text>
        <rect x={legX + fsTick * 7.4} y={legY + legH / 2 - 3} width={fsTick * 1.35} height={6} fill={GREY} />
        <text x={legX + fsTick * 9.2} y={legY + legH / 2 + fsTick * 0.36} fontSize={fsTick} fill={TXT}>{data.series[1]}</text>
        {/* rotated y label, one unit for the three panels (matplotlib supylabel) */}
        <text x={pad * 0.58} y={axT + ph / 2} transform={`rotate(-90 ${pad * 0.58} ${axT + ph / 2})`}
          textAnchor="middle" fontSize={fsTick} fill={TXT}>{data.ylabel}</text>
        {data.panels.map((p, i) => {
          const x = x0 + i * (panelW + gap) + labW;
          const r0 = beats.rise + i * 55;
          const rise = interpolate(tMs, [r0, r0 + RISE_MS], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
          });
          return (
            <React.Fragment key={p.name}>
              <Panel p={p} x={x} top={axT} ph={ph} pw={pw} fsTick={fsTick} fsRatio={fsRatio}
                rise={rise} pop={started ? pop : 0} />
              <text x={x + pw / 2} y={nameBase} textAnchor="middle" fontSize={fsTick} fill={TXT}>
                {p.name} (vs {p.vs})
              </text>
            </React.Fragment>
          );
        })}
        {/* x ticks live under each pair: the two series, one per bar */}
        {data.panels.map((p, i) => {
          const x = x0 + i * (panelW + gap) + labW;
          return (
            <g key={`x${p.name}`}>
              <line x1={x + 0.3 * pw} y1={axB} x2={x + 0.3 * pw} y2={axB + 6} stroke={SPINE} strokeWidth={1.4} />
              <line x1={x + 0.72 * pw} y1={axB} x2={x + 0.72 * pw} y2={axB + 6} stroke={SPINE} strokeWidth={1.4} />
            </g>
          );
        })}
        <text x={w / 2} y={xLabBase} textAnchor="middle" fontSize={fsTick} fill={TXT}>model</text>
        <text x={w - pad} y={srcBase} textAnchor="end" fontSize={fsTick} fill={GREY}>{data.source}</text>
      </svg>
    </div>
  );
};
