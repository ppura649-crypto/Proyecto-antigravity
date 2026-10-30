import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, CARD_BG, INK, label } from "./theme";
import { GLOW, Mascot } from "./Mascot";

// "whether it's reading REPORTS or asking CLAUDE to do a DEEP RESEARCH, SAVING
// articles or PLANNING the perfect vision."
// Four activities that sound different arrive on four identical lanes, and every
// one of them points the same way: into one open topped bin that fills a quarter
// at a time. The bin is drawn as a container first so an empty bin reads as an
// empty bin. Nothing ever leaves it, and that missing outflow is the argument,
// so it is the one thing the card never draws.

// Against their cream wall an outline plus a drop shadow disappears, so every part
// of this card is an opaque object: each lane label rides its own near black
// plate, the bin has a dark interior behind the fill, the glyphs are solid
// shapes rather than thin drawings, and every stroke carries a zero offset halo
// on top of its offset shadow.
const PLATE_A = 0.42;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type GlyphKind = "doc" | "claude" | "bookmark" | "plan";

const Glyph: React.FC<{ kind: GlyphKind; size: number; halo: string }> = ({ kind, size, halo }) => {
  if (kind === "claude") return <Mascot size={size} color={INK} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", filter: halo }}>
      <title>{kind}</title>
      {kind === "doc" && (
        <>
          <rect x={3} y={2} width={18} height={20} fill={INK} />
          {[7, 10.5, 14, 17.5].map((y, i) => (
            <rect key={i} x={6} y={y - 1.1} width={i === 3 ? 7 : 12} height={2.2} fill={CARD_BG} />
          ))}
        </>
      )}
      {kind === "bookmark" && (
        <path d="M6 2 H18 V22 L12 16.4 L6 22 Z" fill={INK} />
      )}
      {kind === "plan" && (
        <>
          <rect x={3} y={2} width={18} height={20} fill={INK} />
          {[8, 13, 18].map((y, i) => (
            <g key={i}>
              <rect x={6} y={y - 1.8} width={3.6} height={3.6} fill={CARD_BG} />
              <rect x={11.6} y={y - 1.1} width={6.4} height={2.2} fill={CARD_BG} />
            </g>
          ))}
        </>
      )}
    </svg>
  );
};

export const Gather: React.FC<{
  tMs: number; w: number; h: number; fps: number;
  lanes: { label: string; at: number; glyph: GlyphKind }[];
  bin: { label: string };
  beats: { full?: number };
}> = ({ tMs, w, h, fps, lanes, bin, beats }) => {
  const n = Math.max(1, lanes.length);
  const labelFs = 0.036 * w;
  const binFs = 0.040 * w;
  const binSw = 0.011 * w;
  const arrowSw = 0.008 * w;
  const ah = 0.026 * w;

  const padX = 0.016 * w;
  const padY = 0.012 * w;
  const plateSw = 0;
  const halo = `drop-shadow(0px 0px ${0.010 * w}px rgba(0,0,0,0.92)) ${GLOW}`;
  const textHalo = `0px 0px ${0.012 * w}px rgba(0,0,0,0.92), 0px 2px 6px rgba(0,0,0,0.9)`;
  const plateShadow = `0px 0px ${0.010 * w}px rgba(0,0,0,0.92), 0px 12px 34px rgba(0,0,0,0.55)`;

  // lanes span 78% of the height on the left, the bin matches them on the right.
  // the band stops short of the bin's floor so the last arrow lands inside the bin
  // and not on its bottom corner
  const padL = 0.035 * w;
  const laneTop = 0.060 * h;
  const rowH = (0.780 * h) / n;
  const cy = (i: number) => laneTop + rowH * (i + 0.5);
  const gl = Math.min(0.130 * w, 0.82 * rowH);
  const gap = 0.020 * w;

  const binW = 0.260 * w;
  const binX = w - 0.060 * w - binW;
  const binCx = binX + binW / 2;
  const binTop = laneTop;
  // the bin stops high enough for its plated label to sit under it, two lines and all
  const binLabelW = 0.360 * w;
  const binLabelH = 2 * binFs * 1.15 + 2 * padY + 2 * plateSw;
  const binBot = h - 0.014 * h - binLabelH - 0.028 * h;
  const binH = binBot - binTop;

  const ax0 = 0.580 * w;
  const ax1 = binX - 0.012 * w;
  const laneW = ax0 - padL - 0.020 * w;
  const plateMax = laneW - gl - gap;

  const sp = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 300, mass: 0.7 } });

  const firstAt = lanes.length ? Math.min(...lanes.map((l) => l.at)) : 0;
  const binS = sp(firstAt - 320);

  // one quarter per lane that has landed, then it stops moving for good
  const base = lanes.reduce((a, l) => a + easeOut(clamp01((tMs - (l.at + 140)) / 420)), 0) / n;
  const fullP = beats.full === undefined ? 0 : clamp01((tMs - beats.full) / 320);
  const level = Math.min(1, Math.max(base, fullP));
  const still = Math.max(fullP, level >= 0.999 ? 1 : 0);
  const bob = (1 - still) * 0.004 * h * Math.sin(tMs / 420);
  const innerH = binH - 2 * binSw;
  const fillH = Math.min(innerH, Math.max(0, level * innerH + (level > 0.02 ? bob : 0)));

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <title>four kinds of input, one bin, no way out</title>

        <g opacity={Math.min(1, binS * 2)} transform={`translate(0 ${(1 - binS) * 0.020 * h})`}>
          {/* a dark interior first, so an empty bin is an object and not a wireframe */}
          <rect x={binX + binSw} y={binTop} width={binW - 2 * binSw} height={binH - binSw}
            fill={CARD_BG} fillOpacity={PLATE_A} />
          {/* the contents sit inside the walls, so the container always reads */}
          <rect x={binX + binSw} y={binBot - binSw - fillH} width={binW - 2 * binSw} height={fillH} fill={ACCENT} />
          <path d={`M ${binX + binSw / 2} ${binTop} L ${binX + binSw / 2} ${binBot - binSw / 2} L ${binX + binW - binSw / 2} ${binBot - binSw / 2} L ${binX + binW - binSw / 2} ${binTop}`}
            fill="none" stroke={INK} strokeWidth={binSw} strokeLinecap="square" strokeLinejoin="miter"
            style={{ filter: halo }} />
        </g>

        {lanes.map((l, i) => {
          const g = interpolate(tMs, [l.at + 150, l.at + 500], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          if (g <= 0) return null;
          const y = cy(i);
          return (
            <g key={i}>
              <path d={`M ${ax0} ${y} L ${ax1 - ah} ${y}`} fill="none" stroke={INK} strokeWidth={arrowSw}
                strokeOpacity={1} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - g}
                style={{ filter: halo }} />
              <polygon points={`${ax1 - ah},${y - ah * 0.62} ${ax1 - ah},${y + ah * 0.62} ${ax1},${y}`}
                fill={INK} opacity={clamp01((g - 0.85) / 0.15)} style={{ filter: halo }} />
            </g>
          );
        })}
      </svg>

      {lanes.map((l, i) => {
        const s = sp(l.at);
        if (s <= 0) return null;
        return (
          <div key={i} style={{
            position: "absolute", left: padL, top: cy(i) - rowH / 2,
            width: laneW, height: rowH,
            display: "flex", alignItems: "center", gap,
            transformOrigin: "left center",
            opacity: Math.min(1, s * 2),
            transform: `translateX(${(1 - s) * -0.10 * w}px) scale(${0.90 + 0.10 * s})`,
          }}>
            <div style={{ flex: "none", width: gl, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Glyph kind={l.glyph} size={gl} halo={halo} />
            </div>
            <div style={{
              position: "relative", boxSizing: "border-box", maxWidth: plateMax,
              padding: `${padY}px ${padX}px`, border: `${plateSw}px solid ${INK}`, borderRadius: 0,
              boxShadow: plateShadow,
            }}>
              <div style={{ position: "absolute", inset: 0, backgroundColor: CARD_BG, opacity: 0 }} />
              <div style={{ ...label(labelFs, INK), position: "relative", lineHeight: 1.15, textShadow: textHalo }}>{l.label}</div>
            </div>
          </div>
        );
      })}

      <div style={{
        position: "absolute", left: binCx - binLabelW / 2, top: binBot + 0.028 * h, width: binLabelW,
        textAlign: "center", opacity: Math.min(1, binS * 2),
      }}>
        <div style={{
          position: "relative", display: "inline-block", boxSizing: "border-box", maxWidth: "100%",
          padding: `${padY}px ${padX}px`, border: `${plateSw}px solid ${INK}`, borderRadius: 0,
          boxShadow: plateShadow,
        }}>
          <div style={{ position: "absolute", inset: 0, backgroundColor: CARD_BG, opacity: 0 }} />
          <div style={{ ...label(binFs, INK), position: "relative", lineHeight: 1.15, textShadow: textHalo }}>{bin.label}</div>
        </div>
      </div>
    </div>
  );
};
