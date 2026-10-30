import React from "react";
import { Img, OffthreadVideo, Sequence, staticFile } from "remotion";
import type { CardProps } from "../props";
import { GREEN, SANS, beat, box, clamp, life, mix, pick, ramp, settle } from "./S-util";
// V14 "deliver" (builder S, 2026-09-25, replaces the dominoes), Everything 31267 -> 33450. Left: the iPhone
// Camera in video mode, their raw take live in the viewfinder. Right: a Finder window on an empty folder,
// "keyframes-v1 · ready to post". On "press" the shutter is pressed: the red dot turns into the red square and the
// timer goes red and runs. Then what the site promises ("Finished posts land in a folder with the video, the
// caption and the cover") lands in the folder, one file at a time, each dropped with weight: the real finished
// video (51.7 MB, 0:43), caption.txt (151 bytes, its first line readable), cover.jpg (150 KB, 1080x1920). On
// "done," the files take Finder's green tag and a green "Ready to post" lands in the toolbar. Held.

const PX = 34, PY = 10, PW = 286, PH = 594, BZ = 9;            // phone
const SW = PW - 2 * BZ, SH = PH - 2 * BZ, TOP = 46, VF = Math.round(SW * 16 / 9);
const FX = 356, FY = 38, FW = 694, FH = 540, TB = 52, SB = 148, ST = 28; // Finder: toolbar, sidebar, status bar
const SLOT_W = (FW - SB) / 3, SLOT_Y = TB + 34;

type File = { name: string; size: string; info?: string; kind: "video" | "text" | "image"; src?: string };
const FILES: File[] = [
  { name: "keyframes-v1-final.mp4", size: "51.7 MB", info: "00:43", kind: "video", src: "S-final.jpg" },
  { name: "caption.txt", size: "151 bytes", kind: "text" },
  { name: "cover.jpg", size: "150 KB", info: "1080×1920", kind: "image", src: "S-cover.jpg" },
];
const CAPTION = ["AI edits all my", "videos now.", "", "One raw take in, a", "finished reel out: the", "cut, the captions and", "the graphics.", "", "Comment \"KEYFRAMES\""];

const Phone: React.FC<{ t: number; press: number; fromMs: number; fps: number; raw: string; roll: string }> = ({ t, press, fromMs, fps, raw, roll }) => {
  const tap = Math.sin(Math.PI * clamp((t - press) / 160));      // the finger's press: the whole button gives
  const morph = ramp(t, press + 40, press + 240);                 // circle -> rounded square
  const rec = t >= press + 60;
  const secs = rec ? Math.floor((t - press) / 1000) : 0;
  const inner = mix(54, 27, morph), rad = mix(27, 6, morph);
  return (
    <div style={{ position: "absolute", left: PX, top: PY, width: PW, height: PH, borderRadius: 46,
      background: "linear-gradient(135deg, #3b3c40, #1a1a1c 40%, #0b0b0c)", boxShadow: "0 30px 60px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.35), inset 0 0 0 1.5px rgba(255,255,255,0.14)" }}>
      <div style={{ position: "absolute", left: BZ, top: BZ, width: SW, height: SH, borderRadius: 38, overflow: "hidden", background: "#000", fontFamily: SANS }}>
        <div style={{ position: "absolute", left: 0, top: TOP, width: SW, height: VF, overflow: "hidden" }}>
          <Sequence from={Math.floor((fromMs / 1000) * fps)} layout="none">
            <OffthreadVideo src={raw} muted style={{ width: SW, height: VF, objectFit: "cover", display: "block" }} />
          </Sequence>
        </div>
        {/* the island, the top controls, the timer */}
        <div style={{ position: "absolute", left: SW / 2 - 44, top: 9, width: 88, height: 25, borderRadius: 13, background: "#000" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: TOP + 10, display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "3px 8px", borderRadius: 5, background: rec ? "#FF3B30" : "rgba(0,0,0,0)", color: "#fff", fontSize: 15, fontWeight: 600,
            fontVariantNumeric: "tabular-nums", letterSpacing: 0.3 }}>{`00:00:${String(secs).padStart(2, "0")}`}</div>
        </div>
        <div style={{ position: "absolute", right: 12, top: TOP + 12, fontSize: 10, fontWeight: 700, color: "#fff", padding: "2px 6px",
          border: "1px solid rgba(255,255,255,0.7)", borderRadius: 4, opacity: rec ? 0 : 1 }}>HD · 60</div>
        {/* the bottom controls over the image */}
        <div style={{ position: "absolute", left: 0, top: SH - 190, width: SW, height: 190, background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.85))" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: SH - 118, display: "flex", justifyContent: "center", gap: 18,
          fontSize: 11.5, fontWeight: 600, letterSpacing: 1, opacity: rec ? 0 : 1 }}>
          {["SLO-MO", "VIDEO", "PHOTO"].map((m) => <span key={m} style={{ color: m === "VIDEO" ? "#FFD60A" : "#fff" }}>{m}</span>)}
        </div>
        <div style={{ position: "absolute", left: 28, top: SH - 72, width: 40, height: 40, borderRadius: 7, overflow: "hidden",
          border: "1.5px solid rgba(255,255,255,0.8)", opacity: rec ? 0 : 1 }}>
          <Img src={roll} style={{ width: 40, height: 40, objectFit: "cover" }} />
        </div>
        <div style={{ position: "absolute", right: 28, top: SH - 72, width: 40, height: 40, borderRadius: 20, background: "rgba(255,255,255,0.18)",
          display: "grid", placeItems: "center", opacity: rec ? 0 : 1 }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10a8 8 0 0 1 14-4l2 2M20 14a8 8 0 0 1-14 4l-2-2" /><path d="M20 4v4h-4M4 20v-4h4" />
          </svg>
        </div>
        {/* the shutter: white ring, red dot -> red square */}
        <div style={{ position: "absolute", left: SW / 2 - 36, top: SH - 88, width: 72, height: 72, transform: `scale(${1 - 0.07 * tap})` }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 36, border: "4.5px solid #fff", boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 36 - inner / 2, top: 36 - inner / 2, width: inner, height: inner, borderRadius: rad,
            background: "#FF3B30", filter: `brightness(${1 - 0.15 * tap})` }} />
        </div>
      </div>
    </div>
  );
};

const Icon: React.FC<{ f: File; img?: string; green: number }> = ({ f, img, green }) => {
  if (f.kind === "text") {
    return (
      <div style={{ position: "relative", width: 132, height: 170, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(0,0,0,0.2)",
        clipPath: "polygon(0 0, 82% 0, 100% 14%, 100% 100%, 0 100%)", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: 0, top: 0, width: 24, height: 24, background: "linear-gradient(225deg, #fff 50%, #d9d9de 50%)" }} />
        <div style={{ position: "absolute", left: 10, top: 12, right: 12, fontFamily: SANS, color: "#111" }}>
          {CAPTION.map((l, i) => (
            <div key={i} style={{ fontSize: i < 2 ? 15.5 : 9, fontWeight: i < 2 ? 700 : 500, lineHeight: i < 2 ? "18px" : "12px", whiteSpace: "nowrap",
              height: l ? undefined : 7, color: i < 2 ? "#111" : "#555" }}>{l}</div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "relative", width: 96, height: 170, boxShadow: "0 2px 5px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(0,0,0,0.3)", overflow: "hidden", background: "#111" }}>
      <Img src={img!} style={{ width: 96, height: 170, objectFit: "cover", display: "block" }} />
      {f.kind === "video" && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 20, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", gap: 5, paddingLeft: 6 }}>
          <svg width={9} height={9} viewBox="0 0 10 10"><path d="M2 1l7 4-7 4z" fill="#fff" /></svg>
          <span style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, color: "#fff" }}>0:43</span>
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 0 ${2.5 * green}px ${GREEN}` }} />
    </div>
  );
};

const Finder: React.FC<{ t: number; lands: number[]; done: number; assets: string[] }> = ({ t, lands, done, assets }) => {
  const n = lands.filter((l) => t >= l).length;
  const g = ramp(t, done, done + 140);
  const pill = settle(t, done - 30, 360);
  return (
    <div style={{ position: "absolute", left: FX, top: FY, width: FW, height: FH, fontFamily: SANS }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 11, overflow: "hidden", background: "#fff",
        boxShadow: "0 30px 70px rgba(0,0,0,0.42), 0 8px 18px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(0,0,0,0.35)" }}>
      {/* sidebar */}
      <div style={{ position: "absolute", left: 0, top: 0, width: SB, height: FH, background: "#ECECEE", borderRight: "1px solid #dcdcdf" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => <div key={c} style={{ position: "absolute", left: 16 + i * 20, top: 19, width: 12, height: 12, borderRadius: 6, background: c }} />)}
        <div style={{ position: "absolute", left: 14, top: 62, fontSize: 10.5, fontWeight: 700, color: "#8a8a8f" }}>Favorites</div>
        {["Recents", "Applications", "Desktop", "Documents", "Downloads"].map((s, i) => (
          <div key={s} style={{ position: "absolute", left: 8, top: 80 + i * 26, width: SB - 16, height: 23, borderRadius: 5, fontSize: 12.5,
            color: "#222", display: "flex", alignItems: "center", paddingLeft: 26, background: s === "Documents" ? "rgba(0,0,0,0.08)" : undefined }}>
            <div style={{ position: "absolute", left: 7, top: 6, width: 13, height: 11, borderRadius: 2, border: "1.6px solid #2f7bf6" }} />{s}
          </div>
        ))}
        <div style={{ position: "absolute", left: 14, top: 222, fontSize: 10.5, fontWeight: 700, color: "#8a8a8f" }}>Tags</div>
        {[["Green", GREEN], ["Blue", "#2f7bf6"], ["Orange", "#ff9f0a"]].map(([s, c], i) => (
          <div key={s} style={{ position: "absolute", left: 16, top: 242 + i * 24, fontSize: 12.5, color: "#222", display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: c }} />{s}
          </div>
        ))}
      </div>
      {/* toolbar */}
      <div style={{ position: "absolute", left: SB, top: 0, width: FW - SB, height: TB, borderBottom: "1px solid #e4e4e7", background: "#fbfbfc" }}>
        <svg width={40} height={16} viewBox="0 0 40 16" style={{ position: "absolute", left: 14, top: 18 }} fill="none" stroke="#9b9ba0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2 2 8l6 6M28 2l6 6-6 6" />
        </svg>
        <div style={{ position: "absolute", left: 66, top: 16, fontSize: 14, fontWeight: 700, color: "#1d1d1f", display: "flex", alignItems: "center", gap: 7 }}>
          keyframes-v1 · ready to post
          <span style={{ width: 9, height: 9, borderRadius: 5, background: GREEN, opacity: g, transform: `scale(${g})` }} />
        </div>
        {/* the green state lands in the toolbar on "done," */}
        <div style={{ position: "absolute", right: 14, top: 11, height: 30, padding: "0 12px 0 9px", borderRadius: 15, background: GREEN,
          display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#06290f",
          opacity: clamp(pill * 3), transform: `translateY(${mix(-24, 0, pill)}px)`, boxShadow: `0 ${mix(12, 3, pill)}px ${mix(18, 6, pill)}px rgba(20,80,40,0.3)` }}>
          <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="#06290f" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="m3 8.5 3.2 3L13 4.5" /></svg>
          Ready to post
        </div>
        <svg width={16} height={16} viewBox="0 0 16 16" style={{ position: "absolute", right: 172, top: 18, opacity: 1 - clamp(pill * 3) }} fill="none" stroke="#8e8e93" strokeWidth={1.8} strokeLinecap="round">
          <circle cx="6.5" cy="6.5" r="4.8" /><path d="m10.2 10.2 4 4" />
        </svg>
      </div>
      {/* status bar */}
      <div style={{ position: "absolute", left: SB, bottom: 0, width: FW - SB, height: ST, borderTop: "1px solid #ececef", background: "#fbfbfc",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, color: "#6e6e73" }}>
        {n === 0 ? "0 items" : `${n} item${n > 1 ? "s" : ""}`}, 214.6 GB available
      </div>
      </div>
      {/* the icon grid: files dropped in with weight, from above the window */}
      {FILES.map((f, i) => {
        const land = lands[i]!, FALL = 240;
        if (t < land - FALL) return null;
        const u = clamp((t - (land - FALL)) / FALL);
        const dy = t < land ? -(1 - u * u) * 160 : 0;                   // gravity: accelerating onto its slot
        const lift = t < land ? mix(1.14, 1, u * u) : 1;                // held above the folder, closer to us
        const sq = t >= land ? Math.sin(Math.PI * clamp((t - land) / 150)) * (1 - clamp((t - land) / 150)) : 0;
        const img = f.src ? staticFile(pick(assets, f.src)) : undefined;
        const cx = SB + SLOT_W * (i + 0.5);
        return (
          <div key={f.name} style={{ position: "absolute", left: cx - SLOT_W / 2, top: SLOT_Y, width: SLOT_W, display: "flex", flexDirection: "column", alignItems: "center",
            zIndex: 5 }}>
            <div style={{ height: 176, display: "flex", alignItems: "flex-end", transformOrigin: "50% 100%", transform: `translateY(${dy}px) scale(${lift * (1 + 0.035 * sq)}, ${lift * (1 - 0.05 * sq)})`,
              filter: t < land ? `drop-shadow(0 ${mix(34, 4, u * u)}px ${mix(22, 4, u * u)}px rgba(0,0,0,${mix(0.3, 0.2, u)}))` : undefined }}>
              <Icon f={f} img={img} green={g} />
            </div>
            {/* contact shadow: tightens as it lands */}
            <div style={{ width: 110, height: 10, marginTop: -6, borderRadius: "50%", background: "rgba(0,0,0,0.28)", filter: "blur(5px)",
              opacity: t < land ? u * u * 0.8 : 0.8 * (1 - clamp((t - land) / 260)) }} />
            <div style={{ opacity: t >= land ? 1 : 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 500, color: "#1d1d1f", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: GREEN, display: g > 0 ? "inline-block" : "none", transform: `scale(${g})` }} />
              {f.name}
            </div>
            {f.info && <div style={{ fontSize: 11, color: "#2f7bf6", marginTop: 2 }}>{f.info}</div>}
            <div style={{ fontSize: 11, color: "#8a8a8f", marginTop: 1 }}>{f.size}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const Deliver: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fps, fromMs, toMs, beats, assets }) => {
  const press = beat(beats, "press", 32125), record = beat(beats, "record", 32305), done = beat(beats, "done", 32965);
  const lands = [record + 115, record + 295, record + 475];     // the video, the caption, the cover
  const sp = settle(t, fromMs - 90, 440), sf = settle(t, fromMs - 20, 440);
  return (
    <div style={box(w, h)}>
      <div style={life(t, fromMs, toMs, 0.03, "50% 50%")}>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${mix(36, 0, sp)}px)` }}>
          <Phone t={t} press={press} fromMs={fromMs} fps={fps} raw={staticFile(pick(assets, "S-raw.mp4"))} roll={staticFile(pick(assets, "S-roll.jpg"))} />
        </div>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${mix(40, 0, sf)}px)` }}>
          <Finder t={t} lands={lands} done={done} assets={assets} />
        </div>
      </div>
    </div>
  );
};
