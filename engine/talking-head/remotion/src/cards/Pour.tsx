import React from "react";
import type { CardProps } from "./props";
import { ACCENT, label } from "./theme";
import { BoxGlyph, CAP_SHADOW } from "./Box";

// reference edit G V15 "the system is YOURS, you could technically continue making content with it
// FOREVER." The box the files came out of, still open, now tagged: a hang tag swings down on
// "yours,", and from "continue" reels come out of its mouth at one every 140 ms and lay
// themselves into a grid, row after row. The rate never slows and the card is cut mid-pour.
export type PourData = { tag?: string; label?: string };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const outCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const PER = 140;            // one reel every 140 ms: a RATE, never mapped over the card
const FLY = 420;            // how long one tile takes to reach its slot

const FIELDS = ["#F1EBDF", "#C2C8CF", ACCENT];
const ORDER = [0, 1, 0, 2, 1, 0, 1];

const Tile: React.FC<{ w: number; h: number; field: number }> = ({ w, h, field }) => {
  const on = field === 2;
  return (
    <svg width={w} height={h} style={{ display: "block", filter: CAP_SHADOW }}>
      <rect x={0} y={0} width={w} height={h} fill={FIELDS[field]} />
      <rect x={0.5} y={0.5} width={w - 1} height={h - 1} fill="none" stroke={on ? "#F4C6AF" : "#FFFFFF"} strokeWidth={1.6} opacity={0.9} />
      <polygon
        points={`${w * 0.40},${h * 0.38} ${w * 0.68},${h * 0.50} ${w * 0.40},${h * 0.62}`}
        fill={on ? "#FFFFFF" : "#2A2724"} opacity={on ? 0.95 : 0.72}
      />
      <rect x={w * 0.13} y={h * 0.80} width={w * 0.60} height={Math.max(2, h * 0.035)} fill={on ? "#FFFFFF" : "#2A2724"} opacity={0.35} />
    </svg>
  );
};

export const Pour: React.FC<CardProps & { data: PourData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const bw = 0.342 * w, bh = 0.505 * h;
  const bx = 0.066 * w, by = 0.96 * h - bh;
  const dx = 0.17 * bw, dy = 0.115 * bh, fw = bw - dx;

  const tagAt = beats.yours ?? fromMs + 450;
  const runAt = beats.continue ?? tagAt + 1020;

  // the grid the reels lay themselves into, to the right of the box
  const tw = 0.0604 * w, th = 0.2065 * h;
  const gx = 0.545 * w, gy = 0.170 * h, px = 0.0765 * w, py = 0.2373 * h;
  const cols = 5, rows = 3;
  const mouth = { x: bx + (fw + dx) / 2, y: by + dy * 0.5 };

  const n = tMs >= runAt ? Math.floor((tMs - runAt) / PER) + 1 : 0;
  const last = runAt + (n - 1) * PER;
  const kick = n > 0 && tMs - last < 130 ? 0.022 * Math.sin(Math.PI * ((tMs - last) / 130)) : 0;

  // the hang tag: a pendulum about the string's end, swinging in and settling
  const st = tMs - tagAt;
  const ang = st < 0 ? -58 : -58 * Math.exp(-st / 230) * Math.cos((2 * Math.PI * st) / 330);
  const L = 0.28 * h;
  const ax = bx + 0.98 * fw, ay = by + 0.55 * dy;
  const hx = ax + L * Math.sin((ang * Math.PI) / 180), hy = ay + L * Math.cos((ang * Math.PI) / 180);
  const tagW = 0.165 * w, tagH = 0.112 * h, nose = 0.026 * w;
  const tfs = 0.058 * h;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <div style={{
        position: "absolute", left: bx, top: by, width: bw, height: bh,
        transform: `scale(${(1 + kick * 0.5).toFixed(4)}, ${(1 - kick).toFixed(4)})`, transformOrigin: "50% 100%",
      }}>
        <BoxGlyph w={bw} h={bh} text={data.label ?? ""} open={1} split={1} flare={25} />
      </div>

      {tMs >= tagAt && (
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: CAP_SHADOW }}>
          <title>a YOURS tag hung on the box</title>
          <line x1={ax} y1={ay} x2={hx} y2={hy} stroke="#F2F2F2" strokeWidth={0.004 * w} strokeLinecap="round" />
          <g transform={`translate(${hx} ${hy}) rotate(${ang})`}>
            <path
              d={`M ${-nose} 0 L ${-nose * 0.38} ${-tagH / 2} L ${tagW - nose} ${-tagH / 2} L ${tagW - nose} ${tagH / 2} L ${-nose * 0.38} ${tagH / 2} Z`}
              fill={ACCENT}
            />
            <circle cx={0} cy={0} r={0.0075 * w} fill="#F2F2F2" />
            <text
              x={(tagW - nose * 1.38) / 2} y={tfs * 0.36} textAnchor="middle"
              style={{ ...label(tfs, "#FFFFFF") } as React.CSSProperties}
            >{data.tag ?? "YOURS"}</text>
          </g>
        </svg>
      )}

      {Array.from({ length: Math.max(0, n) }, (_, i) => {
        const at = runAt + i * PER;
        const p = outCubic(clamp01((tMs - at) / FLY));
        const slot = i;
        const over = slot >= cols * rows;                 // the grid is full: keep the rate, send it past the edge
        const col = over ? cols + (slot % 3) : slot % cols;
        const row = over ? (slot % rows) : Math.floor(slot / cols);
        const tx = gx + col * px, tyy = gy + row * py;
        const x = mouth.x - tw / 2 + (tx - (mouth.x - tw / 2)) * p;
        const y = mouth.y - th / 2 + (tyy - (mouth.y - th / 2)) * p - 0.135 * h * Math.sin(Math.PI * p);
        const k = 0.36 + 0.64 * p;
        const rot = (i % 2 ? -22 : 18) * (1 - p);
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, width: tw, height: th,
            transform: `scale(${k.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`, transformOrigin: "50% 50%",
            opacity: over ? Math.min(1, p * 3) * (1 - p) : Math.min(1, p * 4),
          }}>
            <Tile w={tw} h={th} field={ORDER[i % ORDER.length]} />
          </div>
        );
      })}
    </div>
  );
};
