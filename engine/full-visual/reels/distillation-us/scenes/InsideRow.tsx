// The one sentence of `inside`, as a single object that changes state: typed text -> its 7 real token chips on an even
// pitch (so each chip has room for its column of numbers under it) -> two rows at the shared chip size once the
// explanation is done -> " practice" and "." join the end of the second row. Also: the cue table every `inside` part uses.
import React from "react";
import { arrive, ease, prog, useScene } from "../../../src/engine";
import { HANDOFF, QWEN, SENTENCE, TOKENS, TOKEN_HUES, TokenChip } from "./parts";

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** every cue of the scene, once */
export function useT() {
  const { cue, endsOn, scene } = useScene();
  return {
    born: scene.from - 6,
    cuts: cue("cuts"),
    typeAt: endsOn("tokens", 32),
    split: cue("tokens"),
    pieces: cue("pieces"),
    list: cue("list"),
    layer: cue("layer"),
    pass: cue("layer", 2),
    mult: cue("multiplies"),
    weights: cue("weights"),
    along: cue("along"),
    back: cue("back"),
    earlier: cue("earlier"),
    context: cue("context"),
    end: cue("end"),
    prob: cue("probability"),
    every: cue("every"),
    picks: cue("picks"),
    again: cue("sentence"),
    repeats: cue("repeats"),
  };
}

// even pitch while the chips carry columns: 7 x 128 = 896, inside the 900 column
export const PITCH = 128;
export const ROW_FONT = 32;
export const rowX = (i: number) => 540 + (i - 3) * PITCH;
export const ROW_Y = HANDOFF.sentence.cy;

const TYPE_FONT = 52;
const CH = 0.6; // mono advance, em
const cw = (text: string, font: number, pad: number) => 2 * pad + (text.trimStart().length + (text.startsWith(" ") ? 1.2 : 0)) * font * CH;

/** the typed sentence: where each token's centre sits inside it */
const typedX = (() => {
  const x0 = 540 - (SENTENCE.length * TYPE_FONT * CH) / 2;
  let at = 0;
  return TOKENS.map((t) => {
    const c = x0 + (at + t.length / 2) * TYPE_FONT * CH;
    at += t.length;
    return c;
  });
})();

// the end layout: two rows at the shared chip size (HANDOFF.sentence), centred on 540 around cy 640
export const FINAL = { font: HANDOFF.sentence.font, pad: 18, gap: HANDOFF.sentence.gap, y1: ROW_Y - 44, y2: ROW_Y + 44 };
export const GEN = [" practice", "."];
const rowCentres = (texts: string[]) => {
  const ws = texts.map((t) => cw(t, FINAL.font, FINAL.pad));
  const total = ws.reduce((a, b) => a + b, 0) + FINAL.gap * (ws.length - 1);
  let x = 540 - total / 2;
  return ws.map((w) => {
    const c = x + w / 2;
    x += w + FINAL.gap;
    return c;
  });
};
const ROW1 = rowCentres(TOKENS.slice(0, 5));
/** second row with n generated tokens in it (0, 1 or 2) */
export const row2 = (n: number) => rowCentres([...TOKENS.slice(5), ...GEN.slice(0, n)]);
export const genSlot = (n: number) => ({ x: row2(n + 1)[2 + n], y: FINAL.y2, w: cw(GEN[n], FINAL.font, FINAL.pad) });

const hex = (a: number) => Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, "0");

/** a chip at a centre, with its size and how much of its chip-ness (fill, outline) is showing */
export const ChipAt: React.FC<{ text: string; hue: string; x: number; y: number; font: number; pad: number; k?: number; glow?: number; style?: React.CSSProperties }> = ({ text, hue, x, y, font, pad, k = 1, glow = 0, style }) => {
  const h = lerp(64, HANDOFF.sentence.chipH, (font - ROW_FONT) / (FINAL.font - ROW_FONT));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", ...style }}>
      <TokenChip
        text={text}
        hue={hue}
        font={font}
        style={{
          height: Math.max(56, h), padding: `0 ${pad}px`, background: `${hue}${hex(0.15 * k)}`,
          boxShadow: `inset 0 0 0 3px ${hue}${hex(k)}${glow > 0 ? `, 0 0 ${(glow * 34).toFixed(1)}px ${(glow * 6).toFixed(1)}px ${hue}${hex(0.55 * glow)}` : ""}`,
        }}
      />
    </div>
  );
};

/** where the two generated tokens start (the top bar's label) and when they fly */
export const flights = (T: ReturnType<typeof useT>) => [
  { at: T.picks + 4, dur: 22, x: 250, y: HANDOFF.bars.top + HANDOFF.bars.barH / 2 },
  { at: T.repeats - 16, dur: 16, x: 420, y: HANDOFF.bars.top + HANDOFF.bars.barH / 2 },
];

/** the sentence, all its states. `glow[i]` lights a chip (the look-back uses it), `lift[i]` raises it */
export const Sentence: React.FC<{ glow?: number[]; lift?: number[] }> = ({ glow = [], lift = [] }) => {
  const { f, fps, theme, ground } = useScene();
  const T = useT();
  if (f < T.split) {
    const shown = Math.max(0, Math.min(SENTENCE.length, Math.floor(((f - T.typeAt) / fps) * 50)));
    const caret = shown < SENTENCE.length || Math.floor(f / 16) % 2 === 0;
    return (
      <div style={{ position: "absolute", left: 0, width: 1080, top: ROW_Y - 32, height: 64, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "relative", width: SENTENCE.length * TYPE_FONT * CH, fontFamily: theme.font.mono, fontSize: TYPE_FONT, fontWeight: 700, color: ground.ink, whiteSpace: "pre" }}>
          {SENTENCE.slice(0, shown)}
          {caret && <span style={{ display: "inline-block", width: 4, height: 50, marginLeft: 2, verticalAlign: "middle", background: QWEN }} />}
        </div>
      </div>
    );
  }
  const s = prog(f, T.split, 18, ease.inOut); // the split: text -> chips on the even pitch
  const r = prog(f, T.end, 20, ease.inOut); // the reflow: two rows at the shared size, room kept for the next token
  const [g1, g2] = flights(T);
  const sh = prog(f, g2.at, g2.dur, ease.inOut); // row 2 re-centres while "." flies in
  const cur = (k: number) => lerp(row2(1)[k] ?? row2(2)[k], row2(2)[k], sh);
  const slotOn = f >= T.end + 8 && f < g1.at + g1.dur; // room for the next word, from the moment the row re-forms
  const caretOn = f >= g2.at + g2.dur && Math.floor(f / 16) % 2 === 0;
  const end3 = cur(3) + cw(".", FINAL.font, FINAL.pad) / 2;
  return (
    <>
      {slotOn && (
        <div style={{ position: "absolute", left: cur(2) - genSlot(0).w / 2, top: FINAL.y2 - 38, width: genSlot(0).w, height: 76, borderRadius: 12, background: ground.hairline, opacity: prog(f, T.end + 8, 10), display: "flex", alignItems: "center", paddingLeft: 20 }}>
          {Math.floor(f / 16) % 2 === 0 && <div style={{ width: 4, height: 46, background: QWEN }} />}
        </div>
      )}
      {TOKENS.map((t, i) => {
        const fx = i < 5 ? ROW1[i] : cur(i - 5);
        const fy = i < 5 ? FINAL.y1 : FINAL.y2;
        const x = lerp(lerp(typedX[i], rowX(i), s), fx, r);
        const y = lerp(ROW_Y, fy, r) - (lift[i] ?? 0);
        const font = r > 0 ? lerp(ROW_FONT, FINAL.font, r) : lerp(TYPE_FONT, ROW_FONT, s);
        const pad = r > 0 ? lerp(12, FINAL.pad, r) : lerp(0, 12, s);
        return <ChipAt key={i} text={t} hue={TOKEN_HUES[i]} x={x} y={y} font={font} pad={pad} k={prog(f, T.split, 8, ease.out)} glow={glow[i] ?? 0} />;
      })}
      {[g1, g2].map((g, j) => {
        if (f < g.at) return null;
        const a = arrive(f, g.at, g.dur);
        const b = arrive(f - 1, g.at, g.dur);
        const v = Math.abs(a - b) * Math.abs(FINAL.y2 - g.y);
        return (
          <ChipAt
            key={GEN[j]} text={GEN[j]} hue={QWEN} x={lerp(g.x, cur(2 + j), a)} y={lerp(g.y, FINAL.y2, a)} font={FINAL.font} pad={FINAL.pad}
            glow={1 - prog(f, g.at + g.dur, 24, ease.linear)} style={{ filter: v > 2 ? `blur(${Math.min(10, v * 0.25).toFixed(1)}px)` : undefined }}
          />
        );
      })}
      {caretOn && <div style={{ position: "absolute", left: end3 + 12, top: FINAL.y2 - 23, width: 4, height: 46, background: QWEN }} />}
    </>
  );
};
