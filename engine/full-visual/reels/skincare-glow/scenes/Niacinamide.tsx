// Escena 3: `niacinamide`, light
// "El secreto está en aplicar los sueros sobre la piel húmeda, siempre del más ligero al más denso. De día, 3 gotas de Niacinamida al 10% con Zinc de The Ordinary calman rojeces, afinan poros y controlan el brillo."
import React from "react";
import { arrive, countTo, ease, pop, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { COZY, CozyAuraBackdrop, ProductRefHeader, ReferencePhotoWindow, RoutineAuraStrip, STAGE } from "./parts";

export const Niacinamide: React.FC = () => {
  const { f, theme, ground, scene, cue, endsOn } = useScene();
  const t0 = scene.from - LEAD;
  const cHumeda = cue("húmeda");
  const cLigero = cue("ligero");
  const cDenso = cue("denso");
  const c3 = cue("3");
  const cRojeces = cue("rojeces");
  const cPoros = cue("poros");
  const cBrillo = cue("brillo");

  const drops = Math.round(countTo(f, endsOn("3", 16), 16, 1, 3));

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <CozyAuraBackdrop mode="am" />

      <RoutineAuraStrip at={t0} mode="am" title="MAÑANA · PASO 2" badge="ORDEN DE CAPAS" barrierPct={88} />

      <ReferencePhotoWindow src="skin-03.jpg" at={t0 + 2} top={644} height={406} borderAccent={COZY.borderLight}>
        <div
          style={{
            position: "absolute",
            left: 20,
            top: 18,
            padding: "7px 18px",
            borderRadius: 14,
            background: "rgba(255, 253, 249, 0.94)",
            boxShadow: `inset 0 0 0 2px ${COZY.rose}`,
            fontFamily: theme.font.ui,
            fontSize: 32,
            fontWeight: 800,
            color: COZY.roseDeep,
          }}
        >
          {f >= c3 - 4 ? `💧 ${drops} gotas · Piel húmeda` : f >= cHumeda - 4 ? "💧 Tip: Aplicar en piel húmeda" : "✨ Texturas de referencia"}
        </div>

        {/* Escalera visual de densidad: Ligero -> Emulsión -> Denso */}
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          {[
            { t: "1. Ligero", on: f >= cLigero - 4 },
            { t: "2. Crema", on: f >= (cLigero + cDenso) / 2 },
            { t: "3. Denso", on: f >= cDenso - 4 },
          ].map((b) => (
            <div
              key={b.t}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: 12,
                textAlign: "center",
                background: b.on ? "rgba(201, 114, 123, 0.95)" : "rgba(38, 30, 27, 0.78)",
                fontFamily: theme.font.ui,
                fontSize: 32,
                fontWeight: 800,
                color: "#FFFFFF",
              }}
            >
              {b.t}
            </div>
          ))}
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
          boxShadow: `0 22px 52px rgba(110, 78, 58, 0.11), inset 0 0 0 2.5px ${COZY.rose}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 6, 20)) * 110).toFixed(1)}px)`,
          opacity: prog(f, t0 + 6, 4, ease.linear),
        }}
      >
        <ProductRefHeader step="PASO 2" brand="The Ordinary" tag="B3 10% + Zn 1%" accent={COZY.rose} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: theme.font.ui, fontSize: 36, fontWeight: 800, color: ground.ink }}>
            Niacinamida 10% + Zinc 1%
          </span>
          <span style={{ fontFamily: theme.font.mono, fontSize: 34, fontWeight: 800, color: COZY.roseDeep }}>
            {drops} GOTAS
          </span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "✓ Rojeces", at: cRojeces - 4 },
            { label: "✓ Poros", at: cPoros - 4 },
            { label: "✓ Brillo", at: cBrillo - 4 },
          ].map((chip) => {
            const active = f >= chip.at;
            return (
              <div
                key={chip.label}
                style={{
                  flex: 1,
                  padding: "14px 10px",
                  borderRadius: 16,
                  textAlign: "center",
                  background: active ? COZY.sageSoft : "#F6F0E8",
                  boxShadow: `inset 0 0 0 2px ${active ? COZY.sage : COZY.borderLight}`,
                  fontFamily: theme.font.ui,
                  fontSize: 32,
                  fontWeight: 800,
                  color: active ? "#235E45" : ground.dim,
                  ...(active ? pop(f, chip.at, { dur: 8, from: 0.9 }) : {}),
                }}
              >
                {chip.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
