import React from "react";
import {
  BASE_H, CLAUDE_T, CTRL_PAD_Y, CW, PROMPT_MIN_H, PROMPT_PAD_X, PROMPT_PAD_Y, RADIUS, SEND, Surface,
} from "../ComposerParts";
import { BLUE, BLUE_TEXT, Chip, clamp01 } from "./shared";

// edit-h-oneshot family D, the parts its four kinds share: the iPhone in the iOS dictation state
// (V10/V11/V12/V18) and the Claude composer at a small width (V12/V18). Both are REAL SURFACES, so
// they keep their own colours, corners and faces: the pack's chip grammar is for the wall.
//
// The phone is drawn ONCE at a fixed 312 x 643 stage and scaled as one block, so the same object is
// the same object in all four cards: the ramble breaks on the same words, the fillers sit in the
// same places, and a callback only changes size, never proportion.

export const P0 = 312;                    // the phone's own stage: 312 x 643 is 2.06:1, an iPhone
export const PH0 = 643;
export const BEZ = 7;                     // PhoneFrame's own bezel at this width (0.024 w)
export const SCW = P0 - 2 * BEZ;          // 298 of screen
export const STATUS = 33;                 // PhoneFrame's own status bar at this height (0.052 h)
export const CONT_H = PH0 - 2 * BEZ - STATUS; // 596 under the status bar
export const PAD_X = 18;
export const COL = SCW - 2 * PAD_X;       // 262: the one column width the phone and the rail share
export const TXT_FS = 29;                 // 29 px on the 1080 frame at scale 1
export const LH = 35;
export const PCHIP_FS = 32;   // the reel's 32 px chip floor, inside the phone too
const CHIP_H = PCHIP_FS + 2 * Math.round(0.42 * PCHIP_FS);
export const CHIP_TOP = 12;
export const TXT_TOP = CHIP_TOP + CHIP_H + 13;  // 82
const WAVE_H = 66;
export const SCREEN_BG = "#0C0C0E";
const IOS_CHIP = "#2C2C2E";               // the phone's own dark label, not the wall's #14161F:
                                          // a wall chip on a black screen is invisible
export const HEAD = 43;                   // a landing starts 43 ms early so it is visibly landing ON
                                          // its own frame (a beat falls inside a 33 ms frame)
export const PHONE_SANS = '-apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

// ---------------------------------------------------------------- the device itself

const Battery: React.FC<{ h: number }> = ({ h }) => (
  <svg width={h * 2.05} height={h} viewBox="0 0 25 12" style={{ display: "block" }}>
    <rect x="0.6" y="0.6" width="20" height="10.8" rx="3" fill="none" stroke="#FFFFFF" strokeWidth="1.1" opacity={0.5} />
    <rect x="2.2" y="2.2" width="16.8" height="7.6" rx="1.8" fill="#FFFFFF" />
    <path d="M22.4 4.2 a2.2 2.2 0 0 1 0 3.6 Z" fill="#FFFFFF" opacity={0.5} />
  </svg>
);
const Signal: React.FC<{ h: number }> = ({ h }) => (
  <svg width={h * 1.5} height={h} viewBox="0 0 18 12" style={{ display: "block" }}>
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={i * 4.6} y={11 - (i + 1) * 2.6} width="3.2" height={(i + 1) * 2.6} rx="1" fill="#FFFFFF" opacity={i === 3 ? 0.35 : 1} />
    ))}
  </svg>
);
const Wifi: React.FC<{ h: number }> = ({ h }) => (
  <svg width={h * 1.4} height={h} viewBox="0 0 17 12" style={{ display: "block" }}>
    <path d="M1 4.2 A11 11 0 0 1 16 4.2" fill="none" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M4 7 A7 7 0 0 1 13 7" fill="none" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="8.5" cy="10.3" r="1.4" fill="#FFFFFF" />
  </svg>
);

/** the device around the screen: aluminium, the dynamic island, the status bar, and a screen that
 *  clips its own content the way a real one does. Its own radii and colours, never the pack's. */
const PhoneShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const radius = Math.round(P0 * 0.115);
  const fs = Math.round(STATUS * 0.52);
  const pad = Math.round(P0 * 0.075);
  return (
    <div style={{
      position: "absolute", left: 0, top: 0, width: P0, height: PH0, borderRadius: radius,
      backgroundColor: "#0B0B0D", boxSizing: "border-box", padding: BEZ,
      boxShadow: "0 18px 48px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(255,255,255,0.10)",
    }}>
      <div style={{
        position: "relative", width: SCW, height: PH0 - 2 * BEZ, borderRadius: radius - BEZ,
        overflow: "hidden", backgroundColor: SCREEN_BG,
      }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: SCW, height: STATUS, zIndex: 2 }}>
          <span style={{
            position: "absolute", left: pad, top: "50%", transform: "translateY(-50%)",
            fontFamily: PHONE_SANS, fontSize: fs, fontWeight: 600, color: "#FFFFFF", letterSpacing: 0.2,
          }}>9:41</span>
          <div style={{
            position: "absolute", right: pad, top: "50%", transform: "translateY(-50%)",
            display: "flex", alignItems: "center", gap: Math.round(fs * 0.42),
          }}>
            <Signal h={fs * 0.8} /><Wifi h={fs * 0.8} /><Battery h={fs * 0.8} />
          </div>
          <div style={{
            position: "absolute", left: "50%", top: Math.round(STATUS * 0.16),
            width: Math.round(P0 * 0.27), height: Math.round(STATUS * 0.66),
            marginLeft: -Math.round(P0 * 0.135), borderRadius: 999, backgroundColor: "#000000",
          }} />
        </div>
        <div style={{ position: "absolute", left: 0, top: STATUS, width: SCW, height: CONT_H, overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- text metrics, wrapping, tokens

const NARROW = "iljtfrI.,;:'!|()[]-";
const WIDE = "mwMW";
const adv = (ch: string): number => {
  if (ch === " ") return 0.27;
  if (NARROW.includes(ch)) return 0.3;
  if (WIDE.includes(ch)) return 0.86;
  if (ch >= "0" && ch <= "9") return 0.56;
  if (ch >= "A" && ch <= "Z") return 0.64;
  return 0.545;
};
export const textW = (s: string, fs: number): number => {
  let n = 0;
  for (let i = 0; i < s.length; i++) n += adv(s[i]);
  return n * fs;
};

export type Tok = { t: string; f: number };   // f = which filler this word belongs to, or -1
export type Line = { toks: Tok[]; text: string; start: number; w: number };

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** the ramble as words, with each filler occurrence (in the order the plan lists them) as one token */
export const tokenize = (text: string, fillers: string[]): Tok[] => {
  const words = text.split(" ");
  const nw = words.map(norm);
  const owner = new Array<number>(words.length).fill(-1);
  let pos = 0;
  fillers.forEach((f, k) => {
    const fn = f.split(" ").map(norm);
    for (let i = pos; i <= words.length - fn.length; i++) {
      let ok = true;
      for (let j = 0; j < fn.length; j++) if (nw[i + j] !== fn[j]) { ok = false; break; }
      if (!ok) continue;
      for (let j = 0; j < fn.length; j++) owner[i + j] = k;
      pos = i + fn.length;
      break;
    }
  });
  const toks: Tok[] = [];
  for (let i = 0; i < words.length;) {
    const k = owner[i];
    if (k < 0) { toks.push({ t: words[i], f: -1 }); i++; continue; }
    let j = i;
    while (j + 1 < words.length && owner[j + 1] === k) j++;
    toks.push({ t: words.slice(i, j + 1).join(" "), f: k });
    i = j + 1;
  }
  return toks;
};

export const wrapToks = (toks: Tok[], fs: number, maxW: number): Line[] => {
  const lines: Line[] = [];
  let cur: Tok[] = [];
  const wOf = (ts: Tok[]): number => textW(ts.map((t) => t.t).join(" "), fs);
  const push = (ts: Tok[]) => {
    const text = ts.map((t) => t.t).join(" ");
    lines.push({ toks: ts, text, start: 0, w: textW(text, fs) });
  };
  for (const tk of toks) {
    if (cur.length && wOf([...cur, tk]) > maxW) { push(cur); cur = [tk]; } else cur.push(tk);
  }
  if (cur.length) push(cur);
  let off = 0;
  for (const l of lines) { l.start = off; off += l.text.length + 1; }
  return lines;
};

/** the x of character n inside a laid-out line (the same walk the renderer does) */
export const lineX = (l: Line, n: number, fs: number): number => {
  let x = 0, c = 0;
  for (let i = 0; i < l.toks.length; i++) {
    const lead = i ? 1 : 0;
    const s = l.toks[i].t;
    if (n < c + lead) return x;
    const k = n - c - lead;
    const leadW = lead ? textW(" ", fs) : 0;
    if (k >= s.length) { x += leadW + textW(s, fs); c += lead + s.length; continue; }
    return x + leadW + textW(s.slice(0, k), fs);
  }
  return x;
};

/** the line a global character index falls on, as a fraction of lines (continuous, so a tag that
 *  follows the head drifts instead of jumping) */
export const headAt = (lines: Line[], n: number, fs: number): { li: number; x: number; f: number } => {
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (n <= l.start + l.text.length || i === lines.length - 1) {
      const x = lineX(l, Math.max(0, Math.min(l.text.length, n - l.start)), fs);
      return { li: i, x, f: i + (l.w > 0 ? clamp01(x / l.w) : 0) };
    }
  }
  return { li: 0, x: 0, f: 0 };
};

/** find a phrase in the wrapped text: which line, and where on it */
export const locate = (lines: Line[], needle: string, fs: number): { li: number; x: number } => {
  for (let i = 0; i < lines.length; i++) {
    const p = lines[i].text.toLowerCase().indexOf(needle.toLowerCase());
    if (p >= 0) return { li: i, x: lineX(lines[i], p, fs) };
  }
  return { li: 0, x: 0 };
};

const hash = (a: number, b: number): number => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------- the phone

export const HALO_TEXT =
  "0 0 3px rgba(255,255,255,0.98), 0 0 10px rgba(255,255,255,0.9), 0 0 20px rgba(255,255,255,0.6)";

/** one line of the ramble, on the phone (light on dark) or on the wall as the thought that lags
 *  (GHOST with a halo). The SAME column width and face in both, so the two rails compare. */
export const LineRow: React.FC<{
  l: Line; idx: number; shown: number; blue: number[]; scatter: number;
  color?: string; halo?: boolean;
}> = ({ l, idx, shown, blue, scatter, color, halo }) => {
  const rel = shown - l.start;
  const dx = (hash(idx, 1) - 0.5) * 30 * scatter;
  const dy = (hash(idx, 2) - 0.5) * 17 * scatter;
  const rot = (hash(idx, 3) - 0.5) * 5.4 * scatter;
  let c = 0;
  const pad = 5;
  return (
    <div style={{
      height: LH, lineHeight: `${LH}px`, fontFamily: PHONE_SANS, fontSize: TXT_FS,
      color: color ?? "#F3F3F5", whiteSpace: "pre", letterSpacing: "-0.002em",
      textShadow: halo ? HALO_TEXT : undefined,
      transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${rot.toFixed(3)}deg)`,
      transformOrigin: "left center",
    }}>
      {l.toks.map((tk, i) => {
        const lead = i ? 1 : 0;
        const start = c + lead;
        c = start + tk.t.length;
        const vis = Math.max(0, Math.min(tk.t.length, rel - start));
        if (vis <= 0) return null;
        const b = tk.f >= 0 ? (blue[tk.f] ?? 0) : 0;
        return (
          <React.Fragment key={i}>
            {lead ? " " : null}
            <span style={{ position: "relative", display: "inline-block", whiteSpace: "pre" }}>
              {b > 0.01 && (
                <span style={{
                  position: "absolute", left: -pad, right: -pad, top: 3, bottom: 4,
                  backgroundColor: BLUE, opacity: b,
                }} />
              )}
              <span style={{ position: "relative", color: b > 0.5 ? BLUE_TEXT : undefined }}>
                {tk.t.slice(0, vis)}
              </span>
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** the iOS dictation waveform: the strip is lit from the card's entry, the bars move on the word */
const Wave: React.FC<{ tMs: number; amp: number }> = ({ tMs, amp }) => {
  const n = 31, bw = 3, gap = 5;
  const total = n * (bw + gap) - gap;
  const x0 = (SCW - total) / 2;
  return (
    <div style={{
      position: "absolute", left: 0, top: CONT_H - WAVE_H, width: SCW, height: WAVE_H,
      backgroundColor: "#17181C", borderTop: "1px solid rgba(255,255,255,0.08)",
    }}>
      {Array.from({ length: n }).map((_, i) => {
        const a = Math.sin(tMs * 0.0105 + i * 0.62);
        const b = Math.sin(tMs * 0.0043 + i * 0.23);
        const hgt = 4 + amp * 30 * (0.2 + 0.8 * Math.abs(0.6 * a + 0.4 * b));
        return (
          <div key={i} style={{
            position: "absolute", left: x0 + i * (bw + gap), top: (WAVE_H - 12 - hgt) / 2,
            width: bw, height: hgt, borderRadius: bw / 2, backgroundColor: "rgba(255,255,255,0.92)",
          }} />
        );
      })}
      <div style={{
        position: "absolute", left: SCW / 2 - 54, bottom: 7, width: 108, height: 5,
        borderRadius: 3, backgroundColor: "rgba(255,255,255,0.32)",
      }} />
    </div>
  );
};

export const Phone: React.FC<{
  x: number; y: number; s: number; lines: Line[]; shown: number; tMs: number;
  amp: number; blue: number[]; scatter: number; label: string;
}> = ({ x, y, s, lines, shown, tMs, amp, blue, scatter, label }) => (
  <div style={{ position: "absolute", left: x, top: y, width: P0 * s, height: PH0 * s }}>
    <div style={{ position: "relative", width: P0, height: PH0, transform: `scale(${s})`, transformOrigin: "top left" }}>
      <PhoneShell>
        <Chip
          text={label} fs={PCHIP_FS}
          style={{ position: "absolute", left: PAD_X, top: CHIP_TOP, backgroundColor: IOS_CHIP }}
        />
        <div style={{ position: "absolute", left: PAD_X, top: TXT_TOP, width: COL }}>
          {lines.map((l, i) => (
            <LineRow key={i} l={l} idx={i} shown={shown} blue={blue} scatter={scatter} />
          ))}
        </div>
        <Wave tMs={tMs} amp={amp} />
      </PhoneShell>
    </div>
  </div>
);

// ---------------------------------------------------------------- the composer, at a small width

export type CompGeo = {
  left: number; top: number; w: number; k: number; h: number;
  textX: number; textY: number; innerW: number; fs: number; lh: number; fieldH: number;
};

/** the real Claude composer (`Surface`, verbatim chrome) at an arbitrary width, its input field
 *  taken to the height its lines need the way the real one grows. `fs` is lifted off the scale so
 *  the prompt still reads at card size: everything else keeps the surface's own proportion. */
export const compGeo = (left: number, top: number, w: number, fs: number, nLines: number): CompGeo => {
  const k = w / CW;
  const padX = PROMPT_PAD_X * k, padY = PROMPT_PAD_Y * k;
  const lh = Math.round(fs * 1.26);
  const fieldH = Math.max(PROMPT_MIN_H * k, nLines * lh);
  const h = 2 * k + 2 * padY + fieldH + (2 * CTRL_PAD_Y + SEND) * k;
  return {
    left, top, w, k, h, fieldH, fs, lh,
    textX: left + padX + k, textY: top + k + padY, innerW: w - 2 * padX - 2 * k,
  };
};

export const ComposerBox: React.FC<{ g: CompGeo; children?: React.ReactNode }> = ({ g, children }) => {
  const ctrlH = (2 * CTRL_PAD_Y + SEND) * g.k;
  const r = RADIUS * g.k;
  return (
    <>
      <Surface
        th={CLAUDE_T} k={g.k} left={g.left} bottom={g.top + Math.max(g.h, BASE_H * g.k)} grow={0}
        files={[]} chipIn={[]} phOut={1} invert={false} markIn={0} markPx={0}
      />
      {/* the field repainted at the height its lines need: the placeholder goes, the top corners
          come with it, the surface keeps its own control row and its bottom corners */}
      <div style={{
        position: "absolute", left: g.left, top: g.top, width: g.w, height: g.h - ctrlH,
        boxSizing: "border-box", backgroundColor: CLAUDE_T.surface,
        borderLeft: `1px solid ${CLAUDE_T.border}`, borderRight: `1px solid ${CLAUDE_T.border}`,
        borderTop: `1px solid ${CLAUDE_T.border}`, borderRadius: `${r}px ${r}px 0 0`,
      }} />
      {children}
    </>
  );
};

export const Check: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M4 12.6 L9.6 18.2 L20 6.4" fill="none" stroke={color} strokeWidth={3.2}
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
