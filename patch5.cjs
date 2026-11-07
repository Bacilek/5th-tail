const fs = require('fs');
function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error('missing in ' + file + ': ' + a.slice(0, 70));
    s = s.replace(a, () => b);
  }
  fs.writeFileSync(file, s);
}
// college.ts exports
edit('src/world/college.ts', [
  ['function hall(', 'export function hall('],
  ['function prop(', 'export function prop('],
  ['function torch(', 'export function torch('],
  ['function banner(', 'export function banner('],
  ['function floor(g: THREE.Group, r: Rect, y: number, color: number): void {', 'export function floorRect(g: THREE.Group, r: Rect, y: number, color: number): void {\n  floor(g, r, y, color);\n}\n\nfunction floor(g: THREE.Group, r: Rect, y: number, color: number): void {'],
  ['function label(', 'export function label('],
]);
// terrain: pads
edit('src/world/terrain.ts', [
  ['export const CITADEL: Rect', '// Basgiath village (south-west) and a Venin camp (south-east), both flattened pads\nexport const VILLAGE: Rect = { x0: -120, x1: -60, z0: 62, z1: 112 };\nexport const CAMP: Rect = { x0: 70, x1: 122, z0: 100, z1: 150 };\nexport const CITADEL: Rect'],
  ['const FLAT_RECTS = [COLLEGE, HEALERS, INFANTRY, SCRIBE, MESA, FIELD];', 'const FLAT_RECTS = [COLLEGE, HEALERS, INFANTRY, SCRIBE, MESA, FIELD, VILLAGE, CAMP];'],
  ['  h += (CITADEL_Y - h) * fk;', '  h += (CITADEL_Y - h) * fk;\n  for (const r of [VILLAGE, CAMP]) h += (PLATEAU - h) * (1 - smoothstep(0, 15, rectDist(r, x, z)));'],
]);
edit('src/world/trees.ts', [
  ['MESA, FIELD, type Rect', 'MESA, FIELD, VILLAGE, CAMP, type Rect'],
  ['SCRIBE, MESA, FIELD];', 'SCRIBE, MESA, FIELD, VILLAGE, CAMP];'],
]);
// quests data
edit('src/data/quests.ts', [
  ["  type: 'kill' | 'collect' | 'reach';\n  n?: number;\n  item?: 'scroll' | 'herb';\n  text: string;\n  check?: 'flyTower';",
   "  type: 'kill' | 'collect' | 'reach' | 'talk';\n  n?: number;\n  item?: 'scroll' | 'herb' | 'fish';\n  text: string;\n  check?: string;\n  npc?: string;"],
  ["    gold: 80,\n  },\n];", `    gold: 80,
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
    remind: 'Basgiath Village is south-west of the lower college. Find Tavik.',
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
    id: 'q_race', title: 'Ridoc\\'s Wager', giver: 'ridoc',
    intro: 'I bet three squadmates you cannot fly a broom through nine hoops around the college. Press B to mount, fly through the first gold ring in the lower courtyard and finish the course.',
    remind: 'The first ring floats above the lower courtyard. Press B to take a broom.',
    outro: 'You actually did it. Now I owe three people money.',
    objectives: [{ type: 'reach', check: 'raceDone', text: 'Finish the broom hoop race' }],
    gold: 60,
  },
  {
    id: 'q_report', title: 'Report to the Commandant', giver: 'commandant', requires: 'q_fly',
    intro: 'You flew to the Conscription Tower and back, and Xaden vouched for you, which he rarely does. Hear this: the camp in the south-east is only one of many, and the wards are failing. Go to the village and tell the innkeeper that the college will pay for any news from the border.',
    remind: 'Speak to the innkeeper in the village inn.',
    outro: 'The college hears everything eventually. Take this for the road.',
    objectives: [{ type: 'talk', npc: 'hesper', text: 'Tell the innkeeper Hesper what the Commandant said' }],
    gold: 150,
  },
];`],
]);
// npcs
edit('src/data/npcs.ts', [
  ['  invented?: boolean;\n}', "  invented?: boolean;\n  wander?: number; // wander radius around home\n}"],
  ["];\n", `  { id: 'imogen', name: 'Imogen', role: 'Rider', x: 116, z: -8, cloth: 0x2a2f45, hair: 0x2a1a1a,
    chat: ['If you want respect here, finish the Gauntlet.'] },
  { id: 'garrick', name: 'Garrick', role: 'Rider', x: 110, z: -46, cloth: 0x2a2f45, hair: 0x4a3a28,
    chat: ['I do not talk much. It saves breath for the flight field.'] },
  { id: 'mira', name: 'Mira', role: 'Rider', x: 94, z: 4, cloth: 0x2a2f45, hair: 0x3a2a1a,
    chat: ['Survived the Parapet? Good. That was the easy part.'] },
  { id: 'commandant', name: 'Commandant Sorrengail', role: 'Commandant', x: 0, z: -24, cloth: 0x1a1a22, hair: 0x2a2a2a,
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
`],
]);
// npc wandering
edit('src/entities/npc.ts', [
  ["import { makeLabel } from '../world/college';", "import { makeLabel } from '../world/college';\nimport { resolve } from '../world/collision';"],
  ["  private phase = Math.random() * 6;", "  private phase = Math.random() * 6;\n  private goal = new THREE.Vector3();\n  private wait = 0;\n  private home: THREE.Vector3;"],
  ["    this.group.position.copy(this.pos);\n", "    this.group.position.copy(this.pos);\n    this.home = this.pos.clone();\n    this.goal.copy(this.pos);\n"],
  [`  update(t: number, target: THREE.Vector3): void {
    const dx = target.x - this.pos.x, dz = target.z - this.pos.z;
    if (Math.hypot(dx, dz) < 14) this.group.rotation.y = Math.atan2(-dx, -dz);`, `  update(t: number, target: THREE.Vector3, dt = 0.016): void {
    const dx = target.x - this.pos.x, dz = target.z - this.pos.z;
    const near = Math.hypot(dx, dz) < 3.5;
    if (this.def.wander && !near) {
      this.wait -= dt;
      const gx = this.goal.x - this.pos.x, gz = this.goal.z - this.pos.z;
      if (Math.hypot(gx, gz) < 0.5) {
        if (this.wait <= 0) {
          const a = Math.random() * Math.PI * 2, r = Math.random() * this.def.wander;
          this.goal.set(this.home.x + Math.cos(a) * r, 0, this.home.z + Math.sin(a) * r);
          this.wait = 2 + Math.random() * 4;
        }
      } else {
        const l = Math.hypot(gx, gz);
        this.pos.x += (gx / l) * 1.2 * dt; this.pos.z += (gz / l) * 1.2 * dt;
        resolve(this.pos, 0.5);
        this.pos.y = heightAt(this.pos.x, this.pos.z);
        this.group.rotation.y = Math.atan2(-gx, -gz);
        this.group.position.x = this.pos.x; this.group.position.z = this.pos.z;
        this.group.position.y = this.pos.y + Math.abs(Math.sin(t * 6 + this.phase)) * 0.06;
        return;
      }
    }
    if (Math.hypot(dx, dz) < 14) this.group.rotation.y = Math.atan2(-dx, -dz);`],
]);
// pickups
edit('src/systems/pickups.ts', [
  ["item: 'scroll' | 'herb';\n  quest: string;\n  mesh", "item: 'scroll' | 'herb' | 'fish';\n  quest: string;\n  mesh"],
  ["const POSITIONS: { item: 'scroll' | 'herb'; quest", "const POSITIONS: { item: 'scroll' | 'herb' | 'fish'; quest"],
  ["  { item: 'herb', quest: 'q_herbs', x: -18, z: 97 },\n", "  { item: 'herb', quest: 'q_herbs', x: -18, z: 97 },\n  { item: 'scroll', quest: 'q_archive2', x: -110, z: -36 },\n  { item: 'scroll', quest: 'q_archive2', x: -92, z: -37 },\n  { item: 'fish', quest: 'q_fish', x: -108, z: 66 },\n  { item: 'fish', quest: 'q_fish', x: -72, z: 106 },\n  { item: 'fish', quest: 'q_fish', x: -88, z: 94 },\n"],
  ["    } else {\n      const m = new THREE.MeshStandardMaterial({ color: 0x4fd06a", "    } else if (p.item === 'fish') {\n      const g = new THREE.Group();\n      const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshStandardMaterial({ color: 0x9ab0c8, emissive: 0x2a3a50, flatShading: true }));\n      body.scale.set(1.8, 0.7, 0.7);\n      g.add(body);\n      mesh = g;\n    } else {\n      const m = new THREE.MeshStandardMaterial({ color: 0x4fd06a"],
]);
// race completed flag
edit('src/systems/race.ts', [
  ["  best = Infinity;", "  best = Infinity;\n  completed = false;"],
  ["      this.best = Math.min(this.best, this.time);", "      this.best = Math.min(this.best, this.time);\n      this.completed = true;"],
]);
// quests: talk
edit('src/systems/quests.ts', [
  ["  kill(): void { this.bump('kill'); }", `  kill(): void { this.bump('kill'); }

  /** Called when the player talks to an NPC: completes matching 'talk' objectives. */
  talk(npc: string): void {
    let changed = false;
    for (const [id, s] of this.state) {
      if (s.status !== 'active') continue;
      this.def(id).objectives.forEach((o, i) => {
        if (o.type === 'talk' && o.npc === npc && s.prog[i] < 1) { s.prog[i] = 1; changed = true; }
      });
      this.recheck(id);
    }
    if (changed) this.onChange();
  }`],
]);
// main wiring
edit('src/main.ts', [
  ["import { buildCollege,", "import { buildVillage, buildCamp } from './world/areas';\nimport { buildCollege,"],
  ["buildCitadel(), buildParapet(), buildTrees());", "buildCitadel(), buildParapet(), buildVillage(), buildCamp(), buildTrees());"],
  ["PLATEAU, HEALERS,", "PLATEAU, CAMP, VILLAGE, HEALERS,"],
  ["let kills = 0;", `// Venin camp: scouts plus a commander
for (const [x, z] of [[84, 118], [108, 116], [92, 140], [112, 138], [98, 108]]) {
  const e = new Enemy(x, z); scene.add(e.group); combat.enemies.push(e);
}
{
  const cmd = new Enemy(96, 108); cmd.hp = 180; cmd.group.scale.setScalar(1.35); scene.add(cmd.group); combat.enemies.push(cmd);
}
let kills = 0;
let gauntletDone = false;`],
  ["function talkTo(npc: Npc): void {\n  const id = npc.def.id, name = npc.def.name;", "function talkTo(npc: Npc): void {\n  const id = npc.def.id, name = npc.def.name;\n  quests.talk(id);"],
  ["    gauntlet.update(dt, t, player);", "    if (gauntlet.update(dt, t, player)) gauntletDone = true;"],
  ["    quests.reach('flyTower',", "    quests.reach('gauntletDone', gauntletDone);\n    quests.reach('raceDone', race.completed);\n    quests.reach('campFound', inRect(CAMP, player.pos.x, player.pos.z));\n    quests.reach('villageFound', inRect(VILLAGE, player.pos.x, player.pos.z));\n    quests.reach('flyTower',"],
  ["npcs.forEach((n) => n.update(t, player.pos));", "npcs.forEach((n) => n.update(t, player.pos, dt));"],
]);
