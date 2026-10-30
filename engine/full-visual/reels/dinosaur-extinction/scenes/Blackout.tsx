// Escena 5: `blackout`, dark
// "Ahí empezó la pesadilla: sin luz, la fotosíntesis murió por casi 2 años.
//  Los bosques se secaron, los herbívoros murieron de hambre y la cadena alimenticia colapsó desde abajo, borrando al 75% de las especies."
import React from "react";
import { Travel, arrive, countTo, ease, mix, pop, prog, stagger, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { EarthSunlightStrip, IllustrationWindow, PALETTE, STAGE } from "./parts";

const ASH = Array.from({ length: 18 }, (_, i) => ({
  x0: (i * 157 + 43) % 840,
  y0: (i * 97 + 19) % 380,
  r: 2.6 + (i % 4) * 1.1,
  vx: 0.6 + (i % 4) * 0.25,
  vy: 0.9 + (i % 3) * 0.35,
}));

export const Blackout: React.FC = () => {
  const { f, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const cFoto = cue("fotosíntesis");
  const cTwo = cue("2");
  const cBosques = cue("bosques");
  const cHerb = cue("herbívoros");
  const cAbajo = cue("abajo");
  const cBorrando = cue("borrando");
  const c75 = cue("75%");

  const rows = [
    {
      title: "DEPREDADORES",
      deadTag: "COLAPSO",
      color: "#F59E0B",
      dead: prog(f, cAbajo - 14, 24, ease.inOut),
      stampAt: cAbajo - 4,
    },
    {
      title: "HERBÍVOROS",
      deadTag: "SIN COMIDA",
      color: "#38BDF8",
      dead: prog(f, cHerb - 4, 24, ease.inOut),
      stampAt: cHerb + 6,
    },
    {
      title: "BOSQUES · FOTOSÍNTESIS",
      deadTag: "0% · 2 AÑOS",
      color: "#22C55E",
      dead: prog(f, cFoto, Math.max(20, cBosques - cFoto), ease.inOut),
      stampAt: cTwo,
    },
  ];

  const wipeAt = cBorrando - 4;
  const pct = countTo(f, cBorrando, Math.max(20, c75 + 18 - cBorrando), 0, 75, ease.outHard);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <EarthSunlightStrip at={t0} sunPct={0} shroud={1} impact={0.8} status="2 AÑOS SIN LUZ" />

      {/* Ilustración vívida: Triceratops y T-Rex hambrientos entre bosques muertos bajo ceniza negra */}
      <IllustrationWindow
        src="ill-05.jpg"
        at={t0 + 2}
        top={642}
        height={386}
        zoom={[1.03, 1.13]}
        panX={[-10, 10]}
        borderAccent="#EF4444"
      >
        {/* Ceniza de silicato cayendo continuamente sobre el paisaje prehistórico */}
        <svg width={860} height={386} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {ASH.map((a, i) => {
            const x = (a.x0 + (f - t0) * a.vx) % 860;
            const y = (a.y0 + (f - t0) * a.vy) % 386;
            return <circle key={i} cx={x} cy={y} r={a.r} fill="#E7E5E4" opacity={0.48} />;
          })}
        </svg>

        <div
          style={{
            position: "absolute",
            left: 20,
            bottom: 16,
            padding: "6px 18px",
            borderRadius: 12,
            background: "rgba(12,12,16,0.86)",
            boxShadow: "inset 0 0 0 2px rgba(239,68,68,0.6)",
            fontFamily: theme.font.ui,
            fontSize: 32,
            fontWeight: 800,
            color: "#FFFFFF",
          }}
        >
          {f >= cBorrando
            ? "75% de la vida desaparece"
            : f >= cHerb
            ? "Herbívoros y carnívoros mueren de hambre"
            : "Bosques secos sin fotosíntesis"}
        </div>
      </IllustrationWindow>

      {/* Cascada de 3 niveles de la cadena alimenticia (colapsa de abajo hacia arriba en su sitio) */}
      <div style={{ position: "absolute", left: STAGE.left, top: 1044, width: STAGE.safeWidth, display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r, idx) => {
          const enterAt = stagger(t0 + 4, 2 - idx, 4);
          const isDead = r.dead > 0.6;
          const accent = mix(f, r.stampAt - 10, 18, r.color, PALETTE.ember);
          return (
            <div
              key={r.title}
              style={{
                height: 72,
                borderRadius: 18,
                padding: "0 22px",
                background: isDead ? "rgba(32,14,18,0.94)" : "rgba(24,25,32,0.94)",
                boxShadow: `inset 0 0 0 2px ${isDead ? "rgba(239,68,68,0.52)" : "rgba(255,255,255,0.10)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transform: `translateY(${((1 - arrive(f, enterAt, 16)) * 80).toFixed(1)}px)`,
                opacity: prog(f, enterAt, 3, ease.linear),
              }}
            >
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 14, height: 14, borderRadius: 999, background: accent }} />
                <span
                  style={{
                    fontFamily: theme.font.ui,
                    fontSize: 33,
                    fontWeight: 800,
                    color: isDead ? "#9CA3AF" : ground.ink,
                  }}
                >
                  {r.title}
                </span>
                {r.dead > 0.35 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 24,
                      top: "52%",
                      height: 4,
                      width: `${(prog(r.dead, 0.35, 0.6, ease.out) * 94).toFixed(1)}%`,
                      background: PALETTE.ember,
                      borderRadius: 4,
                    }}
                  />
                )}
              </div>

              <span
                style={{
                  padding: "3px 14px",
                  borderRadius: 999,
                  background: isDead ? "rgba(239,68,68,0.22)" : "rgba(255,255,255,0.08)",
                  color: isDead ? "#FCA5A5" : accent,
                  fontFamily: theme.font.mono,
                  fontSize: 32,
                  fontWeight: 800,
                  ...(isDead ? pop(f, r.stampAt, { dur: 8 }) : {}),
                }}
              >
                {isDead ? r.deadTag : "ACTIVO"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tarjeta final 75% DE LAS ESPECIES EXTINTAS */}
      {f >= wipeAt && (
        <Travel
          at={wipeAt}
          from="bottom"
          dist={150}
          dur={13}
          curve="measured"
          style={{
            position: "absolute",
            left: STAGE.left,
            top: 1292,
            width: STAGE.safeWidth,
            height: 142,
            borderRadius: 24,
            padding: "16px 28px",
            boxSizing: "border-box",
            background: "linear-gradient(135deg, rgba(52,12,18,0.98) 0%, rgba(22,12,16,0.98) 100%)",
            boxShadow: "0 20px 48px rgba(0,0,0,0.58), inset 0 0 0 3px #EF4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: theme.font.mono,
              fontSize: 78,
              lineHeight: "82px",
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums",
              color: "#FFFFFF",
            }}
          >
            {Math.round(pct)}%
          </span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontFamily: theme.font.ui, fontSize: 36, fontWeight: 800, color: "#FFFFFF" }}>
              ESPECIES EXTINTAS
            </span>
            <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: "#FCA5A5" }}>
              COLAPSO DESDE ABAJO
            </span>
          </div>
        </Travel>
      )}
    </div>
  );
};
