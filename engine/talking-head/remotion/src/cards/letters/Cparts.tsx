import React from "react";
import { spring } from "remotion";
import { ACCENT, INK, PAPER, clamp01, easeInOut, easeOut } from "./shared";
import { LABEL_FONT } from "../theme";

// edit-i-oneshot, family C parts: the envelope, the hands, the counter and the props the
// reception scenes are built from. Everything here is a drawn OBJECT with a material: paper is
// white with a shadow, wood has a grain and an edge, steel has a highlight, skin is a warm
// neutral behind an ink outline. Ink lines carry a white halo so they hold on the cream wall.

export const SKIN = "#F4E2CE";
export const CUFF = "#E8E4DB";
export const PAPER_BACK = "#F2EFE7";
export const INKPEN = "#1C2333";
export const WOOD_FAR = "#E7D4B4";
export const WOOD_NEAR = "#CDAF85";
export const WOOD_EDGE = "#A98455";

export const sp = (tMs: number, at: number, fps: number, damping = 14): number =>
  spring({ frame: Math.max(0, ((tMs - at) / 1000) * fps), fps, config: { damping, stiffness: 300, mass: 0.7 } });
export const seg01 = (t: number, a: number, b: number): number => clamp01((t - a) / Math.max(1, b - a));
/** one pulse: 0 -> 1 -> 0 over ms, for a soft push on a thing that is already there */
export const pulse = (t: number, at: number, ms: number): number => {
  const x = seg01(t, at, at + ms);
  return x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x);
};
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** an ink line illustration: the white halo first, then the ink on top (reference edit D grammar) */
export const Ink: React.FC<{
  d: string; fill?: string; sw?: number; halo?: number; opacity?: number;
}> = ({ d, fill = "none", sw = 5, halo = 8, opacity = 1 }) => (
  <g opacity={opacity}>
    <path d={d} fill={fill === "none" ? "none" : "#FFFFFF"} stroke="#FFFFFF" strokeWidth={sw + halo}
      strokeLinejoin="round" strokeLinecap="round" opacity={0.6} />
    <path d={d} fill={fill} stroke={INK} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
  </g>
);

/** one finger: a capsule with a nail, simplified until it reads at card scale */
export const Finger: React.FC<{ x: number; y: number; len: number; th: number; rot: number; nail?: boolean }> =
  ({ x, y, len, th, rot, nail = true }) => (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={0} y={-th / 2} width={len} height={th} rx={th / 2} fill="#FFFFFF" stroke="#FFFFFF"
        strokeWidth={10} opacity={0.82} />
      <rect x={0} y={-th / 2} width={len} height={th} rx={th / 2} fill={SKIN} stroke={INK} strokeWidth={4.5} />
      {nail && (
        <ellipse cx={len - th * 0.40} cy={0} rx={th * 0.24} ry={th * 0.32}
          fill="rgba(255,255,255,0.55)" stroke="rgba(20,22,31,0.30)" strokeWidth={2} />
      )}
    </g>
  );

// ─────────────────────────────────────────────────────────────────────────────
// the handwriting: ONE continuous stroke, authored as cubics so the nib can ride it
// ─────────────────────────────────────────────────────────────────────────────

export const NAME_D = [
  "M 40 200",
  "C 36 150 34 100 38 58", "C 52 94 66 130 80 158", "C 94 130 108 94 122 58", "C 126 102 127 154 124 200",
  "C 128 174 136 142 150 126", "C 160 114 180 116 180 132", "C 178 154 174 180 172 200",
  "C 176 208 184 212 192 206", "C 200 199 212 203 212 212", "C 212 221 201 224 196 217",
  "C 208 228 232 230 248 222", "C 252 218 256 210 258 200",
  "C 254 150 252 100 256 58", "C 270 94 284 130 298 158", "C 312 130 326 94 340 58", "C 344 102 345 154 342 200",
  "C 350 174 362 138 392 124", "C 376 108 350 116 348 150", "C 346 182 368 202 396 194",
  "C 416 186 420 154 418 124", "C 422 152 422 178 420 200",
  "C 424 168 434 124 444 96", "C 452 132 454 168 452 196", "C 454 206 464 208 476 200",
  "C 486 168 494 130 502 96", "C 510 132 512 168 510 196", "C 514 186 522 164 528 136",
  "C 504 124 468 122 432 126", "C 468 124 508 126 536 130",
  "C 546 116 556 88 566 72", "C 574 112 576 162 574 196",
  "C 576 158 590 136 610 142", "C 626 148 630 176 628 196",
  "C 634 182 644 162 660 150", "C 678 136 690 152 672 166", "C 654 180 648 196 670 198",
  "C 686 200 696 190 702 178",
  "C 708 162 712 144 718 126", "C 726 152 732 178 736 196", "C 744 174 752 146 758 126",
  "C 766 152 772 178 776 196", "C 784 174 792 146 798 126", "C 808 118 826 122 840 136",
].join(" ");

export const NAME_VB = { x: 24, y: 46, w: 836, h: 194 };
/** where the name block sits on the envelope, as fractions of the envelope box */
export const NAME_BOX = { left: 0.13, top: 0.545, width: 0.74 };

type Cubic = [number, number, number, number, number, number, number, number];
const CUBICS: Cubic[] = (() => {
  const n = (NAME_D.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  const out: Cubic[] = [];
  let x = n[0], y = n[1];
  for (let i = 2; i + 5 < n.length; i += 6) {
    out.push([x, y, n[i], n[i + 1], n[i + 2], n[i + 3], n[i + 4], n[i + 5]]);
    x = n[i + 4]; y = n[i + 5];
  }
  return out;
})();

const TABLE: { x: number; y: number; l: number }[] = (() => {
  const pts: { x: number; y: number; l: number }[] = [];
  let len = 0, px = CUBICS[0][0], py = CUBICS[0][1];
  pts.push({ x: px, y: py, l: 0 });
  for (const c of CUBICS) {
    for (let i = 1; i <= 14; i++) {
      const t = i / 14, u = 1 - t;
      const a = u * u * u, b = 3 * u * u * t, d = 3 * u * t * t, e = t * t * t;
      const qx = a * c[0] + b * c[2] + d * c[4] + e * c[6];
      const qy = a * c[1] + b * c[3] + d * c[5] + e * c[7];
      len += Math.hypot(qx - px, qy - py);
      pts.push({ x: qx, y: qy, l: len });
      px = qx; py = qy;
    }
  }
  return pts;
})();

/** the nib's point at fraction f of the stroke, in NAME_VB coordinates */
export const nameAt = (f: number): { x: number; y: number } => {
  const total = TABLE[TABLE.length - 1].l;
  const want = clamp01(f) * total;
  let i = 1;
  while (i < TABLE.length - 1 && TABLE[i].l < want) i++;
  const a = TABLE[i - 1], b = TABLE[i];
  const t = b.l === a.l ? 0 : (want - a.l) / (b.l - a.l);
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
};

/** the name, written by the nib from 0 to 1, never letters popping */
export const Handwriting: React.FC<{ written01: number; halo?: boolean; sw?: number }> =
  ({ written01, halo = false, sw = 8.5 }) => (
    <g>
      {halo && (
        <path d={NAME_D} fill="none" stroke="#FFFFFF" strokeWidth={sw + 12} strokeLinecap="round"
          strokeLinejoin="round" opacity={0.8} pathLength={1}
          strokeDasharray="1 1" strokeDashoffset={1 - clamp01(written01)} />
      )}
      <path d={NAME_D} fill="none" stroke={INKPEN} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
        pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01(written01)} />
    </g>
  );

// ─────────────────────────────────────────────────────────────────────────────
// the C5 envelope, drawn once and reused by every card that carries it
// ─────────────────────────────────────────────────────────────────────────────

export const ENV_RATIO = 1.414;

export const EnvelopeC5: React.FC<{
  w: number; name: string; written01: number; sealedAccent?: boolean;
  accent01?: number; flap01?: number; nameScale?: number; shadow?: boolean;
}> = ({ w, written01, sealedAccent, accent01 = 1, flap01 = 0, nameScale = 1, shadow = true }) => {
  const H = 707, W = 1000;
  const apex = 325 - 537 * clamp01(flap01); // closed +0.46H, open -0.30H (the flap tipped back)
  const open = apex < 0;
  const flapPts = `0,0 ${W},0 ${W / 2},${apex}`;
  const ns = (W * NAME_BOX.width) / NAME_VB.w;
  const accentOn = sealedAccent ? clamp01(accent01) : 0;
  return (
    <svg width={w} height={w / ENV_RATIO} viewBox={`-6 -6 ${W + 12} ${H + 12}`}
      style={{ display: "block", overflow: "visible", filter: shadow ? "drop-shadow(0 8px 20px rgba(0,0,0,0.22))" : undefined }}>
      <defs>
        <linearGradient id="envc-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#EFECE4" />
        </linearGradient>
        <linearGradient id="envc-mouth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(20,22,31,0.34)" /><stop offset="1" stopColor="rgba(20,22,31,0)" />
        </linearGradient>
        <linearGradient id="envc-flap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E7E2D8" /><stop offset="1" stopColor="#F6F3EC" />
        </linearGradient>
      </defs>
      {open && (
        <polygon points={flapPts} fill="url(#envc-flap)" stroke="rgba(20,22,31,0.44)" strokeWidth={4.5} strokeLinejoin="round" />
      )}
      <rect x={0} y={0} width={W} height={H} fill="url(#envc-body)" stroke="rgba(20,22,31,0.46)" strokeWidth={4.5} />
      {open && <rect x={3} y={3} width={W - 6} height={118} fill="url(#envc-mouth)" />}
      {!open && (
        <>
          <polygon points={`0,6 ${W},6 ${W / 2},${apex + 8}`} fill="rgba(20,22,31,0.10)" />
          <polygon points={flapPts} fill="url(#envc-body)" stroke="rgba(20,22,31,0.42)" strokeWidth={4} strokeLinejoin="round" />
          <polyline points={`0,0 ${W / 2},${apex} ${W},0`} fill="none" stroke="rgba(20,22,31,0.50)" strokeWidth={4.5} strokeLinejoin="round" />
          {accentOn > 0.01 && (
            <g opacity={accentOn}>
              <polyline points={`0,0 ${W / 2},${apex} ${W},0`} fill="none" style={{ stroke: ACCENT }} strokeWidth={20}
                strokeLinejoin="round" opacity={0.35} filter="blur(8px)" />
              <polyline points={`0,0 ${W / 2},${apex} ${W},0`} fill="none" style={{ stroke: ACCENT }} strokeWidth={8} strokeLinejoin="round" />
            </g>
          )}
        </>
      )}
      <g transform={`translate(${W * NAME_BOX.left} ${H * NAME_BOX.top}) scale(${ns * nameScale}) translate(${-NAME_VB.x} ${-NAME_VB.y})`}>
        <Handwriting written01={written01} sw={8} />
      </g>
    </svg>
  );
};

/** the pen, nib at the group's origin, leaning up to the right */
export const FountainPen: React.FC<{ s: number; rot?: number }> = ({ s, rot = -34 }) => (
  <g transform={`rotate(${rot}) scale(${s})`}>
    <g opacity={0.5}>
      <path d="M -12 -26 L 12 -26 L 14 -196 L -14 -196 Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={9} />
      <path d="M 0 0 L 8 -28 L -8 -28 Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={9} />
    </g>
    <path d="M -13 -62 L 13 -62 L 15 -196 Q 0 -212 -15 -196 Z" fill="#181B24" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <rect x={-13} y={-186} width={7} height={110} fill="rgba(255,255,255,0.18)" />
    <rect x={5} y={-190} width={7} height={86} rx={3} fill="#8C929C" stroke={INK} strokeWidth={3} />
    <path d="M -11 -28 L 11 -28 L 13 -62 L -13 -62 Z" fill="#262A34" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <rect x={-13} y={-70} width={26} height={9} fill="#9AA1AB" stroke={INK} strokeWidth={3} />
    <path d="M 0 0 L 9 -30 L -9 -30 Z" fill="#B9C0C9" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <line x1={0} y1={-4} x2={0} y2={-21} stroke={INK} strokeWidth={3} />
    <circle cx={0} cy={-22} r={4} fill="#6E757F" stroke={INK} strokeWidth={2.5} />
  </g>
);

// ─────────────────────────────────────────────────────────────────────────────
// the room: a wood counter with a real edge, a bell, the back of a monitor, a bin
// ─────────────────────────────────────────────────────────────────────────────

export const WoodSlab: React.FC<{
  id: string; fx0: number; fx1: number; fy: number; nx0: number; nx1: number; ny: number; edge: number;
  panelTo?: number;
}> = ({ id, fx0, fx1, fy, nx0, nx1, ny, edge, panelTo }) => {
  const top = `${fx0},${fy} ${fx1},${fy} ${nx1},${ny} ${nx0},${ny}`;
  const face = `${nx0},${ny} ${nx1},${ny} ${nx1},${ny + edge} ${nx0},${ny + edge}`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={WOOD_FAR} /><stop offset="1" stopColor={WOOD_NEAR} />
        </linearGradient>
        <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B7955F" /><stop offset="0.45" stopColor="#C0A070" />
          <stop offset="1" stopColor="rgba(192,160,112,0)" />
        </linearGradient>
      </defs>
      {panelTo !== undefined && (
        <g>
          <rect x={nx0 + 4} y={ny + edge} width={nx1 - nx0 - 8} height={panelTo - ny - edge} fill={`url(#${id}-p)`} />
          <rect x={nx0 + 4} y={ny + edge} width={nx1 - nx0 - 8} height={16} fill="rgba(20,22,31,0.22)" />
          {[0.3, 0.66].map((f) => (
            <line key={f} x1={nx0 + (nx1 - nx0) * f} y1={ny + edge + 6} x2={nx0 + (nx1 - nx0) * f} y2={panelTo - 30}
              stroke="rgba(20,22,31,0.14)" strokeWidth={3} />
          ))}
        </g>
      )}
      {panelTo === undefined && (
        <ellipse cx={(nx0 + nx1) / 2} cy={ny + edge + 16} rx={(nx1 - nx0) / 2.15} ry={15}
          fill="rgba(0,0,0,0.20)" style={{ filter: "blur(13px)" }} />
      )}
      <polygon points={top} fill={`url(#${id}-t)`} stroke="rgba(20,22,31,0.88)" strokeWidth={3.5} strokeLinejoin="round" />
      {[0.34, 0.72].map((t, i) => {
        const y = fy + (ny - fy) * t;
        return <line key={i} x1={lerp(fx0, nx0, t) + 30} y1={y} x2={lerp(fx1, nx1, t) - 30} y2={y}
          stroke="rgba(116,82,40,0.10)" strokeWidth={2.5} />;
      })}
      <polygon points={face} fill={WOOD_EDGE} stroke="rgba(20,22,31,0.88)" strokeWidth={3.5} strokeLinejoin="round" />
      <line x1={nx0 + 5} y1={ny + 4} x2={nx1 - 5} y2={ny + 4} stroke="rgba(255,255,255,0.48)" strokeWidth={4} />
    </g>
  );
};

export const MonitorBack: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <g>
    <path d={`M ${x + w * 0.44} ${y + h} L ${x + w * 0.56} ${y + h} L ${x + w * 0.60} ${y + h + 30} L ${x + w * 0.40} ${y + h + 30} Z`}
      fill="#4A4F59" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <rect x={x + w * 0.27} y={y + h + 30} width={w * 0.46} height={11} fill="#383C45" stroke={INK} strokeWidth={4} />
    <rect x={x} y={y} width={w} height={h} rx={7} fill="#474C57" stroke={INK} strokeWidth={5} />
    <rect x={x + w * 0.30} y={y + h * 0.24} width={w * 0.40} height={h * 0.44} rx={5} fill="#3C414B" stroke="rgba(20,22,31,0.45)" strokeWidth={3} />
    <circle cx={x + w / 2} cy={y + h * 0.46} r={w * 0.042} fill="#2B303A" />
    <line x1={x + 8} y1={y + 8} x2={x + w - 8} y2={y + 8} stroke="rgba(255,255,255,0.20)" strokeWidth={4} />
  </g>
);

export const Bell: React.FC<{ cx: number; by: number; r: number }> = ({ cx, by, r }) => (
  <g>
    <ellipse cx={cx} cy={by + 7} rx={r * 1.2} ry={r * 0.2} fill="rgba(0,0,0,0.18)" style={{ filter: "blur(6px)" }} />
    <rect x={cx - r * 1.1} y={by - r * 0.2} width={r * 2.2} height={r * 0.25} fill="#C6CBD3" stroke={INK} strokeWidth={4} />
    <path d={`M ${cx - r} ${by - r * 0.2} A ${r} ${r * 0.94} 0 0 1 ${cx + r} ${by - r * 0.2} Z`}
      fill="#DCE1E8" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
    <path d={`M ${cx - r * 0.66} ${by - r * 0.46} A ${r * 0.74} ${r * 0.70} 0 0 1 ${cx - r * 0.10} ${by - r * 0.94}`}
      fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={5} strokeLinecap="round" />
    <rect x={cx - r * 0.11} y={by - r * 1.2} width={r * 0.22} height={r * 0.26} fill="#B6BCC5" stroke={INK} strokeWidth={3.5} />
    <ellipse cx={cx} cy={by - r * 1.24} rx={r * 0.24} ry={r * 0.14} fill="#CDD2D9" stroke={INK} strokeWidth={3.5} />
  </g>
);

export const Bin: React.FC<{ cx: number; top: number; bot: number; w: number; dim?: number }> =
  ({ cx, top, bot, w, dim = 0 }) => {
    const bw = w * 0.78, o = 1 - 0.62 * clamp01(dim);
    const body = `M ${cx - w / 2} ${top} L ${cx + w / 2} ${top} L ${cx + bw / 2} ${bot} L ${cx - bw / 2} ${bot} Z`;
    return (
      <g opacity={o}>
        <ellipse cx={cx} cy={bot + 10} rx={bw * 0.62} ry={11} fill="rgba(0,0,0,0.18)" style={{ filter: "blur(9px)" }} />
        <Ink d={body} fill="#EFECE6" sw={5} />
        <ellipse cx={cx} cy={top} rx={w / 2} ry={w * 0.13} fill="#F7F5F1" stroke={INK} strokeWidth={5} />
        <ellipse cx={cx} cy={top} rx={w / 2 - 13} ry={w * 0.13 - 6} fill="#CFCCC6" stroke="rgba(20,22,31,0.35)" strokeWidth={3} />
        {[-0.3, -0.1, 0.1, 0.3].map((f, i) => (
          <line key={i} x1={cx + w * f} y1={top + w * 0.14} x2={cx + bw * f} y2={bot - 6}
            stroke="rgba(20,22,31,0.26)" strokeWidth={3} />
        ))}
        <path d={`M ${cx - 26} ${top - 6} l 18 -26 l 16 12 l 16 -20 l 10 34 z`} fill="#FDFDFB" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      </g>
    );
  };

/** a speech bubble: paper white, ink outline, a tail, empty unless something is passed in */
export const Bubble: React.FC<{
  x: number; y: number; w: number; h: number; open01: number; tail: "bl" | "br"; glyph?: string; fs?: number;
}> = ({ x, y, w, h, open01, tail, glyph, fs = 0 }) => {
  const s = 0.72 + 0.28 * easeOut(clamp01(open01));
  const ox = tail === "bl" ? x + w * 0.18 : x + w * 0.82;
  const tp = tail === "bl"
    ? `${x + w * 0.14},${y + h} ${x + w * 0.34},${y + h} ${x + w * 0.06},${y + h + 40}`
    : `${x + w * 0.66},${y + h} ${x + w * 0.86},${y + h} ${x + w * 0.94},${y + h + 40}`;
  return (
    <g opacity={Math.min(1, open01 * 1.8)} transform={`translate(${ox} ${y + h}) scale(${s}) translate(${-ox} ${-(y + h)})`}>
      <polygon points={tp} fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={14} opacity={0.82} />
      <rect x={x} y={y} width={w} height={h} rx={18} fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={14} opacity={0.82} />
      <polygon points={tp} fill={PAPER} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <rect x={x} y={y} width={w} height={h} rx={18} fill={PAPER} stroke={INK} strokeWidth={5} />
      <rect x={x + 2.5} y={y + 2.5} width={w - 5} height={h * 0.5} rx={16} fill="rgba(255,255,255,0.7)" />
      {glyph && (
        <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="central"
          style={{ fontFamily: LABEL_FONT, fontWeight: 700, fontSize: fs || h * 0.62, fill: INK }}>{glyph}</text>
      )}
    </g>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// hands: one silhouette each (the fingers belong to the outline, never capsules
// stuck on a blob), creases inside, a nail on the thumb. Simplified first, then
// detailed, so they read at card scale.
// ─────────────────────────────────────────────────────────────────────────────

/** a closed outline through points (Catmull-Rom), so a hand is shaped by its landmarks */
export const smoothClosed = (pts: number[][], k = 0.36): string => {
  const n = pts.length;
  const at = (i: number) => pts[(i + n) % n];
  let d = `M ${at(0)[0]} ${at(0)[1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += ` C ${p1[0] + (p2[0] - p0[0]) * k} ${p1[1] + (p2[1] - p0[1]) * k}`
      + ` ${p2[0] - (p3[0] - p1[0]) * k} ${p2[1] - (p3[1] - p1[1]) * k} ${p2[0]} ${p2[1]}`;
  }
  return d + " Z";
};

const SIDE_HAND = smoothClosed([
  [980, 20], [420, 20], [300, 26], [218, 42], [148, 58],
  [92, 68], [48, 70], [32, 86], [56, 94],
  [36, 98], [22, 112], [48, 122],
  [34, 128], [30, 146], [58, 152],
  [52, 160], [60, 176], [90, 178],
  [136, 182], [180, 178], [212, 184], [240, 200], [300, 208], [420, 208], [980, 208],
]);
const SIDE_THUMB = smoothClosed([
  [232, 180], [208, 200], [176, 222], [146, 232], [122, 224], [120, 204],
  [142, 186], [176, 172], [208, 166], [228, 168],
]);
const UNDER_HAND = smoothClosed([
  [86, 560], [82, 400], [92, 312], [110, 264], [140, 226], [176, 210],
  [216, 218], [246, 246], [258, 290], [260, 380], [258, 560],
]);
const OVER_THUMB = smoothClosed([
  [88, 238], [96, 198], [120, 160], [154, 130], [184, 116], [208, 126],
  [210, 152], [190, 186], [156, 218], [124, 240], [98, 248],
]);

/** a hand reaching sideways: fingertips at the left, the arm leaving to the right, wrist at (280,110) */
export const HandSide: React.FC<{
  x: number; y: number; s: number; rot?: number; pinch?: number; thumbSlide?: number; flipY?: boolean;
}> = ({ x, y, s, rot = 0, pinch = 0, thumbSlide = 0, flipY }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s} ${flipY ? -s : s}) translate(-280 -110)`}>
    <Ink d={SIDE_HAND} fill={SKIN} sw={5} />
    <path d="M 52 88 C 90 80 132 68 172 56" fill="none" stroke="rgba(20,22,31,0.32)" strokeWidth={3.5} strokeLinecap="round" />
    <path d="M 46 118 C 92 110 138 98 178 88" fill="none" stroke="rgba(20,22,31,0.32)" strokeWidth={3.5} strokeLinecap="round" />
    <path d="M 56 148 C 100 142 146 132 184 124" fill="none" stroke="rgba(20,22,31,0.32)" strokeWidth={3.5} strokeLinecap="round" />
    <path d="M 296 32 C 288 78 288 150 296 198" fill="none" stroke="rgba(20,22,31,0.22)" strokeWidth={3} strokeLinecap="round" />
    <g transform={`translate(${-0.35 * thumbSlide} ${thumbSlide}) rotate(${-28 * pinch} 224 174)`}>
      <Ink d={SIDE_THUMB} fill={SKIN} sw={5} />
      <ellipse cx={140} cy={212} rx={15} ry={11} transform="rotate(-34 140 212)"
        fill="rgba(255,255,255,0.55)" stroke="rgba(20,22,31,0.30)" strokeWidth={2.4} />
      <path d="M 206 184 C 190 200 168 214 148 222" fill="none" stroke="rgba(20,22,31,0.20)" strokeWidth={3} strokeLinecap="round" />
    </g>
  </g>
);

/** our own hand from below, its fingers behind what it holds; hand centre at (172,214) */
export const HandUnderBack: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) translate(-172 -214)`}>
    <Ink d={UNDER_HAND} fill={SKIN} sw={5} />
    <path d="M 98 330 C 142 316 206 316 250 330" fill="none" stroke="rgba(20,22,31,0.26)" strokeWidth={3.5} strokeLinecap="round" />
    <path d="M 104 352 C 146 339 204 339 246 352" fill="none" stroke="rgba(20,22,31,0.16)" strokeWidth={3} strokeLinecap="round" />
  </g>
);

/** the thumb lying across the face of what the hand holds (drawn after it) */
export const ThumbOver: React.FC<{ x: number; y: number; s: number; open?: number }> = ({ x, y, s, open = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) translate(-172 -214) rotate(${14 * open} 96 232)`}>
    <Ink d={OVER_THUMB} fill={SKIN} sw={5} />
    <ellipse cx={192} cy={140} rx={17} ry={13} transform="rotate(-36 192 140)"
      fill="rgba(255,255,255,0.55)" stroke="rgba(20,22,31,0.30)" strokeWidth={2.6} />
    <path d="M 104 232 C 114 208 132 184 154 166" fill="none" stroke="rgba(20,22,31,0.20)" strokeWidth={3} strokeLinecap="round" />
  </g>
);

/** the ruled body of the letter page: a letterhead, a greeting, three paragraphs, a signature */
export const LetterPageContent: React.FC<{ pw: number; ph: number }> = ({ pw, ph }) => {
  const mx = 0.105 * pw, tw = pw - 2 * mx, lh = Math.max(9, 0.0272 * ph), th = Math.max(3, 0.0072 * ph);
  const bar = (key: string, top: number, wf: number, c: string, h: number, right?: boolean) => (
    <div key={key} style={{
      position: "absolute", left: right ? undefined : mx, right: right ? mx : undefined,
      top, width: tw * wf, height: h, backgroundColor: c,
    }} />
  );
  const rows: React.ReactNode[] = [];
  const widths = [0.97, 0.93, 0.99, 0.9, 0.58, 0.95, 0.99, 0.92, 0.97, 0.51, 0.96, 0.9, 0.98, 0.62];
  let y = 0.255 * ph, k = 0;
  [5, 5, 4].forEach((n, pi) => {
    for (let i = 0; i < n; i++, k++) { rows.push(bar(`p${pi}-${i}`, y, widths[k], "rgba(20,22,31,0.20)", th)); y += lh; }
    y += 0.024 * ph;
  });
  return (
    <>
      {bar("head", 0.055 * ph, 0.42, "rgba(20,22,31,0.78)", Math.max(5, 0.0105 * ph))}
      {bar("date", 0.055 * ph, 0.24, "rgba(20,22,31,0.34)", th, true)}
      <div style={{ position: "absolute", left: mx, top: 0.10 * ph, width: tw, height: 2, backgroundColor: "rgba(20,22,31,0.28)" }} />
      {bar("greet", 0.185 * ph, 0.40, "rgba(20,22,31,0.60)", Math.max(4, 0.0092 * ph))}
      {rows}
      {bar("off", y + 0.012 * ph, 0.22, "rgba(20,22,31,0.42)", th)}
      <svg width={tw * 0.46} height={0.07 * ph} viewBox="0 0 200 60"
        style={{ position: "absolute", left: mx, top: y + 0.042 * ph, display: "block" }}>
        <path d="M 4 46 C 26 8 34 52 52 30 C 68 10 70 50 92 34 C 112 20 118 48 140 30 C 158 16 176 26 196 14"
          fill="none" stroke="rgba(28,35,51,0.72)" strokeWidth={5} strokeLinecap="round" />
      </svg>
    </>
  );
};
