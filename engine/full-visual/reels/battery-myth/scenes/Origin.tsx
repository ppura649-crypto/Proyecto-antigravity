// Escena 2: `origin`, light (Doble Ilustración en Split 50/50: Pilas 90s vs Sobrecarga térmica 90s + USB-C frío)
// "Ese miedo nació en los años 90 con las viejas pilas de níquel, que sí sufrían sobrecarga si no las desconectabas a tiempo."
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
} from "./parts";

export const Origin: React.FC = () => {
  const { f, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const c90 = cue("90");
  const cNiquel = cue("níquel");
  const cSobre = cue("sobrecarga");

  const yr = Math.round(countTo(f, c90 - 8, 20, 2026, 1995));
  const overPct = f >= cSobre - 3 ? Math.round(countTo(f, cSobre - 3, 18, 100, 118)) : 100;

  return (
    <ImpactRig triggers={[cSobre - 2]} intensity={9}>
      <TechLabBackdrop alert={f >= cSobre - 3} />

      <TechTelemetryStrip
        at={t0}
        label="ORIGEN DEL MITO"
        verdict={`AÑO ${yr}`}
        pct={100}
        status={f >= cSobre - 3 ? "warn" : "safe"}
      />

      <DualIllustrationStage
        srcA="tech-02.jpg"
        srcB="tech-09.jpg"
        at={t0 + 2}
        flipAt={cSobre - 3}
        mode="split"
        top={636}
        height={404}
        accentA={TECH.amber}
        accentB={TECH.crimson}
      >
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 16,
            padding: "7px 16px",
            borderRadius: 14,
            background: "rgba(7, 11, 20, 0.90)",
            boxShadow: `inset 0 0 0 2px ${TECH.amber}`,
            fontFamily: theme.font.mono,
            fontSize: 32,
            fontWeight: 900,
            color: "#FDE047",
            zIndex: 15,
          }}
        >
          1995 · NÍQUEL
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
          2026 · LITIO
        </div>

        <KineticStamp
          at={cSobre - 3}
          text={`⚡ 1995: SOBRECARGA AL ${overPct}%`}
          bg={TECH.crimson}
          ink="#FFFFFF"
          tilt={-2}
        />
      </DualIllustrationStage>

      <ShockwaveBurst at={cSobre - 2} x={540} y={840} color={TECH.amber} size={240} />

      {/* Comparativa dinámica de barras de voltaje NiCd vs Li-Ion */}
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
          background: TECH.lightCard,
          boxShadow: `0 22px 54px rgba(15,23,42,0.12), inset 0 0 0 3px ${
            f >= cSobre - 3 ? TECH.crimson : TECH.amber
          }`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 5, 16)) * 105).toFixed(1)}px)`,
          opacity: prog(f, t0 + 5, 4, ease.linear),
        }}
      >
        <EvidenceHeader tag="EVOLUCIÓN" title="Por qué antes sí dañaba" rightText="NiCd vs Li-Ion" accent={TECH.crimson} />

        <div style={{ display: "flex", gap: 16 }}>
          <div
            style={{
              flex: 1,
              padding: "16px 18px",
              borderRadius: 20,
              background: f >= cNiquel - 4 ? "#FFF1F2" : "#F8FAFC",
              boxShadow: `inset 0 0 0 2.5px ${f >= cNiquel - 4 ? TECH.crimson : "#CBD5E1"}`,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              ...(f >= cNiquel - 4 ? pop(f, cNiquel - 4, { dur: 10, from: 0.9 }) : {}),
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 900, color: TECH.crimson }}>
                AÑOS 90
              </span>
              <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 900, color: TECH.crimson }}>
                {overPct}%
              </span>
            </div>
            <span style={{ fontFamily: theme.font.ui, fontSize: 35, fontWeight: 900, color: ground.ink }}>
              Sin chip de corte
            </span>
            <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: ground.dim }}>
              Seguía metiendo calor
            </span>
            <div style={{ width: "100%", height: 13, borderRadius: 99, background: "#FECDD3", overflow: "hidden" }}>
              <div style={{ width: "100%", height: "100%", background: TECH.crimson }} />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: "16px 18px",
              borderRadius: 20,
              background: "#ECFDF5",
              boxShadow: `inset 0 0 0 2.5px ${TECH.emerald}`,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 900, color: "#047857" }}>
                HOY · 2026
              </span>
              <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 900, color: "#047857" }}>
                100%
              </span>
            </div>
            <span style={{ fontFamily: theme.font.ui, fontSize: 35, fontWeight: 900, color: ground.ink }}>
              Corte digital 0 W
            </span>
            <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: ground.dim }}>
              Cero sobrecarga
            </span>
            <div style={{ width: "100%", height: 13, borderRadius: 99, background: "#A7F3D0", overflow: "hidden" }}>
              <div style={{ width: "80%", height: "100%", background: "#059669" }} />
            </div>
          </div>
        </div>
      </div>
    </ImpactRig>
  );
};
