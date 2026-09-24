import type { Ms } from './time';
import { easeOutCubic, linear, type Transition } from './motion';
import { evalClip, evalHold, evalNumber, evalStateVisual, evalVec2 } from './tracks';
import type { EpisodeDoc, GearIcon, Library, NotificationProps, RailMotionId, RailState } from './model';

/** Reusable motion presets: *how* a state change looks. The episode only says *when*. */
export const RAIL_MOTIONS: Readonly<Record<RailMotionId, Transition>> = {
  'smooth-reveal': { durationMs: 450, ease: easeOutCubic },
  snap: { durationMs: 0, ease: linear },
};
const RADIAL_TRANSITION: Transition = { durationMs: 220, ease: easeOutCubic };
const NOTIFICATION_ENTER_MS = 450;
const NOTIFICATION_EXIT_MS = 350;
export const RADIAL_SECTORS = 5;

const railVisual = (state: RailState): readonly number[] =>
  state === 'Folded' ? [0, 0] : state === 'Open' ? [1, 0] : [1, 1];
const radialVisual = (sector: number): readonly number[] =>
  Array.from({ length: RADIAL_SECTORS }, (_, i) => (i + 1 === sector ? 1 : 0));

export interface GearSlotView {
  readonly name: string;
  readonly spec: string;
  readonly icon: GearIcon;
}
export interface OverlayFrame {
  readonly id: string;
  readonly componentId: 'system-notification';
  readonly x: number;
  readonly y: number;
  readonly presence: number;
  readonly localT: Ms;
  readonly props: NotificationProps;
}
export interface HudFrame {
  readonly t: Ms;
  readonly leftRail: { readonly state: RailState; readonly openness: number; readonly pin: number };
  readonly player: { readonly name: string; readonly level: number; readonly xp: number; readonly xpGoal: number } | null;
  readonly stamina: { readonly value: number };
  readonly radial: {
    readonly selected: number;
    readonly progress: number;
    readonly weights: readonly number[];
    readonly slots: readonly (GearSlotView | null)[];
  };
  readonly overlays: readonly OverlayFrame[];
}

/**
 * The whole HUD at episode time t, as plain data. Pure: no DOM, no clock, no
 * memory of previous frames. Preview, scrub, reopen and a future exporter all
 * call this same function. Hidden children keep evaluating (stamina and XP are
 * computed even while the rail is folded).
 */
export function evaluateFrame(doc: EpisodeDoc, library: Library, t: Ms): HudFrame {
  const rail = evalStateVisual(doc.tracks['left-rail.state'], t, 'Open', railVisual, RAIL_MOTIONS[doc.hud.leftRailMotion]);
  const record = doc.bindings.player ? library.records[doc.bindings.player] : undefined;
  const playerRecord = record?.type === 'Player' ? record : null;
  const selection = evalStateVisual(doc.tracks['gear-radial.selection'], t, 1, radialVisual, RADIAL_TRANSITION);
  const slots = Array.from({ length: RADIAL_SECTORS }, (_, i) => {
    const id = doc.bindings.loadout[i];
    const gear = id ? library.records[id] : undefined;
    return gear?.type === 'Gear' ? { name: gear.name, spec: gear.spec, icon: gear.icon } : null;
  });
  const overlays: OverlayFrame[] = [];
  for (const item of doc.overlays) {
    const clip = evalClip(item.start, item.end, t, NOTIFICATION_ENTER_MS, NOTIFICATION_EXIT_MS, easeOutCubic);
    if (!clip.active) continue;
    const at = evalVec2(item.position, t, { x: 50, y: 50 });
    overlays.push({ id: item.id, componentId: item.componentId, x: at.x, y: at.y, presence: clip.presence, localT: clip.localT, props: item.props });
  }
  return {
    t,
    leftRail: { state: rail.value, openness: rail.visual[0] ?? 1, pin: rail.visual[1] ?? 0 },
    player: playerRecord && {
      name: playerRecord.name,
      level: playerRecord.level,
      xp: evalNumber(doc.tracks['player-profile.xp'], t, playerRecord.defaultXp),
      xpGoal: playerRecord.xpGoal,
    },
    stamina: { value: evalNumber(doc.tracks['stamina.value'], t, 100) },
    radial: {
      selected: evalHold(doc.tracks['gear-radial.selection'], t, 1),
      progress: selection.progress,
      weights: selection.visual,
      slots,
    },
    overlays,
  };
}
