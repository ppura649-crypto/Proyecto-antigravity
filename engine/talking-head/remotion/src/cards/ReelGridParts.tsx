import React from "react";

// The pieces of the Instagram profile surface (ReelGrid.tsx): its own face, its three tab
// glyphs, and the play count that sits in the corner of every reel tile. Real grammar, drawn
// at card scale so the count reads at phone width instead of inheriting a screenshot's size.

// Instagram's own face: the system sans of the device it runs on.
export const IG_FONT = '-apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const IG_INK = "#1F1E1D";
export const IG_GREY = "#8E8E8E";
export const IG_HAIR = "#E8E5DD";

// how Instagram writes a play count: 2,084 / 61.9K / 468K / 2.1M, truncated, never rounded up
export const fmtPlays = (n: number): string => {
  if (n >= 1e6) return `${Math.floor(n / 1e5) / 10}M`;
  if (n >= 1e5) return `${Math.floor(n / 1e3)}K`;
  if (n >= 1e4) return `${Math.floor(n / 100) / 10}K`;
  return n.toLocaleString("en-US");
};

const SH = "drop-shadow(0px 1px 2px rgba(0,0,0,0.55))";

// the scrim Instagram lays under a cover's corner text, so a count on a bright frame still reads
export const TileScrim: React.FC<{ h: number }> = ({ h }) => (
  <div style={{
    position: "absolute", left: 0, right: 0, bottom: 0, height: h,
    background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.42) 100%)",
    pointerEvents: "none",
  }} />
);

// the tab row of a profile: posts, reels, tagged. Reels is the one that is open.
export const TabIcon: React.FC<{ kind: "grid" | "reels" | "tagged"; size: number; on: boolean }> = ({
  kind, size, on,
}) => {
  const c = on ? IG_INK : IG_GREY;
  const sw = on ? 2.1 : 1.8;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      {kind === "grid" && (
        <>
          <rect x={2.2} y={2.2} width={19.6} height={19.6} rx={2.4} />
          <line x1={8.7} y1={2.2} x2={8.7} y2={21.8} />
          <line x1={15.3} y1={2.2} x2={15.3} y2={21.8} />
          <line x1={2.2} y1={8.7} x2={21.8} y2={8.7} />
          <line x1={2.2} y1={15.3} x2={21.8} y2={15.3} />
        </>
      )}
      {kind === "reels" && (
        <>
          <rect x={2.2} y={2.2} width={19.6} height={19.6} rx={5} />
          <line x1={2.2} y1={8.4} x2={21.8} y2={8.4} />
          <line x1={8.6} y1={2.3} x2={5.0} y2={8.4} />
          <line x1={15.6} y1={2.3} x2={12.0} y2={8.4} />
          <path d="M10.2 11.9 L16.2 15.1 L10.2 18.3 Z" fill={c} />
        </>
      )}
      {kind === "tagged" && (
        <>
          <rect x={2.2} y={2.2} width={19.6} height={19.6} rx={5} />
          <circle cx={12} cy={9.9} r={3.1} />
          <path d="M6.6 20.4 C 7.9 15.9, 16.1 15.9, 17.4 20.4" />
        </>
      )}
    </svg>
  );
};

// bottom-left of a reel tile: the play glyph and the real number of plays, white on the frame
export const PlayCount: React.FC<{ n: number; fs: number; pad: number }> = ({ n, fs, pad }) => {
  const g = fs * 0.92;
  return (
    <div style={{
      position: "absolute", left: pad, bottom: pad * 0.86,
      display: "flex", alignItems: "center", gap: fs * 0.24,
    }}>
      <svg width={g} height={g} viewBox="0 0 24 24" style={{ display: "block", filter: SH }}>
        <path d="M7.5 4.4 L19.4 12 L7.5 19.6 Z" fill="#FFFFFF" />
      </svg>
      <span style={{
        fontFamily: IG_FONT, fontSize: fs, fontWeight: 600, color: "#FFFFFF",
        letterSpacing: 0.1, lineHeight: 1, textShadow: "0px 1px 3px rgba(0,0,0,0.62)",
        fontVariantNumeric: "tabular-nums",
      }}>{fmtPlays(n)}</span>
    </div>
  );
};
