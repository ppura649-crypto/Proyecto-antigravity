// Escena 6: `barrier`, dark
// "Sella todo con una capa generosa de crema hidratante de CeraVe para reparar tu barrera mientras duermes, y mantén la calma de 4 a 8 semanas."
import React from "react";
import { arrive, countTo, ease, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { COZY, CozyAuraBackdrop, ProductRefHeader, ReferencePhotoWindow, RoutineAuraStrip, STAGE } from "./parts";

export const Barrier: React.FC = () => {
  const { f, theme, ground, scene, cue, endsOn } = useScene();
  const t0 = scene.from - LEAD;
  const cBarrera = cue("barrera");
  const c4 = cue("4");
  const c8 = cue("8");

  const wks = f >= c8 - 10 ? Math.round(countTo(f, endsOn("8", 16), 16, 4, 8)) : 4;
  const barFill = 35 + 65 * prog(f, c4 - 6, 36, ease.out);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <CozyAuraBackdrop mode="pm" />

      <RoutineAuraStrip
        at={t0}
        mode="pm"
        title="NOCHE · PASO 3"
        badge={f >= cBarrera ? "BARRERA SELLADA" : "HIDRATACIÓN"}
        barrierPct={100}
      />

      <ReferencePhotoWindow src="skin-06.jpg" at={t0 + 2} top={644} height={400} borderAccent={COZY.sage}>
        <div
          style={{
            position: "absolute",
            left: 20,
            bottom: 16,
            padding: "7px 18px",
            borderRadius: 14,
            background: "rgba(28, 20, 21, 0.90)",
            boxShadow: `inset 0 0 0 2px ${COZY.sage}`,
            fontFamily: theme.font.ui,
            fontSize: 32,
            fontWeight: 800,
            color: "#A7F3D0",
          }}
        >
          🛡️ Escudo nocturno · 3 Ceramidas sellan la humedad
        </div>
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
          boxShadow: `0 24px 56px rgba(0,0,0,0.48), inset 0 0 0 2.5px ${COZY.sage}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 6, 20)) * 110).toFixed(1)}px)`,
          opacity: prog(f, t0 + 6, 4, ease.linear),
        }}
      >
        <ProductRefHeader step="PASO 4" brand="CeraVe Crema" tag="Sello Nocturno" accent={COZY.sage} />

        {/* Orden nocturno en 3 píldoras */}
        <div style={{ display: "flex", gap: 10 }}>
          {["1. Limpiar", "2. Retinol 0.3%", "3. Sellar Ceramidas"].map((st, idx) => (
            <div
              key={st}
              style={{
                flex: 1,
                padding: "10px 8px",
                borderRadius: 14,
                textAlign: "center",
                background: idx === 2 ? "rgba(78,154,120,0.26)" : "rgba(255,255,255,0.06)",
                boxShadow: `inset 0 0 0 2px ${idx === 2 ? COZY.sage : COZY.borderDark}`,
                fontFamily: theme.font.ui,
                fontSize: 32,
                fontWeight: 800,
                color: idx === 2 ? "#A7F3D0" : ground.ink,
              }}
            >
              {st}
            </div>
          ))}
        </div>

        {/* Barra de constancia clínica: 4 a 8 semanas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: ground.dim }}>
              Resultados visibles con constancia:
            </span>
            <span style={{ fontFamily: theme.font.mono, fontSize: 36, fontWeight: 800, color: "#F3C999" }}>
              4–{wks} SEMANAS
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: 16,
              borderRadius: 999,
              background: "rgba(255,255,255,0.10)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${barFill.toFixed(1)}%`,
                height: "100%",
                borderRadius: 999,
                background: "linear-gradient(90deg, #D28E5D 0%, #4E9A78 100%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
