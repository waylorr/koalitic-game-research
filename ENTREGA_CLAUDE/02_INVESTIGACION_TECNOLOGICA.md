# KOALITIC GAME — investigación tecnológica abierta

Fecha de consulta: 24 de septiembre de 2026. Leer después de **01_CONTEXTO_Y_ENCARGO.md** y contrastar el alcance con `../WORKFLOW/workflow.json` y `../WORKFLOW/catalog/components.json`. Este documento conserva evidencias y propuestas de una investigación previa; **no es una decisión de stack ni una orden de implementar**. Primero se cierra el workflow funcional; después Claude podrá completar lagunas tecnológicas y planificar la implementación con el usuario.

**Actualización de alcance:** el HTML actual (`../WORKFLOW/workflow.html`) demuestra separación entre Data Library, UI Components, HUD Template y Episode, y una timeline jerárquica con pistas discretas y numéricas para un subconjunto de módulos. Es una prueba de UX hecha con HTML/CSS/JavaScript, **no evidencia de que DOM, React, PixiJS o Three.js sean ya el stack ganador**. La decisión tecnológica deberá probar sincronización vídeo/tiempo, persistencia, reproducibilidad del estado, motion de calidad y escalabilidad visual. El Flow Map se mantiene temporalmente sin cambios mientras se revisan Prototype y Spec.

El prototipo ahora divide sus fuentes por catálogo, componentes, datos, timeline, vistas, controladores y guardado local. Intenta guardar una instantánea en IndexedDB, incluidos medios importados, y recuperar episodios al recargar el mismo origen. Es una solución de **mesa de trabajo**, no una prueba de portabilidad, cuotas suficientes para vídeos largos ni formato de proyecto final. El cambio de HUD en un episodio conserva datos y pistas al sustituir solo el aspecto.

## 1. Punto de partida y corrección de alcance

La investigación previa favorecía TypeScript + React + PixiJS 8 + Anime.js 4 y añadió Electron demasiado pronto. El usuario corrigió expresamente esa conclusión: **no hace falta una aplicación de escritorio ni elegir Windows/Mac, .exe o instalador ahora**. La forma de ejecutar y guardar la aplicación está abierta. Electron y Tauri quedan como opciones futuras o justificadas por una necesidad concreta, no como hitos iniciales obligatorios.

Separar tres decisiones: tecnología de autoría/configuración; runtime gráfico y motion del HUD; forma de ejecución/persistencia. Elegir PixiJS no obliga a Electron, elegir React no obliga a un servidor remoto y utilizar navegador no obliga a subir el vídeo a la nube.

El objetivo es analizar familias y combinaciones relevantes que cubran el producto completo. No es un inventario literal de todas las bibliotecas existentes ni una comparación experimental exhaustiva. Las tecnologías menos estudiadas y los límites no probados se indican; Claude debe ampliar donde pueda cambiar la decisión.

**Evidencia disponible:** documentación y licencias oficiales, inspección de imágenes y secuencias del vídeo. Se añadió el texto externo facilitado por el usuario sobre Kage, Three.js, Canvas UI, WebGPU y exportación; se contrastaron sus afirmaciones principales con fuentes primarias. **No disponible:** prototipo del nuevo stack, benchmarks, calidad AAA validada, exportación verificada o pruebas comparables entre candidatos. Las estimaciones y preferencias del investigador son hipótesis, no resultados. No se ha inspeccionado aquí el vídeo de Meng To citado por ese texto; el caso Kage se contrastó con su repositorio público.

## 2. Lectura de las referencias

### Imágenes

Las tres imágenes muestran una misma familia visual: marcos angulares, paneles oscuros translúcidos, líneas técnicas finas, tipografía compacta, acentos cian/rojo y contraste reservado para alertas o progreso. El centro deja visible la localización.

| Referencia | Elementos útiles | Implicación técnica |
|---|---|---|
| hudv2_1 | Player, inventario, stamina, top bar, misión y mapa | Componentes compuestos, datos distintos dentro de una estructura estable |
| hudv2_2 | Radial, Codex con edificio holográfico, aviso de superficie | Hit testing por sectores; máscaras; ilustración o efecto holográfico independiente |
| hudv2_3 | Inventario y oportunidades fotográficas | Listas de contenido, tarjetas reutilizables y variaciones de skin |

El usuario quiere especialmente el radial de hudv2_2 y la transparencia/estructura de hudv2_1. Las imágenes no fijan la UI final. Un edificio wireframe estático no requiere geometría 3D: puede empezar como un asset transparente con revelación y líneas animadas. Solo introducir 3D real si se necesita rotación o perspectiva que una ilustración no pueda representar.

### Vídeo

Archivo inspeccionado: WhatsApp Video 2026-09-15 at 16.52.45.mp4. Metadatos obtenidos con FFmpeg: 41,38 s, 3840×2160, 30 fps, H.264 y pista AAC estéreo. Se revisaron secuencias extraídas a dos fotogramas por segundo a lo largo del clip. Esto permite identificar etapas y composición; no permite certificar curvas subfotograma, suavidad de reproducción ni calidad sonora. No se ha evaluado auditivamente la pista.

Tiempos aproximados, usados como localizadores, no como mediciones exactas:

| Tramo | Observación | Componente reutilizable |
|---|---|---|
| 00–05 s | Barras superiores y tarjeta de misión que se construye y desaparece | PlayerStatus, Stamina, QuestCard; entrada y salida por fases |
| 05–09 s | Etiqueta de equipo durante la toma | GearLabel con datos e icono |
| 09–15 s | Foto vertical, información, rango B y barras de evaluación revelados por etapas | PhotoResult compacto |
| 16–20 s | Foto mayor, tarjeta lateral con rango C y estadísticas | Otro layout del mismo PhotoResult |
| 20–26 s | Escala horizontal de rangos con énfasis cambiante | RankScale con selección y brillo |
| 28–32 s | Etiquetas asociadas visualmente a una persona | Referencia de estilo; tracking fuera de v1 |
| 34–40 s | Tarjetas de rangos, resaltado sucesivo y desaparición | RankGallery / secuencia de revelación |

El vídeo aporta más información sobre secuenciación que las imágenes: no basta con aparecer/desaparecer. Hay un orden de entrada de contenedor, imagen, título, rango y barras. Debe existir una animación reutilizable por componente con parámetros de contenido. El verde del vídeo es referencia de comportamiento, no un cambio obligatorio de la paleta de los HUD.

## 3. Comparación y evidencias

### Web/GPU: React + PixiJS + Anime.js

**Comprobado:** PixiJS ofrece WebGL/WebGPU, textos, primitivas/SVG, máscaras, filtros, texturas e interacción. Su licencia es MIT. Son las piezas necesarias para paneles angulares, radial, recortes de fotos y efectos; no incluye el editor de episodios. [Introducción PixiJS](https://pixijs.com/8.x/guides/getting-started/intro), [licencia](https://github.com/pixijs/pixijs/blob/dev/LICENSE).

Los filtros permiten efectos sobre objetos renderizados, con costes y límites que deben medirse; los eventos permiten interacción de puntero e hit areas. No asumir que un filtro sobre canvas desenfoca automáticamente un vídeo HTML situado detrás. [Filtros](https://pixijs.com/8.x/guides/components/filters), [eventos](https://pixijs.com/8.x/guides/components/events).

Anime.js anima propiedades de objetos JavaScript y permite buscar una posición de timeline silenciando callbacks. Su licencia MIT evita depender de las condiciones particulares de GSAP. Esta capacidad no convierte por sí sola una aplicación con estado mutable en determinista. [Objetos animables](https://animejs.com/documentation/animation/animatable-properties/javascript-object-properties/), [seek](https://animejs.com/documentation/timeline/timeline-methods/seek/), [licencia](https://github.com/juliangarnier/anime/blob/master/LICENSE.md).

**Trabajo propio:** biblioteca, presets, estado, autoría, timeline visual, tratamiento de eventos, evaluación temporal, guardado, render de componentes y exportador futuro. React resuelve composición del editor, no el motor del HUD. No usar un estado React por cada frame de animación.

**Riesgos:** efectos costosos a 4K; textos y assets de baja calidad; canvas sin selectores DOM por elemento; animaciones que dependen de reproducción secuencial; sincronización imperfecta del vídeo. Una captura de diseño no se convierte automáticamente en componentes mantenibles.

**Hipótesis del investigador anterior:** para un autor individual guiando a una IA por archivos y pruebas, esta ruta podría ofrecer el mejor equilibrio de iteración y control. No hay una medición que demuestre que Claude produce mejor código aquí que en QML o Godot; es una valoración pendiente de contraste, no una decisión del usuario.

### Variante web sin PixiJS

React + CSS/SVG + Anime.js puede cubrir paneles, textos, radial y gran parte del motion. Tiene ventajas reales: formularios y texto nativos, inspección DOM y menos capas gráficas. También permitiría una primera demostración convincente.

La investigación anterior favorecía PixiJS frente a esta variante porque se prevén muchas composiciones con máscaras, texturas, filtros, partículas y una superficie de HUD independiente del editor. Esa preferencia anterior es arquitectónica, no una afirmación de que CSS sea incapaz de alcanzar calidad alta. La prueba visual debe incluir un panel en SVG/CSS como control si el texto o el blur de Pixi resulta problemático. Evitar duplicar el mismo componente en DOM y canvas en producción.

WebGL propio es otra posibilidad, pero supone implementar demasiados fundamentos. Three.js también puede asumir **todo el renderer visual del HUD**, no únicamente un módulo 3D; esa alternativa se compara a continuación. No es una dependencia demostrada del radial.

### Web/GPU: Three.js como renderer de THE SYSTEM

El texto aportado presenta una arquitectura de editor web + motor de estado temporal + HUD renderizado con Three.js. Es una **candidata principal para prueba**, al mismo nivel que la variante PixiJS/2D, no un stack ya aprobado. El ejemplo [Kage de Meng To](https://github.com/MengTo/kage/blob/main/README.md) combina Three.js, HTML/CSS e imágenes transparentes para una experiencia visual elaborada; usa Three.js r149 con WebGL. Demuestra una dirección artística viable en web, **no** un constructor de HUD reutilizable, timeline, scrubbing ni exportación. Su repositorio indica que no concede licencia para reutilizar su código o arte; estudiar técnicas no autoriza copiarlo.

[Three.js `WebGPURenderer`](https://threejs.org/manual/pages/webgpurenderer) puede usar WebGPU y volver a WebGL 2; TSL permite expresar materiales para ambos backends. Hay que comprobar cada efecto en los dos, no inferir paridad de una API común. La propia documentación califica al renderer de **experimental** y advierte que puede faltar funcionalidad o rendir peor que `WebGLRenderer` según la escena. `ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile()` y el antiguo `EffectComposer` no se trasladan sin adaptación: el camino nuevo emplea nodos/TSL y su [pipeline de postprocesado](https://threejs.org/manual/pages/webgpu-postprocessing.html). Por eso WebGPU no debe ser un requisito del primer HUD; WebGL 2 es una base suficiente para intentar el look y medirlo.

Three.js puede aportar cámara ortográfica, planos en 2.5D, geometría, modelos, partículas, wireframes, máscaras y postprocesado dentro de un solo scene graph. Eso evita sumar PixiJS y Three.js de entrada. **Inferencia a validar:** para HUDs con mucho texto, tarjetas, recortes, radial e inspección de componentes, PixiJS o DOM/SVG pueden resultar más sencillos. Three.js no proporciona biblioteca de assets, fichas de datos, constructor visual, data binding, eventos semánticos, timeline ni guardado. Todo ello sigue siendo trabajo propio con cualquiera de los renderers.

La elección no debe decidirse por una demo espectacular aislada. Construir el **mismo fragmento** del HUD v2 en Three.js y en PixiJS o DOM/SVG: radial de cinco slots con estados reales, panel angular plegable, texto largo, avatar/foto, stamina temporal, un efecto holográfico y vídeo de fondo. Medir aspecto, legibilidad, coste de crear la segunda y tercera variante, hit areas, integración con inspector, rendimiento y reproducción al buscar tiempos. Si Three.js gana en calidad y velocidad de iteración sin complicar el contenido 2D, puede ser el renderer principal. Si no, reservarlo para 3D genuino o prescindir de él.

### Canvas UI y otras bibliotecas de efectos

[Canvas UI](https://canvasui.dev/docs) ofrece efectos copiables en React, Vue, Svelte, Solid, Preact y TypeScript puro, con versiones WebGL/WebGPU. Glitch, reveal, dither y otros efectos pueden inspirar microinteracciones del HUD. Su propia documentación indica que buena parte del render sobre HTML usa `html-in-canvas`, una función experimental de Chrome en origin trial; sin ella el contenido vuelve a HTML normal y parte del efecto no se reproduce. Hay efectos puramente shader/3D que no dependen de esa API. Por tanto, tratar cada efecto como **spike opcional**, con fallback visual aceptable, no como base del constructor ni de una futura salida reproducible. [Introducción](https://canvasui.dev/docs), [renderizado y fallback](https://canvasui.dev/docs/rendering).

La [licencia de Canvas UI](https://github.com/DavidHDev/canvas-ui/blob/main/LICENSE.md) se titula «MIT + Commons Clause» y restringe vender, sublicenciar o redistribuir los componentes por separado, en bundle o portados. Aunque permite incluirlos en una aplicación bajo condiciones, **no es MIT sin restricciones ni una licencia open source estándar**. Si se usa código concreto, revisar su licencia y el modo de distribución; recrear una idea visual desde cero no implica copiar ese código. No introducir Canvas UI como dependencia obligatoria.

### Godot

**Comprobado:** motor MIT con UI, escenas, animación y shaders; AnimationPlayer incluye bibliotecas de animación y búsqueda temporal. Su CLI permite automatizar ejecución y exportación. Hay un repositorio oficial de demos para estudiar patrones. [Licencia](https://godotengine.org/license/), [AnimationPlayer](https://docs.godotengine.org/en/stable/classes/class_animationplayer.html), [CLI](https://docs.godotengine.org/en/stable/tutorials/editor/command_line_tutorial.html), [demos](https://github.com/godotengine/godot-demo-projects).

**Limitación concreta:** el vídeo integrado admite Ogg Theora, decodificado por CPU; otros formatos requieren extensiones. No tratar cargar el MP4 de referencia como una capacidad integrada ya resuelta. [Vídeo en Godot](https://docs.godotengine.org/en/stable/tutorials/animation/playing_videos.html).

**Trabajo propio:** crear la aplicación de autoría distribuible, catálogo, importación de assets, timeline de episodio y persistencia. AnimationPlayer es una herramienta útil para construir componentes; no entrega automáticamente una timeline de autoría para el usuario de la aplicación exportada.

**Ventaja:** escenas anidadas y animación visual resultan naturales para un HUD. **Coste:** gestionar además la integración de vídeo habitual y mantener una UI de editor propia. Como el usuario no quiere trabajar personalmente en un editor de motor, parte de esa ventaja visual pierde peso.

Godot ganaría peso si el prototipo visual demuestra una mejora material de calidad/velocidad y el fondo se acepta como imagen o proxy convertido inicialmente. Migrar exigiría rehacer presentación/editor, pero los datos declarativos del episodio podrían importarse.

### Qt Quick / QML

**Comprobado:** Qt Quick proporciona componentes, modelos, animaciones, partículas y shaders; QML puede extenderse con C++. Qt Quick se ofrece bajo licencias libres y comerciales. Revisar licencias por módulo al distribuir, no asumir que todo Qt tiene condiciones idénticas. [Qt Quick 6.11.2](https://doc.qt.io/qt-6/qtquick-index.html).

MediaPlayer integra vídeo y QQuickRenderControl permite dirigir render a un destino fuera de pantalla. Eso acredita una base técnica, no un exportador audiovisual terminado. Hay herramientas de análisis QML como qmllint. [MediaPlayer](https://doc.qt.io/qt-6/qml-qtmultimedia-mediaplayer.html), [RenderControl](https://doc.qt.io/qt-6/qquickrendercontrol.html), [qmllint](https://doc.qt.io/qt-6/qtqml-tooling-qmllint.html).

**Trabajo propio:** timeline, composición de HUD, biblioteca y editor personalizado; puente de modelos/QML y backend. **Inferencia:** es una opción madura para una aplicación nativa, pero introduce QML y normalmente C++/otro host sin una ventaja decisiva para este creador. No es menos capaz visualmente por ser una tecnología de aplicaciones.

### RmlUi + host

**Comprobado:** biblioteca C++ con sintaxis inspirada en HTML/CSS y licencia MIT. Ofrece render e integración mediante interfaces del host; no equivale a Chromium ni trae una aplicación de medios. [Repositorio](https://github.com/mikke89/RmlUi), [integración de render](https://mikke89.github.io/RmlUiDoc/pages/cpp_manual/interfaces/render.html).

Permite UI de juego sin motor completo. A cambio hay que resolver ventana, render backend, media, persistencia, tooling y autoría. Su interés aumentaría con un host C++ existente o un desarrollador especialista; para empezar desde cero es más integración de la necesaria. Un resultado gráfico atractivo no prueba un flujo rápido de producción de decenas de componentes.

### NoesisGUI y Gameface

Noesis tiene animaciones XAML mediante Storyboards y keyframes; es una tecnología pertinente para UI reutilizable. Su tarifa Indie publicada es 195 € por proyecto, con límites de ingresos/presupuesto; la página pide consultar proyectos no gaming. No corresponde asumir esa tarifa como cotización para esta app. Es software propietario. [Animación](https://www.noesisengine.com/docs/Gui.Core.AnimationTutorial.html), [tarifas](https://www.noesisengine.com/licensing.php), [EULA](https://www.noesisengine.com/legal/eula.php).

Gameface ofrece UI mediante tecnologías web e integraciones en motores. Su licencia se cotiza por título/plataforma; no hay precio universal que pueda presupuestarse aquí. [Producto](https://www.coherent-labs.com/products/coherent-gameface/), [precio](https://coherent-labs.com/pricing/).

Ambos exigirían host y editor de episodios. No encajan con la exigencia actual de open source y cero herramientas externas de pago; se conservan como comparación de capacidades, no como recomendación de compra.

### Unity y Unreal

Unity ofrece UI Toolkit y UI Builder, pero sigue siendo una base propietaria con condiciones de elegibilidad. Su editor visual de UI tampoco constituye la aplicación de autoría final. [UI Toolkit](https://unity.com/blog/engine-platform/ui-toolkit-at-runtime-get-the-breakdown), [planes actuales](https://unity.com/products).

No se continúa la investigación de Unreal ni del prototipo existente, por instrucción expresa del usuario. No se le asigna una puntuación fingida ni se concluye que no sirve porque tenga 3D. Simplemente queda fuera de la nueva decisión.

### Rive y GSAP como complementos

Rive separa runtimes abiertos de su herramienta de autoría. Su página anuncia exportación .riv en planes de pago; por tanto no se hace depender el flujo gratuito de Rive. [Precios](https://rive.app/pricing), [cambio de planes](https://rive.app/blog/rive-s-new-9-mo-plan).

GSAP permite uso comercial sin coste, pero bajo licencia propia que restringe determinados productos de autoría visual competidores. No afirmo que KOALITIC incurra en esa restricción; sí que no cumple nuestro criterio de dependencia MIT/Apache equivalente sin esa incertidumbre. Anime.js es una alternativa a estudiar para evitar esa incertidumbre. [Licencia oficial GSAP](https://gsap.com/community/standard-license/).

## 4. Combinaciones que Claude debe contrastar

| Combinación | Qué aporta | Qué hay que construir / principal contrapartida |
|---|---|---|
| Navegador + React/TypeScript + DOM/CSS/SVG + Anime.js | Editor y HUD con texto y elementos inspeccionables; iteración sencilla | Efectos complejos y futura salida del HUD requieren prueba; no declarar CSS incapaz de calidad alta |
| Navegador + React/TypeScript + PixiJS + Anime.js | Editor de datos separado de una escena gráfica con máscaras y filtros | Puente editor/renderer, interacción del canvas, tipografía y evaluación temporal propios |
| Navegador + UI de autoría web + Three.js `WebGLRenderer` | Un scene graph para HUD 2D/2.5D y 3D puntual; tecnología madura para primer spike visual | Más infraestructura propia para texto/layout/hit testing de HUD; evaluar legibilidad y rapidez de producir muchas variantes |
| Navegador + UI de autoría web + Three.js `WebGPURenderer`/TSL | Mismo planteamiento con nodos, shaders y postprocesado moderno; fallback WebGL 2 | Renderer aún experimental; validar materiales, efectos y rendimiento en ambos backends; no imponer WebGPU desde el inicio |
| Navegador + TypeScript sin React + PixiJS o DOM/SVG | Menos framework y control directo | Más infraestructura propia para formularios, listas, inspector e historial al crecer |
| Interfaz web + servicio local mínimo | Mismo HUD web, acceso controlado a archivos/procesos locales | Arranque y mantenimiento de dos partes; justificarlo por guardado/media real, no por costumbre |
| Web/Pixi + Three.js para un módulo concreto | Geometría 3D o perspectiva real cuando se necesite | Sincronizar renderers, recursos y composición; no añadir por un holograma que pueda ser imagen |
| Cualquiera de las variantes web + efecto aislado de Canvas UI | Posible aceleración de una microinteracción llamativa | Dependencia experimental de `html-in-canvas` en muchos efectos y licencia Commons Clause; valorar caso por caso |
| Godot + Control/escenas + AnimationPlayer + shaders | Entorno integrado de UI y motion con licencia MIT | Editor propio de episodios y vídeo habitual mediante conversión/extensión |
| Qt Quick/QML + backend mínimo + Qt Multimedia | UI declarativa, modelos, vídeo y render nativo | Especialización y decisiones de host/licencias; no es una razón para fijar escritorio antes de tiempo |
| RmlUi + host C++ | UI de estilo HTML/CSS sin un motor completo | Ventana, backend gráfico, media, editor y persistencia necesitan integración |
| NoesisGUI + host / Unity + UI / Gameface + host | Tooling e interfaces de juego relevantes para comparación | Base propietaria y condiciones de licencia; no cumplen la ruta completamente abierta solicitada |
| Ruta web + Electron o Tauri, posteriormente | Integración de escritorio si aparece una necesidad demostrada | Empaquetado, permisos y runtime adicionales; opcional, fuera del primer objetivo |

React no está cerrado: Claude puede valorar otra capa de aplicación si reduce complejidad con pruebas. Tampoco está cerrado que el HUD viva por completo en un canvas: DOM/SVG, PixiJS y Three.js deben competir con el mismo diseño y los mismos datos. Canvas 2D o WebGL/WebGPU directo son posibles, pero exigen justificar por qué construir primitivas propias mejora el caso frente a un renderer existente. Un híbrido solo merece añadirse para resolver una limitación concreta.

### Navegador: persistencia antes de elegir un contenedor

Tres opciones a evaluar, sin asumir una como aprobada:

1. Selección/importación de archivos más guardado descargable del proyecto. Simple para comenzar, pero decidir cómo se conservan assets y cómo se vuelve a vincular el vídeo.
2. File System Access para trabajar con archivos/carpetas elegidos por el usuario. Requiere permisos, contexto seguro, gesto de usuario y comprobación de soporte. No presupone acceso a rutas arbitrarias ni portabilidad entre todos los navegadores. [Documentación de Chrome](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).
3. Almacenamiento del origen —por ejemplo IndexedDB/OPFS— para biblioteca y recuperación, con salida explícita de backup/portabilidad. OPFS no es una carpeta normal visible para el usuario y está sujeto a cuotas; borrar datos del sitio lo elimina. Solicitar persistencia no equivale a una copia de seguridad ni garantiza concesión. [OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system), [persistencia](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist).

Una app servida localmente puede usar estas APIs sin distribuir un ejecutable. Un servicio local propio puede facilitar archivos más adelante, pero aumenta integración. Claude debe decidir cómo se inicia, dónde guarda, cómo reabre y cómo recupera el trabajo antes de declarar resuelta la biblioteca. Un servidor de desarrollo no debe confundirse con una experiencia final de uso ya entregada.

Electron incorpora Chromium y Node; Tauri usa WebView2 en Windows y otros webviews según plataforma. Son alternativas para necesidades nativas futuras, no requisitos. [Electron](https://www.electronjs.org/docs/latest), [Tauri](https://v2.tauri.app/reference/webview-versions/). Si alguna acaba elegida, revisar límites de acceso a archivos y seguridad del puente; no hacerlo antes de justificarla.

### Cómo decidir sin una puntuación heredada

No se conserva como veredicto la matriz numérica anterior: era valoración del investigador, no benchmark, y daba por supuesto un contexto desktop ahora corregido. Claude debe fijar pesos y justificar notas, considerando:

- Calidad visual alcanzable y velocidad de producir/iterar muchos componentes consistentes.
- Configurador, biblioteca, timeline y facilidad de edición de datos.
- Modelo temporal, scrubbing y persistencia fiables.
- Flujo real con agentes: archivos, CLI, pruebas, inspección visual y errores recuperables.
- Licencias, pagos, dependencia de proveedores y coste de mantenimiento.
- Vídeo como referencia y ruta futura de exportación, con peso menor en la primera fase.

Hipótesis favorable de la investigación: la familia web evita construir muchas herramientas de aplicación desde un host gráfico. Objeción: el HUD complejo aún necesita ingeniería, pruebas de canvas, tipografía y motion; los motores o QML pueden ser más productivos para ciertas composiciones. Comparar una misma muestra visual, no demos diferentes con distinto nivel de acabado.

### Costes y versiones

React, PixiJS, Three.js, Anime.js y Vite publican MIT; TypeScript Apache 2.0. Electron también publica MIT, pero no es dependencia seleccionada. Canvas UI tiene Commons Clause, y Remotion licencia propietaria/source available; ninguno cumple una lectura estricta de «dependencias open source sin restricciones». Comprobar transitivas y avisos al fijar versiones. Las familias estudiadas incluyen PixiJS 8, Anime.js 4 y documentación Qt Quick 6.11.2; no se ha creado un lockfile ni validado una combinación concreta. [React](https://github.com/react/react/blob/main/LICENSE), [Three.js](https://github.com/mrdoob/three.js/blob/master/LICENSE), [Vite](https://github.com/vitejs/vite/blob/main/LICENSE), [TypeScript](https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt), [Electron](https://github.com/electron/electron/blob/main/LICENSE), [Canvas UI](https://github.com/DavidHDev/canvas-ui/blob/main/LICENSE.md), [Remotion](https://www.remotion.dev/docs/license/faq).

Cero coste de licencia de una librería no significa cero trabajo ni generación de arte gratuita. Claude es una herramienta comercial externa al runtime de la app, ya prevista por el usuario. No hay datos suficientes para dar una cotización exacta de integración o mantenimiento. Los precios propietarios citados son los publicados al consultar, no una oferta para este producto; revisarlos si se reconsideran.

## 5. Arquitectura conceptual y alternativas de implementación

Estas capas vienen del contexto del producto; no obligan a un lenguaje ni a dividirlo en múltiples servicios:

| Capa | Necesidad del producto | Decisión pendiente |
|---|---|---|
| Autoría | Menú, Configure HUD, Assets, inspector, timeline | Framework/UI y distribución de pantallas |
| Core | Reglas, selección, estado y comandos | Modelo de datos y reglas manuales/automáticas |
| Content | Equipos, player, misiones, fotos, mapas | Esquemas, referencias, copia y actualización |
| Presentation | Componentes, skin y motion | Renderer, presets y composición |
| Timeline | Cuándo cambian estados/valores | Eventos, pistas, clips, conflictos y evaluador |
| Media | Fondo y SFX | Carga, reloj, codecs iniciales y sincronía |
| Persistencia | Biblioteca, presets y episodios recuperables | Archivos, almacenamiento del navegador o backend |
| Export futuro | HUD solo o composición terminada | Adaptador y prueba posterior |

### Propuesta temporal a evaluar

Una función conceptual `evaluar(proyecto, tiempo)` devuelve el estado y la presentación, sin depender del ratón actual ni de haber reproducido desde cero. Es una propuesta fuerte para cumplir scrubbing y futura exportación, no una API aprobada.

Separar acciones persistentes —abrir/fijar panel, elegir equipo—, valores temporales —stamina y XP— y clips de duración —notificación, resultado de foto—. Mantener las animaciones de componentes aparte de los datos de cada episodio. Un cambio de valor debe existir aunque su panel no esté renderizado.

El wireframe revisado exige un **esquema de propiedades por tipo de componente** que sirva al Configurador fijo, al inspector del episodio y a la timeline. Cada propiedad declara tipo, rango/reglas, si admite cambios por episodio y si es animable como curva, evento discreto o clip. El Configurador solo activa módulos en zonas previstas y selecciona variantes visuales/motion previamente implementadas; su preview usa fixtures DEMO no persistidos. No se construye un maquetador visual general ni un inspector de diseño libre. Los valores iniciales y temporales se crean en el episodio. Las representaciones derivadas no son pistas independientes: `Stamina.Valor (%)` alimenta número y relleno de barra; `Player Profile.XP` alimenta cifra y barra XP. El árbol tiene parentesco real: `Left Rail` oculta visualmente a sus hijos cuando se pliega, pero el evaluador mantiene sus valores. Los overlays POV tienen una rama independiente. Seleccionar la misma instancia desde preview, árbol o timeline debe resolver el mismo ID y la misma procedencia del dato. Esta necesidad es independiente del renderer elegido; implementarla solo como estados visuales de React, PixiJS o Three.js dificultaría guardar, buscar y reabrir.

Resolver antes de implementar: apertura interrumpida por cierre, eventos con el mismo tiempo, edición de eventos anteriores, valores antes/después de una curva, sonidos durante seek y modificaciones globales. No usar callbacks que suman XP cada vez que se reconstruye una animación. Los resultados aleatorios visuales necesitan semilla/tiempo si deben repetirse.

Snapshots e índices son optimizaciones posibles, no requisitos iniciales. Primero probar un evaluador sencillo. Una librería con método seek no garantiza determinismo si lee estados anteriores mutables. Lo mismo se aplica a una timeline de motor: no equivale a una timeline de episodios ya construida para el usuario.

### Biblioteca y versiones: propuestas, no acuerdos cerrados

Propuesta del investigador: biblioteca global + presets reutilizables + contenido resuelto por episodio, conservando IDs de procedencia. Evita que cambiar una Nikon en un episodio modifique los demás. Otra opción es referencias compartidas con overrides; comparar sencillez, consistencia y conservación del trabajo.

El diseño de componentes sí es común. Definir qué actualiza globalmente y qué queda guardado con el episodio. No atribuir al usuario una política concreta de snapshots, migraciones o confirmaciones que no ha elegido.

### Mantener el primer editor pequeño

Empezar por acciones, rangos y puntos de valores que el autor pueda mover, borrar y ajustar, en vez de un editor universal de animación. Añadir undo/redo y un comportamiento claro de guardar/reabrir. Determinar carriles y controles por las acciones reales, no copiar toda la complejidad de un NLE.

No están fijados tiempos de hover, número máximo de slots, exclusividad entre paneles, formato JSON, resolución lógica ni estructura de carpetas de código. Son decisiones que Claude deberá cerrar con motivos al planificar. Tampoco se obliga a crear una base de datos porque el usuario describa la biblioteca como un CMS.

## 6. Media, efectos y exportación posterior

En una variante web, vídeo HTML detrás de un HUD transparente es un punto de partida posible. Si el efecto necesita procesar los píxeles del fondo en el mismo renderer, Three.js dispone de [`VideoTexture`](https://threejs.org/docs/pages/VideoTexture.html), cuya fuente es un `HTMLVideoElement`; esto facilita la preview, **no demuestra** scrub exacto ni salida frame-perfect. También hay que probar color, resolución y coste de subir vídeo a textura. `requestVideoFrameCallback` proporciona timestamps, pero no garantiza sincronización estricta y puede llegar tarde respecto a la pantalla. No convertirlo en una promesa de exportación frame-perfect. [API](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback).

El fondo ya está montado; no hace falta cortar vídeo. Sí comprobar errores de carga, pausa, búsqueda, buffering y relocalización de archivos. Usar el MP4 suministrado como primer caso, sin prometer todos los codecs. Imagen como fondo permite probar UI mientras se resuelve media.

Un panel translúcido puede superponerse; desenfocar o distorsionar el fondo necesita acceso a los píxeles de ese fondo. Por ello un HUD exportado con alpha no puede contener por sí solo cualquier efecto que dependa del vídeo original. En web, un filtro Pixi no desenfoca automáticamente un elemento HTML detrás del canvas. Es una prueba gráfica concreta para cualquier finalista.

La investigación proponía comenzar con transparencia/textura/glow y aplazar blur real del metraje. Claude puede revisarlo según el diseño. Si se exige, comparar fondo como textura, composición conjunta o efecto en el editor final; no introducir un segundo renderer por intuición.

Para una fase posterior, estudiar un render por tiempo a frames con alpha y pista de SFX, y después un contenedor compatible con el editor final. PNG + WAV es un candidato de prueba, no formato decidido. Exportar código/proyecto no equivale a vídeo importable, y quitar negro puede degradar negros, bordes y transparencias.

WebCodecs ofrece decodificación/codificación por frames y puede resultar útil más tarde, pero **no lee ni escribe por sí solo un contenedor MP4/WebM**: necesita demuxer/muxer y gestionar timestamps, audio y codecs soportados. No sustituye el trabajo de un exportador. [WebCodecs](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API). FFmpeg es otro candidato de codificación/composición; su licencia depende de la compilación. No se ha validado exportación en CapCut o After Effects ni equivalencia entre preview y salida. [FFmpeg](https://ffmpeg.org/legal.html). El primer prototipo no necesita implementar exportador, instalador ni pipeline 4K; debe conservar una frontera que permita investigarlos después.

El texto externo propone Remotion como posible acelerador de exportación. Su [FAQ oficial](https://www.remotion.dev/docs/license/faq) indica que una persona puede usarlo gratis incluso comercialmente, pero que es **source available, no open source**; las condiciones cambian para organizaciones mayores y ciertos servicios. Dado que el usuario trabaja solo ahora, el coste inmediato no lo descarta automáticamente. Aun así, no debe volverse dependencia central sin decidir si se acepta esa licencia y sin demostrar que ayuda al flujo de KOALITIC. Mantenerlo como referencia para una prueba posterior, no como hito del primer ciclo.

## 7. Trabajo con Claude y herramientas creativas

Anthropic publica Opus 5.5 y su identificador `claude-opus-5-5`. Claude Code puede leer/escribir archivos, ejecutar comandos y usar MCP. Esto no equivale a un servicio de IA dentro de KOALITIC ni garantiza capacidad ilimitada por una suscripción. Usar el acceso ya contratado y comprobar límites en la cuenta; no añadir facturación API por defecto. [Opus](https://www.anthropic.com/claude/opus), [Claude Code](https://code.claude.com/docs/en/overview).

| Herramienta | Automatización comprobada / límite | Papel propuesto |
|---|---|---|
| Claude Code | CLI, archivos y comandos; instrucciones persistentes CLAUDE.md; MCP documentado | Implementación por hitos, tests y documentación |
| Playwright | Automatización Electron documentada como experimental | Solo si se elige Electron; no es requisito del proyecto |
| Playwright MCP | Repositorio de Microsoft; útil en páginas web | Opcional; no presupone que vea semánticamente objetos del canvas |
| Godot | CLI oficial; no se ha validado aquí un MCP oficial del motor | Candidato abierto a comparar |
| Qt | CMake y herramientas QML; no se ha validado un MCP oficial para esta tarea | Alternativa nativa |
| Noesis | XAML/SDK y animación documentados; automatización integral de Studio no verificada | Excluido del flujo gratuito |
| Inkscape | Exportación por línea de comandos documentada | Opcional para SVG/PNG |
| Penpot | Plataforma open source y MCP oficial publicado | Opcional para diseño; no hace falta montar servidor ahora |
| After Effects | Scripts y CLI oficiales | Solo referencia o secuencias especiales si ya se dispone de él |
| Higgsfield | API oficial publicada para generación | Opcional y externo; no es dependencia gratuita del producto |

Fuentes: [memoria Claude](https://code.claude.com/docs/en/memory), [MCP Claude](https://code.claude.com/docs/en/mcp), [Playwright Electron](https://playwright.dev/docs/api/class-electron), [Playwright MCP](https://github.com/microsoft/playwright-mcp), [Inkscape CLI](https://wiki.inkscape.org/wiki/Using_the_Command_Line), [Penpot](https://penpot.app/self-host), [Penpot MCP](https://penpot.app/penpot-mcp-server), [Adobe](https://developer.adobe.com/after-effects/), [Higgsfield API](https://higgsfield.ai/higgsfield-api).

No es necesario instalar MCP para cada librería. En la familia web, el camino básico sería editar código, ejecutar tests y abrir la app; otras familias tendrán su propio CLI. Para canvas, ofrecer un modo de diagnóstico que publique IDs y bounds de componentes y permita consultar el estado evaluado; los tests deben combinar comandos semánticos con clicks reales y capturas. No validar toda la interacción únicamente llamando funciones internas.

La imagen de referencia comunica intención. Claude debe recrear geometría, zonas clicables, estados, texto dinámico y animaciones. No incrustar una captura completa como HUD. Los textos cambiantes permanecen texto; cámaras y retratos son assets independientes. El usuario decide calidad, jerarquía, ritmo y legibilidad comparando versiones; esa dirección artística no la sustituye un test.

## 8. Pruebas y cuestiones pendientes para cerrar el plan

Estas pruebas son propuestas de investigación; no se han ejecutado en el nuevo stack y sus duraciones no son compromisos.

**Prueba visual comparativa:** construir el mismo radial con cinco equipos, un panel plegable y un PhotoResult con revelación por etapas; tipografía real, máscara, transparencias y glow sobre fondos claros/oscuros. Probar Three.js y una ruta 2D (PixiJS o DOM/SVG) con los mismos assets y datos; incluir al menos una pieza 2.5D que ponga a prueba la ventaja de Three.js. Revisar motion, texto, facilidad de iteración y coste de mantener variantes con el usuario, no solo contar fps. Reutilizar el mismo componente en el configurador y en el episodio. Las estimaciones anteriores de 1–2 jornadas dejan de ser comparables si se hacen dos implementaciones; Claude debe acotar el spike antes de prometer plazos.

**Prueba de autoría:** crear preset y dos episodios distintos, cargar fondo, grabar apertura/selección, insertar stamina 100→80, mover acciones, buscar hacia atrás y adelante, guardar y reabrir. Comparar estado y capturas al llegar reproduciendo frente a saltar directamente. Una prueba acotada puede ocupar 2–3 jornadas, sin incluir todo el producto.

**Prueba de persistencia de la ruta elegida:** cerrar y reabrir, perder permisos o archivo de fondo, modificar un preset, recuperar un backup y abrir datos inválidos. Si se elige navegador, probar la durabilidad y portabilidad reales de su almacenamiento. No basta con que funcione mientras la pestaña permanece abierta.

**Rendimiento:** acordar hardware y resolución de preview; medir por separado evaluación de estado, render del HUD y búsqueda/decodificación de vídeo. Un fixture de 14 minutos y 1.000 eventos es una propuesta de estrés. Cifras anteriores como 60 fps o 50 ms no son requisitos confirmados ni resultados medidos.

**Exportación futura:** una secuencia breve con texto fino, transparencia y sonidos, importada en el editor final. Comparar alpha/composición y efectos que dependen del fondo. Esta prueba no bloquea el primer circuito funcional por petición del usuario.

Preguntas aún útiles para Claude: reglas automáticas de XP/rank/misiones; propagación de cambios globales y de biblioteca; forma preferida de iniciar y guardar una app sin ejecutable; alcance concreto del primer ciclo; si habrá momentos 3D reales. No volver a preguntar por cursor visible, edición del vídeo, uso individual o tracking inicial: ya están respondidos.

### Límites de esta investigación

No se ejecutaron benchmarks comparativos ni se construyó una muestra con los candidatos. La existencia de documentación o demos no demuestra calidad AAA ni rapidez de producción para este HUD. No se verificó un flujo automático imagen → componente, ni MCP oficial para cada producto. No asumir que la ausencia de comprobación demuestra que una integración no existe.

El stack web/GPU sigue siendo una hipótesis prometedora. La nueva evidencia eleva **Three.js como renderer principal** a candidato serio junto a PixiJS/2D y DOM/SVG; no demuestra que sea superior para este HUD editable. Godot y Qt Quick siguen disponibles como contraste si una limitación material de la web aparece. Los hitos definitivos, presupuestos de tiempo y versión de dependencias los debe cerrar Claude después de su análisis. No hay obligación de mantener una recomendación del investigador anterior ni la conclusión del texto externo.
