import React from "react";
import { Img, interpolate, spring, staticFile, Easing } from "remotion";
import { ACCENT, INK, MUTED, MONO_FONT, label } from "./theme";

// Two real accounts and their real lifetime numbers (ig.db), with the combined
// total rolling up. Real profile pictures, real handles, real figures: the card
// is a tally the creator could screenshot, not an illustration of one.
export type ReachRow = { handle: string; views: number; avatar: string };

const comma = (n: number) => Math.round(n).toLocaleString("en-US");

export const Reach: React.FC<{
  tMs: number;
  w: number;
  h: number;
  fps: number;
  rows: ReachRow[];
  total: number;
  beats: { rows: number; per?: number; total: number; totalMs?: number };
}> = ({ tMs, w, h, fps, rows, total, beats }) => {
  const P = Math.round(w * 0.030);
  const W = w - 2 * P;
  const per = beats.per ?? 180;

  const rowH = Math.round(h * 0.295);
  const av = Math.round(rowH * 0.76);
  const gap = Math.round(w * 0.022);
  const handleW = Math.round(W * 0.275);
  const numW = Math.round(W * 0.245);
  const barW = W - av - handleW - numW - 3 * gap;

  const maxViews = Math.max(...rows.map((r) => r.views));

  const rolled = interpolate(tMs, [beats.total, beats.total + (beats.totalMs ?? 900)], [0, total], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", inset: 0, padding: P, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      {rows.map((row, i) => {
        const at = beats.rows + i * per;
        const f = ((tMs - at) / 1000) * fps;
        const sp = spring({ frame: Math.max(0, f), fps, config: { damping: 16, stiffness: 320, mass: 0.7 } });
        const op = Math.min(1, Math.max(0, f / 2));
        const grow = interpolate(f, [0, 11], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div
            key={row.handle}
            style={{
              display: "flex", alignItems: "center", height: rowH, gap,
              opacity: op, transform: `scale(${0.95 + 0.05 * sp})`, transformOrigin: "left center",
            }}
          >
            <Img src={staticFile(row.avatar)} style={{ width: av, height: av, borderRadius: "50%", objectFit: "cover", display: "block" }} />
            <div style={{ width: handleW }}>
              <span style={{ fontFamily: MONO_FONT, fontSize: Math.round(h * 0.068), color: INK }}>{row.handle}</span>
            </div>
            <div style={{ width: barW }}>
              <div style={{ height: Math.round(h * 0.034), width: barW * (row.views / maxViews) * grow, background: ACCENT }} />
            </div>
            <div style={{ width: numW, textAlign: "right" }}>
              <span style={{ fontFamily: MONO_FONT, fontSize: Math.round(h * 0.072), fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>
                {comma(row.views)}
              </span>
            </div>
          </div>
        );
      })}

      <div style={{ flex: 1 }} />
      <div style={{ height: 1, background: INK, opacity: 0.18 }} />
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: Math.round(w * 0.026), marginTop: Math.round(h * 0.040), opacity: tMs >= beats.total ? 1 : 0 }}>
        <span style={{ fontFamily: MONO_FONT, fontSize: Math.round(h * 0.175), fontWeight: 700, color: ACCENT, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {comma(rolled)}
        </span>
        <span style={{ ...label(Math.round(h * 0.058), MUTED) }}>views</span>
      </div>
    </div>
  );
};
