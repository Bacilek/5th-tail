import * as THREE from 'three';
import { heightAt } from '../world/terrain';
import { resolve } from '../world/collision';

/** Venin: hostile dark-robed wielder (placeholder enemy for the vertical slice). */
export class Enemy {
  group = new THREE.Group();
  hp = 60;
  alive = true;
  readonly radius = 0.6;
  private atkCd = 0;
  private deathT = 0;
  private flash = 0;
  private mats: THREE.MeshStandardMaterial[] = [];
  private home: THREE.Vector3;

  constructor(x: number, z: number) {
    this.group.position.set(x, heightAt(x, z), z);
    this.home = this.group.position.clone();
    const robe = this.mat(0x1b1020), skin = this.mat(0x9a8a90), glow = new THREE.MeshBasicMaterial({ color: 0xff2020 });
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.7, 6), robe);
    body.position.y = 0.85;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 5), skin);
    head.position.y = 1.9;
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.5, 6), robe);
    hood.position.y = 2.15;
    this.group.add(body, head, hood);
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 3), glow);
      eye.position.set(s * 0.11, 1.93, -0.25);
      this.group.add(eye);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), robe);
      arm.position.set(s * 0.6, 1.3, -0.15); arm.rotation.x = -0.6;
      this.group.add(arm);
    }
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.1), this.mat(0x777788));
    blade.position.set(0.6, 1.0, -0.7);
    this.group.add(blade);
    this.group.traverse((o) => { o.castShadow = true; });
  }

  private mat(color: number): THREE.MeshStandardMaterial {
    const m = new THREE.MeshStandardMaterial({ color, flatShading: true, emissive: 0x000000 });
    this.mats.push(m);
    return m;
  }

  get center(): THREE.Vector3 {
    return new THREE.Vector3(this.group.position.x, this.group.position.y + 1.1, this.group.position.z);
  }

  damage(n: number): void {
    if (!this.alive) return;
    this.hp -= n;
    this.flash = 0.12;
    if (this.hp <= 0) { this.alive = false; this.deathT = 0; }
  }

  private staggerT = 0;
  private windup = 0;
  private knock = new THREE.Vector3();
  /** true while the enemy telegraphs an attack (for sounds/HUD) */
  get telegraphing(): boolean { return this.windup > 0; }

  /** Interrupts the enemy: flinch for `dur` seconds and shove it (kx, kz m/s). */
  stagger(dur: number, kx = 0, kz = 0): void {
    this.staggerT = Math.max(this.staggerT, dur);
    this.windup = 0;
    this.knock.x += kx; this.knock.z += kz;
  }

  /** Returns damage dealt to the player this frame (0 if none). */
  update(dt: number, target: THREE.Vector3, targetAlive: boolean): number {
    if (!this.alive) {
      this.deathT += dt;
      this.group.rotation.x = Math.min(Math.PI / 2, this.deathT * 4);
      return 0;
    }
    this.flash = Math.max(0, this.flash - dt);
    const tele = this.windup > 0;
    for (const m of this.mats) m.emissive.setHex(this.flash > 0 ? 0xaa2200 : tele ? 0x9a5a00 : 0x000000);

    const p = this.group.position;
    // knockback slide (always applies, even while staggered)
    if (this.knock.lengthSq() > 0.01) {
      p.x += this.knock.x * dt; p.z += this.knock.z * dt;
      resolve(p, this.radius);
      p.y = heightAt(p.x, p.z);
      this.knock.multiplyScalar(Math.exp(-6 * dt));
    }
    if (this.staggerT > 0) {
      this.staggerT -= dt;
      this.group.rotation.x = Math.sin(this.staggerT * 30) * 0.12; // flinch
      return 0;
    }
    this.group.rotation.x = 0;

    const dx = target.x - p.x, dz = target.z - p.z;
    const dist = Math.hypot(dx, dz);
    let dmg = 0;
    this.atkCd -= dt;
    if (targetAlive && dist < 45 && Math.abs(target.y - p.y) < 6) {
      this.group.rotation.y = Math.atan2(-dx, -dz);
      if (this.windup > 0) {
        this.windup -= dt;
        if (this.windup <= 0) {
          this.atkCd = 1.4;
          if (dist < 2.7) dmg = 10;
        }
      } else if (dist > 1.9) {
        const sp = 3.6 * dt;
        p.x += (dx / dist) * sp;
        p.z += (dz / dist) * sp;
        resolve(p, this.radius);
        p.y = heightAt(p.x, p.z);
      } else if (this.atkCd <= 0) {
        this.windup = 0.55; // telegraph: the player can block, bash, strike first or step away
      }
    } else if (Math.hypot(this.home.x - p.x, this.home.z - p.z) > 1) {
      const hx = this.home.x - p.x, hz = this.home.z - p.z, hd = Math.hypot(hx, hz);
      p.x += (hx / hd) * 2 * dt; p.z += (hz / hd) * 2 * dt;
      p.y = heightAt(p.x, p.z);
    }
    return dmg;
  }

  get removable(): boolean { return !this.alive && this.deathT > 3; }
}
