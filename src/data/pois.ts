export type PoiKind = 'tower' | 'citadel' | 'quad' | 'field' | 'gauntlet' | 'village' | 'camp' | 'race' | 'bridge' | 'hall';

export interface Poi { id: string; name: string; x: number; z: number; kind: PoiKind; }

/** Important places shown on the minimap and the world map. */
export const POIS: Poi[] = [
  { id: 'assembly', name: 'Conscription Day Square', x: 0, z: 14, kind: 'hall' },
  { id: 'admin', name: 'Administration', x: 0, z: -32, kind: 'hall' },
  { id: 'tower', name: 'Conscription Tower', x: 40, z: -20, kind: 'tower' },
  { id: 'parapet', name: 'The Parapet', x: 68, z: -20, kind: 'bridge' },
  { id: 'citadel', name: 'Riders Quadrant - Citadel', x: 108, z: -22, kind: 'citadel' },
  { id: 'gauntlet', name: 'The Gauntlet', x: 160, z: -22, kind: 'gauntlet' },
  { id: 'field', name: 'Flight Field', x: 234, z: -15, kind: 'field' },
  { id: 'archives', name: 'Scribe Quadrant - Archives', x: -100, z: -34, kind: 'quad' },
  { id: 'healers', name: 'Healer Quadrant', x: 0, z: 78, kind: 'quad' },
  { id: 'infantry', name: 'Infantry Quadrant', x: 0, z: -100, kind: 'quad' },
  { id: 'village', name: 'Basgiath Village', x: -90, z: 87, kind: 'village' },
  { id: 'camp', name: 'Venin Camp', x: 96, z: 125, kind: 'camp' },
  { id: 'race', name: 'Broom Race Start', x: 0, z: 50, kind: 'race' },
];

export const POI_COLORS: Record<PoiKind, string> = {
  tower: '#ffd98a', citadel: '#ff8a7a', quad: '#9fe3b5', field: '#ffe9b0', gauntlet: '#ffb060',
  village: '#c9a8ff', camp: '#ff5a4a', race: '#7ad0ff', bridge: '#ffd98a', hall: '#d8d8e8',
};
