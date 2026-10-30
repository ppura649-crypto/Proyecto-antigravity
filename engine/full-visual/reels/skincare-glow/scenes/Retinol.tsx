// Escena 5: `retinol`, dark (noche confortable a la luz de las velas)
// "Al llegar la noche, tu piel se repara. Con el rostro limpio y seco, aplica el tamaño de 1 guisante de Retinol B3 al 0.3% de La Roche-Posay, solo 2 noches por semana para suavizar textura y manchas sin irritar."
import React from "react";
import { arrive, ease, pop, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { COZY, CozyAuraBackdrop, ProductRefHeader, ReferencePhotoWindow, RoutineAuraStrip, STAGE } from "./parts";

const DAYS = [
  { d: "L", on: false },
  { d: "M", on: true },
  { d: "X", on: false },
  { d: "J", on: false },
  { d: "V", on: true },
  { d: "S", on: false },
  { d: "D", on: false },
];

export const Retinol: React.FC = () => {
  const { f, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const cSeco = cue("seco");
  const c1 = cue("1");
  const c03 = cue("0.3%");
  const c2 = cue("2");
  const cTextura = cue("textura");

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <CozyAuraBackdrop mode="pm" />

      <RoutineAuraStrip at={t0} mode="pm" title="NOCHE · PASO 2" badge="RENOVACIÓN" barrierPct={94} />

      <ReferencePhotoWindow src="skin-05.jpg" at={t0 + 2} top={644} height={400} borderAccent={COZY.honey}>
        {f >= cSeco - 4 && (
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 18,
              padding: "7px 18px",
              borderRadius: 14,
              background: "rgba(28, 20, 21, 0.88)",
              boxShadow: "inset 0 0 0 2px rgba(243, 201, 153, 0.55)",
              fontFamily: theme.font.ui,
              fontSize: 32,
              fontWeight: 800,
              color: "#FCE3C2",
              ...pop(f, cSeco - 4, { dur: 8, from: 0.88 }),
            }}
          >
            🌙 Aplicar sobre rostro SECO
          </div>
        )}

        {f >= c1 - 4 && (
          <div
            style={{
              position: "absolute",
              left: 20,
              bottom: 16,
              padding: "7px 18px",
              borderRadius: 14,
              background: "rgba(201, 114, 123, 0.92)",
              fontFamily: theme.font.ui,
              fontSize: 32,
              fontWeight: 800,
              color: "#FFFFFF",
              ...pop(f, c1 - 4, { dur: 9, from: 0.86 }),
            }}
          >
            ● Medida exacta: 1 guisante
          </div>
        )}

        {f >= c03 + 20 && f < scene.to - 14 && (
          <div
            style={{
              position: "absolute",
              right: 20,
              top: 18,
              padding: "7px 18px",
              borderRadius: 14,
              background: "linear-gradient(135deg, #F3C999 0%, #D28E5D 100%)",
              boxShadow: "0 10px 26px rgba(0, 0, 0, 0.42)",
              fontFamily: theme.font.mono,
              fontSize: 32,
              fontWeight: 800,
              color: "#1B1516",
              opacity: 1 - prog(f, scene.to - 28, 14, ease.inOut),
              ...pop(f, c03 + 20, { dur: 14, from: 0.78 }),
            }}
          >
            0.3% + B3
          </div>
        )}
      </ReferencePhotoWindow>

      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 1062,
          width: STAGE.safeWidth,
          height: 366,
          borderRadius: 28,
          padding: "22px 26px",
          boxSizing: "border-box",
          background: COZY.plumCard,
          boxShadow: `0 24px 56px rgba(0,0,0,0.48), inset 0 0 0 2.5px ${COZY.rose}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 6, 20)) * 110).toFixed(1)}px)`,
          opacity: prog(f, t0 + 6, 4, ease.linear),
        }}
      >
        <ProductRefHeader
          step="NOCHE"
          brand="La Roche-Posay"
          tag={f >= c03 - 4 ? "Retinol 0.3% + B3" : "Retinol B3"}
          accent={COZY.rose}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 700, color: ground.ink }}>
            {f >= cTextura - 4 ? "✓ Suaviza textura y manchas sin irritar" : "Frecuencia inicial recomendada:"}
          </span>
          <span style={{ fontFamily: theme.font.mono, fontSize: 34, fontWeight: 800, color: "#F3C999" }}>
            2x / SEM
          </span>
        </div>

        {/* Calendario semanal: ilumina 2 noches por semana */}
        <div style={{ display: "flex", gap: 10 }}>
          {DAYS.map((item) => {
            const lit = item.on && f >= c2 - 4;
            return (
              <div
                key={item.d}
                style={{
                  flex: 1,
                  height: 68,
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: lit ? COZY.rose : "rgba(255,255,255,0.06)",
                  boxShadow: lit ? "0 8px 20px rgba(201,114,123,0.4)" : `inset 0 0 0 2px ${COZY.borderDark}`,
                  fontFamily: theme.font.mono,
                  fontSize: 34,
                  fontWeight: 800,
                  color: lit ? "#FFFFFF" : ground.dim,
                }}
              >
                {item.d}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
