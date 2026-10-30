import React from "react";
import { interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { INK, MONO_FONT, label } from "./theme";

// V10, "Then I create five to ten tasks".
// Frameless over their dark curtain. ONE task is a light plate with a UI wireframe on it
// (no words: the plate IS the task) and the label `task` under it. On `five` four more
// slide out of it into a shallow fan; on `ten` five more join behind, tighter. The mono
// counter on the right says only the two numbers the creator says, each on its own landing.
// The picture is "one thing, then a stack of them", not a list of tasks.
// beats: card, five, ten

export type TaskFanData = {
  label: string; five: number; ten: number;
  stepMs?: number;      // gap between the four copies of the fan (default 85)
  backStepMs?: number;  // gap between the five that join behind (default 65)
};

const SHADOW = "drop-shadow(0px 0px 7px rgba(0,0,0,0.75)) drop-shadow(0px 6px 16px rgba(0,0,0,0.55))";
const PLATE = "#F4F4F4";
const G_SOFT = "#C7CBD0";
const G_HARD = "#8B9298";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// A wireframe is x, y, w, h in 0..1 of the plate's inner box, and a tone:
// 1 chrome (header, rail, button, solid dark grey), 2 a content pane (solid light),
// 0 a text block (ruled light lines). Five layouts: the column split swaps, the button
// bar moves, one has a sidebar, one is a single column. Never a word.
type Rect = [number, number, number, number, 0 | 1 | 2];
const WIRES: Rect[][] = [
  [ // header, a wide pane, a text column, buttons bottom right
    [0, 0, 1, 0.085, 1],
    [0, 0.16, 0.57, 0.56, 2], [0.63, 0.16, 0.37, 0.56, 0],
    [0.55, 0.87, 0.20, 0.085, 1], [0.79, 0.87, 0.21, 0.085, 1],
  ],
  [ // the split swapped: text on the left, the pane on the right, buttons bottom left
    [0, 0, 1, 0.085, 1],
    [0, 0.16, 0.36, 0.56, 0], [0.42, 0.16, 0.58, 0.56, 2],
    [0, 0.87, 0.24, 0.085, 1], [0.28, 0.87, 0.18, 0.085, 1],
  ],
  [ // the button rides up beside the header, two even columns, a foot line
    [0, 0, 0.60, 0.085, 1], [0.70, 0, 0.30, 0.085, 1],
    [0, 0.20, 0.47, 0.60, 0], [0.53, 0.20, 0.47, 0.60, 2],
    [0, 0.90, 0.44, 0.055, 0],
  ],
  [ // a rail down the left, a pane and a text row on the right
    [0, 0, 0.20, 1, 1],
    [0.28, 0, 0.72, 0.085, 1],
    [0.28, 0.17, 0.72, 0.24, 2], [0.28, 0.47, 0.72, 0.20, 0],
    [0.28, 0.76, 0.30, 0.085, 1], [0.64, 0.76, 0.22, 0.085, 1],
  ],
  [ // one column: a pane, then two text rows, one button centred
    [0, 0, 1, 0.085, 1],
    [0, 0.17, 1, 0.24, 2], [0, 0.47, 1, 0.15, 0], [0, 0.67, 1, 0.15, 0],
    [0.34, 0.89, 0.32, 0.075, 1],
  ],
];

// The task itself: a light plate with a UI wireframe on it. Exported because V11's
// lanes stream this exact object, so the ten things running the harness are visibly
// the ten things the creator just created.
export const TaskPlate: React.FC<{ w: number; h: number; variant: number }> = ({ w, h, variant }) => {
  const p = 0.085 * w;
  const iw = w - 2 * p;
  const ih = h - 2 * p;
  const wire = WIRES[((variant % WIRES.length) + WIRES.length) % WIRES.length];
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <title>a task</title>
      <rect x={0} y={0} width={w} height={h} fill={PLATE} />
      {wire.map(([x, y, rw, rh, tone], i) => {
        const X = p + x * iw, Y = p + y * ih;
        const W = Math.max(1, rw * iw), H = Math.max(1, rh * ih);
        // 1 chrome, 2 a content pane: one solid block each
        if (tone) return <rect key={i} x={X} y={Y} width={W} height={H} fill={tone === 1 ? G_HARD : G_SOFT} />;
        // tone 0 is content: ruled lines, so the plate reads as a UI and not a grey slab
        const rows = Math.max(2, Math.min(5, Math.round(H / (0.115 * ih))));
        const step = H / rows;
        const bh = Math.max(1, step * 0.58);
        return (
          <g key={i}>
            {Array.from({ length: rows }).map((_, r) => (
              <rect
                key={r} x={X} y={Y + r * step} height={bh}
                width={W * (r === rows - 1 ? 0.62 : r % 2 ? 0.90 : 1)}
                fill={G_SOFT}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

export const TaskFan: React.FC<CardProps & { data: TaskFanData }> = ({
  tMs, w, h, fps, fromMs, beats, data,
}) => {
  const pw = 0.290 * w;
  const ph = 0.620 * h;
  const labFs = 0.052 * h;
  const labGap = 0.045 * h;
  const top = Math.round((h - (ph + labGap + labFs * 1.15)) / 2);
  const x0 = 0.043 * w;
  const fanRight = 0.800 * w;
  const s1 = (fanRight - x0 - pw) / 4;
  const s2 = s1 * 0.90;
  const arc = 0.050 * h;
  const lift = 0.072 * h;

  const cFs = 0.135 * h;
  const cLeft = fanRight + 0.028 * w;
  const cRight = w - 0.036 * w;
  const cTop = top + ph / 2;

  const ink = `0px 0px ${0.013 * w}px rgba(0,0,0,0.94), 0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)`;

  const bCard = beats.card ?? fromMs;
  const bFive = beats.five ?? bCard + 240;
  const bTen = beats.ten ?? bFive + 660;
  const step = data.stepMs ?? 85;
  const bStep = data.backStepMs ?? 65;
  // each number lands as its own last plate does, and both stay inside the 0.3 s
  // the law allows after the word the creator says
  const fifthAt = bFive + 3 * step;
  const tenthAt = bTen + 4 * bStep;

  const sp = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 15, stiffness: 300, mass: 0.7 } });

  // where copy i comes to rest. 0 is the one that was already there: upright, left,
  // and it never moves, so the fan opens out of it instead of replacing it.
  const slot = (i: number) => {
    if (i < 5) {
      const u = i / 4;
      return { x: x0 + i * s1, y: top - arc * Math.sin(Math.PI * u), k: 1, rot: 6.5 * u };
    }
    const j = i - 5;
    const u = j / 4;
    return { x: x0 + s1 * 0.5 + j * s2, y: top - lift - arc * 0.8 * Math.sin(Math.PI * u), k: 0.94, rot: 2 + 6 * u };
  };
  const landAt = (i: number) => (i === 0 ? bCard : i < 5 ? bFive + (i - 1) * step : bTen + (i - 5) * bStep);

  const plate = (i: number) => {
    const at = landAt(i);
    if (tMs < at) return null;
    const p = i === 0 ? 1 : Math.min(1, sp(at));
    const s = slot(i);
    const x = interpolate(p, [0, 1], [x0, s.x]);
    const y = interpolate(p, [0, 1], [top, s.y]);
    const k = interpolate(p, [0, 1], [0.90, s.k]);
    const rot = interpolate(p, [0, 1], [0, s.rot]);
    return (
      <div
        key={i}
        style={{
          position: "absolute", left: x, top: y, width: pw, height: ph,
          transform: `rotate(${rot}deg) scale(${k})`, transformOrigin: "0% 100%",
          opacity: clamp01(p * 3), filter: SHADOW,
        }}
      >
        <TaskPlate w={pw} h={ph} variant={i < 5 ? i : (i * 3 + 1) % 5} />
      </div>
    );
  };

  // the counter: nothing until the fifth plate is down, then 5, then it rolls to 10
  const fivePop = sp(fifthAt);
  // the roll: the 5 is gone before the 10 arrives, so no frame ever reads 15
  const roll = interpolate(tMs, [tenthAt, tenthAt + 240], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const outP = clamp01(roll * 2.1);
  const inP = clamp01((roll - 0.5) * 2.1);
  const num = (text: string, op: number, dy: number, k: number) => (
    <div
      style={{
        position: "absolute", right: 0, top: 0, width: "100%", textAlign: "right",
        fontFamily: MONO_FONT, fontSize: cFs, lineHeight: 1, color: INK, fontWeight: 600,
        fontVariantNumeric: "tabular-nums", textShadow: ink, whiteSpace: "nowrap",
        opacity: clamp01(op), transform: `translateY(${dy}px) scale(${k})`, transformOrigin: "100% 50%",
      }}
    >
      {text}
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {/* behind first, and inside each row the left one stays on top: the fan opens
          out of the original instead of burying it */}
      {[9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((i) => plate(i))}

      <div
        style={{
          position: "absolute", left: x0, top: top + ph + labGap, width: pw,
          textAlign: "center", ...label(labFs, INK), lineHeight: 1.1, textShadow: ink,
        }}
      >
        {data.label}
      </div>

      <div style={{ position: "absolute", left: cLeft, top: cTop - cFs / 2, width: cRight - cLeft, height: cFs }}>
        {tMs >= fifthAt && outP < 1 && num(String(data.five), (1 - outP) * fivePop * 3, -0.26 * cFs * outP, 0.82 + 0.18 * Math.min(1, fivePop))}
        {inP > 0 && num(String(data.ten), inP, 0.30 * cFs * (1 - inP), 0.88 + 0.12 * inP)}
      </div>
    </div>
  );
};
