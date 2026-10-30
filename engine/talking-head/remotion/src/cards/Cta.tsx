import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, LABEL_FONT } from "./theme";
import { CtaLink } from "./CtaLink";

// CTA line above the captions: comment "RULES", swaps to save this video
// with the IG save bookmark above it, clicked by a cursor on the click beat.
// beats: { swap, click }

const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";

const Bookmark: React.FC<{
  tMs: number; width: number; height: number; fps: number;
  swap: number; click: number;
  // iconAbove (edit-c-evals, 2026-09-06 "make the icon just above the save this video"): the
  // bookmark sits right above the text line (textTop) instead of the fixed 0.148 H of reference edit A.
  // Off by default so reference edit A re-renders unchanged.
  iconAbove?: boolean; textTop: number;
}> = ({ tMs, width, height, fps, swap, click, iconAbove, textTop }) => {
  const size = 0.085 * width;
  const cx = width / 2;
  const iconTop = iconAbove ? textTop - 0.010 * height - size : 0.148 * height;
  const inPop = spring({
    frame: Math.max(0, ((tMs - swap) / 1000) * fps),
    fps, config: { damping: 14, stiffness: 280, mass: 0.7 },
  });
  const clicked = tMs >= click;
  const clickPop = spring({
    frame: Math.max(0, ((tMs - click) / 1000) * fps),
    fps, config: { damping: 11, stiffness: 320, mass: 0.6 },
  });
  // cursor glides in from bottom-right, lands on the icon just before the click
  const gp = interpolate(tMs, [swap + 250, click - 60], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const ease = 1 - Math.pow(1 - gp, 3);
  const curX = cx + 0.16 * width * (1 - ease) + size * 0.18;
  const curY = iconTop + size * 0.62 + 0.11 * height * (1 - ease);
  const press = clicked && (tMs - click) < 180;
  const iconScale = (0.85 + 0.15 * inPop) * (clicked ? 0.92 + 0.08 * clickPop : 1);

  return (
    <>
      <svg
        width={size} height={size} viewBox="0 0 24 24"
        style={{
          position: "absolute", left: cx - size / 2, top: iconTop,
          transform: `scale(${iconScale})`,
          opacity: Math.min(1, inPop * 2),
          filter: "drop-shadow(0px 2px 5px rgba(0,0,0,0.85))",
        }}
      >
        <path
          d="M5.5 2.75h13v18.5l-6.5-5.1-6.5 5.1z"
          fill={clicked ? "#ffffff" : "none"}
          stroke="#ffffff" strokeWidth={1.9} strokeLinejoin="round"
        />
      </svg>
      {gp > 0 && (
        <svg
          width={size * 0.52} height={size * 0.66} viewBox="0 0 14 19"
          style={{
            position: "absolute", left: curX, top: curY,
            transform: `scale(${press ? 0.82 : 1})`,
            transformOrigin: "15% 10%",
            filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.7))",
          }}
        >
          <path
            d="M1 1 L1 15.4 L4.6 12.1 L7 17.8 L9.7 16.6 L7.3 11 L12 10.6 Z"
            fill="#111111" stroke="#ffffff" strokeWidth={1.1}
          />
        </svg>
      )}
    </>
  );
};

export const Cta: React.FC<{
  tMs: number; width: number; height: number; fps: number;
  fromMs: number; beats: { swap: number; click?: number }; keyword: string;
  accentFontFamily: string; yFrac?: number;
  // flat: the whole line in the caption font, one size, white (their 2026-09-03 spec)
  flat?: { fontFamily: string; fontWeight: number; fontSizePx: number; uppercase: boolean };
  labelFont?: string; // the plain words ("comment", "this video") wear the caption word font
  // the second line in THEIR words (edit-c-chip: "follow" / "for more"): no bookmark, no click
  second?: { accent: string; plain: string };
  iconAbove?: boolean; // the bookmark just above "save this video" (edit-c-evals)
  // mode "link" (reference edit G, 2026-09-10): the ask is a link, not a comment keyword. One flat
  // line and a drawn arrow that bounces down on `below`. Everything else is untouched.
  mode?: "link";
  below?: number;
}> = ({ tMs, width, height, fps, fromMs, beats, keyword, accentFontFamily, yFrac, flat, labelFont, second, iconAbove, mode, below }) => {
  const LABEL = labelFont ?? LABEL_FONT;
  if (mode === "link") {
    return (
      <CtaLink
        tMs={tMs} width={width} height={height} fps={fps} fromMs={fromMs}
        text={keyword} top={(yFrac ?? 0.24) * height} below={below}
        flat={flat} labelFont={LABEL}
      />
    );
  }
  const phase2 = tMs >= beats.swap;
  const start = phase2 ? beats.swap : fromMs;
  const pop = spring({
    frame: Math.max(0, ((tMs - start) / 1000) * fps),
    fps,
    config: { damping: 15, stiffness: 260, mass: 0.7 },
  });
  const base = 0.056 * width;
  const flatCss: React.CSSProperties | undefined = flat && {
    fontFamily: flat.fontFamily, fontWeight: flat.fontWeight, fontSize: flat.fontSizePx,
    color: "#ffffff", textTransform: flat.uppercase ? "uppercase" : undefined,
  };

  return (
    <>
    {phase2 && beats.click && !second && (
      <Bookmark tMs={tMs} width={width} height={height} fps={fps} swap={beats.swap} click={beats.click}
        iconAbove={iconAbove} textTop={(yFrac ?? 0.24) * height} />
    )}
    <div
      style={{
        position: "absolute",
        top: (yFrac ?? 0.24) * height,
        left: 0,
        width: "100%",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "center",
        gap: "0.45em",
        transform: `scale(${0.9 + 0.1 * pop})`,
        opacity: Math.min(1, pop * 2),
      }}
    >
      {phase2 ? (
        <>
          <span style={{ fontFamily: accentFontFamily, fontSize: base * 1.25, color: ACCENT, textShadow: SHADOW, ...flatCss }}>
            {second?.accent ?? "save"}
          </span>
          <span style={{ fontFamily: LABEL, fontSize: base, color: "#ffffff", textShadow: SHADOW, ...flatCss }}>
            {second?.plain ?? "this video"}
          </span>
        </>
      ) : (
        <>
          <span style={{ fontFamily: LABEL, fontSize: base, color: "#ffffff", textShadow: SHADOW, ...flatCss }}>
            comment
          </span>
          <span style={{ fontFamily: accentFontFamily, fontSize: base * 1.35, color: ACCENT, textShadow: SHADOW, ...flatCss }}>
            “{keyword}”
          </span>
        </>
      )}
    </div>
    </>
  );
};
