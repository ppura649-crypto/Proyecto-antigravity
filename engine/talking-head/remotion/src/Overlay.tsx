import React from "react";
import { Img, interpolate, Sequence, spring, staticFile, useVideoConfig } from "remotion";
import { Chart } from "./cards/Chart";
import { BarsPick, TwoBar, Growth } from "./cards/Designed";
import { Transform } from "./cards/Transform";
import { RuleWhy } from "./cards/RuleWhy";
import { Becomes } from "./cards/Becomes";
import { DimRead } from "./cards/DimRead";
import { Skim, type SkimPage } from "./cards/Skim";
import { Term, type TermLine } from "./cards/Term";
import { ClaudeCode, type CcLine } from "./cards/ClaudeCode";
import { Fanout } from "./cards/Fanout";
import { Logos } from "./cards/Logos";
import { Prompt } from "./cards/Prompt";
import { Split } from "./cards/Split";
import { Swarm } from "./cards/Swarm";
import { Weigh } from "./cards/Weigh";
import { Versus } from "./cards/Versus";
import { Library } from "./cards/Library";
import { Crowd } from "./cards/Crowd";
import { Roles, type Role } from "./cards/Roles";
import { Scale } from "./cards/Scale";
import { Overload } from "./cards/Overload";
import { Spread } from "./cards/Spread";
import { Merge } from "./cards/Merge";
import { Timeline, type TimelineData } from "./cards/Timeline";
import { Tracks, type Lane } from "./cards/Tracks";
import { Template, type TplLine } from "./cards/Template";
import { CraftList } from "./cards/CraftList";
import { Pipeline, type Chip } from "./cards/Pipeline";
import { Skills } from "./cards/Skills";
import { Toolbox, type Tool } from "./cards/Toolbox";
import { Idea } from "./cards/Idea";
import { Stack } from "./cards/Stack";
import { Bars, type Bar } from "./cards/Bars";
import { Packs, type Pack } from "./cards/Packs";
import { Receipt, type Row } from "./cards/Receipt";
import { Layers } from "./cards/Layers";
import { Figures, type Figure } from "./cards/Figures";
import { Reach, type ReachRow } from "./cards/Reach";
import { Fill } from "./cards/Fill";
import { Entire } from "./cards/Entire";
import { Cta } from "./cards/Cta";
import { Theatre } from "./cards/Theatre";
import { Loop } from "./cards/Loop";
import { Gather } from "./cards/Gather";
import { Forward } from "./cards/Forward";
import { Firehose } from "./cards/Firehose";
import { Race } from "./cards/Race";
import { Opportunities } from "./cards/Opportunities";
import { Value } from "./cards/Value";
import { Before } from "./cards/Before";
import { DocVsList } from "./cards/DocVsList";
import { SkillCard } from "./cards/SkillCard";
import { Hollow } from "./cards/Hollow";
import { Doom } from "./cards/Doom";
import { Steps } from "./cards/Steps";
// edit-c-chip (2026-09-05): the NVIDIA / Jalapeño family, one component per plan row
import type { CardProps } from "./cards/props";
import { LOCK_KINDS } from "./cards/lock";
import { TALK_KINDS } from "./cards/talk"; // reference edit H (2026-09-12): the talk-vs-type families
import { ONESHOT_KINDS } from "./cards/oneshot"; // edit-h-oneshot (2026-09-13): the one-shot families
import { LETTERS_KINDS } from "./cards/letters"; // edit-i-oneshot (2026-09-13): the hand delivered letters families
import { HOLO_KINDS } from "./cards/holo"; // reference edit K (2026-09-23): the Holo sponsored families
import { KF_KINDS } from "./cards/kf"; // keyframes-v1 (2026-09-25): the Keyframes families
import { TwoScale, type TwoScaleData } from "./cards/TwoScale";
// edit-c-evals (2026-09-06), the skill scorecard video
import { SkillDrag, type SkillDragData } from "./cards/SkillDrag";
import { OldModels, type OldModelsData } from "./cards/OldModels";
import { TaskFold, type TaskFoldData } from "./cards/TaskFold";
import { Tries, type TriesData } from "./cards/Tries";
import { Runs, type RunsData } from "./cards/Runs";
import { Scorecard, type ScorecardData } from "./cards/Scorecard";
import { TaskFan, type TaskFanData } from "./cards/TaskFan";
import { Lanes, type LanesData } from "./cards/Lanes";
import { MplRuns, type MplRunsData } from "./cards/MplRuns";
import { BenchTable, type BenchTableData } from "./cards/BenchTable";
import { Trash, type TrashData } from "./cards/Trash";
import { Die, type DieData } from "./cards/Die";
import { Bubbles, type BubblesData } from "./cards/Bubbles";
import { Bench, type BenchData } from "./cards/Bench";
import { MplBars, type MplBarsData } from "./cards/MplBars";
import { Latency, type LatencyData } from "./cards/Latency";
import { Curves, type CurvesData } from "./cards/Curves";
import { KernelSlot, type KernelSlotData } from "./cards/KernelSlot";
import { DevField, type DevFieldData } from "./cards/DevField";
import { Moat, type MoatData } from "./cards/Moat";
import { Dates, type DatesData } from "./cards/Dates";
// edit-g-b (the guest, 2026-09-13, the one-shot rerun): real surfaces of the workflow
import { CalWeek } from "./cards/CalWeek";
import { Seats } from "./cards/Seats";
import { LoginFlip } from "./cards/LoginFlip";
import { FinderFootage } from "./cards/FinderFootage";
import { ZipDl } from "./cards/ZipDl";
import { YearStrip } from "./cards/YearStrip";
import { OutputChart } from "./cards/OutputChart";
import { Profiles } from "./cards/Profiles";
import { Nle } from "./cards/Nle";
import { Accounts } from "./cards/Accounts";
import { ProfilesLit } from "./cards/ProfilesLit";
import { Unzip } from "./cards/Unzip";
import { StratLine } from "./cards/StratLine";
import { DropIn } from "./cards/DropIn";
import { ReelGrid } from "./cards/ReelGrid";
// reference edit G (the guest, 2026-09-10): the recipe + the box family
import { Todo } from "./cards/Todo";
import { Chairs } from "./cards/Chairs";
import { SignIn } from "./cards/SignIn";
import { Footage } from "./cards/Footage";
import { Box } from "./cards/Box";
import { Calendar } from "./cards/Calendar";
import { Tiles } from "./cards/Tiles";
import { Ring } from "./cards/Ring";
import { PhoneEdit } from "./cards/PhoneEdit";
import { ViewsLine } from "./cards/ViewsLine";
import { RingLit } from "./cards/RingLit";
import { BoxOpen } from "./cards/BoxOpen";
import { Pricing } from "./cards/Pricing";
import { Composer } from "./cards/Composer";
import { Pour } from "./cards/Pour";
import { Gens, type GensData } from "./cards/Gens";
import { Flywheel, type FlywheelData } from "./cards/Flywheel";
import { MplLine, type MplLineData } from "./cards/MplLine";
import { Ladder, type LadderData } from "./cards/Ladder";
import type { CaptionStyle } from "./CaptionReel";
import { styleOf, type Frame } from "./styles";

// a card's outer frame from the style (Creator Format 1: square, no border; glass: rounded, hairline, frosted)
const frameCss = (f: Frame): React.CSSProperties => ({
  borderRadius: f.radius,
  backgroundColor: f.bg,
  border: f.border === "none" ? undefined : f.border,
  boxShadow: f.shadow,
  backdropFilter: f.backdrop,
  WebkitBackdropFilter: f.backdrop,
});

// Creator Format 1 visual layer: one card at a time in the top band, motion INSIDE
// the card only (scroll / zoom / tint sweep), hard pop in, hard cut out.

export type Sweep = { atMs: number; y: number; h: number };
export type Metric = { label: string; value: string; note: string };
export type Side = { title: string; sub: string; score: string };
export type VisualEvent = {
  id: string;
  fromMs: number;
  toMs: number;
  // shot = screenshot card, float = frameless graphic,
  // designed kinds = animated cards, cta = text line
  kind:
    | "shot" | "float" | "barspick" | "chart" | "twobar" | "dimread" | "skim" | "term" | "fill" | "entire"
    | "transform" | "growth" | "rulewhy" | "becomes" | "cta" | "claudecode" | "fanout"
    | "timeline" | "reach" | "tracks" | "template" | "craftlist" | "pipeline" | "layers" | "figures"
    | "skills" | "toolbox" | "idea" | "stack" | "bars" | "packs" | "receipt"
    // the explainer family: every one of these DRAWS the mechanism the creator is
    // describing (the creator 2026-09-04, rejecting a layer of page captures:
    // "actual VISUALS that explain what the person is trying to say")
    | "prompt" | "split" | "swarm" | "weigh" | "versus" | "library"
    | "crowd" | "roles" | "scale" | "overload" | "spread" | "converge"
    // reference edit D: one drawn mechanism per spoken sentence
    | "theatre" | "loop" | "gather" | "forward" | "firehose" | "race"
    | "opportunities" | "value" | "before" | "docvslist" | "skillcard"
    // reference edit D v2: the block that turns out to be a shell, and the footprints that
    // replaced `theatre` and `forward` when both read as uncreative
    | "hollow" | "steps" | "doom"
    // edit-c-chip: the NVIDIA / Jalapeño family (visual-plan.md v3)
    | "twoscale" | "die" | "bubbles" | "bench" | "mplbars" | "latency" | "curves"
    | "kernelslot" | "devfield" | "moat" | "dates" | "gens" | "flywheel" | "mplline" | "ladder"
    | "skilldrag" | "oldmodels" | "taskfold" | "tries" | "runs" | "scorecard" | "taskfan" | "lanes" | "mplruns" | "benchtable" | "trash"
    // reference edit G (the guest): the to-do sheet, chairs, sign-in flip, footage folder, the box family, the two charts
    | "todo" | "chairs" | "signin" | "footage" | "box" | "calendar" | "tiles" | "ring" | "phoneedit" | "viewsline" | "ringlit" | "boxopen" | "pricing" | "composer" | "pour"
    | "logos"
    | (string & {}); // reference edit J: kinds registered in cards/lock/ (see LOCK_KINDS)
  asset?: string; // public-relative path (render.mjs prefixes <slug>-assets/)
  assetW?: number; // device px of the PNG
  assetH?: number;
  asset2?: string; // second image (becomes card)
  asset2W?: number;
  asset2H?: number;
  card: { yFrac?: number; wFrac: number; hFrac?: number; frame?: "light" | "dark" | "none";
    // a centrepiece that needs more room than the band above their head: it hangs
    // from the safe line instead and the footage stays visible behind it
    takeover?: boolean;
    // reference edit K (2026-09-24, "put it higher, it shouldn't touch my face"): a per-event band that wins over the
    // caption style's, and `fit` scales a card taller than that band down from its top so it never spills onto them
    bandTopFrac?: number; bandBottomFrac?: number; fit?: boolean; vAlign?: "center" | "bottom" };
  tShift?: number;
  blur?: boolean; // the footage blurs under this card (a style with blurDefault false needs it per event)
  scroll?: { from: number; to: number; fromMs?: number }; // asset device px at the card's top edge; fromMs: hold at `from` until then (v4, TechCrunch shows whole, then glides)
  zoom?: { from: number; to: number };
  sweeps?: Sweep[]; // asset device px, terracotta tint jumps between them
  beats?: Record<string, number>; // spine-ms markers for designed cards
  keep?: { y: number; h: number }[]; // dimread: lines that stay bright
  offset?: number; // dimread: device px scrolled under the card top
  pages?: SkimPage[]; // skim: real pages with their torn lines
  tokens?: number; // skim: where the counter stops
  lines?: TermLine[]; // term: lines with their times
  fontPx?: number; // term: font size override
  counter?: { from: number; to: number }; // fill: the token counter
  address?: string; // entire: the r.jina.ai address shown over the page
  keepOne?: { y: number; h: number }; // entire: the snippet's line rect
  label?: string; // float: the name under the mark
  label2?: string; // float: the name under the second mark
  title?: string; // term: a tab / file name above the lines
  prompt?: string; // claudecode: what is typed into the ">" box
  promptAtMs?: number;
  typeMs?: number;
  model?: string; // claudecode: the welcome box's model line
  cwd?: string;
  whatsNew?: string[];
  chrome?: string; // shot: a real browser bar with this URL over the capture
  agents?: { name: string }[]; // fanout: the branches
  parent?: string; // fanout: the one in charge
  merge?: boolean; // fanout: run it backwards, the answers coming home
  items?: { src: string; w: number; h: number }[]; // logos: the real marks, one per beat
  cols?: number; // logos: marks per row
  pulseAtMs?: number; // logos: the beat where they all move together
  perMs?: number; // fanout: gap between agents landing
  startMs?: number;
  push?: { atMs: number; ms?: number; scale?: number; ox?: number; oy?: number }; // claudecode: the camera move
  userName?: string; // claudecode
  mode?: "welcome" | "session"; // claudecode: the first screen, or a run in progress
  clockFromMs?: number; // claudecode: where the elapsed clock on the task rows starts
  winW?: number; // claudecode: the window's own size; the card must carry its aspect
  winH?: number;
  // timeline: the real clips + levels of this take; reach: the real accounts.
  // `data.assets` is rewritten to the project's public path by render.mjs.
  data?: {
    // edit-g-b: each card file owns its data type
    calweek?: Record<string, unknown>;
    seats?: Record<string, unknown>;
    loginflip?: Record<string, unknown>;
    finderfootage?: Record<string, unknown>;
    zipdl?: Record<string, unknown>;
    yearstrip?: Record<string, unknown>;
    outputchart?: Record<string, unknown>;
    profiles?: Record<string, unknown>;
    nle?: Record<string, unknown>;
    accounts?: Record<string, unknown>;
    profileslit?: Record<string, unknown>;
    unzip?: Record<string, unknown>;
    stratline?: Record<string, unknown>;
    dropin?: Record<string, unknown>;
    reelgrid?: Record<string, unknown>;
    // reference edit G: each card file owns its own data type; Overlay passes it through
    todo?: Record<string, unknown>;
    chairs?: Record<string, unknown>;
    signin?: Record<string, unknown>;
    footage?: Record<string, unknown>;
    box?: Record<string, unknown>;
    calendar?: Record<string, unknown>;
    tiles?: Record<string, unknown>;
    ring?: Record<string, unknown>;
    phoneedit?: Record<string, unknown>;
    viewsline?: Record<string, unknown>;
    ringlit?: Record<string, unknown>;
    boxopen?: Record<string, unknown>;
    pricing?: Record<string, unknown>;
    composer?: Record<string, unknown>;
    pour?: Record<string, unknown>;
    assets?: string[];
    timeline?: TimelineData;
    rows?: ReachRow[];
    total?: number;
    lanes?: Lane[];
    simple?: number;
    title?: string;
    titleMore?: string;
    file?: string;
    lines?: TplLine[];
    frames?: string[];
    fan?: boolean;
    note?: string;
    items?: string[];
    land?: string;
    chips?: Chip[];
    frame?: string;
    labels?: string[];
    captionWord?: string;
    figures?: Figure[];
    noteAtMs?: number;
    names?: string[];
    skills?: string[];
    bars?: Bar[];
    foot?: { to: number; name: string; atMs: number; rollMs?: number };
    packs?: Pack[];
    live?: string;
    rows2?: Row[];
    results?: Row[];
    ruleAtMs?: number;
    tools?: Tool[];
    ask?: string;
    head?: string;
    time?: string;
    // explainer family
    ask?: { ask: string; words: string; hint?: string; model?: string };
    split?: { job: string; items: string[]; parent?: string };
    weigh?: { left: Metric; right: Metric; source?: string };
    versus?: { left: Side; right: Side; tasks?: number; agents?: number };
    library?: { count: number; unit: string; names: string[]; install: string; source?: string };
    crowd?: { head: string; total?: number; cols?: number; lit: number[]; note: string };
    roles?: { head: string; rows: Role[]; down: string; up: string };
    scale?: { head: string; left: Metric; right: Metric; source?: string };
    overload?: { head: string; tasks?: number; score: string; fill?: number; meterLabel: string };
    spread?: { head: string; agents?: number; score: string; depthLabel: string; meterLabel: string };
    converge?: { head: string; sheets?: number; label: string };
    // reference edit D
    theatre?: { counters: { label: string; to: number }[]; dead: { label: string; value: string } };
    loop?: { nodes: string[]; exit: string };
    gather?: { lanes: { label: string; at: number; glyph: "doc" | "claude" | "bookmark" | "plan" }[]; bin: { label: string } };
    forward?: { mode: "stuck" | "moving"; startLabel: string; markerLabel: string; measureLabel: string; steps?: string[] };
    firehose?: { question: string; chips: string[] };
    race?: { top: { label: string }; bottom: { label: string }; wallLabel: string };
    opportunities?: { ideas: string[] };
    value?: { whole: string; sliver: string; rest: string; hard: string };
    before?: { slotLabel: string; outcome: string; prompt: string; model: string; tier: string };
    docvslist?: { docTitle: string; docLines: { t: string; kind: "h" | "p" }[]; pages: number; readMark: string; items: string[] };
    skillcard?: { file: string; frontmatter: { k: string; v: string }[]; description: string };
    hollow?: { feels: string };
    doom?: { title: string; lines: { t: string; kind: "h" | "p" }[]; pages: number };
    steps?: { mode: "stuck" | "moving"; goal: string; steps?: string[] };
    // edit-c-chip
    twoscale?: TwoScaleData; die?: DieData; bubbles?: BubblesData; bench?: BenchData;
    mplbars?: MplBarsData; latency?: LatencyData; curves?: CurvesData; kernel?: KernelSlotData;
    devfield?: DevFieldData; moat?: MoatData; dates?: DatesData; gens?: GensData; flywheel?: FlywheelData;
    mplline?: MplLineData; ladder?: LadderData;
    // edit-c-evals
    skilldrag?: SkillDragData; oldmodels?: OldModelsData; taskfold?: TaskFoldData; tries?: TriesData; runs?: RunsData;
    scorecard?: ScorecardData; taskfan?: TaskFanData; harness?: LanesData; mplruns?: MplRunsData;
    benchtable?: BenchTableData; trash?: TrashData;
    // edit-c-qa
  };
  keyword?: string; // cta only
  stamp?: { atMs: number; text: string }; // term: a tilted accent stamp over the window on its word (edit-c-evals)
  second?: { accent: string; plain: string }; // cta: the second line in their words ("follow" / "for more"); no bookmark when set
  iconAbove?: boolean; // cta: the bookmark sits just above "save this video" (edit-c-evals, 2026-09-06); off = reference edit A's fixed 0.148 H
  callback?: string; // this event replays an earlier object, changed (lint: not a repeat)
  long?: string; // why this event dwells past its idea's last word or runs past 4.5 s (lint reads it)
  // the timing pattern (04c-timing.md, 2026-09-06): the card lives as long as its idea
  trigger?: { word: string; atMs?: number; occurrence?: number; from?: string; note?: string }; // in on this word
  until?: { word: string; atMs?: number; occurrence?: number; from?: string }; // out on the LAST word of the idea (lint check 2)
  clock?: "beats" | "run" | "still"; // beats = motion on words then hold (default); run = continuous, the motion is the claim; still = a thing to read
  accentFontFamily?: string; // cta only
};

const ACCENT = "var(--accent, #E07850)"; // reference edit H: follows the format accentColor when set

export const Overlay: React.FC<{
  events: VisualEvent[]; tMs: number; captionStyle?: CaptionStyle;
}> = ({ events, tMs, captionStyle }) => {
  const { fps, width, height } = useVideoConfig();
  const look = styleOf(captionStyle?.style);
  const ev = events.find((e) => tMs >= e.fromMs && tMs < e.toMs);
  if (!ev) return null;

  const frame = ((tMs - ev.fromMs) / 1000) * fps;
  // hand-over (edit-c-evals, 2026-09-06): a callback that starts on the frame its parent ended
  // is the same object changing, not a new one. It keeps the chain's entrance clock, so the
  // scorecard and the chart never re-pop at 26600 / 31897 / 41720. A gap (v6 -> v6b) re-enters.
  let chainFrom = ev.fromMs;
  for (let cur: VisualEvent | undefined = ev; cur?.callback;) {
    // the parent is the named callback (any kind: v5 tries -> v6 runs) or the same kind (v8 -> v9)
    const prev: VisualEvent | undefined = events.find((e) => e.toMs === cur!.fromMs && e.id !== cur!.id && (e.id === cur!.callback || e.kind === cur!.kind));
    if (!prev) break;
    chainFrom = prev.fromMs; cur = prev;
  }
  const entFrame = ((tMs - chainFrom) / 1000) * fps;
  const cardW = ev.card.wFrac * width;

  // THE BAND is ONE line and a ceiling, never a box. A card takes exactly the
  // height its visual needs (the creator 2026-09-04: "whatever the height we needed
  // it was creative, we had full freedom" / "it doesn't respect the real height
  // it requires"), it rests its BOTTOM on their head so it reads as sitting on them
  // rather than floating at the ceiling, and if it is too tall to fit above them
  // it pins to the safe line and spills DOWN over their hair, which is allowed
  // ("it can go over the head slightly we don't care, we have no restriction
  // there" - reference edit A did exactly this, transform 0.045 -> 0.565 over a head
  // topping at 0.46). The only hard line is the top: the first tenth of a 9:16
  // frame is under Instagram's and TikTok's own chrome and nothing readable
  // survives there.
  const bandTop = (ev.card.bandTopFrac ?? captionStyle?.cardTopFrac ?? 0.175) * height;
  const bandBottom = (ev.card.bandBottomFrac ?? captionStyle?.cardBottomFrac ?? 0.365) * height;
  const legacyTop = captionStyle?.cardAnchor === "top";
  const takeover = ev.card.takeover === true;
  const cardH = (ev.card.hFrac ?? 0) * height;
  const cardTop = legacyTop ? (ev.card.yFrac ?? 0) * height
    : takeover ? bandTop
    : ev.card.vAlign === "center" ? bandTop + Math.max(0, (bandBottom - bandTop - cardH) / 2)
    : Math.max(bandTop, bandBottom - cardH);
  const fitScale = ev.card.fit && cardH > bandBottom - cardTop ? (bandBottom - cardTop) / cardH : 1;
  const s = cardW / (ev.assetW ?? 1);
  const p = interpolate(tMs, [ev.fromMs, ev.toMs], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scrollP = ev.scroll?.fromMs
    ? interpolate(tMs, [ev.scroll.fromMs, ev.toMs], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : p;
  const scroll = ev.scroll
    ? interpolate(scrollP, [0, 1], [ev.scroll.from, ev.scroll.to])
    : 0;
  const zoom = ev.zoom ? interpolate(p, [0, 1], [ev.zoom.from, ev.zoom.to]) : 1;

  // hard pop: fast spring with a slight overshoot, done in ~5 frames
  const appear = spring({
    frame: entFrame,
    fps,
    config: { damping: 16, stiffness: 320, mass: 0.7 },
  });
  // or the style's measured entrance: a card fades in place, real media pops from a scale
  const ent = look.enter;
  const lin = (n: number) => Math.min(1, Math.max(0, entFrame / n));
  const popScale = ent
    ? ev.kind === "shot" ? ent.popFrom + (1 - ent.popFrom) * lin(ent.popFrames) : 1
    : 0.9 + 0.1 * appear;
  const opacity = ent ? lin(ev.kind === "shot" ? ent.popFrames : ent.fadeFrames) : Math.min(1, entFrame / 1.5);

  const dark = ev.card.frame === "dark";
  const activeSweep = ev.sweeps
    ?.filter((sw) => tMs >= sw.atMs)
    .sort((a, b) => b.atMs - a.atMs)[0];

  if (ev.kind === "float") {
    // one frameless graphic, or a pair: asset2 pops on beats.second to the
    // right of asset (a logo per spoken name). Never a box behind either.
    const gap = 0.06 * width;
    const two = Boolean(ev.asset2);
    const total = two ? 2 * cardW + gap : cardW;
    const x1 = (width - total) / 2;
    // a float obeys the same band: mark plus its name, bottom-anchored above their head
    const markH = cardW * ((ev.assetH ?? 1) / (ev.assetW ?? 1));
    const nameSize = captionStyle ? captionStyle.fontSizePx * (width / captionStyle.refWidth) : 46 * (width / 1080);
    const floatH = markH + (ev.label ? 0.014 * height + nameSize : 0);
    const floatTop = legacyTop ? (ev.card.yFrac ?? 0) * height : Math.max(bandTop, bandBottom - floatH);
    const secondAt = ev.beats?.second ?? ev.fromMs;
    const frame2 = ((tMs - secondAt) / 1000) * fps;
    const nameCss: React.CSSProperties = {
      position: "absolute",
      top: floatTop + markH + 0.014 * height,
      width: cardW,
      textAlign: "center",
      // the name wears the video's caption font: Michroma on their format, the flat
      // Avenir Next Bold 46 px uppercase on a guest format (their spec 2026-09-03)
      fontFamily: captionStyle?.fontFamily ?? "Avenir Next, Helvetica Neue, Arial, sans-serif",
      fontWeight: captionStyle?.fontWeight ?? 700,
      fontSize: nameSize,
      textTransform: captionStyle?.uppercase ? "uppercase" : undefined,
      whiteSpace: "nowrap",
      color: "#ffffff",
      textShadow: "0px 2px 6px rgba(0,0,0,0.9), 0px 8px 28px rgba(0,0,0,0.55)",
    };
    const appear2 = spring({
      frame: Math.max(0, frame2),
      fps,
      config: { damping: 16, stiffness: 320, mass: 0.7 },
    });
    return (
      <>
        <Img
          src={staticFile(ev.asset!)}
          style={{
            position: "absolute",
            top: floatTop,
            left: x1,
            width: cardW,
            transform: `scale(${popScale})`,
            opacity,
          }}
        />
        {ev.label && (
          <div style={{ ...nameCss, left: x1, transform: `scale(${popScale})`, opacity }}>{ev.label}</div>
        )}
        {two && tMs >= secondAt && ev.label2 && (
          <div style={{ ...nameCss, left: x1 + cardW + gap, transform: `scale(${0.9 + 0.1 * appear2})`, opacity: Math.min(1, frame2 / 1.5) }}>{ev.label2}</div>
        )}
        {two && tMs >= secondAt && (
          <Img
            src={staticFile(ev.asset2!)}
            style={{
              position: "absolute",
              top: floatTop,
              left: x1 + cardW + gap,
              width: cardW,
              transform: `scale(${0.9 + 0.1 * appear2})`,
              opacity: Math.min(1, frame2 / 1.5),
            }}
          />
        )}
      </>
    );
  }

  if (ev.kind === "cta") {
    return (
      <Cta
        tMs={tMs} width={width} height={height} fps={fps}
        fromMs={ev.fromMs} beats={ev.beats as { swap: number }}
        keyword={ev.keyword ?? "RULES"} second={ev.second} iconAbove={ev.iconAbove}
        {...({ mode: ev.mode, below: ev.beats?.below } as object)}
        yFrac={legacyTop ? (ev.card.yFrac ?? 0.235) : (ev.card.yFrac ?? bandBottom / height - 0.045)}
        accentFontFamily={ev.accentFontFamily ?? captionStyle?.accentFontFamily ?? captionStyle?.fontFamily ?? "Zen Dots, cursive"}
        labelFont={captionStyle?.fontFamily}
        flat={captionStyle?.ctaFlat ? {
          fontFamily: captionStyle.fontFamily,
          fontWeight: captionStyle.fontWeight,
          fontSizePx: captionStyle.fontSizePx * (width / captionStyle.refWidth),
          uppercase: Boolean(captionStyle.uppercase),
        } : undefined}
      />
    );
  }

  if (ev.kind !== "shot") {
    const d = ev.data;
    // reference edit K: `tShift` replays a card built on another video's clock (the shared Holo body, built on
    // hook 1's spine) this many ms later; the card sees its own clock and its clips shift with it
    const tShift = ev.tShift ?? 0;
    const cp: CardProps = {
      tMs: tMs - tShift, w: cardW, h: cardH, fps, fromMs: ev.fromMs - tShift, toMs: ev.toMs - tShift,
      beats: (ev.beats ?? {}) as Record<string, number>, assets: d?.assets ?? [],
    };
    const Lock = LOCK_KINDS[ev.kind] ?? TALK_KINDS[ev.kind] ?? ONESHOT_KINDS[ev.kind] ?? LETTERS_KINDS[ev.kind] ?? HOLO_KINDS[ev.kind] ?? KF_KINDS[ev.kind];
    const inner =
      Lock ? <Lock {...cp} data={((d as Record<string, unknown> | undefined)?.[ev.kind] ?? {}) as never} />
      : ev.kind === "twoscale" ? <TwoScale {...cp} data={d!.twoscale!} />
      : ev.kind === "die" ? <Die {...cp} data={d!.die!} />
      : ev.kind === "bubbles" ? <Bubbles {...cp} data={d!.bubbles!} />
      : ev.kind === "bench" ? <Bench {...cp} data={d!.bench!} />
      : ev.kind === "mplbars" ? <MplBars {...cp} data={d!.mplbars!} />
      : ev.kind === "latency" ? <Latency {...cp} data={d!.latency!} />
      : ev.kind === "curves" ? <Curves {...cp} data={d!.curves!} />
      : ev.kind === "kernelslot" ? <KernelSlot {...cp} data={d!.kernel!} />
      : ev.kind === "devfield" ? <DevField {...cp} data={d!.devfield!} />
      : ev.kind === "moat" ? <Moat {...cp} data={d!.moat!} />
      : ev.kind === "dates" ? <Dates {...cp} data={d!.dates!} />
      : ev.kind === "calweek" ? <CalWeek {...cp} data={(d?.calweek ?? {}) as never} />
      : ev.kind === "seats" ? <Seats {...cp} data={(d?.seats ?? {}) as never} />
      : ev.kind === "loginflip" ? <LoginFlip {...cp} data={(d?.loginflip ?? {}) as never} />
      : ev.kind === "finderfootage" ? <FinderFootage {...cp} data={(d?.finderfootage ?? {}) as never} />
      : ev.kind === "zipdl" ? <ZipDl {...cp} data={(d?.zipdl ?? {}) as never} />
      : ev.kind === "yearstrip" ? <YearStrip {...cp} data={(d?.yearstrip ?? {}) as never} />
      : ev.kind === "outputchart" ? <OutputChart {...cp} data={(d?.outputchart ?? {}) as never} />
      : ev.kind === "profiles" ? <Profiles {...cp} data={(d?.profiles ?? {}) as never} />
      : ev.kind === "nle" ? <Nle {...cp} data={(d?.nle ?? {}) as never} />
      : ev.kind === "accounts" ? <Accounts {...cp} data={(d?.accounts ?? {}) as never} />
      : ev.kind === "profileslit" ? <ProfilesLit {...cp} data={(d?.profileslit ?? {}) as never} />
      : ev.kind === "unzip" ? <Unzip {...cp} data={(d?.unzip ?? {}) as never} />
      : ev.kind === "stratline" ? <StratLine {...cp} data={(d?.stratline ?? {}) as never} />
      : ev.kind === "dropin" ? <DropIn {...cp} data={(d?.dropin ?? {}) as never} />
      : ev.kind === "reelgrid" ? <ReelGrid {...cp} data={(d?.reelgrid ?? {}) as never} />
      : ev.kind === "todo" ? <Todo {...cp} data={(d?.todo ?? {}) as never} />
      : ev.kind === "chairs" ? <Chairs {...cp} data={(d?.chairs ?? {}) as never} />
      : ev.kind === "signin" ? <SignIn {...cp} data={(d?.signin ?? {}) as never} />
      : ev.kind === "footage" ? <Footage {...cp} data={(d?.footage ?? {}) as never} />
      : ev.kind === "box" ? <Box {...cp} data={(d?.box ?? {}) as never} />
      : ev.kind === "calendar" ? <Calendar {...cp} data={(d?.calendar ?? {}) as never} />
      : ev.kind === "tiles" ? <Tiles {...cp} data={(d?.tiles ?? {}) as never} />
      : ev.kind === "ring" ? <Ring {...cp} data={(d?.ring ?? {}) as never} />
      : ev.kind === "phoneedit" ? <PhoneEdit {...cp} data={(d?.phoneedit ?? {}) as never} />
      : ev.kind === "viewsline" ? <ViewsLine {...cp} data={(d?.viewsline ?? {}) as never} />
      : ev.kind === "ringlit" ? <RingLit {...cp} data={(d?.ringlit ?? {}) as never} />
      : ev.kind === "boxopen" ? <BoxOpen {...cp} data={(d?.boxopen ?? {}) as never} />
      : ev.kind === "pricing" ? <Pricing {...cp} data={(d?.pricing ?? {}) as never} />
      : ev.kind === "composer" ? <Composer {...cp} data={(d?.composer ?? {}) as never} />
      : ev.kind === "pour" ? <Pour {...cp} data={(d?.pour ?? {}) as never} />
      : ev.kind === "gens" ? <Gens {...cp} data={d!.gens!} />
      : ev.kind === "flywheel" ? <Flywheel {...cp} data={d!.flywheel!} />
      : ev.kind === "mplline" ? <MplLine {...cp} data={d!.mplline!} />
      : ev.kind === "ladder" ? <Ladder {...cp} data={d!.ladder!} />
      : ev.kind === "skilldrag" ? <SkillDrag {...cp} data={d!.skilldrag!} />
      : ev.kind === "oldmodels" ? <OldModels {...cp} data={d!.oldmodels!} />
      : ev.kind === "taskfold" ? <TaskFold {...cp} data={d!.taskfold!} />
      : ev.kind === "tries" ? <Tries {...cp} data={d!.tries!} />
      : ev.kind === "runs" ? <Runs {...cp} data={d!.runs!} />
      : ev.kind === "scorecard" ? <Scorecard {...cp} data={d!.scorecard!} />
      : ev.kind === "taskfan" ? <TaskFan {...cp} data={d!.taskfan!} />
      : ev.kind === "lanes" ? <Lanes {...cp} data={d!.harness!} />
      : ev.kind === "mplruns" ? <MplRuns {...cp} data={d!.mplruns!} />
      : ev.kind === "benchtable" ? <BenchTable {...cp} data={d!.benchtable!} />
      : ev.kind === "trash" ? <Trash {...cp} data={d!.trash ?? {}} />
      : ev.kind === "doom" ? (
        <Doom tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs} toMs={ev.toMs}
          title={d!.doom!.title} lines={d!.doom!.lines} pages={d!.doom!.pages} />
      ) : ev.kind === "hollow" ? (
        <Hollow tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          feels={d!.hollow!.feels} beats={ev.beats as never} />
      ) : ev.kind === "steps" ? (
        <Steps tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          mode={d!.steps!.mode} goal={d!.steps!.goal} steps={d!.steps!.steps}
          beats={ev.beats as never} />
      ) : ev.kind === "theatre" ? (
        <Theatre tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs} toMs={ev.toMs}
          counters={d!.theatre!.counters} dead={d!.theatre!.dead} />
      ) : ev.kind === "loop" ? (
        <Loop tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          nodes={d!.loop!.nodes} exit={d!.loop!.exit} beats={ev.beats as never} />
      ) : ev.kind === "gather" ? (
        <Gather tMs={tMs} w={cardW} h={cardH} fps={fps}
          lanes={d!.gather!.lanes} bin={d!.gather!.bin} beats={ev.beats as never} />
      ) : ev.kind === "forward" ? (
        <Forward tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          mode={d!.forward!.mode} startLabel={d!.forward!.startLabel}
          markerLabel={d!.forward!.markerLabel} measureLabel={d!.forward!.measureLabel}
          steps={d!.forward!.steps} beats={ev.beats as never} />
      ) : ev.kind === "firehose" ? (
        <Firehose tMs={tMs} w={cardW} h={cardH} fps={fps}
          question={d!.firehose!.question} chips={d!.firehose!.chips} beats={ev.beats as never} />
      ) : ev.kind === "race" ? (
        <Race tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          top={d!.race!.top} bottom={d!.race!.bottom} wallLabel={d!.race!.wallLabel}
          beats={ev.beats as never} />
      ) : ev.kind === "opportunities" ? (
        <Opportunities tMs={tMs} w={cardW} h={cardH} fps={fps}
          ideas={d!.opportunities!.ideas} beats={ev.beats as never} />
      ) : ev.kind === "value" ? (
        <Value tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          whole={d!.value!.whole} sliver={d!.value!.sliver} rest={d!.value!.rest}
          hard={d!.value!.hard} beats={ev.beats as never} />
      ) : ev.kind === "before" ? (
        <Before tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          slotLabel={d!.before!.slotLabel} outcome={d!.before!.outcome} prompt={d!.before!.prompt}
          model={d!.before!.model} tier={d!.before!.tier} beats={ev.beats as never} />
      ) : ev.kind === "docvslist" ? (
        <DocVsList tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          docTitle={d!.docvslist!.docTitle} docLines={d!.docvslist!.docLines}
          pages={d!.docvslist!.pages} readMark={d!.docvslist!.readMark}
          items={d!.docvslist!.items} beats={ev.beats as never} />
      ) : ev.kind === "skillcard" ? (
        <SkillCard tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          file={d!.skillcard!.file} frontmatter={d!.skillcard!.frontmatter}
          description={d!.skillcard!.description} beats={ev.beats as never} />
      ) : ev.kind === "barspick" ? (
        <BarsPick tMs={tMs} w={cardW} h={cardH} fps={fps} beats={ev.beats as never} icon={ev.asset!} />
      ) : ev.kind === "chart" ? (
        <Chart tMs={tMs} w={cardW} h={cardH} beats={ev.beats as never} />
      ) : ev.kind === "twobar" ? (
        <TwoBar tMs={tMs} w={cardW} h={cardH} fps={fps} beats={ev.beats as never} />
      ) : ev.kind === "transform" ? (
        <Transform tMs={tMs} w={cardW} h={cardH} fps={fps} beats={ev.beats as never} />
      ) : ev.kind === "rulewhy" ? (
        <RuleWhy tMs={tMs} w={cardW} h={cardH} fps={fps} beats={ev.beats as never} icon={ev.asset!} />
      ) : ev.kind === "term" ? (
        <Term tMs={tMs} w={cardW} h={cardH} fps={fps} lines={ev.lines ?? []} fontPx={ev.fontPx} title={ev.title} chrome={ev.chrome === "window"} stamp={ev.stamp} />
      ) : ev.kind === "fanout" ? (
        <Fanout
          tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          parent={ev.parent} agents={ev.agents ?? []}
          perMs={ev.perMs} startMs={ev.startMs} merge={ev.merge}
        />
      ) : ev.kind === "prompt" ? (
        <Prompt
          tMs={tMs} w={cardW} h={cardH}
          ask={ev.data!.ask!.ask} words={ev.data!.ask!.words}
          askAtMs={ev.promptAtMs ?? ev.fromMs} typeMs={ev.typeMs}
          wordsAtMs={ev.beats?.words ?? ev.fromMs + 1200}
          hint={ev.data!.ask!.hint} model={ev.data!.ask!.model}
        />
      ) : ev.kind === "split" ? (
        <Split
          tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          job={ev.data!.split!.job} items={ev.data!.split!.items} parent={ev.data!.split!.parent}
          beats={ev.beats as never} perMs={ev.perMs}
        />
      ) : ev.kind === "swarm" ? (
        <Swarm
          tMs={tMs} w={cardW} h={cardH} fps={fps} items={ev.items ?? []}
          cols={ev.cols} startMs={ev.startMs ?? ev.fromMs} perMs={ev.perMs} workAtMs={ev.beats?.work}
        />
      ) : ev.kind === "weigh" ? (
        <Weigh
          tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          left={ev.data!.weigh!.left} right={ev.data!.weigh!.right} source={ev.data!.weigh!.source}
          beats={ev.beats as never}
        />
      ) : ev.kind === "versus" ? (
        <Versus
          tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          left={ev.data!.versus!.left} right={ev.data!.versus!.right}
          tasks={ev.data!.versus!.tasks} agents={ev.data!.versus!.agents}
          beats={ev.beats as never}
        />
      ) : ev.kind === "library" ? (
        <Library
          tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          count={ev.data!.library!.count} unit={ev.data!.library!.unit}
          names={ev.data!.library!.names} install={ev.data!.library!.install}
          source={ev.data!.library!.source} beats={ev.beats as never} perMs={ev.perMs}
        />
      ) : ev.kind === "crowd" ? (
        <Crowd
          tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          head={ev.data!.crowd!.head} total={ev.data!.crowd!.total} cols={ev.data!.crowd!.cols}
          lit={ev.data!.crowd!.lit} note={ev.data!.crowd!.note} litAtMs={ev.beats?.lit}
        />
      ) : ev.kind === "roles" ? (
        <Roles
          tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          head={ev.data!.roles!.head} rows={ev.data!.roles!.rows}
          down={ev.data!.roles!.down} up={ev.data!.roles!.up} beats={ev.beats as never}
        />
      ) : ev.kind === "scale" ? (
        <Scale
          tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          head={ev.data!.scale!.head} left={ev.data!.scale!.left} right={ev.data!.scale!.right}
          source={ev.data!.scale!.source} beats={ev.beats as never}
        />
      ) : ev.kind === "overload" ? (
        <Overload
          tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          head={ev.data!.overload!.head} tasks={ev.data!.overload!.tasks}
          score={ev.data!.overload!.score} fill={ev.data!.overload!.fill}
          meterLabel={ev.data!.overload!.meterLabel}
          startMs={ev.startMs} perMs={ev.perMs} scoreAtMs={ev.beats?.score}
        />
      ) : ev.kind === "spread" ? (
        <Spread
          tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          head={ev.data!.spread!.head} agents={ev.data!.spread!.agents}
          score={ev.data!.spread!.score} depthLabel={ev.data!.spread!.depthLabel}
          meterLabel={ev.data!.spread!.meterLabel}
          startMs={ev.startMs} perMs={ev.perMs}
          depthAtMs={ev.beats?.depth} scoreAtMs={ev.beats?.score}
        />
      ) : ev.kind === "converge" ? (
        <Merge
          tMs={tMs} w={cardW} h={cardH} fps={fps} fromMs={ev.fromMs}
          head={ev.data!.converge!.head} sheets={ev.data!.converge!.sheets}
          label={ev.data!.converge!.label}
          startMs={ev.startMs} perMs={ev.perMs} landAtMs={ev.beats?.land}
        />
      ) : ev.kind === "logos" ? (
        <Logos
          tMs={tMs} w={cardW} h={cardH} fps={fps} items={ev.items ?? []}
          cols={ev.cols} startMs={ev.startMs ?? ev.fromMs} perMs={ev.perMs} pulseAtMs={ev.pulseAtMs}
        />
      ) : ev.kind === "claudecode" ? (
        <ClaudeCode
          tMs={tMs} w={cardW} h={cardH}
          title={ev.title} userName={ev.userName} model={ev.model} cwd={ev.cwd} whatsNew={ev.whatsNew}
          prompt={ev.prompt ?? ""} promptAtMs={ev.promptAtMs ?? ev.fromMs} typeMs={ev.typeMs}
          lines={(ev.lines ?? []) as CcLine[]} push={ev.push}
          mode={ev.mode} clockFromMs={ev.clockFromMs} winW={ev.winW} winH={ev.winH}
        />
      ) : ev.kind === "timeline" ? (
        <Timeline tMs={tMs} w={cardW} h={cardH} fromMs={ev.fromMs} toMs={ev.toMs} data={ev.data!.timeline!} beats={ev.beats as never} />
      ) : ev.kind === "tracks" ? (
        <Tracks tMs={tMs} w={cardW} h={cardH} lanes={ev.data!.lanes ?? []} simple={ev.data!.simple ?? 3}
          beats={ev.beats as never} title={ev.data!.title ?? ""} titleMore={ev.data!.titleMore ?? ""} />
      ) : ev.kind === "template" ? (
        <Template tMs={tMs} w={cardW} h={cardH} file={ev.data!.file ?? "format.json"} lines={ev.data!.lines ?? []}
          beats={ev.beats as never} frames={ev.data!.frames} fan={ev.data!.fan} note={ev.data!.note} />
      ) : ev.kind === "craftlist" ? (
        <CraftList tMs={tMs} w={cardW} h={cardH} items={ev.data!.items ?? []} land={ev.data!.land ?? ""} beats={ev.beats as never} />
      ) : ev.kind === "pipeline" ? (
        <Pipeline tMs={tMs} w={cardW} h={cardH} chips={ev.data!.chips ?? []} beats={ev.beats as never} />
      ) : ev.kind === "skills" ? (
        <Skills tMs={tMs} w={cardW} h={cardH} icon={(ev.data!.assets ?? [])[0]!} names={ev.data!.names ?? []} beats={ev.beats as never} />
      ) : ev.kind === "toolbox" ? (
        <Toolbox tMs={tMs} w={cardW} h={cardH} tools={ev.data!.tools ?? []} ask={ev.data!.ask ?? ""} beats={ev.beats as never} />
      ) : ev.kind === "idea" ? (
        <Idea tMs={tMs} w={cardW} h={cardH} fps={fps} note={ev.data!.note ?? ""} head={ev.data!.head ?? ""}
          clip={(ev.data!.assets ?? [])[0]!} time={ev.data!.time ?? ""} beats={ev.beats as never} />
      ) : ev.kind === "stack" ? (
        <Stack tMs={tMs} w={cardW} h={cardH} marks={ev.data!.assets ?? []} names={ev.data!.names ?? []}
          skills={ev.data!.skills ?? []} beats={ev.beats as never} />
      ) : ev.kind === "bars" ? (
        <Bars tMs={tMs} w={cardW} h={cardH} bars={ev.data!.bars ?? []} foot={ev.data!.foot} />
      ) : ev.kind === "packs" ? (
        <Packs tMs={tMs} w={cardW} h={cardH} packs={ev.data!.packs ?? []} live={ev.data!.live ?? ""} beats={ev.beats as never} />
      ) : ev.kind === "receipt" ? (
        <Receipt tMs={tMs} w={cardW} h={cardH} rows={ev.data!.rows2 ?? []} results={ev.data!.results ?? []} ruleAtMs={ev.data!.ruleAtMs ?? 0} />
      ) : ev.kind === "layers" ? (
        <Layers tMs={tMs} w={cardW} h={cardH} frame={ev.data!.frame!} rows={ev.data!.labels ?? []}
          note={ev.data!.note ?? ""} beats={ev.beats as never} captionWord={ev.data!.captionWord ?? ""}
          captionFont={captionStyle?.fontFamily} />
      ) : ev.kind === "figures" ? (
        <Figures tMs={tMs} w={cardW} h={cardH} figures={ev.data!.figures ?? []} note={ev.data!.note} noteAtMs={ev.data!.noteAtMs} />
      ) : ev.kind === "reach" ? (
        <Reach
          tMs={tMs} w={cardW} h={cardH} fps={fps}
          rows={(ev.data!.rows ?? []).map((r, i) => ({ ...r, avatar: (ev.data!.assets ?? [])[i] }))}
          total={ev.data!.total ?? 0}
          beats={ev.beats as never}
        />
      ) : ev.kind === "fill" ? (
        <Fill tMs={tMs} w={cardW} h={cardH} fromMs={ev.fromMs} toMs={ev.toMs} img={ev.asset!} imgW={ev.assetW!} counter={ev.counter ?? { from: 0, to: 1 }} />
      ) : ev.kind === "entire" ? (
        <Entire tMs={tMs} w={cardW} h={cardH} beats={ev.beats as never} img1={ev.asset!} w1={ev.assetW!} keep={ev.keepOne ?? { y: 0, h: 48 }} img2={ev.asset2!} w2={ev.asset2W!} address={ev.address ?? ""} />
      ) : ev.kind === "dimread" ? (
        <DimRead tMs={tMs} w={cardW} h={cardH} beats={ev.beats as never} img={ev.asset!} imgW={ev.assetW!} imgH={ev.assetH!} keep={ev.keep ?? []} offset={ev.offset} />
      ) : ev.kind === "skim" ? (
        <Skim tMs={tMs} w={cardW} h={cardH} fps={fps} beats={ev.beats as never} pages={ev.pages ?? []} tokens={ev.tokens} />
      ) : ev.kind === "becomes" ? (
        <Becomes
          tMs={tMs} w={cardW} h={cardH} beats={ev.beats as never}
          img1={ev.asset!} w1={ev.assetW!} h1={ev.assetH!}
          img2={ev.asset2!} w2={ev.asset2W!} h2={ev.asset2H!}
        />
      ) : (
        <Growth tMs={tMs} w={cardW} h={cardH} fps={fps} beats={ev.beats as never} />
      );
    const light = ev.card.frame === "light";
    // a standalone graphic draws straight on the footage: no plate, no clipping
    // (the creator 2026-09-04, on the agent tree: "you don't need to have background
    // for this as it's a standalone component")
    // A dense diagram goes on a BLACK CARD (white on #08080a, square, no border,
    // formats/creator-format-1-visuals.md) rather than being outlined element by element on their
    // bright wall. Only the two chip fields stay off a card: their chips ARE cards.
    const frameless = ev.card.frame === "none" // reference edit H: a designed kind may ask to draw straight on the footage
      || ev.kind === "fanout" || ev.kind === "logos" || ev.kind === "split"
      || ev.kind === "swarm" || ev.kind === "versus"
      || ev.kind === "firehose" || ev.kind === "opportunities" || ev.kind === "hollow"
      // edit-c-chip: the standalone objects of the NVIDIA video (marks, bars, lanes, a castle, a ring)
      || ev.kind === "twoscale" || ev.kind === "bubbles" || ev.kind === "latency" || ev.kind === "moat" || ev.kind === "flywheel"
      // edit-c-evals: the standalone objects (a file docking on a mark, folders, tiles, a fan, a Trash)
      // reference edit G (the guest): the standalone objects (chairs, the box, tiles and ticks, the ring, the pour)
      || ev.kind === "chairs" || ev.kind === "box" || ev.kind === "tiles" || ev.kind === "ring" || ev.kind === "ringlit" || ev.kind === "boxopen" || ev.kind === "pour"
      // edit-g-b: the seats and the profile rings stand on the footage
      || ev.kind === "seats" || ev.kind === "profiles" || ev.kind === "profileslit"
      || ev.kind === "skilldrag" || ev.kind === "taskfold" || ev.kind === "tries" || ev.kind === "runs" || ev.kind === "taskfan" || ev.kind === "trash";
    return (
      <div
        style={{
          position: "absolute",
          top: cardTop,
          left: (width - cardW) / 2,
          width: cardW,
          height: cardH,
          overflow: frameless ? "visible" : "hidden",
          ...(frameless ? {} : frameCss(light ? look.cardLight : look.card)),
          transform: `scale(${popScale * fitScale})`,
          transformOrigin: ev.card.fit ? "50% 0%" : undefined,
          opacity,
        }}
      >
        {ev.tShift ? <Sequence from={Math.round((ev.tShift / 1000) * fps)} layout="none">{inner}</Sequence> : inner}
      </div>
    );
  }

  const shotFrame = dark ? look.shotDark : look.shot;
  const pad = shotFrame.pad ?? 0;
  const chromeH = ev.chrome ? Math.round(0.088 * cardH) : 0;
  return (
    <div
      style={{
        position: "absolute",
        top: cardTop,
        left: (width - cardW) / 2,
        width: cardW,
        height: cardH,
        overflow: "hidden",
        ...frameCss(shotFrame),
        transform: `scale(${popScale})`,
        opacity,
      }}
    >
      {/* a real capture is re-framed, never shown as a ragged screengrab
          (formats/creator-format-1-visuals.md): a browser bar with the page's real URL */}
      {ev.chrome && (
        <div
          style={{
            position: "absolute", left: 0, right: 0, top: 0, height: chromeH,
            backgroundColor: "#e7e4dd", display: "flex", alignItems: "center",
            paddingLeft: 0.55 * chromeH, gap: 0.22 * chromeH, zIndex: 2,
            borderBottom: "1px solid #d2cec6",
          }}
        >
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: 0.26 * chromeH, height: 0.26 * chromeH, borderRadius: "50%", backgroundColor: c }} />
          ))}
          <div
            style={{
              marginLeft: 0.5 * chromeH, height: 0.56 * chromeH, flex: 1,
              marginRight: 0.55 * chromeH, backgroundColor: "#fbfaf7",
              display: "flex", alignItems: "center", paddingLeft: 0.4 * chromeH,
              fontFamily: "-apple-system, Helvetica Neue, Arial, sans-serif",
              fontSize: 0.42 * chromeH, color: "#57544e", whiteSpace: "nowrap", overflow: "hidden",
            }}
          >
            {ev.chrome}
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: pad, right: pad, bottom: pad, top: pad + chromeH,
          borderRadius: Math.max(0, shotFrame.radius - pad),
          overflow: "hidden",
          transform: `scale(${zoom})`,
          transformOrigin: "50% 30%",
        }}
      >
        <Img
          src={staticFile(ev.asset!)}
          style={{
            position: "absolute",
            top: -scroll * s,
            left: 0,
            width: cardW,
            display: "block",
          }}
        />
        {activeSweep && (
          <div
            style={{
              position: "absolute",
              top: (activeSweep.y - 10) * s - scroll * s,
              left: 0.025 * cardW,
              width: 0.95 * cardW,
              height: (activeSweep.h + 20) * s,
              backgroundColor: ACCENT,
              opacity: dark ? 0.32 : 0.24,
            }}
          />
        )}
      </div>
    </div>
  );
};
