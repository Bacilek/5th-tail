import * as THREE from 'three';
import { heightAt } from '../world/terrain';
import { resolve } from '../world/collision';
import { Humanoid } from './humanoid';

export type EnemyKind = 'venin' | 'soldier' | 'archer' | 'brute' | 'wolf' | 'boss';

interface KindDef {
  hp: number; speed: number; dmg: number; windup: number; reach: number; sight: number; scale: number;
  color: number; ranged?: [number, number]; staggerMul: number; label: string;
  /** chance that a melee attack is unblockable (red telegraph: dodge it, blocking will not help) */
  unblock: number;
}

export const KINDS: Record<EnemyKind, KindDef> = {
  venin: { hp: 60, speed: 3.6, dmg: 10, windup: 0.55, reach: 1.9, sight: 24, scale: 1, color: 0x1b1020, staggerMul: 1, label: 'Venin', unblock: 0.25 },
  soldier: { hp: 85, speed: 3.2, dmg: 13, windup: 0.6, reach: 2.0, sight: 24, scale: 1.05, color: 0x4a3a2a, staggerMul: 0.8, label: 'Rebel soldier', unblock: 0.2 },
  archer: { hp: 45, speed: 3.0, dmg: 9, windup: 0.7, reach: 1.8, sight: 34, scale: 1, color: 0x2a3a2a, ranged: [9, 16], staggerMul: 1.2, label: 'Archer', unblock: 0 },
  brute: { hp: 170, speed: 2.5, dmg: 22, windup: 0.9, reach: 2.5, sight: 20, scale: 1.5, color: 0x3a1a1a, staggerMul: 0.45, label: 'Brute', unblock: 0.45 },
  wolf: { hp: 35, speed: 6.5, dmg: 8, windup: 0.3, reach: 1.5, sight: 28, scale: 1, color: 0x55524e, staggerMul: 1.3, label: 'Wolf', unblock: 0.2 },
  boss: { hp: 420, speed: 3.2, dmg: 26, windup: 0.8, reach: 2.8, sight: 40, scale: 1.7, color: 0x120816, staggerMul: 0.25, label: 'Venin Commander', unblock: 0.3 },
};

/** Hostile creatures: Venin, rebels, archers, brutes, wolves and a boss. Telegraphed attacks, stagger, group alerts. */
export class Enemy {
  group = new THREE.Group();
  readonly kind: EnemyKind;
  readonly def: KindDef;
  hp: number;
  readonly maxHp: number;
  alive = true;
  readonly radius: number;
  alerted = false;
  justAlerted = false;
  /** archers: called when the arrow leaves the bow */
  onShoot: (origin: THREE.Vector3, dir: THREE.Vector3) => void = () => {};
  /** boss: called when entering the enraged phase */
  onPhase: () => void = () => {};
  private phase = 1;
  private atkCd = 0.5 + Math.random();
  private deathT = 0;
  private flash = 0;
  private mats: THREE.MeshStandardMaterial[] = [];
  private home: THREE.Vector3;
  private flankAngle = (Math.random() - 0.5) * 2.0;
  private staggerT = 0;
  private windup = 0;
  private windupTotal = 0.5;
  private prevWindup = 0;
  private strikeT = 0;
  private human: Humanoid | null = null;
  private windupUnblock = false;
  /** true if the attack that produced the last returned damage cannot be blocked */
  lastUnblockable = false;
  /** an unblockable attack is being telegraphed (slam or red windup) */
  get telegraphUnblockable(): boolean { return (this.windup > 0 && this.windupUnblock) || this.slamT > 0; }
  private slamCd = 5;
  private slamT = 0;
  private slamRing: THREE.Mesh | null = null;
  private knock = new THREE.Vector3();
  private barBg: THREE.Sprite;
  private barFg: THREE.Sprite;

  constructor(x: number, z: number, kind: EnemyKind = 'venin') {
    this.kind = kind;
    this.def = KINDS[kind];
    this.hp = this.maxHp = this.def.hp;
    this.radius = 0.6 * Math.max(1, this.def.scale * 0.8);
    this.group.position.set(x, heightAt(x, z), z);
    this.home = this.group.position.clone();
    if (kind === 'wolf') this.buildWolf(); else this.buildHumanoid();
    this.group.scale.setScalar(kind === 'wolf' ? 1 : this.def.scale);
    this.group.traverse((o) => { o.castShadow = true; });
    // health bar (shown once damaged)
    const mk = (color: number, w: number) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ color, depthTest: false, transparent: true }));
      s.scale.set(w, 0.12, 1); s.renderOrder = 10; s.visible = false;
      return s;
    };
    this.barBg = mk(0x220000, 1.2); this.barFg = mk(0xd02a2a, 1.2);
    this.barBg.position.y = this.barFg.position.y = (kind === 'wolf' ? 1.1 : 2.7) / (kind === 'wolf' ? 1 : this.def.scale);
    this.group.add(this.barBg, this.barFg);
  }

  private buildHumanoid(): void {
    const robe = this.mat(this.def.color), skin = this.mat(0x9a8a90), glow = new THREE.MeshBasicMaterial({ color: this.kind === 'venin' || this.kind === 'boss' ? 0xff2020 : 0xffc060 });
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
    if (this.kind === 'archer') {
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 4, 10, Math.PI), this.mat(0x5a3a28));
      bow.position.set(-0.6, 1.3, -0.5); bow.rotation.set(0, 0, Math.PI / 2);
      this.group.add(bow);
    } else {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, this.kind === 'brute' ? 1.5 : 1.1), this.mat(this.kind === 'boss' ? 0xaa3344 : 0x777788));
      blade.position.set(0.6, 1.0, -0.7);
      this.group.add(blade);
    }
    if (this.kind === 'soldier') {
      const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 8), this.mat(0x6a5a3a));
      shield.rotation.x = Math.PI / 2; shield.position.set(-0.7, 1.2, -0.3);
      this.group.add(shield);
    }
  }

  private buildWolf(): void {
    const fur = this.mat(this.def.color);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1.2), fur);
    body.position.y = 0.7;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), fur);
    head.position.set(0, 0.85, -0.8);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.3), this.mat(0x33302e));
    snout.position.set(0, 0.78, -1.1);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.6), fur);
    tail.position.set(0, 0.8, 0.8); tail.rotation.x = 0.5;
    this.group.add(body, head, snout, tail);
    for (const sx of [-1, 1]) for (const sz of [-0.4, 0.45]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), fur);
      leg.position.set(sx * 0.2, 0.25, sz);
      this.group.add(leg);
    }
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 3), new THREE.MeshBasicMaterial({ color: 0xffd040 }));
      eye.position.set(sx * 0.13, 0.92, -1.02);
      this.group.add(eye);
    }
  }

  private mat(color: number): THREE.MeshStandardMaterial {
    const m = new THREE.MeshStandardMaterial({ color, flatShading: true, emissive: 0x000000 });
    this.mats.push(m);
    return m;
  }

  get center(): THREE.Vector3 {
    const h = this.kind === 'wolf' ? 0.7 : 1.1 * this.def.scale;
    return new THREE.Vector3(this.group.position.x, this.group.position.y + h, this.group.position.z);
  }

  /** Becomes aggressive (and tells neighbours via justAlerted). */
  alert(): void {
    if (!this.alerted) { this.alerted = true; this.justAlerted = true; }
  }

  damage(n: number): void {
    if (!this.alive) return;
    this.hp -= n;
    this.flash = 0.12;
    this.alert();
    this.barBg.visible = this.barFg.visible = true;
    const k = Math.max(0, this.hp / this.maxHp);
    this.barFg.scale.x = 1.2 * k; this.barFg.position.x = -0.6 * (1 - k);
    if (this.kind === 'boss' && this.phase === 1 && this.hp < this.maxHp * 0.5) { this.phase = 2; this.onPhase(); }
    if (this.hp <= 0) {
      this.alive = false; this.deathT = 0;
      this.barBg.visible = this.barFg.visible = false;
      if (this.slamRing) { this.group.remove(this.slamRing); this.slamRing = null; }
    }
  }

  private startWindup(base: number): void {
    this.windupUnblock = Math.random() < this.def.unblock;
    this.windup = base + (this.windupUnblock ? 0.18 : 0);
    this.windupTotal = this.windup;
  }

  get telegraphing(): boolean { return this.windup > 0 || this.slamT > 0; }

  /** Interrupts the enemy: flinch for `dur` seconds (scaled by the enemy's stagger resistance) and shove it (kx, kz m/s). */
  stagger(dur: number, kx = 0, kz = 0): void {
    this.staggerT = Math.max(this.staggerT, dur * this.def.staggerMul);
    this.windup = 0;
    if (this.slamT > 0 && this.def.staggerMul > 0.5) this.cancelSlam();
    const m = this.def.staggerMul;
    this.knock.x += kx * m; this.knock.z += kz * m;
  }

  private cancelSlam(): void {
    this.slamT = 0;
    if (this.slamRing) { this.group.remove(this.slamRing); this.slamRing = null; }
  }

  /** Swaps the box body for the rigged humanoid (not for wolves). */
  upgrade(): void {
    if (!Humanoid.ready || this.human || this.kind === 'wolf') return;
    const h = new Humanoid({ female: false, skin: 0x8a7a80, hair: 0x1a1214, hairStyle: this.kind === 'boss' ? 'long' : this.kind === 'brute' ? 'bald' : 'buzzed' });
    const top = this.def.color, tint = (c: number, f: number) => ((((c >> 16) & 255) * f) << 16) | ((((c >> 8) & 255) * f) << 8) | (((c & 255) * f) | 0);
    h.dress(tint(top, 1.5) | 0, tint(top, 1.0) | 0, 0x1a1412);
    for (const c of this.group.children) if (!(c instanceof THREE.Sprite)) c.visible = false;
    this.group.scale.setScalar(this.def.scale * 0.95);
    this.group.add(h.root);
    this.human = h;
  }

  update(dt: number, target: THREE.Vector3, targetAlive: boolean): number {
    const x0 = this.group.position.x, z0 = this.group.position.z;
    const dmg = this.step(dt, target, targetAlive);
    if (this.human) {
      if (this.prevWindup > 0 && this.windup <= 0 && this.alive) this.strikeT = 0.25;
      this.prevWindup = this.windup;
      this.strikeT = Math.max(0, this.strikeT - dt);
      const swing = this.windup > 0 ? (1 - this.windup / Math.max(0.1, this.windupTotal)) * 0.38 : this.strikeT > 0 ? 0.38 + (1 - this.strikeT / 0.25) * 0.5 : 0;
      const speed = dt > 0 ? Math.hypot(this.group.position.x - x0, this.group.position.z - z0) / dt : 0;
      this.human.pose({ speed: this.alive ? Math.min(speed, 6) : 0, swing, power: this.kind === 'brute' || this.kind === 'boss', blocking: false, ride: false }, dt);
    }
    return dmg;
  }

  /** Returns damage dealt to the player this frame (0 if none). */
  private step(dt: number, target: THREE.Vector3, targetAlive: boolean): number {
    if (!this.alive) {
      this.deathT += dt;
      this.group.rotation.x = Math.min(Math.PI / 2, this.deathT * 4);
      return 0;
    }
    this.flash = Math.max(0, this.flash - dt);
    const tele = this.windup > 0 || this.slamT > 0;
    const hot = this.telegraphUnblockable ? 0xff1a00 : 0x9a5a00;
    for (const m of this.mats) m.emissive.setHex(this.flash > 0 ? 0xaa2200 : tele ? hot : 0x000000);

    const p = this.group.position;
    if (this.knock.lengthSq() > 0.01) {
      p.x += this.knock.x * dt; p.z += this.knock.z * dt;
      resolve(p, this.radius);
      p.y = heightAt(p.x, p.z);
      this.knock.multiplyScalar(Math.exp(-6 * dt));
    }
    if (this.staggerT > 0) {
      this.staggerT -= dt;
      this.group.rotation.x = Math.sin(this.staggerT * 30) * 0.12;
      return 0;
    }
    this.group.rotation.x = 0;

    const dx = target.x - p.x, dz = target.z - p.z;
    const dist = Math.hypot(dx, dz);
    const sameLevel = Math.abs(target.y - p.y) < 6;
    // notice / lose interest
    if (targetAlive && sameLevel && dist < this.def.sight) this.alert();
    else if (this.alerted && (dist > this.def.sight * 2.4 || !targetAlive)) this.alerted = false;

    let dmg = 0;
    this.atkCd -= dt;
    const enraged = this.phase === 2;
    const speed = this.def.speed * (enraged ? 1.3 : 1);
    const windupT = this.def.windup * (enraged ? 0.75 : 1);

    if (this.alerted && targetAlive && sameLevel) {
      this.group.rotation.y = Math.atan2(-dx, -dz);
      const move = (tx: number, tz: number, sp: number) => {
        const mx = tx - p.x, mz = tz - p.z, ml = Math.hypot(mx, mz) || 1;
        p.x += (mx / ml) * sp * dt; p.z += (mz / ml) * sp * dt;
        resolve(p, this.radius);
        p.y = heightAt(p.x, p.z);
      };

      // boss ground slam: telegraphed ring around the boss
      if (this.kind === 'boss') {
        this.slamCd -= dt;
        if (this.slamT > 0) {
          this.slamT -= dt;
          if (this.slamRing) { const k = 1 - this.slamT / 1.2; (this.slamRing.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.5 * k; }
          if (this.slamT <= 0) {
            this.cancelSlam();
            this.slamCd = enraged ? 4.5 : 6.5;
            if (dist < 6) { dmg = 24; this.lastUnblockable = true; }
          }
          return dmg;
        }
        if (this.slamCd <= 0 && dist < 9) {
          this.slamT = 1.2; this.windup = 0;
          this.slamRing = new THREE.Mesh(new THREE.CircleGeometry(6 / this.def.scale, 28), new THREE.MeshBasicMaterial({ color: 0xff3a20, transparent: true, opacity: 0.25, depthWrite: false }));
          this.slamRing.rotation.x = -Math.PI / 2; this.slamRing.position.y = 0.06;
          this.group.add(this.slamRing);
          return 0;
        }
      }

      if (this.windup > 0) {
        this.windup -= dt;
        if (this.windup <= 0) {
          this.atkCd = 1.2 + Math.random() * 0.5;
          if (this.def.ranged) {
            const origin = this.center;
            const dir = new THREE.Vector3(target.x - origin.x, target.y + 1.2 - origin.y, target.z - origin.z).normalize();
            this.onShoot(origin, dir);
          } else if (dist < this.def.reach + 0.8) { dmg = this.def.dmg; this.lastUnblockable = this.windupUnblock; }
        }
      } else if (this.def.ranged) {
        const [near, far] = this.def.ranged;
        if (dist < near) move(p.x - dx, p.z - dz, speed);                  // back away
        else if (dist > far) move(target.x, target.z, speed);              // close in
        else if (this.atkCd <= 0) { this.windupUnblock = false; this.windup = windupT; this.windupTotal = windupT; }  // draw and loose
      } else {
        // melee: approach a flanking point so groups surround the player
        const ang = Math.atan2(p.z - target.z, p.x - target.x) + this.flankAngle * Math.min(1, dist / 12);
        const r = Math.max(this.def.reach * 0.8, 0.5);
        const fx = target.x + Math.cos(ang) * r, fz = target.z + Math.sin(ang) * r;
        if (dist > this.def.reach) move(dist > 6 ? fx : target.x, dist > 6 ? fz : target.z, speed);
        else if (this.atkCd <= 0) this.startWindup(windupT);
      }
    } else if (Math.hypot(this.home.x - p.x, this.home.z - p.z) > 1) {
      const hx = this.home.x - p.x, hz = this.home.z - p.z, hd = Math.hypot(hx, hz);
      p.x += (hx / hd) * 2 * dt; p.z += (hz / hd) * 2 * dt;
      p.y = heightAt(p.x, p.z);
      this.windup = 0;
    }
    return dmg;
  }

  get removable(): boolean { return !this.alive && this.deathT > 3; }
}
