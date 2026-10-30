import React from "react";
import { Easing, Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { CARD, ClipCard, Body, LAND, RemapVideo, SANS, calm, clamp, fall, mix, pick, ramp, bump, type Pose } from "./N-kit";
// V4 (7500 → 8600) "Once I filmed something,": the iPhone Camera app in video mode on their own frame (N-take.mp4,
// source 15.633 s, the words the creator is saying). Lands already recording (red timer pill, red square in the shutter).
// On FILMED the timer races to 00:01:29 (the real raw take: 88.9 s). On SOMETHING the shutter stops (square →
// circle), and the frame lifts off the viewfinder as a physical clip card ("1:29"), falling with gravity into the
// lower right corner, landing soft. The card's pose is exported: V5 picks it up from exactly there.

export const PHONE = { x: 282, y: 7, w: 277, h: 600 };
const SCR = { x: PHONE.x + 8, y: PHONE.y + 8, w: PHONE.w - 16, h: PHONE.h - 16 };
export const VF = { x: SCR.x, y: SCR.y + 64, w: SCR.w, h: (SCR.w * 16) / 9 };
const VFC = { x: VF.x + VF.w / 2, y: VF.y + VF.h / 2 };

// the clip card's pose at spine ms t (null while it is still the viewfinder)
export const clipPose = (t: number, stop: number): (Pose & { dur: number }) | null => {
  const a = stop + 40, b = a + 70, c = b + 230; // lift, fall, land (8643)
  if (t < a) return null;
  if (t < b) {
    const k = ramp(t, a, b, Easing.out(Easing.cubic));
    return { x: VFC.x, y: VFC.y - 6 * k, w: VF.w * (1 + 0.04 * k), h: VF.h * (1 + 0.04 * k), rot: -1.5 * k, lift: 0.7 * k, dur: 0 };
  }
  const gx = ramp(t, b, c, Easing.out(Easing.quad)), gy = fall(t, b, c), g = ramp(t, b, c, Easing.inOut(Easing.quad));
  const sq = bump(t, c, 100);
  const w = mix(VF.w * 1.04, CARD.w, g), h = mix(VF.h * 1.04, CARD.h, g);
  // speed of the fall (for a touch of blur only on the fastest frames)
  const v = t > b && t < c ? Math.abs(fall(t + 17, b, c) - gy) * (LAND.y - VFC.y) : 0;
  return {
    x: mix(VFC.x, LAND.x, gx), y: mix(VFC.y - 6, LAND.y, gy) + 3 * sq,
    w: w * (1 + 0.025 * sq), h: h * (1 - 0.03 * sq), rot: mix(-1.5, LAND.rot, g) + (t < c ? -3 * Math.sin(g * Math.PI) : 0),
    lift: mix(0.7, 0, gy), blur: clamp((v - 9) / 10) * 1.4, dur: ramp(t, b + 100, c),
  };
};

const pad2 = (n: number) => String(Math.floor(n)).padStart(2, "0");
const clock = (s: number) => `00:${pad2(s / 60)}:${pad2(s % 60)}`;

const Bolt = () => (
  <svg width="26" height="26" viewBox="0 0 26 26"><circle cx="13" cy="13" r="12" fill="rgba(0,0,0,0.35)" />
    <path d="M14.5 5L8 14h4.5L11 21l7-9.5h-4.6z" fill="#fff" /><path d="M6 6l14 14" stroke="#fff" strokeWidth="1.6" /></svg>
);

const Screen: React.FC<{ t: number; fps: number; b: Record<string, number>; take: string; thumb: string }> = ({ t, fps, b, take, thumb }) => {
  const filmed = b.filmed ?? 7883, stop = b.something ?? 8303;
  const race = ramp(t, filmed, filmed + 400, Easing.inOut(Easing.quad));
  const secs = t < filmed ? 2 + (t - 7500) / 1000 : mix(2 + (filmed - 7500) / 1000, 89, race);
  const speed = t > filmed && t < filmed + 400 ? Math.abs(ramp(t + 33, filmed, filmed + 400, Easing.inOut(Easing.quad)) - race) * 87 : 0;
  const off = calm(t, stop, fps); // recording → stopped
  const inner = mix(24, 50, off), rad = mix(6, 25, off);
  const land = stop + 120;
  const th = calm(t, land, fps);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", fontFamily: SANS }}>
      {/* viewfinder: their live frame; a beat of white flash as the take is saved */}
      <div style={{ position: "absolute", left: 0, top: 64, width: SCR.w, height: VF.h, overflow: "hidden" }}>
        <RemapVideo tMs={t} fps={fps} src={take} segs={[{ t0: 7500, t1: 8700, s0: 0, s1: 1.2 }]}
          style={{ position: "absolute", left: 0, top: 0, width: SCR.w, height: VF.h, objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: 0.35 * Math.max(0, 1 - Math.abs(t - stop - 40) / 90) }} />
        {/* zoom pills */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", justifyContent: "center", gap: 8 }}>
          {[".5", "1×", "2"].map((z) => (
            <div key={z} style={{ width: z === "1×" ? 34 : 28, height: z === "1×" ? 34 : 28, borderRadius: "50%", background: "rgba(0,0,0,0.42)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: z === "1×" ? 13 : 11, fontWeight: 700, color: z === "1×" ? "#FFD60A" : "#fff" }}>{z}</div>
          ))}
        </div>
      </div>
      {/* dynamic island */}
      <div style={{ position: "absolute", left: SCR.w / 2 - 42, top: 9, width: 84, height: 24, borderRadius: 12, background: "#000", boxShadow: "0 0 0 1px #111" }} />
      {/* top row: flash, timer, format chips */}
      <div style={{ position: "absolute", left: 14, top: 36 }}><Bolt /></div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 36, display: "flex", justifyContent: "center" }}>
        <div style={{ padding: "2px 8px", borderRadius: 6, background: `rgba(255,59,48,${1 - off})`, fontSize: 17, fontWeight: 600, color: "#fff",
          fontVariantNumeric: "tabular-nums", letterSpacing: 0.3, filter: speed > 0.4 ? `blur(${Math.min(1.6, speed * 0.6)}px)` : undefined }}>{clock(secs)}</div>
      </div>
      <div style={{ position: "absolute", right: 7, top: 39, display: "flex", gap: 3 }}>
        {["1080p", "60"].map((c) => (
          <div key={c} style={{ padding: "1px 4px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.55)", fontSize: 9.5, fontWeight: 700, color: "#fff" }}>{c}</div>
        ))}
      </div>
      {/* bottom: last-clip thumbnail (appears when the take is saved), shutter, photo / flip button */}
      <div style={{ position: "absolute", left: 22, bottom: 12, width: 38, height: 38, borderRadius: 7, overflow: "hidden", opacity: th,
        transform: `scale(${0.6 + 0.4 * th})`, border: "1.5px solid rgba(255,255,255,0.8)" }}>
        <Img src={staticFile(thumb)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: SCR.w / 2 - 31, bottom: 3, width: 62, height: 62, borderRadius: "50%", border: "4px solid #fff", boxSizing: "border-box",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: inner, height: inner, borderRadius: rad, background: "#FF3B30" }} />
      </div>
      <div style={{ position: "absolute", right: 24, bottom: 14, width: 34, height: 34, borderRadius: "50%", background: `rgba(255,255,255,${0.95 * (1 - off)})`,
        border: off > 0 ? `1.5px solid rgba(255,255,255,${off * 0.8})` : undefined, boxSizing: "border-box" }} />
    </div>
  );
};

export const Camera: React.FC<CardProps & { data: any }> = ({ tMs: t, fps, fromMs, toMs, beats, assets }) => {
  const take = pick(assets, "N-take.mp4"), thumb = pick(assets, "N-thumb.jpg");
  const stop = beats.something ?? 8303;
  const e = calm(t, fromMs - 60, fps);
  const phoneOut = ramp(t, toMs - 150, toMs, Easing.in(Easing.cubic));
  const push = 1 + 0.015 * ramp(t, fromMs, toMs, Easing.linear);
  const pose = clipPose(t, stop);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: PHONE.x, top: PHONE.y, width: PHONE.w, height: PHONE.h, opacity: Math.min(1, e * 1.6) * (1 - phoneOut),
        transformOrigin: "50% 60%", transform: `translateY(${(1 - e) * 36 + 16 * phoneOut}px) scale(${(0.97 + 0.03 * e) * push * (1 - 0.03 * phoneOut)})` }}>
        {/* the device: titanium edge, black bezel */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 46, background: "linear-gradient(135deg,#6B6B70,#2B2B2E 40%,#4A4A4E 70%,#1E1E20)",
          boxShadow: "0 30px 60px rgba(0,0,0,0.55), 0 10px 20px rgba(0,0,0,0.35)" }} />
        <div style={{ position: "absolute", inset: 3, borderRadius: 43, background: "#050505" }} />
        <div style={{ position: "absolute", left: 8, top: 8, width: SCR.w, height: SCR.h, borderRadius: 38, overflow: "hidden" }}>
          <Screen t={t} fps={fps} b={beats} take={take} thumb={thumb} />
        </div>
      </div>
      {pose && (
        <Body p={pose}><ClipCard thumb={thumb} w={pose.w} h={pose.h} dur={pose.dur} /></Body>
      )}
    </div>
  );
};
