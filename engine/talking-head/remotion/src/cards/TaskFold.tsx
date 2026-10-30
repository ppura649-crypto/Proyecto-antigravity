import React from "react";
import { interpolate } from "remotion";
import type { CardProps } from "./props";
import { INK, LABEL_FONT, label } from "./theme";
import { SHADOW } from "./Mascot";
import { Folder } from "./Skills";

// V2 "I would transform any task I could find into skills."
// Frameless. On the left, plain-english tasks as outlined chips, waiting in a column. One at a
// time a chip flies right, shrinks, and FOLDS into a blue macOS folder (the same SVG the skills
// card draws, `open` running 1 -> 0 as it lands) with its skill name landing under it once the
// folder has settled. The six named folds run at `perMs` from `fold`, the last one landing on
// `named`. After that, folders keep arriving every `anonPerMs` with no name at all, piling into
// each other and marching off the card's RIGHT edge, where they are clipped: the overflow is the
// whole point, so there is no counter and no number anywhere on this card.
export type TaskFoldData = {
  pairs: { task: string; skill: string }[];
  perMs: number;
  anonPerMs: number;
  flightMs?: number;   // how long one chip takes to become a folder (default 270)
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
// gentle out of the column, gentle into the folder: a chip that leaps stamps its words
// straight over the folder it is passing, and two labels on top of each other read as neither
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export const TaskFold: React.FC<CardProps & { data: TaskFoldData }> = ({
  tMs, w, h, fromMs, toMs, beats, data,
}) => {
  const pairs = data.pairs ?? [];
  const per = data.perMs ?? 260;
  const anonPer = data.anonPerMs ?? 90;
  const flight = data.flightMs ?? 270;
  const foldAt = beats.fold ?? fromMs;
  const namedAt = beats.named ?? foldAt + Math.max(0, pairs.length - 1) * per + flight;

  const tsh = `0px 0px ${0.013 * w}px rgba(0,0,0,0.94), ${SHADOW}`;
  const halo = `drop-shadow(0px 0px ${0.011 * w}px rgba(0,0,0,0.9))`;

  // ---- the chips waiting on the left ----
  const chipX = 0.022 * w;
  const chipW = 0.250 * w;
  const chipH = 0.086 * h;
  const chipGap = 0.026 * h;
  const chipPadX = 0.014 * w;
  const chipTop0 = 0.135 * h;
  const chipFsMax = 0.0215 * w;
  const chipCx = chipX + chipW / 2;
  // the list is worked top down and each chip leaves from where it has been sitting: the ones
  // still waiting never move, so nothing on the left slides under the chip that is in flight
  const chipCy = (i: number) => chipTop0 + i * (chipH + chipGap) + chipH / 2;
  const fitFs = (s: string) => Math.min(chipFsMax, (chipW - 2 * chipPadX) / Math.max(4, s.length * 0.66));

  // ---- where the folders land: six named in a wide 3 x 2 grid, then the run ----
  const fw = 0.132 * w;
  const fh = fw * 0.76;
  const nameFs = 0.023 * w;
  const pileX0 = 0.320 * w;
  const colPitch = (w - pileX0 - fw - 0.028 * w) / 2;
  const row0 = 0.085 * h;
  const rowPitch = 0.285 * h;
  const runY = 0.680 * h;
  const runPitch = 0.100 * w;

  const namedPos = (i: number) => ({
    x: pileX0 + (i % 3) * colPitch,
    y: row0 + Math.floor(i / 3) * rowPitch,
  });
  // the anonymous ones overlap each other and walk off the right edge
  const anonPos = (j: number) => ({
    x: pileX0 + 0.010 * w + j * runPitch,
    y: runY + (j % 2 === 0 ? -0.018 * h : 0.014 * h),
    rot: j % 2 === 0 ? -4 : 5,
  });

  const anonCount = Math.max(0, Math.floor((Math.min(tMs, toMs) - namedAt) / anonPer) + 1);

  const folder = (key: string, x: number, y: number, p: number, rot: number, name?: string) => {
    const k = interpolate(p, [0, 1], [0.34, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const np = name ? clamp01((p - 0.86) / 0.14) : 0;
    return (
      <div key={key} style={{ position: "absolute", left: x, top: y, width: fw }}>
        <div style={{
          transform: `scale(${k}) rotate(${rot * (1 - p)}deg)`, transformOrigin: "50% 42%",
          filter: halo, opacity: clamp01(p * 4),
        }}>
          <Folder w={fw} open={1 - p} />
        </div>
        {name && np > 0 && (
          <div style={{
            position: "absolute", left: fw / 2 - colPitch / 2, top: fh + 0.016 * h, width: colPitch,
            textAlign: "center", fontFamily: LABEL_FONT, fontSize: nameFs, lineHeight: 1.2,
            letterSpacing: "0.04em", color: INK, textShadow: tsh, overflowWrap: "anywhere",
            opacity: np, transform: `translateY(${(1 - np) * 0.014 * h}px)`,
          }}>
            {name}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {/* the tasks, in their own plain english, waiting their turn */}
      {pairs.map((p, i) => {
        const at = foldAt + i * per;
        const t = clamp01((tMs - at) / flight);
        if (t >= 1) return null;
        const e = easeInOut(t);
        const dst = namedPos(i);
        const y0 = chipCy(i);
        const cx = chipCx + (dst.x + fw / 2 - chipCx) * e;
        const cy = y0 + (dst.y + fh * 0.45 - y0) * e - Math.sin(Math.PI * e) * 0.045 * h;
        const k = 1 - 0.70 * e;
        return (
          <div
            key={p.task}
            style={{
              position: "absolute", left: cx - chipW / 2, top: cy - chipH / 2,
              width: chipW, height: chipH,
              border: `${0.0022 * w}px solid rgba(255,255,255,0.78)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: `0 ${chipPadX}px`, boxSizing: "border-box",
              transform: `scale(${k})`, transformOrigin: "50% 50%",
              opacity: 1 - clamp01((t - 0.35) / 0.40),
              filter: `drop-shadow(0px 0px ${0.010 * w}px rgba(0,0,0,0.9))`,
            }}
          >
            <div style={{
              ...label(fitFs(p.task), INK), whiteSpace: "nowrap", lineHeight: 1, textShadow: tsh,
            }}>
              {p.task}
            </div>
          </div>
        );
      })}

      {/* the pile: clipped by the card's right edge, free above and below it */}
      <div style={{ position: "absolute", left: 0, top: -h, width: w, height: 3 * h, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: h, width: w, height: h }}>
          {pairs.map((p, i) => {
            const at = foldAt + i * per;
            const t = clamp01((tMs - at) / flight);
            if (t < 0.62) return null;
            const q = clamp01((t - 0.62) / 0.38);
            const d = namedPos(i);
            return folder(`n${i}`, d.x, d.y, q, i % 2 === 0 ? -8 : 8, p.skill);
          })}
          {Array.from({ length: anonCount }).map((_, j) => {
            const at = namedAt + j * anonPer;
            const q = clamp01((tMs - at) / 200);
            if (q <= 0) return null;
            const d = anonPos(j);
            return folder(`a${j}`, d.x, d.y, q, d.rot, undefined);
          })}
        </div>
      </div>
    </div>
  );
};
