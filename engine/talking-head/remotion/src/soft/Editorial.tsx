import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "./Objects";
import { SOFT, fade, pop, microLabel, since, clamp01, type Box, px } from "./tokens";

// Her editorial card (XAFZ f447-599): off-white 0.083-0.917W x 0.323-0.586H, radius 28,
// hard cut in with the blur; a serif headline fades in 3 frames, the italic word 4 frames,
// a side panel slides open from its right edge in 5 frames, its rows fade in on their words.
export const Editorial: React.FC<
  CardProps & { eyebrow: string; head: string; word: string; copy: string; panel: string; rows: string[] }
> = (p) => {
  const box: Box = { x: 0.083, y: 0.323, w: 0.834, h: 0.263 };
  const b = px(box, p.W, p.H);
  const headO = fade(p.tMs, p.fromMs + 60, 3, p.fps);
  const wordO = fade(p.tMs, p.beats.word ?? p.fromMs + 150, 4, p.fps);
  const copyO = fade(p.tMs, p.beats.copy ?? p.fromMs + 400, 4, p.fps);
  const panelAt = p.beats.panel ?? p.toMs;
  const open = clamp01(since(p.tMs, panelAt, p.fps) / 5);
  const panelW = 0.34 * b.width;
  return (
    <div style={{ position: "absolute", ...b, borderRadius: 28, backgroundColor: SOFT.offWhite, boxShadow: SOFT.shadow, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 30, right: 36, ...microLabel(13, SOFT.cardMuted) }}>01 / 04</div>
      <div style={{ position: "absolute", top: 46, left: 52, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 26, height: 1, backgroundColor: SOFT.cardInk }} />
        <div style={microLabel(13, SOFT.cardInk)}>{p.eyebrow}</div>
      </div>
      <div style={{ position: "absolute", top: 96, left: 52, fontFamily: SOFT.serif, fontSize: 44, color: SOFT.cardInk, opacity: headO, lineHeight: 1 }}>{p.head}</div>
      <div style={{ position: "absolute", top: 142, left: 52, fontFamily: SOFT.serif, fontStyle: "italic", fontSize: 96, color: SOFT.cardInk, opacity: wordO, lineHeight: 1, letterSpacing: "-0.01em" }}>{p.word}</div>
      <div style={{ position: "absolute", top: 262, left: 52, width: 0.46 * b.width, height: 1, backgroundColor: SOFT.cardRule, opacity: copyO }} />
      <div style={{ position: "absolute", top: 284, left: 52, width: 0.46 * b.width, fontFamily: SOFT.grotesque, fontSize: 19, lineHeight: 1.45, color: SOFT.cardMuted, opacity: copyO }}>{p.copy}</div>
      {/* the side panel: anchored to the right edge, its width opens over 5 frames */}
      <div style={{ position: "absolute", top: 28, right: 28, bottom: 28, width: panelW * open, overflow: "hidden", borderRadius: 16, backgroundColor: SOFT.panel }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: panelW, height: "100%", padding: "24px 26px" }}>
          <div style={microLabel(12, SOFT.cardMuted)}>{p.panel}</div>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            {p.rows.map((r, i) => (
              <div
                key={i}
                style={{
                  opacity: fade(p.tMs, p.beats[`r${i + 1}`] ?? p.toMs, 3, p.fps), display: "flex", alignItems: "center", gap: 14,
                  padding: "10px 14px", borderRadius: 10, backgroundColor: "#f6f9f7", border: "1px solid rgba(34,38,31,0.10)",
                }}
              >
                <div style={{ ...microLabel(12, SOFT.cardMuted), letterSpacing: "0.08em" }}>0{i + 1}</div>
                <div style={{ fontFamily: SOFT.grotesque, fontWeight: 600, fontSize: 19, color: SOFT.cardInk, whiteSpace: "nowrap" }}>{r}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Real media in her rounded frame (XAFZ f926-1032): a white heading above with a short
// accent underline, a white double frame 0.098-0.902W x 0.258-0.584H radius 30 holding the
// real capture, a 3-frame pop from 0.85, the capture drifting slowly, everything on blur.
export const Proof: React.FC<
  CardProps & { heading: string; asset: string; assetW: number; scroll?: { from: number; to: number }; zoom?: number }
> = (p) => {
  const box: Box = { x: 0.098, y: 0.258, w: 0.804, h: 0.326 };
  const b = px(box, p.W, p.H);
  const sc = pop(p.tMs, p.fromMs, p.fps);
  const o = fade(p.tMs, p.fromMs, 3, p.fps);
  const headO = fade(p.tMs, p.fromMs + 60, 4, p.fps);
  const inset = 10;
  const innerW = b.width - 2 * inset;
  const k = (innerW / p.assetW) * (p.zoom ?? 1); // zoom > 1 reads the capture's headline, anchored left
  const t = clamp01((p.tMs - p.fromMs) / (p.toMs - p.fromMs));
  const y = p.scroll ? p.scroll.from + (p.scroll.to - p.scroll.from) * t : 0;
  return (
    <>
      <div style={{ position: "absolute", top: 0.19 * p.H, left: 0, width: p.W, textAlign: "center", opacity: headO }}>
        <div style={{ fontFamily: SOFT.grotesque, fontWeight: 600, fontSize: 40, color: SOFT.white, textShadow: SOFT.textShadow }}>{p.heading}</div>
        <div style={{ margin: "12px auto 0", width: 70, height: 3, borderRadius: 2, backgroundColor: SOFT.accent }} />
      </div>
      <div style={{ position: "absolute", ...b, borderRadius: 30, backgroundColor: SOFT.frame, boxShadow: SOFT.shadow, opacity: o, transform: `scale(${sc})` }}>
        <div style={{ position: "absolute", inset, borderRadius: 22, overflow: "hidden", backgroundColor: "#fff" }}>
          <Img src={staticFile(p.asset)} style={{ position: "absolute", top: -y * k, left: 0, width: p.assetW * k, display: "block" }} />
        </div>
      </div>
    </>
  );
};
