// Hook X1, dark, 0-3.72 s: "How do Chinese AI companies copy Anthropic models?"
// THE SWARM. The real Claude mark alone, huge, lit, turning slowly, pulsing light at f1. "Chinese": thousands of
// faceless fraudulent accounts pour in out of the dark into a 3D swarm around it (near big, far small and dim, a few
// past the lens). Each pecks the mark and tears off a spark of its terracotta light; the count of exchanges rolls under
// it. "companies": the swarm closes in. "copy": it draws back and plunges as one, the mark is shoved left and the
// stolen light streams as one river to the right, building the Qwen mark point by point. "Anthropic": the count slams
// on 151,000,000 and Claude's mark thins and dims, drained. "models": Qwen ignites whole while the swarm keeps feeding.
import React from "react";
import { Column, ease, prog, useScene } from "../../../src/engine";
import { CLAUDE } from "./parts";
import { BOX, T } from "./HookX1World";
import { Dust, SparkLayer, SwarmLayer } from "./HookX1Swarm";
import { ClaudeMark, Halo, Ignite, Pulse, QwenMark, Ribbon } from "./HookX1Marks";

const TOP = 520;
const TOTAL = 151_000_000;

function useTimes(): T {
  const { cue, f } = useScene();
  return { f, ch: cue("chinese"), ai: cue("ai"), co: cue("companies"), copy: cue("copy"), anth: cue("anthropic"), models: cue("models") };
}

/** the count of exchanges: rolls hard with the pecks from "Chinese", accelerating, and slams on "Anthropic" */
const Counter: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const u = prog(f, t.ch, t.anth - t.ch, (x) => x ** 1.6);
  const n = f >= t.anth ? TOTAL : Math.floor(TOTAL * u);
  const land = f >= t.anth ? 1 + 0.16 * (1 - prog(f, t.anth, 14, ease.out)) : 1;
  const inO = prog(f, t.ch - 2, 8, ease.linear);
  const hit = f >= t.anth ? Math.max(0, 1 - (f - t.anth) / 12) : 0;
  return (
    <div style={{ position: "absolute", left: 0, width: 900, top: 1296, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: inO, transform: `translate(${(Math.sin(f * 3) * 7 * hit).toFixed(1)}px, 0) scale(${land.toFixed(3)})` }}>
      <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 96, lineHeight: 1, color: "#FFFFFF", fontVariantNumeric: "tabular-nums", letterSpacing: -2, textShadow: `0 0 26px ${CLAUDE}CC, 0 0 64px ${CLAUDE}66` }}>
        {n.toLocaleString("en-US")}
      </span>
      <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: 9, color: CLAUDE }}>EXCHANGES</span>
    </div>
  );
};

/** the dark has a warm core where the mark is, and turns cold as it is drained */
const Nebula: React.FC<{ t: T }> = ({ t }) => {
  const d = prog(t.f, t.anth, 30, ease.out);
  const breathe = 0.85 + 0.15 * Math.sin(t.f / 9);
  return <div style={{ position: "absolute", inset: 0, opacity: breathe * (1 - 0.5 * d), background: `radial-gradient(ellipse 62% 44% at 50% 42%, ${CLAUDE}24 0%, ${CLAUDE}0A 45%, transparent 75%)` }} />;
};

export const HookX1: React.FC = () => {
  const t = useTimes();
  const { f } = t;
  const kick = f >= t.copy ? Math.max(0, 1 - (f - t.copy) / 14) * 9 : 0;
  const dx = Math.sin(f * 2.3) * kick;
  const dy = Math.cos(f * 3.1) * kick;
  const fade = `linear-gradient(to bottom, transparent 0, #000 70px, #000 ${BOX.h - 80}px, transparent ${BOX.h}px)`;
  const fadeX = `linear-gradient(to right, transparent 0, #000 60px, #000 ${BOX.w - 60}px, transparent ${BOX.w}px)`;
  return (
    <Column>
      <div style={{ position: "absolute", left: 0, top: TOP, width: BOX.w, height: BOX.h, overflow: "hidden", WebkitMaskImage: `${fade}, ${fadeX}`, WebkitMaskComposite: "source-in", maskImage: `${fade}, ${fadeX}`, maskComposite: "intersect" }}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)` }}>
          <Nebula t={t} />
          <Dust t={t} />
          <SwarmLayer t={t} side="back" />
          <Halo t={t} />
          <Pulse t={t} />
          <ClaudeMark t={t} />
          <Ribbon t={t} />
          <SwarmLayer t={t} side="front" />
          <QwenMark t={t} />
          <SparkLayer t={t} />
          <Ignite t={t} />
          <SwarmLayer t={t} side="lens" />
        </div>
      </div>
      <Counter t={t} />
    </Column>
  );
};
