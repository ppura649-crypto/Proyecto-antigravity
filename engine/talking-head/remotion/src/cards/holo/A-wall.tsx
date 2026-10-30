import React from "react";
import { Img, OffthreadVideo, Sequence, staticFile } from "remotion";
import { SlopTile } from "./A-slop";
import { B0, CX, CY, COLS, GX, GY, PHOTO, TH, TW, clamp, hash, lerp, pick, sp, type Beats } from "./A-util";
// reference edit K family A (2026-09-23): H1.1 the slop wall, H1.2 the flip wave to real Holo ads, the living
// real wall under "The fix is starting from your", and the collapse into the SKIMS card on OWN.

// grid slot -> real ad on its back. The named nine sit nearest the centre, the wave flips them first.
export const BACKS: { f: string; pos: string }[] = [
  { f: "skims-3754960.jpg", pos: "50% 0%" }, { f: "crocs-5139703.jpg", pos: "50% 50%" },
  { f: "skims-3754927.jpg", pos: "50% 100%" }, { f: "crocs-5139685.jpg", pos: "50% 50%" },
  { f: "crocs-5139714.jpg", pos: "50% 50%" },
  { f: "crocs-5139682.jpg", pos: "50% 50%" }, { f: "skims-3754970.jpg", pos: "50% 100%" },
  { f: "skims-3755019.jpg", pos: "50% 35%" }, { f: "skims-3754962.jpg", pos: "50% 0%" },
  { f: "skims-3754998.jpg", pos: "50% 0%" },
  { f: "skims-pile.mp4", pos: "50% 40%" }, { f: "skims-3754964.jpg", pos: "50% 0%" },
  { f: "crocs-5139667.jpg", pos: "50% 50%" }, { f: "skims-3754932.jpg", pos: "50% 100%" },
  { f: "crocs-5139281.jpg", pos: "50% 50%" },
];
const CENTER = 7;
const MAXD = Math.hypot(2, 1);
// no overshoot on the collapse (round 2: calmer)
export const OWN = { damping: 32, stiffness: 260 };
const FLIP = { damping: 30, stiffness: 300 };
const DEAL = { damping: 34, stiffness: 290 }; // critically damped, ~350 ms, no overshoot

// the whole wall's camera: a slow push and drift that never stops, frozen at OWN for the collapse
const camera = (t: number) => {
  const tt = Math.min(t, B0.own);
  return { push: 1.0 + 0.03 * clamp(tt / B0.own), dx: 6 * Math.sin(tt / 1800) };
};
// living position of a slot: camera push + row parallax + a small float per tile
const tileBase = (i: number, t: number) => {
  const c = i % COLS, r = Math.floor(i / COLS), tt = Math.min(t, B0.own), cam = camera(t);
  const par = (r - 1) * 5 * Math.sin(tt / 1500);
  const fl = 2 * Math.sin(tt / 700 + i * 1.3);
  return { x: CX + cam.dx + par + (c - 2) * GX * cam.push, y: CY + fl + (r - 1) * GY * cam.push,
    w: TW * cam.push, h: TH * cam.push };
};
// where the SKIMS photo is at t (the swatches are eyedropped off it)
export const photoRect = (t: number, fps: number, b: Beats) => {
  const cs = sp(t, b.own, fps, OWN);
  const o = tileBase(CENTER, t);
  return { x: lerp(o.x, PHOTO.x, cs), y: lerp(o.y, PHOTO.y, cs), w: lerp(o.w, PHOTO.w, cs), h: lerp(o.h, PHOTO.h, cs) };
};
export const flipStart = (i: number, b: Beats) => {
  const c = i % COLS, r = Math.floor(i / COLS);
  return b.you + (Math.hypot(c - 2, r - 1) / MAXD) * 180;
};

// slop behaviour before the flip: sync jitter on MARKETING, jelly + glitch from SCREAMS
const slopMotion = (i: number, t: number, fps: number, b: Beats) => {
  const c = i % COLS, r = Math.floor(i / COLS);
  const f = Math.floor((t / 1000) * fps);
  let dx = 0, dy = 0, rot = 0, sx = 1, sy = 1, skew = 0, split = 0;
  if (t >= b.marketing && t < b.screams + 120) {
    const k = Math.floor(f / 3);
    dx = (hash(k) - 0.5) * 3; dy = (hash(k + 50) - 0.5) * 3; rot = (hash(k + 99) - 0.5) * 0.8;
  }
  let wob = 0;
  for (const [at, a] of [[b.screams, 0.018], [b.ai, 0.022], [b.slop, 0.028]] as const) {
    if (t < at) continue;
    const d = t - at;
    wob += a * Math.exp(-d / 360) * Math.sin((2 * Math.PI * d) / 280 - c * 0.45 - r * 0.25);
  }
  sx = 1 + wob; sy = 1 - wob; skew = wob * 25;
  // scan glitch: a band runs down the wall, tiles inside it slip sideways and split RGB
  if (t >= b.ai && t < b.you) {
    const bandY = (((t - b.ai) / 900) % 1) * 800 - 60;
    const tileY = CY + (r - 1) * GY;
    const inBand = Math.abs(tileY - bandY) < 90;
    const burst = t >= b.slop && t - b.slop < 70;
    if (inBand || burst) { dx += (hash(f * 7 + i) - 0.5) * 6; split = 2 + hash(f + i) * 1.5; }
  }
  return { dx, dy, rot, sx, sy, skew, split };
};

const Back: React.FC<{ i: number; assets: string[]; fps: number; b: Beats }> = ({ i, assets, fps, b }) => {
  const bk = BACKS[i];
  const src = staticFile(pick(assets, bk.f));
  const st: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", objectPosition: bk.pos };
  if (bk.f.endsWith(".mp4")) {
    return (
      <Sequence from={Math.ceil((flipStart(i, b) / 1000) * fps)} layout="none">
        <OffthreadVideo src={src} muted style={st} />
      </Sequence>
    );
  }
  return <Img src={src} style={st} />;
};

// fresh (h1t, 2026-09-24): no slop before it, the real wall rises in from the centre out at spine ms `fresh`.
// deal (h1 v6, the slop pile): the wall slides in straight from the right, column by column, at spine ms `deal`
export const Wall: React.FC<{ t: number; fps: number; assets: string[]; b: Beats; fresh?: number; deal?: number }> =
  ({ t, fps, assets, b, fresh, deal }) => {
  if (deal !== undefined) fresh = undefined;
  const cs = sp(t, b.own, fps, OWN);
  const tiles = BACKS.map((_, i) => {
    const c = i % COLS, r = Math.floor(i / COLS);
    const d = Math.hypot(c - 2, r - 1);
    let { x, y, w, h } = tileBase(i, t);
    let op = 1;
    // v2: a stiffer, calmer flip so the last tile lands by ~THIS (was 280 ms spread, 190 stiffness: landed ~2.8 s)
    const fs = fresh !== undefined || deal !== undefined ? 1 : sp(t, flipStart(i, b), fps, FLIP);
    const m = t < b.you + 200 ? slopMotion(i, t, fps, b) : null;
    if (i === CENTER) ({ x, y, w, h } = photoRect(t, fps, b)); else if (t >= b.own) {
      const k = sp(t, b.own + d * 20, fps, { damping: 32, stiffness: 260 });
      x = lerp(x, PHOTO.x, k); y = lerp(y, PHOTO.y, k);
      w *= 1 - 0.7 * k; h *= 1 - 0.7 * k; op = 1 - clamp(k * 1.5);
    }
    const lift = 1 + 0.05 * Math.sin(Math.PI * clamp(fs));
    const en = fresh === undefined ? 1 : clamp(sp(t, fresh + (d / MAXD) * 150, fps, FLIP));
    const dl = deal === undefined ? 1 : clamp(sp(t, deal + c * 30 + r * 10, fps, DEAL));
    if (en <= 0 || dl <= 0) return null;
    x += 900 * (1 - dl);
    op *= clamp(dl * 3);
    op *= clamp(en * 1.8); // on the faces: opacity on the 3D parent would flatten it and show the slop side
    const tf = m
      ? `translate(${m.dx}px,${m.dy}px) rotate(${m.rot}deg) skewX(${m.skew}deg) scale(${m.sx},${m.sy})`
      : "";
    return (
      <div key={i} style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h,
        zIndex: i === CENTER ? 5 : fs > 0 && fs < 1 ? 3 : 1,
        transform: `${tf} translateY(${40 * (1 - en)}px) scale(${lift * (0.72 + 0.28 * en)}) rotateY(${180 * fs}deg)`,
        transformStyle: "preserve-3d" }}>
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", opacity: op,
          boxShadow: "0 10px 26px rgba(0,0,0,0.45)" }}>
          <SlopTile i={i} w={TW} h={TH} split={m?.split ?? 0} />
        </div>
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", opacity: op,
          overflow: "hidden", background: "#111",
          boxShadow: "0 14px 34px rgba(0,0,0,0.55)" }}>
          {fs > 0.3 && <Back i={i} assets={assets} fps={fps} b={b} />}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg,rgba(255,255,255,0.55),rgba(255,255,255,0) 55%)",
            opacity: 0.45 * Math.sin(Math.PI * clamp(fs)) }} />
        </div>
      </div>
    );
  });
  return <div style={{ position: "absolute", inset: 0, perspective: 1300 }}>{tiles}</div>;
};
