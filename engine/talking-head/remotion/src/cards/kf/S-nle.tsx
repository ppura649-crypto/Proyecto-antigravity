import React from "react";
import { Img, staticFile } from "remotion";
import { MONO, SANS, hash } from "./S-util";
// V12's object: a crowded pro editing window, generic (no brand, no product name). Real footage in the viewer and
// in the clip thumbnails (frames of this very video). The export dialog renders THIS video's real numbers
// (0:43 at 60 fps = 2,566 frames) and its bar crawls. Everything else is a still of a busy edit.

export const NW = 1000, NH = 522;
const BG = "#1b1c1f", PANEL = "#232428", LINE = "#34353b", TXT = "#c9cad1", DIM = "#7d7f88";
const TITLE_H = 26, TABS_H = 24, UP_H = 214;
const TL_Y = TITLE_H + TABS_H + UP_H; // timeline top
const HEAD_W = 78;

const Thumb: React.FC<{ src: string; k: number; w: number; h: number; left: number }> = ({ src, k, w, h, left }) => (
  <div style={{ position: "absolute", left, top: 0, width: w, height: h, overflow: "hidden", borderRight: "1px solid rgba(0,0,0,0.35)" }}>
    <Img src={src} style={{ position: "absolute", left: -(k % 8) * w, top: 0, width: w * 8, height: h }} />
  </div>
);

const Diamond: React.FC<{ x: number; y: number; s?: number; c?: string }> = ({ x, y, s = 7, c = "#e8e8ee" }) => (
  <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, background: c,
    transform: "rotate(45deg)", boxShadow: "0 0 0 1px rgba(0,0,0,0.55)" }} />
);

type Clip = { x: number; w: number; label: string; kind: "v" | "t" | "g" | "a" | "m" | "s"; kf?: number[] };
type Track = { name: string; h: number; clips: Clip[] };
const TRACKS: Track[] = [
  { name: "V4", h: 18, clips: [{ x: 8, w: 120, label: "Caption 01", kind: "t" }, { x: 132, w: 96, label: "Caption 02", kind: "t" },
    { x: 232, w: 140, label: "Caption 03", kind: "t" }, { x: 376, w: 88, label: "Caption 04", kind: "t" },
    { x: 468, w: 150, label: "Caption 05", kind: "t" }, { x: 622, w: 110, label: "Caption 06", kind: "t" }, { x: 736, w: 150, label: "Caption 07", kind: "t" }] },
  { name: "V3", h: 18, clips: [{ x: 60, w: 170, label: "Zoom 110%", kind: "g", kf: [84, 150] },
    { x: 300, w: 120, label: "Adjustment layer", kind: "g", kf: [100] }, { x: 520, w: 190, label: "Lower third", kind: "g", kf: [80, 172] }] },
  { name: "V2", h: 26, clips: [{ x: 150, w: 118, label: "broll_desk.mov", kind: "v", kf: [96] }, { x: 440, w: 96, label: "screen_rec.mov", kind: "v" },
    { x: 700, w: 150, label: "broll_02.mov", kind: "v", kf: [96, 132] }] },
  { name: "V1", h: 34, clips: [{ x: 0, w: 142, label: "take_01.mov", kind: "v", kf: [84, 124] }, { x: 144, w: 88, label: "take_01.mov", kind: "v" },
    { x: 234, w: 170, label: "take_02.mov", kind: "v", kf: [110] }, { x: 406, w: 64, label: "take_02", kind: "v" },
    { x: 472, w: 196, label: "take_03.mov", kind: "v", kf: [96, 160] }, { x: 670, w: 120, label: "take_03.mov", kind: "v" }, { x: 792, w: 130, label: "take_04.mov", kind: "v" }] },
  { name: "A1", h: 30, clips: [{ x: 0, w: 142, label: "take_01.wav", kind: "a" }, { x: 144, w: 88, label: "take_01.wav", kind: "a" },
    { x: 234, w: 170, label: "take_02.wav", kind: "a" }, { x: 406, w: 64, label: "take_02", kind: "a" }, { x: 472, w: 196, label: "take_03.wav", kind: "a" },
    { x: 670, w: 120, label: "take_03.wav", kind: "a" }, { x: 792, w: 130, label: "take_04.wav", kind: "a" }] },
  { name: "A2", h: 22, clips: [{ x: 0, w: 922, label: "music_bed_v3.wav", kind: "m", kf: [110, 150, 420, 470, 880] }] },
  { name: "A3", h: 18, clips: [{ x: 100, w: 30, label: "whoosh", kind: "s" }, { x: 296, w: 26, label: "pop", kind: "s" },
    { x: 436, w: 34, label: "whoosh", kind: "s" }, { x: 612, w: 24, label: "click", kind: "s" }, { x: 760, w: 40, label: "riser", kind: "s" }] },
  { name: "A4", h: 18, clips: [{ x: 230, w: 180, label: "room_tone.wav", kind: "s" }, { x: 600, w: 150, label: "room_tone.wav", kind: "s" }] },
];
const COL: Record<Clip["kind"], [string, string]> = {
  v: ["#3f5fa8", "#5476c4"], t: ["#8a4fa3", "#a566c0"], g: ["#b07a2e", "#c8913f"],
  a: ["#2f8f6a", "#3aa87d"], m: ["#2d7f8f", "#3a98aa"], s: ["#6b8a36", "#80a444"],
};

const Wave: React.FC<{ w: number; h: number; seed: number; c: string }> = ({ w, h, seed, c }) => {
  const n = Math.max(8, Math.floor(w / 2.2));
  let d = "";
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * w;
    const a = (0.25 + 0.75 * hash(seed * 31 + i) * (0.6 + 0.4 * Math.sin(i / 5 + seed))) * (h / 2 - 2);
    d += `M${x.toFixed(1)} ${(h / 2 - a).toFixed(1)}V${(h / 2 + a).toFixed(1)}`;
  }
  return <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}><path d={d} stroke={c} strokeWidth={1.2} /></svg>;
};

const ClipBox: React.FC<{ c: Clip; h: number; seed: number; thumbs: string }> = ({ c, h, seed, thumbs }) => {
  const [bg, top] = COL[c.kind];
  const tw = Math.round(h * (120 / 213));
  return (
    <div style={{ position: "absolute", left: c.x, top: 1, width: c.w - 2, height: h - 2, overflow: "hidden",
      background: `linear-gradient(180deg, ${top}, ${bg})`, border: "1px solid rgba(0,0,0,0.5)" }}>
      {c.kind === "v" && Array.from({ length: Math.ceil(c.w / tw) }, (_, i) => (
        <Thumb key={i} src={thumbs} k={seed + i} w={tw} h={h - 2} left={i * tw} />
      ))}
      {(c.kind === "a" || c.kind === "m" || c.kind === "s") && <Wave w={c.w - 2} h={h - 2} seed={seed} c="rgba(215,255,235,0.75)" />}
      <div style={{ position: "absolute", left: 3, top: c.kind === "v" ? 1 : Math.max(0, (h - 14) / 2 - 1), fontFamily: SANS, fontSize: 9.5,
        fontWeight: 600, color: "#fff", whiteSpace: "nowrap", textShadow: "0 1px 2px rgba(0,0,0,0.8)",
        background: c.kind === "v" ? "rgba(20,30,60,0.6)" : undefined, padding: c.kind === "v" ? "0 3px" : 0 }}>{c.label}</div>
      {(c.kf ?? []).map((x, i) => <Diamond key={i} x={x} y={c.kind === "v" ? h * 0.62 : h / 2} s={7} />)}
      {c.kind === "m" && (
        <svg width={c.w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          <polyline points={(c.kf ?? []).map((x, i) => `${x},${i % 2 ? h * 0.3 : h * 0.62}`).join(" ")} fill="none" stroke="#ffd166" strokeWidth={1.4} />
        </svg>
      )}
    </div>
  );
};

const PROPS: { name: string; val: string; kf: number[]; head?: boolean }[] = [
  { name: "Transform", val: "", kf: [], head: true },
  { name: "Position", val: "540.0   960.0", kf: [14, 62, 118] },
  { name: "Scale", val: "112.5 %", kf: [14, 40, 90, 150] },
  { name: "Rotation", val: "0.0°", kf: [] },
  { name: "Anchor Point", val: "540.0   960.0", kf: [] },
  { name: "Opacity", val: "100.0 %", kf: [8, 160] },
  { name: "Color Wheels", val: "", kf: [], head: true },
  { name: "Exposure", val: "+0.35", kf: [30, 110] },
  { name: "Contrast", val: "12.0", kf: [] },
  { name: "Saturation", val: "108.0", kf: [70] },
  { name: "Sharpen", val: "24", kf: [] },
  { name: "Noise Reduction", val: "Medium", kf: [] },
];

export const Nle: React.FC<{ t: number; t0: number; thumbs: string; viewer: string }> = ({ t, t0, thumbs, viewer }) => {
  const el = Math.max(0, t - t0) / 1000;
  const done = 214 + Math.floor(el * 11);           // frames rendered: a crawl
  const pct = (done / 2566) * 100;
  const remain = 2472 + Math.floor(el * 3.4);       // seconds left, going the wrong way
  const hh = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const phX = HEAD_W + 452;                          // playhead in the timeline
  let ty = TL_Y + 24;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: NW, height: NH, background: BG, overflow: "hidden", fontFamily: SANS, color: TXT }}>
      {/* title bar */}
      <div style={{ position: "absolute", left: 0, top: 0, width: NW, height: TITLE_H, background: "linear-gradient(180deg, #2c2d31, #26272b)", borderBottom: `1px solid ${LINE}` }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
          <div key={c} style={{ position: "absolute", left: 12 + i * 18, top: 8, width: 11, height: 11, borderRadius: 6, background: c }} />
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, top: 6, textAlign: "center", fontSize: 11.5, fontWeight: 600, color: "#b8b9c0" }}>
          reel_final_v7 · Timeline 1 · 1080 x 1920 · 60 fps
        </div>
      </div>
      {/* workspace tabs */}
      <div style={{ position: "absolute", left: 0, top: TITLE_H, width: NW, height: TABS_H, background: PANEL, borderBottom: `1px solid ${LINE}`,
        display: "flex", alignItems: "center", gap: 22, paddingLeft: 16, fontSize: 11, fontWeight: 600 }}>
        {["Media", "Edit", "Color", "Effects", "Audio", "Graphics", "Export"].map((n) => (
          <span key={n} style={{ color: n === "Edit" ? "#fff" : DIM, borderBottom: n === "Edit" ? "2px solid #5b8cff" : "none", paddingBottom: 2 }}>{n}</span>
        ))}
        <span style={{ marginLeft: "auto", marginRight: 14, fontFamily: MONO, fontSize: 10.5, color: DIM }}>Autosave 2 min ago</span>
      </div>
      {/* project bin */}
      <div style={{ position: "absolute", left: 0, top: TITLE_H + TABS_H, width: 230, height: UP_H, background: PANEL, borderRight: `1px solid ${LINE}` }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, padding: "6px 10px", color: "#e3e4ea", borderBottom: `1px solid ${LINE}` }}>Project · 46 items</div>
        {["take_01.mov", "take_02.mov", "take_03.mov", "take_04.mov", "broll_desk.mov", "screen_rec.mov"].map((n, i) => (
          <div key={n} style={{ position: "absolute", left: 10 + (i % 3) * 72, top: 30 + Math.floor(i / 3) * 90, width: 66 }}>
            <div style={{ position: "relative", width: 66, height: 62, overflow: "hidden", background: "#111", border: `1px solid ${LINE}` }}>
              <Thumb src={thumbs} k={i * 3 + 1} w={35} h={62} left={15} />
              <div style={{ position: "absolute", right: 2, bottom: 2, fontFamily: MONO, fontSize: 8, color: "#fff", background: "rgba(0,0,0,0.7)", padding: "0 2px" }}>
                {["1:29", "0:52", "1:04", "0:38", "0:12", "0:21"][i]}
              </div>
            </div>
            <div style={{ fontSize: 8.5, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", color: DIM }}>{n}</div>
          </div>
        ))}
      </div>
      {/* viewer */}
      <div style={{ position: "absolute", left: 230, top: TITLE_H + TABS_H, width: 330, height: UP_H, background: "#101113", borderRight: `1px solid ${LINE}` }}>
        <Img src={viewer} style={{ position: "absolute", left: (330 - 104) / 2, top: 8, width: 104, height: 185, objectFit: "cover" }} />
        <div style={{ position: "absolute", left: (330 - 104) / 2, top: 8, width: 104, height: 185, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)" }} />
        {/* safe-area guides over the frame */}
        <div style={{ position: "absolute", left: (330 - 104) / 2 + 8, top: 20, width: 88, height: 161, border: "1px dashed rgba(255,255,255,0.25)" }} />
        <div style={{ position: "absolute", left: 10, bottom: 5, fontFamily: MONO, fontSize: 10.5, color: "#f0c24b" }}>00:00:21:14</div>
        <div style={{ position: "absolute", right: 10, bottom: 5, fontFamily: MONO, fontSize: 10.5, color: DIM }}>Fit · Full</div>
      </div>
      {/* effect controls with keyframe lanes */}
      <div style={{ position: "absolute", left: 560, top: TITLE_H + TABS_H, width: NW - 560, height: UP_H, background: PANEL }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, padding: "6px 10px", color: "#e3e4ea", borderBottom: `1px solid ${LINE}` }}>Effect Controls · take_03.mov</div>
        {PROPS.map((p, i) => (
          <div key={p.name} style={{ position: "absolute", left: 0, top: 26 + i * 15.4, width: NW - 560, height: 15, fontSize: 9.5,
            background: p.head ? "#2a2b30" : i % 2 ? "#25262a" : PANEL }}>
            <span style={{ position: "absolute", left: p.head ? 8 : 20, top: 1.5, fontWeight: p.head ? 700 : 500, color: p.head ? "#e3e4ea" : TXT }}>
              {p.head ? "▾ " : ""}{p.name}
            </span>
            {!p.head && <span style={{ position: "absolute", left: 118, top: 1.5, fontFamily: MONO, fontSize: 9, color: "#6fa8ff" }}>{p.val}</span>}
            {!p.head && <div style={{ position: "absolute", left: 206, top: 7, width: 216, height: 1, background: LINE }} />}
            {p.kf.map((x, k) => <Diamond key={k} x={206 + x * 1.3} y={7.5} s={6} c={k === 1 ? "#6fa8ff" : "#d9dae0"} />)}
          </div>
        ))}
        <div style={{ position: "absolute", left: 206 + 96, top: 24, width: 1, height: UP_H - 24, background: "#e5484d" }} />
      </div>
      {/* timeline */}
      <div style={{ position: "absolute", left: 0, top: TL_Y, width: NW, height: NH - TL_Y, background: "#17181b", borderTop: `1px solid ${LINE}` }}>
        <div style={{ position: "absolute", left: HEAD_W, top: 0, right: 0, height: 22, borderBottom: `1px solid ${LINE}`, background: "#1f2024" }}>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: i * 96, top: 0, height: 22 }}>
              <div style={{ position: "absolute", left: 0, top: 12, width: 1, height: 10, background: "#55565e" }} />
              <span style={{ position: "absolute", left: 3, top: 3, fontFamily: MONO, fontSize: 8.5, color: DIM, whiteSpace: "nowrap" }}>
                00:00:{String(i * 5).padStart(2, "0")}:00
              </span>
              {[1, 2, 3, 4].map((k) => <div key={k} style={{ position: "absolute", left: k * 19.2, top: 17, width: 1, height: 5, background: "#3c3d44" }} />)}
            </div>
          ))}
        </div>
      </div>
      {TRACKS.map((tr, ti) => {
        const y = ty;
        ty += tr.h + 2;
        return (
          <div key={tr.name} style={{ position: "absolute", left: 0, top: y, width: NW, height: tr.h }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: HEAD_W - 2, height: tr.h, background: "#24252a",
              borderRight: `1px solid ${LINE}`, fontSize: 9.5, fontWeight: 700, color: "#cfd0d6" }}>
              <span style={{ position: "absolute", left: 8, top: tr.h / 2 - 7 }}>{tr.name}</span>
              {["M", "S"].map((m, k) => (
                <span key={m} style={{ position: "absolute", left: 32 + k * 18, top: tr.h / 2 - 7, width: 14, height: 13, fontSize: 8,
                  textAlign: "center", lineHeight: "13px", background: "#34353b", color: DIM }}>{m}</span>
              ))}
            </div>
            <div style={{ position: "absolute", left: HEAD_W, top: 0, right: 0, height: tr.h }}>
              {tr.clips.map((c, ci) => <ClipBox key={ci} c={c} h={tr.h} seed={ti * 7 + ci} thumbs={thumbs} />)}
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: phX, top: TL_Y + 12, width: 1.5, height: NH - TL_Y - 12, background: "#e5484d" }} />
      <div style={{ position: "absolute", left: phX - 5, top: TL_Y + 10, width: 11, height: 11, background: "#e5484d",
        clipPath: "polygon(0 0, 100% 0, 100% 55%, 50% 100%, 0 55%)" }} />
      {/* the export dialog: THIS video's real length, crawling */}
      <div style={{ position: "absolute", left: 590, top: 152, width: 380, height: 150, background: "#2b2c31",
        border: "1px solid #45464e", boxShadow: "0 22px 50px rgba(0,0,0,0.65), 0 6px 14px rgba(0,0,0,0.5)", borderRadius: 8 }}>
        <div style={{ padding: "10px 14px 0", fontSize: 12.5, fontWeight: 700, color: "#f1f2f6" }}>Exporting reel_final_v7.mp4</div>
        <div style={{ padding: "3px 14px 0", fontSize: 10, color: DIM }}>H.264 · 1080 x 1920 · 60 fps · High quality, 2 pass</div>
        <div style={{ position: "absolute", left: 14, top: 58, width: 352, height: 8, background: "#1a1b1e", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: 8, background: "linear-gradient(90deg, #4a7dff, #6b95ff)", borderRadius: 4 }} />
        </div>
        <div style={{ position: "absolute", left: 14, top: 74, fontFamily: MONO, fontSize: 10, color: TXT }}>
          Frame {done.toLocaleString("en-US")} of 2,566 · {pct.toFixed(1)}%
        </div>
        <div style={{ position: "absolute", left: 14, top: 90, fontFamily: MONO, fontSize: 10, color: DIM }}>Time remaining {hh(remain)}</div>
        <div style={{ position: "absolute", right: 14, bottom: 12, width: 72, height: 24, borderRadius: 5, background: "#3a3b42",
          fontSize: 11, fontWeight: 600, color: "#e6e7ec", textAlign: "center", lineHeight: "24px" }}>Cancel</div>
      </div>
    </div>
  );
};
