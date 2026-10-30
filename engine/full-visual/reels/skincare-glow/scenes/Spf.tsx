// Escena 4: `spf`, light
// "Después viene tu mejor escudo: un estudio clínico probó que el 80% del envejecimiento visible del rostro lo causa el sol. Aplica la medida de 2 dedos de Beauty of Joseon FPS 50, con 30% de arroz que deja la piel jugosa y sin rastro blanco."
import React from "react";
import { arrive, countTo, ease, pop, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { COZY, CozyAuraBackdrop, ProductRefHeader, ReferencePhotoWindow, RoutineAuraStrip, STAGE } from "./parts";

export const Spf: React.FC = () => {
  const { f, theme, ground, scene, cue, endsOn } = useScene();
  const t0 = scene.from - LEAD;
  const c80 = cue("80%");
  const c2 = cue("2");
  const cJoseon = cue("Joseon");
  const c30 = cue("30%");
  const cBlanco = cue("blanco");

  const uvPct = Math.round(countTo(f, endsOn("80%", 24), 24, 0, 80));
  const ricePct = Math.round(countTo(f, endsOn("30%", 20), 20, 0, 30));

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <CozyAuraBackdrop mode="am" />

      <RoutineAuraStrip at={t0} mode="am" title="MAÑANA · PASO 3" badge="ESCUDO SOLAR" barrierPct={100} />

      <ReferencePhotoWindow src="skin-04.jpg" at={t0 + 2} top={644} height={406} borderAccent={COZY.honey}>
        <div
          style={{
            position: "absolute",
            left: 20,
            top: 18,
            padding: "8px 18px",
            borderRadius: 14,
            background: "rgba(38, 26, 20, 0.88)",
            boxShadow: `inset 0 0 0 2px ${COZY.sun}`,
            fontFamily: theme.font.mono,
            fontSize: 32,
            fontWeight: 800,
            color: "#FDE68A",
          }}
        >
          ☀️ {f >= c80 - 20 ? uvPct : 80}% envejecimiento = SOL
        </div>

        {f >= c2 - 4 && (
          <div
            style={{
              position: "absolute",
              left: 20,
              bottom: 16,
              padding: "8px 20px",
              borderRadius: 14,
              background: "rgba(255, 253, 249, 0.95)",
              boxShadow: `inset 0 0 0 2.5px ${COZY.honey}`,
              fontFamily: theme.font.ui,
              fontSize: 32,
              fontWeight: 800,
              color: "#7C451C",
              ...pop(f, c2 - 4, { dur: 9, from: 0.86 }),
            }}
          >
            ✌️ Regla exacta: 2 dedos completos
          </div>
        )}
      </ReferencePhotoWindow>

      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 1068,
          width: STAGE.safeWidth,
          height: 360,
          borderRadius: 28,
          padding: "22px 26px",
          boxSizing: "border-box",
          background: COZY.creamCard,
          boxShadow: `0 22px 52px rgba(110, 78, 58, 0.11), inset 0 0 0 2.5px ${COZY.honey}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 6, 20)) * 110).toFixed(1)}px)`,
          opacity: prog(f, t0 + 6, 4, ease.linear),
        }}
      >
        <ProductRefHeader
          step="PASO 3"
          brand={f >= cJoseon - 8 ? "Beauty of Joseon" : "Protector Diario"}
          tag="FPS 50+ PA++++"
          accent={COZY.honey}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div
            style={{
              padding: "16px 18px",
              borderRadius: 18,
              background: COZY.honeySoft,
              boxShadow: `inset 0 0 0 2px ${COZY.honey}`,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span style={{ fontFamily: theme.font.mono, fontSize: 40, fontWeight: 800, color: "#8C4C1E" }}>
              {f >= c30 - 18 ? ricePct : 30}% Arroz
            </span>
            <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: ground.ink }}>
              + Probióticos
            </span>
          </div>

          <div
            style={{
              padding: "16px 18px",
              borderRadius: 18,
              background: f >= cBlanco - 10 ? COZY.sageSoft : "#F6F0E8",
              boxShadow: `inset 0 0 0 2px ${f >= cBlanco - 10 ? COZY.sage : COZY.borderLight}`,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span style={{ fontFamily: theme.font.ui, fontSize: 36, fontWeight: 800, color: "#235E45" }}>
              Piel jugosa
            </span>
            <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: ground.ink }}>
              0% rastro blanco
            </span>
          </div>
        </div>

        <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: ground.dim }}>
          Estudio Flament et al. · Último paso cada mañana
        </span>
      </div>
    </div>
  );
};
