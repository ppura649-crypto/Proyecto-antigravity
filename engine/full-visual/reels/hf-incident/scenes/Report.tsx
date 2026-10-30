// "OpenAI published the full report, and it's wild. In July, it tested its models on a hacking benchmark, with the
// safety filters off on purpose. Each agent was locked in its own sandbox: no internet, no contact with the others."
// OpenAI: the mark rises alone. published: the real report page rises and the mark flies into its header.
// report: "Read the technical report" is pressed. wild: the title gets a marker underline (ReportPage).
// July: an LED scoreboard arrives. models: one cyan agent dot per lane is born. hacking: "HACKING BENCHMARK" lights.
// safety: a steel toggle plate "SAFETY FILTERS". off: the bat is thrown to OFF, the lamp goes amber, lanes run hot.
// each/agent onward: the sealed containment cell and its agent (ReportSandbox, drawn in ReportChamber): the glass
// shutter drops and bolts on "locked", the Wi-Fi hologram dies on "internet", the grid of sealed cells on "others".
import React from "react";
import { Column, useScene } from "../../../src/engine";
import { FlyingMark, ReportPage } from "./ReportPage";
import { SafetySwitch, Scoreboard } from "./ReportBench";
import { Sandbox } from "./ReportSandbox";

function useCues() {
  const { cue, endsOn, scene } = useScene();
  return {
    t0: scene.from - 6,
    rise: cue("published") - 2,
    report: cue("report"),
    wild: cue("wild"),
    pageOut: cue("in") - 6,
    board: cue("july") - 8,
    models: cue("models"),
    hacking: cue("hacking"),
    safety: cue("safety"),
    off: cue("off"),
    benchOut: cue("each") - 10,
    zoom: cue("each") - 6,
    lid: endsOn("locked", 8),
    locked: cue("locked"),
    sandbox: cue("sandbox"),
    no: cue("no"),
    internet: cue("internet"),
    contact: cue("contact"),
    others: cue("others"),
  };
}

export const Report: React.FC = () => {
  const c = useCues();
  return (
    <Column>
      <ReportPage c={{ rise: c.rise, report: c.report, wild: c.wild, out: c.pageOut }} />
      <FlyingMark t0={c.t0} rise={c.rise} out={c.pageOut} />
      <Scoreboard c={{ board: c.board, models: c.models, hacking: c.hacking, safety: c.safety, off: c.off, out: c.benchOut }} />
      <SafetySwitch c={{ board: c.board, models: c.models, hacking: c.hacking, safety: c.safety, off: c.off, out: c.benchOut }} />
      <Sandbox c={{ zoom: c.zoom, lid: c.lid, locked: c.locked, sandbox: c.sandbox, no: c.no, internet: c.internet, contact: c.contact, others: c.others }} />
    </Column>
  );
};
