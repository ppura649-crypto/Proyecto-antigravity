// Mapa completo de las 8 escenas descriptivas en español con ilustraciones realistas.
import type { SceneMap } from "../../../src/engine/Stage";
import { Hook } from "./Hook";
import { Origin } from "./Origin";
import { Angle } from "./Angle";
import { Dust } from "./Dust";
import { Blackout } from "./Blackout";
import { Spring } from "./Spring";
import { Turn } from "./Turn";
import { Cta } from "./Cta";

export const scenes: SceneMap = {
  hook: Hook,
  origin: Origin,
  angle: Angle,
  dust: Dust,
  blackout: Blackout,
  spring: Spring,
  turn: Turn,
  cta: Cta,
};
