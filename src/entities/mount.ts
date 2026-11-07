import * as THREE from 'three';
import type { Input } from '../engine/input';
import type { Player } from './player';
import type { Combat } from '../systems/combat';
import { createDragon, type Dragon } from './dragon';
import { TAIL_ATTACKS, type DragonSpec } from '../data/dragons';
import { heightAt, MAP_HALF } from '../world/terrain';
import { topAt } from '../world/collision';

type State = 'away' | 'arriving' | 'idle' | 'mounted';

interface Flame { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; }

/** The rider's bonded dragon: summon (R), mount/dismount (F), flight, fire breath (LMB), tail strike (RMB). */
export class DragonMount {
  state: State = 'away';
  readonly dragon: Dragon;
  readonly pos = new THREE.Vector3();
  private yaw = 0;
  private pitch = 0;
  private roll = 0;
  private speed = 0;
  private arriveT = 0;
  private arriveFrom = new THREE.Vector3();
  private arriveTo = new THREE.Vector3();
  private tailCd = 0;
  private flames: Flame[] = [];
  private flameGeo = new THREE.SphereGeometry(0.5, 6, 5);
  private breathAcc = 0;
  private camPos = new THREE.Vector3();
  private t = 0;

  constructor(public spec: DragonSpec, private scene: THREE.Scene, private combat: Combat) {
    this.dragon = createDragon(spec);
    this.dragon.group.visible = false;
    scene.add(this.dragon.group);
  }

  private get clearance(): number { return 2.4 * this.spec.size; }
  private get forward(): THREE.Vector3 {
    const cp = Math.cos(this.pitch);
    return new THREE.Vector3(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
  }
  get altitude(): number { return this.pos.y - this.clearance - Math.max(heightAt(this.pos.x, this.pos.z), topAt(this.pos.x, this.pos.z)); }
  get mounted(): boolean { return this.state === 'mounted'; }

  summon(player: Player): void {
    if (this.state === 'mounted') return;
    const f = player.forward; f.y = 0; f.normalize();
    const tx = player.pos.x + f.x * 12, tz = player.pos.z + f.z * 12;
    this.arriveTo.set(tx, Math.max(heightAt(tx, tz), topAt(tx, tz)) + this.clearance, tz);
    if (this.state === 'away') {
      this.arriveFrom.set(tx - f.x * 160 + 40, this.arriveTo.y + 80, tz - f.z * 160);
    } else {
      this.arriveFrom.copy(this.pos);
    }
    this.pos.copy(this.arriveFrom);
    this.arriveT = 0;
    this.state = 'arriving';
    this.dragon.group.visible = true;
  }

  canMount(player: Player): boolean {
    return this.state === 'idle' && this.pos.distanceTo(player.pos) < 10;
  }

  mount(player: Player): void {
    this.state = 'mounted';
    this.yaw = player.yaw; this.pitch = 0; this.speed = 0;
    this.camPos.copy(player.eye);
    player.hideHands(true);
  }

  /** Returns false if the dragon is too high to dismount. */
  dismount(player: Player): boolean {
    if (this.altitude > 5) return false;
    this.state = 'idle';
    const side = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    player.pos.set(this.pos.x + side.x * 3, 0, this.pos.z + side.z * 3);
    player.pos.y = heightAt(player.pos.x, player.pos.z);
    player.vel.set(0, 0, 0);
    player.hideHands(false);
    this.pitch = 0; this.roll = 0;
    this.pos.y = Math.max(heightAt(this.pos.x, this.pos.z), topAt(this.pos.x, this.pos.z)) + this.clearance;
    return true;
  }

  update(dt: number, input: Input, player: Player, camera: THREE.PerspectiveCamera): void {
    this.t += dt;
    this.tailCd = Math.max(0, this.tailCd - dt);
    const g = this.dragon.group;

    if (this.state === 'arriving') {
      this.arriveT += dt;
      const k = Math.min(1, this.arriveT / 6);
      const e = 1 - Math.pow(1 - k, 2);
      const prev = this.pos.clone();
      this.pos.lerpVectors(this.arriveFrom, this.arriveTo, e);
      const d = this.pos.clone().sub(prev);
      if (d.lengthSq() > 1e-6) {
        this.yaw = Math.atan2(-d.x, -d.z);
        this.pitch = Math.asin(Math.max(-1, Math.min(1, d.y / d.length())));
      }
      if (k >= 1) { this.state = 'idle'; this.pitch = 0; }
      g.position.copy(this.pos);
      g.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
      this.dragon.update(this.t, k >= 1 ? 0.2 : 1);
    } else if (this.state === 'idle') {
      g.position.copy(this.pos);
      g.rotation.set(0, this.yaw, 0, 'YXZ');
      this.dragon.update(this.t * 0.4, 0);
    } else if (this.state === 'mounted') {
      this.fly(dt, input, player, camera);
    }
    this.updateFlames(dt);
  }

  private fly(dt: number, input: Input, player: Player, camera: THREE.PerspectiveCamera): void {
    const g = this.dragon.group;
    if (input.locked) {
      this.yaw -= input.dx * 0.0022;
      this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch - input.dy * 0.0022));
    }
    const boost = input.isDown('ShiftLeft') && player.stamina > 2;
    const target = input.isDown('KeyW') ? 42 : input.isDown('KeyS') ? 5 : 26;
    const wanted = boost ? 62 : target;
    if (boost) player.useStaminaRaw(25 * dt);
    this.speed += (wanted - this.speed) * Math.min(1, 2.2 * dt);
    const fwd = this.forward;
    this.pos.addScaledVector(fwd, this.speed * dt);
    this.pos.x = Math.max(-MAP_HALF + 5, Math.min(MAP_HALF - 5, this.pos.x));
    this.pos.z = Math.max(-MAP_HALF + 5, Math.min(MAP_HALF - 5, this.pos.z));
    this.pos.y = Math.min(this.pos.y, 320);
    const floor = Math.max(heightAt(this.pos.x, this.pos.z), topAt(this.pos.x, this.pos.z)) + this.clearance;
    if (this.pos.y < floor) { this.pos.y = floor; this.speed *= 1 - Math.min(1, 2 * dt); }

    const targetRoll = Math.max(-0.7, Math.min(0.7, input.dx * 0.03));
    this.roll += (targetRoll - this.roll) * Math.min(1, 5 * dt);
    g.position.copy(this.pos);
    g.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
    const gliding = this.pitch < -0.35;
    this.dragon.update(this.t * (1 + this.speed / 60), gliding ? 0.3 : 1);

    // rider sits on the dragon's back
    const seat = new THREE.Vector3(0, 1.5 * this.spec.size, -0.2).applyEuler(g.rotation).add(this.pos);
    player.pos.set(seat.x, seat.y - 1.0, seat.z);
    player.yaw = this.yaw; player.pitch = 0;
    player.avatar.position.copy(player.pos);
    player.avatar.rotation.set(0, this.yaw, 0);
    player.avatar.visible = true;

    // attacks
    const mouth = new THREE.Vector3(0, 2.2 * this.spec.size, -5.2 * this.spec.size).applyEuler(g.rotation).add(this.pos);
    if (input.locked && input.buttonDown(0) && player.magicka > 0) {
      player.magicka = Math.max(0, player.magicka - 14 * dt);
      player.delayMagickaRegen();
      this.breathAcc += dt;
      while (this.breathAcc > 0.04) {
        this.breathAcc -= 0.04;
        const dir = fwd.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12)).normalize();
        this.spawnFlame(mouth, dir.multiplyScalar(45 + this.speed));
      }
      this.combat.melee(mouth, fwd, 32, 55 * dt, 0.9);
    }
    if (input.locked && input.buttonPressed(2) && this.tailCd <= 0) {
      const a = TAIL_ATTACKS[this.spec.tail];
      if (player.useStaminaRaw(a.cost)) {
        this.tailCd = a.cooldown;
        const tip = new THREE.Vector3(0, 0, 6.5 * this.spec.size).applyEuler(g.rotation).add(this.pos);
        this.combat.blast(tip, a.radius, a.damage, 0xffe0a0);
      }
    }

    // camera: 3rd person behind, or first person from the rider's eyes
    const up = new THREE.Vector3(0, 1, 0);
    if (player.thirdPerson || true) {
      const want = this.pos.clone().addScaledVector(fwd, -15 * this.spec.size).addScaledVector(up, 5 * this.spec.size + 1);
      this.camPos.lerp(want, Math.min(1, 7 * dt));
      this.camPos.y = Math.max(this.camPos.y, heightAt(this.camPos.x, this.camPos.z) + 1);
      camera.position.copy(this.camPos);
      camera.lookAt(this.pos.clone().addScaledVector(fwd, 12).addScaledVector(up, 1.5));
    }
  }

  private spawnFlame(at: THREE.Vector3, vel: THREE.Vector3): void {
    const mat = new THREE.MeshBasicMaterial({ color: Math.random() < 0.5 ? 0xff7a1a : 0xffc040, transparent: true, opacity: 0.85 });
    const mesh = new THREE.Mesh(this.flameGeo, mat);
    mesh.position.copy(at);
    this.scene.add(mesh);
    this.flames.push({ mesh, vel, life: 0.55 });
  }

  private updateFlames(dt: number): void {
    for (let i = this.flames.length - 1; i >= 0; i--) {
      const f = this.flames[i];
      f.life -= dt;
      f.mesh.position.addScaledVector(f.vel, dt);
      f.mesh.scale.setScalar(1 + (0.55 - f.life) * 3);
      (f.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, f.life / 0.55) * 0.85;
      if (f.life <= 0) {
        this.scene.remove(f.mesh);
        (f.mesh.material as THREE.Material).dispose();
        this.flames.splice(i, 1);
      }
    }
  }
}
