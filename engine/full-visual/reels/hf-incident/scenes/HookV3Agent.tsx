// Hook V3's agent: a small glass robot (capsule head with a dark visor and two glowing eye slits, an antenna with a
// status light, a rounded body with a chest light, two arms). Drawn in svg units, origin at its feet, 1 unit tall, so
// the cube renderer places it with one transform. `press` raises both palms to the glass in front of it.
import React from "react";

export type AgentLook = { color: string; press: number; lit: number; id: number };

const HEAD = "M-0.3 -0.93 h0.6 a0.2 0.2 0 0 1 0.2 0.2 v0.1 a0.2 0.2 0 0 1 -0.2 0.2 h-0.6 a0.2 0.2 0 0 1 -0.2 -0.2 v-0.1 a0.2 0.2 0 0 1 0.2 -0.2 z";

/** full detail, for the near cubes and the swarm's front row */
export const AgentGlyph: React.FC<AgentLook> = ({ color, press, lit, id }) => {
  const g = `v3ag${id % 2}`;
  // arms: hanging at the sides, or raised with both palms flat on the glass beside the head (press 1)
  const arm = (side: -1 | 1) => {
    const sx = side * 0.26;
    const sy = -0.42;
    const ex = side * (0.34 + 0.1 * press);
    const ey = -0.12 - 0.66 * press;
    return (
      <g key={side}>
        <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#9fb8c9" strokeWidth={0.085} strokeLinecap="round" opacity={0.9} />
        <circle cx={ex} cy={ey} r={0.06 + 0.07 * press} fill={press > 0.5 ? "#E8F8FF" : color} stroke={color} strokeWidth={0.03} opacity={0.3 + 0.7 * Math.max(press, 0.3) * lit} />
      </g>
    );
  };
  return (
    <g>
      {arm(-1)}
      {arm(1)}
      <rect x={-0.24} y={-0.5} width={0.48} height={0.44} rx={0.16} fill={`url(#${g}b)`} stroke="#c9e6f5" strokeOpacity={0.35} strokeWidth={0.02} />
      <circle cx={0} cy={-0.3} r={0.045} fill={color} opacity={0.35 + 0.65 * lit} />
      <line x1={0} y1={-0.93} x2={0} y2={-1.06} stroke="#9fb8c9" strokeWidth={0.03} />
      <circle cx={0} cy={-1.08} r={0.045} fill={color} opacity={0.3 + 0.7 * lit} />
      <path d={HEAD} fill={`url(#${g}h)`} stroke="#d8f0ff" strokeOpacity={0.45} strokeWidth={0.022} />
      <rect x={-0.36} y={-0.82} width={0.72} height={0.26} rx={0.12} fill="#05080c" />
      <rect x={-0.24} y={-0.73} width={0.15} height={0.07} rx={0.035} fill={color} opacity={0.3 + 0.7 * lit} />
      <rect x={0.09} y={-0.73} width={0.15} height={0.07} rx={0.035} fill={color} opacity={0.3 + 0.7 * lit} />
      <rect x={-0.28} y={-0.9} width={0.4} height={0.05} rx={0.025} fill="#fff" opacity={0.28} />
    </g>
  );
};

/** simplified for distance: the head capsule and its two eyes, still unmistakably the same robot */
export const AgentChip: React.FC<{ color: string; lit: number }> = ({ color, lit }) => (
  <g>
    <rect x={-0.22} y={-0.5} width={0.44} height={0.44} rx={0.16} fill="#1b2a36" />
    <path d={HEAD} fill="#22394a" />
    <rect x={-0.34} y={-0.82} width={0.68} height={0.26} rx={0.12} fill="#05080c" />
    <rect x={-0.26} y={-0.74} width={0.18} height={0.09} rx={0.04} fill={color} opacity={0.3 + 0.7 * lit} />
    <rect x={0.08} y={-0.74} width={0.18} height={0.09} rx={0.04} fill={color} opacity={0.3 + 0.7 * lit} />
  </g>
);

/** the gradients the glyphs use: one svg <defs> per stage */
export const AgentDefs: React.FC = () => (
  <>
    {[0, 1].map((k) => (
      <React.Fragment key={k}>
        <linearGradient id={`v3ag${k}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4b6a80" />
          <stop offset="0.5" stopColor="#1e3444" />
          <stop offset="1" stopColor="#0f1c26" />
        </linearGradient>
        <linearGradient id={`v3ag${k}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a5568" />
          <stop offset="1" stopColor="#101c25" />
        </linearGradient>
      </React.Fragment>
    ))}
  </>
);
