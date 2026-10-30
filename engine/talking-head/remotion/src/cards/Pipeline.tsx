import React from "react";
import { interpolate, Easing } from "remotion";
import { ACCENT, INK, MUTED, MONO_FONT, label } from "./theme";

// One take in, one finished reel out, with this project's real numbers on every
// chip. The arrows draw left to right so the chain reads as a run, not a diagram.
export type Chip = { name: string; value: string };

export const Pipeline: React.FC<{
  tMs: number; w: number; h: number;
  chips: Chip[];
  beats: { start: number; per?: number };
}> = ({ tMs, w, h, chips, beats }) => {
  const P = Math.round(w * 0.028);
  const per = beats.per ?? 300;
  const n = chips.length;
  const arrow = Math.round(w * 0.030);
  const cw = (w - 2 * P - arrow * (n - 1)) / n;
  const ch = Math.round(h * 0.56);

  return (
    <div style={{ position: "absolute", inset: 0, padding: P, boxSizing: "border-box", display: "flex", alignItems: "center" }}>
      {chips.map((c, i) => {
        const at = beats.start + i * per;
        const a = interpolate(tMs, [at, at + 190], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const last = i === n - 1;
        const aw = interpolate(tMs, [at + 190, at + per], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <React.Fragment key={c.name}>
            <div style={{
              width: cw, height: ch, boxSizing: "border-box",
              background: last ? "rgba(224,120,80,0.14)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${last ? ACCENT : "rgba(255,255,255,0.14)"}`,
              opacity: a, transform: `scale(${0.94 + 0.06 * a})`,
              display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: Math.round(h * 0.030),
            }}>
              <span style={{ ...label(Math.round(h * 0.062), last ? ACCENT : MUTED), whiteSpace: "nowrap" }}>{c.name}</span>
              <span style={{ fontFamily: MONO_FONT, fontSize: Math.round(h * 0.065), color: INK, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{c.value}</span>
            </div>
            {!last && (
              <div style={{ width: arrow, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ height: 2, width: arrow * 0.7 * aw, background: ACCENT }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
