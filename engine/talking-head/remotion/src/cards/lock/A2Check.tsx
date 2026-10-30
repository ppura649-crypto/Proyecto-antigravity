import React from "react";
import type { CardProps } from "../props";
import { ACCENT, LABEL_FONT } from "../theme";
import { A2Window, T, TermRows, mix, swell, type Row } from "./A2Window";

// V15 (reference edit J) "every time I type claude, gemini, codex, or even every time I git pull,
// it's gonna check." - idea 15, step 3. The terminal, four launches in a column, and the
// SAME one grey line under each. The picture is the repetition: four different commands,
// one answer, and on "check." the four answers pulse white together.
//
// The ok line is the tool's own (assets/real/gate-capture.txt, "every launch, unchanged
// folder"); only the date is the story's (Aug 30), as the plan says. The numeral 3 is the
// signpost of the three steps, stamped on the card the way Creator Format 1 stamps their.

export type CheckData = { ok?: string; okPull?: string; numeral?: string };

const WIN = 620;
const FS = 20;   // 20 / 620 * 994 = 32.1 device px
const LH = 25;
const CH = FS * 0.6;
const NUM = 40;  // 64 device px
const TOP = 56;  // the rows start under the numeral

export const A2Check: React.FC<CardProps & { data: CheckData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const ok = data.ok ?? "agent-lock ok · 7 files · trusted Aug 30";
  const okPull = data.okPull ?? "agent-lock ok · unchanged";
  const B = {
    every: beats.every ?? fromMs,
    claude: beats.claude ?? fromMs + 900,
    gemini: beats.gemini ?? fromMs + 1700,
    codex: beats.codex ?? fromMs + 2300,
    pause: beats.pause ?? fromMs + 2900,
    git: beats.git ?? fromMs + 3900,
    pull: beats.pull ?? fromMs + 4200,
    pulse: beats.pulse ?? fromMs + 5000,
  };
  // each launch: the prompt lands, the command types, the line answers 300 ms later
  const OUT = 300;
  const launches: { at: number; typeAt: number; cmd: string; line: string; outAt: number }[] = [
    { at: B.every, typeAt: B.claude, cmd: "claude", line: ok, outAt: B.claude + OUT },
    { at: B.claude + OUT, typeAt: B.gemini, cmd: "gemini", line: ok, outAt: B.gemini + OUT },
    { at: B.gemini + OUT, typeAt: B.codex, cmd: "codex", line: ok, outAt: B.codex + OUT },
    { at: B.pause, typeAt: B.git, cmd: "git pull", line: okPull, outAt: B.pull + 60 },
  ];

  // "it's gonna check.": the four answers swell to white together. The swell opens on
  // "gonna" and PEAKS on "check." (58474), so the eye catches the peak on the word.
  const pulse = swell((tMs - B.pulse) / 380);
  const lineColor = mix(T.fgMuted, "#FFFFFF", pulse);

  const rows: Row[] = [];
  launches.forEach((l, i) => {
    rows.push({
      at: l.at, gap: i === 0 ? 0 : 8,
      segs: [{ t: "$ ", tone: "muted" }, { t: l.cmd, tone: "ink" }],
      typeFrom: l.typeAt, typeMs: l.cmd.length * 34,
      caret: tMs < l.typeAt + l.cmd.length * 34 + 120,
    });
    rows.push({
      at: l.outAt,
      segs: [
        { t: "agent-lock ", color: lineColor },
        { t: "ok", color: mix(T.green, "#FFFFFF", pulse) },
        { t: l.line.replace(/^agent-lock ok/, ""), color: lineColor },
      ],
    });
  });

  return (
    <A2Window
      w={w} h={h} winW={WIN} padX={14} padTop={14} padBottom={10}
      body={
        <>
          <div
            style={{
              position: "absolute", left: 2, top: 0, fontFamily: LABEL_FONT, fontWeight: 700,
              fontSize: NUM, lineHeight: `${NUM}px`, color: ACCENT,
            }}
          >
            {data.numeral ?? "3"}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: TOP }}>
            <TermRows tMs={tMs} rows={rows} fs={FS} lh={LH} ch={CH} />
          </div>
        </>
      }
    />
  );
};
