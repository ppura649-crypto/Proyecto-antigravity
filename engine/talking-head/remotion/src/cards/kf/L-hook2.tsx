import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { KINDS as HOLO_H } from "../holo/famH";
import { Blade, Cell, Housing } from "./L-film";
import { Phone } from "./L-reel";
import { FH, FW, FY, PITCH, SH, clamp, easeIn2, easeIn3, easeInOut, easeOut3, mix, pick, win } from "./L-util";
// keyframes-v1 hook v2 (builder L, 2026-09-25), top band 0.058-0.378H (card 1080 x 614). Their notes: everything above
// their head; "we can do slightly better than that". Holo hook shape: the title ALONE to NOW (1144), then ONE physical
// transformation on "and it's exactly how I got this account": a big 35 mm strip of their real raw take slides in,
// the blade drops on AND, the two dead runs (empty chair + walking in, then an eyes-down pause) fall away backwards
// on IT'S / EXACTLY, the strip snaps tight on HOW, and on GOT THIS the whole strip collapses into one frame that
// grows into their finished captioned reel on a phone, landed by 2450 and held.

const K = 1.2;                                   // strip scale: frames 168 x 300 on screen
const STRIP_Y = 120, BLADE_X = 540 / K;           // blade line in strip units (450)
type F = { img: string; run?: number };
// strip, film order; index 0 sits at strip-x 0 once halted
const STRIP: F[] = [
  { img: "L-f16.jpg" }, { img: "L-f00.jpg" }, { img: "L-f01.jpg", run: 0 }, { img: "L-f02.jpg", run: 0 },
  { img: "L-f03.jpg" }, { img: "L-f04.jpg", run: 1 }, { img: "L-f05.jpg" },
  ...["08", "09", "10", "11", "12", "13", "14", "15"].map((n) => ({ img: `L-f${n}.jpg` })),
];
const J0 = 1;                                     // STRIP[J0] sits at strip-x 0 at the halt
const RUNS = [{ j0: 2, n: 2, sgn: -1 }, { j0: 5, n: 1, sgn: 1 }];
const gapBefore = (j: number) => RUNS.reduce((g, r) => g + (j >= r.j0 + r.n ? r.n * PITCH : 0), 0);
export const HOOK2_ASSETS = [...new Set(STRIP.map((f) => f.img)), "kf-finished-reel.mp4"];
const HERO = 7;                                   // L-f08: the frame that becomes the phone
const PH = { x: 540 - 146, y: 7 };                // the phone (292 x 600), its screen inset 9
const PS = 0.92;                                  // phone scale: its foot stays on their forehead, clear of their eyes

const Hook2: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, h, fps, fromMs, toMs, beats, assets, data } = props;
  const b = { now: 1144, and: 1433, its: 1577, exactly: 1877, how: 1997, got: 2357, this: 2537, ...(beats as Record<string, number>) };
  const d = data ?? {};
  const src = (n: string) => staticFile(pick(assets, n));
  const k = w / 1080;
  const T = HOLO_H["holo-h-title"]!;
  const title = t < b.now ? (
    <T {...props} h={h} fromMs={fromMs} toMs={b.now} data={{ lines: d.lines ?? ["I don't edit", "my videos anymore."], fontPx: d.fontPx ?? 120 }} />
  ) : null;
  if (t < b.now) return <>{title}</>;

  // --- the strip clock: s = strip travel (strip units), halted by the blade
  const ti = b.and + 42, D = 200, T0 = b.now;
  const sAt = (x: number) => x < ti ? -D * Math.pow(1 - clamp((x - T0) / (ti - T0)), 1.35)
    : -3 * Math.sin(Math.PI * win(x, ti, ti + 110));
  const tightEnd = b.how + 95;
  const close = easeIn3(win(t, b.how, tightEnd));
  const drift = 75 * easeInOut(win(t, tightEnd + 40, b.got));   // settles L-f08 on the centre line
  const s = sAt(t) + drift;
  const v = Math.abs(sAt(t) - sAt(t - 8)) / 0.008;
  // --- the collapse into the phone
  const conv = easeIn2(win(t, b.got - 30, b.got + 70));
  const grow = easeInOut(win(t, b.got - 30, 2450));
  const phoneIn = win(t, b.got + 30, b.got + 80);
  const out = easeIn2(win(t, toMs - 137, toMs));
  const dip = 3 * Math.sin(Math.PI * win(t, ti, ti + 120)) + 3 * Math.sin(Math.PI * win(t, tightEnd, tightEnd + 110));
  const tipBlade = t < ti ? mix(76, STRIP_Y + SH * K + 18, easeIn2(win(t, b.and, ti))) : mix(STRIP_Y + SH * K + 18, 76, easeInOut(win(t, ti + 90, ti + 170)));
  const lift = easeIn3(win(t, ti + 160, ti + 320));              // the blade unit is pulled up out of frame
  const cut = easeOut3(win(t, ti, ti + 60));
  const heroX0 = BLADE_X;                                          // strip-x of the hero once centred
  const X = (j: number) => (j - J0) * PITCH - close * gapBefore(j) - s;
  const blurX = Math.min(10, v * 0.0028) + 16 * Math.sin(Math.PI * conv) * (1 - conv * 0.5);

  const cells: React.ReactNode[] = [];
  STRIP.forEach((f, j) => {
    if (f.run !== undefined) return;
    if (j === HERO && t >= b.got - 30) return;
    let x = X(j);
    x = mix(x, heroX0 - 75, conv);
    if (x < -PITCH - 40 || x > 1000) return;
    cells.push(<Cell key={j} src={src(f.img)} n={j} x={x} />);
  });
  RUNS.forEach((rn, i) => {
    const at = i === 0 ? b.its : b.exactly;
    const tau = (t - at) / 1000;
    const x = X(rn.j0);
    if (tau > 0.3) return;
    const y = tau > 0 ? 0.5 * 3600 * tau * tau : 0;
    const z = tau > 0 ? -1400 * tau * tau - 120 * tau : 0;
    const rx = tau > 0 ? -(170 * tau + 260 * tau * tau) : 0;
    const rz = tau > 0 ? rn.sgn * 60 * tau : 0;
    const op = 1 - win(tau, 0.12, 0.3);
    cells.push(
      <div key={`run${i}`} style={{ position: "absolute", left: x + 1.5 * cut, top: 0, width: rn.n * PITCH - 3 * cut, height: SH,
        transformOrigin: "50% 100%", opacity: op,
        transform: `translate3d(0, ${y}px, ${z}px) rotateX(${rx}deg) rotateZ(${rz}deg)`,
        boxShadow: cut > 0 ? `inset 1.5px 0 0 rgba(255,255,255,${0.8 * cut}), inset -1.5px 0 0 rgba(255,255,255,${0.8 * cut})` : undefined,
        filter: tau > 0 ? `brightness(${1 - 0.4 * win(tau, 0, 0.3)})` : undefined, overflow: "hidden" }}>
        {Array.from({ length: rn.n }, (_, q) => <Cell key={q} src={src(STRIP[rn.j0 + q]!.img)} n={rn.j0 + q} x={q * PITCH - 1.5 * cut} />)}
      </div>,
    );
  });
  const stripOp = 1 - win(t, b.got + 20, b.got + 90);

  // the hero window: from its place on the strip to the phone screen
  const hs = { x: 540 - (FW * K) / 2, y: STRIP_Y + FY * K, w: FW * K, h: FH * K };
  const he = { x: PH.x + 9, y: PH.y + 9, w: 274, h: 582 };
  const hr = { x: mix(hs.x, he.x, grow), y: mix(hs.y, he.y, grow), w: mix(hs.w, he.w, grow), h: mix(hs.h, he.h, grow) };
  const land = easeOut3(win(t, b.got + 30, 2450));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0", opacity: 1 - out }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="lh2b" x="-5%" y="0%" width="110%" height="100%"><feGaussianBlur stdDeviation={`${blurX.toFixed(2)} 0`} /></filter>
      </svg>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${dip}px)` }}>
        {/* the strip */}
        <div style={{ position: "absolute", left: 0, top: STRIP_Y, width: 1080 / K, height: SH, transform: `scale(${K})`, transformOrigin: "0 0",
          perspective: 1100, opacity: stripOp, filter: blurX > 0.4 ? "url(#lh2b)" : undefined }}>
          <div style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 16px 22px rgba(0,0,0,0.5))", transformStyle: "preserve-3d" }}>{cells}</div>
        </div>
        {/* the blade unit, no bed: it lifts away upward after the cut */}
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${-300 * lift}px)`, opacity: 1 - win(lift, 0.5, 1) }}>
          <Blade tip={tipBlade} />
          <Housing />
        </div>
        <div style={{ position: "absolute", left: 536, top: STRIP_Y - 10, width: 8, height: SH * K + 20,
          background: "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.95) 50%, rgba(255,255,255,0))",
          opacity: clamp(1 - Math.abs(t - ti - 15) / 60), filter: "blur(2px)" }} />
        {t >= b.got + 30 && (
          <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={b.got + 30} startSec={d.startSec ?? 0.92}
            style={{ left: PH.x, top: PH.y, opacity: phoneIn, transformOrigin: "50% 0%",
              transform: `scale(${PS * mix(1.05, 1, land) * (1 + 0.02 * win(t, 2450, toMs))})` }} />
        )}
        {t >= b.got - 30 && (
          <div style={{ position: "absolute", left: hr.x, top: hr.y, width: hr.w, height: hr.h, overflow: "hidden",
            borderRadius: 40 * grow, opacity: 1 - win(t, 2400, 2450),
            transform: `scale(${mix(1, PS, grow) * mix(1.05, 1, land) * (1 + 0.02 * win(t, 2450, toMs))})`,
            transformOrigin: `${540 - hr.x}px ${PH.y - hr.y}px`, boxShadow: `0 24px 50px rgba(0,0,0,${0.5 * grow})` }}>
            <Img src={src(STRIP[HERO]!.img)} style={{ width: "100%", height: "100%", objectFit: "cover",
              filter: `contrast(1.06) saturate(0.92) sepia(${0.07 * (1 - grow)})` }} />
          </div>
        )}
      </div>
    </div>
  );
};

export const HOOK2_KINDS = { "kf-l-hook2": Hook2 };
