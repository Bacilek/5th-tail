import * as THREE from 'three';
import { addBox } from './collision';
import { pbr, pbrRepeat, tileBoxUV } from '../engine/textures';
import {
  PLATEAU, COLLEGE, HEALERS, INFANTRY, SCRIBE, SCRIBE_Y, CITADEL, CITADEL_Y, TOWER, PARAPET, type Rect,
} from './terrain';

const stone = pbr('castle_brick_07', 0xa9adb8);
const darkStone = pbr('castle_brick_07', 0x70747f);
const roofMat = pbrRepeat('grey_roof_tiles', 0x5a6078, 5, 3);
const wood = pbr('dark_planks', 0x9a7a5a);

export function makeLabel(text: string, color = '#ffffff', w = 16): THREE.Sprite {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 96;
  const g = cv.getContext('2d')!;
  g.font = 'bold 40px Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,0.85)'; g.strokeText(text, 256, 48);
  g.fillStyle = color; g.fillText(text, 256, 48);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthWrite: false, fog: false }));
  s.scale.set(w, w * 96 / 512, 1);
  return s;
}

/** Box standing on ground level y (extends 6 m below to hide terrain seams). */
function block(g: THREE.Group, cx: number, cz: number, w: number, d: number, h: number, y: number, mat: THREE.Material = stone): THREE.Mesh {
  const full = h + 6;
  const geo = new THREE.BoxGeometry(w, full, d);
  if ((mat as THREE.MeshStandardMaterial).map) tileBoxUV(geo, w, full, d, 4);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(cx, y - 6 + full / 2, cz);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  addBox(cx, cz, w, d, y + h);
  return m;
}

function tower(g: THREE.Group, cx: number, cz: number, r: number, h: number, y: number): void {
  const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, h + 6, 8), stone);
  t.position.set(cx, y + h / 2 - 3, cz);
  t.castShadow = t.receiveShadow = true;
  g.add(t);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r, 2, 8), darkStone);
  top.position.set(cx, y + h + 0.5, cz); top.castShadow = true;
  g.add(top);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(r * 1.25, h * 0.35, 8), roofMat);
  roof.position.set(cx, y + h + 1.5 + h * 0.175, cz); roof.castShadow = true;
  g.add(roof);
  addBox(cx, cz, r * 1.8, r * 1.8, y + h);
  addBox(cx, cz, r * 1.8, r * 1.8, y + h + 1.5 + h * 0.3, y + h); // cone roof (box approximation, fliers only)
}

export function banner(g: THREE.Group, x: number, y: number, z: number, color: number, rotY = 0, h = 6): void {
  const b = new THREE.Mesh(new THREE.PlaneGeometry(2, h), new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, flatShading: true }));
  b.position.set(x, y, z); b.rotation.y = rotY;
  g.add(b);
}

export function floorRect(g: THREE.Group, r: Rect, y: number, color: number): void {
  floor(g, r, y, color);
}

function floor(g: THREE.Group, r: Rect, y: number, color: number): void {
  const fg = new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0);
  const fuv = fg.attributes.uv;
  for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) * (r.x1 - r.x0) / 5, fuv.getY(i) * (r.z1 - r.z0) / 5);
  const f = new THREE.Mesh(fg, pbr('cobblestone_floor_04', color, 1));
  f.rotation.x = -Math.PI / 2; f.position.set((r.x0 + r.x1) / 2, y + 0.03, (r.z0 + r.z1) / 2); f.receiveShadow = true;
  g.add(f);
}

/** Wall along an axis with gaps. axis 'x': line runs along x at z=fixed; gaps are [from,to] ranges along the axis. */
function wallLine(g: THREE.Group, axis: 'x' | 'z', fixed: number, a: number, b: number, gaps: [number, number][], T: number, H: number, y: number, mat: THREE.Material = stone): void {
  const seg = (s0: number, s1: number) => {
    if (s1 - s0 < 0.1) return;
    const mid = (s0 + s1) / 2, len = s1 - s0;
    if (axis === 'x') block(g, mid, fixed, len, T, H, y, mat); else block(g, fixed, mid, T, len, H, y, mat);
  };
  let cur = a;
  for (const [g0, g1] of [...gaps].sort((p, q) => p[0] - q[0])) { seg(cur, g0); cur = g1; }
  seg(cur, b);
}

function ring(g: THREE.Group, r: Rect, y: number, T: number, H: number, gaps: { n?: [number, number][]; s?: [number, number][]; w?: [number, number][]; e?: [number, number][] } = {}, mat: THREE.Material = stone): void {
  wallLine(g, 'x', r.z0, r.x0, r.x1, gaps.n ?? [], T, H, y, mat);
  wallLine(g, 'x', r.z1, r.x0, r.x1, gaps.s ?? [], T, H, y, mat);
  wallLine(g, 'z', r.x0, r.z0, r.z1, gaps.w ?? [], T, H, y, mat);
  wallLine(g, 'z', r.x1, r.z0, r.z1, gaps.e ?? [], T, H, y, mat);
}

type Door = 'n' | 's' | 'e' | 'w';
type Kind = 'table' | 'bunks' | 'cots' | 'shelves' | 'none';

const lantern = new THREE.MeshBasicMaterial({ color: 0xffc070 });
const cloth = new THREE.MeshStandardMaterial({ color: 0x8a3a30, flatShading: true });
const linen = new THREE.MeshStandardMaterial({ color: 0xc9c2b0, flatShading: true });
const bookMat = new THREE.MeshStandardMaterial({ color: 0x5a3a28, flatShading: true });

export function prop(g: THREE.Group, cx: number, cz: number, w: number, d: number, h: number, y: number, mat: THREE.Material, solid = true): void {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(cx, y + h / 2, cz); m.castShadow = m.receiveShadow = true; g.add(m);
  if (solid) addBox(cx, cz, w, d, y + h);
}

/** Enterable building: hollow walls with a 4.4 m door, visual roof slab, simple furniture. The roof has no collider. */
export function hall(g: THREE.Group, cx: number, cz: number, w: number, d: number, h: number, y: number, roofH: number, door: Door = 's', kind: Kind = 'table', mat: THREE.Material = stone): void {
  const r: Rect = { x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2 };
  const gx: [number, number][] = [[cx - 2.2, cx + 2.2]], gz: [number, number][] = [[cz - 2.2, cz + 2.2]];
  ring(g, r, y, 1.2, h, { n: door === 'n' ? gx : [], s: door === 's' ? gx : [], w: door === 'w' ? gz : [], e: door === 'e' ? gz : [] }, mat);
  floor(g, r, y, 0x5a4a3c);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 0.7, d + 1), darkStone);
  slab.position.set(cx, y + h + 0.35, cz); slab.castShadow = true; g.add(slab);
  addBox(cx, cz, w + 1, d + 1, y + h + 0.7 + roofH * 0.5, y + h); // roof volume above the walls
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, roofH, 4), roofMat);
  roof.rotation.y = Math.PI / 4; roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
  roof.position.set(cx, y + h + 0.7 + roofH / 2, cz); roof.castShadow = true; g.add(roof);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 5), lantern);
  lamp.position.set(cx, y + h - 1.2, cz); g.add(lamp);
  // furniture in the half opposite the door, along the long axis
  const dir = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] }[door];
  const fx = cx + dir[0] * w * 0.22, fz = cz + dir[1] * d * 0.22;
  const alongX = Math.abs(dir[0]) < 0.5; // door on n/s => spread furniture along x
  const span = (alongX ? w : d) * 0.6;
  const put = (t: number, ww: number, dd: number, hh: number, m: THREE.Material) =>
    prop(g, alongX ? fx + t : fx, alongX ? fz : fz + t, ww, dd, hh, y, m);
  if (kind === 'table') {
    put(0, alongX ? Math.min(8, span) : 1.6, alongX ? 1.6 : Math.min(8, span), 0.9, wood);
  } else if (kind === 'bunks') {
    for (let i = -1; i <= 1; i++) put(i * span / 3, alongX ? 2.2 : 3.6, alongX ? 3.6 : 2.2, 1.4, cloth);
  } else if (kind === 'cots') {
    for (let i = -1; i <= 1; i++) put(i * span / 3, alongX ? 1.6 : 3, alongX ? 3 : 1.6, 0.6, linen);
  } else if (kind === 'shelves') {
    for (let i = -2; i <= 2; i++) put(i * span / 4, alongX ? 0.9 : 5, alongX ? 5 : 0.9, 2.6, bookMat);
  }
}

export function torch(g: THREE.Group, x: number, y: number, z: number): void {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2.4, 5), darkStone);
  post.position.set(x, y + 1.2, z); post.castShadow = true; g.add(post);
  const f = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 5), new THREE.MeshBasicMaterial({ color: 0xffa040 }));
  f.position.set(x, y + 2.8, z); g.add(f);
}

export function label(g: THREE.Group, text: string, color: string, x: number, y: number, z: number, w = 16): void {
  const l = makeLabel(text, color, w); l.position.set(x, y, z); g.add(l);
}

/** Lower college: administrative courtyard + Conscription Tower (start of the Parapet). */
export function buildCollege(): THREE.Group {
  const g = new THREE.Group();
  const { x0, x1, z0, z1 } = COLLEGE;
  const Y = PLATEAU, H = 14, T = 3;
  floor(g, COLLEGE, Y, 0x5d5f66);
  // gates: south (to Healers), north (to Infantry), west tunnel (to Scribes/Archives)
  ring(g, COLLEGE, Y, T, H, { s: [[-6, 6]], n: [[-6, 6]], w: [[-16, -4]] });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(13, 4, T + 1), darkStone);
  lintel.position.set(0, Y + H - 1, z1); g.add(lintel);
  const lintelN = lintel.clone(); lintelN.position.set(0, Y + H - 1, z0); g.add(lintelN);

  for (const [tx, tz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) tower(g, tx, tz, 5, 26, Y);
  tower(g, -10, z1, 3.5, 22, Y); tower(g, 10, z1, 3.5, 22, Y);
  tower(g, -10, z0, 4, 36, Y); tower(g, 10, z0, 4, 30, Y); // northern turret

  // administrative keep
  hall(g, 0, -32, 26, 22, 22, Y, 0.01, 's', 'table');
  const donjon = new THREE.Mesh(new THREE.BoxGeometry(16, 36, 14), darkStone);
  donjon.position.set(0, Y + 22 + 18, -32); donjon.castShadow = true; g.add(donjon);
  addBox(0, -32, 16, 14, Y + 58, Y + 22);
  const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(11, 14, 4), roofMat);
  keepRoof.rotation.y = Math.PI / 4; keepRoof.position.set(0, Y + 58 + 7, -32); keepRoof.castShadow = true; g.add(keepRoof);
  label(g, 'Basgiath War College', '#ffe9b0', 0, Y + 82, -32, 34);
  label(g, 'Administration', '#d8d8e8', 0, Y + 27, -19, 12);

  // Conscription Tower: tall, open platform on top = start of the Parapet
  const tw = new THREE.Mesh(new THREE.CylinderGeometry(TOWER.r - 0.4, TOWER.r + 1, TOWER.top - Y + 6, 10), stone);
  tw.position.set(TOWER.x, Y - 6 + (TOWER.top - Y + 6) / 2, TOWER.z); tw.castShadow = tw.receiveShadow = true; g.add(tw);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(TOWER.r * 0.9, TOWER.r - 0.4, 1.2, 10), darkStone);
  cap.position.set(TOWER.x, TOWER.top - 0.6, TOWER.z); cap.castShadow = true; g.add(cap);
  addBox(TOWER.x, TOWER.z, 8.5, 8.5, TOWER.top);
  label(g, 'Conscription Tower', '#ffd98a', TOWER.x, TOWER.top + 10, TOWER.z, 20);
  banner(g, TOWER.x - 5.2, TOWER.top - 8, TOWER.z, 0xa02a20, Math.PI / 2, 12);

  // assembly square markings (Conscription Day) with torches
  for (const sx of [-1, 1]) {
    for (const tz of [30, 20, 10]) torch(g, sx * 9, Y, tz);
    const l = new THREE.PointLight(0xff9040, 60, 30, 1.6); l.position.set(sx * 9, Y + 3.2, 20); g.add(l);
  }
  label(g, 'Conscription Day', '#ffe9b0', 0, Y + 12, 8, 20);
  label(g, 'North: Infantry', '#ffd98a', 0, Y + 9, -58, 12);
  label(g, 'South: Healers', '#9fe3b5', 0, Y + 9, 33, 12);
  label(g, 'West tunnel: Scribes & Archives', '#c9a8ff', -48, Y + 9, -10, 18);
  return g;
}

export function buildHealers(): THREE.Group {
  const g = new THREE.Group();
  const Y = PLATEAU;
  floor(g, HEALERS, Y, 0x4d5a48);
  ring(g, HEALERS, Y, 2, 6, { n: [[-6, 6]] });
  hall(g, 0, 78, 30, 16, 9, Y, 7, 'n', 'cots');
  hall(g, -26, 62, 10, 8, 6, Y, 4, 'e', 'cots'); hall(g, 26, 62, 10, 8, 6, Y, 4, 'w', 'table');
  const bed = new THREE.MeshStandardMaterial({ color: 0x2f7a42, flatShading: true });
  for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 2), bed);
    b.position.set(sx * 18, Y + 0.25, 86 + i * 3.4); g.add(b);
  }
  banner(g, -6, Y + 6, 85.2, 0x2f8a52); banner(g, 6, Y + 6, 85.2, 0x2f8a52);
  label(g, 'Healer Quadrant', '#9fe3b5', 0, Y + 20, 78, 22);
  torch(g, -4, Y, 50); torch(g, 4, Y, 50);
  return g;
}

export function buildInfantry(): THREE.Group {
  const g = new THREE.Group();
  const Y = PLATEAU;
  floor(g, INFANTRY, Y, 0x6a5f4a);
  ring(g, INFANTRY, Y, 3, 7, { s: [[-6, 6]] });
  for (const x of [-30, 0, 30]) hall(g, x, -112, 24, 10, 7, Y, 4, 's', 'bunks');
  hall(g, -36, -90, 14, 10, 7, Y, 4, 's', 'table'); hall(g, 36, -90, 14, 10, 7, Y, 4, 's', 'table');
  tower(g, -48, -72, 4, 24, Y); tower(g, 48, -72, 4, 24, Y); tower(g, -48, -124, 4, 24, Y); tower(g, 48, -124, 4, 24, Y);
  // parade ground training dummies
  for (let i = 0; i < 8; i++) {
    const x = -21 + i * 6;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.8, 6), wood);
    post.position.set(x, Y + 0.9, -96); post.castShadow = true; g.add(post);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 0.2), wood);
    arm.position.set(x, Y + 1.5, -96); g.add(arm);
  }
  banner(g, -6, Y + 7, -71, 0x8a6a2a); banner(g, 6, Y + 7, -71, 0x8a6a2a);
  label(g, 'Infantry Quadrant', '#ffd98a', 0, Y + 22, -100, 24);
  torch(g, -4, Y, -70); torch(g, 4, Y, -70);
  return g;
}

export function buildScribes(): THREE.Group {
  const g = new THREE.Group();
  const Y = SCRIBE_Y;
  floor(g, SCRIBE, Y, 0x4a4658);
  ring(g, SCRIBE, Y, 2, 7, { e: [[-16, -4]] });
  // Archives: big hall with columns and a dark arched door
  hall(g, -100, -34, 34, 14, 11, Y, 0.01, 's', 'shelves', darkStone);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.5, 34, 8, 1, false, 0, Math.PI), roofMat);
  roof.rotation.z = Math.PI / 2; roof.rotation.x = 0; roof.position.set(-100, Y + 11, -34); roof.castShadow = true; g.add(roof);
  addBox(-100, -34, 34, 14, Y + 11 + 7, Y + 11);
  for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 9, 6), stone);
    c.position.set(-100 + sx * (4 + i * 2.8), Y + 4.5, -26); c.castShadow = true; g.add(c);
  }
  hall(g, -82, -14, 14, 10, 7, Y, 4, 'n', 'shelves'); hall(g, -118, -14, 14, 10, 7, Y, 4, 'n', 'shelves');
  banner(g, -104, Y + 7, -26.6, 0x6a3fa0); banner(g, -96, Y + 7, -26.6, 0x6a3fa0);
  label(g, 'Scribe Quadrant & Archives', '#c9a8ff', -100, Y + 22, -34, 26);
  torch(g, -76, Y, -17); torch(g, -76, Y, -3);
  return g;
}

/** Riders Quadrant: the Citadel on the ridge. The Parapet ends at its western wall. */
export function buildCitadel(): THREE.Group {
  const g = new THREE.Group();
  const Y = CITADEL_Y;
  floor(g, CITADEL, Y, 0x585a64);
  // walls ~3 m thick, 2.5 m tall (10 ft x 8 ft); gap where the Parapet lands
  ring(g, CITADEL, Y, 3, 2.5, { w: [[PARAPET.z - 3, PARAPET.z + 3]], e: [[-30, -14]] }, darkStone);
  hall(g, 112, -34, 24, 16, 14, Y, 9, 's', 'table');
  hall(g, 104, 0, 16, 10, 9, Y, 5, 'n', 'bunks');
  tower(g, CITADEL.x0 + 2, CITADEL.z0 + 2, 4, 16, Y); tower(g, CITADEL.x1 - 2, CITADEL.z0 + 2, 4, 16, Y);
  tower(g, CITADEL.x0 + 2, CITADEL.z1 - 2, 4, 16, Y); tower(g, CITADEL.x1 - 2, CITADEL.z1 - 2, 4, 16, Y);
  banner(g, 112, Y + 8, -25.3, 0xa02a20, 0, 8);
    // (the Gauntlet corridor and Flight Field are built in systems/gauntlet.ts and buildFlightField)
  label(g, 'Riders Quadrant - the Citadel', '#ff9a8a', 112, Y + 28, -34, 28);
  label(g, 'The Gauntlet', '#ffd98a', 140, Y + 14, -22, 14);
  torch(g, 96, Y, PARAPET.z - 4); torch(g, 96, Y, PARAPET.z + 4);
  return g;
}

export function buildParapet(): THREE.Group {
  const g = new THREE.Group();
  const len = PARAPET.x1 - PARAPET.x0;
  const spanGeo = new THREE.BoxGeometry(len, 0.6, PARAPET.half * 2);
  tileBoxUV(spanGeo, len, 0.6, PARAPET.half * 2, 4);
  const span = new THREE.Mesh(spanGeo, darkStone);
  span.position.set((PARAPET.x0 + PARAPET.x1) / 2, PARAPET.y - 0.3, PARAPET.z);
  span.castShadow = span.receiveShadow = true;
  g.add(span);
  addBox((PARAPET.x0 + PARAPET.x1) / 2, PARAPET.z, len, PARAPET.half * 2, PARAPET.y, PARAPET.y - 0.6);
  label(g, 'The Parapet', '#ffd98a', 66, PARAPET.y + 8, PARAPET.z, 18);
  return g;
}
