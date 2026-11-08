/** Footprint collider. `bottom` is -Infinity for ground-standing boxes; roofs/lintels have a finite bottom so fliers can pass beneath. */
export interface Box { x0: number; x1: number; z0: number; z1: number; top: number; bottom: number; }

export const boxes: Box[] = [];

interface Circle { x: number; z: number; r: number; top: number; }
const CELL = 8;
const circles = new Map<number, Circle[]>();
const ck = (cx: number, cz: number) => (cx + 1024) * 4096 + (cz + 1024);

/** Round collider (tree trunk, pillar). Blocks anything whose feet are below `top`. */
export function addCircle(x: number, z: number, r: number, top: number): void {
  const k = ck(Math.floor(x / CELL), Math.floor(z / CELL));
  const a = circles.get(k);
  if (a) a.push({ x, z, r, top }); else circles.set(k, [{ x, z, r, top }]);
}

function resolveCircles(pos: { x: number; y: number; z: number }, r: number, yLow: number, margin: number): void {
  const cx = Math.floor(pos.x / CELL), cz = Math.floor(pos.z / CELL);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const a = circles.get(ck(cx + i, cz + j));
    if (!a) continue;
    for (const c of a) {
      if (yLow >= c.top - margin) continue;
      const dx = pos.x - c.x, dz = pos.z - c.z;
      const d = Math.hypot(dx, dz), min = c.r + r;
      if (d >= min) continue;
      if (d < 1e-4) { pos.x += min; continue; }
      pos.x = c.x + (dx / d) * min; pos.z = c.z + (dz / d) * min;
    }
  }
}

export function addBox(cx: number, cz: number, w: number, d: number, top: number, bottom = -Infinity): void {
  boxes.push({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2, top, bottom });
}

/** Lowest underside (finite `bottom`) of a box above height y at (x,z): the ceiling a flier cannot pass. Infinity if none. */
export function ceilAt(x: number, z: number, y: number): number {
  let c = Infinity;
  for (const b of boxes) {
    if (b.bottom > -Infinity && b.bottom >= y - 0.01 && x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1) c = Math.min(c, b.bottom);
  }
  return c;
}

/** Highest collider top at (x,z), or -Infinity. */
export function topAt(x: number, z: number): number {
  let t = -Infinity;
  for (const b of boxes) if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1) t = Math.max(t, b.top);
  return t;
}

/**
 * Pushes a circle (radius r) at pos out of boxes it overlaps vertically. The body spans [pos.y - below, pos.y - below + height].
 * Walkers use the defaults; fliers pass `below`/`height` and margin 0. Mutates pos (horizontal only).
 */
export function resolve(pos: { x: number; y: number; z: number }, r: number, height = 1.8, below = 0, margin = 0.3): void {
  const yLow = pos.y - below, yHigh = yLow + height;
  resolveCircles(pos, r, yLow, margin);
  for (const b of boxes) {
    if (yLow >= b.top - margin) continue;
    if (yHigh <= b.bottom) continue;
    const cx = Math.max(b.x0, Math.min(pos.x, b.x1));
    const cz = Math.max(b.z0, Math.min(pos.z, b.z1));
    const dx = pos.x - cx, dz = pos.z - cz;
    const dist2 = dx * dx + dz * dz;
    if (dist2 >= r * r) continue;
    if (dist2 > 1e-6) {
      const dist = Math.sqrt(dist2);
      pos.x += (dx / dist) * (r - dist);
      pos.z += (dz / dist) * (r - dist);
    } else {
      const l = pos.x - b.x0, rr = b.x1 - pos.x, f = pos.z - b.z0, bk = b.z1 - pos.z;
      const m = Math.min(l, rr, f, bk);
      if (m === l) pos.x = b.x0 - r; else if (m === rr) pos.x = b.x1 + r;
      else if (m === f) pos.z = b.z0 - r; else pos.z = b.z1 + r;
    }
  }
}

/** Highest box top under (x,z) that is at most `reach` above y (a surface the player can stand on / land on). */
export function supportAt(x: number, z: number, y: number, reach = 0.5, r = 0.3): number {
  let t = -Infinity;
  for (const b of boxes) {
    if (x >= b.x0 - r && x <= b.x1 + r && z >= b.z0 - r && z <= b.z1 + r && b.top <= y + reach) t = Math.max(t, b.top);
  }
  return t;
}
