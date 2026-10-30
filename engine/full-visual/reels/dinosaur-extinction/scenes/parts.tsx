// Vocabulario visual compartido para dinosaur-extinction (Español + ilustraciones descriptivas):
// 1. EarthGlobe + EarthSunlightStrip: hilo conductor continuo ("LUZ SOLAR 100% -> 0%").
// 2. IllustrationWindow: ventana cinematográfica 16:9 con movimiento parallax continuo (nunca se congela) y overlays sincronizados.
// 3. PaperBadge: encabezado editorial de los 4 estudios reales (Science y Nature).
import React from "react";
import { Img, staticFile } from "remotion";
import { arrive, ease, mix, prog, useScene } from "../../../src/engine";

export const SLUG = "dinosaur-extinction";
export const asset = (name: string) => staticFile(`${SLUG}/${name}`);
export const STAGE = { left: 110, width: 860, safeWidth: 860, top: 520, bottom: 1450, cx: 540 };

export const PALETTE = {
  sun: "#F59E0B",
  sunBright: "#FDE047",
  ember: "#EF4444",
  emberSoft: "#FCA5A5",
  flora: "#22C55E",
  ocean: "#2563EB",
  oceanDeep: "#0F294A",
  land: "#34D399",
  ice: "#38BDF8",
  sulfur: "#EAB308",
  dust: "#292524",
  violet: "#8B5CF6",
};

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/**
 * Globo físico de la Tierra iluminado en 3D con Yucatán, brasa de impacto y manto de polvo de silicato en movimiento continuo.
 */
export const EarthGlobe: React.FC<{
  size: number;
  shroud?: number;
  impact?: number;
  reticle?: boolean;
  style?: React.CSSProperties;
}> = ({ size, shroud = 0, impact = 0, reticle = false, style }) => {
  const { f } = useScene();
  const uid = `earth-${size}-${Math.round(shroud * 10)}`;
  const drift = (f * 0.55) % 200;
  const s = Math.max(0, Math.min(1, shroud));

  return (
    <div style={{ width: size, height: size, position: "relative", flex: "none", ...style }}>
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ display: "block", overflow: "visible" }}>
        <defs>
          <clipPath id={`${uid}-clip`}>
            <circle cx="100" cy="100" r="92" />
          </clipPath>
          <radialGradient id={`${uid}-ocean`} cx="36%" cy="32%" r="72%">
            <stop offset="0%" stopColor={mix(f, 0, 1, "#38BDF8", "#1E293B")} stopOpacity={1 - s * 0.72} />
            <stop offset="55%" stopColor={PALETTE.ocean} stopOpacity={1 - s * 0.65} />
            <stop offset="100%" stopColor="#071324" />
          </radialGradient>
          <radialGradient id={`${uid}-shroud`} cx="45%" cy="42%" r="70%">
            <stop offset="0%" stopColor="#3F3A36" />
            <stop offset="62%" stopColor="#191716" />
            <stop offset="100%" stopColor="#09090B" />
          </radialGradient>
        </defs>

        <circle
          cx="100"
          cy="100"
          r="96"
          fill="none"
          stroke={s > 0.5 ? "rgba(239,68,68,0.38)" : "rgba(56,189,248,0.42)"}
          strokeWidth="4"
        />

        <g clipPath={`url(#${uid}-clip)`}>
          <circle cx="100" cy="100" r="92" fill="#081426" />
          <circle cx="100" cy="100" r="92" fill={`url(#${uid}-ocean)`} />

          <g opacity={1 - s * 0.76} transform={`translate(${Math.sin(f * 0.015) * 2.5}, 0)`}>
            <path
              d="M 28 34 C 52 22, 92 26, 108 46 C 114 58, 102 74, 90 82 C 84 86, 78 92, 83 96 C 89 96, 94 93, 96 98 C 95 104, 86 106, 82 112 L 70 106 C 62 96, 56 86, 44 76 C 30 66, 22 48, 28 34 Z"
              fill="#22C55E"
            />
            <path
              d="M 92 116 C 110 114, 128 126, 130 146 C 131 166, 116 184, 102 190 C 94 182, 90 162, 86 144 C 83 130, 84 120, 92 116 Z"
              fill="#16A34A"
            />
          </g>

          {s > 0.01 && (
            <g opacity={s}>
              <circle cx="100" cy="100" r="93" fill={`url(#${uid}-shroud)`} opacity={0.92} />
              {[-40, 0, 40, 80, 120].map((bandY, idx) => {
                const offset = ((drift * (idx % 2 === 0 ? 1 : -0.8) + idx * 37) % 220) - 110;
                return (
                  <path
                    key={bandY}
                    d={`M ${-90 + offset} ${44 + idx * 28} Q ${10 + offset} ${34 + idx * 28} ${110 + offset} ${46 + idx * 28} T ${310 + offset} ${44 + idx * 28}`}
                    stroke={idx % 2 === 0 ? "rgba(168,162,158,0.24)" : "rgba(239,68,68,0.18)"}
                    strokeWidth={14}
                    strokeLinecap="round"
                    fill="none"
                  />
                );
              })}
            </g>
          )}

          {impact > 0.01 && (
            <g opacity={impact}>
              <circle cx="88" cy="96" r={10 + Math.sin(f * 0.16) * 2.2} fill="rgba(239,68,68,0.38)" />
              <circle cx="88" cy="96" r="5.5" fill="#F97316" />
              <circle cx="88" cy="96" r="2.8" fill="#FEF08A" />
            </g>
          )}

          {reticle && (
            <g transform="translate(88, 96)">
              <circle r="18" fill="none" stroke="#EF4444" strokeWidth="2.8" />
            </g>
          )}

          <path d="M 132 4 A 96 96 0 0 1 132 196 A 92 92 0 0 0 192 100 A 92 92 0 0 0 132 4 Z" fill="rgba(0,0,0,0.46)" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Barra continua en la parte superior del escenario (`y = 530`, altura `98 px`):
 * Mantiene vivo el globo terrestre y el medidor de LUZ SOLAR en todas las escenas.
 */
export const EarthSunlightStrip: React.FC<{
  at: number;
  sunPct: number;
  shroud?: number;
  impact?: number;
  status?: string;
  width?: number;
}> = ({ at, sunPct, shroud = 1 - sunPct / 100, impact = 0.75, status, width = STAGE.safeWidth }) => {
  const { f, theme, ground, scene } = useScene();
  const k = arrive(f, at, 18);
  const y = (1 - k) * -80;
  const pct = Math.max(0, Math.min(100, sunPct));
  const dark = scene.ground === "dark";
  const barColor = pct < 25 ? PALETTE.ember : pct < 65 ? PALETTE.sun : PALETTE.sunBright;

  return (
    <div
      style={{
        position: "absolute",
        left: STAGE.left,
        top: 530,
        width,
        height: 98,
        borderRadius: 22,
        padding: "0 22px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 18,
        background: dark ? "rgba(24,24,28,0.95)" : "#FFFFFF",
        boxShadow: dark
          ? "0 16px 40px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(255,255,255,0.10)"
          : "0 16px 40px rgba(15,23,42,0.08), inset 0 0 0 2px #E5E7EB",
        opacity: prog(f, at, 3, ease.linear),
        transform: `translateY(${y.toFixed(1)}px)`,
        zIndex: 12,
      }}
    >
      <EarthGlobe size={68} shroud={shroud} impact={impact} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, color: ground.ink }}>
            LUZ SOLAR
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {status && (
              <span
                style={{
                  padding: "2px 14px",
                  borderRadius: 999,
                  background: pct < 25 ? "rgba(239,68,68,0.18)" : "rgba(245,158,11,0.18)",
                  color: pct < 25 ? (dark ? "#FCA5A5" : "#DC2626") : "#D97706",
                  fontFamily: theme.font.ui,
                  fontSize: 32,
                  fontWeight: 700,
                }}
              >
                {status}
              </span>
            )}
            <span
              style={{
                fontFamily: theme.font.mono,
                fontSize: 36,
                fontWeight: 800,
                fontVariantNumeric: "tabular-nums",
                color: pct < 25 ? PALETTE.ember : ground.ink,
              }}
            >
              {Math.round(pct)}%
            </span>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            height: 14,
            borderRadius: 999,
            background: dark ? "rgba(255,255,255,0.10)" : "#E5E7EB",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.max(pct, 3)}%`,
              height: "100%",
              borderRadius: 999,
              background: barColor,
              opacity: pct === 0 ? 0.55 + 0.35 * Math.sin(f * 0.16) : 1,
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Ventana cinematográfica con ilustración realista ("cómo pudo haber sido"), movimiento parallax vivo
 * continuo durante toda la escena (evita frames estáticos) y capa para overlays sincronizados en español.
 */
export const IllustrationWindow: React.FC<{
  src: string;
  at: number;
  top?: number;
  height?: number;
  panX?: [number, number];
  panY?: [number, number];
  zoom?: [number, number];
  borderAccent?: string;
  children?: React.ReactNode;
}> = ({
  src,
  at,
  top = 644,
  height = 430,
  panX = [-10, 10],
  panY = [-6, 6],
  zoom = [1.04, 1.13],
  borderAccent,
  children,
}) => {
  const { f, scene } = useScene();
  const dark = scene.ground === "dark";
  const kIn = arrive(f, at, 20);
  const yEnter = (1 - kIn) * 140;
  const span = Math.max(60, scene.to - scene.from);
  const p = prog(f, scene.from - 6, span + 18, ease.linear);
  const sc = lerp(zoom[0], zoom[1], p);
  const tx = lerp(panX[0], panX[1], p);
  const ty = lerp(panY[0], panY[1], p);

  return (
    <div
      style={{
        position: "absolute",
        left: STAGE.left,
        top,
        width: STAGE.safeWidth,
        height,
        borderRadius: 26,
        overflow: "hidden",
        background: "#0B0D13",
        boxShadow: dark
          ? `0 24px 60px rgba(0,0,0,0.58), inset 0 0 0 2.5px ${borderAccent ?? "rgba(255,255,255,0.14)"}`
          : `0 24px 54px rgba(15,23,42,0.14), inset 0 0 0 2.5px ${borderAccent ?? "#D1D5DB"}`,
        opacity: prog(f, at, 3, ease.linear),
        transform: `translateY(${yEnter.toFixed(1)}px)`,
      }}
    >
      <Img
        src={asset(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          transform: `scale(${sc.toFixed(4)}) translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`,
          transformOrigin: "center center",
        }}
      />
      {/* Gradiente sutil inferior para legibilidad de etiquetas sobre la ilustración */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.04) 45%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
};

/**
 * Encabezado editorial de revista científica (Science / Nature) con tipografía >= 32 px.
 */
export const PaperBadge: React.FC<{
  journal: string;
  year: string;
  author: string;
  accent?: string;
}> = ({ journal, year, author, accent = "#2563EB" }) => {
  const { theme, ground, scene } = useScene();
  const dark = scene.ground === "dark";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 14,
        borderBottom: `2px solid ${dark ? "rgba(255,255,255,0.10)" : "#E5E7EB"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            padding: "5px 16px",
            borderRadius: 10,
            background: accent,
            color: "#FFFFFF",
            fontFamily: theme.font.ui,
            fontSize: 32,
            fontWeight: 800,
          }}
        >
          {journal}
        </div>
        <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 700, color: ground.ink }}>
          {year}
        </span>
      </div>
      <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 600, color: ground.dim }}>
        {author}
      </span>
    </div>
  );
};
