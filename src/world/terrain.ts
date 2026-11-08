import * as THREE from 'three';
import { fbm, smoothstep } from '../engine/noise';
import { tex } from '../engine/textures';

export const PLATEAU = 10;
export const MAP_HALF = 290;

export interface Rect { x0: number; x1: number; z0: number; z1: number; }
// Lower college (administrative courtyard, Conscription Day assembly)
export const COLLEGE: Rect = { x0: -52, x1: 52, z0: -65, z1: 38 };
// Each quadrant has its own campus
export const HEALERS: Rect = { x0: -40, x1: 40, z0: 44, z1: 104 };      // south, via southern gate
export const INFANTRY: Rect = { x0: -48, x1: 48, z0: -124, z1: -72 };   // north, via northern turret/gate (largest)
export const SCRIBE: Rect = { x0: -125, x1: -72, z0: -46, z1: -4 };     // west, sunken (archives)
export const SCRIBE_Y = PLATEAU - 6;
// Riders: the Citadel on a high ridge/mesa east of the college
export const MESA: Rect = { x0: 86, x1: 190, z0: -62, z1: 14 };
// The Gauntlet: walled obstacle corridor from the Citadel east gate to the Flight Field
export const GAUNTLET: Rect = { x0: 128, x1: 190, z0: -30, z1: -14 };
// Flight Field: big open meadow east of the Gauntlet, level with the Citadel (Threshing, flight practice)
export const FIELD: Rect = { x0: 192, x1: 276, z0: -125, z1: 95 };
// Basgiath village (south-west) and a Venin camp (south-east), both flattened pads
export const VILLAGE: Rect = { x0: -120, x1: -60, z0: 62, z1: 112 };
export const CAMP: Rect = { x0: 70, x1: 122, z0: 100, z1: 150 };
export const CITADEL: Rect = { x0: 90, x1: 126, z0: -52, z1: 8 };
export const CITADEL_Y = 58.5;
// Conscription Tower and the Parapet (stone span, ~60 m up, 1.2 m wide, no rails)
export const TOWER = { x: 40, z: -20, r: 5, top: 62 };
/** Ground-floor door of the (hollow) Conscription Tower faces south (+z); angle = atan2(dz,dx) from the axis; half-angle in radians as seen from the tower axis. */
export const TOWER_DOOR = { angle: Math.PI / 2, half: 0.42, height: 3.8 };
export const PARAPET = { y: 62, z: -20, x0: 43, x1: 92, half: 0.6 };

/**
 * Outer spiral stair of the Conscription Tower (4 turns, 32 steps each, starts and ends on the west side).
 * Analytic walkable surface: returns the highest step top at (x,z) that is at most `reach` above y, else -Infinity.
 */
export const STAIR = { turns: 4, perTurn: 32, r0: 6.3, r1: 9.0, y0: 10, landing: 62 };
STAIR.y0 = PLATEAU;
const STAIR_RISE = (TOWER.top - 0.25 - PLATEAU) / (STAIR.turns * STAIR.perTurn - 1);
export const STAIR_STEPS = STAIR.turns * STAIR.perTurn;
export function stairStepY(s: number): number { return PLATEAU + s * STAIR_RISE; }
export function stairAngle(s: number): number { return Math.PI + ((s % STAIR.perTurn) + 0.5) / STAIR.perTurn * Math.PI * 2; }
export function towerStairAt(x: number, z: number, y: number, reach: number): number {
  const dx = x - TOWER.x, dz = z - TOWER.z;
  const r = Math.hypot(dx, dz);
  if (r < STAIR.r0 || r > STAIR.r1) return -Infinity;
  const phi = (((Math.atan2(dz, dx) - Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const base = Math.floor(phi / (Math.PI * 2) * STAIR.perTurn);
  const stepMax = Math.floor((y + reach - PLATEAU) / STAIR_RISE + 1e-6);
  const k = Math.min(STAIR.turns - 1, Math.floor((stepMax - base) / STAIR.perTurn));
  if (k < 0) return -Infinity;
  return stairStepY(k * STAIR.perTurn + base);
}

/** True if a body at (x,z) with feet at y would be inside a stair step it cannot step onto (> 0.55 above its feet). */
export function stairBlocked(x: number, z: number, y: number, height = 1.8): boolean {
  const dx = x - TOWER.x, dz = z - TOWER.z;
  const r = Math.hypot(dx, dz);
  if (r < STAIR.r0 - 0.1 || r > STAIR.r1 + 0.1) return false;
  const phi = (((Math.atan2(dz, dx) - Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const base = Math.floor(phi / (Math.PI * 2) * STAIR.perTurn);
  for (let k = 0; k < STAIR.turns; k++) {
    const top = stairStepY(k * STAIR.perTurn + base);
    if (top - y > 0.55 && top - 0.9 < y + height) return true;
  }
  return false;
}

function rectDist(r: Rect, x: number, z: number): number {
  const dx = Math.max(r.x0 - x, 0, x - r.x1);
  const dz = Math.max(r.z0 - z, 0, z - r.z1);
  return Math.hypot(dx, dz);
}

export function inRect(r: Rect, x: number, z: number): boolean {
  return x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
}

export function onParapet(x: number, y: number, z: number): boolean {
  return y > 50 && x > PARAPET.x0 + 2 && x < PARAPET.x1 && Math.abs(z - PARAPET.z) < 3;
}

const FLAT_RECTS = [COLLEGE, HEALERS, INFANTRY, SCRIBE, MESA, FIELD, VILLAGE, CAMP];

export function onParapetStrip(x: number, z: number): boolean {
  return Math.abs(z - PARAPET.z) < PARAPET.half && x > PARAPET.x0 && x < PARAPET.x1;
}

/**
 * Ground height for something at height y: the Parapet span only counts as ground for bodies standing on/above it,
 * so a body that fell off cannot be snapped back up onto the bridge from below.
 */
export function heightAtFor(x: number, z: number, y: number): number {
  const h = heightAt(x, z);
  if (onParapetStrip(x, z) && y < PARAPET.y - 0.8) return baseHeight(x, z);
  return h;
}

export function heightAt(x: number, z: number): number {
  const h = baseHeight(x, z);
  return onParapetStrip(x, z) ? Math.max(h, PARAPET.y) : h;
}

export function baseHeight(x: number, z: number): number {
  let flat = 1;
  for (const r of FLAT_RECTS) flat *= smoothstep(0, 20, rectDist(r, x, z));
  const amp = 5 * flat;
  let h = PLATEAU + (fbm(x * 0.02, z * 0.02) - 0.5) * 2 * amp;
  h += (fbm(x * 0.06 + 9, z * 0.06 + 9) - 0.5) * amp * 0.5;

  const m = smoothstep(130, 260, Math.hypot(x, z + 20));
  h += m * (40 + 170 * Math.pow(fbm(x * 0.007 + 50, z * 0.007 + 50), 1.4));

  h -= (PLATEAU - SCRIBE_Y) * (1 - smoothstep(0, 10, rectDist(SCRIBE, x, z)));
  const mk = 1 - smoothstep(0, 12, rectDist(MESA, x, z));
  h += (CITADEL_Y - h) * mk;
  const fk = 1 - smoothstep(0, 22, rectDist(FIELD, x, z));
  h += (CITADEL_Y - h) * fk;
  for (const r of [VILLAGE, CAMP]) h += (PLATEAU - h) * (1 - smoothstep(0, 15, rectDist(r, x, z)));

  return h;
}

export function buildTerrain(): THREE.Mesh {
  const size = MAP_HALF * 2;
  const seg = 290;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, baseHeight(pos.getX(i), pos.getZ(i)));
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
  // texture coordinates in world space + per-vertex rock weight for the two-texture splat (grass/dirt vs. rock)
  const uvs = new Float32Array(pos.count * 2), rockW = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2] = pos.getX(i) / 7; uvs[i * 2 + 1] = pos.getZ(i) / 7;
    rockW[i] = Math.min(1, smoothstep(0.88, 0.7, nor.getY(i)) + smoothstep(40, 90, pos.getY(i)) * 0.6);
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute('rockW', new THREE.BufferAttribute(rockW, 1));
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, map: tex('forest_ground_04_diff') });
  const rockMap = tex('rock_face_03_diff');
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.rockMap = { value: rockMap };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float rockW;\nvarying float vRockW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRockW = rockW;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D rockMap;\nvarying float vRockW;')
      .replace('#include <map_fragment>', 'vec4 gTex = texture2D(map, vMapUv); vec4 rTex = texture2D(rockMap, vMapUv * 0.55); diffuseColor *= mix(gTex, rTex, vRockW);');
  };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}
