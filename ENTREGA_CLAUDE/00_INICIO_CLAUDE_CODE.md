# Inicio en Claude Code — KOALITIC GAME

Abre Claude Code en la raíz de este proyecto y pega el siguiente mensaje. `CLAUDE.md` contiene las reglas persistentes; este mensaje solo encarga el primer trabajo. Los documentos son contexto sujeto a revisión, no una orden de copiar el HTML ni de adoptar el stack que se mencione en ellos.

---

Quiero empezar a construir una aplicación real de autoría para KOALITIC GAME contigo. Lee `CLAUDE.md` y, en este orden, `ENTREGA_CLAUDE/01_CONTEXTO_Y_ENCARGO.md`, `04_WIREFRAME_Y_WORKFLOW.md`, `03_ARBOL_UI_Y_ASSETS.md`, `02_INVESTIGACION_TECNOLOGICA.md` y `WORKFLOW/README.md`. Inspecciona también `WORKFLOW/workflow.json`, `WORKFLOW/catalog/components.json`, el HTML navegable y sus fuentes. Mira las tres imágenes HUD v2 en `ENTREGA_CLAUDE/referencias/`. El MP4 original está solo en el ordenador local y no se incluye en el primer repositorio en la nube; no supongas que lo has visto. Pídeme una muestra accesible cuando el diseño de motion la necesite. El antiguo master prompt es histórico.

Primero haz una auditoría breve: qué decisiones de producto están cerradas, qué contradicciones o fallos tiene el prototipo, qué falta para una app usable y qué partes del prototipo son solo referencias. Recomienda un stack principal y una alternativa con evidencia actual de documentación/licencias, riesgos y una prueba técnica corta que pueda desmentir tu elección. No presupongas Unreal, app de escritorio, Three.js, ni exportador en el primer hito. Solo yo usaré la app inicialmente; evita servicios de pago obligatorios.

Propón después la arquitectura mínima y un primer recorrido vertical verificable: importar vídeo o imagen; crear/abrir episodio con HUD Template; asignar jugador; editar Stamina y el estado Folded/Open/Pinned del Left Rail a varios tiempos; insertar un POV Overlay manual; buscar cualquier instante de la timeline; guardar, cerrar y reabrir sin pérdida. Usa los componentes visuales provisionales necesarios, pero conserva el camino para sustituirlos por el design system y assets que estoy creando en paralelo. Explica dónde quedan Media, Data Library, registro de componentes, templates, episodios y evaluador temporal, y cómo se evitan duplicaciones.

Antes de escribir la app definitiva, entrégame una propuesta corta con hitos, criterios de aceptación y un máximo de cinco preguntas que realmente cambien arquitectura o prioridad. Si no hay preguntas bloqueantes, declara tus supuestos y avanza con la primera prueba cuando hayas elegido la ruta. Trabaja en incrementos que pueda abrir y probar; al terminar cada uno, indica evidencia de pruebas y limitaciones reales. Responde en español.

---

## Cómo usar este inicio

No hace falta pegar todos los documentos en el chat si Claude Code tiene acceso a esta carpeta. La primera respuesta debe permitir revisar la decisión técnica y el primer hito; no debe prometer ya el producto completo. Una vez acordada la ruta, pedir la implementación del primer recorrido vertical. Las referencias gráficas definitivas pueden incorporarse después sin bloquear el modelo de datos ni la timeline.
