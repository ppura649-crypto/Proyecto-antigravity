import React from "react";
import { spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT } from "./theme";

// V1 (edit-g-b): "you PROBABLY ALREADY KNOW THAT you SHOULD BE POSTING CONTENT."
// A calendar app's week view with its own grammar: MON to FRI with their dates, hour rules
// at 9 / 10 / 11, tinted event blocks with a left bar. POST A VIDEO starts Monday 9:00 as a
// terracotta block with an unticked circle. On each of their four words a drawn cursor grabs
// it and drags it one column right (a dashed ghost stays in the column it left for the 170 ms
// of the drag), and the vacated day fills with the grey, ticked thing that actually got done.
// By "you" it is parked on Friday, still unticked; on "should" it flashes solid; on "posting"
// the cursor comes back and the app's own tooltip says MOVED 4 TIMES, which is exactly what
// the viewer just watched. Nothing on this card is invented: the moves are the picture.

const SANS = "-apple-system, 'Helvetica Neue', Inter, Arial, sans-serif";
const INK = "#1F1E1D";
const MUTED = "#73726C";
const RULE = "#E8E5DD";
const DONE_BG = "#EFEEEA";
const DONE_EDGE = "#C6C4BC";
const DONE_INK = "#87857C";
const DRAG_MS = 170;
const FLASH_MS = 300;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export type CalWeekData = {
  event: string;          // POST A VIDEO
  done: string[];         // the four things that did get done, in the order they fill
  tooltip: string;        // MOVED 4 TIMES
  days: string[];         // MON .. FRI
  dates?: string[];       // the week's real dates
};

// the macOS arrow, drawn so it reads on a white surface: dark fill, white edge
const Cursor: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <svg
    width={13 * s} height={21 * s} viewBox="0 0 13 21"
    style={{ position: "absolute", left: x, top: y, overflow: "visible" }}
  >
    <title>a pointer dragging the event</title>
    <path
      d="M 0.9 0.7 L 0.9 17.6 L 5.0 13.6 L 7.5 19.9 L 10.3 18.7 L 7.8 12.6 L 12.4 12.4 Z"
      fill={INK} stroke="#FFFFFF" strokeWidth={1.5} strokeLinejoin="round"
    />
  </svg>
);

const Tick: React.FC<{ d: number }> = ({ d }) => (
  <svg width={d} height={d} viewBox="0 0 26 26" style={{ display: "block" }}>
    <title>done</title>
    <circle cx={13} cy={13} r={12} fill={DONE_EDGE} />
    <path d="M 7 13.4 L 11.2 17.4 L 19 9.4" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CalWeek: React.FC<CardProps & { data: CalWeekData }> = ({
  tMs, w, h, fps, fromMs, beats, data,
}) => {
  const days = data.days ?? ["MON", "TUE", "WED", "THU", "FRI"];
  const dates = data.dates ?? ["14", "15", "16", "17", "18"];
  const done = data.done ?? [];

  const P = 0.020 * w;
  const gutter = 0.094 * w;
  const headH = 0.148 * h;
  const gridX = P + gutter;
  const gridY = P + headH;
  const gridW = w - 2 * P - gutter;
  const gridH = h - 2 * P - headH;
  const colW = gridW / 5;
  const rowH = gridH / 3;
  const bw = colW - 8;
  const bx0 = gridX + 4;
  const by0 = gridY + 3;

  // the four drags, on their four words
  const moves = [beats.probably, beats.already, beats.know, beats.that].map((m, i) =>
    m ?? fromMs + 400 + i * 320);
  let col = 0;
  let ghost = -1;
  for (let i = 0; i < moves.length; i++) {
    if (tMs < moves[i]) break;
    const p = clamp01((tMs - moves[i]) / DRAG_MS);
    col = i + easeIO(p);
    if (p < 1) ghost = i;
  }

  // the block flashes solid terracotta once, on "should"
  const flash = beats.should == null ? 0 : Math.sin(Math.PI * clamp01((tMs - beats.should) / FLASH_MS));
  const evTop = by0;
  const evH = 1.5 * rowH - 6;
  const evX = bx0 + col * colW;

  // the cursor holds the block, lets go on "you", comes back on "posting"
  const rel = beats.you == null ? 0 : clamp01((tMs - beats.you) / 220);
  const back = beats.posting == null ? 0 : clamp01((tMs - beats.posting) / 200);
  const held = { x: evX + 0.34 * bw, y: evTop + 0.30 * evH };
  const off = { x: evX + 0.54 * bw, y: evTop + evH + 0.16 * rowH };
  const hover = { x: evX + 0.46 * bw, y: evTop + 0.44 * evH };
  const away = easeIO(rel) * (1 - easeIO(back));
  const home = easeIO(back);
  const cur = {
    x: held.x + (off.x - held.x) * away + (hover.x - held.x) * home,
    y: held.y + (off.y - held.y) * away + (hover.y - held.y) * home,
  };

  const tip = beats.posting == null ? 0
    : spring({ frame: Math.max(0, ((tMs - (beats.posting + 220)) / 1000) * fps), fps, durationInFrames: 7 });

  const evBg = `rgba(224,120,80,${0.11 + 0.89 * flash})`;
  const evInk = flash > 0.5 ? "#FFFFFF" : ACCENT;
  const evFs = 0.0335 * w;
  const doneFs = 0.0282 * w;
  const tickD = 0.026 * w;

  const spans = [1, 1.5, 1, 2];   // the real ragged skyline of a working week

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#FFFFFF", fontFamily: SANS }}>
      {/* the week header: the day, then its date */}
      {days.map((d, i) => (
        <div key={d} style={{ position: "absolute", left: gridX + i * colW, top: P, width: colW, textAlign: "center" }}>
          <div style={{ fontSize: 0.0262 * w, letterSpacing: "0.10em", color: MUTED, fontWeight: 600 }}>{d}</div>
          <div style={{ fontSize: 0.0342 * w, color: INK, fontWeight: 600, marginTop: 0.010 * h }}>{dates[i]}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: P, top: gridY - 1, width: w - 2 * P, height: 1, background: RULE }} />

      {/* hour rules and their labels, the way a week view rules its day */}
      {["9 AM", "10 AM", "11 AM"].map((lab, i) => (
        <React.Fragment key={lab}>
          <div style={{ position: "absolute", left: gridX, top: gridY + i * rowH, width: gridW, height: 1, background: RULE }} />
          <div style={{
            position: "absolute", left: P, top: gridY + i * rowH - 0.017 * w, width: gutter - 12,
            textAlign: "right", fontSize: 0.0252 * w, color: MUTED, fontWeight: 500, whiteSpace: "nowrap",
          }}>{lab}</div>
        </React.Fragment>
      ))}
      <div style={{ position: "absolute", left: gridX, top: gridY + 3 * rowH, width: gridW, height: 1, background: RULE }} />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ position: "absolute", left: gridX + i * colW, top: gridY, width: 1, height: gridH, background: RULE }} />
      ))}

      {/* the day that filled up instead, one grey ticked block per drag */}
      {done.map((name, i) => {
        const at = moves[i] + DRAG_MS;
        if (tMs < at) return null;
        const s = spring({ frame: Math.max(0, ((tMs - at) / 1000) * fps), fps, durationInFrames: 6 });
        const bh = spans[i] * rowH - 6;
        return (
          <div key={name} style={{
            position: "absolute", left: bx0 + i * colW, top: by0, width: bw, height: bh,
            background: DONE_BG, borderLeft: `6px solid ${DONE_EDGE}`, boxSizing: "border-box",
            opacity: clamp01(s * 3), transform: `scale(${0.94 + 0.06 * Math.min(1, s)})`, transformOrigin: "50% 0%",
          }}>
            <div style={{
              position: "absolute", left: 10, top: 10, width: bw - 24,
              fontSize: doneFs, lineHeight: 1.08, color: DONE_INK, fontWeight: 600, letterSpacing: "-0.005em",
            }}>{name}</div>
            <div style={{ position: "absolute", right: 10, bottom: 10 }}><Tick d={tickD} /></div>
          </div>
        );
      })}

      {/* the column it was just dragged out of, for the 170 ms of the drag */}
      {ghost >= 0 && (
        <div style={{
          position: "absolute", left: bx0 + ghost * colW, top: evTop, width: bw, height: evH,
          border: `2px dashed ${ACCENT}`, boxSizing: "border-box", opacity: 0.38,
        }} />
      )}

      {/* POST A VIDEO: the one block nobody ticks */}
      <div style={{
        position: "absolute", left: evX, top: evTop, width: bw, height: evH,
        background: evBg, border: `2px solid ${ACCENT}`, borderLeft: `6px solid ${ACCENT}`,
        boxSizing: "border-box",
      }}>
        <div style={{
          position: "absolute", left: 10, top: 10, width: bw - 24,
          fontSize: evFs, lineHeight: 1.08, color: evInk, fontWeight: 700, letterSpacing: "-0.005em",
        }}>{data.event}</div>
        <div style={{
          position: "absolute", left: 10, bottom: 12, fontSize: 0.0262 * w, color: evInk, opacity: 0.82, fontWeight: 500,
        }}>9 AM</div>
        <svg width={tickD} height={tickD} viewBox="0 0 26 26" style={{ position: "absolute", right: 10, bottom: 10 }}>
          <title>not done</title>
          <circle cx={13} cy={13} r={11} fill="none" stroke={evInk} strokeWidth={3} />
        </svg>
      </div>

      {/* the app's own tooltip, and it is only true because four moves were just watched */}
      {tip > 0.001 && (() => {
        const tw = 0.257 * w;
        const th = 0.107 * h;
        const tx = Math.min(w - P - tw, bx0 + 4 * colW + bw - tw);
        // a macOS help tag: no arrow, and clear of the ticks on the blocks above it
        const ty = evTop + evH + 0.118 * h;
        return (
          <div style={{
            position: "absolute", left: tx, top: ty, width: tw, height: th,
            opacity: clamp01(tip * 3), transform: `scale(${0.9 + 0.1 * Math.min(1, tip)})`, transformOrigin: "80% 0%",
          }}>
            <div style={{
              width: "100%", height: "100%", background: INK, borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 0.026 * w, letterSpacing: "0.05em", color: "#FFFFFF", fontWeight: 600,
            }}>{data.tooltip}</div>
          </div>
        );
      })()}

      <Cursor x={cur.x} y={cur.y} s={0.030 * w / 13} />
    </div>
  );
};
