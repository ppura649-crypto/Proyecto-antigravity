// Scene `in` (dark): "Step three: get in. One agent found 14 Hugging Face logins leaked online, still valid, and
// shared them with the group."
// A bare key ring swings in the dark; STEP 3 "get in" stamps on "in"; 14 keys with Hugging Face yellow covers hang on
// one by one, the counter landing on "14"; on "leaked" a street lamp flickers on and the ring is lying on a public
// pavement at night (drawn in code: slabs, kerb, a lamp that stutters on, its cone); on "valid" every key tip gets a green check; on "shared" copies of the keys fly out to a ring of
// agent dots. Metaphor only: a key = a login.
import React from "react";
import { Column, blurIn, ease, pop, prog, stagger, useScene } from "../../../src/engine";
import { AGENT, Agent, HF, Logo, StepStamp, rand } from "./parts";
import { BUNCH, Check, InKey, RING, Ring, RingKey, keyTip } from "./InKeys";
import { InStreet } from "./InStreet";

const STEP = 3; // frames between keys

/** the 14 keys, the counter, and the checks */
const InRingKeys: React.FC<{ keysAt: number; lie: number; valid: number; shared: number }> = ({ keysAt, lie, valid, shared }) => {
  const { f, ground } = useScene();
  const drop = prog(f, lie, 12, ease.out);
  // hanging: it swings gently; once it lies on the pavement, it barely breathes and the keys splay out
  const sway = Math.sin((f - keysAt) / 16) * 4 * (1 - 0.85 * drop);
  const fan = 0.34 + 0.26 * drop;
  const gather = prog(f, keysAt, (RING.n - 1) * STEP + 8, ease.inOut);
  const scale = (1.1 - 0.1 * gather) - 0.06 * drop;
  const shown = Array.from({ length: RING.n }, (_, i) => f >= stagger(keysAt, i, STEP)).filter(Boolean).length;
  const pulse = (i: number) => Math.max(0, 1 - Math.abs(f - (shared + i)) / 10);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, transformOrigin: `${BUNCH.x}px ${BUNCH.y}px`, zIndex: 3 }}>
      {/* on "leaked" the ring settles flat onto the pavement: a gentle tilt into the ground plane */}
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${BUNCH.x}px ${BUNCH.y}px`, transform: `perspective(1400px) rotateX(${30 * drop}deg)` }}>
      {/* the ring's shadow once it lies on the ground */}
      <div style={{ position: "absolute", left: BUNCH.x - 280, top: BUNCH.y - 220, width: 560, height: 440, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,0,0,0.6), transparent 65%)", opacity: drop, transform: "translate(14px, 22px)" }} />
      <Ring sway={sway} />
      {Array.from({ length: RING.n }, (_, i) => {
        const at = stagger(keysAt, i, STEP);
        if (f < at) return null;
        return <RingKey key={i} i={i} fan={fan} sway={sway} style={pop(f, at, { dur: 8, from: 0.3 })} glow={pulse(i)} />;
      })}
      {Array.from({ length: RING.n }, (_, i) => {
        const at = stagger(valid, i, 2);
        if (f < at) return null;
        const t = keyTip(i, fan, sway, 18);
        return <Check key={i} x={t.x} y={t.y} style={pop(f, at, { dur: 8, from: 0.2 })} />;
      })}
      </div>
      {shown > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1296, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, ...blurIn(f, keysAt, { dur: 7 }) }}>
          <span style={{ fontFamily: "Figtree, sans-serif", fontSize: 118, fontWeight: 800, color: HF, lineHeight: 1, fontVariantNumeric: "tabular-nums", textShadow: `0 0 30px ${HF}55` }}>{shown}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "Inter, sans-serif", fontSize: 38, fontWeight: 600, color: ground.ink }}>
            <Logo name="huggingface" size={44} /> logins
          </div>
        </div>
      )}
    </div>
  );
};

/** a ring of agents around the keys, each receiving a copy on "shared" */
const InShare: React.FC<{ dotsAt: number; shared: number }> = ({ dotsAt, shared }) => {
  const { f } = useScene();
  if (f < dotsAt) return null;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2 - Math.PI / 2;
    const x = 450 + 395 * Math.cos(a);
    const y = 975 + 380 * Math.sin(a) + (rand(i, 7) - 0.5) * 30;
    if (y > 1230 && Math.abs(x - 450) < 300) continue; // the counter's slot
    if (y < 690 && Math.abs(x - 450) < 280) continue; // the stamp's slot
    pts.push({ x, y });
  }
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 5 }}>
      {pts.map((p, i) => {
        const at = stagger(dotsAt, i, 1);
        const ka = stagger(shared, i, 1);
        const t = prog(f, ka, 16, ease.out);
        const got = f >= ka + 16;
        const flash = got ? Math.max(0, 1 - (f - ka - 16) / 14) : 0;
        const kx = BUNCH.x + (p.x - 86 * Math.cos(Math.atan2(p.y - BUNCH.y, p.x - BUNCH.x)) - BUNCH.x) * t;
        const ky = BUNCH.y + (p.y - 86 * Math.sin(Math.atan2(p.y - BUNCH.y, p.x - BUNCH.x)) - BUNCH.y) * t;
        const ang = (Math.atan2(p.y - BUNCH.y, p.x - BUNCH.x) * 180) / Math.PI;
        const bob = Math.sin((f + i * 13) / 14) * 3;
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", inset: 0, ...blurIn(f, at, { dur: 6 }) }}>
              <Agent x={p.x} y={p.y + bob} r={11} color={AGENT} glow={1 + 1.5 * flash} />
            </div>
            {f >= ka && (
              <div style={{ position: "absolute", left: kx, top: ky, width: 0, height: 0, transform: `rotate(${ang}deg)`, opacity: 0.4 + 0.6 * t, filter: t < 0.8 ? "blur(1.5px)" : undefined, marginTop: got ? bob : 0 }}>
                <div style={{ position: "absolute", left: -3, top: -12 }}><InKey id={`c${i}`} seed={i % RING.n} scale={0.34} /></div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** the one agent that finds the ring: flies in on "one", pulses with every key it finds, joins the group */
const InFinder: React.FC<{ at: number; keysAt: number; gone: number }> = ({ at, keysAt, gone }) => {
  const { f } = useScene();
  if (f < at || f > gone + 8) return null;
  const p = prog(f, at, 16, ease.out);
  const x = -40 + (120 - -40) * p;
  const k = Math.max(0, f - keysAt);
  const beat = f >= keysAt ? 1 - (k % STEP) / STEP : 0;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - prog(f, gone, 8), zIndex: 6 }}>
      <Agent x={x} y={BUNCH.y} r={16} glow={1.4 + beat} />
      <div style={{ position: "absolute", left: x - 34, top: BUNCH.y - 34, width: 68, height: 68, borderRadius: 34, border: `3px solid ${AGENT}`, opacity: 0.5 * beat, transform: `scale(${1 + 0.4 * (1 - beat)})` }} />
    </div>
  );
};

export const In: React.FC = () => {
  const { f, cue, endsOn, scene, ground } = useScene();
  const start = scene.from - 6;
  const keysAt = endsOn("14", (RING.n - 1) * STEP + 4);
  const lie = cue("leaked");
  const valid = endsOn("valid", (RING.n - 1) * 2 + 4);
  const shared = cue("shared");
  const stamp = cue("into");
  return (
    <Column>
      <InStreet at={lie} />
      <div style={{ position: "absolute", inset: 0, ...blurIn(f, start, { dur: 10 }) }}>
        <InRingKeys keysAt={keysAt} lie={lie} valid={valid} shared={shared} />
      </div>
      <InFinder at={cue("one") - 8} keysAt={keysAt} gone={cue("and") - 8} />
      <InShare dotsAt={cue("and") - 8} shared={shared} />
      {f >= stamp && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 552, display: "flex", justifyContent: "center", zIndex: 8, fontFamily: "Figtree, sans-serif", ...pop(f, stamp, { dur: 9, from: 1.5 }) }}>
          <StepStamp n={3} label="get in" ink={ground.ink} />
        </div>
      )}
    </Column>
  );
};
