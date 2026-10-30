// The AliExpress homepage as it loads inside the Chrome tab, redrawn at desktop geometry: white page, the real mark,
// the search bar in AliExpress's orange-red with its red search button, the category row, the SuperDeals strip and
// a row of product tiles. No prices, no invented claims: the tiles are the product pictures and a generic name.
import React from "react";
import { blurIn, prog, ease, useScene } from "../../../src/engine";
import { ALI, Logo } from "./parts";

const INK = "#191919";
const DIM = "#666A70";

/** Chrome's tab throbber while the page loads: a blue arc turning */
export const Throbber: React.FC = () => {
  const { f } = useScene();
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" style={{ display: "block", transform: `rotate(${(f * 14) % 360}deg)` }}>
      <circle cx={16} cy={16} r={12} fill="none" stroke="#3C4043" strokeWidth={4} />
      <path d="M16 4a12 12 0 0 1 12 12" fill="none" stroke="#8AB4F8" strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
};

// four product pictures, drawn as objects on a soft studio ground
const Buds: React.FC = () => (
  <g>
    <ellipse cx={100} cy={96} rx={62} ry={38} fill="#FFFFFF" stroke="#D5D8DD" strokeWidth={3} />
    <rect x={64} y={70} width={72} height={16} rx={8} fill="#E9EBEF" />
    <circle cx={78} cy={56} r={18} fill="#FFFFFF" stroke="#C9CDD3" strokeWidth={3} />
    <circle cx={122} cy={56} r={18} fill="#FFFFFF" stroke="#C9CDD3" strokeWidth={3} />
    <rect x={72} y={56} width={10} height={30} rx={5} fill="#FFFFFF" stroke="#C9CDD3" strokeWidth={3} />
    <rect x={118} y={56} width={10} height={30} rx={5} fill="#FFFFFF" stroke="#C9CDD3" strokeWidth={3} />
  </g>
);
const Watch: React.FC = () => (
  <g>
    <rect x={80} y={14} width={40} height={122} rx={14} fill="#2B2F36" />
    <rect x={66} y={44} width={68} height={64} rx={18} fill="#111317" stroke="#565C66" strokeWidth={4} />
    <rect x={74} y={52} width={52} height={48} rx={12} fill="#1E6FD9" />
    <path d="M86 84l8-10 7 6 11-14" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
const Shoe: React.FC = () => (
  <g>
    <path d="M30 104c0-18 6-40 20-50 10 10 30 14 46 12 16 18 40 22 64 26 12 2 16 10 14 20z" fill="#FF6A3D" />
    <path d="M28 104h148v12a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6z" fill="#F4F4F4" stroke="#D5D8DD" strokeWidth={2} />
    <path d="M64 70l10 10M78 66l10 10M92 66l10 10" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
  </g>
);
const Lamp: React.FC = () => (
  <g>
    <path d="M70 30h60l18 44H52z" fill="#FFC857" />
    <rect x={96} y={74} width={8} height={48} fill="#8A8F98" />
    <ellipse cx={100} cy={124} rx={40} ry={9} fill="#6B7079" />
    <ellipse cx={100} cy={78} rx={46} ry={8} fill="#FFE7A8" opacity={0.8} />
  </g>
);

const TILES: { name: string; bg: string; art: React.ReactNode }[] = [
  { name: "Wireless earbuds", bg: "#EEF1F6", art: <Buds /> },
  { name: "Smart watch", bg: "#F3EEF8", art: <Watch /> },
  { name: "Running shoes", bg: "#FFF1EA", art: <Shoe /> },
  { name: "Desk lamp", bg: "#FFF8E6", art: <Lamp /> },
];

const Icon: React.FC<{ d: string }> = ({ d }) => (
  <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

/** the page, 900 wide. `at` = the frame it starts rendering ("open"), `scrollAt` = the gentle scroll ("computer") */
export const AliPage: React.FC<{ at: number; scrollAt: number }> = ({ at, scrollAt }) => {
  const { f, theme } = useScene();
  const scroll = 40 * prog(f, scrollAt, 48, ease.inOut);
  const sheen = ((f - at) * 6) % 1400; // a light sweep across the SuperDeals strip: the page is alive
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", fontFamily: theme.font.ui, color: INK, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: -scroll }}>
        {/* header: mark, search, account and cart */}
        <div style={{ height: 100, display: "flex", alignItems: "center", gap: 20, padding: "0 26px", ...blurIn(f, at, { dur: 8, rise: -14 }) }}>
          <Logo name="aliexpress" size={62} style={{ borderRadius: 12 }} />
          <div style={{ flex: 1, height: 58, borderRadius: 29, border: `3px solid ${ALI}`, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: 4, boxSizing: "border-box" }}>
            <div style={{ width: 86, height: 46, borderRadius: 23, background: ALI, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round">
                <circle cx={10.5} cy={10.5} r={6.5} />
                <path d="M15.5 15.5L21 21" />
              </svg>
            </div>
          </div>
          <Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
          <Icon d="M3 4h2.5l2.2 11h10.6L21 7H6.4M9 20a1 1 0 1 0 0-.01M17 20a1 1 0 1 0 0-.01" />
        </div>
        {/* category row */}
        <div style={{ height: 54, display: "flex", alignItems: "center", gap: 34, padding: "0 28px", fontSize: 26, borderBottom: "1px solid #EDEDED", ...blurIn(f, at + 5, { dur: 8 }) }}>
          <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
            <svg width={26} height={26} viewBox="0 0 24 24" stroke={INK} strokeWidth={2.4} strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
            All categories
          </span>
          {["Phones", "Electronics", "Home", "Fashion"].map((c) => (
            <span key={c} style={{ color: DIM }}>{c}</span>
          ))}
        </div>
        {/* SuperDeals strip */}
        <div style={{ margin: "16px 26px 0", height: 104, borderRadius: 16, overflow: "hidden", position: "relative", background: `linear-gradient(90deg, ${ALI} 0%, #FF7A1A 100%)`, ...blurIn(f, at + 10, { dur: 9, scaleFrom: 0.97 }) }}>
          <div style={{ position: "absolute", left: 30, top: 0, bottom: 0, display: "flex", alignItems: "center", fontSize: 42, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>SuperDeals</div>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: sheen - 300, width: 160, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)", transform: "skewX(-18deg)" }} />
        </div>
        {/* product tiles */}
        <div style={{ display: "flex", gap: 16, padding: "16px 26px 0" }}>
          {TILES.map((t, i) => (
            <div key={t.name} style={{ flex: 1, ...blurIn(f, at + 14 + i * 5, { dur: 9, rise: 30 }) }}>
              <svg viewBox="0 0 200 140" style={{ width: "100%", display: "block", borderRadius: 12, background: t.bg }}>
                {t.art}
              </svg>
              <div style={{ fontSize: 24, marginTop: 8, whiteSpace: "nowrap", color: INK }}>{t.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
