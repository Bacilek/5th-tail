# Design
- Camera: 1st person default, toggle to 3rd (zoom out).
- Hands: left/right slots; each holds weapon (sword, dagger), spell, or empty. Mouse L/R (gamepad LT/RT).
- Bars: Health, Magicka (spells, dragon abilities), Stamina (sprint, melee, block).
- Dragon bond replaces Skyrim Shouts: each species has own attack/utility ability, mountable flight, summoned via bond. Signet = player's personal power (chosen at creation).
- Classes (from lore quadrants): Rider, Scribe, Healer, Infantry.
- Companion: cat Broccoli.
- Intro: cross the Parapet (narrow span over a ravine) -> sorting into a wing.
- Broom (optional, ask): HP-style flight, hoops/race; shares flight controller with dragons.
- Bonus: split-screen, face photo -> head texture.

## NPCs and quests (milestone 3)
- Data-driven: `src/data/npcs.ts`, `src/data/quests.ts`. Quest types: kill, collect (pickups in `src/systems/pickups.ts`), reach (fly dragon to the Conscription Tower). Invented NPCs are marked "(invented)".
- F talks / adopts the cat; J opens the quest log; dialog choices via 1-3. Broccoli is a stray (canon owner uncertain, see lore.md).
