import React from "react";
import { clamp, easeIn2, mix, win } from "./L-util";
import type { UBeats } from "./U-kit";
// keyframes-v1 builder U: the steel shredder head of hook U1, seen from the front and a little above. Brushed
// steel top plate (a trapezoid in perspective), a dark mouth with two rows of cutter discs, a bevelled front edge
// and the black body below. Drawn in two parts so the strips pass between them: "back" (plate behind the mouth,
// the rear cutter row) under the strips, "front" (lower lip, front cutter row, edge, body) over them.
// It shivers while it runs and sinks away backwards once the strips have flown.

export const SLOT_Y = 505;
const PLATE = { top: 462, bot: 552, backL: 262, backR: 818, frontL: 222, frontR: 858 };
const MOUTH = { l: 336, r: 744, top: 496, bot: 516 };

const steel = [
  "linear-gradient(104deg, rgba(255,255,255,0) 26%, rgba(255,255,255,0.42) 41%, rgba(255,255,255,0.08) 52%, rgba(255,255,255,0) 60%)",
  "repeating-linear-gradient(180deg, rgba(255,255,255,0.10) 0 1px, rgba(0,0,0,0) 1px 3px)",
  "repeating-linear-gradient(180deg, rgba(0,0,0,0.07) 0 1px, rgba(0,0,0,0) 1px 5px)",
  "repeating-linear-gradient(177deg, rgba(255,255,255,0.05) 0 2px, rgba(0,0,0,0) 2px 7px)",
  "linear-gradient(180deg, #aeb3ba 0%, #d4d8dd 38%, #9aa0a8 100%)",
].join(", ");

const Plate: React.FC<{ clipTop: number; clipBot: number }> = ({ clipTop, clipBot }) => {
  const { top, bot, backL, backR, frontL, frontR } = PLATE;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 614,
      clipPath: `polygon(${backL}px ${top}px, ${backR}px ${top}px, ${frontR}px ${bot}px, ${frontL}px ${bot}px)` }}>
      <div style={{ position: "absolute", left: frontL, top, width: frontR - frontL, height: bot - top, background: steel,
        clipPath: `inset(${clipTop - top}px 0 ${bot - clipBot}px 0)` }}>
        {/* screws at the back corners */}
        {[backL - frontL + 26, backR - frontL - 26].map((x, i) => (
          <div key={i} style={{ position: "absolute", left: x - 7, top: 10, width: 14, height: 9, borderRadius: "50%",
            background: "radial-gradient(circle at 40% 35%, #f2f3f5, #7d828a 60%, #50545a)", boxShadow: "0 1px 1px rgba(0,0,0,0.35)" }}>
            <div style={{ position: "absolute", left: 3, right: 3, top: 4, height: 1.4, background: "#3b3e43", transform: `rotate(${i ? 35 : -20}deg)` }} />
          </div>
        ))}
      </div>
    </div>
  );
};

// a row of cutter discs seen edge-on in the mouth: bright rims, dark gaps, a highlight that runs along them
const Cutters: React.FC<{ y: number; hgt: number; off: number; dark: number }> = ({ y, hgt, off, dark }) => (
  <div style={{ position: "absolute", left: MOUTH.l + 6, top: y, width: MOUTH.r - MOUTH.l - 12, height: hgt, borderRadius: 3,
    background: [
      `linear-gradient(180deg, rgba(0,0,0,${dark}) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,${dark}) 100%)`,
      "linear-gradient(90deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 70%)",
      `repeating-linear-gradient(90deg, #8e939a ${off}px, #c9cdd2 ${off + 2}px, #6b7077 ${off + 4}px, #151618 ${off + 5}px, #151618 ${off + 9}px, #8e939a ${off + 9}px)`,
    ].join(", ") }} />
);

export const Shredder: React.FC<{ t: number; b: UBeats; part: "back" | "front" }> = ({ t, b, part }) => {
  // sinks away backwards on HOW (+120), 300 ms: tips back round its base and fades, never below the card
  const away = easeIn2(win(t, b.how + 90, b.how + 330));
  if (away >= 1) return null;
  const run = t > b.and - 60 && t < b.how + 200 ? 1 : 0.25;
  const shiver = run * 0.9 * Math.sin(t * 0.37) + run * 0.5 * Math.sin(t * 0.91);
  const wrap: React.CSSProperties = {
    position: "absolute", left: 0, top: 0, width: 1080, height: 614,
    transformOrigin: "540px 600px",
    transform: `perspective(900px) translateY(${(shiver + 30 * away).toFixed(2)}px) rotateX(${(-38 * away).toFixed(2)}deg) scale(${mix(1, 0.86, away)})`,
    opacity: clamp(1 - win(t, b.how + 90, b.how + 210)),
  };
  if (part === "back") {
    return (
      <div style={wrap}>
        {/* soft contact shadow the head throws down its own body */}
        <Plate clipTop={PLATE.top} clipBot={SLOT_Y} />
        <div style={{ position: "absolute", left: MOUTH.l, top: MOUTH.top, width: MOUTH.r - MOUTH.l, height: MOUTH.bot - MOUTH.top,
          borderRadius: 8, background: "linear-gradient(180deg, #050506 0%, #1b1c1f 55%, #0a0a0b 100%)",
          boxShadow: "inset 0 3px 4px rgba(0,0,0,0.9), 0 -1px 0 rgba(0,0,0,0.25)" }} />
        <Cutters y={MOUTH.top + 3} hgt={7} off={0} dark={0.55} />
      </div>
    );
  }
  const { bot, frontL, frontR } = PLATE;
  return (
    <div style={{ ...wrap, filter: "drop-shadow(0 18px 18px rgba(0,0,0,0.35))" }}>
      <Plate clipTop={SLOT_Y} clipBot={bot} />
      {/* the lower lip of the mouth and the front cutter row, over the strips */}
      <div style={{ position: "absolute", left: MOUTH.l, top: SLOT_Y, width: MOUTH.r - MOUTH.l, height: MOUTH.bot - SLOT_Y,
        borderRadius: "0 0 8px 8px", background: "linear-gradient(180deg, #121315 0%, #26282c 100%)",
        boxShadow: "0 1.5px 0 rgba(255,255,255,0.55)" }} />
      <Cutters y={SLOT_Y + 1} hgt={6} off={4.5} dark={0.35} />
      {/* bevelled front edge: a bright top line, then the curved face turning away from the light */}
      <div style={{ position: "absolute", left: frontL, top: bot, width: frontR - frontL, height: 24,
        borderRadius: "0 0 10px 10px",
        background: "linear-gradient(180deg, #eef0f2 0px, #b9bec5 3px, #7f858d 11px, #4c5057 24px)",
        boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.5)" }} />
      {/* the black body below */}
      <div style={{ position: "absolute", left: frontL + 16, top: bot + 24, width: frontR - frontL - 32, height: 26,
        borderRadius: "0 0 16px 16px", background: "linear-gradient(180deg, #111214 0%, #232428 45%, #0c0c0d 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
        <div style={{ position: "absolute", left: "50%", top: 8, width: 8, height: 8, marginLeft: -4, borderRadius: "50%",
          background: run > 0.5 ? "radial-gradient(circle, #9dff7a, #2f9e1c)" : "#1f3a19",
          boxShadow: run > 0.5 ? "0 0 8px rgba(120,255,90,0.8)" : undefined }} />
      </div>
    </div>
  );
};
