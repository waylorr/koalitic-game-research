# KOALITIC workflow workbench

Abre `workflow.html` en el navegador y recarga la pestaña si ya estaba abierta. Es una mesa de trabajo interactiva construida con UI real, sin imágenes de fondo. Tiene vistas **Flow Map**, **Prototype** y **Spec**.

## Estado del prototipo HTML actual

- **ASSETS → MEDIA** importa imágenes y vídeos locales para previsualizarlos. El guardado local intenta conservar también los archivos importados. No revela la ruta completa del PC; puede añadirse una nota manual de procedencia.
- **ASSETS → DATA LIBRARY** almacena jugadores, equipamiento, lugares y otros datos reutilizables. Permite crear, editar y borrar fichas sin uso; las fichas usadas se archivan. Cada episodio guarda su propia copia de los datos asignados.
- **ASSETS → UI COMPONENTS** es un catálogo de solo lectura con los módulos, hijos, variantes y estados. Los componentes se desarrollan fuera de la aplicación.
- **CONFIGURE HUD** usa el contexto plantilla del visor compartido: activa zonas y módulos fijos, cambia su orden dentro de cada barra, selecciona variantes y motion presets y prueba estados con datos demo. `SAVE TEMPLATE` guarda una configuración visual reutilizable, sin datos de episodio.
- **EPISODES** crea un episodio desde una imagen/vídeo y una plantilla opcional. El editor permite **cambiar de HUD V1 a V2**: se aplica el nuevo aspecto, mientras fichas, overlays y pistas permanecen. Se puede deshacer el último cambio de HUD. `SAVE EPISODE` guarda el episodio con el HUD aplicado. La timeline despliega zona → componente → hijo → propiedad, con scroll vertical y puntos que se pueden añadir, visitar o borrar.
- **SPEC** añade el contrato de los 18 tipos de componente registrados: hijos, asignaciones constantes, pistas implementadas, variantes y motion. `Person Identification` ya aparece en el catálogo y en la paleta de overlays como etiqueta manual.

El proyecto se guarda en el almacenamiento local del navegador (**IndexedDB**) como una instantánea que incluye plantillas, episodios, fichas y archivos Media importados. Al recargar el mismo HTML en el mismo navegador se intenta recuperar esa instantánea. El mensaje de guardado indica si el navegador aceptó el guardado o si los cambios solo quedarán en la sesión. Esto no sustituye todavía un archivo de proyecto portable, copias de seguridad, versiones ni sincronización entre ordenadores. El arte final, las implementaciones completas de cada componente, Record Mode, reproducción/sincronización de vídeo completa, edición temporal por arrastre, undo/redo general, tracking automático y exportación quedan para la aplicación posterior.

`workflow.json` define pantallas y controles; `catalog/components.json` es el registro único de tipos y propiedades, y `catalog/sample-records.json` aporta fichas de ejemplo. `workflow.template.html` solo contiene la estructura. Los fuentes están separados en `runtime/` y `styles/`; `workflow.html` es un archivo autónomo **generado** con `node WORKFLOW/build.mjs` y no se edita directamente. El generador comprueba contratos y sintaxis antes de escribirlo. `node WORKFLOW/smoke.mjs` comprueba el recorrido principal y el cambio de HUD; `node WORKFLOW/store-smoke.mjs` comprueba el orden del guardado y la carga local.

### Mapa de código para continuar el prototipo

| Necesidad | Fuente que se modifica |
|---|---|
| Pantallas, controles y recorridos | `workflow.json` |
| Componentes, hijos, estados, asignaciones y pistas admitidas | `catalog/components.json` |
| Fichas iniciales de demostración | `catalog/sample-records.json` |
| Ficha de jugador, Stamina, radial o lugar dibujados | `runtime/components/` |
| Composición de barras, preview e inspector del HUD | `runtime/hud-view.js` |
| Visor del episodio y timeline desplegable | `runtime/episode-view.js` |
| Evaluación de puntos, interpolación y posiciones | `runtime/timeline-model.js` |
| Reglas de episodio, cambio de HUD y Media | `runtime/domain.js` |
| Navegación y Spec | `runtime/navigation-view.js` |
| Biblioteca | `runtime/assets-view.js` |
| Guardado local | `runtime/project-store.js` |
| Acciones de navegación, timeline, HUD, biblioteca y episodio | `runtime/events/` |
| Entrada, cambios de formulario y recuperación de errores | `runtime/controller.js` |
| Estilos | `styles/`; `build.mjs` fija el orden de ensamblaje |

El HTML final es un único archivo por comodidad de revisión, **pero su código fuente ya está separado por responsabilidad**. Se comprueba un fallo de componente para que la timeline y el resto de pantallas sigan disponibles. Esto no implica que una futura app esté completamente aislada frente a fallos de su núcleo; allí harán falta almacenamiento versionado, migraciones y pruebas de integración adicionales.

## Contrato de producto acordado para la siguiente iteración

Esta sección distingue las decisiones del **producto objetivo** del alcance del prototipo HTML. El prototipo demuestra el primer recorrido; no implementa todavía cada propiedad de todos los componentes.

### Cinco entidades, una responsabilidad cada una

| Entidad | Guarda | No guarda |
|---|---|---|
| Media | Archivo importado y referencia de origen | Nombre del jugador, XP o configuración del HUD |
| Data Library | Fichas reutilizables: jugadores, equipo, lugares, misiones y otras entidades | Pistas de tiempo ni posición de paneles |
| UI Component | Definición de un componente cerrado, sus hijos, propiedades admitidas, estados y variantes | Valores concretos de Jordi o de un episodio |
| HUD Template | Composición visual reutilizable: módulos de las zonas fijas, variantes y motion presets | Jugador, equipo, XP o eventos del vídeo |
| Episode | Medio, plantilla inicial, asignaciones de datos, ajustes visuales locales y pistas de tiempo | Una copia nueva del catálogo de componentes |

Los componentes UI se desarrollan fuera de la aplicación con código; el catálogo dentro de la app permite ver su anatomía, estados y variantes. «Player Name» es un subcomponente que recibe un dato. No es el lugar donde se escribe «Jordi». Un HUD Template puede usar datos de demostración en su preview, pero esos datos no pasan al episodio.

### Flujo principal sin pasos obligatorios extra

**EPISODES → NEW EPISODE:** nombre + vídeo/imagen + HUD Template opcional (se usa el predeterminado si no se cambia). Se abre directamente el **Episode Editor**. Allí se selecciona Player Profile y se elige Jordi o Arnau desde Data Library; se asignan los cinco equipos del radial y los demás contenidos necesarios. Después se editan estados y valores en la timeline y se pulsa **Save Episode**. Guardar el episodio incluye sus ajustes visuales locales: nunca obliga a crear HUD V2. «Guardar aspecto como nueva plantilla» es una acción opcional cuando ese aspecto deba reutilizarse en otros episodios.

El episodio conserva el aspecto y los datos que tenía al guardarse. Los archivos de Media se referencian, no se duplican por cada episodio. Cambiar una ficha global o una plantilla después no reescribe episodios anteriores de forma silenciosa. Una futura actualización explícita puede ofrecerse aparte, pero no pertenece al flujo inicial.

### Un catálogo de propiedades, dos contextos de inspector

Cada UI Component declara una vez sus propiedades y cuáles son: **visuales** (variante, motion), **asignaciones** (jugador, lugar, equipo), **valores temporales** (XP, stamina, progreso), **estados/eventos** (Folded, Open, Pinned, aparición) o **espaciales** (posición/anclaje de overlays). El mismo contrato alimenta los inspectores y la timeline; no se crean formularios desconectados para la misma propiedad.

Configure HUD y Episode Editor comparten el visor del HUD, la jerarquía de componentes y la infraestructura del inspector. Son **dos contextos del mismo espacio de trabajo**: el contexto plantilla oculta vídeo, datos reales y timeline; el contexto episodio muestra el vídeo y habilita asignaciones y pistas. La interfaz del episodio contiene árbol a la izquierda, vídeo/preview en el centro, inspector a la derecha y timeline abajo. Las propiedades implementadas aparecen bajo el hijo correspondiente al desplegar su componente; los demás hijos se identifican como solo visualización.

- En **HUD Templates / Configure HUD**, el inspector muestra módulos, variante, motion y una preview temporal de estados. No permite editar datos de episodio.
- En el **Episode Editor**, seleccionar el mismo componente muestra **Data** (ficha o texto local), **Look** (ajuste visual local si hace falta) y **Time** (propiedades animables). La timeline muestra el árbol completo de módulos incluidos con expansión progresiva; las pistas editables implementadas aparecen bajo sus hijos y no se inventan pistas para datos que aún carecen de contrato.
- El número y la barra de Stamina leen una sola pista. XP sigue la misma regla. La pista padre del Left Rail controla Folded/Open/Pinned, mientras las pistas de sus hijos continúan evaluándose aunque estén ocultos.

Los cinco sectores del radial se asignan en el episodio; la primera versión anima qué sector está seleccionado. Reasignar sectores durante el vídeo queda para después. Cambiar de Barcelona a Girona sí debe poder hacerse en un punto de la timeline mediante una nueva asignación de lugar.

### Visibilidad, colocación y motion sin editor libre

Separar tres acciones que hoy podrían confundirse: **Include in Template** decide si una zona o módulo forma parte del HUD base; **Preview only** oculta temporalmente algo mientras se diseña, sin guardarlo; **Visible / Folded / Open / Pinned** son estados reales que el episodio puede cambiar en la timeline. Si una barra está plegada, los valores de sus hijos siguen evaluándose; si un módulo no está incluido en la plantilla, no se crea su instancia hasta que el episodio lo añada explícitamente.

Las zonas principales mantienen sus anclajes semánticos: Left Rail en el borde izquierdo, Top Bar arriba y Right Rail a la derecha. La primera versión permite activar/desactivar zonas y módulos, cambiar el orden de módulos dentro de cada barra y escoger un layout predefinido cuando haga falta. No permite arrastrar libremente las barras ni editar coordenadas por píxel. Una cuadrícula de posiciones magnéticas puede añadirse después, limitada a anclajes compatibles y márgenes seguros, si las pruebas con metraje real muestran esa necesidad. Los POV Overlays sí se colocan sobre el vídeo y usan posiciones/anclajes propios del episodio.

El **motion preset** es un valor por defecto del HUD Template: define *cómo* se abre, cierra o aparece un componente. La timeline del episodio decide *cuándo* ocurre el cambio de estado. Un override local de motion se ofrece solo como opción avanzada si una escena concreta lo necesita; no se edita otra vez la animación base. La misma definición de estados y transiciones debe usarse en ambos contextos.

### Biblioteca y overlays

**Assets** tendrá Media, **Data Library** y **UI Components**; estas pestañas son tres vistas de la misma biblioteca de trabajo, no tres lugares donde duplicar datos. Data Library tendrá filtros **Todas** y **Usadas en este episodio**. Las fichas sin uso pueden borrarse; las utilizadas se archivan sin romper episodios guardados. Un inspector puede enseñar la procedencia de un valor: Media → ficha → instancia de componente → pista del episodio.

Los **POV Overlays** no necesitan habilitarse en el HUD Template para usarlos. Se eligen directamente desde el catálogo del Episode Editor, se arrastran sobre el vídeo y crean una instancia y una pista temporal. Allí se ajustan datos, aparición, duración y posición/anclaje. Una persona que aparece una sola vez puede llevar texto local; si reaparece, puede enlazarse a una ficha de Data Library. El seguimiento de un punto se coloca y corrige manualmente mediante puntos de posición; no hay detección por IA en esta fase.

### Alcance de la primera prueba completa

Validar un episodio de principio a fin con **Player Profile** (ficha + retrato + XP), **Stamina** (valor único para número y barra), **Left Rail** (Folded/Open/Pinned), **Gear Radial** (cinco asignaciones y selección) y **un POV Overlay** manual. Solo después extender el mismo contrato al resto de los componentes.

### Última reducción antes de ampliar el HTML

1. **Un registro de componentes** define ID estable, zona, hijos, estados y propiedades admitidas. La lista de zonas, el catálogo, el inspector y la timeline se derivan de él; no mantienen inventarios paralelos. Los controles de edición se construyen a partir de esas propiedades, con interfaces específicas solo cuando un componente realmente lo requiere.
   HUD V1 no es un conjunto cerrado: añadir un componente al registro y a su renderer permite incluirlo en la zona correspondiente. Si el componente necesita datos o tiempo, declara también sus asignaciones o propiedades; las plantillas persistidas en una futura aplicación requerirán migración.
2. **Un mismo visor y evaluador de estado** sirven al contexto plantilla y al episodio. La plantilla pasa datos demo; el episodio pasa sus asignaciones y el tiempo actual. No crear una segunda implementación de Player Profile o Stamina para cada pantalla.
3. **Un solo guardado por contexto:** Save Template para decisiones visuales reutilizables; Save Episode para medio, asignaciones, overrides locales y pistas. En la primera interfaz de templates basta crear desde base, duplicar y guardar; «Save As» puede resolverse mediante duplicar + renombrar y no necesita otra operación.
4. **Un solo registro de Media por archivo.** Importar desde New Episode lo añade a Media; seleccionar una imagen en Data Library la referencia. Las fichas pueden tener valores iniciales de ejemplo, pero una vez asignadas el episodio posee sus valores efectivos y sus cambios temporales. No se copian archivos ni se crean fichas nuevas por cada keyframe.
5. **Inspector progresivo:** en el Episode Editor se empieza por Data y Time. Look permanece plegado como override opcional. La timeline muestra pistas para las propiedades animables implementadas, aunque solo tengan un punto inicial; el usuario puede añadir puntos donde los necesite.
6. **Sin constructor universal:** no crear componentes nuevos, no modificar jerarquías de hijos desde la app, no editor libre de píxeles, no tracking automático. Los componentes cerrados se mejoran en el proyecto de código. La cuadrícula magnética queda registrada como opción futura, no como dependencia del modelo de datos inicial.

Esta reducción no elimina capacidades futuras: una propiedad nueva se declara en el catálogo, se representa en el inspector correspondiente y usa el mismo evaluador temporal. Si requiere un control o renderer especial, se añade solo a ese componente.

### Límites visibles del HTML actual

Las zonas se derivan del registro único, el visor se comparte entre plantilla y episodio y el catálogo UI es de solo lectura. El guardado local depende de IndexedDB y de la cuota/política del navegador; falta exportar/importar un proyecto portable. El vídeo es referencia visual; el prototipo no ofrece todavía reproducción/grabación de acciones, curvas avanzadas, seguimiento cuadro a cuadro, historial ni exportación. Los componentes fuera del primer recorrido muestran anatomía y controles de plantilla, pero no todos sus datos y pistas específicos.
