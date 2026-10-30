import React from "react";
import { Img, OffthreadVideo, Sequence, staticFile } from "remotion";
import { Prompt, Swatches, kitTransform, type Swatch } from "./A-kit";
import { SlopTile } from "./A-slop";
import { CX, CY, clamp, lerp, pick, sp, type Rect } from "./A-util";
// reference edit K family A, hook 3 (2026-09-24): "Everyone tells you to use AI for marketing, but you end up with AI
// slop. You need to watch this." Generic advice lands as notifications, one per beat; on BUT they squeeze
// into one generic ad; on SLOP it sags; on WATCH a real SKIMS try-on (Holo output) pushes it away and plays;
// then the bridge (kit lifted off the try-on frame, blank prompt) as hook 1.

export const B3 = {
  everyone: 0, you: 595, ai: 1075, marketing: 1675, but: 2233, slop: 3375, watch: 4062,
  own: 5937, brand: 6057, and: 6533, not: 6663, blank: 7023, prompt: 7263, out: 7700,
};
const JAKARTA = `"Plus Jakarta Sans", "Figtree", "Inter", -apple-system, sans-serif`;
const CALM = { damping: 26, stiffness: 150 };
const OWN = { damping: 32, stiffness: 260 };
// two are already there on frame 0 (newest on top), then one lands per beat: YOU, AI, MARKETING
const NOTES = [
  { at: -2, from: "Newsletter", text: "Use AI for your ads", bg: "#2f6bff", glyph: "mail" },
  { at: -1, from: "Podcast", text: "AI can do your marketing now", bg: "#8e44ec", glyph: "mic" },
  { at: B3.you, from: "Group chat", text: "Just prompt it", bg: "#20b35a", glyph: "chat" },
  { at: B3.ai, from: "Your feed", text: "Let AI write all your ads", bg: "#f06a2a", glyph: "play" },
  { at: B3.marketing, from: "Webinar", text: "AI makes your ads in seconds", bg: "#e0a100", glyph: "cam" },
];
const NW = 960, NH = 140, NG = 12, NTOP = 14, FULL = 3, PEEK = 18;
const VID: Rect = { x: CX, y: CY, w: 360, h: 640 };
export const KIT3: Rect = { x: 340, y: CY, w: 364.5, h: 648 };

const Glyph: React.FC<{ g: string }> = ({ g }) => {
  const p = { stroke: "#fff", strokeWidth: 2.2, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="42" height="42" viewBox="0 0 24 24">
      {g === "mail" && <><rect x="3" y="5" width="18" height="14" {...p} /><path d="M3 6l9 7 9-7" {...p} /></>}
      {g === "mic" && <><rect x="9" y="3" width="6" height="11" rx="3" {...p} /><path d="M5 11a7 7 0 0014 0M12 18v3" {...p} /></>}
      {g === "chat" && <path d="M4 5h16v11H9l-5 4z" {...p} />}
      {g === "play" && <path d="M8 5l11 7-11 7z" {...p} fill="#fff" />}
      {g === "cam" && <><rect x="3" y="7" width="12" height="10" {...p} /><path d="M15 11l6-3v8l-6-3z" {...p} /></>}
    </svg>
  );
};

// iOS notification look: frosted light material, 72 px app icon, app name + "now", semibold body.
// Square corners on the card (their rule); the icon is square too.
const Note: React.FC<{ n: (typeof NOTES)[number]; dim: number }> = ({ n, dim }) => (
  <div style={{ position: "absolute", inset: 0, background: "rgba(244,244,246,0.97)",
    backdropFilter: "blur(26px) saturate(1.7)", WebkitBackdropFilter: "blur(26px) saturate(1.7)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", padding: "0 30px", gap: 24,
    fontFamily: JAKARTA, filter: dim > 0 ? `brightness(${1 - 0.12 * dim})` : undefined }}>
    <div style={{ width: 72, height: 72, opacity: 1 - dim, background: n.bg, display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0 }}><Glyph g={n.glyph} /></div>
    <div style={{ flex: 1, minWidth: 0, opacity: 1 - dim }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, fontWeight: 600, color: "#55555c" }}>
        <span>{n.from}</span><span style={{ fontWeight: 500, color: "#8a8a90" }}>now</span>
      </div>
      <div style={{ fontSize: 42, fontWeight: 600, color: "#111", marginTop: 2, whiteSpace: "nowrap" }}>{n.text}</div>
    </div>
  </div>
);

// slot p (0 = newest, top): the first FULL+1 slots are full cards, older ones compress and peek behind
const slotY = (p: number) => NTOP + NH / 2 + Math.min(p, FULL) * (NH + NG) + Math.max(0, p - FULL) * PEEK;
const slotS = (p: number) => 1 - 0.05 * Math.max(0, p - FULL);

// the advice stack. A new card slides down from behind the band's top edge (the stack is clipped
// there), fully opaque, while the others move down one slot: nothing cross-fades. On BUT it squeezes.
const Notes: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const sq = sp(t, B3.but, fps, CALM);
  if (sq > 0.98) return null;
  const arr = NOTES.map((n) => (n.at <= 0 ? 1 : sp(t, n.at, fps, CALM)));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: -40, overflow: "hidden" }}>
      {NOTES.map((n, i) => {
        if (arr[i] <= 0) return null;
        const p = arr.slice(i + 1).reduce((a, v) => a + v, 0); // newer cards above this one
        let y = slotY(p) - (1 - arr[i]) * (NTOP + NH + 10);
        y = lerp(y, CY, sq);
        const s = slotS(p);
        const fade = clamp(FULL + 2 - p); // a third peek fades out behind
        return (
          <div key={i} style={{ position: "absolute", left: CX - NW / 2, top: y - NH / 2, width: NW, height: NH,
            zIndex: 10 + i, opacity: fade * (1 - clamp(sq * 1.4)),
            transform: `scale(${s * (1 - 0.35 * sq)}, ${s * (1 - 0.7 * sq)})` }}>
            <Note n={n} dim={clamp(p - FULL)} />
          </div>
        );
      })}
    </div>
  );
};

// the generic ad: grows out of the squeezed stack, sags on SLOP, is pushed out left on WATCH
const Slop: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const g = sp(t, B3.but + 80, fps, CALM);
  if (g <= 0) return null;
  const melt = sp(t, B3.slop, fps, { damping: 30, stiffness: 60 });
  const push = sp(t, B3.watch, fps, CALM);
  if (push > 0.99) return null;
  const s = 2.75 * (0.4 + 0.6 * g) * (1 + 0.02 * clamp((t - B3.but) / 1800));
  return (
    <div style={{ position: "absolute", left: CX - 89, top: CY - 111, width: 178, height: 222, opacity: clamp(g * 1.5),
      transform: `translateX(${-1100 * push}px) scale(${s})`, boxShadow: "0 8px 20px rgba(0,0,0,0.4)" }}>
      <SlopTile i={0} w={178} h={222} split={0} melt={melt} />
    </div>
  );
};

export const vidRect = (t: number, fps: number): Rect => {
  const k = sp(t, B3.own, fps, OWN);
  const live = 1 + 0.02 * clamp((t - B3.watch) / (B3.own - B3.watch));
  return { x: lerp(VID.x, KIT3.x, k), y: CY, w: lerp(VID.w * live, KIT3.w, k), h: lerp(VID.h * live, KIT3.h, k) };
};

const TryOn: React.FC<{ t: number; fps: number; assets: string[] }> = ({ t, fps, assets }) => {
  if (t < B3.watch) return null;
  const en = sp(t, B3.watch, fps, CALM), r = vidRect(t, fps);
  return (
    <div style={{ position: "absolute", left: r.x - r.w / 2, top: r.y - r.h / 2, width: r.w, height: r.h, overflow: "hidden",
      transform: `translateX(${1100 * (1 - en)}px)`, boxShadow: "0 22px 50px rgba(0,0,0,0.6)", background: "#ddd" }}>
      {/* the window (3755654 at 3.45-5.85 s) ends before its cut to the face; its last frame holds under it */}
      <Img src={staticFile(pick(assets, "famA-tryon-last.jpg"))} style={{ position: "absolute", inset: 0,
        width: "100%", height: "100%", objectFit: "cover" }} />
      <Sequence from={Math.ceil((B3.watch / 1000) * fps)} durationInFrames={71} layout="none">
        <OffthreadVideo src={staticFile(pick(assets, "famA-tryon.mp4"))} muted
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      </Sequence>
    </div>
  );
};

export const Hook3: React.FC<{ t: number; fps: number; assets: string[]; sw: Swatch[] }> = ({ t, fps, assets, sw }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    {t < B3.and + 450 && (
      <div style={{ position: "absolute", inset: 0, transformOrigin: "340px 347px", transform: kitTransform(t, fps, B3) }}>
        <Notes t={t} fps={fps} />
        <Slop t={t} fps={fps} />
        <TryOn t={t} fps={fps} assets={assets} />
        <Swatches t={t} fps={fps} start={B3.own + 200} sw={sw} rect={vidRect(t, fps)} target={KIT3}
          img={{ w: 720, h: 1280 }} />
      </div>
    )}
    <Prompt t={t} fps={fps} b={B3} />
  </div>
);
