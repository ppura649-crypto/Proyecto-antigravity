import React from "react";
import { Easing, Img, interpolate, spring, staticFile } from "remotion";
import { ACCENT, CARD_BG, INK, LABEL_FONT, MONO_FONT } from "./theme";

// "they only skim pieces from a few pages to save tokens": four real pages pop
// in, everything but two lines of each greys out, the eight torn lines fly
// into one context window and ENLARGE on the way so they read as real text,
// and the token counter stops early. beats: { pagesIn, tear, fly, stop };
// pages[i] = { src, w, h, tears:[{y,h},{y,h}] } (asset device px)
export type SkimPage = { src: string; w: number; h: number; tears: { y: number; h: number }[] };

const PAD = 5;
const ease = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing: Easing.out(Easing.cubic) };

export const Skim: React.FC<{
  tMs: number; w: number; h: number; fps: number;
  beats: { pagesIn: number; tear: number; fly: number; stop: number };
  pages: SkimPage[];
  tokens?: number;
}> = ({ tMs, w, h, fps, beats, pages, tokens = 2140 }) => {
  const n = pages.length;
  const gap = 0.03 * w;
  const tw = (w - (n + 1) * gap) / n;   // thumbnail width
  const thumbTop = 0.05 * h;
  const th = 0.33 * h;
  const winTop = 0.42 * h;
  const winH = 0.545 * h;
  const fw = 0.86 * w;                   // a landed fragment: the page line at readable scale
  const fx = 0.07 * w;

  const tear = interpolate(tMs, [beats.tear, beats.tear + 420], [0, 1], ease);
  const count = Math.round(interpolate(tMs, [beats.fly, beats.stop], [0, tokens], ease));
  const stopped = tMs >= beats.stop;

  // landing rows, in flight order (page i, tear t -> k = 2i + t)
  const frags = pages.flatMap((pg, i) => pg.tears.map((r, t) => ({ pg, i, r, t, k: 2 * i + t })));
  let y = winTop + 0.09 * h;
  const rowY: number[] = [];
  for (const f of frags) { rowY[f.k] = y; y += (f.r.h + 2 * PAD) * (fw / f.pg.w) + 0.01 * h; }

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#ffffff", overflow: "hidden" }}>
      {pages.map((pg, i) => {
        const s = tw / pg.w;
        const x = gap + i * (tw + gap);
        const frame = ((tMs - (beats.pagesIn + i * 70)) / 1000) * fps;
        if (frame < 0) return null;
        const pop = spring({ frame, fps, config: { damping: 16, stiffness: 320, mass: 0.7 } });
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: thumbTop, width: tw, height: th, overflow: "hidden",
            border: "1px solid #d0d7de", boxShadow: "0 3px 10px rgba(0,0,0,0.12)", backgroundColor: "#fff",
            transform: `scale(${0.9 + 0.1 * pop})`, opacity: Math.min(1, frame / 1.5),
          }}>
            <Img src={staticFile(pg.src)} style={{ position: "absolute", left: 0, top: 0, width: tw }} />
            <div style={{ position: "absolute", inset: 0, backgroundColor: "#fff", opacity: 0.84 * tear }} />
            {pg.tears.map((r, t) => {
              const flyAt = beats.fly + (2 * i + t) * 90;
              if (tMs >= flyAt || tear <= 0) return null;   // once it flies, the slot is empty
              return (
                <div key={t} style={{ position: "absolute", left: 0, top: (r.y - PAD) * s, width: tw, height: (r.h + 2 * PAD) * s, overflow: "hidden" }}>
                  <Img src={staticFile(pg.src)} style={{ position: "absolute", left: 0, top: -(r.y - PAD) * s, width: tw }} />
                  <div style={{ position: "absolute", inset: 0, backgroundColor: ACCENT, opacity: 0.26 * tear, mixBlendMode: "multiply" }} />
                </div>
              );
            })}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: gap, top: winTop, width: w - 2 * gap, height: winH, backgroundColor: CARD_BG }}>
        <div style={{ position: "absolute", left: 0.03 * w, top: 0.02 * h, fontFamily: LABEL_FONT, fontSize: 0.017 * w, letterSpacing: "0.09em", textTransform: "uppercase", color: INK }}>
          context window
        </div>
        <div style={{ position: "absolute", right: 0.03 * w, top: 0.016 * h, fontFamily: MONO_FONT, fontSize: 0.026 * w, color: stopped ? ACCENT : INK }}>
          {count.toLocaleString("en-US")} tokens
        </div>
      </div>
      {frags.map(({ pg, i, r, t, k }) => {
        const flyAt = beats.fly + k * 90;
        const q = interpolate(tMs, [flyAt, flyAt + 460], [0, 1], ease);
        if (q <= 0) return null;
        const s0 = tw / pg.w;
        const x0 = gap + i * (tw + gap);
        const W = tw + (fw - tw) * q;             // enlarges in flight
        const sc = W / pg.w;
        const hh = (r.h + 2 * PAD) * sc;
        const x = x0 + (fx - x0) * q;
        const yy = (thumbTop + (r.y - PAD) * s0) + (rowY[k] - (thumbTop + (r.y - PAD) * s0)) * q;
        return (
          <div key={`${i}-${t}`} style={{ position: "absolute", left: x, top: yy, width: W, height: hh, overflow: "hidden", backgroundColor: "#fff", boxShadow: q < 1 ? "0 8px 20px rgba(0,0,0,0.3)" : "none" }}>
            <Img src={staticFile(pg.src)} style={{ position: "absolute", left: 0, top: -(r.y - PAD) * sc, width: W }} />
            <div style={{ position: "absolute", inset: 0, backgroundColor: ACCENT, opacity: 0.26, mixBlendMode: "multiply" }} />
          </div>
        );
      })}
    </div>
  );
};
