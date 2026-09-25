# 08 · Workflow de UI: de la referencia al componente

Este documento lo usan tres «personas»:
- **el creador**, que decide el aspecto y prepara referencias;
- **ChatGPT u otra IA de imagen**, que ayuda a generar referencias coherentes;
- **Claude Code**, que convierte cada referencia en un componente del kit.

Complementa a:
- `06_MOVIMIENTO_HUD.md`: el lenguaje de movimiento medido del HUD v1;
- `07_FRAMEWORK_HUD.md`: las capas del kit, los estados, los rails y el catálogo.

---

## 1. Qué hemos aprendido (25-09-2026)

**Lo que funcionó**
- **Referencias visuales concretas:** con `configure_hud.webp` el Gear Radial y el Rail DOCK mejoraron en una sola vuelta.
- **Vídeo de movimiento:** el HUD v1 se midió fotograma a fotograma y de ahí salió todo el lenguaje de movimiento.
- **PixiJS con efectos** (glitch, bloom, degradados, iconos sólidos) llega al nivel de acabado que se busca y se puede mover el cabezal.

**Lo que falló**
- **Diseñar «a ojo» sin referencia de la pieza aislada.** Los primeros botones y pétalos quedaron pobres.
- **Pantallas completas como única fuente.** En una escena con muchos elementos, cada pieza sale pequeña, en perspectiva y mezclada con el fondo, y no se ve su forma exacta, su grosor de línea ni su brillo.
- **Comparar de memoria.** Sin poner la referencia encima del resultado, «se parece un poco» no se puede medir.
- **Tokens duplicados.** El menú (SYSTEM UI) usaba variables CSS propias y el HUD usaba `THEME` en PixiJS, así que GLASS OPACITY no cambiaba el menú. Resuelto en §6.

---

## 2. Principio del workflow

**Visión → tokens → piezas → componentes → pantallas.** Nunca al revés.

1. **Visión:** una lámina de estilo, más escenas completas como referencia de conjunto.
2. **Tokens globales:** colores, tipografías, grosores, radios, cristal, brillo y tiempos, compartidos por SYSTEM UI y HUD.
3. **Piezas:** marco de panel, casilla, pétalo, barra, núcleo, línea, icono… cada una aislada, con sus estados.
4. **Componentes:** combinan piezas y eligen su movimiento del kit.
5. **Pantallas:** Configure HUD, Episodes, Editor… hechas con componentes aprobados.

Cada paso se aprueba en ASSETS → UI COMPONENTS antes del siguiente.

---

## 3. El paquete de referencia que prepara el creador

La estructura de carpetas va dentro de `ENTREGA_CLAUDE/referencias/`. Los nombres van en minúsculas y con guiones.

```
referencias/
  00-vision/
    lamina-estilo.png            ← paleta con HEX, tipografías, ejemplos de brillo y cristal
    escena-hud-01.png …          ← escenas completas 16:9 (como hudv2_*.jpeg)
    escena-configure-hud.png     ← pantallas de la app (como configure_hud.webp)
  01-piezas/
    marco-panel.png  casilla.png  petalo.png  nucleo.png  barra.png  boton.png …
  02-componentes/
    left-rail/gear-radial/
      ficha.md                   ← plantilla de §4
      estados.png                ← hoja con todos los estados lado a lado
      detalle-2x.png             ← el componente solo, grande, de frente
      movimiento-abrir.mp4       ← un clip por animación (§5)
      movimiento-seleccion.mp4
    left-rail/stamina/ …  right-rail/active-mission/ …  pov/system-notification/ …
  03-system-ui/
    menu-principal/ …  configure-hud/ …  episodes/ …
```

### Reglas de las imágenes (importantes para la fidelidad)

- **Piezas y componentes aislados, de frente**, sin perspectiva ni ángulo de cámara.
- **Fondo negro puro (#000000) o transparente.** Nada de escena detrás, para poder medir el brillo y recortar la pieza.
- **Grandes:** mínimo 1024 px de lado para una pieza y 2048 px para un componente.
- **Una hoja de estados** por componente: todos los estados en la misma imagen, con el mismo tamaño y posición (reposo, seleccionado, hover, deshabilitado, compacto…). Así se ve qué cambia de un estado a otro.
- **Texto real y exacto**, o sin texto. La IA inventa letras (por ejemplo «SOLIO START» en el v1); mejor dejar los textos para el componente.
- **Misma paleta en todas:** pega los HEX de la lámina en cada petición (§5.1).

---

## 4. Plantilla de ficha de componente (`ficha.md`)

```markdown
# <NOMBRE> · <zona: LEFT RAIL | TOP BAR | RIGHT RAIL | POV | SYSTEM UI>

## Qué es
Una frase. Qué muestra y para qué.

## Datos (de la Data Library o de pistas)
- campo · tipo · ejemplo   (ej.: stamina · número 0-100 · 72)
- ¿algún valor tiene keyframes en el episodio? ¿cuál?

## Estados
- Forma: COMPACT / OPEN / PINNED (¿cuáles aplican?)
- HOVER sí/no · DISABLED sí/no
- Estados propios (ej.: gajo seleccionado, alerta crítica <20 %)

## Animaciones (un clip por fila en la carpeta)
| Animación | Cuándo | Referencia | Duración aprox. |
|---|---|---|---|
| Entrada | aparece | movimiento-abrir.mp4 | 0,6 s |
| Reacción | cambia el valor | movimiento-reaccion.mp4 | 0,4 s |
| Salida | desaparece | — (usa la del kit) | — |

## Piezas que usa
(ej.: casilla del rail, pétalo, núcleo rojo, barra por segmentos)

## Qué es imprescindible que se parezca
(ej.: «el brillo sale del borde exterior del pétalo», «el núcleo tiene aro doble»)

## Qué puede decidir Claude
(ej.: tiempos exactos, tamaño de letra si no cabe)
```

---

## 5. Cómo generar las referencias

### 5.1 Imágenes con ChatGPT

Encabezado común para pegar siempre (así todas las imágenes comparten estilo):

```
Estilo KOALITIC HUD v2: interfaz de videojuego sci-fi sobre fondo NEGRO PURO (#000000),
vista frontal ortográfica, sin perspectiva ni escena de fondo.
Paleta: rojo acento #FF2D46, cian datos #54E4FF, texto #EEF6FF, etiquetas #8FA6B8,
cristal oscuro #0A1220 al 75 %, XP verde #58FF8E, stamina ámbar #FFC331.
Líneas finas de 1,5-2 px con brillo (glow) del mismo color; esquinas cortadas en diagonal;
tipografía tipo Rajdhani (títulos anchos tipo Michroma). Nítido, alta resolución, sin texto inventado.
```

Peticiones típicas:
- **Pieza:** «[encabezado] Dibuja SOLO la pieza <pétalo del radial> en 4 estados en fila: reposo, hover, seleccionado, deshabilitado. Mismo tamaño y posición. 2048×512.»
- **Componente:** «[encabezado] Dibuja SOLO el componente <GEAR RADIAL> centrado, de frente, 2048×2048, con estos datos: <lista exacta>.»
- **Hoja de estados:** «[encabezado] Hoja de estados de <STAMINA>: COMPACT, OPEN, PINNED, HOVER, DISABLED, en rejilla 3×2, mismo tamaño.»
- **Escena (conjunto):** «[encabezado, pero con fondo de vídeo real] Escena 16:9 1920×1080 con Left Rail en DOCK y el radial abierto…».

### 5.2 Vídeos de movimiento (Higgsfield u otro)

- **Un clip por animación** (abrir, cerrar, seleccionar, reaccionar), de **2-4 s**.
- **Fondo negro, cámara fija**, el componente centrado, de frente.
- Parte de una **imagen de la hoja de estados** como primer fotograma, para que el estilo coincida.
- Describe la acción en tiempos: «0,0 s línea de luz · 0,2 s los pétalos salen girando · 0,6 s núcleo rojo con rebote».
- Claude mide cada clip fotograma a fotograma (como en `06_MOVIMIENTO_HUD.md`) y lo convierte en un preset del kit.

---

## 6. Tokens globales ✅ (hecho el 25-09-2026)

**Una sola fuente:** `app/src/design/tokens.ts`. De ella salen:
- el `THEME` que dibuja el HUD en PixiJS;
- las **variables CSS** de los menús (SYSTEM UI), que `TokensProvider` (`app/src/design/TokensProvider.tsx`, montado en la raíz de la app) escribe en el documento.

Por eso **HUD KIT → THEME** cambia a la vez los menús y el HUD: colores, opacidad del cristal y grosor de línea. Hay una prueba automática que lo comprueba. Los valores por defecto de CSS siguen en `app/src/ui/tokens.css`, para el primer pintado.

Tokens compartidos hoy:
- colores: acento, datos, texto, etiquetas, borde, cristal, blanco incandescente y desactivado;
- barras de XP y Stamina;
- opacidad del cristal;
- grosor de línea;
- tamaño de esquina;
- tipografía;
- perillas de movimiento (velocidad, glitch, artefactos, bloom y ambiente).

Para añadir un token: añadirlo en `tokens.ts`; si lo usa el CSS, añadirlo en `cssVariables()` y darle un valor por defecto en `ui/tokens.css`.

Cada componente puede tener **variantes** (la caja de Stamina no es la del Player ni los pétalos del Gear), pero todas leen los mismos tokens.

---

## 7. Cómo lo convierte Claude: tres rutas de fabricación

| Ruta | Cuándo usarla | Ventaja | Coste |
|---|---|---|---|
| **A. Vector procedural (PixiJS Graphics + degradados)** | Marcos, casillas, pétalos, barras, aros: formas geométricas | Se recolorea con los tokens, se anima pieza a pieza, nítido a cualquier escala | Hay que medir bien la referencia |
| **B. SVG trazado desde tu PNG** (vtracer) | Formas complejas u orgánicas: emblemas, logos, siluetas | Fidelidad alta a tu imagen y sigue siendo vectorial | Limpieza del trazado; los brillos se añaden aparte |
| **C. Textura PNG (NineSliceSprite)** | Materiales ricos: cristal con ruido, texturas, marcos muy detallados | Es tu imagen tal cual: máxima fidelidad | No se recolorea bien; hay que exportar a 2× y por estados |

Iconos: glifos sólidos (Material Symbols, ya en `kit/glyphs/`) o game-icons.net para objetos de juego (pistola, mochila, dron). Estos requieren poner el crédito.

**Para que «se parezca» de forma medible:** el catálogo tendrá un modo **REFERENCIA** que pone tu imagen semitransparente encima del componente (piel de cebolla), con un deslizador de opacidad. Así se ajustan tamaños, grosores y brillo hasta que coincidan, igual que se calca en Photoshop. Es la siguiente mejora del catálogo.

---

## 8. Librerías investigadas

Versiones y licencias comprobadas en el registro npm el 25-09-2026.
- **✅ En uso:** instalada.
- **⭐ Seleccionada:** usar en los próximos pasos.
- **○ Opcional:** si hace falta.
- **✗ Descartada.**

### 8.1 Dibujo, efectos y animación (HUD)

| Librería | Versión · licencia | Qué aporta | Veredicto |
|---|---|---|---|
| **pixi.js** | 8.21 · MIT | Motor 2D WebGL del HUD; incluye `NineSliceSprite`, `FillGradient`, `ParticleContainer` | ✅ En uso |
| **pixi-filters** | 6.1 · MIT | Glitch, bloom avanzado, desenfoque de fondo; también CRT, RGB split, shockwave, godrays, old film, glow, outline, zoom blur | ✅ En uso (3). ⭐ Probar CRT, shockwave y godrays para reacciones y nivel subido |
| **@spd789562/particle-emitter** | 1.0 · MIT | Partículas para PixiJS v8 (chispas, polvo de luz, estelas) | ⭐ Para las chispas del kit (sustituir parte de los artefactos) |
| @pixi/particle-emitter | 5.0 · MIT | El original; pensado para PixiJS v7 | ✗ Usar el anterior |
| @pixi/ui | 2.3 · MIT | Botones, sliders y listas dentro de PixiJS | ○ Solo si alguna pieza interactiva del HUD lo necesita (hoy los controles son HTML) |
| @pixi/layout | 3.2 · MIT | Maquetación tipo flexbox dentro de PixiJS | ○ Para el Rail OPEN si apilar a mano se complica |
| @pixi/sound | 6.0 · MIT | Sonido en PixiJS | ○ Los SFX actuales usan WebAudio propio; considerar al exportar audio |
| simplex-noise | 4.0 · MIT | Ruido suave con semilla (parpadeos y temblores orgánicos) | ⭐ Para un ambiente más vivo, sin perder el determinismo |
| culori | 4.0 · MIT | Mezcla de colores perceptual (OKLCH) | ○ Para degradados de tokens más limpios |
| spine-pixi-v8 | 4.3 · licencia Spine (pago del editor) | Animación esquelética | ✗ No hace falta |
| motion (antes Framer Motion) | 13.4 · MIT | Animación de componentes React | ○ Solo para las pantallas de la app (SYSTEM UI), nunca para el HUD |
| GSAP | Gratis, con restricción de licencia | Animación | ✗ Su licencia prohíbe herramientas de animación visual que compitan con Webflow (D7) |
| Theatre.js | Estudio AGPL | Editor de animación | ✗ |
| Lottie / dotLottie | MIT | Animaciones de After Effects | ✗ Pierde glow y efectos |
| Rive | Motor MIT; exportar cuesta 9 $/mes | Editor visual de animación con estados | ✗ Por ahora (de pago, menos efectos) |

### 8.2 Iconos

| Librería | Licencia | Qué aporta | Veredicto |
|---|---|---|---|
| **Material Symbols** (`@material-symbols/svg-400`) | Apache 2.0 | Iconos sólidos redondeados y coherentes | ✅ En uso (`app/src/hud/kit/glyphs/`) |
| **game-icons.net** | CC BY 3.0, **exige crédito** | 4.000+ iconos de juego (pistola, mochila, dron, mapa) | ⭐ Para objetos de juego; crédito en `glyphs/README.md` |
| @tabler/icons | 3.48 · MIT | 5.000+ iconos de línea y relleno | ○ Alternativa de línea |
| @phosphor-icons/core | 2.1 · MIT | Iconos con seis grosores | ○ |
| remixicon | 4.9 · Apache 2.0 | Iconos de línea y relleno | ○ |
| lucide-static | 1.48 · ISC | Iconos de línea | ○ |
| @iconify/json | MIT (cada set con su licencia) | Acceso a más de 200 sets | ○ Solo para buscar; copiar el SVG elegido, sin dependencia en tiempo de ejecución |

### 8.3 Interfaz de la app (SYSTEM UI, HTML)

| Librería | Licencia | Qué aporta | Veredicto |
|---|---|---|---|
| augmented-ui | 2.0 · BSD-2 | Esquinas y cortes sci-fi en CSS puro | ○ Para paneles de Configure HUD y Editor |
| @arwes/react / @arwes/frames | MIT, **sin mantenimiento** | Marcos animados sci-fi y sonidos | ✗ Como dependencia; sí como inspiración |
| tweakpane / lil-gui / leva | MIT | Paneles de ajustes rápidos | ○ Solo para depurar; el creador usa el catálogo |

### 8.4 Preparar assets (herramientas fuera de la app)

| Herramienta | Licencia | Para qué | Veredicto |
|---|---|---|---|
| **vtracer** / `@neplex/vectorizer` (Node, basado en vtracer) | MIT (comprobar en su repositorio) | Convertir un PNG de referencia en SVG (ruta B) | ⭐ Como herramienta de preparación |
| potrace / esm-potrace-wasm | GPL-2.0 | Vectorizar en blanco y negro | ✗ Por la licencia GPL |
| **rembg** (Python) | MIT | Quitar el fondo a imágenes generadas | ⭐ Para aislar piezas |
| OpenCV (Python) | Apache 2.0 | Medir vídeos fotograma a fotograma (usado para el v1) | ✅ Ya usado en el análisis de movimiento |

### 8.5 Futuro (editor, datos, exportación, tracking)

| Librería | Licencia | Para qué | Veredicto |
|---|---|---|---|
| zod | 4.6 · MIT | Validar y versionar el formato de proyecto | ⭐ Con el guardado (H1) |
| idb | 8.0 · ISC | IndexedDB cómodo para borradores | ○ Como copia de seguridad; el guardado principal es una carpeta (05 D6) |
| mediabunny | 1.59 · MPL-2.0 | Leer y escribir MP4/WebM en el navegador (WebCodecs) | ⭐ Para exportar el HUD con alfa |
| mp4-muxer / webm-muxer | MIT | Empaquetar vídeo codificado | ○ Alternativa ligera a mediabunny |
| @techstark/opencv-js | Apache 2.0 | Tracking de puntos en el navegador | ○ Para anclar overlays POV automáticamente (fuera de alcance por ahora) |

**Selección para los próximos pasos:**
- **HUD:** pixi-filters extra (CRT, shockwave, godrays), @spd789562/particle-emitter y simplex-noise.
- **Iconos:** game-icons.net, con crédito.
- **Preparar assets:** vtracer y rembg, como herramientas.
- **Más adelante:** zod (guardado) y mediabunny (exportación).

Cada una se instala cuando la necesite un componente concreto, con su licencia anotada aquí y en el commit.

Fuentes: [Arwes](https://github.com/arwes/arwes) · [augmented-ui](https://augmented-ui.com/) · [vtracer](https://github.com/visioncortex/vtracer) · [game-icons.net](https://game-icons.net/about.html) · [pixi-v8-particle-emitter](https://github.com/spd789562/pixi-v8-particle-emitter) · [pixi-filters](https://github.com/pixijs/filters) · registro npm (versiones y licencias).

---

## 9. Checklist por componente (definición de «hecho»)

1. [ ] Carpeta de referencias completa: ficha, hoja de estados, detalle 2× y clips.
2. [ ] Piezas nuevas añadidas al kit y visibles en **PIECES**.
3. [ ] Componente registrado (`app/src/hud/registry.ts`) y en la galería (`screens/catalog/samples.ts`), visible en **THEME**.
4. [ ] Ficha del catálogo: **EDIT** (valores, estados, entrada/salida, reacciones), **DEMO** y **ALL STATES**.
5. [ ] Comparado con la referencia en modo REFERENCIA (cuando exista); diferencias anotadas en la ficha.
6. [ ] Movimiento medido contra sus clips; tiempos anotados en la ficha.
7. [ ] Pruebas: lógica (estados, valores, puro en el tiempo) y navegador (fases, mismo fotograma al volver al mismo instante).
8. [ ] Aprobado por el creador.

---

## 10. Estado de los componentes (25-09-2026)

| Zona | Componente | Estado |
|---|---|---|
| SYSTEM UI | Menú principal, botón neón | Hecho (v1), con los tokens compartidos |
| SYSTEM UI | Episode Editor | Hecho (v1): imagen de fondo, Left Rail, timeline con keyframes. Pendiente: vídeo, más pistas y guardado |
| SYSTEM UI | Configure HUD, lista de Episodes | Pendiente (referencia: `configure_hud.webp`, workflow.html) |
| LEFT RAIL | Rail DOCK (perfil cerrado + iconos + despliegue) | Hecho (v2) |
| LEFT RAIL | Rail OPEN/PINNED (módulos apilados) | Pendiente |
| LEFT RAIL | Player Profile | Hecho |
| LEFT RAIL | Gear Radial | Hecho (v2). Falta fidelidad fina con la referencia |
| LEFT RAIL | Stamina, Time Left, Inventory/Loadout | Pendiente (ahora, panel de muestra del kit) |
| TOP BAR | System Online, Navigation Tabs, Location Header | Pendiente |
| RIGHT RAIL | Active Mission, Photo Opportunities, Mini Map, Codex | Pendiente |
| POV | Weather/Location, Person ID, System Notification, Photo Result, Quest Reveal, Level Up | Pendiente |

**Orden recomendado** (tokens compartidos: hecho):
1. Modo REFERENCIA.
2. Stamina y Time Left.
3. Rail OPEN.
4. Right Rail.
5. Top Bar.
6. POV.
7. Pantallas de la app.

---

## 11. Continuar en Claude Code CLI

- **Repositorio:** `waylorr/koalitic-game-research`. Ramas: `main` (estable), `koalitic-game-0.1` (trabajo) y `archive/main-h0` (el `main` antiguo).
- **Leer en este orden:** `README.md` → `CLAUDE.md` → `09_ESTADO_Y_BITACORA.md` → `07_FRAMEWORK_HUD.md` → este documento → `06_MOVIMIENTO_HUD.md` → `05_AUDITORIA_Y_PROPUESTA.md` §0 y §9.
- **Arrancar:**
  ```
  cd app
  npm install
  npm run dev
  ```
  Luego abrir `http://localhost:5173/#assets`.
- **Probar:**
  ```
  npm run typecheck
  npm test
  npm run build && npm run e2e
  ```
  En tu PC, Playwright puede necesitar `npx playwright install chromium`.
- **Dónde está cada cosa:**
  - tokens de diseño: `app/src/design/`;
  - kit: `app/src/hud/kit/`;
  - componentes: `app/src/hud/v2/`;
  - registro: `app/src/hud/registry.ts`;
  - catálogo: `app/src/screens/catalog/`.
- **Regla de oro:** cada componente es un cálculo puro del tiempo (`evaluateX(t, input)`) más un dibujante PixiJS sin lógica de tiempo. El mismo instante debe dar los mismos píxeles.
