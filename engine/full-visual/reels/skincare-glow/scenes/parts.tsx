// Kit visual confortable para skincare-glow (Español + referencias reales + efectos bokeh/glow a 60 fps).
import React from "react";
import { Img, staticFile } from "remotion";
import { arrive, ease, prog, useScene } from "../../../src/engine";

export const SLUG = "skincare-glow";
export const asset = (name: string) => staticFile(`${SLUG}/${name}`);
export const STAGE = { left: 110, width: 860, safeWidth: 860, top: 520, bottom: 1450, cx: 540 };

export const COZY = {
  rose: "#C9727B",
  roseSoft: "rgba(201, 114, 123, 0.16)",
  roseDeep: "#A6515B",
  sage: "#4E9A78",
  sageSoft: "rgba(78, 154, 120, 0.16)",
  honey: "#D28E5D",
  honeySoft: "rgba(210, 142, 93, 0.18)",
  sun: "#E7A14B",
  moon: "#E6B88A",
  plumCard: "#261D1F",
  creamCard: "#FFFDF9",
  borderLight: "#E8DDD0",
  borderDark: "rgba(255, 228, 212, 0.16)",
};

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const PARTICLES = [
  { x: 140, y: 580, r: 18, sp: 0.024, ph: 0.4, c: "rgba(231, 161, 75, 0.18)" },
  { x: 930, y: 630, r: 24, sp: 0.019, ph: 1.7, c: "rgba(201, 114, 123, 0.16)" },
  { x: 185, y: 980, r: 14, sp: 0.028, ph: 2.6, c: "rgba(78, 154, 120, 0.16)" },
  { x: 895, y: 1050, r: 20, sp: 0.022, ph: 3.5, c: "rgba(231, 161, 75, 0.17)" },
  { x: 250, y: 1360, r: 22, sp: 0.017, ph: 4.1, c: "rgba(201, 114, 123, 0.15)" },
  { x: 830, y: 1390, r: 16, sp: 0.025, ph: 5.2, c: "rgba(231, 161, 75, 0.18)" },
];

/**
 * Atmósfera cálida confortable: halo suave respirando + partículas bokeh flotando a 60 fps.
 */
export const CozyAuraBackdrop: React.FC<{ mode?: "am" | "pm" }> = ({ mode = "am" }) => {
  const { f } = useScene();
  const breath = 0.88 + 0.12 * Math.sin(f * 0.045);
  const glowColor =
    mode === "pm"
      ? "radial-gradient(circle, rgba(210,142,93,0.16) 0%, rgba(201,114,123,0.08) 45%, rgba(0,0,0,0) 72%)"
      : "radial-gradient(circle, rgba(231,161,75,0.16) 0%, rgba(201,114,123,0.08) 46%, rgba(255,255,255,0) 74%)";

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 500,
          width: 900,
          height: 920,
          background: glowColor,
          transform: `scale(${breath.toFixed(4)})`,
        }}
      />
      {PARTICLES.map((p, idx) => {
        const dx = Math.sin(f * p.sp + p.ph) * 22;
        const dy = Math.cos(f * p.sp * 0.85 + p.ph) * 26;
        const op = 0.55 + 0.4 * Math.sin(f * 0.05 + idx);
        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: p.x + dx,
              top: p.y + dy,
              width: p.r * 2,
              height: p.r * 2,
              borderRadius: 999,
              background: p.c,
              filter: "blur(3px)",
              opacity: op,
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * Icono animado Sol de Mañana (AM) o Luna a la luz de las velas (PM).
 */
export const SunMoonOrb: React.FC<{ mode: "am" | "pm"; size?: number }> = ({ mode, size = 66 }) => {
  const { f } = useScene();
  const rot = (f * 0.45) % 360;
  const pulse = 1 + 0.05 * Math.sin(f * 0.08);

  return (
    <div style={{ width: size, height: size, flex: "none", position: "relative" }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible" }}>
        {mode === "am" ? (
          <g transform={`translate(50,50) scale(${pulse.toFixed(3)})`}>
            <circle r="44" fill="rgba(231, 161, 75, 0.18)" />
            <g transform={`rotate(${rot.toFixed(1)})`}>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <line
                  key={deg}
                  x1="0"
                  y1="-30"
                  x2="0"
                  y2="-40"
                  stroke="#E7A14B"
                  strokeWidth="5"
                  strokeLinecap="round"
                  transform={`rotate(${deg})`}
                />
              ))}
            </g>
            <circle r="22" fill="#E7A14B" />
            <circle cx="-6" cy="-6" r="7" fill="#FBE3B5" opacity="0.65" />
          </g>
        ) : (
          <g transform={`translate(50,50) scale(${pulse.toFixed(3)})`}>
            <circle r="44" fill="rgba(210, 142, 93, 0.22)" />
            <path
              d="M 10 -24 A 26 26 0 1 0 26 16 A 21 21 0 1 1 10 -24 Z"
              fill="#F3C999"
            />
            <circle cx="20" cy="-14" r={3.2 + Math.sin(f * 0.12) * 1.1} fill="#FFE6C7" />
            <circle cx="30" cy="2" r={2.4 + Math.cos(f * 0.1) * 0.9} fill="#C9727B" />
          </g>
        )}
      </svg>
    </div>
  );
};

/**
 * Barra superior continua del escenario (y = 530, altura = 98 px):
 * Muestra momento de la rutina (DÍA AM / NOCHE PM), paso actual y salud de la barrera cutánea.
 */
export const RoutineAuraStrip: React.FC<{
  at: number;
  mode?: "am" | "pm";
  title?: string;
  badge: string;
  barrierPct: number;
}> = ({ at, mode = "am", title, badge, barrierPct }) => {
  const { f, theme, ground, scene } = useScene();
  const dark = scene.ground === "dark";
  const k = arrive(f, at, 18);
  const y = (1 - k) * -70;
  const pct = Math.max(0, Math.min(100, barrierPct));
  const heading = title ?? (mode === "am" ? "RUTINA DÍA" : "RUTINA NOCHE");

  return (
    <div
      style={{
        position: "absolute",
        left: STAGE.left,
        top: 530,
        width: STAGE.safeWidth,
        height: 98,
        borderRadius: 24,
        padding: "0 22px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: dark ? "rgba(38, 29, 31, 0.96)" : COZY.creamCard,
        boxShadow: dark
          ? `0 16px 40px rgba(0,0,0,0.42), inset 0 0 0 2px ${COZY.borderDark}`
          : `0 14px 36px rgba(110, 78, 58, 0.09), inset 0 0 0 2px ${COZY.borderLight}`,
        opacity: prog(f, at, 4, ease.linear),
        transform: `translateY(${y.toFixed(1)}px)`,
        zIndex: 12,
      }}
    >
      <SunMoonOrb mode={mode} size={64} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, color: ground.ink }}>
            {heading}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                padding: "2px 14px",
                borderRadius: 999,
                background: mode === "am" ? COZY.roseSoft : COZY.honeySoft,
                color: mode === "am" ? (dark ? "#F4B4BC" : COZY.roseDeep) : (dark ? "#F5C99B" : "#9E5E2E"),
                fontFamily: theme.font.ui,
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              {badge}
            </span>
            <span
              style={{
                fontFamily: theme.font.mono,
                fontSize: 34,
                fontWeight: 800,
                fontVariantNumeric: "tabular-nums",
                color: pct >= 90 ? COZY.sage : ground.ink,
              }}
            >
              {Math.round(pct)}%
            </span>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            height: 13,
            borderRadius: 999,
            background: dark ? "rgba(255,255,255,0.10)" : "#EFE6DC",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.max(pct, 6)}%`,
              height: "100%",
              borderRadius: 999,
              background: "linear-gradient(90deg, #D28E5D 0%, #C9727B 52%, #4E9A78 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Ventana de imagen de referencia editorial con movimiento suave continuo, destello cálido y espacio para overlays.
 */
export const ReferencePhotoWindow: React.FC<{
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
  height = 416,
  panX = [-9, 9],
  panY = [-5, 5],
  zoom = [1.04, 1.12],
  borderAccent,
  children,
}) => {
  const { f, scene } = useScene();
  const dark = scene.ground === "dark";
  const kIn = arrive(f, at, 20);
  const yEnter = (1 - kIn) * 120;
  const span = Math.max(60, scene.to - scene.from);
  const p = prog(f, scene.from - 6, span + 18, ease.linear);
  const sc = lerp(zoom[0], zoom[1], p);
  const tx = lerp(panX[0], panX[1], p);
  const ty = lerp(panY[0], panY[1], p);
  const shimmerX = lerp(-45, 135, p);

  return (
    <div
      style={{
        position: "absolute",
        left: STAGE.left,
        top,
        width: STAGE.safeWidth,
        height,
        borderRadius: 28,
        overflow: "hidden",
        background: dark ? "#181213" : "#EFE6DC",
        boxShadow: dark
          ? `0 24px 58px rgba(0,0,0,0.52), inset 0 0 0 2.5px ${borderAccent ?? COZY.borderDark}`
          : `0 22px 52px rgba(110, 78, 58, 0.14), inset 0 0 0 2.5px ${borderAccent ?? COZY.borderLight}`,
        opacity: prog(f, at, 4, ease.linear),
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
      {/* Brillo de seda que recorre suavemente la fotografía */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${shimmerX.toFixed(1)}%`,
          width: "34%",
          background: "linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,248,238,0.18) 50%, rgba(255,255,255,0) 100%)",
          pointerEvents: "none",
        }}
      />
      {/* Degradado cálido sutil para máxima legibilidad de etiquetas */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(28,20,18,0.22) 0%, rgba(28,20,18,0.02) 48%, rgba(28,20,18,0.52) 100%)",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
};

/**
 * Encabezado de Ficha de Producto de Referencia (marca + paso + activo principal, >= 32 px).
 */
export const ProductRefHeader: React.FC<{
  step: string;
  brand: string;
  tag: string;
  accent?: string;
}> = ({ step, brand, tag, accent = COZY.rose }) => {
  const { theme, ground, scene } = useScene();
  const dark = scene.ground === "dark";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 14,
        borderBottom: `2px solid ${dark ? "rgba(255,235,220,0.12)" : "#EFE5DA"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            padding: "5px 16px",
            borderRadius: 12,
            background: accent,
            color: "#FFFFFF",
            fontFamily: theme.font.ui,
            fontSize: 32,
            fontWeight: 800,
          }}
        >
          {step}
        </span>
        <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 800, color: ground.ink }}>
          {brand}
        </span>
      </div>
      <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 700, color: accent }}>
        {tag}
      </span>
    </div>
  );
};
