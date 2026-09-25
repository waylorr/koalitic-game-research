# 09 · Estado del proyecto y bitácora

**Última actualización:** 25-09-2026.

Este documento es el **punto de entrada para retomar el trabajo sin contexto**, sea con Claude Code, otra IA o una persona. Resume qué se ha hecho, por qué, dónde está cada cosa y qué sigue. Los detalles viven en 05–08; aquí están los enlaces.

---

## 1. Cómo retomar en 5 minutos

1. Lee [`CLAUDE.md`](../CLAUDE.md) (reglas) y este documento.
2. Si vas a tocar componentes del HUD, lee además:
   - [`07_FRAMEWORK_HUD.md`](07_FRAMEWORK_HUD.md): capas del kit, estados y rails;
   - [`08_WORKFLOW_UI_Y_ASSETS.md`](08_WORKFLOW_UI_Y_ASSETS.md): referencias, rutas de fabricación y librerías.
3. Arranca la app:
   ```sh
   cd app
   npm install
   npm run dev
   ```
   Abre `http://localhost:5173/#assets`.
4. Antes de cambiar nada, comprueba que todo pasa:
   ```sh
   npm run typecheck
   npm test
   npm run build && npm run e2e
   ```
5. Trabaja en `koalitic-game-0.1`, o en la rama que indique el creador, y pasa a `main` lo aprobado. Cada entrega: pruebas en verde, commit y push. El `main` antiguo (la primera prueba técnica) está archivado en `archive/main-h0`.

---

## 2. Qué se ha construido

| Parte | Dónde | Estado |
|---|---|---|
| Motor de tiempo: pistas, keyframes, `evaluateFrame`, determinismo | `app/src/core/` | ✅ Probado en H0 (ver §5) |
| Laboratorio del motor: HUD provisional DOM, timeline mínima, vídeo como reloj | `app/lab.html`, `app/src/lab/` | ✅ Se conserva como banco de pruebas |
| Armazón de la app: escenario 1920×1080 escalado, navegación, fondos | `app/src/app/`, `app/src/ui/` | ✅ |
| Menú principal: botones neón, teclado y ratón, sonidos, QUIT → SYSTEM OFFLINE | `app/src/screens/MainMenu.tsx` | ✅ |
| **Tokens de diseño compartidos** (menús + HUD) | `app/src/design/` | ✅ Una sola fuente; THEME edita ambos en vivo |
| Kit del HUD: movimiento, piezas, efectos (glitch, bloom, artefactos), iconos | `app/src/hud/kit/` | ✅ |
| Registro de elementos del HUD | `app/src/hud/registry.ts` | ✅ |
| Catálogo ASSETS → UI COMPONENTS (menú tipo juego) | `app/src/screens/catalog/` | ✅ |
| PLAYER PROFILE | `app/src/hud/v2/player.ts`, `PlayerPixi.ts` | ✅ Estados, reacciones y valores editables |
| GEAR RADIAL | `app/src/hud/v2/gear.ts`, `GearPixi.ts` | ✅ v2; falta fidelidad fina con `configure_hud.webp` |
| LEFT RAIL · DOCK (perfil cerrado + iconos + despliegue lateral) | `app/src/hud/v2/rail.ts`, `RailPixi.ts` | ✅ v2 |
| Stamina, Time Left, Inventory | — | ⏳ Hoy usan el panel de muestra del kit |
| Rail OPEN/PINNED, Right Rail, Top Bar, overlays POV | — | ⏳ |
| Pantallas Episodes, Configure HUD, Episode Editor | `ScreenStub.tsx` | ⏳ Solo la cabecera |
| Data Library, Media, guardar/abrir proyecto | — | ⏳ Diseñado en 05 §3, no implementado |
| Exportación (vídeo con alfa) | — | ⏳ Fuera de alcance hasta nueva decisión |

**Pruebas actuales:**
- lógica: 30 pruebas;
- app en navegador: 30 comprobaciones;
- laboratorio: 17 comprobaciones;
- el prototipo `WORKFLOW` sigue en verde.

---

## 3. Bitácora (qué pasó y por qué)

### 24-09-2026: auditoría y prueba técnica (H0)
- Auditoría del prototipo `WORKFLOW/`: 12 fallos verificados ejecutando su código (05 §1.3).
- Stack elegido: **app web local** (React + TypeScript + Vite) con un núcleo puro de tiempo. Se descartaron por evidencia:
  - GSAP: su licencia prohíbe herramientas de animación visual que compitan con Webflow;
  - Godot: solo reproduce Ogg Theora;
  - Unreal: su vídeo no es exacto al fotograma.
- **H0 superado:** saltar a un instante da lo mismo que llegar reproduciendo; es rápido y el vídeo funciona como reloj (medidas en §5).
- Se publicó y se subió a `main` (commit `84573ce`), a petición del creador. Esa versión se conserva en la rama `archive/main-h0`.

### 24-09-2026 (tarde): la app de verdad
- El creador vio la primera prueba «cutre» y sin conexión con su `workflow.html`. Se cambió de enfoque:
  - app real;
  - lienzo fijo de 16:9 como un juego;
  - **cada elemento de UI se aprueba primero en el catálogo**.
- Se probó una esfera en Three.js para el fondo y se retiró: **los fondos son arte del creador**, no 3D.
- Menú principal y botón neón.

### 25-09-2026: calidad visual y framework
- El creador pasó un **vídeo del HUD v1**. Se midió fotograma a fotograma y salió el lenguaje de movimiento (06): nacer de una línea, construir por filas, glitch, destellos, salidas.
- **Decisión:** el HUD se dibuja con **PixiJS + pixi-filters**, porque CSS y SVG no daban el nivel del v1. Se mantuvo la regla de que el mismo instante da los mismos píxeles, con el glitch hecho con azar con semilla.
- Se evaluaron y descartaron para esta app:
  - Unreal, Unity y Godot: habría que rehacer editor, timeline y Data Library;
  - After Effects y Lottie: se pierden los efectos;
  - Rive: de pago para exportar;
  - vídeos de Higgsfield como componentes: no admiten valores editables.
- Higgsfield y After Effects quedan como **fuentes de referencia de movimiento**.
- **Framework en cuatro capas** (07): tokens → kit de movimiento → piezas → componentes. Cada componente tiene aspecto y movimiento fijos y **solo sus valores son editables**; cada cambio es un keyframe.
- **Modelo de estados:**
  - forma: COMPACT, OPEN o PINNED;
  - interruptores: HOVER sí/no y DISABLED sí/no;
  - aparte: presencia (entrar y salir), reacciones y ambiente.
- Catálogo reorganizado como menú de juego: SYSTEM UI · HUD KIT · HUD ELEMENTS por zonas. Cada elemento tiene las pestañas EDIT, DEMO y ALL STATES.
- **Nitidez:** el lienzo se dibuja a la resolución real de la pantalla y los filtros la heredan.
- GEAR RADIAL, primero en gajos y después en **pétalos hexagonales iluminados desde el borde con núcleo rojo**, según `configure_hud.webp`. Iconos sólidos de Material Symbols.
- **LEFT RAIL · DOCK** como la referencia: perfil cerrado, columna de casillas brillantes y un solo módulo desplegado al lado de su icono. El radial se abre sobre la columna con arcos rojos.
- **Tokens compartidos:** un único `app/src/design/tokens.ts` alimenta las variables CSS de los menús y el tema de PixiJS. THEME cambia a la vez los menús y el HUD. Antes había dos fuentes y el cristal del menú no cambiaba.
- **Workflow de referencias** (08): el creador preparará piezas aisladas sobre negro, hojas de estados y un clip por animación; Claude las convierte en presets.

---

## 4. Decisiones vigentes (resumen; detalle en 05 §9)

| ID | Decisión |
|---|---|
| D1 | App web local: React + TypeScript + Vite. El HUD pasó de DOM a PixiJS (D12) |
| D2 | Núcleo puro `evaluateFrame(episodio, t)` compartido por preview, scrub y exportación |
| D3 | Movimiento calculado desde el tiempo; sin animaciones CSS en el HUD |
| D4 | Tiempo en ms enteros; escenario lógico de 1920×1080 |
| D7 | Sin GSAP ni librerías de animación en el núcleo |
| D9 | Lienzo fijo de 1920×1080 escalado, con el arte del creador de fondo |
| D10 | Cada componente se aprueba en ASSETS → UI COMPONENTS antes de usarse |
| D11 | Sin Three.js para fondos |
| D12 | HUD con PixiJS + pixi-filters; cálculo puro por componente y dibujante sin lógica de tiempo; efectos con semilla |
| D13 | Aspecto y movimiento fijos por componente; solo los valores son editables (cada cambio es un keyframe) |
| D14 | Una sola fuente de tokens de diseño (`app/src/design/tokens.ts`) para los menús y el HUD |
| D15 | Estado de un módulo = forma (COMPACT/OPEN/PINNED) + HOVER y DISABLED independientes; PULSE es una reacción |
| D16 | Left Rail en DOCK: un solo módulo desplegado al lado de su icono; en OPEN los módulos van apilados (pendiente) |

---

## 5. Medidas de referencia (para no retroceder)

Medidas de H0, detalladas en 05 §6:
- episodio de 14 min con 4.000 keyframes y 200 overlays: `evaluateFrame` tarda p50 0,018 ms y p95 0,038 ms;
- coste del HUD DOM por fotograma: evaluar p95 0,1 ms y dibujar p95 0,4 ms, a 60 fps sin GPU;
- vídeo como reloj: desfase al pausar de 2–6 ms, sin fotogramas perdidos;
- saltar a un instante y llegar reproduciendo dan el mismo DOM, con diferencias de píxel imperceptibles.

Medidas del HUD PixiJS (25-09):
- **mismo instante = mismos píxeles, con el glitch incluido** (0 píxeles de diferencia en la prueba);
- el radial pasa paso a paso por cada sector (2 → 3 → 4 al saltar tres);
- el rail abre un solo módulo cada vez.

Límites conocidos:
- las pruebas corren sin GPU y en un Chromium sin H.264; el rendimiento real hay que medirlo en el Chrome o Edge del creador;
- una comprobación del laboratorio (sincronía con el vídeo, ≤ 1 fotograma) falló dos veces por 36 ms con la máquina cargada y pasó a la tercera; vigilarla.

---

## 6. Referencias: qué hay y qué falta

- ✅ **El vídeo del HUD v1** (30,8 s) está guardado en `ENTREGA_CLAUDE/referencias/00-vision/hud-v1-movimiento.mp4`. Sus tiempos medidos están en 06.
- Las piezas aisladas, hojas de estados y clips por componente que describe 08 §3.
- Fondos limpios del menú y de las pantallas secundarias, sin botones dibujados. Hoy son versiones retocadas en `app/public/backgrounds/`.

## 7. Preguntas abiertas (del creador)

Siguen abiertas las de 05 §7, con los supuestos S1–S9 mientras no se respondan:
- fichas como referencia viva o como copia;
- cómo arrancar la app en el equipo del creador;
- formato de los vídeos finales;
- huecos del Loadout (cinco o seis);
- XP manual o por regla.

Además:
- ¿El Rail OPEN (módulos apilados, hudv2) y el DOCK conviven en el mismo episodio? Se asume que sí: el modo es una pista.
- Nombres definitivos de los módulos del Left Rail. Hoy: INVENTORY, CAMERA, GEAR, STAMINA, TIME LEFT.

---

## 8. Siguientes pasos (orden recomendado)

1. **Modo REFERENCIA** en el catálogo: la imagen del creador semitransparente encima del componente, para calcarlo (08 §7).
2. **Fidelidad del GEAR RADIAL** con `configure_hud.webp`, usando ese modo y las referencias aisladas que prepare el creador (08 §3).
3. **Stamina** (barra por segmentos ámbar), **Time Left** (reloj rojo) e **Inventory** reales, que sustituyen al panel de muestra.
4. **Rail OPEN/PINNED:** módulos apilados, acordeón y cascada (07 §4).
5. Right Rail, Top Bar y overlays POV (según 08 §10).
6. Pantallas de la app (Configure HUD según `configure_hud.webp`, Episodes, Editor con timeline) y Data Library con guardado (H1 de 05 §5).
7. Más adelante: tracking, exportación con alfa y empaquetado, solo con nueva decisión.

Librerías previstas para estos pasos: ver 08 §8 («Selección»).
