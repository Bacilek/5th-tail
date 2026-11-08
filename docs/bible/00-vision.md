# 00 - Vision

> Private fan project for two players (Marek + partner). Not for distribution. No text from the books is copied; all dialogue and quest text is original (`(invented)` unless noted). Lore facts are paraphrased from fan wikis and flagged `(?)` when uncertain.

## One-sentence pitch
A big first/third-person fantasy action-RPG set in Navarre and Basgiath War College (Fourth Wing / Empyrean), played with Skyrim-style combat (two hands, weapons + spells, health/magicka/stamina), where bonding a dragon replaces Shouts.

## Pillars
1. **Be there.** Walking through Basgiath, crossing the Parapet, standing on the Flight Field should feel like the books: scale, danger, weather, wind, dragons overhead.
2. **Skyrim hands.** Each hand holds a weapon or spell. Moment-to-moment combat feels weighty: power attacks, blocking, bashing, staggering, sneaking, dual-casting.
3. **The bond.** Your dragon is a companion, a mount, a weapon and a character. Species differ, rarity matters, the Threshing is a real event.
4. **A living college and world.** NPCs have routines, opinions, and reactions. Quadrants feel like different places with different culture.
5. **Sandbox first, story second.** The world is fun to just exist in (broom, dragon, exploring); quests give structure. Story follows the books' timeline in parallel, you are not Violet.
6. **Two players.** Split-screen / co-op later, but every system is built per-player-instance.

## What this game is NOT
- Not a retelling of the books' text; not a visual novel.
- Not photoreal AAA. Target: attractive stylised world with strong lighting and animation.
- Not a MMO. Not competitive.
- No Harry Potter dragons (only Fourth Wing species). The broom is the only HP element.

## Priority scale (used across all docs)
- **MUST** - the game is not the game without it.
- **SHOULD** - makes it feel finished; do after MUSTs of the same phase.
- **DREAM** - the perfect version; only if time and quality allow.

## Player fantasy by class
| Class | Fantasy | Core loop |
| --- | --- | --- |
| Rider | Cross the Parapet, bond a dragon, signet magic, fly | exploration + dragon combat + wing politics |
| Infantry | Border soldier: line, discipline, martial skill | melee/ranged combat, endurance, formations |
| Healer | Keep people alive; alchemy, restoration | support, crafting, rescue missions |
| Scribe | Knowledge, archives, secrets | investigation, lore, stealth, ward-reading |

Only Riders have magic via signets (lore). Others can still use items/relics (DREAM).

## Definition of "done" for any step
1. Builds (`npm run build`) and the automated smoke test passes (once it exists).
2. Does what the TODO acceptance line says, verified in a real browser run (screenshot or log).
3. Content is data-driven (src/data), no magic numbers hidden in logic.
4. Docs updated (bible + TODO checkbox), committed and pushed.

## Scope honesty
Real AAA is hundreds of people for years. The goal is the best possible two-person-playable, large, deep, stylised game, improved in layers so that after every milestone the game is playable.

## Decisions (answered by Marek, applied)
- **Title:** displayed as **Fifth Tail** (repo and package name stay `5th-tail`).
- **Tone:** darker, in the spirit of Hogwarts Legacy: gothic, atmospheric, adult-leaning without gore. Achieved with colour, fog, light and music rather than expensive effects (see 13).
- **Difficulty:** selectable in the menu (damage dealt/taken, stamina, enemy aggression). **No permadeath, ever.** The Parapet respawns the player at the tower.
- **Relationships:** light friendship/romance hooks are welcome (tasteful, optional).
- **Language:** English by default, Czech as a second localization.
- **Players:** two players share one world, each with an own character, quest log and inventory (simplest to build and makes sense for co-op).
- **Playtests:** after every milestone, short notes in `docs/playtests/`.
