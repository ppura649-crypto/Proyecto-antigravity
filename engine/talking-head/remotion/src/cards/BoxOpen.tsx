import React from "react";
import type { CardProps } from "./props";
import { MONO_FONT } from "./theme";
import { BoxGlyph, CAP_SHADOW } from "./Box";

// reference edit G V12 "so we decided to make them PUBLIC." The same box the viewer has been staring at
// since 23 s, still sealed and still labelled AI EDITOR SYSTEM, finally opened: the tape splits
// on "decided", the flaps lift on "make", and on "public." the files inside rise out and fan
// above it. The reveal of the mystery, held open.
export type BoxOpenData = { label?: string; files?: string[] };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const outCubic = (p: number) => 1 - Math.pow(1 - p, 3);

const Sheet: React.FC<{ w: number; h: number; name: string }> = ({ w, h, name }) => {
  const fs = Math.min(24, (w - 0.13 * w) / (0.60 * Math.max(name.length, 1)));
  return (
    <svg width={w} height={h} style={{ display: "block", filter: CAP_SHADOW }}>
      <rect x={0} y={0} width={w} height={h} fill="#FDFBF6" />
      <rect x={0.5} y={0.5} width={w - 1} height={h - 1} fill="none" stroke="#D6D0C2" strokeWidth={1.4} />
      <text
        x={w / 2} y={h * 0.30} textAnchor="middle"
        style={{ fontFamily: MONO_FONT, fontSize: fs, fill: "#1F1E1D" } as React.CSSProperties}
      >{name}</text>
      {[0.50, 0.62, 0.74, 0.86].map((f, i) => (
        <rect key={f} x={w * 0.11} y={h * f} width={(w * 0.78) * (i === 3 ? 0.52 : i === 1 ? 0.88 : 1)}
          height={Math.max(2, h * 0.026)} fill="#CBC5B7" />
      ))}
    </svg>
  );
};

export const BoxOpen: React.FC<CardProps & { data: BoxOpenData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const bw = 0.530 * w, bh = 0.541 * h;
  const bx = (w - bw) / 2, by = 0.99 * h - bh;
  const dx = 0.17 * bw, dy = 0.115 * bh, fw = bw - dx;

  const splitAt = beats.decided ?? fromMs + 340;
  const openAt = beats.make ?? splitAt + 510;
  const outAt = beats.public ?? openAt + 330;

  const split = clamp01((tMs - splitAt) / 300);
  const open = outCubic(clamp01((tMs - openAt) / 320));

  const files = data.files ?? [];
  const sw = 0.191 * w, sh = 0.251 * h;         // one file sheet
  const mouth = { x: bx + (fw + dx) / 2, y: by + dy * 0.5 };
  const gap = 0.178 * w;
  const lift = [0.108, 0.031, 0, 0.031, 0.108];  // the fan's arc, as a fraction of h

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <div style={{ position: "absolute", left: bx, top: by, width: bw, height: bh }}>
        <BoxGlyph w={bw} h={bh} text={data.label ?? ""} open={open} split={split} flare={55} />
      </div>

      {files.slice(0, 5).map((name, i) => {
        const at = outAt + i * 30;
        const p = outCubic(clamp01((tMs - at) / 300));
        if (p <= 0) return null;
        const tx = w / 2 + (i - 2) * gap - sw / 2;
        const tyy = 0.135 * h + lift[i] * h - sh / 2;
        const x = mouth.x - sw / 2 + (tx - (mouth.x - sw / 2)) * p;
        const y = mouth.y - sh / 2 + (tyy - (mouth.y - sh / 2)) * p;
        const k = 0.34 + 0.66 * p;
        return (
          <div key={name} style={{
            position: "absolute", left: x, top: y, width: sw, height: sh,
            transform: `scale(${k.toFixed(3)}) rotate(${((i - 2) * 6 * p).toFixed(2)}deg)`,
            transformOrigin: "50% 100%", opacity: Math.min(1, p * 3),
          }}>
            <Sheet w={sw} h={sh} name={name} />
          </div>
        );
      })}
    </div>
  );
};
