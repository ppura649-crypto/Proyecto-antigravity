// Hook X1, the swarm and the light it steals. Thousands of faceless account avatars (the default profile silhouette,
// drawn once in <defs>, a <use> each) in three depth layers: behind the mark, in front of it, and a few flying past
// the lens out of focus. Near ones big and bright, far ones small and dim; the ones pecking the mark catch its
// terracotta light on their rim. The sparks are one layer on top: embers riding the avatars off before "copy", the
// river to Qwen after it.
import React from "react";
import { ease, prog } from "../../../src/engine";
import { CLAUDE } from "./parts";
import { BOX, D, N, T, avatarAt, camAt, flashesAt, nearOf, project, sparksAt } from "./HookX1World";

const AvatarDef: React.FC<{ id: string; body: string; sil: string; rim: string; rimW: number }> = ({ id, body, sil, rim, rimW }) => (
  <>
    <radialGradient id={`${id}g`} cx="0.35" cy="0.28" r="0.85">
      <stop offset="0" stopColor={body} stopOpacity={1} />
      <stop offset="1" stopColor="#0B0D12" />
    </radialGradient>
    <clipPath id={`${id}c`}>
      <circle r={37} />
    </clipPath>
    <g id={id}>
      <circle r={40} fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id}c)`} fill={sil}>
        <circle cx={0} cy={-9} r={14.5} />
        <ellipse cx={0} cy={33} rx={27} ry={20} />
      </g>
      <circle r={39} fill="none" stroke={rim} strokeWidth={rimW} />
    </g>
  </>
);

type Drawn = { i: number; x: number; y: number; px: number; py: number; s: number; z: number; o: number; id: string };

/** light from Claude's mark: warm while it is full, fading as it is drained */
const lightAt = (t: T) => 1 - 0.6 * prog(t.f, t.anth - 4, 30, ease.out);

export const SwarmLayer: React.FC<{ t: T; side: "back" | "front" | "lens" }> = ({ t, side }) => {
  const { f } = t;
  const g = camAt(t, f);
  const gp = camAt(t, f - 3);
  const light = lightAt(t);
  const list: Drawn[] = [];
  for (let i = 0; i < N; i++) {
    const a = avatarAt(t, i, f);
    if (!a) continue;
    const q = project(g, a.p);
    const lens = q.s > 1.55;
    if (side === "lens" ? !lens : lens || (side === "front") !== a.p.z < D) continue;
    const b = avatarAt(t, i, f - 3) ?? a;
    const qb = project(gp, b.p);
    const near = nearOf(a.p.z);
    const warm = a.peck > 0.25 && light > 0.55 ? "x1w" : a.peck > 0.25 || near > 0.72 ? "x1m" : "x1c";
    const o = (0.25 + 0.75 * near) * prog(a.u, 0, 0.35, ease.linear);
    list.push({ i, x: q.x, y: q.y, px: qb.x, py: qb.y, s: q.s, z: a.p.z, o, id: warm });
  }
  list.sort((m, n) => n.z - m.z);
  const blur = side === "lens" ? 5 : side === "back" ? 1.4 : 0;
  return (
    <svg width={BOX.w} height={BOX.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: blur ? `blur(${blur}px)` : undefined }}>
      <defs>
        <AvatarDef id="x1c" body="#4B5468" sil="#8D97AC" rim="#6B7489" rimW={2} />
        <AvatarDef id="x1m" body="#5A6479" sil="#B3BCCD" rim="#C9D1E0" rimW={2.5} />
        <AvatarDef id="x1w" body="#6A5A58" sil="#E9C6B6" rim={CLAUDE} rimW={5} />
      </defs>
      {list.map((d) => {
        const len = Math.hypot(d.x - d.px, d.y - d.py);
        if (len < 8) return null;
        return <line key={`t${d.i}`} x1={d.px} y1={d.py} x2={d.x} y2={d.y} stroke="#9AA6BF" strokeOpacity={0.2 * d.o} strokeWidth={Math.min(10, Math.max(1.5, 7 * d.s))} strokeLinecap="round" />;
      })}
      {list.map((d) => (
        <use key={d.i} href={`#${d.id}`} opacity={d.o} transform={`translate(${d.x.toFixed(1)} ${d.y.toFixed(1)}) scale(${(0.27 * d.s).toFixed(3)})`} />
      ))}
    </svg>
  );
};

/** the stolen light: white-hot cores in terracotta glow, streaked by their speed */
export const SparkLayer: React.FC<{ t: T }> = ({ t }) => {
  const sp = sparksAt(t, t.f);
  const fl = flashesAt(t, t.f);
  return (
    <svg width={BOX.w} height={BOX.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <filter id="x1sg" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={4} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#x1sg)">
        {fl.map((h) => (
          <circle key={`h${h.key}`} cx={h.x} cy={h.y} r={2.5 + 6 * h.k} fill="#FFE2D2" opacity={0.8 * h.k} />
        ))}
        {sp.map((s) => (
          <line key={`l${s.key}`} x1={s.px} y1={s.py} x2={s.x} y2={s.y} stroke={CLAUDE} strokeOpacity={0.85 * s.o} strokeWidth={s.r * 1.2} strokeLinecap="round" />
        ))}
        {sp.map((s) => (
          <circle key={s.key} cx={s.x} cy={s.y} r={s.r * 0.62} fill="#FFE9DD" opacity={s.o} />
        ))}
      </g>
    </svg>
  );
};

/** depth in the dark: warm dust drifting at the lens */
export const Dust: React.FC<{ t: T }> = ({ t }) => {
  const g = camAt(t, t.f);
  return (
    <svg width={BOX.w} height={BOX.h} style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: 80 }, (_, i) => {
        const z = 300 + ((((i * 977) % 2400) - t.f * 5) % 2400 + 2400) % 2400;
        const p = project(g, { x: (((i * 7919) % 2600) / 2600 - 0.5) * 2600, y: (((i * 104729) % 2600) / 2600 - 0.5) * 2600, z });
        return <circle key={i} cx={p.x} cy={p.y} r={Math.min(3, 1.3 * p.s)} fill="#F2C4AE" opacity={Math.min(0.4, 0.3 * p.s)} />;
      })}
    </svg>
  );
};
