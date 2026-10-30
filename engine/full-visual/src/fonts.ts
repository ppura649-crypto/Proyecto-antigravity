// Fonts a theme may name. To use another face: load it here, then set theme.font in the reel's reel.json.
import { loadFont as figtree } from "@remotion/google-fonts/Figtree";
import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { loadFont as jetbrains } from "@remotion/google-fonts/JetBrainsMono";

const opts = { subsets: ["latin" as const] };
export const fontsReady = Promise.all([
  figtree("normal", { weights: ["400", "700"], ...opts }).waitUntilDone(),
  inter("normal", { weights: ["400", "500", "600", "700"], ...opts }).waitUntilDone(),
  jetbrains("normal", { weights: ["400", "700"], ...opts }).waitUntilDone(),
]);
