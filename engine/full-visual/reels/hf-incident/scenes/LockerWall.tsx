// Inside the package server: a deep wall of steel lockers. Folded notes slide into the vents; each post leaves a
// manila folder-tab label on the door (the notes were hidden in folder names), pinned by the cyan agent that wrote it.
// On "secret" every vent lights from inside and the wall becomes a message board; tiny agents gather on the doors
// while the counters run. Drawn at its final size (WALL); `Locker` scales it out of the server.
import React from "react";
import { loadFont } from "@remotion/google-fonts/Kalam";
import { ease, prog, useScene } from "../../../src/engine";
import { AGENT, AgentIcon, rand } from "./parts";
import { AgentMini } from "./AgentGlyph";

const kalam = loadFont("normal", { weights: ["400", "700"], subsets: ["latin"] });
export const HAND = kalam.fontFamily;

export const WALL = { left: 40, top: 560, w: 820, h: 880, head: 150 };
export const COLS = 3;
export const ROWS = 4;
const PAD = 20;
const STREAM = 20; // frames between two notes into the same vent while the counters run
const GAP = 14;
export const DOOR = { w: (WALL.w - PAD * 2 - GAP * (COLS - 1)) / COLS, h: (WALL.h - WALL.head - PAD - GAP * (ROWS - 1)) / ROWS };
export const doorPos = (i: number) => ({ x: PAD + (i % COLS) * (DOOR.w + GAP), y: WALL.head + Math.floor(i / COLS) * (DOOR.h + GAP) });

export type WallCues = {
  posts: { door: number; at: number; text: string }[];
  secret: number; board: number; agents: number; msgs: number; wrote: number; chosen: number;
};

/** a folded note sliding into a vent: ends inside the slot on `at` */
const Slide: React.FC<{ f: number; at: number; seed: number; dist?: number }> = ({ f, at, seed, dist = 110 }) => {
  if (f < at - 12 || f > at + 1) return null;
  const p = prog(f, at - 12, 9, ease.out); // flies to the vent
  const sink = prog(f, at - 3, 4, ease.in); // and is swallowed by the slot
  const s = 1.35 - 0.45 * p;
  return (
    <div style={{ position: "absolute", left: DOOR.w * 0.2 + (rand(seed, 2) - 0.5) * 24, top: 8 - (1 - p) * dist, width: 72, height: 38, transformOrigin: "50% 0", transform: `scale(${s.toFixed(3)}) scaleY(${(1 - sink * 0.85).toFixed(3)}) rotate(${((1 - p) * (rand(seed, 5) - 0.5) * 30).toFixed(1)}deg)`, opacity: 1 - prog(f, at - 1, 2, ease.linear), background: "linear-gradient(180deg, #FFFFFF 0 48%, #DCDCD6 52% 100%)", borderRadius: 3, boxShadow: "0 10px 18px rgba(0,0,0,0.5)" }} />
  );
};

/** handwriting that can't be read: the notes' real contents aren't public, so no words are invented for them */
const Scribble: React.FC<{ len: number; seed: number }> = ({ len, seed }) => {
  const w = Math.min(150, 40 + len * 9);
  const d = Array.from({ length: Math.round(w / 7) }, (_, i) => `${i === 0 ? "M" : "L"}${i * 7} ${16 + (rand(seed * 31 + i, 4) - 0.5) * 16}`).join(" ");
  return <svg width={w} height={32}><path d={d} stroke="#3C2E12" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};

/** the manila folder-tab label a post leaves on the door, pinned by its author (a small cyan AgentIcon) */
const Tag: React.FC<{ f: number; at: number; text: string; lit: number; seed: number }> = ({ f, at, text, lit, seed }) => {
  if (f < at) return null;
  const p = prog(f, at, 9, ease.back);
  const since = f - at;
  const pulse = since < 20 ? 1 - since / 20 : 0.25 + 0.25 * Math.sin(f * 0.1 + seed);
  return (
    <div style={{ position: "absolute", left: 16, top: 62, width: DOOR.w - 46, transform: `perspective(600px) rotateX(${((1 - p) * 80).toFixed(1)}deg) rotate(${((rand(seed, 8) - 0.5) * 5).toFixed(1)}deg)`, transformOrigin: "50% 0", opacity: prog(f, at, 3, ease.linear) }}>
      <div style={{ width: 70, height: 14, marginLeft: 10, borderRadius: "6px 6px 0 0", background: "#E8D29A" }} />
      <div style={{ height: 62, borderRadius: "0 6px 6px 6px", background: "linear-gradient(180deg, #F2DFAA, #DCC285)", boxShadow: `0 6px 12px rgba(0,0,0,0.45), 0 0 ${24 * lit}px rgba(255,220,140,${0.35 * lit})`, display: "flex", alignItems: "center", paddingLeft: 10, fontFamily: HAND, fontWeight: 700, fontSize: 32, color: "#3C2E12", whiteSpace: "nowrap", overflow: "hidden" }}>
        <Scribble len={text.length} seed={seed} />
      </div>
      <div style={{ position: "absolute", right: -16, top: -8 }}>
        <AgentIcon size={40} color={AGENT} state={pulse > 0.5 ? "active" : "idle"} glow={1 + 2 * pulse} seed={seed * 13 + 7} />
      </div>
    </div>
  );
};

const Door: React.FC<{ i: number; c: WallCues }> = ({ i, c }) => {
  const { f } = useScene();
  const { x, y } = doorPos(i);
  const lit = prog(f, c.secret - 8 + (i % COLS + Math.floor(i / COLS)) * 3, 10, ease.out);
  const flicker = lit * (0.8 + 0.2 * rand(Math.floor(f / 3) + i * 17, 6));
  const dim = f >= c.wrote && i !== c.chosen ? prog(f, c.wrote, 10, ease.out) * 0.6 : 0;
  const hot = i === c.chosen ? prog(f, c.wrote - 4, 8, ease.out) : 0;
  const posts = c.posts.filter((p) => p.door === i);
  const stream = f >= c.agents - 30 && f < c.msgs + 30 ? Math.floor((f - (c.agents - 30) - Math.round(rand(i, 3) * STREAM)) / STREAM) : -1;
  const crowd = Math.floor(prog(f, c.agents - 30, 30, ease.outHard) * 6);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: DOOR.w, height: DOOR.h, borderRadius: 6, opacity: 1 - dim, background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 2px, rgba(0,0,0,0.04) 2px 5px), linear-gradient(180deg, #465061, #2A313C 55%, #222831)", boxShadow: `inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -3px 0 rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.5), 0 0 ${50 * hot}px ${12 * hot}px rgba(90,200,250,0.6)`, border: "2px solid #10141A" }}>
      {/* vents: the slots notes go through, lit from inside once the board is live */}
      {[0, 1, 2, 3].map((v) => (
        <div key={v} style={{ position: "absolute", left: 18, top: 12 + v * 11, width: DOOR.w * 0.52, height: 6, borderRadius: 3, background: flicker > 0.05 ? `rgba(90,200,250,${0.25 + 0.75 * flicker})` : "#0B0E12", boxShadow: flicker > 0.05 ? `0 0 ${14 * flicker}px rgba(90,200,250,${0.8 * flicker})` : "inset 0 2px 2px #000" }} />
      ))}
      <div style={{ position: "absolute", right: 14, top: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: "#8792A0" }}>{String(i + 1).padStart(2, "0")}</div>
      {/* the handle */}
      <div style={{ position: "absolute", right: 16, top: DOOR.h * 0.36, width: 12, height: 58, borderRadius: 6, background: "linear-gradient(90deg, #6E7885, #D5DBE2 45%, #58616C)", boxShadow: "2px 4px 6px rgba(0,0,0,0.5)" }} />
      {posts.map((p, k) => (
        <React.Fragment key={k}>
          <Slide f={f} at={p.at} seed={i * 7 + k} />
          <Tag f={f} at={p.at + 2} text={p.text} lit={lit} seed={i} />
        </React.Fragment>
      ))}
      {/* while the counters run, notes keep pouring into every vent: one at a time per door, clipped to the door */}
      {stream >= 0 && (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 6 }}>
          <Slide f={f} at={c.agents - 30 + stream * STREAM + Math.round(rand(i, 3) * STREAM) + 12} seed={i * 31 + stream} dist={46} />
        </div>
      )}
      {/* the agents gathering on this door while the count runs */}
      <div style={{ position: "absolute", left: 14, bottom: 4, display: "flex", gap: 3 }}>
        {Array.from({ length: crowd }).map((_, k) => {
          const pz = 0.5 + 0.5 * Math.sin(f * 0.2 + k * 1.3 + i);
          return <AgentMini key={k} size={24} color={AGENT} glow={0.4 + 0.6 * pz} style={{ transform: `translateY(${(-2 * pz).toFixed(1)}px)` }} />;
        })}
      </div>
    </div>
  );
};

/** the whole wall: a steel frame, the head strip (its children: plate, sign, counters), the doors */
export const Wall: React.FC<{ c: WallCues; head: React.ReactNode }> = ({ c, head }) => {
  const { f } = useScene();
  const glow = prog(f, c.secret, 14, ease.out);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: WALL.w, height: WALL.h }}>
      <div style={{ position: "absolute", inset: -10, borderRadius: 20, background: "linear-gradient(180deg, #252B34, #0E1115)", boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 ${90 * glow}px rgba(90,200,250,${0.22 * glow}), inset 0 2px 0 rgba(255,255,255,0.12)` }} />
      <div style={{ position: "absolute", left: 10, right: 10, top: WALL.head - 4, bottom: 6, borderRadius: 10, background: "#07090C", boxShadow: "inset 0 10px 30px #000" }} />
      {Array.from({ length: COLS * ROWS }).map((_, i) => <Door key={i} i={i} c={c} />)}
      {/* a ceiling light raking down the doors */}
      <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: "radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,0.10), transparent 60%)", pointerEvents: "none" }} />
      {head}
    </div>
  );
};
