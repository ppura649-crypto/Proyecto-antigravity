import React from "react";
import { Img, interpolate, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, LABEL_FONT } from "./theme";
import { REELS, STRIP_FROM, STRIP_TO } from "./YearStripData";

// V6 "about a year ago we started spending hundreds of hours building content systems."
// The year drawn as the timeline of an editor: one track running from their first reel
// (2025-06-22) to today, a playhead that runs it once, and their 40 REAL reels landing on
// the track at their real dates as 9:16 clips. Nothing happens for eleven months, then
// the clips pile into a wall: the hours are the wall, so no number has to be invented.
// The only words are their (the label and the title). No count, no play figure, no hours.
export type YearStripData = {
  label: string;     // rides above the playhead: HUNDREDS OF HOURS
  title: string;     // lands top-left on "building": BUILDING CONTENT SYSTEMS
  today: string;     // the right end of the track: TODAY
  index?: string;    // provenance of the entries copied into YearStripData.ts
  assetBase?: string; // override; by default the folder of data.assets[0]
};

const INK = "#1F1E1D";
const MUTED = "#73726C";
const HAIR = "#E8E5DD";
const TRACK = "#F1EFE9";
const PASSED = "#DCD6C6";
const TICK = "#D6D2C6";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAY = 86400000;
const day = (s: string): number => {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / DAY;
};
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const D0 = day(STRIP_FROM);
const D1 = day(STRIP_TO);
const SPAN_DAYS = D1 - D0;

// the first of every month inside the strip, for the ticks
const TICKS: { d: number; m: number; y: number }[] = (() => {
  const out: { d: number; m: number; y: number }[] = [];
  let y = 2025;
  let m = 7; // the strip opens inside JUN 2025, so the first tick is JUL
  for (let i = 0; i < 24; i++) {
    const d = Date.UTC(y, m - 1, 1) / DAY;
    if (d > D1) break;
    if (d > D0) out.push({ d, m, y });
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
})();

export const YearStrip: React.FC<CardProps & { data: YearStripData }> = ({
  tMs, w, h, fps, assets, beats, data,
}) => {
  const base = data.assetBase ?? (assets[0] ? assets[0].replace(/[^/]+$/, "") : "");

  // the track
  const AX = Math.round(0.051 * w);          // inset of the track's two ends
  const SPAN = w - 2 * AX;
  const trackTop = Math.round(0.800 * h);    // 430 on a 538 card
  const trackH = Math.round(0.052 * h);      // 28
  const xOf = (d: number) => AX + ((d - D0) / SPAN_DAYS) * SPAN;

  // the clips
  const TW = Math.round(0.055 * w);          // 56
  const TH = Math.round((TW * 16) / 9);   // a 9:16 clip, 56 x 100
  const PITCH = Math.round(0.045 * h);       // 24 px of shingle per row
  const ROWS = 9;
  const MINGAP = Math.round(TW * 0.46);      // a row is free again 26 px later: every clip keeps a readable slice

  // type
  const fsTitle = Math.round(0.037 * w);     // 38
  const fsLabel = Math.round(0.030 * w);     // 30
  const fsAxis = Math.round(0.026 * w);      // 26

  // the strip unrolls backwards, from now to a year ago, then the playhead lands on the far end
  const rev = interpolate(tMs, [beats.year, beats.year + 400], [0, 1], clamp);
  const headIn = spring({
    frame: Math.max(0, ((tMs - (beats.year + 400)) / 1000) * fps),
    fps, config: { damping: 15, stiffness: 340, mass: 0.6 },
  });

  // ONE continuous movement at a rate fixed by their words: the playhead leaves on
  // "spending" and reads TODAY on "systems", so the rate is px per ms, never mapped
  // over the card's life.
  const RUN_FROM = beats.spending;
  const RUN_TO = beats.systems;
  const RATE = SPAN / Math.max(1, RUN_TO - RUN_FROM);
  const headX = tMs < RUN_FROM ? AX : Math.min(AX + SPAN, AX + RATE * (tMs - RUN_FROM));
  const arrived = tMs >= RUN_TO;

  // every clip drops when the playhead reaches its date; the first one drops on "started"
  const placed = React.useMemo(() => {
    const lastX = new Array(ROWS).fill(-1e9);
    return REELS.map((r, i) => {
      // a clip never hangs off the card: the ends of the run keep the whole tile inside
      const x = Math.min(w - TW / 2 - 4, Math.max(TW / 2 + 4, xOf(day(r.date))));
      let row = lastX.findIndex((lx) => x - lx >= MINGAP);
      if (row < 0) {
        row = lastX.indexOf(Math.min(...lastX));
      }
      lastX[row] = x;
      const at = i === 0 ? beats.started : RUN_FROM + (x - AX) / RATE;
      return { r, x, row, at };
    });
  }, [w, h, beats.started, RUN_FROM, RATE]);

  const titleF = ((tMs - beats.building) / 1000) * fps;
  const titleSp = spring({ frame: Math.max(0, titleF), fps, config: { damping: 15, stiffness: 330, mass: 0.7 } });
  const todaySp = spring({
    frame: Math.max(0, ((tMs - RUN_TO) / 1000) * fps),
    fps, config: { damping: 13, stiffness: 340, mass: 0.6 },
  });

  const labelOn = tMs >= RUN_FROM;
  const labelW = Math.round(0.40 * w);
  const labelX = Math.min(w - AX - labelW / 2, Math.max(AX + labelW / 2, headX)) - labelW / 2;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* the track, its ticks and its two dates: drawn right to left on "year" */}
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0px 0px 0px ${(1 - rev) * 100}%)` }}>
        <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
          <title>fifteen months on one track, from his first reel to today</title>
          <rect x={AX} y={trackTop} width={SPAN} height={trackH} fill={TRACK} />
          <rect x={AX} y={trackTop} width={Math.max(0, headX - AX)} height={trackH} fill={PASSED} />
          <rect x={AX} y={trackTop} width={SPAN} height={trackH} fill="none" stroke="#DFDBD0" strokeWidth={2} />
          {TICKS.map((t) => (
            <line
              key={`${t.y}-${t.m}`}
              x1={xOf(t.d)} y1={trackTop + trackH} x2={xOf(t.d)} y2={trackTop + trackH + (t.m === 1 ? 18 : 11)}
              stroke={t.m === 1 ? MUTED : TICK} strokeWidth={t.m === 1 ? 3 : 2}
            />
          ))}
        </svg>
        <div style={{ position: "absolute", left: AX, top: trackTop + trackH + 26, fontFamily: LABEL_FONT, fontSize: fsAxis, letterSpacing: "0.09em", color: MUTED }}>
          {MONTHS[5]} 2025
        </div>
        {TICKS.filter((t) => t.m === 1).map((t) => (
          <div
            key={`y${t.y}`}
            style={{
              position: "absolute", left: xOf(t.d), top: trackTop + trackH + 26, transform: "translateX(-50%)",
              fontFamily: LABEL_FONT, fontSize: fsAxis, letterSpacing: "0.09em", color: MUTED, whiteSpace: "nowrap",
            }}
          >
            {MONTHS[0]} {t.y}
          </div>
        ))}
      </div>

      {/* their reels, at their real dates, most recent on top */}
      {placed.map(({ r, x, row, at }) => {
        const f = ((tMs - at) / 1000) * fps;
        if (f < 0) return null;
        const sp = spring({ frame: f, fps, config: { damping: 15, stiffness: 300, mass: 0.7 } });
        const drop = (1 - sp) * Math.round(0.085 * h);
        const top = trackTop - TH - row * PITCH + drop;
        return (
          <Img
            key={r.code}
            src={staticFile(base + r.thumb)}
            style={{
              position: "absolute", left: x - TW / 2, top, width: TW, height: TH,
              objectFit: "cover", display: "block", opacity: Math.min(1, f / 2),
              boxShadow: "0 0 0 3px #ffffff, 0 6px 14px rgba(31,30,29,0.16)",
            }}
          />
        );
      })}

      {/* the playhead */}
      {rev >= 1 && (
        <div style={{ position: "absolute", left: headX, top: 0, opacity: Math.min(1, headIn * 2) }}>
          <div style={{
            position: "absolute", left: -2, top: Math.round(0.225 * h), width: 4,
            height: trackTop + trackH + 16 - Math.round(0.225 * h), background: INK,
            transform: `scaleY(${0.6 + 0.4 * headIn})`, transformOrigin: "top center",
          }} />
          <div style={{
            position: "absolute", left: -11, top: Math.round(0.225 * h) - 13, width: 22, height: 14,
            background: INK, clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
          }} />
        </div>
      )}

      {/* their words: the label rides the playhead, the title lands top-left */}
      {labelOn && (
        <div style={{
          position: "absolute", left: labelX, top: Math.round(0.135 * h), width: labelW, textAlign: "center",
          fontFamily: LABEL_FONT, fontWeight: 700, fontSize: fsLabel, letterSpacing: "0.09em",
          color: ACCENT, textTransform: "uppercase", whiteSpace: "nowrap",
        }}>
          {data.label}
        </div>
      )}
      {titleF >= 0 && (
        <div style={{
          position: "absolute", left: AX, top: Math.round(0.040 * h),
          fontFamily: LABEL_FONT, fontWeight: 700, fontSize: fsTitle, letterSpacing: "0.08em",
          color: INK, textTransform: "uppercase", opacity: Math.min(1, titleF / 2),
          transform: `translateY(${(1 - titleSp) * 14}px)`,
        }}>
          {data.title}
        </div>
      )}
      {arrived && (
        <div style={{
          position: "absolute", right: AX, top: trackTop + trackH + 26,
          fontFamily: LABEL_FONT, fontWeight: 700, fontSize: fsAxis, letterSpacing: "0.09em",
          color: ACCENT, textTransform: "uppercase",
          opacity: Math.min(1, todaySp * 2), transform: `scale(${0.86 + 0.14 * todaySp})`, transformOrigin: "right center",
        }}>
          {data.today}
        </div>
      )}
    </div>
  );
};
