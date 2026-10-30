// Hook X4, Claude's glass core. The real Claude mark is its heart; around it the thinking runs as living streams of
// terracotta light: branching 3D paths inside the sphere, turning slowly (near ones thick and bright, far ones thin and
// dim), pulses of light racing along them. On "copy" the streams are sucked toward the wound and leave; on
// "anthropic" the core goes dark, an empty glass with a grey mark.
import React, { useMemo } from "react";
import { ease, prog } from "../../../src/engine";
import { CLAUDE, Logo } from "./parts";
import { P, T, coreAt, drainAt, exitAt, lightAt, mix, rnd } from "./HookX4Geo";

type V3 = [number, number, number];
type Stream = { pts: V3[]; i: number };

const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/** a mind at work: 9 roots from the centre, each walking outward in a swirl, branching as it goes, kept inside the glass */
function buildStreams(): Stream[] {
  const out: Stream[] = [];
  let seed = 1;
  const walk = (from: V3, dir: V3, steps: number, depth: number) => {
    const pts: V3[] = [from];
    let p = from;
    let d = dir;
    for (let s = 0; s < steps; s++) {
      seed++;
      const j: V3 = [rnd(seed, 3) - 0.5, rnd(seed, 5) - 0.5, rnd(seed, 7) - 0.5];
      d = norm([d[0] + j[0] * 0.7 - d[2] * 0.28, d[1] + j[1] * 0.7, d[2] + j[2] * 0.7 + d[0] * 0.28]);
      let n: V3 = [p[0] + d[0] * 0.09, p[1] + d[1] * 0.09, p[2] + d[2] * 0.09];
      const r = Math.hypot(n[0], n[1], n[2]);
      if (r > 0.9) {
        const h = norm(n);
        const dot = d[0] * h[0] + d[1] * h[1] + d[2] * h[2];
        d = norm([d[0] - 1.8 * dot * h[0], d[1] - 1.8 * dot * h[1], d[2] - 1.8 * dot * h[2]]);
        n = [h[0] * 0.88, h[1] * 0.88, h[2] * 0.88];
      }
      pts.push(n);
      p = n;
      if (depth < 2 && out.length < 44 && rnd(seed, 11) < 0.2)
        walk(p, norm([d[0] + rnd(seed, 13) - 0.5, d[1] + rnd(seed, 17) - 0.5, d[2] + rnd(seed, 19) - 0.5]), 5 + Math.floor(rnd(seed, 23) * 5), depth + 1);
    }
    out.push({ pts, i: out.length });
  };
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    const dir = norm([Math.cos(a), (rnd(k, 29) - 0.5) * 1.4, Math.sin(a)]);
    walk([dir[0] * 0.2, dir[1] * 0.2, dir[2] * 0.2], dir, 9 + Math.floor(rnd(k, 31) * 5), 0);
  }
  return out;
}

/** turn the tree, tilt it toward the lens, project it onto the core; depth 0 = far, 1 = near */
function project(v: V3, f: number, c: { x: number; y: number; r: number }) {
  const a = 0.6 + f * 0.013;
  const x1 = v[0] * Math.cos(a) + v[2] * Math.sin(a);
  const z1 = -v[0] * Math.sin(a) + v[2] * Math.cos(a);
  const tilt = 0.38;
  const y2 = v[1] * Math.cos(tilt) - z1 * Math.sin(tilt);
  const z2 = v[1] * Math.sin(tilt) + z1 * Math.cos(tilt);
  const s = 1 / (1 - 0.22 * z2);
  return { x: c.x + x1 * c.r * 0.9 * s, y: c.y + y2 * c.r * 0.9 * s, d: (z2 + 1) / 2 };
}

const smooth = (pts: P[]) => {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const m = mix(pts[i], pts[i + 1], 0.5);
    d += ` Q${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${m.x.toFixed(1)} ${m.y.toFixed(1)}`;
  }
  const l = pts[pts.length - 1];
  return `${d} L${l.x.toFixed(1)} ${l.y.toFixed(1)}`;
};

/** the thinking: every stream projected, then (from "copy") pulled toward the wound and gone, staggered */
const Streams: React.FC<{ t: T }> = ({ t }) => {
  const tree = useMemo(buildStreams, []);
  const c = coreAt(t);
  const ex = exitAt(t);
  const drain = drainAt(t);
  const light = lightAt(t);
  const lines = tree.map((s) => {
    const pull = Math.max(0, Math.min(1, drain * 1.7 - 0.7 * rnd(s.i, 41)));
    const pr = s.pts.map((v) => project(v, t.f, c));
    const pts = pr.map((p, k) => mix(p, ex, pull * (0.35 + 0.65 * ((k + 1) / pr.length)) ** 0.7));
    const d = pr.reduce((a, p) => a + p.d, 0) / pr.length;
    return { path: smooth(pts), d, o: (1 - pull) * light, i: s.i };
  });
  return (
    <svg width={900} height={930} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <filter id="x4glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      <g filter="url(#x4glow)" opacity={0.9}>
        {lines.map((l) => (
          <path key={l.i} d={l.path} fill="none" stroke={CLAUDE} strokeWidth={4 + 8 * l.d} strokeLinecap="round" opacity={l.o * (0.25 + 0.75 * l.d)} />
        ))}
      </g>
      {lines.map((l) => (
        <path key={`s${l.i}`} d={l.path} fill="none" stroke="#F4A27F" strokeWidth={1.2 + 2.6 * l.d} strokeLinecap="round" opacity={l.o * (0.2 + 0.8 * l.d)} />
      ))}
      {lines.map((l) => {
        const run = (t.f * (0.018 + 0.014 * rnd(l.i, 43)) + rnd(l.i, 47)) % 1.3;
        return (
          <path key={`p${l.i}`} d={l.path} pathLength={1} fill="none" stroke="#FFF1E6" strokeWidth={2 + 3.5 * l.d} strokeLinecap="round"
            strokeDasharray="0.14 2" strokeDashoffset={-run + 0.14} opacity={l.o * (0.35 + 0.65 * l.d)} style={{ filter: "drop-shadow(0 0 6px #FFB38F)" }} />
        );
      })}
    </svg>
  );
};

/** the glass body behind the thinking: dark smoked glass lit from inside by the thinking's own light */
const GlassBack: React.FC<{ t: T }> = ({ t }) => {
  const c = coreAt(t);
  const L = lightAt(t);
  return (
    <>
      <div style={{ position: "absolute", left: c.x - c.r * 2.1, top: c.y - c.r * 2.1, width: c.r * 4.2, height: c.r * 4.2, borderRadius: "50%", background: `radial-gradient(circle, ${CLAUDE}${Math.round(60 * L + 8).toString(16).padStart(2, "0")} 0%, ${CLAUDE}14 38%, transparent 66%)` }} />
      <div style={{ position: "absolute", left: c.x - c.r, top: c.y - c.r, width: c.r * 2, height: c.r * 2, borderRadius: "50%", background: `radial-gradient(circle at 50% 55%, rgba(120,52,30,${(0.42 * L + 0.06).toFixed(3)}) 0%, rgba(38,20,16,0.78) 58%, rgba(14,10,10,0.92) 100%)`, boxShadow: "0 40px 90px #000D" }} />
    </>
  );
};

/** the heart: the real Claude mark, turning, glowing with its thinking; greyed and cold once emptied */
const Heart: React.FC<{ t: T }> = ({ t }) => {
  const c = coreAt(t);
  const L = lightAt(t);
  const size = c.r * 0.8;
  const rot = t.f * 0.35 + 12 * Math.sin(t.f / 23);
  const flare = 1 + 0.06 * Math.sin(t.f / 7) * L;
  return (
    <div style={{ position: "absolute", left: c.x - size / 2, top: c.y - size / 2, width: size, height: size, transform: `rotate(${rot.toFixed(1)}deg) scale(${flare.toFixed(3)})` }}>
      <Logo name="claude" size={size} style={{ filter: `saturate(${(0.25 + 0.75 * L).toFixed(2)}) brightness(${(0.45 + 0.65 * L).toFixed(2)}) drop-shadow(0 0 ${(6 + 30 * L).toFixed(0)}px ${CLAUDE}${L > 0.5 ? "EE" : "66"})` }} />
    </div>
  );
};

/** the glass front: a rim of light, a fresnel edge and a soft specular window, so the sphere reads as glass */
const GlassFront: React.FC<{ t: T }> = ({ t }) => {
  const c = coreAt(t);
  const L = lightAt(t);
  const d = c.r * 2;
  return (
    <div style={{ position: "absolute", left: c.x - c.r, top: c.y - c.r, width: d, height: d, borderRadius: "50%", boxShadow: `inset 0 0 ${(c.r * 0.28).toFixed(0)}px rgba(255,190,160,${(0.1 + 0.2 * L).toFixed(2)}), inset 0 -${(c.r * 0.12).toFixed(0)}px ${(c.r * 0.3).toFixed(0)}px rgba(217,119,87,${(0.08 + 0.3 * L).toFixed(2)}), 0 0 0 1.5px rgba(255,236,226,0.22)` }}>
      <div style={{ position: "absolute", left: d * 0.17, top: d * 0.09, width: d * 0.42, height: d * 0.24, borderRadius: "50%", transform: "rotate(-28deg)", background: "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 45%, transparent 72%)" }} />
      <div style={{ position: "absolute", left: d * 0.62, top: d * 0.7, width: d * 0.2, height: d * 0.1, borderRadius: "50%", transform: "rotate(-30deg)", background: "radial-gradient(ellipse, rgba(255,220,200,0.16) 0%, transparent 70%)" }} />
    </div>
  );
};

export const Core: React.FC<{ t: T }> = ({ t }) => (
  <>
    <GlassBack t={t} />
    <Streams t={t} />
    <Heart t={t} />
    <GlassFront t={t} />
  </>
);

/** the settle light on the stage: warm while the core is full, easing off as it drains */
export const coreGlowAt = (t: T) => lightAt(t) * (1 - 0.3 * prog(t.f, t.models, 20, ease.out));
