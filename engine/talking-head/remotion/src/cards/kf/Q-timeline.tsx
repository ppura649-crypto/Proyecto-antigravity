import React from "react";
import { staticFile } from "remotion";
import { GREEN, MONO, SANS, clamp } from "./Q-util";
// keyframes-v1 V6: the editor timeline of THIS video, from its own json: the take cut into its 28 kept pieces
// (spine-map.json, frames of the real take in each piece), the caption pages as word blocks (captions.json,
// the accent words green), the visual layer (visual-plan.md rows) and a running playhead. Drawn in two leaves
// (top: header, overview, ruler, visual lanes; bottom: take + captions) so it can unfold like paper.

export type TLData = {
  durMs: number; segs: [number, number][]; pages: [number, number, string, number][];
  vis: [number, number, string, number][]; // from, to, label, lane (0 top band, 1 low band)
  view: [number, number]; strip: { file: string; t0: number; step: number; n: number; w: number; h: number };
};
export const PW = 1000, LX = 104; // panel width, lanes start
export const WH = 262, H1 = 138, H2 = 138; // window height once forward, the two leaves
const TW = PW - LX - 10;
const BG = "#1B1B1E", LANE = "#232327", EDGE = "#303036", INK = "#E4E4E7", MUT = "#8E8E96";

const tc = (ms: number) => {
  const f = Math.floor((ms / 1000) * 30), s = Math.floor(f / 30);
  const p = (n: number) => String(n).padStart(2, "0");
  return `00:00:${p(s)}:${p(f % 30)}`;
};

const LaneLabel: React.FC<{ y: number; h: number; text: string }> = ({ y, h, text }) => (
  <div style={{ position: "absolute", left: 0, top: y, width: LX - 6, height: h, background: "#202024",
    borderRight: `1px solid ${EDGE}`, display: "flex", alignItems: "center", paddingLeft: 12, boxSizing: "border-box",
    fontFamily: SANS, fontWeight: 600, fontSize: 16, color: MUT }}>{text}</div>
);

// x of spine ms in the zoomed view
const xOf = (d: TLData, ms: number) => LX + ((ms - d.view[0]) / (d.view[1] - d.view[0])) * TW;

export const Leaf1: React.FC<{ d: TLData; t: number }> = ({ d, t }) => {
  const oX = (ms: number) => LX + (ms / d.durMs) * TW;
  const ph = xOf(d, t);
  const secs: number[] = [];
  for (let s = Math.ceil(d.view[0] / 1000); s * 1000 <= d.view[1]; s++) secs.push(s);
  const ticks: number[] = [];
  for (let m = Math.ceil(d.view[0] / 250) * 250; m <= d.view[1]; m += 250) ticks.push(m);
  return (
    <div style={{ position: "absolute", inset: 0, background: BG, overflow: "hidden" }}>
      {/* header: sequence tab, the edit's real numbers, the running timecode */}
      <div style={{ position: "absolute", left: 0, top: 0, width: PW, height: 40, borderBottom: `1px solid ${EDGE}`,
        display: "flex", alignItems: "center", fontFamily: SANS, fontSize: 17, color: MUT }}>
        <div style={{ height: 40, padding: "0 16px", display: "flex", alignItems: "center", color: INK, fontWeight: 600,
          background: LANE, borderRight: `1px solid ${EDGE}` }}>keyframes-v1</div>
        <div style={{ marginLeft: 18 }}>28 cuts · 172 captions · 0:43</div>
        <div style={{ marginLeft: "auto", marginRight: 16, fontFamily: MONO, fontSize: 22, color: INK, letterSpacing: 0.5 }}>{tc(t)}</div>
      </div>
      {/* overview: the whole 0:43, every kept piece, the zoomed window, the playhead */}
      <LaneLabel y={40} h={30} text="0:43" />
      <div style={{ position: "absolute", left: LX, top: 48, width: TW, height: 14 }}>
        {d.segs.map(([a, b], i) => (
          <div key={i} style={{ position: "absolute", left: oX(a) - LX + 0.5, width: Math.max(1, oX(b) - oX(a) - 1), top: 0, height: 14,
            background: i % 2 ? "#5B6070" : "#737A8C" }} />
        ))}
        <div style={{ position: "absolute", left: oX(d.view[0]) - LX, width: oX(d.view[1]) - oX(d.view[0]), top: -4, height: 22,
          border: "1.5px solid rgba(255,255,255,0.8)", boxSizing: "border-box" }} />
        <div style={{ position: "absolute", left: oX(t) - LX - 1, top: -6, width: 2, height: 26, background: "#fff" }} />
      </div>
      {/* ruler */}
      <div style={{ position: "absolute", left: 0, top: 70, width: PW, height: 26, borderTop: `1px solid ${EDGE}`, borderBottom: `1px solid ${EDGE}`, background: "#18181B" }}>
        {ticks.map((m) => <div key={m} style={{ position: "absolute", left: xOf(d, m), bottom: 0, width: 1, height: m % 1000 === 0 ? 12 : 6, background: "#55555C" }} />)}
        {secs.map((s) => <div key={s} style={{ position: "absolute", left: xOf(d, s * 1000) + 4, top: 1, fontFamily: MONO, fontSize: 14, color: MUT }}>{`0:${String(s).padStart(2, "0")}`}</div>)}
      </div>
      {/* the visual layer */}
      <div style={{ position: "absolute", left: LX, top: 96, width: TW + 10, height: 42, background: LANE }} />
      {d.vis.filter((v) => v[3] === 1 && v[1] > d.view[0] && v[0] < d.view[1]).map((v, i) => {
        const x0 = Math.max(LX, xOf(d, v[0])), x1 = Math.min(PW, xOf(d, v[1]));
        return (
          <div key={i} style={{ position: "absolute", left: x0 + 1, top: 101, width: x1 - x0 - 2, height: 32, background: "#3A4150",
            borderLeft: "3px solid #8D97AD", boxSizing: "border-box", overflow: "hidden", fontFamily: SANS, fontWeight: 600,
            fontSize: 16, color: "#DCE1EA", padding: "6px 9px", whiteSpace: "nowrap" }}>{v[2]}</div>
        );
      })}
      <LaneLabel y={96} h={42} text="Visuals" />
      <div style={{ position: "absolute", left: ph - 1, top: 70, width: 2, height: H1 - 70, background: "#fff" }} />
      <div style={{ position: "absolute", left: ph - 8, top: 70, width: 0, height: 0, borderLeft: "8px solid transparent",
        borderRight: "8px solid transparent", borderTop: "12px solid #fff" }} />
    </div>
  );
};

export const Leaf2: React.FC<{ d: TLData; t: number }> = ({ d, t }) => {
  const ph = xOf(d, t);
  const s = d.strip, th = 72, tw = (s.w * th) / s.h, pxMs = TW / (d.view[1] - d.view[0]);
  const sheet = staticFile(s.file);
  return (
    <div style={{ position: "absolute", inset: 0, background: BG, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: LX, top: 0, width: TW + 10, height: 84, background: LANE, borderBottom: `1px solid ${EDGE}` }} />
      {d.segs.filter(([a, b]) => b > d.view[0] && a < d.view[1]).map(([a, b], i) => {
        const x0 = xOf(d, a), x1 = xOf(d, b);
        const ks: number[] = [];
        for (let k = 0; k < s.n; k++) { const m = s.t0 + k * s.step; if (m + s.step > a && m < b) ks.push(k); }
        return (
          <div key={i} style={{ position: "absolute", left: x0 + 1, top: 5, width: x1 - x0 - 2, height: 76, overflow: "hidden",
            background: "#2D3B4E", outline: "1px solid #587399", outlineOffset: -1 }}>
            {ks.map((k) => (
              <div key={k} style={{ position: "absolute", left: (s.t0 + k * s.step - a) * pxMs, top: 2, width: s.step * pxMs + 0.5, height: th,
                backgroundImage: `url(${sheet})`, backgroundSize: `${tw * s.n}px ${th}px`, backgroundPosition: `${-k * tw - (tw - s.step * pxMs) / 2}px 0`,
                opacity: 0.92 }} />
            ))}
            <div style={{ position: "absolute", left: 0, top: 0, padding: "2px 6px", background: "rgba(20,24,32,0.78)",
              fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "#C9D6EA", whiteSpace: "nowrap" }}>source.mov</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: LX, top: 84, width: TW + 10, height: 54, background: LANE }} />
      {d.pages.filter((p) => p[1] > d.view[0] && p[0] < d.view[1]).map((p, i) => {
        const x0 = xOf(d, p[0]), x1 = xOf(d, p[1]), acc = p[3] > 0;
        return (
          <div key={i} style={{ position: "absolute", left: x0 + 1, top: 91, width: Math.max(2, x1 - x0 - 2), height: 40,
            background: acc ? GREEN : "#44444C", color: acc ? "#07260F" : INK, overflow: "hidden", whiteSpace: "nowrap",
            fontFamily: SANS, fontWeight: 700, fontSize: 17, display: "flex", alignItems: "center", paddingLeft: 6, boxSizing: "border-box" }}>{p[2]}</div>
        );
      })}
      <LaneLabel y={0} h={84} text="Take" />
      <LaneLabel y={84} h={54} text="Captions" />
      <div style={{ position: "absolute", left: ph - 1, top: 0, width: 2, height: H2, background: "#fff", boxShadow: "0 0 6px rgba(0,0,0,0.6)" }} />
    </div>
  );
};

export const leafShade = (deg: number) => clamp(Math.abs(Math.sin((deg * Math.PI) / 180)) * 0.6);
