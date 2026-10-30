import React from "react";
import { Easing, Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { MONO, TODOS, beatsOf, box, clamp, hash, mix, pick, ramp, wrap, type KBeats } from "./K-util";
// h5v5 "Gravity" (builder K): the plan, typed out as a markdown to-do list on a sheet. BECAME .. LIST: rows keep
// streaming in. WATCH: gravity switches on, every character lets go, falls, bounces and piles at the bottom of the
// sheet. THIS: a real Crocs ad drops in from above and lands on the pile with weight, kicking the letters aside.
// The ad holds on the sheet under a slow push.

const SX = 190, SY = 30, SWD = 700, SHT = 574;             // the sheet
const FS = 27, CWD = FS * 0.6, HFS = 32, ROW = 50, R0 = 118, PAD = 46;
const FLOOR = SHT - 16;                                    // glyph baseline floor inside the sheet
const G = 8200, E = 0.28;                                  // px/s^2, bounce restitution
const AD = { src: "crocs-5139667.jpg", w: 424, h: 530 };
export const GRAVITY_ASSETS = [AD.src];
const AX = (1080 - AD.w) / 2 - SX, AY = 40;                // the ad's rest, sheet coords

type Glyph = { k: number; ch: string; x: number; y: number; size: number; row: number; col: number; bold: boolean };
const ROWS = ["# 30-day marketing plan", ...TODOS.slice(0, 8).map((x) => `- [ ] ${x}`)];
const GLYPHS: Glyph[] = ROWS.flatMap((line, row) => [...line].map((ch, col) => ({
  k: row * 100 + col, ch, row, col, bold: row === 0, size: row === 0 ? HFS : FS,
  x: PAD + col * (row === 0 ? HFS * 0.6 : CWD), y: row === 0 ? 34 : R0 + (row - 1) * ROW,
}))).filter((g) => g.ch !== " ");

const typedAt = (row: number, b: KBeats) => (row < 4 ? b.just - 600 : b.became + ((b.list - b.became) / 5) * (row - 4));
const typed = (g: Glyph, t: number, b: KBeats) => {
  const n = ROWS[g.row]!.length, at = typedAt(g.row, b);
  return t >= at + (g.col / n) * 170;
};

// vertical drop with one bounce, from rest at y0 onto the floor
const drop = (h: number, dt: number) => {
  if (dt <= 0) return 0;
  const t1 = Math.sqrt((2 * h) / G);
  if (dt < t1) return 0.5 * G * dt * dt;
  const v2 = E * G * t1, t2 = (2 * v2) / G, d2 = dt - t1;
  return d2 < t2 ? h - (v2 * d2 - 0.5 * G * d2 * d2) : h;
};

const Char: React.FC<{ g: Glyph; t: number; b: KBeats; land: number }> = ({ g, t, b, land }) => {
  const rel = b.watch + hash(g.k + 1) * 150 + (8 - g.row) * 6;
  const dt = Math.max(0, t - rel) / 1000;
  const h = FLOOR - (g.y + g.size) - hash(g.k + 2) * 22;
  const y = g.y + drop(h, dt);
  const vx = (hash(g.k + 3) - 0.5) * 220;
  let x = g.x + (vx * (1 - Math.exp(-dt * 5))) / 5;
  const cx = SX + x;
  if (t > land && Math.abs(cx - 540) < 330) {                // the ad's landing shoves the pile outwards
    const s = cx < 540 ? -1 : 1, k = (1 - Math.exp(-((t - land) / 1000) * 7)) / 7;
    x += s * (620 - Math.abs(cx - 540)) * 1.6 * k;
  }
  const rot = dt > 0 ? (hash(g.k + 4) - 0.5) * 540 * (1 - Math.exp(-dt * 4)) / 4 : 0;
  return (
    <span style={{ position: "absolute", left: x, top: y, fontFamily: MONO, fontSize: g.size, fontWeight: g.bold ? 700 : 500,
      lineHeight: 1, color: g.ch === "[" || g.ch === "]" || g.ch === "-" ? "#8a8a93" : "#141417", transform: `rotate(${rot}deg)` }}>{g.ch}</span>
  );
};

export const Gravity: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, beats, assets }) => {
  const b = beatsOf(beats);
  const FALL = 330, land = b.this + FALL;
  const fall = clamp((t - b.this) / FALL);
  const adY = t < b.this ? -900 : t < land ? mix(-760, AY, fall * fall) : AY;
  const squash = t >= land ? Math.sin(Math.PI * clamp((t - land) / 150)) : 0;
  const near = t < b.this ? 0 : clamp(fall * fall);
  const caretRow = ROWS.findIndex((_, r) => t < typedAt(r, b) + 170);
  const dip = squash * 0.012;
  return (
    <div style={box(w, h)}>
      <div style={{ ...wrap(t, b, 0.035, "50% 60%") }}>
        <div style={{ position: "absolute", left: SX, top: SY, width: SWD, height: SHT, background: "#FBFAF6", overflow: "hidden",
          boxShadow: "0 26px 60px rgba(0,0,0,0.55), 0 8px 18px rgba(0,0,0,0.35)", transform: `scale(${1 - dip})` }}>
          {GLYPHS.map((g) => (typed(g, t, b) ? <Char key={g.k} g={g} t={t} b={b} land={land} /> : null))}
          {t < b.watch && caretRow >= 0 && (() => {
            const r = caretRow, at = typedAt(r, b), n = Math.floor(ROWS[r]!.length * ramp(t, at, at + 170, Easing.linear));
            const cw = r === 0 ? HFS * 0.6 : CWD, y = r === 0 ? 34 : R0 + (r - 1) * ROW;
            return <div style={{ position: "absolute", left: PAD + n * cw + 2, top: y - 2, width: cw * 0.9, height: (r === 0 ? HFS : FS) + 6,
              background: "#141417", opacity: Math.floor(t / 260) % 2 ? 0.85 : 0.35 }} />;
          })()}
          {t >= b.this && (
            <>
              <div style={{ position: "absolute", left: AX + 12, top: AY + 20, width: AD.w - 24, height: AD.h - 16,
                background: "rgba(0,0,0,0.32)", filter: `blur(${mix(34, 10, near)}px)`, opacity: near * near }} />
              <Img src={staticFile(pick(assets, AD.src))} style={{ position: "absolute", left: AX, top: adY, width: AD.w, height: AD.h,
                objectFit: "cover", transformOrigin: "50% 100%", transform: `scale(${1 + squash * 0.02}, ${1 - squash * 0.03})`,
                filter: t < land ? `blur(${2.5 * fall}px)` : undefined,
                boxShadow: "0 18px 36px rgba(0,0,0,0.45), 0 4px 10px rgba(0,0,0,0.3)" }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
