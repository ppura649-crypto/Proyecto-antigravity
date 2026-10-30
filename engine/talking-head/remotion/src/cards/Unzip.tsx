import React from "react";
import { interpolate, spring } from "remotion";
import type { CardProps } from "./props";
import { Arrow, C, DocIcon, FAVORITES, FinderWindow, FolderIcon, SANS, ZipIcon } from "./FinderParts";

// V12, "So we decided to make them public": the zip from V5, selected in the same
// Downloads window, double-clicked. Archive Utility builds the folder under it, and
// on "public." the folder opens on the REAL tree of the product they sell - the
// names as they are on disk, nothing invented. The reveal is the file listing.

export type UnzipData = {
  zip: string; folder: string; tree: string[]; zipSize?: string; sizes?: Record<string, string>;
};

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const p01 = (t: number) => Math.min(1, Math.max(0, t));
const eo = (t: number) => 1 - Math.pow(1 - p01(t), 3);

export const Unzip: React.FC<CardProps & { data: UnzipData }> = ({ tMs, w, h, fps, fromMs, beats, data }) => {
  const toolbarH = Math.round(h * 0.145);
  const statusH = Math.round(h * 0.067);
  const sidebarW = Math.round(w * 0.212);
  const cw = w - sidebarW;

  const { decided, make, public: pub } = beats as { decided: number; make: number; public: number };

  const headH = Math.round(h * 0.065);
  const rowH = Math.round(h * 0.080);
  const pad = Math.round(cw * 0.024);
  const nameFs = Math.round(h * 0.050);
  const colFs = Math.round(h * 0.044);
  const sizeW = Math.round(cw * 0.19);
  const iconS = Math.round(rowH * 0.82);
  const indent = Math.round(cw * 0.045);

  // two quick presses on the zip
  const tap = (at: number) => interpolate(tMs, [at, at + 50, at + 110, at + 160], [0, 1, 1, 0], clamp);
  const press = Math.max(tap(decided), tap(decided + 170));
  const curOp = interpolate(tMs, [fromMs, fromMs + 120, decided + 380, decided + 520], [0, 1, 1, 0], clamp);

  // Archive Utility: the folder is built under the zip, and completes ON "public."
  const unzipIn = spring({ frame: Math.max(0, ((tMs - make) / 1000) * fps), fps, config: { damping: 16, stiffness: 320, mass: 0.7 } });
  const built = eo(p01((tMs - make) / (pub - make)));
  const open = eo(p01((tMs - pub) / 180));

  const rowsTop = headH;
  const zipY = rowsTop;
  const folderY = rowsTop + rowH;
  const items = tMs >= make ? 2 : 1;

  const Tri: React.FC<{ x: number; y: number; turn: number; on: number }> = ({ x, y, turn, on }) => (
    <svg width={rowH * 0.30} height={rowH * 0.30} viewBox="0 0 12 12" style={{ position: "absolute", left: x, top: y, opacity: on, transform: `rotate(${turn * 90}deg)` }}>
      <path d="M4 2 L9 6 L4 10 Z" fill="#6E6E72" />
    </svg>
  );

  const rowText: React.CSSProperties = { fontFamily: SANS, fontSize: nameFs, color: C.ink, whiteSpace: "nowrap" };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <FinderWindow
        w={w} h={h} toolbarH={toolbarH} statusH={statusH} sidebarW={sidebarW}
        title="Downloads" rows={FAVORITES} selected="Downloads" view={1}
        search={{ text: "", focused: false, caret: false }}
        status={<span style={{ fontFamily: SANS, fontSize: Math.round(h * 0.046), color: C.muted }}>{items} {items === 1 ? "item" : "items"}</span>}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: cw, height: headH, backgroundColor: C.toolbar, borderBottom: `1px solid ${C.hair}`, boxSizing: "border-box" }}>
          <span style={{ position: "absolute", left: pad, top: "50%", transform: "translateY(-50%)", fontFamily: SANS, fontSize: colFs, fontWeight: 600, color: C.muted }}>Name</span>
          <span style={{ position: "absolute", right: pad, top: "50%", transform: "translateY(-50%)", width: sizeW, textAlign: "right", fontFamily: SANS, fontSize: colFs, fontWeight: 600, color: C.muted }}>Size</span>
          <div style={{ position: "absolute", right: pad + sizeW + pad * 0.6, top: headH * 0.18, width: 1, height: headH * 0.64, backgroundColor: C.hair }} />
        </div>

        {/* the zip, selected, being opened */}
        <div style={{ position: "absolute", left: 0, top: zipY, width: cw, height: rowH, backgroundColor: press > 0.5 ? "#0A55B8" : C.sel }}>
          <div style={{ position: "absolute", left: pad + indent * 0.1, top: (rowH - iconS) / 2, transform: `scale(${1 - 0.10 * press})`, transformOrigin: "50% 50%" }}>
            <ZipIcon s={iconS} />
          </div>
          <span style={{ ...rowText, position: "absolute", left: pad + indent * 0.1 + iconS * 0.95, top: "50%", transform: "translateY(-50%)", color: "#FFFFFF" }}>{data.zip}</span>
          <span style={{ ...rowText, position: "absolute", right: pad, top: "50%", transform: "translateY(-50%)", width: sizeW, textAlign: "right", color: "#FFFFFF" }}>{data.zipSize ?? ""}</span>
        </div>

        {/* Archive Utility building the folder, then the folder itself */}
        {tMs >= make && (
          <div style={{ position: "absolute", left: 0, top: folderY, width: cw, height: rowH, opacity: Math.min(1, unzipIn * 3), transform: `translateY(${(1 - unzipIn) * -rowH * 0.4}px)` }}>
            <Tri x={pad} y={(rowH - rowH * 0.30) / 2} turn={open} on={built} />
            <div style={{ position: "absolute", left: pad + indent * 0.55, top: (rowH - iconS * 0.82) / 2, opacity: 0.4 + 0.6 * built }}>
              <FolderIcon s={iconS * 1.05} />
            </div>
            <span style={{ ...rowText, position: "absolute", left: pad + indent * 0.55 + iconS * 1.18, top: "50%", transform: "translateY(-50%)", opacity: 0.45 + 0.55 * built }}>{data.folder}</span>
            {built < 1 && (
              <div style={{ position: "absolute", right: pad, top: "50%", marginTop: -Math.round(h * 0.007), width: sizeW, height: Math.round(h * 0.014), borderRadius: 99, backgroundColor: "#DCDCDC" }}>
                <div style={{ width: `${built * 100}%`, height: "100%", borderRadius: 99, backgroundColor: C.sel }} />
              </div>
            )}
            {built >= 1 && (
              <span style={{ ...rowText, position: "absolute", right: pad, top: "50%", transform: "translateY(-50%)", width: sizeW, textAlign: "right", color: C.muted }}>--</span>
            )}
          </div>
        )}

        {/* the real tree, landing top to bottom */}
        {data.tree.map((raw, k) => {
          const at = pub + k * 45;
          const f = eo(p01((tMs - at) / 170));
          if (f <= 0.001) return null;
          const dir = raw.endsWith("/");
          const name = dir ? raw.slice(0, -1) : raw;
          const y = folderY + (k + 1) * rowH;
          return (
            <div key={raw} style={{ position: "absolute", left: 0, top: y, width: cw, height: rowH, opacity: f, transform: `translateY(${(1 - f) * -rowH * 0.55}px)` }}>
              {dir && <Tri x={pad + indent} y={(rowH - rowH * 0.30) / 2} turn={0} on={1} />}
              <div style={{ position: "absolute", left: pad + indent * 1.55, top: (rowH - iconS * (dir ? 0.82 : 1)) / 2 }}>
                {dir ? <FolderIcon s={iconS * 1.05} /> : <DocIcon s={iconS} />}
              </div>
              <span style={{ ...rowText, position: "absolute", left: pad + indent * 1.55 + iconS * 1.18, top: "50%", transform: "translateY(-50%)" }}>{name}</span>
              <span style={{ ...rowText, position: "absolute", right: pad, top: "50%", transform: "translateY(-50%)", width: sizeW, textAlign: "right", color: C.muted }}>
                {data.sizes?.[raw] ?? "--"}
              </span>
            </div>
          );
        })}

        {curOp > 0.01 && (
          <div style={{ position: "absolute", left: cw * 0.36, top: zipY + rowH * 0.58, opacity: curOp, transform: `scale(${1 - 0.12 * press})`, transformOrigin: "0 0" }}>
            <Arrow size={Math.round(h * 0.100)} />
          </div>
        )}
      </FinderWindow>
    </div>
  );
};
