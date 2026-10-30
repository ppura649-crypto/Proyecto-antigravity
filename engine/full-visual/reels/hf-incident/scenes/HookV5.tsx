// Hook V5, dark, 0.1-4.4 s: "How did 700 OpenAI agents end up hacking Hugging Face?"
// THE RING. One physical move: OpenAI's real mark spins up like a launch turbine and spits out agents that fly into a
// tilted orbital ring around it (700 counted, landing on "700"), 3D: near agents big and in front of the mark, far
// ones small behind it. "OpenAI": light sweeps the mark. "agents": 700 visors flare. "end up": the whole fleet banks
// like a turning formation. "hacking": red sweeps round the ring, the OpenAI mark falls away into the dark and the
// ring starts to squeeze, spinning faster as it tightens. "Hugging": the real Hugging Face mark surges up into the
// eye of the ring, which clamps on it: rim sparks, cracks running inward with light pouring through, a growing shake.
// "Face": it shatters, shards flying at the lens, the ring blown outward.
import React, { useMemo } from "react";
import { Column, countTo, ease, prog, useScene } from "../../../src/engine";
import { AGENT, HF, RED } from "./parts";
import { FleetLayer, T, buildTables, countAt } from "./HookV5Fleet";
import { Blast, Dust, HFMark, LaunchWave, OpenAIMark, RimSparks } from "./HookV5Marks";

const TOP = 520;

function useTimes(): T {
  const { cue, f } = useScene();
  return { f, n700: cue("700"), openai: cue("openai"), agents: cue("agents"), end: cue("end"), hack: cue("hacking"), hug: cue("hugging"), face: cue("face") };
}

/** the deep glow behind the ring: cold while OpenAI launches, warming to red on "hacking", gold as the mark breaks */
const Nebula: React.FC<{ t: T }> = ({ t }) => {
  const r = prog(t.f, t.hack, 12, ease.out);
  const g = prog(t.f, t.hug + 6, t.face - t.hug, ease.in);
  const c = g > 0.5 ? HF : r > 0.5 ? RED : AGENT;
  const breathe = 0.85 + 0.15 * Math.sin(t.f / 9);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 42% at 50% 44%, ${c}${r > 0.5 ? "30" : "26"} 0%, ${c}0C 45%, transparent 75%)`, opacity: breathe }} />
  );
};

/** the count, under the ring: it rolls with every agent that leaves the mark and lands exact on "700" */
const Counter: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const n = f >= t.n700 ? 700 : countAt(t, f);
  const land = f >= t.n700 ? 1 + 0.14 * (1 - prog(f, t.n700, 12, ease.out)) : 1;
  const red = f >= t.hack;
  const col = red ? RED : AGENT;
  const inO = prog(f, -6, 8, ease.linear);
  const hit = f >= t.face ? Math.max(0, 1 - (f - t.face) / 10) : 0;
  return (
    <div style={{ position: "absolute", left: 0, width: 900, top: 1300, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 22, opacity: inO, transform: `translate(${(Math.sin(f * 3) * 8 * hit).toFixed(1)}px, 0) scale(${land.toFixed(3)})` }}>
      <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 112, lineHeight: 1, color: "#FFFFFF", fontVariantNumeric: "tabular-nums", letterSpacing: -2, textShadow: `0 0 30px ${col}CC, 0 0 70px ${col}66` }}>
        {String(n).padStart(3, "0")}
      </span>
      <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 34, letterSpacing: 8, color: col }}>AGENTS</span>
    </div>
  );
};

export const HookV5: React.FC = () => {
  const t = useTimes();
  const tb = useMemo(() => buildTables(t), [t.n700, t.end, t.hack, t.hug, t.face]);
  const { f } = t;
  const quake = f >= t.face ? Math.max(0, 1 - (f - t.face) / 18) * 14 : 0;
  const dx = Math.sin(f * 2.3) * quake;
  const dy = Math.cos(f * 3.1) * quake;
  const fade = "linear-gradient(to bottom, transparent 0, #000 70px, #000 860px, transparent 930px)";
  const fadeX = "linear-gradient(to right, transparent 0, #000 70px, #000 830px, transparent 900px)";
  return (
    <Column>
      <div style={{ position: "absolute", left: 0, top: TOP, width: 900, height: 930, overflow: "hidden", WebkitMaskImage: `${fade}, ${fadeX}`, WebkitMaskComposite: "source-in", maskImage: `${fade}, ${fadeX}`, maskComposite: "intersect" }}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)` }}>
          <Nebula t={t} />
          <Dust t={t} />
          <FleetLayer t={t} tb={tb} side="back" />
          <LaunchWave t={t} />
          <OpenAIMark t={t} />
          <HFMark t={t} />
          <FleetLayer t={t} tb={tb} side="front" />
          <RimSparks t={t} shakeY={0} />
          <Blast t={t} />
        </div>
      </div>
      <Counter t={t} />
    </Column>
  );
};
