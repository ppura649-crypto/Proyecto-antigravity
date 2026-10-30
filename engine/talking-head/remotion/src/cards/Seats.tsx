import React from "react";
import { Img, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { LABEL_FONT } from "./theme";

// V2 (edit-g-b): "TWO FOUNDERS WITH / NO EDITOR."
// Three seats on one bench line, the same size, evenly spaced. Seat one is the guest's real face
// off this take, seat two is the creator's real headshot, and seat three is an empty dashed ring
// with a name plate under it reading EDITOR. The two founders pop on their own words; the
// empty seat pops on "with" with a short puff of dust off the bench, 600 ms before the creator says
// the punch, so the picture lands the joke first and the overlay cuts the card on "NO".
// Everything is still by 6325: nothing competes with the two words that follow.

const WHITE = "#FFFFFF";
const INK = "#1F1E1D";
const HALO = "drop-shadow(0px 2px 6px rgba(0,0,0,0.9)) drop-shadow(0px 8px 28px rgba(0,0,0,0.55))";
const PUFF_MS = 300;
const POP_FRAMES = 9;   // 300 ms: every pop is finished before the punch

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
// the two real photos are framed on the face, not centred on the file
const CROP = [{ z: 1.56, x: 0.545, y: 0.43 }, { z: 1.12, x: 0.50, y: 0.50 }];

export type SeatsData = { plate?: string };

export const Seats: React.FC<CardProps & { data: SeatsData }> = ({
  tMs, w, h, fps, fromMs, beats, assets, data,
}) => {
  const plate = data.plate ?? "EDITOR";
  const D = 0.212 * w;                 // one seat, the same for all three
  const ring = 0.0062 * w;
  const benchY = 0.715 * h;
  const cy = benchY - D / 2 + 0.018 * h;   // the seats rest ON the line
  const pitch = w / 3;
  const cxs = [0.5 * pitch, 1.5 * pitch, 2.5 * pitch];

  const at = [beats.two ?? fromMs, beats.founders ?? fromMs + 180, beats.with ?? fromMs + 240];
  const pop = (i: number) =>
    spring({ frame: Math.max(0, ((tMs - at[i]) / 1000) * fps), fps, durationInFrames: POP_FRAMES });

  // dust off the bench: five motes that fly out from where the seat landed and are gone
  const p = clamp01((tMs - at[2]) / PUFF_MS);
  const puffs = [
    { dx: -1.00, dy: -0.22, r: 0.030 }, { dx: -0.63, dy: -0.52, r: 0.022 },
    { dx: 0.05, dy: -0.62, r: 0.017 },
    { dx: 0.63, dy: -0.52, r: 0.022 }, { dx: 1.00, dy: -0.22, r: 0.030 },
  ];

  const seat = (i: number): React.CSSProperties => ({
    position: "absolute",
    left: cxs[i] - D / 2,
    top: cy - D / 2,
    width: D,
    height: D,
    transformOrigin: "50% 92%",
    transform: `translateY(${(1 - Math.min(1, pop(i))) * (i === 2 ? -0.030 * h : 0)}px) scale(${0.86 + 0.14 * Math.min(1.02, pop(i))})`,
    opacity: clamp01(pop(i) * 3),
  });

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {/* the bench: one line and two legs, nothing more */}
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: HALO }}>
        <title>three seats on a bench</title>
        <rect x={0.026 * w} y={benchY} width={0.948 * w} height={0.011 * h} fill={WHITE} />
        <rect x={0.046 * w} y={benchY} width={0.0105 * w} height={0.125 * h} fill={WHITE} />
        <rect x={0.9435 * w} y={benchY} width={0.0105 * w} height={0.125 * h} fill={WHITE} />
        {p > 0 && p < 1 && (
          <g fill={WHITE} opacity={0.92 * Math.sin(Math.PI * p)}>
            {puffs.map((q, j) => (
              <circle
                key={j}
                cx={cxs[2] + q.dx * 0.62 * D * p}
                cy={benchY - 0.006 * h + q.dy * 0.34 * D * p}
                r={q.r * D * (0.5 + 0.8 * p)}
              />
            ))}
          </g>
        )}
      </svg>

      {/* the two founders, as they really are */}
      {[0, 1].map((i) => (
        <div key={i} style={{ ...seat(i), filter: HALO }}>
          {/* explicit device px on the image: a percentage size on <Img> does not resolve
              here and the photo renders at its own size, off-centre in the circle */}
          <div style={{
            position: "relative", width: D, height: D, borderRadius: "50%", overflow: "hidden",
            boxShadow: `0 0 0 ${ring}px ${WHITE}`,
          }}>
            <Img src={staticFile(assets[i])} style={{
              position: "absolute", display: "block", maxWidth: "none",
              width: D * CROP[i].z, height: D * CROP[i].z,
              left: D / 2 - D * CROP[i].z * CROP[i].x, top: D / 2 - D * CROP[i].z * CROP[i].y,
            }} />
          </div>
        </div>
      ))}

      {/* the seat nobody is in */}
      <div style={{ ...seat(2), filter: HALO }}>
        <svg width={D} height={D} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible" }}>
          <title>the empty seat</title>
          <circle
            cx={50} cy={50} r={47} fill="none" stroke={WHITE}
            strokeWidth={100 * (ring / D)} strokeDasharray="10 7.4" strokeLinecap="round"
          />
        </svg>
      </div>

      {/* the job title on the empty seat */}
      <div style={{
        position: "absolute",
        left: cxs[2] - 0.088 * w, top: benchY + 0.052 * h,
        width: 0.176 * w, height: 0.104 * h,
        backgroundColor: WHITE,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
        opacity: clamp01(pop(2) * 3),
        transform: `scale(${0.86 + 0.14 * Math.min(1.02, pop(2))})`,
        transformOrigin: "50% 0%",
      }}>
        <span style={{
          fontFamily: LABEL_FONT, fontWeight: 700, fontSize: 0.029 * w,
          letterSpacing: "0.07em", color: INK, textTransform: "uppercase", lineHeight: 1,
        }}>{plate}</span>
      </div>
    </div>
  );
};
