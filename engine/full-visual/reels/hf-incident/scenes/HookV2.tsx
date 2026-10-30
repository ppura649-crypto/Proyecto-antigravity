// hook V2 "STARLING SWARM", dark, 0.1-4.4 s: "How did 700 OpenAI agents end up hacking Hugging Face?"
// Frame 0: hundreds of glass bot agents already in flight as a murmuration, more pouring in past the lens, the count
// rolling as they join (700 on "700"). "OpenAI": the flock vortexes and snaps into the exact silhouette of the real
// OpenAI mark, which sits faintly under them as the target; the count drops to a tag. "agents": a wave of light runs
// through their eyes. "end up": the formation peels off in arcs and re-forms as a spear of agents while the real
// Hugging Face mark rises warm out of the dark. "hacking": the spear turns red tip to tail, pulls back and launches,
// accelerating, its tail stretching. "Face": impact. Cracks of light race out, the real mark shatters into shards that
// drift in 3D with inertia while light pours through the gaps; the swarm splashes through. Held.
import React from "react";
import { countTo, ease, prog, useScene } from "../../../src/engine";
import { HeroAgent } from "./HookV2Glyph";
import { Target } from "./HookV2Shatter";
import { HIT, OAI, Swarm, tipAt, type Times } from "./HookV2Swarm";
import { AGENT, Logo, rand, RED } from "./parts";

function useTimes(): Times {
  const { cue } = useScene();
  return { n700: cue("700"), openai: cue("openai"), agents: cue("agents"), end: cue("end"), up: cue("up"), hack: cue("hacking"), hug: cue("hugging"), face: cue("face") };
}

type Fly = { a: number; b: number; x0: number; y0: number; s0: number; x1: number; y1: number; s1: number; red?: boolean; out?: boolean };
/** agents up close: past the lens into the flock (depth by scale), peeling off at the camera on "end", and two red
 * outriders plunging with the spear into the mark */
const flights = (t: Times): Fly[] => [
  { a: -8, b: 34, x0: -140, y0: 1330, s0: 200, x1: 470, y1: 980, s1: 20 },
  { a: -4, b: 40, x0: 1230, y0: 690, s0: 150, x1: 650, y1: 900, s1: 20 },
  { a: 4, b: 50, x0: 930, y0: 1580, s0: 240, x1: 560, y1: 1030, s1: 20 },
  { a: 14, b: 46, x0: -160, y0: 640, s0: 120, x1: 410, y1: 900, s1: 20 },
  { a: 26, b: 60, x0: 1210, y0: 1260, s0: 170, x1: 720, y1: 1000, s1: 20 },
  { a: t.end - 4, b: t.end + 24, x0: 640, y0: 940, s0: 20, x1: 1260, y1: 1520, s1: 210, out: true },
  { a: t.end - 1, b: t.end + 28, x0: 420, y0: 880, s0: 20, x1: -220, y1: 660, s1: 170, out: true },
  { a: t.hack + 8, b: t.face + 1, x0: 150, y0: 1400, s0: 120, x1: HIT.x - 70, y1: HIT.y + 60, s1: 26, red: true },
  { a: t.hack + 12, b: t.face + 1, x0: 720, y0: 1420, s0: 100, x1: HIT.x + 50, y1: HIT.y + 70, s1: 24, red: true },
];

function flyAt(q: Fly, fr: number) {
  const p = prog(fr, q.a, q.b - q.a, q.out ? ease.in : q.red ? ease.in : ease.out);
  return { x: q.x0 + (q.x1 - q.x0) * p, y: q.y0 + (q.y1 - q.y0) * p, s: q.s0 * Math.pow(q.s1 / q.s0, p), p };
}

const Heroes: React.FC<{ t: Times; f: number }> = ({ t, f }) => (
  <>
    {flights(t).map((q, i) => {
      if (f < q.a || f > q.b) return null;
      const a = flyAt(q, f), b = flyAt(q, f - 1);
      const o = q.out ? Math.min(1, a.p * 6) : Math.min(1, (1 - a.p) * 5);
      const c = q.red ? RED : AGENT;
      return <HeroAgent key={i} x={a.x} y={a.y - 520} size={a.s} color={c} vx={a.x - b.x} vy={a.y - b.y} rot={(a.x - b.x) * 0.5} o={o} />;
    })}
  </>
);

/** 700 on "700" in the middle of the flock, then down to a tag under the mark as it forms; gone on "end" */
const Count: React.FC<{ t: Times; f: number; font: string }> = ({ t, f, font }) => {
  const n = Math.round(countTo(f, 0, t.n700, 0, 700, ease.out));
  const land = f >= t.n700 ? 1 + 0.1 * (1 - prog(f, t.n700, 14, ease.out)) : 1;
  const m = prog(f, t.openai - 24, 20, ease.inOut);
  const out = prog(f, t.end - 2, 9, ease.in);
  if (out >= 1) return null;
  const y = 960 - 520 + (1395 - 960) * m, size = 230 - 150 * m;
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: y - size * 0.62, textAlign: "center", opacity: 1 - out, transform: `scale(${land.toFixed(4)}) translateY(${(-40 * out).toFixed(1)}px)`, filter: out > 0 ? `blur(${(10 * out).toFixed(1)}px)` : undefined }}>
      <span style={{ fontFamily: font, fontWeight: 800, fontSize: size, letterSpacing: -size * 0.03, color: "#fff", fontVariantNumeric: "tabular-nums", textShadow: `0 0 30px ${AGENT}, 0 0 80px ${AGENT}88, 0 6px 30px #000` }}>{n}</span>
      <span style={{ fontFamily: font, fontWeight: 700, fontSize: 30 + 6 * m, letterSpacing: 6, color: AGENT, marginLeft: 18 * m, display: m > 0.5 ? "inline" : "block", marginTop: -size * 0.12, textShadow: "0 2px 12px #000" }}>AGENTS</span>
    </div>
  );
};

/** dust in three depths: slow parallax drift, pushed out by the impact */
const Dust: React.FC<{ t: Times; f: number }> = ({ t, f }) => (
  <>
    {Array.from({ length: 70 }, (_, i) => {
      const z = 0.3 + 1.2 * rand(i, 1.9);
      const kick = f >= t.face ? (1 - Math.exp(-(f - t.face) / 12)) * 90 * z : 0;
      let x = rand(i, 2.7) * 1080 + f * 0.5 * z * (rand(i, 3.1) - 0.3), y = rand(i, 4.3) * 930 - f * 0.25 * z;
      const dx = x - HIT.x, dy = y + 520 - HIT.y, d = Math.hypot(dx, dy) || 1;
      x += (dx / d) * kick; y += (dy / d) * kick;
      const r = 1 + 2.6 * z * z;
      return <div key={i} style={{ position: "absolute", left: x - r, top: ((y % 930) + 930) % 930 - r, width: 2 * r, height: 2 * r, borderRadius: "50%", background: "#bfe9ff", opacity: 0.1 + 0.18 * z, filter: z > 1.1 ? `blur(${(z * 1.6).toFixed(1)}px)` : undefined }} />;
    })}
  </>
);

export const HookV2: React.FC = () => {
  const { f, theme } = useScene();
  const t = useTimes();
  const lock = prog(f, t.openai - 20, 20, ease.out);
  const unlock = prog(f, t.end - 4, 16, ease.in);
  const logoO = (0.05 + 0.1 * prog(f, 8, t.openai - 8, ease.inOut) + 0.25 * (f >= t.openai ? 1 - prog(f, t.openai, 18, ease.out) : 0)) * (1 - unlock);
  const tip = tipAt(t, f);
  const spearDist = Math.hypot(tip.x - HIT.x, tip.y - HIT.y);
  const k = f - t.face;
  const shake = k >= 0 ? (1 - prog(k, 0, 16, ease.linear)) * 12 : 0;
  const flash = k >= 0 ? 1 - prog(k, 0, 14, ease.out) : 0;
  const ring = k >= 0 ? prog(k, 0, 26, ease.out) : 0;
  const redWash = f >= t.hack ? 1 - prog(f, t.hack, 14, ease.out) : 0;
  const edge = "linear-gradient(180deg, transparent 0, #000 40px, #000 880px, transparent 930px)";
  const cool = 0.25 + 0.45 * lock * (1 - unlock) + 0.15 * Math.sin(f * 0.1);
  return (
    <div style={{ position: "absolute", left: 0, top: 520, width: 1080, height: 930, overflow: "hidden", WebkitMaskImage: edge, maskImage: edge }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${(Math.sin(f * 2.1) * shake).toFixed(2)}px, ${(Math.cos(f * 2.9) * shake).toFixed(2)}px)` }}>
        <div style={{ position: "absolute", left: OAI.x - 560, top: OAI.y - 520 - 560, width: 1120, height: 1120, borderRadius: "50%", opacity: cool, background: `radial-gradient(circle, rgba(90,200,250,0.32) 0%, rgba(40,110,170,0.12) 38%, transparent 66%)` }} />
        <Dust t={t} f={f} />
        {logoO > 0.005 && (
          <div style={{ position: "absolute", left: OAI.x - OAI.size / 2, top: OAI.y - 520 - OAI.size / 2, opacity: logoO, filter: `drop-shadow(0 0 22px ${AGENT})` }}>
            <Logo name="openai" size={OAI.size} invert />
          </div>
        )}
        {k >= 0 && <Swarm t={t} f={f} />}
        <Target t={t} f={f} spearDist={spearDist} />
        {k < 0 && <Swarm t={t} f={f} />}
        <Count t={t} f={f} font={theme.font.ui} />
        {ring > 0 && ring < 1 && (
          <div style={{ position: "absolute", left: HIT.x - 60 - 560 * ring, top: HIT.y - 520 - 60 - 560 * ring, width: 120 + 1120 * ring, height: 120 + 1120 * ring, borderRadius: "50%", border: `${(10 * (1 - ring) + 1).toFixed(1)}px solid rgba(255,230,150,${(0.7 * (1 - ring)).toFixed(3)})`, filter: "blur(2px)" }} />
        )}
        <Heroes t={t} f={f} />
      </div>
      {redWash > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 30% 75%, rgba(255,50,40,${(0.3 * redWash).toFixed(3)}), transparent 70%)` }} />}
      {flash > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${HIT.x}px ${HIT.y - 520}px, rgba(255,250,230,${(0.85 * flash).toFixed(3)}) 0%, rgba(255,200,60,${(0.35 * flash).toFixed(3)}) 30%, transparent 70%)` }} />}
    </div>
  );
};
