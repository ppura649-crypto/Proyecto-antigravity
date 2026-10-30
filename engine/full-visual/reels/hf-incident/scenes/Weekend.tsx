// Scene `weekend` (light): "Then, over one weekend, about 700 agents attacked Hugging Face. They found two bugs nobody
// knew about, called zero-days."
// A July 2026 wall calendar swings on its nail; on "one" Saturday 11 and Sunday 12 are ringed in red marker. It pins
// itself to the corner as Hugging Face's building rises; a stream of red agents (the AgentIcon silhouette, AgentGlyph) pours in from the left, the counter
// landing on "700", and piles against the gate; on "attacked" the windows flicker red; on "two" each of the gate's two
// padlocks cracks; "nobody knew about" and "zero-day" name the cracks.
import React from "react";
import { Column, Travel, blurIn, draw, ease, jitter, pop, prog, useScene } from "../../../src/engine";
import { RED, rand } from "./parts";
import { AgentGlyphDefs, AgentUse } from "./AgentGlyph";
import { CAL, Calendar } from "./WeekendCal";
import { BLD, Building, LOCKS } from "./WeekendGate";

const N = 700;
const RUN = 40; // frames over which the 700 are born, landing on "700"
const PIN = { x: 40, y: 572, s: 0.6 };

/** where dot i ends up: a crowd pressed against the gate, densest at the doors */
const target = (i: number) => {
  const a = Math.PI * (0.98 + 0.55 * rand(i, 11));
  const d = 60 + 400 * Math.pow(rand(i, 12), 0.7);
  let x = BLD.gate.l - 10 + d * Math.cos(a) * 1.05;
  let y = 1392 + d * Math.sin(a) * 0.62;
  x = Math.max(50, Math.min(BLD.gate.l - 8, x));
  y = Math.max(1150, Math.min(1428, y));
  return { x, y };
};
const source = (i: number) => (rand(i, 13) < 0.72 ? { x: 30, y: 1080 + 350 * rand(i, 14) } : { x: 40 + 200 * rand(i, 15), y: 930 });

/** the 700, in one svg */
const WeekendSwarm: React.FC<{ born: number; attacked: number }> = ({ born, attacked }) => {
  const { f } = useScene();
  if (f < born) return null;
  const surge = f >= attacked ? 0.5 + 0.5 * Math.sin((f - attacked) / 5) : 0;
  const dots: { i: number; x: number; y: number; p: number }[] = [];
  for (let i = 0; i < N; i++) {
    const at = born + Math.floor((i / N) * RUN);
    if (f < at) continue;
    const s = source(i);
    const t = target(i);
    const dur = 34 + Math.floor(26 * rand(i, 16));
    const p = prog(f, at, dur, ease.out);
    const bend = Math.sin(Math.PI * p) * (rand(i, 17) - 0.5) * 120;
    const push = p >= 1 ? surge * 6 * rand(i, 18) : 0;
    const x = s.x + (t.x - s.x) * p + push + Math.sin((f + i * 7) / 11) * 2;
    const y = s.y + (t.y - s.y) * p + bend + Math.cos((f + i * 5) / 13) * 2;
    dots.push({ i, x, y, p });
  }
  dots.sort((a, b) => a.y - b.y);
  return (
    <svg width={900} height={1450} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: `drop-shadow(0 0 5px ${RED}99)`, zIndex: 3 }}>
      <AgentGlyphDefs id="wk-agent" />
      {dots.map((d) => <AgentUse key={d.i} id="wk-agent" x={d.x} y={d.y} size={d.p < 1 ? 15 : 17} color={RED} opacity={0.55 + 0.45 * d.p} />)}
    </svg>
  );
};

const WeekendCounter: React.FC<{ born: number; land: number }> = ({ born, land }) => {
  const { f, ground } = useScene();
  if (f < born) return null;
  const n = f >= land ? 700 + jitter(f, land + 40, 0) : Math.min(700, Math.round((700 * (f - born)) / RUN));
  return (
    <div style={{ position: "absolute", left: 440, width: 420, top: 572, textAlign: "center", fontFamily: "Figtree, sans-serif", ...blurIn(f, born, { dur: 6 }) }}>
      <div style={{ fontSize: 150, fontWeight: 800, color: RED, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: -4 }}>{n}</div>
      <div style={{ fontSize: 44, fontWeight: 600, color: ground.ink, marginTop: 6 }}>agents</div>
    </div>
  );
};

/** "a bug nobody knew about" on "nobody", then "zero-day" lands on its word, tied to the cracks */
const WeekendLabel: React.FC<{ nobody: number; zero: number }> = ({ nobody, zero }) => {
  const { f, ground } = useScene();
  if (f < nobody) return null;
  return (
    <>
      <svg width={900} height={1450} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", zIndex: 5 }}>
        <path d={`M300 1082 C 420 1090, 470 1150, ${LOCKS[0].x - 20} ${LOCKS[0].y - 6}`} fill="none" stroke={ground.ink} strokeWidth={3} strokeLinecap="round" {...draw(f, nobody + 2, 14)} />
        <circle cx={LOCKS[0].x - 20} cy={LOCKS[0].y - 6} r={6} fill={ground.ink} opacity={prog(f, nobody + 14, 3)} />
      </svg>
      <div style={{ position: "absolute", left: 40, top: 930, width: 420, fontFamily: "Figtree, sans-serif", zIndex: 6 }}>
        <div style={{ height: 78 }}>
          {f >= zero && <div style={{ display: "inline-block", fontSize: 66, fontWeight: 800, color: RED, lineHeight: 1.1, transformOrigin: "left center", ...pop(f, zero, { dur: 8, from: 0.5 }) }}>zero-day</div>}
        </div>
        <div style={{ fontSize: 38, fontWeight: 600, color: ground.ink, lineHeight: 1.2, background: ground.bg, display: "inline-block", paddingRight: 8, ...blurIn(f, nobody, { dur: 7 }) }}>
          = a bug nobody
          <br />
          knew about
        </div>
      </div>
    </>
  );
};

export const Weekend: React.FC = () => {
  const { f, cue, endsOn, scene } = useScene();
  const start = scene.from - 6;
  const ring = cue("one") - 4;
  const move = cue("about") - 6;
  const born = endsOn("700", RUN);
  const m = prog(f, move, 18, ease.inOut);
  const sway = Math.sin((f - start) / 26) * 1.6 * (1 - m);
  const big = { x: (900 - CAL.w) / 2, y: 640, s: 1 };
  const x = big.x + (PIN.x - big.x) * m;
  const y = big.y + (PIN.y - big.y) * m;
  const s = big.s + (PIN.s - big.s) * m;
  return (
    <Column>
      <div style={{ position: "absolute", left: x, top: y, transform: `scale(${s})`, transformOrigin: "0 0", zIndex: 2 }}>
        <div style={{ ...blurIn(f, start, { dur: 12, rise: 40 }), transform: `${blurIn(f, start, { dur: 12, rise: 40 }).transform} rotate(${sway}deg)`, transformOrigin: `${CAL.w / 2}px -50px` }}>
          <Calendar ring={ring} wash={cue("weekend")} />
        </div>
      </div>
      <Travel at={move + 4} from="bottom" dist={320} dur={18} curve="measured" style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <Building attacked={cue("attacked")} two={cue("two")} />
      </Travel>
      <WeekendCounter born={born} land={cue("700")} />
      <WeekendSwarm born={born} attacked={cue("attacked")} />
      <WeekendLabel nobody={cue("nobody")} zero={cue("zero-days")} />
    </Column>
  );
};
