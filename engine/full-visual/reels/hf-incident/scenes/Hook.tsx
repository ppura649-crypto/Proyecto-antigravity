// hook, dark, 0.1-3.9 s: "How did 700 OpenAI agents end up hacking Hugging Face?"
// A photoreal black hall of glass sandbox cubes, the camera surging in while glass cubes fly past the lens and the
// cyan lights ignite row by row from the lens to the far end; the count rolls onto "700" on the far wall; the real
// OpenAI mark lands beside it on "OpenAI"; every light swells on "agents". "end up": the count leaves, the far wall
// warms. "hacking": every light snaps red in one sweep, the camera lurches, red light streams along the floor into the
// vanishing point where the real Hugging Face mark rises over the horizon; "Face": it cracks with light (the reel's one
// slam). Stills + layers: HookHall.tsx.
import React from "react";
import { countTo, ease, prog, useScene } from "../../../src/engine";
import { FarMark, FlyBy, Hall, IMG, Streams, VP } from "./HookHall";
import { AGENT, Logo } from "./parts";

/** the window's vanishing point, px from the top of the stage band (page y 520) */
const VPY = 400;

function useTimes() {
  const { cue, f, theme } = useScene();
  return { f, theme, n700: cue("700"), openai: cue("openai"), agents: cue("agents"), end: cue("end"), hack: cue("hacking"), hug: cue("hugging"), face: cue("face") };
}
type T = ReturnType<typeof useTimes>;

/** the camera: a surge in (fast, then drifting), a lurch on "hacking", a slow push into the mark, a shake on "Face" */
function camAt(t: T, fr: number) {
  const surge = prog(fr, -2, 46, ease.outHard);
  const lurch = prog(fr, t.hack, 12, ease.outHard);
  const push = prog(fr, t.hack + 6, t.face - t.hack, ease.inOut);
  const s = 0.94 + 0.34 * surge + 0.0012 * fr + 0.1 * lurch + 0.12 * push;
  const r = -4 * (1 - prog(fr, -2, 50, ease.out));
  const sh = fr >= t.face ? (1 - prog(fr, t.face, 14, ease.linear)) * 9 : 0;
  return { s, r, dx: Math.sin(fr * 2.3) * sh, dy: Math.cos(fr * 3.1) * sh };
}

/** the world's own motion blur: how fast it is scaling */
const blurAt = (t: T, fr: number) => Math.min(8, Math.abs(Math.log(camAt(t, fr).s / camAt(t, fr - 1).s)) * 260);

function hallAt(t: T) {
  const { f } = t;
  // ignition runs from the lens (source y 1024) to past the vanishing point (300), finishing on "700"
  const ig = prog(f, 0, t.n700 - 2, ease.inOut);
  const lit = 1024 - 740 * ig;
  const pulse = Math.max(0, Math.sin(Math.PI * prog(f, t.agents, 18, ease.linear))) + 0.25 * prog(f, t.end, 20, ease.linear);
  const red = 1024 - 740 * prog(f, t.hack - 1, 7, ease.in);
  const flick = 0.9 + 0.1 * Math.abs(Math.sin(f * 0.9) * Math.sin(f * 0.37));
  return { lit, pulse, red, redOn: f >= t.hack - 1, flick };
}

/** the count on the far wall, and the OpenAI mark landing beside it */
const Count: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const n = Math.round(countTo(f, 4, t.n700 - 4, 0, 700));
  const inO = prog(f, 2, 8, ease.linear);
  const land = f >= t.n700 ? 1 + 0.08 * (1 - prog(f, t.n700, 12, ease.out)) : 1;
  const side = prog(f, t.openai - 2, 10, ease.outHard);
  const mark = prog(f, t.openai, 9, ease.back);
  const out = prog(f, t.end, 9, ease.in);
  if (inO <= 0 || out >= 1) return null;
  const glow = `0 0 40px ${AGENT}AA, 0 0 90px ${AGENT}55`;
  return (
    <div style={{ position: "absolute", left: 0, top: 88, width: 1080, height: 240, opacity: inO * (1 - out), filter: out > 0 ? `blur(${(12 * out).toFixed(1)}px)` : undefined, transform: `translateY(${(-70 * out).toFixed(1)}px)` }}>
      <div
        style={{
          position: "absolute", left: 0, width: 1080, top: 0, textAlign: "center", fontFamily: t.theme.font.ui, fontSize: 210, fontWeight: 800, letterSpacing: -6,
          color: "#fff", textShadow: glow, fontVariantNumeric: "tabular-nums", transform: `translateX(${(-110 * side).toFixed(1)}px) scale(${land.toFixed(4)})`,
        }}
      >
        {n}
      </div>
      {mark > 0 && (
        <div style={{ position: "absolute", left: 540 + 175, top: 48, opacity: prog(f, t.openai, 4, ease.linear), transform: `scale(${(0.5 + 0.5 * mark).toFixed(4)})`, filter: `drop-shadow(0 0 24px ${AGENT})` }}>
          <Logo name="openai" size={150} invert />
        </div>
      )}
    </div>
  );
};

export const Hook: React.FC = () => {
  const t = useTimes();
  const { f } = t;
  const cam = camAt(t, f);
  const mb = blurAt(t, f);
  const hs = hallAt(t);
  // the far mark: a faint warm glow from "end", rises on "hacking", fills the far end by "Hugging", cracks on "Face"
  const warm = prog(f, t.end, t.hack - t.end, ease.in);
  const rise = prog(f, t.hack, 12, ease.outHard);
  const grow = prog(f, t.hack + 8, t.hug - t.hack, ease.inOut);
  const size = 70 + 90 * rise + 80 * grow + 12 * prog(f, t.face, 30, ease.out);
  const crack = prog(f, t.face, 9, ease.outHard);
  const crackO = f >= t.face ? 1 - 0.35 * prog(f, t.face + 6, 16, ease.out) : 0;
  const flash = f >= t.face ? 1 - prog(f, t.face, 12, ease.out) : 0;
  const redFlash = f >= t.hack ? 1 - prog(f, t.hack, 10, ease.out) : 0;
  const edge = "linear-gradient(180deg, transparent 0, #000 50px, #000 860px, transparent 930px)";
  const world: React.CSSProperties = {
    position: "absolute", left: 540 - VP.x, top: VPY - VP.y, width: IMG, height: IMG, transformOrigin: `${VP.x}px ${VP.y}px`,
    transform: `translate(${cam.dx.toFixed(2)}px, ${cam.dy.toFixed(2)}px) rotate(${cam.r.toFixed(3)}deg) scale(${cam.s.toFixed(4)})`,
    filter: mb > 0.4 ? `blur(${mb.toFixed(1)}px)` : undefined,
  };
  return (
    <div style={{ position: "absolute", left: 0, top: 520, width: 1080, height: 930, overflow: "hidden", background: "#000", WebkitMaskImage: edge, maskImage: edge }}>
      <div style={world}>
        <Hall s={hs} />
        <FarMark size={size} o={Math.max(0.35 * warm, rise)} glow={0.4 * warm + 0.6 * rise + 0.6 * crackO} crack={crack} crackO={crackO} flick={hs.flick} />
        <Streams f={f} start={t.hack} />
      </div>
      <FlyBy f={f} starts={[-8, 2, 10, 20, t.agents - 10, t.agents - 2]} />
      <Count t={t} />
      {redFlash > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 70%, rgba(255,40,30,${(0.35 * redFlash).toFixed(3)}), transparent 70%)` }} />}
      {flash > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% ${VPY - 120}px, rgba(255,240,200,${(0.5 * flash).toFixed(3)}), rgba(255,200,60,${(0.25 * flash).toFixed(3)}) 45%, transparent 80%)` }} />}
    </div>
  );
};
