import React from "react";
import { interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, LABEL_FONT, MONO_FONT } from "./theme";

// V6 `calendar` (reference edit G, the guest): "about a year ago we started spending hundreds of
// hours building content systems." The thing that measures a year IS a wall calendar,
// so the chart of their number is drawn under one: a ring-bound stack of month pages on
// top, an HOURS axis under it with a bar slot per month. The pages rip backwards a year
// on "year", a STARTED flag pins the page, then they tear forward at a steady rate and
// every torn page leaves its hours behind. The bars carry the RUNNING total (that is
// what the 0/100/200/300 ticks measure) so the staircase climbs into the hundreds while
// the corner counter rolls with it. Their words are the source: no source line, and no
// figure on the card the creator did not say.
export type CalendarData = {
  flag?: string; title?: string; axis?: string; ticks?: number[]; today?: string;
  months?: string[]; values?: number[];
};

const INK = "#1F1E1D";
const MUTED = "#73726C";
const HAIR = "#E8E5DD";
const BAR = "#2B2A27";
const REWIND_MS = 500;    // 12 pages of rewind
const FLIP_MS = 190;      // one page's flight, rewind and tear alike
const SETTLE_MS = 320;    // the newest bar cooling from accent to ink

const p01 = (t: number): number => Math.min(1, Math.max(0, t));
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const LBL = { fontFamily: LABEL_FONT } as React.CSSProperties;
const LBL_ACC = { fontFamily: LABEL_FONT, fill: ACCENT } as React.CSSProperties;

// a month page: white sheet, the month set big, a faint date grid
const Page: React.FC<{
  W: number; H: number; text: string; fs: number; dim: number;
}> = ({ W, H, text, fs, dim }) => (
  <div style={{
    position: "absolute", left: 0, top: 0, width: W, height: H, background: "#FFFFFF",
    border: `${Math.max(1.4, 0.007 * W)}px solid ${INK}`, boxSizing: "border-box",
  }}>
    <div style={{
      position: "absolute", left: 0, right: 0, top: H * 0.28, textAlign: "center",
      fontFamily: LABEL_FONT, fontWeight: 700, fontSize: fs, letterSpacing: "0.08em",
      color: INK, opacity: dim, lineHeight: 1,
    }}>{text}</div>
    <div style={{
      position: "absolute", left: W * 0.13, right: W * 0.13, top: H * 0.58,
      display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: W * 0.026,
    }}>
      {Array.from({ length: 28 }, (_, i) => (
        <div key={i} style={{ height: W * 0.022, background: HAIR }} />
      ))}
    </div>
  </div>
);

export const Calendar: React.FC<CardProps & { data: CalendarData }> = ({
  tMs, w, h, fps, fromMs, beats, data,
}) => {
  const X = (v: number): number => (v * w) / 994;
  const Y = (v: number): number => (v * h) / 576;
  const S = (v: number): number => (v * w) / 994;

  const months = data.months ?? ["SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG"];
  const values = data.values ?? [45, 44, 42, 33, 28, 24, 31, 22, 18, 26, 16, 15];
  const ticks = data.ticks ?? [0, 100, 200, 300];
  const today = data.today ?? "TODAY";
  const n = months.length;
  const cum = values.map((_, i) => values.slice(0, i + 1).reduce((a, v) => a + v, 0));
  const ymax = Math.max(cum[n - 1], ticks[ticks.length - 1]) * 1.1;

  const bYear = beats.year ?? fromMs;
  const bStart = beats.started ?? bYear + 630;
  const bSpend = beats.spending ?? bStart + 150;
  const bHours = beats.hours ?? bSpend + 1170;
  const bBuild = beats.building ?? bSpend + 1710;
  const bContent = beats.content ?? bSpend + 2010;
  const bEnd = beats.systems ?? bSpend + 2730;
  // the RATE: one page per ~230 ms, taken from the words so the last bar lands on
  // "systems." and never from the card's duration
  const TEAR = Math.min(245, Math.max(205, (bEnd - bSpend) / n));
  // when the running total actually crosses the first hundred: the counter goes hot there
  let crossI = cum.findIndex((c) => c >= 100);
  if (crossI < 0) crossI = n - 1;
  const crossMs = bSpend + crossI * TEAR + FLIP_MS * ((100 - (crossI > 0 ? cum[crossI - 1] : 0)) / values[crossI]);

  // ---- the chart -------------------------------------------------------------
  const plotL = X(128), plotR = X(968), plotT = Y(322), plotB = Y(520);
  const pitch = (plotR - plotL) / n;
  const barW = pitch * 0.56;
  const yOf = (v: number): number => plotB - (v / ymax) * (plotB - plotT);
  const fsTick = S(27), fsMonth = S(26), fsAxis = S(28), fsTitle = S(26);

  const f = (tMs - bSpend) / TEAR;              // pages torn so far, as a float
  const cur = tMs < bSpend ? -1 : Math.min(n - 1, Math.floor(f));   // the month being spent
  const grow = values.map((_, i) => p01((tMs - (bSpend + i * TEAR)) / FLIP_MS));
  const total = Math.round(values.reduce((a, v, i) => a + v * grow[i], 0));

  // ---- the calendar ----------------------------------------------------------
  const calX = X(376), calY = Y(92), calW = X(242), calH = Y(196);
  const fsPage = S(58), fsToday = S(46);
  const rewinding = tMs < bYear + REWIND_MS + FLIP_MS;
  const restIdx = Math.max(0, Math.min(n, Math.floor(f) + 1));
  const restText = tMs < bSpend ? months[0] : restIdx >= n ? today : months[restIdx];

  // pages in flight: the rewind riffle (they flip up and away) and the forward tear
  const flying: React.ReactNode[] = [];
  if (rewinding) {
    for (let i = 0; i < n; i++) {
      const q = p01((tMs - (bYear + (i * REWIND_MS) / n)) / FLIP_MS);
      if (q <= 0 || q >= 1) continue;
      const e = easeOut(q);
      flying.push(
        <div key={`r${i}`} style={{
          position: "absolute", left: 0, top: 0, width: calW, height: calH, transformOrigin: "50% 0%",
          transform: `rotateX(${-108 * e}deg) translateY(${-S(5) * e}px)`, opacity: 1 - e * e,
        }}>
          <Page W={calW} H={calH} text={months[(n - i) % n]} fs={fsPage} dim={1} />
        </div>,
      );
    }
  }
  if (f > 0 && f < n) {
    const i = Math.floor(f);
    const q = p01((tMs - (bSpend + i * TEAR)) / FLIP_MS);
    if (q < 1) {
      const e = easeOut(q);
      const dir = i % 2 === 0 ? 1 : -1;
      flying.push(
        <div key="t" style={{
          position: "absolute", left: 0, top: 0, width: calW, height: calH, transformOrigin: "50% 0%",
          transform: `translate(${dir * S(70) * e}px, ${S(104) * e}px) rotate(${dir * 17 * e}deg)`, opacity: 1 - e * e,
        }}>
          <Page W={calW} H={calH} text={months[i]} fs={fsPage} dim={1} />
        </div>,
      );
    }
  }

  // ---- the payload counter, in fixed digit slots so nothing jitters ----------
  const digits = String(total);
  const cw = S(82) * 0.62;
  const counterRight = X(960) - S(58);
  const hot = tMs >= crossMs;
  const hotPop = spring({ frame: Math.max(0, ((tMs - crossMs) / 1000) * fps), fps, config: { damping: 12, stiffness: 340, mass: 0.6 } });
  const unit = spring({ frame: Math.max(0, ((tMs - bHours) / 1000) * fps), fps, config: { damping: 14, stiffness: 330, mass: 0.7 } });
  const title = spring({ frame: Math.max(0, ((tMs - bContent) / 1000) * fps), fps, config: { damping: 15, stiffness: 330, mass: 0.7 } });
  const pin = spring({ frame: Math.max(0, ((tMs - bStart) / 1000) * fps), fps, config: { damping: 13, stiffness: 340, mass: 0.6 } });
  const tap = interpolate(tMs, [bBuild, bBuild + 110, bBuild + 220, bBuild + 330, bBuild + 440], [0, 1, 0, 1, 0], CLAMP);
  const hammer = p01((tMs - bBuild) / 120) * (1 - p01((tMs - (bBuild + 560)) / 180));

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {title > 0 && (
          <text x={X(34)} y={Y(60) + (1 - title) * S(14)} fontSize={fsTitle} fontWeight={700} letterSpacing={S(2.3)}
            fill={INK} style={LBL} opacity={Math.min(1, title * 2.2)}>{data.title ?? "BUILDING CONTENT SYSTEMS"}</text>
        )}
        {tMs >= bSpend && (
          <g transform={`translate(0 ${hot ? (1 - Math.min(1, hotPop)) * S(9) : 0})`}>
            {[...digits].map((c, i) => (
              <text key={i} x={counterRight - (digits.length - i) * cw + cw / 2} y={Y(132)} textAnchor="middle"
                fontSize={S(82)} fontFamily={MONO_FONT} fontWeight={700}
                {...(hot ? { style: { fill: ACCENT } } : { fill: INK })}>{c}</text>
            ))}
            {unit > 0 && (
              <text x={X(960)} y={Y(132)} textAnchor="end" fontSize={S(42)} fontWeight={700} letterSpacing={S(2)}
                style={LBL_ACC} opacity={Math.min(1, unit * 2.2)}>H</text>
            )}
          </g>
        )}
        {ticks.slice(1).map((t) => (
          <line key={`g${t}`} x1={plotL} y1={yOf(t)} x2={plotR} y2={yOf(t)} stroke={HAIR} strokeWidth={1.2} strokeDasharray="5 6" />
        ))}
        {grow.map((g, i) => {
          if (g <= 0) return null;
          const from = i > 0 ? cum[i - 1] : 0;
          const top = yOf(from + (cum[i] - from) * g);
          const x = plotL + i * pitch + (pitch - barW) / 2;
          const acc = i === n - 1 ? 1 : p01(1 - (tMs - (bSpend + i * TEAR) - TEAR) / SETTLE_MS);
          return (
            <g key={`b${i}`}>
              <rect x={x} y={top} width={barW} height={plotB - top} fill={BAR} />
              {acc > 0 && <rect x={x} y={top} width={barW} height={plotB - top} style={{ fill: ACCENT }} opacity={acc} />}
            </g>
          );
        })}
        <line x1={plotL} y1={plotT} x2={plotL} y2={plotB} stroke={INK} strokeWidth={1.8} />
        <line x1={plotL} y1={plotB} x2={plotR} y2={plotB} stroke={INK} strokeWidth={1.8} />
        {ticks.map((t) => (
          <g key={`t${t}`}>
            <line x1={plotL - S(8)} y1={yOf(t)} x2={plotL} y2={yOf(t)} stroke={INK} strokeWidth={1.5} />
            <text x={plotL - S(15)} y={yOf(t) + fsTick * 0.36} textAnchor="end" fontSize={fsTick} fontFamily={MONO_FONT} fill={MUTED}>{t}</text>
          </g>
        ))}
        <text x={X(44)} y={(plotT + plotB) / 2} transform={`rotate(-90 ${X(44)} ${(plotT + plotB) / 2})`} textAnchor="middle"
          fontSize={fsAxis} fontWeight={700} letterSpacing={S(2.4)} fill={INK} style={LBL}>{data.axis ?? "HOURS"}</text>
        {months.map((m, i) => {
          const cx = plotL + i * pitch + pitch / 2;
          const live = i === cur;
          return (
            <g key={`m${i}`}>
              <line x1={cx} y1={plotB} x2={cx} y2={plotB + S(7)} stroke={HAIR} strokeWidth={1.2} />
              <text x={cx} y={Y(552)} textAnchor="middle" fontSize={fsMonth} fontWeight={700} letterSpacing={S(2)}
                fill={live || grow[i] > 0 ? INK : MUTED} opacity={live || grow[i] > 0 ? 1 : 0.45} style={LBL}>{m}</text>
              {live && <path d={`M ${cx - S(7)} ${plotB + S(13)} L ${cx + S(7)} ${plotB + S(13)} L ${cx} ${plotB + S(24)} Z`} fill={INK} />}
            </g>
          );
        })}
      </svg>

      {/* the wall calendar: a ring-bound stack, the front page and whatever is in flight */}
      <div style={{ position: "absolute", left: calX, top: calY, width: calW, height: calH, perspective: S(950) }}>
        <div style={{ position: "absolute", left: S(7), top: S(7), width: calW, height: calH, border: `1px solid ${HAIR}`, background: "#FFFFFF" }} />
        <div style={{ position: "absolute", left: S(4), top: S(4), width: calW, height: calH, border: `1px solid ${HAIR}`, background: "#FFFFFF" }} />
        <Page W={calW} H={calH} text={restText} fs={restText === today ? fsToday : fsPage} dim={rewinding ? 0.14 : 1} />
        {flying}
      </div>

      <svg width={w} height={h} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <line x1={calX + S(10)} y1={calY - S(12)} x2={calX + calW - S(10)} y2={calY - S(12)} stroke={MUTED} strokeWidth={2.4} />
        {Array.from({ length: 7 }, (_, i) => {
          const cx = calX + calW * (0.11 + 0.13 * i);
          return <ellipse key={i} cx={cx} cy={calY - S(4)} rx={S(7)} ry={S(14)} fill="none" stroke={INK} strokeWidth={2.2} />;
        })}
        {pin > 0 && (
          <g opacity={Math.min(1, pin * 2.2)} transform={`translate(0 ${(1 - pin) * -S(12)})`}>
            <path d={`M ${calX - S(98)} ${calY + S(34)} H ${calX + S(46)} V ${calY + S(76)} H ${calX - S(98)} L ${calX - S(78)} ${calY + S(55)} Z`}
              fill="#FFFFFF" stroke={INK} strokeWidth={1.8} />
            <text x={calX - S(24)} y={calY + S(63)} textAnchor="middle" fontSize={S(25)} fontWeight={700} letterSpacing={S(1.8)}
              fill={INK} style={LBL}>{data.flag ?? "STARTED"}</text>
            <circle cx={calX + S(46)} cy={calY + S(55)} r={S(6)} fill={INK} />
          </g>
        )}
        {hammer > 0 && (
          <g opacity={hammer} transform={`translate(${calX + calW - S(46)} ${calY + calH - S(52)}) rotate(${-32 + 32 * tap})`}>
            <rect x={-S(4)} y={0} width={S(9)} height={S(54)} rx={S(3)} fill={MUTED} />
            <path d={`M ${-S(28)} ${-S(21)} H ${S(15)} V ${-S(2)} H ${-S(28)} Z`} fill={INK} />
            <path d={`M ${S(15)} ${-S(21)} L ${S(31)} ${-S(12)} L ${S(15)} ${-S(2)} Z`} fill={INK} />
          </g>
        )}
      </svg>
    </div>
  );
};
