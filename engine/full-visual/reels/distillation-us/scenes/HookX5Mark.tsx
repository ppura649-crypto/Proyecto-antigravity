// Hook X5, the marks as glossy slabs. A real mark (Claude's, or Qwen's) is stacked into a thin 3D slab (the same
// crisp PNG repeated behind itself, darkened, so it has an edge when it turns), with a specular band that slides as it
// turns (the light has a source: the spotlight above-left). Claude's face can be stained violet from the floor edge
// up, and it can rebuild into Qwen's mark through a sweeping seam. `Standing` places a slab on the floor; `Hinged`
// places one hinged on the floor line, where 180 deg is its reflection in the black mirror and 0 is upright.
import React from "react";
import { Img } from "remotion";
import { QWEN, asset } from "./parts";

export type Look = {
  size: number;
  rotY: number;
  rotZ: number;
  /** 0..1 violet stain on Claude's face */
  tint: number;
  /** 0..1 Claude -> Qwen, a seam sweeping round the centre */
  morph: number;
  bright: number;
};

const logoMask = (n: "claude" | "qwen"): React.CSSProperties => ({
  WebkitMaskImage: `url(${asset(`logo-${n}.png`)})`,
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
});
const fill: React.CSSProperties = { position: "absolute", inset: 0 };

/** the specular band: where it sits follows the turn, so light slides across the face as the slab rotates */
const Sheen: React.FC<{ n: "claude" | "qwen"; rotY: number }> = ({ n, rotY }) => {
  const c = 50 + 95 * Math.sin((rotY * Math.PI) / 180 - 0.5);
  return (
    <div
      style={{
        ...fill,
        ...logoMask(n),
        background: `linear-gradient(108deg, transparent ${c - 16}%, rgba(255,255,255,0.5) ${c}%, transparent ${c + 16}%), linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0) 45%, rgba(0,0,0,0.3))`,
      }}
    />
  );
};

/** one face of the slab. Front face gets the sheen and the rebuild seam; back layers are the dark edge */
const Face: React.FC<{ look: Look; front: boolean }> = ({ look, front }) => {
  const a = look.morph * 360;
  const cMask = `conic-gradient(from 200deg at 50% 50%, transparent 0deg ${a}deg, #000 ${a + 0.5}deg)`;
  const qMask = `conic-gradient(from 200deg at 50% 50%, #000 0deg ${a}deg, transparent ${a + 0.5}deg)`;
  const t = look.tint;
  const seam = look.morph > 0 && look.morph < 1;
  const seamBg = `conic-gradient(from 200deg at 50% 50%, transparent 0deg ${a - 26}deg, rgba(210,205,255,0.6) ${a - 6}deg, #FFFFFF ${a}deg, transparent ${a + 1.5}deg)`;
  return (
    <>
      {look.morph < 1 && (
        <div style={{ ...fill, WebkitMaskImage: cMask }}>
          <Img src={asset("logo-claude.png")} style={{ width: "100%", height: "100%", display: "block" }} />
          {t > 0 && (
            <div
              style={{
                ...fill,
                ...logoMask("claude"),
                background: `linear-gradient(to top, #5A55F0 0%, ${QWEN} ${Math.max(0, t * 150 - 55)}%, rgba(97,92,237,0) ${t * 150}%)`,
                opacity: Math.min(1, t * 1.15),
              }}
            />
          )}
          {front && <Sheen n="claude" rotY={look.rotY} />}
        </div>
      )}
      {look.morph > 0 && (
        <div style={{ ...fill, WebkitMaskImage: qMask }}>
          <Img src={asset("logo-qwen.png")} style={{ width: "100%", height: "100%", display: "block" }} />
          {front && <Sheen n="qwen" rotY={look.rotY} />}
        </div>
      )}
      {front && seam && (
        <>
          <div style={{ ...fill, ...logoMask("claude"), background: seamBg }} />
          <div style={{ ...fill, ...logoMask("qwen"), background: seamBg }} />
        </>
      )}
    </>
  );
};

/** the slab: DEPTH darkened copies behind the face, spaced along z, so an edge shows as it turns */
export const Slab: React.FC<{ look: Look; depth?: number; opacity?: number }> = ({ look, depth = 7, opacity = 1 }) => {
  const layers: React.ReactNode[] = [];
  for (let i = depth; i >= 0; i--)
    layers.push(
      <div
        key={i}
        style={{ ...fill, transform: `translateZ(${(-i * 2.6).toFixed(1)}px)`, filter: i ? `brightness(${(0.3 + 0.2 * (1 - i / depth) + 0.35 * Math.max(look.tint, look.morph)).toFixed(2)})` : `brightness(${look.bright.toFixed(3)})` }}
      >
        <Face look={look} front={i === 0} />
      </div>,
    );
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1100, opacity }}>
      <div style={{ ...fill, transformStyle: "preserve-3d", transform: `rotateZ(${look.rotZ.toFixed(2)}deg) rotateY(${look.rotY.toFixed(2)}deg)` }}>{layers}</div>
    </div>
  );
};

export type Place = { x: number; floor: number; lift: number; scale?: number };

/** a slab standing on the floor, with motion ghosts (earlier rotations) while it spins fast */
export const Standing: React.FC<{ look: Look; at: Place; ghosts?: number[]; glow?: string }> = ({ look, at, ghosts = [], glow }) => {
  const s = look.size;
  return (
    <div
      style={{
        position: "absolute", left: at.x - s / 2, top: at.floor - s - at.lift, width: s, height: s,
        transformOrigin: "50% 100%", transform: `scale(${(at.scale ?? 1).toFixed(4)})`, filter: glow,
      }}
    >
      {ghosts.map((g, i) => (
        <Slab key={i} look={{ ...look, rotY: g }} depth={0} opacity={0.16 + 0.1 * i} />
      ))}
      <Slab look={look} />
    </div>
  );
};

/**
 * A slab hinged on the floor line. `phi` 180 = lying mirrored under the floor (its reflection), 0 = standing.
 * `mirror` 1 fades it like a reflection in black glass (strong at the floor line, gone further down); `wave` bends it
 * with the floor's liquid shimmer (the SVG filter #hx5wave, drawn by the hook).
 */
export const Hinged: React.FC<{ look: Look; at: Place; phi: number; mirror: number; wave: number; opacity?: number; ghosts?: number[]; glow?: string }> = ({
  look, at, phi, mirror, wave, opacity = 1, ghosts = [], glow,
}) => {
  const s = look.size;
  const m = mirror;
  const mask = `linear-gradient(to top, rgba(0,0,0,${(1 - 0.42 * m).toFixed(3)}) 0%, rgba(0,0,0,${(1 - 0.8 * m).toFixed(3)}) ${100 - 45 * m}%, rgba(0,0,0,${(1 - m).toFixed(3)}) 100%)`;
  return (
    <div
      style={{
        position: "absolute", left: at.x - s / 2, top: at.floor - s - at.lift, width: s, height: s, opacity,
        transformOrigin: "50% 100%", transform: `perspective(1300px) rotateX(${phi.toFixed(2)}deg) scale(${(at.scale ?? 1).toFixed(4)})`,
        WebkitMaskImage: mask, filter: wave > 0.01 ? `url(#hx5wave) blur(${(0.4 + 1.2 * m).toFixed(2)}px)` : m > 0.01 ? `blur(${(1.2 * m).toFixed(2)}px)${m < 0.9 && glow ? ` ${glow}` : ""}` : glow,
      }}
    >
      {ghosts.map((g, i) => (
        <Slab key={i} look={{ ...look, rotY: g }} depth={0} opacity={0.14 + 0.1 * i} />
      ))}
      <Slab look={look} />
    </div>
  );
};
