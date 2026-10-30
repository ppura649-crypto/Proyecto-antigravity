# Vista Previa — Pasaje de Prueba (`blackout`, 41.8–51.8 s)

> [!NOTE]
> Este clip de **10.07 segundos** (`1080x1920`, `60 fps`) valida el hilo conductor de la Tierra + medidor `SUNLIGHT 0%`, la tipografía (`>= 32 px`), las zonas seguras de Instagram y la sincronización palabra por palabra con la voz antes de construir las 7 escenas restantes.

## Video Renderizado (10 s)

![Pasaje de prueba blackout](/Users/rol.travel/.gemini/antigravity/brain/019f54e7-7e87-4f49-a0c6-d102cfc51c74/passage-blackout.mp4)

- **Archivo MP4 local:** [passage-blackout.mp4](file:///Users/rol.travel/.gemini/antigravity/scratch/keyframes/engine/full-visual/reels/dinosaur-extinction/passage-blackout.mp4)
- **Código de la escena:** [Blackout.tsx](file:///Users/rol.travel/.gemini/antigravity/scratch/keyframes/engine/full-visual/reels/dinosaur-extinction/scenes/Blackout.tsx) y [parts.tsx](file:///Users/rol.travel/.gemini/antigravity/scratch/keyframes/engine/full-visual/reels/dinosaur-extinction/scenes/parts.tsx)

## Fotogramas Clave (1080 × 1920)

````carousel
![42.60 s — Supervivencia inicial al impacto](/Users/rol.travel/.gemini/antigravity/brain/019f54e7-7e87-4f49-a0c6-d102cfc51c74/t_042.60.png)
<!-- slide -->
![46.60 s — Apagón de la fotosíntesis por casi 2 años](/Users/rol.travel/.gemini/antigravity/brain/019f54e7-7e87-4f49-a0c6-d102cfc51c74/t_046.60.png)
<!-- slide -->
![49.00 s — Colapso de la cadena trófica de abajo hacia arriba](/Users/rol.travel/.gemini/antigravity/brain/019f54e7-7e87-4f49-a0c6-d102cfc51c74/t_049.00.png)
<!-- slide -->
![51.20 s — Contador de extinción global al 75%](/Users/rol.travel/.gemini/antigravity/brain/019f54e7-7e87-4f49-a0c6-d102cfc51c74/t_051.20.png)
````

## Validaciones Mecánicas (`check.py`)

- `tsc --noEmit`: **OK** (`0` errores)
- `check.py plan dinosaur-extinction`: **OK** (`0` fallos, tamaños de texto `>= 32 px`, márgenes seguros verificados con `--guides`)
- `check.py render`: **OK** (`longest stretch with nothing moving: 0.70 s`, límite `1.20 s`; `0` fotogramas vacíos)
