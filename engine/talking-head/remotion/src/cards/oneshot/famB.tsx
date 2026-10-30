import React from "react";
import { Img, spring, staticFile } from "remotion";
import type { CardProps } from "../props";
import { LABEL_FONT } from "../theme";
import { BLUE, Chip, INK, chipFs, clamp01, landStyle } from "./shared";

// edit-h-oneshot, family B: the real pages on the white plate the Overlay draws.
//
//   pages     (V3) two real page clippings side by side, each under its real mark
//   pagesweep (V4) the callback: OpenAI slides out, Anthropic grows to the plate and one
//                  sentence takes a blue highlighter
//   paper     (V6) the arXiv abstract, recomposed to title + the lines that hold the result
//
// Every number below is a DEVICE PX on the shot itself (the three page PNGs are 960 px wide,
// a 480 CSS px viewport at DPR 2). They were measured by scanning the PNGs for ink rows and
// word gaps, not taken from the rects in visuals.json, which were a first guess: the page
// clip rects were off by 20-90 px (they cut the Anthropic date in and the OpenAI code block
// through the middle) and the two sentence rects did not reach the end of the sentence.
// What is drawn is always the real pixels; only the window on them is ours.

const SHOT_W = 960;
const POP = { damping: 14, stiffness: 300, mass: 0.7 } as const;

const sp = (tMs: number, at: number, fps: number): number =>
  spring({ frame: Math.max(0, ((tMs - at) / 1000) * fps), fps, config: POP });

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** smoothstep: eased at both ends but gentler than a cubic, the curve a page grows on */
const smooth = (t: number): number => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/** a hand dragging a marker: it is moving on the first frame, near constant, and it stops */
const marker = (t: number): number => {
  const x = clamp01(t);
  return 0.45 * (x * x * (3 - 2 * x)) + 0.55 * x;
};

// ─────────────────────────────────────────────────────────────────────────────
// the two shared pieces: a window on a real page, and a highlighter over its type

/** a window on the real shot, positioned by device px. The page is never rebuilt. */
const PageWindow: React.FC<{
  src: string; x: number; y: number; w: number; h: number;
  srcX: number; srcY: number; scale: number;
  style?: React.CSSProperties; children?: React.ReactNode;
}> = ({ src, x, y, w, h, srcX, srcY, scale, style, children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden", ...style }}>
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute", left: -srcX * scale, top: -srcY * scale,
        width: SHOT_W * scale, height: "auto", display: "block",
      }}
    />
    {children}
  </div>
);

/** one line of a sentence, in the shot's own device px */
type Seg = { x0: number; x1: number; top: number; h: number };

/** the blue highlighter: it runs left to right through the segments in order and stays lit. */
const Highlighter: React.FC<{
  segs: Seg[]; p: number; srcX: number; srcY: number; scale: number;
}> = ({ segs, p, srcX, srcY, scale }) => {
  const total = segs.reduce((a, g) => a + (g.x1 - g.x0), 0);
  const done = clamp01(p) * total;
  let before = 0;
  const rects = segs.map((g) => {
    const len = g.x1 - g.x0;
    const f = clamp01((done - before) / len);
    before += len;
    return { g, f };
  });
  return (
    <>
      {rects.map(({ g, f }, i) =>
        f <= 0 ? null : (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (g.x0 - srcX) * scale,
              top: (g.top - srcY) * scale,
              width: (g.x1 - g.x0) * f * scale,
              height: g.h * scale,
              backgroundColor: BLUE,
              opacity: 0.45,
              // a real highlighter sits UNDER the ink: multiply keeps the swept sentence the
              // blackest type on the page instead of washing it to grey
              mixBlendMode: "multiply",
            }}
          />
        )
      )}
    </>
  );
};

/** the real mark, bare: nothing behind it, ever. The wordmark rides a little shorter than the
 *  square knot so the two read at the same weight. */
const Mark: React.FC<{ src: string; boxW: number; boxH: number }> = ({ src, boxW, boxH }) => {
  const hh = /anthropic/i.test(src) ? 0.8 * boxH : boxH;
  return (
    <div style={{ width: boxW, height: boxH, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Img src={staticFile(src)} style={{ height: hh, width: "auto", display: "block" }} />
    </div>
  );
};

const Name: React.FC<{ text: string; fs: number }> = ({ text, fs }) => (
  <div style={{
    fontFamily: LABEL_FONT, fontWeight: 700, fontSize: fs, lineHeight: 1.3,
    letterSpacing: "0.09em", textTransform: "uppercase", color: INK, textAlign: "center",
  }}>
    {text}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// V3 + V4: the two pages, then the one page swept
//
// anthropic-480.png (960 x 4800), measured: title ink 802-938 (x 66-844), the deck paragraph
// 1031-1336 (x 65-853), the rule 1418, "Published Sep 29, 2025" 1480-1514. The date stays OUT
// of the window: the post is dated Sep 2025 and the chip above says 2 YEARS, so the two would
// argue with each other on screen.
// openai-480.png (960 x 2400), measured: "Prompt engineering" 417-473, the deck 505-596, the
// Copy Page button 626-651, the first paragraph 725-958, "Here's a simple example..." 1014-1043,
// the code block from 1117 (out: a window that ends inside it reads as a bug).

const PAIR = {
  SRC_X: 54, SRC_W: 816,      // x 54-870 clears the longest line on either page (OpenAI's, 864)
  LEFT_Y: 722, RIGHT_Y: 337,  // both titles start 80 device px below the window top
  BIG_SRC_Y: 784, BIG_SRC_H: 570, // grown: title 802-938 + the whole deck 1031-1336, 18 px air at both ends
};

// "Context is a critical but finite resource for AI agents." line 1 is the whole line,
// line 2 ends after "agents." at x 330 (the word gap before "In" is 16 px).
const ANTH_SENTENCE: Seg[] = [
  { x0: 60, x1: 858, top: 1020, h: 56 },
  { x0: 60, x1: 336, top: 1088, h: 56 },
];

type Side = { name: string; page: number; mark: number };
type PagesData = { chip: string; left: Side; right: Side };
type SweepData = { page: number; sentence: string };

// the inherited pair: V4's data carries only the page it keeps, so the state it draws on its
// first frame (which must match V3's last frame pixel for pixel) lives here.
const INHERITED: PagesData = {
  chip: "2 YEARS",
  left: { name: "Anthropic", page: 0, mark: 2 },
  right: { name: "OpenAI", page: 1, mark: 3 },
};

const pairLayout = (w: number, h: number) => {
  const padX = 0.0105 * w;
  const gap = 0.0221 * w;
  const colW = (w - 2 * padX - gap) / 2;
  const scale = colW / PAIR.SRC_W;
  const fs = chipFs(w);
  const chipH = fs + 2 * Math.round(0.42 * fs);
  const padT = 0.012 * h;
  const logoH = 0.098 * h;
  const nameFs = Math.round(0.04 * h);
  const nameH = Math.round(1.3 * nameFs);
  const logoY = padT + chipH + 0.025 * h;
  const nameY = logoY + logoH + 0.015 * h;
  const winY = nameY + nameH + 0.021 * h;
  const winH = h - winY - 0.034 * h;
  // grown: the page IS the plate, edge to edge (the Jina reel's real pages), one px of bleed
  // so no seam of white survives the rounding
  const bigW = w + 2;
  const bigH = h + 2;
  const bigScale = bigH / PAIR.BIG_SRC_H;
  const bigSrcX = (SHOT_W - bigW / bigScale) / 2; // the page's own text column, centred
  return {
    padX, colW, scale, fs, padT, logoY, logoH, nameY, nameFs, winY, winH,
    rightX: padX + colW + gap,
    bigW, bigScale, bigH, bigSrcX, bigX: -1, bigY: -1,
  };
};

/** the one picture V3 and V4 share. `grow` 0 = the pair, 1 = the Anthropic page IS the plate.
 *
 *  Changed against the plan row, and reported: the two clippings are on the plate from the
 *  card's entry instead of popping on `Anthropic` and `OpenAI`. The row as written leaves a
 *  994 x 653 empty white plate on screen for 607 ms under "For the past 2", which reads as a
 *  bug. The beats all keep their words: the span lands on `years`, and each real MARK lands
 *  on the company it names, over its own page. */
const Pair: React.FC<{
  w: number; h: number; assets: string[]; data: PagesData;
  chipA: number; leftA: number; rightA: number;
  grow: number; headOp: number; rightOp: number; sweepP: number;
}> = ({ w, h, assets, data, chipA, leftA, rightA, grow, headOp, rightOp, sweepP }) => {
  const L = pairLayout(w, h);
  const g = clamp01(grow);

  const winX = lerp(L.padX, L.bigX, g);
  const winY = lerp(L.winY, L.bigY, g);
  const winW = lerp(L.colW, L.bigW, g);
  const winH = lerp(L.winH, L.bigH, g);
  const winS = lerp(L.scale, L.bigScale, g);
  const winSrcX = lerp(PAIR.SRC_X, L.bigSrcX, g);
  const winSrcY = lerp(PAIR.LEFT_Y, PAIR.BIG_SRC_Y, g);
  const outX = g * (w - L.rightX + 0.06 * w);
  const headY = -0.045 * h * (1 - headOp); // the header lifts off as the page rises under it

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* right: OpenAI's page, its mark landing on its name. It slides off when V4 takes over. */}
      <div style={{
        position: "absolute", left: L.rightX, top: 0, width: L.colW, height: h,
        transform: `translateX(${outX}px)`, opacity: rightOp,
      }}>
        <div style={{ position: "absolute", left: 0, top: L.logoY, width: L.colW, ...landStyle(rightA) }}>
          <Mark src={assets[data.right.mark]} boxW={L.colW} boxH={L.logoH} />
        </div>
        <div style={{ position: "absolute", left: 0, top: L.nameY, width: L.colW, ...landStyle(rightA) }}>
          <Name text={data.right.name} fs={L.nameFs} />
        </div>
        <PageWindow
          src={assets[data.right.page]} x={0} y={L.winY} w={L.colW} h={L.winH}
          srcX={PAIR.SRC_X} srcY={PAIR.RIGHT_Y} scale={L.scale}
        />
      </div>

      {/* left: Anthropic's page. It becomes the plate. */}
      <PageWindow
        src={assets[data.left.page]} x={winX} y={winY} w={winW} h={winH}
        srcX={winSrcX} srcY={winSrcY} scale={winS}
      >
        <Highlighter segs={ANTH_SENTENCE} p={sweepP} srcX={winSrcX} srcY={winSrcY} scale={winS} />
      </PageWindow>

      {/* the header LAST and in one group, so the growing page passes UNDER the mark, the name
          and the chip while the whole header fades and lifts off, instead of eating them from
          below. One wrapper, because each child already owns its landing transform. */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: headOp, transform: `translateY(${headY}px)`,
      }}>
        <div style={{ position: "absolute", left: L.padX, top: L.logoY, width: L.colW, ...landStyle(leftA) }}>
          <Mark src={assets[data.left.mark]} boxW={L.colW} boxH={L.logoH} />
        </div>
        <div style={{ position: "absolute", left: L.padX, top: L.nameY, width: L.colW, ...landStyle(leftA) }}>
          <Name text={data.left.name} fs={L.nameFs} />
        </div>
        <div style={{
          position: "absolute", left: 0, right: 0, top: L.padT,
          display: "flex", justifyContent: "center",
        }}>
          <div style={landStyle(chipA)}><Chip text={data.chip} accent fs={L.fs} /></div>
        </div>
      </div>
    </div>
  );
};

const PagesCard: React.FC<CardProps & { data: PagesData }> = ({ tMs, w, h, fps, beats, assets, data }) => {
  const d = data?.left ? data : INHERITED;
  return (
    <Pair
      w={w} h={h} assets={assets} data={d}
      chipA={sp(tMs, beats.years, fps)}
      leftA={sp(tMs, beats.anthropic, fps)}
      rightA={sp(tMs, beats.openai, fps)}
      grow={0} headOp={1} rightOp={1} sweepP={0}
    />
  );
};

const GROW_MS = 560;
const SWEEP_MS = 700;
// two frames of hold before the page moves, so the hand-over frame is pixel-identical to V3's
// last frame: a sub-pixel rescale of a bitmap on the frame of the cut reads as a flicker
const HOLD_MS = 60;

const PageSweepCard: React.FC<CardProps & { data: SweepData }> = ({ tMs, w, h, fromMs, beats, assets }) => {
  const el = tMs - fromMs - HOLD_MS;
  return (
    <Pair
      w={w} h={h} assets={assets} data={INHERITED}
      chipA={1} leftA={1} rightA={1}
      grow={smooth(el / GROW_MS)}
      headOp={1 - clamp01(el / 240)}
      rightOp={1 - clamp01(el / 400)}
      sweepP={marker((tMs - beats.context) / SWEEP_MS)}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// V6: the arXiv abstract, recomposed
//
// spoken-480.png (960 x 4772), measured: the two title lines 275-321 and 331-378 (x 27-829);
// the author list 408-467 (never on screen); the two arXiv buttons 498-658; the abstract's
// sixteen lines 695-1356 at a 42.6 px pitch (x 28-922). The result sentence is line 12 from
// "Results" (x 225) to the end of the line, and line 13 up to "prompts," (x 410).
// Title and abstract keep ONE scale and ONE left margin, so the two windows read as the page
// with its middle taken out, not as two pasted pictures.

const PAPER = {
  SRC_X: 18, SRC_W: 914,
  TITLE_Y: 268, TITLE_H: 118,
  ABS_Y: 856, ABS_H: 508, // lines 5..16: the back half of the abstract, ending on its last word
};

const RESULT_SENTENCE: Seg[] = [
  { x0: 219, x1: 808, top: 1152, h: 40 },
  { x0: 23, x1: 414, top: 1194, h: 40 },
];

type PaperData = { page: number; sentence: string };

const PUSH_MS = 1100;
const PAPER_SWEEP_MS = 620;

const PaperCard: React.FC<CardProps & { data: PaperData }> = ({ tMs, w, h, fps, beats, assets, data }) => {
  const src = assets[data?.page ?? 0];
  const gap = 0.028 * h;
  const scale = Math.min((0.915 * w) / PAPER.SRC_W, (0.919 * h - gap) / (PAPER.TITLE_H + PAPER.ABS_H));
  const bw = PAPER.SRC_W * scale;
  const th = PAPER.TITLE_H * scale;
  const ah = PAPER.ABS_H * scale;
  const bh = th + gap + ah;
  const bx = (w - bw) / 2;
  const by = (h - bh) / 2;

  // the push: it starts on "data" and settles, then the picture is still while the sweep runs
  const k = 1 + 0.04 * smooth((tMs - beats.data) / PUSH_MS);
  const p = marker((tMs - beats.doesnt) / PAPER_SWEEP_MS);

  return (
    <div style={{
      position: "absolute", inset: 0,
      transform: `scale(${k})`, transformOrigin: "50% 62%",
    }}>
      <PageWindow
        src={src} x={bx} y={by} w={bw} h={th}
        srcX={PAPER.SRC_X} srcY={PAPER.TITLE_Y} scale={scale}
      />
      <PageWindow
        src={src} x={bx} y={by + th + gap} w={bw} h={ah}
        srcX={PAPER.SRC_X} srcY={PAPER.ABS_Y} scale={scale}
      >
        <Highlighter segs={RESULT_SENTENCE} p={p} srcX={PAPER.SRC_X} srcY={PAPER.ABS_Y} scale={scale} />
      </PageWindow>
    </div>
  );
};

export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  pages: PagesCard as React.FC<CardProps & { data: any }>,
  pagesweep: PageSweepCard as React.FC<CardProps & { data: any }>,
  paper: PaperCard as React.FC<CardProps & { data: any }>,
};
