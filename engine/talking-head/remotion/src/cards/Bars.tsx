import React from "react";
import { interpolate, Easing } from "remotion";
import { ACCENT, INK, MUTED, MONO_FONT, label } from "./theme";

// A number is only impressive next to something. Their roommate's first three
// months are drawn against the two accounts this reel already showed, with
// their real lifetime totals from ig.db, so the scale is measured, not asserted.
export type Bar = { name: string; value: number; suffix?: string; atMs: number; rollMs?: number; lit?: boolean };

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export const Bars: React.FC<{
  tMs: number; w: number; h: number;
  bars: Bar[]; foot?: { to: number; name: string; atMs: number; rollMs?: number };
}> = ({ tMs, w, h, bars, foot }) => {
  const P = Math.round(w * 0.030);
  const rowW = w - 2 * P;
  const rowH = Math.round(h * 0.235);
  const barH = Math.round(h * 0.070);
  const nameFs = Math.round(h * 0.055);
  const valFs = Math.round(h * 0.078);
  const max = Math.max(...bars.map((b) => b.value));

  return (
    <div style={{ position: "absolute", inset: 0, padding: `${Math.round(h * 0.055)}px ${P}px` }}>
      {bars.map((b, i) => {
        const roll = b.rollMs ?? 700;
        const p = interpolate(tMs, [b.atMs, b.atMs + roll], [0, 1], {
          easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        const shown = fmt(b.value * p) + (p >= 1 ? (b.suffix ?? "") : "");
        return (
          <div key={b.name} style={{ height: rowH, opacity: tMs >= b.atMs ? 1 : 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ ...label(nameFs, b.lit ? ACCENT : MUTED), whiteSpace: "nowrap" }}>{b.name}</span>
              <span style={{ fontFamily: MONO_FONT, fontSize: valFs, color: b.lit ? INK : MUTED, fontVariantNumeric: "tabular-nums" }}>{shown}</span>
            </div>
            <div style={{ marginTop: Math.round(h * 0.026), width: rowW, height: barH, background: "rgba(255,255,255,0.08)" }}>
              <div style={{ width: (b.value / max) * rowW * p, height: barH, background: b.lit ? ACCENT : "rgba(255,255,255,0.30)" }} />
            </div>
          </div>
        );
      })}
      {foot && (() => {
        const p = interpolate(tMs, [foot.atMs, foot.atMs + (foot.rollMs ?? 700)], [0, 1], {
          easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        return (
          <div style={{ marginTop: Math.round(h * 0.030), display: "flex", alignItems: "baseline", gap: Math.round(w * 0.018), opacity: tMs >= foot.atMs ? 1 : 0 }}>
            <span style={{ fontFamily: MONO_FONT, fontSize: Math.round(h * 0.145), color: ACCENT, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {"+" + fmt(foot.to * p)}
            </span>
            <span style={{ ...label(Math.round(h * 0.070), INK), whiteSpace: "nowrap" }}>{foot.name}</span>
          </div>
        );
      })()}
    </div>
  );
};
