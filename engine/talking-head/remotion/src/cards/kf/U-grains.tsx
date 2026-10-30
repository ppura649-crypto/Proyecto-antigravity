import React, { useLayoutEffect, useRef, useState } from "react";
import { Img, continueRender, delayRender, staticFile } from "remotion";
import type { CardProps } from "../props";
import { Phone } from "./L-reel";
import { clamp, easeInOut, easeOut3, mix, pick, win } from "./L-util";
import { PH, SCR, Title, type UBeats, beatsU, exitU } from "./U-kit";
// keyframes-v1 hook U2 "sand to reel" (builder U, 2026-09-25). The title alone to NOW, then their raw take (a real
// still, no captions) rises into the band. On AND it disintegrates from the top corner down into ~17,000 grains,
// each carrying its own pixel's colour; they spiral out into a weighted vortex (inner grains faster, a tilted disc
// with depth: back grains smaller and darker) and on EXACTLY the swirl is at full speed while every grain's colour
// turns toward the finished reel. On HOW they pour back in, bottom rows first, spiralling home grain by grain into
// the phone screen that closes round them; the sand resolves into their finished reel playing, locked by ~2450 and
// held with a slow push. The canvas is drawn from tMs alone (closed-form paths, seeded hash): no state per frame.

const GX = 90, GY = 191, NG = GX * GY;
const CW = SCR.w / GX, CH = SCR.h / GY;
const C = { x: 540, y: 292 };                     // the vortex eye
const SWEEP = 300;                                // AND: the dissolve front crosses the frame in 300 ms
const FLY = 260;                                  // HOW: each grain's flight home

const hh = (i: number, s: number) => {
  let x = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(s + 0x27d4eb2f, 0xc2b2ae35);
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d); x = Math.imul(x ^ (x >>> 12), 0x297a2d39); x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
};

type Grains = {
  hx: Float32Array; hy: Float32Array; rel: Float32Array; R: Float32Array; om: Float32Array; lift: Float32Array;
  r0: Float32Array; th0: Float32Array; go: Float32Array; sz: Float32Array; raw: Uint8ClampedArray; fin: Uint8ClampedArray;
};

// the per-grain constants, from the two pictures' pixels (cover-fit 9:16 into the screen rect)
const build = (rawPx: Uint8ClampedArray, finPx: Uint8ClampedArray, b: UBeats): Grains => {
  const g: Grains = {
    hx: new Float32Array(NG), hy: new Float32Array(NG), rel: new Float32Array(NG), R: new Float32Array(NG), om: new Float32Array(NG),
    lift: new Float32Array(NG), r0: new Float32Array(NG), th0: new Float32Array(NG), go: new Float32Array(NG), sz: new Float32Array(NG),
    raw: new Uint8ClampedArray(NG * 3), fin: new Uint8ClampedArray(NG * 3),
  };
  for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
    const n = j * GX + i, u = (i + 0.5) / GX, v = (j + 0.5) / GY;
    const x = SCR.x + (i + 0.5) * CW, y = SCR.y + (j + 0.5) * CH;
    g.hx[n] = x; g.hy[n] = y;
    // the dissolve front runs from the top-right corner down to the bottom-left, ragged by 45 ms
    g.rel[n] = b.and + SWEEP * ((1 - u) * 0.42 + v * 0.58) + 45 * hh(n, 1);
    const q = hh(n, 2);
    g.R[n] = 70 + 400 * Math.pow(q, 0.8);                              // orbit radius in the disc
    g.om[n] = (6.2 + 1.6 * hh(n, 3)) * Math.pow(g.R[n] / 260, -0.9);   // rad/s: the eye spins faster (weighted)
    g.lift[n] = -70 * (1 - g.R[n] / 470) + 46 * (hh(n, 4) - 0.5);       // a funnel: the inner grains ride higher
    g.r0[n] = Math.hypot(x - C.x, y - C.y);
    g.th0[n] = Math.atan2(y - C.y, x - C.x);
    // HOW: they pour home bottom rows first, spread 200 ms plus 30 ms of grain-to-grain jitter
    g.go[n] = b.how - 40 + (1 - v) * 200 + 30 * hh(n, 5);
    g.sz[n] = 1.0 + 1.1 * hh(n, 6);
    for (let c = 0; c < 3; c++) { g.raw[n * 3 + c] = rawPx[n * 4 + c]!; g.fin[n * 3 + c] = finPx[n * 4 + c]!; }
  }
  return g;
};

// where grain n is at time t: x, y, size, depth light (0..1), colour mix raw->fin, moving?
const out = { x: 0, y: 0, s: 0, l: 1, c: 0, f: 0 };
const place = (g: Grains, n: number, t: number, b: UBeats) => {
  const tr = g.rel[n]!;
  if (t < tr) { out.x = g.hx[n]!; out.y = g.hy[n]!; out.s = CW + 0.45; out.l = 1; out.c = 0; out.f = 0; return out; }
  const tau = (t - tr) / 1000;
  const e1 = easeInOut(clamp(tau / 0.5));                           // home -> the disc
  const R = mix(g.r0[n]!, g.R[n]!, easeOut3(clamp(tau / 0.55)));
  const w = g.om[n]!;
  const phi = tau < 0.3 ? (w * tau * tau) / 0.6 : w * (tau - 0.15);  // the spin winds up over 300 ms
  const th = g.th0[n]! + phi;
  const tilt = mix(1, 0.3, easeOut3(clamp(tau / 0.28)));             // the disc lies down before it widens
  const sn = Math.sin(th);
  const vx = C.x + R * Math.cos(th);
  const vy = C.y + R * sn * tilt + g.lift[n]! * e1 + 5 * Math.sin(tau * 9 + n) * e1;
  const depth = (sn + 1) / 2;                                       // 0 back of the disc, 1 front
  const go = g.go[n]!;
  const p = easeInOut(win(t, go, go + FLY));
  out.x = mix(vx, g.hx[n]!, p); out.y = mix(vy, g.hy[n]!, p);
  const flyS = g.sz[n]! * mix(0.7, 1.25, depth * e1 + (1 - e1));
  out.s = mix(mix(CW + 0.45, flyS, clamp(tau / 0.12)), CW + 0.45, p);
  out.l = mix(1, 0.62 + 0.38 * depth, e1 * (1 - p));
  out.c = easeInOut(win(t, b.exactly - 120, go + FLY * 0.6));
  out.f = p >= 1 ? 0 : 1;
  return out;
};

const cache = new Map<string, Promise<Uint8ClampedArray>>();
const pixels = (src: string) => {
  if (!cache.has(src)) cache.set(src, new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => {
      const cv = document.createElement("canvas"); cv.width = GX; cv.height = GY;
      const cx = cv.getContext("2d")!;
      cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = "high";
      const sw = (im.height * GX) / GY;                               // cover: crop the sides
      cx.drawImage(im, (im.width - sw) / 2, 0, sw, im.height, 0, 0, GX, GY);
      res(cx.getImageData(0, 0, GX, GY).data);
    };
    im.onerror = rej; im.src = src;
  }));
  return cache.get(src)!;
};

const Sand: React.FC<{ t: number; b: UBeats; k: number; rawSrc: string; finSrc: string; opacity: number }> = ({ t, b, k, rawSrc, finSrc, opacity }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [g, setG] = useState<Grains | null>(null);
  const [handle] = useState(() => delayRender("U-grains pixels"));
  useLayoutEffect(() => {
    let live = true;
    Promise.all([pixels(rawSrc), pixels(finSrc)]).then(([r, f]) => { if (live) { setG(build(r, f, b)); } continueRender(handle); })
      .catch(() => continueRender(handle));
    return () => { live = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSrc, finSrc]);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv || !g) return;
    const cx = cv.getContext("2d")!;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.clearRect(0, 0, cv.width, cv.height);
    cx.setTransform(k, 0, 0, k, 0, 0);
    cx.lineCap = "round";
    // the crisp photo covers every grain not yet released (the front is drawn by the grains themselves)
    const front = (t - b.and) / SWEEP;
    for (let n = 0; n < NG; n++) {
      const tr = g.rel[n]!;
      if (t < tr) {
        const j = Math.floor(n / GX), i = n - j * GX;
        const f = (1 - (i + 0.5) / GX) * 0.42 + ((j + 0.5) / GY) * 0.58;
        if (f > front || t < b.and) continue;                         // under the photo
      }
      const a = place(g, n, t, b);
      const x = a.x, y = a.y, s = a.s, l = a.l, c = a.c, fly = a.f;
      const r = mix(g.raw[n * 3]!, g.fin[n * 3]!, c) * l, gg = mix(g.raw[n * 3 + 1]!, g.fin[n * 3 + 1]!, c) * l,
        bb = mix(g.raw[n * 3 + 2]!, g.fin[n * 3 + 2]!, c) * l;
      // each grain catches the light a little differently; one in thirty glints
      const jit = fly ? 0.88 + 0.24 * hh(n, 7) + (hh(n, 8) < 0.033 ? 0.35 : 0) : 1;
      const col = `rgb(${(r * jit) | 0},${(gg * jit) | 0},${(bb * jit) | 0})`;
      cx.globalAlpha = fly ? 0.55 + 0.45 * l : 1;
      if (!fly) { cx.fillStyle = col; cx.fillRect(x - s / 2, y - s / 2, s, s); continue; }
      const p = place(g, n, t - 4, b);                                // a short shutter: a grain, not a hair
      const dx = x - p.x, dy = y - p.y;
      if (dx * dx + dy * dy < 1.2) { cx.fillStyle = col; cx.fillRect(x - s / 2, y - s / 2, s, s); continue; }
      cx.strokeStyle = col; cx.lineWidth = s;
      cx.beginPath(); cx.moveTo(x - dx, y - dy); cx.lineTo(x, y); cx.stroke();
    }
  }, [g, t, k, b]);
  return <canvas ref={ref} width={Math.round(1080 * k)} height={Math.round(614 * k)}
    style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${1 / k})`, transformOrigin: "0 0", opacity }} />;
};

// the still, clipped to the part the front has not reached yet (half-plane f > front on the unit square)
const clipFor = (front: number) => {
  const F = (u: number, v: number) => (1 - u) * 0.42 + v * 0.58 - front;
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

const Grains: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, fps, toMs, beats, assets, data } = props;
  const b = beatsU(beats);
  if (t < b.now) return <Title {...props} toMs={b.now} />;
  const d = data ?? {};
  const src = (n: string) => staticFile(pick(assets, n));
  const k = w / 1080;
  const e = easeOut3(win(t, b.now, b.now + 300));
  const enterOp = 0.4 + 0.6 * win(t, b.now, b.now + 90);
  const front = (t - b.and) / SWEEP;
  const vidAt = 2420;
  const phoneOp = easeOut3(win(t, b.how + 60, b.how + 200));
  const land = easeOut3(win(t, b.how + 60, 2450));
  const crisp = win(t, 2425, 2475);
  const push = 1 + 0.022 * easeInOut(win(t, 2450, toMs));
  const gone = exitU(t, toMs);
  const stillShadow = 1 - win(t, b.and, b.and + 200);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0", opacity: (1 - gone) * enterOp }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: "540px 292px", transform: `scale(${push})` }}>
        {t >= b.how + 60 && (
          <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={vidAt} startSec={d.startSec ?? 0.92}
            style={{ left: PH.x, top: PH.y, opacity: phoneOp, transformOrigin: "50% 0%", transform: `scale(${PH.s * mix(1.04, 1, land)})` }} />
        )}
        {front < 1.05 && (
          <div style={{ position: "absolute", left: SCR.x, top: SCR.y, width: SCR.w, height: SCR.h,
            transform: `translateY(${30 * (1 - e)}px) scale(${0.96 + 0.04 * e})`,
            clipPath: t < b.and ? undefined : clipFor(front), boxShadow: `0 26px 50px rgba(0,0,0,${(0.45 * stillShadow).toFixed(3)})` }}>
            <Img src={src("U-raw.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        )}
        {t >= b.and - 40 && (
          <div style={{ position: "absolute", inset: 0 }}>
            <Sand t={t} b={b} k={k} rawSrc={src("U-raw.jpg")} finSrc={src("U-fin.jpg")} opacity={1 - crisp} />
          </div>
        )}
      </div>
    </div>
  );
};

export const GRAINS_KINDS = { "kf-u-grains": Grains };
