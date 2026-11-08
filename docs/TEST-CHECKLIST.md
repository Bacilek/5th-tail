# Playtest checklist (Marek) - since the last tested build

## Round 6 changes: night, labels, perf (NEW, check first)
- [ ] Night is readable (moonlit blue, lamps still glow). Set the clock with `__game.setHour(0)` to test fast.
- [ ] **Z** = rest until morning (only works at night, otherwise "You are not tired"); pause menu has "Rest until morning"; Settings has "Skip the night (always daytime)" (persists).
- [ ] No label sits inside a roof any more (Morgue, Armoury, Barracks, Vault, Torture Chamber, Smithy, Inn, Gauntlet); long labels (e.g. "West tunnel: Scribes & Archives", "Rider Survival Course", "The Vault (restricted)") are no longer cut off at the start. Any label still hidden? note where: ______
- [ ] Torture Chamber is now enterable (door on the WEST side, reach it along the Citadel west wall from the Parapet landing).
- [ ] Rider Survival Course moved to the open yard south of the Parapet road (x 107-121, z -12..-6): balance beam, 3 hurdles, ROPE WALL at the east end with a banner at the west end; label above.
- [ ] FPS: static buildings are merged and far NPCs/enemies are hidden (NPCs hide beyond 85 m, enemies beyond 110 m; far ones are not re-posed). Compare with before: college ___ village ___ citadel ___ scribes ___ (before: 30-40). Add `?nomerge` to the URL to compare without merging.
- [ ] Nothing broke: building colliders, textures on walls/roofs, lamps still light up near you (only the 4 nearest lamps are real lights now; lamps farther away glow only via their flame mesh), NPCs reappear when you walk up to them.

## Round 5 changes: quadrant landmarks
- [ ] Healers (south): Infirmary label, herb garden with fountain and 6 flower beds (beds/fountain collide), Morgue room west of the garden with stone slabs and a shrouded body.
- [ ] Infantry (north): Sparring Ring (sand disc + rope posts) south of the parade ground, Armoury (weapon racks, armour stands) in front of the barracks, Barracks label.
- [ ] Riders (Citadel): Torture Chamber (dark cell: table, rack, hanging chains, red glow) north of the hall; Rider Survival Course east of the dorm (balance beam, 3 hurdles, rope wall) - check you can reach it and not get stuck.
- [ ] Scribes (west, sunken): The Vault (iron grille + gold lock) behind the Archives, Reading Court with 6 desks, benches, lamps and books; labels readable.
- [ ] No building overlaps another (walls/halls clip) and no spots where you get stuck in the alleys between them.
- [ ] FPS in each quadrant (F3): healers ___ infantry ___ riders ___ scribes ___

## Round 4 changes: Chantara village
- [ ] Village (south-west) is now called **Chantara** everywhere (label, map POI, quest text).
- [ ] Smithy at the north side: hearth with glowing coals + flame, anvil, trough, weapon rack; you can walk in, furniture collides.
- [ ] Market: stalls with goods, crates, barrels, sacks, cart, notice board with notes; you can walk between them without getting stuck.
- [ ] Inn (Hesper) and the village quests (Tavik) still work.
- [ ] FPS in the village (F3): ______

## Round 3 changes: Flight Field
- [ ] Gauntlet exit -> Flight Field: review stand (red awning), 4 tall flight poles with pennants, pale landing ring in the middle.
- [ ] The Aeries along the east cliff: 6 stone dens, each with a sleeping dragon of a different colour (brown, orange, red, green, blue, black), torches, labels.
- [ ] Walk into a den: you can enter between the pillars, the walls and pillars block you, dragon is breathing/moving slightly.
- [ ] The Vale hatching ground (north-west corner): stone ring, 7 glowing eggs on straw nests; walls/eggs collide.
- [ ] Threshing (Rider path) still works on the field and its dragons do not clip into the dens.
- [ ] FPS on the field (F3): note numbers here -> ______ (a few new lights: Vale + big halls).

## Round 2 changes (check these too)
- [ ] Melee swings are slower with a longer cooldown (dagger/sword/greatsword feel weighty, not sluggish).
- [ ] Spells: hold LMB/RMB to charge (hand rises), release to cast; short taps below 30% charge fizzle; full charge = 2x damage of a snap cast.
- [ ] Character creator shows a live rotating 3D model (gender/hair/beard/outfit update it).
- [ ] Tower top: no flickering/z-fighting texture on the platform.
- [ ] Halls/Administration: floor no longer flickers when turning; no pillar in front of the General.
- [ ] Hall roofs sit centred on the building and are aligned with its walls (all quadrants).
- [ ] Gauntlet beam is wide (2.6 m); the iron balls only shove lightly (no longer knock you off).


Run `npm run dev`, create a character, pick a quadrant. Debug: `window.__game` in the browser console (teleport(x,z), spawnEnemy...).

## Combat / animation (3rd person, V toggles)
- [ ] Sword swing (LMB/RMB): wind-up over the head, strike forward, blade does not pass through the body.
- [ ] Power attack (hold RMB) looks heavier than a normal swing.
- [ ] Block (X / MMB): arms in front of the chest, blades pointing up, no T-pose spread.
- [ ] Equipped weapons/spells in both hands point forward-up (not backwards).
- [ ] Walk/run arm swing looks natural; riding pose (broom/dragon) not broken.

## Character creator
- [ ] With a saved character, creating a new one must NOT recolour the first saved tile (only the big preview changes).

## Conscription Tower
- [ ] Spiral stair: walk up from the bottom, past the west side of each turn, to the top without getting stuck.
- [ ] You cannot walk through steps from the side or from below.
- [ ] Tower is round (collision matches visuals), also the corner turrets of the college.
- [ ] South door: walk in, guardroom with torches/table; as Rider you spawn on top and stand on the platform.

## Halls (Administration, barracks, archives, Citadel hall)
- [ ] Rug, sconces, banner on the back wall, pillars in big halls; you can walk around the pillars.
- [ ] Big halls are lit; frame rate still OK (F3).

## Gauntlet (Citadel east gate -> Flight Field), NEW layout
- [ ] Two hurdles, then the spinning bar (jump it).
- [ ] 8 zig-zag ledges up to +8 m (each +1 m, hop sideways), no stuck points.
- [ ] Beam walk at +8 m under two swinging iron balls (knockback = fall into the pit, not death).
- [ ] You cannot bypass the climb on the ground (barrier wall at the end of the pit).
- [ ] Drop off the far wall, walk to the end arch: "Gauntlet complete" + time; quest `Through the Gauntlet` ticks.
- [ ] Timer starts at the first hurdles, not when you stand in the corridor above.
