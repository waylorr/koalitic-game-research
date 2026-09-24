# KOALITIC GAME — árbol de UI, componentes y assets

**Estado:** inventario de diseño en revisión, 24/09/2026. Las imágenes del menú y sus variantes son referencias históricas; el HTML actual usa UI construida con código. Este documento organiza **qué piezas diseñar**; no significa que todas estén implementadas. El registro funcional de componentes está en [`../WORKFLOW/catalog/components.json`](../WORKFLOW/catalog/components.json); la navegación está en [`../WORKFLOW/workflow.json`](../WORKFLOW/workflow.json). Leer con `01_CONTEXTO_Y_ENCARGO.md` y `04_WIREFRAME_Y_WORKFLOW.md`. El stack sigue abierto.

## 1. Referencias y regla visual

- **Organización conceptual:** `referencias/ASSETS ANTIGUOS/System Main HUD.png`. Ahí están las familias Inventory, Player Profile, Map, Gallery, Codex y Archive, y la idea de que el sistema conecta exploración, fotos y progresión. Es un **mapa de funciones**, no la distribución definitiva en pantalla.
- **Dirección estética principal:** `hudv2_1.jpeg`, `hudv2_2.jpeg`, `hudv2_3.jpeg` del paquete. HUD oscuro, paneles angulares y translúcidos, líneas técnicas, tipografía legible, acentos controlados y acabados de juego AAA. El **radial de `hudv2_2` es obligatorio**; la transparencia y densidad de `hudv2_1` orientan los paneles.
- **Movimiento:** vídeo de referencia suministrado: entrada de misión, captura, Photo Result, barras, rangos y revelaciones escalonadas. Revisar el propio archivo al diseñar animaciones.
- **Composición:** vídeo real ocupa el centro. Información persistente en **laterales y barra superior**, como un shooter. El centro solo se ocupa temporalmente por escenas importantes; al terminar, vuelve a quedar despejado.
- **Assets antiguos:** el paquete incorpora una selección representativa en `referencias/ASSETS ANTIGUOS/`; la carpeta completa permanece en el proyecto local. Son ejemplos del comportamiento y contenido. Los cuadros cian grandes del proyecto anterior no se reutilizan como layout final. Hay que rediseñar su lenguaje y decidir qué elementos merecen volver.

Los nombres de módulos en inglés son etiquetas de trabajo, no copias finales aprobadas. El texto, las fotos, el mapa, el jugador y los valores deben poder cambiar por episodio. Mantener imágenes, texto, fondos y efectos separados; no entregar una pantalla completa aplanada como si fuera un componente interactivo.

**Fuente única para la jerarquía:** el siguiente árbol separa la organización conceptual del antiguo `System Main HUD.png` de la posición y anidación visual de las referencias v2. Las listas posteriores de este documento son un inventario de diseño, no una segunda jerarquía contradictoria. **HUD Shell, Left Rail, Top Bar, Right Rail y la capa POV son posiciones estructurales predefinidas**, construidas por la IA como componentes propios de KOALITIC. El usuario no arrastra paneles libremente ni crea un diseñador universal de UI dentro de la aplicación. Las asignaciones de módulos opcionales a cada zona son propuestas a validar al diseñar pantallas.

## 2. Árbol maestro de instancias del HUD

```text
THE SYSTEM / HUD ROOT
├─ HUD Shell (marcas de esquina, identidad, retícula opcional)
├─ Left Rail [PANEL FIJO; plegado / abierto / fijado]
│  ├─ Left Handle [disparador visible aun plegado]
│  ├─ Player Profile [tarjeta hija]
│  │  ├─ Avatar [imagen/ficha de jugador del episodio]
│  │  ├─ Nombre / identidad [texto del episodio]
│  │  ├─ Level [valor discreto temporal]
│  │  └─ XP [UN valor fuente temporal]
│  │     ├─ número XP [derivado]
│  │     └─ barra XP [derivada del mismo valor y objetivo del nivel]
│  ├─ Inventory / Loadout [grupo hijo]
│  │  └─ Slots 01…N [fichas de equipo elegidas para el episodio]
│  ├─ Gear Radial [hijo lógico; al abrirse puede extenderse fuera del rail]
│  │  ├─ Sectores 01…N [fichas de equipo / estado seleccionado]
│  │  └─ Centro / item activo [derivado de la selección]
│  ├─ Stamina [grupo hijo]
│  │  ├─ Valor % [UN valor fuente temporal]
│  │  ├─ cifra visible [derivada de Valor %]
│  │  └─ relleno de barra [derivado de Valor %]
│  └─ Time Left [lectura hija; reloj o cuenta atrás del episodio]
├─ Top Bar [PANEL FIJO; compacto / abierto / fijado]
│  ├─ Logo / System Online
│  ├─ Navigation Tabs [Profile, Map, Gear, Quest, Gallery, Codex]
│  └─ Location Header [lugar / coordenadas / capítulo del episodio]
├─ Right Rail [PANEL FIJO; plegado / abierto / fijado]
│  ├─ Right Handle [disparador visible aun plegado]
│  ├─ Active Mission / Quest [ficha y progreso]
│  ├─ Photo Opportunities [tarjetas de consejos]
│  ├─ Location / Mini Map [ficha, marcadores, ruta]
│  └─ Codex Compact [entrada contextual]
└─ POV Overlays [CAPA FIJA INDEPENDIENTE de los tres paneles]
   ├─ World Marker / Waypoint [anclaje de pantalla; tracking futuro]
   ├─ Weather / Location Callout [dato contextual sobre vídeo]
   ├─ Person Identification [etiqueta manual sobre vídeo; ya registrada en el catálogo]
   ├─ Object Identified [posible tipo futuro; aún sin contrato]
   ├─ System Notification / Warning [clip temporal]
   ├─ Quick Swap / Gear Equipped [clip temporal]
   ├─ Photo Result / Rank Reveal [escena central temporal]
   ├─ Quest Reveal / Completed [escena temporal]
   └─ Level Up / XP Gain / System Scan [escenas temporales]
```

**Regla de herencia:** al plegar `Left Rail`, sus hijos visuales se ocultan o pasan a su variante compacta; `Left Handle` permanece para poder abrirlo. Las propiedades de Player/XP/Stamina continúan evaluándose con el tiempo aunque estén ocultas. Al abrirlo, muestran el valor actual. El radial pertenece al árbol izquierdo, pero su anillo puede dibujarse más hacia el centro: posición de render y padre lógico no son lo mismo. Por defecto, abrir radial abre el rail si estaba plegado; no aparece un radial huérfano. La misma regla se aplica al panel derecho. Las escenas `POV Overlays` son independientes y pueden aparecer aunque ambos rails estén cerrados.

**Qué se edita dónde:** Configure HUD guarda **qué módulos opcionales de cada barra están activos**, una variante visual aprobada y, si existe, un preset de motion para cada módulo. Las barras, sus zonas y las relaciones padre-hijo están predefinidas; no se arrastran, redimensionan ni reposicionan de forma libre. El catálogo UI muestra las piezas que la IA ya diseñó e implementó, con preview de cerrado/abierto/hover/seleccionado y variantes disponibles. Cambios profundos de geometría, tipografía o animación se hacen revisando ese componente con la IA en el proyecto de código, se prueban y aparecen como una nueva versión del componente; no requieren construir un mini After Effects dentro de KOALITIC. La preview del configurador usa datos **DEMO** no persistidos como episodio. La biblioteca global guarda fichas de contenido como Nikon o una foto. En el episodio se asignan a instancias/slots y se establecen valores iniciales y temporales en la timeline. Un preset de contenido reutilizable podría añadirse después, separado de la versión de HUD; no mezclarlo por ahora con HUD V1/V2.

El Episode Editor puede aplicar otro HUD Template ya guardado sin rehacer Player, Gear, Stamina ni overlays: reemplaza la composición visual del episodio y conserva sus fichas y pistas. Los componentes que queden ocultos por el nuevo HUD mantienen sus datos. El autor puede deshacer el último cambio de HUD y decide cuándo guardar el episodio con `SAVE EPISODE`.

**POV Overlays:** se eligen directamente desde la paleta del Episode Editor; no se habilitan antes en Configure HUD. Su aparición, texto, asset, duración y posición se deciden en el episodio. Weather y Person Identification son ejemplos de esta capa, no hijos del Left Rail. En el prototipo se colocan y corrigen manualmente sobre el vídeo; el seguimiento automático queda fuera del primer alcance.

**Propiedades temporales previstas:** `Left Rail.estado`, `Player Profile.XP`, `Stamina.valor`, `Gear Radial.selección`, `Location Header.lugar` y rangos/posiciones de overlays están en la prueba HTML. Jugador y cinco equipos son asignaciones constantes por episodio. Level, Inventory temporal, Right Rail.estado y Quest.ficha/progreso son contratos posteriores. Los hijos derivados (número, relleno) no reciben keyframes propios.

### Contrato de edición por componente (propuesta P0)

| Instancia / padre | En Configure HUD: módulos y variantes | En episodio: contenido y tiempo | Derivado / regla |
|---|---|---|---|
| `Left Rail` / HUD Root | Panel fijo; escoger variante visual/motion aprobada | Eventos de abrir, plegar y fijar | Al plegar oculta sus hijos; no detiene sus datos |
| `Player Profile` / Left Rail | Activar/desactivar módulo; escoger variante aprobada | Ficha de jugador, avatar/nombre, Level, XP y objetivo del nivel en la timeline | Barra y cifra XP comparten `XP`; retrato viene de la ficha |
| `Inventory / Loadout` / Left Rail | Activar/desactivar; variante y capacidad de slots predefinida | Fichas de equipo asignadas a cada slot y cambios de selección | Imagen, título y descripción salen de la ficha elegida |
| `Gear Radial` / Left Rail | Activar/desactivar; variante predefinida, p. ej. cinco sectores | Fichas de slots y sector seleccionado en eventos | Centro y etiqueta muestran el item seleccionado; abrir radial puede abrir Left Rail |
| `Stamina` / Left Rail | Activar/desactivar; variante visual/motion aprobada | `Valor (%)` inicial y keyframes/curva | Cifra y relleno se calculan desde el mismo valor; estado crítico puede derivarse del umbral de la variante |
| `Time Left` / Left Rail | Activar/desactivar; escoger formato/variante aprobada | Tiempo inicial, cuenta atrás o lectura dirigida según episodio | Display del reloj deriva del valor/tiempo configurado |
| `Top Bar` / HUD Root | Barra fija; habilitar tabs/módulos y elegir variante aprobada | Tab activa, ficha de localización/capítulo y cambios temporales | Título/coordenadas se leen de la ficha |
| `Right Rail` / HUD Root | Panel fijo; variante visual/motion aprobada | Eventos abrir/plegar/fijar | Oculta hijos al plegarse; no detiene quest/mapa |
| `Quest / Photo Opportunities / Mini Map / Codex` / Right Rail | Activar/desactivar cada módulo; variante aprobada | Fichas de misión/lugar/entrada, progreso, marcadores y selección | Textos e imágenes vienen de fichas; progreso visual deriva de su valor |
| `POV Overlays` / HUD Root | Catálogo de componentes programados; no requieren inclusión en plantilla | Instancias de Photo Result, Weather, Warning, Person Identification... con texto, anclaje y duración | No heredan visibilidad de los rails; aparecen sobre el vídeo |

No todas las celdas de “episodio” requieren keyframes: algunas son asignaciones constantes y otras son eventos o curvas. Las propiedades de estilo y motion pueden versionarse con HUD V1/V2. Las fichas de biblioteca pueden reutilizarse; el episodio guarda qué ficha usa cada instancia. La IA deberá validar el esquema final con un componente vertical completo antes de ampliarlo a todas las familias.

## 3. Leyenda del inventario

- **P0** = imprescindible para fijar el diseño y demostrar la aplicación.
- **P1** = módulo recurrente tras aprobar las piezas principales.
- **P2** = secuencia especial o plataforma futura; diseñar solo si un episodio la necesita.
- **[UI]** = componente interactivo reutilizable.
- **[DATA]** = contenido editable; una ficha de biblioteca o valor temporal.
- **[ART]** = imagen, icono, tipografía, textura o sonido de presentación.
- **[MOTION]** = transición/revelación reutilizable, separada del contenido.
- **[SCENE]** = composición de varios componentes que aparece durante un momento.

Las prioridades son para **crear imágenes y validar el lenguaje**. Claude ajustará los hitos de implementación al completar la arquitectura.

## 4. Inventario ASCII del producto y THE SYSTEM

```text
KOALITIC GAME
|
+-- A. APLICACIÓN DE AUTORÍA (lo que usa el creador)
|   |
|   +-- P0 [SCENE] MAIN MENU
|   |   +-- Identidad: logo KOALITIC / THE SYSTEM, núcleo, fondo/atmósfera
|   |   +-- [UI] Episodes → tarjeta existente / New Episode
|   |   +-- [UI] Configure HUD
|   |   +-- [UI] Assets
|   |   +-- [UI] Quit Game (secundario)
|   |   +-- [UI] foco / hover / seleccionado / deshabilitado
|   |   +-- [MOTION] entrada del sistema, cambio de foco y transición de pantalla
|   |
|   +-- P0 [SCENE] CONFIGURE HUD (zonas fijas)
|   |   +-- [UI] vista previa del HUD vivo sobre fondo de prueba
|   |   +-- [UI] catálogo visual de todos los tipos de componente y subcomponentes
|   |   +-- [UI] árbol fijo de Left Rail / Top Bar / Right Rail
|   |   +-- [UI] activar/desactivar módulos en sus zonas previstas
|   |   +-- [UI] variantes visuales/motion ya implementadas y su preview
|   |   +-- [UI] preview con datos DEMO no persistidos como episodio
|   |   +-- [UI] gestión de HUD presets: NEW FROM BASE / DUPLICATE / SAVE TEMPLATE
|   |
|   +-- P0 [SCENE] NEW EPISODE
|   |   +-- [UI] nombre, vídeo o imagen y HUD preset en una pantalla
|   |   +-- [UI] Cancel / Create Episode (sin Choose HUD intermedio)
|   |
|   +-- P0 [SCENE] EPISODES
|   |   +-- [UI] tarjetas con miniatura y metadatos
|   |   +-- [UI] abrir episodio guardado directamente / New Episode / Back
|   |
|   +-- P1 [SCENE] ASSETS (biblioteca global)
|   |   +-- [DATA] equipo, jugador, localizaciones, quests, fotos, mapas, medios
|   |   +-- [UI] importar, buscar/filtrar, tarjetas y detalle (por cerrar)
|   |
|   +-- P0 [SCENE] EPISODE EDITOR
|       +-- [UI] preview: fondo + THE SYSTEM
|       +-- [UI] reproducir / pausar / buscar
|       +-- [UI] Explore / Record / Playback
|       +-- [UI] el mismo árbol jerárquico del HUD configurado
|       +-- [UI] timeline con scroll vertical: zona → componente → hijo → propiedad
|       |   +-- [UI] Left Rail / Panel State: Folded, Open, Pinned con puntos hold
|       |   +-- [DATA] propiedad fuente animable, p. ej. Stamina.Valor (%)
|       |   +-- [UI] puntos de valor, eventos discretos y clips de visibilidad
|       |   +-- [UI] barra y número derivados del mismo valor fuente
|       +-- [UI] asignar fichas de biblioteca a jugador, equipo, lugar y misión
|       +-- [UI] inspector sincronizado con preview/árbol/timeline
|       +-- [UI] guardar / deshacer / rehacer
|       +-- P2 [UI] exportación (definir y probar después)
|
+-- B. THE SYSTEM (HUD sobre vídeo; diseño principal)
|   |
|   +-- P0 [UI] HUD SHELL / CONTORNO
|   |   +-- [ART] marcas discretas de las cuatro esquinas
|   |   +-- [ART] retícula / coordenadas / líneas técnicas opcionales
|   |   +-- [UI] reglas de profundidad, safe area y superposición
|   |   +-- [MOTION] boot, aparición/repliegue general, microactividad
|   |
|   +-- P0 [UI] TOP BAR (siempre accesible; normalmente compacta)
|   |   +-- Identidad: KOALITIC / THE SYSTEM + indicador System Online
|   |   +-- [UI] pestañas: Profile / Map / Gear / Quest / Gallery / Codex
|   |   +-- [DATA] localización / capítulo / coordenadas cuando proceda
|   |   +-- [UI] activo, hover, abierto, fijado, deshabilitado
|   |   +-- [MOTION] expansión y traspaso de foco entre pestañas
|   |
|   +-- P0 [UI] LEFT RAIL (replegado o expandido)
|   |   +-- Player summary
|   |   |   +-- [DATA] avatar, nombre, level, XP, skills visibles
|   |   |   +-- [UI] tarjeta Player y barras
|   |   +-- Inventory / Loadout
|   |   |   +-- [DATA] fichas de equipo elegidas para el episodio
|   |   |   +-- [UI] slots, imagen de objeto, título, especificación, selección
|   |   +-- Gear Radial (puede emerger desde la zona izquierda)
|   |   |   +-- [UI] sectores, anillo, centro, indicador de slot
|   |   |   +-- [DATA] imagen, nombre, categoría, detalle y estado equipado
|   |   |   +-- [MOTION] abrir, rotar/revelar, hover, select, cerrar
|   |   +-- Stamina / Time Left
|   |       +-- [DATA] valor a lo largo del episodio; tiempo/cuenta atrás
|   |       +-- [UI] barra y lectura compacta/expandida
|   |       +-- [ART] variantes normal, baja y crítica
|   |
|   +-- P0 [UI] RIGHT RAIL (replegado o expandido)
|   |   +-- Active Mission / Quest
|   |   |   +-- [DATA] título, objetivos, progreso, recompensa
|   |   |   +-- [UI] misión principal, secundaria, estado completo
|   |   +-- Photo Opportunities / Recommendations
|   |   |   +-- [DATA] consejos, oportunidades, lugar, equipo sugerido
|   |   |   +-- [UI] tarjetas apiladas tipo hudv2_3
|   |   +-- Location / Map compact
|   |   |   +-- [DATA] mapa, puntos, ubicación y ruta del episodio
|   |   |   +-- [UI] mini mapa, leyenda y puntos seleccionables
|   |   +-- Codex compact
|   |       +-- [DATA] lugar, hechos, ilustración o wireframe
|   |       +-- [UI] tarjeta de descubrimiento / ampliar entrada
|   |
|   +-- P0 [SCENE] REVELACIONES CENTRALES TEMPORALES
|   |   +-- Photo Result / Rank Reveal
|   |   |   +-- [DATA] foto, rango, estadísticas, XP, título
|   |   |   +-- [UI] marco de foto, medidores, tarjeta de rango
|   |   |   +-- [MOTION] marco -> foto -> rango -> barras -> salida
|   |   +-- Main/Side Quest Reveal
|   |   |   +-- [DATA] objetivo, estado, recompensa, tiempo
|   |   |   +-- [MOTION] inicio, progreso, completado, fallo
|   |   +-- System Notification
|   |       +-- [DATA] categoría, mensaje y prioridad
|   |       +-- [ART] normal / aviso / crítica
|   |       +-- [MOTION] entrada, permanencia, salida
|   |
|   +-- P1 [UI/SCENE] MÓDULOS DE SISTEMA RECURRENTES
|   |   +-- Map expanded: región, ruta, waypoint, descubiertos
|   |   +-- Profile expanded: skills, técnicas, títulos, progreso
|   |   +-- Inventory expanded: categorías, fichas, equipar
|   |   +-- Gallery: fotos, rank, filtros, detalle y photo pack
|   |   +-- Codex expanded: places, history, characters, curiosities
|   |   +-- Rank System: escala E/D/C/B/A/S/... si se confirma
|   |   +-- Quest Log: principales, secundarias y completadas
|   |
|   +-- P1 [SCENE] FEEDBACK BREVE
|   |   +-- Quick Swap / Gear Equipped; Focus +10; Framing +1
|   |   +-- Vision +1; New Technique; Level Up; XP gain
|   |   +-- System Recommendation; Photo Pack unlocked
|   |   +-- [MOTION] variantes de toast compartiendo un patrón
|   |
|   +-- P2 [SCENE] EVENTOS ESPECIALES / FUTUROS
|       +-- System Scan y momento de descubrimiento/landmark
|       +-- Aperture / Zoom camera / Zoom mobile
|       +-- Skip Time; modo cooperativo Arnau si el relato lo necesita
|       +-- Archive / Journal / Documents / Rewards / Fast Travel
|       +-- Efectos con tracking sobre objetos/personas del vídeo
|
+-- C. BIBLIOTECA DE CONTENIDO (datos, no pantallas nuevas)
|   +-- [DATA] Player: avatar, nombre, biografía corta, level, XP, skills
|   +-- [DATA] Gear: cámara, móvil, lente, 360, patines, trípode, otros
|   +-- [DATA] Place: mapa, marcador, coordenadas, foto, información
|   +-- [DATA] Quest: título, objetivos, progreso, recompensas
|   +-- [DATA] Photo: archivo, metadata, rank, criterios, comentarios
|   +-- [DATA] Codex entry: categoría, texto, imagen/diagrama
|   +-- [DATA] HUD version: estructura, estilo, estados y motion (sin valores temporales)
|   +-- P2 [DATA] Content preset: selección reusable de fichas, si hace falta
|   +-- [DATA] Episode: fondo, configuración particular, timeline
|
+-- D. DESIGN SYSTEM / ASSETS COMPARTIDOS
    +-- P0 [ART] logotipos: KOALITIC y THE SYSTEM / núcleo
    +-- P0 [ART] tipografía: display, lectura y números/telemetría
    +-- P0 [ART] iconos: navegación, equipo, misiones, cámara, alertas
    +-- P0 [ART] paneles: bordes angulares, esquinas, divisores, tabs
    +-- P0 [ART] tokens: fondos, opacidad, cian, rojo, violeta, acentos
    +-- P0 [ART] retícula, microtexto, textura sutil y glow regulado
    +-- P0 [MOTION] presets: abrir, cerrar, hover, select, reveal, toast
    +-- P1 [ART] objetos de inventario con fondo transparente
    +-- P1 [ART] retratos, fotos de resultados, mapas, wireframes
    +-- P1 [ART] SFX: navegación, selección, captura, rank, warning
    +-- P2 [ART] partículas, scan avanzado y secuencias únicas
```

## 5. Estados que hay que diseñar de verdad

Una imagen por componente no cubre su comportamiento. Para los módulos P0 necesitaremos **al menos** estas muestras visuales: cerrado/replegado, abierto, hover, seleccionado, fijado, aparición, salida y caso con dato largo o imagen ausente cuando aplique. No todos necesitan ocho imágenes terminadas: una hoja de estados anotada puede explicar varias, y el motion se prueba después en movimiento.

**Niveles de presencia en pantalla:**

1. **Base:** esquinas, logo/estado, jugador compacto, misión compacta, stamina y tiempo si el episodio los utiliza.
2. **Exploración:** abrir una zona lateral o la barra superior, con el vídeo aún visible.
3. **Foco:** radial, mapa ampliado o Codex ampliado; ocupar más espacio durante la interacción.
4. **Revelación:** Photo Result, rank, misión completa, level up o scan; escena central breve, luego regresar al nivel anterior.

El cursor no forma parte del resultado. Si se graba un hover o una selección, se reproduce el cambio visual por sí solo. Cada módulo debe poder representar otro jugador, otra cámara y otra ciudad sin redibujar su estructura.

## 6. Qué se dibuja, qué se entrega como asset y qué queda editable

| Pieza | Entrega visual recomendable | Debe seguir editable en la app |
|---|---|---|
| Main menu | Imagen de dirección + fondos, logo y símbolos por separado | Títulos de acciones, foco y estados de botones |
| Paneles HUD | Vistas y hoja de estados; marcos/ornamentos separados si conviene | Geometría fijada por variante; texto, números y pestaña activa en el episodio |
| Gear Radial | Abierto, cerrado, hover y seleccionado; anillo y objeto separados | Cantidad/orden de slots, nombre, foto y equipo activo |
| Player/Stamina | Ejemplos de valores y estados | Nombre, avatar, XP, level, stamina y sus cambios temporales |
| Mapa/Codex | Base de mapa o diagrama y un ejemplo de tarjeta | Ubicación, marcadores, ruta, hechos y textos |
| Photo Result | Foto y marco separados; secuencia de revelación | Foto, rank, medidores, XP y duración del momento |
| Notificaciones | Plantilla normal/alerta/crítica | Texto, prioridad, instante y duración |

Los PNG antiguos sirven de referencia; no son elementos ya recortados ni configurables. Algunos muestran texto incrustado y fondo fotografiado, por lo que habrá que **recrear** la UI y pedir/generar assets limpios. El logo antiguo del núcleo puede inspirar el nuevo símbolo, pero necesita versión nítida/escalable y variantes de estado.

## 7. Estado de imágenes y próximo orden de diseño

1. **Main Menu:** las imágenes `mainmenu.png` y `mainmenu_v2.png` aportadas por el usuario son referencias de personalidad, contraste, tipografía y logo. Sus botones y grid no son la navegación vigente: el prototipo usa `EPISODES`, `CONFIGURE HUD` y `ASSETS`.
2. **Hoja breve del design system:** pendiente; paleta, tipografías de referencia, panel angular, iconos, estados de botón y núcleo. Derivarla del menú existente, sin inventar otro estilo.
3. **HUD base sobre un fotograma:** left rail, top bar, right rail replegados y centro despejado. Revisar legibilidad sobre zona clara y oscura del vídeo.
4. **HUD expandido:** panel izquierdo, barra superior y panel derecho abiertos de forma coherente; mostrar cómo se pliegan/fijan.
5. **Gear Radial:** pieza protagonista de `hudv2_2`, con selección de cinco equipos y estados.
6. **Configure HUD y Assets:** `mainmenu_configure_hud.png` ya orienta el configurador. Assets no tiene pantalla visual cerrada; mantener el mismo lenguaje y diferenciar la UI de autoría del HUD exportable.
7. **Photo Result + Rank Reveal:** primera escena temporal central, usando la referencia de movimiento.
8. **Map, Quest, Codex, Gallery y feedback:** por dependencia del primer episodio real; diseñar módulos P1 cuando el sistema base esté aprobado.

Después de cada imagen aprobada: anotar qué elementos están en capas, qué datos cambian y qué estados/motion faltan. Entregar esa ficha junto a la imagen a Claude. **La imagen aprueba la dirección visual; no sustituye el componente funcional.**

## 8. Decisiones para revisar antes de producir imágenes

- Exacto contenido persistente en left/right/top y cuánto se esconde por defecto.
- Si Quest, Map y Codex comparten el panel derecho o pueden superponerse en escenas especiales.
- Rangos y colores finales; los antiguos muestran E/D/C/B/A/S mientras los HUD v2 aún son conceptos.
- Cuánta información del antiguo `Archive` tiene sentido en una aplicación de episodios de fotografía; no asumir mecánicas de juego inexistentes.
- Lista exacta de módulos opcionales por zona y primeras variantes visuales/motion que se publicarán.

Este árbol es el **inventario de diseño**, no un compromiso de implementar 26 carpetas antiguas. El primer objetivo es que las imágenes y componentes P0 formen una familia reconocible y operable sobre vídeo real.
