// `fleet` (dark): "They took full control of a server and spread a fleet across 11 machines that restarted itself
// whenever it was deleted. And every fresh sandbox re-armed the attack on its own."
// First frame: one big graphite server tower, cool cyan lamps, red agent dots flying into it. "control": a red flag
// plants on its cap and its lamps flood red. "spread": it shrinks into the middle of a row; the fleet grows out from
// it, pair by pair, each tower lighting red and a red cable linking it, while the counter under the row rolls to 11
// on "11". A cursor clicks one tower away (it bursts into specks); on "restarted" the specks fly home and it restacks
// itself piece by piece; on "deleted" it is clicked away again and grows back again, like a weed. "fresh"/"re-armed":
// FleetCubes. Framing (facts.md): processes that restart themselves, never an AI copying itself.
import React from "react";
import { Column, Cursor, arrive, blurIn, ease, mix, prog, useScene } from "../../../src/engine";
import { Agent, RED, rand } from "./parts";
import { FULL, Specks, TH, Tower, stackUp } from "./FleetTower";
import { FleetCubes } from "./FleetCubes";

const FLOOR = 1080;
const SLOT = (i: number) => 80 + i * 74;
const MID = 5;
const VICTIM = 8;
const VY = FLOOR - 120; // where the cursor clicks the victim

const useFleetCues = () => {
  const { cue } = useScene();
  const restarted = cue("restarted");
  const deleted = cue("deleted");
  return { control: cue("control"), spread: cue("spread"), n11: cue("11"), machines: cue("machines"), restarted, deleted, kill1: restarted - 18, regrow2: deleted + 16 };
};
type FleetCues = ReturnType<typeof useFleetCues>;

/** when each of the other ten towers starts growing: out from the middle, a pair every 5 frames, last lit on "11" */
const growAt = (c: FleetCues, i: number) => c.n11 - 26 + (Math.abs(i - MID) - 1) * 5;

/** the flag planted on the cap on "control": falls, bites, then flutters */
const FleetFlag: React.FC<{ c: FleetCues }> = ({ c }) => {
  const { f } = useScene();
  if (f < c.control - 10) return null;
  const fall = 1 - prog(f, c.control - 10, 10, ease.in);
  const wob = f >= c.control ? Math.sin(prog(f, c.control, 14) * Math.PI * 3) * (1 - prog(f, c.control, 14)) * 8 : 0;
  const wave = (k: number) => Math.sin(f / 5 + k) * 3;
  const cloth = `M3 2 C 16 ${2 + wave(0)}, 26 ${-2 + wave(1)}, 40 ${2 + wave(2)} L 40 ${26 + wave(2)} C 26 ${22 + wave(1)}, 16 ${26 + wave(0)}, 3 26 Z`;
  return (
    <div style={{ position: "absolute", left: 30, top: -62 - fall * 160, width: 50, height: 64, transformOrigin: "2px 64px", transform: `rotate(${wob.toFixed(2)}deg)`, opacity: prog(f, c.control - 10, 3) }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 4, height: 64, borderRadius: 2, background: "linear-gradient(90deg, #E8E8E8, #9A9A9A)" }} />
      <svg width={46} height={34} style={{ position: "absolute", left: 1, top: 2, overflow: "visible" }}>
        <path d={cloth} fill={RED} style={{ filter: `drop-shadow(0 0 6px ${RED})` }} />
      </svg>
      <div style={{ position: "absolute", left: -2, top: -5, width: 8, height: 8, borderRadius: 4, background: "#F2F2F2" }} />
    </div>
  );
};

/** the rest of the fleet dims while the cursor works on the one tower */
const focus = (f: number, c: FleetCues) => prog(f, c.kill1 - 14, 10) * (1 - prog(f, c.regrow2 + 34, 14));

/** a soft spotlight on the tower being deleted */
const FleetSpot: React.FC<{ c: FleetCues }> = ({ c }) => {
  const { f } = useScene();
  const o = focus(f, c);
  if (o <= 0) return null;
  const x = SLOT(VICTIM);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: o }}>
      <div style={{ position: "absolute", left: x - 120, top: FLOOR - 430, width: 240, height: 440, clipPath: "polygon(38% 0, 62% 0, 100% 100%, 0 100%)", background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.12))" }} />
      <div style={{ position: "absolute", left: x - 110, top: FLOOR - 22, width: 220, height: 44, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,0.22), transparent)" }} />
    </div>
  );
};

/** the tower the cursor keeps deleting: gone, back, gone, back */
const victimState = (f: number, c: FleetCues) => {
  const born = stackUp(f, growAt(c, VICTIM), 1, 6);
  if (f < c.kill1) return { pieces: born, alpha: 1, flash: 0 };
  const flash = Math.max(1 - Math.abs(f - c.kill1) / 4, 1 - Math.abs(f - c.deleted) / 4, 0);
  if (f < c.restarted) return { pieces: FULL, alpha: 1 - prog(f, c.kill1, 5), flash };
  if (f < c.deleted) return { pieces: stackUp(f, c.restarted + 8, 4, 7), alpha: 1, flash };
  if (f < c.regrow2) return { pieces: FULL, alpha: 1 - prog(f, c.deleted, 5), flash };
  return { pieces: stackUp(f, c.regrow2 + 6, 3, 6), alpha: 1, flash };
};

const FleetRow: React.FC<{ c: FleetCues }> = ({ c }) => {
  const { f } = useScene();
  const k = arrive(f, c.spread - 2, 18);
  const bigScale = 2.1 + (1 - 2.1) * k;
  const bigBottom = 1250 + (FLOOR - 1250) * k;
  const midRed = prog(f, c.control, 8);
  const v = victimState(f, c);
  const dim = focus(f, c);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, filter: dim > 0.01 ? `brightness(${(1 - 0.5 * dim).toFixed(3)})` : undefined }}>
      {Array.from({ length: 11 }, (_, i) => {
        if (i === MID) return null;
        const at = growAt(c, i);
        if (f < at) return null;
        const red = prog(f, at + 6, 5);
        if (i === VICTIM) return null;
        return <Tower key={i} x={SLOT(i)} bottom={FLOOR} red={red} seed={i} pieces={stackUp(f, at, 1, 6)} />;
      })}
      <Tower x={SLOT(MID)} bottom={bigBottom} scale={bigScale} red={midRed} seed={MID}>
        <FleetFlag c={c} />
      </Tower>
      </div>
      {f >= growAt(c, VICTIM) && <Tower x={SLOT(VICTIM)} bottom={FLOOR} red={prog(f, growAt(c, VICTIM) + 6, 5)} seed={VICTIM} pieces={v.pieces} alpha={v.alpha} flash={v.flash} />}
      <Specks x={SLOT(VICTIM)} bottom={FLOOR} t={prog(f, c.kill1, 22, ease.out)} seed={3} />
      <Specks x={SLOT(VICTIM)} bottom={FLOOR} t={1 - prog(f, c.restarted, 10, ease.in)} seed={3} />
      <Specks x={SLOT(VICTIM)} bottom={FLOOR} t={prog(f, c.deleted, 22, ease.out)} seed={9} />
      <Specks x={SLOT(VICTIM)} bottom={FLOOR} t={1 - prog(f, c.regrow2, 8, ease.in)} seed={9} />
    </>
  );
};

/** the red cable strung along the cap line, a span drawn each time a tower lights */
const FleetCable: React.FC<{ c: FleetCues }> = ({ c }) => {
  const { f } = useScene();
  const y = FLOOR - TH + 8;
  const spans = Array.from({ length: 10 }, (_, j) => {
    const outer = j < MID ? j : j + 1;
    const p = prog(f, growAt(c, outer) + 4, 6);
    const [a, b] = j < MID ? [SLOT(j + 1), SLOT(j)] : [SLOT(j), SLOT(j + 1)];
    const vs = victimState(f, c);
    const o = (j === VICTIM - 1 || j === VICTIM) && f >= c.kill1 ? vs.alpha * vs.pieces[6] : 1;
    return { a, b, p, o };
  });
  const pulse = 0.7 + 0.3 * Math.sin(f / 6);
  return (
    <svg width={900} height={1450} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {spans.map((s, j) => {
        if (s.p <= 0) return null;
        const bx = s.a + (s.b - s.a) * s.p;
        return <path key={j} d={`M ${s.a} ${y} Q ${(s.a + bx) / 2} ${y + 16} ${bx} ${y}`} fill="none" stroke={RED} strokeWidth={3} strokeLinecap="round" opacity={s.o * pulse} style={{ filter: `drop-shadow(0 0 5px ${RED})` }} />;
      })}
    </svg>
  );
};

/** "11 machines": the count rolls with the towers as they light and lands on the word */
const FleetCounter: React.FC<{ c: FleetCues }> = ({ c }) => {
  const { f, theme } = useScene();
  const at = c.n11 - 30;
  if (f < at) return null;
  let n = 1;
  for (let i = 0; i < 11; i++) if (i !== MID && f >= growAt(c, i) + 6) n++;
  const tick = Math.max(...Array.from({ length: 11 }, (_, i) => (i === MID ? -99 : growAt(c, i) + 6)).filter((t) => t <= f), -99);
  const bump = 1 + 0.08 * (1 - prog(f, tick, 6));
  const col = mix(f, c.n11, 4, "#FFFFFF", RED);
  return (
    <div style={{ position: "absolute", left: 0, width: 900, top: 1096, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 18, ...blurIn(f, at, { dur: 8 }) }}>
      <span style={{ fontFamily: theme.font.ui, fontSize: 112, fontWeight: 800, color: col, letterSpacing: -3, fontVariantNumeric: "tabular-nums", display: "inline-block", minWidth: 136, textAlign: "right", transform: `scale(${bump.toFixed(3)})`, textShadow: f >= c.n11 ? `0 0 24px rgba(255,59,48,0.55)` : undefined }}>{n}</span>
      <span style={{ fontFamily: theme.font.ui, fontSize: 46, fontWeight: 600, color: "#BDBDBD" }}>machines</span>
    </div>
  );
};

/** before "control": red agent dots stream into the big tower */
const FleetRaiders: React.FC<{ c: FleetCues }> = ({ c }) => {
  const { f, scene } = useScene();
  if (f > c.control + 4) return null;
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => {
        const a = scene.from - 6 + i * 3;
        const t = prog(f, a, c.control - 2 - a, ease.inOut);
        const sx = rand(i, 4) < 0.5 ? 60 + rand(i, 5) * 120 : 720 + rand(i, 5) * 120;
        const sy = 620 + rand(i, 6) * 520;
        const x = sx + (450 - sx) * t;
        const y = sy + (980 - sy) * t - Math.sin(t * Math.PI) * 60;
        return <Agent key={i} x={x} y={y} r={10} color={RED} opacity={prog(f, a, 4) * (1 - prog(f, c.control - 3, 5))} />;
      })}
    </>
  );
};

/** the click rings and the circular "back again" arrow that spins while the tower restacks */
const FleetMarks: React.FC<{ c: FleetCues }> = ({ c }) => {
  const { f } = useScene();
  const ring = (at: number) => {
    const t = prog(f, at, 14);
    return t > 0 && t < 1 ? <div key={at} style={{ position: "absolute", left: SLOT(VICTIM) - 40 * t - 10, top: VY - 40 * t - 10, width: 20 + 80 * t, height: 20 + 80 * t, borderRadius: "50%", border: "3px solid #FFFFFF", opacity: 1 - t }} /> : null;
  };
  const spins = [
    [c.restarted, c.restarted + 44],
    [c.regrow2, c.regrow2 + 40],
  ].map(([a, b]) => {
    if (f < a || f > b) return null;
    const o = prog(f, a, 5) * (1 - prog(f, b - 8, 8));
    return (
      <svg key={a} width={120} height={120} viewBox="-60 -60 120 120" style={{ position: "absolute", left: SLOT(VICTIM) - 60, top: FLOOR - TH - 130, opacity: o, transform: `rotate(${((f - a) * 9).toFixed(0)}deg)` }}>
        <path d="M 0 -40 A 40 40 0 1 1 -38 -12" fill="none" stroke={RED} strokeWidth={7} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${RED})` }} />
        <path d="M -50 -22 L -36 -6 L -26 -26 Z" fill={RED} />
      </svg>
    );
  });
  return <>{ring(c.kill1)}{ring(c.deleted)}{spins}</>;
};

const FleetCursor: React.FC<{ c: FleetCues }> = ({ c }) => {
  const tip = { x: SLOT(VICTIM) - 12, y: VY - 7 };
  return (
    <Cursor
      path={[
        { f: c.machines + 2, x: 880, y: 1260 },
        { f: c.kill1 - 3, ...tip },
        { f: c.kill1, ...tip },
        { f: c.kill1 + 22, x: tip.x + 110, y: tip.y + 150 },
        { f: c.deleted - 12, x: tip.x + 110, y: tip.y + 150 },
        { f: c.deleted - 2, ...tip },
        { f: c.deleted, ...tip },
        { f: c.deleted + 30, x: 980, y: 1150 },
      ]}
      until={c.deleted + 31}
    />
  );
};

export const Fleet: React.FC = () => {
  const { f, scene } = useScene();
  const c = useFleetCues();
  const haze = prog(f, c.control, 20) * (0.8 + 0.2 * Math.sin(f / 11));
  return (
    <Column>
      <div style={{ position: "absolute", left: -90, width: 1080, top: 560, height: 700, background: `radial-gradient(50% 45% at 50% 55%, rgba(255,59,48,${(0.16 * haze).toFixed(3)}), transparent)` }} />
      <div style={{ position: "absolute", left: 20, right: 20, top: FLOOR - 2, height: 2, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)", ...blurIn(f, c.spread, { dur: 10 }) }} />
      <div style={{ ...blurIn(f, scene.from - 6, { dur: 10, rise: 60 }) }}>
        <FleetRaiders c={c} />
        <FleetCable c={c} />
        <FleetSpot c={c} />
        <FleetRow c={c} />
      </div>
      <FleetCubes />
      <FleetCounter c={c} />
      <FleetMarks c={c} />
      <FleetCursor c={c} />
    </Column>
  );
};
