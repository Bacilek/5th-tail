// Side quests running parallel to the books' events. Characters marked (invented) are NOT canon.
export interface ObjDef {
  type: 'kill' | 'collect' | 'reach';
  n?: number;
  item?: 'scroll' | 'herb';
  text: string;
  check?: 'flyTower';
}

export interface QuestDef {
  id: string;
  title: string;
  giver: string;
  turnIn?: string; // defaults to giver
  requires?: string;
  intro: string;
  remind: string;
  outro: string;
  objectives: ObjDef[];
  gold: number;
}

export const QUESTS: QuestDef[] = [
  {
    id: 'q_scrolls', title: 'Lost to the Archives', giver: 'jesinia',
    intro: 'Three scrolls have gone missing from the Archives. Scribes may not leave their posts, but you can. Look around the college grounds; they must have been dropped on the way to other quadrants.',
    remind: 'The scrolls are still out there. Check the lower college, the Infantry yard and the Healer gardens.',
    outro: 'All three, and not a page torn. The Archives remember who helps them.',
    objectives: [{ type: 'collect', item: 'scroll', n: 3, text: 'Collect Archive scrolls' }],
    gold: 40,
  },
  {
    id: 'q_herbs', title: 'Bitterroot for the Wounded', giver: 'marren',
    intro: 'Too many cadets and too little bitterroot. (Marren is an invented NPC.) Pick three herb bundles from the beds in our garden, and I will mix salves tonight.',
    remind: 'The herb beds are right behind the infirmary. Three bundles.',
    outro: 'Fresh and unbruised. You have a healer\'s hands.',
    objectives: [{ type: 'collect', item: 'herb', n: 3, text: 'Gather herb bundles' }],
    gold: 30,
  },
  {
    id: 'q_venin', title: 'Dark Things on the Road', giver: 'brask',
    intro: 'Something wrong is lurking outside the walls, red-eyed and robed. (Sergeant Brask is an invented NPC.) Put three of them down and Infantry will owe you.',
    remind: 'Three of them. They hunt the south road and the hills beyond the walls.',
    outro: 'Three down. Infantry does not forget this.',
    objectives: [{ type: 'kill', n: 3, text: 'Slay Venin' }],
    gold: 60,
  },
  {
    id: 'q_orders', title: 'Orders for the Gauntlet', giver: 'dain', turnIn: 'xaden',
    intro: 'Squad business. Take this message to Xaden at the Gauntlet. Do not read it, and do not be late.',
    remind: 'Xaden is at the Gauntlet, at the far end of the Citadel courtyard.',
    outro: 'Hm. Dain\'s handwriting. Fine. You can go.',
    objectives: [],
    gold: 20,
  },
  {
    id: 'q_fly', title: 'Prove Your Wings', giver: 'xaden', requires: 'q_orders',
    intro: 'A rider who cannot fly is a corpse with a dragon. Summon yours and fly up to the Conscription Tower, then come back and tell me.',
    remind: 'The Conscription Tower, east of the lower college. Get close to its top on dragonback.',
    outro: 'Adequate. Do it again with someone shooting at you.',
    objectives: [{ type: 'reach', check: 'flyTower', text: 'Fly your dragon to the Conscription Tower' }],
    gold: 80,
  },
];
