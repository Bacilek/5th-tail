import * as THREE from 'three';
import { smoothstep } from '../engine/noise';
import type { Sky } from '../world/sky';
import { settings } from '../engine/settings';

/** One full day lasts this many real seconds. */
const DAY_SECONDS = 660;

/** Day/night cycle: moves sun and moon, recolours sky, fog and lights, dims/brightens torches. */
export class DayNight {
  hour = 8;
  readonly sunDir = new THREE.Vector3();
  /** 0 = deep night, 1 = full day */
  day = 1;
  /** Every lamp in the world as plain data; only POOL real lights exist and they follow the nearest lamps (fragment cost scales with light count). */
  private lamps: { pos: THREE.Vector3; color: THREE.Color; base: number; dist: number; decay: number }[] = [];
  private pool: THREE.PointLight[] = [];
  private static readonly POOL = 4;

  constructor(
    private sky: Sky,
    private sun: THREE.DirectionalLight,
    private hemi: THREE.HemisphereLight,
    private scene: THREE.Scene,
  ) {}

  /** Call once after the world is built: finds every point light (torches, camp fire). */
  collectLights(): void {
    this.scene.updateMatrixWorld(true);
    const found: THREE.PointLight[] = [];
    this.scene.traverse((o) => { if (o instanceof THREE.PointLight) found.push(o); });
    for (const l of found) {
      this.lamps.push({ pos: l.getWorldPosition(new THREE.Vector3()), color: l.color.clone(), base: l.intensity, dist: l.distance, decay: l.decay });
      l.parent?.remove(l);
    }
    for (let i = 0; i < DayNight.POOL; i++) { const l = new THREE.PointLight(0xffa860, 0, 20, 1.6); this.pool.push(l); this.scene.add(l); }
  }

  get clock(): string {
    const h = Math.floor(this.hour) % 24, m = Math.floor((this.hour % 1) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /** Sun direction for an hour: rises 06:00 in the east (+x), noon overhead, sets 18:00 in the west. */
  private dirFor(hour: number, out: THREE.Vector3): THREE.Vector3 {
    const a = ((hour - 6) / 24) * Math.PI * 2;
    return out.set(Math.cos(a), Math.sin(a), 0.35).normalize();
  }

  update(dt: number, playerPos: THREE.Vector3, camPos: THREE.Vector3): void {
    this.hour = (this.hour + (dt * 24) / DAY_SECONDS) % 24;
    if (settings.noNight && (this.hour >= 19 || this.hour < 6.5)) this.hour = 7; // night disabled in settings
    this.dirFor(this.hour, this.sunDir);
    const s = this.sunDir.y;
    this.day = smoothstep(-0.12, 0.3, s);
    const tw = Math.exp(-Math.pow(s / 0.2, 2));
    this.sky.update(this.sunDir, camPos);

    // directional light: the sun by day, the moon (opposite side) by night; keep it above the horizon for sane shadows
    const dir = s >= 0 ? this.sunDir.clone() : this.sunDir.clone().negate();
    dir.y = Math.max(dir.y, 0.28); dir.normalize();
    const sunI = 2.2 * smoothstep(-0.02, 0.28, s);
    const moonI = 1.4 * smoothstep(0.05, -0.25, s);
    this.sun.intensity = Math.max(sunI, moonI, 0.12);
    this.sun.color.setHex(s >= 0 ? 0xffd7a8 : 0x9ab0ff).lerp(new THREE.Color(0xff9a60), s >= 0 ? tw * 0.6 : 0);
    this.sun.position.copy(playerPos).addScaledVector(dir, 150);
    this.sun.target.position.copy(playerPos);

    this.hemi.intensity = 1.25 - 0.1 * this.day; // nights stay readable (moonlit blue), not black
    this.hemi.color.setHex(0x5a70b4).lerp(new THREE.Color(0xb8c4ee), this.day);
    this.hemi.groundColor.setHex(0x30384e).lerp(new THREE.Color(0x3a3328), this.day);

    if (this.scene.fog) (this.scene.fog as THREE.Fog).color.copy(this.sky.fogColor);
    const night = 1 - this.day;
    const k = 0.35 + 0.9 * night;
    const ranked = this.lamps.map((l) => ({ l, d: l.pos.distanceToSquared(playerPos) })).sort((a, b) => a.d - b.d);
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i], r = ranked[i];
      if (!r || Math.sqrt(r.d) > r.l.dist * 1.6) { p.intensity = 0; continue; }
      p.position.copy(r.l.pos); p.color.copy(r.l.color); p.distance = r.l.dist; p.decay = r.l.decay;
      p.intensity = r.l.base * k * (1 - smoothstep(r.l.dist * 0.9, r.l.dist * 1.6, Math.sqrt(r.d)));
    }
  }

  setHour(h: number): void { this.hour = ((h % 24) + 24) % 24; }
}
