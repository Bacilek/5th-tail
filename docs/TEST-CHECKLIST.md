# Playtest checklist (Marek) - since the last tested build

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
