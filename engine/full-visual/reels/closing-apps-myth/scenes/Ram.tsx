// Escena 3: `ram`, light (Doble Ilustración: Cubos congelados en RAM -> Chip CPU en reposo frío + Curva SVG 0% CPU)
// "Cuando sales de una aplicación, tu teléfono la congela en la memoria RAM: queda en pausa total usando 0% de procesador."
import React from "react";
import { arrive, countTo, ease, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import {
  CryoFrostOverlay,
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
} from "./parts";

export const Ram: React.FC = () => {
  const { f, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const cCongela = cue("congela");
  const cPausa = cue("pausa");
  const c0 = cue("0%");

  const frozen = f >= cCongela - 3;
  const zeroed = f >= c0 - 3;
  const cpuPct = !frozen
    ? Math.round(countTo(f, t0 + 2, 16, 68, 54))
    : !zeroed
      ? Math.round(countTo(f, cCongela - 3, 22, 54, 4))
      : 0;

  // Curva SVG en vivo: cae de 68% CPU en uso activo a 0.0% en pausa RAM
  const curveP =
    f < cCongela
      ? lerp(0.10, 0.42, prog(f, t0 + 4, Math.max(12, cCongela - (t0 + 4)), ease.out))
      : f < c0 - 3
        ? lerp(0.42, 0.76, prog(f, cCongela, Math.max(12, c0 - 3 - cCongela), ease.out))
        : lerp(0.76, 1.0, prog(f, c0 - 3, 18, ease.out));

  const pathLen = 790;
  const dotX = lerp(34, 786, curveP);
  const dotY =
    curveP <= 0.34
      ? 42
      : curveP <= 0.62
        ? lerp(42, 144, (curveP - 0.34) / 0.28)
        : 144;

  return (
    <ImpactRig triggers={[cCongela - 2, c0 - 3]} intensity={9}>
      <TechLabBackdrop emerald={zeroed} />

      <TechTelemetryStrip
        at={t0}
        label="SUSPENSIÓN EN RAM"
        verdict={zeroed ? "0.0% CPU" : frozen ? "CONGELADA" : "APP ACTIVA"}
        pct={cpuPct}
        unit="% CPU"
        status="safe"
      />

      <DualIllustrationStage
        srcA="app-03.jpg"
        srcB="app-10.jpg"
        at={t0 + 2}
        flipAt={c0 - 3}
        mode="whip"
        top={636}
        height={404}
        accentA={TECH.cyanBright}
        accentB={TECH.emerald}
        vfx={<CryoFrostOverlay active={frozen} />}
      >
        <div
          style={{
            position: "absolute",
            left: 18,
            top: 16,
            padding: "8px 18px",
            borderRadius: 14,
            background: "rgba(7, 11, 20, 0.92)",
            boxShadow: `inset 0 0 0 2.5px ${zeroed ? TECH.emerald : TECH.cyanBright}`,
            fontFamily: theme.font.mono,
            fontSize: 32,
            fontWeight: 900,
            color: zeroed ? TECH.emerald : "#67E8F9",
            zIndex: 15,
          }}
        >
          🧊 ESTADO RAM · {zeroed ? "0.0% PROCESADOR" : "CONGELANDO"}
        </div>

        <KineticStamp
          at={cPausa - 3}
          text="⏸️ PAUSA TOTAL · CERO GASTO"
          bg={TECH.emerald}
          ink="#042217"
          tilt={-2}
        />
      </DualIllustrationStage>

      <ShockwaveBurst at={c0 - 3} x={540} y={840} color={TECH.emerald} size={265} />

      {/* Gráfica SVG en vivo a 60 fps: Caída instantánea de CPU a 0.0% */}
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
          boxShadow: `0 22px 54px rgba(15,23,42,0.12), inset 0 0 0 3px ${zeroed ? TECH.emerald : TECH.cyan}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 5, 16)) * 105).toFixed(1)}px)`,
          opacity: prog(f, t0 + 5, 4, ease.linear),
        }}
      >
        <EvidenceHeader
          tag="OSCILOSCOPIO"
          title="Uso de CPU al Salir"
          rightText={`${cpuPct}% CPU`}
          accent={zeroed ? "#059669" : "#0284C7"}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            height: 174,
            borderRadius: 20,
            background: "#0B1220",
            overflow: "hidden",
            boxShadow: "inset 0 0 0 2px rgba(0,240,255,0.22)",
          }}
        >
          <svg width={812} height={174} viewBox="0 0 812 174" style={{ display: "block" }}>
            <line x1={24} y1={42} x2={790} y2={42} stroke="rgba(0,240,255,0.25)" strokeWidth={2} strokeDasharray="8 8" />
            <line x1={24} y1={144} x2={790} y2={144} stroke="rgba(0,230,153,0.34)" strokeWidth={2} strokeDasharray="8 8" />

            <path
              d="M 34 42 L 290 42 L 505 144 L 786 144"
              fill="none"
              stroke={zeroed ? TECH.emerald : TECH.cyanBright}
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLen}
              strokeDashoffset={pathLen * (1 - curveP)}
              style={{ filter: `drop-shadow(0 0 10px ${zeroed ? TECH.emerald : TECH.cyanBright})` }}
            />
            <circle
              cx={dotX}
              cy={dotY}
              r={11}
              fill="#FFFFFF"
              stroke={zeroed ? TECH.emerald : TECH.cyanBright}
              strokeWidth={5}
            />
            <text x={36} y={96} fill="#67E8F9" fontFamily={theme.font.mono} fontSize={32} fontWeight={800}>
              EN PANTALLA
            </text>
            <text x={495} y={118} fill={zeroed ? TECH.emerald : "#94A3B8"} fontFamily={theme.font.mono} fontSize={32} fontWeight={900}>
              PAUSA 0.0%
            </text>
          </svg>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, color: ground.dim }}>
            Sales a Inicio → Congelada
          </span>
          <span
            style={{
              fontFamily: theme.font.mono,
              fontSize: 33,
              fontWeight: 900,
              color: zeroed ? "#059669" : "#0284C7",
            }}
          >
            {zeroed ? "0.0% PROCESADOR" : "SUSPENDIENDO..."}
          </span>
        </div>
      </div>
    </ImpactRig>
  );
};
