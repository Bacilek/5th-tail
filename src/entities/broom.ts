import * as THREE from 'three';
import type { Input } from '../engine/input';
import type { Player } from './player';
import { heightAt, MAP_HALF } from '../world/terrain';
import { supportAt, resolve, ceilAt } from '../world/collision';

/** Broom flight (B to mount/dismount, all classes). Mouse steers, W/S speed, Shift boost, V camera. */
export class Broom {
  active = false;
  readonly pos = new THREE.Vector3();
  readonly model = new THREE.Group();
  private yaw = 0;
  private pitch = 0;
  private roll = 0;
  private speed = 0;
  private camPos = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a2c, flatShading: true });
    const straw = new THREE.MeshStandardMaterial({ color: 0xc9a85a, flatShading: true });
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.9, 6), wood);
    stick.rotation.x = Math.PI / 2;
    const bristles = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 7), straw);
    bristles.rotation.x = -Math.PI / 2; bristles.position.z = 1.2;
    this.model.add(stick, bristles);
    this.model.traverse((o) => { o.castShadow = true; });
    this.model.visible = false;
    scene.add(this.model);
  }

  get altitude(): number { return this.pos.y - Math.max(heightAt(this.pos.x, this.pos.z), supportAt(this.pos.x, this.pos.z, this.pos.y, 3)); }

  mount(player: Player): void {
    this.active = true;
    this.pos.set(player.pos.x, player.pos.y + 1.0, player.pos.z);
    this.yaw = player.yaw; this.pitch = 0; this.speed = 0;
    this.camPos.copy(player.eye);
    this.model.visible = true;
    player.hideHands(true);
  }

  /** false when too high */
  dismount(player: Player): boolean {
    if (this.altitude > 4) return false;
    this.active = false;
    this.model.visible = false;
    player.pos.set(this.pos.x, Math.max(heightAt(this.pos.x, this.pos.z), supportAt(this.pos.x, this.pos.z, this.pos.y, 3)), this.pos.z);
    player.vel.set(0, 0, 0);
    player.hideHands(false);
    return true;
  }

  update(dt: number, input: Input, player: Player, camera: THREE.PerspectiveCamera): void {
    if (input.locked) {
      this.yaw -= input.dx * 0.0022;
      this.pitch = Math.max(-1.3, Math.min(1.3, this.pitch - input.dy * 0.0022));
    }
    const boost = input.isDown('ShiftLeft') && player.stamina > 2;
    const wanted = boost ? 38 : input.isDown('KeyW') ? 24 : input.isDown('KeyS') ? 4 : 14;
    if (boost) player.useStaminaRaw(20 * dt);
    this.speed += (wanted - this.speed) * Math.min(1, 2.5 * dt);
    const cp = Math.cos(this.pitch);
    const fwd = new THREE.Vector3(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
    this.pos.addScaledVector(fwd, this.speed * dt);
    this.pos.x = Math.max(-MAP_HALF + 5, Math.min(MAP_HALF - 5, this.pos.x));
    this.pos.z = Math.max(-MAP_HALF + 5, Math.min(MAP_HALF - 5, this.pos.z));
    this.pos.y = Math.min(this.pos.y, 300);
    // walls, roofs and tree trunks block the broom sideways; roofs also act as a ceiling from below
    const bx = this.pos.x, bz = this.pos.z;
    resolve(this.pos, 1.3, 2.4, 0.9, 0);
    if (Math.hypot(this.pos.x - bx, this.pos.z - bz) > 0.02) this.speed *= 0.6;
    const ceil = ceilAt(this.pos.x, this.pos.z, this.pos.y - 0.9);
    if (this.pos.y + 1.5 > ceil) this.pos.y = ceil - 1.5;
    const floor = Math.max(heightAt(this.pos.x, this.pos.z), supportAt(this.pos.x, this.pos.z, this.pos.y, 1.2, 0.5)) + 1.0;
    if (this.pos.y < floor) this.pos.y = floor;

    this.roll += (Math.max(-0.5, Math.min(0.5, input.dx * 0.03)) - this.roll) * Math.min(1, 5 * dt);
    this.model.position.copy(this.pos).add(new THREE.Vector3(0, -0.1, 0));
    this.model.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');

    // rider sits astride
    player.pos.set(this.pos.x, this.pos.y - 0.9, this.pos.z);
    player.yaw = this.yaw; player.pitch = this.pitch;
    player.avatar.position.copy(player.pos);
    player.avatar.rotation.set(0, this.yaw, 0);
    player.avatar.visible = player.thirdPerson;

    if (!player.thirdPerson) {
      camera.position.set(this.pos.x, this.pos.y + 0.8, this.pos.z);
      camera.rotation.order = 'YXZ';
      camera.rotation.set(this.pitch, this.yaw, -this.roll * 0.5);
    } else {
      const want = this.pos.clone().addScaledVector(fwd, -6).add(new THREE.Vector3(0, 2, 0));
      this.camPos.lerp(want, Math.min(1, 8 * dt));
      this.camPos.y = Math.max(this.camPos.y, heightAt(this.camPos.x, this.camPos.z) + 0.8);
      camera.position.copy(this.camPos);
      camera.lookAt(this.pos.clone().addScaledVector(fwd, 6));
    }
  }
}
