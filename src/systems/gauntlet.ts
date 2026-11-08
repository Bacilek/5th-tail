import * as THREE from 'three';
import { addBox, addCircle } from '../world/collision';
import { GAUNTLET, CITADEL_Y } from '../world/terrain';
import type { Player } from '../entities/player';

const Y = CITADEL_Y;
const CZ = (GAUNTLET.z0 + GAUNTLET.z1) / 2;
const W = GAUNTLET.z1 - GAUNTLET.z0;
const stone = new THREE.MeshStandardMaterial({ color: 0x4a4d57, flatShading: true, roughness: 0.95 });
const iron = new THREE.MeshStandardMaterial({ color: 0x777788, flatShading: true, metalness: 0.4 });
const red = new THREE.MeshStandardMaterial({ color: 0xa02a20, flatShading: true, side: THREE.DoubleSide });

interface Sweeper { pivot: THREE.Object3D; x: number; speed: number; phase: number; len: number; }
interface Pendulum { pivot: THREE.Object3D; x: number; period: number; y0: number; }

const PEND_LEN = 8;
const TOP = 8; // beam / barrier height above the floor

/**
 * The Gauntlet (Riders' obstacle course): a walled corridor from the Citadel to the Flight Field.
 * Five obstacles: hurdle walls, a spinning sweeper bar, a zig-zag ledge climb (8 m), a beam walk under swinging iron balls,
 * and a drop off the far wall. The ground path is blocked by the barrier wall, so the climb is the only way through.
 * Lore: a steep vertical course; exact obstacles are invented.
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
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, 22, 2), stone);
      m.position.set(cx, Y + 9, z); m.castShadow = m.receiveShadow = true; g.add(m);
      addBox(cx, z, len, 2, Y + 20);
    }
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(len, W), new THREE.MeshStandardMaterial({ color: 0x6a6258, flatShading: true }));
    fl.rotation.x = -Math.PI / 2; fl.position.set(cx, Y + 0.05, CZ); fl.receiveShadow = true; g.add(fl);

    // 1-2: hurdles and the sweeper (arc radius ~7.2 m stays clear of the walls and the first ledge)
    this.wall(132, 1.1, 1.2); this.wall(136, 1.3, 1.2);
    this.sweeper(146, 1.6, 0);
    // 3: ledge climb, each ledge 1 m higher, alternating sides so every step is a hop
    for (let i = 0; i < 8; i++) {
      const x = 155.5 + 2.2 * i, h = 1 + i, zc = i === 7 ? CZ : CZ + (i % 2 ? 3.2 : -3.2);
      this.block(x, zc, 2.4, 4, h);
    }
    // 4: beam walk at +8 m under two pendulums hung from a gantry
    const bx0 = 171.9, bx1 = 183;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(bx1 - bx0, 0.5, 1.4), stone);
    beam.position.set((bx0 + bx1) / 2, Y + TOP - 0.25, CZ); beam.castShadow = beam.receiveShadow = true; g.add(beam);
    addBox((bx0 + bx1) / 2, CZ, bx1 - bx0, 1.4, Y + TOP, Y + TOP - 0.5);
    const gantryY = Y + TOP + 9.5;
    const gantry = new THREE.Mesh(new THREE.BoxGeometry(bx1 - bx0 + 4, 0.6, 0.8), iron);
    gantry.position.set((bx0 + bx1) / 2, gantryY + 0.3, CZ); g.add(gantry);
    this.pendulum(176, 2.4, gantryY); this.pendulum(180.5, 2.4 * 0.8, gantryY);
    // 5: barrier wall (ground path stops here); jump or drop off its top into the finish stretch
    this.block(184, CZ, 2, W, TOP);
    for (const z of [GAUNTLET.z0 + 1, GAUNTLET.z1 - 1]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(1.6, 12, 1.6), stone);
      p.position.set(GAUNTLET.x1 - 1, Y + 6, z); p.castShadow = true; g.add(p);
    }
    addBox(GAUNTLET.x1 - 1, CZ, 1.6, W, Y + 12.8, Y + 11.2);
    for (const z of [GAUNTLET.z0 + 1, GAUNTLET.z1 - 1]) addBox(GAUNTLET.x1 - 1, z, 1.6, 1.6, Y + 12);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, W), stone);
    lintel.position.set(GAUNTLET.x1 - 1, Y + 12, CZ); g.add(lintel);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(W - 2, 3), red);
    b.rotation.y = Math.PI / 2; b.position.set(GAUNTLET.x0 + 3, Y + 7, CZ); g.add(b);
  }

  private block(x: number, z: number, w: number, d: number, h: number): void {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stone);
    m.position.set(x, Y + h / 2, z); m.castShadow = m.receiveShadow = true; this.group.add(m);
    addBox(x, z, w, d, Y + h);
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
    addCircle(x, CZ, 0.5, Y + 1.8); // the post is solid
    this.sweepers.push({ pivot, x, speed, phase, len: (W - 1.5) / 2 });
  }

  private pendulum(x: number, period: number, y0 = Y + 9.2): void {
    const pivot = new THREE.Group();
    const rope = new THREE.Mesh(new THREE.BoxGeometry(0.12, PEND_LEN, 0.12), iron); rope.position.y = -PEND_LEN / 2;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), iron); ball.position.y = -PEND_LEN; ball.castShadow = true;
    pivot.add(rope, ball);
    pivot.position.set(x, y0, CZ);
    this.group.add(pivot);
    this.pendulums.push({ pivot, x, period, y0 });
  }

  get label(): string { return this.running ? `Gauntlet  ${this.time.toFixed(1)}s` : ''; }

  /** Returns true the frame the player reaches the Flight Field end of the course. */
  update(dt: number, t: number, player: Player): boolean {
    for (const s of this.sweepers) s.pivot.rotation.y = s.phase + t * s.speed;
    for (const p of this.pendulums) p.pivot.rotation.x = Math.sin(t * Math.PI * 2 / p.period) * 1.0;

    const px = player.pos.x, pz = player.pos.z, py = player.pos.y;
    const inside = px > GAUNTLET.x0 && px < GAUNTLET.x1 && pz > GAUNTLET.z0 && pz < GAUNTLET.z1 && py < Y + 24;
    if (!this.running && inside && px < 150 && py < Y + 3 && !this.finished) {
      this.running = true; this.time = 0;
      this.onMessage('The Gauntlet', 'Jump the walls, climb the ledges, cross the beam, then drop off the far wall.');
    }
    if (this.running) this.time += dt;
    if (this.running && px < GAUNTLET.x0 - 1) this.running = false;

    this.hitCd -= dt;
    if (inside && this.hitCd <= 0 && player.alive) {
      let hit = false, kx = 0, kz = 0, ky = 0, dmg = 0;
      for (const s of this.sweepers) {
        if (py > Y + 0.85) continue; // jumped over the bar
        const a = s.pivot.rotation.y;
        const dx = px - s.x, dz = pz - CZ;
        // bar axis in world space is (cos a, 0, -sin a)
        const along = dx * Math.cos(a) - dz * Math.sin(a);
        const across = dx * Math.sin(a) + dz * Math.cos(a);
        if (Math.abs(along) < s.len && Math.abs(across) < 0.9) {
          // knock the player in the direction the bar is moving at that point (v = w x r)
          const sg = s.speed >= 0 ? 1 : -1;
          const vx = sg * dz, vz = -sg * dx, l = Math.hypot(vx, vz) || 1;
          kx = (vx / l) * 14; kz = (vz / l) * 14; ky = 3; dmg = 8; hit = true;
        }
      }
      for (const p of this.pendulums) {
        const a = p.pivot.rotation.x;
        const bz = CZ + Math.sin(a) * PEND_LEN, by = p.y0 - Math.cos(a) * PEND_LEN;
        if (Math.hypot(px - p.x, pz - bz) < 1.9 && Math.abs(py + 1 - by) < 2.2) {
          // wrecking ball: hurl the player along the swing direction
          const dir = Math.sign(Math.cos(t * Math.PI * 2 / p.period)) || 1;
          kx = (px - p.x) * 3 + 2; kz = dir * 22; ky = 3; dmg = 14; hit = true;
        }
      }
      if (hit) {
        player.damage(dmg);
        player.push(kx, ky, kz);
        this.hitCd = 0.9;
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
