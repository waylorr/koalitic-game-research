# KOALITIC app

Aplicación de autoría de KOALITIC GAME. Estado general y siguientes pasos: [`../ENTREGA_CLAUDE/09_ESTADO_Y_BITACORA.md`](../ENTREGA_CLAUDE/09_ESTADO_Y_BITACORA.md).

**Qué hay:**
- **Menú principal** (EPISODES, CONFIGURE HUD, ASSETS y QUIT GAME) sobre el arte de fondo.
- **Catálogo ASSETS → UI COMPONENTS** (`#assets`), con tres secciones:
  - **SYSTEM UI:** botón neón.
  - **HUD KIT:**
    - THEME: tokens compartidos con los menús, sobre todos los elementos a la vez;
    - MOTION: animaciones del kit y perillas;
    - PIECES: piezas, iconos y casillas.
  - **HUD ELEMENTS por zonas:** RAIL · DOCK, PLAYER PROFILE y GEAR RADIAL. Cada uno con EDIT, DEMO y ALL STATES.
- **EPISODE EDITOR** (`#episodes`, `src/editor/`):
  - imagen (IMAGE) o vídeo (VIDEO) de fondo, Left Rail encima, inspector y timeline con cinco pistas. El vídeo es el reloj al reproducir y fija la duración;
  - cambiar un valor crea un keyframe en el cabezal; doble clic en un carril también;
  - los keyframes se arrastran con ajuste a fotograma; Supr borra; Ctrl+Z / Ctrl+Y deshacen y rehacen;
  - espacio reproduce y las flechas avanzan fotograma a fotograma;
  - el borrador se guarda en el navegador.
- **CONFIGURE HUD:** en construcción.
- **Laboratorio del motor** (H0: evaluador temporal, HUD provisional DOM, timeline mínima): en `lab.html`.

## Abrir

```sh
npm install
npm run dev        # app: http://localhost:5173 · laboratorio: http://localhost:5173/lab.html
```

## Probar

```sh
npm run typecheck
npm test                      # núcleo (Vitest)
npm run build && npm run e2e  # Chromium real (Playwright); la primera vez: npx playwright install chromium
```

`npm run e2e` ejecuta `e2e/app.e2e.mjs` (menú, navegación, catálogo, elementos del HUD, tokens compartidos, QUIT, escalado) y `e2e/lab.e2e.mjs` (determinismo del motor); capturas en `e2e/out/`.

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/app/` | armazón: pantallas, navegación por anclas (`#episodes`, `#configure-hud`, `#assets`) y fondos |
| `src/screens/` | menú principal, pantallas de destino, SYSTEM OFFLINE; `catalog/`: catálogo (menú, páginas del kit, ficha común `ElementPage`, páginas de cada elemento, datos de ejemplo en `samples.ts`) |
| `src/design/` | **tokens de diseño compartidos** (`tokens.ts`) y `TokensProvider` (los escribe como variables CSS y los pasa al HUD) |
| `src/ui/` | interfaz de la app: escenario 1920×1080, logo, botón neón, sonidos y valores CSS por defecto (`tokens.css`) |
| `public/backgrounds/` | fondos provisionales derivados de tus diseños (se sustituyen por el arte limpio) |
| `src/editor/` | editor de episodio: documento (`episode.ts`, datos puros y operaciones de keyframes) y pantalla (`EpisodeEditor.tsx`) |
| `src/core/` | modelo, pistas, motion y `evaluateFrame` (TypeScript puro) |
| `src/hud/` | `kit/`: movimiento, piezas PixiJS, efectos, iconos (`glyphs/`, Material Symbols); `v2/`: elementos del HUD (cálculo puro + dibujo: player, gear, rail); `registry.ts`: registro de elementos; el resto, HUD provisional del laboratorio. Marco: `ENTREGA_CLAUDE/07_FRAMEWORK_HUD.md` |
| `src/lab/` | laboratorio del motor (`lab.html`) |

Reglas: la app se maqueta en píxeles de un escenario fijo de 1920×1080 escalado a la ventana, como un juego. Cada componente de UI se aprueba primero en ASSETS → UI COMPONENTS. El HUD (THE SYSTEM) se dibuja con PixiJS sin ticker propio: cada fotograma se calcula desde el tiempo del episodio y los efectos usan azar con semilla, así que el mismo instante da los mismos píxeles. Cada componente trae aspecto y movimiento fijos; solo sus valores son editables. Colores y medidas salen de `src/design/tokens.ts`.

**Añadir un componente del HUD:**
1. Crear `src/hud/v2/<nombre>.ts` con `evaluate<Nombre>(t, input)` y `<Nombre>Pixi.ts` con su dibujante.
2. Registrarlo en `src/hud/registry.ts`.
3. Añadirlo a la galería de `src/screens/catalog/samples.ts`.
4. Crear su página con `ElementPage` y enlazarla en `ComponentCatalog.tsx`.
5. Escribir sus pruebas.

Checklist completa: `ENTREGA_CLAUDE/08_WORKFLOW_UI_Y_ASSETS.md` §9.
