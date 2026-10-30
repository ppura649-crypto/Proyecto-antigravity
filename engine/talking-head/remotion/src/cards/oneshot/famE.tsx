import React from "react";
import { spring } from "remotion";
import type { CardProps } from "../props";
import { MONO_FONT } from "../theme";
import {
  BLUE, BLUE_TEXT, Chip, HALO_STROKE, INK, KeyboardGlyph, MicGlyph,
  chipFs, chipFsBig, clamp01, easeOut, landStyle,
} from "./shared";

// edit-h-oneshot, family E: the rule chips (V14 + V15) and the SKILL.md sheet (V17).
//
// `rule` is ONE kind for both events: `data.rule.row` says how many rows are filled, so V15 is
// the same object with its second row filling under the first. BOTH rows are laid out from the
// first frame (the unfilled one at opacity 0, still occupying its cell), which is what lets the
// callback start on the frame its parent ended without a single pixel moving. The three cells
// are one CSS grid with `max-content` columns, so the two rows share one condition column and
// one arrow column (they line up) and the whole block is centred in the card (2026-09-13: the
// first build fixed the columns at fractions of the card, which parked the block 175 px left of
// centre and nearly pushed TALK off the edge).
//
// `skillmd` is the real shape of a Claude Code skill writing itself: a tab, a line-number
// gutter, frontmatter fences, the name lighting up and the two words the whole file is about
// taking an underline. It lives on the WHITE plate the Overlay draws, so every glyph is dark.
// The sheet takes the height its four lines need: the body size is SOLVED against the height it
// is given (the card's hFrac is a ceiling, not a box to fill), the lines are wrapped here rather
// than by the browser so the height is known before it is drawn, and the block is centred with
// equal gutter air above and below (2026-09-13: the first build set a fixed 37 px body and left
// the lower third of the sheet empty white).

const POP = { damping: 14, stiffness: 300, mass: 0.7 } as const;
// the action chip is the payoff of the row, so it lands with a visible overshoot
const POP_LAND = { damping: 11, stiffness: 320, mass: 0.7 } as const;
const landBig = (s: number): React.CSSProperties => ({
  opacity: Math.min(1, s * 2),
  transform: `scale(${0.82 + 0.18 * s})`,
  transformOrigin: "center",
});

type RuleRow = { cond: string; action: string; glyph: string };
type RuleData = { row: number; rows: RuleRow[] };
type SkillData = { file: string; lines: string[]; nameLine: number; underline: string };

/** the ink arrow of their own reel: it draws itself left to right, the head lands last.
 *  Halo first (so it survives the bright wall), then the ink on top, the ink heavier than
 *  the halo so the stroke reads as drawn and not as a white sausage. */
const InkArrow: React.FC<{ w: number; h: number; a: number }> = ({ w, h, a }) => {
  const cy = h / 2;
  const x0 = 0.04 * w;
  const tipX = 0.98 * w;
  const headLen = 0.24 * w;
  const half = 0.42 * h;
  const sw = Math.max(9, 0.105 * w);
  // the pen: the head rides the tip the whole way and grows out of the start, so the head is
  // never a triangle floating ahead of the stroke it belongs to
  const pen = x0 + (tipX - x0) * a;
  const g = clamp01((pen - x0) / headLen);
  const base = pen - headLen * g;
  const hh = half * g;
  const tri = `M ${base} ${cy - hh} L ${pen} ${cy} L ${base} ${cy + hh} Z`;
  // the halo grows with the stroke, so the first frames are a dark pen touching down and never a
  // white blob wider than the ink inside it
  const haloK = clamp01((pen - x0) / (2.2 * sw));
  if (a <= 0.002) return <svg width={w} height={h} style={{ display: "block" }} />;
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <title>then</title>
      {/* halo */}
      <line x1={x0} y1={cy} x2={Math.max(x0, base)} y2={cy} {...HALO_STROKE} strokeWidth={sw * 1.85 * haloK} strokeLinecap="round" />
      <path d={tri} fill="#FFFFFF" fillOpacity={0.7} {...HALO_STROKE} strokeWidth={sw * 1.25 * haloK} strokeLinejoin="round" />
      {/* ink */}
      <line x1={x0} y1={cy} x2={Math.max(x0, base)} y2={cy} stroke={INK} strokeWidth={sw} strokeLinecap="round" />
      <path d={tri} fill={INK} />
    </svg>
  );
};

// Avenir Next Bold, uppercase, with the chip's 0.02em tracking: advance per character, measured
// on a still of this card (16 characters spanned 345 px at 32 px). Only decides where a long
// condition breaks into two balanced lines, so a few percent of error costs nothing.
const LABEL_ADV = 0.68;

/** a long condition becomes two lines of about equal length, broken here (nowrap per line) so
 *  the chip shrink-wraps to its widest line instead of to the column it was given */
const balanceLines = (text: string, fs: number, budget: number): string[] => {
  const words = text.split(" ").filter(Boolean);
  const wid = (s: string) => s.length * LABEL_ADV * fs;
  if (words.length < 2 || wid(text) <= budget) return [text];
  let best = [words[0], words.slice(1).join(" ")];
  for (let i = 2; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    if (Math.max(wid(a), wid(b)) < Math.max(wid(best[0]), wid(best[1]))) best = [a, b];
  }
  return best;
};

const RuleCard: React.FC<CardProps & { data: RuleData }> = ({ tMs, w, h, fps, beats, data }) => {
  const rows = data?.rows ?? [];
  const filled = (data?.row ?? 1) - 1; // index of the row being filled now
  const condFs = chipFs(w);
  const actFs = chipFsBig(w);
  const arrowW = Math.round(0.13 * w);
  const arrowH = Math.round(1.12 * actFs);
  const colGap = Math.round(0.016 * w);
  const rowGap = Math.round(0.085 * h);
  const condBudget = 0.42 * w;

  const sp = (beat: number, cfg: { damping: number; stiffness: number; mass: number }): number =>
    spring({ frame: Math.max(0, ((tMs - beat) / 1000) * fps), fps, config: cfg });

  return (
    <div style={{
      position: "absolute", inset: 0, display: "grid",
      gridTemplateColumns: "max-content max-content max-content",
      placeContent: "center", alignItems: "center",
      columnGap: colGap, rowGap,
    }}>
      {rows.map((r, i) => {
        const live = i === filled;
        const shown = i <= filled;
        const cs = shown ? (live ? sp(beats.cond, POP) : 1) : 0;
        const as = shown ? (live ? sp(beats.action, POP_LAND) : 1) : 0;
        const aa = shown ? (live ? easeOut((tMs - beats.arrow) / 300) : 1) : 0;
        return (
          <React.Fragment key={r.action}>
            <div style={{ justifySelf: "end", display: "flex", alignItems: "center" }}>
              <Chip
                text={balanceLines(r.cond, condFs, condBudget).join("\n")}
                fs={condFs}
                style={{
                  ...landStyle(cs),
                  whiteSpace: "pre", lineHeight: 1.18, textAlign: "left",
                }}
              />
            </div>
            <div style={{ justifySelf: "center", display: "flex", alignItems: "center" }}>
              <InkArrow w={arrowW} h={arrowH} a={aa} />
            </div>
            <div style={{ justifySelf: "start", display: "flex", alignItems: "center" }}>
              <Chip
                text={r.action}
                accent
                fs={actFs}
                style={landBig(as)}
                glyph={r.glyph === "keyboard"
                  ? <KeyboardGlyph size={0.98 * actFs} color={BLUE_TEXT} />
                  : <MicGlyph size={0.98 * actFs} color={BLUE_TEXT} />}
              />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const CPS = 45;       // the file writes itself at reading speed
const LINE_GAP = 120; // the pause on a newline
const KEY_INK = "rgba(20,22,31,0.52)";
const FENCE_INK = "rgba(20,22,31,0.40)";
const NUM_INK = "rgba(20,22,31,0.32)";
const MONO_ADV = 0.6023; // Menlo / SF Mono advance per character
const BODY_FS_MAX = 44;
const BODY_FS_MIN = 32;

type SheetRow = { li: number; first: boolean; text: string; off: number };

/** wrap one logical line into rows of at most `cols` characters, keeping `atomic` (the two words
 *  that take the underline) on one row so the blue bar never straddles two rows */
const wrapLine = (text: string, atomic: string, cols: number): string[] => {
  const at = atomic ? text.indexOf(atomic) : -1;
  const tokens: string[] = [];
  if (at >= 0) {
    tokens.push(...text.slice(0, at).split(" ").filter(Boolean));
    tokens.push(atomic);
    tokens.push(...text.slice(at + atomic.length).split(" ").filter(Boolean));
  } else {
    tokens.push(...text.split(" ").filter(Boolean));
  }
  if (tokens.length === 0) return [text];
  const out: string[] = [];
  let line = tokens[0];
  for (let i = 1; i < tokens.length; i++) {
    if (line.length + 1 + tokens[i].length <= cols) line += ` ${tokens[i]}`;
    else { out.push(line); line = tokens[i]; }
  }
  out.push(line);
  return out;
};

const layoutSheet = (lines: string[], atomic: string, fs: number, textW: number): SheetRow[] => {
  const cols = Math.max(8, Math.floor(textW / (MONO_ADV * fs)));
  const out: SheetRow[] = [];
  lines.forEach((text, li) => {
    let off = 0;
    wrapLine(text, atomic, cols).forEach((rowText, ri) => {
      out.push({ li, first: ri === 0, text: rowText, off });
      off += rowText.length + 1; // the space the wrap ate
    });
  });
  return out;
};

const SkillMd: React.FC<CardProps & { data: SkillData }> = ({ tMs, w, h, fps, fromMs, beats, data }) => {
  const lines = data?.lines ?? [];
  const atomic = data?.underline ?? "";
  const pad = Math.round(0.042 * w);
  const gutter = Math.round(0.052 * w);
  const tabH = Math.round(0.072 * w);
  const tabFs = Math.round(0.032 * w);
  const textW = w - 2 * pad - gutter;

  // the sheet takes the height its lines need: the biggest body size whose wrapped lines fit the
  // room the card was given, then equal gutter air above and below. A smaller card just picks a
  // smaller size; nothing is ever clipped and nothing is ever an empty half.
  const minAir = Math.round(0.055 * h);
  const room = h - tabH - 2 * minAir;
  let bodyFs = BODY_FS_MIN;
  let rows = layoutSheet(lines, atomic, BODY_FS_MIN, textW);
  let lineH = Math.round(BODY_FS_MIN * 1.55);
  for (let fs = BODY_FS_MAX; fs >= BODY_FS_MIN; fs--) {
    const r = layoutSheet(lines, atomic, fs, textW);
    const lh = Math.round(fs * 1.55);
    if (r.length * lh <= room || fs === BODY_FS_MIN) { bodyFs = fs; rows = r; lineH = lh; break; }
  }
  const numFs = Math.round(0.62 * bodyFs);
  const bodyH = rows.length * lineH;
  const bodyTop = tabH + Math.max(minAir, Math.round((h - tabH - bodyH) / 2));

  // when each logical line starts typing, and how far it has got
  const starts: number[] = [];
  let acc = 0;
  for (const t of lines) { starts.push(acc); acc += (t.length / CPS) * 1000 + LINE_GAP; }
  const typedOf = (i: number): number =>
    Math.max(0, Math.min(lines[i].length, Math.floor(((tMs - beats.built - starts[i]) / 1000) * CPS)));

  let active = -1;
  for (let i = 0; i < lines.length; i++) if (tMs >= beats.built + starts[i]) active = i;
  const last = lines.length - 1;
  const done = active === last && typedOf(last) >= lines[last].length;
  const blink = Math.floor(tMs / 480) % 2 === 0;
  const caretLit = done ? blink : true;
  const tIn = spring({ frame: Math.max(0, ((tMs - fromMs) / 1000) * fps), fps, config: POP });
  const under = easeOut((tMs - beats.talking) / 340);

  // the row the caret sits on: the last row of the line being typed that the head has reached
  const headRow = (() => {
    if (active < 0) return null;
    const n = typedOf(active);
    let pick: SheetRow | null = null;
    for (const r of rows) if (r.li === active && (n >= r.off || r.first)) pick = r;
    return pick;
  })();

  const caret = (
    <span style={{
      display: "inline-block", width: 0.54 * bodyFs, height: 0.96 * bodyFs,
      marginLeft: 0.06 * bodyFs, backgroundColor: INK, verticalAlign: "text-bottom",
      opacity: caretLit ? 1 : 0,
    }} />
  );

  // one wrapped row, cut at the caret: the key of a `key: value` line is quieter than its value
  // (as in an editor), the fences quieter still, and the two words the file exists for carry the
  // underline that draws itself on `talking`.
  const rowBody = (row: SheetRow, n: number, lit: boolean): React.ReactNode => {
    const src = lines[row.li];
    const vis = Math.max(0, Math.min(row.text.length, n - row.off));
    if (vis <= 0) return null;
    const fence = src.trim() === "---";
    const colon = src.indexOf(": ");
    const keyEnd = colon > 0 ? colon + 1 : 0;
    const uAt = atomic ? src.indexOf(atomic) : -1;
    const cuts = new Set<number>([0, row.text.length]);
    for (const abs of [keyEnd, uAt, uAt < 0 ? -1 : uAt + atomic.length]) {
      const rel = abs - row.off;
      if (abs >= 0 && rel > 0 && rel < row.text.length) cuts.add(rel);
    }
    const marks = [...cuts].sort((a, b) => a - b);
    const out: React.ReactNode[] = [];
    for (let i = 0; i < marks.length - 1; i++) {
      const a = marks[i];
      const b = Math.min(marks[i + 1], vis);
      if (b <= a) break;
      const s = row.text.slice(a, b);
      const isKey = !lit && !fence && row.off + b <= keyEnd;
      const isU = uAt >= 0 && row.off + a >= uAt && row.off + b <= uAt + atomic.length;
      const color = lit ? undefined : fence ? FENCE_INK : isKey ? KEY_INK : undefined;
      if (isU) {
        out.push(
          <span key={a} style={{ position: "relative", color, whiteSpace: "pre" }}>
            {s}
            {under > 0 && row.off + b >= uAt + atomic.length && (
              <span style={{
                position: "absolute", left: 0, bottom: -0.20 * bodyFs,
                height: Math.max(4, 0.13 * bodyFs), width: `${100 * under}%`, backgroundColor: BLUE,
              }} />
            )}
          </span>,
        );
      } else {
        out.push(<span key={a} style={{ color, whiteSpace: "pre" }}>{s}</span>);
      }
    }
    return out;
  };

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* the tab: which file this is */}
      <div style={{
        position: "absolute", left: 0, top: 0, width: w, height: tabH,
        backgroundColor: "#F1F0EB", borderBottom: "1px solid rgba(20,22,31,0.14)",
        display: "flex", alignItems: "stretch", opacity: Math.min(1, tIn * 3),
      }}>
        <div style={{
          marginLeft: pad, display: "flex", alignItems: "center", gap: 0.016 * w,
          padding: `0 ${0.024 * w}px`, backgroundColor: "#FFFFFF",
          borderTop: `${Math.round(0.006 * w)}px solid ${INK}`,
          borderLeft: "1px solid rgba(20,22,31,0.14)", borderRight: "1px solid rgba(20,22,31,0.14)",
          boxSizing: "border-box",
        }}>
          <svg width={1.05 * tabFs} height={1.05 * tabFs} viewBox="0 0 24 24" style={{ flex: "none", display: "block" }}>
            <title>markdown file</title>
            <path d="M5 2 H14 L19 7 V22 H5 Z" fill="none" stroke={INK} strokeWidth={1.8} />
            <path d="M14 2 V7 H19" fill="none" stroke={INK} strokeWidth={1.8} />
          </svg>
          <span style={{ fontFamily: MONO_FONT, fontSize: tabFs, color: INK, whiteSpace: "nowrap" }}>
            {data?.file}
          </span>
        </div>
      </div>

      {/* the file writing itself */}
      <div style={{ position: "absolute", left: pad, top: bodyTop, width: w - 2 * pad }}>
        {rows.map((row) => {
          if (tMs < beats.built + starts[row.li]) return null;
          const n = typedOf(row.li);
          if (!row.first && n < row.off) return null;
          const lit = row.li === data.nameLine && tMs >= beats.name;
          const head = headRow !== null && headRow.li === row.li && headRow.off === row.off;
          return (
            <div key={`${row.li}-${row.off}`} style={{
              position: "relative", display: "flex", alignItems: "flex-start", minHeight: lineH,
            }}>
              {lit && row.first && (
                <div style={{
                  position: "absolute", left: -0.020 * w, top: 0, width: Math.round(0.008 * w),
                  height: lineH, backgroundColor: BLUE,
                }} />
              )}
              <div style={{
                width: gutter, flex: "none", boxSizing: "border-box", paddingRight: 0.016 * w,
                textAlign: "right", fontFamily: MONO_FONT, fontSize: numFs,
                lineHeight: `${lineH}px`, color: NUM_INK,
              }}>
                {row.first ? row.li + 1 : ""}
              </div>
              <div style={{
                flex: 1, fontFamily: MONO_FONT, fontSize: bodyFs, lineHeight: `${lineH}px`,
                whiteSpace: "pre", color: lit ? BLUE : INK, fontWeight: lit ? 700 : 400,
              }}>
                {rowBody(row, n, lit)}
                {head ? caret : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const KINDS: Record<string, React.FC<CardProps & { data: any }>> = {
  rule: RuleCard,
  skillmd: SkillMd,
};
