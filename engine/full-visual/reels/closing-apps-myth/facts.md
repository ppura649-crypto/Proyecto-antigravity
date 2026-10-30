# Hechos Verificados — Episodio 2: Cerrar Apps en Segundo Plano (`closing-apps-myth`)

1. **Confirmación oficial de Apple (Craig Federighi, SVP de Ingeniería de Software):**
   - Ante la consulta directa de usuarios a Tim Cook sobre si cerrar aplicaciones de la multitarea ahorra batería, Craig Federighi respondió oficialmente: *"No and no"* (*"No y no"*).
   - Documentación oficial de Apple Support (*Close an app on your iPhone or iPod touch*): especifica que **solo** debes forzar el cierre de una app cuando no responde o está congelada.

2. **Confirmación de Ingeniería de Android (Hiroshi Lockheimer / Arquitectura Android):**
   - Hiroshi Lockheimer (ex vicepresidente senior de Android en Google) y la documentación de `ActivityManager` confirman que cerrar apps manualmente empeora la eficiencia energética porque destruye la caché en RAM y obliga al sistema a recargar desde almacenamiento Flash.

3. **Física real de la memoria RAM vs Arranque en Frío (Cold Boot):**
   - Cuando sales de una app en iOS o Android moderno, el sistema operativo congela su estado en la memoria **RAM** (*Suspended State*): pasa a **0% de uso de CPU** y no ejecuta ciclos activos. La memoria RAM consume prácticamente la misma energía esté llena o vacía.
   - Al deslizar la app hacia arriba (*Force Quit*), se purga de la RAM. Al abrirla de nuevo, el teléfono ejecuta un **arranque en frío** (*Cold Boot*): lee cientos de megabytes desde el almacenamiento Flash, descomprime texturas, recompila vistas y reconecta red, provocando un pico alto de CPU y mayor consumo de batería que reanudarla desde RAM.

4. **Qué SÍ gasta batería sin tocar el celular:**
   - **Actualización en segundo plano** (*Background App Refresh*) activa en decenas de redes sociales/tiendas que descargan contenido solas.
   - **Permisos de Ubicación GPS en modo "Siempre"** (*Always*) en apps que solo necesitan ubicación *"Al usar la app"* (*While Using*).
