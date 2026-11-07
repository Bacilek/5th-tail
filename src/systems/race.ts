import * as THREE from 'three';
import { heightAt } from '../world/terrain';

const HOOPS: [number, number, number][] = [
  [0, 24, 50], [-35, 30, 85], [-70, 34, 40], [-75, 28, -20], [-40, 40, -85],
  [0, 42, -112], [45, 38, -75], [60, 32, 0], [20, 26, 35],
];

/** Broom hoop race around the college grounds. Hoop 1 is the start; the last hoop is the finish. */
export class Race {
  private hoops: THREE.Mesh[] = [];
  private next = 0;
  running = false;
  private time = 0;
  best = Infinity;
  completed = false;
  onMessage: (title: string, sub: string) => void = () => {};

  constructor(scene: THREE.Scene) {
    const geo = new THREE.TorusGeometry(5, 0.35, 8, 24);
    HOOPS.forEach((p, i) => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.9 }));
      m.position.set(p[0], Math.max(p[1], heightAt(p[0], p[2]) + 9), p[2]); // keep hoops clear of terrain
      const n = HOOPS[(i + 1) % HOOPS.length], prev = HOOPS[(i + HOOPS.length - 1) % HOOPS.length];
      const dir = new THREE.Vector3(n[0] - prev[0], n[1] - prev[1], n[2] - prev[2]);
      m.lookAt(m.position.clone().add(dir));
      scene.add(m);
      this.hoops.push(m);
    });
    this.refresh(false);
  }

  private refresh(active: boolean): void {
    this.hoops.forEach((h, i) => {
      const mat = h.material as THREE.MeshBasicMaterial;
      h.visible = active ? i === this.next || i === (this.next + 1) % this.hoops.length : i === 0;
      mat.color.setHex(i === this.next ? 0xffd060 : 0x70b8ff);
    });
  }

  get label(): string {
    if (!this.running) return '';
    return `Broom race: hoop ${this.next + 1}/${this.hoops.length}  ${this.time.toFixed(1)}s`;
  }

  stop(): void {
    if (this.running) this.onMessage('Race abandoned', '');
    this.running = false; this.next = 0; this.refresh(false);
  }

  update(dt: number, pos: THREE.Vector3, onBroom: boolean): void {
    if (!onBroom) { if (this.running) this.stop(); return; }
    if (this.running) this.time += dt;
    const h = this.hoops[this.next];
    if (pos.distanceTo(h.position) > 6) return;
    if (!this.running) {
      this.running = true; this.time = 0; this.next = 1;
      this.refresh(true);
      this.onMessage('Broom race started', 'Fly through all the hoops!');
      return;
    }
    this.next++;
    if (this.next >= this.hoops.length) {
      this.running = false; this.next = 0;
      this.best = Math.min(this.best, this.time);
      this.completed = true;
      this.refresh(false);
      this.onMessage('Race finished!', `${this.time.toFixed(1)} s (best ${this.best.toFixed(1)} s)`);
    } else {
      this.refresh(true);
    }
  }
}
