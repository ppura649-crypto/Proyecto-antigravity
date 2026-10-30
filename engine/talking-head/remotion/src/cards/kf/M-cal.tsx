import React from "react";
import type { CardProps } from "../props";
import { clamp, easeIn2, easeInOut, easeOut3, exitP, FONT, hash, lerp, win } from "./M-util";
// V15 "then I can post the exact same day." (builder M, 2026-09-25), 33100 -> 35733, above their head.
// A tear-off day calendar hanging from its black binding: the torn stubs of the pages already pulled, a
// perforation row, cream paper with grain, a curled lower corner, the pad's thickness under it. It drops onto
// the wall on "is" and settles with its weight. On "post" two ink stamps hit the SAME page, FILMED then POSTED,
// each one pressing the pad down for an instant; on "same day." the date inks over to green. Held under a push.

const W = 540, BIND = 38, PAGE = 262, STACK = 9;
const INK = "#1c1c20", GREEN_RGB = [74, 222, 128], DARK_RGB = [26, 26, 30];
const B = { is: 33100, post: 34551, same: 35331, day: 35571 };
const mix = (g: number) => `rgb(${DARK_RGB.map((c, i) => Math.round(lerp(c, GREEN_RGB[i], g))).join(",")})`;

// the torn stubs left under the binding: a ragged paper edge, seeded
const TORN = (() => {
  const pts: string[] = ["0,0", `${W},0`];
  for (let i = 40; i >= 0; i--) {
    const x = (W * i) / 40;
    pts.push(`${x.toFixed(1)},${(5 + 7 * hash(i * 3.1) + (i % 3 === 0 ? 3 * hash(i) : 0)).toFixed(1)}`);
  }
  return pts.join(" ");
})();

const Stamp: React.FC<{ text: string; at: number; t: number; rot: number; id: string }> = ({ text, at, t, rot, id }) => {
  if (t < at - 110) return null;
  const u = easeIn2(win(t, at - 110, at));
  const spread = 1 - win(t, at, at + 90);
  return (
    <div style={{ transform: `rotate(${rot}deg) scale(${lerp(1.55, 1, u)})`, opacity: clamp(u * 1.8) * (t >= at ? 0.9 : 0.55),
      filter: `url(#${id}) blur(${(t >= at ? 0.9 * spread : 1.4 * (1 - u)).toFixed(2)}px)` }}>
      <div style={{ border: `5px solid ${INK}`, padding: "7px 18px 6px", fontFamily: FONT, fontWeight: 900, fontSize: 40,
        letterSpacing: "0.16em", color: INK, lineHeight: 1, textAlign: "center", marginRight: -6 }}>{text}</div>
    </div>
  );
};

export const Calendar: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fromMs, toMs, beats, data }) => {
  const b = { ...B, ...(beats as Partial<typeof B>) };
  const k = w / 1080, H = h / k;
  const dow: string = data?.dow ?? "FRI", dom: string = data?.dom ?? "25", mon: string = data?.mon ?? "SEP";
  const s1 = b.post, s2 = b.post + 300;
  // the landing: dropped from above, tipping back flat against the wall, the shadow tightening under it
  const land = easeOut3(win(t, fromMs - 110, fromMs + 360));
  // each stamp presses the pad for an instant (weight), then it recovers without a bounce
  const press = [s1, s2].reduce((a, at) => a + (t < at ? 0 : Math.exp(-(t - at) / 70) * (1 - win(t, at, at + 260))), 0);
  const g = easeInOut(win(t, b.same, b.same + 260));
  const out = exitP(t, toMs);
  const push = 1 + 0.02 * easeInOut(win(t, fromMs + 360, toMs));
  const y = -64 * (1 - land) + 4 * press - 10 * out;
  const tilt = 3 + 20 * (1 - land);
  const total = BIND + PAGE + STACK;
  const top = H - 16 - total;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, overflow: "visible" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="kfm-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={7} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.24  0 0 0 0.55 0" />
        </filter>
        {[1, 2].map((n) => (
          <filter key={n} id={`kfm-ink${n}`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={2} seed={n * 11} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={2.4} result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves={1} seed={n * 5} result="m" />
            <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 2.1" result="ma" />
            <feComposite in="d" in2="ma" operator="in" />
          </filter>
        ))}
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: H, transform: `scale(${k})`, transformOrigin: "0 0",
        perspective: 1500, perspectiveOrigin: `50% ${top}px` }}>
        <div style={{ position: "absolute", left: (1080 - W) / 2, top, width: W, height: total, opacity: (0.4 + 0.6 * land) * (1 - out),
          transform: `translateY(${y}px) rotateX(${tilt}deg) scale(${push * (1 - 0.01 * press)})`, transformOrigin: "50% 0%",
          filter: `drop-shadow(0 ${16 + 30 * (1 - land) - 5 * press}px ${22 + 26 * (1 - land) - 6 * press}px rgba(0,0,0,${0.42 - 0.16 * (1 - land)}))` }}>
          {/* the pad's thickness: the pages still under this one */}
          {[3, 2, 1].map((n) => (
            <div key={n} style={{ position: "absolute", left: 3 * n, right: 3 * n, top: BIND + 8, height: PAGE - 8 + n * 3,
              background: n % 2 ? "#e4dccd" : "#d9d0bf", boxShadow: "0 1px 0 rgba(0,0,0,0.12)" }} />
          ))}
          {/* the page, its lower-right corner curled up off the pad */}
          <div style={{ position: "absolute", left: 0, top: BIND, width: W, height: PAGE, overflow: "hidden",
            clipPath: `polygon(0 0, 100% 0, 100% ${PAGE - 44}px, ${W - 44}px 100%, 0 100%)`,
            background: "linear-gradient(180deg, #f2ede3 0%, #f8f5ee 22%, #f6f2ea 78%, #ece6da 100%)" }}>
            <svg width={W} height={PAGE} style={{ position: "absolute", left: 0, top: 0, opacity: 0.55, mixBlendMode: "multiply" }}>
              <rect width={W} height={PAGE} filter="url(#kfm-grain)" />
            </svg>
            {/* perforation row under the torn stubs */}
            <div style={{ position: "absolute", left: 14, right: 14, top: 14, height: 5, display: "flex", justifyContent: "space-between" }}>
              {Array.from({ length: 34 }, (_, i) => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: 3, background: "rgba(60,50,40,0.28)", boxShadow: "inset 0 1px 1px rgba(0,0,0,0.3)" }} />
              ))}
            </div>
            {/* the date */}
            <div style={{ position: "absolute", left: 0, top: 30, width: 250, bottom: 18, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", color: mix(g), fontFamily: FONT,
              textShadow: g > 0.01 ? `0 1px 0 rgba(20,83,45,${0.5 * g}), 0 0 1px rgba(20,83,45,${0.45 * g})` : undefined }}>
              <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: "0.22em", lineHeight: 1, marginRight: -6 }}>{dow}</div>
              <div style={{ fontWeight: 900, fontSize: 138, letterSpacing: "-0.045em", lineHeight: 0.92, margin: "6px 0 4px",
                fontVariantNumeric: "tabular-nums" }}>{dom}</div>
              <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: "0.22em", lineHeight: 1, marginRight: -6 }}>{mon}</div>
            </div>
            <div style={{ position: "absolute", left: 250, top: 50, bottom: 36, width: 2, background: "rgba(60,50,40,0.14)" }} />
            {/* the stamps, both on this page */}
            <div style={{ position: "absolute", left: 252, right: 0, top: 30, bottom: 18, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 26 }}>
              <Stamp text="FILMED" at={s1} t={t} rot={-4} id="kfm-ink1" />
              <Stamp text="POSTED" at={s2} t={t} rot={2.5} id="kfm-ink2" />
            </div>
            {/* light falling off down the hanging page */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.06))" }} />
          </div>
          {/* the curl: the underside of the lifted corner, and its shadow on the page below */}
          <svg width={W} height={PAGE} style={{ position: "absolute", left: 0, top: BIND, overflow: "visible" }}>
            <defs>
              <linearGradient id="kfm-curl" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#d8d0c0" /><stop offset="0.55" stopColor="#fbf9f4" /><stop offset="1" stopColor="#e9e2d4" />
              </linearGradient>
            </defs>
            <path d={`M ${W} ${PAGE - 44} L ${W - 44} ${PAGE} Q ${W - 40} ${PAGE - 26} ${W - 30} ${PAGE - 34} Q ${W - 10} ${PAGE - 40} ${W} ${PAGE - 44} Z`}
              fill="url(#kfm-curl)" style={{ filter: "drop-shadow(-3px -2px 3px rgba(0,0,0,0.22))" }} />
          </svg>
          {/* the torn stubs of the pages already pulled */}
          <svg width={W} height={16} style={{ position: "absolute", left: 0, top: BIND - 2, filter: "drop-shadow(0 2px 1.5px rgba(0,0,0,0.25))" }}>
            <polygon points={TORN} fill="#efe9dd" />
          </svg>
          {/* the binding */}
          <div style={{ position: "absolute", left: -6, right: -6, top: 0, height: BIND,
            background: "linear-gradient(180deg, #3a3a3f 0%, #1d1d21 40%, #111114 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.5)" }}>
            {[0.12, 0.88].map((x) => (
              <div key={x} style={{ position: "absolute", left: `${x * 100}%`, top: BIND / 2 - 7, width: 14, height: 14, borderRadius: 7,
                marginLeft: -7, background: "radial-gradient(circle at 35% 30%, #f2f2f2 0%, #9a9aa0 45%, #4a4a50 100%)",
                boxShadow: "0 1px 1px rgba(0,0,0,0.6)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
