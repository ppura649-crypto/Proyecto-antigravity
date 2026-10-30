// Visual styles for the designed layer. A style is DATA: the CSS tokens the cards read
// (cards/theme.ts), the frame Overlay draws around a card, and how much the talking head
// blurs while a card is up. `creator-format-1` is the reference look of reference edit A and never changes;
// a new look is a new entry here, picked per video with `"style": "<id>"` in format.json.
// Catalogue and reference frames: library/styles/README.md.

export type Frame = {
  radius: number; // px at 1080 wide
  bg: string;
  border: string; // CSS border, "none" for Creator Format 1
  shadow: string;
  backdrop?: string; // backdrop-filter, glass only
  pad?: number; // inner inset for a white picture frame around a shot
};

export type ReelStyle = {
  id: string;
  vars: Record<string, string>; // --ink --muted --accent --bar-grey --card-bg --label-font --label-tracking
  card: Frame; // designed card, dark
  cardLight: Frame; // designed card, light (frame: "light")
  shot: Frame; // screenshot card, light page
  shotDark: Frame; // screenshot card, dark page
  blurBehind: number; // px of blur on the talking head while a card is up, 0 = never
  blurBrightness?: number; // the footage also darkens under the blur (Creator Format 2 0.75)
  blurRampMs?: number; // 0 = hard one-frame switch; default a 220 ms ramp
  blurDefault?: boolean; // false = only events with `blur: true` blur; default every card
  enter?: Enter; // measured entrances; undefined = the Creator Format 1 spring pop
  overlay?: "soft"; // which visual layer draws the events: her families (src/soft) or their cards (Overlay)
};

// how a card arrives: designed cards fade in place, real media pops from a scale
export type Enter = { fadeFrames: number; popFrames: number; popFrom: number };

const CF1_SHADOW = "0 10px 30px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.25)";
const SOFT_SHADOW = "0 20px 50px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.18)";

export const STYLES: Record<string, ReelStyle> = {
  // reference edit A: square black cards, white ink, terracotta accent, no blur, hard pop.
  "creator-format-1": {
    id: "creator-format-1",
    vars: {},
    card: { radius: 0, bg: "#08080a", border: "none", shadow: "0 10px 30px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)" },
    cardLight: { radius: 0, bg: "#ffffff", border: "none", shadow: CF1_SHADOW },
    shot: { radius: 0, bg: "#fefefe", border: "none", shadow: CF1_SHADOW },
    shotDark: { radius: 0, bg: "#0d1117", border: "none", shadow: CF1_SHADOW },
    blurBehind: 0,
  },
  // Creator Format 2, measured frame by frame on ten reels (library/styles/refs/<code>/,
  // formats/creator-format-2-*.md, 2026-09-04): a glass panel is white at 12 % over the footage with a
  // backdrop blur, a 1 px white hairline at 50 %, radius 30-34, a wide soft shadow; labels are
  // tracked uppercase in a grotesque; light cards are off-white #eaf0ee; real media sits in a
  // rounded white frame. One accent per reel: their terracotta, because their real artifacts (the
  // pattern PNG, the terminal sweep) already carry it and a second warm tone made two. Footage blur is an opt-in per event (`blur: true`): Gaussian
  // 12 px + brightness 0.75, a hard one-frame switch. Cards fade in place over 4 frames, real
  // media pops 3 frames from 0.85, everything leaves on a cut. Ink is white because their room
  // is dark (her charcoal labels sit on a light wall; her dark-glass chat uses white).
  "creator-format-2": {
    id: "creator-format-2",
    vars: {
      "--card-bg": "rgba(255,255,255,0.12)",
      "--ink": "#ffffff",
      "--muted": "rgba(255,255,255,0.72)",
      "--accent": "#e07850",
      "--bar-grey": "rgba(255,255,255,0.32)",
      "--label-font": "Inter, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
      "--label-tracking": "0.14em",
      "--block-bg": "rgba(255,255,255,0.14)",
    },
    card: { radius: 32, bg: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.5)", shadow: SOFT_SHADOW, backdrop: "blur(24px)" },
    cardLight: { radius: 28, bg: "#eaf0ee", border: "none", shadow: SOFT_SHADOW },
    shot: { radius: 30, bg: "#f3fbfd", border: "none", shadow: SOFT_SHADOW, pad: 8 },
    shotDark: { radius: 30, bg: "#0d1117", border: "1px solid rgba(255,255,255,0.22)", shadow: SOFT_SHADOW },
    blurBehind: 12,
    blurBrightness: 0.75,
    blurRampMs: 0,
    blurDefault: false,
    enter: { fadeFrames: 4, popFrames: 3, popFrom: 0.85 },
    // her visual layer: the card families in src/soft/, drawn from scratch (2026-09-04, after
    // the first try only re-skinned their cards through the tokens above and was rejected)
    overlay: "soft",
  },
};

// Ids saved before the rename still resolve to the same look.
const OLD_IDS: Record<string, string> = { chris: "creator-format-1", softgirl: "creator-format-2" }; // legacy alias
export const styleOf = (id?: string): ReelStyle => {
  const key = id && Object.prototype.hasOwnProperty.call(OLD_IDS, id) ? OLD_IDS[id] : id;
  return STYLES[key ?? "creator-format-1"] ?? STYLES["creator-format-1"];
};
