import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { CARD_BG, INK, LABEL_FONT, MONO_FONT } from "./theme";

// "fixes exactly this": the context window from the skim card again, but now
// the entire page streams into it and the counter keeps climbing.
// asset = the page as r.jina.ai returns it (dark markdown shot), counter = {from,to}
export const Fill: React.FC<{
  tMs: number; w: number; h: number; fromMs: number; toMs: number;
  img: string; imgW: number; counter: { from: number; to: number };
  pxPerSec?: number;
}> = ({ tMs, w, h, fromMs, toMs, img, imgW, counter, pxPerSec = 900 }) => {
  const s = w / imgW;
  const head = 0.16 * h;
  const scroll = ((tMs - fromMs) / 1000) * pxPerSec * s;
  const count = Math.round(interpolate(tMs, [fromMs, toMs], [counter.from, counter.to], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }));
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CARD_BG, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: head, width: w, height: h - head, overflow: "hidden" }}>
        <Img src={staticFile(img)} style={{ position: "absolute", left: 0, top: -scroll, width: w }} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: head, backgroundColor: CARD_BG }} />
      <div style={{ position: "absolute", left: 0.04 * w, top: 0.05 * h, fontFamily: LABEL_FONT, fontSize: 0.018 * w, letterSpacing: "0.09em", textTransform: "uppercase", color: INK }}>
        context window
      </div>
      <div style={{ position: "absolute", right: 0.04 * w, top: 0.04 * h, fontFamily: MONO_FONT, fontSize: 0.028 * w, color: INK }}>
        {count.toLocaleString("en-US")} tokens
      </div>
    </div>
  );
};
