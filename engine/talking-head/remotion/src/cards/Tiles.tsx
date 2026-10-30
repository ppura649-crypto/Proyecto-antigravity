import React from "react";
import { spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, INK, label } from "./theme";

// "so that we could INCREASE OUR OUTPUT while SAVING TIME."
// One frameless object, two rows on ONE baseline grid, the same grammar twice: a bar
// of units on a guide that shows how long the scale is. Row 1 OUTPUT is built of reel
// tiles (9:16 posters with a play glyph, the atom of "a video"); row 2 TIME is built of
// clock ticks. Both start at the same length, so the two changes are read against each
// other: OUTPUT runs six more tiles to the end of the guide and an up-arrow caps its tip,
// then the TIME ticks fall off the right end one at a time until a stub is left and a
// down-arrow drops under it. Nothing but the two arrows is the accent, because the two
// arrows are the claim.

const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";
const DARK = "#1F1E1D";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeIn = (t: number) => t * t * 1.08;

export type TilesData = { top: string; bottom: string };

// one reel: a 9:16 white poster with a dark play glyph. The atom of "output" here and
// the thing that pops over a creator's head on the ring (RingLit), so a viewer who saw
// this bar reads those as videos.
export const ReelTile: React.FC<{
  x: number; y: number; tw: number; th: number; op?: number;
}> = ({ x, y, tw, th, op = 1 }) => {
  const g = th * 0.34;
  const cx = x + tw / 2;
  const cy = y + th / 2;
  return (
    <g opacity={op}>
      <rect x={x} y={y} width={tw} height={th} fill={INK} />
      <path
        d={`M ${cx - g * 0.40} ${cy - g / 2} L ${cx + g * 0.52} ${cy} L ${cx - g * 0.40} ${cy + g / 2} Z`}
        fill={DARK}
      />
    </g>
  );
};

const arrowPath = (ax: number, base: number, len: number, up: boolean): string => {
  const s = up ? -1 : 1;
  const hw = len * 0.72;   // head span
  const hh = len * 0.45;   // head height
  const sw = len * 0.30;   // shaft width
  const tip = base + s * len;
  const neck = base + s * (len - hh);
  return [
    `M ${ax - sw / 2} ${base}`,
    `L ${ax - sw / 2} ${neck}`,
    `L ${ax - hw / 2} ${neck}`,
    `L ${ax} ${tip}`,
    `L ${ax + hw / 2} ${neck}`,
    `L ${ax + sw / 2} ${neck}`,
    `L ${ax + sw / 2} ${base}`,
    "Z",
  ].join(" ");
};

export const Tiles: React.FC<CardProps & { data: TilesData }> = ({
  tMs, w, h, fps, fromMs, beats, data,
}) => {
  const P = 0.024 * w;
  const barH = 0.173 * h;
  const tileW = barH * (9 / 16);
  const tileGap = 0.0072 * w;
  const pitch = tileW + tileGap;
  const END_N = 15;
  const START_N = 9;
  const trackW = END_N * pitch - tileGap;
  const barX = w - P - trackW;
  const startW = START_N * pitch - tileGap;

  const TICK_N = 15;
  const FALL_N = 9;
  const tickW = 0.0118 * w;
  const tickPitch = (startW - tickW) / (TICK_N - 1);

  const y1 = 0.30 * h;          // OUTPUT centre
  const y2 = 0.70 * h;          // TIME centre
  const top1 = y1 - barH / 2;
  const bot1 = y1 + barH / 2;
  const top2 = y2 - barH / 2;
  const bot2 = y2 + barH / 2;

  const fs = 0.037 * w;          // ~36 device px
  const halo = `drop-shadow(0px 0px ${0.011 * w}px rgba(0,0,0,0.92)) drop-shadow(0px 3px 12px rgba(0,0,0,0.75))`;
  const tsh = `0px 0px ${0.009 * w}px rgba(0,0,0,0.95), ${SHADOW}`;

  const bTiles = beats.output ?? fromMs + 630;
  const bSave = beats.saving ?? bTiles + 633;
  const bTime = beats.time ?? bSave + 480;

  const TILE_STEP = 70;
  const FALL_STEP = 50;
  const FALL_MS = 200;
  const FALL_DROP = 0.185 * h;

  const sp = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 340, mass: 0.6 } });

  // the up-arrow caps the OUTPUT tip once the last tile is on; the down-arrow lands on "time."
  const upAt = bTiles + (END_N - START_N) * TILE_STEP;
  const up = sp(upAt);
  const down = sp(bTime);

  const stubW = (FALL_N > 0 ? (TICK_N - FALL_N - 1) * tickPitch : 0) + tickW;
  const upX = barX + trackW - tileW / 2;
  const downX = barX + stubW - tickW / 2;
  const aLen = 0.160 * h;
  const aGap = 0.022 * h;

  const guide = (y: number) => (
    <rect x={barX - 0.008 * w} y={y - 0.0035 * h} width={trackW + 0.008 * w} height={0.007 * h} fill={INK} opacity={0.42} />
  );

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <div style={{
        position: "absolute", left: P, top: y1 - fs * 0.62, width: barX - 0.020 * w - P,
        textAlign: "right", ...label(fs, "#FFFFFF"), textShadow: tsh, lineHeight: 1,
      }}>{data.top}</div>
      <div style={{
        position: "absolute", left: P, top: y2 - fs * 0.62, width: barX - 0.020 * w - P,
        textAlign: "right", ...label(fs, "#FFFFFF"), textShadow: tsh, lineHeight: 1,
      }}>{data.bottom}</div>

      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: halo }}>
        <title>output climbing while time falls away, on one scale</title>

        {/* the grid both rows are measured on: one origin rule, one guide per row */}
        <rect x={barX - 0.0035 * w} y={top1 - 0.036 * h} width={0.007 * w} height={(bot2 + 0.036 * h) - (top1 - 0.036 * h)} fill={INK} opacity={0.34} />
        {guide(bot1)}
        {guide(bot2)}

        {/* OUTPUT: reel tiles laid end to end, six more popping onto the end one per 70 ms */}
        {Array.from({ length: END_N }).map((_, i) => {
          const at = i < START_N ? fromMs : bTiles + (i - START_N) * TILE_STEP;
          const s = i < START_N ? 1 : sp(at);
          if (s <= 0.001) return null;
          const sc = 0.55 + 0.45 * Math.min(1, s);
          const cx = barX + i * pitch + tileW / 2;
          return (
            <g key={`t${i}`} transform={`translate(${cx} ${y1}) scale(${sc}) translate(${-cx} ${-y1})`} opacity={clamp01(s * 3)}>
              <ReelTile x={barX + i * pitch} y={top1} tw={tileW} th={barH} />
            </g>
          );
        })}

        {/* TIME: clock ticks on the same span, falling off the right end one per 50 ms */}
        {Array.from({ length: TICK_N }).map((_, i) => {
          const falls = i >= TICK_N - FALL_N;
          const q = falls ? clamp01((tMs - (bSave + (TICK_N - 1 - i) * FALL_STEP)) / FALL_MS) : 0;
          const op = 1 - clamp01(q / 0.68);
          if (op <= 0.001) return null;
          const x = barX + i * tickPitch;
          return (
            <rect
              key={`k${i}`} x={x} y={top2} width={tickW} height={barH} fill={INK} opacity={op}
              transform={`translate(0 ${FALL_DROP * easeIn(q)}) rotate(${16 * q} ${x + tickW / 2} ${y2})`}
            />
          );
        })}

        {/* the two arrows, and nothing else, are the accent */}
        {up > 0.001 && (
          <path
            d={arrowPath(upX, top1 - aGap, aLen, true)} fill={ACCENT}
            opacity={clamp01(up * 3)}
            transform={`translate(0 ${0.030 * h * (1 - Math.min(1, up))})`}
          />
        )}
        {down > 0.001 && (
          <path
            d={arrowPath(downX, bot2 + aGap, aLen, false)} fill={ACCENT}
            opacity={clamp01(down * 3)}
            transform={`translate(0 ${-0.030 * h * (1 - Math.min(1, down))})`}
          />
        )}
      </svg>
    </div>
  );
};
