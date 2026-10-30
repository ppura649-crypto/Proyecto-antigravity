import React from "react";
import { INK_A } from "./AShared";

// The two marks this reel keeps coming back to: a MIC (talk) and a KEYBOARD (type). Both are
// drawn around their own centre so a card can place them anywhere at any size with one <g>, and
// both are line work in dark ink so they read frameless on their cream wall and on white paper.
// V1 names them big; V7 and V9 wear them small on the field's header row, which is what makes the
// two cloud cards a pair rather than two boxes.

/** mic: local box x -58..58, y -43..77, drawn around the capsule's centre */
export const MicMark: React.FC<{ x: number; y: number; s?: number; sw?: number }> = ({
  x, y, s = 1, sw = 7,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}
     style={{ fill: "none", stroke: INK_A, strokeWidth: sw / s, strokeLinecap: "round" }}>
    <rect x={-26} y={-43} width={52} height={86} rx={26} />
    <path d="M -58 15 Q 0 85 58 15" />
    <path d="M 0 50 L 0 77" />
    <path d="M -34 77 L 34 77" />
  </g>
);

/** one arc of sound, on the given side of the mic: a bracket spanning +-`half` degrees */
export const SoundArc: React.FC<{
  cx: number; cy: number; r: number; half: number; side: 1 | -1; sw: number; opacity: number;
}> = ({ cx, cy, r, half, side, sw, opacity }) => {
  const a = (half * Math.PI) / 180;
  const dx = side * r * Math.cos(a), dy = r * Math.sin(a);
  const sweep = side > 0 ? 1 : 0;
  return (
    <path
      d={`M ${cx + dx} ${cy - dy} A ${r} ${r} 0 0 ${sweep} ${cx + dx} ${cy + dy}`}
      style={{ fill: "none", stroke: INK_A, strokeWidth: sw, strokeLinecap: "round", opacity }}
    />
  );
};

// keyboard: local box x -125..125, y -57..57, around the body's centre.
// Ten keys on two rows plus a spacebar; `press` is ten 0..1 values, row-major.
const KEY_X = [-109, -63, -17, 29, 75];
const KEY_Y = [-39, -7];
const KEY_W = 34, KEY_H = 25;

export const KeyMark: React.FC<{
  x: number; y: number; s?: number; sw?: number; press?: number[];
}> = ({ x, y, s = 1, sw = 6, press }) => {
  const keys: React.ReactNode[] = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 5; c++) {
      const p = press?.[r * 5 + c] ?? 0;
      keys.push(
        <rect
          key={`${r}-${c}`}
          x={KEY_X[c]} y={KEY_Y[r] + 4 * p} width={KEY_W} height={KEY_H} rx={5}
          style={{ fill: p > 0.02 ? INK_A : "none", stroke: INK_A, strokeWidth: (sw - 2) / s }}
        />,
      );
    }
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect
        x={-125} y={-57} width={250} height={114} rx={12}
        style={{ fill: "none", stroke: INK_A, strokeWidth: sw / s }}
      />
      {keys}
      <rect
        x={-72} y={25} width={144} height={18} rx={5}
        style={{ fill: "none", stroke: INK_A, strokeWidth: (sw - 2) / s }}
      />
    </g>
  );
};
