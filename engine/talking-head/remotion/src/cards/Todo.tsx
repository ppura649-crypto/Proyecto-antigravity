import React from "react";
import type { CardProps } from "./props";
import { ACCENT, LABEL_FONT } from "./theme";

// V1 (reference edit G): "you probably already know that you should be posting content."
// The joke and the truth in one picture. A TODAY sheet that starts with one line on it,
// POST A VIDEO, its box empty. On every word a job the creator DID finish lands above it, already
// ticked and struck, and pushes the post down a row: client call, invoices, hiring, ship
// the update. By "you" it sits at the bottom, the only empty box on the page. It flashes
// terracotta once on "should", its box pulses on "posting" and on "content", and it never
// gets ticked. Everything else gets done; the post gets bumped.

export type TodoData = {
  head?: string;   // the sheet's header ("TODAY")
  item?: string;   // the one line that never gets ticked
  done?: string[]; // the jobs that land above it, in the order they land
};

const INK = "#1F1E1D";
const MUTED = "#73726C";
const HAIR = "#E8E5DD";

// the post is SHOVED down first and the finished job takes the row it left, so the two lines
// never share pixels: 170 ms of push, then the new line slides in from the margin.
const PUSH_MS = 170;
const IN_MS = 150;
const STRIKE_MS = 150;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeIO = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// a single soft swell: 0 at both ends, so nothing ever snaps back
const swell = (t: number): number => Math.sin(Math.PI * clamp01(t));

const ORDER = ["probably", "already", "know", "that"];

export const Todo: React.FC<CardProps & { data: TodoData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const head = data.head ?? "TODAY";
  const item = data.item ?? "POST A VIDEO";
  const done = (data.done ?? []).slice(0, 4);

  const PAD = 0.072 * w;              // 67 device px
  const HEAD_FS = 0.0505 * w;         // 47
  const FS = 0.0445 * w;              // 41
  const BOX = 0.0435 * w;             // 40
  const BW = 0.0033 * w;              // 3, the checkbox rule
  const GAP = 0.028 * w;              // 26 between the box and the word
  const ROW = 0.128 * h;              // 66
  const headTop = 0.088 * h;          // 46
  const ruleY = headTop + HEAD_FS + 0.040 * h;
  const rowsTop = ruleY + 0.050 * h;
  const textLeft = PAD + BOX + GAP;

  const at = (i: number): number => beats[ORDER[i]] ?? fromMs + 400 + i * 320;

  // the post is pushed one row for every job that has landed, eased, never snapped
  let pushed = 0;
  for (let i = 0; i < done.length; i++) pushed += easeIO(clamp01((tMs - at(i)) / PUSH_MS));
  const itemTop = rowsTop + pushed * ROW;

  // "should be": the line flashes terracotta once and comes straight back to ink
  const flash = swell((tMs - (beats.should ?? 1e9)) / 300);
  // "posting" / "content": the empty box pulses and never ticks
  const pulse =
    Math.max(swell((tMs - (beats.posting ?? 1e9)) / 340), swell((tMs - (beats.content ?? 1e9)) / 340));
  const boxScale = 1 + 0.12 * pulse;

  const word = (px: number, color: string): React.CSSProperties => ({
    fontFamily: LABEL_FONT, fontWeight: 700, fontSize: px, letterSpacing: "0.045em",
    color, textTransform: "uppercase", lineHeight: 1, whiteSpace: "nowrap",
  });

  const rowCss = (top: number): React.CSSProperties => ({
    position: "absolute", left: 0, top, width: w, height: ROW,
    display: "flex", alignItems: "center",
  });

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#FFFFFF" }}>
      {/* the sheet's header, and the rule under it */}
      <div style={{ position: "absolute", left: PAD, top: headTop, ...word(HEAD_FS, INK) }}>{head}</div>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: ruleY, height: 2, backgroundColor: HAIR }} />

      {/* the jobs that DID get done, landing one per word above the post */}
      {done.map((txt, i) => {
        const e = clamp01((tMs - at(i) - PUSH_MS) / IN_MS);
        const k = clamp01((tMs - at(i) - PUSH_MS - 70) / STRIKE_MS);
        return (
          <div
            key={txt}
            style={{
              ...rowCss(rowsTop + i * ROW),
              opacity: clamp01(e * 2.2),
              transform: `translateX(${(1 - easeOut(e)) * -0.055 * w}px)`,
            }}
          >
            <div
              style={{
                position: "absolute", left: PAD, width: BOX, height: BOX,
                backgroundColor: INK, display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width={BOX * 0.68} height={BOX * 0.68} viewBox="0 0 24 24">
                <title>done</title>
                <path
                  d="M4.6 12.6 L9.8 17.6 L19.4 7.0"
                  fill="none" stroke="#FFFFFF" strokeWidth={3.2}
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
            <span style={{ position: "absolute", left: textLeft, ...word(FS, INK), display: "inline-block" }}>
              {txt}
              <span
                style={{
                  position: "absolute", left: 0, right: 0, top: "52%", height: 0.0028 * w,
                  backgroundColor: MUTED, transformOrigin: "left center", transform: `scaleX(${easeOut(k)})`,
                }}
              />
            </span>
          </div>
        );
      })}

      {/* the one that never gets ticked */}
      <div style={{ ...rowCss(itemTop) }}>
        <div
          style={{
            position: "absolute", left: PAD, width: BOX, height: BOX,
            transform: `scale(${boxScale})`, transformOrigin: "center center",
          }}
        >
          <div style={{ position: "absolute", inset: 0, border: `${BW}px solid ${INK}`, boxSizing: "border-box", opacity: 1 - flash }} />
          <div style={{ position: "absolute", inset: 0, border: `${BW}px solid ${ACCENT}`, boxSizing: "border-box", opacity: flash }} />
        </div>
        <span style={{ position: "absolute", left: textLeft, ...word(FS, INK), opacity: 1 - flash }}>{item}</span>
        <span style={{ position: "absolute", left: textLeft, ...word(FS, ACCENT), opacity: flash }}>{item}</span>
      </div>
    </div>
  );
};
