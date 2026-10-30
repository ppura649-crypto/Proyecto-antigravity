// hook V3, dark, 0.1-4.4 s: "How did 700 OpenAI agents end up hacking Hugging Face?"   "700 SANDBOXES CRACK"
// From frame 0 the camera is already rushing, banked and low, over an endless floor of glass sandbox cubes, each
// stamped with the real OpenAI mark and holding one small robot agent. The count in the sky rolls and the cubes light
// up as it passes them, landing on "700"; the OpenAI mark lands beside it on "OpenAI" while a flash runs over every
// stamp. "agents": every robot throws its palms against the glass; "end", "up": two more knocks, each leaving a bigger
// star in the glass, the count lifts away, a warm light grows on the horizon. "hacking": the camera tilts up, the
// Hugging Face mark rises there, the glass of every cube bursts in a wave running away from the lens, and the agents
// pour out through the roofs, red, as one river toward the mark. "Face": the mark breaks the way the glass did (same
// star, wedges prised apart, light through every seam, shards in the air), held.
import React from "react";
import { ease, prog, useScene } from "../../../src/engine";
import { AgentDefs } from "./HookV3Agent";
import { CubeDefs, Cubes } from "./HookV3Cubes";
import { Count, HFMark, MarkState } from "./HookV3Mark";
import { arrivedShare, BloomDef, Swarm } from "./HookV3Swarm";
import { Cam, camAt, CELLS, COLS, FL, GAP, H, horizonY, project, ROWS, Times, W, Z0 } from "./HookV3World";
import { HF, RED } from "./parts";

function useTimes(): Times {
  const { cue } = useScene();
  return { n700: cue("700"), openai: cue("openai"), agents: cue("agents"), end: cue("end"), up: cue("up"), hack: cue("hacking"), hug: cue("hugging"), face: cue("face") };
}

/** the floor's seams between the cubes: they stream past under the lens and carry the speed */
const Floor: React.FC<{ cam: Cam }> = ({ cam }) => {
  const segs: string[] = [];
  const zNear = cam.z - 0.6;
  const zFar = Z0 - (ROWS + 2) * GAP;
  for (let col = 0; col <= COLS; col++) {
    const x = (col - COLS / 2) * GAP;
    const a = project(cam, x, 0, zNear);
    const b = project(cam, x, 0, zFar);
    segs.push(`M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`);
  }
  for (let row = -1; row <= ROWS; row++) {
    const z = Z0 - row * GAP + GAP / 2;
    if (z > zNear) continue;
    const a = project(cam, -(COLS / 2) * GAP, 0, z);
    const b = project(cam, (COLS / 2) * GAP, 0, z);
    segs.push(`M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`);
  }
  return <path d={segs.join("")} stroke="rgba(110,190,240,0.13)" strokeWidth={1.2} fill="none" />;
};

function markAt(t: Times, f: number, hz: number): MarkState {
  const rise = prog(f, t.hack - 2, 22, ease.outHard);
  const slam = f >= t.face ? Math.sin(Math.PI * prog(f, t.face, 12, ease.linear)) : 0;
  const size = (170 + 90 * prog(f, t.hack + 8, t.hug - t.hack, ease.inOut) + 45 * prog(f, t.hug, t.face - t.hug, ease.inOut)) * (1 + 0.07 * slam);
  const breathe = f >= t.face + 18 ? 0.04 * Math.sin((f - t.face) * 0.25) : 0;
  return {
    x: W / 2,
    y: hz - size * 0.5 - 16 + (1 - rise) * size * 1.1,
    size,
    rise,
    clipY: rise < 1 ? hz + 3 : H,
    hits: arrivedShare(t, f),
    crack: prog(f, t.face - 1, 10, ease.outHard),
    open: prog(f, t.face + 1, 16, ease.out) + breathe,
    f,
    face: t.face,
  };
}

/** sky, horizon light (cool, then warm as the target nears, then red and gold) */
const Sky: React.FC<{ t: Times; f: number; hz: number }> = ({ t, f, hz }) => {
  const warm = prog(f, t.end, t.hack - t.end + 10, ease.in);
  const red = prog(f, t.hack, 14, ease.out);
  const burst = f >= t.face ? 1 - 0.5 * prog(f, t.face + 4, 30, ease.out) : 0;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, #010207 0px, #040a14 ${hz - 160}px, #0b1d2c ${hz}px, #03070c ${hz + 3}px, #010204 ${H}px)` }} />
      <div style={{ position: "absolute", left: -200, width: W + 400, top: hz - 220, height: 440, background: "radial-gradient(ellipse at 50% 50%, rgba(90,200,250,0.22), transparent 62%)", opacity: 1 - 0.7 * warm }} />
      <div style={{ position: "absolute", left: -100, width: W + 200, top: hz - 300, height: 600, background: `radial-gradient(ellipse at 50% 50%, ${HF}66, rgba(255,150,0,0.18) 35%, transparent 65%)`, opacity: warm * (1 - 0.4 * red) + burst }} />
      <div style={{ position: "absolute", left: -100, width: W + 200, top: hz - 120, height: 380, background: `radial-gradient(ellipse at 50% 30%, ${RED}55, transparent 60%)`, opacity: red * 0.9 }} />
    </>
  );
};

export const HookV3: React.FC = () => {
  const t = useTimes();
  const { f, theme } = useScene();
  const cam = camAt(t, f);
  const hz = horizonY(cam);
  const mark = markAt(t, f, hz);
  const redFlash = f >= t.hack ? 1 - prog(f, t.hack, 12, ease.out) : 0;
  const whiteFlash = f >= t.face ? 1 - prog(f, t.face, 16, ease.out) : 0;
  const speedBlur = Math.max(0, 2.2 * (1 - f / 16));
  const edge = "linear-gradient(180deg, transparent 0, #000 40px, #000 870px, transparent 930px)";
  return (
    <div style={{ position: "absolute", left: 0, top: 520, width: W, height: H, overflow: "hidden", background: "#010204", WebkitMaskImage: edge, maskImage: edge }}>
      <div style={{ position: "absolute", inset: -110, transformOrigin: "50% 60%", transform: `translate(${cam.sx.toFixed(2)}px, ${cam.sy.toFixed(2)}px) rotate(${cam.roll.toFixed(3)}deg) scale(1.07)` }}>
        <div style={{ position: "absolute", left: 110, top: 110, width: W, height: H }}>
          <Sky t={t} f={f} hz={hz} />
          <HFMark s={mark} />
          <svg width={W} height={H} style={{ position: "absolute", inset: 0, filter: speedBlur > 0.2 ? `blur(${speedBlur.toFixed(2)}px)` : undefined }}>
            <defs>
              <AgentDefs />
              <CubeDefs />
              <BloomDef />
            </defs>
            <Floor cam={cam} />
            <Cubes t={t} cam={cam} f={f} />
            <Swarm t={t} cam={cam} f={f} mark={mark} />
          </svg>
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
      {redFlash > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 75%, rgba(255,50,40,${(0.32 * redFlash).toFixed(3)}), transparent 70%)` }} />}
      {whiteFlash > 0 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% ${(mark.y).toFixed(0)}px, rgba(255,250,225,${(0.75 * whiteFlash).toFixed(3)}), rgba(255,210,30,${(0.3 * whiteFlash).toFixed(3)}) 40%, transparent 85%)` }} />}
      <Count t={t} f={f} font={theme.font.ui} />
    </div>
  );
};

// keep the grid size honest: the count says 700
if (CELLS.length !== 700 || FL <= 0) throw new Error("HookV3: the floor must hold exactly 700 sandboxes");
