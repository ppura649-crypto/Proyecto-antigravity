// Escena 2: `origin`, dark
// "Imagina esto: hace 66 millones de años, una roca negra de 12 kilómetros cayó sobre la costa de Yucatán en México.
//  En 2024, el rutenio del cráter probó que esa roca vino desde más allá de Júpiter."
import React from "react";
import { Travel, blurIn, countTo, draw, ease, pop, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { EarthSunlightStrip, IllustrationWindow, PaperBadge, STAGE } from "./parts";

export const Origin: React.FC = () => {
  const { f, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const c66 = cue("66");
  const c12 = cue("12");
  const cYuc = cue("Yucatán");
  const c2024 = cue("2024");
  const cRut = cue("rutenio");
  const cJup = cue("Júpiter");

  const matchPct = countTo(f, cRut, Math.max(20, cJup - cRut), 0, 100, ease.outHard);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <EarthSunlightStrip at={t0} sunPct={100} shroud={0} impact={f >= cYuc ? 0.9 : 0.2} status="-66M DE AÑOS" />

      {/* Ilustración espacial: asteroide carbonáceo pasando junto a Júpiter rumbo a la Tierra */}
      <IllustrationWindow
        src="ill-02.jpg"
        at={t0 + 2}
        top={644}
        height={434}
        zoom={[1.04, 1.13]}
        panX={[12, -10]}
        borderAccent="#38BDF8"
      >
        {/* Arco SVG animado trazando la trayectoria desde Júpiter hasta la Tierra */}
        <svg width={860} height={434} viewBox="0 0 860 434" style={{ position: "absolute", inset: 0 }}>
          {f >= cYuc - 6 && (
            <path
              d="M 255 245 Q 535 120 772 182"
              fill="none"
              stroke="#38BDF8"
              strokeWidth={5}
              strokeLinecap="round"
              {...draw(f, cYuc - 6, 24)}
            />
          )}
          {f >= cYuc && (
            <circle cx={772} cy={182} r={14 + Math.sin(f * 0.2) * 3} fill="none" stroke="#EF4444" strokeWidth={4} />
          )}
        </svg>

        {/* Etiqueta de diámetro 12 KM sobre la roca negra */}
        {f >= c12 - 4 && (
          <div
            style={{
              position: "absolute",
              left: 22,
              bottom: 20,
              padding: "8px 18px",
              borderRadius: 14,
              background: "rgba(10,14,24,0.88)",
              boxShadow: "inset 0 0 0 2px #38BDF8",
              fontFamily: theme.font.mono,
              fontSize: 34,
              fontWeight: 800,
              color: "#FFFFFF",
              ...pop(f, c12 - 4, { dur: 9 }),
            }}
          >
            ASTEROIDE NEGRO · 12 KM
          </div>
        )}

        {/* Etiqueta Más allá de Júpiter */}
        {f >= cJup - 8 && (
          <div
            style={{
              position: "absolute",
              right: 22,
              top: 20,
              padding: "8px 18px",
              borderRadius: 14,
              background: "rgba(245,158,11,0.92)",
              fontFamily: theme.font.ui,
              fontSize: 32,
              fontWeight: 800,
              color: "#09090B",
              ...pop(f, cJup - 8, { dur: 9 }),
            }}
          >
            🪐 MÁS ALLÁ DE JÚPITER
          </div>
        )}
      </IllustrationWindow>

      {/* Parte inferior: antes de "2024", datos del impacto en Yucatán; en "2024", tarjeta del estudio Science */}
      {f < c2024 - 4 ? (
        <div
          style={{
            position: "absolute",
            left: STAGE.left,
            top: 1098,
            width: STAGE.safeWidth,
            height: 326,
            borderRadius: 26,
            padding: "26px 30px",
            boxSizing: "border-box",
            background: "rgba(22,24,30,0.95)",
            boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.10)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            ...blurIn(f, c66 - 4, { dur: 10, rise: 18 }),
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 700, color: "#9CA3AF" }}>
              PUNTO DE IMPACTO
            </span>
            <span style={{ fontFamily: theme.font.mono, fontSize: 34, fontWeight: 800, color: "#38BDF8" }}>
              HACE 66M AÑOS
            </span>
          </div>
          <div style={{ fontFamily: theme.font.ui, fontSize: 44, fontWeight: 800, color: ground.ink, lineHeight: "52px" }}>
            {f >= cYuc ? "Costa de Yucatán, México" : "Roca carbonácea de 12 kilómetros"}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ padding: "8px 18px", borderRadius: 12, background: "rgba(56,189,248,0.16)", color: "#7DD3FC", fontFamily: theme.font.mono, fontSize: 32, fontWeight: 700 }}>
              CRÁTER CHICXULUB
            </div>
            {f >= cYuc && (
              <div style={{ padding: "8px 18px", borderRadius: 12, background: "rgba(239,68,68,0.20)", color: "#FCA5A5", fontFamily: theme.font.mono, fontSize: 32, fontWeight: 700, ...pop(f, cYuc) }}>
                IMPACTO DIRECTO
              </div>
            )}
          </div>
        </div>
      ) : (
        <Travel
          at={c2024 - 4}
          from="bottom"
          dist={180}
          dur={14}
          curve="measured"
          style={{
            position: "absolute",
            left: STAGE.left,
            top: 1098,
            width: STAGE.safeWidth,
            height: 328,
            borderRadius: 26,
            padding: "24px 28px",
            boxSizing: "border-box",
            background: "rgba(22,25,34,0.96)",
            boxShadow: "0 24px 56px rgba(0,0,0,0.52), inset 0 0 0 2.5px #38BDF8",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <PaperBadge journal="Science" year="2024" author="Fischer-Gödde et al." accent="#2563EB" />

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: theme.font.ui, fontSize: 36, fontWeight: 800, color: "#FFFFFF" }}>
                Isótopos de Rutenio (Ru-100)
              </span>
              <span style={{ fontFamily: theme.font.mono, fontSize: 36, fontWeight: 800, color: "#38BDF8" }}>
                {Math.round(matchPct)}% TIPO-C
              </span>
            </div>
            <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 600, color: "#9CA3AF" }}>
              Origen confirmado: Sistema Solar exterior
            </span>
          </div>

          <div style={{ width: "100%", height: 20, borderRadius: 999, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.max(5, matchPct).toFixed(1)}%`,
                height: "100%",
                borderRadius: 999,
                background: "linear-gradient(90deg, #2563EB, #38BDF8)",
              }}
            />
          </div>
        </Travel>
      )}
    </div>
  );
};
