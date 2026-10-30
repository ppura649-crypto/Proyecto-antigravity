import React from "react";
import { SOFT, microLabel, fade, type Box, px } from "./tokens";

// Her glass panel: white over the footage with a local backdrop blur, a 1 px hairline,
// radius 30-34, a wide soft shadow; the dark variant is her chat window. It arrives with a
// 4-frame opacity fade in place (XAFZ f256-259), never travels, and leaves on a cut.

export const Glass: React.FC<{
  box: Box; W: number; H: number;
  tMs: number; fromMs: number; fps: number;
  dark?: boolean; radius?: number; fadeFrames?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ box, W, H, tMs, fromMs, fps, dark, radius = 32, fadeFrames = 4, style, children }) => {
  const o = fade(tMs, fromMs, fadeFrames, fps);
  return (
    <div
      style={{
        position: "absolute",
        ...px(box, W, H),
        borderRadius: radius,
        backgroundColor: dark ? SOFT.dark : SOFT.glass,
        border: `1px solid ${dark ? SOFT.darkLine : SOFT.glassLine}`,
        boxShadow: SOFT.shadow,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        overflow: "hidden",
        opacity: o,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// header row: tracked uppercase label left, a right-aligned value, a thin rule under it
export const Header: React.FC<{
  left: string; right?: string; dark?: boolean; px?: number; pad?: number;
}> = ({ left, right, dark, px: size = 22, pad = 44 }) => {
  const ink = dark ? "rgba(255,255,255,0.78)" : SOFT.glassInk;
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
      <div
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: `${pad * 0.86}px ${pad}px 0 ${pad}px`, height: pad * 2.1,
        }}
      >
        <div style={microLabel(size, ink)}>{left}</div>
        {right ? <div style={{ ...microLabel(size, ink), letterSpacing: "0.12em" }}>{right}</div> : null}
      </div>
      <div style={{ margin: `0 ${pad}px`, height: 1, backgroundColor: dark ? SOFT.darkLine : SOFT.glassRule }} />
    </div>
  );
};

// macOS title bar: three dots left, a bold title, three rounded squares right (her Finder)
export const TitleBar: React.FC<{ title: string; pad?: number }> = ({ title, pad = 40 }) => (
  <div
    style={{
      position: "absolute", top: 0, left: 0, right: 0, height: pad * 2.2,
      display: "flex", alignItems: "center", padding: `0 ${pad * 0.6}px 0 ${pad * 0.7}px`,
      borderBottom: `1px solid ${SOFT.glassRule}`,
    }}
  >
    <div style={{ display: "flex", gap: 10, marginRight: pad * 0.7 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.72)" }} />
      ))}
    </div>
    <div style={{ fontFamily: SOFT.grotesque, fontWeight: 700, fontSize: 28, color: SOFT.glassInk, flex: 1 }}>{title}</div>
    <div style={{ display: "flex", gap: 8 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.42)" }} />
      ))}
    </div>
  </div>
);

// one pastel rounded bar (her timeline bar, radius ~10)
export const Bar: React.FC<{ w: number; h?: number; color: string; opacity?: number; style?: React.CSSProperties }> = ({
  w, h = 40, color, opacity = 1, style,
}) => <div style={{ width: w, height: h, borderRadius: 10, backgroundColor: color, opacity, flex: "none", ...style }} />;
