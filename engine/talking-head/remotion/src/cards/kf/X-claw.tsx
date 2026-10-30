import React from "react";
import { staticFile } from "remotion";
import type { CardProps } from "../props";
import { KINDS as HOLO_H } from "../holo/famH";
import { Phone } from "./L-reel";
import { clamp, easeIn2, easeInOut, easeOut3, mix, pick, win } from "./L-util";
import { CAB, CabinetBack, CabinetFront, Claw, Gantry, Print } from "./X-claw-parts";
// keyframes-v1 hook X1 "Claw machine" (builder X, 2026-09-25), top band 0.058-0.378H (card 1080 x 614). The title
// alone to NOW, then an arcade claw machine: their raw clips as thick glossy prints piled on the cabinet floor, a dark
// phone standing in the pile. AND: the claw drops with weight. EXACTLY: it grips one clip of this take. HOW: it
// lifts, the carriage runs it over the phone and it swings with the inertia. GOT: the claw opens, the clip drops into
// the phone like a letter into a slot, the screen lights with their finished reel and the camera pushes through the
// glass onto the phone, landed ~2470 and held under a slow push.

type P = { img: string; x: number; y: number; w: number; h: number; rot: number; front?: boolean; lit?: number };
const SQ = 124, PW = 86, PHT = 153, CS = 1.35;   // print sizes, claw scale
const PILE: P[] = [
  { img: "R-roll-06.jpg", x: 232, y: 425, w: SQ, h: SQ, rot: -14, lit: 0.8 },
  { img: "R-roll-12.jpg", x: 520, y: 418, w: SQ, h: SQ, rot: 9, lit: 0.8 },
  { img: "R-roll-19.jpg", x: 805, y: 420, w: SQ, h: SQ, rot: -7, lit: 0.8 },
  { img: "R-roll-02.jpg", x: 868, y: 470, w: SQ, h: SQ, rot: 16, lit: 0.85 },
  { img: "L-f03.jpg", x: 262, y: 492, w: PW, h: PHT, rot: 12, lit: 0.9 },
  { img: "R-roll-09.jpg", x: 452, y: 500, w: SQ, h: SQ, rot: -18, lit: 0.9 },
  { img: "R-roll-13.jpg", x: 712, y: 528, w: SQ, h: SQ, rot: 20, front: true, lit: 0.95 },
  { img: "R-roll-00.jpg", x: 196, y: 552, w: SQ, h: SQ, rot: 8, front: true },
  { img: "L-f12.jpg", x: 338, y: 548, w: PW, h: PHT, rot: -9, front: true },
  { img: "R-roll-20.jpg", x: 482, y: 560, w: SQ, h: SQ, rot: 14, front: true },
  { img: "R-roll-10.jpg", x: 612, y: 566, w: SQ, h: SQ, rot: -6, front: true },
  { img: "R-roll-23.jpg", x: 790, y: 560, w: SQ, h: SQ, rot: 10, front: true },
  { img: "L-f05.jpg", x: 880, y: 552, w: PW, h: PHT, rot: -15, front: true },
];
const HERO = { img: "L-f08.jpg", x: 362, y: 440, rot: -5 };
export const CLAW_ASSETS = [...new Set([...PILE.map((p) => p.img), HERO.img]), "kf-finished-reel.mp4"];

const PY = 62;                                   // cable pivot under the carriage
const GRIP_DY = 110 * CS;                             // print centre below the hub top while held
const L_TOP = 2, L_BOT = HERO.y - GRIP_DY - PY; // cable length up / down on the hero
const PS = 0.5, PH0 = { x: 680 - 146 * PS, y: 290 };  // the phone in the pile, and its scale
const PSF = 0.92;                                // phone scale once landed (its foot above their eyes)

type B = { now: number; and: number; exactly: number; how: number; got: number };
const T = (b: B) => ({ touch: b.and + 250, lift0: b.how, lift1: b.how + 230, tr0: b.how + 60, tr1: b.how + 330, rel: b.got - 40 });
const carriage = (t: number, b: B) => {
  const k = T(b);
  return t < k.tr0 ? mix(230, HERO.x, easeOut3(win(t, b.now, b.now + 300))) : mix(HERO.x, 680, easeInOut(win(t, k.tr0, k.tr1)));
};
const cable = (t: number, b: B) => {
  const k = T(b);
  if (t < b.and) return L_TOP;
  if (t < k.touch) return mix(L_TOP, L_BOT, easeInOut(win(t, b.and, k.touch)));
  const settle = 7 * Math.sin(Math.PI * win(t, k.touch, k.touch + 140)) * (1 - win(t, k.touch, k.touch + 140));
  if (t < k.lift0) return L_BOT + settle - 6 * easeOut3(win(t, b.exactly, b.exactly + 100));
  const up = mix(L_BOT - 6, L_TOP, easeInOut(win(t, k.lift0, k.lift1)));
  return up;
};
// the swing: a damped pendulum driven by the carriage's acceleration, frozen while the claw rests on the pile
const swing = (t: number, b: B) => {
  const k = T(b), dt = 0.004;
  let th = 0, om = 0;
  for (let s = b.now; s < t; s += dt * 1000) {
    if (s > k.touch - 30 && s < k.lift0 + 60) { th = 0; om = 0; continue; }
    const a = (carriage(s + 4, b) - 2 * carriage(s, b) + carriage(s - 4, b)) / (dt * dt);
    const Le = cable(s, b) + 90;
    const al = (-5200 * Math.sin(th) - 0.36 * a * Math.cos(th)) / Le - 3.4 * om;
    om += al * dt; th += om * dt;
  }
  return th;
};

const Hook: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, h, fps, fromMs, toMs, beats, assets, data } = props;
  const b = { now: 1144, and: 1433, exactly: 1877, how: 1997, got: 2357, ...(beats as Record<string, number>) } as B;
  const d = data ?? {};
  const src = (n: string) => staticFile(pick(assets, n));
  const k = w / 1080, K = T(b);
  const TT = HOLO_H["holo-h-title"]!;
  if (t < b.now) return <TT {...props} h={h} fromMs={fromMs} toMs={b.now} data={{ lines: d.lines ?? ["I don't edit", "my videos anymore."], fontPx: d.fontPx ?? 120 }} />;

  const cx = carriage(t, b), L = cable(t, b), th = swing(t, b), thDeg = (th * 180) / Math.PI;
  const open = t < b.and ? 0.1 : t < b.exactly ? mix(0.1, 1, easeOut3(win(t, b.and + 60, K.touch))) - 0.15 * easeOut3(win(t, K.touch, b.exactly))
    : t < K.rel ? mix(0.85, 0.1, easeOut3(win(t, b.exactly, b.exactly + 110))) : mix(0.1, 0.8, easeOut3(win(t, K.rel, K.rel + 90)));
  const hubX = cx + L * Math.sin(th), hubY = PY + L * Math.cos(th);
  // the hero print: on the pile, then in the claw, then free-falling into the phone's top edge
  const gripF = easeInOut(win(t, b.exactly + 20, b.exactly + 120));
  const held = { x: hubX + GRIP_DY * Math.sin(th), y: hubY + GRIP_DY * Math.cos(th) };
  let hx = t < b.exactly ? HERO.x : mix(HERO.x, held.x, t < K.lift0 ? gripF : 1);
  let hy = t < b.exactly ? HERO.y : mix(HERO.y, held.y, t < K.lift0 ? gripF : 1);
  let hr = t < b.exactly ? HERO.rot : mix(HERO.rot, -thDeg + 1.5, gripF);
  const fallT = Math.max(0, t - K.rel - 25) / 1000;
  if (fallT > 0) { hy += 0.5 * 32000 * fallT * fallT; hx = mix(hx, 680, clamp(fallT / 0.05)); hr = mix(hr, 0, clamp(fallT / 0.06)); }
  const slotY = PH0.y + 9 * PS;                   // the phone's top edge: the print disappears into it
  const entry = fallT <= 0 ? 0 : clamp((hy + PHT / 2 - slotY) / (PHT + 20));
  const fallBlur = Math.min(5, fallT * 60);
  // the camera: arrive, then push through the glass onto the phone
  const arrive = easeOut3(win(t, b.now, b.now + 320));
  const push = easeInOut(win(t, K.rel + 30, K.rel + 175));
  const pc = { x: 680, y: PH0.y + 300 * PS };
  const S = mix(1, PSF / PS, push) * mix(1.05, 1, arrive) * (1 + 0.025 * win(t, 2470, toMs));
  const tx = mix(pc.x, 540, push), ty = mix(pc.y, 307, push);
  const cab = 1 - easeIn2(win(t, K.rel + 30, K.rel + 95));
  const out = easeIn2(win(t, toMs - 140, toMs));
  const settle = (i: number) => (t > K.lift0 + 60 && (i === 4 || i === 5) ? easeOut3(win(t, K.lift0 + 60, K.lift0 + 260)) : 0);

  const pilePrint = (p: P, i: number) => {
    const s = settle(i), dir = i === 4 ? 1 : -1;
    return <Print key={p.img} src={src(p.img)} w={p.w} h={p.h} lit={p.lit} pos={p.w === SQ ? "50% 40%" : "50% 30%"}
      style={{ left: p.x - p.w / 2 + 7 * s * dir, top: p.y - p.h / 2 + 6 * s, transform: `rotate(${p.rot + 4 * s * dir}deg)` }} />;
  };
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transform: `scale(${k})`, transformOrigin: "0 0",
      opacity: (1 - out) * clamp(arrive * 3) }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614, transformOrigin: "0 0",
        transform: `translate(${tx}px, ${ty}px) scale(${S}) translate(${-pc.x}px, ${-pc.y}px)` }}>
        <div style={{ position: "absolute", inset: 0, opacity: cab }}>
          <CabinetBack />
          {PILE.filter((p) => !p.front).map((p) => pilePrint(p, PILE.indexOf(p)))}
        </div>
        <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={K.rel + 70} startSec={d.startSec ?? 0.92}
          style={{ left: PH0.x, top: PH0.y, transformOrigin: "0 0", transform: `scale(${PS})` }} />
        {/* the clip entering the screen from its top edge, then the reel takes over */}
        <div style={{ position: "absolute", left: PH0.x + 9 * PS, top: PH0.y + 9 * PS, width: 274 * PS, height: 582 * PS,
          borderRadius: 40 * PS, overflow: "hidden", opacity: 1 - win(t, K.rel + 90, K.rel + 150) }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${src(HERO.img)})`, backgroundSize: "cover",
            backgroundPosition: "50% 35%", transform: `translateY(${-(1 - entry) * 100}%)`, filter: fallBlur > 0.3 ? `blur(${fallBlur * 0.6}px)` : undefined }} />
        </div>
        <div style={{ position: "absolute", inset: 0, opacity: cab }}>
          {PILE.filter((p) => p.front).map((p) => pilePrint(p, PILE.indexOf(p)))}
        </div>
          {/* the hero print, clipped at the phone's top edge once it drops in */}
          <div style={{ position: "absolute", left: 0, top: -1000, width: 1080, height: (fallT > 0 ? slotY : 3000) + 1000, overflow: "hidden" }}>
            {entry < 1 && <Print src={src(HERO.img)} w={PW} h={PHT} pos="50% 30%"
              style={{ left: hx - PW / 2, top: hy - PHT / 2 + 1000, transform: `rotate(${hr}deg)`, filter: fallBlur > 0.3 ? `blur(${fallBlur}px)` : undefined }} />}
          </div>
        <div style={{ position: "absolute", inset: 0, opacity: cab }}>
          <Gantry x0={CAB.x0} x1={CAB.x1} y={18} cx={cx} />
          {/* the cable and the claw, rotated about the pivot by the swing */}
          <div style={{ position: "absolute", left: cx, top: PY, width: 0, height: 0, transform: `rotate(${-thDeg}deg)` }}>
            <div style={{ position: "absolute", left: -2, top: -4, width: 4, height: L + 6,
              background: "linear-gradient(90deg, #2a2d31, #d6dbe0 45%, #555b62)",
              backgroundImage: "repeating-linear-gradient(160deg, rgba(0,0,0,0.35) 0 2px, rgba(0,0,0,0) 2px 5px), linear-gradient(90deg, #2a2d31, #d6dbe0 45%, #555b62)" }} />
            <div style={{ position: "absolute", left: 0, top: L, width: 0, height: 0, filter: "drop-shadow(0 10px 12px rgba(0,0,0,0.55))" }}>
              <div style={{ position: "absolute", left: 0, top: 0, transform: `scale(${CS})`, transformOrigin: "0 0" }}>
                <Claw open={open} />
                <Claw open={open} front />
              </div>
            </div>
          </div>
          <CabinetFront sheen={-40 * arrive + 30 * push} />
        </div>
      </div>
    </div>
  );
};

export const CLAW_KINDS = { "kf-x-claw": Hook };
