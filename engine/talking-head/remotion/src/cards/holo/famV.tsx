import type React from "react";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import type { CardProps } from "../props";
import { DnaScan } from "./V-scan";
import { WebFold } from "./V-fold";
import { PromptLink } from "./V-prompt";
// reference edit K v3 (2026-09-24): hook-1 variant visuals, builder V. Window 1974 -> 4237 (YOU .. own).
// holo-v-dnascan (h1v03): the SKIMS photo is scanned and its brand pieces lift into a constellation.
// holo-v-webfold (h1v04): a store page folds away and its pieces re-assemble into three SKIMS ads.
// holo-v-promptlink (h1v05): a retyped prompt piles up slop; one link dropped into Holo yields one real ad.
loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] });

const Scan: React.FC<CardProps & { data: any }> = ({ tMs, fps, toMs, beats, assets }) =>
  <DnaScan t={tMs} fps={fps} toMs={toMs} beats={beats} assets={assets} />;
const Fold: React.FC<CardProps & { data: any }> = ({ tMs, fps, toMs, beats, assets }) =>
  <WebFold t={tMs} fps={fps} toMs={toMs} beats={beats} assets={assets} />;
const Link: React.FC<CardProps & { data: any }> = ({ tMs, fps, toMs, beats, assets }) =>
  <PromptLink t={tMs} fps={fps} toMs={toMs} beats={beats} assets={assets} />;

export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "holo-v-dnascan": Scan,
  "holo-v-webfold": Fold,
  "holo-v-promptlink": Link,
};
