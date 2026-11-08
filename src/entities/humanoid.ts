import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

/**
 * Rigged humanoid (Quaternius Universal Base Characters, CC0) animated procedurally by rotating bones.
 * Poses are expressed as rotations about model axes applied on the bind pose, so no bone-axis knowledge is needed.
 * Model space: +Y up, character faces +Z (the wrapper group turns it to face -Z like the rest of the game).
 */

export interface HumanoidLook { female?: boolean; skin?: number; hair?: number; }
export interface HumanoidState {
  speed: number;        // ground speed m/s
  swing: number;        // 0 = idle, 0..1 melee swing progress
  power: boolean;
  blocking: boolean;
  ride: boolean;
  /** 0..1 how much the character is crouched/dodging etc. (reserved) */
  lean?: number;
}

const BONES = [
  'pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'Head',
  'clavicle_l', 'upperarm_l', 'lowerarm_l', 'hand_l', 'clavicle_r', 'upperarm_r', 'lowerarm_r', 'hand_r',
  'thigh_l', 'calf_l', 'foot_l', 'thigh_r', 'calf_r', 'foot_r',
] as const;
type BoneName = typeof BONES[number];

const loaded: { male?: THREE.Group; female?: THREE.Group } = {};

export class Humanoid {
  readonly root = new THREE.Group();      // add this to the scene / character group
  private model: THREE.Object3D;
  private bone = {} as Record<BoneName, THREE.Bone>;
  private restLocal = {} as Record<BoneName, THREE.Quaternion>;
  private parentRestWorld = {} as Record<BoneName, THREE.Quaternion>;
  private phase = Math.random() * 6;
  private amt = 0;
  private baseY = 0;
  height = 1.8;
  headY = 1.7;
  bodyMat: THREE.MeshStandardMaterial | null = null;
  hairMat: THREE.MeshStandardMaterial | null = null;

  static get ready(): boolean { return !!loaded.male && !!loaded.female; }

  /** Loads both models once (call early; resolves when ready). */
  static async preload(): Promise<void> {
    if (Humanoid.ready) return;
    const loader = new GLTFLoader();
    const load = (name: string) => new Promise<THREE.Group>((res, rej) => loader.load(`./models/${name}.gltf`, (g) => res(g.scene), undefined, rej));
    try {
      [loaded.male, loaded.female] = await Promise.all([load('Superhero_Male_FullBody'), load('Superhero_Female_FullBody')]);
    } catch (e) { console.warn('humanoid models failed to load, using box characters', e); }
  }

  constructor(look: HumanoidLook = {}) {
    const src = look.female ? loaded.female! : loaded.male!;
    this.model = cloneSkinned(src);
    this.root.add(this.model);
    this.model.rotation.y = Math.PI; // face -Z
    this.model.traverse((o) => {
      const b = o as THREE.Bone;
      if (b.isBone && (BONES as readonly string[]).includes(b.name)) this.bone[b.name as BoneName] = b;
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true; m.frustumCulled = false;
        // clone materials so every character can be tinted separately
        const mats = (Array.isArray(m.material) ? m.material : [m.material]).map((mat) => (mat as THREE.MeshStandardMaterial).clone());
        m.material = Array.isArray(m.material) ? mats : mats[0];
        for (const mat of mats) {
          if (/Hair/i.test(mat.name)) this.hairMat = mat;
          else if (/Eye/i.test(mat.name)) { /* leave */ } else this.bodyMat = mat;
        }
      }
    });
    // measure and scale to ~1.8 m
    this.model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.model);
    const h = box.max.y - box.min.y;
    const k = 1.8 / (h || 1.8);
    this.model.scale.setScalar(k);
    this.baseY = -box.min.y * k;
    this.model.position.y = this.baseY;
    this.model.updateMatrixWorld(true);
    this.height = 1.8;
    // rest data
    const tmp = new THREE.Quaternion();
    for (const n of BONES) {
      const b = this.bone[n];
      if (!b) continue;
      this.restLocal[n] = b.quaternion.clone();
      this.parentRestWorld[n] = b.parent ? b.parent.getWorldQuaternion(tmp).clone() : new THREE.Quaternion();
    }
    this.headY = this.bone.Head ? this.bone.Head.getWorldPosition(new THREE.Vector3()).y - this.root.position.y : 1.7;
    this.setLook(look);
    this.pose({ speed: 0, swing: 0, power: false, blocking: false, ride: false }, 0);
  }

  private clothing: THREE.Mesh[] = [];

  /** Adds tinted clothing layers (top, trousers, boots) by inflating the body triangles of those regions. */
  dress(top: number, bottom = 0x2b2a33, boots = 0x3a2a1e): void {
    for (const c of this.clothing) { c.parent?.remove(c); }
    this.clothing = [];
    let body: THREE.SkinnedMesh | null = null;
    this.model.traverse((o) => { const m = o as THREE.SkinnedMesh; if (m.isSkinnedMesh && /SuperHero|Body/i.test(m.name)) body = m; });
    if (!body) return;
    const sm = body as THREE.SkinnedMesh;
    const geo = sm.geometry, pos = geo.attributes.position, nor = geo.attributes.normal;
    const sidx = geo.attributes.skinIndex, swt = geo.attributes.skinWeight;
    const names = sm.skeleton.bones.map((b) => b.name);
    const dominant = (v: number): string => {
      let best = 0, bw = -1;
      for (let k = 0; k < 4; k++) { const w = (swt as THREE.BufferAttribute).getComponent(v, k); if (w > bw) { bw = w; best = (sidx as THREE.BufferAttribute).getComponent(v, k); } }
      return names[best] ?? '';
    };
    const sets: [RegExp, number][] = [
      [/^(spine_0[123]|clavicle_[lr]|upperarm_[lr]|lowerarm_[lr])$/, top],
      [/^(pelvis|thigh_[lr]|calf_[lr])$/, bottom],
      [/^(foot_[lr]|ball_[lr])$/, boots],
    ];
    const index = geo.index ? Array.from(geo.index.array as ArrayLike<number>) : Array.from({ length: pos.count }, (_, i) => i);
    const dom: string[] = [];
    for (let v = 0; v < pos.count; v++) dom.push(dominant(v));
    const box = new THREE.Box3().setFromBufferAttribute(pos as THREE.BufferAttribute);
    const inflate = (box.max.y - box.min.y) * 0.006;
    for (const [re, color] of sets) {
      const idx: number[] = [];
      for (let t = 0; t < index.length; t += 3) {
        if (re.test(dom[index[t]]) && re.test(dom[index[t + 1]]) && re.test(dom[index[t + 2]])) idx.push(index[t], index[t + 1], index[t + 2]);
      }
      if (!idx.length) continue;
      const g = new THREE.BufferGeometry();
      for (const name of Object.keys(geo.attributes)) g.setAttribute(name, geo.attributes[name]);
      const p2 = new Float32Array(pos.count * 3);
      for (let v = 0; v < pos.count; v++) {
        p2[v * 3] = pos.getX(v) + nor.getX(v) * inflate; p2[v * 3 + 1] = pos.getY(v) + nor.getY(v) * inflate; p2[v * 3 + 2] = pos.getZ(v) + nor.getZ(v) * inflate;
      }
      g.setAttribute('position', new THREE.BufferAttribute(p2, 3));
      g.setIndex(idx);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0 });
      const mesh = new THREE.SkinnedMesh(g, mat);
      mesh.bind(sm.skeleton, sm.bindMatrix);
      mesh.castShadow = true; mesh.frustumCulled = false;
      sm.parent!.add(mesh);
      this.clothing.push(mesh);
    }
  }

  /** A bone by name (for attaching weapons etc.). */
  getBone(n: BoneName): THREE.Bone | undefined { return this.bone[n]; }

  setLook(look: HumanoidLook): void {
    if (this.bodyMat && look.skin !== undefined) this.bodyMat.color.setHex(look.skin);
    if (this.hairMat && look.hair !== undefined) this.hairMat.color.setHex(look.hair);
  }

  private static ax = new THREE.Vector3(1, 0, 0);
  private static ay = new THREE.Vector3(0, 1, 0);
  private static az = new THREE.Vector3(0, 0, 1);
  private qa = new THREE.Quaternion();
  private qb = new THREE.Quaternion();
  private qc = new THREE.Quaternion();
  private inv = new THREE.Quaternion();

  /** Applies a rotation (about model X/Y/Z, radians) on top of the bind pose of a bone, relative to its parent. */
  private rot(n: BoneName, rx: number, ry = 0, rz = 0): void {
    const b = this.bone[n];
    if (!b) return;
    // delta in model axes, applied in the parent's rest frame
    this.qa.setFromAxisAngle(Humanoid.az, rz);
    this.qb.setFromAxisAngle(Humanoid.ay, ry);
    this.qc.setFromAxisAngle(Humanoid.ax, rx);
    const delta = this.qa.multiply(this.qb).multiply(this.qc);
    const pw = this.parentRestWorld[n];
    this.inv.copy(pw).invert();
    b.quaternion.copy(this.inv).multiply(delta).multiply(pw).multiply(this.restLocal[n]);
  }

  /** Sets the whole pose for the current state. `dt` advances the walk phase. */
  pose(s: HumanoidState, dt: number): void {
    const moving = s.speed > 0.4 && !s.ride;
    this.amt += ((moving ? Math.min(1, s.speed / 5) : 0) - this.amt) * Math.min(1, 10 * dt);
    this.phase += s.speed * dt * 1.55;
    const p = this.phase, a = this.amt;
    const sw = Math.sin(p) * a;
    const side = (left: boolean) => (left ? 1 : -1);

    // legs
    if (s.ride) {
      for (const l of [true, false]) { this.rot(l ? 'thigh_l' : 'thigh_r', -1.1, 0, side(l) * 0.25); this.rot(l ? 'calf_l' : 'calf_r', 1.2); }
    } else {
      this.rot('thigh_l', -sw * 0.75); this.rot('thigh_r', sw * 0.75);
      this.rot('calf_l', Math.max(0, Math.sin(p + 1.6)) * a * 1.0);
      this.rot('calf_r', Math.max(0, -Math.sin(p + 1.6)) * a * 1.0);
    }
    // arms hang down along the body (T-pose -> down), then swing
    const armDown = -1.2;
    let swingR = sw * 0.6, swingL = -sw * 0.6;
    let rRaise = 0, lRaise = 0, rTwist = 0, spineTwist = Math.sin(p) * a * 0.12;
    if (s.blocking) { rRaise = 1.2; lRaise = 1.4; swingR = swingL = 0; }
    if (s.ride) { swingR = swingL = 0.5; }
    let attackLean = 0;
    if (s.swing > 0) {
      const t = s.swing, ease = (x: number) => x * x * (3 - 2 * x);
      const back = s.power ? -2.4 : -1.4, fwd = s.power ? 0.4 : 0.2;
      let r: number;
      if (t < 0.38) r = back * ease(t / 0.38);
      else if (t < 0.6) r = back + (fwd - back) * Math.pow((t - 0.38) / 0.22, 2);
      else r = fwd * (1 - ease((t - 0.6) / 0.4));
      swingR = r; rRaise = 0.6;
      spineTwist = (t < 0.38 ? 0.3 * ease(t / 0.38) : t < 0.6 ? 0.3 - 0.7 * ((t - 0.38) / 0.22) : -0.4 * (1 - ease((t - 0.6) / 0.4)));
      attackLean = t > 0.38 && t < 0.7 ? 0.12 : 0;
      rTwist = r * 0.0;
    }
    this.rot('clavicle_l', 0); this.rot('clavicle_r', 0);
    this.rot('upperarm_l', swingL - lRaise * 0.8, 0, side(true) * -armDown * (s.blocking ? 0.4 : 1));
    this.rot('upperarm_r', swingR - rRaise * 0.8 + rTwist, 0, side(false) * -armDown * (s.blocking ? 0.4 : 1));
    this.rot('lowerarm_l', -0.25 - lRaise * 0.5 - Math.max(0, -swingL) * 0.5);
    this.rot('lowerarm_r', -0.25 - rRaise * 0.4 - Math.max(0, -swingR) * 0.5);
    // spine / head
    this.rot('pelvis', 0, -spineTwist * 0.3, 0);
    this.rot('spine_01', attackLean * 0.3 + (s.ride ? 0.15 : 0), spineTwist * 0.5);
    this.rot('spine_02', attackLean * 0.4 + Math.sin(performance.now() / 900) * 0.01, spineTwist * 0.5);
    this.rot('spine_03', attackLean * 0.3, spineTwist * 0.2);
    this.rot('neck_01', 0, -spineTwist * 0.4);
    this.model.position.y = this.baseY + Math.abs(Math.sin(p)) * a * 0.035;
  }
}
