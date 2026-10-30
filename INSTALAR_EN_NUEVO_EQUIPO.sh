#!/usr/bin/env bash
set -euo pipefail

echo "=== Instalando proyecto PuraPrueba (Keyframes) en nuevo dispositivo ==="
cd "$(dirname "$0")"

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "-> Se creó .env.local desde .env.example (recuerda pegar tu ELEVENLABS_API_KEY y BUFFER_API_KEY)."
fi

echo "-> Instalando dependencias de Node.js / Remotion..."
npm install

echo ""
echo "=== LISTO ==="
echo "1. Edita .env.local con tu ELEVENLABS_API_KEY y tu BUFFER_API_KEY."
echo "2. Abre esta carpeta como Workspace en Antigravity y escribe:"
echo "   Lee @CONTINUAR_EN_NUEVO_EQUIPO.md para retomar exactamente donde íbamos con PuraPrueba."
