import React from "react";
import type { CardProps } from "../props";
import { ACCENT, LABEL_FONT, MONO_FONT } from "../theme";
import { at, blinkOnce, clamp01, easeOut, typedLines } from "./CKit";

// reference edit J V1 (kind `cfile`), the hook's first object: the villain file as it sits in a repo.
// A light card, because a real artifact is what this is: an editor tab reading
// .claude/settings.json, the real SessionStart hook shape typing itself into the body, the
// command line flipping terracotta with a note beside the tab, and a terminal strip at the
// foot where `$ claude` is typed. The order on screen IS the claim: the file is already there
// when you type claude.
//   "AI" 125          the card pops with the tab and an empty { }
//   "CONFIG FILES" 485  the hooks block types in one breath
//   "CAN HACK" 1445   the command line flips terracotta, `runs on start` lands by the tab
//   "YOUR COMPUTER," 1625  the terminal strip opens and `$ claude` types, the caret blinks once

export type CFileData = {
  tab: string;        // the file's real path, on the tab
  empty: string;      // what the file shows before it fills
  json: string[];     // the real SessionStart hook shape, as it is written in the file
  hot: number;        // index of the line that runs the command
  note: string;       // the annotation beside the tab
  prompt: string;     // the shell line under the file
};

// a real file on a real screen: near-black ink on paper, one grey for punctuation
const INK = "#17181B";
const DIM = "#8A8F98";
const HAIR = "#E4E2DC";
const TAB_BG = "#EFEDE7";
const STRIP_BG = "#101216";

export const CFile: React.FC<CardProps & { data: CFileData }> = ({ tMs, w, h, beats, data }) => {
  const S = w / 972;
  const PAD = 26 * S;
  const TAB_TOP = 12 * S;
  const TAB_H = 44 * S;
  const MONO = 26 * S;
  const LH = 33 * S;
  const STRIP_H = 44 * S;

  const bAi = beats.ai ?? 0;
  const bConfig = beats.config ?? bAi + 360;
  const bHack = beats.hack ?? bConfig + 960;
  const bComputer = beats.computer ?? bHack + 180;

  // the body: an empty object first, then the hook block typing in one breath
  const filling = tMs >= bConfig;
  const lines = filling ? typedLines(data.json, tMs, bConfig, 890) : [data.empty];
  const typingDone = tMs >= bConfig + 890;

  // the command line flips terracotta on "CAN HACK"
  const hotK = at(tMs, bHack, 150);

  // the note lands beside the tab on the same word
  const noteK = at(tMs, bHack + 60, 220);

  // the terminal strip opens under the file on "YOUR COMPUTER,"
  const stripK = easeOut(at(tMs, bComputer, 170));
  const promptTxt = data.prompt.slice(
    0,
    Math.ceil(data.prompt.length * clamp01((tMs - (bComputer + 180)) / 280))
  );
  const caret = blinkOnce(tMs, bComputer + 480);

  const mono = (px: number, color: string): React.CSSProperties => ({
    fontFamily: MONO_FONT, fontSize: px, color, lineHeight: `${LH}px`, whiteSpace: "pre",
  });

  const bodyTop = TAB_TOP + TAB_H + 10 * S;

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#FFFFFF", overflow: "hidden" }}>
      {/* the rule the tab sits on: the top edge of the file itself */}
      <div style={{ position: "absolute", left: 0, right: 0, top: TAB_TOP + TAB_H - 2 * S, height: 2 * S, backgroundColor: HAIR }} />

      {/* the editor tab, with a page glyph and the real path */}
      <div
        style={{
          position: "absolute", left: PAD, top: TAB_TOP, height: TAB_H,
          backgroundColor: TAB_BG, display: "flex", alignItems: "center",
          paddingLeft: 14 * S, paddingRight: 18 * S, gap: 10 * S,
        }}
      >
        <svg width={20 * S} height={24 * S} viewBox="0 0 20 24" style={{ display: "block" }}>
          <title>file</title>
          <path d="M2.5 1.5 h9 l6 6 v15 h-15 z" fill="none" stroke={DIM} strokeWidth={1.8} />
          <path d="M11.5 1.5 v6 h6" fill="none" stroke={DIM} strokeWidth={1.8} />
        </svg>
        <span style={{ ...mono(MONO, INK), lineHeight: `${TAB_H}px` }}>{data.tab}</span>
      </div>

      {/* the note beside the tab: what that command line means */}
      <div
        style={{
          position: "absolute", right: PAD, top: TAB_TOP, height: TAB_H,
          display: "flex", alignItems: "center", gap: 10 * S,
          opacity: noteK, transform: `translateX(${(1 - easeOut(noteK)) * 16 * S}px)`,
        }}
      >
        <div style={{ width: 11 * S, height: 11 * S, backgroundColor: ACCENT }} />
        <span style={{
          fontFamily: LABEL_FONT, fontSize: 30 * S, letterSpacing: "0.09em",
          textTransform: "uppercase", color: ACCENT, whiteSpace: "nowrap",
        }}>{data.note}</span>
      </div>

      {/* the file body */}
      <div style={{ position: "absolute", left: PAD, top: bodyTop, right: PAD }}>
        {lines.map((ln, i) => {
          const hot = filling && i === data.hot;
          const last = lines.filter((l) => l.length > 0).length - 1;
          return (
            <div key={i} style={{ ...mono(MONO, INK), position: "relative" }}>
              <span style={{ opacity: hot ? 1 - hotK : 1 }}>{ln}</span>
              {hot && (
                <span style={{ ...mono(MONO, ACCENT), position: "absolute", left: 0, top: 0, opacity: hotK }}>{ln}</span>
              )}
              {filling && !typingDone && i === last && (
                <span style={{
                  display: "inline-block", width: 13 * S, height: 26 * S,
                  backgroundColor: INK, verticalAlign: "text-bottom", marginLeft: 2 * S,
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* the shell under the file: the thing you type, and the file is already there */}
      <div
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: STRIP_H * stripK,
          backgroundColor: STRIP_BG, overflow: "hidden",
          display: "flex", alignItems: "center", paddingLeft: PAD,
        }}
      >
        <span style={{ ...mono(MONO, "#7D8794"), lineHeight: `${STRIP_H}px` }}>
          {promptTxt.slice(0, 1)}
          <span style={{ color: "#FFFFFF" }}>{promptTxt.slice(1)}</span>
        </span>
        <span style={{
          display: "inline-block", width: 13 * S, height: 26 * S, marginLeft: 4 * S,
          backgroundColor: "#FFFFFF", opacity: caret,
        }} />
      </div>
    </div>
  );
};
