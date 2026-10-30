import React from "react";
import { interpolate, Easing } from "remotion";
import { ACCENT, INK, MUTED, MONO_FONT, label } from "./theme";

// Their own two numbers, divided. The spoken figures land on their words, a rule
// draws, and what they actually mean per day lands under it. Nothing here is
// sourced from anywhere else: it is their claim and arithmetic on it.
export type Row = { value: string; name: string; atMs: number };

export const Receipt: React.FC<{
  tMs: number; w: number; h: number;
  rows: Row[]; results: Row[]; ruleAtMs: number;
}> = ({ tMs, w, h, rows, results, ruleAtMs }) => {
  const P = Math.round(w * 0.032);
  const inner = w - 2 * P;
  const valW = Math.round(inner * 0.46);
  const gap = Math.round(w * 0.022);
  const inH = Math.round(h * 0.145);
  const reH = Math.round(h * 0.195);
  const inFs = Math.round(h * 0.105);
  const reFs = Math.round(h * 0.140);
  const rule = interpolate(tMs, [ruleAtMs, ruleAtMs + 260], [0, 1], {
    easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  // the receipt writes itself, so it grows around the card's centre instead of
  // hanging off the top with a dead half underneath it
  const grow = (at: number) => interpolate(tMs, [at, at + 200], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ruleH = Math.round(h * 0.045);
  const blockH = rows.reduce((a, r) => a + inH * grow(r.atMs), 0)
    + ruleH * rule
    + results.reduce((a, r) => a + reH * grow(r.atMs), 0);
  const shift = Math.max(0, (h - blockH) / 2 - Math.round(h * 0.055));

  const line = (r: Row, hgt: number, fs: number, color: string, nameColor: string, k: number) => {
    const a = interpolate(tMs, [r.atMs, r.atMs + 200], [0, 1], {
      easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });
    return (
      <div key={r.name + k} style={{ height: hgt * a, overflow: "hidden", display: "flex", alignItems: "baseline", opacity: a }}>
        <span style={{
          width: valW, textAlign: "right", fontFamily: MONO_FONT, fontSize: fs, color,
          fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em",
        }}>{r.value}</span>
        <span style={{ width: gap }} />
        <span style={{ ...label(Math.round(fs * 0.50), nameColor), whiteSpace: "nowrap" }}>{r.name}</span>
      </div>
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0, padding: `${Math.round(h * 0.055)}px ${P}px`, transform: `translateY(${shift}px)` }}>
      {rows.map((r, i) => line(r, inH, inFs, INK, MUTED, i))}
      <div style={{ height: ruleH * rule, overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div style={{ width: inner * rule, height: 2, background: ACCENT }} />
      </div>
      {results.map((r, i) => line(r, reH, reFs, ACCENT, INK, 100 + i))}
    </div>
  );
};
