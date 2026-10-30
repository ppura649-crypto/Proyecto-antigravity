// `in`: the key ring. One split ring, 14 real-looking keys (round bow with a yellow Hugging Face rubber cover,
// shoulder, grooved blade, cut teeth, tip), hanging off the lower arc of the ring as a bunch, never a radial sun. Keys count up to
// "14", get a green check each on "valid", and small copies fly out to the swarm on "shared". Metaphor: key = login.
import React from "react";
import { Logo, HF, GOOD, rand } from "./parts";

/** key-ring geometry, column coords: a big split ring with the keys hanging off its lower arc */
export const RING = { cx: 450, cy: 830, r: 150, n: 14 };
/** the bunch's visual centre (where copies leave from, where the shadow sits) */
export const BUNCH = { x: 450, y: 1000 };
/** where key i threads onto the ring: spread over the lower arc */
export const holeAngle = (i: number) => 188 - (i * 196) / (RING.n - 1);
/** each key's own length factor */
export const keyLen = (i: number) => 0.9 + 0.16 * rand(i, 12);
/** the way key i hangs: gravity pulls it down, `fan` lets it splay (0 = all straight down, 1 = radial) */
export const keyDir = (i: number, fan: number, sway: number) => 90 + (holeAngle(i) - 90) * fan + sway * (1 + rand(i, 13));
export const keyHole = (i: number, sway: number) => {
  const r = ((holeAngle(i) + sway * 0.4) * Math.PI) / 180;
  return { x: RING.cx + RING.r * Math.cos(r), y: RING.cy + RING.r * Math.sin(r) };
};
/** a point `ext` px beyond key i's tip */
export const keyTip = (i: number, fan: number, sway: number, ext = 0) => {
  const h = keyHole(i, sway);
  const d = (keyDir(i, fan, sway) * Math.PI) / 180;
  const len = 186 * KEY_SCALE * keyLen(i) + ext;
  return { x: h.x + len * Math.cos(d), y: h.y + len * Math.sin(d) };
};
export const KEY_SCALE = 1.12;

/** the key's teeth: shallow plateau cuts along the blade's lower edge, different per key */
const bitting = (seed: number) => {
  let d = "M66 -11 L168 -11 L184 -1 L176 9";
  for (let c = 0; c < 4; c++) {
    const x = 166 - c * 24;
    const depth = 4 + Math.round(rand(seed, 20 + c) * 8);
    d += ` L${x} 9 L${x - 4} ${9 + depth} L${x - 12} ${9 + depth} L${x - 16} 9`;
  }
  return d + " L66 9 Z";
};

/** one key in local coords: the ring passes the bow's hole at (0,0); the blade points along +x */
export const InKey: React.FC<{ glow?: number; scale?: number; id: string; seed?: number; logo?: boolean }> = ({ glow = 0, scale = 1, id, seed = 0, logo }) => (
  <svg width={230 * scale} height={80 * scale} viewBox="-12 -40 230 80" style={{ overflow: "visible", display: "block" }}>
    <defs>
      <linearGradient id={`blade${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F7F7F9" />
        <stop offset="0.35" stopColor="#C4C7CE" />
        <stop offset="0.5" stopColor="#8E929B" />
        <stop offset="0.7" stopColor="#D8DADF" />
        <stop offset="1" stopColor="#9EA2AA" />
      </linearGradient>
      <radialGradient id={`cap${id}`} cx="0.36" cy="0.3" r="0.85">
        <stop offset="0" stopColor="#FFEC8C" />
        <stop offset="0.5" stopColor={HF} />
        <stop offset="1" stopColor="#C98C00" />
      </radialGradient>
    </defs>
    {/* blade: body with a milled groove, teeth cut into the lower edge, bevelled tip */}
    <path d={bitting(seed)} fill={`url(#blade${id})`} stroke="#5E626A" strokeWidth={1.4} strokeLinejoin="round" />
    <path d="M72 -4 L166 -4" stroke="#6F737C" strokeWidth={3} strokeLinecap="round" opacity={0.75} />
    <path d="M72 -1 L164 -1" stroke="#FFFFFF" strokeWidth={1.2} opacity={0.5} />
    {/* shoulder: the stop where the key meets the lock */}
    <path d="M48 -18 L66 -18 L66 -11 L64 -11 L64 9 L66 9 L66 16 L48 16 Z" fill={`url(#blade${id})`} stroke="#5E626A" strokeWidth={1.4} />
    {/* the bow, in its yellow rubber cover, with the hole the ring runs through */}
    <path d="M2 -30 C-14 -30 -14 30 2 30 L34 30 C44 30 50 22 50 12 L50 -12 C50 -22 44 -30 34 -30 Z" fill={`url(#cap${id})`} stroke="#A87200" strokeWidth={1.6} />
    <path d="M4 -24 C-6 -22 -6 -8 -2 -4" stroke="#FFF6C8" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
    <circle cx={0} cy={0} r={7} fill="#0C0C0E" stroke="#8A5F00" strokeWidth={1.5} />
    {logo && <foreignObject x={10} y={-17} width={34} height={34}><Logo name="huggingface" size={34} /></foreignObject>}
    {glow > 0 && <path d="M2 -35 C-20 -35 -20 35 2 35 L34 35 C48 35 55 25 55 12 L55 -12 C55 -25 48 -35 34 -35 Z" fill="none" stroke="#FFF3B0" strokeWidth={4} opacity={glow} />}
  </svg>
);

/** a key hanging from the ring; the Hugging Face mark rides upright on its yellow cover */
export const RingKey: React.FC<{ i: number; fan: number; sway: number; style: React.CSSProperties; glow: number }> = ({ i, fan, sway, style, glow }) => {
  const h = keyHole(i, sway);
  const a = keyDir(i, fan, sway);
  const rad = (a * Math.PI) / 180;
  const L = keyLen(i) * KEY_SCALE;
  const capX = h.x + 26 * L * Math.cos(rad);
  const capY = h.y + 26 * L * Math.sin(rad);
  const s = 28 * L;
  return (
    <>
      <div style={{ position: "absolute", left: h.x, top: h.y, width: 0, height: 0, transform: `rotate(${a}deg) scale(${L})`, zIndex: 2 + (i % 2) * 2 }}>
        <div style={{ position: "absolute", left: -12, top: -40, transformOrigin: "12px 40px", ...style }}>
          <InKey id={`k${i}`} seed={i} glow={glow} />
        </div>
      </div>
      <div style={{ position: "absolute", left: capX - s / 2, top: capY - s / 2, zIndex: 3 + (i % 2) * 2, ...style, transform: `${style.transform ?? ""} rotate(${(rand(i, 3) - 0.5) * 16}deg)` }}>
        <Logo name="huggingface" size={s} />
      </div>
    </>
  );
};

/** the green check that lands on a key's tip on "valid" */
export const Check: React.FC<{ x: number; y: number; style: React.CSSProperties }> = ({ x, y, style }) => (
  <div style={{ position: "absolute", left: x - 21, top: y - 21, width: 42, height: 42, borderRadius: 21, background: GOOD, boxShadow: `0 0 18px 4px ${GOOD}88`, zIndex: 6, ...style }}>
    <svg width={42} height={42} viewBox="0 0 42 42">
      <path d="M12 22 L18.5 28.5 L30.5 14.5" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

/** the split steel ring itself: two coils, a highlight that catches the light */
export const Ring: React.FC<{ sway: number }> = ({ sway }) => {
  const c = RING.r + 12;
  return (
    <svg width={c * 2} height={c * 2} style={{ position: "absolute", left: RING.cx - c, top: RING.cy - c, zIndex: 1, overflow: "visible", transform: `rotate(${sway * 2}deg)` }}>
      <defs>
        <linearGradient id="ringMetal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.4" stopColor="#A6AAB2" />
          <stop offset="0.7" stopColor="#E3E5E9" />
          <stop offset="1" stopColor="#7C8089" />
        </linearGradient>
      </defs>
      <circle cx={c} cy={c} r={RING.r + 3} fill="none" stroke="#6C7078" strokeWidth={6} />
      <circle cx={c} cy={c} r={RING.r} fill="none" stroke="url(#ringMetal)" strokeWidth={7} />
      <circle cx={c} cy={c} r={RING.r} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.55} strokeDasharray="36 400" />
    </svg>
  );
};
