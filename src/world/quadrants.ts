import * as THREE from 'three';
import { addBox, addCircle } from './collision';
import { PLATEAU, SCRIBE_Y, CITADEL_Y } from './terrain';
import { hall, label, torch, banner, prop } from './college';
import { pbr } from '../engine/textures';

const wood = pbr('dark_planks', 0x9a7a5a);
const darkStone = pbr('castle_brick_07', 0x5a5e69);
const stoneM = new THREE.MeshStandardMaterial({ color: 0x8a8e98, flatShading: true });
const slab = new THREE.MeshStandardMaterial({ color: 0xb6bcc4, flatShading: true });
const iron = new THREE.MeshStandardMaterial({ color: 0x3a3c44, flatShading: true, metalness: 0.5, roughness: 0.6 });
const leaf = new THREE.MeshStandardMaterial({ color: 0x3c8a4a, flatShading: true });
const soil = new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: 1 });
const sand = new THREE.MeshStandardMaterial({ color: 0xb9a27a, roughness: 1 });
const paper = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, flatShading: true });
const water = new THREE.MeshStandardMaterial({ color: 0x3a74a8, roughness: 0.2, metalness: 0.1 });
const FLOWERS = [0xe84a5a, 0xf0c040, 0xb06ae0, 0xf08a3a, 0xffffff];

/** A hanging chain: a thin rod down from (x,y,z). */
function chain(g: THREE.Group, x: number, y: number, z: number, len: number): void {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 4), iron);
  c.position.set(x, y - len / 2, z); g.add(c);
}

function healers(g: THREE.Group): void {
  const Y = PLATEAU;
  // herb garden: raised beds with plants and flowers around a fountain
  const fx = 0, fz = 96;
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.2, 0.9, 16), stoneM);
  basin.position.set(fx, Y + 0.45, fz); basin.castShadow = true; g.add(basin);
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.05, 16), water); pool.position.set(fx, Y + 0.88, fz); g.add(pool);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2, 6), stoneM); spout.position.set(fx, Y + 1.6, fz); g.add(spout);
  addCircle(fx, fz, 3.3, Y + 0.9);
  let k = 0;
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
    const bx = sx * (9 + i * 3.2), bz = 98;
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 6), soil); bed.position.set(bx, Y + 0.25, bz); bed.receiveShadow = true; g.add(bed);
    addBox(bx, bz, 2.6, 6, Y + 0.5);
    for (let j = 0; j < 5; j++) {
      const plant = new THREE.Mesh(new THREE.SphereGeometry(0.38, 6, 5), leaf);
      plant.position.set(bx + (j % 2 ? 0.5 : -0.5), Y + 0.8, bz - 2.3 + j * 1.1); plant.scale.y = 0.8; g.add(plant);
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 5, 4), new THREE.MeshStandardMaterial({ color: FLOWERS[k++ % FLOWERS.length] }));
      fl.position.set(plant.position.x, Y + 1.15, plant.position.z); g.add(fl);
    }
  }
  label(g, 'Herb Garden', '#9fe3b5', 0, Y + 5, 98, 8);
  // morgue: cold stone room with slabs and a shrouded body
  hall(g, -30, 98, 10, 8, 5, Y, 3, 'e', 'none', darkStone);
  for (const dz of [-2, 0, 2]) {
    prop(g, -32.5, 98 + dz, 2.4, 1, 0.9, Y, slab);
    if (dz === 0) { const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.28, 0.6), new THREE.MeshStandardMaterial({ color: 0xd8d4c8 })); body.position.set(-32.5, Y + 1.04, 98); g.add(body); }
  }
  label(g, 'Morgue', '#b8c4d0', -30, Y + 8, 98, 6);
  label(g, 'Infirmary', '#9fe3b5', 0, Y + 12, 70, 9);
}

function infantry(g: THREE.Group): void {
  const Y = PLATEAU;
  // sparring ring: sand disc with a rope of posts
  const cx = 0, cz = -80;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 0.2, 24), sand); disc.position.set(cx, Y + 0.12, cz); disc.receiveShadow = true; g.add(disc);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, px = cx + Math.cos(a) * 7.4, pz = cz + Math.sin(a) * 7.4;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 1.2, 5), wood); p.position.set(px, Y + 0.6, pz); g.add(p);
  }
  const rope = new THREE.Mesh(new THREE.TorusGeometry(7.4, 0.04, 4, 36), new THREE.MeshStandardMaterial({ color: 0xc9b07a })); rope.rotation.x = Math.PI / 2; rope.position.set(cx, Y + 1.1, cz); g.add(rope);
  label(g, 'Sparring Ring', '#ffd98a', cx, Y + 4, cz, 8);
  // armoury: weapon racks and armour stands inside
  hall(g, 0, -102, 14, 7, 5, Y, 3, 's', 'none');
  for (let i = 0; i < 4; i++) {
    const x = -5 + i * 3.3;
    prop(g, x, -104.6, 2.4, 0.5, 0.3, Y, wood, false);
    for (let j = 0; j < 4; j++) {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.04), new THREE.MeshStandardMaterial({ color: 0xa6aab6, metalness: 0.6, roughness: 0.4 }));
      sw.position.set(x - 0.9 + j * 0.6, Y + 1.2, -104.5); sw.rotation.z = (j - 1.5) * 0.1; g.add(sw);
    }
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 1.6, 6), iron); stand.position.set(x, Y + 0.9, -100.4); g.add(stand);
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 5), iron); helm.position.set(x, Y + 1.9, -100.4); g.add(helm);
    addCircle(x, -100.4, 0.4, Y + 2);
  }
  label(g, 'Armoury', '#ffd98a', 0, Y + 8, -102, 7);
  label(g, 'Barracks', '#ffd98a', 0, Y + 9, -112, 7);
}

function riders(g: THREE.Group): void {
  const Y = CITADEL_Y;
  // torture chamber: dark stone cell with a table, rack, chains and a grim glow
  hall(g, 102, -46.5, 12, 7, 6, Y, 3, 's', 'none', darkStone);
  prop(g, 99, -48, 2.4, 1.2, 0.8, Y, wood);
  prop(g, 105, -48, 0.5, 2.6, 2.4, Y, iron, false);
  for (const x of [98, 100, 104, 106]) chain(g, x, Y + 5.6, -49.4, 2.4);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), new THREE.MeshBasicMaterial({ color: 0xc03018 })); glow.position.set(102, Y + 4.6, -47); g.add(glow);
  label(g, 'Torture Chamber', '#ff8a7a', 102, Y + 9, -46, 10);
  // Rider Survival Course: balance beam, hurdles, rope wall
  const cz = -2, x0 = 114;
  const beam = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 0.5), wood); beam.position.set(x0 + 4, Y + 0.65, cz - 4); g.add(beam);
  addBox(x0 + 4, cz - 4, 8, 0.5, Y + 0.8, Y + 0.5);
  for (const bx of [x0, x0 + 8]) prop(g, bx, cz - 4, 0.5, 0.5, 0.5, Y, wood);
  for (let i = 0; i < 3; i++) prop(g, x0 + 2 + i * 3.4, cz + 1, 0.5, 5, 0.9 + i * 0.25, Y, wood);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.6, 5), wood); wall.position.set(x0 + 11, Y + 1.3, cz + 4.5); wall.castShadow = true; g.add(wall);
  addBox(x0 + 11, cz + 4.5, 0.5, 5, Y + 2.6);
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 4), new THREE.MeshStandardMaterial({ color: 0xc9b07a })); r.position.set(x0 + 10.7, Y + 1.3, cz + 2.4 + i * 1.4); g.add(r); }
  label(g, 'Rider Survival Course', '#ffd98a', x0 + 6, Y + 5, cz, 12);
  banner(g, 112, Y + 6, -2, 0xa02a20, 0, 5);
}

function scribes(g: THREE.Group): void {
  const Y = SCRIBE_Y;
  // vault: small dark hall behind an iron grille, off the Archives
  hall(g, -100, -12, 12, 7, 6, Y, 3, 'n', 'shelves', darkStone);
  for (let i = -2; i <= 2; i++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.2, 5), iron);
    bar.position.set(-100 + i * 0.9, Y + 2.1, -15.4); g.add(bar);
  }
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.2), new THREE.MeshStandardMaterial({ color: 0xd7b04a, metalness: 0.6, roughness: 0.4 }));
  lock.position.set(-100, Y + 1.5, -15.3); g.add(lock);
  label(g, 'The Vault (restricted)', '#d8a8ff', -100, Y + 8, -12, 10);
  // reading desks in the courtyard with lamps and open books
  for (let i = 0; i < 6; i++) {
    const x = -116 + i * 6.4, z = -22;
    prop(g, x, z, 3, 1.2, 0.9, Y, wood);
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.45), paper); book.position.set(x - 0.5, Y + 0.95, z); g.add(book);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 5, 4), new THREE.MeshBasicMaterial({ color: 0xffc070 })); lamp.position.set(x + 0.8, Y + 1.05, z); g.add(lamp);
    prop(g, x, z + 1.2, 1.2, 0.5, 0.45, Y, wood);
  }
  label(g, 'Reading Court', '#c9a8ff', -96, Y + 4, -22, 9);
  torch(g, -90, Y, -24); torch(g, -110, Y, -24);
}

/** Per-quadrant landmarks: Healers (garden, morgue), Infantry (sparring ring, armoury), Riders (torture chamber, survival course), Scribes (vault, reading court). */
export function buildQuadrantDetails(): THREE.Group {
  const g = new THREE.Group();
  healers(g); infantry(g); riders(g); scribes(g);
  return g;
}
