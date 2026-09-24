import type { EpisodeDoc, Library } from './model';

/** Demo content taken from the HUD v2 references. Stable ids so tests and saved files agree. */
export const DEMO_LIBRARY: Library = {
  records: {
    rec_player_jordi: { id: 'rec_player_jordi', type: 'Player', name: 'JORDI', level: 12, defaultXp: 3250, xpGoal: 5000 },
    rec_player_arnau: { id: 'rec_player_arnau', type: 'Player', name: 'ARNAU', level: 8, defaultXp: 1800, xpGoal: 3000 },
    rec_gear_nikon: { id: 'rec_gear_nikon', type: 'Gear', name: 'Nikon Z5 II', spec: 'Mirrorless · 24MP FF', icon: 'camera' },
    rec_gear_2470: { id: 'rec_gear_2470', type: 'Gear', name: '24-70mm f/2.8 S', spec: 'Standard zoom', icon: 'lens' },
    rec_gear_insta: { id: 'rec_gear_insta', type: 'Gear', name: 'Insta360 X6', spec: '8K 360° action cam', icon: 'cam360' },
    rec_gear_xiaomi: { id: 'rec_gear_xiaomi', type: 'Gear', name: 'Xiaomi 17 Ultra', spec: '1" sensor', icon: 'phone' },
    rec_gear_skates: { id: 'rec_gear_skates', type: 'Gear', name: 'Skates', spec: 'Urban freeride', icon: 'skates' },
  },
};

const k = <V>(id: string, t: number, v: V) => ({ id, t, v });

/**
 * Stamina goes 100 → 80 between 01:00 and 01:30 (90 at 01:15) while the rail
 * is folded from 01:10; the rail opens again at 01:35 and shows the value of
 * that moment.
 */
export const DEMO_EPISODE: EpisodeDoc = {
  formatVersion: 1,
  id: 'ep_demo_girona',
  name: 'GIRONA · SPIKE',
  durationMs: 120_000,
  fps: 30,
  hud: { sourceTemplateId: 'tpl_hud_v1', leftRailMotion: 'smooth-reveal' },
  bindings: {
    player: 'rec_player_jordi',
    loadout: ['rec_gear_nikon', 'rec_gear_2470', 'rec_gear_insta', 'rec_gear_xiaomi', 'rec_gear_skates'],
  },
  tracks: {
    'left-rail.state': [
      k('key_rail_0', 0, 'Open'), k('key_rail_1', 20_000, 'Folded'), k('key_rail_2', 40_000, 'Open'),
      k('key_rail_3', 45_000, 'Pinned'), k('key_rail_4', 70_000, 'Folded'), k('key_rail_5', 95_000, 'Open'),
    ],
    'player-profile.xp': [k('key_xp_0', 0, 3250), k('key_xp_1', 50_000, 3250), k('key_xp_2', 56_000, 3450)],
    'gear-radial.selection': [k('key_sel_0', 0, 1), k('key_sel_1', 30_000, 3), k('key_sel_2', 52_000, 1)],
    'stamina.value': [k('key_sta_0', 0, 100), k('key_sta_1', 60_000, 100), k('key_sta_2', 90_000, 80), k('key_sta_3', 110_000, 22)],
  },
  overlays: [
    {
      id: 'ov_uneven_surface',
      componentId: 'system-notification',
      start: 24_000,
      end: 34_000,
      props: { title: 'SYSTEM NOTIFICATION', lines: ['UNEVEN SURFACE', 'NOT RECOMMENDED FOR SKATING'] },
      position: [k('key_pos_0', 24_000, { x: 55, y: 66 }), k('key_pos_1', 34_000, { x: 60, y: 63 })],
    },
  ],
};
