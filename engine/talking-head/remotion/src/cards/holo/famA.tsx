import type React from "react";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import type { CardProps } from "../props";
import { Wall } from "./A-wall";
import { type Swatch } from "./A-kit";
import { OwnSurface, surfaceTransform } from "./A-own";
import { TitleCard } from "./A-title";
import { SlopPile } from "./A-pile";
import { Feed, feedPhotoRect } from "./A-feed";
import { B0, type Beats } from "./A-util";
import { Hook2 } from "./A-same";
import { Hook3 } from "./A-advice";
// reference edit K (Holo) family A (2026-09-23): hook 1, 0 -> 6000 ms. One continuous object across chained
// events (slop wall -> flip wave -> living real wall -> own-brand surface), so each kind name is the same
// component reading the spine clock; the events chain by `callback` so Overlay never re-pops the card.
// v2 (2026-09-24): own + blank prompt are ONE surface 4237 -> 6000 (A-own): the kit builds and stays, the
// empty box joins it on NOT and greys out. `fresh` (h1t): the real wall deals in at that ms, no slop before.
loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] });

// swatches sampled off skims-3755019.jpg with PIL (median of a patch), 2026-09-23
const SWATCHES: Swatch[] = [
  { hex: "#dfd9cb", px: [90, 300] },   // stone wall
  { hex: "#eccecc", px: [450, 860] },  // blush bodysuit
  { hex: "#ac6b4b", px: [450, 1225] }, // warm skin
  { hex: "#2f2921", px: [450, 468] },  // hair, near-black
];

// variant (v6, 2026-09-24): "pile" = the slop pile swept off on THE, the real wall deals in (data.deal);
// "feed" = the IG feed of slop that refreshes into SKIMS; none = the v5 slop wall / flip wave (h1t: data.fresh)
const Hook1: React.FC<CardProps & { data: any }> = ({ tMs, fps, beats, assets, data }) => {
  const b: Beats = { ...B0, ...(beats as Partial<Beats>) };
  const sw: Swatch[] = data?.swatches ?? SWATCHES;
  const t = tMs;
  const feed = data?.variant === "feed", solo = data?.variant === "solo";
  const st = t >= b.own ? surfaceTransform(t, b) : { transform: "none", opacity: 1 };
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1400 }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: "540px 347px", ...st }}>
        {solo ? null : feed ? <Feed t={t} fps={fps} b={b} assets={assets} />
          : <Wall t={t} fps={fps} assets={assets} b={b} fresh={data?.fresh} deal={data?.deal} />}
        {data?.variant === "pile" && <SlopPile t={t} fps={fps} b={b} assets={assets} />}
        <OwnSurface t={t} fps={fps} b={b} assets={assets} sw={sw} from={feed ? feedPhotoRect(b) : undefined}
          solo={solo} />
      </div>
    </div>
  );
};

// hooks 2 and 3 (2026-09-24): the same one-component-per-hook pattern; swatches come from the event data
const Hook2Card: React.FC<CardProps & { data: any }> = ({ tMs, fps, assets, data }) =>
  <Hook2 t={tMs} fps={fps} assets={assets} sw={data?.swatches ?? []} />;
const Hook3Card: React.FC<CardProps & { data: any }> = ({ tMs, fps, assets, data }) =>
  <Hook3 t={tMs} fps={fps} assets={assets} sw={data?.swatches ?? []} />;

export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  "holo-slopwall": Hook1, "holo-flipwave": Hook1, "holo-realwall": Hook1,
  "holo-ownbrand": Hook1, "holo-blankprompt": Hook1,
  "holo-a-slop-pile": Hook1, "holo-a-feed": Hook1,
  "holo-a-titlecard": TitleCard,
  "holo-samegrey": Hook2Card, "holo-stepout": Hook2Card, "holo-crocshold": Hook2Card,
  "holo-crocskit": Hook2Card, "holo-blankprompt2": Hook2Card,
  "holo-advice": Hook3Card, "holo-slopad": Hook3Card, "holo-tryon": Hook3Card,
  "holo-skimskit": Hook3Card, "holo-blankprompt3": Hook3Card,
};
