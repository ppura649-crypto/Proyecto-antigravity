import React from "react";
import { Img, interpolate, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, BAR_GREY, CARD_BG, INK, LABEL_FONT, MONO_FONT, MUTED } from "./theme";

// V1 (v4, their round 1 2026-09-06: "when I say old models we should pop like old models opus 4.8
// or GPT 5 or other old models, with logos and name"). The hook's sentence on ONE black card:
//   "a skill built by an OLD MODEL"   three old models on the left, each the vendor's real mark
//                                     with the model's name under it; on `write` a SKILL.md sheet
//                                     slides OUT of each mark (the old model wrote it)
//   "might be making the NEW MODEL"   the three sheets fly across and pile onto the new model's
//                                     mark on the right (`fly`, "making")
//   "WORSE."                          the quality gauge beside the new model FALLS to a quarter,
//                                     cracks and goes terracotta (`drop`), the punch of the reel
// Every state is complete at its beat; Overlay owns the entrance. Nothing moves after the drop.
export type OldModelsData = {
  old: { name: string }[];  // the old models, in the order of assets[0..n-1]
  newLabel: string;         // their words under the new model's mark (assets[n])
  file: string;             // the sheet's tab, "SKILL.md"
  drop?: number;            // where the gauge lands, 0..1 of full (default 0.25)
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

const SHEET_ROWS = [0.17, 0.62, 0.86, 0.54, 0.17, 0.72];

const Sheet: React.FC<{ w: number; h: number; tab: string; fs: number }> = ({ w, h, tab, fs }) => (
  <div style={{ width: w, height: h, backgroundColor: "#111318", boxShadow: "0 6px 18px rgba(0,0,0,0.55)", position: "relative", overflow: "hidden" }}>
    <div style={{ height: h * 0.2, display: "flex", alignItems: "center", paddingLeft: w * 0.08, fontFamily: MONO_FONT, fontSize: fs, color: MUTED, borderBottom: "1px solid #2a2d33" }}>{tab}</div>
    {SHEET_ROWS.map((f, i) => (
      <div key={i} style={{ position: "absolute", left: w * 0.1, top: h * (0.29 + i * 0.115), width: w * 0.8 * f, height: h * 0.055, backgroundColor: i === 1 || i === 2 ? "#9aa1ad" : BAR_GREY }} />
    ))}
  </div>
);

export const OldModels: React.FC<CardProps & { data: OldModelsData }> = ({
  tMs, w, h, fps, fromMs, beats, assets, data,
}) => {
  const n = data.old.length;
  const tWrite = beats.write ?? fromMs + 150;
  const tFly = beats.fly ?? tWrite + 800;
  const tDrop = beats.drop ?? tFly + 800;
  const dropTo = data.drop ?? 0.25;

  // ---- geometry ----
  const markS = 0.155 * h;                  // an old model's mark, square
  const colX = 0.055 * w;                   // the old models' column
  const pitch = h / (n + 0.35);             // row pitch
  const rowY = (i: number) => pitch * (i + 0.62);
  const nameFs = 0.022 * w;
  const sheetW = 0.095 * w;
  const sheetH = 0.145 * h;
  const sheetGap = 0.028 * w;
  const newS = 0.30 * h;                    // the new model's mark
  const newX = 0.585 * w;
  const newY = 0.36 * h;                    // centre
  const gaugeW = 0.048 * w;
  const gaugeX = 0.865 * w;
  const gaugeTop = 0.10 * h;
  const gaugeBottom = 0.80 * h;
  const gaugeH = gaugeBottom - gaugeTop;

  // ---- the sheets: out of the mark on `write`, across to the new model on `fly` ----
  const sheetState = (i: number) => {
    const mx = colX + markS;                  // the mark's right edge
    const my = rowY(i) - sheetH / 2;
    const outP = easeOut((tMs - (tWrite + i * 80)) / 300);
    const restX = mx + sheetGap;
    const x0 = interpolate(outP, [0, 1], [mx - sheetW * 0.7, restX]);
    const flyP = easeOut((tMs - (tFly + i * 90)) / 420);
    if (flyP <= 0) return { x: x0, y: my, s: interpolate(outP, [0, 1], [0.6, 1]), o: Math.min(1, outP * 3), r: 0 };
    // an arc to the new mark's lower-right, a small stack of three
    const tx = newX + newS * 0.36 + i * 0.016 * w;
    const ty = newY + newS * 0.08 + i * 0.014 * h;
    const cx = (restX + tx) / 2, cy = Math.min(my, ty) - 0.14 * h;
    const u = flyP;
    const x = (1 - u) * (1 - u) * restX + 2 * (1 - u) * u * cx + u * u * tx;
    const y = (1 - u) * (1 - u) * my + 2 * (1 - u) * u * cy + u * u * ty;
    return { x, y, s: interpolate(u, [0, 1], [1, 0.85]), o: 1, r: interpolate(u, [0, 1], [0, -10 + i * 7]) };
  };

  // ---- the gauge: full, then the fall on `drop` with an overshoot ----
  const dropOn = tMs >= tDrop;
  const dropF = dropOn ? Math.max(0, ((tMs - tDrop) / 1000) * fps) : 0;
  const dropSpring = dropOn ? spring({ frame: dropF, fps, config: { damping: 11, stiffness: 260, mass: 0.8 } }) : 0;
  const level = Math.max(dropTo * 0.55, 1 - (1 - dropTo) * dropSpring);   // 1 -> dropTo, a bounce past it, never the floor
  const fillTop = gaugeBottom - gaugeH * clamp01(level);
  const jolt = dropOn && dropF < 4 ? (dropF % 2 === 0 ? 5 : -4) : 0;
  const gaugeColor = dropOn && dropSpring > 0.5 ? ACCENT : INK;

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CARD_BG, overflow: "hidden" }}>
      {/* the old models: real vendor marks, names in their words */}
      {data.old.map((m, i) => (
        <React.Fragment key={m.name}>
          <div style={{ position: "absolute", left: colX, top: rowY(i) - markS / 2, width: markS, height: markS, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Img src={staticFile(assets[i])} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          </div>
          <div style={{ position: "absolute", left: colX - 0.06 * w, top: rowY(i) + markS / 2 + 0.008 * h, width: markS + 0.12 * w, textAlign: "center", fontFamily: LABEL_FONT, fontWeight: 700, fontSize: nameFs, color: INK, whiteSpace: "nowrap" }}>{m.name}</div>
        </React.Fragment>
      ))}

      {/* the new model, its label, its gauge */}
      <div style={{ position: "absolute", left: newX - newS / 2, top: newY - newS / 2 + jolt, width: newS, height: newS, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Img src={staticFile(assets[n])} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
      </div>
      <div style={{ position: "absolute", left: newX - 0.18 * w, top: newY + newS / 2 + 0.03 * h, width: 0.36 * w, textAlign: "center", fontFamily: LABEL_FONT, fontWeight: 700, fontSize: nameFs * 1.15, color: INK, letterSpacing: "0.04em" }}>{data.newLabel}</div>
      <div style={{ position: "absolute", left: gaugeX, top: gaugeTop, width: gaugeW, height: gaugeH, backgroundColor: "#1b1e24" }} />
      {[0.25, 0.5, 0.75].map((f) => (
        <div key={f} style={{ position: "absolute", left: gaugeX - 0.012 * w, top: gaugeBottom - gaugeH * f, width: 0.010 * w, height: 2, backgroundColor: BAR_GREY }} />
      ))}
      <div style={{ position: "absolute", left: gaugeX, top: fillTop, width: gaugeW, height: gaugeBottom - fillTop, backgroundColor: gaugeColor }} />
      {dropOn && dropSpring > 0.5 && (
        <svg style={{ position: "absolute", left: gaugeX - 0.01 * w, top: fillTop - 0.02 * h, overflow: "visible" }} width={gaugeW + 0.02 * w} height={0.05 * h}>
          <polyline points={`0,${0.02 * h} ${gaugeW * 0.3},${0.005 * h} ${gaugeW * 0.55},${0.035 * h} ${gaugeW * 0.8},${0.012 * h} ${gaugeW + 0.02 * w},${0.028 * h}`} fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        </svg>
      )}

      {/* the sheets, drawn last so they pass over everything on the way */}
      {data.old.map((m, i) => {
        const s = sheetState(i);
        return (
          <div key={m.name + "-sheet"} style={{ position: "absolute", left: s.x, top: s.y, transform: `scale(${s.s}) rotate(${s.r}deg)`, transformOrigin: "left center", opacity: s.o }}>
            <Sheet w={sheetW} h={sheetH} tab={data.file} fs={0.013 * w} />
          </div>
        );
      })}
    </div>
  );
};
