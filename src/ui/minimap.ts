import { heightAt, MAP_HALF, COLLEGE, HEALERS, INFANTRY, SCRIBE, CITADEL, FIELD, VILLAGE, CAMP, GAUNTLET, type Rect } from '../world/terrain';
import { POIS, POI_COLORS } from '../data/pois';

const CSS = `
#mm{position:fixed;right:14px;top:12px;width:168px;z-index:3;pointer-events:none;font-family:Georgia,serif;color:#f0e6d0;text-shadow:0 1px 3px #000;text-align:center}
#mm canvas{width:168px;height:168px;border-radius:50%;border:2px solid #d8c9a0cc;background:#0b0a10;box-shadow:0 0 12px #000a}
#mm div{font-size:13px;margin-top:3px}
#map{position:fixed;inset:0;background:#000d;display:none;flex-direction:column;align-items:center;justify-content:center;z-index:7;font-family:Georgia,serif;color:#f0e6d0}
#map h2{margin:0 0 8px;letter-spacing:3px}
#map canvas{border:2px solid #d8c9a0cc;cursor:crosshair;background:#0b0a10}
#map p{margin:8px 0 0;font-size:14px;opacity:.8}
`;

const RES = 2;                                  // metres per pixel of the terrain image
const SIZE = Math.round((MAP_HALF * 2) / RES);  // terrain image size in px
const VIEW = 85;                                // minimap radius in metres

export interface Marker { x: number; z: number; kind: 'give' | 'turnin'; }

/** Renders the terrain once to an offscreen canvas (colour by height + campus floors). */
function renderTerrain(): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = cv.height = SIZE;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(SIZE, SIZE);
  for (let j = 0; j < SIZE; j++) for (let i = 0; i < SIZE; i++) {
    const x = i * RES - MAP_HALF, z = j * RES - MAP_HALF;
    const h = heightAt(x, z);
    const slope = heightAt(x + 3, z) - h + (heightAt(x, z + 3) - h) * 0.5;
    let r: number, gg: number, b: number;
    if (h > 110) { r = 232; gg = 236; b = 242; }
    else if (h > 70) { const t = (h - 70) / 40; r = 110 + t * 120; gg = 110 + t * 120; b = 118 + t * 120; }
    else if (h > 30) { const t = (h - 30) / 40; r = 70 + t * 40; gg = 94 + t * 16; b = 62 + t * 56; }
    else { r = 62; gg = 98; b = 52; }
    const shade = 1 + Math.max(-0.3, Math.min(0.3, slope * 0.05));
    const o = (j * SIZE + i) * 4;
    img.data[o] = Math.min(255, r * shade); img.data[o + 1] = Math.min(255, gg * shade); img.data[o + 2] = Math.min(255, b * shade); img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const fill = (r: Rect, col: string) => {
    g.fillStyle = col;
    g.fillRect((r.x0 + MAP_HALF) / RES, (r.z0 + MAP_HALF) / RES, (r.x1 - r.x0) / RES, (r.z1 - r.z0) / RES);
  };
  fill(COLLEGE, '#6a6c74'); fill(HEALERS, '#5a7a58'); fill(INFANTRY, '#7a6c52'); fill(SCRIBE, '#5a5470');
  fill(CITADEL, '#8a6a64'); fill(FIELD, '#7a8a50'); fill(VILLAGE, '#7a6a4c'); fill(CAMP, '#4a3a38'); fill(GAUNTLET, '#8a7a68');
  // Parapet
  g.fillStyle = '#e8d8a0';
  g.fillRect((43 + MAP_HALF) / RES, (-20.6 + MAP_HALF) / RES, 49 / RES, 1.5);
  return cv;
}

/** Heading-up minimap (top right) and full-screen world map (M) with a user waypoint. */
export class Minimap {
  private mm: HTMLCanvasElement;
  private mmCtx: CanvasRenderingContext2D;
  private info: HTMLElement;
  private box: HTMLElement;
  private mapEl: HTMLElement;
  private mapCv: HTMLCanvasElement;
  private terrain: HTMLCanvasElement;
  mapOpen = false;
  waypoint: { x: number; z: number } | null = null;
  onWaypoint: (w: { x: number; z: number } | null) => void = () => {};
  onToggle: (open: boolean) => void = () => {};
  clock = '';
  private lastPlayer = { x: 0, z: 0, yaw: 0 };
  private lastMarkers: Marker[] = [];

  constructor() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    this.terrain = renderTerrain();

    const box = document.createElement('div');
    box.id = 'mm';
    box.style.display = 'none';
    this.box = box;
    this.mm = document.createElement('canvas');
    this.mm.width = this.mm.height = 336; // 2x for crisp rendering
    this.info = document.createElement('div');
    box.append(this.mm, this.info);
    document.body.appendChild(box);
    this.mmCtx = this.mm.getContext('2d')!;

    this.mapEl = document.createElement('div');
    this.mapEl.id = 'map';
    this.mapEl.innerHTML = '<h2>MAP OF BASGIATH</h2>';
    this.mapCv = document.createElement('canvas');
    const side = Math.floor(Math.min(innerWidth * 0.9, innerHeight * 0.78));
    this.mapCv.width = this.mapCv.height = side;
    const hint = document.createElement('p');
    hint.textContent = 'Left click: set waypoint  -  Right click: clear waypoint  -  M / Esc: close';
    this.mapEl.append(this.mapCv, hint);
    document.body.appendChild(this.mapEl);

    this.mapCv.addEventListener('click', (e) => {
      const r = this.mapCv.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * MAP_HALF * 2 - MAP_HALF;
      const z = ((e.clientY - r.top) / r.height) * MAP_HALF * 2 - MAP_HALF;
      this.waypoint = { x, z };
      this.onWaypoint(this.waypoint);
      this.drawMap();
    });
    this.mapCv.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.waypoint = null;
      this.onWaypoint(null);
      this.drawMap();
    });
    addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.mapOpen) this.toggle(false);
    });
  }

  show(): void { this.box.style.display = ''; }

  toggle(open = !this.mapOpen): void {
    this.mapOpen = open;
    this.mapEl.style.display = open ? 'flex' : 'none';
    if (open) { document.exitPointerLock?.(); this.drawMap(); }
    this.onToggle(open);
  }

  /** Minimap projection: world -> canvas px (heading-up). */
  private proj(x: number, z: number, p: { x: number; z: number; yaw: number }, c: number, k: number): [number, number] {
    const dx = x - p.x, dz = z - p.z, cs = Math.cos(p.yaw), sn = Math.sin(p.yaw);
    return [c + k * (dx * cs - dz * sn), c + k * (dx * sn + dz * cs)];
  }

  update(p: { x: number; z: number; yaw: number }, markers: Marker[]): void {
    this.lastPlayer = { ...p }; this.lastMarkers = markers;
    const g = this.mmCtx, S = this.mm.width, c = S / 2, k = c / VIEW;
    g.save();
    g.clearRect(0, 0, S, S);
    g.beginPath(); g.arc(c, c, c - 2, 0, Math.PI * 2); g.clip();
    // terrain image mapped through the rotation (see derivation in docs: image px -> screen px)
    const cs = Math.cos(p.yaw), sn = Math.sin(p.yaw);
    const ox = MAP_HALF + p.x, oz = MAP_HALF + p.z;
    g.setTransform(2 * k * cs * RES / 2, 2 * k * sn * RES / 2, -2 * k * sn * RES / 2, 2 * k * cs * RES / 2,
      c + k * (-cs * ox + sn * oz), c + k * (-sn * ox - cs * oz));
    g.drawImage(this.terrain, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);

    // points of interest
    g.font = 'bold 20px Georgia, serif'; g.textAlign = 'center';
    for (const poi of POIS) {
      const [sx, sy] = this.proj(poi.x, poi.z, p, c, k);
      if (Math.hypot(sx - c, sy - c) > c - 10) continue;
      g.fillStyle = POI_COLORS[poi.kind];
      g.strokeStyle = '#000'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(sx, sy - 9); g.lineTo(sx + 8, sy + 7); g.lineTo(sx - 8, sy + 7); g.closePath(); g.stroke(); g.fill();
    }
    // quest markers
    for (const m of markers) {
      const [sx, sy] = this.proj(m.x, m.z, p, c, k);
      if (Math.hypot(sx - c, sy - c) > c - 12) continue;
      g.fillStyle = m.kind === 'give' ? '#ffe040' : '#60e060';
      g.strokeStyle = '#000'; g.lineWidth = 4;
      g.strokeText(m.kind === 'give' ? '!' : '?', sx, sy + 7); g.fillText(m.kind === 'give' ? '!' : '?', sx, sy + 7);
    }
    // waypoint (edge arrow when outside the circle)
    if (this.waypoint) {
      let [sx, sy] = this.proj(this.waypoint.x, this.waypoint.z, p, c, k);
      const d = Math.hypot(sx - c, sy - c), lim = c - 14;
      if (d > lim) { sx = c + ((sx - c) / d) * lim; sy = c + ((sy - c) / d) * lim; }
      g.fillStyle = '#ff40c0'; g.strokeStyle = '#fff'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(sx, sy - 12); g.lineTo(sx + 8, sy); g.lineTo(sx, sy + 12); g.lineTo(sx - 8, sy); g.closePath(); g.stroke(); g.fill();
    }
    // player arrow (always up)
    g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(c, c - 13); g.lineTo(c + 9, c + 10); g.lineTo(c, c + 5); g.lineTo(c - 9, c + 10); g.closePath(); g.stroke(); g.fill();
    g.restore();
    // north marker on the rim
    const [nx, ny] = this.proj(p.x, p.z - 1000, p, c, 1);
    const nl = Math.hypot(nx - c, ny - c) || 1;
    const rx = c + ((nx - c) / nl) * (c - 18), ry = c + ((ny - c) / nl) * (c - 18);
    g.fillStyle = '#ffd98a'; g.strokeStyle = '#000'; g.lineWidth = 4; g.font = 'bold 24px Georgia, serif'; g.textAlign = 'center';
    g.strokeText('N', rx, ry + 8); g.fillText('N', rx, ry + 8);

    const wp = this.waypoint ? `  |  Waypoint ${Math.round(Math.hypot(this.waypoint.x - p.x, this.waypoint.z - p.z))} m` : '';
    this.info.textContent = (this.clock ? this.clock : '') + wp;
  }

  private drawMap(): void {
    const g = this.mapCv.getContext('2d')!, S = this.mapCv.width, k = S / (MAP_HALF * 2);
    g.clearRect(0, 0, S, S);
    g.imageSmoothingEnabled = true;
    g.drawImage(this.terrain, 0, 0, S, S);
    const w2s = (x: number, z: number): [number, number] => [(x + MAP_HALF) * k, (z + MAP_HALF) * k];
    g.font = 'bold 13px Georgia, serif'; g.textAlign = 'center';
    for (const poi of POIS) {
      const [sx, sy] = w2s(poi.x, poi.z);
      g.fillStyle = POI_COLORS[poi.kind]; g.strokeStyle = '#000'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(sx, sy - 7); g.lineTo(sx + 6, sy + 5); g.lineTo(sx - 6, sy + 5); g.closePath(); g.stroke(); g.fill();
      g.lineWidth = 4; g.strokeStyle = '#000c'; g.strokeText(poi.name, sx, sy - 11);
      g.fillStyle = '#fff'; g.fillText(poi.name, sx, sy - 11);
    }
    for (const m of this.lastMarkers) {
      const [sx, sy] = w2s(m.x, m.z);
      g.font = 'bold 18px Georgia, serif'; g.lineWidth = 4; g.strokeStyle = '#000';
      g.fillStyle = m.kind === 'give' ? '#ffe040' : '#60e060';
      g.strokeText(m.kind === 'give' ? '!' : '?', sx, sy + 6); g.fillText(m.kind === 'give' ? '!' : '?', sx, sy + 6);
    }
    if (this.waypoint) {
      const [sx, sy] = w2s(this.waypoint.x, this.waypoint.z);
      g.fillStyle = '#ff40c0'; g.strokeStyle = '#fff'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(sx, sy - 11); g.lineTo(sx + 7, sy); g.lineTo(sx, sy + 11); g.lineTo(sx - 7, sy); g.closePath(); g.stroke(); g.fill();
    }
    // player
    const p = this.lastPlayer;
    const [px, py] = w2s(p.x, p.z);
    g.save(); g.translate(px, py); g.rotate(-p.yaw);
    g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -11); g.lineTo(7, 8); g.lineTo(0, 4); g.lineTo(-7, 8); g.closePath(); g.stroke(); g.fill();
    g.restore();
  }
}
