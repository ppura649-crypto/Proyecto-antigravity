import React from "react";
import { Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import type { CardProps } from "../props";
import { easeInOut, easeOut3, exitP, hash, pick, win, XB, type XBeats } from "./X-util";
// reference edit K v10 "the tunnel" (builder X, 2026-09-24), 1974 -> 4237. First-person flight down a corridor
// whose four walls are lined with real SKIMS / Crocs creatives (stills + frames of their clips), true CSS
// perspective. The flight starts at a yourbrand.com link floating in the mouth, accelerates from YOU
// (peak speed on WATCH/THIS), and bleeds its speed off with inertia onto one hero SKIMS ad, landed after
// "fix" and held with a slow push. Far tiles sink into fog and defocus; at speed each tile leaves two
// sub-frame ghosts (real temporal motion blur). Clean 130 ms exit into the own-brand card.
const { fontFamily: JAK } = loadFont("normal", { weights: ["600", "700"], subsets: ["latin"] });

const P = 760;             // perspective: the tunnel's cross-section fills the band at depth P
const HW = 540, HH = 317;  // tunnel half width / half height (world px)
const L = 4000;            // camera travel
const SPACE = 232, Z0 = 260, NZ = 30;
const HERO = { h: 570, aspect: 900 / 1612, z: L + P };
const CHIP_Z = 700;

type Tile = { key: string; kind: "wall" | "flat"; side: number; x: number; y: number; z: number; img: number };
const TILES: Tile[] = (() => {
  const out: Tile[] = [];
  const rows: Omit<Tile, "key" | "z" | "img">[] = [];
  for (const side of [-1, 1]) for (const y of [-142, 142]) rows.push({ kind: "wall", side, x: side * HW, y });
  for (const side of [-1, 1]) for (const x of [-405, -135, 135, 405]) rows.push({ kind: "flat", side, x, y: side * HH });
  rows.forEach((r, ri) => {
    let prev = -1;
    for (let k = 0; k < NZ; k++) {
      let img = Math.floor(hash(ri * 97 + k * 13) * 1000);
      if (img % 16 === prev) img += 1;
      prev = img % 16;
      out.push({ ...r, key: `${ri}-${k}`, z: Z0 + k * SPACE + (ri % 2) * SPACE * 0.5, img });
    }
  });
  return out;
})();

// camera: Beta(2,3) speed profile from YOU to the landing (peak at a third, long inertial tail), then a push
const camZ = (t: number, b: XBeats, land: number) => {
  const u = win(t, b.you, land);
  const s = 6 * u * u - 8 * u * u * u + 3 * u * u * u * u;
  return L * s + 34 * easeInOut(win(t, land, b.own - 130));
};

const place = (tl: Tile, depth: number) => {
  const tz = P - depth;
  if (tl.kind === "wall")
    return { w: 196, h: 262, tf: `translate3d(${tl.x}px, ${tl.y}px, ${tz}px) rotateY(${tl.side < 0 ? 90 : -90}deg)` };
  return { w: 250, h: 196, tf: `translate3d(${tl.x}px, ${tl.y}px, ${tz}px) rotateX(${tl.side > 0 ? 90 : -90}deg)` };
};

const TileEl: React.FC<{ tl: Tile; depth: number; op: number; blur: number; src: string }> = ({ tl, depth, op, blur, src }) => {
  const { w, h, tf } = place(tl, depth);
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2,
      transform: tf, opacity: op, zIndex: Math.round(100000 - depth * 10), backfaceVisibility: "hidden",
      filter: blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
};

const Chip: React.FC<{ depth: number; mark: string }> = ({ depth, mark }) => (
  <div style={{ position: "absolute", left: "50%", top: "50%", width: 560, height: 128, marginLeft: -280, marginTop: -64,
    transform: `translateZ(${P - depth}px)`, opacity: win(depth, 150, 340), zIndex: Math.round(100000 - depth * 10),
    background: "#F6F7F7", borderRadius: 64, boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
    display: "flex", alignItems: "center", padding: "0 34px 0 30px", boxSizing: "border-box", gap: 18 }}>
    <Img src={mark} style={{ height: 44, width: "auto" }} />
    <div style={{ fontFamily: JAK, fontWeight: 600, fontSize: 44, color: "#3c3c3f", letterSpacing: -0.5, flex: 1 }}>yourbrand.com</div>
    <svg width={48} height={40} viewBox="0 0 48 40"><path d="M2 2 L46 20 L2 38 L12 20 Z" fill="#1570EF" />
      <path d="M13 20 L28 20" stroke="#F6F7F7" strokeWidth={3.5} strokeLinecap="round" /></svg>
  </div>
);

const Tunnel: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fps, beats, assets, data }) => {
  const b: XBeats = { ...XB, ...(beats as Partial<XBeats>) };
  const land = data?.landMs ?? 3200;
  const imgs: string[] = (data?.tiles ?? []).map((n: string) => staticFile(pick(assets, n)));
  const hero = staticFile(pick(assets, data?.hero ?? "skims-3755019.jpg"));
  const mark = staticFile(pick(assets, "holo-mark-black.png"));
  const cz = camZ(t, b, land);
  const dpf = cz - camZ(t - 1000 / fps, b, land); // world px travelled this frame
  const ghosts = dpf > 60 ? [2 / 3, 1 / 3] : dpf > 25 ? [1 / 2] : [];
  const settle = easeOut3(win(t, land - 250, land + 200)); // the tunnel steps back in light as the hero lands
  const out = exitP(t, b);
  const els: React.ReactNode[] = [];
  const addTiles = (camera: number, alpha: number, tag: string) => {
    for (const tl of TILES) {
      const depth = tl.z - camera;
      if (depth < 130 || depth > 3300) continue;
      const fog = 1 - win(depth, 1400, 3300);
      const op = fog * alpha * (1 - 0.5 * settle);
      if (op < 0.02) continue;
      const blur = win(depth, 1700, 3000) * 2.6 + settle * win(depth, 900, 1500) * 1.2;
      els.push(<TileEl key={tag + tl.key} tl={tl} depth={depth} op={op} blur={blur} src={imgs[tl.img % imgs.length]} />);
    }
  };
  ghosts.forEach((g, i) => addTiles(camZ(t - (g * 1000) / fps, b, land), 0.34 - i * 0.08, `g${i}-`));
  addTiles(cz, 1, "m-");
  const heroDepth = HERO.z - cz;
  const heroOp = 1 - win(heroDepth, 2400, 3400);
  const chipDepth = CHIP_Z - cz;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, overflow: "hidden", opacity: 1 - out,
      background: "radial-gradient(ellipse at 50% 50%, #16161b 0%, #07070a 55%, #030304 100%)" }}>
      <div style={{ position: "absolute", inset: 0, perspective: P, perspectiveOrigin: "50% 50%",
        transform: `scale(${1 + 0.03 * out})` }}>
        {els}
        {/* depth fog: a flat veil stacked at depth ~1900, so everything deeper sinks into the dark */}
        <div style={{ position: "absolute", inset: 0, zIndex: 100000 - 19000, pointerEvents: "none",
          background: "radial-gradient(ellipse 34% 40% at 50% 50%, rgba(6,6,8,0.96) 0%, rgba(6,6,8,0.75) 45%, rgba(6,6,8,0) 100%)" }} />
        {heroOp > 0.01 && (
          <div style={{ position: "absolute", left: "50%", top: "50%", width: HERO.h * HERO.aspect, height: HERO.h,
            marginLeft: (-HERO.h * HERO.aspect) / 2, marginTop: -HERO.h / 2, opacity: heroOp,
            transform: `translateZ(${P - heroDepth}px)`, zIndex: Math.round(100000 - heroDepth * 10),
            boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 ${90 * settle}px rgba(255,236,220,${0.16 * settle})` }}>
            <Img src={hero} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        )}
        {chipDepth > 150 && <Chip depth={chipDepth} mark={mark} />}
      </div>
    </div>
  );
};

export const TUNNEL_KINDS = { "holo-x-tunnel": Tunnel };
