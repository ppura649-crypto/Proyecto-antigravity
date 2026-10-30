// `why`: the two things the agents went looking for, drawn as objects: how the test is graded (a scoring rubric card
// with its rubber stamp) and the answers (an answer-key card with a brass key). Both arrive chained and padlocked
// under a red "?", locked away. Then the manila folder of the test's own files they all slide into.
// Plain words only, no numbers (facts.md 6: they mostly wanted to understand how the scorer worked).
import React from "react";
import { draw, ease, pop, prog, useScene } from "../../../src/engine";
import { RED } from "./parts";

export const CARD = { w: 340, h: 340 };
const INK = "#0F172A";
const MUTE = "#9AA1AC";

const Row: React.FC<{ y: number; w: number; tick: boolean; dots: number }> = ({ y, w, tick, dots }) => (
  <div style={{ position: "absolute", left: 26, right: 26, top: y, height: 30, display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ width: 26, height: 26, borderRadius: 6, background: tick ? "#34C759" : "#FFFFFF", boxShadow: tick ? undefined : `inset 0 0 0 2.5px ${MUTE}`, color: "#fff", fontSize: 18, fontWeight: 900, textAlign: "center", lineHeight: "26px" }}>{tick ? "✓" : ""}</div>
    <div style={{ width: w, height: 12, borderRadius: 6, background: "#D9DDE3" }} />
    <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
      {Array.from({ length: 5 }, (_, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 5, background: i < dots ? "#F5A524" : "#E4E7EC" }} />)}
    </div>
  </div>
);

const Head: React.FC<{ text: string }> = ({ text }) => {
  const { theme } = useScene();
  return (
    <div style={{ position: "absolute", left: 26, top: 22, fontFamily: theme.font.ui, fontSize: 30, fontWeight: 800, letterSpacing: 1.5, color: INK }}>
      {text}
      <div style={{ width: 70, height: 6, borderRadius: 3, background: RED, marginTop: 8 }} />
    </div>
  );
};

const Paper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: "linear-gradient(180deg,#FFFFFF,#F5F6F8)", boxShadow: "0 28px 50px rgba(15,23,42,0.18), 0 5px 12px rgba(15,23,42,0.08), inset 0 0 0 1px #E4E7EC", overflow: "hidden" }}>
    {children}
  </div>
);

/** how the test is graded: criteria rows, a meter per row, the round scoring stamp thumping onto the corner */
export const RubricCard: React.FC<{ stampAt: number }> = ({ stampAt }) => {
  const { f, theme } = useScene();
  const s = prog(f, stampAt, 8, ease.in);
  const sc = f < stampAt ? 0 : 1.9 - 0.9 * s;
  return (
    <Paper>
      <Head text="HOW IT'S GRADED" />
      <Row y={116} w={120} tick dots={4} />
      <Row y={162} w={150} tick dots={2} />
      <Row y={208} w={100} tick={false} dots={5} />
      <Row y={254} w={136} tick={false} dots={1} />
      {f >= stampAt && (
        <div style={{ position: "absolute", right: 16, bottom: 12, width: 128, height: 128, borderRadius: 64, border: `6px solid ${RED}`, color: RED, opacity: 0.25 + 0.65 * s, transform: `rotate(-14deg) scale(${sc.toFixed(3)})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.font.ui, fontWeight: 900, fontSize: 30, letterSpacing: 2, boxShadow: `inset 0 0 0 4px #FFFFFF, inset 0 0 0 7px ${RED}` }}>
          SCORE
        </div>
      )}
    </Paper>
  );
};

/** the answers: the brass key and one sealed black bar per task, glinting */
export const KeyCard: React.FC = () => {
  const { f, theme } = useScene();
  return (
    <Paper>
      <Head text="ANSWER KEY" />
      <svg width={120} height={60} viewBox="0 0 120 60" style={{ position: "absolute", right: 18, top: 26 }}>
        <defs><linearGradient id="whyBrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F6D27A" /><stop offset="1" stopColor="#B7862B" /></linearGradient></defs>
        <circle cx="26" cy="30" r="20" fill="url(#whyBrass)" /><circle cx="26" cy="30" r="8" fill="#F5F6F8" />
        <rect x="44" y="25" width="68" height="10" rx="3" fill="url(#whyBrass)" />
        <rect x="88" y="33" width="8" height="14" fill="#B7862B" /><rect x="102" y="33" width="8" height="10" fill="#B7862B" />
      </svg>
      {[0, 1, 2, 3].map((i) => {
        const glint = ((f / 50 + i * 0.23) % 1.4) - 0.2;
        return (
          <div key={i} style={{ position: "absolute", left: 26, right: 26, top: 118 + i * 50, height: 34, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontFamily: theme.font.ui, fontSize: 22, fontWeight: 700, color: MUTE, width: 50 }}>task</div>
            <div style={{ flex: 1, height: 26, borderRadius: 5, background: `linear-gradient(100deg,#15181E ${(glint * 100 - 8).toFixed(1)}%,#4A5160 ${(glint * 100).toFixed(1)}%,#15181E ${(glint * 100 + 8).toFixed(1)}%)` }} />
          </div>
        );
      })}
    </Paper>
  );
};

/** chains across the card and a padlock dropping onto them at `at`; `strain` shakes the lock (agents pulling) */
export const ChainLock: React.FC<{ at: number; strain: number }> = ({ at, strain }) => {
  const { f } = useScene();
  if (f < at) return null;
  const drop = prog(f, at + 6, 10, ease.back);
  const wob = Math.sin(f / 2.3) * 3 * strain;
  const link = (x1: number, y1: number, x2: number, y2: number, k: number) => {
    const n = 13;
    const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    return Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1);
      if (prog(f, at + i * 0.6 + k * 2, 3) <= 0) return null;
      const cx = x1 + (x2 - x1) * t;
      const cy = y1 + (y2 - y1) * t;
      return i % 2 === 0 ? (
        <rect key={`${k}-${i}`} x={cx - 24} y={cy - 11} width={48} height={22} rx={11} fill="none" stroke="#7B828E" strokeWidth={7} transform={`rotate(${ang} ${cx} ${cy})`} style={{ filter: "drop-shadow(0 3px 2px rgba(0,0,0,0.3))" }} />
      ) : (
        <rect key={`${k}-${i}`} x={cx - 24} y={cy - 4} width={48} height={8} rx={4} fill="#A3AAB5" stroke="#5F6672" strokeWidth={2} transform={`rotate(${ang} ${cx} ${cy})`} />
      );
    });
  };
  return (
    <svg width={CARD.w} height={CARD.h} viewBox={`0 0 ${CARD.w} ${CARD.h}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {link(-14, 40, CARD.w + 14, CARD.h - 40, 0)}
      {link(-14, CARD.h - 40, CARD.w + 14, 40, 1)}
      <g transform={`translate(${170 + wob} ${(178 - (1 - drop) * 90).toFixed(1)}) rotate(${(wob * 1.5).toFixed(2)})`} opacity={prog(f, at + 6, 3)}>
        <path d="M-26 -8 L-26 -34 A26 26 0 0 1 26 -34 L26 -8" fill="none" stroke="#9CA3AF" strokeWidth={12} {...(f < at + 14 ? draw(f, at + 6, 8) : {})} />
        <rect x={-44} y={-12} width={88} height={72} rx={12} fill="#C9962E" />
        <rect x={-44} y={-12} width={88} height={20} rx={10} fill="#E3B24A" />
        <circle cx={0} cy={20} r={9} fill="#3A2A0E" /><rect x={-4} y={22} width={8} height={20} rx={3} fill="#3A2A0E" />
      </g>
    </svg>
  );
};

/** the red "?" over a card: what they wanted and could not reach */
export const QBadge: React.FC<{ at: number; fade: number; side?: "left" | "right" }> = ({ at, fade, side = "right" }) => {
  const { f, theme } = useScene();
  if (f < at) return null;
  const bob = Math.sin((f - at) / 9) * 6;
  return (
    <div style={{ position: "absolute", [side]: -10, top: -40 + bob, width: 78, height: 78, borderRadius: 39, background: RED, color: "#fff", fontFamily: theme.font.ui, fontWeight: 900, fontSize: 56, lineHeight: "78px", textAlign: "center", boxShadow: `0 8px 18px ${RED}66`, opacity: 1 - fade, ...pop(f, at, { dur: 9, from: 0.3 }) }}>
      ?
    </div>
  );
};

/** the manila folder of the test's files, native 360 x 250. `part` back (tab + inside) or front (the pocket) */
export const FOLDER = { w: 360, h: 250, lip: 78 };
export const FolderPart: React.FC<{ part: "back" | "front" }> = ({ part }) => {
  const { theme } = useScene();
  if (part === "back")
    return (
      <div style={{ position: "absolute", left: 0, top: 0, width: FOLDER.w, height: FOLDER.h }}>
        <div style={{ position: "absolute", left: 18, top: -30, width: 130, height: 44, borderRadius: "12px 12px 0 0", background: "#D9A441" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: FOLDER.w, height: FOLDER.h, borderRadius: 14, background: "linear-gradient(180deg,#D9A441,#C08A2E)", boxShadow: "0 26px 40px rgba(60,40,10,0.28)" }} />
      </div>
    );
  return (
    <div style={{ position: "absolute", left: -6, top: FOLDER.lip, width: FOLDER.w + 12, height: FOLDER.h - FOLDER.lip + 4, borderRadius: "10px 10px 14px 14px", background: "linear-gradient(180deg,#F4C765,#E3AE4A)", boxShadow: "0 -4px 10px rgba(80,50,10,0.25), inset 0 2px 0 rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ padding: "8px 18px", background: "#FFF8E6", borderRadius: 6, fontFamily: theme.font.ui, fontWeight: 800, fontSize: 30, letterSpacing: 2, color: "#5A3E0E", boxShadow: "0 1px 0 rgba(0,0,0,0.15)" }}>TEST FILES</div>
    </div>
  );
};
