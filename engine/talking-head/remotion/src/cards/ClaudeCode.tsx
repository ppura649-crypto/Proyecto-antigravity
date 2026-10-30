import React from "react";
import { interpolate } from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// The real Claude Code window, remocn's `claude-code` component (fetched from
// remocn.dev/r/claude-code.json 2026-09-04 and byte-identical to the copy in
// motion-lab/src/components/remocn/, so these ARE the registry's numbers).
// Every size below is remocn's own, in its window's coordinate space:
// 1100 x 620 window, 40 px bar, 28 px body padding, the dashed welcome box at
// 28/24/24, type at 20 / 16 / 15 / 14 / 17, a 96 px mascot, the 32 px gap and
// the hairline + 16 above the prompt. Nothing is re-derived from the card.
//
// The card is the WINDOW, so its aspect must be 1100:620. Legibility comes from
// a camera PUSH into the prompt row, not from resizing the type: reflowing the
// component as fractions of the card was the first attempt and it read as a
// squeezed crop with the sentence running off the edge (the creator 2026-09-04:
// "it doesn't respect the real height it requires and the width as well it goes
// beyond" / "look at the remocn, the real one, use the website"). Pushing in on
// a correctly proportioned real UI is what Creator Format 1 does with every capture
// (formats/creator-format-1-visuals.md: real screenshots get re-framed).
const { fontFamily: MONO } = loadMono();

const WIN_W = 1100;
const WIN_H = 620;
const BAR = 40;
// A real terminal is resizable, so a session window is simply a smaller window
// (700x430 is an ordinary one). The TYPE never changes: remocn's 16/17 px land
// at 1.5x on the frame because the whole window is scaled up, which is the same
// trick as the push and keeps the full width visible.

const T = {
  windowBar: "#3A3633",
  windowBody: "#1B1A18",
  fg: "#E8E5DD",
  fgMuted: "#8A857C",
  fgDim: "#6B6660",
  accent: "#D97757",
};

export type CcLine = { atMs: number; text: string; tone?: "ink" | "muted" | "accent" | "dim";
  // right-aligned on the same row; "{t}" becomes the live elapsed seconds, which
  // is how ten identical clocks prove the ten runs are concurrent
  right?: string };

const Mascot: React.FC<{ size?: number }> = ({ size = 96 }) => (
  <svg height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Claude Code</title>
    <path
      clipRule="evenodd"
      d="M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z"
      fill={T.accent}
      fillRule="evenodd"
    />
  </svg>
);

export const ClaudeCode: React.FC<{
  tMs: number;
  w: number;
  h: number;
  title?: string;
  userName?: string;
  model?: string;
  cwd?: string;
  whatsNew?: string[];
  prompt: string;
  promptAtMs: number;
  typeMs?: number;
  lines?: CcLine[];
  // "welcome" is the first screen you see; "session" drops the welcome box and
  // shows the sent prompt with what it spawned, which is a different object
  mode?: "welcome" | "session";
  clockFromMs?: number;
  winW?: number;
  winH?: number;
  push?: { atMs: number; ms?: number; scale?: number; ox?: number; oy?: number };
}> = ({
  tMs, w, h,
  title = "Claude Code v2.0.0",
  userName,
  model = "Opus 4.8 • Max 20x",
  cwd = "~/work",
  whatsNew = ["/agents to create subagents", "/security-review for review agent", "ctrl+b to background bashes"],
  prompt, promptAtMs, typeMs = 900, lines = [], mode = "welcome", clockFromMs, winW, winH, push,
}) => {
  const W = winW ?? WIN_W;
  const H = winH ?? WIN_H;
  const stage = w / W; // the card IS the window

  const typed = Math.min(1, Math.max(0, (tMs - promptAtMs) / typeMs));
  const chars = Math.ceil(prompt.length * typed);
  const promptText = prompt.slice(0, chars);
  const typing = typed > 0 && typed < 1;
  const caretOn = typing || Math.floor(tMs / 500) % 2 === 0;

  const shown = lines.filter((l) => tMs >= l.atMs);
  const color = (t?: string) =>
    t === "accent" ? T.accent : t === "muted" ? T.fgMuted : t === "dim" ? T.fgDim : T.fg;

  // the push: hold the whole real window, then move in on the prompt row so the
  // sentence is readable on a phone without a single size being changed
  const pz = push
    ? interpolate(tMs, [push.atMs, push.atMs + (push.ms ?? 600)], [1, push.scale ?? 1.75], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })
    : 1;
  const ox = push?.ox ?? 0;
  const oy = push?.oy ?? 380;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: T.windowBody }}>
      <div
        style={{
          position: "absolute", left: 0, top: 0, width: W, height: H,
          transform: `scale(${stage})`, transformOrigin: "top left",
        }}
      >
        <div style={{ width: W, height: H, transform: `scale(${pz})`, transformOrigin: `${ox}px ${oy}px` }}>
          <div style={{ height: BAR, background: T.windowBar, display: "flex", alignItems: "center", gap: 8, paddingLeft: 16, flexShrink: 0 }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
            ))}
          </div>

          <div style={{ height: H - BAR, position: "relative", padding: 28, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
            {mode === "welcome" && <div style={{ position: "relative", border: `1px dashed ${T.accent}`, borderRadius: 6, padding: "28px 24px 24px" }}>
              <span style={{ position: "absolute", top: -11, left: 22, padding: "0 10px", background: T.windowBody, color: T.accent, fontFamily: MONO, fontSize: 16, fontWeight: 700 }}>
                {title}
              </span>
              <div style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ width: "42%", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16, paddingRight: 24, boxSizing: "border-box" }}>
                  <div style={{ fontFamily: MONO, fontSize: 20, color: T.fg }}>
                    {userName ? `Welcome back ${userName}!` : "Welcome back!"}
                  </div>
                  <div style={{ alignSelf: "center" }}><Mascot /></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontFamily: MONO, fontSize: 15, color: T.fgMuted }}>{model}</div>
                    <div style={{ fontFamily: MONO, fontSize: 15, color: T.fgMuted }}>{cwd}</div>
                  </div>
                </div>
                <div style={{ width: "58%", borderLeft: `1px dashed ${T.accent}`, paddingLeft: 24, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
                  <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: T.accent, marginBottom: 10 }}>What's new</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {whatsNew.map((l) => (
                      <div key={l} style={{ fontFamily: MONO, fontSize: 14, color: T.fg }}>{l}</div>
                    ))}
                    <div style={{ fontFamily: MONO, fontSize: 14, color: T.fgDim }}>... /help for more</div>
                  </div>
                </div>
              </div>
            </div>}

            {mode === "welcome" && <div style={{ height: 32 }} />}

            <div>
              {mode === "welcome" && <div style={{ height: 1, background: T.fgDim, opacity: 0.4, marginBottom: 16 }} />}
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", fontFamily: MONO, fontSize: 17, whiteSpace: "pre" }}>
                <span style={{ color: T.fgMuted }}>{"> "}</span>
                <span style={{ color: T.fg }}>{promptText}</span>
                <span style={{ display: "inline-block", width: 11, height: 22, borderRadius: 1, marginLeft: 2, background: T.fg, opacity: caretOn ? 0.55 : 0 }} />
              </div>
            </div>

            {/* what the run prints under the line you sent, the way a terminal flows */}
            {shown.length > 0 && (
              <div style={{ marginTop: mode === "session" ? 18 : 22, display: "flex", flexDirection: "column", gap: 4 }}>
                {shown.map((l, i) => {
                  const bullet = l.text.startsWith("● ");
                  const secs = clockFromMs === undefined ? 0 : Math.max(0, Math.floor((tMs - clockFromMs) / 1000));
                  const right = l.right?.replace("{t}", String(secs));
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "baseline", fontFamily: MONO, fontSize: 16, lineHeight: "24px", color: color(l.tone), whiteSpace: "pre" }}>
                      {bullet && <span style={{ color: T.accent }}>{"● "}</span>}
                      <span>{bullet ? l.text.slice(2) : l.text}</span>
                      {right && <span style={{ marginLeft: "auto", color: T.fgMuted }}>{right}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
