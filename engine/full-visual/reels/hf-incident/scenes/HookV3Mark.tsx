// Hook V3's two sky objects. The count: rolls to 700 over the flight and lands on "700", the real OpenAI mark lands
// beside it on "OpenAI", both lift away on "end". The target: the real Hugging Face mark rising over the horizon on
// "hacking", taking the swarm's hits, and on "Face" breaking in the cubes' crack language: the same jagged star, its
// wedges prised apart, white light pouring through the seams and out along every crack, a few shards hanging in the
// air. Held to the end of the scene.
import React from "react";
import { Img } from "remotion";
import { countAt, crackOf, grown, Times } from "./HookV3World";
import { AGENT, asset, HF, HF_ORANGE, Logo, rand } from "./parts";
import { ease, prog } from "../../../src/engine";

const HFSRC = asset("logo-huggingface.png");
const CR = crackOf(0.8, 0.5, 0.44, 0.62, 9);
const pc = (u: number, v: number) => `${(u * 100).toFixed(2)}% ${(v * 100).toFixed(2)}%`;

/** wedge k: between ray k and ray k+1, from the impact out past the mark's edge */
const WEDGES = CR.rays.map((ray, k) => {
  const next = CR.rays[(k + 1) % CR.rays.length];
  const poly = [ray[0], ...ray.slice(1), ...[...next.slice(1)].reverse()].map((p) => pc(p.u, p.v)).join(",");
  const a = ray[ray.length - 1];
  const b = next[next.length - 1];
  const mx = (a.u + b.u) / 2 - 0.5;
  const my = (a.v + b.v) / 2 - 0.44;
  const n = Math.hypot(mx, my) || 1;
  return { poly, dx: mx / n, dy: my / n, spin: (rand(k, 5.5) - 0.5) * 6, push: 0.6 + 0.8 * rand(k, 6.1) };
});

export type MarkState = { x: number; y: number; size: number; rise: number; clipY: number; hits: number; crack: number; open: number; f: number; face: number };

const Beams: React.FC<{ s: MarkState }> = ({ s }) => (
  <>
    {CR.angles.map((a, k) => {
      const len = s.size * (1.2 + 0.9 * rand(k, 8.2)) * s.open;
      const fl = 0.75 + 0.25 * Math.sin(s.f * 0.5 + k * 1.7);
      return (
        <div
          key={k}
          style={{
            position: "absolute", left: s.size * 0.5, top: s.size * 0.44 - s.size * 0.09, width: len, height: s.size * 0.18, transformOrigin: "0 50%",
            transform: `rotate(${a}rad)`, opacity: 0.85 * fl, clipPath: "polygon(0 46%, 100% 0, 100% 100%, 0 54%)",
            background: "linear-gradient(90deg, rgba(255,250,225,1), rgba(255,226,120,0.55) 35%, rgba(255,200,60,0) 100%)",
          }}
        />
      );
    })}
  </>
);

const CrackLines: React.FC<{ s: MarkState }> = ({ s }) => {
  const R = s.crack * 1.2;
  const lines = CR.rays.map((r) => grown(r, R));
  const rings = CR.rings.filter(([a, b]) => a.r <= R && b.r <= R);
  const d =
    lines.map((l) => "M" + l.map((p) => `${p.u.toFixed(4)} ${p.v.toFixed(4)}`).join("L")).join("") +
    rings.map(([a, b]) => `M${a.u.toFixed(4)} ${a.v.toFixed(4)}L${b.u.toFixed(4)} ${b.v.toFixed(4)}`).join("");
  const mask = `url(${HFSRC})`;
  return (
    <svg viewBox="0 0 1 1" width={s.size} height={s.size} style={{ position: "absolute", inset: 0, WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", filter: "drop-shadow(0 0 6px #FFF3B0)" }}>
      <path d={d} fill="none" stroke="#FFFBEA" strokeWidth={0.011 + 0.006 * s.open} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Shards: React.FC<{ s: MarkState }> = ({ s }) => {
  const a = s.f - s.face;
  if (a < 0) return null;
  return (
    <>
      {Array.from({ length: 14 }, (_, i) => {
        const ang = CR.angles[i % CR.angles.length] + (rand(i, 3.3) - 0.5) * 0.5;
        const v = s.size * (0.3 + 0.55 * rand(i, 4.4));
        const run = 1 - Math.exp(-a / 9);
        const x = s.size * 0.5 + Math.cos(ang) * (s.size * 0.18 + v * run);
        const y = s.size * 0.44 + Math.sin(ang) * (s.size * 0.18 + v * run) + 0.04 * a * a * 0.05;
        const z = 10 + 18 * rand(i, 7.7);
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x - z / 2, top: y - z / 2, width: z, height: z * 1.3, clipPath: "polygon(50% 0, 100% 80%, 10% 100%)",
              background: `linear-gradient(135deg, #FFF2A8, ${HF} 45%, ${HF_ORANGE})`, transform: `rotate(${(rand(i, 9.1) * 360 + a * (4 + 6 * rand(i, 2.2))).toFixed(1)}deg)`,
              opacity: Math.min(1, a / 3), boxShadow: "0 0 10px #FFE58A",
            }}
          />
        );
      })}
    </>
  );
};

export const HFMark: React.FC<{ s: MarkState }> = ({ s }) => {
  if (s.rise <= 0) return null;
  const hitGlow = `drop-shadow(0 0 ${(10 + 30 * s.hits).toFixed(0)}px rgba(255,59,48,${(0.25 + 0.6 * s.hits).toFixed(2)}))`;
  const whole = s.open <= 0;
  const box: React.CSSProperties = { position: "absolute", left: s.x - s.size / 2, top: s.y - s.size * 0.5, width: s.size, height: s.size };
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: s.clipY, overflow: "hidden" }}>
      <div style={box}>
        {!whole && <Beams s={s} />}
        {!whole && (
          <Img src={HFSRC} style={{ position: "absolute", inset: 0, width: s.size, height: s.size, opacity: s.open, filter: "brightness(0) invert(1) blur(3px) drop-shadow(0 0 18px #FFE680)" }} />
        )}
        {whole ? (
          <Img src={HFSRC} style={{ position: "absolute", inset: 0, width: s.size, height: s.size, filter: hitGlow }} />
        ) : (
          WEDGES.map((w, k) => (
            <div
              key={k}
              style={{
                position: "absolute", inset: 0, clipPath: `polygon(${w.poly})`,
                transform: `translate(${(w.dx * w.push * s.open * s.size * 0.045).toFixed(2)}px, ${(w.dy * w.push * s.open * s.size * 0.045).toFixed(2)}px) rotate(${(w.spin * s.open).toFixed(2)}deg)`,
              }}
            >
              <Img src={HFSRC} style={{ width: s.size, height: s.size, filter: `brightness(${(1 + 0.15 * s.open).toFixed(2)})` }} />
            </div>
          ))
        )}
        {s.crack > 0 && <CrackLines s={s} />}
        <Shards s={s} />
      </div>
    </div>
  );
};

/** the count and the OpenAI mark, in the sky above the flight */
export const Count: React.FC<{ t: Times; f: number; font: string }> = ({ t, f, font }) => {
  const n = Math.round(countAt(t, f));
  const inO = prog(f, 0, 6, ease.linear);
  const land = f >= t.n700 ? 1 + 0.1 * (1 - prog(f, t.n700, 14, ease.out)) : 1;
  const side = prog(f, t.openai - 3, 11, ease.outHard);
  const mark = prog(f, t.openai, 10, ease.back);
  const out = prog(f, t.end, 10, ease.in);
  if (out >= 1) return null;
  const glow = `0 0 30px ${AGENT}AA, 0 0 70px ${AGENT}55`;
  return (
    <div style={{ position: "absolute", left: 0, top: 18, width: 1080, height: 180, opacity: inO * (1 - out), filter: out > 0 ? `blur(${(14 * out).toFixed(1)}px)` : undefined, transform: `translateY(${(-80 * out).toFixed(1)}px)` }}>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 0, textAlign: "center", transform: `translateX(${(70 * side).toFixed(1)}px)` }}>
        <div style={{ display: "inline-block", fontFamily: font, fontSize: 140, lineHeight: "140px", fontWeight: 800, letterSpacing: -4, color: "#fff", textShadow: glow, fontVariantNumeric: "tabular-nums", transform: `scale(${land.toFixed(4)})` }}>{n}</div>
        <div style={{ fontFamily: font, fontSize: 26, fontWeight: 700, letterSpacing: 9, color: "#BFE6FA", marginTop: 2, opacity: 0.9 }}>SANDBOXES</div>
      </div>
      {mark > 0 && (
        <div style={{ position: "absolute", left: 540 - 250, top: 20, opacity: prog(f, t.openai, 4, ease.linear), transform: `scale(${(0.4 + 0.6 * mark).toFixed(4)}) rotate(${(-30 * (1 - mark)).toFixed(1)}deg)`, filter: `drop-shadow(0 0 22px ${AGENT})` }}>
          <Logo name="openai" size={120} invert />
        </div>
      )}
    </div>
  );
};
