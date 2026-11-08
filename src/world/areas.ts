import * as THREE from 'three';
import { addBox } from './collision';
import { pbr } from '../engine/textures';
import { PLATEAU, VILLAGE, CAMP } from './terrain';
import { hall, label, torch, banner, prop, floorRect } from './college';

const wood = pbr('dark_planks', 0x9a7a5a);
const stoneM = new THREE.MeshStandardMaterial({ color: 0x6b6f78, flatShading: true });
const dark = new THREE.MeshStandardMaterial({ color: 0x1b1722, flatShading: true, side: THREE.DoubleSide });
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

/** Basgiath village south-west of the college (invented layout; the books only mention the town outside the college). */
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
  // well
  const well = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 1.1, 10), stoneM);
  well.position.set(cx, Y + 0.55, cz - 6); well.castShadow = true; g.add(well);
  addBox(cx, cz - 6, 2.8, 2.8, Y + 1.1);
  stall(g, cx - 9, cz, 0xa03a30); stall(g, cx + 9, cz, 0x3a6aa0); stall(g, cx, cz + 6, 0x4a8a4a);
  for (const [tx, tz] of [[cx - 12, cz - 20], [cx + 12, cz - 20], [cx - 20, cz + 2], [cx + 20, cz + 2]]) torch(g, tx, Y, tz);
  label(g, 'Basgiath Village', '#ffe9b0', cx, Y + 14, cz - 4, 24);
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
