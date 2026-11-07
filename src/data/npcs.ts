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
}

// Canon names per docs/lore.md; dialogue lines are original (not quoted from the books).
export const NPCS: NpcDef[] = [
  { id: 'jesinia', name: 'Jesinia', role: 'Archivist', x: -100, z: -21, cloth: 0x5a3a86, hair: 0x2a1a10,
    chat: ['Quiet in the Archives. Knowledge is the only weapon that does not break.', 'Every Rider who ever bonded a dragon is written down here. Eventually.'] },
  { id: 'marren', name: 'Marren', role: 'Healer (invented)', x: 0, z: 64, cloth: 0x2f7a42, hair: 0x6a4a2a, invented: true,
    chat: ['Healers carry no magic. Just patience, clean hands and very little sleep.'] },
  { id: 'brask', name: 'Sgt. Brask', role: 'Infantry (invented)', x: 0, z: -84, cloth: 0x7a5a2a, hair: 0x1a1a1a, invented: true,
    chat: ['Infantry holds the line. Riders get the songs; we get the border.'] },
  { id: 'dain', name: 'Dain', role: 'Squad Leader', x: 98, z: -12, cloth: 0x2a2f45, hair: 0x6a4a28,
    chat: ['Stay in formation and keep your head down on the field.'] },
  { id: 'rhiannon', name: 'Rhiannon', role: 'Rider', x: 96, z: -22, cloth: 0x2a2f45, hair: 0x3a2a1a,
    chat: ['If you reached the Citadel, you already beat the Parapet. The rest is only dragons.', 'Fourth Wing is not the easiest place to be a first-year. But nobody here is alone.'] },
  { id: 'ridoc', name: 'Ridoc', role: 'Rider', x: 106, z: -16, cloth: 0x2a2f45, hair: 0x1a1210,
    chat: ['Nice landing. Okay, you fell on it, but it counts.', 'Rumor says the cat in the lower college has opinions on every rider.'] },
  { id: 'xaden', name: 'Xaden', role: 'Wingleader', x: 122, z: -22, cloth: 0x0e0e14, hair: 0x0a0a0a,
    chat: ['Make yourself useful or make yourself scarce.'] },
];
