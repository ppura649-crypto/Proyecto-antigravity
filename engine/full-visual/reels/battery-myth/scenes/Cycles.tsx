// Escena 5: `cycles`, dark (Doble Ilustración en Split 50/50 + Rayos Esmeralda + Carrera de Ciclos 400 vs +1,050)
// "El segundo es agotarla hasta 0%: una descarga total rinde apenas 400 ciclos, pero mantenerla entre 20 y 80% supera los 1000 ciclos de vida."
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
} from "./parts";

export const Cycles: React.FC = () => {
  const { f, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const c0 = cue("0%");
  const c400 = cue("400");
  const c20 = cue("20");
  const c1000 = cue("1000");

  const boostMode = f >= c20 - 3;
  const lowCycles = Math.round(countTo(f, c400 - 12, 20, 90, 400));
  const hiCycles = boostMode ? Math.round(countTo(f, c1000 - 16, 24, 400, 1050)) : 400;
  const lowW = (lowCycles / 1100) * 100;
  const hiW = (hiCycles / 1100) * 100;

  return (
    <ImpactRig triggers={[c0 - 2, c1000 - 2]} intensity={11}>
      <TechLabBackdrop alert={!boostMode} emerald={boostMode} />

      <TechTelemetryStrip
        at={t0}
        label="PRUEBA BU-808"
        verdict={boostMode ? "+1,050 CICLOS" : "COLAPSO A 0%"}
        pct={boostMode ? 96 : 8}
        status={boostMode ? "safe" : "warn"}
      />

      <DualIllustrationStage
        srcA="tech-05.jpg"
        srcB="tech-12.jpg"
        at={t0 + 2}
        flipAt={c20 - 3}
        mode="split"
        top={636}
        height={404}
        accentA={TECH.crimson}
        accentB={TECH.emerald}
        vfx={<ElectricArcOverlay active={f >= c1000 - 4} color={TECH.emerald} />}
      >
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 16,
            padding: "7px 16px",
            borderRadius: 14,
            background: TECH.crimson,
            fontFamily: theme.font.mono,
            fontSize: 32,
            fontWeight: 900,
            color: "#FFFFFF",
            zIndex: 15,
            ...(f >= c0 - 4 ? pop(f, c0 - 4, { dur: 9, from: 0.85 }) : {}),
          }}
        >
          100% → 0%
        </div>

        <div
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            padding: "7px 16px",
            borderRadius: 14,
            background: TECH.emerald,
            fontFamily: theme.font.mono,
            fontSize: 32,
            fontWeight: 900,
            color: "#042217",
            zIndex: 15,
          }}
        >
          80% → 20%
        </div>

        <KineticStamp
          at={c1000 - 4}
          text="🚀 2.6x MÁS VIDA ÚTIL (20%–80%)"
          bg={TECH.emerald}
          ink="#042217"
          tilt={-2}
        />
      </DualIllustrationStage>

      <ShockwaveBurst at={c0 - 2} x={340} y={820} color={TECH.crimson} size={220} />
      <ShockwaveBurst at={c1000 - 2} x={540} y={860} color={TECH.emerald} size={300} />

      {/* Arena de Carrera de Ciclos Battery University */}
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
          boxShadow: `0 24px 58px rgba(0,0,0,0.6), 0 0 28px ${
            boostMode ? "rgba(0,230,153,0.24)" : "rgba(255,30,86,0.22)"
          }, inset 0 0 0 3px ${boostMode ? TECH.emerald : TECH.crimson}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 5, 16)) * 105).toFixed(1)}px)`,
          opacity: prog(f, t0 + 5, 4, ease.linear),
        }}
      >
        <EvidenceHeader
          tag="BATTERY UNIV."
          title="Ciclos Antes de Degradar"
          rightText="2.6x VIDA"
          accent={boostMode ? TECH.emerald : TECH.crimson}
        />

        {/* Barra 1: Descarga total a 0% */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: theme.font.ui, fontSize: 33, fontWeight: 800, color: "#FDA4AF" }}>
              Agotar hasta 0%
            </span>
            <span style={{ fontFamily: theme.font.mono, fontSize: 36, fontWeight: 900, color: TECH.crimson }}>
              {lowCycles} ciclos
            </span>
          </div>
          <div style={{ width: "100%", height: 26, borderRadius: 999, background: "rgba(255,255,255,0.09)", overflow: "hidden" }}>
            <div
              style={{
                width: `${lowW.toFixed(1)}%`,
                height: "100%",
                borderRadius: 999,
                background: TECH.crimson,
                boxShadow: `0 0 16px ${TECH.crimson}`,
              }}
            />
          </div>
        </div>

        {/* Barra 2: Rango inteligente 20% a 80% */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: theme.font.ui, fontSize: 33, fontWeight: 900, color: "#6EE7B7" }}>
              Mantener 20% – 80%
            </span>
            <span style={{ fontFamily: theme.font.mono, fontSize: 38, fontWeight: 900, color: TECH.emerald }}>
              +{hiCycles >= 1000 ? "1,050" : hiCycles} ciclos
            </span>
          </div>
          <div style={{ width: "100%", height: 28, borderRadius: 999, background: "rgba(255,255,255,0.09)", overflow: "hidden" }}>
            <div
              style={{
                width: `${hiW.toFixed(1)}%`,
                height: "100%",
                borderRadius: 999,
                background: "linear-gradient(90deg, #00F0FF 0%, #00E699 100%)",
                boxShadow: `0 0 22px ${TECH.emerald}`,
              }}
            />
          </div>
        </div>
      </div>
    </ImpactRig>
  );
};
