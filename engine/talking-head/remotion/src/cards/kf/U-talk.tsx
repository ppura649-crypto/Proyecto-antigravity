import React, { useLayoutEffect, useRef, useState } from "react";
import { Img, continueRender, delayRender, staticFile } from "remotion";
import type { CardProps } from "../props";
import { Phone } from "./L-reel";
import { clamp, easeInOut, easeOut3, mix, pick, win } from "./L-util";
import { CapStack } from "./U-caps";
import { PH, SCR, Title, type UBeats, beatsU, exitU } from "./U-kit";
// keyframes-v1 hook U3 "I just talk. / Claude does the rest." (builder U, round 2). The title alone to NOW, then
// two frames of their raw take stand side by side: a dead one (the empty chair before the creator sits down, 0.5 s into
// source.mov) and a talking one. On AND the real Claude mark appears between them and starts to turn like a
// turbine; both frames break into grains from their inner edges and are pulled into its vortex (~25,000 grains,
// real pixel colours, weighted: the inner orbit spins faster, a tilted disc with depth). While it spins, on
// EXACTLY / HOW, Claude cuts: the dead frame's grains are flung out of the orbit and fall away off the card. On
// HOW the rest pours out, bottom rows first, into a phone screen and resolves into their cut playing; last, this
// video's own caption words settle onto it. Landed ~2450, held, clean exit at 2997.

const SWEEP = 300, FLY = 260;
const K0 = 0.88;
const RAWR = { w: SCR.w * K0, h: SCR.h * K0, x: 556, y: 40 };
const DEADR = { w: SCR.w * K0, h: SCR.h * K0, x: 540 - 16 - SCR.w * K0, y: 40 };
const RG = { x: 90, y: 191 }, DG = { x: 60, y: 128 };
const NR = RG.x * RG.y, ND = DG.x * DG.y, NG = NR + ND;
const C = { x: 540, y: 292 };
const TW = SCR.w / RG.x;                                   // a landed grain

const hh = (i: number, s: number) => {
  let x = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(s + 0x27d4eb2f, 0xc2b2ae35);
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d); x = Math.imul(x ^ (x >>> 12), 0x297a2d39); x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
};
// the sweep coordinate of a grain (u, v in its frame): the edge nearest the mark goes first
const fRaw = (u: number, v: number) => 0.8 * u + 0.2 * v;
const fDead = (u: number, v: number) => 0.8 * (1 - u) + 0.2 * v;

type G = {
  hx: Float32Array; hy: Float32Array; tx: Float32Array; ty: Float32Array; hs: Float32Array; rel: Float32Array; R: Float32Array;
  om: Float32Array; lift: Float32Array; r0: Float32Array; th0: Float32Array; go: Float32Array; sz: Float32Array; col0: Uint8ClampedArray; col1: Uint8ClampedArray;
};

const build = (raw: Uint8ClampedArray, dead: Uint8ClampedArray, mst: Uint8ClampedArray, b: UBeats): G => {
  const f32 = () => new Float32Array(NG);
  const g: G = { hx: f32(), hy: f32(), tx: f32(), ty: f32(), hs: f32(), rel: f32(), R: f32(), om: f32(), lift: f32(), r0: f32(), th0: f32(),
    go: f32(), sz: f32(), col0: new Uint8ClampedArray(NG * 3), col1: new Uint8ClampedArray(NG * 3) };
  for (let n = 0; n < NG; n++) {
    const isDead = n >= NR, m = isDead ? n - NR : n, gx = isDead ? DG.x : RG.x, gy = isDead ? DG.y : RG.y, r = isDead ? DEADR : RAWR;
    const j = Math.floor(m / gx), i = m - j * gx, u = (i + 0.5) / gx, v = (j + 0.5) / gy;
    const x = r.x + u * r.w, y = r.y + v * r.h;
    g.hx[n] = x; g.hy[n] = y; g.hs[n] = r.w / gx + 0.45;
    g.rel[n] = b.and + SWEEP * (isDead ? fDead(u, v) : fRaw(u, v)) + 40 * hh(n, 1);
    const q = hh(n, 2);
    // the dead frame rides the outer ring (so its cut reads), the talking frame the inner disc
    g.R[n] = isDead ? 365 + 105 * q : 112 + 300 * Math.pow(q, 0.8);
    g.om[n] = (6.4 + 1.6 * hh(n, 3)) * Math.pow(g.R[n] / 260, -0.9);
    g.lift[n] = -60 * (1 - g.R[n] / 470) + 40 * (hh(n, 4) - 0.5);
    g.r0[n] = Math.hypot(x - C.x, y - C.y); g.th0[n] = Math.atan2(y - C.y, x - C.x);
    g.sz[n] = 1.0 + 1.1 * hh(n, 6);
    if (isDead) {
      // flung out of the orbit while it spins: EXACTLY -60 .. HOW +10
      g.go[n] = b.exactly - 20 + 110 * hh(n, 5);
      // dead footage: its own pixels, drained of colour and a shade darker, so the cut is visible in the swirl
      const lum = 0.3 * dead[m * 4]! + 0.59 * dead[m * 4 + 1]! + 0.11 * dead[m * 4 + 2]!;
      for (let c = 0; c < 3; c++) { const px = mix(dead[m * 4 + c]!, lum, 0.75) * 0.72 + (c === 2 ? 6 : 0); g.col0[n * 3 + c] = px; g.col1[n * 3 + c] = px; }
    } else {
      g.tx[n] = SCR.x + u * SCR.w; g.ty[n] = SCR.y + v * SCR.h;
      g.go[n] = b.how - 40 + (1 - v) * 200 + 30 * hh(n, 5);
      for (let c = 0; c < 3; c++) { g.col0[n * 3 + c] = raw[m * 4 + c]!; g.col1[n * 3 + c] = mst[m * 4 + c]!; }
    }
  }
  return g;
};

// the orbit position of grain n at time t (tau s after release)
const orbit = (g: G, n: number, tau: number, o: { x: number; y: number; d: number; e: number }) => {
  const e1 = easeInOut(clamp(tau / 0.5));
  const R = mix(g.r0[n]!, g.R[n]!, easeOut3(clamp(tau / 0.55)));
  const w = g.om[n]!;
  const th = g.th0[n]! + (tau < 0.3 ? (w * tau * tau) / 0.6 : w * (tau - 0.15));
  const tilt = mix(1, 0.3, easeOut3(clamp(tau / 0.28)));
  const sn = Math.sin(th);
  o.x = C.x + R * Math.cos(th); o.y = C.y + R * sn * tilt + g.lift[n]! * e1 + 5 * Math.sin(tau * 9 + n) * e1;
  o.d = (sn + 1) / 2; o.e = e1;
  return o;
};

const P = { x: 0, y: 0, s: 0, l: 1, c: 0, a: 1, f: 0 };
const O1 = { x: 0, y: 0, d: 0, e: 0 }, O2 = { x: 0, y: 0, d: 0, e: 0 };
const place = (g: G, n: number, t: number, b: UBeats) => {
  const tr = g.rel[n]!;
  P.a = 1; P.c = 0;
  if (t < tr) { P.x = g.hx[n]!; P.y = g.hy[n]!; P.s = g.hs[n]!; P.l = 1; P.f = 0; return P; }
  const tau = (t - tr) / 1000;
  const go = g.go[n]!;
  const flyS = (d: number, e: number) => g.sz[n]! * mix(0.7, 1.25, d * e + (1 - e));
  if (n >= NR && t > go) {
    // flung: leave the orbit on its tangent, then fall
    const tg = (go - tr) / 1000;
    orbit(g, n, tg, O1); orbit(g, n, tg - 0.01, O2);
    const vx = (O1.x - O2.x) / 0.01, vy = (O1.y - O2.y) / 0.01;
    const s = (t - go) / 1000;
    P.x = O1.x + vx * 1.15 * s; P.y = O1.y + vy * 1.15 * s - 120 * s + 0.5 * 2400 * s * s;
    P.s = flyS(O1.d, 1); P.l = 0.62 + 0.38 * O1.d;
    P.a = clamp(1 - s / 0.42) * clamp((600 - P.y) / 50);
    P.f = 1; return P;
  }
  orbit(g, n, tau, O1);
  if (n >= NR) {
    P.x = O1.x; P.y = O1.y; P.s = mix(g.hs[n]!, flyS(O1.d, O1.e), clamp(tau / 0.12)); P.l = mix(1, 0.62 + 0.38 * O1.d, O1.e); P.f = 1; return P;
  }
  const p = easeInOut(win(t, go, go + FLY));
  P.x = mix(O1.x, g.tx[n]!, p); P.y = mix(O1.y, g.ty[n]!, p);
  P.s = mix(mix(g.hs[n]!, flyS(O1.d, O1.e), clamp(tau / 0.12)), TW + 0.45, p);
  P.l = mix(1, 0.62 + 0.38 * O1.d, O1.e * (1 - p));
  P.c = easeInOut(win(t, b.exactly - 120, go + FLY * 0.6));
  P.f = p >= 1 ? 0 : 1;
  return P;
};

const cache = new Map<string, Promise<Uint8ClampedArray>>();
const pixels = (src: string, gx: number, gy: number, aspect: number) => {
  const key = `${src}|${gx}|${gy}`;
  if (!cache.has(key)) cache.set(key, new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => {
      const cv = document.createElement("canvas"); cv.width = gx; cv.height = gy;
      const cx = cv.getContext("2d")!;
      cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = "high";
      const sw = im.height * aspect;
      cx.drawImage(im, (im.width - sw) / 2, 0, sw, im.height, 0, 0, gx, gy);
      res(cx.getImageData(0, 0, gx, gy).data);
    };
    im.onerror = rej; im.src = src;
  }));
  return cache.get(key)!;
};

const Sand: React.FC<{ t: number; b: UBeats; k: number; raw: string; dead: string; mst: string; opacity: number }> = ({ t, b, k, raw, dead, mst, opacity }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [g, setG] = useState<G | null>(null);
  const [handle] = useState(() => delayRender("U-talk pixels"));
  useLayoutEffect(() => {
    let live = true;
    const asp = SCR.w / SCR.h;
    Promise.all([pixels(raw, RG.x, RG.y, asp), pixels(dead, DG.x, DG.y, asp), pixels(mst, RG.x, RG.y, asp)])
      .then(([r, d, m]) => { if (live) setG(build(r, d, m, b)); continueRender(handle); }).catch(() => continueRender(handle));
    return () => { live = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw, dead, mst]);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv || !g) return;
    const cx = cv.getContext("2d")!;
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); cx.setTransform(k, 0, 0, k, 0, 0);
    cx.lineCap = "round";
    const front = (t - b.and) / SWEEP;
    for (let n = 0; n < NG; n++) {
      if (t < g.rel[n]!) {
        const isDead = n >= NR, m = isDead ? n - NR : n, gx = isDead ? DG.x : RG.x, gy = isDead ? DG.y : RG.y;
        const j = Math.floor(m / gx), i = m - j * gx, u = (i + 0.5) / gx, v = (j + 0.5) / gy;
        if ((isDead ? fDead(u, v) : fRaw(u, v)) > front || t < b.and) continue;   // still under the photo
      }
      const a = place(g, n, t, b);
      if (a.a <= 0.01) continue;
      const x = a.x, y = a.y, s = a.s, l = a.l, c = a.c, fly = a.f;
      const jit = fly ? 0.88 + 0.24 * hh(n, 7) + (hh(n, 8) < 0.033 ? 0.35 : 0) : 1;
      const r = mix(g.col0[n * 3]!, g.col1[n * 3]!, c) * l * jit, gg = mix(g.col0[n * 3 + 1]!, g.col1[n * 3 + 1]!, c) * l * jit,
        bb = mix(g.col0[n * 3 + 2]!, g.col1[n * 3 + 2]!, c) * l * jit;
      const col = `rgb(${r | 0},${gg | 0},${bb | 0})`;
      cx.globalAlpha = (fly ? 0.55 + 0.45 * l : 1) * a.a;
      if (!fly) { cx.fillStyle = col; cx.fillRect(x - s / 2, y - s / 2, s, s); continue; }
      const q = place(g, n, t - 4, b);
      const dx = x - q.x, dy = y - q.y;
      if (dx * dx + dy * dy < 1.2) { cx.fillStyle = col; cx.fillRect(x - s / 2, y - s / 2, s, s); continue; }
      cx.strokeStyle = col; cx.lineWidth = s; cx.beginPath(); cx.moveTo(x - dx, y - dy); cx.lineTo(x, y); cx.stroke();
    }
    cx.globalAlpha = 1;
  }, [g, t, k, b]);
  return <canvas ref={ref} width={Math.round(1080 * k)} height={Math.round(614 * k)}
    style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${1 / k})`, transformOrigin: "0 0", opacity }} />;
};

// the part of a still the front has not reached (F > 0 on the unit square)
const clipOf = (F: (u: number, v: number) => number) => {
  const sq: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const pts: [number, number][] = [];
  for (let q = 0; q < 4; q++) {
    const A = sq[q]!, B = sq[(q + 1) % 4]!, fa = F(A[0], A[1]), fb = F(B[0], B[1]);
    if (fa > 0) pts.push(A);
    if ((fa > 0) !== (fb > 0)) { const s = fa / (fa - fb); pts.push([mix(A[0], B[0], s), mix(A[1], B[1], s)]); }
  }
  if (pts.length < 3) return "polygon(0 0, 0 0, 0 0)";
  return `polygon(${pts.map(([u, v]) => `${(u * 100).toFixed(2)}% ${(v * 100).toFixed(2)}%`).join(", ")})`;
};

// the Claude mark: the engine at the eye of the vortex, turning like a turbine, a soft orange glow
const Mark: React.FC<{ t: number; b: UBeats; src: string }> = ({ t, b, src }) => {
  const inP = easeOut3(win(t, b.and - 60, b.and + 200));
  const outP = easeInOut(win(t, b.how + 150, b.how + 330));
  if (inP <= 0 || outP >= 1) return null;
  // spin: winds up from AND to full speed at EXACTLY (1.8 turns/s), eases down after HOW; angle = its integral
  const w = (x: number) => 650 * easeInOut(win(x, b.and, b.exactly)) * (1 - easeInOut(win(x, b.how, b.how + 330)));
  let ang = 0;
  for (let x = b.and; x < t; x += 8) ang += (w(x) * Math.min(8, t - x)) / 1000;
  const size = 150 * inP * (1 - 0.5 * outP);
  const glow = 0.35 + 0.5 * easeInOut(win(t, b.and, b.exactly));
  return (
    <div style={{ position: "absolute", left: C.x - size / 2, top: C.y - size / 2, width: size, height: size, opacity: (1 - outP),
      filter: `drop-shadow(0 0 ${14 + 10 * glow}px rgba(217,119,87,${glow.toFixed(3)})) drop-shadow(0 6px 10px rgba(0,0,0,0.3))` }}>
      <Img src={src} style={{ width: "100%", height: "100%", transform: `rotate(${(ang + 90 * (1 - inP)).toFixed(2)}deg)` }} />
    </div>
  );
};

const Talk: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, fps, toMs, beats, assets, data } = props;
  const b = beatsU(beats);
  if (t < b.now) return <Title {...props} toMs={b.now} />;
  const d = data ?? {};
  const src = (n: string) => staticFile(pick(assets, n));
  const k = w / 1080;
  const e = easeOut3(win(t, b.now, b.now + 300));
  const enterOp = 0.4 + 0.6 * win(t, b.now, b.now + 90);
  const front = (t - b.and) / SWEEP;
  const phoneOp = easeOut3(win(t, b.how + 60, b.how + 130));
  const land = easeOut3(win(t, b.how + 60, 2450));
  const crisp = win(t, 2425, 2475);
  const push = 1 + 0.022 * easeInOut(win(t, 2450, toMs));
  const gone = exitU(t, toMs);
  const stillShadow = 1 - win(t, b.and, b.and + 200);
  const capP = (i: number) => win(t, 2220 + i * 24, 2220 + i * 24 + 140);
  const still = (r: typeof RAWR, img: string, F: (u: number, v: number) => number) => (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h,
      transform: `translateY(${30 * (1 - e)}px) scale(${0.96 + 0.04 * e})`,
      clipPath: t < b.and ? undefined : clipOf((u, v) => F(u, v) - front), boxShadow: `0 26px 50px rgba(0,0,0,${(0.42 * stillShadow).toFixed(3)})` }}>
      <Img src={img} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0", opacity: (1 - gone) * enterOp }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: "540px 292px", transform: `scale(${push})` }}>
        {t >= b.how + 60 && (
          <Phone video={src("U-master.mp4")} fps={fps} fromMs={2420} startSec={d.startSec ?? 0.92}
            style={{ left: PH.x, top: PH.y, opacity: phoneOp, transformOrigin: "50% 0%", transform: `scale(${PH.s * mix(1.04, 1, land)})` }} />
        )}
        {front < 1.05 && still(DEADR, src("U-dead.jpg"), fDead)}
        {front < 1.05 && still(RAWR, src("U-raw.jpg"), fRaw)}
        {t >= b.and - 40 && (
          <Sand t={t} b={b} k={k} raw={src("U-raw.jpg")} dead={src("U-dead.jpg")} mst={src("U-mst.jpg")} opacity={1 - crisp} />
        )}
        <Mark t={t} b={b} src={src("U-claude.png")} />
        {t >= 2200 && (
          <div style={{ position: "absolute", left: 540, top: PH.y, width: 0, height: 0, transformOrigin: "0 0",
            transform: `scale(${mix(1.04, 1, land)})` }}>
            <div style={{ position: "absolute", left: SCR.x - 540, top: SCR.y - PH.y, width: SCR.w, height: SCR.h, borderRadius: SCR.r, overflow: "hidden" }}>
              <CapStack w={SCR.w} h={SCR.h} p={capP} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const TALK_KINDS = { "kf-u-talk": Talk };
