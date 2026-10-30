// Hook X3 (the counterfeit cast), the shared space: the word times, the forge camera (a bed of hot material seen from
// the front and above), one projection that matches the CSS 3D camera exactly, so particles drawn in SVG sit in the
// same world as the marks drawn with CSS 3D, and the colour ramp of hot metal.
import React from "react";
import { Img, interpolateColors } from "remotion";
import { useScene } from "../../../src/engine";
import { asset } from "./parts";

/** the stage box (local to <Column>): page y 520..1450, x 0..900 */
export const TOP = 520;
export const W = 900;
export const H = 930;
/** the bed's origin on screen (the imprint's centre) and the camera */
export const CX = 450;
export const CY = 610;
export const TILT = 56;
export const P = 1400;
/** the die, the imprint and the cast: one size on the bed */
export const DS = 360;

const SIN = Math.sin((TILT * Math.PI) / 180);
const COS = Math.cos((TILT * Math.PI) / 180);

/** a point on the bed (x right, y toward the viewer, z up) to the screen, same maths as CSS rotateX + perspective */
export const proj = (x: number, y: number, z: number) => {
  const y1 = y * COS - z * SIN;
  const z1 = y * SIN + z * COS;
  const s = P / (P - z1);
  return { x: CX + x * s, y: CY + y1 * s, s };
};

export type T = { f: number; from: number; ch: number; ai: number; co: number; copy: number; an: number; mo: number };

export function useTimes(): T {
  const { cue, f, scene } = useScene();
  return {
    f, from: scene.from, ch: cue("chinese"), ai: cue("ai"), co: cue("companies"), copy: cue("copy"), an: cue("anthropic"), mo: cue("models"),
  };
}

export const maskOf = (name: string) => `url(${asset(`logo-${name}.png`)}) center / contain no-repeat`;

/** the real mark's alpha as a mask on a plain box, so it can be filled with metal, heat or light. `extra` is a second
 *  mask on a wrapper (nested, not a composited mask list: a list whose image is still decoding drops that layer
 *  in renderMedia and the box shows square) */
export const Masked: React.FC<{ name: string; size: number; bg: string; style?: React.CSSProperties; extra?: string }> = ({ name, size, bg, style, extra }) => {
  const m = maskOf(name);
  const box: React.CSSProperties = { position: "absolute", left: -size / 2, top: -size / 2, width: size, height: size };
  if (!extra) return <div style={{ ...box, background: bg, WebkitMask: m, mask: m, ...style }} />;
  return (
    <div style={{ ...box, WebkitMask: extra, mask: extra, ...style }}>
      <div style={{ position: "absolute", inset: 0, background: bg, WebkitMask: m, mask: m }} />
    </div>
  );
};

/** the marks' files, loaded before any frame is taken (Remotion waits on <Img>), so every CSS mask has its image */
export const Preload: React.FC = () => (
  <>
    {["claude", "qwen"].map((n) => (
      <Img key={n} src={asset(`logo-${n}.png`)} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />
    ))}
  </>
);

/** hot metal: white, straw, orange, cherry red, then the metal's own colour. h in 0..1 */
const HEAT_IN = [0, 0.14, 0.32, 0.5, 0.68, 0.84, 1];
const HEAT_OUT = ["#221C5E", "#5A1C2E", "#B5301C", "#F0621C", "#FFA43A", "#FFE3A6", "#FFFFFF"];
export const heat = (h: number) => interpolateColors(Math.max(0, Math.min(1, h)), HEAT_IN, HEAT_OUT);

/** a stack of the bed world: a perspective box with the bed plane tilted in it. Children sit on the bed (translateZ) */
export const Bed3D: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", inset: 0, perspective: P, perspectiveOrigin: `${CX}px ${CY}px` }}>
    <div style={{ position: "absolute", left: CX, top: CY, width: 0, height: 0, transformStyle: "preserve-3d", transform: `rotateX(${TILT}deg)` }}>{children}</div>
  </div>
);

/** deterministic pseudo-random in 0..1, so a swarm lays out the same every frame */
export const rand = (i: number, salt = 1) => {
  const s = Math.sin(i * 127.1 * salt + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
