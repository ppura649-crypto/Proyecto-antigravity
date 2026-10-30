import React from "react";
import { interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, BAR_GREY, CARD_BG, INK, MONO_FONT, MUTED, label } from "./theme";
import { Head } from "./Head";

// "But OpenAI is already planning for a version 2 and 3."
// Our own drawing of the Hot Chips roadmap on one black card: three chips stepping up
// left to right, each a package with leads and a die inside it. Gen 1 stands when the
// card comes in, Gen 2 pops on `2` with the accent filling its die (the payload: the
// one already approaching tape-out), Gen 3 pops on `3.` with a dashed die, because it
// is drawn and not yet built. The slide's own words under each name, its source small
// at the bottom right. Two type sizes, one accent.

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type GensData = { gens: { name: string; sub: string }[]; source: string };

// a die is a die: a package body, leads on all four edges, a die inside with its cells
const Chip: React.FC<{ d: number; lead: number; mode: "solid" | "accent" | "planned" }> = ({ d, lead, mode }) => {
  const S = d + 2 * lead;
  const bw = 0.032 * d;
  const iw = 0.024 * d;
  const inset = 0.18 * d;
  const die = d - 2 * inset;
  const lw = 0.055 * d;
  const dash = `${0.10 * d} ${0.070 * d}`;
  const planned = mode === "planned";
  const cuts = [1, 2].map((k) => inset + (die * k) / 3);
  return (
    <svg width={S} height={S} style={{ display: "block", overflow: "visible" }}>
      <title>a chip</title>
      {[0, 1, 2, 3].map((k) => {
        const p = lead + (d * (k + 0.5)) / 4 - lw / 2;
        return (
          <g key={k} fill={INK} opacity={planned ? 0.85 : 1}>
            <rect x={0} y={p} width={lead} height={lw} />
            <rect x={lead + d} y={p} width={lead} height={lw} />
            <rect x={p} y={0} width={lw} height={lead} />
            <rect x={p} y={lead + d} width={lw} height={lead} />
          </g>
        );
      })}
      <rect
        x={lead} y={lead} width={d} height={d} fill="none" stroke={INK} strokeWidth={bw}
        strokeDasharray={planned ? dash : undefined} strokeOpacity={planned ? 0.75 : 1}
      />
      {mode === "accent" && <rect x={lead + inset} y={lead + inset} width={die} height={die} fill={ACCENT} />}
      <rect
        x={lead + inset} y={lead + inset} width={die} height={die} fill="none"
        stroke={mode === "accent" ? CARD_BG : INK} strokeWidth={iw}
        strokeDasharray={planned ? dash : undefined} strokeOpacity={planned ? 0.75 : 1}
      />
      {!planned && cuts.map((c) => (
        <g key={c} stroke={mode === "accent" ? CARD_BG : INK} strokeWidth={iw * 0.8} strokeOpacity={0.5}>
          <line x1={lead + c} y1={lead + inset} x2={lead + c} y2={lead + d - inset} />
          <line x1={lead + inset} y1={lead + c} x2={lead + d - inset} y2={lead + c} />
        </g>
      ))}
    </svg>
  );
};

export const Gens: React.FC<CardProps & { data: GensData }> = ({
  tMs, w, h, fps, fromMs, beats, data,
}) => {
  const padX = 0.045 * w;
  const padY = 0.070 * h;
  const gap = 0.026 * w;
  const gens = data.gens.slice(0, 3);
  const colW = (w - 2 * padX - gap * (gens.length - 1)) / gens.length;
  const d = 0.150 * w;
  const lead = 0.010 * w;
  const nameFs = 0.040 * w;
  const subFs = 0.023 * w;
  const rise = 0.085 * h;
  const chipTop0 = 0.390 * h;

  const at = [fromMs, beats.g2 ?? fromMs + 180, beats.g3 ?? fromMs + 840];
  const sp = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 15, stiffness: 330, mass: 0.6 } });
  const draw = (ms: number) =>
    interpolate(tMs, [ms, ms + 160], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cx = (i: number) => padX + i * (colW + gap) + colW / 2;
  const chipTop = (i: number) => chipTop0 - i * rise;
  const cy = (i: number) => chipTop(i) + d / 2;
  const modes: ("solid" | "accent" | "planned")[] = ["solid", "accent", "planned"];

  return (
    <div style={{ position: "absolute", inset: 0, padding: `${padY}px ${padX}px`, boxSizing: "border-box" }}>
      <Head w={w} left="ROADMAP" />

      {/* the steps between them: thin plumbing, drawn as each next chip arrives */}
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <title>three generations, stepping up</title>
        {[0, 1].map((i) => {
          const g = draw(at[i + 1]);
          if (g <= 0) return null;
          const x1 = cx(i) + d / 2 + lead;
          const x2 = cx(i + 1) - d / 2 - lead;
          const xm = (x1 + x2) / 2;
          return (
            <path
              key={i} d={`M ${x1} ${cy(i)} H ${xm} V ${cy(i + 1)} H ${x2}`}
              fill="none" stroke={BAR_GREY} strokeWidth={0.0045 * w}
              pathLength={1} strokeDasharray={1} strokeDashoffset={1 - g}
            />
          );
        })}
      </svg>

      {gens.map((g, i) => {
        const s = sp(at[i]);
        if (s <= 0) return null;
        return (
          <div
            key={g.name}
            style={{
              position: "absolute", left: cx(i) - colW / 2, top: chipTop(i) - lead, width: colW,
              display: "flex", flexDirection: "column", alignItems: "center",
              opacity: clamp01(s * 3), transform: `scale(${0.88 + 0.12 * Math.min(1, s)})`,
              transformOrigin: "50% 30%",
            }}
          >
            <Chip d={d} lead={lead} mode={modes[i]} />
            <div style={{ ...label(nameFs, INK), marginTop: 0.022 * h, lineHeight: 1 }}>{g.name}</div>
            <div style={{
              fontFamily: MONO_FONT, fontSize: subFs, color: INK, marginTop: 0.015 * h,
              lineHeight: 1.25, textAlign: "center", width: colW,
            }}>{g.sub}</div>
          </div>
        );
      })}

      <div style={{
        position: "absolute", right: padX, bottom: padY, fontFamily: MONO_FONT,
        fontSize: 0.023 * w, color: MUTED, lineHeight: 1,
      }}>{data.source}</div>
    </div>
  );
};
