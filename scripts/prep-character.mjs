// Prepares the Quaternius "Universal Base Characters" (CC0) for the game: copies the glTF + bin, downsizes the big PNG
// textures to 1024px JPEGs with headless Chrome and rewrites the glTF image URIs. Output: public/models/*.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'assets/incoming/ubc/Universal Base Characters[Standard]';
const BASE = `${ROOT}/Base Characters`;
const OUT = 'public/models';
fs.mkdirSync(OUT, { recursive: true });
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');

async function toJpg(srcPath, outPath, size = 1024, quality = 0.88) {
  const b64 = fs.readFileSync(srcPath).toString('base64');
  const data = await page.evaluate(async ([b64, size, quality]) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const s = Math.min(size, img.width);
    const c = document.createElement('canvas'); c.width = s; c.height = Math.round(img.height * s / img.width);
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality).split(',')[1];
  }, [b64, size, quality]);
  fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
}

// body texture overrides: use the LIGHT base colour so the skin tone tint can darken it
const overrides = {
  'Superhero_Male_FullBody': { 'T_Superhero_Male_Dark.png': `${BASE}/Textures/T_Superhero_Male_Ligh.png` },
  'Superhero_Female_FullBody': { 'T_Superhero_Female_Dark_BaseColor.png': `${BASE}/Textures/T_Superhero_Female_Light_BaseColor.png` },
};

for (const name of ['Superhero_Male_FullBody', 'Superhero_Female_FullBody']) {
  const dir = `${BASE}/Godot - UE`;
  const gltf = JSON.parse(fs.readFileSync(`${dir}/${name}.gltf`, 'utf8'));
  fs.copyFileSync(`${dir}/${name}.bin`, `${OUT}/${name}.bin`);
  for (const img of gltf.images ?? []) {
    const uri = decodeURIComponent(img.uri);
    let src = overrides[name][uri] ?? `${dir}/${uri}`;
    if (!fs.existsSync(src)) src = src.replace('_png.png', '.png');
    const jpg = path.basename(uri).replace(/\.png$/i, '') + '.jpg';
    const small = /Eye/i.test(uri);
    if (small) { fs.copyFileSync(src, `${OUT}/${path.basename(uri)}`); continue; }
    await toJpg(src, `${OUT}/${jpg}`, /Normal|Roughness/i.test(uri) ? 1024 : 1024);
    img.uri = jpg;
    delete img.mimeType;
  }
  fs.writeFileSync(`${OUT}/${name}.gltf`, JSON.stringify(gltf));
  console.log('prepared', name, (fs.readdirSync(OUT).reduce((a, f) => a + fs.statSync(`${OUT}/${f}`).size, 0) / 1e6).toFixed(1) + ' MB total');
}
await browser.close();
