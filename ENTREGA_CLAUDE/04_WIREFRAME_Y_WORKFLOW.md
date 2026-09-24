# KOALITIC GAME — workflow y contrato de UX

**Estado: contrato de producto revisable, 24/09/2026.** La navegación vive en [`../WORKFLOW/workflow.json`](../WORKFLOW/workflow.json) y el catálogo estructurado en [`../WORKFLOW/catalog/components.json`](../WORKFLOW/catalog/components.json). El [HTML navegable](../WORKFLOW/workflow.html) es una mesa de trabajo funcional, no la aplicación final. Prototype y Spec reflejan las decisiones actuales. El arranque de Claude Code y la primera prueba se describen en [`00_INICIO_CLAUDE_CODE.md`](00_INICIO_CLAUDE_CODE.md).

## 1. Cinco responsabilidades

1. **Media** conserva una entrada por imagen o vídeo importado. El vídeo es fondo y reloj de referencia; no se edita su montaje.
2. **Data Library** conserva fichas reutilizables (jugador, equipo, lugar y más tipos cuando exista su contrato). Una ficha puede referenciar Media y usarse en varios episodios.
3. **UI Components** es el catálogo de componentes programados y sus hijos, estados, variantes y motion. Se consulta y previsualiza en Assets; no se crean componentes nuevos desde la app. Un componente nuevo se añade al código y al registro.
4. **HUD Template** guarda composición visual reutilizable: zonas fijas, módulos incluidos, orden dentro de zona, variante y motion. No guarda jugador, XP, stamina ni keyframes.
5. **Episode** conserva una copia del HUD elegido, medio, asignaciones de fichas, ajustes visuales locales opcionales y pistas temporales. Editar un episodio no cambia la plantilla ni otros episodios. Guardar su apariencia como plantilla nueva es opcional. Si se aplica otro HUD Template al episodio, se sustituye esa copia visual y permanecen fichas y pistas.

## 2. Navegación actual

`MAIN MENU → EPISODES → NEW EPISODE → EPISODE EDITOR`. Desde EPISODES también se abre una tarjeta existente. Desde el menú se accede por separado a `CONFIGURE HUD` y `ASSETS`. `NEW EPISODE` pide nombre, vídeo o imagen y plantilla opcional; usa HUD V1 por defecto y entra directamente al editor. `CANCEL` vuelve a EPISODES. No hay pantalla separada Load Episode, selector posterior de HUD ni Settings general.

`CONFIGURE HUD` y `EPISODE EDITOR` son **dos contextos del mismo espacio de trabajo**, con el mismo registro de componentes, árbol y preview. El primero usa datos demo y guarda solo decisiones visuales. El segundo agrega medio real, fichas, propiedades en el tiempo y overlays. `ASSETS` tiene las pestañas Media, Data Library y UI Components; la última es de solo lectura para estructura y estados de prueba.

En la cabecera del Episode Editor se escoge otro HUD Template y se pulsa `APPLY HUD`. `UNDO HUD CHANGE` permite recuperar inmediatamente el aspecto anterior; `SAVE EPISODE` guarda la selección aplicada. Es una operación visual: las pistas de módulos que el nuevo HUD oculta se conservan en el episodio y pueden reaparecer al volver a incluir el módulo. No hace falta una copia separada de cada combinación de HUD y datos.

## 3. Configure HUD

Las zonas `LEFT RAIL`, `TOP BAR` y `RIGHT RAIL` tienen anclajes predefinidos. El autor puede incluir/excluir una zona o módulo, reordenar módulos dentro de su zona y escoger variantes y motion existentes. Puede probar estados y ocultar temporalmente piezas sin que esa prueba altere el episodio. El Left Rail tiene un preset de transición de panel, ahora `Smooth Reveal` o `Snap`, que determina **cómo** se mueve entre estados; el episodio determina **cuándo**. No hay maquetador libre ni editor de píxeles. Una cuadrícula con anclajes seguros es una idea futura, no una dependencia.

HUD V1 es una plantilla inicial, **no un límite fijo de componentes**. Nuevos componentes diseñados y programados fuera de la app se registran con zona, hijos, estados, variantes, motion y, si procede, propiedades temporales. El catálogo y las opciones de plantilla deben reconocerlos sin inventarios paralelos. Las plantillas antiguas necesitarán migración explícita en la aplicación final; la persistencia local del HTML solo cubre el formato actual.

## 4. Episode Editor y timeline

El editor muestra árbol de HUD, vídeo/imagen con preview, inspector y timeline. La timeline sigue una jerarquía desplegable tipo After Effects: `zona → componente → hijo → propiedad editable`. Tiene desplazamiento vertical; al abrir un componente se ve también qué hijos son solo visualización. Seleccionar el mismo módulo desde árbol, preview o timeline debe llevar a la misma instancia. La primera prueba funcional implementa las propiedades de la tabla; los demás componentes aún no tienen todas sus pistas y formularios.

| Jerarquía | Fuente editable | Evaluación |
|---|---|---|
| `LEFT RAIL → Panel State` | Folded / Open / Pinned | Discreta; mantiene el estado hasta el siguiente punto |
| `LEFT RAIL → Player Profile → XP Value` | XP | Numérica lineal; cifra y barra derivan del mismo valor |
| `LEFT RAIL → Stamina → Value Number` | Porcentaje | Numérica lineal; cifra y relleno derivan del mismo valor |
| `LEFT RAIL → Gear Radial → Center Selection` | Sector 1–5 | Discreta; equipo del sector procede de cinco fichas asignadas |
| `TOP BAR → Location Header → Place Name` | Ficha de lugar | Discreta; Barcelona puede cambiar a Girona |
| `POV OVERLAYS → instancia` | Texto, inicio/fin, posición X/Y | Rango de aparición y puntos de posición manual |

El usuario mueve el cabezal, cambia el valor o estado, y se crea o actualiza un punto. Puede ir a un punto, añadir uno con el valor evaluado o borrar el punto actual si queda otro. Los números interpolan; estados, sectores y fichas usan *hold*. La pista padre no congela datos de sus hijos: Stamina y XP avanzan con Left Rail plegado. Los presets de motion hacen la transición visual al cambiar de estado; no se editan sus curvas internas en cada episodio.

**Definición frente a implementación:** el prototipo permite scrub y editar esas pistas, pero aún no reproduce vídeo con controles completos, no graba una sesión en Record Mode, no permite arrastrar temporalmente puntos, no tiene undo/redo general ni exportación. El guardado y la recarga locales usan IndexedDB cuando el navegador lo permite; aún no hay archivo de proyecto portable ni copias de seguridad. La duración del vídeo alimenta la escala cuando hay metadatos; la sincronización precisa necesita prueba en el stack definitivo.

## 5. Datos, overlays y guardado

Al seleccionar Player Profile en un episodio, el inspector permite escoger Jordi o Arnau desde Data Library. El episodio guarda una instantánea de esa ficha y una pista XP propia. Los cinco sectores del radial enlazan fichas Gear; el lugar puede cambiar durante el episodio. Las fichas usadas se archivan en vez de romper episodios; las no usadas se pueden borrar. La política de actualización de episodios si cambia una ficha o el código global del componente sigue pendiente.

`POV OVERLAYS` es una capa independiente de los rails. Weather/Location, Notification, Photo Result, Quest Reveal, Level Up y Person Identification son tipos del catálogo. Se añaden **directamente en el editor**, arrastrándolos sobre el vídeo o pulsando su entrada. Se ajustan texto, rango temporal y posiciones manuales. Person Identification es una etiqueta manual, no detección por IA. No hace falta habilitar estas familias en el HUD Template. Faltan contratos de datos completos para escenas especiales.

`SAVE TEMPLATE` guarda solo composición visual; `SAVE EPISODE` guarda su copia de HUD, asignaciones y pistas. El HTML intenta guardar una instantánea local del proyecto, con los medios importados, y confirma si se completó o si solo queda en memoria de la sesión. Una aplicación real deberá ofrecer proyecto portable, versiones/migraciones, copias de seguridad y evaluación determinista de cualquier tiempo. Exportar viene después.

## 6. Siguiente iteración

Validar primero el circuito completo con Player Profile, Stamina, Left Rail y un overlay manual: cambio de estado con panel plegado, datos que siguen variando, fichas, guardado y reapertura. En el siguiente incremento, añadir Gear Radial y Location Header. Después ampliar contratos para Right Rail, Top Bar y resultados fotográficos, y profundizar en motion y arte definitivo. Mantener el catálogo cerrado a componentes implementados en código evita construir un programa general de diseño dentro de esta herramienta.
