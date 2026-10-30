import React from "react";
import type { CardProps } from "./props";
import { ACCENT, label } from "./theme";

// reference edit G V5 "you need an AI EDITOR SYSTEM". The object that runs through the whole video:
// a cardboard box, delivered on "need", labelled letter by letter on "AI editor system",
// shaken on "what the hell", and held SHUT, because the mystery is the point. It comes back
// sealed under the views line (V10), opens on "public." (V12) and pours reels on "forever" (V15).
export type BoxData = { step?: string; label?: string };

// --- the drawn carton -------------------------------------------------------------------
// kraft brown, a slight three-quarter front angle, packing tape down the seam, a real shipping
// label. w/h = the box footprint in device px; the flaps rise ABOVE y=0 when `open` > 0.
const FACE = "#C89B6A", SIDE = "#A97F52", TOP = "#E6C89A", EDGE = "#8A6A45";
const CAVITY = "#5C4429", INNER = "#7A5C39";
const TAPE = "#E9D6B4", TAPE_EDGE = "#BC9C6E";
const PLATE = "#E7DFCF", PAPER = "#FDFBF6", LABEL_INK = "#1F1E1D", HAIR = "#C8C2B4";
export const CAP_SHADOW =
  "drop-shadow(0px 2px 6px rgba(0,0,0,0.9)) drop-shadow(0px 8px 28px rgba(0,0,0,0.55))";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const pts = (p: number[][]) => p.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
const mix = (a: string, b: string, t: number) => {
  const c = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [r1, g1, b1] = c(a), [r2, g2, b2] = c(b);
  const v = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${v(r1, r2)}${v(g1, g2)}${v(b1, b2)}`;
};

// two balanced lines out of the label's words, computed from the FULL text so the layout
// never moves while the strip is printing
const fit = (text: string): string[] => {
  const words = text.split(" ").filter(Boolean);
  if (words.length < 2) return [text];
  let best = 1, score = 1e9;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length, b = words.slice(i).join(" ").length;
    if (Math.max(a, b) < score) { score = Math.max(a, b); best = i; }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
};

export const BoxGlyph: React.FC<{
  w: number; h: number; text?: string; open?: number; tilt?: number;
  print?: number;  // 0 = blank label, 0..1 = the label strip feeding out and printing, 1 = printed
  split?: number;  // 0..1 the tape splitting down the seam, the two halves peeling back
  lit?: number;    // 0..1 a brief brighten on the label
  slack?: number;  // 0..1 loose tape end, snaps flat as the box lands
  flare?: number;  // degrees the open flaps lean out from vertical (default 15)
}> = ({ w, h, text = "", open = 0, tilt = 0, print = 1, split = 0, lit = 0, slack = 0, flare = 15 }) => {
  const dx = 0.17 * w, dy = 0.115 * h;
  const fw = w - dx, ty = dy, fh = h - dy, hw = fw / 2, cx = hw;
  const tw = 0.050 * w;                       // tape half width
  const sw = Math.max(1.4, 0.0035 * w);       // edge hairline

  // a point on a closed top flap, carried to where the open flap holds it
  const LEAN = Math.sin((flare * Math.PI) / 180), RISE = Math.cos((flare * Math.PI) / 180);
  const flap = (p: number[], right: boolean): number[] => {
    const v = (ty - p[1]) / ty;
    const u = right ? (fw + v * dx - p[0]) / hw : (p[0] - v * dx) / hw;
    const ax = right ? fw : 0;
    const ox = ax + u * (right ? LEAN : -LEAN) * hw + v * dx;
    const oy = ty + u * -RISE * hw + v * -ty;
    return [p[0] + (ox - p[0]) * open, p[1] + (oy - p[1]) * open];
  };
  const peel = (p: number[], right: boolean): number[] =>
    [p[0] + (right ? 1 : -1) * 0.10 * hw * split, p[1] - 0.055 * h * split];

  const flapL = [[0, ty], [cx, ty], [dx + cx, 0], [dx, 0]].map((p) => flap(p, false));
  const flapR = [[cx, ty], [fw, ty], [w, 0], [dx + cx, 0]].map((p) => flap(p, true));
  const tapeL = [[cx - tw, ty], peel([cx, ty], false), peel([dx + cx, 0], false), [dx + cx - tw, 0]]
    .map((p) => flap(p, false));
  const tapeR = [peel([cx, ty], true), [cx + tw, ty], [dx + cx + tw, 0], peel([dx + cx, 0], true)]
    .map((p) => flap(p, true));

  // the tape down the front, in two halves so it can split, with a loose end while it falls
  const ftl = 0.26 * fh, curl = slack * 0.11 * fh;
  const frontHalf = (right: boolean) => {
    const s = right ? 1 : -1;
    return pts([[cx, ty], [cx + s * tw, ty], [cx + s * tw, ty + ftl - curl], [cx, ty + ftl - curl]]);
  };

  // the shipping label, left aligned the way a real one is, printed by a strip feeding out
  // of a slot at its left edge
  const lw = 0.78 * fw, lh = 0.52 * fh, lx = (fw - lw) / 2, ly = ty + 0.28 * fh;
  const pad = 0.055 * lw;
  const lines = fit(text);
  const longest = Math.max(...lines.map((l) => l.length), 1);
  const fs = Math.max(
    10,
    Math.min((lw - 2 * pad) / (0.74 * longest), (lh * 0.56) / (lines.length * 1.16))
  );
  const clipW = clamp01(print) * lw;
  const printing = print > 0.001 && print < 0.999;

  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: CAP_SHADOW }}>
      <title>a taped cardboard box with a shipping label</title>
      <defs>
        <linearGradient id="bx-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(FACE, "#E3B888", 0.55)} /><stop offset="1" stopColor={FACE} />
        </linearGradient>
        <clipPath id="bx-strip"><rect x={lx} y={ly - 2} width={Math.max(0, clipW)} height={lh + 4} /></clipPath>
      </defs>

      <g transform={`rotate(${tilt} ${w / 2} ${h})`}>
        {/* the inside, seen once the flaps lift */}
        {open > 0.01 && (
          <>
            <polygon points={pts([[0, ty], [fw, ty], [w, 0], [dx, 0]])} fill={CAVITY} />
            <polygon points={pts([[0.10 * fw, ty - 0.28 * dy], [0.90 * fw, ty - 0.28 * dy], [0.90 * fw + dx * 0.7, 0.30 * dy], [0.10 * fw + dx * 0.7, 0.30 * dy]])} fill={INNER} opacity={0.85 * open} />
          </>
        )}

        {/* the two top flaps and the tape they carry */}
        <polygon points={pts(flapL)} fill={mix(TOP, "#D9BC90", open)} stroke={EDGE} strokeWidth={sw} strokeLinejoin="round" />
        <polygon points={pts(flapR)} fill={mix(TOP, "#CFB185", open)} stroke={EDGE} strokeWidth={sw} strokeLinejoin="round" />
        <polygon points={pts(tapeL)} fill={TAPE} opacity={0.92} stroke={TAPE_EDGE} strokeWidth={sw * 0.7} />
        <polygon points={pts(tapeR)} fill={TAPE} opacity={0.92} stroke={TAPE_EDGE} strokeWidth={sw * 0.7} />

        {/* the right side, then the front */}
        <polygon points={pts([[fw, ty], [w, 0], [w, h - dy], [fw, h]])} fill={SIDE} stroke={EDGE} strokeWidth={sw} strokeLinejoin="round" />
        <polygon points={pts([[0, ty], [fw, ty], [fw, h], [0, h]])} fill="url(#bx-face)" stroke={EDGE} strokeWidth={sw} strokeLinejoin="round" />
        <line x1={0} y1={ty + 0.030 * fh} x2={fw} y2={ty + 0.030 * fh} stroke="#E0BE92" strokeWidth={sw * 0.8} opacity={0.6} />

        {/* the tape down the front seam */}
        <polygon points={frontHalf(false)} fill={TAPE} opacity={0.9} stroke={TAPE_EDGE} strokeWidth={sw * 0.7}
          transform={split > 0 ? `rotate(${-7 * split} ${cx} ${ty}) translate(${-0.05 * fw * split} 0)` : undefined} />
        <polygon points={frontHalf(true)} fill={TAPE} opacity={0.9} stroke={TAPE_EDGE} strokeWidth={sw * 0.7}
          transform={split > 0 ? `rotate(${7 * split} ${cx} ${ty}) translate(${0.05 * fw * split} 0)` : undefined} />

        {/* the shipping label: a blank plate, then the printed strip feeding across it */}
        <rect x={lx} y={ly} width={lw} height={lh} fill={PLATE} />
        <line x1={lx + pad} y1={ly + lh * 0.135} x2={lx + lw - pad} y2={ly + lh * 0.135} stroke="#CFC8B8" strokeWidth={sw * 0.7} />
        {[0.42, 0.56].map((f) => (
          <line key={f} x1={lx + pad} y1={ly + lh * f} x2={lx + lw - pad * (f > 0.5 ? 3.4 : 1)} y2={ly + lh * f} stroke="#DAD3C3" strokeWidth={sw * 0.6} />
        ))}
        <rect x={lx} y={ly} width={lw} height={lh} fill="none" stroke="#B9B2A2" strokeWidth={sw * 0.6} />
        <g clipPath="url(#bx-strip)">
          <rect x={lx} y={ly} width={lw} height={lh} fill={PAPER} />
          <line x1={lx + pad} y1={ly + lh * 0.135} x2={lx + lw - pad} y2={ly + lh * 0.135} stroke={HAIR} strokeWidth={sw * 0.8} />
          {lines.map((ln, i) => (
            <text key={ln + i} x={lx + pad} y={ly + lh * 0.215 + fs * (1 + i * 1.16)}
              style={{ ...label(fs, LABEL_INK), letterSpacing: `${0.06 * fs}px` } as React.CSSProperties}>{ln}</text>
          ))}
          {Array.from({ length: 22 }, (_, i) => (
            <rect key={i} x={lx + pad + i * ((lw - 2 * pad) / 22)} y={ly + lh * 0.805}
              width={((lw - 2 * pad) / 22) * (i % 3 === 0 ? 0.62 : i % 4 === 0 ? 0.30 : 0.20)}
              height={lh * 0.125} fill={LABEL_INK} opacity={0.85} />
          ))}
        </g>
        {lit > 0.01 && <rect x={lx} y={ly} width={lw} height={lh} fill="#FFFFFF" opacity={0.45 * lit} />}
        {printing && (
          <>
            <rect x={lx - 0.030 * fw} y={ly - lh * 0.06} width={0.024 * fw} height={lh * 1.12} fill="#3A342C" />
            <rect x={lx + clipW - sw} y={ly - lh * 0.03} width={sw * 2.6} height={lh * 1.06} fill="#3A342C" opacity={0.9} />
          </>
        )}
      </g>
    </svg>
  );
};

// --- V5: the delivery, the label, the shake ---------------------------------------------
export const Box: React.FC<CardProps & { data: BoxData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const bw = 0.66 * w, bh = 0.64 * h;
  const bx = (w - bw) / 2, by = 0.95 * h - bh;
  const dropAt = beats.need ?? fromMs + 900;
  const printAt = beats.label ?? dropAt + 450;
  const think = beats.thinking ?? printAt + 1300;
  const what = beats.what ?? think + 1000, the = beats.the ?? what + 240;
  const hell = beats.hell ?? the + 150, settle = beats.settle ?? hell + 150;

  // the drop: falls, lands, squashes, hops once, settles (~450 ms)
  const d = tMs - dropAt;
  const fall = clamp01(d / 220);
  let dyOff = -0.62 * bh * (1 - fall * fall);
  let sy = 1, sx = 1;
  if (d >= 220 && d < 305) { const p = (d - 220) / 85; const k = 0.11 * Math.sin(Math.PI * p); sy = 1 - k; sx = 1 + 0.6 * k; }
  if (d >= 305 && d < 435) { dyOff = -0.085 * bh * Math.sin(Math.PI * ((d - 305) / 130)); }
  const slack = 1 - clamp01((d - 110) / 190);
  const dropOp = clamp01(d / 70);

  // the tilts: a nudge on "thinking", then hard left / right / harder left with a rattle
  const keys = [
    { at: dropAt, to: 0, ms: 1 }, { at: what, to: -8, ms: 130 }, { at: the, to: 8, ms: 130 },
    { at: hell, to: -12, ms: 110 }, { at: settle, to: 0, ms: 300 },
  ];
  let ti = 0;
  for (let i = 0; i < keys.length; i++) if (tMs >= keys[i].at) ti = i;
  const prev = ti === 0 ? 0 : keys[ti - 1].to;
  const kp = clamp01((tMs - keys[ti].at) / keys[ti].ms);
  let tilt = ti === keys.length - 1
    ? prev * Math.pow(1 - kp, 3) + 1.8 * Math.sin(2 * Math.PI * kp) * (1 - kp)
    : prev + (keys[ti].to - prev) * kp;
  if (tMs >= think && tMs < think + 260) tilt += 2 * Math.sin(Math.PI * ((tMs - think) / 260));
  if (tMs >= hell && tMs < hell + 150) {
    const p = (tMs - hell) / 150;
    tilt += 3.5 * Math.cos((2 * Math.PI * (tMs - hell)) / 125) * (1 - p);
  }

  const print = clamp01((tMs - printAt) / 1000);
  const lit = tMs >= settle ? Math.sin(Math.PI * clamp01((tMs - settle) / 500)) : 0;

  // one big terracotta ? out of the tape seam on each of the three words
  const seam = { x: bx + (bw - 0.17 * bw) / 2, y: by + 0.115 * bh };
  const marks = [
    { at: what, dxE: -0.11 * w, rot: -16 }, { at: the, dxE: 0.10 * w, rot: 14 },
    { at: hell, dxE: -0.015 * w, rot: -6 },
  ];
  const qfs = 0.150 * w;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <div style={{
        position: "absolute", left: 0.018 * w, top: 0.008 * h,
        ...label(0.160 * h, ACCENT), lineHeight: 1,
        textShadow: "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)",
      }}>{data.step ?? "3"}</div>

      {tMs >= dropAt && (
        <div style={{
          position: "absolute", left: bx, top: by, width: bw, height: bh,
          transform: `translateY(${dyOff.toFixed(2)}px) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`,
          transformOrigin: "50% 100%", opacity: dropOp,
        }}>
          <BoxGlyph w={bw} h={bh} text={data.label ?? ""} tilt={tilt} print={tMs >= printAt ? print : 0} lit={lit} slack={slack} />
        </div>
      )}

      {marks.map((m) => {
        const p = clamp01((tMs - m.at) / 500);
        if (tMs < m.at || p >= 1) return null;
        const e = 1 - Math.pow(1 - p, 2);
        return (
          <div key={m.at} style={{
            position: "absolute", left: seam.x + m.dxE * e - qfs * 0.3, top: seam.y - 168 * e - qfs * 0.5,
            ...label(qfs, ACCENT), lineHeight: 1, opacity: Math.min(1, (1 - p) * 2.2),
            transform: `rotate(${m.rot * e}deg) scale(${(0.45 + 0.75 * e).toFixed(3)})`,
            transformOrigin: "50% 100%",
            textShadow: "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)",
          }}>?</div>
        );
      })}
    </div>
  );
};
