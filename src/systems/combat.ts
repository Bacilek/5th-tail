import * as THREE from 'three';
import { settings, DIFFICULTY } from '../engine/settings';
import type { Enemy } from '../entities/enemy';
import { heightAt } from '../world/terrain';
import { solidAt } from '../world/collision';

interface Fireball { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; dmg: number; }
interface Arrow { mesh: THREE.Object3D; vel: THREE.Vector3; life: number; dmg: number; hostile: boolean; stuck: number; }
interface Effect { mesh: THREE.Object3D; life: number; max: number; grow: number; }

export interface HitOpts { stagger?: number; knock?: number; }

/** Staggers the nearest enemy to a point (used by perfect blocks). */
export function nearestAlive(enemies: Enemy[], at: THREE.Vector3): Enemy | null {
  let best: Enemy | null = null, bd = 6;
  for (const e of enemies) { if (!e.alive) continue; const d = e.group.position.distanceTo(at); if (d < bd) { bd = d; best = e; } }
  return best;
}

export class Combat {
  enemies: Enemy[] = [];
  private fireballs: Fireball[] = [];
  private effects: Effect[] = [];
  private arrows: Arrow[] = [];
  private arrowGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.9, 4);
  private arrowMat = new THREE.MeshBasicMaterial({ color: 0xcdb98a });
  private hostileMat = new THREE.MeshBasicMaterial({ color: 0xff8a50 });
  /** set by main: where the player is (for hostile projectiles) and what happens when one hits */
  getPlayerPos: () => THREE.Vector3 = () => new THREE.Vector3(0, -999, 0);
  onPlayerHit: (dmg: number, from: THREE.Vector3) => void = () => {};
  private fbGeo = new THREE.SphereGeometry(0.35, 8, 6);
  private fbMat = new THREE.MeshBasicMaterial({ color: 0xff7a1a });
  onKill: (e: Enemy) => void = () => {};
  /** Called whenever the player's attack damages an enemy (for hit-stop, shake, sounds). */
  onHit: (e: Enemy, power: boolean) => void = () => {};

  constructor(private scene: THREE.Scene) {}

  private hurt(e: Enemy, dmg: number, opts?: HitOpts, origin?: THREE.Vector3): void {
    const was = e.alive;
    e.damage(dmg * DIFFICULTY[settings.difficulty].dealt);
    if (opts && e.alive) {
      const dx = e.group.position.x - (origin?.x ?? e.group.position.x), dz = e.group.position.z - (origin?.z ?? e.group.position.z);
      const l = Math.hypot(dx, dz) || 1;
      e.stagger(opts.stagger ?? 0.2, (dx / l) * (opts.knock ?? 0), (dz / l) * (opts.knock ?? 0));
    }
    if (was) this.onHit(e, !!opts && (opts.stagger ?? 0) > 0.5);
    if (was && !e.alive) this.onKill(e);
  }

  melee(origin: THREE.Vector3, forward: THREE.Vector3, range: number, dmg: number, minDot = 0.35, opts?: HitOpts): void {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const to = e.center.sub(origin);
      const d = to.length();
      if (d > range + e.radius) continue;
      if (to.normalize().dot(forward) < minDot) continue;
      this.hurt(e, dmg, opts, origin);
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

  /** Player arrow/bolt/knife. Headshots (above 1.7 m) do double damage. */
  arrow(origin: THREE.Vector3, dir: THREE.Vector3, speed: number, dmg: number, hostile = false): void {
    const mesh = new THREE.Mesh(this.arrowGeo, hostile ? this.hostileMat : this.arrowMat);
    mesh.position.copy(origin);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    this.scene.add(mesh);
    this.arrows.push({ mesh, vel: dir.clone().normalize().multiplyScalar(speed), life: 4, dmg, hostile, stuck: 0 });
  }

  /** Crescent flash for melee swings (power attacks are vertical chops). */
  slashFx(origin: THREE.Vector3, forward: THREE.Vector3, power: boolean): void {
    const geo = new THREE.RingGeometry(0.7, 0.95, 14, 1, -1.0, 2.0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: power ? 0xffd9a0 : 0xe8f0ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
    m.position.copy(origin).addScaledVector(forward, 1.3);
    m.lookAt(origin);
    m.rotateZ(power ? Math.PI / 2 : (Math.random() - 0.5) * 0.8);
    this.scene.add(m);
    this.effects.push({ mesh: m, life: 0.16, max: 0.16, grow: 2.2 });
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

  private updateArrows(dt: number): void {
    const pp = this.getPlayerPos();
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      if (a.stuck > 0) {
        a.stuck -= dt;
        if (a.stuck <= 0) { this.scene.remove(a.mesh); this.arrows.splice(i, 1); }
        continue;
      }
      a.vel.y -= 12 * dt;
      a.mesh.position.addScaledVector(a.vel, dt);
      a.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.vel.clone().normalize());
      a.life -= dt;
      const p = a.mesh.position;
      let hit = false;
      if (a.hostile) {
        if (p.distanceTo(new THREE.Vector3(pp.x, pp.y + 1.1, pp.z)) < 0.9) { this.onPlayerHit(a.dmg, p.clone().addScaledVector(a.vel, -0.1)); hit = true; }
      } else {
        for (const e of this.enemies) {
          if (!e.alive) continue;
          if (e.center.distanceTo(p) < 0.9 * Math.max(1, e.def.scale * 0.8)) {
            const head = p.y > e.group.position.y + 1.7 * e.def.scale;
            this.hurt(e, a.dmg * (head ? 2 : 1), { stagger: 0.15, knock: 1 }, p.clone().addScaledVector(a.vel, -0.1));
            hit = true; break;
          }
        }
      }
      if (hit) { this.scene.remove(a.mesh); this.arrows.splice(i, 1); continue; }
      if (a.life <= 0) { this.scene.remove(a.mesh); this.arrows.splice(i, 1); continue; }
      if (p.y < heightAt(p.x, p.z) + 0.05 || solidAt(p.x, p.y, p.z)) a.stuck = 6;
    }
  }

  update(dt: number): void {
    this.updateArrows(dt);
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
