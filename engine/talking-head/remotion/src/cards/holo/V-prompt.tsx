import React from "react";
import { Img, staticFile } from "remotion";
import { GLIDE, JAKARTA, SHADOW, VB, type VBeats, clamp, ease, exitOf, lerp, pick, sp } from "./V-util";
// reference edit K hook-1 v05 (builder V, 2026-09-24) "prompt vs link", 1974 -> 4237. A split band.
// Left: a chat box where the prompt keeps being typed, sent, deleted, retyped ("make me an ad", "make it pop
// more", "no, more premium"); every send spits a slop ad (fictional brands) onto a growing pile and the attempt
// counter ticks up. Right: one "yourbrand.com" chip; on WATCH it drops into Holo's mark, and out of it grows one
// clean, real Crocs ad that takes over the band while the left side dims. Settled ~3.2 s, held, 150 ms exit.

const PX = 30, PY = 30, PW = 500, PH = 574; // the chat panel (card px)
const IN = { x: 20, y: 456, w: 460, h: 100 }; // its input box (panel px)
const TW = 150, TH = 225; // a slop thumbnail (720 x 1080)
type Pile = { f: string; x: number; y: number; rot: number; at: number };
// at = the send (ms after YOU) that spat it; < 0 = already on the pile at YOU
const PILE: Pile[] = [
  { f: "famA-slop-bike.jpg", x: 115, y: 250, rot: -7, at: -1 },
  { f: "famA-slop-serum.jpg", x: 250, y: 236, rot: 4, at: -1 },
  { f: "famA-slop-sneaker.jpg", x: 385, y: 252, rot: -3, at: -1 },
  { f: "famA-slop-dog.jpg", x: 180, y: 268, rot: 8, at: 346 },
  { f: "famA-slop-pyjama.jpg", x: 318, y: 262, rot: -9, at: 1246 },
];
// the input over time (ms after YOU): type, send (clear), type, delete, retype, send, idle
const TYPE = 20, DEL = 7;
const A = "make me an ad", B = "make it pop more", C = "no, more premium";
const inputAt = (u: number): string => {
  if (u < 346) return A.slice(0, clamp(Math.floor((u + 90) / TYPE) + 1, 0, A.length));
  if (u < 386) return "";
  const b0 = 386, bEnd = b0 + B.length * TYPE;
  if (u < bEnd + 60) return B.slice(0, Math.floor((u - b0) / TYPE) + 1);
  const d0 = bEnd + 60, dEnd = d0 + B.length * DEL;
  if (u < dEnd) return B.slice(0, B.length - Math.floor((u - d0) / DEL));
  const c0 = dEnd + 20;
  if (u < 1246) return C.slice(0, clamp(Math.floor((u - c0) / TYPE) + 1, 0, C.length));
  return "";
};
const attemptAt = (u: number) => 4 + PILE.filter((p) => p.at >= 0 && u >= p.at).length;

const Thumb: React.FC<{ p: Pile; u: number; fps: number; src: string }> = ({ p, u, fps, src }) => {
  if (p.at >= 0 && u < p.at) return null;
  const g = p.at < 0 ? 1 : sp(u, p.at, fps, { damping: 20, stiffness: 190 });
  const x0 = IN.x + IN.w / 2, y0 = IN.y + 20;
  const x = lerp(x0, p.x, g), y = lerp(y0, p.y, g) - Math.sin(Math.PI * clamp(g)) * 60, s = lerp(0.25, 1, g);
  return (
    <div style={{ position: "absolute", left: x - TW / 2, top: y - TH / 2, width: TW, height: TH, opacity: clamp(g * 4),
      transform: `rotate(${lerp(0, p.rot, g)}deg) scale(${s})`, boxShadow: "0 14px 30px rgba(0,0,0,0.35)" }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
};

const Chat: React.FC<{ u: number; fps: number; assets: string[] }> = ({ u, fps, assets }) => {
  const txt = inputAt(u), n = attemptAt(u);
  const lastSend = [...PILE].reverse().find((p) => p.at >= 0 && u >= p.at)?.at ?? -1e9;
  const flip = clamp((u - lastSend) / 160), press = lastSend > 0 ? 1 - 0.12 * Math.sin(Math.PI * clamp((u - lastSend) / 140)) : 1;
  const caret = Math.floor(u / 420) % 2 === 0 || (txt.length > 0 && u < 1246);
  return (
    <div style={{ position: "absolute", left: PX, top: PY, width: PW, height: PH, background: "#fff", boxShadow: SHADOW,
      fontFamily: JAKARTA }}>
      <div style={{ position: "absolute", left: 22, top: 20, fontSize: 28, fontWeight: 700, color: "#111" }}>New chat</div>
      <div style={{ position: "absolute", right: 18, top: 14, height: 44, padding: "0 18px", borderRadius: 22, overflow: "hidden",
        background: "#f1f1f1", display: "flex", alignItems: "center", fontSize: 26, fontWeight: 700, color: "#444" }}>
        Attempt&nbsp;
        <span style={{ display: "inline-block", color: flip < 1 ? "#d03a2a" : "#444",
          transform: `scale(${1 + 0.35 * Math.sin(Math.PI * flip)})` }}>{n}</span>
      </div>
      {PILE.map((p) => <Thumb key={p.f} p={p} u={u} fps={fps} src={pick(assets, p.f)} />)}
      <div style={{ position: "absolute", left: IN.x, top: IN.y, width: IN.w, height: IN.h, borderRadius: 18,
        border: "2px solid #e1e1e1", background: "#fff", boxSizing: "border-box", boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
        <div style={{ position: "absolute", left: 22, top: 30, display: "flex", alignItems: "center", fontSize: 30,
          fontWeight: 600, color: txt ? "#111" : "#a3a3a3", whiteSpace: "nowrap" }}>
          {txt || "Describe your ad…"}
          {txt && <div style={{ width: 3, height: 34, marginLeft: 2, background: "#111", opacity: caret ? 1 : 0 }} />}
        </div>
        <div style={{ position: "absolute", right: 16, top: 21, width: 56, height: 56, borderRadius: "50%",
          background: txt ? "#111" : "#d4d4d4", transform: `scale(${press})`, display: "flex", alignItems: "center",
          justifyContent: "center" }}>
          <svg width="24" height="26" viewBox="0 0 24 26"><path d="M12 24V3M3 11l9-9 9 9" stroke="#fff" strokeWidth="3.4"
            fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
    </div>
  );
};

const CHIP = { x: 810, y: 150, w: 380, h: 96 }, DISC = { x: 810, y: 430, d: 156 };
const AD = { w: 496, h: 620, x: 700, y: 317 }; // crocs-5139667 (900 x 1125), final centre

const Link: React.FC<{ t: number; fps: number; b: VBeats; mark: string; ad: string }> = ({ t, fps, b, mark, ad }) => {
  const d = clamp((t - b.watch) / 270), dd = d * d;
  const hit = b.watch + 270;
  const pulse = sp(t, hit, fps, { damping: 9, stiffness: 260 });
  const bump = t < hit ? 0 : Math.sin(Math.PI * clamp((t - hit) / 260)) * 0.12;
  const g = sp(t, hit + 40, fps, GLIDE);
  const push = 1 + 0.03 * ease((t - (hit + 700)) / (b.own - hit - 700));
  const aw = lerp(40, AD.w, g) * push, ah = lerp(50, AD.h, g) * push;
  const ax = lerp(DISC.x, AD.x, g), ay = lerp(DISC.y, AD.y, g);
  return (
    <>
      <div style={{ position: "absolute", left: DISC.x - DISC.d / 2, top: DISC.y - DISC.d / 2, width: DISC.d, height: DISC.d,
        borderRadius: "50%", background: "#08080a", display: "flex", alignItems: "center", justifyContent: "center",
        transform: `scale(${1 + bump - 0.4 * clamp(g * 1.4)})`, opacity: 1 - clamp((g - 0.3) / 0.4),
        boxShadow: `0 0 0 ${6 + 26 * bump / 0.12 * (pulse > 0 ? 1 : 0) * (1 - clamp((t - hit) / 300))}px rgba(255,255,255,0.18), 0 16px 40px rgba(0,0,0,0.5)` }}>
        <Img src={staticFile(mark)} style={{ width: 88 }} />
      </div>
      {d < 1 && (
        <div style={{ position: "absolute", left: CHIP.x - CHIP.w / 2, top: lerp(CHIP.y, DISC.y, dd) - CHIP.h / 2, width: CHIP.w,
          height: CHIP.h, borderRadius: CHIP.h / 2, background: "#fff", boxShadow: "0 16px 36px rgba(0,0,0,0.45)",
          transform: `scale(${lerp(1, 0.22, dd)})`, opacity: 1 - clamp((d - 0.8) / 0.2), display: "flex", alignItems: "center",
          justifyContent: "center", gap: 14, fontFamily: JAKARTA, fontSize: 36, fontWeight: 700, color: "#111" }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="#111" strokeWidth="2.6">
            <circle cx="17" cy="17" r="14" /><ellipse cx="17" cy="17" rx="6.5" ry="14" /><path d="M3 17h28" /></svg>
          yourbrand.com
        </div>
      )}
      {g > 0 && (
        <div style={{ position: "absolute", left: ax - aw / 2, top: ay - ah / 2, width: aw, height: ah, zIndex: 3,
          transform: `perspective(1200px) rotateY(${-14 * (1 - g)}deg)`, opacity: clamp(g * 5),
          boxShadow: "0 30px 70px rgba(0,0,0,0.55), 0 8px 20px rgba(0,0,0,0.35)" }}>
          <Img src={staticFile(ad)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
    </>
  );
};

export const PromptLink: React.FC<{ t: number; fps: number; toMs: number; beats: Partial<VBeats>; assets: string[] }> = (
  { t, fps, toMs, beats, assets }) => {
  const b: VBeats = { ...VB, ...beats };
  const ex = exitOf(t, toMs);
  const dim = ease((t - (b.watch + 380)) / 450);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: ex.opacity, transform: `scale(${ex.scale})`,
      filter: ex.blur > 0.05 ? `blur(${ex.blur}px)` : undefined }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - 0.55 * dim, transformOrigin: `${PX + PW / 2}px 317px`,
        transform: `scale(${1 - 0.05 * dim})`, filter: dim > 0.01 ? `saturate(${1 - 0.6 * dim}) blur(${1.6 * dim}px)` : undefined }}>
        <Chat u={t - b.you} fps={fps} assets={assets} />
      </div>
      <Link t={t} fps={fps} b={b} mark={pick(assets, "holo-mark-white.png")} ad={pick(assets, "crocs-5139667.jpg")} />
    </div>
  );
};
