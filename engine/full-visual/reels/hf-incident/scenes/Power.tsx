// Scene `power` (light, 47.8-54.3): "Step two: get power. A bug in how the server renewed login tokens turned a
// read-only pass into an admin pass." STEP 2 "get power" stamps on "power" over a chunky "login renewal" machine with
// a READ-ONLY pass waiting in its slot. A small beetle walks into its gears on "bug": sparks, a jolt, the screen tears.
// The pass is pulled in on "renewed", the plate lights on "tokens", the pass flies back out to the front showing
// READ-ONLY on "read-only", and on "admin" the same card turns gold, ADMIN, with a shine sweep. Metaphor objects only.
import React from "react";
import { Column, arrive, ease, prog, useScene } from "../../../src/engine";
import { OutStamp } from "./Out";
import { PM, PowerBug, PowerMachineBody, powerShake, type PowerCues } from "./PowerMachine";
import { PowerPass, powerDim } from "./PowerPass";

const usePowerCues = (): PowerCues => {
  const { cue, scene } = useScene();
  return {
    from: scene.from, power: cue("power"), bug: cue("bug"), renewed: cue("renewed"), tokens: cue("logins"),
    turned: cue("turned"), ro: cue("read-only"), admin: cue("admin"), to: scene.to,
  };
};

const PowerMachinePlaced: React.FC<{ c: PowerCues }> = ({ c }) => {
  const { f } = useScene();
  const enter = c.from - 6;
  if (f < enter) return null;
  const p = arrive(f, enter, 16);
  const d = powerDim(f, c);
  const s = 1 - 0.1 * d;
  return (
    <div style={{ position: "absolute", left: PM.x + powerShake(f, c), top: PM.y + (1 - p) * 200 + 60 * d, width: PM.w, height: PM.h, transform: `scale(${s.toFixed(3)})`, opacity: prog(f, enter, 3, ease.linear) * (1 - 0.55 * d), filter: p < 0.85 ? `blur(${((1 - p) * 12).toFixed(1)}px)` : undefined }}>
      <PowerMachineBody c={c} />
    </div>
  );
};

export const Power: React.FC = () => {
  const c = usePowerCues();
  return (
    <Column>
      <OutStamp at={c.power} n={2} label="get power" />
      <PowerMachinePlaced c={c} />
      <PowerBug c={c} />
      <PowerPass c={c} />
    </Column>
  );
};
