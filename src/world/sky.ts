import * as THREE from 'three';
import { smoothstep } from '../engine/noise';

const R = 900;
const lerpC = (out: THREE.Color, a: number, b: number, t: number): THREE.Color => out.setHex(a).lerp(new THREE.Color(b), t);

function glowTexture(inner: string, outer: string): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner); grad.addColorStop(0.35, inner); grad.addColorStop(1, outer);
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}

/** Sky dome whose colours follow the time of day, plus stars, sun and moon. Follows the camera. */
export class Sky {
  readonly group = new THREE.Group();
  /** Horizon colour of the current moment (used for fog). */
  readonly fogColor = new THREE.Color();
  private dome: THREE.Mesh;
  private heights: Float32Array;
  private colors: THREE.BufferAttribute;
  private stars: THREE.Points;
  private sunSprite: THREE.Sprite;
  private moonSprite: THREE.Sprite;

  constructor() {
    const geo = new THREE.SphereGeometry(R, 24, 16);
    const n = geo.attributes.position.count;
    this.heights = new Float32Array(n);
    for (let i = 0; i < n; i++) this.heights[i] = Math.max(0, geo.attributes.position.getY(i) / R);
    this.colors = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
    geo.setAttribute('color', this.colors);
    this.dome = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    this.dome.renderOrder = -2;

    const sp = new Float32Array(700 * 3);
    for (let i = 0; i < 700; i++) {
      const u = Math.random(), v = Math.random() * 0.95 + 0.05;
      const th = u * Math.PI * 2, y = v, r = Math.sqrt(1 - y * y);
      sp[i * 3] = Math.cos(th) * r * (R - 40); sp[i * 3 + 1] = y * (R - 40); sp[i * 3 + 2] = Math.sin(th) * r * (R - 40);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    this.stars.renderOrder = -1;

    this.sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#fff6d0', '#fff6d000'), fog: false, depthWrite: false, transparent: true }));
    this.sunSprite.scale.set(170, 170, 1);
    this.moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('#e8efff', '#e8efff00'), fog: false, depthWrite: false, transparent: true }));
    this.moonSprite.scale.set(95, 95, 1);
    this.group.add(this.dome, this.stars, this.sunSprite, this.moonSprite);
  }

  /** sunDir: unit vector towards the sun; s = sunDir.y (-1..1). */
  update(sunDir: THREE.Vector3, camPos: THREE.Vector3): void {
    const s = sunDir.y;
    const day = smoothstep(-0.12, 0.3, s);
    const tw = Math.exp(-Math.pow(s / 0.2, 2));
    const top = lerpC(new THREE.Color(), 0x04060e, 0x2a3f78, day).lerp(new THREE.Color(0x2a2a58), tw * 0.5);
    const mid = lerpC(new THREE.Color(), 0x0a0f20, 0x6b7fa8, day).lerp(new THREE.Color(0x7a5a6a), tw * 0.5);
    const hor = lerpC(new THREE.Color(), 0x141a30, 0xc9a888, day).lerp(new THREE.Color(0xff8a50), tw * 0.8);
    const c = new THREE.Color();
    for (let i = 0; i < this.heights.length; i++) {
      const t = this.heights[i];
      if (t < 0.25) c.copy(hor).lerp(mid, t / 0.25); else c.copy(mid).lerp(top, (t - 0.25) / 0.75);
      this.colors.setXYZ(i, c.r, c.g, c.b);
    }
    this.colors.needsUpdate = true;
    this.fogColor.copy(hor).lerp(mid, 0.45);

    (this.stars.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - day * 1.6);
    this.sunSprite.position.copy(sunDir).multiplyScalar(R - 80);
    this.moonSprite.position.copy(sunDir).multiplyScalar(-(R - 80));
    this.sunSprite.visible = s > -0.2;
    this.moonSprite.visible = s < 0.2;
    (this.sunSprite.material as THREE.SpriteMaterial).opacity = 1;
    this.group.position.copy(camPos);
  }
}
