import React from "react";
import { ACCENT, INK, PAPER, clamp01 } from "./shared";

// edit-i-oneshot, family A: the paper. The pieces every card of this family is made of, so the
// letter, the envelope and the bundle are ONE object coming back changed (V1 -> V20, V4 -> V5 -> V15).
// Paper is white with a soft shadow so it sits ON the card; ink is #14161F with a white halo behind
// it; the letter's body is a real document face (Georgia), the guide page a document app's system
// sans. Nothing here is a flat icon: a sheet has an edge, a crease has a highlight, a stack has a
// hundred uneven edges and a paper band.

export const SERIF = "Georgia, 'Times New Roman', serif";
export const DOCSANS = "-apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif";
/** the soft neutral ground a white page sits on, so paper reads as paper and not as the plate */
export const GROUND = "#EDEAE3";
export const PAPER_EDGE = "rgba(20,22,31,0.16)";
export const PAPER_SHADOW = "0 6px 18px rgba(0,0,0,0.18)";
export const PAGE_INK = "#22252C";

/** deterministic jitter in -1..1 (uneven paper edges, a hand that never repeats) */
export const jit = (i: number, k: number): number => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
};

// ─────────────────────────────────────────────────────────────────────────────
// Handwriting: an SVG stroke, never a handwriting font. Baseline y = 0, x-height -34,
// ascender / cap -62. Every glyph is its own stroke, slanted and jittered so the line
// is uneven the way a written line is.
// ─────────────────────────────────────────────────────────────────────────────

type Glyph = { d: string; adv: number };

const GLYPHS: Record<string, Glyph> = {
  " ": { d: "", adv: 18 },
  ".": { d: "M2 -3 L2.6 -3", adv: 13 },
  K: { d: "M0 0 L0 -62 M0 -26 L28 -62 M8 -34 L30 0", adv: 36 },
  M: { d: "M0 0 L0 -62 L21 -22 L42 -62 L42 0", adv: 50 },
  a: { d: "M20 -32 C10 -38 0 -29 0 -17 C0 -5 10 2 19 -5 M20 -33 L20 0", adv: 27 },
  e: { d: "M1 -17 L19 -20 C21 -30 12 -37 5 -32 C-1 -27 -1 -10 6 -4 C11 0 17 -2 20 -7", adv: 26 },
  h: { d: "M0 -62 L0 0 M0 -23 C4 -33 12 -37 17 -33 C20 -30 20 -26 20 -20 L20 0", adv: 27 },
  n: { d: "M0 0 L0 -34 M0 -23 C4 -33 12 -37 17 -33 C20 -30 20 -26 20 -20 L20 0", adv: 27 },
  o: { d: "M11 -34 C3 -34 0 -26 0 -17 C0 -7 6 -1 13 -2 C21 -3 24 -12 24 -21 C24 -29 19 -34 11 -34", adv: 30 },
  r: { d: "M0 0 L0 -34 M0 -21 C4 -32 12 -36 19 -32", adv: 25 },
  t: { d: "M8 -50 L8 -8 C8 -2 13 0 18 -3 M0 -34 L17 -34", adv: 23 },
  w: { d: "M0 -34 L6 0 L13 -26 L20 0 L26 -34", adv: 33 },
};

const glyphsOf = (text: string): Array<{ g: Glyph; x: number; i: number }> => {
  const out: Array<{ g: Glyph; x: number; i: number }> = [];
  let x = 0;
  for (let i = 0; i < text.length; i++) {
    const g = GLYPHS[text[i]] ?? GLYPHS[text[i].toLowerCase()] ?? GLYPHS[" "];
    out.push({ g, x, i });
    x += g.adv;
  }
  return out;
};

export const handAdvance = (text: string): number => {
  let x = 0;
  for (let i = 0; i < text.length; i++) x += (GLYPHS[text[i]] ?? GLYPHS[text[i].toLowerCase()] ?? GLYPHS[" "]).adv;
  return x;
};

/** the written name. `unit` is px per glyph unit (cap height = 62 units). */
export const Handwriting: React.FC<{
  text: string; unit: number; color?: string; sw?: number; halo?: boolean; style?: React.CSSProperties;
}> = ({ text, unit, color = INK, sw = 5, halo = false, style }) => {
  const gs = glyphsOf(text);
  const adv = handAdvance(text);
  const vbW = adv + 26;
  const vbH = 100;
  const body = gs.map(({ g, x, i }) => (
    <g key={i} transform={`translate(${x} ${jit(i, 3) * 1.7}) rotate(${jit(i, 7) * 2.2})`}>
      <path d={g.d} />
    </g>
  ));
  return (
    <svg
      width={vbW * unit}
      height={vbH * unit}
      viewBox={`-8 -74 ${vbW} ${vbH}`}
      style={{ display: "block", overflow: "visible", ...style }}
    >
      <g transform="skewX(-9)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {halo && <g stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={sw + 7}>{body}</g>}
        <g stroke={color} strokeWidth={sw}>{body}</g>
      </g>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// The ink hand. Built as two silhouettes (an ink pass, then a paper pass 3.5 units
// smaller) so the union of palm, cuff, four fingers and a thumb comes out as ONE clean
// outline with no lines crossing the inside of the hand: the reference edit D line grammar, not
// a cartoon glove. viewBox 268 x 150, wrist at the right, fingers pointing left.
// ─────────────────────────────────────────────────────────────────────────────

const PALM_D =
  "M208 22 C178 24 152 29 133 36 C126 39 125 47 127 57 L136 108 C138 118 145 123 154 123 L208 130 Z";
const CUFF_D = "M200 12 L268 6 L268 146 L200 140 Z";
const FINGERS: Array<[number, number, number, number, number]> = [
  // rootX rootY tipX tipY width  (index shorter than middle, little shortest and thinnest)
  [134, 44, 54, 37, 17],
  [136, 64, 42, 61, 18],
  [138, 84, 50, 86, 17],
  [140, 102, 66, 108, 15],
];
const THUMB: [number, number, number, number, number] = [178, 50, 132, 4, 20];
/** the lines a hand has: the thumb web, four knuckles, two cuff seams */
const HAND_DETAIL = [
  "M168 48 C158 58 152 68 150 80",
  "M130 40 q7 3 9 9", "M132 60 q7 3 9 9", "M134 80 q7 3 9 9", "M136 99 q6 3 8 8",
];
const CUFF_DETAIL = ["M205 15 L209 139", "M224 13 L228 142"];

const HAND_VB_W = 268;
const HAND_VB_H = 150;
const RING = 7; // the ink ring is RING/2 units thick

const capsule = (c: [number, number, number, number, number], grow: number, stroke: string, key: string) => (
  <line
    key={key} x1={c[0]} y1={c[1]} x2={c[2]} y2={c[3]}
    stroke={stroke} strokeWidth={c[4] + grow} strokeLinecap="round" fill="none"
  />
);

export const InkHand: React.FC<{ w: number; part?: "all" | "body" | "thumb"; style?: React.CSSProperties }> = ({
  w, part = "all", style,
}) => {
  const withBody = part !== "thumb";
  const withThumb = part !== "body";
  const pass = (grow: number, stroke: string, fill: string, tag: string) => (
    <g>
      {withBody && <path d={PALM_D} fill={fill} stroke={stroke} strokeWidth={grow} strokeLinejoin="round" />}
      {withBody && <path d={CUFF_D} fill={fill} stroke={stroke} strokeWidth={grow} strokeLinejoin="round" />}
      {withBody && FINGERS.map((f, i) => capsule(f, grow, stroke, `${tag}f${i}`))}
      {withThumb && capsule(THUMB, grow, stroke, `${tag}t`)}
    </g>
  );
  return (
    <svg
      width={w} height={(w * HAND_VB_H) / HAND_VB_W} viewBox={`0 0 ${HAND_VB_W} ${HAND_VB_H}`}
      style={{ display: "block", overflow: "visible", ...style }}
    >
      {pass(RING + 10, "#FFFFFF", "#FFFFFF", "h")}
      {pass(RING, INK, INK, "i")}
      {pass(0, PAPER, PAPER, "p")}
      {withBody && (
        <g stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none">
          {HAND_DETAIL.map((d) => <path key={d} d={d} />)}
          {CUFF_DETAIL.map((d) => <path key={d} d={d} strokeWidth={3} />)}
        </g>
      )}
    </svg>
  );
};

/** the streaks a fast object leaves: ink lines with a halo, as long as the thing has travelled */
export const SpeedLines: React.FC<{ h: number; travel: number }> = ({ h, travel }) => {
  const lines = [0.08, 0.2, 0.33, 0.47, 0.6, 0.74, 0.9];
  const box = Math.max(1, travel);
  return (
    <svg width={box} height={h} viewBox={`${-box} 0 ${box} ${h}`} style={{ display: "block", overflow: "visible" }}>
      {lines.map((f, i) => {
        const len = (0.34 + 0.62 * Math.abs(jit(i, 11))) * travel;
        const y = f * h;
        const gap = 8 + 26 * Math.abs(jit(i, 17));
        return (
          <g key={i}>
            <line x1={-gap - len} y1={y} x2={-gap} y2={y} stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={12} strokeLinecap="round" />
            <line x1={-gap - len} y1={y} x2={-gap} y2={y} stroke={INK} strokeWidth={4} strokeLinecap="round" strokeOpacity={0.9} />
          </g>
        );
      })}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// The envelope: a white C5 with a closed flap, a soft shadow, the name written on it.
// ─────────────────────────────────────────────────────────────────────────────

export const EnvelopeFace: React.FC<{
  w: number; name: string; shadow?: boolean; nameOpacity?: number;
}> = ({ w, name, shadow = true, nameOpacity = 1 }) => {
  const h = Math.round(w / 1.414);
  const nameUnit = (w * 0.48) / handAdvance(name);
  return (
    <div
      style={{
        position: "absolute", left: 0, top: 0, width: w, height: h,
        backgroundColor: PAPER, border: `1px solid ${PAPER_EDGE}`, boxSizing: "border-box",
        boxShadow: shadow ? PAPER_SHADOW : "none",
      }}
    >
      {/* the closed flap: two creases meeting just above the middle */}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0, display: "block" }}>
        <path
          d={`M0 0 L${w / 2} ${h * 0.54} L${w} 0`}
          fill="none" stroke="rgba(20,22,31,0.30)" strokeWidth={Math.max(1.6, w * 0.004)}
        />
        <path
          d={`M0 2 L${w / 2} ${h * 0.54 + 2} L${w} 2`}
          fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={Math.max(1.4, w * 0.003)}
        />
        <line x1={0} y1={h - 1} x2={w} y2={h - 1} stroke="rgba(20,22,31,0.10)" strokeWidth={2} />
      </svg>
      <div style={{ position: "absolute", left: w * 0.08, top: h * 0.63, opacity: nameOpacity }}>
        <Handwriting text={name} unit={nameUnit} sw={5} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// The bundle: about a hundred envelopes as one thick stack. Every sheet is its own
// edge, jittered, so the stack is uneven the way a real one is; a kraft paper band
// runs across it; the whole thing casts one soft shadow on the wall.
// ─────────────────────────────────────────────────────────────────────────────

export const STACK_LAYERS = 30;

export const bundleSize = (faceW: number, step: number, layers = STACK_LAYERS) => ({
  w: faceW,
  h: Math.round(faceW / 1.414) + (layers - 1) * step,
  faceH: Math.round(faceW / 1.414),
});

export const BundleStack: React.FC<{
  faceW: number; step: number; name: string; layers?: number; topInk?: number;
}> = ({ faceW, step, name, layers = STACK_LAYERS, topInk = 1 }) => {
  const { h, faceH } = bundleSize(faceW, step, layers);
  const bandW = Math.round(faceW * 0.165);
  const bandX = Math.round(faceW * 0.695);
  const nameUnit = (faceW * 0.46) / handAdvance(name);
  const sheets = [];
  for (let i = layers - 1; i >= 0; i--) {
    const dx = jit(i, 1) * (faceW * 0.009);
    const dw = jit(i, 2) * (faceW * 0.014);
    sheets.push(
      <div
        key={i}
        style={{
          position: "absolute", left: dx, top: i * step + jit(i, 9) * step * 0.28, width: faceW + dw, height: faceH,
          backgroundColor: i % 3 === 1 ? "#F6F5F1" : PAPER,
          border: `1px solid rgba(20,22,31,${0.09 + 0.13 * Math.abs(jit(i, 5))})`,
          boxSizing: "border-box",
          boxShadow: i === layers - 1 ? "0 12px 26px rgba(0,0,0,0.22)" : "none",
        }}
      />,
    );
  }
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: faceW, height: h }}>
      {sheets}
      {/* the top envelope's own face: the flap crease and the written name */}
      <div style={{ position: "absolute", left: 0, top: 0, width: faceW, height: faceH, opacity: topInk }}>
        <svg width={faceW} height={faceH} viewBox={`0 0 ${faceW} ${faceH}`} style={{ display: "block" }}>
          <path d={`M0 0 L${faceW / 2} ${faceH * 0.54} L${faceW} 0`} fill="none" stroke="rgba(20,22,31,0.30)" strokeWidth={Math.max(1.5, faceW * 0.004)} />
          <path d={`M0 2 L${faceW / 2} ${faceH * 0.54 + 2} L${faceW} 2`} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={Math.max(1.2, faceW * 0.003)} />
        </svg>
        <div style={{ position: "absolute", left: faceW * 0.13, top: faceH * 0.64 }}>
          <Handwriting text={name} unit={nameUnit} sw={5} />
        </div>
      </div>
      {/* the paper band round the middle */}
      <div
        style={{
          position: "absolute", left: bandX, top: -3, width: bandW, height: h + 6,
          backgroundColor: "#EFE5D3", borderLeft: "1px solid rgba(20,22,31,0.20)",
          borderRight: "1px solid rgba(20,22,31,0.20)", boxSizing: "border-box",
          boxShadow: "0 3px 8px rgba(0,0,0,0.16)",
        }}
      />
      <div
        style={{
          position: "absolute", left: bandX, top: -3, width: bandW, height: h + 6,
          backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.10), rgba(0,0,0,0) 38%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.10))",
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// The letter. One A4 page drawn once and reused by V4, V5 and V15: a letterhead, a date
// line, the greeting, three short paragraphs in a serif at reading size, a sign-off and
// a written signature. No number, no product name, no third party anywhere in the body.
// ─────────────────────────────────────────────────────────────────────────────

export const PAGE_W = 580;
export const PAGE_H = 820;
export const LY = {
  name: 54, rule: 106, date: 130, greet: 198,
  para: [268, 386, 504], lineH: 40, best: 632, sign: 680,
  margin: 48, col: PAGE_W - 96,
  bodyFs: 26, greetFs: 27, headFs: 30,
};
/** the three things the letter says, in their voice: no number, no product, no third party */
export const PARAS: string[][] = [
  ["I am writing this by hand because", "we started with nothing, in one room."],
  ["Since then, the founders who trusted", "us early have all stayed with us."],
  ["We have built the thing that does the", "part you still do by hand today."],
];
export const BODY_LINES = 6;
export const lineTop = (i: number): number => LY.para[Math.floor(i / 2)] + (i % 2) * LY.lineH;
export const CREASES = [PAGE_H / 3, (2 * PAGE_H) / 3];

const lineWidth = (s: string): number => Math.min(LY.col, s.length * 0.497 * LY.bodyFs);

export const LetterPage: React.FC<{
  from: string; greeting: string; nameInGreeting: string;
  greetChars?: number; accentName?: boolean; printFrontY?: number;
  creases?: number; highlights?: number[]; shadow?: boolean; mark?: "block" | "read";
}> = ({
  from, greeting, nameInGreeting, greetChars = greeting.length, accentName = false,
  printFrontY = PAGE_H, creases = 0, highlights, shadow = true, mark = "block",
}) => {
  const ni = Math.max(0, greeting.indexOf(nameInGreeting));
  const shown = greeting.slice(0, Math.max(0, Math.round(greetChars)));
  const typing = shown.length > 0 && shown.length < greeting.length;
  const sigUnit = 0.78; // a signature sits a little above the body, not across the page

  return (
    <div
      style={{
        position: "absolute", left: 0, top: 0, width: PAGE_W, height: PAGE_H,
        backgroundColor: "#FDFCF9", border: `1px solid ${PAPER_EDGE}`, boxSizing: "border-box",
        boxShadow: shadow ? PAPER_SHADOW : "none",
      }}
    >
      {/* everything the printer has already laid down */}
      <div style={{ position: "absolute", left: 0, top: 0, width: PAGE_W, height: Math.max(0, printFrontY), overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: PAGE_W, height: PAGE_H }}>
          <div style={{ position: "absolute", left: LY.margin, top: LY.name, fontFamily: SERIF, fontSize: LY.headFs, color: PAGE_INK, letterSpacing: "0.04em", lineHeight: 1.2 }}>
            {from}
          </div>
          <div style={{ position: "absolute", left: LY.margin, top: LY.rule, width: LY.col, height: 1, backgroundColor: "#CFC8B9" }} />
          <div style={{ position: "absolute", left: LY.margin + LY.col - 124, top: LY.date, width: 124, height: 12, borderRadius: 6, backgroundColor: "#CDC7BA" }} />

          <div style={{ position: "absolute", left: LY.margin, top: LY.greet, fontFamily: SERIF, fontSize: LY.greetFs, color: PAGE_INK, lineHeight: 1.4, whiteSpace: "pre", display: "flex", alignItems: "baseline" }}>
            <span>{shown.slice(0, ni)}</span>
            <span style={{ color: accentName ? ACCENT : PAGE_INK }}>{shown.slice(ni, ni + nameInGreeting.length)}</span>
            <span>{shown.slice(ni + nameInGreeting.length)}</span>
            {typing && <span style={{ display: "inline-block", width: 2, height: LY.greetFs, backgroundColor: PAGE_INK, marginLeft: 3 }} />}
          </div>

          {PARAS.map((lines, pi) =>
            lines.map((ln, li) => {
              const idx = pi * 2 + li;
              const hl = highlights ? clamp01(highlights[idx] ?? 0) : 0;
              return (
                <div key={`${pi}-${li}`} style={{ position: "absolute", left: LY.margin, top: lineTop(idx), width: LY.col, height: LY.lineH }}>
                  {hl > 0 && mark === "block" && (
                    <div
                      style={{
                        position: "absolute", left: -5, top: 3, width: (lineWidth(ln) + 10) * hl, height: LY.lineH - 6,
                        backgroundColor: ACCENT, opacity: 0.26,
                      }}
                    />
                  )}
                  {/* a letter being read: the eye runs under each line in turn and the marks stay */}
                  {hl > 0 && mark === "read" && (
                    <div
                      style={{
                        position: "absolute", left: -2, top: LY.lineH - 7, width: (lineWidth(ln) + 4) * hl, height: 3.4,
                        backgroundColor: ACCENT, opacity: 0.92,
                      }}
                    />
                  )}
                  <div style={{ position: "absolute", left: 0, top: 0, fontFamily: SERIF, fontSize: LY.bodyFs, color: PAGE_INK, lineHeight: `${LY.lineH}px`, whiteSpace: "pre" }}>
                    {ln}
                  </div>
                </div>
              );
            }),
          )}

          <div style={{ position: "absolute", left: LY.margin, top: LY.best, fontFamily: SERIF, fontSize: LY.bodyFs, color: PAGE_INK, lineHeight: 1.4 }}>
            Best,
          </div>
          <div style={{ position: "absolute", left: LY.margin - 4, top: LY.sign }}>
            <Handwriting text={from} unit={sigUnit} sw={5} color="#2B3A55" />
          </div>
        </div>
      </div>

      {creases > 0 && CREASES.map((cy) => (
        <div key={cy} style={{ position: "absolute", left: 0, top: cy, width: PAGE_W, height: 3, opacity: creases }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: PAGE_W, height: 1.6, backgroundColor: "rgba(20,22,31,0.16)" }} />
          <div style={{ position: "absolute", left: 0, top: 1.6, width: PAGE_W, height: 1.4, backgroundColor: "rgba(255,255,255,0.95)" }} />
        </div>
      ))}
    </div>
  );
};

/** the printer's mouth: a thin dark slab across the top of the card with the slot along its edge */
export const PrinterMouth: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#454A53, #23262D)" }} />
    <div style={{ position: "absolute", left: 0, top: h - 15, width: w, height: 3, backgroundColor: "#6E747E" }} />
    <div style={{ position: "absolute", left: 0, top: h - 12, width: w, height: 12, backgroundColor: "#0C0E12" }} />
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: 2, backgroundColor: "rgba(255,255,255,0.12)" }} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// The guide: the same letter turned into a page in a document app.
// ─────────────────────────────────────────────────────────────────────────────

export const DocPage: React.FC<{
  w: number; h: number; title: string; headings: string[]; typed: number[];
}> = ({ w, h, title, headings, typed }) => {
  const m = Math.round(w * 0.059);
  const col = w - 2 * m;
  const titleFs = Math.round(w * 0.059);
  const headFs = Math.round(w * 0.044);
  const box = Math.round(headFs * 1.18);
  const rows = [Math.round(h * 0.47), Math.round(h * 0.655), Math.round(h * 0.84)];
  const cut = (s: string, p: number) => s.slice(0, Math.round(clamp01(p) * s.length));
  return (
    <div
      style={{
        position: "absolute", left: 0, top: 0, width: w, height: h,
        backgroundColor: "#FFFFFF", border: `1px solid ${PAPER_EDGE}`, boxSizing: "border-box",
        boxShadow: PAPER_SHADOW,
      }}
    >
      {/* the document's own icon, the way a document app shows a file */}
      <svg width={Math.round(w * 0.07)} height={Math.round(w * 0.07)} viewBox="0 0 24 24" style={{ position: "absolute", left: m, top: Math.round(h * 0.072), display: "block" }}>
        <path d="M5 2 h9 l5 5 v15 h-14 z" fill="#E8EBEF" stroke="#6B727D" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M14 2 v5 h5" fill="#CFD5DC" stroke="#6B727D" strokeWidth="1.3" strokeLinejoin="round" />
        <g stroke="#98A0AA" strokeWidth="1.3" strokeLinecap="round">
          <line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="15" x2="16" y2="15" /><line x1="8" y1="18" x2="13" y2="18" />
        </g>
      </svg>

      <div
        style={{
          position: "absolute", left: m, top: Math.round(h * 0.19), width: col,
          fontFamily: DOCSANS, fontWeight: 700, fontSize: titleFs, color: "#1D2027",
          lineHeight: 1.18, letterSpacing: "-0.005em", whiteSpace: "pre",
        }}
      >
        {cut(title, typed[0] ?? 0)}
      </div>
      <div style={{ position: "absolute", left: m, top: Math.round(h * 0.33), width: col, height: 1, backgroundColor: "#E3E6EA" }} />

      {headings.map((s, i) => (
        <div key={s} style={{ position: "absolute", left: m, top: rows[i], width: col, height: box, display: "flex", alignItems: "center", gap: Math.round(box * 0.52) }}>
          <div style={{ width: box, height: box, border: "2px solid #A3AAB4", borderRadius: 3, boxSizing: "border-box", flex: "none" }} />
          <div style={{ fontFamily: DOCSANS, fontWeight: 600, fontSize: headFs, color: "#2A2E36", lineHeight: 1, whiteSpace: "pre" }}>
            {cut(s, typed[i + 1] ?? 0)}
          </div>
        </div>
      ))}
    </div>
  );
};
