import React from "react";
import { Img, interpolate, staticFile, Easing } from "remotion";
import { INK, MONO_FONT, label } from "./theme";
import { Folder } from "./Skills";

// What "setting someone up" actually hands them: the real marks of the stack,
// then the skills that come with it. The folders are the same object as the
// template card earlier in the reel, so it reads as a callback, not a new idea.
// the creator 2026-09-04: "logo of claude, remotion, remocn and some skills".
export const Stack: React.FC<{
  tMs: number; w: number; h: number;
  marks: string[]; names: string[]; skills: string[];
  beats: { marks: number; per?: number; skills: number; skillPer?: number };
}> = ({ tMs, w, h, marks, names, skills, beats }) => {
  const P = Math.round(w * 0.030);
  const per = beats.per ?? 260;
  const sper = beats.skillPer ?? 150;
  const markH = Math.round(h * 0.30);
  const nameFs = Math.round(h * 0.072);
  const rowW = w - 2 * P;
  const cell = rowW / marks.length;
  const fw = Math.round(w * 0.125);
  const skillFs = Math.round(h * 0.046);
  const top = Math.round(h * 0.075);
  const skillTop = top + markH + Math.round(h * 0.030) + nameFs + Math.round(h * 0.055);
  const scell = rowW / skills.length;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {marks.map((m, i) => {
        const at = beats.marks + i * per;
        const a = interpolate(tMs, [at, at + 260], [0, 1], { easing: Easing.out(Easing.back(1.4)), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={m} style={{ position: "absolute", left: P + i * cell, top, width: cell, textAlign: "center", opacity: Math.min(1, a * 1.6) }}>
            <div style={{ height: markH, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.6 + 0.4 * a})` }}>
              <Img src={staticFile(m)} style={{ height: markH, width: "auto", objectFit: "contain" }} />
            </div>
            <div style={{ marginTop: Math.round(h * 0.030), ...label(nameFs, INK), whiteSpace: "nowrap" }}>{names[i]}</div>
          </div>
        );
      })}
      {skills.map((s, i) => {
        const at = beats.skills + i * sper;
        const a = interpolate(tMs, [at, at + 240], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={s} style={{
            position: "absolute", left: P + i * scell, top: skillTop, width: scell,
            opacity: Math.min(1, a * 2), transform: `translateY(${(1 - a) * 18}px)`,
          }}>
            <div style={{ width: fw, margin: "0 auto" }}><Folder w={fw} open={a} /></div>
            <div style={{ marginTop: Math.round(h * 0.020), width: scell, textAlign: "center", fontFamily: MONO_FONT, fontSize: skillFs, color: INK, lineHeight: 1.15, whiteSpace: "nowrap" }}>{s}</div>
          </div>
        );
      })}
    </div>
  );
};
