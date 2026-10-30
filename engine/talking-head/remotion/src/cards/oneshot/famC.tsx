import React from "react";
import { spring } from "remotion";
import type { CardProps } from "../props";
import {
  BASE_H, CLAUDE_T, CW, PROMPT_MIN_H, PROMPT_PAD_X, PROMPT_PAD_Y, RADIUS, SANS, Surface,
} from "../ComposerParts";
import { BLUE, Chip, INK, chipFs, clamp01, easeOut } from "./shared";

// edit-h-oneshot family C: the composer ticker (V7), the word count (V8) and the details (V9).
// ONE object across three events: the real Claude composer (remocn claude-chat, `Surface` verbatim,
// scaled WHOLE so nothing inside is re-proportioned) with the prompt typed into its input at the
// hand's rate, under a thought rail streaming the same prompt at speech rate. The gap between the
// two heads IS the idea, so both texts are the same face at the same size starting from the same x:
// the bracket is literally the box of the characters thought and not yet written.
// V8 and V9 are callbacks: they inherit the composer exactly where V7 left it (the Overlay keeps the
// chain's entrance clock, nothing re-pops), drop the thought rail, and animate only their own beats.

// SCALE (reviewed on stills 2026-09-13). The composer is scaled WHOLE to the widest the 929 px card
// takes (0.96 w = 892 px of the 860 px stage, k 1.037). Even there the surface's verbatim input type
// (PROMPT_FS 21) lands at 21.8 px on the 1080 frame, under the 28 px floor, and the verbatim scale
// that would clear it (k 1.33) is 1147 px wide, wider than the frame. So the whole composer takes
// the largest scale that fits and PFS is the one number lifted on top of it: 28 stage px = 29.0 px
// on the frame. Everything else inside the surface stays in its own proportion.
const PFS = 28;
const LH = 1.32;
const HALO_BOX = "0 0 0 2px rgba(255,255,255,0.9)";
const HALO_TEXT = "0 0 3px rgba(255,255,255,0.95), 0 0 12px rgba(255,255,255,0.8)";
// the thought has to be READ, only lighter than the hand's type: shared GHOST (INK at 0.38) sank
// into the cream wall at phone width, so the ghost rail carries INK at 0.62 under the same halo.
const GHOST_INK = "rgba(20,22,31,0.62)";

// a beat lands ON its word. A beat at 25182 ms falls INSIDE frame 755, whose own tMs is 25166, so a
// spring started at the raw beat time is still at zero on the very frame the word is spoken. Every
// landing here gets a 1.3 frame head start (43 ms, less than half a word boundary) and an opacity
// that is up in one frame, so the chip is visibly landing on its own frame and finished 100 ms later.
const HEAD = 43;
const landing = (tMs: number, b: number, fps: number): React.CSSProperties | null => {
  const f = ((tMs - b + HEAD) / 1000) * fps;
  if (f <= 0) return null;
  const s = spring({ frame: f, fps, config: { damping: 13, stiffness: 320, mass: 0.7 } });
  return { opacity: clamp01(f), transform: `scale(${0.86 + 0.14 * s})`, transformOrigin: "center" };
};
// a stroke or a sweep that draws itself over `ms`, on the same head start
const drawn = (tMs: number, b: number | undefined, ms: number): number =>
  b == null ? 0 : easeOut(clamp01((tMs - b + HEAD) / ms));

type Geo = {
  k: number; wc: number; lc: number; textX: number; innerW: number; fs: number; lh: number;
  labelFs: number; labelH: number; gapFs: number; gapH: number; tick: number; rule: number;
  thinkY: number; ghostY: number; gapChipY: number; brLine: number; writeY: number;
  compTop: number; compH: number;
};

// the one layout all three kinds share, so the composer never moves across the hand-overs
const geo = (w: number, h: number): Geo => {
  const k = (0.96 * w) / CW;                        // the composer scaled WHOLE, as wide as the card takes
  const wc = CW * k;
  const lc = (w - wc) / 2;
  const textX = lc + PROMPT_PAD_X * k;              // the input's first character
  const innerW = (CW - 2 * PROMPT_PAD_X) * k;
  const fs = PFS * k;
  const lh = fs * LH;
  const labelFs = chipFs(w);                        // 32 px on the 929 px card, the reel's chip floor
  const labelH = labelFs + 2 * Math.round(0.42 * labelFs);
  const gapFs = chipFs(w);
  const gapH = gapFs + 2 * Math.round(0.42 * gapFs);
  const tick = Math.round(0.036 * h);               // the bracket's end ticks
  const rule = Math.max(3, Math.round(0.0045 * w));
  const compH = BASE_H * k;
  const g1 = Math.round(0.021 * h), g2 = Math.round(0.028 * h);
  const gBr = Math.round(0.020 * h);                // ghost line -> the gap chip, and chip -> bracket
  const brH = gBr + gapH + gBr + tick;              // the whole bracket band: its chip above its rule
  const stackH = labelH + g1 + lh + brH + g2 + labelH + g1 + compH;
  // the card is bottom-anchored in the band (top 0.105H, bottom 0.47H), so 0.35 of the slack above
  // puts the middle of the whole run on the middle of the BAND, not on the middle of the card.
  const top = Math.max(0, (h - stackH) * 0.35);
  const thinkY = top;
  const ghostY = thinkY + labelH + g1;
  const gapChipY = ghostY + lh + gBr;
  const brLine = gapChipY + gapH + gBr + tick / 2;
  const writeY = ghostY + lh + brH + g2;
  const compTop = writeY + labelH + g1;
  return {
    k, wc, lc, textX, innerW, fs, lh, labelFs, labelH, gapFs, gapH, tick, rule,
    thinkY, ghostY, gapChipY, brLine, writeY, compTop, compH,
  };
};

// the input holds about 60 characters a line at PFS; break on the sentence first so a detail
// (V9) never straddles a line break, then greedily on words.
const splitLines = (s: string): string[] => {
  const out: string[] = [];
  let rest = s.trim();
  while (rest.length > 57) {
    const dot = rest.indexOf(". ");
    if (dot > 0 && dot < 57 && dot + 2 < rest.length) {
      out.push(rest.slice(0, dot + 1)); rest = rest.slice(dot + 2); continue;
    }
    let cut = rest.lastIndexOf(" ", 57);
    if (cut <= 0) cut = 57;
    out.push(rest.slice(0, cut)); rest = rest.slice(cut + 1);
  }
  out.push(rest);
  return out;
};

type Seg = { t: string; u: number };

// cut a line into plain runs and the runs V9 underlines
const segsOf = (line: string, unders: string[]): Seg[] => {
  const segs: Seg[] = [];
  let i = 0;
  while (i < line.length) {
    let hit = -1, at = -1;
    unders.forEach((u, ui) => {
      if (!u) return;
      const p = line.indexOf(u, i);
      if (p >= 0 && (at < 0 || p < at)) { at = p; hit = ui; }
    });
    if (hit < 0) { segs.push({ t: line.slice(i), u: -1 }); break; }
    if (at > i) segs.push({ t: line.slice(i, at), u: -1 });
    segs.push({ t: unders[hit], u: hit });
    i = at + unders[hit].length;
  }
  return segs.length ? segs : [{ t: line, u: -1 }];
};

const Caret: React.FC<{ fs: number; on: number }> = ({ fs, on }) => (
  <span style={{
    display: "inline-block", width: Math.max(2, Math.round(0.1 * fs)), height: 1.06 * fs,
    verticalAlign: "-0.2em", marginLeft: Math.round(0.06 * fs),
    backgroundColor: CLAUDE_T.ink, opacity: on,
  }} />
);

const Line: React.FC<{
  segs: Seg[]; shown: number; fs: number; lh: number; prog: (u: number) => number;
  caret?: React.ReactNode;
}> = ({ segs, shown, fs, lh, prog, caret }) => {
  let i = 0;
  const out: React.ReactNode[] = [];
  segs.forEach((s, si) => {
    const start = i; i += s.t.length;
    const vis = Math.max(0, Math.min(s.t.length, shown - start));
    const t = s.t.slice(0, vis);
    if (s.u < 0) { out.push(<span key={si} style={{ whiteSpace: "pre" }}>{t}</span>); return; }
    const p = prog(s.u);
    out.push(
      <span key={si} style={{ position: "relative", display: "inline-block", whiteSpace: "pre" }}>
        {t}
        {p > 0.001 && (
          // under the descenders, not through them (the still showed the rule cutting `typing`)
          <span style={{
            position: "absolute", left: 0, bottom: 0,
            width: `${(p * 100).toFixed(2)}%`, height: Math.max(3, Math.round(0.12 * fs)),
            backgroundColor: BLUE,
          }} />
        )}
      </span>,
    );
  });
  return <div style={{ height: lh, whiteSpace: "pre" }}>{out}{caret}</div>;
};

/** the real composer with the prompt in its input: the surface verbatim, its field repainted so the
 *  placeholder is out and the typing is in, at the surface's own inset. */
const Field: React.FC<{
  g: Geo; lines: Seg[][]; shown: number; caretOn: number; unders: string[];
  prog: (u: number) => number;
}> = ({ g, lines, shown, caretOn, unders, prog }) => {
  const raw = lines.map((l) => l.map((s) => s.t).join(""));
  const starts: number[] = [];
  raw.reduce((n, l, i) => { starts[i] = n; return n + l.length; }, 0);
  const last = raw.reduce((acc, l, i) => (shown > starts[i] || i === 0 ? i : acc), 0);
  return (
    <>
      <Surface
        th={CLAUDE_T} k={g.k} left={g.lc} bottom={g.compTop + BASE_H * g.k} grow={0}
        files={[]} chipIn={[]} phOut={0} invert={false} markIn={0} markPx={0}
      />
      {/* the field repainted in the surface's own white, inside its radius: the placeholder goes,
          the prompt is typed in its place at the surface's own inset */}
      <div style={{
        position: "absolute", left: g.lc + g.k, top: g.compTop + g.k,
        width: (CW - 2) * g.k, height: (2 * PROMPT_PAD_Y + PROMPT_MIN_H) * g.k,
        backgroundColor: CLAUDE_T.surface,
        borderRadius: `${RADIUS * g.k}px ${RADIUS * g.k}px 0 0`,
      }} />
      <div style={{
        position: "absolute", left: g.textX, top: g.compTop + PROMPT_PAD_Y * g.k, width: g.innerW,
        fontFamily: SANS, fontSize: g.fs, lineHeight: LH, color: CLAUDE_T.ink,
      }}>
        {lines.map((segs, i) => (
          <Line
            key={i} segs={segs} shown={shown - starts[i]} fs={g.fs} lh={g.lh}
            prog={unders.length ? prog : () => 0}
            caret={i === last ? <Caret fs={g.fs} on={caretOn} /> : undefined}
          />
        ))}
      </div>
    </>
  );
};

type TickerData = {
  prompt: string; thinkLabel: string; writeLabel: string; gapLabel: string;
  thinkCps: number; writeCps: number;
};

// V7: the thought runs at speech speed, the hand types at typing speed, the bracket between the two
// heads opens and keeps widening at those two rates until the cut. A run card: rates, never a map.
const Ticker: React.FC<CardProps & { data: TickerData }> = ({ tMs, w, h, fps, fromMs, beats, data }) => {
  const g = geo(w, h);
  const lines = splitLines(data.prompt);
  const l1 = lines[0];
  const bType = beats.type ?? fromMs;
  const bFaster = beats.faster ?? bType + 1300;
  const el = Math.max(0, tMs + HEAD - bType) / 1000;
  const thought = Math.min(l1.length, Math.floor(el * data.thinkCps));
  const written = Math.min(l1.length, Math.floor(el * data.writeCps));
  // the caret blinks in the empty field and goes solid the moment the hand starts: the writing head
  // is the left end of the gap, it has to be there on every frame of the run
  const caretOn = tMs + HEAD >= bType ? 1 : ((tMs - fromMs) % 1000 < 620 ? 1 : 0);
  const open = drawn(tMs, bFaster, 300);
  const chip = landing(tMs, bFaster, fps);          // the bracket opens and its label lands on `faster`
  const gapText = l1.slice(written, thought);
  const half = Math.round(g.tick / 2);
  // the gap chip is the label of the measurement: it rides the middle of the span and sits ABOVE the
  // rule, never on it (a 32 px chip is wider than the gap for the first second and used to hide it).

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {/* the thought rail */}
      <div style={{ position: "absolute", left: g.textX, top: g.thinkY }}>
        <Chip text={data.thinkLabel} fs={g.labelFs} />
      </div>
      <div style={{
        position: "absolute", left: g.textX, top: g.ghostY, width: g.innerW, height: g.lh,
        overflow: "hidden", whiteSpace: "pre", fontFamily: SANS, fontSize: g.fs, lineHeight: LH,
        color: GHOST_INK, textShadow: HALO_TEXT,
      }}>
        {l1.slice(0, thought)}
        <span style={{
          display: "inline-block", width: Math.max(2, Math.round(0.1 * g.fs)), height: 1.06 * g.fs,
          verticalAlign: "-0.2em", marginLeft: Math.round(0.06 * g.fs), backgroundColor: GHOST_INK,
        }} />
      </div>

      {/* the bracket: the same face at the same size from the same x, so the box of the characters
          thought and not yet written IS the measurement. The type is hidden, only the ink shows:
          a rule from the caret to the ghost head with a tick standing on each end. */}
      <div style={{
        position: "absolute", left: g.textX, top: g.brLine,
        fontFamily: SANS, fontSize: g.fs, lineHeight: 1, whiteSpace: "pre",
      }}>
        <span style={{ display: "inline-block", visibility: "hidden" }}>{l1.slice(0, written)}</span>
        <span style={{ display: "inline-block", position: "relative", visibility: "hidden" }}>
          {gapText || " "}
          {open > 0.001 && (
            <span style={{
              position: "absolute", visibility: "visible", left: 0, top: -half,
              width: `${(open * 100).toFixed(2)}%`, height: g.tick,
            }}>
              <div style={{
                position: "absolute", left: 0, right: 0, top: half - g.rule / 2, height: g.rule,
                backgroundColor: INK, boxShadow: HALO_BOX,
              }} />
              <div style={{
                position: "absolute", left: 0, top: 0, width: g.rule, height: g.tick,
                backgroundColor: INK, boxShadow: HALO_BOX,
              }} />
              <div style={{
                position: "absolute", right: 0, top: 0, width: g.rule, height: g.tick,
                backgroundColor: INK, boxShadow: HALO_BOX,
              }} />
            </span>
          )}
          {chip && (
            <span style={{
              // centred on the WHOLE gap (not on the fraction already opened), so the label lands
              // inside the card on `faster` and is centred on the rule from the moment it is open
              position: "absolute", visibility: "visible", left: "50%",
              top: -half - Math.round(0.020 * h), transform: "translate(-50%, -100%)",
            }}>
              <Chip text={data.gapLabel} accent fs={g.gapFs} style={chip} />
            </span>
          )}
        </span>
      </div>

      {/* the hand rail */}
      <div style={{ position: "absolute", left: g.textX, top: g.writeY }}>
        <Chip text={data.writeLabel} fs={g.labelFs} />
      </div>
      <Field
        g={g} lines={lines.map((l) => [{ t: l, u: -1 }])} shown={written} caretOn={caretOn}
        unders={[]} prog={() => 0}
      />
    </div>
  );
};

type CountData = { prompt: string; chip: string };

// V8: the same composer, handed over on the frame, holding the whole prompt. The thought rail is
// gone; the caret blinks once, the count lands.
const Count: React.FC<CardProps & { data: CountData }> = ({ tMs, w, h, fps, fromMs, beats, data }) => {
  const g = geo(w, h);
  const lines = splitLines(data.prompt);
  const bPrompt = beats.prompt ?? fromMs + 750;
  const bCount = beats.count ?? bPrompt + 540;
  const ph = tMs + HEAD - bPrompt;
  const caretOn = ph > 70 && ph < 330 ? 0 : 1;      // one blink, on the word
  const land = landing(tMs, bCount, fps);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <div style={{ position: "absolute", left: g.textX, top: g.writeY }}>
        <Chip text="WRITING" fs={g.labelFs} />
      </div>
      {land && (
        <div style={{
          position: "absolute", left: g.lc + g.wc - PROMPT_PAD_X * g.k, top: g.writeY,
          transform: "translateX(-100%)",
        }}>
          <Chip text={data.chip} accent fs={g.labelFs} style={land} />
        </div>
      )}
      <Field
        g={g} lines={lines.map((l) => [{ t: l, u: -1 }])} shown={9999} caretOn={caretOn}
        unders={[]} prog={() => 0}
      />
    </div>
  );
};

type DetailsData = { prompt: string; chip: string; underlines: string[] };

// V9: the same picture again, still and inherited; three blue underlines draw under the three
// details, one per word.
const Details: React.FC<CardProps & { data: DetailsData }> = ({ tMs, w, h, beats, data }) => {
  const g = geo(w, h);
  const unders = data.underlines ?? [];
  const lines = splitLines(data.prompt).map((l) => segsOf(l, unders));
  const at = [beats.d1, beats.d2, beats.d3];
  // 240 ms: the rule is visibly drawing on the word's own frame and landed 100 ms later
  const prog = (u: number) => drawn(tMs, at[u], 240);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <div style={{ position: "absolute", left: g.textX, top: g.writeY }}>
        <Chip text="WRITING" fs={g.labelFs} />
      </div>
      <div style={{
        position: "absolute", left: g.lc + g.wc - PROMPT_PAD_X * g.k, top: g.writeY,
        transform: "translateX(-100%)",
      }}>
        <Chip text={data.chip} accent fs={g.labelFs} />
      </div>
      <Field g={g} lines={lines} shown={9999} caretOn={1} unders={unders} prog={prog} />
    </div>
  );
};

export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  ticker: Ticker, count: Count, details: Details,
};
