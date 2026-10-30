// hook V4, dark, "SIEGE ON THE HUB": "How did 700 OpenAI agents end up hacking Hugging Face?"
// A battlefield seen from above and behind the army. Near side: the real OpenAI mark as a gate; far end: the real
// Hugging Face mark as a keep on a plinth inside a wall of yellow light. From frame 0 agents pour out of the OpenAI
// mark up seven lanes into a wedge of seven legions; the count races and lands on 700 on "700". "OpenAI": the gate
// pulses and a flash rolls through the ranks. "agents": every eye flares, front to back. "end up": the eyes turn red in
// a wave running toward the keep and the army leans in. "hacking": all 700 launch in arcs with red trails and strike
// the light wall, which flickers and dies through "Hugging". "Face": cracks race across the mark, it breaks into
// eight chunks that lift apart with weight, light pours out, a shockwave blows the swarm back; held.
// Files: HookV4World (projection, paths), HookV4Swarm, HookV4Ground (floor, gate, count), HookV4Fort, HookV4Break.
import React from "react";
import { Column, ease, prog, useScene } from "../../../src/engine";
import { Keep, KeepLight } from "./HookV4Break";
import { Halo, Plinth, Wall } from "./HookV4Fort";
import { Counter, Ground, Source } from "./HookV4Ground";
import { Swarm } from "./HookV4Swarm";
import { emitted, FORT, getBots, proj, px, shield, type T4 } from "./HookV4World";

const FADE = "linear-gradient(to bottom, transparent 0px, #000 36px, #000 880px, transparent 930px)";
const SIDES = "linear-gradient(to right, transparent 0px, #000 110px, #000 790px, transparent 900px)";

export const HookV4: React.FC = () => {
  const { f, cue, theme } = useScene();
  const T: T4 = { spawnEnd: cue("700") - 1, o: cue("openai"), a: cue("agents"), e: cue("end"), h: cue("hacking"), hg: cue("hugging"), fc: cue("face") };
  const bots = getBots(T);
  const sh = shield(bots, f, T);
  const base = proj(0, FORT.d, FORT.plinthH);
  const size = px(FORT.mark, FORT.d);
  const mid = { x: base.x, y: base.y - size * 0.5 };
  const burst = f >= T.fc ? prog(f, T.fc, 32, ease.out) : 0;
  const siege = prog(f, T.h + 16, 30, ease.linear) * (1 - prog(f, T.fc, 6));
  const blown = prog(f, T.fc, 20, ease.out);
  return (
    <Column>
      <div style={{ position: "absolute", left: 0, top: 520, width: 900, height: 930, overflow: "hidden", WebkitMaskImage: FADE, maskImage: FADE }}>
        <div style={{ position: "absolute", inset: 0, WebkitMaskImage: SIDES, maskImage: SIDES }}>
          <div style={{ position: "absolute", left: 0, top: -520, width: 900, height: 1920 }}>
            <Ground f={f} T={T} light={Math.max(sh.level, blown)} burst={burst} />
            <Halo x={mid.x} y={mid.y} level={sh.level} />
            <KeepLight f={f} fc={T.fc} x={mid.x} y={mid.y} />
            <Wall half="back" level={sh.level} hit={sh.a} f={f} />
            <Swarm bots={bots} f={f} T={T} layer="back" />
            <Plinth level={sh.level} burst={blown} />
            <Keep f={f} T={T} x={base.x} y={base.y} size={size} siege={siege} level={sh.level} />
            <Wall half="front" level={sh.level} hit={sh.a} f={f} />
            <Source f={f} T={T} />
            <Swarm bots={bots} f={f} T={T} layer="front" />
            <KeepLight f={f} fc={T.fc} x={mid.x} y={mid.y} front />
          </div>
        </div>
      </div>
      <Counter f={f} T={T} n={emitted(bots, f)} font={theme.font.ui} />
    </Column>
  );
};
