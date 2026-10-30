import React from "react";
import { staticFile } from "remotion";
import type { CardProps } from "../props";
import { Phone } from "./L-reel";
import { clamp, easeInOut, easeOut3, hash, mix, pick, win } from "./L-util";
import { PH, SCR, Title, beatsU, cover916, exitU } from "./U-kit";
import { Shredder, SLOT_Y } from "./U-shredder";
// keyframes-v1 hook U1 "reverse shredder" (builder U, 2026-09-25, v2 after review: fewer, wider matte strips,
// one gentle flip, the phone closing round the sheet without a pause). The title alone to NOW, then a steel
// shredder head rises into the band with six paper strips peeking out of its mouth. On AND the strips (their raw
// take printed with white margins, then cut) are sucked up out of the slot and fan out, curling gently, the raw
// print facing us so it reads as they rise. Each strip is printed both sides, the finished captioned reel on the
// back: on EXACTLY / HOW each one turns over once as it flies home and they slot together side by side into the
// finished frame. The shredder sinks away, and from the moment the last strip lands the sheet narrows into the
// phone screen while the phone closes round it, their reel playing, landed by 2450 and held. Clean exit at 2997.

const N = 6, M = 8;                                          // strips, curl segments per strip
const SW = 60;                                               // a strip on screen
const SHEET = { w: N * SW, h: 468, x: 540 - (N * SW) / 2, y: 22 };
const SEG = SHEET.h / M;
const MARG = 13;                                             // white print margin on the raw side
const PRINT = { w: SHEET.w - 2 * MARG, h: SHEET.h - 2 * MARG };
const CVR = cover916(PRINT.w, PRINT.h);
const CV = cover916(SHEET.w, SHEET.h);
const PAPER = "#f3f0e9";

type Pose = { x: number; y: number; rz: number; ry: number; rx: number; curl: number[]; blur: number; shadow: number; flat: boolean };
const landAt = (i: number, b: ReturnType<typeof beatsU>) => b.exactly - 60 + i * 22;
const LAND = 300;

const poseOf = (i: number, t: number, b: ReturnType<typeof beatsU>): Pose => {
  const c = i - (N - 1) / 2;
  const h1 = hash(i * 3.17 + 1), h2 = hash(i * 7.31 + 2), h3 = hash(i * 1.93 + 5);
  const home = { x: SHEET.x + i * SW, y: SHEET.y };
  const peek = 16 + 34 * h1;                                 // strip tops standing out of the mouth
  const y0 = SLOT_Y - peek;
  const d = 110 * h2;                                        // sucked up in a quick ragged order
  const tau = t - (b.and + d);
  const r = tau <= 0 ? 0 : 1 - Math.exp(-tau / 85);
  const v = tau <= 0 ? 0 : (Math.exp(-tau / 85) / 85) * (y0 - SHEET.y);          // px per ms
  const apexY = SHEET.y - 26 + 34 * h3;
  const fan = c * 88 + (h1 - 0.5) * 24;
  const flt = tau > 0 ? tau / 1000 : 0;
  const flutX = 6 * Math.sin(flt * 5.1 + i * 1.7) * r, flutY = 8 * Math.sin(flt * 4.3 + i * 2.3) * r;
  const s0 = landAt(i, b);
  const L = easeInOut(win(t, s0, s0 + LAND));
  const fx = home.x + fan * easeOut3(r) + flutX, fy = mix(y0, apexY, r) + flutY;
  // one turn over, on the way home: the raw print faces us the whole rise
  const ry = (h2 > 0.5 ? 1 : -1) * 180 * easeInOut(win(t, s0 - 110, s0 + LAND));
  const rz = (c * 2.6 + 2.5 * Math.sin(flt * 3.1 + i * 2.1)) * r;
  const rx = 7 * Math.sin(flt * 3.4 + i * 0.9) * r;
  // paper bends in one smooth, gentle arc that breathes as it flies; the peeking ends droop
  const bend = (1.3 + 1.1 * h1) * Math.sin(flt * 4.6 + i * 1.3) * r;
  const droop = (1 - r) * (h2 > 0.5 ? 1 : -1);
  const curl = Array.from({ length: M }, (_, k) => (bend + (k >= M - 2 ? 22 * droop : 0)) * (1 - L));
  return {
    x: mix(fx, home.x, L), y: mix(fy, home.y, L), rz: rz * (1 - L), rx: rx * (1 - L), ry, curl,
    blur: Math.min(8, v * 33 * 0.05), shadow: r * (1 - L), flat: L >= 1,
  };
};

// the raw side: matte paper, their raw take printed inside a white margin, paper grain over both
const RawFace: React.FC<{ img: string; paper: string; i: number; k: number; shade: number }> = ({ img, paper, i, k, shade }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: SW + 0.35, height: SEG + 0.7, backfaceVisibility: "hidden",
    isolation: "isolate", overflow: "hidden", background: PAPER }}>
    <div style={{ position: "absolute", left: MARG - i * SW, top: MARG - (M - 1 - k) * SEG, width: PRINT.w, height: PRINT.h,
      backgroundImage: `url(${img})`, backgroundSize: `${CVR.iw}px ${CVR.ih}px`, backgroundPosition: `${CVR.ox}px ${CVR.oy}px`,
      backgroundRepeat: "no-repeat", filter: "contrast(0.93) saturate(0.88) brightness(1.03) sepia(0.07)" }} />
    <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${paper})`, backgroundSize: "180px 180px",
      backgroundPosition: `${-i * 37}px ${-k * 53}px`, mixBlendMode: "soft-light", opacity: 1 }} />
    {shade > 0.005 && <div style={{ position: "absolute", inset: 0, background: `rgba(20,16,12,${shade.toFixed(3)})` }} />}
  </div>
);
const FinFace: React.FC<{ img: string; paper: string; i: number; k: number; shade: number }> = ({ img, paper, i, k, shade }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: SW + 0.35, height: SEG + 0.7, backfaceVisibility: "hidden",
    transform: "rotateY(180deg)", isolation: "isolate", overflow: "hidden",
    backgroundImage: `url(${img})`, backgroundSize: `${CV.iw}px ${CV.ih}px`, backgroundRepeat: "no-repeat",
    backgroundPosition: `${CV.ox - i * SW}px ${CV.oy - (M - 1 - k) * SEG}px` }}>
    <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${paper})`, backgroundSize: "180px 180px",
      backgroundPosition: `${-i * 37}px ${-k * 53}px`, mixBlendMode: "soft-light", opacity: 0.7 }} />
    {shade > 0.005 && <div style={{ position: "absolute", inset: 0, background: `rgba(20,16,12,${shade.toFixed(3)})` }} />}
  </div>
);

// one strip: M segments hinged bottom-up (the top end curls), both faces printed, a soft shadow under it
const Strip: React.FC<{ i: number; p: Pose; raw: string; fin: string; paper: string }> = ({ i, p, raw, fin, paper }) => {
  const cosY = Math.cos((p.ry * Math.PI) / 180);
  let phi = 0;
  const seg = (k: number): React.ReactNode => {
    phi += p.curl[k]!;
    const lit = Math.abs(cosY) * Math.cos(((phi + p.rx) * Math.PI) / 180);
    const shade = clamp(0.22 * (1 - lit));
    return (
      <div key={k} style={{ position: "absolute", left: 0, top: k === 0 ? SHEET.h - SEG : -SEG, width: SW, height: SEG,
        transformOrigin: "50% 100%", transform: p.curl[k] ? `rotateX(${p.curl[k]!.toFixed(2)}deg)` : undefined, transformStyle: "preserve-3d" }}>
        <RawFace img={raw} paper={paper} i={i} k={k} shade={shade} />
        <FinFace img={fin} paper={paper} i={i} k={k} shade={shade} />
        {k < M - 1 && seg(k + 1)}
      </div>
    );
  };
  const blur = p.blur > 1.2;
  return (
    <>
      {p.shadow > 0.02 && (
        <div style={{ position: "absolute", left: p.x + 10, top: p.y + 22, width: SW, height: SHEET.h, borderRadius: 6,
          transformOrigin: `${SW / 2}px ${SHEET.h / 2}px`, transform: `rotateZ(${p.rz.toFixed(2)}deg) scaleX(${Math.max(0.15, Math.abs(cosY)).toFixed(3)})`,
          background: `rgba(0,0,0,${(0.2 * p.shadow).toFixed(3)})`, filter: "blur(12px)" }} />
      )}
      <div style={{ position: "absolute", left: p.x, top: p.y, width: SW, height: SHEET.h, transformStyle: blur ? undefined : "preserve-3d",
        transformOrigin: `${SW / 2}px ${SHEET.h / 2}px`,
        transform: `rotateZ(${p.rz.toFixed(2)}deg) rotateY(${p.ry.toFixed(2)}deg) rotateX(${p.rx.toFixed(2)}deg)`,
        filter: blur ? `url(#u1b${i})` : undefined }}>
        {seg(0)}
      </div>
    </>
  );
};

const Shred: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, fps, toMs, beats, assets, data } = props;
  const b = beatsU(beats);
  if (t < b.now) return <Title {...props} toMs={b.now} />;
  const d = data ?? {};
  const src = (n: string) => staticFile(pick(assets, n));
  const raw = src("U-raw.jpg"), fin = src("U-fin.jpg"), paper = src("U-paper.png");
  const k = w / 1080;
  // the entrance: the whole scene comes up out of depth, 300 ms
  const e = easeOut3(win(t, b.now, b.now + 300));
  const enterOp = 0.4 + 0.6 * win(t, b.now, b.now + 90);
  const poses = Array.from({ length: N }, (_, i) => poseOf(i, t, b));
  // from the last landing the sheet narrows into the phone screen and the phone closes round it, no pause
  const m0 = landAt(N - 1, b) + LAND, m1 = 2450;
  const g = easeInOut(win(t, m0, m1));
  const rect = { w: mix(SHEET.w, SCR.w, g), h: mix(SHEET.h, SCR.h, g), y: mix(SHEET.y, SCR.y, g) };
  const phoneQ = rect.h / 582;                              // the phone's height fits the sheet; its sides close in
  const phoneOp = easeOut3(win(t, m0 - 40, m0 + 110));
  const vidAt = 2420;
  const sheetOp = 1 - win(t, 2432, 2480);
  const grain = 1 - easeInOut(win(t, m0, 2440));
  const allFlat = poses.every((p) => p.flat);
  const push = 1 + 0.022 * easeInOut(win(t, 2450, toMs));
  const out = exitU(t, toMs);
  const clipBottom = t < m0 ? SLOT_Y : 900;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0", opacity: (1 - out) * enterOp }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        {poses.map((p, i) => (
          <filter key={i} id={`u1b${i}`} x="-20%" y="-10%" width="140%" height="120%">
            <feGaussianBlur stdDeviation={`0 ${p.blur.toFixed(2)}`} />
          </filter>
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, transformOrigin: "540px 300px",
        transform: `translateY(${34 * (1 - e)}px) scale(${(0.95 + 0.05 * e) * push})` }}>
        {t >= m0 - 40 && (
          <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={vidAt} startSec={d.startSec ?? 0.92}
            style={{ left: PH.x, top: rect.y - 9 * phoneQ, opacity: phoneOp, transformOrigin: "50% 0%", transform: `scale(${phoneQ})` }} />
        )}
        <Shredder t={t} b={b} part="back" />
        {/* the strips and the sheet they make; below the slot line they are inside the shredder */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, perspective: 1100, perspectiveOrigin: "540px 280px",
          clipPath: `polygon(-400px -400px, 1480px -400px, 1480px ${clipBottom}px, -400px ${clipBottom}px)`, opacity: sheetOp }}>
          {allFlat && (
            <div style={{ position: "absolute", left: 540 - rect.w / 2, top: rect.y, width: rect.w, height: rect.h, overflow: "hidden",
              borderRadius: SCR.r * g, backgroundImage: `url(${fin})`, backgroundSize: "cover", backgroundPosition: "50% 50%",
              boxShadow: `0 ${mix(18, 30, g)}px ${mix(30, 60, g)}px rgba(0,0,0,${mix(0.32, 0.2, g)})` }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${paper})`, backgroundSize: "180px 180px",
                mixBlendMode: "soft-light", opacity: 0.7 * grain }} />
              {Array.from({ length: N - 1 }, (_, i) => (
                <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: `${((i + 1) * 100) / N}%`, width: 1,
                  background: `rgba(255,255,255,${(0.25 * grain).toFixed(3)})` }} />
              ))}
            </div>
          )}
          {!allFlat && poses.map((p, i) => <Strip key={i} i={i} p={p} raw={raw} fin={fin} paper={paper} />)}
        </div>
        {/* the phone's bezel closes round the sheet as it narrows (the real Phone underneath has the same
            geometry once landed, so this hands over invisibly) */}
        {allFlat && phoneOp > 0.01 && (
          <div style={{ position: "absolute", left: 540 - rect.w / 2 - 9 * phoneQ, top: rect.y - 9 * phoneQ,
            width: rect.w + 18 * phoneQ, height: rect.h + 18 * phoneQ, boxSizing: "border-box", border: `${9 * phoneQ}px solid #0a0a0b`,
            borderRadius: SCR.r * g + 9 * phoneQ, opacity: phoneOp * (1 - win(t, 2480, 2520)),
            boxShadow: "0 0 0 3px #3a3a3e, 0 0 0 4px #17171a" }} />
        )}
        <Shredder t={t} b={b} part="front" />
      </div>
    </div>
  );
};

export const SHRED_KINDS = { "kf-u-shred": Shred };
export const SHRED_ASSETS = ["U-raw.jpg", "U-fin.jpg", "U-paper.png", "kf-finished-reel.mp4"];
