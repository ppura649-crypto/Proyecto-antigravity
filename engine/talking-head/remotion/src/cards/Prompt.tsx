import React from "react";
import { interpolate } from "remotion";
import { ACCENT, INK, MONO_FONT } from "./theme";

// TEACHING card, the thing the creator tells you to type. A replica of Claude Code's
// input box (not a session, not a terminal): the ask types itself on the first
// line, then the two words land on their own line in terracotta and underline
// themselves. The creator 2026-09-04: "a visual can be: on task (you show one
// prompt)".
const BG = "#1B1A18";
const BORDER = "#3A3633";
const DIM = "#6B6660";
const MUTED_FG = "#8A857C";

export const Prompt: React.FC<{
  tMs: number; w: number; h: number;
  ask: string; words: string; // the ask, then the two words on their own line
  askAtMs: number; typeMs?: number; wordsAtMs: number; wordsMs?: number;
  hint?: string; model?: string;
}> = ({ tMs, w, h, ask, words, askAtMs, typeMs = 900, wordsAtMs, wordsMs = 420, hint, model }) => {
  const fs = 0.0385 * w;
  const pad = 0.029 * w;
  const boxPad = 0.027 * w;
  const lh = fs * 1.45;

  const cut = (s: string, at: number, ms: number) =>
    s.slice(0, Math.ceil(s.length * interpolate(tMs, [at, at + ms], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  const a = cut(ask, askAtMs, typeMs);
  const b = tMs >= wordsAtMs ? cut(words, wordsAtMs, wordsMs) : "";
  const rule = interpolate(tMs, [wordsAtMs + wordsMs, wordsAtMs + wordsMs + 320], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const caret = Math.floor(tMs / 500) % 2 === 0;

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: BG, padding: pad, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 0.012 * w, padding: boxPad, display: "flex", gap: 0.018 * w }}>
        <div style={{ fontFamily: MONO_FONT, fontSize: fs, lineHeight: `${lh}px`, color: MUTED_FG }}>{">"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: MONO_FONT, fontSize: fs, lineHeight: `${lh}px`, color: INK, whiteSpace: "pre" }}>{a}</div>
          <div style={{ fontFamily: MONO_FONT, fontSize: fs, lineHeight: `${lh}px`, color: ACCENT, whiteSpace: "pre", position: "relative", display: "inline-block" }}>
            {b}
            {caret && b.length === words.length && (
              <span style={{ display: "inline-block", width: fs * 0.55, height: fs, backgroundColor: ACCENT, verticalAlign: "-0.1em", marginLeft: 2 }} />
            )}
            {rule > 0 && (
              <div style={{ position: "absolute", left: 0, bottom: 0.055 * lh, height: 0.055 * fs + 1, width: `${rule * 100}%`, backgroundColor: ACCENT, opacity: 0.85 }} />
            )}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 0.55 * boxPad, paddingLeft: 0.006 * w, fontFamily: MONO_FONT, fontSize: fs * 0.62, color: DIM }}>
        <span>{hint ?? "? for shortcuts"}</span>
        <span>{model ?? "Opus 4.8"}</span>
      </div>
    </div>
  );
};
