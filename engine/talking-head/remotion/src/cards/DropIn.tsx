import React from "react";
import { Img, interpolate, spring, staticFile } from "remotion";
import type { CardProps } from "./props";
import { MONO_FONT } from "./theme";
import {
  ArrowUp, Chevron, ChipGlyph, Folder, Mic, Plus, Pointer,
  BTN_LINE, FG, FG_MUTED, FG_PLACEHOLDER, GPT_CHIP, GPT_INPUT, GPT_MUTED, GPT_PAGE,
  HAIRLINE, PAGE, SANS, SEND_BG, SURFACE,
} from "./DropInParts";

// "ONCE YOU GET THEM you SIMPLY DROP them into CLAUDE OR CHATGPT." - the real
// folder that ships as the product, dragged by a real pointer into Claude's real
// composer, where it becomes attachment chips with the pack's real filenames.
// On OR one horizontal wipe takes the same chips onto ChatGPT's composer. The
// composer grows upward as the files land, the way it really does.

export type DropInData = { folder: string; chips: string[] };

const DESIGN_W = 1015;
const DESIGN_H = 576;
const STAGE_W = 940;          // the page the composer is drawn on
const COMPOSER_W = 860;
const RADIUS = 24;
const PROMPT_FS = 23;
const CHIP_FS = 25;
const CHIP_H = 48;
const CHIP_GAP = 13;
const CHIP_PAD_T = 22;
const CHIP_PAD_B = 8;
const PROMPT_H = 104;
const PROMPT_PAD_Y = 24;
const CTRL = 40;
const WIPE_MS = 240;

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const p01 = (t: number) => Math.min(1, Math.max(0, t));
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Surface = { dark: boolean; mark: string };

export const DropIn: React.FC<CardProps & { data: DropInData }> = ({
  tMs, w, h, fps, fromMs, beats, assets, data,
}) => {
  const k = Math.min(w / DESIGN_W, h / DESIGN_H);
  const scale = (DESIGN_W * k) / STAGE_W;
  const H = (DESIGN_H * k) / scale;
  const SIDE = (STAGE_W - COMPOSER_W) / 2;

  const b = beats as Record<string, number>;
  const tOnce = b.once ?? fromMs;
  const tGet = b.get ?? tOnce + 420;
  const tSimply = b.simply ?? tGet + 540;
  const tDrop = b.drop ?? tSimply + 420;
  const tClaude = b.claude ?? tDrop + 660;
  const tOr = b.or ?? tClaude + 420;

  const sp = (ms: number, damping = 13) =>
    spring({ frame: Math.max(0, ((tMs - ms) / 1000) * fps), fps, config: { damping, stiffness: 320, mass: 0.7 } });

  // the composer grows upward as the files land; its foot never moves
  const chipRows = 2;
  const chipsH = CHIP_PAD_T + chipRows * CHIP_H + (chipRows - 1) * CHIP_GAP + CHIP_PAD_B;
  const bodyH = 2 + PROMPT_PAD_Y * 2 + PROMPT_H + (14 * 2 + CTRL);
  const attach = interpolate(tMs, [tDrop, tDrop + 200], [0, 1], { ...clamp, easing: easeIO });
  const compH = bodyH + chipsH * attach;
  const compBottom = H - 30;
  const compTop = compBottom - compH;

  // the folder: it sits, is picked up, is carried down, and is let go exactly
  // where the first chip is about to be, so the two cross without a stray frame
  const FOLD_W = 138;
  const restX = STAGE_W / 2 - FOLD_W / 2;
  const restY = 40;
  const dropX = SIDE + 40;
  const dropY = compBottom - (bodyH + chipsH) + 24;
  const carry = interpolate(tMs, [tSimply, tDrop], [0, 1], { ...clamp, easing: easeIO });
  const lift = interpolate(tMs, [tGet, tGet + 220], [0, 1], clamp);
  const gone = interpolate(tMs, [tDrop, tDrop + 110], [0, 1], clamp);
  const placeholder = interpolate(tMs, [tDrop, tDrop + 140], [1, 0], clamp);
  const fx = restX + (dropX - restX) * carry;
  const fy = restY + (dropY - restY) * carry - 10 * lift * (1 - carry);
  const folderScale = (1 + 0.06 * lift) * (1 - 0.72 * gone);

  // the pointer arrives on GET and rides the folder down
  const pIn = sp(tGet, 15);
  const px = fx + FOLD_W * 0.56;
  const py = fy + FOLD_W * 0.40 + (1 - pIn) * -70;

  // the Claude mark at the composer's head lights on its own name
  const litP = p01((tMs - tClaude) / 420);
  const litMark = tMs >= tClaude ? 0.45 + 0.55 * Math.min(1, litP * 3) : 0.45;
  const markPulse = tMs >= tClaude ? Math.sin(Math.PI * litP) * 0.22 : 0;

  // one horizontal wipe, left to right
  const wipe = interpolate(tMs, [tOr, tOr + WIPE_MS], [0, 1], { ...clamp, easing: easeIO });

  const chips = (s: Surface) => (
    <div style={{ height: chipsH * attach, overflow: "hidden", opacity: Math.min(1, attach * 1.6) }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: CHIP_GAP, padding: `${CHIP_PAD_T}px 26px ${CHIP_PAD_B}px 26px` }}>
      {data.chips.map((name, i) => {
        const dir = name.endsWith("/");
        const cs = sp(tDrop + 190 + i * 45, 12); // the box finishes growing, then the files land in it
        return (
          <div
            key={name}
            style={{
              height: CHIP_H, display: "flex", alignItems: "center", gap: 10,
              padding: "0 16px", boxSizing: "border-box", borderRadius: 10,
              backgroundColor: s.dark ? GPT_CHIP : "#F0EEE7",
              border: s.dark ? "none" : `1px solid ${BTN_LINE}`,
              transform: `scale(${0.72 + 0.28 * cs})`, opacity: Math.min(1, cs * 3),
            }}
          >
            <ChipGlyph size={24} color={s.dark ? "#FFFFFF" : FG} dir={dir} />
            <span style={{ fontFamily: MONO_FONT, fontSize: CHIP_FS, color: s.dark ? "#FFFFFF" : FG, whiteSpace: "nowrap" }}>
              {dir ? name.slice(0, -1) : name}
            </span>
          </div>
        );
      })}
      </div>
    </div>
  );

  const composer = (s: Surface) => (
    <div
      style={{
        position: "absolute", left: SIDE, top: compTop, width: COMPOSER_W, height: compH,
        boxSizing: "border-box", backgroundColor: s.dark ? GPT_INPUT : SURFACE,
        border: s.dark ? "none" : `1px solid ${HAIRLINE}`, borderRadius: RADIUS,
        boxShadow: s.dark ? "none" : "0 8px 30px -12px rgba(31,30,29,0.12)", overflow: "hidden",
      }}
    >
      {chips(s)}
      <div style={{ padding: `${PROMPT_PAD_Y}px 26px`, boxSizing: "content-box" }}>
        <div style={{ height: PROMPT_H, position: "relative", fontSize: PROMPT_FS, lineHeight: 1.3, color: s.dark ? GPT_MUTED : FG_PLACEHOLDER, fontFamily: SANS }}>
          <span style={{ position: "absolute", left: 0, top: 0, opacity: placeholder, whiteSpace: "nowrap" }}>
            How can I help you today?
          </span>
          <span
            style={{
              position: "absolute", left: 0, top: 2, width: 2, height: 26,
              backgroundColor: s.dark ? "#FFFFFF" : FG,
              opacity: placeholder < 0.02 && Math.floor(tMs / 480) % 2 === 0 ? 1 : 0,
            }}
          />
        </div>
      </div>
      <div style={{ padding: `14px 18px`, boxSizing: "content-box", height: CTRL, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: "50%", boxSizing: "border-box",
            border: `1px solid ${s.dark ? "#5A5A5A" : BTN_LINE}`, display: "flex",
            alignItems: "center", justifyContent: "center",
            backgroundColor: s.dark ? "transparent" : SURFACE,
          }}
        >
          <Plus color={s.dark ? "#FFFFFF" : FG} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: SANS, fontSize: 18, fontWeight: 500, color: s.dark ? "#FFFFFF" : FG, whiteSpace: "nowrap" }}>
            {s.dark ? "ChatGPT 5" : "Claude Sonnet 4.5"}
          </span>
          <Chevron color={s.dark ? GPT_MUTED : FG_MUTED} />
          <div
            style={{
              width: 36, height: 36, borderRadius: "50%", boxSizing: "border-box", marginLeft: 6,
              border: `1px solid ${s.dark ? "#5A5A5A" : BTN_LINE}`, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Mic color={s.dark ? "#FFFFFF" : FG} />
          </div>
          <div
            style={{
              width: CTRL, height: CTRL, borderRadius: s.dark ? "50%" : 10,
              backgroundColor: s.dark ? "#FFFFFF" : SEND_BG,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ArrowUp color={s.dark ? "#000000" : "#FFFFFF"} />
          </div>
        </div>
      </div>
    </div>
  );

  // the product's mark at the composer's head, where the page really carries it
  const MK = 60;
  const mkLeft = SIDE + 2;
  const mkTop = compTop - MK - 20;
  const head = (s: Surface) =>
    s.dark ? (
      <div
        style={{
          position: "absolute", left: mkLeft, top: mkTop, width: MK, height: MK,
          borderRadius: "50%", overflow: "hidden", backgroundColor: "#FFFFFF",
        }}
      >
        <Img src={staticFile(s.mark)} style={{ width: MK, height: MK, display: "block" }} />
      </div>
    ) : (
      <Img
        src={staticFile(s.mark)}
        style={{
          position: "absolute", left: mkLeft, top: mkTop, width: MK, height: MK,
          display: "block", mixBlendMode: "multiply",
          opacity: litMark, transform: `scale(${1 + markPulse})`,
        }}
      />
    );

  const side = (s: Surface) => (
    <div style={{ position: "absolute", left: 0, top: 0, width: STAGE_W, height: H, backgroundColor: s.dark ? GPT_PAGE : PAGE }}>
      {head(s)}
      {composer(s)}
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", backgroundColor: PAGE }}>
      <div
        style={{
          position: "absolute", left: (w - STAGE_W * scale) / 2, top: (h - H * scale) / 2,
          width: STAGE_W, height: H, transform: `scale(${scale})`, transformOrigin: "top left",
        }}
      >
        {side({ dark: false, mark: assets[0] })}

        {/* the folder, and the hand that moves it */}
        {gone < 1 && (
          <div
            style={{
              position: "absolute", left: fx, top: fy, width: FOLD_W,
              transform: `scale(${folderScale}) rotate(${-4 * lift * (1 - gone)}deg)`,
              transformOrigin: "50% 40%", opacity: 1 - gone,
              filter: `drop-shadow(0 ${8 + 14 * lift}px ${10 + 16 * lift}px rgba(31,30,29,${0.16 + 0.14 * lift}))`,
            }}
          >
            <Folder w={FOLD_W} />
            <div
              style={{
                marginTop: 8, width: FOLD_W, textAlign: "center", fontFamily: SANS, fontSize: 26,
                color: FG, whiteSpace: "nowrap",
                // the label lets go before the icon reaches the box, so it never
                // sits on top of the composer's own line
                opacity: Math.max(0, 1 - gone * 2.6) * (1 - p01((carry - 0.55) / 0.35)),
              }}
            >
              {data.folder}
            </div>
          </div>
        )}
        {pIn > 0.01 && gone < 1 && (
          <div style={{ position: "absolute", left: px, top: py, opacity: Math.min(1, pIn * 3) * (1 - gone) }}>
            <Pointer w={26} />
          </div>
        )}

        {/* OR: one wipe, and the same files are on ChatGPT */}
        {wipe > 0 && (
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}>
            {side({ dark: true, mark: assets[1] })}
          </div>
        )}
      </div>
    </div>
  );
};
