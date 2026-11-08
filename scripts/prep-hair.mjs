// Copies the CC0 hairstyle meshes (Quaternius) into public/models and points their textures at the downsized JPGs made by prep-character.mjs.
import fs from 'node:fs';
const SRC = 'assets/incoming/ubc/Universal Base Characters[Standard]/Hairstyles/Origin at 0/glTF (Godot)';
const MAP = {
  'T_Hair_1_BaseColor.png': 'T_Hair_1_BaseColor.jpg', 'T_Hair_1_Normal.png': 'T_Hair_1_Normal_png.jpg',
  'T_Hair_2_BaseColor.png': 'T_Hair_2_BaseColor.jpg', 'T_Hair_2_Normal.png': 'T_Hair_2_Normal.jpg',
};
for (const n of ['Hair_SimpleParted', 'Hair_Long', 'Hair_Buns', 'Hair_Buzzed', 'Hair_BuzzedFemale', 'Hair_Beard']) {
  const g = JSON.parse(fs.readFileSync(`${SRC}/${n}.gltf`, 'utf8'));
  for (const img of g.images ?? []) { const u = decodeURIComponent(img.uri); img.uri = MAP[u] ?? u; delete img.mimeType; }
  fs.writeFileSync(`public/models/${n}.gltf`, JSON.stringify(g));
  fs.copyFileSync(`${SRC}/${n}.bin`, `public/models/${n}.bin`);
  console.log('hair', n);
}
