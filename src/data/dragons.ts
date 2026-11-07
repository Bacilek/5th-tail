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

// Species a rider can bond at the Threshing (colors/tails per lore; individual names are invented)
export const BOND_SPECIES: { color: string; hex: number; tail: TailType }[] = [
  { color: 'Red', hex: 0xa02a20, tail: 'scorpion' },
  { color: 'Brown', hex: 0x6b4a2c, tail: 'sword' },
  { color: 'Green', hex: 0x3f8a4a, tail: 'club' },
  { color: 'Orange', hex: 0xc8691f, tail: 'morningstar' },
  { color: 'Blue', hex: 0x2c4f9a, tail: 'dagger' },
  { color: 'Black', hex: 0x15161c, tail: 'dagger' },
];
export const BOND_NAMES = ['Kaelith', 'Vorrik', 'Syrene', 'Ashar', 'Drovak', 'Illyra', 'Taveth', 'Morgrim'];

export const DRAGONS: DragonSpec[] = [
  { name: 'Tairn', color: 0x15161c, tail: 'dagger', size: 1.25 },
  { name: 'Sgaeyl', color: 0x2c4f9a, tail: 'dagger', size: 1.1 },
  { name: 'Andarna', color: 0xd7b04a, tail: 'feather', size: 0.6 },
  { name: 'Teine', color: 0x3f8a4a, tail: 'club', size: 1.0 },
  { name: 'Aotrom', color: 0x6b4a2c, tail: 'sword', size: 0.95 },
  { name: 'Red Scorpiontail', color: 0xa02a20, tail: 'scorpion', size: 1.0 },
  { name: 'Orange Morningstartail', color: 0xc8691f, tail: 'morningstar', size: 0.9 },
];
