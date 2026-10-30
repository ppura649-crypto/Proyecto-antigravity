import React from "react";
import { interpolate } from "remotion";
import { ACCENT } from "./theme";

// Rule-debt chart, matplotlib style: white figure, real axes with ticks and
// labels, one falling line (instructions followed vs. rules in the prompt).
// At the apex beat the "rule debt" region shades in with an annotation arrow,
// synced to the RULE DEBT caption hero. beats: { drawFrom, apex }  (spine ms)

const FIG_FONT = "'DejaVu Sans', Verdana, Arial, sans-serif";
const TXT = "#1a1a1a";
const SPINE = "#333333";

export const Chart: React.FC<{
  tMs: number;
  w: number;
  h: number;
  beats: { drawFrom: number; apex: number };
}> = ({ tMs, w, h, beats }) => {
  // axes rect (matplotlib-ish margins)
  const axL = 0.135 * w;
  const axR = 0.05 * w;
  const axT = 0.13 * h;
  const axB = 0.21 * h;
  const axW = w - axL - axR;
  const axH = h - axT - axB;

  const p = interpolate(tMs, [beats.drawFrom, beats.apex], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // domain: x = rules 0..50, y = instructions followed 30..100 (%)
  const xPix = (t: number) => axL + t * axW;
  const yPix = (v: number) => axT + ((100 - v) / 70) * axH;
  const vOf = (t: number) => 95 - 57 * Math.pow(t, 1.6);

  const N = 72;
  const n = Math.max(2, Math.ceil(N * p));
  const pts = Array.from({ length: n }, (_, i) => {
    const t = i / (N - 1);
    return `${xPix(t)},${yPix(vOf(t))}`;
  }).join(" ");
  const headT = (n - 1) / (N - 1);

  const debt = interpolate(tMs, [beats.apex, beats.apex + 420], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const debtX = xPix(0.55);

  const tickLen = 6;
  const xTicks = [0, 10, 20, 30, 40, 50];
  const yTicks = [40, 60, 80, 100];
  const fsTick = 0.0205 * w;
  const fsLab = 0.024 * w;

  const annX = xPix(0.76);
  const annY = yPix(52);

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#ffffff", fontFamily: FIG_FONT }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {/* grid */}
        {yTicks.map((v) => (
          <line key={`gy${v}`} x1={axL} y1={yPix(v)} x2={axL + axW} y2={yPix(v)}
            stroke="#dddddd" strokeWidth={1} strokeDasharray="4 5" />
        ))}
        {xTicks.slice(1).map((r) => (
          <line key={`gx${r}`} x1={xPix(r / 50)} y1={axT} x2={xPix(r / 50)} y2={axT + axH}
            stroke="#e6e6e6" strokeWidth={1} strokeDasharray="4 5" />
        ))}
        {/* rule-debt shaded region + edge, on the apex beat */}
        {debt > 0 && (
          <>
            <rect x={debtX} y={axT} width={(axL + axW - debtX) * debt} height={axH}
              style={{ fill: ACCENT }} opacity={0.13} />
            <line x1={debtX} y1={axT} x2={debtX} y2={axT + axH}
              style={{ stroke: ACCENT }} strokeWidth={2} strokeDasharray="6 5" opacity={debt} />
          </>
        )}
        {/* spines (all four, matplotlib default) */}
        <rect x={axL} y={axT} width={axW} height={axH} fill="none" stroke={SPINE} strokeWidth={1.6} />
        {/* ticks */}
        {xTicks.map((r) => (
          <line key={`tx${r}`} x1={xPix(r / 50)} y1={axT + axH} x2={xPix(r / 50)} y2={axT + axH + tickLen}
            stroke={SPINE} strokeWidth={1.4} />
        ))}
        {yTicks.map((v) => (
          <line key={`ty${v}`} x1={axL - tickLen} y1={yPix(v)} x2={axL} y2={yPix(v)}
            stroke={SPINE} strokeWidth={1.4} />
        ))}
        {/* the line */}
        <polyline points={pts} fill="none" style={{ stroke: ACCENT }} strokeWidth={5} strokeLinecap="round" />
        <circle cx={xPix(headT)} cy={yPix(vOf(headT))} r={7} style={{ fill: ACCENT }} />
        {/* y axis label, rotated like matplotlib */}
        <text
          x={0.035 * w} y={axT + axH / 2}
          transform={`rotate(-90 ${0.035 * w} ${axT + axH / 2})`}
          textAnchor="middle" fontFamily={FIG_FONT} fontSize={fsLab} fill={TXT}
        >
          instructions followed (%)
        </text>
        {/* annotation arrow (matplotlib annotate style) */}
        {debt > 0.4 && (
          <path
            d={`M ${annX} ${annY - 0.09 * h} Q ${annX + 0.02 * w} ${annY - 0.02 * h} ${annX - 0.015 * w} ${annY + 0.02 * h}`}
            fill="none" stroke={TXT} strokeWidth={1.8} opacity={Math.min(1, (debt - 0.4) * 3)}
          />
        )}
      </svg>

      {/* tick labels */}
      {xTicks.map((r) => (
        <div key={`lx${r}`} style={{ position: "absolute", left: xPix(r / 50) - 30, top: axT + axH + tickLen + 4, width: 60, textAlign: "center", fontSize: fsTick, color: TXT }}>
          {r}
        </div>
      ))}
      {yTicks.map((v) => (
        <div key={`ly${v}`} style={{ position: "absolute", left: axL - tickLen - 62, top: yPix(v) - fsTick * 0.72, width: 54, textAlign: "right", fontSize: fsTick, color: TXT }}>
          {v}
        </div>
      ))}
      {/* axis labels */}
      <div style={{ position: "absolute", left: axL, width: axW, top: axT + axH + tickLen + 6 + fsTick * 1.5, textAlign: "center", fontSize: fsLab, color: TXT }}>
        rules in your skills
      </div>
      {/* legend, top-right inside axes */}
      <div style={{ position: "absolute", left: axL + axW - 0.315 * w, top: axT + 0.035 * h, backgroundColor: "#ffffff", border: "1px solid #cccccc", padding: `${0.014 * h}px ${0.014 * w}px`, display: "flex", alignItems: "center", gap: 9, fontSize: fsTick, color: TXT }}>
        <div style={{ width: 26, height: 4, backgroundColor: ACCENT }} />
        instructions followed
      </div>
      {/* rule-debt annotation text */}
      {debt > 0.4 && (
        <div style={{ position: "absolute", left: annX - 0.04 * w, top: annY - 0.09 * h - fsLab * 1.7, fontSize: fsLab, color: TXT, fontStyle: "italic", opacity: Math.min(1, (debt - 0.4) * 3) }}>
          rule debt
        </div>
      )}
    </div>
  );
};
