import React from "react";

// The macOS Finder, drawn for this card's device pixels (edit-g-b V4 / V5 / V12).
// Three cards stand on this file: the FOOTAGE folder in icon view, the Downloads
// list with the zip, and the same list unzipping into the product's real tree. The
// grammar is Finder's own - traffic lights on the sidebar material, a unified
// toolbar with the view control and the search field, a Favorites sidebar, a
// column header, a status bar - but every size is set from the card, never
// inherited from a screenshot's scale.

export const SANS = '-apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif';

export const C = {
  sidebar: "#E9E9E9",
  toolbar: "#F6F6F6",
  content: "#FFFFFF",
  hair: "#D6D6D6",
  ink: "#1F1E1D",
  muted: "#73726C",
  dim: "#A3A29B",
  glyph: "#4B8DF0",
  sel: "#0B63D6",
  hover: "#F1F1F1",
  page: "#FDFDFD",
};

export type GlyphKind = "airdrop" | "recents" | "apps" | "desktop" | "docs" | "downloads" | "folder";
export type SidebarRow = { name: string; icon: GlyphKind };

export const FAVORITES: SidebarRow[] = [
  { name: "AirDrop", icon: "airdrop" },
  { name: "Recents", icon: "recents" },
  { name: "Applications", icon: "apps" },
  { name: "Desktop", icon: "desktop" },
  { name: "Documents", icon: "docs" },
  { name: "Downloads", icon: "downloads" },
];

const G: React.FC<{ kind: GlyphKind; s: number }> = ({ kind, s }) => {
  const p = { stroke: C.glyph, strokeWidth: 1.6, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ display: "block", flex: "none" }}>
      {kind === "airdrop" && (<>
        <circle cx={10} cy={10} r={7.4} {...p} /><path d="M6.6 12.2 A5 5 0 0 1 13.4 12.2" {...p} /><circle cx={10} cy={8.4} r={1.5} fill={C.glyph} />
      </>)}
      {kind === "recents" && (<><circle cx={10} cy={10} r={7.4} {...p} /><path d="M10 5.6 V10 L13 12" {...p} /></>)}
      {kind === "apps" && (<><rect x={3.2} y={3.2} width={5.6} height={5.6} rx={1.4} {...p} /><rect x={11.2} y={3.2} width={5.6} height={5.6} rx={1.4} {...p} /><rect x={3.2} y={11.2} width={5.6} height={5.6} rx={1.4} {...p} /><rect x={11.2} y={11.2} width={5.6} height={5.6} rx={1.4} {...p} /></>)}
      {kind === "desktop" && (<><rect x={2.4} y={4} width={15.2} height={10} rx={1.6} {...p} /><path d="M7 17 h6" {...p} /></>)}
      {kind === "docs" && (<><path d="M5 2.8 h6.4 L15 6.4 V17.2 H5 Z" {...p} /><path d="M11.2 2.8 V6.6 H15" {...p} /></>)}
      {kind === "downloads" && (<><circle cx={10} cy={10} r={7.4} {...p} /><path d="M10 6 V13 M6.8 10 L10 13.2 L13.2 10" {...p} /></>)}
      {kind === "folder" && (<path d="M2.6 6 a1.6 1.6 0 0 1 1.6 -1.6 h3.4 l1.5 1.6 h6.3 a1.6 1.6 0 0 1 1.6 1.6 v7 a1.6 1.6 0 0 1 -1.6 1.6 H4.2 a1.6 1.6 0 0 1 -1.6 -1.6 Z" fill={C.glyph} />)}
    </svg>
  );
};

// the arrow, tip at (0,0)
export const Arrow: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size * 14 / 22} height={size} viewBox="0 0 14 22" style={{ display: "block", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))" }}>
    <path d="M1 1 L1 19.4 L5.4 15.3 L8.2 21.2 L11.1 19.9 L8.4 14.1 L13.5 13.9 Z" fill="#FFFFFF" stroke="#141414" strokeWidth={1.15} strokeLinejoin="round" />
  </svg>
);

// a vertical video's Finder icon: the frame itself, white-bordered, with the
// film badge that says .mov. Grey when the file has no preview yet.
export const MovIcon: React.FC<{ w: number; real: number; children?: React.ReactNode }> = ({ w, real, children }) => {
  const h = Math.round(w * 16 / 9);
  const b = Math.max(2, Math.round(w * 0.028));
  const badge = Math.round(w * 0.30);
  return (
    <div style={{ position: "relative", width: w, height: h, filter: "drop-shadow(0 5px 10px rgba(31,30,29,0.28))" }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "#FFFFFF" }} />
      <div style={{ position: "absolute", left: b, top: b, right: b, bottom: b, overflow: "hidden", backgroundColor: "#C6C6C6" }}>
        <svg width="100%" height="100%" viewBox="0 0 90 160" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, opacity: 1 - real }}>
          <rect width="90" height="160" fill="#C6C6C6" />
          <path d="M0 118 L26 86 L48 112 L64 96 L90 128 L90 160 L0 160 Z" fill="#B2B2B2" />
          <circle cx="64" cy="44" r="11" fill="#B2B2B2" />
        </svg>
        <div style={{ position: "absolute", inset: 0, opacity: real }}>{children}</div>
      </div>
      <svg width={badge} height={badge} viewBox="0 0 24 24" style={{ position: "absolute", left: -badge * 0.16, bottom: -badge * 0.16, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))" }}>
        <rect x="1.5" y="4.5" width="21" height="15" rx="2.4" fill="#2B2B2E" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={3.6 + i * 4.6} y="6.4" width="2.6" height="2.4" rx="0.5" fill="#F2F2F2" />
            <rect x={3.6 + i * 4.6} y="15.2" width="2.6" height="2.4" rx="0.5" fill="#F2F2F2" />
          </g>
        ))}
        <rect x="3.3" y="9.6" width="17.4" height="4.8" rx="0.8" fill="#F2F2F2" />
      </svg>
    </div>
  );
};

export const FolderIcon: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={Math.round(s * 0.78)} viewBox="0 0 200 156" style={{ display: "block", flex: "none" }}>
    <path d="M4,32 a12,12 0 0 1 12,-12 h58 a8,8 0 0 1 5.6,2.3 l9,9 a8,8 0 0 0 5.6,2.3 h89.8 a12,12 0 0 1 12,12 v96 a12,12 0 0 1 -12,12 h-168 a12,12 0 0 1 -12,-12 z" fill="#3C86DB" />
    <path d="M4,64 a7,7 0 0 1 7,-7 h178 a7,7 0 0 1 7,7 v78 a12,12 0 0 1 -12,12 h-168 a12,12 0 0 1 -12,-12 z" fill="#6FB2F5" />
  </svg>
);

export const DocIcon: React.FC<{ s: number }> = ({ s }) => (
  <svg width={Math.round(s * 0.78)} height={s} viewBox="0 0 78 100" style={{ display: "block", flex: "none" }}>
    <path d="M2 4 a3 3 0 0 1 3 -3 h44 l27 27 v68 a3 3 0 0 1 -3 3 H5 a3 3 0 0 1 -3 -3 Z" fill="#FFFFFF" stroke="#C3C3C3" strokeWidth="2" />
    <path d="M49 1 v24 a3 3 0 0 0 3 3 h24" fill="#EDEDED" stroke="#C3C3C3" strokeWidth="2" />
    {[0, 1, 2, 3].map((i) => <rect key={i} x="14" y={44 + i * 12} width={i === 3 ? 28 : 50} height="5" rx="2.5" fill="#CFCFCF" />)}
  </svg>
);

export const ZipIcon: React.FC<{ s: number }> = ({ s }) => (
  <svg width={Math.round(s * 0.78)} height={s} viewBox="0 0 78 100" style={{ display: "block", flex: "none" }}>
    <path d="M2 4 a3 3 0 0 1 3 -3 h44 l27 27 v68 a3 3 0 0 1 -3 3 H5 a3 3 0 0 1 -3 -3 Z" fill="#FFFFFF" stroke="#C3C3C3" strokeWidth="2" />
    <path d="M49 1 v24 a3 3 0 0 0 3 3 h24" fill="#EDEDED" stroke="#C3C3C3" strokeWidth="2" />
    <rect x="33" y="34" width="12" height="46" rx="2" fill="#B9BDC4" />
    {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={i % 2 ? 36 : 30} y={38 + i * 9} width="12" height="5" rx="1.4" fill="#8D939C" />)}
    <rect x="31" y="80" width="16" height="12" rx="2.4" fill="#6E747D" />
  </svg>
);

const Lights: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => (
  <svg width={r * 8} height={r * 2.4} viewBox={`0 0 ${r * 8} ${r * 2.4}`} style={{ position: "absolute", left: x, top: y - r * 1.2 }}>
    {[["#FF5F57", "#E0443E"], ["#FEBC2E", "#DFA123"], ["#28C840", "#1DAD2B"]].map(([f, s], i) => (
      <circle key={i} cx={r + i * r * 2.7} cy={r * 1.2} r={r} fill={f} stroke={s} strokeWidth="0.7" />
    ))}
  </svg>
);

const ViewSeg: React.FC<{ x: number; y: number; w: number; h: number; active: number }> = ({ x, y, w, h, active }) => {
  const cw = w / 4;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, display: "flex" }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ width: cw, height: h, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, backgroundColor: i === active ? "#FFFFFF" : "transparent", boxShadow: i === active ? "0 1px 2px rgba(0,0,0,0.18)" : undefined }}>
          <svg width={h * 0.52} height={h * 0.52} viewBox="0 0 16 16">
            {i === 0 && [0, 1].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={2 + c * 7} y={2 + r * 7} width="5" height="5" rx="1" fill={i === active ? C.ink : C.muted} />))}
            {i === 1 && [0, 1, 2].map((r) => <rect key={r} x="2" y={3 + r * 4.5} width="12" height="2" rx="1" fill={i === active ? C.ink : C.muted} />)}
            {i === 2 && [0, 1, 2].map((c) => <rect key={c} x={2 + c * 4.5} y="3" width="3" height="10" rx="1" fill={i === active ? C.ink : C.muted} />)}
            {i === 3 && (<><rect x="2" y="3" width="12" height="7" rx="1" fill={i === active ? C.ink : C.muted} /><rect x="4" y="11.5" width="8" height="2.5" rx="1" fill={i === active ? C.ink : C.muted} /></>)}
          </svg>
        </div>
      ))}
    </div>
  );
};

export type Search = { text: string; focused: boolean; caret: boolean };

export const FinderWindow: React.FC<{
  w: number; h: number; toolbarH: number; statusH: number; sidebarW: number;
  title: string; rows: SidebarRow[]; selected: string; view: number; lightsX?: number;
  search?: Search; status?: React.ReactNode; children?: React.ReactNode;
}> = ({ w, h, toolbarH, statusH, sidebarW, title, rows, selected, view, lightsX, search, status, children }) => {
  const cx = sidebarW;
  const cw = w - sidebarW;
  // the sidebar's type is sized from the SIDEBAR, never from the card, so a name
  // like "Applications" can never run over the divider into the file area
  const fs = Math.round(Math.min(h * 0.043, sidebarW * 0.105));
  const sbPad = Math.round(sidebarW * 0.055);
  const titleFs = Math.round(h * 0.052);
  const rowH = Math.round(fs * 1.66);
  const sfW = Math.round(cw * 0.290);
  const sfH = Math.round(toolbarH * 0.44);
  const sfX = w - Math.round(w * 0.024) - sfW;
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: C.content, fontFamily: SANS, overflow: "hidden" }}>
      {/* sidebar material, full height, the lights sitting on it */}
      <div style={{ position: "absolute", left: 0, top: 0, width: sidebarW, height: h, backgroundColor: C.sidebar, borderRight: `1px solid ${C.hair}`, boxSizing: "border-box" }} />
      <Lights x={lightsX ?? Math.round(sidebarW * 0.13)} y={Math.round(toolbarH * 0.50)} r={Math.round(h * 0.0175)} />
      <div style={{ position: "absolute", left: sbPad, top: toolbarH + Math.round(h * 0.012), width: sidebarW - 2 * sbPad, overflow: "hidden", fontFamily: SANS }}>
        <div style={{ fontSize: Math.round(fs * 0.86), fontWeight: 600, color: C.dim, letterSpacing: 0.2 }}>Favorites</div>
        {rows.map((r) => {
          const on = r.name === selected;
          return (
            <div key={r.name} style={{ position: "relative", display: "flex", alignItems: "center", gap: Math.round(fs * 0.40), height: rowH, width: "100%", paddingLeft: Math.round(fs * 0.40), marginTop: Math.round(h * 0.004), borderRadius: 7, backgroundColor: on ? "#D5D5D7" : "transparent", boxSizing: "border-box" }}>
              <G kind={r.icon} s={Math.round(fs * 1.04)} />
              <span style={{ fontSize: fs, fontWeight: on ? 600 : 400, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
            </div>
          );
        })}
      </div>

      {/* toolbar over the content side */}
      <div style={{ position: "absolute", left: cx, top: 0, width: cw, height: toolbarH, backgroundColor: C.toolbar, borderBottom: `1px solid ${C.hair}`, boxSizing: "border-box" }} />
      <svg width={Math.round(cw * 0.10)} height={toolbarH} viewBox="0 0 60 40" style={{ position: "absolute", left: cx + Math.round(cw * 0.028), top: 0 }}>
        <path d="M24 13 L17 20 L24 27" fill="none" stroke={C.muted} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M39 13 L46 20 L39 27" fill="none" stroke={C.dim} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <ViewSeg x={cx + Math.round(cw * 0.135)} y={Math.round((toolbarH - sfH) / 2)} w={Math.round(cw * 0.185)} h={sfH} active={view} />
      <div style={{ position: "absolute", left: cx + Math.round(cw * 0.36), top: 0, height: toolbarH, display: "flex", alignItems: "center", gap: Math.round(titleFs * 0.36) }}>
        <FolderIcon s={Math.round(titleFs * 1.22)} />
        <span style={{ fontSize: titleFs, fontWeight: 600, color: "#2B2A28", whiteSpace: "nowrap" }}>{title}</span>
      </div>
      {search && (
        <div style={{ position: "absolute", left: sfX, top: Math.round((toolbarH - sfH) / 2), width: sfW, height: sfH, borderRadius: 8, backgroundColor: "#FFFFFF", border: `1px solid ${search.focused ? "#7FAEF2" : C.hair}`, boxShadow: search.focused ? "0 0 0 3px rgba(90,150,240,0.30)" : undefined, boxSizing: "border-box", display: "flex", alignItems: "center", paddingLeft: Math.round(sfH * 0.28), gap: Math.round(sfH * 0.22) }}>
          <svg width={Math.round(sfH * 0.50)} height={Math.round(sfH * 0.50)} viewBox="0 0 16 16">
            <circle cx="7" cy="7" r="4.6" fill="none" stroke={C.dim} strokeWidth="1.8" />
            <path d="M10.4 10.4 L14 14" stroke={C.dim} strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: Math.round(sfH * 0.50), color: search.text ? C.ink : C.dim, whiteSpace: "nowrap" }}>{search.text || "Search"}</span>
          {search.caret && <span style={{ width: 2, height: Math.round(sfH * 0.56), backgroundColor: C.ink, marginLeft: -Math.round(sfH * 0.12) }} />}
        </div>
      )}

      {/* content */}
      <div style={{ position: "absolute", left: cx, top: toolbarH, width: cw, height: h - toolbarH - statusH, overflow: "hidden" }}>{children}</div>

      {/* status bar */}
      <div style={{ position: "absolute", left: cx, top: h - statusH, width: cw, height: statusH, backgroundColor: C.toolbar, borderTop: `1px solid ${C.hair}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {status}
      </div>
    </div>
  );
};
