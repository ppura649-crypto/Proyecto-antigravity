import React from "react";
import { Img, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { ACCENT } from "./theme";
import { NEWEST_FIRST } from "./ReelGridData";
import { IG_FONT, IG_HAIR, IG_INK, PlayCount, TabIcon, TileScrim } from "./ReelGridParts";

// edit-g-b V15: "the system is YOURS, you could technically continue making content with it
// FOREVER." Their own Instagram profile, in its real grammar: the handle, the Reels tab open, three
// columns of 9:16 covers with the play count in the corner. The frame pops empty on "system", a
// YOURS tag lands next to the handle, and from "continue" their 40 real reels pour into the slots
// newest first at one every 140 ms; once the visible rows are full the whole grid keeps sliding up
// at that same rate, so new rows never stop arriving and the card is cut mid-pour.
export type ReelGridData = {
  handle?: string;
  tag?: string;
  assetBase?: string; // the public folder the thumbnails were copied to
  avatar?: string;
  index?: string; // the source index, recorded on the event (entries live in ReelGridData.ts)
};

const PER = 140; // one reel every 140 ms: a RATE, never mapped over the card's life
const COLS = 3;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const ReelGrid: React.FC<CardProps & { data: ReelGridData }> = ({
  tMs, w, h, fps, fromMs, beats, data,
}) => {
  const base = data.assetBase ?? "edit-g-b-assets/";
  const reels = NEWEST_FIRST;

  // the surface: a profile screen, edge to edge, drawn at card scale
  const gap = Math.max(2, Math.round(0.0077 * w));
  const tw = (w - (COLS - 1) * gap) / COLS;
  const th = (tw * 16) / 9;
  const pitch = th + gap;

  const padX = 0.036 * w;
  const av = 0.128 * w;
  const idH = 0.108 * h;
  const tabH = 0.068 * h;
  const gridTop = idH + tabH;
  const viewH = h - gridTop;

  const rowsFull = Math.max(1, Math.floor(viewH / pitch));
  const cap = rowsFull * COLS; // the slots on screen: the pour scrolls once they are taken

  const handleFs = 0.075 * w;
  const tagFs = Math.max(26, 0.068 * w);
  const countFs = Math.max(26, 0.21 * tw);
  const iconSize = 0.063 * w;

  const tagAt = beats.yours ?? fromMs + 450;
  const runAt = beats.continue ?? tagAt + 1020;

  const sp = (at: number) =>
    spring({ frame: Math.max(0, ((tMs - at) / 1000) * fps), fps, config: { damping: 16, stiffness: 320, mass: 0.7 } });

  const tagS = sp(tagAt);
  const tagOn = tMs >= tagAt;

  // the pour: a continuous front, so the grid slides at exactly the rate the tiles arrive
  const front = Math.max(0, (tMs - runAt) / PER);
  const placed = tMs >= runAt ? Math.floor((tMs - runAt) / PER) + 1 : 0;
  const scrollY = Math.max(0, ((front - cap) / COLS) * pitch);

  const firstRow = Math.floor(scrollY / pitch);
  const lastRow = firstRow + Math.ceil(viewH / pitch) + 1;

  const slots: React.ReactNode[] = [];
  for (let r = firstRow; r <= lastRow; r++) {
    for (let c = 0; c < COLS; c++) {
      slots.push(
        <div
          key={`s${r}-${c}`}
          style={{
            position: "absolute", left: c * (tw + gap), top: r * pitch, width: tw, height: th,
            boxSizing: "border-box", border: `1px solid ${IG_HAIR}`, background: "#FBFAF7",
          }}
        />,
      );
    }
  }

  const tiles: React.ReactNode[] = [];
  for (let i = 0; i < placed; i++) {
    const row = Math.floor(i / COLS);
    if (row < firstRow - 1) continue;
    const col = i % COLS;
    const at = runAt + i * PER;
    const s = sp(at);
    const f = ((tMs - at) / 1000) * fps;
    const entry = reels[i % reels.length]!;
    tiles.push(
      <div
        key={`t${i}`}
        style={{
          position: "absolute", left: col * (tw + gap), top: row * pitch, width: tw, height: th,
          transform: `scale(${(0.9 + 0.1 * Math.min(1, s)).toFixed(4)})`,
          opacity: clamp01(f / 1.5),
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile(base + entry.thumb)}
          style={{ width: tw, height: th, objectFit: "cover", display: "block" }}
        />
        <TileScrim h={th * 0.34} />
        <PlayCount n={entry.plays} fs={countFs} pad={0.085 * tw} />
      </div>,
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", overflow: "hidden" }}>
      {/* the identity row: their real profile picture, their handle in the page's own face */}
      <div style={{ position: "absolute", left: padX, top: 0, height: idH, display: "flex", alignItems: "center" }}>
        <Img
          src={staticFile(base + (data.avatar ?? "guest-avatar.png"))}
          style={{ width: av, height: av, borderRadius: "50%", objectFit: "cover", display: "block" }}
        />
        <span style={{
          marginLeft: 0.028 * w, fontFamily: IG_FONT, fontSize: handleFs, fontWeight: 600,
          color: IG_INK, letterSpacing: -0.2, lineHeight: 1, whiteSpace: "nowrap",
        }}>{data.handle ?? "@guest"}</span>
        {tagOn && (
          <span style={{
            marginLeft: 0.026 * w, padding: `${0.20 * tagFs}px ${0.44 * tagFs}px ${0.24 * tagFs}px`,
            background: ACCENT, color: "#FFFFFF", fontFamily: IG_FONT, fontSize: tagFs, fontWeight: 700,
            letterSpacing: 0.055 * tagFs, lineHeight: 1, whiteSpace: "nowrap",
            transform: `scale(${(0.86 + 0.14 * Math.min(1, tagS)).toFixed(4)})`, transformOrigin: "left center",
            opacity: clamp01(((tMs - tagAt) / 1000) * fps / 1.5),
          }}>{data.tag ?? "YOURS"}</span>
        )}
      </div>

      {/* the tab row, Reels open */}
      <div style={{ position: "absolute", left: 0, top: idH, width: w, height: tabH }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: w, height: 1, background: IG_HAIR }} />
        {(["grid", "reels", "tagged"] as const).map((k, i) => (
          <div key={k} style={{
            position: "absolute", left: (i * w) / 3, top: 0, width: w / 3, height: tabH,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <TabIcon kind={k} size={iconSize} on={k === "reels"} />
          </div>
        ))}
        <div style={{
          position: "absolute", left: w / 3, bottom: 0, width: w / 3,
          height: Math.max(2, 0.0062 * w), background: IG_INK,
        }} />
      </div>

      {/* the grid: the slots, and their real reels pouring into them */}
      <div style={{ position: "absolute", left: 0, top: gridTop, width: w, height: viewH, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: -scrollY, width: w }}>
          {slots}
          {tiles}
        </div>
      </div>
    </div>
  );
};
