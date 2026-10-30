import React from "react";
import type { CardProps } from "./props";
import { ACCENT, INK } from "./theme";
import { Folder } from "./Skills";

// V15 "delete it."
// Frameless, and the shortest card in the video: one blue skill folder on the left, the drawn
// macOS Trash on the right (a ribbed metal bin, white strokes on nothing, never a fill plate).
// On `drag` the folder swings over on a shallow arc and shrinks into the mouth of the bin; on
// `poof` the bin takes the weight, bulges once, and a small drawn poof opens at the lid. Then
// it holds, perfectly still, for the rest of the card.
export type TrashData = {
  arcMs?: number;    // how long the folder takes to reach the bin (default 200)
  puffMs?: number;   // how long the poof takes to draw itself in (default 250)
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeIn = (t: number) => t * t;

export const Trash: React.FC<CardProps & { data: TrashData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const dragAt = beats.drag ?? fromMs;
  const poofAt = beats.poof ?? dragAt + 200;
  const arc = data.arcMs ?? Math.max(120, poofAt - dragAt);
  const puff = data.puffMs ?? 250;

  const halo = `drop-shadow(0px 0px ${0.012 * w}px rgba(0,0,0,0.92)) drop-shadow(0px 4px 14px rgba(0,0,0,0.8))`;
  const sw = 0.0085 * w;

  // ---- the bin ----
  const binCx = 0.615 * w;
  const bodyTop = 0.330 * h;
  const bodyBot = 0.815 * h;
  const topHalf = 0.100 * w;
  const botHalf = 0.086 * w;
  const r = 0.016 * w;
  const lidH = 0.046 * h;
  const lidGap = 0.030 * h;
  const lidHalf = 0.121 * w;
  const lidTop = bodyTop - lidGap - lidH;
  const handleHalf = 0.030 * w;

  const body =
    `M ${binCx - topHalf} ${bodyTop}` +
    ` L ${binCx - botHalf} ${bodyBot - r}` +
    ` Q ${binCx - botHalf} ${bodyBot} ${binCx - botHalf + r} ${bodyBot}` +
    ` L ${binCx + botHalf - r} ${bodyBot}` +
    ` Q ${binCx + botHalf} ${bodyBot} ${binCx + botHalf} ${bodyBot - r}` +
    ` L ${binCx + topHalf} ${bodyTop}`;

  const ribs = [-0.62, -0.31, 0, 0.31, 0.62].map((f) => {
    const y0 = bodyTop + 0.045 * h;
    const y1 = bodyBot - 0.045 * h;
    return { x0: binCx + f * topHalf * 0.86, x1: binCx + f * botHalf * 0.86, y0, y1 };
  });

  // the bin takes the weight: one bulge, from its base
  const bulge = tMs >= poofAt ? 1 + 0.08 * Math.sin(Math.PI * clamp01((tMs - poofAt) / 200)) : 1;

  // ---- the folder going in ----
  const fw = 0.160 * w;
  const fh = fw * 0.76;
  const from = { x: 0.170 * w, y: 0.520 * h };
  const to = { x: binCx, y: lidTop + lidH * 0.35 };
  const p = clamp01((tMs - dragAt) / arc);
  const fx = from.x + (to.x - from.x) * p;
  const fy = from.y + (to.y - from.y) * p - Math.sin(Math.PI * p) * 0.135 * h;
  const fk = 1 - 0.70 * easeIn(p);
  const fRot = 16 * p;
  const fOp = 1 - clamp01((p - 0.82) / 0.18);

  // ---- the poof at the lid ----
  const pf = clamp01((tMs - poofAt) / puff);
  const px = binCx;
  const py = lidTop - 0.024 * h;
  const spokes = [-140, -108, -72, -40].map((deg) => {
    const a = (deg * Math.PI) / 180;
    const r0 = 0.032 * w + 0.012 * w * pf;
    const r1 = r0 + 0.052 * w * (0.4 + 0.6 * pf);
    return {
      x1: px + r0 * Math.cos(a), y1: py + r0 * Math.sin(a),
      x2: px + r1 * Math.cos(a), y2: py + r1 * Math.sin(a),
    };
  });

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible", filter: halo }}>
        <title>a skill folder dropped into the trash</title>

        <g transform={`translate(${binCx} ${bodyBot}) scale(${bulge}) translate(${-binCx} ${-bodyBot})`}>
          {/* the lid, and the handle you would lift it by */}
          <path
            d={`M ${binCx - handleHalf} ${lidTop} q ${handleHalf} ${-0.040 * h} ${2 * handleHalf} 0`}
            fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round"
          />
          <rect
            x={binCx - lidHalf} y={lidTop} width={2 * lidHalf} height={lidH} rx={0.010 * w}
            fill="none" stroke={INK} strokeWidth={sw}
          />
          {/* the body, tapered, and its ribbing */}
          <path d={body} fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
          <line
            x1={binCx - topHalf} y1={bodyTop} x2={binCx + topHalf} y2={bodyTop}
            stroke={INK} strokeWidth={sw}
          />
          {ribs.map((rb) => (
            <line
              key={rb.x0} x1={rb.x0} y1={rb.y0} x2={rb.x1} y2={rb.y1}
              stroke={INK} strokeWidth={0.0045 * w} strokeOpacity={0.5}
            />
          ))}
        </g>

        {/* the poof: four strokes and two specks, the only terracotta on the card */}
        {pf > 0 && (
          <g opacity={pf} stroke={ACCENT} strokeWidth={0.0075 * w} strokeLinecap="round">
            {spokes.map((s) => (
              <line key={s.x1} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
            ))}
            <circle cx={px - 0.088 * w} cy={py - 0.034 * h} r={0.0085 * w} fill={ACCENT} stroke="none" />
            <circle cx={px + 0.080 * w} cy={py - 0.050 * h} r={0.0065 * w} fill={ACCENT} stroke="none" />
          </g>
        )}
      </svg>

      {/* the skill folder, on its way in */}
      {fOp > 0 && (
        <div
          style={{
            position: "absolute", left: fx - fw / 2, top: fy - fh / 2, width: fw,
            transform: `scale(${fk}) rotate(${fRot}deg)`, transformOrigin: "50% 50%",
            opacity: fOp,
          }}
        >
          <Folder w={fw} open={0} />
        </div>
      )}
    </div>
  );
};
