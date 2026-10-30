import React from "react";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// reference edit J famA2: THE TERMINAL, the stage of the product half (V12, V15, V17, V18).
// The same window as cards/ClaudeCode.tsx (remocn's `claude-code`): its palette T, its
// 40 px bar with the three traffic lights, its body padding, its mono. Copied rather
// than imported so A1's V3 and these four cards move independently (BUILD-CONTRACT).
//
// The window lives in ITS OWN pixel space and the card IS the window, exactly as
// ClaudeCode.tsx does it (stage = w / winW). A NARROWER window space is the SAME window
// seen CLOSER, chrome and all: nothing is resized, the camera is nearer. That is how the
// mono clears 24 device px on a phone without touching a single size. winW 820 carries
// the 15-line stop screen (mono 20 -> 24.2 device px, 64 columns); winW 630 / 620 carry
// the two sparse cards (-> 32 device px), the camera a third closer because there is a
// third as much to read.
export const { fontFamily: MONO } = loadMono();

export const T = {
  windowBar: "#3A3633",
  windowBody: "#1B1A18",
  fg: "#E8E5DD",
  fgMuted: "#8A857C",
  fgDim: "#6B6660",
  accent: "#D97757",
  green: "#5FBF86", // the trusted / ok state only
};

export const BAR = 40;

export type Tone = "ink" | "muted" | "dim" | "accent" | "green";
export const toneColor = (t?: Tone): string =>
  t === "accent" ? T.accent : t === "muted" ? T.fgMuted : t === "dim" ? T.fgDim : t === "green" ? T.green : T.fg;

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
export const easeOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIO = (t: number): number => {
  const k = clamp01(t);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};
// one soft swell, 0 at both ends, so a pulse never snaps back
export const swell = (t: number): number => (t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t));

const parse = (c: string): number[] => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number): string => {
  const A = parse(a);
  const B = parse(b);
  const k = clamp01(t);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
};

// window box: the card IS the window, so the window's height in window space follows
// the card's aspect and the whole thing scales by `stage`.
export const winBox = (w: number, h: number, winW: number) => {
  const stage = w / winW;
  return { stage, W: winW, H: h / stage };
};

export type Seg = {
  t: string;
  tone?: Tone;
  color?: string;  // overrides tone (a colour being lerped on a word)
  fixed?: boolean; // each char boxed to one column: ✗ ❯ → · survive a font fallback
};

export type Row = {
  at: number;        // ms this row prints (a terminal prints whole lines)
  segs: Seg[];
  gap?: number;      // extra window px above the row (a block break)
  typeFrom?: number; // ms the LAST segment starts typing, char by char
  typeMs?: number;
  caret?: boolean;   // block caret at the end of the revealed text
  opacity?: number;
};

// the y of every row, in window px from the top of the body
export const rowTops = (rows: Row[], lh: number): number[] => {
  const out: number[] = [];
  let y = 0;
  for (const r of rows) {
    y += r.gap ?? 0;
    out.push(y);
    y += lh;
  }
  return out;
};

const Chars: React.FC<{ text: string; ch: number }> = ({ text, ch }) => (
  <>
    {Array.from(text).map((c, i) => (
      <span key={i} style={{ display: "inline-block", width: ch, textAlign: "center" }}>{c}</span>
    ))}
  </>
);

export const TermRows: React.FC<{
  tMs: number; rows: Row[]; fs: number; lh: number; ch: number; scroll?: number;
}> = ({ tMs, rows, fs, lh, ch, scroll = 0 }) => {
  const tops = rowTops(rows, lh);
  return (
    <div style={{ position: "absolute", left: 0, top: -scroll, right: 0 }}>
      {rows.map((r, i) => {
        if (tMs < r.at) return null;
        const typing = r.typeFrom !== undefined;
        const p = typing ? clamp01((tMs - r.typeFrom!) / (r.typeMs ?? 300)) : 1;
        const last = r.segs.length - 1;
        // a fresh line does not blink into existence: 2 frames of fade, then it is print
        const fade = clamp01((tMs - r.at) / 60);
        return (
          <div
            key={i}
            style={{
              position: "absolute", top: tops[i], left: 0,
              fontFamily: MONO, fontSize: fs, lineHeight: `${lh}px`, whiteSpace: "pre",
              opacity: (r.opacity ?? 1) * (typing ? 1 : fade),
              display: "flex", alignItems: "center", height: lh,
            }}
          >
            {r.segs.map((s, j) => {
              const text = typing && j === last ? s.t.slice(0, Math.ceil(s.t.length * p)) : s.t;
              return (
                <span key={j} style={{ color: s.color ?? toneColor(s.tone) }}>
                  {s.fixed ? <Chars text={text} ch={ch} /> : text}
                </span>
              );
            })}
            {r.caret && (Math.floor(tMs / 500) % 2 === 0 || (typing && p > 0 && p < 1)) && (
              <span style={{ display: "inline-block", width: ch * 0.92, height: fs * 1.05, background: T.fg, opacity: 0.6, marginLeft: 1 }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// the window: bar, three lights, a clipped body in window coordinates
export const A2Window: React.FC<{
  w: number; h: number; winW: number;
  padX?: number; padTop?: number; padBottom?: number;
  bodyDim?: number;      // the terminal recedes while a pane is open
  body: React.ReactNode; // window coordinates, origin at the body's top-left
  over?: React.ReactNode; // drawn over the whole window, window coordinates
}> = ({ w, h, winW, padX = 18, padTop = 14, padBottom = 12, bodyDim = 0, body, over }) => {
  const { stage, H } = winBox(w, h, winW);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: T.windowBody }}>
      <div
        style={{
          position: "absolute", left: 0, top: 0, width: winW, height: H,
          transform: `scale(${stage})`, transformOrigin: "top left",
        }}
      >
        <div style={{ height: BAR, background: T.windowBar, display: "flex", alignItems: "center", gap: 8, paddingLeft: 16 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div
          style={{
            position: "absolute", left: padX, top: BAR + padTop,
            width: winW - 2 * padX, height: H - BAR - padTop - padBottom,
            overflow: "hidden", opacity: 1 - bodyDim,
          }}
        >
          {body}
        </div>
        {over}
      </div>
    </div>
  );
};
