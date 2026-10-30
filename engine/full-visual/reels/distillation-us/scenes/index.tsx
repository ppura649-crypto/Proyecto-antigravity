// Scene id (caption.txt) -> component. The plan is plan.md; what the scenes share is parts.tsx.
import type { SceneMap } from "../../../src/engine/Stage";
import { Hook } from "./Hook";
import { Report } from "./Report";
import { Distill } from "./Distill";
import { Weights } from "./Weights";
import { Inside } from "./Inside";
import { Training } from "./Training";
import { Catch } from "./Catch";
import { Thinking } from "./Thinking";
import { Limits } from "./Limits";
import { Cta } from "./Cta";

export const scenes: SceneMap = {
  hook: Hook,
  report: Report,
  distill: Distill,
  weights: Weights,
  inside: Inside,
  training: Training,
  catch: Catch,
  thinking: Thinking,
  limits: Limits,
  cta: Cta,
};
