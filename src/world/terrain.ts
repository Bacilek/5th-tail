import * as THREE from 'three';
import { fbm, smoothstep } from '../engine/noise';

export const PLATEAU = 10;
export const MAP_HALF = 290;
// Ravine band (the Parapet crosses it along z at x=0)
export const RAVINE_Z0 = 40;
export const RAVINE_Z1 = 70;
export const PARAPET_Z0 = 36;
export const PARAPET_Z1 = 74;
export const PARAPET_HALF_W = 0.8;
// College courtyard rectangle (flattened)
export const COLLEGE = { x0: -52, x1: 52, z0: -65, z1: 38 };

export function heightAt(x: number, z: number): number {
  const dr = Math.max(0, Math.abs(z - 55) - 15);
  const flatR = 1 - smoothstep(0, 20, dr);
  const dx = Math.max(0, Math.abs(x) - COLLEGE.x1);
  const dz = Math.max(0, COLLEGE.z0 - z, z - COLLEGE.z1);
  const flatC = 1 - smoothstep(0, 20, Math.hypot(dx, dz));
  const amp = 5 * (1 - flatR) * (1 - flatC);
  let h = PLATEAU + (fbm(x * 0.02, z * 0.02) - 0.5) * 2 * amp;
  h += (fbm(x * 0.06 + 9, z * 0.06 + 9) - 0.5) * amp * 0.5;

  const r = Math.hypot(x, z + 20);
  const m = smoothstep(130, 260, r);
  h += m * (40 + 170 * Math.pow(fbm(x * 0.007 + 50, z * 0.007 + 50), 1.4));

  const d = smoothstep(RAVINE_Z0 - 3, RAVINE_Z0 + 3, z) * (1 - smoothstep(RAVINE_Z1 - 3, RAVINE_Z1 + 3, z));
  h -= 62 * d;

  if (Math.abs(x) < PARAPET_HALF_W && z > PARAPET_Z0 && z < PARAPET_Z1) h = Math.max(h, PLATEAU);
  return h;
}

export function buildTerrain(): THREE.Mesh {
  const size = MAP_HALF * 2;
  const seg = 290;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
  }
  geo.computeVertexNormals();
  const nor = geo.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const grass = new THREE.Color(0x3a5a2a), dry = new THREE.Color(0x6b6a3a);
  const rock = new THREE.Color(0x55545a), snow = new THREE.Color(0xe8ecf2);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i), ny = nor.getY(i);
    const noise = fbm(pos.getX(i) * 0.1, pos.getZ(i) * 0.1, 2);
    c.copy(grass).lerp(dry, noise * 0.8);
    c.lerp(rock, Math.min(1, smoothstep(0.88, 0.7, ny) + smoothstep(40, 90, y) * 0.6));
    c.lerp(snow, smoothstep(85, 120, y) * smoothstep(0.55, 0.9, ny));
    c.multiplyScalar(0.85 + noise * 0.3);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  mesh.receiveShadow = true;
  return mesh;
}
