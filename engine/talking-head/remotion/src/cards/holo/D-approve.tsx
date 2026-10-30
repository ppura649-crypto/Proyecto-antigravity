import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { GREEN, PHOTO_SHADOW, calm, clamp, easeIn, easeInOut, lerp, win } from "./D-kit";
// B17 "You can approve what goes out": three real creatives dealt as a stack, big.
// v2 (law 1, a 1.3 s window): on APPROVE the top one gets a green check and is swiped up and out;
// the next one slides forward already being approved (its check lands as it arrives). Everything is
// done ~0.7 s before the hand-over, and the final state (approved creative on top, one waiting
// behind) holds with a slow push.

type Data = { aspects: number[]; check1: number; fly: [number, number]; check2: number };

const Check: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ opacity: clamp(s * 3), position: "absolute", right: -40, top: -40, width: 136, height: 136, borderRadius: 68,
    background: GREEN, transform: `scale(${lerp(0.6, 1, s)})`, boxShadow: "0 10px 30px rgba(0,0,0,0.45)", display: "flex",
    alignItems: "center", justifyContent: "center", border: "6px solid #fff" }}>
    <svg width="74" height="74" viewBox="0 0 24 24"><path d="M4.5 12.5l5 5L19.5 7" fill="none" stroke="#fff" strokeWidth="3.4"
      strokeLinecap="round" strokeLinejoin="round" /></svg>
  </div>
);

const SLOT = [
  { s: 1, y: 0, r: 0, x: 0 },
  { s: 0.92, y: -24, r: 3, x: 90 },
  { s: 0.84, y: -44, r: -3, x: -90 },
];

export const HoloApprove: React.FC<CardProps & { data: Data }> = ({ tMs, w, h, fromMs, toMs, assets, data }) => {
  const TOP = 56;                 // room above for the back cards and the check badge
  const H = h - TOP - 10;
  const [f0, f1] = data.fly;
  const adv = easeInOut(win(tMs, f0, f1));       // card 1 -> slot 0, card 2 -> slot 1
  const x = easeIn(win(tMs, toMs - 100, toMs));
  const push = 1 + 0.02 * clamp((tMs - fromMs) / Math.max(1, toMs - fromMs));
  const checks = [calm(tMs, data.check1, 140), calm(tMs, data.check2, 130), 0];
  const cards = [2, 1, 0].map((i) => {
    const deal = calm(tMs, fromMs + (2 - i) * 50, 280);
    const pos = clamp(i - adv, 0, 2);
    const lo = Math.floor(pos), hi = Math.min(2, lo + 1), f = pos - lo;
    const sl = { s: lerp(SLOT[lo].s, SLOT[hi].s, f), y: lerp(SLOT[lo].y, SLOT[hi].y, f),
      r: lerp(SLOT[lo].r, SLOT[hi].r, f), x: lerp(SLOT[lo].x, SLOT[hi].x, f) };
    const fly = i === 0 ? easeIn(win(tMs, f0, f1)) : 0;
    const chk = checks[i];
    const cw = H * data.aspects[i];
    const tr = `translateX(${sl.x + fly * 80}px) translateY(${(1 - deal) * 70 + sl.y - fly * 640}px)`
      + ` rotate(${sl.r + fly * 7}deg) scale(${sl.s})`;
    return (
      <div key={i} style={{ position: "absolute", left: (w - cw) / 2, top: TOP, width: cw, height: H, transform: tr,
        transformOrigin: "50% 100%", zIndex: 10 - i, opacity: clamp(deal * 1.5) * (1 - clamp((fly - 0.3) / 0.6)) }}>
        <Img src={staticFile(assets[i])} style={{ width: cw, height: H, objectFit: "cover", borderRadius: 0, boxShadow: PHOTO_SHADOW,
          outline: chk > 0.02 ? `${8 * clamp(chk)}px solid ${GREEN}` : "none" }} />
        {chk > 0.001 && <Check s={chk} />}
      </div>
    );
  });
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${x * -40}px) scale(${push})`, opacity: 1 - x }}>
      {cards}
    </div>
  );
};
