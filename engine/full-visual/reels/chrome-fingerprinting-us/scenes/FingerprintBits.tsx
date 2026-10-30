// The pieces scene `fingerprint` is built from: the laptop (the same drawing as DeviceCard's, so the card can split
// into three and fold back into one), what its screen shows (the sawtooth coming in, the analyser's spectrum), the
// spec strip that lights one cause per spoken word, the loupe with the real published values, and the AliExpress
// window's page as `sound` leaves it.
import React from "react";
import { blurIn, draw, ease, mix, prog, useScene } from "../../../src/engine";
import { ALI, Logo, MINT, WAVE } from "./parts";

/** DeviceCard's laptop, native 190x140. The screen is x 37..153, y 20..92 inside it. */
export const LAP = { w: 190, h: 140, sx: 37, sy: 20, sw: 116, sh: 72 };

export const Laptop: React.FC<{ screen?: React.ReactNode; ink?: string }> = ({ screen, ink = "#F2F2F2" }) => (
  <div style={{ position: "relative", width: LAP.w, height: LAP.h }}>
    <svg width={LAP.w} height={LAP.h} viewBox="0 0 190 140" style={{ position: "absolute", left: 0, top: 0 }}>
      <rect x={25} y={8} width={140} height={96} rx={10} fill="none" stroke={ink} strokeWidth={6} />
      <rect x={37} y={20} width={116} height={72} rx={4} fill={WAVE} opacity={0.18} />
      <path d="M6 116h178l-12 16H18z" fill={ink} />
    </svg>
    <div style={{ position: "absolute", left: LAP.sx, top: LAP.sy, width: LAP.sw, height: LAP.sh, overflow: "hidden", borderRadius: 4 }}>{screen}</div>
  </div>
);

/** a sawtooth flowing left to right: the oscillator's own shape */
export const Saw: React.FC<{ w: number; h: number; phase: number; period?: number; color?: string; stroke?: number }> = ({ w, h, phase, period = 28, color = WAVE, stroke = 3 }) => {
  const lo = h * 0.78;
  const hi = h * 0.22;
  let x = -period + (phase % period);
  let d = `M${x.toFixed(1)},${lo}`;
  while (x < w + period) {
    d += ` L${(x + period).toFixed(1)},${hi} L${(x + period).toFixed(1)},${lo}`;
    x += period;
  }
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      <path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" />
    </svg>
  );
};

// a sawtooth's harmonics fall as 1/n: the analyser's bars, before any machine changes them
const BARS = 12;
const base = (i: number) => 0.92 / (1 + 0.42 * i);
const wobble = (seed: number, i: number) => Math.sin(seed * 91.7 + i * 12.9898) * 0.5 + 0.5; // 0..1, fixed per bar

/**
 * The analyser output as a bar spectrum. `grow` 0..1 raises the bars; `drift` is how much this machine has bent
 * them so far (one step per cause spoken); `squeeze` 0..1 flattens every bar into one line (the collapse).
 */
export const Spectrum: React.FC<{ w: number; h: number; seed: number; grow: number; drift: number; squeeze?: number; color?: string }> = ({ w, h, seed, grow, drift, squeeze = 0, color = WAVE }) => {
  const { f } = useScene();
  const gap = 3;
  const bw = (w - 10 - gap * (BARS - 1)) / BARS;
  const live = Math.floor(f / 6);
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: BARS }, (_, i) => {
        const g = prog(grow, i * 0.04, 0.5, ease.out);
        const bend = (wobble(seed, i) - 0.5) * 0.1 * drift;
        const twitch = Math.sin((live + i * 3 + seed * 7) * 1.7) * 0.018;
        const v = Math.max(0.04, (base(i) + bend + twitch) * g);
        const full = (h - 12) * v;
        const bh = full * (1 - squeeze) + 3 * squeeze;
        const y = squeeze > 0 ? (h - 6 - full) * (1 - squeeze) + (h / 2 - 1.5) * squeeze : h - 6 - full;
        return <rect key={i} x={5 + i * (bw + gap)} y={y} width={bw} height={bh} rx={1.5} fill={color} />;
      })}
    </svg>
  );
};

/** a fingerprint, drawn: the arcs of a whorl, open at the bottom */
export const FingerprintIcon: React.FC<{ size: number; at: number; color?: string }> = ({ size, at, color = MINT }) => {
  const { f } = useScene();
  const arcs = [
    "M12 21c-2-2-3-4.5-3-7a3 3 0 0 1 6 0c0 1.5.8 2.7 2 3.4",
    "M8.2 19.5A11 11 0 0 1 6 14a6 6 0 0 1 12 0",
    "M5 17.5a14 14 0 0 1-1-3.5 8 8 0 0 1 16 0v1",
    "M3.5 9.5a10 10 0 0 1 17 0",
    "M6.5 4.8a10 10 0 0 1 11 0",
    "M12 14c0 2.5 1 4.5 2.5 6",
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" style={{ flex: "none" }}>
      {arcs.map((d, i) => <path key={i} d={d} {...draw(f, at + i * 3, 14)} />)}
    </svg>
  );
};

// the four causes, in the creator's words, each with a plain line icon
const ICONS: Record<string, string> = {
  processor: "M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4",
  "sound card": "M4 9h4l5-4v14l-5-4H4zM16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11",
  drivers: "M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1",
  "operating system": "M3 5h18v12H3zM8 21h8M12 17v4M3 9h18",
};
export const CAUSES = ["processor", "sound card", "drivers", "operating system"] as const;

/** four rows, dim until their word; a lit row keeps its colour */
export const SpecStrip: React.FC<{ lit: number[]; at: number }> = ({ lit, at }) => {
  const { f, theme, ground } = useScene();
  return (
    <div style={{ width: 700, padding: "18px 26px", boxSizing: "border-box", borderRadius: 22, background: "#1B1B1E", fontFamily: theme.font.ui, ...blurIn(f, at, { dur: 9, rise: 24 }) }}>
      {CAUSES.map((c, i) => {
        const k = lit[i] === undefined ? 0 : prog(f, lit[i], 6, ease.linear);
        const glow = lit[i] === undefined ? 0 : 1 - prog(f, lit[i] + 4, 22, ease.out);
        return (
          <div key={c} style={{ height: 70, display: "flex", alignItems: "center", gap: 24, padding: "0 18px", borderRadius: 14, background: `rgba(138,180,255,${(0.06 * k + 0.1 * glow).toFixed(3)})` }}>
            <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={mix(f, lit[i] ?? 1e9, 6, "#4A4A50", WAVE)} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
              <path d={ICONS[c]} />
            </svg>
            <div style={{ fontSize: 40, fontWeight: 600, color: mix(f, lit[i] ?? 1e9, 6, "#55555B", ground.ink) }}>{c}</div>
          </div>
        );
      })}
    </div>
  );
};

// Fingerprint's own example, run on their test laptops (fingerprint.com/blog/audio-fingerprinting)
export const MEASURED = [
  { logo: "chrome" as const, value: "101.45647543197447" },
  { logo: "safari" as const, value: "79.58850509487092" },
  { logo: "firefox" as const, value: "80.95458510611206" },
];

/** the loupe: a glass over the outputs, reading them at full precision. R is the glass radius. */
export const Loupe: React.FC<{ at: number; R: number }> = ({ at, R }) => {
  const { f, theme, ground } = useScene();
  const chars = (i: number) => Math.max(0, Math.floor((f - at - 6 - i * 6) / 1.2));
  return (
    <div style={{ position: "relative", width: 2 * R, height: 2 * R }}>
      {/* the handle, down and to the right, clear of Instagram's buttons */}
      <div style={{ position: "absolute", left: R + R * 0.66, top: R + R * 0.66, width: 104, height: 34, borderRadius: 17, background: "linear-gradient(#5A5A60,#2E2E33)", transform: "rotate(45deg)", transformOrigin: "0 50%" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(30,31,36,0.97)", border: "12px solid #C9CCD2", boxShadow: "0 30px 80px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.25)", boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 2 * R, height: 2 * R, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, paddingTop: 20, boxSizing: "border-box", fontFamily: theme.font.mono }}>
        {MEASURED.map((m, i) => (
          <div key={m.logo} style={{ display: "flex", alignItems: "center", gap: 14, width: 424, ...blurIn(f, at + 4 + i * 6, { dur: 7 }) }}>
            <Logo name={m.logo} size={42} />
            <div style={{ fontSize: 34, color: ground.ink, fontVariantNumeric: "tabular-nums", letterSpacing: -0.5 }}>{m.value.slice(0, chars(i))}</div>
          </div>
        ))}
        <div style={{ fontSize: 26, color: ground.dim, marginTop: 2, ...blurIn(f, at + 26, { dur: 8 }) }}>fingerprint.com · measured</div> {/* texture: source line */}
      </div>
    </div>
  );
};

/** AliExpress as `sound` leaves it in the window: its header, the search bar, three product slots */
export const AliPage: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: "#FFFFFF" }}>
    <div style={{ height: 96, display: "flex", alignItems: "center", gap: 20, padding: "0 30px" }}>
      <Logo name="aliexpress" size={56} />
      <div style={{ flex: 1, height: 56, borderRadius: 99, border: `4px solid ${ALI}`, boxSizing: "border-box" }} />
    </div>
    <div style={{ display: "flex", gap: 22, padding: "10px 30px" }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ flex: 1, height: 300, borderRadius: 16, background: "#F2F3F5" }} />)}
    </div>
  </div>
);

/** the tab title with the live wave glyph `sound` leaves on it */
export const AliTab: React.FC = () => {
  const { f } = useScene();
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      AliExpress
      <span style={{ position: "relative", display: "inline-block", width: 44, height: 28 }}>
        <Saw w={44} h={28} phase={f * 0.9} period={11} stroke={3} />
      </span>
    </span>
  );
};
