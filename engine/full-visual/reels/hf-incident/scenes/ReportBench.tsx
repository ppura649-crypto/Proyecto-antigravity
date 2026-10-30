// The test and its one setting. A stadium-style LED scoreboard titled "Hacking benchmark" (no scores: the cells stay
// dashes, we have no per-model numbers), one lane per agent with its cyan dot, and under it a chunky industrial toggle
// labelled "Safety filters" that is thrown from ON to OFF on "off". When it drops, the board's lanes run hotter.
import React from "react";
import { blurIn, ease, mix, prog, stagger, typeOn, useScene } from "../../../src/engine";
import { AMBER, GOOD, rand } from "./parts";
import { Dot } from "./ReportCube";

export const BOARD = { left: 40, top: 560, w: 820, h: 490 };
export const SWITCH = { left: 120, top: 1080, w: 660, h: 360 };
const MONO = "'JetBrains Mono', monospace";
const LED = "#FFB02E";
const LANES = 5;

export type BenchCues = { board: number; models: number; hacking: number; safety: number; off: number; out: number };

const Bolt: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x - 9, top: y - 9, width: 18, height: 18, borderRadius: 9, background: "radial-gradient(circle at 35% 30%, #D9DDE2, #6C737C 70%)", boxShadow: "0 1px 2px rgba(0,0,0,0.6)" }} />
);

/** one lane: number, agent dot, a scanning LED track, and an empty score cell */
const Lane: React.FC<{ i: number; c: BenchCues; hot: number }> = ({ i, c, hot }) => {
  const { f } = useScene();
  const born = stagger(c.models - 22, i, 5);
  const y = 146 + i * 62;
  const segs = 16;
  const speed = 0.25 + hot * 0.35;
  return (
    <div style={{ position: "absolute", left: 30, top: y, width: BOARD.w - 60, height: 50, display: "flex", alignItems: "center" }}>
      <span style={{ fontFamily: MONO, fontSize: 26, color: LED, opacity: 0.55, width: 50 }}>{`0${i + 1}`}</span>
      <div style={{ position: "relative", width: 50, height: 50, ...blurIn(f, born, { dur: 8, scaleFrom: 0.2 }) }}>
        <div style={{ position: "absolute", left: 25, top: 25 }}>
          <Dot r={11} glow={1 + hot * 0.9} pulse={0.3 + 0.3 * Math.sin(f * 0.15 + i * 1.7)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, marginLeft: 20 }}>
        {Array.from({ length: segs }).map((_, s) => {
          const lit = f >= born && rand(Math.floor(f * speed) + s * 13 + i * 7, 3) < 0.28 + hot * 0.35;
          return <div key={s} style={{ width: 22, height: 26, borderRadius: 3, background: lit ? LED : "#2A2118", boxShadow: lit ? `0 0 10px ${LED}` : "inset 0 1px 2px #000" }} />;
        })}
      </div>
      <span style={{ marginLeft: "auto", fontFamily: MONO, fontWeight: 700, fontSize: 34, color: LED, textShadow: `0 0 12px ${LED}`, opacity: f >= born ? 0.6 + 0.4 * rand(Math.floor(f / 6) + i, 9) : 0 }}>- -</span>
    </div>
  );
};

export const Scoreboard: React.FC<{ c: BenchCues }> = ({ c }) => {
  const { f, fps } = useScene();
  if (f < c.board || f > c.out + 12) return null;
  const o = prog(f, c.out, 9, ease.in);
  const hot = prog(f, c.off, 10, ease.out);
  // the header reads the month first, then the test's name is typed over it on "hacking"
  const typed = typeOn("HACKING BENCHMARK", f, c.hacking - 6, fps, 22);
  const title = f < c.hacking - 6 ? { text: "JULY 2026", typing: false } : typed;
  return (
    <div style={{ position: "absolute", left: BOARD.left, top: BOARD.top - o * 160, width: BOARD.w, height: BOARD.h, opacity: 1 - o, ...blurIn(f, c.board, { dur: 9, rise: 60 }) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 26, background: "linear-gradient(180deg, #3B3F46, #1B1D21)", boxShadow: "0 40px 80px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.2)" }} />
      <div style={{ position: "absolute", inset: 14, borderRadius: 16, background: "#0C0B0A", boxShadow: "inset 0 6px 20px #000" }} />
      {[[30, 30], [BOARD.w - 30, 30], [30, BOARD.h - 30], [BOARD.w - 30, BOARD.h - 30]].map(([x, y]) => <Bolt key={`${x}-${y}`} x={x} y={y} />)}
      <div style={{ position: "absolute", left: 40, top: 40, right: 40, height: 80, borderBottom: "2px solid #2A2118", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 50, letterSpacing: 4, color: LED, textShadow: `0 0 14px ${LED}, 0 0 30px ${LED}88` }}>
          {title.text}
          <span style={{ opacity: title.typing ? 1 : 0 }}>{"█"}</span>
        </span>
      </div>
      {Array.from({ length: LANES }).map((_, i) => <Lane key={i} i={i} c={c} hot={hot} />)}
      {/* LED dot-matrix screen texture */}
      <div style={{ position: "absolute", inset: 14, borderRadius: 16, background: "radial-gradient(rgba(0,0,0,0.5) 1px, transparent 1.6px)", backgroundSize: "5px 5px", pointerEvents: "none" }} />
    </div>
  );
};

/** the bat of a toggle seen head-on: it points up (ON), passes through its pivot, and points down (OFF) */
const Bat: React.FC<{ p: number }> = ({ p }) => {
  const s = Math.cos(Math.PI * p);
  const len = 96 * Math.abs(s);
  const up = s >= 0;
  return (
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      <div style={{ position: "absolute", left: -18, top: up ? -len : 0, width: 36, height: len, background: "linear-gradient(90deg, #7E858E, #F4F6F8 40%, #9AA1AA 70%, #5C636B)", borderRadius: 18 }} />
      <div style={{ position: "absolute", left: -30, top: (up ? -len : len) - 28, width: 56, height: 56, borderRadius: 28, background: "radial-gradient(circle at 35% 30%, #FFFFFF, #A7AEB6 55%, #5A6068)", boxShadow: "0 10px 18px rgba(0,0,0,0.35)" }} />
    </div>
  );
};

export const SafetySwitch: React.FC<{ c: BenchCues }> = ({ c }) => {
  const { f, fps } = useScene();
  if (f < c.safety - 8 || f > c.out + 12) return null;
  const o = prog(f, c.out, 9, ease.in);
  const p = prog(f, c.off - 3, 8, ease.in);
  const thud = f >= c.off + 5 ? Math.sin((f - c.off - 5) * 1.3) * 6 * (1 - prog(f, c.off + 5, 14, ease.linear)) : 0;
  const lamp = mix(f, c.off + 3, 4, GOOD, AMBER);
  const label = typeOn("SAFETY FILTERS", f, c.safety - 4, fps, 26);
  return (
    <div style={{ position: "absolute", left: SWITCH.left, top: SWITCH.top + thud - o * 160, width: SWITCH.w, height: SWITCH.h, opacity: 1 - o, ...blurIn(f, c.safety - 8, { dur: 9, rise: 70 }) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 22, background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 2px, rgba(0,0,0,0.03) 2px 4px), linear-gradient(180deg, #E4E7EB, #B8BEC6)", boxShadow: "0 36px 70px rgba(0,0,0,0.25), inset 0 2px 0 #FFF, inset 0 -3px 0 rgba(0,0,0,0.15)" }} />
      {[[24, 24], [SWITCH.w - 24, 24], [24, SWITCH.h - 24], [SWITCH.w - 24, SWITCH.h - 24]].map(([x, y]) => <Bolt key={`${x}-${y}`} x={x} y={y} />)}
      <div style={{ position: "absolute", left: 0, right: 0, top: 26, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 42, letterSpacing: 5, color: "#2A2E33", textShadow: "0 1px 0 rgba(255,255,255,0.8)" }}>{label.text}</div>
      {/* the boss the bat sits in */}
      <div style={{ position: "absolute", left: 250, top: 226 }}>
        <div style={{ position: "absolute", left: -58, top: -58, width: 116, height: 116, borderRadius: 58, background: "radial-gradient(circle at 40% 35%, #555B63, #1B1E22 70%)", boxShadow: "0 6px 14px rgba(0,0,0,0.4), inset 0 2px 3px rgba(255,255,255,0.25)" }} />
        <div style={{ position: "absolute", left: -26, top: -26, width: 52, height: 52, borderRadius: 26, background: "radial-gradient(circle at 40% 35%, #C9CED4, #50565E)" }} />
        <Bat p={p} />
      </div>
      <span style={{ position: "absolute", left: 96, top: 116, fontFamily: MONO, fontWeight: 700, fontSize: 36, color: p < 0.5 ? "#1C1F23" : "#8A9099" }}>ON</span>
      <span style={{ position: "absolute", left: 80, top: 290, fontFamily: MONO, fontWeight: 700, fontSize: 36, color: p >= 0.5 ? "#1C1F23" : "#8A9099" }}>OFF</span>
      {/* status lamp */}
      <div style={{ position: "absolute", left: 440, top: 150, width: 130, height: 130, borderRadius: 65, background: "radial-gradient(circle at 40% 35%, #555B63, #1B1E22 70%)", boxShadow: "inset 0 3px 6px rgba(0,0,0,0.6)" }}>
        <div style={{ position: "absolute", inset: 16, borderRadius: 50, background: `radial-gradient(circle at 38% 32%, #FFFFFF, ${lamp} 45%)`, boxShadow: `0 0 40px 10px ${lamp}88` }} />
      </div>
      <span style={{ position: "absolute", left: 440, width: 130, top: 292, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 34, color: "#2A2E33" }}>{p >= 0.5 ? "OFF" : "ON"}</span>
    </div>
  );
};
