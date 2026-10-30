import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { BH, BW, SANS, calm, clamp, exitOf, hash, lerp, pick } from "./Q-util";
// keyframes-v1 V7 (builder Q, 2026-09-25) "And there's no subscription needed.", 14813 -> 15967.
// The Keyframes buy block as it stands on getkeyframes.com (dark card, the store's box art, the white wordmark,
// "One-time, download instantly", the red "Add to cart", "Files arrive the moment you pay"; no price), caught
// in a heavy ring that loops round it like a subscription, "EVERY MONTH" travelling on its band, the back half
// behind the block, the front half across it. On NO the ring cracks at one point (a few chips spit out) and
// drops away under gravity with motion blur; the block, freed of its weight, lifts a few px and settles; on
// SUBSCRIPTION "One-time" lights green. Held to the 150 ms exit at 15967.

type B = { and: number; no: number; subscription: number; needed: number };
const DB: B = { and: 14813, no: 15173, subscription: 15273, needed: 15633 };

const X0 = 120, Y0 = 122, W0 = 840, H0 = 370; // the block
const RX = 488, RY = 205, RCX = BW / 2, RCY = 312, TILT = -5, BAND = 34;
const SPEED = 170; // px/s of the band's travel
const G = 11000; // px/s^2
const PERIM = Math.PI * (3 * (RX + RY) - Math.sqrt((3 * RX + RY) * (RX + 3 * RY)));
// crack on the front band, to the right of centre
const PHI_C = 0.95; // on the front band, over the card's dark lower right (clear of the button) // ellipse angle (y down: sin>0 = front)

// the ellipse travelled front left -> right, then back right -> left, twice (so labels never run off the end)
const loopPath = (() => {
  const pts: string[] = [];
  const N = 360;
  for (let k = 0; k <= 2 * N; k++) {
    const phi = Math.PI - (k / N) * 2 * Math.PI;
    pts.push(`${(RX * Math.cos(phi)).toFixed(2)},${(RY * Math.sin(phi)).toFixed(2)}`);
  }
  return `M${pts.join(" L")}`;
})();
// the band as an arc that leaves out `gap` radians either side of the crack
const bandArc = (gap: number) => {
  const pts: string[] = [];
  const N = 240, a0 = PHI_C + gap, a1 = PHI_C + 2 * Math.PI - gap;
  for (let k = 0; k <= N; k++) {
    const phi = a0 + ((a1 - a0) * k) / N;
    pts.push(`${(RX * Math.cos(phi)).toFixed(2)},${(RY * Math.sin(phi)).toFixed(2)}`);
  }
  return `M${pts.join(" L")}`;
};

const Ring: React.FC<{ t: number; b: B; half: "back" | "front"; id: string }> = ({ t, b, half, id }) => {
  const crack = t >= b.no;
  const dt = Math.max(0, (t - (b.no + 60)) / 1000);
  const fall = 0.5 * G * dt * dt;
  const rot = TILT + 16 * clamp(dt / 0.32) * clamp(dt / 0.32);
  const gap = crack ? 0.03 + 0.2 * Math.sqrt(clamp((t - b.no) / 220)) : 0;
  const travel = (Math.min(t, b.no) - b.and) / 1000 * SPEED + 40;
  const vel = G * dt; // px/s
  const vblur = Math.min(4, (vel / 30) * 0.15);
  const clipY = half === "front" ? 0 : -400;
  const ops = half === "front" ? 1 : 0.55;
  const gone = RCY + fall - RY > BH + 40;
  if (gone) return null;
  const labels = [0, 1, 2, 3].map((k) => ((k * PERIM) / 4 + travel) % PERIM);
  const cx = RX * Math.cos(PHI_C), cy = RY * Math.sin(PHI_C);
  return (
    <svg width={BW} height={BH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <clipPath id={`${id}-c`} clipPathUnits="userSpaceOnUse"><rect x={-800} y={clipY} width={1600} height={400} /></clipPath>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-800} y={-400} width={1600} height={800}>
          <rect x={-800} y={-400} width={1600} height={800} fill="#fff" />
          {crack && <circle cx={cx} cy={cy} r={8 + 70 * gap} fill="#000" />}
        </mask>
        <linearGradient id={`${id}-g`} x1="0" y1="-1" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#3A3A42" /><stop offset="0.5" stopColor="#222227" /><stop offset="1" stopColor="#141417" />
        </linearGradient>
        {vblur > 0.5 && <filter id={`${id}-b`} x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation={`0 ${vblur}`} /></filter>}
      </defs>
      <g transform={`translate(${RCX} ${RCY + fall}) rotate(${rot})`} filter={vblur > 0.5 ? `url(#${id}-b)` : undefined}
        opacity={ops * (1 - clamp((fall - 260) / 160))}>
        <g clipPath={`url(#${id}-c)`}>
          <path d={bandArc(gap)} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={BAND + 10} transform="translate(0 10)" />
          <path d={bandArc(gap)} fill="none" stroke="#26262B" strokeWidth={BAND} />
          <path d={bandArc(gap)} fill="none" stroke="#5C5C66" strokeWidth={1.5} transform={`translate(0 ${-BAND / 2 + 1})`} />
          <path d={bandArc(gap)} fill="none" stroke="#0E0E10" strokeWidth={1.5} transform={`translate(0 ${BAND / 2 - 1})`} />
          <g mask={`url(#${id}-m)`}>
            <path id={`${id}-p`} d={loopPath} fill="none" stroke="none" />
            {labels.map((o, k) => (
              <text key={k} dy={6} style={{ fontFamily: SANS, fontWeight: 700, fontSize: 17, letterSpacing: 3 }} fill="#F1F1F3">
                <textPath href={`#${id}-p`} startOffset={o}>EVERY MONTH  ›  ›  ›</textPath>
              </text>
            ))}
          </g>
        </g>
        {half === "front" && crack && <Chips t={t} b={b} x={cx} y={cy} />}
      </g>
    </svg>
  );
};

// the chips that spit out of the crack, thrown and pulled down (drawn in the ring's space, so they fall with it
// only a little: each gets its own throw)
const Chips: React.FC<{ t: number; b: B; x: number; y: number }> = ({ t, b, x, y }) => {
  const s = (t - b.no) / 1000;
  if (s > 0.45) return null;
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => {
        const ang = -Math.PI / 2 + (hash(i + 3) - 0.5) * 2.4, v = 380 + 420 * hash(i + 11);
        const px = x + Math.cos(ang) * v * s, py = y + Math.sin(ang) * v * s + 0.5 * 2600 * s * s;
        const sz = 7 + 9 * hash(i + 21), r = 900 * s * (hash(i) - 0.5);
        return <rect key={i} x={px - sz / 2} y={py - sz / 2} width={sz} height={sz * 0.7} fill={i % 2 ? "#5C5C66" : "#34343B"}
          transform={`rotate(${r} ${px} ${py})`} opacity={1 - clamp((s - 0.3) / 0.15)} />;
      })}
      {s < 0.1 && <circle cx={x} cy={y} r={6 + 90 * s} fill="rgba(255,255,255,0.9)" opacity={1 - s / 0.1} />}
    </>
  );
};

const Check: React.FC<{ color: string }> = ({ color }) => (
  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></svg>
);

export const BuyBlock: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, fromMs, toMs, beats, assets }) => {
  const b: B = { ...DB, ...(beats as Partial<B>) };
  const t = tMs;
  const inn = calm(t, fromMs, fps, 200);
  const lift = -6 * Math.sin(Math.PI * clamp((t - (b.no + 140)) / 520)); // freed of the ring's weight
  const lit = calm(t, b.subscription, fps, 220);
  const ink = `rgb(${lerp(221, 74, lit)},${lerp(221, 222, lit)},${lerp(221, 128, lit)})`;
  const ex = exitOf(t, toMs);
  const push = 1 + 0.02 * clamp((t - fromMs) / (toMs - fromMs));
  const blockY = Y0 + 22 * (1 - inn) + lift;
  return (
    <div style={{ position: "absolute", left: (w - BW) / 2, top: (h - BH) / 2, width: BW, height: BH, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: ex.opacity, transform: `scale(${push * ex.scale * lerp(0.97, 1, inn)})`, transformOrigin: "50% 50%" }}>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${22 * (1 - inn) + lift}px)` }}>
          <Ring t={t} b={b} half="back" id="qbuy-back" />
        </div>
        <div style={{ position: "absolute", left: X0, top: blockY, width: W0, height: H0, background: "#121214",
          border: "1px solid #2A2A2F", boxSizing: "border-box", display: "flex",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 12px 24px rgba(0,0,0,0.4)" }}>
          <div style={{ width: 430, height: H0 - 2, overflow: "hidden", background: "#000", flexShrink: 0 }}>
            <Img src={staticFile(pick(assets, "Q-bundle.jpg"))} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "50% 50%" }} />
          </div>
          <div style={{ flex: 1, padding: "34px 32px 0 34px", display: "flex", flexDirection: "column", fontFamily: SANS }}>
            <Img src={staticFile(pick(assets, "kf-wordmark.png"))} style={{ width: 290, height: 290 * 300 / 1400, objectFit: "contain", objectPosition: "0 50%" }} />
            <div style={{ marginTop: 16, fontSize: 21, lineHeight: "29px", color: "#9A9AA0" }}>Drop the clip in and say the command.</div>
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 9, fontSize: 23, color: "#DDDDDD", whiteSpace: "nowrap" }}>
              <div style={{ filter: lit > 0.02 ? `drop-shadow(0 0 ${10 * lit}px rgba(74,222,128,${0.7 * lit}))` : undefined }}><Check color={ink} /></div>
              <span><span style={{ color: ink, fontWeight: lerp(400, 700, lit) > 550 ? 700 : 400,
                textShadow: lit > 0.02 ? `0 0 ${16 * lit}px rgba(74,222,128,${0.6 * lit})` : undefined }}>One-time</span>, download instantly</span>
            </div>
            <div style={{ marginTop: 26, height: 60, background: "#D43939", borderRadius: 8, display: "flex", alignItems: "center",
              justifyContent: "center", fontWeight: 600, fontSize: 22, color: "#fff" }}>Add to cart</div>
            <div style={{ marginTop: 14, fontSize: 17, color: "#67737C" }}>Files arrive the moment you pay</div>
          </div>
        </div>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${22 * (1 - inn) + lift}px)` }}>
          <Ring t={t} b={b} half="front" id="qbuy-front" />
        </div>
      </div>
    </div>
  );
};
