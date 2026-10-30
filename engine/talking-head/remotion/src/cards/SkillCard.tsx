import React from "react";
import { spring } from "remotion";
import { ACCENT, INK, MONO_FONT, MUTED } from "./theme";

// "I found a really cool SKILL that helps OPTIMISING FOR MORE ACTION."
// A real markdown file writing itself: the frontmatter fences and every key and
// value type out a character at a time behind a blinking caret, line numbers
// filling in as the lines appear, and on the last beat the one line the whole
// card exists for lands under it in terracotta, a size up from the body.
// Framed: the parent draws the black plate, this only writes on it.

const NOMINAL_CPS = 45; // characters per second, unless the beats leave less room
const LINE_GAP_MS = 120; // the pause on a newline

type Row = { text: string; k?: string };

export const SkillCard: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  file: string;
  frontmatter: { k: string; v: string }[];
  description: string;
  beats: { type: number; land: number };
}> = ({ tMs, w, h, fps, fromMs, file, frontmatter, description, beats }) => {
  const pad = 0.045 * w;
  const titleFs = 0.034 * w;
  const bodyFs = 0.032 * w;
  const numFs = 0.022 * w;
  const glyph = 0.036 * w;
  const gutter = 0.050 * w;
  const lineH = bodyFs * 1.50;
  const titleH = titleFs * 1.6;
  const ruleY = pad + titleH;
  const bodyTop = ruleY + 0.030 * w;
  const bodyW = w - 2 * pad - gutter;

  const rows: Row[] = [
    { text: "---" },
    ...frontmatter.map((f) => ({ text: `${f.k}: ${f.v}`, k: f.k })),
    { text: "---" },
  ];

  // 45 c/s unless the file would still be typing when the payoff line is due, in
  // which case the whole write-out (characters and newline pauses alike) is scaled
  // to finish just before it
  const chars = rows.reduce((m, r) => m + r.text.length, 0);
  const nominalMs = (chars / NOMINAL_CPS) * 1000 + LINE_GAP_MS * (rows.length - 1);
  const room = beats.land - beats.type - 100;
  const scale = room > 0 && nominalMs > room ? room / nominalMs : 1;
  const cps = NOMINAL_CPS / scale;
  const gapMs = LINE_GAP_MS * scale;

  const starts: number[] = [];
  let acc = 0;
  for (const r of rows) {
    starts.push(acc);
    acc += (r.text.length / cps) * 1000 + gapMs;
  }
  const typingEnd = acc - gapMs;

  const typedOf = (i: number): number => {
    const n = Math.floor(((tMs - beats.type - starts[i]) / 1000) * cps);
    return Math.max(0, Math.min(rows[i].text.length, n));
  };

  let active = -1;
  for (let i = 0; i < rows.length; i++) if (tMs >= beats.type + starts[i]) active = i;
  const landed = tMs >= beats.land;
  const caretOnDesc = landed && tMs >= beats.type + typingEnd;

  const tIn = spring({ frame: Math.max(0, ((tMs - fromMs) / 1000) * fps), fps, config: { damping: 14, stiffness: 300, mass: 0.7 } });
  const dIn = spring({ frame: Math.max(0, ((tMs - beats.land) / 1000) * fps), fps, config: { damping: 14, stiffness: 300, mass: 0.7 } });
  const blink = Math.floor(tMs / 460) % 2 === 0;

  // the payoff line is a size up from the body and is allowed the two lines that
  // costs; only a longer one than that shrinks to stay inside the plate
  const descTarget = 0.040 * w;
  const descLines = Math.ceil((description.length * 0.60 * descTarget) / bodyW);
  const descFs = descLines <= 2 ? descTarget : Math.max(bodyFs, (2 * bodyW) / (Math.max(1, description.length) * 0.60));

  const caret = (fs: number) => (
    <span style={{
      display: "inline-block", width: fs * 0.55, height: fs * 0.98, marginLeft: fs * 0.10,
      backgroundColor: INK, verticalAlign: "middle", opacity: blink ? 1 : 0, borderRadius: 0,
    }} />
  );

  const num = (n: number) => (
    <div style={{
      width: gutter, flex: "none", boxSizing: "border-box", paddingRight: 0.014 * w,
      textAlign: "right", fontFamily: MONO_FONT, fontSize: numFs, color: MUTED,
    }}>
      {n}
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* title bar: the file this is */}
      <div style={{
        position: "absolute", left: pad, top: pad, height: titleH, display: "flex", alignItems: "center",
        gap: 0.018 * w, opacity: Math.min(1, tIn * 2),
      }}>
        <svg width={glyph} height={glyph} viewBox="0 0 24 24" style={{ flex: "none" }}>
          <title>markdown file</title>
          <path d="M5 2 H14 L19 7 V22 H5 Z" fill="none" stroke={INK} strokeWidth={1.7} />
          <path d="M14 2 V7 H19" fill="none" stroke={INK} strokeWidth={1.7} />
        </svg>
        <div style={{ fontFamily: MONO_FONT, fontSize: titleFs, color: INK, whiteSpace: "nowrap" }}>{file}</div>
      </div>
      <div style={{
        position: "absolute", left: pad, top: ruleY, width: w - 2 * pad, height: 1,
        backgroundColor: "rgba(255,255,255,0.16)", opacity: Math.min(1, tIn * 2),
      }} />

      {/* the file body */}
      <div style={{ position: "absolute", left: pad, top: bodyTop, width: w - 2 * pad }}>
        {rows.map((r, i) => {
          if (tMs < beats.type + starts[i]) return null;
          const n = typedOf(i);
          const shown = r.text.slice(0, n);
          const key = r.k ?? "";
          const body = r.k
            ? (
              <>
                <span style={{ color: MUTED }}>{shown.slice(0, Math.min(n, key.length))}</span>
                <span style={{ color: MUTED }}>{n > key.length ? shown.slice(key.length, Math.min(n, key.length + 2)) : ""}</span>
                <span style={{ color: INK }}>{n > key.length + 2 ? shown.slice(key.length + 2) : ""}</span>
              </>
            )
            : <span style={{ color: MUTED }}>{shown}</span>;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", height: lineH, fontFamily: MONO_FONT, fontSize: bodyFs, whiteSpace: "pre" }}>
              {num(i + 1)}
              <div>
                {body}
                {active === i && !caretOnDesc ? caret(bodyFs) : null}
              </div>
            </div>
          );
        })}

        {/* the blank line, then the line this card exists for */}
        {landed && (
          <>
            <div style={{ display: "flex", alignItems: "center", height: lineH }}>{num(rows.length + 1)}</div>
            <div style={{
              display: "flex", alignItems: "flex-start", minHeight: descFs * 1.30,
              opacity: Math.min(1, dIn * 2), transform: `translateY(${(1 - Math.min(1, dIn)) * 0.018 * h}px)`,
            }}>
              {num(rows.length + 2)}
              <div style={{ fontFamily: MONO_FONT, fontSize: descFs, color: ACCENT, lineHeight: 1.30, maxWidth: bodyW }}>
                {description}
                {caretOnDesc ? caret(descFs) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
