import React from "react";
import { interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, INK, MONO_FONT, label } from "./theme";
import { Head } from "./Head";

// V13, "used by more than 4 million developers."
// The creator says four million; Nvidia's own number is six. The card fills with people, one
// steady cadence, centre out, so the field is always a cluster growing outward and never
// a scatter that catches up in a blob. The counter rolls with the fill and lands on
// 6,000,000 with the last mark: the figure is the payload, so it takes the accent.
export type DevFieldData = { to: number; unit: string; source: string; suffix?: string }; // suffix lands with the number ("4,000,000+")

const COLS = 30;
const ROWS = 10;

const Person: React.FC<{ x: number; y: number; g: number; s: number; o: number }> = ({ x, y, g, s, o }) => (
  <g transform={`translate(${x} ${y}) scale(${g * s})`} opacity={o} fill={INK}>
    <circle cx={0} cy={-0.32} r={0.19} />
    <path d="M -0.34 0.50 C -0.34 0.00 0.34 0.00 0.34 0.50 Z" />
  </g>
);

export const DevField: React.FC<CardProps & { data: DevFieldData }> = ({
  tMs, w, h, fps, fromMs, beats, data,
}) => {
  const padX = 0.045 * w;
  const padTop = 0.055 * h;
  const headFs = 0.023 * w;
  const srcFs = 0.022 * w;
  const unitFs = 0.030 * w;
  const countFs = 0.075 * w;

  const fieldTop = padTop + headFs + 0.048 * h;
  const countTop = 0.732 * h;
  const countH = countFs * 1.02;
  const fieldH = countTop - 0.048 * h - fieldTop;
  const fieldW = w - 2 * padX;
  const cw = fieldW / COLS;
  const ch = fieldH / ROWS;
  const g = Math.min(cw, ch) * 0.78;

  const fill = beats.fill ?? fromMs;
  const fillEnd = beats.fillEnd ?? fill + 720;
  const land = beats.land ?? fillEnd;
  const span = Math.max(1, fillEnd - fill);

  // centre out, one steady cadence over the whole sentence
  const order = React.useMemo(() => {
    const cells: { i: number; d: number }[] = [];
    for (let i = 0; i < COLS * ROWS; i++) {
      const dx = ((i % COLS) - (COLS - 1) / 2) * cw;
      const dy = (Math.floor(i / COLS) - (ROWS - 1) / 2) * ch;
      cells.push({ i, d: Math.sqrt(dx * dx + dy * dy) });
    }
    cells.sort((a, b) => a.d - b.d);
    const rank = new Array<number>(COLS * ROWS);
    cells.forEach((c, k) => { rank[c.i] = k; });
    return rank;
  }, [cw, ch]);

  const ramp = (a: number, b: number) =>
    interpolate(tMs, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headIn = ramp(fromMs, fromMs + 200);
  const srcIn = ramp(fromMs + 420, fromMs + 660);
  const landed = tMs >= land;
  const pop = spring({
    frame: Math.max(0, ((tMs - land) / 1000) * fps), fps,
    config: { damping: 15, stiffness: 320, mass: 0.7 },
  });

  const shown = Math.round(interpolate(tMs, [fill, fillEnd], [0, data.to], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }));
  const digits = (data.to.toLocaleString("en-US") + (data.suffix ?? "")).length;
  const count = shown.toLocaleString("en-US");

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: padX, top: padTop, width: fieldW, opacity: headIn }}>
        <Head w={w} left="NVIDIA CUDA" />
      </div>

      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <title>a field of developers filling from the centre out</title>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const at = fill + (order[i] / (COLS * ROWS)) * span;
          const p = ramp(at, at + 130);
          if (p <= 0) return null;
          return (
            <Person
              key={i}
              x={padX + (i % COLS) * cw + cw / 2}
              y={fieldTop + Math.floor(i / COLS) * ch + ch / 2}
              g={g} s={0.42 + 0.58 * p} o={Math.min(1, p * 2.2)}
            />
          );
        })}
      </svg>

      <div
        style={{
          position: "absolute", left: 0, top: countTop, width: w, height: countH,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 0.026 * w,
        }}
      >
        <div
          style={{
            width: digits * countFs * 0.602, textAlign: "right", lineHeight: 1,
            fontFamily: MONO_FONT, fontSize: countFs, fontWeight: 600,
            fontVariantNumeric: "tabular-nums", color: landed ? ACCENT : INK,
            transform: `scale(${1 + 0.06 * (landed ? 1 - Math.min(1, pop) : 0)})`,
            transformOrigin: "right center",
          }}
        >
          {count}{landed && data.suffix ? data.suffix : ""}
        </div>
        <div style={{ ...label(unitFs, INK), whiteSpace: "nowrap", paddingTop: 0.010 * h }}>{data.unit}</div>
      </div>

      <div
        style={{
          position: "absolute", right: padX, bottom: 0.048 * h,
          fontFamily: MONO_FONT, fontSize: srcFs, color: "rgba(255,255,255,0.46)", opacity: srcIn,
        }}
      >
        {data.source}
      </div>
    </div>
  );
};
