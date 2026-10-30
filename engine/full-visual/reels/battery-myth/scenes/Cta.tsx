// Escena 7: `cta`, dark (Doble Ilustración en Split 50/50 + Anillo SVG de Salud 91% + Debate en Comentarios + Loop)
// "Revisa hoy la salud de tu batería, escribe tu porcentaje en comentarios y recuerda esto:"
import React from "react";
import { Cursor, arrive, countTo, ease, prog, typeOn, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import {
  DualIllustrationStage,
  ImpactRig,
  ShockwaveBurst,
  STAGE,
  TECH,
  TechLabBackdrop,
} from "./parts";

export const Cta: React.FC = () => {
  const { f, fps, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const cSalud = cue("salud");
  const cPorcentaje = cue("porcentaje");
  const cComentarios = cue("comentarios");
  const cEsto = cue("esto");

  const healthPct = Math.round(countTo(f, cSalud - 4, 22, 100, 91));
  const typed = typeOn("91% · Equipo 20-80", f, cPorcentaje - 2, fps, 42);
  const posted = f >= cEsto - 4;
  const ringCirc = 2 * Math.PI * 56;

  return (
    <ImpactRig triggers={[cEsto - 4]} intensity={10}>
      <TechLabBackdrop emerald={posted} />

      <DualIllustrationStage
        srcA="tech-07.jpg"
        srcB="tech-14.jpg"
        at={t0}
        flipAt={cPorcentaje - 4}
        mode="split"
        top={526}
        height={336}
        accentA={TECH.cyanBright}
        accentB={TECH.emerald}
      >
        <div
          style={{
            position: "absolute",
            left: 16,
            bottom: 14,
            padding: "7px 18px",
            borderRadius: 14,
            background: "rgba(7, 11, 20, 0.92)",
            boxShadow: `inset 0 0 0 2.5px ${TECH.emerald}`,
            fontFamily: theme.font.ui,
            fontSize: 32,
            fontWeight: 900,
            color: TECH.emerald,
            zIndex: 15,
          }}
        >
          🔋 Ajustes → Batería → Condición
        </div>
      </DualIllustrationStage>

      <ShockwaveBurst at={cEsto - 4} x={820} y={1270} color={TECH.emerald} size={240} />

      {/* Panel de Salud de Batería con Anillo SVG a 60 fps + Duelo de Equipos */}
      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 876,
          width: STAGE.safeWidth,
          height: 230,
          borderRadius: 26,
          padding: "18px 24px",
          boxSizing: "border-box",
          background: TECH.darkCard,
          boxShadow: `0 18px 46px rgba(0,0,0,0.52), inset 0 0 0 2.5px ${TECH.emerald}`,
          display: "flex",
          alignItems: "center",
          gap: 22,
          transform: `translateY(${((1 - arrive(f, t0 + 3, 15)) * 90).toFixed(1)}px)`,
          opacity: prog(f, t0 + 3, 4, ease.linear),
        }}
      >
        {/* Anillo circular SVG 91% */}
        <div style={{ position: "relative", width: 140, height: 140, flex: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
            <circle cx={70} cy={70} r={56} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={13} />
            <circle
              cx={70}
              cy={70}
              r={56}
              fill="none"
              stroke={TECH.emerald}
              strokeWidth={13}
              strokeLinecap="round"
              strokeDasharray={ringCirc}
              strokeDashoffset={ringCirc * (1 - healthPct / 100)}
            />
          </svg>
          <span style={{ position: "absolute", fontFamily: theme.font.mono, fontSize: 34, fontWeight: 900, color: "#FFFFFF" }}>
            {healthPct}%
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 900, color: ground.ink }}>
            ¿En qué equipo estás hoy?
          </span>
          <div style={{ display: "flex", gap: 12 }}>
            <div
              style={{
                flex: 1,
                padding: "11px 12px",
                borderRadius: 16,
                background: TECH.crimsonSoft,
                boxShadow: `inset 0 0 0 2px ${TECH.crimson}`,
                fontFamily: theme.font.ui,
                fontSize: 32,
                fontWeight: 900,
                color: "#FDA4AF",
                textAlign: "center",
              }}
            >
              🪫 Equipo 1%
            </div>
            <div
              style={{
                flex: 1,
                padding: "11px 12px",
                borderRadius: 16,
                background: TECH.emeraldSoft,
                boxShadow: `inset 0 0 0 2px ${TECH.emerald}`,
                fontFamily: theme.font.ui,
                fontSize: 32,
                fontWeight: 900,
                color: TECH.emerald,
                textAlign: "center",
              }}
            >
              ⚡ 20–80%
            </div>
          </div>
        </div>
      </div>

      {/* Caja interactiva de Comentarios */}
      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 1120,
          width: STAGE.safeWidth,
          height: 312,
          borderRadius: 28,
          padding: "22px 26px",
          boxSizing: "border-box",
          background: TECH.darkCard,
          boxShadow: `0 24px 58px rgba(0,0,0,0.58), 0 0 26px rgba(0,240,255,0.20), inset 0 0 0 3px ${
            posted ? TECH.emerald : TECH.cyanBright
          }`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 6, 16)) * 105).toFixed(1)}px)`,
          opacity: prog(f, t0 + 6, 4, ease.linear),
        }}
      >
        <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 900, color: ground.ink }}>
          Comentarios · Pon tu % de salud abajo 👇
        </span>

        <div
          style={{
            height: 84,
            borderRadius: 999,
            padding: "0 14px 0 26px",
            background: TECH.darkDeep,
            boxShadow: `inset 0 0 0 2.5px ${f >= cPorcentaje - 2 ? TECH.cyanBright : TECH.borderDark}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: f >= cPorcentaje - 2 ? theme.font.mono : theme.font.ui,
              fontSize: 34,
              fontWeight: 900,
              color: f >= cPorcentaje - 2 ? "#FFFFFF" : ground.dim,
            }}
          >
            {f >= cPorcentaje - 2 ? `${typed.text}${typed.typing ? "|" : ""}` : "Escribe tu % aquí..."}
          </span>

          <div
            style={{
              height: 58,
              padding: "0 22px",
              borderRadius: 999,
              background: posted ? TECH.emerald : TECH.crimson,
              boxShadow: `0 0 18px ${posted ? TECH.emerald : TECH.crimson}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: theme.font.ui,
              fontSize: 32,
              fontWeight: 900,
              color: posted ? "#042217" : "#FFFFFF",
            }}
          >
            {posted ? "Publicado ✓" : "Publicar"}
          </div>
        </div>

        <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, color: posted ? TECH.emerald : ground.dim }}>
          {posted ? "✓ ¡Debate encendido! Y recuerda esto..." : "Compara tu % con otros en comentarios"}
        </span>
      </div>

      <Cursor
        path={[
          { f: cPorcentaje - 4, x: 850, y: 1450 },
          { f: cComentarios, x: 460, y: 1274 },
          { f: cEsto - 5, x: 825, y: 1274 },
          { f: cEsto + 12, x: 825, y: 1274 },
          { f: cEsto + 120, x: 880, y: 1350 },
        ]}
      />
    </ImpactRig>
  );
};
