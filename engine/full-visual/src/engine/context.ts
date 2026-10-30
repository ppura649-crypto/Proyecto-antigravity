import { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";
import type { Ground, Theme } from "../theme";
import type { Scene, Timeline } from "./timeline";

export type ReelCtx = { theme: Theme; tl: Timeline };
export const ReelContext = createContext<ReelCtx | null>(null);
export const SceneContext = createContext<Scene | null>(null);

export function useReel(): ReelCtx {
  const c = useContext(ReelContext);
  if (!c) throw new Error("useReel outside <Reel>");
  return c;
}

// What a scene component works with. Frames are absolute reel frames, so a cue is directly comparable to `f`.
export function useScene() {
  const { theme, tl } = useReel();
  const scene = useContext(SceneContext);
  if (!scene) throw new Error("useScene outside a scene");
  const f = useCurrentFrame();
  const ground: Ground = theme.grounds[scene.ground];
  return {
    f,
    fps: tl.fps,
    theme,
    ground,
    scene,
    /** frame at which the word starts being said (within this scene) */
    cue: (token: string, nth = 1) => tl.cue(token, nth, scene.index),
    /** frame at which the word has been said */
    cueEnd: (token: string, nth = 1) => tl.cueEnd(token, nth, scene.index),
    /** start frame of a build of `dur` frames that must FINISH as the word starts */
    endsOn: (token: string, dur: number, nth = 1) => tl.cue(token, nth, scene.index) - dur,
  };
}
