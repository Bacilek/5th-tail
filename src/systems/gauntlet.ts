import * as THREE from 'three';
import { addBox } from '../world/collision';
import { GAUNTLET, CITADEL_Y } from '../world/terrain';
import type { Player } from '../entities/player';

const Y = CITADEL_Y;
const CZ = (GAUNTLET.z0 + GAUNTLET.z1) / 2;
const W = GAUNTLET.z1 - GAUNTLET.z0;
const stone = new THREE.MeshStandardMaterial({ color: 0x4a4d57, flatShading: true, roughness: 0.95 });
const iron = new THREE.MeshStandardMaterial({ color: 0x777788, flatShading: true, metalness: 0.4 });
const red = new THREE.MeshStandardMaterial({ color: 0xa02a20, flatShading: true, side: THREE.DoubleSide });

interface Sweeper { pivot: THREE.Object3D; x: number; speed: number; phase: number; len: number; }
interface Pendulum { pivot: THREE.Object3D; x: number; period: number; }

const PEND_LEN = 8;

/**
 * The Gauntlet (Riders' obstacle course): a walled corridor from the Citadel to the Flight Field.
 * Hurdle walls, spinning sweeper bars, a stepped wall to climb and swinging iron balls.
 * Layout and exact obstacles are invented; the books only describe it as a deadly course.
 */
export class Gauntlet {
  readonly group = new THREE.Group();
  running = false;
  best = Infinity;
  time = 0;
  onMessage: (a: string, b: string) => void = () => {};
  private sweepers: Sweeper[] = [];
  private pendulums: Pendulum[] = [];
  private hitCd = 0;
  private finished = false;

  constructor() {
    const g = this.group;
    const len = GAUNTLET.x1 - GAUNTLET.x0, cx = (GAUNTLET.x0 + GAUNTLET.x1) / 2;
    for (const z of [GAUNTLET.z0 - 1, GAUNTLET.z1 + 1]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, 8, 2), stone);
      m.position.set(cx, Y + 2, z); m.castShadow = m.receiveShadow = true; g.add(m);
      addBox(cx, z, len, 2, Y + 6);
    }
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(len, W), new THREE.MeshStandardMaterial({ color: 0x6a6258, flatShading: true }));
    fl.rotation.x = -Math.PI / 2; fl.position.set(cx, Y + 0.05, CZ); fl.receiveShadow = true; g.add(fl);

    this.wall(136, 1.1, 1.2); this.wall(141, 1.3, 1.2);
    this.sweeper(150, 1.5, 0); this.sweeper(155, -1.7, 1.6);
    for (const [x, h] of [[160, 1.0], [163, 2.0], [166, 3.0], [169, 2.0], [172, 1.0]]) this.wall(x, h, 3);
    this.sweeper(178, 1.9, 0.5); this.sweeper(183, -2.1, 2.5);
    this.pendulum(187, 2.2);

    for (const z of [GAUNTLET.z0 + 1, GAUNTLET.z1 - 1]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(1.6, 12, 1.6), stone);
      p.position.set(GAUNTLET.x1 - 1, Y + 6, z); p.castShadow = true; g.add(p);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, W), stone);
    lintel.position.set(GAUNTLET.x1 - 1, Y + 12, CZ); g.add(lintel);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(W - 2, 3), red);
    b.rotation.y = Math.PI / 2; b.position.set(GAUNTLET.x0 + 3, Y + 7, CZ); g.add(b);
  }

  private wall(x: number, h: number, depth: number): void {
    const m = new THREE.Mesh(new THREE.BoxGeometry(depth, h, W), stone);
    m.position.set(x, Y + h / 2, CZ); m.castShadow = m.receiveShadow = true; this.group.add(m);
    addBox(x, CZ, depth, W, Y + h);
  }

  private sweeper(x: number, speed: number, phase: number): void {
    const pivot = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.8, 8), iron); post.position.y = 0.9;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(W - 1.5, 0.35, 0.35), red); arm.position.y = 1.0; arm.castShadow = true;
    pivot.add(post, arm);
    pivot.position.set(x, Y, CZ);
    this.group.add(pivot);
    this.sweepers.push({ pivot, x, speed, phase, len: (W - 1.5) / 2 });
  }

  private pendulum(x: number, period: number): void {
    const pivot = new THREE.Group();
    const rope = new THREE.Mesh(new THREE.BoxGeometry(0.12, PEND_LEN, 0.12), iron); rope.position.y = -PEND_LEN / 2;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), iron); ball.position.y = -PEND_LEN; ball.castShadow = true;
    pivot.add(rope, ball);
    pivot.position.set(x, Y + 9.2, CZ);
    this.group.add(pivot);
    this.pendulums.push({ pivot, x, period });
  }

  get label(): string { return this.running ? `Gauntlet  ${this.time.toFixed(1)}s` : ''; }

  /** Returns true the frame the player reaches the Flight Field end of the course. */
  update(dt: number, t: number, player: Player): boolean {
    for (const s of this.sweepers) s.pivot.rotation.y = s.phase + t * s.speed;
    for (const p of this.pendulums) p.pivot.rotation.x = Math.sin(t * Math.PI * 2 / p.period) * 1.0;

    const px = player.pos.x, pz = player.pos.z, py = player.pos.y;
    const inside = px > GAUNTLET.x0 && px < GAUNTLET.x1 && pz > GAUNTLET.z0 && pz < GAUNTLET.z1 && py < Y + 6;
    if (!this.running && inside && px < 146 && !this.finished) {
      this.running = true; this.time = 0;
      this.onMessage('The Gauntlet', 'Jump the walls and bars; dodge the swinging balls.');
    }
    if (this.running) this.time += dt;
    if (this.running && px < GAUNTLET.x0 - 1) this.running = false;

    this.hitCd -= dt;
    if (inside && this.hitCd <= 0 && player.alive) {
      let hit = false;
      for (const s of this.sweepers) {
        if (Math.abs(px - s.x) > 1.4 || py > Y + 1.0) continue;
        const a = s.pivot.rotation.y;
        const dx = px - s.x, dz = pz - CZ;
        // bar axis in world space is (cos a, 0, -sin a)
        const along = dx * Math.cos(a) - dz * Math.sin(a);
        const across = dx * Math.sin(a) + dz * Math.cos(a);
        if (Math.abs(along) < s.len && Math.abs(across) < 0.9) hit = true;
      }
      for (const p of this.pendulums) {
        const a = p.pivot.rotation.x;
        const bz = CZ + Math.sin(a) * PEND_LEN, by = Y + 9.2 - Math.cos(a) * PEND_LEN;
        if (Math.hypot(px - p.x, pz - bz) < 1.9 && Math.abs(py + 1 - by) < 2.2) hit = true;
      }
      if (hit) {
        player.damage(14);
        player.vel.x -= 6; player.vel.y = Math.max(player.vel.y, 4); this.hitCd = 0.9;
      }
    }

    if (this.running && px > GAUNTLET.x1 - 1.5 && pz > GAUNTLET.z0 && pz < GAUNTLET.z1) {
      this.running = false; this.finished = true;
      this.best = Math.min(this.best, this.time);
      this.onMessage('Gauntlet complete', `${this.time.toFixed(1)} s (best ${this.best.toFixed(1)} s)`);
      return true;
    }
    return false;
  }

  reset(): void { this.finished = false; this.running = false; }
}
