# 16 - Technical architecture

## Decision: engine
Main path = **TypeScript + Three.js + Vite** (current). Rationale: text-only code I can write/run/test myself, automated browser tests, instant sharing. Strong stylised visuals reachable; not photoreal. A **decision gate after Phase 1** re-evaluates moving rendering to Godot 4 if the visual ceiling blocks the goal; data (`src/data`, `docs/bible`) stays engine-neutral. Unreal/Unity rejected for this workflow (GUI/binary-heavy).

## Current structure
```
src/
  engine/   input, audio, noise, saves
  world/    terrain (analytic heightfield), college, areas, collision, sky, trees
  entities/ player, npc, enemy, cat, dragon, mount, broom, walkcycle
  systems/  combat, quests, pickups, race, gauntlet, threshing, daynight
  ui/       hud, panels, minimap
  data/     classes, items, dragons, npcs, quests, look, pois
```

## Needed architecture upgrades
1. **Game loop and state**: split `main.ts` (large) into modules: `Game`, `World`, `Systems` registry, per-player `PlayerContext` (for splitscreen). Replace ad-hoc globals with a small ECS or entity registry.
2. **Terrain**: keep analytic height function but add chunked meshes + LOD, biome/splat masks, rivers/roads (splines), caves via separate interiors. Use a spatial hash for collisions and queries; replace the O(n) `boxes` scan.
3. **Collision/physics**: current custom 2.5D boxes/circles. Next: capsule character controller with step-up and slopes, swept movement, trigger volumes. Consider Rapier (WASM) for rigid bodies/ragdolls (SHOULD) while keeping the heightfield analytic.
4. **World streaming**: grid cells (e.g. 128 m), load/unload props, NPCs and enemies by distance, async glTF loading, object pools, impostors for distant buildings/trees, instancing everywhere.
5. **Interiors**: portal/cell system (instant swap) for large buildings; keep exterior shell for distance.
6. **Navigation**: heightfield nav grid + A*, then navmesh for interiors; avoidance for crowds.
7. **Save system**: JSON save slot per character: player stats, inventory, quest states, world flags, time, discovered map, dragon state, positions. Versioned schema + migrations; `localStorage`/IndexedDB in browser, files in desktop app.
8. **Data pipeline**: JSON/TS data with schema validation (zod or custom) run in `npm run check`.
9. **Rendering**: post-processing chain (bloom, SSAO, tone mapping, colour grade), PBR, cascaded shadows, instanced vegetation with wind shader, water shader, volumetric fog approximation, particle system (GPU points).
10. **Audio**: manager with buses, spatial emitters (see 12).
11. **Debug tools**: console commands (`teleport`, `setHour`, `give`, `startQuest`), FPS/draw-call overlay, collision debug view, free camera.
12. **Testing**: Playwright smoke/regression tests with screenshots and console error assertions; unit tests (Vitest) for quest logic, save/load, collision math; deterministic seeded randomness for tests.

## Performance targets
60 FPS 1080p on integrated/mid GPU at Medium; load < 10 s; memory < 1.5 GB. Profiling via `renderer.info`, Chrome performance traces in CI.

## Build and tooling
Vite + TS strict; ESLint/Prettier (to add); `npm run check` = typecheck + lint + unit tests + smoke test. Git workflow: small commits per TODO step; tags per milestone.

## Risk list
Large-world precision, browser memory limits, shader compile hitches, asset pipeline sizes (GLB budgets), WebGL differences across GPUs. Mitigation: streaming, compression, quality presets, test on multiple machines.

## Decisions (hardware)
Primary test device: Ryzen 7 7735HS / Radeon 680M. All performance targets in this file refer to that class of machine at 1080p Medium. The Low preset must hold 60 FPS in the open areas and 30 FPS in split-screen. Profile on that machine (Marek reports FPS via the F3 overlay).
