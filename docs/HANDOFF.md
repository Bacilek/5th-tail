# HANDOFF - read this first after /clear

Short, current-state-only file. Rewrite (don't append) it after every milestone/commit; delete anything stale.
Master plan = `TODO.md`; design = `docs/bible/`; rules = `CLAUDE.md`.

## Project in one paragraph
"Fifth Tail" (repo `5th-tail`): browser 3D action-RPG (TypeScript strict, Three.js 0.170, Vite 6) in the Fourth Wing world, Skyrim-style combat. Owner Marek (chat in Czech, code/docs in English). Priorities: environment/gameplay/models > NPCs/quests > multiplayer (deferred). Lore questions for the girlfriend go to `gf.md`; until answered, use own judgement and flag uncertain lore `(?)`.

## Where we are
- Last commit: see `git log -1` (Parapet flight fix, tower spiral stair, box-hair bug fix, random Threshing dragons).
- Done: Phase 0 (mostly), Phase 1 combat (mostly), Phase 2 in progress: PBR textures, rigged Quaternius humanoid (procedural bone animation) for player/NPCs/enemies, hair, canon NPC marks.
- Arm rig convention (humanoid.ts pose()): bone rot() = rotation about MODEL axes in the parent's rest frame. Upper arm: rz drops the T-pose arm (+1.5 left, -1.5 right), ry swings it forward (right +, left -); rx is only a twist. Lowerarm ry = elbow, hand ry = wrist pitch. Held blade angle is driven by target angle th (BLOCK/SWING consts). Swing/block verified in side+front screenshots with `scripts/pose-test.mjs` (state JSON arg); weapon rest pose x=2.14 on tpMount (`scripts/weapon-side.mjs`).
- Tower (college.ts): hollow shell with a south door (TOWER_DOOR in terrain.ts), ground-floor guardroom with ceiling disc/torches/table; wall collider = ring of small circles with a door gap; top platform = 8x8 box slab with finite bottom (support only). Terrain no longer returns TOWER.top inside the tower (the Parapet strip starts at x=43, which is why the door is south, not east). Landing bridge has finite bottom so the stair passes under it; `stairBlocked` (terrain.ts) blocks walking into steps >0.55 above the feet. Scripts: `stair-walk.mjs`, `tower-door.mjs` (slow under software GL).
- Next (agreed order): (1) playtest feedback on swing/block/stair; (2) Phase 3 world/interiors: more enterable buildings (halls already enterable via hall()), quadrant detail, M3.2.2 interiors; (3) M5.2.1b physical quadrant choice replacing class menu (Riders climb tower -> Parapet).
- Halls (`hall()` in college.ts) now have rug, sconces, back-wall banner, pillars (w or d >= 20) and a real point light only if area >= 300; `scripts/hall-shot.mjs x z yaw` screenshots inside.
- Gauntlet is now a vertical course (gauntlet.ts): hurdles, sweeper, 8 ledges, beam under 2 pendulums, barrier wall + drop. Player test list: `docs/TEST-CHECKLIST.md` (keep it updated per milestone).
- Flight Field extras live in `src/world/field.ts` (class FlightField, updated each frame in main.ts): Aeries (6 dens + sleeping dragons), Vale hatching ring with eggs, poles, review stand, landing ring. Dens deliberately have no PointLights (perf).
- Chantara (areas.ts buildVillage): smithy (forge()), market clutter, notice board; renamed from "Basgiath Village". Test list is `docs/TEST-CHECKLIST.md` (newest round on top; Marek tests after a few milestones; keep adding items).
- Quadrant landmarks live in `src/world/quadrants.ts` (buildQuadrantDetails: garden/morgue, sparring ring/armoury, torture chamber/survival course, vault/reading court). All purely decorative so far (no quests/AI attached; labels only).
- Perf (Marek saw 30-40 FPS): measured with `scripts/perf-calls.mjs` (draw calls/tris per spot, `?nomerge` for comparison). Biggest cost was ~35 rigged humanoids (~22k tris each, x2 shadow) -> distance culling in npc.ts/enemy.ts; static world groups merged per 40 m cell (`engine/merge.ts`, not the field group: it has animated dragons); PointLights are pooled (DayNight keeps 4 real lights following the nearest lamps). Next ideas: LOD/cheaper humanoid for mid range (dress() doubles body tris), shadow map update every 2nd frame, chunked terrain (M3.1.1).
- Night: moon/hemi raised, `settings.noNight`, key Z, pause menu button.
- Open `[~]` items are listed in TODO.md (grep `\[~\]`).

## Key facts that are not obvious from code
- Collision: AABB `boxes` (linear scan, `bottom/top`), circles in grid, `heightAt` includes Parapet; fliers (broom/mount) use `baseHeight` (no Parapet) + `supportAt`. Tower stair is analytic (`towerStairAt` in terrain.ts, hooked into `supportAt`).
- Humanoid: `src/entities/humanoid.ts`; player box avatar is hidden once the model is built (don't re-show box hair in `applyLook`).
- Debug hook `window.__game` (teleport, give, spawnEnemy, demoHumanoid(st,female,look), camera, towerStairAt, TOWER, saveGame...). Test scripts in `scripts/` (headless Chrome via playwright-core, software GL ~3-4 FPS so waits are long): smoke, walk, fly, save, combat, model-test, look-test, look-front, tower-test. Screenshots to `docs/shots/`.
- Run: `npm run build` must pass before commit; `node scripts/<x>.mjs` runs vite preview itself (needs a build first).
- Windows: no python; use Write/Edit tools or sed for edits; avoid complex bash heredoc quoting in `node -e`.
- Hardware target: Ryzen 7 7735HS + Radeon 680M, stable 60 FPS at Medium (user-reported). F3 = perf overlay.
- Decisions: English default, CZ second; difficulty in menu, no permadeath; TTS pipeline built by Claude later; CC0 assets OK (log in assets/licences.md); Electron for desktop; two players = shared world.

## Workflow after each milestone
1. `npm run build` + relevant test script, 2. tick TODO.md, 3. rewrite this file (current state only), 4. commit + push (trailer in CLAUDE.md), 5. short Czech summary to Marek.

## Pending feedback / ideas from Marek (clear when done)
- Perf report: ~50 FPS, worst frame 40 ms (before halls got lights): watch light count, consider cell streaming (M3.1.2). Gauntlet should become more complex later (books: big vertical course); deadline timer + more obstacles pending.
- Spell charge (SPELL_CHARGE in player.ts) and slower swings (dur/cooldown in player.ts attack/update) are new: tune from feedback.
- Animations and sword swings could be better; wants playtest feedback loop after milestones.
- Remaining model gaps: Violet two-tone hair, Imogen half-shaved hair, gold eyes, Jesinia signing, wolves/dragon still procedural.
