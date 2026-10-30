// Scene id (caption.txt) -> component. The plan is plan.md; what the scenes share is parts.tsx.
import type { SceneMap } from "../../../src/engine/Stage";
import { HookV1 } from "./HookV1";
import { Report } from "./Report";
import { Locker } from "./Locker";
import { Why } from "./Why";
import { Out } from "./Out";
import { Power } from "./Power";
import { In } from "./In";
import { Weekend } from "./Weekend";
import { FileScene } from "./FileScene";
import { Template } from "./Template";
import { Fleet } from "./Fleet";
import { Logs } from "./Logs";
import { Caught } from "./Caught";
import { Scary } from "./Scary";
import { Cta } from "./Cta";

export const scenes: SceneMap = {
  hook: HookV1,
  report: Report,
  locker: Locker,
  why: Why,
  out: Out,
  power: Power,
  in: In,
  weekend: Weekend,
  file: FileScene,
  template: Template,
  fleet: Fleet,
  logs: Logs,
  caught: Caught,
  scary: Scary,
  cta: Cta,
};
