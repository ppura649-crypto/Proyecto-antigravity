import React from "react";
import type { CardProps } from "../props";
import {
  BAR, DBLUE, DINK, DMUTED, FLAP_TOP, FOLDER_R, PAPER, RULE,
  DFolderBack, DFolderFlap, at, caretOn, clamp01, easeOut, mono, typed,
} from "./DShared";

// V15 "I built a skill called PROMPT IMPROVE that helped fix the talking half for me."
// The skill as the thing it actually is: a blue macOS folder, cropped by the card's bottom edge,
// with its SKILL.md rising out of the mouth. On "built" the sheet slides up; on "PROMPT IMPROVE"
// the file names itself (`name: prompt-improve` types, its value lands in their blue) and the folder
// takes the same name; on "talking half" the closing `---` slides down and the description types
// into the gap it opens. A caret waits at the end of the last written line, ~1 Hz, in between.

export type SkillFolderData = {
  tab?: string;
  folder?: string;
  fence?: string;
  nameLine?: string;
  highlight?: string;
  descLines?: string[];
};

// design px on a 994 x 620 card
const FW = 720, FH = FW * FOLDER_R, FX = (994 - FW) / 2, FY = 226;
const MOUTH = FY + FLAP_TOP * FH;          // 420.4: the flap's top edge
const SW = 620, SX = (994 - SW) / 2, SH = 374;
const TOP_BAR = 58, PAD_X = 26, BODY_TOP = 86, LH = 52, FS = 32;
const CHAR = FS * 0.6;                      // mono advance
const TAB_FS = 28, LABEL_FS = 38;

export const DSkillFolder: React.FC<CardProps & { data: SkillFolderData }> = ({ tMs, w, beats, data }) => {
  const k = w / 994;
  const P = (v: number) => v * k;
  const tab = data.tab ?? "SKILL.md";
  const folderName = data.folder ?? "prompt-improve/";
  const fence = data.fence ?? "---";
  const nameLine = data.nameLine ?? "name: prompt-improve";
  const hi = data.highlight ?? "prompt-improve";
  const desc = data.descLines ?? ["description: ramble in, a", "  structured clean prompt out"];
  const d0 = desc[0] ?? "", d1 = desc[1] ?? "";

  const bBuilt = beats.built ?? 49876;
  const bPrompt = beats.prompt ?? 50776;
  const bTalking = beats.talking ?? 52924;

  // the sheet rises out of the folder's mouth
  const rise = easeOut(at(tMs, bBuilt, 600));
  const restTop = MOUTH - 14;
  const sheetTop = restTop + (MOUTH - SH - restTop) * rise;

  // the file names itself
  const NAME_MS = 22;
  const nameShown = typed(nameLine, tMs, bPrompt, NAME_MS);
  const nameTyping = tMs >= bPrompt && nameShown.length < nameLine.length;
  const nameDone = bPrompt + nameLine.length * NAME_MS;
  const hiAt = nameLine.indexOf(hi);
  const hiP = easeOut(at(tMs, nameDone + 40, 260));

  // the folder takes the same name, a beat behind the file
  const label = typed(folderName, tMs, bPrompt + 120, 24);

  // the description types on "talking half": the closing fence slides down two rows, the way an
  // editor opens a line, and the two lines are written into the gap it leaves. Fast, so the
  // finished file holds ~0.6 s before the cut.
  const DESC_MS = 8, DESC_FROM = bTalking + 120;
  const n = Math.max(0, Math.floor((tMs - DESC_FROM) / DESC_MS));
  const shown0 = tMs >= DESC_FROM ? d0.slice(0, Math.min(n, d0.length)) : "";
  const shown1 = tMs >= DESC_FROM ? d1.slice(0, Math.max(0, Math.min(n - d0.length, d1.length))) : "";
  const descTyping = tMs >= DESC_FROM && shown0.length + shown1.length < d0.length + d1.length;
  const fenceRow = 2 + 2 * easeOut(at(tMs, bTalking, 200));

  // the caret waits at the end of the last written line, and leads the one being written
  const caret =
    tMs < bPrompt ? { row: 1, col: 0, on: caretOn(tMs, bBuilt + 600, false) }
    : nameTyping ? { row: 1, col: nameShown.length, on: true }
    : tMs < DESC_FROM ? { row: 1, col: nameLine.length, on: caretOn(tMs, nameDone, false) }
    : descTyping
      ? shown0.length < d0.length
        ? { row: 2, col: shown0.length, on: true }
        : { row: 3, col: shown1.length, on: true }
      : { row: 3, col: d1.length, on: caretOn(tMs, DESC_FROM + (d0.length + d1.length) * DESC_MS, false) };

  const line = (row: number, color: string = DINK): React.CSSProperties => ({
    position: "absolute",
    left: P(PAD_X),
    top: P(BODY_TOP + row * LH),
    ...mono(P(FS), color),
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* the folder's back plate; the card's bottom edge crops it */}
      <div style={{ position: "absolute", left: P(FX), top: P(FY), width: P(FW), height: P(FH) }}>
        <DFolderBack w={P(FW)} uid="d15" />
      </div>

      {/* SKILL.md, between the plates, rising out of the mouth */}
      <div
        style={{
          position: "absolute",
          left: P(SX),
          top: P(sheetTop),
          width: P(SW),
          height: P(SH),
          backgroundColor: PAPER,
          border: `${Math.max(1, P(1.5))}px solid ${RULE}`,
          boxSizing: "border-box",
          filter: `drop-shadow(0 ${P(10)}px ${P(22)}px rgba(20,22,31,${(0.10 + 0.18 * rise).toFixed(3)}))`,
        }}
      >
        <div
          style={{
            position: "absolute", left: 0, top: 0, width: "100%", height: P(TOP_BAR),
            backgroundColor: BAR, borderBottom: `${Math.max(1, P(1.5))}px solid ${RULE}`,
            boxSizing: "border-box",
          }}
        />
        <div style={{ position: "absolute", left: P(PAD_X), top: P(TOP_BAR / 2 - TAB_FS / 2), ...mono(P(TAB_FS), DINK) }}>
          {tab}
        </div>

        {/* the frontmatter: the opening fence is there from the start, the closing one slides */}
        <div style={line(0, DMUTED)}>{fence}</div>
        <div style={line(fenceRow, DMUTED)}>{fence}</div>

        {/* name: prompt-improve - the value lands in their blue */}
        {hiAt >= 0 && (
          <div
            style={{
              position: "absolute",
              left: P(PAD_X + hiAt * CHAR - 5),
              top: P(BODY_TOP + LH - 8),
              width: P((hi.length * CHAR + 10) * hiP),
              height: P(FS + 16),
              backgroundColor: DBLUE,
            }}
          />
        )}
        <div style={line(1)}>{nameShown}</div>

        {/* description: … - typed into the gap the fence opens */}
        <div style={line(2)}>{shown0}</div>
        <div style={line(3)}>{shown1}</div>

        {/* the caret: solid while it types, ~1 Hz while it waits */}
        <div
          style={{
            position: "absolute",
            left: P(PAD_X + caret.col * CHAR),
            top: P(BODY_TOP + caret.row * LH - 5),
            width: P(3),
            height: P(FS + 10),
            backgroundColor: DINK,
            opacity: caret.on ? 1 : 0,
          }}
        />
      </div>

      {/* the front flap, over the sheet's bottom, wearing the folder's name */}
      <div style={{ position: "absolute", left: P(FX), top: P(MOUTH), width: P(FW) }}>
        <DFolderFlap w={P(FW)} uid="d15" />
      </div>
      <div
        style={{
          position: "absolute",
          left: P(FX),
          top: P(MOUTH + 100 - LABEL_FS / 2),
          width: P(FW),
          textAlign: "center",
          ...mono(P(LABEL_FS), DINK),
          opacity: clamp01(label.length),
        }}
      >
        {label}
      </div>
    </div>
  );
};
