// Hook X5, dark, 0.1-3.7 s: "How do Chinese AI companies copy Anthropic models?"
// THE REFLECTION THAT WALKS AWAY. Claude's real mark, a glossy slab, stands on a black glass floor under a spotlight,
// still whirling down from a spin at f1, its reflection perfect beneath it, the camera drifting. "Chinese": Claude
// whips a full turn and its reflection does not follow; it goes a beat late, a violet stain seeping up it. "AI",
// "companies": each whip, the lag grows and the glass starts to shiver around it. "copy": it tears out of the floor
// (the glass rings, droplets fly), peels up on its hinge beside the original, whirling, and rebuilds itself into the
// real Qwen mark, landing on "Anthropic" under its own light. "Anthropic": the two face each other, and every move the
// original makes, the copy makes a beat late. "models": it snaps into sync, and outshines the original.
import React from "react";
import { Column, ease, prog, useScene } from "../../../src/engine";
import { Hinged, Standing, type Look } from "./HookX5Mark";
import { Beam, Contact, Droplets, Dust, FLOOR, Flare, Floor, H, Ripples, W, type Ripple } from "./HookX5World";

type T = { f: number; ch: number; ai: number; co: number; cp: number; an: number; mo: number };
const L0 = 330;
const L1 = 280;
const CXA = 240;
const CXB = 664;

const bump = (f: number, s: number, d: number) => Math.sin(Math.PI * prog(f, s, d, ease.linear));
const whip = (f: number, s: number, d: number) => 360 * prog(f, s, d, ease.back);

/** Claude's own turn: a spin already winding down at f1, then a full whip on each word before "copy" */
const turn = (t: T, f: number) =>
  720 * (1 - Math.exp(-(f + 10) / 18)) + 10 * Math.sin(f / 23) + whip(f, t.ch, 20) + whip(f, t.ai, 17) + whip(f, t.co, 15);

/** how far behind the original the reflection runs, in frames */
const lagOf = (t: T, f: number) => 9 * prog(f, t.ch - 2, 8) + 6 * prog(f, t.ai, 8) + 8 * prog(f, t.co, 8);

/** the original's moves on "Anthropic", which the copy repeats late: lean in, a hop, a turn toward it */
const gesture = (t: T, f: number) => ({
  rotZ: 9 * bump(f, t.an + 2, 20),
  lift: 44 * bump(f, t.an + 16, 18),
  rotY: 26 * bump(f, t.an + 26, 22),
});

function claude(t: T) {
  const { f } = t;
  const push = prog(f, t.cp - 2, 26, ease.back);
  const face = prog(f, t.an - 6, 14, ease.out) * (1 - prog(f, t.mo, 14, ease.out));
  const g = gesture(t, f);
  const sync = bump(f, t.mo + 2, 22);
  const dim = prog(f, t.mo + 2, 16, ease.out);
  const look: Look = {
    size: L0 + (L1 - L0) * prog(f, t.cp, 26, ease.inOut),
    rotY: turn(t, f) + 34 * face + g.rotY,
    rotZ: -2 * Math.sin(f / 31) - g.rotZ,
    tint: 0,
    morph: 0,
    bright: 1 - 0.42 * dim + 0.06 * Math.sin(f / 4) * dim,
  };
  const ghosts = [turn(t, f - 2), turn(t, f - 1)];
  const fast = Math.abs(turn(t, f) - turn(t, f - 1)) > 6;
  return { look, x: 450 + (CXA - 450) * push, lift: g.lift + 50 * sync, ghosts: fast ? ghosts : [], dim };
}

/** the reflection, which becomes the copy: one continuous object from f0 to the end */
function copy(t: T) {
  const { f } = t;
  const L = lagOf(t, f);
  const tear = f >= t.cp;
  const baseAt = (fr: number) => turn(t, fr - lagOf(t, fr));
  const b = baseAt(Math.min(f, t.cp));
  const target = Math.ceil(b / 360) * 360 + 360;
  const spinP = prog(f, t.cp, 44, ease.out);
  const lagQ = 12 * (1 - prog(f, t.mo, 5, ease.outHard));
  const g = gesture(t, f - lagQ);
  const face = prog(f, t.an - 2, 14, ease.out) * (1 - prog(f, t.mo, 14, ease.out));
  const sync = bump(f, t.mo + 2, 22);
  const rotY = tear ? b + (target - b) * spinP - 34 * face - g.rotY : turn(t, f - L);
  const u = prog(f, t.cp, 28, ease.inOut);
  const phi = tear ? 192 * (1 - prog(f, t.cp, 26, ease.back)) : 180 + 12 * prog(f, t.cp - 12, 12, ease.in);
  const strain = prog(f, t.co, 20, ease.out);
  const look: Look = {
    size: L0 + (L1 - L0) * prog(f, t.cp, 26, ease.inOut),
    rotY,
    rotZ: tear ? g.rotZ - 2 * Math.sin(f / 29) : 3.5 * strain * Math.sin(f / 4.5),
    tint: Math.min(1, 0.55 * prog(f, t.ch, 26, ease.inOut) + 0.3 * strain + 0.15 * prog(f, t.cp, 8)),
    morph: prog(f, t.cp + 6, 30, ease.inOut),
    bright: 1 + 0.4 * prog(f, t.mo, 10, ease.out) + 0.5 * bump(f, t.cp + 34, 10),
  };
  const ghostsOn = tear && spinP < 0.8;
  const ghost = (d: number) => b + (target - b) * prog(f - d, t.cp, 44, ease.out) - 34 * face;
  return {
    look,
    x: 450 + (CXB - 450) * u,
    lift: (tear ? 150 * bump(f, t.cp, 28) : 0) + g.lift + 90 * sync,
    phi,
    mirror: 1 - prog(f, t.cp, 18, ease.out),
    wave: (0.35 * prog(f, t.ch, 20) + 0.65 * strain) * (1 - prog(f, t.cp, 8, ease.linear)),
    scale: 1 + 0.2 * prog(f, t.mo, 16, ease.back),
    ghosts: ghostsOn ? [ghost(2), ghost(1)] : [],
    tear,
  };
}

/** the glass's liquid shimmer: horizontal bands that crawl, stronger as the reflection strains */
const WaveFilter: React.FC<{ f: number; k: number }> = ({ f, k }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id="hx5wave" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency={`0.004 ${(0.035 + 0.006 * Math.sin(f / 6)).toFixed(4)}`} numOctaves={2} seed={3} />
      <feDisplacementMap in="SourceGraphic" scale={(6 + 26 * k).toFixed(1)} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

export const HookX5: React.FC = () => {
  const { f, cue } = useScene();
  const t: T = { f, ch: cue("chinese"), ai: cue("ai"), co: cue("companies"), cp: cue("copy"), an: cue("anthropic"), mo: cue("models") };
  const c = claude(t);
  const q = copy(t);
  const camX = -34 + 0.32 * f + 10 * Math.sin(f / 40);
  const zoom = 1.08 - 0.09 * prog(f, t.cp - 4, 40, ease.inOut) + 0.00025 * f;
  const violet = prog(f, t.mo, 12);
  const spotB = t.cp + 24;
  const flick = f >= spotB ? (f < spotB + 8 ? (Math.floor((f - spotB) / 2) % 2 ? 0.2 : 0.9) : 1) : 0;
  const spots = [
    { x: c.x, k: 1 - 0.6 * c.dim + (c.dim > 0 ? 0.12 * Math.sin(f * 1.7) * c.dim : 0), color: "#FFE9D6" },
    { x: q.x, k: q.tear ? flick * (0.75 + 0.9 * violet) : 0, color: violet > 0.3 ? "#B8B4FF" : "#E6E4FF" },
  ];
  const ripples: Ripple[] = [
    { at: t.ch + 2, x: 450, amp: 0.35, color: "#B9B5FF", reach: 260 },
    { at: t.ai + 2, x: 450, amp: 0.35, color: "#B9B5FF", reach: 280 },
    { at: t.co + 2, x: 450, amp: 0.5, color: "#B9B5FF", reach: 320 },
    { at: t.cp, x: 450, amp: 1, color: "#E4E2FF", reach: 620 },
    { at: t.cp + 27, x: CXB, amp: 0.6, color: "#CFCBFF", reach: 360 },
    { at: t.mo + 2, x: CXB, amp: 0.8, color: "#A7A2FF", reach: 520 },
  ];
  const tearFlash = 1 - prog(f, t.cp, 14, ease.out);
  const px = (k: number) => `translateX(${(-camX * k).toFixed(1)}px)`;
  const fadeY = "linear-gradient(to bottom, transparent 0, #000 80px, #000 840px, transparent 930px)";
  const fadeX = "linear-gradient(to right, transparent 0, #000 110px, #000 790px, transparent 900px)";
  const upright = q.phi < 90;
  const copyEl = <Hinged look={q.look} at={{ x: q.x, floor: FLOOR, lift: q.lift, scale: q.scale }} phi={q.phi} mirror={q.mirror} wave={q.wave} ghosts={q.ghosts} glow={`drop-shadow(0 0 ${(18 + 30 * violet).toFixed(0)}px rgba(120,114,255,${(0.5 + 0.4 * violet).toFixed(2)}))`} />;
  return (
    <Column>
      <WaveFilter f={f} k={q.wave} />
      <div style={{ position: "absolute", left: 0, top: 520, width: W, height: H, overflow: "hidden", WebkitMaskImage: `${fadeY}, ${fadeX}`, WebkitMaskComposite: "source-in" }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: "450px 560px", transform: `scale(${zoom.toFixed(4)})` }}>
          <div style={{ position: "absolute", inset: -200, left: -200, transform: px(0.4) }}>
            <div style={{ position: "absolute", left: 200, top: 200, width: W, height: H }}>
              <Floor camX={camX} violet={violet} />
            </div>
          </div>
          <div style={{ position: "absolute", inset: 0, transform: px(1) }}>
            {spots.map((s, i) => (
              <Beam key={i} s={s} id={`hx5s${i}`} />
            ))}
            {q.tear && q.phi < 150 && (
              <Hinged look={q.look} at={{ x: q.x, floor: FLOOR, lift: -q.lift, scale: q.scale }} phi={180} mirror={1} wave={0} opacity={prog(f, t.cp + 22, 16) * (0.55 + 0.2 * violet)} />
            )}
            <Ripples f={f} list={ripples} />
            {!upright && copyEl}
            <div style={{ position: "absolute", left: 450 - 300 * (1 - tearFlash), top: FLOOR - 3, width: 600 * (1 - tearFlash), height: 6, borderRadius: 3, background: "linear-gradient(to right, transparent, #FFFFFF, transparent)", opacity: f >= t.cp ? tearFlash : 0, boxShadow: "0 0 30px #8D88FF" }} />
            <Contact x={c.x} w={c.look.size * 0.8} k={0.9} />
            {q.tear && <Contact x={q.x} w={q.look.size * 0.8} k={prog(f, t.cp + 22, 8) * Math.max(0, 1 - q.lift / 80)} />}
            <Flare f={f} at={t.mo} x={q.x} y={FLOOR - L1 * 0.5 * q.scale - q.lift} />
            <Standing look={c.look} at={{ x: c.x, floor: FLOOR, lift: c.lift }} ghosts={c.ghosts} glow={`drop-shadow(0 0 ${(24 - 16 * c.dim).toFixed(0)}px rgba(217,119,87,${(0.45 - 0.35 * c.dim).toFixed(2)}))`} />
            {upright && copyEl}
            <Droplets f={f} at={t.cp} x={450} n={34} power={1} />
            <Droplets f={f} at={t.cp + 27} x={CXB} n={14} power={0.55} />
          </div>
          <div style={{ position: "absolute", inset: 0, transform: px(0.1) }}>
            <Dust f={f} camX={camX} spots={spots} />
          </div>
        </div>
      </div>
    </Column>
  );
};
