import React from "react";
import { Img, staticFile } from "remotion";
import type { CardProps } from "../props";
import { ACCENT, INK, MONO_FONT, MUTED, LABEL_FONT } from "../theme";
import { at, clamp01, easeIO, easeOut, lerp, swell } from "./CKit";

// reference edit J V5 (kind `ctheft`), the payoff of the story: what the hook took, and where it went.
// Left, the real default locations of the things worth stealing on a Mac, dim, each with the
// mark or the glyph of what owns it. Right, an unlabeled server plate on the end of a dashed
// line. Nothing is typed by a hand: the copies lift off the rows by themselves, stack into one
// bundle, the wallets get hunted by a glass, and the bundle is shot down the line.
//   "copied" 14667        the five credential rows light and a copy lifts off each
//   "credentials," 15567  the five copies stack into one bundle mid-card
//   "searched" 16267      a glass walks down the two wallet rows
//   "wallets," 17614      the wallet rows light terracotta as it passes, their copies join
//   "sent" 18214          the bundle shoots down the dashed line, a transfer bar fills
//   "attackers." 19234    the plate lights terracotta and takes their word as its label

export type CTheftRow = { glyph: "key" | "cloud" | "box" | "wallet" | "mark"; path: string; assetIdx?: number };
export type CTheftData = { rows: CTheftRow[]; hunted: number; label: string; assets?: string[] };

const DIM = 0.42;

const Glyph: React.FC<{ kind: CTheftRow["glyph"]; s: number; color: string }> = ({ kind, s, color }) => {
  const p =
    kind === "key"
      ? ["M9.5 12 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0", "M14.5 12 H21.5", "M17.5 12 V16", "M20.5 12 V15"]
      : kind === "cloud"
      ? ["M6.6 18.5 a4.1 4.1 0 0 1 0.4 -8.2 a5.6 5.6 0 0 1 10.7 1.3 a3.5 3.5 0 0 1 -0.6 6.9 z"]
      : kind === "box"
      ? ["M3.2 7.6 L12 3.4 L20.8 7.6 V16.4 L12 20.6 L3.2 16.4 Z", "M3.2 7.6 L12 11.8 L20.8 7.6", "M12 11.8 V20.6"]
      : ["M3 7.4 h14.4 a2 2 0 0 1 2 2 v7.2 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2 -2 z", "M14.4 12.2 h5.2", "M16.9 12.2 v0.2"];
  return (
    <svg width={38 * s} height={38 * s} viewBox="0 0 24 24" style={{ display: "block" }}>
      <title>{kind}</title>
      {p.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
};

// the copy that lifts off a row: a page, not an icon, so a stack of them reads as a bundle
const Sheet: React.FC<{ s: number }> = ({ s }) => (
  <svg width={46 * s} height={58 * s} viewBox="0 0 46 58" style={{ display: "block" }}>
    <title>copy</title>
    <path d="M1 1 h30 l14 14 v42 h-44 z" fill="#FFFFFF" fillOpacity={0.9} stroke="#FFFFFF" strokeWidth={1.4} />
    <path d="M31 1 v14 h14" fill="none" stroke="#B9C0CA" strokeWidth={1.4} />
    <path d="M8 26 h30 M8 34 h30 M8 42 h20" stroke="#8E96A2" strokeWidth={2.2} strokeLinecap="round" />
  </svg>
);

export const CTheft: React.FC<CardProps & { data: CTheftData }> = ({ tMs, w, h, beats, assets, data }) => {
  const s = w / 1015;
  const PAD = 30 * s;
  const MONO = 26 * s;
  const rows = data.rows;
  const n = rows.length;
  const hunted = data.hunted ?? 2;      // the last rows the glass walks
  const pitch = Math.min(74 * s, (h - 2 * PAD) / n);
  const rowsTop = (h - pitch * n) / 2;
  const rowY = (i: number) => rowsTop + pitch * i + pitch / 2;

  const bCopied = beats.copied ?? 0;
  const bCreds = beats.credentials ?? bCopied + 900;
  const bSearched = beats.searched ?? bCreds + 700;
  const bWallets = beats.wallets ?? bSearched + 1350;
  const bSent = beats.sent ?? bWallets + 600;
  const bAttackers = beats.attackers ?? bSent + 1000;

  const midY = h / 2;
  const bundleX = 612 * s;
  const lineFrom = 665 * s;
  const lineTo = 793 * s;
  const plateX = 795 * s;
  const plateW = 150 * s;
  const plateH = 150 * s;
  const plateCx = plateX + plateW / 2;
  const spawnX = 530 * s;

  // the glass: down to the first wallet row on "wallets,", then on to the second
  const gA = easeIO(at(tMs, bSearched, bWallets - bSearched));
  const gB = easeOut(at(tMs, bWallets, 140));
  const glassY = lerp(rowY(n - hunted) - 86 * s, rowY(n - hunted), gA) + (rowY(n - 1) - rowY(n - hunted)) * gB;
  const glassOn = clamp01((tMs - bSearched) / 180) * (1 - clamp01((tMs - (bWallets + 420)) / 220));

  // every row's own clock
  const litAt = (i: number) => (i < n - hunted ? bCopied + i * 40 : bWallets + (i - (n - hunted)) * 140);
  const isWallet = (i: number) => i >= n - hunted;
  const flyAt = (i: number) => (i < n - hunted ? bCreds + i * 50 : litAt(i) + 90);
  const flyMs = (i: number) => (i < n - hunted ? 500 : 380);

  // the whole bundle leaves on "sent"
  const travel = easeIO(at(tMs, bSent, 520));
  const barK = easeOut(at(tMs, bSent, 880));
  const plateK = easeOut(at(tMs, bAttackers, 220));
  const labelK = easeOut(at(tMs, bAttackers + 40, 240));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* the files, where they really live */}
      {rows.map((r, i) => {
        const k = easeOut(at(tMs, litAt(i), 240));
        const acc = isWallet(i) ? k : 0;
        const white = isWallet(i) ? 1 - k : 1;   // a credential row is dim before its beat, never glyph-less
        const op = DIM + (1 - DIM) * k;
        const y = rowY(i);
        return (
          <div key={r.path} style={{ position: "absolute", left: PAD, top: y - pitch / 2, height: pitch, display: "flex", alignItems: "center", gap: 18 * s }}>
            <div style={{ position: "relative", width: 38 * s, height: 38 * s, opacity: op }}>
              {r.glyph === "mark" ? (
                <Img
                  src={staticFile(assets[r.assetIdx ?? 0])}
                  style={{ position: "absolute", left: 3 * s, top: 3 * s, width: 32 * s, height: 32 * s, objectFit: "contain" }}
                />
              ) : (
                <>
                  <div style={{ position: "absolute", inset: 0, opacity: white }}><Glyph kind={r.glyph} s={s} color={INK} /></div>
                  <div style={{ position: "absolute", inset: 0, opacity: acc }}><Glyph kind={r.glyph} s={s} color={ACCENT} /></div>
                </>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ fontFamily: MONO_FONT, fontSize: MONO, color: INK, whiteSpace: "pre", opacity: op * (isWallet(i) ? 1 - k : 1) }}>{r.path}</span>
              <span style={{ position: "absolute", left: 0, top: 0, fontFamily: MONO_FONT, fontSize: MONO, color: ACCENT, whiteSpace: "pre", opacity: acc }}>{r.path}</span>
            </div>
          </div>
        );
      })}

      {/* the glass that hunts the wallets */}
      {tMs >= bSearched && (
        <div style={{ position: "absolute", left: 330 * s, top: glassY - 43 * s, opacity: glassOn }}>
          <svg width={86 * s} height={86 * s} viewBox="0 0 68 68" style={{ display: "block" }}>
            <title>searching</title>
            <circle cx={28} cy={28} r={20} fill="#FFFFFF" fillOpacity={0.07} stroke={INK} strokeWidth={3} />
            <path d="M42 42 L58 58" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* the line out, and the transfer under it */}
      <div style={{ position: "absolute", left: lineFrom, top: midY - 1 * s, width: lineTo - lineFrom, height: 2 * s, backgroundImage: `repeating-linear-gradient(90deg, ${MUTED} 0 ${10 * s}px, transparent ${10 * s}px ${20 * s}px)`, opacity: 0.7 }} />
      <div style={{ position: "absolute", left: lineFrom, top: midY + 20 * s, width: (lineTo - lineFrom) * barK, height: 6 * s, backgroundColor: ACCENT }} />

      {/* the copies: off the rows, into one bundle, down the line */}
      {rows.map((r, i) => {
        const app = easeOut(at(tMs, litAt(i), 260));
        if (app <= 0) return null;
        const f = easeIO(at(tMs, flyAt(i), flyMs(i)));
        const bx = bundleX + (i - (n - 1) / 2) * 7 * s;
        const by = midY - (i - (n - 1) / 2) * 8 * s;
        const rot = ((i % 3) - 1) * 5;
        const x = lerp(spawnX, bx, f) + (plateCx - bundleX) * travel;
        const y = lerp(rowY(i) - 16 * s * app, by, f);
        const sc = lerp(1, 0.55, travel) * lerp(0.9, 1, app);
        const gone = clamp01((travel - 0.72) / 0.28);
        return (
          <div
            key={`c${r.path}`}
            style={{
              position: "absolute", left: x, top: y - 29 * s,
              transform: `scale(${sc}) rotate(${rot * f}deg)`, transformOrigin: "50% 50%",
              opacity: (0.55 + 0.4 * f) * app * (1 - gone),
            }}
          >
            <Sheet s={s} />
          </div>
        );
      })}

      {/* where it all went */}
      <div style={{ position: "absolute", left: plateX, top: midY - plateH / 2, width: plateW, height: plateH }}>
        <div style={{ position: "absolute", inset: 0, backgroundColor: "#16181D", border: `${2 * s}px solid ${MUTED}`, opacity: 1 - plateK }} />
        <div style={{ position: "absolute", inset: 0, backgroundColor: "#2A1712", border: `${2 * s}px solid ${ACCENT}`, opacity: plateK }} />
        {[0, 1, 2].map((k) => (
          <div key={k} style={{ position: "absolute", left: 20 * s, top: (34 + k * 38) * s, width: plateW - 40 * s, height: 20 * s, border: `${1.6 * s}px solid ${k === 0 ? (plateK > 0 ? ACCENT : MUTED) : MUTED}`, opacity: k === 0 ? 1 : 0.55 }} />
        ))}
        <div style={{ position: "absolute", right: 26 * s, bottom: 18 * s, width: 9 * s, height: 9 * s, borderRadius: "50%", backgroundColor: ACCENT, opacity: 0.3 + 0.7 * plateK * (0.6 + 0.4 * swell(at(tMs, bAttackers, 700))) }} />
      </div>
      <div
        style={{
          position: "absolute", left: plateX + plateW / 2 - 170 * s, top: midY + plateH / 2 + 20 * s,
          width: 340 * s, textAlign: "center",
          fontFamily: LABEL_FONT, fontSize: 32 * s, letterSpacing: "0.09em", textTransform: "uppercase",
          color: ACCENT, opacity: labelK, transform: `translateY(${(1 - labelK) * 12 * s}px)`,
        }}
      >
        {data.label}
      </div>
    </div>
  );
};
