import React from "react";
import { OffthreadVideo, Sequence } from "remotion";
import { Flange } from "./L-film";
import { CY, SH } from "./L-util";
// keyframes-v1 builder L: the take-up reel as a real 3D drum (vertical axle, faces textured with the wound film
// L-roll.jpg, so the strip on the flat and the film on the drum are one continuous band at the tangent line), and the
// phone their finished reel plays in.

const N = 44, TEX = 1200;
export const Reel: React.FC<{
  cx: number; r: number; R: number; s: number; tipDeg: number; lift: number; scale: number; blur: number; roll: string; opacity: number;
}> = ({ cx, r, R, s, tipDeg, lift, scale, blur, roll, opacity }) => {
  const dA = (Math.PI * 2) / N, fw = r * dA + 2.6, spinDeg = ((s / r) * 180) / Math.PI;
  const faces: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const a = -Math.PI + (i + 0.5) * dA;
    const lit = Math.cos(a);
    if (lit < -0.35 && tipDeg > -20) continue;       // the back of the drum, never seen while it stands
    const fLeft = s + (a - dA / 2) * r;
    const off = ((fLeft % TEX) + TEX) % TEX;
    const shade = 0.28 + 0.72 * Math.max(0, lit) ** 0.8 + 0.1 * Math.max(0, Math.sin(-a)) * Math.max(0, lit);
    faces.push(
      <div key={i} style={{ position: "absolute", left: -fw / 2, top: -SH / 2, width: fw, height: SH,
        transform: `rotateY(${(a * 180) / Math.PI}deg) translateZ(${r}px)`, backfaceVisibility: "hidden",
        backgroundImage: `url(${roll})`, backgroundSize: `${TEX}px ${SH}px`, backgroundPosition: `${-off}px 0px`, backgroundRepeat: "repeat-x",
        filter: `brightness(${shade.toFixed(3)})${blur > 0.3 ? ` blur(${blur.toFixed(2)}px)` : ""}` }} />,
    );
  }
  const flat = (y: number, extra = "") => `translateY(${y}px) rotateX(90deg)${extra}`;
  return (
    <div style={{ position: "absolute", left: cx, top: CY, width: 0, height: 0, transformStyle: "preserve-3d", opacity,
      transform: `translate3d(0, 0, ${-r * scale + lift}px) scale3d(${scale}, ${scale}, ${scale}) rotateX(${tipDeg}deg)` }}>
      {faces}
      {/* the wound pack's top: film layers as fine rings round a steel core */}
      <div style={{ position: "absolute", left: -r, top: -r, width: 2 * r, height: 2 * r, borderRadius: "50%",
        transform: flat(-SH / 2 + 1),
        background: "radial-gradient(circle, #9aa0a7 0 17%, #3a2a1e 17% 18.5%, transparent 18.5%), repeating-radial-gradient(circle, #24180f 0 1.5px, #3b2819 1.5px 3px)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d", transform: flat(-SH / 2 - 4) }}>
        <Flange R={R} spinDeg={spinDeg} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d", transform: flat(SH / 2 + 4) }}>
        <Flange R={R} spinDeg={spinDeg} />
      </div>
    </div>
  );
};

// the phone: device shape, their finished reel playing from `fromMs` at `startSec`
export const Phone: React.FC<{ video: string; fps: number; fromMs: number; startSec: number; style: React.CSSProperties }> = ({ video, fps, fromMs, startSec, style }) => (
  <div style={{ position: "absolute", width: 292, height: 600, borderRadius: 48, background: "#0a0a0b",
    boxShadow: "0 0 0 3px #3a3a3e, 0 0 0 4px #17171a, 0 34px 70px rgba(0,0,0,0.6), 0 10px 22px rgba(0,0,0,0.45)", ...style }}>
    <div style={{ position: "absolute", left: 9, top: 9, right: 9, bottom: 9, borderRadius: 40, overflow: "hidden", background: "#000" }}>
      <Sequence from={Math.floor((fromMs / 1000) * fps)} layout="none">
        <OffthreadVideo src={video} muted startFrom={Math.round(startSec * fps)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      </Sequence>
      <div style={{ position: "absolute", left: "50%", top: 12, width: 86, height: 25, marginLeft: -43, borderRadius: 13, background: "#000" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(125deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 32%)" }} />
    </div>
    {[[-4, 120, 56], [-4, 190, 56], [292, 150, 90]].map(([x, y, hh], i) => (
      <div key={i} style={{ position: "absolute", left: x, top: y, width: 4, height: hh, background: "#2e2e32", borderRadius: 2 }} />
    ))}
  </div>
);
