// The browser row of the last third, as `browsers`, `chrome` and `cta` draw it: the four real marks at their ROW
// slots, one solid soft verdict slot under each, the two answers (Firefox, Brave) and the hash line above the row.
// Every colour follows the ground's lightness, so the same objects survive the flip to dark and back.
import React from "react";
import { useScene } from "../../../src/engine";
import { useLightness } from "../../../src/engine/Ground";
import { HANDOFF, Logo, ROW, WAVE, mixHex, rowX } from "./parts";

export const SLOT = { top: ROW.y + ROW.size / 2 + 40, h: 200, w: 190 };
export const HASH_FONT = 44; // the hash line's size at HANDOFF.hashLine.top
export const lerp = (a: number, b: number, k: number) => a + (b - a) * Math.max(0, Math.min(1, k));

/** the row's colours at this frame's ground lightness (0 dark, 1 light) */
export function usePalette() {
  const k = useLightness();
  const m = (dark: string, light: string) => mixHex(dark, light, k);
  return {
    k,
    ink: m("#F2F2F2", "#0B0B0B"),
    dim: m("#8C8C8C", "#6B7280"),
    grey: m("#5E5E62", "#B4B7BD"), // the hash when it is the same for everyone
    slot: m("#1E1E21", "#ECECEF"),
    card: m("#232327", "#FFFFFF"),
    outline: m("#6E6E73", "#9CA0A8"),
    shadow: k > 0.5 ? "0 14px 36px rgba(20,24,40,0.12)" : "0 14px 36px rgba(0,0,0,0.45)",
  };
}

export type MarkState = { lift: number; dim: number; press?: number };

/** the four marks. lift 0..1 raises and enlarges one, dim 0..1 greys it back */
export const Marks: React.FC<{ state: (i: number) => MarkState; y?: number; opacity?: number }> = ({ state, y = 0, opacity = 1 }) => {
  const { f } = useScene();
  return (
    <>
      {ROW.order.map((name, i) => {
        const s = state(i);
        const bob = s.lift > 0.5 ? Math.sin((f + i * 17) / 14) * 3 * s.lift : 0; // a lifted mark is held, never parked
        const scale = (1 + 0.12 * s.lift) * (1 - 0.1 * (s.press ?? 0));
        return (
          <div
            key={name}
            style={{
              position: "absolute", left: rowX(i) - ROW.size / 2, top: ROW.y - ROW.size / 2 + y, width: ROW.size, height: ROW.size,
              transform: `translateY(${(-30 * s.lift + bob).toFixed(2)}px) scale(${scale.toFixed(4)})`,
              opacity: opacity * (1 - 0.7 * s.dim), filter: s.dim > 0.01 ? `grayscale(${s.dim.toFixed(2)})` : undefined,
            }}
          >
            <Logo name={name} size={ROW.size} />
          </div>
        );
      })}
    </>
  );
};

/** one verdict slot: solid and soft when empty, a card when answered, a solid outline when named (never dashed) */
export const Slot: React.FC<{ i: number; fill?: number; outline?: string; outlineK?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({
  i, fill = 0, outline, outlineK = 0, style, children,
}) => {
  const p = usePalette();
  const bg = mixHex(p.slot, p.card, fill);
  const edge = outline ? mixHex(bg, outline, outlineK) : bg;
  return (
    <div
      style={{
        position: "absolute", left: rowX(i) - SLOT.w / 2, top: SLOT.top, width: SLOT.w, height: SLOT.h, borderRadius: 18, boxSizing: "border-box",
        background: bg, border: `4px solid ${edge}`, boxShadow: fill > 0.5 ? p.shadow : undefined,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Firefox's answer: the release it shipped in, and the year the voice says */
export const FirefoxTag: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { theme } = useScene();
  const p = usePalette();
  return (
    <div style={{ textAlign: "center", fontFamily: theme.font.ui, ...style }}>
      <div style={{ fontSize: 29 /* texture: the year carries it */, fontWeight: 600, color: p.dim, whiteSpace: "nowrap" }}>Firefox 118</div>
      <div style={{ fontSize: 56, fontWeight: 800, color: p.ink, lineHeight: "64px", marginTop: 6 }}>2023</div>
      <Check />
    </div>
  );
};

const Check: React.FC = () => (
  <svg width={40} height={40} viewBox="0 0 24 24" style={{ display: "block", margin: "10px auto 0" }}>
    <circle cx={12} cy={12} r={11} fill="#34C759" />
    <path d="M7 12.4l3.2 3.1L17 8.8" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Brave's answer: noise on the result. The little signal above the words is live: it never draws the same twice */
export const BraveTag: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { f, theme } = useScene();
  const p = usePalette();
  const k = Math.floor(f / 3);
  const pts = Array.from({ length: 23 }, (_, j) => {
    const x = 6 + j * 6.8;
    const n = Math.sin((j + 1) * 12.9898 + k * 78.233) * 43758.5453;
    const y = 22 + Math.sin(j * 0.9) * 8 + ((n - Math.floor(n)) - 0.5) * 16;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <div style={{ textAlign: "center", fontFamily: theme.font.ui, ...style }}>
      <svg width={160} height={44} viewBox="0 0 160 44" style={{ display: "block", margin: "0 auto 8px" }}>
        <polyline points={pts.join(" ")} fill="none" stroke={WAVE} strokeWidth={3} strokeLinejoin="round" />
      </svg>
      <div style={{ fontSize: 38, fontWeight: 700, color: p.ink, lineHeight: "44px" }}>random</div>
      <div style={{ fontSize: 38, fontWeight: 700, color: p.ink, lineHeight: "44px" }}>noise</div>
    </div>
  );
};

const HEX = "0123456789abcdef";
/** the hash with its characters after `sha256:` scrambled: settled[i] true keeps the real character */
export function scramble(s: string, f: number, settled: (i: number) => boolean) {
  const k = Math.floor(f / 3);
  return s
    .split("")
    .map((ch, i) => {
      if (i < 7 || ch === "…" || settled(i)) return ch;
      const n = Math.sin((i + 1) * 91.345 + k * 47.853) * 24634.6345;
      return HEX[Math.floor((n - Math.floor(n)) * 16)];
    })
    .join("");
}

/** the hash line, one line of mono centred on cx at the handoff height */
export const HashLine: React.FC<{ text: string; color: string; cx?: number; size?: number; dx?: number; scale?: number; blur?: number; opacity?: number }> = ({
  text, color, cx = 540, size = HASH_FONT, dx = 0, scale = 1, blur = 0, opacity = 1,
}) => {
  const { theme } = useScene();
  return (
    <div
      style={{
        position: "absolute", left: cx - 500, width: 1000, top: HANDOFF.hashLine.top, textAlign: "center",
        fontFamily: theme.font.mono, fontSize: size, fontWeight: 600, lineHeight: `${Math.round(size * 1.25)}px`, color, whiteSpace: "pre",
        transform: `translateX(${dx.toFixed(2)}px) scale(${scale.toFixed(4)})`, filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined, opacity,
      }}
    >
      {text}
    </div>
  );
};

