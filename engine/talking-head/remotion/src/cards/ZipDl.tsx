import React from "react";
import { interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { ACCENT, LABEL_FONT } from "./theme";
import { Arrow, C, FAVORITES, FinderWindow, SANS, ZipIcon } from "./FinderParts";

// V5, "the third thing you need is an AI editor system": the thing arrives the way
// it really arrives, as a zip in Downloads. It downloads, the creator renames it to the words
// the creator uses while its real name drops underneath, and then the creator asks what the hell it is,
// so Quick Look opens on it and cannot answer. The zip stays a zip until 51 s.

export type ZipDlData = { step: string; file: string; real: string; size: string };

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const p01 = (t: number) => Math.min(1, Math.max(0, t));
const eo = (t: number) => 1 - Math.pow(1 - p01(t), 3);

export const ZipDl: React.FC<CardProps & { data: ZipDlData }> = ({ tMs, w, h, fps, beats, data }) => {
  const toolbarH = Math.round(h * 0.150);
  const statusH = Math.round(h * 0.070);
  const sidebarW = Math.round(w * 0.212);
  const cw = w - sidebarW;
  const ch = h - toolbarH - statusH;

  const { third, need, label, thinking, what, the, hell, settle } = beats;

  const headH = Math.round(h * 0.072);
  const rowH = Math.round(h * 0.200);
  const pad = Math.round(cw * 0.024);
  const nameFs = Math.round(h * 0.062);
  const subFs = Math.round(h * 0.050);
  const colFs = Math.round(h * 0.046);
  const sizeW = Math.round(cw * 0.20);
  const iconS = Math.round(rowH * 0.58);

  // the download, then the bounce that says it has landed
  const prog = eo(p01((tMs - need) / 600));
  const rowIn = spring({ frame: Math.max(0, ((tMs - need) / 1000) * fps), fps, config: { damping: 15, stiffness: 320, mass: 0.7 } });
  const bounce = interpolate(tMs, [need + 600, need + 700, need + 820], [0, 1, 0], clamp);

  // rename: the field lights on their word, then their label types while the real name
  // drops out from under it and greys
  const typeFrom = label + 200;
  const renaming = tMs >= label;
  const typed = data.file.slice(0, Math.floor(p01((tMs - typeFrom) / 650) * data.file.length));
  const dropped = eo(p01((tMs - typeFrom) / 260));
  const hover = interpolate(tMs, [thinking, thinking + 180], [0, 1], clamp);

  // Quick Look opens on the row, and has nothing to show
  const ql = spring({ frame: Math.max(0, ((tMs - what) / 1000) * fps), fps, config: { damping: 17, stiffness: 260, mass: 0.8 } });
  const qw = Math.round(w * 0.63);
  const qh = Math.round(h * 0.70);
  const qx = sidebarW + (cw - qw) / 2;
  const qy = toolbarH + (ch - qh) / 2;
  const qTitleH = Math.round(qh * 0.155);
  const markOp = interpolate(tMs, [the, the + 160], [0, 1], clamp);
  const sk = p01((tMs - hell) / 320);
  const shake = tMs >= hell && sk < 1 ? Math.exp(-5 * sk) * Math.sin(2 * Math.PI * 3.2 * sk) * (qw * 0.026) : 0;

  const rowY = headH;
  const items = tMs >= need ? 1 : 0;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <FinderWindow
        w={w} h={h} toolbarH={toolbarH} statusH={statusH} sidebarW={sidebarW}
        title="Downloads" rows={FAVORITES} selected="Downloads" view={1} lightsX={Math.round(h * 0.13)}
        search={{ text: "", focused: false, caret: false }}
        status={<span style={{ fontFamily: SANS, fontSize: Math.round(h * 0.048), color: C.muted }}>{items} {items === 1 ? "item" : "items"}</span>}
      >
        {/* column header */}
        <div style={{ position: "absolute", left: 0, top: 0, width: cw, height: headH, backgroundColor: C.toolbar, borderBottom: `1px solid ${C.hair}`, boxSizing: "border-box" }}>
          <span style={{ position: "absolute", left: pad, top: "50%", transform: "translateY(-50%)", fontFamily: SANS, fontSize: colFs, fontWeight: 600, color: C.muted }}>Name</span>
          <span style={{ position: "absolute", right: pad, top: "50%", transform: "translateY(-50%)", width: sizeW, textAlign: "right", fontFamily: SANS, fontSize: colFs, fontWeight: 600, color: C.muted }}>Size</span>
          <div style={{ position: "absolute", right: pad + sizeW + pad * 0.6, top: headH * 0.18, width: 1, height: headH * 0.64, backgroundColor: C.hair }} />
        </div>

        {tMs >= need && (
          <div style={{
            position: "absolute", left: 0, top: rowY, width: cw, height: rowH,
            backgroundColor: hover > 0 ? C.hover : "transparent",
            opacity: Math.min(1, rowIn * 3), transform: `translateY(${(1 - rowIn) * -rowH * 0.5}px)`,
          }}>
            <div style={{ position: "absolute", left: pad, top: (rowH - iconS) / 2 - bounce * rowH * 0.16, opacity: prog < 1 ? 0.45 + 0.55 * prog : 1 }}>
              <ZipIcon s={iconS} />
            </div>

            <div style={{ position: "absolute", left: pad + iconS * 0.9, top: Math.round(rowH * 0.17), width: cw - pad * 2 - iconS * 0.9 - sizeW }}>
              <div style={{ position: "relative", height: nameFs * 1.34, display: "flex", alignItems: "center" }}>
                {renaming && (
                  <div style={{ position: "absolute", left: -Math.round(nameFs * 0.22), top: 0, width: Math.max(nameFs * 8, nameFs * 0.6 * Math.max(typed.length, data.real.length) + nameFs), height: nameFs * 1.34, backgroundColor: "#FFFFFF", border: "1px solid #7FAEF2", boxShadow: "0 0 0 3px rgba(90,150,240,0.30)", borderRadius: 5, boxSizing: "border-box" }} />
                )}
                <span style={{
                  position: "relative", fontFamily: SANS, fontSize: nameFs, color: C.ink, whiteSpace: "nowrap",
                  backgroundColor: renaming && tMs < typeFrom ? "#B9D4F7" : "transparent",
                }}>
                  {tMs < typeFrom ? data.real : typed}
                </span>
                {tMs >= typeFrom && tMs < typeFrom + 650 && (
                  <span style={{ position: "relative", width: 2, height: nameFs * 0.92, backgroundColor: C.ink, marginLeft: 2 }} />
                )}
              </div>

              {/* the download bar, then the real name greying out underneath */}
              {tMs < typeFrom ? (
                <div style={{ marginTop: Math.round(rowH * 0.11), width: "56%", height: Math.round(h * 0.014), borderRadius: 99, backgroundColor: "#DCDCDC", opacity: 1 - p01((tMs - need - 600) / 200) }}>
                  <div style={{ width: `${prog * 100}%`, height: "100%", borderRadius: 99, backgroundColor: C.sel }} />
                </div>
              ) : (
                <div style={{ marginTop: Math.round(rowH * 0.06) * dropped, opacity: dropped, fontFamily: SANS, fontSize: subFs, color: C.muted, whiteSpace: "nowrap" }}>
                  {data.real}
                </div>
              )}
            </div>

            <span style={{ position: "absolute", right: pad, top: Math.round(rowH * 0.17) + nameFs * 0.14, width: sizeW, textAlign: "right", fontFamily: SANS, fontSize: nameFs * 0.9, color: C.ink, opacity: prog }}>
              {data.size}
            </span>
          </div>
        )}

        {tMs >= thinking && (
          <div style={{ position: "absolute", left: cw * 0.40, top: rowY + rowH * (0.52 + 0.9 * (1 - hover)), opacity: hover * (1 - Math.min(1, ql)) }}>
            <Arrow size={Math.round(h * 0.105)} />
          </div>
        )}
      </FinderWindow>

      {tMs >= what && (
        <div style={{
          position: "absolute", left: qx, top: qy, width: qw, height: qh,
          transform: `translateX(${shake}px) scale(${0.46 + 0.54 * Math.min(1, ql)})`,
          transformOrigin: `${(sidebarW + cw * 0.22 - qx) / qw * 100}% ${(toolbarH + headH + rowH * 0.5 - qy) / qh * 100}%`,
          opacity: Math.min(1, ql * 3),
          backgroundColor: "#FCFCFC", borderRadius: 14, overflow: "hidden",
          boxShadow: "0 26px 70px rgba(0,0,0,0.42), 0 3px 10px rgba(0,0,0,0.22)",
        }}>
          <div style={{ position: "relative", height: qTitleH, backgroundColor: "#EDEDED", borderBottom: `1px solid ${C.hair}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={qTitleH * 0.38} height={qTitleH * 0.38} viewBox="0 0 20 20" style={{ position: "absolute", left: qTitleH * 0.34 }}>
              <circle cx="10" cy="10" r="9" fill="#D6D6D6" />
              <path d="M6.8 6.8 L13.2 13.2 M13.2 6.8 L6.8 13.2" stroke="#63636A" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: SANS, fontSize: Math.round(qTitleH * 0.46), fontWeight: 600, color: C.ink }}>{data.file}</span>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: qTitleH, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: LABEL_FONT, fontSize: Math.round(qh * 0.54), fontWeight: 700, lineHeight: 1, color: ACCENT, opacity: markOp }}>?</span>
            <span style={{ marginTop: Math.round(qh * 0.06), fontFamily: SANS, fontSize: Math.round(h * 0.050), color: C.muted, opacity: interpolate(tMs, [settle, settle + 240], [0, 1], clamp) }}>
              ZIP archive · {data.size}
            </span>
          </div>
        </div>
      )}

      <div style={{
        position: "absolute", left: 0, top: 0, width: Math.round(h * 0.128), height: Math.round(h * 0.128),
        backgroundColor: ACCENT, display: "flex", alignItems: "center", justifyContent: "center",
        opacity: interpolate(tMs, [third, third + 160], [0, 1], clamp),
      }}>
        <span style={{ fontFamily: LABEL_FONT, fontSize: Math.round(h * 0.082), fontWeight: 700, lineHeight: 1, color: "#FFFFFF" }}>{data.step}</span>
      </div>
    </div>
  );
};
