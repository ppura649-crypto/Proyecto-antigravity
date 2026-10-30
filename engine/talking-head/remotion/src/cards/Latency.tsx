import React from "react";
import { interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, CARD_BG, INK, MONO_FONT, MUTED, label } from "./theme";

// V9, "3.6 times lower latency."
// A race, frameless on their footage. One token is dropped into each lane at the same
// instant and both run at their REAL speed: Jalapeño covers the lane in 1.65 s of model
// time and touches the finish exactly on "lower", GB300 is still 40% short of it when the
// clip cuts. The ratio is not asserted, it is the distance between the two dots.
export type LatencyData = {
  top: { name: string; s: number }; bottom: { name: string; s: number };
  ratio: string; note: string;
};

const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";

export const Latency: React.FC<CardProps & { data: LatencyData }> = ({
  tMs, w, h, fps, fromMs, beats, data,
}) => {
  const pad = 0.020 * w;
  const nameW = 0.260 * w;
  const gap = 0.022 * w;
  const timeW = 0.150 * w;
  const timeGap = 0.034 * w;
  const laneX = pad + nameW + gap;
  const laneW = w - laneX - timeGap - timeW - pad;
  const laneH = 0.215 * h;
  const gapV = 0.315 * h;
  const topY = 0.055 * h;
  const botY = topY + laneH + gapV;
  const finishX = laneX + laneW;

  const nameFs = 0.032 * w;
  const timeFs = 0.034 * w;
  const ratioFs = 0.112 * w;
  const noteFs = 0.024 * w;
  const dotR = 0.024 * w;

  const halo = `drop-shadow(0px 0px ${0.011 * w}px rgba(0,0,0,0.92)) drop-shadow(0px 3px 12px rgba(0,0,0,0.8))`;
  const ink = `0px 0px ${0.012 * w}px rgba(0,0,0,0.92), ${SHADOW}`;

  const ramp = (a: number, b: number) =>
    interpolate(tMs, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sp = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 320, mass: 0.7 } });

  const launch = beats.launch ?? fromMs;
  const arrive = beats.arrive ?? launch + 920;
  const labelAt = beats.label ?? arrive + 300;
  // the lanes are the object: they exist whole from frame 0 (Overlay pops the card),
  // so every frame of the race is a composed picture, never a half-drawn track
  const enter = ramp(fromMs, fromMs + 110);

  // the lane is one job. Jalapeño runs it in data.top.s, GB300 in data.bottom.s, and the
  // clock is set so Jalapeño's dot touches the finish exactly on `arrive`.
  const rate = laneW / Math.max(1, arrive - launch);      // px per ms for the fast one
  const slow = rate * (data.top.s / data.bottom.s);
  const run = Math.max(0, tMs - launch);
  const xFast = laneX + Math.min(laneW, rate * run);
  const xSlow = laneX + Math.min(laneW, slow * run);

  const tIn = sp(arrive);
  const rIn = sp(labelAt);
  const noteIn = ramp(fromMs + 300, fromMs + 520);

  const lane = (y: number) => (
    <g opacity={enter}>
      <rect x={laneX} y={y} width={laneW} height={laneH} fill={CARD_BG} fillOpacity={0.42} />
      <line x1={laneX} y1={y} x2={laneX + laneW} y2={y} stroke={INK} strokeWidth={0.006 * w} strokeOpacity={0.9} />
      <line x1={laneX} y1={y + laneH} x2={laneX + laneW} y2={y + laneH} stroke={INK} strokeWidth={0.006 * w} strokeOpacity={0.9} />
      <line x1={laneX} y1={y + 0.012 * h} x2={laneX} y2={y + laneH - 0.012 * h} stroke={MUTED} strokeWidth={0.005 * w} />
    </g>
  );

  const runner = (x: number, y: number, color: string) => {
    if (tMs < launch) return null;
    const cy = y + laneH / 2;
    return (
      <g>
        {[5, 4, 3, 2, 1].map((i) => {
          const gx = x - i * 0.020 * w;
          if (gx < laneX) return null;
          return <circle key={i} cx={gx} cy={cy} r={dotR * (1 - 0.13 * i)} fill={color} opacity={0.34 / i} />;
        })}
        <circle cx={x} cy={cy} r={dotR} fill={color} />
      </g>
    );
  };

  const fmt = (s: number) => `${s.toFixed(2)} s`;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <title>two lanes, the same token, run at their real speed</title>
        <g style={{ filter: halo }}>
          {lane(topY)}
          {lane(botY)}
          {/* the finish: the same distance for both */}
          <line
            x1={finishX} y1={topY - 0.022 * h} x2={finishX} y2={topY + laneH + 0.022 * h}
            stroke={INK} strokeWidth={0.010 * w} opacity={enter}
          />
          <line
            x1={finishX} y1={botY - 0.022 * h} x2={finishX} y2={botY + laneH + 0.022 * h}
            stroke={INK} strokeWidth={0.010 * w} opacity={enter}
          />
          {runner(xFast, topY, ACCENT)}
          {runner(xSlow, botY, INK)}
        </g>
      </svg>

      {[
        { y: topY, t: data.top.name },
        { y: botY, t: data.bottom.name },
      ].map((n) => (
        <div
          key={n.t}
          style={{
            position: "absolute", left: pad, top: n.y, width: nameW, height: laneH,
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            ...label(nameFs, INK), whiteSpace: "nowrap", textShadow: ink, opacity: enter,
          }}
        >
          {n.t}
        </div>
      ))}

      {/* the wall the slow lane has to reach, standing at its finish from the first frame */}
      <div
        style={{
          position: "absolute", left: finishX + timeGap, top: botY, width: timeW, height: laneH,
          display: "flex", alignItems: "center", fontFamily: MONO_FONT, fontSize: timeFs,
          color: MUTED, textShadow: ink, opacity: enter, whiteSpace: "nowrap",
        }}
      >
        {fmt(data.bottom.s)}
      </div>

      {/* the time the fast lane actually took, landing as its dot touches the line */}
      <div
        style={{
          position: "absolute", left: finishX + timeGap, top: topY, width: timeW, height: laneH,
          display: "flex", alignItems: "center", fontFamily: MONO_FONT, fontSize: timeFs,
          color: INK, textShadow: ink, whiteSpace: "nowrap",
          opacity: Math.min(1, tIn * 2), transform: `scale(${0.86 + 0.14 * Math.min(1, tIn)})`,
          transformOrigin: "left center",
        }}
      >
        {fmt(data.top.s)}
      </div>

      {/* the payload */}
      <div
        style={{
          position: "absolute", left: laneX, top: topY + laneH, width: laneW, height: gapV,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: MONO_FONT, fontSize: ratioFs, fontWeight: 600, lineHeight: 1,
          color: ACCENT, textShadow: ink,
          opacity: Math.min(1, rIn * 2), transform: `scale(${0.80 + 0.20 * Math.min(1, rIn)})`,
        }}
      >
        {data.ratio}
      </div>

      <div
        style={{
          position: "absolute", left: laneX, top: botY + laneH + 0.042 * h,
          fontFamily: MONO_FONT, fontSize: noteFs, color: INK, textShadow: ink,
          opacity: noteIn,
        }}
      >
        {data.note}
      </div>
    </div>
  );
};
