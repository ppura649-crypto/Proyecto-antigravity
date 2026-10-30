// Escena 2: `cleanser`, light
// "Empieza cada mañana lavando tu cara con agua tibia por 60 segundos, nunca caliente. Usa un limpiador noble como CeraVe Hidratante, que limpia sin resecar gracias a sus 3 ceramidas esenciales y ácido hialurónico."
import React from "react";
import { arrive, countTo, ease, pop, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { COZY, CozyAuraBackdrop, ProductRefHeader, ReferencePhotoWindow, RoutineAuraStrip, STAGE } from "./parts";

export const Cleanser: React.FC = () => {
  const { f, theme, ground, scene, cue, endsOn } = useScene();
  const t0 = scene.from - LEAD;
  const c60 = cue("60");
  const cCaliente = cue("caliente");
  const cCerave = cue("CeraVe");
  const c3 = cue("3");
  const cHial = cue("hialurónico");

  const secs = Math.round(countTo(f, endsOn("60", 22), 22, 0, 60));
  const strikeHot = prog(f, cCaliente - 2, 10, ease.out);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <CozyAuraBackdrop mode="am" />

      <RoutineAuraStrip at={t0} mode="am" title="MAÑANA · PASO 1" badge="LIMPIEZA SUAVE" barrierPct={74} />

      <ReferencePhotoWindow src="skin-02.jpg" at={t0 + 2} top={644} height={406} borderAccent={COZY.borderLight}>
        <div
          style={{
            position: "absolute",
            left: 20,
            top: 18,
            padding: "8px 18px",
            borderRadius: 14,
            background: "rgba(255, 253, 249, 0.94)",
            boxShadow: `inset 0 0 0 2px ${COZY.sage}`,
            fontFamily: theme.font.mono,
            fontSize: 32,
            fontWeight: 800,
            color: "#235E45",
          }}
        >
          💧 AGUA TIBIA · {f >= c60 - 20 ? secs : 60}s
        </div>

        {f >= cCaliente - 4 && (
          <div
            style={{
              position: "absolute",
              right: 20,
              top: 18,
              padding: "8px 18px",
              borderRadius: 14,
              background: "rgba(38, 22, 24, 0.86)",
              ...pop(f, cCaliente - 4, { dur: 8, from: 0.86 }),
            }}
          >
            <div style={{ position: "relative" }}>
              <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, color: "#FECDD3" }}>
                AGUA CALIENTE
              </span>
              <div
                style={{
                  position: "absolute",
                  left: -4,
                  right: -4,
                  top: "50%",
                  height: 4,
                  background: "#F43F5E",
                  transform: `scaleX(${strikeHot.toFixed(3)})`,
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
            background: "rgba(38, 30, 27, 0.82)",
            fontFamily: theme.font.ui,
            fontSize: 32,
            fontWeight: 700,
            color: "#FFFDF9",
          }}
        >
          Sin espuma agresiva · Limpia sin resecar
        </div>
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
          boxShadow: `0 22px 52px rgba(110, 78, 58, 0.11), inset 0 0 0 2.5px ${COZY.sage}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 6, 20)) * 110).toFixed(1)}px)`,
          opacity: prog(f, t0 + 6, 4, ease.linear),
        }}
      >
        <ProductRefHeader
          step="PASO 1"
          brand={f >= cCerave - 6 ? "CeraVe Hidratante" : "Limpiador Noble"}
          tag="pH 5.5"
          accent={COZY.sage}
        />

        <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 700, color: ground.dim }}>
          Activos de referencia que protegen tu barrera:
        </span>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div
            style={{
              padding: "16px 18px",
              borderRadius: 18,
              background: f >= c3 - 4 ? COZY.sageSoft : "#F6F0E8",
              boxShadow: `inset 0 0 0 2px ${f >= c3 - 4 ? COZY.sage : COZY.borderLight}`,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span style={{ fontFamily: theme.font.mono, fontSize: 38, fontWeight: 800, color: "#235E45" }}>
              3 Ceramidas
            </span>
            <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: ground.ink }}>
              Esenciales (1, 3, 6-II)
            </span>
          </div>

          <div
            style={{
              padding: "16px 18px",
              borderRadius: 18,
              background: f >= cHial - 8 ? COZY.roseSoft : "#F6F0E8",
              boxShadow: `inset 0 0 0 2px ${f >= cHial - 8 ? COZY.rose : COZY.borderLight}`,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span style={{ fontFamily: theme.font.mono, fontSize: 38, fontWeight: 800, color: COZY.roseDeep }}>
              Hialurónico
            </span>
            <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: ground.ink }}>
              Retiene humedad
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
