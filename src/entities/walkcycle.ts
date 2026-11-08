import * as THREE from 'three';

/** A limb that rotates around its top (shoulder/hip): a pivot group holding a mesh that hangs down from it. */
export function makeLimb(w: number, h: number, d: number, mat: THREE.Material, x: number, pivotY: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, pivotY, 0);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.y = -h / 2;
  m.castShadow = true;
  g.add(m);
  return g;
}

export interface Limbs { legs: THREE.Object3D[]; arms: THREE.Object3D[]; }

/** Minecraft-style walk cycle: legs and arms swing in opposite phase. `amount` 0..1 scales the swing. */
export function animateWalk(l: Limbs, phase: number, amount: number, legAmp = 0.8, armAmp = 0.65): void {
  const s = Math.sin(phase) * amount;
  l.legs[0].rotation.x = s * legAmp;
  l.legs[1].rotation.x = -s * legAmp;
  l.arms[0].rotation.x = -s * armAmp;
  l.arms[1].rotation.x = s * armAmp;
}

/** Seated pose for riding a broom/dragon: legs forward-bent, arms forward. */
export function ridePose(l: Limbs): void {
  l.legs[0].rotation.x = l.legs[1].rotation.x = -1.2;
  l.arms[0].rotation.x = l.arms[1].rotation.x = -0.9;
}
