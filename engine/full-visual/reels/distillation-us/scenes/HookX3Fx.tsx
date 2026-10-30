// Hook X3, what flies and rises: sparks with gravity off the slam, the violet pour and its splash, the drips before
// it, steam, embers drifting up off the bed, the flashes. All in screen space through the bed camera (proj), so a
// spark born on the bed rim leaves from exactly there.
import React from "react";
import { interpolateColors } from "remotion";
import { ease, prog } from "../../../src/engine";
import { QWEN } from "./parts";
import { H, T, W, proj, rand } from "./HookX3Space";

type Burst = { at: number; n: number; seed: number; r0: number; r1: number; vr: [number, number]; vz: [number, number]; life: [number, number]; kind: "fire" | "metal"; z0?: number };

/** one particle's position on the bed after `age` frames: launched, pulled down, bouncing once or twice on the bed */
function fly(b: Burst, i: number, age: number) {
  const a = rand(i, b.seed) * Math.PI * 2;
  const r = b.r0 + (b.r1 - b.r0) * rand(i, b.seed + 1);
  let x = r * Math.cos(a);
  let y = r * Math.sin(a);
  let z = b.z0 ?? 4;
  const sp = b.vr[0] + (b.vr[1] - b.vr[0]) * rand(i, b.seed + 2);
  let vx = sp * Math.cos(a + (rand(i, b.seed + 3) - 0.5) * 0.7);
  let vy = sp * Math.sin(a + (rand(i, b.seed + 3) - 0.5) * 0.7);
  let vz = b.vz[0] + (b.vz[1] - b.vz[0]) * rand(i, b.seed + 4);
  const steps = Math.max(0, Math.round(age * 2));
  for (let s = 0; s < steps; s++) {
    x += vx * 0.5; y += vy * 0.5; z += vz * 0.5;
    vz -= 0.45; vx *= 0.992; vy *= 0.992;
    if (z < 0) { z = -z * 0.3; vz = -vz * 0.32; vx *= 0.6; vy *= 0.6; }
  }
  return { x, y, z };
}

const FIRE = ["#FFFFFF", "#FFE7A0", "#FFA442", "#E3521C", "#7A1C0C"];
const METAL = ["#FFFFFF", "#E4E1FF", "#A6A2FF", QWEN, "#2E2896"];

const Particles: React.FC<{ f: number; b: Burst }> = ({ f, b }) => {
  const age = f - b.at;
  if (age < 0 || age > b.life[1] + 2) return null;
  return (
    <>
      {Array.from({ length: b.n }, (_, i) => {
        const life = b.life[0] + (b.life[1] - b.life[0]) * rand(i, b.seed + 5);
        const u = age / life;
        if (u >= 1) return null;
        const p = fly(b, i, age);
        const q = fly(b, i, Math.max(0, age - 1.8));
        const a = proj(p.x, p.y, p.z);
        const c = proj(q.x, q.y, q.z);
        const col = interpolateColors(u, [0, 0.15, 0.4, 0.7, 1], b.kind === "fire" ? FIRE : METAL);
        const w = (b.kind === "fire" ? 2.4 : 5) * (0.6 + rand(i, b.seed + 6)) * a.s * (1 - 0.5 * u);
        return <line key={i} x1={c.x} y1={c.y} x2={a.x} y2={a.y} stroke={col} strokeWidth={w} strokeLinecap="round" opacity={u > 0.7 ? (1 - u) / 0.3 : 1} />;
      })}
    </>
  );
};

/** every burst of the hook: the slam, three drips before the pour, the pour's crown, the cast torn out */
function bursts(t: T): Burst[] {
  const out: Burst[] = [
    { at: t.ch, n: 120, seed: 70, r0: 140, r1: 200, vr: [5, 19], vz: [6, 24], life: [22, 58], kind: "fire" },
    { at: t.ch + 1, n: 40, seed: 80, r0: 60, r1: 180, vr: [2, 9], vz: [14, 30], life: [30, 60], kind: "fire" },
    { at: t.copy, n: 60, seed: 90, r0: 0, r1: 30, vr: [3, 12], vz: [8, 20], life: [16, 34], kind: "metal" },
    { at: t.mo - 6, n: 50, seed: 100, r0: 120, r1: 190, vr: [3, 11], vz: [6, 18], life: [18, 40], kind: "fire" },
  ];
  [16, 26, 33].forEach((d, k) => out.push({ at: t.co + d, n: 9, seed: 110 + k * 7, r0: 0, r1: 12, vr: [2, 6], vz: [4, 9], life: [10, 18], kind: "metal" }));
  for (let s = t.copy + 3; s < t.an; s += 3) out.push({ at: s, n: 6, seed: 200 + s, r0: 0, r1: 40, vr: [2, 8], vz: [4, 13], life: [10, 22], kind: "metal" });
  return out;
}

export const Sparks: React.FC<{ t: T }> = ({ t }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "drop-shadow(0 0 6px #FF9A3A)" }}>
    {bursts(t).map((b, i) => (
      <Particles key={i} f={t.f} b={b} />
    ))}
  </svg>
);

/** the three drips that fall before the pour, then the stream itself: violet metal from above the frame */
export const Stream: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const o = proj(0, 0, 0);
  const drips = [16, 26, 33].map((d, k) => {
    const u = prog(f, t.co + d - 10, 10, ease.in);
    if (u <= 0 || u >= 1) return null;
    const y = -40 + (o.y + 40) * u;
    return <ellipse key={k} cx={o.x + 3 * Math.sin(k * 2)} cy={y} rx={7} ry={16 + 12 * u} fill="#E9E7FF" />;
  });
  const head = -80 + (o.y + 80) * prog(f, t.copy - 8, 8, ease.in);
  const tail = -80 + (o.y + 80) * prog(f, t.an - 2, 12, ease.in);
  const live = f >= t.copy - 8 && tail < o.y - 4;
  const path = () => {
    const n = 24;
    const L: string[] = [];
    const R: string[] = [];
    for (let i = 0; i <= n; i++) {
      const y = tail + ((head - tail) * i) / n;
      const w = 16 - 6 * ((y + 80) / (o.y + 80)) + 2 * Math.sin(y / 23 + f / 1.5);
      const x = o.x + 7 * Math.sin(y / 60 - f / 5) * ((o.y - y) / o.y);
      L.push(`${(x - w).toFixed(1)} ${y.toFixed(1)}`);
      R.unshift(`${(x + w).toFixed(1)} ${y.toFixed(1)}`);
    }
    return `M${L.join(" L")} L${R.join(" L")} Z`;
  };
  const d = live ? path() : "";
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="x3str" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9F9BFF" />
          <stop offset="0.7" stopColor="#E6E4FF" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
        <filter id="x3strglow" x="-200%" y="-20%" width="500%" height="140%">
          <feGaussianBlur stdDeviation={16} />
        </filter>
      </defs>
      <g filter="url(#x3strglow)" opacity={0.95}>
        {drips}
        {live && <path d={d} fill={QWEN} transform={`translate(${o.x} 0) scale(2.4 1) translate(${-o.x} 0)`} />}
      </g>
      {drips}
      {live && <path d={d} fill="url(#x3str)" />}
      {live && <path d={`M${o.x} ${tail} L${o.x} ${head}`} stroke="#FFFFFF" strokeWidth={4} strokeDasharray="40 70" strokeDashoffset={-f * 34} opacity={0.8} />}
    </svg>
  );
};

/** steam: soft plumes off the hot metal, lit violet while it pours, warm once it glows orange; a big hiss on
 *  "anthropic" */
export const Steam: React.FC<{ t: T; front?: boolean }> = ({ t, front }) => {
  const { f } = t;
  const births: { s: number; i: number; big: boolean }[] = [];
  for (let s = t.copy + 2; s <= f; s += 2) births.push({ s, i: s, big: false });
  for (let i = 0; i < 26; i++) births.push({ s: t.an + Math.floor(i / 3), i: 900 + i, big: true });
  return (
    <>
      {births.map(({ s, i, big }) => {
        if (!!front !== rand(i, 131) > 0.8) return null;
        const age = f - s;
        const life = (big ? 70 : 55) + 30 * rand(i, 132);
        if (age < 0 || age > life) return null;
        const u = age / life;
        const a = rand(i, 133) * Math.PI * 2;
        const r = 230 * Math.sqrt(rand(i, 134));
        const o = proj(r * Math.cos(a), r * Math.sin(a), 0);
        const rad = (big ? 60 : 36) + (big ? 190 : 120) * Math.sqrt(u);
        const x = o.x + (rand(i, 135) - 0.5) * 260 * u + 20 * Math.sin(age / 14 + i);
        const y = o.y - (big ? 5 : 3.2) * age * (0.7 + 0.6 * rand(i, 136)) - 20;
        const warm = f >= t.an + 6;
        const col = warm ? "255,226,205" : "226,224,255";
        const op = (big ? 0.1 : 0.09) * Math.min(1, u * 6) * (1 - u) * (1 - 0.7 * prog(f, t.mo - 6, 20, ease.out));
        return <div key={i} style={{ position: "absolute", left: x - rad, top: y - rad, width: rad * 2, height: rad * 2, borderRadius: "50%", background: `radial-gradient(circle, rgba(${col},${op.toFixed(3)}) 0%, rgba(${col},${(op * 0.4).toFixed(3)}) 45%, transparent 70%)` }} />;
      })}
    </>
  );
};

/** embers always rising off the bed, near ones big and bright, far ones small: the forge is never still */
export const Embers: React.FC<{ t: T }> = ({ t }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, filter: "drop-shadow(0 0 4px #FF8A2A)" }}>
    {Array.from({ length: 56 }, (_, i) => {
      const cyc = 90 + 80 * rand(i, 141);
      const ph = ((t.f + rand(i, 142) * cyc) % cyc) / cyc;
      const a = rand(i, 143) * Math.PI * 2;
      const r = 200 + 480 * rand(i, 144);
      const p = proj(r * Math.cos(a) + 30 * Math.sin(t.f / 17 + i), r * Math.sin(a), 20 + 520 * ph);
      const fl = 0.6 + 0.4 * Math.sin(t.f / 3 + i * 1.7);
      return <circle key={i} cx={p.x} cy={p.y} r={Math.max(0.8, 2.1 * p.s)} fill={ph < 0.4 ? "#FFD27A" : "#FF7A2A"} opacity={Math.sin(Math.PI * ph) * fl * Math.min(1, p.s * 0.8)} />;
    })}
  </svg>
);

/** light with a source: the slam's white-orange flash and the pour's violet bloom, both from the bed centre */
export const Flash: React.FC<{ t: T }> = ({ t }) => {
  const o = proj(0, 0, 0);
  const slam = t.f >= t.ch ? 1 - prog(t.f, t.ch, 16, ease.out) : 0;
  const pour = t.f >= t.copy ? 1 - prog(t.f, t.copy, 22, ease.out) : 0;
  const disc = (k: number, r: number, c: string) => (k > 0 ? <div style={{ position: "absolute", left: o.x - r, top: o.y - r * 0.8, width: r * 2, height: r * 1.6, borderRadius: "50%", background: c, opacity: k }} /> : null);
  return (
    <>
      {disc(slam, 430, "radial-gradient(ellipse, #FFFFFF 0%, #FFE2B0 12%, #FF8A3A66 32%, transparent 62%)")}
      {disc(pour * 0.6, 460, `radial-gradient(ellipse, #FFFFFF 0%, #DAD7FF 16%, ${QWEN}77 36%, transparent 66%)`)}
    </>
  );
};
