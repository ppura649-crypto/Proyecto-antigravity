import React from "react";
import type { CardProps } from "../props";
import { HoloPlanCard } from "./B-plan";
import { BOTTOM, calm, clamp, easeIn, win } from "./D-kit";
// B20 "and adapts the campaign throughout": the B5/B6 plan card comes back, settled (flag on day 30),
// and on ADAPTS one week block slides out and a new one slides in (builder B's `data.swap`).

type Data = { swap: { lane: number; week: number } };

/** Every plan stage placed well before `at`, so the card mounts settled (springs stay short to compute). */
export const settledPlan = (at: number) => ({
  title: at - 5000, goal: at - 4700, fill: at - 4200, days: at - 3600, build: at - 3000, plan: at - 2400,
});

export const HoloPlanAdapt: React.FC<CardProps & { data: Data }> = ({ tMs, w, h, fps, fromMs, toMs, beats, assets, data }) => {
  const e = calm(tMs, fromMs, 380);
  const x = easeIn(win(tMs, toMs - 180, toMs));
  const k = (tMs - fromMs) / 1000;
  const push = 1 + 0.03 * clamp(k / 1.7);
  const tr = `translateY(${-BOTTOM + 16 + (1 - e) * -100 - x * 50}px) scale(${push})`
    + ` rotateY(${Math.sin(k * 0.6) * 1.2}deg)`;
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1700 }}>
      <div style={{ position: "absolute", inset: 0, transform: tr, transformOrigin: "50% 100%", opacity: clamp(e * 1.5) * (1 - x) }}>
        <HoloPlanCard tMs={tMs} w={w} h={h} fps={fps} beats={settledPlan(fromMs)} mark={assets[0]}
          data={{ swap: { atMs: beats.adapts, lane: data.swap.lane, week: data.swap.week } }} />
      </div>
    </div>
  );
};
