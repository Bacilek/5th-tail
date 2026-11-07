import * as THREE from 'three';
import { addBox } from './collision';
import { PLATEAU, COLLEGE, PARAPET_Z0, PARAPET_Z1, PARAPET_HALF_W, RAVINE_Z0, RAVINE_Z1 } from './terrain';

const stone = new THREE.MeshStandardMaterial({ color: 0x6b6f78, flatShading: true, roughness: 0.95 });
const darkStone = new THREE.MeshStandardMaterial({ color: 0x4a4d57, flatShading: true, roughness: 0.95 });
const roofMat = new THREE.MeshStandardMaterial({ color: 0x23283f, flatShading: true });
const BOT = PLATEAU - 6;

export function makeLabel(text: string, color = '#ffffff'): THREE.Sprite {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 96;
  const g = cv.getContext('2d')!;
  g.font = 'bold 44px Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,0.85)'; g.strokeText(text, 256, 48);
  g.fillStyle = color; g.fillText(text, 256, 48);
  const tex = new THREE.CanvasTexture(cv);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, fog: false }));
  s.scale.set(16, 3, 1);
  return s;
}

function block(g: THREE.Group, cx: number, cz: number, w: number, d: number, h: number, mat = stone): THREE.Mesh {
  const full = h + (PLATEAU - BOT);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, full, d), mat);
  m.position.set(cx, BOT + full / 2, cz);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  addBox(cx, cz, w, d, PLATEAU + h);
  return m;
}

function tower(g: THREE.Group, cx: number, cz: number, r: number, h: number): void {
  const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, h + 6, 8), stone);
  t.position.set(cx, PLATEAU + h / 2 - 3, cz);
  t.castShadow = t.receiveShadow = true;
  g.add(t);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r, 2, 8), darkStone);
  top.position.set(cx, PLATEAU + h + 0.5, cz); top.castShadow = true;
  g.add(top);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(r * 1.25, h * 0.35, 8), roofMat);
  roof.position.set(cx, PLATEAU + h + 1.5 + h * 0.175, cz); roof.castShadow = true;
  g.add(roof);
  addBox(cx, cz, r * 1.8, r * 1.8, PLATEAU + h);
}

function banner(g: THREE.Group, x: number, y: number, z: number, color: number): void {
  const b = new THREE.Mesh(new THREE.PlaneGeometry(2, 6), new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, flatShading: true }));
  b.position.set(x, y, z);
  g.add(b);
}

export function buildCollege(): THREE.Group {
  const g = new THREE.Group();
  const { x0, x1, z0, z1 } = COLLEGE;
  const W = x1 - x0, T = 3, H = 14;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, z1 - z0), new THREE.MeshStandardMaterial({ color: 0x5d5f66, flatShading: true, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(cx, PLATEAU + 0.03, cz); floor.receiveShadow = true;
  g.add(floor);

  // walls (gate gap in south wall)
  block(g, cx, z0, W, T, H);
  block(g, x0, cz, T, z1 - z0, H);
  block(g, x1, cz, T, z1 - z0, H);
  const gate = 6;
  block(g, x0 + (cx - gate - x0) / 2, z1, cx - gate - x0, T, H);
  block(g, x1 - (x1 - cx - gate) / 2, z1, x1 - cx - gate, T, H);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(gate * 2 + 1, 4, T + 1), darkStone);
  lintel.position.set(cx, PLATEAU + H - 1, z1); lintel.castShadow = true; g.add(lintel);

  tower(g, x0, z0, 5, 28); tower(g, x1, z0, 5, 28);
  tower(g, x0, z1, 5, 24); tower(g, x1, z1, 5, 24);
  tower(g, -gate - 4, z1, 3.5, 22); tower(g, gate + 4, z1, 3.5, 22);

  // central keep
  block(g, 0, -32, 26, 22, 22, stone);
  block(g, 0, -32, 16, 14, 36, darkStone);
  const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(11, 14, 4), roofMat);
  keepRoof.rotation.y = Math.PI / 4; keepRoof.position.set(0, PLATEAU + 36 + 7, -32); keepRoof.castShadow = true; g.add(keepRoof);
  for (const [tx, tz] of [[-14, -22], [14, -22], [-14, -42], [14, -42]]) tower(g, tx, tz, 3, 30);

  // quadrant halls
  const halls: [string, number, number, number, string][] = [
    ['Riders Quadrant', -30, -2, 0xa02a20, '#ff9a8a'],
    ['Scribe Quadrant', 30, -2, 0x6a3fa0, '#c9a8ff'],
    ['Healer Quadrant', -32, -52, 0x2f8a52, '#9fe3b5'],
    ['Infantry Quadrant', 32, -52, 0x8a6a2a, '#ffd98a'],
  ];
  for (const [name, hx, hz, col, lc] of halls) {
    block(g, hx, hz, 16, 13, 10, stone);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(11.5, 6, 4), roofMat);
    roof.rotation.y = Math.PI / 4; roof.position.set(hx, PLATEAU + 13, hz); roof.scale.set(1, 1, 0.85); roof.castShadow = true; g.add(roof);
    banner(g, hx, PLATEAU + 6, hz + 6.6, col);
    const lab = makeLabel(name, lc); lab.position.set(hx, PLATEAU + 24, hz); g.add(lab);
  }
  const keepLab = makeLabel('Basgiath War College', '#ffe9b0'); keepLab.position.set(0, PLATEAU + 66, -32); keepLab.scale.set(30, 5.6, 1); g.add(keepLab);

  banner(g, -gate - 0.2, PLATEAU + 8, z1 + 2, 0xa02a20);
  banner(g, gate + 0.2, PLATEAU + 8, z1 + 2, 0xa02a20);

  // torches along the entry path
  const flame = new THREE.MeshBasicMaterial({ color: 0xffa040 });
  for (const sx of [-1, 1]) {
    for (const tz of [30, 20, 10]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2.4, 5), darkStone);
      post.position.set(sx * 7, PLATEAU + 1.2, tz); post.castShadow = true; g.add(post);
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 5), flame);
      f.position.set(sx * 7, PLATEAU + 2.8, tz); g.add(f);
    }
    const l = new THREE.PointLight(0xff9040, 60, 30, 1.6); l.position.set(sx * 7, PLATEAU + 3.2, 25); g.add(l);
  }
  return g;
}

export function buildParapet(): THREE.Group {
  const g = new THREE.Group();
  const len = PARAPET_Z1 - PARAPET_Z0;
  const span = new THREE.Mesh(new THREE.BoxGeometry(PARAPET_HALF_W * 2, 0.6, len), darkStone);
  span.position.set(0, PLATEAU - 0.3, (PARAPET_Z0 + PARAPET_Z1) / 2);
  span.castShadow = span.receiveShadow = true;
  g.add(span);
  for (let z = RAVINE_Z0 + 4; z < RAVINE_Z1 - 2; z += 7) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(1.2, 14, 5), darkStone);
    spike.rotation.x = Math.PI; spike.position.set(0, PLATEAU - 7.5, z);
    g.add(spike);
  }
  const lab = makeLabel('The Parapet', '#ffd98a'); lab.position.set(0, PLATEAU + 9, 55); g.add(lab);
  return g;
}
