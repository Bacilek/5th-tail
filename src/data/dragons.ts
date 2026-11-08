// Species from Fourth Wing lore (see docs/lore.md). Tail types: scorpion, dagger, morningstar, sword, club, feather.
export type TailType = 'scorpion' | 'dagger' | 'morningstar' | 'sword' | 'club' | 'feather';

export interface DragonSpec {
  name: string;
  color: number;
  tail: TailType;
  size: number;
}

export interface TailAttack { name: string; damage: number; radius: number; cost: number; cooldown: number; }

// Tail strike per tail type (lands at the tail tip, behind the dragon)
export const TAIL_ATTACKS: Record<TailType, TailAttack> = {
  dagger: { name: 'Tail Pierce', damage: 70, radius: 4, cost: 15, cooldown: 1.3 },
  sword: { name: 'Tail Sweep', damage: 45, radius: 8, cost: 15, cooldown: 1.2 },
  club: { name: 'Tail Slam', damage: 50, radius: 10, cost: 20, cooldown: 1.5 },
  morningstar: { name: 'Tail Whirl', damage: 40, radius: 12, cost: 20, cooldown: 1.5 },
  scorpion: { name: 'Venom Strike', damage: 55, radius: 5, cost: 15, cooldown: 1.3 },
  feather: { name: 'Feather Flick', damage: 10, radius: 5, cost: 5, cooldown: 0.8 },
};

/**
 * Species a rider can bond at the Threshing. `weight` = how often a dragon of this kind turns up on the field,
 * `accept` = how likely it is to accept a given rider instead of burning them (lower = pickier).
 * Colors/tails and the general "daggertails are the rarest and hardest" idea come from the books; the exact
 * percentages are invented (see docs/lore.md).
 */
export interface Species {
  color: string; hex: number; tail: TailType;
  weight: number; accept: number; rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  size: number; note: string;
}
export const BOND_SPECIES: Species[] = [
  { color: 'Brown', hex: 0x6b4a2c, tail: 'sword', weight: 30, accept: 0.8, rarity: 'common', size: 0.95, note: 'steady and loyal' },
  { color: 'Orange', hex: 0xc8691f, tail: 'morningstar', weight: 22, accept: 0.7, rarity: 'common', size: 0.9, note: 'hot-tempered' },
  { color: 'Red', hex: 0xa02a20, tail: 'scorpion', weight: 18, accept: 0.55, rarity: 'uncommon', size: 1.0, note: 'venomous and proud' },
  { color: 'Green', hex: 0x3f8a4a, tail: 'club', weight: 14, accept: 0.6, rarity: 'uncommon', size: 1.0, note: 'strong and stubborn' },
  { color: 'Blue', hex: 0x2c4f9a, tail: 'dagger', weight: 8, accept: 0.35, rarity: 'rare', size: 1.1, note: 'fierce and picky' },
  { color: 'Black', hex: 0x15161c, tail: 'dagger', weight: 5, accept: 0.25, rarity: 'rare', size: 1.25, note: 'the deadliest, and the pickiest' },
  { color: 'Golden', hex: 0xd7b04a, tail: 'feather', weight: 3, accept: 0.5, rarity: 'legendary', size: 0.6, note: 'tiny, old and strange' },
];
export const BOND_NAMES = ['Kaelith', 'Vorrik', 'Syrene', 'Ashar', 'Drovak', 'Illyra', 'Taveth', 'Morgrim', 'Zelath', 'Orrin', 'Sethra', 'Brannoch'];

/** Weighted random species (optionally excluding some). */
export function rollSpecies(exclude: Species[] = []): Species {
  const pool = BOND_SPECIES.filter((s) => !exclude.includes(s));
  let r = Math.random() * pool.reduce((a, s) => a + s.weight, 0);
  for (const s of pool) { r -= s.weight; if (r <= 0) return s; }
  return pool[0];
}

export const DRAGONS: DragonSpec[] = [
  { name: 'Tairn', color: 0x15161c, tail: 'morningstar', size: 1.25 },
  { name: 'Sgaeyl', color: 0x2c4f9a, tail: 'dagger', size: 1.1 },
  { name: 'Andarna', color: 0xd7b04a, tail: 'feather', size: 0.6 },
  { name: 'Teine', color: 0x3f8a4a, tail: 'club', size: 1.0 },
  { name: 'Cath', color: 0xa02a20, tail: 'sword', size: 1.0 },
  { name: 'Feirge', color: 0x3f8a4a, tail: 'dagger', size: 0.95 },
  { name: 'Aotrom', color: 0x6b4a2c, tail: 'sword', size: 0.95 },
  { name: 'Red Scorpiontail', color: 0xa02a20, tail: 'scorpion', size: 1.0 },
  { name: 'Orange Morningstartail', color: 0xc8691f, tail: 'morningstar', size: 0.9 },
];
