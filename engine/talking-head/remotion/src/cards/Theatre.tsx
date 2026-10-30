import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, BAR_GREY, INK, MONO_FONT, MUTED, label } from "./theme";

// "I think AI research is the most productive FEELING way OF doing nothing."
// A four cell dashboard of the theatre. Three vanity counters churn upward fast
// enough to feel like work, while the fourth cell, the only one that would
// count as output, never moves. Its blinking cursor says it is live, not
// broken. Three numbers running and one stuck: that gap is the whole card.

type Cell =
  | { label: string; live: true; to: number }
  | { label: string; live: false; value: string };

const comma = (n: number) => Math.round(n).toLocaleString("en-US");

// deterministic per frame churn, so every render of the same frame is identical
const rand = (seed: number) => {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

export const Theatre: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number; toMs: number;
  counters: { label: string; to: number }[];
  dead: { label: string; value: string };
}> = ({ tMs, w, h, fps, fromMs, toMs, counters, dead }) => {
  const pad = 0.050 * w;
  const labelFs = 0.030 * w;
  const numFs = 0.100 * w;
  const deadFs = 0.130 * w;
  const hair = 0.0016 * w;

  const sp = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 14, stiffness: 300, mass: 0.7 } });

  // one fast ease out across the whole life of the card
  const p = interpolate(tMs, [fromMs, Math.max(fromMs + 1, toMs)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const eased = 1 - Math.pow(1 - p, 3);
  const frame = Math.floor((tMs / 1000) * fps);

  // the low decade of each counter is re-rolled every frame, so the digits churn
  const churn = (to: number, i: number) => {
    if (p >= 1) return to;
    const digits = Math.floor(Math.log10(Math.max(1, Math.abs(to)))) + 1;
    const dec = Math.pow(10, Math.max(1, digits - 2));
    const low = Math.floor(rand(frame * 3.7 + i * 41.3) * dec);
    return Math.min(to, Math.floor((eased * to) / dec) * dec + low);
  };

  const blink = ((tMs - fromMs + 4000) % 1000) < 560;

  const cells: Cell[] = [
    ...counters.slice(0, 3).map((c) => ({ label: c.label, live: true as const, to: c.to })),
    { label: dead.label, live: false as const, value: dead.value },
  ];

  const cell = (c: Cell, i: number) => {
    const s = sp(fromMs + i * 40);
    return (
      <div key={i} style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 0.020 * h, opacity: Math.min(1, s * 2), transform: `scale(${0.93 + 0.07 * s})`,
      }}>
        <div style={{ ...label(labelFs, MUTED), textAlign: "center", whiteSpace: "nowrap" }}>{c.label}</div>
        {c.live ? (
          <div style={{
            fontFamily: MONO_FONT, fontWeight: 600, fontSize: numFs, lineHeight: 1,
            color: INK, fontVariantNumeric: "tabular-nums",
          }}>
            {comma(churn(c.to, i))}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "baseline", gap: 0.014 * w }}>
            <div style={{
              fontFamily: MONO_FONT, fontWeight: 700, fontSize: deadFs, lineHeight: 1,
              color: ACCENT, fontVariantNumeric: "tabular-nums",
            }}>
              {c.value}
            </div>
            <div style={{
              fontFamily: MONO_FONT, fontWeight: 700, fontSize: deadFs * 0.78, lineHeight: 1,
              color: ACCENT, opacity: blink ? 1 : 0,
            }}>_</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0, padding: pad, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", left: pad, right: pad, top: "50%", height: hair, backgroundColor: BAR_GREY, opacity: 0.5 }} />
      <div style={{ position: "absolute", top: pad, bottom: pad, left: "50%", width: hair, backgroundColor: BAR_GREY, opacity: 0.5 }} />
      <div style={{ flex: 1, display: "flex" }}>{cells.slice(0, 2).map((c, i) => cell(c, i))}</div>
      <div style={{ flex: 1, display: "flex" }}>{cells.slice(2, 4).map((c, i) => cell(c, i + 2))}</div>
    </div>
  );
};
