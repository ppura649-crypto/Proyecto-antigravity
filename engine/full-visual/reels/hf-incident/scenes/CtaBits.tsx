// The pieces of Instagram's comment sheet for `cta`, redrawn at the app's layout (adapted from desert-ant-us CtaBits):
// a comment row, the input bar with the blue send button, and your.handle's DM banner carrying the three reports
// (titles from facts.md section 8).
import React from "react";
import { Img } from "remotion";
import { arrive, pop, stagger, useScene } from "../../../src/engine";
import { Logo, asset } from "./parts";

export const CTA_BLUE = "#0095F6";
export const CTA_INK = "#0C1014";
export const CTA_GREY = "#737373";
export const CTA_SHEET = { x: 0, y: 560, w: 900, h: 880 };
export const CTA_INPUT = { y: 770, h: 76, x: 112, w: 740 };
/** the viewer who comments: a synthetic portrait (never a real person), an example handle */
export const CTA_VIEWER = { handle: "rosa.builds", face: asset("cta/viewer.jpg") };

export const CtaHeart: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={CTA_GREY} strokeWidth={1.8} strokeLinejoin="round">
    <path d="M12 20s-7.5-4.6-9.2-9.1C1.6 7.6 3.9 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.3 0 5.6 3.1 4.4 6.4C19.5 15.4 12 20 12 20z" />
  </svg>
);

export const CtaAvatar: React.FC<{ src: string; size?: number; pos?: string }> = ({ src, size = 68, pos = "50% 30%" }) => (
  <Img src={src} style={{ width: size, height: size, borderRadius: 999, objectFit: "cover", objectPosition: pos, flex: "none" }} />
);

/** one comment, the way the sheet lays it out */
export const CtaComment: React.FC<{ face: string; handle: string; text: string }> = ({ face, handle, text }) => (
  <div style={{ display: "flex", gap: 22, alignItems: "flex-start", padding: "0 30px", fontFamily: "Inter" }}>
    <CtaAvatar src={face} />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 30, color: CTA_INK, fontWeight: 600 }}> {/* texture: Instagram UI */}
        {handle} <span style={{ fontWeight: 400, color: CTA_GREY }}>now</span>
      </div>
      <div style={{ fontSize: 40, color: CTA_INK, marginTop: 4, fontWeight: 600, letterSpacing: 1 }}>{text}</div>
      <div style={{ fontSize: 30, color: CTA_GREY, fontWeight: 600, marginTop: 8 }}>Reply</div> {/* texture: Instagram UI */}
    </div>
    <div style={{ paddingTop: 20 }}><CtaHeart /></div>
  </div>
);

const DocMark: React.FC = () => (
  <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke={CTA_INK} strokeWidth={1.7} strokeLinejoin="round">
    <path d="M6 2.8h8l4 4v14.4H6z" /><path d="M14 2.8v4h4M8.6 11h6.8M8.6 14h6.8M8.6 17h4.4" />
  </svg>
);

const REPORTS: { mark: React.ReactNode; title: string; source: string }[] = [
  { mark: <Logo name="openai" size={52} />, title: "The Hugging Face incident and the road ahead", source: "OpenAI" },
  { mark: <Logo name="huggingface" size={52} />, title: "Anatomy of a Frontier Lab Agent Intrusion", source: "Hugging Face" },
  { mark: <DocMark />, title: "Brief independent investigation of agents' behavior, reasoning and collaboration in the OpenAI / Hugging Face hacking incident", source: "METR" },
];

/** your.handle's DM: drops in as the in-app banner on `and`, its three report cards pop in to land on `reports` */
export const CtaDm: React.FC<{ at: number; cards: number }> = ({ at, cards }) => {
  const { f } = useScene();
  if (f < at) return null;
  const drop = 1 - arrive(f, at, 20);
  return (
    <div style={{ position: "absolute", left: 18, right: 18, top: 18, transform: `translateY(${(-640 * drop).toFixed(1)}px)`, borderRadius: 32, background: "#FFFFFF", boxShadow: "0 18px 50px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.05)", padding: "22px 24px", fontFamily: "Inter", zIndex: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <CtaAvatar src={asset("avatar-creator.png")} size={68} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: CTA_INK }}>your.handle</div>
          <div style={{ fontSize: 32, color: CTA_INK }}>here are the full reports</div>
        </div>
        <Logo name="instagram" size={52} />
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {REPORTS.map((r, i) => (
          <div key={r.source} style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 20px", borderRadius: 22, background: "#EFEFEF", ...pop(f, stagger(cards, i, 6), { dur: 10, from: 0.85 }) }}>
            {r.mark}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 32, lineHeight: "38px", fontWeight: 700, color: CTA_INK, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.title}</div>
              <div style={{ fontSize: 28, color: CTA_GREY, marginTop: 4 }}>{r.source}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
