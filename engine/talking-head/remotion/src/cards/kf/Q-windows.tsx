import React from "react";
import { Img, staticFile } from "remotion";
import { CLAUDE_D, CLAUDE_VB, CURSOR_D, CURSOR_VB, GEMINI_D, GEMINI_VB } from "./Q-marks";
import { MONO, SANS, SERIF, pick } from "./Q-util";
// keyframes-v1 V6: five real agent apps as macOS desktop windows, each in its own theme, its real mark in the
// title bar and a short believable exchange about editing this video. The content is anchored to the bottom
// (composer last, like the real apps), so a window can be resized and still read as the same app.

export type App = "claude" | "chatgpt" | "gemini" | "cursor" | "grok";
export const ORDER: App[] = ["claude", "chatgpt", "gemini", "cursor", "grok"];

type Theme = {
  name: string; mark: string; bar: string; barInk: string; bg: string; ink: string; muted: string; line: string;
  bubble: string; bubbleInk: string; field: string; fieldLine: string; placeholder: string; send: string; sendInk: string;
  replyFont: string; user: string; reply: string[]; file: string; model?: string;
};
export const THEMES: Record<App, Theme> = {
  claude: { file: "take-12.mov", name: "Claude", mark: "mark-claude.png", bar: "#EFECE3", barInk: "#3D3D3A", bg: "#FAF9F5", ink: "#141413",
    muted: "#73726C", line: "#E6E3D9", bubble: "#F0EEE6", bubbleInk: "#141413", field: "#FFFFFF", fieldLine: "#E6E3D9",
    placeholder: "Reply to Claude…", send: "#D97757", sendInk: "#fff", replyFont: SERIF, model: "Sonnet 4.6",
    user: "Edit take-12.mov with Keyframes",
    reply: ["On it. 28 cuts, captions on every word,", "and the visuals from your plan."] },
  chatgpt: { file: "take-12.mov", name: "ChatGPT", mark: "mark-openai.png", bar: "#1A1A1A", barInk: "#CFCFCF", bg: "#212121", ink: "#ECECEC",
    muted: "#9B9B9B", line: "#2F2F2F", bubble: "#303030", bubbleInk: "#ECECEC", field: "#303030", fieldLine: "#3A3A3A",
    placeholder: "Ask anything", send: "#FFFFFF", sendInk: "#000", replyFont: SANS,
    user: "Cut the pauses out of my talking head",
    reply: ["Done. 2.8 s of dead air removed and", "the second take of the intro dropped."] },
  gemini: { file: "reel-draft.mov", name: "Gemini", mark: "mark-gemini.png", bar: "#E9EDF3", barInk: "#444746", bg: "#FFFFFF", ink: "#1F1F1F",
    muted: "#5E5E5E", line: "#E3E3E3", bubble: "#E9EEF6", bubbleInk: "#1F1F1F", field: "#F0F4F9", fieldLine: "#F0F4F9",
    placeholder: "Ask Gemini", send: "#F0F4F9", sendInk: "#444746", replyFont: SANS,
    user: "Add captions to this reel",
    reply: ["172 caption pages timed to your voice,", "the key words in green."] },
  cursor: { file: "take-12.mov", name: "Cursor", mark: "mark-cursor.png", bar: "#1F1F1F", barInk: "#BDBDBD", bg: "#181818", ink: "#D4D4D4",
    muted: "#8B8B8B", line: "#2B2B2B", bubble: "#252526", bubbleInk: "#E6E6E6", field: "#1F1F1F", fieldLine: "#3C3C3C",
    placeholder: "Plan, @ for context, / for commands", send: "#E6E6E6", sendInk: "#181818", replyFont: SANS,
    user: "Make 5 hooks for this clip",
    reply: ["Rendered hooks/01.mp4 to hooks/05.mp4,", "same take, five different openings."] },
  grok: { file: "clip-01.mov", name: "Grok", mark: "mark-grok.png", bar: "#0A0A0A", barInk: "#BDBDBD", bg: "#000000", ink: "#F5F5F5",
    muted: "#8A8A8A", line: "#1C1C1C", bubble: "#1E1F22", bubbleInk: "#F5F5F5", field: "#141414", fieldLine: "#2A2A2A",
    placeholder: "What do you want to know?", send: "#F5F5F5", sendInk: "#000", replyFont: SANS,
    user: "Turn these 6 clips into a montage",
    reply: ["Cut on the beat of your song.", "montage.mp4 is ready in /exports."] },
};

const Glyph: React.FC<{ vb: string; d: string[]; size: number; fill: string }> = ({ vb, d, size, fill }) => (
  <svg width={size} height={size} viewBox={vb} style={{ flexShrink: 0 }}>{d.map((p, i) => <path key={i} d={p} fill={fill} />)}</svg>
);
const GeminiStar: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox={GEMINI_VB} style={{ flexShrink: 0 }}>
    <defs><linearGradient id="qgem" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stopColor="#1C7DFF" /><stop offset="0.55" stopColor="#6F7CF4" /><stop offset="1" stopColor="#D96570" />
    </linearGradient></defs>
    {GEMINI_D.map((p, i) => <path key={i} d={p} fill="url(#qgem)" />)}
  </svg>
);
// the avatar each app really shows next to its reply (ChatGPT and Grok show none)
const Avatar: React.FC<{ app: App }> = ({ app }) =>
  app === "claude" ? <Glyph vb={CLAUDE_VB} d={CLAUDE_D} size={28} fill="#D97757" />
  : app === "gemini" ? <GeminiStar size={28} />
  : app === "cursor" ? <Glyph vb={CURSOR_VB} d={CURSOR_D} size={22} fill="#8B8B8B" /> : null;

const TitleBar: React.FC<{ th: Theme; src: string; w: number }> = ({ th, src, w }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: w, height: 40, background: th.bar,
    borderBottom: `1px solid ${th.line}`, display: "flex", alignItems: "center" }}>
    <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />)}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center",
      justifyContent: "center", gap: 9, fontFamily: SANS, fontWeight: 600, fontSize: 18, color: th.barInk }}>
      <Img src={staticFile(src)} style={{ width: 22, height: 22, borderRadius: 5, objectFit: "cover" }} />
      {th.name}
    </div>
  </div>
);

const Composer: React.FC<{ app: App; th: Theme; cw: number }> = ({ app, th, cw }) => {
  const pill = app === "chatgpt" || app === "grok" || app === "gemini";
  return (
    <div style={{ width: cw, height: 62, background: th.field, border: `1.5px solid ${th.fieldLine}`, boxSizing: "border-box",
      borderRadius: pill ? 31 : app === "claude" ? 16 : 8, position: "relative", fontFamily: app === "cursor" ? SANS : SANS,
      boxShadow: app === "claude" ? "0 3px 12px rgba(20,20,19,0.06)" : undefined }}>
      <div style={{ position: "absolute", left: 22, top: 0, bottom: 0, display: "flex", alignItems: "center", fontSize: 20,
        color: th.muted, whiteSpace: "nowrap" }}>{app === "claude" || app === "chatgpt" ? <span style={{ fontSize: 26, marginRight: 14, lineHeight: 1 }}>+</span> : null}{th.placeholder}</div>
      {th.model && <div style={{ position: "absolute", right: 62, top: 0, bottom: 0, display: "flex", alignItems: "center",
        fontSize: 16, color: th.muted }}>{th.model}</div>}
      <div style={{ position: "absolute", right: 10, top: 10, width: 40, height: 40, borderRadius: app === "claude" ? 10 : 19,
        background: th.send, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" stroke={th.sendInk} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  );
};

// the raw take attached to the message, a real frame of it as the thumbnail (from the take strip)
const Attachment: React.FC<{ th: Theme; app: App; src: string }> = ({ th, app, src }) => {
  const tw = 54, tht = 96, k = 26;
  const dark = app === "chatgpt" || app === "grok" || app === "cursor";
  return (
    <div style={{ alignSelf: "flex-end", display: "flex", alignItems: "center", gap: 14, padding: 8, paddingRight: 22,
      background: dark ? "#2A2A2A" : "#FFFFFF", border: `1px solid ${th.fieldLine}`, borderRadius: app === "cursor" ? 6 : 14,
      fontFamily: SANS }}>
      <div style={{ width: tw, height: tht, borderRadius: app === "cursor" ? 3 : 8, backgroundImage: `url(${staticFile(src)})`,
        backgroundSize: `${tw * 69}px ${tht}px`, backgroundPosition: `${-k * tw}px 0` }} />
      <div>
        <div style={{ fontSize: 19, fontWeight: 600, color: th.ink }}>{th.file}</div>
        <div style={{ fontSize: 16, color: th.muted, marginTop: 4 }}>Video · 1:29</div>
      </div>
    </div>
  );
};

// one app window at any size; `glass` darkens it (depth), the column recentres as the window widens
export const ChatWindow: React.FC<{ app: App; w: number; h: number; assets: string[] }> = ({ app, w, h, assets }) => {
  const th = THEMES[app];
  const cw = Math.min(w - 48, 720);
  const replyStyle: React.CSSProperties = app === "cursor"
    ? { fontFamily: SANS, fontSize: 21, lineHeight: "31px" } : { fontFamily: th.replyFont, fontSize: app === "claude" ? 24 : 22, lineHeight: "33px" };
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, background: th.bg, overflow: "hidden",
      borderRadius: 0, border: `1px solid ${app === "grok" || app === "chatgpt" || app === "cursor" ? "#3a3a3a" : "#d9d6cc"}`, boxSizing: "border-box" }}>
      <TitleBar th={th} src={pick(assets, th.mark)} w={w} />
      <div style={{ position: "absolute", left: (w - cw) / 2, width: cw, top: 40, bottom: 16, display: "flex",
        flexDirection: "column", justifyContent: "flex-end", gap: 12 }}>
        <div style={{ alignSelf: "flex-end", opacity: Math.min(1, Math.max(0, (h - 320) / 60)) }}><Attachment th={th} app={app} src={pick(assets, "Q-take-strip.jpg")} /></div>
        <div style={{ alignSelf: "flex-end", background: th.bubble, color: th.bubbleInk, fontFamily: SANS, fontSize: 22,
          padding: "11px 20px", borderRadius: app === "cursor" ? 6 : 18, whiteSpace: "nowrap",
          border: app === "cursor" ? `1px solid ${th.fieldLine}` : undefined }}>{th.user}</div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", color: th.ink, ...replyStyle }}>
          <div style={{ paddingTop: 2 }}><Avatar app={app} /></div>
          <div style={{ whiteSpace: "nowrap" }}>
            {th.reply.map((l, i) => <div key={i}>{app === "cursor" ? l.split(/(hooks\/0\d\.mp4)/).map((s, k) =>
              /hooks\//.test(s) ? <span key={k} style={{ fontFamily: MONO, fontSize: 19, background: "#2A2D2E", padding: "1px 5px", borderRadius: 4 }}>{s}</span> : s) : l}</div>)}
          </div>
        </div>
        <div style={{ marginTop: 6 }}><Composer app={app} th={th} cw={cw} /></div>
      </div>
    </div>
  );
};
