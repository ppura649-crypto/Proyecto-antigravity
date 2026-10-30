import React from "react";
import { staticFile } from "remotion";
import type { CardProps } from "../props";
import { Bed, Blade, Cell, Housing, LEADER, Leader } from "./L-film";
import { Phone, Reel } from "./L-reel";
import { KINDS as HOLO_H } from "../holo/famH";
import { CY, PITCH, SH, SY, beatsOf, clamp, easeIn2, easeIn3, easeInOut, easeOut3, mix, pick, win } from "./L-util";
// keyframes-v1 V2, the hook (builder L, 2026-09-25). "AI edits all of my videos now, and it's exactly how I got
// this account". A 35 mm strip of THEIR raw take (real frames of source.mov; the dead ones are real frames the cut
// removed: the empty chair before the creator sits, them walking in, eyes-down pauses) runs left through a steel splicer onto
// a take-up reel. Frame 1 it is already travelling. EDITS: the blade drops, the strip stops dead, the cuts open at
// every dead run. ALL / OF / MY: the three dead runs fall out one at a time, tumbling with gravity. NOW: the strip
// snaps tight and whips onto the reel, which spins down; the splicer drops away and the reel glides to centre.
// Tipping forward on "this", it lands as their finished reel playing in a phone, held to the title handover.

// frames on the strip, film order; `run` = dead run index (falls), else live
const STRIP: { img: string; run?: number }[] = [
  { img: "L-f16.jpg" }, { img: "L-f00.jpg" }, { img: "L-f01.jpg", run: 0 }, { img: "L-f02.jpg", run: 0 },
  { img: "L-f03.jpg" }, { img: "L-f04.jpg", run: 1 }, { img: "L-f05.jpg" }, { img: "L-f06.jpg", run: 2 },
  { img: "L-f07.jpg", run: 2 }, ...["08", "09", "10", "11", "12", "13", "14", "15"].map((n) => ({ img: `L-f${n}.jpg` })),
];
export const SPLICE_ASSETS = [...STRIP.map((f) => f.img), "L-roll.jpg", "kf-finished-reel.mp4"];
const RUNS = [{ j0: 2, n: 2, sgn: -1 }, { j0: 5, n: 1, sgn: 1 }, { j0: 7, n: 2, sgn: -1 }];
const gapBefore = (j: number) => RUNS.reduce((g, r) => g + (j >= r.j0 + r.n ? r.n * PITCH : 0), 0);
const TAIL = STRIP.length * PITCH - 5 * PITCH + LEADER;   // film coord of the leader's end once closed up

const S_HALT = 250, D = 230, CX0 = 40, G = 5200;
const VMAX = 5600, ACC = 0.09, T1 = 0.3, TAU = 0.42;
const whipDist = (x: number) => x <= 0 ? 0 : x < ACC ? (VMAX * x * x) / (2 * ACC)
  : x < T1 ? VMAX * (ACC / 2 + x - ACC) : VMAX * (T1 - ACC / 2) + VMAX * TAU * (1 - Math.exp(-(x - T1) / TAU));

// Overlay draws one event at a time, so V1 (the hook title, holo-h-title reused as is) rides on this event: drawn in
// its own screen band above their head, positioned from this card's top.
const Title: React.FC<CardProps & { data: any }> = (p) => {
  const T = HOLO_H["holo-h-title"]!, d = p.data ?? {};
  const H = p.h / (d.hFrac ?? 0.255), top = ((d.topFrac ?? 0.11) - (d.cardTopFrac ?? 0.675)) * H;
  const th = ((d.bottomFrac ?? 0.235) - (d.topFrac ?? 0.11)) * H;
  return (
    <div style={{ position: "absolute", left: 0, top, width: p.w, height: th }}>
      <T {...p} h={th} data={{ lines: d.lines, fontPx: d.fontPx }} />
    </div>
  );
};

const Splice: React.FC<CardProps & { data: any }> = (props) => {
  const { tMs: t, w, fps, toMs, beats, assets, data } = props;
  const b = beatsOf(beats);
  const ti = b.edits + 42;                        // blade meets the bed
  const tSnap = b.now, tHit = b.now + 110, tw = b.now + 110;
  // the strip: s = film coord at the reel's tangent line
  const approach = (x: number) => { const u = Math.min(1, x / ti); return S_HALT - (D * (1 - u) * (1 + 0.5 * (1 - u))) / 1.5; };
  const sAt = (x: number) => x < ti ? approach(x)
    : x < tw ? S_HALT - 4 * Math.sin(Math.PI * win(x, ti, ti + 110))
    : S_HALT + whipDist((x - tw) / 1000);
  const s = sAt(t), v = Math.abs(sAt(t) - sAt(t - 8)) / 0.008;          // px/s
  const close = easeIn3(win(t, tSnap, tHit));
  const cut = easeOut3(win(t, ti, ti + 60));
  const glide = easeInOut(win(t, 1640, 2170));
  const cx = mix(CX0, 540, glide);
  const r = Math.sqrt(4900 + 4.6 * clamp(s, 0, TAIL + 40));
  const tip = easeIn2(win(t, 2250, 2420));
  const reelScale = mix(1, 1.16, glide) * (1 + 0.25 * tip);
  const land = easeOut3(win(t, 2390, 2530));
  const out = easeIn2(win(t, toMs - 137, toMs));
  const dip = 3 * Math.sin(Math.PI * win(t, ti, ti + 120)) + 2 * Math.sin(Math.PI * win(t, tHit, tHit + 100));
  const tipBlade = t < ti ? mix(76, 468, easeIn2(win(t, b.edits, ti))) : mix(468, 76, easeInOut(win(t, 1030, 1120)));
  const splTau = Math.max(0, t - 1520) / 1000, splOp = 1 - win(t, 1560, 1720);
  const splY = 900 * splTau + 4200 * splTau * splTau, splRot = 12 * splTau;
  const blurX = Math.min(26, v * 0.006);
  const src = (n: string) => staticFile(pick(assets, n));
  const X = (j: number) => cx + (j * PITCH - close * gapBefore(j)) - s;

  // the flat strip: live cells, each run as one piece until its fall starts
  const flat: React.ReactNode[] = [];
  STRIP.forEach((f, j) => {
    if (f.run !== undefined) return;
    const x = X(j);
    if (x + PITCH < cx || x > 1400) return;
    flat.push(<Cell key={j} src={src(f.img)} n={j} x={x} />);
  });
  const lx = X(STRIP.length);
  if (lx + LEADER > cx && lx < 1400) flat.push(<Leader key="leader" x={lx} />);
  RUNS.forEach((rn, k) => {
    const at = [b.all, b.all + 120, b.my][k]!;
    if (t >= at) return;
    const x = X(rn.j0);
    flat.push(
      <div key={`run${k}`} style={{ position: "absolute", left: x + 1.5 * cut, top: 0, width: rn.n * PITCH - 3 * cut, height: SH, overflow: "hidden",
        boxShadow: cut > 0 ? `inset 1.5px 0 0 rgba(255,255,255,${0.7 * cut}), inset -1.5px 0 0 rgba(255,255,255,${0.7 * cut})` : undefined }}>
        {Array.from({ length: rn.n }, (_, i) => <Cell key={i} src={src(STRIP[rn.j0 + i]!.img)} n={rn.j0 + i} x={i * PITCH - 1.5 * cut} />)}
      </div>,
    );
  });
  // the falling runs: gravity, a tumble toward the lens, vertical blur on the fast part
  const falls = RUNS.map((rn, k) => {
    const at = [b.all, b.all + 120, b.my][k]!;
    const tau = (t - at) / 1000;
    if (tau < 0 || tau > 0.9) return null;
    const x0 = CX0 + rn.j0 * PITCH - S_HALT + 1.5;
    const y = 0.5 * G * tau * tau, vy = G * tau;
    const rz = rn.sgn * (240 * tau * tau + 30 * tau), rx = 80 * tau, dx = rn.sgn * 110 * tau;
    const std = Math.min(12, vy * 0.0028);
    return (
      <div key={`fall${k}`} style={{ position: "absolute", left: x0 + dx, top: SY + y, width: rn.n * PITCH - 3, height: SH,
        transform: "translateZ(40px)", filter: std > 0.4 ? `url(#lvb${k})` : undefined, perspective: 900 }}>
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={`lvb${k}`} x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation={`0 ${std.toFixed(2)}`} /></filter>
        </svg>
        <div style={{ position: "absolute", inset: 0, transformOrigin: rn.sgn < 0 ? "85% 30%" : "15% 30%",
          transform: `rotateZ(${rz}deg) rotateX(${rx}deg)`, filter: "drop-shadow(0 16px 20px rgba(0,0,0,0.5))" }}>
          {Array.from({ length: rn.n }, (_, i) => <Cell key={i} src={src(STRIP[rn.j0 + i]!.img)} n={rn.j0 + i} x={i * PITCH} />)}
        </div>
      </div>
    );
  });

  const k = w / 1080;
  return (
    <>
    {data?.title && <Title {...props} data={data.title} />}
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 490, transform: `scale(${k})`, transformOrigin: "0 0", opacity: 1 - out }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="lhb" x="-5%" y="0%" width="110%" height="100%"><feGaussianBlur stdDeviation={`${blurX.toFixed(2)} 0`} /></filter>
      </svg>
      <div style={{ position: "absolute", inset: 0, perspective: 1500, perspectiveOrigin: `540px ${CY}px`, opacity: 1 - win(t, 2395, 2432) }}>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transformOrigin: `540px ${CY}px`,
          transform: `translateY(${dip}px) rotateX(-12deg)` }}>
          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d",
            opacity: splOp, transform: `translate3d(0, ${splY}px, -8px) rotateZ(${splRot}deg)`, transformOrigin: "540px 260px" }}>
            <Bed />
          </div>
          <Reel cx={cx} r={r} R={185} s={s} tipDeg={mix(-12 * glide, -78, tip)} lift={200 * tip} scale={reelScale}
            blur={Math.min(5, v * 0.0012)} roll={src("L-roll.jpg")} opacity={1} />
          <div style={{ position: "absolute", left: 0, top: SY, width: 1400, height: SH, filter: blurX > 0.4 ? "url(#lhb)" : undefined,
            clipPath: `inset(-40px 0 -40px ${cx}px)`, transform: "translateZ(0.5px)" }}>
            <div style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.45))" }}>{flat}</div>
          </div>
          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d",
            opacity: splOp, transform: `translate3d(0, ${splY}px, 6px) rotateZ(${splRot}deg)`, transformOrigin: "540px 260px" }}>
            <Blade tip={tipBlade} />
            <Housing />
          </div>
          {falls}
        </div>
        {/* the blade's strike: a hairline of light across the film for 80 ms */}
        <div style={{ position: "absolute", left: 536, top: SY - 10, width: 8, height: SH + 20, pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.95) 50%, rgba(255,255,255,0))",
          opacity: clamp(1 - Math.abs(t - ti - 15) / 60), filter: "blur(2px)" }} />
      </div>
      {t >= 2390 && (
        <Phone video={src("kf-finished-reel.mp4")} fps={fps} fromMs={2390} startSec={0.95}
          style={{ left: 540 - 146, top: -118, opacity: win(t, 2390, 2445),
            transform: `perspective(1200px) rotateX(${(1 - land) * 26}deg) translateY(${(1 - land) * 40}px) scale(${mix(1.14, 1, land) * (1 + 0.02 * win(t, 2530, toMs))})`,
            filter: land < 0.6 ? `blur(${(3 * (1 - land / 0.6)).toFixed(2)}px)` : undefined }} />
      )}
    </div>
    </>
  );
};

export const SPLICE_KINDS = { "kf-l-splice": Splice };
