import React from "react";
import { Img, interpolate, spring, staticFile } from "remotion";

// The sentence on top during the first hook sentence (the creator 2026-09-03, hard rule):
// people read this first. Letters land one by one over `revealMs`, the line holds for
// the sentence (3-4 s), optional real marks pop under it, then it leaves with a short
// fade. Looks: plain (white words, caption shadow), bubble (white pill, dark words) or
// label (the guest 2026-09-05: "black text on a white rectangular background fill, like a
// native Instagram text label" - a near-square corner, tight padding, no text shadow,
// and it is meant to be read complete at frame 0, so pair it with reveal "none").

export type TitleSpan = { text: string; fancy?: boolean };
export type TitleLogo = { src: string; w: number; h: number };
export type HookTitleProps = {
  tMs: number; fps: number; width: number; height: number;
  fromMs: number; toMs: number;
  lines: TitleSpan[][];
  reveal?: "letters" | "words" | "none";
  revealMs?: number;
  logos?: TitleLogo[];
  look?: "plain" | "bubble" | "label";
  exit?: "cut" | "fade"; // Creator Format 2: a hard cut removes it (measured 10/10), default the short fade
  lineHeight?: number; // default 1.15; Creator Format 2 1.05 (line pitch 1.45 x cap height)
  topFrac: number; fontPx: number; fancyScale: number; lineGapPx: number;
  fontFamily: string; fancyFontFamily: string; weight: number; color: string; shadow: string;
};

const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";

export const HookTitle: React.FC<HookTitleProps> = (p) => {
  const { tMs, fps, width, height, fromMs, toMs } = p;
  const reveal = p.reveal ?? "letters";
  const revealMs = p.revealMs ?? 1200;
  const bubble = p.look === "bubble";
  const plate = p.look === "label";
  const onPlate = bubble || plate;
  const scale = width / 1080;
  const fs = p.fontPx * scale;

  // one unit per letter (or word); each unit gets its own start time
  const units: { ch: string; li: number; fancy: boolean; idx: number }[] = [];
  let idx = 0;
  p.lines.forEach((ln, li) =>
    ln.forEach((sp) => {
      const parts = reveal === "words" ? sp.text.split(/(\s+)/) : Array.from(sp.text);
      parts.forEach((ch) => { if (ch) units.push({ ch, li, fancy: Boolean(sp.fancy), idx: idx++ }); });
    })
  );
  const n = Math.max(1, units.filter((u) => u.ch.trim()).length);
  const stepMs = reveal === "none" ? 0 : revealMs / n;
  let visibleIdx = 0;

  const out = p.exit === "cut" ? 1 : interpolate(tMs, [toMs - 220, toMs], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const unitStyle = (u: { ch: string; idx: number }): React.CSSProperties => {
    const k = u.ch.trim() ? visibleIdx++ : visibleIdx;
    const start = fromMs + k * stepMs;
    const s = spring({ frame: Math.max(0, ((tMs - start) / 1000) * fps), fps, config: { damping: 14, stiffness: 300, mass: 0.6 } });
    return {
      display: "inline-block",
      opacity: reveal === "none" ? 1 : Math.min(1, s * 1.6),
      transform: reveal === "none" ? undefined : `translateY(${(1 - s) * 0.35 * fs}px)`,
      whiteSpace: "pre",
    };
  };

  const logosAt = fromMs + (reveal === "none" ? 150 : revealMs) + 120;
  const logoSize = 0.13 * width;
  const logoGap = 0.035 * width;

  return (
    <div
      style={{
        position: "absolute", top: p.topFrac * height, left: 0, width: "100%",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: p.lineGapPx * scale, opacity: out,
        filter: out < 1 ? `blur(${(1 - out) * 10}px)` : undefined,
      }}
    >
      <div
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: p.lineGapPx * scale,
          padding: plate ? `${0.0085 * height}px ${0.026 * width}px`
            : bubble ? `${0.012 * height}px ${0.045 * width}px` : 0,
          backgroundColor: onPlate ? "#ffffff" : "transparent",
          borderRadius: plate ? 0.008 * width : bubble ? 0.03 * width : 0,
          boxShadow: plate ? "0 6px 22px rgba(0,0,0,0.18)"
            : bubble ? "0 10px 30px rgba(0,0,0,0.25)" : "none",
        }}
      >
        {p.lines.map((_, li) => (
          <div key={li} style={{ display: "flex", alignItems: "baseline", justifyContent: "center" }}>
            {units.filter((u) => u.li === li).map((u) => (
              <span
                key={u.idx}
                style={{
                  fontFamily: u.fancy ? p.fancyFontFamily : p.fontFamily,
                  fontWeight: p.weight,
                  fontSize: u.fancy ? fs * p.fancyScale : fs,
                  lineHeight: p.lineHeight ?? 1.15,
                  color: plate ? "#000000" : bubble ? "#111111" : p.color,
                  textShadow: onPlate ? "none" : p.shadow || SHADOW,
                  ...unitStyle(u),
                }}
              >
                {u.ch}
              </span>
            ))}
          </div>
        ))}
      </div>
      {p.logos && p.logos.length > 0 && (
        <div style={{ display: "flex", gap: logoGap, marginTop: 0.012 * height, alignItems: "center" }}>
          {p.logos.map((lg, i) => {
            const s = spring({ frame: Math.max(0, ((tMs - logosAt - i * 90) / 1000) * fps), fps, config: { damping: 12, stiffness: 280, mass: 0.7 } });
            const w = lg.w >= lg.h ? logoSize : (logoSize * lg.w) / lg.h;
            return (
              <Img
                key={i}
                src={staticFile(lg.src)}
                style={{ width: w, height: "auto", transform: `scale(${0.6 + 0.4 * s})`, opacity: Math.min(1, s * 1.5), filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.35))" }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
