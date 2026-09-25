import { snapToFrame, type Ms } from '../core/time';
import { lastKeyIndex, upsertKey, type Key, type Track } from '../core/tracks';
import type { GearSlot } from '../hud/v2/gear';
import type { PlayerRecordView } from '../hud/v2/player';
import type { RailInput, RailModuleDef } from '../hud/v2/rail';

/**
 * Episode document of the editor (first slice): a background image or video and the
 * keyframed tracks of the Left Rail, organised zone → component → property as
 * the timeline shows them. Record values (player, loadout) come from the Data
 * Library; the episode only decides WHEN things change (CLAUDE.md).
 * Pure data and pure functions: the editor UI and the HUD both read this.
 */
export const EPISODE_FPS = 30;

export interface EpisodeTracks {
  /** Rail on screen (true) or not (false): the first true enters, the next false exits. */
  readonly 'rail.visible': Track<boolean>;
  /** Module open beside its icon in DOCK mode ('' = none). */
  readonly 'rail.selected': Track<string>;
  readonly 'player.xp': Track<number>;
  readonly 'gear.selection': Track<number>;
  readonly 'stamina.value': Track<number>;
}
export type TrackId = keyof EpisodeTracks;

export interface EpisodeDoc {
  readonly version: 1;
  readonly name: string;
  readonly durationMs: Ms;
  readonly background: string;
  /** The background is a still image or a video; a video also sets the episode duration and is the clock while playing. */
  readonly backgroundKind?: 'image' | 'video';
  readonly player: PlayerRecordView;
  readonly modules: readonly RailModuleDef[];
  readonly slots: readonly GearSlot[];
  readonly tracks: EpisodeTracks;
}

export type TrackKind = 'bool' | 'module' | 'slot' | 'number';
export interface TrackDef {
  readonly id: TrackId;
  readonly zone: string;
  readonly component: string;
  readonly property: string;
  readonly kind: TrackKind;
  readonly min?: number;
  readonly max?: number;
}

/** Timeline rows, in display order (zone → component → property). */
export const TRACK_DEFS: readonly TrackDef[] = [
  { id: 'rail.visible', zone: 'LEFT RAIL', component: 'RAIL', property: 'ON SCREEN', kind: 'bool' },
  { id: 'rail.selected', zone: 'LEFT RAIL', component: 'RAIL', property: 'OPEN MODULE', kind: 'module' },
  { id: 'player.xp', zone: 'LEFT RAIL', component: 'PLAYER', property: 'XP', kind: 'number', min: 0, max: 99999 },
  { id: 'gear.selection', zone: 'LEFT RAIL', component: 'GEAR RADIAL', property: 'SELECTED ITEM', kind: 'slot' },
  { id: 'stamina.value', zone: 'LEFT RAIL', component: 'STAMINA', property: 'VALUE %', kind: 'number', min: 0, max: 100 },
];

let serial = 0;
export const newKeyId = () => `key_${Date.now().toString(36)}_${(serial++).toString(36)}`;
const k = <V,>(t: Ms, v: V): Key<V> => ({ id: newKeyId(), t, v });

export const snap = (ms: Ms) => snapToFrame(Math.max(0, ms), EPISODE_FPS);

/** Holding value of a track at t (the value the inspector edits). */
export function valueAt<V>(track: Track<V>, t: Ms, fallback: V): V {
  if (track.length === 0) return fallback;
  const i = lastKeyIndex(track, t);
  return (i < 0 ? track[0]! : track[i]!).v;
}

/** Set a value at t: a key there is updated, otherwise one is inserted. */
export function setKey<V>(doc: EpisodeDoc, id: TrackId, t: Ms, v: V): EpisodeDoc {
  const track = doc.tracks[id] as unknown as Track<V>;
  return { ...doc, tracks: { ...doc.tracks, [id]: upsertKey(track, snap(t), v, newKeyId) } };
}

/** Move a key to a new time; a key already at that time is replaced. */
export function moveKey(doc: EpisodeDoc, id: TrackId, keyId: string, t: Ms): EpisodeDoc {
  const track = doc.tracks[id] as Track<unknown>;
  const key = track.find(x => x.id === keyId);
  if (!key) return doc;
  const time = Math.min(snap(t), doc.durationMs);
  const rest = track.filter(x => x.id !== keyId && x.t !== time);
  const next = [...rest, { ...key, t: time }].sort((a, b) => a.t - b.t);
  return { ...doc, tracks: { ...doc.tracks, [id]: next } };
}

/** Delete a key; the first key of a track is its initial value and is kept. */
export function deleteKey(doc: EpisodeDoc, id: TrackId, keyId: string): EpisodeDoc {
  const track = doc.tracks[id] as Track<unknown>;
  if (track.length <= 1) return doc;
  return { ...doc, tracks: { ...doc.tracks, [id]: track.filter(x => x.id !== keyId) } };
}

/** Presence from the visibility track: first `true` enters, the next `false` exits. */
export function presenceOf(track: Track<boolean>): { enterAt: number; exitAt: number | null } {
  const on = track.findIndex(x => x.v);
  if (on < 0) return { enterAt: Number.POSITIVE_INFINITY, exitAt: null };
  const off = track.slice(on + 1).find(x => !x.v);
  return { enterAt: track[on]!.t, exitAt: off ? off.t : null };
}

/** The Left Rail's input at any time comes straight from the tracks. */
export function railInput(doc: EpisodeDoc): RailInput {
  const { enterAt, exitAt } = presenceOf(doc.tracks['rail.visible']);
  return {
    enterAt,
    exitAt,
    player: { record: doc.player, xp: doc.tracks['player.xp'] },
    modules: doc.modules,
    selected: doc.tracks['rail.selected'],
    gear: { slots: doc.slots, selection: doc.tracks['gear.selection'] },
    stamina: doc.tracks['stamina.value'],
  };
}

/** A small demo episode so the editor opens in a working state. */
export function demoEpisode(background: string, player: PlayerRecordView, modules: readonly RailModuleDef[], slots: readonly GearSlot[]): EpisodeDoc {
  return {
    version: 1,
    name: 'EP01 · GIRONA GREENWAY',
    durationMs: 20000,
    background,
    player,
    modules,
    slots,
    tracks: {
      'rail.visible': [k(0, false), k(500, true), k(18500, false)],
      'rail.selected': [k(0, ''), k(3000, 'gear'), k(8000, 'stamina'), k(11000, ''), k(13000, 'gear'), k(16000, '')],
      'player.xp': [k(0, 3250), k(6000, 3400), k(14500, 3650)],
      'gear.selection': [k(0, 0), k(4500, 1), k(6000, 4), k(14000, 3)],
      'stamina.value': [k(0, 82), k(9000, 60), k(10200, 45)],
    },
  };
}
