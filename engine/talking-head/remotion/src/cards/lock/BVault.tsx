import React from "react";
import type { CardProps } from "../props";
import { LABEL_FONT } from "../theme";
import {
  BFolderBack, BFolderFlap, BCheck, BPage, FOLDER_R,
  clamp01, easeOut, easeIO, easeBack, at, mono, INK, MUTED, ACCENT, MONO_FONT,
} from "./BShared";

// V14 "then it reviews them once, and keeps all their fingerprints outside the project."
// The folder stands open with its three files in it. A scan walks each one and ticks it, a
// strip prints under each name and fills with its real sha256, then the three strips detach,
// fly right and post themselves into a vault labelled with the real state path. The vault
// shuts. The record lives outside the thing it describes.

export type VaultData = {
  step?: string;
  vault?: string;
  files?: { file: string; hash: string }[];
};

const FOLD_W = 380, FOLD_X = 40, FOLD_Y = 310;
const CHIP_W = 336, CHIP_BOTTOM = 425;
const CHIP_TOP = [139, 217, 295];
const CHIP_X = [84, 102, 120];
const VAULT_X = 580, VAULT_Y = 150, VAULT_S = 320;
const SLOT_CX = VAULT_X + 160, SLOT_CY = VAULT_Y + 94;

const Vault: React.FC<{ k: number; shut: number }> = ({ k, shut }) => {
  const P = (v: number) => v * k;
  const s = easeIO(shut);
  const dial = easeIO(shut) * 152;
  return (
    <svg width={P(VAULT_S)} height={P(VAULT_S)} viewBox="0 0 320 320" style={{ display: "block" }}>
      <title>vault</title>
      <defs>
        <linearGradient id="bvbody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2E333A" /><stop offset="1" stopColor="#1E2228" />
        </linearGradient>
        <clipPath id="bvslot"><rect x={70} y={84} width={180} height={22} /></clipPath>
      </defs>
      <rect x={2} y={2} width={316} height={316} fill="url(#bvbody)" stroke="#5A616A" strokeWidth={4} />
      {/* hinges on the left edge, the door inset on the right */}
      <rect x={8} y={54} width={16} height={46} fill="#7C838C" />
      <rect x={8} y={220} width={16} height={46} fill="#7C838C" />
      <rect x={30} y={22} width={268} height={276} fill="#171A1F" stroke="#434A53" strokeWidth={3} />
      {[[54, 46], [274, 46], [54, 274], [274, 274]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={7} fill="#8E959D" />
      ))}
      {/* the deposit slot, and the bolt that slides over it */}
      <rect x={70} y={84} width={180} height={22} fill="#06070A" stroke="#5A616A" strokeWidth={2} />
      <g clipPath="url(#bvslot)">
        <rect x={70 - 186 * (1 - s)} y={84} width={180} height={22} fill="#9AA1A9" />
      </g>
      {/* the dial, which turns when it shuts */}
      <g transform={`rotate(${dial} 164 206)`}>
        <circle cx={164} cy={206} r={54} fill="#2B3037" stroke="#A6ADB5" strokeWidth={5} />
        <line x1={164} y1={158} x2={164} y2={254} stroke="#C9CFD8" strokeWidth={7} strokeLinecap="round" />
        <line x1={116} y1={206} x2={212} y2={206} stroke="#C9CFD8" strokeWidth={7} strokeLinecap="round" />
        <circle cx={164} cy={206} r={11} fill="#C9CFD8" />
      </g>
    </svg>
  );
};

export const BVault: React.FC<CardProps & { data: VaultData }> = ({ tMs, w, beats, data }) => {
  const k = w / 972;
  const P = (v: number) => v * k;
  const step = data.step ?? "2";
  const vaultPath = data.vault ?? "~/.agent-lock";
  const files = data.files ?? [
    { file: "settings.json", hash: "dd09…2d11" },
    { file: "tasks.json", hash: "9273…6e1f" },
    { file: ".mcp.json", hash: "d8e3…de02" },
  ];

  const bReviews = beats.reviews ?? 48676;
  const bKeep = beats.keep ?? 49962;
  const bPrints = beats.fingerprints ?? 50622;
  const bOutside = beats.outside ?? 51462;
  const bProject = beats.project ?? 52122;

  const foldH = FOLD_W * FOLDER_R;
  const shut = at(tMs, bProject, 300);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Creator Format 1's structure numeral */}
      <div
        style={{
          position: "absolute", left: P(44), top: P(20),
          fontFamily: LABEL_FONT, fontSize: P(64), color: ACCENT, letterSpacing: "0.04em", lineHeight: 1,
        }}
      >
        {step}
      </div>

      <div style={{ position: "absolute", left: P(FOLD_X), top: P(FOLD_Y), width: P(FOLD_W), height: P(foldH), zIndex: 0 }}>
        <BFolderBack w={P(FOLD_W)} open={1} uid="vault" />
      </div>

      {files.slice(0, 3).map((f, j) => {
        const top = CHIP_TOP[j], x = CHIP_X[j];
        const visH = (j < 2 ? CHIP_TOP[j + 1] : CHIP_BOTTOM) - top;
        const scanAt = bReviews + j * 220;
        const scan = at(tMs, scanAt, 300);
        const tick = easeBack(at(tMs, scanAt + 300, 240));
        const strip = easeOut(at(tMs, bKeep + j * 120, 220));
        const hash = easeOut(at(tMs, bPrints + j * 70, 220));
        const fly = easeIO(at(tMs, bOutside + j * 90, 440));

        // the strip leaves its chip and posts itself into the slot, on a slight arc
        const sx0 = x + 16, sy0 = top + 46;
        const sx1 = SLOT_CX - 144, sy1 = SLOT_CY - 16;
        const sx = sx0 + (sx1 - sx0) * fly;
        const sy = sy0 + (sy1 - sy0) * fly - 46 * Math.sin(Math.PI * fly);
        const ss = 1 - 0.45 * fly;

        return (
          <React.Fragment key={f.file}>
            <div
              style={{
                position: "absolute", left: P(x), top: P(top), width: P(CHIP_W), height: P(CHIP_BOTTOM - top),
                backgroundColor: "#11141A", border: `${Math.max(1, P(1.8))}px solid #2A2F37`, boxSizing: "border-box",
                zIndex: 1 + j, overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", left: P(16), top: P(14), display: "flex", alignItems: "center", gap: P(10) }}>
                <BPage w={P(26)} />
                <span style={{ ...mono(P(28), INK) }}>{f.file}</span>
              </div>
              <div style={{ position: "absolute", left: P(290), top: P(12), opacity: clamp01(tick * 1.4), transform: `scale(${0.4 + 0.6 * tick})` }}>
                <BCheck size={P(32)} />
              </div>
              {/* the scan walking down the part of the file you can see */}
              {scan > 0 && scan < 1 && (
                <div
                  style={{
                    position: "absolute", left: 0, right: 0, top: P(scan * visH), height: P(3),
                    background: "linear-gradient(90deg, rgba(242,242,242,0) 0%, rgba(242,242,242,0.95) 50%, rgba(242,242,242,0) 100%)",
                  }}
                />
              )}
            </div>
            {/* the fingerprint strip: it prints, it fills, it leaves */}
            <div
              style={{
                position: "absolute", left: P(sx), top: P(sy), width: P(288), height: P(32),
                backgroundColor: "#0A0C10", border: `${Math.max(1, P(1.4))}px solid #3A414A`, boxSizing: "border-box",
                transform: `scaleX(${strip}) scale(${ss})`, transformOrigin: "0% 50%",
                opacity: clamp01((1 - fly) * 3),
                zIndex: 10,
                display: "flex", alignItems: "center", paddingLeft: P(8),
              }}
            >
              <span style={{ ...mono(P(26), MUTED), opacity: hash }}>{`sha256 · ${f.hash}`}</span>
            </div>
          </React.Fragment>
        );
      })}

      <div style={{ position: "absolute", left: P(FOLD_X), top: P(FOLD_Y), width: P(FOLD_W), height: P(foldH), zIndex: 4 }}>
        <BFolderFlap w={P(FOLD_W)} open={1} uid="vault" shield={1} angle={34} />
      </div>

      {/* outside the project */}
      <div style={{ position: "absolute", left: P(VAULT_X), top: P(VAULT_Y), zIndex: 6 }}>
        <Vault k={k} shut={shut} />
      </div>
      <div
        style={{
          position: "absolute", left: P(VAULT_X), top: P(VAULT_Y + VAULT_S + 18), width: P(VAULT_S),
          textAlign: "center", fontFamily: MONO_FONT, fontSize: P(28), color: INK, lineHeight: 1, zIndex: 6,
        }}
      >
        {vaultPath}
      </div>
    </div>
  );
};
