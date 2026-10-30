// Escena 8: `cta`, light
// "Si quieres los 4 estudios científicos originales, comenta "DINO" y te los envío."
import React from "react";
import { Cursor, arrive, ease, pop, prog, stagger, typeOn, useScene } from "../../../src/engine";
import { LEAD } from "../../../src/engine/Stage";
import { IllustrationWindow, STAGE } from "./parts";

const PAPERS = [
  { j: "Science · 2024", t: "Rutenio y Júpiter", c: "#2563EB" },
  { j: "Nature Comm · 2020", t: "Impacto a 60°", c: "#0F172A" },
  { j: "Nature Geosci · 2023", t: "15 años de polvo", c: "#0284C7" },
  { j: "Nature · 2022", t: "Fósiles de primavera", c: "#15803D" },
];

export const Cta: React.FC = () => {
  const { f, fps, theme, scene, cue } = useScene();
  const t0 = scene.from - LEAD;
  const c4 = cue("4");
  const cComenta = cue("comenta");
  const cDino = cue("DINO");
  const cEnvio = cue("envío");

  const typed = typeOn("DINO", f, cDino - 4, fps, 55);
  const sent = f >= cEnvio - 2;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Ilustración de la capa geológica K-Pg y diente fósil de dinosaurio */}
      <IllustrationWindow
        src="ill-08.jpg"
        at={t0}
        top={534}
        height={326}
        zoom={[1.03, 1.10]}
        panX={[-6, 6]}
        borderAccent="#CBD5E1"
      >
        <div
          style={{
            position: "absolute",
            left: 20,
            bottom: 16,
            padding: "6px 18px",
            borderRadius: 12,
            background: "rgba(15,23,42,0.88)",
            fontFamily: theme.font.ui,
            fontSize: 32,
            fontWeight: 800,
            color: "#FFFFFF",
          }}
        >
          Capa real del impacto K-Pg · 4 Papers PDF
        </div>
      </IllustrationWindow>

      {/* Los 4 estudios científicos reales en cuadrícula 2x2 */}
      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 878,
          width: STAGE.safeWidth,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {PAPERS.map((p, i) => {
          const at = stagger(Math.min(t0 + 6, c4 - 4), i, 4);
          return (
            <div
              key={p.j}
              style={{
                padding: "14px 18px",
                borderRadius: 18,
                background: "#FFFFFF",
                boxShadow: `0 12px 28px rgba(15,23,42,0.08), inset 0 0 0 2px ${p.c}`,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                ...pop(f, at, { dur: 9, from: 0.85 }),
              }}
            >
              <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 800, color: p.c }}>{p.j}</span>
              <span style={{ fontFamily: theme.font.ui, fontSize: 32, fontWeight: 700, color: "#0F172A" }}>{p.t}</span>
            </div>
          );
        })}
      </div>

      {/* Barra de comentarios de Instagram redibujada en español + confirmación DM */}
      <div
        style={{
          position: "absolute",
          left: STAGE.left,
          top: 1152,
          width: STAGE.safeWidth,
          height: 274,
          borderRadius: 26,
          padding: "22px 26px",
          boxSizing: "border-box",
          background: "#FFFFFF",
          boxShadow: "0 24px 56px rgba(15,23,42,0.12), inset 0 0 0 2.5px #E2E8F0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transform: `translateY(${((1 - arrive(f, t0 + 8, 20)) * 120).toFixed(1)}px)`,
          opacity: prog(f, t0 + 8, 4, ease.linear),
        }}
      >
        <span style={{ fontFamily: theme.font.ui, fontSize: 34, fontWeight: 800, color: "#0F172A" }}>
          Comentarios · Recibe los 4 PDFs
        </span>

        {/* Campo de texto donde se escribe "DINO" */}
        <div
          style={{
            height: 78,
            borderRadius: 999,
            padding: "0 14px 0 26px",
            background: "#F8FAFC",
            boxShadow: `inset 0 0 0 2.5px ${f >= cDino - 4 ? "#2563EB" : "#CBD5E1"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: f >= cDino - 4 ? theme.font.mono : theme.font.ui,
              fontSize: 38,
              fontWeight: 800,
              color: f >= cDino - 4 ? "#0F172A" : "#94A3B8",
            }}
          >
            {f >= cDino - 4 ? `${typed.text}${typed.typing ? "|" : ""}` : "Escribe un comentario..."}
          </span>

          <div
            style={{
              height: 54,
              padding: "0 24px",
              borderRadius: 999,
              background: sent ? "#16A34A" : "#2563EB",
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

        {/* Estado de envío automático al DM */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontFamily: theme.font.ui,
              fontSize: 32,
              fontWeight: 700,
              color: sent ? "#15803D" : "#64748B",
            }}
          >
            {sent ? "✓ 4 estudios enviados a tu DM" : 'Comenta "DINO" abajo'}
          </span>
        </div>
      </div>

      {/* Cursor macOS tocando el botón Publicar */}
      <Cursor
        path={[
          { f: cComenta, x: 860, y: 1470 },
          { f: cDino + 4, x: 520, y: 1280 },
          { f: cEnvio - 3, x: 830, y: 1280 },
          { f: cEnvio + 12, x: 830, y: 1280 },
          { f: cEnvio + 180, x: 880, y: 1350 },
        ]}
      />
    </div>
  );
};
