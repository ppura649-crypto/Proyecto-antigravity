import React from "react";
import { Img, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, INK, MONO_FONT, MUTED, label } from "./theme";
import { Folder } from "./Skills";
import { TaskPlate } from "./TaskFan";

// V11, "and I run them with and without the harness to see if there is an improvement."
// One black card, two lanes. The heads are the same agent twice and the ONLY difference
// is the skill folder tucked under the top one, so the comparison is a single variable.
// The ten task plates from V10 stream through both lanes at the same rate and vanish into
// a dashed result box at each end: the same work, two setups. On `improvement.` a `?`
// glitches into both boxes (the RuleWhy glyph) and stays: the result is not known yet.
// The stream is the one thing that keeps moving; everything else lands and holds.
// beats: stream, top, bottom, question

export type LanesData = {
  top: string; bottom: string; n: number;
  rateWFrac?: number;  // lane speed in card widths per second (default 0.35)
  gapMs?: number;      // gap between two plates entering a lane (default 340)
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const Lanes: React.FC<CardProps & { data: LanesData }> = ({
  tMs, w, h, fps, fromMs, beats, assets, data,
}) => {
  const P = 0.045 * w;
  const markH = 0.160 * h;
  const markW = markH * (520 / 440);
  const folderW = 0.100 * h;
  const hx = P + markW / 2;
  const boxS = 0.200 * h;
  const boxX = w - P - boxS;
  const y1 = 0.260 * h;
  const y2 = 0.680 * h;
  const labFs = 0.042 * h;
  const labTop = markH / 2 + 0.075 * h;
  const thumbH = 0.090 * h;
  const thumbW = thumbH * 0.70;
  const qFs = 0.160 * h;

  const track = 0.0034 * w;
  const dash = `${0.026 * w} ${0.019 * w}`;

  const bStream = beats.stream ?? fromMs;
  const bTop = beats.top ?? bStream + 560;
  const bBottom = beats.bottom ?? bTop + 526;
  const bQ = beats.question ?? bBottom + 1920;

  const n = Math.max(1, data.n ?? 10);
  const rate = ((data.rateWFrac ?? 0.35) * w) / 1000;  // px per ms
  const gap = data.gapMs ?? 340;
  const xStart = P + 0.18 * markW;

  const sp = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 15, stiffness: 300, mass: 0.7 } });

  // one plate on a lane: out from behind the agent, along the track, gone as it enters
  // the result box. The only thing on this card that is allowed to be clipped.
  const runner = (y: number, i: number, key: string) => {
    const t0 = bStream + i * gap;
    if (tMs < t0) return null;
    const x = xStart + rate * (tMs - t0);
    // the box eats it: the lane is clipped at the box edge, so a plate is cut away
    // sliver by sliver as it goes in and is gone before it could touch the glyph
    const fadeA = boxX - 0.85 * thumbW;
    const fadeB = boxX - 0.25 * thumbW;
    if (x >= fadeB) return null;
    const inOp = clamp01((x - xStart) / (0.055 * w));
    // dim faster than it narrows, so the last sliver is never a bright tick
    const outOp = x <= fadeA ? 1 : Math.pow(clamp01(1 - (x - fadeA) / (fadeB - fadeA)), 1.5);
    const k = 1;
    return (
      <div
        key={key}
        style={{
          position: "absolute", left: x, top: y - thumbH / 2, width: thumbW, height: thumbH,
          opacity: inOp * outOp, transform: `scale(${k})`, transformOrigin: "50% 50%",
          filter: "drop-shadow(0px 3px 8px rgba(0,0,0,0.6))",
        }}
      >
        <TaskPlate w={thumbW} h={thumbH} variant={i % 5} />
      </div>
    );
  };

  const head = (y: number, folder: boolean) => (
    <>
      <Img
        src={staticFile(assets[0])}
        style={{
          position: "absolute", left: P, top: y - markH / 2, width: markW, height: markH,
          imageRendering: "pixelated", objectFit: "contain",
          filter: "brightness(1.7) drop-shadow(0px 0px 10px rgba(0,0,0,0.9))",
        }}
      />
      {folder && (
        <div style={{ position: "absolute", left: P + markW * 0.60, top: y + markH * 0.14 }}>
          <Folder w={folderW} open={1} />
        </div>
      )}
    </>
  );

  const laneLabel = (y: number, text: string, at: number) => {
    if (tMs < at) return null;
    const p = Math.min(1, sp(at));
    return (
      <div
        style={{
          position: "absolute", left: P, top: y + labTop, ...label(labFs, INK),
          lineHeight: 1.1, whiteSpace: "nowrap", fontWeight: 600,
          opacity: clamp01(p * 3), transform: `translateY(${(1 - p) * 0.28 * labFs}px)`,
        }}
      >
        {text}
      </div>
    );
  };

  // the result nobody has yet: the RuleWhy glyph, a short glitch on the word, then it stays
  const mark = (y: number) => {
    if (tMs < bQ) return null;
    const f = ((tMs - bQ) / 1000) * fps;
    const p = Math.min(1, sp(bQ));
    const glitch = f < 9;
    const jx = glitch ? ((f % 3) - 1) * 2.6 : 0;
    const jy = glitch ? ((Math.floor(f / 2) % 3) - 1) * 2.2 : 0;
    const flick = glitch ? 0.52 + 0.48 * Math.abs(Math.sin(f * 2.7)) : 1;
    return (
      <div
        style={{
          position: "absolute", left: boxX, top: y - boxS / 2, width: boxS, height: boxS,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: MONO_FONT, fontSize: qFs, fontWeight: 700, lineHeight: 1, color: ACCENT,
          opacity: flick, transform: `translate(${jx}px, ${jy}px) scale(${0.68 + 0.32 * p})`,
        }}
      >
        ?
      </div>
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <title>the same ten tasks, two setups</title>
        {[y1, y2].map((y) => (
          <g key={y}>
            <line x1={hx} y1={y} x2={boxX} y2={y} stroke={MUTED} strokeWidth={track} strokeOpacity={0.7} />
            <rect
              x={boxX + track / 2} y={y - boxS / 2 + track / 2}
              width={boxS - track} height={boxS - track}
              fill="none" stroke={MUTED} strokeWidth={track} strokeDasharray={dash}
            />
          </g>
        ))}
      </svg>

      <div style={{ position: "absolute", left: 0, top: 0, width: boxX, height: h, overflow: "hidden" }}>
        {Array.from({ length: n }).map((_, i) => runner(y1, i, `t${i}`))}
        {Array.from({ length: n }).map((_, i) => runner(y2, i, `b${i}`))}
      </div>

      {head(y1, true)}
      {head(y2, false)}

      {laneLabel(y1, data.top, bTop)}
      {laneLabel(y2, data.bottom, bBottom)}

      {mark(y1)}
      {mark(y2)}
    </div>
  );
};
