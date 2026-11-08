export type HairStyle = 'short' | 'long' | 'buns' | 'buzzed' | 'bald';

export interface Look {
  name: string;
  /** body model: false = male build, true = female build */
  female?: boolean;
  skin: number;
  hair: number;
  hairStyle: HairStyle;
  beard?: boolean;
  cloth: number;
}

export const SKIN_TONES = [0xf1d3b8, 0xd9b69a, 0xc08e6a, 0x9a6a46, 0x6e4a32, 0x4a3022];
export const HAIR_COLORS = [0x0e0a08, 0x3a2418, 0x6a4a28, 0xa6803c, 0xd8c070, 0x8a2a1e, 0xc8c8d0, 0x2a3a6a];
export const CLOTH_COLORS = [0x1d2030, 0x3a1a1a, 0x1f3a2a, 0x3a2a4a, 0x4a3a1a, 0x2a3a4a];
export const HAIR_STYLES: HairStyle[] = ['short', 'long', 'buns', 'buzzed', 'bald'];

export const DEFAULT_LOOK: Look = { name: 'Cadet', skin: SKIN_TONES[1], hair: HAIR_COLORS[1], hairStyle: 'short', cloth: CLOTH_COLORS[0] };
