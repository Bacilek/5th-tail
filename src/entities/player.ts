import * as THREE from 'three';
import type { Input } from '../engine/input';
import { ITEMS, type ItemId } from '../data/items';
import { CLASSES, type ClassId } from '../data/classes';
import { heightAt, MAP_HALF } from '../world/terrain';
import { resolve } from '../world/collision';
import type { Combat } from '../systems/combat';

const EYE = 1.7;
const GRAVITY = 24;
export const SPAWN = new THREE.Vector3(0, 0, 24);

type Hand = 0 | 1; // 0 = left, 1 = right

function buildHeld(id: ItemId, scale: number): THREE.Object3D {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xc8ccd4, flatShading: true, metalness: 0.7, roughness: 0.35 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x3a2a1e, flatShading: true });
  if (id === 'sword' || id === 'dagger') {
    const len = id === 'sword' ? 0.95 : 0.45;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, len, 0.015), metal);
    blade.position.y = len / 2 + 0.12;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.05), grip);
    guard.position.y = 0.1;
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 5), grip);
    g.add(blade, guard, handle);
  } else if (id === 'fireball' || id === 'lightning') {
    const color = id === 'fireball' ? 0xff7a1a : 0xaee0ff;
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), new THREE.MeshBasicMaterial({ color }));
    orb.position.y = 0.1;
    g.add(orb);
  }
  g.scale.setScalar(scale);
  g.traverse((o) => { o.castShadow = false; });
  return g;
}

export class Player {
  pos = SPAWN.clone();
  spawn = SPAWN.clone();
  spawnYaw = 0;
  classId: ClassId = 'infantry';
  cycle: ItemId[] = CLASSES.infantry.items;
  /** lateral wind (m/s along z), set by the world while on the Parapet */
  windZ = 0;
  private airPeak = 0;
  private wasGrounded = true;
  vel = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  grounded = false;
  thirdPerson = false;
  alive = true;

  maxHealth = 100; health = 100;
  maxMagicka = 100; magicka = 100;
  maxStamina = 100; stamina = 100;
  private staminaDelay = 0;
  private magickaDelay = 0;

  hands: [ItemId, ItemId] = ['fireball', 'sword'];
  private cooldown: [number, number] = [0, 0];
  private swing: [number, number] = [0, 0]; // 0..1 animation progress, 0 = idle
  private swingHit: [boolean, boolean] = [false, false];
  private deadTimer = 0;

  readonly avatar = new THREE.Group();
  private fpMount: [THREE.Group, THREE.Group] = [new THREE.Group(), new THREE.Group()];
  private tpMount: [THREE.Group, THREE.Group] = [new THREE.Group(), new THREE.Group()];

  onHandsChanged: () => void = () => {};
  onDeath: () => void = () => {};
  onRespawn: () => void = () => {};
  onDamaged: () => void = () => {};

  constructor(private camera: THREE.PerspectiveCamera, private combat: Combat, scene: THREE.Scene) {
    this.pos.y = heightAt(this.pos.x, this.pos.z);
    this.airPeak = this.pos.y;
    this.buildAvatar();
    scene.add(this.avatar);
    camera.rotation.order = 'YXZ';
    scene.add(camera);
    this.fpMount[0].position.set(-0.32, -0.3, -0.55);
    this.fpMount[1].position.set(0.32, -0.3, -0.55);
    camera.add(this.fpMount[0], this.fpMount[1]);
    this.refreshHeld();
  }

  private buildAvatar(): void {
    const cloth = new THREE.MeshStandardMaterial({ color: 0x1d2030, flatShading: true });
    const leather = new THREE.MeshStandardMaterial({ color: 0x5a3a28, flatShading: true });
    const skin = new THREE.MeshStandardMaterial({ color: 0xd9b69a, flatShading: true });
    const hair = new THREE.MeshStandardMaterial({ color: 0x3a2418, flatShading: true });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.32), cloth);
    torso.position.y = 1.15;
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.34), leather);
    belt.position.y = 0.8;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), skin);
    head.position.y = 1.72;
    const hr = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
    hr.position.y = 1.74;
    this.avatar.add(torso, belt, head, hr);
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.8, 0.26), cloth);
      leg.position.set(s * 0.15, 0.4, 0);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.16), cloth);
      arm.position.set(s * 0.4, 1.2, 0);
      this.avatar.add(leg, arm);
    }
    this.avatar.traverse((o) => { o.castShadow = true; });
    this.tpMount[0].position.set(-0.42, 0.95, -0.3);
    this.tpMount[1].position.set(0.42, 0.95, -0.3);
    this.avatar.add(this.tpMount[0], this.tpMount[1]);
  }

  private refreshHeld(): void {
    for (const h of [0, 1] as Hand[]) {
      for (const mount of [this.fpMount[h], this.tpMount[h]]) {
        mount.clear();
        mount.add(buildHeld(this.hands[h], mount === this.fpMount[h] ? 1 : 1.3));
      }
    }
    this.onHandsChanged();
  }

  setClass(id: ClassId): void {
    const c = CLASSES[id];
    this.classId = id; this.cycle = c.items;
    this.maxHealth = this.health = c.maxHealth;
    this.maxMagicka = this.magicka = c.maxMagicka;
    this.maxStamina = this.stamina = c.maxStamina;
    this.hands = [c.hands[0], c.hands[1]];
    this.refreshHeld();
  }

  setSpawn(x: number, y: number, z: number, yaw: number): void {
    this.spawn.set(x, y, z); this.spawnYaw = yaw;
  }

  teleportToSpawn(): void {
    this.pos.copy(this.spawn);
    this.vel.set(0, 0, 0); this.yaw = this.spawnYaw; this.pitch = 0;
    this.airPeak = this.pos.y; this.grounded = true; this.wasGrounded = true;
  }

  /** Regeneration while riding (normal update is skipped). */
  tickRegen(dt: number): void {
    this.staminaDelay -= dt; this.magickaDelay -= dt;
    if (this.staminaDelay <= 0) this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);
    if (this.magickaDelay <= 0) this.magicka = Math.min(this.maxMagicka, this.magicka + 7 * dt);
  }

  useStaminaRaw(n: number): boolean { return this.useStamina(n); }
  delayMagickaRegen(): void { this.magickaDelay = 1.5; }

  /** Hide first-person hands (while riding a dragon). */
  hideHands(b: boolean): void {
    this.fpMount[0].visible = this.fpMount[1].visible = !b && !this.thirdPerson;
    this.avatar.visible = b || this.thirdPerson;
  }

  get eye(): THREE.Vector3 { return new THREE.Vector3(this.pos.x, this.pos.y + EYE, this.pos.z); }

  get forward(): THREE.Vector3 {
    const cp = Math.cos(this.pitch);
    return new THREE.Vector3(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
  }

  damage(n: number): void {
    if (!this.alive) return;
    this.health -= n;
    this.onDamaged();
    if (this.health <= 0) { this.health = 0; this.alive = false; this.deadTimer = 3; this.onDeath(); }
  }

  respawn(): void {
    this.teleportToSpawn();
    this.health = this.maxHealth; this.magicka = this.maxMagicka; this.stamina = this.maxStamina;
    this.alive = true;
    this.onRespawn();
  }

  private useStamina(n: number): boolean {
    if (this.stamina < n * 0.5) return false;
    this.stamina = Math.max(0, this.stamina - n);
    this.staminaDelay = 1.0;
    return true;
  }

  private attack(h: Hand): void {
    const item = ITEMS[this.hands[h]];
    if (item.kind === 'none' || this.cooldown[h] > 0 || this.swing[h] > 0) return;
    if (item.kind === 'heal') {
      this.health = Math.min(this.maxHealth, this.health + item.damage);
      this.swing[h] = 0.001; this.swingHit[h] = true;
    } else if (item.kind === 'melee') {
      if (!this.useStamina(item.cost)) return;
      this.swing[h] = 0.001; this.swingHit[h] = false;
    } else {
      if (this.magicka < item.cost) return;
      this.magicka -= item.cost; this.magickaDelay = 1.5;
      const origin = this.eye;
      const dir = this.forward;
      if (item.id === 'fireball') this.combat.fireball(origin.clone().addScaledVector(dir, 0.8), dir, item.damage);
      else this.combat.lightning(origin, dir, item.range, item.damage);
      this.swing[h] = 0.001; this.swingHit[h] = true;
    }
    this.cooldown[h] = item.cooldown;
  }

  update(dt: number, input: Input): void {
    if (!this.alive) {
      this.deadTimer -= dt;
      if (this.deadTimer <= 0) this.respawn();
      this.sync(dt);
      return;
    }
    if (input.locked) {
      this.yaw -= input.dx * 0.0022;
      this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch - input.dy * 0.0022));
    }
    if (input.wasPressed('KeyV')) this.thirdPerson = !this.thirdPerson;
    if (input.wasPressed('KeyQ')) { this.hands[0] = this.nextItem(this.hands[0]); this.refreshHeld(); }
    if (input.wasPressed('KeyE')) { this.hands[1] = this.nextItem(this.hands[1]); this.refreshHeld(); }

    // movement
    const f = (input.isDown('KeyW') ? 1 : 0) - (input.isDown('KeyS') ? 1 : 0);
    const r = (input.isDown('KeyD') ? 1 : 0) - (input.isDown('KeyA') ? 1 : 0);
    const moving = f !== 0 || r !== 0;
    const sprint = input.isDown('ShiftLeft') && moving && this.stamina > 1 && this.grounded;
    const speed = sprint ? 9.5 : 5.2;
    const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    let wx = -sy * f + cy * r, wz = -cy * f - sy * r;
    const len = Math.hypot(wx, wz);
    if (len > 0) { wx /= len; wz /= len; }
    const k = this.grounded ? 14 : 3;
    this.vel.x += (wx * speed - this.vel.x) * Math.min(1, k * dt);
    this.vel.z += (wz * speed - this.vel.z) * Math.min(1, k * dt);
    if (sprint) { this.stamina = Math.max(0, this.stamina - 14 * dt); this.staminaDelay = 1.0; }
    if (input.wasPressed('Space') && this.grounded && this.useStamina(8)) { this.vel.y = 8; this.grounded = false; }

    this.pos.z += this.windZ * dt;
    let nx = this.pos.x + this.vel.x * dt, nz = this.pos.z + this.vel.z * dt;
    // cliffs and steep slopes block movement (no walking up walls)
    const climb = (x: number, z: number) => heightAt(x, z) - this.pos.y > 0.9;
    if (climb(nx, nz)) {
      if (!climb(nx, this.pos.z)) nz = this.pos.z;
      else if (!climb(this.pos.x, nz)) nx = this.pos.x;
      else { nx = this.pos.x; nz = this.pos.z; }
    }
    this.pos.x = nx;
    this.pos.z = nz;
    this.pos.x = Math.max(-MAP_HALF + 2, Math.min(MAP_HALF - 2, this.pos.x));
    this.pos.z = Math.max(-MAP_HALF + 2, Math.min(MAP_HALF - 2, this.pos.z));
    resolve(this.pos, 0.45);

    const gh = heightAt(this.pos.x, this.pos.z);
    if (this.vel.y <= 0 && this.pos.y - gh < 0.45) {
      this.pos.y = gh; this.vel.y = 0; this.grounded = true;
    } else {
      this.grounded = false;
      this.vel.y -= GRAVITY * dt;
      this.pos.y += this.vel.y * dt;
      if (this.pos.y < gh) { this.pos.y = gh; this.vel.y = 0; this.grounded = true; }
    }
    if (!this.grounded) this.airPeak = Math.max(this.airPeak, this.pos.y);
    else {
      if (!this.wasGrounded) {
        const drop = this.airPeak - this.pos.y;
        if (drop > 7) this.damage((drop - 7) * 5.5);
      }
      this.airPeak = this.pos.y;
    }
    this.wasGrounded = this.grounded;
    if (this.pos.y < -30) this.damage(this.health + 1);

    // regen
    this.staminaDelay -= dt; this.magickaDelay -= dt;
    if (this.staminaDelay <= 0) this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);
    if (this.magickaDelay <= 0) this.magicka = Math.min(this.maxMagicka, this.magicka + 7 * dt);
    this.health = Math.min(this.maxHealth, this.health + 0.4 * dt);

    // attacks (LMB = left hand, RMB = right hand)
    if (input.locked) {
      if (input.buttonDown(0)) this.attack(0);
      if (input.buttonDown(2)) this.attack(1);
    }
    for (const h of [0, 1] as Hand[]) {
      this.cooldown[h] = Math.max(0, this.cooldown[h] - dt);
      if (this.swing[h] > 0) {
        const dur = Math.max(0.2, ITEMS[this.hands[h]].cooldown * 0.8);
        this.swing[h] += dt / dur;
        if (!this.swingHit[h] && this.swing[h] > 0.4) {
          this.swingHit[h] = true;
          const it = ITEMS[this.hands[h]];
          this.combat.melee(this.eye, this.forward, it.range, it.damage);
        }
        if (this.swing[h] >= 1) this.swing[h] = 0;
      }
    }
    this.sync(dt);
  }

  private nextItem(cur: ItemId): ItemId {
    return this.cycle[(this.cycle.indexOf(cur) + 1) % this.cycle.length];
  }

  sync(_dt: number): void {
    const cam = this.camera;
    this.avatar.visible = this.thirdPerson;
    this.fpMount[0].visible = this.fpMount[1].visible = !this.thirdPerson;
    this.avatar.position.copy(this.pos);
    this.avatar.rotation.y = this.yaw;
    this.avatar.rotation.z = this.alive ? 0 : Math.PI / 2 * 0.9;

    const eye = this.eye;
    if (!this.thirdPerson) {
      cam.position.copy(eye);
      cam.rotation.set(this.pitch, this.yaw, 0);
    } else {
      const cp = Math.cos(this.pitch);
      const back = new THREE.Vector3(Math.sin(this.yaw) * cp, -Math.sin(this.pitch), Math.cos(this.yaw) * cp);
      cam.position.copy(eye).addScaledVector(back, 4.2);
      cam.position.y += 0.4;
      cam.position.y = Math.max(cam.position.y, heightAt(cam.position.x, cam.position.z) + 0.4);
      cam.lookAt(eye.x, eye.y + 0.1, eye.z);
    }
    // hand swing animation (both mounts)
    for (const h of [0, 1] as Hand[]) {
      const t = this.swing[h];
      const isSpell = ITEMS[this.hands[h]].kind === 'spell';
      const a = t > 0 ? Math.sin(t * Math.PI) : 0;
      const base = h === 0 ? -0.32 : 0.32;
      const m = this.fpMount[h];
      m.position.set(base, -0.3 + (isSpell ? 0.05 * a : -0.1 * a), -0.55 - (isSpell ? 0.0 : 0.15 * a));
      m.rotation.set(isSpell ? 0.4 * a : -1.0 * a + 0.25, 0, 0);
      const tm = this.tpMount[h];
      tm.rotation.set(isSpell ? -1.2 * a : -1.6 * a, 0, 0);
    }
  }
}
