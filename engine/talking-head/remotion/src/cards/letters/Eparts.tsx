import React from "react";
import { INK } from "./shared";

// edit-i-oneshot, family E parts: the objects the jokes and the plan are made of.
// Everything here is drawn the way the real thing is drawn: ink lines with a white halo so they
// hold on their cream wall, paper as white stock with a warm edge and a soft shadow, a wire bin you
// can see through, a hand as a clean line illustration. No flat icons, no boxes with text in them.

// ─────────────────────────────────────────────────────────────────────────────
// the ink line: the same path twice, white halo first, then the ink on top.
// `p` draws the line on from 0 to 1 (pathLength=1, so one dash covers any path).
// ─────────────────────────────────────────────────────────────────────────────

export const Ink: React.FC<{
  d: string; sw?: number; p?: number; color?: string; fill?: string; halo?: number;
  cap?: "round" | "butt" | "square"; opacity?: number; haloOpacity?: number;
}> = ({ d, sw = 2.4, p = 1, color = INK, fill = "none", halo = 5, cap = "round", opacity = 1, haloOpacity = 0.82 }) => {
  if (p <= 0.001) return null;
  const dash: React.SVGProps<SVGPathElement> =
    p < 1 ? { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p } : {};
  return (
    <g opacity={opacity}>
      <path
        d={d} fill="none" stroke="#FFFFFF" strokeOpacity={haloOpacity} strokeWidth={sw + halo}
        strokeLinecap={cap} strokeLinejoin="round" {...dash}
      />
      <path
        d={d} fill={p < 1 ? "none" : fill} stroke={color} strokeWidth={sw}
        strokeLinecap={cap} strokeLinejoin="round" {...dash}
      />
    </g>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// the handwriting: one pen, eleven letterforms, a forward slant and a baseline that
// is never quite level. Drawn as SVG strokes, never a handwriting font.
// Units: baseline y = 0, x-height 13, cap height 22.
// ─────────────────────────────────────────────────────────────────────────────

type Glyph = { d: string; adv: number };

const SCRIPT: Record<string, Glyph> = {
  M: {
    d: "M0,0 C0.2,-6 1.2,-16 2.2,-20.6 C2.7,-22.6 4.4,-22.6 5,-20.6 L9.4,-7.6 L13.8,-20.6 C14.4,-22.6 16.1,-22.6 16.6,-20.6 C17.6,-16 18.6,-6 18.8,0",
    adv: 21,
  },
  r: { d: "M0,0 C0.5,-4.4 1.2,-9.2 1.9,-13.2 M1.3,-9.6 C2.8,-12.8 5.6,-14.2 7.4,-12.4", adv: 9.5 },
  ".": { d: "M0.9,-1 L1.35,-1", adv: 5.5 },
  " ": { d: "", adv: 7.5 },
  a: {
    d: "M8.8,-12.6 C6.4,-14 2.6,-13.2 1.1,-9.8 C-0.3,-6.5 0.9,-2.2 3.9,-1.5 C6.3,-1 8.4,-3.2 8.6,-6.6 M8.8,-12.6 C8.6,-9 8.3,-4.6 8.4,-2.4 C8.5,-0.6 9.6,0.1 11.2,-0.8",
    adv: 12.5,
  },
  t: { d: "M5.2,-19 C4.4,-13 3.2,-6 3.1,-3.2 C3,-1 4.8,-0.1 6.8,-1.4 M0.2,-12 L8.4,-13", adv: 9.5 },
  h: {
    d: "M0.8,0 C1.4,-6.4 2.2,-14.6 3.2,-20.4 M1.7,-8.8 C3.6,-12.6 6.6,-13.8 8.2,-12 C9.4,-10.6 8.8,-7.4 8.4,-4.4 C8.1,-2 8.3,-0.7 9.3,0.1",
    adv: 11.5,
  },
  e: {
    d: "M0.9,-6.4 C3.3,-6.6 6.4,-7.4 7.8,-8.8 C9.2,-10.2 8.4,-12.6 6.2,-12.4 C3.2,-12.2 0.5,-9.2 0.5,-5.8 C0.5,-2.6 2.8,-0.7 5.6,-1.3 C7.2,-1.7 8.5,-2.6 9.5,-3.8",
    adv: 11,
  },
  w: {
    d: "M0,-13 C0.7,-8 1.7,-3.2 2.7,-1 C3.1,-0.1 3.9,-0.1 4.3,-1 L6.7,-9.2 L8.5,-1.2 C8.8,-0.2 9.6,-0.2 10,-1.1 C11.1,-3.6 12.3,-8.8 12.7,-13",
    adv: 14,
  },
};

const WOBBLE = [0, 0.35, 0.1, 0, -0.45, 0.2, -0.1, 0.35, -0.2, 0.25, 0.05];

const advOf = (name: string): number =>
  name.split("").reduce((s, ch) => s + (SCRIPT[ch]?.adv ?? 8), 0);

/** A name written by hand: pen strokes at a slant, on a baseline that drifts. */
export const ScriptName: React.FC<{ name: string; inkW: number; color?: string; sw?: number }> = ({
  name, inkW, color = "#1C2130", sw = 1.9,
}) => {
  const adv = advOf(name);
  const s = inkW / adv;
  const vbW = adv + 9;
  const vbH = 31;
  let x = 1;
  const out: React.ReactNode[] = [];
  name.split("").forEach((ch, i) => {
    const g = SCRIPT[ch];
    if (g && g.d) {
      out.push(
        <path
          key={i} d={g.d} fill="none" stroke={color} strokeWidth={sw}
          strokeLinecap="round" strokeLinejoin="round"
          transform={`translate(${x},${WOBBLE[i % WOBBLE.length]})`}
        />,
      );
    }
    x += g?.adv ?? 8;
  });
  return (
    <svg
      width={vbW * s} height={vbH * s} viewBox={`-3 -26 ${vbW} ${vbH}`}
      style={{ display: "block", overflow: "visible" }}
    >
      <g transform="skewX(-9)">{out}</g>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// the C5 envelope, front up: white stock with a warm edge, the flap folded behind,
// the name written across it. The same object the letter went into.
// ─────────────────────────────────────────────────────────────────────────────

export const EnvelopeFace: React.FC<{
  w: number; name?: string; shade?: number; shadow?: string;
}> = ({ w, name, shade = 0, shadow = "0 10px 26px rgba(0,0,0,0.28)" }) => {
  const h = w / 1.414;
  const fs = Math.max(1, w / 240);
  return (
    <div
      style={{
        position: "relative", width: w, height: h,
        background: "linear-gradient(158deg, #FFFFFF 0%, #FCFAF5 46%, #F3EFE6 100%)",
        boxShadow: `${shadow}, inset 0 0 0 ${Math.max(1, 1.1 * fs)}px rgba(120,108,90,0.32)`,
        overflow: "hidden",
      }}
    >
      {/* the flap folded down behind the front, and the fold shadow along it */}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, display: "block" }}>
        <path
          d={`M0,0 L${w / 2},${0.44 * h} L${w},0`} fill="none"
          stroke="rgba(122,110,92,0.36)" strokeWidth={1.4 * fs} strokeLinejoin="round"
        />
        <path
          d={`M0,${2.5 * fs} L${w / 2},${0.44 * h + 2.2 * fs} L${w},${2.5 * fs}`} fill="none"
          stroke="rgba(255,255,255,0.85)" strokeWidth={1.6 * fs} strokeLinejoin="round"
        />
        {/* the side seams of a real wallet envelope */}
        <path
          d={`M0,${h} L${0.20 * w},${0.50 * h} M${w},${h} L${0.80 * w},${0.50 * h}`} fill="none"
          stroke="rgba(122,110,92,0.16)" strokeWidth={1.2 * fs}
        />
      </svg>
      {name ? (
        <div style={{ position: "absolute", left: 0.20 * w, top: 0.555 * h }}>
          <ScriptName name={name} inkW={0.60 * w} sw={Math.max(1.2, 2.0 * fs)} />
        </div>
      ) : null}
      {/* tucked under something big: the thing's shadow falls across it, deepest where it
          goes under and fading out over the half that is still in the light */}
      {shade > 0 ? (
        <div
          style={{
            position: "absolute", inset: 0, opacity: shade,
            background:
              "linear-gradient(to bottom, rgba(18,14,8,0.72) 0%, rgba(18,14,8,0.66) 32%,"
              + " rgba(18,14,8,0.38) 48%, rgba(18,14,8,0.14) 66%, rgba(18,14,8,0.02) 82%, rgba(18,14,8,0) 94%)",
          }}
        />
      ) : null}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// the flyer: A5, glossy, four colours and a starburst, and not one word on it.
// ─────────────────────────────────────────────────────────────────────────────

const burst = (cx: number, cy: number, rOut: number, rIn: number, points: number): string => {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI * i) / points - Math.PI / 2;
    const r = i % 2 === 0 ? rOut : rIn;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
};

export const FlyerFace: React.FC<{ w: number; h: number; accent: string }> = ({ w, h, accent }) => (
  <g>
    <defs>
      <linearGradient id="e-gloss" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.42" />
        <stop offset="38%" stopColor="#FFFFFF" stopOpacity="0.06" />
        <stop offset="62%" stopColor="#FFFFFF" stopOpacity="0.26" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width={w} height={h} fill="#F4C518" />
    <rect x="0" y={0.52 * h} width={w} height={0.48 * h} fill="#1E2F86" />
    <rect x="0" y={0.52 * h} width={w} height={0.055 * h} fill="#FFFFFF" />
    <path d={burst(0.5 * w, 0.335 * h, 0.375 * w, 0.21 * w, 14)} fill={accent} />
    <circle cx={0.5 * w} cy={0.335 * h} r={0.155 * w} fill="#FFFFFF" />
    <circle cx={0.5 * w} cy={0.335 * h} r={0.085 * w} fill="#1E2F86" />
    <rect x={0.16 * w} y={0.70 * h} width={0.68 * w} height={0.075 * h} fill={accent} />
    <rect x={0.30 * w} y={0.84 * h} width={0.40 * w} height={0.065 * h} fill="#F4C518" />
    <rect x="0" y="0" width={w} height={h} fill="url(#e-gloss)" />
    <rect x="0" y="0" width={w} height={h} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={Math.max(1.2, 0.011 * w)} />
  </g>
);

// ─────────────────────────────────────────────────────────────────────────────
// the wire bin: a rim you look into, a tapered mesh body, a base ring.
// ─────────────────────────────────────────────────────────────────────────────

export type BinGeom = { cx: number; ry: number; rx: number; topY: number; botY: number; brx: number; bry: number };

export const binSilhouette = (g: BinGeom): string => {
  const { cx, rx, ry, topY, botY, brx, bry } = g;
  return `M${cx - rx},${topY} A${rx},${ry} 0 1 0 ${cx + rx},${topY} A${rx},${ry} 0 1 0 ${cx - rx},${topY} Z`
    + ` M${cx - rx},${topY} L${cx - brx},${botY} A${brx},${bry} 0 0 0 ${cx + brx},${botY} L${cx + rx},${topY} Z`;
};

/** the back wall of the bin: drawn first, so anything that falls in sits in front of it */
export const BinBack: React.FC<{ g: BinGeom; p: number }> = ({ g, p }) => (
  <Ink d={`M${g.cx - g.rx},${g.topY} A${g.rx},${g.ry} 0 0 1 ${g.cx + g.rx},${g.topY}`} sw={2.4} p={p} halo={5} />
);

/** everything you see IN FRONT of the bin's contents: the sides, the base, the wire, the near rim */
export const BinBody: React.FC<{ g: BinGeom; p: number }> = ({ g, p }) => {
  const { cx, rx, ry, topY, botY, brx, bry } = g;
  const mesh: string[] = [];
  for (let i = 1; i <= 9; i++) {
    const a = Math.asin(-1 + (2 * i) / 10);
    mesh.push(
      `M${(cx + rx * Math.sin(a)).toFixed(1)},${(topY + ry * Math.cos(a)).toFixed(1)}`
      + ` L${(cx + brx * Math.sin(a)).toFixed(1)},${(botY + bry * Math.cos(a)).toFixed(1)}`,
    );
  }
  const hoop = (f: number): string => {
    const r = rx + (brx - rx) * f;
    const rr = ry + (bry - ry) * f;
    const y = topY + (botY - topY) * f;
    return `M${cx - r},${y} A${r},${rr} 0 0 0 ${cx + r},${y}`;
  };
  return (
    <>
      <g opacity={0.75}>
        {mesh.map((d, i) => <Ink key={i} d={d} sw={1.5} p={p} halo={2.4} haloOpacity={0.45} />)}
        <Ink d={hoop(0.34)} sw={1.5} p={p} halo={2.4} haloOpacity={0.45} />
        <Ink d={hoop(0.68)} sw={1.5} p={p} halo={2.4} haloOpacity={0.45} />
      </g>
      <Ink d={`M${cx - rx},${topY} L${cx - brx},${botY}`} sw={2.6} p={p} halo={5} />
      <Ink d={`M${cx + rx},${topY} L${cx + brx},${botY}`} sw={2.6} p={p} halo={5} />
      <Ink d={`M${cx - brx},${botY} A${brx},${bry} 0 0 0 ${cx + brx},${botY}`} sw={2.6} p={p} halo={5} />
      <Ink d={`M${cx - rx},${topY} A${rx},${ry} 0 0 0 ${cx + rx},${topY}`} sw={2.6} p={p} halo={5} />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// the hand that flicks. One clean outline, a thumb, two creases, a cuff.
// Fingertip sits at local (208, 52).
// ─────────────────────────────────────────────────────────────────────────────

export const FlickHand: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <g transform={`scale(${scale})`}>
    <Ink
      sw={3.2} halo={7} fill="#FFFFFF"
      d={
        "M0,22 L58,14 C82,10 100,16 112,28 C122,38 132,44 148,46 L218,52" +
        " C230,54 232,66 220,68 L150,72 C142,82 136,92 124,98" +
        " C108,106 84,106 68,100 L0,80 Z"
      }
    />
    {/* the thumb lying across the fist, the two finger joints, the knuckle */}
    <Ink d="M72,99 C74,84 84,72 100,66 C112,61 122,63 128,69 C133,74 133,81 128,85" sw={2.6} halo={5} />
    <Ink d="M168,50 L165,71" sw={2} halo={3.6} haloOpacity={0.6} />
    <Ink d="M193,51 L190,71" sw={2} halo={3.6} haloOpacity={0.6} />
    <Ink d="M112,28 C107,39 107,50 112,58" sw={1.9} halo={3.4} haloOpacity={0.55} />
    <Ink d="M9,24 L9,81 M22,22 L22,83" sw={2.4} halo={4.6} />
  </g>
);
