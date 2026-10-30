import React from "react";
import { interpolate, Easing } from "remotion";
import { ACCENT, INK, MUTED, MONO_FONT, label } from "./theme";

// What you used to have to learn before you could make a video look like this.
// The list lands, then strikes through one line at a time, and what is actually
// required now takes its place: the picture of "no editing background".
export const CraftList: React.FC<{
  tMs: number; w: number; h: number;
  items: string[]; land: string;
  beats: { list: number; per?: number; strike: number; strikePer?: number; land: number };
}> = ({ tMs, w, h, items, land, beats }) => {
  const P = Math.round(w * 0.032);
  const per = beats.per ?? 90;
  const sper = beats.strikePer ?? 90;
  const fs = Math.round(h * 0.088);
  const rowH = Math.round(h * 0.145);

  return (
    <div style={{ position: "absolute", inset: 0, padding: P, boxSizing: "border-box" }}>
      {items.map((it, i) => {
        const at = beats.list + i * per;
        const a = interpolate(tMs, [at, at + 160], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const st = interpolate(tMs, [beats.strike + i * sper, beats.strike + i * sper + 190], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={it} style={{ height: rowH, display: "flex", alignItems: "center", opacity: a * (1 - st * 0.55), transform: `translateY(${(1 - a) * 10}px)` }}>
            <span style={{ width: Math.round(w * 0.05), fontFamily: MONO_FONT, fontSize: fs * 0.8, color: MUTED }}>{st > 0.5 ? "✕" : "•"}</span>
            <span style={{ position: "relative", ...label(fs, INK) }}>
              {it}
              <span style={{ position: "absolute", left: 0, top: "52%", height: 2, width: `${st * 100}%`, background: MUTED }} />
            </span>
          </div>
        );
      })}
      <div style={{ height: 1, background: INK, opacity: 0.16, margin: `${Math.round(h * 0.030)}px 0` }} />
      <div style={{ opacity: tMs >= beats.land ? 1 : 0, display: "flex", alignItems: "center" }}>
        <span style={{ width: Math.round(w * 0.05), fontFamily: MONO_FONT, fontSize: fs * 0.8, color: ACCENT }}>{"→"}</span>
        <span style={{ ...label(fs * 1.06, ACCENT) }}>{land}</span>
      </div>
    </div>
  );
};
