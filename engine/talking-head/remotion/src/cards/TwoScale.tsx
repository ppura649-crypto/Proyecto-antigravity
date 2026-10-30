import React from "react";
import { Img, interpolate, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, BAR_GREY, INK, MONO_FONT, label } from "./theme";

// "IT TOOK NVIDIA 20 YEARS and thousands of engineers. OPENAI DID IT IN 9 MONTHS."
// One frameless object, two rows on ONE scale, the same grammar twice.
// Row 1 (their words 2026-09-05: "nvidia is perfect, don't change nvidia"): the real Nvidia
// eye, a long white bar with 2006 and 2026 at its ends, a dense field of tiny dots filling
// under it while a mono counter rolls 2,737 -> 31,000 engineers.
// Row 2 (v5, "we're not giving the number of engineers for openai"): the real OpenAI mark,
// the SAME span as a bare grey axis, forty dots (one per engineer, Reuters Feb 2025) and
// the counter rolling to 40 engineers on OPENAI, then a 26 px terracotta stub (9/240 of
// the bar above) growing under DID / IT / IN and "9 months" landing on the word.
// The picture is the joke: a full field over a handful, a long bar over a stub.
//
// Frameless over their dark curtain: every glyph, bar and mark carries a 0-offset halo as
// well as the offset shadow, never an outline. The accent appears twice and only there:
// the stub and its label. Two type sizes, nothing outside the box.

const SHADOW = "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 2.4);
const comma = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export type TwoScaleData = {
  top: { name: string; from: string; to: string; counterFrom?: number; counterTo: number; unit: string };
  bottom: {
    name: string; label: string; ratio: number; // ratio = short bar / long bar (9/240)
    counterTo?: number; unit?: string; // the small team, one dot each (40 engineers)
  };
};

// the real mark with its name under it: nothing behind it, ever
const Mark: React.FC<{
  src?: string; name: string; left: number; top: number; bw: number; bh: number;
  fs: number; gap: number; op: number; sc: number; halo: string; tsh: string;
}> = ({ src, name, left, top, bw, bh, fs, gap, op, sc, halo, tsh }) => (
  <div
    style={{
      position: "absolute", left, top, width: bw, opacity: op,
      transform: `scale(${sc})`, transformOrigin: "50% 40%",
    }}
  >
    <div style={{ height: bh, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {src ? (
        <Img src={staticFile(src)} style={{ maxWidth: bw, maxHeight: bh, objectFit: "contain", filter: halo }} />
      ) : null}
    </div>
    <div style={{ ...label(fs, INK), marginTop: gap, textAlign: "center", lineHeight: 1, textShadow: tsh }}>
      {name}
    </div>
  </div>
);

export const TwoScale: React.FC<CardProps & { data: TwoScaleData }> = ({
  tMs, w, h, fps, fromMs, beats, assets, data,
}) => {
  const P = 0.030 * w;
  const colW = 0.162 * w;
  const markW = 0.140 * w;
  const markH = 0.115 * w;
  const barX = P + colW + 0.024 * w;
  const barW = w - barX - P;
  const barH = 0.056 * h;
  const smallFs = 0.030 * w;
  const bigFs = 0.046 * w;
  const nameGap = 0.014 * h;

  const yearsTop = 0.078 * h;
  const barY = 0.148 * h;
  const fieldY = 0.235 * h;
  const counterTop = 0.445 * h;
  const markBlockH = markH + nameGap + smallFs;
  const row1MarkTop = (yearsTop + counterTop + bigFs) / 2 - markBlockH / 2;

  // row 2, the same grammar: axis where the bar was, dots under it, the counter under those
  const yAxis = 0.640 * h;
  const field2Y = 0.715 * h;
  const counter2Top = 0.790 * h;
  const row2Cy = (yAxis - barH / 2 + counter2Top + bigFs) / 2;
  const row2MarkTop = row2Cy - markBlockH / 2;

  const halo = `drop-shadow(0px 0px ${0.012 * w}px rgba(0,0,0,0.92)) drop-shadow(0px 3px 12px rgba(0,0,0,0.8))`;
  const tsh = `0px 0px ${0.013 * w}px rgba(0,0,0,0.94), ${SHADOW}`;
  const boxSh = `0px 0px ${0.012 * w}px rgba(0,0,0,0.92), 0px 8px 26px rgba(0,0,0,0.6)`;

  const bTop = beats.top ?? fromMs;
  const bCount = beats.countEnd ?? bTop + 567;
  const bMark = beats.bottomMark ?? bTop + 634;
  const bStart = beats.barStart ?? bMark + 593;
  const bEnd = beats.barEnd ?? bStart + 300;
  const bLand = beats.land ?? bEnd + 300;

  const ramp = (a: number, b: number) =>
    interpolate(tMs, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sp = (ms: number) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: 15, stiffness: 320, mass: 0.6 } });

  // the long bar is measured out left to right, then 2026 lands at its end
  const draw = easeOut(ramp(bTop, bTop + 267));
  const toYear = ramp(bTop + 230, bTop + 340);

  // the counter and the dot field are the same quantity, read two ways
  const from = data.top.counterFrom ?? 0;
  const val = from + (data.top.counterTo - from) * easeOut(ramp(bTop, bCount));
  const dot = 0.0043 * w;
  const cell = 0.0102 * w;
  const rows = 9;
  const cols = Math.max(1, Math.floor(barW / cell));
  const front = (val / data.top.counterTo) * cols;

  // the same span again, empty, with the nine months drawn on it
  const axis = sp(bMark);
  const nub = barW * data.bottom.ratio * easeOut(ramp(bStart, bEnd));
  const landed = sp(bLand);
  const aw = 0.0045 * w;
  // the label pushes the empty span apart when it lands, so no rule crosses a glyph
  const labX = barW * data.bottom.ratio + 0.022 * w;
  const labW = data.bottom.label.length * 0.62 * bigFs;
  const labGap = 0.016 * w;
  const cuts: [number, number][] = landed > 0
    ? [[0, Math.max(0, labX - labGap)], [Math.min(barW, labX + labW + labGap), barW]]
    : [[0, barW]];

  // the small team: one dot per engineer, rolled with its counter on OPENAI
  const team = data.bottom.counterTo ?? 0;
  const val2 = team * easeOut(ramp(bMark, bStart));
  const front2 = team > 0 ? (val2 / team) * team : 0;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {/* row 1: twenty years of Nvidia */}
      <Mark
        src={assets[0]} name={data.top.name} left={P} top={row1MarkTop} bw={markW} bh={markH}
        fs={smallFs} gap={nameGap} op={1} sc={1} halo={halo} tsh={tsh}
      />
      <div style={{
        position: "absolute", left: barX, top: yearsTop, fontFamily: MONO_FONT, fontSize: smallFs,
        color: INK, lineHeight: 1, textShadow: tsh, fontVariantNumeric: "tabular-nums",
      }}>{data.top.from}</div>
      <div style={{
        position: "absolute", left: barX, top: yearsTop, width: barW, textAlign: "right",
        fontFamily: MONO_FONT, fontSize: smallFs, color: INK, lineHeight: 1, textShadow: tsh,
        fontVariantNumeric: "tabular-nums", opacity: toYear,
      }}>{data.top.to}</div>
      <div style={{
        position: "absolute", left: barX, top: barY, width: barW * draw, height: barH,
        backgroundColor: INK, boxShadow: boxSh,
      }} />

      {/* the dots ARE the engineers: a wave front under the bar, in step with the counter */}
      <svg
        width={barW} height={rows * cell}
        style={{ position: "absolute", left: barX, top: fieldY, overflow: "visible", filter: halo }}
      >
        <title>thousands of engineers</title>
        {Array.from({ length: cols }).map((_, c) => {
          const o = clamp01(front - c);
          if (o <= 0) return null;
          return (
            <g key={c} opacity={o}>
              {Array.from({ length: rows }).map((_, r) => (
                <rect key={r} x={c * cell} y={r * cell} width={dot} height={dot} fill={INK} />
              ))}
            </g>
          );
        })}
      </svg>
      <div style={{
        position: "absolute", left: barX, top: counterTop, fontFamily: MONO_FONT, fontSize: bigFs,
        color: INK, lineHeight: 1, textShadow: tsh, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
      }}>{`${comma(val)} ${data.top.unit}`}</div>

      {/* row 2: the same scale, nine months of it, and the team that did it */}
      <Mark
        src={assets[1]} name={data.bottom.name} left={P} top={row2MarkTop} bw={markW} bh={markH}
        fs={smallFs} gap={nameGap} op={clamp01(axis * 3)} sc={0.9 + 0.1 * Math.min(1, axis)}
        halo={halo} tsh={tsh}
      />
      {axis > 0 && (
        <svg
          width={barW} height={barH} style={{ position: "absolute", left: barX, top: yAxis - barH / 2, overflow: "visible", filter: halo }}
          opacity={clamp01(axis * 3)}
        >
          <title>the same twenty years, empty</title>
          {cuts.map(([a, b]) => (
            <line key={a} x1={a} y1={barH / 2} x2={b} y2={barH / 2} stroke={BAR_GREY} strokeWidth={aw} />
          ))}
          <rect x={barW - aw} y={0} width={aw} height={barH} fill={BAR_GREY} />
        </svg>
      )}
      {nub > 0 && (
        <div style={{
          position: "absolute", left: barX, top: yAxis - barH / 2, width: nub, height: barH,
          backgroundColor: ACCENT, boxShadow: boxSh,
        }} />
      )}
      {landed > 0 && (
        <div style={{
          position: "absolute", left: barX + labX,
          top: yAxis - bigFs * 0.56, fontFamily: MONO_FONT, fontSize: bigFs, color: ACCENT,
          lineHeight: 1, textShadow: tsh, whiteSpace: "nowrap",
          opacity: clamp01(landed * 3), transform: `scale(${0.86 + 0.14 * Math.min(1, landed)})`,
          transformOrigin: "0% 50%",
        }}>{data.bottom.label}</div>
      )}

      {/* one dot per engineer, the same dot as above, one row of them */}
      {team > 0 && axis > 0 && (
        <>
          <svg
            width={barW} height={cell}
            style={{ position: "absolute", left: barX, top: field2Y, overflow: "visible", filter: halo }}
          >
            <title>the team, one dot each</title>
            {Array.from({ length: team }).map((_, c) => {
              const o = clamp01(front2 - c);
              if (o <= 0) return null;
              return <rect key={c} x={c * cell} y={0} width={dot} height={dot} fill={INK} opacity={o} />;
            })}
          </svg>
          <div style={{
            position: "absolute", left: barX, top: counter2Top, fontFamily: MONO_FONT, fontSize: bigFs,
            color: INK, lineHeight: 1, textShadow: tsh, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
            opacity: clamp01(axis * 3),
          }}>{`${comma(val2)} ${data.bottom.unit ?? ""}`}</div>
        </>
      )}
    </div>
  );
};
