// The reel's Chrome window, at ChromeWindow's own geometry, able to become Firefox in place: k = 0 is Chrome's
// light frame (connected tab, pill omnibox, tune icon), k = 1 is Firefox's Proton light frame (floating tab,
// squarer address field, shield + lock). Same object, recoloured and reshaped, never swapped for a new card.
import React from "react";
import { useScene } from "../../../src/engine";
import { ALI, Logo, mixHex } from "./parts";
import { lerp } from "./BrowserRow";

const CH = { frame: "#DEE1E6", tab: "#FFFFFF", bar: "#FFFFFF", omni: "#F1F3F4", ink: "#1F1F1F", dim: "#5F6368" };
const FX = { frame: "#F0F0F4", tab: "#FFFFFF", bar: "#F9F9FB", omni: "#F0F0F4", ink: "#15141A", dim: "#5B5B66" };

const Tune: React.FC<{ c: string }> = ({ c }) => (
  <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round">
    <path d="M4 8h9M17 8h3M4 16h3M11 16h9" />
    <circle cx={15} cy={8} r={2} />
    <circle cx={9} cy={16} r={2} />
  </svg>
);

/** Firefox's tracking-protection shield and the padlock, as its address field draws them */
const ShieldLock: React.FC<{ c: string }> = ({ c }) => (
  <svg width={74} height={34} viewBox="0 0 50 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinejoin="round">
    <path d="M12 3l7 2.6v5.6c0 4.6-3 8.2-7 9.8-4-1.6-7-5.2-7-9.8V5.6z" />
    <rect x={32} y={10.5} width={12} height={9} rx={1.8} />
    <path d="M34.8 10.5V8a3.2 3.2 0 0 1 6.4 0v2.5" />
  </svg>
);

export const MorphWindow: React.FC<{
  k: number;
  height: number;
  favicon: React.ReactNode;
  title: string;
  url: string;
  caret?: boolean;
  children: React.ReactNode;
}> = ({ k, height, favicon, title, url, caret, children }) => {
  const { f, theme } = useScene();
  const c = (key: keyof typeof CH) => mixHex(CH[key], FX[key], k);
  const blink = caret && Math.floor(f / 30) % 2 === 0;
  const tabTop = lerp(16, 12, k);
  const tabH = lerp(62, 52, k);
  return (
    <div style={{ width: 900, height, borderRadius: 22, overflow: "hidden", background: c("frame"), boxShadow: "0 30px 80px rgba(20,24,40,0.22)", fontFamily: theme.font.ui }}>
      <div style={{ height: 78, position: "relative" }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((col, i) => (
          <div key={col} style={{ position: "absolute", left: 28 + i * 34, top: 30, width: 20, height: 20, borderRadius: 99, background: col }} />
        ))}
        <div
          style={{
            position: "absolute", left: 140, top: tabTop, height: tabH, width: 380, background: c("tab"),
            borderRadius: `${lerp(18, 10, k)}px ${lerp(18, 10, k)}px ${lerp(0, 10, k)}px ${lerp(0, 10, k)}px`,
            boxShadow: k > 0.02 ? `0 2px 8px rgba(0,0,0,${(0.14 * k).toFixed(3)})` : undefined,
            display: "flex", alignItems: "center", gap: 14, padding: "0 22px",
          }}
        >
          <div style={{ width: 32, height: 32, flex: "none" }}>{favicon}</div>
          <div style={{ fontSize: 28, color: c("ink"), whiteSpace: "nowrap", overflow: "hidden" }}>{title}</div>
        </div>
      </div>
      <div style={{ height: 84, background: c("bar"), display: "flex", alignItems: "center", padding: "0 22px" }}>
        <div style={{ flex: 1, height: 58, borderRadius: lerp(99, 12, k), background: c("omni"), display: "flex", alignItems: "center", gap: 14, padding: "0 22px", position: "relative" }}>
          <div style={{ position: "relative", width: 74, height: 34, flex: "none" }}>
            <div style={{ position: "absolute", left: 0, top: 0, opacity: 1 - k }}><Tune c={c("dim")} /></div>
            <div style={{ position: "absolute", left: 0, top: 0, opacity: k }}><ShieldLock c={c("dim")} /></div>
          </div>
          <div style={{ fontSize: 30, color: c("ink"), whiteSpace: "nowrap" }}>
            {url}
            {caret && <span style={{ display: "inline-block", width: 3, height: 34, marginLeft: 2, verticalAlign: "middle", background: blink ? c("ink") : "transparent" }} />}
          </div>
        </div>
      </div>
      <div style={{ position: "relative", height: height - 162, background: "#FFFFFF", overflow: "hidden" }}>{children}</div>
    </div>
  );
};

/** the AliExpress tab the reel has been in since the hook: its red header and search bar, nothing invented */
export const AliPage: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { theme } = useScene();
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: theme.font.ui, ...style }}>
      <div style={{ height: 120, display: "flex", alignItems: "center", gap: 22, padding: "0 34px", borderBottom: "1px solid #EEE" }}>
        <Logo name="aliexpress" size={72} style={{ borderRadius: 14 }} />
        <div style={{ flex: 1, height: 64, borderRadius: 32, border: `3px solid ${ALI}`, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6, boxSizing: "border-box" }}>
          <div style={{ width: 96, height: 50, borderRadius: 25, background: ALI, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round">
              <circle cx={10.5} cy={10.5} r={6.5} />
              <path d="M15.5 15.5L21 21" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Firefox's new tab: its mark, its name and the search field with the placeholder Firefox writes there */
export const FirefoxNewTab: React.FC<{ style?: React.CSSProperties; markStyle?: React.CSSProperties }> = ({ style, markStyle }) => {
  const { theme } = useScene();
  return (
    <div style={{ position: "absolute", inset: 0, background: "#F9F9FB", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 44, fontFamily: theme.font.ui, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, ...markStyle }}>
        <Logo name="firefox" size={112} />
        <span style={{ fontSize: 64, fontWeight: 700, color: "#15141A", letterSpacing: -1 }}>Firefox</span>
      </div>
      <div style={{ marginTop: 36, width: 720, height: 76, borderRadius: 12, background: "#FFFFFF", boxShadow: "0 2px 10px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", padding: "0 26px", boxSizing: "border-box", fontSize: 32, color: "#5B5B66" }}>
        Search with Google or enter address
      </div>
    </div>
  );
};
