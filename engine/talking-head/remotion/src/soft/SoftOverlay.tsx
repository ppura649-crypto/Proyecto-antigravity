import React from "react";
import { useVideoConfig } from "remotion";
import { Finder, Chapter, Keyword } from "./Objects";
import { Rules, Shrink, Prompt, Stats, Doc } from "./Bars";
import { Chat, Hooks, type Bubble } from "./Chat";
import { Editorial, Proof } from "./Editorial";
import { Clip, Screen, Chart, Thumbs, Split } from "./Real";
import type { Box } from "./tokens";

// The Creator Format 2 visual layer. Every event is one of her families (formats/creator-format-2-visuals.md)
// planned fresh against the transcript; several may be up at once only as her allowed stacks
// (a chapter title above a card). Times are spine ms; `blur: true` asks CaptionReel for the
// whole-frame blur under proof cards. Cut in, cut out: nothing here animates an exit.

export type SoftEvent = {
  id: string;
  kind: "finder" | "rules" | "doc" | "chapter" | "chat" | "keyword" | "proof" | "stats" | "editorial" | "shrink" | "prompt" | "hooks" | "clip" | "screen" | "chart" | "thumbs" | "split";
  fromMs: number;
  toMs: number;
  blur?: boolean;
  box?: Box;
  beats?: Record<string, number>;
  asset?: string; // public-relative, prefixed by render.mjs
  assetW?: number;
  assetH?: number;
  data?: Record<string, unknown>;
};

export const SoftOverlay: React.FC<{ events: SoftEvent[]; tMs: number; video?: string }> = ({ events, tMs, video }) => {
  const { fps, width: W, height: H } = useVideoConfig();
  const active = events.filter((e) => tMs >= e.fromMs && tMs < e.toMs);
  return (
    <>
      {active.map((ev) => {
        const base = { tMs, fps, W, H, fromMs: ev.fromMs, toMs: ev.toMs, beats: ev.beats ?? {} };
        const d = (ev.data ?? {}) as Record<string, never>;
        switch (ev.kind) {
          case "finder":
            return <Finder key={ev.id} {...base} title={d.title} folders={d.folders} box={ev.box} />;
          case "rules":
            return <Rules key={ev.id} {...base} left={d.left} initial={d.initial} adds={d.adds} box={ev.box} />;
          case "doc":
            return <Doc key={ev.id} {...base} left={d.left} right={d.right} rows={d.rows} />;
          case "chapter":
            return <Chapter key={ev.id} {...base} eyebrow={d.eyebrow} title={d.title} y={d.y} />;
          case "chat":
            return <Chat key={ev.id} {...base} label={d.label} bubbles={d.bubbles as Bubble[]} box={ev.box} />;
          case "keyword":
            return <Keyword key={ev.id} {...base} eyebrow={d.eyebrow} word={d.word} />;
          case "proof":
            return <Proof key={ev.id} {...base} heading={d.heading} asset={ev.asset!} assetW={ev.assetW ?? 1560} scroll={d.scroll} zoom={d.zoom} />;
          case "stats":
            return <Stats key={ev.id} {...base} left={d.left} right={d.right} row1={d.row1} v1a={d.v1a} v1b={d.v1b} row2={d.row2} v2={d.v2} />;
          case "editorial":
            return <Editorial key={ev.id} {...base} eyebrow={d.eyebrow} head={d.head} word={d.word} copy={d.copy} panel={d.panel} rows={d.rows} />;
          case "shrink":
            return <Shrink key={ev.id} {...base} left={d.left} count={d.count} />;
          case "prompt":
            return <Prompt key={ev.id} {...base} left={d.left} fail={d.fail} />;
          case "hooks":
            return <Hooks key={ev.id} {...base} left={d.left} right={d.right} rows={d.rows} />;
          case "clip":
            return <Clip key={ev.id} {...base} asset={ev.asset!} box={ev.box} startMs={d.startMs} radius={d.radius} />;
          case "screen":
            return <Screen key={ev.id} {...base} asset={ev.asset!} assetW={ev.assetW ?? 1560} box={ev.box} scroll={d.scroll} zoom={d.zoom} popIn={d.popIn} radius={d.radius} highlight={d.highlight} />;
          case "chart":
            return <Chart key={ev.id} {...base} asset={ev.asset!} assetW={ev.assetW ?? 1560} assetH={ev.assetH ?? 1000} heading={d.heading} box={ev.box} />;
          case "split":
            return <Split key={ev.id} {...base} asset={ev.asset!} assetW={ev.assetW ?? 1080} video={video ?? ""} seam={d.seam} faceTop={d.faceTop} startMs={d.startMs} scroll={d.scroll} highlight={d.highlight} />;
          case "thumbs":
            return <Thumbs key={ev.id} {...base} assets={d.assets} box={ev.box} stagger={d.stagger} ratio={d.ratio} cols={d.cols} radius={d.radius} shadow={d.shadow} />;
          default:
            return null;
        }
      })}
    </>
  );
};
