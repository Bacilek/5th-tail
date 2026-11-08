# Playtest checklist (Marek) - since the last tested build

## Round 3 changes: Flight Field (NEW, check first)
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
