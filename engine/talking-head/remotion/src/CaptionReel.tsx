import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fitText } from "@remotion/layout-utils";
import { interpolate } from "remotion";
import { Overlay, type VisualEvent } from "./Overlay";
import { HookTitle, type TitleSpan, type TitleLogo } from "./HookTitle";
import { styleOf } from "./styles";
import { loadFont as loadMichroma } from "@remotion/google-fonts/Michroma";
import { loadFont as loadZenDots } from "@remotion/google-fonts/ZenDots";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { SoftOverlay, type SoftEvent } from "./soft/SoftOverlay";

loadMichroma();
loadZenDots();
loadInter();
loadNunito("normal", { weights: ["700", "800"], subsets: ["latin"] }); // Creator Format 2 title face
loadPlayfair("normal", { weights: ["400"], subsets: ["latin"] }); // Creator Format 2 chapter / editorial serif
loadPlayfair("italic", { weights: ["400"], subsets: ["latin"] });
loadSora("normal", { weights: ["700"], subsets: ["latin"] }); // their pick 2026-09-05 (after Kode Mono): "use Sora instead"

// Kode Mono, their pick 2026-09-05 ("let's use Kode Mono from now on"): not in this
// @remotion/google-fonts build, so the OFL TTFs are vendored in public/fonts and
// registered here. render.mjs / stills.mjs serve public/, so staticFile resolves.
import { continueRender as kmContinue, delayRender as kmDelay, staticFile as kmFile } from "remotion";
const kmHandle = kmDelay("Kode Mono");
Promise.all(
  ([["400", "fonts/KodeMono-400.ttf"], ["700", "fonts/KodeMono-700.ttf"]] as const).map(([weight, file]) => {
    const face = new FontFace("Kode Mono", `url(${kmFile(file)})`, { weight });
    return face.load().then((f) => (document.fonts as unknown as { add: (x: FontFace) => void }).add(f));
  }),
).then(() => kmContinue(kmHandle), () => kmContinue(kmHandle));

type BlockWord = { text: string; atMs: number };
type BlockLine = { size?: "s" | "m" | "h"; accent?: boolean; spread?: boolean; words: BlockWord[] };
export type Page = {
  type?: "word" | "block" | "title";
  variant?: "stack" | "heroTail";
  text?: string;
  hero?: string;
  fancy?: boolean;
  lines?: BlockLine[] | TitleSpan[][];
  tail?: { words: BlockWord[] }[];
  // title pages: the sentence on top during the first hook sentence (HookTitle)
  reveal?: "letters" | "words" | "none";
  revealMs?: number;
  logos?: TitleLogo[];
  look?: "plain" | "bubble" | "label";
  exit?: "cut" | "fade";
  // a hero lifted out of the caption line and hung above their head, in quotes:
  // the phrase the creator is telling you to type (the creator 2026-09-04: "we should have
  // when the creator says it \"use subagents\" on top of their head with \" \"")
  topFrac?: number;
  quote?: boolean;
  fontPx?: number;
  fromMs: number;
  toMs: number;
  grade: number;
};

export type CaptionStyle = {
  style?: string; // designed-layer look, see styles.ts (default Creator Format 1)
  fontFamily: string;
  accentFontFamily: string;
  fontWeight: number;
  fontSizePx: number;
  letterSpacingEm: number;
  fillColor: string;
  emphasisColor: string;
  accentColor?: string; // reference edit H (2026-09-12): one accent per reel; overrides the look's --accent so shipped kinds and sweeps wear the creator's colour
  emphasisGradient?: string; // CSS gradient for accent words (the creator 2026-09-05: the Claude orange as a light gradient); emphasisColor stays the flat fallback
  emphasisGradientFlowMs?: number; // keyframes-v1 (2026-09-25, "a fluid one"): the gradient drifts across the word, one period per this many ms; the gradient must repeat at 50% of its width
  textShadow: string;
  baselineYFrac: number;
  baselineEm: number;
  stackTopFrac?: number; // top of the hook stack; default is reference edit A's 0.555
  stackSpreadFrac?: number; // width a 2+ word small stack line spreads across; Creator Format 1 measured ~0.52W, legacy 0.74
  // the overlay band, measured per video: nothing above cardTopFrac (platform
  // chrome), cards bottom-anchored at cardBottomFrac, just on top of their head
  cardTopFrac?: number;
  cardBottomFrac?: number;
  // "bottom" is the law: overlays hang off the band's bottom edge, just on top
  // of their head. "top" is the pre-law behaviour kept ONLY so reference edit A (built
  // and approved against yFrac) re-renders exactly as it shipped.
  cardAnchor?: "top" | "bottom";
  uppercase?: boolean; // every word rendered uppercase, as it comes from the caption file
  ctaFlat?: boolean; // the CTA line wears the caption font, size and colour
  heroWidthFrac: number;
  heroMaxFontPx: number;
  titleTopFrac?: number;
  titleFontPx?: number;
  titleFancyScale?: number;
  titleLineGapPx?: number;
  titleFontFamily?: string; // default: the caption font
  titleWeight?: number;
  titleColor?: string;
  titleShadow?: string; // default: the caption shadow
  titleLineHeight?: number;
  refWidth: number;
};

export const CaptionReel: React.FC<{
  video: string;
  pages: Page[];
  style: CaptionStyle;
  durationMs: number;
  visuals?: { events: VisualEvent[] };
}> = ({ video, pages, style: st, visuals }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const scale = width / st.refWidth;
  const base = st.fontSizePx * scale;
  const title = pages.find((p) => p.type === "title" && t >= p.fromMs && t < p.toMs);
  const page = pages.find((p) => p.type !== "title" && t >= p.fromMs && t < p.toMs);

  const fam = (accent?: boolean) => (accent ? st.accentFontFamily : st.fontFamily);
  const fit = (text: string, accent?: boolean) =>
    Math.min(
      fitText({
        text,
        withinWidth: width * st.heroWidthFrac,
        fontFamily: fam(accent),
        fontWeight: String(st.fontWeight),
        letterSpacing: `${st.letterSpacingEm}em`,
      }).fontSize,
      st.heroMaxFontPx * scale
    );

  // a text-shadow under a gradient-filled (transparent) glyph shows through the glyph, so the
  // gradient words carry the same shadow as a drop-shadow filter on their alpha instead
  const dropShadow = (ts: string) =>
    ts.split(/\)\s*,\s*/).map((part) => part.trim()).filter(Boolean)
      .map((part) => `drop-shadow(${part}${part.endsWith(")") ? "" : ")"})`).join(" ");
  const wordCss = (size: number, accent: boolean, fancy?: boolean): React.CSSProperties => {
    const grad = accent && !fancy ? st.emphasisGradient : undefined;
    return {
      fontFamily: fam(accent),
      fontWeight: st.fontWeight,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: `${st.letterSpacingEm}em`,
      color: accent ? st.emphasisColor : st.fillColor,
      textShadow: grad ? "none" : st.textShadow,
      textTransform: st.uppercase ? "uppercase" : undefined,
      whiteSpace: "pre",
      ...(grad ? {
        backgroundImage: grad,
        ...(st.emphasisGradientFlowMs ? { backgroundSize: "200% 100%", backgroundPosition: `${((t / st.emphasisGradientFlowMs) * 100) % 100}% 0` } : {}),
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        filter: dropShadow(st.textShadow),
      } : {}),
    };
  };

  const baselineTop = (size: number) => st.baselineYFrac * height - st.baselineEm * size;

  let titleEl: React.ReactNode = null;
  if (title) {
    titleEl = (
      <HookTitle
        tMs={t} fps={fps} width={width} height={height}
        fromMs={title.fromMs} toMs={title.toMs}
        lines={title.lines as TitleSpan[][]}
        reveal={title.reveal} revealMs={title.revealMs} logos={title.logos} look={title.look}
        exit={title.exit} lineHeight={st.titleLineHeight}
        topFrac={title.topFrac ?? st.titleTopFrac ?? 0.14}
        fontPx={title.fontPx ?? st.titleFontPx ?? 54}
        fancyScale={st.titleFancyScale ?? 1.15} lineGapPx={st.titleLineGapPx ?? 8}
        fontFamily={st.titleFontFamily ?? st.fontFamily} fancyFontFamily={st.accentFontFamily}
        weight={st.titleWeight ?? st.fontWeight} color={st.titleColor ?? st.fillColor}
        shadow={st.titleShadow ?? st.textShadow}
      />
    );
  }

  // the designed-layer style: tokens for the cards, and the talking head blurring behind a card
  // (per event when the style says so; Creator Format 2 switches hard and darkens, see styles.ts)
  const look = styleOf(st.style);
  // her layer stacks a chapter title over a card, so the blur follows any active event that asks
  const activeAll = visuals?.events.filter((e) => t >= e.fromMs && t < e.toMs) ?? [];
  const activeEv = activeAll.find((e) => e.blur) ?? activeAll[0];
  const wantsBlur = activeEv
    ? activeEv.blur ?? (look.blurDefault !== false && activeEv.kind !== "cta" && activeEv.kind !== "float")
    : false;
  const blurs = look.blurBehind > 0 && wantsBlur;
  const ramp = look.blurRampMs ?? 220;
  const blurPx = !blurs ? 0 : ramp <= 0 ? look.blurBehind
    : interpolate(t, [activeEv!.fromMs, activeEv!.fromMs + ramp], [0, look.blurBehind], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bright = blurs && look.blurBrightness ? ` brightness(${look.blurBrightness})` : "";

  let el: React.ReactNode = null;
  if (page?.type === "block" && page.variant === "heroTail") {
    const hs = fit(page.hero!, true);
    el = (
      <>
        <div
          style={{
            position: "absolute",
            top: baselineTop(hs),
            left: 0,
            width: "100%",
            textAlign: "center",
            ...wordCss(hs, true, page.fancy),
          }}
        >
          {page.hero}
        </div>
        <div
          style={{
            position: "absolute",
            top: st.baselineYFrac * height + 34 * scale,
            left: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12 * scale,
          }}
        >
          {page.tail!.map((ln, i) => (
            <div key={i} style={{ display: "flex", gap: "0.3em", ...wordCss(base, false) }}>
              {ln.words.map((w, j) => (
                <span key={j} style={{ visibility: t >= w.atMs ? "visible" : "hidden" }}>
                  {w.text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </>
    );
  } else if (page?.type === "block" && page.variant === "stack") {
    el = (
      <div
        style={{
          position: "absolute",
          top: (st.stackTopFrac ?? 0.555) * height,
          left: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26 * scale,
        }}
      >
        {(page.lines as BlockLine[]).map((ln, i) => {
          const size = ln.size === "h" ? fit(ln.words.map((w) => w.text).join(" "), Boolean(ln.accent))
            : ln.size === "m" ? base * 1.25 : base;
          // small words spread to the hero width only when the system has a hero width
          // (a flat system, hero = base size, keeps its lines centred)
          const spread =
            ln.spread !== false && ln.words.length > 1 && (ln.size ?? "s") === "s" && st.heroMaxFontPx > st.fontSizePx;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: spread ? "space-between" : "center",
                gap: spread ? undefined : "0.35em",
                width: spread ? (st.stackSpreadFrac ?? 0.74) * width : undefined,
                ...wordCss(size, Boolean(ln.accent)),
              }}
            >
              {ln.words.map((w, j) => (
                <span key={j} style={{ visibility: t >= w.atMs ? "visible" : "hidden" }}>
                  {w.text}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    );
  } else if (page) {
    const hero = page.grade === 2;
    const size = page.fontPx ? page.fontPx * scale : hero ? fit(page.text!, true) : base;
    const shown = page.quote ? `\u201C${page.text}\u201D` : page.text;
    el = (
      <div
        style={{
          position: "absolute",
          top: page.topFrac !== undefined ? page.topFrac * height : baselineTop(size),
          left: 0,
          width: "100%",
          textAlign: "center",
          ...wordCss(size, page.grade > 0, hero && page.fancy),
        }}
      >
        {shown}
      </div>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "black", ["--reel-font" as string]: st.fontFamily, ...look.vars, ...(st.accentColor ? { ["--accent" as string]: st.accentColor } : {}) } as React.CSSProperties}>
      <OffthreadVideo
        src={staticFile(video)}
        style={blurPx > 0 ? { filter: `blur(${blurPx}px)${bright}`, transform: `scale(${1 + blurPx / 300})` } : undefined}
      />
      {/* the title sits under the cards: they cut in over it and it shows again in the gaps */}
      {titleEl}
      {visuals && look.overlay === "soft" ? (
        <SoftOverlay events={visuals.events as unknown as SoftEvent[]} tMs={t} video={video} />
      ) : visuals ? (
        <Overlay events={visuals.events} tMs={t} captionStyle={st} />
      ) : null}
      {el}
    </AbsoluteFill>
  );
};
