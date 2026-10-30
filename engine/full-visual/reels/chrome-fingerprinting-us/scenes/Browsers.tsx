// "Firefox, for example, has blocked audio fingerprinting since 2023. Brave adds a little random noise to the results,
// so the fingerprint changes each time."
// The row from `choose` answers its first two slots. Firefox lifts, its own release note (Firefox 118, verified at
// mozilla.org) arrives and types its line, the slot fills and the hash above goes grey: the same for everyone. Then
// Brave lifts, the hash scrambles on "noise" and re-rolls into the other real value on "changes".
import React from "react";
import { Travel, arrive, blurIn, ease, leave, mix, on, prog, typeOn, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { HASH, HASH_2, Logo, rowX, shortHash } from "./parts";
import { BraveTag, FirefoxTag, HashLine, Marks, SLOT, Slot, scramble, usePalette } from "./BrowserRow";

// the release note's own line, verbatim, shortened only at its end
const NOTE = "Web Audio in Firefox now uses the FDLIBM math library on all systems…";
const CARD = { left: 90, top: 1112, width: 900 };

/** Firefox 118's release notes, redrawn: the mark, the version, the line itself typing */
const ReleaseNote: React.FC<{ at: number; typeAt: number; gone: number }> = ({ at, typeAt, gone }) => {
  const { f, fps, theme } = useScene();
  const p = usePalette();
  const t = typeOn(NOTE, f, typeAt, fps, 11);
  // on "Brave" it folds into the slot it answered: towards Firefox's slot, smaller, gone
  const g = leave(f, gone, 14);
  const dx = (rowX(2) - (CARD.left + CARD.width / 2)) * g;
  const dy = (SLOT.top + SLOT.h / 2 - (CARD.top + 150)) * g;
  const caret = t.typing || (Math.floor(f / 24) % 2 === 0 && f < gone);
  return (
    <Travel curve="measured" at={at} from="bottom" dist={320} dur={20} style={{ position: "absolute", left: CARD.left, top: CARD.top, width: CARD.width }}>
      <div
        style={{
          background: p.card, borderRadius: 22, boxShadow: p.shadow, padding: "30px 40px 34px", boxSizing: "border-box", fontFamily: theme.font.ui,
          transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${(1 - 0.85 * g).toFixed(3)})`, opacity: 1 - prog(f, gone + 8, 6),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Logo name="firefox" size={60} />
          <span style={{ fontSize: 40, fontWeight: 800, color: p.ink }}>Firefox 118.0</span>
          <span style={{ fontSize: 32, color: p.dim }}>Release Notes</span>
        </div>
        <div style={{ marginTop: 22, display: "flex", gap: 16, fontSize: 40, lineHeight: "54px", color: p.ink, minHeight: 162 }}>
          <span style={{ color: p.dim }}>•</span>
          <span>
            {t.text}
            <span style={{ display: "inline-block", width: 3, height: 42, marginLeft: 3, verticalAlign: "middle", background: caret && f >= typeAt ? p.ink : "transparent" }} />
          </span>
        </div>
      </div>
    </Travel>
  );
};

export const Browsers: React.FC = () => {
  const { f, cue, scene } = useScene();
  const p = usePalette();
  const t0 = scene.from - LEAD;
  const ff = cue("Firefox,");
  const y23 = cue("2023.");
  const brave = cue("Brave");
  const noise = cue("noise");
  const changes = cue("changes");
  const time = cue("time.");

  // from the first frame the two unanswered marks start to recede, so Firefox has the stage the moment it is named
  const recede = prog(f, t0, ff - t0 + 6, ease.inOut);
  const ffLift = arrive(f, ff, 14) * (1 - arrive(f, brave, 16));
  const braveLift = arrive(f, brave, 14) * (1 - arrive(f, time, 18));
  const braveDim = recede * (1 - arrive(f, brave, 10));
  const state = (i: number) =>
    i === 2 ? { lift: ffLift, dim: 0 } : i === 3 ? { lift: braveLift, dim: braveDim } : { lift: 0, dim: recede };

  // the hash: ink, grey on "2023." (the same for every Firefox), scrambling on "noise", a new value on "changes"
  const settle = (i: number) => f >= changes + 2 + i * 0.6;
  const text = f < noise ? shortHash(HASH) : f < changes ? scramble(shortHash(HASH), f, () => false) : scramble(shortHash(HASH_2), f, settle);
  const colour = f < noise ? mix(f, y23 + 4, 8, p.ink, p.grey) : f < changes ? p.grey : mix(f, changes, 10, p.grey, p.ink);
  const shake = on(f, noise, changes + 14) ? Math.sin(f * 2.7) * 5 * (1 - prog(f, changes, 14)) : 0;

  const ffFill = prog(f, y23, 7);
  const braveFill = prog(f, changes, 7);
  return (
    <>
      <HashLine text={text} color={colour} dx={shake} />
      <Marks state={state} />
      <Slot i={0} />
      <Slot i={1} />
      <Slot i={2} fill={ffFill} outline={p.outline} outlineK={ffLift * (1 - ffFill)}>
        {on(f, y23) && <FirefoxTag style={blurIn(f, y23, { dur: 8, rise: 12 })} />}
      </Slot>
      <Slot i={3} fill={braveFill} outline={p.outline} outlineK={braveLift * (1 - braveFill)}>
        {on(f, changes) && <BraveTag style={blurIn(f, changes, { dur: 8, rise: 12 })} />}
      </Slot>
      <ReleaseNote at={cue("audio")} typeAt={y23} gone={brave} />
    </>
  );
};
