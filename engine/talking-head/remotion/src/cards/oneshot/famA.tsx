import React from "react";
import { spring } from "remotion";
import type { CardProps } from "../props";
import {
  BLUE, CHIP_TEXT, Chip, HALO_STROKE, INK, PAPER,
  KeyboardGlyph, MicGlyph, chipFs, chipFsBig, clamp01, easeOut, landStyle,
} from "./shared";

// edit-h-oneshot, family A: the three instruments that stand on the guest's cream wall.
// speedo (V2) measures, wpmrace (V5) races, stairs (V16) climbs. All frameless, centred in
// their card, every word on a solid chip at 32 device px or more, every ink stroke carrying its
// white halo, blue only on the payload. Nothing here is a box with text in it.

const CHIP_POP = { damping: 14, stiffness: 320, mass: 0.7 } as const;
const SLAM = { damping: 22, stiffness: 300, mass: 1 } as const;   // ~7% overshoot: FEEL past MAX
const CLIMB = { damping: 26, stiffness: 200, mass: 1 } as const;  // no overshoot: ACTUALLY stopping dead

const sp = (
  tMs: number, at: number, fps: number,
  config: { damping: number; stiffness: number; mass: number }
): number => spring({ frame: Math.max(0, ((tMs - at) / 1000) * fps), fps, config });

/** the height a chip of this font size takes (shared.tsx padding: 0.42 fs top and bottom) */
const chipH = (fs: number): number => fs + 2 * Math.round(0.42 * fs);

/** an ink stroke with its white halo under it: the same geometry drawn twice (shared.tsx grammar) */
const Ink: React.FC<{
  d?: string; x1?: number; y1?: number; x2?: number; y2?: number;
  sw: number; dash?: string; op?: number; cap?: "butt" | "round";
}> = ({ d, x1, y1, x2, y2, sw, dash, op = 1, cap = "butt" }) => {
  const c = { strokeDasharray: dash, strokeLinecap: cap, fill: "none" } as const;
  return d ? (
    <>
      <path d={d} {...c} {...HALO_STROKE} strokeWidth={sw + 8} />
      <path d={d} {...c} stroke={INK} strokeOpacity={op} strokeWidth={sw} />
    </>
  ) : (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} {...c} {...HALO_STROKE} strokeWidth={sw + 8} />
      <line x1={x1} y1={y1} x2={x2} y2={y2} {...c} stroke={INK} strokeOpacity={op} strokeWidth={sw} />
    </>
  );
};

/** a chip (or any block) hung on a point of the instrument. `a` = which edge sits on x. */
const At: React.FC<{
  x: number; y: number; a?: "c" | "l" | "r"; children: React.ReactNode;
}> = ({ x, y, a = "c", children }) => (
  <div
    style={{
      position: "absolute", left: x, top: y,
      transform: `translate(${a === "c" ? "-50%" : a === "r" ? "-100%" : "0%"}, -50%)`,
      display: "flex", alignItems: "center",
    }}
  >
    {children}
  </div>
);

const rad = (deg: number): number => (deg * Math.PI) / 180;

// ─────────────────────────────────────────────────────────────────────────────
// V2 speedo: "Are you actually more productive, or does it just FEEL productive?"
// One hub, two needles on one scale. The dark one measures what is actually true and
// stops a third of the way up with a `?` on it. The blue one measures the feeling and
// slams past MAX before it settles on it.
//
// Layout law: the base line of the dial belongs to the SCALE (the `0` and `MAX` chips sit
// UNDER the two arc feet and nothing else goes there). Both needle tags hang ABOVE their own
// needle tip on a short ink leader, so a resting tag reads as a tag on the needle and never as a
// second label on the axis. At rest the two needles lie on each other, so the ACTUALLY tag
// stacks one chip higher and slides down onto its needle as the needle climbs. The FEEL tag is
// thrown off the needle by the slam and lands back on the tip 200 ms later, which is also what
// keeps it out of the ACTUALLY tag while the needle sweeps through it.
// ─────────────────────────────────────────────────────────────────────────────

type SpeedoData = { title: string; left: string; right: string };

const Speedo: React.FC<CardProps & { data: SpeedoData }> = ({ tMs, w, h, fps, beats, data }) => {
  const cf = chipFs(w);              // 32 on a 929 px card
  const tf = chipFsBig(w);           // 41
  const cx = w / 2;
  const cy = 0.745 * h;              // 429 on a 576 px card: the hub, the base line of the scale
  const R = 0.315 * w;               // 293, the tick ring
  const LEN_A = 0.86 * R;            // the ACTUALLY needle, long enough to read as a needle
  const LEN_F = 0.68 * R;            // the FEEL needle, shorter, so the two read apart while they rest together
  const TAG_DY = 0.094 * h;          // a tag hangs this far above its own needle tip
  const STACK = 0.142 * h;           // the extra lift the ACTUALLY tag takes while the needles overlap
  const THROW_MS = 200;              // the slam throws the FEEL tag off the needle and it lands here

  const REST = 180, THIRD = 120, MAX = 0;
  const sA = sp(tMs, beats.actually, fps, CLIMB);
  const sF = sp(tMs, beats.feel, fps, SLAM);
  const angA = REST + (THIRD - REST) * sA;
  const angF = REST + (MAX - REST) * sF;     // sF crests past 1: the overshoot past MAX
  const q = sp(tMs, beats.productive, fps, CHIP_POP);

  const inFlight = tMs >= beats.feel && tMs < beats.feel + THROW_MS;
  const feelStyle: React.CSSProperties = tMs < beats.feel
    ? {}
    : inFlight
      ? { opacity: 1 - clamp01((tMs - beats.feel) / 40) }
      : landStyle(sp(tMs, beats.feel + THROW_MS, fps, CHIP_POP));

  const pt = (deg: number, r: number) => ({ x: cx + r * Math.cos(rad(deg)), y: cy - r * Math.sin(rad(deg)) });
  const tipA = pt(angA, LEN_A);
  const tipF = pt(angF, LEN_F);
  const tagAy = tipA.y - TAG_DY - STACK * Math.max(0, 1 - sA);
  const tagFy = tipF.y - TAG_DY;

  const arcPath = (a0: number, a1: number, r: number): string => {
    const p0 = pt(a0, r), p1 = pt(a1, r);
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 < a0 ? 1 : 0} ${p1.x} ${p1.y}`;
  };

  const needle = (deg: number, len: number, fill: string, key: string) => {
    const pts = `${-0.15 * len},-9 ${len},-3.5 ${len},3.5 ${-0.15 * len},9`;
    return (
      <g key={key} transform={`translate(${cx} ${cy}) rotate(${-deg})`}>
        <polygon points={pts} {...HALO_STROKE} strokeWidth={9} strokeLinejoin="round" fill="none" />
        <polygon points={pts} fill={fill} />
      </g>
    );
  };

  // the thread that ties a tag to the tip it belongs to
  const leader = (x: number, yTip: number, yTag: number, key: string) => {
    const yEnd = yTag + chipH(cf) / 2 + 3;
    return yTip - yEnd > 8 ? <Ink key={key} x1={x} y1={yTip} x2={x} y2={yEnd} sw={3.5} op={0.7} /> : null;
  };

  const ticks: React.ReactElement[] = [];
  for (let i = 0; i <= 12; i++) {
    const deg = 180 - i * 15;
    const major = i % 3 === 0;
    const p0 = pt(deg, R - (major ? 34 : 20));
    const p1 = pt(deg, R);
    ticks.push(<Ink key={`t${i}`} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} sw={major ? 7 : 5} op={major ? 0.95 : 0.7} />);
  }

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <title>a dial with two needles: what is actually true, and what it feels like</title>
        {/* the scale */}
        <Ink d={arcPath(180, 0, R)} sw={7} />
        {ticks}

        {/* what each needle reads, filled in behind it */}
        {angA < REST - 0.6 && <Ink d={arcPath(REST, angA, 0.55 * R)} sw={9} op={0.4} cap="round" />}
        {angF < REST - 0.6 && (
          <path d={arcPath(REST, angF, 0.34 * R)} fill="none" stroke={BLUE} strokeWidth={15} strokeLinecap="round" />
        )}

        {leader(tipA.x, tipA.y, tagAy, "la")}
        {!inFlight && leader(tipF.x, tipF.y, tagFy, "lf")}

        {needle(angA, LEN_A, INK, "a")}
        {needle(angF, LEN_F, BLUE, "f")}

        {/* the hub both needles turn on */}
        <circle cx={cx} cy={cy} r={0.026 * w} fill="#FFFFFF" fillOpacity={0.8} />
        <circle cx={cx} cy={cy} r={0.019 * w} fill={INK} />
      </svg>

      {/* what the dial measures */}
      <At x={cx} y={0.105 * h}><Chip text={data.title} fs={tf} /></At>

      {/* the two ends of the scale, under the arc's two feet: the base line is theirs alone */}
      <At x={cx - R} y={cy + 0.145 * h}><Chip text="0" fs={cf} /></At>
      <At x={cx + R} y={cy + 0.145 * h}><Chip text="MAX" fs={cf} /></At>

      {/* the dark needle's tag, and the question that lands on it */}
      <At x={tipA.x} y={tagAy}>
        <div style={{ position: "relative", display: "inline-flex" }}>
          <Chip text={data.left} fs={cf} />
          {q > 0.01 && (
            <div style={{ position: "absolute", left: "100%", top: "50%", marginLeft: 14, transform: "translateY(-50%)" }}>
              <div style={landStyle(q)}><Chip text="?" fs={cf} /></div>
            </div>
          )}
        </div>
      </At>

      {/* the blue needle's tag: thrown off by the slam, landing back on the tip at MAX */}
      <At x={tipF.x} y={tagFy}>
        <div style={feelStyle}><Chip text={data.right} fs={cf} accent /></div>
      </At>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// V5 wpmrace: "talking is obviously a faster way to share information with AI than typing is."
// Two lanes, one tape. The runner in each lane is the thing being shared: a prompt sheet.
// They leave together on `talking` at the real Stanford rates (153 against 52), so the
// TALK sheet breaks the tape on `faster` and the TYPE sheet is a third of the way. The race
// is over on the tape, so the TYPE sheet stops where it got to and a dashed mark drops at it:
// the distance still left in its lane IS 2.9x, and that finished picture is what holds.
// ─────────────────────────────────────────────────────────────────────────────

type RaceSide = { label: string; wpm: number; chip: string };
type RaceData = { top: RaceSide; bottom: RaceSide; ratio: string; source: string };

/** the thing being carried down the lane: a page with three lines on it */
const Sheet: React.FC<{ x: number; y: number; sw: number; sh: number }> = ({ x, y, sw, sh }) => {
  const fold = 0.28 * sw;
  const body = `M ${x} ${y} L ${x + sw - fold} ${y} L ${x + sw} ${y + fold} L ${x + sw} ${y + sh} L ${x} ${y + sh} Z`;
  return (
    <g>
      <path d={body} {...HALO_STROKE} strokeWidth={9} fill="none" />
      <path d={body} fill={PAPER} stroke={INK} strokeWidth={3.5} strokeLinejoin="miter" />
      <path d={`M ${x + sw - fold} ${y} L ${x + sw - fold} ${y + fold} L ${x + sw} ${y + fold}`} fill="none" stroke={INK} strokeWidth={3} />
      {[0.46, 0.63, 0.80].map((f, i) => (
        <rect key={f} x={x + 0.14 * sw} y={y + f * sh} width={(i === 2 ? 0.52 : i === 1 ? 0.72 : 0.6) * sw} height={4} fill={INK} />
      ))}
    </g>
  );
};

const WpmRace: React.FC<CardProps & { data: RaceData }> = ({ tMs, w, h, fps, fromMs, beats, data }) => {
  const cf = chipFs(w);                     // 32: the lane names, the two rates, the source
  const rf = Math.round(0.052 * w);         // 48: the figure the whole card is for
  const laneX = 0.235 * w;
  const finishX = 0.945 * w;
  const laneW = finishX - laneX;
  const laneH = 0.16 * h;
  const topY = 0.241 * h;                   // the object is centred in the card: 56 px of air each end
  const botY = 0.5955 * h;
  const SW = 0.072 * w;                     // the sheet
  const SH = 0.125 * h;

  const go = beats.talking;
  const fastAt = beats.faster;
  const startCx = laneX + 0.5 * SW + 10;
  const travel = finishX - startCx;
  const rate = travel / Math.max(1, fastAt - go);           // px per ms, the TALK sheet
  const slowRate = rate * (data.bottom.wpm / data.top.wpm); // 52 against 153, the real ratio

  // both sheets run at their own rate from `talking` until the tape is broken on `faster`
  const runT = Math.max(0, Math.min(tMs, fastAt) - go);
  const topX = startCx + rate * runT;
  const botX = startCx + slowRate * runT;
  const moving = tMs > go && tMs < fastAt;
  const bob = (k: number) => (moving ? 0.006 * h * Math.sin((tMs - go) / (55 + k)) : 0);

  const fastChip = sp(tMs, fastAt, fps, CHIP_POP);
  const slowChip = sp(tMs, beats.typing, fps, CHIP_POP);
  const ratioChip = sp(tMs, beats.ratio, fps, CHIP_POP);
  const srcIn = clamp01((tMs - fromMs) / 220);
  const markIn = easeOut((tMs - fastAt) / 260);             // where the slow sheet got to

  const lane = (y: number, key: string) => (
    <g key={key}>
      <rect x={laneX} y={y} width={laneW} height={laneH} fill={INK} fillOpacity={0.1} />
      <Ink x1={laneX} y1={y} x2={finishX} y2={y} sw={8} op={0.9} />
      <Ink x1={laneX} y1={y + laneH} x2={finishX} y2={y + laneH} sw={8} op={0.9} />
      <Ink x1={laneX} y1={y + 0.02 * h} x2={laneX} y2={y + laneH - 0.02 * h} sw={6} op={0.9} />
    </g>
  );

  // the ground each sheet has actually covered
  const trace = (y: number, x: number, key: string) => (
    <Ink key={key} x1={laneX + 8} y1={y + laneH / 2} x2={Math.max(laneX + 8, x - 0.6 * SW)} y2={y + laneH / 2} sw={5} op={0.45} />
  );

  // the tape: ONE checked strip standing across both lanes
  const cell = 11;
  const tapeTop = topY - 0.028 * h;
  const tapeBot = botY + laneH + 0.028 * h;
  const checks: React.ReactElement[] = [];
  const rows = Math.round((tapeBot - tapeTop) / cell);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 2; c++) {
      checks.push(
        <rect key={`${r}-${c}`} x={finishX - cell + c * cell} y={tapeTop + r * cell}
          width={cell} height={cell} fill={(r + c) % 2 === 0 ? INK : PAPER} />
      );
    }
  }

  const speedLines = (y: number, x: number, len: number, key: string) =>
    moving ? (
      <g key={key}>
        {[-0.22, 0.22].map((f) => (
          <Ink key={f} x1={Math.max(laneX + 6, x - 0.62 * SW - len)} y1={y + laneH / 2 + f * SH}
            x2={Math.max(laneX + 6, x - 0.62 * SW)} y2={y + laneH / 2 + f * SH} sw={5} op={0.7} cap="round" />
        ))}
      </g>
    ) : null;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <title>two lanes, one tape, each runner at its real words-per-minute</title>
        {[lane(topY, "lt"), lane(botY, "lb")]}
        {trace(topY, topX, "tt")}
        {trace(botY, botX, "tb")}
        {speedLines(topY, topX, 0.075 * w, "st")}
        {speedLines(botY, botX, 0.026 * w, "sb")}
        <g>
          <rect x={finishX - cell} y={tapeTop - 3} width={2 * cell} height={tapeBot - tapeTop + 6}
            {...HALO_STROKE} strokeWidth={8} fill="none" />
          {checks}
        </g>
        {/* where the slow sheet was standing when the tape went: the gap left is the 2.9x */}
        {markIn > 0 && (
          <Ink x1={botX + 0.62 * SW} y1={botY + laneH / 2 - markIn * (laneH / 2 + 10)}
            x2={botX + 0.62 * SW} y2={botY + laneH / 2 + markIn * (laneH / 2 + 10)}
            sw={5} dash="14 11" op={0.8} />
        )}
        <Sheet x={topX - SW / 2} y={topY + (laneH - SH) / 2 + bob(0)} sw={SW} sh={SH} />
        <Sheet x={botX - SW / 2} y={botY + (laneH - SH) / 2 + bob(17)} sw={SW} sh={SH} />
      </svg>

      {/* who runs each lane */}
      <At x={0.025 * w} y={topY + laneH / 2} a="l">
        <Chip text={data.top.label} fs={cf} glyph={<MicGlyph size={cf} color={CHIP_TEXT} />} />
      </At>
      <At x={0.025 * w} y={botY + laneH / 2} a="l">
        <Chip text={data.bottom.label} fs={cf} glyph={<KeyboardGlyph size={cf} color={CHIP_TEXT} />} />
      </At>

      {/* the rate each one actually ran at: the winner over the tape, the loser in the ground it never covered */}
      {fastChip > 0.01 && (
        <At x={finishX + 0.012 * w} y={0.1484 * h} a="r">
          <div style={landStyle(fastChip)}><Chip text={data.top.chip} fs={cf} accent /></div>
        </At>
      )}
      {slowChip > 0.01 && (
        <At x={botX + 0.62 * SW + 20} y={botY + laneH / 2} a="l">
          <div style={landStyle(slowChip)}><Chip text={data.bottom.chip} fs={cf} /></div>
        </At>
      )}

      {/* the distance between them, in one figure */}
      {ratioChip > 0.01 && (
        <At x={laneX + laneW / 2} y={0.498 * h}>
          <div style={landStyle(ratioChip)}><Chip text={data.ratio} fs={rf} accent /></div>
        </At>
      )}

      {/* where the two numbers come from */}
      <At x={w - 0.012 * w} y={0.8516 * h} a="r">
        <div style={{ opacity: srcIn }}><Chip text={data.source} fs={cf} /></div>
      </At>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// V16 stairs: "typing forces you to think about the first next step."
// Five steps waiting as one dashed silhouette rising to the right. The caret IS the typing:
// it hangs in the air blinking, drops onto step one, stops blinking, and only that step
// becomes real: it fills blue under a `1.` chip while the other four stay dashed.
// ─────────────────────────────────────────────────────────────────────────────

type StairsData = { steps: number; chip: string };

const FALL_MS = 230;
const SQUASH_MS = 150;

const Stairs: React.FC<CardProps & { data: StairsData }> = ({ tMs, w, h, fps, fromMs, beats, data }) => {
  const cf = chipFs(w);
  const n = Math.max(1, data.steps);
  const groundY = 0.90 * h;
  const stepW = (0.85 * w) / n;
  const x0 = (w - stepW * n) / 2;
  const rise = (0.80 * h) / n;                                     // a step deep enough to carry its chip
  const topOf = (i: number): number => groundY - rise * (i + 1);   // i is 0-based
  const DASH = "26 12";

  const caretW = 0.021 * w;
  const caretH = 0.20 * h;
  const caretX = x0 + 0.74 * stepW;          // the chip takes the left of the tread, the caret the right
  const restBottom = topOf(0) - 0.215 * h;   // hanging in the air over the first step

  const fall = clamp01((tMs - beats.forces) / FALL_MS);
  const landed = beats.forces + FALL_MS;
  const bottom = restBottom + (topOf(0) - restBottom) * (fall * fall);
  const u = clamp01((tMs - landed) / SQUASH_MS);
  const squash = tMs >= landed && u < 1 ? 1 - 0.24 * Math.sin(Math.PI * u) : 1;

  const period = tMs < beats.typing ? 520 : 900;
  const base = tMs < beats.typing ? fromMs : beats.typing;
  const falling = tMs >= beats.forces && tMs < landed + SQUASH_MS;
  const lit = tMs >= beats.think || falling || (tMs - base) % period < period / 2;

  const fill = easeOut((tMs - beats.step) / 320);
  const chipIn = sp(tMs, beats.step + 70, fps, CHIP_POP);

  // one silhouette: up off the ground, then tread / riser / tread all the way to the top step
  let profile = `M ${x0} ${groundY} L ${x0} ${topOf(0)}`;
  for (let i = 0; i < n; i++) {
    profile += ` L ${x0 + (i + 1) * stepW} ${topOf(i)}`;
    if (i < n - 1) profile += ` L ${x0 + (i + 1) * stepW} ${topOf(i + 1)}`;
  }
  profile += ` L ${x0 + n * stepW} ${groundY}`;
  const firstStep = `M ${x0} ${groundY} L ${x0} ${topOf(0)} L ${x0 + stepW} ${topOf(0)} L ${x0 + stepW} ${groundY}`;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <title>five steps waiting, a caret dropping onto the first one</title>

        {/* the first step, the only one that becomes real */}
        {fill > 0 && (
          <rect x={x0} y={groundY - rise * fill} width={stepW} height={rise * fill} fill={BLUE} />
        )}

        <Ink d={profile} sw={8} dash={DASH} op={0.95} />
        {fill > 0 && <Ink d={firstStep} sw={7} op={0.95} />}
        <Ink x1={0.03 * w} y1={groundY} x2={w - 0.03 * w} y2={groundY} sw={7} op={0.9} />

        {/* the typing itself */}
        {lit && (
          <g transform={`translate(${caretX} ${bottom}) scale(1 ${squash})`}>
            <rect x={-caretW / 2 - 4} y={-caretH - 4} width={caretW + 8} height={caretH + 4}
              fill="#FFFFFF" fillOpacity={0.62} />
            <rect x={-caretW / 2} y={-caretH} width={caretW} height={caretH} fill={INK} />
          </g>
        )}
      </svg>

      {/* the one step it committed to: the number stands ON the tread, the step stays solid blue */}
      {chipIn > 0.01 && (
        <At x={x0 + 0.30 * stepW} y={topOf(0) - chipH(cf) / 2 - 9}>
          <div style={landStyle(chipIn)}><Chip text={data.chip} fs={cf} /></div>
        </At>
      )}
    </div>
  );
};

export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  speedo: Speedo as React.FC<CardProps & { data: any }>,
  wpmrace: WpmRace as React.FC<CardProps & { data: any }>,
  stairs: Stairs as React.FC<CardProps & { data: any }>,
};
