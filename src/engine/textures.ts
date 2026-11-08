import * as THREE from 'three';

const loader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();

/** Loads (and caches) a texture from public/textures. Diffuse maps are sRGB, normal maps linear. */
export function tex(name: string, srgb = true): THREE.Texture {
  const hit = cache.get(name);
  if (hit) return hit;
  const t = loader.load(`./textures/${name}.jpg`);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  cache.set(name, t);
  return t;
}

/** PBR material from a downloaded CC0 texture set (id_diff.jpg + id_nor.jpg), tinted. */
export function pbr(id: string, tint = 0xffffff, roughness = 0.95): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ map: tex(`${id}_diff`), normalMap: tex(`${id}_nor`, false), color: tint, roughness });
}

/** Scales a BoxGeometry's UVs so the texture tiles every `tile` metres on every face (no stretching). */
export function tileBoxUV(geo: THREE.BoxGeometry, w: number, h: number, d: number, tile = 4): void {
  const uv = geo.attributes.uv;
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * (dims[f][0] / tile), uv.getY(i) * (dims[f][1] / tile));
    }
  }
  uv.needsUpdate = true;
}

/** PBR material whose textures repeat (rx, ry) times over the UV range (for cones/cylinders such as roofs and trunks). */
export function pbrRepeat(id: string, tint: number, rx: number, ry: number, roughness = 0.9): THREE.MeshStandardMaterial {
  // separate texture objects (not clones): each loads its own image so the upload is triggered correctly
  const mk = (name: string, srgb: boolean) => {
    const t = loader.load(`./textures/${name}.jpg`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.anisotropy = 4;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return new THREE.MeshStandardMaterial({ map: mk(`${id}_diff`, true), normalMap: mk(`${id}_nor`, false), color: tint, roughness });
}
