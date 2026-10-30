import React from "react";
import { blurStd, FONT } from "./M-util";
// One heavy counter drum (builder M): ten digit faces on a real cylinder (translateZ/rotateX), the faces above and
// below foreshortened and shaded by their angle, a thin specular line across the barrel, true vertical motion blur
// from the drum's own speed. `p` = continuous face index at the window centre (digit = p mod 10); rolling up as p grows.

const THETA = 36;
export const Drum: React.FC<{ p: number; pPrev: number; fs: number; w: number; id: string; color?: string }> = ({
  p, pPrev, fs, w, id, color = "#ffffff",
}) => {
  const FH = fs * 1.08;
  const R = FH / 2 / Math.tan((Math.PI / 180) * (THETA / 2));
  const WH = FH * 1.42;
  const std = blurStd(Math.abs(p - pPrev) * FH);
  const faces: React.ReactNode[] = [];
  for (let i = Math.floor(p) - 2; i <= Math.ceil(p) + 2; i++) {
    const a = (p - i) * THETA;
    if (Math.abs(a) > 82) continue;
    const shade = Math.pow(Math.cos((a * Math.PI) / 180), 1.8);
    const digit = ((i % 10) + 10) % 10;
    faces.push(
      <div key={i} style={{ position: "absolute", left: 0, top: (WH - FH) / 2, width: w, height: FH,
        transform: `translateZ(${-R}px) rotateX(${a}deg) translateZ(${R}px)`, backfaceVisibility: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center", color, opacity: 0.18 + 0.82 * shade,
        fontFamily: FONT, fontWeight: 700, fontSize: fs, lineHeight: 1, letterSpacing: "-0.02em",
        fontVariantNumeric: "tabular-nums" }}>
        {digit}
      </div>,
    );
  }
  return (
    <div style={{ position: "relative", width: w, height: WH, overflow: "hidden",
      background: "linear-gradient(180deg, #020203 0%, #121214 30%, #19191c 50%, #121214 70%, #020203 100%)",
      boxShadow: "inset 1px 0 0 rgba(255,255,255,0.05), inset -1px 0 0 rgba(0,0,0,0.8)" }}>
      {std > 0.6 && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="0" y="-30%" width="100%" height="160%"><feGaussianBlur stdDeviation={`0 ${std.toFixed(2)}`} /></filter>
        </svg>
      )}
      <div style={{ position: "absolute", inset: 0, filter: std > 0.6 ? `url(#${id})` : undefined }}>
        <div style={{ position: "absolute", inset: 0, perspective: fs * 9, perspectiveOrigin: "50% 50%" }}>{faces}</div>
      </div>
      {/* the barrel turning away top and bottom */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(180deg, rgba(2,2,3,0.96) 0%, rgba(2,2,3,0.35) 20%, rgba(2,2,3,0) 34%, rgba(2,2,3,0) 66%, rgba(2,2,3,0.35) 80%, rgba(2,2,3,0.96) 100%)" }} />
      {/* thin specular line across the barrel, just above the axis */}
      <div style={{ position: "absolute", left: 0, right: 0, top: WH * 0.3, height: Math.max(1, fs * 0.025), pointerEvents: "none",
        background: "linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.16) 45%, rgba(255,255,255,0.05))" }} />
    </div>
  );
};
export const drumH = (fs: number) => fs * 1.08 * 1.42;
