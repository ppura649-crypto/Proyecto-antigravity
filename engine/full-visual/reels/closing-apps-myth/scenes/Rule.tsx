// Escena 6: `rule`, light (Doble Ilustración: Interruptor esmeralda -> Domo protector + Chuleta Guardable de 3 Ajustes)
// "Haz esto hoy: cierra una app solo si se congela, apaga actualizaciones innecesarias y pon tu ubicación solo al usar."
import React from "react";
import { arrive, ease, pop, prog, useScene } from "../../../src/engine";
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

export const Rule: React.FC = () => {
  const { f, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const cCongela = cue("congela");
  const cAct = cue("actualizaciones");
  const cUbicacion = cue("ubicación");
  const cUsar = cue("usar");

  const doneCount =
    (f >= cCongela - 4 ? 1 : 0) + (f >= cAct - 4 ? 1 : 0) + (f >= cUbicacion - 3 ? 1 : 0);

  return (
    <ImpactRig triggers={[t0 + 4, cUsar - 3]} intensity={8}>
      <TechLabBackdrop emerald />

      <TechTelemetryStrip
        at={t0}
        label="LOS 3 AJUSTES REALES"
        verdict={`${doneCount}/3 ACTIVOS`}
        pct={100}
        status="safe"
      />

      <DualIllustrationStage
        srcA="app-06.jpg"
        srcB="app-13.jpg"
        at={t0 + 2}
        flipAt={cUbicacion - 4}
        mode="whip"
        top={636}
        height={364}
        accentA={TECH.cyan}
        accentB={TECH.emerald}
      >
        <KineticStamp
          at={t0 + 6}
          text="📸 GUARDA ESTOS 3 AJUSTES"
          bg="#070B14"
          ink="#00E699"
          tilt={-1.5}
        />
      </DualIllustrationStage>

      <ShockwaveBurst at={cUsar - 3} x={540} y={820} color={TECH.emerald} size={250} />

      {/* Tarjeta Guardable de 3 Ajustes */}
      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 1014,
          width: STAGE.safeWidth,
          height: 422,
          borderRadius: 28,
          padding: "20px 26px",
          boxSizing: "border-box",
          background: TECH.lightCard,
          boxShadow: `0 24px 58px rgba(15,23,42,0.13), inset 0 0 0 3px ${TECH.emerald}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 4, 15)) * 105).toFixed(1)}px)`,
          opacity: prog(f, t0 + 4, 4, ease.linear),
        }}
      >
        <EvidenceHeader tag="CHULETA" title="Ahorro Real de Batería" rightText="IOS / ANDROID" accent="#059669" />

        {[
          { trig: cCongela - 4, icon: "1", txt: "Cierra una app SOLO si se traba" },
          { trig: cAct - 4, icon: "2", txt: "Apaga Actualización en 2º plano" },
          { trig: cUbicacion - 3, icon: "3", txt: 'Ubicación GPS → "Solo al usar"' },
        ].map((r) => {
          const ok = f >= r.trig;
          return (
            <div
              key={r.icon}
              style={{
                padding: "13px 18px",
                borderRadius: 18,
                background: ok ? "#ECFDF5" : "#F8FAFC",
                boxShadow: `inset 0 0 0 2.5px ${ok ? TECH.emerald : "#CBD5E1"}`,
                display: "flex",
                alignItems: "center",
                gap: 14,
                ...(ok ? pop(f, r.trig, { dur: 9, from: 0.91 }) : {}),
              }}
            >
              <span
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 13,
                  background: ok ? "#059669" : "#94A3B8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: theme.font.mono,
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  flex: "none",
                }}
              >
                {ok ? "✓" : r.icon}
              </span>
              <span style={{ fontFamily: theme.font.ui, fontSize: 33, fontWeight: 800, color: ground.ink }}>
                {r.txt}
              </span>
            </div>
          );
        })}
      </div>
    </ImpactRig>
  );
};
