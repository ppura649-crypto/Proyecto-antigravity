import React from "react";
import { Easing, Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { HOLO_FONT, RemapVideo, SHADOW, lerp, sp } from "./B-kit";
// B1 "Paste your link into Holo." Holo's real URL field (url-pill.mp4, from url-drop 1.0-4.6 s), cropped tight
// to the pill and scaled up to ~980 px wide, centred in its box. v2 round 2: a quick clean entrance (the hook's
// "Ask anything" box sits in the same place just before), `yourbrand.com` typed by ~6.75 s, the send arrow
// pressed on HOLO (dip, blue ripple, light sweep), then the finished field held to the hand-over.
// Exported API is stable (a recap may reuse it): optional `fieldW` sets the field width, `exit` false drops the exit.
// Round 3 (their "add the logo of holo maybe animated on the top"): with `data.logo` (event data) and the white mark
// as assets[1], Holo's real mark + the word "Holo" sit above the field as one centred unit, no plate behind them.
// The mark rises in just after the field; on HOLO it hops once and blinks, in sync with the send press.
const CROP = { x: 128, y: 214, w: 944, h: 172 }; // source px of the 1200x600 clip: the pill plus a thin blue margin
const ARROW = { x: 968, y: 300 };
const MARK = { w: 286, h: 221, eye: { x: 92, y: 62, w: 108, h: 84 } }; // holo-mark-white.png, the eyes' box
export const LOGO_H = 112, LOGO_GAP = 34; // device px: mark height, gap to the field

// Holo's mascot mark + name. Blink = the eye box squashed vertically; the ring is drawn with the eyes cut out.
const HoloLogo: React.FC<{ tMs: number; fps: number; at: number; beat: number; src: string }> = ({ tMs, fps, at, beat, src }) => {
  const k = LOGO_H / MARK.h, mw = MARK.w * k;
  const e = sp(tMs, at, fps);
  const hop = tMs < beat ? 0 : Math.sin(Math.min(1, (tMs - beat) / 320) * Math.PI);
  const blink = tMs < beat + 40 ? 1 : 1 - 0.9 * Math.sin(Math.min(1, (tMs - beat - 40) / 170) * Math.PI);
  const E = MARK.eye;
  const hole = `path(evenodd, "M0 0H${mw}V${LOGO_H}H0Z M${E.x * k} ${E.y * k}h${E.w * k}v${E.h * k}h${-E.w * k}Z")`;
  const img: React.CSSProperties = { position: "absolute", width: mw, height: LOGO_H };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 26, opacity: Math.min(1, e * 1.8),
      transform: `translateY(${(1 - e) * 22 - 14 * hop}px) scale(${1 + 0.07 * hop})`,
    }}>
      <div style={{ position: "relative", width: mw, height: LOGO_H, filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.45))" }}>
        <Img src={staticFile(src)} style={{ ...img, left: 0, top: 0, clipPath: hole }} />
        <div style={{ position: "absolute", left: E.x * k, top: E.y * k, width: E.w * k, height: E.h * k, overflow: "hidden" }}>
          <Img src={staticFile(src)} style={{ ...img, left: -E.x * k, top: -E.y * k, transformOrigin: `${E.x * k + (E.w * k) / 2}px ${(E.y + E.h / 2) * k}px`, transform: `scaleY(${blink})` }} />
        </div>
      </div>
      <div style={{ fontFamily: HOLO_FONT, fontWeight: 700, fontSize: 96, color: "#FFFFFF", letterSpacing: -2, lineHeight: 1, textShadow: "0 6px 18px rgba(0,0,0,0.45)" }}>Holo</div>
    </div>
  );
};

export const Paste: React.FC<CardProps & { data: any; fieldW?: number; exit?: boolean }> = ({
  tMs, w, h, fps, fromMs, toMs, beats, assets, data, fieldW, exit = true,
}) => {
  const logo = !!data?.logo && !!assets[1];
  const press = beats.holo ?? 6903;
  const typedBy = beats.typed ?? Math.min(fromMs + 750, press - 150);
  const W = fieldW ?? Math.min(w - 100, 980);
  const k = W / CROP.w;
  const H = CROP.h * k;
  const left = (w - W) / 2;
  const top = logo ? (h + LOGO_H + LOGO_GAP - H) / 2 : (h - H) / 2;

  const e = sp(tMs, fromMs, fps);
  const push = lerp(tMs, fromMs, toMs, 1, 1.015, Easing.linear);
  // press: a quick dip on the word, then a calm release
  const dip = tMs < press ? 0 : tMs < press + 90 ? (tMs - press) / 90 : 1 - sp(tMs, press + 90, fps);
  const ex = exit ? lerp(tMs, toMs - 120, toMs, 0, 1, Easing.in(Easing.cubic)) : 0;
  const scale = (0.97 + 0.03 * e) * push * (1 - 0.025 * dip) * (1 - 0.03 * ex);

  const rp = lerp(tMs, press, press + 420, 0, 1, Easing.out(Easing.cubic));
  const sweep = lerp(tMs, press + 20, press + 300, -0.3, 1.2, Easing.inOut(Easing.quad));
  const ax = (ARROW.x - CROP.x) * k;
  const ay = (ARROW.y - CROP.y) * k;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {logo && (
        <div style={{ position: "absolute", left: 0, right: 0, top: top - LOGO_GAP - LOGO_H, height: LOGO_H, display: "flex", justifyContent: "center", opacity: 1 - ex }}>
          <HoloLogo tMs={tMs} fps={fps} at={fromMs + 140} beat={press} src={assets[1]!} />
        </div>
      )}
      <div style={{
        position: "absolute", left, top, width: W, height: H, borderRadius: 0, overflow: "hidden",
        boxShadow: SHADOW, opacity: Math.min(1, e * 2) * (1 - ex),
        transform: `translateY(${(1 - e) * 16}px) scale(${scale})`,
      }}>
        <RemapVideo tMs={tMs} fps={fps} src={assets[0]!} segs={[
          { t0: fromMs, t1: typedBy, s0: 1.0, s1: 3.25 },
          { t0: typedBy, t1: toMs + 40, s0: 3.25, s1: 3.58 },
        ]} style={{ position: "absolute", left: -CROP.x * k, top: -CROP.y * k, width: 1200 * k, height: 600 * k }} />
        {/* light sweep across the field when it is sent */}
        {tMs >= press && sweep < 1.2 && (
          <div style={{
            position: "absolute", top: 0, bottom: 0, width: W * 0.28, left: sweep * W,
            background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.85), rgba(255,255,255,0))",
            transform: "skewX(-18deg)",
          }} />
        )}
        {/* the ripple off the send arrow */}
        {tMs >= press && rp < 1 && (
          <div style={{
            position: "absolute", left: ax - (26 + 120 * rp) * k, top: ay - (26 + 120 * rp) * k,
            width: 2 * (26 + 120 * rp) * k, height: 2 * (26 + 120 * rp) * k, borderRadius: "50%",
            border: `${6 - 4 * rp}px solid rgba(26,115,232,${0.75 * (1 - rp)})`,
            background: `rgba(26,115,232,${0.16 * (1 - rp)})`,
          }} />
        )}
      </div>
    </div>
  );
};
