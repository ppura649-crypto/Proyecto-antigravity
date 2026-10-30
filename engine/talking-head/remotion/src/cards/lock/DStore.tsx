import React from "react";
import { Img, spring, staticFile } from "remotion";
import type { CardProps } from "../props";
import { ACCENT, LABEL_FONT, MONO_FONT } from "../theme";

// reference edit J V19 (famD), kind `dstore`: "free on my page in AIR Marketplace."
// A LIGHT card. At the top, three real clippings of the Air Market header
// (assets/airmarket-home.png, 2000x2400): the `AIR* Market` wordmark, the
// `Browse / Skills` links, and the `Search 1000 helpers...` field, each shown at
// 1:1 so the store's own type stays ~27 device px. The header is re-laid onto two
// rows (nav, then the field) because the real row is 1385 px wide and would have
// to shrink to 19 px type to fit a 994 px card: every pixel is the real page, only
// the dead gap between the links and the field is gone.
// Under it, one listing tile DRAWN in the store's grammar (it does not exist yet):
// their avatar as the creator, `agent-lock`, the store's `Checked by AIR` badge and
// a `Free` chip. No stats, nothing invented about the listing.
//   free 74946      the card pops whole, the Free chip lights terracotta
//   my 75246        the avatar swells once
//   page 75426      the name swells once
//   AIR 75966 -> Marketplace. 76146   the wordmark pushes to 1.10x and comes back

export type DStoreData = { tool?: string; badge?: string; chip?: string };

const SRC_W = 2000;
const SRC_H = 2400;
// the three real regions of the header, in the capture's own pixels
const R_MARK = { x: 100, y: 72, w: 194, h: 86 };
const R_NAV = { x: 338, y: 72, w: 256, h: 86 };
const R_FIELD = { x: 828, y: 70, w: 614, h: 92 };

const INK = "#031F19";      // the store's heading ink, sampled off the capture
const PINK = "#FFF3F1";     // its card fill
const RULE = "#E4E9E9";
const GREEN = "#5FBF86";    // the reel's tick green, never the store's mint
const PALE = "#E8F7EF";

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const swell = (t: number): number => Math.sin(Math.PI * clamp01(t));
const easeIO = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const Clip: React.FC<{
  src: string; r: { x: number; y: number; w: number; h: number };
  left: number; top: number; s: number; scale?: number; origin?: string;
}> = ({ src, r, left, top, s, scale = 1, origin = "left center" }) => (
  <div
    style={{
      position: "absolute", left, top, width: r.w * s, height: r.h * s,
      overflow: "hidden", transform: `scale(${scale})`, transformOrigin: origin,
    }}
  >
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute", left: -r.x * s, top: -r.y * s,
        width: SRC_W * s, height: SRC_H * s, maxWidth: "none",
      }}
    />
  </div>
);

export const DStore: React.FC<CardProps & { data: DStoreData }> = ({
  tMs, w, h, fps, fromMs, beats, assets, data,
}) => {
  const s = w / 994;                    // 1:1 against the capture at the planned card width
  const px = (n: number) => n * s;
  const [shot, avatar] = assets;
  const tool = data.tool ?? "agent-lock";
  const badge = data.badge ?? "Checked by AIR";
  const chip = data.chip ?? "Free";

  // the Free chip does not pop, it LIGHTS: pale wash -> full terracotta
  const lit = clamp01((tMs - (fromMs + 100)) / 220);
  // "my page": two small swells, the creator then the listing
  const avPulse = swell((tMs - (beats.my ?? 1e9)) / 380);
  const nmPulse = swell((tMs - (beats.page ?? 1e9)) / 380);
  // "AIR ... Marketplace.": the wordmark pushes and settles back
  const air = beats.air ?? 1e9;
  const mkt = beats.market ?? air + 180;
  const up = easeIO(clamp01((tMs - air) / Math.max(120, mkt - air)));
  const down = easeIO(clamp01((tMs - (mkt + 340)) / 320));
  const markScale = 1 + 0.10 * (up - down);

  const chipPop = spring({
    frame: Math.max(0, ((tMs - (fromMs + 60)) / 1000) * fps),
    fps, config: { damping: 14, stiffness: 300, mass: 0.7 },
  });

  const navTop = px(34);
  const fieldTop = navTop + px(86) + px(18);
  const ruleY = fieldTop + px(92) + px(26);
  const tileTop = ruleY + px(30);
  const tileH = px(216);
  const blockTop = tileTop + (tileH - px(104)) / 2;
  const AV = px(78);
  const textLeft = px(40 + 34) + AV + px(26);

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#FFFFFF" }}>
      {/* the real header, 1:1, on two rows */}
      <Clip src={shot} r={R_MARK} left={px(40)} top={navTop} s={s} scale={markScale} />
      <Clip src={shot} r={R_NAV} left={px(40 + 194 + 46)} top={navTop} s={s} />
      <Clip src={shot} r={R_FIELD} left={px(40)} top={fieldTop} s={s} />
      <div style={{ position: "absolute", left: px(40), width: w - px(80), top: ruleY, height: px(2), backgroundColor: RULE }} />

      {/* the listing, drawn in the store's grammar */}
      <div
        style={{
          position: "absolute", left: px(40), top: tileTop, width: w - px(80), height: tileH,
          backgroundColor: PINK, borderRadius: px(22),
        }}
      />
      <div
        style={{
          position: "absolute", left: px(74), top: blockTop + (px(104) - AV) / 2,
          width: AV, height: AV, borderRadius: AV / 2, overflow: "hidden",
          transform: `scale(${1 + 0.1 * avPulse})`,
        }}
      >
        <Img src={staticFile(avatar)} style={{ width: AV, height: AV, objectFit: "cover" }} />
      </div>
      <div
        style={{
          position: "absolute", left: textLeft, top: blockTop, height: px(46),
          display: "flex", alignItems: "center",
          fontFamily: MONO_FONT, fontWeight: 700, fontSize: px(38), color: INK,
          transform: `scale(${1 + 0.06 * nmPulse})`, transformOrigin: "left center",
        }}
      >
        {tool}
      </div>
      <div
        style={{
          position: "absolute", left: textLeft, top: blockTop + px(60), height: px(44),
          display: "inline-flex", alignItems: "center", gap: px(10),
          padding: `0 ${px(18)}px`, borderRadius: px(22), backgroundColor: PALE,
        }}
      >
        <svg width={px(22)} height={px(22)} viewBox="0 0 24 24">
          <title>checked</title>
          <path d="M4.6 12.6 L9.8 17.6 L19.4 7.0" fill="none" stroke={GREEN} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontFamily: LABEL_FONT, fontWeight: 600, fontSize: px(28), color: INK, letterSpacing: "0.01em" }}>
          {badge}
        </span>
      </div>
      <div
        style={{
          position: "absolute", right: px(74), top: tileTop + (tileH - px(52)) / 2,
          height: px(52), display: "inline-flex", alignItems: "center",
          padding: `0 ${px(30)}px`, borderRadius: px(26),
          backgroundColor: `rgba(224,120,80,${0.16 + 0.84 * lit})`,
          transform: `scale(${0.94 + 0.06 * chipPop})`,
          fontFamily: LABEL_FONT, fontWeight: 700, fontSize: px(32),
          letterSpacing: "0.04em", textTransform: "uppercase",
          color: lit > 0.5 ? "#FFFFFF" : ACCENT,
        }}
      >
        {chip}
      </div>
    </div>
  );
};
