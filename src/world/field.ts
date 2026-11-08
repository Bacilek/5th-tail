import * as THREE from 'three';
import { addBox, addCircle } from './collision';
import { CITADEL_Y, FIELD } from './terrain';
import { label, torch, banner, prop } from './college';
import { createDragon, type Dragon } from '../entities/dragon';
import { BOND_SPECIES } from '../data/dragons';
import { pbr } from '../engine/textures';

const Y = CITADEL_Y;
const stone = pbr('castle_brick_07', 0x80848f);
const dark = new THREE.MeshStandardMaterial({ color: 0x14121a, flatShading: true, side: THREE.DoubleSide });
const wood = pbr('dark_planks', 0x9a7a5a);
const sand = new THREE.MeshStandardMaterial({ color: 0xb9a27a, roughness: 1 });
const straw = new THREE.MeshStandardMaterial({ color: 0xc9a85a, roughness: 1, flatShading: true });

/**
 * The Flight Field and what lives around it: the Aeries (stone dens along the east cliff, a dragon sleeping in each),
 * the Vale hatching ground (stone ring with eggs) and field furniture (landing circle, flight poles, review stand).
 * Layout is invented; the books only say the Riders Quadrant has a flight field, dragon homes and hatching grounds.
 */
export class FlightField {
  readonly group = new THREE.Group();
  private dragons: { d: Dragon; phase: number }[] = [];
  private eggs: THREE.Mesh[] = [];

  constructor() {
    const g = this.group;
    this.aeries(g);
    this.vale(g);
    this.furniture(g);
  }

  private aeries(g: THREE.Group): void {
    const x = FIELD.x1 - 6;
    const zs = [-95, -62, -29, 4, 37, 70];
    // Gold is tiny and strange: it goes in the smallest den (last); the big ones get the common colours
    const order = [0, 1, 2, 3, 4, 5];
    zs.forEach((z, i) => {
      const sp = BOND_SPECIES[order[i] % BOND_SPECIES.length];
      // terrace + two pillars + lintel + dark cave back wall
      const terr = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 18), stone);
      terr.position.set(x + 2, Y + 0.5, z); terr.receiveShadow = true; g.add(terr);
      for (const s of [-1, 1]) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(2.6, 14, 2.6), stone);
        p.position.set(x - 4, Y + 7, z + s * 7); p.castShadow = true; g.add(p);
        addBox(x - 4, z + s * 7, 2.6, 2.6, Y + 14);
      }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 18), stone);
      lintel.position.set(x - 4, Y + 15.5, z); lintel.castShadow = true; g.add(lintel);
      addBox(x - 4, z, 3, 18, Y + 17, Y + 14);
      const back = new THREE.Mesh(new THREE.BoxGeometry(1, 16, 16), dark);
      back.position.set(x + 9.5, Y + 8, z); g.add(back);
      addBox(x + 9.5, z, 1, 16, Y + 16);
      for (const s of [-1, 1]) { // side walls of the den
        const w = new THREE.Mesh(new THREE.BoxGeometry(14, 16, 1), stone);
        w.position.set(x + 3, Y + 8, z + s * 8.5); w.castShadow = true; g.add(w);
        addBox(x + 3, z + s * 8.5, 14, 1, Y + 16);
      }
      const roof = new THREE.Mesh(new THREE.BoxGeometry(15, 1.2, 18), stone);
      roof.position.set(x + 3, Y + 16.6, z); g.add(roof);
      addBox(x + 3, z, 15, 18, Y + 17.2, Y + 16);
      // the resident dragon, asleep
      const d = createDragon({ name: sp.color, color: sp.hex, tail: sp.tail, size: sp.size });
      d.group.position.set(x + 3, Y + 1.1, z); d.group.scale.setScalar(1.8);
      d.group.rotation.y = Math.PI / 2; // forward = (-sin, -cos) -> faces -x, toward the field
      g.add(d.group);
      this.dragons.push({ d, phase: i * 1.7 });
      label(g, `${sp.color} aerie`, '#ffd0a0', x - 4, Y + 20, z, 10);
      torch(g, x - 7, Y + 1, z - 10); torch(g, x - 7, Y + 1, z + 10);
    });
    label(g, 'The Aeries', '#ffd98a', x - 4, Y + 30, (zs[0] + zs[zs.length - 1]) / 2, 22);
  }

  private vale(g: THREE.Group): void {
    const cx = 222, cz = -108;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 0.3, 28), sand);
    disc.position.set(cx, Y + 0.1, cz); disc.receiveShadow = true; g.add(disc);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2, px = cx + Math.cos(a) * 12, pz = cz + Math.sin(a) * 12;
      const st = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5 + (i % 3), 1.1), stone);
      st.position.set(px, Y + 2.7, pz); st.rotation.y = -a; st.castShadow = true; g.add(st);
      addCircle(px, pz, 0.9, Y + 5);
    }
    const cols = [0x6b4a2c, 0xc8691f, 0xa02a20, 0x3f8a4a, 0x2c4f9a, 0x15161c, 0xd7b04a];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3, r = i === 6 ? 0 : 5, ex = cx + Math.cos(a) * r, ez = cz + Math.sin(a) * r;
      const nest = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.5, 8), straw);
      nest.position.set(ex, Y + 0.45, ez); nest.receiveShadow = true; g.add(nest);
      const egg = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), new THREE.MeshStandardMaterial({ color: cols[i], roughness: 0.45, metalness: 0.2, emissive: cols[i], emissiveIntensity: 0.12 }));
      egg.scale.y = 1.35; egg.position.set(ex, Y + 1.4, ez); egg.castShadow = true; g.add(egg);
      this.eggs.push(egg);
      addCircle(ex, ez, 1.0, Y + 2.4);
    }
    const warm = new THREE.PointLight(0xffa860, 30, 22, 1.6); warm.position.set(cx, Y + 5, cz); g.add(warm);
    label(g, 'The Vale - Hatching Ground', '#ffe9b0', cx, Y + 11, cz, 18);
  }

  private furniture(g: THREE.Group): void {
    // landing / Threshing circle in the middle of the field
    const ring = new THREE.Mesh(new THREE.RingGeometry(9, 10.5, 40), new THREE.MeshBasicMaterial({ color: 0xe8d8a8, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(236, Y + 0.12, -15); g.add(ring);
    // flight poles with pennants at the corners
    const pole = (x: number, z: number, col: number) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 18, 6), wood);
      p.position.set(x, Y + 9, z); p.castShadow = true; g.add(p);
      addCircle(x, z, 0.4, Y + 18);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.2), new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide }));
      f.position.set(x + 2.6, Y + 16.6, z); g.add(f);
    };
    pole(FIELD.x0 + 10, FIELD.z0 + 10, 0xa02a20); pole(FIELD.x0 + 10, FIELD.z1 - 10, 0xa02a20);
    pole(FIELD.x1 - 30, FIELD.z0 + 10, 0x2c4f9a); pole(FIELD.x1 - 30, FIELD.z1 - 10, 0x2c4f9a);
    // review stand near the Gauntlet exit
    const sx = FIELD.x0 + 8, sz = -22;
    prop(g, sx, sz, 8, 12, 1.2, Y, wood);
    prop(g, sx - 1, sz, 4, 12, 2.4, Y, wood);
    for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5, 5), wood); post.position.set(sx + 3, Y + 3.7, sz + s * 5.5); g.add(post); }
    const awn = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 13), new THREE.MeshStandardMaterial({ color: 0x8a2a20, roughness: 1 }));
    awn.position.set(sx, Y + 6.3, sz); g.add(awn);
    banner(g, sx - 3.6, Y + 5.5, sz, 0xa02a20, Math.PI / 2, 4);
  }

  update(t: number): void {
    for (const { d, phase } of this.dragons) {
      d.update(t + phase, 0);
      d.group.position.y += (Math.sin(t * 0.9 + phase) * 0.03);
    }
    for (let i = 0; i < this.eggs.length; i++) {
      const m = this.eggs[i].material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(t * 1.3 + i));
    }
  }
}
