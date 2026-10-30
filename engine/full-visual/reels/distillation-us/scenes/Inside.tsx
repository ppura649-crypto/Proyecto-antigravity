// "First, the model cuts your text into tokens ... It picks one, adds it to the sentence, and repeats."
// One sentence the viewer follows through the whole forward pass of the real Qwen3 0.6B, measured on this Mac: typed,
// split into its 7 real tokens, each turned into its real numbers, pushed through the 28 layers, one layer opened to
// show numbers × weights, the last word looking back at the earlier ones (real attention), the real top-5 next tokens,
// and the pick joining the sentence. One idea on stage at a time; each layer of the explanation leaves as the next
// arrives. Parts: InsideRow (the sentence + cues), InsideLayers, InsideLook, InsidePick.
import React from "react";
import { arrive, blurIn, blurOut, ease, prog, useScene } from "../../../src/engine";
import { Logo, QWEN } from "./parts";
import { Sentence, lerp, useT } from "./InsideRow";
import { Columns, LayerLabels, MulPanel, Stack } from "./InsideLayers";
import { LookBack, useLookGlow } from "./InsideLook";
import { Pick } from "./InsidePick";

/** "the model": the student we are inside, the small Qwen that was actually run. It arrives with the scene, steps
 *  down out of the way when the text arrives, and leaves once the numbers take over. */
const Model: React.FC = () => {
  const { f, theme, ground } = useScene();
  const T = useT();
  if (f > T.list + 10) return null;
  const a = arrive(f, T.born, 22);
  const k = prog(f, T.cuts, 18, ease.inOut);
  const size = lerp(220, 120, k);
  const cx = 540, cy = lerp(1000, 1260, k) + (1 - a) * 700;
  return (
    <div style={{ position: "absolute", inset: 0, ...(f >= T.list - 6 ? blurOut(f, T.list - 6, { dur: 9 }) : {}) }}>
      <div style={{ position: "absolute", left: cx - size * 1.1, top: cy - size * 1.1, width: size * 2.2, height: size * 2.2, borderRadius: "50%", background: `radial-gradient(circle, ${QWEN}55 0%, transparent 65%)`, opacity: a }} />
      <div style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, filter: a < 0.9 ? `blur(${((1 - a) * 16).toFixed(1)}px)` : undefined }}>
        <Logo name="qwen" size={size} />
      </div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: cy + size / 2 + 22, textAlign: "center", fontFamily: theme.font.ui, fontSize: lerp(44, 36, k), fontWeight: 600, color: ground.ink, ...blurIn(f, T.born + 12, { dur: 9, rise: 12 }) }}>
        Qwen3 0.6B
      </div>
    </div>
  );
};

/** "token", said once: a small tag under one chip while the voice says "small pieces of words" */
const TokenTag: React.FC = () => {
  const { f, theme, ground } = useScene();
  const T = useT();
  const at = T.split + 14;
  if (f < at || f > T.list) return null;
  const x = 540 + 1 * 128; // under " learn"
  return (
    <div style={{ position: "absolute", left: x - 100, width: 200, top: 684, textAlign: "center", ...(f < T.list - 8 ? blurIn(f, at, { dur: 8, rise: -10 }) : blurOut(f, T.list - 8, { dur: 7 })) }}>
      <div style={{ width: 3, height: 26, background: ground.dim, margin: "0 auto 6px" }} />
      <span style={{ fontFamily: theme.font.ui, fontSize: 38, fontWeight: 600, color: ground.ink }}>token</span>
    </div>
  );
};

export const Inside: React.FC = () => {
  const { f } = useScene();
  const T = useT();
  // "small pieces of words": a ripple runs along the chips, one after the other, so each piece reads as its own thing
  const lift = Array.from({ length: 7 }, (_, i) => {
    const t = f - (T.pieces + i * 4);
    return t > 0 && t < 16 ? Math.sin((t / 16) * Math.PI) * 14 : 0;
  });
  const glow = useLookGlow();
  return (
    <>
      <Model />
      <Stack />
      <Columns />
      <LayerLabels />
      <MulPanel />
      <LookBack />
      <Pick />
      <TokenTag />
      <Sentence lift={lift} glow={glow} />
    </>
  );
};
