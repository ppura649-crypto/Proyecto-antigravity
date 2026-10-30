import React from "react";
import { spring } from "remotion";
import type { CardProps } from "./props";
import { LABEL_FONT } from "./theme";

// V2 (reference edit G): "TWO FOUNDERS WITH / NO EDITOR."
// Three office chairs in a row, seen from the front, same size, evenly spaced. The chairs
// are white line-art on the footage; the two people are solid white busts, so a viewer reads
// occupied against empty in one glance. Chair one pops on "TWO", chair two on "FOUNDERS",
// and the third pops empty on "WITH" with a small puff of dust and a name plate on its back
// reading EDITOR. The picture says the punch 600 ms before the creator does, and the overlay cuts the
// card on "NO" so the words own the screen alone.

export type ChairsData = {
  plate?: string;  // the word on the empty chair's back plate
};

const WHITE = "#FFFFFF";
const INK = "#1F1E1D";
const HALO = "drop-shadow(0px 2px 6px rgba(0,0,0,0.9)) drop-shadow(0px 8px 28px rgba(0,0,0,0.55))";
const PUFF_MS = 300;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

// one chair, drawn in its own 200 x 300 space so the three are identical. The back is drawn
// first and the seat and base last, so a person sits BEHIND the seat and INSIDE the back.
const ChairBack: React.FC = () => (
  <g stroke={WHITE} strokeLinecap="round" strokeLinejoin="round">
    {/* the mesh back, tapered so it reads as a chair and not a frame */}
    <path
      d="M 38 44 Q 38 26 56 26 L 144 26 Q 162 26 162 44 L 158 138 Q 157 152 143 152 L 57 152 Q 43 152 42 138 Z"
      fill="none" strokeWidth={6}
    />
    <line x1={58} y1={70} x2={142} y2={70} strokeWidth={3} opacity={0.4} />
    <line x1={57} y1={110} x2={143} y2={110} strokeWidth={3} opacity={0.4} />
    <line x1={100} y1={150} x2={100} y2={166} strokeWidth={10} />
  </g>
);

const ChairFront: React.FC = () => (
  <g stroke={WHITE} strokeLinecap="round" strokeLinejoin="round">
    <rect x={26} y={164} width={148} height={30} rx={13} fill="none" strokeWidth={6} />
    {/* armrests: one stroke each, up off the seat and in */}
    <path d="M 20 190 L 20 160 Q 20 150 31 150 L 50 150" fill="none" strokeWidth={7} />
    <path d="M 180 190 L 180 160 Q 180 150 169 150 L 150 150" fill="none" strokeWidth={7} />
    {/* gas cylinder and the five-star base */}
    <line x1={100} y1={194} x2={100} y2={238} strokeWidth={11} />
    <line x1={100} y1={238} x2={36} y2={266} strokeWidth={7} />
    <line x1={100} y1={238} x2={164} y2={266} strokeWidth={7} />
    <line x1={100} y1={236} x2={62} y2={250} strokeWidth={7} />
    <line x1={100} y1={236} x2={138} y2={250} strokeWidth={7} />
    <circle cx={32} cy={269} r={8} fill={WHITE} strokeWidth={0} />
    <circle cx={168} cy={269} r={8} fill={WHITE} strokeWidth={0} />
    <circle cx={59} cy={253} r={6.5} fill={WHITE} strokeWidth={0} />
    <circle cx={141} cy={253} r={6.5} fill={WHITE} strokeWidth={0} />
  </g>
);

// a person in the chair: head, neck and shoulders, solid, no face. The body runs down past
// the seat line so the seat is drawn across their lap. Two builds so the founders are two
// people rather than one silhouette copied.
const Figure: React.FC<{ v: 0 | 1 }> = ({ v }) => {
  const hr = v ? 28.5 : 27;
  const l = v ? 45 : 48;
  const r = 200 - l;
  return (
    <g fill={WHITE} stroke="none" transform={`rotate(${v ? 1.6 : -1.6} 100 180)`}>
      <rect x={89} y={66} width={22} height={30} />
      <path d={`M ${l} 192 L ${l} 126 C ${l} 99 ${l + 24} 89 100 89 C ${r - 24} 89 ${r} 99 ${r} 126 L ${r} 192 Z`} />
      <circle cx={100} cy={50} r={hr} />
    </g>
  );
};

export const Chairs: React.FC<CardProps & { data: ChairsData }> = ({ tMs, w, h, fps, fromMs, beats, data }) => {
  const plate = data.plate ?? "EDITOR";
  const pitch = w / 3;
  const boxW = 0.88 * pitch;
  const boxH = boxW * 1.5;
  const boxTop = (h - boxH) / 2;
  const k = boxW / 200; // local unit -> device px

  const at = [beats.two ?? fromMs, beats.founders ?? fromMs + 180, beats.with ?? fromMs + 240];

  // the two founders pop hard; the empty chair arrives a hair heavier and settles
  const popOf = (i: number): number =>
    spring({
      frame: Math.max(0, ((tMs - at[i]) / 1000) * fps),
      fps,
      config: i === 2 ? { damping: 13, stiffness: 320, mass: 0.6 } : { damping: 9, stiffness: 340, mass: 0.6 },
    });

  // dust: three short arcs that open at the base of the empty chair and are gone in 300 ms
  const p = clamp01((tMs - at[2]) / PUFF_MS);
  const puffs = [
    { x: 42, y: 289, dx: -13, dy: -5, s: 1 },
    { x: 100, y: 294, dx: 0, dy: -7, s: 0.8 },
    { x: 158, y: 289, dx: 13, dy: -5, s: 1 },
  ];

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {[0, 1, 2].map((i) => {
        const pop = popOf(i);
        const left = i * pitch + (pitch - boxW) / 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left, top: boxTop, width: boxW, height: boxH,
              transformOrigin: "50% 92%",
              transform: `translateY(${(1 - pop) * (i === 2 ? -0.030 * h : 0)}px) scale(${0.86 + 0.14 * pop})`,
              opacity: Math.min(1, pop * 3),
              filter: HALO,
            }}
          >
            <svg width={boxW} height={boxH} viewBox="0 0 200 300" style={{ display: "block" }}>
              <title>{i === 2 ? "an empty chair with a name plate" : "a founder in a chair"}</title>
              <ChairBack />
              {i < 2 && <Figure v={i === 0 ? 0 : 1} />}
              <ChairFront />
              {i === 2 && p > 0 && p < 1 && (
                <g fill="none" stroke={WHITE} strokeWidth={4.5} strokeLinecap="round" opacity={0.9 * Math.sin(Math.PI * p)}>
                  {puffs.map((q, j) => (
                    <path
                      key={j}
                      d="M -14 0 A 16 16 0 0 1 14 0"
                      transform={`translate(${q.x + q.dx * p} ${q.y + q.dy * p}) scale(${(0.55 + 0.9 * p) * q.s})`}
                    />
                  ))}
                </g>
              )}
            </svg>
            {i === 2 && (
              <div
                style={{
                  position: "absolute",
                  left: 0.12 * boxW, top: 76 * k,
                  width: 0.76 * boxW, height: 44 * k,
                  backgroundColor: WHITE,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
                }}
              >
                <span
                  style={{
                    fontFamily: LABEL_FONT, fontWeight: 700, fontSize: 0.125 * boxW,
                    letterSpacing: "0.06em", color: INK, textTransform: "uppercase", lineHeight: 1,
                  }}
                >
                  {plate}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
