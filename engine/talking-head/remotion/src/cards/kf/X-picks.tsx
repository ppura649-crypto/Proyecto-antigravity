import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { KINDS as HOLO_H } from "../holo/famH";
import { Phone } from "./L-reel";
import { clamp, easeIn2, easeInOut, easeOut3, mix, pick, win } from "./L-util";
import { CX, CY, OX, OY, P, PH, PSF, SC, SCREEN, TH, TW, bend, proj } from "./X-contact";
import { FR, FrameImg, SHEET, STRIP_W, SheetContent, TARGET, frameRect, ringAt } from "./X-contact-parts";
// keyframes-v1 hook X3 "Claude picks / my best take" (builder X, round 2, 2026-09-25). The contact print of X2, but
// its strips are this take's real stretches from source.mov: the empty chair and walk-in (0-5 s), take 1 of "Once you
// get it" (60-67 s, cut), the dead pauses (38-41, 58-60, 76-79 s) and take 2 of the same line (69-74 s, kept). The
// real Claude mark is the stylus. AND / IT'S: it strikes the five rejected strips with quick orange lines. EXACTLY:
// it rings the best frame of take 2. HOW: it pulls that frame off the print like a sticker (the table light bleeding
// through the hole). GOT: the frame rises and becomes the phone playing their finished reel, landed ~2450, held.

const CLAUDE = "#D97757";
const COLS3: string[][] = [
  ["X-t-0.8.jpg", "X-t-2.8.jpg", "X-t-4.8.jpg"],       // empty chair, walking in
  ["X-t-60.6.jpg", "X-t-62.8.jpg", "X-t-65.0.jpg"],    // take 1 of "Once you get it"
  ["X-t-38.6.jpg", "X-t-39.8.jpg", "X-t-41.0.jpg"],    // dead pause
  ["X-t-69.6.jpg", "X-t-71.6.jpg", "X-t-73.6.jpg"],    // take 2, kept
  ["X-t-58.3.jpg", "X-t-59.2.jpg", "X-t-60.0.jpg"],    // dead pause
  ["X-t-76.2.jpg", "X-t-77.8.jpg", "X-t-79.2.jpg"],    // dead pause
];
export const PICKS_ASSETS = [...COLS3.flat(), "X-mark.png", "kf-finished-reel.mp4"];
const T = frameRect(TARGET.col, TARGET.row);
const TSRC = COLS3[TARGET.col]![TARGET.row]!;
const IH = T.w / (280 / 498), IOFF = (T.h - IH) * 0.3;
const N = 15, DS = T.h / N;
const LEN = 2 * FR.lead + 3 * FR.h + 2 * FR.gap;
const STRIKE_COLS = [0, 1, 2, 4, 5];
const strikeLine = (c: number) => {
  const x = FR.x0 + c * (STRIP_W + FR.sgap);
  const top = { x: x + STRIP_W - 16, y: FR.y0 + 18 }, bot = { x: x + 18, y: FR.y0 + LEN - 22 };
  const down = STRIKE_COLS.indexOf(c) % 2 === 0;        // alternate so each stroke starts where the last one ended
  return down ? { x0: top.x, y0: top.y, x1: bot.x, y1: bot.y } : { x0: bot.x + STRIP_W - 34, y0: bot.y, x1: top.x - STRIP_W + 34, y1: top.y };
};
const SDUR = 62;

const Strikes: React.FC<{ t: number; at: number[] }> = ({ t, at }) => (
  <svg width={SHEET.w} height={SHEET.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    <defs>
      <filter id="xpk-wax" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="13" result="g" />
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.2" result="ga" />
        <feComposite in="d" in2="ga" operator="in" />
      </filter>
    </defs>
    {STRIKE_COLS.map((c, i) => {
      const p = easeOut3(win(t, at[i]!, at[i]! + SDUR));
      if (p <= 0) return null;
      const l = strikeLine(c);
      return <path key={c} d={`M${l.x0} ${l.y0} Q${(l.x0 + l.x1) / 2 + 10} ${(l.y0 + l.y1) / 2} ${l.x1} ${l.y1}`} pathLength={1}
        fill="none" stroke={CLAUDE} strokeWidth={11} strokeLinecap="round" strokeDasharray={`${p} 2`} filter="url(#xpk-wax)" opacity={0.95} />;
    })}
  </svg>
);

type B = { now: number; and: number; its: number; exactly: number; how: number; got: number };
const Hook: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, h, fps, fromMs, toMs, beats, assets, data } = props;
  const b = { now: 1144, and: 1433, its: 1577, exactly: 1877, how: 1997, got: 2357, ...(beats as Record<string, number>) } as B;
  const d = data ?? {};
  const src = (n: string) => staticFile(pick(assets, n));
  const k = w / 1080;
  const TT = HOLO_H["holo-h-title"]!;
  if (t < b.now) return <TT {...props} h={h} fromMs={fromMs} toMs={b.now} data={{ lines: d.lines ?? ["Claude picks", "my best take"], fontPx: d.fontPx ?? 120 }} />;

  const arrive = easeOut3(win(t, b.now, b.now + 320));
  const A = (mix(40, 24, arrive) * Math.PI) / 180;
  const at = [b.and, b.and + 72, b.its, b.its + 72, b.its + 144];
  const ringT0 = b.exactly, ringT1 = b.exactly + 115;
  const ring = easeInOut(win(t, ringT0, ringT1));
  const pEnd = b.how + 190, tD = b.how + 320;
  const peel = easeInOut(win(t, b.how - 10, pEnd));
  const up = easeInOut(win(t, pEnd, tD));
  const R = 26 * (1 - win(peel, 0.8, 1)) + 0.4, BETA = (mix(44, 24, up) * Math.PI) / 180;
  const zL = 18 * peel + 50 * up, yL = -14 * up;
  const yl = T.y + peel * T.h;
  const sink = win(t, tD, 2470);
  const sheetOp = 1 - easeIn2(win(t, b.got - 10, b.got + 110));
  const out = easeIn2(win(t, toMs - 140, toMs));

  // --- the Claude mark's tip, in sheet px (+ height above the paper), along its whole job
  let mx = 1000, my = 90, mz = 60;
  const hop = (x0: number, y0: number, x1: number, y1: number, u: number) => {
    const e = easeInOut(u); mx = mix(x0, x1, e); my = mix(y0, y1, e); mz = 26 * Math.sin(Math.PI * u);
  };
  const first = strikeLine(STRIKE_COLS[0]!);
  if (t < at[0]!) hop(1010, 60, first.x0, first.y0, win(t, b.now + 100, at[0]!));
  else if (t < at[4]! + SDUR) {
    const i = Math.max(0, at.findIndex((a, j) => t >= a && (j === 4 || t < at[j + 1]!)));
    const l = strikeLine(STRIKE_COLS[i]!), u = win(t, at[i]!, at[i]! + SDUR);
    if (u < 1) { const e = easeOut3(u); mx = mix(l.x0, l.x1, e); my = mix(l.y0, l.y1, e); mz = 0; }
    else { const n = strikeLine(STRIKE_COLS[Math.min(4, i + 1)]!); hop(l.x1, l.y1, n.x0, n.y0, win(t, at[i]! + SDUR, at[i + 1] ?? at[i]! + SDUR + 1)); }
  } else if (t < ringT0) { const l = strikeLine(5), r0 = ringAt(0); hop(l.x1, l.y1, r0[0], r0[1], win(t, at[4]! + SDUR, ringT0)); }
  else if (t < ringT1) { [mx, my] = ringAt(ring); mz = 0; }
  else if (t < b.how) { const r1 = ringAt(1); hop(r1[0], r1[1], T.x + T.w / 2, T.y + 4, win(t, ringT1, b.how)); }
  // during the peel the mark holds the sticker's free (top) edge
  const pulled = t >= b.how;
  let markScreen = proj(mx + OX, my + OY, mz, A);
  if (pulled) {
    const g = bend(Math.max(0, yl - T.y), R, BETA);
    markScreen = proj(T.x + T.w / 2 + OX, yl + g.dy + yL + OY, g.dz + zL + 8, A);
  }

  const slices: React.ReactNode[] = [];
  if (t >= b.how - 10 && t < tD) {
    for (let i = 0; i < N; i++) {
      const yTop = T.y + i * DS, sLow = yl - (yTop + DS);
      const bg: React.CSSProperties = { backgroundImage: `url(${src(TSRC)})`, backgroundSize: `${T.w}px ${IH}px`,
        backgroundPosition: `0px ${IOFF - i * DS}px` };
      if (sLow + DS <= 0) { slices.push(<div key={i} style={{ position: "absolute", left: T.x, top: yTop, width: T.w, height: DS + 0.6, ...bg, filter: "contrast(1.1) saturate(0.95)" }} />); continue; }
      const g = bend(Math.max(0, sLow), R, BETA);
      const face = Math.cos(A - g.a);
      slices.push(
        <div key={i} style={{ position: "absolute", left: T.x, top: yl + g.dy - DS + yL, width: T.w, height: DS + 0.6, ...bg,
          transformOrigin: "50% 100%", transform: `translateZ(${(g.dz + zL).toFixed(2)}px) rotateX(${(-g.a * 180) / Math.PI}deg)`,
          filter: `contrast(1.1) saturate(0.95) brightness(${(0.72 + 0.34 * Math.max(0, face)).toFixed(3)})` }} />,
      );
    }
  }
  // the free card, screen px, up to the phone screen
  const c0a = proj(T.x + OX, T.y + OY + T.h + yL - T.h * Math.cos(BETA), zL + T.h * Math.sin(BETA), A);
  const c0b = proj(T.x + OX + T.w, T.y + OY + T.h + yL, zL, A);
  const r0 = { x: c0a.X, y: c0a.Y, w: c0b.X - c0a.X, h: c0b.Y - c0a.Y };
  const fly = easeInOut(win(t, tD, 2450));
  const land = easeOut3(win(t, 2360, 2450));
  const hold = 1 + 0.022 * win(t, 2450, toMs);
  const cr = { x: mix(r0.x, SCREEN.x, fly), y: mix(r0.y, SCREEN.y, fly) - 40 * Math.sin(Math.PI * fly), w: mix(r0.w, SCREEN.w, fly), h: mix(r0.h, SCREEN.h, fly) };
  if (t >= tD) markScreen = { X: cr.x + cr.w / 2 + 60 * fly, Y: cr.y - 10 - 80 * fly };
  const bz = easeOut3(win(t, b.got - 40, b.got + 70)), bez = 8.3 * bz;
  const tilt = 9 * Math.sin(Math.PI * fly);
  const markOp = clamp(win(t, b.now + 60, b.now + 200)) * (1 - win(t, tD + 40, tD + 150));
  const markLift = pulled ? 0.6 : mz / 26;
  const spin = (t - b.now) * 0.06;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0",
      opacity: (1 - out) * clamp(0.25 + arrive * 2) }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, perspective: P, perspectiveOrigin: `${CX}px ${CY}px`, opacity: sheetOp }}>
        <div style={{ position: "absolute", left: CX - TW / 2, top: CY - TH / 2, width: TW, height: TH, transformStyle: "preserve-3d",
          transform: `translateY(${50 * (1 - arrive) + 20 * sink}px) rotateX(${(A * 180) / Math.PI}deg) scale3d(${SC * (1 - 0.06 * sink)}, ${SC * (1 - 0.06 * sink)}, ${SC})`,
          filter: sink > 0 ? `brightness(${1 - 0.35 * sink})` : undefined }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #d9dde1 0%, #a6acb2 50%, #7d838a 100%)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.8)" }} />
          <div style={{ position: "absolute", left: 18, top: 16, right: 18, bottom: 16,
            background: "radial-gradient(ellipse at 50% 45%, #ffffff 0%, #f6f8fb 55%, #e6eaef 100%)",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.18), inset 0 2px 6px rgba(0,0,0,0.25)" }} />
          <div style={{ position: "absolute", left: OX, top: OY, width: SHEET.w, height: SHEET.h, transformStyle: "preserve-3d",
            boxShadow: "0 0 22px 8px rgba(255,255,255,0.95), 0 0 3px rgba(0,0,0,0.25)" }}>
            <SheetContent src={src} ring={ring} hideTarget={t >= b.how - 10} glow={peel} id="xpk1" cols={COLS3} ringColor={CLAUDE}>
              <Strikes t={t} at={at} />
            </SheetContent>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.13) 44%, rgba(255,255,255,0) 58%)" }} />
            {slices}
          </div>
        </div>
      </div>
      {t >= tD - 1 && t < 2480 && (
        <div style={{ position: "absolute", left: cr.x - bez, top: cr.y - bez, width: cr.w + 2 * bez, height: cr.h + 2 * bez,
          borderRadius: 37 * bz + bez, background: "#0a0a0b", overflow: "hidden",
          transformOrigin: "50% 0%", transform: `perspective(1200px) rotateX(${tilt}deg) scale(${hold})`, opacity: 1 - win(t, 2430, 2470),
          boxShadow: `0 0 0 ${3 * bz}px #3a3a3e, 0 ${12 + 22 * fly}px ${20 + 40 * fly}px rgba(0,0,0,${0.35 + 0.25 * fly})` }}>
          <div style={{ position: "absolute", left: bez, top: bez, width: cr.w, height: cr.h, overflow: "hidden", borderRadius: 37 * bz }}>
            <FrameImg src={src(TSRC)} />
          </div>
        </div>
      )}
      {t >= 2400 && (
        <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={2400} startSec={d.startSec ?? 0.92}
          style={{ left: PH.x, top: PH.y, transformOrigin: "50% 0%", opacity: win(t, 2400, 2440), transform: `scale(${PSF * hold * mix(1.02, 1, land)})` }} />
      )}
      {markOp > 0 && (
        <div style={{ position: "absolute", left: markScreen.X, top: markScreen.Y, width: 0, height: 0, opacity: markOp }}>
          <Img src={src("X-mark.png")} style={{ position: "absolute", left: -42 + 10 * markLift, top: -42 + 16 * markLift, width: 84, height: 84,
            opacity: 0.35, filter: `brightness(0) blur(${3 + 5 * markLift}px)` }} />
          <Img src={src("X-mark.png")} style={{ position: "absolute", left: -48, top: -48 - 8 * markLift, width: 96, height: 96,
            transform: `rotate(${spin}deg) scale(${1 + 0.08 * markLift})`, filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.35))" }} />
        </div>
      )}
    </div>
  );
};

export const PICKS_KINDS = { "kf-x-picks": Hook };
