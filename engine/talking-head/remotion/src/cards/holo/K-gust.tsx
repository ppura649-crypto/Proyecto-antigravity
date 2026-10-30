import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { CH, CW, HAND, beatsOf, box, clamp, hash, mix, outC, pick, ramp, wrap, type KBeats } from "./K-util";
// h5v1 "Gust" (builder K): the plan is a wall of sticky notes, one to-do each. BECAME .. LIST: more notes slap on
// until the wall is covered. "you need to": a draft starts to rustle their bottom edges. WATCH: a gust from the left
// peels them off column by column; they tumble out of frame with depth and blur, and under them were three real
// ads the whole time (SKIMS / Crocs / SKIMS). The finished wall of ads holds under a slow push.

const ADS = [
  { src: "skims-3754964.jpg", x: 32, w: 290 },
  { src: "crocs-5139667.jpg", x: 332, w: 416 },
  { src: "skims-3755019.jpg", x: 758, w: 290 },
];
export const GUST_ASSETS = ADS.map((a) => a.src);
const AY = 57, AH = 520, N = 224, COLS = 5, ROWS = 3;
const NOTES = [
  "30-day plan", "Write 5 Instagram posts", "Shoot 3 product videos", "Design 4 ad creatives", "Draft the welcome emails",
  "Launch the Meta ads", "Post daily on TikTok", "Film 2 try-on videos", "Reply to every comment", "Test 2 headlines",
  "Write 2 blog posts", "Collect 3 reviews", "Email past buyers", "Retarget visitors", "Plan next month",
];

type Note = { i: number; cx: number; cy: number; rot: number; at: number };
const notesOf = (b: KBeats): Note[] => {
  const late = [b.became, b.another, b.another + 150, b.todo, b.todo + 180, b.todo + 360, b.list];
  return NOTES.map((_, i) => {
    const r = Math.floor(i / COLS), c = i % COLS;
    const at = i < 8 ? b.just - 400 : late[i - 8]!;
    return { i, at,
      cx: 32 + N / 2 + ((1016 - N) / (COLS - 1)) * c + (hash(i + 3) - 0.5) * 10,
      cy: AY + N / 2 + ((AH - N) / (ROWS - 1)) * r + (hash(i + 11) - 0.5) * 8,
      rot: (hash(i + 7) - 0.5) * 6 };
  });
};
const releaseOf = (n: Note, b: KBeats) => b.watch + ((n.cx - 32) / 1016) * 170 + hash(n.i + 29) * 45;

// where a note is at t: slapped on, rustling, peeled, then flying with the gust
const pose = (n: Note, t: number, b: KBeats) => {
  const slap = ramp(t, n.at, n.at + 150, outC);
  const draft = ramp(t, b.you, b.watch, (x) => x * x);
  const ph = hash(n.i + 41) * 6.28;
  const rustle = draft * (4 + 5 * hash(n.i + 5)) * (0.6 + 0.4 * Math.sin(t / 1000 * 13 + ph));
  const r = releaseOf(n, b);
  const peel = ramp(t, r - 140, r, (x) => x * x);
  const dt = Math.max(0, t - r) / 1000;
  const a = 4800 * (0.85 + 0.3 * hash(n.i + 13));
  const dx = 260 * dt + 0.5 * a * dt * dt;
  const dy = -170 * dt * (0.5 + hash(n.i + 17)) + 40 * Math.sin(dt * 9 + ph) * dt;
  const dz = 520 * dt * hash(n.i + 19);
  const spin = (hash(n.i + 23) > 0.5 ? 1 : -1) * (160 + 220 * hash(n.i + 31)) * dt;
  const flutX = dt > 0 ? 38 * Math.sin(dt * 15 + ph) : 0, flutY = dt > 0 ? 34 * Math.sin(dt * 11 + ph * 1.7) : 0;
  const speed = 260 + a * dt;
  return { slap, dx, dy, dz, spin, rx: rustle + 48 * peel + flutX, ry: flutY, lift: Math.max(peel, clamp(dt * 4)),
    blur: dt > 0 ? clamp((speed - 500) / 3000) * 5 : 0, gone: n.cx + dx - N > CW + 80 };
};

const Sticky: React.FC<{ n: Note; t: number; b: KBeats }> = ({ n, t, b }) => {
  const p = pose(n, t, b);
  if (p.slap <= 0 || p.gone) return null;
  const s = mix(1.22, 1, p.slap), sh = mix(1, 0, p.slap) + p.lift;
  return (
    <div style={{ position: "absolute", left: n.cx - N / 2, top: n.cy - N / 2, width: N, height: N,
      zIndex: p.lift > 0.01 ? 100 + n.i : n.i, transformOrigin: "50% 0%", opacity: clamp(p.slap * 4),
      transform: `perspective(1100px) translate3d(${p.dx}px, ${p.dy}px, ${p.dz}px) rotate(${n.rot + p.spin}deg) scale(${s}) rotateX(${p.rx}deg) rotateY(${p.ry}deg)`,
      filter: p.blur > 0.3 ? `blur(${p.blur}px)` : undefined }}>
      <div style={{ position: "absolute", inset: 0,
        background: "linear-gradient(180deg, #F3CF45 0px, #FBDC5E 34px, #FFE36E 36px, #FDDD62 100%)",
        boxShadow: `0 ${4 + 16 * sh}px ${10 + 26 * sh}px rgba(0,0,0,${0.42 + 0.15 * sh}), 0 1px 2px rgba(0,0,0,0.25)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 40,
        background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(120,80,0,0.10))" }} />
      <div style={{ position: "absolute", left: 20, top: 34, width: N - 52, fontFamily: HAND, fontWeight: 700,
        fontSize: n.i === 0 ? 44 : 38, lineHeight: 0.98, color: "#1f2230", letterSpacing: 0.2 }}>
        {n.i === 0 ? (
          <span style={{ borderBottom: "4px solid #D94B3A", paddingBottom: 2 }}>{NOTES[0]}</span>
        ) : (
          <span style={{ display: "flex", gap: 10 }}>
            <span style={{ width: 24, height: 24, border: "3px solid #1f2230", flexShrink: 0, marginTop: 8, borderRadius: 3 }} />
            <span>{NOTES[n.i]}</span>
          </span>
        )}
      </div>
    </div>
  );
};

export const Gust: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, beats, assets }) => {
  const b = beatsOf(beats);
  const notes = notesOf(b);
  const covered = t >= b.list + 150;             // the ads exist under the notes only once the wall is covered
  const reveal = ramp(t, b.watch, b.watch + 700, outC);
  // the wall is clipped to the band; the notes fly free of it (up and out to the right)
  return (
    <div style={{ ...box(w, h), overflow: "visible" }}>
      <div style={{ ...wrap(t, b, 0.04) }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden",
          background: "radial-gradient(ellipse 75% 85% at 50% 45%, #1b1b1f 0%, #0c0c0e 65%, #070708 100%)" }} />
        {covered && ADS.map((a) => (
          <Img key={a.src} src={staticFile(pick(assets, a.src))} style={{ position: "absolute", left: a.x, top: AY, width: a.w,
            height: AH, objectFit: "cover", transform: `scale(${mix(1.035, 1, reveal)})`,
            boxShadow: "0 22px 50px rgba(0,0,0,0.55), 0 6px 14px rgba(0,0,0,0.35)" }} />
        ))}
        <div style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH }}>
          {notes.map((n) => <Sticky key={n.i} n={n} t={t} b={b} />)}
        </div>
      </div>
    </div>
  );
};
