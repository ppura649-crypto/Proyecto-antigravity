// "So switch browsers. And if you want more tips like this, follow me."
// The verdict clears and the reel's Chrome window (still on AliExpress) rises under the row. On "switch" a cursor
// clicks Firefox's mark and the same window becomes Firefox: its frame, its tab, its address field, its new tab
// page with the mark. On "tips" the row leaves off the top, the window takes the stage and goes to the creator's Instagram
// profile; on "follow" the cursor taps Follow and it turns Following.
import React from "react";
import { Cursor, arrive, blurIn, blurOut, ease, leave, on, prog, typeOn, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { Logo, ROW, RED, rowX } from "./parts";
import { BraveTag, FirefoxTag, HashLine, Marks, Slot, lerp, usePalette } from "./BrowserRow";
import { Bracket, VERDICT } from "./ChromeVerdict";
import { AliPage, FirefoxNewTab, MorphWindow } from "./CtaWindow";
import { PROFILE, Profile } from "./CtaProfile";

const WIN = { left: 90, top0: 940, h0: 440, top1: 660, h1: 162 + PROFILE.height };
const URL = "instagram.com/your.handle";

/** the verdict as `chrome` left it, clearing in place in the first frames */
const Verdict: React.FC<{ at: number }> = ({ at }) => {
  const { f } = useScene();
  const p = usePalette();
  if (f > at + 12) return null;
  return (
    <div style={{ position: "absolute", inset: 0, ...blurOut(f, at, { dur: 10 }) }}>
      <HashLine text={VERDICT.text} color={p.ink} cx={VERDICT.cx} size={VERDICT.size} />
      <Bracket at={-100} colour={p.dim} />
      <Slot i={0} outline={RED} outlineK={1} />
      <Slot i={1} outline={p.outline} outlineK={1} />
      <Slot i={2} fill={1} style={{ opacity: 0.4 }}><FirefoxTag /></Slot>
      <Slot i={3} fill={1} style={{ opacity: 0.4 }}><BraveTag /></Slot>
    </div>
  );
};

export const Cta: React.FC = () => {
  const { f, fps, cue, scene } = useScene();
  const t0 = scene.from - LEAD;
  const sw = cue("switch");
  const tips = cue("tips");
  const tap = cue("follow");

  // the row: settles from the verdict, Firefox is pressed and lifts on "switch", the whole row leaves on "tips"
  const settle = arrive(f, t0, 16);
  const press = on(f, sw, sw + 8) ? Math.sin(((f - sw) / 8) * Math.PI) : 0;
  const pick = arrive(f, sw + 4, 14);
  const state = (i: number) =>
    i === 2 ? { lift: pick, dim: 1 - settle, press } : { lift: i < 2 ? 1 - settle : 0, dim: i < 2 ? 0.55 * pick : lerp(1, 0, settle) + 0.55 * pick };
  const rowOut = -leave(f, tips - 4, 12) * 1100;

  // the window: rises at once, becomes Firefox on the click, takes the stage on "tips"
  // L1 rise from below, its blur tied to its speed so it is sharp the moment it parks, before the click
  const riseAt = (fr: number) => (1 - arrive(fr, t0, 20)) * 480;
  const rise = riseAt(f);
  const riseBlur = Math.min(14, Math.abs(rise - riseAt(f - 1)) * 0.3);
  const k = arrive(f, sw + 2, 16);
  const grow = arrive(f, tips, 22);
  const top = lerp(WIN.top0, WIN.top1, grow);
  const height = lerp(WIN.h0, WIN.h1, grow);
  const typed = typeOn(URL, f, tips - 2, fps, 16);
  const isFox = f >= sw + 6;
  const isIg = f >= tips + 6;
  const url = !isFox ? "aliexpress.com" : f < tips - 2 ? "" : typed.text;
  const favicon = isIg ? <Logo name="instagram" size={32} /> : isFox ? <Logo name="firefox" size={32} /> : <Logo name="aliexpress" size={32} style={{ borderRadius: 6 }} />;
  const title = isIg ? "Instagram" : isFox ? "New Tab" : "AliExpress";
  const iconIn = (at: number) => ({ ...blurIn(f, at, { dur: 6 }) });
  const btn = { x: WIN.left + PROFILE.pad + PROFILE.btnW / 2, y: WIN.top1 + 162 + PROFILE.btnTop + PROFILE.btnH / 2 };
  return (
    <>
      <Verdict at={t0 + 2} />
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${rowOut.toFixed(1)}px)` }}>
        <Marks state={state} />
      </div>
      <div style={{ position: "absolute", left: WIN.left, top: top + rise, filter: riseBlur > 0.3 ? `blur(${riseBlur.toFixed(2)}px)` : undefined }}>
        <MorphWindow
          k={k}
          height={height}
          favicon={<div key={title} style={iconIn(isIg ? tips + 6 : isFox ? sw + 6 : -100)}>{favicon}</div>}
          title={title}
          url={url}
          caret={isFox}
        >
          {!isFox || f < sw + 14 ? <AliPage style={f >= sw + 2 ? blurOut(f, sw + 2, { dur: 10 }) : undefined} /> : null}
          {on(f, sw + 6) && f < tips + 14 && (
            <FirefoxNewTab
              style={f >= tips + 4 ? blurOut(f, tips + 4, { dur: 10 }) : blurIn(f, sw + 6, { dur: 9 })}
              markStyle={{ transform: `scale(${(0.8 + 0.2 * prog(f, sw + 6, 12, ease.back)).toFixed(3)})` }}
            />
          )}
          {on(f, tips + 6) && (
            <div style={{ position: "absolute", inset: 0, ...blurIn(f, tips + 6, { dur: 8 }) }}>
              <Profile at={tips + 8} tap={tap} />
            </div>
          )}
        </MorphWindow>
      </div>
      <Cursor
        path={[
          { f: t0 + 4, x: 860, y: 1480 },
          { f: sw - 2, x: rowX(2) - 12, y: ROW.y - 7 },
          { f: sw + 12, x: rowX(2) - 12, y: ROW.y - 7 },
          { f: tips + 10, x: 560, y: 1330 },
          { f: tap - 3, x: btn.x - 12, y: btn.y - 7 },
          { f: tap + 8, x: btn.x - 12, y: btn.y - 7 },
          { f: tap + 30, x: btn.x + 150, y: btn.y + 96 },
          { f: tap + 400, x: btn.x + 150, y: btn.y + 96 },
        ]}
      />
    </>
  );
};

