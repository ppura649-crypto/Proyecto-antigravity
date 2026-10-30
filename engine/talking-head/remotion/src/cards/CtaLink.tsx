import React from "react";
import { spring } from "remotion";
import { LABEL_FONT } from "./theme";

// The link CTA (reference edit G V16, 2026-09-10): "so if this sounds interesting to you, click the
// link below." No comment keyword, no save swap, no bookmark and no cursor: the ask is the
// link, so the line is one flat caption-set phrase with a drawn arrow under it that bounces
// once, downward, on "below" and settles. Rendered by Cta when mode === "link"; the default
// comment/save path in Cta.tsx is untouched (reference edit A and reference edit D re-render from it).

const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";
const HALO = "drop-shadow(0px 2px 6px rgba(0,0,0,0.9)) drop-shadow(0px 8px 28px rgba(0,0,0,0.55))";

export const CtaLink: React.FC<{
  tMs: number; width: number; height: number; fps: number; fromMs: number;
  text: string; top: number; below?: number;
  flat?: { fontFamily: string; fontWeight: number; fontSizePx: number; uppercase: boolean };
  labelFont: string;
}> = ({ tMs, width, height, fps, fromMs, text, top, below, flat, labelFont }) => {
  const pop = spring({
    frame: Math.max(0, ((tMs - fromMs) / 1000) * fps),
    fps,
    config: { damping: 15, stiffness: 260, mass: 0.7 },
  });
  const fs = flat?.fontSizePx ?? 0.056 * width;
  const aw = 0.068 * width;
  const ah = aw * 0.92;
  const arrowTop = top + fs * 1.20 + 0.006 * height;

  // one bounce down and a settle: a damped swing that is exactly 0 before "below"
  // and back to 0 within ~450 ms, so nothing moves under the hold.
  const e = below !== undefined && tMs > below ? (tMs - below) / 1000 : 0;
  const dip = e > 0 ? 48 * Math.exp(-e / 0.11) * Math.sin((2 * Math.PI * e) / 0.34) : 0;

  const enter = { transform: `scale(${0.9 + 0.1 * pop})`, opacity: Math.min(1, pop * 2) };

  return (
    <>
      <div
        style={{
          position: "absolute", top, left: 0, width: "100%",
          display: "flex", alignItems: "baseline", justifyContent: "center",
          ...enter,
        }}
      >
        <span
          style={{
            fontFamily: flat?.fontFamily ?? labelFont ?? LABEL_FONT,
            fontWeight: flat?.fontWeight,
            fontSize: fs,
            textTransform: flat?.uppercase === false ? undefined : "uppercase",
            color: "#ffffff",
            textShadow: SHADOW,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      </div>
      <svg
        width={aw} height={ah} viewBox="0 0 40 37"
        style={{
          position: "absolute", left: width / 2 - aw / 2, top: arrowTop + dip,
          filter: HALO, ...enter,
        }}
      >
        <title>the link is below</title>
        <g fill="none" stroke="#ffffff" strokeWidth={5.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 3.4 V 27.2" />
          <path d="M7.6 21.2 L20 33.6 L32.4 21.2" />
        </g>
      </svg>
    </>
  );
};
