import React from "react";
import { Img, interpolate, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, BAR_GREY, CARD_BG, INK, MONO_FONT, MUTED, label } from "./theme";
import { SHADOW } from "./Mascot";

// V1 "if you're using a skill built by an OLD MODEL, it might be making the NEW MODEL WORSE."
// The hook's own picture, frameless over the curtain, three objects and one punch:
//   left   a SKILL.md file, its editor tab in mono, a line-number gutter and its `name:` and
//          `description:` lines as grey text bars (no authored words in the file, ever), wearing
//          a tilted OLD MODEL stamp on its corner
//   right  the real Claude mark labelled NEW MODEL, and a tall quality bar standing beside it,
//          full to the top and white
// `pop` is the first state: everything is already drawn, nothing eases in (Overlay owns the
// entrance). On `dock` the file slides right and snaps against the mark. On `drop` the bar
// FALLS to a quarter, cracks across its new top edge and goes terracotta: the punch of the reel
// (their call 2026-09-06, "the punch is on the worse"). Then it holds, and nothing else moves.
export type SkillDragData = {
  file: string;
  stamp: string;
  mark: string;
  drop?: number;   // where the bar lands, 0..1 of full (default 0.25)
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// one line of the file: the bars that stand in for its text, as fractions of the body width
type Row = { segs: { f: number; key?: boolean }[] };
const ROWS: Row[] = [
  { segs: [{ f: 0.17 }] },                              // ---
  { segs: [{ f: 0.20, key: true }, { f: 0.40 }] },      // name: ...
  { segs: [{ f: 0.42, key: true }, { f: 0.44 }] },      // description: ...
  { segs: [{ f: 0.86 }] },                              //   ... wrapped
  { segs: [{ f: 0.54 }] },
  { segs: [{ f: 0.17 }] },                              // ---
  { segs: [] },
  { segs: [{ f: 0.72 }] },
];

export const SkillDrag: React.FC<CardProps & { data: SkillDragData }> = ({
  tMs, w, h, fps, fromMs, beats, assets, data,
}) => {
  // ---- geometry: the file, the mark and the bar all stand on one floor ----
  const base = 0.780 * h;
  const fileW = 0.330 * w;
  const fileH = 0.560 * h;
  const fileTop = base - fileH;
  const markW = 0.200 * w;
  const markH = markW * (440 / 520);
  const markTop = base - markH;
  const barW = 0.055 * w;
  const barTop = 0.070 * h;
  const barH = base - barTop;

  const gapFM = 0.016 * w;
  const gapMB = 0.038 * w;
  const groupX = (w - (fileW + gapFM + markW + gapMB + barW)) / 2;
  const dockX = groupX;
  const markX = groupX + fileW + gapFM;
  const barX = markX + markW + gapMB;
  const startX = 0.030 * w;

  const halo = `drop-shadow(0px 0px ${0.012 * w}px rgba(0,0,0,0.92)) drop-shadow(0px 4px 14px rgba(0,0,0,0.8))`;
  const tsh = `0px 0px ${0.013 * w}px rgba(0,0,0,0.94), ${SHADOW}`;
  const boxSh = `0px 0px ${0.012 * w}px rgba(0,0,0,0.92), 0px 12px 34px rgba(0,0,0,0.62)`;

  // ---- the clock ----
  const dockAt = beats.dock ?? fromMs + 945;
  const dropAt = beats.drop ?? dockAt + 840;
  const dock = spring({
    frame: Math.max(0, ((tMs - dockAt) / 1000) * fps),
    fps, config: { damping: 15, stiffness: 320, mass: 0.7 },
  });
  const fileX = startX + (dockX - startX) * dock;

  // the drop: down hard in 150 ms, past the mark, back over it, settled by 400 ms
  const to = data.drop ?? 0.25;
  const level = tMs < dropAt ? 1 : interpolate(
    tMs,
    [0, 150, 250, 330, 400].map((t) => dropAt + t),
    [1, to - 0.075, to + 0.055, to - 0.020, to],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const hit = clamp01((tMs - dropAt) / 90);           // white -> terracotta
  const crack = clamp01((tMs - dropAt - 120) / 90);   // the break, as it lands
  const barY = barTop + barH * (1 - level);

  // the file jolts once as the bar breaks under it
  const jolt = tMs >= dropAt ? Math.sin(Math.PI * clamp01((tMs - dropAt) / 190)) * 0.010 * w : 0;

  // the crack: a jagged line drawn across the bar's new top edge, a little past both sides
  const over = 0.032 * w;
  const amp = 0.009 * h;
  const crackPts = Array.from({ length: 9 }, (_, i) => {
    const x = barX - over + ((barW + 2 * over) * i) / 8;
    const y = barY + (i % 2 === 0 ? -amp : amp) * (i === 0 || i === 8 ? 0.35 : 1);
    return `${x},${y}`;
  }).join(" ");

  // ---- the file body ----
  const gut = 0.052 * w;
  const padX = 0.026 * w;
  const bodyTop = 0.040 * h;
  const contentW = fileW - gut - padX;
  const lineH = 0.056 * h;
  const barTh = 0.020 * h;
  const numFs = 0.019 * w;
  const tabFs = 0.024 * w;
  const tabH = 0.052 * h;
  const stampFs = 0.036 * w;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {/* the quality bar beside the mark: a dim column of what it was, a solid bar of what it is */}
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible", filter: halo }}>
        <title>the new model's quality, full, then a quarter of it</title>
        <rect x={barX} y={barTop} width={barW} height={barH} fill={INK} fillOpacity={0.10} />
        <rect x={barX} y={barY} width={barW} height={barH * level} fill={INK} />
        <rect x={barX} y={barY} width={barW} height={barH * level} fill={ACCENT} opacity={hit} />
        {crack > 0 && (
          <polyline
            points={crackPts} fill="none" stroke={INK} strokeWidth={0.0085 * w}
            strokeLinejoin="miter" strokeLinecap="butt" opacity={crack}
          />
        )}
      </svg>

      {/* the real Claude mark, frameless, nothing behind it */}
      {assets[0] && (
        <Img
          src={staticFile(assets[0])}
          style={{
            position: "absolute", left: markX, top: markTop, width: markW, height: markH,
            objectFit: "contain", filter: halo,
          }}
        />
      )}
      <div
        style={{
          position: "absolute", left: markX + markW / 2 - 0.19 * w, top: base + 0.030 * h,
          width: 0.38 * w, textAlign: "center", whiteSpace: "nowrap",
          ...label(0.030 * w, INK), textShadow: tsh,
        }}
      >
        {data.mark}
      </div>

      {/* the skill file, and the stamp it is wearing */}
      <div style={{ position: "absolute", left: fileX + jolt, top: fileTop }}>
        {/* the editor tab, the one place the file names itself */}
        <div
          style={{
            position: "absolute", left: 0, top: -tabH, height: tabH,
            display: "flex", alignItems: "center", padding: `0 ${0.022 * w}px`,
            backgroundColor: CARD_BG, boxShadow: boxSh,
          }}
        >
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.08)" }} />
          <div style={{
            position: "relative", fontFamily: MONO_FONT, fontSize: tabFs, color: INK,
            whiteSpace: "nowrap", lineHeight: 1,
          }}>
            {data.file}
          </div>
        </div>

        <div style={{ width: fileW, height: fileH, backgroundColor: CARD_BG, boxShadow: boxSh, position: "relative" }}>
          {ROWS.map((r, i) => (
            <div
              key={i}
              style={{
                position: "absolute", left: 0, top: bodyTop + i * lineH, width: fileW,
                height: lineH, display: "flex", alignItems: "center",
              }}
            >
              <div style={{
                width: gut, flex: "none", textAlign: "right", paddingRight: 0.014 * w,
                fontFamily: MONO_FONT, fontSize: numFs, color: MUTED, opacity: 0.42, lineHeight: 1,
              }}>
                {i + 1}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 0.014 * w }}>
                {r.segs.map((s, k) => (
                  <div
                    key={k}
                    style={{
                      width: contentW * s.f, height: barTh,
                      backgroundColor: s.key ? MUTED : BAR_GREY, opacity: s.key ? 0.60 : 1,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute", left: fileW * 0.58, top: fileH * 0.775,
            padding: `${0.015 * w}px ${0.028 * w}px`,
            border: `${0.0035 * w}px solid ${ACCENT}`,
            whiteSpace: "nowrap", ...label(stampFs, ACCENT),
            letterSpacing: "0.12em", fontWeight: 800, lineHeight: 1.05,
            transform: "translate(-50%, -50%) rotate(-12deg)",
            textShadow: `0px 0px ${0.012 * w}px rgba(0,0,0,0.85)`,
          }}
        >
          {data.stamp}
        </div>
      </div>
    </div>
  );
};
