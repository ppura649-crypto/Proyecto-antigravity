import React from "react";
import { OffthreadVideo, Sequence, spring, staticFile } from "remotion";
import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
// keyframes-v1 family R (2026-09-25): shared helpers. Every card is a pure function of the spine clock.
// Card = 1080 x 614 (LOW band 0.60 -> 0.92).
loadSora("normal", { weights: ["700"], subsets: ["latin"] });

export const CW = 1080, CH = 614;
export const SORA = `"Sora", "Plus Jakarta Sans", -apple-system, sans-serif`;
export const UI = `-apple-system, "SF Pro Text", "Inter", "Helvetica Neue", sans-serif`;
export const GREEN = "#4ADE80";
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (x: number) => { const t = clamp(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeIn = (x: number) => { const t = clamp(x); return t * t * t; };
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export type SpringCfg = { damping: number; stiffness: number; mass?: number };
export const sp = (t: number, at: number, fps: number, config: SpringCfg) =>
  t < at ? 0 : spring({ frame: ((t - at) / 1000) * fps, fps, config: { mass: 1, ...config } });
export const pick = (assets: string[], name: string) => assets.find((a) => a.endsWith(name)) ?? name;
export const CALM = { damping: 30, stiffness: 240 }; // ~450 ms, no overshoot
export const GLIDE = { damping: 28, stiffness: 150 }; // ~650 ms, no overshoot
export const HEAVY = { damping: 26, stiffness: 210, mass: 1.25 }; // a weighty landing, a hair of settle

// the clean hand-over at the card's end: 150 ms, a small step back and gone
export const exitOf = (t: number, toMs: number) => {
  const e = easeIn(clamp((t - (toMs - 150)) / 150));
  return { opacity: 1 - e, scale: 1 - 0.05 * e, blur: 6 * e };
};

// a real clip that starts playing at spine ms `startMs`, from `fromSec` into the source
export const Clip: React.FC<{ src: string; startMs: number; fromSec?: number; fps: number; style?: React.CSSProperties }> = (
  { src, startMs, fromSec = 0, fps, style }) => (
  <Sequence from={Math.ceil((startMs / 1000) * fps)} layout="none">
    <OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(fromSec * fps)}
      style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", ...style }} />
  </Sequence>
);

// a directional (1-axis) gaussian blur, for the fast passes only
export const BlurDef: React.FC<{ id: string; x: number; y: number }> = ({ id, x, y }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id={id} x="-10%" y="-30%" width="120%" height="160%">
      <feGaussianBlur stdDeviation={`${x.toFixed(2)} ${y.toFixed(2)}`} />
    </filter>
  </svg>
);

// a phone body around a screen: keeps the device shape (rounded), thin bezel
export const PhoneBody: React.FC<{ w: number; h: number; bezel?: number; shadow?: string; children: React.ReactNode }> = (
  { w, h, bezel = 1, shadow, children }) => {
  const bz = Math.max(0, w * 0.034 * bezel);
  const r = w * 0.15;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, borderRadius: r * bezel + 4 * (1 - bezel),
      background: "#0a0a0c", boxShadow: `${shadow ?? ""}${shadow ? ", " : ""}inset 0 0 0 ${2 * bezel}px #34343a` }}>
      <div style={{ position: "absolute", left: bz, top: bz, right: bz, bottom: bz, overflow: "hidden", background: "#111",
        borderRadius: (r - bz) * bezel + 3 * (1 - bezel) }}>
        {children}
        {bezel > 0.2 && (
          <div style={{ position: "absolute", left: "50%", top: w * 0.03, transform: "translateX(-50%)", width: w * 0.3,
            height: w * 0.085, borderRadius: 99, background: "#000", opacity: clamp((bezel - 0.2) / 0.5) }} />
        )}
      </div>
    </div>
  );
};

// a shadow that belongs to an object `lift` above the ground (0 = resting, 1 = high)
export const liftShadow = (lift: number) =>
  `0 ${lerp(6, 46, lift).toFixed(1)}px ${lerp(14, 80, lift).toFixed(1)}px rgba(0,0,0,${lerp(0.42, 0.62, lift).toFixed(2)}), ` +
  `0 ${lerp(2, 10, lift).toFixed(1)}px ${lerp(5, 18, lift).toFixed(1)}px rgba(0,0,0,${lerp(0.35, 0.2, lift).toFixed(2)})`;
