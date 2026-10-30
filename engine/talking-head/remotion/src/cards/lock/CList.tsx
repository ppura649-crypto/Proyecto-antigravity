import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { ACCENT, INK, LABEL_FONT, MONO_FONT } from "../theme";
import { at, clamp01, easeOut, pop } from "./CKit";
import { Folder } from "../Skills";

// the unlit state of a dot: structure grey, bright enough to read at phone width
const DOT_GREY = "#6E747D";

// reference edit J V13 (kind `clist`), step 1: what the tool does first, as a matrix and not a count.
// Their real project folders on the left, the three coding agents as their own marks on the
// right, and a dot where a folder meets an agent. The creator says no number, so there is none here.
//   "First," 43933   the numeral lands, the card is otherwise empty
//   "lists" 44567    the folder rows land one per 90 ms, the three marks arrive dim
//   "that" 45587     grey dots fill the three columns
//   "Claude," 46327  the Claude mark lights and its column turns white
//   "Gemini," 46867  / "Codex." 47533  the same, one per name

export type CListData = { numeral: string; folders: string[]; assets?: string[] };

export const CList: React.FC<CardProps & { data: CListData }> = ({ tMs, w, h, beats, assets, data }) => {
  const s = w / 1015;
  const PAD = 40 * s;
  const folders = data.folders ?? [];
  const n = folders.length;

  const bFirst = beats.first ?? 0;
  const bLists = beats.lists ?? bFirst + 600;
  const bDots = beats.dots ?? bLists + 1000;
  const colAt = [beats.claude ?? bDots + 700, beats.gemini ?? bDots + 1200, beats.codex ?? bDots + 1900];

  const rowsTop = 112 * s;
  const pitch = Math.min(54 * s, (h - rowsTop - 30 * s) / Math.max(1, n));
  const rowY = (i: number) => rowsTop + pitch * i + pitch / 2;
  const colX = [560 * s, 730 * s, 900 * s];
  const MARK = 56 * s;

  const numK = easeOut(at(tMs, bFirst, 220));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* the signpost */}
      <div
        style={{
          position: "absolute", left: PAD, top: 18 * s,
          fontFamily: LABEL_FONT, fontWeight: 700, fontSize: 64 * s, lineHeight: 1,
          color: ACCENT, opacity: numK, transform: `scale(${pop(at(tMs, bFirst, 300))})`, transformOrigin: "0 50%",
        }}
      >
        {data.numeral}
      </div>

      {/* the three agents, as their own marks, nothing behind them */}
      {colX.map((x, c) => {
        const arrive = easeOut(at(tMs, bLists, 300));
        const lit = easeOut(at(tMs, colAt[c], 200));
        return (
          <div
            key={c}
            style={{
              position: "absolute", left: x - MARK / 2, top: 24 * s, width: MARK, height: MARK,
              opacity: arrive * (0.32 + 0.68 * lit),
              transform: `scale(${pop(at(tMs, colAt[c], 320))})`, transformOrigin: "50% 50%",
            }}
          >
            <Img src={staticFile(assets[c])} style={{ width: MARK, height: MARK, objectFit: "contain" }} />
          </div>
        );
      })}

      {/* every folder the creator has, one per 90 ms */}
      {folders.map((f, i) => {
        const k = easeOut(at(tMs, bLists + i * 90, 260));
        if (k <= 0) return null;
        return (
          <div
            key={f}
            style={{
              position: "absolute", left: PAD, top: rowY(i) - pitch / 2, height: pitch,
              display: "flex", alignItems: "center", gap: 16 * s,
              opacity: k, transform: `translateX(${(1 - k) * -22 * s}px)`,
            }}
          >
            <Folder w={40 * s} open={0} />
            <span style={{ fontFamily: MONO_FONT, fontSize: 30 * s, color: INK, whiteSpace: "pre" }}>{f}</span>
          </div>
        );
      })}

      {/* one dot where a folder meets an agent */}
      {folders.map((_, i) =>
        colX.map((x, c) => {
          const dk = easeOut(at(tMs, bDots + i * 45, 240));
          if (dk <= 0) return null;
          const wk = easeOut(at(tMs, colAt[c] + i * 55, 220));
          const d = 16 * s;
          return (
            <div key={`${i}-${c}`} style={{ position: "absolute", left: x - d / 2, top: rowY(i) - d / 2, width: d, height: d }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: DOT_GREY, opacity: dk * (1 - wk) }} />
              <div
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: INK,
                  opacity: dk * wk, transform: `scale(${1 + 0.35 * clamp01(wk) * (1 - clamp01(wk))})`,
                }}
              />
            </div>
          );
        })
      )}
    </div>
  );
};
