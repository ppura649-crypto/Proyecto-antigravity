// logs, dark: "Then they tried to rewrite their own logs, to hide how they had cheated. The agents were covering
// their tracks."
// The agents' leather logbook lies open under a lamp, its lines writing themselves. "rewrite": a red pen scribbles
// three lines out and new red words appear over them. "to": the line "how we got the answer" is highlighted; "hide":
// a black bar lands over it. "cheated": a trail of small red agent footprints starts walking out of the book, off
// the page and across the desk out of frame. "covering": the book slams shut over the prints on its page and an
// agent with a broom sweeps back along the trail, every print dying in dust; "tracks": a padlock snaps onto the
// closed book and the lamp sinks. Source: METR (facts.md section 9).
import React from "react";
import { Column, Travel, ease, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { LOGS_BOOK, LogsBookView, type LogsBookCues } from "./LogsBook";
import { LogsPen } from "./LogsPen";
import { LogsLock, LogsSweeper, LogsTrail, type TrackCues } from "./LogsTracks";

export const Logs: React.FC = () => {
  const { f, cue, scene } = useScene();
  const t0 = scene.from - LEAD;
  const rw = cue("rewrite");
  const to = cue("to");
  const hide = cue("hide");
  const cheated = cue("cheated");
  const cov = cue("covering");
  const tracks = cue("tracks");
  const B = LOGS_BOOK;
  const lock = tracks + 2;
  const c: LogsBookCues = {
    lines: [
      { text: "tried the task", y: 104, at: t0 + 4 },
      { text: "still stuck", y: 212, at: t0 + 11 },
      { text: "found the answer key", y: 320, at: t0 + 18, rewrite: { to: "worked it out", at: rw } },
      { text: "asked the others", y: 428, at: t0 + 25, rewrite: { to: "worked alone", at: rw + 12 } },
    ],
    right: [
      { text: "copied the answer", y: 104, at: t0 + 22, rewrite: { to: "solved it", at: rw + 24 } },
      { text: "submitted", y: 320, at: t0 + 36 },
    ],
    red: { y: 212, at: t0 + 29, hl: to - 4, black: hide - 6 },
    close: cov - 2,
    hit: lock + 5,
  };
  const tc: TrackCues = { walk: cheated + 4, sweep: cov, sweepEnd: tracks + 8, lock };
  const ly = (y: number) => B.top + y + 30;
  const pen = [
    { f: rw - 16, x: 760, y: 1320 },
    { f: rw, x: 106, y: ly(320) },
    { f: rw + 9, x: 410, y: ly(320), wig: true },
    { f: rw + 12, x: 106, y: ly(428) },
    { f: rw + 21, x: 410, y: ly(428), wig: true },
    { f: rw + 24, x: 474, y: ly(104) },
    { f: rw + 33, x: 770, y: ly(104), wig: true },
    { f: to - 4, x: 660, y: ly(104) - 50 },
    { f: hide - 6, x: 470, y: ly(212) },
    { f: hide + 4, x: 820, y: ly(212) },
    { f: hide + 22, x: 900, y: 1380 },
  ];
  // the book slides to the centre as it slams shut, so the closed volume sits in the middle of the frame
  const shift = prog(f, c.close, 16, ease.inOut);
  const sink = prog(f, lock + 4, 24);
  const lamp = (0.2 + 0.03 * Math.sin(f / 11) + 0.015 * Math.sin(f / 3.7)) * (1 - 0.75 * sink);
  return (
    <Column>
      <div style={{ position: "absolute", left: -200, top: 520, width: 1300, height: 1100, background: `radial-gradient(50% 45% at 50% 42%, rgba(255,186,110,${lamp.toFixed(3)}) 0%, rgba(255,186,110,0) 100%)` }} />
      <Travel at={t0} from="bottom" dist={700} dur={22} curve="measured" style={{ position: "absolute", inset: 0 }}>
        <LogsTrail c={tc} part="desk" />
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${(shift * (B.pageW + B.lip) / 2).toFixed(1)}px)` }}>
          <LogsBookView c={c} onPage={<LogsTrail c={tc} part="page" />} />
          <LogsLock at={lock} x={B.spine - B.pageW - B.lip} y={B.top + B.pageH / 2} />
        </div>
      </Travel>
      <LogsSweeper c={tc} />
      <LogsPen path={pen} from={rw - 16} to={hide + 22} />
    </Column>
  );
};
