// hook, dark, 0.1-3.7 s: "How do Chinese AI companies copy Anthropic models?"
// The Claude mark spins in alone, big and centred. On "Chinese" it slides left and the Qwen mark drops in on the
// right. On "companies" Qwen's prompts cross to Claude; on "copy" Claude's answers pour back into Qwen, which kicks
// on every hit; on "models?" the stream runs faster. Ends at HANDOFF.pair with the stream flowing.
import React from "react";
import { arrive, blurIn, ease, prog, useScene } from "../../../src/engine";
import { HANDOFF } from "./parts";
import {
  HitRings, MarkAt, MarkLabel, PromptBubble, Stream, TRAVEL, arcAt, every, grid, hitKick, lerp, type MarkState,
} from "./OpeningBits";

const P = HANDOFF.pair;

function useGeometry() {
  const { f, scene, cue } = useScene();
  const born = scene.from + 4; // f0 bare, the first caption word on f1, the mark launching on f4 (MOTION-SPEC §5)
  const ch = cue("Chinese");
  const claude = (fr: number): MarkState => {
    const spin = arrive(fr, born, 30);
    const k = arrive(fr, ch, 22);
    return {
      cx: lerp(540, P.claude.cx, k), cy: lerp(930, P.claude.cy, k), size: lerp(360, P.size, k),
      rot: (1 - spin) * -300, scale: 0.2 + 0.8 * spin, opacity: prog(fr, born, 5, ease.linear),
    };
  };
  const qwen = (fr: number): MarkState => {
    const k = arrive(fr, ch + 2, 24);
    return { cx: P.qwen.cx, cy: lerp(P.qwen.cy - 820, P.qwen.cy, k), size: P.size, opacity: prog(fr, ch + 2, 2, ease.linear) };
  };
  return { f, born, ch, claude, qwen };
}

/** the questions go first: three prompts leave Qwen and land in Claude, along the lower arc */
const Prompts: React.FC<{ c: MarkState; q: MarkState; at: number }> = ({ c, q, at }) => {
  const { f } = useScene();
  const a = { x: q.cx - q.size * 0.3, y: q.cy };
  const b = { x: c.cx + c.size * 0.3, y: c.cy };
  return (
    <>
      {every(at, at + 27, 9).map((e, i) => {
        const p = prog(f, e, 30, ease.inOut);
        if (f < e || p >= 1) return null;
        const pt = arcAt(a, b, -70, p);
        const sc = 0.35 + 0.65 * Math.sin(Math.PI * p);
        return <PromptBubble key={e} v={i} dark style={{ left: pt.x, top: pt.y - 25, transform: `translateX(-50%) scale(${sc.toFixed(3)})`, opacity: Math.min(1, p * 8, (1 - p) * 8), zIndex: 3 }} />;
      })}
    </>
  );
};

export const Hook: React.FC = () => {
  const { f, born, ch, claude, qwen } = useGeometry();
  const { cue, scene } = useScene();
  const copy = cue("copy");
  const fast = cue("models?");
  const emits = [...every(copy, fast, 12), ...grid(fast, scene.to + 60)];
  const arrivals = emits.map((e) => e + TRAVEL);
  const promptAt = cue("companies") - 4;
  // Claude takes each question with a small kick too: it is being asked
  const cKick = hitKick(f, every(promptAt, promptAt + 27, 9).map((e) => e + 30));
  const c = claude(f);
  const q = qwen(f);
  const qk = hitKick(f, arrivals);
  const flash = f >= born + 12 && f < born + 38 ? (f - born - 12) / 26 : -1; // the landing: one ring off the spark
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {flash >= 0 && (
        <div
          style={{
            position: "absolute", left: c.cx - c.size * (0.5 + 0.4 * flash), top: c.cy - c.size * (0.5 + 0.4 * flash),
            width: c.size * (1 + 0.8 * flash), height: c.size * (1 + 0.8 * flash), borderRadius: "50%",
            boxShadow: `0 0 0 ${(8 * (1 - flash) + 1).toFixed(1)}px #D97757`, opacity: 0.5 * (1 - flash),
          }}
        />
      )}
      <Prompts c={c} q={q} at={promptAt} />
      <Stream c={c} q={q} emits={emits} dark />
      <HitRings q={q} arrivals={arrivals} />
      <MarkAt name="claude" s={{ ...c, scale: (c.scale ?? 1) * (1 + 0.05 * cKick) }} prev={claude(f - 1)} />
      {f >= ch && <MarkAt name="qwen" s={{ ...q, scale: 1 + 0.07 * qk }} prev={qwen(f - 1)} />}
      {f >= ch + 8 && <MarkLabel text="Claude" s={c} style={blurIn(f, ch + 8, { dur: 9, rise: 14 })} />}
      {f >= ch + 16 && <MarkLabel text="Qwen" s={q} style={blurIn(f, ch + 16, { dur: 9, rise: 14 })} />}
    </div>
  );
};
