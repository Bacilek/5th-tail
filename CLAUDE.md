# 5th Tail

Browser 3D action-RPG for two players (Marek + partner): **Skyrim gameplay** (1st/3rd person toggle, two hands with weapon/spell each, health/magicka/stamina) in the **Fourth Wing / Empyrean** world (Navarre, Basgiath War College, dragon bonds) with a little Harry Potter flavor (broom flight only – NO HP dragons; all dragons and terminology strictly from Fourth Wing). Language of chat with the user: Czech. Code/docs: English.

## Priorities
environment/gameplay/visible models > NPCs/quests > multiplayer. Story is irrelevant for now.
Always build a small playable vertical slice first, then iterate per milestone.

## Stack
TypeScript + Three.js + Vite (+ Rapier physics later). No external model downloads: procedural low-poly geometry behind factory functions (`src/entities/*`, `src/world/*`) so visuals can be upgraded later (materials/glTF/post-processing are isolated).

## Commands
- `npm run dev` – dev server
- `npm run build` – typecheck + production build (must pass before commit)

## Rules
- Commit + push (`origin main`) after each milestone/meaningful change. Commit trailer: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Player code is instance-based (player index 0/1) – split-screen and gamepad must stay possible.
- Content is data-driven (`src/data/`): dragons, NPCs, quests, items.
- Lore: `docs/lore.md` (flag uncertain facts). Design: `docs/design.md`. Milestones: `docs/roadmap.md`.
- Ask the user yes/no questions when a design decision is theirs.

## Master plan
- `TODO.md` = phases -> milestones -> small steps (checkboxes). Do one step at a time, one commit per step, tick the checkbox, push.
- `docs/bible/` = full design bible (lore, world, characters, quests, combat, audio, art, UI, tech, packaging, QA). Unknown lore goes to `docs/bible/99-open-questions.md`.
- Phase 0 first: nothing has been verified in a real browser run yet.

## Session handoff (survives /clear)
- FIRST read `docs/HANDOFF.md` (current state, next steps, non-obvious facts), then the relevant TODO.md section.
- After every milestone/commit: rewrite `docs/HANDOFF.md` to current state only (remove stale items), tick TODO.md, commit + push. The user may /clear at any time between milestones, so never leave needed context only in chat.
