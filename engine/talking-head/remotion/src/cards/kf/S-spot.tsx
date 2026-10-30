import React from "react";
import { Easing, Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { beat, box, clamp, hash, life, mix, pick, ramp } from "./S-util";
// V17 "spot" (builder S, 2026-09-25), and 39629 -> as 40767. A dark gallery wall (a square plate, so the pool of
// light reads over their light wall), a track spotlight above, and the white KEY FRAMES wordmark hung in the dark,
// only just visible. On "yours." the lamp clanks on: a tungsten flash that settles, a beam through the haze, a warm
// pool on the wall and a bloom round the letters. A slow push holds it to "as".

const WM_W = 700, WM_H = 150, WM_Y = 300;                  // wordmark (1400x300 source), its centre y
const LX = 540, LY = 76;                                   // the lamp's mouth

// the lamp: off, then a flash on the clank that settles to full
const lampI = (t: number, on: number) => {
  if (t < on) return 0;
  const up = clamp((t - on) / 45);
  return up * (1 + 0.22 * Math.exp(-(t - on - 45) / 110) * (t > on + 45 ? 1 : 0));
};

const Fixture: React.FC<{ I: number; kick: number }> = ({ I, kick }) => (
  <>
    {/* the track across the top of the wall */}
    <div style={{ position: "absolute", left: 120, top: 0, width: 840, height: 12, background: "linear-gradient(180deg, #2d2e32, #141416)",
      boxShadow: "0 3px 6px rgba(0,0,0,0.6)" }} />
    <div style={{ position: "absolute", left: LX - 26, top: 6, width: 52, height: 16, background: "linear-gradient(180deg, #3a3b40, #1c1d20)" }} />
    <div style={{ position: "absolute", left: LX - 5, top: 20, width: 10, height: 14, background: "#1f2023" }} />
    {/* the can, angled a touch forward, swinging a hair on the clank */}
    <div style={{ position: "absolute", left: LX - 42, top: 32, width: 84, height: 46, transformOrigin: "50% 0%", transform: `rotate(${kick}deg)` }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #121214 0%, #3b3c41 40%, #1a1b1e 100%)",
        clipPath: "polygon(12% 0, 88% 0, 100% 100%, 0 100%)" }} />
      <div style={{ position: "absolute", left: -3, top: 39, width: 90, height: 13, borderRadius: "50%",
        background: `rgba(255,${mix(120, 236, I)},${mix(80, 200, I)},${0.08 + 0.92 * clamp(I)})`,
        boxShadow: `0 0 ${40 * I}px ${14 * I}px rgba(255,220,170,${0.6 * clamp(I)})` }} />
    </div>
  </>
);

export const Spot: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fromMs, toMs, beats, assets }) => {
  const on = beat(beats, "yours", 40029);
  const wm = staticFile(pick(assets, "kf-wordmark.png"));
  const I = lampI(t, on), L = clamp(I);
  const kick = t < on ? 0 : 1.4 * Math.exp(-(t - on) / 120) * Math.sin((t - on) / 30);
  const push = 1 + 0.05 * ramp(t, on, toMs, Easing.inOut(Easing.quad));
  const dim = 0.2;                                          // the letters in the dark, before the light
  return (
    <div style={box(w, h)}>
      <div style={life(t, fromMs, toMs, 0, "50% 50%")}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: `50% ${(WM_Y / 614) * 100}%` }}>
        {/* the wall: charcoal plaster, a faint ambient, then the warm pool */}
        <div style={{ position: "absolute", inset: 0, background: "#0f0f11" }}>
          <svg width={1080} height={614} style={{ position: "absolute", inset: 0, opacity: 0.08 }}>
            <filter id="s-plaster"><feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves={3} seed={9} /><feColorMatrix type="saturate" values="0" /></filter>
            <rect width={1080} height={614} filter="url(#s-plaster)" />
          </svg>
          <div style={{ position: "absolute", inset: 0,
            background: `radial-gradient(ellipse 520px 330px at ${LX}px ${WM_Y + 10}px, rgba(255,226,180,${0.46 * I}) 0%, rgba(255,214,160,${0.2 * I}) 45%, rgba(255,200,140,0) 100%)` }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
        </div>
          {/* the beam through the haze */}
          <svg width={1080} height={614} style={{ position: "absolute", inset: 0, mixBlendMode: "screen", opacity: 0.8 * L }}>
            <defs>
              <linearGradient id="s-beam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgb(255,236,205)" stopOpacity={0.5} />
                <stop offset="0.6" stopColor="rgb(255,226,190)" stopOpacity={0.14} />
                <stop offset="1" stopColor="rgb(255,226,190)" stopOpacity={0.03} />
              </linearGradient>
              <filter id="s-beam-b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14" /></filter>
            </defs>
            <polygon points={`${LX - 26},${LY + 8} ${LX + 26},${LY + 8} ${LX + 440},614 ${LX - 440},614`} fill="url(#s-beam)" filter="url(#s-beam-b)" />
          </svg>
          {/* dust hanging in the cone */}
          {L > 0 && Array.from({ length: 30 }, (_, k) => {
            const y0 = 70 + hash(k * 7) * 520, drift = 8 + hash(k * 3) * 14;
            const y = 70 + ((y0 - 70 + ((t - on) / 1000) * drift) % 520);
            const half = 26 + ((y - LY) / (614 - LY)) * 420;
            const x = LX + (hash(k * 13) - 0.5) * 1.7 * half + Math.sin(t / 800 + k) * 5;
            return <div key={k} style={{ position: "absolute", left: x, top: y, width: 2.5, height: 2.5, borderRadius: 2,
              background: "rgba(255,240,215,0.9)", opacity: L * (0.15 + 0.45 * hash(k * 5)) }} />;
          })}
          {/* the wordmark: its shadow on the wall (hung off it a little), the letters, and their bloom */}
          <Img src={wm} style={{ position: "absolute", left: LX - WM_W / 2 + 4, top: WM_Y - WM_H / 2 + 14, width: WM_W, height: WM_H,
            filter: "brightness(0) blur(6px)", opacity: 0.55 * L }} />
          <Img src={wm} style={{ position: "absolute", left: LX - WM_W / 2, top: WM_Y - WM_H / 2, width: WM_W, height: WM_H,
            filter: `brightness(${mix(dim, 1, Math.min(1.1, I))}) sepia(${0.22 * L})` }} />
          <Img src={wm} style={{ position: "absolute", left: LX - WM_W / 2, top: WM_Y - WM_H / 2, width: WM_W, height: WM_H, mixBlendMode: "screen",
            filter: `blur(${mix(22, 14, L)}px) sepia(0.6) brightness(${1 + 0.4 * Math.max(0, I - 1) * 4})`, opacity: 0.75 * L }} />
          <Fixture I={I} kick={kick} />
        </div>
      </div>
    </div>
  );
};
