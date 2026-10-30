import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { BLUE, at, clamp01, easeBack, easeOut } from "./CShared";
import { CArrow } from "./CShared";
import { CPromptBox, FILLERS, RAMBLE, segsOf, type PLine } from "./CPromptBox";

// V16, the payoff: ramble in, structured clean prompt out. The rambled box from v10 on the left
// (still crooked, still full of blue fillers), an arrow carrying the two marks that do the work,
// and the clean numbered prompt on the right, its gutter waiting empty.
// On `ramble` the fillers light again, a mark pops on each name, on `turn` the ramble squeezes
// into a packet that rides the arrow while what is left re-centres on the card, and on
// STRUCTURED CLEAN PROMPT the three clean lines land one by one.

const CLEAN = [
  "Script, 60 seconds: talking vs typing to AI.",
  "Hook first.",
  "End on one rule.",
];

const PAD = 28, LCOL = 386, GAP = 12, ACOL = 176, RCOL = 395;
const AX = PAD + LCOL + GAP;            // the arrow column
const RX = AX + ACOL + GAP;             // the clean box
const LBOX_H = 318;                     // six rows of the ramble at rowH 42
const MID = PAD + LBOX_H / 2;           // the shaft, on the boxes' centre line
const SLIDE = (1037 - (ACOL + GAP + RCOL)) / 2 - AX; // what is left re-centres when the ramble goes
const MARK = 82;
const ARROW_H = Math.round(ACOL * 0.17) * 1.25;  // CArrow draws head*1.25 tall

export type ImproveData = {
  tab?: string; outTab?: string; text?: string; fillers?: string[]; count?: number;
  cleanLines?: string[]; cleanCount?: number; assets?: string[];
};

export const CImprove: React.FC<CardProps & { data: ImproveData }> = ({
  tMs, w, fromMs, beats, assets, data,
}) => {
  const DW = 1037, k = w / DW;

  const bRamble = beats.ramble ?? 55217;
  const bGpt = beats.chatgpt ?? 56147;
  const bClaude = beats.claude ?? 57107;
  const bTurn = beats.turn ?? 57467;
  const bStruct = beats.structured ?? 58258;

  const arrowP = at(tMs, fromMs + 250, 420);
  const gpt = at(tMs, bGpt, 330);
  const cla = at(tMs, bClaude, 330);
  const fold = at(tMs, bTurn, 420);
  const ride = at(tMs, bTurn + 180, 620);

  const squeeze = 1 - 0.88 * easeIOish(fold);
  // the re-centring starts only once the ramble is visibly going, so a mark never crosses it
  const slide = SLIDE * easeIOish(at(tMs, bTurn + 200, 520));
  const packetX = PAD + LCOL / 2 + (RX + SLIDE + 22 - PAD - LCOL / 2) * easeOut(ride);
  const packetOn = clamp01((fold - 0.3) / 0.3) * (1 - clamp01((ride - 0.86) / 0.14));

  const mark = (src: string, p: number, x: number) => (
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute", left: x, top: 72, width: MARK, height: MARK,
        transform: `scale(${0.2 + 0.8 * easeBack(p)})`, transformOrigin: "50% 100%",
        opacity: clamp01(p * 4),
      }}
    />
  );

  const lines: PLine[] = [{ segs: segsOf(data.text ?? RAMBLE, data.fillers ?? FILLERS) }];
  const clean = (data.cleanLines ?? CLEAN).map((t) => ({ segs: [{ t }] }));

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: DW, transform: `scale(${k})`, transformOrigin: "0 0" }}>
      {/* the ramble the creator speaks, crooked, squeezing into the arrow on `turn` */}
      <div
        style={{
          position: "absolute", left: 0, top: 0, width: DW,
          transform: `translateX(${easeOut(fold) * 46}px) scale(${squeeze})`,
          transformOrigin: `${PAD + LCOL / 2}px ${MID}px`,
          opacity: 1 - clamp01((fold - 0.55) / 0.4),
        }}
      >
        <CPromptBox
          x={PAD} y={PAD} w={LCOL} font={26} rowH={42} tab={data.tab ?? "ramble.txt"}
          lines={lines} maxRows={6} count={data.count ?? 36} countP={1}
          fillerP={(i) => at(tMs, bRamble + (i - 1) * 70, 200)}
          jitter={0.62} seed={13}
        />
      </div>

      {/* the two marks that do the work, the arrow, and what comes out: one group, so when the
          ramble is gone the picture re-centres instead of leaving half a white card */}
      <div style={{ position: "absolute", left: 0, top: 0, width: DW, transform: `translateX(${slide}px)` }}>
        {assets[0] && mark(assets[0], gpt, AX)}
        {assets[1] && mark(assets[1], cla, AX + MARK + 12)}
        <div style={{ position: "absolute", left: AX, top: MID - ARROW_H / 2 }}>
          <CArrow w={ACOL} p={arrowP} />
        </div>
        <CPromptBox
          x={RX} y={PAD} w={RCOL} font={28} rowH={44} tab={data.outTab ?? "prompt.md"}
          lines={clean} listNumbers
          count={data.cleanCount ?? 14}
          countP={at(tMs, bStruct + 100, 420)}
          reveal={(l) => at(tMs, bStruct + l * 90, 240)}
        />
      </div>

      {/* what the ramble became, on its way across */}
      <div
        style={{
          position: "absolute", left: packetX, top: MID - 13, width: 70, height: 26,
          backgroundColor: BLUE, opacity: packetOn,
        }}
      />
    </div>
  );
};

// a squeeze that starts fast and settles, so the box collapses rather than shrinks evenly
function easeIOish(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}
