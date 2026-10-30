import React from "react";
import type { CardProps } from "../props";
import { GREEN, SANS, beat, box, clamp, life, mix, ramp, settle } from "./S-util";
// V14 "record" (builder S, 2026-09-25), Everything 31267 -> 33100. A physical red record key on a dark desk, and
// behind it a line of standing tiles: Cut, Captions, Visuals, Ready. On "press record" the key travels down hard and
// its ring lights red; the tiles go over like dominoes, a real little rigid-body chain (each tips on gravity, its
// top corner strikes the next, then rests leaning on it), and the last, Ready, lands flat on its back, face up, and
// turns green on "done,". Everything is 3D (matrix3d faces on a tilted floor), shadows move with the tiles.

const H = 210, WD = 180, T = 26, S = 150, N = 4;
const LABELS = ["Cut", "Captions", "Visuals", "Ready"];
const px = (i: number) => i * S + T;                       // tile i tips about its far bottom edge
const HALF = Math.PI / 2;

// the angle at which tile i's top corner meets tile i+1 (standing at phi)
const blockAt = (i: number, phi: number) => {
  const q0x = px(i + 1) - T * Math.cos(phi), q0z = T * Math.sin(phi);
  const q1x = q0x + H * Math.sin(phi), q1z = q0z + H * Math.cos(phi);
  const f = (th: number) => (q1x - q0x) * (H * Math.cos(th) - q0z) - (q1z - q0z) * (px(i) + H * Math.sin(th) - q0x);
  const s0 = Math.sign(f(0));
  if (Math.sign(f(HALF)) === s0) return HALF;
  let a = 0, b = HALF;
  for (let k = 0; k < 26; k++) { const m = (a + b) / 2; if (Math.sign(f(m)) === s0) a = m; else b = m; }
  return a;
};
const A = 55, W0 = 2.6;                                    // gravity term (1/s^2), the key's kick (rad/s)
// the chain at `ms` after the kick: angles (rad) and the moment the last tile lands
const simulate = (ms: number) => {
  const th = [0, 0, 0, 0], w = [W0, 0, 0, 0];
  let land = -1;
  const steps = Math.min(Math.max(0, Math.floor(ms)), 1400);
  for (let s = 0; s < steps; s++) {
    const dt = 0.001;
    for (let i = 0; i < N; i++) if (th[i]! > 0 || w[i]! > 0) { w[i]! += A * Math.sin(Math.max(th[i]!, 0.02)) * dt; th[i]! += w[i]! * dt; }
    for (let i = N - 2; i >= 0; i--) {
      const b = blockAt(i, th[i + 1]!);
      if (th[i]! > b) {
        if (w[i + 1] === 0) w[i + 1] = w[i]! * 0.8;
        else if (w[i]! > w[i + 1]!) w[i + 1]! += (w[i]! - w[i + 1]!) * 0.3;
        th[i] = b; w[i] = Math.min(w[i]!, 0.5 * w[i + 1]!);
      }
    }
    if (th[N - 1]! >= HALF) { if (land < 0) land = s; th[N - 1] = HALF; w[N - 1] = -0.15 * w[N - 1]!; }
  }
  return { th, land };
};
const LAND = simulate(1400).land;                         // ms from the kick to Ready landing

type V3 = [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// a flat div of w x h px placed with its top-left at p0, top-right at p1, bottom-left at p3 (world px, z up)
const Face: React.FC<{ p0: V3; p1: V3; p3: V3; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }> =
  ({ p0, p1, p3, w, h, style, children }) => {
    const u = sub(p1, p0).map((x) => x / w) as V3, v = sub(p3, p0).map((x) => x / h) as V3;
    const n = cross(u, v), l = Math.hypot(...n) || 1;
    const m = [u[0], u[1], u[2], 0, v[0], v[1], v[2], 0, n[0] / l, n[1] / l, n[2] / l, 0, p0[0], p0[1], p0[2], 1];
    return (
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transformOrigin: "0 0",
        transform: `matrix3d(${m.map((x) => x.toFixed(5)).join(",")})`, ...style }}>{children}</div>
    );
  };

// tile-local (dx from the pivot, y across, dz up) to world, tipped by th about the pivot line
const tw = (i: number, th: number) => (dx: number, y: number, dz: number): V3 =>
  [px(i) + dx * Math.cos(th) + dz * Math.sin(th), y, -dx * Math.sin(th) + dz * Math.cos(th)];

const Tile: React.FC<{ i: number; th: number; green: number }> = ({ i, th, green }) => {
  const p = tw(i, th), hw = WD / 2;
  const face = green > 0 ? `rgb(${mix(244, 74, green)},${mix(241, 222, green)},${mix(234, 128, green)})` : "#F4F1EA";
  const lit = 0.9 + 0.1 * Math.sin(th);                  // the face catches more light as it turns up
  return (
    <>
      {/* shadow on the floor under the tile */}
      <Face p0={[px(i) - T - 6, -hw - 8, 0.5]} p1={[px(i) + H * Math.sin(th) + 18, -hw - 8, 0.5]} p3={[px(i) - T - 6, hw + 10, 0.5]}
        w={100} h={100} style={{ background: "rgba(0,0,0,0.55)", filter: `blur(${mix(9, 5, th / HALF)}px)`, opacity: mix(0.7, 0.9, th / HALF) }} />
      {/* back face (+x), sides, top, then the label face (-x) */}
      <Face p0={p(0, hw, H)} p1={p(0, -hw, H)} p3={p(0, hw, 0)} w={WD} h={H} style={{ background: "#CFCABE" }} />
      <Face p0={p(-T, -hw, H)} p1={p(0, -hw, H)} p3={p(-T, -hw, 0)} w={T} h={H} style={{ background: "#BEB8AC" }} />
      <Face p0={p(-T, hw, H)} p1={p(0, hw, H)} p3={p(-T, hw, 0)} w={T} h={H} style={{ background: "linear-gradient(180deg, #E4DFD4, #CFC9BD)" }} />
      <Face p0={p(-T, hw, H)} p1={p(-T, -hw, H)} p3={p(0, hw, H)} w={WD} h={T} style={{ background: "#EAE6DD" }} />
      <Face p0={p(-T, -hw, H)} p1={p(-T, hw, H)} p3={p(-T, -hw, 0)} w={WD} h={H}
        style={{ background: face, filter: `brightness(${lit})`, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 34, textAlign: "center", fontFamily: SANS, fontWeight: 800,
          fontSize: i === 1 ? 29 : 34, letterSpacing: -0.5, color: "#16171a" }}>{LABELS[i]}</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 80, textAlign: "center", fontFamily: SANS, fontWeight: 700,
          fontSize: 13, letterSpacing: 2, color: green > 0.5 ? "rgba(10,40,20,0.7)" : "#8f8a80" }}>{`0${i + 1} / 04`}</div>
      </Face>
    </>
  );
};

// the record key: graphite housing, a lit ring, a red cap that travels down
const KX = -210, KS = 150, KH = 34, CAP = 96;
const Key: React.FC<{ travel: number; ring: number }> = ({ travel, ring }) => {
  const h2 = KS / 2, top = KH;
  const capTop = top + mix(26, 5, travel);
  const discs = Math.max(1, Math.round((capTop - top) / 1.5));
  return (
    <>
      <Face p0={[KX - h2 - 14, -h2 - 10, 0.4]} p1={[KX + h2 + 20, -h2 - 10, 0.4]} p3={[KX - h2 - 14, h2 + 16, 0.4]} w={100} h={100}
        style={{ background: "rgba(0,0,0,0.6)", filter: "blur(10px)" }} />
      <Face p0={[KX - h2, h2, top]} p1={[KX + h2, h2, top]} p3={[KX - h2, h2, 0]} w={KS} h={KH} style={{ background: "linear-gradient(180deg, #3a3b40, #1c1d21)" }} />
      <Face p0={[KX - h2, -h2, top]} p1={[KX - h2, h2, top]} p3={[KX - h2, -h2, 0]} w={KS} h={KH} style={{ background: "linear-gradient(180deg, #45464c, #26272b)" }} />
      <Face p0={[KX - h2, -h2, top]} p1={[KX + h2, -h2, top]} p3={[KX - h2, h2, top]} w={KS} h={KS}
        style={{ background: "radial-gradient(circle at 35% 30%, #4a4b51, #2a2b30 70%)", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.08)" }} />
      {/* the lit ring */}
      <Face p0={[KX - CAP / 2 - 12, -CAP / 2 - 12, top + 0.6]} p1={[KX + CAP / 2 + 12, -CAP / 2 - 12, top + 0.6]} p3={[KX - CAP / 2 - 12, CAP / 2 + 12, top + 0.6]}
        w={CAP + 24} h={CAP + 24} style={{ borderRadius: "50%",
          background: `radial-gradient(circle, rgba(0,0,0,0) 58%, rgba(${mix(120, 255, ring)},${mix(120, 70, ring)},${mix(125, 60, ring)},${mix(0.5, 1, ring)}) 66%, rgba(${mix(60, 255, ring)},${mix(60, 60, ring)},${mix(60, 50, ring)},${mix(0.3, 0.9, ring)}) 72%, rgba(0,0,0,0) 76%)`,
          boxShadow: `0 0 ${mix(4, 34, ring)}px ${mix(0, 10, ring)}px rgba(255,60,50,${0.55 * ring})` }} />
      {/* the cap: a stack of discs makes the cylinder wall, the top disc is the face */}
      {Array.from({ length: discs }, (_, k) => {
        const z = top + 1 + ((capTop - top - 1) * k) / discs;
        return <Face key={k} p0={[KX - CAP / 2, -CAP / 2, z]} p1={[KX + CAP / 2, -CAP / 2, z]} p3={[KX - CAP / 2, CAP / 2, z]} w={CAP} h={CAP}
          style={{ borderRadius: "50%", background: "#8e1612" }} />;
      })}
      <Face p0={[KX - CAP / 2, -CAP / 2, capTop]} p1={[KX + CAP / 2, -CAP / 2, capTop]} p3={[KX - CAP / 2, CAP / 2, capTop]} w={CAP} h={CAP}
        style={{ borderRadius: "50%", background: "radial-gradient(circle at 40% 36%, #ff5a4a 0%, #e0261c 45%, #b3150f 100%)",
          boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.12)" }}>
        <div style={{ position: "absolute", left: CAP / 2 - 13, top: CAP / 2 - 13, width: 26, height: 26, borderRadius: "50%",
          background: "rgba(255,255,255,0.92)" }} />
      </Face>
    </>
  );
};

export const Record: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fromMs, toMs, beats }) => {
  const press = beat(beats, "press", 32125), done = beat(beats, "done", 32965);
  const travel = ramp(t, press, press + 95, (x) => x * x) - 0.12 * Math.sin(Math.PI * clamp((t - press - 95) / 120)) * (t > press + 95 ? 1 : 0);
  const hit = press + 95;                                   // the key bottoms out: the kick
  const kick = Math.max(hit, done - 100 - LAND);            // Ready lands just before "done," and is green on it
  const { th, land } = simulate(t - kick);
  const landedAt = land >= 0 ? kick + land : Infinity;
  const green = Number.isFinite(landedAt) ? ramp(t, landedAt + 10, landedAt + 90) : 0;
  const ring = ramp(t, press + 40, press + 140);
  // the desk arrives on "Everything", settling up into place; a slow push on the whole life
  const s = settle(t, fromMs - 90, 440);
  return (
    <div style={box(w, h)}>
      <div style={life(t, fromMs, toMs, 0.035, "50% 55%")}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 62% 70% at 52% 55%, #2a2a2e 0%, #141416 60%, #0a0a0b 100%)" }} />
        <div style={{ position: "absolute", inset: 0, perspective: 1500, perspectiveOrigin: "50% 10%", transform: `translateY(${mix(40, 0, s)}px)` }}>
          <div style={{ position: "absolute", left: 470, top: 360, width: 0, height: 0, transformStyle: "preserve-3d",
            transform: "rotateX(58deg) rotateZ(-30deg) translateX(-60px)" }}>
            <Key travel={clamp(travel, 0, 1.1)} ring={ring} />
            {LABELS.map((_, i) => <Tile key={i} i={i} th={th[i]!} green={i === N - 1 ? green : 0} />)}
          </div>
        </div>
      </div>
    </div>
  );
};
