// Scene `file` (dark): "The first: Hugging Face opens the data files people upload, and one file format can point to
// other files, so they pointed it at the server's own secrets."
// Zero-day #1 (the cracked padlock from `weekend`) pins itself on "first". Hugging Face's building is cut open in
// depth: parcels ride in on the intake belt; HF's claw lifts one on "opens" and it opens on "upload"; a tag rises out
// of it, "see other file", its arrow pointing at the other parcels on "point"; on "pointed" the arrow swings up, its
// beam punches through the ceiling into the vault on "server's", and the vault door swings open on "secrets".
// Metaphor only: no file names, formats or contents.
import React from "react";
import { Column, blurIn, pop, useScene } from "../../../src/engine";
import { RED } from "./parts";
import { Shell, Vault } from "./FileBuilding";
import { Claw, Intake, Pointer, type FileCues } from "./FileParcel";
import { Padlock } from "./WeekendGate";

const FileBadge: React.FC<{ at: number }> = ({ at }) => {
  const { f, ground } = useScene();
  if (f < at) return null;
  return (
    <div style={{ position: "absolute", left: 50, top: 548, width: 330, height: 96, zIndex: 8, ...pop(f, at, { dur: 9, from: 0.5 }), transformOrigin: "0 50%" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 80, height: 96, transform: "scale(0.8)", transformOrigin: "0 0" }}>
        <Padlock x={38} y={40} crack={at - 120} id="file" />
      </div>
      <div style={{ position: "absolute", left: 78, top: 18, fontFamily: "Figtree, sans-serif", fontSize: 46, fontWeight: 800, color: ground.ink, whiteSpace: "nowrap" }}>
        zero-day <span style={{ color: RED }}>#1</span>
      </div>
    </div>
  );
};

export const FileScene: React.FC = () => {
  const { f, cue, endsOn, scene } = useScene();
  const start = scene.from - 6;
  const beamDur = 22;
  const c: FileCues = {
    grab: cue("opens") - 10,
    upload: cue("upload"),
    format: cue("format"),
    point: cue("point"),
    other: cue("other"),
    pointed: cue("pointed"),
    beam: endsOn("own", beamDur),
    beamDur,
    secrets: cue("secrets"),
  };
  return (
    <Column>
      <div style={{ position: "absolute", inset: 0, ...blurIn(f, start, { dur: 12, rise: 30 }) }}>
        <Shell />
        <Vault open={c.secrets} beam={c.beam} />
        <Intake c={c} />
        <Claw c={c} />
        <Pointer c={c} />
      </div>
      <FileBadge at={cue("first")} />
    </Column>
  );
};
