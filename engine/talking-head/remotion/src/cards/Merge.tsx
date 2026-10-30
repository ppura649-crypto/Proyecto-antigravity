import React from "react";
import { interpolate, spring } from "remotion";
import { ACCENT, MONO_FONT } from "./theme";
import { Head } from "./Head";
import { Mascot } from "./Mascot";

// "At the end, the main Claude in charge merges all the answers."
// Ten finished answers fan out like a hand of cards, hold so you can count
// them, then slide together into ONE on the word "merges". It is the only card
// in the video where things travel inward, which is the whole sentence, and it
// closes the shape the tree opened without drawing the tree again.
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const Merge: React.FC<{
  tMs: number; w: number; h: number; fps: number; fromMs: number;
  head: string; sheets?: number; label: string;
  startMs?: number; perMs?: number; landAtMs?: number;
}> = ({ tMs, w, h, fps, fromMs, head, sheets = 10, label, startMs, perMs = 70, landAtMs }) => {
  const pad = 0.045 * w;
  const start = startMs ?? fromMs + 200;
  const land = landAtMs ?? start + sheets * perMs + 700;

  const sw = 0.135 * w;
  const sh = sw * 1.34;
  const cx = w / 2;
  const cy = 0.575 * h;
  const icon = 0.10 * w;

  // the fan: ten cards across the plate, overlapping, tilted along the arc
  const pitch = (w - 2 * pad - sw) / (sheets - 1);
  const mid = (sheets - 1) / 2;

  const sp = (ms: number, d = 14, st = 260) => spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping: d, stiffness: st, mass: 0.7 } });
  const gather = interpolate(tMs, [land, land + 620], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const done = sp(land + 520, 13, 300);
  const iconIn = sp(fromMs + 80);

  const bigW = sw * 1.42;
  const bigH = sh * 1.42;

  return (
    <div style={{ position: "absolute", inset: 0, padding: pad, boxSizing: "border-box" }}>
      <Head w={w} left={head} right={`${sheets} answers`} />
      <div style={{ position: "absolute", left: cx - icon / 2, top: 0.135 * h, opacity: Math.min(1, iconIn * 2), transform: `scale(${0.82 + 0.18 * iconIn})` }}>
        <Mascot size={icon} />
      </div>

      {Array.from({ length: sheets }).map((_, i) => {
        const inS = sp(start + i * perMs, 13, 320);
        if (inS <= 0) return null;
        const off = i - mid;
        const x0 = pad + i * pitch;
        const y0 = cy - sh / 2 + Math.abs(off) * 0.012 * h;
        const x1 = cx - sw / 2 + off * 0.0035 * w;
        const y1 = cy - sh / 2 - Math.abs(off) * 0.002 * h;
        const rot0 = off * 2.6;
        return (
          <div key={i} style={{
            position: "absolute",
            left: lerp(x0, x1, gather), top: lerp(y0, y1, gather),
            width: sw, height: sh, backgroundColor: "#f6f4f0",
            transform: `rotate(${lerp(rot0, off * 0.4, gather)}deg) scale(${0.86 + 0.14 * inS})`,
            boxShadow: "0 8px 22px rgba(0,0,0,0.55)",
            opacity: Math.min(1, inS * 2.2) * (1 - 0.9 * Math.max(0, (gather - 0.72) / 0.28)),
            padding: sw * 0.12, boxSizing: "border-box", zIndex: 10 - Math.abs(off),
          }}>
            <div style={{ height: sh * 0.05, width: "72%", backgroundColor: ACCENT, marginBottom: sh * 0.07 }} />
            {[0.92, 0.78, 0.86, 0.6].map((f, k) => (
              <div key={k} style={{ height: sh * 0.042, width: `${f * 100}%`, backgroundColor: "#cbc7bf", marginBottom: sh * 0.048 }} />
            ))}
          </div>
        );
      })}

      {done > 0.02 && (
        <div style={{
          position: "absolute", left: cx - bigW / 2, top: cy - bigH / 2, zIndex: 20,
          width: bigW, height: bigH, backgroundColor: "#ffffff",
          boxShadow: "0 16px 44px rgba(0,0,0,0.65)",
          transform: `scale(${0.88 + 0.12 * done})`, opacity: Math.min(1, done * 2),
          padding: bigW * 0.11, boxSizing: "border-box",
        }}>
          <div style={{ height: bigH * 0.048, width: "78%", backgroundColor: ACCENT, marginBottom: bigH * 0.062 }} />
          {[0.94, 0.82, 0.9, 0.72, 0.58].map((f, k) => (
            <div key={k} style={{ height: bigH * 0.040, width: `${f * 100}%`, backgroundColor: "#c2beb6", marginBottom: bigH * 0.046 }} />
          ))}
        </div>
      )}

      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0.028 * h, textAlign: "center",
        fontFamily: MONO_FONT, fontSize: 0.030 * w, color: ACCENT, zIndex: 30,
        opacity: interpolate(tMs, [land + 700, land + 1000], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}>{label}</div>
    </div>
  );
};
