import React from "react";
import { OffthreadVideo, Sequence, staticFile } from "remotion";
import type { CardProps } from "../props";
import { Phone } from "./L-reel";
import { clamp, easeIn2, easeInOut, easeOut3, mix, pick, win } from "./L-util";
import { PH, Title, yBeats } from "./Y-kit";
// keyframes-v1 hook Y1 "Iris" (builder Y, 2026-09-25). The title alone to NOW, then a big camera lens seen
// head-on, tilted a little so its barrel has depth: through the wide-open aperture their raw take plays (the empty
// chair, them walking in and looking down, ungraded) through AND and IT'S. EXACTLY: the nine blades close with
// weight, the barrel's grip and f-stop ring ratchet one detent on HOW mid-close, the pinpoint lands ~2150 and the
// lens jolts on the stop (closed <= ~200 ms; v2 retime, coordinator note: v1 sat black 1680-2340). GOT: the iris snaps open
// onto their finished captioned reel; the lens flies past the camera and the reel pulls back into the phone playing
// it, landed ~2480 and held under a slow push.

const CX = 540, CY = 294;
const RO = 290, RA = 272, RG = 246, RB = 224, RBL = 252;   // grip, f-ring, bezel, clear opening, blade housing
const N = 9, A_OPEN = RBL - 6, A_PIN = 5.5, BEND = 0.16;
const STOPS = ["1.4", "2", "2.8", "4", "5.6", "8", "11", "16", "22"];
export const IRIS_ASSETS = ["Y-raw.mp4", "kf-finished-reel.mp4"];
type P = [number, number];
const ring = (r0: number, r1: number): React.CSSProperties => {
  const m = `radial-gradient(circle, transparent ${r0 - 0.5}px, #000 ${r0 + 0.5}px, #000 ${r1 - 0.8}px, transparent ${r1}px)`;
  return { position: "absolute", left: -r1, top: -r1, width: 2 * r1, height: 2 * r1, borderRadius: "50%", maskImage: m, WebkitMaskImage: m };
};
const shade = (l: number) => { const c = (v: number) => Math.round(clamp(v, 0, 255)); return `rgb(${c(15 + 22 * l)},${c(16 + 23 * l)},${c(19 + 26 * l)})`; };

const Blades: React.FC<{ a: number; phi: number }> = ({ a, phi }) => {
  const R = RBL + 8, S = R + 2;
  const V: P[] = Array.from({ length: N }, (_, k) => { const th = phi + (2 * Math.PI * k) / N; return [a * Math.cos(th), a * Math.sin(th)]; });
  const v = (k: number) => V[((k % N) + N) % N]!;
  const dir = (k: number): P => { const p = v(k), q = v(k + 1), l = Math.hypot(q[0] - p[0], q[1] - p[1]); return [(q[0] - p[0]) / l, (q[1] - p[1]) / l]; };
  const E = (k: number): P => {
    const p = v(k + 1), d = dir(k), vd = p[0] * d[0] + p[1] * d[1];
    const s = -vd + Math.sqrt(vd * vd - (p[0] * p[0] + p[1] * p[1]) + R * R);
    return [p[0] + s * d[0], p[1] + s * d[1]];
  };
  const C = (k: number): P => {
    const p = v(k + 1), e = E(k), l = Math.hypot(e[0] - p[0], e[1] - p[1]), d = dir(k);
    return [(p[0] + e[0]) / 2 + d[1] * l * BEND, (p[1] + e[1]) / 2 - d[0] * l * BEND];
  };
  const f = (p: P) => `${(p[0] + S).toFixed(2)} ${(p[1] + S).toFixed(2)}`;
  const lightA = (-125 * Math.PI) / 180;
  const pieces = Array.from({ length: N }, (_, k) => {
    const e0 = E(k), e1 = E(k + 1), m: P = [(e0[0] + e1[0]) / 2, (e0[1] + e1[1]) / 2];
    const l = 0.5 + 0.5 * Math.cos(Math.atan2(m[1], m[0]) - lightA);
    const d = `M ${f(v(k + 1))} Q ${f(C(k))} ${f(e0)} A ${R} ${R} 0 0 1 ${f(e1)} Q ${f(C(k + 1))} ${f(v(k + 2))} Z`;
    const edge = `M ${f(v(k + 1))} Q ${f(C(k))} ${f(e0)}`;
    return { k, d, edge, l, tip: v(k + 1), m };
  });
  return (
    <svg width={2 * S} height={2 * S} style={{ position: "absolute", left: -S, top: -S }}>
      <defs>
        {pieces.map((p) => (
          <linearGradient key={p.k} id={`yib${p.k}`} gradientUnits="userSpaceOnUse" x1={p.tip[0] + S} y1={p.tip[1] + S} x2={p.m[0] + S} y2={p.m[1] + S}>
            <stop offset="0" stopColor={shade(0.45 + 1.3 * p.l)} />
            <stop offset="0.45" stopColor={shade(0.2 + 0.8 * p.l)} />
            <stop offset="1" stopColor={shade(0.05 + 0.25 * p.l)} />
          </linearGradient>
        ))}
      </defs>
      {pieces.map((p) => <path key={p.k} d={p.d} fill={`url(#yib${p.k})`} />)}
      <filter id="yibs" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" /></filter>
      <g filter="url(#yibs)">{pieces.map((p) => <path key={`w${p.k}`} d={p.edge} fill="none" stroke="rgba(0,0,0,0.8)" strokeWidth={12} />)}</g>
      {pieces.map((p) => <path key={`s${p.k}`} d={p.edge} fill="none" stroke="rgba(0,0,0,0.75)" strokeWidth={4} />)}
      {pieces.map((p) => <path key={`h${p.k}`} d={p.edge} fill="none" stroke={`rgba(190,196,208,${(0.18 + 0.5 * p.l).toFixed(2)})`} strokeWidth={1.3} />)}
      <polygon points={V.map(f).join(" ")} fill="none" stroke="rgba(210,214,224,0.32)" strokeWidth={1} />
    </svg>
  );
};

const Clip: React.FC<{ src: string; fromMs: number; fps: number; style: React.CSSProperties }> = ({ src, fromMs, fps, style }) => (
  <Sequence from={Math.floor((fromMs / 1000) * fps)} layout="none">
    <OffthreadVideo src={src} muted style={{ position: "absolute", objectFit: "cover", ...style }} />
  </Sequence>
);

const Iris: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, fps, toMs, beats, assets, data } = props;
  const b = yBeats(beats);
  const d = data ?? {};
  if (t < b.now) return <Title {...props} now={b.now} />;
  const src = (n: string) => staticFile(pick(assets, n));
  const k = w / 1080;

  // entrance, the close on AND (slow start, hard mechanical stop, a small rebound), the snap open on GOT
  const enter = easeOut3(win(t, b.now, b.now + 320));
  const cEnd = b.exactly + 270;
  const close = easeIn2(win(t, b.exactly - 10, cEnd));
  const rebound = 7 * Math.sin(Math.PI * win(t, cEnd, cEnd + 110)) * (1 - win(t, cEnd, cEnd + 110));
  const snap = easeOut3(win(t, b.got - 20, b.got + 70));
  const a = mix(mix(A_OPEN, A_PIN, close) + rebound, A_OPEN, snap);
  const phi = -Math.PI / 2 + 0.55 * (1 - a / A_OPEN);
  // the barrel ratchets one detent on HOW, mid-close, and spins back open with the snap
  const step = (at: number) => easeOut3(win(t, at, at + 170)) + 0.07 * Math.sin(Math.PI * win(t, at + 120, at + 280));
  const turn = -28 * step(b.how) + 28 * easeOut3(win(t, b.got - 20, b.got + 120));
  const jolt = 4 * Math.sin(Math.PI * win(t, cEnd, cEnd + 90)) + 2.5 * Math.sin(Math.PI * win(t, b.how, b.how + 90));
  // GOT: the lens flies past the camera while the reel pulls back into the phone
  const pass = easeIn2(win(t, b.got + 20, b.got + 150));
  const lensS = mix(mix(0.86, 1, enter), 3.1, pass);
  const lensOp = clamp(win(t, b.now, b.now + 80)) * (1 - win(t, b.got + 40, b.got + 100));
  const pull = easeInOut(win(t, b.got + 10, b.got + 150));
  const Z = mix(2.12, 1, pull) * (1 + 0.025 * easeInOut(win(t, b.got + 150, toMs)));
  const out = easeIn2(win(t, toMs - 140, toMs));
  const rx = 14 + 1.2 * Math.sin(t / 700), ry = -17 + 1.6 * Math.sin(t / 900 + 1);
  const ly = mix(36, 0, enter) + jolt;
  const blur = 7 * Math.sin(Math.PI * win(t, b.got + 40, b.got + 150));
  const showPhone = t >= b.got - 20;
  const clipR = RB * lensS * mix(1, 1.6, pass);

  const layers = (n: number, r: number, bw: number, z0: number, dz: number, bg: (i: number) => string) =>
    Array.from({ length: n }, (_, i) => (
      <div key={`${r}-${i}`} style={{ position: "absolute", left: -r, top: -r, width: 2 * r, height: 2 * r, borderRadius: "50%",
        border: `${bw}px solid ${bg(i)}`, boxSizing: "border-box", transform: `translateZ(${z0 - i * dz}px)` }} />
    ));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0", opacity: 1 - out }}>
      {/* the lens' shadow on the take, moving with it */}
      <div style={{ position: "absolute", left: CX - RO + 26, top: CY - RO + ly + 34, width: 2 * RO, height: 2 * RO, borderRadius: "50%",
        background: "rgba(0,0,0,0.55)", filter: "blur(34px)", opacity: lensOp * (1 - pass), transform: `scale(${lensS})` }} />
      {showPhone && (
        <div style={{ position: "absolute", inset: 0, clipPath: `circle(${clipR.toFixed(1)}px at ${CX}px ${CY}px)` }}>
          <div style={{ position: "absolute", inset: 0, transform: `scale(${Z})`, transformOrigin: `${CX}px ${CY}px` }}>
            <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={b.got - 20} startSec={d.startSec ?? 0.92}
              style={{ left: PH.x, top: PH.y, transformOrigin: "50% 0%", transform: `scale(${PH.s})` }} />
          </div>
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, perspective: 1500, perspectiveOrigin: `${CX}px ${CY}px`, opacity: lensOp,
        filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
        <div style={{ position: "absolute", left: CX, top: CY, width: 0, height: 0, transformStyle: "preserve-3d",
          transform: `translateY(${ly}px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(${lensS}, ${lensS}, ${lensS})` }}>
          {/* the barrel's side, brushed metal going dark */}
          {layers(16, RO, 12, -3, 4.5, (i) => `rgb(${34 - i * 1.5},${35 - i * 1.5},${39 - i * 1.5})`)}
          {/* behind the opening: their raw take, the iris, the recess wall, the front glass */}
          {t < b.got - 20 && (
            <div style={{ position: "absolute", left: -RBL, top: -RBL, width: 2 * RBL, height: 2 * RBL, borderRadius: "50%", overflow: "hidden",
              transform: "translateZ(-40px)", background: "#000" }}>
              <Clip src={src("Y-raw.mp4")} fromMs={b.now} fps={fps}
                style={{ left: 0, top: 0, width: "100%", height: "100%", filter: "saturate(0.72) contrast(0.88) brightness(1.04)" }} />
            </div>
          )}
          <div style={{ position: "absolute", left: 0, top: 0, transform: "translateZ(-36px)" }}><Blades a={a} phi={phi} /></div>
          {layers(7, RB + 30, 32, -4, 4.5, (i) => `rgb(${10 + i},${10 + i},${12 + i})`)}
          <div style={{ position: "absolute", left: -RB, top: -RB, width: 2 * RB, height: 2 * RB, borderRadius: "50%", transform: "translateZ(-6px)",
            background: "radial-gradient(ellipse 46% 30% at 34% 24%, rgba(255,255,255,0.16), rgba(255,255,255,0) 70%), radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.45) 100%)",
            boxShadow: "inset 0 10px 26px rgba(0,0,0,0.75)" }}>
            <div style={{ position: "absolute", inset: 18, borderRadius: "50%", border: "2px solid rgba(170,110,255,0.10)", borderRightColor: "rgba(90,255,170,0.10)", borderBottomColor: "rgba(0,0,0,0)" }} />
            <div style={{ position: "absolute", left: 96, top: 70, width: 64, height: 26, borderRadius: 8, background: "rgba(255,255,255,0.13)",
              transform: "rotate(-28deg)", filter: "blur(7px)" }} />
            <div style={{ position: "absolute", left: 300, top: 318, width: 34, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.06)",
              transform: "rotate(-28deg)", filter: "blur(4px)" }} />
          </div>
          {/* the front face: knurled grip + f-stop ring (they ratchet), the fixed bezel with its index */}
          <div style={{ position: "absolute", left: 0, top: 0, transform: "translateZ(0px)" }}>
            <div style={{ ...ring(RA, RO), transform: `rotate(${turn}deg)`,
              background: "repeating-conic-gradient(from 0deg, #2c2d31 0deg 1.1deg, #0c0c0e 1.1deg 2.2deg)" }} />
            <div style={{ ...ring(RA, RO), background: "conic-gradient(from 0deg, rgba(255,255,255,0.05), rgba(255,255,255,0.30) 40deg, rgba(255,255,255,0.03) 90deg, rgba(255,255,255,0) 180deg, rgba(255,255,255,0.16) 225deg, rgba(255,255,255,0.02) 280deg, rgba(255,255,255,0.05))",
              boxShadow: "inset 0 0 0 1.5px rgba(200,204,212,0.55)" }} />
            <div style={{ ...ring(RG, RA), background: "radial-gradient(circle, #1b1b1e 88%, #26262a 94%, #121214 100%)" }} />
            <div style={{ position: "absolute", left: 0, top: 0, transform: `rotate(${turn}deg)` }}>
              {STOPS.map((s, i) => {
                const ang = -90 + (i - 0) * 19;
                return (
                  <div key={s} style={{ position: "absolute", left: 0, top: 0, transform: `rotate(${ang + 90}deg) translateY(${-(RA + RG) / 2}px)` }}>
                    <div style={{ position: "absolute", left: -30, top: -10, width: 60, textAlign: "center", fontFamily: "Helvetica Neue, Arial, sans-serif",
                      fontSize: 17, fontWeight: 600, lineHeight: "20px", color: s === "22" ? "#e9b949" : "#ece8dc", letterSpacing: 0.3 }}>{s}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ ...ring(RB, RG), background: "repeating-radial-gradient(circle, #121215 0 1.4px, #1c1d21 1.4px 2.8px)",
              boxShadow: "inset 0 0 0 1px rgba(210,214,222,0.45)" }} />
            <div style={{ ...ring(RB, RG), background: "conic-gradient(from 0deg, rgba(255,255,255,0), rgba(255,255,255,0.18) 35deg, rgba(255,255,255,0) 80deg, rgba(255,255,255,0) 190deg, rgba(255,255,255,0.10) 220deg, rgba(255,255,255,0) 260deg)" }} />
            <div style={{ position: "absolute", left: -5, top: -RG + 6, width: 10, height: 10, borderRadius: "50%", background: "#f2efe6" }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const IRIS_KINDS = { "kf-y-iris": Iris };
