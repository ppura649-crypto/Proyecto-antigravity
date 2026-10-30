// "This is actually a well-known technique. It's been around for years, and plenty of companies do the same thing."
// A timeline draws left to right through "well-known"; three dated pins, each a real source, drop onto it and the last
// lands on "years,"; on "plenty" the real FingerprintJS repo rises under it, its stars counting to today's value;
// on "thing." the history dims and the repo holds.
import React from "react";
import { Travel, arrive, blurIn, countTo, ease, pop, prog, useScene } from "../../../src/engine";
import { PINS, PinCard, REPO, RepoCard, TL } from "./KnownBits";

const STARS = 28516; // api.github.com/repos/fingerprintjs/fingerprintjs, stargazers_count, 2026-09-25
const DROP = 18; // a pin card's fall
const STEP = 14; // between pins

export const Known: React.FC = () => {
  const { f, cue, cueEnd, endsOn, scene, ground, theme } = useScene();
  const lineAt = scene.from - 6; // the axis is already drawing while the fingerprint scene lifts away
  const lineEnd = cueEnd("well-known") + 30;
  const pinAt = (i: number) => endsOn("years", DROP) - (PINS.length - 1 - i) * STEP;
  const plenty = cue("plenty");
  const countEnd = cueEnd("companies") + 4;
  const dimAt = cue("thing");

  const k = prog(f, lineAt, lineEnd - lineAt, ease.inOut); // share of the axis drawn
  const head = TL.x0 + (TL.x1 - TL.x0) * k;
  const dim = 1 - 0.62 * prog(f, dimAt, 14, ease.inOut);
  const stars = f < plenty + 6 ? 0 : countTo(f, plenty + 6, countEnd - plenty - 6, 0, STARS);
  const drift = 1 + 0.018 * prog(f, plenty + 22, 90, ease.linear); // the idle floor: the repo keeps settling in

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, opacity: dim }}>
        {/* the axis, drawn left to right, with an arrowhead riding its tip */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={TL.x0} y1={TL.y} x2={head} y2={TL.y} stroke={ground.ink} strokeWidth={5} strokeLinecap="round" />
          {k > 0 && <path d={`M${head - 18} ${TL.y - 13} L${head + 2} ${TL.y} L${head - 18} ${TL.y + 13}`} fill="none" stroke={ground.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
        {k > 0 && <div style={{ position: "absolute", left: TL.x0 - 11, top: TL.y - 11, width: 22, height: 22, borderRadius: 99, background: ground.ink, ...pop(f, lineAt, { from: 0.2 }) }} />}

        {PINS.map((pin, i) => {
          const at = pinAt(i);
          if (f < at) return null;
          const x = TL.pins[i];
          const up = i !== 1; // cards alternate: above, below, above
          const stemP = arrive(f, at + 4, 12);
          const stemFrom = TL.y + (up ? -14 : 14);
          const stemTo = up ? TL.y - 40 : TL.y + 40;
          return (
            <React.Fragment key={pin.year}>
              <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
                <line x1={x} y1={stemFrom} x2={x} y2={stemFrom + (stemTo - stemFrom) * stemP} stroke={ground.ink} strokeWidth={4} strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", left: x - 15, top: TL.y - 15, width: 30, height: 30, borderRadius: 99, background: theme.roles.link, border: `5px solid ${ground.bg}`, boxSizing: "border-box", ...pop(f, at, { from: 0.3 }) }} />
              {/* the year sits on the other side of the axis from its card */}
              <div style={{ position: "absolute", left: x - 100, width: 200, top: up ? TL.y + 22 : TL.y - 64, textAlign: "center", fontFamily: theme.font.mono, fontSize: 36, fontWeight: 700, color: ground.ink, ...blurIn(f, at + 2, { dur: 8, rise: up ? 10 : -10 }) }}>
                {pin.year}
              </div>
              <Travel curve="measured" at={at} from="top" dist={up ? 160 : 120} dur={DROP} style={{ position: "absolute", left: x - TL.cardW / 2, ...(up ? { bottom: 1920 - (TL.y - 40) } : { top: TL.y + 40 }) }}>
                <PinCard pin={pin} />
              </Travel>
            </React.Fragment>
          );
        })}
      </div>

      <Travel curve="measured" at={plenty} from="bottom" dist={420} dur={22} style={{ position: "absolute", left: REPO.left, top: REPO.top }}>
        <div style={{ transform: `scale(${drift.toFixed(4)})`, transformOrigin: "50% 50%" }}>
          <RepoCard stars={stars} starGold={prog(f, countEnd - 2, 8, ease.linear)} />
        </div>
      </Travel>
    </div>
  );
};
