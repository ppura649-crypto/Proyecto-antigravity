// Hook X4, the theft. "Chinese": a violet probe leaves the Qwen vessel, charges, and spears the glass: a crack of
// light, the glass fractures from the wound, sparks spray. "copy": the thinking is ripped out through the wound as one
// luminous ribbon (a braided strand of terracotta light) that arches across the stage, whips on its spring and pours
// into Qwen's mouth, shedding sparks. Its tail leaves the glass just before "models".
import React, { useMemo } from "react";
import { ease, prog } from "../../../src/engine";
import { CLAUDE, QWEN } from "./parts";
import { P, T, bez, coreAt, exitAt, levelAt, mouthAt, qwenAt, ribbonCurve, ribbonSpan, rnd, QS } from "./HookX4Geo";

const poly = (pts: P[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
const toward = (a: P, b: P, d: number): P => {
  const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: a.x + ((b.x - a.x) / l) * d, y: a.y + ((b.y - a.y) / l) * d };
};

/** where the probe leaves the vessel: the vessel's shoulder facing the glass */
const muzzle = (t: T) => toward(qwenAt(t), coreAt(t), QS * 0.34);

/** the probe: charge on "do", fire, spear the glass on "Chinese", then hold as a thin humming tether until "copy" */
export const Probe: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const m = muzzle(t);
  const e = exitAt(t);
  const tip = { x: e.x - e.nx * 30, y: e.y - e.ny * 30 };
  const charge = prog(f, t.chinese - 14, 9, ease.in) * (1 - prog(f, t.chinese - 4, 6, ease.out));
  const fly = prog(f, t.chinese - 5, 5, ease.in);
  const gone = prog(f, t.copy + 4, 10, ease.linear);
  if (f < t.chinese - 14 || gone >= 1) return null;
  const head = { x: m.x + (tip.x - m.x) * fly, y: m.y + (tip.y - m.y) * fly };
  const tail = f < t.chinese ? { x: m.x + (head.x - m.x) * 0.45, y: m.y + (head.y - m.y) * 0.45 } : m;
  const hum = 0.6 + 0.4 * Math.sin(f * 0.9);
  const w = f < t.chinese + 3 ? 7 : 3.2;
  return (
    <svg width={900} height={930} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <circle cx={m.x} cy={m.y} r={10 + 34 * charge} fill={QWEN} opacity={0.5 * charge} style={{ filter: "blur(8px)" }} />
      <circle cx={m.x} cy={m.y} r={4 + 8 * charge} fill="#E9E6FF" opacity={charge} />
      {fly > 0 && (
        <g opacity={1 - gone} strokeLinecap="round">
          <line x1={tail.x} y1={tail.y} x2={head.x} y2={head.y} stroke={QWEN} strokeWidth={w * 4} opacity={0.45 * (f < t.chinese ? 1 : hum)} style={{ filter: "blur(6px)" }} />
          <line x1={tail.x} y1={tail.y} x2={head.x} y2={head.y} stroke="#9C98FF" strokeWidth={w} />
          <line x1={tail.x} y1={tail.y} x2={head.x} y2={head.y} stroke="#F2F0FF" strokeWidth={w * 0.4} />
          <circle cx={head.x} cy={head.y} r={f < t.chinese ? 9 : 5} fill="#FFFFFF" style={{ filter: `drop-shadow(0 0 10px ${QWEN})` }} />
        </g>
      )}
    </svg>
  );
};

type Ray = { a: number; len: number; kinks: number[] };
/** a fracture fanning from the wound across the face of the glass */
const buildRays = (): Ray[] =>
  Array.from({ length: 9 }, (_, j) => ({ a: (j / 8 - 0.5) * 2.5 + (rnd(j, 61) - 0.5) * 0.3, len: 0.35 + 0.55 * rnd(j, 62), kinks: [rnd(j, 63) - 0.5, rnd(j, 64) - 0.5, rnd(j, 65) - 0.5] }));

/** the glass cracks at the wound on "Chinese", runs further on "AI", and splits wide on "copy"; light bleeds through */
export const Cracks: React.FC<{ t: T }> = ({ t }) => {
  const rays = useMemo(buildRays, []);
  const { f } = t;
  if (f < t.chinese) return null;
  const c = coreAt(t);
  const e = exitAt(t);
  const grow = 0.5 * prog(f, t.chinese, 9, ease.outHard) + 0.25 * prog(f, t.ai, 10, ease.outHard) + 0.25 * prog(f, t.copy - 2, 8, ease.outHard);
  const base = Math.atan2(-e.ny, -e.nx);
  const hot = 0.55 + 0.45 * Math.sin(f * 0.7);
  const paths = rays.map((r, j) => {
    const L = c.r * r.len * Math.min(1, grow * (1.1 + 0.4 * rnd(j, 66)));
    const pts: P[] = [e];
    for (let k = 1; k <= 3; k++) {
      const a = base + r.a + r.kinks[k - 1] * 0.5;
      pts.push({ x: e.x + Math.cos(a) * (L * k) / 3, y: e.y + Math.sin(a) * (L * k) / 3 });
    }
    return poly(pts);
  });
  return (
    <svg width={900} height={930} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <clipPath id="x4glass">
          <circle cx={c.x} cy={c.y} r={c.r + 30} />
        </clipPath>
      </defs>
      <g clipPath="url(#x4glass)" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {paths.map((d, j) => <path key={`g${j}`} d={d} stroke="#FFB892" strokeWidth={10} opacity={0.55 * hot} style={{ filter: "blur(5px)" }} />)}
        {paths.map((d, j) => <path key={`c${j}`} d={d} stroke="#FFF4EC" strokeWidth={2.2} opacity={0.95} />)}
      </g>
    </svg>
  );
};

type Spark = { vx: number; vy: number; col: string; life: number };
const trail = (s: Spark, n: number, drag: number, g: number) => {
  let x = 0, y = 0, vx = s.vx, vy = s.vy;
  for (let i = 0; i < n; i++) { x += vx; y += vy; vx *= drag; vy = vy * drag + g; }
  return { x, y, vx, vy };
};

/** the crack of light on "Chinese": a white-violet flash at the wound and a spray of sparks with motion trails */
export const Impact: React.FC<{ t: T }> = ({ t }) => {
  const k = t.f - t.chinese;
  const sparks = useMemo(() => Array.from({ length: 34 }, (_, i): Spark => {
    const a = (rnd(i, 71) - 0.5) * 3.2;
    const v = 7 + 22 * rnd(i, 72);
    return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, col: ["#FFFFFF", "#B9B6FF", "#FFC7AE"][i % 3], life: 16 + 20 * rnd(i, 73) };
  }), []);
  if (k < 0 || k > 40) return null;
  const e = exitAt(t);
  const base = Math.atan2(e.ny, e.nx);
  const fl = 1 - prog(t.f, t.chinese, 16, ease.out);
  const r = 40 + 260 * prog(t.f, t.chinese, 14, ease.outHard);
  return (
    <>
      <div style={{ position: "absolute", left: e.x - r, top: e.y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: `radial-gradient(circle, #FFFFFF 0%, #E6E4FF 14%, ${QWEN}88 34%, transparent 66%)`, opacity: fl }} />
      <svg width={900} height={930} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {sparks.map((s, i) => {
          if (k > s.life) return null;
          const rot = { vx: s.vx * Math.cos(base) - s.vy * Math.sin(base), vy: s.vx * Math.sin(base) + s.vy * Math.cos(base), col: s.col, life: s.life };
          const p = trail(rot, k, 0.9, 0.6);
          const o = 1 - k / s.life;
          return <line key={i} x1={e.x + p.x} y1={e.y + p.y} x2={e.x + p.x - p.vx * 2.2} y2={e.y + p.y - p.vy * 2.2} stroke={s.col} strokeWidth={2.5 + 2 * o} strokeLinecap="round" opacity={o} />;
        })}
      </svg>
    </>
  );
};

/** the ribbon's visible points, each with its normal and how far along the visible span it sits */
function ribbonPoints(t: T) {
  const c = ribbonCurve(t);
  const { head, tail } = ribbonSpan(t);
  const N = 72;
  const pts: (P & { nx: number; ny: number; u: number })[] = [];
  for (let i = 0; i <= N; i++) {
    const s = tail + ((head - tail) * i) / N;
    const p = bez(c, s);
    const q = bez(c, Math.min(1, s + 0.004));
    const l = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    pts.push({ ...p, nx: -(q.y - p.y) / l, ny: (q.x - p.x) / l, u: i / N });
  }
  return { pts, head, tail, c };
}

/** the stolen thinking in transit: glow, body, four braided strands, a white-hot core and pulses running to Qwen */
export const Ribbon: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  if (f < t.copy - 1) return null;
  const { pts, head, tail } = ribbonPoints(t);
  if (head - tail < 0.002) return null;
  const taper = (u: number) => Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u * 0.92 + 0.04))), 0.45);
  const strand = (j: number) => poly(pts.map((p) => {
    const o = 22 * taper(p.u) * Math.sin(p.u * 19 - f * 0.5 + j * 1.57);
    return { x: p.x + p.nx * o, y: p.y + p.ny * o };
  }));
  const spine = poly(pts);
  const hp = pts[pts.length - 1];
  const flying = head < 1;
  return (
    <svg width={900} height={930} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={spine} stroke={CLAUDE} strokeWidth={80} opacity={0.4} style={{ filter: "blur(20px)" }} />
        <path d={spine} stroke="#E07F5C" strokeWidth={32} opacity={0.75} style={{ filter: "blur(3px)" }} />
        {[0, 1, 2, 3].map((j) => <path key={j} d={strand(j)} stroke={j % 2 ? "#FFD7C4" : "#F29A76"} strokeWidth={3.5} opacity={0.95} />)}
        <path d={spine} stroke="#FFF5EE" strokeWidth={6} />
      </g>
      {Array.from({ length: 10 }, (_, i) => {
        const u = (f * 0.028 + i / 10) % 1;
        const p = pts[Math.round(u * (pts.length - 1))];
        return <circle key={i} cx={p.x} cy={p.y} r={4 + 4 * Math.sin(Math.PI * u)} fill="#FFF8F2" opacity={0.9} style={{ filter: "drop-shadow(0 0 10px #FFB08A)" }} />;
      })}
      {flying && <circle cx={hp.x} cy={hp.y} r={24} fill="#FFF3EA" style={{ filter: `drop-shadow(0 0 22px ${CLAUDE}) drop-shadow(0 0 8px #FFFFFF)` }} />}
    </svg>
  );
};

/** sparks the ribbon sheds as it strains: two a frame, falling off it with gravity */
export const Shed: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  if (f < t.copy + 4) return null;
  const c = ribbonCurve(t);
  const { head, tail } = ribbonSpan(t);
  const out: React.ReactNode[] = [];
  for (let b = Math.max(t.copy + 4, f - 22); b <= Math.min(f, t.models - 4); b++)
    for (let j = 0; j < 2; j++) {
      const age = f - b;
      const s = tail + (head - tail) * rnd(b * 2 + j, 81);
      const p0 = bez(c, s);
      const p = trail({ vx: (rnd(b * 2 + j, 82) - 0.5) * 6, vy: (rnd(b * 2 + j, 83) - 0.7) * 5, col: "", life: 22 }, age, 0.95, 0.35);
      const o = 1 - age / 22;
      out.push(<line key={`${b}-${j}`} x1={p0.x + p.x} y1={p0.y + p.y} x2={p0.x + p.x - p.vx * 2} y2={p0.y + p.y - p.vy * 2} stroke="#FFC8AE" strokeWidth={2.4} strokeLinecap="round" opacity={o} />);
    }
  return <svg width={900} height={930} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "drop-shadow(0 0 5px #F08A62)" }}>{out}</svg>;
};

/** inside the vessel: the stream falls from the mouth onto the rising surface and splashes there */
export const Pour: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const on = prog(f, t.copy + 12, 4, ease.out) * (1 - prog(f, t.models, 8, ease.in));
  if (on <= 0) return null;
  const m = mouthAt(t);
  const q = qwenAt(t);
  const surf = q.y + QS * 0.46 - levelAt(t) * QS * 0.9;
  const wob = Math.sin(f * 0.6) * 5;
  const d = `M${m.x} ${m.y} Q${m.x + wob} ${(m.y + surf) / 2} ${m.x - wob * 0.5} ${Math.max(m.y + 4, surf)}`;
  const sp = 0.7 + 0.3 * Math.sin(f * 0.8);
  return (
    <svg width={900} height={930} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} opacity={on}>
      <path d={d} stroke={CLAUDE} strokeWidth={26} fill="none" opacity={0.45} strokeLinecap="round" style={{ filter: "blur(8px)" }} />
      <path d={d} stroke="#FFE9DD" strokeWidth={6} fill="none" strokeLinecap="round" />
      <ellipse cx={m.x} cy={Math.max(m.y + 4, surf)} rx={46 * sp} ry={12 * sp} fill="#FFD9C6" opacity={0.75} style={{ filter: `blur(6px) drop-shadow(0 0 18px ${CLAUDE})` }} />
    </svg>
  );
};
