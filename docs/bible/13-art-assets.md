# 13 - Art, assets and visuals

## Direction
Stylised, moody, readable. Think "painterly low-poly with strong lighting": flat-shaded or lightly textured meshes, rich colour grading, fog, god rays, torch glow. Not photoreal. Palette: slate stone, deep navy, ember orange, wing-colour accents (Riders red, Infantry brown, Healers green, Scribes violet).

Everything visual is behind factory functions (`src/entities/*`, `src/world/*`) so procedural geometry can be swapped for glTF models without touching gameplay.

## Asset pipeline (to build in Phase 2)
1. `assets/` folder with `models/`, `textures/`, `audio/`, `licences.md` (every external asset logged: source URL, licence, date).
2. glTF/GLB loader with caching, instancing, LOD, Draco/meshopt compression, KTX2 textures.
3. Asset manifest JSON referenced from data files (`modelId`).
4. Build step: validate sizes, generate icon sizes, atlas packing (optional).

## Asset sources (in order of preference)
| Source | Use | Notes |
| --- | --- | --- |
| Procedural (current) | blockout, props, terrain, foliage | zero licence risk |
| CC0 packs (Quaternius, Kenney, Poly Haven, ambientCG) | characters, buildings, props, textures, HDRI | download only with user approval; record licence |
| Blender headless scripts (bpy) | custom dragons, architecture, weapons | I write the Python; reproducible |
| User-provided | Mixamo animations, hand-made models, music, photo for face | optional |
| AI/3D generators | concept art, textures | only if user supplies output; licence caution |

## Model plan (checklist by category)
- **Characters**: base humanoid (male/female/neutral), hair set, uniforms per quadrant, armour sets, civilians, officers, key NPC unique meshes.
- **Dragons**: base mesh with morph/parameter variation; every tail type (dagger, sword, club, morningstar, scorpion, feather), size classes; wings animated; scales material; hatchling.
- **Creatures**: Venin, wyvern, wolf, deer, boar, birds, cat Broccoli.
- **Architecture**: Basgiath walls/towers/gatehouses, quadrant halls, Archives interior, mess hall, barracks, infirmary, forge, aeries/caves, Gauntlet obstacles, Parapet tower, village houses, inn, city districts (Aretia, Samara), border fortresses, ruins.
- **Props**: furniture, books, scrolls, bottles, weapons racks, banners, torches, crates, carts, tents, anvils.
- **Weapons/armour**: dagger, sword, axe, mace, two-hander, spear, bow, shields, helmets, cloaks.
- **Vegetation**: pines, birch, shrubs, grass cards, flowers, herbs (pickups), rocks, cliffs, snow.
- **Sky/FX**: clouds, volumetric-ish fog, rain, snow, embers, magic VFX per signet, dragon fire, wind streaks.

## Rendering upgrades (Phase 2, SHOULD)
PBR materials, tone mapping + colour grading LUT, bloom for torches/spells, SSAO, soft shadows with cascades, water shader, terrain splat textures + triplanar rocks, wind-animated grass/trees, light probes for interiors, vignette/dirt on lens, depth of field in dialogue (DREAM).

## Performance budgets
Draw calls < 1500, triangles < 2 M visible, 60 FPS on mid laptop GPU; 30 FPS floor in splitscreen. Quality presets: Low/Med/High/Ultra (shadow res, view distance, vegetation density).

## Icon / branding
App icon: stylised dragon scale or five-tail motif (name "5th Tail" is working title - open question). Sizes 16-512 px, `.ico` + `.icns` + PNG. Logo lockup and splash screen. See 17-packaging-release.

## Credits
Maintain `CREDITS.md` generated from `assets/licences.md`.
