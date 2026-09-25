# 07 · Framework de los elementos del HUD

Acordado con el creador el 25-09-2026. Referencias:
- movimiento: `06_MOVIMIENTO_HUD.md`;
- estilo: `referencias/hudv2_*.jpeg`;
- pantalla CONFIGURE HUD: `referencias/configure_hud.webp`.

## 1. Cuatro capas

| Capa | Código | Qué contiene | Si cambia… |
|---|---|---|---|
| Tema | `app/src/hud/kit/theme.ts` (`THEME`) | Colores, tipografía, grosores, cristal, esquinas | …cambian todos los elementos |
| Kit de movimiento | `kit/motion.ts` + perillas `MotionKnobs` | Presencia (entrar y salir), transiciones de estado, reacciones a valores, ambiente, ráfagas de glitch | …se retoca el movimiento de todo el HUD |
| Piezas | `kit/pixi.ts` | Marco de panel, efectos (glitch con semilla y bloom), artefactos, barra con punta incandescente, retrato, textos | …cambia cada pieza en todos los elementos que la usan |
| Componentes | `app/src/hud/v2/` | Un cálculo puro (`evaluateX(t, input)`) y un dibujante PixiJS sin lógica de tiempo | …cambia solo ese elemento |

- El comportamiento común de un módulo de rail (presencia, los cinco estados, pulsos y ambiente) está en `kit/module.ts` (`moduleShell`). Cada módulo solo añade su contenido.
- `kit/sample.ts` es un panel hecho solo con piezas del kit (barra ámbar tipo STAMINA): demuestra el kit y es la plantilla de partida de un módulo nuevo.
- `app/src/hud/registry.ts` es el registro de elementos: cómo se crea, evalúa y dibuja cada tipo. Los lienzos, el catálogo y el editor solo hablan con él.

- El tema y las perillas se guardarán en la **HUD Template** (preset, variante visual, preset de movimiento).
- Cada componente trae aspecto y movimiento **fijos**; el creador solo edita valores.

## 2. Las cinco piezas de cada elemento

| Pieza | Quién decide | En el timeline |
|---|---|---|
| Presencia (ENTER y EXIT) | El episodio, cuándo | Keyframes de entrada y salida |
| Estado | El episodio, cuándo | Una forma (pista COMPACT, OPEN o PINNED, una a la vez) y dos interruptores independientes (pistas HOVER sí/no y DISABLED sí/no); por ejemplo, COMPACT + HOVER |
| Valores | Data Library (ficha) y episodio (XP, Stamina…) | Pistas; un único valor alimenta cifra y barra |
| Reacciones | El componente, solo | Nada: saltan al cambiar un valor (+150 XP, glitch, punta incandescente) o al reemplazarlo (PULSE: nombre o foto nuevos). PULSE no es un estado |
| Ambiente | El componente, solo | Nada: reflejo, microglitch y parpadeo de texto mientras se ve |

- HOVER no depende del cursor: el cursor de autoría nunca sale en el resultado, así que es un estado con keyframe.
- Las pistas de valor reaccionan al cambio (`reactiveNumber`). Por eso un salto de XP se anima como en un juego, en vez de deslizarse linealmente entre keys.

## 3. Tipos de elemento, según `WORKFLOW/catalog/components.json`

| Tipo | Elementos | Estados y ciclo |
|---|---|---|
| Módulo de rail | Left Rail: Player Profile, Inventory/Loadout, Gear Radial, Stamina, Time Left. Right Rail: Active Mission, Photo Opportunities, Location/Mini Map, Codex Compact | Presentaciones ICONO, COMPACT y OPEN. Forma COMPACT/OPEN/PINNED más HOVER y DISABLED sí/no. Además, presencia |
| Elemento de Top Bar | System Online, Navigation Tabs, Location Header | IDLE, HOVER, ACTIVE o SELECTED, DISABLED |
| Etiqueta POV anclada | Weather/Location, Person Identification, System Notification | Hidden → Appear → Visible → Exit. Posición con keyframes (a mano); más adelante, tracking |
| Tarjeta de evento POV | Photo Result, Quest Reveal, Level Up | Hidden → Appear (revelado largo por partes) → Visible → Exit |

## 4. Rails (contenedores)

**Modo del rail** (pista `rail.mode`): FOLDED, OPEN, PINNED y HIDDEN.

- **FOLDED (DOCK):**
  - arriba, la mini-tarjeta del PLAYER; debajo, una columna de iconos, uno por módulo;
  - la pista `rail.selected` (ninguno, o un módulo) abre **solo ese módulo** al lado de su icono, flotando sobre el vídeo;
  - secuencia: el icono hace «ping», sale una línea y el panel nace de ella;
  - al cambiar de módulo, el anterior se colapsa a su icono.
- **OPEN y PINNED:** los módulos van apilados, en el orden que marca la HUD Template.
  - Un módulo se compacta o se abre en su sitio (acordeón) y los de debajo se recolocan de forma animada.
  - PINNED es OPEN fijo.
- **Cascada:** el rail entra con sus módulos de arriba abajo y sale al revés.
- **FOLDED** es el modo del rail y **COMPACT**, la presentación de cada módulo.
- **El mismo componente** va dentro de un rail o suelto; solo cambia quién lo coloca.
- **Selecciones internas** (por ejemplo, el gajo del Gear Radial, pista `gear-radial.selection`): el radial gira paso a paso entre gajos, con «ping» y destello en cada uno.

## 5. El catálogo (ASSETS → UI COMPONENTS)

Se navega como un menú de juego: tres secciones grandes y solo se despliega la activa.

- **SYSTEM UI:** la interfaz de la app, como el botón neón. No se exporta.
- **HUD KIT:**
  - **THEME:** colores, barras de XP y Stamina, cristal y línea. Cambian en vivo en todos los elementos.
  - **MOTION:** las animaciones del kit, clasificadas en entrada y salida, estados, reacciones y ambiente, probadas sobre el panel de muestra. Incluye las perillas globales.
  - **PIECES:** las piezas en reposo. La carta es la de por defecto; un componente puede traer su variante.
- Tema y perillas se guardan en este navegador mientras llega la HUD Template.
- **HUD ELEMENTS:** cada zona se despliega con todos sus elementos; los pendientes salen en gris. Cada elemento tiene tres pestañas:
  - **EDIT** (primera): valores, estado (forma más HOVER y DISABLED), entrada y salida, y reacciones. Cada cambio es un keyframe.
  - **DEMO:** un fragmento de episodio con barra de tiempo.
  - **ALL STATES:** resumen de todos los estados en reposo.

## 6. Editar sin animar a mano

En el catálogo, y después en el editor de episodio, lo que el creador cambia en la vista previa crea un keyframe en el instante del cabezal. El componente hace su coreografía; los keyframes se arrastran para cambiar el ritmo.

## 7. Orden de trabajo

1. ✅ Tema, kit y piezas sacados del PLAYER. Estados COMPACT, OPEN, PINNED, HOVER y DISABLED, más vista ALL STATES.
2. Left Rail completo: PLAYER, STAMINA y TIME LEFT en el rail, con cascada, modo FOLDED (DOCK con iconos), despliegue lateral y recolocación.
3. Pantalla de tema y movimiento con vista previa de todos los elementos.
4. Resto del Left Rail, Right Rail, Top Bar, etiquetas POV y tarjetas de evento.
5. ✅ (adelantado) Catálogo reorganizado en SYSTEM UI, HUD KIT y HUD ELEMENTS. El paso 3 queda cubierto en parte por HUD KIT → THEME y MOTION.
