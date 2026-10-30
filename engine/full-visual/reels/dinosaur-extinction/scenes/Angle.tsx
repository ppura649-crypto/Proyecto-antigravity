// Escena 3: `angle`, light
// "Al chocar, simulaciones 3D mostraron que entró en un ángulo inclinado de 60 grados.
//  Fue la trayectoria más letal posible, disparando toneladas de azufre hirviendo y roca pulverizada directo al cielo."
import React from "react";
import { arrive, countTo, draw, ease, mix, pop, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { EarthSunlightStrip, IllustrationWindow, PALETTE, PaperBadge, STAGE } from "./parts";

export const Angle: React.FC = () => {
  const { f, theme, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const cAng = cue("ángulo");
  const c60 = cue("60");
  const cLetal = cue("letal");
  const cAzufre = cue("azufre");
  const cCielo = cue("cielo");

  const deg = Math.round(countTo(f, cAng - 4, Math.max(16, c60 + 8 - (cAng - 4)), 90, 60, ease.outHard));
  const ejecta = countTo(f, cLetal - 2, Math.max(24, cCielo - (cLetal - 2)), 25, 100, ease.outHard);
  const sunDrop = 100 - prog(f, cAzufre, 32, ease.inOut) * 65;
  const alarmColor = mix(f, cLetal - 2, 14, "#2563EB", PALETTE.ember);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <EarthSunlightStrip
        at={t0}
        sunPct={sunDrop}
        shroud={prog(f, cAzufre, 32)}
        impact={1}
        status={f >= cAzufre ? "PLUMA AL CIELO" : "IMPACTO 3D"}
      />

      {/* Ilustración del cráter oblicuo en Yucatán lanzando azufre dorado y roca al cielo */}
      <IllustrationWindow
        src="ill-03.jpg"
        at={t0 + 2}
        top={644}
        height={438}
        zoom={[1.03, 1.12]}
        panY={[8, -8]}
        borderAccent={f >= cLetal ? "#EF4444" : "#CBD5E1"}
      >
        {/* Vector y transportador de ángulo 60° dibujados sobre el cráter */}
        <svg width={860} height={438} viewBox="0 0 860 438" style={{ position: "absolute", inset: 0 }}>
          {f >= cAng - 6 && (
            <>
              {/* Línea horizontal de superficie marina */}
              <line x1="160" y1="305" x2="680" y2="305" stroke="rgba(255,255,255,0.65)" strokeWidth="3" />
              {/* Vector inclinado a 60° hacia el centro del cráter (455, 305) */}
              <line
                x1="315"
                y1="62"
                x2="455"
                y2="305"
                stroke={f >= cLetal ? "#EF4444" : "#FDE047"}
                strokeWidth="7"
                strokeLinecap="round"
                {...draw(f, cAng - 6, 18)}
              />
              {/* Arco de 60 grados */}
              <path
                d="M 380 305 A 75 75 0 0 1 417 240"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="4"
                {...draw(f, c60 - 6, 14)}
              />
            </>
          )}
        </svg>

        {/* Píldora 60° ÁNGULO MÁS LETAL */}
        {f >= c60 - 4 && (
          <div
            style={{
              position: "absolute",
              left: 22,
              top: 20,
              padding: "8px 20px",
              borderRadius: 14,
              background: f >= cLetal ? "rgba(220,38,38,0.94)" : "rgba(15,23,42,0.88)",
              fontFamily: theme.font.mono,
              fontSize: 36,
              fontWeight: 800,
              color: "#FFFFFF",
              ...pop(f, c60 - 4, { dur: 9 }),
            }}
          >
            {deg}° {f >= cLetal ? "· MÁS LETAL" : "INCLINACIÓN"}
          </div>
        )}

        {/* Etiqueta de Azufre + Roca ascendiendo */}
        {f >= cAzufre - 4 && (
          <div
            style={{
              position: "absolute",
              right: 22,
              bottom: 20,
              padding: "8px 18px",
              borderRadius: 14,
              background: "rgba(234,179,8,0.95)",
              fontFamily: theme.font.ui,
              fontSize: 32,
              fontWeight: 800,
              color: "#0F172A",
              ...pop(f, cAzufre - 4, { dur: 9 }),
            }}
          >
            ▲ AZUFRE + ROCA AL CIELO
          </div>
        )}
      </IllustrationWindow>

      {/* Tarjeta inferior (Nature Communications 2020 · Collins et al.): comparador de letalidad por ángulo */}
      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 1100,
          width: STAGE.safeWidth,
          height: 328,
          borderRadius: 26,
          padding: "24px 28px",
          boxSizing: "border-box",
          background: "#FFFFFF",
          boxShadow: `0 22px 52px rgba(15,23,42,0.10), inset 0 0 0 2.5px ${f >= cLetal ? "#EF4444" : "#E2E8F0"}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 6, 20)) * 120).toFixed(1)}px)`,
          opacity: prog(f, t0 + 6, 4, ease.linear),
        }}
      >
        <PaperBadge journal="Nature Comm." year="Simulación 3D" author="Collins et al." accent="#0F172A" />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: theme.font.ui, fontSize: 36, fontWeight: 800, color: "#0F172A" }}>
            {f >= cAzufre ? "Azufre y roca lanzados" : "Trayectoria de impacto"}
          </span>
          <span style={{ fontFamily: theme.font.mono, fontSize: 42, fontWeight: 800, color: alarmColor }}>
            {f >= cLetal ? `${Math.round(ejecta)}% MÁX` : `${deg}°`}
          </span>
        </div>

        {/* Tres píldoras de ángulos comparados (90° vs 60° vs 30°) + barra de eyección */}
        <div style={{ display: "flex", gap: 14 }}>
          {[
            { label: "90° Vertical", active: false },
            { label: "60° PEOR ÁNGULO", active: f >= c60 - 2 },
            { label: "30° Rasante", active: false },
          ].map((opt) => (
            <div
              key={opt.label}
              style={{
                flex: opt.active ? 1.4 : 1,
                height: 58,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: opt.active ? (f >= cLetal ? "#FEE2E2" : "#DBEAFE") : "#F1F5F9",
                boxShadow: opt.active ? `inset 0 0 0 2.5px ${alarmColor}` : "none",
                fontFamily: theme.font.ui,
                fontSize: 32,
                fontWeight: opt.active ? 800 : 600,
                color: opt.active ? (f >= cLetal ? "#DC2626" : "#1D4ED8") : "#64748B",
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
