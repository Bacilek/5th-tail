export interface Box { x0: number; x1: number; z0: number; z1: number; top: number; }

export const boxes: Box[] = [];

export function addBox(cx: number, cz: number, w: number, d: number, top: number): void {
  boxes.push({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2, top });
}

/** Highest collider top at (x,z), or -Infinity. */
export function topAt(x: number, z: number): number {
  let t = -Infinity;
  for (const b of boxes) if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1) t = Math.max(t, b.top);
  return t;
}

/** Pushes a circle (radius r) at pos out of all boxes whose top is above pos.y. Mutates pos. */
export function resolve(pos: { x: number; y: number; z: number }, r: number): void {
  for (const b of boxes) {
    if (pos.y >= b.top - 0.3) continue;
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
