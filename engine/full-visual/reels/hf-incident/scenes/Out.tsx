// Scene `out` (dark, 38.9-47.4): "Step one: get out. That server was allowed online, just to download packages. So they
// asked it to download anything they wanted, and it became their window to the internet."
// The package server stands where `locker` left it (HANDOFF.server). STEP 1 "get out" stamps on "out"; the plate
// flashes on "server"; on "online" one cable to a globe lights and a "packages only" sign hangs under the tower's one
// small window, parcels coming down the cable one by one (OutServer, OutParcels). On "asked" the swarm passes a note up;
// on "anything" the sign swings loose and the parcels become every shape, faster; the window stretches wide into a view
// of the internet, ending on "window", with the swarm at its sill (OutView). Metaphor objects only.
import React from "react";
import { Column, ease, prog, useScene } from "../../../src/engine";
import { StepStamp } from "./parts";
import { OutCable, OutSign, OutSwarm, OutTower, type OutCues } from "./OutServer";
import { OutParcels } from "./OutParcels";
import { OUT_SILL, OutWindow } from "./OutView";

const useOutCues = (): OutCues => {
  const { cue, scene } = useScene();
  return {
    from: scene.from, out: cue("out"), server: cue("server"), online: cue("online"), packages: cue("packages"),
    asked: cue("made"), anything: cue("anything"), window: cue("window"), to: scene.to,
  };
};

/** the stamp slams on "out", a touch oversized first, then breathes */
export const OutStamp: React.FC<{ at: number; n: number; label: string }> = ({ at, n, label }) => {
  const { f, ground, theme } = useScene();
  if (f < at) return null;
  const p = prog(f, at, 8, ease.out);
  const s = 1.5 - 0.5 * p;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 540, display: "flex", justifyContent: "center", opacity: prog(f, at, 3, ease.linear), transform: `scale(${s.toFixed(3)})`, filter: p < 0.7 ? `blur(${((0.7 - p) * 10).toFixed(1)}px)` : undefined }}>
      <StepStamp n={n} label={label} ink={ground.ink} style={{ fontFamily: theme.font.ui }} />
    </div>
  );
};

export const Out: React.FC = () => {
  const c = useOutCues();
  return (
    <Column>
      <OutStamp at={c.out} n={1} label="get out" />
      <OutTower c={c} />
      <OutCable c={c} />
      <OutParcels c={c} />
      <OutSign c={c} />
      <OutWindow c={c} />
      <OutSwarm c={c} sill={OUT_SILL} />
    </Column>
  );
};
