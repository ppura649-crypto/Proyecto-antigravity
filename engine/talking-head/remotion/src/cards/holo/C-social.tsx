import React from "react";
import { Img, staticFile } from "remotion";
import { Clip, Phone, SHADOW, asset } from "./C-kit";
// reference edit K B8 (v5): the three real Crocs outputs that sit side by side on "ads, emails, social posts".
// Each is a real Crocs creative in its real surface: a Meta feed ad, the Crocs email, an Instagram post.
// Square corners on every ground (law: radius 0); the phone keeps its real shape.

const UI = '-apple-system, "SF Pro Text", "Inter", "Helvetica Neue", sans-serif';
const INK = "#111";

// the Crocs account mark, drawn: the wordmark on black in a round avatar (Crocs' own IG avatar is this)
const Avatar: React.FC<{ d: number }> = ({ d }) => (
  <div style={{ width: d, height: d, borderRadius: d, background: "#111", display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontFamily: UI, fontWeight: 800, fontSize: d * 0.3, letterSpacing: "-0.02em", flex: "none" }}>crocs</div>
);

// ADS: a Meta feed ad. Header (crocs · Sponsored), the real creative 4:5, the "Shop now" bar.
export const AdCard: React.FC<{ w: number; assets: string[] }> = ({ w, assets }) => {
  const ih = Math.round(w * 1.25);
  return (
    <div style={{ width: w, background: "#fff", boxShadow: SHADOW, fontFamily: UI, color: INK }}>
      <div style={{ height: 64, display: "flex", alignItems: "center", gap: 12, padding: "0 14px" }}>
        <Avatar d={40} />
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontWeight: 700, fontSize: 24 }}>crocs</div>
          <div style={{ fontWeight: 500, fontSize: 19, color: "#65676b" }}>Sponsored</div>
        </div>
      </div>
      <Img src={staticFile(asset(assets, "crocs-5139685.jpg"))} style={{ display: "block", width: w, height: ih, objectFit: "cover" }} />
      <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", background: "#f0f2f5" }}>
        <div style={{ fontWeight: 700, fontSize: 21 }}>crocs.com</div>
        <div style={{ background: "#e4e6eb", padding: "8px 14px", borderRadius: 6, fontWeight: 700, fontSize: 21 }}>Shop now</div>
      </div>
    </div>
  );
};

// EMAILS: the real Crocs email (crocs-email.mp4) scrolling under a mail header.
export const EmailCard: React.FC<{ w: number; h: number; assets: string[]; startMs: number; fps: number }> = ({ w, h, assets, startMs, fps }) => {
  const HD = 70;
  return (
    <div style={{ width: w, height: h, background: "#fff", boxShadow: SHADOW, fontFamily: UI, color: INK, overflow: "hidden", position: "relative" }}>
      <div style={{ height: HD, display: "flex", alignItems: "center", gap: 12, padding: "0 14px", borderBottom: "1px solid #e6e6e6" }}>
        <Avatar d={42} />
        <div style={{ lineHeight: 1.15, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 23 }}>Crocs <span style={{ fontWeight: 500, color: "#777", fontSize: 19 }}>to me</span></div>
          <div style={{ fontWeight: 600, fontSize: 20, color: "#333", whiteSpace: "nowrap" }}>Come As You Are.</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, top: HD, width: w, height: h - HD, overflow: "hidden" }}>
        <Clip src={asset(assets, "crocs-email.mp4")} startMs={startMs} fromSec={1.4} fps={fps}
          style={{ left: 0, top: 0, width: w, height: Math.round((w * 1084) / 820) }} />
      </div>
    </div>
  );
};

const Icon: React.FC<{ d: string; s: number }> = ({ d, s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"><path d={d} /></svg>
);
const HEART = "M12 20s-7-4.4-9.2-8.6C1.3 8.4 3 5 6.3 5c2 0 3.3 1.1 4 2.4h3.4C14.4 6.1 15.7 5 17.7 5 21 5 22.7 8.4 21.2 11.4 19 15.6 12 20 12 20z";
const BUBBLE = "M20 11.5a8 8 0 1 1-3.5-6.6A8 8 0 0 1 20 11.5zM20 11.5 21 20l-4.5-2.5";
const SEND = "M22 3 9.5 13.5M22 3l-7 18-4-8-8-4z";
const SAVE = "M6 3h12v18l-6-5-6 5z";

// SOCIAL POSTS: an Instagram post from @crocs on a phone.
export const IgPhone: React.FC<{ w: number; h: number; assets: string[] }> = ({ w, h, assets }) => {
  const sw = w - 2 * Math.round(w * 0.036), iw = sw;
  return (
    <Phone w={w} h={h}>
      <div style={{ position: "absolute", inset: 0, background: "#fff", fontFamily: UI, color: INK }}>
        <div style={{ height: 44, display: "flex", alignItems: "flex-end", padding: "0 22px 4px", fontWeight: 700, fontSize: 16 }}>9:41</div>
        <div style={{ height: 50, display: "flex", alignItems: "center", padding: "0 12px", fontFamily: "'Brush Script MT', 'Snell Roundhand', cursive",
          fontSize: 32, fontWeight: 400 }}>Instagram</div>
        <div style={{ height: 52, display: "flex", alignItems: "center", gap: 10, padding: "0 10px" }}>
          <div style={{ padding: 2, borderRadius: 40, background: "linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)" }}>
            <div style={{ padding: 2, borderRadius: 40, background: "#fff" }}><Avatar d={32} /></div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>crocs</div>
        </div>
        <Img src={staticFile(asset(assets, "crocs-5139682.jpg"))} style={{ display: "block", width: iw, height: Math.round(iw * 1.25), objectFit: "cover" }} />
        <div style={{ display: "flex", gap: 12, padding: "10px 10px 4px", alignItems: "center" }}>
          <Icon d={HEART} s={26} /><Icon d={BUBBLE} s={26} /><Icon d={SEND} s={26} />
          <div style={{ flex: 1 }} /><Icon d={SAVE} s={26} />
        </div>
        <div style={{ padding: "2px 10px", fontSize: 18, lineHeight: 1.25 }}><b>crocs</b> Come as you are.</div>
      </div>
    </Phone>
  );
};
