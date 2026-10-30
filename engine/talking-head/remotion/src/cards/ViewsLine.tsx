import React from "react";
import { spring } from "remotion";
import type { CardProps } from "./props";
import { BoxGlyph } from "./Box";
import { ACCENT, LABEL_FONT, MONO_FONT } from "./theme";

// V10 `viewsline` (reference edit G, the guest): "this system I'm talking about has gotten us tens of
// millions of views in the past year." The callback: the sealed box from V5 is set down
// in the corner of a notebook chart with its lid ON the origin, and the line lifts
// straight out of that lid and climbs the past twelve months at a steady rate with a
// counter riding its tip. The counter passes 10M on "tens", the y axis lights on
// "views", the x axis end reads TODAY on "past", and the counter hands over to TENS OF
// MILLIONS on "year." so the held picture carries only the words the creator said: no source
// line, no final figure.
export type ViewsLineData = {
  axis?: string; ticks?: string[]; label?: string; today?: string; boxLabel?: string;
};

const INK = "#1F1E1D";
const MUTED = "#73726C";
const HAIR = "#E8E5DD";
const LINE = "#2B2A27";
const DRAW_MS = 500;    // the axes draw
const LINE_MS = 1900;   // the climb, left to right, as a RATE
const VMAX = 28;        // where the tip lands, in millions: high right, under the 30M tick

const p01 = (t: number): number => Math.min(1, Math.max(0, t));
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
const LBL = { fontFamily: LABEL_FONT } as React.CSSProperties;
const LBL_ACC = { fontFamily: LABEL_FONT, fill: ACCENT } as React.CSSProperties;

// the counter, one glyph per fixed slot so the digits never jitter as they roll
const Odo: React.FC<{ text: string; cx: number; base: number; fs: number; op: number }> = ({ text, cx, base, fs, op }) => {
  const cw = fs * 0.62;
  const wide = (c: string): number => (c === "." ? cw * 0.52 : cw);
  const total = [...text].reduce((a, c) => a + wide(c), 0);
  let x = cx - total / 2;
  return (
    <g opacity={op}>
      {[...text].map((c, i) => {
        const q = wide(c);
        const at = x + q / 2;
        x += q;
        return (
          <text key={i} x={at} y={base} textAnchor="middle" fontSize={fs} fontFamily={MONO_FONT} fontWeight={700} fill={INK}>{c}</text>
        );
      })}
    </g>
  );
};

export const ViewsLine: React.FC<CardProps & { data: ViewsLineData }> = ({
  tMs, w, h, fps, fromMs, beats, data,
}) => {
  const X = (v: number): number => (v * w) / 994;
  const Y = (v: number): number => (v * h) / 576;
  const S = (v: number): number => (v * w) / 994;

  const tickTxt = data.ticks ?? ["0", "10M", "20M", "30M"];
  const tickVal = tickTxt.map((t) => parseFloat(t) || 0);
  const ymax = Math.max(...tickVal, VMAX) * 1.07;

  const bDraw = Math.max(beats.this ?? fromMs, fromMs);
  const bGot = beats.gotten ?? bDraw + 1170;
  const bTens = beats.tens ?? bGot + 420;
  const bViews = beats.views ?? bGot + 1380;
  const bPast = beats.past ?? bGot + 1830;
  const bYear = beats.year ?? bGot + 1980;

  const axL = X(176), axR = X(950), axB = Y(424), axT = Y(120);
  const boxW = X(150), boxH = Y(100);
  const fsTick = S(27), fsAxis = S(30), fsEnd = S(28), fsBox = S(26), fsCount = S(40), fsLand = S(34);
  const yOf = (v: number): number => axB - (v / ymax) * (axB - axT);

  // the climb: a rate in px per second, and a curve tuned so the tip reads 10M on "tens"
  const uTens = Math.min(0.85, Math.max(0.06, (bTens - bGot) / LINE_MS));
  const pw = Math.log(10 / VMAX) / Math.log(uTens);
  const vOf = (u: number): number => VMAX * Math.pow(u, pw) + 0.42 * Math.sin(u * 13.7) * u;
  const rate = (axR - axL) / LINE_MS;
  const uNow = p01(((tMs - bGot) * rate) / (axR - axL));
  const tipX = axL + uNow * (axR - axL);
  const tipY = yOf(vOf(uNow));

  const drawn = easeOut(p01((tMs - bDraw) / DRAW_MS));
  const pts: string[] = [];
  const steps = 96;
  for (let i = 0; i <= steps; i++) {
    const u = (uNow * i) / steps;
    pts.push(`${(axL + u * (axR - axL)).toFixed(2)},${yOf(vOf(u)).toFixed(2)}`);
  }

  const spr = (at: number, damp = 14): number => spring({
    frame: Math.max(0, ((tMs - at) / 1000) * fps), fps, config: { damping: damp, stiffness: 330, mass: 0.7 },
  });
  const views = tMs >= bViews ? spr(bViews, 13) : 0;
  const today = tMs >= bPast ? spr(bPast) : 0;
  const land = tMs >= bYear ? spr(bYear, 12) : 0;
  const countOp = uNow > 0 ? 1 - p01((tMs - bYear) / 150) : 0;
  const countCx = Math.min(Math.max(tipX, axL + S(110)), axR - S(70));
  const countTxt = `${vOf(uNow).toFixed(1)}M`;
  const boxCx = axL + boxW / 2;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {/* the notebook grid and the two thin dark spines, drawn on "this system" */}
        {tickVal.slice(1).map((v, i) => (
          <line key={`g${i}`} x1={axL} y1={yOf(v)} x2={axL + (axR - axL) * drawn} y2={yOf(v)}
            stroke={HAIR} strokeWidth={1.2} strokeDasharray="5 6" />
        ))}
        <line x1={axL} y1={axB} x2={axL} y2={axB - (axB - axT) * drawn} stroke={INK} strokeWidth={1.8} />
        <line x1={axL} y1={axB} x2={axL + (axR - axL) * drawn} y2={axB} stroke={INK} strokeWidth={1.8} />
        {tickVal.map((v, i) => (
          <g key={`t${i}`} opacity={p01((drawn - 0.3) / 0.5)}>
            <line x1={axL - S(8)} y1={yOf(v)} x2={axL} y2={yOf(v)} stroke={INK} strokeWidth={1.5} />
            <text x={axL - S(15)} y={yOf(v) + fsTick * 0.36} textAnchor="end" fontSize={fsTick} fontFamily={MONO_FONT} fill={MUTED}>{tickTxt[i]}</text>
          </g>
        ))}
        {Array.from({ length: 13 }, (_, i) => {
          const x = axL + ((axR - axL) * i) / 12;
          return x <= axL + (axR - axL) * drawn
            ? <line key={`x${i}`} x1={x} y1={axB} x2={x} y2={axB + S(8)} stroke={i === 12 ? INK : HAIR} strokeWidth={i === 12 ? 1.6 : 1.2} />
            : null;
        })}
        {/* y axis name, lit on "views" */}
        <text x={X(52)} y={(axT + axB) / 2} transform={`rotate(-90 ${X(52)} ${(axT + axB) / 2})`} textAnchor="middle"
          fontSize={fsAxis} fontWeight={700} letterSpacing={S(2.6)} opacity={p01((drawn - 0.3) / 0.5)}
          {...(views > 0 ? { style: LBL_ACC } : { style: LBL, fill: INK })}>{data.axis ?? "VIEWS"}</text>
        {/* x axis end, on "in the past" */}
        {today > 0 && (
          <text x={axR} y={axB + S(38)} textAnchor="end" fontSize={fsEnd} fontWeight={700} letterSpacing={S(2)}
            fill={INK} style={LBL} opacity={Math.min(1, today * 2.2)}
            transform={`translate(0 ${(1 - today) * -S(8)})`}>{data.today ?? "TODAY"}</text>
        )}
        {/* one series, lifting out of the lid and climbing */}
        {uNow > 0 && (
          <polyline points={pts.join(" ")} fill="none" stroke={LINE} strokeWidth={S(5)} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {uNow > 0 && <circle cx={tipX} cy={tipY} r={S(8)} style={{ fill: ACCENT }} />}
        {countOp > 0 && <Odo text={countTxt} cx={countCx} base={tipY - S(26)} fs={fsCount} op={countOp} />}
        {/* the payload: their words, at the tip */}
        {land > 0 && (
          <g opacity={Math.min(1, land * 2.4)}>
            <path d={`M ${axR - S(46)} ${Y(112)} L ${tipX - S(6)} ${tipY - S(16)}`} stroke={ACCENT} strokeWidth={1.5} fill="none" />
            <text x={axR} y={Y(100) - (1 - land) * S(12)} textAnchor="end" fontSize={fsLand} fontWeight={700}
              letterSpacing={S(2.4)} style={LBL_ACC}>{data.label ?? "TENS OF MILLIONS"}</text>
          </g>
        )}
        {/* the box's name, under it */}
        <g opacity={p01((drawn - 0.4) / 0.5)}>
          <text x={boxCx} y={Y(556)} textAnchor="middle" fontSize={fsBox} fontWeight={700} letterSpacing={S(2)}
            fill={INK} style={LBL}>{data.boxLabel ?? "AI EDITOR SYSTEM"}</text>
        </g>
      </svg>

      {/* the sealed box from V5, set in the corner with its lid on the origin */}
      <div style={{
        position: "absolute", left: axL, top: axB, width: boxW, height: boxH,
        ["--ink" as string]: INK, ["--muted" as string]: MUTED, ["--bar-grey" as string]: "#B9B5AA",
      } as React.CSSProperties}>
        <BoxGlyph w={boxW} h={boxH} open={0} tilt={0} />
      </div>
    </div>
  );
};
