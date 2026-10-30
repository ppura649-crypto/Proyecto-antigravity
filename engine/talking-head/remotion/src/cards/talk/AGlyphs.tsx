import React from "react";
import type { CardProps } from "../props";
import { INK_A, at, cap, swell } from "./AShared";
import { KeyMark, MicMark, SoundArc } from "./AMarks";

// V1 "If you verbally / TALK TO AI / INSTEAD OF TYPING," - the two ways in, named.
// Frameless on their cream wall in dark ink, in the left 60 % of the card and finished by 0.22 H so
// it clears both the painting (which starts at 0.24 H) and the title label (0.31 H). Both glyphs
// are complete at frame 0, the way a naming card should be; what happens is that each one starts
// DOING its verb on the word that says it: on `TALK` the mic throws sound rings, on `TYPING,` four
// keys press in a typing rhythm and a caret starts blinking after the word TYPE.

export type GlyphsData = { left?: string; right?: string; halo?: boolean };

const H = 240;                       // the design space this card is drawn in (994 x 240)
const MIC = { x: 146, y: 77 };
const KEYS = { x: 465, y: 97 };
const RING_MIN = 78, RING_MAX = 136, RING_CYCLE = 900, RING_STAGGER = 300;
const PRESS_ORDER = [1, 8, 3, 6];    // row-major key indexes: a scattered, human typing pattern
const PRESS_CYCLE = 880;

export const AGlyphs: React.FC<CardProps & { data: GlyphsData }> = ({ tMs, w, beats, data }) => {
  const k = w / 994;
  const P = (v: number) => v * k;
  const bTalk = beats.talk ?? 1000;
  const bType = beats.typing ?? 2100;
  const halo = data.halo !== false;

  // sound rings: three arcs leaving the capsule on a loop, so the mic keeps talking while it is up
  const rings: { r: number; sw: number; o: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const el = tMs - bTalk - i * RING_STAGGER;
    if (el < 0) continue;
    const ph = (el % RING_CYCLE) / RING_CYCLE;
    rings.push({
      r: RING_MIN + (RING_MAX - RING_MIN) * ph,
      sw: 7 - 3 * ph,
      o: 0.95 * (1 - ph) * Math.min(1, el / 90),
    });
  }

  // four keys pressing one after another, on a loop: the keyboard keeps typing while it is up
  const press = new Array(10).fill(0);
  if (tMs >= bType) {
    const cyc = (tMs - bType) % PRESS_CYCLE;
    PRESS_ORDER.forEach((idx, n) => { press[idx] = swell(at(cyc, n * 110, 190)); });
  }

  const caretOn = tMs >= bType && (tMs - bType) % 1000 < 520 ? 1 : 0;
  const haloCss = halo ? { filter: `drop-shadow(0 0 ${P(9)}px rgba(255,255,255,0.95))` } : {};
  const textHalo = halo ? { textShadow: `0 0 ${P(10)}px rgba(255,255,255,0.95)` } : {};

  const col = (cx: number): React.CSSProperties => ({
    position: "absolute", left: P(cx - 210), top: P(172), width: P(420),
    display: "flex", alignItems: "center", justifyContent: "center",
    ...cap(P(44), INK_A), ...textHalo,
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={P(994)} height={P(H)} viewBox={`0 0 994 ${H}`}
           style={{ position: "absolute", left: 0, top: 0, ...haloCss }}>
        {rings.map((r, i) => (
          <g key={i}>
            <SoundArc cx={MIC.x} cy={MIC.y} r={r.r} half={30} side={1} sw={r.sw} opacity={r.o} />
            <SoundArc cx={MIC.x} cy={MIC.y} r={r.r} half={30} side={-1} sw={r.sw} opacity={r.o} />
          </g>
        ))}
        <MicMark x={MIC.x} y={MIC.y} s={1} sw={7} />
        <KeyMark x={KEYS.x} y={KEYS.y} s={1} sw={6} press={press} />
      </svg>

      <div style={col(MIC.x)}>{data.left ?? "talk"}</div>
      <div style={col(KEYS.x)}>
        <span>{data.right ?? "type"}</span>
        <span
          style={{
            display: "inline-block", width: P(7), height: P(46), marginLeft: P(12),
            backgroundColor: INK_A, opacity: caretOn,
          }}
        />
      </div>
    </div>
  );
};
