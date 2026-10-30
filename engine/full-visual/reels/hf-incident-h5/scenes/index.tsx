// hf-incident with hook variant 5 (the ring); every other scene is the same file as hf-incident
import type { SceneMap } from "../../../src/engine/Stage";
import { scenes as base } from "../../hf-incident/scenes";
import { HookV5 } from "../../hf-incident/scenes/HookV5";

export const scenes: SceneMap = { ...base, hook: HookV5 };
