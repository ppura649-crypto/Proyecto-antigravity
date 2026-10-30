import React from "react";
import { JAKARTA, type VBeats, clamp, ease } from "./V-util";
// reference edit K hook-1 v04 (builder V): the store page's own paper, strip by strip (chrome, nav, hero, tiles). Its
// photos, logo and button are drawn by V-fold (they fly); the strips keep the rest and fold away on THIS,
// an accordion: each strip turns on its horizontal axis, alternating direction, and closes toward the middle.

export const PAGE = { x: 40, y: 17, w: 1000, h: 600, chromeY: 17, chromeH: 56, navY: 73, navH: 62,
  heroY: 135, heroH: 270, tilesY: 405, tilesH: 212 };
export const STRIPS = ["chrome", "nav", "hero", "tiles"] as const;
type Which = (typeof STRIPS)[number];
const TILE_NAMES = ["Maxi Dress", "Catsuit", "Bodysuit", "Onesie"];

const box = (w: Which) => w === "chrome" ? [PAGE.chromeY, PAGE.chromeH] : w === "nav" ? [PAGE.navY, PAGE.navH]
  : w === "hero" ? [PAGE.heroY, PAGE.heroH] : [PAGE.tilesY, PAGE.tilesH];

const Chrome = () => (
  <div style={{ position: "absolute", inset: 0, background: "#ebebeb", borderBottom: "1px solid #d8d8d8" }}>
    {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
      <div key={c} style={{ position: "absolute", left: 22 + i * 26, top: 21, width: 15, height: 15, borderRadius: "50%", background: c }} />
    ))}
    <div style={{ position: "absolute", left: 290, top: 9, width: 420, height: 38, borderRadius: 10, background: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: JAKARTA, fontSize: 26,
      fontWeight: 600, color: "#333" }}>
      <svg width="16" height="20" viewBox="0 0 16 20"><rect x="1" y="8" width="14" height="11" rx="2" fill="#777" />
        <path d="M4 8V5a4 4 0 0 1 8 0v3" stroke="#777" strokeWidth="2" fill="none" /></svg>
      yourbrand.com
    </div>
  </div>
);

const Nav = () => (
  <div style={{ position: "absolute", inset: 0, background: "#fff", borderBottom: "1px solid #ececec", fontFamily: JAKARTA }}>
    <div style={{ position: "absolute", left: 30, top: 15, display: "flex", gap: 30, fontSize: 26, fontWeight: 600, color: "#111" }}>
      <span>Shop</span><span>New</span><span>Bodysuits</span>
    </div>
    <svg style={{ position: "absolute", right: 86, top: 17 }} width="28" height="28" viewBox="0 0 28 28">
      <circle cx="12" cy="12" r="9" stroke="#111" strokeWidth="2.6" fill="none" /><path d="M19 19l7 7" stroke="#111" strokeWidth="2.6" />
    </svg>
    <svg style={{ position: "absolute", right: 34, top: 15 }} width="28" height="30" viewBox="0 0 28 30">
      <rect x="3" y="9" width="22" height="19" stroke="#111" strokeWidth="2.6" fill="none" />
      <path d="M9 12V7a5 5 0 0 1 10 0v5" stroke="#111" strokeWidth="2.6" fill="none" />
    </svg>
  </div>
);

const Hero = () => (
  <div style={{ position: "absolute", inset: 0, background: "#f3eee8", fontFamily: JAKARTA }}>
    <div style={{ position: "absolute", left: 44, top: 26, fontSize: 52, fontWeight: 800, color: "#111", lineHeight: 1.06,
      letterSpacing: -1.5 }}>Made for<br />every body.</div>
    <div style={{ position: "absolute", left: 44, top: 146, fontSize: 26, fontWeight: 500, color: "#6b6258" }}>New halter bodysuits</div>
    <div style={{ position: "absolute", left: 520, top: 0, width: 480, height: "100%", background: "#e6ded3" }} />
  </div>
);

const Tiles = () => (
  <div style={{ position: "absolute", inset: 0, background: "#fff", fontFamily: JAKARTA }}>
    {TILE_NAMES.map((n, i) => (
      <React.Fragment key={n}>
        <div style={{ position: "absolute", left: 16 + i * 245.5, top: 14, width: 231.5, height: 142, background: "#f1efec" }} />
        <div style={{ position: "absolute", left: 16 + i * 245.5, top: 162, fontSize: 26, fontWeight: 600, color: "#111" }}>{n}</div>
      </React.Fragment>
    ))}
  </div>
);

export const Strip: React.FC<{ which: Which; i: number; t: number; b: VBeats; assets: string[] }> = ({ which, i, t, b }) => {
  const [y, h] = box(which);
  const p = ease((t - (b.watch + 60 + (3 - i) * 45)) / 330); // bottom strip first: the tiles leave first
  if (p >= 1) return null;
  const mid = PAGE.y + PAGE.h / 2, cy = y + h / 2;
  const dir = i % 2 === 0 ? 1 : -1;
  return (
    <div style={{ position: "absolute", left: PAGE.x, top: y, width: PAGE.w, height: h, overflow: "hidden",
      transform: `translateY(${(mid - cy) * 0.55 * p}px) perspective(1300px) rotateX(${dir * 92 * p}deg) scale(${1 - 0.18 * p})`,
      opacity: 1 - clamp((p - 0.55) / 0.45), filter: p > 0 ? `brightness(${1 - 0.35 * Math.sin(Math.PI * p / 2)})` : undefined }}>
      {which === "chrome" ? <Chrome /> : which === "nav" ? <Nav /> : which === "hero" ? <Hero /> : <Tiles />}
    </div>
  );
};
