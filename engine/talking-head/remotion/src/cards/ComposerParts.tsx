import React from "react";
import { Img, staticFile } from "remotion";
import { MONO_FONT } from "./theme";

// Parts for V14 (Composer.tsx): the real chat composer at remocn `claude-chat`
// geometry, drawn in ITS OWN stage px and scaled as one block so nothing inside
// is re-proportioned, plus the file sheets and the grab cursor that feed it.
// Colours are verbatim from cards/Before.tsx.

export const SANS = "Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif";

// remocn claude-chat, verbatim (Before.tsx)
export const CW = 860;
export const RADIUS = 24;
export const PROMPT_PAD_Y = 26, PROMPT_PAD_X = 28, PROMPT_MIN_H = 58, PROMPT_FS = 21;
export const CTRL_PAD_Y = 14, CTRL_PAD_X = 18, CTRL_FS = 18, CIRCLE = 36, SEND = 40;
export const BASE_H = 2 + (PROMPT_PAD_Y * 2 + PROMPT_MIN_H) + (CTRL_PAD_Y * 2 + SEND); // 180
// the attachment row the five files become
export const CHIP_H = 46, CHIP_FS = 17, CHIP_GAP = 8, CHIP_PAD = 11, CHIP_ICON = 20;
export const CHIPS_H = 16 + CHIP_H + 14; // 76

export type CTheme = {
  page: string; surface: string; border: string; ink: string; muted: string; ph: string;
  chipBg: string; chipBorder: string; btnLine: string; glyph: string;
  sendBg: string; sendInk: string; sendRadius: number; name: string; shadow: string;
};

export const CLAUDE_T: CTheme = {
  page: "#F5F4EF", surface: "#FFFFFF", border: "#E8E5DD", ink: "#1F1E1D", muted: "#73726C",
  ph: "#A3A097", chipBg: "#FBFAF7", chipBorder: "#E8E5DD", btnLine: "#E0DDD4", glyph: "#1F1E1D",
  sendBg: "#D97757", sendInk: "#FFFFFF", sendRadius: 10, name: "Claude",
  shadow: "0 8px 30px -12px rgba(31,30,29,0.14)",
};
export const GPT_T: CTheme = {
  page: "#212121", surface: "#2F2F2F", border: "#3D3D3D", ink: "#ECECEC", muted: "#A6A6A0",
  ph: "#9A9A94", chipBg: "#3A3A3A", chipBorder: "#4A4A4A", btnLine: "#4A4A4A", glyph: "#ECECEC",
  sendBg: "#FFFFFF", sendInk: "#111111", sendRadius: 999, name: "ChatGPT",
  shadow: "0 8px 30px -12px rgba(0,0,0,0.5)",
};

export const chipW = (n: string) =>
  2 + 2 * CHIP_PAD + CHIP_ICON + CHIP_GAP + Math.round(n.length * CHIP_FS * 0.6);

const Plus: React.FC<{ c: string }> = ({ c }) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <path d="M8 3.4V12.6M3.4 8H12.6" stroke={c} strokeWidth={1.6} strokeLinecap="round" />
  </svg>
);
const Chevron: React.FC<{ c: string }> = ({ c }) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <path d="M4 6.5L8 10.5L12 6.5" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Mic: React.FC<{ c: string }> = ({ c }) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <rect x={5.9} y={1.7} width={4.2} height={7.4} rx={2.1} stroke={c} strokeWidth={1.4} />
    <path d="M3.6 7.6v0.5a4.4 4.4 0 0 0 8.8 0V7.6" stroke={c} strokeWidth={1.4} strokeLinecap="round" />
    <path d="M8 12.5V14.4" stroke={c} strokeWidth={1.4} strokeLinecap="round" />
  </svg>
);
const ArrowUp: React.FC<{ c: string }> = ({ c }) => (
  <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <path d="M9 14.2V4.2" stroke={c} strokeWidth={1.9} strokeLinecap="round" />
    <path d="M4.4 8.6L9 4L13.6 8.6" stroke={c} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const FileGlyph: React.FC<{ s: number; c: string }> = ({ s, c }) => (
  <svg width={s} height={s * 1.24} viewBox="0 0 20 25" fill="none" style={{ display: "block", flex: "0 0 auto" }}>
    <path d="M2 2.6h9.4L18 8.9V22.4H2z" fill="none" stroke={c} strokeWidth={1.6} strokeLinejoin="round" />
    <path d="M11.4 2.6V9h6.6" fill="none" stroke={c} strokeWidth={1.6} strokeLinejoin="round" />
  </svg>
);

// a page with a folded corner, ruled lines, and its name under it like a file icon
export const Sheet: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const f = w * 0.22;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", filter: "drop-shadow(0 10px 18px rgba(31,30,29,0.22))" }}>
      <path d={`M0 0 H${w - f} L${w} ${f} V${h} H0 Z`} fill="#FFFFFF" stroke="#DDDAD1" strokeWidth={1.5} />
      <path d={`M${w - f} 0 V${f} H${w} Z`} fill="#EFEDE6" stroke="#DDDAD1" strokeWidth={1.5} strokeLinejoin="round" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i} x={w * 0.14} y={h * 0.40 + i * h * 0.085}
          width={(i === 5 ? 0.44 : 0.72) * w} height={Math.max(2, h * 0.026)} rx={1} fill="#DFDCD3"
        />
      ))}
    </svg>
  );
};

// the drag cursor: a closed hand holding the bundle
export const GrabHand: React.FC<{ s: number; open: number }> = ({ s, open }) => (
  <svg width={s} height={s * 1.15} viewBox="0 0 40 46" fill="none" style={{ display: "block", filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.35))" }}>
    <g fill="#FFFFFF" stroke="#1F1E1D" strokeWidth={2.2} strokeLinejoin="round">
      <rect x={7.5} y={17} width={25} height={22} rx={8} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={9 + i * 5.8} y={13 - open * 7} width={5} height={9 + open * 7} rx={2.4} />
      ))}
      <rect x={2.6} y={21.5} width={9.5} height={6} rx={3} />
    </g>
  </svg>
);

// the composer itself: everything below is in ITS OWN px, scaled as one block
export const Surface: React.FC<{
  th: CTheme; k: number; left: number; bottom: number; grow: number;
  files: string[]; chipIn: number[]; phOut: number;
  mark?: string; invert: boolean; markIn: number; markPx: number;
}> = ({ th, k, left, bottom, grow, files, chipIn, phOut, mark, invert, markIn, markPx }) => {
  const hStage = BASE_H + CHIPS_H * grow;
  const top = bottom - hStage * k;
  const circle: React.CSSProperties = {
    width: CIRCLE, height: CIRCLE, borderRadius: "50%", border: `1px solid ${th.btnLine}`,
    boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
  };
  return (
    <>
      {mark && (
        <Img
          src={staticFile(mark)}
          style={{
            position: "absolute", left: left + (CW * k - markPx) / 2, top: top - markPx - 20,
            width: markPx, height: markPx, filter: invert ? "invert(1)" : undefined,
            opacity: Math.min(1, markIn * 2.4), transform: `scale(${0.55 + 0.45 * markIn})`,
          }}
        />
      )}
      <div style={{ position: "absolute", left, top, width: CW * k, height: hStage * k }}>
        <div style={{ width: CW, height: hStage, transform: `scale(${k})`, transformOrigin: "top left", fontFamily: SANS }}>
          <div style={{
            position: "absolute", inset: 0, boxSizing: "border-box", backgroundColor: th.surface,
            border: `1px solid ${th.border}`, borderRadius: RADIUS, boxShadow: th.shadow, overflow: "hidden",
          }}>
            {grow > 0.02 && (
              <div style={{ position: "absolute", left: PROMPT_PAD_X, top: 16, display: "flex", gap: CHIP_GAP }}>
                {files.map((n, i) => (
                  <div key={n} style={{
                    width: chipW(n), height: CHIP_H, boxSizing: "border-box",
                    backgroundColor: th.chipBg, border: `1px solid ${th.chipBorder}`, borderRadius: 10,
                    display: "flex", alignItems: "center", gap: CHIP_GAP, paddingLeft: CHIP_PAD,
                    opacity: chipIn[i] ?? 0, transform: `scale(${0.82 + 0.18 * (chipIn[i] ?? 0)})`,
                  }}>
                    <FileGlyph s={CHIP_ICON} c={th.muted} />
                    <span style={{ fontFamily: MONO_FONT, fontSize: CHIP_FS, color: th.ink, whiteSpace: "nowrap" }}>{n}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{
              position: "absolute", left: 0, right: 0, top: CHIPS_H * grow,
              padding: `${PROMPT_PAD_Y}px ${PROMPT_PAD_X}px`, boxSizing: "content-box",
            }}>
              <div style={{ minHeight: PROMPT_MIN_H, fontSize: PROMPT_FS, lineHeight: 1.3, color: th.ph }}>
                <span style={{ opacity: 1 - phOut }}>
                  {th.name === "Claude" ? "How can I help you today?" : "Ask anything"}
                </span>
                {/* the files are in, the field is empty and waiting */}
                <span style={{
                  position: "absolute", left: PROMPT_PAD_X, top: PROMPT_PAD_Y + 2,
                  width: 2, height: PROMPT_FS * 1.15, backgroundColor: th.ink, opacity: phOut,
                }} />
              </div>
            </div>
            <div style={{
              position: "absolute", left: 0, right: 0, bottom: 0,
              padding: `${CTRL_PAD_Y}px ${CTRL_PAD_X}px`, boxSizing: "content-box", height: SEND,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ ...circle, backgroundColor: th.surface }}><Plus c={th.glyph} /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: CTRL_FS, fontWeight: 500, color: th.ink, whiteSpace: "nowrap" }}>{th.name}</span>
                <Chevron c={th.muted} />
                <div style={{ ...circle, backgroundColor: th.surface, marginLeft: 6 }}><Mic c={th.glyph} /></div>
                <div style={{
                  width: SEND, height: SEND, borderRadius: th.sendRadius, backgroundColor: th.sendBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ArrowUp c={th.sendInk} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
