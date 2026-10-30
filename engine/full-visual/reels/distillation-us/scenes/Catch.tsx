// "But here's the catch. All the numbers in between, called hidden states, stay inside Claude. And Claude only shows
// the token it picked, not its full probabilities. Those would tell the student that the teacher was hesitating
// between two words, not just which one it chose. So the student only learns from the final text, not from how the
// teacher got there."
// A cutaway of the machine, every number measured on an open model (Qwen3 0.6B), labelled so. The sentence's last
// token drops into a tilted 3D stack of 28 layer plates and the camera travels down it; between the plates the hidden
// state lights up at every depth, growing (0.04 -> 215.8); one strip is pulled out ("hidden states"); Claude's casing
// closes around the machine with one port, API; one token leaves it; inside, the whole distribution, locked; the
// logit-lens race (practice vs learn swap the lead at layers 25-26); the winner leaves, the loser stays; the student
// gets the text line; the path of guesses through the depth lights up and stays inside.
import React from "react";
import { Travel, arrive, blurIn, blurOut, ease, leave, prog, useScene } from "../../../src/engine";
import { HIDDEN, TOKENS, TOKEN_HUES, TokenChip } from "./parts";
import { columns } from "./CatchBits";
import { Stack, depthY, cellRGB, type Cam } from "./CatchStack";
import { CasingBack, closeAt, windowClip } from "./CatchCasing";
import { Distribution, Race, Trail } from "./CatchInside";
import { Card, HiddenPanel, Shot, Student, portPoint, slotCentre } from "./CatchOut";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ROW_Y = 640 - 38; // the sentence row (HANDOFF.sentence.cy), chip top

type T = Record<"enter" | "catchAt" | "between" | "hidden" | "claude" | "picked" | "probs" | "hesit" | "chose" | "final" | "trail", number>;

function camAt(f: number, t: T): Cam {
  const k1 = prog(f, t.catchAt - 2, t.between + 8 - t.catchAt, ease.inOut);
  const k2 = prog(f, t.hidden - 8, 18, ease.inOut);
  const k3 = prog(f, t.claude - 22, 22, ease.inOut);
  const k4 = leave(f, t.probs - 12, 12);
  const rise = (1 - arrive(f, t.enter, 28)) * 460;
  let s = lerp(1.06, 0.84, k1), cy = lerp(1140, 972, k1), op = 1, cx = 540;
  s = lerp(s, 0.4, k2); cy = lerp(cy, 712, k2); op = lerp(1, 0.5, k2);
  s = lerp(s, 0.5, k3); cy = lerp(cy, 906, k3); op = lerp(op, 1, k3); cx = lerp(cx, 500, k3);
  return { cx, cy: cy + rise - 560 * k4, s, gap: lerp(17, 27, k1), rz: -7 + 3 * Math.sin((f - t.enter) / 80), op };
}

/** the sentence arrives; its last token drops into the top of the stack on "catch."; the rest lift away */
const Sentence: React.FC<{ t: T; topY: number }> = ({ t, topY }) => {
  const { f } = useScene();
  const cols = columns(TOKENS, 40, 10);
  const last = TOKENS.length - 1;
  const drop = prog(f, t.catchAt - 12, 12, ease.in);
  return (
    <>
      {TOKENS.map((tok, i) => {
        if (i === last) {
          const x = lerp(cols[i].x, 540 - cols[i].w / 2, drop), y = lerp(ROW_Y, topY - 38, drop);
          return f < t.catchAt + 1 ? (
            <Travel key={i} curve="measured" at={t.enter + i * 3} from="bottom" dist={70} dur={16} style={{ position: "absolute", left: x, top: y, transform: `scale(${lerp(1, 0.55, drop).toFixed(3)})` }}>
              <TokenChip text={tok} hue={TOKEN_HUES[i]} style={{ boxShadow: `inset 0 0 0 3px ${TOKEN_HUES[i]}, 0 0 ${(30 * drop).toFixed(1)}px ${TOKEN_HUES[i]}` }} />
            </Travel>
          ) : null;
        }
        return f < t.catchAt + 20 ? (
          <Travel key={i} curve="measured" at={t.enter + i * 3} from="bottom" dist={70} dur={16} style={{ position: "absolute", left: cols[i].x, top: ROW_Y, ...(f >= t.catchAt + 4 ? blurOut(f, t.catchAt + 4 + i, { dur: 10, blur: 8 }) : {}) }}>
            <div style={{ transform: `translateY(${(-60 * prog(f, t.catchAt + 4 + i, 12, ease.in)).toFixed(1)}px)` }}>
              <TokenChip text={tok} hue={TOKEN_HUES[i]} />
            </div>
          </Travel>
        ) : null;
      })}
    </>
  );
};

/** under the stack while the strips ignite: the depth the light is at and the biggest of its numbers */
const Readout: React.FC<{ t: T; j: number; y: number }> = ({ t, j, y }) => {
  const { f, theme, ground } = useScene();
  if (f < t.between || f > t.hidden) return null;
  const big = HIDDEN[j].reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a), 0);
  const o = f < t.hidden - 8 ? blurIn(f, t.between, { dur: 6, rise: 10 }) : blurOut(f, t.hidden - 8, { dur: 8 });
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: y, textAlign: "center", fontFamily: theme.font.mono, fontSize: 38, fontWeight: 600, color: ground.dim, whiteSpace: "pre", ...o }}>
      {`after layer ${String(j).padStart(2, " ")} · biggest `}
      <span style={{ color: cellRGB(big).hue, fontVariantNumeric: "tabular-nums" }}>{(big < 0 ? "−" : "") + Math.abs(big).toFixed(2).padStart(6, " ")}</span>
    </div>
  );
};

export const Catch: React.FC = () => {
  const { f, cue, endsOn, scene, theme, ground } = useScene();
  const t: T = {
    enter: scene.from - 6, catchAt: cue("catch."), between: cue("between,"), hidden: cue("hidden"), claude: cue("Claude."),
    picked: cue("picked,"), probs: cue("probabilities."), hesit: cue("hesitating"), chose: cue("chose."), final: cue("final"), trail: endsOn("there.", 76),
  };
  const cam = camAt(f, t);
  const close = closeAt(f, t.claude);
  const speed = 28.5 / (t.between - t.catchAt);
  const pulse = f < t.catchAt ? -1 : ((f - t.catchAt) * speed) % 36;
  const lit = (j: number) => prog(f, t.between - 6 + j * 1.5, 10);
  const wave = Math.max(0, Math.min(28, Math.floor((f - t.between + 6) / 1.5)));
  const portLit = Math.max(f >= t.picked - 2 ? 1 - prog(f, t.picked + 6, 20) : 0, f >= t.chose + 10 ? 1 - prog(f, t.chose + 20, 20) : 0);
  const practiceRow = { x: 300, y: 664 + 186 + 35 };

  return (
    <>
      <CasingBack walls={close.walls} lid={close.lid} shake={close.shake} portLit={portLit} />
      <div style={{ position: "absolute", inset: 0, clipPath: close.walls > 0 ? windowClip(close.walls) : undefined, transform: `translateY(${close.shake.toFixed(2)}px)` }}>
        {f < t.probs + 2 && <Stack cam={cam} lit={lit} pulse={pulse} tokenIn={f >= t.catchAt ? 1 - prog(f, t.catchAt, 24) : 0} />}
        <Distribution at={t.probs - 4} lockAt={endsOn("Those", 0) + 4} outAt={t.hesit - 12} />
        <Race at={t.hesit} chose={t.chose} outAt={t.trail - 14} />
        <Trail at={t.trail} dur={76} />
      </div>
      <Sentence t={t} topY={depthY(0.5, camAt(t.catchAt, t)) - 110} />
      <Readout t={t} j={wave} y={1330} />
      <HiddenPanel at={t.hidden - 4} backAt={t.claude - 32} fromY={depthY(28, cam)} />

      <Card at={t.picked - 8} landAt={t.picked + 10} flashAt={t.chose + 12} />
      <Shot at={t.picked - 2} from={portPoint} to={slotCentre()} />
      <Shot at={t.chose + 2} from={practiceRow} to={portPoint} dur={10} s0={1} />
      <Student at={t.final} />
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1398, textAlign: "center", fontFamily: theme.font.ui, fontSize: 32, fontWeight: 500, color: ground.dim, ...blurIn(f, t.enter + 12, { dur: 10 }) }}>
        measured on an open model · Qwen3 0.6B
      </div>
    </>
  );
};
