import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { KINDS as HOLO_H } from "../holo/famH";
import { Phone } from "./L-reel";
import { clamp, easeInOut, easeOut3, mix, pick, win } from "./L-util";
// keyframes-v1 hook T1 (builder T, 2026-09-25) "Rubik cube". Title alone to NOW, then a real 3x3 cube (black
// plastic body, bevelled glossy tiles) tumbles in and lands on AND. Its six faces are their real frames: five raw
// stills of this take (empty chair, walking in, eyes down, talking) and, on the front, a frame of their finished
// captioned reel. It starts scrambled for real (a simulated cube: the three solving turns undone, plus a back turn
// that is never undone), so the front shows raw pieces. Quarter turns with weight on IT'S (R), EXACTLY (U) and HOW (F)
// solve the front face; the cube turns face-on, and on GOT the solved face lifts off and becomes their finished reel
// playing on a phone, landed by ~2460 and held under a slow push; clean exit at 2997.

type V3 = [number, number, number];
type M3 = number[]; // row-major 3x3
const mul = (a: M3, b: M3): M3 => {
  const o: number[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]);
  return o;
};
const app = (m: M3, v: V3): V3 => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const I3: M3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const rot = (axis: number, deg: number): M3 => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  if (axis === 0) return [1, 0, 0, 0, c, -s, 0, s, c];
  if (axis === 1) return [c, 0, s, 0, 1, 0, -s, 0, c];
  return [c, -s, 0, s, c, 0, 0, 0, 1];
};
const css = (m: M3, t: V3 = [0, 0, 0]) =>
  `matrix3d(${m[0]},${m[3]},${m[6]},0,${m[1]},${m[4]},${m[7]},0,${m[2]},${m[5]},${m[8]},0,${t[0]},${t[1]},${t[2]},1)`;
const norm = (v: V3): V3 => { const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l]; };
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const S = 112, INS = 6, CUBE_Y = 300, P = 1500;
// faces: normal, element x axis, element y axis, image
type Face = { n: V3; u: V3; v: V3; img: string };
const FACES: Face[] = [
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], img: "T-fin.jpg" },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], img: "T-raw-0.jpg" },
  { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0], img: "T-raw-1.jpg" },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], img: "T-raw-2.jpg" },
  { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0], img: "T-raw-3.jpg" },
  { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1], img: "T-raw-4.jpg" },
];
export const CUBE_ASSETS = [...FACES.map((f) => f.img), "kf-finished-reel.mp4"];
const FIN_OFF = (3 * S * (960 / 540 - 1)) * 0.357; // the square the front face shows of the 540 x 960 frame

type Move = { axis: number; layer: number; deg: number };
const SOLVE: Move[] = [{ axis: 0, layer: 1, deg: 90 }, { axis: 1, layer: -1, deg: -90 }, { axis: 2, layer: 1, deg: 90 }];
const PRE_OK: Move[] = [{ axis: 2, layer: -1, deg: 90 }]; // only back turns are allowed to stay (front stays solved)

type Cubie = { p0: V3; R: M3 };
const HOME: V3[] = [];
for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) if (i || j || k) HOME.push([i, j, k]);
const inLayer = (c: Cubie, m: Move) => Math.round(app(c.R, c.p0)[m.axis]) === m.layer;
const apply = (cs: Cubie[], m: Move, deg = m.deg): Cubie[] => cs.map((c) => (inLayer(c, m) ? { ...c, R: mul(rot(m.axis, deg), c.R) } : c));
// states before each solving turn: back turn kept, then the solve undone in reverse
const STATES: Cubie[][] = (() => {
  let cs: Cubie[] = HOME.map((p0) => ({ p0, R: I3 }));
  for (const m of PRE_OK) cs = apply(cs, m);
  for (let q = SOLVE.length - 1; q >= 0; q--) cs = apply(cs, SOLVE[q]!, -SOLVE[q]!.deg);
  const out = [cs];
  for (const m of SOLVE) { cs = apply(cs, m); out.push(cs); }
  return out;
})();

// a quarter turn with weight: slow start, fast middle, a 2 % give past the stop that settles back
const turnCurve = (u: number) => easeInOut(u) + 0.025 * Math.sin(Math.PI * clamp((u - 0.62) / 0.38));

const LIGHT = norm([-0.45, -0.75, 0.55]);
const HALF = norm([LIGHT[0], LIGHT[1], LIGHT[2] + 1]);

const Tile: React.FC<{ f: Face; p0: V3; nW: V3; src: string; hideFront: boolean; lift: number }> = ({ f, p0, nW, src, hideFront, lift }) => {
  const outward = Math.round(dot(p0, f.n)) === 1;
  if (nW[2] < -0.02) return null;
  const lit = Math.max(0, dot(nW, LIGHT));
  const shade = 1 - (1 - Math.min(1, 0.45 + 0.7 * lit)) * (1 - lift); // lift: the face turning into the light
  const spec = Math.pow(Math.max(0, dot(nW, HALF)), 40);
  const col = Math.round(dot(p0, f.u)) + 1, row = Math.round(dot(p0, f.v)) + 1;
  const isFin = f.img === "T-fin.jpg";
  const bgH = isFin ? (3 * S * 960) / 540 : 3 * S;
  const offY = isFin ? FIN_OFF : 0;
  const m: M3 = [f.u[0], f.v[0], f.n[0], f.u[1], f.v[1], f.n[1], f.u[2], f.v[2], f.n[2]];
  const nn = f.n;
  return (
    <div style={{ position: "absolute", left: -S / 2, top: -S / 2, width: S, height: S, backfaceVisibility: "hidden",
      transform: css(m, [nn[0] * S / 2, nn[1] * S / 2, nn[2] * S / 2]),
      background: `radial-gradient(circle at 35% 30%, #1d1d20 0%, #0c0c0e 70%)`,
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}>
      {outward && !(hideFront && f.n[2] === 1) && (
        <div style={{ position: "absolute", left: INS, top: INS, right: INS, bottom: INS, borderRadius: 7, overflow: "hidden",
          backgroundImage: `url(${src})`, backgroundSize: `${3 * S}px ${bgH}px`,
          backgroundPosition: `${-(col * S + INS)}px ${-(row * S + INS + offY)}px`,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22), inset 0 2px 2px rgba(255,255,255,0.28), inset 0 -2px 3px rgba(0,0,0,0.35)" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.25) 38%, rgba(255,255,255,0) 60%)",
            opacity: 0.05 + 0.6 * spec }} />
        </div>
      )}
      {/* the light on this face */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: 1 - shade }} />
      {/* the moulded bevel of the plastic body */}
      <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 0 1.5px rgba(255,255,255,${0.05 + 0.25 * spec})` }} />
    </div>
  );
};

export const Cube: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, h, fps, fromMs, toMs, beats, assets, data } = props;
  const b = { now: 1144, and: 1433, its: 1577, exactly: 1877, how: 1997, got: 2357, ...(beats as Record<string, number>) };
  const d = data ?? {};
  const k = w / 1080;
  const T = HOLO_H["holo-h-title"]!;
  if (t < b.now) {
    return <T {...props} h={h} fromMs={fromMs} toMs={b.now} data={{ lines: d.lines ?? ["I don't edit", "my videos anymore."], fontPx: d.fontPx ?? 120 }} />;
  }
  const src = (n: string) => staticFile(pick(assets, n));

  // --- the turns: [start, end] per solving move
  const TW = [[b.its - 30, b.its + 190], [b.exactly - 40, b.how - 5], [b.how + 5, b.how + 185]];
  let q = 0; let active: { m: Move; deg: number } | null = null;
  for (let i = 0; i < 3; i++) {
    const [a0, a1] = TW[i]!;
    if (t >= a1) q = i + 1;
    else if (t >= a0) { active = { m: SOLVE[i]!, deg: SOLVE[i]!.deg * turnCurve(win(t, a0, a1)) }; q = i; break; }
    else { q = i; break; }
  }
  const cubies = STATES[q]!;
  // reaction torque: the body answers each turn with a small counter-roll
  let react: M3 = I3;
  TW.forEach(([a0, a1], i) => {
    const u = win(t, a0, a1 + 120);
    if (u > 0 && u < 1) react = mul(rot(SOLVE[i]!.axis, -SOLVE[i]!.deg * 0.035 * Math.sin(Math.PI * u)), react);
  });

  // --- the cube in space: tumble in (NOW -> AND), rest at 3/4, face-on before GOT
  const inU = win(t, b.now, b.and + 60);
  const fly = easeOut3(inU);
  const faceOn = easeInOut(win(t, b.how + 100, b.got - 90));
  const ax = mix(-26, 0, faceOn) + (1 - fly) * 150, ay = mix(-34, 0, faceOn) + (1 - fly) * 230, az = (1 - fly) * -70;
  const pos: V3 = [mix(640, 0, fly), mix(-420, 0, easeOut3(clamp(inU * 1.15))) + 7 * Math.sin(Math.PI * win(t, b.and - 20, b.and + 200)), mix(-500, 0, fly)];
  const view = mul(mul(mul(rot(0, ax), rot(1, ay)), rot(2, az)), react);

  // --- GOT: the solved face lifts off into the phone
  const grow = easeInOut(win(t, b.got - 90, b.got + 95));
  const swap = t >= b.got - 90;
  const push = 1 + 0.025 * win(t, 2470, toMs);
  const out = win(t, toMs - 150, toMs);
  const cubeGone = win(t, b.got - 90, b.got - 40);
  const faceSide = (3 * S * P) / (P - 1.5 * S);
  const PS = 0.92, PH = { x: 540 - 146 * PS, y: 8 };
  const scr = { x: PH.x + 9 * PS, y: PH.y + 9 * PS, w: 274 * PS, h: 582 * PS };
  const fi = (INS * P) / (P - 1.5 * S);
  const fr = { x: 540 - faceSide / 2 + fi, y: CUBE_Y - faceSide / 2 + fi, w: faceSide - 2 * fi, h: faceSide - 2 * fi };
  const hr = { x: mix(fr.x, scr.x, grow), y: mix(fr.y, scr.y, grow), w: mix(fr.w, scr.w, grow), h: mix(fr.h, scr.h, grow) };
  const gap = (1 - grow) * (1 - grow) * (faceSide / 3) * (INS / S); // half the black between two tiles

  // --- motion blur on the fast tumble only
  const blur = Math.max(0, (1 - fly) * 9 - 0.8);
  const shadowK = fly * (1 - cubeGone);

  const cubieEls = cubies.map((c, i) => {
    let R = c.R;
    if (active && inLayer(c, active.m)) R = mul(rot(active.m.axis, active.deg), R);
    const RW = mul(view, R);
    return (
      <div key={i} style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d",
        transform: `${css(R)} translate3d(${c.p0[0] * S}px, ${c.p0[1] * S}px, ${c.p0[2] * S}px)` }}>
        {FACES.map((f, j) => (
          <Tile key={j} f={f} p0={c.p0} nW={app(RW, f.n)} src={src(f.img)} hideFront={swap} lift={f.n[2] === 1 ? 0.9 * faceOn : 0} />
        ))}
      </div>
    );
  });

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0", opacity: 1 - out }}>
      {/* soft shadow the cube throws on the wall behind it */}
      <div style={{ position: "absolute", left: 540 + pos[0] * 0.8 + 40 - 230, top: CUBE_Y + pos[1] * 0.8 + 70 - 190, width: 460, height: 380,
        borderRadius: "50%", background: "radial-gradient(closest-side, rgba(0,0,0,0.55), rgba(0,0,0,0))",
        opacity: shadowK * mix(1, 0.7, faceOn), filter: "blur(18px)", transform: `rotate(${mix(-20, 0, faceOn)}deg)` }} />
      {cubeGone < 1 && (
        <div style={{ position: "absolute", left: 540, top: CUBE_Y, width: 0, height: 0, perspective: P,
          opacity: 1 - cubeGone, filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
          <div style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d",
            transform: `translate3d(${pos[0]}px, ${pos[1]}px, ${pos[2] - 120 * cubeGone}px) ${css(view)}` }}>
            {cubieEls}
          </div>
        </div>
      )}
      {t >= b.got + 30 && (
        <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={b.got + 30} startSec={d.startSec ?? 0.92}
          style={{ left: 540 - 146, top: PH.y, opacity: win(t, b.got + 55, b.got + 100), transformOrigin: "50% 0",
            transform: `scale(${PS * push})` }} />
      )}
      {swap && (
        <div style={{ position: "absolute", left: hr.x, top: hr.y, width: hr.w, height: hr.h, overflow: "hidden",
          borderRadius: mix(7, 40 * PS, grow), opacity: 1 - win(t, b.got + 100, b.got + 140),
          transform: `scale(${mix(1, 1.04, Math.sin(Math.PI * grow))})`,
          boxShadow: `0 ${mix(6, 26, grow)}px ${mix(12, 50, grow)}px rgba(0,0,0,${mix(0.25, 0.5, grow)})` }}>
          <Img src={src("T-fin.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 35.7%" }} />
          {/* the black plastic between the tiles, closing as the face becomes one picture */}
          {gap > 0.2 && [1, 2].map((n) => (
            <React.Fragment key={n}>
              <div style={{ position: "absolute", left: (hr.w * n) / 3 - gap, top: 0, width: 2 * gap, height: "100%", background: "#0c0c0e" }} />
              <div style={{ position: "absolute", top: (hr.h * n) / 3 - gap, left: 0, height: 2 * gap, width: "100%", background: "#0c0c0e" }} />
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
