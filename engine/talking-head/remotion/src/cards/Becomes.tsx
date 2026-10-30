import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { ACCENT, LABEL_FONT } from "./theme";

// "This becomes this" takeover on white: the literal rules dim and compress,
// an arrow draws down, the distilled high-level pattern wipes in.
// beats: { becomes }; asset = rules PNG, asset2 = pattern PNG (both HTML shots)

const DARK = "#1f2328";

export const Becomes: React.FC<{
  tMs: number; w: number; h: number;
  beats: { becomes: number };
  img1: string; w1: number; h1: number;
  img2: string; w2: number; h2: number;
}> = ({ tMs, w, h, beats, img1, w1, h1, img2, w2, h2 }) => {
  const imgW = 0.86 * w;
  const x = 0.07 * w;
  const d1 = (imgW / w1) * h1;
  const d2 = (imgW / w2) * h2;

  const p = interpolate(tMs, [beats.becomes, beats.becomes + 900], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const arrowP = interpolate(p, [0, 0.45], [0, 1], { extrapolateRight: "clamp" });
  const wipe = interpolate(p, [0.3, 1], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const labelStyle = (color: string): React.CSSProperties => ({
    fontFamily: LABEL_FONT,
    fontSize: 0.02 * w,
    letterSpacing: "0.09em",
    textTransform: "uppercase",
    color,
  });

  const rulesTop = 0.065 * h;
  const arrowTop = rulesTop + d1 + 0.012 * h;
  const arrowH = 0.055 * h;
  const patternTop = arrowTop + arrowH + 0.035 * h;

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#ffffff" }}>
      <div style={{ position: "absolute", left: x, top: 0.022 * h, ...labelStyle(DARK) }}>
        your rules
      </div>
      <Img
        src={staticFile(img1)}
        style={{
          position: "absolute",
          left: x,
          top: rulesTop,
          width: imgW,
          filter: p > 0 ? `grayscale(${p}) opacity(${1 - 0.55 * p})` : undefined,
          transform: `scale(${1 - 0.03 * p})`,
          transformOrigin: "50% 0%",
        }}
      />
      {/* arrow down + becomes */}
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {arrowP > 0 && (
          <>
            <line
              x1={0.5 * w} y1={arrowTop}
              x2={0.5 * w} y2={arrowTop + arrowH * arrowP}
              stroke={DARK} strokeWidth={5} strokeLinecap="round"
            />
            {arrowP > 0.92 && (
              <path
                d={`M ${0.5 * w - 15} ${arrowTop + arrowH - 16} L ${0.5 * w} ${arrowTop + arrowH + 2} L ${0.5 * w + 15} ${arrowTop + arrowH - 16}`}
                fill="none" stroke={DARK} strokeWidth={5} strokeLinecap="round"
              />
            )}
          </>
        )}
      </svg>
      {arrowP > 0.2 && (
        <div
          style={{
            position: "absolute",
            left: 0.5 * w + 0.03 * w,
            top: arrowTop + arrowH * 0.28,
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontSize: 0.026 * w,
            color: DARK,
            opacity: Math.min(1, (arrowP - 0.2) * 2.5),
          }}
        >
          becomes
        </div>
      )}
      {/* ghost slot where the pattern will land */}
      {wipe < 1 && (
        <div
          style={{
            position: "absolute",
            left: x,
            top: patternTop,
            width: imgW,
            height: d2,
            border: "2px dashed #cfcfcf",
            opacity: 1 - wipe,
          }}
        />
      )}
      {wipe > 0 && (
        <>
          <div style={{ position: "absolute", left: x, top: patternTop - 0.038 * h, ...labelStyle(ACCENT), opacity: Math.min(1, wipe * 2) }}>
            one high-level pattern
          </div>
          <Img
            src={staticFile(img2)}
            style={{
              position: "absolute",
              left: x,
              top: patternTop,
              width: imgW,
              clipPath: `inset(0 0 ${(1 - wipe) * 100}% 0)`,
              transform: `translateY(${(1 - wipe) * 0.02 * h}px)`,
            }}
          />
        </>
      )}
      {/* guard: hide any overflow below the card bottom */}
      <div style={{ position: "absolute", left: 0, right: 0, top: patternTop + d2 + 0.01 * h, bottom: -2, backgroundColor: "#ffffff" }} />
    </div>
  );
};
