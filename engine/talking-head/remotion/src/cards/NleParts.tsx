import React from "react";
import { interpolate, Easing } from "remotion";
import { MONO_FONT } from "./theme";

// The chrome of the editor panel in V9: the sequence-settings chip, the ruler,
// a track header, and the wrapper that lands a track on the word that names it.

const EASE = { easing: Easing.bezier(0.28, 0, 0.1, 1), extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const TXT = "#E8E8EC", DIM = "#8C8C96";

const ms = (t: number) => `${Math.floor(t / 60000)}:${String(Math.floor((t % 60000) / 1000)).padStart(2, "0")}`;

// the sequence settings, landing on "the layout": the frame this edit is cut for,
// with its safe areas drawn inside the 9:16 it names
export const Chip: React.FC<{ k: number; ky: number; text: string; tMs: number; at: number }> = ({ k, ky, text, tMs, at }) => {
  const p = interpolate(tMs, [at, at + 200], [0, 1], EASE);
  const g = interpolate(tMs, [at + 130, at + 320], [0, 1], EASE);
  if (p <= 0.01) return null;
  const iw = 26 * k, ih = 46 * ky;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 13 * k, padding: `${7 * ky}px ${14 * k}px`, background: "#2E2E36",
      opacity: p, transform: `translateX(${(1 - p) * 22 * k}px) scale(${0.88 + 0.12 * p})`, transformOrigin: "0% 50%" }}>
      <div style={{ position: "relative", width: iw, height: ih, boxShadow: `inset 0 0 0 ${2 * k}px #A6A6B0` }}>
        {[0.2, 0.8].map((f) => (
          <div key={f} style={{ position: "absolute", left: 0, top: f * ih, width: `${g * 100}%`, height: Math.max(1, 1.5 * ky), background: "#A6A6B0", opacity: 0.85 }} />
        ))}
      </div>
      <span style={{ fontFamily: MONO_FONT, fontSize: 26 * k, color: TXT, whiteSpace: "nowrap" }}>{text}</span>
    </div>
  );
};

// the time ruler. Its step follows the sequence: minutes while the raw take is
// laid out, ten seconds once the cut has fitted, the labels dipping as it rescales
export const Ruler: React.FC<{ x: number; w: number; top: number; h: number; k: number; totalMs: number; fade: number }> = ({ x, w, top, h, k, totalMs, fade }) => {
  const step = totalMs > 210000 ? 60000 : totalMs > 105000 ? 30000 : totalMs > 72000 ? 20000 : 10000;
  const ticks: number[] = [];
  for (let t = 0; t <= totalMs + 1; t += step) ticks.push(t);
  const minors: number[] = [];
  for (let t = step / 5; t < totalMs; t += step / 5) if (t % step !== 0) minors.push(t);
  return (
    <div style={{ position: "absolute", left: x, top, width: w, height: h, overflow: "hidden", borderBottom: "1px solid #2B2B33" }}>
      {minors.map((t) => (
        <div key={`m${t}`} style={{ position: "absolute", left: (t / totalMs) * w, bottom: 0, width: 1, height: 8 * (h / 32), background: "#43434D", opacity: fade }} />
      ))}
      {ticks.map((t) => {
        const tx = (t / totalMs) * w;
        return (
          <React.Fragment key={t}>
            <div style={{ position: "absolute", left: tx, bottom: 0, width: 1, height: 15 * (h / 32), background: "#61616C", opacity: fade }} />
            {tx + 66 * k < w ? (
              <span style={{ position: "absolute", left: tx + 7 * k, top: 1, fontFamily: MONO_FONT, fontSize: 24 * k, color: DIM, opacity: fade }}>{ms(t)}</span>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// one track header: its name and the two toggles every editor draws there
export const Head: React.FC<{ x: number; y: number; h: number; k: number; ky: number; name: string; on: number; dy: number }> = ({ x, y, h, k, ky, name, on, dy }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 98 * k, height: h, background: "#212126", display: "flex", alignItems: "center",
    paddingLeft: 13 * k, gap: 9 * k, opacity: Math.min(1, on * 1.3), transform: `translateY(${(1 - on) * dy}px)` }}>
    <span style={{ fontFamily: MONO_FONT, fontSize: 28 * k, fontWeight: 700, color: TXT }}>{name}</span>
    <div style={{ display: "flex", flexDirection: "column", gap: 4 * ky }}>
      <div style={{ width: 11 * k, height: 11 * ky, background: "#50505A" }} />
      <div style={{ width: 11 * k, height: 11 * ky, background: "#3A3A43" }} />
    </div>
  </div>
);

// a track that does not exist until the creator names it, then lands into its slot
export const Lane: React.FC<{ on: number; dy: number; style: React.CSSProperties; children: React.ReactNode }> = ({ on, dy, style, children }) => (
  <div style={{ ...style, opacity: Math.min(1, on * 1.3), transform: `translateY(${(1 - on) * dy}px)` }}>{children}</div>
);
