// "Unfortunately, Chrome and Safari don't offer anything comparable by default."
// The ground goes dark and the row swaps focus: the two answered browsers recede, Chrome lifts over a slot that stays
// empty and turns the reel's red, Safari lifts over an empty slot of its own (red is Chrome's alone). On "comparable"
// the hash re-rolls back to the original value and stamps above the two of them, unchanged, and a solid bracket
// ties it to both on "default.".
import React from "react";
import { arrive, draw, ease, on, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { HANDOFF, HASH, HASH_2, RED, rowX, shortHash } from "./parts";
import { BraveTag, FirefoxTag, HASH_FONT, HashLine, Marks, Slot, lerp, scramble, usePalette } from "./BrowserRow";

/** where the verdict parks the hash: centred over Chrome and Safari, a size smaller so it fits their width */
export const VERDICT = { cx: (rowX(0) + rowX(1)) / 2, size: 38, text: shortHash(HASH, 11, 6) };
const BRACKET_Y = HANDOFF.hashLine.top + 56;

/** the solid bracket under the stamped hash, one leg down to each of the two marks */
export const Bracket: React.FC<{ at: number; colour: string; opacity?: number }> = ({ at, colour, opacity = 1 }) => {
  const { f } = useScene();
  const [a, b] = [rowX(0), rowX(1)];
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity }}>
      <path d={`M${a},${BRACKET_Y + 12}V${BRACKET_Y}H${b}V${BRACKET_Y + 12}`} fill="none" stroke={colour} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" {...draw(f, at, 14)} />
    </svg>
  );
};

export const ChromeVerdict: React.FC = () => {
  const { f, cue, endsOn, scene } = useScene();
  const p = usePalette();
  const t0 = scene.from - LEAD;
  const chrome = cue("Chrome");
  const safari = cue("Safari");
  const stamp = cue("comparable");

  // the focus swaps from the first frame: the answered pair recedes as the unanswered pair comes back
  const swap = prog(f, t0, chrome - t0 + 4, ease.inOut);
  const state = (i: number) =>
    i === 0 ? { lift: arrive(f, chrome, 14), dim: 1 - swap } : i === 1 ? { lift: arrive(f, safari, 14), dim: 1 - swap } : { lift: 0, dim: swap };

  // the hash travels over the pair while it re-rolls, and lands on "comparable" as the original value
  const move = prog(f, stamp - 12, 12, ease.inOut);
  const settle = (i: number) => f >= stamp - 6 + i * 0.4;
  const text = f < stamp - 12 ? shortHash(HASH_2) : scramble(VERDICT.text, f, settle);
  const s = prog(f, stamp, 9, ease.out);
  const stampScale = f < stamp ? 1 : 1 + 0.16 * (1 - s); // hits big and settles: a stamp, not a pop
  const redK = prog(f, chrome + 2, 8, ease.linear);
  const safariK = prog(f, safari + 2, 8, ease.linear);
  const breathe = on(f, chrome + 10) ? 0.82 + 0.18 * Math.sin((f - chrome) / 9) : 1; // the red outline stays live
  return (
    <>
      <HashLine
        text={text}
        color={p.ink}
        cx={lerp(540, VERDICT.cx, move)}
        size={lerp(HASH_FONT, VERDICT.size, move)}
        scale={stampScale}
        blur={f >= stamp ? (1 - s) * 5 : 0}
      />
      <Bracket at={endsOn("default.", 14)} colour={p.dim} />
      <Marks state={state} />
      <Slot i={0} outline={RED} outlineK={redK * breathe} />
      <Slot i={1} outline={p.outline} outlineK={safariK} />
      <Slot i={2} fill={1} style={{ opacity: 1 - 0.6 * swap }}>
        <FirefoxTag />
      </Slot>
      <Slot i={3} fill={1} style={{ opacity: 1 - 0.6 * swap }}>
        <BraveTag />
      </Slot>
    </>
  );
};
