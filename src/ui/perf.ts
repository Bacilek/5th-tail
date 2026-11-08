import type * as THREE from 'three';

/** F3 performance overlay: FPS, frame time, draw calls, triangles, memory counters, player position. */
export class PerfOverlay {
  private el: HTMLElement;
  private visible = false;
  private frames = 0;
  private acc = 0;
  private worst = 0;
  private last = performance.now();
  /** Last measured average FPS (also readable by tests). */
  fps = 0;

  constructor(private renderer: THREE.WebGLRenderer, private extra: () => string = () => '') {
    this.el = document.createElement('div');
    this.el.id = 'perf';
    this.el.style.cssText = 'position:fixed;left:8px;bottom:56px;z-index:9;font:12px/1.4 monospace;color:#9fffa0;background:#000b;padding:6px 10px;border:1px solid #3a6a3a;display:none;white-space:pre;pointer-events:none';
    document.body.appendChild(this.el);
    addEventListener('keydown', (e) => {
      if (e.code === 'F3') { e.preventDefault(); this.toggle(); }
    });
  }

  toggle(): void {
    this.visible = !this.visible;
    this.el.style.display = this.visible ? 'block' : 'none';
  }

  /** Call once per rendered frame, after renderer.render. */
  tick(): void {
    const now = performance.now();
    const dt = now - this.last;
    this.last = now;
    this.frames++; this.acc += dt; this.worst = Math.max(this.worst, dt);
    if (this.acc >= 500) {
      this.fps = (this.frames * 1000) / this.acc;
      if (this.visible) {
        const i = this.renderer.info;
        this.el.textContent =
          `FPS ${this.fps.toFixed(0)}  (${(this.acc / this.frames).toFixed(1)} ms, worst ${this.worst.toFixed(0)} ms)\n` +
          `draw calls ${i.render.calls}  triangles ${(i.render.triangles / 1000).toFixed(0)}k\n` +
          `geometries ${i.memory.geometries}  textures ${i.memory.textures}\n` + this.extra();
      }
      this.frames = 0; this.acc = 0; this.worst = 0;
    }
  }
}
