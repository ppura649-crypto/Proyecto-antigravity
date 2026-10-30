# Memoria Maestra del Proyecto · PuraPrueba (`keyframes`)

> **Cómo reanudar toda la sesión en un dispositivo nuevo en 10 segundos:**
> Si en el nuevo computador abres una conversación nueva en Antigravity, abre como Workspace esta carpeta (`keyframes`) y escribe en el chat:
> `Lee @CONTINUAR_EN_NUEVO_EQUIPO.md para retomar exactamente donde íbamos con PuraPrueba.`

---

## 1. Estado Actual del Proyecto

- **Marca oficial creada:** **PuraPrueba** (`@puraprueba` / `@puraprueba.tv`)
- **Kit gráfico oficial exportado en:** `workspace/brand-puraprueba/`
  - `avatar_circular_recomendado_1080x1080.png` (`1080x1080`)
  - `avatar_escudo_alternativo_1080x1080.png` (`1080x1080`)
  - `banner_youtube_2560x1440.jpg` (`2560x1440`)
  - `portada_facebook_1640x624.jpg` (`1640x624`)
- **Episodios Virales Terminados y Validados (`1080x1920 @ 60 fps`):**
  1. **Episodio 1 (`battery-myth`, `49.22 s`):** *"Dejar cargando tu celular toda la noche NO daña la batería, estos 2 hábitos diarios sí"*
     - Carpeta lista para subir: `workspace/output/2026-10-30-full-visual-battery-myth/` (`battery-myth.mp4`, `cover.jpg`, `caption.txt`)
     - Código fuente: `engine/full-visual/reels/battery-myth/`
  2. **Episodio 2 (`closing-apps-myth`, `43.91 s`):** *"Cerrar todas las apps de tu celular NO ahorra batería, abrirlas desde cero gasta más"*
     - Carpeta lista para subir: `workspace/output/2026-10-30-full-visual-closing-apps-myth/` (`closing-apps-myth.mp4`, `cover.jpg`, `caption.txt`)
     - Código fuente: `engine/full-visual/reels/closing-apps-myth/`

---

## 2. Sistema de Autopublicación Gratuita (`$0`)

- **Script CLI listo:** `workspace/library/auto-publish/publish_reel.mjs`
- **Modo gratuito por defecto (`buffer`):**
  - Conectar en Buffer Plan Gratis (`https://buffer.com`) los 3 canales: **TikTok + Instagram Reels + YouTube Shorts** (activando en Instagram el reenvío automático gratuito de Reels a **Facebook Reels**).
  - Copiar la API Key gratuita desde `https://publish.buffer.com/settings/api` y agregarla en `.env.local`:
    ```ini
    BUFFER_API_KEY=tu_clave_aqui
    ```
  - Comandos listos para publicar Episodios 1 y 2:
    ```bash
    node workspace/library/auto-publish/publish_reel.mjs workspace/output/2026-10-30-full-visual-battery-myth
    node workspace/library/auto-publish/publish_reel.mjs workspace/output/2026-10-30-full-visual-closing-apps-myth
    ```

---

## 3. Receta Técnica Aprobada para Nuevos Episodios (Estándar V2 Viral)

1. **Motor:** `engine/full-visual` (`1080x1920 @ 60 fps`, estética Cyber-Neon `#060911` / `#EDF3FF`, acentos `#00F0FF`, `#00E699`, `#FF1E56`, `#FFB800`).
2. **Voz aprobada:** `Snap - Fast-paced Viral Narrator` (`gWaDC0oXAheKoZfljzuI`) en `eleven_v3` (`lang: "es"`) usando `script.v3.txt` con tags `[excited]`, `[quickly]`, `[rushed]`, `[emphasized]` + `tighten.py --cap 0.16` (manteniendo `0.24 s` en cambios de escena) + boost `atempo=1.12` con timestamps divididos entre `1.12` (~`3.0 - 3.3 palabras/s`).
3. **Mastering de Audio y Foley:** Cadena vocal broadcast (`-14 LUFS`, `~ -15.5 dB` mean / `-0.8 dB` true peak, `alimiter` con `:level=0`) + ~60-67 efectos de sonido de estudio reales (`assets/talking-head/sfx/` y `engine/talking-head/sfx/`) con pico de bus SFX en `~ -8 dB`.
4. **Dinamismo Visual:** **14 ilustraciones `16:9` sin texto incrustado** por episodio (2 por escena en `DualIllustrationStage` alternando modos `whip` con PiP y `split` 50/50) + `ImpactRig`, `ShockwaveBurst`, partículas/rayos a 60 fps, gráficas SVG en vivo, tamaño mínimo de texto `>= 32 px` y bucle continuo hacia la primera frase.

---

## 4. Instalación Rápida de Dependencias en el Nuevo Equipo

Si copiaste esta carpeta sin `node_modules`:
```bash
npm install
```
*(Asegúrate de conservar también el archivo oculto `.env.local` en la raíz de `keyframes` donde está configurada tu clave de ElevenLabs).*
