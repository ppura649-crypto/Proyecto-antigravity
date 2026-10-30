// What the ten scenes of this reel share, so they read as one film: the asset path, the real marks, the teacher and
// student pair (where they stand at every handover), the one example sentence with its measured numbers, and the
// small visual vocabulary for "inside a model" (token chips, probability bars, number rows), drawn the same everywhere.
import React from "react";
import { Img, staticFile } from "remotion";
import { useScene } from "../../../src/engine";
import MEASURED from "../measured.json";

export const SLUG = "distillation-us";
export const asset = (name: string) => staticFile(`${SLUG}/${name}`);
export const STAGE = { top: 520, bottom: 1450, cx: 540 };

/** Claude's own orange (the teacher) and Qwen's own violet (the student). Each colour belongs to its model only. */
export const CLAUDE = "#D97757";
export const QWEN = "#615CED";
/** the one warning colour: the student's wrong or low guess, the thing training fixes */
export const AMBER = "#F5A524";
export const GOOD = "#34C759";

export type LogoName = "claude" | "qwen" | "anthropic" | "alibaba" | "instagram";

/** a real mark, fetched, drawn bare: no tile, no circle, no border (the creator's rule). Anthropic's mark is black: `invert` on dark. */
export const Logo: React.FC<{ name: LogoName; size?: number; invert?: boolean; style?: React.CSSProperties }> = ({ name, size = 96, invert, style }) => (
  <Img
    src={asset(`logo-${name}.png`)}
    style={{ width: size, height: size, objectFit: "contain", display: "block", flex: "none", filter: invert ? "invert(1)" : undefined, ...style }}
  />
);

/**
 * Measured before the build (reels/distillation-us/measured.json, facts.md): Qwen/Qwen3-0.6B-Base, open weights, run
 * on this Mac on 2026-09-26. Every number the reel draws inside a model comes from here. Nothing else is a number.
 *  - SENTENCE, its real TOKENS (text + id), the real TOP5 next-token probabilities
 *  - EMBED: the first 6 of 1024 values of each token's embedding
 *  - ATTN: how much the last token looks back at each token (mean over 28 layers and all heads). The first token takes
 *    65 % (the known "attention sink"); scenes that draw the look-back leave it out and compare the other six.
 *  - STEPS: a real training run, SGD lr 5e-6, on this one sentence with the teacher's word " teach": p(teach) per step
 *    and the five words' probabilities per step. 2.3 % -> 82.5 % in 11 steps; " teach" becomes the top pick at step 3.
 *  - W_BEFORE / W_AFTER: an 8x6 slice of layer 0's query weights before and after the first step (8 decimals: the
 *    nudge lives in the 7th and 8th decimals; that is the point).
 */
export const M = MEASURED;
export const SENTENCE = M.sentence; // "The best way to learn is to"
export const TOKENS = M.tokens.map((t) => t.text); // ["The", " best", " way", " to", " learn", " is", " to"]
export const TOP5 = M.top5; // practice 31.3 %, do 15.8 %, learn 13.9 %, teach 2.3 %, try 1.7 %
export const TEACHER_WORD = " teach"; // "The best way to learn is to teach." (the saying; the teacher's answer)
export const STEPS = M["training_sgd_lr5e-6"];
export const W_BEFORE = M.weight_slice_before_6dp;
export const W_AFTER = M.weight_slice_after_1_step;
export const EMBED = M.embeddings;
export const ATTN = M.attention_last_token;
export const LAYERS = M.layers; // 28
/** Qwen3's largest open model has 235 billion parameters (Qwen3-235B-A22B). The small one measured here: 596,049,920. */
export const PARAMS = { small: M.params, big: 235_000_000_000 };
/** inside the machine, measured on the same open model (for `catch`; label it "measured on an open model"):
 *  HIDDEN[layer] = the last token's hidden state after each layer (0 = embedding, 28 = last), first 12 of 1024 values;
 *  NORMS[layer][token] = the size of every token's hidden state at every depth (a heat map);
 *  LENS[layer].top = the model's best 3 guesses if you read the hidden state at that depth ("logit lens");
 *  TOP40 = the 40 most likely next tokens out of VOCAB (151,936); LOSS = the training run's loss per step (3.78 -> 0.19) */
export const HIDDEN = M.hidden_last_token_first12;
export const NORMS = M.hidden_norms_layer_by_token;
export const LENS = M.logit_lens_last_token;
export const TOP40 = M.top40;
export const VOCAB = M.vocab_size;
export const LOSS = STEPS.map((s) => s.loss);

/** one colour per token position, used by the chip, its embedding column and its attention line */
export const TOKEN_HUES = ["#8E8E93", "#5E9EFF", "#34C7A0", "#F2B33D", "#E0719C", "#A77BF3", "#5AC8FA"];

// Continuity contracts between scenes (plan.md). A scene that hands an object over ends with it exactly here, and the
// next scene starts with it exactly here, so the Stage's lift reads as the same object staying put.
export const HANDOFF = {
  /** the teacher and student marks side by side, centre of the stage: end of `hook`, start and end of `report`, start
   *  of `distill`, start of `limits` */
  pair: { claude: { cx: 300, cy: 960 }, qwen: { cx: 780, cy: 960 }, size: 220 },
  /** end of `distill` = start of `weights`: both marks grown, labels under them */
  pairLabelled: { claude: { cx: 300, cy: 930 }, qwen: { cx: 780, cy: 930 }, size: 260, labelTop: 1100 },
  /** end of `distill` = start of `weights`: the Qwen mark alone, big and centred, `student` label under it */
  student: { cx: 540, cy: 960, size: 260, labelTop: 1120 },
  /** the example sentence's row, wherever it is drawn (inside, training, catch): chips centred on 540 at this y */
  sentence: { cy: 640, chipH: 76, font: 40, gap: 10 },
  /** the probability bars, wherever they are drawn: left edge, top, width, row pitch */
  bars: { left: 150, top: 1030, width: 780, pitch: 74, barH: 44 },
};

/** a token chip: the token's text in mono, a leading space shown as a small dot so the viewer sees it is part of it */
export const TokenChip: React.FC<{ text: string; hue: string; font?: number; style?: React.CSSProperties }> = ({ text, hue, font = HANDOFF.sentence.font, style }) => {
  const { theme, ground } = useScene();
  const lead = text.startsWith(" ");
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", height: HANDOFF.sentence.chipH, padding: "0 18px", borderRadius: 12,
        background: `${hue}26`, boxShadow: `inset 0 0 0 3px ${hue}`, color: ground.ink, fontFamily: theme.font.mono,
        fontSize: font, fontWeight: 600, whiteSpace: "pre", flex: "none", ...style,
      }}
    >
      {lead && <span style={{ color: hue, marginRight: 6 }}>·</span>}
      {text.trimStart()}
    </div>
  );
};

/** measured width of a chip, for layout without the DOM (mono is ~0.6 em per char) */
export const chipWidth = (text: string, font = HANDOFF.sentence.font) => 36 + (text.trimStart().length + (text.startsWith(" ") ? 1.2 : 0)) * font * 0.6;

/**
 * Probability bars: one row per token, label left, bar, percentage right. `k` in 0..1 grows the bars (the reveal),
 * `highlight` recolours one row, `pct=false` hides the numbers (Claude's bars: nobody outside Anthropic sees them).
 * `max` is the probability that fills the whole bar width (default: the largest shown).
 */
export const ProbBars: React.FC<{
  rows: { token: string; p: number }[];
  k?: number;
  highlight?: { token: string; color: string };
  pct?: boolean;
  max?: number;
  style?: React.CSSProperties;
}> = ({ rows, k = 1, highlight, pct = true, max, style }) => {
  const { theme, ground } = useScene();
  const B = HANDOFF.bars;
  const top = max ?? Math.max(...rows.map((r) => r.p));
  const trackW = B.width - 316; // label 190 + gap 16 + percentage 110: ends at x 930, clear of Instagram's buttons
  return (
    <div style={{ position: "absolute", left: B.left, top: B.top, width: B.width, ...style }}>
      {rows.map((r, i) => {
        const hi = highlight && highlight.token === r.token;
        const c = hi ? highlight!.color : ground.dim;
        return (
          <div key={r.token} style={{ position: "absolute", top: i * B.pitch, left: 0, width: B.width, height: B.barH, display: "flex", alignItems: "center" }}>
            <div style={{ width: 190, fontFamily: theme.font.mono, fontSize: 34, fontWeight: 600, color: hi ? ground.ink : ground.dim, textAlign: "right", paddingRight: 20, whiteSpace: "pre" }}>
              {r.token.trimStart()}
            </div>
            <div style={{ width: trackW, height: B.barH, borderRadius: 8, background: ground.hairline, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (r.p / top) * 100 * k)}%`, height: "100%", borderRadius: 8, background: c }} />
            </div>
            {pct && (
              <div style={{ width: 110, marginLeft: 16, fontFamily: theme.font.mono, fontSize: 32, color: hi ? ground.ink : ground.dim, fontVariantNumeric: "tabular-nums" }}>
                {`${(r.p * 100 * k).toFixed(1)}%`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/** a number as the model stores it, fixed decimals, sign kept so columns line up */
export const fmt = (x: number, dp = 4) => (x < 0 ? "−" : " ") + Math.abs(x).toFixed(dp);
