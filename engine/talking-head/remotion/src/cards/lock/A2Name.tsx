import React from "react";
import type { CardProps } from "../props";
import { A2Window, TermRows, type Row } from "./A2Window";

// V12 (reference edit J) "It's called AGENT LOCK" - idea 12, the tool names itself.
// The terminal, one prompt. `agent-lock` types on AGENT, Enter lands on LOCK and the
// tool's own first help line prints under it. Under the hero caption AGENT LOCK the
// screen says the same name in the tool's words, which is what makes it a NAMING card
// and not a title card.
//
// The help line is VERBATIM the first line of `node ~/agent-lock/agent-lock.mjs`
// (assets/real/gate-capture.txt). The window space is 630 px wide so that line fills
// the card's width and the mono lands at 32 device px: the camera is closer because
// there are two lines to read, not fifteen.

export type NameData = { cmd?: string; help?: string };

const WIN = 630;
const FS = 20;   // 20 / 630 * 994 = 31.6 device px
const LH = 26;
const CH = FS * 0.6;

export const A2Name: React.FC<CardProps & { data: NameData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const cmd = data.cmd ?? "agent-lock";
  const help = data.help ?? "agent-lock, pin the files your coding agents obey";
  const typeAt = beats.agent ?? fromMs;
  const enter = beats.enter ?? typeAt + 330;

  const rows: Row[] = [
    {
      at: fromMs,
      segs: [{ t: "$ ", tone: "muted" }, { t: cmd, tone: "ink" }],
      typeFrom: typeAt, typeMs: 300,
      caret: tMs < enter,
    },
    { at: enter, gap: 14, segs: [{ t: help, tone: "ink" }] },
  ];

  return (
    <A2Window
      w={w} h={h} winW={WIN} padX={18} padTop={16}
      body={<TermRows tMs={tMs} rows={rows} fs={FS} lh={LH} ch={CH} />}
    />
  );
};
