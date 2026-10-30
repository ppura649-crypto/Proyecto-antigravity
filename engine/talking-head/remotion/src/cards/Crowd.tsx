import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, INK, MONO_FONT } from "./theme";
import { Head } from "./Head";
import { Mascot } from "./Mascot";

// "And I feel like too few people know about this."
// A hundred Claudes, three of them lit. No number is claimed anywhere: the
// picture IS the sentence, which is the only way to show "too few" without
// inventing a statistic.
export const Crowd: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  total?: number; cols?: number; lit?: number[]; note: string; head: string;
  litAtMs?: number;
}> = ({ tMs, w, h, fps, fromMs, total = 100, cols = 20, lit = [], note, head, litAtMs }) => {
  const pad = 0.045 * w;
  const inner = w - 2 * pad;
  const rows = Math.ceil(total / cols);
  const cell = inner / cols;
  const icon = cell * 0.86;
  const at = litAtMs ?? fromMs + 900;
  const litSet = new Set(lit);

  const gridIn = interpolate(tMs, [fromMs, fromMs + 420], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const noteIn = spring({ frame: Math.max(0, ((tMs - at) / 1000) * fps), fps, config: { damping: 14, stiffness: 300, mass: 0.7 } });

  // the lit three are found by a wave that runs across the grid, so the eye is
  // led to them instead of having to hunt
  const gridH = rows * cell;
  const noteFs = 0.030 * w;

  return (
    <div style={{ position: "absolute", inset: 0, padding: pad, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <Head w={w} left={head} />
      <div style={{ position: "relative", width: inner, height: gridH, alignSelf: "center" }}>
        {Array.from({ length: total }).map((_, i) => {
          const on = litSet.has(i);
          const appear = Math.min(1, Math.max(0, gridIn * total * 1.6 - i));
          if (appear <= 0) return null;
          const s = on ? spring({ frame: Math.max(0, ((tMs - (at + [...litSet].indexOf(i) * 140)) / 1000) * fps), fps, config: { damping: 12, stiffness: 320, mass: 0.6 } }) : 0;
          return (
            <div key={i} style={{
              position: "absolute",
              left: (i % cols) * cell, top: Math.floor(i / cols) * cell,
              width: cell, height: cell, display: "flex", alignItems: "center", justifyContent: "center",
              opacity: appear * (on ? 1 : 0.9),
              transform: `translateY(${-s * 0.16 * cell}px) scale(${1 + 0.55 * s})`,
              zIndex: on ? 2 : 1,
            }}>
              <svg height={icon * (20 / 24)} viewBox="0 0 24 24" style={{ display: "block" }}>
                <path
                  clipRule="evenodd"
                  d="M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z"
                  fill={on ? ACCENT : "#4b4b52"}
                  fillRule="evenodd"
                />
              </svg>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 0.016 * w, opacity: Math.min(1, noteIn * 2), transform: `translateY(${(1 - noteIn) * 0.02 * h}px)` }}>
        <Mascot size={0.045 * w} glow={false} />
        <div style={{ fontFamily: MONO_FONT, fontSize: noteFs, color: INK }}>
          <span style={{ color: ACCENT }}>{note}</span>
        </div>
      </div>
    </div>
  );
};
