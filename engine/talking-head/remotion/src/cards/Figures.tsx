import React from "react";
import { interpolate, Easing } from "remotion";
import { ACCENT, INK, MUTED, MONO_FONT, label } from "./theme";

// Two figures, each rolling up on the word that says it, with what they are
// under them. No fake screenshot behind them: these are their spoken numbers.
export type Figure = { to: number; suffix?: string; name: string; atMs: number; rollMs?: number };

const comma = (n: number) => Math.round(n).toLocaleString("en-US");

export const Figures: React.FC<{
  tMs: number; w: number; h: number; figures: Figure[]; note?: string; noteAtMs?: number;
}> = ({ tMs, w, h, figures, note, noteAtMs }) => {
  const P = Math.round(w * 0.030);
  return (
    <div style={{ position: "absolute", inset: 0, padding: P, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {figures.map((f, i) => {
          const v = interpolate(tMs, [f.atMs, f.atMs + (f.rollMs ?? 800)], [0, f.to], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <React.Fragment key={f.name}>
              {i > 0 && <div style={{ width: 1, background: INK, opacity: 0.16, margin: `0 ${Math.round(w * 0.020)}px` }} />}
              <div style={{ flex: 1, textAlign: "center", opacity: tMs >= f.atMs ? 1 : 0 }}>
                <div style={{ fontFamily: MONO_FONT, fontSize: Math.round(h * 0.175), fontWeight: 700, color: ACCENT, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {comma(v)}{f.suffix ?? ""}
                </div>
                <div style={{ marginTop: Math.round(h * 0.055), ...label(Math.round(h * 0.080), MUTED) }}>{f.name}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {note && (
        <div style={{ marginTop: Math.round(h * 0.075), textAlign: "center", opacity: tMs >= (noteAtMs ?? 0) ? 1 : 0 }}>
          <span style={{ ...label(Math.round(h * 0.072), INK) }}>{note}</span>
        </div>
      )}
    </div>
  );
};
