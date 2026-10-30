import React from "react";
import { interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, INK, LABEL_FONT } from "./theme";
import { ReelTile } from "./Tiles";

// "FOR BOTH OURSELVES AND FOR THE CREATORS WE KNOW."
// A ring of people seen the way a ring of people actually looks: a shallow ellipse, the
// far side higher and a touch smaller, everyone standing on the line. The two founders
// stand in the middle, lit terracotta, tagged US. The ring is drawn around them clockwise
// on "and", and the creators arrive on it one by one on "creators", grey, each with a play
// mark on the chest. RingLit reuses this exact drawing as a callback (RingScene below), so
// the second card is the same picture in a changed state, never a second object.

const DARK = "#1F1E1D";
const GREY = "#BFC3C8";
const ALWAYS = -1e9;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const RAD = Math.PI / 180;

export type RingData = { us: string; outer: number };

// one person: a round head over a shoulder arc, standing on the ring at (x, y)
const Person: React.FC<{
  x: number; y: number; g: number; fill: string; badge: boolean;
  pop: number; tile?: number; sx?: number;
}> = ({ x, y, g, fill, badge, pop, tile = 0, sx = 1 }) => {
  const s = 0.55 + 0.45 * Math.min(1.08, pop);
  const th = 0.70 * g;
  const tw = th * (9 / 16);
  const ts = 0.55 + 0.45 * Math.min(1.08, tile);
  return (
    <g opacity={clamp01(pop * 3)} transform={`translate(${x} ${y}) scale(${s * sx} ${s})`}>
      <path
        d={`M ${-0.345 * g} 0 C ${-0.345 * g} ${-0.30 * g}, ${-0.205 * g} ${-0.50 * g}, 0 ${-0.50 * g}`
          + ` C ${0.205 * g} ${-0.50 * g}, ${0.345 * g} ${-0.30 * g}, ${0.345 * g} 0 Z`}
        fill={fill}
      />
      <circle cx={0} cy={-0.78 * g} r={0.215 * g} fill={fill} />
      {badge && (
        <path
          d={`M ${-0.072 * g} ${-0.40 * g} L ${0.088 * g} ${-0.28 * g} L ${-0.072 * g} ${-0.16 * g} Z`}
          fill={DARK}
        />
      )}
      {tile > 0.001 && (
        <g
          opacity={clamp01(tile * 3)}
          transform={`translate(0 ${-1.09 * g}) scale(${ts}) translate(0 ${1.09 * g})`}
        >
          <ReelTile x={-tw / 2} y={-1.09 * g - th} tw={tw} th={th} />
        </g>
      )}
    </g>
  );
};

// the ring itself, as a polyline so the draw starts at the top and runs clockwise
const ellipse = (rx: number, ry: number): { d: string; len: number } => {
  const n = 180;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    pts.push([rx * Math.cos(a), ry * Math.sin(a)]);
  }
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return { d: `M ${pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" L ")}`, len };
};

export type RingSceneProps = {
  tMs: number; w: number; h: number; fps: number;
  us: string;
  centreAt: number;       // the two founders pop (ALWAYS = already standing there)
  tagAt: number;          // the US tag lands
  ringAt: number;         // the ring starts drawing
  outerAt: number;        // the first creator lands on the ring
  outerStep: number;
  outerN: number;
  litAt?: number;         // the creators light to the accent, one per litStep
  litStep?: number;
  widerAt?: number;       // the wider ring of creators pops in, already lit
  widerStep?: number;
  widerN?: number;
  flipAt?: number;        // the two founders flip to white
};

// One drawing, two cards. Every position is world px around the scene centre, at one
// scale throughout, so the callback is literally the same picture and nobody shrinks
// when the crowd grows.
export const RingScene: React.FC<RingSceneProps> = (p) => {
  const { tMs, w, h, fps, us } = p;
  const cx = w / 2;
  const cy = 0.57 * h;
  const GI = 64;
  const GC = 78;          // the two founders are the subject: bigger than the ring
  const rxI = 0.400 * w;
  const ryI = 175;
  // the wider ring is as wide as 972x518 allows with everyone at full size:
  // solved so no glyph, reel or card edge touches another (min clearance ~0 px)
  const rxO = 0.468 * w;
  const ryO = 188;
  const OUTER_OFF = -63.5;

  const sp = (ms: number) =>
    ms <= ALWAYS / 2 ? 1
      : spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 330, mass: 0.6 } });
  const ramp = (a: number, b: number) =>
    interpolate(tMs, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const inner = ellipse(rxI, ryI);
  const outerE = ellipse(rxO, ryO);
  const ringP = p.ringAt <= ALWAYS / 2 ? 1 : easeOut(ramp(p.ringAt, p.ringAt + 300));
  const widerRing = p.widerAt == null ? 0 : clamp01(ramp(p.widerAt, p.widerAt + 160));

  // everyone on the two rings, back to front so the near ones overlap the far ones
  type P = { key: string; x: number; y: number; g: number; fill: string; pop: number; tile: number };
  const people: P[] = [];
  for (let i = 0; i < p.outerN; i++) {
    const a = (-67.5 + i * (360 / p.outerN)) * RAD;
    const x = rxI * Math.cos(a);
    const y = ryI * Math.sin(a);
    const depth = 0.93 + 0.10 * ((y + ryI) / (2 * ryI));
    const lit = p.litAt == null ? 0 : clamp01((tMs - (p.litAt + i * (p.litStep ?? 100))) / 130);
    people.push({
      key: `i${i}`, x, y, g: GI * depth,
      fill: lit > 0 ? ACCENT : GREY,
      pop: sp(p.outerAt + i * p.outerStep) * (lit > 0 && lit < 1 ? 1 + 0.14 * Math.sin(lit * Math.PI) : 1),
      tile: p.litAt == null ? 0 : sp(p.litAt + i * (p.litStep ?? 100)),
    });
  }
  for (let j = 0; j < (p.widerN ?? 0); j++) {
    const a = (OUTER_OFF + j * (360 / (p.widerN ?? 1))) * RAD;
    const x = rxO * Math.cos(a);
    const y = ryO * Math.sin(a);
    const depth = 0.93 + 0.10 * ((y + ryO) / (2 * ryO));
    const at = (p.widerAt ?? 0) + j * (p.widerStep ?? 40);
    people.push({ key: `o${j}`, x, y, g: GI * depth, fill: ACCENT, pop: sp(at), tile: sp(at + 40) });
  }
  people.sort((a, b) => a.y - b.y);

  // the two founders, and the tag that names them; they flip to white on "around us"
  const flip = p.flipAt == null ? 0 : clamp01(ramp(p.flipAt, p.flipAt + 260));
  const usFill = flip >= 0.5 ? INK : ACCENT;
  const usSx = Math.max(0.06, Math.abs(Math.cos(flip * Math.PI)));
  const centre = sp(p.centreAt);
  const tag = sp(p.tagAt);
  const tagFs = 0.60 * GC;

  const halo = `drop-shadow(0px 0px ${0.011 * w}px rgba(0,0,0,0.92)) drop-shadow(0px 3px 12px rgba(0,0,0,0.75))`;

  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: halo }}>
      <title>the two of them, and the creators around them</title>
      <g transform={`translate(${cx} ${cy})`}>
        {ringP > 0.002 && (
          <path
            d={inner.d} fill="none" stroke={INK} strokeWidth={5} opacity={0.85}
            strokeDasharray={inner.len} strokeDashoffset={inner.len * (1 - ringP)}
          />
        )}
        {widerRing > 0.002 && (
          <path d={outerE.d} fill="none" stroke={INK} strokeWidth={5} opacity={0.70 * widerRing} />
        )}

        {/* the founders stand inside the ring */}
        {centre > 0.001 && (
          <>
            <Person x={-0.52 * GC} y={34} g={GC} fill={usFill} badge={false} pop={centre} sx={usSx} />
            <Person x={0.52 * GC} y={34} g={GC} fill={usFill} badge={false} pop={centre} sx={usSx} />
          </>
        )}
        {tag > 0.001 && (
          <text
            x={0} y={56 + tagFs} textAnchor="middle" fill={usFill}
            opacity={clamp01(tag * 3)}
            transform={`translate(0 ${56 + tagFs}) scale(${0.7 + 0.3 * Math.min(1.06, tag)}) translate(0 ${-(56 + tagFs)})`}
            style={{ fontFamily: LABEL_FONT, fontSize: tagFs, letterSpacing: "0.09em", fontWeight: 700 }}
          >{us}</text>
        )}

        {people.map((q) => (
          q.pop <= 0.001 ? null
            : <Person key={q.key} x={q.x} y={q.y} g={q.g} fill={q.fill} badge pop={q.pop} tile={q.tile} />
        ))}
      </g>
    </svg>
  );
};

export const Ring: React.FC<CardProps & { data: RingData }> = ({ tMs, w, h, fps, beats, data }) => (
  <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    <RingScene
      tMs={tMs} w={w} h={h} fps={fps} us={data.us ?? "US"}
      centreAt={beats.ourselves} tagAt={beats.ourselves + 90}
      ringAt={beats.and}
      outerAt={beats.creators} outerStep={90} outerN={data.outer ?? 8}
    />
  </div>
);
