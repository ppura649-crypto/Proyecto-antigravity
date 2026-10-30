import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import {
  BRepoGlyph, BCheck, clamp01, easeIO, easeOut, at, mono, INK, MUTED, ACCENT, PANEL, RULE,
} from "./BShared";

// V1b (edit-j-b, hook 2) "a GitHub project stole all my passwords, and all I did was
// starting a new session with Claude."
// The card hangs from the band's ceiling so the hook title at 0.253H stays readable under it.
// Left the GitHub mark, centre the repo tile with a row of password dots under it that drains
// dot by dot INTO the tile while the tile fills with black, right the `$ claude` prompt that
// is the only thing the creator actually did. It cuts on the frame the punch stack lands.

export type StolenData = { repo?: string; stars?: string; tag?: string; dots?: number };

const MARK_X = 76, MARK_H = 90;
const TILE_X = 240, TILE_Y = 46, TILE_W = 380, TILE_H = 102;
const DOT_D = 20, DOT_STEP = 34, DOT_Y = 176;
const PROMPT_X = 698;

export const BStolen: React.FC<CardProps & { data: StolenData }> = ({ tMs, w, beats, assets, data }) => {
  const k = w / 972;
  const P = (v: number) => v * k;
  const repo = data.repo ?? "awesome-project";
  const stars = data.stars ?? "1.2k";
  const tag = data.tag ?? "passwords";
  const n = data.dots ?? 8;

  const bStole = beats.stole ?? 727;
  const bClaude = beats.claude ?? 2347;

  // each dot leaves on its own beat and is drunk by the tile
  const leave = (i: number) => easeIO(at(tMs, bStole + 120 + i * 86, 330));
  let filled = 0;
  for (let i = 0; i < n; i++) filled += leave(i) / n;

  const typed = "claude".slice(0, Math.round(easeOut(at(tMs, bClaude, 400)) * 6));
  const caretOn = Math.floor(tMs / 270) % 2 === 0;   // the prompt waits, blinking, the whole time

  const dotsW = n * DOT_D + (n - 1) * (DOT_STEP - DOT_D);
  const dotsX = TILE_X + (TILE_W - dotsW) / 2;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* the mark, nothing behind it */}
      <Img
        src={staticFile(assets[0])}
        style={{ position: "absolute", left: P(MARK_X), top: P(94), height: P(MARK_H), width: "auto" }}
      />

      {/* the repo, and the black it fills with */}
      <div
        style={{
          position: "absolute", left: P(TILE_X), top: P(TILE_Y), width: P(TILE_W), height: P(TILE_H),
          backgroundColor: PANEL, border: `${Math.max(1, P(2))}px solid ${RULE}`, boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: P(18), top: P(20), opacity: 1 - 0.5 * filled }}>
          <BRepoGlyph size={P(24)} />
        </div>
        <div style={{ position: "absolute", left: P(50), top: P(16), ...mono(P(28), INK), opacity: 1 - 0.5 * filled }}>{repo}</div>
        <div style={{ position: "absolute", left: P(18), top: P(60), ...mono(P(26), MUTED), opacity: 1 - 0.55 * filled }}>{`★ ${stars}`}</div>
        <div style={{ position: "absolute", left: P(322), top: P(56), opacity: 1 - 0.55 * filled }}><BCheck size={P(28)} /></div>
        {/* the level of what it has swallowed */}
        <div
          style={{
            position: "absolute", left: 0, right: 0, bottom: 0, height: P(TILE_H * filled),
            background: "linear-gradient(180deg, rgba(224,120,80,0.45) 0%, rgba(0,0,0,0.6) 16%, rgba(0,0,0,0.95) 100%)",
          }}
        />
      </div>

      {/* the dots, draining one by one into the tile */}
      {Array.from({ length: n }, (_, i) => {
        const p = leave(i);
        const x0 = dotsX + i * DOT_STEP, y0 = DOT_Y;
        const x1 = TILE_X + TILE_W / 2 - DOT_D / 2, y1 = TILE_Y + TILE_H / 2 - DOT_D / 2;
        const x = x0 + (x1 - x0) * p;
        const y = y0 + (y1 - y0) * p - 26 * Math.sin(Math.PI * p);
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: P(x), top: P(y), width: P(DOT_D), height: P(DOT_D),
              borderRadius: "50%", backgroundColor: p > 0 ? ACCENT : INK,
              transform: `scale(${1 - 0.65 * p})`, opacity: clamp01((1 - p) * 2.6),
            }}
          />
        );
      })}

      {/* their word for what was taken */}
      <div
        style={{
          position: "absolute", left: P(TILE_X), top: P(212), width: P(TILE_W),
          textAlign: "center", ...mono(P(26), MUTED), lineHeight: 1.25,
          opacity: 1 - 0.62 * filled,
        }}
      >
        {tag}
      </div>

      {/* all the creator did */}
      <div style={{ position: "absolute", left: P(PROMPT_X), top: P(118), display: "flex", alignItems: "center", gap: P(12) }}>
        <span style={{ ...mono(P(36), MUTED) }}>$</span>
        <span style={{ ...mono(P(36), INK) }}>{typed}</span>
        <span
          style={{
            display: "inline-block", width: P(16), height: P(34), backgroundColor: INK,
            opacity: caretOn ? 0.6 : 0,
          }}
        />
      </div>
    </div>
  );
};
