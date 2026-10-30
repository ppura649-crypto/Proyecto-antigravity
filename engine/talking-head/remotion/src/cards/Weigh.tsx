import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, INK, MONO_FONT, MUTED, label } from "./theme";

// PROOF card: the trade the creator states out loud, with both real numbers from the
// same source, side by side. The cost is stated plainly in grey, the payoff
// lands second and in terracotta, and the page it comes from is named under
// them, so the claim is checkable rather than asserted.
export const Weigh: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  left: { label: string; value: string; note: string };
  right: { label: string; value: string; note: string };
  source?: string;
  beats?: { right?: number };
}> = ({ tMs, w, h, fps, fromMs, left, right, source, beats = {} }) => {
  const pad = 0.055 * w;
  const labelFs = 0.030 * w;
  const noteFs = 0.026 * w;
  const srcFs = 0.024 * w;
  const rAt = beats.right ?? fromMs + 1400;
  const sp = (ms: number) => spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 300, mass: 0.7 } });
  const l = sp(fromMs + 80);
  const r = sp(rAt);
  const srcO = interpolate(tMs, [rAt + 500, rAt + 900], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const colW = (w - 2 * pad) / 2;

  const col = (d: { label: string; value: string; note: string }, accent: boolean, s: number) => (
    <div style={{
      width: colW, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.028 * h,
      opacity: Math.min(1, s * 2), transform: `translateY(${(1 - s) * 0.03 * h}px)`,
    }}>
      <div style={label(labelFs, accent ? ACCENT : MUTED)}>{d.label}</div>
      <div style={{
        fontFamily: MONO_FONT, fontWeight: 600, lineHeight: 1,
        fontSize: (accent ? 0.115 : 0.092) * w, color: accent ? ACCENT : INK,
        transform: `scale(${0.86 + 0.14 * s})`,
      }}>{d.value}</div>
      <div style={{ fontFamily: MONO_FONT, fontSize: noteFs, color: MUTED, textAlign: "center", lineHeight: 1.35, maxWidth: colW * 0.94 }}>{d.note}</div>
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, padding: pad, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
        {col(left, false, l)}
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(255,255,255,0.16)" }} />
        {col(right, true, r)}
      </div>
      {source && (
        <div style={{ marginTop: 0.075 * h, textAlign: "center", fontFamily: MONO_FONT, fontSize: srcFs, color: "rgba(255,255,255,0.42)", opacity: srcO }}>
          {source}
        </div>
      )}
    </div>
  );
};
