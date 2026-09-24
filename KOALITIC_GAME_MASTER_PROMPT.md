# KOALITIC GAME — master prompt para investigación tecnológica y arquitectura

> **Documento histórico, no fuente vigente de navegación ni alcance P0 (24/09/2026).** Se conserva como contexto de la investigación inicial. Para continuar el producto, leer primero [`ENTREGA_CLAUDE/01_CONTEXTO_Y_ENCARGO.md`](ENTREGA_CLAUDE/01_CONTEXTO_Y_ENCARGO.md), [`ENTREGA_CLAUDE/04_WIREFRAME_Y_WORKFLOW.md`](ENTREGA_CLAUDE/04_WIREFRAME_Y_WORKFLOW.md), [`WORKFLOW/workflow.json`](WORKFLOW/workflow.json) y [`WORKFLOW/catalog/components.json`](WORKFLOW/catalog/components.json). El menú actual es `EPISODES / CONFIGURE HUD / ASSETS`; New Episode vive en Episodes. Configure HUD guarda solo apariencia; Data Library guarda fichas; el Episode Editor asigna datos, puede aplicar otro HUD sin perder sus pistas y edita una timeline jerárquica. El prototipo HTML intenta guardar en IndexedDB, pero aún no tiene un archivo de proyecto portable, Record Mode ni exportación. Las instrucciones de proceso y exportación más abajo reflejan una etapa anterior y no sustituyen las decisiones posteriores del usuario.

Quiero que actúes como investigador técnico, arquitecto de software, director técnico de UI/motion y asesor de producción. Lee este contexto completo y examina los **tres HUD v2 y el vídeo de referencia que adjunto en este chat** antes de emitir juicios visuales. Si falta algún adjunto o no puedes inspeccionarlo, dilo y pídemelo. Responde en español claro. Dedica el tiempo necesario a investigar y razonar; no elijas una tecnología por intuición ni te aferres a recomendaciones de conversaciones anteriores.

## Tu proceso obligatorio

**Primera respuesta: preguntas, no veredicto.** Haz muchas preguntas clarificantes, bien agrupadas y priorizadas, sobre producto, flujo de autoría, objetivos visuales, vídeo, rendimiento, exportación, plataformas, presupuesto/licencias, equipo, colaboración con IA y horizonte de producto. Pregunta lo que cambie realmente la decisión tecnológica. Puedes añadir hipótesis provisionales claramente marcadas, pero **no recomiendes todavía un stack final**. Espera mis respuestas. Si alguna respuesta queda abierta, haz una segunda ronda breve y enfocada antes del análisis final. No conviertas tus preguntas en un bloqueo infinito: después de aclarar lo esencial, registra las incertidumbres restantes y analiza escenarios.

**Segunda fase: investigación actual y comparación profunda.** Investiga la documentación oficial, licencias/precios actuales, ejemplos reales, repositorios y limitaciones técnicas. Cita enlaces directos, fecha de consulta y versión cuando importe. Distingue hechos comprobados, inferencias e hipótesis que necesitan prototipo. Busca activamente pruebas que contradigan tu opción favorita. Incluye rutas open source y propietarias, y calcula el coste real de integrar y mantener cada una. Si una función crítica no está demostrada, márcala como riesgo, no como capacidad asumida.

**Resultado esperado:** una recomendación condicionada y revisable, alternativas viables, matriz comparativa ponderada, arquitectura por capas, principales riesgos y pruebas prácticas de corta duración que puedan decidir entre finalistas. Quiero saber **con qué empezar y por qué**, pero no quiero una decisión prematura.

## Qué es KOALITIC GAME

Premisa creativa: **THE WORLD IS THE GAME**. Jordi es el Player. La realidad filmada es el mundo; THE SYSTEM es una interfaz de videojuego superpuesta al metraje. Las localizaciones se convierten en mapa/mundo; cámaras y accesorios en Gear; fotos en resultados; exploración en Quest y progresión; conocimiento en Codex; crecimiento en XP, Level y Skills.

El producto que queremos construir es una **aplicación de autoría de episodios**, con un HUD de videojuego real y reutilizable. No hay personaje 3D controlable, simulación de mundo, física ni juego 3D detrás. El vídeo grabado ocupa ese lugar. El HUD debe funcionar como software interactivo durante la edición, no como una composición plana de After Effects. La aplicación final debe sentirse como KOALITIC GAME, no como abrir un editor de motor gráfico. El empaquetado como `.exe`/app es un objetivo de producto; no permitas que la discusión de Electron o del instalador desplace las decisiones de render, motion, timeline y export.

Hay dos interfaces relacionadas, que conviene distinguir en arquitectura:

1. **La aplicación de autoría:** inicio, New Episode, Load Episode, biblioteca de HUD/componentes, preferencias, editor, inspector, timeline y exportación.
2. **THE SYSTEM:** el HUD que aparece sobre el vídeo, con Profile, Map, Gear, Codex, Gallery, Quest, Photo Result, XP, notificaciones, etc. Su comportamiento y presentación deben poder reutilizarse entre episodios.

La organización exacta del menú todavía está abierta. Se propuso separar `HUD Library` de `Settings`, ya que editar componentes no es una mera preferencia. Quiero que cuestiones y mejores ese flujo con argumentos de UX, sin tratar el boceto previo como diseño cerrado.

## Flujo de autoría requerido

Un creador debe poder crear/abrir un proyecto, cargar vídeo real (un episodio puede durar unos 10–14 minutos), ver el HUD vivo encima, reproducir/pausar/buscar en el vídeo e interactuar con THE SYSTEM. En **Record Mode**, las acciones significativas del HUD se guardan en el tiempo del vídeo. Luego se ven en una timeline, se mueven, editan o eliminan; el proyecto se guarda y se reabre; finalmente se exportan vídeo, HUD y audio como una película terminada, potencialmente 4K en producción.

Ejemplo: `00:42.300 → GEAR_OPEN`; `00:45.900 → GEAR_SELECT(NIKON_Z5_II)`; `00:51.700 → MAP_OPEN`. La fuente de verdad debería preservar intención semántica y estados persistentes, no limitarse a capturar coordenadas de ratón o miles de keyframes. Si llevo el cabezal de 14:00 a 02:13, el HUD debe reconstruir de inmediato el estado correcto. La vista previa y la exportación deben derivarse del mismo proyecto y de una evaluación determinista del tiempo. Examina posibles modelos de eventos, rangos, snapshots, animación y resolución de conflictos al editar eventos pasados.

La separación conceptual que ya definimos es: **Core** (reglas e interacciones), **Content** (datos de cada episodio), **Presentation** (apariencia y movimiento), **Timeline** (cuándo ocurre cada cambio) y **Media** (vídeo, audio, fotos y assets). Girona e India deben compartir Core aunque cambien mapa, Gear, Quests, textos, valores, assets y quizá skin. Puede haber momentos cinematográficos únicos además de módulos recurrentes.

El primer prototipo de arquitectura debe probar un circuito completo con vídeo corto y HUD provisional: `vídeo → HUD vivo → interacción → estado → grabación semántica → timeline editable → scrub arbitrario → guardar/reabrir → exportar`. Esto valida el sistema, pero **la capacidad de alcanzar la calidad visual objetivo debe investigarse y demostrarse en paralelo** mediante un prototipo visual representativo. Un prototipo funcional feo por sí solo no decide el stack.

## Objetivo visual: prioridad máxima

Estudia detenidamente los HUD v2 y el vídeo adjuntos. Busco una interfaz con nivel de acabado de un menú/HUD AAA, con referencias de ambición como **Call of Duty: Black Ops 3** y **Cyberpunk**, sin copiar su propiedad intelectual. No quiero que la evaluación se reduzca a si una librería puede dibujar paneles y texto. Evalúa si permite producir, iterar y mantener *muchas* pantallas, componentes y transiciones con una dirección artística consistente.

La estética contempla tipografía y jerarquía sólidas, paneles angulares, líneas técnicas, diagramas, mapas, radial Gear, wireframes/hologramas, máscaras, texturas, glow, blur, distorsión, shaders, partículas, profundidad 2.5D, microinteracciones, transiciones, sonido y momentos de revelación. El vídeo de referencia muestra motion graphics de tipo mission cards, photo result, rank reveal, barras, labels de tracking y overlays. No presupongas que esto exige mundo 3D o Unreal; tampoco presupongas que CSS/Pixi/Three lo hará fácil. Distingue **posibilidad técnica** de **velocidad y calidad de producción**. El material adjunto es referencia visual y de movimiento, no una especificación final bloqueada.

El diseñador/motion artist puede trabajar con Photoshop, Illustrator y After Effects; hemos explorado herramientas creativas de IA como Higgsfield para conceptos, assets y referencias de motion. Investiga un flujo realista para convertir esos diseños en componentes interactivos mantenibles. Aclara qué parte puede transferirse automáticamente y qué parte exige recreación/ingeniería. Considera Rive u otras herramientas de animación si aportan valor, pero no supongas que resuelven por sí solas el editor completo.

## Cómo evolucionó la discusión tecnológica

Presento la historia para evitar que heredemos un sesgo. **Ninguna elección está cerrada.** Algunas recomendaciones previas son hipótesis antiguas, no decisiones.

1. **After Effects como punto de partida creativo.** Puede lograr gran calidad cinematográfica, pero un HUD renderizado en vídeo obliga a modificar y volver a exportar para cambiar contenido, estado y timing. Queremos mantener su posible papel en diseño o momentos especiales sin que sea la fuente de verdad del sistema interactivo.
2. **Unreal Engine.** Fue la primera hipótesis fuerte: UI de juego, render en tiempo real, vídeo, secuenciación, empaquetado y potencial de automatización por agentes/MCP. No queremos que el usuario final abra Unreal Editor. El problema observado al prototipar fue la dificultad de construir un editor propio y ajustar keyframes/timeline de forma cómoda. Investiga sus ventajas reales y el coste de integrar un editor de autoría, reproducción de vídeo precisa y exportación determinista. No lo descartes por principio.
3. **Unity y Godot.** Deben compararse seriamente como motores de juego alternativos, especialmente tooling de UI, motion, vídeo/export, licencias, ergonomía de editor personalizado, scripting y automatización con IA. El producto no necesita un mundo 3D, pero quizá un motor sigue siendo la mejor base.
4. **Stack web/GPU.** Se exploró React/TypeScript para aplicación y editor; PixiJS para HUD 2D/2.5D; Three.js para elementos 3D puntuales; CSS/SVG/Canvas/WebGL/WebGPU, shaders y librerías de motion como GSAP. Un editor de timeline podría ser natural en esta familia, pero habría que construir y verificar media, sincronización, render fuera de pantalla/export y coherencia visual. Evalúa variantes con y sin framework web; no supongas Electron como requisito desde el día uno.
5. **Middleware de UI de juego.** NoesisGUI pareció prometedor porque permite UI de estilo juego sin juego detrás, con XAML, estados y tooling visual. Investiga su SDK/host, autoría, animación, integración con vídeo y exportación; comprueba licencias, condiciones y escalado de costes actuales. **Noesis no es open source.** Coherent Gameface mostró la potencia potencial de HTML/CSS/JS para UI de juego, pero fue apartado provisionalmente por el usuario; vuelve a incluirlo como comparación si aporta una conclusión útil, no como candidato impuesto. Considera RmlUi como opción abierta, teniendo en cuenta que su capacidad de render no demuestra por sí sola un pipeline rápido de diseño AAA.
6. **Qt Quick/QML y otras rutas.** Se mencionaron como posible combinación de aplicación, vídeo, UI, animación y shaders sin motor de juego. Investiga Qt y cualquier alternativa suficientemente madura y relevante, junto con licencias y distribución. No hagas una lista interminable de bibliotecas: selecciona candidatos capaces de cubrir el producto entero mediante una arquitectura creíble.

Quiero una comparación honesta de **motor completo**, **runtime UI de juego + host**, **app UI nativa**, y **stack web/GPU propio**. Diferencia lo que trae cada opción de fábrica, lo que permite con trabajo a medida y lo que no se ha demostrado. Considera también una arquitectura híbrida si resuelve una limitación verificable.

## Contexto de desarrollo con IA

No sé programar de forma tradicional. Yo tomaré decisiones de producto y dirección creativa. Se prevé que el código y buena parte de la investigación/automatización se hagan con **Claude Code y Claude Opus 5.5**, posiblemente junto con Codex/Cursor. Examina esto como una restricción real de producción: legibilidad del stack para agentes, ejemplos/documentación, APIs estables, ciclos de feedback, generación y modificación de assets, pruebas, depuración, automatización del editor, gestión de errores y mantenimiento de una base de código grande.

Investiga las capacidades **actuales y verificadas** de CLI, MCP, SDKs y automatización para los candidatos y para las herramientas creativas que recomiendes. No infieras que una herramienta tiene API/CLI/MCP oficial por haberlo dicho una respuesta anterior. Si alguna integración con Higgsfield, After Effects, Noesis Studio, Unreal, Unity, Qt, Figma u otra herramienta requiere una vía no oficial o manual, dilo claramente. Examina qué puede hacer Claude por código/terminal y qué necesitará interacción visual humana. Valora el coste de licencias y la dependencia de proveedores a largo plazo; prefiero evitar pagos obligatorios o saltos de precio peligrosos si la alternativa abierta permite la misma calidad sin disparar el trabajo.

Documentación duradera y decisiones registradas serán esenciales para que distintos agentes mantengan el proyecto. Los hitos deben ser pequeños y verificables, y cada prototipo debe tener criterios observables de aceptación. No supongas que “vibe coding” elimina el trabajo de arquitectura, QA o dirección artística.

## Preguntas abiertas que debes resolver conmigo

Entre otras: plataforma inicial (Windows u otras), hardware de desarrollo y export, resoluciones/fps/códecs, tolerancia de latencia durante scrub, reproducción con audio, exactitud de frame, si el resultado final será sólo vídeo o también HUD interactivo distribuible, presupuesto actual y futuro, propiedad/licencias de assets, papel del diseñador, número de plantillas/episodios, profundidad del editor visual, tipos de edición de timeline, necesidad de tracking sobre objetos del vídeo, prioridades entre vista previa 4K y export 4K, formato de proyecto, colaboración y posibles necesidades futuras de cuentas/cloud/shop. Distingue requisitos del primer ciclo completo, de producción del primer episodio y de plataforma futura.

## Estructura de tu análisis final, después de mis respuestas

1. Reformulación precisa del producto y requisitos priorizados, con supuestos e incertidumbres.
2. Lectura concreta de los adjuntos: inventario de efectos/interacciones y complejidad, con ejemplos del vídeo/HUD.
3. Mapa de arquitectura por capas: app/editor, runtime HUD, estado, motion, assets, vídeo/audio, timeline, persistencia, export, build/distribución y automatización por IA.
4. Shortlist justificada y matriz comparativa ponderada: calidad visual alcanzable, rapidez de producción visual, editor propio, media/sincronía, render/export, rendimiento, AI/CLI/MCP, madurez, licencias, coste, riesgo y mantenimiento.
5. Análisis profundo de cada finalista, incluyendo capacidades comprobadas, trabajo propio necesario, puntos débiles y rutas de escape/migración.
6. Propuesta de flujo diseñador → assets/motion → implementación con Claude → pruebas visuales → episodio, con tareas que deben seguir siendo humanas.
7. Prototipos de decisión: al menos uno visual AAA representativo y uno completo de vídeo/HUD/Record/timeline/scrub/save/export, con duración estimada, criterios de aceptación y condiciones de descarte.
8. Recomendación principal **condicionada por mis respuestas y la evidencia**, segunda opción y circunstancias que harían cambiar de opción. Señala claramente lo que queda sin demostrar.
9. Fuentes primarias enlazadas y fecha de consulta para hechos cambiantes, especialmente precios, licencias, versiones, APIs, CLI/MCP y soporte de vídeo/export.

Empieza ahora **únicamente con la primera ronda de preguntas clarificantes**. Prioriza las que más cambian la arquitectura y explica brevemente por qué necesitas cada bloque.
