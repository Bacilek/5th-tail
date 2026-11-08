import * as THREE from 'three';
import { heightAt, COLLEGE, HEALERS, INFANTRY, SCRIBE, MESA, FIELD, VILLAGE, CAMP, type Rect } from './terrain';
const KEEP_OUT: Rect[] = [COLLEGE, HEALERS, INFANTRY, SCRIBE, MESA, FIELD, VILLAGE, CAMP];
import { addCircle } from './collision';
import { fbm, mulberry } from '../engine/noise';

export function buildTrees(): THREE.Group {
  const rnd = mulberry(1337);
  const pts: { x: number; y: number; z: number; s: number }[] = [];
  for (let i = 0; i < 9000 && pts.length < 1800; i++) {
    const x = (rnd() - 0.5) * 560, z = (rnd() - 0.5) * 560;
    if (KEEP_OUT.some((r) => x > r.x0 - 10 && x < r.x1 + 10 && z > r.z0 - 10 && z < r.z1 + 10)) continue;

    const h = heightAt(x, z);
    if (h < 6 || h > 70) continue;
    if (Math.abs(heightAt(x + 2, z) - h) + Math.abs(heightAt(x, z + 2) - h) > 2.2) continue;
    if (fbm(x * 0.03, z * 0.03) < 0.42) continue;
    pts.push({ x, y: h, z, s: 0.8 + rnd() * 1.1 });
  }
  for (const t of pts) addCircle(t.x, t.z, 0.45 * t.s, t.y + 8.5 * t.s);
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.4, 3, 5), new THREE.MeshStandardMaterial({ color: 0x4a3524, flatShading: true }), pts.length);
  const f1 = new THREE.InstancedMesh(new THREE.ConeGeometry(2.2, 4.5, 6), new THREE.MeshStandardMaterial({ color: 0x1f4a30, flatShading: true }), pts.length);
  const f2 = new THREE.InstancedMesh(new THREE.ConeGeometry(1.6, 3.8, 6), new THREE.MeshStandardMaterial({ color: 0x2a5c3a, flatShading: true }), pts.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  pts.forEach((t, i) => {
    sc.set(t.s, t.s, t.s);
    m.compose(p.set(t.x, t.y + 1.5 * t.s, t.z), q, sc); trunk.setMatrixAt(i, m);
    m.compose(p.set(t.x, t.y + 4.2 * t.s, t.z), q, sc); f1.setMatrixAt(i, m);
    m.compose(p.set(t.x, t.y + 6.4 * t.s, t.z), q, sc); f2.setMatrixAt(i, m);
  });
  [trunk, f1, f2].forEach((o) => { o.castShadow = true; });
  const g = new THREE.Group();
  g.add(trunk, f1, f2);
  return g;
}
