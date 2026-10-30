import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { ACCENT } from "./theme";

// "they barely read it": a real page, and on the beat everything but a few
// lines fades to white; the kept lines stay bright with a terracotta tint.
// beats: { dim }; keep = line rects in asset device px; offset = device px
// of the page scrolled under the card's top edge (static).
export const DimRead: React.FC<{
  tMs: number; w: number; h: number;
  beats: { dim: number };
  img: string; imgW: number; imgH: number;
  keep: { y: number; h: number }[];
  offset?: number;
}> = ({ tMs, w, h, beats, img, imgW, keep, offset = 0 }) => {
  const s = w / imgW;
  const p = interpolate(tMs, [beats.dim, beats.dim + 480], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const pad = 8; // device px around a kept line
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: "#fff" }}>
      <Img src={staticFile(img)} style={{ position: "absolute", left: 0, top: -offset * s, width: w }} />
      <div style={{ position: "absolute", inset: 0, backgroundColor: "#ffffff", opacity: 0.86 * p }} />
      {keep.map((r, i) => {
        const top = (r.y - pad - offset) * s;
        const hh = (r.h + 2 * pad) * s;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: 0, top, width: w, height: hh, overflow: "hidden" }}>
              <Img src={staticFile(img)} style={{ position: "absolute", left: 0, top: -(r.y - pad) * s, width: w }} />
            </div>
            <div style={{
              position: "absolute", left: 0, top, width: w, height: hh,
              backgroundColor: ACCENT, opacity: 0.24 * p, mixBlendMode: "multiply",
            }} />
          </React.Fragment>
        );
      })}
    </div>
  );
};
