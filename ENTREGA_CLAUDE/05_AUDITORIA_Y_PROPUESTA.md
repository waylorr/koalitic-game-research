# KOALITIC GAME — auditoría, decisión técnica y primer hito

**Estado:** propuesta para tu revisión · 24/09/2026. No cambia el contrato de producto de 01–04 salvo donde se indica. Los supuestos de §7 se aplican mientras no digas lo contrario.

**Resumen**

- **Ruta principal:** app web local. Autoría con React + TypeScript + Vite; HUD como componentes DOM/SVG/CSS a una resolución lógica fija de 1920×1080; un núcleo TypeScript puro (modelo, evaluador temporal, motion) sin React ni DOM; proyecto guardado en una carpeta real mediante un pequeño servidor local Node que también sirve la app.
- **Alternativa:** mismo núcleo y mismo editor, con el HUD dibujado en PixiJS 8 si la ruta DOM no cumple los umbrales de §4 en tu equipo.
- **La decisión que más pesa no es el renderer**, sino `evaluateFrame(episodio, t)`: una función pura que devuelve el HUD completo en cualquier instante. De ella salen saltar en la timeline, reabrir, el futuro Record Mode y la exportación.
- **H0 (prueba técnica) está hecha:** 18 tests del núcleo y 17/17 comprobaciones en Chromium real (§6). Página privada para probarla con tu vídeo: <https://claude.ai/artifact/JSUkfThkZw8gqPkdYRsvBL>. Código en `app/`.

## 0. Actualización tras tu revisión (24/09/2026, tarde)

Tus indicaciones cambian el orden y dos decisiones; prevalecen sobre lo que sigue en este documento:

- **Empezamos la app de verdad.** Primer elemento: el **menú principal** de tu diseño con la navegación vigente (EPISODES, CONFIGURE HUD, ASSETS y QUIT GAME).
- **Los fondos son tu arte (imágenes), no escenas 3D.** Probé una esfera en Three.js y la retiré. Mientras no me pases los fondos limpios, uso versiones de tus diseños a las que borré los botones dibujados (`app/public/backgrounds/`).
- **Lienzo fijo de 1920×1080 escalado a la ventana, como un juego:** cada pantalla coincide con tu diseño de 16:9. Fuera del lienzo se prolonga el fondo desenfocado.
- **Método de trabajo:** cada elemento de UI se construye y se aprueba primero en ASSETS → UI COMPONENTS (con todos sus estados) y después se usa en las pantallas. El primero es el botón neón: cian en reposo y rojo al seleccionarlo con ratón o teclado, como en tus imágenes.
- **Tipografías (licencia OFL):** Michroma para logo y títulos anchos; Rajdhani para botones y textos.
- Las fases de §5 pasan a este orden: botón y menú (hecho) → siguiente elemento de UI que elijas → pantallas de tu workflow con los elementos aprobados → motor de episodios (H0 ya probado) → exportación.

## 1. Auditoría

### 1.1 Decisiones cerradas

Coinciden en CLAUDE.md, 01, 03, 04 y `WORKFLOW/README.md`:

- Aplicación de autoría sobre vídeo o imagen ya montados. No es juego 3D ni editor de montaje; el cursor nunca sale en el resultado.
- Cinco responsabilidades separadas: Media, Data Library, registro de UI Components, HUD Templates y Episodes.
- Configure HUD y Episode Editor son dos contextos del mismo visor y de los mismos componentes; el configurador usa datos DEMO.
- Zonas fijas Left Rail, Top Bar y Right Rail, más una capa POV independiente con anclaje manual. Sin editor libre de píxeles.
- Los componentes se programan fuera de la app y entran por el registro; en la app el catálogo es de solo lectura.
- Timeline zona → componente → hijo → propiedad. Los números interpolan; estados, sectores y fichas mantienen su valor (*hold*). Los hijos siguen evaluándose con el padre plegado. Un único valor alimenta cifra y barra de Stamina; otro, cifra y barra de XP.
- La plantilla decide *cómo* se anima un cambio; el episodio decide *cuándo*.
- NEW EPISODE en una pantalla (nombre, medio, plantilla opcional). Sin Choose HUD ni Settings.
- Cambiar de plantilla en un episodio conserva fichas, overlays y pistas, y se puede deshacer.
- SAVE TEMPLATE y SAVE EPISODE son operaciones distintas.
- Fuera del primer ciclo: Record Mode, tracking, exportación, cuentas y empaquetado. Un solo usuario, sin servicios de pago.
- Orden: primero Player Profile, Stamina, Left Rail, un overlay manual, scrub y guardar/reabrir; después Radial y Location.

### 1.2 Contradicciones y huecos que cambian la arquitectura

| # | Tema | Qué choca | Propuesta |
|---|---|---|---|
| C1 | Fichas dentro del episodio | El prototipo copia la ficha entera, también dentro de cada punto de lugar, y el README dice que corregir la biblioteca no reescribe episodios. 01 deja la propagación abierta. La regla «archivar fichas usadas en vez de borrarlas» solo tiene sentido si el episodio *referencia* la ficha. | Pregunta 1 |
| C2 | Radial en la primera prueba | El README lo incluye; CLAUDE.md y 04 §6 lo dejan para el siguiente incremento. | Sigo CLAUDE.md: radial funcional en H2. Su aspecto sí entró en H0 por ser la pieza gráfica más exigente. |
| C3 | Loadout | Inventory y Gear Radial declaran «episode gear slots», pero solo el radial tiene cinco asignaciones. hudv2_1/3 muestran inventario 6/6 y hudv2_2 un radial «03/06». | Pregunta 4 |
| C4 | Saltar a mitad de una transición | 04 fija cómo y cuándo, pero no qué se ve al caer dentro de una transición o al interrumpirla. El prototipo anima según el recorrido. | Transición calculada desde el tiempo, con interrupción continua (§3.3). Probado en H0. |
| C5 | Level y XP | 03 trata Level como valor temporal; el prototipo lo toma fijo de la ficha; la regla XP → Level está pendiente. | Pregunta 5 |
| C6 | Top Bar y Right Rail | 03 les da estados (compacto/abierto/fijado); solo Left Rail tiene pista. | Mismo contrato de estado cuando se implementen. |
| C7 | Time Left | Registrado sin significado (¿reloj del episodio? ¿cuenta atrás dirigida?). | Fuera de H1; se define al diseñarlo. |
| C8 | Proyecto portable | El prototipo guarda en IndexedDB; CLAUDE.md exige formato versionado, IDs estables y migraciones. | Carpeta de proyecto en disco (§2.5). Pregunta 2. |
| C9 | Idioma | Etiquetas del prototipo en inglés; tú trabajas en español. | Supuesto S6. |

### 1.3 Fallos del prototipo, verificados ejecutando su código

1. **El sector del radial interpola** aunque el contrato dice *hold*: entre el sector 1 (00:00) y el 5 (01:00) vale 1,67 a 00:10 (ningún sector activo) y 3 a 00:30 (un sector que nadie eligió). `trackValue` decide por el tipo de dato, no por la interpolación declarada.
2. **Cambiar de jugador borra la pista XP** sin aviso.
3. **Salir del editor sin guardar descarta los cambios** sin aviso.
4. **CREATE EPISODE no guarda:** si recargas antes de SAVE EPISODE, desaparecen el episodio y el medio importado.
5. **La animación del rail depende del recorrido:** llegar a 00:21 desde 00:19 anima; saltar directamente, no. Un instante a mitad de transición no se puede revisar ni exportar.
6. **El cabezal solo admite segundos enteros;** a 30 fps un fotograma dura 0,033 s.
7. **La ficha de lugar se guarda dos veces** (asignación y copia completa en cada punto), y una corrección en la biblioteca nunca llega al episodio.
8. **IDs inestables:** las plantillas usan `Date.now()` y cambian de ID en cada sesión sin guardado; componentes, variantes y motion se identifican por su nombre visible, así que renombrar rompe proyectos.
9. **Cada cambio reconstruye la pantalla entera, `<video>` incluido:** por eso no puede reproducir con el HUD encima.
10. **El registro no gobierna el inspector:** `episodeInspector`, `timelineValue`, `sampleData`, `newEpisodeModel` y `build.mjs` mantienen listas propias por componente, los inventarios paralelos que 04 prohíbe.
11. **Sin resolución lógica:** el HUD cambia de proporción con la ventana, así que lo visto no sería lo exportado.
12. **El vídeo se copia dentro del navegador** (IndexedDB). El MP4 de referencia ocupa 150 MB para 41 s en 4K; un episodio de 14 min puede superar varios GB, sujetos a cuota y al borrado de datos del sitio.

Los tests del prototipo pasan porque comprueban la lógica con un DOM simulado; por eso no detectan 1, 5, 9 ni 11.

### 1.4 Qué falta para una app usable

Guardado real (carpeta de proyecto, validación al abrir, migraciones, copias, aviso de cambios sin guardar); vídeo reproduciéndose bajo el HUD con búsqueda por fotograma; motion calculado desde el tiempo; una timeline manejable en 14 min (zoom, arrastrar puntos, selección, atajos, deshacer/rehacer); inspector y timeline derivados del registro; componentes con calidad visual y un camino limpio hacia tu design system; aviso y reubicación de medios movidos.

### 1.5 Qué es solo referencia

Se conserva como contrato: `components.json` (pasa a registro tipado), las cinco entidades, el árbol de timeline, los escenarios de `workflow.json` y las fichas de ejemplo. Es referencia de UX, no código a portar: pantallas, Flow Map, Spec, estilos, `project-store.js` y `timeline-model.js`. Los tests del prototipo se convierten en criterios de aceptación. `WORKFLOW/` queda intacto.

## 2. Stack

### 2.1 Criterios (juicio técnico, no benchmark)

| Criterio | Peso |
|---|---|
| Licencias MIT/Apache o equivalentes, sin pagos obligatorios | eliminatorio |
| Tu MP4 (H.264/HEVC, hasta 4K) reproducible sin conversión previa | alto |
| Calidad visual alcanzable y velocidad para producir muchas variantes | alto |
| Evaluación temporal determinista y guardado fiable | alto (independiente del renderer) |
| Editor: formularios, biblioteca, timeline y texto | medio-alto |
| Trabajo con IA: archivos, tests, capturas e inspección automática | medio-alto |
| Exportación futura | medio-bajo por ahora |

### 2.2 Finalistas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| **A. Web local: React + TS + Vite; HUD DOM/SVG/CSS; núcleo puro; servidor local** | Chrome/Edge reproducen H.264 con aceleración; texto nítido y formularios nativos; `backdrop-filter` desenfoca el vídeo real detrás del cristal en la preview; SVG da zonas de clic exactas para los sectores; Playwright prueba y fotografía cada estado | Filtros pesados a 4K cuestan; partículas y shaders necesitan islas canvas por componente; exportar exigirá renderizar fotograma a fotograma en Chromium sin ventana | **Principal** |
| B. Como A, con el HUD en PixiJS 8 (+ PixiJS Layout v3) | Filtros, máscaras y partículas en GPU; un lienzo exportable | Dos paradigmas (DOM para el editor, escena para el HUD); texto y maquetación más costosos; la IA no inspecciona el canvas sin una capa de diagnóstico | **Alternativa** si A falla §4 |
| C. Three.js como renderer del HUD | 2.5D/3D real y postprocesado | Texto, maquetación y zonas de clic del HUD a mano; `WebGPURenderer` sigue marcado como experimental (ver 02) | Isla puntual para 3D genuino |
| D. Godot 4 | Escenas y AnimationPlayer, MIT | Su núcleo solo reproduce Ogg Theora; H.264 requiere extensiones de terceros por patentes; el editor de episodios sería igualmente propio | Descartado ahora |
| E. Qt Quick/QML | Nativo maduro, vídeo integrado | C++/QML, empaquetado y licencias por módulo | Descartado ahora |

### 2.3 Sin librería de animación en el núcleo

GSAP queda descartada: su licencia gratuita prohíbe usarla en herramientas que permiten crear animaciones con una interfaz visual en competencia con Webflow, y un editor de HUD con timeline encaja en esa definición. Anime.js 4 (MIT) sería válida, pero sus timelines llevan reloj propio que habría que sincronizar con el del episodio. En KOALITIC las transiciones son funciones puras del tiempo (easing y `cubic-bezier` para curvas del design system), calculadas igual en preview y en exportación. Si un diseño concreto necesita más (muelles, morphing de trazados), se valorará para ese componente.

### 2.4 Versiones y licencias (registro npm, 24/09/2026)

Usadas en H0: React 19.3.0 (MIT) · Vite 8.3.1 (MIT) · TypeScript 7.0.2 (Apache-2.0) · Vitest 5.0.1 (MIT) · Playwright 1.56.1 (Apache-2.0; versión fijada para el Chromium de este entorno, la última es 1.63.0) · Rajdhani vía @fontsource (OFL). Previstas para H1: Zod 4.6.5 (validación de archivos), Zustand 5.0.15 y Immer 11.1.18 (estado y deshacer), todas MIT. Evaluadas: PixiJS 8.21.0 (MIT), three 0.186.1 (MIT), animejs 4.5.0 (MIT), gsap 3.15.0 (licencia propia).

### 2.5 Dónde se guarda y cómo se arranca

- **Propuesta:** un script de doble clic (`npm start` por debajo) arranca un servidor local en `127.0.0.1` que sirve la app y lee/escribe una carpeta de proyecto: `project.json`, `library.json`, `templates/*.json`, `episodes/*.json`, `media/` y `.backups/`. Se usa en Chrome o Edge.
- **Por qué un servidor:** archivos reales que puedes copiar o respaldar; el vídeo no se duplica dentro del navegador; escritura atómica y copias automáticas; FFmpeg disponible más adelante para miniaturas, proxies y exportación. Coste: un proceso local y unas 200 líneas. Solo escucha en tu equipo y valida origen y rutas.
- **Alternativa sin servidor:** File System Access en Chrome/Edge (eliges la carpeta; desde Chrome 122 el permiso puede ser persistente). No existe en Firefox ni Safari y no permite FFmpeg.
- **Descartado como guardado principal:** IndexedDB/OPFS (cuota, borrado del sitio, no portable).

## 3. Arquitectura mínima

### 3.1 Capas y fronteras de fallo

```text
app/
  src/core/    modelo, esquemas y migraciones, evaluador temporal, motion, comandos (TS puro)
  src/hud/     registro de componentes, componentes HUD (React DOM/SVG), escenario 1920×1080
  src/editor/  pantallas de autoría: menú, episodios, nuevo episodio, editor, configurador, assets
  server/      API local de archivos (Node, sin framework)
```

Un componente HUD que falla muestra «no disponible» sin tumbar editor ni datos. Un archivo que no pasa la validación nunca se sobrescribe.

### 3.2 Dónde vive cada entidad

| Entidad | Dónde | Se referencia por | No guarda |
|---|---|---|---|
| Media | `media/` + índice en `library.json` (nombre, tipo, duración, fps, tamaño) | `mediaId` | datos del HUD |
| Data Library | `library.json`: fichas Player, Gear, Location… con ID estable; archivadas si están en uso | `recordId` | pistas |
| Registro de componentes | código (`src/hud/components/*`) con `registryVersion` | `componentId`, `variantId`, `motionId` (identificadores estables, no nombres visibles) | valores de episodio |
| HUD Template | `templates/<id>.json`: zonas, orden, variante y motion por módulo | `templateId` | jugador, XP, puntos |
| Episode | `episodes/<id>.json`: `mediaId`, copia de la composición + `sourceTemplateId`, asignaciones por ID, pistas por canal, overlays | — | copias de fichas o del catálogo |
| Evaluador | `src/core/evaluate.ts` | — | nada: es puro |

### 3.3 Modelo temporal

- Tiempo en milisegundos enteros; se muestra como `mm:ss.ff` con los fps del medio y las ediciones se ajustan a fotograma.
- **Canal** = valor fuente declarado por el registro (`stamina.value`, `player-profile.xp`, `left-rail.state`, `gear-radial.selection`). Las pistas se guardan por canal, no por instancia visual: sobreviven a un cambio de plantilla y siguen evaluándose con el padre plegado. Cifra y barra son vistas del mismo canal.
- Números: lineales (curvas más adelante). Estados, sectores y fichas: *hold*. Antes del primer punto y después del último se mantiene el valor, como en After Effects.
- **Transiciones:** la plantilla aporta preset y duración; el episodio, el instante. El aspecto en `t` se calcula desde `t`; si un punto interrumpe una transición, la nueva parte del aspecto evaluado en ese momento. Saltar a mitad de un plegado muestra el panel a medio plegar.
- Overlays y escenas son clips con inicio y fin; entrada, salida y escalonados se calculan desde el tiempo local del clip. Las animaciones ambientales (pulsos, barridos) son función de `t`.
- SFX (más adelante): suenan al cruzar eventos en reproducción, nunca al buscar. Record Mode (más adelante) escribe los mismos puntos y clips; no hay un segundo formato.
- Regla visual del HUD: sin transiciones ni animaciones CSS y sin `will-change`; el movimiento se calcula (ver hallazgo en §6).

### 3.4 Registro de componentes

Cada componente declara en un único módulo: ID estable, zona, hijos, canales que lee (tipo, rango, interpolación, valor inicial), asignaciones (tipo de ficha), variantes, presets de motion, datos DEMO y su renderer. De ahí se derivan catálogo, árbol, inspector, timeline y la preview del configurador. Un componente nuevo es un módulo nuevo más su alta en el registro.

### 3.5 Persistencia

`formatVersion` en cada archivo, IDs `prefijo_uuid`, validación con esquemas al abrir y migraciones como funciones puras probadas con archivos de ejemplo. Un componente desconocido se conserva como datos y se muestra «no disponible». Guardar escribe un temporal y lo renombra; la versión anterior pasa a `.backups/` (las 20 últimas). Borrador de recuperación automático y aviso al salir con cambios sin guardar.

### 3.6 Cómo se evitan duplicaciones

Una ficha en un solo sitio, referenciada por ID. Un valor fuente por canal. Un componente para configurador, catálogo y episodio: solo cambia la fuente de datos (DEMO o evaluador). Un evaluador para preview y exportación. La única copia intencionada es la composición del HUD dentro del episodio, que el contrato exige para que modificar V1 no altere episodios anteriores; guarda `sourceTemplateId` para poder ofrecer «volver a aplicar».

### 3.7 Del diseño provisional a tu design system

Colores, tipografía, grosores, brillo y cortes de esquina son variables CSS en un único archivo (`src/hud/hud.css`); formas de panel y ornamentos, SVG; retratos y equipo, PNG/WebP con alfa en `media/`. Los componentes solo leen variables y assets, así que cambiar el aspecto no toca datos ni timeline. Entrega ideal por componente: imagen de referencia, hoja de estados y lista de datos variables (lo que ya describe 01 §8).

## 4. Riesgos y umbrales que cambian la decisión

| Riesgo | Umbral de fallo | Plan B |
|---|---|---|
| Calidad visual DOM/SVG insuficiente | Tras H0 no reconoces el lenguaje de hudv2 en panel y radial | Islas canvas por componente; si no basta, HUD en PixiJS (B) |
| Rendimiento con tu vídeo 4K y HUD animado | < 50 fps en tu Chrome/Edge con vídeo 4K en reproducción y una transición activa | Menos desenfoque; proxy 1080p del vídeo; PixiJS |
| Códecs del móvil (HEVC 10 bits, frame rate variable) | Tu MP4 no se reproduce o se desincroniza al buscar | Proxy H.264 a fps constante generado con FFmpeg por el servidor |
| Determinismo | Diferencias entre «reproducir hasta t» y «saltar a t» | Fallo del núcleo, no del renderer: se corrige ahí |
| Pérdida de datos | Cualquier diferencia tras guardar → cerrar → reabrir | Escritura atómica, validación, copias y test automático |
| Expectativa visual | Las referencias son ilustraciones generadas, con fotos de producto y retratos pintados | El código dibuja paneles, líneas, texto y brillo; fotos y retratos llegan como assets |

## 5. Hitos y criterios de aceptación

**H0 · Prueba técnica** — hecha (§6).

**H1 · Recorrido vertical** (el pedido). Criterios observables:

1. Crear o abrir una carpeta de proyecto; al importar un vídeo o una imagen se copia a `media/` y aparece en Media con nombre, duración y miniatura.
2. NEW EPISODE con nombre, medio y HUD V1 o V2 abre el editor con el vídeo a 16:9 detrás del HUD.
3. Asignar Jordi en Player Profile muestra nombre, retrato y nivel; cambiar a Arnau conserva la pista XP.
4. Stamina 100 en 01:00 y 80 en 01:30 marca 90 a 01:15 en cifra y barra, con el rail plegado y al abrirlo.
5. Left Rail Folded/Open/Pinned en varios tiempos; saltar a mitad de una transición muestra el estado intermedio; reproducir y saltar dan la misma imagen (test automático).
6. Añadir, mover arrastrando y borrar puntos; deshacer y rehacer cualquier edición.
7. Un POV Overlay (System Notification) con texto, inicio, fin y dos posiciones manuales; entra y sale con su motion.
8. Reproducir, pausar y buscar con el vídeo como reloj; desfase ≤ 1 fotograma en la preview.
9. Guardar → cerrar app y servidor → reabrir: episodio idéntico campo a campo (test automático) y en imagen.
10. Salir con cambios sin guardar pide confirmación; un archivo dañado no se sobrescribe y se ofrece la copia anterior.

Evidencia: tests del núcleo y del servidor, prueba E2E del recorrido en Chromium con capturas por paso, y tu prueba con un vídeo real siguiendo una lista de pasos. Estimación: 2–4 sesiones de trabajo; depende de tus respuestas y de cuánto iteremos el aspecto.

**H2 · Radial y Location.** Loadout del episodio con fichas de equipo e imagen; selección con clic en el HUD o desde la timeline; cambio de Barcelona a Girona en un punto. 1–2 sesiones.

**H3 · Configure HUD y cambio de plantilla.** Incluir, excluir y ordenar módulos; variante y motion por módulo con datos DEMO; NEW FROM BASE, DUPLICATE y SAVE TEMPLATE; APPLY HUD en el episodio conserva pistas y se puede deshacer. 1–2 sesiones.

**H4 · Design system.** Sustituir los provisionales por tus variables y assets en los componentes validados. Según tu entrega.

**Después, solo con nueva decisión:** Explore/Record Mode, más componentes (Right Rail, Top Bar, Photo Result…), SFX, exportación (secuencia PNG con alfa + WAV → ProRes 4444 o WebM con alfa mediante FFmpeg) y empaquetado.

## 6. Resultado de H0

| Comprobación | Resultado |
|---|---|
| Núcleo: 100 → 80 entre 01:00 y 01:30 da 90 a 01:15; el sector no interpola; transición interrumpida sin salto; clips; edición de puntos; mismo resultado evaluando 400 instantes en dos órdenes | 18/18 tests (Vitest) |
| Escala: episodio de 14 min con 4.000 puntos y 200 overlays | `evaluateFrame` p50 0,018 ms · p95 0,038 ms |
| Saltar a t = llegar fotograma a fotograma, en 7 instantes (medio plegado, plegado interrumpido, selección del radial, entrada de notificación, fijado, 01:15, apertura) | DOM idéntico siempre · en píxeles, de 0 a 62 píxeles con 1/255 de diferencia según la ejecución: invisible |
| Reproducir en tiempo real y pausar = saltar a ese instante (3 casos) | DOM idéntico · ≤ 2/255 en el desenfoque del cristal y como máximo 5 píxeles de un borde diagonal con hasta 19/255: imperceptible |
| Stamina con el rail plegado a 01:15 y al abrirlo | 90 en ambos casos |
| Radial: clic en el centro y cerca de ambos bordes de cada sector | 15/15 exactos; huecos y centro no seleccionan |
| Coste por fotograma del HUD al reproducir (evaluar + React) | evaluar p95 0,1 ms · render p95 0,4 ms · 60 fps sin GPU |
| Vídeo como reloj (VP9 1080p30 de prueba) | desfase al pausar 2–6 ms · 0 fotogramas perdidos · duración leída del vídeo |

**Hallazgo aplicado:** con `will-change` en los paneles, saltar y reproducir daban un antialiasing distinto en los bordes (hasta 7/255). Sin él desaparece al buscar; queda como regla del HUD (§3.3). Lo que queda (1–2/255 en el desenfoque y unos pocos píxeles de borde tras reproducir en tiempo real) viene del rasterizado de Chromium y varía entre ejecuciones; el DOM es idéntico en todos los casos. Por eso el test exige igualdad lógica exacta y un umbral visual explícito (≤ 100 píxeles por encima de 3/255 y ninguno por encima de 32/255).

**Limitaciones reales:** no he visto tu MP4 ni tu equipo. El Chromium de este entorno no reproduce H.264 (comprobado) y no tiene GPU, así que el rendimiento real con 4K y cristal debe medirse en tu Chrome/Edge: la página muestra fps y tiempos. Retratos y fotos de equipo son provisionales (iconos de línea míos). H0 no guarda nada y solo tiene el Left Rail y un overlay. Si la página publicada no reproduce tu vídeo por las restricciones del visor, ejecútala en tu equipo: `cd app && npm install && npm run dev`.

**Cómo repetir las pruebas:** `cd app && npm test` (núcleo) y `npm run build && npm run e2e` (navegador; necesita `npx playwright install chromium` la primera vez).

## 7. Preguntas y supuestos

1. **Fichas: ¿referencia viva o copia congelada?** Si corriges «Nikon Z5 II» o cambias el retrato de Jordi en la biblioteca, ¿debe verse en episodios anteriores? Recomiendo referencia viva: una sola ficha, aviso «se usa en N episodios» antes de guardar el cambio, y archivar en vez de borrar. Alternativa: cada episodio congela su copia y ofrece «actualizar desde biblioteca».
2. **¿Puedes arrancar la app con doble clic en un script?** Requiere instalar Node.js LTS una vez (gratuito) y usar Chrome o Edge. ¿Windows o Mac? Si prefieres no instalar nada, la alternativa es solo navegador con permiso a una carpeta, sin FFmpeg.
3. **¿Cómo son tus vídeos finales?** Códec, resolución, fps y duración tal como los exportas (¿H.264 desde CapCut? ¿HEVC del móvil?). Si puedes, comparte 20–30 s de un episodio real o del MP4 de referencia. Si es HEVC de 10 bits o de frame rate variable, H1 incluirá un proxy H.264 generado con FFmpeg.
4. **Loadout: ¿inventario y radial muestran el mismo equipo del episodio, y con cuántos huecos?** Cinco (lo decidido para el radial) o seis (el 6/6 de hudv2). Propuesta: un Loadout por episodio que ambos leen.
5. **XP y Level: ¿los diriges a mano o prefieres una regla simple** (al llegar al objetivo sube el Level y la barra vuelve a cero)?

Supuestos mientras no respondas: **S1** referencia viva con aviso y archivo · **S2** servidor local + Chrome/Edge, con scripts de arranque para Windows y Mac · **S3** H.264 a 30 fps, sin proxies en H1 hasta ver una muestra · **S4** Loadout de cinco huecos compartido · **S5** XP manual y Level como pista discreta · **S6** etiquetas de app y HUD en inglés, documentación en español · **S7** guardado explícito (SAVE EPISODE) más borrador de recuperación · **S8** resolución lógica 1920×1080; 4K = escala ×2 · **S9** preview a ±1 fotograma, exactitud por fotograma al exportar.

## 8. Preguntas que me hice

| Pregunta | Respuesta | Qué cambió |
|---|---|---|
| ¿Elijo web porque me resulta cómodo a mí, no a ti? | Pesan hechos verificables: tu MP4 no se reproduce en Godot sin extensiones, Qt exige C++, y la web es la más fácil de probar y fotografiar automáticamente. Aun así puede fallar. | La decisión queda condicionada a umbrales medibles en tu equipo (§4). |
| ¿Puede DOM/SVG verse «AAA»? | No se sabe sin verlo. | H0 usa la pieza más difícil (radial + cristal) y la comparo lado a lado con hudv2_2; decides tú. |
| ¿Por qué no seguir el prototipo, que funciona y tiene tests? | Tiene cuatro límites estructurales: vídeo recreado, motion por historial, estado global y registro que no gobierna. | Porto contratos y escenarios, no código. |
| ¿Hace falta un servidor o lo complico? | Solo se justifica por archivos reales, vídeo sin duplicar, copias y FFmpeg futuro. | Pregunta 2 con alternativa sin servidor. |
| ¿Repito preguntas ya contestadas? | Iba a preguntar «¿radial o configurador primero?», pero CLAUDE.md ya lo responde. Tampoco pregunto por cursor, tracking, montaje ni uso individual. | Quitada; Radial pasa a H2. |
| ¿Dónde duplico estado sin darme cuenta? | En el prototipo: la ficha dentro de cada punto y el lugar como asignación y pista a la vez. | Referencias por ID y un canal por valor. La composición copiada en el episodio es la única copia intencionada. |
| ¿Qué pasa al saltar a mitad de una transición o si otra la interrumpe? | El prototipo no lo resuelve. | Lo resuelve el evaluador y lo prueban capturas píxel a píxel. |
| ¿Y si mis propias pruebas me dan la razón por construcción? | Una falló de verdad: el antialiasing difería por `will-change`, y otra por el desenfoque tras reproducir. | Quité `will-change`; separé igualdad lógica (exacta) de igualdad visual (umbral explícito) y publico las cifras. |
| ¿Qué pasa si dentro de un año renombro un componente o una variante? | Los proyectos guardan identificadores estables, no nombres visibles. | `registryVersion` + migraciones; un componente desconocido conserva sus datos. |
| ¿Y si tu vídeo es HEVC o de frame rate variable, como el de un móvil? | Riesgo real de desincronía. | Pido una muestra antes de prometer sincronía (pregunta 3). |
| ¿Basta el segundo entero? | No: a 30 fps hacen falta 33 ms. | Milisegundos con ajuste a fotograma. |
| ¿Estoy construyendo un After Effects? | Riesgo real con 18 componentes registrados. | Solo existen los tipos de canal que usan componentes implementados; sin curvas editables en H1. |
| ¿Soy honesto con lo que no he visto? | No he visto tu MP4 ni medido tu equipo. | Lo digo en cada resultado y te doy la página para medirlo tú. |
| ¿Puedes comprobar un incremento sin ayuda? | Hoy necesitarías ejecutar comandos. | Cada hito con página publicada o script de arranque, lista de pasos y capturas. |

## 9. Registro de decisiones

| ID | Decisión | Estado |
|---|---|---|
| D1 | App web local con React + TS + Vite; HUD en DOM/SVG/CSS; PixiJS como alternativa | Propuesta; H0 superada en el entorno de prueba, pendiente de tu equipo |
| D2 | Núcleo puro `evaluateFrame(episodio, t)` compartido por preview y exportación | Aplicada en H0 |
| D3 | Transiciones y ambientales calculados desde el tiempo; sin animaciones CSS ni `will-change` en el HUD | Aplicada en H0 |
| D4 | Tiempo en ms enteros con ajuste a fotograma; escenario lógico 1920×1080 | Aplicada en H0 |
| D5 | Pistas por canal; fichas por referencia; composición del HUD copiada en el episodio | Propuesta (pregunta 1) |
| D6 | Carpeta de proyecto en disco mediante servidor local; IndexedDB no es guardado principal | Propuesta (pregunta 2) |
| D7 | Sin GSAP; sin librería de animación en el núcleo | Aplicada en H0 |
| D8 | Radial y Location en H2; Configure HUD completo en H3 | Según CLAUDE.md |
| D9 | App de autoría en un lienzo fijo de 1920×1080 escalado, con el arte del creador como fondo | Aplicada (menú principal) |
| D10 | Cada elemento de UI se aprueba en ASSETS → UI COMPONENTS antes de usarse en pantallas | Aplicada (botón neón) |
| D11 | Sin Three.js para fondos; solo se reconsidera si un componente HUD necesita efectos 3D | Aplicada |

Fuentes consultadas: metadatos del registro npm (versiones y licencias); [licencia estándar de GSAP](https://gsap.com/community/standard-license/); [vídeo en Godot](https://docs.godotengine.org/en/stable/tutorials/animation/playing_videos.html); [soporte de `showDirectoryPicker`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker) y [permisos persistentes en Chrome 122](https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api); [soporte de `requestVideoFrameCallback`](https://caniuse.com/mdn-api_htmlvideoelement_requestvideoframecallback); [PixiJS Layout v3](https://pixijs.com/blog/layout-v3). La política de red de esta sesión bloquea gsap.com, docs.godotengine.org y developer.chrome.com, así que esas fuentes se contrastaron mediante búsqueda y no leyendo la página completa.
