// hook V1 "THE MARK UNRAVELS", dark, 0.1-4.4 s: "How did 700 OpenAI agents end up hacking Hugging Face?"
// The real OpenAI mark spins in big and glowing and coils on "did"; on "700" its knot unravels into six petals that
// swirl out, spilling streams of agents that land as a 3D fleet on a floor while the count rolls to 700; the petals
// reassemble small on the horizon on "OpenAI" (the fleet's emblem); "agents": the camera pushes in and every visor
// blinks front to back; "end up": the emblem gives way to a far Hugging Face light; "hacking": a wave of eyes snaps
// red, the whole fleet turns as one (red seams, thrusters) and surges into the distance while the mark rushes up;
// "Face": it takes the hit and breaks, light bursting through the cracks, held. Layers: HookV1Bot, Mark, Shatter.
import React, { useMemo } from "react";
import { interpolateColors } from "remotion";
import { Easing } from "remotion";
import { countTo, ease, prog, useScene } from "../../../src/engine";
import { Bot, FLEET, HOR, project, Streak, type Cam, type Slot } from "./HookV1Bot";
import { EMBLEM, LOGO, MarkLight, OpenAIMark, petalAt } from "./HookV1Mark";
import { HFMark } from "./HookV1Shatter";
import { AGENT, HF, RED, rand } from "./parts";

const backOut = Easing.out(Easing.back(1.25));
/** the order the agents pour out in */
const RANK: number[] = (() => {
  const ids = FLEET.map((s) => s.i).sort((a, b) => rand(a, 51) - rand(b, 51));
  const r: number[] = [];
  ids.forEach((id, k) => (r[id] = k));
  return r;
})();

function useTimes() {
  const { f, cue, cueEnd, scene } = useScene();
  return {
    f, from: scene.from, did: cue("did"), n700: cue("700"), n700e: cueEnd("700"), openai: cue("openai"), agents: cue("agents"),
    end: cue("end"), hack: cue("hacking"), face: cue("face"),
  };
}
type T = ReturnType<typeof useTimes>;

const camAt = (t: T, fr: number): Cam => ({
  z: 0.14 * prog(fr, t.n700, t.hack - t.n700, ease.linear) + 0.3 * prog(fr, t.agents - 4, 30, ease.inOut) + 0.3 * prog(fr, t.hack + 12, t.face - t.hack - 12, ease.in),
  x: 0.12 * Math.sin(fr / 55),
});

/** the far Hugging Face mark: a light on the horizon from "end", rushing up from "hacking" to the hit on "Face" */
const hfAt = (t: T, fr: number) => {
  const rush = prog(fr, t.hack + 12, t.face - t.hack - 12, ease.in);
  return {
    o: prog(fr, t.end, 20, ease.out),
    size: 110 + 380 * rush + 34 * prog(fr, t.face, 80, ease.out),
    x: EMBLEM.x,
    y: EMBLEM.y + 175 * rush,
    glow: 0.6 + 0.9 * rush + 0.2 * Math.sin(fr / 6),
  };
};

const bez = (a: { x: number; y: number }, c: { x: number; y: number }, b: { x: number; y: number }, u: number) => ({
  x: (1 - u) * (1 - u) * a.x + 2 * u * (1 - u) * c.x + u * u * b.x,
  y: (1 - u) * (1 - u) * a.y + 2 * u * (1 - u) * c.y + u * u * b.y,
});

/** one agent's whole life: poured out of a petal, standing in the fleet, turned red, launched at the mark */
function agentAt(t: T, sl: Slot, emit: number, fr: number) {
  const cam = camAt(t, fr);
  const home = project(sl, cam);
  const bob = Math.sin(fr / 11 + sl.ph) * 0.035 * home.s;
  const launch = t.hack + 14 + Math.round(8 * sl.r);
  const arrive = t.face - 8 + Math.round(9 * rand(sl.i, 61));
  if (fr >= launch) {
    if (fr >= arrive) return null;
    const a = project(sl, camAt(t, launch));
    const hf = hfAt(t, arrive);
    const b = { x: hf.x + (rand(sl.i, 63) - 0.5) * 0.4 * hf.size, y: hf.y + (rand(sl.i, 65) - 0.5) * 0.3 * hf.size + 0.5 * a.s };
    const c = { x: (a.x + b.x) / 2 + (a.x - 540) * 0.3, y: Math.min(a.y, b.y) - 60 - 120 * sl.r };
    const u = prog(fr, launch, arrive - launch, ease.in);
    const p = bez(a, c, b, u);
    return { x: p.x, y: p.y, s: a.s + (Math.max(5, 0.03 * hf.size) - a.s) * u, fly: true, zr: a.zr };
  }
  if (fr < emit) return undefined;
  const pe = prog(fr, emit, 22, backOut);
  if (pe >= 1) return { x: home.x, y: home.y + bob, s: home.s, fly: false, zr: home.zr };
  const pp = petalAt(sl.i % 6, prog(emit, t.n700, t.openai - t.n700, ease.linear));
  const o = { x: pp.cx, y: pp.cy };
  const dx = o.x - LOGO.x;
  const dy = o.y - LOGO.y;
  const n = Math.hypot(dx, dy) || 1;
  const sw = Math.atan2(dy, dx) + 1.2;
  const p = bez(o, { x: o.x + Math.cos(sw) * 230, y: o.y + Math.sin(sw) * 230 }, home, pe);
  return { x: p.x, y: p.y + bob * pe, s: home.s * (0.2 + 0.8 * Math.min(1, pe)), fly: true, zr: home.zr };
}

const Floor: React.FC<{ t: T; red: number }> = ({ t, red }) => {
  const cam = camAt(t, t.f);
  const col = interpolateColors(red, [0, 1], [AGENT, RED]);
  const zs = Array.from({ length: 16 }, (_, k) => 1 + k * 0.75 - ((cam.z * 1) % 0.75));
  const P = (X: number, Z: number) => project({ i: 0, X, Z, ph: 0, r: 0 }, cam);
  const on = prog(t.f, t.n700, 30, ease.out);
  return (
    <svg width={1080} height={930} style={{ position: "absolute", left: 0, top: 0, opacity: 0.2 * on }}>
      <defs>
        <linearGradient id="v1fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.28" stopColor={col} stopOpacity={0} />
          <stop offset="1" stopColor={col} stopOpacity={1} />
        </linearGradient>
      </defs>
      {Array.from({ length: 21 }, (_, k) => {
        const X = -10 + k;
        const a = P(X, 0.6 + cam.z);
        const b = P(X, 40);
        return <line key={`x${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="url(#v1fade)" strokeWidth={2} />;
      })}
      {zs.map((Z, k) => {
        const y = P(0, Z + cam.z).y;
        return <line key={`z${k}`} x1={0} x2={1080} y1={y} y2={y} stroke="url(#v1fade)" strokeWidth={2} />;
      })}
    </svg>
  );
};

const Counter: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const dur = t.n700e - t.n700 + 4;
  const n = Math.round(countTo(f, t.n700, dur, 0, 700));
  const inP = prog(f, t.n700 + 1, 5, ease.out);
  const out = prog(f, t.agents - 6, 14, ease.in);
  if (inP <= 0 || out >= 1) return null;
  const land = 1 + 0.1 * Math.max(0, 1 - Math.abs(f - (t.n700 + dur)) / 8) * (f >= t.n700 + dur ? 1 : 0);
  return (
    <div
      style={{
        position: "absolute", left: 0, width: 1080, top: 34, textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 118, fontWeight: 800, letterSpacing: -4, lineHeight: 1,
        color: "#fff", fontVariantNumeric: "tabular-nums", opacity: inP * (1 - out), transform: `translateY(${(-40 * out).toFixed(1)}px) scale(${land.toFixed(3)})`,
        textShadow: `0 0 30px ${AGENT}cc, 0 0 80px ${AGENT}66`, filter: out > 0 ? `blur(${(10 * out).toFixed(1)}px)` : undefined,
      }}
    >
      {n}
    </div>
  );
};

export const HookV1: React.FC = () => {
  const t = useTimes();
  const { f } = t;
  // the frame each agent pours out: the moment the rolling count passes its rank
  const emitOf = useMemo(() => {
    const dur = t.n700e - t.n700 + 4;
    const e: number[] = new Array(700).fill(t.n700 + dur);
    let k = 0;
    for (let fr = t.n700; fr <= t.n700 + dur && k < 700; fr++) {
      const c = countTo(fr, t.n700, dur, 0, 700);
      while (k < 700 && k < c) e[k++] = fr;
    }
    return e;
  }, [t.n700, t.n700e]);
  const hf = hfAt(t, f);
  const redAny = prog(f, t.hack, 12, ease.out);
  const sh = f >= t.face ? (1 - prog(f, t.face, 22, ease.linear)) * 16 : f >= t.hack ? (1 - prog(f, t.hack, 10, ease.linear)) * 5 : 0;
  const flash = f >= t.face ? 1 - prog(f, t.face, 16, ease.out) : 0;
  const redFlash = f >= t.hack ? 1 - prog(f, t.hack, 14, ease.out) : 0;
  const ring = prog(f, t.face, 26, ease.outHard);
  const edge = "linear-gradient(180deg, transparent 0, #000 34px, #000 860px, transparent 930px)";

  const bots = FLEET.map((sl) => {
    const st = agentAt(t, sl, emitOf[RANK[sl.i]], f);
    if (!st) return null;
    const prev = agentAt(t, sl, emitOf[RANK[sl.i]], f - (st.fly && f > t.hack ? 4 : 2));
    const dist = Math.hypot(st.x - 540, st.y - 560);
    const redAt = t.hack + dist / 70;
    const red = prog(f, redAt, 4, ease.out);
    const redPulse = f >= redAt ? 1 - prog(f, redAt, 10, ease.out) : 0;
    const wave = f >= t.openai ? Math.max(0, 1 - Math.abs(f - (t.openai + 3 + st.zr * 2.5)) / 5) : 0;
    const bl = prog(f, t.agents + (st.zr - 0.8) * 2.2, 8, ease.linear);
    const blink = 1 - 0.92 * Math.sin(Math.PI * bl);
    const eye = interpolateColors(Math.min(1, red + 0), [0, 1], [interpolateColors(wave, [0, 1], [AGENT, "#EAF8FF"]), RED]);
    const turn = prog(f, redAt + 5, 9, ease.inOut);
    const fog = Math.min(1, Math.max(0, (st.zr - 1.6) / 8));
    const trail = st.fly && prev ? (
      <Streak key={`s${sl.i}`} x1={prev.x} y1={prev.y - 0.8 * st.s} x2={st.x} y2={st.y - 0.8 * st.s} w={Math.max(2, (f > t.hack ? 0.28 : 0.16) * st.s)} color={f > t.hack ? RED : AGENT} o={f > t.hack ? 0.9 : 0.55} />
    ) : null;
    return (
      <React.Fragment key={sl.i}>
        {trail}
        <Bot x={st.x} y={st.y} s={st.s} eye={eye} glow={1 + 1.6 * wave + 1.4 * redPulse + 0.6 * (1 - blink)} turn={turn} fog={st.fly ? fog * 0.5 : fog} blink={blink} />
      </React.Fragment>
    );
  });

  return (
    <div style={{ position: "absolute", left: 0, top: 520, width: 1080, height: 930, overflow: "hidden", WebkitMaskImage: edge, maskImage: edge }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${(Math.sin(f * 2.3) * sh).toFixed(2)}px, ${(Math.cos(f * 3.1) * sh).toFixed(2)}px)` }}>
        <div
          style={{
            position: "absolute", left: -100, width: 1280, top: HOR - 160, height: 520, opacity: prog(f, t.n700, 30, ease.out),
            background: `radial-gradient(ellipse 50% 40% at 50% 32%, ${interpolateColors(redAny, [0, 1], [AGENT + "38", RED + "44"])}, transparent 70%)`,
          }}
        />
        <Floor t={t} red={redAny} />
        <MarkLight t={t} />
        {hf.o > 0 && <HFMark x={hf.x} y={hf.y} size={hf.size} f={f} face={t.face} o={hf.o} glow={hf.glow} />}
        {f >= t.openai && <OpenAIMark t={t} />}
        {bots}
        {f < t.openai && <OpenAIMark t={t} />}
        {ring > 0 && ring < 1 && (
          <div
            style={{
              position: "absolute", left: hf.x - 700 * ring, top: hf.y - 700 * ring, width: 1400 * ring, height: 1400 * ring, borderRadius: "50%",
              border: `${(26 * (1 - ring)).toFixed(1)}px solid ${HF}`, opacity: 1 - ring, boxShadow: `0 0 60px ${HF}`,
            }}
          />
        )}
      </div>
      <Counter t={t} />
      {redFlash > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 60%, rgba(255,40,30,${(0.32 * redFlash).toFixed(3)}), transparent 70%)` }} />}
      {flash > 0 && (
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% ${hf.y}px, rgba(255,250,225,${(0.85 * flash).toFixed(3)}), rgba(255,210,30,${(0.35 * flash).toFixed(3)}) 40%, transparent 80%)` }} />
      )}
    </div>
  );
};
