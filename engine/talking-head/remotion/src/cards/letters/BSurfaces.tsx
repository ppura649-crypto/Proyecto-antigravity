import React from "react";

// edit-i-oneshot, family B: the pieces the two real surfaces are made of.
// LinkedIn's people search and Gmail's inbox keep their own colours, layout and type
// (the system sans), set for a 994 px card so nothing on either surface is under 28
// device px. No person is invented: a name is a soft grey bar, the way an anonymised
// screenshot reads. Colours read off the live products, 2026-09-13.

export const SANS = "-apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const LI = {
  blue: "#0A66C2",
  page: "#F3F2EF",
  ink: "rgba(0,0,0,0.90)",
  muted: "rgba(0,0,0,0.60)",
  bar: "#C4C9CF",
  barSoft: "#D8DCE1",
  hair: "#E6E4E1",
  field: "#EDF3F8",
  hover: "#F4F3F0",
};

export const GM = {
  ink: "#202124",
  muted: "#5F6368",
  read: "#F2F6FC",
  hair: "#EDEFF1",
  compose: "#C2E7FF",
  composeInk: "#001D35",
  active: "#D3E3FD",
  red: "#D93025",
  star: "#F4B400",
  field: "#EAF1FB",
  bar: "#DADCE0",
  barSoft: "#E4E7EA",
};

// Helvetica/system-sans advance widths (em), so a row can place its snippet right after the
// subject the way Gmail does, without measuring the DOM.
const EM: Record<string, number> = {};
const setEm = (chars: string, v: number): void => { for (const c of chars) EM[c] = v; };
setEm(" ", 0.278); setEm("!", 0.278); setEm("\"", 0.355); setEm("'", 0.191);
setEm("()[]", 0.3); setEm("{}", 0.334); setEm("|", 0.26); setEm("*", 0.389);
setEm("+<=>~", 0.584); setEm(",.:;", 0.278); setEm("-", 0.333); setEm("/\\", 0.278);
setEm("0123456789", 0.556); setEm("?", 0.556); setEm("@", 1.015); setEm("_", 0.556);
setEm("#$", 0.556); setEm("%", 0.889); setEm("&", 0.667); setEm("^", 0.469); setEm("`", 0.333);
setEm("BCDEGHKNOPQRUVXZ", 0.72); setEm("A", 0.667); setEm("F", 0.611); setEm("I", 0.278);
setEm("J", 0.5); setEm("L", 0.556); setEm("M", 0.833); setEm("S", 0.667); setEm("T", 0.611);
setEm("W", 0.944); setEm("Y", 0.667);
setEm("abdeghnopqu", 0.556); setEm("c", 0.5); setEm("f", 0.278); setEm("ij", 0.222);
setEm("kvxyzs", 0.5); setEm("l", 0.222); setEm("m", 0.833); setEm("r", 0.333);
setEm("t", 0.278); setEm("w", 0.722);

/** how wide a string sets at this size, near enough to place what follows it */
export const textW = (s: string, fs: number, bold: boolean): number => {
  let em = 0;
  for (const c of s) em += EM[c] ?? 0.556;
  return Math.round(em * fs * (bold ? 1.05 : 1));
};

/** a soft grey bar: the anonymised stand-in for a name, a place or a preview line */
export const Bar: React.FC<{ w: number; h: number; color: string; style?: React.CSSProperties }> = ({ w, h, color, style }) => (
  <div style={{ width: w, height: h, borderRadius: h / 2, backgroundColor: color, ...style }} />
);

/** LinkedIn's default photo: a grey person on a lighter grey disc */
export const Avatar: React.FC<{ d: number }> = ({ d }) => (
  <div style={{ width: d, height: d, borderRadius: d / 2, backgroundColor: "#DADEE2", overflow: "hidden", flex: "none" }}>
    <svg width={d} height={d} viewBox="0 0 64 64" style={{ display: "block" }}>
      <circle cx="32" cy="24" r="11.5" fill="#AEB6BF" />
      <path d="M10 62a22 22 0 0 1 44 0z" fill="#AEB6BF" />
    </svg>
  </div>
);

/** a list checkbox: white and outlined, then filled with the surface's blue and a drawn tick */
export const CheckSquare: React.FC<{ s: number; p: number; color: string }> = ({ s, p, color }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block" }}>
    <rect
      x="1.6" y="1.6" width="20.8" height="20.8" rx="2.5"
      fill={p > 0.55 ? color : "#FFFFFF"} stroke={p > 0.55 ? color : "#8C9196"} strokeWidth="2"
    />
    {p > 0.02 && (
      <path
        d="M6.2 12.4 L10.2 16.4 L17.8 8.4" fill="none" stroke="#FFFFFF" strokeWidth="2.8"
        strokeLinecap="round" strokeLinejoin="round" strokeDasharray="17" strokeDashoffset={17 * (1 - p)}
      />
    )}
  </svg>
);

export const Magnifier: React.FC<{ s: number; color: string }> = ({ s, color }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block" }}>
    <circle cx="10.5" cy="10.5" r="6.6" fill="none" stroke={color} strokeWidth="2.2" />
    <line x1="15.4" y1="15.4" x2="20.4" y2="20.4" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export const PersonPlus: React.FC<{ s: number; color: string }> = ({ s, color }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block" }}>
    <circle cx="9.5" cy="7.5" r="3.9" fill={color} />
    <path d="M2.6 19.5a6.9 6.9 0 0 1 13.8 0z" fill={color} />
    <line x1="19" y1="5.5" x2="19" y2="13" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <line x1="15.2" y1="9.2" x2="22.8" y2="9.2" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/** the handset that lands on the one row they wanted a call from */
export const Phone: React.FC<{ s: number; color: string }> = ({ s, color }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path
      d="M6.2 3.2h3.1l1.7 4.2-2.2 1.5a11.6 11.6 0 0 0 5.8 5.8l1.5-2.2 4.2 1.7v3.1c0 1.1-.9 2-2 2A16.6 16.6 0 0 1 4.2 5.2c0-1.1.9-2 2-2z"
      fill={color}
    />
  </svg>
);

export const Hamburger: React.FC<{ s: number; color: string }> = ({ s, color }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block" }}>
    {[6, 12, 18].map((y) => <line key={y} x1="3" y1={y} x2="21" y2={y} stroke={color} strokeWidth="2.1" strokeLinecap="round" />)}
  </svg>
);

export const Pencil: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M3 17.3V21h3.7L17.6 10.1l-3.7-3.7z" fill="#4285F4" />
    <path d="M20.7 7 18.4 9.3l-3.7-3.7L17 3.3a1 1 0 0 1 1.4 0l2.3 2.3a1 1 0 0 1 0 1.4z" fill="#FBBC04" />
    <path d="M3 17.3V21h3.7l2.1-2.1-3.7-3.7z" fill="#34A853" />
  </svg>
);

export const Star: React.FC<{ s: number; filled: boolean }> = ({ s, filled }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path
      d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"
      fill={filled ? "#F4B400" : "none"} stroke={filled ? "#F4B400" : "#BDC1C6"} strokeWidth="1.8" strokeLinejoin="round"
    />
  </svg>
);

export const InboxTray: React.FC<{ s: number; color: string }> = ({ s, color }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M3 5h18v14H3z" fill="none" stroke={color} strokeWidth="2" />
    <path d="M3 13h4l1.6 2.6h6.8L17 13h4" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export const Tag: React.FC<{ s: number; color: string }> = ({ s, color }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M3 3h9l9 9-9 9-9-9z" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="8" cy="8" r="1.9" fill={color} />
  </svg>
);

export const People: React.FC<{ s: number; color: string }> = ({ s, color }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block" }}>
    <circle cx="9" cy="8" r="3.6" fill="none" stroke={color} strokeWidth="2" />
    <path d="M2.8 19.4a6.2 6.2 0 0 1 12.4 0" fill="none" stroke={color} strokeWidth="2" />
    <path d="M16 5.2a3.6 3.6 0 0 1 0 5.6M17.6 14.4a6.2 6.2 0 0 1 3.6 5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Plane: React.FC<{ s: number; color: string }> = ({ s, color }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M2.6 11.6 21 3.4l-8.2 18.4-2.2-7.8z" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

/** LinkedIn's outlined Connect button (its blue, a pill, the person-plus glyph) */
export const Connect: React.FC<{ w: number; h: number; fs: number }> = ({ w, h, fs }) => (
  <div
    style={{
      width: w, height: h, borderRadius: h / 2, border: `2px solid ${LI.blue}`,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 0.34 * fs,
      backgroundColor: "transparent", boxSizing: "border-box",
    }}
  >
    <PersonPlus s={Math.round(1.08 * fs)} color={LI.blue} />
    <span style={{ fontFamily: SANS, fontSize: fs, fontWeight: 600, color: LI.blue, lineHeight: 1 }}>Connect</span>
  </div>
);

/** one filter pill on the results page: People is the one we are on, filled */
export const Pill: React.FC<{ text: string; on: boolean; fs: number }> = ({ text, on, fs }) => (
  <div
    style={{
      height: Math.round(1.78 * fs), padding: `0 ${Math.round(0.78 * fs)}px`, borderRadius: 999,
      backgroundColor: on ? LI.blue : "transparent",
      border: on ? `1px solid ${LI.blue}` : "1px solid rgba(0,0,0,0.60)",
      display: "flex", alignItems: "center", boxSizing: "border-box",
    }}
  >
    <span style={{ fontFamily: SANS, fontSize: fs, fontWeight: 600, color: on ? "#FFFFFF" : LI.ink, lineHeight: 1 }}>{text}</span>
  </div>
);
