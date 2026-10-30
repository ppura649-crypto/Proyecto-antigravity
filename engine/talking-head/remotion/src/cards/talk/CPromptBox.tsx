import React from "react";
import { ADV, BLUE, INK, MUTED, PANEL, PAPER, RULE, clamp01, easeOut, mono, rnd } from "./CShared";
import { CCount } from "./CShared";

// The object itself: a prompt.md open in an editor. A file tab, a hairline, numbered lines, a
// word counter top right. Every state the story needs is a prop on THIS box, never a second box:
// the counter rolls (v8), fillers take a blue highlighter one after another (v10, v16), three
// underlines sweep their details (v8), the rows jitter out of alignment and stay crooked (v10),
// the clean lines land one by one (v16).

// the real strings this box carries, so v10, v11 and v16 show the same prompt to the character
export const RAMBLE =
  "so basically um I want like a script, a 60 second thing, about talking versus typing, " +
  "or actually wait, more about prompts, and um make it punchy, hook first, and end on a rule or something";
export const FILLERS = ["basically", "um", "like", "wait", "um", "or something"];

export type Seg = { t: string; f?: number };
export type PLine = { segs: Seg[] };
export type Row = { line: number; first: boolean; off: number; text: string; fid: number[] };

/** a plain string plus the fillers to mark, in the order they should light */
export const segsOf = (text: string, fillers: string[] = []): Seg[] => {
  const marks: { a: number; b: number; i: number }[] = [];
  let cur = 0;
  fillers.forEach((f, i) => {
    const re = new RegExp(`\\b${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    const m = re.exec(text.slice(cur));
    if (!m) return;
    const a = cur + m.index;
    marks.push({ a, b: a + f.length, i: i + 1 });
    cur = a + f.length;
  });
  const segs: Seg[] = [];
  let p = 0;
  for (const m of marks) {
    if (m.a > p) segs.push({ t: text.slice(p, m.a) });
    segs.push({ t: text.slice(m.a, m.b), f: m.i });
    p = m.b;
  }
  if (p < text.length) segs.push({ t: text.slice(p) });
  return segs;
};

export const metrics = (w: number, font: number) => {
  const padX = Math.round(font * 0.62);
  const tabH = Math.round(font * 1.5);
  const gutW = Math.round(font * 1.35);
  const gapG = Math.round(font * 0.5);
  const textX = padX + gutW + gapG;
  const cw = font * ADV;
  return { padX, tabH, gutW, gapG, textX, cw, maxChars: Math.max(8, Math.floor((w - textX - padX) / cw)) };
};

/** greedy word wrap, keeping each row's offset into its logical line so underlines land on chars */
export const layout = (lines: PLine[], maxChars: number, maxRows?: number): Row[] => {
  const rows: Row[] = [];
  lines.forEach((ln, li) => {
    let text = "";
    const fid: number[] = [];
    for (const s of ln.segs) { text += s.t; for (let i = 0; i < s.t.length; i++) fid.push(s.f ?? 0); }
    let i = 0, first = true;
    while (i < text.length) {
      let len = text.length - i;
      if (len > maxChars) {
        let cut = -1;
        for (let j = i + maxChars; j > i; j--) if (text[j] === " ") { cut = j; break; }
        len = (cut < 0 ? i + maxChars : cut) - i;
      }
      rows.push({ line: li, first, off: i, text: text.slice(i, i + len), fid: fid.slice(i, i + len) });
      first = false;
      i += len;
      while (text[i] === " ") i++;
    }
  });
  if (maxRows && rows.length > maxRows) {
    // it visibly runs off rather than being cut: the last row ends on a whole word and an ellipsis
    const kept = rows.slice(0, maxRows);
    const last = kept[maxRows - 1];
    const sp = last.text.lastIndexOf(" ");
    const cut = sp > 0 ? sp : Math.max(1, last.text.length - 1);
    kept[maxRows - 1] = { ...last, text: last.text.slice(0, cut) + " …", fid: [...last.fid.slice(0, cut), 0, 0] };
    return kept;
  }
  return rows;
};

export const boxHeight = (font: number, rowH: number, rowCount: number): number =>
  metrics(1000, font).tabH + Math.round(font * 0.42) + rowCount * rowH + Math.round(font * 0.6);

export type BoxProps = {
  x: number; y: number; w: number; font: number; rowH: number;
  tab: string; lines: PLine[]; maxRows?: number;
  listNumbers?: boolean;              // "1." (a list) instead of "1" (an editor gutter)
  count?: number; countP?: number;    // the word counter and its roll
  fillerP?: (i: number) => number;    // per filler, 0..1: the blue highlighter stroke
  unders?: { line: number; from: number; to: number; p: number }[];
  jitter?: number;                    // 0..1: the rows go out of alignment and stay there
  seed?: number;
  caret?: number;                     // 0..1 alpha on the caret after the last character
  reveal?: (line: number) => number;  // per logical line, 0..1: the clean lines landing
  opacity?: number;
};

export const CPromptBox: React.FC<BoxProps> = ({
  x, y, w, font, rowH, tab, lines, maxRows, listNumbers, count, countP = 1,
  fillerP, unders, jitter = 0, seed = 7, caret, reveal, opacity = 1,
}) => {
  const m = metrics(w, font);
  const rows = layout(lines, m.maxChars, maxRows);
  const bodyTop = m.tabH;
  const rowsTop = bodyTop + Math.round(font * 0.42);
  const h = boxHeight(font, rowH, rows.length);
  const tabFont = Math.round(font * 0.86);
  const tabW = Math.round(m.padX * 2 + tab.length * tabFont * ADV + font * 0.3);
  const cw = m.cw;

  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity }}>
      {/* the pane the file is open in */}
      <div style={{ position: "absolute", left: 0, top: bodyTop, width: w, height: h - bodyTop, backgroundColor: PANEL }} />
      <div style={{ position: "absolute", left: 0, top: bodyTop - 2, width: w, height: 2, backgroundColor: RULE }} />
      {/* the file tab, breaking the hairline */}
      <div
        style={{
          position: "absolute", left: 0, top: 0, width: tabW, height: m.tabH,
          backgroundColor: PAPER, borderTop: `2px solid ${RULE}`, borderLeft: `2px solid ${RULE}`,
          borderRight: `2px solid ${RULE}`, boxSizing: "border-box",
        }}
      >
        <div style={{ position: "absolute", left: m.padX, top: (m.tabH - tabFont) / 2, ...mono(tabFont, INK, 500) }}>{tab}</div>
      </div>

      {/* the word counter: the payload of this card, so it wears the blue */}
      {count !== undefined && (
        <div
          style={{
            position: "absolute", right: m.padX, top: (m.tabH - font * 1.24) / 2,
            display: "flex", alignItems: "center", gap: Math.round(font * 0.28),
            opacity: clamp01(countP * 6), // it arrives with its own roll, never sits at 00
          }}
        >
          <div style={{ backgroundColor: BLUE, padding: `${Math.round(font * 0.13)}px ${Math.round(font * 0.3)}px` }}>
            <CCount n={count} p={countP} px={font} color={INK} />
          </div>
          <div style={{ ...mono(font, MUTED) }}>words</div>
        </div>
      )}

      {rows.map((r, i) => {
        const j = jitter * (0.5 + rnd(seed + r.line * 3 + i));
        const dx = jitter ? (rnd(seed + i) - 0.5) * 30 * j : 0;
        const dy = jitter ? (rnd(seed + i + 41) - 0.5) * 14 * j : 0;
        const rot = jitter ? (rnd(seed + i + 91) - 0.5) * 3.2 * j : 0;
        const rv = reveal ? reveal(r.line) : 1;
        const ry = rowsTop + i * rowH;
        // runs of one filler id, so a marked word is one highlighter stroke
        const spans: { a: number; b: number; f: number }[] = [];
        r.fid.forEach((f, k) => {
          const last = spans[spans.length - 1];
          if (last && last.f === f && last.b === k) last.b = k + 1;
          else spans.push({ a: k, b: k + 1, f });
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: 0, top: ry, width: w, height: rowH,
              transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, transformOrigin: "20% 50%",
            }}
          >
            {r.first && (
              <div
                style={{
                  position: "absolute", left: m.padX, top: font * 0.08, width: m.gutW, textAlign: "right",
                  ...mono(Math.round(font * 0.82), MUTED),
                }}
              >
                {listNumbers ? `${r.line + 1}.` : `${r.line + 1}`}
              </div>
            )}
            {/* the gutter stays: an empty numbered box waits for its lines, which land on the word */}
            <div
              style={{
                position: "absolute", left: 0, top: 0, right: 0, bottom: 0,
                transform: `translateY(${12 * (1 - rv)}px)`, opacity: clamp01(rv * 1.4),
              }}
            >
            {spans.map((s, k) =>
              s.f > 0 && fillerP ? (
                <div
                  key={`f${k}`}
                  style={{
                    position: "absolute", left: m.textX + s.a * cw - 3, top: -font * 0.14,
                    width: ((s.b - s.a) * cw + 6) * easeOut(fillerP(s.f)), height: font * 1.26,
                    backgroundColor: BLUE,
                  }}
                />
              ) : null,
            )}
            <div style={{ position: "absolute", left: m.textX, top: 0, ...mono(font, INK) }}>{r.text}</div>
            {(unders ?? []).map((u, k) => {
              if (u.line !== r.line) return null;
              const a = Math.max(u.from, r.off), b = Math.min(u.to, r.off + r.text.length);
              if (b <= a) return null;
              return (
                <div
                  key={`u${k}`}
                  style={{
                    position: "absolute", left: m.textX + (a - r.off) * cw, top: font * 1.24,
                    width: (b - a) * cw * easeOut(u.p), height: Math.max(5, font * 0.19), backgroundColor: BLUE,
                  }}
                />
              );
            })}
            {caret !== undefined && i === rows.length - 1 && (
              <div
                style={{
                  position: "absolute", left: m.textX + r.text.length * cw + 3, top: -font * 0.1,
                  width: 3, height: font * 1.2, backgroundColor: INK, opacity: caret,
                }}
              />
            )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
