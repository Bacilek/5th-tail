// Side quests running parallel to the books' events. Characters marked (invented) are NOT canon.
export interface ObjDef {
  type: 'kill' | 'collect' | 'reach' | 'talk';
  n?: number;
  item?: 'scroll' | 'herb' | 'fish';
  text: string;
  check?: string;
  npc?: string;
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
  {
    id: 'q_archive2', title: 'The Restricted Shelves', giver: 'jesinia', requires: 'q_scrolls',
    intro: 'Two more volumes are missing, and these were not dropped. Someone borrowed them from the deep stacks and put them back on the wrong shelves. Search inside the Archives for them.',
    remind: 'Check between the shelves inside the Archives hall. Two volumes.',
    outro: 'Filed wrongly, as I suspected. Thank you. Do not ask what is in them.',
    objectives: [{ type: 'collect', item: 'scroll', n: 2, text: 'Find the misplaced volumes inside the Archives' }],
    gold: 50,
  },
  {
    id: 'q_salve', title: 'Salve for the Village', giver: 'marren', requires: 'q_herbs',
    intro: 'The village below the walls has fever again. (Invented.) Take this salve to Tavik the merchant, he knows who needs it. Walk south-west of the college.',
    remind: 'Chantara village is south-west of the lower college. Find Tavik.',
    outro: 'He gave it to the children first. Good. That is what a healer is for.',
    objectives: [{ type: 'talk', npc: 'tavik', text: 'Bring the salve to Tavik in the village' }],
    gold: 45,
  },
  {
    id: 'q_fish', title: 'A Treat for Broccoli', giver: 'tavik', requires: 'q_salve',
    intro: 'Your cat has been staring at my stall for an hour. Three smoked fish went missing from the shelves behind the stalls. Find them and I will call it even. (Tavik is invented.)',
    remind: 'Search around the village stalls and houses for smoked fish.',
    outro: 'There they are. Take one yourself, and give the cat the rest.',
    objectives: [{ type: 'collect', item: 'fish', n: 3, text: 'Find the smoked fish in the village' }],
    gold: 25,
  },
  {
    id: 'q_camp', title: 'Clear the Camp', giver: 'brask', requires: 'q_venin',
    intro: 'The ones you killed were scouts. Their camp is south-east, in the hills beyond the Healer gardens. Find it, break it, and kill five of them. A commander sits in the central tent.',
    remind: 'South-east of the Healer quadrant: dark tents, a fire, a broken palisade.',
    outro: 'The camp is gone and the line holds. Infantry owes you twice.',
    objectives: [
      { type: 'reach', check: 'campFound', text: 'Find the Venin camp' },
      { type: 'kill', n: 5, text: 'Slay Venin at the camp' },
    ],
    gold: 120,
  },
  {
    id: 'q_gauntlet', title: 'Through the Gauntlet', giver: 'imogen',
    intro: 'Every rider walks the Gauntlet. Walls, bars, swinging iron, and a long fall if you are careless. Go through the east gate and come out at the Flight Field.',
    remind: 'The gate is in the east wall of the Citadel. Jump the walls, time the bars.',
    outro: 'Still breathing. Most first-years cannot say that. Try for a better time.',
    objectives: [{ type: 'reach', check: 'gauntletDone', text: 'Run the Gauntlet' }],
    gold: 70,
  },
  {
    id: 'q_race', title: 'Ridoc\'s Wager', giver: 'ridoc',
    intro: 'I bet three squadmates you cannot fly a broom through nine hoops around the college. Press B to mount, fly through the first gold ring in the lower courtyard and finish the course.',
    remind: 'The first ring floats above the lower courtyard. Press B to take a broom.',
    outro: 'You actually did it. Now I owe three people money.',
    objectives: [{ type: 'reach', check: 'raceDone', text: 'Finish the broom hoop race' }],
    gold: 60,
  },
  {
    id: 'q_report', title: 'Report to the General', giver: 'general', requires: 'q_fly',
    intro: 'You flew to the Conscription Tower and back, and Xaden vouched for you, which he rarely does. Hear this: the camp in the south-east is only one of many, and the wards are failing. Go to the village and tell the innkeeper that the college will pay for any news from the border.',
    remind: 'Speak to the innkeeper in the village inn.',
    outro: 'The college hears everything eventually. Take this for the road.',
    objectives: [{ type: 'talk', npc: 'hesper', text: 'Tell the innkeeper Hesper what the General said' }],
    gold: 150,
  },
  {
    id: 'q_violet', title: 'An Overdue Volume', giver: 'violet', turnIn: 'jesinia', requires: 'q_scrolls',
    intro: 'I borrowed a book on dragon anatomy from Jesinia a month ago and never returned it. It is on my bunk. Would you take it to her? The Archives are west of the lower college, below ground.',
    remind: 'Jesinia is in the Archives, in the Scribe quadrant, west of the lower college.',
    outro: 'Late, but not a page bent. Tell her she owes me two more favours and a cup of tea.',
    objectives: [{ type: 'talk', npc: 'jesinia', text: 'Return the book to Jesinia in the Archives' }],
    gold: 55,
  },
];
