// Escena 7: `turn`, light (tabla resumen guardable Día vs. Noche)
// "Una piel sana no nace de saturar tu rostro, sino de protegerlo de día y abrazarlo de noche."
import React from "react";
import { arrive, ease, pop, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { COZY, CozyAuraBackdrop, ReferencePhotoWindow, STAGE } from "./parts";

export const Turn: React.FC = () => {
  const { f, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const cSaturar = cue("saturar");
  const cProteger = cue("protegerlo");
  const cAbrazar = cue("abrazarlo");

  const strike = prog(f, cSaturar - 2, 12, ease.out);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <CozyAuraBackdrop mode="am" />

      <ReferencePhotoWindow src="skin-07.jpg" at={t0} top={534} height={366} borderAccent={COZY.borderLight}>
        {f >= cSaturar - 4 && (
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 18,
              padding: "7px 18px",
              borderRadius: 14,
              background: "rgba(38, 22, 24, 0.86)",
              ...pop(f, cSaturar - 4, { dur: 8, from: 0.88 }),
            }}
          >
            <div style={{ position: "relative" }}>
              <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, color: "#FECDD3" }}>
                SATURAR TU ROSTRO
              </span>
              <div
                style={{
                  position: "absolute",
                  left: -4,
                  right: -4,
                  top: "50%",
                  height: 4,
                  background: "#F43F5E",
                  transform: `scaleX(${strike.toFixed(3)})`,
                  transformOrigin: "left center",
                }}
              />
            </div>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            left: 20,
            bottom: 16,
            padding: "6px 18px",
            borderRadius: 12,
            background: "rgba(255, 253, 249, 0.94)",
            fontFamily: theme.font.ui,
            fontSize: 32,
            fontWeight: 800,
            color: ground.ink,
          }}
        >
          📌 Resumen de Referencia · Guarda esta pantalla
        </div>
      </ReferencePhotoWindow>

      {/* Tabla Resumen AM vs PM para guardar de referencia */}
      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 918,
          width: STAGE.safeWidth,
          height: 510,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          transform: `translateY(${((1 - arrive(f, t0 + 6, 20)) * 110).toFixed(1)}px)`,
          opacity: prog(f, t0 + 6, 4, ease.linear),
        }}
      >
        {/* Columna DÍA */}
        <div
          style={{
            borderRadius: 26,
            padding: "22px 20px",
            background: COZY.creamCard,
            boxShadow: `0 18px 44px rgba(110, 78, 58, 0.10), inset 0 0 0 2.5px ${
              f >= cProteger - 4 ? COZY.honey : COZY.borderLight
            }`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 800, color: "#9E5E2E" }}>
            ☀️ DE DÍA
          </span>
          <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: ground.dim }}>
            Proteger
          </span>
          {["1. CeraVe Limpiador", "2. Niacinamida 10%", "3. Joseon FPS 50+"].map((row) => (
            <div
              key={row}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                background: f >= cProteger - 4 ? COZY.honeySoft : "#F6F0E8",
                fontFamily: theme.font.ui,
                fontSize: 32,
                fontWeight: 800,
                color: ground.ink,
              }}
            >
              {row}
            </div>
          ))}
        </div>

        {/* Columna NOCHE */}
        <div
          style={{
            borderRadius: 26,
            padding: "22px 20px",
            background: "#261D1F",
            boxShadow: `0 18px 44px rgba(38, 22, 24, 0.22), inset 0 0 0 2.5px ${
              f >= cAbrazar - 4 ? COZY.rose : COZY.borderDark
            }`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 800, color: "#F3C999" }}>
            🌙 DE NOCHE
          </span>
          <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: "#D6C4BC" }}>
            Reparar
          </span>
          {["1. CeraVe Limpiador", "2. Retinol B3 0.3%", "3. CeraVe Crema"].map((row) => (
            <div
              key={row}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                background: f >= cAbrazar - 4 ? "rgba(201, 114, 123, 0.28)" : "rgba(255,255,255,0.07)",
                fontFamily: theme.font.ui,
                fontSize: 32,
                fontWeight: 800,
                color: "#FAF3EC",
              }}
            >
              {row}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
