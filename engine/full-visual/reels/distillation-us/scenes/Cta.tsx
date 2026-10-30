// "And if you want more breakdowns like this, follow me."
// No pair: the creator's Instagram profile rises on its own from the scene's first frame (the header from the Chrome reel, real
// counts, the app's top bar), its parts landing in turn; on "breakdowns" the cursor comes in, on "follow" it taps
// Follow, it turns Following and a +1 rises off the followers. The last frame holds, readable.
import React from "react";
import { Cursor, arrive, ease, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { BAR, PROFILE, Profile, TopBar } from "./CtaProfile";

const CARD = { left: 90, w: 900, top: 690 };

export const Cta: React.FC = () => {
  const { f, cue, scene } = useScene();
  const t0 = scene.from - LEAD;
  const bd = cue("breakdowns");
  const tap = cue("follow");

  // the profile: rises from below on the first frame (L1), sharp the moment it parks
  const cardY = (fr: number) => (1 - arrive(fr, t0, 24)) * 900;
  const cy = cardY(f);
  const cb = Math.min(12, Math.abs(cy - cardY(f - 1)) * 0.2);
  const btn = { x: CARD.left + PROFILE.pad + PROFILE.btnW / 2, y: CARD.top + BAR + PROFILE.btnTop + PROFILE.btnH / 2 };
  return (
    <>
      <div
        style={{
          position: "absolute", left: CARD.left, top: CARD.top, width: CARD.w, height: BAR + PROFILE.height, borderRadius: 28, overflow: "hidden",
          background: "#FFFFFF", boxShadow: "0 30px 80px rgba(20,24,40,0.16), inset 0 0 0 1px #E6E6E6",
          transform: `translateY(${cy.toFixed(1)}px)`, filter: cb > 0.3 ? `blur(${cb.toFixed(2)}px)` : undefined, opacity: prog(f, t0, 2, ease.linear),
        }}
      >
        <TopBar at={t0 + 6} />
        <div style={{ position: "absolute", left: 0, right: 0, top: BAR, height: PROFILE.height }}>
          <Profile at={t0 + 10} tap={tap} />
        </div>
      </div>
      <Cursor
        path={[
          { f: bd + 6, x: 900, y: 1520 },
          { f: tap - 3, x: btn.x - 12, y: btn.y - 7 },
          { f: tap + 8, x: btn.x - 12, y: btn.y - 7 },
          { f: tap + 30, x: btn.x + 150, y: btn.y + 96 },
          { f: tap + 400, x: btn.x + 150, y: btn.y + 96 },
        ]}
      />
    </>
  );
};
