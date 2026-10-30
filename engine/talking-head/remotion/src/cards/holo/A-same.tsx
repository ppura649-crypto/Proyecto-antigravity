import React from "react";
import { Img, staticFile } from "remotion";
import { Prompt, Swatches, kitTransform, type Swatch } from "./A-kit";
import { CX, CY, clamp, lerp, pick, sp, type Rect } from "./A-util";
// reference edit K family A, hook 2 (2026-09-24): "AI marketing looks all the same. Here is how to not blend in."
// Eight real Holo ads (SKIMS, Crocs) already washed toward one beige template on frame 0; on SAME the
// last colour drains; on NOT the Crocs "Come As You Are" comes back and steps forward; on BLEND the
// others colour back in a ripple; on IN the grid clears leaving Crocs; then the bridge (Crocs kit,
// blank prompt) exactly as hook 1.

export const B2 = {
  marketing: 357, same: 1377, not: 2304, blend: 2424, in: 2784,
  own: 4404, brand: 4524, and: 5000, not2: 5130, blank: 5490, prompt: 5730, out: 6167,
};
const TILES: { f: string; pos: string }[] = [
  { f: "skims-3754927.jpg", pos: "50% 100%" }, { f: "crocs-5139667.jpg", pos: "50% 50%" },
  { f: "skims-3754970.jpg", pos: "50% 100%" }, { f: "crocs-5139703.jpg", pos: "50% 50%" },
  { f: "crocs-5139685.jpg", pos: "50% 50%" }, { f: "skims-3754962.jpg", pos: "50% 0%" },
  { f: "crocs-5139682.jpg", pos: "50% 50%" }, { f: "skims-3754932.jpg", pos: "50% 100%" },
];
const HERO = 1, TW = 250, TH = 312, GX = 264, GY = 326;
const CALM = { damping: 26, stiffness: 150 };
const HERO_R: Rect = { x: CX, y: CY, w: 480, h: 600 };
export const KIT2: Rect = { x: 340, y: CY, w: 518.4, h: 648 };
const OWN = { damping: 32, stiffness: 260 };

// the one beige template every ad is being washed into (same layout on every tile)
const Template: React.FC<{ a: number }> = ({ a }) => (
  <div style={{ position: "absolute", inset: 0, opacity: a,
    background: "linear-gradient(170deg,#efe7dc,#dccab3)" }}>
    <div style={{ position: "absolute", left: "12%", top: "9%", width: "70%", height: 16, background: "#c3b29c" }} />
    <div style={{ position: "absolute", left: "12%", top: "16%", width: "48%", height: 16, background: "#c3b29c" }} />
    <div style={{ position: "absolute", left: "22%", top: "30%", width: "56%", height: "42%", background: "#cdbca5" }} />
    <div style={{ position: "absolute", left: "30%", bottom: "9%", width: "40%", height: 22, background: "#b9a58c" }} />
  </div>
);

const hueOf = (i: number, t: number, fps: number) => {
  const c = i % 4, r = Math.floor(i / 4), d = Math.hypot(c - 1, r);
  const drain = clamp((t - B2.marketing) / (B2.same - B2.marketing));
  let amt = 0.5 + 0.3 * drain + 0.17 * sp(t, B2.same, fps, CALM), sat = 0.4 * (1 - drain), blur = 1 + drain;
  const rs = sp(t, i === HERO ? B2.not : B2.blend + d * 70, fps, CALM);
  amt *= 1 - rs; sat = lerp(sat, 1, rs); blur *= 1 - rs;
  return { amt, sat, blur, d, c, r };
};

export const heroRect = (t: number, fps: number): Rect => {
  const push = 1 + 0.03 * clamp(t / B2.in);
  const x0 = CX + (1 - 1.5) * GX * push, y0 = CY - 0.5 * GY * push;
  const step = 1 + 0.08 * sp(t, B2.not, fps, CALM);
  const g = { x: x0, y: y0, w: TW * push * step, h: TH * push * step };
  const m = sp(t, B2.in, fps, CALM), k = sp(t, B2.own, fps, OWN);
  const hr = { x: lerp(g.x, HERO_R.x, m), y: lerp(g.y, HERO_R.y, m), w: lerp(g.w, HERO_R.w, m), h: lerp(g.h, HERO_R.h, m) };
  const live = 1 + 0.02 * clamp((t - B2.in) / (B2.own - B2.in));
  hr.w *= live; hr.h *= live;
  return { x: lerp(hr.x, KIT2.x, k), y: lerp(hr.y, KIT2.y, k), w: lerp(hr.w, KIT2.w, k), h: lerp(hr.h, KIT2.h, k) };
};

const Grid: React.FC<{ t: number; fps: number; assets: string[] }> = ({ t, fps, assets }) => (
  <>
    {TILES.map((tl, i) => {
      const { amt, sat, blur, d, c, r } = hueOf(i, t, fps);
      const push = 1 + 0.03 * clamp(t / B2.in);
      let x = CX + (c - 1.5) * GX * push, y = CY + (r - 0.5) * GY * push, w = TW * push, h = TH * push, op = 1;
      if (i === HERO) ({ x, y, w, h } = heroRect(t, fps));
      else {
        const cl = sp(t, B2.in + d * 30, fps, CALM);
        x += (x - CX) * 0.12 * cl; y += (y - CY) * 0.12 * cl; w *= 1 - 0.1 * cl; h *= 1 - 0.1 * cl; op = 1 - clamp(cl * 1.3);
        if (op <= 0) return null;
      }
      const hero = i === HERO && t >= B2.not;
      return (
        <div key={i} style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: op,
          overflow: "hidden", zIndex: hero ? 5 : 1,
          boxShadow: hero ? "0 22px 50px rgba(0,0,0,0.6)" : "0 10px 26px rgba(0,0,0,0.45)" }}>
          <Img src={staticFile(pick(assets, tl.f))} style={{ width: "100%", height: "100%", objectFit: "cover",
            objectPosition: tl.pos, filter: `saturate(${sat}) blur(${blur}px)` }} />
          <Template a={amt} />
        </div>
      );
    })}
  </>
);

export const Hook2: React.FC<{ t: number; fps: number; assets: string[]; sw: Swatch[] }> = ({ t, fps, assets, sw }) => (
  <div style={{ position: "absolute", inset: 0, perspective: 1400 }}>
    {t < B2.and + 450 && (
      <div style={{ position: "absolute", inset: 0, transformOrigin: "340px 347px", transform: kitTransform(t, fps, B2) }}>
        <Grid t={t} fps={fps} assets={assets} />
        <Swatches t={t} fps={fps} start={B2.own + 200} sw={sw} rect={heroRect(t, fps)} target={KIT2}
          img={{ w: 900, h: 1125 }} />
      </div>
    )}
    <Prompt t={t} fps={fps} b={B2} />
  </div>
);
