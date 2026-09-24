# KOALITIC app

Aplicación de autoría de KOALITIC GAME. Estado actual: **menú principal** con los botones de UI definitivos sobre el arte de fondo, **catálogo ASSETS → UI COMPONENTS** con el botón neón en todos sus estados, y pantallas EPISODES / CONFIGURE HUD en construcción. El **laboratorio del motor** (H0: evaluador temporal, HUD provisional, timeline mínima) sigue en `lab.html`. Plan y decisiones: [`../ENTREGA_CLAUDE/05_AUDITORIA_Y_PROPUESTA.md`](../ENTREGA_CLAUDE/05_AUDITORIA_Y_PROPUESTA.md).

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

`npm run e2e` ejecuta `e2e/app.e2e.mjs` (menú, navegación, catálogo, QUIT, escalado) y `e2e/lab.e2e.mjs` (determinismo del motor); capturas en `e2e/out/`.

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/app/` | armazón: pantallas, navegación por anclas (`#episodes`, `#configure-hud`, `#assets`) y fondos |
| `src/screens/` | menú principal, pantallas de destino, catálogo de componentes, SYSTEM OFFLINE |
| `src/ui/` | kit visual: escenario 1920×1080, logo, botón neón, sonidos y variables (`tokens.css`) |
| `public/backgrounds/` | fondos provisionales derivados de tus diseños (se sustituyen por el arte limpio) |
| `src/core/` | modelo, pistas, motion y `evaluateFrame` (TypeScript puro) |
| `src/hud/` | componentes HUD provisionales (THE SYSTEM) del laboratorio |
| `src/lab/` | laboratorio del motor (`lab.html`) |

Reglas: la app se maqueta en píxeles de un escenario fijo de 1920×1080 escalado a la ventana, como un juego. Cada componente de UI se aprueba primero en ASSETS → UI COMPONENTS. El HUD (THE SYSTEM) no usa transiciones ni animaciones CSS ni `will-change`: su movimiento se calcula desde el tiempo del episodio.
