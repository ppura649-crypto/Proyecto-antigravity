import React from "react";
import { Img, interpolate, staticFile, Easing } from "remotion";
import { ACCENT, INK, MUTED, MONO_FONT, label } from "./theme";

// The template itself: this project's real format.json, typed in line by line.
// With `frames` it steps aside and the video comes out the other end wearing the
// style; with `fan` it multiplies into the set that goes live.
export type TplLine = { t: string; tone?: "key" | "str" | "num" | "punct" };

const tone = (x?: string) => (x === "key" ? "#9CC7FF" : x === "str" ? ACCENT : x === "num" ? "#C3E88D" : MUTED);

export const Template: React.FC<{
  tMs: number; w: number; h: number;
  file: string; lines: TplLine[];
  beats: { type: number; per?: number; apply?: number };
  frames?: string[]; fan?: boolean; note?: string;
}> = ({ tMs, w, h, file, lines, beats, frames, fan, note }) => {
  const P = Math.round(w * 0.030);
  const per = beats.per ?? 90;
  const cardW = w - 2 * P;
  const shrink = frames ? 0.44 : 1; // in apply mode the file recedes whole, it never reflows
  const fs = Math.round(h * 0.066);
  const lh = Math.round(fs * 1.38);

  const sheet = (x: number, y: number, k: number, dim: number, z: number, bare = false) => (
    <div key={k} style={{
      position: "absolute", left: x, top: y, width: cardW, height: fan ? (h - 2 * P) / 0.55 : h - 2 * P, zIndex: z,
      background: bare ? "#141418" : "#0E0E10", border: `1px solid rgba(255,255,255,${bare ? 0.26 : 0.14})`, boxSizing: "border-box",
      opacity: dim, overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: `${Math.round(h * 0.030)}px ${Math.round(w * 0.020)}px 0` }}>
        <div style={{ width: fs * 0.42, height: fs * 0.42, background: ACCENT }} />
        <span style={{ fontFamily: MONO_FONT, fontSize: fs * 0.86, color: MUTED }}>{file}</span>
      </div>
      <div style={{ padding: `${Math.round(h * 0.026)}px ${Math.round(w * 0.020)}px` }}>
        {(bare ? [] : lines).map((l, i) => {
          const at = beats.type + i * per;
          if (tMs < at) return <div key={i} style={{ height: lh }} />;
          return (
            <div key={i} style={{ height: lh, fontFamily: MONO_FONT, fontSize: fs, lineHeight: `${lh}px`, color: tone(l.tone), whiteSpace: "pre" }}>{l.t}</div>
          );
        })}
      </div>
    </div>
  );

  if (fan) {
    // the same file, three times: each copy is the whole sheet scaled down, never
    // a narrower sheet, so the JSON never reflows or clips mid-string
    const k = 0.55; // must match the sheet height divisor above
    const off = Math.round(w * 0.055);
    const seat = (x: number, dim: number, z: number, bare: boolean, key: number) => (
      <div key={key} style={{ position: "absolute", left: x, top: 0, width: cardW * k, height: h - 2 * P, zIndex: z, overflow: "hidden" }}>
        <div style={{ width: cardW, height: (h - 2 * P) / k, transform: `scale(${k})`, transformOrigin: "left top" }}>
          {sheet(0, 0, key, dim, z, bare)}
        </div>
      </div>
    );
    return (
      <div style={{ position: "absolute", inset: 0, padding: P, boxSizing: "border-box" }}>
        <div style={{ position: "relative", width: w - 2 * P, height: h - 2 * P }}>
          {seat(off * 2, 0.30, 1, true, 2)}
          {seat(off, 0.55, 2, true, 1)}
          {seat(0, 1, 3, false, 0)}
          {note && (
            <div style={{ position: "absolute", right: 0, bottom: Math.round(h * 0.06), width: Math.round((w - 2 * P) * 0.30), textAlign: "right" }}>
              <span style={{ ...label(Math.round(h * 0.070), ACCENT) }}>{note}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const ap = beats.apply !== undefined
    ? interpolate(tMs, [beats.apply, beats.apply + 420], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;
  const frW = frames ? Math.round((w - 2 * P) * 0.135) : 0;
  const frH = Math.round(frW * (534 / 300));
  const seatW = Math.round(cardW * shrink);

  return (
    <div style={{ position: "absolute", inset: 0, padding: P, boxSizing: "border-box" }}>
      <div style={{ position: "relative", width: w - 2 * P, height: h - 2 * P }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: cardW, height: h - 2 * P, transform: `scale(${shrink})`, transformOrigin: "left center" }}>
          {sheet(0, 0, 0, 1, 2)}
        </div>
        {frames && (
          <>
            <div style={{ position: "absolute", left: seatW + Math.round(w * 0.016), top: (h - 2 * P) / 2 - 1, width: Math.round(w * 0.045) * ap, height: 2, background: ACCENT }} />
            <div style={{ position: "absolute", left: seatW + Math.round(w * 0.075), top: (h - 2 * P) / 2 - frH / 2, display: "flex", gap: Math.round(w * 0.014) }}>
              {frames.map((f, i) => {
                const a = interpolate(tMs, [(beats.apply ?? 0) + 260 + i * 150, (beats.apply ?? 0) + 460 + i * 150], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                return (
                  <div key={f} style={{ width: frW, height: frH, overflow: "hidden", background: "#000" }}>
                    <Img src={staticFile(f)} style={{ width: frW, height: frH, objectFit: "cover", display: "block", clipPath: `inset(0 ${(1 - a) * 100}% 0 0)` }} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
