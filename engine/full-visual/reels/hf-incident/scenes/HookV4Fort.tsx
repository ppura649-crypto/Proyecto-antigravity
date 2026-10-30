// The Hugging Face fortress at the far end of the field: a hexagonal plinth lit on its top edge, a cylinder wall of
// yellow light around it (drawn in two halves so the agents cling in front of and behind it), and a warm glow behind
// the keep. The wall's strength comes from shield(): a shimmer, then flicker and dropouts with every hit, then dark.
import React from "react";
import { interpolateColors } from "remotion";
import { HF, HF_ORANGE, RED } from "./parts";
import { arcPts, FORT, pathOf, proj } from "./HookV4World";

const hexPts = (h: number) =>
  Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k + Math.PI / 6;
    return proj(Math.cos(a) * FORT.plinthR, FORT.d + Math.sin(a) * FORT.plinthR, h);
  });

/** the plinth the keep stands on: only the faces turned to the camera, top edge lit */
export const Plinth: React.FC<{ level: number; burst: number }> = ({ level, burst }) => {
  const lo = hexPts(0);
  const hi = hexPts(FORT.plinthH);
  const faces: React.ReactNode[] = [];
  for (let k = 0; k < 6; k++) {
    const j = (k + 1) % 6;
    const a = (Math.PI / 3) * (k + 0.5) + Math.PI / 6;
    if (Math.sin(a) > 0) continue;
    faces.push(<path key={k} d={pathOf([lo[k], lo[j], hi[j], hi[k]], true)} fill={k % 2 ? "#15181D" : "#1D2027"} stroke="#000" strokeOpacity={0.4} />);
  }
  const edge = interpolateColors(Math.min(1, level + burst), [0, 1], ["#4A4636", HF]);
  return (
    <svg width={900} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      {faces}
      <path d={pathOf(hi, true)} fill="#23262D" stroke={edge} strokeWidth={2.5} />
      <path d={pathOf(hi, true)} fill="none" stroke={edge} strokeWidth={8} opacity={0.35} filter="url(#v4fg)" />
      <defs>
        <filter id="v4fg" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
    </svg>
  );
};

/** one half of the light wall: back (the far side, 0..PI) or front (PI..2PI) */
export const Wall: React.FC<{ half: "back" | "front"; level: number; hit: number; f: number }> = ({ half, level, hit, f }) => {
  const [a0, a1] = half === "back" ? [0, Math.PI] : [Math.PI, Math.PI * 2];
  const bot = arcPts(FORT.R, FORT.d, 0, a0, a1);
  const top = arcPts(FORT.R, FORT.d, FORT.wallH, a0, a1).reverse();
  const col = interpolateColors(hit, [0, 0.6, 1], [HF, HF_ORANGE, RED]);
  const id = `v4wall${half}`;
  const o = half === "back" ? 0.55 : 0.4;
  const dead = level < 0.02;
  // a live wall has faint vertical ribs drifting round, so it reads as a field of light, not a flat band
  const ribs = [];
  for (let k = 0; k < 18; k++) {
    const a = a0 + ((k + ((f * 0.02) % 1)) / 18) * (a1 - a0);
    const p = arcPts(FORT.R, FORT.d, 0, a, a, 1)[0];
    const q = arcPts(FORT.R, FORT.d, FORT.wallH * 0.9, a, a, 1)[0];
    ribs.push(<path key={k} d={`M${p.x} ${p.y} L${q.x} ${q.y}`} stroke={col} strokeWidth={1.5} opacity={0.35 * level} />);
  }
  return (
    <svg width={900} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={col} stopOpacity={0.9} />
          <stop offset="0.5" stopColor={col} stopOpacity={0.25} />
          <stop offset="1" stopColor={col} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}g`} x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>
      <path d={pathOf([...bot, ...top], true)} fill={`url(#${id})`} opacity={o * level} />
      {ribs}
      <path d={pathOf(bot)} fill="none" stroke={col} strokeWidth={14} opacity={0.8 * level} filter={`url(#${id}g)`} />
      <path d={pathOf(bot)} fill="none" stroke={dead ? "#3A3A3A" : "#FFF6D0"} strokeWidth={dead ? 2 : 3} opacity={dead ? 0.6 : Math.min(1, 0.4 + level)} />
      <path d={pathOf(top.slice().reverse())} fill="none" stroke={col} strokeWidth={1.5} opacity={0.6 * level} />
    </svg>
  );
};

/** the warm light behind the keep while the wall holds */
export const Halo: React.FC<{ x: number; y: number; level: number }> = ({ x, y, level }) => (
  <div style={{ position: "absolute", left: x - 260, top: y - 260, width: 520, height: 520, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(255,210,30,${(0.12 + 0.3 * level).toFixed(3)}), rgba(255,157,0,${(0.05 + 0.1 * level).toFixed(3)}) 55%, transparent)` }} />
);
