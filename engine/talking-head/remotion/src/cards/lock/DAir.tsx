import React from "react";
import { spring } from "remotion";
import type { CardProps } from "../props";
import { ACCENT, INK, LABEL_FONT } from "../theme";
import { Agent, Beam, DChip, Floor, Mark, Wall, airGeo, clamp01, easeIO, easeOut, swell } from "./DAirParts";

// reference edit J famD, THE SPONSOR: one object in three states (V20 -> V21 -> V22).
// assets order everywhere: [air.png, claude-agent-icon.png].
// The live highlight on the wall's top edge runs off one absolute origin so the three
// events read as one continuous object and never restart.
const LIVE_FROM = 79095;
const LIVE_MS = 1900;
const live = (tMs: number): number => (tMs < LIVE_FROM ? 0 : ((tMs - LIVE_FROM) % LIVE_MS) / LIVE_MS);

export type DAirData = { label?: string; url?: string; chips?: string[]; bad?: string; badge?: string; pct?: string; word?: string };

const pop = (tMs: number, at: number, fps: number): number =>
  spring({ frame: Math.max(0, ((tMs - at) / 1000) * fps), fps, config: { damping: 15, stiffness: 300, mass: 0.7 } });

// V20 `dwall`: "AIR Security is basically a firewall for your AI agents."
//   AIR 77033        the real mark pops, nothing behind it
//   basically 78095  dark blocks stack off the floor, one per 88 ms
//   firewall 78695   the wall completes six high and its top edge lights
//   agents. 80135    the Claude agent pops on the protected side, named in their words
export const DWall: React.FC<CardProps & { data: DAirData }> = ({ tMs, w, h, fps, fromMs, beats, assets, data }) => {
  const g = airGeo(w, h);
  const start = beats.basically ?? fromMs + 1000;
  const rise = (i: number) => clamp01((tMs - (start + i * 88)) / 170);
  const flash = swell((tMs - (beats.firewall ?? 1e9)) / 520);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: clamp01((tMs - fromMs) / 120) }}>
      <Floor g={g} w={w} />
      <Mark g={g} src={assets[0]} pop={pop(tMs, beats.air ?? fromMs, fps)} url={data.url} />
      <Wall g={g} rise={rise} seam={0} flash={flash} live={live(tMs)} />
      <Agent g={g} src={assets[1]} label={data.label ?? "your AI agents"} pop={pop(tMs, beats.agents ?? 1e9, fps)} />
    </div>
  );
};

type Leg = { in: number; sweep: number; tick: number; go: number; land: number };

// V21 `dvet`: "They vet every skills, MCP or plug-ins before they even run."
// V20's finished picture, held still; only the beam and the three chips move.
//   vet 80834        a beam draws down the wall's face and lights the slot
//   skills, 81494    `skill` is swept, ticked, and goes through to the agent's side
//   MCP 82154        `MCP`, swept, ticked, through
//   plug-ins 82947   `plug-in` is swept, the sweep opens `curl | sh` inside it,
//                    terracotta x, it bounces back and drops outside the wall
//   run. 84321       the two vetted chips pulse once; the refused one lies outside
export const DVet: React.FC<CardProps & { data: DAirData }> = ({ tMs, w, h, fps, beats, assets, data }) => {
  const g = airGeo(w, h);
  const names = data.chips ?? ["skill", "MCP", "plug-in"];
  const fs = 30 * g.s;
  const vet = beats.vet ?? 0;
  const beam = clamp01((tMs - vet) / 420);
  const seam = clamp01((tMs - (vet + 216)) / 260);

  const legs: Leg[] = [
    { in: beats.every ?? 0, sweep: beats.skills ?? 0, tick: (beats.skills ?? 0) + 220, go: (beats.skills ?? 0) + 446, land: (beats.skills ?? 0) + 766 },
    { in: beats.mcp ?? 0, sweep: (beats.mcp ?? 0) + 240, tick: (beats.mcp ?? 0) + 450, go: (beats.mcp ?? 0) + 666, land: (beats.mcp ?? 0) + 986 },
  ];
  const pulse = swell((tMs - (beats.run ?? 1e9)) / 420);

  const bad = beats.plugins ?? 1e9;
  const badSweep = clamp01((tMs - (bad + 240)) / 260);
  const badReveal = clamp01((tMs - (bad + 433)) / 260);
  const badTick = clamp01((tMs - (bad + 693)) / 180);
  const bounce = easeOut(clamp01((tMs - (bad + 913)) / 110));
  const drop = easeIO(clamp01((tMs - (bad + 1023)) / 250));
  const badEnter = easeOut(clamp01((tMs - bad) / 240));
  const badLeft = -g.chipW + badEnter * (g.scanLeft + g.chipW) + bounce * (g.outLeft - g.scanLeft);
  const badTop = g.scanTop + drop * (g.outTop - g.scanTop);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Floor g={g} w={w} />
      <Mark g={g} src={assets[0]} pop={1} url={data.url} />
      {legs.map((L, i) => {
        const enter = easeOut(clamp01((tMs - L.in) / 240));
        const travel = easeIO(clamp01((tMs - L.go) / (L.land - L.go)));
        const x = -g.chipW + enter * (g.scanLeft + g.chipW) + travel * (g.passLeft - g.scanLeft);
        const restTop = i === 0 ? g.passTop1 : g.passTop2;
        const fall = easeIO(clamp01((travel - 0.58) / 0.42));
        return (
          <DChip
            key={names[i]} g={g} left={x} top={g.scanTop + fall * (restTop - g.scanTop)}
            width={g.chipW} text={names[i]} fs={fs}
            sweep={clamp01((tMs - L.sweep) / 220)}
            tick="ok" tickP={clamp01((tMs - L.tick) / 180)}
            opacity={clamp01((tMs - L.in) / 120)}
            scale={1 + 0.05 * (travel >= 1 ? pulse : 0)}
          />
        );
      })}
      <DChip
        g={g} left={badLeft} top={badTop} width={g.chipW}
        text={names[2] ?? "plug-in"} fs={fs}
        sweep={badSweep} reveal={badReveal} revealText={data.bad ?? "curl | sh"}
        tick="no" tickP={badTick} rot={-8 * drop}
        opacity={clamp01((tMs - bad) / 120)}
      />
      <Wall g={g} rise={() => 1} seam={seam} flash={0} live={live(tMs)} />
      <Beam g={g} p={beam} />
      <Agent g={g} src={assets[1]} label={data.label ?? "your AI agents"} pop={1} />
    </div>
  );
};

// V22 `dsafe`: "So anything that you download from their marketplace is 100% safe."
// V21's finished picture, held still; one badged chip comes down from the mark and
// crosses the same wall with no beam and no stop, then their number and their word land.
//   anything 84961    the chip appears under the AIR mark and descends to the slot
//   from 85981        it waits one beat at the wall's face
//   marketplace 86521 it crosses, unswept, and lands on the agent's side
//   100% 87394        `100%` lands large in the accent
//   safe. 87934       `safe` lands white under it
export const DSafe: React.FC<CardProps & { data: DAirData }> = ({ tMs, w, h, fps, beats, assets, data }) => {
  const g = airGeo(w, h);
  const names = data.chips ?? ["skill", "MCP", "plug-in"];
  const fs = 30 * g.s;
  const okW = 0.25 * w;
  const okStart = { x: g.markCx - okW / 2, y: 0.365 * h };
  const okMid = 0.539 * h;
  const okEnd = { x: 0.492 * w, y: g.passTop2 - 0.196 * h };

  const down = easeIO(clamp01((tMs - (beats.anything ?? 0)) / 720));
  const across = easeIO(clamp01((tMs - (beats.from ?? 1e9)) / Math.max(200, (beats.marketplace ?? 0) - (beats.from ?? 0))));
  const okX = okStart.x + across * (okEnd.x - okStart.x);
  const okY = okStart.y + down * (okMid - okStart.y) + across * (okEnd.y - okMid);

  const pct = pop(tMs, beats.hundred ?? 1e9, fps);
  const word = pop(tMs, beats.safe ?? 1e9, fps);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Floor g={g} w={w} />
      <Mark g={g} src={assets[0]} pop={1} url={data.url} />
      <DChip g={g} left={g.passLeft} top={g.passTop1} width={g.chipW} text={names[0]} fs={fs} tick="ok" tickP={1} />
      <DChip g={g} left={g.passLeft} top={g.passTop2} width={g.chipW} text={names[1]} fs={fs} tick="ok" tickP={1} />
      <DChip g={g} left={g.outLeft} top={g.outTop} width={g.chipW} text={names[2]} fs={fs}
        reveal={1} revealText={data.bad ?? "curl | sh"} tick="no" tickP={1} rot={-8} />
      <Wall g={g} rise={() => 1} seam={1} flash={0} live={live(tMs)} />
      <Agent g={g} src={assets[1]} label={data.label ?? "your AI agents"} pop={1} />
      <DChip
        g={g} left={okX} top={okY} width={okW} text={data.word ?? "anything"} fs={28 * g.s}
        badge={data.badge ?? "Checked by AIR"} badgeFs={25 * g.s} z={6}
        scale={0.74 + 0.26 * pop(tMs, beats.anything ?? 0, fps)}
        opacity={Math.min(1, pop(tMs, beats.anything ?? 0, fps) * 2)}
      />
      <div
        style={{
          position: "absolute", left: 0.837 * w, top: 0.062 * h, zIndex: 7,
          transform: `translateX(-50%) scale(${0.62 + 0.38 * pct})`,
          opacity: Math.min(1, pct * 2),
          fontFamily: LABEL_FONT, fontWeight: 700, fontSize: 94 * g.s, lineHeight: 1.05,
          color: ACCENT, letterSpacing: "0.01em", whiteSpace: "nowrap",
        }}
      >
        {data.pct ?? "100%"}
      </div>
      <div
        style={{
          position: "absolute", left: 0.837 * w, top: 0.290 * h, zIndex: 7,
          transform: `translateX(-50%) scale(${0.7 + 0.3 * word})`,
          opacity: Math.min(1, word * 2),
          fontFamily: LABEL_FONT, fontWeight: 700, fontSize: 58 * g.s,
          color: INK, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap",
        }}
      >
        safe
      </div>
    </div>
  );
};
