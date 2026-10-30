import React from "react";
import { CY, SW, clamp, lerp, sp, type Bridge, type Rect } from "./A-util";
// reference edit K family A (2026-09-23): H1.3 the brand kit (four colours eyedropped off the SKIMS photo fly
// out of their pixel and line up beside it) and H1.4 the blank chat prompt that shakes "no" and drops.

export type Swatch = { hex: string; px: [number, number] }; // px = sample point in the source image (img w x h)
const JAKARTA = `"Plus Jakarta Sans", "Figtree", "Inter", -apple-system, sans-serif`;
const ink = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const l = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return l > 150 ? "#111" : "#fff";
};

// rect = where the photo is now, target = where it settles; the chips line up to the right of target
export const Swatches: React.FC<{ t: number; fps: number; start: number; sw: Swatch[]; rect: Rect; target: Rect;
  img: { w: number; h: number } }> = ({ t, fps, start, sw, rect: pr, target, img }) => {
  if (t < start) return null;
  // round 2 (calmer): one move, all four together, no overshoot. Each starts as a dot on the pixel it was
  // sampled from and grows into its square chip beside the photo.
  const fl = sp(t, start, fps, { damping: 34, stiffness: 300 });
  const sh = (target.h - 3 * SW.gap) / 4, sxT = target.x + target.w / 2 + 40 + SW.w / 2;
  return (
    <>
      {sw.map((s, k) => {
        const sx = pr.x - pr.w / 2 + (s.px[0] / img.w) * pr.w, sy = pr.y - pr.h / 2 + (s.px[1] / img.h) * pr.h;
        const tx = sxT, ty = target.y - target.h / 2 + sh / 2 + k * (sh + SW.gap);
        const f = clamp(fl);
        const x = lerp(sx, tx, f), y = lerp(sy, ty, f);
        const w = lerp(26, SW.w, f), h = lerp(26, sh, f);
        return (
          <div key={k} style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h,
            borderRadius: lerp(13, 0, clamp(f * 3)), background: s.hex, zIndex: 10,
            border: `${4 * (1 - clamp(f * 2))}px solid #fff`, boxSizing: "border-box",
            boxShadow: "0 12px 30px rgba(0,0,0,0.45)" }}>
            <div style={{ position: "absolute", left: 24, bottom: 18, fontFamily: JAKARTA, fontWeight: 700,
              fontSize: 30, letterSpacing: 0.5, color: ink(s.hex), opacity: clamp((f - 0.8) / 0.2) }}>
              {s.hex.toUpperCase()}
            </div>
          </div>
        );
      })}
    </>
  );
};

// one slide carries the kit out left and the prompt in from the right (a single move, no overshoot)
const slide = (t: number, fps: number, b: Bridge) => sp(t, b.and, fps, { damping: 28, stiffness: 190 });
export const kitTransform = (t: number, fps: number, b: Bridge) => {
  const push = 1 + 0.025 * clamp((t - b.own) / 600);
  const ex = slide(t, fps, b);
  return `translateX(${-1150 * ex}px) scale(${push})`;
};

export const Prompt: React.FC<{ t: number; fps: number; b: Bridge }> = ({ t, fps, b }) => {
  if (t < b.and) return null;
  const en = slide(t, fps, b);
  // one small "no" on BLANK (the box has settled by then)
  const ds = (t - b.blank) / 1000;
  const shake = ds > 0 && ds < 0.3 ? 18 * Math.sin((2 * Math.PI * ds) / 0.3) : 0;
  const e = clamp((t - (b.out - 150)) / 150), e2 = e * e;
  const blinkOn = Math.floor((t - b.and) / 500) % 2 === 0;
  const push = 1 + 0.025 * clamp((t - b.and) / (b.out - b.and));
  const W = 940, H = 260;
  return (
    <div style={{ position: "absolute", left: 540 - W / 2, top: CY + 50 - H / 2, width: W, height: H,
      transform: `translateX(${1150 * (1 - en) + shake}px) translateY(${160 * e2}px) scale(${push * (1 - 0.2 * e2)})`,
      opacity: 1 - clamp(e * 1.25), background: "#fff",
      boxShadow: "0 24px 60px rgba(0,0,0,0.5)", fontFamily: JAKARTA }}>
      <div style={{ position: "absolute", left: 44, top: 42, display: "flex", alignItems: "center",
        fontSize: 44, fontWeight: 600, color: "#a3a3a3" }}>
        <div style={{ width: 4, height: 50, background: "#111", marginRight: 6, opacity: blinkOn ? 1 : 0 }} />
        Ask anything
      </div>
      <div style={{ position: "absolute", left: 36, bottom: 30, width: 64, height: 64, borderRadius: 32,
        border: "3px solid #dedede", boxSizing: "border-box", color: "#777", fontSize: 42, fontWeight: 400,
        display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>+</div>
      <div style={{ position: "absolute", right: 36, bottom: 30, width: 64, height: 64, borderRadius: 32,
        background: "#e6e6e6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="30" height="30" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" stroke="#fff"
          strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  );
};
