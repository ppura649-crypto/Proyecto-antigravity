// Hook X2, dark, 0-3.72 s: "How do Chinese AI companies copy Anthropic models?"
// THE COPIER. The real Claude mark lies on the glass of a copier seen in steep 3D, a scan lamp already crossing it at
// f1. "Chinese": the carriage is yanked back and arms, flickering on into a hard violet-white bar with glare and
// spill. "AI": it reads the mark, printing a white-hot duplicate on the glass. "companies": the machine charges, the
// duplicate's edge trembles. "copy": the lamp sweeps and the duplicate peels off behind it like a fresh sheet, flies
// to the tray with flutter, recolours in a violet flash and hardens into the real Qwen mark. "Anthropic" / "models":
// overdrive, passes faster and faster, copies peeling off one after another into a Qwen pile, the original on the
// glass fading a little with every pass.
import React, { useMemo } from "react";
import { Column, ease, prog, useScene } from "../../../src/engine";
import { CLAUDE, QWEN } from "./parts";
import { Body, Flare, Lamp, Original, Tray, lampCol } from "./HookX2Machine";
import { LandRings, Pile, Preload, Sheet, Trail, hash } from "./HookX2Copies";
import { T, buildPlan, lampAt, passesDone } from "./HookX2Plan";

const TOP = 520;

function useTimes(): T {
  const { cue, f } = useScene();
  return { f, chinese: cue("chinese"), ai: cue("ai"), companies: cue("companies"), copy: cue("copy"), anthropic: cue("anthropic"), models: cue("models"), end: cue("models") + 30 };
}

/** the camera: a slow push-in and turn from f0, a kick on every copy that leaves, a buzz in overdrive */
function camera(t: T, detaches: number[], heat: number) {
  const { f } = t;
  const kick = detaches.reduce((s, d) => s + (f >= d ? Math.exp(-(f - d) / 5) * Math.sin((f - d) * 0.9) : 0), 0);
  const glide = prog(f, -24, 90, ease.out);
  const tilt = 52 - 7 * glide - 3 * prog(f, 0, 220, ease.inOut) + 1.2 * kick;
  const rot = -30 + 13 * glide + 5 * prog(f, 0, 220, ease.inOut) + 0.4 * Math.sin(f / 30);
  const zoom = 70 + 80 * glide + 40 * prog(f, 0, 220, ease.inOut) + 25 * prog(f, t.anthropic, 60, ease.inOut);
  const buzz = heat * 2.2;
  const pan = prog(f, t.models - 8, 34, ease.inOut);
  return { tilt, rot, zoom: zoom + 15 * pan, dx: Math.sin(f * 2.1) * buzz - 105 * pan, dy: Math.cos(f * 2.9) * buzz + 30 * pan };
}

/** the dark has volume: glow pools under the machine (Claude warm) and the tray (Qwen violet), dust at the lens */
const Atmosphere: React.FC<{ f: number; heat: number; taken: number }> = ({ f, heat, taken }) => {
  const warm = Math.max(0.1, 0.45 - 0.05 * taken);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 45% 32% at 30% 55%, ${CLAUDE}${Math.round(warm * 70).toString(16).padStart(2, "0")} 0%, transparent 70%), radial-gradient(ellipse 45% 35% at 74% 42%, ${QWEN}${Math.round(30 + 60 * heat).toString(16)} 0%, transparent 72%)` }} />
      <svg width={900} height={930} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 70 }, (_, i) => {
          const z = 0.3 + hash(i, 5) * 1.2;
          const x = ((hash(i, 6) * 900 + f * (0.4 + heat * 2) * z) % 900 + 900) % 900;
          const y = ((hash(i, 7) * 930 - f * 0.5 * z) % 930 + 930) % 930;
          return <circle key={i} cx={x} cy={y} r={1.1 * z + 0.3} fill="#D8D6FF" opacity={0.12 + 0.25 * z * (0.6 + 0.4 * Math.sin(f / 7 + i))} />;
        })}
      </svg>
    </>
  );
};

export const HookX2: React.FC = () => {
  const t = useTimes();
  const pl = useMemo(() => buildPlan(t), [t.chinese, t.ai, t.companies, t.copy, t.anthropic, t.models]);
  const { f } = t;
  const L = lampAt(t, pl, f);
  const prev = lampAt(t, pl, f - 1.5);
  const taken = passesDone(pl, f);
  const detaches = pl.copies.map((c) => c.detach);
  const cam = camera(t, [t.chinese, ...detaches], L.heat);
  const charge = prog(f, t.companies, t.copy - t.companies, ease.in);
  const hit = detaches.reduce((s, d) => s + (f >= d - 2 ? 0.6 * Math.exp(-(f - d + 2) / 4) : 0), 0) + (f >= t.chinese ? 0.9 * Math.exp(-(f - t.chinese) / 6) : 0);
  const face = `rotateZ(${(-cam.rot).toFixed(2)}deg) rotateX(${(-cam.tilt).toFixed(2)}deg)`;
  const fade = "linear-gradient(to bottom, transparent 0, #000 60px, #000 850px, transparent 930px)";
  const fadeX = "linear-gradient(to right, transparent 0, #000 50px, #000 850px, transparent 900px)";
  return (
    <Column>
      <Preload />
      <div style={{ position: "absolute", left: 0, top: TOP, width: 900, height: 930, overflow: "hidden", WebkitMaskImage: `${fade}, ${fadeX}`, WebkitMaskComposite: "source-in", maskImage: `${fade}, ${fadeX}`, maskComposite: "intersect" }}>
        <Atmosphere f={f} heat={L.heat} taken={taken} />
        <div style={{ position: "absolute", inset: 0, perspective: 1500, perspectiveOrigin: "450px 300px", transform: `translate(${cam.dx.toFixed(1)}px, ${cam.dy.toFixed(1)}px)` }}>
          <div style={{ position: "absolute", left: 465, top: 390, width: 0, height: 0, transformStyle: "preserve-3d", transform: `translateZ(${cam.zoom.toFixed(1)}px) rotateX(${cam.tilt.toFixed(2)}deg) rotateZ(${cam.rot.toFixed(2)}deg)` }}>
            <Body f={f} heat={L.heat} />
            <Tray heat={L.heat} n={pl.copies.filter((c) => f >= c.land).length} />
            <Original lampY={L.y} power={L.power} taken={taken} col={lampCol(L.cool)} />
            <Lamp y={L.y} prevY={prev.y} power={L.power} heat={L.heat} cool={L.cool} />
            <Pile copies={pl.copies} f={f} />
            <LandRings copies={pl.copies} f={f} />
            {pl.copies.map((c) => (
              <React.Fragment key={c.k}>
                <Trail c={c} f={f} />
                <Sheet c={c} f={f} charge={c.k === 0 ? charge : 0} />
              </React.Fragment>
            ))}
            <Flare y={L.y} power={L.power} heat={L.heat} cool={L.cool} face={face} hit={Math.min(1, hit)} />
          </div>
        </div>
      </div>
    </Column>
  );
};
