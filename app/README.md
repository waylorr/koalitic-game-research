# KOALITIC app — H0 (prueba técnica)

Aplicación nueva de autoría. Por ahora solo contiene la prueba técnica H0: HUD en DOM/SVG a 1920×1080 sobre vídeo o imagen, evaluador temporal puro, búsqueda en la timeline y edición de puntos. **No guarda nada.** Decisión, arquitectura y hitos: [`../ENTREGA_CLAUDE/05_AUDITORIA_Y_PROPUESTA.md`](../ENTREGA_CLAUDE/05_AUDITORIA_Y_PROPUESTA.md).

## Abrir

```sh
npm install
npm run dev        # http://localhost:5173 — carga tu MP4 con «LOAD YOUR VIDEO / IMAGE»
```

## Probar

```sh
npm run typecheck
npm test                      # núcleo (Vitest)
npm run build && npm run e2e  # Chromium real (Playwright); la primera vez: npx playwright install chromium
```

`npm run e2e` escribe capturas y `results.json` en `e2e/out/`.

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/core/` | modelo, pistas, motion y `evaluateFrame` (TypeScript puro, sin React ni DOM) |
| `src/hud/` | componentes HUD y escenario lógico 1920×1080; `hud.css` concentra las variables visuales |
| `src/spike/` | página de prueba: reloj, reproducción, timeline mínima e inspector |
| `e2e/` | determinismo (saltar = reproducir), clics del radial, rendimiento y reloj de vídeo |
| `public/test-media/` | fondo recortado de hudv2_2, rejilla neutra y vídeo VP9 con contador |

Regla del HUD: sin transiciones ni animaciones CSS y sin `will-change`; todo movimiento se calcula desde el tiempo del episodio.
