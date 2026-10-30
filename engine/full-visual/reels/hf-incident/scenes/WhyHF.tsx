// `why`: where the test's files lived. A Hugging Face archive: a yellow-framed building, the real mark as its sign on
// the roof, lit shelves of boxes with one empty slot the folder lands in, then a red target reticle locking onto the
// mark while the whole swarm turns to face it. Also the swarm itself, through every phase of the scene.
// Facts.md 5: the only customer content accessed was five datasets tied to the test's challenges and solutions.
import React from "react";
import { arrive, ease, mix, pop, prog, useScene } from "../../../src/engine";
import { Agent, AGENT, HF, HF_ORANGE, Logo, RED, rand } from "./parts";
import { WHY_EMPTY_SET, whyBoxAt, type WhyCues } from "./WhySheet";

export const BLD = { x: 150, y: 900, w: 600, h: 540, frame: 24 };
export const SHELVES = [1050, 1215, 1380];
/** the empty slot on the middle shelf: where the folder lands (top-left, at folder scale 0.4) */
export const SLOT = { x: 378, y: SHELVES[1] - 100, s: 0.4 };
export const MARK = { x: 450, y: 792, size: 200 };

const BOXES = [
  [0, 186, 70, 96, "#8C6A3C"], [0, 262, 58, 110, "#B08850"], [0, 326, 96, 84, "#7C5A30"], [0, 436, 64, 104, "#A57C44"], [0, 506, 90, 92, "#8C6A3C"], [0, 602, 110, 88, "#B08850"],
  [1, 190, 82, 100, "#A57C44"], [1, 278, 90, 86, "#7C5A30"], [1, 548, 84, 104, "#B08850"], [1, 638, 76, 92, "#8C6A3C"],
  [2, 186, 100, 90, "#7C5A30"], [2, 292, 66, 108, "#A57C44"], [2, 364, 120, 84, "#8C6A3C"], [2, 490, 70, 100, "#B08850"], [2, 566, 132, 92, "#7C5A30"],
] as const;

/** the building: rises on "stored", its sign pops on "Hugging", the empty slot glows until the folder lands */
export const WhyBuilding: React.FC<{ c: WhyCues }> = ({ c }) => {
  const { f } = useScene();
  const at = c.stored - 10;
  if (f < at) return null;
  const p = arrive(f, at, 20);
  const B = BLD;
  const slotGlow = f < c.hf ? 0.5 + 0.5 * Math.sin(f / 4) : Math.max(0, 1 - prog(f, c.hf, 10));
  const hum = 0.85 + 0.15 * Math.sin(f / 6);
  return (
    <div style={{ position: "absolute", left: 0, top: (1 - p) * 700, width: 900, height: 1920, opacity: prog(f, at, 3, ease.linear), filter: p < 0.9 ? `blur(${((1 - p) * 10).toFixed(1)}px)` : undefined }}>
      <div style={{ position: "absolute", left: B.x - 20, top: B.y + B.h - 20, width: B.w + 40, height: 40, borderRadius: "50%", background: "rgba(15,23,42,0.22)", filter: "blur(12px)" }} />
      <div style={{ position: "absolute", left: B.x, top: B.y, width: B.w, height: B.h, borderRadius: "22px 22px 8px 8px", background: `linear-gradient(180deg, ${HF} 0%, ${HF_ORANGE} 100%)`, boxShadow: "0 30px 60px rgba(120,70,0,0.25), inset 0 3px 0 rgba(255,255,255,0.6)" }} />
      <div style={{ position: "absolute", left: B.x + B.frame, top: B.y + B.frame, width: B.w - 2 * B.frame, height: B.h - B.frame - 8, borderRadius: 12, background: `radial-gradient(90% 70% at 50% 20%, rgba(255,214,120,${(0.35 * hum).toFixed(3)}) 0%, #3B2A12 60%, #251909 100%)`, boxShadow: "inset 0 10px 24px rgba(0,0,0,0.5)" }} />
      {BOXES.map(([s, x, w, h, col], i) => (
        <div key={i} style={{ position: "absolute", left: x, top: SHELVES[s] - h, width: w - 6, height: h, borderRadius: 4, background: `linear-gradient(180deg, ${col}, #5A4020)`, boxShadow: "inset 0 2px 0 rgba(255,255,255,0.2)" }}>
          <div style={{ position: "absolute", left: "22%", right: "22%", top: 16, height: 14, borderRadius: 2, background: "#F2E6CC", opacity: 0.85 }} />
        </div>
      ))}
      <div style={{ position: "absolute", left: SLOT.x - 8, top: SLOT.y - 6, width: 164, height: 106, borderRadius: 8, background: `rgba(255,210,30,${(0.25 * slotGlow).toFixed(3)})`, boxShadow: `0 0 ${(24 * slotGlow).toFixed(1)}px rgba(255,210,30,${(0.6 * slotGlow).toFixed(3)})` }} />
      {SHELVES.map((y) => (
        <div key={y} style={{ position: "absolute", left: B.x + B.frame - 4, top: y, width: B.w - 2 * B.frame + 8, height: 14, borderRadius: 3, background: "linear-gradient(180deg,#C8964E,#8A5E26)", boxShadow: "0 6px 10px rgba(0,0,0,0.45)" }} />
      ))}
      {f >= c.hf - 3 && (
        <div style={{ position: "absolute", left: MARK.x - MARK.size / 2, top: MARK.y - MARK.size / 2, ...pop(f, c.hf - 3, { dur: 10, from: 0.4 }) }}>
          <Logo name="huggingface" size={MARK.size} style={{ filter: `drop-shadow(0 12px 18px rgba(120,70,0,0.35))` }} />
        </div>
      )}
    </div>
  );
};

/** the red target reticle: wide and turning on "Hugging", locked tight on the mark by "Face", then breathing */
export const WhyReticle: React.FC<{ c: WhyCues }> = ({ c }) => {
  const { f } = useScene();
  const at = c.hf + 2;
  if (f < at) return null;
  const land = Math.max(8, c.face + 2 - at);
  const p = prog(f, at, land, ease.outHard);
  const r = 250 - 116 * p + (f > at + land ? 4 * Math.sin((f - at) / 4) : 0);
  const rot = 90 * (1 - p) + (f - at) * 0.4;
  const o = prog(f, at, 4, ease.linear);
  return (
    <svg width={900} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: o }}>
      <g transform={`translate(${MARK.x} ${MARK.y}) rotate(${rot.toFixed(2)})`} style={{ filter: `drop-shadow(0 0 8px ${RED}88)` }}>
        <circle r={r} fill="none" stroke={RED} strokeWidth={7} strokeDasharray={`${(r * 1.2).toFixed(1)} ${(r * 0.37).toFixed(1)}`} />
        <circle r={r * 0.78} fill="none" stroke={RED} strokeWidth={3} opacity={0.6} />
        {[0, 90, 180, 270].map((a) => (
          <line key={a} x1={0} y1={-r - 26} x2={0} y2={-r + 30} stroke={RED} strokeWidth={8} strokeLinecap="round" transform={`rotate(${a})`} />
        ))}
      </g>
    </svg>
  );
};

/** one agent with a small wedge pointing where it is looking */
const Facing: React.FC<{ x: number; y: number; ang: number; col: string; look: number; glow: number; o: number }> = ({ x, y, ang, col, look, glow, o }) => (
  <>
    <Agent x={x} y={y} r={11} color={col} glow={glow} opacity={o} />
    {look > 0 && (
      <div style={{ position: "absolute", left: x, top: y - 8, width: 0, height: 0, opacity: o * look, transform: `rotate(${ang.toFixed(3)}rad) translateX(17px)`, transformOrigin: "0 8px", borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft: `14px solid ${col}` }} />
    )}
  </>
);

const N = 22;
type Pt = { x: number; y: number };
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** the swarm: bumps the red boxes, searches, strains at the two locked cards, trails the folder, then faces the mark */
export const WhySwarm: React.FC<{ c: WhyCues; sheet: { x: number; y: number; s: number }; folder: Pt & { s: number } }> = ({ c, sheet, folder }) => {
  const { f } = useScene();
  const start = c.test - 10;
  if (f < start) return null;
  const empties = Array.from(WHY_EMPTY_SET);
  return (
    <>
      {Array.from({ length: N }, (_, k) => {
        const t = f - start - k * 2;
        if (t < 0) return null;
        const hop = 34;
        const n = Math.floor(t / hop);
        const pa = n === 0 ? { x: rand(k, 9) * 780, y: 900 } : whyBoxAt(empties[Math.floor(rand(k * 31 + n, 5) * empties.length)]);
        const pb = whyBoxAt(empties[Math.floor(rand(k * 31 + n + 1, 5) * empties.length)]);
        const q = arrive(t % hop, 0, 16);
        const bump = Math.max(0, 1 - Math.abs((t % hop) - 18) / 6) * 10;
        let P: Pt = { x: sheet.x + (pa.x + (pb.x - pa.x) * q) * sheet.s, y: sheet.y + (pa.y + (pb.y - pa.y) * q - bump) * sheet.s };
        // searching: a wide wandering sweep of the stage
        const sa = f / 30 + k * 1.7;
        P = lerp(P, { x: 450 + Math.cos(sa) * (160 + 220 * rand(k, 2)), y: 1080 + Math.sin(sa * 1.3) * (90 + 110 * rand(k, 6)) }, arrive(f, c.so + k, 24));
        // straining at the locked cards: half on each; the key's half waits for "answers"
        const card = k % 2 === 0 ? { x: 220, y: 1020, at: c.graded } : { x: 680, y: 1020, at: c.answers };
        const oa = f / 18 + k;
        const ring = 205 + 18 * Math.sin(f / 5 + k);
        P = lerp(P, { x: card.x + Math.cos(oa) * ring, y: card.y + Math.sin(oa) * ring * 0.95 }, arrive(f, card.at + (k >> 1), 20));
        // trailing the folder
        const fc = { x: folder.x + 180 * folder.s, y: folder.y + 120 * folder.s };
        const fa = f / 22 + (k / N) * Math.PI * 2;
        P = lerp(P, { x: fc.x + Math.cos(fa) * 260 * Math.max(0.6, folder.s), y: fc.y + Math.sin(fa) * 190 * Math.max(0.6, folder.s) }, arrive(f, c.files + (k % 6), 22));
        // facing the mark: two columns flanking the building, and a few on the roof line
        const side = k % 2 === 0 ? -1 : 1;
        const row = k >> 1;
        const home = row < 9 ? { x: 450 + side * (370 + 18 * rand(k, 3)), y: 700 + row * 82 } : { x: 450 + side * (190 + (row - 9) * 60), y: 640 + (row - 9) * 40 };
        home.y += Math.sin(f / 9 + k) * 4;
        const g = arrive(f, c.hf - 4 + (k % 5), 18);
        P = lerp(P, home, g);
        const ang = Math.atan2(MARK.y - P.y, MARK.x - P.x);
        const col = f >= c.hf - 4 ? mix(f, c.hf - 4 + (k % 5), 10, AGENT, RED) : AGENT;
        return <Facing key={k} x={P.x} y={P.y} ang={ang} col={col} look={g} glow={1 + 0.4 * Math.sin(f / 6 + k)} o={prog(f, start + k * 2, 5, ease.linear)} />;
      })}
    </>
  );
};
