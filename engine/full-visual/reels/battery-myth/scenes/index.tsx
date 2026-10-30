import type { SceneMap } from "../../../src/engine/Stage";
import { Hook } from "./Hook";
import { Origin } from "./Origin";
import { Chip } from "./Chip";
import { Heat } from "./Heat";
import { Cycles } from "./Cycles";
import { Rule } from "./Rule";
import { Cta } from "./Cta";

export const scenes: SceneMap = {
  hook: Hook,
  origin: Origin,
  chip: Chip,
  heat: Heat,
  cycles: Cycles,
  rule: Rule,
  cta: Cta,
};
