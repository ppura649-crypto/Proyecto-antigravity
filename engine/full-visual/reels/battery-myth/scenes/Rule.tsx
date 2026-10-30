// Escena 6: `rule`, light (Doble Ilustración: Escritorio ventilado -> Noche tranquila + Tarjeta Guardable Saves)
// "La regla es simple: quita la funda si calienta, nunca bajes de 20% y duerme tranquilo."
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
  const cFunda = cue("funda");
  const c20 = cue("20%");
  const cTranquilo = cue("tranquilo");

  const doneCount = (f >= cFunda - 4 ? 1 : 0) + (f >= c20 - 5 ? 1 : 0) + (f >= cTranquilo - 6 ? 1 : 0);

  return (
    <ImpactRig triggers={[t0 + 4, cTranquilo - 5]} intensity={8}>
      <TechLabBackdrop emerald />

      <TechTelemetryStrip
        at={t0}
        label=" LAS 3 REGLAS DE ORO"
        verdict={`${doneCount}/3 ACTIVAS`}
        pct={100}
        status="safe"
      />

      <DualIllustrationStage
        srcA="tech-06.jpg"
        srcB="tech-13.jpg"
        at={t0 + 2}
        flipAt={cTranquilo - 8}
        mode="whip"
        top={636}
        height={364}
        accentA={TECH.cyan}
        accentB={TECH.emerald}
      >
        <KineticStamp
          at={t0 + 6}
          text="📸 GUARDA ESTA CAPTURA"
          bg="#070B14"
          ink="#00E699"
          tilt={-1.5}
        />
      </DualIllustrationStage>

      <ShockwaveBurst at={cTranquilo - 5} x={540} y={820} color={TECH.emerald} size={250} />

      {/* Tarjeta Guardable de 3 Reglas */}
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
        <EvidenceHeader tag="CHULETA" title="3 Reglas para +3 Años" rightText="IPHONE / ANDROID" accent="#059669" />

        {[
          { trig: cFunda - 4, icon: "1", txt: "Quita la funda si calienta (< 35 °C)" },
          { trig: c20 - 5, icon: "2", txt: "Conéctalo antes de bajar del 20%" },
          { trig: cTranquilo - 6, icon: "3", txt: "Cárgalo de noche en base ventilada" },
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
