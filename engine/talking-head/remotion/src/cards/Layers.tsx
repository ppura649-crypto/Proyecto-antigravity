import React from "react";
import { Img, interpolate, staticFile, Easing } from "remotion";
import { ACCENT, INK, MUTED, MONO_FONT, label } from "./theme";

// A real frame of this video, built in front of you: the cut, then the caption,
// then the overlay, each landing on the word that names it, and the ticks filling
// on the right. The frame is a still of the mastered spine, before any layer.
export const Layers: React.FC<{
  tMs: number; w: number; h: number;
  frame: string; rows: string[]; note: string;
  beats: { cuts: number; captions: number; visuals: number; made: number };
  captionWord: string;
  captionFont?: string;
}> = ({ tMs, w, h, frame, rows, note, beats, captionWord, captionFont }) => {
  const P = Math.round(w * 0.030);
  const fh = h - 2 * P;
  const fw = Math.round((fh * 9) / 16);
  const at = [beats.cuts, beats.captions, beats.visuals];
  const ease = { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
  const a = at.map((t) => interpolate(tMs, [t, t + 220], [0, 1], ease));
  const made = interpolate(tMs, [beats.made, beats.made + 240], [0, 1], ease);
  const colX = P + fw + Math.round(w * 0.055);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: P, top: P, width: fw, height: fh, overflow: "hidden", background: "#000" }}>
        <Img src={staticFile(frame)} style={{ width: fw, height: fh, objectFit: "cover", display: "block" }} />
        {/* the cut: a filmstrip edge along the bottom */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: fh * 0.10, display: "flex", gap: 2, opacity: a[0] }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ flex: 1, background: ACCENT, opacity: 0.85, transform: `scaleX(${a[0]})`, transformOrigin: "left" }} />
          ))}
        </div>
        {/* the caption: the real word, in the reel's own face */}
        <div style={{ position: "absolute", left: 0, right: 0, top: fh * 0.66, textAlign: "center", opacity: a[1] }}>
          <span style={{ fontFamily: captionFont ?? "inherit", fontWeight: 700, fontSize: fh * 0.062, color: "#fff", letterSpacing: "0.005em", textShadow: "0px 2px 6px rgba(0,0,0,0.9)" }}>{captionWord}</span>
        </div>
        {/* the overlay: a card in the band, where this video puts them */}
        <div style={{ position: "absolute", left: fw * 0.07, top: fh * 0.11, width: fw * 0.86, height: fh * 0.17, background: "#08080a", border: "1px solid rgba(255,255,255,0.16)", boxSizing: "border-box", opacity: a[2], display: "flex", alignItems: "center", padding: fw * 0.05 }}>
          <div style={{ display: "flex", gap: 2, width: "100%" }}>
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: fh * 0.05, background: i % 3 === 0 ? ACCENT : "rgba(255,255,255,0.35)" }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: colX, top: P, width: w - colX - P, height: fh, display: "flex", flexDirection: "column", justifyContent: "center", gap: Math.round(h * 0.075) }}>
        {rows.map((r, i) => (
          <div key={r} style={{ display: "flex", alignItems: "center", gap: Math.round(w * 0.022), opacity: a[i] }}>
            <span style={{ fontFamily: MONO_FONT, fontSize: Math.round(h * 0.085), color: ACCENT }}>✓</span>
            <span style={{ ...label(Math.round(h * 0.090), INK) }}>{r}</span>
          </div>
        ))}
        <div style={{ height: 1, background: INK, opacity: 0.16 * made }} />
        <span style={{ ...label(Math.round(h * 0.072), MUTED), opacity: made }}>{note}</span>
      </div>
    </div>
  );
};
