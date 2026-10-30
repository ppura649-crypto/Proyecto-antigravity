import React from "react";
import { Glass, TitleBar } from "./Glass";
import { SOFT, fade, typed, typing, microLabel, type Box, px } from "./tokens";

export type CardProps = { tMs: number; fps: number; W: number; H: number; fromMs: number; toMs: number; beats: Record<string, number> };

// Finder window (XAFZ f56-75): glass 0.045-0.905W x 0.135-0.375H, macOS title bar,
// blue folders 0.15W with labels, one folder every 4 frames, each a 2-frame fade.
export const Finder: React.FC<CardProps & { title: string; folders: string[]; box?: Box }> = (p) => {
  const box = p.box ?? { x: 0.045, y: 0.135, w: 0.86, h: 0.24 };
  const start = p.beats.folders ?? p.fromMs + (4 / p.fps) * 1000;
  const fw = 0.15 * p.W;
  return (
    <Glass box={box} W={p.W} H={p.H} tMs={p.tMs} fromMs={p.fromMs} fps={p.fps} radius={30}>
      <TitleBar title={p.title} />
      <div style={{ position: "absolute", top: 118, left: 44, right: 44, display: "flex", gap: 0.045 * p.W }}>
        {p.folders.map((name, i) => {
          const o = fade(p.tMs, start + (i * 4 * 1000) / p.fps, 2, p.fps);
          return (
            <div key={name} style={{ width: fw, opacity: o, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Folder w={fw} />
              <div
                style={{
                  marginTop: 12, fontFamily: SOFT.grotesque, fontWeight: 600, fontSize: 21,
                  color: SOFT.glassInk, textAlign: "center", lineHeight: 1.15, wordBreak: "break-word",
                }}
              >
                {name}
              </div>
            </div>
          );
        })}
      </div>
    </Glass>
  );
};

// a macOS-blue folder: a tab over a rounded body with a light-to-deeper gradient
export const Folder: React.FC<{ w: number }> = ({ w }) => (
  <div style={{ position: "relative", width: w, height: w * 0.78 }}>
    <div
      style={{
        position: "absolute", top: 0, left: 0, width: w * 0.42, height: w * 0.2,
        borderRadius: "8px 10px 0 0", background: SOFT.folderBottom,
      }}
    />
    <div
      style={{
        position: "absolute", top: w * 0.12, left: 0, width: w, height: w * 0.66, borderRadius: 10,
        background: `linear-gradient(180deg, ${SOFT.folderTop} 0%, ${SOFT.folderBottom} 100%)`,
        boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
      }}
    />
  </div>
);

// the small SKILL.md glass file (XAFZ f380): 0.361-0.630W x 0.135-0.246H, folded corner,
// a tracked "SKILL.md" label, "SKILL" 40 px, three grey lines. Drawn for the morph too.
export const SkillFile: React.FC<{ W: number; H: number; box?: Box; opacity?: number; scale?: number }> = ({
  W, H, box = { x: 0.361, y: 0.135, w: 0.269, h: 0.111 }, opacity = 1, scale = 1,
}) => (
  <div
    style={{
      position: "absolute", ...px(box, W, H), borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.34)", border: `1px solid ${SOFT.glassLine}`,
      backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      boxShadow: SOFT.shadow, overflow: "hidden", opacity, transform: `scale(${scale})`,
    }}
  >
    <div style={{ position: "absolute", top: 18, left: 26, ...microLabel(16, SOFT.glassMuted), letterSpacing: "0.14em", textTransform: "none" }}>
      SKILL.md
    </div>
    <div
      style={{
        position: "absolute", top: 0, right: 0, width: 0, height: 0,
        borderStyle: "solid", borderWidth: "0 44px 44px 0", borderColor: "transparent rgba(255,255,255,0.55) transparent transparent",
      }}
    />
    <div style={{ position: "absolute", top: 66, left: 26, fontFamily: SOFT.grotesque, fontWeight: 700, fontSize: 40, color: SOFT.glassInk, letterSpacing: "-0.01em" }}>
      SKILL
    </div>
    {[0.62, 0.44, 0.54].map((f, i) => (
      <div key={i} style={{ position: "absolute", top: 128 + i * 16, left: 26, width: f * box.w * W, height: 6, borderRadius: 3, backgroundColor: "rgba(36,40,36,0.32)" }} />
    ))}
  </div>
);

// chapter title on the wall (XAFZ f398-449): tracked eyebrow fades 4 frames, a serif title
// typed at 1.5 glyphs per frame with one italic word (*word*), then a 1 px rule. Ink is
// white here because their room is dark (hers is charcoal on a light wall).
export const Chapter: React.FC<CardProps & { eyebrow: string; title: string; y?: number }> = (p) => {
  const top = (p.y ?? 0.10) * p.H;
  const eyeO = fade(p.tMs, p.fromMs, 4, p.fps);
  const at = p.beats.title ?? p.fromMs + 200;
  const parts = p.title.split("*"); // plain, italic, plain
  const full = parts.join("");
  const shown = typed(full, p.tMs, at, p.fps, 1.5);
  const spans: React.ReactNode[] = [];
  let used = 0;
  parts.forEach((part, i) => {
    const s = shown.slice(used, used + part.length);
    used += part.length;
    spans.push(<span key={i} style={{ fontStyle: i % 2 === 1 ? "italic" : "normal" }}>{s}</span>);
  });
  const done = shown.length >= full.length;
  return (
    <div style={{ position: "absolute", top, left: 0.089 * p.W, width: 0.83 * p.W }}>
      <div style={{ ...microLabel(21, "rgba(255,255,255,0.85)"), opacity: eyeO, textShadow: SOFT.textShadow }}>{p.eyebrow}</div>
      <div
        style={{
          marginTop: 14, fontFamily: SOFT.serif, fontWeight: 400, fontSize: 84, lineHeight: 1.05,
          color: SOFT.white, textShadow: SOFT.textShadow, whiteSpace: "pre", letterSpacing: "-0.01em",
        }}
      >
        {spans}
        {typing(full, p.tMs, at, p.fps, 1.5) ? <span style={{ opacity: 0.8 }}>|</span> : null}
      </div>
      <div style={{ marginTop: 16, height: 1, backgroundColor: "rgba(255,255,255,0.55)", opacity: done ? 1 : 0 }} />
    </div>
  );
};

// keyword pop (XAJm): a tracked eyebrow, then the word performs itself, growing and
// solidifying over 8 frames from 0.8, heavy grotesque, centred above their head.
export const Keyword: React.FC<CardProps & { eyebrow: string; word: string }> = (p) => {
  const eyeO = fade(p.tMs, p.fromMs, 4, p.fps);
  const at = p.beats.word ?? p.fromMs;
  const k = fade(p.tMs, at, 8, p.fps);
  return (
    <div style={{ position: "absolute", top: 0.155 * p.H, left: 0, width: p.W, textAlign: "center" }}>
      <div style={{ ...microLabel(22, "rgba(255,255,255,0.88)"), opacity: eyeO, textShadow: SOFT.textShadow }}>{p.eyebrow}</div>
      <div
        style={{
          marginTop: 18, fontFamily: SOFT.grotesque, fontWeight: 800, fontSize: 112, lineHeight: 1,
          letterSpacing: "-0.03em", color: SOFT.white, textShadow: SOFT.textShadow,
          opacity: k, transform: `scale(${0.8 + 0.2 * k})`,
        }}
      >
        {p.word}
      </div>
    </div>
  );
};
