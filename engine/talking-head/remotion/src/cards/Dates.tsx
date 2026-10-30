import React from "react";
import { interpolate } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, BAR_GREY, INK, MONO_FONT, MUTED, label } from "./theme";

// "The production of the chip will start the end of 2026."
// The real schedule on one black card: six dated stops on one axis, the marker
// sitting on today (`Jun 24 2026 announced`) and sliding one stop forward on the
// word `2026.` The two stops after it stay grey, because the source is not more
// optimistic than that: Hock Tan said prototype late 2026, ramp in '27, full
// tilt in H1 '28. Nothing here is rounded and nothing is invented; the source
// line sits at the bottom right the way a figure caption does.
export type DatesData = { stops: { t: string; l: string }[]; from: number; to: number; source: string };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const Dates: React.FC<CardProps & { data: DatesData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const P = 0.045 * w;
  const S = 0.026 * w;          // labels, the head, the source
  const M = 0.034 * w;          // the dates: the payload of the card
  const stops = data.stops;
  const N = Math.max(1, stops.length);

  const axY = 0.500 * h;
  // the axis is inset further than the card's padding so the first and last
  // stop's words stay inside the plate instead of hugging its edge
  const axL = 0.075 * w;
  const axW = w - 2 * axL;
  const slot = axW / N;
  const xOf = (i: number) => axL + (i + 0.5) * slot;
  const tick = 0.045 * h;
  const gap = 0.016 * h;
  const blockW = Math.min(2 * slot - 0.02 * w, 0.30 * w);

  const mark = beats.marker ?? fromMs + 1000;
  const slide = interpolate(tMs, [mark, mark + 350], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const pos = data.from + (data.to - data.from) * slide;
  const markerX = xOf(pos);
  const arrived = slide >= 1;
  // the marker lands, it does not drift to a stop: a short settle on arrival
  const settle = clamp01((tMs - (mark + 350)) / 170);
  const pop = arrived ? 1 + 0.20 * Math.sin(Math.PI * settle) : 1;
  const mk = 0.030 * w;

  // what has happened is white; what is still ahead is dimmed, because the
  // source is not more optimistic than that. The target is dim until the
  // marker lands on it, and only then does it take the accent.
  const styleOf = (i: number): { c: string; o: number } => {
    if (i === data.to && arrived) return { c: ACCENT, o: 1 };
    return i < data.to ? { c: INK, o: 1 } : { c: MUTED, o: 0.55 };
  };

  const block = (i: number) => {
    const above = i % 2 === 0;
    const { c, o } = styleOf(i);
    const date = (
      <div style={{ fontFamily: MONO_FONT, fontSize: M, color: c, lineHeight: 1.15, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
        {stops[i].t}
      </div>
    );
    const name = <div style={{ ...label(S, c), lineHeight: 1.18, marginTop: 0.010 * h }}>{stops[i].l}</div>;
    return (
      <div
        key={i}
        style={{
          position: "absolute", left: xOf(i), width: blockW, textAlign: "center", opacity: o,
          transform: above ? "translate(-50%, -100%)" : "translate(-50%, 0)",
          top: above ? axY - tick - gap : axY + tick + gap,
          display: "flex", flexDirection: "column", alignItems: "center",
        }}
      >
        {above ? name : date}
        {above ? date : name}
      </div>
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0, padding: P, boxSizing: "border-box" }}>
      <div style={label(S, MUTED)}>PRODUCTION</div>

      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <title>six dated stops on one axis, the marker one stop from today</title>
        <line x1={axL} y1={axY} x2={axL + axW} y2={axY} stroke={BAR_GREY} strokeWidth={0.005 * w} />
        <line x1={axL} y1={axY} x2={markerX} y2={axY} stroke={INK} strokeWidth={0.005 * w} />
        {stops.map((_, i) => (
          <line
            key={i} x1={xOf(i)} y1={axY} x2={xOf(i)} y2={i % 2 === 0 ? axY - tick : axY + tick}
            stroke={i <= data.to ? INK : BAR_GREY} strokeWidth={0.004 * w}
          />
        ))}
        <rect
          x={markerX - (mk * pop) / 2} y={axY - (mk * pop) / 2}
          width={mk * pop} height={mk * pop} fill={ACCENT}
        />
      </svg>

      {stops.map((_, i) => block(i))}

      <div
        style={{
          position: "absolute", right: P, bottom: P, fontFamily: MONO_FONT, fontSize: S,
          color: MUTED, opacity: 0.7, whiteSpace: "nowrap",
        }}
      >
        {data.source}
      </div>
    </div>
  );
};
