// Escena 7: `turn`, dark
// "No fue una sola explosión, fueron 730 días sin ver el sol."
import React from "react";
import { arrive, countTo, ease, prog, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { IllustrationWindow, PALETTE, STAGE } from "./parts";

export const Turn: React.FC = () => {
  const { f, theme, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const cExp = cue("explosión");
  const c730 = cue("730");
  const cSol = cue("sol");

  const days = Math.round(countTo(f, c730 - 6, Math.max(20, cSol - (c730 - 6)), 1, 730, ease.outHard));

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Ilustración dramática de gran formato: eclipse de ceniza negra sobre llanuras heladas y dinosaurios */}
      <IllustrationWindow
        src="ill-07.jpg"
        at={t0}
        top={534}
        height={554}
        zoom={[1.03, 1.13]}
        panY={[-6, 8]}
        borderAccent="#EF4444"
      >
        {/* Píldora "1 SOLA EXPLOSIÓN" tachada en rojo */}
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 22,
            padding: "8px 20px",
            borderRadius: 14,
            background: "rgba(10,10,14,0.88)",
            boxShadow: "inset 0 0 0 2px rgba(239,68,68,0.55)",
          }}
        >
          <div style={{ position: "relative" }}>
            <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 800, color: "#9CA3AF" }}>
              1 SOLA EXPLOSIÓN
            </span>
            <div
              style={{
                position: "absolute",
                left: -4,
                top: "52%",
                height: 4,
                width: `${(prog(f, cExp - 4, 12, ease.out) * 104).toFixed(1)}%`,
                background: PALETTE.ember,
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      </IllustrationWindow>

      {/* Contador heroico inferior: 730 DÍAS SIN VER EL SOL */}
      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 1108,
          width: STAGE.safeWidth,
          height: 322,
          borderRadius: 28,
          padding: "26px 34px",
          boxSizing: "border-box",
          background: "linear-gradient(135deg, rgba(36,12,16,0.97) 0%, rgba(16,14,20,0.97) 100%)",
          boxShadow: "0 26px 64px rgba(0,0,0,0.6), inset 0 0 0 3px #EF4444",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          transform: `translateY(${((1 - arrive(f, t0 + 4, 18)) * 120).toFixed(1)}px)`,
          opacity: prog(f, t0 + 4, 4, ease.linear),
        }}
      >
        <div
          style={{
            fontFamily: theme.font.mono,
            fontSize: 96,
            lineHeight: "100px",
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
            color: "#FFFFFF",
            letterSpacing: -2,
          }}
        >
          {f >= c730 - 6 ? `${days} DÍAS` : "1 DÍA"}
        </div>
        <div style={{ fontFamily: theme.font.ui, fontSize: 40, fontWeight: 800, color: "#FCA5A5" }}>
          ☀️ SIN VER EL SOL · 0% LUZ
        </div>
      </div>
    </div>
  );
};
