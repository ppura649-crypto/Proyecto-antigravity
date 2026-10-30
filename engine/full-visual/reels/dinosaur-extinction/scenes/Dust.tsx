// Escena 4: `dust`, light
// "Esa roca se volvió polvo microscópico de silicato, más fino que el humo de tu cocina.
//  Un estudio de Nature en 2023 reveló que ese manto negro bloqueó el cielo por 15 años, congelando la Tierra hasta 15 grados Celsius."
import React from "react";
import { arrive, countTo, ease, pop, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { EarthSunlightStrip, IllustrationWindow, PaperBadge, STAGE } from "./parts";

export const Dust: React.FC = () => {
  const { f, theme, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const cSil = cue("silicato");
  const cHumo = cue("humo");
  const c2023 = cue("2023");
  const c15Years = cue("15", 1);
  const cCong = cue("congelando");
  const c15Deg = cue("15", 2);

  const yrs = Math.round(countTo(f, c15Years - 12, 20, 0, 15, ease.outHard));
  const dropDeg = Math.round(countTo(f, cCong, Math.max(18, c15Deg + 14 - cCong), 0, 15, ease.outHard));
  const sunLeft = Math.max(0, Math.round(35 * (1 - prog(f, t0, 40, ease.out))));

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <EarthSunlightStrip
        at={t0}
        sunPct={sunLeft}
        shroud={1}
        impact={0.6}
        status={f >= cCong ? "INVIERNO GLOBAL" : "MANTO DE POLVO"}
      />

      {/* Ilustración del manto negro bloqueando el sol y congelando el bosque prehistórico */}
      <IllustrationWindow
        src="ill-04.jpg"
        at={t0 + 2}
        top={644}
        height={434}
        zoom={[1.04, 1.13]}
        panX={[-10, 10]}
        borderAccent={f >= cCong ? "#0284C7" : "#CBD5E1"}
      >
        {/* Escarcha azulada progresiva cuando dice "congelando la Tierra" */}
        {f >= cCong - 4 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(0deg, rgba(56,189,248,0.28) 0%, transparent 55%)",
              opacity: prog(f, cCong - 4, 24),
            }}
          />
        )}

        {/* Etiqueta microscópica: Silicato vs Humo */}
        {f >= cSil - 4 && (
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 20,
              padding: "8px 18px",
              borderRadius: 14,
              background: "rgba(15,23,42,0.88)",
              boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.22)",
              fontFamily: theme.font.mono,
              fontSize: 32,
              fontWeight: 800,
              color: "#FFFFFF",
              ...pop(f, cSil - 4, { dur: 9 }),
            }}
          >
            {f >= cHumo ? "💨 MÁS FINO QUE EL HUMO (0.8 µm)" : "POLVO DE SILICATO (0.8–8 µm)"}
          </div>
        )}

        {/* Medidor flotante de frío sobre el bosque congelado */}
        {f >= cCong && (
          <div
            style={{
              position: "absolute",
              right: 20,
              bottom: 20,
              padding: "8px 20px",
              borderRadius: 14,
              background: "rgba(2,132,199,0.94)",
              fontFamily: theme.font.mono,
              fontSize: 38,
              fontWeight: 800,
              color: "#FFFFFF",
              ...pop(f, cCong, { dur: 9 }),
            }}
          >
            ❄️ -{dropDeg} °C
          </div>
        )}
      </IllustrationWindow>

      {/* Tarjeta inferior: Nature Geoscience 2023 (Senel et al.) con doble indicador 15 AÑOS y -15 °C */}
      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 1096,
          width: STAGE.safeWidth,
          height: 332,
          borderRadius: 26,
          padding: "22px 28px",
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
        <PaperBadge
          journal="Nature Geosci."
          year={f >= c2023 - 4 ? "2023" : " Tamaño"}
          author="Senel et al."
          accent="#0284C7"
        />

        <div style={{ display: "flex", gap: 18 }}>
          {/* Bloque 1: 15 años atrapado en el cielo */}
          <div
            style={{
              flex: 1,
              padding: "16px 20px",
              borderRadius: 18,
              background: f >= c15Years - 10 ? "#FEF2F2" : "#F8FAFC",
              boxShadow: `inset 0 0 0 2px ${f >= c15Years - 10 ? "#EF4444" : "#E2E8F0"}`,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: "#475569" }}>
              CIELO BLOQUEADO
            </span>
            <span
              style={{
                fontFamily: theme.font.mono,
                fontSize: 54,
                lineHeight: "58px",
                fontWeight: 800,
                color: f >= c15Years - 10 ? "#DC2626" : "#0F172A",
              }}
            >
              {f >= c15Years - 10 ? `${yrs} AÑOS` : "0.8 µm"}
            </span>
          </div>

          {/* Bloque 2: -15 °C enfriamiento global */}
          <div
            style={{
              flex: 1,
              padding: "16px 20px",
              borderRadius: 18,
              background: f >= cCong ? "#EFF6FF" : "#F8FAFC",
              boxShadow: `inset 0 0 0 2px ${f >= cCong ? "#0284C7" : "#E2E8F0"}`,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: "#475569" }}>
              ENFRIAMIENTO
            </span>
            <span
              style={{
                fontFamily: theme.font.mono,
                fontSize: 54,
                lineHeight: "58px",
                fontWeight: 800,
                color: f >= cCong ? "#0284C7" : "#94A3B8",
              }}
            >
              {f >= cCong ? `-${dropDeg} °C` : "HUMO"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
