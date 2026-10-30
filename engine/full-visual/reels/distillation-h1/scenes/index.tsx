// distillation-us with hook variant X1; every other scene is the same file as distillation-us
import type { SceneMap } from "../../../src/engine/Stage";
import { scenes as base } from "../../distillation-us/scenes";
import { HookX1 } from "../../distillation-us/scenes/HookX1";

export const scenes: SceneMap = { ...base, hook: HookX1 };
