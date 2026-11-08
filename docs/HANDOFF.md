# HANDOFF - read this first after /clear

Short, current-state-only file. Rewrite (don't append) it after every milestone/commit; delete anything stale.
Master plan = `TODO.md`; design = `docs/bible/`; rules = `CLAUDE.md`.

## Project in one paragraph
"Fifth Tail" (repo `5th-tail`): browser 3D action-RPG (TypeScript strict, Three.js 0.170, Vite 6) in the Fourth Wing world, Skyrim-style combat. Owner Marek (chat in Czech, code/docs in English). Priorities: environment/gameplay/models > NPCs/quests > multiplayer (deferred). Lore questions for the girlfriend go to `gf.md`; until answered, use own judgement and flag uncertain lore `(?)`.

## Where we are
- Last commit: see `git log -1` (Parapet flight fix, tower spiral stair, box-hair bug fix, random Threshing dragons).
- Done: Phase 0 (mostly), Phase 1 combat (mostly), Phase 2 in progress: PBR textures, rigged Quaternius humanoid (procedural bone animation) for player/NPCs/enemies, hair, canon NPC marks.
- Next (agreed order): (1) tune third-person weapon pose/orientation on hand bones (`player.ts` buildHuman: scale 1.05, rot x=PI+1.0, provisional) + better swing animations; (2) Phase 3 world/interiors: enter buildings, tower interior, quadrant detail; (3) M5.2.1b physical quadrant choice replacing class menu (Riders climb tower -> Parapet).
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
- Animations and sword swings could be better; wants playtest feedback loop after milestones.
- Remaining model gaps: Violet two-tone hair, Imogen half-shaved hair, gold eyes, Jesinia signing, wolves/dragon still procedural.
