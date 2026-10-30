import React from "react";
import type { CardProps } from "../props";
import { Folder } from "../Skills";
import {
  A1Prompt, A1Window, Check, Chevron, KeyCap, T,
  after, clamp01, eIO, eOut, lerp, mix, mono, swell,
} from "./A1Window";

// reference edit J famA1, the two cards where the folder gets its state.
//
// V9 (cctrust) the real Claude Code trust dialog, verbatim, inside the window. The creator clicks yes
//              once, and the whole dialog FOLDS into one small green tag on one folder: the
//              picture of a permission that shrank to a sticker nobody looks at again.
// V10 (ccpull) the same window and the same folder in the same place: a git pull rewrites the
//              file the dialog was about, and the tag does not move. That is the thesis.

// The folder lives at the same window coordinates on both cards, so the cut between them
// reads as the same object with a new line of output above it.
const GX = 212;
const GY = 118;
const FW = 130;
const FH = Math.round(FW * 0.76); // 99
const PILL = { x: GX + 64, y: GY + 56, w: 107, h: 27 };
const NAME_Y = GY + FH + 8;
const STILL_Y = NAME_Y + 28;
const ROW = 22;

// the tag is a SOLID dark pill: a translucent one put green type on the folder's light blue
// and the word disappeared (checked on f1076).
export const pillBg = (glow: number, a = 1): string =>
  `rgba(${Math.round(lerp(18, 40, glow))},${Math.round(lerp(30, 66, glow))},${Math.round(lerp(24, 46, glow))},${0.95 * a})`;

const TagPill: React.FC<{ label: string; chk: number; glow?: number }> = ({ label, chk, glow = 0 }) => (
  <div
    style={{
      width: PILL.w, height: PILL.h, borderRadius: 13, boxSizing: "border-box",
      border: `1px solid ${T.green}`, background: pillBg(glow),
      display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    }}
  >
    <span style={mono(15, T.green)}>{label}</span>
    <div style={{ width: 17, height: 17 }}><Check size={17} color={T.green} p={chk} /></div>
  </div>
);

const FolderGroup: React.FC<{
  name: string; tag: string; born: number; pill: number; chk: number; glow: number; still?: string; stillP?: number;
}> = ({ name, tag, born, pill, chk, glow, still, stillP = 0 }) => (
  <>
    <div
      style={{
        position: "absolute", left: GX, top: GY, width: FW,
        opacity: clamp01(born * 1.6), transform: `scale(${lerp(0.72, 1, born)})`, transformOrigin: "50% 70%",
      }}
    >
      <Folder w={FW} open={0} />
    </div>
    <div style={{ position: "absolute", left: GX + FW / 2 - name.length * 4.8, top: NAME_Y, ...mono(16, T.fg), opacity: clamp01(born * 1.6) }}>
      {name}
    </div>
    {pill > 0 && (
      <div style={{ position: "absolute", left: PILL.x, top: PILL.y, opacity: clamp01(pill * 2), transform: `scale(${1 + 0.1 * glow})`, transformOrigin: "50% 50%" }}>
        <TagPill label={tag} chk={chk} glow={glow} />
      </div>
    )}
    {still && stillP > 0 && (
      <div
        style={{
          position: "absolute", left: PILL.x + PILL.w / 2 - still.length * 4.8, top: STILL_Y,
          ...mono(16, T.fg), opacity: clamp01(stillP * 1.6), transform: `translateY(${(1 - stillP) * 9}px)`,
        }}
      >
        {still}
      </div>
    )}
  </>
);

/* ------------------------------------------------------------ V9 cctrust */

type DRow = { t: string; tone: "fg" | "soft" | "dim" | "muted"; gap?: number; opt?: number };

// verbatim, assets/real/gate-capture.txt, wrapped at the 56 columns this window is wide
const DIALOG: DRow[] = [
  { t: "Do you trust the files in this folder?", tone: "fg", gap: 8 },
  { t: "~/awesome-project", tone: "fg", gap: 8 },
  { t: "Claude Code may read files in this folder. Reading", tone: "soft" },
  { t: "untrusted files may lead Claude Code to behave in", tone: "soft" },
  { t: "unexpected ways.", tone: "soft", gap: 8 },
  { t: "With your permission Claude Code may execute files in", tone: "soft" },
  { t: "this folder. Executing untrusted code is unsafe.", tone: "soft", gap: 8 },
  { t: "https://docs.anthropic.com/s/claude-code-security", tone: "dim", gap: 10 },
  { t: "1. Yes, proceed", tone: "fg", opt: 1 },
  { t: "2. No, exit", tone: "fg", opt: 2, gap: 8 },
  { t: "Enter to confirm · Esc to cancel", tone: "muted" },
];
const DLH = 20;
const BOX_W = 556;
const BOX_PX = 8;
const BOX_PY = 6;

const tops = (): number[] => {
  const out: number[] = [];
  let y = 0;
  for (const r of DIALOG) { out.push(y); y += DLH + (r.gap ?? 0); }
  return out;
};
const TOPS = tops();
const BOX_H = TOPS[TOPS.length - 1] + DLH + 2 * BOX_PY + 2;

export type CcTrustData = { folder?: string; tag?: string };

export const CcTrust: React.FC<CardProps & { data: CcTrustData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const name = data.folder ?? "awesome-project";
  const tag = data.tag ?? "trusted";
  const b = {
    click: beats.click ?? fromMs + 1340,
    once: beats.once ?? fromMs + 1700,
    yes: beats.yes ?? fromMs + 2080,
    when: beats.when ?? fromMs + 3598,
    safe: beats.safe ?? fromMs + 4749,
  };
  const hi = after(tMs, b.click, 200);
  const tap = swell((tMs - b.click) / 260);
  const cnt = after(tMs, b.once, 220);
  const flip = after(tMs, b.yes, 220);
  const f = eIO((tMs - b.when) / 580);
  const chk = after(tMs, b.safe, 300);
  const glow = swell((tMs - b.safe) / 460);
  const optColor = mix(T.fg, T.accent, flip);
  return (
    <A1Window w={w} h={h}>
      {({ W, H }) => {
        const bx = (W - BOX_W) / 2;
        const by = (H - BOX_H) / 2;
        const rx = lerp(bx, PILL.x, f);
        const ry = lerp(by, PILL.y, f);
        const rw = lerp(BOX_W, PILL.w, f);
        const rh = lerp(BOX_H, PILL.h, f);
        const dialogOn = 1 - clamp01((tMs - b.when) / 220);
        const pillOn = clamp01((tMs - b.when - 300) / 240);
        return (
          <>
            {/* the command that raised the dialog: it was always under it, and the fold
                reveals it, so the window is the same window V3, V4 and V10 are */}
            <div style={{ position: "absolute", left: 14, top: 0, opacity: clamp01((tMs - b.when - 180) / 300) }}>
              <A1Prompt text="claude" caret={false} tMs={tMs} px={16} />
            </div>
            <FolderGroup name={name} tag={tag} born={after(tMs, b.when + 160, 400)} pill={0} chk={0} glow={0} />
            <div
              style={{
                position: "absolute", left: rx, top: ry, width: rw, height: rh, boxSizing: "border-box",
                borderRadius: lerp(6, 13, f), border: `1px solid ${mix(T.accent, T.green, f)}`,
                background: pillBg(glow, pillOn), overflow: "hidden",
              }}
            >
              {/* the pill the dialog becomes */}
              {pillOn > 0 && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: pillOn }}>
                  <span style={mono(15, T.green)}>{tag}</span>
                  <div style={{ width: 17, height: 17 }}><Check size={17} color={T.green} p={chk} /></div>
                </div>
              )}
              {/* the dialog itself, verbatim */}
              <div style={{ position: "absolute", left: BOX_PX, top: BOX_PY, width: BOX_W - 2 * BOX_PX - 2, opacity: dialogOn }}>
                <div
                  style={{
                    position: "absolute", left: -BOX_PX + 1, top: TOPS[8] - 2, width: BOX_W - 2,
                    height: DLH + 5, background: "#3E3A33", opacity: hi * (1 - flip * 0.35), borderRadius: 2,
                  }}
                />
                {DIALOG.map((r, i) => {
                  const col = r.opt ? (r.opt === 1 ? optColor : T.fg)
                    : r.tone === "fg" ? T.fg : r.tone === "soft" ? "#C3BFB6" : r.tone === "dim" ? T.dim : T.muted;
                  return (
                    <div key={r.t} style={{ position: "absolute", left: r.opt ? 20 : 0, top: TOPS[i], ...mono(16, col, DLH / 16) }}>
                      {r.t}
                    </div>
                  );
                })}
                {hi > 0 && (
                  <div style={{ position: "absolute", left: 0, top: TOPS[8] + 1, opacity: hi }}>
                    <Chevron size={17} color={optColor} />
                  </div>
                )}
                {cnt > 0 && (
                  <div
                    style={{
                      position: "absolute", left: 20 + 15 * 9.6 + 14, top: TOPS[8],
                      ...mono(15, mix(T.muted, T.accent, flip), DLH / 15),
                      opacity: cnt, transform: `scale(${lerp(1.6, 1, cnt)})`, transformOrigin: "0% 50%",
                    }}
                  >
                    ×1
                  </div>
                )}
                {hi > 0 && (
                  <div style={{ position: "absolute", left: BOX_W - 2 * BOX_PX - 2 - 46, top: TOPS[8] - 3, opacity: hi, transform: `translateY(${tap * 3}px) scale(${1 - tap * 0.07})` }}>
                    <KeyCap w={46} h={26} color={T.fg} bg={T.sel} />
                  </div>
                )}
              </div>
            </div>
          </>
        );
      }}
    </A1Window>
  );
};

/* ------------------------------------------------------------- V10 ccpull */

export type CcPullData = { cmd?: string; out?: string[]; hit?: number; folder?: string; tag?: string; still?: string };

const OUT = [
  "Updating 083a793..7fcabe2",
  "Fast-forward",
  " .claude/settings.json | 2 +-",
  " 1 file changed, 1 insertion(+), 1 deletion(-)",
];

export const CcPull: React.FC<CardProps & { data: CcPullData }> = ({ tMs, w, h, fromMs, beats, data }) => {
  const cmd = data.cmd ?? "git pull";
  const out = data.out ?? OUT;
  const hit = data.hit ?? 2;
  const name = data.folder ?? "awesome-project";
  const tag = data.tag ?? "trusted";
  const still = data.still ?? "still trusted";
  const b = {
    every: beats.every ?? fromMs,
    pull: beats.pull ?? fromMs + 600,
    can: beats.can ?? fromMs + 840,
    those: beats.those ?? fromMs + 1320,
    and: beats.and ?? fromMs + 2220,
    again: beats.again ?? fromMs + 3434,
  };
  const chars = Math.ceil(cmd.length * clamp01((tMs - b.every) / 600));
  const lit = after(tMs, b.those, 220);
  const pulse = swell((tMs - b.and) / 520);
  return (
    <A1Window w={w} h={h}>
      {() => (
        <>
          <div style={{ position: "absolute", left: 14, top: 0 }}>
            <A1Prompt text={cmd.slice(0, chars)} caret={tMs < b.pull} tMs={tMs} px={16} />
          </div>
          {out.map((line, i) => {
            const at = b.can + i * 110;
            const p = clamp01((tMs - at) / 120);
            if (p <= 0) return null;
            const isHit = i === hit;
            return (
              <div key={line} style={{ position: "absolute", left: 14, top: ROW * (i + 1), opacity: p }}>
                <span style={mono(16, isHit ? mix(T.fg, T.accent, lit) : T.fg, ROW / 16)}>{line}</span>
                {isHit && lit > 0 && (
                  <span
                    style={{
                      position: "absolute", left: -14, top: 0, ...mono(16, T.accent, ROW / 16),
                      opacity: lit, transform: `translateY(${(1 - lit) * -8}px)`,
                    }}
                  >
                    ~
                  </span>
                )}
              </div>
            );
          })}
          <FolderGroup
            name={name} tag={tag} born={1} pill={1} chk={1} glow={pulse}
            still={still} stillP={after(tMs, b.again, 260)}
          />
        </>
      )}
    </A1Window>
  );
};
