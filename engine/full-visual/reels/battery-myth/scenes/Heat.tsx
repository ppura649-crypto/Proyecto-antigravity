// Escena 4: `heat`, dark (Doble Ilustración Térmica + Brasas 60fps + Tacómetro SVG de Temperatura en Vivo)
// "El primer asesino real es el calor: Apple confirma que pasar de 35 grados mientras cargas bajo la almohada o jugando degrada tu capacidad para siempre."
import React from "react";
import { arrive, countTo, ease, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import {
  DualIllustrationStage,
  EvidenceHeader,
  ImpactRig,
  KineticStamp,
  lerp,
  ShockwaveBurst,
  STAGE,
  TECH,
  TechLabBackdrop,
  TechTelemetryStrip,
  ThermalEmbersOverlay,
} from "./parts";

export const Heat: React.FC = () => {
  const { f, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const cCalor = cue("calor");
  const c35 = cue("35");
  const cAlmohada = cue("almohada");
  const cJugando = cue("jugando");
  const cSiempre = cue("siempre");

  const temp = Math.round(countTo(f, cCalor - 6, 38, 22, 43));
  const danger = temp > 35 || f >= c35 - 2;
  const dialP = Math.min(1, Math.max(0.08, (temp - 16) / (45 - 16)));
  const capPct = f >= cAlmohada - 4 ? Math.round(countTo(f, cAlmohada - 4, 34, 100, 78)) : 100;

  // Aguja del tacómetro semicircular (-90 deg a +90 deg)
  const angleDeg = lerp(-86, 86, dialP);
  const arcLen = 283; // pi * r (r = 90)

  return (
    <ImpactRig triggers={[cCalor - 2, c35 - 2, cSiempre - 3]} intensity={11}>
      <TechLabBackdrop alert />

      <TechTelemetryStrip
        at={t0}
        label="ESTRÉS TÉRMICO REAL"
        verdict={`${temp} °C · PELIGRO`}
        pct={Math.round(dialP * 100)}
        status="warn"
      />

      <DualIllustrationStage
        srcA="tech-04.jpg"
        srcB="tech-11.jpg"
        at={t0 + 2}
        flipAt={cJugando - 5}
        mode="whip"
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
          🌡️ MÁX. APPLE: 35 °C
        </div>

        <KineticStamp
          at={cAlmohada - 5}
          text={f >= cJugando - 5 ? "🎮 JUGAR CARGANDO = +43 °C" : "🛏️ BAJO ALMOHADA = +41 °C"}
          bg={TECH.crimson}
          ink="#FFFFFF"
          tilt={-2}
        />
      </DualIllustrationStage>

      <ShockwaveBurst at={c35 - 2} x={540} y={840} color={TECH.crimson} size={280} />
      <ShockwaveBurst at={cSiempre - 3} x={620} y={1260} color={TECH.amber} size={220} />

      {/* Tacómetro SVG Semicircular + Degradación Permanente de Capacidad */}
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
          boxShadow: `0 24px 58px rgba(0,0,0,0.6), 0 0 28px rgba(255,30,86,0.24), inset 0 0 0 3px ${TECH.crimson}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 5, 16)) * 105).toFixed(1)}px)`,
          opacity: prog(f, t0 + 5, 4, ease.linear),
        }}
      >
        <EvidenceHeader tag="APPLE SUPPORT" title="Límite Térmico Oficial" rightText="> 35 °C" accent={TECH.crimson} />

        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {/* Tacómetro térmico SVG a 60 fps */}
          <div
            style={{
              width: 280,
              height: 176,
              borderRadius: 22,
              background: "rgba(255,255,255,0.04)",
              boxShadow: `inset 0 0 0 2px ${danger ? TECH.crimson : TECH.borderDark}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <svg width={240} height={126} viewBox="0 0 240 126" style={{ overflow: "visible" }}>
              <path
                d="M 30 112 A 90 90 0 0 1 210 112"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={18}
                strokeLinecap="round"
              />
              <path
                d="M 30 112 A 90 90 0 0 1 210 112"
                fill="none"
                stroke={danger ? TECH.crimson : TECH.emerald}
                strokeWidth={18}
                strokeLinecap="round"
                strokeDasharray={arcLen}
                strokeDashoffset={arcLen * (1 - dialP)}
              />
              <g transform={`translate(120, 112) rotate(${angleDeg.toFixed(1)})`}>
                <line x1={0} y1={0} x2={0} y2={-74} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" />
                <circle cx={0} cy={0} r={10} fill={TECH.amber} />
              </g>
            </svg>
            <span style={{ fontFamily: theme.font.mono, fontSize: 36, fontWeight: 900, color: "#FDA4AF", marginTop: -6 }}>
              {temp} °C
            </span>
          </div>

          {/* Barra de Salud Perdida para Siempre */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: theme.font.ui, fontSize: 33, fontWeight: 800, color: ground.ink }}>
                Salud máxima
              </span>
              <span style={{ fontFamily: theme.font.mono, fontSize: 40, fontWeight: 900, color: TECH.crimson }}>
                {capPct}%
              </span>
            </div>

            <div style={{ width: "100%", height: 22, borderRadius: 99, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
              <div
                style={{
                  width: `${capPct}%`,
                  height: "100%",
                  borderRadius: 99,
                  background: capPct < 90 ? "linear-gradient(90deg, #FF1E56 0%, #FFB800 100%)" : TECH.emerald,
                }}
              />
            </div>

            <div
              style={{
                padding: "10px 16px",
                borderRadius: 14,
                background: "rgba(255, 30, 86, 0.22)",
                boxShadow: `inset 0 0 0 2px ${TECH.crimson}`,
                fontFamily: theme.font.mono,
                fontSize: 32,
                fontWeight: 900,
                color: "#FFFFFF",
                textAlign: "center",
              }}
            >
              DAÑO IRREVERSIBLE
            </div>
          </div>
        </div>
      </div>
    </ImpactRig>
  );
};
