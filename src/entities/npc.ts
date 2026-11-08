import * as THREE from 'three';
import type { NpcDef } from '../data/npcs';
import { heightAt } from '../world/terrain';
import { makeLabel } from '../world/college';
import { resolve } from '../world/collision';
import { makeLimb, animateWalk, type Limbs } from './walkcycle';

const SKINS = [0xf1d3b8, 0xd9b69a, 0xc08e6a, 0x9a6a46];

function hashId(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export class Npc {
  readonly group = new THREE.Group();
  readonly pos: THREE.Vector3;
  private phase = Math.random() * 6;
  private goal = new THREE.Vector3();
  private wait = 0;
  private home: THREE.Vector3;
  private aura: THREE.Group | null = null;
  private limbs: Limbs = { legs: [], arms: [] };
  private walkPhase = 0;
  private walkAmt = 0;
  private moving = false;

  private animate(dt: number): void {
    this.walkAmt += ((this.moving ? 1 : 0) - this.walkAmt) * Math.min(1, 8 * dt);
    if (this.moving) this.walkPhase += dt * 6.5;
    animateWalk(this.limbs, this.walkPhase, this.walkAmt, 0.7, 0.55);
  }

  constructor(public def: NpcDef) {
    this.pos = new THREE.Vector3(def.x, heightAt(def.x, def.z), def.z);
    this.group.position.copy(this.pos);
    this.home = this.pos.clone();
    this.goal.copy(this.pos);
    const marks = (def.marks ?? []) as string[];
    const has = (m: string) => marks.includes(m);
    const std = (c: number) => new THREE.MeshStandardMaterial({ color: c, flatShading: true });
    const cloth = std(def.cloth);
    const skin = std(def.skin ?? SKINS[hashId(def.id) % SKINS.length]);
    const hair = std(def.hair);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.32), cloth);
    torso.position.y = 1.15;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), skin);
    head.position.y = 1.72;
    this.group.add(torso, head);

    // hair: standard cap, or a half-shaved cap (Imogen)
    if (has('halfShaved')) {
      const side = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6, 0, Math.PI, 0, Math.PI * 0.55), std(0xff6fae));
      side.position.y = 1.74;
      const stubble = new THREE.Mesh(new THREE.SphereGeometry(0.205, 8, 6, Math.PI, Math.PI, 0, Math.PI * 0.55), std(0x5a3a4a));
      stubble.position.y = 1.74;
      this.group.add(side, stubble);
    } else {
      const hr = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
      hr.position.y = 1.74;
      this.group.add(hr);
    }
    if (has('tousled')) {
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), hair);
        const a = i * 1.3;
        spike.position.set(Math.cos(a) * 0.12, 1.96, Math.sin(a) * 0.12);
        spike.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
        this.group.add(spike);
      }
    }
    if (has('crownBraid')) {
      const crown = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 6, 14), hair);
      crown.rotation.x = Math.PI / 2; crown.position.y = 1.86;
      this.group.add(crown);
    }
    if (has('silverTips')) {
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.07), hair);
      upper.position.set(0, 1.55, 0.2);
      const tips = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.07), std(0xd8dce8));
      tips.position.set(0, 1.27, 0.2);
      this.group.add(upper, tips);
    }
    if (has('longHair')) {
      const lh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.7, 0.08), hair);
      lh.position.set(0, 1.5, 0.19);
      this.group.add(lh);
    }
    if (has('braid')) {
      const braid = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.55, 0.09), hair);
      braid.position.set(0.06, 1.48, 0.2); braid.rotation.x = 0.15;
      this.group.add(braid);
    }

    // eyes (model faces -z)
    const eyeCol = def.eyes ?? 0x201814;
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), new THREE.MeshBasicMaterial({ color: has('goldEyes') ? 0x0a0a10 : eyeCol }));
      eye.position.set(s * 0.075, 1.74, -0.18);
      this.group.add(eye);
      if (has('goldEyes')) {
        const fleck = new THREE.Mesh(new THREE.SphereGeometry(0.014, 4, 3), new THREE.MeshBasicMaterial({ color: 0xffc040 }));
        fleck.position.set(s * 0.075 + 0.012, 1.745, -0.212);
        this.group.add(fleck);
      }
    }
    if (has('chinScar')) {
      const scar = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.075, 0.01), new THREE.MeshBasicMaterial({ color: 0xf2e0d6 }));
      scar.position.set(0.04, 1.6, -0.17); scar.rotation.z = 0.5;
      this.group.add(scar);
    }
    if (has('insignia')) {
      for (const s of [-1, 1]) {
        const ep = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.2), new THREE.MeshStandardMaterial({ color: 0xd8b04a, metalness: 0.6, roughness: 0.4, flatShading: true }));
        ep.position.set(s * 0.36, 1.55, 0);
        this.group.add(ep);
      }
      const cape = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.1, 0.04), std(0x101018));
      cape.position.set(0, 1.0, 0.2);
      this.group.add(cape);
    }

    for (const s of [-1, 1]) {
      const leg = makeLimb(0.24, 0.8, 0.26, cloth, s * 0.15, 0.8);
      const arm = makeLimb(0.16, 0.7, 0.16, cloth, s * 0.4, 1.5);
      this.limbs.legs.push(leg); this.limbs.arms.push(arm);
      this.group.add(leg, arm);
    }
    // shadow wielder: dark wisps swirl around the feet
    if (has('shadowAura')) {
      this.aura = new THREE.Group();
      const m = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
      for (let i = 0; i < 7; i++) {
        const w = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.1 + (i % 3) * 0.35, 4), m);
        const a = (i / 7) * Math.PI * 2;
        w.position.set(Math.cos(a) * 0.75, 0.6 + (i % 3) * 0.2, Math.sin(a) * 0.75);
        w.rotation.z = Math.cos(a) * 0.4; w.rotation.x = Math.sin(a) * 0.4;
        this.aura.add(w);
      }
      this.group.add(this.aura);
    }
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh && !(o.material as THREE.Material).transparent) o.castShadow = true;
    });
    if (def.build === 'tall') this.group.scale.setScalar(1.1);
    else if (def.build === 'hulking') this.group.scale.set(1.35, 1.15, 1.35);
    else if (def.build === 'small') this.group.scale.setScalar(0.93);
    const lab = makeLabel(def.name, def.marks ? '#ffd98a' : '#ffffff', 3.6);
    lab.position.y = 2.5;
    this.group.add(lab);
  }

  update(t: number, target: THREE.Vector3, dt = 0.016): void {
    this.moving = false;
    if (this.aura) { this.aura.rotation.y += dt * 0.9; this.aura.position.y = Math.sin(t * 2) * 0.05; }
    const dx = target.x - this.pos.x, dz = target.z - this.pos.z;
    const near = Math.hypot(dx, dz) < 3.5;
    if (this.def.wander && !near) {
      this.wait -= dt;
      const gx = this.goal.x - this.pos.x, gz = this.goal.z - this.pos.z;
      if (Math.hypot(gx, gz) < 0.5) {
        if (this.wait <= 0) {
          const a = Math.random() * Math.PI * 2, r = Math.random() * this.def.wander;
          this.goal.set(this.home.x + Math.cos(a) * r, 0, this.home.z + Math.sin(a) * r);
          this.wait = 2 + Math.random() * 4;
        }
      } else {
        const l = Math.hypot(gx, gz);
        this.pos.x += (gx / l) * 1.2 * dt; this.pos.z += (gz / l) * 1.2 * dt;
        resolve(this.pos, 0.5);
        this.pos.y = heightAt(this.pos.x, this.pos.z);
        this.group.rotation.y = Math.atan2(-gx, -gz);
        this.group.position.x = this.pos.x; this.group.position.z = this.pos.z;
        this.group.position.y = this.pos.y;
        this.moving = true;
        this.animate(dt);
        return;
      }
    }
    if (Math.hypot(dx, dz) < 14) this.group.rotation.y = Math.atan2(-dx, -dz);
    this.group.position.y = this.pos.y + Math.sin(t * 1.5 + this.phase) * 0.02;
    this.animate(dt);
  }
}
