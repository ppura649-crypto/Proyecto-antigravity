// Escena 1: `hook`, dark (Doble Ilustración: Deslizar apps hacia arriba -> Procesador al rojo vivo con chispas)
// "Cerrar todas las apps de tu celular no ahorra batería, abrirlas desde cero gasta más."
import React from "react";
import { arrive, countTo, ease, pop, prog, useScene } from "../../../src/engine";
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

export const Hook: React.FC = () => {
  const { f, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const cNo = cue("no");
  const cDesde = cue("desde");
  const cMas = cue("más");

  const strikeW = prog(f, cNo - 2, 10, ease.out) * 100;
  const alertMode = f >= cDesde - 2;
  const cpuLoad = alertMode
    ? Math.round(countTo(f, cDesde - 2, 18, 12, 96))
    : Math.round(countTo(f, t0 + 3, 24, 48, 0));

  return (
    <ImpactRig triggers={[cNo - 2, cDesde - 2]} intensity={11}>
      <TechLabBackdrop alert={alertMode} emerald={!alertMode && f >= cNo - 2} />

      <TechTelemetryStrip
        at={t0}
        label={alertMode ? "ARRANQUE DESDE CERO" : "CERRAR APPS A MANO"}
        verdict={alertMode ? "GASTA 4x MÁS" : f >= cNo - 2 ? "MITO FALSO" : "ANALIZANDO"}
        pct={cpuLoad}
        unit="% CPU"
        status={alertMode ? "warn" : "safe"}
      />

      <DualIllustrationStage
        srcA="app-01.jpg"
        srcB="app-08.jpg"
        at={t0 + 2}
        flipAt={cDesde - 2}
        mode="whip"
        top={636}
        height={404}
        accentA={f >= cNo - 2 ? TECH.emerald : TECH.cyanBright}
        accentB={TECH.crimson}
        vfx={
          <>
            <ThermalEmbersOverlay active={alertMode} />
            <ElectricArcOverlay active={alertMode} color={TECH.crimson} />
          </>
        }
      >
        {/* Píldora superior izquierda tachada en vivo en "no" */}
        <div
          style={{
            position: "absolute",
            left: 18,
            top: 16,
            padding: "8px 18px",
            borderRadius: 14,
            background: "rgba(7, 11, 20, 0.92)",
            boxShadow: `inset 0 0 0 2.5px ${f >= cNo - 2 ? TECH.crimson : TECH.cyanBright}`,
            display: "flex",
            alignItems: "center",
            zIndex: 15,
          }}
        >
          <div style={{ position: "relative" }}>
            <span
              style={{
                fontFamily: theme.font.mono,
                fontSize: 32,
                fontWeight: 900,
                color: f >= cNo - 2 ? "#FDA4AF" : "#FFFFFF",
              }}
            >
              {alertMode ? "PICO DE CPU AL REABRIR" : "CERRAR APPS = AHORRO"}
            </span>
            {!alertMode && (
              <div
                style={{
                  position: "absolute",
                  left: -4,
                  top: "51%",
                  width: `${strikeW.toFixed(1)}%`,
                  height: 6,
                  borderRadius: 99,
                  background: TECH.crimson,
                  boxShadow: `0 0 12px ${TECH.crimson}`,
                }}
              />
            )}
          </div>
        </div>

        {!alertMode ? (
          <KineticStamp
            at={cNo - 2}
            text="✗ MITO FALSO · NO AHORRA NADA"
            bg={TECH.emerald}
            ink="#042217"
            tilt={-2.5}
          />
        ) : (
          <KineticStamp
            at={cDesde - 2}
            text="🔥 ABRIR DESDE CERO GASTA MÁS"
            bg={TECH.crimson}
            ink="#FFFFFF"
            tilt={-2}
          />
        )}
      </DualIllustrationStage>

      <ShockwaveBurst at={cNo - 2} x={430} y={960} color={TECH.emerald} size={230} />
      <ShockwaveBurst at={cDesde - 2} x={540} y={840} color={TECH.crimson} size={290} />

      {/* Tarjeta inferior: Duelo directo Pausa en RAM vs Cerrar y Reabrir */}
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
          boxShadow: `0 24px 58px rgba(0,0,0,0.58), 0 0 26px ${
            alertMode ? "rgba(255,30,86,0.22)" : "rgba(0,240,255,0.12)"
          }, inset 0 0 0 2.5px ${alertMode ? TECH.crimson : TECH.borderDark}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 4, 15)) * 105).toFixed(1)}px)`,
          opacity: prog(f, t0 + 4, 4, ease.linear),
        }}
      >
        <EvidenceHeader
          tag="PRUEBA"
          title="Consumo Real al Volver"
          rightText={f >= cMas - 2 ? "4x PICO" : "COMPARATIVA"}
          accent={alertMode ? TECH.crimson : TECH.emerald}
        />

        <div style={{ display: "flex", gap: 16 }}>
          {/* Columna 1: Dejar en segundo plano */}
          <div
            style={{
              flex: 1,
              padding: "16px 20px",
              borderRadius: 22,
              background: "linear-gradient(145deg, rgba(0,230,153,0.18) 0%, rgba(0,240,255,0.06) 100%)",
              boxShadow: `inset 0 0 0 2.5px ${TECH.emerald}`,
              display: "flex",
              flexDirection: "column",
              gap: 9,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 900, color: TECH.emerald }}>
                SIN CERRAR
              </span>
              <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 900, color: TECH.emerald }}>
                🧊
              </span>
            </div>
            <span style={{ fontFamily: theme.font.ui, fontSize: 38, fontWeight: 900, color: ground.ink }}>
              0% CPU
            </span>
            <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: ground.dim }}>
              Congelada en RAM
            </span>
            <div style={{ width: "100%", height: 12, borderRadius: 99, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
              <div style={{ width: "12%", height: "100%", borderRadius: 99, background: TECH.emerald }} />
            </div>
          </div>

          {/* Columna 2: Cerrar y abrir desde cero */}
          <div
            style={{
              flex: 1,
              padding: "16px 20px",
              borderRadius: 22,
              background: alertMode
                ? "linear-gradient(145deg, rgba(255,30,86,0.26) 0%, rgba(255,184,0,0.09) 100%)"
                : "rgba(255,255,255,0.04)",
              boxShadow: `inset 0 0 0 2.5px ${alertMode ? TECH.crimson : TECH.borderDark}`,
              display: "flex",
              flexDirection: "column",
              gap: 9,
              ...(alertMode ? pop(f, cDesde - 2, { dur: 10, from: 0.86 }) : {}),
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 900, color: "#FDA4AF" }}>
                CERRAR + ABRIR
              </span>
              <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 900, color: TECH.amber }}>
                {alertMode ? "🔥" : "⏳"}
              </span>
            </div>
            <span style={{ fontFamily: theme.font.ui, fontSize: 38, fontWeight: 900, color: ground.ink }}>
              {alertMode ? "96% PICO" : "Midiendo..."}
            </span>
            <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: ground.dim }}>
              {alertMode ? "Recarga total Flash" : "Espera el dato"}
            </span>
            <div style={{ width: "100%", height: 12, borderRadius: 99, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
              <div
                style={{
                  width: `${(alertMode ? prog(f, cDesde - 2, 16, ease.out) * 96 : 16).toFixed(1)}%`,
                  height: "100%",
                  borderRadius: 99,
                  background: alertMode ? "linear-gradient(90deg, #FFB800 0%, #FF1E56 100%)" : TECH.cyan,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </ImpactRig>
  );
};
