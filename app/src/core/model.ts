import type { Ms } from './time';
import type { Track, Vec2 } from './tracks';

/**
 * Spike subset of the project model. Shapes follow the proposal (stable ids,
 * record references, one track per channel) so H1 can extend them instead of
 * replacing them.
 */
export type RailState = 'Folded' | 'Open' | 'Pinned';
export const RAIL_STATES: readonly RailState[] = ['Folded', 'Open', 'Pinned'];

export type GearIcon = 'camera' | 'lens' | 'cam360' | 'phone' | 'skates';

export interface PlayerRecord {
  readonly id: string;
  readonly type: 'Player';
  readonly name: string;
  readonly level: number;
  readonly defaultXp: number;
  readonly xpGoal: number;
}
export interface GearRecord {
  readonly id: string;
  readonly type: 'Gear';
  readonly name: string;
  readonly spec: string;
  readonly icon: GearIcon;
}
export type DataRecord = PlayerRecord | GearRecord;
export interface Library {
  readonly records: Readonly<Record<string, DataRecord>>;
}

/** Value stored by each channel. A channel is the single source of a value; number and bar are views of it. */
export interface ChannelValues {
  'left-rail.state': RailState;
  'player-profile.xp': number;
  'stamina.value': number;
  'gear-radial.selection': number;
}
export type ChannelId = keyof ChannelValues;
export type EpisodeTracks = { readonly [K in ChannelId]: Track<ChannelValues[K]> };

/** Timeline row contract: zone → component → child → property. */
export interface ChannelDef {
  readonly id: ChannelId;
  readonly zone: string;
  readonly component: string | null;
  readonly child: string;
  readonly label: string;
  readonly interpolation: 'hold' | 'linear';
  readonly min?: number;
  readonly max?: number;
}

export const CHANNELS: readonly ChannelDef[] = [
  { id: 'left-rail.state', zone: 'LEFT RAIL', component: null, child: 'Panel State', label: 'Folded / Open / Pinned', interpolation: 'hold' },
  { id: 'player-profile.xp', zone: 'LEFT RAIL', component: 'PLAYER PROFILE', child: 'XP Value', label: 'XP (number + bar)', interpolation: 'linear', min: 0 },
  { id: 'gear-radial.selection', zone: 'LEFT RAIL', component: 'GEAR RADIAL', child: 'Center Selection', label: 'Selected sector', interpolation: 'hold', min: 1, max: 5 },
  { id: 'stamina.value', zone: 'LEFT RAIL', component: 'STAMINA', child: 'Value', label: 'Stamina % (number + bar)', interpolation: 'linear', min: 0, max: 100 },
];

export interface NotificationProps {
  readonly title: string;
  readonly lines: readonly string[];
}
export interface OverlayInstance {
  readonly id: string;
  readonly componentId: 'system-notification';
  readonly start: Ms;
  readonly end: Ms;
  readonly props: NotificationProps;
  /** Manual anchor points in % of the 16:9 stage; no tracking. */
  readonly position: Track<Vec2>;
}

export type RailMotionId = 'smooth-reveal' | 'snap';

export interface EpisodeDoc {
  readonly formatVersion: 1;
  readonly id: string;
  readonly name: string;
  readonly durationMs: Ms;
  readonly fps: number;
  /** Episode copy of the template composition (for now only the rail motion preset). */
  readonly hud: { readonly sourceTemplateId: string; readonly leftRailMotion: RailMotionId };
  /** Record ids, never record copies. */
  readonly bindings: { readonly player: string | null; readonly loadout: readonly (string | null)[] };
  readonly tracks: EpisodeTracks;
  readonly overlays: readonly OverlayInstance[];
}

export const newId = (prefix: string): string => `${prefix}_${crypto.randomUUID()}`;
