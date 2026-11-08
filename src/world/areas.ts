import * as THREE from 'three';
import { addBox, addCircle } from './collision';
import { pbr } from '../engine/textures';
import { PLATEAU, VILLAGE, CAMP } from './terrain';
import { hall, label, torch, banner, prop, floorRect } from './college';

const wood = pbr('dark_planks', 0x9a7a5a);
const stoneM = new THREE.MeshStandardMaterial({ color: 0x6b6f78, flatShading: true });
const dark = new THREE.MeshStandardMaterial({ color: 0x1b1722, flatShading: true, side: THREE.DoubleSide });
const linenM = new THREE.MeshStandardMaterial({ color: 0xc9c2b0, flatShading: true });
const ember = new THREE.MeshBasicMaterial({ color: 0xff7a20 });

function stall(g: THREE.Group, x: number, z: number, color: number): void {
  const Y = PLATEAU;
  const awn = new THREE.MeshStandardMaterial({ color, flatShading: true, side: THREE.DoubleSide });
  for (const sx of [-1.6, 1.6]) for (const sz of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 5), wood);
    p.position.set(x + sx, Y + 1.3, z + sz); p.castShadow = true; g.add(p);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 2.6), awn);
  roof.position.set(x, Y + 2.7, z); roof.rotation.x = 0.12; roof.castShadow = true; g.add(roof);
  prop(g, x, z + 0.8, 3.2, 0.9, 1.0, Y, wood);
  // goods
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), new THREE.MeshStandardMaterial({ color: [0xc04a2a, 0xd8b040, 0x4a9a4a, 0x7a5aa0][i], flatShading: true }));
    c.position.set(x - 1.1 + i * 0.75, Y + 1.15, z + 0.8); g.add(c);
  }
}

const iron = new THREE.MeshStandardMaterial({ color: 0x3a3c44, flatShading: true, metalness: 0.5, roughness: 0.6 });
const glow = new THREE.MeshBasicMaterial({ color: 0xff6a18 });
const crateMat = new THREE.MeshStandardMaterial({ color: 0x8a6a42, flatShading: true });

function barrel(g: THREE.Group, x: number, z: number, y: number): void {
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 1.1, 9), wood);
  b.position.set(x, y + 0.55, z); b.castShadow = true; g.add(b);
  addCircle(x, z, 0.5, y + 1.1);
}
function crate(g: THREE.Group, x: number, z: number, y: number, s = 1): void {
  prop(g, x, z, 1.1 * s, 1.1 * s, 1.1 * s, y, crateMat);
}
/** Smithy: forge hearth with a glowing coal bed, anvil, quench trough and a weapon rack. */
function forge(g: THREE.Group, cx: number, cz: number, y: number): void {
  hall(g, cx, cz, 12, 8, 5, y, 3.5, 's', 'none');
  prop(g, cx - 3.5, cz - 2.8, 3, 1.6, 1.3, y, stoneM);              // hearth
  const coals = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 1), glow); coals.position.set(cx - 3.5, y + 1.38, cz - 2.6); g.add(coals);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1, 5), ember); flame.position.set(cx - 3.5, y + 2, cz - 2.6); g.add(flame);
  const chim = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.4, 1), stoneM); chim.position.set(cx - 3.5, y + 3, cz - 3.4); g.add(chim);
  prop(g, cx + 0.5, cz - 0.5, 0.8, 1.6, 0.8, y, wood);               // anvil block
  const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 1.3), iron); anvil.position.set(cx + 0.5, y + 0.95, cz - 0.5); g.add(anvil);
  prop(g, cx + 3, cz - 2.8, 2.4, 0.9, 0.7, y, wood);                // trough
  for (const [i, c] of [0xa0a4b0, 0xb0b4c0, 0x9a9eaa].entries()) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.04), new THREE.MeshStandardMaterial({ color: c, metalness: 0.6, roughness: 0.4 }));
    blade.position.set(cx + 4.3 - i * 0.4, y + 1.5, cz + 2); blade.rotation.z = 0.12 * (i - 1); g.add(blade);
  }
  prop(g, cx + 4.4, cz + 1.9, 0.5, 2.2, 0.5, y, wood, false);
  label(g, 'Smithy', '#ffd98a', cx, y + 8, cz, 7);
}

/** Chantara: village south-west of the college (invented layout; the books only mention the town outside the college). */
export function buildVillage(): THREE.Group {
  const g = new THREE.Group();
  const Y = PLATEAU;
  const cx = (VILLAGE.x0 + VILLAGE.x1) / 2, cz = (VILLAGE.z0 + VILLAGE.z1) / 2;
  floorRect(g, VILLAGE, Y, 0x6a5f48);
  hall(g, cx - 18, cz - 13, 10, 8, 5.5, Y, 4, 'e', 'table');
  hall(g, cx - 18, cz + 13, 10, 8, 5.5, Y, 4, 'e', 'cots');
  hall(g, cx + 18, cz - 13, 10, 8, 5.5, Y, 4, 'w', 'cots');
  hall(g, cx + 18, cz + 13, 10, 8, 5.5, Y, 4, 'w', 'table');
  hall(g, cx, cz + 22, 20, 10, 6, Y, 5, 'n', 'table'); // the inn
  forge(g, cx, cz - 22, Y);
  // market clutter: crates, barrels, sacks, a cart, a notice board
  for (const [x, z] of [[cx - 12, cz - 3], [cx - 12.2, cz - 1.8], [cx + 12, cz + 3], [cx + 7, cz + 9], [cx - 6, cz + 8]]) crate(g, x, z, Y, 0.9 + ((x * 7 + z) % 3) * 0.12);
  for (const [x, z] of [[cx - 13, cz + 2], [cx - 13.4, cz + 3.2], [cx + 13, cz - 3], [cx + 4, cz + 12], [cx - 8, cz - 12]]) barrel(g, x, z, Y);
  for (const [x, z] of [[cx + 5, cz - 1], [cx - 4, cz + 3]]) {
    const sack = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), linenM); sack.scale.y = 0.8; sack.position.set(x, Y + 0.4, z); g.add(sack);
  }
  prop(g, cx + 10, cz - 10, 3.2, 1.6, 0.5, Y, wood); // cart bed
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.15, 10), wood); w.rotation.x = Math.PI / 2; w.position.set(cx + 10 + s * 1.2, Y + 0.7, cz - 9.1); g.add(w); }
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 0.2), wood); post.position.set(cx + 4, Y + 1.3, cz - 8); g.add(post);
  const board = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 0.12), wood); board.position.set(cx + 4, Y + 2.1, cz - 8); board.castShadow = true; g.add(board);
  addBox(cx + 4, cz - 8, 2, 0.4, Y + 2.7);
  for (const [i, c] of [0xe8dcc0, 0xd8c9a0, 0xe0d0b0].entries()) { const note = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshStandardMaterial({ color: c })); note.position.set(cx + 3.4 + i * 0.6, Y + 2.1, cz - 7.92); g.add(note); }
  label(g, 'Market', '#ffd98a', cx, Y + 4.5, cz, 6);
  // well
  const well = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 1.1, 10), stoneM);
  well.position.set(cx, Y + 0.55, cz - 6); well.castShadow = true; g.add(well);
  addBox(cx, cz - 6, 2.8, 2.8, Y + 1.1);
  stall(g, cx - 9, cz, 0xa03a30); stall(g, cx + 9, cz, 0x3a6aa0); stall(g, cx, cz + 6, 0x4a8a4a);
  for (const [tx, tz] of [[cx - 12, cz - 20], [cx + 12, cz - 20], [cx - 20, cz + 2], [cx + 20, cz + 2]]) torch(g, tx, Y, tz);
  label(g, 'Chantara', '#ffe9b0', cx, Y + 14, cz - 4, 24);
  label(g, 'Inn', '#ffd98a', cx, Y + 9, cz + 22, 6);
  return g;
}

/** A Venin camp in the hills south-east of the college (invented). */
export function buildCamp(): THREE.Group {
  const g = new THREE.Group();
  const Y = PLATEAU;
  const cx = (CAMP.x0 + CAMP.x1) / 2, cz = (CAMP.z0 + CAMP.z1) / 2;
  floorRect(g, CAMP, Y, 0x3a352e);
  const tent = (x: number, z: number, s = 1) => {
    const t = new THREE.Mesh(new THREE.ConeGeometry(3.2 * s, 3.6 * s, 5), dark);
    t.position.set(x, Y + 1.8 * s, z); t.castShadow = true; g.add(t);
    addBox(x, z, 4 * s, 4 * s, Y + 2 * s);
  };
  tent(cx - 14, cz - 10); tent(cx + 14, cz - 8); tent(cx - 12, cz + 12); tent(cx + 13, cz + 11); tent(cx, cz - 16, 1.5);
  // fire pit with stones
  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 6), ember);
  fire.position.set(cx, Y + 0.8, cz); g.add(fire);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4), stoneM);
    s.position.set(cx + Math.cos(a) * 1.3, Y + 0.3, cz + Math.sin(a) * 1.3); g.add(s);
  }
  const l = new THREE.PointLight(0xff7a30, 80, 26, 1.6); l.position.set(cx, Y + 2.5, cz); g.add(l);
  // broken palisade
  for (let i = 0; i < 16; i++) {
    if (i % 5 === 3) continue;
    const x = CAMP.x0 + 2 + i * ((CAMP.x1 - CAMP.x0 - 4) / 15);
    for (const z of [CAMP.z0 + 2, CAMP.z1 - 2]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 3 + (i % 3) * 0.6, 5), wood);
      p.position.set(x, Y + 1.6, z); p.castShadow = true; g.add(p);
    }
  }
  banner(g, cx - 4, Y + 5, cz - 20, 0x2a0a10, 0, 7); banner(g, cx + 4, Y + 5, cz - 20, 0x2a0a10, 0, 7);
  label(g, 'Venin Camp', '#ff7a6a', cx, Y + 11, cz, 20);
  return g;
}
