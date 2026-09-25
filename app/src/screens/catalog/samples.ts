import type { GearInput, GearSlot } from '../../hud/v2/gear';
import type { PlayerInput } from '../../hud/v2/player';
import type { RailInput, RailModuleDef } from '../../hud/v2/rail';
import type { SampleInput } from '../../hud/kit/sample';
import type { HudItem } from '../../hud/registry';
import { PORTRAIT, key } from './kitState';

/**
 * Demo data for the catalog (the Data Library will provide the real records)
 * and the gallery of every HUD element, used by HUD KIT pages so a new
 * component shows up next to the others as soon as it is added here.
 */
export const PLAYER_RECORD = { name: 'KOALITIC', level: 12, nextLevelXp: 5000, photo: PORTRAIT };

export const GEAR_SLOTS: readonly GearSlot[] = [
  { name: 'NIKON Z5 II', spec: 'MIRRORLESS · 24MP FULL FRAME', icon: 'camera' },
  { name: '24-70MM', spec: 'F/2.8 S · STANDARD ZOOM', icon: 'lens' },
  { name: 'INSTA360 X6', spec: '8K 360° · ACTION CAM', icon: 'cam360' },
  { name: 'XIAOMI 17 ULTRA', spec: '1" SENSOR · TELEPHOTO', icon: 'phone' },
  { name: 'SKATES', spec: 'URBAN FREERIDE · ALL TERRAIN', icon: 'skates' },
  { name: 'TRIPOD', spec: 'CARBON FIBER · LIGHTWEIGHT', icon: 'tripod' },
];

/** Left Rail modules in the order of the HUD v2 designs. */
export const RAIL_MODULES: readonly RailModuleDef[] = [
  { id: 'inventory', label: 'INVENTORY', icon: 'bag' },
  { id: 'camera', label: 'CAMERA', icon: 'camera' },
  { id: 'gear', label: 'GEAR', icon: 'tools' },
  { id: 'stamina', label: 'STAMINA', icon: 'bolt' },
  { id: 'time', label: 'TIME LEFT', icon: 'clock' },
];

const shell = { enterAt: 0, exitAt: null, layout: [key(0, 'Open' as const)], hover: [], disabled: [], pulses: [] };
export const PLAYER_SAMPLE: PlayerInput = { ...shell, record: PLAYER_RECORD, xp: [key(0, 3250)] };
export const GEAR_SAMPLE: GearInput = { ...shell, slots: GEAR_SLOTS, selection: [key(0, 0)] };
export const STAMINA_SAMPLE: SampleInput = { ...shell, title: 'STAMINA', value: [key(0, 72)] };
export const RAIL_SAMPLE: RailInput = {
  enterAt: 0, exitAt: null,
  player: { record: PLAYER_RECORD, xp: [key(0, 3250)] },
  modules: RAIL_MODULES,
  selected: [key(0, ''), key(900, 'gear')],
  gear: { slots: GEAR_SLOTS, selection: [key(0, 0)] },
  stamina: [key(0, 72)],
};

/** Every HUD element at rest, laid out on one 720×360 canvas (HUD KIT → THEME). */
export function gallery(t: number): HudItem[] {
  return [
    { key: 'g-rail', kind: 'rail', t, input: RAIL_SAMPLE, x: 18, y: 14, scale: 0.8 },
    { key: 'g-player', kind: 'player', t, input: PLAYER_SAMPLE, x: 300, y: 18, scale: 0.78 },
    { key: 'g-stamina', kind: 'sample', t, input: STAMINA_SAMPLE, x: 300, y: 158, scale: 0.78 },
    { key: 'g-gear', kind: 'gear', t, input: GEAR_SAMPLE, x: 572, y: 12, scale: 0.4 },
  ];
}
export const GALLERY_LABELS = [
  { text: 'LEFT RAIL · DOCK', x: 18, y: 2 },
  { text: 'PLAYER PROFILE', x: 300, y: 4 },
  { text: 'KIT PANEL (STAMINA)', x: 300, y: 144 },
  { text: 'GEAR RADIAL', x: 572, y: 2 },
];
