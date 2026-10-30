import React from "react";
import { Img, staticFile } from "remotion";
import { GLIDE, JAKARTA, Photo, SHADOW, VB, type VBeats, type View, clamp, ease, exitOf, fullView, lerp, lerpView,
  pick, sp } from "./V-util";
import { PAGE, Strip, STRIPS } from "./V-page";
// reference edit K hook-1 v04 (builder V, 2026-09-24) "the website folds into ads", 1974 -> 4237.
// YOU: a clean browser window on yourbrand.com, a SKIMS-style store (real campaign photos, the real wordmark).
// WATCH: its hero photo, logo, "Shop now" and product tiles lift off the page; the empty page folds away
// like paper (an accordion, strip by strip) while the pieces fly and re-assemble into three finished SKIMS
// ads standing side by side: the hero becomes the middle ad, two tiles the outer ones, the nav logo lands on
// the middle ad's own wordmark, the button becomes its "Shop now" bar. Done ~3.2 s, held, 150 ms exit.

const IW = 900, IH = 1612;
const AW = 290, AH = (AW * IH) / IW, BAR = 58, AY = (634 - AH - BAR) / 2;
const AX = [60, 395, 730];
const adView = (i: number) => fullView(AX[i], AY, AW, IW, IH);
const TILE = { y: PAGE.tilesY + 14, w: 231.5, h: 142 };
const tileX = (i: number) => PAGE.x + 16 + i * (TILE.w + 14);
const tileView = (i: number, cx: number, cy: number): View =>
  ({ x: tileX(i), y: TILE.y, w: TILE.w, h: TILE.h, k: TILE.w / 450, cx, cy });
const HERO: View = { x: PAGE.x + 520, y: PAGE.heroY, w: 480, h: PAGE.heroH, k: 0.8, cx: 420, cy: 470 };

// the photos that fly: from (a view on the page) to (an ad, or into the middle ad and gone)
type Flier = { img: string; from: View; to: number; lift: number; go: number; stays: boolean };
const FLIERS: Flier[] = [
  { img: "skims-3754960.jpg", from: tileView(1, 450, 620), to: 1, lift: 30, go: 110, stays: false },
  { img: "skims-3754970.jpg", from: tileView(2, 450, 640), to: 1, lift: 45, go: 150, stays: false },
  { img: "skims-3754932.jpg", from: tileView(0, 450, 600), to: 0, lift: 15, go: 130, stays: true },
  { img: "skims-3754962.jpg", from: tileView(3, 620, 760), to: 2, lift: 60, go: 170, stays: true },
  { img: "skims-3754964.jpg", from: HERO, to: 1, lift: 0, go: 90, stays: true },
];
const LIFT = { damping: 22, stiffness: 300 };

const FlyPhoto: React.FC<{ f: Flier; t: number; fps: number; b: VBeats; assets: string[] }> = ({ f, t, fps, b, assets }) => {
  const l = sp(t, b.watch + f.lift, fps, LIFT);
  const g = sp(t, b.watch + f.go, fps, GLIDE);
  const push = f.from === HERO ? 1 + 0.04 * clamp((t - b.you) / 600) : 1;
  const from = { ...f.from, k: f.from.k * push };
  let v = lerpView(from, adView(f.to), g);
  if (!f.stays) { // the extra tiles tuck into the middle ad and vanish behind it
    const c = { x: v.x + v.w / 2, y: v.y + v.h / 2 }, s = lerp(1, 0.35, g);
    v = { ...v, x: c.x - (v.w * s) / 2, y: c.y - (v.h * s) / 2, w: v.w * s, h: v.h * s, k: v.k * s };
  }
  const arc = Math.sin(Math.PI * clamp(g)) * 34;
  const rot = (f.to - 1) * 10 * Math.sin(Math.PI * clamp(g));
  return (
    <Photo src={pick(assets, f.img)} v={{ ...v, y: v.y - 8 * l * (1 - g) - arc }} iw={IW} ih={IH} style={{
      transform: `perspective(1200px) rotateY(${rot}deg) scale(${1 + 0.035 * l * (1 - g)})`,
      opacity: f.stays ? 1 : 1 - clamp((g - 0.55) / 0.35),
      boxShadow: `0 ${lerp(2, 26, Math.max(l * (1 - g), g))}px ${lerp(6, 60, Math.max(l, g))}px rgba(0,0,0,${lerp(0.15, 0.5, Math.max(l, g))})` }} />
  );
};

// the ad's "Shop now" bar: the middle one is the page's button morphing into it; the outer two unfold
const Bars: React.FC<{ t: number; fps: number; b: VBeats }> = ({ t, fps, b }) => {
  const g = sp(t, b.watch + 140, fps, GLIDE);
  const btn = { x: PAGE.x + 44, y: PAGE.heroY + 188, w: 196, h: 54 };
  const bar = { x: AX[1], y: AY + AH, w: AW, h: BAR };
  const r = { x: lerp(btn.x, bar.x, g), y: lerp(btn.y, bar.y, g) - Math.sin(Math.PI * g) * 40, w: lerp(btn.w, bar.w, g), h: lerp(btn.h, bar.h, g) };
  const inkK = clamp((g - 0.3) / 0.4);
  const label = (k: number) => (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: `0 ${lerp(24, 18, k)}px`, fontFamily: JAKARTA, fontWeight: 700, fontSize: 26,
      color: k > 0.5 ? "#111" : "#fff" }}>
      <span style={{ whiteSpace: "nowrap" }}>Shop now</span>
      {k > 0.5 && <span style={{ opacity: (k - 0.5) * 2, fontSize: 30 }}>›</span>}
    </div>
  );
  return (
    <>
      {[0, 2].map((i) => {
        const u = sp(t, b.watch + (i === 0 ? 470 : 520), fps, GLIDE);
        if (u <= 0) return null;
        return (
          <div key={i} style={{ position: "absolute", left: AX[i], top: AY + AH, width: AW, height: BAR, background: "#fff",
            transformOrigin: "50% 0", transform: `perspective(700px) rotateX(${-90 * (1 - u)}deg)`, opacity: clamp(u * 3),
            boxShadow: "0 18px 40px rgba(0,0,0,0.4)" }}>{label(1)}</div>
        );
      })}
      <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, zIndex: 5,
        background: `rgb(${lerp(17, 255, inkK)},${lerp(17, 255, inkK)},${lerp(17, 255, inkK)})`,
        borderRadius: lerp(27, 0, inkK), boxShadow: g > 0.02 ? "0 18px 40px rgba(0,0,0,0.4)" : undefined }}>{label(inkK)}</div>
    </>
  );
};

// the hero photo's view right now (same maths as FlyPhoto for the hero)
const heroNow = (t: number, fps: number, b: VBeats): View => {
  const l = sp(t, b.watch, fps, LIFT), g = sp(t, b.watch + 90, fps, GLIDE);
  const from = { ...HERO, k: HERO.k * (1 + 0.04 * clamp((t - b.you) / 600)) };
  const v = lerpView(from, adView(1), g);
  return { ...v, y: v.y - 8 * l * (1 - g) - Math.sin(Math.PI * clamp(g)) * 34 };
};
// the nav wordmark flies onto the hero photo's own wordmark (skims-3754964: centre 420,197, 250 px wide), rides
// it into the middle ad and melts into it as the ad lands
const Logo: React.FC<{ t: number; fps: number; b: VBeats; src: string }> = ({ t, fps, b, src }) => {
  const gl = sp(t, b.watch + 60, fps, { damping: 30, stiffness: 200 });
  const gh = sp(t, b.watch + 90, fps, GLIDE);
  const hv = heroNow(t, fps, b);
  const to = { x: hv.x + hv.w / 2 + (420 - hv.cx) * hv.k, y: hv.y + hv.h / 2 + (197 - hv.cy) * hv.k, w: 250 * hv.k };
  const from = { x: 540, y: PAGE.navY + PAGE.navH / 2, w: 150 };
  const w = lerp(from.w, to.w, gl), x = lerp(from.x, to.x, gl), y = lerp(from.y, to.y, gl);
  return (
    <Img src={staticFile(src)} style={{ position: "absolute", left: x - w / 2, top: y - (w * 223) / 971 / 2, width: w,
      zIndex: 6, opacity: 1 - clamp((gh - 0.75) / 0.2) }} />
  );
};

export const WebFold: React.FC<{ t: number; fps: number; toMs: number; beats: Partial<VBeats>; assets: string[] }> = (
  { t, fps, toMs, beats, assets }) => {
  const b: VBeats = { ...VB, ...beats };
  const ex = exitOf(t, toMs);
  const push = 1 + 0.03 * ease((t - (b.watch + 700)) / (b.own - b.watch - 700)) + 0.012 * clamp((t - b.you) / 360);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: ex.opacity, transform: `scale(${push * ex.scale})`,
      filter: ex.blur > 0.05 ? `blur(${ex.blur}px)` : undefined }}>
      <div style={{ position: "absolute", left: PAGE.x, top: PAGE.y, width: PAGE.w, height: PAGE.h, boxShadow: SHADOW,
        opacity: 1 - clamp((t - b.this) / 250) }} />
      {STRIPS.map((s, i) => <Strip key={s} which={s} i={i} t={t} b={b} assets={assets} />)}
      {FLIERS.map((f, i) => <FlyPhoto key={i} f={f} t={t} fps={fps} b={b} assets={assets} />)}
      <Bars t={t} fps={fps} b={b} />
      <Logo t={t} fps={fps} b={b} src={pick(assets, "famA-skims-wordmark.png")} />
    </div>
  );
};
