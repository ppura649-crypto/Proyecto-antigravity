import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import type { CardProps } from "./props";
import { BAR_GREY, CARD_BG, INK, label } from "./theme";
import { GLOW, SHADOW } from "./Mascot";

// V14 "This was one of their moats. But now OpenAI built their own" and, 13 s later,
// V19 "the CUDA moat is potentially dead." ONE object in two modes, v4 after their
// note (2026-09-05, "we don't understand the animations, let's make it clearer"):
// a castle cross-section, the keep named CUDA on its face with the real Nvidia eye
// above it, a ring of water round the island with the word MOAT written on it, and
// the real OpenAI mark standing on the far bank.
//   mode "fill":  the water rises on `moats.` and MOAT is written on it; on `now`
//                 the OpenAI mark shoves into the bank and rebounds. Holds.
//   mode "drain": the callback. Starts FULL, so the object is recognised; on `dead.`
//                 the water drains in 350 ms and MOAT fades with it, then the OpenAI
//                 mark walks down the dry channel and up onto the island, next to the
//                 keep, and lands with a pop.
// Frameless over the dark curtain: the land is a solid object, thick strokes, every
// glyph and mark carries a 0-offset halo as well as the offset shadow, and the only
// saturated colours are the two marks' own.
export type MoatData = { label: string; water?: string; mode: "fill" | "drain"; rivals?: number };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const NVIDIA_AR = 595 / 409;

// the two modes share one clock so the object is drawn once
const timing = (mode: "fill" | "drain", tMs: number, beats: Record<string, number>, fromMs: number) => {
  const r = (a: number, b: number) => interpolate(tMs, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (mode === "drain") {
    const d = beats.drain ?? fromMs;
    const g = easeOut(r(d, d + 350));
    const landAt = d + 750;
    return {
      level: 1 - g, name: 1 - r(d, d + 200), shove: 0,
      cross: easeInOut(r(d + 350, landAt)),
      pop: Math.sin(Math.PI * clamp01((tMs - landAt) / 170)),
    };
  }
  const f = beats.fill ?? fromMs;
  const b = beats.bump ?? f + 600;
  const u = clamp01((tMs - b) / 180);
  return {
    level: easeOut(r(f, f + 320)), name: r(f + 200, f + 340),
    cross: 0, pop: 0, shove: tMs < b ? 0 : Math.sin(Math.PI * u),
  };
};

export const Moat: React.FC<CardProps & { data: MoatData }> = ({ tMs, w, h, fromMs, beats, assets, data }) => {
  // the ground profile, left to right: bank, moat, island, moat, far bank
  const xA = 0.060 * w, xB = 0.240 * w, xC = 0.600 * w, xD = 0.780 * w;
  const yGround = 0.600 * h, yFloor = 0.860 * h, yBottom = 0.960 * h;
  const sw = 0.010 * w;
  const halo = `drop-shadow(0px 0px ${0.010 * w}px rgba(0,0,0,0.92)) ${GLOW}`;
  const textHalo = `0px 0px ${0.012 * w}px rgba(0,0,0,0.92), ${SHADOW}`;

  const t = timing(data.mode, tMs, beats, fromMs);
  const waterTop = yFloor - (yFloor - yGround) * t.level;

  // the keep, crenellated, standing on the island, its name on its face
  const kw = 0.160 * w, kx = 0.380 * w, kTop = 0.190 * h, merlonH = 0.055 * h;
  const m = kw / 9, kL = kx - kw / 2, kBase = kTop + merlonH;
  const pts: string[] = [`${kL},${yGround}`, `${kL},${kBase}`];
  for (let i = 0; i < 5; i++) {
    const x0 = kL + i * 2 * m;
    pts.push(`${x0},${kBase}`, `${x0},${kTop}`, `${x0 + m},${kTop}`, `${x0 + m},${kBase}`);
  }
  pts.push(`${kL + kw},${kBase}`, `${kL + kw},${yGround}`);

  // the rival: the real OpenAI mark on the far bank, on the island once the ring is dry
  const s = 0.120 * w;
  const bankCx = (xD + w) / 2;
  const landCx = 0.530 * w;
  const rx = bankCx + (landCx - bankCx) * t.cross - t.shove * 0.030 * w;
  // crossing the emptied ring it walks DOWN into the channel and up the far side
  const dip = rx > xC && rx < xD ? Math.sin(Math.PI * ((xD - rx) / (xD - xC))) * (yFloor - yGround) * 0.6 : 0;
  const rScale = 1 + 0.10 * t.pop;

  const eyeW = 0.150 * w;
  const fs = 0.034 * w;

  const wave = (x0: number, x1: number, y: number, amp: number, ph: number) => {
    const k = (2 * Math.PI) / (0.075 * w);
    let d = `M ${x0} ${y}`;
    for (let x = x0; x <= x1; x += 6) d += ` L ${x} ${y + amp * Math.sin(k * (x - x0) + ph)}`;
    return d;
  };

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <title>a castle named CUDA on an island, a ring of water named MOAT, OpenAI on the far bank</title>

        {/* the water in the ring: a solid white band with a crest, never a colour */}
        {t.level > 0.001 && (
          <g>
            {[[xA, xB], [xC, xD]].map(([x0, x1]) => {
              const depth = yFloor - waterTop;
              return (
                <g key={x0}>
                  <rect x={x0} y={waterTop} width={x1 - x0} height={depth} fill={INK} fillOpacity={0.42} />
                  {[0.40, 0.72].map((f) => (
                    <path
                      key={f} d={wave(x0, x1, waterTop + depth * f, 0.007 * h, tMs / 700 + f * 5)}
                      fill="none" stroke={INK} strokeWidth={0.005 * w} strokeOpacity={0.45}
                    />
                  ))}
                  <path d={wave(x0, x1, waterTop, 0.011 * h, tMs / 900)} fill="none" stroke={INK} strokeWidth={0.007 * w} strokeOpacity={0.95} style={{ filter: halo }} />
                </g>
              );
            })}
          </g>
        )}

        <g style={{ filter: halo }}>
          {/* the ground, cut through twice: bank, moat, island, moat, far bank */}
          <path
            d={`M 0 ${yGround} H ${xA} V ${yFloor} H ${xB} V ${yGround} H ${xC} V ${yFloor} H ${xD} V ${yGround} H ${w} V ${yBottom} H 0 Z`}
            fill={CARD_BG} fillOpacity={0.88} stroke={INK} strokeWidth={sw} strokeLinejoin="miter"
          />
          {/* the keep */}
          <polygon points={pts.join(" ")} fill={CARD_BG} fillOpacity={0.92} stroke={INK} strokeWidth={sw} />
        </g>
      </svg>

      {/* the keep's name on its face */}
      <div
        style={{
          position: "absolute", left: kx, top: (kBase + yGround) / 2,
          transform: "translate(-50%, -50%)", whiteSpace: "nowrap",
          ...label(fs, INK), textShadow: textHalo,
        }}
      >
        {data.label}
      </div>

      {/* the real Nvidia mark, frameless, flying over the keep */}
      <Img
        src={staticFile(assets[0])}
        style={{
          position: "absolute", left: kx - eyeW / 2, top: kTop - 0.025 * h - eyeW / NVIDIA_AR,
          width: eyeW, filter: `drop-shadow(0px 0px ${0.012 * w}px rgba(0,0,0,0.92)) ${GLOW}`,
        }}
      />

      {/* the real OpenAI mark, frameless, on the bank then on the island */}
      {assets[1] && (
        <Img
          src={staticFile(assets[1])}
          style={{
            position: "absolute", left: rx - s / 2, top: yGround + dip - s - 0.012 * h, width: s, height: s,
            objectFit: "contain", transform: `scale(${rScale})`, transformOrigin: "50% 100%",
            filter: `drop-shadow(0px 0px ${0.012 * w}px rgba(0,0,0,0.92)) ${GLOW}`,
          }}
        />
      )}

      {/* what the ring is, written on the water while there is water */}
      {t.level > 0.5 && (
        <div
          style={{
            position: "absolute", left: (xA + xB) / 2, top: (waterTop + yFloor) / 2,
            transform: "translate(-50%, -50%)", whiteSpace: "nowrap",
            ...label(fs, INK), textShadow: textHalo, opacity: clamp01(t.name),
          }}
        >
          {data.water ?? "MOAT"}
        </div>
      )}
      {t.level > 0.5 && (
        <div
          style={{
            position: "absolute", left: (xC + xD) / 2, top: (waterTop + yFloor) / 2,
            transform: "translate(-50%, -50%)", whiteSpace: "nowrap",
            ...label(fs, INK), textShadow: textHalo, opacity: clamp01(t.name),
          }}
        >
          {data.water ?? "MOAT"}
        </div>
      )}
      <span hidden>{BAR_GREY}</span>
    </div>
  );
};
