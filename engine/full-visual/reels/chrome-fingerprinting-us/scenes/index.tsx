// Scene id (caption.txt) -> component. The plan is plan.md; what the scenes share is parts.tsx.
import type { SceneMap } from "../../../src/engine/Stage";
import { Hook } from "./Hook";
import { Developer } from "./Developer";
import { Sound } from "./Sound";
import { Fingerprint } from "./Fingerprint";
import { Known } from "./Known";
import { Choose } from "./Choose";
import { Browsers } from "./Browsers";
import { ChromeVerdict } from "./ChromeVerdict";
import { Cta } from "./Cta";

export const scenes: SceneMap = {
  hook: Hook,
  developer: Developer,
  sound: Sound,
  fingerprint: Fingerprint,
  known: Known,
  choose: Choose,
  browsers: Browsers,
  chrome: ChromeVerdict,
  cta: Cta,
};
