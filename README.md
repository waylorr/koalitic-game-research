# KOALITIC GAME — THE SYSTEM

Aplicación de autoría para colocar un **HUD de videojuego** (THE SYSTEM) sobre vídeos o imágenes ya montados de la serie KOALITIC GAME:
- perfil de jugador, stamina, radial de equipo, misiones…;
- se anima con keyframes en un timeline;
- se reutiliza entre episodios.

No es un juego 3D ni un editor de montaje de vídeo.

> **¿Eres una IA o una persona que llega sin contexto?** Lee primero [`ENTREGA_CLAUDE/09_ESTADO_Y_BITACORA.md`](ENTREGA_CLAUDE/09_ESTADO_Y_BITACORA.md): dice dónde estamos, qué se ha decidido y qué sigue. Las reglas de trabajo están en [`CLAUDE.md`](CLAUDE.md).

## Estado (25-09-2026)

- **App real en `app/`** (web: React + TypeScript + Vite, HUD dibujado con PixiJS 8):
  - menú principal con el arte del creador;
  - catálogo **ASSETS → UI COMPONENTS**, con tres secciones:
    - SYSTEM UI;
    - HUD KIT: tokens, movimiento y piezas;
    - HUD ELEMENTS por zonas.
- **Editor de episodio (primera versión):** imagen o vídeo de fondo, Left Rail y timeline con keyframes. Se añaden, mueven y borran; se reproduce y se busca cualquier instante. Se abre desde EPISODES.
- **Hechos en el catálogo:**
  - botón neón;
  - PLAYER PROFILE;
  - GEAR RADIAL;
  - LEFT RAIL en modo DOCK, con despliegue lateral de un módulo.
- **Pendientes:**
  - Stamina y Time Left reales;
  - Rail OPEN;
  - Right Rail, Top Bar y overlays POV;
  - la lista de episodios y Configure HUD;
  - guardar proyectos;
  - exportación.
- **Motor de tiempo probado:** cada fotograma se calcula a partir del tiempo, así que se puede saltar a cualquier instante con el mismo resultado exacto.
- **Ramas:**
  - `main`: versión estable, con todo lo hecho hasta el 25-09-2026;
  - `koalitic-game-0.1`: rama de trabajo;
  - `archive/main-h0`: el `main` antiguo (primera prueba técnica), archivado.

## Mapa del repositorio

| Ruta | Qué es |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Reglas del proyecto para agentes (producto, contratos, forma de trabajar) |
| [`ENTREGA_CLAUDE/`](ENTREGA_CLAUDE/) | Documentación del proyecto, numerada (ver tabla siguiente) |
| [`ENTREGA_CLAUDE/referencias/`](ENTREGA_CLAUDE/referencias/) | Referencias: `hudv2_*.jpeg` (HUD v2), `configure_hud.webp` (pantalla y radial), `00-vision/hud-v1-movimiento.mp4` (movimiento del HUD v1), `ASSETS ANTIGUOS/` (HUD v1) |
| [`WORKFLOW/`](WORKFLOW/) | Prototipo navegable anterior (`workflow.html`) y especificación viva del flujo: pantallas, catálogo de componentes (`catalog/components.json`) |
| [`app/`](app/) | La aplicación nueva (ver [`app/README.md`](app/README.md)) |
| `KOALITIC_GAME_MASTER_PROMPT.md` | Histórico; no seguir |

### Documentos (`ENTREGA_CLAUDE/`)

| Nº | Documento | Para qué sirve |
|---|---|---|
| 00 | `00_INICIO_CLAUDE_CODE.md` | El encargo inicial (histórico, se conserva tal cual) |
| 01 | `01_CONTEXTO_Y_ENCARGO.md` | Qué es KOALITIC, el producto y su alcance |
| 02 | `02_INVESTIGACION_TECNOLOGICA.md` | Investigación tecnológica previa (contexto, no decisión) |
| 03 | `03_ARBOL_UI_Y_ASSETS.md` | Árbol de pantallas, UI y assets |
| 04 | `04_WIREFRAME_Y_WORKFLOW.md` | Wireframe y flujo de trabajo del usuario |
| 05 | `05_AUDITORIA_Y_PROPUESTA.md` | Auditoría, stack, arquitectura, hitos H0–H4, resultados medidos de H0, registro de decisiones D1–D14 |
| 06 | `06_MOVIMIENTO_HUD.md` | Lenguaje de movimiento del HUD, medido fotograma a fotograma del vídeo v1 |
| 07 | `07_FRAMEWORK_HUD.md` | Framework de componentes: capas del kit, estados, rails, catálogo |
| 08 | `08_WORKFLOW_UI_Y_ASSETS.md` | Cómo preparar referencias (imágenes y vídeos) y cómo se fabrica cada pieza; librerías |
| 09 | `09_ESTADO_Y_BITACORA.md` | **Dónde estamos:** bitácora, estado de cada parte, decisiones, preguntas abiertas y siguientes pasos |

## Arrancar la app

```sh
cd app
npm install
npm run dev
```

Luego abre `http://localhost:5173` (editor: `http://localhost:5173/#episodes`; catálogo: `http://localhost:5173/#assets`; laboratorio del motor: `http://localhost:5173/lab.html`).

## Pruebas

```sh
cd app
npm run typecheck
npm test
npm run build && npm run e2e
```

- `npm test` pasa las pruebas de lógica (34).
- `npm run e2e` usa Chromium real: 36 comprobaciones de la app y 17 del laboratorio. La primera vez hace falta `npx playwright install chromium`.
- El prototipo anterior se prueba con `node WORKFLOW/smoke.mjs` y `node WORKFLOW/store-smoke.mjs`.
