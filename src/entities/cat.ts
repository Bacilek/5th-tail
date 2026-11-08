import * as THREE from 'three';
import { heightAt } from '../world/terrain';
import { resolve } from '../world/collision';
import { makeLabel } from '../world/college';

/** Broccoli the cat. Starts as a stray in the lower college; adopt with F, then it follows you. */
export class Cat {
  readonly group = new THREE.Group();
  readonly pos: THREE.Vector3;
  adopted = false;
  private home: THREE.Vector3;
  private tail: THREE.Group = new THREE.Group();
  private wander = new THREE.Vector3();
  private wanderT = 0;
  private yaw = 0;

  constructor(x: number, z: number) {
    this.pos = new THREE.Vector3(x, heightAt(x, z), z);
    this.home = this.pos.clone();
    const fur = new THREE.MeshStandardMaterial({ color: 0xd9822b, flatShading: true });
    const white = new THREE.MeshStandardMaterial({ color: 0xf2e8d8, flatShading: true });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.6), fur);
    body.position.y = 0.3;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.22), fur);
    head.position.set(0, 0.45, -0.38);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.08), white);
    snout.position.set(0, 0.42, -0.5);
    this.group.add(body, head, snout);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 4), fur);
      ear.position.set(s * 0.08, 0.6, -0.38);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.07), fur);
      leg.position.set(s * 0.09, 0.1, -0.2);
      const leg2 = leg.clone(); leg2.position.z = 0.2;
      this.group.add(ear, leg, leg2);
    }
    const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.45), fur);
    tailMesh.position.z = 0.22;
    this.tail.add(tailMesh);
    this.tail.position.set(0, 0.38, 0.3);
    this.group.add(this.tail);
    this.group.traverse((o) => { o.castShadow = true; });
    const lab = makeLabel('Broccoli', '#ffd9a0', 3);
    lab.position.y = 1.1;
    this.group.add(lab);
    this.group.position.copy(this.pos);
  }

  update(dt: number, t: number, player: THREE.Vector3): void {
    const p = this.pos;
    let moving = false;
    if (this.adopted) {
      const dx = player.x - p.x, dz = player.z - p.z, d = Math.hypot(dx, dz);
      if (d > 40) { p.set(player.x + 2, player.y, player.z + 2); }
      else if (d > 3) {
        const sp = Math.min(7, 2 + d) * dt;
        p.x += (dx / d) * sp; p.z += (dz / d) * sp;
        this.yaw = Math.atan2(-dx, -dz); moving = true;
      }
    } else {
      this.wanderT -= dt;
      if (this.wanderT <= 0) {
        this.wanderT = 2 + Math.random() * 4;
        const a = Math.random() * Math.PI * 2, r = Math.random() * 4;
        this.wander.set(this.home.x + Math.cos(a) * r, 0, this.home.z + Math.sin(a) * r);
        if (Math.random() < 0.4) this.wander.copy(p);
      }
      const dx = this.wander.x - p.x, dz = this.wander.z - p.z, d = Math.hypot(dx, dz);
      if (d > 0.3) {
        p.x += (dx / d) * 1.2 * dt; p.z += (dz / d) * 1.2 * dt;
        this.yaw = Math.atan2(-dx, -dz); moving = true;
      }
    }
    resolve(p, 0.25);
    p.y = heightAt(p.x, p.z);
    this.group.position.copy(p);
    if (moving) this.group.position.y += Math.abs(Math.sin(t * 12)) * 0.05;
    this.group.rotation.y = this.yaw;
    this.tail.rotation.y = Math.sin(t * (moving ? 6 : 2)) * 0.5;
  }
}
