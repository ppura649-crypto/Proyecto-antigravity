import React from "react";
import type { CardProps } from "../props";
import { CH, CW } from "./R-util";
import { RollToHooks } from "./R-roll";
import { BeatMontage } from "./R-beats";
import { PageFold } from "./R-fold";
// keyframes-v1 family R (builder R, 2026-09-25): V8 kf-r-hooks, V9 kf-r-montage, V10 kf-r-demofold. LOW band.

const Box: React.FC<{ w: number; h: number; children: React.ReactNode }> = ({ w, h, children }) => (
  <div style={{ position: "absolute", left: (w - CW) / 2, top: (h - CH) / 2, width: CW, height: CH }}>{children}</div>
);
const Hooks: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, toMs, beats, assets }) =>
  <Box w={w} h={h}><RollToHooks t={tMs} fps={fps} toMs={toMs} beats={beats} assets={assets} /></Box>;
const Montage: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, toMs, beats, assets }) =>
  <Box w={w} h={h}><BeatMontage t={tMs} fps={fps} toMs={toMs} beats={beats} assets={assets} /></Box>;
const DemoFold: React.FC<CardProps & { data: any }> = ({ tMs, w, h, fps, toMs, beats, assets }) =>
  <Box w={w} h={h}><PageFold t={tMs} fps={fps} toMs={toMs} beats={beats} assets={assets} /></Box>;

export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "kf-r-hooks": Hooks,
  "kf-r-montage": Montage,
  "kf-r-demofold": DemoFold,
};
