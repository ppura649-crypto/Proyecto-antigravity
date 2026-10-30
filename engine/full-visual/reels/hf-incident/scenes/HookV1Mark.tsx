// HookV1's OpenAI mark: it spins in big and glowing, coils on "did", and on "700" its knot unravels into six petals
// that swirl out (spilling the agents as they go) and reassemble small at the horizon on "OpenAI", the fleet's emblem.
import React from "react";
import { ease, prog } from "../../../src/engine";
import { AGENT, asset, Logo } from "./parts";

/** band coords (page y - 520) */
export const LOGO = { x: 540, y: 430, size: 540 };
export const EMBLEM = { x: 540, y: 238, size: 130 };
const dirOf = (i: number) => ((-60 + 60 * i) * Math.PI) / 180;

/** one petal's pose at flight progress p (0 = in the big mark, 1 = in the emblem) */
export function petalAt(i: number, p: number) {
  const q = ease.inOut(Math.min(1, Math.max(0, p)));
  const bulge = Math.sin(Math.PI * Math.min(1, Math.max(0, p)));
  const a = dirOf(i) + 1.9 * q;
  const R = 330 * Math.pow(bulge, 0.8);
  const sc = (1 + (EMBLEM.size / LOGO.size - 1) * q) * (1 - 0.3 * bulge);
  const rot = 360 * q + 38 * bulge * (i % 2 ? 1 : -1);
  const x = LOGO.x + (EMBLEM.x - LOGO.x) * q + R * Math.cos(a);
  const y = LOGO.y + (EMBLEM.y - LOGO.y) * q + R * Math.sin(a);
  // where the petal's own stroke sits: the pivot plus its centroid, turned with it
  const c = dirOf(i) + (rot * Math.PI) / 180;
  const off = 0.3 * LOGO.size * sc;
  return { x, y, sc, rot, cx: x + off * Math.cos(c), cy: y + off * Math.sin(c) };
}

const clipOf = (i: number) => {
  const pt = (deg: number) => {
    const r = (deg * Math.PI) / 180;
    return `${(50 + 100 * Math.cos(r)).toFixed(2)}% ${(50 + 100 * Math.sin(r)).toFixed(2)}%`;
  };
  const c = -60 + 60 * i;
  return `polygon(50% 50%, ${pt(c - 30.4)}, ${pt(c)}, ${pt(c + 30.4)})`;
};

const MarkImg: React.FC<{ size: number; sheen?: number }> = ({ size, sheen }) => (
  <div style={{ position: "relative", width: size, height: size }}>
    <Logo name="openai" size={size} style={{ filter: "invert(1) brightness(0.86)" }} />
    {sheen !== undefined && (
      <div
        style={{
          position: "absolute", inset: 0, WebkitMaskImage: `url(${asset("logo-openai.png")})`, WebkitMaskSize: "contain", maskImage: `url(${asset("logo-openai.png")})`, maskSize: "contain",
          background: `linear-gradient(115deg, transparent ${(sheen * 140 - 40).toFixed(1)}%, rgba(255,255,255,1) ${(sheen * 140 - 25).toFixed(1)}%, ${AGENT} ${(sheen * 140 - 18).toFixed(1)}%, transparent ${(sheen * 140 - 5).toFixed(1)}%)`,
        }}
      />
    )}
  </div>
);

type T = { f: number; from: number; did: number; n700: number; openai: number; end: number };

/** the big mark before "700": spins in with a trail, coils and hums on "did" */
const BigMark: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const inP = prog(f, t.from - 6, 30, ease.outHard);
  const coil = prog(f, t.did, t.n700 - t.did, ease.in);
  const hum = coil * Math.sin(f * 2.1) * 3;
  const glow = 0.6 + 0.25 * Math.sin(f / 9) + 1.4 * coil;
  const pose = (fr: number) => {
    const p = prog(fr, t.from - 6, 30, ease.outHard);
    return { r: -150 * (1 - p) + 8 * coil, s: (1.55 - 0.55 * p) * (1 - 0.05 * coil) };
  };
  const ghosts = [6, 4, 2, 0];
  return (
    <div style={{ position: "absolute", left: LOGO.x - LOGO.size / 2, top: LOGO.y - LOGO.size / 2, width: LOGO.size, height: LOGO.size, transform: `translate(${hum.toFixed(2)}px, ${(hum * 0.6).toFixed(2)}px)` }}>
      {ghosts.map((d) => {
        const g = pose(f - d);
        const o = d === 0 ? inP : 0.22 * (1 - inP) * (1 - d / 8);
        if (o < 0.01) return null;
        return (
          <div
            key={d}
            style={{
              position: "absolute", inset: 0, opacity: o, transform: `rotate(${g.r.toFixed(2)}deg) scale(${g.s.toFixed(4)})`,
              filter: d === 0 ? `drop-shadow(0 0 ${(7 * glow).toFixed(1)}px ${AGENT}55) drop-shadow(0 0 ${(4 * glow).toFixed(1)}px #ffffff99)` : undefined,
            }}
          >
            <MarkImg size={LOGO.size} sheen={d === 0 ? prog(f, t.from + 10, 40, ease.inOut) + coil * 0.0 : undefined} />
          </div>
        );
      })}
    </div>
  );
};

/** the light the mark sits in: a bloom and slow rays; it flares on "700" and shrinks away with the petals */
export const MarkLight: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const inP = prog(f, t.from - 6, 24, ease.out);
  const coil = prog(f, t.did, t.n700 - t.did, ease.in);
  const flare = f >= t.n700 ? 1 - prog(f, t.n700, 26, ease.out) : 0;
  const gone = prog(f, t.n700 + 8, 30, ease.in);
  const o = inP * (1 - gone) * (0.4 + 0.25 * coil) + 0.6 * flare;
  if (o <= 0.01) return null;
  const size = 1100 * (1 + 0.3 * flare);
  return (
    <div style={{ position: "absolute", left: LOGO.x - size / 2, top: LOGO.y - size / 2, width: size, height: size, opacity: Math.min(1, o), pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(closest-side, rgba(200,240,255,.22), ${AGENT}14 35%, transparent 72%)` }} />
      <div
        style={{
          position: "absolute", inset: 0, borderRadius: "50%", transform: `rotate(${(f * 0.35).toFixed(2)}deg)`,
          background: `repeating-conic-gradient(from 0deg, rgba(190,235,255,.16) 0deg 3deg, transparent 3deg 15deg)`,
          WebkitMaskImage: "radial-gradient(closest-side, #000 20%, transparent 95%)", maskImage: "radial-gradient(closest-side, #000 20%, transparent 95%)",
        }}
      />
    </div>
  );
};

/** after "700": six petals swirling out and back into the emblem, each with two trailing ghosts */
const Petals: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const dur = t.openai - t.n700;
  const pAt = (fr: number) => prog(fr, t.n700, dur, ease.linear);
  const seam = 1 - prog(f, t.n700, 10, ease.out);
  return (
    <div style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 ${(6 + 12 * seam).toFixed(1)}px ${AGENT}55) drop-shadow(0 0 3px #ffffff99)` }}>
      {[8, 4, 0].map((d) =>
        [0, 1, 2, 3, 4, 5].map((i) => {
          const p = pAt(f - d);
          const pose = petalAt(i, p);
          const o = d === 0 ? 1 : 0.28 - d * 0.025;
          if (d > 0 && (p <= 0 || p >= 1)) return null;
          return (
            <div
              key={`${d}-${i}`}
              style={{
                position: "absolute", left: pose.x - LOGO.size / 2, top: pose.y - LOGO.size / 2, width: LOGO.size, height: LOGO.size, opacity: o,
                clipPath: clipOf(i), transform: `rotate(${pose.rot.toFixed(2)}deg) scale(${pose.sc.toFixed(4)})`,
              }}
            >
              <MarkImg size={LOGO.size} />
            </div>
          );
        }),
      )}
    </div>
  );
};

/** the reassembled emblem on the horizon: snaps together on "OpenAI" with a flash, breathes, leaves on "end" */
const Emblem: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  const snap = 1 - prog(f, t.openai, 18, ease.out);
  const out = prog(f, t.end - 4, 16, ease.in);
  const glow = 0.7 + 0.2 * Math.sin(f / 8) + 1.6 * snap;
  const s = 1 + 0.12 * snap * Math.cos((f - t.openai) * 0.6);
  return (
    <div
      style={{
        position: "absolute", left: EMBLEM.x - EMBLEM.size / 2, top: EMBLEM.y - EMBLEM.size / 2, opacity: 1 - out, transform: `scale(${(s * (1 - 0.4 * out)).toFixed(4)})`,
        filter: `drop-shadow(0 0 ${(6 * glow).toFixed(1)}px ${AGENT}55) drop-shadow(0 0 ${(3 * glow).toFixed(1)}px #ffffff99)`,
      }}
    >
      <MarkImg size={EMBLEM.size} sheen={prog(f, t.openai, 30, ease.inOut)} />
    </div>
  );
};

export const OpenAIMark: React.FC<{ t: T }> = ({ t }) => {
  const { f } = t;
  if (f < t.n700) return <BigMark t={t} />;
  if (f < t.openai) return <Petals t={t} />;
  if (f < t.end + 14) return <Emblem t={t} />;
  return null;
};
