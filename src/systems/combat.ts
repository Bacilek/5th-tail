import * as THREE from 'three';
import { settings, DIFFICULTY } from '../engine/settings';
import type { Enemy } from '../entities/enemy';
import { heightAt } from '../world/terrain';

interface Fireball { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; dmg: number; }
interface Effect { mesh: THREE.Object3D; life: number; max: number; grow: number; }

export class Combat {
  enemies: Enemy[] = [];
  private fireballs: Fireball[] = [];
  private effects: Effect[] = [];
  private fbGeo = new THREE.SphereGeometry(0.35, 8, 6);
  private fbMat = new THREE.MeshBasicMaterial({ color: 0xff7a1a });
  onKill: (e: Enemy) => void = () => {};

  constructor(private scene: THREE.Scene) {}

  private hurt(e: Enemy, dmg: number): void {
    const was = e.alive;
    e.damage(dmg * DIFFICULTY[settings.difficulty].dealt);
    if (was && !e.alive) this.onKill(e);
  }

  melee(origin: THREE.Vector3, forward: THREE.Vector3, range: number, dmg: number, minDot = 0.35): void {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const to = e.center.sub(origin);
      const d = to.length();
      if (d > range + e.radius) continue;
      if (to.normalize().dot(forward) < minDot) continue;
      this.hurt(e, dmg);
    }
  }

  /** Area damage with a visual flash (dragon tail strikes). */
  blast(pos: THREE.Vector3, radius: number, dmg: number, color = 0xffd070): void {
    for (const e of this.enemies) {
      if (e.alive && e.center.distanceTo(pos) < radius + e.radius) this.hurt(e, dmg);
    }
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }));
    m.position.copy(pos); m.scale.setScalar(radius * 0.3);
    this.scene.add(m);
    this.effects.push({ mesh: m, life: 0.3, max: 0.3, grow: radius * 2 });
  }

  fireball(origin: THREE.Vector3, dir: THREE.Vector3, dmg: number): void {
    const mesh = new THREE.Mesh(this.fbGeo, this.fbMat);
    mesh.position.copy(origin);
    this.scene.add(mesh);
    this.fireballs.push({ mesh, vel: dir.clone().multiplyScalar(38), life: 3, dmg });
  }

  lightning(origin: THREE.Vector3, dir: THREE.Vector3, range: number, dmg: number): void {
    let best: Enemy | null = null, bestT = range;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const to = e.center.sub(origin);
      const t = to.dot(dir);
      if (t < 0 || t > bestT) continue;
      const closest = origin.clone().addScaledVector(dir, t);
      if (closest.distanceTo(e.center) < 1.1) { best = e; bestT = t; }
    }
    if (best) this.hurt(best, dmg);
    const end = origin.clone().addScaledVector(dir, bestT);
    const start = origin.clone().addScaledVector(dir, 0.8).add(new THREE.Vector3(0, -0.25, 0));
    const pts: THREE.Vector3[] = [];
    const n = 10;
    for (let i = 0; i <= n; i++) {
      const p = start.clone().lerp(end, i / n);
      if (i > 0 && i < n) p.add(new THREE.Vector3((Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7));
      pts.push(p);
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xbfe6ff }));
    this.scene.add(line);
    this.effects.push({ mesh: line, life: 0.12, max: 0.12, grow: 0 });
  }

  private explode(pos: THREE.Vector3, dmg: number): void {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.center.distanceTo(pos) < 3.5) this.hurt(e, dmg);
    }
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.8 }));
    m.position.copy(pos);
    this.scene.add(m);
    this.effects.push({ mesh: m, life: 0.35, max: 0.35, grow: 9 });
  }

  update(dt: number): void {
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const f = this.fireballs[i];
      f.mesh.position.addScaledVector(f.vel, dt);
      f.life -= dt;
      const p = f.mesh.position;
      let hit = f.life <= 0 || p.y < heightAt(p.x, p.z);
      if (!hit) for (const e of this.enemies) if (e.alive && e.center.distanceTo(p) < 1.1) { hit = true; break; }
      if (hit) {
        this.explode(p.clone(), f.dmg);
        this.scene.remove(f.mesh);
        this.fireballs.splice(i, 1);
      }
    }
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.life -= dt;
      if (e.grow) {
        const s = 1 + (e.max - e.life) * e.grow;
        e.mesh.scale.setScalar(s);
        const mat = (e.mesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, e.life / e.max) * 0.8;
      }
      if (e.life <= 0) {
        this.scene.remove(e.mesh);
        this.effects.splice(i, 1);
      }
    }
    this.enemies = this.enemies.filter((e) => {
      if (e.removable) { this.scene.remove(e.group); return false; }
      return true;
    });
  }
}
