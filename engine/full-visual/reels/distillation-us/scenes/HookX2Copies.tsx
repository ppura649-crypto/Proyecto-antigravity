// Hook X2, the copies. Each one is printed on the glass by the lamp (the real Claude mark, white-hot as it forms),
// peels off behind the lamp in strips that curl like a fresh sheet, detaches, flies an arc to the tray with flutter
// and a trail, passes through a violet flash where it recolours into the real Qwen mark and hardens flat, and lands
// on the pile with a small bounce and a ring of light. The pile is the stack of every copy that has landed.
import React from "react";
import { Img } from "remotion";
import { ease, prog } from "../../../src/engine";
import { QWEN, asset } from "./parts";
import { BX, Copy, MS, PX, PY, SHEET, STRIPS, crossAt } from "./HookX2Plan";

export const hash = (i: number, s: number) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const SH = MS / STRIPS;
/** progress through a fraction of a flight (prog() works in whole frames) */
const seg = (u: number, a: number, d: number, e: (n: number) => number) => e(Math.max(0, Math.min(1, (u - a) / d)));
const CL = asset("logo-claude.png");
const QW = asset("logo-qwen.png");

/** world y of strip i's centre (strip 0 is the edge that leaves the glass last) */
const stripY = (c: Copy, i: number) => c.dir * (-MS / 2 + (i + 0.5) * SH);

export type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number; u: number; col: number; hard: number };

/** where the whole sheet is at frame fr: on the glass until it detaches, then in flight to the pile */
export function poseAt(c: Copy, fr: number, charge: number): Pose {
  const jx = (hash(c.k, 1) - 0.5) * 16;
  const jy = (hash(c.k, 2) - 0.5) * 16;
  const jr = (hash(c.k, 3) - 0.5) * 12;
  const base = c.dir > 0 ? 0 : 180;
  const u = prog(fr, c.detach, c.fly, ease.linear);
  const e = ease.inOut(u);
  const hard = seg(u, 0.45, 0.35, ease.out);
  const arc = (190 - 12 * Math.min(8, c.k)) * Math.sin(Math.PI * Math.pow(u, 0.6));
  const zEnd = SHEET * (c.k + 1);
  const flutter = (1 - hard) * Math.min(1, u * 5);
  return {
    x: BX + (PX + jx - BX) * e,
    y: (PY + jy) * e - 40 * Math.sin(Math.PI * e),
    z: 5 + (zEnd - 5) * e + arc + 38 * charge * (1 - e) + (fr < c.detach ? 5 * charge * Math.sin(fr * 2.1) : 0),
    rx: -28 * Math.sin(Math.PI * e) + 18 * flutter * Math.sin(fr * 0.45 + c.k),
    ry: 26 * flutter * Math.sin(fr * 0.33 + 2 * c.k),
    rz: base + jr * e,
    u,
    col: seg(u, 0.26, 0.12, ease.inOut),
    hard,
  };
}

const poseCss = (p: Pose) =>
  `translate3d(${(p.x - MS / 2).toFixed(1)}px, ${(p.y - MS / 2).toFixed(1)}px, ${p.z.toFixed(1)}px) rotateZ(${p.rz.toFixed(1)}deg) rotateX(${p.rx.toFixed(1)}deg) rotateY(${p.ry.toFixed(1)}deg)`;

/** the image inside one strip: Claude fading into Qwen, flipped when the sheet is turned 180 so it reads upright */
const StripImg: React.FC<{ i: number; flip: boolean; col: number; hot: number }> = ({ i, flip, col, hot }) => {
  const img = (src: string, o: number) => (
    <div style={{ position: "absolute", left: 0, top: -i * SH, width: MS, height: MS, opacity: o, backgroundImage: `url(${src})`, backgroundSize: "contain", transform: flip ? "rotate(180deg)" : undefined }} />
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: MS, height: SH + 0.8, overflow: "hidden", filter: hot > 0.02 ? `brightness(${(1 + 1.6 * hot).toFixed(2)})` : undefined }}>
      {col < 1 && img(CL, 1 - col)}
      {col > 0 && img(QW, col)}
    </div>
  );
};

/** the curl: strip i hangs off strip i-1 and bends by its joint angle; the chain is built from the root outward */
function chain(c: Copy, f: number, angles: number[], vis: number[], col: number, hot: number, i = 0): React.ReactNode {
  if (i >= STRIPS) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: i === 0 ? 0 : SH, width: MS, height: SH, transformStyle: "preserve-3d", transformOrigin: "50% 0%", transform: `rotateX(${angles[i].toFixed(2)}deg)` }}>
      <div style={{ opacity: vis[i] }}>
        <StripImg i={i} flip={c.dir < 0} col={col} hot={hot} />
      </div>
      {chain(c, f, angles, vis, col, hot, i + 1)}
    </div>
  );
}

export const Sheet: React.FC<{ c: Copy; f: number; charge: number }> = ({ c, f, charge }) => {
  if (f >= c.land || f < c.print.s) return null;
  const p = poseAt(c, f, charge);
  const relax = 1 - seg(p.u, 0.15, 0.5, ease.inOut);
  const angles: number[] = [];
  const vis: number[] = [];
  for (let i = 0; i < STRIPS; i++) {
    const y = stripY(c, i);
    vis.push(prog(f, crossAt(c.print, y) - 1, 3, ease.out));
    const lift = prog(f, crossAt(c.peel, y) + 1, 8, ease.out);
    const tremble = i >= STRIPS - 4 ? charge * (16 + 7 * Math.sin(f * 1.9 + i)) : 0;
    const wave = f >= c.detach ? (1 - p.hard) * 10 * Math.sin(f * 0.6 - i * 0.8) : 0;
    angles.push(i === 0 && f < c.detach ? 0 : (14 * lift + tremble) * relax + wave);
  }
  const printed = Math.max(...vis.map((v, i) => (v > 0 ? crossAt(c.print, stripY(c, i)) : -1e9)));
  const flash = Math.max(0, 1 - Math.abs(p.u - 0.32) / 0.1);
  const hot = Math.max(0.35 + 0.5 * (1 - prog(f, printed, 14, ease.out)) - 0.35 * seg(p.u, 0, 0.25, ease.linear), 1.4 * flash);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: MS, height: MS, transformStyle: "preserve-3d", transformOrigin: "50% 50%", transform: poseCss(p) }}>
      {chain(c, f, angles, vis, p.col, hot)}
    </div>
  );
};

/** motion trail for a fast copy: two flat ghosts where it was 2 and 4 frames ago */
export const Trail: React.FC<{ c: Copy; f: number }> = ({ c, f }) => {
  if (f <= c.detach + 1 || f >= c.land - 1) return null;
  return (
    <>
      {[2, 4].map((lag, j) => {
        const p = poseAt(c, f - lag, 0);
        return (
          <div key={lag} style={{ position: "absolute", left: 0, top: 0, width: MS, height: MS, transformOrigin: "50% 50%", transform: poseCss(p), opacity: 0.22 - 0.1 * j }}>
            <div style={{ width: MS, height: MS, backgroundImage: `url(${p.col > 0.5 ? QW : CL})`, backgroundSize: "contain", transform: c.dir < 0 ? "rotate(180deg)" : undefined, filter: `blur(${2 + 2 * j}px)` }} />
          </div>
        );
      })}
    </>
  );
};

/** the pile: every copy that has landed, stacked sheet on sheet, the lower ones in shadow, the newest bouncing */
export const Pile: React.FC<{ copies: Copy[]; f: number }> = ({ copies, f }) => {
  const landed = copies.filter((c) => f >= c.land);
  const n = landed.length;
  return (
    <>
      {landed.map((c) => {
        const p = poseAt(c, c.land, 0);
        const age = f - c.land;
        const bounce = age < 10 ? 10 * Math.sin((age / 10) * Math.PI) * Math.exp(-age / 5) : 0;
        const squash = 1 + 0.07 * Math.exp(-age / 3) * Math.cos(age * 0.9);
        const depth = n - 1 - landed.indexOf(c);
        const lit = Math.max(0.28, 1 - 0.13 * depth);
        const top = depth === 0;
        return (
          <div key={c.k} style={{ position: "absolute", left: 0, top: 0, width: MS, height: MS, transformOrigin: "50% 50%", transform: `${poseCss({ ...p, z: p.z + bounce })} scale(${squash.toFixed(3)})` }}>
            <div style={{ width: MS, height: MS, backgroundImage: `url(${QW})`, backgroundSize: "contain", transform: c.dir < 0 ? "rotate(180deg)" : undefined, filter: `brightness(${lit.toFixed(2)})${top ? ` drop-shadow(0 0 ${(16 + 6 * Math.sin(f / 6) + 30 * Math.exp(-age / 6)).toFixed(0)}px ${QWEN})` : ""}` }} />
          </div>
        );
      })}
    </>
  );
};

/** both marks loaded once through Remotion (it waits for them), so the strips' CSS backgrounds are always ready */
export const Preload: React.FC = () => (
  <div style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }}>
    <Img src={CL} style={{ width: 1, height: 1 }} />
    <Img src={QW} style={{ width: 1, height: 1 }} />
  </div>
);

/** the landing hit: a violet ring racing out across the tray from the pile */
export const LandRings: React.FC<{ copies: Copy[]; f: number }> = ({ copies, f }) => (
  <>
    {copies.map((c) => {
      const age = f - c.land;
      if (age < 0 || age > 18) return null;
      const r = 90 + 150 * prog(f, c.land, 18, ease.outHard);
      return (
        <div key={c.k} style={{ position: "absolute", left: PX - r, top: PY - r, width: 2 * r, height: 2 * r, borderRadius: "50%", transform: `translateZ(${(SHEET * (c.k + 1)).toFixed(0)}px)`, border: `${(6 * (1 - age / 18)).toFixed(1)}px solid #C9C6FF`, opacity: 1 - age / 18, boxShadow: `0 0 30px ${QWEN}` }} />
      );
    })}
  </>
);
