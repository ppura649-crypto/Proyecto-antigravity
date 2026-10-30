import React from "react";
import { interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { MONO_FONT } from "./theme";
import {
  CHIPS_H, CHIP_GAP, CHIP_H, CLAUDE_T, CW, GPT_T, GrabHand, Sheet, Surface, chipW,
} from "./ComposerParts";

// V14: "Once you GET them, you SIMPLY DROP them into CLAUDE or CHATGPT."
// The five files from the box, hovering as sheets, gathered into one bundle
// under a grab cursor, dragged down and released into the real composer, where
// they become five attachment chips and the placeholder goes. The mark lights at
// the composer's head on "Claude", and on "or" the whole surface restyles in one
// horizontal wipe into ChatGPT's, the same five files still attached. Same
// files, either door. Composer geometry and colours: remocn claude-chat, verbatim.
export type ComposerData = { files?: string[] };

const DW = 1015;
const DH = 576;
const K = 964 / CW;
const LEFT = (DW - 964) / 2;
const BOTTOM = 548;
const MARK = 78;
const SHEET_W = 134, SHEET_H = 168, SHEET_Y = 24, SLOT = DW / 5;
const GATHER_Y = 148, DRAG_Y = 264;

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const p01 = (v: number) => Math.max(0, Math.min(1, v));
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const Composer: React.FC<CardProps & { data: ComposerData }> = ({
  tMs, w, h, fps, fromMs, beats, assets, data,
}) => {
  const S = Math.min(w / DW, h / DH);
  const oX = (w - DW * S) / 2, oY = (h - DH * S) / 2;
  const files = data.files ?? ["system.md", "captions.md", "visuals.md", "hook.md", "cut.md"];
  const n = files.length;

  const bGet = beats.get ?? fromMs + 420;
  const bSimply = beats.simply ?? bGet + 540;
  const bDrop = beats.drop ?? bSimply + 420;
  const bClaude = beats.claude ?? bDrop + 660;
  const bOr = beats.or ?? bClaude + 420;

  // where each chip ends up, in the composer's own px, so the sheets fly to a real slot
  const ws = files.map(chipW);

  const starts: number[] = [];
  ws.reduce((x, cw, i) => { starts[i] = x; return x + cw + CHIP_GAP; }, 28);
  const grow = easeIO(p01((tMs - bDrop) / 240));
  const compTop = BOTTOM - (180 + CHIPS_H) * K; // the settled top, where the chips live
  const chipCx = (i: number) => LEFT + (starts[i] + ws[i] / 2) * K;
  const chipCy = compTop + (16 + CHIP_H / 2) * K;

  // hover, gather, drag: one bundle under the hand
  const gather = easeIO(p01((tMs - bGet) / 300));
  const drag = easeIO(p01((tMs - bSimply) / 420));
  const bcx = DW / 2;
  const bcy = lerp(GATHER_Y, DRAG_Y, drag);

  const phOut = interpolate(tMs, [bDrop, bDrop + 160], [0, 1], clamp);
  const markIn = spring({
    frame: Math.max(0, ((tMs - bClaude) / 1000) * fps), fps,
    config: { damping: 12, stiffness: 320, mass: 0.7 },
  });
  const wipe = p01((tMs - bOr) / 240);

  const flightOf = (i: number) => easeOut(p01((tMs - (bDrop + i * 26)) / 300));
  const chipIn = files.map((_, i) => interpolate(flightOf(i), [0.78, 1], [0, 1], clamp));

  const handP = spring({
    frame: Math.max(0, ((tMs - bGet) / 1000) * fps), fps,
    config: { damping: 13, stiffness: 300, mass: 0.7 },
  });
  const handOpen = p01((tMs - bDrop) / 200);
  const handGone = interpolate(tMs, [bDrop + 90, bDrop + 300], [1, 0], clamp);

  const stack = (gpt: boolean) => (
    <Surface
      th={gpt ? GPT_T : CLAUDE_T} k={K} left={LEFT} bottom={BOTTOM} grow={grow}
      files={files} chipIn={chipIn} phOut={phOut}
      mark={assets[gpt ? 1 : 0]} invert={gpt} markIn={markIn} markPx={MARK}
    />
  );

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: CLAUDE_T.page }}>
      <div style={{ position: "absolute", left: oX, top: oY, width: DW, height: DH, transform: `scale(${S})`, transformOrigin: "top left" }}>
        {stack(false)}

        {files.map((name, i) => {
          const fl = flightOf(i);
          // rest -> bundle -> the chip's own slot inside the composer
          const bob = 5 * Math.sin((2 * Math.PI * (tMs - fromMs)) / 1900 + i * 1.15);
          const rx = i * SLOT + (SLOT - SHEET_W) / 2;
          const ry = SHEET_Y + bob * (1 - gather);
          const bx = bcx - SHEET_W / 2 + (i - (n - 1) / 2) * 8;
          const by = bcy - SHEET_H / 2 + (i - (n - 1) / 2) * 5;
          const gx = lerp(rx, bx, gather), gy = lerp(ry, by, gather);
          const rot = lerp(1.6 * Math.sin(i * 2.1 + tMs / 900) * (1 - gather), (i - (n - 1) / 2) * 4.5, gather);
          const cx = lerp(gx + SHEET_W / 2, chipCx(i), fl);
          const cy = lerp(gy + SHEET_H / 2, chipCy, fl);
          const k = lerp(1, 0.26, fl);
          const op = interpolate(fl, [0.72, 0.98], [1, 0], clamp);
          if (op <= 0.001) return null;
          return (
            <div key={name} style={{
              position: "absolute", left: cx - SHEET_W / 2, top: cy - SHEET_H / 2,
              width: SHEET_W, opacity: op,
              transform: `rotate(${lerp(rot, 0, fl)}deg) scale(${k})`, transformOrigin: "50% 50%",
            }}>
              <Sheet w={SHEET_W} h={SHEET_H} />
              <div style={{
                position: "absolute", left: (SHEET_W - SLOT) / 2, top: SHEET_H + 10, width: SLOT,
                textAlign: "center", fontFamily: MONO_FONT, fontSize: 26, lineHeight: 1.2,
                color: "#1F1E1D", whiteSpace: "nowrap", opacity: 1 - Math.min(1, gather * 7),
              }}>
                {name}
              </div>
            </div>
          );
        })}

        {handGone > 0.001 && (
          <div style={{
            position: "absolute", left: bcx - 16, top: bcy - SHEET_H / 2 - 26,
            opacity: Math.min(1, handP * 2.2) * handGone,
            transform: `translateY(${(1 - handP) * -18}px)`,
          }}>
            <GrabHand s={84} open={handOpen} />
          </div>
        )}
      </div>

      {/* one horizontal wipe and the same files are in ChatGPT's composer */}
      {wipe > 0 && (
        <div style={{
          position: "absolute", inset: 0, backgroundColor: GPT_T.page,
          clipPath: `inset(0 ${((1 - wipe) * 100).toFixed(3)}% 0 0)`,
        }}>
          <div style={{ position: "absolute", left: oX, top: oY, width: DW, height: DH, transform: `scale(${S})`, transformOrigin: "top left" }}>
            {stack(true)}
          </div>
        </div>
      )}
    </div>
  );
};
