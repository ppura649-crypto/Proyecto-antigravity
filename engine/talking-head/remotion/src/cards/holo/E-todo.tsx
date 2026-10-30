import React from "react";
import { Easing } from "remotion";
import { layout, type Line } from "./E-claude";
import { INK, LINE, MUTED, SANS, SERIF, clamp, mix, ramp, type BeatsE } from "./E-util";
// reference edit K hook 5 (family E), H5.2-H5.3: Claude's plan becomes another to-do list. On BECAME every bullet
// that is on screen in the reply turns in place (all together, one calm move) into a row with an empty box; the week
// headings become section labels; `0 / 23 done` sits on top. From TO-DO the list keeps growing, one row at a
// time, and scrolls on by itself. Nothing ever gets checked.

export const RV = { top: 172, left: 48 };      // the reply column inside the chat window
export const LV = { top: 112, h: 488, x: 40 }; // the list viewport inside the same 1000 x 600 window
const ROW = 52, SEC = 50;

type Row = { j: number; sec: boolean; top: number; h: number; text: string };
export const rowsOf = (lines: Line[]): Row[] => {
  let y = 0;
  return lines.flatMap((l, j) => {
    if (l.k !== "h2" && l.k !== "li") return [];
    const r = { j, sec: l.k === "h2", top: y, h: l.k === "h2" ? SEC : ROW, text: l.k === "h2" ? l.t.toUpperCase() : l.t };
    y += r.h;
    return [r];
  });
};

// which reply lines are on screen at BECAME, and where (window coords)
export const peelSet = (lines: Line[], n: number, scroll: number, vh: number) => {
  const L = layout(lines);
  const on = new Map<number, number>();
  lines.forEach((_, j) => {
    const o = L[j]!, y = RV.top + o.top - scroll;
    if (n > o.c0 && y > RV.top - o.h * 0.5 && y < RV.top + vh - o.h * 0.5) on.set(j, y);
  });
  return on;
};

const Box: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ width: mix(10, 30, f), height: mix(10, 30, f), borderRadius: mix(5, 7, f), flexShrink: 0,
    border: `${mix(5, 2.5, f)}px solid ${f < 0.5 ? MUTED : "#BDB9AE"}`, boxSizing: "border-box", background: "#fff",
    marginRight: 18, marginLeft: mix(10, 0, f) }} />
);

export const Checklist: React.FC<{ t: number; b: BeatsE; lines: Line[]; peel: Map<number, number> }> = ({ t, b, lines, peel }) => {
  const rows = rowsOf(lines);
  const ground = ramp(t, b.became!, b.became! + 320);
  const peeledIdx = rows.map((r, i) => (peel.has(r.j) ? i : -1)).filter((i) => i >= 0);
  const first = peeledIdx[0] ?? 0, last = peeledIdx[peeledIdx.length - 1] ?? -1;
  // the list opens scrolled so each peeled bullet's slot sits where the bullet already is: the bullets turn
  // into rows in place (one calm move, all together), then from TO-DO new rows keep arriving under them
  const r0 = rows[first]!;
  const S0 = peeledIdx.length ? Math.max(0, LV.top + r0.top - peel.get(r0.j)!) : 0;
  const arr = rows.map((r, i) => {
    if (peel.has(r.j)) return { at: b.became!, dur: 420, peel: true };
    if (i < first) return { at: b.became! + 120, dur: 300, peel: false };
    return { at: b.todo! + 150 * (i - last - 1), dur: 260, peel: false };
  });
  const prog = arr.map((a) => ramp(t, a.at, a.at + a.dur, Easing.inOut(Easing.cubic)));
  let bottom = 0;
  rows.forEach((r, i) => { if (prog[i]! > 0) bottom = Math.max(bottom, r.top + r.h * prog[i]!); });
  const scroll = Math.max(S0, bottom + 24 - LV.h);
  const total = rows.filter((r) => !r.sec).length;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: SANS }}>
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: ground }}>
        <div style={{ position: "absolute", left: 40, top: 26, fontSize: 34, fontWeight: 600, color: INK }}>30-day plan</div>
        <div style={{ position: "absolute", right: 40, top: 28, fontSize: 32, fontWeight: 600, color: INK }}>
          0 / {total} <span style={{ color: MUTED, fontWeight: 500 }}>done</span></div>
        <div style={{ position: "absolute", left: 40, right: 40, top: 84, height: 6, borderRadius: 3, background: "#EEECE6" }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LV.top - 8, height: 8, background: "#fff", opacity: ground }} />
      {rows.map((r, i) => {
        const p = prog[i]!;
        if (p <= 0) return null;
        const slotY = LV.top + r.top - scroll;
        const fromY = arr[i]!.peel ? peel.get(r.j)! : slotY + 22;
        const y = mix(fromY, slotY, p), x = mix(arr[i]!.peel ? RV.left : LV.x, LV.x, p);
        const lift = arr[i]!.peel ? Math.sin(Math.PI * p) : 0;
        if (y < LV.top - r.h - 10 && p >= 1) return null;
        return (
          <div key={i} style={{ position: "absolute", left: x + 6 * lift, top: y, height: r.h, right: 40, display: "flex", alignItems: "center",
            opacity: arr[i]!.peel ? 1 : p, clipPath: y < LV.top ? `inset(${LV.top - y}px 0 0 0)` : undefined,
            filter: lift > 0.05 ? `drop-shadow(0 ${8 * lift}px ${10 * lift}px rgba(0,0,0,${0.18 * lift}))` : undefined }}>
            {r.sec ? (
              <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: 1.2, color: MUTED, paddingTop: 8 }}>{r.text}</div>
            ) : (
              <>
                <Box f={arr[i]!.peel ? p : 1} />
                <div style={{ position: "relative", fontSize: 29, color: INK, whiteSpace: "nowrap" }}>
                  <span style={{ opacity: arr[i]!.peel ? clamp((p - 0.4) / 0.2) : 1 }}>{r.text}</span>
                  {arr[i]!.peel && <span style={{ position: "absolute", left: 0, top: 0, fontFamily: SERIF, fontSize: 30, opacity: 1 - clamp((p - 0.4) / 0.2) }}>{r.text}</span>}
                </div>
              </>
            )}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 70, opacity: ground,
        background: "linear-gradient(rgba(255,255,255,0), #fff)", borderTop: `0px solid ${LINE}` }} />
    </div>
  );
};
