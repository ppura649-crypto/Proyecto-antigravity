// Every reel registers itself: the bundler finds each reels/<slug>/scenes/index.tsx and keys it by the folder name.
// Generated for the Keyframes folder, so a reel is its own folder and an update of the format never touches yours.
import type { SceneMap } from "../src/engine/Stage";

// @ts-ignore: require.context is the bundler's, not Node's
const found = require.context("./", true, /^\.\/[^/]+\/scenes\/index\.tsx$/);
export const reels: Record<string, SceneMap> = Object.fromEntries(
  (found.keys() as string[]).map((k) => [k.split("/")[1], (found(k) as { scenes: SceneMap }).scenes]),
);
