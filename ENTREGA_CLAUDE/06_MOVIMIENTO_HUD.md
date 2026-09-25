# 06 · Lenguaje de movimiento del HUD

Referencia: grabación del HUD v1 (30,8 s, 30 fps) que el creador compartió el 25-09-2026. Guardada en `referencias/00-vision/hud-v1-movimiento.mp4`. Se midió fotograma a fotograma. Objetivo: **aspecto del HUD v2** (cristal oscuro, rojo y cian, `hudv2_*.jpeg`) con **el movimiento del v1**.

## Gramática medida en el v1

| Patrón | Qué pasa | Tiempo medido |
|---|---|---|
| **Nacer de una línea** | Aparece una línea fina de 1 px, se ilumina con remates en los extremos, engorda hasta barra y crece hasta el panel. El contenido se descubre a medida que crece. Al final encajan los corchetes de esquina. | Chip NIKON: 0,65 s (línea 0,1 · barra 0,2 · crecer 0,2 · corchetes 0,15) |
| **Construir por filas** | Una ventana alta nace del pie (una línea que se convierte en fila inferior) y sube fila a fila: 08:00-11:00 → 0/3 → RANK B → CAPTURE 3 → MAIN QUEST → THE SYSTEM. Al final, corchetes. | MAIN QUEST: 1,2 s (≈0,15-0,2 s por fila) |
| **Fogonazo de cristal** | El panel entra sobreexpuesto (verde saturado) y baja a su color de cristal; la foto interior aparece debajo. Después, un reflejo diagonal cruza el panel. | 0,3-0,5 s + reflejo ≈0,6 s |
| **Revelar datos** | Número pequeño que crece con marco de mira (85 %) → se transforma en letra de rango (B), primero blanca incandescente y después de su color → aparece +75XP → etiquetas escritas letra a letra → barras que se llenan en cascada con la punta brillante → descripción a máquina. | ≈1,9 s en total (9,9 s → 11,8 s) |
| **Encendido en secuencia** | Cada letra de rango se ilumina por turnos (blanco incandescente + halo + leve escala) y se apaga a su color con resplandor residual. | cada ≈0,4-0,5 s; subida ≈0,1 s, caída ≈0,3 s |
| **Selección** | La tarjeta elegida pasa a cristal esmerilado claro, crece un poco y la cruza un reflejo. Un pomo se desliza por un riel con estela y hace un «ping» (anillo) al llegar. | cambio de tarjeta 0,1-0,15 s · pomo ≈0,3 s · parada ≈0,6 s |
| **Salida por colapso** | Inverso de nacer: se van los corchetes, el panel se aplasta hasta una barra y luego una línea; un brillo la recorre y se apaga. | 0,55 s |
| **Salida por disolución** | El contenido se apaga, el panel se sobreexpone y se rompe en bloques de píxeles con líneas de glitch (rojas en MAIN QUEST). | 0,3-0,45 s |
| **Ambiente** | Reflejo diagonal que cruza los paneles de vez en cuando; etiquetas que se glitchean un instante; halo que «respira» en las letras grandes. Stamina y XP son barras vivas (XP sube de forma continua a lo largo del vídeo). | continuo |

Reglas que se deducen:

- Nada aparece «de golpe». Todo nace de una línea o de un fogonazo, y el contenido llega siempre después del marco.
- Las cosas grandes se construyen por partes, en orden de lectura.
- Lo que importa (rango, XP) pasa por blanco incandescente antes de tomar su color.
- Las salidas duran la mitad que las entradas.

## Traducción al HUD v2

| Componente v2 | Movimiento |
|---|---|
| Left Rail: PLAYER, INVENTORY/LOADOUT, STAMINA/TIME LEFT | Nacer de una línea, módulo a módulo de arriba abajo. Folded → Open → Pinned = crecer o colapsar. La barra de XP es verde y la de Stamina tiene segmentos amarillos que se encienden de uno en uno. TIME LEFT rojo con dígitos que parpadean al cambiar. |
| Top Bar: PROFILE, MAP, GEAR…, núcleo SYSTEM ONLINE | La barra nace desde el centro hacia los lados; el núcleo rojo con el ping de anillo. |
| Right Rail: ACTIVE MISSION, LOCATION, PHOTO OPPORTUNITIES | Construir por filas. El 0/3 se revela como dato. Las tarjetas 01-03 entran escalonadas. |
| Overlays POV: SYSTEM NOTIFICATION, marcador en suelo, CODEX ENTRY | Fogonazo de cristal y línea guía que se dibuja hasta el ancla. La notificación sale por disolución con glitch rojo. |
| Eventos: foto capturada, rango, subida de XP | Revelar datos y encendido en secuencia. Al ganar XP, la barra de PLAYER sube con la punta incandescente. |
| GEAR radial | Selección: sector esmerilado y ping al cambiar. |

En v2, los acentos del v1 (verde azulado) pasan a **rojo** (marcos, acentos, errores y salidas con glitch) y **cian** (datos, barras, selección), sobre cristal oscuro. El destello incandescente sigue siendo blanco.

Contrato: todo esto se expresa como funciones del tiempo del episodio (`evaluateFrame`), así que se puede mover el cabezal y exportar sin depender del reloj real. El episodio decide cuándo pasa cada cosa; el componente decide cómo.
