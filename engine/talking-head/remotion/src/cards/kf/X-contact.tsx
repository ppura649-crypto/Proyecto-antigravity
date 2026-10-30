import React from "react";
import { staticFile } from "remotion";
import type { CardProps } from "../props";
import { KINDS as HOLO_H } from "../holo/famH";
import { Phone } from "./L-reel";
import { clamp, easeIn2, easeInOut, easeOut3, mix, pick, win } from "./L-util";
import { COLS, FrameImg, Marker, SHEET, SheetContent, TARGET, frameRect, ringAt } from "./X-contact-parts";
// keyframes-v1 hook X2 "Contact sheet" (builder X, 2026-09-25), top band 0.058-0.378H (card 1080 x 614). The title
// alone to NOW, then a glossy contact print of their raw frames lies on a lit light table. AND: a heavy glass loupe
// glides across it, magnifying the frames it passes. EXACTLY: a red china marker rings one frame of this take. HOW:
// that frame peels off the print like a sticker (a curl, the table light bleeding through the hole) and stands up
// to face the camera. I GOT: it rises out of the sheet, grows a black bezel and becomes the phone playing their
// finished reel, landed ~2450 and held under a slow push while the sheet sinks away.

export const TW = 1040, TH = 640, OX = 40, OY = 30;          // light table, and the sheet's place on it
export const P = 1500, CX = 540, CY = 300, SC = 0.88;         // camera: perspective, plane centre on screen, plane scale
const T = frameRect(TARGET.col, TARGET.row);
const TSRC = COLS[TARGET.col]![TARGET.row]!;
const IMG_AR = 280 / 498;                               // L-f frames are 280 x 498
const IH = T.w / IMG_AR, IOFF = (T.h - IH) * 0.3;        // "cover, 50% 30%" in the frame window
const N = 15, DS = T.h / N;
const LR = 92, MAG = 1.55;                              // loupe radius (table px), magnification
export const PH = { x: 540 - 146, y: 7 }, PSF = 0.92;
export const SCREEN = { x: 540 + (PH.x + 9 - 540) * PSF, y: PH.y + 9 * PSF, w: 274 * PSF, h: 582 * PSF };
export const CONTACT_ASSETS = [...new Set(COLS.flat()), "kf-finished-reel.mp4"];

// CSS rotateX(A) scale3d(SC) about the plane centre, perspective P from (CX, CY)
export const proj = (x: number, y: number, w: number, A: number) => {
  const u = (x - TW / 2) * SC, v = (y - TH / 2) * SC, ww = w * SC, c = Math.cos(A), s = Math.sin(A);
  const yy = v * c - ww * s, zz = v * s + ww * c, f = P / (P - zz);
  return { X: CX + u * f, Y: CY + yy * f };
};
// the peel: material at distance s past the peel line wraps a cylinder of radius R, then leaves it straight at BETA
export const bend = (s: number, R: number, beta: number) => {
  if (s < R * beta) { const a = s / R; return { dy: -R * Math.sin(a), dz: R * (1 - Math.cos(a)), a }; }
  const r = s - R * beta;
  return { dy: -R * Math.sin(beta) - r * Math.cos(beta), dz: R * (1 - Math.cos(beta)) + r * Math.sin(beta), a: beta };
};

type B = { now: number; and: number; exactly: number; how: number; got: number };
const Hook: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, h, fps, fromMs, toMs, beats, assets, data } = props;
  const b = { now: 1144, and: 1433, exactly: 1877, how: 1997, got: 2357, ...(beats as Record<string, number>) } as B;
  const d = data ?? {};
  const src = (n: string) => staticFile(pick(assets, n));
  const k = w / 1080;
  const TT = HOLO_H["holo-h-title"]!;
  if (t < b.now) return <TT {...props} h={h} fromMs={fromMs} toMs={b.now} data={{ lines: d.lines ?? ["I don't edit", "my videos anymore."], fontPx: d.fontPx ?? 120 }} />;

  const arrive = easeOut3(win(t, b.now, b.now + 320));
  const A = (mix(40, 24, arrive) * Math.PI) / 180;
  const pEnd = b.how + 190, tD = b.how + 320;              // peeled, then standing free facing the camera
  const peel = easeInOut(win(t, b.how - 10, pEnd));
  const up = easeInOut(win(t, pEnd, tD));
  const R = 26 * (1 - win(peel, 0.8, 1)) + 0.4, BETA = (mix(44, 24, up) * Math.PI) / 180;
  const zL = 18 * peel + 50 * up, yL = -14 * up;                        // the freed card lifts off the paper
  const yl = T.y + peel * T.h;
  const ring = easeInOut(win(t, b.exactly, b.exactly + 140));
  const sink = win(t, tD, 2470);
  const sheetOp = 1 - easeIn2(win(t, b.got - 10, b.got + 110));
  const out = easeIn2(win(t, toMs - 140, toMs));
  // the loupe glides in and comes to rest beside the target, like heavy glass on paper
  const lg = easeOut3(win(t, b.and, b.and + 430));
  const lx = mix(-150, T.x + OX + 255, lg), ly = mix(430, T.y + OY + T.h / 2 + 12, lg) - 30 * Math.sin(Math.PI * lg);
  const lxx = lx;

  // --- the sticker slices, in sheet px, peeling from the top edge
  const slices: React.ReactNode[] = [];
  if (t >= b.how - 10 && t < tD) {
    for (let i = 0; i < N; i++) {
      const yTop = T.y + i * DS, sLow = yl - (yTop + DS);
      const bg: React.CSSProperties = { backgroundImage: `url(${src(TSRC)})`, backgroundSize: `${T.w}px ${IH}px`,
        backgroundPosition: `0px ${IOFF - i * DS}px`, filter: "contrast(1.1) saturate(0.95)" };
      if (sLow + DS <= 0) { slices.push(<div key={i} style={{ position: "absolute", left: T.x, top: yTop, width: T.w, height: DS + 0.6, ...bg }} />); continue; }
      const g = bend(Math.max(0, sLow), R, BETA);
      const face = Math.cos(A - g.a);                        // 1 = square to the camera
      slices.push(
        <div key={i} style={{ position: "absolute", left: T.x, top: yl + g.dy - DS + yL, width: T.w, height: DS + 0.6,
          transformOrigin: "50% 100%", transformStyle: "preserve-3d",
          transform: `translateZ(${(g.dz + zL).toFixed(2)}px) rotateX(${(-g.a * 180) / Math.PI}deg)` }}>
          <div style={{ position: "absolute", inset: 0, ...bg, backfaceVisibility: "hidden",
            filter: `contrast(1.1) saturate(0.95) brightness(${(0.72 + 0.34 * Math.max(0, face)).toFixed(3)})` }} />
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateX(180deg)",
            background: `rgb(${Math.round(120 + 90 * Math.abs(face))},${Math.round(117 + 88 * Math.abs(face))},${Math.round(110 + 84 * Math.abs(face))})` }} />
        </div>,
      );
    }
    // the flap's shadow on the print as it folds over
    const fold = Math.sin(Math.PI * peel) * (1 - up);
    slices.unshift(<div key="sh" style={{ position: "absolute", left: T.x - 4, top: yl - 6, width: T.w + 8, height: 30 + 70 * fold,
      background: "rgba(0,0,0,0.5)", filter: "blur(9px)", opacity: fold }} />);
  }
  // --- the free card in screen px: from where the standing sticker projects, up to the phone screen
  const c0a = proj(T.x + OX, T.y + OY + T.h + yL - T.h * Math.cos(BETA), zL + T.h * Math.sin(BETA), A);
  const c0b = proj(T.x + OX + T.w, T.y + OY + T.h + yL, zL, A);
  const r0 = { x: c0a.X, y: c0a.Y, w: c0b.X - c0a.X, h: c0b.Y - c0a.Y };
  const fly = easeInOut(win(t, tD, 2450));
  const land = easeOut3(win(t, 2360, 2450));
  const hold = 1 + 0.022 * win(t, 2450, toMs);
  const cr = { x: mix(r0.x, SCREEN.x, fly), y: mix(r0.y, SCREEN.y, fly) - 40 * Math.sin(Math.PI * fly), w: mix(r0.w, SCREEN.w, fly), h: mix(r0.h, SCREEN.h, fly) };
  const bz = easeOut3(win(t, b.got - 40, b.got + 70)), bez = 8.3 * bz;
  const tilt = 9 * Math.sin(Math.PI * fly);
  // --- the marker tip, projected from the ring point on the sheet
  const tipP = ringAt(ring), tip = proj(tipP[0] + OX, tipP[1] + OY, 0, A);
  const mIn = 1 - easeOut3(win(t, b.exactly - 110, b.exactly)), mOut = easeIn2(win(t, b.exactly + 150, b.exactly + 330));

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0",
      opacity: (1 - out) * clamp(0.25 + arrive * 2) }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, perspective: P, perspectiveOrigin: `${CX}px ${CY}px`,
        opacity: sheetOp }}>
        <div style={{ position: "absolute", left: CX - TW / 2, top: CY - TH / 2, width: TW, height: TH, transformStyle: "preserve-3d",
          transform: `translateY(${50 * (1 - arrive) + 20 * sink}px) rotateX(${(A * 180) / Math.PI}deg) scale3d(${SC * (1 - 0.06 * sink)}, ${SC * (1 - 0.06 * sink)}, ${SC})`,
          filter: sink > 0 ? `brightness(${1 - 0.35 * sink})` : undefined }}>
          {/* the light table: brushed aluminium frame round a lit opal surface */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #d9dde1 0%, #a6acb2 50%, #7d838a 100%)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.8)" }} />
          <div style={{ position: "absolute", left: 18, top: 16, right: 18, bottom: 16,
            background: "radial-gradient(ellipse at 50% 45%, #ffffff 0%, #f6f8fb 55%, #e6eaef 100%)",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.18), inset 0 2px 6px rgba(0,0,0,0.25)" }} />
          <div style={{ position: "absolute", left: OX, top: OY, width: SHEET.w, height: SHEET.h, transformStyle: "preserve-3d",
            boxShadow: "0 0 22px 8px rgba(255,255,255,0.95), 0 0 3px rgba(0,0,0,0.25)" }}>
            <SheetContent src={src} ring={ring} hideTarget={t >= b.how - 10} glow={peel} id="xcw1" />
            {/* gloss: the room light across the print */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.13) 44%, rgba(255,255,255,0) 58%)" }} />
            {slices}
          </div>
          {t >= b.and && <Loupe x={lxx} y={ly} src={src} ring={ring} />}
        </div>
      </div>
      {t >= b.exactly - 110 && t < b.exactly + 340 && (
        <Marker x={tip.X} y={tip.Y} deg={-54} lift={mIn + 1.3 * mOut} opacity={1 - win(mOut, 0.6, 1)} />
      )}
      {t >= tD - 1 && t < 2480 && (
        <div style={{ position: "absolute", left: cr.x - bez, top: cr.y - bez, width: cr.w + 2 * bez, height: cr.h + 2 * bez,
          borderRadius: 37 * bz + bez, background: "#0a0a0b", overflow: "hidden",
          transformOrigin: "50% 0%", transform: `perspective(1200px) rotateX(${tilt}deg) scale(${hold})`,
          opacity: 1 - win(t, 2430, 2470),
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
    </div>
  );
};

// the loupe: a clear skirt lit by the table, a black barrel, and the lens magnifying the print under it
const Loupe: React.FC<{ x: number; y: number; src: (n: string) => string; ring: number }> = ({ x, y, src, ring }) => {
  const sx = x - OX, sy = y - OY;
  const ringDiv = (z: number, r: number, style: React.CSSProperties, key?: number) => (
    <div key={key} style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: "50%",
      transform: `translateZ(${z}px)`, ...style }} />
  );
  return (
    <>
      {ringDiv(0.5, LR + 14, { border: "9px solid rgba(255,255,255,0.7)", boxShadow: "0 0 0 1px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(0,0,0,0.25), 0 0 18px rgba(255,255,255,0.8)" })}
      {Array.from({ length: 9 }, (_, i) => ringDiv(10 + i * 6, LR + 8, {
        border: "7px solid #16161a", boxShadow: i === 0 ? "0 6px 14px rgba(0,0,0,0.45)" : undefined,
        borderBottomColor: `rgb(${46 + i * 4},${46 + i * 4},${52 + i * 4})` }, i))}
      <div style={{ position: "absolute", left: x - LR, top: y - LR, width: 2 * LR, height: 2 * LR, borderRadius: "50%", overflow: "hidden",
        transform: "translateZ(62px)", background: "#fff",
        boxShadow: "0 0 0 8px #101013, 0 0 0 9.5px rgba(255,255,255,0.35)" }}>
        <div style={{ position: "absolute", left: LR - sx * MAG, top: LR - sy * MAG, width: SHEET.w, height: SHEET.h, transformOrigin: "0 0",
          transform: `scale(${MAG})` }}>
          <SheetContent src={src} ring={ring} hideTarget={false} glow={0} id="xcw2" />
        </div>
        {/* refraction at the rim, a warm/cool fringe, and the glass highlight */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%",
          boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.6), inset 0 0 26px 8px rgba(0,0,0,0.42), inset 3px 0 6px rgba(255,80,60,0.25), inset -3px 0 6px rgba(60,140,255,0.25)" }} />
        <div style={{ position: "absolute", left: "12%", top: "6%", width: "62%", height: "40%", borderRadius: "50%",
          background: "radial-gradient(ellipse at 40% 35%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0) 72%)" }} />
      </div>
    </>
  );
};

export const CONTACT_KINDS = { "kf-x-contact": Hook };
