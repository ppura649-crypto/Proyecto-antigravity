// The hidden audio graph from the developer's post, drawn under the translucent page: Sawtooth oscillator ->
// AnalyserNode -> ScriptProcessorNode -> GainNode (zero) -> AudioContext.destination. One row per node, each with a
// live scope of the signal at that point; pulses run down the wires. The Gain rolls to 0 and everything after it
// goes flat. Source: blog.laserphile.com/2026/08/aliexpress-webpage-keeping-multipoint.html
import React from "react";
import { blurIn, draw, ease, prog, useScene } from "../../../src/engine";
import { CHAIN, WAVE } from "./parts";

export const ROW = { top: 18, h: 104, gap: 40, left: 34, width: 832 };
const rowY = (i: number) => ROW.top + i * (ROW.h + ROW.gap);
const ICON_X = ROW.left + 22 + 36; // centre of the icon disc
const SCOPE = { w: 270, h: 72 };
const GREY = "#4A4B50";

const SUB = ["OscillatorNode · sawtooth", "reads frequency data", "ScriptProcessorNode", "GainNode", "AudioContext.destination"];

/** a sawtooth, scrolling left to right, amplitude a (0..1) */
const saw = (w: number, h: number, a: number, phase: number, period = 72) => {
  const pts: string[] = [];
  const mid = h / 2;
  const amp = (h / 2 - 8) * a;
  const start = -((phase % period) + period);
  for (let x = start; x < w + period; x += period) {
    pts.push(`${x.toFixed(1)},${(mid + amp).toFixed(1)}`, `${(x + period).toFixed(1)},${(mid - amp).toFixed(1)}`);
  }
  return "M" + pts.join(" L");
};

const Glyph: React.FC<{ i: number; color: string; loud: number }> = ({ i, color, loud }) => {
  const p = { fill: "none", stroke: color, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const g = [
    <path key={0} d="M3 17L10 7v10l7-10v10l4-6" {...p} />,
    <path key={1} d="M4 20V10M9 20V6M14 20v-7M19 20v-4" {...p} />,
    <g key={2}><rect x={6} y={6} width={12} height={12} rx={2} {...p} /><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" {...p} /></g>,
    <g key={3}><path d="M4 7h16M4 17h16" {...p} /><circle cx={8 + 8 * loud} cy={7} r={2.6} fill={color} /><circle cx={10} cy={17} r={2.6} fill={color} /></g>,
    <g key={4}><path d="M4 9h4l5-4v14l-5-4H4z" {...p} /><path d="M16.5 9a4 4 0 0 1 0 6" {...p} opacity={loud} /><path d="M19 6.5a7.5 7.5 0 0 1 0 11" {...p} opacity={loud} /></g>,
  ];
  return <svg width={44} height={44} viewBox="0 0 24 24">{g[i]}</svg>;
};

/** the analyser's reading: a sawtooth's harmonics fall as 1/n, so the bars do too */
const Spectrum: React.FC<{ f: number; reveal: number }> = ({ f, reveal }) => (
  <svg width={SCOPE.w} height={SCOPE.h}>
    {Array.from({ length: 14 }, (_, n) => {
      const h = (SCOPE.h - 14) * (1 / (n + 1)) * (0.92 + 0.08 * Math.sin(f * 0.35 + n * 1.7));
      const x = 12 + n * 18.2;
      return x / SCOPE.w <= reveal ? <rect key={n} x={x} y={SCOPE.h - 7 - h} width={11} height={Math.max(2, h)} rx={2} fill={WAVE} /> : null;
    })}
  </svg>
);

const Scope: React.FC<{ i: number; amp: number; at: number }> = ({ i, amp, at }) => {
  const { f } = useScene();
  const reveal = prog(f, at + 4, 16, ease.out);
  const flat = amp < 0.02;
  return (
    <div style={{ width: SCOPE.w, height: SCOPE.h, borderRadius: 12, background: "#0B0B0D", overflow: "hidden", flex: "none" }}>
      {i === 1 ? (
        <Spectrum f={f} reveal={reveal} />
      ) : (
        <svg width={SCOPE.w} height={SCOPE.h} style={{ clipPath: `inset(0 ${((1 - reveal) * 100).toFixed(1)}% 0 0)` }}>
          <line x1={0} x2={SCOPE.w} y1={SCOPE.h / 2} y2={SCOPE.h / 2} stroke="#26272B" strokeWidth={2} />
          <path d={saw(SCOPE.w, SCOPE.h, amp, f * 3.2 - i * 18)} fill="none" stroke={flat ? GREY : WAVE} strokeWidth={4} strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
};

/** node i: its disc, its name at reading size, its real API name as texture, the scope */
const Node: React.FC<{ i: number; at: number; amp: number; gain?: string; ring: number }> = ({ i, at, amp, gain, ring }) => {
  const { f, theme } = useScene();
  const live = amp > 0.02;
  return (
    <div
      style={{
        position: "absolute", left: ROW.left, top: rowY(i), width: ROW.width, height: ROW.h, boxSizing: "border-box",
        borderRadius: 16, background: "#1C1D21", border: `2px solid ${ring > 0 ? mixRing(ring) : "#303136"}`,
        display: "flex", alignItems: "center", gap: 20, padding: "0 16px 0 22px", fontFamily: theme.font.ui,
        boxShadow: ring > 0 ? `0 0 ${(28 * ring).toFixed(0)}px rgba(138,180,255,${(0.35 * ring).toFixed(2)})` : undefined,
        ...blurIn(f, at, { dur: 9, rise: 26, blur: 14 }),
      }}
    >
      <div style={{ width: 72, height: 72, borderRadius: 99, background: "#101114", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <Glyph i={i} color={live || i < 3 ? WAVE : GREY} loud={amp} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: "#F2F2F2", lineHeight: "42px", whiteSpace: "nowrap", display: "flex", alignItems: "baseline", gap: 16 }}>
          {CHAIN[i]}
          {gain !== undefined && <span style={{ fontFamily: theme.font.mono, fontSize: 40, color: amp < 0.02 ? "#FFFFFF" : WAVE, fontVariantNumeric: "tabular-nums" }}>{gain}</span>}
        </div>
        <div style={{ fontFamily: theme.font.mono, fontSize: 26, color: "#8C8C8C", marginTop: 4, whiteSpace: "nowrap" }}>{SUB[i]}</div>
      </div>
      <Scope i={i} amp={amp} at={at} />
    </div>
  );
};

const mixRing = (k: number) => {
  const a = [0x30, 0x31, 0x36];
  const b = [0x8a, 0xb4, 0xff];
  return "#" + a.map((v, j) => Math.round(v + (b[j] - v) * k).toString(16).padStart(2, "0")).join("");
};

/** the wire from row i to row i+1, drawn when row i+1 arrives, pulses running down while signal flows */
const Wire: React.FC<{ i: number; at: number; flowing: boolean }> = ({ i, at, flowing }) => {
  const { f } = useScene();
  const y0 = rowY(i) + ROW.h;
  const y1 = rowY(i + 1);
  const t = ((f - at) % 18) / 18;
  return (
    <svg width={ROW.width} height={y1 - y0 + 4} style={{ position: "absolute", left: 0, top: y0 - 2, overflow: "visible" }}>
      <path d={`M${ICON_X},2 L${ICON_X},${y1 - y0 + 2}`} stroke={flowing ? WAVE : GREY} strokeWidth={4} fill="none" strokeLinecap="round" {...draw(f, at - 2, 8)} />
      {flowing && f > at + 6 && <circle cx={ICON_X} cy={2 + t * (y1 - y0)} r={7} fill="#FFFFFF" />}
    </svg>
  );
};

/** the whole graph. `at[i]` = the frame node i arrives; `gain` = the Gain value now (1 to 0); `ring` = the Gain row's highlight */
export const SoundChain: React.FC<{ at: number[]; gain: number; ring: number }> = ({ at, gain, ring }) => {
  const { f } = useScene();
  const shown = gain <= 0 ? "0" : gain.toFixed(2);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 900, height: 740 }}>
      {at.slice(1).map((a, i) => f >= a - 2 && <Wire key={i} i={i} at={a} flowing={i < 3 || gain > 0.02} />)}
      {at.map((a, i) =>
        f >= a ? <Node key={i} i={i} at={a} amp={i >= 3 ? gain : 1} gain={i === 3 ? shown : undefined} ring={i === 3 ? ring : 0} /> : null,
      )}
    </div>
  );
};
