// Escena 2: `execs`, light (Doble Ilustración Split 50/50: iOS + Android Flagships -> Duelo Frenético vs Calma)
// "Tanto Craig Federighi en Apple como los ingenieros de Android confirmaron que deslizar tus apps hacia arriba es un mito inútil."
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

export const Execs: React.FC = () => {
  const { f, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const cApple = cue("Apple");
  const cAndroid = cue("Android");
  const cDeslizar = cue("deslizar");
  const cMito = cue("mito");

  const busted = f >= cMito - 3;

  return (
    <ImpactRig triggers={[cApple - 2, cAndroid - 2, cMito - 3]} intensity={9}>
      <TechLabBackdrop alert={busted} />

      <TechTelemetryStrip
        at={t0}
        label="VEREDICTO OFICIAL OS"
        verdict={busted ? "MITO INÚTIL" : "APPLE + GOOGLE"}
        pct={busted ? 100 : f >= cAndroid - 2 ? 100 : 50}
        status={busted ? "myth" : "safe"}
      />

      <DualIllustrationStage
        srcA="app-02.jpg"
        srcB="app-09.jpg"
        at={t0 + 2}
        flipAt={cDeslizar - 2}
        mode="split"
        top={636}
        height={404}
        accentA={TECH.cyan}
        accentB={TECH.crimson}
      >
        <div
          style={{
            position: "absolute",
            left: 18,
            top: 16,
            padding: "8px 18px",
            borderRadius: 14,
            background: "rgba(7, 11, 20, 0.92)",
            boxShadow: `inset 0 0 0 2.5px ${TECH.cyanBright}`,
            fontFamily: theme.font.mono,
            fontSize: 32,
            fontWeight: 900,
            color: "#FFFFFF",
            zIndex: 15,
          }}
        >
          🍎 iOS + 🤖 ANDROID · OFICIAL
        </div>

        <KineticStamp
          at={cMito - 3}
          text="🚫 MITO INÚTIL CONFIRMADO"
          bg={TECH.crimson}
          ink="#FFFFFF"
          tilt={-2}
        />
      </DualIllustrationStage>

      <ShockwaveBurst at={cMito - 3} x={540} y={860} color={TECH.crimson} size={265} />

      {/* Tarjeta inferior: Declaraciones oficiales de ingeniería Apple y Android */}
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
          boxShadow: `0 22px 54px rgba(15,23,42,0.12), inset 0 0 0 3px ${busted ? TECH.crimson : TECH.cyan}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 4, 15)) * 105).toFixed(1)}px)`,
          opacity: prog(f, t0 + 4, 4, ease.linear),
        }}
      >
        <EvidenceHeader
          tag="FUENTES"
          title="Ingeniería de Sistemas"
          rightText={busted ? "DESMENTIDO" : "2 GIGANTES"}
          accent={busted ? TECH.crimson : "#0284C7"}
        />

        <div style={{ display: "flex", gap: 16 }}>
          {[
            {
              trig: cApple - 3,
              badge: "🍎 APPLE",
              who: "Craig Federighi",
              quote: '"No y no ahorra"',
              color: "#0284C7",
              bg: "#F0F9FF",
            },
            {
              trig: cAndroid - 3,
              badge: "🤖 ANDROID",
              who: "Ing. de Google",
              quote: '"Gasta más batería"',
              color: "#059669",
              bg: "#ECFDF5",
            },
          ].map((card) => {
            const on = f >= card.trig;
            return (
              <div
                key={card.badge}
                style={{
                  flex: 1,
                  padding: "16px 20px",
                  borderRadius: 22,
                  background: on ? card.bg : "#F8FAFC",
                  boxShadow: `inset 0 0 0 2.5px ${on ? card.color : "#CBD5E1"}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  ...(on ? pop(f, card.trig, { dur: 10, from: 0.88 }) : {}),
                }}
              >
                <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 900, color: card.color }}>
                  {card.badge}
                </span>
                <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 900, color: ground.ink }}>
                  {card.who}
                </span>
                <span
                  style={{
                    padding: "7px 14px",
                    borderRadius: 14,
                    background: busted ? TECH.crimson : "#0F172A",
                    fontFamily: theme.font.ui,
                    fontSize: 32,
                    fontWeight: 800,
                    color: "#FFFFFF",
                    textAlign: "center",
                  }}
                >
                  {on ? card.quote : "Verificando..."}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </ImpactRig>
  );
};
