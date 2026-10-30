// Escena 5: `culprits`, dark (Doble Ilustración Split 50/50: Drenaje oculto bloqueado -> Cono de radar GPS "Siempre")
// "Lo que sí drena tu batería sin tocar el celular son 2 permisos ocultos: la actualización en segundo plano y el GPS activo en modo siempre."
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

export const Culprits: React.FC = () => {
  const { f, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const c2 = cue("2");
  const cAct = cue("actualización");
  const cGps = cue("GPS");
  const cSiempre = cue("siempre");

  const gpsActive = f >= cGps - 3;
  const battDrain = Math.round(countTo(f, t0 + 3, 42, 92, 54));

  return (
    <ImpactRig triggers={[c2 - 2, cAct - 2, cGps - 3]} intensity={10}>
      <TechLabBackdrop alert />

      <TechTelemetryStrip
        at={t0}
        label="DRENAJE CON PANTALLA APAGADA"
        verdict="2 VAMPIROS"
        pct={battDrain}
        unit="% BAT"
        status="warn"
      />

      <DualIllustrationStage
        srcA="app-05.jpg"
        srcB="app-12.jpg"
        at={t0 + 2}
        flipAt={cGps - 3}
        mode="split"
        top={636}
        height={404}
        accentA={TECH.amber}
        accentB={TECH.crimson}
        vfx={<ThermalEmbersOverlay active />}
      >
        <div
          style={{
            position: "absolute",
            left: 18,
            top: 16,
            padding: "8px 18px",
            borderRadius: 14,
            background: "rgba(7, 11, 20, 0.92)",
            boxShadow: `inset 0 0 0 2.5px ${TECH.crimson}`,
            fontFamily: theme.font.mono,
            fontSize: 32,
            fontWeight: 900,
            color: "#FDA4AF",
            zIndex: 15,
          }}
        >
          {gpsActive ? "📡 RASTREO GPS · ACTIVO 24/7" : "🪫 RED ACTIVA EN BOLSILLO"}
        </div>

        <KineticStamp
          at={cSiempre - 3}
          text="⚠️ ESTOS 2 SÍ VACÍAN TU BATERÍA"
          bg={TECH.crimson}
          ink="#FFFFFF"
          tilt={-2}
        />
      </DualIllustrationStage>

      <ShockwaveBurst at={cGps - 3} x={540} y={840} color={TECH.crimson} size={275} />

      {/* Tarjeta inferior: Los 2 Permisos Ocultos Reales */}
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
          boxShadow: `0 24px 58px rgba(0,0,0,0.58), 0 0 26px rgba(255,30,86,0.22), inset 0 0 0 2.5px ${TECH.crimson}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 4, 15)) * 105).toFixed(1)}px)`,
          opacity: prog(f, t0 + 4, 4, ease.linear),
        }}
      >
        <EvidenceHeader
          tag="CULPABLES"
          title="2 Permisos Vampiro"
          rightText="-42% / DÍA"
          accent={TECH.crimson}
        />

        <div style={{ display: "flex", gap: 16 }}>
          {[
            {
              trig: cAct - 3,
              num: "01",
              title: "2º Plano",
              sub: "Red + datos 24/7",
              meter: 84,
            },
            {
              trig: cGps - 3,
              num: "02",
              title: 'GPS "Siempre"',
              sub: "Antena + satélite",
              meter: 94,
            },
          ].map((item) => {
            const active = f >= item.trig;
            const fillW = active ? prog(f, item.trig, 16, ease.out) * item.meter : 20;
            return (
              <div
                key={item.num}
                style={{
                  flex: 1,
                  padding: "16px 20px",
                  borderRadius: 22,
                  background: active
                    ? "linear-gradient(145deg, rgba(255,30,86,0.25) 0%, rgba(255,184,0,0.09) 100%)"
                    : "rgba(255,255,255,0.04)",
                  boxShadow: `inset 0 0 0 2.5px ${active ? TECH.crimson : TECH.borderDark}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  ...(active ? pop(f, item.trig, { dur: 10, from: 0.86 }) : {}),
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 900, color: "#FDA4AF" }}>
                    PERMISO {item.num}
                  </span>
                  <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 900, color: TECH.amber }}>
                    {active ? "⚠️" : "🔍"}
                  </span>
                </div>
                <span style={{ fontFamily: theme.font.ui, fontSize: 36, fontWeight: 900, color: ground.ink }}>
                  {active ? item.title : "Escaneando..."}
                </span>
                <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: ground.dim }}>
                  {active ? item.sub : "Oculto en Ajustes"}
                </span>
                <div style={{ width: "100%", height: 12, borderRadius: 99, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
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
