import React from "react";
import type { CardProps } from "../props";
import {
  BLUE, Cloud, CloudTails, INK_A, MUTED_A, PAPER, at, cap, easeOut, mono, noise, sans, swell,
} from "./AShared";
import { KeyMark, MicMark } from "./AMarks";

// V7 + V9, one object shown twice with the speeds swapped: a THOUGHT CLOUD over an INPUT FIELD.
//
// V7 "Because when you type, you're thinking faster than you're able to write things down."
//    The cloud streams the whole sentence at ~7 words/s while the field, on a keyboard, types the
//    same sentence at ~5 characters/s. By `down.` the cloud holds all of it and the field holds
//    "Because when you". The thought outran the hand, and you can see the gap.
//
// V9 "But when you're talking, you're usually saying things faster than you're able to think."
//    The same cloud and the same field, mirrored: the field is a mic now, its waveform is live,
//    the transcript pours in at ~4.3 words/s and runs off the bottom edge, and the cloud never
//    gets past `...`. The mouth outran the thought.
//
// Both run on `clock: "run"`: the rate is the claim, so nothing here ever settles before the cut.

const H = 620;                                  // design space: 994 x 620
const FIELD = { x: 161, y: 390, w: 660, h: 200 };
const CLIP = { x: 163, y: 392, w: 656, h: 196 };
const HEAD_Y = 424;                             // the field's header row, glyph + source
const LINE_H = 46, TEXT_X = 18, TEXT_TOP = 78;  // inside CLIP
const FONT = 40;

const FieldShell: React.FC = () => (
  <rect
    x={FIELD.x} y={FIELD.y} width={FIELD.w} height={FIELD.h}
    style={{ fill: PAPER, stroke: INK_A, strokeWidth: 4 }}
  />
);

/** the source row's label: TYPING on V7, TALKING on V9 - their words, in the caption face */
const Source: React.FC<{ P: (v: number) => number; text: string }> = ({ P, text }) => (
  <div style={{ position: "absolute", left: P(292), top: P(HEAD_Y - 15), ...cap(P(30), MUTED_A) }}>
    {text}
  </div>
);

const Clip: React.FC<{ P: (v: number) => number; children: React.ReactNode }> = ({ P, children }) => (
  <div style={{
    position: "absolute", left: P(CLIP.x), top: P(CLIP.y), width: P(CLIP.w), height: P(CLIP.h),
    overflow: "hidden",
  }}>{children}</div>
);

// ---------------------------------------------------------------------------------------------
// V7: a-cloud-typed
export type CloudTypedData = {
  cloudLines?: string[]; blue?: string; typed?: string; source?: string;
  wordsPerSec?: number; charsPerSec?: number;
};

const CLOUD_ROWS = [131, 175, 219];   // the three text rows, centred in the cloud silhouette
const CLOUD_FONT = 36;

export const ACloudTyped: React.FC<CardProps & { data: CloudTypedData }> = ({ tMs, w, fromMs, beats, data }) => {
  const k = w / 994;
  const P = (v: number) => v * k;
  const lines = data.cloudLines ?? [];
  const blue = data.blue ?? "faster";
  const typed = data.typed ?? "";
  const bType = beats.type ?? 20367;
  const bThink = beats.thinking ?? 21481;
  const bDown = beats.down ?? 23521;
  const step = 1000 / (data.wordsPerSec ?? 7);

  // the cloud gives one soft swell when its last word lands on `down.`
  const puff = 1 + 0.018 * swell(at(tMs, bDown, 340));
  const chars = Math.max(0, Math.floor(((tMs - bType) * (data.charsPerSec ?? 5.07)) / 1000));
  // the caret blinks from the moment the field lands, not from the first keystroke: an empty
  // field with a dead caret for half a second reads as a bug, not as a man about to type
  const caretOn = (tMs - fromMs) % 1000 < 540 ? 1 : 0;

  let idx = 0;
  const rows = lines.map((ln, r) => {
    const words = ln.split(" ");
    const spans = words.map((word, i) => {
      const atW = bThink + idx * step; idx += 1;
      const e = easeOut(at(tMs, atW, 170));
      return (
        <span key={i} style={{
          opacity: e, transform: `translateY(${P(9 * (1 - e))}px)`, display: "inline-block",
          marginRight: P(10), color: word.replace(/[.,]/g, "") === blue ? BLUE : MUTED_A,
          fontWeight: word.replace(/[.,]/g, "") === blue ? 700 : 500,
        }}>{word}</span>
      );
    });
    return (
      <div key={r} style={{
        position: "absolute", left: 0, top: P(CLOUD_ROWS[r]), width: P(994),
        display: "flex", justifyContent: "center", ...sans(P(CLOUD_FONT), MUTED_A),
      }}>{spans}</div>
    );
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={P(994)} height={P(H)} viewBox={`0 0 994 ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform={`translate(497 172) scale(${puff}) translate(-497 -172)`}>
          <Cloud sw={10} />
          <CloudTails sw={10} />
        </g>
        <FieldShell />
        <KeyMark x={226} y={HEAD_Y} s={0.34} sw={4} />
      </svg>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${puff})`, transformOrigin: `${P(497)}px ${P(172)}px` }}>
        {rows}
      </div>
      <Source P={P} text={data.source ?? "typing"} />
      <Clip P={P}>
        <div style={{ position: "absolute", left: P(TEXT_X), top: P(TEXT_TOP), display: "flex", alignItems: "center" }}>
          <span style={mono(P(FONT), INK_A)}>{typed.slice(0, chars)}</span>
          <span style={{
            display: "inline-block", width: P(6), height: P(42), marginLeft: P(4),
            backgroundColor: INK_A, opacity: caretOn,
          }} />
        </div>
      </Clip>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------
// V9: a-cloud-spoken
export type CloudSpokenData = { lines?: string[]; source?: string; charsPerSec?: number };

const BARS = 26, BAR_X0 = 460, BAR_PITCH = 13, BAR_W = 5;

export const ACloudSpoken: React.FC<CardProps & { data: CloudSpokenData }> = ({ tMs, w, beats, data }) => {
  const k = w / 994;
  const P = (v: number) => v * k;
  const lines = data.lines ?? [];
  const bTalk = beats.talking ?? 30580;
  const bSay = beats.saying ?? 31420;
  const bFast = beats.faster ?? 32140;

  // the waveform: flat until the creator starts talking, live from `talking,`, louder from `faster`
  const env = easeOut(at(tMs, bTalk, 220)) * (1 + 0.38 * easeOut(at(tMs, bFast, 260)));
  const bars = Array.from({ length: BARS }, (_, i) => {
    const half = 3 + 20 * noise(i, tMs) * env;
    return (
      <rect key={i} x={BAR_X0 + i * BAR_PITCH} y={HEAD_Y - half} width={BAR_W} height={half * 2}
            rx={BAR_W / 2} style={{ fill: BLUE }} />
    );
  });

  // the thought that never catches up: three dots, pulsing in the empty cloud
  const dots = [0, 1, 2].map((i) => {
    const el = tMs - bSay - i * 180;
    const born = easeOut(at(tMs, bSay + i * 180, 200));          // each dot grows in on its turn
    const s = born * (0.78 + 0.32 * swell(((el < 0 ? 0 : el) % 1100) / 1100));
    return <circle key={i} cx={451 + i * 46} cy={196} r={13 * s} style={{ fill: MUTED_A }} />;
  });

  const chars = Math.max(0, Math.floor(((tMs - bTalk) * (data.charsPerSec ?? 26.47)) / 1000));
  let cut = 0;
  const rows = lines.map((ln, r) => {
    const shown = Math.max(0, Math.min(ln.length, chars - cut));
    cut += ln.length + 1;
    return (
      <div key={r} style={{
        position: "absolute", left: P(TEXT_X), top: P(TEXT_TOP + r * LINE_H), ...mono(P(FONT), INK_A),
      }}>{ln.slice(0, shown)}</div>
    );
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={P(994)} height={P(H)} viewBox={`0 0 994 ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <Cloud sw={10} />
        <CloudTails sw={10} />
        {dots}
        <FieldShell />
        <MicMark x={226} y={HEAD_Y - 4} s={0.4} sw={4} />
        {bars}
      </svg>
      <Source P={P} text={data.source ?? "talking"} />
      <Clip P={P}>{rows}</Clip>
    </div>
  );
};
