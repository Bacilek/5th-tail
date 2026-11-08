export type ItemId =
  | 'none' | 'sword' | 'dagger' | 'axe' | 'mace' | 'greatsword' | 'spear' | 'shield'
  | 'bow' | 'crossbow' | 'knives' | 'fireball' | 'lightning' | 'salve';

export interface Item {
  id: ItemId;
  name: string;
  kind: 'none' | 'melee' | 'shield' | 'ranged' | 'spell' | 'heal';
  cost: number; // stamina (melee/ranged) or magicka (spell)
  damage: number;
  cooldown: number;
  range: number;
  /** melee: minimum dot product of the hit cone (smaller = wider arc) */
  arc?: number;
  /** melee: stagger seconds on a light hit / knockback speed */
  stagger?: number;
  knock?: number;
  /** ranged: seconds to fully draw (0 = instant) */
  draw?: number;
  /** shield: damage taken while blocking and stamina cost factor */
  block?: { reduce: number; cost: number };
}

export const ITEMS: Record<ItemId, Item> = {
  none: { id: 'none', name: 'Empty hand', kind: 'none', cost: 0, damage: 0, cooldown: 0, range: 0 },
  dagger: { id: 'dagger', name: 'Rider Dagger', kind: 'melee', cost: 7, damage: 13, cooldown: 0.3, range: 2.2, arc: 0.3, stagger: 0.2, knock: 2 },
  sword: { id: 'sword', name: 'Steel Sword', kind: 'melee', cost: 14, damage: 28, cooldown: 0.55, range: 3.0, arc: 0.35, stagger: 0.28, knock: 3 },
  axe: { id: 'axe', name: 'Battle Axe', kind: 'melee', cost: 13, damage: 25, cooldown: 0.6, range: 2.8, arc: 0.2, stagger: 0.3, knock: 3 },
  mace: { id: 'mace', name: 'Iron Mace', kind: 'melee', cost: 16, damage: 26, cooldown: 0.75, range: 2.7, arc: 0.35, stagger: 0.55, knock: 5 },
  greatsword: { id: 'greatsword', name: 'Greatsword', kind: 'melee', cost: 24, damage: 50, cooldown: 1.1, range: 3.7, arc: 0.1, stagger: 0.5, knock: 6 },
  spear: { id: 'spear', name: 'War Spear', kind: 'melee', cost: 11, damage: 21, cooldown: 0.65, range: 4.6, arc: 0.75, stagger: 0.2, knock: 2 },
  shield: { id: 'shield', name: 'Wing Shield', kind: 'shield', cost: 10, damage: 6, cooldown: 0.6, range: 2.2, block: { reduce: 0.08, cost: 0.55 } },
  bow: { id: 'bow', name: 'Hunting Bow', kind: 'ranged', cost: 8, damage: 34, cooldown: 0.25, range: 70, draw: 0.9 },
  crossbow: { id: 'crossbow', name: 'Crossbow', kind: 'ranged', cost: 6, damage: 48, cooldown: 1.6, range: 80, draw: 1.2 },
  knives: { id: 'knives', name: 'Throwing Knives', kind: 'ranged', cost: 5, damage: 15, cooldown: 0.45, range: 30, draw: 0 },
  fireball: { id: 'fireball', name: 'Fire (signet)', kind: 'spell', cost: 22, damage: 35, cooldown: 0.7, range: 80 },
  lightning: { id: 'lightning', name: 'Lightning (signet)', kind: 'spell', cost: 9, damage: 16, cooldown: 0.25, range: 35 },
  salve: { id: 'salve', name: 'Healing Salve', kind: 'heal', cost: 0, damage: 30, cooldown: 4, range: 0 },
};
