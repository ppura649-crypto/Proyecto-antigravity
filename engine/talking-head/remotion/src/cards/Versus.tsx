import React from "react";
import { spring } from "remotion";
import { ACCENT, INK, MONO_FONT, MUTED, label } from "./theme";
import { Mascot, SHADOW } from "./Mascot";

// TEACHING card for the line the whole video turns on: the same ten tasks on
// one Claude, then one task each on ten. The left side is visibly loaded, the
// right side is visibly spread, and the two scores are their own words.
export const Versus: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  left: { title: string; sub: string; score: string };
  right: { title: string; sub: string; score: string };
  tasks?: number; agents?: number;
  beats?: { left?: number; score1?: number; right?: number; score2?: number };
}> = ({ tMs, w, h, fps, fromMs, left, right, tasks = 10, agents = 10, beats = {} }) => {
  const pad = 0.045 * w;
  const colW = (w - 2 * pad) / 2 - 0.02 * w;
  const titleFs = 0.028 * w;
  const subFs = 0.023 * w;
  const scoreFs = 0.098 * w;
  const at = {
    left: beats.left ?? fromMs + 120,
    score1: beats.score1 ?? fromMs + 2600,
    right: beats.right ?? fromMs + 4200,
    score2: beats.score2 ?? fromMs + 6400,
  };
  const sp = (ms: number, d = 14) => spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: d, stiffness: 300, mass: 0.7 } });

  const chipH = Math.max(10, 0.022 * h);
  const chipGap = Math.max(5, 0.010 * h);
  const bigIcon = 0.125 * w;
  const smIcon = 0.052 * w;

  const head = (t: string, s: string, on: number, accent: boolean) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.014 * h, opacity: Math.min(1, on * 2) }}>
      <div style={{ ...label(titleFs, accent ? ACCENT : INK), textShadow: SHADOW }}>{t}</div>
      <div style={{ fontFamily: MONO_FONT, fontSize: subFs, color: MUTED, textShadow: SHADOW }}>{s}</div>
    </div>
  );
  const score = (v: string, on: number, accent: boolean) => (
    <div style={{
      fontFamily: MONO_FONT, fontWeight: 600, fontSize: scoreFs, lineHeight: 1,
      color: accent ? ACCENT : "rgba(255,255,255,0.9)", textShadow: SHADOW,
      opacity: Math.min(1, on * 2), transform: `scale(${0.8 + 0.2 * on})`,
    }}>{v}</div>
  );

  const l = sp(at.left);
  const r = sp(at.right);
  // until the ten exist there is no comparison: the single Claude sits in the
  // middle of the card and slides to its side when the right half arrives
  const slide = (colW + 0.02 * w) / 2;
  const cols = 5;
  const cell = colW / cols;

  return (
    <div style={{ position: "absolute", inset: 0, padding: pad, boxSizing: "border-box", display: "flex", justifyContent: "space-between", position: "relative" }}>
      <div style={{ position: "absolute", left: "50%", top: pad * 0.6, bottom: pad * 0.6, width: 1, backgroundColor: "rgba(255,255,255,0.30)", opacity: Math.min(1, r * 2) }} />

      <div style={{ width: colW, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", transform: `translateX(${slide * (1 - Math.min(1, r * 1.2))}px)` }}>
        {head(left.title, left.sub, l, false)}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.022 * h }}>
          <div style={{ display: "flex", flexDirection: "column", gap: chipGap, alignItems: "center" }}>
            {Array.from({ length: tasks }).map((_, i) => {
              const s = sp(at.left + i * 55, 16);
              return <div key={i} style={{
                width: colW * (0.58 + 0.03 * (i % 3)), height: chipH, borderRadius: chipH,
                backgroundColor: "rgba(255,255,255,0.62)", opacity: Math.min(1, s * 2),
                boxShadow: "0px 2px 8px rgba(0,0,0,0.75)",
                transform: `scaleX(${0.6 + 0.4 * s})`,
              }} />;
            })}
          </div>
          <div style={{ opacity: Math.min(1, l * 2), transform: `scale(${0.85 + 0.15 * l})` }}><Mascot size={bigIcon} /></div>
        </div>
        {score(left.score, sp(at.score1), false)}
      </div>

      <div style={{ width: colW, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", opacity: Math.min(1, r * 2) }}>
        {head(right.title, right.sub, r, true)}
        <div style={{ display: "flex", flexWrap: "wrap", width: colW, justifyContent: "center", rowGap: 0.045 * h }}>
          {Array.from({ length: agents }).map((_, i) => {
            const s = sp(at.right + i * 70);
            return (
              <div key={i} style={{ width: cell, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.012 * h, opacity: Math.min(1, s * 2), transform: `scale(${0.7 + 0.3 * s})` }}>
                <Mascot size={smIcon} />
                <div style={{ width: cell * 0.66, height: chipH, borderRadius: chipH, backgroundColor: ACCENT, opacity: 0.95, boxShadow: "0px 2px 8px rgba(0,0,0,0.75)" }} />
              </div>
            );
          })}
        </div>
        {score(right.score, sp(at.score2), true)}
      </div>
    </div>
  );
};
