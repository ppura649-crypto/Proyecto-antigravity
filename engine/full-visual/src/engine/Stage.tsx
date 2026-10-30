// Scenes never cut. A scene leaves as one block inside the silence before the next scene's first word, and the next
// one is already mounted while it goes, so the ground is never bare. What is inside a scene enters by its own cues.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SceneContext, useReel } from "./context";
import { ease, leaveEase, prog } from "./moves";

export type SceneMap = Record<string, React.FC>;

const OUT = 9; // frames the outgoing scene takes to leave (rise)
const OUT_M = 11; // measured: the lift-off is 10-12 frames, displacement x 1.45 every frame, off the top
const LIFT = 2000; // measured: the stage leaves the frame, it does not shrink or dissolve in place
const SCROLL = 13; // frames for a whole-stage scroll
export const LEAD = 6; // a scene is mounted this early: start its first entrance at scene.from - LEAD and the ground is never bare

export const Stage: React.FC<{ scenes: SceneMap }> = ({ scenes }) => {
  const { theme, tl } = useReel();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {tl.scenes.map((s) => {
        const Comp = scenes[s.id];
        const last = s.index === tl.scenes.length - 1;
        const meas = theme.motion === "measured" && theme.handover !== "scroll";
        const outDur = meas ? OUT_M : OUT;
        const leaveAt = s.to - (theme.handover === "scroll" ? Math.floor(SCROLL / 2) : outDur - 4);
        const gone = last ? Infinity : leaveAt + (theme.handover === "scroll" ? SCROLL : outDur);
        const mountAt = s.index === 0 ? 0 : s.from - (theme.handover === "scroll" ? Math.floor(SCROLL / 2) : LEAD);
        // a scene component with `keep = true` hands over in place: the next scene starts on the very same picture
        // (a shared continuous world), so it is not lifted off; it simply stops drawing once the next one is mounted
        const keep = !!(Comp as unknown as { keep?: boolean } | undefined)?.keep && !last;
        if (!Comp || f < mountAt || f >= (keep ? s.to - LEAD : gone)) return null;
        let style: React.CSSProperties = {};
        let smear = 0;
        if (keep) {
          style = {};
        } else if (theme.handover === "scroll") {
          // old card leaves through the top, new one rises from below, as one 220 ms move
          const yAt = (fr: number) =>
            (s.index === 0 ? 0 : (1 - prog(fr, mountAt, SCROLL, ease.inOut)) * 1500) - (last ? 0 : prog(fr, leaveAt, SCROLL, ease.inOut) * 1500);
          const y = yAt(f);
          const v = Math.abs(y - yAt(f - 1));
          style = { transform: `translateY(${y.toFixed(1)}px)`, filter: v > 2 ? `blur(${Math.min(18, v * 0.12).toFixed(1)}px)` : undefined };
        } else if (meas && !last) {
          // the measured lift-off: it hangs, then whips out of the top under a vertical smear, at full opacity.
          // No scale and no dissolve in place; the frame is never left holding a half-faded scene.
          // The smear has to be an SVG filter: CSS blur() is isotropic and takes one radius, so a directional
          // one cannot be written as blur(0px Npx) (that is invalid and silently drops).
          const p = prog(f, leaveAt, outDur, leaveEase(outDur));
          const q = prog(f - 1, leaveAt, outDur, leaveEase(outDur));
          smear = Math.min(46, ((p - q) * LIFT) * 0.16);
          style = {
            transform: `translateY(${(-LIFT * p).toFixed(1)}px)`,
            // it goes while it is fastest and most smeared, so no readable ghost is ever left over the caption
            opacity: 1 - prog(f, leaveAt + outDur - 5, 5, ease.linear),
            filter: smear > 0.5 ? `url(#lift-${s.id})` : undefined,
          };
        } else if (!last) {
          const p = prog(f, leaveAt, OUT, ease.in);
          style = { transform: `translateY(${(-140 * p).toFixed(1)}px) scale(${1 - 0.04 * p})`, opacity: 1 - p, filter: p > 0 ? `blur(${(p * 16).toFixed(1)}px)` : undefined };
        }
        return (
          <SceneContext.Provider key={s.id} value={s}>
            {smear > 0.5 && (
              <svg width="0" height="0" style={{ position: "absolute" }}>
                <filter id={`lift-${s.id}`} x="-10%" y="-60%" width="120%" height="220%">
                  <feGaussianBlur stdDeviation={`0 ${smear.toFixed(2)}`} />
                </filter>
              </svg>
            )}
            <AbsoluteFill style={style}>
              <Comp />
            </AbsoluteFill>
          </SceneContext.Provider>
        );
      })}
    </AbsoluteFill>
  );
};

/** the centred column every scene builds in */
export const Column: React.FC<{ children: React.ReactNode; width?: number }> = ({ children, width }) => {
  const { theme } = useReel();
  const w = width ?? theme.stage.width;
  return <div style={{ position: "absolute", left: (1080 - w) / 2, width: w, top: 0, height: 1920 }}>{children}</div>;
};
