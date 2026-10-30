// What the nine scenes of this reel share, so they read as one film: the asset path, the real logos, the one
// Chrome window every scene happens in or to, the real hash, the browser row's slots and the palette.
import React from "react";
import { Img, staticFile } from "remotion";
import { useScene } from "../../../src/engine";

export const SLUG = "chrome-fingerprinting-us";
export const asset = (name: string) => staticFile(`${SLUG}/${name}`);

export const STAGE = { top: 520, bottom: 1450, cx: 540 };

/** the reel's one red: the villain (Chrome's "spyware" stamp, its empty verdict). Nothing else is red. */
export const RED = "#E5383B";
export const MINT = "#41F9D3";
export const ALI = "#FF4747"; // AliExpress's own orange-red, only on AliExpress's own page
export const WAVE = "#8AB4FF"; // the audio signal, everywhere it is drawn

/** the value the Firefox engineer got by running Alibaba's own WebAudio code (ritter.vg, 20 Aug 2026) */
export const HASH = "sha256:9a388c0dd04cfdc54314f9d961c7e2d247b972067e28d1cea76bd6060cf1392e";
/** the other value seen in the same engineer's internal survey */
export const HASH_2 = "sha256:16d3191880ce01f726015ec6a1f9a072a81ebd04bf489098d4685d1d1c0b2711";

/** the real audio chain, from the developer's post: Sawtooth oscillator -> AnalyserNode -> ScriptProcessorNode ->
 *  GainNode set to zero -> AudioContext.destination */
export const CHAIN = ["Sawtooth oscillator", "Analyser", "Script processor", "Gain", "Speakers"] as const;

export type LogoName = "chrome" | "safari" | "firefox" | "brave" | "aliexpress" | "alibaba" | "instagram" | "github" | "mozilla";

/** a real mark, fetched, drawn bare: no tile, no circle, no border (the creator's rule). */
export const Logo: React.FC<{ name: LogoName; size?: number; style?: React.CSSProperties }> = ({ name, size = 96, style }) => (
  <Img src={asset(`logo-${name}.png`)} style={{ width: size, height: size, objectFit: "contain", display: "block", flex: "none", ...style }} />
);

/** the browser row of the last third: Chrome, Safari, Firefox, Brave, one slot each, centred on 540 */
export const ROW = { y: 880, pitch: 216, size: 132, order: ["chrome", "safari", "firefox", "brave"] as const };
export const rowX = (i: number) => STAGE.cx + (i - 1.5) * ROW.pitch; // centre x of slot i

// Chrome's own frame colours (Chrome 13x, default theme), light and dark.
const CHROME = {
  light: { frame: "#DEE1E6", tab: "#FFFFFF", omni: "#F1F3F4", ink: "#1F1F1F", dim: "#5F6368", page: "#FFFFFF" },
  dark: { frame: "#202124", tab: "#35363A", omni: "#202124", ink: "#E8EAED", dim: "#9AA0A6", page: "#1F1F1F" },
};

/** Chrome's lock/tune icon in the omnibox */
const Tune: React.FC<{ c: string }> = ({ c }) => (
  <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round">
    <path d="M4 8h9M17 8h3M4 16h3M11 16h9" />
    <circle cx={15} cy={8} r={2} />
    <circle cx={9} cy={16} r={2} />
  </svg>
);

/**
 * The continuous thing: one Chrome window. Real geometry: tab strip, one active tab with favicon and title, the
 * omnibox with its tune icon and the url, then the page. Width is the column's (900) unless told otherwise.
 * `url` is what is typed so far (the caller runs typeOn), `caret` shows the blinking caret after it.
 * `frameTint` recolours the whole frame (the red "spyware" hit): pass a colour to mix toward, and the amount.
 */
export const ChromeWindow: React.FC<{
  width?: number;
  height?: number;
  mode?: "light" | "dark";
  favicon?: React.ReactNode;
  tabTitle?: React.ReactNode;
  url?: string;
  caret?: boolean;
  tint?: { color: string; amount: number };
  children?: React.ReactNode; // the page, clipped to the page area
  style?: React.CSSProperties;
}> = ({ width = 900, height = 640, mode = "dark", favicon, tabTitle, url = "", caret, tint, children, style }) => {
  const { theme, f } = useScene();
  const c = CHROME[mode];
  const frame = tint && tint.amount > 0 ? mixHex(c.frame, tint.color, tint.amount) : c.frame;
  const blink = caret && Math.floor(f / 30) % 2 === 0;
  return (
    <div style={{ width, height, borderRadius: 22, overflow: "hidden", background: frame, boxShadow: "0 30px 80px rgba(0,0,0,0.35)", fontFamily: theme.font.ui, ...style }}>
      {/* tab strip: traffic lights, the active tab */}
      <div style={{ height: 78, position: "relative" }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((col, i) => (
          <div key={col} style={{ position: "absolute", left: 28 + i * 34, top: 30, width: 20, height: 20, borderRadius: 99, background: col }} />
        ))}
        <div style={{ position: "absolute", left: 140, top: 16, height: 62, width: 380, background: c.tab, borderRadius: "18px 18px 0 0", display: "flex", alignItems: "center", gap: 14, padding: "0 22px" }}>
          <div style={{ width: 32, height: 32, flex: "none" }}>{favicon}</div>
          <div style={{ fontSize: 28, color: c.ink, whiteSpace: "nowrap", overflow: "hidden" }}>{tabTitle ?? "New Tab"}</div>
        </div>
      </div>
      {/* toolbar + omnibox */}
      <div style={{ height: 84, background: c.tab, display: "flex", alignItems: "center", padding: "0 22px", gap: 18 }}>
        <div style={{ flex: 1, height: 58, borderRadius: 99, background: c.omni, display: "flex", alignItems: "center", gap: 14, padding: "0 22px" }}>
          <Tune c={c.dim} />
          <div style={{ fontSize: 30, color: c.ink, whiteSpace: "nowrap" }}>
            {url}
            {caret && <span style={{ display: "inline-block", width: 3, height: 34, marginLeft: 2, verticalAlign: "middle", background: blink ? c.ink : "transparent" }} />}
          </div>
        </div>
      </div>
      <div style={{ position: "relative", height: height - 162, background: c.page, overflow: "hidden" }}>{children}</div>
    </div>
  );
};

/** hex to hex, t in 0..1 */
export function mixHex(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * Math.max(0, Math.min(1, t))).toString(16).padStart(2, "0")).join("");
}

// Continuity contracts between scenes (plan.md). A scene that hands an object over ends with it exactly here, and
// the next scene starts with it exactly here, so the Stage's lift reads as the same object staying put.
export const HANDOFF = {
  /** end of `hook`: the window, full size, centred */
  hookWindow: { left: 90, top: 560, width: 900, height: 640 },
  /** `developer`: the window parked as a tile, top left, scale 1/3 */
  tileWindow: { left: 90, top: 540, scale: 1 / 3 },
  /** end of `sound` = start of `fingerprint`: the window at half size on top, the device card under it */
  soundWindow: { left: 315, top: 540, scale: 0.5 },
  device: { left: 150, top: 1000, width: 780, height: 330 },
  /** `choose` onward: the hash line above the browser row */
  hashLine: { top: 700 },
};

/** the laptop card: a drawn laptop, a title, and the `device ID` field (value typed so far, optional caret) */
export const DeviceCard: React.FC<{ title?: React.ReactNode; value?: React.ReactNode; caret?: boolean; mode?: "light" | "dark"; style?: React.CSSProperties }> = ({ title = "This computer", value, caret, mode = "dark", style }) => {
  const { theme, f } = useScene();
  const ink = mode === "dark" ? "#F2F2F2" : "#0B0B0B";
  const dim = mode === "dark" ? "#8C8C8C" : "#6B7280";
  const card = mode === "dark" ? "#1B1B1E" : "#FFFFFF";
  const field = mode === "dark" ? "#0E0E10" : "#F1F3F4";
  const blink = caret && Math.floor(f / 30) % 2 === 0;
  return (
    <div style={{ width: HANDOFF.device.width, height: HANDOFF.device.height, borderRadius: 26, background: card, boxShadow: "0 24px 70px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", gap: 34, padding: "0 40px", boxSizing: "border-box", fontFamily: theme.font.ui, ...style }}>
      <svg width={190} height={140} viewBox="0 0 190 140" style={{ flex: "none" }}>
        <rect x={25} y={8} width={140} height={96} rx={10} fill="none" stroke={ink} strokeWidth={6} />
        <rect x={37} y={20} width={116} height={72} rx={4} fill={WAVE} opacity={0.18} />
        <path d="M6 116h178l-12 16H18z" fill={ink} />
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: ink }}>{title}</div>
        <div style={{ fontSize: 30, color: dim, marginTop: 18 }}>device ID</div>
        <div style={{ marginTop: 8, height: 64, borderRadius: 14, background: field, display: "flex", alignItems: "center", padding: "0 18px", fontFamily: theme.font.mono, fontSize: 32, color: ink, whiteSpace: "nowrap", overflow: "hidden" }}>
          {value}
          {caret && <span style={{ display: "inline-block", width: 3, height: 36, marginLeft: 2, background: blink ? ink : "transparent" }} />}
        </div>
      </div>
    </div>
  );
};

/** the hash, set as one line of mono, truncated in the middle so the real start and end are both readable */
export const shortHash = (h: string, head = 14, tail = 6) => `${h.slice(0, head)}…${h.slice(-tail)}`;
