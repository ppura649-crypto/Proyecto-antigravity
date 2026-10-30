import React from "react";
import { Img } from "remotion";
import type { CardProps } from "../props";
import { KINDS as HOLO_H } from "../holo/famH";
import { mix } from "./L-util";
// keyframes-v1 hooks, builder W (2026-09-25): the shared pieces of W1 (accordion) and W2 (flipbook): the word clock,
// the Holo title to NOW, paper, and the print that becomes their phone (a paper print whose margin turns into the
// black glass bezel, landing exactly on the geometry of L-reel's Phone so the swap to the playing video is seamless).

export const WB = { now: 1144, and: 1433, its: 1577, exactly: 1877, how: 1997, i: 2177, got: 2357, this: 2537 };
export type WBeats = typeof WB;
export const beatsW = (b: Record<string, number>): WBeats => ({ ...WB, ...(b as Partial<WBeats>) });

export const title = (props: CardProps & { data: any }, now: number) => {
  const T = HOLO_H["holo-h-title"]!;
  const d = props.data ?? {};
  return <T {...props} fromMs={props.fromMs} toMs={now}
    data={{ lines: d.lines ?? ["I don't edit", "my videos anymore."], fontPx: d.fontPx ?? 120 }} />;
};

// the phone's final geometry in the 1080 x 614 box (L-reel Phone 292 x 600, scaled PS about its top centre)
export const PS = 0.92, PH_TOP = 16;
export const PHONE = { w: 292 * PS, h: 600 * PS, cy: PH_TOP + 300 * PS, inset: 9 * PS, r: 48 * PS, ri: 40 * PS };

export const PAPER = "#f2eee6";
export const PAPER_EDGE = "#d8d2c5";

// the print: a paper page (margin mg, square) at m = 0, their phone (bezel, rounded glass) at m = 1
export const Print: React.FC<{ w: number; h: number; mg: number; m: number; src: string; light?: number; style?: React.CSSProperties }> = (
  { w, h, mg, m, src, light = 1, style },
) => {
  const inset = mix(mg, PHONE.inset * (w / PHONE.w), m);
  const r = PHONE.r * (w / PHONE.w) * m, ri = PHONE.ri * (w / PHONE.w) * m;
  const body = `rgb(${mix(242, 10, m)}, ${mix(238, 10, m)}, ${mix(230, 11, m)})`;
  return (
    <div style={{ position: "absolute", width: w, height: h, borderRadius: r, background: body, overflow: "hidden",
      boxShadow: m > 0 ? `0 0 0 ${3 * m}px rgba(58,58,62,${m}), 0 0 0 ${4 * m}px rgba(23,23,26,${m})` : undefined, ...style }}>
      {/* paper sheen on the margin, gone once it is glass */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - m,
        background: "linear-gradient(180deg, rgba(255,255,255,0.35), rgba(0,0,0,0.04) 60%, rgba(0,0,0,0.08))" }} />
      <div style={{ position: "absolute", left: inset, top: inset, right: inset, bottom: inset, borderRadius: ri, overflow: "hidden", background: "#000" }}>
        <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        {/* the print's gloss, then the glass */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(125deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 32%)" }} />
      </div>
      {light !== 1 && (
        <div style={{ position: "absolute", inset: 0, background: light < 1 ? `rgba(0,0,0,${(1 - light).toFixed(3)})` : `rgba(255,255,255,${(light - 1).toFixed(3)})` }} />
      )}
    </div>
  );
};
