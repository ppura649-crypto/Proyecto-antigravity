import React from "react";
import { spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, CARD_BG, INK, MUTED, label } from "./theme";

// V5 'try them maybe once or twice, find one good result and be happy.'
// frameless: run 1 lands on `run1` with a grey cross, run 2 on `run2` blank, run 2's mark flips to a green tick
// and grows on `good`, a small drawn confetti burst (no emoji) on `happy`. beats: run1, run2, good, happy
//
// Two dark plates, square, no border, the label at the top in the reel's own face and one big drawn mark in
// the middle. The only saturated colours are the one semantic green on the tick and the accent in the burst.
// Nothing here is authored beyond the two run names: the picture is the marks.
export type TriesData = { labels: [string, string] };

// the one semantic colour the layer is allowed (a passing result), used here and in Runs
export const GREEN = "#7BD389";

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

// deterministic: the burst has to be identical on every frame and every re-render
const rnd = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// the geometry of the two run plates, exported because V6 shrinks plate 2 into the first tile of the row
export const triesGeom = (w: number, h: number) => {
  const plateW = 0.380 * w;
  const plateH = 0.660 * h;
  const gap = 0.055 * w;
  const left = (w - (2 * plateW + gap)) / 2;
  const top = (h - plateH) / 2;
  return {
    plateW, plateH, gap, left, top,
    x: (i: number) => left + i * (plateW + gap),
    markS: 0.440 * plateH,   // the box a mark is drawn in
    markCyFrac: 0.580,       // the mark sits below the label, not on the plate's centre
  };
};

export const PLATE_SHADOW = "0px 0px 13px rgba(0,0,0,0.95), 0px 12px 34px rgba(0,0,0,0.60)";
export const MARK_SHADOW = "drop-shadow(0px 0px 10px rgba(0,0,0,0.92)) drop-shadow(0px 4px 14px rgba(0,0,0,0.75))";

// one drawn mark, in a 100x100 box, so the tick on a plate and the tick in a 62 px tile are the same shape
export const Mark: React.FC<{
  cx: number; cy: number; s: number; kind: "tick" | "cross"; color: string; draw?: number; scale?: number;
}> = ({ cx, cy, s, kind, color, draw = 1, scale = 1 }) => {
  const k = s / 100;
  const sw = (kind === "tick" ? 12 : 11) * k;
  const d = clamp01(draw);
  const common = {
    stroke: color, strokeWidth: sw, fill: "none",
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - d,
  };
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale * k}) translate(${-50} ${-50})`} style={{ filter: MARK_SHADOW }}>
      {kind === "tick"
        ? <path d="M 16 52 L 40 78 L 86 22" {...common} />
        : (
          <>
            <path d="M 24 24 L 76 76" {...common} />
            <path d="M 76 24 L 24 76" {...common} strokeDashoffset={1 - clamp01(d * 2 - 1)} />
          </>
        )}
    </g>
  );
};

export const Tries: React.FC<CardProps & { data: TriesData }> = ({
  tMs, w, h, fps, fromMs, beats, data,
}) => {
  const g = triesGeom(w, h);
  const run2At = beats.run2 ?? (beats.run1 ?? fromMs) + 600;
  const goodAt = beats.good ?? run2At + 1040;
  const happyAt = beats.happy ?? goodAt + 1100;

  const labelFs = 0.036 * w;
  const markCy = g.top + g.markCyFrac * g.plateH;

  const sp = (ms: number, damping = 14) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping, stiffness: 340, mass: 0.6 } });

  // plate 1 is the card's first state: complete on the trigger word, the wrapper's pop is its entrance
  const p1 = 1;
  const p2 = sp(run2At);

  // the tick draws itself and grows to 1.25 of the cross, then pulses once on `happy`
  const drawn = easeOut((tMs - goodAt) / 240);
  const grow = tMs >= goodAt ? 0.85 + 0.40 * sp(goodAt, 12) : 0;
  const pu = clamp01((tMs - happyAt) / 300);
  const pulse = tMs >= happyAt ? 1 + 0.14 * Math.sin(Math.PI * pu) : 1;

  const plates: { i: number; s: number; name: string }[] = [
    { i: 0, s: p1, name: data.labels[0] },
    { i: 1, s: p2, name: data.labels[1] },
  ];

  // the burst: tiny rectangles and dots flying out of the tick for 300 ms, then gone
  const burstOrigin = { x: g.x(1) + g.plateW / 2, y: markCy };
  const N = 12;
  const bu = clamp01((tMs - happyAt) / 300);
  const bp = easeOut(bu);
  const pieces = tMs >= happyAt && bu < 1
    ? Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2 + rnd(i * 7 + 1) * 0.42;
      const r = (0.105 + 0.130 * rnd(i * 13 + 5)) * w * bp;
      const col = [INK, ACCENT, GREEN][i % 3];
      const dot = i % 4 === 1;
      const bw = dot ? 0.0105 * w : 0.0155 * w;
      const bh = dot ? 0.0105 * w : 0.0072 * w;
      return {
        i, col, dot,
        x: burstOrigin.x + Math.cos(a) * r,
        y: burstOrigin.y + Math.sin(a) * r * 0.92,
        bw, bh,
        rot: (a * 180) / Math.PI + 260 * bp * (rnd(i * 3 + 2) > 0.5 ? 1 : -1),
        op: 1 - Math.pow(bu, 1.7),
      };
    })
    : [];

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {plates.map((p) => {
        if (p.s <= 0) return null;
        const s = Math.min(1, p.s);
        return (
          <div
            key={p.i}
            style={{
              position: "absolute", left: g.x(p.i), top: g.top, width: g.plateW, height: g.plateH,
              backgroundColor: CARD_BG, borderRadius: 0, boxShadow: PLATE_SHADOW,
              opacity: clamp01(p.s * 3),
              transform: `scale(${0.90 + 0.10 * s})`, transformOrigin: "50% 50%",
            }}
          />
        );
      })}

      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <title>two runs of the same skill, one crossed out and one good</title>
        {/* run 1: the grey cross, complete on the trigger word */}
        <Mark cx={g.x(0) + g.plateW / 2} cy={markCy} s={g.markS} kind="cross" color={MUTED} />
        {/* run 2: blank until `good`, then a green tick that draws itself and grows */}
        {tMs >= goodAt && (
          <Mark
            cx={burstOrigin.x} cy={markCy} s={g.markS} kind="tick" color={GREEN}
            draw={drawn} scale={grow * pulse}
          />
        )}
        {pieces.map((c) => (
          <g key={c.i} opacity={c.op} transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`}>
            {c.dot
              ? <circle cx={0} cy={0} r={c.bw / 2} fill={c.col} />
              : <rect x={-c.bw / 2} y={-c.bh / 2} width={c.bw} height={c.bh} fill={c.col} />}
          </g>
        ))}
      </svg>

      {plates.map((p) => {
        if (p.s <= 0) return null;
        return (
          <div
            key={p.i}
            style={{
              position: "absolute", left: g.x(p.i), top: g.top + 0.055 * g.plateH, width: g.plateW,
              textAlign: "center", whiteSpace: "nowrap", lineHeight: 1,
              ...label(labelFs, INK), opacity: clamp01(p.s * 3),
            }}
          >
            {p.name}
          </div>
        );
      })}
    </div>
  );
};
