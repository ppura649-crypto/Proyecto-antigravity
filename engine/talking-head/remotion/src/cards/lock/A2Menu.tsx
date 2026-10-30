import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { A2Window, BAR, MONO, T, TermRows, clamp01, easeIO, easeOut, rowTops, swell } from "./A2Window";
import { CH, Cursor, FS, LH, PADTOP, PADX, ROW, WIN, stopRows } from "./A2Stop";

// V18 (reference edit J) "I can accept or reject, or even spawn a subagent outside the projects to
// check and tell me if it's safe or not." - idea 18, callback of V17.
// The SAME screen continues (no re-pop: the event hands over on V17's last frame). Only the
// ❯ moves, over the real six menu lines, in the order the creator names them: accept -> reject ->
// the subagent. On "subagent" the creator hits Enter, and on "outside the projects" a pane opens on
// the right: a dashed EMPTY room with the Claude agent icon in it and the menu's own words
// under it (`empty folder · no tools`). The diff sheet is handed in, the agent scans it, and
// on "safe or not" the room closes and its verdict prints back into the terminal, verbatim
// from the README shape in assets/real/gate-capture.txt.
//
// The terminal recedes to 28 % while the pane is open, because nothing on it is being read
// then; it comes back full for the answer and scrolls two rows the way a terminal scrolls.

export type MenuData = { assets?: string[] };

const PANEL_X = 452;
const PANEL_PAD = 14;

export const A2Menu: React.FC<CardProps & { data: MenuData }> = ({ tMs, w, h, fromMs, beats, assets }) => {
  const B = {
    accept: beats.accept ?? fromMs,
    reject: beats.reject ?? fromMs + 540,
    spawn: beats.spawn ?? fromMs + 1400,
    subagent: beats.subagent ?? fromMs + 2060,
    outside: beats.outside ?? fromMs + 2540,
    sheet: beats.sheet ?? fromMs + 2900,
    check: beats.check ?? fromMs + 3980,
    answer: beats.answer ?? fromMs + 4220,
    no: beats.no ?? fromMs + 5300,
  };
  const H = h / (w / WIN);

  // the cursor walks the menu in the order the creator names the choices
  const moves = [
    { at: fromMs - 1, row: ROW.c }, { at: B.accept, row: ROW.a },
    { at: B.reject, row: ROW.q }, { at: B.spawn, row: ROW.c },
  ];
  let mi = 0;
  for (let i = 0; i < moves.length; i++) if (tMs >= moves[i].at) mi = i;
  const flash = swell((tMs - moves[mi].at) / 420);
  const sel: number[] = [];
  sel[moves[mi].row] = 0.55 + 0.45 * flash;

  // Enter on [c]: the cursor locks terracotta and the row holds lit
  const entered = clamp01((tMs - B.subagent) / 180);
  if (tMs >= B.subagent) sel[ROW.c] = Math.max(sel[ROW.c] ?? 0, 0.55 + 0.45 * swell((tMs - B.subagent) / 420));

  // the pane: opens on "outside the projects", closes when the verdict comes back
  const open = easeOut((tMs - B.outside) / 300) * (1 - easeIO((tMs - B.answer) / 240));
  const scroll = 56 * easeIO((tMs - B.answer) / 240);  // the header AND the rule it closed go off the top

  const rows = stopRows(
    { prompt: -1, header: -1, file: -1, diff: -1, knows: -1, menu: -1 },
    1, sel,
    { at: B.answer + 240, typeMs: 700, no: clamp01((tMs - B.no) / 200) },
  );
  const tops = rowTops(rows, LH);

  // the sheet is lifted out of the diff line and handed across: it DROPS first, then
  // slides in at the shelf's height, so it never crosses the room's own label
  const flyY = easeIO((tMs - B.sheet) / 190);
  const flyX = easeIO((tMs - B.sheet - 150) / 320);
  const sx0 = PADX + 7 * CH;
  const sy0 = BAR + PADTOP + tops[3];
  const boxX = PANEL_X + PANEL_PAD;
  const boxW = WIN - 10 - boxX;
  const sx1 = boxX + boxW / 2 - 85;
  const sy1 = BAR + 244;
  const sx = sx0 + (sx1 - sx0) * flyX;
  const sy = sy0 + (sy1 - sy0) * flyY;
  const scan = clamp01((tMs - B.check) / 220);

  const icon = assets[0];

  return (
    <A2Window
      w={w} h={h} winW={WIN} padX={PADX} padTop={PADTOP} padBottom={10}
      bodyDim={0.78 * open}
      body={
        <div
          style={{
            position: "absolute", inset: 0,
            // the terminal does not get sliced by the pane: it dissolves into it, the way a
            // pane that takes room from a shell reads. A hard cut through a word is a bug.
            WebkitMaskImage: `linear-gradient(to right, #000 ${100 - 53.5 * open}%, transparent ${100 - 44.7 * open}%)`,
            maskImage: `linear-gradient(to right, #000 ${100 - 53.5 * open}%, transparent ${100 - 44.7 * open}%)`,
          }}
        >
          <TermRows tMs={tMs} rows={rows} fs={FS} lh={LH} ch={CH} scroll={scroll} />
          {/* the rule V17 closed under the header, inherited: it scrolls off with it */}
          <div
            style={{
              position: "absolute", left: 0, top: tops[1] + LH + 4 - scroll,
              width: WIN - 2 * PADX, height: 2, background: T.accent,
            }}
          />
          <Cursor y={tops[moves[mi].row] - scroll} accent={entered} />
        </div>
      }
      over={
        open > 0.002 ? (
          <>
            {/* the pane: a split of the same window, sliding in from its right edge */}
            <div
              style={{
                position: "absolute", left: PANEL_X, top: BAR, width: WIN - PANEL_X, height: H - BAR,
                background: T.windowBody, borderLeft: `2px solid ${T.fgDim}`,
                transform: `translateX(${(1 - open) * (WIN - PANEL_X)}px)`,
              }}
            >
              {/* the empty room: nothing in it but the agent */}
              <div
                style={{
                  position: "absolute", left: PANEL_PAD, top: 14, width: boxW, height: H - BAR - 28,
                  border: `2px dashed ${T.fgDim}`, boxSizing: "border-box",
                }}
              />
              {icon && (
                <Img
                  src={staticFile(icon)}
                  style={{
                    position: "absolute", left: boxX - PANEL_X + boxW / 2 - 68, top: 52, width: 136,
                    filter: "brightness(2.1) saturate(0.85)",
                  }}
                />
              )}
              <div
                style={{
                  position: "absolute", left: 0, top: 196, width: WIN - PANEL_X, textAlign: "center",
                  fontFamily: MONO, fontSize: FS, color: T.fgMuted, whiteSpace: "pre",
                }}
              >
                empty folder · no tools
              </div>
            </div>
            {/* the diff sheet, handed in and scanned */}
            {tMs >= B.sheet && (
              <div
                style={{
                  position: "absolute", left: sx, top: sy, width: 170, height: 92,
                  border: `1px solid ${T.fgDim}`, background: T.windowBody, overflow: "hidden",
                  opacity: clamp01((tMs - B.sheet) / 120),
                  // the sheet belongs to the room: it leaves with it
                  transform: `translateX(${(1 - open) * (WIN - PANEL_X)}px)`,
                }}
              >
                <div style={{ position: "absolute", left: 12, top: 14, fontFamily: MONO, fontSize: FS, color: T.accent, whiteSpace: "pre" }}>
                  <span style={{ color: T.accent }}>~ </span>
                  <span style={{ color: T.fg }}>hooks</span>
                </div>
                <div style={{ position: "absolute", left: 12, top: 50, width: 110, height: 4, background: T.fgDim }} />
                <div style={{ position: "absolute", left: 12, top: 64, width: 82, height: 4, background: T.fgDim }} />
                {scan > 0 && scan < 1 && (
                  <div style={{ position: "absolute", left: 0, top: 92 * scan, width: 170, height: 3, background: T.accent, opacity: 0.9 }} />
                )}
              </div>
            )}
          </>
        ) : null
      }
    />
  );
};
