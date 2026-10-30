// Escena 1: `hook`, dark (Doble Ilustración: Carga nocturna tranquila -> Batería al rojo vivo con chispas)
// "Dejar cargando tu celular toda la noche no daña la batería, pero estos 2 hábitos diarios sí."
import React from "react";
import { arrive, countTo, ease, pop, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import {
  DualIllustrationStage,
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
  const c2 = cue("2");
  const cSi = cue("sí");

  const strikeW = prog(f, cNo - 2, 10, ease.out) * 100;
  const chargePct = f >= c2 - 2 ? Math.round(countTo(f, c2 - 2, 18, 100, 14)) : Math.round(countTo(f, t0 + 3, 28, 82, 100));
  const alertMode = f >= c2 - 2;

  return (
    <ImpactRig triggers={[cNo - 2, c2 - 2]} intensity={11}>
      <TechLabBackdrop alert={alertMode} emerald={!alertMode && f >= cNo - 2} />

      <TechTelemetryStrip
        at={t0}
        label={alertMode ? "ALERTA · HÁBITOS REALES" : "CARGA NOCTURNA"}
        verdict={alertMode ? "2 ASESINOS" : f >= cNo - 2 ? "MITO FALSO" : "TESTEANDO"}
        pct={chargePct}
        status={alertMode ? "warn" : "safe"}
      />

      <DualIllustrationStage
        srcA="tech-01.jpg"
        srcB="tech-08.jpg"
        at={t0 + 2}
        flipAt={c2 - 2}
        mode="whip"
        top={636}
        height={404}
        accentA={f >= cNo - 2 ? TECH.emerald : TECH.cyanBright}
        accentB={TECH.crimson}
        vfx={<ThermalEmbersOverlay active={alertMode} />}
      >
        {/* Píldora superior izquierda: Creencia popular tachada en vivo en "no" */}
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
              {alertMode ? "PELIGRO REAL ACTIVO" : "CARGAR TODA LA NOCHE"}
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

        {/* Sello cinético que cambia de MITO DESTRUIDO -> 2 HÁBITOS LETALES */}
        {!alertMode ? (
          <KineticStamp
            at={cNo - 2}
            text="✓ MITO DESTRUIDO · 100% SEGURO"
            bg={TECH.emerald}
            ink="#042217"
            tilt={-2.5}
          />
        ) : (
          <KineticStamp
            at={c2 - 2}
            text="⚠️ ESTOS 2 SÍ DEGRADAN TU CELULAR"
            bg={TECH.crimson}
            ink="#FFFFFF"
            tilt={-2}
          />
        )}
      </DualIllustrationStage>

      <ShockwaveBurst at={cNo - 2} x={430} y={960} color={TECH.emerald} size={230} />
      <ShockwaveBurst at={c2 - 2} x={540} y={840} color={TECH.crimson} size={290} />

      {/* Tarjeta inferior de alto voltaje: Los 2 hábitos culpables con medidores dinámicos */}
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
          tag="VEREDICTO"
          title="Lo que SÍ mata tu batería"
          rightText={f >= cSi - 2 ? "CONFIRMADO" : "2 CAUSAS"}
          accent={TECH.crimson}
        />

        <div style={{ display: "flex", gap: 16 }}>
          {[
            { num: "01", title: "Calor > 35°C", sub: "Almohada o juego", meter: 92 },
            { num: "02", title: "Agotar a 0%", sub: " Pierdes 60% ciclos", meter: 86 },
          ].map((item, idx) => {
            const trig = c2 - 2 + idx * 5;
            const active = f >= trig;
            const fillW = active ? prog(f, trig, 16, ease.out) * item.meter : 18;
            return (
              <div
                key={item.num}
                style={{
                  flex: 1,
                  padding: "16px 20px",
                  borderRadius: 22,
                  background: active
                    ? "linear-gradient(145deg, rgba(255,30,86,0.24) 0%, rgba(255,184,0,0.08) 100%)"
                    : "rgba(255,255,255,0.04)",
                  boxShadow: `inset 0 0 0 2.5px ${active ? TECH.crimson : TECH.borderDark}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  ...(active ? pop(f, trig, { dur: 10, from: 0.86 }) : {}),
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 900, color: "#FDA4AF" }}>
                    ASESINO {item.num}
                  </span>
                  <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 900, color: TECH.amber }}>
                    {active ? "⚠️" : "🔒"}
                  </span>
                </div>
                <span style={{ fontFamily: theme.font.ui, fontSize: 38, fontWeight: 900, color: ground.ink }}>
                  {active ? item.title : "Analizando..."}
                </span>
                <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: ground.dim }}>
                  {active ? item.sub : "Espera el giro"}
                </span>
                <div
                  style={{
                    width: "100%",
                    height: 12,
                    borderRadius: 99,
                    background: "rgba(255,255,255,0.10)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${fillW.toFixed(1)}%`,
                      height: "100%",
                      borderRadius: 99,
                      background: active ? "linear-gradient(90deg, #FFB800 0%, #FF1E56 100%)" : TECH.cyan,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ImpactRig>
  );
};
