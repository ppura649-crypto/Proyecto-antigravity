import React from "react";
import { Img, staticFile } from "remotion";
import { CX, clamp, pick, type Beats, type Rect } from "./A-util";
// edit-k-h1b v6 (2026-09-24), variant 2 "the feed" (after the integrator's white title, -200 -> 1974): an
// Instagram feed column (square outside, real post chrome: avatar, handle, Sponsored, like / comment / share /
// save; no counts). YOU = the bike post; TO and WATCH flick to the next Sponsored slop post. On THE the feed is
// pulled to refresh, a spinner turns, and it comes back as a real Holo example (SKIMS), which drifts calmly
// and holds; at OWN its photo leaves the feed into the brand kit (A-own `from`).

const JAKARTA = `"Plus Jakarta Sans", "Figtree", "Inter", -apple-system, sans-serif`;
export const COLW = 470;
const HD = 62, IMGH = 580, AC = 48, POST = HD + IMGH + AC, TOP = 2;
const COLX = CX - COLW / 2;
type Post = { f: string; handle: string; pos?: string };
// fictional sloppy handles on the generated slop; the real examples keep their own names
const SLOP: Post[] = [
  { f: "famA-slop-bike.jpg", handle: "velobra.bikes", pos: "50% 45%" },
  { f: "famA-slop-serum.jpg", handle: "lumierra.glow", pos: "50% 20%" },
  { f: "famA-slop-pyjama.jpg", handle: "dreamwea.sleep", pos: "50% 20%" },
];
const GOOD: Post[] = [
  { f: "skims-3755019.jpg", handle: "skims", pos: "50% 30%" },
  { f: "crocs-5139667.jpg", handle: "crocs", pos: "50% 50%" },
];
const SNAPS = ["to", "watch"] as const;
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 4);
const easeInOut = (x: number) => { const u = clamp(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
// refresh timeline
const pull = (b: Beats) => ({ down: b.the, spin: b.the + 130, back: b.the + 330 });

const scrollAt = (t: number, b: Beats) => {
  const p = pull(b);
  if (t < p.back) return SNAPS.reduce((s, k) => s + POST * easeOut((t - b[k]) / 190), 0);
  return 0; // the good feed holds on the SKIMS post; its life is the column's slow push (feedPush)
};
// a slow push on the held good post, frozen at OWN
const feedPush = (t: number, b: Beats) => 1 + 0.03 * easeInOut((Math.min(t, b.own) - pull(b).back) / (b.own - pull(b).back));
// where the SKIMS photo sits in the feed at OWN (the brand kit takes it from there)
export const feedPhotoRect = (b: Beats): Rect => {
  const k = feedPush(b.own, b), y0 = TOP - scrollAt(b.own, b) + HD + IMGH / 2;
  return { x: CX, y: 347.5 + (y0 - 347.5) * k, w: COLW * k, h: IMGH * k };
};

const Icon: React.FC<{ d: string }> = ({ d }) => (
  <svg width="34" height="34" viewBox="0 0 24 24"><path d={d} stroke="#111" strokeWidth="1.9" fill="none"
    strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const HEART = "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z";
const BUBBLE = "M20 12a8 8 0 1 1-3.2-6.4A8 8 0 0 1 20 12zM20 12l1 7-5-2";
const SEND = "M21 3L10 14M21 3l-7 18-4-7-7-4z";
const SAVE = "M6 3h12v18l-6-5-6 5z";

const PostView: React.FC<{ p: Post; y: number; src: string; hideImg: boolean }> = ({ p, y, src, hideImg }) => (
  <div style={{ position: "absolute", left: 0, top: y, width: COLW, height: POST, background: "#fff" }}>
    <div style={{ position: "absolute", left: 16, top: 11, width: 40, height: 40, borderRadius: 20, overflow: "hidden",
      boxShadow: "0 0 0 2px #fff, 0 0 0 4px #d62976" }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: p.pos }} />
    </div>
    <div style={{ position: "absolute", left: 70, top: 4, fontSize: 29, fontWeight: 700, color: "#111" }}>{p.handle}</div>
    <div style={{ position: "absolute", left: 70, top: 35, fontSize: 24, fontWeight: 500, color: "#555" }}>Sponsored</div>
    <div style={{ position: "absolute", right: 18, top: 10, fontSize: 30, fontWeight: 800, color: "#111" }}>···</div>
    {!hideImg && (
      <Img src={src} style={{ position: "absolute", left: 0, top: HD, width: COLW, height: IMGH, objectFit: "cover",
        objectPosition: p.pos }} />
    )}
    <div style={{ position: "absolute", left: 12, top: HD + IMGH + 8, display: "flex", gap: 14 }}>
      <Icon d={HEART} /><Icon d={BUBBLE} /><Icon d={SEND} />
    </div>
    <div style={{ position: "absolute", right: 12, top: HD + IMGH + 8 }}><Icon d={SAVE} /></div>
  </div>
);

export const Feed: React.FC<{ t: number; fps: number; b: Beats; assets: string[] }> = ({ t, b, assets }) => {
  const p = pull(b);
  const good = t >= p.back;
  const posts = good ? GOOD : SLOP;
  const s = scrollAt(t, b);
  // pull-to-refresh: the content drops, a spinner turns in the gap, the new feed springs back up
  const drop = t < p.down ? 0 : t < p.spin ? 90 * easeOut((t - p.down) / 150)
    : t < p.back ? 90 : 90 * (1 - easeOut((t - p.back) / 180));
  const e = clamp((t - b.own) / 220); // the column leaves as the photo takes over
  if (e >= 1) return null;
  return (
    <div style={{ position: "absolute", left: COLX, top: 0, width: COLW, height: 695, overflow: "hidden",
      background: "#fff", fontFamily: JAKARTA, opacity: 1 - e, transform: `scale(${feedPush(t, b) * (1 - 0.06 * e)})`,
      boxShadow: "0 26px 64px rgba(0,0,0,0.5), 0 8px 18px rgba(0,0,0,0.3)" }}>
      {drop > 0 && (
        <div style={{ position: "absolute", left: COLW / 2 - 20, top: 25, width: 40, height: 40, borderRadius: 20,
          border: "4px solid #ddd", borderTopColor: "#555", boxSizing: "border-box",
          transform: `rotate(${(t - p.down) * 0.9}deg)`, opacity: clamp(drop / 60) }} />
      )}
      <div style={{ position: "absolute", left: 0, top: drop, width: COLW, height: 695 }}>
        {posts.map((q, i) => {
          const y = TOP + i * POST - s;
          if (y > 695 || y + POST < 0) return null;
          if (t >= p.down && t < p.back && i !== SNAPS.length) return null; // refreshing: only the post on screen
          return <PostView key={q.f} p={q} y={y} src={staticFile(pick(assets, q.f))}
            hideImg={good && q.f.startsWith("skims-3755019") && t >= b.own} />;
        })}
      </div>
    </div>
  );
};
