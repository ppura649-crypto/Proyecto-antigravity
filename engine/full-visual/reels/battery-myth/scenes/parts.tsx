// Kit Visual V2 High-Energy Cyber-Lab / Myth-Busting a 60 fps (Español · Multi-Red 1080x1920).
import React from "react";
import { Img, staticFile } from "remotion";
import { arrive, ease, pop, prog, useScene } from "../../../src/engine";

export const SLUG = "battery-myth";
export const asset = (name: string) => staticFile(`${SLUG}/${name}`);
export const STAGE = { left: 108, width: 864, safeWidth: 864, top: 522, bottom: 1450, cx: 540 };

export const TECH = {
  crimson: "#FF1E56",
  crimsonGlow: "rgba(255, 30, 86, 0.42)",
  crimsonSoft: "rgba(255, 30, 86, 0.20)",
  amber: "#FFB800",
  amberGlow: "rgba(255, 184, 0, 0.38)",
  amberSoft: "rgba(255, 184, 0, 0.20)",
  cyan: "#00D2FF",
  cyanBright: "#00F0FF",
  cyanGlow: "rgba(0, 240, 255, 0.40)",
  cyanSoft: "rgba(0, 210, 255, 0.18)",
  emerald: "#00E699",
  emeraldGlow: "rgba(0, 230, 153, 0.42)",
  emeraldSoft: "rgba(0, 230, 153, 0.20)",
  darkCard: "#0E1626",
  darkDeep: "#070B14",
  lightCard: "#FFFFFF",
  borderDark: "rgba(148, 163, 184, 0.26)",
  borderLight: "#CBD5E1",
};

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/**
 * Rig de impacto cinético: micro-sacudida de cámara amortiguada + zoom de golpe en frames clave.
 */
export const ImpactRig: React.FC<{ triggers: number[]; intensity?: number; children: React.ReactNode }> = ({
  triggers,
  intensity = 10,
  children,
}) => {
  const { f } = useScene();
  let dx = 0;
  let dy = 0;
  let boost = 0;
  for (const t of triggers) {
    const dt = f - t;
    if (dt >= 0 && dt <= 12) {
      const decay = Math.exp(-dt * 0.28);
      dx += Math.sin(dt * 2.4) * intensity * decay;
      dy += Math.cos(dt * 3.1) * (intensity * 0.75) * decay;
      boost = Math.max(boost, 0.016 * decay);
    }
  }
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform:
          dx !== 0 || dy !== 0 || boost !== 0
            ? `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${(1 + boost).toFixed(4)})`
            : undefined,
        transformOrigin: "540px 980px",
      }}
    >
      {children}
    </div>
  );
};

/**
 * Onda expansiva de choque + 12 chispas radiales a 60 fps en golpes visuales.
 */
export const ShockwaveBurst: React.FC<{ at: number; x?: number; y?: number; color?: string; size?: number }> = ({
  at,
  x = 540,
  y = 840,
  color = TECH.cyanBright,
  size = 250,
}) => {
  const { f } = useScene();
  const dt = f - at;
  if (dt < 0 || dt > 24) return null;
  const p = prog(f, at, 22, ease.out);
  const fade = 1 - prog(f, at + 5, 19, ease.in);
  const r = lerp(24, size, p);

  return (
    <svg
      width={size * 2.4}
      height={size * 2.4}
      viewBox={`${-size * 1.2} ${-size * 1.2} ${size * 2.4} ${size * 2.4}`}
      style={{
        position: "absolute",
        left: x - size * 1.2,
        top: y - size * 1.2,
        pointerEvents: "none",
        zIndex: 40,
        opacity: fade,
      }}
    >
      <circle cx={0} cy={0} r={r} fill="none" stroke={color} strokeWidth={lerp(12, 2, p)} />
      <circle cx={0} cy={0} r={r * 0.68} fill="none" stroke="#FFFFFF" strokeWidth={lerp(6, 1, p)} opacity={0.75} />
      {Array.from({ length: 12 }).map((_, i) => {
        const ang = (i / 12) * Math.PI * 2 + 0.2;
        const r1 = lerp(18, size * 0.65, p);
        const r2 = lerp(42, size * 1.08, p);
        return (
          <line
            key={i}
            x1={Math.cos(ang) * r1}
            y1={Math.sin(ang) * r1}
            x2={Math.cos(ang) * r2}
            y2={Math.sin(ang) * r2}
            stroke={i % 2 === 0 ? color : "#FFFFFF"}
            strokeWidth={lerp(6, 2, p)}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

const NODES = [
  { x: 115, y: 555, r: 22, sp: 0.052, ph: 0.3, c: "rgba(0, 240, 255, 0.28)" },
  { x: 940, y: 615, r: 26, sp: 0.044, ph: 1.5, c: "rgba(255, 30, 86, 0.28)" },
  { x: 145, y: 980, r: 19, sp: 0.058, ph: 2.8, c: "rgba(0, 230, 153, 0.28)" },
  { x: 920, y: 1055, r: 24, sp: 0.049, ph: 3.9, c: "rgba(0, 240, 255, 0.28)" },
  { x: 215, y: 1385, r: 22, sp: 0.041, ph: 4.7, c: "rgba(255, 184, 0, 0.26)" },
  { x: 865, y: 1400, r: 20, sp: 0.053, ph: 5.5, c: "rgba(0, 230, 153, 0.26)" },
];

/**
 * Atmósfera neón de laboratorio + pulso energético de alta saturación a 60 fps.
 */
export const TechLabBackdrop: React.FC<{ alert?: boolean; emerald?: boolean }> = ({
  alert = false,
  emerald = false,
}) => {
  const { f, scene } = useScene();
  const dark = scene.ground === "dark";
  const breath = 0.92 + 0.11 * Math.sin(f * 0.09);
  const glow = alert
    ? "radial-gradient(circle, rgba(255,30,86,0.28) 0%, rgba(255,184,0,0.12) 44%, rgba(0,0,0,0) 72%)"
    : emerald
      ? "radial-gradient(circle, rgba(0,230,153,0.25) 0%, rgba(0,240,255,0.11) 46%, rgba(0,0,0,0) 72%)"
      : dark
        ? "radial-gradient(circle, rgba(0,240,255,0.24) 0%, rgba(0,230,153,0.10) 46%, rgba(0,0,0,0) 72%)"
        : "radial-gradient(circle, rgba(0,210,255,0.18) 0%, rgba(0,230,153,0.09) 46%, rgba(255,255,255,0) 74%)";

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 70,
          top: 490,
          width: 940,
          height: 960,
          background: glow,
          transform: `scale(${breath.toFixed(4)})`,
        }}
      />
      {NODES.map((p, idx) => {
        const dx = Math.sin(f * p.sp + p.ph) * 34;
        const dy = Math.cos(f * p.sp * 0.95 + p.ph) * 36;
        const op = 0.6 + 0.4 * Math.sin(f * 0.1 + idx);
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
              background: alert && idx % 2 === 0 ? "rgba(255, 30, 86, 0.34)" : p.c,
              filter: "blur(4px)",
              opacity: op,
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * Brasas térmicas ascendentes + pulso de alerta roja a 60 fps cuando hay sobrecalentamiento.
 */
export const ThermalEmbersOverlay: React.FC<{ active?: boolean }> = ({ active = true }) => {
  const { f } = useScene();
  if (!active) return null;
  const pulse = 0.45 + 0.35 * Math.sin(f * 0.16);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: `inset 0 0 46px rgba(255, 30, 86, ${pulse.toFixed(3)})`,
        }}
      />
      {Array.from({ length: 14 }).map((_, i) => {
        const seed = i * 61.7;
        const cycle = ((f * (1.8 + (i % 4) * 0.45) + seed) % 220) / 220;
        const x = 40 + ((i * 67) % 780) + Math.sin(f * 0.12 + i) * 24;
        const y = lerp(395, -20, cycle);
        const sz = 7 + (i % 4) * 3.5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: sz,
              height: sz,
              borderRadius: 999,
              background: i % 2 === 0 ? "#FF1E56" : "#FFB800",
              boxShadow: `0 0 14px ${i % 2 === 0 ? "#FF1E56" : "#FFB800"}`,
              opacity: (1 - cycle) * 0.92,
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * Arcos eléctricos animados en SVG a 60 fps para escenas de corriente / carga rápida.
 */
export const ElectricArcOverlay: React.FC<{ active?: boolean; color?: string }> = ({
  active = true,
  color = TECH.cyanBright,
}) => {
  const { f } = useScene();
  if (!active) return null;
  const mkBolt = (yBase: number, phase: number) => {
    const pts: string[] = [];
    for (let s = 0; s <= 8; s++) {
      const x = 40 + s * 98;
      const jit = s === 0 || s === 8 ? 0 : Math.sin(f * 0.65 + s * 2.1 + phase) * 26;
      pts.push(`${x.toFixed(1)},${(yBase + jit).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const showA = f % 5 !== 0;
  const showB = (f + 2) % 6 !== 0;
  return (
    <svg
      width={864}
      height={404}
      viewBox="0 0 864 404"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.85 }}
    >
      {showA && (
        <polyline
          points={mkBolt(190, 0.4)}
          fill="none"
          stroke={color}
          strokeWidth={4.5}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      )}
      {showB && (
        <polyline
          points={mkBolt(230, 2.7)}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={0.8}
        />
      )}
    </svg>
  );
};

/**
 * Esquinas HUD luminosas tipo banco de pruebas de hardware.
 */
const HudCorners: React.FC<{ color: string }> = ({ color }) => {
  const s = 26;
  const b = `4px solid ${color}`;
  return (
    <>
      <div style={{ position: "absolute", left: 10, top: 10, width: s, height: s, borderLeft: b, borderTop: b, borderTopLeftRadius: 10, pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 10, top: 10, width: s, height: s, borderRight: b, borderTop: b, borderTopRightRadius: 10, pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 10, bottom: 10, width: s, height: s, borderLeft: b, borderBottom: b, borderBottomLeftRadius: 10, pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 10, bottom: 10, width: s, height: s, borderRight: b, borderBottom: b, borderBottomRightRadius: 10, pointerEvents: "none" }} />
    </>
  );
};

/**
 * Icono animado de celda de batería con pulso de carga / alerta térmica.
 */
export const BatteryPulseIcon: React.FC<{ pct: number; status: "safe" | "warn" | "myth" }> = ({ pct, status }) => {
  const { f } = useScene();
  const pulse = 1 + 0.08 * Math.sin(f * 0.16);
  const fillCol = status === "myth" || status === "warn" ? TECH.crimson : pct >= 75 ? TECH.emerald : TECH.cyanBright;

  return (
    <div style={{ width: 68, height: 64, flex: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={68} height={64} viewBox="0 0 100 90" style={{ display: "block", overflow: "visible" }}>
        <g transform={`translate(50,45) scale(${pulse.toFixed(3)}) translate(-50,-45)`}>
          <rect x="8" y="20" width="76" height="50" rx="12" fill="none" stroke={fillCol} strokeWidth="6.5" />
          <rect x="88" y="34" width="7" height="22" rx="3.5" fill={fillCol} />
          <rect
            x="16"
            y="28"
            width={Math.max(8, Math.min(60, (60 * pct) / 100))}
            height="34"
            rx="7"
            fill={fillCol}
          />
        </g>
      </svg>
    </div>
  );
};

/**
 * Barra superior continua de Telemetría HUD (y = 526, altura = 96 px).
 */
export const TechTelemetryStrip: React.FC<{
  at: number;
  label: string;
  verdict: string;
  pct: number;
  status?: "safe" | "warn" | "myth";
}> = ({ at, label, verdict, pct, status = "safe" }) => {
  const { f, theme, ground, scene } = useScene();
  const dark = scene.ground === "dark";
  const k = arrive(f, at, 14);
  const y = (1 - k) * -68;
  const clamped = Math.max(0, Math.min(100, pct));

  const accent = status === "myth" || status === "warn" ? TECH.crimson : TECH.emerald;
  const badgeBg = status === "myth" || status === "warn" ? TECH.crimson : TECH.emerald;
  const badgeInk = status === "myth" || status === "warn" ? "#FFFFFF" : "#042217";
  const barBg =
    status === "myth" || status === "warn"
      ? "linear-gradient(90deg, #FFB800 0%, #FF1E56 100%)"
      : "linear-gradient(90deg, #00F0FF 0%, #00E699 100%)";

  return (
    <div
      style={{
        position: "absolute",
        left: STAGE.left,
        top: 526,
        width: STAGE.safeWidth,
        height: 96,
        borderRadius: 24,
        padding: "0 22px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: dark ? "rgba(14, 22, 38, 0.96)" : TECH.lightCard,
        boxShadow: dark
          ? `0 18px 44px rgba(0,0,0,0.58), 0 0 24px ${status === "warn" ? "rgba(255,30,86,0.22)" : "rgba(0,240,255,0.16)"}, inset 0 0 0 2.5px ${accent}`
          : `0 16px 38px rgba(15, 23, 42, 0.11), inset 0 0 0 2.5px ${accent}`,
        opacity: prog(f, at, 4, ease.linear),
        transform: `translateY(${y.toFixed(1)}px)`,
        zIndex: 15,
      }}
    >
      <BatteryPulseIcon pct={clamped} status={status} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, color: ground.ink }}>
            {label}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                padding: "3px 15px",
                borderRadius: 999,
                background: badgeBg,
                color: badgeInk,
                fontFamily: theme.font.mono,
                fontSize: 32,
                fontWeight: 800,
              }}
            >
              {verdict}
            </span>
            <span
              style={{
                fontFamily: theme.font.mono,
                fontSize: 34,
                fontWeight: 800,
                fontVariantNumeric: "tabular-nums",
                color: status === "warn" ? TECH.crimson : dark ? TECH.emerald : "#059669",
              }}
            >
              {Math.round(clamped)}%
            </span>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            height: 14,
            borderRadius: 999,
            background: dark ? "rgba(255,255,255,0.12)" : "#E2E8F0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.max(clamped, 8)}%`,
              height: "100%",
              borderRadius: 999,
              background: barBg,
              boxShadow: `0 0 14px ${accent}`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Escenario de DOBLE ILUSTRACIÓN por escena (14 ilustraciones en ~48s):
 * - Modo "whip": barrido láser diagonal de alta velocidad de srcA -> srcB + miniatura PiP comparativa de srcA.
 * - Modo "split": duelo 50/50 en pantalla dividida donde srcA se desliza a la izquierda y srcB impacta a la derecha.
 */
export const DualIllustrationStage: React.FC<{
  srcA: string;
  srcB: string;
  at: number;
  flipAt: number;
  mode?: "whip" | "split";
  top?: number;
  height?: number;
  accentA?: string;
  accentB?: string;
  showPip?: boolean;
  vfx?: React.ReactNode;
  children?: React.ReactNode;
}> = ({
  srcA,
  srcB,
  at,
  flipAt,
  mode = "whip",
  top = 636,
  height = 404,
  accentA = TECH.cyanBright,
  accentB = TECH.crimson,
  showPip = true,
  vfx,
  children,
}) => {
  const { f, scene } = useScene();
  const dark = scene.ground === "dark";
  const kIn = arrive(f, at, 15);
  const yEnter = (1 - kIn) * 115;
  const span = Math.max(60, scene.to - scene.from);
  const p = prog(f, scene.from - 6, span + 18, ease.linear);
  const scA = lerp(1.06, 1.19, p);
  const txA = lerp(-14, 14, p);
  const scB = lerp(1.16, 1.05, prog(f, flipAt - 2, 70, ease.out));
  const txB = lerp(16, -8, prog(f, flipAt - 2, 70, ease.out));

  const kFlip = prog(f, flipAt - 2, 13, ease.out);
  const flipped = f >= flipAt - 2;
  const activeAccent = flipped ? accentB : accentA;
  const flash = flipped ? (1 - prog(f, flipAt - 2, 12, ease.out)) * 0.65 : 0;

  // Escáner láser óptico rápido cada 80 frames (1.33 s)
  const cycle = ((f - scene.from + 120) % 80) / 80;
  const scanX = lerp(-35, 125, cycle);

  const wipePct = kFlip * 118;

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
        background: dark ? "#070B14" : "#CBD5E1",
        boxShadow: dark
          ? `0 24px 58px rgba(0,0,0,0.62), 0 0 28px ${flipped ? "rgba(255,30,86,0.24)" : "rgba(0,240,255,0.20)"}, inset 0 0 0 3px ${activeAccent}`
          : `0 22px 52px rgba(15, 23, 42, 0.16), inset 0 0 0 3px ${activeAccent}`,
        opacity: prog(f, at, 4, ease.linear),
        transform: `translateY(${yEnter.toFixed(1)}px)`,
      }}
    >
      {mode === "whip" ? (
        <>
          <Img
            src={asset(srcA)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${scA.toFixed(4)}) translate(${txA.toFixed(2)}px, 0px)`,
            }}
          />
          {kFlip > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                clipPath: `polygon(0% 0%, ${wipePct.toFixed(1)}% 0%, ${Math.max(0, wipePct - 14).toFixed(1)}% 100%, 0% 100%)`,
              }}
            >
              <Img
                src={asset(srcB)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${scB.toFixed(4)}) translate(${txB.toFixed(2)}px, 0px)`,
                }}
              />
            </div>
          )}
          {/* Haz láser del borde de barrido */}
          {kFlip > 0.02 && kFlip < 0.98 && (
            <div
              style={{
                position: "absolute",
                top: -20,
                bottom: -20,
                left: `${(wipePct - 7).toFixed(1)}%`,
                width: 12,
                background: "#FFFFFF",
                boxShadow: `0 0 28px 10px ${accentB}`,
                transform: "skewX(-12deg)",
                pointerEvents: "none",
              }}
            />
          )}
          {/* Miniatura PiP comparativa de Ilustración A en la esquina inferior derecha */}
          {showPip && kFlip >= 0.6 && (
            <div
              style={{
                position: "absolute",
                right: 16,
                bottom: 14,
                width: 174,
                height: 100,
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: `0 12px 28px rgba(0,0,0,0.7), 0 0 0 3px ${accentA}`,
                zIndex: 14,
                ...pop(f, flipAt + 4, { dur: 10, from: 0.78 }),
              }}
            >
              <Img
                src={asset(srcA)}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          )}
        </>
      ) : (
        <>
          {/* Modo SPLIT 50/50: srcA se encuadra a la izquierda mientras srcB entra a la derecha */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${lerp(100, 50, kFlip).toFixed(2)}%`,
              overflow: "hidden",
            }}
          >
            <Img
              src={asset(srcA)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${scA.toFixed(4)})`,
              }}
            />
          </div>
          {kFlip > 0.01 && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: `${(50 * kFlip).toFixed(2)}%`,
                overflow: "hidden",
                borderLeft: `5px solid ${accentB}`,
              }}
            >
              <Img
                src={asset(srcB)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${scB.toFixed(4)})`,
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Capa VFX de partículas / rayos / brasas */}
      {vfx}

      {/* Haz de escaneo óptico de alta velocidad */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${scanX.toFixed(1)}%`,
          width: "26%",
          background: `linear-gradient(105deg, rgba(255,255,255,0) 0%, ${
            flipped ? "rgba(255, 30, 86, 0.30)" : "rgba(0, 240, 255, 0.30)"
          } 52%, rgba(255,255,255,0) 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* Viñeta cinematográfica para contraste perfecto de pills */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(6,9,17,0.44) 0%, rgba(6,9,17,0.04) 48%, rgba(6,9,17,0.68) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Flash de impacto en el cambio de ilustración */}
      {flash > 0.01 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#FFFFFF",
            opacity: flash,
            pointerEvents: "none",
          }}
        />
      )}

      <HudCorners color={activeAccent} />
      {children}
    </div>
  );
};

/**
 * Sello cinético tipo golpe ("MITO DESTRUIDO", "CORTE 0.0 W", etc.) con resplandor neón.
 */
export const KineticStamp: React.FC<{
  at: number;
  text: string;
  bg?: string;
  ink?: string;
  tilt?: number;
  bottom?: number;
}> = ({ at, text, bg = TECH.emerald, ink = "#042217", tilt = -3, bottom = 14 }) => {
  const { f, theme } = useScene();
  if (f < at) return null;
  const p = prog(f, at, 9, ease.out);
  const sc = lerp(1.55, 1.0, p);
  return (
    <div
      style={{
        position: "absolute",
        left: 18,
        bottom,
        maxWidth: 635,
        padding: "9px 20px",
        borderRadius: 16,
        background: bg,
        boxShadow: `0 12px 30px rgba(0,0,0,0.58), 0 0 22px ${bg}, inset 0 0 0 2.5px rgba(255,255,255,0.45)`,
        fontFamily: theme.font.ui,
        fontSize: 32,
        fontWeight: 900,
        color: ink,
        transform: `rotate(${tilt}deg) scale(${sc.toFixed(3)})`,
        transformOrigin: "left bottom",
        zIndex: 16,
      }}
    >
      {text}
    </div>
  );
};

/**
 * Encabezado de tarjeta de evidencia técnica (fuente/etiqueta + título + estado, >= 32 px).
 */
export const EvidenceHeader: React.FC<{
  tag: string;
  title: string;
  rightText: string;
  accent?: string;
}> = ({ tag, title, rightText, accent = TECH.cyan }) => {
  const { theme, ground, scene } = useScene();
  const dark = scene.ground === "dark";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 12,
        borderBottom: `2px solid ${dark ? "rgba(148,163,184,0.22)" : "#E2E8F0"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            padding: "5px 15px",
            borderRadius: 12,
            background: accent,
            color: accent === TECH.emerald || accent === TECH.amber || accent === TECH.cyanBright ? "#041622" : "#FFFFFF",
            fontFamily: theme.font.mono,
            fontSize: 32,
            fontWeight: 900,
          }}
        >
          {tag}
        </span>
        <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 800, color: ground.ink }}>
          {title}
        </span>
      </div>
      <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 900, color: accent }}>
        {rightText}
      </span>
    </div>
  );
};
