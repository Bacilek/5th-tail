# 09 - Combat (Skyrim-style)

Targets the *feel* of Skyrim combat: first/third-person, two independent hands, resource bars, readable hits, weighty swings. All numbers are starting values to be tuned in playtests.

## Controls (keyboard + gamepad)
| Action | Keyboard/mouse | Gamepad |
| --- | --- | --- |
| Left hand attack/cast | LMB | LT |
| Right hand attack/cast | RMB | RT |
| Block (hold, with item in a hand) | hold same button with a shield/weapon | LT/RT hold |
| Power attack | hold attack button | hold trigger |
| Dual cast | hold both | hold both |
| Sprint / sneak / jump | Shift / C / Space | LS click / RS click / A |
| Cycle items | Q / E (+ favourites wheel later) | D-pad / LB-RB |
| Interact | F | X |
| Summon / mount dragon, broom | R / F, B | menu radial |
| Camera | V toggle 1st/3rd | RS click |

## Resources
- **Health** - regen slow out of combat. **Magicka** - spells, dragon breath; regen delayed after use. **Stamina** - sprint, jump, melee, blocking, power attacks.
- Class baselines already in `src/data/classes.ts`.
- Armour rating reduces damage with diminishing returns; resistances later.

## Melee (MUST)
- Light attack: 1 stamina cost, short cooldown. Power attack: hold 0.6 s, 2x damage, 2.5x stamina, can stagger.
- **Block**: reduces damage by weapon/shield rating; perfect-timing block (first 0.2 s) staggers attacker (SHOULD).
- **Bash**: shove with shield/weapon while blocking; staggers, interrupts casting.
- **Stagger** states: light stagger (flinch), heavy stagger (knock back), knockdown (power attack + low armour).
- Hit reactions with directional hit-stop (50 ms) and camera shake; weapon trails; blood/dust particles; audio per material.
- Weapon classes: dagger (fast, sneak x3), sword (balanced), axe (bleed), mace (armour pen), two-hander (slow, big stagger), spear/polearm (reach), bow/crossbow (draw time, headshots), thrown knives (SHOULD).
- Sneak attacks, backstabs, silent kills, detection model (light level, noise, line of sight) - SHOULD.

## Magic (signets, MUST for Riders)
- Spell is a "signet expression": lightning, fire, shadow, wind, retrieval, wards, etc. (see 08-dragons-signets). Gameplay shapes: hitscan bolt, projectile, charged beam, AoE blast, ward/shield, utility (pull/push), summon.
- Cast modes like Skyrim: fire-and-forget, concentration, charge, ward (hold to block magic).
- Dual casting - hold both hands, stronger, more costly.
- Each signet expression has cooldown/cost and a clear VFX/SFX identity.

## Dragon combat (MUST)
- On dragon: left = breath/flame, right = tail strike by tail type, bite/claw (SHOULD), wingbeat gust, dive attack, evasive roll.
- Dragon health pool and damage states; downed dragons can be revived by rider (SHOULD).
- Ground rider + dragon support: command (attack target, hold position, circle) via radial menu (SHOULD).

## Enemy roster (grows per phase)
| Enemy | Role | Notes |
| --- | --- | --- |
| Venin | caster/melee hybrid | dark robes, red-ish eyes, wards drain |
| Wyvern | air/ground brute | poison tail (?), flying packs |
| Soldiers/Tyrrish rebels | human melee/ranged | formations, flanking |
| Wild beasts | wolves, bears, boars | territory behaviour |
| Training dummies/opponents | non-lethal duels | challenge matches, Gauntlet |
| Bosses | named commanders, giant wyvern | phases, telegraphed attacks |

## AI (MUST basic, SHOULD advanced)
States: idle, patrol, alert, search, chase, attack, retreat, flee, flank, stagger, dead. Groups share alert; archers keep distance; casters avoid melee; leader/follower. Navigation on the heightfield + obstacle avoidance (grid nav) then navmesh for interiors.

## Balance rules
- Time-to-kill for player vs. average enemy: 8-15 s; enemy vs. player (average gear): 15-25 s.
- No unavoidable one-shots outside the Parapet fall.
- Difficulty slider: damage dealt/taken multipliers.

## Feel checklist (testable)
Attack windup/active/recovery frames; sound on swing and on hit; camera kick; stagger feels responsive; stamina exhaust is visible; every cast has anticipation + release; bars flash when empty.

## Implemented in prototype (Phase 1, first pass)
- Melee: tap = light attack (on release), **hold >= 0.5 s = power attack** (x2 damage, 2.4x stamina, stagger + knockback). Held-hand windup pose.
- **Block**: hold `X` or middle mouse with a melee item: frontal hits cost stamina (0.9 x damage) and deal 15%; **perfect block** (first 0.3 s) = no damage and staggers the attacker; out of stamina = guard break.
- **Bash**: attack button while blocking: short cone, small damage, long stagger, 8 m/s knockback.
- Hit feedback: hit-stop (40-90 ms slow-mo), camera shake, enemy flinch and knockback.
- Enemies telegraph (0.55 s warm glow) before swinging; a stagger cancels the attack.
- Test: `node scripts/combat.mjs`.
Next: shields, weapon classes, enemy roles/groups, ranged enemies, boss framework.
