import * as THREE from 'three';
import type { NpcDef } from '../data/npcs';
import { heightAt } from '../world/terrain';
import { makeLabel } from '../world/college';
import { resolve } from '../world/collision';

export class Npc {
  readonly group = new THREE.Group();
  readonly pos: THREE.Vector3;
  private phase = Math.random() * 6;
  private goal = new THREE.Vector3();
  private wait = 0;
  private home: THREE.Vector3;

  constructor(public def: NpcDef) {
    this.pos = new THREE.Vector3(def.x, heightAt(def.x, def.z), def.z);
    this.group.position.copy(this.pos);
    this.home = this.pos.clone();
    this.goal.copy(this.pos);
    const cloth = new THREE.MeshStandardMaterial({ color: def.cloth, flatShading: true });
    const skin = new THREE.MeshStandardMaterial({ color: 0xd9b69a, flatShading: true });
    const hair = new THREE.MeshStandardMaterial({ color: def.hair, flatShading: true });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.32), cloth);
    torso.position.y = 1.15;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), skin);
    head.position.y = 1.72;
    const hr = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
    hr.position.y = 1.74;
    this.group.add(torso, head, hr);
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.8, 0.26), cloth);
      leg.position.set(s * 0.15, 0.4, 0);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.16), cloth);
      arm.position.set(s * 0.4, 1.2, 0);
      this.group.add(leg, arm);
    }
    this.group.traverse((o) => { o.castShadow = true; });
    const lab = makeLabel(def.name, '#ffffff', 5);
    lab.position.y = 2.5;
    this.group.add(lab);
  }

  update(t: number, target: THREE.Vector3, dt = 0.016): void {
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
        this.group.position.y = this.pos.y + Math.abs(Math.sin(t * 6 + this.phase)) * 0.06;
        return;
      }
    }
    if (Math.hypot(dx, dz) < 14) this.group.rotation.y = Math.atan2(-dx, -dz);
    this.group.position.y = this.pos.y + Math.sin(t * 1.5 + this.phase) * 0.02;
  }
}
