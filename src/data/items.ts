export type ItemId = 'none' | 'sword' | 'dagger' | 'fireball' | 'lightning';

export interface Item {
  id: ItemId;
  name: string;
  kind: 'none' | 'melee' | 'spell';
  cost: number; // stamina (melee) or magicka (spell)
  damage: number;
  cooldown: number;
  range: number;
}

export const ITEMS: Record<ItemId, Item> = {
  none: { id: 'none', name: 'Empty hand', kind: 'none', cost: 0, damage: 0, cooldown: 0, range: 0 },
  sword: { id: 'sword', name: 'Steel Sword', kind: 'melee', cost: 14, damage: 28, cooldown: 0.55, range: 3.0 },
  dagger: { id: 'dagger', name: 'Rider Dagger', kind: 'melee', cost: 7, damage: 13, cooldown: 0.3, range: 2.2 },
  fireball: { id: 'fireball', name: 'Fireball', kind: 'spell', cost: 22, damage: 35, cooldown: 0.7, range: 80 },
  lightning: { id: 'lightning', name: 'Lightning (signet)', kind: 'spell', cost: 9, damage: 16, cooldown: 0.25, range: 35 },
};

export const CYCLE: ItemId[] = ['none', 'sword', 'dagger', 'fireball', 'lightning'];
