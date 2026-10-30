import React from "react";
import { spring } from "remotion";
import { ACCENT, CARD_BG, INK, LABEL_FONT, MONO_FONT, MUTED } from "./theme";

// A terminal whose lines appear on their own times (a run streaming, a setup
// being typed). Auto-scrolls so the newest line stays in view. Text on black
// is white; MUTED is near-white; terracotta for the lines that matter.
// tone "struck" (edit-c-qa V12, 2026-09-06, additive): the same line again, MUTED and
// line-through, so a question the run just answered reads as crossed out. Nothing else changes.
export type TermLine = { atMs: number; text: string; tone?: "ink" | "muted" | "accent" | "struck"; typeMs?: number; struckAtMs?: number };

// stamp (edit-c-evals, 2026-09-06): a tilted accent word slammed over the window on its word
// ("UNTESTED" on "testing"). Off unless the event carries one.
export type TermStamp = { atMs: number; text: string };

export const Term: React.FC<{ tMs: number; w: number; h: number; lines: TermLine[]; fontPx?: number; title?: string; chrome?: boolean; stamp?: TermStamp; fps?: number }> = ({
  tMs, w, h, lines, fontPx, title, chrome, stamp, fps = 30,
}) => {
  const stampOn = stamp && tMs >= stamp.atMs;
  const stampPop = stampOn ? spring({ frame: Math.max(0, ((tMs - stamp!.atMs) / 1000) * fps), fps, config: { damping: 12, stiffness: 420, mass: 0.6 } }) : 0;
  const fs = fontPx ?? 0.024 * w;
  const lh = fs * 1.55;
  const pad = 0.04 * w;
  const shown = lines.filter((l) => tMs >= l.atMs);
  const tab = title ? lh * 1.6 : 0;
  const total = shown.length * lh;
  const avail = h - 2 * pad - tab;
  // a line with typeMs types itself out character by character
  const visible = (l: TermLine) =>
    l.typeMs ? l.text.slice(0, Math.ceil(l.text.length * Math.min(1, (tMs - l.atMs) / l.typeMs))) : l.text;
  const typing = shown.some((l) => l.typeMs && tMs - l.atMs < l.typeMs);
  const shift = Math.max(0, total - avail);
  const color = (t?: string) => (t === "accent" ? ACCENT : t === "muted" || t === "struck" ? MUTED : INK);
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: CARD_BG, overflow: "hidden" }}>
      {title && (
        <div style={{ position: "absolute", left: 0, top: 0, width: w, height: tab + pad * 0.6, borderBottom: "1px solid #2a2d33", display: "flex", alignItems: "center", paddingLeft: pad, gap: pad * 0.4, fontFamily: MONO_FONT, fontSize: fs * 0.9, color: MUTED, backgroundColor: chrome ? "#2b2b2b" : CARD_BG, zIndex: 2 }}>
          {chrome && ["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: fs * 0.62, height: fs * 0.62, borderRadius: "50%", background: c }} />
          ))}
          <span style={{ marginLeft: chrome ? pad * 0.4 : 0 }}>{title}</span>
        </div>
      )}
      <div style={{ position: "absolute", left: pad, right: pad, top: pad + tab - shift, fontFamily: MONO_FONT, fontSize: fs, lineHeight: `${lh}px`, whiteSpace: "pre", zIndex: 1 }}>
        {shown.map((l, i) => (
          <div key={i} style={{ color: color(l.struckAtMs && tMs >= l.struckAtMs ? "struck" : l.tone), overflow: "hidden", textOverflow: "ellipsis", textDecoration: l.tone === "struck" || (l.struckAtMs && tMs >= l.struckAtMs) ? "line-through" : undefined }}>{visible(l)}</div>
        ))}
        {shown.length > 0 && (typing || tMs - shown[shown.length - 1].atMs < 600) && (
          <div style={{ display: "inline-block", width: fs * 0.55, height: fs * 1.1, backgroundColor: INK, verticalAlign: "text-bottom" }} />
        )}
      </div>
      {stampOn && (
        <div style={{
          position: "absolute", left: "50%", top: "50%", zIndex: 3,
          transform: `translate(-50%, -50%) rotate(-12deg) scale(${1.6 - 0.6 * stampPop})`,
          opacity: Math.min(1, stampPop * 1.5),
          padding: `${fs * 0.35}px ${fs * 0.9}px`,
          border: `${Math.max(3, fs * 0.16)}px solid ${ACCENT}`, color: ACCENT,
          fontFamily: LABEL_FONT, fontWeight: 700, fontSize: fs * 2.6, letterSpacing: "0.06em",
          textShadow: "0px 2px 8px rgba(0,0,0,0.6)", whiteSpace: "nowrap",
        }}>{stamp!.text}</div>
      )}
    </div>
  );
};
