import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { CARD_BG, LABEL_FONT, MONO_FONT, MUTED } from "./theme";

// "instead of snippets, your AI receives the entire page": takeover on white.
// Left, a snippet (three real lines cut out of the page) that greys out on
// the beat; an arrow; right, the entire page as r.jina.ai returns it, streaming
// down a dark panel under its real address. beats: { snippets, entire }
// img1 = the real page shot, keep = the snippet's line rect; img2 = markdown shot
const DARK = "#1f2328";

export const Entire: React.FC<{
  tMs: number; w: number; h: number;
  beats: { snippets: number; entire: number };
  img1: string; w1: number; keep: { y: number; h: number };
  img2: string; w2: number; address: string;
}> = ({ tMs, w, h, beats, img1, w1, keep, img2, w2, address }) => {
  const dim = interpolate(tMs, [beats.snippets, beats.snippets + 500], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const arrow = interpolate(tMs, [beats.entire - 250, beats.entire], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const live = tMs >= beats.entire;
  const scroll = live ? ((tMs - beats.entire) / 1000) * 800 : 0;
  const label = (c: string): React.CSSProperties => ({ fontFamily: LABEL_FONT, fontSize: 0.019 * w, letterSpacing: "0.09em", textTransform: "uppercase", color: c });
  // the snippet: the page at a readable scale, clipped to the column
  const colX = 0.04 * w, colW = 0.30 * w;
  const pageW = 0.64 * w, s1 = pageW / w1, pad = 10;
  const snipH = (keep.h + 2 * pad) * s1;
  const snipTop = (h - snipH) / 2;
  const panX = 0.41 * w, panW = 0.55 * w, panTop = 0.14 * h, panH = 0.82 * h, bar = 0.075 * h;
  const s2 = panW / w2;
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#ffffff" }}>
      <div style={{ position: "absolute", left: colX, top: 0.06 * h, ...label(DARK) }}>snippet</div>
      <div style={{ position: "absolute", left: colX, top: snipTop, width: colW, height: snipH, overflow: "hidden", border: "1px solid #d0d7de", boxShadow: "0 3px 10px rgba(0,0,0,0.12)", filter: `grayscale(${dim}) opacity(${1 - 0.6 * dim})` }}>
        <Img src={staticFile(img1)} style={{ position: "absolute", left: 0, top: -(keep.y - pad) * s1, width: pageW }} />
      </div>
      {dim > 0 && (
        <div style={{ position: "absolute", left: colX, top: snipTop + snipH / 2, width: colW * dim, height: 4, backgroundColor: DARK, opacity: 0.85 }} />
      )}
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {arrow > 0 && (
          <>
            <line x1={0.355 * w} y1={0.5 * h} x2={0.355 * w + 0.04 * w * arrow} y2={0.5 * h} stroke={DARK} strokeWidth={5} strokeLinecap="round" />
            {arrow > 0.9 && <path d={`M ${0.383 * w} ${0.5 * h - 14} L ${0.397 * w} ${0.5 * h} L ${0.383 * w} ${0.5 * h + 14}`} fill="none" stroke={DARK} strokeWidth={5} strokeLinecap="round" />}
          </>
        )}
      </svg>
      <div style={{ position: "absolute", left: panX, top: panTop, width: panW, height: panH, backgroundColor: CARD_BG, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: panW, height: bar, borderBottom: "1px solid #2a2d33", display: "flex", alignItems: "center", paddingLeft: 0.02 * w, fontFamily: MONO_FONT, fontSize: 0.017 * w, color: MUTED, whiteSpace: "nowrap", overflow: "hidden" }}>
          {address}
        </div>
        {live && (
          <div style={{ position: "absolute", left: 0, top: bar, width: panW, height: panH - bar, overflow: "hidden" }}>
            <Img src={staticFile(img2)} style={{ position: "absolute", left: 0, top: -scroll * s2, width: panW }} />
          </div>
        )}
      </div>
      <div style={{ position: "absolute", left: panX, top: 0.06 * h, ...label(DARK), opacity: live ? 1 : 0.25 }}>the entire page</div>
    </div>
  );
};
