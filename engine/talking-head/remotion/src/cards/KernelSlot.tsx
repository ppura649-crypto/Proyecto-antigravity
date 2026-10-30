import React from "react";
import { interpolate } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, INK, MONO_FONT, label } from "./theme";
import { DIE_N, DieGlyph, dieLayout, dieMetrics, type DieSlotRect } from "./Die";

// V11, "But a chip is nothing without the KERNEL. The tiny little PROGRAMS that
// tell it how to do each MATH STEP." The die from V4 comes back with a hole in the
// middle of it, and the real Gluon tutorial kernel is fed into that hole one line at
// a time, each line lighting a cell of the chip. On `math` the whole grid goes: the
// program is what makes the silicon do anything at all.

export type KernelSlotData = { name: string; slot: string; code: string[]; source: string };

const MAXCH = 42;
const SLOT: DieSlotRect = { c0: 1, r0: 3, c1: 6, r1: 4 };
type Row = { text: string; li: number };

// a long signature breaks the way python breaks it, at an argument comma, with the
// continuation lined up under the open paren. Nothing is invented and nothing is cut.
const wrapLine = (s: string, max: number): string[] => {
  if (s.length <= max) return [s];
  const open = s.indexOf("(");
  const cont = " ".repeat(open >= 0 ? open + 1 : (/^\s*/.exec(s)?.[0].length ?? 0) + 4);
  const out: string[] = [];
  let rest = s;
  while (rest.length > max) {
    let cut = rest.lastIndexOf(", ", max - 1);
    if (cut <= 0) cut = max - 2;
    out.push(rest.slice(0, cut + 1));
    rest = cont + rest.slice(cut + 2);
  }
  out.push(rest);
  return out;
};

// code texture without colour: names stay white, punctuation and operators sit back
const runs = (s: string) =>
  (s.match(/[A-Za-z0-9_.@]+|[^A-Za-z0-9_.@]+/g) ?? []).map((t) => ({
    t, dim: !/^[A-Za-z0-9_.@]/.test(t),
  }));

// the cells the kernel reaches first are the ones around the slot, so the chip lights
// outward from the program instead of in some arbitrary order
const seatsAround = (n: number) => {
  const cand: { i: number; d: number }[] = [];
  for (let i = 0; i < DIE_N * DIE_N; i++) {
    const c = i % DIE_N;
    const r = Math.floor(i / DIE_N);
    if (c >= SLOT.c0 && c <= SLOT.c1 && r >= SLOT.r0 && r <= SLOT.r1) continue;
    cand.push({ i, d: Math.hypot(c - (SLOT.c0 + SLOT.c1) / 2, r - (SLOT.r0 + SLOT.r1) / 2) });
  }
  cand.sort((a, b) => a.d - b.d || a.i - b.i);
  const seat = new Map<number, number>();
  cand.slice(0, n).forEach((x, k) => seat.set(x.i, k));
  return seat;
};

// the die keeps V4's size and position; the program takes the column beside it, at
// whatever mono size lets the longest real line fit without being cut
const slotLayout = (w: number, h: number, rows: Row[]) => {
  const { P, S, dieX, ax0 } = dieLayout(w, h);   // the die keeps V4's size and column
  const nameFs = 0.0237 * w;
  const padOut = 0.052 * S;
  const codeX = ax0;                             // the code starts where V4's arrows did
  const colW = w - P - codeX;
  const maxLen = rows.reduce((m, r) => Math.max(m, r.text.length), 1);
  const codeFs = Math.min(0.0215 * w, colW / (maxLen * 0.615));
  const lineH = codeFs * 1.55;
  const srcTop = h - P - codeFs * 1.25;
  const mainH = srcTop - 0.024 * h - P;
  const blockH = S + 2 * padOut + 0.030 * h + nameFs * 1.18;
  const dieY = P + (mainH - blockH) / 2 + padOut;
  const m = dieMetrics(dieX, dieY, S);
  return {
    P, S, dieX, dieY, nameFs, codeX, codeFs, lineH, srcTop,
    nameTop: dieY + S + padOut + 0.030 * h,
    codeTop: P + (mainH - rows.length * lineH) / 2,
    slotX: m.gx + SLOT.c0 * m.cell, slotW: (SLOT.c1 - SLOT.c0 + 1) * m.cell,
    slotY: m.gy + SLOT.r0 * m.cell, slotH: (SLOT.r1 - SLOT.r0 + 1) * m.cell,
  };
};

const CodeRow: React.FC<{
  row: Row; top: number; left: number; fs: number; lineH: number;
  land: number; flash: number; slide: number;
}> = ({ row, top, left, fs, lineH, land, flash, slide }) => {
  const base: React.CSSProperties = {
    position: "absolute", left, top,
    fontFamily: MONO_FONT, fontSize: fs, lineHeight: `${lineH}px`,
    whiteSpace: "pre", letterSpacing: 0,
  };
  return (
    <div style={{ transform: `translateX(${(1 - land) * slide}px)` }}>
      <div style={{ ...base, color: INK, opacity: 0.28 + 0.72 * land }}>
        {runs(row.text).map((s, j) => (
          <span key={j} style={{ opacity: s.dim ? 0.6 : 1 }}>{s.t}</span>
        ))}
      </div>
      {flash > 0 && <div style={{ ...base, color: ACCENT, opacity: flash }}>{row.text}</div>}
    </div>
  );
};

export const KernelSlot: React.FC<CardProps & { data: KernelSlotData }> = ({
  tMs, w, h, fromMs, beats, data,
}) => {
  const rows: Row[] = [];
  data.code.forEach((s, li) => wrapLine(s, MAXCH).forEach((text) => rows.push({ text, li })));
  const L = slotLayout(w, h, rows);
  const slotCx = L.slotX + L.slotW / 2;
  const slotCy = L.slotY + L.slotH / 2;

  const ramp = (a: number, b: number) =>
    interpolate(tMs, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const slotAt = beats.slot ?? fromMs;
  const linesAt = beats.lines ?? slotAt + 1100;
  const linesEnd = beats.linesEnd ?? linesAt + 1380;
  const litAt = beats.lit ?? linesEnd + 240;
  const n = data.code.length;
  const lineAt = (li: number) => linesAt + li * ((linesEnd - linesAt) / n);

  const pz = (tMs - slotAt) / 300;
  const pulse = pz >= 0 && pz < 2 ? Math.abs(Math.sin(Math.PI * pz)) * (1 - pz / 2) : 0;

  const seat = seatsAround(n);
  const cellAlpha = (i: number): number => {
    const k = seat.get(i);
    const one = k === undefined ? 0 : ramp(lineAt(k) + 150, lineAt(k) + 290);
    const d = Math.hypot((i % DIE_N) - 3.5, Math.floor(i / DIE_N) - 3.5);
    return 0.92 * Math.max(one, ramp(litAt + d * 20, litAt + d * 20 + 130));
  };

  // a landed line travels as one short accent packet, never as a wire drawn across
  // the die: the tail is a fixed length behind the head, so nothing is left on the chip
  const packets: { xa: number; ya: number; x: number; y: number; o: number }[] = [];
  for (let li = 0; li < n; li++) {
    const p = (tMs - lineAt(li)) / 150;
    if (p < 0 || p > 1) continue;
    const y0 = L.codeTop + rows.findIndex((r) => r.li === li) * L.lineH + L.lineH / 2;
    const x0 = L.codeX - 0.012 * w;
    const at = (u: number) => ({ x: x0 + (slotCx - x0) * u, y: y0 + (slotCy - y0) * u });
    const a = at(Math.max(0, p - 0.22));
    const b = at(p);
    packets.push({ xa: a.x, ya: a.y, x: b.x, y: b.y, o: 1 - 0.45 * p });
  }
  const pk = 0.013 * w;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <title>the kernel fed into the chip, one line per cell</title>
        <DieGlyph x={L.dieX} y={L.dieY} size={L.S} slot={SLOT} slotPulse={pulse} cellAlpha={cellAlpha} />
        {packets.map((p, i) => (
          <g key={i}>
            <line x1={p.xa} y1={p.ya} x2={p.x} y2={p.y} stroke={ACCENT} strokeWidth={0.005 * w} strokeOpacity={0.45 * p.o} />
            <rect x={p.x - pk / 2} y={p.y - pk / 2} width={pk} height={pk} fill={ACCENT} fillOpacity={p.o} />
          </g>
        ))}
      </svg>

      {/* what the hole in the middle of the chip is */}
      <div
        style={{
          position: "absolute", left: L.slotX, top: L.slotY, width: L.slotW, height: L.slotH,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <div style={{ ...label(L.nameFs, INK), lineHeight: 1, whiteSpace: "nowrap", opacity: 0.72 + 0.28 * pulse }}>
          {data.slot}
        </div>
      </div>

      <div
        style={{
          position: "absolute", left: L.dieX, top: L.nameTop, width: L.S,
          ...label(L.nameFs, INK), lineHeight: 1.18, whiteSpace: "nowrap",
        }}
      >
        {data.name}
      </div>

      {/* the program itself: real lines, landing one at a time */}
      {rows.map((row, i) => {
        const t = tMs - lineAt(row.li);
        return (
          <CodeRow
            key={i} row={row} left={L.codeX} top={L.codeTop + i * L.lineH}
            fs={L.codeFs} lineH={L.lineH} slide={0.018 * w}
            land={ramp(lineAt(row.li), lineAt(row.li) + 110)}
            flash={t >= 0 && t < 280 ? Math.max(0, Math.min(1, t / 60, (280 - t) / 130)) : 0}
          />
        );
      })}

      <div
        style={{
          position: "absolute", left: L.P, top: L.srcTop, width: w - 2 * L.P, textAlign: "right",
          fontFamily: MONO_FONT, fontSize: L.codeFs, lineHeight: 1.25,
          color: "rgba(255,255,255,0.40)", whiteSpace: "nowrap",
          opacity: ramp(linesAt + 300, linesAt + 600),
        }}
      >
        {data.source}
      </div>
    </div>
  );
};
