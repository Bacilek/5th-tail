// Species from Fourth Wing lore (see docs/lore.md). Tail types: scorpion, dagger, morningstar, sword, club, feather.
export type TailType = 'scorpion' | 'dagger' | 'morningstar' | 'sword' | 'club' | 'feather';

export interface DragonSpec {
  name: string;
  color: number;
  tail: TailType;
  size: number;
}

export const DRAGONS: DragonSpec[] = [
  { name: 'Tairn', color: 0x15161c, tail: 'dagger', size: 1.25 },
  { name: 'Sgaeyl', color: 0x2c4f9a, tail: 'dagger', size: 1.1 },
  { name: 'Andarna', color: 0xd7b04a, tail: 'feather', size: 0.6 },
  { name: 'Teine', color: 0x3f8a4a, tail: 'club', size: 1.0 },
  { name: 'Aotrom', color: 0x6b4a2c, tail: 'sword', size: 0.95 },
  { name: 'Red Scorpiontail', color: 0xa02a20, tail: 'scorpion', size: 1.0 },
  { name: 'Orange Morningstartail', color: 0xc8691f, tail: 'morningstar', size: 0.9 },
];
