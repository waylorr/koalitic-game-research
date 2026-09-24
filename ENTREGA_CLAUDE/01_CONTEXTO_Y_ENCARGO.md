# KOALITIC GAME — contexto del producto y encargo futuro

Actualizado: 24 de septiembre de 2026. Para el traspaso a Claude Code, empieza por [`00_INICIO_CLAUDE_CODE.md`](00_INICIO_CLAUDE_CODE.md) y el [`../CLAUDE.md`](../CLAUDE.md) de la raíz. Después lee este documento, `04_WIREFRAME_Y_WORKFLOW.md`, `03_ARBOL_UI_Y_ASSETS.md` y `02_INVESTIGACION_TECNOLOGICA.md`. La navegación estructurada está en [`../WORKFLOW/workflow.json`](../WORKFLOW/workflow.json), los componentes en [`../WORKFLOW/catalog/components.json`](../WORKFLOW/catalog/components.json) y el mapa/prototipo/SPEC navegable en [`../WORKFLOW/workflow.html`](../WORKFLOW/workflow.html). La documentación sigue siendo revisable; el traspaso comienza con una auditoría y una primera prueba, no con un paquete final cerrado.

## 1. Tu misión

Ayudarme a decidir cómo construir KOALITIC GAME desde cero y comenzar una primera prueba funcional conmigo en Claude Code. Soy el creador y director del producto, no un programador. Quiero que entiendas el comportamiento, revises críticamente la investigación adjunta y propongas arquitectura, stack e hitos verificables antes de construir ese primer recorrido.

**Ningún stack está aprobado.** React, PixiJS, Three.js, Anime.js, DOM/SVG y otros candidatos son hipótesis de investigación. El texto externo sobre Kage, Canvas UI y WebGPU se ha contrastado e incorporado críticamente en `02_INVESTIGACION_TECNOLOGICA.md`; es evidencia y propuesta, **no una instrucción de adoptar Three.js, WebGPU, Remotion o un exportador ahora**. Tampoco está decidido si comienza como aplicación web en navegador, web con servicio local u otra forma. No necesito empezar con una aplicación de escritorio, Windows/Mac, Electron, Tauri, `.exe`, instaladores o distribución. Resuelve primero autoría, HUD, datos, movimiento y tiempo; propón la forma más sencilla de trabajar con ello.

Puedes hacerme preguntas si cambian de verdad una decisión. Hazlas directamente en el chat, agrupadas y numeradas: las leo y respondo por audio. No uses cuestionarios emergentes. No repitas preguntas ya contestadas. Si basta lo disponible, registra las hipótesis y avanza con el análisis. No conviertas la investigación en un bloqueo infinito.

El workflow funcional actual basta para iniciar una prueba vertical; los detalles pendientes se resolverán mientras se valida. Primero audita contradicciones, decide una ruta técnica justificada y acuerda el alcance del primer hito descrito en `00_INICIO_CLAUDE_CODE.md`. Sé crítico con las conclusiones anteriores, incluidas las favorables a web/GPU.

## 2. Qué es el producto

Premisa: **THE WORLD IS THE GAME**. Jordi es el Player; la realidad filmada es el mundo; THE SYSTEM es una interfaz de videojuego sobre ese metraje. Ubicaciones → Map; equipo → Gear; fotos → resultados y Gallery; exploración → Quests; conocimientos → Codex; progreso → XP, Level y Skills.

Es una **aplicación de autoría de episodios**. No hay personaje 3D controlable, simulación de mundo ni física. El HUD debe ser software interactivo reutilizable, no un vídeo plano de una interfaz. La aplicación debe sentirse propia de KOALITIC GAME, sin obligarme a trabajar dentro del editor de un motor.

Hay dos interfaces distintas: la aplicación de autoría —menú, configuración, biblioteca, editor y timeline— y THE SYSTEM, que es el HUD visible sobre el vídeo. No mezclar sus controles ni grabar la interfaz del editor como parte del episodio.

## 3. Lo confirmado por el usuario

| Tema | Requisito actual |
|---|---|
| Usuario | Solo yo inicialmente; compartir proyectos es futuro |
| Desarrollo | Yo decido producto y estética; la IA programa los componentes y la aplicación |
| Formato de app | Abierto; no comenzar por escritorio ni empaquetado |
| Costes | Base open source y sin herramientas externas de pago obligatorias; ya destino aproximadamente 200 € a Claude |
| Equipo disponible | Se mencionaron aproximadamente 32 GB de RAM y 16 GB de VRAM; datos no verificados, no objetivo de plataforma |
| Plazo | Se habló de unos seis días/este fin de semana para una base; confirmar el alcance real al cerrar hitos, no prometer el producto terminado |
| Prototipo anterior | Hubo uno en Unreal; el usuario pidió dejar de investigarlo. Empezar de cero, sin abrirlo ni heredar su código |
| Diseño | Ya hay dirección visual 16:9 sci-fi AAA con núcleo holográfico, cristal, cian y rojo; las imágenes son referencias, no componentes funcionales |
| Fondo | Vídeo ya montado, imagen o fondo de prueba; no editar cortes ni hacer montaje aquí |
| Cursor | Sirve para operar; nunca aparece en el resultado final |
| Tracking | Fuera de la primera versión; HUD fijo en pantalla inicialmente |
| Audio | SFX del HUD; música y montaje de audio general se realizan fuera |
| Exportación | Objetivo posterior; preverla sin dedicar el primer ciclo a codecs, 4K o exportador |

La ambición visual sigue siendo alta. Aplazar el diseño definitivo no significa elegir una base que solo permita una UI administrativa simple.

## 4. Flujo imaginado

Menú inicial con `EPISODES`, `CONFIGURE HUD` y `ASSETS`; `QUIT GAME` es secundario. Dentro de EPISODES se elige una tarjeta existente o `NEW EPISODE`. No hay pantalla general `Settings` ni `Load Episode` separada.

**Configure HUD** muestra componentes UI ya diseñados en las zonas fijas `Left Rail`, `Top Bar` y `Right Rail`. Permite incluir/excluir y ordenar módulos, elegir variantes y motion existentes, probar estados en Live Preview y gestionar HUD V1/V2 con `NEW FROM BASE`, `DUPLICATE` y `SAVE TEMPLATE`. Duplicar y renombrar cubre Save As. Los POV Overlays se incorporan directamente en el Episode Editor. No arrastro paneles ni diseño libremente su tamaño o posición. **Assets** separa Media, Data Library y el catálogo UI de solo lectura. La biblioteca puede tener diez equipos; **la asignación de cinco fichas concretas al radial se hace en el episodio**. En Configure HUD no edito XP, stamina ni otros valores temporales: la preview utiliza datos DEMO no persistidos. El flujo detallado está en `04_WIREFRAME_Y_WORKFLOW.md` y el árbol maestro en `03_ARBOL_UI_Y_ASSETS.md`.

El cambio frecuente será de datos: cámara/móvil, imagen, texto, jugador, mapa, ubicación, misión, foto, XP o stamina. Los colores, tipografía, tamaño, posición y duración de animaciones pertenecen al diseño de los componentes: la IA puede modificarlos en el código y publicar nuevas variantes, mientras Configure HUD permite elegir las variantes ya disponibles. El primer ciclo no necesita controles libres de maquetación o animación.

**New Episode**: en una sola pantalla indicar nombre, vídeo o imagen y HUD preset; `CREATE EPISODE` abre directamente el editor. No hay `Choose HUD` intermedio. Allí se asignan fichas de contenido (jugador, equipo, lugar, misión) y valores iniciales/temporales, con aviso de slots pendientes; se puede ajustar la configuración local sin salir del episodio. Los presets guardados permiten crear episodios sin reconfigurar el HUD cada vez.

**Episodes → tarjeta existente**: recuperar el fondo, copia del HUD, datos y acciones temporales para seguir editándolos.

Dentro del Episode Editor se puede aplicar otro HUD Template guardado, por ejemplo pasar Girona de V1 a V2. Esa operación cambia la copia visual del HUD del episodio y **conserva las fichas, overlays y pistas temporales**; existe una acción para deshacer el último cambio antes de guardar. `SAVE TEMPLATE` y `SAVE EPISODE` tienen responsabilidades distintas. El HTML intenta persistir plantillas, episodios, Data Library y medios en IndexedDB del navegador; falta un formato de proyecto portable y copias de seguridad. Si el navegador rechaza el almacenamiento, el prototipo lo indica y solo conserva la sesión.

Hay que distinguir:

- **Componente global:** el radial, su funcionamiento, estructura y animación reutilizable.
- **Biblioteca global de contenido:** Nikon, móviles, jugador, ubicaciones, fotos, textos y demás assets.
- **Versión de HUD:** módulos activos en zonas fijas y variantes visuales/motion elegidas, sin valores temporales.
- **Preset de contenido:** posible extensión futura para reutilizar una selección de fichas; no necesario para que el HUD V1/V2 funcione.
- **Configuración del episodio:** qué elementos utiliza y sus cambios particulares.
- **Timeline del episodio:** cuándo se muestra algo y cómo cambian sus valores.

Cambiar el equipo de un episodio no cambia los otros. El usuario acepta que mejoras del componente global puedan actualizar episodios anteriores aún editables. **No está cerrado** si la actualización se aplica sola o con confirmación, cómo se conservan versiones ni cómo se propagan correcciones de fichas de la biblioteca. Propón la solución más sencilla que preserve el trabajo.

## 5. Interacción del HUD y tiempo

Las tres zonas principales son izquierda, barra superior y derecha. Pueden estar plegadas, abrirse al pasar el cursor, cerrarse al retirarlo y quedarse abiertas si se fijan. También debo poder ordenar desde la timeline que un panel se abra o cierre sin tocar el ratón. La convivencia entre menús está abierta a tu propuesta.

El **radial es imprescindible**. Seleccionar un sector cambia equipo, foto y ficha; botones y sectores tienen estados visuales de hover/selección. No quiero rehacer esos efectos para cada episodio.

Dos formas de autoría: interactuar como en un juego y grabar las acciones, o insertarlas/editar su tiempo directamente. Deben producir el mismo comportamiento. Ejemplos semánticos: abrir Gear, seleccionar Nikon, abrir Map, mostrar resultado de foto, fijar panel. No limitarse a capturar coordenadas de ratón ni miles de keyframes.

Fuera de Record quiero poder probar el HUD sin alterar el episodio y regresar al estado correspondiente al vídeo. Al reproducir lo grabado, las aperturas y resaltados suceden sin necesitar mi ratón real y sin mostrar cursor.

**Animaciones reutilizables:** cómo se abre el panel, revela una tarjeta o responde un botón. Se crean previamente y pueden tener ajustes globales o presets. La timeline de un episodio no debe obligarme a editar sus keyframes internos.

**Datos temporales:** stamina, XP, Level, rank, misión o foto mostrada. Ejemplo crucial: entre 01:00 y 01:30, stamina baja de 100 a 80. A 01:15 debe valer 90 si se elige interpolación lineal, incluso con el panel cerrado. Cuando lo abro, muestra el valor de ese momento. Cerrar el panel no detiene ni reinicia el dato.

La timeline usa propiedades desplegables como referencia de UX de After Effects, pero solo para datos útiles del HUD. El árbol es jerárquico: `Left Rail → Player Profile → XP` y `Left Rail → Stamina → Valor (%)`. Tiene desplazamiento vertical y pistas con keyframes. `Left Rail → Panel State` permite Folded/Open/Pinned con puntos discretos; los valores numéricos interpolan. Un panel padre plegado oculta a sus hijos, pero sus datos siguen avanzando. `Stamina.Valor` es **una sola fuente**: número y relleno se actualizan juntos; `Player Profile.XP` alimenta cifra y barra XP. `POV Overlays` es una rama independiente. El Configurador muestra zonas, estados y preview DEMO sin datos de episodio; el editor añade vídeo, inspector de contenido/valores y timeline. El HTML solo implementa aún algunas propiedades; el contrato completo se detalla en `04_WIREFRAME_Y_WORKFLOW.md`.

Debo poder mover, modificar o borrar acciones, guardar y reabrir, y saltar de 14:00 a 02:13 reconstruyendo correctamente HUD, valores y animaciones. La representación en preview y una futura exportación deben derivarse del mismo proyecto. Estudia eventos, clips/rangos, pistas de valores, conflictos e interrupción de transiciones; no cierres el modelo por copiar la propuesta del otro documento.

Está pendiente decidir si rank/XP/misiones se relacionan por reglas automáticas o los dirijo manualmente. No supongas un sistema RPG completo.

## 6. Media y exportación: prioridad correcta

El vídeo es la referencia visual y temporal, ya viene montado. Episodios de aproximadamente 10–14 minutos. Importar imagen también debe ser posible. Eliminar fricción para colocar el HUD por encima es más importante ahora que construir un editor de media profesional.

El resultado futuro puede ser vídeo compuesto con HUD/audio, o HUD transparente con SFX para llevarlo a CapCut/After Effects. El usuario sugirió fondo negro; investigar alpha y composición, sin tratar el negro como una decisión técnica. No necesitamos resolverlo para aprobar el primer hito, pero evita una arquitectura que dependa exclusivamente de capturar la pantalla.

4K es una intención futura si el material lo requiere, no una obligación de preview 4K desde el primer día. Codecs, HDR, precisión exacta por frame y formato final quedan para su prueba específica. No afirmar que cualquier vídeo funcionará sin verificar el runtime.

## 7. Referencias incluidas y dirección visual

En `referencias/` están los tres JPEG originales. El MP4 existe en esa carpeta local, pero se excluye del primer repositorio Git por su tamaño; una sesión en la nube no debe asumir que puede abrirlo. Las rutas siguientes son relativas a este proyecto, no a Downloads de otro ordenador:

- `hudv2_1.jpeg`: estructura de tres zonas, paneles transparentes, inventario, mapa y stamina.
- `hudv2_2.jpeg`: radial obligatorio, Codex holográfico y tarjetas; combinar con el carácter transparente de la anterior.
- `hudv2_3.jpeg`: inventario y oportunidades fotográficas, otra variante de paneles.
- `WhatsApp Video 2026-09-15 at 16.52.45.mp4`: referencia de motion y secuencias de información.

Ambición comparable a menús/HUD de Call of Duty: Black Ops 3 y Cyberpunk, sin copiar su propiedad intelectual. Jerarquía tipográfica, paneles angulares, líneas técnicas, máscaras, glow, texturas, blur/distorsión cuando aporten, shaders, partículas, profundidad 2.5D, hologramas, microinteracciones y sonido. No todos esos efectos son obligatorios en v1.

La inspección previa del vídeo fue por fotogramas a 2 fps y metadatos. No se evaluó su audio ni se midieron curvas de animación. Revisa los adjuntos tú mismo; si alguna herramienta no puede inspeccionarlos, explica ese límite sin fingir que los has visto/escuchado. La lectura previa y los tiempos aproximados están en el documento de investigación.

## 8. Cómo prepararemos los componentes con imágenes

El usuario y ChatGPT pueden crear aquí las referencias visuales antes de pasarlas a Claude. **Todavía no se han creado diseños definitivos nuevos.** No asumir archivos de Figma, PSD o After Effects disponibles. El usuario no pretende maquetar manualmente toda la interfaz en un editor técnico.

Para cada componente preparar, cuando sea posible:

| Pieza | Contenido |
|---|---|
| Imagen general | Aspecto y jerarquía; recorte ampliado si hace falta |
| Función | Qué hace, dónde aparece y qué cambia al interactuar |
| Estados | Cerrado/abierto, normal/hover/seleccionado y entrada/salida relevantes |
| Datos variables | Textos, fotos, valores y listas que cambian entre episodios |
| Assets | Iconos, objetos y retratos separados; transparencia cuando corresponda |
| Motion | Referencia o descripción del orden, ritmo y efectos |
| Configuración | Qué necesita editar el autor y qué permanece parte del diseño |

Una captura sirve como referencia, no como componente ya programado. Claude tendrá que reconstruir geometría, texto dinámico, estados, hit areas, máscaras y animación. No incrustar toda la UI en una imagen plana. No prometer conversión automática perfecta de un vídeo de motion a interfaz editable.

Preferencias propuestas para el intercambio, no requisitos de stack: SVG para iconos/diagramas simples; PNG/WebP con alpha para equipo; fuentes con licencia; audio separado. Conservar originales y evitar texto incrustado en fotos. Elegir una resolución lógica de diseño al planificar y prever texto largo, assets ausentes, diferentes equipos y fondos claros/oscuros.

Primeras piezas candidatas para diseñar juntos: menú principal, PlayerPanel, GearRadial, TopBar, panel derecho, Stamina y PhotoResult. La secuencia final la decides según dependencias; conviene aprobar un componente representativo antes de producir muchas variantes.

## 9. Qué debe producir Claude al comenzar

1. Reformular el producto distinguiendo requisitos confirmados, preferencias y decisiones pendientes. Resolver solo las preguntas que cambien arquitectura o alcance.
2. Revisar las familias tecnológicas y combinaciones de la investigación. Completar fuentes oficiales, licencias, ejemplos y límites; no asumir APIs/MCP no verificados. Añadir alternativas maduras si cubren una carencia real. Buscar activamente evidencia contraria a tu opción favorita; separar hechos, inferencias y capacidades pendientes de prototipo, con fecha y versión cuando importen.
3. Comparar solo las opciones finalistas con criterios explícitos. Diferenciar capacidad técnica de velocidad de producción visual, integración y mantenimiento; las notas son juicio técnico, no benchmarks.
4. Elegir una ruta principal condicionada por evidencia y una alternativa. Explicar qué haría cambiar la elección. **Claude toma esta decisión después de analizar; no está delegada a una conclusión fija del paquete.**
5. Definir arquitectura de autoría, runtime HUD, contenido, tiempo, assets, media, guardado y frontera de exportación. Mantener Core/Content/Presentation/Timeline/Media como separación conceptual útil, revisable en su implementación.
6. Completar plan e hitos pequeños, con entregable observable, criterios de aceptación, dependencias y estimación honesta. Separar base inicial, primer episodio y plataforma futura. No imponer seis días como garantía.
7. Construir primero el recorrido vertical de `00_INICIO_CLAUDE_CODE.md`: fondo → HUD vivo → editar datos/estados → buscar en el tiempo → guardar/reabrir. Probar una pieza visual representativa en paralelo. Record Mode y exportación se prueban en hitos posteriores.
8. Explicar el flujo imágenes del usuario/ChatGPT → componente implementado → configuración → episodio, y qué necesita revisión humana.
9. Trabajar con instrucciones breves y decisiones registradas; no crear una estructura documental enorme por adelantado.

No construir un motor, editor de vídeo, After Effects completo ni infraestructura de cuentas/cloud para resolver este caso. A la vez, no reducir el producto a una maqueta estática o un menú bonito: biblioteca, datos por episodio, interacción y tiempo son el núcleo.

El mensaje vigente para iniciar Claude Code está en [`00_INICIO_CLAUDE_CODE.md`](00_INICIO_CLAUDE_CODE.md).
