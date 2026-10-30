import React from "react";
import { spring } from "remotion";
import { ACCENT, INK, MONO_FONT, MUTED } from "./theme";
import { Head } from "./Head";
import { Mascot } from "./Mascot";

// "But 10 agents only working on one task each allows for a lot more depth and
// higher quality." The answer to the Overload card and deliberately the other
// axis: a row instead of a pile, and instead of a meter draining, a depth bar
// growing DOWN under every one of them.
export const Spread: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  head: string; agents?: number; score: string;
  startMs?: number; perMs?: number; depthAtMs?: number; scoreAtMs?: number;
  depthLabel: string; meterLabel: string;
}> = ({ tMs, w, h, fps, fromMs, head, agents = 10, score, startMs, perMs = 150, depthAtMs, scoreAtMs, depthLabel, meterLabel }) => {
  const pad = 0.045 * w;
  const start = startMs ?? fromMs + 150;
  const dAt = depthAtMs ?? fromMs + 2600;
  const sAt = scoreAtMs ?? fromMs + 4200;
  const inner = w - 2 * pad;
  const cell = inner / agents;
  const icon = cell * 0.72;
  const iconH = icon * (20 / 24);
  const chipH = 0.020 * h;

  const sp = (ms: number, d = 13) => spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: d, stiffness: 320, mass: 0.6 } });
  const grow = sp(dAt, 16);
  const sc = sp(sAt, 12);

  const rowTop = pad + 0.10 * h;
  const barTop = rowTop + iconH + 0.030 * h;
  const barMax = h - pad - barTop - 0.075 * h;

  return (
    <div style={{ position: "absolute", inset: 0, padding: pad, boxSizing: "border-box" }}>
      <Head w={w} left={head} right={score} rightColor={sc > 0.05 ? ACCENT : "transparent"} />
      {Array.from({ length: agents }).map((_, i) => {
        const s = sp(start + i * perMs);
        if (s <= 0) return null;
        const g = Math.min(1, Math.max(0, grow * 1.25 - i * 0.03));
        const bh = barMax * (0.42 + 0.058 * ((i * 5) % 10)) * g;
        return (
          <div key={i} style={{ position: "absolute", left: pad + i * cell, top: rowTop, width: cell, opacity: Math.min(1, s * 2), transform: `scale(${0.78 + 0.22 * s})` }}>
            {/* the one task it holds */}
            <div style={{ width: cell * 0.62, height: chipH, marginLeft: cell * 0.19, marginBottom: 0.014 * h, backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.6)" }} />
            <div style={{ display: "flex", justifyContent: "center" }}><Mascot size={icon} /></div>
          </div>
        );
      })}
      {/* the depth each one gets */}
      {Array.from({ length: agents }).map((_, i) => {
        const s = sp(start + i * perMs);
        if (s <= 0) return null;
        const g = Math.min(1, Math.max(0, grow * 1.25 - i * 0.03));
        const bh = barMax * (0.52 + 0.048 * ((i * 7) % 8)) * g;
        return (
          <div key={`b${i}`} style={{
            position: "absolute", left: pad + i * cell + cell * 0.30, top: barTop + 0.012 * h,
            width: cell * 0.40, height: bh, backgroundColor: ACCENT, opacity: 0.92,
            boxShadow: "0 3px 12px rgba(0,0,0,0.5)",
          }} />
        );
      })}
      <div style={{ position: "absolute", left: pad, bottom: 0.028 * h, fontFamily: MONO_FONT, fontSize: 0.022 * w, color: MUTED, opacity: Math.min(1, grow * 2) }}>
        {depthLabel}
      </div>
      <div style={{ position: "absolute", right: pad, bottom: 0.028 * h, fontFamily: MONO_FONT, fontSize: 0.022 * w, color: MUTED, opacity: Math.min(1, sc * 2) }}>
        {meterLabel}
      </div>
    </div>
  );
};
