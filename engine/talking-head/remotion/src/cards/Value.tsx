import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, BAR_GREY, CARD_BG, INK, label } from "./theme";

// "But ALMOST ALL of the value's actually in the EXECUTION. And that has ALWAYS
// BEEN THE HARD PART." One bar is the whole of the value. A divider slams down
// near the left edge: the sliver you get for knowing what to do goes grey, the
// rest of it fills terracotta, and on the last beat that block gains hatching,
// a hard shadow and sags out of the bar under its own weight. No percentages
// and no numbers anywhere: the proportion itself is the claim.
// Frameless, and their wall is bright cream: the bar is a SOLID near-black object,
// both segments are solid fills on it, and every word carries a halo as well as
// the offset shadow. Nothing here is an outline on bare footage.

const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";
const PLATE = 0.0;  // no bed under the bar: the segments are solid already

export const Value: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  whole: string; sliver: string; rest: string; hard: string;
  beats: { split: number; hard: number };
}> = ({ tMs, w, h, fps, fromMs, whole, sliver, rest, hard, beats }) => {
  const barW = 0.88 * w;
  const barX = (w - barW) / 2;
  const barH = 0.22 * h;
  const barY = 0.32 * h;
  const bw = 0.007 * w;        // outline and divider, heavy enough for the wall
  const hatchW = 0.005 * w;    // the hatch sits ON the terracotta, not on the wall
  const halo = `0px 0px ${0.012 * w}px rgba(0,0,0,0.92)`;
  const ink = `${halo}, ${SHADOW}`;
  const box = `${halo}, 0px 6px 26px rgba(0,0,0,0.7)`;
  const sliverW = 0.12 * barW;
  const restX = barX + sliverW;
  const restW = barW - sliverW;

  const sp = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 300, mass: 0.7 } });
  const ramp = (a: number, b: number) => interpolate(tMs, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const draw = Math.min(1, sp(fromMs + 60));            // the bar is measured out left to right
  const slam = sp(beats.split);                          // the divider comes down hard
  const greyIn = ramp(beats.split, beats.split + 160);
  const fill = ramp(beats.split + 140, beats.split + 390); // ~250 ms of terracotta
  const restIn = sp(beats.split + 300);
  const sag = sp(beats.hard);                            // drops and settles
  const hatch = ramp(beats.hard, beats.hard + 240);
  const hardIn = sp(beats.hard + 120);
  const drop = 0.02 * h * sag;

  const hatchStep = 0.030 * w;
  const hatchLines: number[] = [];
  for (let x = -barH; x < restW; x += hatchStep) hatchLines.push(x);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {/* what the bar is */}
      <div style={{
        position: "absolute", left: 0, top: 0.155 * h, width: w, textAlign: "center",
        ...label(0.046 * w, INK), textShadow: ink,
        opacity: Math.min(1, draw * 2.2),
      }}>
        {whole}
      </div>

      {/* the bar is a solid object before it is anything else */}
      <div style={{
        position: "absolute", left: barX, top: barY, width: barW * draw, height: barH,
        backgroundColor: CARD_BG, opacity: PLATE, borderRadius: 0, boxShadow: box,
      }} />

      {/* the sliver you get for knowing what to do: wiped in, never translucent */}
      {greyIn > 0 && (
        <div style={{
          position: "absolute", left: barX, top: barY, width: sliverW * greyIn, height: barH,
          backgroundColor: BAR_GREY, borderRadius: 0,
        }} />
      )}

      {/* the execution block: fills, then hatches and sags out of the bar */}
      {fill > 0 && (
        <div style={{
          position: "absolute", left: restX, top: barY, width: restW, height: barH,
          transform: `translateY(${drop}px)`, borderRadius: 0,
          boxShadow: sag > 0.02 ? `${halo}, ${0.012 * w}px ${0.012 * w}px 0px rgba(0,0,0,${0.85 * Math.min(1, sag)})` : undefined,
        }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: restW * fill, backgroundColor: ACCENT, boxShadow: halo }} />
          {hatch > 0 && (
            <svg width={restW} height={barH} style={{ position: "absolute", left: 0, top: 0, opacity: hatch }}>
              <title>the hard part</title>
              {hatchLines.map((x) => (
                <line key={x} x1={x} y1={barH} x2={x + barH} y2={0} stroke={CARD_BG} strokeOpacity={0.34} strokeWidth={hatchW} />
              ))}
            </svg>
          )}
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            ...label(0.058 * w, CARD_BG), lineHeight: 1,
            opacity: Math.min(1, restIn * 2), transform: `scale(${0.9 + 0.1 * Math.min(1, restIn)})`,
          }}>
            {rest}
          </div>
        </div>
      )}

      {/* the divider, slamming through the bar */}
      {slam > 0 && (
        <div style={{
          position: "absolute", left: restX - bw * 0.6, top: barY - 0.012 * h,
          width: bw * 1.2, height: barH + 0.024 * h, backgroundColor: INK,
          transform: `translateY(${(1 - slam) * -0.07 * h}px)`, boxShadow: box, borderRadius: 0,
        }} />
      )}

      {/* the bar itself, outlined, measured out left to right */}
      <div style={{
        position: "absolute", left: barX, top: barY, width: barW * draw, height: barH,
        border: `${bw}px solid ${INK}`, borderRadius: 0, boxSizing: "border-box", boxShadow: box,
      }} />

      {/* what the small grey piece is */}
      <div style={{
        position: "absolute", left: barX, top: barY + barH + 0.075 * h,
        ...label(0.042 * w, INK), whiteSpace: "nowrap", textShadow: ink,
        opacity: Math.min(1, greyIn * 1.4),
      }}>
        {sliver}
      </div>

      {/* and that has always been the hard part */}
      <div style={{
        position: "absolute", left: 0, top: barY + barH + 0.208 * h, width: w, textAlign: "center",
        ...label(0.044 * w, INK), textShadow: ink,
        opacity: Math.min(1, hardIn * 2), transform: `translateY(${(1 - Math.min(1, hardIn)) * 0.02 * h}px)`,
      }}>
        {hard}
      </div>
    </div>
  );
};
