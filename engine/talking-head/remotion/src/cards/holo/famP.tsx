import type React from "react";
import type { CardProps } from "../props";
import { PlacedPlan, type PlanT } from "./P-card";
import { cellRect } from "./P-cal";
import { POSTS, SWAP } from "./P-kit";
import { PlanRecap } from "./P-recap";
// reference edit K v2 (2026-09-24): the plan family, rows B5 goal, B6 plan calendar, B20 adapts, B22 recap.
// v2 note: "make it more realistic, for the plan and ads etc... instead of bars colored". One real Holo surface:
// a chat answer with the goal, its channels and a date picker, which grows into the month's content calendar
// with real SKIMS / Crocs posts on their days (B6), comes back to swap a post (B20), and joins the recap (B22).
type K = React.FC<CardProps & { data: any }>;

// B5 + B6 are one chain (b6 is a callback of b5): the same card, one clock
const planT = (b: Record<string, number>, enter: number): PlanT => ({
  enter,
  header: b.recommends ?? 12593,
  words: [(b.recommends ?? 12593) + 60, b.goalTyped ?? 13300],
  chips: b.goal ?? 13253,
  cal: b["30"] ?? 13853,
  sweep: [(b["30"] ?? 13853) + 50, b.days ?? 14093],
  flag: b.days ?? 14093,
  grow: [b.grow ?? 14450, (b.grow ?? 14450) + 270],
  posts: b.build ?? 14640,
});

const Goal: K = ({ tMs, w, h, beats, assets, data }) => (
  <PlacedPlan tMs={tMs} w={w} h={h} T={planT(beats, data?.enterMs ?? 12100)} exitAt={data?.exitMs ?? 15867} assets={assets} />
);

// B20: the calendar arrives already filled; on ADAPTS one post is tagged "Low reach", greys out and a new
// creative flips into its day. A slow push centred on that day.
const Adapt: K = ({ tMs, w, h, fromMs, toMs, beats, assets }) => {
  const at = fromMs;
  const T: PlanT = {
    enter: at, header: at - 6000, words: [at - 6000, at - 5900], chips: at - 5800, cal: at - 5600,
    sweep: [at - 5500, at - 5400], flag: at - 5300, grow: [at - 5000, at - 4700], posts: at - 4500,
    swap: beats.adapts ?? 39810,
  };
  const p = POSTS[SWAP.index]!, R = cellRect(p.r, p.c, 1);
  return <PlacedPlan tMs={tMs} w={w} h={h} T={T} exitAt={toMs} assets={assets} focus={{ x: R.x + R.w / 2, y: R.y + R.h / 2 }} />;
};

export const KINDS: Record<string, K> = {
  "holo-p-goal": Goal,
  "holo-p-calendar": Goal,
  "holo-p-adapt": Adapt,
  "holo-p-recap": PlanRecap,
};
