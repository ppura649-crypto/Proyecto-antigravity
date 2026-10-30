// The pieces of `training` that are not the nudge: where everything stands, the two marks and the stream between
// them, the two answer cards (Claude's reply as claude.ai sets it, Qwen's as Qwen Chat sets it), a directional smear.
import React, { useId } from "react";
import { arriveEase, ease, prog, useScene } from "../../../src/engine";
import { CLAUDE, GOOD, Logo, QWEN } from "./parts";

export const L = {
  /** the pair enters big and centred, then parks small in the top corners on "teacher's" */
  big: { claude: { x: 330, y: 930 }, qwen: { x: 750, y: 930 }, size: 190 },
  small: { claude: { x: 150, y: 566 }, qwen: { x: 915, y: 566 }, size: 84 },
  linkBig: { x1: 448, x2: 632, y: 930 },
  linkSmall: { x1: 358, x2: 710, y: 566 },
  teacherCard: { left: 90, top: 634, width: 820, height: 124 },
  studentCard: { left: 170, top: 786, width: 820, height: 124 },
  panel: { left: 150, top: 800, width: 760, rowY: 835 },
  header: { left: 150, top: 960 },
  label: { left: 150, top: 1396 },
};

export const lerp = (k: number, a: number, b: number) => a + (b - a) * k;

/** a smear along the direction of travel, as an svg filter (css blur cannot be directional) */
export const Smear: React.FC<{ bx: number; by: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ bx, by, style, children }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const on = bx > 0.3 || by > 0.3;
  return (
    <>
      {on && (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <filter id={id} x="-40%" y="-80%" width="180%" height="260%">
            <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
          </filter>
        </svg>
      )}
      <div style={{ ...style, filter: on ? `url(#${id})` : undefined }}>{children}</div>
    </>
  );
};

/** one of the two marks: big and centred first, then small in its corner. `rise` is its entrance from below */
export const Mark: React.FC<{ name: "claude" | "qwen"; k: number; rise: number; drift: number }> = ({ name, k, rise, drift }) => {
  const a = L.big[name];
  const b = L.small[name];
  const size = lerp(k, L.big.size, L.small.size);
  const x = lerp(k, a.x, b.x);
  const y = lerp(k, a.y, b.y) + (1 - rise) * 900 + drift * (1 - k);
  const smear = Math.min(30, (1 - rise) * 60);
  return (
    <Smear bx={0} by={smear} style={{ position: "absolute", left: x - size / 2, top: y - size / 2, opacity: rise > 0 ? 1 : 0 }}>
      <Logo name={name} size={size} />
    </Smear>
  );
};

/** the stream: answers flowing from Claude to Qwen as dots on a line. On `cutAt` the line snaps and both halves pull back */
export const Link: React.FC<{ k: number; at: number; cutAt: number }> = ({ k, at, cutAt }) => {
  const { f, ground } = useScene();
  const x1 = lerp(k, L.linkBig.x1, L.linkSmall.x1);
  const x2 = lerp(k, L.linkBig.x2, L.linkSmall.x2);
  const y = lerp(k, L.linkBig.y, L.linkSmall.y);
  const grow = prog(f, at, 14, ease.out);
  if (grow <= 0) return null;
  const cut = prog(f, cutAt, 16, ease.out);
  const mid = (x1 + x2) / 2;
  const half = ((x2 - x1) / 2) * grow;
  const pull = cut * (half - 34); // each half shrinks back to a 34 px stub at its own mark
  const seg = (xa: number, xb: number) => <line x1={xa} y1={y} x2={xb} y2={y} stroke={ground.hairline} strokeWidth={5} strokeLinecap="round" />;
  const dots = [0, 1, 2].map((i) => {
    const ph = (((f - at) / 34 + i / 3) % 1 + 1) % 1;
    const x = x1 + (x2 - x1) * ph;
    const o = Math.min(1, ph * 6, (1 - ph) * 6) * grow * (1 - prog(f, cutAt, 4, ease.linear));
    return <circle key={i} cx={x} cy={y} r={lerp(k, 9, 7)} fill={CLAUDE} opacity={o} />;
  });
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      {cut > 0 ? (
        <>
          {seg(mid - half, mid - half + (half - pull) - 6 * cut)}
          {seg(mid + half - (half - pull) + 6 * cut, mid + half)}
        </>
      ) : (
        seg(mid - half, mid + half)
      )}
      {dots}
    </svg>
  );
};

/** the reply as each app sets it: Claude's in its serif on claude.ai's cream, Qwen's in sans on white */
export const AnswerCard: React.FC<{
  who: "claude" | "qwen";
  box: { left: number; top: number; width: number; height: number };
  from: { x: number; y: number };
  at: number;
  hiAt: number;
  dim?: number;
  check?: number;
}> = ({ who, box, from, at, hiAt, dim = 0, check = 0 }) => {
  const { f, theme } = useScene();
  const p = prog(f, at, 22, arriveEase(22));
  if (f < at) return null;
  const hue = who === "claude" ? CLAUDE : QWEN;
  const sweep = prog(f, hiAt, 9, ease.out);
  // each reply grows out of its own mark: Claude's from its left end, Qwen's from its right end
  const originX = who === "claude" ? 50 : box.width - 50;
  const ox = from.x - box.left - originX;
  const oy = from.y - box.top - box.height / 2;
  const v = Math.abs(p - prog(f - 1, at, 22, arriveEase(22)));
  const claude = who === "claude";
  return (
    <Smear
      bx={Math.min(14, v * 60)}
      by={Math.min(8, v * 30)}
      style={{
        position: "absolute", ...box,
        transformOrigin: `${originX}px 50%`,
        transform: `translate(${(ox * (1 - p)).toFixed(1)}px, ${(oy * (1 - p)).toFixed(1)}px) scale(${(0.25 + 0.75 * p - 0.03 * dim).toFixed(4)})`,
        opacity: Math.min(1, prog(f, at, 3, ease.linear)) * (1 - 0.55 * dim),
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0, borderRadius: 16, display: "flex", alignItems: "center", gap: 22, padding: "0 30px",
          background: claude ? "#FAF9F5" : "#FFFFFF", border: `1.5px solid ${claude ? "#E8E4D8" : "#E4E4EA"}`,
          boxShadow: "0 14px 40px rgba(20,20,30,0.10)", filter: dim > 0 ? `saturate(${1 - dim})` : undefined,
        }}
      >
        <Logo name={who} size={46} />
        <div
          style={{
            fontFamily: claude ? "Georgia, 'Times New Roman', serif" : theme.font.ui, fontSize: claude ? 48 : 42,
            fontWeight: claude ? 400 : 500, color: claude ? "#1F1E1D" : "#16161A", whiteSpace: "nowrap", letterSpacing: claude ? 0 : -0.4,
          }}
        >
          The best way to learn is to{" "}
          <span
            style={{
              padding: "2px 6px", margin: "0 -6px", borderRadius: 6,
              backgroundImage: `linear-gradient(${hue}40, ${hue}40)`, backgroundRepeat: "no-repeat",
              backgroundSize: `${(sweep * 100).toFixed(1)}% 100%`, boxShadow: sweep >= 1 ? `inset 0 -3px 0 ${hue}` : undefined,
            }}
          >
            teach
          </span>
          .
        </div>
      </div>
      {check > 0 && (
        <div style={{ position: "absolute", right: -14, top: -18, width: 52, height: 52, borderRadius: 26, background: GOOD, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px rgba(52,199,89,0.35)", transform: `scale(${check.toFixed(4)})` }}>
          <svg width={30} height={30} viewBox="0 0 24 24">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </Smear>
  );
};
