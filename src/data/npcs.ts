export interface NpcDef {
  id: string;
  name: string;
  role: string;
  x: number;
  z: number;
  cloth: number;
  hair: number;
  chat: string[];
  invented?: boolean;
  wander?: number; // wander radius around home
  skin?: number;
  eyes?: number;
  build?: 'tall' | 'hulking' | 'small';
  /** Signature marks from the books. Only key (canon) NPCs have these; generic NPCs never do. */
  marks?: ('shadowAura' | 'goldEyes' | 'tousled' | 'chinScar' | 'halfShaved' | 'braid' | 'insignia' | 'crownBraid' | 'silverTips')[];
}

// Canon names per docs/lore.md; dialogue lines are original (not quoted from the books).
export const NPCS: NpcDef[] = [
  { id: 'jesinia', name: 'Jesinia', role: 'Archivist', x: -100, z: -21, cloth: 0x5a3a86, hair: 0x2a1a10,
    chat: ['Quiet in the Archives. Knowledge is the only weapon that does not break.', 'Every Rider who ever bonded a dragon is written down here. Eventually.'] },
  { id: 'marren', name: 'Marren', role: 'Healer (invented)', x: 0, z: 64, cloth: 0x2f7a42, hair: 0x6a4a2a, invented: true,
    chat: ['Healers carry no magic. Just patience, clean hands and very little sleep.'] },
  { id: 'brask', name: 'Sgt. Brask', role: 'Infantry (invented)', x: 0, z: -84, cloth: 0x7a5a2a, hair: 0x1a1a1a, invented: true,
    chat: ['Infantry holds the line. Riders get the songs; we get the border.'] },
  { id: 'dain', name: 'Dain', role: 'Squad Leader', x: 98, z: -12, cloth: 0x2a2f45, hair: 0x8a6a42, skin: 0xe0bfa0, eyes: 0x5a3a20, marks: ['chinScar'],
    chat: ['Stay in formation and keep your head down on the field.'] },
  { id: 'rhiannon', name: 'Rhiannon', role: 'Rider', x: 96, z: -22, cloth: 0x2a2f45, hair: 0x3a2a1a,
    chat: ['If you reached the Citadel, you already beat the Parapet. The rest is only dragons.', 'Fourth Wing is not the easiest place to be a first-year. But nobody here is alone.'] },
  { id: 'ridoc', name: 'Ridoc', role: 'Rider', x: 106, z: -16, cloth: 0x2a2f45, hair: 0x1a1210,
    chat: ['Nice landing. Okay, you fell on it, but it counts.', 'Rumor says the cat in the lower college has opinions on every rider.'] },
  { id: 'xaden', name: 'Xaden', role: 'Wingleader', x: 122, z: -22, cloth: 0x0e0e14, hair: 0x0a0a0a, skin: 0xb88a62, build: 'tall', marks: ['shadowAura', 'goldEyes', 'tousled'],
    chat: ['Make yourself useful or make yourself scarce.'] },
  { id: 'imogen', name: 'Imogen', role: 'Rider', x: 116, z: -8, cloth: 0x2a2f45, hair: 0xff6fae, skin: 0xf0d8c8, eyes: 0x9ad0a0, build: 'tall', marks: ['halfShaved'],
    chat: ['If you want respect here, finish the Gauntlet.'] },
  { id: 'garrick', name: 'Garrick', role: 'Rider', x: 110, z: -46, cloth: 0x2a2f45, hair: 0x4a3a28, build: 'hulking',
    chat: ['I do not talk much. It saves breath for the flight field.'] },
  // Violet Sorrengail (canon): long brown hair with silver ends worn in a crown braid, pale, small build
  { id: 'violet', name: 'Violet Sorrengail', role: 'Rider', x: 114, z: -14, cloth: 0x2a2f45, hair: 0x5a3a24, skin: 0xf3dccb, eyes: 0x8a7a40, build: 'small', marks: ['crownBraid', 'silverTips'],
    chat: ['I am small for a rider. Everyone here has noticed. Everyone here is wrong about what that means.', 'Tairn says I think too loudly. I pretend not to hear him.'] },
  { id: 'mira', name: 'Mira', role: 'Rider', x: 94, z: 4, cloth: 0x2a2f45, hair: 0x3a2a1a, marks: ['braid'],
    chat: ['Survived the Parapet? Good. That was the easy part.'] },
  { id: 'commandant', name: 'Commandant Sorrengail', role: 'Commandant', x: 0, z: -24, cloth: 0x1a1a22, hair: 0xb8b8c0, build: 'tall', marks: ['insignia'],
    chat: ['The college does not waste what it cannot replace.'] },
  { id: 'tavik', name: 'Tavik', role: 'Merchant (invented)', x: -99, z: 87, cloth: 0x8a4a2a, hair: 0x5a3a20, invented: true,
    chat: ['Roots, fish, rope, rumor. Best prices south of the college.'] },
  { id: 'hesper', name: 'Hesper', role: 'Innkeeper (invented)', x: -90, z: 109, cloth: 0x7a5a3a, hair: 0x9a9a9a, invented: true,
    chat: ['Cadets drink here when they think nobody from the college can see.'] },
  { id: 'pell', name: 'Pell', role: 'Villager (invented)', x: -90, z: 84, cloth: 0x4a6a5a, hair: 0x2a1a10, invented: true, wander: 14,
    chat: ['Dragons overhead again. You get used to it. Mostly.'] },
  { id: 'cadet1', name: 'Cadet', role: 'First-year', x: 6, z: 14, cloth: 0x3a3a4a, hair: 0x4a2a1a, wander: 12,
    chat: ['Is it true what they say about the Parapet?'] },
  { id: 'cadet2', name: 'Cadet', role: 'First-year', x: -8, z: -8, cloth: 0x3a3a4a, hair: 0x1a1a1a, wander: 12,
    chat: ['I am just trying to find my quadrant before sundown.'] },
  { id: 'cadet3', name: 'Cadet', role: 'First-year', x: -20, z: 0, cloth: 0x3a3a4a, hair: 0x6a5a3a, wander: 10,
    chat: ['Everyone says to pick Scribe if you want to live long.'] },
];
