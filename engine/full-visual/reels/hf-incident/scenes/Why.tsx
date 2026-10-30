// Scene `why` (light): "Why Hugging Face? 198 tasks in the test had never been solved by any model. So they went
// looking for how the test was graded, and for its answers. And the test's own files were stored on Hugging Face."
// The test sheet of 898 boxes fills in; the empty ones count to 198 on "198" and pulse red on "never", the swarm
// bumping into them (WhySheet). "So": the sheet shrinks up and the swarm spreads out searching. "graded": a scoring
// rubric card lands, its SCORE stamp thumps, a red "?" and chains with a padlock lock it away; "answers": the answer
// key card does the same, the swarm straining at both. "files": the sheet and both cards slide into a manila folder
// of TEST FILES. "stored": a Hugging Face archive rises; the folder flies to its empty shelf slot on "Hugging"
// while the real mark pops on the roof; by "Face" a red reticle locks on the mark and every agent faces it.
// Facts.md 5 and 6 (198 of 898 never solved; they mostly wanted how the scorer worked; five datasets reached).
import React from "react";
import { Column, arrive, ease, prog, useScene } from "../../../src/engine";
import { WHY_SHEET, WhySheetPaper, type WhyCues } from "./WhySheet";
import { CARD, ChainLock, FOLDER, FolderPart, KeyCard, QBadge, RubricCard } from "./WhyCards";
import { SLOT, WhyBuilding, WhyReticle, WhySwarm } from "./WhyHF";

type T = { x: number; y: number; s: number };

const useWhyCues = (): WhyCues => {
  const { cue, scene } = useScene();
  return {
    from: scene.from, n198: cue("198"), never: cue("ever"), test: cue("tasks"), so: cue("so"), looking: cue("looking"),
    graded: cue("graded"), answers: cue("answers"), tests: cue("tests"), files: cue("files"), stored: cue("stored"),
    hf: cue("hugging", 2), face: cue("face", 2), to: scene.to,
  };
};

/** the sheet: full size, then shrunk up to the top of the stage on "So" */
const sheetT = (f: number, c: WhyCues): T => {
  const p = arrive(f, c.so, 26);
  return { s: 1 - 0.64 * p, x: WHY_SHEET.left + (310 - WHY_SHEET.left) * p, y: WHY_SHEET.top + (545 - WHY_SHEET.top) * p };
};

/** the folder: rises under the cards on "test's", then flies into the shelf slot between "stored" and "Hugging" */
const folderT = (f: number, c: WhyCues): T => {
  const rise = 1 - arrive(f, c.tests - 12, 18);
  const m = arrive(f, c.stored + 2, Math.max(10, c.hf - c.stored));
  const base = { x: 450 - FOLDER.w / 2, y: 1190 + rise * 360, s: 1 };
  return { x: base.x + (SLOT.x - base.x) * m, y: base.y + (SLOT.y - base.y) * m - Math.sin(Math.PI * m) * 120, s: 1 + (SLOT.s - 1) * m };
};

/** a document's transform: where it sits on stage, blended into its place inside the folder on "files" */
const into = (f: number, placed: T, folder: T, local: T, at: number): T & { p: number } => {
  const p = arrive(f, at, 18);
  const tx = folder.x + local.x * folder.s;
  const ty = folder.y + local.y * folder.s;
  const ts = local.s * folder.s;
  return { x: placed.x + (tx - placed.x) * p, y: placed.y + (ty - placed.y) * p - Math.sin(Math.PI * p) * 90, s: placed.s + (ts - placed.s) * p, p };
};

const Doc: React.FC<{ t: T; w: number; h: number; o?: number; blur?: number; children: React.ReactNode }> = ({ t, w, h, o = 1, blur = 0, children }) => (
  <div style={{ position: "absolute", left: t.x, top: t.y, width: w, height: h, transform: `scale(${t.s.toFixed(4)})`, transformOrigin: "0 0", opacity: o, filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
    {children}
  </div>
);

const Card: React.FC<{ c: WhyCues; kind: "rubric" | "key"; folder: T }> = ({ c, kind, folder }) => {
  const { f } = useScene();
  const word = kind === "rubric" ? c.graded : c.answers;
  const at = word - 12;
  if (f < at) return null;
  const p = arrive(f, at, 14);
  const placed = { x: kind === "rubric" ? 50 : 510, y: 852 + (1 - p) * 120, s: 1 };
  const t = into(f, placed, folder, kind === "rubric" ? { x: 60, y: 22, s: 0.62 } : { x: 120, y: 38, s: 0.62 }, c.files - (kind === "rubric" ? 6 : 1));
  const strain = f > word + 22 && f < c.files ? 1 : 0;
  return (
    <Doc t={t} w={CARD.w} h={CARD.h} o={prog(f, at, 3, ease.linear)} blur={(1 - p) * 12}>
      {kind === "rubric" ? <RubricCard stampAt={word - 2} /> : <KeyCard />}
      <ChainLock at={word + (kind === "rubric" ? 10 : 8)} strain={strain} />
      <QBadge at={word + (kind === "rubric" ? 6 : 4)} fade={t.p} side={kind === "rubric" ? "left" : "right"} />
    </Doc>
  );
};

export const Why: React.FC = () => {
  const { f } = useScene();
  const c = useWhyCues();
  const enter = c.from - 6;
  const e = arrive(f, enter, 16);
  const s0 = sheetT(f, c);
  const folder = folderT(f, c);
  const sheet = into(f, { ...s0, y: s0.y + (1 - e) * 240 }, folder, { x: 20, y: 6, s: 0.3 }, c.files + 4);
  const showFolder = f >= c.tests - 12;
  return (
    <Column>
      <WhyBuilding c={c} />
      {showFolder && <Doc t={folder} w={FOLDER.w} h={FOLDER.h}><FolderPart part="back" /></Doc>}
      {f >= enter && (
        <Doc t={sheet} w={WHY_SHEET.width} h={WHY_SHEET.height} o={prog(f, enter, 3, ease.linear)} blur={e < 0.85 ? (1 - e) * 14 : 0}>
          <WhySheetPaper c={c} />
        </Doc>
      )}
      <Card c={c} kind="rubric" folder={folder} />
      <Card c={c} kind="key" folder={folder} />
      {showFolder && <Doc t={folder} w={FOLDER.w} h={FOLDER.h}><FolderPart part="front" /></Doc>}
      <WhySwarm c={c} sheet={s0} folder={folder} />
      <WhyReticle c={c} />
    </Column>
  );
};
