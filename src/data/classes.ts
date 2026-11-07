import type { ItemId } from './items';

export type ClassId = 'rider' | 'scribe' | 'healer' | 'infantry';

export interface ClassDef {
  id: ClassId;
  name: string;
  tagline: string;
  hands: [ItemId, ItemId];
  items: ItemId[]; // cycle list
  maxHealth: number;
  maxMagicka: number;
  maxStamina: number;
}

// Only Riders have magic (signets via the dragon bond). See docs/lore.md.
export const CLASSES: Record<ClassId, ClassDef> = {
  rider: {
    id: 'rider', name: 'Rider', tagline: 'Cross the Parapet. Bond a dragon. Many do not survive.',
    hands: ['lightning', 'dagger'], items: ['none', 'dagger', 'sword', 'lightning', 'fireball'],
    maxHealth: 100, maxMagicka: 100, maxStamina: 100,
  },
  infantry: {
    id: 'infantry', name: 'Infantry', tagline: 'The largest quadrant. Steel, discipline, endurance.',
    hands: ['dagger', 'sword'], items: ['none', 'dagger', 'sword'],
    maxHealth: 130, maxMagicka: 0, maxStamina: 125,
  },
  healer: {
    id: 'healer', name: 'Healer', tagline: 'Mend the wounded. No magic - only skill.',
    hands: ['salve', 'dagger'], items: ['none', 'dagger', 'salve'],
    maxHealth: 100, maxMagicka: 0, maxStamina: 100,
  },
  scribe: {
    id: 'scribe', name: 'Scribe', tagline: 'Keepers of the Archives. Record everything.',
    hands: ['none', 'dagger'], items: ['none', 'dagger', 'sword'],
    maxHealth: 100, maxMagicka: 0, maxStamina: 100,
  },
};
