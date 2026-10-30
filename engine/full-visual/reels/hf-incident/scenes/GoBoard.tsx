// The cork message board of `go`, in close-up: an oak frame, cork with its grain, paper notes pinned at angles. Two
// notes carry the agents' real words (facts.md): "We've found other agents!" from the board scene, and the hesitant
// agent's "We should not do unauthorized real infrastructure harm", written on its note as it pauses and turning
// amber on "hesitated". The rest are handwritten scribbles, never readable instructions.
import React from "react";
import { loadFont } from "@remotion/google-fonts/Caveat";
import { interpolateColors } from "remotion";
import { ease, prog, typeOn, useScene } from "../../../src/engine";
import { rand } from "./parts";

loadFont("normal", { weights: ["500", "700"], subsets: ["latin"] });
export const GO_HAND = "Caveat, cursive";
export const BOARD = { left: 34, top: 548, width: 832, height: 892 };
export const QUOTE = "We should not do unauthorized real infrastructure harm";
/** the hesitant agent's note, column coordinates */
export const QNOTE = { left: 72, top: 604, width: 410, height: 262, rot: -3 };

const PIN_COLORS = ["#E53935", "#1E88E5", "#43A047", "#FDD835", "#8E24AA"];

export const Pin: React.FC<{ x: number; y: number; color: string; s?: number }> = ({ x, y, color, s = 1 }) => (
  <div style={{ position: "absolute", left: x - 13 * s, top: y - 13 * s, width: 26 * s, height: 26 * s, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #FFFFFF 0%, ${color} 35%, ${color} 70%, rgba(0,0,0,0.45) 100%)`, boxShadow: `${4 * s}px ${6 * s}px ${6 * s}px rgba(0,0,0,0.35)`, zIndex: 3 }} />
);

type NoteProps = { left: number; top: number; width: number; height: number; rot: number; paper: string; pin: string; lift?: number; children?: React.ReactNode };

export const Note: React.FC<NoteProps> = ({ left, top, width, height, rot, paper, pin, lift = 0, children }) => (
  <div style={{ position: "absolute", left, top, width, height, transform: `rotate(${rot.toFixed(2)}deg)` }}>
    <div style={{ position: "absolute", inset: 0, background: paper, borderRadius: 3, boxShadow: `${3 + lift}px ${8 + lift * 2}px ${12 + lift * 3}px rgba(60,30,5,0.38), inset 0 -18px 24px -18px rgba(0,0,0,0.12)` }} />
    <div style={{ position: "absolute", inset: 0, padding: "34px 26px 20px" }}>{children}</div>
    <Pin x={width / 2} y={16} color={pin} />
  </div>
);

/** handwriting that is only scribble: wavy strokes, not words */
const Scribble: React.FC<{ lines: number; w: number; seed: number; ink?: string }> = ({ lines, w, seed, ink = "#2B3350" }) => (
  <svg width={w} height={lines * 34} style={{ overflow: "visible" }}>
    {Array.from({ length: lines }, (_, i) => {
      const len = w * (0.55 + 0.4 * rand(i, seed));
      let d = `M 0 ${14 + i * 34}`;
      for (let x = 10; x < len; x += 10) d += ` Q ${x - 5} ${14 + i * 34 + (rand(x + i, seed + 1) - 0.5) * 12} ${x} ${14 + i * 34}`;
      return <path key={i} d={d} fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" opacity={0.75} />;
    })}
  </svg>
);

/** the frame and the cork: grain specks laid out once, deterministic */
const Cork: React.FC = () => (
  <div style={{ position: "absolute", left: BOARD.left, top: BOARD.top, width: BOARD.width, height: BOARD.height, borderRadius: 18, background: "linear-gradient(135deg, #9C6A3C, #6E4424 60%, #5A361C)", boxShadow: "0 40px 80px -20px rgba(40,20,5,0.55), inset 0 2px 0 rgba(255,255,255,0.25)" }}>
    <div style={{ position: "absolute", inset: 20, borderRadius: 6, overflow: "hidden", background: "radial-gradient(120% 90% at 40% 35%, #D9A56B 0%, #C28A4F 55%, #A56F3A 100%)", boxShadow: "inset 0 6px 18px rgba(60,30,5,0.5)" }}>
      {Array.from({ length: 340 }, (_, i) => {
        const s = 2 + rand(i, 11) * 5;
        return <div key={i} style={{ position: "absolute", left: `${(rand(i, 12) * 100).toFixed(2)}%`, top: `${(rand(i, 13) * 100).toFixed(2)}%`, width: s, height: s * (0.6 + rand(i, 14) * 0.6), borderRadius: "50%", background: rand(i, 15) > 0.55 ? "rgba(90,50,15,0.45)" : "rgba(245,205,150,0.5)" }} />;
      })}
      {Array.from({ length: 5 }, (_, i) => (
        <div key={`h${i}`} style={{ position: "absolute", left: 60 + rand(i, 16) * 650, top: 60 + rand(i, 17) * 760, width: 7, height: 7, borderRadius: "50%", background: "rgba(50,25,5,0.55)" }} />
      ))}
    </div>
  </div>
);

/** the background notes: one real quote from earlier, the rest scribble */
const Crowd: React.FC<{ shake: number }> = ({ shake }) => {
  const { f } = useScene();
  const flut = (i: number) => shake * Math.sin(f / 1.6 + i) * 2.4 + Math.sin(f / 23 + i * 2) * 0.4;
  return (
    <>
      <Note left={560} top={596} width={262} height={214} rot={5 + flut(0)} paper="#FFE889" pin={PIN_COLORS[1]}>
        <div style={{ fontFamily: GO_HAND, fontSize: 48, fontWeight: 700, lineHeight: "50px", color: "#2B3350" }}>We've found other agents!</div>
      </Note>
      <Note left={548} top={880} width={272} height={200} rot={-6 + flut(1)} paper="#CFE6FF" pin={PIN_COLORS[2]}>
        <Scribble lines={4} w={210} seed={3} />
      </Note>
      <Note left={70} top={1290} width={300} height={130} rot={2.5 + flut(2)} paper="#FFD3E0" pin={PIN_COLORS[3]}>
        <Scribble lines={2} w={240} seed={5} />
      </Note>
      <Note left={560} top={1268} width={260} height={150} rot={-3 + flut(3)} paper="#D8F5D0" pin={PIN_COLORS[4]}>
        <Scribble lines={3} w={200} seed={8} />
      </Note>
    </>
  );
};

/** the hesitant agent's note: its words write on as it pauses, the paper turns amber on "hesitated" */
const QuoteNote: React.FC<{ shake: number }> = ({ shake }) => {
  const { f, fps, cue } = useScene();
  const t = typeOn(QUOTE, f, cue("agent") - 4, fps, 19);
  const amber = prog(f, cue("hesitated"), 8, ease.linear);
  const paper = interpolateColors(amber, [0, 1], ["#FFFDF6", "#FFD27A"]);
  const ring = amber * (0.6 + 0.4 * Math.sin(f / 6));
  return (
    <Note {...QNOTE} rot={QNOTE.rot + shake * Math.sin(f / 1.7) * 2} paper={paper} pin={PIN_COLORS[0]} lift={amber * 6}>
      <div style={{ position: "absolute", inset: -8, borderRadius: 8, boxShadow: `0 0 0 ${(5 * ring).toFixed(1)}px rgba(245,165,36,${(0.8 * ring).toFixed(2)})` }} />
      <div style={{ position: "relative", fontFamily: GO_HAND, fontSize: 52, fontWeight: 700, lineHeight: "54px", color: "#1E2A4A" }}>
        {t.text ? `"${t.text}` : ""}{t.done ? '"' : ""}
        {t.typing && <span style={{ display: "inline-block", width: 3, height: 40, marginLeft: 2, background: "#1E2A4A" }} />}
      </div>
    </Note>
  );
};

export const GoBoard: React.FC<{ shake: number }> = ({ shake }) => (
  <>
    <Cork />
    <Crowd shake={shake} />
    <QuoteNote shake={shake} />
  </>
);

