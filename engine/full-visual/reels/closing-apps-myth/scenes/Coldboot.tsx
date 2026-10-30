// Escena 4: `coldboot`, dark (Doble Ilustración: Disparo Flash -> Cámara Térmica Infrarroja + Medidor Pico 96%)
// "Al cerrarla a la fuerza la borras de la memoria, y al volver a abrirla disparas un pico de procesador y batería recargando todo desde cero."
import React from "react";
import { arrive, countTo, ease, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import {
  DualIllustrationStage,
  ElectricArcOverlay,
  EvidenceHeader,
  ImpactRig,
  KineticStamp,
  ShockwaveBurst,
  STAGE,
  TECH,
  TechLabBackdrop,
  TechTelemetryStrip,
  ThermalEmbersOverlay,
} from "./parts";

export const Coldboot: React.FC = () => {
  const { f, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const cBorras = cue("borras");
  const cPico = cue("pico");
  const cCero = cue("cero");

  const spiking = f >= cPico - 3;
  const cpuSpike = spiking
    ? Math.round(countTo(f, cPico - 3, 20, 28, 96))
    : Math.round(countTo(f, cBorras - 2, 16, 12, 28));

  return (
    <ImpactRig triggers={[cBorras - 2, cPico - 3, cCero - 2]} intensity={11}>
      <TechLabBackdrop alert={spiking} />

      <TechTelemetryStrip
        at={t0}
        label="ARRANQUE EN FRÍO (FLASH)"
        verdict={spiking ? "PICO CRÍTICO" : "RAM BORRADA"}
        pct={cpuSpike}
        unit="% CPU"
        status="warn"
      />

      <DualIllustrationStage
        srcA="app-04.jpg"
        srcB="app-11.jpg"
        at={t0 + 2}
        flipAt={cPico - 3}
        mode="whip"
        top={636}
        height={404}
        accentA={TECH.amber}
        accentB={TECH.crimson}
        vfx={
          <>
            <ThermalEmbersOverlay active={spiking} />
            <ElectricArcOverlay active={spiking} color={TECH.crimson} />
          </>
        }
      >
        <div
          style={{
            position: "absolute",
            left: 18,
            top: 16,
            padding: "8px 18px",
            borderRadius: 14,
            background: "rgba(7, 11, 20, 0.92)",
            boxShadow: `inset 0 0 0 2.5px ${spiking ? TECH.crimson : TECH.amber}`,
            fontFamily: theme.font.mono,
            fontSize: 32,
            fontWeight: 900,
            color: spiking ? "#FDA4AF" : TECH.amber,
            zIndex: 15,
          }}
        >
          {spiking ? `🔥 PICO TÉRMICO · ${cpuSpike}% CPU` : "🗑️ CACHÉ RAM ELIMINADA"}
        </div>

        <KineticStamp
          at={cCero - 4}
          text="💥 RECARGA TOTAL DESDE CERO"
          bg={TECH.crimson}
          ink="#FFFFFF"
          tilt={-2}
        />
      </DualIllustrationStage>

      <ShockwaveBurst at={cPico - 3} x={540} y={840} color={TECH.crimson} size={285} />

      {/* Tarjeta inferior: Medidor de barras comparativo Reanudar RAM vs Arranque en Frío */}
      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 1054,
          width: STAGE.safeWidth,
          height: 382,
          borderRadius: 28,
          padding: "20px 26px",
          boxSizing: "border-box",
          background: TECH.darkCard,
          boxShadow: `0 24px 58px rgba(0,0,0,0.58), 0 0 28px rgba(255,30,86,0.22), inset 0 0 0 3px ${
            spiking ? TECH.crimson : TECH.amber
          }`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 4, 15)) * 105).toFixed(1)}px)`,
          opacity: prog(f, t0 + 4, 4, ease.linear),
        }}
      >
        <EvidenceHeader
          tag="ENERGÍA"
          title="Costo de Reabrir App"
          rightText={spiking ? "+320% GASTO" : "FLASH → RAM"}
          accent={TECH.crimson}
        />

        {/* Barra 1: Reanudar desde RAM */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: theme.font.ui, fontSize: 33, fontWeight: 800, color: ground.ink }}>
              🧊 Reanudar desde RAM
            </span>
            <span style={{ fontFamily: theme.font.mono, fontSize: 33, fontWeight: 900, color: TECH.emerald }}>
              12% CPU · 0.1 s
            </span>
          </div>
          <div style={{ width: "100%", height: 26, borderRadius: 99, background: "rgba(255,255,255,0.09)", overflow: "hidden" }}>
            <div
              style={{
                width: "14%",
                height: "100%",
                borderRadius: 99,
                background: TECH.emerald,
                boxShadow: `0 0 14px ${TECH.emerald}`,
              }}
            />
          </div>
        </div>

        {/* Barra 2: Arranque en frío desde cero */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: theme.font.ui, fontSize: 33, fontWeight: 800, color: "#FDA4AF" }}>
              💥 Abrir tras Cerrar (Cero)
            </span>
            <span style={{ fontFamily: theme.font.mono, fontSize: 33, fontWeight: 900, color: TECH.crimson }}>
              {cpuSpike}% CPU · 1.8 s
            </span>
          </div>
          <div style={{ width: "100%", height: 26, borderRadius: 99, background: "rgba(255,255,255,0.09)", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.max(18, cpuSpike)}%`,
                height: "100%",
                borderRadius: 99,
                background: "linear-gradient(90deg, #FFB800 0%, #FF1E56 100%)",
                boxShadow: `0 0 18px ${TECH.crimson}`,
              }}
            />
          </div>
        </div>
      </div>
    </ImpactRig>
  );
};
