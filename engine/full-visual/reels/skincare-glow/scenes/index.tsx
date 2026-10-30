// Mapa de las 8 escenas confortables de skincare-glow en español.
import type { SceneMap } from "../../../src/engine/Stage";
import { Hook } from "./Hook";
import { Cleanser } from "./Cleanser";
import { Niacinamide } from "./Niacinamide";
import { Spf } from "./Spf";
import { Retinol } from "./Retinol";
import { Barrier } from "./Barrier";
import { Turn } from "./Turn";
import { Cta } from "./Cta";

export const scenes: SceneMap = {
  hook: Hook,
  cleanser: Cleanser,
  niacinamide: Niacinamide,
  spf: Spf,
  retinol: Retinol,
  barrier: Barrier,
  turn: Turn,
  cta: Cta,
};
