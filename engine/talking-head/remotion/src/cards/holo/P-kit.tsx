import React from "react";
import { Img, staticFile } from "remotion";
import { HFONT } from "./D-kit"; // side effect: loads Plus Jakarta Sans (Holo's UI type)
// reference edit K family P (2026-09-24): the plan family's shared bits. Everything is a pure function of the spine clock.
export { HFONT };
export const INK = "#111111";
export const MUTED = "#8C8C8C";
export const PILL = "#F3F3F3";
export const GREEN = "#34C759";
export const SHADOW = "0 26px 56px rgba(0,0,0,0.5), 0 8px 18px rgba(0,0,0,0.32)";
export const PHOTO_SHADOW = "0 18px 44px rgba(0,0,0,0.6), 0 6px 16px rgba(0,0,0,0.4)";

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
/** linear progress of the window [a, b] (spine ms) */
export const win = (t: number, a: number, b: number) => clamp((t - a) / Math.max(1, b - a));
export const eOut = (p: number) => 1 - Math.pow(1 - clamp(p), 3);
export const eIn = (p: number) => Math.pow(clamp(p), 3);
export const eInOut = (p: number) => { const x = clamp(p); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
/** eased-out progress of a window that starts at `at` and lasts `dur` ms */
export const land = (t: number, at: number, dur = 260) => eOut(win(t, at, at + dur));
export const pick = (assets: string[], name: string) => staticFile(assets.find((a) => a.endsWith(name)) ?? name);

// ---- the plan's content: 30 days from Mon Oct 5 2026 (day 30 = Tue Nov 3), a 5-week grid Mon-Sun ----
export const MONTHS = ["Oct", "Nov"];
export const dateOf = (i: number) => (i < 27 ? { m: 0, d: 5 + i } : { m: 1, d: i - 26 });
export const RANGE_LABEL = "Oct 5 - Nov 3";
export const DAY30 = 29;
export type Channel = "ig" | "meta" | "tiktok" | "email";
export type Post = { r: number; c: number; ch: Channel; label: string; img: string };
export const POSTS: Post[] = [
  { r: 0, c: 0, ch: "ig", label: "9:00", img: "skims-3755019.jpg" },
  { r: 0, c: 3, ch: "meta", label: "Ad", img: "skims-3754970.jpg" },
  { r: 1, c: 1, ch: "email", label: "8:00", img: "crocs-5139281.jpg" },
  { r: 1, c: 3, ch: "ig", label: "9:00", img: "skims-3754927.jpg" },
  { r: 1, c: 5, ch: "tiktok", label: "18:00", img: "skims-3754964.jpg" },
  { r: 2, c: 0, ch: "ig", label: "9:00", img: "crocs-5139682.jpg" },
  { r: 2, c: 4, ch: "meta", label: "Ad", img: "skims-3754998.jpg" },
  { r: 3, c: 2, ch: "tiktok", label: "18:00", img: "skims-3754932.jpg" },
  { r: 3, c: 5, ch: "ig", label: "12:30", img: "crocs-5139685.jpg" },
  { r: 4, c: 0, ch: "email", label: "8:00", img: "skims-3754962.jpg" },
];
export const SWAP = { index: 3, img: "skims-3754960.jpg" }; // B20: the Oct 15 IG post is replaced
export const P_ASSETS = [
  "holo-mark-black.png", "D-logo-meta.png", "D-logo-tiktok.png",
  ...POSTS.map((p) => p.img), SWAP.img,
];

// ---- channel marks: Meta and TikTok are the real logo files; Instagram and mail are drawn glyphs ----
export const IgGlyph: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ width: s, height: s, borderRadius: s * 0.28, position: "relative", flex: "none",
    background: "radial-gradient(circle at 30% 107%, #FDF497 0%, #FD5949 45%, #D6249F 60%, #285AEB 90%)" }}>
    <div style={{ position: "absolute", inset: s * 0.18, borderRadius: s * 0.2, border: `${Math.max(1.5, s * 0.08)}px solid #fff` }} />
    <div style={{ position: "absolute", left: s * 0.33, top: s * 0.33, width: s * 0.34, height: s * 0.34, borderRadius: "50%", border: `${Math.max(1.5, s * 0.08)}px solid #fff`, boxSizing: "border-box" }} />
    <div style={{ position: "absolute", left: s * 0.66, top: s * 0.24, width: s * 0.09, height: s * 0.09, borderRadius: "50%", background: "#fff" }} />
  </div>
);
export const MailGlyph: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ flex: "none" }}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="none" stroke={INK} strokeWidth="2" />
    <path d="M3.5 6.5 L12 13 L20.5 6.5" fill="none" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);
export const ChannelMark: React.FC<{ ch: Channel; s: number; assets: string[] }> = ({ ch, s, assets }) => {
  if (ch === "ig") return <IgGlyph s={s} />;
  if (ch === "email") return <MailGlyph s={s} />;
  const src = ch === "meta" ? "D-logo-meta.png" : "D-logo-tiktok.png";
  return <Img src={pick(assets, src)} style={{ width: s, height: s, objectFit: "contain", flex: "none" }} />;
};
export const CH_NAME: Record<Channel, string> = { ig: "Instagram", meta: "Meta ads", tiktok: "TikTok", email: "Email" };

/** Holo's small green flag (day 30) */
export const Flag: React.FC<{ s: number }> = ({ s }) => (
  <div style={{ position: "relative", width: s * 0.8, height: s }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: Math.max(2, s * 0.1), height: s, borderRadius: 2, background: INK }} />
    <div style={{ position: "absolute", left: Math.max(2, s * 0.1), top: s * 0.04, width: s * 0.66, height: s * 0.46, background: GREEN,
      clipPath: "polygon(0 0, 100% 0, 80% 50%, 100% 100%, 0 100%)" }} />
  </div>
);
