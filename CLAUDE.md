# KOALITIC GAME — instrucciones para Claude Code

## Producto y fuentes

- Responde al creador en español claro. Es el único usuario inicial de la aplicación; decide producto y estética, mientras tú investigas e implementas.
- KOALITIC es una aplicación de autoría: coloca un HUD interactivo reutilizable sobre vídeo o imagen ya montados. No es un juego 3D ni un editor de montaje de vídeo. El cursor de autoría nunca forma parte del resultado.
- Empieza por `ENTREGA_CLAUDE/00_INICIO_CLAUDE_CODE.md`, luego `01_CONTEXTO_Y_ENCARGO.md`, `04_WIREFRAME_Y_WORKFLOW.md`, `03_ARBOL_UI_Y_ASSETS.md`, `02_INVESTIGACION_TECNOLOGICA.md` y `WORKFLOW/README.md`. Contrasta esas descripciones con `WORKFLOW/workflow.json`, `WORKFLOW/catalog/components.json` y el prototipo. Si hay contradicción, prevalecen las decisiones recientes del usuario; identifica lo dudoso en vez de inventar un contrato.
- `KOALITIC_GAME_MASTER_PROMPT.md` es histórico. `ASSETS ANTIGUOS/` y `ENTREGA_CLAUDE/referencias/` son referencias de comportamiento y estética, no código ni pantallas finales que deban copiarse.
- El stack sigue abierto. Investiga documentación y licencias actuales de las opciones finalistas y recomienda una ruta sencilla con una alternativa. No adoptes una tecnología por aparecer en un documento de investigación.

## Contratos de producto

- Mantén separadas Media, Data Library, definiciones de UI Components, HUD Templates y Episodes. Un HUD Template guarda composición, variantes y motion; un Episode guarda medio, asignaciones de datos, ajustes locales y pistas temporales. El configurador usa datos demo y no edita XP ni otros valores del episodio.
- Configure HUD y Episode Editor son dos contextos de un visor y contrato de componentes compartidos. El primero configura la plantilla; el segundo asigna contenido, controla tiempo y añade overlays POV. Un componente nuevo se programa fuera de la aplicación y entra por el registro, no por un constructor universal dentro de la UI.
- Zonas fijas: Left Rail, Top Bar y Right Rail. Los overlays POV pertenecen a una capa independiente y pueden anclarse manualmente al vídeo. Evita un editor libre de píxeles en la primera versión.
- La timeline organiza zona → componente → hijo → propiedad. Las pistas numéricas y discretas se evalúan en cualquier instante, incluso con el panel padre plegado. Un único valor alimenta cifra y barra de Stamina; otro único valor alimenta cifra y barra de XP. La animación reutilizable decide *cómo* cambia un estado; el episodio decide *cuándo*.
- Guarda proyectos de forma que puedan reabrirse sin perder medio, fichas, HUD, asignaciones ni pistas. Define IDs estables, versión del formato y una ruta de migración antes de prometer persistencia duradera. No declares resuelta la portabilidad porque funcione IndexedDB en el prototipo.
- La primera prueba real debe cubrir vídeo/imagen de fondo, plantilla seleccionable, Player Profile con ficha, Stamina, estados Folded/Open/Pinned del Left Rail, un overlay manual, scrub y guardar/reabrir. Radial y Location son siguientes componentes prioritarios si la primera prueba queda validada. Record Mode, tracking automático, exportación, cuentas y empaquetado quedan fuera salvo nueva decisión del usuario.

## Forma de trabajar

- Antes de implementar, audita lo que existe, señala contradicciones que cambian arquitectura y presenta un plan pequeño con criterios de aceptación observables. Pregunta solo por decisiones que no puedas resolver razonablemente; no conviertas la investigación en un bloqueo.
- Construye por recorridos verticales verificables. Separa dominio y evaluación temporal, almacenamiento/media, componentes HUD y pantallas de autoría con interfaces claras. Evita estado duplicado y dos implementaciones del mismo componente para configurador y episodio. Modularidad significa responsabilidades y límites de fallo útiles, no crear archivos por cada función.
- Cada cambio funcional debe preservar los flujos existentes y tener una prueba proporcional del contrato afectado. Comprueba el recorrido en la interfaz además de tests de lógica cuando corresponda. Reporta qué se probó, qué falló y qué sigue incompleto; no presentes un mock como funcionalidad terminada.
- Registra decisiones de arquitectura y actualiza la documentación afectada cuando cambie el comportamiento. Mantén documentos y reglas cortos; no generes una biblioteca de procesos genéricos ni dependencias nuevas sin necesidad demostrada.
- Prefiere bibliotecas abiertas o gratuitas para el proyecto. Antes de incorporar servicios o herramientas externas de pago, explica coste, licencia y alternativa. No hagas depender el primer hito de exportación, nube, IA dentro de la app o una GPU concreta.
- `WORKFLOW/workflow.html` es un artefacto generado: modifica `WORKFLOW/runtime/`, `WORKFLOW/styles/`, los JSON fuente o `workflow.template.html`, y regenera con `node WORKFLOW/build.mjs`. Verifica el prototipo con `node WORKFLOW/smoke.mjs` y `node WORKFLOW/store-smoke.mjs` cuando lo cambies. La app definitiva puede tener otra estructura y no debe heredar el prototipo sin evaluación.
