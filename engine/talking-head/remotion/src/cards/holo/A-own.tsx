import React from "react";
import { Img, staticFile } from "remotion";
import { OWN, photoRect } from "./A-wall";
import { CY, PHOTO, clamp, lerp, pick, sp, type Beats, type Rect } from "./A-util";
import type { Swatch } from "./A-kit";
// reference edit K family A v2 (2026-09-24): hook 1's bridge as ONE surface, 4237 -> 6000. On OWN the SKIMS photo
// comes forward (A-wall collapse) and its brand kit builds beside it: the SKIMS wordmark lifted off the wall
// in the photo, four colours eyedropped off it with their hex, a type sample. Done by ~4.7 s and held.
// On NOT an empty "Ask anything" box joins under the kit (the kit only slides up to make room); on BLANK it
// greys out and a terracotta line strikes its placeholder, done by PROMPT. Held, then a 150 ms exit at 6000.

const JAKARTA = `"Plus Jakarta Sans", "Figtree", "Inter", -apple-system, sans-serif`;
const CALM = { damping: 36, stiffness: 320 }; // critically damped, ~300 ms, no overshoot
// right column, card px (the hook-1 card is 1080 x 695, fitted into the 634 px band)
const COL = { x: 392, w: 658 };
const PAD = 28, PH = 392, BH = 170, GAP = 24;
const SWW = (COL.w - 2 * PAD - 3 * 14) / 4, SWH = 104, SW_Y = 105;
// the SKIMS wordmark as it sits on the wall in skims-3755019.jpg (900 x 1612 px)
const WM_SRC = { x: 290, y: 322, w: 324, h: 75 };
const WM = { x: PAD, y: 26, w: 230, h: 53 };
const IMG = { w: 900, h: 1612 };

const panelTop = (t: number, fps: number, b: Beats) =>
  lerp(CY - PH / 2, CY - (PH + GAP + BH) / 2, sp(t, b.not, fps, CALM));
const panelDx = (t: number, fps: number, b: Beats) => 120 * (1 - sp(t, b.own + 120, fps, CALM));

// where the SKIMS photo is now: from the wall's centre tile, or from `from` (the rect it had at OWN in the feed)
const rectAt = (t: number, fps: number, b: Beats, from?: Rect): Rect => {
  if (!from) return photoRect(t, fps, b);
  const k = sp(t, b.own, fps, OWN);
  return { x: lerp(from.x, PHOTO.x, k), y: lerp(from.y, PHOTO.y, k), w: lerp(from.w, PHOTO.w, k), h: lerp(from.h, PHOTO.h, k) };
};
// a point of the photo (source px) where the photo is now
const onPhoto = (t: number, fps: number, b: Beats, px: number, py: number, from?: Rect) => {
  const r = rectAt(t, fps, b, from);
  return { x: r.x - r.w / 2 + (px / IMG.w) * r.w, y: r.y - r.h / 2 + (py / IMG.h) * r.h, k: r.w / IMG.w };
};

const Panel: React.FC<{ t: number; fps: number; b: Beats }> = ({ t, fps, b }) => {
  const pe = sp(t, b.own + 120, fps, CALM);
  const ty = sp(t, b.own + 190, fps, CALM);
  return (
    <div style={{ position: "absolute", left: COL.x + panelDx(t, fps, b), top: panelTop(t, fps, b), width: COL.w,
      height: PH, background: "#fff", opacity: clamp(pe * 1.6), fontFamily: JAKARTA,
      boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 6px 16px rgba(0,0,0,0.3)" }}>
      <div style={{ position: "absolute", right: PAD, top: 38, fontSize: 29, fontWeight: 700, color: "#8a8a8a" }}>
        Brand kit
      </div>
      {/* type sample */}
      <div style={{ position: "absolute", left: PAD, top: 272 + 24 * (1 - ty), opacity: clamp(ty * 1.4),
        display: "flex", alignItems: "center", gap: 26 }}>
        <div style={{ fontSize: 82, fontWeight: 800, color: "#111", letterSpacing: -2, lineHeight: 1 }}>Aa</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 31, fontWeight: 800, color: "#111" }}>Headline · Bold</div>
          <div style={{ fontSize: 29, fontWeight: 500, color: "#777" }}>Body · Regular</div>
        </div>
      </div>
    </div>
  );
};

// the four colours: a dot on the pixel they were sampled from grows into its chip in the panel
const Chips: React.FC<{ t: number; fps: number; b: Beats; sw: Swatch[]; from?: Rect }> = ({ t, fps, b, sw, from }) => {
  if (t < b.brand) return null;
  const f = clamp(sp(t, b.brand, fps, CALM));
  const px0 = COL.x + panelDx(t, fps, b) + PAD, py = panelTop(t, fps, b) + SW_Y;
  return (
    <>
      {sw.slice(0, 4).map((s, k) => {
        const src = onPhoto(t, fps, b, s.px[0], s.px[1], from);
        const tx = px0 + k * (SWW + 14) + SWW / 2, ty = py + SWH / 2;
        const x = lerp(src.x, tx, f), y = lerp(src.y, ty, f), w = lerp(26, SWW, f), h = lerp(26, SWH, f);
        return (
          <React.Fragment key={k}>
            <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, zIndex: 10,
              background: s.hex, borderRadius: lerp(13, 0, clamp(f * 3)), boxSizing: "border-box",
              border: f < 0.9 ? `${4 * (1 - clamp(f * 2))}px solid #fff` : "1px solid rgba(0,0,0,0.08)",
              boxShadow: `0 ${12 * (1 - f)}px ${30 * (1 - f)}px rgba(0,0,0,0.45)` }} />
            <div style={{ position: "absolute", left: tx - SWW / 2, top: ty + SWH / 2 + 10, width: SWW, zIndex: 10,
              textAlign: "center", fontFamily: JAKARTA, fontWeight: 700, fontSize: 29, color: "#222", letterSpacing: -0.6,
              opacity: clamp((f - 0.75) / 0.25) }}>{s.hex.toUpperCase()}</div>
          </React.Fragment>
        );
      })}
    </>
  );
};

// the wordmark leaves the wall in the photo and lands in the panel header
const Wordmark: React.FC<{ t: number; fps: number; b: Beats; src: string; from?: Rect }> = ({ t, fps, b, src, from }) => {
  const at = b.own + 150;
  if (t < at) return null;
  const f = clamp(sp(t, at, fps, CALM));
  const s = onPhoto(t, fps, b, WM_SRC.x + WM_SRC.w / 2, WM_SRC.y + WM_SRC.h / 2, from);
  const sw = WM_SRC.w * s.k, sh = WM_SRC.h * s.k;
  const tx = COL.x + panelDx(t, fps, b) + WM.x + WM.w / 2, ty = panelTop(t, fps, b) + WM.y + WM.h / 2;
  const w = lerp(sw, WM.w, f), h = lerp(sh, WM.h, f);
  return (
    <Img src={staticFile(src)} style={{ position: "absolute", left: lerp(s.x, tx, f) - w / 2,
      top: lerp(s.y, ty, f) - h / 2, width: w, height: h, zIndex: 11, opacity: clamp(f * 2.5) }} />
  );
};

const EmptyBox: React.FC<{ t: number; fps: number; b: Beats }> = ({ t, fps, b }) => {
  if (t < b.not) return null;
  const e = sp(t, b.not, fps, CALM);
  const g = clamp((t - b.blank) / 240), gg = g * g * (3 - 2 * g);
  const caret = t < b.blank && Math.floor((t - b.not) / 450) % 2 === 0;
  const top = CY - (PH + GAP + BH) / 2 + PH + GAP;
  const txt = lerp(163, 196, gg);
  return (
    <div style={{ position: "absolute", left: COL.x, top: top + 70 * (1 - e), width: COL.w, height: BH,
      opacity: clamp(e * 1.6), fontFamily: JAKARTA,
      background: `rgb(${lerp(255, 226, gg)},${lerp(255, 226, gg)},${lerp(255, 226, gg)})`,
      boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 6px 16px rgba(0,0,0,0.3)" }}>
      <div style={{ position: "absolute", left: 34, top: 30, display: "flex", alignItems: "center",
        fontSize: 40, fontWeight: 600, color: `rgb(${txt},${txt},${txt})` }}>
        <div style={{ width: 4, height: 46, background: "#111", marginRight: 6, opacity: caret ? 1 : 0 }} />
        <div style={{ position: "relative" }}>
          Ask anything
          <div style={{ position: "absolute", left: -4, top: "52%", height: 5, width: `calc(${gg * 100}% + 8px)`,
            background: "#E07850", opacity: g > 0 ? 1 : 0 }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 30, bottom: 24, width: 56, height: 56, borderRadius: 28,
        border: "3px solid #dcdcdc", boxSizing: "border-box", color: "#8a8a8a", fontSize: 38,
        display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>+</div>
      <div style={{ position: "absolute", right: 30, bottom: 24, width: 56, height: 56, borderRadius: 28,
        background: "#d2d2d2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="28" height="28" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" stroke="#fff"
          strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  );
};

// from (h1b, the feed): the photo is drawn here, starting where the feed held it at OWN.
// solo (h1v03-v10, nothing before it): the photo is drawn at its kit place and enters on its own (~300 ms)
export const OwnSurface: React.FC<{ t: number; fps: number; b: Beats; assets: string[]; sw: Swatch[]; from?: Rect;
  solo?: boolean }> = ({ t, fps, b, assets, sw, from, solo }) => {
    if (t < b.own) return null;
    if (solo) from = PHOTO;
    const r = from ? rectAt(t, fps, b, from) : null;
    const pe = solo ? clamp(sp(t, b.own, fps, CALM)) : 1;
    return (
      <>
        {r && (
          <div style={{ position: "absolute", left: r.x - r.w / 2, top: r.y - r.h / 2, width: r.w, height: r.h,
            overflow: "hidden", zIndex: 5, boxShadow: "0 14px 34px rgba(0,0,0,0.55)",
            opacity: clamp(pe * 1.8), transform: `translateY(${40 * (1 - pe)}px) scale(${0.92 + 0.08 * pe})` }}>
            <Img src={staticFile(pick(assets, "skims-3755019.jpg"))} style={{ width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "50% 30%" }} />
          </div>
        )}
        <Panel t={t} fps={fps} b={b} />
        <EmptyBox t={t} fps={fps} b={b} />
        <Chips t={t} fps={fps} b={b} sw={sw} from={from} />
        <Wordmark t={t} fps={fps} b={b} src={pick(assets, "famA-skims-wordmark.png")} from={from} />
      </>
    );
  };

// the whole hook-1 surface: a slow push from OWN, and a fast calm exit into B1 at `out`
export const surfaceTransform = (t: number, b: Beats) => {
  const push = 1 + 0.02 * clamp((t - b.own) / (b.out - b.own));
  const e = clamp((t - (b.out - 150)) / 150), e2 = e * e;
  return { transform: `scale(${push * (1 - 0.05 * e2)}) translateY(${-20 * e2}px)`, opacity: 1 - e };
};
