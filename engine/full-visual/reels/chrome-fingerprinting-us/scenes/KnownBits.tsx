// The pieces of `known`: one dated pin card on the timeline, and the FingerprintJS repo card redrawn at GitHub's own
// pinned-repo geometry (repo octicon, blue name, Public pill, description, topic, language dot, stars, forks),
// scaled x2.4. Every value on them is real: sources in facts.md and the report.
import React from "react";
import { Img } from "remotion";
import { useScene } from "../../../src/engine";
import { Logo, asset } from "./parts";

/** timeline geometry: the axis, the three pins (x), cards above (0, 2) and below (1) the axis */
export const TL = { y: 800, x0: 110, x1: 970, pins: [280, 540, 800], cardW: 380, above: 560, below: 840 };
export const REPO = { left: 130, top: 1075, width: 820 };

export type Pin = { year: string; icon: React.ReactNode; title: string; claim: string; source: string };

const PaperThumb: React.FC = () => (
  <Img src={asset("known-paper-2016.png")} style={{ width: 60, height: 60, objectFit: "cover", objectPosition: "top", borderRadius: 6, border: "1px solid #E1E4E8", flex: "none" }} />
);

/** a blog post page: the generic document glyph (the blog has no mark of its own) */
const PostGlyph: React.FC = () => (
  <svg width={60} height={60} viewBox="0 0 24 24" style={{ flex: "none" }}>
    <path d="M6 2h8l5 5v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" fill="#FFFFFF" stroke="#1F2328" strokeWidth={1.4} strokeLinejoin="round" />
    <path d="M14 2v5h5" fill="none" stroke="#1F2328" strokeWidth={1.4} strokeLinejoin="round" />
    <path d="M8 11h8M8 14.5h8M8 18h5" stroke="#FF4747" strokeWidth={1.6} strokeLinecap="round" />
  </svg>
);

/** the three pins, each a real source checked 2026-09-25 */
export const PINS: Pin[] = [
  { year: "2016", icon: <PaperThumb />, title: "Princeton study", claim: "audio fingerprinting found on live sites", source: "ACM CCS 2016" },
  { year: "2023", icon: <Logo name="firefox" size={60} />, title: "Mozilla bug", claim: "AliExpress keeps Windows awake", source: "bugzilla #1863193" },
  { year: "2026", icon: <PostGlyph />, title: "Developer's post", claim: "AliExpress plays a silent sound", source: "laserphile blog" },
];

export const PinCard: React.FC<{ pin: Pin }> = ({ pin }) => {
  const { theme } = useScene();
  return (
    <div style={{ width: TL.cardW, boxSizing: "border-box", padding: "22px 24px 26px", background: "#FFFFFF", borderRadius: 16, boxShadow: "0 14px 40px rgba(20,24,40,0.10)", border: "1px solid #ECEEF1", fontFamily: theme.font.ui }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {pin.icon}
        <div style={{ fontSize: 32, fontWeight: 700, color: "#0B0B0B", lineHeight: "38px" }}>{pin.title}</div>
      </div>
      <div style={{ fontSize: 32, lineHeight: "40px", color: "#1F2328", marginTop: 14 }}>{pin.claim}</div>
    </div>
  );
};

const Oct: React.FC<{ d: string; size: number; color: string }> = ({ d, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ flex: "none" }}>
    <path d={d} fill={color} />
  </svg>
);
const REPO_ICON =
  "M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z";
const STAR =
  "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z";
const FORK =
  "M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z";

/** github.com/fingerprintjs/fingerprintjs as GitHub draws a pinned repo (Primer colours, light theme) */
export const RepoCard: React.FC<{ stars: number; starGold: number }> = ({ stars, starGold }) => {
  const { theme } = useScene();
  const grey = "#59636E";
  const meta: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, fontSize: 32, color: grey };
  return (
    <div style={{ width: REPO.width, boxSizing: "border-box", padding: "26px 36px 28px", background: "#FFFFFF", border: "2px solid #D1D9E0", borderRadius: 14, boxShadow: "0 20px 50px rgba(20,24,40,0.10)", fontFamily: theme.font.ui }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Oct d={REPO_ICON} size={36} color={grey} />
        <div style={{ fontSize: 38, fontWeight: 600, color: "#0969DA", whiteSpace: "nowrap" }}>fingerprintjs / fingerprintjs</div>
        <div style={{ fontSize: 26 /* GitHub's own small pill */, fontWeight: 500, color: grey, border: "2px solid #D1D9E0", borderRadius: 99, padding: "2px 16px" }}>Public</div>
        <Logo name="github" size={60} style={{ marginLeft: "auto" }} />
      </div>
      <div style={{ fontSize: 32, lineHeight: "44px", color: grey, marginTop: 18 }}>The most advanced free and open-source browser fingerprinting library</div>
      <div style={{ marginTop: 18, display: "inline-flex", fontSize: 28, fontWeight: 500, color: "#0969DA", background: "#DDF4FF", borderRadius: 99, padding: "4px 20px" }}>audio-fingerprinting</div>
      <div style={{ display: "flex", gap: 44, marginTop: 24 }}>
        <div style={meta}>
          <span style={{ width: 24, height: 24, borderRadius: 99, background: "#3178C6" }} />
          TypeScript
        </div>
        <div style={{ ...meta, color: "#1F2328", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          <Oct d={STAR} size={34} color={starGold > 0 ? mixGold(starGold) : grey} />
          {Math.round(stars).toLocaleString("en-US")}
        </div>
        <div style={meta}>
          <Oct d={FORK} size={34} color={grey} />
          2,628
        </div>
      </div>
    </div>
  );
};

const mixGold = (t: number) => {
  const a = [0x59, 0x63, 0x6e];
  const b = [0xe3, 0xb3, 0x41];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(1, t))).join(",")})`;
};
