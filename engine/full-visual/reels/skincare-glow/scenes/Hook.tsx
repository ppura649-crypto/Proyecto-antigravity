// Escena 1: `hook`, light (crema cálido confortable)
// "Tener una piel bonita y luminosa no requiere 10 productos caros, solo cuidar tu barrera con 4 pasos bien hechos."
import React from "react";
import { arrive, countTo, ease, pop, prog, stagger, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { COZY, CozyAuraBackdrop, ReferencePhotoWindow, RoutineAuraStrip, STAGE } from "./parts";

const PILLARS = ["1. Limpiar", "2. Tratar", "3. Proteger", "4. Reparar"];

export const Hook: React.FC = () => {
  const { f, theme, ground, scene, cue, endsOn } = useScene();
  const t0 = scene.from - LEAD;
  const c10 = cue("10");
  const cCaros = cue("caros");
  const cBarrera = cue("barrera");
  const c4 = cue("4");

  const strike = prog(f, cCaros - 2, 12, ease.out);
  const stepsNum = Math.round(countTo(f, endsOn("4", 18), 18, 1, 4));
  const barrierPct = 42 + 58 * prog(f, cBarrera - 6, 26, ease.out);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <CozyAuraBackdrop mode="am" />

      <RoutineAuraStrip
        at={t0}
        mode="am"
        title="BARRERA CUTÁNEA"
        badge={f >= cBarrera ? "GLOW NATURAL" : "EQUILIBRIO"}
        barrierPct={barrierPct}
      />

      <ReferencePhotoWindow src="skin-01.jpg" at={t0 + 2} top={644} height={416} borderAccent={COZY.borderLight}>
        {f >= c10 - 4 && (
          <div
            style={{
              position: "absolute",
              left: 22,
              top: 20,
              padding: "8px 20px",
              borderRadius: 14,
              background: "rgba(38, 26, 25, 0.84)",
              boxShadow: "inset 0 0 0 2px rgba(244, 180, 188, 0.6)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              ...pop(f, c10 - 4, { dur: 9, from: 0.88 }),
            }}
          >
            <div style={{ position: "relative" }}>
              <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, color: "#FAD2D7" }}>
                10 PRODUCTOS CAROS
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
            left: 22,
            bottom: 18,
            padding: "6px 18px",
            borderRadius: 12,
            background: "rgba(255, 253, 249, 0.92)",
            fontFamily: theme.font.ui,
            fontSize: 32,
            fontWeight: 800,
            color: "#261E1B",
          }}
        >
          ✨ Piel luminosa sin saturar tu rostro
        </div>
      </ReferencePhotoWindow>

      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 1078,
          width: STAGE.safeWidth,
          height: 350,
          borderRadius: 28,
          padding: "24px 28px",
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, color: COZY.roseDeep }}>
            LA REGLA DE ORO DEL SKINCARE
          </span>
          <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 800, color: COZY.sage }}>
            AM + PM
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <span
            style={{
              fontFamily: theme.font.mono,
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1,
              color: ground.ink,
            }}
          >
            {f >= c4 - 16 ? stepsNum : 4} PASOS
          </span>
          <span style={{ fontFamily: theme.font.ui, fontSize: 38, fontWeight: 700, color: ground.dim }}>
            bien hechos
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {PILLARS.map((item, i) => (
            <div
              key={item}
              style={{
                padding: "10px 16px",
                borderRadius: 14,
                background: i % 2 === 0 ? COZY.roseSoft : COZY.sageSoft,
                fontFamily: theme.font.ui,
                fontSize: 32,
                fontWeight: 800,
                color: i % 2 === 0 ? COZY.roseDeep : "#2E6F53",
                ...pop(f, stagger(Math.min(cBarrera, c4 - 8), i, 4), { dur: 9, from: 0.86 }),
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
