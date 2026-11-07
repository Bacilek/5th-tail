import * as THREE from 'three';
import type { DragonSpec, TailType } from '../data/dragons';

export interface Dragon {
  group: THREE.Group;
  update(t: number, flap?: number): void;
}

function wingGeometry(side: number): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const s = side;
  const v = new Float32Array([
    0, 0, 0.6, 0, 0, -1.8, s * 7, 0.6, -2.6,
    0, 0, 0.6, s * 7, 0.6, -2.6, s * 6, 0, 2.2,
    0, 0, 0.6, s * 6, 0, 2.2, s * 2.5, 0, 2.4,
  ]);
  g.setAttribute('position', new THREE.BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

function tailEnd(type: TailType, mat: THREE.Material, dark: THREE.Material): THREE.Object3D {
  const g = new THREE.Group();
  const add = (m: THREE.Mesh) => { m.castShadow = true; g.add(m); return m; };
  switch (type) {
    case 'dagger': {
      const c = add(new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.8, 5), dark));
      c.rotation.x = Math.PI / 2; c.position.z = 0.9;
      break;
    }
    case 'sword': {
      const b = add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 3.2), dark));
      b.position.z = 1.4;
      break;
    }
    case 'club': {
      const b = add(new THREE.Mesh(new THREE.SphereGeometry(0.95, 6, 5), mat));
      b.position.z = 0.7; b.scale.set(1, 0.9, 1.3);
      break;
    }
    case 'morningstar': {
      const b = add(new THREE.Mesh(new THREE.SphereGeometry(0.7, 6, 5), mat));
      b.position.z = 0.6;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const sp = add(new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.8, 4), dark));
        sp.position.set(Math.cos(a) * 0.75, Math.sin(a) * 0.75, 0.6);
        sp.rotation.z = a - Math.PI / 2;
      }
      break;
    }
    case 'scorpion': {
      const a = add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.8, 5), mat));
      a.rotation.x = Math.PI / 2 - 0.9; a.position.set(0, 0.7, 0.7);
      const st = add(new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.2, 5), dark));
      st.rotation.x = Math.PI + 0.4; st.position.set(0, 1.9, 0.4);
      break;
    }
    case 'feather': {
      for (let i = -3; i <= 3; i++) {
        const f = add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 2.2), mat));
        f.position.set(i * 0.25, 0, 1.0); f.rotation.y = i * 0.12;
      }
      break;
    }
  }
  return g;
}

/** Procedural dragon. Faces -Z (head at -Z, tail at +Z). Body length ~9 * size. */
export function createDragon(spec: DragonSpec): Dragon {
  const root = new THREE.Group();
  const g = new THREE.Group();
  g.scale.setScalar(spec.size);
  root.add(g);
  const mat = new THREE.MeshStandardMaterial({ color: spec.color, flatShading: true, roughness: 0.7 });
  const dark = new THREE.MeshStandardMaterial({ color: new THREE.Color(spec.color).multiplyScalar(0.55), flatShading: true });
  const wingMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(spec.color).multiplyScalar(0.8), flatShading: true, side: THREE.DoubleSide });
  const add = (m: THREE.Mesh, parent: THREE.Object3D = g) => { m.castShadow = true; parent.add(m); return m; };

  const body = add(new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), mat));
  body.scale.set(1.2, 1.1, 3);
  const neck = add(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, 2.6, 6), mat));
  neck.rotation.x = -0.9; neck.position.set(0, 1.0, -3.2);
  const head = add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 1.5), mat));
  head.position.set(0, 2.3, -4.4);
  const snout = add(new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.1, 5), mat));
  snout.rotation.x = -Math.PI / 2; snout.position.set(0, 2.2, -5.4);
  for (const s of [-1, 1]) {
    const horn = add(new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.9, 4), dark));
    horn.rotation.x = 0.9; horn.position.set(s * 0.35, 2.8, -3.9);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 3), new THREE.MeshBasicMaterial({ color: 0xffb030 }));
    eye.position.set(s * 0.46, 2.45, -4.8); g.add(eye);
    for (const z of [-1.3, 1.5]) {
      const leg = add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.5), dark));
      leg.position.set(s * 0.9, -0.9, z);
    }
  }

  const wings: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.9, 0.9, -0.6);
    const w = new THREE.Mesh(wingGeometry(s), wingMat);
    w.castShadow = true;
    pivot.add(w);
    // wing bone
    const bone = add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 7, 4), dark), pivot);
    bone.rotation.z = s * -Math.PI / 2 + s * 0.08; bone.position.set(s * 3.5, 0.3, -2.0);
    g.add(pivot);
    wings.push(pivot);
  }

  // tail: chain of segments
  const segs: THREE.Group[] = [];
  let parent: THREE.Object3D = g;
  let z = 2.8;
  for (let i = 0; i < 9; i++) {
    const seg = new THREE.Group();
    seg.position.z = z;
    const r = 0.62 * (1 - i / 11);
    const m = add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, 1.2, 5), mat), seg);
    m.rotation.x = Math.PI / 2; m.position.z = 0.6;
    parent.add(seg);
    segs.push(seg);
    parent = seg;
    z = 1.2;
  }
  parent.add(Object.assign(tailEnd(spec.tail, mat, dark), {}));
  (parent.children[parent.children.length - 1] as THREE.Object3D).position.z = 1.2;

  return {
    group: root,
    update(t: number, amount = 1) {
      const flap = Math.sin(t * 2.2) * 0.45 * amount + (1 - amount) * 1.1;
      wings[0].rotation.z = flap; wings[1].rotation.z = -flap;
      segs.forEach((s, i) => { s.rotation.y = Math.sin(t * 1.5 - i * 0.5) * 0.1; });
      g.position.y = Math.sin(t * 2.2) * 0.25 * amount;
    },
  };
}
