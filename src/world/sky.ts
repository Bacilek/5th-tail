import * as THREE from 'three';

export function buildSky(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(900, 24, 16);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const top = new THREE.Color(0x1d2748), mid = new THREE.Color(0x6b6f8f), hor = new THREE.Color(0xc99a78);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, pos.getY(i) / 900);
    if (t < 0.25) c.copy(hor).lerp(mid, t / 0.25); else c.copy(mid).lerp(top, (t - 0.25) / 0.75);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -1;
  return m;
}
