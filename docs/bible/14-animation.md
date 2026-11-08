# 14 - Animation

Current: procedural pivots - walk cycle (swinging limbs, first-person hand/camera bob), weapon swing arcs, dragon wing flap, NPC wander. Next: a real animation system.

## Systems
- **Skeleton + clips** (glTF skinned meshes) with `AnimationMixer`, state machine, cross-fades, additive layers (aim, hit reaction), root-motion option.
- **Procedural layer** on top: head look-at, foot IK on slopes (SHOULD), weapon sway, breathing, cloth/cape secondary motion.
- **Retargeting**: one shared humanoid rig for player, NPCs; dragons get their own rig(s) per size class.

## Humanoid clip list (MUST unless noted)
idle (several), walk/run/sprint, strafe (4-dir), turn-in-place, jump (start/loop/land), fall, sneak idle/walk, swim (SHOULD), climb (Gauntlet wall), ladder (SHOULD),
melee: light attack combo x3 per weapon class, power attack, block idle/hit, bash, dodge/roll (SHOULD), stagger light/heavy, knockdown + get-up, death x3,
magic: cast left/right/both, charge loop, release, ward hold, summon,
bow: draw/hold/release, interact: open door, pick up, talk gestures (5), sit, sleep, work (hammer, sweep, read), salute, bow, mourn, cheer, drink,
mount: broom ride (idle, lean left/right), dragon ride (seated, lean, hold), mount/dismount,
Parapet: balance walk, wobble, fall.

## Dragon clip list
idle (breathing, head turn), walk, taxi, takeoff, flap cruise, glide, bank left/right, dive, climb, hover, land, roar, breath attack, tail strike per tail type, bite, hurt, die, sleep, bond reaction (Threshing), eat.

## Creatures
Wolf/boar/deer: idle, walk, run, attack, hurt, die. Wyvern: ground + air set. Venin: cast, melee, hover (?). Cat Broccoli: sit, groom, walk, run, pounce, sleep, purr (small cutscene).

## Cutscene tools (Phase 5)
Timeline of camera cuts, character clips, dialogue lines, music stingers; data-driven JSON; skip button.

## Authoring rule
Every animation clip is listed in `assets/animations.json` (name, source, licence, loop, events: footstep, hit-frame, sound). Events drive gameplay (hit-frame triggers damage, footstep triggers sound).
