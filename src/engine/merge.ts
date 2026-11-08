import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Merges the plain static meshes under `root` into a few big meshes per (spatial cell, material, shadow flags).
 * Thousands of tiny meshes cost a draw call each (CPU bound); merged cells keep frustum culling coarse but cheap.
 * Skips instanced/skinned meshes, array materials and anything with userData.keep. Call once after the world is built.
 */
export function mergeStatic(root: THREE.Object3D, cell = 40): void {
  root.updateMatrixWorld(true);
  const buckets = new Map<string, { mat: THREE.Material; cast: boolean; recv: boolean; geos: THREE.BufferGeometry[] }>();
  const doomed: THREE.Mesh[] = [];
  const p = new THREE.Vector3();
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh || (m as THREE.SkinnedMesh).isSkinnedMesh || Array.isArray(m.material) || m.userData.keep) return;
    const src = m.geometry;
    if (!src.attributes.position) return;
    const g = src.clone();
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
    const ng = g.index ? g.toNonIndexed() : g;
    if (!ng.attributes.normal) ng.computeVertexNormals();
    if (!ng.attributes.uv) ng.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(ng.attributes.position.count * 2), 2));
    ng.applyMatrix4(m.matrixWorld);
    m.getWorldPosition(p);
    const key = `${Math.floor(p.x / cell)}|${Math.floor(p.z / cell)}|${(m.material as THREE.Material).uuid}|${+m.castShadow}${+m.receiveShadow}`;
    let b = buckets.get(key);
    if (!b) { b = { mat: m.material as THREE.Material, cast: m.castShadow, recv: m.receiveShadow, geos: [] }; buckets.set(key, b); }
    b.geos.push(ng);
    doomed.push(m);
  });
  for (const m of doomed) { m.parent?.remove(m); m.geometry.dispose(); }
  for (const b of buckets.values()) {
    const merged = mergeGeometries(b.geos, false);
    if (!merged) continue;
    for (const g of b.geos) g.dispose();
    const mesh = new THREE.Mesh(merged, b.mat);
    mesh.castShadow = b.cast; mesh.receiveShadow = b.recv;
    root.add(mesh);
  }
}
