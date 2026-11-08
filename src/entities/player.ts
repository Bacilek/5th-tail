import * as THREE from 'three';
import { settings, DIFFICULTY } from '../engine/settings';
import type { Enemy } from './enemy';
import type { Input } from '../engine/input';
import { ITEMS, type ItemId } from '../data/items';
import { CLASSES, type ClassId } from '../data/classes';
import { heightAt, heightAtFor, MAP_HALF } from '../world/terrain';
import type { Look } from '../data/look';
import { Humanoid } from './humanoid';
import { makeLimb, animateWalk, ridePose as ridePoseFn, type Limbs } from './walkcycle';
import { resolve, supportAt } from '../world/collision';
import type { Combat } from '../systems/combat';

const EYE = 1.7;
const GRAVITY = 24;
export const SPAWN = new THREE.Vector3(0, 0, 24);

type Hand = 0 | 1; // 0 = left, 1 = right

function buildHeld(id: ItemId, scale: number): THREE.Object3D {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xdfe3ea, emissive: 0x2c3036, flatShading: true, metalness: 0.25, roughness: 0.4 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x3a2a1e, flatShading: true });
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a28, flatShading: true });
  if (id === 'axe' || id === 'mace') {
    const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 5), wood);
    haft.position.y = 0.35;
    // the axe blade faces forward (-z), not sideways
    const head = id === 'axe' ? new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.34), metal) : new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), metal);
    head.position.set(0, 0.7, id === 'axe' ? -0.14 : 0);
    g.add(haft, head);
  } else if (id === 'greatsword') {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.02), metal);
    blade.position.y = 0.95;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.06), grip);
    guard.position.y = 0.18;
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 5), grip);
    g.add(blade, guard, handle);
  } else if (id === 'spear') {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.0, 5), wood);
    shaft.position.y = 0.7;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 4), metal);
    tip.position.y = 1.85;
    g.add(shaft, tip);
  } else if (id === 'shield') {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 10), new THREE.MeshStandardMaterial({ color: 0x7a2a22, flatShading: true }));
    disc.rotation.x = Math.PI / 2; disc.position.y = 0.2;
    const boss = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), metal);
    boss.position.set(0, 0.2, -0.05);
    g.add(disc, boss);
  } else if (id === 'bow') {
    // limbs run along y, the belly bulges forward (-z); the string is the chord, a nocked arrow appears while drawing
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.02, 4, 12, Math.PI), wood);
    arc.rotation.set(0, Math.PI / 2, -Math.PI / 2); arc.position.set(0, 0.4, 0);
    const string = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.8, 0.008), new THREE.MeshBasicMaterial({ color: 0xe8e0c8 }));
    string.position.set(0, 0.4, 0);
    const nock = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.75), new THREE.MeshBasicMaterial({ color: 0xcdb98a }));
    nock.position.set(0, 0.4, -0.1); nock.visible = false;
    g.userData.nock = nock; g.userData.string = string;
    g.add(arc, string, nock);
  } else if (id === 'crossbow') {
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.5), wood);
    stock.position.set(0, 0.2, -0.1);
    const lath = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.04), metal);
    lath.position.set(0, 0.2, -0.3);
    g.add(stock, lath);
  } else if (id === 'knives') {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.01), metal);
    blade.position.y = 0.2;
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 5), grip);
    handle.position.y = 0.05;
    g.add(blade, handle);
  } else if (id === 'sword' || id === 'dagger') {
    const len = id === 'sword' ? 0.95 : 0.45;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, len, 0.015), metal);
    blade.position.y = len / 2 + 0.12;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.05), grip);
    guard.position.y = 0.1;
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 5), grip);
    g.add(blade, guard, handle);
  } else if (id === 'fireball' || id === 'lightning') {
    const color = id === 'fireball' ? 0xff7a1a : 0xaee0ff;
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 1), new THREE.MeshBasicMaterial({ color }));
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
  private swingPower: [boolean, boolean] = [false, false];
  private holdT: [number, number] = [0, 0];
  blocking = false;
  private blockT = 0;
  /** camera shake amplitude (radians), decays quickly */
  shake = 0;
  onBlock: (kind: 'block' | 'perfect' | 'break', from: THREE.Vector3, source?: Enemy) => void = () => {};
  /** perfect = dodged right as the hit landed */
  onDodge: (perfect: boolean) => void = () => {};
  onDodgeStart: () => void = () => {};
  dodgeT = 0;
  private dodgeAge = 99;
  private dodgeCd = 0;
  private deadTimer = 0;

  readonly avatar = new THREE.Group();
  private limbs: Limbs = { legs: [], arms: [] };
  private walkPhase = 0;
  private walkAmt = 0;
  private lastStepSign = 1;
  onStep: () => void = () => {};
  /** Call every frame while riding (broom/dragon) so the avatar sits instead of walking. */
  ridePose(): void { ridePoseFn(this.limbs); this.walkAmt = 0; this.rideFlag = true; }
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

  private lookMats!: { cloth: THREE.MeshStandardMaterial; skin: THREE.MeshStandardMaterial; hair: THREE.MeshStandardMaterial };
  private hairMeshes: THREE.Mesh[] = [];
  name = 'Cadet';

  private human: Humanoid | null = null;
  private lookCache: Look | null = null;
  private rideFlag = false;

  /** Replaces the box avatar with the rigged humanoid (call once the models are loaded). */
  enableModel(): void {
    if (!Humanoid.ready) return;
    this.buildHuman();
  }

  private buildHuman(): void {
    if (this.human) this.avatar.remove(this.human.root);
    const l = this.lookCache;
    const h = new Humanoid({ female: l?.female, skin: l?.skin ?? 0xd9b69a, hair: l?.hair ?? 0x3a2418, hairStyle: l?.hairStyle ?? 'short', beard: l?.beard });
    h.dress(l?.cloth ?? 0x1d2030);
    this.human = h;
    for (const c of this.avatar.children) if (c !== this.tpMount[0] && c !== this.tpMount[1]) c.visible = false;
    h.root.visible = true;
    this.avatar.add(h.root);
    // weapons follow the hands
    const hl = h.getBone('hand_l'), hr = h.getBone('hand_r');
    if (hl && hr) { hl.add(this.tpMount[0]); hr.add(this.tpMount[1]); this.tpMount[0].position.set(0, 0, 0); this.tpMount[1].position.set(0, 0, 0); this.tpMount[0].scale.setScalar(1.05); this.tpMount[1].scale.setScalar(1.05); this.tpMount[0].rotation.set(Math.PI + 1.0, 0, 0); this.tpMount[1].rotation.set(Math.PI + 1.0, 0, 0); }
  }

  /** Applies the character-creation look to the third-person avatar. */
  applyLook(look: Look): void {
    this.lookCache = look;
    if (Humanoid.ready) this.buildHuman();
    this.name = look.name;
    this.lookMats.cloth.color.setHex(look.cloth);
    this.lookMats.skin.color.setHex(look.skin);
    this.lookMats.hair.color.setHex(look.hair);
    this.hairMeshes[0].visible = look.hairStyle !== 'bald';
    this.hairMeshes[1].visible = look.hairStyle === 'long';
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
    const longHair = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.6, 0.14), hair);
    longHair.position.set(0, 1.5, 0.17); longHair.visible = false;
    this.hairMeshes = [hr, longHair];
    this.lookMats = { cloth, skin, hair };
    this.avatar.add(torso, belt, head, hr, longHair);
    for (const s of [-1, 1]) {
      const leg = makeLimb(0.24, 0.8, 0.26, cloth, s * 0.15, 0.8);
      const arm = makeLimb(0.16, 0.7, 0.16, cloth, s * 0.4, 1.5);
      this.limbs.legs.push(leg); this.limbs.arms.push(arm);
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
        mount.add(buildHeld(this.hands[h], mount === this.fpMount[h] ? 0.5 : 1.3));
      }
    }
    this.onHandsChanged();
  }

  /** Replace both hands (used by save loading). */
  setHands(a: ItemId, b: ItemId): void {
    this.hands = [a, b];
    this.refreshHeld();
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

  damage(n: number, raw = false, from?: THREE.Vector3, source?: Enemy, unblockable = false): void {
    if (!this.alive) return;
    if (!raw && this.dodgeT > 0) { this.onDodge(this.dodgeAge < 0.18); return; } // i-frames
    let dmg = raw ? n : n * DIFFICULTY[settings.difficulty].taken;
    if (!raw && unblockable && this.blocking) {
      // unblockable attacks smash through a guard
      this.blocking = false; this.stamina = Math.max(0, this.stamina - 25); this.onBlock('break', from ?? this.pos, source);
      if (from) { const k = new THREE.Vector3(this.pos.x - from.x, 0, this.pos.z - from.z).normalize(); this.knock.x += k.x * 7; this.knock.z += k.z * 7; }
    } else if (!raw && this.blocking && from) {
      const to = new THREE.Vector3(from.x - this.pos.x, 0, from.z - this.pos.z).normalize();
      const f = this.forward; f.y = 0; f.normalize();
      if (to.dot(f) > 0.1) {
        if (this.blockT < 0.3) { this.onBlock('perfect', from, source); this.shake = 0.01; return; } // perfect block: no damage
        const sh = ITEMS[this.hands[0]].kind === 'shield' || ITEMS[this.hands[1]].kind === 'shield';
        const cost = dmg * (sh ? 0.5 : 0.9);
        if (this.stamina >= cost) { this.stamina -= cost; this.staminaDelay = 1.2; this.onBlock('block', from, source); dmg *= sh ? 0.08 : 0.15; }
        else { this.stamina = 0; this.blocking = false; this.onBlock('break', from, source); }
      }
    }
    this.shake = Math.max(this.shake, Math.min(0.05, dmg * 0.003));
    this.health -= dmg;
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

  /** Extra horizontal velocity from knockback; decays over time and does not fight the movement smoothing. */
  readonly knock = new THREE.Vector3();
  push(vx: number, vy: number, vz: number): void {
    this.knock.x += vx; this.knock.z += vz;
    if (vy > 0) { this.vel.y = Math.max(this.vel.y, vy); this.grounded = false; }
  }

  onAttack: (kind: string) => void = () => {};

  private attack(h: Hand, power = false): void {
    const item = ITEMS[this.hands[h]];
    if (item.kind === 'none' || item.kind === 'shield' || item.kind === 'ranged' || this.cooldown[h] > 0 || this.swing[h] > 0) return;
    if (item.kind === 'heal') {
      this.health = Math.min(this.maxHealth, this.health + item.damage);
      this.onAttack('heal');
      this.swing[h] = 0.001; this.swingHit[h] = true;
    } else if (item.kind === 'melee') {
      if (!this.useStamina(item.cost * (power ? 2.4 : 1))) return;
      this.onAttack(power ? 'power' : 'melee');
      this.swingPower[h] = power;
      this.swing[h] = 0.001; this.swingHit[h] = false;
    } else {
      if (this.magicka < item.cost) return;
      this.magicka -= item.cost; this.magickaDelay = 1.5;
      const origin = this.eye;
      const dir = this.forward;
      this.onAttack(item.id);
      if (item.id === 'fireball') this.combat.fireball(origin.clone().addScaledVector(dir, 0.8), dir, item.damage);
      else this.combat.lightning(origin, dir, item.range, item.damage);
      this.swing[h] = 0.001; this.swingHit[h] = true;
    }
    this.cooldown[h] = item.cooldown * (item.kind === 'melee' && power ? 1.6 : 1);
  }

  /** Releases a bow/crossbow/throwing knife. draw 0..1 */
  private shoot(h: Hand, draw: number): void {
    const item = ITEMS[this.hands[h]];
    if (this.cooldown[h] > 0 || !this.useStamina(item.cost)) return;
    this.cooldown[h] = item.cooldown;
    const dir = this.forward;
    const origin = this.eye.addScaledVector(dir, 0.6);
    const speed = item.id === 'knives' ? 42 : 28 + 52 * draw;
    this.combat.arrow(origin, dir, speed, item.damage * (item.draw ? 0.35 + 0.65 * draw : 1));
    this.onAttack(item.id === 'knives' ? 'melee' : 'bow');
    this.swing[h] = 0.001; this.swingHit[h] = true; this.swingPower[h] = false;
  }

  /** Shield bash / weapon shove while blocking: short-range stagger. */
  private bash(h: Hand): void {
    if (this.cooldown[h] > 0 || !this.useStamina(10)) return;
    this.cooldown[h] = 0.6;
    this.onAttack('bash');
    const shielded = ITEMS[this.hands[h]].kind === 'shield' || ITEMS[this.hands[1 - h as Hand]].kind === 'shield';
    this.combat.melee(this.eye, this.forward, 2.4, shielded ? 9 : 6, 0.3, { stagger: shielded ? 1.4 : 1.0, knock: shielded ? 10 : 8 });
    this.swing[h] = 0.001; this.swingHit[h] = true; this.swingPower[h] = false;
  }

  update(dt: number, input: Input): void {
    if (!this.alive) {
      this.deadTimer -= dt;
      if (this.deadTimer <= 0) this.respawn();
      this.sync(dt);
      return;
    }
    if (input.locked) {
      this.yaw -= input.dx * 0.0022 * settings.sens;
      this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch - input.dy * 0.0022 * settings.sens * (settings.invertY ? -1 : 1)));
    }
    if (input.wasPressed(settings.keys.camera)) this.thirdPerson = !this.thirdPerson;
    if (input.wasPressed('KeyQ')) { this.hands[0] = this.nextItem(this.hands[0]); this.refreshHeld(); }
    if (input.wasPressed('KeyE')) { this.hands[1] = this.nextItem(this.hands[1]); this.refreshHeld(); }

    // dodge (rebindable, default Alt): quick burst with brief invulnerability
    this.dodgeCd -= dt; this.dodgeAge += dt; this.dodgeT = Math.max(0, this.dodgeT - dt);
    if (input.wasPressed(settings.keys.dodge) && this.dodgeCd <= 0 && this.grounded && this.stamina >= 10) {
      const df = (input.isDown('KeyW') ? 1 : 0) - (input.isDown('KeyS') ? 1 : 0), dr = (input.isDown('KeyD') ? 1 : 0) - (input.isDown('KeyA') ? 1 : 0);
      const fy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
      let wx = -fy * df + cy * dr, wz = -cy * df - fy * dr;
      if (df === 0 && dr === 0) { wx = fy; wz = cy; } // no direction: hop backwards
      const l = Math.hypot(wx, wz) || 1;
      this.knock.set((wx / l) * 15, 0, (wz / l) * 15);
      this.stamina = Math.max(0, this.stamina - 16); this.staminaDelay = 1.0;
      this.dodgeT = 0.3; this.dodgeAge = 0; this.dodgeCd = 0.7; this.blocking = false; this.holdT[0] = this.holdT[1] = 0;
      this.onDodgeStart();
    }
    // movement
    const f = (input.isDown('KeyW') ? 1 : 0) - (input.isDown('KeyS') ? 1 : 0);
    const r = (input.isDown('KeyD') ? 1 : 0) - (input.isDown('KeyA') ? 1 : 0);
    const moving = f !== 0 || r !== 0;
    const sprint = input.isDown(settings.keys.sprint) && moving && this.stamina > 1 && this.grounded;
    const speed = sprint ? 9.5 : 5.2;
    const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    let wx = -sy * f + cy * r, wz = -cy * f - sy * r;
    const len = Math.hypot(wx, wz);
    if (len > 0) { wx /= len; wz /= len; }
    const k = this.grounded ? 14 : 3;
    this.vel.x += (wx * speed - this.vel.x) * Math.min(1, k * dt);
    this.vel.z += (wz * speed - this.vel.z) * Math.min(1, k * dt);
    if (sprint) { this.stamina = Math.max(0, this.stamina - 14 * dt); this.staminaDelay = 1.0; }
    if (input.wasPressed(settings.keys.jump) && this.grounded && this.useStamina(8)) { this.vel.y = 8; this.grounded = false; }

    this.pos.z += this.windZ * dt;
    let nx = this.pos.x + (this.vel.x + this.knock.x) * dt, nz = this.pos.z + (this.vel.z + this.knock.z) * dt;
    this.knock.multiplyScalar(Math.exp(-3.2 * dt));
    // cliffs and steep slopes block movement (no walking up walls)
    const climb = (x: number, z: number) => heightAtFor(x, z, this.pos.y) - this.pos.y > 0.9;
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

    const gh = Math.max(heightAtFor(this.pos.x, this.pos.z, this.pos.y), supportAt(this.pos.x, this.pos.z, this.pos.y));
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
    if (this.pos.y < -30) this.damage(this.health + 1, true);

    // regen
    this.staminaDelay -= dt; this.magickaDelay -= dt;
    if (this.staminaDelay <= 0) this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);
    if (this.magickaDelay <= 0) this.magicka = Math.min(this.maxMagicka, this.magicka + 7 * dt);
    this.health = Math.min(this.maxHealth, this.health + 0.4 * dt);

    // attacks (LMB = left hand, RMB = right hand)
    if (input.locked) {
      // block: hold X / middle mouse with a melee weapon or shield, or just hold the attack button of a hand with a shield
      const kinds = [ITEMS[this.hands[0]].kind, ITEMS[this.hands[1]].kind];
      const hasMelee = kinds.includes('melee') || kinds.includes('shield');
      const shieldHeld = (kinds[0] === 'shield' && input.buttonDown(0)) || (kinds[1] === 'shield' && input.buttonDown(2));
      const wantBlock = ((input.isDown(settings.keys.block) || input.buttonDown(1)) && hasMelee || shieldHeld) && this.stamina > 1 && this.swing[0] === 0 && this.swing[1] === 0;
      if (wantBlock && !this.blocking) this.blockT = 0;
      this.blocking = wantBlock;
      if (this.blocking) { this.blockT += dt; this.staminaDelay = Math.max(this.staminaDelay, 0.6); }
      for (const h of [0, 1] as Hand[]) {
        const down = h === 0 ? input.buttonDown(0) : input.buttonDown(2);
        const pressed = h === 0 ? input.buttonPressed(0) : input.buttonPressed(2);
        const item = ITEMS[this.hands[h]];
        if (item.kind === 'melee') {
          if (this.blocking) { if (pressed) this.bash(h); this.holdT[h] = 0; }
          else if (down) this.holdT[h] += dt;
          else if (this.holdT[h] > 0) { const power = this.holdT[h] >= 0.5; this.holdT[h] = 0; this.attack(h, power); }
        } else if (item.kind === 'shield') {
          this.holdT[h] = 0;
          // tap the shield hand while the other hand blocks = bash
          if (pressed && this.blocking && !shieldHeld) this.bash(h);
        } else if (item.kind === 'ranged') {
          if (this.blocking) { this.holdT[h] = 0; continue; }
          if (down) this.holdT[h] += dt;
          else if (this.holdT[h] > 0) {
            const need = item.draw ?? 0, q = need > 0 ? Math.min(1, this.holdT[h] / need) : 1;
            this.holdT[h] = 0;
            if (item.id === 'crossbow' ? q >= 1 : q >= 0.3) this.shoot(h, q);
          }
        } else {
          this.holdT[h] = 0;
          if (down) this.attack(h);
        }
      }
    } else { this.blocking = false; this.holdT[0] = this.holdT[1] = 0; }
    for (const h of [0, 1] as Hand[]) {
      this.cooldown[h] = Math.max(0, this.cooldown[h] - dt);
      if (this.swing[h] > 0) {
        const dur = Math.max(0.2, ITEMS[this.hands[h]].cooldown * 0.8);
        this.swing[h] += dt / dur;
        if (!this.swingHit[h] && this.swing[h] > 0.4) {
          this.swingHit[h] = true;
          const it = ITEMS[this.hands[h]];
          const pw = this.swingPower[h];
          const st = it.stagger ?? 0.28, kn = it.knock ?? 3;
          this.combat.melee(this.eye, this.forward, it.range * (pw ? 1.15 : 1), it.damage * (pw ? 2 : 1), pw ? Math.min(0.1, it.arc ?? 0.35) : (it.arc ?? 0.35), pw ? { stagger: 0.9 + st, knock: 6 + kn * 1.5 } : { stagger: st, knock: kn });
          this.combat.slashFx(this.eye, this.forward, pw);
          this.shake = Math.max(this.shake, pw ? 0.03 : 0.012);
        }
        if (this.swing[h] >= 1) this.swing[h] = 0;
      }
    }
    this.sync(dt);
  }

  private nextItem(cur: ItemId): ItemId {
    return this.cycle[(this.cycle.indexOf(cur) + 1) % this.cycle.length];
  }

  sync(dt: number): void {
    const cam = this.camera;
    this.shake = Math.max(0, this.shake - dt * 0.25);
    // walk cycle: phase follows ground speed; swing fades out when standing or airborne
    const sp = this.alive && this.grounded ? Math.hypot(this.vel.x, this.vel.z) : 0;
    const target = Math.min(1, sp / 4.5);
    this.walkAmt += (target - this.walkAmt) * Math.min(1, 10 * dt);
    this.walkPhase += sp * dt * 1.7;
    animateWalk(this.limbs, this.walkPhase, this.walkAmt);
    if (this.human) {
      const melee = [0, 1].map((i) => this.swing[i] > 0 && ITEMS[this.hands[i as Hand]].kind === 'melee');
      const hi: Hand = melee[1] ? 1 : 0;
      const active = melee[0] || melee[1];
      this.human.pose({ speed: sp, swing: active ? this.swing[hi] : 0, power: active && this.swingPower[hi], blocking: this.blocking, ride: this.rideFlag }, dt);
      this.rideFlag = false;
    }
    const sign = Math.sign(Math.sin(this.walkPhase)) || 1;
    if (sign !== this.lastStepSign) { this.lastStepSign = sign; if (this.walkAmt > 0.5) this.onStep(); }
    this.avatar.visible = this.thirdPerson;
    this.fpMount[0].visible = this.fpMount[1].visible = !this.thirdPerson;
    this.avatar.position.copy(this.pos);
    this.avatar.rotation.y = this.yaw;
    this.avatar.rotation.z = this.alive ? 0 : Math.PI / 2 * 0.9;

    const eye = this.eye;
    if (!this.thirdPerson) {
      cam.position.copy(eye);
      cam.position.y += (Math.abs(Math.sin(this.walkPhase)) * 0.035 - 0.017) * this.walkAmt;
      cam.rotation.set(this.pitch + (Math.random() - 0.5) * this.shake, this.yaw + (Math.random() - 0.5) * this.shake, Math.cos(this.walkPhase) * 0.004 * this.walkAmt);
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
      const ph = this.walkPhase + (h === 0 ? 0 : Math.PI);
      const bobX = Math.sin(ph) * 0.025 * this.walkAmt, bobY = (Math.abs(Math.cos(ph)) * 0.035 - 0.017) * this.walkAmt;
      m.position.set(base + bobX, -0.3 + bobY + (isSpell ? 0.05 * a : -0.1 * a), -0.55 - (isSpell ? 0.0 : 0.15 * a) + Math.sin(ph) * 0.02 * this.walkAmt);
      const kind = ITEMS[this.hands[h]].kind, melee = kind === 'melee';
      const drawT = ITEMS[this.hands[h]].draw ?? 0.5;
      const wind = melee ? Math.min(1, this.holdT[h] / 0.5) : kind === 'ranged' ? Math.min(1, this.holdT[h] / Math.max(0.2, drawT)) : 0;
      const guard = this.blocking && (melee || kind === 'shield') ? 1 : 0;
      m.position.x += -base * 0.7 * guard; m.position.y += 0.14 * guard + 0.06 * wind; m.position.z += -0.08 * guard + 0.1 * wind;
      m.rotation.set((isSpell ? 0.4 * a : -1.0 * a + 0.25) - 0.9 * wind - 1.0 * guard, 0, (h === 0 ? -1 : 1) * 0.35 * guard);
      if (kind === 'ranged' && ITEMS[this.hands[h]].id === 'bow') {
        // aim the bow: raise to centre, vertical, arrow nocked; string pulled back with the draw
        const w = wind, held = m.children[0] as THREE.Object3D | undefined;
        m.position.set(base * (1 - 0.85 * w), -0.3 + 0.1 * w, -0.55 + 0.04 * w);
        m.rotation.set(0.05 - 0.05 * w, 0.12 * (1 - w), 0.1 * (1 - w));
        if (held?.userData.nock) { (held.userData.nock as THREE.Object3D).visible = w > 0.05; (held.userData.nock as THREE.Object3D).position.z = -0.1 + 0.28 * w; (held.userData.string as THREE.Object3D).position.z = 0.22 * w; }
      }
      if (melee && t > 0 && !this.blocking) {
        // sword arc: wind up (0-0.38), fast slash (0.38-0.6), recover. Power attacks are overhead chops.
        const side = h === 0 ? -1 : 1, pw = this.swingPower[h];
        const ease = (x: number) => x * x * (3 - 2 * x);
        const lerp = (p: number, q: number, k: number) => p + (q - p) * k;
        const back = pw ? { rx: -2.1, rz: 0, px: 0, py: 0.22, pz: 0.06 } : { rx: -1.2, rz: side * 0.9, px: side * 0.1, py: 0.1, pz: 0.04 };
        const fwd = pw ? { rx: 0.9, rz: 0, px: 0, py: -0.2, pz: -0.28 } : { rx: 0.5, rz: -side * 1.05, px: -side * 0.42, py: -0.12, pz: -0.2 };
        const rest = { rx: 0.25, rz: 0, px: 0, py: 0, pz: 0 };
        let from = rest, to = back, k = 0;
        if (t < 0.38) { from = rest; to = back; k = ease(t / 0.38); }
        else if (t < 0.6) { from = back; to = fwd; k = Math.pow((t - 0.38) / 0.22, 2); }
        else { from = fwd; to = rest; k = ease((t - 0.6) / 0.4); }
        m.rotation.set(lerp(from.rx, to.rx, k), 0, lerp(from.rz, to.rz, k));
        m.position.set(base + bobX + lerp(from.px, to.px, k), -0.3 + lerp(from.py, to.py, k), -0.55 + lerp(from.pz, to.pz, k));
      }
      const tm = this.tpMount[h];
      if (!this.human) tm.rotation.set(isSpell ? -1.2 * a : -1.6 * a, 0, 0);
    }
  }
}
