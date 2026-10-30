// HookV1's agent: a glossy capsule robot (metal head, black visor, two glowing eye slits, an antenna light, shoulders),
// seen from the front while it is OpenAI's test-taker and from the back (a red seam, a red thruster) once it turns on
// the target. Plus the fleet: 700 slots on a floor in perspective, and the camera that projects them.
import React from "react";
import { rand } from "./parts";

const HEAD = "linear-gradient(165deg,#f6fafd 0%,#c6d0da 28%,#6f7b89 68%,#262d36 100%)";
const HEAD_BACK = "linear-gradient(165deg,#7d8997 0%,#434c58 45%,#161a20 100%)";
const BODY = "linear-gradient(180deg,#a3afbc 0%,#46505c 55%,#1a1f26 100%)";
const px = (n: number) => `${n.toFixed(2)}px`;

export type BotProps = {
  x: number; y: number; s: number; eye: string; glow?: number; turn?: number; o?: number; fog?: number; blink?: number;
};

/** x centre, y feet, s head height. turn 0 front, 1 back (it flips through edge-on). */
export const Bot: React.FC<BotProps> = ({ x, y, s, eye, glow = 1, turn = 0, o = 1, fog = 0, blink = 1 }) => {
  const w = 0.94 * s;
  const h = 1.34 * s;
  const sx = Math.max(0.05, Math.abs(Math.cos(Math.PI * turn)));
  const back = turn > 0.5;
  const small = s < 30;
  const g = Math.max(0.2, glow);
  const eyeShadow = `0 0 ${px(0.26 * s * g)} ${px(0.06 * s * g)} ${eye}`;
  const box = (l: number, t: number, ww: number, hh: number, st: React.CSSProperties): React.CSSProperties => ({
    position: "absolute", left: px(l), top: px(t), width: px(ww), height: px(hh), ...st,
  });
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h, width: w, height: h, opacity: o * (1 - 0.62 * fog), transform: `scaleX(${sx.toFixed(3)})` }}>
      {!small && (
        <div style={box(-0.08 * w, h - 0.08 * s, 1.16 * w, 0.16 * s, { borderRadius: "50%", background: "radial-gradient(closest-side, rgba(0,0,0,.75), transparent)" })} />
      )}
      {!small && <div style={box(0.5 * w - Math.max(1, 0.02 * s), 0.05 * s, Math.max(2, 0.04 * s), 0.14 * s, { background: "#9aa6b3" })} />}
      {!small && <div style={box(0.5 * w - 0.05 * s, 0, 0.1 * s, 0.1 * s, { borderRadius: "50%", background: eye, boxShadow: eyeShadow })} />}
      <div style={box(0.08 * w, h - 0.38 * s, 0.84 * w, 0.38 * s, { background: back ? HEAD_BACK : BODY, borderRadius: `${px(0.36 * s)} ${px(0.36 * s)} ${px(0.1 * s)} ${px(0.1 * s)}` })}>
        {!back && !small && <div style={box(0.42 * w - 0.05 * s, 0.12 * s, 0.1 * s, 0.1 * s, { borderRadius: "50%", background: eye, boxShadow: eyeShadow })} />}
      </div>
      {back && (
        <div style={box(0.1 * w, h - 0.16 * s, 0.8 * w, 0.42 * s, { borderRadius: "50%", background: `radial-gradient(closest-side, ${eye}, ${eye}55 45%, transparent)` })} />
      )}
      <div
        style={box(0, 0.15 * s, w, 0.78 * s, {
          borderRadius: px(0.32 * s), background: back ? HEAD_BACK : HEAD,
          boxShadow: small ? undefined : `inset 0 ${px(-0.06 * s)} ${px(0.1 * s)} rgba(0,0,0,.45), 0 ${px(0.04 * s)} ${px(0.1 * s)} rgba(0,0,0,.5)`,
        })}
      >
        {!small && <div style={box(0.12 * w, 0.04 * s, 0.36 * w, 0.12 * s, { borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,.85), transparent)" })} />}
        {back ? (
          <div style={box(0.1 * w, 0.36 * s, 0.8 * w, Math.max(2, 0.05 * s), { borderRadius: 99, background: eye, boxShadow: eyeShadow })} />
        ) : (
          <div style={box(0.09 * w, 0.2 * s, 0.82 * w, 0.36 * s, { borderRadius: px(0.17 * s), background: "linear-gradient(180deg,#02050a,#111a25)", boxShadow: small ? undefined : `inset 0 ${px(0.03 * s)} ${px(0.06 * s)} rgba(0,0,0,.9)` })}>
            {[-1, 1].map((k) => (
              <div
                key={k}
                style={box(0.41 * w + k * 0.17 * s - 0.09 * s, 0.18 * s - 0.045 * s * blink, 0.18 * s, Math.max(1.2, 0.09 * s * blink), { borderRadius: 99, background: eye, boxShadow: eyeShadow })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/** a light streak from (x1,y1) to (x2,y2): the stream an agent leaves behind while it flies */
export const Streak: React.FC<{ x1: number; y1: number; x2: number; y2: number; w: number; color: string; o?: number }> = ({ x1, y1, x2, y2, w, color, o = 1 }) => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 2) return null;
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <div
      style={{
        position: "absolute", left: x1, top: y1 - w / 2, width: len, height: w, borderRadius: w, opacity: o, transformOrigin: `0 ${w / 2}px`,
        transform: `rotate(${a}rad)`, background: `linear-gradient(90deg, transparent, ${color}66 55%, ${color})`,
      }}
    />
  );
};

// ---- the fleet in world space ----
export type Slot = { i: number; X: number; Z: number; ph: number; r: number };

/** 700 slots: rows on a floor, nearest row at Z 1.25, each row as wide as the view, cut to exactly 700; far first */
export const FLEET: Slot[] = (() => {
  const out: Slot[] = [];
  let Z = 1.25;
  let row = 0;
  while (out.length < 700) {
    const half = 0.95 * Z + 0.3;
    const n = Math.floor((2 * half) / 0.34) + 1;
    const cands: Slot[] = [];
    for (let j = 0; j < n; j++) {
      const k = row * 97 + j;
      const X = -half + (j * 2 * half) / (n - 1) + (rand(k, 3) - 0.5) * 0.12 + (row % 2 ? 0.08 : 0);
      cands.push({ i: 0, X, Z: Z + (rand(k, 5) - 0.5) * 0.08, ph: rand(k, 7) * 6.28, r: rand(k, 11) });
    }
    cands.sort((a, b) => Math.abs(a.X) - Math.abs(b.X));
    out.push(...cands.slice(0, 700 - out.length));
    Z += 0.3 + 0.02 * Z;
    row++;
  }
  out.sort((a, b) => b.Z - a.Z);
  out.forEach((s, i) => (s.i = i));
  return out;
})();

/** band coords (page y - 520): the horizon line and the camera */
export const HOR = 270;
export type Cam = { z: number; x: number };
/** screen position of a slot's feet and its head size */
export function project(sl: Slot, cam: Cam) {
  const zr = Math.max(0.35, sl.Z - cam.z);
  return { x: 540 + ((sl.X - cam.x) * 600) / zr, y: HOR + 732 / zr, s: 140 / zr, zr };
}
