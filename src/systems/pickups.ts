import * as THREE from 'three';
import { heightAt } from '../world/terrain';

export interface Pickup {
  item: 'scroll' | 'herb';
  quest: string;
  mesh: THREE.Object3D;
  base: number;
  taken: boolean;
}

const POSITIONS: { item: 'scroll' | 'herb'; quest: string; x: number; z: number }[] = [
  { item: 'scroll', quest: 'q_scrolls', x: -20, z: 18 },
  { item: 'scroll', quest: 'q_scrolls', x: 20, z: -80 },
  { item: 'scroll', quest: 'q_scrolls', x: -26, z: 70 },
  { item: 'herb', quest: 'q_herbs', x: -18, z: 87 },
  { item: 'herb', quest: 'q_herbs', x: 18, z: 93 },
  { item: 'herb', quest: 'q_herbs', x: -18, z: 97 },
];

export function buildPickups(scene: THREE.Scene): Pickup[] {
  return POSITIONS.map((p) => {
    let mesh: THREE.Object3D;
    if (p.item === 'scroll') {
      const g = new THREE.Group();
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0xe8d9a8, emissive: 0x665522, flatShading: true }));
      roll.rotation.z = Math.PI / 2;
      g.add(roll);
      mesh = g;
    } else {
      const m = new THREE.MeshStandardMaterial({ color: 0x4fd06a, emissive: 0x1a5a2a, flatShading: true });
      const g = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 4), m);
        leaf.rotation.z = (i - 1) * 0.5;
        g.add(leaf);
      }
      mesh = g;
    }
    const base = heightAt(p.x, p.z) + 1.0;
    mesh.position.set(p.x, base, p.z);
    mesh.visible = false;
    scene.add(mesh);
    return { item: p.item, quest: p.quest, mesh, base, taken: false };
  });
}
