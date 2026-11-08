// Downloads the CC0 PBR textures used by the game from Poly Haven (https://polyhaven.com, licence CC0) into public/textures
// and writes assets/licences.md. Usage: node scripts/fetch-assets.mjs
import fs from 'node:fs';

const TEXTURES = ['dark_planks', 'bark_brown_02', 'castle_brick_07', 'cobblestone_floor_04', 'forest_ground_04', 'rock_face_03', 'grey_roof_tiles'];
fs.mkdirSync('public/textures', { recursive: true });
fs.mkdirSync('assets', { recursive: true });

const rows = [];
for (const id of TEXTURES) {
  const meta = await (await fetch(`https://api.polyhaven.com/files/${id}`)).json();
  for (const [key, suffix] of [['Diffuse', 'diff'], ['nor_gl', 'nor']]) {
    const file = meta[key]['1k'].jpg;
    const out = `public/textures/${id}_${suffix}.jpg`;
    if (!fs.existsSync(out) || fs.statSync(out).size !== file.size) {
      const buf = Buffer.from(await (await fetch(file.url)).arrayBuffer());
      fs.writeFileSync(out, buf);
      console.log('downloaded', out, (buf.length / 1024).toFixed(0) + ' KB');
    }
  }
  rows.push(`| ${id} | https://polyhaven.com/a/${id} | CC0 | diffuse + normal (GL), 1k JPG |`);
}
fs.writeFileSync('assets/licences.md', `# Asset licences

Every external asset used by the game is listed here (source, licence, what was taken).

| Asset | Source | Licence | Files |
| --- | --- | --- | --- |
${rows.join('\n')}

Poly Haven assets are CC0 (public domain): https://polyhaven.com/license
Downloaded with \`scripts/fetch-assets.mjs\`.
`);
console.log('wrote assets/licences.md');
