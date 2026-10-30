import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Easing, Img, continueRender, delayRender, interpolate, spring, staticFile } from "remotion";
import type { CardProps } from "../props";
import { beat, box, life, pick } from "./S-util";
import { SWITZER_500, SWITZER_600 } from "./S-switzer";
// V17 "yours" (builder S, 2026-09-25, replaces the spotlight), and 39629 -> as 40767. The close of the Keyframes
// store films, rebuilt as it is there: "Yours to keep." grows from the centre word by word out of blur, "keep."
// in a filled pill with its check, then the KEY FRAMES wordmark wipes in under it, held, and both leave upward
// into blur. Copied from ~/frame/docs/plans/store-films-2026-09-22/src (kit.tsx `Line`, `Icon`, TrialFinale.tsx
// `Lockup`, Head.tsx S5 + its frames 1108-1200), same ground, type, sizes, easings and frame offsets. The film runs
// at 60 fps; here its frames play at 0.8x their length so the whole close fits the 1.14 s window, "keep." resolving on
// "yours." (40029). The film's 1920x1080 stage is drawn at 0.85 in the 1080 x 614 band.

const C = { ground: "#101110", ink: "#f0eee6", muted: "#8d8f88" };
const OUT = Easing.bezier(0.22, 1, 0.36, 1), SOFT = Easing.bezier(0.4, 0, 0.2, 1), AWAY = Easing.bezier(0.5, 0, 0.9, 0.4);
const p = (f: number, at: number, duration: number, ease = OUT) =>
  interpolate(f, [at, at + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const pop = (f: number, at: number, damping = 11) => (f < at ? 0 : spring({ frame: f - at, fps: 60, config: { damping, mass: 0.7, stiffness: 170 } }));

const Keep: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ display: "block" }}>
    <path d="m6 16 7 7L27 8" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type Tok = { t: string; dim?: boolean; pill?: "fill"; icon?: boolean };
const S5: Tok[] = [{ t: "Yours" }, { t: "to", dim: true }, { t: "keep.", pill: "fill", icon: true }];

// kit.tsx `Line` (no caption move here): each word resolves out of blur into its place while the row glides centred
const Line: React.FC<{ f: number; toks: Tok[]; at: number; out: number; step: number; rise: number; size: number; y: number }> =
  ({ f, toks, at, out, step, rise, size, y }) => {
    const refs = useRef<(HTMLSpanElement | null)[]>([]);
    const [ws, setWs] = useState<number[]>([]);
    const gap = size * 0.27;
    useLayoutEffect(() => { const next = refs.current.map((el) => (el ? el.offsetWidth : 0)); if (next.join() !== ws.join()) setWs(next); });
    const total = ws.reduce((a, b) => a + b, 0) + gap * (toks.length - 1);
    const room = (g: number) => toks.reduce((sum, _, i) => {
      if (!i) return ws[0] || 0;
      const a = at + i * step, len = step + (i === toks.length - 1 ? 8 : 0);
      return sum + ((ws[i] || 0) + gap) * Math.min(1, Math.max(0, (g - a) / len));
    }, 0);
    const seen = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].reduce((a, d) => a + room(f + d), 0) / 13;
    const leave = p(f, out - 12, 12, AWAY);
    return (
      <div style={{ position: "absolute", left: 0, right: 0, top: y, height: 0, display: "flex", justifyContent: "center", alignItems: "center",
        opacity: 1 - Math.min(1, leave * 1.35), filter: `blur(${leave * 10}px)`, transform: `translateY(${-leave * 70}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap, fontSize: size, fontWeight: 500, letterSpacing: "-.04em", lineHeight: 1,
          whiteSpace: "nowrap", transform: `translateX(${(total - seen) / 2}px)` }}>
          {toks.map((k, i) => {
            const t0 = at + i * step, e = p(f, t0, rise), land = pop(f, t0 + 4, 12), plate = pop(f, t0 + 2, 16), fill = k.pill === "fill";
            const padX = k.pill ? size * 0.2 : 0, padY = k.pill ? size * 0.1 : 0;
            return (
              <span key={i} ref={(el) => { refs.current[i] = el; }} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: size * 0.13,
                padding: `${padY}px ${padX}px`, color: fill ? C.ground : k.dim ? C.muted : C.ink, fontWeight: k.pill ? 600 : 500, opacity: e,
                filter: `blur(${(1 - e) * 10}px)`, transform: `translate(${(1 - e) * 10}px,${(1 - e) * 12}px)` }}>
                {fill && <i style={{ position: "absolute", inset: 0, borderRadius: size, background: C.ink, transform: `scale(${mix(0.7, 1, plate)})`, opacity: Math.min(1, plate * 1.4) }} />}
                {k.icon && <span style={{ position: "relative", display: "inline-grid", placeItems: "center", transform: `scale(${land}) rotate(${(1 - land) * -24}deg)` }}><Keep size={size * 0.62} /></span>}
                <span style={{ position: "relative" }}>{k.t}</span>
              </span>
            );
          })}
        </div>
      </div>
    );
  };

// TrialFinale.tsx `Lockup`: the wordmark alone, wiped in from the left out of blur
const Lockup: React.FC<{ f: number; at: number; out: number; src: string }> = ({ f, at, out, src }) => {
  const word = p(f, at + 4, 26), leave = p(f, out - 12, 12, AWAY);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 596, height: 214, display: "flex", justifyContent: "center", alignItems: "center",
      opacity: 1 - Math.min(1, leave * 1.35), filter: `blur(${leave * 10}px)`, transform: `translateY(${-leave * 70}px)` }}>
      <div style={{ width: 1120, height: 240, opacity: Math.min(1, word * 1.5), filter: `blur(${(1 - word) * 10}px)`, clipPath: `inset(0 ${(1 - word) * 100}% 0 0)`,
        transform: `translateX(${(1 - word) * -26}px)` }}>
        <Img src={src} style={{ width: 1120, height: 240, display: "block" }} />
      </div>
    </div>
  );
};

const useSwitzer = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Switzer"));
  useEffect(() => {
    const faces = [new FontFace("Switzer", `url(${SWITZER_500})`, { weight: "500" }), new FontFace("Switzer", `url(${SWITZER_600})`, { weight: "600" })];
    Promise.all(faces.map((ff) => ff.load().then((l) => { (document.fonts as unknown as { add: (x: FontFace) => void }).add(l); }))).then(() => { setReady(true); continueRender(handle); });
  }, [handle]);
  return ready;
};

const K = (1000 / 60) * 0.8;       // ms per film frame here (the film's 60 fps, played at 0.8x its length)
const SC = 0.85;                    // the film's stage in the band

export const Yours: React.FC<CardProps & { data: any }> = ({ tMs: t, w, h, fromMs, toMs, beats, assets }) => {
  const ready = useSwitzer();
  const yours = beat(beats, "yours", 40029);
  const AT = yours - (20 + 18) * K;                 // "keep." (word 3, step 10) finishes resolving on "yours."
  const f = 1110 + (t - AT) / K;                    // the film's own frame numbers from here on
  const out = 1110 + (toMs - AT) / K;               // the film leaves over its last 12 frames, ending at toMs
  const src = staticFile(pick(assets, "kf-wordmark.png"));
  return (
    <div style={box(w, h)}>
      <div style={life(t, fromMs, toMs, 0)}>
      <div style={{ position: "absolute", inset: 0, background: C.ground, fontFamily: "Switzer, sans-serif", color: C.ink, opacity: ready ? 1 : 0 }}>
        <div style={{ position: "absolute", left: 540 - 960 * SC, top: 307 - 560 * SC, width: 1920, height: 1080, transformOrigin: "0 0", transform: `scale(${SC})` }}>
          <Line f={f} toks={S5} at={1110} out={out} step={10} rise={18} size={150} y={372} />
          {f >= 1134 && <Lockup f={f} at={1136} out={out} src={src} />}
        </div>
      </div>
      </div>
    </div>
  );
};
