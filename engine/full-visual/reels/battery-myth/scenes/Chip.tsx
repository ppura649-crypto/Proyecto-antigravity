// Escena 3: `chip`, light (Doble Ilustración + Rayos SVG a 60fps + Gráfica SVG en vivo de Curva Nocturna)
// "Hoy tu teléfono tiene un chip inteligente que frena la carga al 80% mientras duermes y corta la corriente al llegar al 100%, como una válvula automática."
import React from "react";
import { arrive, countTo, ease, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import {
  DualIllustrationStage,
  ElectricArcOverlay,
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

export const Chip: React.FC = () => {
  const { f, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const c80 = cue("80%");
  const cCorta = cue("corta");
  const c100 = cue("100%");
  const cValvula = cue("válvula");

  const pct =
    f < c100 - 10
      ? Math.round(countTo(f, c80 - 18, 24, 24, 80))
      : Math.round(countTo(f, c100 - 10, 16, 80, 100));
  const cut = f >= cCorta - 2;
  const watts = cut ? 0.0 : f >= c80 ? 2.4 : 22.5;

  // Progreso de la curva nocturna SVG (0 -> 1) sincronizada con la voz
  const curveP =
    f < c80
      ? lerp(0.08, 0.45, prog(f, t0 + 4, Math.max(12, c80 - (t0 + 4)), ease.out))
      : f < c100 - 8
        ? lerp(0.45, 0.72, prog(f, c80, Math.max(12, c100 - 8 - c80), ease.linear))
        : lerp(0.72, 1.0, prog(f, c100 - 8, 22, ease.out));

  const pathLen = 780;
  const dotX = lerp(30, 790, curveP);
  const dotY =
    curveP <= 0.45
      ? lerp(142, 62, curveP / 0.45)
      : curveP <= 0.72
        ? 62
        : curveP <= 0.88
          ? lerp(62, 24, (curveP - 0.72) / 0.16)
          : 24;

  return (
    <ImpactRig triggers={[cCorta - 2]} intensity={10}>
      <TechLabBackdrop emerald={cut} />

      <TechTelemetryStrip
        at={t0}
        label="CHIP GESTOR PMIC"
        verdict={cut ? "0.0 W · CORTE" : "CARGA ACTIVA"}
        pct={pct}
        status="safe"
      />

      <DualIllustrationStage
        srcA="tech-03.jpg"
        srcB="tech-10.jpg"
        at={t0 + 2}
        flipAt={cCorta - 2}
        mode="whip"
        top={636}
        height={404}
        accentA={TECH.cyan}
        accentB={TECH.emerald}
        vfx={<ElectricArcOverlay active={!cut} color={TECH.cyanBright} />}
      >
        <div
          style={{
            position: "absolute",
            left: 18,
            top: 16,
            padding: "8px 18px",
            borderRadius: 14,
            background: "rgba(7, 11, 20, 0.92)",
            boxShadow: `inset 0 0 0 2.5px ${cut ? TECH.emerald : TECH.cyanBright}`,
            fontFamily: theme.font.mono,
            fontSize: 32,
            fontWeight: 900,
            color: cut ? TECH.emerald : "#67E8F9",
            zIndex: 15,
          }}
        >
          ⚡ {watts.toFixed(1)} W {cut ? "· BLOQUEADO" : "· ENTRANDO"}
        </div>

        <KineticStamp
          at={cValvula - 8}
          text="🔒 VÁLVULA CERRADA AL 100%"
          bg={TECH.emerald}
          ink="#042217"
          tilt={-2}
        />
      </DualIllustrationStage>

      <ShockwaveBurst at={cCorta - 2} x={540} y={840} color={TECH.emerald} size={270} />

      {/* Gráfica SVG en vivo a 60 fps: Curva Nocturna de Carga Optimizada */}
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
          boxShadow: `0 22px 54px rgba(15,23,42,0.12), inset 0 0 0 3px ${cut ? TECH.emerald : TECH.cyan}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 5, 16)) * 105).toFixed(1)}px)`,
          opacity: prog(f, t0 + 5, 4, ease.linear),
        }}
      >
        <EvidenceHeader
          tag="TELEMETRÍA"
          title="Curva Nocturna en Vivo"
          rightText={cut ? "0.0 A" : `${pct}%`}
          accent={cut ? "#059669" : "#0284C7"}
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
            {/* Guías punteadas 80% y 100% */}
            <line x1={24} y1={62} x2={790} y2={62} stroke="rgba(0,240,255,0.28)" strokeWidth={2} strokeDasharray="8 8" />
            <line x1={24} y1={24} x2={790} y2={24} stroke="rgba(0,230,153,0.34)" strokeWidth={2} strokeDasharray="8 8" />

            {/* Trazo luminoso dibujado en vivo */}
            <path
              d="M 30 142 L 368 62 L 585 62 L 705 24 L 790 24"
              fill="none"
              stroke={cut ? TECH.emerald : TECH.cyanBright}
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLen}
              strokeDashoffset={pathLen * (1 - curveP)}
              style={{ filter: `drop-shadow(0 0 10px ${cut ? TECH.emerald : TECH.cyanBright})` }}
            />
            <circle
              cx={dotX}
              cy={dotY}
              r={11}
              fill="#FFFFFF"
              stroke={cut ? TECH.emerald : TECH.cyanBright}
              strokeWidth={5}
            />
            <text x={36} y={52} fill="#67E8F9" fontFamily={theme.font.mono} fontSize={32} fontWeight={800}>
              PAUSA 80%
            </text>
            <text x={555} y={138} fill={cut ? TECH.emerald : "#94A3B8"} fontFamily={theme.font.mono} fontSize={32} fontWeight={900}>
              {cut ? "CORTE 100%" : "6:30 AM"}
            </text>
          </svg>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, color: ground.dim }}>
            11 PM → Pausa 80% → 6 AM
          </span>
          <span
            style={{
              fontFamily: theme.font.mono,
              fontSize: 33,
              fontWeight: 900,
              color: cut ? "#059669" : "#0284C7",
            }}
          >
            {cut ? "CORTE TOTAL (0.0 W)" : "REGULANDO FLUJO"}
          </span>
        </div>
      </div>
    </ImpactRig>
  );
};
