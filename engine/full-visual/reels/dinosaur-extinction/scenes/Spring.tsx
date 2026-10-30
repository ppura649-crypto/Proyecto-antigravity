// Escena 6: `spring`, light
// "Peces fósiles con vidrio fundido en sus branquias probaron que golpeó en plena primavera del norte.
//  Los dinosaurios quedaron expuestos afuera, mientras pequeños mamíferos ocultos en madrigueras bajo el otoño del sur sobrevivieron."
import React from "react";
import { arrive, ease, pop, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { EarthSunlightStrip, IllustrationWindow, PaperBadge, STAGE } from "./parts";

export const Spring: React.FC = () => {
  const { f, theme, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const cBranq = cue("branquias");
  const cPrim = cue("primavera");
  const cDinos = cue("dinosaurios");
  const cAfuera = cue("afuera");
  const cMadr = cue("madrigueras");
  const cSobr = cue("sobrevivieron");

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <EarthSunlightStrip at={t0} sunPct={0} shroud={0.9} impact={0.9} status="PRIMAVERA NORTE" />

      {/* Ilustración díptica: izquierda peces en río con lluvia de vidrio; derecha mamífero en madriguera */}
      <IllustrationWindow
        src="ill-06.jpg"
        at={t0 + 2}
        top={644}
        height={434}
        zoom={[1.03, 1.11]}
        panX={[-6, 6]}
        borderAccent="#CBD5E1"
      >
        {/* Etiqueta izquierda: vidrio en branquias / primavera norte */}
        {f >= cBranq - 4 && (
          <div
            style={{
              position: "absolute",
              left: 16,
              top: 16,
              padding: "7px 16px",
              borderRadius: 12,
              background: f >= cAfuera ? "rgba(220,38,38,0.92)" : "rgba(15,23,42,0.88)",
              fontFamily: theme.font.ui,
              fontSize: 32,
              fontWeight: 800,
              color: "#FFFFFF",
              ...pop(f, cBranq - 4, { dur: 8 }),
            }}
          >
            {f >= cDinos ? "NORTE: EXPUESTOS" : "🐟 VIDRIO EN BRANQUIAS"}
          </div>
        )}

        {/* Etiqueta derecha: madrigueras subterráneas */}
        {f >= cMadr - 6 && (
          <div
            style={{
              position: "absolute",
              right: 16,
              bottom: 16,
              padding: "7px 16px",
              borderRadius: 12,
              background: "rgba(22,163,74,0.94)",
              fontFamily: theme.font.ui,
              fontSize: 32,
              fontWeight: 800,
              color: "#FFFFFF",
              ...pop(f, cMadr - 6, { dur: 8 }),
            }}
          >
            ✓ BAJO TIERRA (SUR)
          </div>
        )}
      </IllustrationWindow>

      {/* Tarjeta inferior Nature 2022 (Tanis): comparación Norte Primavera vs Sur Otoño */}
      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 1096,
          width: STAGE.safeWidth,
          height: 334,
          borderRadius: 26,
          padding: "22px 26px",
          boxSizing: "border-box",
          background: "#FFFFFF",
          boxShadow: "0 22px 52px rgba(15,23,42,0.10), inset 0 0 0 2.5px #CBD5E1",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 6, 20)) * 120).toFixed(1)}px)`,
          opacity: prog(f, t0 + 6, 4, ease.linear),
        }}
      >
        <PaperBadge journal="Nature" year="2022 · Tanis" author="During et al." accent="#15803D" />

        <div style={{ display: "flex", gap: 16 }}>
          {/* Hemisferio Norte */}
          <div
            style={{
              flex: 1,
              padding: "14px 18px",
              borderRadius: 18,
              background: f >= cAfuera - 4 ? "#FEF2F2" : "#F8FAFC",
              boxShadow: `inset 0 0 0 2.5px ${f >= cAfuera - 4 ? "#EF4444" : "#E2E8F0"}`,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, color: "#0F172A" }}>
              {f >= cPrim - 4 ? "NORTE · PRIMAVERA" : "FÓSIL TANIS"}
            </span>
            <span
              style={{
                fontFamily: theme.font.mono,
                fontSize: 34,
                fontWeight: 800,
                color: f >= cAfuera - 4 ? "#DC2626" : "#475569",
              }}
            >
              {f >= cAfuera - 4 ? "✗ EXPUESTOS" : "AFUERA"}
            </span>
          </div>

          {/* Hemisferio Sur */}
          <div
            style={{
              flex: 1,
              padding: "14px 18px",
              borderRadius: 18,
              background: f >= cMadr - 4 ? "#F0FDF4" : "#F8FAFC",
              boxShadow: `inset 0 0 0 2.5px ${f >= cMadr - 4 ? "#16A34A" : "#E2E8F0"}`,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, color: "#0F172A" }}>
              SUR · OTOÑO
            </span>
            <span
              style={{
                fontFamily: theme.font.mono,
                fontSize: 34,
                fontWeight: 800,
                color: f >= cMadr - 4 ? "#15803D" : "#94A3B8",
              }}
            >
              {f >= cSobr - 6 ? "✓ VIVEN" : f >= cMadr - 4 ? "MADRIGUERA" : "REFUGIO"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
