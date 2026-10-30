import React from "react";
import { Easing, OffthreadVideo, Sequence, spring, staticFile } from "remotion";
// reference edit K (Holo) family C: the small helpers every C card shares. All pure functions of tMs.

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Cfg = { damping: number; stiffness: number; mass: number };
export const SNAP: Cfg = { damping: 11, stiffness: 190, mass: 0.8 }; // lands with a visible overshoot
export const SOFT: Cfg = { damping: 18, stiffness: 120, mass: 0.9 };

// a spring that starts at spine ms `at` (0 before it)
export const sp = (tMs: number, at: number, fps: number, cfg: Cfg = SNAP) =>
  tMs < at ? 0 : spring({ frame: ((tMs - at) / 1000) * fps, fps, config: cfg });

// an eased 0..1 between two spine ms
export const ramp = (tMs: number, a: number, b: number, ease: (x: number) => number = Easing.out(Easing.cubic)) =>
  ease(clamp((tMs - a) / (b - a)));

// the fast exit of a card's last `dur` ms (0 → 1)
export const exitK = (tMs: number, toMs: number, dur = 150) => ramp(tMs, toMs - dur, toMs, Easing.in(Easing.cubic));

// the slow living push of a hold, 1.00 → 1+amt across the event
export const push = (tMs: number, fromMs: number, toMs: number, amt = 0.05) => 1 + amt * clamp((tMs - fromMs) / (toMs - fromMs));

// a deterministic float for holds (no Math.random)
export const wave = (tMs: number, periodMs: number, phase = 0) => Math.sin((tMs / periodMs) * Math.PI * 2 + phase);

export const asset = (assets: string[], name: string) => assets.find((a) => a.endsWith(name)) ?? name;

// creatives float frameless with a strong soft shadow; white UI gets the same shadow on its own ground
// v3: a short shadow (reaches ~40 px below an object) so every card keeps its shadow inside its own box
export const SHADOW = "0 12px 28px rgba(0,0,0,0.5), 0 3px 8px rgba(0,0,0,0.35)";

// a real clip that starts playing at spine ms `startMs`, from `fromSec` into the source
export const Clip: React.FC<{
  src: string; startMs: number; fromSec: number; fps: number; rate?: number; style?: React.CSSProperties;
}> = ({ src, startMs, fromSec, fps, rate = 1, style }) => (
  <Sequence from={Math.ceil((startMs / 1000) * fps)} layout="none">
    <OffthreadVideo src={staticFile(src)} muted playbackRate={rate} startFrom={Math.round(fromSec * fps)}
      style={{ position: "absolute", ...style }} />
  </Sequence>
);

// an iPhone-like black body around a screen (children fill the screen)
export const Phone: React.FC<{ w: number; h: number; children: React.ReactNode }> = ({ w, h, children }) => {
  const bz = Math.round(w * 0.036);
  return (
    <div style={{ position: "absolute", inset: 0, width: w, height: h, borderRadius: w * 0.16, background: "#0b0b0d",
      boxShadow: `${SHADOW}, inset 0 0 0 2px #2a2a2e` }}>
      <div style={{ position: "absolute", left: bz, top: bz, right: bz, bottom: bz, borderRadius: w * 0.13, overflow: "hidden", background: "#111" }}>
        {children}
        <div style={{ position: "absolute", left: "50%", top: w * 0.035, transform: "translateX(-50%)", width: w * 0.3, height: w * 0.085,
          borderRadius: 99, background: "#000" }} />
      </div>
    </div>
  );
};
