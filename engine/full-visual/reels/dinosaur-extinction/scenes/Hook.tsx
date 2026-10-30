// Escena 1: `hook`, dark
// "La explosión del asteroide no mató a los dinosaurios, 2 años de oscuridad total sí, mira cómo ocurrió."
import React from "react";
import { Travel, blurIn, countTo, ease, pop, prog, useScene } from "../../../src/engine";
import { EarthSunlightStrip, IllustrationWindow, PALETTE, STAGE } from "./parts";

export const Hook: React.FC = () => {
  const { f, theme, cue } = useScene();
  const t0 = 2;
  const cExp = cue("explosión");
  const cMato = cue("mató");
  const cTwo = cue("2");
  const cOsc = cue("oscuridad");

  const sunPct = 100 - countTo(f, cTwo - 4, Math.max(18, cOsc + 10 - (cTwo - 4)), 0, 100, ease.outHard);
  const shroud = prog(f, cTwo - 4, 24, ease.inOut);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <EarthSunlightStrip
        at={t0}
        sunPct={sunPct}
        shroud={shroud}
        impact={prog(f, cExp, 12)}
        status={f >= cTwo ? "APAGÓN GLOBAL" : "IMPACTO YUCATÁN"}
      />

      {/* Ilustración orbital realista del impacto en Yucatán y la nube negra avanzando */}
      <IllustrationWindow
        src="ill-01.jpg"
        at={t0 + 2}
        top={644}
        height={496}
        zoom={[1.03, 1.14]}
        panX={[-8, 12]}
        borderAccent={f >= cTwo ? "#EF4444" : "rgba(255,255,255,0.18)"}
      >
        {/* Oscurecimiento progresivo cuando entran los "2 años de oscuridad" */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 68% 34%, rgba(0,0,0,0.78) 0%, rgba(5,5,10,0.48) 70%)",
            opacity: shroud * 0.72,
          }}
        />

        {/* Etiqueta sobre la onda expansiva local, tachada en "no mató" */}
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 22,
            padding: "8px 18px",
            borderRadius: 14,
            background: "rgba(12,14,20,0.86)",
            boxShadow: `inset 0 0 0 2px ${f >= cMato ? "#EF4444" : "#F59E0B"}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            ...blurIn(f, cExp, { dur: 8, rise: 10 }),
          }}
        >
          <div style={{ position: "relative" }}>
            <span
              style={{
                fontFamily: theme.font.ui,
                fontSize: 32,
                fontWeight: 800,
                color: f >= cMato ? "#9CA3AF" : "#FDE047",
              }}
            >
              ONDA EXPANSIVA
            </span>
            {f >= cMato && (
              <div
                style={{
                  position: "absolute",
                  left: -4,
                  top: "52%",
                  height: 4,
                  width: `${(prog(f, cMato, 10, ease.out) * 104).toFixed(1)}%`,
                  background: PALETTE.ember,
                  borderRadius: 4,
                }}
              />
            )}
          </div>
          {f >= cMato && (
            <span
              style={{
                fontFamily: theme.font.mono,
                fontSize: 32,
                fontWeight: 800,
                color: "#FCA5A5",
                ...pop(f, cMato, { dur: 8 }),
              }}
            >
              SOLO LOCAL
            </span>
          )}
        </div>

        {/* Etiqueta inferior dentro de la ilustración */}
        <div
          style={{
            position: "absolute",
            left: 24,
            bottom: 20,
            right: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 800, color: "#FFFFFF" }}>
            {f >= cTwo ? "Manto negro envuelve la Tierra" : "Impacto en costa de Yucatán"}
          </span>
        </div>
      </IllustrationWindow>

      {/* Tarjeta inferior del gancho: de la explosión descartada a los 2 AÑOS SIN SOL */}
      {f < cTwo - 4 ? (
        <div
          style={{
            position: "absolute",
            left: STAGE.left,
            top: 1160,
            width: STAGE.safeWidth,
            height: 250,
            borderRadius: 26,
            padding: "26px 30px",
            boxSizing: "border-box",
            background: "rgba(22,23,28,0.94)",
            boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.10)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 14,
            ...blurIn(f, cExp + 2, { dur: 10, rise: 18 }),
          }}
        >
          <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 700, color: "#9CA3AF" }}>
            ¿QUÉ MATÓ A LOS DINOSAURIOS?
          </span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: theme.font.ui, fontSize: 44, fontWeight: 800, color: "#FFFFFF" }}>
              {f >= cMato ? "✗ No fue el choque inicial" : "Explosión del asteroide"}
            </span>
          </div>
        </div>
      ) : (
        <Travel
          at={cTwo - 4}
          from="bottom"
          dist={180}
          dur={14}
          curve="measured"
          style={{
            position: "absolute",
            left: STAGE.left,
            top: 1160,
            width: STAGE.safeWidth,
            height: 256,
            borderRadius: 26,
            padding: "24px 32px",
            boxSizing: "border-box",
            background: "linear-gradient(135deg, rgba(48,12,18,0.97) 0%, rgba(18,14,20,0.97) 100%)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.58), inset 0 0 0 3px #EF4444",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, color: "#FCA5A5", letterSpacing: 0.5 }}>
            EL VERDADERO ASESINO PLANETARIO
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            <span style={{ fontFamily: theme.font.mono, fontSize: 88, lineHeight: "90px", fontWeight: 800, color: "#FFFFFF" }}>
              2 AÑOS
            </span>
            <span style={{ fontFamily: theme.font.ui, fontSize: 40, fontWeight: 800, color: "#FFFFFF" }}>
              SIN LUZ SOLAR
            </span>
          </div>
          <div style={{ width: "100%", height: 16, borderRadius: 999, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
            <div
              style={{
                width: `${(prog(f, cTwo, 22, ease.out) * 100).toFixed(1)}%`,
                height: "100%",
                background: "linear-gradient(90deg, #F97316, #EF4444)",
              }}
            />
          </div>
        </Travel>
      )}
    </div>
  );
};
