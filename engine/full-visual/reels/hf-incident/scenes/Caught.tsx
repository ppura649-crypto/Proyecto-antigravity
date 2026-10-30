// caught, light, 102.5-108.2 s: "Hugging Face's AI tools caught it and cut access. OpenAI only connected it to its
// own models a week later."
// First frame: Hugging Face's production card ("All systems normal") with a thick cable running down to the red swarm,
// red pulses climbing it. "AI tools": a yellow scan beam sweeps the card. "caught": the card turns into the alert
// (red header, "Intrusion detected", "AI-assisted detection" badge, July 13). "cut": the cable parts in a spark;
// "access": "Access cut" pops and the red dots go dark grey one by one. "OpenAI": the grey swarm drifts left and
// shrinks, the OpenAI mark lands over it and a desk calendar on July 13 pops on the right. "connected": a grey line
// draws from the OpenAI mark to the alert. "week": the calendar's pages flip 14...20, landing on 20 on the word, and the
// line turns solid black as the card rings; "later": 20 is circled in red. Facts: facts.md sections 2 and 4.
import React from "react";
import { Column, blurIn, draw, ease, mix, pop, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { Agent, Logo, RED, rand } from "./parts";
import { CAUGHT_CARD, CaughtCable, CaughtCalendar, CaughtCard } from "./CaughtBits";

const N = 70;
const GREY = "#5E6068";

/** the swarm, now red: drifts, goes grey dot by dot on `access`, then moves aside on `OpenAI` */
const CaughtSwarm: React.FC<{ t0: number; access: number; aside: number }> = ({ t0, access, aside }) => {
  const { f } = useScene();
  const k = prog(f, aside, 20, ease.inOut);
  const cx = 450 + (240 - 450) * k;
  const cy = 1262 + (1292 - 1262) * k;
  const s = 1 - 0.38 * k;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 900, height: 1920 }}>
      {Array.from({ length: N }, (_, i) => {
        const a = rand(i, 3) * Math.PI * 2;
        const rr = Math.sqrt(rand(i, 7));
        const dx = Math.cos(a) * rr * 230 + Math.sin(f / 23 + i) * 6;
        const dy = Math.sin(a) * rr * 100 + Math.cos(f / 19 + i * 1.3) * 5;
        const g = prog(f, access + Math.floor(rand(i, 11) * 14), 5, ease.linear);
        const color = g >= 1 ? GREY : g <= 0 ? RED : mix(f, access + Math.floor(rand(i, 11) * 14), 5, RED, GREY);
        const o = prog(f, t0 + Math.floor(rand(i, 5) * 8), 6);
        return <Agent key={i} x={cx + dx * s} y={cy + dy * s} r={(7 + rand(i, 13) * 4) * (0.7 + 0.3 * s)} color={color} glow={1 - g} opacity={o} />;
      })}
    </div>
  );
};

export const Caught: React.FC = () => {
  const { f, cue, scene, ground } = useScene();
  const t0 = scene.from - LEAD;
  const ai = cue("ai");
  const caught = cue("caught");
  const cut = cue("cut");
  const access = cue("access");
  const oa = cue("openai");
  const conn = cue("connected");
  const models = cue("models");
  const week = cue("week");
  const later = cue("later");
  const C = CAUGHT_CARD;
  const solid = f >= week;
  const lineColor = solid ? ground.ink : "#A1A7B3";
  const linePath = `M240 1092 C 240 990, ${C.x + 220} 1000, ${C.x + 220} ${C.y + C.h + 6}`;
  return (
    <Column>
      <CaughtCable t0={t0} cut={cut} fade={oa} y0={C.y + C.h - 6} y1={1170} />
      <CaughtSwarm t0={t0} access={access} aside={oa} />
      <CaughtCard t0={t0} ai={ai} caught={caught} access={access} ring={week} />
      {f >= conn && (
        <svg width={900} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={linePath} fill="none" stroke={lineColor} strokeWidth={solid ? 8 : 5} strokeLinecap="round" {...draw(f, conn, 14)} />
          {f >= conn + 12 && <circle cx={C.x + 220} cy={C.y + C.h + 6} r={solid ? 13 : 9} fill={lineColor} />}
          <circle cx={240} cy={1092} r={solid ? 13 : 9} fill={lineColor} />
        </svg>
      )}
      {f >= oa && (
        <div style={{ position: "absolute", left: 240 - 50, top: 1100, ...pop(f, oa, { dur: 10 }) }}>
          <Logo name="openai" size={100} />
        </div>
      )}
      {f >= models && (
        <div style={{ position: "absolute", left: 40, width: 400, top: 1380, textAlign: "center", fontFamily: "Inter", fontWeight: 700, fontSize: 34, color: ground.dim, ...blurIn(f, models, { dur: 7 }) }}>
          OpenAI's own models
        </div>
      )}
      <CaughtCalendar x={660} y={1010} at={oa + 8} week={week} later={later} />
    </Column>
  );
};
