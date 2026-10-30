#!/usr/bin/env node
/**
 * Renderizado Remotion V2 del Episodio 2 (`closing-apps-myth`, `43.91 s`, `1080x1920 @ 60 fps`):
 * - Reutiliza `voice.mp3` + `words.json` ya sintetizados, ajustados a 1.12x y verificados con `check.py plan`
 * - Renderiza en lote 9 stills (Beat A + Beat B) + 2 stills con `--guides`
 * - Renderiza el video completo `closing-apps-myth-es.mp4` (`1080x1920 @ 60 fps`)
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const KF = "/Users/rol.travel/.gemini/antigravity/scratch/keyframes";
const FV = path.join(KF, "engine/full-visual");
const SLUG = "closing-apps-myth";
const REEL = path.join(FV, "reels", SLUG);
const CHROME = path.join(
  KF,
  "node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell",
);

const env = {
  ...process.env,
  CHROME,
  PATH: `/Users/rol.travel/.local/bin:${process.env.PATH ?? ""}`,
};

function run(cmd, args, cwd = FV) {
  console.log(`\n==> ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { cwd, env, stdio: "inherit" });
}

if (!fs.existsSync(path.join(REEL, "words.json"))) {
  run("python3", ["scripts/voice.py", SLUG]);
  run("python3", [
    "scripts/tighten.py",
    SLUG,
    "--cap",
    "0.16",
    "--keep",
    "Tanto Craig:0.24,Cuando sales:0.24,Al cerrarla:0.24,Lo que sí:0.24,Haz esto:0.24,Confiesa en:0.24",
  ]);
  run("python3", ["scripts/align.py", SLUG]);
}

run("python3", ["scripts/check.py", "plan", SLUG]);

const wordsData = JSON.parse(fs.readFileSync(path.join(REEL, "words.json"), "utf8"));
const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9$€%]/g, "");

function wordTime(token, sceneId, offset = 0.20) {
  const scIdx = wordsData.scenes.findIndex((s) => s.id === sceneId);
  const lo = wordsData.scenes[scIdx].firstWord;
  const hi =
    scIdx + 1 < wordsData.scenes.length
      ? wordsData.scenes[scIdx + 1].firstWord - 1
      : wordsData.words.length - 1;
  const key = norm(token);
  for (let i = lo; i <= hi; i++) {
    if (norm(wordsData.words[i].w) === key) {
      return Math.min(wordsData.duration - 0.15, Math.max(0.1, wordsData.words[i].t + offset)).toFixed(2);
    }
  }
  return (wordsData.words[lo].t + 0.45).toFixed(2);
}

const stillsDir = path.join(REEL, "stills");
if (fs.existsSync(stillsDir)) {
  for (const f of fs.readdirSync(stillsDir)) fs.unlinkSync(path.join(stillsDir, f));
}

const tList = [
  wordTime("no", "hook", 0.20),          // Beat 1 Hook: app-01 + MITO FALSO
  wordTime("más", "hook", 0.05),         // Beat 2 Hook: app-08 CPU rojo vivo + PiP + 96% PICO
  wordTime("mito", "execs", 0.08),       // Beat 2 Execs: app-02 | app-09 50/50 split + Apple & Android
  wordTime("congela", "ram", 0.22),      // Beat 1 Ram: app-03 cubos congelados + curva SVG
  wordTime("procesador", "ram", 0.05),   // Beat 2 Ram: app-10 CPU frío + 0.0% PROCESADOR
  wordTime("cero", "coldboot", 0.05),    // Beat 2 Coldboot: app-11 cámara térmica + 96% CPU
  wordTime("siempre", "culprits", 0.05), // Beat 2 Culprits: app-05 | app-12 50/50 split + 2 Vampiros
  wordTime("usar", "rule", 0.06),        // Beat 2 Rule: app-13 escudo esmeralda + 3/3 Ajustes
  wordTime("esto", "cta", 0.12),         // Beat 2 CTA: app-07 | app-14 50/50 split + Publicado ✓
];

const guidesList = [
  wordTime("más", "hook", 0.05),
  wordTime("esto", "cta", 0.12),
];

run("node", ["render.mjs", SLUG, "--stills", tList.join(",")]);
run("node", ["render.mjs", SLUG, "--guides", "--stills", guidesList.join(",")]);

const mp4Path = path.join(REEL, `${SLUG}-es.mp4`);
run("node", ["render.mjs", SLUG, "--out", mp4Path]);

console.log("\n=== EPISODE 2 REMOTION V2 BUILD COMPLETE ===");
