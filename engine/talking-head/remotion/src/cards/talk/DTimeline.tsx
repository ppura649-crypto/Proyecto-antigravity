import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { DINK, at, cap, clamp01, draw, easeOut, mono, popSpring } from "./DShared";

// V3 "For the past 2 years, Anthropic and OpenAI have been saying."
// FRAMELESS, dark ink, on the band's LEFT: a thin rail that draws itself from 2024 to 2026 on
// "2 years,", and above it the two real marks landing on their own names. Nothing behind a mark.
// Everything stays left of x 611 and above y 481 (device px), which is clear of the painting
// hanging on the right of the band on this master.

export type TimelineData = { from?: string; to?: string; names?: string[]; halo?: boolean };

// design px on a 994-wide card; P() scales to the card's real width
const A_CX = 150, O_CX = 428, MARK_BOTTOM = 180, A_H = 160, O_H = 168;
const NAME_Y = 198, NAME_FS = 30;
const RAIL_Y = 262, LINE_X0 = 108, LINE_X1 = 470, TICK_H = 22, YEAR_FS = 34;
const Y_LEFT_R = 92, Y_RIGHT_L = 486; // the left year ends here, the right year starts here

export const DTimeline: React.FC<CardProps & { data: TimelineData }> = ({ tMs, w, fps, beats, assets, data }) => {
  const k = w / 994;
  const P = (v: number) => v * k;
  const from = data.from ?? "2024";
  const to = data.to ?? "2026";
  const n1 = data.names?.[0] ?? "Anthropic";
  const n2 = data.names?.[1] ?? "OpenAI";

  const bYears = beats.years ?? 6094;
  const bA = beats.anthropic ?? 6634;
  const bO = beats.openai ?? 7354;

  // the span is there from frame 0 as a faint track between the two years; the ink line draws
  // itself along it on "2 years," and the far tick takes the hit as the line lands
  const rail = draw(tMs, bYears, 330);
  const land = Math.sin(Math.PI * clamp01((tMs - (bYears + 260)) / 300));

  const markCss = (bMs: number, cx: number, h: number): React.CSSProperties => {
    const p = popSpring(tMs, bMs, fps);
    return {
      position: "absolute",
      left: P(cx),
      top: P(MARK_BOTTOM - h),
      height: P(h),
      width: "auto",
      opacity: clamp01(((tMs - bMs) / 1000) * fps / 2),
      transformOrigin: "50% 100%",
      transform: `translate(-50%, ${P(26 * (1 - Math.min(1, p)))}px) scale(${0.5 + 0.5 * p})`,
    };
  };

  const nameCss = (bMs: number, cx: number): React.CSSProperties => {
    const p = easeOut(at(tMs, bMs + 170, 230));
    return {
      position: "absolute",
      left: P(cx),
      top: P(NAME_Y),
      ...cap(P(NAME_FS), DINK),
      opacity: p,
      transform: `translate(-50%, ${P(12 * (1 - p))}px)`,
    };
  };

  const tick = (x: number, o: number, s: number): React.CSSProperties => ({
    position: "absolute",
    left: P(x - 2.5),
    top: P(RAIL_Y - (TICK_H * s) / 2),
    width: P(5),
    height: P(TICK_H * s),
    backgroundColor: DINK,
    opacity: o,
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        filter: data.halo ? "drop-shadow(0 0 10px rgba(255,255,255,0.9))" : undefined,
      }}
    >
      {/* the two real marks, bare, nothing behind them */}
      {assets[0] && <Img src={staticFile(assets[0])} style={markCss(bA, A_CX, A_H)} />}
      {assets[1] && <Img src={staticFile(assets[1])} style={markCss(bO, O_CX, O_H)} />}
      <div style={nameCss(bA, A_CX)}>{n1}</div>
      <div style={nameCss(bO, O_CX)}>{n2}</div>

      {/* the rail: 2024 ---- 2026 */}
      <div
        style={{
          position: "absolute",
          left: P(Y_LEFT_R),
          top: P(RAIL_Y - YEAR_FS / 2),
          ...mono(P(YEAR_FS), DINK),
          transform: "translate(-100%, 0)",
        }}
      >
        {from}
      </div>
      <div style={tick(LINE_X0, 1, 1)} />
      <div
        style={{
          position: "absolute",
          left: P(LINE_X0),
          top: P(RAIL_Y - 1.5),
          width: P(LINE_X1 - LINE_X0),
          height: P(3),
          backgroundColor: DINK,
          opacity: 0.2,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: P(LINE_X0),
          top: P(RAIL_Y - 2.5),
          width: P((LINE_X1 - LINE_X0) * rail),
          height: P(5),
          backgroundColor: DINK,
        }}
      />
      <div style={tick(LINE_X1, 1, 1 + 0.35 * land)} />
      <div
        style={{
          position: "absolute",
          left: P(Y_RIGHT_L),
          top: P(RAIL_Y - YEAR_FS / 2),
          ...mono(P(YEAR_FS), DINK),
          transformOrigin: "0% 50%",
          transform: `scale(${1 + 0.07 * land})`,
        }}
      >
        {to}
      </div>
    </div>
  );
};
