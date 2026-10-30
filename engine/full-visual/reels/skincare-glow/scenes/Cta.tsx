// Escena 8: `cta`, light
// "Si quieres esta guía completa adaptada a tu tipo de piel, comenta "PIEL" y te la envío."
import React from "react";
import { Cursor, arrive, ease, pop, prog, stagger, typeOn, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { COZY, CozyAuraBackdrop, ReferencePhotoWindow, STAGE } from "./parts";

const GUIDE_CARDS = [
  { tag: "PASO 1 · AM/PM", name: "CeraVe Hidratante", c: COZY.sage },
  { tag: "PASO 2 · DÍA", name: "The Ordinary B3", c: COZY.rose },
  { tag: "PASO 3 · DÍA", name: "Joseon FPS 50+", c: COZY.honey },
  { tag: "NOCHE · 2x/SEM", name: "Retinol B3 0.3%", c: "#8C5B6E" },
];

export const Cta: React.FC = () => {
  const { f, fps, theme, ground, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const cGuia = cue("guía");
  const cComenta = cue("comenta");
  const cPiel = cue('"PIEL"');
  const cEnvio = cue("envío");

  const typed = typeOn("PIEL", f, cPiel - 4, fps, 55);
  const sent = f >= cEnvio - 2;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <CozyAuraBackdrop mode="am" />

      <ReferencePhotoWindow src="skin-08.jpg" at={t0} top={534} height={316} borderAccent={COZY.borderLight}>
        <div
          style={{
            position: "absolute",
            left: 20,
            bottom: 16,
            padding: "6px 18px",
            borderRadius: 12,
            background: "rgba(38, 30, 27, 0.86)",
            fontFamily: theme.font.ui,
            fontSize: 32,
            fontWeight: 800,
            color: "#FFFDF9",
          }}
        >
          ✨ Guía PDF Completa · Rutina por Tipo de Piel
        </div>
      </ReferencePhotoWindow>

      {/* Los 4 productos de referencia en cuadrícula 2x2 */}
      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 868,
          width: STAGE.safeWidth,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {GUIDE_CARDS.map((p, i) => {
          const at = stagger(Math.min(t0 + 5, cGuia), i, 4);
          return (
            <div
              key={p.tag}
              style={{
                padding: "14px 18px",
                borderRadius: 18,
                background: COZY.creamCard,
                boxShadow: `0 12px 26px rgba(110, 78, 58, 0.08), inset 0 0 0 2px ${p.c}`,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                ...pop(f, at, { dur: 9, from: 0.86 }),
              }}
            >
              <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 800, color: p.c }}>{p.tag}</span>
              <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 800, color: ground.ink }}>
                {p.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tarjeta interactiva de comentarios */}
      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 1148,
          width: STAGE.safeWidth,
          height: 278,
          borderRadius: 28,
          padding: "22px 26px",
          boxSizing: "border-box",
          background: COZY.creamCard,
          boxShadow: `0 22px 54px rgba(110, 78, 58, 0.12), inset 0 0 0 2.5px ${COZY.rose}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 8, 20)) * 110).toFixed(1)}px)`,
          opacity: prog(f, t0 + 8, 4, ease.linear),
        }}
      >
        <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 800, color: ground.ink }}>
          Comentarios · Recibe tu rutina AM/PM en PDF
        </span>

        <div
          style={{
            height: 78,
            borderRadius: 999,
            padding: "0 14px 0 26px",
            background: "#F7F1E9",
            boxShadow: `inset 0 0 0 2.5px ${f >= cPiel - 4 ? COZY.rose : COZY.borderLight}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: f >= cPiel - 4 ? theme.font.mono : theme.font.ui,
              fontSize: 38,
              fontWeight: 800,
              color: f >= cPiel - 4 ? ground.ink : ground.dim,
            }}
          >
            {f >= cPiel - 4 ? `${typed.text}${typed.typing ? "|" : ""}` : "Escribe un comentario..."}
          </span>

          <div
            style={{
              height: 54,
              padding: "0 24px",
              borderRadius: 999,
              background: sent ? COZY.sage : COZY.rose,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: theme.font.ui,
              fontSize: 32,
              fontWeight: 800,
              color: "#FFFFFF",
            }}
          >
            {sent ? "Enviado ✓" : "Publicar"}
          </div>
        </div>

        <span
          style={{
            fontFamily: theme.font.ui,
            fontSize: 32,
            fontWeight: 700,
            color: sent ? "#235E45" : ground.dim,
          }}
        >
          {sent ? "✓ Guía de skincare enviada a tu DM" : 'Comenta "PIEL" aquí abajo'}
        </span>
      </div>

      <Cursor
        path={[
          { f: cComenta, x: 860, y: 1470 },
          { f: cPiel + 4, x: 520, y: 1278 },
          { f: cEnvio - 3, x: 830, y: 1278 },
          { f: cEnvio + 12, x: 830, y: 1278 },
          { f: cEnvio + 180, x: 880, y: 1350 },
        ]}
      />
    </div>
  );
};
