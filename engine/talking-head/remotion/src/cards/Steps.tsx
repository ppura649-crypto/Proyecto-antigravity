import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, CARD_BG, INK, MUTED, label } from "./theme";

// "It FEELS PRODUCTIVE, but it DOESN'T ACTUALLY MOVE YOU FORWARD most of the
// time" (mode "stuck"), and later, as the deliberate callback, "this actually
// helped me MOVE FORWARD A LOT FASTER, and I LEARN A LOT MORE" (mode "moving").
// One object twice: the same ground line, the same start, the same goal post at
// the far right, the same footprints. Stuck, every print lands on the one spot
// until the start is a trampled heap, and a dashed measure opens from the heap
// to the post and never moves again: all that effort, none of the distance.
// Moving, the same prints walk the line, one per thing actually done, the last
// landing at the post, and what they taught stacks up behind them.
//
// Frameless, and built to the contrast law: no bare white stroke anywhere. The
// ground, the start, the post and the measure are dark rails carrying a white
// rule; every word sits on a solid plate; accent is always a solid fill.

const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";

// deterministic scatter: the same frame renders identically on every machine
const rnd = (i: number): number => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const sgn = (i: number): number => rnd(i) * 2 - 1;
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

const STAMP_MS = 140;   // one print every ~140 ms while the creator is walking on the spot
const MAX_PRINTS = 30;  // bounded, so a long event cannot run the loop away
const SQUASH_MS = 170;  // the impact settling out of the print
const FLASH_MS = 220;   // how long a fresh print stays terracotta
const DUST_MS = 320;    // the tick of dust it kicks up

type Stamp = { k: number; at: number; cx: number; cy: number; rot: number };

export const Steps: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  mode: "stuck" | "moving";
  goal: string;
  steps?: string[];
  beats: { walk?: number; gap?: number; reach?: number; learn?: number };
}> = ({ tMs, w, h, fps, fromMs, mode, goal, steps, beats }) => {
  const at = {
    walk: beats.walk ?? fromMs + 260,
    gap: beats.gap ?? fromMs + 1900,
    reach: beats.reach ?? fromMs + 1800,
    learn: beats.learn ?? fromMs + 2600,
  };
  const reachAt = Math.max(at.reach, at.walk + 480);

  const sp = (ms: number): number =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 300, mass: 0.7 } });
  const ramp = (a: number, b: number): number =>
    interpolate(tMs, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ---- furniture, measured identically in both modes so the callback lands
  const padX = 0.045 * w;
  const groundY = 0.62 * h;
  const rail = 0.020 * w;    // the dark casing every rule sits inside
  const stripe = 0.008 * w;  // the white rule inside the casing
  const hair = 0.0035 * w;

  const startX = 0.07 * w;
  const postW = 0.034 * w;
  const postX = w - padX - postW / 2;
  const postTop = 0.03 * h;
  const postBot = groundY + rail / 2;

  const footL = 0.115 * w;
  const footW = 0.044 * w;

  const runFrom = 0.17 * w;                       // the start, where the heap piles up
  const runTo = postX - postW / 2 - 0.062 * w;    // the last print, toe against the post

  const drawn = ramp(fromMs, fromMs + 420);
  const halo = `drop-shadow(0px 0px ${0.012 * w}px rgba(0,0,0,0.92)) drop-shadow(0px 3px 10px rgba(0,0,0,0.85))`;

  // ---- the prints
  const st = steps ?? [];
  const n = st.length;
  const stepX = (i: number): number => (n <= 1 ? runTo : runFrom + ((runTo - runFrom) * i) / (n - 1));
  const stampAt = (i: number): number => (n <= 1 ? reachAt : at.walk + ((reachAt - at.walk) * i) / (n - 1));

  const stamps: Stamp[] = [];
  if (mode === "stuck") {
    for (let k = 0; k < MAX_PRINTS; k++) {
      const t0 = at.walk + k * STAMP_MS;
      if (tMs < t0) break;
      stamps.push({
        k,
        at: t0,
        cx: runFrom + sgn(k * 2 + 1) * 0.035 * w,
        cy: groundY + (k % 2 === 0 ? -1 : 1) * 0.026 * h + sgn(k * 3 + 7) * 0.022 * h,
        rot: sgn(k * 5 + 11) * 18,
      });
    }
  } else {
    for (let i = 0; i < n; i++) {
      const t0 = stampAt(i);
      if (tMs < t0) break;
      stamps.push({
        k: i,
        at: t0,
        cx: stepX(i),
        cy: groundY + (i % 2 === 0 ? -1 : 1) * 0.028 * h,
        rot: sgn(i * 5 + 11) * 5,
      });
    }
  }

  // one print, centred on its own origin and walking to the right: the ball of
  // the foot, four toes bumping out of the front of it, and the heel behind
  const TOES = [-0.62, -0.21, 0.21, 0.62];
  const shoe = (fill: string, op: number, outline: boolean): React.ReactElement => (
    <g fill={fill} fillOpacity={op} stroke={outline ? MUTED : "none"}
      strokeOpacity={outline ? 0.6 : 0} strokeWidth={outline ? hair : 0}>
      <ellipse cx={0.13 * footL} cy={0} rx={0.31 * footL} ry={0.5 * footW} />
      {TOES.map((t) => (
        <ellipse key={t} rx={0.055 * footL} ry={0.115 * footW}
          cx={0.13 * footL + 0.34 * footL * Math.cos(t)} cy={0.55 * footW * Math.sin(t)} />
      ))}
      <ellipse cx={-0.365 * footL} cy={0} rx={0.155 * footL} ry={0.34 * footW} />
    </g>
  );

  const prints = stamps.map((s) => {
    const age = tMs - s.at;
    const e = Math.pow(Math.max(0, 1 - age / SQUASH_MS), 2);   // the impact, squashing out
    const fl = Math.max(0, 1 - age / FLASH_MS);                 // fresh prints land terracotta
    return (
      <g key={s.k} transform={`translate(${s.cx} ${s.cy}) rotate(${s.rot}) scale(${1 + 0.16 * e} ${1 - 0.2 * e})`}>
        {shoe(CARD_BG, 0.94, true)}
        {fl > 0.01 && shoe(ACCENT, fl, false)}
      </g>
    );
  });

  // the dust each stamp kicks up and out, gone in a third of a second
  const dust: React.ReactElement[] = [];
  for (const s of stamps) {
    const p = (tMs - s.at) / DUST_MS;
    if (p < 0 || p >= 1) continue;
    for (let j = 0; j < 3; j++) {
      const a = Math.PI * (1.15 + 0.7 * rnd(s.k * 13 + j * 7));
      const r = 0.028 * w + 0.055 * w * p;
      const sz = 0.01 * w * (1 - 0.4 * p);
      const dx = s.cx + Math.cos(a) * r;
      const dy = s.cy + Math.sin(a) * r * 0.6;
      dust.push(
        <rect key={`d${s.k}-${j}`} x={dx - sz / 2} y={dy - sz / 2} width={sz} height={sz}
          fill={INK} fillOpacity={0.5 * (1 - p)} transform={`rotate(${rnd(s.k + j * 3) * 45} ${dx} ${dy})`} />
      );
    }
  }

  // the ground the heap tramples: an irregular scuff that grows and darkens
  const heapT = clamp(stamps.length / 18, 0, 1);
  const scuffPts: string[] = [];
  for (let j = 0; j < 12; j++) {
    const a = (Math.PI * 2 * j) / 12;
    const rx = (0.06 + 0.035 * heapT) * w * (0.82 + 0.34 * rnd(j * 9 + 3));
    const ry = (0.042 + 0.022 * heapT) * h * (0.82 + 0.34 * rnd(j * 11 + 5));
    scuffPts.push(`${runFrom + Math.cos(a) * rx},${groundY + Math.sin(a) * ry}`);
  }

  // ---- stuck: the distance that never closes, opened once and then frozen
  const measIn = ramp(at.gap, at.gap + 420);
  const measY = 0.4 * h;
  const measFrom = runFrom + 0.11 * w;
  const measTo = postX - postW / 2;
  const measLen = (measTo - measFrom) * measIn;
  const capW = 0.012 * w;

  // ---- moving: the post it actually reaches, and the staircase behind it
  const reach = mode === "moving" ? clamp(sp(reachAt), 0, 1) : 0;
  const blockW = 0.085 * w;
  const blockBase = groundY - 0.085 * h;
  const blockH = (i: number): number => 0.04 * h + 0.06 * h * i;
  const capH = 0.016 * h;
  const topBlock = blockBase - blockH(Math.max(0, n - 1));

  // ---- plates: every word on the card sits on one
  const goalFs = 0.040 * w;
  const stepFs = 0.030 * w;
  const platePadY = 0.015 * w;
  const plateH = goalFs + 2 * platePadY;
  const goalRight = postX - postW / 2 - 0.018 * w;
  const learnTop = topBlock - 0.03 * h - plateH;
  const labelTop = groundY + 0.11 * h;
  const labelBox = 0.2 * w;

  const plate = (text: string, fs: number, padY: number, padX2: number, op: number): React.ReactElement => (
    <div style={{
      position: "relative", display: "inline-block", borderRadius: 0, opacity: op,
      padding: `${padY}px ${padX2}px`, maxWidth: "100%", overflow: "hidden",
    }}>
      <span style={{
        ...label(fs, INK), position: "relative", display: "block", lineHeight: 1, whiteSpace: "nowrap",
        textShadow: `0px 0px ${0.01 * w}px rgba(0,0,0,0.92), ${SHADOW}`,
      }}>{text}</span>
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <title>{mode === "stuck" ? "every step landing on the same spot" : "the same ground, actually walked"}</title>
        <g style={{ filter: halo }}>
          {/* the ground the whole card stands on: a dark rail carrying a white rule */}
          <rect x={padX} y={groundY - rail / 2} width={(w - 2 * padX) * drawn} height={rail} fill={CARD_BG} fillOpacity={0.94} />
          <rect x={padX} y={groundY - stripe / 2} width={(w - 2 * padX) * drawn} height={stripe} fill={INK} fillOpacity={0.95} />

          {/* the trampled ground under the heap, deepening as it takes more prints */}
          {mode === "stuck" && heapT > 0 && (
            <polygon points={scuffPts.join(" ")} fill={CARD_BG} fillOpacity={0.22 + 0.3 * heapT} />
          )}

          {/* where the creator started */}
          <rect x={startX - rail / 2} y={groundY - 0.075 * h} width={rail} height={0.15 * h * drawn} fill={CARD_BG} fillOpacity={0.94} />
          <rect x={startX - stripe / 2} y={groundY - 0.075 * h} width={stripe} height={0.15 * h * drawn} fill={INK} fillOpacity={0.95} />

          {/* where the creator is trying to get to */}
          <rect x={postX - postW / 2} y={postTop} width={postW} height={(postBot - postTop) * drawn} fill={CARD_BG} fillOpacity={0.94} />
          <rect x={postX - stripe / 2} y={postTop} width={stripe} height={(postBot - postTop) * drawn} fill={INK} fillOpacity={0.95} />
          {reach > 0 && (
            <rect x={postX - postW / 2} y={postBot - (postBot - postTop) * reach}
              width={postW} height={(postBot - postTop) * reach} fill={ACCENT} />
          )}

          {/* what the walking taught, stacking up behind them */}
          {mode === "moving" &&
            st.map((_, i) => {
              const s = Math.min(1, sp(at.learn + i * 90));
              if (s <= 0.01) return null;
              const bh = blockH(i) * s;
              return (
                <g key={`b${i}`}>
                  <rect x={stepX(i) - blockW / 2} y={blockBase - bh} width={blockW} height={bh} fill={CARD_BG} fillOpacity={0.94} />
                  <rect x={stepX(i) - blockW / 2} y={blockBase - bh} width={blockW} height={Math.min(capH, bh)} fill={ACCENT} />
                </g>
              );
            })}

          {prints}
          {dust}

          {/* stuck: the whole distance, opened once and never moving again */}
          {mode === "stuck" && measIn > 0 && (
            <g>
              <rect x={measFrom} y={measY - rail / 2} width={measLen} height={rail} fill={CARD_BG} fillOpacity={0.94} />
              <line x1={measFrom} y1={measY} x2={measFrom + measLen} y2={measY}
                stroke={INK} strokeWidth={stripe} strokeOpacity={0.95} strokeDasharray={`${0.022 * w} ${0.016 * w}`} />
              <rect x={measFrom - capW / 2} y={measY - 0.0375 * h} fill={ACCENT}
                width={capW} height={groundY - 0.085 * h - (measY - 0.0375 * h)} />
              <rect x={measTo - capW} y={measY - 0.0375 * h} width={capW} height={0.075 * h} fill={ACCENT} opacity={measIn} />
            </g>
          )}
        </g>
      </svg>

      {/* what the post is */}
      <div style={{
        position: "absolute", right: w - goalRight, top: postTop,
        maxWidth: goalRight - 0.05 * w, display: "flex", justifyContent: "flex-end",
      }}>{plate(goal, goalFs, platePadY, 0.026 * w, drawn)}</div>

      {/* moving: what each thing the creator actually did was */}
      {mode === "moving" &&
        stamps.map((s) => {
          const a = Math.min(1, sp(s.at) * 2);
          if (a <= 0.02) return null;
          return (
            <div key={`l${s.k}`} style={{
              position: "absolute", top: labelTop, width: labelBox,
              left: clamp(stepX(s.k) - labelBox / 2, 0.02 * w, w - 0.02 * w - labelBox),
              display: "flex", justifyContent: "center",
              transform: `translateY(${(1 - a) * -0.02 * h}px)`,
            }}>{plate(st[s.k], stepFs, 0.014 * w, 0.02 * w, a)}</div>
          );
        })}

      {/* moving: what the whole walk was worth */}
      {mode === "moving" && n > 0 && sp(at.learn + (n - 1) * 90 + 120) > 0.02 && (
        <div style={{
          position: "absolute", right: w - (stepX(n - 1) + blockW / 2), top: learnTop,
          maxWidth: 0.5 * w, display: "flex", justifyContent: "flex-end",
        }}>{plate("LEARNED", goalFs, platePadY, 0.026 * w, Math.min(1, sp(at.learn + (n - 1) * 90 + 120) * 2))}</div>
      )}
    </div>
  );
};
