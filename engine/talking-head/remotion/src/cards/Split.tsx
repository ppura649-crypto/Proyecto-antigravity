import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, INK, MONO_FONT, MUTED } from "./theme";
import { Mascot, SHADOW } from "./Mascot";

// THE explainer of the whole video (the creator 2026-09-04: "on task (you show one
// prompt), then you split it into several subtask, and agent icons claude").
// One job box with its pieces inside, the Claude in charge above it, then the
// pieces detach and fly down into their own chips, one agent under each.
// Standalone graphic: no plate, it draws straight on the footage.
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const Split: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  job: string; items: string[]; parent?: string;
  beats?: { parent?: number; split?: number; agents?: number };
  perMs?: number;
}> = ({ tMs, w, h, fps, fromMs, job, items, parent = "claude", beats = {}, perMs = 110 }) => {
  const n = Math.max(1, items.length);
  const fs = 0.024 * w;
  const labelFs = 0.030 * w;
  const iconP = 0.125 * w;
  const iconC = 0.132 * w;
  const boxW = 0.72 * w;
  const boxX = (w - boxW) / 2;
  const boxPad = 0.022 * w;
  const headerH = fs * 2.0;
  const rowH = fs * 2.0;
  const chipH = fs * 2.1;
  const colW = w / n;
  const chipW = Math.min(colW * 0.94, 0.3 * w);

  // the box is full while the job is whole and collapses to its header once the
  // pieces leave, so the agents get the room instead of a tall empty outline
  const PH = iconP * (20 / 24) + 0.22 * labelFs + labelFs * 1.2;
  const BH = 2 * boxPad + headerH + n * rowH;
  const BHc = 2 * boxPad + headerH;
  const MH = iconC * (20 / 24);
  const g1 = 0.10 * h;
  const g3 = 0.045 * h;
  const boxY = PH + g1;
  const g2 = Math.max(0.05 * h, h - (boxY + BHc + chipH + g3 + MH));
  const chipY = boxY + BHc + g2;
  const mascY = chipY + chipH + g3;

  const at = { parent: beats.parent ?? fromMs + 500, split: beats.split ?? fromMs + 2600, agents: beats.agents ?? fromMs + 3100 };
  const springAt = (ms: number, d = 13, s = 300) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: d, stiffness: s, mass: 0.65 } });

  const boxIn = springAt(fromMs + 80);
  const pIn = springAt(at.parent);
  const fly = (i: number) => springAt(at.split + i * perMs, 15, 190);
  const aIn = (i: number) => springAt(at.agents + i * perMs);
  const faded = interpolate(tMs, [at.split, at.split + 600], [1, 0.62], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cx = (i: number) => colW * (i + 0.5);
  const collapse = Math.min(1, fly(0) * 1.1);
  const boxH = lerp(BH, BHc, collapse);
  const y1 = boxY + boxH;
  const k = 0.45 * (chipY - y1);

  const chip = (i: number, t: number) => {
    const x = lerp(boxX + boxPad, cx(i) - chipW / 2, t);
    const y = lerp(boxY + boxPad + headerH + i * rowH + rowH * 0.17, chipY, t);
    const cw = lerp(boxW - 2 * boxPad, chipW, t);
    const ch = lerp(rowH * 0.66, chipH, t);
    return { x, y, cw, ch };
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <title>one job split into pieces, one agent per piece</title>
        {pIn > 0 && (
          <line x1={w / 2} y1={PH - labelFs * 0.15} x2={w / 2} y2={boxY} stroke={ACCENT} strokeWidth={1.6}
            strokeOpacity={0.75 * Math.min(1, pIn * 2)} />
        )}
        {items.map((_, i) => {
          const g = Math.min(1, fly(i) * 1.6);
          if (g <= 0.02) return null;
          return (
            <path key={i}
              d={`M ${w / 2} ${y1} C ${w / 2} ${y1 + k}, ${cx(i)} ${chipY - k}, ${cx(i)} ${chipY}`}
              fill="none" stroke={ACCENT} strokeWidth={1.6} strokeOpacity={0.7}
              pathLength={1} strokeDasharray={1} strokeDashoffset={1 - g}
              style={{ filter: "drop-shadow(0px 1px 4px rgba(0,0,0,0.75))" }} />
          );
        })}
      </svg>

      {/* the Claude in charge */}
      {pIn > 0 && (
        <div style={{ position: "absolute", left: 0, top: 0, width: w, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${0.82 + 0.18 * pIn})`, opacity: Math.min(1, pIn * 2) }}>
          <Mascot size={iconP} />
          <div style={{ marginTop: 0.22 * labelFs, fontFamily: MONO_FONT, fontSize: labelFs, color: INK, textShadow: SHADOW }}>{parent}</div>
        </div>
      )}

      {/* the job box, its pieces inside, then an emptied outline */}
      <div style={{
        position: "absolute", left: boxX, top: boxY, width: boxW, height: boxH,
        border: `1px solid rgba(255,255,255,${0.30 + 0.42 * faded})`, borderRadius: 0.012 * w,
        backgroundColor: "#08080a", opacity: Math.min(1, boxIn * 2),
        transform: `scale(${0.94 + 0.06 * boxIn})`, boxShadow: "0 12px 34px rgba(0,0,0,0.6)",
      }}>
        <div style={{ position: "absolute", left: boxPad, top: boxPad, fontFamily: MONO_FONT, fontSize: fs * 1.05, color: MUTED, whiteSpace: "pre" }}>
          {"> "}{job}
        </div>
      </div>

      {/* the pieces: rows inside the box that become chips with an agent each */}
      {items.map((it, i) => {
        const t = fly(i);
        const r = chip(i, t);
        const a = aIn(i);
        return (
          <div key={i}>
            <div style={{
              position: "absolute", left: r.x, top: r.y, width: r.cw, height: r.ch,
              display: "flex", alignItems: "center", gap: 0.012 * w, paddingLeft: 0.016 * w, boxSizing: "border-box",
              border: `1px solid rgba(255,255,255,${lerp(0.22, 0.55, t)})`, borderRadius: 0.008 * w,
              backgroundColor: "#08080a", opacity: Math.min(1, boxIn * 2),
              boxShadow: "0 8px 22px rgba(0,0,0,0.6)",
            }}>
              <div style={{ width: fs * 0.34, height: fs * 0.34, borderRadius: "50%", backgroundColor: ACCENT, flex: "none" }} />
              <div style={{ fontFamily: MONO_FONT, fontSize: lerp(fs * 0.9, fs, t), color: INK, whiteSpace: "nowrap" }}>{it}</div>
            </div>
            {a > 0 && (
              <div style={{ position: "absolute", left: cx(i) - w / 2, top: mascY, width: w, display: "flex", justifyContent: "center", transform: `scale(${0.8 + 0.2 * a})`, opacity: Math.min(1, a * 2) }}>
                <Mascot size={iconC} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
